import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluatePatchGate } from "../tools/patch_gate.ts";
import selectedPatchComparison from "../tools/handlers/selected_patch_comparison.ts";
import {
  competingPatches,
  liveCompetitors,
} from "../tools/handlers/coverage_traversal.ts";
import { nodesById } from "../tools/loader.ts";
import type { EdgeRecord, LoadedSpec, NodeRecord, Rule } from "../tools/loader.ts";

// PARITY: the diff-aware patch gate (`evaluatePatchGate`) and the structural rule
// (`selectedPatchComparison`) must reach the SAME verdict on the SAME graph — the
// gate passes a market iff the rule finds the brief clean. The cross-path test below
// drives BOTH public entry points (not the shared helper re-called twice, which
// would be a `f(x)==f(x)` tautology) so a future re-inlined divergent competitor
// walk inside the gate flips one side and breaks the test.
//
// The status helpers are also pinned directly: a `selected` winner AND `superseded`
// losers are excluded from `liveCompetitors`, but BOTH are present in the
// status-blind `competingPatches`.

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
    checks: ["patch-comparison"],
    sensitivePaths: [],
  };
}
const patch = (id: string, status: string, branch: string): NodeRecord =>
  node(id, "patch", { status, branch, strategy: "s" });
const brief = (id: string): NodeRecord => node(id, "brief", { status: "draft" });
const comparison = (id: string): NodeRecord => node(id, "comparison");
const decision = (id: string): NodeRecord => node(id, "decision");
const competesFor = (id: string, patchId: string, briefId: string): EdgeRecord =>
  edge(id, "competes-for", patchId, briefId);
const compares = (id: string, comparisonId: string, target: string): EdgeRecord =>
  edge(id, "compares", comparisonId, target);
const selects = (id: string, target: string): EdgeRecord => edge(id, "selects", "decision-d", target);

const BRIEF = "brief-widget-0001";

// One fixture: a mix of candidate, one selected, one superseded patch, all
// competing for a single brief, plus a comparison covering the two non-winner
// historical competitors and a selects on the winner.
function mixedMarket(): { nodes: NodeRecord[]; edges: EdgeRecord[] } {
  return {
    nodes: [
      brief(BRIEF),
      patch("patch-win-0002", "selected", "patch/widget/win"),
      patch("patch-cand-0003", "candidate", "patch/widget/cand"),
      patch("patch-old-0004", "superseded", "patch/widget/old"),
      comparison("comparison-widget-0005"),
    ],
    edges: [
      competesFor("e-cf1", "patch-win-0002", BRIEF),
      competesFor("e-cf2", "patch-cand-0003", BRIEF),
      competesFor("e-cf3", "patch-old-0004", BRIEF),
      compares("e-c1", "comparison-widget-0005", "patch-win-0002"),
      compares("e-c2", "comparison-widget-0005", "patch-old-0004"),
      selects("e-sel", "patch-win-0002"),
    ],
  };
}

test("parity: competingPatches is status-blind — it includes the selected winner AND superseded loser", () => {
  const { nodes, edges } = mixedMarket();
  const s = spec(nodes, edges);
  const byId = nodesById(s);
  const competing = competingPatches(s, byId, BRIEF);
  assert.deepEqual(
    [...competing].sort(),
    ["patch-cand-0003", "patch-old-0004", "patch-win-0002"],
    "competingPatches must include all three regardless of status",
  );
});

test("parity (Fix 2): liveCompetitors excludes BOTH `selected` and `superseded`", () => {
  const { nodes, edges } = mixedMarket();
  const s = spec(nodes, edges);
  const byId = nodesById(s);
  const live = liveCompetitors(s, byId, BRIEF);
  // Only the lone `candidate` survives; the selected winner and superseded loser drop out.
  assert.deepEqual([...live].sort(), ["patch-cand-0003"]);
  assert.ok(!live.has("patch-win-0002"), "selected winner must NOT be a live competitor");
  assert.ok(!live.has("patch-old-0004"), "superseded loser must NOT be a live competitor");
});

const PARITY_RULE: Rule = { id: "selected-patch-comparison", kind: "selected_patch_comparison" };

// Fixture R — FULLY RESOLVED: a comparison covers BOTH competitors, the winner is
// selected by a decision, and no live candidate remains. Both paths agree: clean.
function resolvedMarket(): { nodes: NodeRecord[]; edges: EdgeRecord[] } {
  return {
    nodes: [
      brief(BRIEF),
      decision("decision-d"),
      patch("patch-win-0002", "selected", "patch/widget/win"),
      patch("patch-old-0004", "superseded", "patch/widget/old"),
      comparison("comparison-widget-0005"),
    ],
    edges: [
      competesFor("e-cf1", "patch-win-0002", BRIEF),
      competesFor("e-cf3", "patch-old-0004", BRIEF),
      compares("e-c1", "comparison-widget-0005", "patch-win-0002"),
      compares("e-c2", "comparison-widget-0005", "patch-old-0004"),
      selects("e-sel", "patch-win-0002"),
    ],
  };
}

// Fixture U — an UNCOVERED LIVE candidate (the panel's concrete divergence case):
// the comparison covers {win, old} but a live `candidate` is left uncompared. The
// rule reds it; an aligned gate must NOT pass it. This is the regression guard for
// the gate↔rule "resolved" parity fix — it FAILS on the pre-fix looser gate.
function uncoveredLiveMarket(): { nodes: NodeRecord[]; edges: EdgeRecord[] } {
  return {
    nodes: [
      brief(BRIEF),
      decision("decision-d"),
      patch("patch-win-0002", "selected", "patch/widget/win"),
      patch("patch-old-0004", "superseded", "patch/widget/old"),
      patch("patch-cand-0003", "candidate", "patch/widget/cand"),
      comparison("comparison-widget-0005"),
    ],
    edges: [
      competesFor("e-cf1", "patch-win-0002", BRIEF),
      competesFor("e-cf2", "patch-cand-0003", BRIEF),
      competesFor("e-cf3", "patch-old-0004", BRIEF),
      compares("e-c1", "comparison-widget-0005", "patch-win-0002"),
      compares("e-c2", "comparison-widget-0005", "patch-old-0004"),
      selects("e-sel", "patch-win-0002"),
    ],
  };
}

for (const { label, fixture, expectedPass } of [
  { label: "fully resolved", fixture: resolvedMarket, expectedPass: true },
  { label: "uncovered live candidate", fixture: uncoveredLiveMarket, expectedPass: false },
]) {
  test(`parity: gate verdict == rule cleanliness on the SAME graph — ${label}`, () => {
    // ONE graph, BOTH public entry points: the gate's full verdict on the winner's
    // head branch, and the rule's findings. They must agree — gate passes iff the
    // rule leaves the brief clean — which is exactly what "no drift" must mean.
    const { nodes, edges } = fixture();
    const s = spec(nodes, edges);

    const gate = evaluatePatchGate(s, {
      headBranch: "patch/widget/win",
      addedEdgeIds: new Set(),
      addedNodeIds: new Set(),
      today: TODAY,
    });
    const briefFindings = selectedPatchComparison(PARITY_RULE, s).filter((f) => f.subject === BRIEF);

    assert.equal(
      gate.pass,
      briefFindings.length === 0,
      `gate.pass=${gate.pass} but rule findings=${briefFindings.length} — verdicts diverged (${gate.reason})`,
    );
    assert.equal(gate.pass, expectedPass, gate.reason);
    if (!expectedPass) {
      // The rule names the uncovered live candidate; the gate calls the market unresolved.
      assert.match(briefFindings[0].detail, /patch-cand-0003/);
      assert.match(gate.reason, /not resolved/);
    } else {
      assert.match(gate.reason, /resolved/);
    }
  });
}

test("parity: an all-candidate open market — gate sees a market, handler sees no selection", () => {
  // Two live candidates, no comparison/selects. Both the gate and the predicate agree
  // the market is unresolved: competingPatches and liveCompetitors are the same 2-set.
  const nodes = [
    brief(BRIEF),
    patch("patch-a-0002", "candidate", "patch/widget/a"),
    patch("patch-b-0003", "candidate", "patch/widget/b"),
  ];
  const edges = [
    competesFor("e-cf1", "patch-a-0002", BRIEF),
    competesFor("e-cf2", "patch-b-0003", BRIEF),
  ];
  const s = spec(nodes, edges);
  const byId = nodesById(s);

  const competing = competingPatches(s, byId, BRIEF);
  const live = liveCompetitors(s, byId, BRIEF);
  // No selected/superseded patches, so status-blind and live sets coincide here.
  assert.deepEqual([...competing].sort(), [...live].sort());
  assert.equal(competing.size, 2);

  // The gate sees a market (>1) and no resolution → FAIL.
  const gateResult = evaluatePatchGate(s, {
    headBranch: "patch/widget/a",
    addedEdgeIds: new Set(),
    addedNodeIds: new Set(),
    today: TODAY,
  });
  assert.equal(gateResult.pass, false, gateResult.reason);

  // No `selects` edge exists, so the structural handler emits nothing (it only
  // judges SELECTED patches) — the two rules occupy disjoint trigger conditions but
  // share the identical competitor definition, which is what this parity guards.
  const RULE: Rule = { id: "selected-patch-comparison", kind: "selected_patch_comparison" };
  assert.deepEqual(selectedPatchComparison(RULE, s), []);
});

test("parity: a fully superseded-loser + selected-winner steady state has zero live competitors", () => {
  // The post-selection steady state: one selected winner, the rest superseded. The
  // shared predicate must report zero LIVE competitors (so a later winner-merge is
  // not re-gated as an open market) while competingPatches still records the history.
  const nodes = [
    brief(BRIEF),
    patch("patch-win-0002", "selected", "patch/widget/win"),
    patch("patch-old1-0003", "superseded", "patch/widget/old1"),
    patch("patch-old2-0004", "superseded", "patch/widget/old2"),
  ];
  const edges = [
    competesFor("e-cf1", "patch-win-0002", BRIEF),
    competesFor("e-cf2", "patch-old1-0003", BRIEF),
    competesFor("e-cf3", "patch-old2-0004", BRIEF),
  ];
  const s = spec(nodes, edges);
  const byId = nodesById(s);

  assert.equal(competingPatches(s, byId, BRIEF).size, 3, "history is preserved status-blind");
  assert.equal(liveCompetitors(s, byId, BRIEF).size, 0, "no live competitors remain after selection");
});
