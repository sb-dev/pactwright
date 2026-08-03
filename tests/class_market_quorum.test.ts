import { test } from "node:test";
import assert from "node:assert/strict";
import classMarketQuorum from "../tools/handlers/class_market_quorum.ts";
import type { EdgeRecord, LoadedSpec, NodeRecord, Rule } from "../tools/loader.ts";

function node(data: Record<string, unknown>): NodeRecord {
  return { file: `specs/nodes/${String(data.id ?? "x")}.md`, data, body: "x" };
}
function spec(nodes: NodeRecord[], edges: EdgeRecord[]): LoadedSpec {
  return { root: "", nodes, edges, nodeTypes: {}, edgeTypes: {}, rules: [], checks: [], sensitivePaths: [] };
}
const RULE: Rule = { id: "class-market-quorum", kind: "class_market_quorum" };

const intent = (id: string, cls: number): NodeRecord => node({ id, type: "intent", class: cls });
const contract = (id: string, status: string): NodeRecord => node({ id, type: "contract", status });
// Narrow-scope reduction: same contract, plus the author-declared `scope` field.
const scopedContract = (id: string, status: string, scope: unknown): NodeRecord =>
  node({ id, type: "contract", status, scope });
const proposes = (source: string, target: string): EdgeRecord => ({
  id: `edge-proposes-${source}-${target}`,
  source,
  type: "proposes",
  target,
});
const selects = (id: string, target: string): EdgeRecord => ({ id, source: "decision-d", type: "selects", target });

test("quorum: a selected class-3 intent with one candidate fails", () => {
  const findings = classMarketQuorum(
    RULE,
    spec([intent("intent-x", 3), contract("contract-a", "approved")], [
      proposes("contract-a", "intent-x"),
      selects("edge-s1", "contract-a"),
    ]),
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, "class-market-quorum");
  assert.equal(findings[0].subject, "intent-x");
  assert.equal(
    findings[0].detail,
    "intent intent-x (class 3) has a selected contract but only 1 live candidate proposes edge(s) (>=2 required)",
  );
});

test("quorum: a selected class-3 intent with two candidates passes", () => {
  const findings = classMarketQuorum(
    RULE,
    spec([intent("intent-x", 3), contract("contract-a", "approved"), contract("contract-b", "rejected")], [
      proposes("contract-a", "intent-x"),
      proposes("contract-b", "intent-x"),
      selects("edge-s1", "contract-a"),
    ]),
  );
  assert.deepEqual(findings, []);
});

test("quorum: a superseded candidate is excluded from the live count (2 raw -> 1 live -> finding)", () => {
  const findings = classMarketQuorum(
    RULE,
    spec([intent("intent-x", 3), contract("contract-a", "approved"), contract("contract-b", "superseded")], [
      proposes("contract-a", "intent-x"),
      proposes("contract-b", "intent-x"),
      selects("edge-s1", "contract-a"),
    ]),
  );
  assert.equal(findings.length, 1);
  assert.match(findings[0].detail, /only 1 live candidate/);
});

test("quorum: the >=2 bar also applies to class 2", () => {
  const findings = classMarketQuorum(
    RULE,
    spec([intent("intent-x", 2), contract("contract-a", "approved")], [
      proposes("contract-a", "intent-x"),
      selects("edge-s1", "contract-a"),
    ]),
  );
  assert.equal(findings.length, 1);
  assert.match(findings[0].detail, /\(class 2\)/);
});

test("quorum: a selected intent of class < 2 imposes no quorum", () => {
  const findings = classMarketQuorum(
    RULE,
    spec([intent("intent-x", 1), contract("contract-a", "approved")], [
      proposes("contract-a", "intent-x"),
      selects("edge-s1", "contract-a"),
    ]),
  );
  assert.deepEqual(findings, []);
});

test("quorum: a selects edge whose contract proposes no intent is an explicit finding", () => {
  const findings = classMarketQuorum(
    RULE,
    spec([contract("contract-a", "approved")], [selects("edge-s9", "contract-a")]),
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].subject, "edge-s9");
  assert.equal(findings[0].detail, "selects edge edge-s9 targets contract contract-a which proposes no intent");
});

test("quorum: a contract proposing two intents is judged against each independently", () => {
  const findings = classMarketQuorum(
    RULE,
    spec([intent("intent-x", 3), intent("intent-y", 3), contract("contract-a", "approved")], [
      proposes("contract-a", "intent-x"),
      proposes("contract-a", "intent-y"),
      selects("edge-s1", "contract-a"),
    ]),
  );
  assert.equal(findings.length, 2);
  assert.deepEqual(
    findings.map((f) => f.subject).sort(),
    ["intent-x", "intent-y"],
  );
});

test("quorum: an unresolved selects target is defensively skipped (no throw, no finding)", () => {
  const findings = classMarketQuorum(RULE, spec([], [selects("edge-s", "contract-missing")]));
  assert.deepEqual(findings, []);
});

// --- Narrow-scope reduction --------------------------------------------------
// One graph shape underpins the whole block: a selected intent with EXACTLY ONE
// live candidate — the graph the pre-existing >=2 bar reds on. Each leg varies
// only the intent's class and the selected contract's `scope`, so a green leg can
// be explained by nothing but the reduction. `withScope: false` builds the same
// graph with no `scope` key at all (the negative control).
const oneCandidateSpec = (cls: number, scope?: unknown): LoadedSpec =>
  spec(
    [
      intent("intent-x", cls),
      scope === undefined ? contract("contract-a", "approved") : scopedContract("contract-a", "approved", scope),
    ],
    [proposes("contract-a", "intent-x"), selects("edge-s1", "contract-a")],
  );

test("quorum/narrow: class 2 + scope narrow + one live candidate → no finding", () => {
  assert.deepEqual(classMarketQuorum(RULE, oneCandidateSpec(2, "narrow")), []);
});

test("quorum/narrow: NEGATIVE CONTROL — the identical graph with no scope field still reds", () => {
  // The load-bearing leg: the pre-existing >=2 bar is untouched for every change
  // that does not opt in. If this ever goes green the reduction has leaked.
  const findings = classMarketQuorum(RULE, oneCandidateSpec(2));
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, "class-market-quorum");
  assert.equal(findings[0].subject, "intent-x");
  assert.equal(
    findings[0].detail,
    "intent intent-x (class 2) has a selected contract but only 1 live candidate proposes edge(s) (>=2 required)",
  );
});

test("quorum/narrow: class 3 + scope narrow still reds — class 3 is not reducible", () => {
  const findings = classMarketQuorum(RULE, oneCandidateSpec(3, "narrow"));
  assert.equal(findings.length, 1);
  assert.equal(findings[0].subject, "intent-x");
  assert.match(findings[0].detail, /\(class 3\)/);
});

test("quorum/narrow: only the exact string `narrow` reduces — any other value reds", () => {
  // Unrecognised, wrong case, and a non-string all fall through to the bar; there is
  // no fuzzy match and no truthiness read.
  for (const value of ["broad", "Narrow", "NARROW", "narrow ", "", true, 1, ["narrow"]]) {
    const findings = classMarketQuorum(RULE, oneCandidateSpec(2, value));
    assert.equal(findings.length, 1, `scope=${JSON.stringify(value)} should not reduce`);
    assert.equal(findings[0].subject, "intent-x");
  }
});

test("quorum/narrow: inert when the market is already satisfied (two live candidates)", () => {
  const twoCandidates = (scope?: unknown): LoadedSpec =>
    spec(
      [
        intent("intent-x", 2),
        scope === undefined ? contract("contract-a", "approved") : scopedContract("contract-a", "approved", scope),
        contract("contract-b", "rejected"),
      ],
      [proposes("contract-a", "intent-x"), proposes("contract-b", "intent-x"), selects("edge-s1", "contract-a")],
    );
  // Green without the field, and still green with it: the reduction cannot itself
  // cause a finding on a market that already clears the bar.
  assert.deepEqual(classMarketQuorum(RULE, twoCandidates()), []);
  assert.deepEqual(classMarketQuorum(RULE, twoCandidates("narrow")), []);
});

test("quorum/narrow: the declaration is read off the SELECTED contract, not a sibling", () => {
  // contract-b declares narrow but is superseded and unselected; the selected
  // contract-a does not. One live candidate → the bar still applies.
  const findings = classMarketQuorum(
    RULE,
    spec([intent("intent-x", 2), contract("contract-a", "approved"), scopedContract("contract-b", "superseded", "narrow")], [
      proposes("contract-a", "intent-x"),
      proposes("contract-b", "intent-x"),
      selects("edge-s1", "contract-a"),
    ]),
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].subject, "intent-x");
});

test("quorum/narrow: a narrow contract proposing a class-2 and a class-3 intent reduces only the class-2 one", () => {
  // Pins that the guard sits INSIDE the per-intent loop: one contract, two intents,
  // one verdict each.
  const findings = classMarketQuorum(
    RULE,
    spec([intent("intent-x", 2), intent("intent-y", 3), scopedContract("contract-a", "approved", "narrow")], [
      proposes("contract-a", "intent-x"),
      proposes("contract-a", "intent-y"),
      selects("edge-s1", "contract-a"),
    ]),
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].subject, "intent-y");
  assert.match(findings[0].detail, /\(class 3\)/);
});
