---
id: decision-work-class-routing-4d7a
type: decision
title: Select Candidate B (validate-time spec:validate invariant) for work-class routing
decided_by: Samir Benzenine
created: 2026-06-16
---

Human selection recorded for the proposal market on intent `intent-work-class-routing-b9c4` (three candidate contracts).

**Selected (→ approved):** `contract-work-class-validate-invariant-c3d4` — Candidate B, the validate-time graph invariant.
**Rejected:** `contract-work-class-command-discipline-a1b2` (Candidate A) and `contract-work-class-approval-gate-e5f6` (Candidate C).
**Intent:** stays `open` until an evidence chain closes it.

The selected approach is B's mechanism augmented with the strongest parts of A and the counting-rule fix surfaced by C's critique, plus the corrections below. None of the corrections change the intent's intended behaviour, so this is a clean step-3 selection — no follow-up intent and no supersede is triggered. The corrections are recorded here (not silently absorbed) and bind the implementation brief.

## Rationale and the synthesized approach the brief must implement

Selected as the machine-enforcement backbone, with A's command pre-check mixed in and the corrections below; C's gate dropped.

WHY B (not C): approval is a specs-only change (a selects edge + decision node). B's invariant rides spec-validate.yml, which runs on any specs/ change, so it fires on approval PRs and needs no new workflow. C's gate was wired into pr-evidence.yml, which SKIPS specs-only PRs, so it would never fire on an approval — fatal. B is also pure graph-shape (no git plumbing). C's gate is dropped; its lasting contribution is the counting-rule fix in point 1.

MIX FROM A: keep an /approve-contract pre-check that refuses to author the selects edge when a class>=2 intent has <2 live candidates — a preventive first line, so the bad edge is normally never written (fixing B's 'detective, not preventive' gap). B's validate invariant remains the unbypassable backstop for hand-edits. Common-core command updates apply: capture-intent sets/asks class; propose-contracts emits 1 candidate for class 0-1 and >=2 for class 2-3; write-brief reads contract class.

CORRECTIONS THE BRIEF MUST APPLY (fixes from the review; none change the intent's behaviour):
1. Pin 'candidate' = a proposes edge whose SOURCE contract status is NOT superseded (kills B's superseded double-count and C's open question). Define behaviour for a selects->contract with no proposes edge (explicit finding, never silent-pass) and a contract proposing multiple intents (counts toward each).
2. Drop the class:2.0 rejection — under CORE_SCHEMA, 2.0 parses to the JS number 2 and Number.isInteger(2) is true, so it is ACCEPTED. Reject only genuinely non-integral numbers (e.g. 2.5), non-numbers (incl. the string '2'), and out-of-range integers.
3. Backfill ALL existing intent+contract nodes lacking class (~22 today: 9 intents + 13 contracts, including these three candidate contracts), default 2, smoke-test intents (capture-smoke-test, capture-smoke-superseded) to 0. Schema edit + full backfill in ONE commit.
4. The range rule is integer-aware (modeled on list_field, NOT enum_constraint, which is string-only). Pin the exact id/kind/handler-filename triple for BOTH new rules so HANDLERS[kind] cannot silently no-op on a name mismatch; register both in tools/validator.ts.
5. Keep the quorum at class>=2 (faithful to the routing table, where Class 2 also requires >=2). Record the audit: the 4 existing selects edges resolve to intents with 2/2/3/3 candidates, so the class-2 backfill keeps the graph green. Rely on a defensive endpoint-skip (not rule ordering alone) and place the quorum rule after edges-references-resolve.
6. produced_by stays unvalidated — no required_fields entry, no rule; present on every node type by omission.
7. Frame the guarantee honestly in CLAUDE.md/the brief: 'an under-proposed class>=2 approval cannot stand in a green graph / cannot merge,' backed by a command pre-check that refuses to author it in the normal path — not a literal pre-author block.
