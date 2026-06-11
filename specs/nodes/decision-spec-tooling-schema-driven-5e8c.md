---
id: decision-spec-tooling-schema-driven-5e8c
type: decision
title: Select schema-driven validator for spec:index + spec:validate
decided_by: samir
created: 2026-06-11
---

## Decision

Select `contract-spec-tooling-schema-driven-b2e7` (Candidate B,
schema-driven) over `contract-spec-tooling-hardcoded-c1a4` (Candidate A,
hardcoded) to address `intent-spec-index-validate-a3f1`.

## Rationale

- **`validation-rules.yaml` already exists as a first-class schema
  file.** Shipping Candidate A would leave it advertising a capability
  the validator does not honour, which is worse than not having the
  file at all. Candidate B makes the schema directory tell the truth.
- **The rule set is expected to grow.** The lifecycle in `CLAUDE.md`
  spans intents → contracts → decisions → briefs → evidence with
  status transitions and superseding edges. New cross-cutting
  invariants (e.g. "an `approved` contract must have an inbound
  `selects` edge", "an `implemented` brief must have at least one
  `evidences` edge") are foreseeable. Encoding them as YAML data
  rather than TypeScript code keeps the cost of adding each one low.
- **Single reviewable surface for "what is legal".** With Candidate B,
  a reader can answer "what does the validator enforce?" by reading
  one YAML file. With Candidate A, the answer is buried in imperative
  code that has to be re-read for every change.
- **Migration cost asymmetry.** If we picked Candidate A and the rule
  set grew, we would rewrite toward Candidate B and pay the
  abstraction cost on top of the throwaway code. The reverse direction
  (over-abstracted for a static rule set) is cheap — the dispatcher is
  small and isolated.

## Trade-offs accepted

- ~1.5–2× the code of Candidate A up front.
- Error messages flow through a per-`kind` template rather than being
  hand-written per check. Mitigation: per-kind formatters can be added
  later without changing the dispatch shape.
- Risk that a future invariant doesn't fit any existing `kind`.
  Mitigation: keep the `kind` vocabulary small and composable; accept
  that genuinely new shapes require adding a handler (a code change,
  but bounded in scope).

## Consequences

- `contract-spec-tooling-schema-driven-b2e7` moves to `approved`.
- `contract-spec-tooling-hardcoded-c1a4` moves to `rejected`.
- A `brief` decomposing the approved contract is the next step. Until
  the brief lands and evidence covers it, no implementation code
  should be written against this contract.
