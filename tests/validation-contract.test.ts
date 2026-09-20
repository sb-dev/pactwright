import { after, test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { graphRevision } from "../src/graph/revision.js";
import { repositoryRevision } from "../src/graph/repository.js";
import { createBrief, createIntent, recordDecision } from "../src/graph/mutations.js";
import { writeExecutionState } from "../src/lifecycle/state.js";
import { loadProject } from "../src/loader.js";
import { VALIDATION_RULES, validateProject, type ValidationRuleId } from "../src/validate.js";
import {
  defaultShapeSteps,
  fixture,
  lifecycleDocument,
  defaultResponsibilities,
  makeTempProject,
  reachEvidenceClosure,
} from "./helpers.js";

const dirs: string[] = [];
after(() => {
  for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
});

function temp(options: Parameters<typeof makeTempProject>[0] = {}): string {
  const dir = makeTempProject(options);
  dirs.push(dir);
  return dir;
}

/** A project with a current Brief, ready for a run. */
function delivering(options: Parameters<typeof makeTempProject>[0] = {}): {
  root: string;
  brief: string;
} {
  const root = temp(options);
  const intent = createIntent(root, { title: "Ship the banner", body: "Users need a banner." });
  const { contract } = recordDecision(root, {
    intentId: intent.id,
    outcome: "proceed",
    decidedBy: "human:samir",
    body: "Go.",
    contract: { title: "Print a banner", body: "A banner on start-up." },
  });
  const brief = createBrief(root, {
    contractId: contract!.id,
    title: "Banner brief",
    body: "Add the banner to main.",
  });
  return { root, brief: brief.id };
}

const writeLifecycle = (root: string, text: string): void =>
  fs.writeFileSync(path.join(root, ".pactwright", "lifecycle.yml"), text);

/** Asserts validation fails and names `rule`. */
function triggers(root: string, rule: ValidationRuleId, options: object = {}): void {
  const report = validateProject({ root, ...options });
  assert.equal(report.ok, false, `expected ${rule} to fail validation`);
  assert.equal(report.summary, undefined);
  assert.ok(
    report.rules.includes(rule),
    `expected rule "${rule}", got [${report.rules.join(", ")}] from codes [${report.problems.map((p) => p.code).join(", ")}]`,
  );
}

test("contract: the rule set is exactly the Spec 01 §57 seventeen, in order", () => {
  assert.equal(VALIDATION_RULES.length, 17);
  assert.deepEqual(
    VALIDATION_RULES.map((rule) => rule.number),
    Array.from({ length: 17 }, (_, i) => i + 1),
  );
});

/* ---- positive control ---- */

test("contract: a coherent project triggers no rule at all", () => {
  const { root } = delivering();
  const report = validateProject({ root });
  assert.equal(report.ok, true, report.problems.map((p) => p.message).join("\n"));
  assert.deepEqual(report.rules, []);
});

test("contract: validation performs no writes", () => {
  const { root, brief } = delivering();
  reachEvidenceClosure(root, brief);
  const snapshot = (): string =>
    fs
      .readdirSync(path.join(root, "specs", "nodes"))
      .sort()
      .join("|") + fs.readFileSync(path.join(root, "specs", "graph", "edges.yml"), "utf8");
  const before = snapshot();
  validateProject({ root });
  validateProject({ root: fixture("invalid-lineage-ambiguous") });
  assert.equal(snapshot(), before);
});

/* ---- rules 1–8: structural, detected on the canonical loading path ---- */

const structural: Array<[ValidationRuleId, string]> = [
  ["malformed-core-nodes", "invalid-node-bad-id"],
  ["invalid-core-relationships", "invalid-edges-missing-target"],
  ["multiple-unsuperseded-records", "invalid-lineage-ambiguous"],
  ["illegal-supersession", "invalid-edges-supersession-cycle"],
];

for (const [rule, name] of structural) {
  test(`contract: rule "${rule}" is detected by fixture ${name}`, () => {
    triggers(fixture(name), rule);
  });
}

test('contract: rule "invalid-core-relationships" covers a wrong endpoint type', () => {
  triggers(fixture("invalid-edges-wrong-endpoint-type"), "invalid-core-relationships");
});

test('contract: rule "illegal-supersession" covers self-supersession', () => {
  triggers(fixture("invalid-edges-self-supersession"), "illegal-supersession");
});

test('contract: rule "missing-required-lineage" fires when a proceed Decision selects no Contract', () => {
  triggers(temp({ lineage: "proceed-no-contract" }), "missing-required-lineage");
});

test('contract: rule "contradictory-current-records" fires when a defer Decision selects a Contract', () => {
  triggers(temp({ lineage: "defer-selects-contract" }), "contradictory-current-records");
});

test('contract: rule "multiple-unsuperseded-records" covers two current Contracts', () => {
  triggers(temp({ lineage: "proceed-two-contracts" }), "multiple-unsuperseded-records");
});

test('contract: rule "invalid-brief-lineage" fires on two current Briefs for one Contract', () => {
  triggers(temp({ lineage: "two-current-briefs" }), "invalid-brief-lineage");
});

test('contract: rule "invalid-evidence-lineage" fires on two current Evidence for one Brief', () => {
  triggers(temp({ lineage: "two-current-evidence" }), "invalid-evidence-lineage");
});

/* ---- rules 9–11, 15: shape configuration ---- */

test('contract: rule "missing-lifecycle-shape" fires when the shape never closes on Evidence', () => {
  const root = temp();
  writeLifecycle(
    root,
    lifecycleDocument(
      defaultResponsibilities(),
      [
        { name: "delivery", kind: "delivery", execution: "automatic" },
        { name: "review", kind: "review", execution: "automatic" },
      ],
      [],
    ),
  );
  triggers(root, "missing-lifecycle-shape");
});

test('contract: rule "missing-lifecycle-shape" fires on a version 1 document', () => {
  const root = temp();
  writeLifecycle(
    root,
    "version: 1\n\nstages:\n  capture-intent:\n    execution: manual\n  propose-contracts:\n    execution: automatic\n  approve-contract:\n    execution: manual\n    actor: human\n  write-brief:\n    execution: automatic\n  deliver-brief:\n    execution: automatic\n  review:\n    execution: automatic\n  prepare-evidence:\n    execution: automatic\n",
  );
  triggers(root, "missing-lifecycle-shape");
});

test('contract: rule "unresolved-shape-identity" fires when a run names another shape', () => {
  const { root, brief } = delivering();
  reachEvidenceClosure(root, brief, { shape: "some-other-shape" });
  triggers(root, "unresolved-shape-identity");
});

test('contract: rule "impossible-shape-transition" fires on a route the shape does not declare', () => {
  const { root, brief } = delivering();
  // evidence → delivery is not the forward step and is not declared.
  reachEvidenceClosure(root, brief, {
    visited: ["delivery", "review", "evidence"],
    currentStep: "delivery",
  });
  triggers(root, "impossible-shape-transition");
});

test('contract: rule "impossible-shape-transition" fires on a step the shape does not declare', () => {
  const { root, brief } = delivering();
  reachEvidenceClosure(root, brief, { visited: ["delivery", "publish"] });
  triggers(root, "impossible-shape-transition");
});

test('contract: rule "unbounded-corrective-loop" fires on a corrective route with no bound', () => {
  const root = temp();
  writeLifecycle(
    root,
    lifecycleDocument(defaultResponsibilities(), defaultShapeSteps(), [
      { from: "review", to: "delivery" },
    ]),
  );
  triggers(root, "unbounded-corrective-loop");
});

test('contract: rule "unbounded-corrective-loop" fires when a run exceeds its bound', () => {
  const { root, brief } = delivering({
    transitions: [{ from: "review", to: "delivery", maxIterations: 2 }],
  });
  reachEvidenceClosure(root, brief, { iterations: { "review->delivery": 5 } });
  triggers(root, "unbounded-corrective-loop");
});

/* ---- rule 12: Evidence before a successful closing Review ---- */

test('contract: rule "evidence-before-review" fires when a run stands at closure unreviewed', () => {
  const { root, brief } = delivering();
  writeExecutionState(root, {
    version: 2,
    brief,
    shape: "direct",
    status: "running",
    currentStep: "evidence",
    visited: ["delivery", "review"],
    gates: {},
    iterations: {},
    deliveredRevision: "delivered-2",
    review: { step: "review", outcome: "pass", revision: "delivered-1" },
  });
  triggers(root, "evidence-before-review");
});

test('contract: rule "evidence-before-review" fires when the closing Review did not pass', () => {
  const { root, brief } = delivering();
  reachEvidenceClosure(root, brief, {
    review: { step: "review", outcome: "revise", revision: "delivered-1" },
  });
  triggers(root, "evidence-before-review");
});

/* ---- rule 13: unauthorised Decision ---- */

test('contract: rule "unauthorised-decision" catches a hand-edited actor', () => {
  const { root } = delivering();
  // recordDecision refuses an agent actor under human-only authority; a
  // hand-edited record never passed that guard, and validation must catch it.
  const decision = fs
    .readdirSync(path.join(root, "specs", "nodes"))
    .find((name) => name.startsWith("decision-"))!;
  const file = path.join(root, "specs", "nodes", decision);
  fs.writeFileSync(
    file,
    fs.readFileSync(file, "utf8").replace("decided_by: human:samir", "decided_by: agent:spec"),
  );
  triggers(root, "unauthorised-decision");
});

test("contract: an authorised actor under an agent lifecycle is accepted", () => {
  const root = temp({
    lifecycle: "automated.yml",
  });
  const intent = createIntent(root, { title: "Ship it", body: "Because." });
  recordDecision(root, {
    intentId: intent.id,
    outcome: "proceed",
    decidedBy: "agent:spec",
    body: "Go.",
    contract: { title: "Do the thing", body: "The thing." },
  });
  const report = validateProject({ root });
  assert.equal(report.ok, true, report.problems.map((p) => p.message).join("\n"));
});

/* ---- rule 14: unauthorised Gate progression ---- */

test('contract: rule "unauthorised-gate" fires when a run passed a Gate unrecorded', () => {
  const { root, brief } = delivering({
    shapeSteps: defaultShapeSteps({ review: { execution: "manual", actor: "human" } }),
  });
  // Hand-edited past the Gate: the reducer refuses to complete a Gate step
  // without an authorised resolution, so this state can only arrive by
  // tampering — which is what the rule is for.
  reachEvidenceClosure(root, brief, {}, { resolveGates: false });
  triggers(root, "unauthorised-gate");
});

test('contract: rule "unauthorised-gate" fires on a Gate resolved by the wrong authority', () => {
  const { root, brief } = delivering({
    shapeSteps: defaultShapeSteps({ review: { execution: "manual", actor: "human" } }),
  });
  const state = reachEvidenceClosure(root, brief);
  // The rule used to test only that a record existed, so adding
  // `resolved_by: agent:unauthorised` to a human Gate made validation pass —
  // it detected a missing record but never an unauthorised progression.
  writeExecutionState(root, { ...state, gates: { review: { resolvedBy: "agent:unauthorised" } } });
  triggers(root, "unauthorised-gate");
});

test('contract: rule "unauthorised-gate" fires when a manual step declares no authority', () => {
  const root = temp();
  writeLifecycle(
    root,
    lifecycleDocument(
      defaultResponsibilities(),
      [
        { name: "delivery", kind: "delivery", execution: "manual" },
        { name: "review", kind: "review", execution: "automatic" },
        { name: "evidence", kind: "evidence", execution: "automatic" },
      ],
      [],
    ),
  );
  triggers(root, "unauthorised-gate");
});

test("contract: a resolved Gate is accepted", () => {
  const { root, brief } = delivering({
    shapeSteps: defaultShapeSteps({ review: { execution: "manual", actor: "human" } }),
  });
  const state = reachEvidenceClosure(root, brief);
  writeExecutionState(root, { ...state, gates: { review: { resolvedBy: "human:samir" } } });
  const report = validateProject({ root });
  assert.equal(report.ok, true, report.problems.map((p) => p.message).join("\n"));
});

/* ---- rule 16: extension state redefining core semantics ---- */

test('contract: rule "extension-redefines-core" fires on an extension claiming a core type', () => {
  const root = temp({ extensions: ["fixture-base"] });
  const manifest = path.join(root, "node_modules", "@pactwright", "fixture-base", "extension.yml");
  const text = fs.readFileSync(manifest, "utf8");
  fs.writeFileSync(
    manifest,
    text.includes("graph:")
      ? text.replace(/graph:\n(\s+)node_types:\n/, "graph:\n$1node_types:\n$1  - evidence\n")
      : `${text}\ngraph:\n  node_types:\n    - evidence\n`,
  );
  triggers(root, "extension-redefines-core");
});

/* ---- rule 17: replay provenance, only when replay is requested ---- */

test('contract: rule "replay-provenance-mismatch" is not checked by ordinary validation', () => {
  const { root } = delivering();
  const report = validateProject({ root });
  assert.equal(report.ok, true);
  assert.equal(report.rules.includes("replay-provenance-mismatch"), false);
});

test('contract: rule "replay-provenance-mismatch" fires on a requested replay check', () => {
  const { root } = delivering();
  triggers(root, "replay-provenance-mismatch", {
    replay: {
      repositoryRevision: "git:0000000000000000000000000000000000000000",
      projectGraphRevision: `sha256:${"0".repeat(64)}`,
    },
  });
});

test("contract: a replay check against the true identities passes", () => {
  const { root } = delivering();
  const project = loadProject({ root });
  const report = validateProject({
    root,
    replay: {
      repositoryRevision: repositoryRevision(root).id,
      projectGraphRevision: graphRevision(project.graph),
    },
  });
  assert.equal(report.ok, true, report.problems.map((p) => p.message).join("\n"));
});

/* ---- coverage: every rule must actually be exercised above ---- */

test("contract: every one of the seventeen rules has a failing fixture in this file", () => {
  const source = fs.readFileSync(new URL(import.meta.url), "utf8");
  const missing = VALIDATION_RULES.filter(
    (rule) => !source.includes(`"${rule.id}"`) && !source.includes(`'${rule.id}'`),
  );
  assert.deepEqual(
    missing.map((rule) => `${rule.number}. ${rule.description}`),
    [],
    "each §57 rule needs a failing fixture",
  );
});
