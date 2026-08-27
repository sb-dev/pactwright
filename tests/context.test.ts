import { after, test } from "node:test";
import assert from "node:assert/strict";
import { rmSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import { PactwrightError } from "../src/errors.js";
import { findIntentOf, loadContext, type ContextContributor } from "../src/context.js";
import { loadProject } from "../src/loader.js";
import { makeTempProject } from "./helpers.js";

const dirs: string[] = [];
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});

function project(lineage?: string) {
  const dir = makeTempProject(lineage === undefined ? {} : { lineage });
  dirs.push(dir);
  return { root: dir, project: loadProject({ root: dir }) };
}

const INTENT = "intent-quick-start-a1b2";
const ids = (nodes: readonly { id: string }[]) => nodes.map((n) => n.id);

const CURRENT = [
  INTENT,
  "decision-quick-start-8888",
  "contract-quick-start-9999",
  "brief-quick-start-5555",
  "evidence-quick-start-7777",
];
const SUPERSEDED = [
  "brief-quick-start-4444",
  "contract-quick-start-2222",
  "contract-quick-start-3333",
  "decision-quick-start-0000",
  "decision-quick-start-1111",
  "evidence-quick-start-6666",
];

const stagesByFixture: Array<[string, string, string[]]> = [
  ["open", "open", [INTENT]],
  ["deferred", "deferred", [INTENT, "decision-quick-start-b2c3"]],
  ["rejected", "rejected", [INTENT, "decision-quick-start-b2c3"]],
  ["contracted", "contracted", [INTENT, "decision-quick-start-b2c3", "contract-quick-start-c3d4"]],
  [
    "delivering",
    "delivering",
    [INTENT, "decision-quick-start-b2c3", "contract-quick-start-c3d4", "brief-quick-start-d4e5"],
  ],
  [
    "done",
    "done",
    [
      INTENT,
      "decision-quick-start-b2c3",
      "contract-quick-start-c3d4",
      "brief-quick-start-d4e5",
      "evidence-quick-start-e5f6",
    ],
  ],
];

for (const [fixtureName, state, lineage] of stagesByFixture) {
  test(`context: ${fixtureName} returns only the existing stages, in order`, () => {
    const { project: p } = project(fixtureName);
    const context = loadContext(p, INTENT);
    assert.equal(context.state, state);
    assert.deepEqual(ids(context.lineage), lineage);
    assert.equal(context.requestedIsCurrent, true);
    assert.equal(context.history, undefined);
    assert.deepEqual(context.extensions, {});
    // Any node of the lineage resolves to the same context.
    for (const id of lineage) assert.deepEqual(ids(loadContext(p, id).lineage), lineage);
  });
}

test("context: superseded records never appear in normal context", () => {
  const { project: p } = project("superseded-chain");
  for (const id of [...CURRENT, ...SUPERSEDED]) {
    const context = loadContext(p, id);
    assert.deepEqual(ids(context.lineage), CURRENT, id);
    assert.equal(context.requestedIsCurrent, CURRENT.includes(id), id);
    assert.equal(context.history, undefined);
    // Only `requested` may echo a superseded id; the lineage itself never does.
    const text = JSON.stringify({ ...context, requested: undefined });
    for (const gone of SUPERSEDED) assert.ok(!text.includes(gone), `${gone} leaked for ${id}`);
  }
});

test("context: --history adds exactly the superseded records with their supersessors", () => {
  const { project: p } = project("superseded-chain");
  const context = loadContext(p, "contract-quick-start-2222", { history: true });
  assert.deepEqual(ids(context.lineage), CURRENT);
  assert.equal(context.requestedIsCurrent, false);
  assert.deepEqual(
    context.history?.map((h) => [h.node.id, h.supersededBy]),
    [
      ["brief-quick-start-4444", ["brief-quick-start-5555"]],
      ["contract-quick-start-2222", ["contract-quick-start-3333"]],
      ["contract-quick-start-3333", ["contract-quick-start-9999"]],
      ["decision-quick-start-0000", ["decision-quick-start-1111"]],
      ["decision-quick-start-1111", ["decision-quick-start-8888"]],
      ["evidence-quick-start-6666", ["evidence-quick-start-7777"]],
    ],
  );
});

test("context: --history on a lineage without history is empty", () => {
  const { project: p } = project("done");
  assert.deepEqual(loadContext(p, INTENT, { history: true }).history, []);
});

test("context: unknown and unlinked nodes are rejected", () => {
  const { root, project: p } = project("open");
  assert.throws(
    () => loadContext(p, "intent-nope-0000"),
    (e: unknown) => e instanceof PactwrightError && e.code === "unknown-node",
  );
  writeFileSync(
    path.join(root, "specs", "nodes", "contract-loose-ffff.md"),
    "---\nid: contract-loose-ffff\ntype: contract\ntitle: Loose\ncreated: 2026-08-19\n---\n\nNo decision selects me.\n",
  );
  const reloaded = loadProject({ root });
  assert.equal(
    findIntentOf("contract-loose-ffff", reloaded.graph.nodes, reloaded.graph.edges),
    undefined,
  );
  assert.throws(
    () => loadContext(reloaded, "contract-loose-ffff"),
    (e: unknown) => e instanceof PactwrightError && e.code === "unlinked-node",
  );
});

test("context: contributors add namespaced context and cannot alter the lineage", () => {
  const { project: p } = project("delivering");
  const demo: ContextContributor = ({ lineage, history }) => ({
    namespace: "demo",
    context: { brief: lineage.brief?.id, history },
  });
  const quiet: ContextContributor = () => undefined;
  const context = loadContext(p, INTENT, { contributors: [demo, quiet] });
  assert.deepEqual(context.extensions, {
    demo: { brief: "brief-quick-start-d4e5", history: false },
  });
  assert.deepEqual(ids(context.lineage), ids(loadContext(p, INTENT).lineage));
  assert.throws(
    () => loadContext(p, INTENT, { contributors: [demo, demo] }),
    (e: unknown) => e instanceof PactwrightError && e.code === "duplicate-context-namespace",
  );
});
