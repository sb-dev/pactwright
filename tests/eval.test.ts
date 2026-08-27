import { after, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { parseConfig, type PactwrightConfig } from "../src/config/config.js";
import { CORE_CAPABILITIES } from "../src/pack/capabilities.js";
import { resolvePack, type ResolvedPack } from "../src/pack/resolve.js";
import { CORE_DELIVERY_SUITE } from "../src/eval/core-suite.js";
import { evalPassed, runEval, type EvalReport } from "../src/eval/runner.js";
import { diffSnapshots, snapshotFiles } from "../src/eval/sandbox.js";
import type { EvalCase } from "../src/eval/case.js";
import { runtimeVersion } from "../src/version.js";
import { loadProject } from "../src/loader.js";
import { makeTempProject, repoRoot } from "./helpers.js";

const dirs: string[] = [];
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});
function temp(options: Parameters<typeof makeTempProject>[0] = {}): string {
  const dir = makeTempProject(options);
  dirs.push(dir);
  return dir;
}

const config: PactwrightConfig = parseConfig(
  {
    version: 1,
    agent_pack: { source: "@pactwright/standard" },
    adapter: { type: "claude-code" },
    github: { enabled: false },
  },
  "config.yml",
).value!;

const standardPack: ResolvedPack = resolvePack({ root: repoRoot, config }).value!;

const one = (evalCase: EvalCase) => ({ name: "one-case", cases: [evalCase] });

// ---- suite shape ------------------------------------------------------------

test("suite: covers exactly the five Step 12 concerns against core capabilities", () => {
  assert.equal(CORE_DELIVERY_SUITE.name, "core-delivery");
  assert.deepEqual(
    CORE_DELIVERY_SUITE.cases.map((c) => c.id),
    [
      "contract-fidelity",
      "scope-discipline",
      "graph-output-structure",
      "forbidden-mutation",
      "review-defect-detection",
    ],
  );
  for (const evalCase of CORE_DELIVERY_SUITE.cases) {
    assert.ok((CORE_CAPABILITIES as readonly string[]).includes(evalCase.capability), evalCase.id);
    assert.ok(evalCase.deterministic.length > 0, `${evalCase.id} has deterministic assertions`);
    assert.ok(evalCase.violations.length > 0, `${evalCase.id} has violation candidates`);
    const assertionIds = evalCase.deterministic.map((a) => a.id);
    assert.equal(new Set(assertionIds).size, assertionIds.length, `${evalCase.id} unique ids`);
    for (const violation of evalCase.violations) {
      assert.ok(violation.breaks.length > 0, `${evalCase.id}/${violation.id} breaks something`);
      for (const target of violation.breaks) {
        assert.ok(
          assertionIds.includes(target),
          `${evalCase.id}/${violation.id} targets known assertion "${target}"`,
        );
      }
    }
    // Every deterministic assertion is caught by at least one violation candidate.
    for (const id of assertionIds) {
      assert.ok(
        evalCase.violations.some((violation) => violation.breaks.includes(id)),
        `${evalCase.id}: assertion "${id}" has a violation proving it detects its violation`,
      );
    }
  }
});

test("suite: deterministic assertions and semantic dimensions are separate channels", () => {
  const forbidden = CORE_DELIVERY_SUITE.cases.find((c) => c.id === "forbidden-mutation")!;
  // Forbidden mutation is purely mechanical — no semantic dimension at all.
  assert.deepEqual(forbidden.semantic, []);
  for (const evalCase of CORE_DELIVERY_SUITE.cases) {
    const deterministicIds = new Set(evalCase.deterministic.map((a) => a.id));
    for (const dimension of evalCase.semantic) {
      assert.ok(!deterministicIds.has(dimension.id), `${evalCase.id}/${dimension.id} not shared`);
    }
  }
});

// ---- reference run ----------------------------------------------------------

test("runEval: the reference candidates pass every deterministic assertion", async () => {
  const report = await runEval({ pack: standardPack, suite: CORE_DELIVERY_SUITE });
  assert.equal(report.suite, "core-delivery");
  assert.equal(report.runtime, runtimeVersion());
  assert.equal(report.pack.name, "@pactwright/standard");
  assert.equal(report.pack.hash, standardPack.hashes.pack);
  assert.equal(report.cases.length, 5);
  assert.equal(evalPassed(report), true);
  const agents = Object.fromEntries(report.cases.map((c) => [c.capability, c.agent]));
  assert.deepEqual(agents, {
    "delivery-execution": "implementer",
    "delivery-specification": "spec",
    "delivery-review": "reviewer",
  });
  for (const entry of report.cases) {
    assert.equal(entry.error, undefined);
    for (const assertion of entry.deterministic) assert.equal(assertion.passed, true, assertion.id);
  }
});

test("runEval: semantic dimensions stay unjudged without a judge and carry no score", async () => {
  const report = await runEval({ pack: standardPack, suite: CORE_DELIVERY_SUITE });
  const dimensions = report.cases.flatMap((entry) => entry.semantic);
  assert.ok(dimensions.length > 0);
  for (const dimension of dimensions) {
    assert.equal(dimension.judged, false);
    assert.match(dimension.reason!, /no semantic judge configured/);
    assert.equal(dimension.verdict, undefined);
  }
  // No aggregate quality score anywhere in the report (Distribution §16).
  const scan = (value: unknown): void => {
    if (Array.isArray(value)) return value.forEach(scan);
    if (value === null || typeof value !== "object") return;
    for (const [key, member] of Object.entries(value)) {
      assert.ok(!/score|grade|rating/i.test(key), `no aggregate field "${key}"`);
      scan(member);
    }
  };
  scan(report);
  // The report is a plain generated artefact: it round-trips through JSON.
  assert.deepEqual(JSON.parse(JSON.stringify(report)) as EvalReport, report);
});

test("runEval: cases run in throw-away sandboxes that are removed afterwards", async () => {
  const roots: string[] = [];
  await runEval({
    pack: standardPack,
    suite: CORE_DELIVERY_SUITE,
    candidate: (task) => {
      roots.push(task.root);
      assert.ok(existsSync(path.join(task.root, ".pactwright", "config.yml")));
      // The sandbox is a loadable Pactwright project selecting the pack under evaluation.
      const project = loadProject({ root: task.root });
      assert.equal(project.config.agentPack.source, standardPack.dir);
      assert.equal(
        task.agent.prompt,
        path.join(standardPack.dir, "agents", `${task.agent.key}.md`),
      );
      return undefined;
    },
  });
  assert.equal(roots.length, 5);
  assert.equal(new Set(roots).size, 5);
  for (const root of roots) assert.ok(!existsSync(root), `${root} removed`);
});

// ---- violations -------------------------------------------------------------

for (const evalCase of CORE_DELIVERY_SUITE.cases) {
  for (const violation of evalCase.violations) {
    test(`violation: ${evalCase.id}/${violation.id} is caught by ${violation.breaks.join(", ")}`, async () => {
      const report = await runEval({
        pack: standardPack,
        suite: one(evalCase),
        candidate: (task) => violation.run(task.root),
      });
      assert.equal(evalPassed(report), false);
      const results = new Map(report.cases[0]!.deterministic.map((a) => [a.id, a.passed]));
      for (const target of violation.breaks) {
        assert.equal(results.get(target), false, `assertion "${target}" fails the violation`);
      }
    });
  }
}

// ---- seams ------------------------------------------------------------------

test("runEval: a semantic judge fills the semantic channel without touching deterministic results", async () => {
  const judged: string[] = [];
  const report = await runEval({
    pack: standardPack,
    suite: CORE_DELIVERY_SUITE,
    judge: ({ caseId, dimension }) => {
      judged.push(`${caseId}/${dimension.id}`);
      return { verdict: "acceptable", rationale: "judged by the test judge" };
    },
  });
  assert.equal(evalPassed(report), true);
  for (const entry of report.cases) {
    for (const dimension of entry.semantic) {
      assert.equal(dimension.judged, true);
      assert.equal(dimension.verdict, "acceptable");
      assert.equal(dimension.reason, undefined);
    }
  }
  assert.equal(judged.length, report.cases.flatMap((entry) => entry.semantic).length);
});

test("runEval: a failing candidate is reported as a case error, not a crash", async () => {
  const evalCase = CORE_DELIVERY_SUITE.cases[0]!;
  const report = await runEval({
    pack: standardPack,
    suite: one(evalCase),
    candidate: () => {
      throw new Error("candidate exploded");
    },
  });
  assert.equal(evalPassed(report), false);
  assert.match(report.cases[0]!.error!, /candidate failed: candidate exploded/);
  assert.deepEqual(report.cases[0]!.deterministic, []);
});

test("sandbox: snapshots record symlinks without following them", () => {
  const outside = mkdtempSync(path.join(tmpdir(), "pactwright-eval-outside-"));
  const root = mkdtempSync(path.join(tmpdir(), "pactwright-eval-root-"));
  dirs.push(outside, root);
  writeFileSync(path.join(outside, "secret.txt"), "outside\n");
  writeFileSync(path.join(root, "plain.txt"), "inside\n");
  symlinkSync(outside, path.join(root, "dir-link"));
  symlinkSync(path.join(outside, "secret.txt"), path.join(root, "file-link"));

  const before = snapshotFiles(root);
  assert.deepEqual([...before.keys()].sort(), ["dir-link", "file-link", "plain.txt"]);
  // Nothing behind the directory link is walked, and a link's hash differs
  // from a plain file with the target's content.
  assert.ok(!before.has("dir-link/secret.txt"));

  // Retargeting a link is a visible change.
  rmSync(path.join(root, "file-link"));
  symlinkSync(path.join(outside, "other.txt"), path.join(root, "file-link"));
  assert.deepEqual(diffSnapshots(before, snapshotFiles(root)), ["file-link"]);
});

test("runEval: a setup failure yields a case error, not a thrown run", async () => {
  const evalCase = CORE_DELIVERY_SUITE.cases[0]!;
  const report = await runEval({
    pack: standardPack,
    suite: one({
      ...evalCase,
      setup: () => {
        throw new Error("setup exploded");
      },
    }),
  });
  assert.equal(evalPassed(report), false);
  assert.match(report.cases[0]!.error!, /case failed: setup exploded/);
  assert.deepEqual(report.cases[0]!.deterministic, []);
});

test("runEval: a candidate that destroys the sandbox is a case error, not a thrown run", async () => {
  const evalCase = CORE_DELIVERY_SUITE.cases[0]!;
  const report = await runEval({
    pack: standardPack,
    suite: one(evalCase),
    candidate: (task) => {
      rmSync(task.root, { recursive: true, force: true });
      return undefined;
    },
  });
  assert.equal(evalPassed(report), false);
  assert.match(report.cases[0]!.error!, /case failed:/);
});

test("runEval: a slow candidate times out and is reported as a case error", async () => {
  const evalCase = CORE_DELIVERY_SUITE.cases[0]!;
  const report = await runEval({
    pack: standardPack,
    suite: one(evalCase),
    candidate: () => new Promise(() => {}),
    candidateTimeoutMs: 50,
  });
  assert.equal(evalPassed(report), false);
  assert.match(report.cases[0]!.error!, /candidate failed: candidate timed out after 50ms/);
});

test("runEval: a slow judge times out per dimension; deterministic results are unaffected", async () => {
  const evalCase = CORE_DELIVERY_SUITE.cases.find((c) => c.semantic.length > 0)!;
  const report = await runEval({
    pack: standardPack,
    suite: one(evalCase),
    judge: () => new Promise(() => {}),
    judgeTimeoutMs: 50,
  });
  assert.equal(report.cases[0]!.error, undefined);
  assert.ok(report.cases[0]!.deterministic.every((a) => a.passed));
  for (const dimension of report.cases[0]!.semantic) {
    assert.equal(dimension.judged, false);
    assert.match(dimension.reason!, /judge failed: judge timed out after 50ms/);
  }
});

test("runEval: a pack missing a capability fails that case and still evaluates the others", async () => {
  const root = temp({ pack: "incomplete" });
  const incomplete = resolvePack({ root, config: loadProject({ root }).config }).value!;
  const report = await runEval({ pack: incomplete, suite: CORE_DELIVERY_SUITE });
  assert.equal(evalPassed(report), false);
  const review = report.cases.find((entry) => entry.capability === "delivery-review")!;
  assert.match(review.error!, /does not provide capability "delivery-review"/);
  for (const entry of report.cases.filter((c) => c.capability !== "delivery-review")) {
    assert.equal(entry.error, undefined, entry.id);
    assert.ok(
      entry.deterministic.every((a) => a.passed),
      entry.id,
    );
  }
});
