import { test } from "node:test";
import assert from "node:assert/strict";
import { intentsForContract, liveProposingContracts, liveSourcesByEdge } from "../tools/handlers/coverage_traversal.ts";
import { nodesById } from "../tools/loader.ts";
import type { EdgeRecord, LoadedSpec, NodeRecord } from "../tools/loader.ts";

function node(data: Record<string, unknown>): NodeRecord {
  return { file: `specs/nodes/${String(data.id ?? "x")}.md`, data, body: "x" };
}
function spec(nodes: NodeRecord[], edges: EdgeRecord[]): LoadedSpec {
  return { root: "", nodes, edges, nodeTypes: {}, edgeTypes: {}, rules: [], checks: [], sensitivePaths: [] };
}
const E = (id: string, source: string, type: string, target: string): EdgeRecord => ({ id, source, type, target });

test("liveProposingContracts excludes superseded sources and unresolved endpoints", () => {
  const s = spec(
    [node({ id: "c1", type: "contract", status: "approved" }), node({ id: "c2", type: "contract", status: "superseded" })],
    [E("e1", "c1", "proposes", "i"), E("e2", "c2", "proposes", "i"), E("e3", "c-missing", "proposes", "i")],
  );
  assert.deepEqual([...liveProposingContracts(s, nodesById(s), "i")], ["c1"]);
});

test("intentsForContract returns the proposes targets of a contract", () => {
  const s = spec([], [E("e1", "c", "proposes", "i1"), E("e2", "c", "proposes", "i2"), E("e3", "other", "proposes", "i3")]);
  assert.deepEqual(intentsForContract(s, "c").sort(), ["i1", "i2"]);
});

test("liveSourcesByEdge is generic over edge type (decomposes, excluding superseded)", () => {
  const s = spec(
    [node({ id: "b1", type: "brief", status: "implemented" }), node({ id: "b2", type: "brief", status: "superseded" })],
    [E("e1", "b1", "decomposes", "c"), E("e2", "b2", "decomposes", "c")],
  );
  assert.deepEqual([...liveSourcesByEdge(s, nodesById(s), "decomposes", "c")], ["b1"]);
});

// F6 — duplicate `proposes` triples (same source/type/target, only the edge id differs) dedup
// to ONE intent. Before F6 the raw array returned ["i","i"], duplicating findings across the
// quorum/comparison/coherence consumers.
test("F6: duplicate proposes triple dedups to a single intent", () => {
  const s = spec([], [E("e1", "c", "proposes", "i"), E("e2", "c", "proposes", "i")]);
  assert.deepEqual(intentsForContract(s, "c"), ["i"]);
});
