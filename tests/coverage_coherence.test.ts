import { test } from "node:test";
import assert from "node:assert/strict";
import coverageCoherence from "../tools/handlers/coverage_coherence.ts";
import type { EdgeRecord, LoadedSpec, NodeRecord, Rule } from "../tools/loader.ts";

function node(data: Record<string, unknown>): NodeRecord {
  return { file: `specs/nodes/${String(data.id ?? "x")}.md`, data, body: "x" };
}
function spec(nodes: NodeRecord[], edges: EdgeRecord[], coverageCoherenceFrom?: string): LoadedSpec {
  return {
    root: "",
    nodes,
    edges,
    nodeTypes: {},
    edgeTypes: {},
    rules: [],
    checks: [],
    sensitivePaths: [],
    coverageCoherenceFrom,
  };
}
const RULE: Rule = { id: "coverage-coherence", kind: "coverage_coherence" };
const CUT = "2026-06-18";
const POST = "2026-06-19"; // on/after the cutoff: judged
const PRE = "2026-06-10"; // before the cutoff: grandfathered

const intent = (id: string, status: string): NodeRecord => node({ id, type: "intent", status });
const contract = (id: string, created: string): NodeRecord => node({ id, type: "contract", status: "approved", created });
const brief = (id: string, status = "implemented"): NodeRecord => node({ id, type: "brief", status });
const evidence = (id: string, status: string): NodeRecord => node({ id, type: "evidence", status });
const integration = (id: string, status: string): NodeRecord => node({ id, type: "integration", status });

const proposes = (c: string, i: string): EdgeRecord => ({ id: `e-prop-${c}-${i}`, source: c, type: "proposes", target: i });
const selects = (c: string): EdgeRecord => ({ id: `e-sel-${c}`, source: "decision-d", type: "selects", target: c });
const decomposes = (b: string, c: string): EdgeRecord => ({ id: `e-dec-${b}-${c}`, source: b, type: "decomposes", target: c });
const evidences = (e: string, b: string): EdgeRecord => ({ id: `e-ev-${e}-${b}`, source: e, type: "evidences", target: b });
const integrates = (n: string, e: string): EdgeRecord => ({ id: `e-int-${n}-${e}`, source: n, type: "integrates", target: e });

// (a) single brief + one final evidence + addressed → none.
test("(a) single-brief covered (one final evidence) + addressed → none", () => {
  const f = coverageCoherence(
    RULE,
    spec(
      [intent("i", "addressed"), contract("c", POST), brief("b"), evidence("ev", "final")],
      [proposes("c", "i"), selects("c"), decomposes("b", "c"), evidences("ev", "b")],
      CUT,
    ),
  );
  assert.deepEqual(f, []);
});

// (b) single brief + DRAFT evidence + addressed → finding (a draft never counts).
test("(b) single-brief with only draft evidence + addressed → finding", () => {
  const f = coverageCoherence(
    RULE,
    spec(
      [intent("i", "addressed"), contract("c", POST), brief("b"), evidence("ev", "draft")],
      [proposes("c", "i"), selects("c"), decomposes("b", "c"), evidences("ev", "b")],
      CUT,
    ),
  );
  assert.equal(f.length, 1);
  assert.equal(f[0].kind, "coverage_coherence");
  assert.equal(f[0].subject, "i");
  assert.match(f[0].detail, /addressed but/);
});

// (b2) single brief covered but intent OPEN → finding (covered-but-not-addressed).
test("(b2) single-brief covered but intent not addressed → finding", () => {
  const f = coverageCoherence(
    RULE,
    spec(
      [intent("i", "open"), contract("c", POST), brief("b"), evidence("ev", "final")],
      [proposes("c", "i"), selects("c"), decomposes("b", "c"), evidences("ev", "b")],
      CUT,
    ),
  );
  assert.equal(f.length, 1);
  assert.match(f[0].detail, /not addressed but/);
});

// (c) multi-brief + a final integration covering every lane + addressed → none.
test("(c) multi-brief covered by a final integration over every lane + addressed → none", () => {
  const f = coverageCoherence(
    RULE,
    spec(
      [
        intent("i", "addressed"),
        contract("c", POST),
        brief("b1"),
        brief("b2"),
        evidence("e1", "final"),
        evidence("e2", "final"),
        integration("int", "final"),
      ],
      [
        proposes("c", "i"),
        selects("c"),
        decomposes("b1", "c"),
        decomposes("b2", "c"),
        evidences("e1", "b1"),
        evidences("e2", "b2"),
        integrates("int", "e1"),
        integrates("int", "e2"),
      ],
      CUT,
    ),
  );
  assert.deepEqual(f, []);
});

// (d) multi-brief + addressed + NO integration → finding (L4 headline acceptance).
test("(d) multi-brief addressed with no integration → finding (L4)", () => {
  const f = coverageCoherence(
    RULE,
    spec(
      [
        intent("i", "addressed"),
        contract("c", POST),
        brief("b1"),
        brief("b2"),
        evidence("e1", "final"),
        evidence("e2", "final"),
      ],
      [
        proposes("c", "i"),
        selects("c"),
        decomposes("b1", "c"),
        decomposes("b2", "c"),
        evidences("e1", "b1"),
        evidences("e2", "b2"),
      ],
      CUT,
    ),
  );
  assert.equal(f.length, 1);
  assert.equal(f[0].subject, "i");
});

// (e) a final integration covering only one of two lanes → finding.
test("(e) final integration covering only one lane → finding", () => {
  const f = coverageCoherence(
    RULE,
    spec(
      [
        intent("i", "addressed"),
        contract("c", POST),
        brief("b1"),
        brief("b2"),
        evidence("e1", "final"),
        evidence("e2", "final"),
        integration("int", "final"),
      ],
      [
        proposes("c", "i"),
        selects("c"),
        decomposes("b1", "c"),
        decomposes("b2", "c"),
        evidences("e1", "b1"),
        evidences("e2", "b2"),
        integrates("int", "e1"), // only lane 1
      ],
      CUT,
    ),
  );
  assert.equal(f.length, 1);
});

// (h) a DRAFT integration over both lanes does not count → finding (draft-integration boundary).
test("(h) draft-status integration over both lanes → finding", () => {
  const f = coverageCoherence(
    RULE,
    spec(
      [
        intent("i", "addressed"),
        contract("c", POST),
        brief("b1"),
        brief("b2"),
        evidence("e1", "final"),
        evidence("e2", "final"),
        integration("int", "draft"),
      ],
      [
        proposes("c", "i"),
        selects("c"),
        decomposes("b1", "c"),
        decomposes("b2", "c"),
        evidences("e1", "b1"),
        evidences("e2", "b2"),
        integrates("int", "e1"),
        integrates("int", "e2"),
      ],
      CUT,
    ),
  );
  assert.equal(f.length, 1);
});

// (k) multi-brief: final evidence per lane is NOT enough without a final integration → finding.
test("(k) final evidence per lane but no integration → finding (integration required)", () => {
  const f = coverageCoherence(
    RULE,
    spec(
      [
        intent("i", "open"), // not addressed yet; the contract is NOT covered
        contract("c", POST),
        brief("b1"),
        brief("b2"),
        evidence("e1", "final"),
        evidence("e2", "final"),
      ],
      [
        proposes("c", "i"),
        selects("c"),
        decomposes("b1", "c"),
        decomposes("b2", "c"),
        evidences("e1", "b1"),
        evidences("e2", "b2"),
      ],
      CUT,
    ),
  );
  // open + uncovered = consistent → none (proves per-lane final evidence alone is not "covered").
  assert.deepEqual(f, []);
});

// (f) a superseded brief is excluded from the live brief set.
test("(f) superseded brief excluded from the live set", () => {
  const f = coverageCoherence(
    RULE,
    spec(
      [
        intent("i", "addressed"),
        contract("c", POST),
        brief("b1"), // live
        brief("b2", "superseded"), // excluded → contract is single-live-brief
        evidence("ev", "final"),
      ],
      [
        proposes("c", "i"),
        selects("c"),
        decomposes("b1", "c"),
        decomposes("b2", "c"),
        evidences("ev", "b1"),
      ],
      CUT,
    ),
  );
  assert.deepEqual(f, []); // live = {b1}, one final evidence → covered; addressed → consistent.
});

// brief-set-bounded: an integration covering a brief of ANOTHER contract does not vacuously cover.
test("brief-set-bounded: stray cross-contract integrates does not satisfy coverage", () => {
  const f = coverageCoherence(
    RULE,
    spec(
      [
        intent("i", "addressed"),
        contract("c", POST),
        brief("b1"),
        brief("b2"),
        brief("bx"), // a brief of some other contract
        evidence("e1", "final"),
        evidence("ex", "final"),
        integration("int", "final"),
      ],
      [
        proposes("c", "i"),
        selects("c"),
        decomposes("b1", "c"),
        decomposes("b2", "c"),
        evidences("e1", "b1"),
        evidences("ex", "bx"),
        integrates("int", "e1"), // covers b1 of c
        integrates("int", "ex"), // ...and bx of another contract — irrelevant to c's b2
      ],
      CUT,
    ),
  );
  assert.equal(f.length, 1); // b2 uncovered → finding
});

// stale-integration: a brief added/replaced after a final integration is caught by the bidirectional rule.
test("stale-integration: a live brief the final integration does not cover → finding", () => {
  const f = coverageCoherence(
    RULE,
    spec(
      [
        intent("i", "addressed"),
        contract("c", POST),
        brief("b1"),
        brief("b2"),
        brief("b3"), // a later lane the integration predates
        evidence("e1", "final"),
        evidence("e2", "final"),
        integration("int", "final"),
      ],
      [
        proposes("c", "i"),
        selects("c"),
        decomposes("b1", "c"),
        decomposes("b2", "c"),
        decomposes("b3", "c"),
        evidences("e1", "b1"),
        evidences("e2", "b2"),
        integrates("int", "e1"),
        integrates("int", "e2"), // does not cover b3
      ],
      CUT,
    ),
  );
  assert.ok(f.some((x) => x.subject === "i")); // addressed but b3 uncovered
});

// one-integration-per-contract invariant: two integrations covering the contract → finding.
test("one-integration-per-contract: a second integration is a finding", () => {
  const f = coverageCoherence(
    RULE,
    spec(
      [
        intent("i", "open"),
        contract("c", POST),
        brief("b1"),
        brief("b2"),
        evidence("e1", "final"),
        evidence("e2", "final"),
        integration("int1", "final"),
        integration("int2", "draft"),
      ],
      [
        proposes("c", "i"),
        selects("c"),
        decomposes("b1", "c"),
        decomposes("b2", "c"),
        evidences("e1", "b1"),
        evidences("e2", "b2"),
        integrates("int1", "e1"),
        integrates("int1", "e2"),
        integrates("int2", "e1"),
      ],
      CUT,
    ),
  );
  assert.ok(
    f.some((x) => x.subject === "c" && /integration nodes/.test(x.detail)),
    `expected a one-integration invariant finding, got ${JSON.stringify(f)}`,
  );
});

// grandfather on the SELECTED CONTRACT's created: pre-cutoff is skipped even when incoherent.
test("grandfather: a pre-cutoff selected contract is skipped", () => {
  const f = coverageCoherence(
    RULE,
    spec(
      [intent("i", "addressed"), contract("c", PRE), brief("b"), evidence("ev", "draft")],
      [proposes("c", "i"), selects("c"), decomposes("b", "c"), evidences("ev", "b")],
      CUT,
    ),
  );
  assert.deepEqual(f, []); // addressed + uncovered, but pre-cutoff → grandfathered.
});

// fail-open: an absent/malformed cutoff (or contract created) disables the gate.
test("fail-open: absent/malformed cutoff disables the gate", () => {
  const nodes = [intent("i", "addressed"), contract("c", POST), brief("b"), evidence("ev", "draft")];
  const edges = [proposes("c", "i"), selects("c"), decomposes("b", "c"), evidences("ev", "b")];
  assert.deepEqual(coverageCoherence(RULE, spec(nodes, edges, undefined)), []); // absent
  assert.deepEqual(coverageCoherence(RULE, spec(nodes, edges, "")), []); // empty
  assert.deepEqual(coverageCoherence(RULE, spec(nodes, edges, "2026-6-18")), []); // malformed shape
  // malformed contract created → fail-open skip of that contract.
  const badCreated = [intent("i", "addressed"), contract("c", "not-a-date"), brief("b"), evidence("ev", "draft")];
  assert.deepEqual(coverageCoherence(RULE, spec(badCreated, edges, CUT)), []);
});

// unresolved endpoints are skipped without throwing.
test("unresolved endpoints skipped, no throw", () => {
  assert.deepEqual(coverageCoherence(RULE, spec([], [selects("contract-missing")], CUT)), []);
});
