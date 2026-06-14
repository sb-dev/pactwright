import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateGate } from "../tools/gate.ts";
import type { EdgeRecord, LoadedSpec, NodeRecord } from "../tools/loader.ts";

const TODAY = "2026-06-13";

function node(id: string, type: string, extra: Record<string, unknown> = {}): NodeRecord {
  return { file: `specs/nodes/${id}.md`, data: { id, type, ...extra }, body: "body" };
}

function edge(id: string, type: string, source: string, target: string): EdgeRecord {
  return { id, type, source, target, created: TODAY };
}

function spec(nodes: NodeRecord[], edges: EdgeRecord[]): LoadedSpec {
  return {
    root: "/repo/specs",
    nodes,
    edges,
    nodeTypes: {},
    edgeTypes: {},
    rules: [],
    checks: ["ci", "spec-index", "spec-validate", "pr-evidence"],
  };
}

// Shared graph: an approved contract decomposed by a brief, plus an override.
const nodes = [
  node("contract-x-0001", "contract", { status: "approved" }),
  node("contract-y-0002", "contract", { status: "candidate" }),
  node("brief-x-0003", "brief", { status: "draft" }),
  node("evidence-x-0004", "evidence", { status: "draft" }),
  node("override-x-0005", "override", { reason: "r", approved_by: "a", expires: "2099-01-01" }),
  node("override-old-0006", "override", { reason: "r", approved_by: "a", expires: "2020-01-01" }),
  node("override-noexp-0007", "override", { reason: "r", approved_by: "a" }),
  node("override-badexp-0008", "override", { reason: "r", approved_by: "a", expires: "2099-99-99" }),
];
const decomposes = edge("e-dec", "decomposes", "brief-x-0003", "contract-x-0001");

test("clause (a): added evidences edge -> brief -> approved contract passes", () => {
  const ev = edge("e-ev", "evidences", "evidence-x-0004", "brief-x-0003");
  const result = evaluateGate(spec(nodes, [decomposes, ev]), {
    addedEdgeIds: new Set(["e-ev"]),
    addedNodeIds: new Set(),
    today: TODAY,
  });
  assert.equal(result.pass, true, result.reason);
});

test("clause (a): an evidences edge present at base (not added) does not pass", () => {
  const ev = edge("e-ev", "evidences", "evidence-x-0004", "brief-x-0003");
  const result = evaluateGate(spec(nodes, [decomposes, ev]), {
    addedEdgeIds: new Set(), // nothing added
    addedNodeIds: new Set(),
    today: TODAY,
  });
  assert.equal(result.pass, false, result.reason);
});

test("clause (a): brief decomposing a non-approved contract does not pass", () => {
  const dec2 = edge("e-dec2", "decomposes", "brief-x-0003", "contract-y-0002");
  const ev = edge("e-ev", "evidences", "evidence-x-0004", "brief-x-0003");
  const result = evaluateGate(spec(nodes, [dec2, ev]), {
    addedEdgeIds: new Set(["e-ev"]),
    addedNodeIds: new Set(),
    today: TODAY,
  });
  assert.equal(result.pass, false, result.reason);
});

test("clause (b): added override waiving pr-evidence (unexpired) passes", () => {
  const w = edge("e-w", "waives", "override-x-0005", "pr-evidence");
  const result = evaluateGate(spec(nodes, [w]), {
    addedEdgeIds: new Set(["e-w"]),
    addedNodeIds: new Set(["override-x-0005"]),
    today: TODAY,
  });
  assert.equal(result.pass, true, result.reason);
});

test("clause (b): an expired override does not waive", () => {
  const w = edge("e-w", "waives", "override-old-0006", "pr-evidence");
  const result = evaluateGate(spec(nodes, [w]), {
    addedEdgeIds: new Set(["e-w"]),
    addedNodeIds: new Set(["override-old-0006"]),
    today: TODAY,
  });
  assert.equal(result.pass, false);
  assert.match(result.reason, /expired/);
});

test("clause (b): a waives edge to a different check does not waive pr-evidence", () => {
  const w = edge("e-w", "waives", "override-x-0005", "spec-validate");
  const result = evaluateGate(spec(nodes, [w]), {
    addedEdgeIds: new Set(["e-w"]),
    addedNodeIds: new Set(["override-x-0005"]),
    today: TODAY,
  });
  assert.equal(result.pass, false, result.reason);
});

test("clause (b): a pre-existing override (not added in this PR) does not waive", () => {
  const w = edge("e-w", "waives", "override-x-0005", "pr-evidence");
  const result = evaluateGate(spec(nodes, [w]), {
    addedEdgeIds: new Set(["e-w"]),
    addedNodeIds: new Set(), // override node existed before this PR
    today: TODAY,
  });
  assert.equal(result.pass, false, result.reason);
});

test("no added evidence and no override: fails", () => {
  const result = evaluateGate(spec(nodes, [decomposes]), {
    addedEdgeIds: new Set(),
    addedNodeIds: new Set(),
    today: TODAY,
  });
  assert.equal(result.pass, false);
});

test("clause (b): an override with no 'expires' does not waive (near-miss message)", () => {
  const w = edge("e-w", "waives", "override-noexp-0007", "pr-evidence");
  const result = evaluateGate(spec(nodes, [w]), {
    addedEdgeIds: new Set(["e-w"]),
    addedNodeIds: new Set(["override-noexp-0007"]),
    today: TODAY,
  });
  assert.equal(result.pass, false);
  assert.match(result.reason, /missing or unparseable/);
});

test("clause (b): an override with a calendar-invalid 'expires' does not waive", () => {
  // `2099-99-99` matches the YYYY-MM-DD shape but names no real day, so the
  // strict calendar check rejects it rather than letting it waive forever.
  const w = edge("e-w", "waives", "override-badexp-0008", "pr-evidence");
  const result = evaluateGate(spec(nodes, [w]), {
    addedEdgeIds: new Set(["e-w"]),
    addedNodeIds: new Set(["override-badexp-0008"]),
    today: TODAY,
  });
  assert.equal(result.pass, false);
  assert.match(result.reason, /missing or unparseable/);
});

test("clause (a): a brief decomposing an approved NON-contract node does not pass", () => {
  // The target is `status: approved` but `type: intent`, not `contract`; the
  // type guard must reject it (robust even when spec:validate hasn't run).
  const localNodes = [
    node("brief-z-0010", "brief", { status: "draft" }),
    node("evidence-z-0011", "evidence", { status: "draft" }),
    node("intent-approved-0012", "intent", { status: "approved" }),
  ];
  const dec = edge("e-dec", "decomposes", "brief-z-0010", "intent-approved-0012");
  const ev = edge("e-ev", "evidences", "evidence-z-0011", "brief-z-0010");
  const result = evaluateGate(spec(localNodes, [dec, ev]), {
    addedEdgeIds: new Set(["e-ev"]),
    addedNodeIds: new Set(),
    today: TODAY,
  });
  assert.equal(result.pass, false, result.reason);
});
