#!/usr/bin/env bash
# Restart the verification server on port 3100 from the .next-verify build.
# Development only. Kills whatever is holding the port first, since a stale
# next start survives a terminated npx wrapper.
set -e

# Refuse to start on a build older than the source. A server that silently serves a
# stale build is worse than no server: it produces numbers, and they look fine.
node scripts/build-fresh.mjs

# Kill a stale production server on 3000 before it can be mistaken for this one. A
# `next start` there has no part in verification, and one was left running for most of
# this build while the operator looked at it. A `next dev` is left alone: it compiles on
# demand, so it cannot go stale.
powershell.exe -NoProfile -Command '$c = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue; if ($c) { $c | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { $p = Get-CimInstance Win32_Process -Filter "ProcessId=$_"; if ($p.CommandLine -match "next" -and $p.CommandLine -notmatch "dev") { Write-Output "stopping stale next start on 3000, pid $_"; Stop-Process -Id $_ -Force } } }' 2>/dev/null || true

powershell.exe -NoProfile -Command '$c = Get-NetTCPConnection -LocalPort 3100 -State Listen -ErrorAction SilentlyContinue; if ($c) { $c | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force } }' >/dev/null 2>&1 || true
NEXT_DIST_DIR=.next-verify nohup npx next start -p 3100 > build-logs/verify-server.log 2>&1 &
until curl -s -o /dev/null http://localhost:3100/; do sleep 1; done

# And refuse to hand back a green light while anything on 3000 still disagrees.
node scripts/check-ports.mjs

echo "verify server up on 3100"
