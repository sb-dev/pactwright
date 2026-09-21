#!/usr/bin/env bash
# A2-L probe 04 — the four Contract-crafting responsibilities inside the
# automatic loop, and what the headless prompt actually says.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/lib/fixture.sh"; set +e
WORK="${WORK:-$(mktemp -d)}"
export PATH="$HERE/lib/bin:$PATH"; export PROBE_CLI="$CLI"
banner() { printf '\n=== %s ===\n' "$1"; }

banner "04a  run from the open state: propose-contracts then the approve-contract Gate"
fixture_new "$WORK/04a" --executor claude-code
cd "$WORK/04a"
node "$CLI" lifecycle record capture-intent \
  --file "$(printf 'title: Add a health endpoint\nbody: |\n  Operators need a liveness check.\n' | record_input)" >/dev/null
git add -A; git commit -qm graph
export PROBE_SPAWN_LOG="$WORK/04a.spawn.log"; : > "$PROBE_SPAWN_LOG"
PROBE_MODE=report node "$CLI" lifecycle run --json
echo "run exit: $?"
echo "spawned:"; sed 's/^/    /' "$PROBE_SPAWN_LOG"

banner "04b  run from the contracted state: write-brief is a RECORDING responsibility"
fixture_new "$WORK/04b" --executor claude-code
cd "$WORK/04b"
node "$CLI" lifecycle record capture-intent \
  --file "$(printf 'title: T\nbody: |\n  Body.\n' | record_input)" >/dev/null
I="$(ls specs/nodes/intent-*.md | head -1 | sed 's#.*/##;s#\.md##')"
node "$CLI" lifecycle record approve-contract --file "$(cat <<EOF | record_input
intent: $I
outcome: proceed
decided_by: human:samir
body: |
  Chosen.
contract:
  title: C
  body: |
    Contract.
EOF
)" >/dev/null
git add -A; git commit -qm graph
export PROBE_SPAWN_LOG="$WORK/04b.spawn.log"; : > "$PROBE_SPAWN_LOG"
echo "-- agent does NOT call the runtime (mode=report) --"
PROBE_MODE=report node "$CLI" lifecycle run --json
echo "run exit: $?"
echo "-- agent DOES call the runtime, as its prompt instructs (mode=obey) --"
# `obey` only knows the provenance stages; write-brief needs its own content,
# so record it here exactly as a compliant /write-brief agent would.
C="$(ls specs/nodes/contract-*.md | head -1 | sed 's#.*/##;s#\.md##')"
node "$CLI" lifecycle record write-brief \
  --file "$(printf 'contract: %s\ntitle: B\nbody: |\n  Brief.\n' "$C" | record_input)"
echo "    exit: $?"

banner "04c  headless prompt vs. rendered command — are they the same instruction?"
cd "$WORK/04a"
echo "rendered /propose-contracts sections:"
grep '^## ' .claude/commands/propose-contracts.md | sed 's/^/    /'
echo "headless instruction sections (logged by the stub from the real argv):"
grep 'prompt sections' "$WORK/04a.spawn.log" | sed 's/^/    /'
echo; echo "WORK=$WORK"
