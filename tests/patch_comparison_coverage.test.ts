import { test } from "node:test";
import assert from "node:assert/strict";
import selectedPatchComparison from "../tools/handlers/selected_patch_comparison.ts";
import type { EdgeRecord, LoadedSpec, NodeRecord, Rule } from "../tools/loader.ts";

// Direct unit matrix over the selected-patch comparison-coverage handler, in the
// comparison_required.test.ts idiom. A `selects`-edged PATCH whose brief carries a
// `comparison` covering >=2 of the brief's (status-blind) competing patches, with no
// live (candidate) competitor left uncovered, is clean; anything less is a finding.

function node(data: Record<string, unknown>): NodeRecord {
  return { file: `specs/nodes/${String(data.id ?? "x")}.md`, data, body: "x" };
}
function spec(nodes: NodeRecord[], edges: EdgeRecord[]): LoadedSpec {
  return { root: "", nodes, edges, nodeTypes: {}, edgeTypes: {}, rules: [], checks: [], sensitivePaths: [] };
}
const RULE: Rule = { id: "selected-patch-comparison", kind: "selected_patch_comparison" };

const patch = (id: string, status: string): NodeRecord =>
  node({ id, type: "patch", status, branch: `patch/widget/${id}`, strategy: "s" });
const brief = (id: string): NodeRecord => node({ id, type: "brief", status: "draft" });
const contract = (id: string): NodeRecord => node({ id, type: "contract", status: "approved" });
const intent = (id: string): NodeRecord => node({ id, type: "intent", status: "open", class: 3 });
const comparison = (id: string): NodeRecord => node({ id, type: "comparison" });
const competesFor = (id: string, patchId: string, briefId: string): EdgeRecord => ({
  id,
  source: patchId,
  type: "competes-for",
  target: briefId,
});
const compares = (id: string, comparisonId: string, target: string): EdgeRecord => ({
  id,
  source: comparisonId,
  type: "compares",
  target,
});
const selects = (id: string, target: string): EdgeRecord => ({ id, source: "decision-d", type: "selects", target });

// (a) selected patch whose brief's comparison covers >=2 competitors → no finding.
test("(a) a selected patch with a comparison covering both competitors → no finding", () => {
  const findings = selectedPatchComparison(
    RULE,
    spec(
      [
        brief("brief-w"),
        patch("patch-win", "selected"),
        patch("patch-lose", "superseded"),
        comparison("cmp-w"),
      ],
      [
        competesFor("e-cf1", "patch-win", "brief-w"),
        competesFor("e-cf2", "patch-lose", "brief-w"),
        compares("e-c1", "cmp-w", "patch-win"),
        compares("e-c2", "cmp-w", "patch-lose"),
        selects("e-sel", "patch-win"),
      ],
    ),
  );
  assert.deepEqual(findings, []);
});

// (b) coverage < 2 distinct → finding.
test("(b) a comparison covering only one competitor (<2) → 1 finding", () => {
  const findings = selectedPatchComparison(
    RULE,
    spec(
      [
        brief("brief-w"),
        patch("patch-win", "selected"),
        patch("patch-lose", "superseded"),
        comparison("cmp-w"),
      ],
      [
        competesFor("e-cf1", "patch-win", "brief-w"),
        competesFor("e-cf2", "patch-lose", "brief-w"),
        compares("e-c1", "cmp-w", "patch-win"), // only one covered → size 1 < 2
        selects("e-sel", "patch-win"),
      ],
    ),
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].rule, "selected-patch-comparison");
  assert.equal(findings[0].kind, "selected_patch_comparison");
  assert.equal(findings[0].subject, "brief-w");
  // No live candidate here (win=selected, lose=superseded) — only the <2-coverage bar
  // fails — so the "leaving live candidate(s) {…}" clause must be ABSENT.
  assert.doesNotMatch(findings[0].detail, /leaving live candidate/);
});

// (b') a LIVE candidate competitor left uncovered → finding (coverage, not just count).
test("(b') a live candidate competitor uncovered → finding even when >=2 others are covered", () => {
  const findings = selectedPatchComparison(
    RULE,
    spec(
      [
        brief("brief-w"),
        patch("patch-win", "selected"),
        patch("patch-lose", "superseded"),
        patch("patch-stillin", "candidate"), // a live candidate left uncompared
        comparison("cmp-w"),
      ],
      [
        competesFor("e-cf1", "patch-win", "brief-w"),
        competesFor("e-cf2", "patch-lose", "brief-w"),
        competesFor("e-cf3", "patch-stillin", "brief-w"),
        compares("e-c1", "cmp-w", "patch-win"),
        compares("e-c2", "cmp-w", "patch-lose"), // covered = {win, lose}, size 2
        selects("e-sel", "patch-win"),
      ],
    ),
  );
  // covered size is 2, but patch-stillin is a LIVE candidate left uncovered → finding.
  assert.equal(findings.length, 1);
  assert.equal(findings[0].subject, "brief-w");
  // Discriminating: the detail must NAME patch-stillin as THE uncovered live candidate,
  // not merely list it among competitors (which would match even if the signal were dropped).
  assert.match(findings[0].detail, /leaving live candidate\(s\) \{patch-stillin\} uncovered/);
});

// Fix 2 here: a `selected` competitor is excluded from the live (uncovered) set, so
// the post-selection winner-merge steady state validates clean.
test("Fix 2: a `selected` winner is NOT a live competitor — it need not appear uncovered", () => {
  // The winner is `selected`; only `superseded` and other live `candidate` patches
  // matter for the live-uncovered check. Here the comparison covers the two
  // historical competitors; the selected winner being absent from the live set means
  // the steady state is clean.
  const findings = selectedPatchComparison(
    RULE,
    spec(
      [
        brief("brief-w"),
        patch("patch-win", "selected"),
        patch("patch-a", "superseded"),
        patch("patch-b", "superseded"),
        comparison("cmp-w"),
      ],
      [
        competesFor("e-cf1", "patch-win", "brief-w"),
        competesFor("e-cf2", "patch-a", "brief-w"),
        competesFor("e-cf3", "patch-b", "brief-w"),
        compares("e-c1", "cmp-w", "patch-a"),
        compares("e-c2", "cmp-w", "patch-b"), // covered = {a, b}, size 2; no live candidate
        selects("e-sel", "patch-win"),
      ],
    ),
  );
  assert.deepEqual(findings, []);
});

// A `selects → contract` is OUT OF SCOPE for this rule (comparison_required's job).
test("a selects → contract is ignored by this rule (contract selection is comparison_required's job)", () => {
  const findings = selectedPatchComparison(
    RULE,
    spec(
      [intent("intent-i"), contract("contract-c")],
      [selects("e-sel", "contract-c")], // target is a contract, not a patch → skipped
    ),
  );
  assert.deepEqual(findings, []);
});

// A selected patch that competes-for no resolvable brief → explicit finding (no throw).
test("a selected patch competing-for no resolvable brief → finding on the patch", () => {
  const findings = selectedPatchComparison(
    RULE,
    spec([patch("patch-win", "selected")], [selects("e-sel", "patch-win")]),
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].subject, "patch-win");
  assert.match(findings[0].detail, /competes-for no resolvable brief/);
});

// Unresolved selects / compares endpoints are defensively skipped (no throw).
test("unresolved selects/compares endpoints are skipped without throwing", () => {
  assert.deepEqual(
    selectedPatchComparison(RULE, spec([], [selects("e-sel", "patch-missing")])),
    [],
  );
  const findings = selectedPatchComparison(
    RULE,
    spec(
      [brief("brief-w"), patch("patch-win", "selected"), patch("patch-lose", "superseded"), comparison("cmp-w")],
      [
        competesFor("e-cf1", "patch-win", "brief-w"),
        competesFor("e-cf2", "patch-lose", "brief-w"),
        compares("e-c1", "cmp-missing", "patch-win"), // unresolved comparison source → skip
        compares("e-c2", "cmp-w", "patch-gone"), // unresolved target → skip (not a competitor)
        selects("e-sel", "patch-win"),
      ],
    ),
  );
  // Neither compares edge contributes coverage → covered = {} → size 0 < 2 → finding (not a throw).
  assert.equal(findings.length, 1);
  assert.equal(findings[0].subject, "brief-w");
});

// A single (selected) competitor, no live losers → still needs >=2 covered → finding.
test("a brief with only the selected patch as competitor cannot reach the >=2 coverage bar → finding", () => {
  const findings = selectedPatchComparison(
    RULE,
    spec(
      [brief("brief-w"), patch("patch-win", "selected"), comparison("cmp-w")],
      [
        competesFor("e-cf1", "patch-win", "brief-w"),
        compares("e-c1", "cmp-w", "patch-win"), // covered = {win}, size 1 < 2
        selects("e-sel", "patch-win"),
      ],
    ),
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].subject, "brief-w");
});
