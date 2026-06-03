#!/bin/bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${PORT:-8787}"
HOST_BIND="${HOST:-0.0.0.0}"
LOG_FILE="/tmp/slaptax_api.log"
PID_FILE="$REPO_DIR/.slaptax_api.pid"
PORT_FILE="$REPO_DIR/.slaptax_api.port"

cd "$REPO_DIR"

# Stop stale server from PID file first (if any).
if [[ -f "$PID_FILE" ]]; then
  OLD_PID="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "${OLD_PID:-}" ]] && kill -0 "$OLD_PID" >/dev/null 2>&1; then
    kill "$OLD_PID" || true
    sleep 1
    if kill -0 "$OLD_PID" >/dev/null 2>&1; then
      kill -9 "$OLD_PID" || true
      sleep 1
    fi
  fi
  rm -f "$PID_FILE"
fi

# Stop any process already listening on the chosen port.
PIDS="$(lsof -ti tcp:"$PORT" || true)"
if [[ -n "$PIDS" ]]; then
  echo "$PIDS" | xargs kill || true
  sleep 1
  PIDS="$(lsof -ti tcp:"$PORT" || true)"
  if [[ -n "$PIDS" ]]; then
    echo "$PIDS" | xargs kill -9 || true
    sleep 1
  fi
fi

# Start API in background and persist logs.
nohup env HOST="$HOST_BIND" PORT="$PORT" node "$REPO_DIR/api/server.js" >"$LOG_FILE" 2>&1 &
SERVER_PID=$!

sleep 1
if ! kill -0 "$SERVER_PID" >/dev/null 2>&1; then
  echo "Failed to start server. Last logs:"
  tail -n 40 "$LOG_FILE" || true
  exit 1
fi

# Wait until health endpoint is reachable, otherwise fail fast with logs.
API_HEALTH_URL="http://127.0.0.1:$PORT/api/health"
READY=0
for _ in {1..20}; do
  if curl -fsS "$API_HEALTH_URL" >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 0.25
done

if [[ "$READY" -ne 1 ]]; then
  echo "Server process started but health check failed: $API_HEALTH_URL"
  echo "Last logs:"
  tail -n 60 "$LOG_FILE" || true
  kill "$SERVER_PID" >/dev/null 2>&1 || true
  sleep 1
  if kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill -9 "$SERVER_PID" >/dev/null 2>&1 || true
  fi
  exit 1
fi

echo "$SERVER_PID" >"$PID_FILE"
echo "$PORT" >"$PORT_FILE"

# Resolve likely LAN IP on macOS.
LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
if [[ -z "$LAN_IP" ]]; then
  LAN_IP="$(ipconfig getifaddr en1 2>/dev/null || true)"
fi
if [[ -z "$LAN_IP" ]]; then
  LAN_IP="127.0.0.1"
fi

API_URL="http://$LAN_IP:$PORT"
API_URL_ENC="${API_URL//%/%25}"
API_URL_ENC="${API_URL_ENC//:/%3A}"
API_URL_ENC="${API_URL_ENC//\//%2F}"
INVITE_URL="file://$REPO_DIR/slaptax_mvp_connected.html?api=$API_URL_ENC"

printf "\nSLAP\$TAX server started\n"
printf "PID: %s\n" "$SERVER_PID"
printf "API: %s\n" "$API_URL"
printf "Health: %s\n" "${API_URL}/api/health"
printf "Invite (if using local file): %s\n" "$INVITE_URL"
printf "Logs: %s\n\n" "$LOG_FILE"
printf "PID file: %s\n\n" "$PID_FILE"

# Keep Terminal open when double-clicked.
if [[ "${1:-}" != "--no-wait" ]]; then
  echo "Press Enter to close..."
  read -r _
fi
