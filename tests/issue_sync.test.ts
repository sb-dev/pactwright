import { test } from "node:test";
import assert from "node:assert/strict";
import {
  countPlanned,
  formatRunReport,
  markedNodeId,
  nodeMarker,
  planIssueSync,
  type ExistingIssue,
  type IssueSyncPlan,
  type PlanOptions,
} from "../tools/issue_sync.ts";
import type { EdgeRecord, LoadedSpec, NodeRecord } from "../tools/loader.ts";

/**
 * The `planIssueSync` unit suite — CC-5 (this lane's half) and amendment A2, per
 * `specs/nodes/brief-conveyor-tests-4c86.md` ("Files to create" 2, "### CC-5").
 *
 * `tools/issue_sync.ts` is the `domain-backend` lane's file; this lane only drives it.
 * Every case below is a DIRECT call on a synthetic `(spec, existingIssues, opts)` —
 * no `gh`, no network, no clock. `applyPlan` (the impure adapter) is deliberately
 * never called; only the pure seam plus the pure report helpers are exercised.
 */

// --- builders: copied from tests/checkdiff.test.ts:6-17, not reinvented -------------
const TODAY = "2026-07-28";

function node(id: string, type: string, extra: Record<string, unknown> = {}): NodeRecord {
  return { file: `specs/nodes/${id}.md`, data: { id, type, ...extra }, body: "body" };
}
function edge(id: string, type: string, source: string, target: string): EdgeRecord {
  return { id, type, source, target, created: TODAY };
}
function spec(nodes: NodeRecord[], edges: EdgeRecord[]): LoadedSpec {
  return { root: "/repo/specs", nodes, edges, nodeTypes: {}, edgeTypes: {}, rules: [], checks: [], sensitivePaths: [] };
}
/** Same builder with an explicit markdown body — needed only by the CC-4(2) leg,
 * which asserts the body never reaches the projection. */
function nodeWithBody(id: string, type: string, extra: Record<string, unknown>, body: string): NodeRecord {
  return { ...node(id, type, extra), body };
}

const OPTS: PlanOptions = {
  listingComplete: true,
  syncIdentity: "github-actions[bot]",
  repo: "samir/pactwright",
};

// --- the graph under test -----------------------------------------------------------
// One class-3 contract decomposed into two lane briefs. `brief-alpha-aa01` carries an
// `owner`; `brief-beta-bb02` deliberately does NOT (the seven briefs of this
// decomposition carry no `owner` — the brief's bootstrap paragraph), so the projection
// must tolerate its absence.
const CONTRACT = "contract-conveyor-derived-4c8c";
const ALPHA = "brief-alpha-aa01";
const BETA = "brief-beta-bb02";
const BODY_SENTINEL = "DISTINCTIVE-BODY-SENTINEL-b7f2-never-projected";

function graph(over: { alphaStatus?: string; betaStatus?: string; finalEvidenceFor?: string[] } = {}): LoadedSpec {
  const nodes: NodeRecord[] = [
    nodeWithBody(
      CONTRACT,
      "contract",
      { title: "Conveyor derived", status: "approved", class: 3 },
      `This contract body mentions ${BODY_SENTINEL} and must never be projected.`,
    ),
    nodeWithBody(
      ALPHA,
      "brief",
      { title: "Resolver lane", status: over.alphaStatus ?? "draft", lane: "domain-backend", owner: "backend-implementer" },
      `Lane prose containing ${BODY_SENTINEL}.`,
    ),
    nodeWithBody(
      BETA,
      "brief",
      { title: "Verification lane", status: over.betaStatus ?? "draft", lane: "test-verification" },
      `Lane prose containing ${BODY_SENTINEL}.`,
    ),
  ];
  const edges: EdgeRecord[] = [
    edge("edge-dec-alpha-0001", "decomposes", ALPHA, CONTRACT),
    edge("edge-dec-beta-0002", "decomposes", BETA, CONTRACT),
  ];
  let n = 0;
  for (const briefId of over.finalEvidenceFor ?? []) {
    n += 1;
    const evId = `evidence-lane-${String(n).padStart(4, "0")}`;
    nodes.push(node(evId, "evidence", { title: `Evidence ${n}`, status: "final" }));
    edges.push(edge(`edge-ev-${n}-000${n}`, "evidences", evId, briefId));
  }
  return spec(nodes, edges);
}

/** The issue set a PREVIOUS successful run would have left behind: one open issue per
 * planned create, authored by the sync identity, carrying the projection verbatim.
 * Derived from the seam itself rather than re-implementing `projectBody`, so this
 * helper cannot drift from the projection it is meant to mirror. */
function issuesAfterFirstRun(s: LoadedSpec): ExistingIssue[] {
  const first = planIssueSync(s, [], OPTS);
  assert.equal(first.refused, false);
  assert.ok(first.create.length > 0, "fixture must plan at least one create on a virgin repo");
  return first.create.map((a, i) => ({
    number: 100 + i,
    title: a.title,
    body: a.body,
    state: "open" as const,
    authorLogin: OPTS.syncIdentity,
  }));
}

function issueFor(issues: readonly ExistingIssue[], nodeId: string): ExistingIssue {
  const found = issues.find((i) => markedNodeId(i.body) === nodeId);
  assert.ok(found !== undefined, `no synthesized issue for ${nodeId}`);
  return found;
}

function withState(issues: readonly ExistingIssue[], nodeId: string, state: "open" | "closed"): ExistingIssue[] {
  return issues.map((i) => (markedNodeId(i.body) === nodeId ? { ...i, state } : i));
}

function nodeIds(actions: readonly { nodeId: string }[]): string[] {
  return actions.map((a) => a.nodeId).sort();
}
function skippedReason(plan: IssueSyncPlan, nodeId: string): string {
  const hit = plan.skipped.find((s) => s.nodeId === nodeId);
  assert.ok(hit !== undefined, `${nodeId} not in skipped: ${JSON.stringify(plan.skipped)}`);
  return hit.reason;
}

// --- CC-5 / A2 case 1: no-op re-run -------------------------------------------------
test("CC-5 case 1: a re-run over issues that already match the projection plans nothing", () => {
  const s = graph();
  const existing = issuesAfterFirstRun(s);

  const plan = planIssueSync(s, existing, OPTS);

  assert.equal(plan.refused, false);
  assert.deepEqual(plan.create, [], "no creates on a no-op re-run");
  assert.deepEqual(plan.update, [], "no updates on a no-op re-run");
  assert.deepEqual(plan.reopen, [], "no reopens on a no-op re-run");
  assert.deepEqual(plan.close, [], "no closes on a no-op re-run");
  assert.equal(countPlanned(plan), 0);
  // Every synced node is accounted for as skipped — silence is not the signal.
  assert.deepEqual(nodeIds(plan.skipped), [ALPHA, BETA, CONTRACT].sort());
  assert.match(skippedReason(plan, ALPHA), /already matches the node/);
});

test("CC-5 case 1b: a drifted title or body is an update, not a skip (the no-op leg has teeth)", () => {
  const s = graph();
  const existing = issuesAfterFirstRun(s).map((i) =>
    markedNodeId(i.body) === ALPHA ? { ...i, title: `${i.title} (hand-edited)` } : i,
  );

  const plan = planIssueSync(s, existing, OPTS);

  assert.deepEqual(nodeIds(plan.update), [ALPHA]);
  assert.deepEqual(plan.create, []);
  assert.deepEqual(plan.reopen, []);
  assert.deepEqual(plan.close, []);
  assert.equal(plan.update[0]?.issueNumber, issueFor(existing, ALPHA).number);
});

// --- CC-5 / A2 case 2: reopen of a hand-closed lane ---------------------------------
test("CC-5 case 2: a hand-closed issue for still-open lane work is reopened, not created or updated", () => {
  const s = graph();
  const existing = withState(issuesAfterFirstRun(s), BETA, "closed");

  const plan = planIssueSync(s, existing, OPTS);

  assert.equal(plan.refused, false);
  assert.deepEqual(nodeIds(plan.reopen), [BETA]);
  assert.deepEqual(plan.create, [], "the closed issue is adopted, so nothing is created");
  assert.deepEqual(plan.update, [], "reopen wins over update");
  assert.deepEqual(plan.close, []);
  assert.equal(plan.reopen[0]?.issueNumber, issueFor(existing, BETA).number);
  assert.match(plan.reopen[0]?.reason ?? "", /still open work/);
});

// --- CC-5 / A2 case 3: close on final evidence --------------------------------------
test("CC-5 case 3: a lane brief with a final evidence has its open issue closed", () => {
  const before = graph();
  const existing = issuesAfterFirstRun(before); // issues opened while the lane was live
  const after = graph({ finalEvidenceFor: [ALPHA] });

  const plan = planIssueSync(after, existing, OPTS);

  assert.equal(plan.refused, false);
  assert.deepEqual(nodeIds(plan.close), [ALPHA]);
  assert.deepEqual(plan.create, []);
  assert.deepEqual(plan.reopen, []);
  assert.deepEqual(plan.update, []);
  assert.equal(plan.close[0]?.issueNumber, issueFor(existing, ALPHA).number);
  // The sibling lane is still live and the contract is therefore not yet covered.
  assert.deepEqual(nodeIds(plan.skipped), [BETA, CONTRACT].sort());
});

test("CC-5 case 3b: a DRAFT evidence does not close the lane's issue", () => {
  const before = graph();
  const existing = issuesAfterFirstRun(before);
  const s = graph();
  s.nodes.push(node("evidence-draft-0009", "evidence", { title: "Draft evidence", status: "draft" }));
  s.edges.push(edge("edge-ev-draft-0009", "evidences", "evidence-draft-0009", ALPHA));

  const plan = planIssueSync(s, existing, OPTS);

  assert.deepEqual(plan.close, [], "only a FINAL evidence closes an issue");
  assert.deepEqual(nodeIds(plan.skipped), [ALPHA, BETA, CONTRACT].sort());
});

// --- CC-5 / A2 case 4: close on final integration / superseded ----------------------
test("CC-5 case 4a: the contract's issue closes once every live lane carries final evidence", () => {
  const before = graph();
  const existing = issuesAfterFirstRun(before);
  const after = graph({ finalEvidenceFor: [ALPHA, BETA] });

  const plan = planIssueSync(after, existing, OPTS);

  assert.equal(plan.refused, false);
  assert.deepEqual(nodeIds(plan.close), [ALPHA, BETA, CONTRACT].sort());
  assert.deepEqual(plan.create, []);
  assert.deepEqual(plan.reopen, []);
  assert.deepEqual(plan.update, []);
});

// CC-4(3), the load-bearing second half: an issue closes on final evidence **OR** on
// `superseded`/`rejected`, because a COLLAPSED LANE is superseded and never evidenced
// (CLAUDE.md rule 3: supersede, never delete). Without this branch a collapsed lane's
// issue stays open forever, which is precisely what CC-4(3) exists to prevent.
//
// !! OBSERVED FAILURE — NOT WEAKENED; a possible CLAUDE.md rule-5 event, reported.
// `planIssueSync` iterates `syncTargets` (tools/issue_sync.ts:116-128), which derives
// brief ids through `liveBriefsForContract` → `liveSourcesByEdge(..., excludeStatus
// defaulting to "superseded")`. A SUPERSEDED brief is therefore dropped from the target
// set BEFORE `shouldClose` (tools/issue_sync.ts:135-146) can see it, so that function's
// `status === "superseded"` branch is unreachable for a brief: the collapsed lane's open
// issue is neither closed nor even reported in `skipped` — it is silently invisible.
// Measured asymmetry (probed directly against the landed seam):
//   - brief status `rejected`   → closes correctly (see the case below; `rejected` is not
//                                 in `liveSourcesByEdge`'s exclude default)
//   - brief status `superseded` → NOT closed, NOT skipped, issue left open forever
//   - CONTRACT status `superseded` → closes correctly (a contract is admitted to
//                                 `syncTargets` by its own loop, not through the walk)
// So exactly the half CC-4(3) calls load-bearing ("a collapsed lane is SUPERSEDED, never
// evidenced, so evidence alone would leave its issue open forever") is the half that does
// not work. The brief mandates this case (`### CC-5`: "close on a **superseded or
// rejected** lane (CC-4's collapsed-lane branch, which is superseded and never
// evidenced)"), so per the brief's "Scope-integrity standing rule" and CLAUDE.md rule 5
// this assertion stays exactly as written and the discrepancy is reported rather than
// assumed away. The fix belongs to `domain-backend` (`tools/**` is not this lane's file).
test("CC-5 case 4b: a superseded (collapsed) lane's open issue is closed", () => {
  const before = graph();
  const existing = issuesAfterFirstRun(before);
  const after = graph({ betaStatus: "superseded" });

  const plan = planIssueSync(after, existing, OPTS);

  assert.equal(plan.refused, false);
  assert.deepEqual(nodeIds(plan.close), [BETA], "a collapsed lane is superseded, never evidenced");
  assert.deepEqual(plan.create, [], "a superseded lane must never get a fresh issue");
  assert.deepEqual(plan.reopen, [], "a superseded lane's closed issue must never be reopened");
});

// The working half of CC-4(3)'s status branch, pinned so the failing case above is
// localized to `superseded` rather than read as "status never closes anything".
test("CC-5 case 4c: a REJECTED lane's open issue is closed", () => {
  const before = graph();
  const existing = issuesAfterFirstRun(before);
  const after = graph({ betaStatus: "rejected" });

  const plan = planIssueSync(after, existing, OPTS);

  assert.deepEqual(nodeIds(plan.close), [BETA]);
  assert.deepEqual(plan.create, []);
  assert.deepEqual(plan.reopen, []);
  assert.deepEqual(plan.update, []);
});

test("CC-5 case 4d: an already-closed issue for a completed lane is skipped, not re-closed", () => {
  const before = graph();
  const existing = withState(issuesAfterFirstRun(before), ALPHA, "closed");
  const after = graph({ finalEvidenceFor: [ALPHA] });

  const plan = planIssueSync(after, existing, OPTS);

  assert.deepEqual(plan.close, [], "no churn: the issue is already closed");
  assert.deepEqual(plan.reopen, [], "completed work is never reopened");
  assert.match(skippedReason(plan, ALPHA), /already closed/);
});

// --- CC-5: fail closed on an incomplete listing ------------------------------------
test("CC-5: an incomplete listing refuses the plan and proposes NO mutation", () => {
  const s = graph();
  const existing = issuesAfterFirstRun(s);

  // With a partial listing an absent issue is indistinguishable from an unlisted one,
  // so planning a create would duplicate it — the fail-closed discipline of
  // tools/gitdiff.ts:5-12 applied to a paginated listing.
  const plan = planIssueSync(s, existing, { ...OPTS, listingComplete: false });

  assert.equal(plan.refused, true);
  assert.deepEqual(plan.create, []);
  assert.deepEqual(plan.update, []);
  assert.deepEqual(plan.reopen, []);
  assert.deepEqual(plan.close, []);
  assert.deepEqual(plan.skipped, []);
  assert.equal(countPlanned(plan), 0, "nothing may be applied from a refused plan");
  assert.match(plan.refusedReason ?? "", /listing did not complete/);
});

test("CC-5: the refusal holds even on a virgin repo, where every node would otherwise be created", () => {
  const plan = planIssueSync(graph(), [], { ...OPTS, listingComplete: false });
  assert.equal(plan.refused, true);
  assert.equal(countPlanned(plan), 0);
  // Contrast: the same inputs with a complete listing DO plan creates, so the leg above
  // is not vacuous.
  assert.equal(countPlanned(planIssueSync(graph(), [], OPTS)), 3);
});

// --- CC-4(1): adoption requires the EXACT marker AND the sync identity -------------
test("CC-4(1) half one: a marked issue authored by someone else is not adopted", () => {
  const s = graph();
  const foreign: ExistingIssue = {
    number: 7,
    title: "[domain-backend] Resolver lane",
    body: `${nodeMarker(ALPHA)}\n\nhand-written by a human`,
    state: "open",
    authorLogin: "some-human",
  };

  const plan = planIssueSync(s, [foreign], OPTS);

  const reason = skippedReason(plan, ALPHA);
  assert.match(reason, /some-human/, "the skip reason must name the author");
  assert.match(reason, /github-actions\[bot\]/, "and the sync identity it is not");
  // Not adopted means the node still has no issue of record.
  assert.ok(nodeIds(plan.create).includes(ALPHA), "an unadopted issue must not suppress the create");
  assert.deepEqual(plan.update, [], "a foreign issue is never edited");
  assert.deepEqual(plan.close, []);
  assert.deepEqual(plan.reopen, []);
});

test("CC-4(1) half two: body text merely CONTAINING the sentinel is not a marker", () => {
  // Direct on `markedNodeId`, as the exactness is a property of the parser.
  assert.equal(markedNodeId(nodeMarker(ALPHA)), ALPHA, "the exact HTML comment form is adopted");
  assert.equal(markedNodeId(`prefix\n${nodeMarker(ALPHA)}\nsuffix`), ALPHA);
  assert.equal(markedNodeId(`we set pactwright:node=${ALPHA} in prose`), undefined);
  assert.equal(markedNodeId(`\`pactwright:node=${ALPHA}\``), undefined);
  assert.equal(markedNodeId(`<!-- pactwright:node=${ALPHA}`), undefined, "unterminated comment");
  assert.equal(markedNodeId(`<!-- pactwright:nodes=${ALPHA} -->`), undefined, "near-miss key");
  assert.equal(markedNodeId("no marker at all"), undefined);

  // And the same at the plan level: the sentinel in prose does not adopt the issue.
  const prose: ExistingIssue = {
    number: 9,
    title: "[domain-backend] Resolver lane",
    body: `discussion of pactwright:node=${ALPHA} without the comment form`,
    state: "open",
    authorLogin: OPTS.syncIdentity,
  };
  const plan = planIssueSync(graph(), [prose], OPTS);
  assert.ok(nodeIds(plan.create).includes(ALPHA), "an unmarked issue is invisible to the plan");
  assert.deepEqual(plan.skipped, [], "an unmarked issue is not even reported — it claims no node");
});

// --- CC-4(2): the projection is BOUNDED --------------------------------------------
test("CC-4(2): the projected body carries only id, status, lane, owner and a link — never the node body", () => {
  const plan = planIssueSync(graph(), [], OPTS);
  const alpha = plan.create.find((a) => a.nodeId === ALPHA);
  assert.ok(alpha !== undefined);

  assert.ok(alpha.body.includes(nodeMarker(ALPHA)), "the marker is present");
  assert.match(alpha.body, /- id: `brief-alpha-aa01`/);
  assert.match(alpha.body, /- status: draft/);
  assert.match(alpha.body, /- lane: domain-backend/);
  assert.match(alpha.body, /- owner: backend-implementer/);
  assert.match(alpha.body, /- source: https:\/\/github\.com\/samir\/pactwright\/blob\/main\/specs\/nodes\/brief-alpha-aa01\.md/);

  // The bound itself: no node body text ever reaches an issue.
  assert.ok(!alpha.body.includes(BODY_SENTINEL), "the node body must not be projected");
  for (const action of plan.create) {
    assert.ok(!action.body.includes(BODY_SENTINEL), `${action.nodeId}: body leaked into the projection`);
    assert.ok(!action.title.includes(BODY_SENTINEL), `${action.nodeId}: body leaked into the title`);
  }

  // An absent `owner` (every brief of this decomposition) is tolerated, not crashed on.
  const beta = plan.create.find((a) => a.nodeId === BETA);
  assert.ok(beta !== undefined);
  assert.match(beta.body, /- owner: —/);
  assert.equal(beta.title, "[test-verification] Verification lane");
});

// --- purity / determinism -----------------------------------------------------------
test("CC-5: planIssueSync is deterministic — two calls on the same inputs are deeply equal", () => {
  const s = graph({ finalEvidenceFor: [ALPHA] });
  const existing = issuesAfterFirstRun(graph());
  // Shuffled input order must not change the plan either: adoption sorts by number.
  const shuffled = [...existing].reverse();

  const a = planIssueSync(s, existing, OPTS);
  const b = planIssueSync(s, existing, OPTS);
  const c = planIssueSync(s, shuffled, OPTS);

  assert.deepEqual(a, b, "same inputs, same plan");
  assert.deepEqual(a, c, "issue listing order does not affect the plan");
});

// --- CC-5: the per-run planned/applied/failed report shape --------------------------
test("CC-5: the run report states planned, applied, failed and skipped counts", () => {
  const plan = planIssueSync(graph(), [], OPTS);
  assert.equal(countPlanned(plan), plan.create.length + plan.update.length + plan.reopen.length + plan.close.length);

  assert.equal(
    formatRunReport(plan, { planned: countPlanned(plan), applied: 2, failed: 1 }),
    "spec:issue-sync: 3 planned, 2 applied, 1 failed (0 skipped)",
  );

  const refused = planIssueSync(graph(), [], { ...OPTS, listingComplete: false });
  assert.equal(
    formatRunReport(refused, { planned: 0, applied: 0, failed: 0 }),
    "spec:issue-sync: 0 planned, 0 applied, 0 failed (0 skipped)",
  );
});

// --- totality: the seam never throws on a degenerate graph -------------------------
test("CC-5: the seam is total — an unresolved edge and an orphan contract plan nothing and throw nothing", () => {
  const s = spec(
    [
      node("contract-orphan-0aa1", "contract", { title: "No briefs", status: "approved", class: 1 }),
      node("intent-loose-0bb2", "intent", { title: "Loose intent", status: "open", class: 1 }),
    ],
    [edge("edge-dangling-0cc3", "decomposes", "brief-missing-0dd4", "contract-orphan-0aa1")],
  );

  const plan = planIssueSync(s, [], OPTS);

  assert.equal(plan.refused, false);
  assert.equal(countPlanned(plan), 0, "a contract with no live brief gets no issue");
  assert.deepEqual(plan.skipped, []);
});
