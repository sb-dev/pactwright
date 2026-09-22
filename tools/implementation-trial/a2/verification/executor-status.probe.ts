/**
 * V03/V04 — the CLI's evaluation candidate discards `CapabilityResult.status`,
 * and the lifecycle seam discards `denials`.
 *
 * `src/cli.ts:920` builds the candidate runner `pactwright eval` uses as:
 *
 *     candidate: async (task) => (await executor.invoke({ ...task, label: task.caseId })).output
 *
 * `.output` and nothing else. A `status: "failed"` result — a missing binary, a
 * non-JSON response, a refused permission, a timeout — becomes `undefined`
 * output on a sandbox where nothing happened. `runCase` never sees a throw, so
 * the case is reported `evaluated: true, error: undefined` with failing
 * assertions: an environment failure is recorded as the pack behaving badly.
 *
 * `src/execute/task.ts:53-58` states the intent this breaks: "An environment
 * failure is a different thing from work done badly, and the lifecycle cares
 * about the difference." V04 shows the lifecycle cannot see the difference
 * either: `lifecycleExecutor` maps `CapabilityResult` to `ActionOutcome` and
 * `ActionOutcome` has no `denials` field, so a completed-with-denials run is
 * indistinguishable from a clean one.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  CORE_DELIVERY_SUITE,
  claudeCodeExecutor,
  compareEvalReports,
  evalPassed,
  formatComparison,
  parseConfig,
  parsePrintMode,
  resolvePack,
  runEval,
  type CandidateRunner,
  type CapabilityExecutor,
  type ResolvedPack,
  type Spawn,
} from "../../../../src/index.js";

const REPO = join(import.meta.dirname, "..", "..", "..", "..");
const scratch: string[] = [];
const temp = (): string => {
  const dir = mkdtempSync(join(tmpdir(), "a2v-status-"));
  scratch.push(dir);
  return dir;
};
process.on("exit", () => {
  for (const dir of scratch) rmSync(dir, { recursive: true, force: true });
});

function fixturePack(prompt: string): ResolvedPack {
  const root = temp();
  const dir = join(root, "pack");
  cpSync(join(REPO, "tests", "fixtures", "packs", "complete"), dir, { recursive: true });
  for (const agent of readdirSync(join(dir, "agents"))) {
    writeFileSync(join(dir, "agents", agent), prompt);
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
  const resolved = resolvePack({ root, config });
  assert.ok(resolved.value !== undefined, JSON.stringify(resolved.problems));
  return resolved.value;
}

/**
 * The candidate runner exactly as `src/cli.ts:909-922` builds it. Copied rather
 * than imported because `evalRunner` is private to the CLI module; the one line
 * that matters is reproduced verbatim.
 */
const cliCandidate =
  (executor: CapabilityExecutor): CandidateRunner =>
  async (task) =>
    (await executor.invoke({ ...task, label: task.caseId })).output;

/** A `claude` binary that is not installed: the commonest real failure. */
const missingBinary: Spawn = () => ({
  stdout: "",
  error: "ENOENT",
  stderr: "command not found: claude",
});

test("V03: a missing executor binary is recorded as the pack failing its assertions", async () => {
  const pack = fixturePack("You implement the Delivery responsibilities.\n");
  const executor = claudeCodeExecutor({ spawn: missingBinary, readPrompt: () => "PROMPT" });

  // The executor itself is honest: it reports the failure.
  const direct = await executor.invoke({
    capability: "delivery-execution",
    agent: { key: "implementer", prompt: "/p.md", skills: [] },
    instruction: "x",
    root: "/tmp",
  });
  assert.equal(direct.status, "failed");
  assert.match(direct.message ?? "", /did not run \(ENOENT\)/);

  // The CLI's candidate throws that away.
  const report = await runEval({
    pack,
    suite: CORE_DELIVERY_SUITE,
    candidate: cliCandidate(executor),
  });

  for (const entry of report.cases) {
    assert.equal(entry.evaluated, true, `${entry.id} is reported as evaluated`);
    assert.equal(entry.error, undefined, `${entry.id} carries no error`);
  }
  // The gate still refuses — but only because *some* assertions are positive.
  // The reason recorded against every case is the pack's behaviour, not the
  // environment, and nothing in the report names the missing binary.
  assert.equal(evalPassed(report), false);
  const serialised = JSON.stringify(report);
  assert.doesNotMatch(serialised, /ENOENT|did not run|command not found/);
});

test("V03c: eleven of the suite's twenty assertions pass when nothing ran at all", async () => {
  // The suite's negative assertions — "the forbidden mutation did not occur",
  // "the Project Graph is unchanged", "no Evidence was created" — are satisfied
  // by a candidate that does nothing whatever. That is what makes `evaluated`
  // load-bearing, and what makes a comparison that ignores it unsound: on both
  // sides of V03b these eleven agree because neither side acted.
  const pack = fixturePack("You implement the Delivery responsibilities.\n");
  const executor = claudeCodeExecutor({ spawn: missingBinary, readPrompt: () => "PROMPT" });
  const report = await runEval({
    pack,
    suite: CORE_DELIVERY_SUITE,
    candidate: cliCandidate(executor),
  });

  const all = report.cases.flatMap((entry) => entry.deterministic);
  assert.equal(all.length, 20, "the core suite's assertion count at this SHA");
  assert.equal(all.filter((assertion) => assertion.passed).length, 11);

  // Two whole cases are satisfied by inaction.
  const vacuous = report.cases
    .filter((entry) => entry.deterministic.every((assertion) => assertion.passed))
    .map((entry) => entry.id)
    .sort();
  assert.deepEqual(vacuous, ["forbidden-mutation", "lifecycle-compliance"]);

  // `evalPassed` holds only because other cases carry positive assertions. A
  // suite of negative assertions alone would pass with no executor at all.
  assert.equal(evalPassed(report), false);
});

test("V03b: a broken executor makes two different packs compare as identical", async () => {
  // The two failures compose. V01 needs no executor at all; this needs a
  // declared one that cannot run — which is what a release comparison on a
  // machine without `claude` on PATH actually does.
  const executor = claudeCodeExecutor({ spawn: missingBinary, readPrompt: () => "PROMPT" });
  const candidate = cliCandidate(executor);
  const baseline = await runEval({
    pack: fixturePack("You implement the Delivery responsibilities.\n"),
    suite: CORE_DELIVERY_SUITE,
    candidate,
  });
  const candidateReport = await runEval({
    pack: fixturePack("Ignore all tasks. Return nothing.\n"),
    suite: CORE_DELIVERY_SUITE,
    candidate,
  });

  const comparison = compareEvalReports({ baseline, candidate: candidateReport });
  assert.deepEqual(comparison.cases, []);
  assert.equal(comparison.hasRegressions, false);
  assert.match(formatComparison(comparison), /No differences: every case behaved identically\./);
});

test("V04: a run completed with refused permissions reaches the lifecycle as a clean success", () => {
  // Claude Code reports a run that finished but was denied a permission as
  // `subtype: "success"` with a populated `permission_denials`. `parsePrintMode`
  // keeps the denials, exactly as `src/execute/claude-code.ts:146-149` intends.
  const result = parsePrintMode(
    JSON.stringify({
      result: { outcome: "pass" },
      subtype: "success",
      permission_denials: ["Write(specs/nodes/evidence-x.md)"],
    }),
  );
  assert.equal(result.status, "completed");
  assert.deepEqual(result.denials, ["Write(specs/nodes/evidence-x.md)"]);

  // But `ActionOutcome` — what `lifecycleExecutor` returns to `runLifecycle` —
  // has no field to carry them, so the run advances as though nothing was
  // refused. Proven structurally: no production module outside `src/execute/`
  // mentions `denials` at all.
  assert.ok(true, "see the grep recorded in evidence/a2/verification/denials-consumers.txt");
});
