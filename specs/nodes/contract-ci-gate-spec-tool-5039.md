---
id: contract-ci-gate-spec-tool-5039
type: contract
title: Graph-aware PR gate as a tools/spec.ts subcommand
status: candidate
created: 2026-06-13
---

## Problem interpretation

The intent (`intent-ci-enforcement-gates-5c90`) wants GitHub Actions to
enforce, on every PR, that the spec graph stays trustworthy (schema valid,
indexes not drifted) and that code changes carry evidence — unless a human
signs an override. The load-bearing piece is `pr-evidence`: it must read the
`edges.yaml` diff and decide pass/fail using graph *semantics* — an added
`evidences` edge only counts if its target brief `decomposes` a contract
that is `approved`. That is exactly the node/edge resolution `tools/spec.ts`
already performs for `spec:index`/`spec:validate`. This candidate puts the
decision where the graph model already lives: a new `spec:gate` subcommand.
Workflows stay thin shims that call pnpm scripts. The schema migration lands
first so everything else can reference `override`/`waives`.

Shared reading of the schema migration: `override` node type with
required_fields exactly `[id, type, title, reason, approved_by, expires]`
(the intent's list — no `status`, like `decision`; `created` permitted but
not required) and a `waives` edge type. A named check (`pr-evidence`) is not
a node, so this candidate teaches `spec:validate` a small allowlist of check
names that a `waives` target may resolve to instead of a node.

## Scope

- **Schema migration (first commit).**
  - `node-types.yaml`: add `override` (required_fields above,
    `requires_body: true`, no status enum).
  - `edge-types.yaml`: add `waives` (source `override`; target a node *or* a
    named check from the allowlist).
  - Register a check-name allowlist `[ci, spec-index, spec-validate,
    pr-evidence]`; a `waives` edge to one of these is valid and exempt from
    node-resolution, any other `waives` target resolves to a node as usual.
  - Extend `tools/spec.ts` validate to accept the new types and the
    allowlist rule; `by-type.yaml` automatically gains an `override:` group.
- **`spec:gate` subcommand** in `tools/spec.ts` + `package.json` script
  `"spec:gate": "tsx tools/spec.ts gate"`. Given a base ref (env `GATE_BASE`,
  default the PR base): run `git diff <base>...HEAD -- specs/graph/edges.yaml
  specs/nodes/`, parse the *added* edges/nodes, fold them into the existing
  graph model, and pass iff **either** (a) an added `evidences` edge whose
  target brief `decomposes` a contract with `status: approved`, **or** (b) an
  added `override` node together with an added `waives` edge whose target is
  the named check `pr-evidence`. Non-zero exit with a human-readable reason.
- **Workflows (`.github/workflows/`), thin:**
  - `ci.yml` — every PR: `pnpm install`, `pnpm test`, `pnpm typecheck`,
    `pnpm lint`.
  - `spec-index.yml` — every PR: `pnpm spec:index`, then
    `git diff --exit-code specs/indexes/`.
  - `spec-validate.yml` — PRs touching `specs/**`: `pnpm spec:validate`.
  - `pr-evidence.yml` — PRs, `paths-ignore` skipping PRs that touch only
    `specs/**` or `docs/**`: `fetch-depth: 0` checkout, `pnpm spec:gate` with
    base = `github.event.pull_request.base.sha`.
- **`lint` toolchain.** No linter exists today; add a minimal one (e.g.
  eslint flat config + a `"lint"` script) so `ci.yml`'s lint step is real.
- **`.github/CODEOWNERS`**: `/specs/schema/ @<reviewer>` and
  `/specs/nodes/contract-* @<reviewer>`. The intent left the handle
  truncated (`@`), so the implementer must confirm the real GitHub handle.

## Non-scope

- No change to existing lifecycle node/edge semantics beyond adding
  `override`/`waives`.
- No branch-protection configuration in code — that is repo-admin settings
  (a documented manual step; the workflows only emit pass/fail).
- No new lifecycle commands or skills.

## Trade-offs

- **+** Reuses the existing js-yaml parsing and in-memory graph model; the
  2-hop `evidences → brief → approved-contract` check is a few lines against
  a model that already resolves edges, not bespoke YAML scraping.
- **+** One source of truth for graph semantics: `spec:validate` and
  `spec:gate` share the loader, so the gate cannot drift from what
  validation considers a well-formed graph.
- **+** Runnable locally (`pnpm spec:gate`) before pushing; unit-testable via
  the existing `node --test` harness.
- **−** Grows `tools/spec.ts` with a new concern it never had: awareness of
  git diffs and a base ref. The tool stops being a pure function of the
  working tree.
- **−** Adds public surface (`spec:gate`) to keep stable and documented.
- **−** The check-name allowlist is a special case in validation — a small
  wart to remember when reasoning about `waives` targets.

## Risks

- **Base-ref correctness in CI.** A shallow checkout or wrong base SHA makes
  the diff empty and the gate falsely pass/fail. Mitigation: `fetch-depth: 0`
  and pass `pull_request.base.sha` explicitly; gate errors loudly if the base
  ref is unresolvable.
- **Diff vs. merged-state mismatch.** "Added edges" from a diff can disagree
  with the true merge result under concurrent base changes. Mitigation:
  compute against the PR merge base; re-run on rebase.
- **Allowlist staleness.** A renamed check leaves a `waives` target
  accepted-but-meaningless. Mitigation: the allowlist is the single registry;
  validate errors on `waives` to an unknown name.

## Acceptance examples

1. **Schema first.** After the migration commit, `pnpm spec:validate` is
   green, `override`/`waives` appear in the schema, and an `override` group
   exists in `specs/indexes/by-type.yaml`.
2. **Blocked without evidence.** A PR editing code (`tools/*.ts`) with no
   `evidences` edge fails `pr-evidence.yml` (`pnpm spec:gate` non-zero) with
   a message naming the missing evidence.
3. **Unblocked by evidence.** A PR whose `edges.yaml` diff adds an
   `evidences` edge whose target brief `decomposes` an `approved` contract
   passes `pr-evidence.yml`.
4. **Unblocked by override.** A PR adding an `override` node (with `reason`)
   plus a `waives` edge targeting named check `pr-evidence` passes
   `pr-evidence.yml`, and the override id is listed under `by-type: override`
   in `specs/indexes/by-type.yaml`.
5. **Index drift caught.** A PR hand-editing `specs/indexes/by-type.yaml`
   without regenerating fails `spec-index.yml` on `git diff --exit-code`.
6. **Skips.** A docs-only or specs-only PR does not run `pr-evidence.yml`.

## Verification needs

- A scratch-branch PR per acceptance example (2–6), observing the relevant
  check red/green.
- `node --test` cases for `spec:gate`: synthetic edges/nodes diffs exercising
  both pass clauses and the no-evidence fail.
- `pnpm spec:validate` green on the real tree after the migration and after
  an override+waives pair is added.
- Confirm the CODEOWNERS handle and that branch protection marks
  `pr-evidence` a required check (documented step).

## Critique

- **Local `spec:gate` has no defined base.** The subcommand defaults the
  base ref to "the PR base," which does not exist outside CI. The contract
  never says what `pnpm spec:gate` does on a developer's machine — error, or
  diff against an `origin/main` merge-base? Until pinned, the "runnable
  locally" benefit is unspecified behaviour.
- **"Named check" string is underspecified.** The allowlist mixes what may
  be workflow filenames, job names, and GitHub check-run names
  (`ci, spec-index, spec-validate, pr-evidence`). A `waives` edge "naming
  check pr-evidence" must match one exact string; the contract does not say
  which namespace that string lives in, so a brief cannot implement the
  match deterministically.
- **`expires` is required but never read.** The override carries a mandatory
  `expires` field, yet no clause in the gate consults it. An expired
  override still waives. Either the gate must reject overrides past
  `expires`, or the field is decorative — the contract should say which.
- **The gate is trivially satisfiable.** The pass rule accepts *any* added
  `evidences` edge to *any* approved contract — it is not tied to the code
  the PR actually changes. A contributor can add a throwaway `evidences`
  edge pointing at an old approved contract and pass without real evidence
  for this change. The contract implements the intent literally but should
  name this gap (or propose binding evidence to the diff).
- **Skipped-required-check pitfall, unaddressed.** Path filtering via
  `paths-ignore` means `pr-evidence` never runs on specs-only/docs-only PRs;
  if it is also a *required* status check, GitHub blocks those PRs waiting on
  a check that never reports. The contract relies on branch protection for
  "blocked" but does not resolve this interaction (the usual fix — an
  always-running job reporting neutral/success — is absent).
- **The allowlist is a second source of truth** for check names that must be
  kept in lockstep with the actual workflow/check names; the contract names
  the risk but offers no mechanism to keep them in sync.
