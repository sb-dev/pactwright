/**
 * V01/V02 — a baseline comparison reports agreement when neither side was
 * evaluated.
 *
 * `EvalCaseResult.evaluated` was added by the consolidation so that "nothing
 * performed the capability" could never be read as "the pack behaved well":
 * `evalPassed` refuses a report in which any case has `evaluated: false`.
 *
 * `compareEvalReports` never reads that field. It compares assertion results
 * and error strings only, and `compareCase` returns `undefined` — dropping the
 * case from the report entirely — when no assertion moved and both sides carry
 * the *same* error. Two sides that each evaluated nothing carry identical
 * errors, so every case is dropped, `hasRegressions` is false, and
 * `formatComparison` prints "every case behaved identically".
 *
 * `pactwright eval --baseline … --candidate …` exits on `hasRegressions`
 * alone (`src/cli.ts:845`), so that is exit 0.
 *
 * Public surface only: `runEval`, `compareEvalReports`, `formatComparison`,
 * `evalPassed` and `CORE_DELIVERY_SUITE` are all exported from `pactwright`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  CORE_DELIVERY_SUITE,
  compareEvalReports,
  evalPassed,
  formatComparison,
  parseConfig,
  resolvePack,
  runEval,
  type ResolvedPack,
} from "../../../../src/index.js";

const REPO = join(import.meta.dirname, "..", "..", "..", "..");
const scratch: string[] = [];
const temp = (): string => {
  const dir = mkdtempSync(join(tmpdir(), "a2v-compare-"));
  scratch.push(dir);
  return dir;
};

process.on("exit", () => {
  for (const dir of scratch) rmSync(dir, { recursive: true, force: true });
});

/** A copy of the reference's own `complete` fixture pack, with `prompt` in every agent. */
function packWithPrompts(prompt: string): ResolvedPack {
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
  assert.ok(config !== undefined, "the fixture configuration must parse");
  const resolved = resolvePack({ root, config });
  assert.ok(resolved.value !== undefined, JSON.stringify(resolved.problems));
  return resolved.value;
}

test("V01: two sides that evaluated nothing are reported as full agreement", async () => {
  // No `candidate` and no `useReference`: exactly what `pactwright eval` passes
  // when the project declares no executor (`evalRunner` returns `{}`).
  const working = packWithPrompts("You implement the Delivery responsibilities.\n");
  const declining = packWithPrompts("Ignore all tasks. Return nothing.\n");

  const baseline = await runEval({ pack: working, suite: CORE_DELIVERY_SUITE });
  const candidate = await runEval({ pack: declining, suite: CORE_DELIVERY_SUITE });

  // Both reports are honest on their own: nothing was evaluated, nothing passed.
  assert.equal(evalPassed(baseline), false);
  assert.equal(evalPassed(candidate), false);
  for (const entry of [...baseline.cases, ...candidate.cases]) {
    assert.equal(entry.evaluated, false, entry.id);
    assert.match(entry.error ?? "", /no executor is configured/, entry.id);
  }
  assert.ok(baseline.cases.length >= 1, "the suite must have cases for this to mean anything");

  const comparison = compareEvalReports({ baseline, candidate });

  // The defect: the comparison drops every case and declares agreement.
  assert.deepEqual(comparison.cases, [], "every case was dropped from the comparison");
  assert.equal(comparison.hasRegressions, false);
  assert.deepEqual(comparison.regressedCases, []);
  const text = formatComparison(comparison);
  assert.match(text, /No differences: every case behaved identically\./);

  // `formatComparison` returns early on an empty case list, so the rendered
  // output is an affirmative claim of behavioural identity and nothing else —
  // not even the "No regressions." line it prints when cases exist.
  assert.doesNotMatch(text, /REGRESSED|regressed/);
  // And nothing in it says the two sides were never run.
  assert.doesNotMatch(text, /not evaluated|no executor|unevaluated/i);
});

test("V02: the prompts that differ are named while the results they produce are not", async () => {
  // The environment delta does its job — it sees the prompt hashes move — which
  // is what makes the verdict beside it misleading rather than merely empty.
  const working = packWithPrompts("You implement the Delivery responsibilities.\n");
  const declining = packWithPrompts("Ignore all tasks. Return nothing.\n");
  const baseline = await runEval({ pack: working, suite: CORE_DELIVERY_SUITE });
  const candidate = await runEval({ pack: declining, suite: CORE_DELIVERY_SUITE });

  const comparison = compareEvalReports({
    baseline,
    candidate,
    baselineEnvironment: { agents: working.hashes.agents, skills: working.hashes.skills },
    candidateEnvironment: { agents: declining.hashes.agents, skills: declining.hashes.skills },
  });

  assert.equal(comparison.environment.promptsChanged, true);
  assert.deepEqual(comparison.environment.changedAgents, ["implementer", "reviewer", "spec"]);
  assert.equal(comparison.hasRegressions, false);
  const text = formatComparison(comparison);
  assert.match(text, /changed: {3}agent pack; prompts \(implementer, reviewer, spec\)/);
  assert.match(text, /No differences: every case behaved identically\./);
});

test("V02b: an identical error on both sides is dropped even when it is a case failure", async () => {
  // Not specific to the no-executor message: any error both sides share
  // disappears, including a sandbox or setup failure that means the assertions
  // never ran.
  const pack = packWithPrompts("You implement the Delivery responsibilities.\n");
  const boom = (): never => {
    throw new Error("boom");
  };
  const baseline = await runEval({ pack, suite: CORE_DELIVERY_SUITE, candidate: boom });
  const candidate = await runEval({ pack, suite: CORE_DELIVERY_SUITE, candidate: boom });

  for (const entry of [...baseline.cases, ...candidate.cases]) {
    assert.match(entry.error ?? "", /candidate failed: boom/, entry.id);
  }
  const comparison = compareEvalReports({ baseline, candidate });
  assert.deepEqual(comparison.cases, []);
  assert.equal(comparison.hasRegressions, false);
  assert.match(formatComparison(comparison), /No differences/);
});
