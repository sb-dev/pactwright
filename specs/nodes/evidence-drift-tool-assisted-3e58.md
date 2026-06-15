---
id: evidence-drift-tool-assisted-3e58
type: evidence
title: Tool-assisted drift detection (brief steps 1–7) implemented and verified
status: final
created: 2026-06-14
---

Evidence that `brief-drift-tool-assisted-d4ee` (decomposing
`contract-drift-tool-assisted-7173`, intent `intent-drift-detection-c7b1`) is
implemented for brief steps 1–7 (CODE). Step 8 (capability/`touches` seeding) is
a graph write reserved for graph-maintainer and is NOT part of this
implementation; the real-graph acceptance that needs seeded capabilities is
listed under follow-up. Implemented in the working tree (uncommitted at evidence
time).

## Files landed

- **Schema (Step 1):** `specs/schema/node-types.yaml` (+`capability`,
  +`drift-finding`), `edge-types.yaml` (+`touches`, +`flags` with list target
  `[evidence, capability]`), `validation-rules.yaml`
  (+`sensitive_paths: [specs/schema/**]`), `checks.yaml` (+`check-diff`,
  +`drift`).
- **Tooling:** `tools/loader.ts` (`EdgeTypeDef.source/target: string|string[]`,
  `LoadedSpec.sensitivePaths`, shared `capabilityPaths`),
  `tools/handlers/edge_endpoint_types.ts` (list-membership endpoint rule, with
  the existing single-type messages preserved), `tools/gitdiff.ts` (NEW:
  extracted base-ref/diff adapter + `changedFiles`), `tools/gate.ts` (re-exports
  the adapter; exports `toDateString`), `tools/glob.ts` (NEW: `matchGlob`, no
  dependency), `tools/checkdiff.ts` (NEW: `evaluateCheckDiff`/`runCheckDiff`),
  `tools/driftmap.ts` (NEW: `buildDriftMap`/`runDriftMap`), `tools/spec.ts`
  (`check-diff` + `drift-map` subcommands + USAGE), `package.json`
  (`spec:check-diff`, `spec:drift-map`).
- **Command/workflow/docs (Steps 6–7):** `.claude/commands/detect-drift.md`,
  `.github/workflows/drift-review.yml` (warn-only), `docs/drift-detection.md`.
- **Tests:** `tests/glob.test.ts`, `tests/checkdiff.test.ts`,
  `tests/driftmap.test.ts` (NEW pure suites); `tests/spec.test.ts` (registered
  `flags-wrong-endpoint`, added `good-drift`, updated the usage assertion);
  `tests/gate.test.ts` (`sensitivePaths` in the LoadedSpec helper); fixtures
  `tests/fixtures/bad/flags-wrong-endpoint/` and `tests/fixtures/good-drift/`.

## Verification

- `pnpm test` → `# tests 59 / # pass 59 / # fail 0` (6 test files: new pure
  suites for glob, check-diff, and drift-map, plus the existing gate/spec suites
  and the two new fixtures).
- `pnpm typecheck` → clean (exit 0); `pnpm lint` → clean (exit 0).
- `pnpm spec:validate` → `OK — 10 rules, 0 errors` (the schema additions are
  inert on the current graph — no `capability`/`drift-finding` nodes or
  `touches`/`flags` edges exist yet).
- CLI smoke (`GATE_BASE=HEAD~1`): `pnpm spec:drift-map` prints valid JSON
  (`packets: []`, all changed files under `uncovered` — correct pre-seeding);
  `pnpm spec:check-diff` → `FAIL — sensitive path(s) with no owning capability:
  specs/schema/…`, exit 1 (the designed clear message; warn-only in CI).

## Acceptance mapping (contract A, as amended by the decision)

1. **Schema first / inert** — validate green post-migration; `capability`/
   `drift-finding` in node-types, `touches`/`flags` in edge-types; the
   `flags → capability` list-target edge validates (fixture `good-drift`) and a
   `flags → intent` edge is rejected (fixture `flags-wrong-endpoint`); the
   `capability` group appears in `by-type` once nodes exist (proven by
   `good-drift`). [amendment 7]
2. **Mapping** — `buildDriftMap` unit tests cover file→capability mapping,
   many-contracts (lists all, flags the approved), zero/`unlinked`, `uncovered`,
   and cross-capability (two packets). The live `tools/spec.ts →
   capability-spec-tooling` mapping is exercisable after step-8 seeding.
   [amendment 3]
3. **Sensitive gate / binding** — `evaluateCheckDiff` unit tests: owning-
   capability link passes; an UNRELATED approved-contract link fails (the
   amendment-5 binding); override + `waives → check-diff` passes; non-sensitive
   passes; a sensitive file with no owning capability fails clearly. [amendment 5]
4. **Drift / no-drift question** — the operational "observable behaviour"
   definition and the per-capability + holistic cross-capability passes live in
   `/detect-drift`; its deterministic inputs (packets) are unit-tested. The LLM
   verdict is exercised when the command runs on a PR. [amendments 1, 4]
5. **Cross-capability** — covered by the two-capability `drift-map` test and the
   holistic pass in `/detect-drift`. [amendment 1]
6. **Intent acceptance (Phase 4 run)** — runnable once capabilities are seeded
   (step 8); Phase 4 is the single PR #4 [amendment 9]. Deferred — see follow-up.
7. **Warn-only** — `drift-review.yml` runs `spec:check-diff` with
   `continue-on-error: true` and a never-failing semantic step; the ≥5-PR
   blocking-flip criteria are documented in `docs/drift-detection.md`.
   [amendment 10]

## Deferred to graph-maintainer (brief Step 8; not this evidence)

Seed the four `capability` nodes (`status: active`) and the retroactive
`touches` edges, plus `touches` from THIS evidence to the capabilities the drift
work changed (`capability-spec-tooling`, `capability-spec-schema`,
`capability-ci-enforcement`, `capability-lifecycle-commands`). That seeding binds
`specs/schema/**` to this approved contract (closing the bootstrapping path) and
makes acceptance 2/3/6 runnable on the real graph.

## Follow-up / known limitations

- Run `/detect-drift` on PR #4 once capabilities are seeded (acceptance 6).
- Flip `check-diff` to blocking after ~5 clean PRs; pin the CI Claude step
  (action/credential/model) before making the semantic layer blocking.
- The optional structural `spec:drift` is deferred (the `drift` check name is
  reserved in `checks.yaml`).
- No overrides used.
