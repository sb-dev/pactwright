#!/usr/bin/env bash
# A2-L probe suite. Runs every probe against a built checkout of the pinned
# reference and writes one evidence log.
#
#   pnpm install --frozen-lockfile && pnpm build
#   bash tools/implementation-trial/a2/lifecycle/run-all.sh
#
# Every probe drives the product through its public surface (`pactwright`
# CLI, or the exported lifecycle/executor functions). The only thing replaced
# anywhere is the external `claude` process (lib/bin/claude). No probe
# creates Evidence, writes execution state or repairs anything for the
# product: where a probe needs a lineage it records one through
# `lifecycle record`, exactly as an adapter command would.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../../../.." && pwd)"
export CLI="${CLI:-$REPO/dist/cli.js}"
[ -f "$CLI" ] || { echo "build first: pnpm build"; exit 2; }

WORK="${WORK:-$(mktemp -d -t a2l-XXXXXX)}"
LOG="${LOG:-$WORK/evidence.log}"
export WORK
{
  echo "A2-L lifecycle probe suite"
  echo "checkout:  $(git -C "$REPO" rev-parse HEAD)"
  echo "reference: $(git -C "$REPO" rev-parse HEAD:src) (src tree; the pinned reference's src tree is ea6a948d0b1a84ceb3f8690396a8c1f554e91c43)"
  echo "node:      $(node --version)"
  echo "platform:  $(uname -srm)"
  echo "date:      $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "work:      $WORK"
  for probe in probe-01-closure.sh probe-02-run-loop.sh probe-03-gates-state.sh \
               probe-04-responsibilities.sh probe-06-permitted.sh; do
    printf '\n\n########## %s ##########\n' "$probe"
    WORK="$WORK/${probe%.sh}" bash "$HERE/$probe" 2>&1
  done
  printf '\n\n########## probe-05-executor.ts ##########\n'
  # Needs a project with a resolvable agent pack; 02a is one.
  "$REPO/node_modules/.bin/tsx" "$HERE/probe-05-executor.ts" \
    "$WORK/probe-02-run-loop/02a" 2>&1
} | tee "$LOG"
echo
echo "evidence log: $LOG"
