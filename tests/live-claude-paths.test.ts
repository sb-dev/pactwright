import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { it } from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../scripts/live-claude-paths.mjs", import.meta.url));
const select = (paths: string[]): string => {
  const result = spawnSync(process.execPath, [script], {
    input: paths.join("\0") + "\0",
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
};

it("unrelated docs, runtime, offline tests and skills do not select paid checks", () => {
  assert.equal(select([]), "live=false\n");
  assert.equal(
    select([
      "docs/research-logs/example.md",
      "src/index.ts",
      "tests/build-root.test.ts",
      "tools/checkpoint-harness/test/checkpoint-harness-h3.test.ts",
      ".claude/skills/node/SKILL.md",
    ]),
    "live=false\n",
  );
});

it("each live-test dependency selects paid checks, including deleted or renamed paths", () => {
  for (const path of [
    "tools/checkpoint-harness/src/claude.ts",
    "tools/checkpoint-harness/src/workspace.ts",
    "tools/checkpoint-harness/test/live/checkpoint-harness-claude.test.ts",
    "tools/checkpoint-harness/test/fixtures/checkpoint-harness/checkpoint.yml",
    "tools/checkpoint-harness/test/verification-fixtures.ts",
    ".claude/skills/karpathy-guidelines/SKILL.md",
    ".claude/skills/code-review-and-quality/SKILL.md",
    "docs/checkpoints/contract.schema.json",
    "tools/checkpoint-harness/package.json",
    "tools/checkpoint-harness/tsconfig.json",
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    ".npmrc",
    "tsconfig.json",
    ".github/workflows/checkpoint-harness-verify.yml",
    "scripts/live-claude-paths.mjs",
  ]) {
    assert.equal(select(["docs/example.md", path]), "live=true\n", path);
  }
});
