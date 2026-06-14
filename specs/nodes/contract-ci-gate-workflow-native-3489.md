---
id: contract-ci-gate-workflow-native-3489
type: contract
title: Workflow-native PR gate; tools/spec.ts stays diff-agnostic
status: rejected
created: 2026-06-13
---

## Problem interpretation

Same intent (`intent-ci-enforcement-gates-5c90`). This candidate draws the
boundary differently: `tools/spec.ts` should remain a pure function of the
working tree (load nodes/edges → index/validate), with no knowledge of git,
base refs, or PRs. Diffing two refs is a CI concern, so the `pr-evidence`
decision lives in the workflow that runs it. The schema migration still lands
first (so `override`/`waives` validate), but the gate is a self-contained
step in `pr-evidence.yml`.

Shared reading of the schema migration matches the sibling candidates
(`override` node type with the intent's exact required_fields; `waives` edge
type). Named-check waivers are matched by the workflow directly: it inspects
the `edges.yaml` diff for an added `waives` edge with target `pr-evidence`
plus a co-added `override` node — so validation need not special-case check
names; instead `waives` is typed with target `any` and node-resolution is
relaxed for `waives` only.

## Scope

- **Schema migration (first commit):** the same `override`/`waives`
  additions. `waives` target = `any`; node-resolution is not required for
  `waives` targets (so a literal `pr-evidence` is legal without an allowlist).
- **`pr-evidence.yml` carries the logic:** `fetch-depth: 0` checkout;
  `git diff <base>...HEAD -- specs/graph/edges.yaml`; a self-contained step
  (a committed `tools/pr-evidence.mjs` run only by CI, or `yq`+`bash`) that
  (a) collects added `evidences` edges and, for each, resolves target brief →
  `decomposes` contract → checks `status: approved` by reading the committed
  node files, OR (b) detects an added `override` node + added
  `waives → pr-evidence`. Non-zero exit with reason.
- **`ci.yml`, `spec-index.yml`, `spec-validate.yml`:** identical thin shims
  to the sibling candidates (install/test/typecheck/lint; index + `git diff
  --exit-code specs/indexes/`; validate on `specs/**`). The `lint` toolchain
  is introduced as shared scope.
- **`.github/CODEOWNERS`:** the same two rules (handle to be confirmed; the
  intent truncated it to `@`).
- Path filters: pr-evidence skips specs-only/docs-only; spec-validate runs on
  `specs/**`.

## Non-scope

- No new `pnpm` command for the gate; no `spec:gate`. `tools/spec.ts`
  unchanged except for accepting the new node/edge types.
- No branch-protection config in code (documented manual step).
- No graph-model refactor.

## Trade-offs

- **+** `tools/spec.ts` stays single-purpose and side-effect-free — no git,
  no base ref, no diff parsing creeping into the validator.
- **+** The merge-gate logic is visible in the workflow that enforces it;
  reading `pr-evidence.yml` tells you exactly what blocks a merge.
- **+** No new public command surface to keep stable and documented.
- **−** Re-implements graph traversal (brief → contract → status) that
  `spec:validate` already encodes, in a second place and possibly a second
  language (shell/`yq` or a separate `.mjs`) → real drift risk: the gate's
  notion of "approved contract reachable" can diverge from the validator's.
- **−** Harder to unit-test: logic embedded in YAML/CI is awkward to exercise
  without running Actions; brittle text/`yq` parsing of diffs.
- **−** No local dry-run: a contributor cannot reproduce the gate without
  pushing (or hand-running the CI snippet).

## Risks

- **Brittle diff parsing.** Line-oriented `git diff` of `edges.yaml` can
  misattribute added vs. context lines (e.g. reordered blocks). Mitigation:
  parse whole-file before/after with a YAML reader inside the step and
  set-difference the edge IDs, rather than scraping `+` lines.
- **Drift between gate and validator.** As in the trade-off; mitigation:
  factor the read/traverse into a tiny shared module imported by both — but
  that erodes the "tool stays pure" premise, which is exactly the tension a
  human should weigh here.
- **Base-ref / shallow-clone issues:** as in the sibling candidates.

## Acceptance examples

1. **Schema first.** As in `contract-ci-gate-spec-tool-5039` example 1.
2. **Blocked without evidence.** A code-only PR with no `evidences` edge
   fails `pr-evidence.yml` (the workflow step exits non-zero).
3. **Unblocked by evidence.** Added `evidences` edge → target brief
   `decomposes` an `approved` contract → `pr-evidence.yml` green.
4. **Unblocked by override.** Added `override` node (with `reason`) +
   `waives → pr-evidence` → `pr-evidence.yml` green; override listed under
   `by-type: override` in `specs/indexes/by-type.yaml`.
5. **Index drift caught / skips:** as in `contract-ci-gate-spec-tool-5039`
   examples 5–6.

## Verification needs

- Scratch-branch PRs for each example, observing checks.
- If a `tools/pr-evidence.mjs` is used, `node --test` over it with synthetic
  before/after edge sets; if pure-shell, a documented manual matrix instead.
- `pnpm spec:validate` green on the real tree post-migration.
- CODEOWNERS handle + branch-protection required-check confirmation
  (documented).

## Critique

- **The core implementation is left undecided.** The gate may be a committed
  `tools/pr-evidence.mjs` *or* `yq`+`bash` — very different artifacts with
  different drift, portability, and test stories. A brief cannot proceed
  until one is chosen; as written this is a fork, not a contract.
- **Self-undermining premise.** The headline benefit is "tools/spec.ts stays
  pure," but the stated drift mitigation is "factor a shared module imported
  by both," which reintroduces shared graph code and erodes the very purity
  that justifies the candidate. The tension is acknowledged but unresolved.
- **Silent waiver failure.** Relaxing node-resolution for `waives` targets
  means a mistyped check name (`pr-evidnce`) passes validation, the gate
  never matches it, and the PR is blocked with no diagnostic pointing at the
  typo. Unlike an allowlist, nothing catches an unrecognised target.
- **`yq` portability.** GitHub runners ship a different `yq` than many
  developers expect (Go vs Python forks with incompatible syntax); a
  `yq`-based step risks "works in CI, breaks locally" or vice-versa. The
  contract pins neither tool nor version.
- **Duplicated traversal, no shared types.** A CI-only `.mjs` re-implements
  the brief → contract → `status: approved` resolution that `tools/spec.ts`
  already encodes, in a file with no shared types — exactly the drift the
  validator exists to prevent, reintroduced at the gate.
- **Shared gaps inherited:** `expires` is unread; the gate is trivially
  satisfiable by an unrelated `evidences` edge; the `paths-ignore` vs.
  required-status-check interaction is unaddressed (as in the siblings).
