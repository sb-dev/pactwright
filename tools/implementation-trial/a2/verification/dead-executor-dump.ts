/**
 * The table behind V04: which of the core suite's deterministic assertions pass
 * when the executor never ran at all.
 *
 * The candidate is built exactly as `src/cli.ts:920` builds it — `.output` and
 * nothing else — over a `claudeCodeExecutor` whose spawn reports a missing
 * binary. `executor-status.probe.ts` asserts the totals; this prints the detail
 * a reader needs to judge which assertions are vacuous.
 *
 * Usage: node --import tsx tools/implementation-trial/a2/verification/dead-executor-dump.ts
 */
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  CORE_DELIVERY_SUITE,
  claudeCodeExecutor,
  evalPassed,
  parseConfig,
  resolvePack,
  runEval,
} from "../../../../src/index.js";

const REPO = join(import.meta.dirname, "..", "..", "..", "..");

async function main(): Promise<void> {
  const root = mkdtempSync(join(tmpdir(), "a2v-dead-"));
  try {
    const dir = join(root, "pack");
    cpSync(join(REPO, "tests", "fixtures", "packs", "complete"), dir, { recursive: true });
    for (const agent of readdirSync(join(dir, "agents"))) {
      writeFileSync(join(dir, "agents", agent), "You implement the Delivery responsibilities.\n");
    }
    const config = parseConfig(
      {
        version: 1,
        agent_pack: { source: dir },
        adapter: { type: "claude-code" },
        github: { enabled: false },
      },
      "config.yml",
    ).value;
    assert.ok(config !== undefined);
    const pack = resolvePack({ root, config }).value;
    assert.ok(pack !== undefined);

    const executor = claudeCodeExecutor({
      spawn: () => ({ stdout: "", error: "ENOENT", stderr: "command not found: claude" }),
      readPrompt: () => "PROMPT",
    });
    const report = await runEval({
      pack,
      suite: CORE_DELIVERY_SUITE,
      candidate: async (task) => (await executor.invoke({ ...task, label: task.caseId })).output,
    });

    process.stdout.write(
      "A2-V — the core suite with an executor that cannot run\n" +
        "======================================================\n\n" +
        "Candidate: claudeCodeExecutor whose spawn reports ENOENT, adapted the way\n" +
        "src/cli.ts:920 adapts it (`.output` only). Nothing performed any capability.\n\n",
    );
    let passed = 0;
    let total = 0;
    for (const entry of report.cases) {
      const failures = entry.deterministic.filter((a) => !a.passed).length;
      process.stdout.write(
        `${entry.id.padEnd(24)} evaluated=${String(entry.evaluated).padEnd(5)} ` +
          `error=${entry.error ?? "none"}  ${entry.deterministic.length - failures}/${entry.deterministic.length} passed\n`,
      );
      for (const assertion of entry.deterministic) {
        total += 1;
        if (assertion.passed) passed += 1;
        process.stdout.write(
          `    ${assertion.passed ? "PASS" : "FAIL"}  ${assertion.id.padEnd(36)} ${assertion.detail.slice(0, 84)}\n`,
        );
      }
    }
    const vacuous = report.cases
      .filter((entry) => entry.deterministic.every((a) => a.passed))
      .map((entry) => entry.id);
    process.stdout.write(
      `\n${passed} of ${total} deterministic assertions pass when nothing ran.\n` +
        `Wholly vacuous cases: ${vacuous.join(", ")}\n` +
        `evalPassed = ${evalPassed(report)} — and it is false only because other\n` +
        `cases carry positive assertions, not because anything noticed the executor.\n`,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

void main();
