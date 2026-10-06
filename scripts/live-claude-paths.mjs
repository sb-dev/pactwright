import { readFileSync } from "node:fs";
import process from "node:process";

// NUL-delimited git paths include deletions and both sides of renames.
// Keep the repository gate broad; only this list selects paid provider work.
const prefixes = [
  "tools/checkpoint-harness/src/",
  "tools/checkpoint-harness/test/live/",
  "tools/checkpoint-harness/test/fixtures/",
  ".claude/skills/karpathy-guidelines/",
  ".claude/skills/code-review-and-quality/",
];
const files = new Set([
  ".github/workflows/checkpoint-harness-verify.yml",
  "scripts/live-claude-paths.mjs",
  "docs/checkpoints/contract.schema.json",
  "tools/checkpoint-harness/test/verification-fixtures.ts",
  "tools/checkpoint-harness/package.json",
  "tools/checkpoint-harness/tsconfig.json",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  ".npmrc",
  "tsconfig.json",
]);
const paths = readFileSync(0, "utf8").split("\0");
process.stdout.write(
  `live=${paths.some((path) => files.has(path) || prefixes.some((prefix) => path.startsWith(prefix)))}\n`,
);
