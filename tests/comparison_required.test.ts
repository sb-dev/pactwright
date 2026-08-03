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
// Narrow-scope reduction: same contract, plus the author-declared `scope` field.
const scopedContract = (id: string, status: string, created: string, scope: unknown): NodeRecord =>
  node({ id, type: "contract", status, created, scope });
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

// --- Narrow-scope reduction --------------------------------------------------
// Every leg below uses a selected contract created STRICTLY AFTER the cutoff, so a
// green leg can never be explained by grandfathering — only by the reduction. The
// negative control asserts the emitted `created ... >= ...` clause, which is the
// proof that these graphs really are inside the gate's window.
const POST = "2026-07-01"; // > CUT (2026-06-18)

// One live candidate, no comparison node: the graph the pre-existing bar reds on.
// Legs vary only the intent's class and the selected contract's `scope`.
const oneCandidateSpec = (cls: number, scope?: unknown): LoadedSpec =>
  spec(
    [
      intent("i", cls),
      scope === undefined ? contract("c-a", "approved", POST) : scopedContract("c-a", "approved", POST, scope),
    ],
    [proposes("c-a", "i"), selects("s1", "c-a")],
    CUT,
  );

test("(j) narrow: class 2 + scope narrow + one live candidate → no finding", () => {
  assert.deepEqual(comparisonRequired(RULE, oneCandidateSpec(2, "narrow")), []);
});

test("(j2) narrow: NEGATIVE CONTROL — the identical graph with no scope field still reds", () => {
  // The load-bearing leg: the comparison requirement is untouched for every change
  // that does not opt in — and the `created ... >= ...` clause proves the graph is
  // post-cutoff, so (j) above is green by the reduction and not by grandfathering.
  const findings = comparisonRequired(RULE, oneCandidateSpec(2));
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, "comparison-required");
  assert.equal(findings[0].kind, "comparison_required");
  assert.equal(findings[0].subject, "i");
  assert.match(findings[0].detail, /\(class 2\)/);
  assert.match(findings[0].detail, /created 2026-07-01 >= 2026-06-18/);
});

test("(j3) narrow: class 3 + scope narrow still reds — class 3 is not reducible", () => {
  const findings = comparisonRequired(RULE, oneCandidateSpec(3, "narrow"));
  assert.equal(findings.length, 1);
  assert.equal(findings[0].subject, "i");
  assert.match(findings[0].detail, /\(class 3\)/);
});

test("(j4) narrow: only the exact string `narrow` reduces — any other value reds", () => {
  for (const value of ["broad", "Narrow", "NARROW", "narrow ", "", true, 1, ["narrow"]]) {
    const findings = comparisonRequired(RULE, oneCandidateSpec(2, value));
    assert.equal(findings.length, 1, `scope=${JSON.stringify(value)} should not reduce`);
    assert.equal(findings[0].subject, "i");
  }
});

test("(j5) narrow: inert on a market that already satisfies the rule (two candidates, covered)", () => {
  // Shape (b): two live candidates covered by a comparison with two distinct
  // compares edges — green WITHOUT the field. Adding `scope: narrow` must keep it
  // green; the reduction may never itself produce a finding.
  //
  // Since the `live.size < 2` conjunct landed, this leg is also the non-over-reach
  // pin: the guard does NOT fire here (two live candidates), so the rule runs in
  // full and finds the market properly compared. A narrow-labelled market that ran
  // real candidates and did compare them is still green — the fix reds only the
  // case where the comparison is missing (j7).
  const covered = (scope?: unknown): LoadedSpec =>
    spec(
      [
        intent("i", 2),
        scope === undefined ? contract("c-a", "approved", POST) : scopedContract("c-a", "approved", POST, scope),
        contract("c-b", "rejected", POST),
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
    );
  assert.deepEqual(comparisonRequired(RULE, covered()), []);
  assert.deepEqual(comparisonRequired(RULE, covered("narrow")), []);
});

test("(j6) narrow: the declaration is read off the SELECTED contract, not a sibling", () => {
  // c-b declares narrow but is superseded and unselected; the selected c-a does not.
  // The sibling is deliberately superseded so that live = {c-a}, size 1: the guard's
  // class and candidate-count conjuncts are both SATISFIED here, leaving which
  // contract's `scope` is read as the only thing that decides the verdict. A handler
  // that accepted the declaration from any contract in the market would go green.
  const findings = comparisonRequired(
    RULE,
    spec(
      [intent("i", 2), contract("c-a", "approved", POST), scopedContract("c-b", "superseded", POST, "narrow")],
      [proposes("c-a", "i"), proposes("c-b", "i"), selects("s1", "c-a")],
      CUT,
    ),
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].subject, "i");
  assert.match(findings[0].detail, /live candidates \{c-a\}/); // c-b excluded as superseded
});

// Two live candidates and NO comparison node — a market that DID run. Legs vary
// only the selected contract's `scope`.
const twoLiveNoComparison = (scope?: unknown): LoadedSpec =>
  spec(
    [
      intent("i", 2),
      scope === undefined ? contract("c-a", "approved", POST) : scopedContract("c-a", "approved", POST, scope),
      contract("c-b", "rejected", POST),
    ],
    [proposes("c-a", "i"), proposes("c-b", "i"), selects("s1", "c-a")],
    CUT,
  );

test("(j7) narrow does NOT excuse a market that actually ran >=2 live candidates", () => {
  // The guarantee the `live.size < 2` conjunct buys: the reduction excuses a market
  // that never happened, never one that did. Two live candidates and no comparison
  // means the durable record of why the loser lost is missing, and `scope: narrow`
  // does not buy it off — the verdict is identical with and without the field.
  //
  // Contrast (j), where the same declaration on a genuinely single-candidate market
  // IS excused, and (j5), where a two-candidate narrow market that DID compare stays
  // green. Deleting `live.size < 2 &&` from the guard turns this leg green.
  assert.deepEqual(
    comparisonRequired(RULE, twoLiveNoComparison()).map((f) => f.subject),
    ["i"],
  ); // baseline, no field: reds
  const findings = comparisonRequired(RULE, twoLiveNoComparison("narrow"));
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, "comparison-required");
  assert.equal(findings[0].subject, "i");
  // Both live candidates are named as uncovered: the full requirement still applies.
  assert.match(findings[0].detail, /live candidates \{c-a, c-b\}/);
  assert.match(findings[0].detail, /covers \{\(none\)\}/);
});

test("(j8) narrow: a >=2-candidate market is still judged on COVERAGE, not just on having compared", () => {
  // The uncovered branch under a narrow declaration: two live candidates, a
  // comparison that reaches only one. The guard does not fire (live.size is 2), so
  // the coverage check runs in full and names the uncovered candidate — shape (c)
  // with `scope: narrow` added, and the same verdict.
  const findings = comparisonRequired(
    RULE,
    spec(
      [
        intent("i", 2),
        scopedContract("c-a", "approved", POST, "narrow"),
        contract("c-b", "rejected", POST),
        comparison("cmp"),
      ],
      [proposes("c-a", "i"), proposes("c-b", "i"), selects("s1", "c-a"), compares("k1", "cmp", "c-a")],
      CUT,
    ),
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].subject, "i");
  assert.match(findings[0].detail, /c-b/); // the uncovered live candidate
});
