---
id: evidence-spec-tooling-schema-driven-9c4e
type: evidence
title: Evidence for schema-driven spec:index and spec:validate implementation
status: final
created: 2026-06-12
---

## Intended change

Per `brief-spec-tooling-schema-driven-8f2d` (decomposing
`contract-spec-tooling-schema-driven-b2e7`): implement `pnpm spec:index`
(regenerates the four files under `specs/indexes/`) and
`pnpm spec:validate` (runs the rules declared in
`specs/schema/validation-rules.yaml`, exits non-zero on any failure).
Rules are data; handlers are TypeScript — a dispatcher maps each of the
six `kind`s to a handler, with `js-yaml` as the only runtime dependency
and deterministic, byte-identical output on re-runs.

Two user-directed amendments to the brief were applied during
implementation:

- `unresolved.yaml` is written by `spec:index` alone (the brief had
  `validate` writing it as part of `references_resolve`).
- `spec:validate` persists its full findings — a sorted list of
  `{rule, kind, subject, detail}` — to `specs/reports/validation.yaml`;
  `specs/reports/` is gitignored, so the `indexes_fresh` rule covers
  `specs/indexes/` only (the brief had report generation out of scope).

## Actual changes (commit 4f7802e)

- `tools/spec.ts` — CLI entry; exits 0 success / 1 validation failure /
  2 usage error.
- `tools/loader.ts` — loads nodes (frontmatter split), edges, schema
  files, and the rule set into a typed in-memory graph.
- `tools/yaml.ts` — deterministic `js-yaml` wrapper (`sortKeys: true`,
  `lineWidth: -1`, `noRefs: true`, trailing newline).
- `tools/indexer.ts` — pure graph → incoming / outgoing / by-type /
  unresolved projections plus writer. Incoming/outgoing entries are
  minimal `{id, type, source|target}` records sorted by (type, edge id);
  unresolved entries are `{edge, missing, value}`.
- `tools/validator.ts` — rule dispatcher; aggregates findings across all
  rules (no short-circuit); every message prefixed `[rule: <id>]`;
  persists the report.
- `tools/handlers/` — `unique_field.ts`, `required_fields.ts`,
  `enum_constraint.ts`, `references_resolve.ts`,
  `edge_endpoint_types.ts` (`any` = no constraint, `same_as_source`
  compares target type to source type), `indexes_fresh.ts`.
- `specs/schema/validation-rules.yaml` — stub replaced with the
  bootstrap ten-rule set in dependency order.
- `specs/indexes/*.yaml` — generated for the live graph and committed,
  arming the `indexes-fresh` gate.
- `tests/spec.test.ts` + `tests/fixtures/good/` + nine
  `tests/fixtures/bad/<case>/` directories covering acceptance examples
  1–10 (example 7, determinism, is asserted in the good-fixture test)
  plus a dispatch-all-kinds case with each rule kind exactly once.
- `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `.gitignore`
  (ignores `specs/reports/` and test scratch dirs).

## Commands run and results

- `pnpm typecheck` — clean (tsc --noEmit, strict).
- `pnpm test` — 12/12 pass (node --test via tsx; subprocess-driven
  against fixture copies; byte-identical `index` re-runs asserted).
- `pnpm spec:index && git diff --exit-code -- specs/indexes/ &&
  pnpm spec:validate` — exit 0; `spec:validate: OK — 10 rules, 0 errors`.
- Rule-disable check (acceptance example 10): removing `indexes-fresh`
  from a drifted fixture's rules file flips validate from exit 1 to
  exit 0, proving rules load from YAML, not code.

## Three-defect self-test

Temporarily introduced: (1) an edge (`edge-demo-dangling-0001`) whose
target `intent-ghost-ffff` does not exist, (2) a node of undeclared type
`widget`, (3) a contract node missing required field `status`.
`spec:validate` exited 1 with exactly one finding per defect under
`edges-references-resolve`, `nodes-type-declared`, and
`nodes-required-fields` respectively; `specs/indexes/unresolved.yaml`
named the dangling endpoint as
`{edge: edge-demo-dangling-0001, missing: target, value: intent-ghost-ffff}`;
all three findings were persisted to `specs/reports/validation.yaml`.
After reverting the defects, both commands returned to green with
byte-identical regenerated indexes (clean `git status`).

## Risks

- Premature abstraction if the rule set never grows beyond the bootstrap
  ten (accepted in the contract's trade-offs).
- Error messages flow through generic per-kind templates and may read
  less tailored than bespoke strings.
- Drift between `node-types.yaml` / `edge-types.yaml` and the rules that
  reference them — mitigated by handlers reading the schema files
  directly rather than duplicating their contents.

## Follow-ups

- CI workflow invoking `pnpm spec:index && git diff --exit-code
  specs/indexes/ && pnpm spec:validate` (named in the brief's
  verification, but no workflow file was in the brief's file list).
- Future briefs for `intent-status-coherence-d4f2` (status coherence as
  a validate rule) and `intent-docs-arrow-lint-e7b3` (arrow lint).
- Update or supersede the brief to record the two amendments noted
  above, so the graph's prose matches shipped behaviour.
