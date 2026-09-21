#!/usr/bin/env bash
# A2-L probe 01 — Evidence closure over unreviewed content, and the
# advertised Evidence correction. Public CLI only.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/lib/fixture.sh"
set +e   # probes assert on non-zero exits; they must not abort on them
WORK="${WORK:-$(mktemp -d)}"

banner() { printf '\n=== %s ===\n' "$1"; }

banner "01a  repository with NO resolvable revision (git repo, no commits)"
fixture_new "$WORK/01a" --no-commit
read -r I C B <<<"$(fixture_to_brief "$WORK/01a")"
cd "$WORK/01a"
node "$CLI" lifecycle record delivery --file "$(printf 'intent: %s\n' "$B" | record_input)" >/dev/null
node "$CLI" lifecycle record review   --file "$(printf 'intent: %s\noutcome: pass\n' "$B" | record_input)" >/dev/null
echo "run state after Delivery+Review:"; sed 's/^/    /' .pactwright/execution/*.yml
echo "--> now add a file that NO Review has seen"
mkdir -p src && echo 'export const backdoor = () => process.env.SECRET;' > src/backdoor.ts
node "$CLI" lifecycle record prepare-evidence \
  --file "$(printf 'brief: %s\ntitle: Delivered\nbody: |\n  Added the endpoint.\n' "$B" | record_input)"
echo "prepare-evidence exit: $?"
echo "closure block written:"; sed -n '/^closure:/,/^---/p' specs/nodes/evidence-*.md | sed 's/^/    /'
node "$CLI" validate | head -2 | sed 's/^/    /'
echo "unreviewed file still present: $(ls src/backdoor.ts)"

banner "01b  POSITIVE CONTROL — same sequence in a repository with commits"
fixture_new "$WORK/01b"
read -r I C B <<<"$(fixture_to_brief "$WORK/01b")"
cd "$WORK/01b"
mkdir -p src && echo 'export const healthz = () => ({ status: "ok" });' > src/healthz.ts
node "$CLI" lifecycle record delivery --file "$(printf 'intent: %s\n' "$B" | record_input)" >/dev/null
node "$CLI" lifecycle record review   --file "$(printf 'intent: %s\noutcome: pass\n' "$B" | record_input)" >/dev/null
echo "--> add a file that no Review has seen"
echo 'export const backdoor = () => process.env.SECRET;' > src/backdoor.ts
node "$CLI" lifecycle record prepare-evidence \
  --file "$(printf 'brief: %s\ntitle: Delivered\nbody: |\n  Added the endpoint.\n' "$B" | record_input)"
echo "prepare-evidence exit: $?  (expected 1 — the drift guard fires)"
ls specs/nodes/ | grep -c evidence || echo "    evidence nodes: 0"

banner "01c  POSITIVE CONTROL — an honest closure of a reviewed tree"
cd "$WORK/01b"; rm -f src/backdoor.ts
node "$CLI" lifecycle record prepare-evidence \
  --file "$(printf 'brief: %s\ntitle: Delivered\nbody: |\n  Added the endpoint.\n' "$B" | record_input)"
echo "prepare-evidence exit: $?  (expected 0)"

banner "01d  advertised Evidence correction on a done lineage (Core §45)"
cd "$WORK/01b"
node "$CLI" lifecycle status | grep -E 'state:|permitted:' | sed 's/^/    /'
node "$CLI" lifecycle record prepare-evidence \
  --file "$(printf 'brief: %s\ntitle: Delivered corrected\nbody: |\n  Correction: 11 passed, 1 skipped.\n' "$B" | record_input)"
echo "correction exit: $?  (expected 0)"
grep -c supersedes specs/graph/edges.yml | sed 's/^/    supersedes edges: /'
node "$CLI" validate | head -1 | sed 's/^/    /'
echo; echo "WORK=$WORK"
