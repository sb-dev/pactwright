---
id: decision-drift-tool-assisted-d5e2
type: decision
title: Select the tool-assisted drift hybrid (spec.ts mapping + Claude residual), synthesizing B and C grafts
decided_by: samir.benzenine@gmail.com
created: 2026-06-14
---

## Selection

Selected `contract-drift-tool-assisted-7173` (tool-assisted drift hybrid).
Siblings `contract-drift-agent-native-bafa` and
`contract-drift-deterministic-4a3a` are rejected. This is a **synthesis**
decision (merge of candidates), not a clean pick: the base is A, with grafts
from B and C folded into the brief below.

## Rationale

A's split — deterministic diff→capability mapping + `spec:check-diff` in
`tools/spec.ts`, with Claude judging only the residual per affected capability —
gives the best determinism/fidelity balance, reuses the existing `spec:gate`
base-ref machinery, and keeps the smallest auditable LLM surface.

- **Rejected B (agent-native):** doing the file→capability mapping and graph
  traversal in an LLM is non-deterministic and untestable, re-derives what the
  indexes already make exact, is the costliest in CI, and relies on
  agent-invokes-agent nesting the repo has not established. *But* its holistic
  cross-capability reasoning is adopted as a graft (see 1 below).
- **Rejected C (deterministic structural):** a structural-signal proxy answers a
  different question than "observable behaviour," its acceptance is vacuously
  satisfiable, and its in-PR-edge suppression makes the Phase-4 acceptance run
  hollow. *But* its deterministic engine is adopted as the blocking-first layer
  (see 2 below).

## Grafts and amendments to fold into the brief

1. **From B — cross-capability pass.** After the per-capability packets, add ONE
   holistic pass: feed all affected-capability packets to the reviewer together
   and ask whether the change drifts *across* capabilities — closing A's
   per-capability blind spot. Keep mapping DETERMINISTIC; reject B's LLM
   glob-matching and its agent→agent nesting (the command invokes the reviewer;
   only graph-maintainer writes).
2. **From C — deterministic blocking-first layer.** `spec:check-diff`
   (`sensitive_paths`) and an optional structural `spec:drift` run fully
   deterministically in CI and may flip to blocking after ~5 clean PRs, while the
   Claude semantic verdict stays warn-only longer. Two layers per SPEC §15
   (mechanical/deterministic + semantic/Claude-assisted). Do NOT adopt C's
   structural proxy AS the behaviour verdict.
3. **Pin the drift-packet JSON schema** and handle a capability resolving to MANY
   or ZERO linked contracts — carry the approved contract, list superseded ones,
   define the empty/uncovered-capability verdict.
4. **Operationally define "observable behaviour"** so acceptance 3 (drift) and 4
   (behaviour-preserving refactor) are distinguishable.
5. **Bind `spec:check-diff`'s "linked approved contract"** to the capability that
   OWNS the touched sensitive path, not any approved contract (kills trivial
   satisfiability).
6. **Resolve bootstrapping:** specify how the migration PR (which edits
   `specs/schema/**`, now sensitive) clears its own new gate — seed-then-enable
   ordering or an override node.
7. **Implement `flags`** via an `edge_endpoint_types` extension accepting target
   `[evidence, capability]`, not `target: any`.
8. **Drop capability status `retired`** unless a retire lifecycle is defined —
   seed all capabilities `active`.
9. **Reconcile acceptance:** Phase 4 shipped as a SINGLE PR (#4), so state the
   exact refs/branches the `/detect-drift` acceptance runs on.
10. **Before any blocking flip of the semantic layer, pin the CI Claude step**
    (action, credential, model); the warn phase may run it manually/optionally.

## Consequences

`contract-drift-tool-assisted-7173` → `approved`;
`contract-drift-agent-native-bafa` → `rejected`;
`contract-drift-deterministic-4a3a` → `rejected`;
`intent-drift-detection-c7b1` stays `open` (closes only once evidence is
recorded). Next step: `/write-brief contract-drift-tool-assisted-7173`
decomposing the approved contract.
