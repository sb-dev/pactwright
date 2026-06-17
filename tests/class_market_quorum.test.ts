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
