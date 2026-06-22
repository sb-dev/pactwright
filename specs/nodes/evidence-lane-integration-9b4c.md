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
- `node --test --import tsx tests/*.test.ts` -> 135 tests, 135 pass, 0 fail (41 new: coverage cases a-k incl. L4, draft-integration boundary, grandfather, fail-open, one-integration, brief-set-bounded, stale-integration; closed_key_set set+member; lane enum; list_field on integration; byte-equality, dispatch-pinning, ordering).
- `node_modules/.bin/tsx tools/spec.ts validate` -> OK, 18 rules, 0 errors.
- `bad/uncovered-multi-brief` proves L4 at CLI level: a two-lane contract marked addressed with no final integration exits non-zero on `[rule: coverage-coherence]`.

## Acceptance
L1 (a two-lane change cannot be addressed without a final integration over every lane) and L4 (validate exits non-zero on an uncovered multi-brief) are covered by the coverage_coherence suite + the fixture; L2 (single-brief completes without integration) by the coverage_coherence single-brief cases; L3 (/prepare-evidence STOP-and-ask on an unowned path) was exercised by THIS evidence step — CLAUDE.md and tests/** were unowned, resolved by creating `capability-spec-docs` and `capability-spec-tests`.

## Honest bound
This contract is single-brief (bootstrap): it has NO integration node of its own; the lane/integration machinery is exercised by the self-dogfood test fixture and applies to future class-3 work. The structured `integration_sections` check is presence-of-a-well-typed-shape, not proof the combined tests ran — the integration body's substance remains the integration-reviewer agent's judgement.

This work lands and generalises the single-lane coherence rule that `intent-status-coherence-d4f2` specifies, so d4f2 is driven to `addressed` (a manual, decision-recorded transition — the selects-scoped coverage rule structurally cannot reach d4f2), per `decision-lane-integration-9f3b`.
