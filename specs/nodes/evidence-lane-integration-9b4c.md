---
id: evidence-lane-integration-9b4c
type: evidence
title: Lane model + integration node + coverage-coherence rule implemented
status: final
created: 2026-06-20
produced_by: "/prepare-evidence"
---

Evidence that `brief-lane-integration-5e2d` (the bootstrap single brief decomposing `contract-lane-integration-convention-body-4c1f`, proposing `intent-lane-model-integration-a1f7`) is implemented.

## What landed (code & project files)
- Schema: optional `lane` enum on `brief`; `integration` node type (required `integration_sections`, status draft|final); `integrates` edge (integration -> evidence).
- Handlers: `coverage_traversal.ts` (shared live-set / proposes / decomposes walk); `closed_key_set.ts` (set-equality + membership modes, `node.data` only); `coverage_coherence.ts` (selects-scoped, grandfather on the selected contract's created, single-/multi-brief coverage, bidirectional intent coherence, one-integration-per-contract invariant). `comparison_required.ts` + `class_market_quorum.ts` refactored onto the shared helper. Registered in `tools/validator.ts`; `coverageCoherenceFrom` on the loader.
- Rules (validation-rules.yaml): `integration-sections-list` (list_field), `integration-sections-keys` (closed_key_set set-mode), `brief-lane-valid` (closed_key_set membership-mode, 8 lanes), `coverage-coherence`; `coverage_coherence_from: "2026-06-18"`.
- Agents/commands: `integration-reviewer.md` (the single canonical 7-key vocabulary), `test-writer.md`; `/decompose-lanes`, `/write-tests`, `/integrate`; `/prepare-evidence` update (laned status + evidence-sourced capability touches); CLAUDE.md lane catalog + four rules + honest bound + vocabulary pointer.
- Tests: six new unit/meta suites + the `bad/uncovered-multi-brief` fixture.
Committed as `d958337` (graph: approve + brief) and `5a19d7d` (implement: code/project).

## Verification (run 2026-06-20)
- `node --test --import tsx tests/*.test.ts` -> 142 tests, 142 pass, 0 fail (41 original coverage cases a-k incl. L4, draft-integration boundary, grandfather, fail-open, one-integration, brief-set-bounded, stale-integration; closed_key_set set+member; lane enum; list_field on integration; byte-equality, dispatch-pinning, ordering; PLUS 7 post-review regression cases — F1-F6 below + a lane-catalog drift pin — each F-case verified red-before/green-after on 2026-06-23).
- `node_modules/.bin/tsx tools/spec.ts validate` -> OK, 18 rules, 0 errors.
- `bad/uncovered-multi-brief` proves L4 at CLI level: a two-lane contract marked addressed with no final integration exits non-zero on `[rule: coverage-coherence]`.

## Acceptance
L1 (a two-lane change cannot be addressed without a final integration over every lane) and L4 (validate exits non-zero on an uncovered multi-brief) are covered by the coverage_coherence suite + the fixture; L2 (single-brief completes without integration) by the coverage_coherence single-brief cases; L3 (/prepare-evidence STOP-and-ask on an unowned path) was exercised by THIS evidence step — CLAUDE.md and tests/** were unowned, resolved by creating `capability-spec-docs` and `capability-spec-tests`.

## Honest bound
This contract is single-brief (bootstrap): it has NO integration node of its own; the lane/integration machinery is exercised by the self-dogfood test fixture and applies to future class-3 work. The structured `integration_sections` check is presence-of-a-well-typed-shape, not proof the combined tests ran — the integration body's substance remains the integration-reviewer agent's judgement.

This work lands and generalises the single-lane coherence rule that `intent-status-coherence-d4f2` specifies, so d4f2 is driven to `addressed` (a manual, decision-recorded transition — the selects-scoped coverage rule structurally cannot reach d4f2), per `decision-lane-integration-9f3b`.

## Post-review corrections (PR #11)

An automated precision review of the landed handlers surfaced six latent correctness gaps — all green on the committed graph, reachable only in future class-3 multi-lane work. Fixed in-scope (the bugs deviated from the contract's already-intended live-set / selects-scoped semantics; no behaviour widening):
- **F1** — superseded integrations (the target of a `supersedes` edge) are excluded from the live integration set.
- **F2** — multi-brief coverage requires the final integration's covered-brief set to EQUAL the contract's live-brief set (no foreign briefs), not merely contain it.
- **F3** — bidirectional coherence is scoped to the intent THIS contract won; an intent a different selected contract owns is no longer judged here.
- **F4** — a `superseded` selected contract is skipped.
- **F5** — a single-/zero-brief contract carrying any integration is a finding (it must carry none).
- **F6** — `intentsForContract` dedups via a `Set`.

**Scope-integrity (CLAUDE.md rule 5):** the shared coverage-traversal extraction also tightened `class_market_quorum` from counting `proposes` EDGES to counting DISTINCT live sources — a degenerate-case correctness improvement, NOT the strict behaviour-preservation that `brief-lane-integration-5e2d` claimed. Recorded here rather than editing the implemented brief.

**Deferred:** F8 (a guard for unbacked `addressed` flips, e.g. `intent-status-coherence-d4f2`) captured as follow-up intent `intent-unbacked-addressed-guard-8c4e` — it needs new schema (no `decision→intent` edge today). The C5 doc-accuracy cleanup (the "single canonical keys" over-claim in `CLAUDE.md` / `.claude/agents/integration-reviewer.md`) is now resolved — both docs record that the `integration-sections-keys` rule necessarily embeds a literal copy of the keys, kept byte-equal to the canonical agent list by the `lane_integration_meta` drift test.
