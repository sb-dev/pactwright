---
id: contract-spec-tooling-schema-driven-b2e7
type: contract
title: spec:index + spec:validate driven by validation-rules.yaml
status: approved
created: 2026-06-11
---

## Problem interpretation

The presence of `specs/schema/validation-rules.yaml` as a first-class
schema file (even as a stub) signals that cross-cutting invariants are
expected to grow. Encoding the seven launch rules as data — not code —
lets future phases add invariants by editing YAML, keeps the schema
directory honest about being the single source of truth for what is
legal, and makes the validator's behaviour reviewable in one place.

## Scope

- Same two subcommands, same `pnpm` entry points, same outputs as
  Candidate A. The indexing half is identical (no rule engine needed
  to emit incoming/outgoing/by-type/unresolved).
- A small declarative rule vocabulary in `validation-rules.yaml`, each
  rule a record with `id`, `kind`, and kind-specific params. Initial
  `kind`s, chosen to cover the seven launch rules:
  - `unique_field` — params: `scope` (nodes|edges), `field`.
  - `required_fields` — params: `scope`, derived from the relevant
    schema file (so this rule has no inline list; it reads
    `node-types.yaml` / `edge-types.yaml`).
  - `enum_constraint` — params: `scope`, `field`, schema source.
  - `references_resolve` — params: `scope: edges`, `fields: [source, target]`.
  - `edge_endpoint_types` — reads `edge-types.yaml`, enforces
    `source.type` / `target.type` rules, including the
    `same_as_source` case for `supersedes`.
  - `indexes_fresh` — re-runs index generator and diffs against
    `specs/indexes/`.
- A dispatcher maps `kind` → handler function. Handlers are TypeScript;
  rule *parameters* are YAML.
- Bootstrap commit populates `validation-rules.yaml` with one rule per
  launch invariant so behaviour is observable end-to-end from day one.
- Same `js-yaml`-only runtime dependency surface.

## Non-scope

- Arbitrary expressions / JS-in-YAML. The vocabulary is closed; new
  invariants that don't fit an existing `kind` require adding a new
  handler (still a code change, but bounded).
- Per-rule severity tuning, suppressions, or fix suggestions.
- Reading rule definitions from anywhere other than
  `specs/schema/validation-rules.yaml`.

## Trade-offs

- **+** Adding a new invariant of an existing `kind` is a YAML edit.
  Example: enforcing "no contract may sit in `approved` without an
  inbound `selects` edge" is a new `enum_constraint`-shaped rule, not
  a code change.
- **+** `validation-rules.yaml` becomes a readable spec of what the
  validator enforces — useful for review and onboarding.
- **+** Disabling a rule (temporarily, during a migration) is a YAML
  edit, not a code patch.
- **−** ~1.5–2× the code of Candidate A: rule loader, dispatcher, per-
  kind handlers, plus tests for the dispatch layer itself.
- **−** Error messages flow through a generic template, so they may
  read slightly less tailored than Candidate A's bespoke strings unless
  per-kind formatters are added.
- **−** Risk of premature abstraction if the rule set never actually
  grows beyond the seven launch rules.

## Risks

- A future invariant doesn't fit any existing `kind`, forcing either a
  new `kind` (code) or an escape-hatch rule (erodes the "data not code"
  property). Mitigation: keep the `kind` vocabulary small and
  composable; accept that genuinely new shapes require a new handler.
- Drift between `node-types.yaml` / `edge-types.yaml` and the rules
  that reference them. Mitigation: `required_fields` /
  `edge_endpoint_types` rules read the schema files directly rather
  than duplicating their contents.
- Over-engineering for a single-user repo at this stage.

## Acceptance examples

All seven Candidate-A examples must still hold (same broken graphs,
same exit codes, equivalent error messages). Additionally:

8. **Rule provenance.** Each emitted error names the rule id that
   produced it, e.g. `[rule: edges-references-resolve] edge edge-foo-1234
   target intent-missing-zzzz does not resolve`.
9. **Schema-driven extension.** Adding a new entry to
   `validation-rules.yaml` of an existing `kind` causes the
   corresponding broken-graph fixture to fail validation without any
   code change. Test: a fixture that *currently* passes is rejected
   after appending a single rule to `validation-rules.yaml`.
10. **Rule disable.** Removing a rule from `validation-rules.yaml`
    causes exactly that rule's errors to disappear and no others.

## Verification needs

- All Candidate-A fixtures and tests.
- A dispatch test: a synthetic rules-file containing each `kind` exactly
  once, paired with a fixture that violates each, asserts one error per
  rule.
- A toggle test (example 10 above) proving rules are loaded from YAML
  rather than baked in.
- CI invokes `pnpm spec:validate` on the real `/specs` tree.
