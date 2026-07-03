#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAUNCHER="${PROJECT_DIR}/scripts/open-koleqcost.sh"
PLIST_LABEL="com.fauzan.koleqcost"
PLIST_PATH="${HOME}/Library/LaunchAgents/${PLIST_LABEL}.plist"

mkdir -p "${HOME}/Library/LaunchAgents"

cat >"${PLIST_PATH}" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${PLIST_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${LAUNCHER}</string>
    <string>--server</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/koleqcost-login.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/koleqcost-login.err</string>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)/${PLIST_LABEL}" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "${PLIST_PATH}"

echo "Installed login item: ${PLIST_PATH}"
echo "The dev server will start automatically when you log in."
echo "Open the app with: ${PROJECT_DIR}/Open KoleqCost.command"

