import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluatePatchGate, PATCH_COMPARISON_CHECK } from "../tools/patch_gate.ts";
import type { EdgeRecord, LoadedSpec, NodeRecord } from "../tools/loader.ts";

// The patch-comparison gate's verdict is a pure function of the HEAD graph plus
// the PR's head branch and added-id sets, so every case here is a direct call on
// a synthetic `{spec, input}` — no git, no GitHub, no $GATE_BASE (Graft A).
// Modelled byte-for-byte on tests/checkdiff.test.ts's local builders.

const TODAY = "2026-06-20";

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
    checks: [PATCH_COMPARISON_CHECK],
    sensitivePaths: [],
  };
}

// Factories in the brief's idiom.
const patch = (id: string, status: string, branch: string, strategy = "alpha"): NodeRecord =>
  node(id, "patch", { status, branch, strategy });
const brief = (id: string): NodeRecord => node(id, "brief", { status: "draft" });
const comparison = (id: string): NodeRecord => node(id, "comparison");
const decision = (id: string): NodeRecord => node(id, "decision");
const competesFor = (id: string, patchId: string, briefId: string): EdgeRecord =>
  edge(id, "competes-for", patchId, briefId);
const compares = (id: string, comparisonId: string, patchId: string): EdgeRecord =>
  edge(id, "compares", comparisonId, patchId);
const selects = (id: string, target: string): EdgeRecord => edge(id, "selects", "decision-d", target);
const override = (id: string, expires: string | undefined): NodeRecord =>
  node(id, "override", expires === undefined ? { reason: "r", approved_by: "a" } : { reason: "r", approved_by: "a", expires });
const waives = (id: string, overrideId: string): EdgeRecord => edge(id, "waives", overrideId, PATCH_COMPARISON_CHECK);

const baseInput = {
  headBranch: "patch/widget/alpha" as string | undefined,
  addedEdgeIds: new Set<string>(),
  addedNodeIds: new Set<string>(),
  today: TODAY,
};

// ---------------------------------------------------------------------------
// (a) >1 competing patch and NO comparison/selects → FAIL (unresolved market).
// ---------------------------------------------------------------------------
test("(a) multi-patch brief with no comparison/selects fails — the market is unresolved", () => {
  const nodes = [
    brief("brief-widget-0001"),
    patch("patch-alpha-0002", "candidate", "patch/widget/alpha"),
    patch("patch-beta-0003", "candidate", "patch/widget/beta"),
  ];
  const edges = [
    competesFor("e-cf1", "patch-alpha-0002", "brief-widget-0001"),
    competesFor("e-cf2", "patch-beta-0003", "brief-widget-0001"),
  ];
  const r = evaluatePatchGate(spec(nodes, edges), baseInput);
  assert.equal(r.pass, false, r.reason);
  // The reason names the unresolved market and its competitor count.
  assert.match(r.reason, /brief-widget-0001/);
  assert.match(r.reason, /market is not resolved/);
});

// ---------------------------------------------------------------------------
// (b) same brief + a comparison covering >=2 competitors + a selects → PASS.
// ---------------------------------------------------------------------------
test("(b) a comparison covering both competitors plus a selects decision passes", () => {
  const nodes = [
    brief("brief-widget-0001"),
    decision("decision-d"),
    patch("patch-alpha-0002", "selected", "patch/widget/alpha"),
    patch("patch-beta-0003", "superseded", "patch/widget/beta"),
    comparison("comparison-widget-0004"),
  ];
  const edges = [
    competesFor("e-cf1", "patch-alpha-0002", "brief-widget-0001"),
    competesFor("e-cf2", "patch-beta-0003", "brief-widget-0001"),
    compares("e-cmp1", "comparison-widget-0004", "patch-alpha-0002"),
    compares("e-cmp2", "comparison-widget-0004", "patch-beta-0003"),
    selects("e-sel", "patch-alpha-0002"),
  ];
  const r = evaluatePatchGate(spec(nodes, edges), baseInput);
  assert.equal(r.pass, true, r.reason);
  assert.match(r.reason, /resolved/);
});

// ---------------------------------------------------------------------------
// (c) PR→brief mapping three ways.
// ---------------------------------------------------------------------------
test("(c) graph-first mapping: the patch whose branch == head resolves the brief and its market", () => {
  // The head branch matches exactly one patch node's `branch` field; that patch's
  // single competes-for edge names the brief whose market is then evaluated.
  const nodes = [
    brief("brief-widget-0001"),
    patch("patch-alpha-0002", "candidate", "patch/widget/alpha"),
    patch("patch-beta-0003", "candidate", "patch/widget/beta"),
  ];
  const edges = [
    competesFor("e-cf1", "patch-alpha-0002", "brief-widget-0001"),
    competesFor("e-cf2", "patch-beta-0003", "brief-widget-0001"),
  ];
  // head maps to patch-alpha; its brief has 2 competitors and no resolution → fail.
  const r = evaluatePatchGate(spec(nodes, edges), { ...baseInput, headBranch: "patch/widget/alpha" });
  assert.equal(r.pass, false, r.reason);
  assert.match(r.reason, /brief-widget-0001/);
});

test("(c) patch-branch with NO matching patch node fails closed — never silently passes", () => {
  // The head is a patch/... branch but no patch node records it: the gate cannot
  // verify the market and fails closed rather than waving the merge through.
  const nodes = [
    brief("brief-widget-0001"),
    patch("patch-alpha-0002", "candidate", "patch/widget/alpha"),
    patch("patch-beta-0003", "candidate", "patch/widget/beta"),
  ];
  const edges = [
    competesFor("e-cf1", "patch-alpha-0002", "brief-widget-0001"),
    competesFor("e-cf2", "patch-beta-0003", "brief-widget-0001"),
  ];
  const r = evaluatePatchGate(spec(nodes, edges), { ...baseInput, headBranch: "patch/widget/renamed" });
  assert.equal(r.pass, false, r.reason);
  assert.match(r.reason, /no patch node records it/);
});

test("(c) a non-patch head branch that maps to no patch node passes — unrelated PR, not stranded", () => {
  // An ordinary feature branch that is not a patch/... branch and maps to no patch
  // node is NOT a patch-market merge: the gate passes so it never reds an unrelated PR.
  const nodes = [
    brief("brief-widget-0001"),
    patch("patch-alpha-0002", "candidate", "patch/widget/alpha"),
    patch("patch-beta-0003", "candidate", "patch/widget/beta"),
  ];
  const edges = [
    competesFor("e-cf1", "patch-alpha-0002", "brief-widget-0001"),
    competesFor("e-cf2", "patch-beta-0003", "brief-widget-0001"),
  ];
  const r = evaluatePatchGate(spec(nodes, edges), { ...baseInput, headBranch: "feature/unrelated" });
  assert.equal(r.pass, true, r.reason);
  assert.match(r.reason, /not a patch-market merge/);
});

test("(c) an undefined head branch FAILS CLOSED — a merge queue / detached HEAD cannot skip the gate", () => {
  // When the head branch cannot be determined (no $GITHUB_HEAD_REF, detached HEAD —
  // e.g. a `merge_group:` run) the gate cannot prove the merge skipped no market, so
  // it fails closed rather than waving every PR through unconditionally.
  const nodes = [brief("brief-widget-0001"), patch("patch-alpha-0002", "candidate", "patch/widget/alpha")];
  const edges = [competesFor("e-cf1", "patch-alpha-0002", "brief-widget-0001")];
  const r = evaluatePatchGate(spec(nodes, edges), { ...baseInput, headBranch: undefined });
  assert.equal(r.pass, false, r.reason);
  assert.match(r.reason, /cannot determine the PR head branch/);
});

// ---------------------------------------------------------------------------
// (d) override expiry — waives → patch-comparison.
// ---------------------------------------------------------------------------
function unresolvedMarket(): { nodes: NodeRecord[]; edges: EdgeRecord[] } {
  // Two live competitors, no comparison/selects → market unresolved (the case an
  // override is meant to wave through).
  return {
    nodes: [
      brief("brief-widget-0001"),
      patch("patch-alpha-0002", "candidate", "patch/widget/alpha"),
      patch("patch-beta-0003", "candidate", "patch/widget/beta"),
    ],
    edges: [
      competesFor("e-cf1", "patch-alpha-0002", "brief-widget-0001"),
      competesFor("e-cf2", "patch-beta-0003", "brief-widget-0001"),
    ],
  };
}

test("(d) an added override + waives → patch-comparison (unexpired) passes the unresolved market", () => {
  const { nodes, edges } = unresolvedMarket();
  const ovNode = override("override-x-0010", "2099-01-01");
  const wEdge = waives("e-w", "override-x-0010");
  const r = evaluatePatchGate(spec([...nodes, ovNode], [...edges, wEdge]), {
    ...baseInput,
    addedNodeIds: new Set(["override-x-0010"]),
    addedEdgeIds: new Set(["e-w"]),
  });
  assert.equal(r.pass, true, r.reason);
  assert.match(r.reason, /waives patch-comparison/);
});

test("(d) an expired override does not waive — fails with /expired/", () => {
  const { nodes, edges } = unresolvedMarket();
  const ovNode = override("override-old-0011", "2020-01-01");
  const wEdge = waives("e-w", "override-old-0011");
  const r = evaluatePatchGate(spec([...nodes, ovNode], [...edges, wEdge]), {
    ...baseInput,
    addedNodeIds: new Set(["override-old-0011"]),
    addedEdgeIds: new Set(["e-w"]),
  });
  assert.equal(r.pass, false);
  assert.match(r.reason, /expired/);
});

test("(d) an override with no 'expires' does not hard-pass (near-miss, keeps scanning)", () => {
  const { nodes, edges } = unresolvedMarket();
  const ovNode = override("override-noexp-0012", undefined);
  const wEdge = waives("e-w", "override-noexp-0012");
  const r = evaluatePatchGate(spec([...nodes, ovNode], [...edges, wEdge]), {
    ...baseInput,
    addedNodeIds: new Set(["override-noexp-0012"]),
    addedEdgeIds: new Set(["e-w"]),
  });
  assert.equal(r.pass, false);
  assert.match(r.reason, /missing or unparseable/);
});

test("(d) a calendar-invalid 'expires' does not waive (2099-99-99 is shape-valid but no real day)", () => {
  const { nodes, edges } = unresolvedMarket();
  const ovNode = override("override-badexp-0013", "2099-99-99");
  const wEdge = waives("e-w", "override-badexp-0013");
  const r = evaluatePatchGate(spec([...nodes, ovNode], [...edges, wEdge]), {
    ...baseInput,
    addedNodeIds: new Set(["override-badexp-0013"]),
    addedEdgeIds: new Set(["e-w"]),
  });
  assert.equal(r.pass, false);
  assert.match(r.reason, /missing or unparseable/);
});

test("(d) a pre-existing override (not added in this PR) does not waive", () => {
  const { nodes, edges } = unresolvedMarket();
  const ovNode = override("override-x-0010", "2099-01-01");
  const wEdge = waives("e-w", "override-x-0010");
  // The override node and waives edge exist at HEAD but are NOT in the added sets.
  const r = evaluatePatchGate(spec([...nodes, ovNode], [...edges, wEdge]), {
    ...baseInput,
    addedNodeIds: new Set(),
    addedEdgeIds: new Set(),
  });
  assert.equal(r.pass, false, r.reason);
  assert.match(r.reason, /market is not resolved/);
});

test("(d) an override waiving a DIFFERENT check does not waive patch-comparison", () => {
  const { nodes, edges } = unresolvedMarket();
  const ovNode = override("override-x-0010", "2099-01-01");
  const wEdge = edge("e-w", "waives", "override-x-0010", "pr-evidence");
  const r = evaluatePatchGate(spec([...nodes, ovNode], [...edges, wEdge]), {
    ...baseInput,
    addedNodeIds: new Set(["override-x-0010"]),
    addedEdgeIds: new Set(["e-w"]),
  });
  assert.equal(r.pass, false, r.reason);
});

// ---------------------------------------------------------------------------
// (e) single-competitor brief → PASS (no market, gate inert).
// ---------------------------------------------------------------------------
test("(e) a brief with exactly one competing patch has no market — the gate is inert and passes", () => {
  const nodes = [brief("brief-widget-0001"), patch("patch-alpha-0002", "candidate", "patch/widget/alpha")];
  const edges = [competesFor("e-cf1", "patch-alpha-0002", "brief-widget-0001")];
  const r = evaluatePatchGate(spec(nodes, edges), { ...baseInput, headBranch: "patch/widget/alpha" });
  assert.equal(r.pass, true, r.reason);
  assert.match(r.reason, /no market to resolve/);
});

test("(e) a brief with zero competing patches (patch competes-for nothing resolvable) fails closed", () => {
  // A patch that records the head branch but competes-for no resolvable brief
  // cannot have its market determined — fail closed (exactly one brief required).
  const nodes = [patch("patch-alpha-0002", "candidate", "patch/widget/alpha")];
  const edges: EdgeRecord[] = [];
  const r = evaluatePatchGate(spec(nodes, edges), { ...baseInput, headBranch: "patch/widget/alpha" });
  assert.equal(r.pass, false, r.reason);
  assert.match(r.reason, /exactly one required/);
});

test("a head branch recorded by TWO patch nodes is ambiguous and fails closed", () => {
  const nodes = [
    brief("brief-widget-0001"),
    patch("patch-alpha-0002", "candidate", "patch/widget/alpha"),
    patch("patch-dup-0003", "candidate", "patch/widget/alpha"),
  ];
  const edges = [
    competesFor("e-cf1", "patch-alpha-0002", "brief-widget-0001"),
    competesFor("e-cf2", "patch-dup-0003", "brief-widget-0001"),
  ];
  const r = evaluatePatchGate(spec(nodes, edges), { ...baseInput, headBranch: "patch/widget/alpha" });
  assert.equal(r.pass, false, r.reason);
  assert.match(r.reason, /ambiguous/);
});
