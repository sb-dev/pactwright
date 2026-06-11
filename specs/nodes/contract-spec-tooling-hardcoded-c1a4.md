---
id: contract-spec-tooling-hardcoded-c1a4
type: contract
title: spec:index + spec:validate as a single hardcoded TS script
status: rejected
created: 2026-06-11
---

## Problem interpretation

The graph is small and the rule set required by the intent is closed and
enumerable (seven checks listed under "What `spec:validate` must check"
plus four index outputs). The cheapest way to address the intent is to
write those rules directly as code, ship now, and revisit if the rule
set actually grows.

## Scope

- One TypeScript entry point (`tools/spec.ts`) exposing two subcommands:
  `index` and `validate`. Wired to `pnpm spec:index` / `pnpm spec:validate`
  via `package.json` scripts.
- Runtime dependency: `js-yaml` only. Dev deps: `typescript`, `tsx` (or
  equivalent runner), `@types/js-yaml`.
- Loader reads every `specs/nodes/*.md` (frontmatter + body) and
  `specs/graph/edges.yaml`. Schema files (`node-types.yaml`,
  `edge-types.yaml`) are read for the enum/required-field/endpoint-type
  checks. `validation-rules.yaml` is **not** consulted — it stays a stub
  for a future iteration.
- `index` writes the four files under `specs/indexes/` with stable key
  ordering (sorted by id) and stable YAML formatting (single quote style,
  no anchors, trailing newline) so re-runs are byte-identical.
- `validate` runs the seven hardcoded checks. On any failure: non-zero
  exit, human-readable error list on stderr, and `indexes/unresolved.yaml`
  written for the dangling-endpoint case.
- Drift check: `validate` re-runs the index generator in-memory and
  diffs against the committed files in `specs/indexes/`.

## Non-scope

- A pluggable rule engine.
- Reading or honouring `validation-rules.yaml`.
- Auto-fix / `--write` mode for validate.
- Watch mode, partial graph loads, or incremental indexing.
- Any HTTP / language-server surface.

## Trade-offs

- **+** Smallest diff. One file of code, ~300–500 lines, no abstraction
  layer between the rule and its enforcement.
- **+** Each check reads as imperative TypeScript, so error messages
  can be precisely tuned per check without templating.
- **−** Adding a new invariant later requires editing `tools/spec.ts`
  and shipping code — not a YAML edit.
- **−** `validation-rules.yaml` stays a placeholder, so the schema
  directory advertises a capability it doesn't actually have.

## Risks

- Drift between what `node-types.yaml` declares and what the hardcoded
  validator enforces — e.g. someone adds a new node type to the schema
  but forgets to extend the validator.
- If the rule set grows in later phases (likely — `validation-rules.yaml`
  exists for a reason), we will end up rewriting toward Candidate B
  anyway, paying the migration cost on top.

## Acceptance examples

Concrete graphs and their required tool behaviour:

1. **Dangling target.** `edges.yaml` contains
   `{id: edge-foo-1234, source: contract-x-aaaa, type: proposes,
   target: intent-missing-zzzz}` but `intent-missing-zzzz.md` does not
   exist. → `spec:validate` exits non-zero; `indexes/unresolved.yaml`
   contains `- {edge: edge-foo-1234, missing: target, value: intent-missing-zzzz}`.
2. **Duplicate node id.** Two files in `specs/nodes/` both declare
   `id: intent-x-7f3a`. → `spec:validate` exits non-zero with
   `duplicate node id intent-x-7f3a in <fileA>, <fileB>`.
3. **Wrong endpoint type.** Edge `proposes` whose `source` resolves to a
   `brief` node. → `spec:validate` errors
   `edge <id> type=proposes requires source.type=contract, got brief`.
4. **`supersedes` across types.** Edge `supersedes` from a `contract`
   to an `intent`. → `spec:validate` errors
   `edge <id> type=supersedes requires target.type == source.type
   (contract), got intent`.
5. **Missing required field.** A node file omits `status` in frontmatter.
   → `spec:validate` errors `node <id> missing required field: status`.
6. **Index drift.** Hand-edit `specs/indexes/by-type.yaml` to remove a
   real node. → `spec:validate` errors `indexes drifted: by-type.yaml`
   and exits non-zero.
7. **Determinism.** `pnpm spec:index && git diff --exit-code specs/indexes`
   succeeds on an unchanged graph.

## Verification needs

- Fixture-based tests: a `tests/fixtures/` tree of small good-graph and
  bad-graph snapshots, each bad fixture pinned to the exact error string
  it must produce.
- Snapshot test of the four generated index files against a golden
  good-graph fixture.
- Determinism test: run `index` twice on the same input, assert
  byte-identical output.
- CI invokes `pnpm spec:validate` on the real `/specs` tree; PR is
  blocked on non-zero exit.
