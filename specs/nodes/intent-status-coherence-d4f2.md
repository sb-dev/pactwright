---
id: intent-status-coherence-d4f2
type: intent
title: Enforce intent lifecycle status mechanically via spec:validate
status: open
created: 2026-06-11
---

## Rule

For every intent whose status is not `rejected`, `status: addressed`
holds if and only if there exists a final evidence chain covering it:

```
evidence (status: final) —evidences→ brief —decomposes→ contract —proposes→ intent
```

…and a `decision —selects→ contract` edge exists for that same contract.

`spec:validate` must flag violations in both directions:

- an intent marked `addressed` with no covering final-evidence chain;
- an intent covered by a final-evidence chain but not marked `addressed`.

## Reporting

Violations are emitted to `indexes/unresolved.yaml` (the existing slot
for graph integrity findings, per `intent-spec-index-validate-a3f1`).

## Origin

Phase 1 review. An intent was prematurely set to `addressed` at contract
approval, before any brief existed and long before any evidence existed.
Today the `status` field is advisory — a human writes it and nothing
checks it. This intent makes the lifecycle mechanical so the graph
cannot silently claim work is done.
