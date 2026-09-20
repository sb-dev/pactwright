import { after, test } from "node:test";
import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import * as path from "node:path";
import { PactwrightError } from "../src/errors.js";
import { GraphIndex, TOWARDS_INTENT, intentOf } from "../src/graph/graph-index.js";
import { lineageFor } from "../src/graph/lineage.js";
import { loadContext } from "../src/context.js";
import { checkEvidenceClosure } from "../src/graph/closure.js";
import { loadProject } from "../src/loader.js";
import { fixture, loadGraphFixture, makeTempProject } from "./helpers.js";

const dirs: string[] = [];
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});

function project(options: Parameters<typeof makeTempProject>[0] = {}): string {
  const dir = makeTempProject(options);
  dirs.push(dir);
  return dir;
}

/**
 * One index per loaded snapshot (§8). Parent discovery used to be written
 * four times, and three of the four took the first matching edge and ignored
 * a second parent — so `findIntentOf`, closure's `lineageOf` and the mutation
 * path could each answer a question about state validation rejects, and could
 * disagree with each other while doing it.
 */

const lineageFixture = (name: string) => loadGraphFixture(path.join(fixture("lineage"), name));
const INTENT = "intent-quick-start-a1b2";

function indexOf(name: string): GraphIndex {
  const graph = lineageFixture(name);
  return GraphIndex.build(graph.nodes, graph.edges);
}

test("graph index: the structural walk towards the intent covers every non-intent core type", () => {
  // A record type missing from this table resolves to no intent at all, so
  // the table is the contract, not an optimisation.
  assert.deepEqual(Object.keys(TOWARDS_INTENT).sort(), [
    "brief",
    "contract",
    "decision",
    "evidence",
  ]);
});

test("graph index: every record in a lineage resolves to its intent", () => {
  const index = indexOf("done");
  for (const id of [
    INTENT,
    "decision-quick-start-b2c3",
    "contract-quick-start-c3d4",
    "brief-quick-start-d4e5",
    "evidence-quick-start-e5f6",
  ]) {
    assert.equal(intentOf(index, id)?.id, INTENT, `${id} resolves to its intent`);
  }
});

test("graph index: an unlinked or unknown record resolves to no intent", () => {
  const index = indexOf("open");
  assert.equal(intentOf(index, "brief-nowhere-0000"), undefined);
  assert.equal(intentOf(index, "decision-quick-start-b2c3"), undefined);
});

test("graph index: a second structural parent fails closed", () => {
  const index = indexOf("decision-two-intents");
  // The walk reaches the decision from anywhere below it, so every entry
  // point that used to select the first matching edge now refuses.
  for (const id of [
    "decision-quick-start-b2c3",
    "contract-quick-start-c3d4",
    "brief-quick-start-d4e5",
    "evidence-quick-start-e5f6",
  ]) {
    assert.throws(
      () => intentOf(index, id),
      (error: unknown) =>
        error instanceof PactwrightError &&
        error.code === "ambiguous-parent" &&
        /2 resolves parents/.test(error.message),
      `${id} refuses rather than picking a parent`,
    );
  }
});

test("graph index: lineageFor refuses the ambiguous parent from every former entry point", () => {
  const index = indexOf("decision-two-intents");
  assert.throws(
    () => lineageFor(index, "evidence-quick-start-e5f6"),
    (error: unknown) => error instanceof PactwrightError && error.code === "ambiguous-parent",
  );
});

test("graph index: the loaded project shares one index with context and closure", () => {
  const root = project({ lineage: "delivering" });
  const loaded = loadProject({ root });
  // One index on the snapshot, reached by every consumer.
  assert.ok(loaded.graph.index instanceof GraphIndex);
  assert.equal(loaded.graph.index.node(INTENT)?.id, INTENT);

  const context = loadContext(loaded, "brief-quick-start-d4e5");
  assert.equal(context.intent, INTENT);

  // Closure resolves the same lineage through the same index rather than
  // through its own nested scans.
  const check = checkEvidenceClosure(loaded, "brief-quick-start-d4e5");
  assert.ok(
    !check.failed.includes("lineage-valid"),
    "the brief's lineage resolves through the shared index",
  );
});

test("graph index: sourcesOf and targetsOf are sorted and type-narrowed", () => {
  const index = indexOf("done");
  assert.deepEqual(
    index.sourcesOf(INTENT, "resolves").map((node) => node.id),
    ["decision-quick-start-b2c3"],
  );
  assert.deepEqual(index.sourcesOf(INTENT, "resolves", "brief"), []);
  assert.deepEqual(
    index.targetsOf("decision-quick-start-b2c3", "selects", "contract").map((node) => node.id),
    ["contract-quick-start-c3d4"],
  );
});

test("graph index: derivation stays linear in the number of edges", () => {
  // A few thousand synthetic records: the former per-candidate scans were
  // O(E²), so this is a guard against reintroducing one.
  const nodes = [];
  const edges = [];
  for (let i = 0; i < 4000; i += 1) {
    const suffix = String(i).padStart(4, "0");
    nodes.push({
      id: `intent-synthetic-${suffix}`,
      type: "intent",
      title: `synthetic ${i}`,
      created: "2026-09-20",
      frontmatter: {},
      body: "synthetic",
      path: `specs/nodes/intent-synthetic-${suffix}.md`,
    });
    nodes.push({
      id: `decision-synthetic-${suffix}`,
      type: "decision",
      title: `synthetic ${i}`,
      created: "2026-09-20",
      frontmatter: { decided_by: "human:test", outcome: "reject" },
      body: "synthetic",
      path: `specs/nodes/decision-synthetic-${suffix}.md`,
    });
    edges.push({
      source: `decision-synthetic-${suffix}`,
      type: "resolves",
      target: `intent-synthetic-${suffix}`,
    });
  }
  const started = process.hrtime.bigint();
  const index = GraphIndex.build(nodes, edges);
  for (const node of nodes) {
    if (node.type === "decision") assert.ok(intentOf(index, node.id) !== undefined);
  }
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
  // Generous: a quadratic walk over 8,000 records takes orders of magnitude
  // longer than this, so the bound catches the regression without being
  // sensitive to machine speed.
  assert.ok(elapsedMs < 5_000, `indexed resolution took ${elapsedMs.toFixed(0)}ms`);
});
