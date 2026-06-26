---
id: evidence-patch-market-gate-2e3f
type: evidence
title: Patch-market gate, structural rules, and fixes landed (domain-backend lane)
status: final
created: 2026-06-25
produced_by: "/prepare-evidence"
---

Evidence that `brief-patch-market-gate-b7e2` (the `domain-backend` lane of `contract-patch-market-ci-gate-6b7e`, proposing `intent-patch-market-synthesis-3b1e`) is implemented.

## What landed (code & project files)
- `tools/patch_gate.ts` — the diff-aware `spec:patch-gate`: a pure `evaluatePatchGate(spec, input)` + `runPatchGate`, reusing `gitdiff.ts` and `toDateString`; graph-first PR→brief mapping (`patch.branch == head → competes-for` brief) with an unambiguous fail-closed default (Fix 3); `waives → patch-comparison` override (`PATCH_COMPARISON_CHECK`).
- `tools/handlers/synthesis_parentage.ts` and `tools/handlers/selected_patch_comparison.ts` — the two structural validate rules; registered in `tools/validator.ts`, declared in `validation-rules.yaml`.
- `tools/handlers/coverage_traversal.ts` — ONE shared predicate set (`competingPatches`, `liveCompetitors`, `comparedCompetitors`, `patchMarketResolved`) reused by BOTH the gate and `selected_patch_comparison` (Graft A — no two-places drift); `liveSourcesByEdge`'s `excludeStatus` generalised to a set (Fix 2: excludes `superseded` AND `selected`).
- Fix 1 — type-guarded `intentsForContract` callers to `type === "contract"` in `class_market_quorum.ts`, `comparison_required.ts`, AND `coverage_coherence.ts` (3 sites).
- `tools/spec.ts` (`patch-gate` dispatch), `package.json` (`spec:patch-gate` script), `tests/spec.test.ts` (usage-string assertion synced to the new subcommand list).
- Committed as `270f68c`.

## Verification (run 2026-06-25)
- `node_modules/.bin/tsc --noEmit` → OK; `node_modules/.bin/eslint .` → clean.
- `node --test --import tsx tests/*.test.ts` → 181 tests, 181 pass, 0 fail.
- `node_modules/.bin/tsx tools/spec.ts validate` → OK, 20 rules, 0 errors; `spec:patch-gate` smoke on a non-patch branch → PASS ("not a patch-market merge").
- A correctness gap caught by the parity test (`competingPatches` was passing `undefined`, which JS swallows into `liveSourcesByEdge`'s `"superseded"` default — silently excluding superseded losers) was fixed to pass `[]`; red→green confirmed.

## Touches
- `capability-spec-tooling-1a2b` (owns `tools/**`; extended in this PR to also own `package.json`).
- `capability-spec-schema-2c3d` (`specs/schema/validation-rules.yaml`, a sensitive path).
- `capability-spec-tests-3a6e` (`tests/spec.test.ts`).

## Capability ownership (extend-a-capability resolution)
`package.json` was owned by no capability (the `/prepare-evidence` STOP-and-ask). Resolved in this PR by extending `capability-spec-tooling-1a2b` `paths` from `[tools/**]` to `[tools/**, package.json]` — the project manifest defines the `spec:*` tooling scripts, so it belongs to the tooling capability.
