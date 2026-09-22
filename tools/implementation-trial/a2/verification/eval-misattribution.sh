#!/usr/bin/env bash
# V03 end to end — `pactwright eval` with a declared executor that cannot run
# attributes the result to the Agent Pack and never mentions the executor.
#
# A disposable project is created with `execution.executor: claude-code` and the
# binary made unresolvable, which is what a consumer who configured the executor
# but has not installed the tool actually has. The probe records the command's
# own output; no product capability is supplied and no missing tool is called a
# successful reproduction.
#
# Usage: bash tools/implementation-trial/a2/verification/eval-misattribution.sh [out-dir]
set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
OUT="${1:-${TMPDIR:-/tmp}/a2v-misattribution}"
mkdir -p "$OUT"
NODE="$(command -v node)"
[ -f "$REPO/dist/cli.js" ] || { echo "run pnpm build first" >&2; exit 2; }

# An empty bin directory as the whole PATH: `claude` cannot be resolved, and the
# executor's own spawn reports that. Leaving the real PATH in place would invoke
# the tool for real, which is a different experiment and costs money.
EMPTY="$OUT/empty-bin"
mkdir -p "$EMPTY"

ROOT="$(cd "$REPO" && "$NODE" --import tsx -e '
  import { makeTempProject } from "./tests/helpers.js";
  import { appendFileSync } from "node:fs";
  import { join } from "node:path";
  const root = makeTempProject({});
  appendFileSync(join(root, ".pactwright", "config.yml"), "\nexecution:\n  executor: claude-code\n");
  process.stdout.write(root);
')"
trap 'rm -rf "$ROOT"' EXIT
echo "project: $ROOT"
echo "declared executor: $(grep -A1 '^execution:' "$ROOT/.pactwright/config.yml" | tail -1)"
echo

( cd "$ROOT" && env -i PATH="$EMPTY" HOME="$HOME" "$NODE" "$REPO/dist/cli.js" eval ) \
  > "$OUT/eval.txt" 2>&1
echo "exit=$?" >> "$OUT/eval.txt"
( cd "$ROOT" && env -i PATH="$EMPTY" HOME="$HOME" "$NODE" "$REPO/dist/cli.js" eval --json ) \
  > "$OUT/eval.json" 2>&1

echo "--- the last four lines of the human-readable report ---"
tail -4 "$OUT/eval.txt"
echo
echo "--- what --json knows that the report does not ---"
"$NODE" -e '
  const report = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
  for (const entry of report.cases) {
    const passed = entry.deterministic.filter((a) => a.passed).length;
    console.log(
      `  ${entry.id.padEnd(24)} evaluated=${String(entry.evaluated).padEnd(5)} ` +
        `error=${entry.error ?? "none"}  assertions ${passed}/${entry.deterministic.length} passed`,
    );
  }
' "$OUT/eval.json"
echo
echo "--- does any output name the executor failure? ---"
if grep -qiE "ENOENT|did not run|executor|claude" "$OUT/eval.txt"; then
  grep -inE "ENOENT|did not run|executor|claude" "$OUT/eval.txt" | sed 's/^/    /'
else
  echo "    no: the report names neither the executor nor its failure."
fi
