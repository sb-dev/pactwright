import { test } from "node:test";
import assert from "node:assert/strict";
import synthesisParentage from "../tools/handlers/synthesis_parentage.ts";
import type { EdgeRecord, LoadedSpec, NodeRecord, Rule } from "../tools/loader.ts";

// Direct unit matrix over the synthesis-parentage handler, in the
// class_market_quorum.test.ts idiom: a synthetic LoadedSpec, a RULE const, and
// factory helpers, asserting each finding's rule/kind/subject.

function node(data: Record<string, unknown>): NodeRecord {
  return { file: `specs/nodes/${String(data.id ?? "x")}.md`, data, body: "x" };
}
function spec(nodes: NodeRecord[], edges: EdgeRecord[]): LoadedSpec {
  return { root: "", nodes, edges, nodeTypes: {}, edgeTypes: {}, rules: [], checks: [], sensitivePaths: [] };
}
const RULE: Rule = { id: "synthesis-parentage", kind: "synthesis_parentage" };

const patch = (id: string, status = "candidate"): NodeRecord =>
  node({ id, type: "patch", status, branch: `patch/widget/${id}`, strategy: "s" });
const synthesizes = (id: string, source: string, target: string): EdgeRecord => ({
  id,
  source,
  type: "synthesizes",
  target,
});

test("synthesis: a patch with >=2 distinct parents → no finding", () => {
  const findings = synthesisParentage(
    RULE,
    spec(
      [patch("patch-synth"), patch("patch-p1"), patch("patch-p2")],
      [synthesizes("e-s1", "patch-synth", "patch-p1"), synthesizes("e-s2", "patch-synth", "patch-p2")],
    ),
  );
  assert.deepEqual(findings, []);
});

test("synthesis: a patch with exactly 1 parent → 1 finding (rule/kind/subject asserted)", () => {
  const findings = synthesisParentage(
    RULE,
    spec([patch("patch-synth"), patch("patch-p1")], [synthesizes("e-s1", "patch-synth", "patch-p1")]),
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, "synthesis-parentage");
  assert.equal(findings[0].kind, "synthesis_parentage");
  assert.equal(findings[0].subject, "patch-synth");
  assert.match(findings[0].detail, /1 distinct parent/);
  assert.match(findings[0].detail, />=2 required/);
});

test("synthesis: TWO synthesizes edges to the SAME parent still count as 1 distinct → 1 finding", () => {
  // Distinct-parent counting (a Set): two edges to the same parent do not satisfy
  // the >=2 bar, exactly as comparison_required collapses duplicate compares targets.
  const findings = synthesisParentage(
    RULE,
    spec(
      [patch("patch-synth"), patch("patch-p1")],
      [synthesizes("e-s1", "patch-synth", "patch-p1"), synthesizes("e-s2", "patch-synth", "patch-p1")],
    ),
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].subject, "patch-synth");
  assert.match(findings[0].detail, /1 distinct parent/);
});

test("synthesis: an unresolved synthesizes parent is skipped — does not count toward distinct parents", () => {
  // One resolvable parent + one dangling target → still 1 distinct live parent → finding.
  const findings = synthesisParentage(
    RULE,
    spec(
      [patch("patch-synth"), patch("patch-p1")],
      [
        synthesizes("e-s1", "patch-synth", "patch-p1"),
        synthesizes("e-s2", "patch-synth", "patch-missing"), // unresolved parent: skipped
      ],
    ),
  );
  assert.equal(findings.length, 1);
  assert.match(findings[0].detail, /1 distinct parent/);
});

test("synthesis: an entirely unresolved parent set is defensively skipped (no throw, no finding)", () => {
  // No resolvable parents → the synthesis id never enters the parents map → no finding,
  // and crucially no throw on the dangling endpoint.
  const findings = synthesisParentage(
    RULE,
    spec([patch("patch-synth")], [synthesizes("e-s1", "patch-synth", "patch-missing")]),
  );
  assert.deepEqual(findings, []);
});

test("synthesis: a non-synthesis patch (no synthesizes edge) produces no finding", () => {
  const findings = synthesisParentage(RULE, spec([patch("patch-plain")], []));
  assert.deepEqual(findings, []);
});

test("synthesis: two independent synthesis patches are judged independently", () => {
  const findings = synthesisParentage(
    RULE,
    spec(
      [patch("patch-good"), patch("patch-bad"), patch("patch-p1"), patch("patch-p2")],
      [
        synthesizes("e-g1", "patch-good", "patch-p1"),
        synthesizes("e-g2", "patch-good", "patch-p2"), // 2 distinct → ok
        synthesizes("e-b1", "patch-bad", "patch-p1"), // 1 distinct → finding
      ],
    ),
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].subject, "patch-bad");
});
