#!/usr/bin/env bash
# A2-L probe 02 — `lifecycle run` against the real claude-code executor with
# only the child process replaced (lib/bin/claude).
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/lib/fixture.sh"
set +e
WORK="${WORK:-$(mktemp -d)}"
export PATH="$HERE/lib/bin:$PATH"
export PROBE_CLI="$CLI"

banner() { printf '\n=== %s ===\n' "$1"; }
state() { echo "run state:"; sed 's/^/    /' .pactwright/execution/*.yml 2>/dev/null || echo "    (no run state on disk)"; }

banner "02a  a full automatic run: does the closing Evidence step close anything?"
fixture_new "$WORK/02a" --executor claude-code
read -r I C B <<<"$(fixture_to_brief "$WORK/02a")"
cd "$WORK/02a"
export PROBE_SPAWN_LOG="$WORK/02a.spawn.log"; : > "$PROBE_SPAWN_LOG"
PROBE_MODE=report PROBE_RESULT="pass" node "$CLI" lifecycle run --json
echo "run exit: $?"
echo "processes spawned:"; sed 's/^/    /' "$PROBE_SPAWN_LOG"
echo "evidence nodes created: $(ls specs/nodes/ | grep -c '^evidence-')"
node "$CLI" lifecycle status | grep -E '^  state:|shape:|steps visited:|permitted:' | sed 's/^/    /'
state
echo "--> is the lineage still closable?"
node "$CLI" lifecycle record prepare-evidence \
  --file "$(printf 'brief: %s\ntitle: Delivered\nbody: |\n  Added it.\n' "$B" | record_input)"
echo "prepare-evidence exit: $?"
echo "--> a second run:"
PROBE_MODE=report node "$CLI" lifecycle run --json

banner "02b  a COMPLIANT agent: the prompt tells it to call the runtime itself"
fixture_new "$WORK/02b" --executor claude-code
read -r I C B <<<"$(fixture_to_brief "$WORK/02b")"
cd "$WORK/02b"
export PROBE_SPAWN_LOG="$WORK/02b.spawn.log"; : > "$PROBE_SPAWN_LOG"
echo "the instruction the runtime sends for the Delivery step contains:"
grep -o 'lifecycle record delivery --file <path>' "$WORK/02b/.claude/commands/deliver-brief.md" | sed 's/^/    /'
# The agent's true verdict is `revise`; its prose report happens to contain
# the word "pass". Both are things a real agent produces.
PROBE_MODE=obey PROBE_AGENT_OUTCOME=revise \
  PROBE_RESULT="Two defects remain. I have asked for another delivery pass." \
  timeout 180 node "$CLI" lifecycle run --json
echo "run exit: $?"
echo "what the agent recorded through the runtime:"; sed 's/^/    /' "$PROBE_SPAWN_LOG"
state

banner "02c  POSITIVE CONTROL — the bounded corrective loop"
fixture_new "$WORK/02c" --executor claude-code
read -r I C B <<<"$(fixture_to_brief "$WORK/02c")"
cd "$WORK/02c"
export PROBE_SPAWN_LOG="$WORK/02c.spawn.log"; : > "$PROBE_SPAWN_LOG"
PROBE_MODE=report PROBE_RESULT="revise" timeout 180 node "$CLI" lifecycle run --json
echo "run exit: $?  (max_iterations is 3 in the shipped shape)"
state

banner "02d  POSITIVE CONTROL — executor failure and denial"
fixture_new "$WORK/02d" --executor claude-code
read -r I C B <<<"$(fixture_to_brief "$WORK/02d")"
cd "$WORK/02d"
export PROBE_SPAWN_LOG="$WORK/02d.spawn.log"; : > "$PROBE_SPAWN_LOG"
PROBE_MODE=denied node "$CLI" lifecycle run --json
echo "run exit: $?"
state
echo "--> resume: a second run of a failed run"
PROBE_MODE=report PROBE_RESULT="pass" timeout 180 node "$CLI" lifecycle run --json
echo "run exit: $?"
state

banner "02g  POSITIVE CONTROL — a failed REVIEW step, then a governed retry"
fixture_new "$WORK/02g" --executor claude-code
read -r I C B <<<"$(fixture_to_brief "$WORK/02g")"
cd "$WORK/02g"
export PROBE_SPAWN_LOG="$WORK/02g.spawn.log"; : > "$PROBE_SPAWN_LOG"
echo "-- run 1: the review step's executor fails --"
PROBE_MODE=report PROBE_FAIL_STAGE=review node "$CLI" lifecycle run --json \
  | grep -E '"stop"|"action"|"message"' | sed 's/^/    /'
state
echo "-- run 2: resume; review now succeeds --"
PROBE_MODE=report PROBE_RESULT=pass node "$CLI" lifecycle run --json \
  | grep -E '"stop"|"executed"' -A4 | sed 's/^/    /'
state
echo "    validate (a clean walk leaves no undeclared transition):"
node "$CLI" validate 2>&1 | head -1 | sed 's/^/        /'

banner "02e  no executor declared"
fixture_new "$WORK/02e"
read -r I C B <<<"$(fixture_to_brief "$WORK/02e")"
cd "$WORK/02e"
node "$CLI" lifecycle run --json | sed 's/^/    /'

banner "02f  executor: scripted — a value the config schema accepts"
fixture_new "$WORK/02f" --executor scripted
read -r I C B <<<"$(fixture_to_brief "$WORK/02f")"
cd "$WORK/02f"
node "$CLI" validate >/dev/null 2>&1; echo "    validate exit: $?"
node "$CLI" doctor >/dev/null 2>&1; echo "    doctor exit: $?"
node "$CLI" lifecycle run --json | sed 's/^/    /'
echo; echo "WORK=$WORK"
