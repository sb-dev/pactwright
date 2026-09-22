#!/usr/bin/env bash
# V10 — disposable fault seeds: does each critical proof detect the defect it
# exists for?
#
# `seeds.py` holds the catalogue. Each seed is applied to a COPY of the tree in
# a scratch directory; this checkout is never modified, because the audit
# refuses production changes.
#
# Three verdicts, kept apart on purpose:
#
#   KILLED    at least one test failed — the proof detects its defect
#   SURVIVED  typecheck and the whole suite still pass — nothing proves it
#   REJECTED  `pnpm typecheck` refused the seed, so the tests never judged it
#
# REJECTED is not evidence of test coverage. Counting a compiler rejection as a
# kill is the commonest way a mutation score flatters a suite, so the typecheck
# runs first and its outcome is recorded separately.
#
# Usage: bash tools/implementation-trial/a2/verification/fault-seeds.sh [out-dir] [seed-filter]
#
# `seed-filter` is an optional grep pattern over seed ids, for re-running one
# seed after editing it. The baseline is recomputed either way.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../../../.." && pwd)"
OUT="${1:-${TMPDIR:-/tmp}/a2v-seeds}"
FILTER="${2:-.}"
WORK="$OUT/work"
RESULTS="$OUT/results.tsv"

mkdir -p "$OUT"
printf 'seed\tfile\tverdict\tfailing\tfirst_failure\taimed_at\n' > "$RESULTS"

# One pristine copy, restored between seeds, so dependencies install once.
rm -rf "$WORK"; mkdir -p "$WORK"
git -C "$REPO" archive HEAD | tar -x -C "$WORK"
cp -R "$REPO/node_modules" "$WORK/node_modules"
[ -d "$REPO/packages/standard/node_modules" ] &&
  cp -R "$REPO/packages/standard/node_modules" "$WORK/packages/standard/node_modules"
cp -R "$WORK/src" "$OUT/pristine-src"

# `git archive` produces a tree with no repository, and two tests read the
# repository's own HEAD. Give the copy a real one so the unseeded baseline is
# green; whatever still fails without a seed is subtracted below either way.
git -C "$WORK" init -q
git -C "$WORK" add -A >/dev/null 2>&1
git -C "$WORK" -c user.email=a2v@local -c user.name=a2v commit -qm baseline >/dev/null 2>&1

echo "A2-V fault seeds -> $OUT"
echo

# The unseeded baseline. Any test failing here fails for a reason that is not a
# seed, and counting it as a kill would flatter every seed in the campaign.
( cd "$WORK" && pnpm test ) > "$OUT/baseline.test.log" 2>&1
grep '^not ok ' "$OUT/baseline.test.log" | sed 's/^not ok [0-9]* - //' | sort -u > "$OUT/baseline.failures"
BASELINE_N="$(wc -l < "$OUT/baseline.failures" | tr -d ' ')"
echo "  baseline: $BASELINE_N test(s) already failing without any seed"
[ "$BASELINE_N" -gt 0 ] && sed 's/^/    ignored: /' "$OUT/baseline.failures"
echo

while IFS=$'\t' read -r id file aimed; do
  rm -rf "$WORK/src"; cp -R "$OUT/pristine-src" "$WORK/src"

  if ! python3 "$HERE/seeds.py" "$id" "$WORK" 2>/dev/null; then
    printf '%s\t%s\tNOT-APPLIED\t-\tthe seeded text was not found\t%s\n' "$id" "$file" "$aimed" >> "$RESULTS"
    echo "  $id  NOT-APPLIED"
    continue
  fi

  if ! ( cd "$WORK" && pnpm typecheck ) > "$OUT/$id.typecheck.log" 2>&1; then
    first="$(grep -m1 'error TS' "$OUT/$id.typecheck.log" | sed 's/^.*error /error /' | cut -c1-70)"
    printf '%s\t%s\tREJECTED\t-\t%s\t%s\n' "$id" "$file" "${first:-typecheck failed}" "$aimed" >> "$RESULTS"
    echo "  $id  REJECTED by typecheck — the tests never judged it"
    continue
  fi

  log="$OUT/$id.test.log"
  ( cd "$WORK" && pnpm test ) > "$log" 2>&1
  # Only failures the seed itself caused: the baseline set is subtracted.
  grep '^not ok ' "$log" | sed 's/^not ok [0-9]* - //' | sort -u > "$OUT/$id.failures"
  comm -13 "$OUT/baseline.failures" "$OUT/$id.failures" > "$OUT/$id.caused"
  failing="$(wc -l < "$OUT/$id.caused" | tr -d ' ')"
  first="$(head -1 "$OUT/$id.caused")"
  if [ "$failing" -gt 0 ]; then verdict=KILLED; else verdict=SURVIVED; fi
  printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$id" "$file" "$verdict" "$failing" "${first:--}" "$aimed" >> "$RESULTS"
  echo "  $id  $verdict ($failing failing)  ${first:-}"
done < <(python3 "$HERE/seeds.py" --list | grep -E "$FILTER")

rm -rf "$WORK" "$OUT/pristine-src"

echo
echo "--- results ---"
column -t -s "$(printf '\t')" "$RESULTS" 2>/dev/null || cat "$RESULTS"
echo
awk -F'\t' 'NR>1 {n[$3]++} END {for (v in n) printf "%-12s %d\n", v, n[v]}' "$RESULTS"
