---
id: contract-ci-gate-checks-as-nodes-2d49
type: contract
title: Checks-as-nodes with platform-enforced blocking
status: candidate
created: 2026-06-13
---

## Problem interpretation

Same intent (`intent-ci-enforcement-gates-5c90`), optimized for graph
*uniformity* and for using GitHub's own enforcement primitives rather than
reinventing them. Two moves: (1) model named checks as first-class nodes
(`check-pr-evidence`, optionally `check-ci`, `check-spec-index`,
`check-spec-validate`), so a `waives` edge always targets a real node and the
existing "every edge target resolves to a node" invariant holds with zero
special-casing; (2) make *blocking* a platform concern — workflows only
compute and report pass/fail, and GitHub branch protection (required status
checks) + CODEOWNERS reviews do the actual blocking. The `pr-evidence`
computation itself reuses the graph model (a `spec:gate` subcommand, as in
`contract-ci-gate-spec-tool-5039`), so the override is discovered as "an
added `waives` edge to node `check-pr-evidence`".

Shared reading of the schema migration: `override` node type with the
intent's exact required_fields; `waives` edge type. Difference from the
siblings: also introduce a `check` node type (required_fields `[id, type,
title]`, no status) and seed the check nodes; `waives` source `override`,
target `any` — which resolves to a node like every other edge, including the
check nodes.

## Scope

- **Schema migration (first commit):**
  - `node-types.yaml`: add `override` (intent's required_fields) **and**
    `check` (required_fields `[id, type, title]`).
  - `edge-types.yaml`: add `waives` (source `override`, target `any`).
  - Seed check nodes, e.g. `specs/nodes/check-pr-evidence-*.md` (and siblings
    if desired). No validator special-case is needed; `by-type.yaml` gains
    `override:` and `check:` groups.
- **`spec:gate` subcommand** (as in the spec-tool candidate) computing the
  same two pass clauses, except override discovery = added `override` node +
  added `waives` edge whose target node id is `check-pr-evidence`.
- **Workflows:** `ci.yml`, `spec-index.yml`, `spec-validate.yml` as the thin
  shims (shared); `pr-evidence.yml` runs `pnpm spec:gate`. All four are
  *signal-only* — their job is to go red/green, not to block.
- **Enforcement layer (documented + required):** a branch-protection ruleset
  making `ci`, `spec-index`, `spec-validate`, `pr-evidence` required status
  checks, plus CODEOWNERS requiring review on `/specs/schema/` and
  `/specs/nodes/contract-*`. Captured as a committed
  `docs/branch-protection.md` (and, where the org supports it, a repo ruleset
  JSON under `.github/`).
- `lint` toolchain introduced (shared scope).

## Non-scope

- No validator allowlist for check names (checks are nodes, so unnecessary).
- No gate logic in the workflow body beyond invoking `pnpm spec:gate`.

## Trade-offs

- **+** Graph stays uniform: `waives` obeys the same "target resolves to a
  node" rule as every other edge — no special case in the validator, and
  what-can-be-waived is itself enumerable in the graph.
- **+** Waivers and the things they waive are both first-class and indexable;
  `incoming.yaml` for `check-pr-evidence` lists every override that ever
  waived it — an audit trail for free.
- **+** Blocking uses GitHub's intended mechanism (required checks +
  CODEOWNERS); the repo does not depend on subtle workflow exit semantics to
  prevent merges.
- **−** Spends a whole new node type (`check`) and seed nodes on what the
  sibling candidates handle with a 4-item allowlist — more schema surface and
  more nodes to maintain.
- **−** The real enforcement lives in branch-protection settings, which are
  repo-admin state, not fully reproducible from files (a ruleset JSON helps
  but org support varies) → risk of documented config drifting from reality.
- **−** Two-layer mental model (checks compute; platform blocks) is more to
  hold in your head than "the workflow exits non-zero and that blocks."

## Risks

- **Config drift.** `docs/branch-protection.md` says `pr-evidence` is
  required but an admin removed it; merges slip through. Mitigation: a
  periodic/meta check asserting required-check settings via the API; keep the
  ruleset JSON authoritative where supported.
- **Seed-node bootstrapping.** The first migration must add the `check` nodes
  and keep validation green in the same commit. Mitigation: land schema +
  seed nodes + reindex atomically.
- **Base-ref / diff issues:** as in the spec-tool candidate (shared, since
  the gate logic is the same TS approach).

## Acceptance examples

1. **Schema first.** Post-migration: `pnpm spec:validate` green; `override`
   and `check` groups present in `by-type.yaml`; `check-pr-evidence` exists.
2. **Blocked without evidence.** A code-only PR with no `evidences` edge →
   `pr-evidence` red; with branch protection, merge is blocked.
3. **Unblocked by evidence.** Added `evidences` edge → target brief
   `decomposes` an `approved` contract → `pr-evidence` green.
4. **Unblocked by override.** Added `override` node (with `reason`) +
   `waives → check-pr-evidence` → `pr-evidence` green; override appears under
   `by-type: override`, and `incoming.yaml` for `check-pr-evidence` lists the
   `waives` edge.
5. **Index drift caught / skips:** as in `contract-ci-gate-spec-tool-5039`
   examples 5–6.

## Verification needs

- Scratch-branch PRs per example.
- `node --test` for `spec:gate` (shared with the spec-tool approach).
- Verify branch-protection settings match `docs/branch-protection.md` (manual
  or API check) and that requiring `pr-evidence` is what makes example 2's
  "blocked" claim true.
- `pnpm spec:validate` green post-migration including the seed check nodes.
