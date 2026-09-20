import { after, test } from "node:test";
import assert from "node:assert/strict";
import { rmSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import { PactwrightError } from "../src/errors.js";
import { deriveLineage } from "../src/graph/lineage.js";
import { lifecycleStatus } from "../src/lifecycle/engine.js";
import { recordStage } from "../src/lifecycle/record.js";
import { loadProject } from "../src/loader.js";
import { makeTempProject } from "./helpers.js";

const dirs: string[] = [];
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});

function project(options: Parameters<typeof makeTempProject>[0] = {}): string {
  const dir = makeTempProject(options);
  dirs.push(dir);
  return dir;
}

const INTENT = "intent-quick-start-a1b2";
const OLD_DECISION = "decision-quick-start-b2c3";

function decisionFile(
  root: string,
  outcome: "proceed" | "reject" | "defer",
  withContract: boolean,
): string {
  const file = path.join(root, "decision.yml");
  const lines = [
    `intent: ${INTENT}`,
    `outcome: ${outcome}`,
    "decided_by: human:samir",
    "body: Re-decided.",
  ];
  if (withContract) lines.push("contract:", "  title: Resumed contract", "  body: It shall work.");
  writeFileSync(file, `${lines.join("\n")}\n`);
  return file;
}

test("record: approve-contract resumes a deferred lineage with a superseding decision", () => {
  const root = project({ lineage: "deferred" });
  const result = recordStage(root, "approve-contract", decisionFile(root, "proceed", true));
  assert.equal(result.created.length, 2);
  const { graph } = loadProject({ root });
  const lineage = deriveLineage(INTENT, graph.nodes, graph.edges);
  assert.equal(lineage?.state, "contracted");
  assert.equal(lineage?.decision?.id, result.created[0]!.id);
  // The old decision is superseded, not deleted.
  assert.ok(
    graph.edges.some(
      (edge) =>
        edge.type === "supersedes" &&
        edge.source === result.created[0]!.id &&
        edge.target === OLD_DECISION,
    ),
  );
});

test("record: approve-contract resumes a rejected lineage", () => {
  const root = project({ lineage: "rejected" });
  const result = recordStage(root, "approve-contract", decisionFile(root, "defer", false));
  assert.equal(result.created.length, 1);
  const { graph } = loadProject({ root });
  assert.equal(deriveLineage(INTENT, graph.nodes, graph.edges)?.state, "deferred");
});

test("record: approve-contract on a superseded intent is refused", () => {
  const root = project({ lineage: "superseded-intent" });
  assert.throws(
    () => recordStage(root, "approve-contract", decisionFile(root, "proceed", true)),
    (error: unknown) =>
      error instanceof PactwrightError &&
      error.code === "stage-not-permitted" &&
      /superseded/.test(error.message),
  );
});

test("record: approve-contract on a contracted lineage is still refused", () => {
  const root = project({ lineage: "contracted" });
  assert.throws(
    () => recordStage(root, "approve-contract", decisionFile(root, "proceed", true)),
    (error: unknown) => error instanceof PactwrightError && error.code === "stage-not-permitted",
  );
});

// ---- permitted supersession (Core §45, consolidation design §12) ------------

/** The stages `lifecycle status` lists as permitted for `intent`. */
function permittedStages(root: string, intent: string): readonly string[] {
  const status = lifecycleStatus(loadProject({ root }), intent);
  return (status.lineages[0]?.permitted ?? []).map((op) =>
    op.mode === "supersede" ? `${op.stage} (supersede)` : op.stage,
  );
}

function briefFile(root: string, contract: string, title: string): string {
  const file = path.join(root, `brief-${title.replace(/\W+/g, "-")}.yml`);
  writeFileSync(file, `contract: ${contract}\ntitle: ${title}\nbody: |\n  Steps.\n`);
  return file;
}

test("record: a delivering lineage permits replacing its Brief", () => {
  const root = project({ lineage: "delivering" });
  const intent = "intent-quick-start-a1b2";
  // `assertPermitted` allowed only *pending* responsibilities, so Core §45's
  // Brief change was unreachable through any command (R11).
  assert.ok(permittedStages(root, intent).includes("write-brief (supersede)"));

  const before = deriveLineage(
    intent,
    loadProject({ root }).graph.nodes,
    loadProject({ root }).graph.edges,
  );
  const result = recordStage(
    root,
    "write-brief",
    briefFile(root, "contract-quick-start-c3d4", "A different plan"),
  );
  assert.equal(result.stage, "write-brief");

  const project_ = loadProject({ root });
  const after_ = deriveLineage(intent, project_.graph.nodes, project_.graph.edges);
  assert.notEqual(after_?.brief?.id, before?.brief?.id, "the current Brief moved");
  assert.ok(
    project_.graph.edges.some(
      (edge) =>
        edge.type === "supersedes" &&
        edge.source === after_!.brief!.id &&
        edge.target === before!.brief!.id,
    ),
    "the replacement supersedes the Brief it replaces",
  );
});

test("record: a done lineage permits correcting its Evidence", () => {
  const root = project({ lineage: "done" });
  const intent = "intent-quick-start-a1b2";
  // Evidence correction demanded an active run, and closure had cleared it,
  // so a closed lineage could never be corrected.
  assert.deepEqual(permittedStages(root, intent), [
    "capture-intent",
    "prepare-evidence (supersede)",
  ]);
});

test("record: a superseded lineage is frozen, whatever state it is in", () => {
  const root = project({ lineage: "superseded-intent" });
  const status = lifecycleStatus(loadProject({ root }));
  const frozen = status.lineages.find((entry) => entry.superseded === true);
  assert.ok(frozen, "the fixture must have a superseded lineage");
  // §15: work continues on the superseding intent's lineage, so the only
  // thing on offer is starting a new one.
  assert.deepEqual(
    frozen.permitted.map((op) => op.stage),
    ["capture-intent"],
  );
});

test("record: the permitted list is what `lifecycle record` checks against", () => {
  // The point of one list: a stage the status does not offer is refused, and
  // a stage it offers is accepted. They cannot drift apart because they are
  // the same call.
  // A delivering lineage has a Brief, so prepare-evidence resolves to a real
  // lineage and is refused on permission rather than on a missing anchor.
  const root = project({ lineage: "delivering" });
  const intent = "intent-quick-start-a1b2";
  const permitted = permittedStages(root, intent);
  assert.ok(permitted.includes("write-brief (supersede)"));
  assert.equal(permitted.includes("prepare-evidence"), false);

  assert.throws(
    () => recordStage(root, "prepare-evidence", evidenceFile(root)),
    (error: unknown) => error instanceof PactwrightError && error.code === "stage-not-permitted",
  );
});

function evidenceFile(root: string): string {
  const file = path.join(root, "evidence.yml");
  writeFileSync(file, "brief: brief-quick-start-d4e5\ntitle: Done\nbody: |\n  Facts.\n");
  return file;
}
