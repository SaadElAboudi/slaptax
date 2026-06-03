#!/bin/bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$REPO_DIR/.slaptax_api.pid"
PORT_FILE="$REPO_DIR/.slaptax_api.port"
PORT="${PORT:-}"

if [[ -z "$PORT" && -f "$PORT_FILE" ]]; then
  PORT="$(cat "$PORT_FILE" 2>/dev/null || true)"
fi
if [[ -z "$PORT" ]]; then
  PORT="8787"
fi

STOPPED=0

if [[ -f "$PID_FILE" ]]; then
  PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "${PID:-}" ]] && kill -0 "$PID" >/dev/null 2>&1; then
    kill "$PID" || true
    sleep 1
    if kill -0 "$PID" >/dev/null 2>&1; then
      kill -9 "$PID" || true
      sleep 1
    fi
    STOPPED=1
    echo "Stopped SLAP\$TAX server PID $PID"
  fi
  rm -f "$PID_FILE"
fi

PIDS="$(lsof -ti tcp:"$PORT" || true)"
if [[ -n "$PIDS" ]]; then
  echo "$PIDS" | xargs kill || true
  sleep 1
  PIDS="$(lsof -ti tcp:"$PORT" || true)"
  if [[ -n "$PIDS" ]]; then
    echo "$PIDS" | xargs kill -9 || true
    sleep 1
  fi
  STOPPED=1
  echo "Stopped process(es) on port $PORT"
fi

rm -f "$PORT_FILE"

if [[ "$STOPPED" -eq 0 ]]; then
  echo "No running SLAP\$TAX server found on port $PORT"
fi

if [[ "${1:-}" != "--no-wait" ]]; then
  echo "Press Enter to close..."
  read -r _
fi
