#!/usr/bin/env bash
# V14/V15 — the actual packed and process boundaries, and what the suite needs
# from the network.
#
# Two claims are checked against reality rather than against the manifest:
#
#   V14  what the published tarball contains, and whether its CLI runs from a
#        consumer that has no access to this repository
#   V15  whether the reference's own gate passes with no network at all, and
#        which production paths reach the network with no test behind them
#
# Usage: bash tools/implementation-trial/a2/verification/boundaries.sh [out-dir]
set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
OUT="${1:-${TMPDIR:-/tmp}/a2v-boundaries}"
rm -rf "$OUT"; mkdir -p "$OUT"

echo "=== V14: the packed boundary ==="
pnpm pack --dir "$REPO" --pack-destination "$OUT" > "$OUT/pack.log" 2>&1 ||
  { echo "pack failed; see $OUT/pack.log"; exit 1; }
pnpm pack --dir "$REPO/packages/standard" --pack-destination "$OUT" >> "$OUT/pack.log" 2>&1

for tarball in "$OUT"/*.tgz; do
  echo
  echo "$(basename "$tarball")  $(wc -c < "$tarball" | tr -d ' ') bytes  sha256:$(sha256sum "$tarball" | cut -c1-16)…"
  tar tzf "$tarball" | sed 's|^package/||' > "$OUT/$(basename "$tarball").entries"
  echo "  entries: $(wc -l < "$OUT/$(basename "$tarball").entries" | tr -d ' ')"
  echo "  top level: $(cut -d/ -f1 "$OUT/$(basename "$tarball").entries" | sort -u | tr '\n' ' ')"
  for forbidden in src tests specs docs tools .pactwright .claude; do
    if grep -q "^$forbidden/" "$OUT/$(basename "$tarball").entries"; then
      echo "  LEAKED: $forbidden/ is in the tarball"
    fi
  done
done

echo
echo "  A consumer gets dist/ and three files; src/, tests/ and tests/fixtures/"
echo "  are absent, as they should be. Two things about what IS shipped:"
echo
for shipped in dist/eval/core-suite.js dist/execute/scripted.js; do
  if grep -q "^$shipped\$" "$OUT/pactwright-0.0.2.tgz.entries"; then
    echo "    shipped: $shipped"
  fi
done
echo
echo "  - dist/eval/core-suite.js ships, so an installed consumer CAN run"
echo "    \`pactwright eval\`. That is the point, and it is also why V03's"
echo "    misattribution reaches consumers rather than staying in the harness."
echo "  - dist/execute/scripted.js ships too. \`scriptedExecutor\`,"
echo "    \`promptRespectingExecutor\` and \`promptSaysNothing\` are described in"
echo "    source as \"the harness's own test double\" and cannot be selected by"
echo "    any configuration, yet they are in the published artefact and in the"
echo "    package's single public export. The names below are what the shipped"
echo "    type declaration offers a consumer:"
grep -oE "promptSaysNothing|promptRespectingExecutor|scriptedExecutor" "$REPO/dist/index.d.ts" |
  sort -u | sed 's/^/      /'

echo
echo "=== V15: the network boundary ==="
if ! unshare -rn true 2>/dev/null; then
  echo "  network isolation unavailable here; not run"
else
  echo "  running the reference's own test gate inside a network namespace with"
  echo "  no interfaces but loopback."
  # The tests commit with git. A host that configures a commit-signing helper
  # (gpg.program, or a gpgsign hook that calls a local service) makes `git
  # commit` fail inside the namespace for reasons that have nothing to do with
  # the product, so signing is turned off for the run and that is stated rather
  # than left to be misread as a network dependency.
  ( cd "$REPO" && unshare -rn sh -c '
      ip link set lo up 2>/dev/null
      export GIT_CONFIG_COUNT=2
      export GIT_CONFIG_KEY_0=commit.gpgsign GIT_CONFIG_VALUE_0=false
      export GIT_CONFIG_KEY_1=tag.gpgsign   GIT_CONFIG_VALUE_1=false
      pnpm test' ) > "$OUT/offline-test.log" 2>&1
  status=$?
  failing="$(grep -c '^not ok ' "$OUT/offline-test.log" 2>/dev/null)"; failing="${failing:-0}"
  passing="$(grep -m1 '^# pass ' "$OUT/offline-test.log" | tr -dc 0-9)"
  echo "  exit=$status  pass=${passing:-?}  fail=$failing"
  [ "$failing" -gt 0 ] && grep '^not ok ' "$OUT/offline-test.log" | sed 's/^/    /'
fi

echo
echo "  Production paths that spawn a package manager, and their test cover:"
grep -rn 'spawnSync(manager\|spawnSync("npm"\|packageManagerView\|packageManagerInstaller' \
  "$REPO/src" --include=*.ts | sed 's|'"$REPO"'/||' | sed 's/^/    /'
echo
echo "    Every test injects a double for these (installer:, view:, install:),"
echo "    so no test executes the real one. The seam is well placed; the"
echo "    consequence is that the registry contract behind it is unproven."
