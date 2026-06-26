---
id: integration-patch-market-9e4d
type: integration
title: Patch-market — six lanes integrated (final)
status: final
created: 2026-06-25
integration_sections: [combined-outputs, combined-test-run, compliance-verdict, rollback-sequencing, combined-risk, follow-ups, scope-integrity]
---
This integration combines the six final lane evidences (`evidence-patch-market-schema-1d2e`, `evidence-patch-market-gate-2e3f`, `evidence-patch-market-commands-3f4a`, `evidence-patch-market-ci-4a5b`, `evidence-patch-market-docs-5b6c`, `evidence-patch-market-tests-6c7d`) to satisfy `contract-patch-market-ci-gate-6b7e` (Candidate B, class 3, approved) for `intent-patch-market-synthesis-3b1e`.

## combined-outputs

The six lanes combine into one coherent patch-market feature, with no two lanes editing the same file (the decomposition's boundary map held) and the cross-lane seams reconciled here at integration:

- **data-migration** (`8becd1b`) — `node-types.yaml` (`patch` node: required `[id,type,title,status,branch,strategy,created]`, status `candidate|selected|superseded`, `requires_body`; `patch_market` boolean documented on `brief`), `edge-types.yaml` (`competes-for` patch→brief, `synthesizes` patch→patch, `compares.target`/`selects.target` widened to `[contract, patch]`), `checks.yaml` (`patch-comparison` registered). The widening is purely additive — every live `compares`/`selects` edge still targets a `contract`, so no existing edge reds.
- **domain-backend** (`270f68c`) — `tools/patch_gate.ts` (pure `evaluatePatchGate` + `runPatchGate`, `PATCH_COMPARISON_CHECK = "patch-comparison"`), the two structural handlers `synthesis_parentage` and `selected_patch_comparison` (registered in `validator.ts`, declared in `validation-rules.yaml`), the single shared predicate set in `coverage_traversal.ts` (`competingPatches`/`liveCompetitors`/`comparedCompetitors`/`patchMarketResolved`), the five fixes, and the `spec:patch-gate` subcommand + `package.json` script.
- **api-integration** (`8aa31ca`) — the four thin commands `/propose-patches`, `/compare-patches`, `/synthesize-patches`, `/select-patch`, each ending with the Fix-4 closing status-report and naming the `patch-comparison` literal where the operator meets the gate.
- **observability-release** (`ce2a354`) — `.github/workflows/patch-comparison.yml` (runs `pnpm spec:patch-gate` with `GATE_BASE: ${{ github.event.pull_request.base.sha }}` and `fetch-depth: 0`, on every PR with no specs-only skip so the gate fires on the code-merge PR and the required check always reports) plus the `docs/branch-protection.md` required-check row (Fix 5).
- **docs-spec** (`d619bb3`) — the `### Patch market` doctrine in `CLAUDE.md` (per-lane / lane-isolation, by-class elaboration of the existing column with no cells changed, within-lane synthesis vs across-lane integration, the comparison-as-durable-record note, the rule-5 pointer, the honest-bound note).
- **test-verification** (`2b073d9`, authored by `test-writer`, a separate invocation from the domain-backend code-author) — `tests/patch_gate.test.ts`, `tests/patch_synthesis_parentage.test.ts`, `tests/patch_comparison_coverage.test.ts`, `tests/patch_live_competitor_parity.test.ts`, and the good/bad whole-tree fixtures wired into `spec.test.ts`.

**Conflicts surfaced and resolved at the combined level (not visible in any single lane):**

1. **The `patch-comparison` literal is a three-way (five-way) join key** authored independently by five lanes. The combined check confirms byte-identity: the observability-release evidence verifies `patch-comparison` is byte-identical across `specs/schema/checks.yaml` (data-migration), `PATCH_COMPARISON_CHECK` in `tools/patch_gate.ts` (domain-backend), and the workflow gate step (observability-release); the api-integration command bodies and the docs-spec prose name the same literal. Had any one drifted, a `waives → patch-comparison` override would red `edges-references-resolve` and/or the gate would never match the registered check. Combined: consistent.
2. **The "live competitor" definition lives in two enforcement engines** (the diff-aware gate and the `selected_patch_comparison` rule). Graft A required one predicate, two consumers. The combined result wires both `evaluatePatchGate` and `selected_patch_comparison` through the same `liveCompetitors` helper in `coverage_traversal.ts`, and the test-verification lane's `patch_live_competitor_parity.test.ts` is the standing regression guard. This parity test did its job at the seam: it caught a real cross-lane bug — `competingPatches` was passing `undefined` into `liveSourcesByEdge`, which JS swallowed into the `"superseded"` default and silently excluded superseded losers from the status-blind set — fixed to pass `[]`, red→green confirmed (corroborated by both the domain-backend and test-verification evidences). The status-blind `competingPatches` (market-existence) and the live `liveCompetitors` (coverage, excluding `selected` + `superseded`) are now distinct and consistent across the gate and the rule.
3. **Fix 1's blast radius was wider than the brief's enumeration.** The brief named two `intentsForContract` callers; the implementation guarded three (`class_market_quorum.ts`, `comparison_required.ts`, and `coverage_coherence.ts`), so a real `selects → patch` edge does not red the graph. Resolved within the domain-backend lane's owned surface (see `## scope-integrity`).

## combined-test-run

Drawn from the lane evidences, all run 2026-06-25 on the integrated tree:

- `node_modules/.bin/tsc --noEmit` → OK (domain-backend evidence).
- `node_modules/.bin/eslint .` → clean (domain-backend evidence).
- `node --test --import tsx tests/*.test.ts` → **181 tests, 181 pass, 0 fail** (35 new patch-market tests), reported identically by the domain-backend and test-verification evidences.
- `node_modules/.bin/tsx tools/spec.ts validate` → **OK, 20 rules, 0 errors** on the post-migration real tree — reported by all six lane evidences (the two new structural rules are among the 20; the widened union targets and new node/edge types add no findings because the live graph carries no spurious instances).
- Indexes fresh: `spec:index` regenerates byte-identically (data-migration kept the committed indexes byte-identical; the `indexes-fresh` rule is green in the 20/0 run).
- Fixture verdicts (test-verification + spec.test.ts): `good-patch-market/` → `spec:validate` exit 0 with byte-identical regenerated indexes and the `by-type` groups for `patch`/`competes-for`/`synthesizes` present; the three bad fixtures (`patch-synthesis-one-parent`, `patch-status-merged`, `competes-for-bad-endpoints`) fail with their pinned `[rule: …]` lines.
- Gate runner smoke: `spec:patch-gate` on a non-patch branch → PASS ("not a patch-market merge"), exercising the Fix-3 fail-open cell for an unrelated PR.

**Honest bound on this section:** these numbers are transcribed from the lane evidences' recorded runs; this integration node declares them, it does not re-execute them. The caller's mutating step (`pnpm spec:index && pnpm spec:validate`) is the live re-check and must not commit on red.

## compliance-verdict

The combined change satisfies the approved contract and its acceptance. Mapping whole-change to whole-contract:

- **Dedicated diff-aware `spec:patch-gate`** (contract's defining choice, `spec:validate` stays pure) — delivered (domain-backend). Acceptance 2 (multi-patch PR with no comparison/selects → gate fails), 3 (override passes, expired does not), 5 (synthesis ≥2 parents) verified by `patch_gate.test.ts` (a)-(e) and the two handler suites. Acceptance 4 (`spec:validate` green mid-market) holds: the 20-rule run is green and the structural rules don't fire on open markets.
- **`patch-comparison.yml` named check** (contract acceptance 2, the headline literal-fidelity criterion) — delivered (observability-release), on every PR, always-report.
- **Two structural validate rules** — `synthesis_parentage` and `selected_patch_comparison`, declared and registered (domain-backend), part of the 20-rule green run.
- **Schema** (patch node, `competes-for`/`synthesizes`, widened `compares`/`selects`, `patch_market`, `patch-comparison` check) — delivered (data-migration), non-breaking.
- **Four commands** with Fix-4 closing reports — delivered (api-integration).
- **CLAUDE.md doctrine** — delivered (docs-spec), describing the as-built mechanism.
- **All five mandatory fixes** — Fix 1 (3-site type-guard), Fix 2 (`selected`+`superseded` excluded), Fix 3 (graph-first fail-closed mapping), Fix 4 (closing reports on all four commands), Fix 5 (branch-protection docs) — all present.
- **Both grafts** — Graft A (one shared predicate; pure offline-testable `evaluatePatchGate`) and Graft C (reuse `override`/`waives`/`toDateString`/`gitdiff.ts`; dedicated `patch-comparison` waiver never overloading `pr-evidence`; fire on the artifact that merges the winner's code) — present.

**Touches-coverage verification (sensitive path):** the sensitive path `specs/schema/**` is owned by `capability-spec-schema-2c3d` (`paths: [specs/schema/**]`) and is `touches`-ed by both lanes that modify it: `evidence-patch-market-schema-1d2e` → `capability-spec-schema-2c3d` (for `node-types.yaml`/`edge-types.yaml`/`checks.yaml`) and `evidence-patch-market-gate-2e3f` → `capability-spec-schema-2c3d` (for `validation-rules.yaml`). No `specs/schema/**` edit is unowned. The remaining lane diffs likewise resolve to owning capabilities with `touches` edges: `tools/**`+`package.json` → `capability-spec-tooling-1a2b`, `.claude/commands/**` → `capability-lifecycle-commands-4f5a`, `.github/workflows/**` → `capability-ci-enforcement-3e4f`, `CLAUDE.md`+`docs/**` → `capability-spec-docs-8c1d`, `tests/**` → `capability-spec-tests-3a6e`. The two `/prepare-evidence` STOP-and-ask ownership gaps (`package.json`, `docs/branch-protection.md`) were resolved in-PR by extending `capability-spec-tooling-1a2b` and `capability-spec-docs-8c1d` respectively — no path left intentionally unowned.

**Verdict: the combined result satisfies the approved contract and its acceptance examples 1-5 and verification needs**, subject to the two honest caveats recorded in `## combined-risk` (no live end-to-end market run; the named check is inert until branch protection enables it — both acknowledged, in-scope, and out-of-diff respectively).

## rollback-sequencing

Six commits, schema-first by hard dependency:

1. `8becd1b` — data-migration (schema): the foundation. The `patch`/`competes-for`/`synthesizes` types, widened targets, and `patch-comparison` registry entry must exist before any other lane validates green.
2. `270f68c` — domain-backend (gate + two rules + shared predicate + five fixes): reads the schema; its new rule kinds reference `patch`/`competes-for` and the widened `selects` targets.
3. `8aa31ca` — api-integration (four commands): author graph data the schema permits.
4. `ce2a354` — observability-release (`patch-comparison.yml` + branch-protection docs): references the registered check and invokes the domain-backend script.
5. `d619bb3` — docs-spec (`CLAUDE.md`): names the as-built identifiers.
6. `2b073d9` — test-verification (tests + fixtures): imports the domain-backend symbols and exercises the schema.

**Release sequencing:** schema (1) must merge first; domain-backend (2) must precede observability-release (4) so the `spec:patch-gate` script the workflow invokes exists; docs (5) and tests (6) are content-parallel but the tests' real-tree green check assumes 1-2 are present. In practice this is one branch/PR, so the unit of release is the whole set.

**Rollback:** revert in reverse dependency order — tests, docs, observability-release, api-integration, domain-backend, then schema **last** (reverting schema while any dependent remains would red `edges-endpoint-types`/unknown-kind). **Crucially, the merge-blocking blast radius is zero until branch protection is wired:** the gate/workflow only blocks a merge once a repo admin marks the `patch-comparison` check required (Fix 5; out-of-diff). Before that enablement, a rollback has no merge-gate consequence — the workflow merely stops reporting. After enablement, a full rollback must also un-require the `patch-comparison` check in branch protection, or every PR strands on a check whose workflow no longer exists.

## combined-risk

Residual risk visible only in the combined picture:

1. **No live end-to-end market run.** The gate's verdict matrix is verified by the pure `evaluatePatchGate` unit suite and the whole-tree fixtures, but a real two-patch market actually blocking a real merge PR has not been exercised. The test-verification evidence states this honest bound explicitly ("a live multi-patch market blocking a real PR is verified by the fixtures, not yet by an end-to-end market run").
2. **The `runPatchGate` git plumbing is only smoke-tested.** The pure core is fully unit-covered, but the impure runner — the head-branch read (`$GITHUB_HEAD_REF` env-first, the detached-HEAD CI case, the `patch.branch == head` graph-first mapping under real refs) — is exercised only by a non-patch-branch smoke run (→ PASS). The fail-closed/fail-open cells are pinned and unit-tested in `evaluatePatchGate`, but the *mapping under real CI git state* has not run end-to-end.
3. **The named check is inert until branch protection enables it.** `patch-comparison.yml` runs and reports on every PR (always-report preserved), but blocks nothing until a repo admin marks `patch-comparison` required — an out-of-diff setting "not reproducible from files in this repo." Until then the headline acceptance ("blocked by `patch-comparison.yml`") is satisfied in mechanism but not yet in effect.
4. **Two-places drift is guarded but not eliminated.** The parity test pins gate/rule count-identity today; a future new `patch` status would require a deliberate update to the shared predicate's exclusion set, and the parity test guards identity, not the correctness of a newly-added status's classification.
5. **Minor cosmetic inconsistency (non-blocking):** `capability-spec-tooling-1a2b`'s body prose still reads "this capability's `paths` stays `[tools/**]`," while its frontmatter `paths` is now `[tools/**, package.json]` (correctly extended per the domain-backend evidence). The authoritative frontmatter is correct and path-ownership is sound; only the prose lags.

## follow-ups

No follow-up is **mandatory** under scope-integrity rule 5 — none of the recorded corrections reveals the contract or a brief was wrong (see `## scope-integrity`). The following are **recommended operational/verification follow-ups**, not corrections:

1. **Enable the `patch-comparison` required check in branch protection.** This is the out-of-diff admin step Fix 5 documented but cannot perform; it converts the workflow from "reports" to "blocks." This is *not* a `/capture-intent` for missing scope — the contract and decision explicitly scoped this enablement as an acknowledged out-of-band step (Fix 5 documents the wiring; the setting itself was never in any lane's diff). It is an operational handoff, recorded here.
2. **End-to-end live-market dogfood.** Open a real two-strategy market, open the winner's merge PR, and confirm `patch-comparison.yml` reds the PR pre-comparison and greens it post-`/select-patch` — exercising `runPatchGate`'s detached-HEAD/`$GITHUB_HEAD_REF` mapping under real CI (closes risks 1 and 2 above). Prudent verification, not a contract gap.
3. **(Trivial) reconcile `capability-spec-tooling-1a2b`'s body prose** with its corrected `paths` frontmatter (risk 5). A class-0 mechanical cleanup.

## scope-integrity

Rule-5 judgement on the three corrections the evidences recorded:

1. **`selected_patch_comparison` realized status-blind vs live — splitting the brief's naive "liveCompetitors" phrasing.** The brief spoke of one "live competitor" notion; the implementation correctly realized the rule needs two distinct sets — the status-blind `competingPatches` (does a market exist at all / are there >1 candidates) and the live `liveCompetitors` (which competitors must be covered, excluding `selected` + `superseded`). The contract's intended behaviour — a selected patch's brief must carry a `comparison` covering its competing patches — is unchanged. **HOW-not-WHAT refinement, correctly recorded in evidence.**
2. **The `competingPatches` undefined→`[]` fix.** A genuine implementation bug (JS swallowed `undefined` into the `"superseded"` default), caught by the independent test lane's parity test and fixed red→green. Pure correctness of the as-specified behaviour; intended behaviour unchanged. **HOW-not-WHAT refinement, correctly recorded in evidence.**
3. **Fix 1's third call site (`coverage_coherence.ts`).** The decision's Fix 1 is "type-guard `intentsForContract` callers to `type === "contract"`"; the brief illustratively named two callers, anchored to current-tree line numbers it warned could shift. The implementation found and guarded a third caller, all three within the domain-backend lane's owned `tools/handlers/` surface, so the widened `selects → patch` edge does not red the graph. The brief's *boundary* was intact (Fix 1 was correctly assigned to this lane); only its *enumeration* was non-exhaustive. Discharging the fix to its true extent is required for a green graph and changes no intended behaviour. **HOW-not-WHAT refinement, correctly recorded in evidence — not a brief boundary error.**

**Conclusion:** none of the three corrections triggers a rule-5 route. No approved brief was wrong at its boundary (no `supersedes` needed); the contract's intended behaviour is unchanged (no `/capture-intent` for missing scope, no return to human approval). All three are HOW-not-WHAT refinements, each captured in the lane evidence rather than silently absorbed — exactly the discipline rule 5 demands. The integrated whole reveals neither contract nor brief drift.
