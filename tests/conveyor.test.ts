import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "js-yaml";
import {
  CONVEYOR_CLASS_ROUTING,
  deriveStage,
  lanesRequired,
  marketRequired,
  nextSteps,
  type Stage,
  type Step,
} from "../tools/conveyor.ts";
import { serializeIndexes, serializeStatus, serializeTrails } from "../tools/indexer.ts";
import { loadSpec, type EdgeRecord, type LoadedSpec, type NodeRecord } from "../tools/loader.ts";

/**
 * The conveyor verification lane's routing matrix (brief-conveyor-tests-4c86, files
 * to create item 1). Five things live here, and each names the clause it answers:
 *
 *  - the Behaviour-2 routing matrix over `nextSteps(spec, nodeId)`, including A7's
 *    `brief`-at-`implemented` rule and A5's graph-state terminality;
 *  - the A6 resolver-invocation pin over the fourteen chain command files, with the
 *    negative leg that proves A1's fallback prose cannot satisfy it;
 *  - the A12 `CONVEYOR_CLASS_ROUTING` byte-equality pin (SETTLED TO PIN by
 *    `brief-conveyor-resolver-3f7a`; the read-CLAUDE.md-as-data branch is not live
 *    work and is deliberately not written here);
 *  - the CC-8 view legs (leg 1 byte-identity/determinism, leg 2 time-invariance under
 *    two far-apart fake clocks, leg 3 the no-dated-cell leg, leg 4 totality, plus the
 *    static clock-freedom source grep);
 *  - the CC-12 transcript replay against `tests/fixtures/conveyor-transcript/`.
 *
 * HONEST BOUNDS, recorded here because the brief requires them recorded in the test
 * file and not only in the evidence:
 *
 *  - A6 pins that each command FILE INSTRUCTS the agent to run the resolver. It does
 *    NOT prove any given invocation ran it. That second half is A9's CI transcription
 *    job (`observability-release`) plus the CC-12 replay below, which pins what the
 *    resolver WOULD print for a recorded graph state — not that a live command ran it.
 *  - The clock-freedom leg is a source grep over the two view modules, not a proof of
 *    time-invariance of every transitive callee.
 *  - Whether a leg asserts the RIGHT thing, and whether the recorded graph is
 *    representative, stay reviewer judgement (contract Acceptance 8).
 */

/**
 * THE SINGLE-GRAPH-WRITE CLAUSE SET (`brief-write-tests-flip-4e19`, step 5;
 * `decision-write-tests-flip-7f14` amendments 1, 2, 3, 4, 14 and 16, plus
 * `comparison-write-tests-market-6e83`'s common-core finding 1). The invariant is
 * recorded HERE because this is where the pin lives, not only in the decision.
 *
 * THE SET IS CLOSED AND HAS EXACTLY TWO MEMBERS: `implement-brief.md` and
 * `write-tests.md`. These are the only chain command files whose non-fallback text may
 * carry the `EXACTLY ONE GRAPH WRITE:` clause, and the set-equality leg below asserts
 * that both directions hold — a third command acquiring the clause reds, and either
 * member losing it reds. Amendment 14's distinction is load-bearing and is NOT the same
 * count: the commands that may write a brief to `implemented` are THREE
 * (`/implement-brief`, `/prepare-evidence`, `/write-tests`); the CLAUSE set is two. The
 * pin is on the clause set only. A third member needs its own decision.
 *
 * FAILURE DIRECTION, chosen deliberately (amendment 2), stated here in the same words
 * the clause carries: if the flip is skipped the brief stays at its pre-implementation
 * status and `/write-tests` reprints itself — EXACTLY today's behaviour, which is the
 * weaker of the two failure modes. Nothing routes forward on an unwritten lane. The
 * stronger failure mode (a lane marked `implemented` whose suite was never green) is
 * the one this design refuses to risk.
 *
 * THE BOUND ON THE DEFECT (finding 1), recorded so no reader takes the overstatement as
 * endorsed: `/prepare-evidence` ALREADY flips a laned brief to `implemented`
 * (`prepare-evidence.md:9-13`), so the stale `draft` window was ONE COMMAND WIDE, never
 * permanent. The defect this pin protects against is a one-step ORDERING gap, not a
 * missing fact.
 *
 * HONEST BOUND ON WHICH LEGS BELOW HAVE POWER OVER THIS CHANGE, admitted rather than
 * argued away (finding 12; contract Acceptance 3's "admitted weakness"):
 *
 *  - The Acceptance-2 routing legs (`test-lane-implemented`, `implemented-market-late`,
 *    `implemented-tension`) pin `tools/conveyor.ts`'s `:521`-before-`:574` ordering —
 *    the `status === "implemented"` early return that precedes the lane and market
 *    branches. That ordering is NOT touched by this change, so those three legs are
 *    green with the whole diff reverted. They record behaviour; they do not guard it.
 *  - The COMMAND-FILE legs (clause literals, relative order, clause-set equality) and
 *    their negative leg are the ONLY legs with power over this diff. Everything the
 *    change actually alters lives in `.claude/commands/write-tests.md`, and those legs
 *    are what red when it regresses.
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = path.join(repoRoot, "tests", "fixtures");

// ---------------------------------------------------------------------------
// Builders — copied verbatim from tests/checkdiff.test.ts:6-17 (the pure-decision
// builder idiom the brief mandates reusing rather than reinventing), plus one
// `withBody` helper because 2.5(c) reads the brief BODY for its marker.
// ---------------------------------------------------------------------------

const TODAY = "2026-06-14";
const SENSITIVE = ["specs/schema/**"];

function node(id: string, type: string, extra: Record<string, unknown> = {}): NodeRecord {
  return { file: `specs/nodes/${id}.md`, data: { id, type, ...extra }, body: "body" };
}
function edge(id: string, type: string, source: string, target: string): EdgeRecord {
  return { id, type, source, target, created: TODAY };
}
function spec(nodes: NodeRecord[], edges: EdgeRecord[]): LoadedSpec {
  return { root: "/repo/specs", nodes, edges, nodeTypes: {}, edgeTypes: {}, rules: [], checks: [], sensitivePaths: SENSITIVE };
}
function withBody(n: NodeRecord, body: string): NodeRecord {
  return { ...n, body };
}

/** The CC-6 node-id shape, written out here rather than imported from
 * `tools/conveyor.ts`: a `paste` leg that borrowed the resolver's own predicate would
 * pass by construction if that predicate were widened. */
const ID_SHAPE = /^[a-z]+-[a-z0-9-]*-[0-9a-f]{4}$/;
/** A `template` argument: a placeholder no graph state can fill. */
const PLACEHOLDER = /<[^>]+>/;

function commands(steps: Step[]): string[] {
  return steps.map((s) => s.command);
}
function rendered(steps: Step[]): string[] {
  return steps.map((s) => s.rendered);
}
function only(steps: Step[]): Step {
  assert.equal(steps.length, 1, `expected exactly one step, got:\n${rendered(steps).join("\n")}`);
  return steps[0];
}

// ---------------------------------------------------------------------------
// The graphs. Each is one Behaviour-2 branch, named by its behaviour number.
// ---------------------------------------------------------------------------

/** 2.1 — an open intent with no live candidate. */
const gFresh = spec([node("intent-fresh-0001", "intent", { status: "open", class: 1 })], []);

/** 2.2, class 1 — ONE candidate, no comparison. Contract Acceptance 2 names this. */
const gOneCandidate = spec(
  [
    node("intent-one-0011", "intent", { status: "open", class: 1 }),
    node("contract-one-0012", "contract", { status: "proposed", class: 1 }),
  ],
  [edge("e-one-proposes", "proposes", "contract-one-0012", "intent-one-0011")],
);

/** 2.2, class 3 — two candidates, no comparison: the market is required. */
const gMarketUncompared = spec(
  [
    node("intent-market-0021", "intent", { status: "open", class: 3 }),
    node("contract-alpha-0022", "contract", { status: "proposed", class: 3 }),
    node("contract-beta-0023", "contract", { status: "proposed", class: 3 }),
  ],
  [
    edge("e-a-proposes", "proposes", "contract-alpha-0022", "intent-market-0021"),
    edge("e-b-proposes", "proposes", "contract-beta-0023", "intent-market-0021"),
  ],
);

/** 2.3 — a comparison covers the candidates, nothing selected. */
const gCompared = spec(
  [
    node("intent-cmp-0031", "intent", { status: "open", class: 3 }),
    node("contract-alpha-0032", "contract", { status: "proposed", class: 3 }),
    node("contract-beta-0033", "contract", { status: "proposed", class: 3 }),
    node("comparison-cmp-0034", "comparison", { status: "recorded" }),
  ],
  [
    edge("e-a-proposes", "proposes", "contract-alpha-0032", "intent-cmp-0031"),
    edge("e-b-proposes", "proposes", "contract-beta-0033", "intent-cmp-0031"),
    edge("e-a-compares", "compares", "comparison-cmp-0034", "contract-alpha-0032"),
    edge("e-b-compares", "compares", "comparison-cmp-0034", "contract-beta-0033"),
  ],
);

/** A selected class-3 contract with no brief: the intent routes THROUGH the winner
 * (2.4), and the winner needs lanes. Contract Acceptance 2 names the 2.4 hop. */
const gSelectedClass3 = spec(
  [
    node("intent-sel-0041", "intent", { status: "open", class: 3 }),
    node("contract-win-0042", "contract", { status: "approved", class: 3 }),
    node("contract-lose-0043", "contract", { status: "rejected", class: 3 }),
    node("decision-sel-0044", "decision", { status: "recorded" }),
    node("comparison-sel-0045", "comparison", { status: "recorded" }),
  ],
  [
    edge("e-w-proposes", "proposes", "contract-win-0042", "intent-sel-0041"),
    edge("e-l-proposes", "proposes", "contract-lose-0043", "intent-sel-0041"),
    edge("e-cmp-w", "compares", "comparison-sel-0045", "contract-win-0042"),
    edge("e-cmp-l", "compares", "comparison-sel-0045", "contract-lose-0043"),
    edge("e-selects", "selects", "decision-sel-0044", "contract-win-0042"),
  ],
);

/** 2.4, class 1 — an approved contract with no brief that does NOT require lanes. */
const gApprovedClass1 = spec([node("contract-solo-0051", "contract", { status: "approved", class: 1 })], []);

/** 2.5 — one unlaned draft brief of a class-1 contract. */
const gSingleBrief = spec(
  [
    node("contract-single-0061", "contract", { status: "approved", class: 1 }),
    node("brief-single-0062", "brief", { status: "draft" }),
  ],
  [edge("e-dec", "decomposes", "brief-single-0062", "contract-single-0061")],
);

/** 2.5 — the verification lane's own brief routes to /write-tests. */
const gTestLane = spec(
  [
    node("contract-lane-0071", "contract", { status: "approved", class: 1 }),
    node("brief-tests-0072", "brief", { status: "draft", lane: "test-verification" }),
  ],
  [edge("e-dec", "decomposes", "brief-tests-0072", "contract-lane-0071")],
);

/** 2.5(c) — a class-2 brief whose BODY carries the `## Strategy tension` marker. */
const gTension = spec(
  [
    node("contract-tension-0081", "contract", { status: "approved", class: 2 }),
    withBody(
      node("brief-tension-0082", "brief", { status: "draft", lane: "domain-backend" }),
      "intro\n\n## Strategy tension\n\ntwo defensible shapes\n",
    ),
  ],
  [edge("e-dec", "decomposes", "brief-tension-0082", "contract-tension-0081")],
);

/** 2.5(c) — the SAME class-2 shape with NO marker: a judgement reminder, never a
 * paste-able /propose-patches. */
const gNoTension = spec(
  [
    node("contract-notension-0091", "contract", { status: "approved", class: 2 }),
    node("brief-notension-0092", "brief", { status: "draft", lane: "domain-backend" }),
  ],
  [edge("e-dec", "decomposes", "brief-notension-0092", "contract-notension-0091")],
);

/** 2.6 — an open patch market with no covering comparison. */
const gMarketOpen = spec(
  [
    node("contract-pm-0101", "contract", { status: "approved", class: 3 }),
    node("brief-pm-0102", "brief", { status: "draft", lane: "domain-backend", patch_market: true }),
    node("patch-alpha-0103", "patch", { status: "candidate" }),
    node("patch-beta-0104", "patch", { status: "candidate" }),
  ],
  [
    edge("e-dec", "decomposes", "brief-pm-0102", "contract-pm-0101"),
    edge("e-a-cf", "competes-for", "patch-alpha-0103", "brief-pm-0102"),
    edge("e-b-cf", "competes-for", "patch-beta-0104", "brief-pm-0102"),
  ],
);

/** 2.7 — a comparison covers every live competitor, nothing selected. */
const gMarketComparedUnselected = spec(
  [
    node("contract-pc-0111", "contract", { status: "approved", class: 3 }),
    node("brief-pc-0112", "brief", { status: "draft", lane: "domain-backend", patch_market: true }),
    node("patch-alpha-0113", "patch", { status: "candidate" }),
    node("patch-beta-0114", "patch", { status: "candidate" }),
    node("comparison-pc-0115", "comparison", { status: "recorded" }),
  ],
  [
    edge("e-dec", "decomposes", "brief-pc-0112", "contract-pc-0111"),
    edge("e-a-cf", "competes-for", "patch-alpha-0113", "brief-pc-0112"),
    edge("e-b-cf", "competes-for", "patch-beta-0114", "brief-pc-0112"),
    edge("e-a-cmp", "compares", "comparison-pc-0115", "patch-alpha-0113"),
    edge("e-b-cmp", "compares", "comparison-pc-0115", "patch-beta-0114"),
  ],
);

/** 2.8 — a RESOLVED patch market: a `selects` decision named the winner. Asked of
 * the brief AND of the winning patch; the two must agree. */
const gMarketResolved = spec(
  [
    node("contract-pw-0121", "contract", { status: "approved", class: 3 }),
    node("brief-pw-0122", "brief", { status: "draft", lane: "domain-backend", patch_market: true }),
    node("patch-win-0123", "patch", { status: "selected" }),
    node("patch-lose-0124", "patch", { status: "superseded" }),
    node("comparison-pw-0125", "comparison", { status: "recorded" }),
    node("decision-pw-0126", "decision", { status: "recorded" }),
  ],
  [
    edge("e-dec", "decomposes", "brief-pw-0122", "contract-pw-0121"),
    edge("e-w-cf", "competes-for", "patch-win-0123", "brief-pw-0122"),
    edge("e-l-cf", "competes-for", "patch-lose-0124", "brief-pw-0122"),
    edge("e-w-cmp", "compares", "comparison-pw-0125", "patch-win-0123"),
    edge("e-l-cmp", "compares", "comparison-pw-0125", "patch-lose-0124"),
    edge("e-selects", "selects", "decision-pw-0126", "patch-win-0123"),
  ],
);

/** A7 — a brief at `implemented` with no evidence yet. */
const gImplemented = spec(
  [
    node("contract-impl-0131", "contract", { status: "approved", class: 1 }),
    node("brief-impl-0132", "brief", { status: "implemented" }),
  ],
  [edge("e-dec", "decomposes", "brief-impl-0132", "contract-impl-0131")],
);

/** Acceptance 2 (`brief-write-tests-flip-4e19` step 5.1) — the shape `/write-tests`'s
 * single graph write PRODUCES: an approved class-2 contract, a `decomposes` edge, and a
 * `lane: test-verification` brief at `implemented` with no evidence yet. This is the
 * state the flip leaves behind, and the state the resolver must route OUT of. */
const gTestLaneImplemented = spec(
  [
    node("contract-testimpl-0191", "contract", { status: "approved", class: 2 }),
    node("brief-testimpl-0192", "brief", { status: "implemented", lane: "test-verification" }),
  ],
  [edge("e-dec", "decomposes", "brief-testimpl-0192", "contract-testimpl-0191")],
);

/** Amendment 20 (step 5.2) — the SAME implemented verification-lane brief, with a patch
 * market opened AFTERWARDS (`patch_market: true`, no competitors, no comparison). */
const gImplementedMarketLate = spec(
  [
    node("contract-late-0201", "contract", { status: "approved", class: 2 }),
    node("brief-late-0202", "brief", {
      status: "implemented",
      lane: "test-verification",
      patch_market: true,
    }),
  ],
  [edge("e-dec", "decomposes", "brief-late-0202", "contract-late-0201")],
);

/** Amendment 16 (step 5.3) — the SAME implemented verification-lane brief whose BODY
 * carries the `## Strategy tension` marker that `gTension` above routes on. */
const gImplementedTension = spec(
  [
    node("contract-impltension-0211", "contract", { status: "approved", class: 2 }),
    withBody(
      node("brief-impltension-0212", "brief", { status: "implemented", lane: "test-verification" }),
      "intro\n\n## Strategy tension\n\ntwo defensible shapes\n",
    ),
  ],
  [edge("e-dec", "decomposes", "brief-impltension-0212", "contract-impltension-0211")],
);

/** Evidence precedence — a brief at `implemented` that ALSO carries final evidence,
 * with a sibling lane outstanding. It must route through its contract's coverage and
 * never reprint /prepare-evidence for itself. */
const gEvidencedWithSibling = spec(
  [
    node("contract-multi-0141", "contract", { status: "approved", class: 3 }),
    node("brief-done-0142", "brief", { status: "implemented", lane: "domain-backend" }),
    node("brief-todo-0143", "brief", { status: "draft", lane: "test-verification" }),
    node("evidence-done-0144", "evidence", { status: "final" }),
  ],
  [
    edge("e-dec-a", "decomposes", "brief-done-0142", "contract-multi-0141"),
    edge("e-dec-b", "decomposes", "brief-todo-0143", "contract-multi-0141"),
    edge("e-ev", "evidences", "evidence-done-0144", "brief-done-0142"),
  ],
);

/** A5 — a LONE live brief, finally evidenced: /prepare-evidence is terminal here and
 * there is no integration node (single-brief contracts skip integration). */
const gLoneEvidenced = spec(
  [
    node("contract-lone-0151", "contract", { status: "approved", class: 1 }),
    node("brief-lone-0152", "brief", { status: "implemented" }),
    node("evidence-lone-0153", "evidence", { status: "final" }),
  ],
  [
    edge("e-dec", "decomposes", "brief-lone-0152", "contract-lone-0151"),
    edge("e-ev", "evidences", "evidence-lone-0153", "brief-lone-0152"),
  ],
);

/** A5 — the LAST lane of a multi-lane contract reaches final evidence and no
 * integration covers the set: /integrate <contract-id>. */
const gLastLane = spec(
  [
    node("contract-last-0161", "contract", { status: "approved", class: 3 }),
    node("brief-a-0162", "brief", { status: "implemented", lane: "domain-backend" }),
    node("brief-b-0163", "brief", { status: "implemented", lane: "test-verification" }),
    node("evidence-a-0164", "evidence", { status: "final" }),
    node("evidence-b-0165", "evidence", { status: "final" }),
  ],
  [
    edge("e-dec-a", "decomposes", "brief-a-0162", "contract-last-0161"),
    edge("e-dec-b", "decomposes", "brief-b-0163", "contract-last-0161"),
    edge("e-ev-a", "evidences", "evidence-a-0164", "brief-a-0162"),
    edge("e-ev-b", "evidences", "evidence-b-0165", "brief-b-0163"),
  ],
);

/** A5 — the same contract once a FINAL integration covers every live lane:
 * /integrate is no longer offered, and the PR action is terminal. */
const gFullCoverage = spec(
  [
    node("contract-full-0171", "contract", { status: "approved", class: 3 }),
    node("brief-a-0172", "brief", { status: "implemented", lane: "domain-backend" }),
    node("brief-b-0173", "brief", { status: "implemented", lane: "test-verification" }),
    node("evidence-a-0174", "evidence", { status: "final" }),
    node("evidence-b-0175", "evidence", { status: "final" }),
    node("integration-full-0176", "integration", { status: "final" }),
  ],
  [
    edge("e-dec-a", "decomposes", "brief-a-0172", "contract-full-0171"),
    edge("e-dec-b", "decomposes", "brief-b-0173", "contract-full-0171"),
    edge("e-ev-a", "evidences", "evidence-a-0174", "brief-a-0172"),
    edge("e-ev-b", "evidences", "evidence-b-0175", "brief-b-0173"),
    edge("e-int-a", "integrates", "integration-full-0176", "evidence-a-0174"),
    edge("e-int-b", "integrates", "integration-full-0176", "evidence-b-0175"),
  ],
);

/** Totality (CC-8): an unknown `type`, an absent `status`, a class outside 0-3, a
 * dangling edge and a malformed id, all in one loadable graph. */
const gMalformed = spec(
  [
    node("intent-wildclass-0181", "intent", { status: "open", class: 99 }),
    node("intent-nostatus-0182", "intent", { class: 2 }),
    node("widget-strange-0183", "widget", { status: "open" }),
    node("contract-notype-0184", "", { status: "approved", class: 3 }),
    node("intent-badid", "intent", { status: "open", class: 0 }),
  ],
  [
    edge("e-dangle", "proposes", "contract-missing-9999", "intent-wildclass-0181"),
    edge("e-noshape", "decomposes", "brief-missing-8888", "contract-notype-0184"),
  ],
);

/** Every graph above, with the ids the cross-cutting legs sweep. */
const CORPUS: { name: string; spec: LoadedSpec }[] = [
  { name: "fresh", spec: gFresh },
  { name: "one-candidate", spec: gOneCandidate },
  { name: "market-uncompared", spec: gMarketUncompared },
  { name: "compared", spec: gCompared },
  { name: "selected-class3", spec: gSelectedClass3 },
  { name: "approved-class1", spec: gApprovedClass1 },
  { name: "single-brief", spec: gSingleBrief },
  { name: "test-lane", spec: gTestLane },
  { name: "tension", spec: gTension },
  { name: "no-tension", spec: gNoTension },
  { name: "market-open", spec: gMarketOpen },
  { name: "market-compared-unselected", spec: gMarketComparedUnselected },
  { name: "market-resolved", spec: gMarketResolved },
  { name: "implemented", spec: gImplemented },
  { name: "evidenced-with-sibling", spec: gEvidencedWithSibling },
  { name: "lone-evidenced", spec: gLoneEvidenced },
  { name: "last-lane", spec: gLastLane },
  { name: "full-coverage", spec: gFullCoverage },
  { name: "malformed", spec: gMalformed },
  { name: "test-lane-implemented", spec: gTestLaneImplemented },
  { name: "implemented-market-late", spec: gImplementedMarketLate },
  { name: "implemented-tension", spec: gImplementedTension },
];

function idsOf(s: LoadedSpec): string[] {
  return s.nodes.map((n) => String(n.data["id"] ?? "")).filter((id) => id !== "");
}

// ---------------------------------------------------------------------------
// Behaviour 2 — the routing matrix, one test per branch.
// ---------------------------------------------------------------------------

test("2.1 an open intent with no candidate routes to /propose-contracts", () => {
  const s = only(nextSteps(gFresh, "intent-fresh-0001"));
  assert.equal(s.command, "propose-contracts");
  assert.equal(s.kind, "paste");
  assert.deepEqual(s.args, ["intent-fresh-0001"]);
  assert.equal(s.rendered, "/propose-contracts intent-fresh-0001");
  // `why` names the EDGE that turned this branch on (its absence, here).
  assert.match(s.why, /proposes/);
  assert.equal(deriveStage(gFresh, "intent-fresh-0001"), "intent-open");
});

test("2.2 a ONE-candidate class-1 intent routes to /approve-contract (Acceptance 2)", () => {
  const s = only(nextSteps(gOneCandidate, "intent-one-0011"));
  assert.equal(s.command, "approve-contract");
  assert.equal(s.kind, "template", "the amendment note is judgement no graph state can fill");
  assert.equal(s.args[0], "contract-one-0012");
  assert.equal(s.rendered, '/approve-contract contract-one-0012 "<notes>"');
  // NOT the market hop: class 1 does not require a proposal market.
  assert.equal(commands([s]).includes("review-contracts"), false);
  // `why` names the FIELD that turned the branch on: the class.
  assert.match(s.why, /class 1/);
  assert.match(s.why, /does not require a market/);
});

test("2.2 a class-3 intent with two uncompared candidates routes to /review-contracts", () => {
  const s = only(nextSteps(gMarketUncompared, "intent-market-0021"));
  assert.equal(s.command, "review-contracts");
  assert.equal(s.kind, "paste");
  assert.deepEqual(s.args, ["intent-market-0021"]);
  assert.match(s.why, /class 3 requires a proposal market/);
  assert.equal(deriveStage(gMarketUncompared, "intent-market-0021"), "intent-proposed");
});

test("2.3 a covered-but-unselected market enumerates /approve-contract per candidate", () => {
  const steps = nextSteps(gCompared, "intent-cmp-0031");
  assert.deepEqual(rendered(steps), [
    "/approve-contract contract-alpha-0032 '<amendments>'",
    "/approve-contract contract-beta-0033 '<amendments>'",
  ]);
  for (const s of steps) {
    assert.equal(s.kind, "template");
    // Enumerated, never ranked: `why` names the comparison edge and the missing selects.
    assert.match(s.why, /comparison covers the live candidates/);
    assert.match(s.why, /selects/);
  }
  assert.equal(deriveStage(gCompared, "intent-cmp-0031"), "intent-compared");
});

test("2.4 a class-3 approved contract with no brief routes to /decompose-lanes, never /write-brief", () => {
  const steps = nextSteps(gSelectedClass3, "contract-win-0042");
  const s = only(steps);
  assert.equal(s.command, "decompose-lanes");
  assert.equal(s.kind, "template", "the lane list is judgement, not graph state");
  assert.equal(s.args[0], "contract-win-0042");
  assert.equal(s.rendered, "/decompose-lanes contract-win-0042 '<lanes>'");
  assert.match(s.why, /class 3 requires lanes/);
  assert.equal(
    commands(steps).includes("write-brief"),
    false,
    "a class-3 contract must never be offered a single unlaned brief",
  );
  assert.equal(deriveStage(gSelectedClass3, "contract-win-0042"), "contract-approved");
  // The intent routes THROUGH the selected winner: same steps, no separate branch.
  assert.deepEqual(nextSteps(gSelectedClass3, "intent-sel-0041"), steps);
  assert.equal(deriveStage(gSelectedClass3, "intent-sel-0041"), "intent-selected");
});

test("2.4 a class-1 approved contract with no brief offers /write-brief plus the lane alternative", () => {
  const steps = nextSteps(gApprovedClass1, "contract-solo-0051");
  assert.deepEqual(commands(steps), ["write-brief", "decompose-lanes"]);
  assert.equal(steps[0].kind, "paste");
  assert.deepEqual(steps[0].args, ["contract-solo-0051"]);
  assert.match(steps[0].why, /does not require lanes/);
  assert.equal(steps[1].kind, "template");
  assert.match(steps[1].why, /alternative/);
});

test("2.5 a draft unlaned brief routes to /implement-brief and (class 1) raises no market reminder", () => {
  const s = only(nextSteps(gSingleBrief, "brief-single-0062"));
  assert.equal(s.command, "implement-brief");
  assert.equal(s.kind, "paste");
  assert.deepEqual(s.args, ["brief-single-0062"]);
  assert.match(s.why, /draft/, "`why` names the status field that turned the branch on");
  assert.equal(deriveStage(gSingleBrief, "brief-single-0062"), "brief-open");
});

test("2.5 a `lane: test-verification` brief routes to /write-tests, not /implement-brief", () => {
  const s = only(nextSteps(gTestLane, "brief-tests-0072"));
  assert.equal(s.command, "write-tests");
  assert.equal(s.kind, "paste");
  assert.deepEqual(s.args, ["brief-tests-0072"]);
  assert.match(s.why, /lane: test-verification/, "`why` names the field that turned the branch on");
});

test("2.5c the marker is TRANSCRIBED: a `## Strategy tension` body yields /propose-patches", () => {
  const steps = nextSteps(gTension, "brief-tension-0082");
  assert.deepEqual(commands(steps), ["implement-brief", "propose-patches"]);
  const pp = steps[1];
  assert.equal(pp.kind, "template");
  assert.equal(pp.rendered, '/propose-patches brief-tension-0082 <n> "<strategies>"');
  assert.match(pp.why, /## Strategy tension/, "`why` names the marker it transcribed");
});

test("2.5c tension is NEVER inferred: a class-2 brief with no marker gets an action reminder", () => {
  const steps = nextSteps(gNoTension, "brief-notension-0092");
  assert.deepEqual(commands(steps), ["implement-brief", "judgement"]);
  const reminder = steps[1];
  assert.equal(reminder.kind, "action", "a judgement reminder is never a paste-able command line");
  assert.deepEqual(reminder.args, []);
  assert.equal(reminder.rendered.startsWith("/"), false, "an action must not render as a runnable line");
  assert.match(reminder.why, /never infers tension/);
  assert.match(reminder.why, /class 2/);
  // The negative half of 2.5c: no /propose-patches of ANY kind is offered.
  assert.equal(
    steps.some((s) => s.command === "propose-patches"),
    false,
    "the resolver must not synthesise a /propose-patches line from an absent marker",
  );
  // And the class-1 shape raises no reminder at all.
  assert.deepEqual(commands(nextSteps(gSingleBrief, "brief-single-0062")), ["implement-brief"]);
});

test("2.6 an open, uncompared patch market routes to /compare-patches plus optional synthesis", () => {
  const steps = nextSteps(gMarketOpen, "brief-pm-0102");
  assert.deepEqual(commands(steps), ["compare-patches", "synthesize-patches"]);
  assert.equal(steps[0].kind, "paste");
  assert.deepEqual(steps[0].args, ["brief-pm-0102"]);
  assert.match(steps[0].why, /compete for this brief/);
  assert.equal(steps[1].kind, "template");
  assert.equal(steps[1].rendered, '/synthesize-patches brief-pm-0102 "<patch-ids>" "<instruction>"');
  assert.equal(deriveStage(gMarketOpen, "brief-pm-0102"), "brief-market");
});

test("2.7 a compared, unselected market enumerates /select-patch per live competitor", () => {
  const steps = nextSteps(gMarketComparedUnselected, "brief-pc-0112");
  assert.deepEqual(rendered(steps), [
    '/select-patch patch-alpha-0113 "<rationale>"',
    '/select-patch patch-beta-0114 "<rationale>"',
  ]);
  for (const s of steps) {
    assert.equal(s.kind, "template");
    assert.match(s.why, /comparison covers every live competitor/);
  }
});

test("2.8 a SELECTED patch routes to /prepare-evidence <brief-id> through `competes-for`, never a branch", () => {
  const s = only(nextSteps(gMarketResolved, "patch-win-0123"));
  assert.equal(s.command, "prepare-evidence");
  assert.equal(s.kind, "paste");
  // The argument is the BRIEF id, resolved through the edge — not a branch name.
  assert.deepEqual(s.args, ["brief-pw-0122"]);
  assert.equal(s.rendered, "/prepare-evidence brief-pw-0122");
  assert.match(s.why, /competes-for/, "`why` names the edge the brief id came from");
  for (const a of s.args) {
    assert.match(a, ID_SHAPE, "every argument of a paste step is a resolved node id");
    assert.equal(a.includes("/"), false, "a branch name must never appear as an argument");
  }
  assert.equal(deriveStage(gMarketResolved, "patch-win-0123"), "patch-selected");
});

test("a RESOLVED patch market routes the BRIEF to /prepare-evidence, not /implement-brief", () => {
  const briefSteps = nextSteps(gMarketResolved, "brief-pw-0122");
  const s = only(briefSteps);
  assert.equal(s.command, "prepare-evidence");
  assert.equal(s.kind, "paste");
  assert.deepEqual(s.args, ["brief-pw-0122"]);
  assert.match(s.why, /patch market is resolved/);
  assert.match(s.why, /selects/, "`why` names the decision edge that resolved the market");
  assert.equal(
    briefSteps.some((x) => x.command === "implement-brief"),
    false,
    "a brief whose market already has a selects-ed winner must not be told to implement it again",
  );
  // Asking about the BRIEF and about the WINNING PATCH give the same ANSWER: the
  // same command, the same resolved argument, the same rendering, the same kind.
  // `why` is deliberately NOT compared — each side names the edge or field that
  // turned ITS OWN branch on (the brief names the `selects` decision that resolved
  // its market; the patch names the `competes-for` edge its brief id came from), and
  // the `why` contract requires exactly that. Both are asserted below rather than
  // waived, so a silent change to either provenance still reds.
  const patchSteps = nextSteps(gMarketResolved, "patch-win-0123");
  const answer = (steps: Step[]) => steps.map(({ command, args, rendered, kind }) => ({ command, args, rendered, kind }));
  assert.deepEqual(answer(patchSteps), answer(briefSteps));
  assert.match(only(patchSteps).why, /selected patch patch-win-0123 `competes-for` brief brief-pw-0122/);
  assert.match(s.why, /patch market is resolved/);
});

test("A7 a brief at `implemented` routes to /prepare-evidence <brief-id> as a paste", () => {
  const s = only(nextSteps(gImplemented, "brief-impl-0132"));
  assert.equal(s.command, "prepare-evidence");
  assert.equal(s.kind, "paste");
  assert.deepEqual(s.args, ["brief-impl-0132"]);
  assert.equal(s.rendered, "/prepare-evidence brief-impl-0132");
  assert.match(s.why, /implemented/, "`why` names the status field A7 keys on");
  assert.equal(deriveStage(gImplemented, "brief-impl-0132"), "brief-implemented");
});

test("Acceptance 2: an `implemented` test-verification brief routes to /prepare-evidence, never back to /write-tests", () => {
  // The loop `/write-tests`'s single graph write closes. Before the flip existed, this
  // brief sat at `draft` and the resolver reprinted `/write-tests` for the very lane
  // whose tests had just been written. ADMITTED WEAKNESS, per the file header: this leg
  // pins `conveyor.ts`'s `implemented`-before-lane ordering, which the command-file
  // change does not touch, so it is green with that diff reverted. It records the
  // routing the flip DEPENDS on; the command-file legs below are what guard the change.
  const steps = nextSteps(gTestLaneImplemented, "brief-testimpl-0192");
  const s = only(steps);
  assert.equal(s.command, "prepare-evidence");
  assert.equal(s.kind, "paste");
  assert.deepEqual(s.args, ["brief-testimpl-0192"]);
  assert.equal(s.rendered, "/prepare-evidence brief-testimpl-0192");
  assert.match(s.why, /implemented/, "`why` names the status field the flip produces");
  assert.equal(
    steps.some((x) => x.command === "write-tests"),
    false,
    "an already-written verification lane must never be told to write its own tests again",
  );
  assert.equal(deriveStage(gTestLaneImplemented, "brief-testimpl-0192"), "brief-implemented");
  // The `lane: test-verification` value is still on the node — the routing changed
  // because the STATUS changed, not because the lane went away. `gTestLane` above keeps
  // the `draft` half of this pair green and untouched.
  assert.equal(only(nextSteps(gTestLane, "brief-tests-0072")).command, "write-tests");
});

test("amendment 20: a market opened AFTER the flip still prints /prepare-evidence, never /compare-patches", () => {
  // Behaviour 5 reads as a guarantee it does not hold, and amendment 20 corrects it in
  // the clause text: `conveyor.ts`'s `implemented` branch returns UNCONDITIONALLY before
  // the market branches, so `patch_market: true` arriving later cannot reopen the market
  // hops. Pinned cheaply here so the correction is not only prose.
  const steps = nextSteps(gImplementedMarketLate, "brief-late-0202");
  const s = only(steps);
  assert.equal(s.command, "prepare-evidence");
  assert.equal(s.kind, "paste");
  assert.deepEqual(s.args, ["brief-late-0202"]);
  for (const forbidden of ["compare-patches", "synthesize-patches", "select-patch", "propose-patches"]) {
    assert.equal(
      steps.some((x) => x.command === forbidden),
      false,
      `an \`implemented\` brief must not be offered /${forbidden} by a market opened afterwards`,
    );
  }
  assert.equal(deriveStage(gImplementedMarketLate, "brief-late-0202"), "brief-implemented");
  // Anti-vacuity: the same `patch_market: true` field on a DRAFT brief does open the
  // market hops, so this leg is about the status, not about an inert field.
  assert.deepEqual(commands(nextSteps(gMarketOpen, "brief-pm-0102")), ["compare-patches", "synthesize-patches"]);
});

test("amendment 16 RECORDS the early-return consequence: an `implemented` brief loses its /propose-patches offer", () => {
  // THIS LEG RECORDS BEHAVIOUR; IT DOES NOT ENDORSE IT AS DESIRABLE. Because
  // `conveyor.ts:521` returns on `implemented` before `:574` reads the body, a brief
  // carrying `## Strategy tension` silently loses the `/propose-patches` offer once the
  // flip lands. Amendment 16 requires this DOCUMENTED and forbids changing it here:
  // changing it is a second rule-5 event and is not approved. If a later change makes
  // this leg red, the remediation is a decision — not a quiet edit to this assertion.
  const steps = nextSteps(gImplementedTension, "brief-impltension-0212");
  const s = only(steps);
  assert.equal(s.command, "prepare-evidence");
  assert.deepEqual(s.args, ["brief-impltension-0212"]);
  assert.equal(
    steps.some((x) => x.command === "propose-patches"),
    false,
    "recorded consequence: the marker is not read once the brief is `implemented`",
  );
  // The marker IS in the body — the offer is lost to the early return, not to an absent
  // section. Both halves are asserted so the leg cannot pass on a typo'd fixture.
  const brief = gImplementedTension.nodes.find((n) => n.data["id"] === "brief-impltension-0212");
  assert.match(brief?.body ?? "", /^##\s+Strategy tension\s*$/m);
  assert.deepEqual(commands(nextSteps(gTension, "brief-tension-0082")), ["implement-brief", "propose-patches"]);
});

test("evidence precedence: a brief carrying FINAL evidence never reprints /prepare-evidence for itself", () => {
  const stage = deriveStage(gEvidencedWithSibling, "brief-done-0142");
  const steps = nextSteps(gEvidencedWithSibling, "brief-done-0142");
  // STAGE AND STEP AGREE. The pre-fix defect printed `brief-evidenced` beside a
  // /prepare-evidence step for the very brief that had already been evidenced.
  assert.equal(stage, "brief-evidenced");
  assert.equal(
    steps.some((s) => s.command === "prepare-evidence" && s.args.includes("brief-done-0142")),
    false,
    `stage ${stage} must not be printed beside a step that prepares this brief's evidence again`,
  );
  assert.equal(
    steps.some((s) => s.args.includes("brief-done-0142")),
    false,
    "an evidenced brief's own id must not appear in any outstanding step",
  );
  // It routes through its CONTRACT's coverage: the outstanding sibling's own steps.
  assert.deepEqual(steps, nextSteps(gEvidencedWithSibling, "contract-multi-0141"));
  assert.equal(steps[0].command, "write-tests");
  assert.deepEqual(steps[0].args, ["brief-todo-0143"]);
  // Not yet at full coverage, so /integrate is NOT offered (A5).
  assert.equal(
    steps.some((s) => s.command === "integrate"),
    false,
    "/integrate is terminal only at final coverage",
  );
  // Its final evidence resolves to the same outstanding work (2.9).
  assert.deepEqual(nextSteps(gEvidencedWithSibling, "evidence-done-0144"), steps);
});

test("A5 /prepare-evidence is terminal only for a LONE live brief: single-brief contracts skip integration", () => {
  const s = only(nextSteps(gLoneEvidenced, "brief-lone-0152"));
  assert.equal(s.kind, "action");
  assert.equal(s.command, "pr");
  assert.deepEqual(s.args, []);
  assert.match(s.why, /single-brief contract/);
  assert.match(s.why, /no integration node/);
  // `/integrate` is never offered here. The `s.command === "integrate"` disjunct this
  // check used to carry is GONE ON PURPOSE, not dropped: `assert.equal(s.command,
  // "pr")` above narrows `s.command` to the literal type `"pr"`, so TypeScript PROVES
  // that disjunct impossible (`tsc --noEmit` reds it as TS2367) — a compile-time
  // guarantee strictly stronger than the runtime `===` it replaces, and one that reds
  // the moment the narrowing above stops holding. What the type system cannot prove is
  // the RENDERED line, so that half stays a runtime assertion.
  assert.equal(
    s.rendered.includes("/integrate"),
    false,
    "a single-brief contract must never be routed to /integrate",
  );
  // The same terminal answer from the contract and from the evidence.
  assert.deepEqual(nextSteps(gLoneEvidenced, "contract-lone-0151"), [s]);
  assert.deepEqual(nextSteps(gLoneEvidenced, "evidence-lone-0153"), [s]);
  assert.equal(deriveStage(gLoneEvidenced, "brief-lone-0152"), "brief-evidenced");
});

test("A5 the LAST lane of a multi-lane contract routes to /integrate <contract-id>", () => {
  const s = only(nextSteps(gLastLane, "evidence-b-0165"));
  assert.equal(s.command, "integrate");
  assert.equal(s.kind, "paste");
  assert.deepEqual(s.args, ["contract-last-0161"], "the argument is the CONTRACT id, resolved from the brief");
  assert.equal(s.rendered, "/integrate contract-last-0161");
  assert.match(s.why, /2 live lanes carry final evidence/);
  // Same answer asked of the contract and of either evidenced brief.
  assert.deepEqual(nextSteps(gLastLane, "contract-last-0161"), [s]);
  assert.deepEqual(nextSteps(gLastLane, "brief-a-0162"), [s]);
  assert.deepEqual(nextSteps(gLastLane, "brief-b-0163"), [s]);
});

test("A5 /integrate is terminal only at final coverage: a covering final integration ends in the PR action", () => {
  const s = only(nextSteps(gFullCoverage, "contract-full-0171"));
  assert.equal(s.kind, "action");
  assert.equal(s.command, "pr");
  assert.match(s.why, /final integration integration-full-0176 covers all 2 live lanes/);
  assert.equal(
    nextSteps(gFullCoverage, "contract-full-0171").some((x) => x.command === "integrate"),
    false,
    "/integrate must not be reprinted once a final integration covers every live lane",
  );
  const ints = only(nextSteps(gFullCoverage, "integration-full-0176"));
  assert.equal(ints.kind, "action");
  assert.equal(ints.command, "pr");
  assert.equal(deriveStage(gFullCoverage, "integration-full-0176"), "integration-final");
});

// ---------------------------------------------------------------------------
// Cross-cutting legs: kind discrimination, `why`, determinism, never-empty.
// ---------------------------------------------------------------------------

test("the `kind` discrimination holds over every corpus node", () => {
  let paste = 0;
  let template = 0;
  let action = 0;
  for (const { name, spec: s } of CORPUS) {
    for (const id of idsOf(s)) {
      for (const step of nextSteps(s, id)) {
        const where = `${name}/${id}: ${step.kind} ${step.rendered}`;
        if (step.kind === "paste") {
          paste++;
          // paste = EVERY argument is a resolved id, safe to run as printed.
          for (const a of step.args) assert.match(a, ID_SHAPE, where);
          assert.equal(step.rendered, `/${step.command} ${step.args.join(" ")}`, where);
        } else if (step.kind === "template") {
          template++;
          // template = at least one argument no graph state can fill…
          assert.ok(step.args.some((a) => PLACEHOLDER.test(a)), `${where} — no placeholder argument`);
          // …and every argument that is NOT a placeholder is a resolved id.
          for (const a of step.args) {
            if (!PLACEHOLDER.test(a)) assert.match(a, ID_SHAPE, where);
          }
          assert.equal(step.rendered, `/${step.command} ${step.args.join(" ")}`, where);
        } else {
          action++;
          // action = a PR action or a judgement reminder, never a command line.
          assert.equal(step.kind, "action", where);
          assert.deepEqual(step.args, [], where);
          assert.equal(step.rendered.startsWith("/"), false, `${where} — an action must not look runnable`);
        }
      }
    }
  }
  // Anti-vacuity: all three kinds are actually exercised by the corpus.
  assert.ok(paste > 0 && template > 0 && action > 0, `kinds seen: paste=${paste} template=${template} action=${action}`);
});

test("every step's `why` is a non-empty explanation naming the edge or field", () => {
  // The routing vocabulary: an edge type, a frontmatter field (or its rendered
  // marker), or a status VALUE the branch keyed on. Every `why` in the corpus must
  // name at least one of these, so a step can never route "because". A `why` naming
  // none of them is either a new routing trigger that belongs on this list or a
  // reason that does not name what turned the branch on.
  const REASONS = [
    // edge types
    "proposes",
    "selects",
    "compares",
    "comparison",
    "competes-for",
    "decomposes",
    "evidences",
    "integrat",
    // fields and body markers
    "class",
    "status",
    "lane",
    "patch market",
    "Strategy tension",
    "id ",
    "type",
    // status values
    "open",
    "proposed",
    "approved",
    "rejected",
    "candidate",
    "selected",
    "superseded",
    "implemented",
    "draft",
    "final",
  ];
  for (const { name, spec: s } of CORPUS) {
    for (const id of idsOf(s)) {
      for (const step of nextSteps(s, id)) {
        assert.ok(step.why.trim().length > 0, `${name}/${id}: empty why on ${step.rendered}`);
        assert.ok(
          REASONS.some((r) => step.why.includes(r)),
          `${name}/${id}: why names no edge or field: ${JSON.stringify(step.why)}`,
        );
      }
    }
  }
});

test("nextSteps is deterministic across two calls on one LoadedSpec", () => {
  for (const { name, spec: s } of CORPUS) {
    for (const id of [...idsOf(s), "intent-absent-ffff"]) {
      const first = nextSteps(s, id);
      const second = nextSteps(s, id);
      assert.deepEqual(second, first, `${name}/${id} is not deterministic`);
      assert.equal(deriveStage(s, id), deriveStage(s, id));
    }
  }
});

test("nextSteps is NEVER empty — including for a node id that resolves to nothing", () => {
  for (const { name, spec: s } of CORPUS) {
    for (const id of idsOf(s)) {
      assert.ok(nextSteps(s, id).length > 0, `${name}/${id} returned []`);
    }
  }
  // The Risk-1 floor: an unresolvable id yields the explicit "no derivable next
  // step, and why" entry, never `[]` and never a wrong step.
  for (const s of [gFresh, gMalformed]) {
    const step = only(nextSteps(s, "intent-nowhere-ffff"));
    assert.equal(step.kind, "action");
    assert.equal(step.command, "none");
    assert.match(step.rendered, /^no derivable next step — /);
    assert.match(step.why, /intent-nowhere-ffff/);
  }
  assert.equal(deriveStage(gFresh, "intent-nowhere-ffff"), "unknown");
  // A malformed graph still routes: unknown type, absent status, out-of-range class,
  // an un-renderable id and a dangling edge each yield a step, never a throw.
  for (const id of idsOf(gMalformed)) {
    assert.ok(nextSteps(gMalformed, id).length > 0, `${id} returned []`);
  }
  // CC-6: an id that does not match the convention is REFUSED, not printed.
  const refused = only(nextSteps(gMalformed, "intent-badid"));
  assert.equal(refused.command, "none");
  assert.match(refused.rendered, /does not match the id convention/);
});

// ---------------------------------------------------------------------------
// A6 — every chain command still invokes the resolver, and A1's fallback CANNOT
// satisfy the pin. The literals below are the A1/A6 distinguishability contract,
// byte-identical in `brief-conveyor-commands-c14d`; neither lane may vary them
// unilaterally.
// ---------------------------------------------------------------------------

/** Clause 1 — the resolver-invocation token. */
const RESOLVER_TOKEN = "pnpm spec:status";
/** Clause 2 — a fallback region opens with a line that is EXACTLY this. */
const FALLBACK_OPEN = "FALLBACK (RESOLVER UNAVAILABLE):";
/** Clause 3 — a region ends at the next line matching this ALL-CAPS label idiom,
 * or at EOF. */
const LABEL_LINE = /^[A-Z][A-Z0-9 /()-]*:$/;
/** Clause 4's bare form: neither `spec:status` nor `pnpm spec:status` may appear
 * inside a fallback region. */
const BARE_TOKEN = "spec:status";
/** CC-6's node-id shape, as A6.4 spells it (unanchored, word-bounded). */
const FALLBACK_ID_SHAPE = /\b[a-z]+-[a-z0-9-]*-[0-9a-f]{4}\b/;

const commandsDir = path.join(repoRoot, ".claude", "commands");
/** A6.1 — the scanned set is `.claude/commands/*.md` minus these two. */
const NON_CHAIN = ["detect-drift.md", "update-spec-graph.md"];

function chainCommandFiles(): string[] {
  return fs
    .readdirSync(commandsDir)
    .filter((f) => f.endsWith(".md"))
    .filter((f) => !NON_CHAIN.includes(f))
    .sort();
}

/** The half-open [open, close) line ranges of every fallback region. */
function fallbackRanges(text: string): { start: number; end: number }[] {
  const lines = text.split("\n");
  const ranges: { start: number; end: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] !== FALLBACK_OPEN) continue;
    let j = i + 1;
    while (j < lines.length && !LABEL_LINE.test(lines[j])) j++;
    ranges.push({ start: i, end: j });
    i = j - 1;
  }
  return ranges;
}

function fallbackRegions(text: string): string[] {
  const lines = text.split("\n");
  return fallbackRanges(text).map((r) => lines.slice(r.start, r.end).join("\n"));
}

/** The file text with every fallback region removed — the region A6.2 scans. */
function exciseFallbacks(text: string): string {
  const lines = text.split("\n");
  const drop = new Set<number>();
  for (const r of fallbackRanges(text)) for (let i = r.start; i < r.end; i++) drop.add(i);
  return lines.filter((_, i) => !drop.has(i)).join("\n");
}

test("A6.1 the scanned set is exactly the fourteen chain command files, and each exists", () => {
  const files = chainCommandFiles();
  assert.equal(files.length, 14, `expected fourteen chain commands, got ${files.length}: ${files.join(", ")}`);
  for (const f of files) assert.ok(fs.existsSync(path.join(commandsDir, f)), `${f} does not exist`);
  // A newly added command must be CLASSIFIED, never silently skipped: the two
  // non-chain files are named, so `*.md` minus them is the whole directory.
  const all = fs.readdirSync(commandsDir).filter((f) => f.endsWith(".md"));
  assert.equal(all.length, files.length + NON_CHAIN.length, `unclassified command file in ${commandsDir}`);
  for (const f of NON_CHAIN) assert.ok(all.includes(f), `${f} is excluded from the pin but does not exist`);
});

for (const file of chainCommandFiles()) {
  test(`A6.2/A6.3/A6.4/A6.5 ${file} invokes the resolver OUTSIDE its fallback`, () => {
    const text = fs.readFileSync(path.join(commandsDir, file), "utf8");

    // A6.2 — with the fallback excised, the resolver invocation survives AT LEAST
    // ONCE. This is the leg that reds a print-less command AND a command whose only
    // resolver mention is inside its fallback.
    assert.ok(
      exciseFallbacks(text).includes(RESOLVER_TOKEN),
      `${file}: no \`${RESOLVER_TOKEN}\` outside the fallback region`,
    );

    const regions = fallbackRegions(text);
    for (const region of regions) {
      // A6.5 — the opening line is the exact agreed delimiter, so "marked as the
      // resolver-unavailable path" is a literal, not a judgement.
      assert.equal(region.split("\n")[0], FALLBACK_OPEN, `${file}: fallback opener is not the agreed delimiter`);
      // A6.3 — the fallback is resolver-free (bare form, so `pnpm`-prefixed too).
      assert.equal(
        region.includes(BARE_TOKEN),
        false,
        `${file}: the resolver-unavailable region names the resolver:\n${region}`,
      );
      // A6.4 — the fallback is template-shaped: every argument in `<...>` form and
      // no resolved node id anywhere on a `/`-command line.
      for (const line of region.split("\n")) {
        const m = line.match(/^\s*(\/[a-z][a-z-]*)\s*(.*)$/);
        if (m === null) continue;
        assert.doesNotMatch(line, FALLBACK_ID_SHAPE, `${file}: fallback line carries a resolved id: ${line}`);
        const args = m[2].trim();
        if (args === "") continue;
        for (const arg of args.split(/\s+/)) {
          assert.match(arg, /<[^>]+>/, `${file}: fallback argument is not a placeholder: ${line}`);
        }
      }
    }
  });
}

test("A6 NEGATIVE LEG: excising the resolver clause while leaving the fallback intact still REDS", () => {
  // The pin must not be satisfiable by fallback prose. For every chain file: delete
  // the resolver clause from the non-fallback text and assert the A6.2 predicate
  // fails; then re-add the very same token INSIDE the intact fallback region and
  // assert it STILL fails (and that A6.3 now fires too). Both mutations are in
  // memory — no command file is written by this lane.
  const files = chainCommandFiles();
  assert.ok(files.length > 0);
  for (const file of files) {
    const text = fs.readFileSync(path.join(commandsDir, file), "utf8");
    assert.ok(exciseFallbacks(text).includes(RESOLVER_TOKEN), `${file}: precondition — the pin passes today`);

    // (a) print-less command: the clause is gone, the fallback is untouched.
    const lines = text.split("\n");
    const inFallback = new Set<number>();
    for (const r of fallbackRanges(text)) for (let i = r.start; i < r.end; i++) inFallback.add(i);
    const stripped = lines
      .map((l, i) => (inFallback.has(i) ? l : l.split(RESOLVER_TOKEN).join("pnpm spec:validate")))
      .join("\n");
    assert.equal(
      exciseFallbacks(stripped).includes(RESOLVER_TOKEN),
      false,
      `${file}: A6.2 stayed green with the resolver clause excised — the pin is vacuous`,
    );
    assert.deepEqual(
      fallbackRegions(stripped),
      fallbackRegions(text),
      `${file}: the negative mutation must leave the fallback region byte-identical`,
    );

    // (b) fallback prose cannot rescue it: put the token inside the fallback.
    const openIdx = stripped.split("\n").indexOf(FALLBACK_OPEN);
    assert.ok(openIdx >= 0, `${file}: no fallback region to inject into`);
    const injectedLines = stripped.split("\n");
    injectedLines.splice(openIdx + 1, 0, `  Run \`${RESOLVER_TOKEN} <node-id>\` and reproduce its NEXT block.`);
    const injected = injectedLines.join("\n");
    assert.equal(
      exciseFallbacks(injected).includes(RESOLVER_TOKEN),
      false,
      `${file}: A6.2 was satisfied by fallback prose — exactly what A1 says must not satisfy it`,
    );
    assert.ok(
      fallbackRegions(injected).some((r) => r.includes(BARE_TOKEN)),
      `${file}: A6.3 failed to notice a resolver mention inside the fallback`,
    );
  }
});

// ---------------------------------------------------------------------------
// Acceptance 3 / amendments 1, 4, 11 and 17 — the single-graph-write CLAUSE pins.
// The literals below are the clause literal contract of `brief-write-tests-flip-4e19`
// (`## Pinned decisions`), byte-identical to what the command file must carry; the
// command file and this file are ONE negotiated pair and neither may vary them
// unilaterally. They are scanned with the SAME `exciseFallbacks` the A6 legs use, so a
// clause that lives only in a resolver-unavailable fallback cannot satisfy any of them.
// ---------------------------------------------------------------------------

/** Literal 1 — the clause's label token. */
const FLIP_CLAUSE_TOKEN = "EXACTLY ONE GRAPH WRITE:";
/** Literal 6's second term — the print label the clause must precede. */
const NEXT_BLOCK_TOKEN = "NEXT BLOCK:";
/** Amendment 4 / amendment 14 — the CLOSED clause set, sorted as `chainCommandFiles()`
 * returns it. Two members, and the count is the clause set's, not the set of commands
 * that may write `implemented` (which is three). See the file header. */
const FLIP_CLAUSE_FILES = ["implement-brief.md", "write-tests.md"];

/** Literals 1-5 of `write-tests.md`'s clause literal contract, each asserted as an exact
 * substring of the NON-fallback text. Literal 4's two labels are distinct strings and
 * neither is a substring of the other; that is proved explicitly in the leg below rather
 * than assumed by listing them here. */
const WRITE_TESTS_LITERALS = [
  // 1 — the flip clause itself.
  FLIP_CLAUSE_TOKEN,
  // 2 — the echo clause and the exact phrase amendment 9 requires inside it: the
  // OBSERVED runner exit status, never the agent's narration of it.
  "ECHO BEFORE MUTATING:",
  "the test runner's own exit status",
  // 3 — the mutating step's closing validate, the graph-write idiom rule 6 requires.
  "The mutating step ends with `pnpm spec:index && pnpm spec:validate`",
  // 4 — both red labels: the failed GRAPH WRITE and the red VERIFICATION SUITE.
  "ON RED:",
  "ON RED SUITE:",
  // 5 — amendment 13's re-entrancy clause, mirroring `prepare-evidence.md:24-28`.
  "IDEMPOTENT / RE-ENTRANT:",
];

const WRITE_TESTS_FILE = "write-tests.md";

function readCommand(file: string): string {
  return fs.readFileSync(path.join(commandsDir, file), "utf8");
}

/** The presence predicate the negative leg drives red: which pinned literals are ABSENT
 * from a candidate text's non-fallback region. Green is `[]`. */
function missingLiterals(text: string): string[] {
  const nonFallback = exciseFallbacks(text);
  return WRITE_TESTS_LITERALS.filter((lit) => !nonFallback.includes(lit));
}

/** Amendment 4's predicate, parameterised by a reader so the negative leg can run it
 * over a mutated `write-tests.md` without writing a byte to disk. */
function flipClauseFiles(read: (file: string) => string = readCommand): string[] {
  return chainCommandFiles().filter((f) => exciseFallbacks(read(f)).includes(FLIP_CLAUSE_TOKEN));
}

/** Literal 6's ordering term: the index of the first line CONTAINING a token, over the
 * whole file (both tokens sit outside the fallback, which the presence leg pins). */
function firstLineIndex(text: string, token: string): number {
  return text.split("\n").findIndex((l) => l.includes(token));
}

/** A label line as these command files actually write it: ALL-CAPS token, colon, then
 * the clause's prose on the SAME line. Deliberately NOT `LABEL_LINE` (which is anchored
 * at `$` and matches only a bare delimiter such as `FALLBACK (RESOLVER UNAVAILABLE):`);
 * this one bounds a clause paragraph. */
const LABEL_PREFIX = /^[A-Z][A-Z0-9 /()-]*:/;

/** The half-open [start, end) line range of the flip-clause BLOCK: its label line
 * through to the next label line (or EOF). The negative leg deletes and relocates this
 * whole block, not just the token, so a mutation cannot be "survived" by leftover prose. */
function flipClauseBlock(lines: string[]): { start: number; end: number } {
  const start = lines.findIndex((l) => l.includes(FLIP_CLAUSE_TOKEN));
  assert.ok(start >= 0, "there is no flip-clause block to excise");
  let end = start + 1;
  while (end < lines.length && !LABEL_PREFIX.test(lines[end])) end++;
  return { start, end };
}

test("Acceptance 3: write-tests.md carries every literal of the clause contract, OUTSIDE its fallback", () => {
  const text = readCommand(WRITE_TESTS_FILE);
  // Literals 1-5.
  assert.deepEqual(missingLiterals(text), [], `${WRITE_TESTS_FILE}: pinned clause literals missing outside the fallback`);

  // Literal 4's DISTINGUISHABILITY, which is the half a bare presence check cannot give:
  // `ON RED:` (a failed graph write) and `ON RED SUITE:` (a red verification suite) are
  // two labels with two different remediations, and neither search may be satisfied by
  // the other's text.
  assert.equal("ON RED SUITE:".includes("ON RED:"), false, "the two red labels must be distinguishable as strings");
  assert.equal("ON RED:".includes("ON RED SUITE:"), false);
  const nonFallback = exciseFallbacks(text);
  assert.ok(
    nonFallback.split("ON RED SUITE:").join("").includes("ON RED:"),
    "`ON RED:` must exist independently of `ON RED SUITE:`, not merely as a prefix of it",
  );
  const redSuiteLines = nonFallback.split("\n").filter((l) => l.includes("ON RED SUITE:"));
  const redWriteLines = nonFallback.split("\n").filter((l) => l.includes("ON RED:"));
  assert.equal(redSuiteLines.length, 1, "exactly one red-SUITE clause");
  assert.equal(redWriteLines.length, 1, "exactly one failed-graph-write clause");
  assert.notDeepEqual(redSuiteLines, redWriteLines, "the two red clauses must be two distinct lines");
  // Amendment 12's named remediation lives in the red-SUITE clause, so the label is not
  // a bare word: no flip, and a `drift-finding` routed under rule 5.
  const suiteClause = nonFallback.slice(nonFallback.indexOf("ON RED SUITE:"));
  assert.match(suiteClause.split("IDEMPOTENT")[0], /drift-finding/);
  assert.match(suiteClause.split("IDEMPOTENT")[0], /rule 5/);

  // Literal 6 — RELATIVE ORDER, not mere presence (amendment 17). Placing the clause
  // where `KNOWN GAP` sat would instruct the command to print its NEXT block BEFORE it
  // flips, and the pre-flip block is `/write-tests <brief-id>` — reproducing the exact
  // bug with the clause present. Mutation precedes print, as in `implement-brief.md`.
  const flipAt = firstLineIndex(text, FLIP_CLAUSE_TOKEN);
  const nextBlockAt = firstLineIndex(text, NEXT_BLOCK_TOKEN);
  assert.ok(flipAt >= 0 && nextBlockAt >= 0, "both tokens must be present to compare their order");
  assert.ok(
    flipAt < nextBlockAt,
    `${WRITE_TESTS_FILE}: the flip clause is at line ${flipAt + 1} and NEXT BLOCK: at line ${nextBlockAt + 1} — ` +
      "the mutation must precede the print, or the command prints the pre-flip next step",
  );

  // Literal 7 — the HONEST negative (amendment 11). Only `by hand` is grepped: `:27`
  // and `:33` legitimately name `/prepare-evidence`, so a command-name absence leg would
  // be unsatisfiable and is deliberately not written.
  assert.equal(
    nonFallback.includes("by hand"),
    false,
    "the clause must route the write through graph-maintainer; `by hand` has no place in it",
  );

  // Literal 8's spirit, cheaply: the precondition block and the fallback still say what
  // the brief's Out-of-scope 1 promises they say, so "unchanged byte-for-byte" is not
  // left entirely to review.
  assert.ok(text.includes("REFUSAL REPORT"), "the refusal report must survive the clause insertion");
  assert.ok(exciseFallbacks(text).includes("performs no graph writes"), "the AGENT still performs no graph writes");
  assert.ok(fallbackRegions(text).some((r) => r.includes("/prepare-evidence <brief-id>")), "the fallback is unchanged");
});

test("amendment 4: exactly two chain commands carry the single-graph-write clause", () => {
  // Nothing pinned this before, repo-wide: the only live hit was `implement-brief.md:18`
  // and every other match was spec-graph prose. So this leg RETROACTIVELY protects A7's
  // clause as well as this change, and it is a SET EQUALITY — a third command acquiring
  // the clause reds it just as loudly as either member losing it. A third member is a
  // separate decision (amendment 14 / the brief's Non-scope), never a quiet edit here.
  assert.deepEqual(flipClauseFiles(), FLIP_CLAUSE_FILES);
  // Both members are real files inside the scanned set, so the equality cannot hold
  // vacuously over a set that stopped being scanned.
  for (const f of FLIP_CLAUSE_FILES) {
    assert.ok(chainCommandFiles().includes(f), `${f} is pinned but is not a scanned chain command`);
    assert.ok(fs.existsSync(path.join(commandsDir, f)), `${f} does not exist`);
  }
});

test("CLAUSE NEGATIVE LEG (amendment 1): deleting, MOVING or hiding the clause each reds a named pin", () => {
  // Both-ways falsifiability, in the `A6 NEGATIVE LEG` idiom above: every mutation is in
  // memory and NO command file is written by this lane. Each mutation names the pin it
  // must red, so none of the three legs above can be vacuous.
  const text = readCommand(WRITE_TESTS_FILE);
  const lines = text.split("\n");
  assert.deepEqual(missingLiterals(text), [], "precondition — the presence pin passes today");
  assert.deepEqual(flipClauseFiles(), FLIP_CLAUSE_FILES, "precondition — the set-equality pin passes today");

  const { start, end } = flipClauseBlock(lines);
  assert.ok(end > start + 1, "the clause block must be more than its label line");
  const blockLines = lines.slice(start, end);
  assert.ok(blockLines.join("\n").includes("graph-maintainer"), "the excised block is the clause, not a stray line");
  const strippedLines = [...lines.slice(0, start), ...lines.slice(end)];
  const stripped = strippedLines.join("\n");
  const readStripped = (f: string): string => (f === WRITE_TESTS_FILE ? stripped : readCommand(f));

  // (a) THE CLAUSE IS DELETED — the command reverts to instructing no graph write.
  assert.deepEqual(
    missingLiterals(stripped),
    [FLIP_CLAUSE_TOKEN],
    "the presence pin stayed green with the clause block deleted — it is vacuous",
  );
  assert.deepEqual(
    flipClauseFiles(readStripped),
    ["implement-brief.md"],
    "the set-equality pin stayed green with write-tests.md's clause deleted — it is vacuous",
  );
  // The mutation is surgical: the fallback region is byte-identical, so what reds above
  // is the missing clause and not a mangled file.
  assert.deepEqual(
    fallbackRegions(stripped),
    fallbackRegions(text),
    "the negative mutation must leave the fallback region byte-identical",
  );
  // And the A6 pin is untouched by it, so these two pins stay independent.
  assert.ok(exciseFallbacks(stripped).includes(RESOLVER_TOKEN), "A6's resolver pin must be unaffected");

  // (b) THE CLAUSE IS PRESENT BUT LATE — amendment 17's failure mode, and the one a
  // presence-only pin would wave through: the command prints its NEXT block from the
  // PRE-flip status and reproduces the original bug with the clause in the file.
  const nbAt = strippedLines.findIndex((l) => l.includes(NEXT_BLOCK_TOKEN));
  assert.ok(nbAt >= 0, "no NEXT BLOCK: line to move the clause below");
  const moved = [...strippedLines.slice(0, nbAt + 1), ...blockLines, ...strippedLines.slice(nbAt + 1)].join("\n");
  // MUST-FIRE control: presence and set-equality are GREEN on this mutation, so the
  // ordering leg is the only thing that can catch it.
  assert.deepEqual(missingLiterals(moved), [], "the moved clause is still present — order is what must red");
  assert.deepEqual(flipClauseFiles((f) => (f === WRITE_TESTS_FILE ? moved : readCommand(f))), FLIP_CLAUSE_FILES);
  assert.ok(
    firstLineIndex(moved, FLIP_CLAUSE_TOKEN) > firstLineIndex(moved, NEXT_BLOCK_TOKEN),
    "the ordering pin stayed green with the clause moved below NEXT BLOCK: — it is vacuous",
  );

  // (c) THE CLAUSE IS HIDDEN IN THE FALLBACK — A1's rule applied to this pin: the
  // resolver-unavailable region is a degraded print, never a routing or mutation source,
  // so a clause that lives only there does not instruct anything.
  const injectedLines = [...strippedLines];
  const openIdx = injectedLines.indexOf(FALLBACK_OPEN);
  assert.ok(openIdx >= 0, "no fallback region to inject into");
  injectedLines.splice(openIdx + 1, 0, ...blockLines);
  const injected = injectedLines.join("\n");
  assert.deepEqual(
    missingLiterals(injected),
    [FLIP_CLAUSE_TOKEN],
    "the presence pin was satisfied by fallback prose — exactly what A1 says must not satisfy it",
  );
  assert.deepEqual(
    flipClauseFiles((f) => (f === WRITE_TESTS_FILE ? injected : readCommand(f))),
    ["implement-brief.md"],
    "the set-equality pin was satisfied by fallback prose",
  );
  // Anti-vacuity for (c): the clause really did land inside the region, so the pin reds
  // because the region is EXCISED and not because the injection missed.
  assert.ok(
    fallbackRegions(injected).some((r) => r.includes(FLIP_CLAUSE_TOKEN)),
    "the injected clause did not land inside the fallback region",
  );
});

// ---------------------------------------------------------------------------
// A12 — the CONVEYOR_CLASS_ROUTING pin. SETTLED TO PIN by
// `brief-conveyor-resolver-3f7a`'s `## Pinned decisions` ("A12 — DECIDED: PIN the
// literal; do NOT read CLAUDE.md as data"). The read-as-data alternative is not
// live work for this lane and is deliberately not written.
// ---------------------------------------------------------------------------

/** The DECLARED normalization, identical in spirit to union leg 6's
 * `normalizeOwns`: trim, collapse every whitespace run (newlines included) to a
 * single U+0020, apply Unicode NFC. "Byte-equal" below means byte-equal AFTER this,
 * and NOTHING else is forgiven — no punctuation stripping, no case folding — so the
 * reader can see exactly what the pin tolerates. */
function normalizeCell(s: string): string {
  return s.trim().replace(/\s+/g, " ").normalize("NFC");
}

/** The `## Work-class routing` table rows from CLAUDE.md.
 *
 * Shape notes, both load-bearing:
 *  - `lane_integration_meta.test.ts:17-20` does NOT apply: it extracts a fenced yaml
 *    block, and this is a markdown table.
 *  - `lane_catalog_drift.test.ts:39`'s backticked-first-cell regex does NOT apply
 *    either: this table's first cell is a bare digit (`| 0 |`), so that regex matches
 *    ZERO rows. What is reused is `:28-33`'s section slice, retargeted — then
 *    narrowed to the contiguous run of `|` lines starting at the header row, because
 *    the `\n## ` bound leaves `### Critic routing` and `### Proposal comparison`
 *    inside the slice.
 */
function workClassTableRows(): string[][] {
  const claudeMd = fs.readFileSync(path.join(repoRoot, "CLAUDE.md"), "utf8");
  const heading = "## Work-class routing";
  const sectionStart = claudeMd.indexOf(heading);
  assert.ok(sectionStart >= 0, "CLAUDE.md must carry the 'Work-class routing' section");
  const afterStart = claudeMd.slice(sectionStart + heading.length);
  const nextHeading = afterStart.indexOf("\n## ");
  const section = nextHeading >= 0 ? afterStart.slice(0, nextHeading) : afterStart;

  const lines = section.split("\n");
  const first = lines.findIndex((l) => l.startsWith("|"));
  assert.ok(first >= 0, "the work-class section must carry a markdown table");
  const table: string[][] = [];
  for (let i = first; i < lines.length && lines[i].startsWith("|"); i++) {
    table.push(lines[i].split("|").slice(1, -1).map((c) => c.trim()));
  }
  return table;
}

test("A12 CONVEYOR_CLASS_ROUTING's six cells per class row are byte-equal to CLAUDE.md's table", () => {
  const table = workClassTableRows();
  // Header + separator + four class rows.
  assert.equal(table.length, 6, `expected 6 table lines (header, separator, four classes), got ${table.length}`);
  // The column ORDER is pinned too: a reordered table would otherwise compare cells
  // to the wrong fields.
  assert.deepEqual(table[0], ["Class", "Change", "Proposal market", "Critics", "Lanes", "Patch market", "Human gates"]);
  const classRows = table.slice(2);
  assert.equal(classRows.length, 4);
  assert.deepEqual(
    Object.keys(CONVEYOR_CLASS_ROUTING),
    ["0", "1", "2", "3"],
    "the pinned literal must carry exactly the four classes",
  );

  for (const cells of classRows) {
    assert.equal(cells.length, 7, `a class row must have 7 cells: ${cells.join(" | ")}`);
    const cls = Number(cells[0]);
    assert.ok(cls === 0 || cls === 1 || cls === 2 || cls === 3, `unexpected class cell ${cells[0]}`);
    const pinned = CONVEYOR_CLASS_ROUTING[cls as 0 | 1 | 2 | 3];
    const expected: [keyof typeof pinned, string][] = [
      ["change", cells[1]],
      ["proposalMarket", cells[2]],
      ["critics", cells[3]],
      ["lanes", cells[4]],
      ["patchMarket", cells[5]],
      ["humanGates", cells[6]],
    ];
    for (const [field, docCell] of expected) {
      assert.equal(
        normalizeCell(pinned[field]),
        normalizeCell(docCell),
        `class ${cls} cell \`${field}\` drifted from CLAUDE.md`,
      );
    }
  }
});

test("A12's predicate oracle: marketRequired for 2 and 3 only, lanesRequired for 3 only", () => {
  assert.deepEqual(
    [0, 1, 2, 3].map((c) => marketRequired(c)),
    [false, false, true, true],
  );
  assert.deepEqual(
    [0, 1, 2, 3].map((c) => lanesRequired(c)),
    [false, false, false, true],
  );
  // Total over a class the range rule owns, and over an absent class.
  for (const bad of [-1, 4, 99, 1.5]) {
    assert.equal(marketRequired(bad), false, `marketRequired(${bad})`);
    assert.equal(lanesRequired(bad), false, `lanesRequired(${bad})`);
  }
  assert.equal(marketRequired(undefined), false);
  assert.equal(lanesRequired(undefined), false);
});

// ---------------------------------------------------------------------------
// CC-8 (this lane's half) — the view legs. `spec-index.yml` diffs
// `specs/indexes/` on EVERY pull request, so one clock byte in a view freezes CI.
// ---------------------------------------------------------------------------

const transcriptFixture = path.join(fixtures, "conveyor-transcript");
const transcriptSpec = loadSpec(path.join(transcriptFixture, "specs"));

test("CC-8 serializeTrails/serializeStatus are byte-identical across two calls on one spec", () => {
  for (const [name, s] of [
    ["conveyor-transcript", transcriptSpec] as const,
    ["last-lane", gLastLane] as const,
    ["market-resolved", gMarketResolved] as const,
  ]) {
    assert.equal(serializeTrails(s), serializeTrails(s), `${name}: trails.md is not deterministic`);
    assert.equal(serializeStatus(s), serializeStatus(s), `${name}: status.md is not deterministic`);
  }
  // Anti-vacuity: the views actually rendered content for the recorded graph.
  assert.ok(serializeTrails(transcriptSpec).includes("intent-fresh-0a01"));
  assert.ok(serializeStatus(transcriptSpec).includes("intent-fresh-0a01"));
});

/**
 * The spec set legs 2 and 3 run over. `rendersRows` records which of them actually
 * renders intent sections and table rows, so the anti-vacuity assertions can be strict
 * where content exists without falsely demanding rows from a fixture that has no live
 * intent (`good-patch-market` renders `_no live intents_` today, by design).
 *
 * The live tree is first on purpose: `specs/indexes/` is the directory
 * `.github/workflows/spec-index.yml:21` runs `git diff --exit-code` over on EVERY pull
 * request, so it is the tree a clock byte or a dated cell would actually freeze.
 */
const VIEW_SPECS: { name: string; spec: LoadedSpec; rendersRows: boolean }[] = [
  { name: "live specs/", spec: loadSpec(path.join(repoRoot, "specs")), rendersRows: true },
  { name: "conveyor-transcript", spec: transcriptSpec, rendersRows: true },
  { name: "fixtures/good", spec: loadSpec(path.join(fixtures, "good", "specs")), rendersRows: true },
  {
    name: "fixtures/good-patch-market",
    spec: loadSpec(path.join(fixtures, "good-patch-market", "specs")),
    rendersRows: false,
  },
];

test("CC-8 leg 2 time-invariance: both views are byte-equal under two far-apart fake clocks", (t) => {
  // Leg 1 (byte-identity across two calls) is NOT time-invariance, and this leg exists
  // because the release panel's finding is exactly that: two calls a millisecond apart
  // agree even if the serializer stamps `new Date()`. These two clocks are fifteen years
  // apart, so a stamped view cannot agree with itself across them.
  //
  // `t.mock.timers` is a NEW technique in this repo — nothing else under `tests/` uses it.
  // CI runs Node 22 (`.github/workflows/ci.yml:16`), which supports it. Only the `Date`
  // api is faked: timers are left real so the test runner's own scheduling is untouched.
  const EPOCH_2020 = Date.UTC(2020, 0, 2, 3, 4, 5, 678);
  const EPOCH_2035 = Date.UTC(2035, 10, 17, 22, 33, 44, 987);
  assert.ok(EPOCH_2035 - EPOCH_2020 > 5000 * 24 * 3600 * 1000, "the two clocks must be genuinely far apart");

  // Every spec is loaded at module scope, i.e. BEFORE any clock is faked, so this
  // measures the SERIALIZERS under a clock and never the loader's parse of a fake date.
  function viewsUnderClock(now: number): Map<string, string> {
    t.mock.timers.enable({ apis: ["Date"], now });
    try {
      // The fake clock is really installed. Without this the leg could compare two runs
      // under the same real clock and pass while asserting nothing.
      assert.equal(new Date().getTime(), now, "mock.timers did not install the fake Date");
      assert.equal(Date.now(), now, "mock.timers did not install the fake Date.now");
      const out = new Map<string, string>();
      for (const { name, spec: s } of VIEW_SPECS) {
        out.set(`${name}:trails.md`, serializeTrails(s));
        out.set(`${name}:status.md`, serializeStatus(s));
        // `serializeIndexes` carries the remaining four index files and reaches
        // `tools/yaml.ts` through `toYaml` — the module the static clock-freedom leg
        // below does not scan. See the honest bound recorded there.
        for (const [file, text] of Object.entries(serializeIndexes(s))) out.set(`${name}:indexes/${file}`, text);
      }
      return out;
    } finally {
      t.mock.timers.reset();
    }
  }

  // MUST-FIRE control: a rendering that DOES read the clock differs across these two
  // epochs. Without this, a `mock.timers` call that silently pinned both runs to the same
  // instant would make the byte-equality below unfalsifiable. `tools/` is another lane's
  // surface, so the control is a local stand-in, not a mutation of the real serializer.
  function stampUnderClock(now: number): string {
    t.mock.timers.enable({ apis: ["Date"], now });
    try {
      return `# Status\ngenerated ${new Date().toISOString()}\n`;
    } finally {
      t.mock.timers.reset();
    }
  }
  assert.notEqual(
    stampUnderClock(EPOCH_2020),
    stampUnderClock(EPOCH_2035),
    "the two fake clocks are indistinguishable, so the byte-equality below proves nothing",
  );

  const past = viewsUnderClock(EPOCH_2020);
  const future = viewsUnderClock(EPOCH_2035);
  assert.deepEqual([...future.keys()], [...past.keys()]);
  for (const [key, text] of past) {
    assert.equal(future.get(key), text, `${key} differs between the 2020 clock and the 2035 clock`);
  }

  // ANTI-VACUITY. A serializer that returned "" (or threw and was swallowed) under both
  // clocks must not be able to pass this leg, so the compared bytes are checked to be
  // real renderings.
  assert.equal(past.size, VIEW_SPECS.length * 8, "each spec contributes both views plus the six index files");
  for (const { name, rendersRows } of VIEW_SPECS) {
    const trails = past.get(`${name}:trails.md`) ?? "";
    const status = past.get(`${name}:status.md`) ?? "";
    assert.match(trails, /^# Trails\n/, `${name}: trails.md is not a rendered view`);
    assert.match(status, /^# Status\n/, `${name}: status.md is not a rendered view`);
    assert.ok(trails.endsWith("\n") && status.endsWith("\n"), `${name}: a view must end in a newline`);
    // The two views are also the two entries `serializeIndexes` re-exports, so a
    // divergence between the direct call and the bundle is caught here too.
    assert.equal(past.get(`${name}:indexes/trails.md`), trails, `${name}: serializeIndexes disagrees on trails.md`);
    assert.equal(past.get(`${name}:indexes/status.md`), status, `${name}: serializeIndexes disagrees on status.md`);
    if (!rendersRows) continue;
    assert.match(trails, /^## [a-z]+-[a-z0-9-]*-[0-9a-f]{4} — /m, `${name}: trails.md rendered no intent section`);
    assert.ok(trails.includes("| id | title | status |"), `${name}: trails.md rendered no table`);
    assert.match(status, /^## [a-z]+-[a-z0-9-]*-[0-9a-f]{4} — /m, `${name}: status.md rendered no intent section`);
    assert.ok(status.includes("next:"), `${name}: status.md rendered no next step`);
  }
  // And the live tree — the one CI diffs — is substantial, not a stub.
  assert.ok((past.get("live specs/:trails.md") ?? "").length > 5000, "the live trails.md view is implausibly small");
  assert.ok((past.get("live specs/:status.md") ?? "").length > 1000, "the live status.md view is implausibly small");
});

/**
 * Leg 3's pattern. Behaviour 8 declares the view columns as `id`, `title`, `status`
 * (open-work rows plus the next step) — there is no `created` column, so no view cell
 * should ever carry a date.
 *
 * This leg is NOT redundant with the static clock-freedom leg, and the difference is the
 * point: clock-freedom proves the code never READS a clock; this leg catches a date
 * arriving from DATA. `tools/indexer.ts:152` renders `cell(n.data["title"])` verbatim into
 * both views, so a dated node title lands in `specs/indexes/` and then reds
 * `.github/workflows/spec-index.yml:21`'s `git diff --exit-code specs/indexes/` on every
 * later PR. No amount of clock-freedom prevents that.
 *
 * STATED RESIDUAL (the brief's terms, kept verbatim in substance): a node *title*
 * containing a date reds this leg. That is the intended trade, and the remediation is to
 * RENAME THE NODE, never to weaken the leg.
 */
const DATED_CELL = /\d{4}-\d{2}-\d{2}/;

test("CC-8 leg 3 no dated cell: neither serialized view contains a YYYY-MM-DD substring", () => {
  function assertUndated(label: string, text: string): void {
    const offending = text.split("\n").findIndex((line) => DATED_CELL.test(line));
    assert.equal(
      offending,
      -1,
      `${label}:${offending + 1} carries a date, which freezes spec-index.yml's diff on every later PR — ` +
        `remediation is to RENAME the dated node, never to weaken this leg: ${text.split("\n")[offending]}`,
    );
  }

  for (const { name, spec: s } of VIEW_SPECS) {
    assertUndated(`${name} trails.md`, serializeTrails(s));
    assertUndated(`${name} status.md`, serializeStatus(s));
  }

  // The COMMITTED live bytes as well, not only the freshly serialized ones: those bytes
  // are what `spec-index.yml` diffs. `indexes-fresh` keeps the two equal, so this is a
  // cheap second reading of the same invariant from the artifact side.
  for (const view of ["trails.md", "status.md"]) {
    const p = path.join(repoRoot, "specs", "indexes", view);
    const committed = fs.readFileSync(p, "utf8");
    assertUndated(`committed specs/indexes/${view}`, committed);
    // Anti-vacuity: an empty or missing file would otherwise pass by containing nothing.
    assert.ok(committed.length > 100, `specs/indexes/${view} is implausibly small`);
  }

  // MUST-FIRE control: the pattern actually catches a dated title, so this leg is not a
  // regex that can never match. A synthetic intent titled with a date reds it.
  const dated = spec([node("intent-dated-0d01", "intent", { status: "open", class: 1, title: "Ship by 2026-07-30" })], []);
  assert.match(serializeTrails(dated), DATED_CELL);
  assert.match(serializeStatus(dated), DATED_CELL);
  assert.throws(() => assertUndated("synthetic dated-title graph", serializeTrails(dated)), /carries a date/);
});

/**
 * HONEST BOUND on the static leg below, recorded rather than glossed: it scans exactly
 * `tools/conveyor.ts` and `tools/indexer.ts`. The view code path also reaches
 * `tools/loader.ts` and `tools/yaml.ts` (`indexer.ts:3,5` import both), which this scan
 * does NOT cover — a live `Date` read introduced there would pass this leg.
 *
 * CHOICE MADE, stated so the next reader does not have to guess: the scan is left at the
 * two view modules and is NOT widened. Widening would extend this leg's per-file
 * anti-vacuity clause (`mentions > 0`) to two more `domain-backend`-owned modules, so a
 * benign doc-comment rewording in another lane's file would red this lane's suite. The
 * bound is closed BEHAVIOURALLY instead, by leg 2 above: its comparison set runs
 * `serializeIndexes`, which reaches `tools/yaml.ts` through `toYaml`, over specs loaded
 * by `tools/loader.ts` — under two clocks fifteen years apart. A live clock read anywhere
 * in that path that reached the bytes would red leg 2.
 */
test("CC-8 the view code path is clock-free: only doc-comment mentions of Date/env/locale survive", () => {
  const CLOCKY = ["Date", "process.env", "localeCompare", "toLocale"];
  for (const rel of ["tools/conveyor.ts", "tools/indexer.ts"]) {
    const lines = fs.readFileSync(path.join(repoRoot, rel), "utf8").split("\n");
    let mentions = 0;
    lines.forEach((line, i) => {
      if (!CLOCKY.some((t) => line.includes(t))) return;
      mentions++;
      const trimmed = line.trim();
      const isComment = trimmed.startsWith("*") || trimmed.startsWith("//") || trimmed.startsWith("/*");
      assert.ok(isComment, `${rel}:${i + 1} is a LIVE clock/locale reference, not a doc comment: ${trimmed}`);
    });
    // Anti-vacuity: the grep found the doc comments that promise clock-freedom, so
    // a silently renamed token cannot make this leg pass by finding nothing.
    assert.ok(mentions > 0, `${rel}: expected the clock-freedom doc comment to mention at least one token`);
  }
});

test("CC-8 totality: a malformed node does not stop either view from serializing", () => {
  // Unknown `type`, absent `status`, a class outside 0-3, an un-renderable id and a
  // dangling edge — the views must render, not throw (they run inside
  // `handlers/indexes_fresh.ts` on every `spec:validate`).
  const trails = serializeTrails(gMalformed);
  const status = serializeStatus(gMalformed);
  assert.match(trails, /^# Trails\n/);
  assert.match(status, /^# Status\n/);
  assert.ok(trails.endsWith("\n"));
  assert.ok(status.endsWith("\n"));
  // The out-of-range-class intent is still a live intent, so it still gets a row.
  assert.ok(status.includes("intent-wildclass-0181"), status);
  // And an empty graph serializes too.
  const empty = spec([], []);
  assert.match(serializeTrails(empty), /^# Trails\n/);
  assert.ok(serializeStatus(empty).includes("_no live intents_"));
});

// ---------------------------------------------------------------------------
// CC-12 — the transcript replay. The render contract is exactly `spec.ts`'s
// `printNextBlock`: `NEXT <node> <stage>`, one `<kind> <rendered>` line per Step,
// then `END`, joined by `\n` with a trailing newline.
// ---------------------------------------------------------------------------

interface TranscriptEntry {
  command: string;
  node: string;
  block: string;
}

function renderBlock(s: LoadedSpec, nodeId: string): string {
  const lines = [`NEXT ${nodeId} ${deriveStage(s, nodeId)}`];
  for (const step of nextSteps(s, nodeId)) lines.push(`${step.kind} ${step.rendered}`);
  lines.push("END");
  return lines.join("\n") + "\n";
}

const transcript = load(fs.readFileSync(path.join(transcriptFixture, "transcript.yaml"), "utf8")) as TranscriptEntry[];

test("CC-12 the transcript manifest is well-formed", () => {
  assert.ok(Array.isArray(transcript) && transcript.length > 0, "transcript.yaml must be a non-empty list");
  for (const entry of transcript) {
    assert.equal(typeof entry.command, "string");
    assert.equal(typeof entry.node, "string");
    assert.equal(typeof entry.block, "string");
    assert.ok(entry.block.startsWith("NEXT "), `${entry.node}: a block starts with NEXT`);
    assert.ok(entry.block.endsWith("END\n"), `${entry.node}: a block ends with END and a trailing newline`);
  }
  // The fixture carries NO committed indexes (following good-drift/good-waives).
  assert.equal(fs.existsSync(path.join(transcriptFixture, "specs", "indexes")), false);
});

for (const [i, entry] of transcript.entries()) {
  test(`CC-12 replay ${i} — /${entry.command} on ${entry.node} prints its recorded block`, () => {
    assert.equal(renderBlock(transcriptSpec, entry.node), entry.block);
  });
}

test("CC-12 coverage: the recorded `command` set covers all fourteen chain commands", () => {
  const recorded = new Set(transcript.map((e) => e.command));
  const chain = chainCommandFiles().map((f) => f.replace(/\.md$/, ""));
  for (const c of chain) assert.ok(recorded.has(c), `no transcript entry for /${c}`);
  // Superset, so the artifact cannot rot into a one-command sample.
  assert.ok(recorded.size >= chain.length, `${recorded.size} commands recorded, ${chain.length} chain commands`);
});

test("CC-12 the recorded graph exercises the hop set the fixture claims", () => {
  const stages = new Set(transcript.map((e) => deriveStage(transcriptSpec, e.node)));
  // Typed as `Stage[]`, not `string[]`: a typo in a stage name is then a COMPILE
  // error, rather than a `has()` that can never be satisfied and a leg that only
  // looks like it checks something.
  const REQUIRED_STAGES: Stage[] = [
    "intent-open",
    "intent-proposed",
    "intent-compared",
    "contract-approved",
    "contract-decomposed",
    "brief-open",
    "brief-market",
    "brief-implemented",
    "brief-evidenced",
    "patch-selected",
    "evidence-final",
    "integration-final",
  ];
  for (const required of REQUIRED_STAGES) {
    assert.ok(stages.has(required), `no transcript entry reaches stage ${required}`);
  }
});
