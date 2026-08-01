---
id: intent-covered-walk-shared-4b19
type: intent
title: Share one definition of "covered" between coverage-coherence and unbacked-addressed
status: open
created: 2026-07-31
class: 2
produced_by: "/capture-intent"
---

`tools/handlers/unbacked_addressed.ts` re-derives whether a contract is **covered** instead of
sharing a walk with `coverage-coherence`. The two definitions already disagree, nothing tests the
divergence, and the disagreement is silent.

## The defect

`unbacked_addressed.ts` carries a 27-line local `contractCovered` closure that composes
`liveBriefsForContract`, `finalEvidenceForBrief` and `briefsCoveredByIntegration` — including its
own local `supersededTargets` set — to decide whether the contract a subsuming decision selected is
covered. `coverage_coherence.ts` decides the same question with its own assembly of the same
helpers.

This is precisely the hazard `tools/handlers/coverage_traversal.ts`'s header comment and the A11
note in `coverage_coherence.ts` were written to prevent: two rules computing one notion by hand, free
to drift. `coverage_traversal.ts` already exports 13 shared walks and is the established seam. Two
of those walks — `finalEvidenceForBrief` and `briefsCoveredByIntegration` — were lifted there for
exactly this reason.

The pattern was recognised and half-applied during the guard's own delivery.
`decision-unbacked-addressed-edge-9d3f`'s amendment 8 required lifting `selectedContracts` into the
shared module and declaring one spelling authoritative, on the stated ground that the two rules must
not mean different things by **selected**. That reasoning applies verbatim to **covered** and was
never applied to it.

## The divergence is real today, not hypothetical

1. **`contractCovered` is cutoff-blind.** `coverage_coherence.ts:49` normalizes
   `spec.coverageCoherenceFrom` and `:90` returns early on `c < cut`, so it never computes coverage
   for a contract created before `coverage_coherence_from`. `contractCovered` reads no cutoff at all
   — the only mention of one in `unbacked_addressed.ts` is prose in a doc comment. For a pre-cutoff
   contract the two rules therefore genuinely disagree about whether it is covered.
2. **The integration scan is scoped differently.** `coverage-coherence` first narrows to integrations
   touching *this* contract, then applies its verdict; `contractCovered` scans integrations globally
   and filters. Equivalent for the full-coverage case; not the same code, and not tested to be
   equivalent.

Neither divergence is currently harmful. The only `subsumes` edge in the graph anchors on
`contract-lane-integration-convention-body-4c1f`, `created: 2026-06-19` — one day after the
`2026-06-18` cutoff — so both definitions agree on it. **The promise holds by a date coincidence,
not by construction**, and nothing in `tests/` would notice if it stopped holding.

## What this intent asks for

1. **One shared definition of covered**, exported from `coverage_traversal.ts` and called by both
   `coverage-coherence` and `unbacked-addressed`, in the shape amendment 8 used for
   `selectedContracts`.
2. **A decision on grandfathering, recorded rather than inherited.** Should the `subsumes` anchor
   honour `coverage_coherence_from`? Stricter (current behaviour) means a subsumption anchored on a
   pre-cutoff contract fails even though `coverage-coherence` deliberately declines to judge that
   contract. Looser means the anchor accepts coverage the coverage rule never verified. This is a
   behaviour question, not a refactor, and it is the reason this is not class 1.
3. **A test that fails if the two definitions drift** — the guard that does not exist today. A unit
   case over a pre-cutoff contract would discriminate the two spellings directly.

## Provenance

Found by `test-writer` during the verification of `brief-unbacked-addressed-edge-6b73`, in a separate
invocation from the one that wrote the code — the separation of duties working as intended. Recorded
as bound 4 of `evidence-unbacked-addressed-edge-8f52`'s corrections section, and routed here rather
than absorbed into that change, per CLAUDE.md scope-integrity rule 5: the contract that shipped the
guard scoped no change to `coverage-coherence`, and widening it silently to share a walk would have
been the drift the rule forbids.
