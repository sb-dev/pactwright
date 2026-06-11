---
id: brief-spec-tooling-schema-driven-8f2d
type: brief
title: Implement schema-driven spec:index and spec:validate
status: approved
created: 2026-06-11
---

## Scope

Implement the two subcommands declared in
`contract-spec-tooling-schema-driven-b2e7`: `spec:index` regenerates the
four files under `specs/indexes/`, and `spec:validate` runs the rules
declared in `specs/schema/validation-rules.yaml` and exits non-zero on
any failure.

## Files to create

- `tools/spec.ts` — CLI entry. Parses `argv[2]` as `index` or `validate`
  and dispatches; emits usage text on unknown subcommand. Exits 0 on
  success, 1 on validation failure, 2 on usage error.
- `tools/loader.ts` — reads every `specs/nodes/*.md` (splitting YAML
  frontmatter from markdown body) and `specs/graph/edges.yaml`. Also
  loads `specs/schema/node-types.yaml`, `specs/schema/edge-types.yaml`,
  and `specs/schema/validation-rules.yaml`. Returns a typed in-memory
  graph plus the schema and rule set.
- `tools/yaml.ts` — deterministic YAML serializer wrapping `js-yaml`:
  `sortKeys: true`, `lineWidth: -1`, `noRefs: true`, trailing newline.
  Used by both the indexer and any error output that round-trips YAML.
- `tools/indexer.ts` — pure function from loaded graph → four objects
  (`incoming`, `outgoing`, `by-type`, `unresolved`), each keyed/sorted
  deterministically. Plus a writer that serializes them to
  `specs/indexes/*.yaml` via `tools/yaml.ts`.
- `tools/validator.ts` — rule dispatcher. Maps each `kind` declared in
  `validation-rules.yaml` to a handler. Aggregates errors as
  `{ rule: string, message: string }[]`. Each error message is prefixed
  with `[rule: <id>]` to satisfy acceptance example 8.
- `tools/handlers/` — one file per rule kind:
  `unique_field.ts`, `required_fields.ts`, `enum_constraint.ts`,
  `references_resolve.ts`, `edge_endpoint_types.ts`, `indexes_fresh.ts`.
- `tsconfig.json` — `target: ES2022`, `module: ESNext`,
  `moduleResolution: bundler`, `strict: true`, `noEmit: true`. Used by
  `tsx` and editor tooling, not for build output.
- `package.json` — see scripts and deps below.
- `tests/fixtures/good/` — minimal valid graph (one intent, one
  contract, one `proposes` edge, the four expected index files).
- `tests/fixtures/bad/<case>/` — one directory per acceptance example
  (1–7 from contract A, 8–10 from contract B). Each contains the broken
  graph plus an `expected-errors.txt` file.
- `tests/spec.test.ts` — runs the index and validate commands against
  each fixture, asserts exit codes and error strings, and asserts
  byte-identical re-runs of `index`.

## Files to modify

- `specs/schema/validation-rules.yaml` — replace `rules: []` with the
  bootstrap rule set (see "Validation checks" below).

## package.json script entries

```json
{
  "scripts": {
    "spec:index": "tsx tools/spec.ts index",
    "spec:validate": "tsx tools/spec.ts validate",
    "test": "node --test --import tsx tests/spec.test.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

## Library choices

- **Runtime dependency:** `js-yaml` (only). All YAML parsing and
  emission goes through it.
- **Dev dependencies:** `typescript`, `tsx`, `@types/node`,
  `@types/js-yaml`.
- **Test runner:** `node --test` (Node's built-in runner). No extra
  dependency.
- **No** frontmatter library — split on the first two `---` lines and
  pass the inner block to `js-yaml`. Markdown body is treated as opaque.

## Validation checks in execution order

The validator loads the rule set from `validation-rules.yaml` and runs
each rule in the order it appears. The bootstrap file must list them in
this order, chosen so that each rule can assume the preconditions
established by the earlier ones:

1. **`required_fields` (scope: nodes)** — for each node, perform a
   uniform frontmatter-key check that every field listed in
   `node-types.yaml[<type>].required_fields` is present, then perform a
   separate non-empty-body check driven by
   `node-types.yaml[<type>].requires_body` (if `true`, assert the
   markdown body after the frontmatter delimiter is non-empty after
   trimming). Run first: downstream rules need `id` and `type` to
   exist.
2. **`required_fields` (scope: edges)** — assert each edge has `id`,
   `source`, `type`, `target`, `created`.
3. **`enum_constraint` (scope: nodes, field: type, source:
   node-types.yaml)** — assert `node.type` is a declared key. Filters
   out unknown-type nodes before rules that read per-type config.
4. **`enum_constraint` (scope: edges, field: type, source:
   edge-types.yaml)** — assert `edge.type` is a declared key.
5. **`unique_field` (scope: nodes, field: id)** — assert no duplicate
   node ids. Error names every file that declares the colliding id.
6. **`unique_field` (scope: edges, field: id)** — assert no duplicate
   edge ids.
7. **`enum_constraint` (scope: nodes, field: status, source:
   node-types.yaml[<type>].status_values)** — per-type status check,
   skipped for `decision` (no `status_values` declared).
8. **`references_resolve` (scope: edges, fields: [source, target])** —
   assert each endpoint id resolves to a known node. Unresolved
   endpoints are also written to `specs/indexes/unresolved.yaml` (the
   only index file `validate` writes; the rest come from `index`).
9. **`edge_endpoint_types`** — for each edge, look up its type in
   `edge-types.yaml`, then:
   - if rule says `source: any`, skip the source-type assertion
     (`any` means no constraint; never compare `any` as a literal
     type name);
   - if rule says `source: <T>`, assert `source.type === T`;
   - if rule says `target: <T>`, assert `target.type === T`;
   - if rule says `target: same_as_source`, assert
     `target.type === source.type`.
10. **`indexes_fresh`** — run the indexer in-memory and compare each
    serialized index against the committed file under `specs/indexes/`.
    Any byte-level difference is an error naming the drifted file.
    Last because it depends on every prior rule passing for a
    meaningful diff.

The validator collects errors from all rules (does not short-circuit on
the first failure) so a single run reports every problem.

## Bootstrap `validation-rules.yaml`

```yaml
rules:
  - id: nodes-required-fields
    kind: required_fields
    scope: nodes
  - id: edges-required-fields
    kind: required_fields
    scope: edges
  - id: nodes-type-declared
    kind: enum_constraint
    scope: nodes
    field: type
    source: node-types.yaml
  - id: edges-type-declared
    kind: enum_constraint
    scope: edges
    field: type
    source: edge-types.yaml
  - id: nodes-id-unique
    kind: unique_field
    scope: nodes
    field: id
  - id: edges-id-unique
    kind: unique_field
    scope: edges
    field: id
  # Types without status_values (e.g. decision) are skipped by this
  # handler; they are still covered by required_fields — not unvalidated.
  - id: nodes-status-in-enum
    kind: enum_constraint
    scope: nodes
    field: status
    source: node-types.yaml
  - id: edges-references-resolve
    kind: references_resolve
    scope: edges
    fields: [source, target]
  - id: edges-endpoint-types
    kind: edge_endpoint_types
  - id: indexes-fresh
    kind: indexes_fresh
```

## Out of scope (explicit)

- Arbitrary JS/JSONata/CEL expressions in rules. The `kind` vocabulary
  is closed at the six kinds above; new shapes require a new handler
  file and a code review.
- Per-rule severity levels, suppression syntax, or `// eslint-disable`-
  style inline opt-outs.
- Auto-fix or `--write` mode. `validate` is read-only; only `index`
  writes (and only to `specs/indexes/`).
- Watch mode, incremental loads, or partial graph operation.
- Any HTTP server, language-server, or editor-integration surface.
- Loading rules from anywhere other than
  `specs/schema/validation-rules.yaml`. No `--rules` flag, no env
  override, no inheritance.
- Generating reports under `specs/reports/`. That belongs to a future
  brief.
- A formal JSON-schema or zod-style schema for the rule file. The
  dispatcher does a manual structural check sufficient to produce a
  clear error on a malformed rule.

## Verification

- `pnpm install && pnpm typecheck && pnpm test` is green.
- Locally and in CI:
  `pnpm spec:index && git diff --exit-code specs/indexes/ && pnpm spec:validate`
  succeeds. The implementation PR commits the generated indexes; the
  freshness check runs before the validate gate so drift is caught as
  drift, not as a validate failure.
- Each `tests/fixtures/bad/<case>/` produces the exact error strings
  pinned in its `expected-errors.txt`.
- Removing `indexes-fresh` from `validation-rules.yaml` and re-running
  `pnpm spec:validate` on a graph with hand-edited index drift exits 0
  (proves the rule is loaded from YAML, not baked in — acceptance
  example 10).
