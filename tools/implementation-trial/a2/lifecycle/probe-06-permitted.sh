#!/usr/bin/env bash
# A2-L probe 06 — do the operations `lifecycle status` advertises as
# permitted actually execute? Including the Core §45 replacements.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/lib/fixture.sh"; set +e
WORK="${WORK:-$(mktemp -d)}"
export PATH="$HERE/lib/bin:$PATH"; export PROBE_CLI="$CLI"
banner() { printf '\n=== %s ===\n' "$1"; }

banner "06a  POSITIVE CONTROL — write-brief (supersede) on a delivering lineage"
fixture_new "$WORK/06a"; read -r I C B <<<"$(fixture_to_brief "$WORK/06a")"; cd "$WORK/06a"
node "$CLI" lifecycle record delivery --file "$(printf 'intent: %s\n' "$B" | record_input)" >/dev/null
node "$CLI" lifecycle status | grep permitted | sed 's/^/    /'
node "$CLI" lifecycle record write-brief \
  --file "$(printf 'contract: %s\ntitle: Implement healthz v2\nbody: |\n  Revised.\n' "$C" | record_input)"
echo "    exit: $?  (expected 0)"
echo "    run documents left under .pactwright/execution:"; ls .pactwright/execution/ | sed 's/^/        /'
echo "    (the superseded Brief's run is one of them)"

banner "06b  POSITIVE CONTROL — approve-contract (supersede) on a delivering lineage"
fixture_new "$WORK/06b"; read -r I C B <<<"$(fixture_to_brief "$WORK/06b")"; cd "$WORK/06b"
node "$CLI" lifecycle record delivery --file "$(printf 'intent: %s\n' "$B" | record_input)" >/dev/null
node "$CLI" lifecycle record approve-contract --file "$(cat <<EOF | record_input
intent: $I
outcome: proceed
decided_by: human:samir
body: |
  Direction changed after delivery began.
contract:
  title: Authenticated liveness endpoint
  body: |
    GET /healthz requires a bearer token.
EOF
)"
echo "    exit: $?  (expected 0)"
echo "    run documents left under .pactwright/execution:"; ls .pactwright/execution/ | sed 's/^/        /'

banner "06c  a shape the validator accepts, whose first Review can never succeed"
fixture_new "$WORK/06c" --executor claude-code; cd "$WORK/06c"
cat > .pactwright/lifecycle.yml <<'EOF'
version: 2

responsibilities:
  capture-intent:
    execution: manual
  propose-contracts:
    execution: automatic
  approve-contract:
    execution: manual
    actor: human
  write-brief:
    execution: automatic

shape:
  id: direct
  steps:
    - name: triage-review
      kind: review
      execution: automatic
    - name: delivery
      kind: delivery
      execution: automatic
    - name: review
      kind: review
      execution: automatic
    - name: evidence
      kind: evidence
      execution: automatic
  transitions:
    - from: review
      to: delivery
      max_iterations: 3
EOF
node "$CLI" validate >/dev/null 2>&1; echo "    the shape passes validate: exit $?"
read -r I C B <<<"$(fixture_to_brief "$WORK/06c")"
export PROBE_SPAWN_LOG="$WORK/06c.log"; : > "$PROBE_SPAWN_LOG"
for n in 1 2; do
  echo "    -- run $n --"
  PROBE_MODE=report PROBE_RESULT=pass node "$CLI" lifecycle run --json \
    | grep -E '"stop"|"message"' | sed 's/^/        /'
done
echo "    visited after two runs:"; grep -A3 '^visited' .pactwright/execution/*.yml | sed 's/^/        /'
echo "    validate:"; node "$CLI" validate 2>&1 | head -3 | sed 's/^/        /'

banner "06d  every advertised operation, on the project run 06c produced"
node "$CLI" lifecycle status | grep permitted | sed 's/^/    advertised: /'
echo "    -- write-brief (supersede) --"
node "$CLI" lifecycle record write-brief \
  --file "$(printf 'contract: %s\ntitle: Fresh brief\nbody: |\n  Start again.\n' "$C" | record_input)" 2>&1 \
  | head -3 | sed 's/^/        /'
echo "        exit: $?"
echo "    -- approve-contract (supersede) --"
node "$CLI" lifecycle record approve-contract --file "$(cat <<EOF | record_input
intent: $I
outcome: proceed
decided_by: human:samir
body: |
  Change direction.
contract:
  title: Another contract
  body: |
    Another.
EOF
)" 2>&1 | head -3 | sed 's/^/        /'
echo "    -- capture-intent (start over) --"
node "$CLI" lifecycle record capture-intent \
  --file "$(printf 'title: Unrelated work\nbody: |\n  Something else entirely.\n' | record_input)" 2>&1 \
  | head -3 | sed 's/^/        /'
echo "    run documents still present:"; ls .pactwright/execution/ | sed 's/^/        /'
echo; echo "WORK=$WORK"
