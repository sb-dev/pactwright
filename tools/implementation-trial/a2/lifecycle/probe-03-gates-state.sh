#!/usr/bin/env bash
# A2-L probe 03 — Gates, Decision authority, corrupt run state, and the
# permitted-operation list. Public CLI only.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/lib/fixture.sh"
set +e
WORK="${WORK:-$(mktemp -d)}"
export PATH="$HERE/lib/bin:$PATH"; export PROBE_CLI="$CLI"
banner() { printf '\n=== %s ===\n' "$1"; }
# The `iterations` block of a run document, on one line.
iters() { awk '/^iterations:/{f=1;printf "%s",$0;next} f&&/^  /{printf " %s",$0;next} f{exit} END{print ""}' \
  ".pactwright/execution/$1.yml"; }

gate_shape() {  # rewrite the shipped shape so `review` is a human Gate
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
    - name: delivery
      kind: delivery
      execution: automatic
    - name: review
      kind: review
      execution: manual
      actor: human
    - name: evidence
      kind: evidence
      execution: automatic
  transitions:
    - from: review
      to: delivery
      max_iterations: 3
EOF
}

banner "03a  a human Gate stops the automatic run"
fixture_new "$WORK/03a" --executor claude-code
gate_shape
read -r I C B <<<"$(fixture_to_brief "$WORK/03a")"
cd "$WORK/03a"
export PROBE_SPAWN_LOG="$WORK/03a.spawn.log"; : > "$PROBE_SPAWN_LOG"
PROBE_MODE=report PROBE_RESULT="pass" node "$CLI" lifecycle run --json
echo "run exit: $?"
echo "processes spawned (the Gate must not have been executed):"; sed 's/^/    /' "$PROBE_SPAWN_LOG"
node "$CLI" lifecycle status | grep -E '^  state:|shape:|permitted:|blocked:' | sed 's/^/    /'

banner "03b  an unauthorised actor may not resolve a human Gate"
node "$CLI" lifecycle record gate \
  --file "$(printf 'intent: %s\nstep: review\nresolved_by: agent:impostor\n' "$B" | record_input)"
echo "exit: $?  (expected 1)"
echo "gates in run state:"; grep -A2 '^gates' .pactwright/execution/*.yml | sed 's/^/    /'

banner "03c  POSITIVE CONTROL — an authorised human resolves the Gate"
node "$CLI" lifecycle record gate \
  --file "$(printf 'intent: %s\nstep: review\nresolved_by: human:samir\n' "$B" | record_input)"
echo "exit: $?  (expected 0)"
grep -A2 '^gates' .pactwright/execution/*.yml | sed 's/^/    /'

banner "03d  completing the Gate step, and closure with the Gate on record"
node "$CLI" lifecycle record review --file "$(printf 'intent: %s\noutcome: pass\n' "$B" | record_input)"
echo "exit: $?"
node "$CLI" lifecycle record prepare-evidence \
  --file "$(printf 'brief: %s\ntitle: Delivered\nbody: |\n  Added it.\n' "$B" | record_input)"
echo "exit: $?"
sed -n '/^closure:/,/^---/p' specs/nodes/evidence-*.md | sed 's/^/    /'

banner "03e  Decision authority: an agent may not take a human Decision"
fixture_new "$WORK/03e"
cd "$WORK/03e"
node "$CLI" lifecycle record capture-intent \
  --file "$(printf 'title: T\nbody: |\n  Body.\n' | record_input)" >/dev/null
I2="$(ls specs/nodes/intent-*.md | head -1 | sed 's#.*/##;s#\.md##')"
node "$CLI" lifecycle record approve-contract --file "$(cat <<EOF | record_input
intent: $I2
outcome: proceed
decided_by: agent:autopilot
body: |
  Decided by an agent.
contract:
  title: C
  body: |
    Contract.
EOF
)"
echo "exit: $?  (expected 1 — lifecycle.yml authorises human)"
echo "nodes: $(ls specs/nodes/ | tr '\n' ' ')"

banner "03f  run state that does not parse"
fixture_new "$WORK/03f" --executor claude-code
read -r I C B <<<"$(fixture_to_brief "$WORK/03f")"
cd "$WORK/03f"
export PROBE_SPAWN_LOG="$WORK/03f.spawn.log"; : > "$PROBE_SPAWN_LOG"
PROBE_MODE=report PROBE_RESULT="pass" node "$CLI" lifecycle run --json >/dev/null 2>&1
mkdir -p .pactwright/execution
printf 'version: 2\nbrief: "%s"\nshape: "direct"\nstatus: not-a-status\nvisited: []\n' "$B" \
  > ".pactwright/execution/$B.yml"
echo "corrupt state written. Now:"
echo "-- lifecycle run --";      PROBE_MODE=report node "$CLI" lifecycle run --json | sed 's/^/    /'
echo "-- lifecycle status --";   node "$CLI" lifecycle status | sed 's/^/    /'
echo "-- lifecycle next --";     node "$CLI" lifecycle next | sed 's/^/    /'
echo "-- validate --";           node "$CLI" validate 2>&1 | head -6 | sed 's/^/    /'; 
echo "-- state file after all that --"; sed 's/^/    /' ".pactwright/execution/$B.yml"
echo; echo "WORK=$WORK"

banner "03g  does the ADAPTER path launder unparseable run state?"
cd "$WORK/03f"
echo "corrupt state on disk:"; sed 's/^/    /' ".pactwright/execution/$B.yml"
node "$CLI" lifecycle record delivery --file "$(printf 'intent: %s\n' "$B" | record_input)"
echo "    exit: $?  (lifecycle run refuses this same state — see 03f)"
echo "state after:"; sed 's/^/    /' ".pactwright/execution/$B.yml"
node "$CLI" validate 2>&1 | head -1 | sed 's/^/    /'

banner "03h  a bound that has been exhausted, then the state is corrupted"
fixture_new "$WORK/03h" --executor claude-code
read -r I C B <<<"$(fixture_to_brief "$WORK/03h")"
cd "$WORK/03h"
export PROBE_SPAWN_LOG="$WORK/03h.spawn.log"; : > "$PROBE_SPAWN_LOG"
PROBE_MODE=report PROBE_RESULT=revise timeout 180 node "$CLI" lifecycle run --json \
  | grep -E '"stop"|"message"' | sed 's/^/    /'
echo "    iterations: $(iters "$B")"
echo "-- POSITIVE CONTROL: the bound is re-checked on the intact blocked run --"
node "$CLI" lifecycle record review --file "$(printf 'intent: %s\noutcome: revise\n' "$B" | record_input)" | sed 's/^/    /'
echo "    iterations: $(iters "$B")"
echo "-- now corrupt one field of that blocked state and record a Delivery --"
sed -i 's/^status: blocked/status: bogus/' ".pactwright/execution/$B.yml"
node "$CLI" lifecycle record delivery --file "$(printf 'intent: %s\n' "$B" | record_input)" | sed 's/^/    /'
echo "    status now:     $(grep '^status' .pactwright/execution/$B.yml)"
echo "    iterations now: $(iters "$B")"
