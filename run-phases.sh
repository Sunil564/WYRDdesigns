#!/usr/bin/env bash
#
# WYRD site build, bounded phase runner.
#
# Runs one Claude Code session per phase, sequentially, committing between each.
# Bounded on purpose. It will not loop forever and it will not run the whole build.
#
# Usage:
#   ./run-phases.sh 0 2        run phases 0, 0b, 1, 2
#   ./run-phases.sh 3 3        run phase 3 only
#   ./run-phases.sh            defaults to 0 through 2
#
# Phase 0 is source ingestion from the Codebase2 folder. Run it supervised the
# first time. Phases 0b to 2 are structural and safe unattended.
# Phase 2b (render tiering) and everything after is visual. Review those awake.
# Valid phase labels: 0 0b 1 2 2b 3 4 5 6 7

set -uo pipefail

# Phase list. 0 is source ingestion, 0b is scaffold, 2b is render tiering and WebGL foundation.
ALL_PHASES=(0 0b 1 2 2b 3 4 5 6 7)

START="${1:-0}"
END="${2:-2}"

BRIEF="WYRD-WEBSITE-BUILD-PLAN.md"
LOG_DIR="build-logs"
PERMISSION_MODE="auto"        # classifier-gated. Use bypassPermissions only inside a container.
TIMEOUT_SECONDS=3600          # per phase hard ceiling

# ---------------------------------------------------------------- preflight

if ! command -v claude >/dev/null 2>&1; then
  echo "FAIL: claude CLI not found on PATH."
  exit 1
fi

if [[ ! -f "$BRIEF" ]]; then
  echo "FAIL: $BRIEF not found. Run this from the repo root with the brief present."
  exit 1
fi

if [[ ! -f "CLAUDE.md" ]]; then
  echo "WARN: CLAUDE.md not found at repo root. Context will not persist across sessions."
fi

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "FAIL: not a git repository. Run 'git init' first. Git is the undo button."
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "FAIL: working tree is dirty. Commit or stash before an unattended run."
  exit 1
fi

# Section 0.4 inputs are resolved in the brief. Guard against regressions only.
if grep -q "__________" "$BRIEF"; then
  echo "FAIL: $BRIEF has unfilled blanks. Section 0.4 should be fully resolved."
  grep -n "__________" "$BRIEF"
  exit 1
fi

# Production domain is not registered. Nothing may hardcode one.
if [[ -d "app" || -d "src" ]]; then
  if grep -rIl --exclude-dir=node_modules --exclude-dir=.next -E "https?://(www\.)?wyrd" app src 2>/dev/null | grep -q .; then
    echo "WARN: a hardcoded wyrd URL appears in the source. The domain is pending."
    echo "All origins must come from process.env.NEXT_PUBLIC_SITE_URL. Check these files:"
    grep -rIl --exclude-dir=node_modules --exclude-dir=.next -E "https?://(www\.)?wyrd" app src 2>/dev/null
  fi
fi

# Source folder must be reachable. Path is Windows-native, resolve for Git Bash and WSL.
SOURCE_WIN='M:\WYRD Projects\WYRD Website\Codebase2'
SOURCE_CANDIDATES=(
  "/m/WYRD Projects/WYRD Website/Codebase2"
  "/mnt/m/WYRD Projects/WYRD Website/Codebase2"
)
SOURCE_FOUND=""
for c in "${SOURCE_CANDIDATES[@]}"; do
  [[ -d "$c" ]] && SOURCE_FOUND="$c" && break
done
if [[ -z "$SOURCE_FOUND" ]]; then
  echo "FAIL: source folder not reachable from this shell."
  echo "Looked for: ${SOURCE_CANDIDATES[*]}"
  echo "Windows path is: $SOURCE_WIN"
  echo "Mount the M: drive or run from a shell that can see it. Phase 0 cannot start without it."
  exit 1
fi
echo "Source folder found: $SOURCE_FOUND"
echo "Contents:"
ls -1 "$SOURCE_FOUND" | head -40

if ! ls "$SOURCE_FOUND" | grep -qi "brand"; then
  echo "WARN: no file matching 'brand' in the source folder. Phase 0 expects brand.md there."
fi

mkdir -p "$LOG_DIR"

# ---------------------------------------------------------------- run

# Slice ALL_PHASES from START to END inclusive.
START_IDX=-1; END_IDX=-1
for i in "${!ALL_PHASES[@]}"; do
  [[ "${ALL_PHASES[$i]}" == "$START" ]] && START_IDX=$i
  [[ "${ALL_PHASES[$i]}" == "$END" ]] && END_IDX=$i
done
if [[ $START_IDX -lt 0 || $END_IDX -lt 0 || $END_IDX -lt $START_IDX ]]; then
  echo "FAIL: invalid phase range '$START' to '$END'. Valid phases: ${ALL_PHASES[*]}"
  exit 1
fi
RUN_PHASES=("${ALL_PHASES[@]:$START_IDX:$((END_IDX - START_IDX + 1))}")
echo "Will run phases: ${RUN_PHASES[*]}"

for PHASE in "${RUN_PHASES[@]}"; do
  if [[ "$PHASE" == "7" ]]; then
    echo "SKIP: Phase 7 is deploy. The production domain is not registered yet."
    echo "Run it manually when you have one."
    continue
  fi
  STAMP="$(date +%Y%m%d-%H%M%S)"
  LOG="$LOG_DIR/phase-${PHASE}-${STAMP}.json"
  BRANCH_POINT="$(git rev-parse HEAD)"

  echo ""
  echo "================================================================"
  echo "PHASE $PHASE  starting $(date '+%H:%M:%S')"
  echo "revert point: $BRANCH_POINT"
  echo "log: $LOG"
  echo "================================================================"

  PROMPT="Read $BRIEF in full, then read CLAUDE.md.

The source folder described in section 0 of the brief is reachable at: $SOURCE_FOUND
(Windows path: $SOURCE_WIN). Supplied brand documents there override this brief on brand matters.

Execute Phase $PHASE only. Do not begin any later phase under any circumstances.

When Phase $PHASE is complete:
1. Verify the output against every acceptance criterion listed for Phase $PHASE in the brief. Report each one individually as PASS or FAIL. For any FAIL, state exactly what is wrong.
2. Also verify the global rules: zero long em dash characters anywhere in the repo, zero invented client names or statistics or prices, zero TypeScript errors, zero ESLint errors.
3. Write any architectural decision made during this phase as a numbered ADR in docs/decisions/.
4. Commit the work with a conventional commit message.
5. Stop.

If you are blocked on missing information, do not guess and do not substitute a placeholder fact. Write the blocker to docs/BLOCKERS.md, commit that, and stop."

  timeout "$TIMEOUT_SECONDS" claude -p "$PROMPT" \
    --permission-mode "$PERMISSION_MODE" \
    --output-format json \
    > "$LOG" 2>&1

  STATUS=$?

  if [[ $STATUS -eq 124 ]]; then
    echo "PHASE $PHASE TIMED OUT after ${TIMEOUT_SECONDS}s. Halting."
    echo "Inspect: $LOG    Revert with: git reset --hard $BRANCH_POINT"
    exit 1
  fi

  if [[ $STATUS -ne 0 ]]; then
    echo "PHASE $PHASE EXITED NONZERO ($STATUS). Halting."
    echo "Inspect: $LOG    Revert with: git reset --hard $BRANCH_POINT"
    exit 1
  fi

  if [[ -f "docs/BLOCKERS.md" ]] && git diff --name-only "$BRANCH_POINT" HEAD | grep -q "docs/BLOCKERS.md"; then
    echo "PHASE $PHASE reported a blocker. Halting so a human can resolve it."
    cat docs/BLOCKERS.md
    exit 1
  fi

  if [[ "$(git rev-parse HEAD)" == "$BRANCH_POINT" ]]; then
    echo "PHASE $PHASE produced no commit. Treating as failure. Halting."
    echo "Inspect: $LOG"
    exit 1
  fi

  echo "PHASE $PHASE done. Commits:"
  git --no-pager log --oneline "$BRANCH_POINT..HEAD"
done

# ---------------------------------------------------------------- report

echo ""
echo "================================================================"
echo "RUN COMPLETE, phases $START to $END"
echo "================================================================"
echo ""
echo "Acceptance criteria reported by each phase:"
for f in "$LOG_DIR"/*.json; do
  echo ""
  echo "--- $f"
  if command -v jq >/dev/null 2>&1; then
    jq -r '.result' "$f" 2>/dev/null | grep -Ei "PASS|FAIL" || echo "(no criteria lines found, read the log)"
  else
    echo "(install jq to auto-extract, or read the log directly)"
  fi
done

echo ""
echo "Do not trust these reports on anything visual. Run 'npm run dev' and look at it."
