import { test } from "node:test";
import assert from "node:assert/strict";
import { compareEvalReports, formatComparison } from "../src/eval/compare.js";
import type { EvalCaseResult, EvalReport } from "../src/eval/runner.js";

const PACK = { name: "@pactwright/standard", version: "0.0.1", hash: `sha256:${"a".repeat(64)}` };

function caseResult(
  id: string,
  capability: string,
  agent: string,
  assertions: Record<string, boolean>,
  error?: string,
): EvalCaseResult {
  return {
    id,
    title: id,
    capability,
    agent,
    ...(error === undefined ? {} : { error }),
    evaluated: true,
    deterministic: Object.entries(assertions).map(([key, passed]) => ({
      id: key,
      description: key,
      passed,
      detail: passed ? "ok" : `${key} failed`,
    })),
    semantic: [],
  };
}

const report = (cases: readonly EvalCaseResult[], pack: EvalReport["pack"] = PACK): EvalReport => ({
  suite: "core-delivery",
  runtime: "0.0.1",
  pack,
  cases,
});

test("compare: an unchanged candidate correctly reports no regressions", () => {
  const cases = [
    caseResult("contract-fidelity", "delivery-execution", "implementer", { fidelity: true }),
    caseResult("brief-quality", "delivery-specification", "spec", { structure: true }),
  ];
  const comparison = compareEvalReports({ baseline: report(cases), candidate: report(cases) });
  assert.equal(comparison.hasRegressions, false);
  assert.deepEqual(comparison.cases, [], "identical runs produce no case rows");
  assert.equal(comparison.environment.packChanged, false);
  assert.match(formatComparison(comparison), /No differences/);
});

test("compare: a regression is visible at capability, agent and case", () => {
  const baseline = report([
    caseResult("evidence-accuracy", "delivery-execution", "implementer", {
      "evidence-claims-match-repository": true,
      "evidence-output-structured": true,
    }),
    caseResult("brief-quality", "delivery-specification", "spec", { structure: true }),
  ]);
  const candidate = report([
    caseResult("evidence-accuracy", "delivery-execution", "implementer", {
      "evidence-claims-match-repository": false,
      "evidence-output-structured": true,
    }),
    caseResult("brief-quality", "delivery-specification", "spec", { structure: true }),
  ]);
  const comparison = compareEvalReports({ baseline, candidate });
  assert.equal(comparison.hasRegressions, true);
  assert.deepEqual(comparison.regressedCapabilities, ["delivery-execution"]);
  assert.deepEqual(comparison.regressedAgents, ["implementer"]);
  assert.deepEqual(comparison.regressedCases, ["evidence-accuracy"]);
  // The unaffected case is not reported as changed.
  assert.deepEqual(
    comparison.cases.map((entry) => entry.caseId),
    ["evidence-accuracy"],
  );
  const delta = comparison.cases[0]!.assertions.find(
    (a) => a.id === "evidence-claims-match-repository",
  )!;
  assert.equal(delta.movement, "regressed");
  assert.equal(delta.detail, "evidence-claims-match-repository failed");

  const text = formatComparison(comparison);
  assert.match(
    text,
    /REGRESSED evidence-accuracy \(capability delivery-execution, agent implementer\)/,
  );
  assert.match(text, /Regressions by capability: delivery-execution/);
  assert.doesNotMatch(text, /score/i, "no aggregate score is computed");
});

test("compare: a lifecycle-compliance regression surfaces at its own dimensions", () => {
  const baseline = report([
    caseResult("lifecycle-compliance", "delivery-execution", "implementer", {
      "no-evidence-before-review": true,
    }),
  ]);
  const candidate = report([
    caseResult("lifecycle-compliance", "delivery-execution", "implementer", {
      "no-evidence-before-review": false,
    }),
  ]);
  const comparison = compareEvalReports({ baseline, candidate });
  assert.deepEqual(comparison.regressedCases, ["lifecycle-compliance"]);
  assert.match(formatComparison(comparison), /regressed no-evidence-before-review/);
});

test("compare: a fix is reported as a fix, not a regression", () => {
  const baseline = report([
    caseResult("scope-discipline", "delivery-execution", "implementer", { scoped: false }),
  ]);
  const candidate = report([
    caseResult("scope-discipline", "delivery-execution", "implementer", { scoped: true }),
  ]);
  const comparison = compareEvalReports({ baseline, candidate });
  assert.equal(comparison.hasRegressions, false);
  assert.equal(comparison.cases[0]?.fixed, true);
  assert.equal(comparison.cases[0]?.assertions[0]?.movement, "fixed");
});

test("compare: a case that errors only on the candidate side is a regression", () => {
  const baseline = report([
    caseResult("review-defect-detection", "delivery-review", "reviewer", { findings: true }),
  ]);
  const candidate = report([
    caseResult("review-defect-detection", "delivery-review", "reviewer", {}, "case failed: boom"),
  ]);
  const comparison = compareEvalReports({ baseline, candidate });
  assert.equal(comparison.hasRegressions, true);
  assert.equal(comparison.cases[0]?.errorChanged?.candidate, "case failed: boom");
  assert.match(formatComparison(comparison), /error: none -> case failed: boom/);
});

test("compare: changed prompts and direct skills are named in the environment delta", () => {
  const cases = [caseResult("contract-fidelity", "delivery-execution", "implementer", { f: true })];
  const comparison = compareEvalReports({
    baseline: report(cases),
    candidate: report(cases, { ...PACK, version: "0.0.2", hash: `sha256:${"b".repeat(64)}` }),
    baselineEnvironment: { agents: { spec: "h1", implementer: "h2" }, skills: { writing: "s1" } },
    candidateEnvironment: { agents: { spec: "h1", implementer: "h9" }, skills: { writing: "s2" } },
  });
  assert.equal(comparison.environment.packChanged, true);
  assert.equal(comparison.environment.promptsChanged, true);
  assert.deepEqual(comparison.environment.changedAgents, ["implementer"]);
  assert.equal(comparison.environment.skillsChanged, true);
  assert.deepEqual(comparison.environment.changedSkills, ["writing"]);
  const text = formatComparison(comparison);
  assert.match(text, /prompts \(implementer\)/);
  assert.match(text, /direct skills \(writing\)/);
});

test("compare: a case added or removed between runs is reported, not silently dropped", () => {
  const baseline = report([
    caseResult("contract-fidelity", "delivery-execution", "implementer", { f: true }),
  ]);
  const candidate = report([
    caseResult("contract-fidelity", "delivery-execution", "implementer", { f: true }),
    caseResult("lifecycle-compliance", "delivery-execution", "implementer", { compliance: true }),
  ]);
  const comparison = compareEvalReports({ baseline, candidate });
  assert.deepEqual(
    comparison.cases.map((entry) => entry.caseId),
    ["lifecycle-compliance"],
  );
  assert.equal(comparison.cases[0]?.assertions[0]?.movement, "added");
  assert.equal(comparison.hasRegressions, false, "a new passing case is not a regression");
});
