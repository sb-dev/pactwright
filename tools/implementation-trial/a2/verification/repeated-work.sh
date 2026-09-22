#!/usr/bin/env bash
# V12 — repeated graph and I/O work in one public command.
#
# Measured with `strace`, not inferred: every `openat` and every `execve` a
# command makes is counted, so "the graph is loaded twice" and "git is spawned
# forty-eight times" are observations rather than readings of the source.
#
# Only the built CLI is exercised — `node dist/cli.js <command>` — so the
# numbers describe what a consumer of the published package pays.
#
# Usage: bash tools/implementation-trial/a2/verification/repeated-work.sh [out-dir]
set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
OUT="${1:-${TMPDIR:-/tmp}/a2v-repeated}"
mkdir -p "$OUT"

command -v strace >/dev/null || { echo "strace is required; not run" >&2; exit 2; }
[ -f "$REPO/dist/cli.js" ] || { echo "run pnpm build first" >&2; exit 2; }

paths_opened() { grep -o '"[^"]*"' "$1" | sed 's/"//g'; }

printf '%-34s %8s %8s %8s %8s %8s\n' command graph-nodes distinct edges.yml git-spawns ms
printf '%-34s %8s %8s %8s %8s %8s\n' ---------------------------------- -------- -------- -------- -------- --------

for command in "validate" "doctor" "sync" "lifecycle status" "context intent-quick-start-a1b2"; do
  slug="$(echo "$command" | tr ' ' '-')"
  trace="$OUT/$slug.strace"

  start="$(date +%s%N)"
  ( cd "$REPO" && node dist/cli.js $command ) >/dev/null 2>&1
  ms=$(( ( $(date +%s%N) - start ) / 1000000 ))

  ( cd "$REPO" && strace -f -e trace=openat,execve -o "$trace" node dist/cli.js $command ) >/dev/null 2>&1

  nodes="$(paths_opened "$trace" | grep -cE 'specs/nodes/.*\.md$')"
  distinct="$(paths_opened "$trace" | grep -E 'specs/nodes/.*\.md$' | sort -u | wc -l | tr -d ' ')"
  edges="$(paths_opened "$trace" | grep -c 'specs/graph/edges\.yml$')"
  gits="$(grep -c 'execve("[^"]*git"' "$trace")"

  printf '%-34s %8s %8s %8s %8s %8s\n' "$command" "$nodes" "$distinct" "$edges" "$gits" "$ms"
done

echo
echo "git subprocesses by argument vector — validate:"
grep -o 'execve("[^"]*git", \[[^]]*\]' "$OUT/validate.strace" |
  sed 's/execve("[^"]*", \[//; s/"//g; s/\]$//' | sort | uniq -c | sort -rn

echo
echo "Each row is one identical query, repeated. \`repositoryRevision\`"
echo "(src/graph/repository.ts:136) is a pure function of the working tree at an"
echo "instant and is not memoised; \`validate/kernel.ts:499\` calls it once per"
echo "replay check and \`validate.ts:97\` once more. Every call spawns four git"
echo "processes and \`workingTreeDigest\` hashes the contents of every untracked,"
echo "non-ignored file. The cost is O(graph nodes x working-tree size)."
