#!/usr/bin/env bash
set -euo pipefail

# Stops any KoleqCost / fauzan-portfolio dev server and clears stale locks.

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT=3000
PID_FILE="/tmp/koleqcost-dev.pid"
LOCK_FILE="${PROJECT_DIR}/.next/dev/lock"

stop_pid() {
  local pid="$1"
  if kill -0 "${pid}" 2>/dev/null; then
    kill "${pid}" 2>/dev/null || true
    sleep 1
    kill -9 "${pid}" 2>/dev/null || true
  fi
}

if [[ -f "${PID_FILE}" ]]; then
  stop_pid "$(cat "${PID_FILE}")"
  rm -f "${PID_FILE}"
fi

if [[ -f "${LOCK_FILE}" ]]; then
  lock_pid="$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('${LOCK_FILE}','utf8')).pid||'')}catch(e){}" 2>/dev/null || true)"
  if [[ -n "${lock_pid}" ]]; then
    stop_pid "${lock_pid}"
  fi
  rm -f "${LOCK_FILE}"
fi

if lsof -Pi :"${PORT}" -sTCP:LISTEN -t >/dev/null 2>&1; then
  lsof -Pi :"${PORT}" -sTCP:LISTEN -t | xargs kill 2>/dev/null || true
  sleep 1
  lsof -Pi :"${PORT}" -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
fi

echo "KoleqCost dev server stopped and lock cleared."
