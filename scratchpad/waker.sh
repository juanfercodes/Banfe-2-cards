#!/usr/bin/env bash
# Waker: background monitor for herdr panes. Non-blocking, writes state to a file,
# fires a herdr notification on terminal status (done/blocked) and exits.
# Usage: ./waker.sh <pane_id> <label> <state_file>
set +e
PANE="$1"
LABEL="$2"
STATE_FILE="$3"
STOP_FILE="${4:-/tmp/banfe-waker.stop}"
INTERVAL=30
mkdir -p "$(dirname "$STATE_FILE")"
: > "$STATE_FILE"
last_status=""
while true; do
  if [ -f "$STOP_FILE" ]; then echo "[$(date +%H:%M:%S)] STOP file detected, exiting" >> "$STATE_FILE"; break; fi
  raw=$(herdr pane get "$PANE" 2>/dev/null)
  status=$(echo "$raw" | python3 -c "import sys,json
try:
  d=json.load(sys.stdin)
  p=d.get('result',{}).get('pane',{})
  print(p.get('agent_status','unknown'))
except Exception as e:
  print('parse-error')" 2>/dev/null)
  ts=$(date +%H:%M:%S)
  echo "[$ts] $LABEL pane=$PANE agent_status=$status" >> "$STATE_FILE"
  if [ "$status" = "done" ] || [ "$status" = "blocked" ] || [ "$status" = "idle" ]; then
    if [ "$status" != "$last_status" ]; then
      echo "[$ts] TERMINAL $status — firing notification" >> "$STATE_FILE"
      herdr notification show "Banfe T0: $LABEL $status" --body "Pane $PANE reached $status. Check plan/tasks/T0_foundation.md progress." --sound done 2>/dev/null
    fi
    # Don't exit on idle/done — keep watching in case it's resumed; but stop after 3 consecutive terminal reads
    term_count=$((term_count+1))
    if [ "$term_count" -ge 3 ]; then echo "[$ts] 3 consecutive terminal reads, exiting waker" >> "$STATE_FILE"; break; fi
  else
    term_count=0
  fi
  last_status="$status"
  sleep "$INTERVAL"
done
echo "[$(date +%H:%M:%S)] waker exited" >> "$STATE_FILE"
