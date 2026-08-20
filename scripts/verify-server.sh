#!/usr/bin/env bash
# Restart the verification server on port 3100 from the .next-verify build.
# Development only. Kills whatever is holding the port first, since a stale
# next start survives a terminated npx wrapper.
set -e
powershell.exe -NoProfile -Command '$c = Get-NetTCPConnection -LocalPort 3100 -State Listen -ErrorAction SilentlyContinue; if ($c) { $c | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force } }' >/dev/null 2>&1 || true
NEXT_DIST_DIR=.next-verify nohup npx next start -p 3100 > build-logs/verify-server.log 2>&1 &
until curl -s -o /dev/null http://localhost:3100/; do sleep 1; done
echo "verify server up on 3100"
