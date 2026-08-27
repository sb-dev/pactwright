import { after, test } from "node:test";
import assert from "node:assert/strict";
import { rmSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import { PactwrightError } from "../src/errors.js";
import { deriveLineage } from "../src/graph/lineage.js";
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
