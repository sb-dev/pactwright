import { test } from "node:test";
import assert from "node:assert/strict";
import unbackedAddressed from "../tools/handlers/unbacked_addressed.ts";
import type { EdgeRecord, LoadedSpec, NodeRecord, Rule } from "../tools/loader.ts";

// Idiom of `tests/coverage_coherence.test.ts`: local node()/spec() factories building a
// LoadedSpec literal, the handler's default export invoked directly. No CLI, no filesystem,
// so every case is a statement about the rule and nothing else.
//
// Ids are deliberately LONG and distinctive rather than "i"/"c". Amendment 2 requires every
// `detail` to name its own subject, and the only honest way to assert that is a substring
// check — which a one-letter id makes vacuously true against any prose.
function node(data: Record<string, unknown>): NodeRecord {
  return { file: `specs/nodes/${String(data.id ?? "x")}.md`, data, body: "x" };
}
function spec(nodes: NodeRecord[], edges: EdgeRecord[]): LoadedSpec {
  return { root: "", nodes, edges, nodeTypes: {}, edgeTypes: {}, rules: [], checks: [], sensitivePaths: [] };
}
const RULE: Rule = { id: "unbacked-addressed", kind: "unbacked_addressed" };

const ALPHA = "intent-alpha-1a1a";
const BETA = "intent-beta-2b2b";
const CONTRACT = "contract-market-3c3c";
const DECISION = "decision-select-4d4d";

const intent = (id: string, status: string): NodeRecord => node({ id, type: "intent", status });
const contract = (id: string, status = "approved"): NodeRecord => node({ id, type: "contract", status });
const decision = (id: string): NodeRecord => node({ id, type: "decision" });
const brief = (id: string, status = "implemented"): NodeRecord => node({ id, type: "brief", status });
const evidence = (id: string, status: string): NodeRecord => node({ id, type: "evidence", status });

const E = (id: string, source: string, type: string, target: string): EdgeRecord => ({ id, source, type, target });
const proposes = (c: string, i: string): EdgeRecord => E(`e-prop-${c}-${i}`, c, "proposes", i);
const selects = (d: string, c: string): EdgeRecord => E(`e-sel-${d}-${c}`, d, "selects", c);
const subsumes = (d: string, i: string): EdgeRecord => E(`e-sub-${d}-${i}`, d, "subsumes", i);

// ---------------------------------------------------------------------------
// 1. NEGATIVE CONTROL — and it must come first. Without it the headline case below
// could pass for the wrong reason: a rule that fired on every addressed intent would
// also produce exactly two findings there.
// ---------------------------------------------------------------------------
test("negative control: a selected contract marketing exactly one addressed intent → no finding", () => {
  const f = unbackedAddressed(
    RULE,
    spec(
      [intent(ALPHA, "addressed"), contract(CONTRACT), decision(DECISION)],
      [proposes(CONTRACT, ALPHA), selects(DECISION, CONTRACT)],
    ),
  );
  assert.deepEqual(f, []);
});

// ---------------------------------------------------------------------------
// 2. THE HEADLINE CASE (amendment 6) — the laundering path.
// `specs/graph/edges.yaml` is reached by no CODEOWNERS rule and no sensitive_paths
// glob, so ONE appended `proposes` line from an already-selected contract is the
// cheapest way to launder an addressed intent. The singleton clause makes that line
// cost the contract its OWN previously-green intent: both intents red, not zero.
// ---------------------------------------------------------------------------
test("amendment 6: one extra proposes edge from an already-selected contract reds BOTH intents", () => {
  const f = unbackedAddressed(
    RULE,
    spec(
      [intent(ALPHA, "addressed"), intent(BETA, "addressed"), contract(CONTRACT), decision(DECISION)],
      [
        proposes(CONTRACT, ALPHA),
        selects(DECISION, CONTRACT),
        proposes(CONTRACT, BETA), // the single appended line that would launder BETA
      ],
    ),
  );
  assert.equal(f.length, 2, `expected two findings, got:\n${JSON.stringify(f, null, 2)}`);
  assert.deepEqual(
    f.map((x) => x.subject).sort(),
    [ALPHA, BETA].sort(),
    "the previously-green intent must red too — that cost is what closes the path",
  );
  for (const finding of f) {
    assert.equal(finding.kind, "unbacked_addressed");
    assert.equal(finding.rule, "unbacked-addressed");
    assert.match(finding.detail, /also markets/, "the ambiguous-market branch must say so");
    // Amendment 2: formatFinding prints `[rule: <id>] <detail>` and NEVER prints
    // `subject`, so each detail has to name its own intent to be readable at all.
    assert.ok(
      finding.detail.includes(finding.subject),
      `detail must name its own subject ${finding.subject}: ${finding.detail}`,
    );
  }
});

// ---------------------------------------------------------------------------
// 3. THE DISCRIMINATOR (amendment 9). An addressed intent with live proposing
// contracts but NO `selects` edge anywhere. An implementation that computes backing
// as `liveProposingContracts(i).size > 0` — dropping the intersection with the
// selected set — passes every zero-edge fixture and fails only here.
// ---------------------------------------------------------------------------
test("amendment 9: three live proposers and no selects edge → exactly one finding", () => {
  const f = unbackedAddressed(
    RULE,
    spec(
      [intent(ALPHA, "addressed"), contract("contract-one-1111"), contract("contract-two-2222"), contract("contract-three-3333")],
      [proposes("contract-one-1111", ALPHA), proposes("contract-two-2222", ALPHA), proposes("contract-three-3333", ALPHA)],
    ),
  );
  assert.equal(f.length, 1, `expected one finding, got:\n${JSON.stringify(f, null, 2)}`);
  assert.equal(f[0].subject, ALPHA);
  assert.equal(f[0].kind, "unbacked_addressed");
  assert.match(f[0].detail, /0 selected/, "the finding must say the proposers exist but none is selected");
  assert.ok(f[0].detail.includes(ALPHA), "detail must name its own subject");
});

// ---------------------------------------------------------------------------
// 4. DEDUP. `intentsForContract` dedups via a Set, and nothing dedups the
// source/type/target triple (only the edge `id` is unique) — so a duplicated
// `proposes` line must not fake a two-intent market and unback a legitimate intent.
// ---------------------------------------------------------------------------
test("a duplicate proposes triple does not break the singleton clause", () => {
  const f = unbackedAddressed(
    RULE,
    spec(
      [intent(ALPHA, "addressed"), contract(CONTRACT), decision(DECISION)],
      [
        proposes(CONTRACT, ALPHA),
        E("e-prop-duplicate-triple", CONTRACT, "proposes", ALPHA), // same triple, distinct edge id
        selects(DECISION, CONTRACT),
      ],
    ),
  );
  assert.deepEqual(f, []);
});

// ---------------------------------------------------------------------------
// 5. An unresolved `selects` SOURCE confers nothing (amendments 8 and 14). The lifted
// `selectedContracts` resolves and type-checks both endpoints, so a typo'd decision id
// is not "selected". Rule order must not be load-bearing here: edges-references-resolve
// REPORTS such an edge but never removes it, and runValidation never short-circuits.
// ---------------------------------------------------------------------------
test("a selects edge whose source node does not resolve confers no backing", () => {
  const f = unbackedAddressed(
    RULE,
    // Same graph as the negative control, with the `decision` node omitted from `nodes`.
    spec([intent(ALPHA, "addressed"), contract(CONTRACT)], [proposes(CONTRACT, ALPHA), selects(DECISION, CONTRACT)]),
  );
  assert.equal(f.length, 1, `expected one finding, got:\n${JSON.stringify(f, null, 2)}`);
  assert.equal(f[0].subject, ALPHA);
  assert.match(f[0].detail, /0 selected/);
});

// ---------------------------------------------------------------------------
// 6. THE `subsumes` ESCAPE, and its anchor. A decision —subsumes→ intent backs the
// intent ONLY when that same decision selects a contract that is COVERED: the escape
// borrows the coverage of delivered work and cannot be conjured from a decision that
// delivered nothing. (a) covered anchor → silent; (b) the SAME graph with the anchor's
// evidence left `draft` → the near-miss finding.
// ---------------------------------------------------------------------------
const subsumptionGraph = (evidenceStatus: string): LoadedSpec =>
  spec(
    [
      intent(ALPHA, "addressed"), // no contract markets it — only the subsumption can back it
      decision(DECISION),
      contract("contract-anchor-5e5e"),
      brief("brief-anchor-6f6f"),
      evidence("evidence-anchor-7a7a", evidenceStatus),
    ],
    [
      subsumes(DECISION, ALPHA),
      selects(DECISION, "contract-anchor-5e5e"),
      E("e-decomposes-anchor", "brief-anchor-6f6f", "decomposes", "contract-anchor-5e5e"),
      E("e-evidences-anchor", "evidence-anchor-7a7a", "evidences", "brief-anchor-6f6f"),
    ],
  );

test("subsumes: an anchored subsumption (selected contract COVERED) backs the intent → no finding", () => {
  assert.deepEqual(unbackedAddressed(RULE, subsumptionGraph("final")), []);
});

test("subsumes: a DRAFT evidence breaks the anchor → one unanchored finding naming the decision", () => {
  const f = unbackedAddressed(RULE, subsumptionGraph("draft"));
  assert.equal(f.length, 1, `expected one finding, got:\n${JSON.stringify(f, null, 2)}`);
  assert.equal(f[0].subject, ALPHA);
  assert.equal(f[0].kind, "unbacked_addressed");
  assert.match(f[0].detail, /unanchored/, "branch 3 must diagnose the broken anchor, not the no-edge case");
  assert.ok(f[0].detail.includes(DECISION), `detail must name the subsuming decision: ${f[0].detail}`);
  assert.ok(f[0].detail.includes(ALPHA), "detail must name its own subject");
});

// The MULTI-BRIEF half of the anchor. `contractCovered` re-derives coverage rather than
// importing it (the brief's step 10 records that as a correction to the contract's
// Out-of-scope 1), so this branch is a SECOND implementation of "covered" and needs its
// own cases: a two-lane anchor is covered only by one FINAL integration reaching EVERY
// live lane. Partial integration must not anchor an escape.
const multiBriefAnchor = (integrationStatus: string, lanesIntegrated: 1 | 2): LoadedSpec =>
  spec(
    [
      intent(ALPHA, "addressed"),
      decision(DECISION),
      contract("contract-anchor-5e5e"),
      brief("brief-lane-a-6f6f"),
      brief("brief-lane-b-7a7a"),
      evidence("evidence-lane-a-8b8b", "final"),
      evidence("evidence-lane-b-9c9c", "final"),
      node({
        id: "integration-anchor-0d0d",
        type: "integration",
        status: integrationStatus,
      }),
    ],
    [
      subsumes(DECISION, ALPHA),
      selects(DECISION, "contract-anchor-5e5e"),
      E("e-dec-a", "brief-lane-a-6f6f", "decomposes", "contract-anchor-5e5e"),
      E("e-dec-b", "brief-lane-b-7a7a", "decomposes", "contract-anchor-5e5e"),
      E("e-ev-a", "evidence-lane-a-8b8b", "evidences", "brief-lane-a-6f6f"),
      E("e-ev-b", "evidence-lane-b-9c9c", "evidences", "brief-lane-b-7a7a"),
      E("e-int-a", "integration-anchor-0d0d", "integrates", "evidence-lane-a-8b8b"),
      ...(lanesIntegrated === 2
        ? [E("e-int-b", "integration-anchor-0d0d", "integrates", "evidence-lane-b-9c9c")]
        : []),
    ],
  );

test("subsumes: a multi-brief anchor with a FINAL integration covering every lane holds", () => {
  assert.deepEqual(unbackedAddressed(RULE, multiBriefAnchor("final", 2)), []);
});

test("subsumes: a multi-brief anchor integrating only ONE of two lanes is unanchored", () => {
  const f = unbackedAddressed(RULE, multiBriefAnchor("final", 1));
  assert.equal(f.length, 1, `expected one finding, got:\n${JSON.stringify(f, null, 2)}`);
  assert.match(f[0].detail, /unanchored/);
});

test("subsumes: a multi-brief anchor whose integration is still DRAFT is unanchored", () => {
  const f = unbackedAddressed(RULE, multiBriefAnchor("draft", 2));
  assert.equal(f.length, 1, `expected one finding, got:\n${JSON.stringify(f, null, 2)}`);
  assert.match(f[0].detail, /unanchored/);
});

test("subsumes: a SUPERSEDED final integration does not anchor the escape", () => {
  const base = multiBriefAnchor("final", 2);
  const s = spec(
    [...base.nodes, node({ id: "integration-successor-1e1e", type: "integration", status: "draft" })],
    [...base.edges, E("e-sup", "integration-successor-1e1e", "supersedes", "integration-anchor-0d0d")],
  );
  const f = unbackedAddressed(RULE, s);
  assert.equal(f.length, 1, `expected one finding, got:\n${JSON.stringify(f, null, 2)}`);
  assert.match(f[0].detail, /unanchored/);
});

// A `subsumes` edge from a node that is NOT a decision confers nothing here either.
// `edges-endpoint-types` reports that edge (the bad/subsumes-wrong-endpoint fixture pins
// the message), but this rule must not depend on that rule having run — runValidation
// never short-circuits.
test("subsumes: a non-decision source is ignored, so the intent stays unbacked", () => {
  const f = unbackedAddressed(
    RULE,
    spec(
      [intent(ALPHA, "addressed"), node({ id: "brief-impostor-2f2f", type: "brief", status: "draft" })],
      [E("e-sub-impostor", "brief-impostor-2f2f", "subsumes", ALPHA)],
    ),
  );
  assert.equal(f.length, 1, `expected one finding, got:\n${JSON.stringify(f, null, 2)}`);
  // Branch 1, not branch 3: there is no VALID subsumption to be near-missed.
  assert.match(f[0].detail, /0 selected/);
  assert.doesNotMatch(f[0].detail, /unanchored/);
});

// ---------------------------------------------------------------------------
// 7. SCOPE. The rule is `addressed`-scoped: an `open` intent with no provenance at
// all is the normal pre-market state and is never a subject.
// ---------------------------------------------------------------------------
test("a non-addressed intent is never a subject, even with zero edges", () => {
  assert.deepEqual(unbackedAddressed(RULE, spec([intent(ALPHA, "open")], [])), []);
});
