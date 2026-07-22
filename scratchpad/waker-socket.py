#!/usr/bin/env python3
"""Socket-based herdr pane monitor (daemon).

Subscribes to `pane.agent_status_changed` events for one or more panes over the
herdr unix socket ($HERDR_SOCKET_PATH) and reacts INSTANTLY (push-based, ~1s)
instead of polling. Falls back to periodic `herdr pane get` every 60s in case an
event is missed.

Usage:
  waker-socket.py PANE:LABEL [PANE:LABEL ...]

State files (polled by the orchestrator between turns):
  /tmp/banfe-<label-lower>-state.log   — append-only status log
  /tmp/banfe-<label-lower>-notify.flag — set to "<status> at <ts>" on blocked/done/idle; cleared on working
  /tmp/banfe-waker-socket.out          — this daemon's own stdout/stderr

Stop: touch /tmp/banfe-waker.stop  (or kill the PID in /tmp/banfe-waker-socket.pid)
"""
import json
import os
import socket
import subprocess
import sys
import time
from pathlib import Path

STOP_FILE = "/tmp/banfe-waker.stop"
SOCK_PATH = os.environ.get("HERDR_SOCKET_PATH")
if not SOCK_PATH:
    print("HERDR_SOCKET_PATH not set", file=sys.stderr)
    sys.exit(2)

# PANE -> LABEL and LABEL -> PANE maps. Use '=' as delimiter because pane IDs
# themselves contain ':' (e.g. "w1D:p1"). Args look like: w1D:p1=T2-backend
pane_to_label: dict[str, str] = {}
label_to_pane: dict[str, str] = {}
for arg in sys.argv[1:]:
    if "=" not in arg:
        print(f"bad arg (need PANE=LABEL, e.g. w1D:p1=T2-backend): {arg}", file=sys.stderr)
        sys.exit(2)
    pane, label = arg.split("=", 1)
    pane_to_label[pane] = label
    label_to_pane[label] = pane

# normalize a label to the lowercase filename stem the orchestrator polls.
# Convention: the first hyphen-separated token, lowercased. e.g.
# "T2-backend" -> "t2", "T3a-ui" -> "t3a", "T3b-game-board" -> "t3b".
def file_stem(label: str) -> str:
    return label.lower().split("-")[0]

# init state + flag files
for label in label_to_pane:
    Path(f"/tmp/banfe-{file_stem(label)}-state.log").write_text("")
    Path(f"/tmp/banfe-{file_stem(label)}-notify.flag").write_text("")

def log(label: str, msg: str) -> None:
    ts = time.strftime("%H:%M:%S")
    line = f"[{ts}] {label} {msg}"
    with open(f"/tmp/banfe-{file_stem(label)}-state.log", "a") as f:
        f.write(line + "\n")
    print(line, flush=True)

def set_flag(label: str, status: str) -> None:
    flag = Path(f"/tmp/banfe-{file_stem(label)}-notify.flag")
    if status in ("blocked", "done", "idle"):
        ts = time.strftime("%H:%M:%S")
        flag.write_text(f"{status} at {ts}")
    else:  # working / unknown -> clear
        flag.write_text("")

def notify(label: str, status: str, pane: str) -> None:
    if status not in ("blocked", "done", "idle"):
        return
    sound = "request" if status == "blocked" else "done"
    body = f"Pane {pane} reached {status}. " + (
        "Needs input — check the pane viewport." if status == "blocked"
        else "Ready for merge/handoff.")
    try:
        subprocess.run(
            ["herdr", "notification", "show", f"Banfe {label}: {status}",
             "--body", body, "--sound", sound],
            capture_output=True, timeout=5)
    except Exception:
        pass

# last status seen per pane (to fire notifications only on TRANSITIONS)
last_status: dict[str, str] = {}

def handle_event(pane: str, status: str, source: str = "event") -> None:
    """Process a status update for a pane."""
    if pane not in pane_to_label:
        return  # not one we're watching
    label = pane_to_label[pane]
    prev = last_status.get(pane)
    if status == prev:
        return  # no transition
    log(label, f"pane={pane} agent_status={status} (via {source})")
    set_flag(label, status)
    if status in ("blocked", "done", "idle"):
        notify(label, status, pane)
    last_status[pane] = status

def parse_event(line: str) -> tuple[str | None, str | None]:
    """Extract (pane_id, agent_status) from an event JSON line, tolerating
    multiple shapes. The observed herdr shape is:
      {"data": {"agent":..., "agent_status":..., "pane_id":..., "workspace_id":...},
       "event": "pane.agent_status_changed"}
    Also handle flat and nested-pane variants defensively."""
    try:
        d = json.loads(line)
    except Exception:
        return None, None
    # shape 0 (OBSERVED): {"data": {"pane_id":..., "agent_status":...}, "event":...}
    if isinstance(d.get("data"), dict):
        dd = d["data"]
        return dd.get("pane_id"), dd.get("agent_status")
    # shape 1: flat {"pane_id":..., "agent_status":...}
    pane = d.get("pane_id")
    status = d.get("agent_status")
    if pane is not None:
        return pane, status
    # shape 2: nested {"pane": {"pane_id":..., "agent_status":...}}
    if isinstance(d.get("pane"), dict):
        return d["pane"].get("pane_id"), d["pane"].get("agent_status")
    # shape 3: result-wrapped {"result": {"pane": {...}}}
    if isinstance(d.get("result"), dict):
        rp = d["result"]
        if isinstance(rp.get("pane"), dict):
            return rp["pane"].get("pane_id"), rp["pane"].get("agent_status")
        return rp.get("pane_id"), rp.get("agent_status")
    return None, None

def subscribe(sock: socket.socket) -> bool:
    """Send one subscribe request for ALL watched panes. Returns True on ack."""
    subs = [{"type": "pane.agent_status_changed", "pane_id": p} for p in pane_to_label]
    req = {"id": "sub", "method": "events.subscribe", "params": {"subscriptions": subs}}
    sock.sendall((json.dumps(req) + "\n").encode())
    # read the ack line (first line)
    buf = sock.recv(8192).decode(errors="replace")
    first = buf.split("\n", 1)[0]
    try:
        d = json.loads(first)
        return d.get("result", {}).get("type") == "subscription_started" or d.get("id") == "sub"
    except Exception:
        return False

def poll_fallback() -> None:
    """Belt-and-suspenders: `herdr pane get` each pane every 60s in case an
    event was missed. Note: herdr pane get emits JSON by default (no --json flag)."""
    for pane, label in pane_to_label.items():
        try:
            r = subprocess.run(["herdr", "pane", "get", pane],
                               capture_output=True, text=True, timeout=5)
            d = json.loads(r.stdout)
            p = d["result"]["pane"]
            handle_event(pane, p.get("agent_status", "unknown"), source="poll")
        except Exception as e:
            log(label, f"poll error: {e}")

def main() -> int:
    Path("/tmp/banfe-waker-socket.pid").write_text(str(os.getpid()))
    log("daemon", f"started PID={os.getpid()} watching {list(pane_to_label)}")

    # initial snapshot so we have a baseline
    poll_fallback()

    backoff = 1
    last_poll = time.time()
    while True:
        if os.path.exists(STOP_FILE):
            log("daemon", "STOP file detected, exiting")
            return 0
        try:
            with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as sock:
                sock.settimeout(30)
                sock.connect(SOCK_PATH)
                if not subscribe(sock):
                    log("daemon", "subscribe failed, retrying")
                    time.sleep(backoff); backoff = min(backoff * 2, 30); continue
                backoff = 1
                log("daemon", "subscribed, listening for events")
                # read loop
                leftover = ""
                while True:
                    if os.path.exists(STOP_FILE):
                        return 0
                    try:
                        chunk = sock.recv(8192).decode(errors="replace")
                    except socket.timeout:
                        # timeout is expected on an idle event stream — keep waiting
                        if time.time() - last_poll > 60:
                            poll_fallback()
                            last_poll = time.time()
                        continue
                    if chunk == "":
                        # empty recv (not a timeout) = socket closed; reconnect
                        log("daemon", "socket closed, reconnecting")
                        break
                    leftover += chunk
                    while "\n" in leftover:
                        line, leftover = leftover.split("\n", 1)
                        line = line.strip()
                        if not line:
                            continue
                        # skip ack lines
                        if '"subscription_started"' in line or '"id":"sub"' in line:
                            continue
                        pane, status = parse_event(line)
                        if pane and status:
                            handle_event(pane, status, source="event")
                    # periodic poll fallback
                    if time.time() - last_poll > 60:
                        poll_fallback()
                        last_poll = time.time()
        except (socket.error, FileNotFoundError) as e:
            log("daemon", f"socket error: {e}, retrying in {backoff}s")
            time.sleep(backoff); backoff = min(backoff * 2, 30)
        except Exception as e:
            log("daemon", f"unexpected: {e}, retrying in {backoff}s")
            time.sleep(backoff); backoff = min(backoff * 2, 30)

if __name__ == "__main__":
    sys.exit(main())
