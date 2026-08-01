---
id: decision-status-coherence-subsumed-3c7e
type: decision
title: The lane-integration delivery accounts for the status-coherence intent — anchoring its subsumption
created: 2026-07-31
decided_by: Samir Benzenine
produced_by: "/update-spec-graph"
---

**DECIDED:** `intent-status-coherence-d4f2` is accounted for by the delivery of
`contract-lane-integration-convention-body-4c1f`, and that accounting is recorded as a
`subsumes` edge rather than left in prose. This decision carries the `selects` edge that
**anchors** the subsumption, per the mechanism `contract-unbacked-addressed-edge-5b71`
introduces.

## Why this decision exists

`intent-status-coherence-d4f2` was flipped to `addressed` by `decision-lane-integration-9f3b`'s
closing prose plus an evidence node that evidences a *different* brief. It has no incoming
`proposes` edge and no market of its own, so `coverage-coherence` — which is `selects`-scoped —
never visits it. The new `unbacked-addressed` rule reaches it on the first pass and reds the
graph until the accounting is expressed as an edge.

The substantive claim is not new and is not this decision's invention:
`contract-lane-integration-convention-body-4c1f`'s own body states that it **generalises the
single-lane status-coherence rule that `intent-status-coherence-d4f2` specifies but which does
not exist** in the codebase. That contract was selected by `decision-lane-integration-9f3b`, is
`approved`, `class: 3`, `created: 2026-06-19`, and is **covered** — its single live brief
`brief-lane-integration-5e2d` carries exactly one `final` evidence. The work d4f2 asked for was
delivered; what was missing was an edge saying so.

## Why this decision also `selects` 4c1f

The `unbacked-addressed` rule honours a `subsumes` edge only when the **subsuming decision itself
`selects` a contract that is covered**. That anchoring condition is deliberate — it stops a
subsumption being conjured from a decision that delivered nothing. A decision authored purely to
record the subsumption would select nothing and would therefore **not** anchor: verified, the
graph stays red with an `unanchored` finding. So this decision carries the `selects` edge that
makes the anchor hold.

## Honest bounds, recorded rather than buried

1. **`contract-lane-integration-convention-body-4c1f` is now the target of two `selects` edges** —
   `decision-lane-integration-9f3b`'s from 2026-06-20 and this one. The first is the historical
   act of selection; this one is an anchoring re-affirmation, not a claim that this decision ran
   that market. No rule forbids it and the graph validates green, but a reader should not infer a
   second market from the second edge.
2. **Amendment 7 of `decision-unbacked-addressed-edge-9d3f` is only half satisfied.** It forbade
   reusing `decision-lane-integration-9f3b` as the anchor because that decision's coverage rests on
   `evidence-lane-integration-9b4c`, an evidence body that evidences a different brief — the very
   anti-pattern `intent-unbacked-addressed-guard-8c4e` names. Authoring a **new** decision node
   satisfies the amendment's procedural half: `specs/nodes/decision-*` is covered by
   `.github/CODEOWNERS`, so this grant trips code-owner review, which appending an edge sourced
   from an already-merged decision would not have. It does **not** satisfy the substantive half:
   the anchor still resolves through `4c1f`'s coverage, which is still `evidence-lane-integration-9b4c`.
   No graph shape available under the anchoring mechanism avoids that, because `4c1f` is the
   contract whose delivery accounts for d4f2 and `9b4c` is what covers it. Recorded as a known,
   accepted bound rather than presented as closed.
3. **This decision changes no node's status.** `subsumes` is the cross-type provenance edge and
   carries no status consequence; `intent-status-coherence-d4f2` stays `addressed` on the strength
   of delivered work, not on the strength of this record.

## Consequences

- `decision-status-coherence-subsumed-3c7e` — created (decisions carry no status)
- `decision-status-coherence-subsumed-3c7e —selects→ contract-lane-integration-convention-body-4c1f`
- `decision-status-coherence-subsumed-3c7e —subsumes→ intent-status-coherence-d4f2`
- `intent-status-coherence-d4f2` — unchanged at `addressed`, now with an anchored subsumption
- `contract-lane-integration-convention-body-4c1f` — unchanged at `approved`

**Next step:** re-run `/implement-brief brief-unbacked-addressed-edge-6b73`, which finds the work
complete and takes its single graph write.
