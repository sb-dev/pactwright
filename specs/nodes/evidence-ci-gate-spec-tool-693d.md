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
6. **Skips** — `pr-evidence.yml` decides the specs-only/docs-only skip inside
   the job (early exit 0); `spec-validate.yml` is `paths: ['specs/**']`.

## Amendment-driven hardening verified

- **expires enforced** — expired-override unit test fails the gate with an
  `expired` reason.
- **valid base required** — `GATE_BASE=nope pnpm spec:gate` →
  `spec: base ref 'nope' does not resolve to a commit ...`, exit 1 (a bug
  found and fixed during verification: an invalid base previously made the
  whole graph look "added").
- **named check pinned** — a `waives → spec-validate` (wrong check) unit test
  does not satisfy the `pr-evidence` gate.

## Known v1 limitation (accepted in the decision)

The gate is satisfied by any qualifying `evidences` edge; it is not bound to
the specific paths the PR changed. Tightening is a future superseding
contract.
