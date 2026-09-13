import { after, test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { PactwrightError } from "../src/errors.js";
import {
  createBrief,
  createEvidence,
  createIntent,
  recordDecision,
} from "../src/graph/mutations.js";
import { deriveLineage } from "../src/graph/lineage.js";
import { graphRevision } from "../src/graph/revision.js";
import { recordDelivery, recordReview } from "../src/lifecycle/provenance.js";
import { loadExecutionState, routeKey } from "../src/lifecycle/state.js";
import { loadProject } from "../src/loader.js";
import { validateProject } from "../src/validate.js";
import { makeTempProject } from "./helpers.js";

const dirs: string[] = [];
after(() => {
  for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
});

/** A project whose lineage has reached its Brief, as `/write-brief` leaves it. */
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
    contract: { title: "Print a banner", body: "A banner on start-up." },
  });
  const brief = createBrief(root, {
    contractId: contract!.id,
    title: "Banner brief",
    body: "Add the banner to main.",
  });
  return { root, brief: brief.id, intent: intent.id };
}

const graphOf = (root: string): string => {
  const project = loadProject({ root });
  return graphRevision(project.graph);
};

test("provenance: the adapter's own sequence drives a complete Delivery to Evidence", () => {
  const { root, brief, intent } = delivering();

  // /deliver-brief reports what it produced.
  const delivered = recordDelivery(root, { anchor: brief, revision: "delivered-1" });
  assert.equal(delivered.step, "delivery");
  assert.equal(delivered.state.currentStep, "review");
  assert.deepEqual(delivered.state.completedSteps, ["delivery"]);

  // /review reports its verdict; the runtime routes forward on a pass.
  const reviewed = recordReview(root, { anchor: brief, outcome: "pass" });
  assert.equal(reviewed.step, "review");
  assert.equal(reviewed.state.currentStep, "evidence");
  assert.equal(reviewed.state.review?.revision, "delivered-1");

  // /prepare-evidence now passes the closure guards.
  const evidence = createEvidence(root, {
    briefId: brief,
    title: "Banner evidence",
    body: "Banner added; verified by the suite.",
  });
  const project = loadProject({ root });
  assert.equal(deriveLineage(intent, project.graph.nodes, project.graph.edges)?.state, "done");
  assert.equal(
    deriveLineage(intent, project.graph.nodes, project.graph.edges)?.evidence?.id,
    evidence.id,
  );
  assert.equal(validateProject({ root }).ok, true);
});

test("provenance: recording Delivery and Review leaves canonical state untouched", () => {
  const { root, brief } = delivering();
  const before = graphOf(root);
  const nodesBefore = fs.readdirSync(path.join(root, "specs", "nodes")).sort();

  recordDelivery(root, { anchor: brief, revision: "delivered-1" });
  recordReview(root, { anchor: brief, outcome: "pass" });

  assert.equal(graphOf(root), before, "project_graph_revision must not move");
  assert.deepEqual(fs.readdirSync(path.join(root, "specs", "nodes")).sort(), nodesBefore);
});

test("provenance: a Review asking for correction routes back and counts the iteration", () => {
  const { root, brief } = delivering();
  recordDelivery(root, { anchor: brief, revision: "delivered-1" });
  const revised = recordReview(root, { anchor: brief, outcome: "revise" });
  assert.equal(revised.state.currentStep, "delivery", "routed back to Delivery");
  assert.equal(revised.state.iterations[routeKey("review", "delivery")], 1);

  // The corrected delivery produces a new state; the Review must be retaken.
  recordDelivery(root, { anchor: brief, revision: "delivered-2" });
  const passed = recordReview(root, { anchor: brief, outcome: "pass" });
  assert.equal(passed.state.currentStep, "evidence");
  assert.equal(passed.state.review?.revision, "delivered-2");
});

test("provenance: a Review cannot be recorded at a Delivery step, or the other way round", () => {
  const { root, brief } = delivering();
  assert.throws(
    () => recordReview(root, { anchor: brief, outcome: "pass" }),
    (e: unknown) => e instanceof PactwrightError && e.code === "step-not-permitted",
  );
  recordDelivery(root, { anchor: brief, revision: "delivered-1" });
  assert.throws(
    () => recordDelivery(root, { anchor: brief }),
    (e: unknown) => e instanceof PactwrightError && e.code === "step-not-permitted",
  );
});

test("provenance: a lineage with no Brief has no run to record against", () => {
  const root = makeTempProject({ lineage: "contracted" });
  dirs.push(root);
  assert.throws(
    () => recordDelivery(root, { anchor: "intent-quick-start-a1b2" }),
    (e: unknown) => e instanceof PactwrightError && e.code === "not-delivering",
  );
});

test("provenance: a blocked Review stops the run and Evidence stays refused", () => {
  const { root, brief } = delivering();
  recordDelivery(root, { anchor: brief, revision: "delivered-1" });
  const blocked = recordReview(root, { anchor: brief, outcome: "blocked" });
  assert.equal(blocked.state.status, "blocked");
  assert.throws(
    () => createEvidence(root, { briefId: brief, title: "Evidence", body: "Claimed complete." }),
    (e: unknown) => e instanceof PactwrightError && e.code === "evidence-closure-refused",
  );
});

test("provenance: delivery defaults to the current repository revision", () => {
  const { root, brief } = delivering();
  recordDelivery(root, { anchor: brief });
  const state = loadExecutionState(root, brief).value!;
  assert.ok(
    state.deliveredRevision?.startsWith("git:") || state.deliveredRevision === "none",
    `unexpected revision: ${state.deliveredRevision ?? "<none>"}`,
  );
});
