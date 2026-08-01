import { test } from "node:test";
import assert from "node:assert/strict";
import {
  backingContracts,
  briefsForPatch,
  intentsForContract,
  liveProposingContracts,
  liveSourcesByEdge,
  patchMarketResolved,
  selectedContracts,
} from "../tools/handlers/coverage_traversal.ts";
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

// A8 — `selectedContracts` is THE authoritative spelling of "selected", shared by
// coverage-coherence and unbacked-addressed so the two rules cannot mean different
// things by it. It is the RESOLVING walk, not the raw `selects`-target scan it
// replaced, and the two disagree on exactly the edges pinned below.
test("selectedContracts resolves and type-checks BOTH endpoints of every selects edge", () => {
  const s = spec(
    [
      node({ id: "dec", type: "decision" }),
      node({ id: "c1", type: "contract", status: "approved" }),
      node({ id: "c2", type: "contract", status: "superseded" }),
      node({ id: "p1", type: "patch" }),
      node({ id: "notdec", type: "brief" }),
      node({ id: "c3", type: "contract", status: "approved" }),
    ],
    [
      E("s1", "dec", "selects", "c1"),
      E("s2", "dec", "selects", "c2"), // STATUS-BLIND on purpose: "was it selected" is historical
      E("s3", "dec", "selects", "p1"), // selects → patch: target is not a contract, excluded
      E("s4", "dec-missing", "selects", "c3"), // unresolved SOURCE confers nothing (the raw scan disagreed)
      E("s5", "notdec", "selects", "c3"), // resolved but not a `decision`: excluded
      E("s6", "dec", "proposes", "c3"), // not a selects edge at all
    ],
  );
  assert.deepEqual([...selectedContracts(s, nodesById(s))].sort(), ["c1", "c2"]);
});

// A6, the singleton clause — the whole of the laundering defence, asserted on the
// predicate itself rather than only through the rule. A contract that markets two
// intents backs NEITHER, so appending one `proposes` line to an already-selected
// contract costs it its own previously-green intent instead of laundering the new one.
test("backingContracts: a selected contract marketing TWO intents backs neither", () => {
  const s = spec(
    [node({ id: "dec", type: "decision" }), node({ id: "c", type: "contract", status: "approved" })],
    [E("p1", "c", "proposes", "i1"), E("p2", "c", "proposes", "i2"), E("s1", "dec", "selects", "c")],
  );
  assert.deepEqual([...backingContracts(s, nodesById(s), "i1")], []);
  assert.deepEqual([...backingContracts(s, nodesById(s), "i2")], []);
});

test("backingContracts: a selected, live contract marketing exactly ONE intent backs it", () => {
  const s = spec(
    [node({ id: "dec", type: "decision" }), node({ id: "c", type: "contract", status: "approved" })],
    [E("p1", "c", "proposes", "i1"), E("s1", "dec", "selects", "c")],
  );
  assert.deepEqual([...backingContracts(s, nodesById(s), "i1")], ["c"]);
});

test("backingContracts: an UNSELECTED singleton proposer backs nothing (the A9 discriminator)", () => {
  // Drops only the `selects` edge from the case above. An implementation that degrades
  // to `liveProposingContracts(i).size > 0` returns {"c"} here.
  const s = spec([node({ id: "c", type: "contract", status: "approved" })], [E("p1", "c", "proposes", "i1")]);
  assert.deepEqual([...backingContracts(s, nodesById(s), "i1")], []);
});

test("backingContracts: a SUPERSEDED selected singleton proposer backs nothing", () => {
  const s = spec(
    [node({ id: "dec", type: "decision" }), node({ id: "c", type: "contract", status: "superseded" })],
    [E("p1", "c", "proposes", "i1"), E("s1", "dec", "selects", "c")],
  );
  assert.deepEqual([...backingContracts(s, nodesById(s), "i1")], []);
});

// briefsForPatch — the shared inverse competes-for walk (patch→brief), one source of
// truth for the patch gate AND the selected_patch_comparison rule.
test("briefsForPatch returns resolvable competes-for targets, dedups, skips unresolvable + other sources", () => {
  const s = spec(
    [node({ id: "p1", type: "patch" }), node({ id: "b1", type: "brief" }), node({ id: "b2", type: "brief" })],
    [
      E("e1", "p1", "competes-for", "b1"),
      E("e2", "p1", "competes-for", "b2"),
      E("e3", "p1", "competes-for", "b1"), // duplicate triple → one brief
      E("e4", "p1", "competes-for", "b-missing"), // unresolvable target → skipped
      E("e5", "other", "competes-for", "b1"), // different source → not p1's
    ],
  );
  assert.deepEqual([...briefsForPatch(s, nodesById(s), "p1")].sort(), ["b1", "b2"]);
});

// patchMarketResolved — the gate's verdict, aligned byte-for-byte with the rule's
// clean condition (covered>=2 + no uncovered live) plus a decision-source guard.
function market(extraNodes: NodeRecord[], extraEdges: EdgeRecord[]): LoadedSpec {
  return spec(
    [
      node({ id: "b", type: "brief" }),
      node({ id: "win", type: "patch", status: "selected" }),
      node({ id: "lose", type: "patch", status: "superseded" }),
      node({ id: "cmp", type: "comparison" }),
      ...extraNodes,
    ],
    [
      E("cf1", "win", "competes-for", "b"),
      E("cf2", "lose", "competes-for", "b"),
      E("c1", "cmp", "compares", "win"),
      E("c2", "cmp", "compares", "lose"),
      ...extraEdges,
    ],
  );
}

test("patchMarketResolved: comparison covers >=2, a DECISION selects a competitor, no uncovered live → true", () => {
  const s = market([node({ id: "dec", type: "decision" })], [E("sel", "dec", "selects", "win")]);
  assert.equal(patchMarketResolved(s, nodesById(s), "b"), true);
});

test("patchMarketResolved: a live candidate left uncovered → false (Fix 2 — matches the rule's red)", () => {
  // covered = {win, lose} (size 2) but `cand` is a live candidate left uncompared.
  const s = market(
    [node({ id: "dec", type: "decision" }), node({ id: "cand", type: "patch", status: "candidate" })],
    [E("cf3", "cand", "competes-for", "b"), E("sel", "dec", "selects", "win")],
  );
  assert.equal(patchMarketResolved(s, nodesById(s), "b"), false);
});

test("patchMarketResolved: a selects from a NON-decision source does not resolve → false (Fix 4)", () => {
  // `notdec` is a patch, not a decision — its selects must be ignored.
  const s = market([node({ id: "notdec", type: "patch" })], [E("sel", "notdec", "selects", "win")]);
  assert.equal(patchMarketResolved(s, nodesById(s), "b"), false);
});

test("patchMarketResolved: fewer than 2 covered competitors → false", () => {
  const s = spec(
    [
      node({ id: "b", type: "brief" }),
      node({ id: "win", type: "patch", status: "selected" }),
      node({ id: "cmp", type: "comparison" }),
      node({ id: "dec", type: "decision" }),
    ],
    [E("cf1", "win", "competes-for", "b"), E("c1", "cmp", "compares", "win"), E("sel", "dec", "selects", "win")],
  );
  assert.equal(patchMarketResolved(s, nodesById(s), "b"), false);
});
