---
id: evidence-ci-gate-spec-tool-693d
type: evidence
title: Graph-aware PR gate, schema migration, and CI workflows landed and verified
status: final
created: 2026-06-13
---

Evidence that `brief-ci-gate-spec-tool-0852` (decomposing
`contract-ci-gate-spec-tool-5039`, intent `intent-ci-enforcement-gates-5c90`)
is implemented. Implementation commit: `b2d0f0f` on branch
`claude/dazzling-brown-46m1ae`.

## Files landed

- Schema: `specs/schema/node-types.yaml` (+`override`),
  `specs/schema/edge-types.yaml` (+`waives`), `specs/schema/checks.yaml`
  (NEW allowlist).
- Tooling: `tools/loader.ts` (loads `checks`, defaults `[]`),
  `tools/handlers/references_resolve.ts` (exempts a `waives` target that is a
  known check), `tools/gate.ts` (NEW: pure `evaluateGate` + git adapter),
  `tools/spec.ts` (`gate` subcommand), `package.json`
  (`spec:gate` + `lint` scripts, eslint devDeps).
- Workflows: `.github/workflows/{ci,spec-index,spec-validate,pr-evidence}.yml`.
- Project: `eslint.config.js`, `.github/CODEOWNERS` (+`/specs/nodes/contract-*`),
  `docs/branch-protection.md`.
- Tests: `tests/gate.test.ts` (NEW), `tests/spec.test.ts` (usage + good-waives),
  fixtures `tests/fixtures/bad/waives-unknown-check/` and
  `tests/fixtures/good-waives/`.

## Verification (run at commit b2d0f0f)

- `pnpm test` → `# tests 27 / # pass 27 / # fail 0` (8 `evaluateGate` unit
  tests covering both pass clauses, expired override, wrong check, non-added
  override; plus the two new fixtures).
- `pnpm typecheck` → clean. `pnpm lint` → clean (exit 0).
- `pnpm spec:validate` → `OK — 10 rules, 0 errors` (schema migration is inert
  on the current graph; no override nodes/waives edges exist yet).

## Acceptance mapping (contract A)

1. **Schema first / inert** — validate green post-migration; `override`/
   `waives` declared; `override` will appear under `by-type` once a node
   exists (proven by fixture `good-waives`, where an `override` +
   `waives → pr-evidence` validates).
2. **Blocked without evidence** — `GATE_BASE=HEAD pnpm spec:gate` (a code-only
   diff) → `FAIL — no added evidences edge reaching an approved contract, and
   no unexpired override waiving pr-evidence`, exit 1.
3. **Unblocked by evidence** — `evaluateGate` clause (a) unit tests pass; the
   git adapter resolves an added `evidences → brief → approved contract` chain
   (observed live during smoke testing).
4. **Unblocked by override** — `evaluateGate` clause (b) unit test passes for
   an added, unexpired `override` + `waives → pr-evidence`; the `good-waives`
   CLI fixture validates green.
5. **Index drift** — covered by the existing `indexes-fresh` rule /
   `bad/index-drift` test and the `spec-index.yml` `git diff --exit-code` step.
6. **Skips** — both `pr-evidence.yml` and `spec-validate.yml` run on **every**
   PR and decide scope *inside* the job (early exit 0 / report success when out
   of scope). Note: contract `…5039`'s Scope and acceptance example #6 describe
   `spec-validate` as event-level `paths: ['specs/**']` and `pr-evidence` via
   workflow-level `paths-ignore`; the as-built supersedes both with in-job
   scoping per decision amendment 4 — so a literal re-run of example #6 (a
   docs/specs-only PR expecting the workflow not to *fire*) is **not** a
   regression: the workflow fires and reports success without running the gate
   (see "Review-round hardening" below).

## Amendment-driven hardening verified

- **expires enforced** — expired-override unit test fails the gate with an
  `expired` reason.
- **valid base required** — `GATE_BASE=nope pnpm spec:gate` →
  `spec: base ref 'nope' does not resolve to a commit ...`, exit 1 (a bug
  found and fixed during verification: an invalid base previously made the
  whole graph look "added").
- **named check pinned** — a `waives → spec-validate` (wrong check) unit test
  does not satisfy the `pr-evidence` gate.

## Review-round hardening (PR #4 review)

Folded in from the adversarial self-review on PR #4. All within the approved
contract/brief (several map to its own Critique and decision amendments 3/4);
no new contract required.

- **`spec-validate` made required-safe** (🔴 High) — dropped the event-level
  `paths: ['specs/**']` filter; `spec-validate.yml` now runs on every PR and
  skips *inside* the job (mirrors `pr-evidence.yml`), so the required check
  always reports and can never strand a code-only PR. Closes the contract's own
  "skipped-required-check pitfall" for `spec-validate`; `docs/branch-protection.md`
  updated to match and to warn that event-level path-filtered checks must not be
  required.
- **Override no longer self-approvable** (🟠 Medium) — `.github/CODEOWNERS`
  adds `/specs/nodes/override-* @sb-dev`; since clause (b) requires an added
  `override` *node*, this forces independent code-owner review on any waiver.
  `docs/branch-protection.md` documents that override integrity depends on that
  rule + required code-owner review, and that `approved_by` is provenance, not
  authentication.
- **Git adapter fails closed** (🟠 Medium / 🟡 Low) — `tools/gate.ts` `git()`
  now throws on a failed spawn / signal (no more `?? 1`); `baseEdgeIds` proves
  file presence via `ls-tree` before `git show` and throws on an unexpected
  failure; `addedNodeIds` throws on a non-zero `ls-tree`. An infra error now
  fails the gate instead of emptying the base set and passing open.
- **`expires` calendar-checked** (⚪ nit) — `tools/yaml.ts` `fromYaml` parses
  with CORE_SCHEMA (dates as strings, no `!!timestamp` overflow-normalization),
  and `toDateString` round-trips the date components, rejecting impossible
  values like `2099-99-99` (quoted or unquoted) that previously waived far into
  the future. Inert on output: indexes/reports carry no dates, so regenerated
  files stay byte-identical (`spec:index` diff clean).
- **Clause (a) type guard** (⚪ nit) — the `decomposes` target must now be
  `type: contract`, not merely a node that is `approved` (mirrors clause (b)).
- **Coverage added** — new `tests/gate-io.test.ts` exercises the git adapter
  and `spec:gate` CLI end-to-end in throwaway git repos (`resolveBase` throw on
  bad base, `addedEdgeIds`/`addedNodeIds` vs real refs, `runGate` pass/fail, CLI
  exit codes, and a **fail-closed** test that a broken `git` yields exit 1 not
  PASS); `tests/gate.test.ts` adds missing/invalid-`expires` and non-contract
  clause-(a) cases; the `good-waives` test now asserts `override` under
  `by-type`.

Re-verified: `pnpm test` → `# tests 40 / # pass 40 / # fail 0`;
`pnpm typecheck`, `pnpm lint` clean; `pnpm spec:validate` →
`OK — 10 rules, 0 errors`; `pnpm spec:index` + `git diff --exit-code
specs/indexes/` clean (CORE_SCHEMA leaves index bytes identical).

## Known v1 limitation (accepted in the decision)

The gate is satisfied by any qualifying `evidences` edge; it is not bound to
the specific paths the PR changed. Tightening is a future superseding
contract.
