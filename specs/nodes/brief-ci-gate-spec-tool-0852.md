---
id: brief-ci-gate-spec-tool-0852
type: brief
title: Implement the graph-aware PR gate, schema migration, and CI workflows
status: implemented
created: 2026-06-13
---

Decomposes `contract-ci-gate-spec-tool-5039` (approved), honoring the nine
amendments in `decision-ci-gate-spec-tool-6d2b`. Ordered so each step keeps
`pnpm spec:validate` green.

## Grounding (what already exists — reuse, don't reinvent)

- `tools/spec.ts` — CLI dispatch (`index` | `validate`). Add a third
  subcommand here.
- `tools/loader.ts` — `loadSpec()` builds the graph model (`nodes`, `edges`,
  `nodeTypes`, `edgeTypes`, `rules`) plus helpers `asString`,
  `compareStrings`, `nodesById`. The gate reuses this loader for the HEAD
  graph.
- `tools/validator.ts` — rule runner; handlers registered in `HANDLERS`.
- `tools/handlers/*` — one file per rule kind. `edge_endpoint_types.ts`
  already skips the target-type check when an edge type's `target: any`
  (line ~38) and still enforces `source`; so a `waives` edge needs NO change
  here. `references_resolve.ts` is the ONLY handler that breaks on a
  `waives → pr-evidence` edge (it requires every target to resolve to a node
  id) — it is the one handler to amend.
- `tools/yaml.ts` — `fromYaml` / deterministic `toYaml`.
- `specs/schema/validation-rules.yaml` — rule list (data).
- `.github/CODEOWNERS` — already `/specs/schema/ @sb-dev`; the reviewer
  handle (amendment 9) is **@sb-dev**. Extend it; do not invent a handle.
- `pnpm-lock.yaml` exists (CI can use `--frozen-lockfile`). Tests are
  `node --test` with fixtures under `tests/fixtures/{good,bad}`.

## Step 1 — Schema migration (must stay green on the current graph)

- `specs/schema/node-types.yaml`: add `override` with
  `required_fields: [id, type, title, reason, approved_by, expires]`,
  `requires_body: true`, and NO `status_values` (like `decision`, the status
  enum handler then skips it). `created` is allowed but not required.
- `specs/schema/edge-types.yaml`: add `waives` with `source: override`,
  `target: any`.
- `specs/schema/checks.yaml` (NEW): `checks: [ci, spec-index, spec-validate,
  pr-evidence]` — the single registry of named-check identifiers (amendment
  2: allowlist, not nodes).
- `tools/loader.ts`: load `checks.yaml` into `LoadedSpec` as
  `checks: string[]` (mirror the existing schema-file loading; default `[]`
  if absent).
- `tools/handlers/references_resolve.ts`: when `field === "target"` and the
  edge's `type === "waives"` and the target value is in `spec.checks`, treat
  it as resolved (skip the finding). All other targets resolve to nodes as
  today. (No change to `edge_endpoint_types.ts`.)
- No override nodes or waives edges are added in this step, so
  `pnpm spec:validate` stays green. Add a `tests/fixtures/bad` case for a
  `waives` edge to an UNKNOWN check name (must fail `references_resolve`) and
  extend the good fixture / a new good case with an `override` node + a
  `waives → pr-evidence` edge (must pass).

## Step 2 — `spec:gate` subcommand (reuses the loader, isolates git I/O)

- `tools/gate.ts` (NEW), two layers:
  - **Pure decision function** `evaluateGate(spec, { addedEdgeIds,
    addedNodeIds, today }): { pass: boolean; reason: string }` — no git, no
    fs — so it is unit-testable. Pass iff EITHER:
    (a) some added edge of type `evidences` whose target brief, in the HEAD
        graph, has a `decomposes` edge to a contract whose `status` is
        `approved` (read status at HEAD — amendment 7); OR
    (b) some added edge of type `waives` with `target === "pr-evidence"`
        (pinned literal — amendment 5) whose `source` is an `override` node
        that is in `addedNodeIds` AND whose `expires` (frontmatter date) is
        >= `today` (amendment 3: reject expired overrides).
    On fail, return a human-readable reason naming what was missing.
  - **Git adapter** (same file or `tools/gitdiff.ts`): `resolveBase()` =
    `GATE_BASE` env, else `git merge-base origin/HEAD HEAD`; throw a clear
    error if unresolvable (amendment 6). `addedEdgeIds(base)` = head edge ids
    minus the ids parsed from `git show <base>:specs/graph/edges.yaml`
    (YAML-parse both sides and set-difference ids — amendment 1: never scrape
    +/- lines). `addedNodeIds(base)` = head node ids whose file is absent from
    `git ls-tree -r --name-only <base> specs/nodes`.
- `tools/spec.ts`: add `gate` to the subcommand union and USAGE; on `gate`,
  load spec, resolve base + diffs, call `evaluateGate`, print the reason,
  exit `0` on pass / `1` on fail.
- `package.json`: add script `"spec:gate": "tsx tools/spec.ts gate"`.
- `tests/gate.test.ts` (NEW): unit-test `evaluateGate` over synthetic
  `LoadedSpec` + added-id sets for: clause (a) pass, clause (b) pass, expired
  override (fail), waives to wrong check name (fail), and no-evidence (fail).

## Step 3 — Workflows (`.github/workflows/`)

Provision via `pnpm/action-setup` + `actions/setup-node` (cache pnpm);
`pnpm install --frozen-lockfile`. On `pull_request`:
- `ci.yml` — every PR: `pnpm test`, `pnpm typecheck`, `pnpm lint`.
- `spec-index.yml` — every PR: `pnpm spec:index` then
  `git diff --exit-code specs/indexes/` (drift fails).
- `spec-validate.yml` — `paths: ['specs/**']`: `pnpm spec:validate`.
- `pr-evidence.yml` — every PR, `fetch-depth: 0`. FIRST step decides the
  skip INSIDE the job (amendment 4): compute changed files
  (`git diff --name-only <base>...HEAD`); if all match `^(specs|docs)/`,
  echo "skip" and `exit 0` (the required check still reports success); else
  run `pnpm spec:gate` with `GATE_BASE` =
  `${{ github.event.pull_request.base.sha }}`. Do NOT use workflow-level
  `paths-ignore` for this required check.

## Step 4 — Lint toolchain (ci.yml's lint step must be real)

- Add `eslint` + `typescript-eslint` + `@eslint/js` (devDependencies) and a
  minimal flat `eslint.config.js` covering `tools/**` and `tests/**`
  (recommended rules). `package.json` script `"lint": "eslint ."`. Get the
  existing TypeScript to green (fix or scope rules); keep the config minimal —
  this is the smallest piece that makes `pnpm lint` meaningful.

## Step 5 — CODEOWNERS + enforcement docs

- `.github/CODEOWNERS`: add `/specs/nodes/contract-* @sb-dev` (keep the
  existing schema rule).
- `docs/branch-protection.md` (NEW): document that `ci`, `spec-index`,
  `spec-validate`, `pr-evidence` are REQUIRED status checks and that
  CODEOWNERS review is required on `/specs/schema/` and
  `/specs/nodes/contract-*` (amendment 2). This file is documentation; the
  actual branch-protection settings are applied by a repo admin (non-scope).

## Acceptance (maps to the contract)

1. Post-migration `pnpm spec:validate` green; `override`/`waives` in schema;
   an `override` group appears in `specs/indexes/by-type.yaml` once an
   override node exists.
2. A code-only PR with no `evidences` edge → `pr-evidence` (`pnpm spec:gate`)
   exits non-zero.
3. A PR adding an `evidences` edge whose target brief `decomposes` an
   `approved` contract → `pr-evidence` passes.
4. A PR adding an `override` node (non-empty `reason`, future `expires`) plus
   a `waives → pr-evidence` edge → `pr-evidence` passes; the override is
   listed under `by-type: override`.
5. Hand-editing an index without regenerating → `spec-index` fails on
   `git diff --exit-code`.
6. A docs-only / specs-only PR is skipped inside `pr-evidence` (reports
   success), and `spec-validate` runs for specs-touching PRs.

## Non-scope

- Applying the actual GitHub branch-protection settings (repo-admin action;
  only documented here).
- Binding evidence to the specific changed paths — the gate is satisfiable by
  any qualifying `evidences` edge (accepted v1 limitation, amendment 8); a
  future superseding contract may tighten it.
- Any new node/edge types beyond `override` + `waives` (+ the `checks.yaml`
  registry); no changes to existing lifecycle semantics.
- Modeling checks as nodes, `yq`/shell gate logic, or workflow-level
  `paths-ignore` on required checks (explicitly rejected in the decision).

## Bootstrapping note

The PR that implements this brief itself changes code, so once
`pr-evidence.yml` exists it will run on that PR. Satisfy it the lifecycle
way: the `prepare-evidence` step adds an `evidences` edge for this brief
(clause a) before the PR is merged — no override needed.
