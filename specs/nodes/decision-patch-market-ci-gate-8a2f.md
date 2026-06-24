---
id: decision-patch-market-ci-gate-8a2f
type: decision
title: Select Candidate B (dedicated diff-aware CI gate) for the lane-aware patch market, grafting A and C
decided_by: Samir Benzenine
created: 2026-06-24
produced_by: "/approve-contract"
---

SELECTED (→ approved): `contract-patch-market-ci-gate-6b7e` (Candidate **B**, dedicated diff-aware CI gate) for `intent-patch-market-synthesis-3b1e` (class 3). REJECTED (→ rejected): `contract-patch-market-validate-authoritative-9d41` (Candidate **A**) and `contract-patch-market-reuse-evidence-gate-c3f8` (Candidate **C**).

This is a clean step-3 selection in the `decision-drift-tool-assisted-d5e2` / `decision-lane-integration-9f3b` mould: one base approved, with the grafts from the rejected candidates and the panel's mandatory fixes **recorded here** (not silently absorbed) and binding the implementation brief. The three candidates ship an identical core and differ on exactly one axis — **where the multi-patch merge gate lives**. None of the recorded grafts change the intent's intended behaviour; they refine HOW, not WHAT. If, while writing the brief, any graft would change intended behaviour, STOP and return to human approval rather than widening scope inside the winner (CLAUDE.md scope-integrity rule 5).

## Accepted trade-off (why B)

B is the only candidate that keeps `spec:validate` **pure** (no red-WIP, no override/`today` logic in the validator) AND delivers the intent's **literal** acceptance: a named `patch-comparison.yml` workflow plus a `patch-comparison` check. Decisively, B keeps the graph **green mid-market**, which the patch market requires — several candidate patches are open at once, and only the merge is gated, not the whole tree. B's costs (a net-new PR→brief mapping and an out-of-diff branch-protection wiring step) are addressable refinements, not architectural dead-ends — and the grafts below close them.

## Why each rejected candidate lost

**A (`contract-patch-market-validate-authoritative-9d41`)** — realising the merge gate as a `spec:validate` rule couples "graph well-formed" to "market finished": an open market reds the **whole graph**, stranding every concurrent spec-touching PR until a human selects (reliability-ops: a "global CI outage" with no per-brief containment). Its only escape — a standing, whole-graph `override` — forces `spec:validate` to become the system's first waiver- and wall-clock-aware (impure) rule, yet `runValidation` hands handlers `(rule, spec)` with no `today`, so the expiry logic has nowhere to read the clock. A's single-source-of-truth and offline-testability virtues are kept — as grafts, below — without its red-WIP.

**C (`contract-patch-market-reuse-evidence-gate-c3f8`)** — `pr-evidence.yml` skips specs-only PRs, so the patch market's graph-only steps — the exact "a multi-patch brief whose PR skips the comparison node" case the intent's headline acceptance names — never invoke C's folded clause and merge **green and ungated**. Compounding this, the reused `waives → pr-evidence` override coarsely waives evidence-provenance **and** patch-comparison together — an un-splittable coarsening on a class-3 gate. C's maximal-reuse instinct is kept — as grafts, below — without inheriting its coverage hole.

## Grafts the brief must carry

**From A (validate-authoritative):**
- Make "is this market resolved?" a **single graph-resident predicate** — one shared live-competitor / resolved helper reused by BOTH `spec:patch-gate` AND the two structural validate rules — so there is no two-places drift (B's main con).
- Keep the gate core a **pure `evaluatePatchGate(input)`** over an immutable `{graph, resolvedBrief, today}`, so it is fully offline unit-testable without GitHub — A's testability virtue without A's red-WIP or validator impurity.

**From C (reuse):**
- Do not reinvent: reuse the existing `override`/`waives` mechanism, the `toDateString` expiry check, and the `gitdiff.ts` helpers.
- Keep a **dedicated `patch-comparison` waiver** (a new entry in `specs/schema/checks.yaml`); never overload `pr-evidence`.
- Explicitly make the gate fire on the artifact that actually **merges the winner's code**, closing C's specs-only-PR hole instead of inheriting it.

## Mandatory panel fixes the brief must apply

1. **Type-guard `intentsForContract` callers to `type === "contract"`.** Widening `selects.target` and `compares.target` to `[contract, patch]` feeds patch ids into `class_market_quorum` and `comparison_required`, which assume a contract — a spurious red on every patch selection unless guarded. (spec, qa-test)
2. **Exclude `selected` as well as `superseded` from the live-competitor set.** `liveSourcesByEdge` excludes only `superseded` today, so a chosen winner would still count as a live competitor and the post-selection steady state would never be clean/tested. (qa-test, spec)
3. **Graph-first PR→brief mapping** (`patch.branch == head → competes-for` brief) with an **unambiguous fail-closed default** that never silently passes an unmapped multi-patch merge and never strands unrelated PRs, plus a parity test that the gate and the structural rules count "live competitor" identically. (architecture, qa-test, reliability-ops)
4. **Every one of the four commands** (`/propose-patches`, `/compare-patches`, `/synthesize-patches`, `/select-patch`) **carries the closing status-report contract** every existing command guarantees (ids touched + each updated status). (ux)
5. **Document the branch-protection / required-check wiring** the named `patch-comparison` check needs to actually block a merge, since that lives outside the diff. (release, cost-maintainability)

## Consequences

- `contract-patch-market-ci-gate-6b7e` → **approved**.
- `contract-patch-market-validate-authoritative-9d41` → **rejected**; `contract-patch-market-reuse-evidence-gate-c3f8` → **rejected**. They remain in the graph (not superseded) as the durable market record the comparison covers.
- `intent-patch-market-synthesis-3b1e` stays **open** — it closes only when this multi-lane change's final evidence is integrated (via `/integrate`).

This decision cites the market's comparison node `comparison-patch-market-synthesis-7b1d` (which holds the full critic-by-axis analysis and the case against each candidate); this decision holds the choice.

**Next step:** decompose B as a class-3 multi-lane change via `/decompose-lanes`, with `test-verification` as its own lane (owned by `test-writer`, never the invocation that implemented the code under test).
