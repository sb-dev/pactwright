import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDriftMap } from "../tools/driftmap.ts";
import type { EdgeRecord, LoadedSpec, NodeRecord } from "../tools/loader.ts";

function node(id: string, type: string, extra: Record<string, unknown> = {}): NodeRecord {
  return { file: `specs/nodes/${id}.md`, data: { id, type, ...extra }, body: "body" };
}
function edge(id: string, type: string, source: string, target: string): EdgeRecord {
  return { id, type, source, target, created: "2026-06-14" };
}
function spec(nodes: NodeRecord[], edges: EdgeRecord[]): LoadedSpec {
  return { root: "/repo/specs", nodes, edges, nodeTypes: {}, edgeTypes: {}, rules: [], checks: [], sensitivePaths: [] };
}

const capTooling = node("capability-tooling-0001", "capability", { status: "active", title: "Tooling", paths: ["tools/**"] });
const capDocs = node("capability-docs-0009", "capability", { status: "active", title: "Docs", paths: ["docs/**"] });
const ev = node("evidence-0002", "evidence", { status: "final", title: "E1" });
const brief = node("brief-0003", "brief", { status: "implemented", title: "B1" });
const cApproved = node("contract-app-0004", "contract", { status: "approved", title: "CA" });
const cSuper = node("contract-super-0005", "contract", { status: "superseded", title: "CS" });
const linkEdges = [
  edge("t", "touches", "evidence-0002", "capability-tooling-0001"),
  edge("ev", "evidences", "evidence-0002", "brief-0003"),
  edge("d", "decomposes", "brief-0003", "contract-app-0004"),
];

test("a linked capability yields one packet with its approved contract, brief, and evidence", () => {
  const r = buildDriftMap(spec([capTooling, ev, brief, cApproved], linkEdges), ["tools/spec.ts"]);
  assert.equal(r.packets.length, 1);
  const p = r.packets[0];
  assert.equal(p.capability, "capability-tooling-0001");
  assert.deepEqual(p.changedFiles, ["tools/spec.ts"]);
  assert.equal(p.linkState, "linked");
  assert.equal(p.approvedContract, "contract-app-0004");
  assert.deepEqual(p.contracts.map((c) => c.id), ["contract-app-0004"]);
  assert.deepEqual(p.briefs.map((b) => b.id), ["brief-0003"]);
  assert.deepEqual(p.priorEvidence.map((e) => e.id), ["evidence-0002"]);
  assert.deepEqual(r.uncovered, []);
});

test("a capability reaching many contracts lists all and flags the approved one", () => {
  const edges = [...linkEdges, edge("d2", "decomposes", "brief-0003", "contract-super-0005")];
  const r = buildDriftMap(spec([capTooling, ev, brief, cApproved, cSuper], edges), ["tools/spec.ts"]);
  const p = r.packets[0];
  assert.deepEqual(p.contracts.map((c) => c.id), ["contract-app-0004", "contract-super-0005"]);
  assert.equal(p.approvedContract, "contract-app-0004");
});

test("a matched-but-unlinked capability is reported with linkState unlinked and no contract", () => {
  const r = buildDriftMap(spec([capDocs], []), ["docs/guide.md"]);
  assert.equal(r.packets.length, 1);
  const p = r.packets[0];
  assert.equal(p.linkState, "unlinked");
  assert.equal(p.approvedContract, null);
  assert.deepEqual(p.contracts, []);
  assert.deepEqual(p.priorEvidence, []);
});

test("changed files owned by no capability go to uncovered", () => {
  const r = buildDriftMap(spec([capTooling, ev, brief, cApproved], linkEdges), ["tools/spec.ts", "weird/path.ts"]);
  assert.equal(r.packets.length, 1);
  assert.deepEqual(r.uncovered, ["weird/path.ts"]);
});

test("a change spanning two capabilities yields two packets, sorted by capability id", () => {
  const r = buildDriftMap(spec([capTooling, capDocs, ev, brief, cApproved], linkEdges), ["tools/a.ts", "docs/b.md"]);
  assert.deepEqual(r.packets.map((p) => p.capability), ["capability-docs-0009", "capability-tooling-0001"]);
  assert.deepEqual(r.uncovered, []);
});
