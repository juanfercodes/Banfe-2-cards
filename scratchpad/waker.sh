#!/usr/bin/env bash
# Waker: persistent background monitor for a herdr pane. Non-blocking, writes
# state to a file, fires a herdr notification on status TRANSITIONS, and does
# NOT exit on `blocked` (so a stuck worker stays watched until the orchestrator
# intervenes). Only exits on `done`/`idle` after N consecutive terminal reads,
# or on the STOP file.
# Usage: ./waker.sh <pane_id> <label> <state_file> [stop_file]
set +e
PANE="$1"
LABEL="$2"
STATE_FILE="$3"
STOP_FILE="${4:-/tmp/banfe-waker.stop}"
INTERVAL=20
NOTIFY_FILE="/tmp/banfe-${LABEL}-notify.flag"   # orchestrator can poll this
mkdir -p "$(dirname "$STATE_FILE")"
: > "$STATE_FILE"
: > "$NOTIFY_FILE"
last_status=""
done_count=0
while true; do
  if [ -f "$STOP_FILE" ]; then echo "[$(date +%H:%M:%S)] STOP file detected, exiting" >> "$STATE_FILE"; break; fi
  raw=$(herdr pane get "$PANE" 2>/dev/null)
  status=$(echo "$raw" | python3 -c "import sys,json
try:
  d=json.load(sys.stdin)
  p=d.get('result',{}).get('pane',{})
  print(p.get('agent_status','unknown'))
except Exception:
  print('parse-error')" 2>/dev/null)
  ts=$(date +%H:%M:%S)
  echo "[$ts] $LABEL pane=$PANE agent_status=$status" >> "$STATE_FILE"
  # fire notification + flag ONLY on transitions (not every poll)
  if [ "$status" != "$last_status" ] && [ "$status" != "parse-error" ]; then
    case "$status" in
      blocked)
        echo "[$ts] BLOCKED — needs orchestrator input" >> "$STATE_FILE"
        echo "blocked at $ts" > "$NOTIFY_FILE"
        herdr notification show "Banfe $LABEL: BLOCKED" --body "Pane $PANE needs input. Check plan/tasks and the pane viewport." --sound request 2>/dev/null
        done_count=0
        ;;
      done|idle)
        echo "[$ts] TERMINAL $status — needs merge/handoff" >> "$STATE_FILE"
        echo "$status at $ts" > "$NOTIFY_FILE"
        herdr notification show "Banfe $LABEL: $status" --body "Pane $PANE reached $status. Merge or hand off." --sound done 2>/dev/null
        done_count=$((done_count+1))
        ;;
      working)
        : > "$NOTIFY_FILE"   # clear flag when it resumes
        done_count=0
        ;;
    esac
  fi
  # only exit after several consecutive done/idle reads (truly finished + seen)
  if [ "$done_count" -ge 6 ]; then echo "[$ts] 6 consecutive done reads, exiting waker" >> "$STATE_FILE"; break; fi
  last_status="$status"
  sleep "$INTERVAL"
done
echo "[$(date +%H:%M:%S)] waker exited" >> "$STATE_FILE"
