---
id:      evidence-critics-literal-panel-e2a7
type:    evidence
title:   Evidence — specialist critics + durable proposal comparison implemented (schema gate, nine critic agents, prose routing)
status:  final
created: 2026-06-18
---
## Evidence

Implementation of `brief-critics-literal-panel-b5c6` (which `decomposes` `contract-critics-literal-panel-1c4a`, proposing `intent-specialist-critics-comparison-7ada`). Code and project files only — no spec-graph data was written by the implementation (the market is grandfathered, so no comparison node was authored for the live tree). Gathered 2026-06-18, after all three lanes landed.

## Validation

`tsx tools/spec.ts validate` → **OK — 14 rules, 0 errors** (was 13). The new `comparison-required` rule is live, listed between `class-market-quorum` and `indexes-fresh`. The graph is green with the gate active.

## Tests

`node --test --import tsx tests/*.test.ts` → **92 tests, 92 pass, 0 fail** (15 new). `tests/comparison_required.test.ts` covers the (a)–(h) matrix: coverage-is-a-set-not-a-count, both cutoff operands normalized through `toDateString`, grandfather keyed on the SELECTED CONTRACT's `created`, class-<2 skip, fail-open on absent/malformed cutoff or contract date, superseded/duplicate compares targets not counted, and unresolved endpoints skipped without throwing. `tests/loader.test.ts` covers the scalar `comparison_required_from` read (present → string; absent/empty/non-string → undefined).

## Grandfathering (real-tree audit)

All six `selects`-target contracts predate the `2026-06-18` cutoff (`created` 2026-06-11, -12, -13, -14, -16, -17 — the just-selected `contract-critics-literal-panel-1c4a` is 2026-06-17), so `comparison-required` emits zero findings and every pre-cutoff selection stays green. No backfill; no comparison node or `compares` edge authored for the live tree.

## Files landed

Lane A — schema + validation gate (one atomic core): `specs/schema/node-types.yaml` (added the `comparison` type, no status_values/no class), `specs/schema/edge-types.yaml` (added `compares`, comparison to contract), `specs/schema/validation-rules.yaml` (added the `comparison-required` rule + top-level `comparison_required_from: "2026-06-18"`), `tools/loader.ts` (surfaced `comparisonRequiredFrom` on `LoadedSpec`), `tools/handlers/comparison_required.ts` (new handler — set-based coverage + dual-operand date grandfathering, modeled on `class_market_quorum`), `tools/validator.ts` (registered the handler), `tests/comparison_required.test.ts` + `tests/loader.test.ts` (new).

Lane B — critic panel: nine new bespoke `.claude/agents/*-critic.md` files (product, ux, architecture, security-privacy, compliance-risk, qa-test, reliability-ops, cost-maintainability, release), authored from one pinned skeleton; steps 4–6 byte-identical across all nine (skeleton parity verified), each ending in a perspective-labelled `## Critique (<perspective>)` and the never-select rule.

Lane C — routing + commands: `CLAUDE.md` (added Critic routing, Proposal comparison, and the grandfathering rule), `.claude/commands/review-contracts.md` (rewritten: route critics by class + scope, invoke each as a real subagent, class-3 count-enumeration guard, idempotent single comparison), `.claude/commands/approve-contract.md` (decision body now cites the comparison node and records why each rejected candidate lost).

## Acceptance coverage (brief — Acceptance & verification)

- Schema-first green; `comparison` type, `compares` edge, and the cutoff present; rule correctly ordered — validate green (items 1, 7).
- Loader surfaces the scalar cutoff (item 2) — `loader.test.ts`.
- Post-cutoff class-2 selection blocked until a covering comparison exists; coverage not mere count; superseded/duplicate targets do not count (items 3, 4) — `comparison_required.test.ts` (a)–(h).
- Grandfathering and fail-open (item 5) — matrix (d)/(e)/(f) plus the real-tree audit above.
- Defensive resolution, no throw (item 6) — matrix (h).
- Nine named critic agents present with skeleton parity (item 11) — the parity check.
- Count guard, idempotency, and decision-cites-comparison wired into the command bodies (directive 6, items 9, 10) — Lane C.

## Out of scope (per the decision; routed to a follow-up intent)

The validated-graph routing artifact — a declarative routing table pulled into the graph plus a rule resolving it against `.claude/agents/` — was deliberately NOT implemented; it is the decision's separately-captured follow-up intent. Routing here is CLAUDE.md prose plus command logic, with the acknowledged CLAUDE.md/command divergence recorded as a known trade-off.

## Manual verification deferred (no machine gate)

Routing behaviour at run time — a class-2 UI intent invoking `ux-critic` and not the payments critics; a class-3 intent invoking the full panel — is a manual `/review-contracts` transcript check, not exercised by this evidence.
