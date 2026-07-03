#!/usr/bin/env bash
set -euo pipefail

# Starts the Next.js dev server (if needed) and opens KoleqCost in your browser.
# Usage:
#   ./scripts/open-koleqcost.sh          # start server + open browser
#   ./scripts/open-koleqcost.sh --server # start server only (for login items)

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT=3000
URL="http://localhost:${PORT}/"
PID_FILE="/tmp/koleqcost-dev.pid"
LOG_FILE="/tmp/koleqcost-dev.log"
OPEN_BROWSER=true

if [[ "${1:-}" == "--server" ]]; then
  OPEN_BROWSER=false
fi

export PATH="/opt/homebrew/bin:/usr/local/bin:${PATH:-}"
if [[ -f "${HOME}/.zprofile" ]]; then
  # shellcheck disable=SC1091
  source "${HOME}/.zprofile"
elif [[ -f "${HOME}/.bash_profile" ]]; then
  # shellcheck disable=SC1091
  source "${HOME}/.bash_profile"
fi

cd "${PROJECT_DIR}"

if ! command -v npm >/dev/null 2>&1; then
  osascript -e 'display notification "npm not found. Install Node.js first." with title "KoleqCost"'
  exit 1
fi

if [[ ! -d "${PROJECT_DIR}/node_modules" ]]; then
  npm install >>"${LOG_FILE}" 2>&1
fi

server_healthy() {
  curl -sf --max-time 3 "http://127.0.0.1:${PORT}/" >/dev/null 2>&1
}

wait_for_server() {
  local attempts=45
  local i=0

  while (( i < attempts )); do
    if server_healthy; then
      return 0
    fi
    sleep 1
    (( i += 1 ))
  done

  return 1
}

start_server() {
  if server_healthy; then
    return 0
  fi

  # Port may be taken by a stuck process that no longer responds.
  if lsof -Pi :"${PORT}" -sTCP:LISTEN -t >/dev/null 2>&1; then
    bash "${PROJECT_DIR}/scripts/stop-koleqcost.sh" >>"${LOG_FILE}" 2>&1 || true
    sleep 1
  fi

  nohup npm run dev >>"${LOG_FILE}" 2>&1 &
  echo $! >"${PID_FILE}"
}

start_server

if ! wait_for_server; then
  osascript -e "display notification \"Check ${LOG_FILE}\" with title \"KoleqCost failed to start\""
  exit 1
fi

if [[ "${OPEN_BROWSER}" == "true" ]]; then
  open "${URL}"
fi
