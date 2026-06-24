---
id: intent-unbacked-addressed-guard-8c4e
type: intent
title: Flag intents marked `addressed` without edge-backed provenance
status: open
created: 2026-06-23
class: 2
---

## Problem

Emit a validation finding when a non-`rejected` intent is marked `addressed`
without edge provenance — i.e. when it has neither a `selects`-coverage chain
(decision→selects→contract→proposes→intent backed by covering final
evidence/integration) NOR an explicit provenance edge recording a
decision-backed subsumption. Today an unbacked `addressed` flip passes a green
graph: `coverage-coherence` is `selects`-scoped, so an intent with zero incoming
edges (e.g. `intent-status-coherence-d4f2`, driven `addressed` by
`decision-lane-integration-9f3b` prose plus an evidence body that evidences a
DIFFERENT intent) is structurally unreachable by every rule — the CLAUDE.md
rule-1 "body-as-canonical-data" anti-pattern, uncatchable.

Closing this needs NEW schema: there is no `decision→intent` edge type today,
and `supersedes` is same-type-only, so the subsumption relationship cannot
currently be expressed as an edge.

## Goal

Make a body-only `addressed` claim machine-catchable, distinguishing a
legitimately-covered intent from an unbacked flip.

## Source

PR #11 review finding F8 — d4f2 itself is accepted as a recorded exception
(human-confirmed in `decision-lane-integration-9f3b`); this intent hardens the
general case so the next unbacked flip cannot pass silently. Likely class 2
(schema change + new validation rule).
