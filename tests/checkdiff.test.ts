import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateCheckDiff } from "../tools/checkdiff.ts";
import type { EdgeRecord, LoadedSpec, NodeRecord } from "../tools/loader.ts";

const TODAY = "2026-06-14";
const SENSITIVE = ["specs/schema/**"];

function node(id: string, type: string, extra: Record<string, unknown> = {}): NodeRecord {
  return { file: `specs/nodes/${id}.md`, data: { id, type, ...extra }, body: "body" };
}
function edge(id: string, type: string, source: string, target: string): EdgeRecord {
  return { id, type, source, target, created: TODAY };
}
function spec(nodes: NodeRecord[], edges: EdgeRecord[]): LoadedSpec {
  return { root: "/repo/specs", nodes, edges, nodeTypes: {}, edgeTypes: {}, rules: [], checks: [], sensitivePaths: SENSITIVE };
}

const capSchema = node("capability-spec-schema-0001", "capability", { status: "active", paths: ["specs/schema/**"] });
const capOther = node("capability-other-0002", "capability", { status: "active", paths: ["tools/**"] });
const ev = node("evidence-pr-0003", "evidence", { status: "draft" });
const brief = node("brief-0004", "brief", { status: "draft" });
const contract = node("contract-0005", "contract", { status: "approved" });
const decomposes = edge("e-dec", "decomposes", "brief-0004", "contract-0005");

test("non-sensitive change passes regardless of evidence", () => {
  const r = evaluateCheckDiff(spec([capSchema], []), {
    changedFiles: ["tools/spec.ts", "README.md"],
    addedEdgeIds: new Set(),
    addedNodeIds: new Set(),
    today: TODAY,
  });
  assert.equal(r.pass, true, r.reason);
});

test("sensitive change with no evidence and no override fails", () => {
  const r = evaluateCheckDiff(spec([capSchema], []), {
    changedFiles: ["specs/schema/node-types.yaml"],
    addedEdgeIds: new Set(),
    addedNodeIds: new Set(),
    today: TODAY,
  });
  assert.equal(r.pass, false);
  assert.match(r.reason, /touches the owning capability/);
});

test("sensitive change passes when added evidence touches the OWNING capability and reaches an approved contract", () => {
  const touches = edge("e-touch", "touches", "evidence-pr-0003", "capability-spec-schema-0001");
  const evidences = edge("e-ev", "evidences", "evidence-pr-0003", "brief-0004");
  const r = evaluateCheckDiff(spec([capSchema, ev, brief, contract], [decomposes, touches, evidences]), {
    changedFiles: ["specs/schema/node-types.yaml"],
    addedEdgeIds: new Set(["e-ev", "e-touch"]),
    addedNodeIds: new Set(["evidence-pr-0003"]),
    today: TODAY,
  });
  assert.equal(r.pass, true, r.reason);
});

test("evidence reaching an approved contract but touching a DIFFERENT capability fails (amendment-5 binding)", () => {
  const touchesOther = edge("e-touch", "touches", "evidence-pr-0003", "capability-other-0002");
  const evidences = edge("e-ev", "evidences", "evidence-pr-0003", "brief-0004");
  const r = evaluateCheckDiff(spec([capSchema, capOther, ev, brief, contract], [decomposes, touchesOther, evidences]), {
    changedFiles: ["specs/schema/node-types.yaml"],
    addedEdgeIds: new Set(["e-ev", "e-touch"]),
    addedNodeIds: new Set(["evidence-pr-0003"]),
    today: TODAY,
  });
  assert.equal(r.pass, false, r.reason);
});

test("a sensitive file owned by no capability fails with a clear reason", () => {
  const r = evaluateCheckDiff(spec([capOther], []), {
    changedFiles: ["specs/schema/node-types.yaml"],
    addedEdgeIds: new Set(),
    addedNodeIds: new Set(),
    today: TODAY,
  });
  assert.equal(r.pass, false);
  assert.match(r.reason, /no owning capability/);
});

test("an added override waiving check-diff (unexpired) passes", () => {
  const override = node("override-0006", "override", { reason: "migration", approved_by: "sb-dev", expires: "2099-01-01" });
  const waives = edge("e-w", "waives", "override-0006", "check-diff");
  const r = evaluateCheckDiff(spec([capSchema, override], [waives]), {
    changedFiles: ["specs/schema/node-types.yaml"],
    addedEdgeIds: new Set(["e-w"]),
    addedNodeIds: new Set(["override-0006"]),
    today: TODAY,
  });
  assert.equal(r.pass, true, r.reason);
});

test("an expired override does not waive", () => {
  const override = node("override-old-0007", "override", { reason: "x", approved_by: "a", expires: "2020-01-01" });
  const waives = edge("e-w", "waives", "override-old-0007", "check-diff");
  const r = evaluateCheckDiff(spec([capSchema, override], [waives]), {
    changedFiles: ["specs/schema/node-types.yaml"],
    addedEdgeIds: new Set(["e-w"]),
    addedNodeIds: new Set(["override-old-0007"]),
    today: TODAY,
  });
  assert.equal(r.pass, false);
  assert.match(r.reason, /expired/);
});
