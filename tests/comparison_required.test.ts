import { test } from "node:test";
import assert from "node:assert/strict";
import comparisonRequired from "../tools/handlers/comparison_required.ts";
import type { EdgeRecord, LoadedSpec, NodeRecord, Rule } from "../tools/loader.ts";

function node(data: Record<string, unknown>): NodeRecord {
  return { file: `specs/nodes/${String(data.id ?? "x")}.md`, data, body: "x" };
}
function spec(nodes: NodeRecord[], edges: EdgeRecord[], comparisonRequiredFrom?: string): LoadedSpec {
  return {
    root: "",
    nodes,
    edges,
    nodeTypes: {},
    edgeTypes: {},
    rules: [],
    checks: [],
    sensitivePaths: [],
    comparisonRequiredFrom,
  };
}
const RULE: Rule = { id: "comparison-required", kind: "comparison_required" };
const CUT = "2026-06-18";

const intent = (id: string, cls: number): NodeRecord => node({ id, type: "intent", class: cls });
const contract = (id: string, status: string, created: string): NodeRecord =>
  node({ id, type: "contract", status, created });
const comparison = (id: string): NodeRecord => node({ id, type: "comparison" });
const proposes = (source: string, target: string): EdgeRecord => ({
  id: `edge-proposes-${source}-${target}`,
  source,
  type: "proposes",
  target,
});
const selects = (id: string, target: string): EdgeRecord => ({ id, source: "decision-d", type: "selects", target });
const compares = (id: string, source: string, target: string): EdgeRecord => ({ id, source, type: "compares", target });

// (a) post-cutoff class-2 selected, no comparison → finding.
test("(a) post-cutoff class-2 selection with no comparison → finding", () => {
  const findings = comparisonRequired(
    RULE,
    spec(
      [intent("i", 2), contract("c-a", "approved", "2026-06-18"), contract("c-b", "rejected", "2026-06-18")],
      [proposes("c-a", "i"), proposes("c-b", "i"), selects("s1", "c-a")],
      CUT,
    ),
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, "comparison-required");
  assert.equal(findings[0].kind, "comparison_required");
  assert.equal(findings[0].subject, "i");
});

// (b) comparison covering both live candidates with ≥2 distinct compares → none.
test("(b) comparison covering both live candidates with >=2 compares → none", () => {
  const findings = comparisonRequired(
    RULE,
    spec(
      [
        intent("i", 2),
        contract("c-a", "approved", "2026-06-18"),
        contract("c-b", "rejected", "2026-06-18"),
        comparison("cmp"),
      ],
      [
        proposes("c-a", "i"),
        proposes("c-b", "i"),
        selects("s1", "c-a"),
        compares("k1", "cmp", "c-a"),
        compares("k2", "cmp", "c-b"),
      ],
      CUT,
    ),
  );
  assert.deepEqual(findings, []);
});

// (c) comparison covering only one of two live candidates → finding (coverage, not count).
test("(c) comparison covering only one of two live candidates → finding", () => {
  const findings = comparisonRequired(
    RULE,
    spec(
      [
        intent("i", 2),
        contract("c-a", "approved", "2026-06-18"),
        contract("c-b", "rejected", "2026-06-18"),
        comparison("cmp"),
      ],
      [proposes("c-a", "i"), proposes("c-b", "i"), selects("s1", "c-a"), compares("k1", "cmp", "c-a")],
      CUT,
    ),
  );
  assert.equal(findings.length, 1);
  assert.match(findings[0].detail, /c-b/); // the uncovered live candidate
});

// (d) grandfather keys on the SELECTED CONTRACT's created, not the intent's.
test("(d) grandfather keys on the selected contract's created, not the intent's", () => {
  // The intent's own `created` is post-cutoff, but the selected contract predates
  // the cutoff → grandfathered. Proves the predicate reads the contract, not the intent.
  const i = node({ id: "i", type: "intent", class: 3, created: "2026-06-30" });
  const findings = comparisonRequired(
    RULE,
    spec(
      [i, contract("c-a", "approved", "2026-06-17"), contract("c-b", "rejected", "2026-06-17")],
      [proposes("c-a", "i"), proposes("c-b", "i"), selects("s1", "c-a")],
      CUT,
    ),
  );
  assert.deepEqual(findings, []);
});

// (e) class-1 selected intent imposes no comparison requirement.
test("(e) class-1 selected intent → none", () => {
  const findings = comparisonRequired(
    RULE,
    spec(
      [intent("i", 1), contract("c-a", "approved", "2026-06-18")],
      [proposes("c-a", "i"), selects("s1", "c-a")],
      CUT,
    ),
  );
  assert.deepEqual(findings, []);
});

// (f) absent/empty/malformed cutoff disables the gate (fail-open).
test("(f) absent/empty/malformed cutoff → gate disabled (fail-open)", () => {
  const nodes = [
    intent("i", 3),
    contract("c-a", "approved", "2026-06-18"),
    contract("c-b", "rejected", "2026-06-18"),
  ];
  const edges = [proposes("c-a", "i"), proposes("c-b", "i"), selects("s1", "c-a")];
  assert.deepEqual(comparisonRequired(RULE, spec(nodes, edges, undefined)), []); // absent
  assert.deepEqual(comparisonRequired(RULE, spec(nodes, edges, "")), []); // empty
  assert.deepEqual(comparisonRequired(RULE, spec(nodes, edges, "2026-6-18")), []); // malformed shape
});

// (f2) selected contract created absent/malformed → fail-open skip.
test("(f2) selected contract created absent/malformed → fail-open skip", () => {
  const findings = comparisonRequired(
    RULE,
    spec(
      [intent("i", 3), contract("c-a", "approved", "not-a-date"), contract("c-b", "rejected", "2026-06-18")],
      [proposes("c-a", "i"), proposes("c-b", "i"), selects("s1", "c-a")],
      CUT,
    ),
  );
  assert.deepEqual(findings, []);
});

// (g) a superseded compares target does not count toward coverage.
test("(g) a superseded compares target does not count toward coverage", () => {
  const findings = comparisonRequired(
    RULE,
    spec(
      [
        intent("i", 3),
        contract("c-a", "approved", "2026-06-18"),
        contract("c-b", "rejected", "2026-06-18"),
        contract("c-c", "superseded", "2026-06-18"),
        comparison("cmp"),
      ],
      [
        proposes("c-a", "i"),
        proposes("c-b", "i"),
        proposes("c-c", "i"),
        selects("s1", "c-a"),
        compares("k1", "cmp", "c-a"),
        compares("k2", "cmp", "c-c"), // superseded target: does not count
      ],
      CUT,
    ),
  );
  // live = {c-a, c-b} (c-c superseded excluded); covered = {c-a} → c-b uncovered → finding.
  assert.equal(findings.length, 1);
  assert.match(findings[0].detail, /c-b/);
});

// (h) two compares edges to the SAME target do not reach the >=2 bar.
test("(h) two compares edges to the same target → finding", () => {
  const findings = comparisonRequired(
    RULE,
    spec(
      [
        intent("i", 3),
        contract("c-a", "approved", "2026-06-18"),
        contract("c-b", "rejected", "2026-06-18"),
        comparison("cmp"),
      ],
      [
        proposes("c-a", "i"),
        proposes("c-b", "i"),
        selects("s1", "c-a"),
        compares("k1", "cmp", "c-a"),
        compares("k2", "cmp", "c-a"), // duplicate target: collapses to one distinct
      ],
      CUT,
    ),
  );
  assert.equal(findings.length, 1); // covered = {c-a}, size 1 < 2 and c-b uncovered
});

// (h2) unresolved selects/compares endpoints are skipped without throwing.
test("(h2) unresolved selects/compares endpoints are skipped, no throw", () => {
  assert.deepEqual(comparisonRequired(RULE, spec([], [selects("s", "contract-missing")], CUT)), []);
  const findings = comparisonRequired(
    RULE,
    spec(
      [intent("i", 3), contract("c-a", "approved", "2026-06-18"), contract("c-b", "rejected", "2026-06-18")],
      [
        proposes("c-a", "i"),
        proposes("c-b", "i"),
        selects("s1", "c-a"),
        compares("k1", "cmp-missing", "c-a"), // unresolved comparison source → skip
        compares("k2", "cmp", "target-missing"), // unresolved contract target → skip
      ],
      CUT,
    ),
  );
  // Neither compares edge qualifies → covered = {} → finding (not a throw).
  assert.equal(findings.length, 1);
});

// (i) a compares target that resolves and is LIVE but proposes a DIFFERENT intent
// does not count toward this market's coverage (the proposesIntent filter, lines 64-70).
// Single live candidate is intentional: it isolates the >=2 count bar so a regressed
// filter (which would count c-x) flips the result. class-market-quorum is a separate rule
// and is not exercised here.
test("(i) a live compares target proposing a different intent does not count", () => {
  const findings = comparisonRequired(
    RULE,
    spec(
      [
        intent("i", 3),
        intent("j", 2),
        contract("c-a", "approved", "2026-06-18"), // only live candidate of i, selected
        contract("c-x", "approved", "2026-06-18"), // live, but proposes j (wrong market)
        comparison("cmp"),
      ],
      [
        proposes("c-a", "i"),
        proposes("c-x", "j"),
        selects("s1", "c-a"),
        compares("k1", "cmp", "c-a"),
        compares("k2", "cmp", "c-x"), // wrong-market target: must be excluded
      ],
      CUT,
    ),
  );
  // covered(i) = {c-a} (c-x excluded) → size 1 < 2 → finding.
  // If the filter regressed: covered = {c-a, c-x}, size 2 → no finding (test would fail).
  assert.equal(findings.length, 1);
  assert.match(findings[0].detail, /c-a/);
});
