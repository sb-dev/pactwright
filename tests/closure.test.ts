import { after, test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { PactwrightError } from "../src/errors.js";
import { checkEvidenceClosure } from "../src/graph/closure.js";
import {
  createBrief,
  createEvidence,
  createIntent,
  recordDecision,
} from "../src/graph/mutations.js";
import { deriveLineage } from "../src/graph/lineage.js";
import { clearExecutionState, writeExecutionState } from "../src/lifecycle/state.js";
import { loadProject } from "../src/loader.js";
import { defaultShapeSteps, makeTempProject, reachEvidenceClosure } from "./helpers.js";

const dirs: string[] = [];
after(() => {
  for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
});

const CONTRACT = { title: "Print a banner", body: "A banner on start-up." };

/** A project with a current Brief and no run yet. */
function delivering(options: Parameters<typeof makeTempProject>[0] = {}): {
  root: string;
  brief: string;
  intent: string;
} {
  const root = makeTempProject(options);
  dirs.push(root);
  const intent = createIntent(root, { title: "Ship the banner", body: "Users need a banner." });
  const { contract } = recordDecision(root, {
    intentId: intent.id,
    outcome: "proceed",
    decidedBy: "human:samir",
    body: "Go.",
    contract: CONTRACT,
  });
  const brief = createBrief(root, {
    contractId: contract!.id,
    title: "Banner brief",
    body: "Add the banner to main.",
  });
  return { root, brief: brief.id, intent: intent.id };
}

const evidenceInput = (briefId: string) => ({
  briefId,
  title: "Banner evidence",
  body: "Banner added; verified by run.",
});

/** Asserts the mutation is refused and nothing at all was written. */
function refused(root: string, briefId: string, precondition: string): PactwrightError {
  const before = fs.readdirSync(path.join(root, "specs", "nodes")).sort();
  const edgesBefore = fs.readFileSync(path.join(root, "specs", "graph", "edges.yml"), "utf8");
  let error: unknown;
  try {
    createEvidence(root, evidenceInput(briefId));
  } catch (caught) {
    error = caught;
  }
  assert.ok(error instanceof PactwrightError, "closure must be refused");
  assert.equal(error.code, "evidence-closure-refused");
  assert.ok(
    error.problems.some((p) => p.code === `evidence-${precondition}`),
    `expected ${precondition}, got: ${error.problems.map((p) => p.code).join(", ")}`,
  );
  // No Evidence node and no partial `evidences` edge (Step 7).
  assert.deepEqual(fs.readdirSync(path.join(root, "specs", "nodes")).sort(), before);
  assert.equal(
    fs.readFileSync(path.join(root, "specs", "graph", "edges.yml"), "utf8"),
    edgesBefore,
  );
  assert.equal(
    loadProject({ root }).graph.nodes.some((n) => n.type === "evidence"),
    false,
  );
  return error;
}

/* ---- one failing fixture per §53 precondition ---- */

test("closure: refused when nothing has been delivered or reviewed", () => {
  const { root, brief } = delivering();
  refused(root, brief, "latest-delivery-reviewed");
});

test("closure: refused when the Brief is superseded", () => {
  const { root, brief, intent } = delivering();
  const project = loadProject({ root });
  const lineage = deriveLineage(intent, project.graph.nodes, project.graph.edges)!;
  // A new Brief under the same Contract supersedes the current one (§15).
  const replacement = createBrief(root, {
    contractId: lineage.contract!.id,
    title: "Banner brief v2",
    body: "Add the banner to main, differently.",
  });
  reachEvidenceClosure(root, brief);
  refused(root, brief, "brief-current");
  assert.notEqual(replacement.id, brief);
});

test("closure: refused when the delivery changed after the Review", () => {
  const { root, brief } = delivering();
  // Reviewed "delivered-1", but "delivered-2" has since been produced.
  reachEvidenceClosure(root, brief, {
    deliveredRevision: "delivered-2",
    review: { step: "review", outcome: "pass", revision: "delivered-1" },
  });
  const error = refused(root, brief, "latest-delivery-reviewed");
  assert.match(
    error.problems.find((p) => p.code === "evidence-latest-delivery-reviewed")!.message,
    /latest Review was taken against "delivered-1"/,
  );
});

test("closure: refused when the closing Review does not permit closure", () => {
  for (const outcome of ["revise", "blocked"] as const) {
    const { root, brief } = delivering();
    reachEvidenceClosure(root, brief, {
      review: { step: "review", outcome, revision: "delivered-1" },
    });
    const error = refused(root, brief, "review-permits-closure");
    assert.match(
      error.problems.find((p) => p.code === "evidence-review-permits-closure")!.message,
      new RegExp(`reported "${outcome}"`),
    );
  }
});

test("closure: refused when a required Gate the run reached is unresolved", () => {
  const { root, brief } = delivering({
    shapeSteps: defaultShapeSteps({ review: { execution: "manual", actor: "human" } }),
  });
  // A state edited past the Gate by hand: the reducer would refuse to
  // complete a Gate step without an authorised resolution, so this is the
  // tampered case the closure guard has to catch on its own.
  reachEvidenceClosure(root, brief, {}, { resolveGates: false });
  refused(root, brief, "gates-resolved");
});

test("closure: refused when a Gate was resolved by an unauthorised actor", () => {
  const { root, brief } = delivering({
    shapeSteps: defaultShapeSteps({ review: { execution: "manual", actor: "human" } }),
  });
  const state = reachEvidenceClosure(root, brief);
  writeExecutionState(root, { ...state, gates: { review: { resolvedBy: "agent:unauthorised" } } });
  // Presence used to be the whole test, so `agent:unauthorised` on a human
  // Gate satisfied closure.
  refused(root, brief, "gates-resolved");
});

test("closure: a resolved Gate permits closure", () => {
  const { root, brief } = delivering({
    shapeSteps: defaultShapeSteps({ review: { execution: "manual", actor: "human" } }),
  });
  const state = reachEvidenceClosure(root, brief);
  writeExecutionState(root, { ...state, gates: { review: { resolvedBy: "human:samir" } } });
  const evidence = createEvidence(root, evidenceInput(brief));
  assert.equal(
    loadProject({ root }).graph.nodes.some((n) => n.id === evidence.id),
    true,
  );
});

test("closure: refused when the Brief is no longer the lineage's current Brief", () => {
  const { root, brief, intent } = delivering();
  reachEvidenceClosure(root, brief);
  // Re-deciding supersedes the Decision and Contract this Brief decomposes,
  // so it is no longer the current Brief of an unambiguous lineage.
  recordDecision(root, {
    intentId: intent,
    outcome: "proceed",
    decidedBy: "human:samir",
    body: "Changed our minds about the banner.",
    contract: { title: "Print a footer", body: "A footer on start-up." },
  });
  refused(root, brief, "lineage-valid");
});

test("closure: refused when the run is not at its Evidence closure step", () => {
  const { root, brief } = delivering();
  reachEvidenceClosure(root, brief, { currentStep: "delivery", visited: [] });
  const error = refused(root, brief, "latest-delivery-reviewed");
  assert.match(error.problems.map((p) => p.message).join("\n"), /not its Evidence closure step/);
});

test("closure: refused when execution state was cleared mid-run", () => {
  const { root, brief } = delivering();
  reachEvidenceClosure(root, brief);
  clearExecutionState(root, brief);
  refused(root, brief, "latest-delivery-reviewed");
});

/* ---- the successful path ---- */

test("closure: a passing Review of the latest delivered state permits closure", () => {
  const { root, brief, intent } = delivering();
  const check = checkEvidenceClosure(loadProject({ root }), brief);
  assert.equal(check.ok, false, "no run yet");

  reachEvidenceClosure(root, brief);
  const permitted = checkEvidenceClosure(loadProject({ root }), brief);
  assert.deepEqual(permitted.failed, []);
  assert.equal(permitted.ok, true);

  const evidence = createEvidence(root, evidenceInput(brief));
  const project = loadProject({ root });
  const lineage = deriveLineage(intent, project.graph.nodes, project.graph.edges);
  assert.equal(lineage?.state, "done");
  assert.equal(lineage?.evidence?.id, evidence.id);
});

test("closure: correcting Evidence on a closed lineage is permitted", () => {
  const { root, brief } = delivering();
  reachEvidenceClosure(root, brief);
  const first = createEvidence(root, evidenceInput(brief));
  // The run is over and its state cleared; correcting the record does not
  // reopen Delivery (Spec 01 §45).
  clearExecutionState(root, brief);
  const corrected = createEvidence(root, {
    briefId: brief,
    title: "Banner evidence, corrected",
    body: "Banner added; the earlier note misstated the test command.",
  });
  assert.notEqual(corrected.id, first.id);
  const project = loadProject({ root });
  assert.ok(
    project.graph.edges.some(
      (e) => e.type === "supersedes" && e.source === corrected.id && e.target === first.id,
    ),
  );
});
