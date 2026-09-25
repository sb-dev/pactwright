# Checkpoint 1 Stage 3 — T2 stage-level exit review

**Scope:** Spec 00 T2 for Checkpoint 1 Stage 3 (CP01-S10 to CP01-S13) under the [resolution methodology](../open-question-resolution-methodology.md) v2 §7. Reviewed revision `3bad48a` on `claude/stage-3-step-contracts-opayre` (PR #50), base `refactor/pactwright-v2` at `6b9ee65`. Source revisions at review: Core v6, Distribution v4, Implementation Guide v16, Principles v4, Checkpoint 1 v28, Spec 00 v5, contract format 2. Questions Q34–Q40 keep their crosswalk IDs and wording; the batch records [B12](./2026-09-25-cp01-stage-3-b12-agent-pack-format-and-selection.md), [B13](./2026-09-25-cp01-stage-3-b13-adapter-hand-off-and-boundary.md) and [B14](./2026-09-25-cp01-stage-3-b14-evaluation-and-baselines.md) remain the decision records.

**Prior state:** the owner's PR #50 review [5323213273](https://github.com/sb-dev/pactwright/pull/50#pullrequestreview-5323213273) at `32be31b` returned five P2 findings, applied in `3bad48a` and accepted by review 5323272265, which asked for this whole-stage review.

## Method

Two independent read-only reviewers ran at `3bad48a`. One checked whole-stage consistency: the Q34–Q40 dispositions under the two-implementations test; identity, storage, authority and failure agreement across S10–S13 and with Core v6 / Distribution v4; requirement coverage, case distinctness, bindings, `requires` order, deliverable-summary equality and loss against `6b9ee65`; and pinned behaviour against the released `207ac08` code. The other audited cross-stage allocation: contradictions with requirement-ready Stages 1–2 and the Stage 2 exit follow-ups, the Stage 4–5 contracts and questions this pass constrains, later-step owners and prerequisite chains, the §4 out-of-scope lines and exit gate, the unconverted Steps 22–28 and Checkpoint 2 prose, and Checkpoint 5 and Distribution §§6–8, 12 against the `production_skills` mapping. Each refuted its own candidates before reporting. The author verified every finding against the text before acting.

## Findings and dispositions

Blocking findings, applied in this pass:

| ID | Location | Finding | Correction |
|---|---|---|---|
| X1 | Distribution §5, §24; S10/R08; S13/R06 | The released `@pactwright/standard@0.0.1` declares `pactwright: 0.0.1` exactly, so the recognised-manifest runtime-range rule would refuse it under `0.0.2`, leaving Step 28 and the exit gate's released-baseline lines unsatisfiable. | Distribution §24 and S13/R06: comparison resolution establishes identity, validity and completeness without refusing a side whose declared runtime excludes the running runtime; the mismatch is an incompatible component of that side; evaluation of such a side when an invoker exists belongs to the first invoker's owner. S13/AC06 `incompatible-runtime-baseline`. Q48 and Q49 `affects` cite S10/R08 for the Stage 4 runtime-upgrade sequence. |
| X2 | Distribution §15; S11/R04, AC04 | "With an exact configured version … `upgrade` reports that nothing changed" contradicted Checkpoint 2's procedure of setting an exact constraint and running `agent-pack upgrade` for package replacement. | `upgrade` replaces the installed package when the package manager's resolution of the constraint differs from the locked version and reports nothing changed only when it is the locked version. S11/AC04 cases `range-newer-available`, `exact-constraint-differs`. |
| X3 | Core §46; S12/R12, AC02, AC07, AC08 | R12 routed every capability invocation through the in-process Step 8 seam, impossible for the adapter path in Checkpoint 1 (no invoker; Step 24 completes a Delivery through the adapter), and AC02/AC07/AC08 were driven by a seam invoker. | Dispatch resolves the command's capability to the mapped agent and returns it with the context; the rendered command delegates to the rendered agent; the result command accepts the structured output; the seam is the in-process path for `lifecycle run` and eval. AC02, AC07 and AC08 are driven by dispatch plus scripted results and assert the mapped agent. |

Non-blocking findings, applied:

| ID | Correction |
|---|---|
| X4 | S12/AC02: deliver-brief and review *advance* execution state only through the result command, since dispatch also writes the dispatch record. |
| X5 | Core §55: across the dispatch gap only canonical change is checked; the result command's own stored base catches configuration, lifecycle and lock changes at result time. Core §28 lists the dispatch record. Q45 and Q48 `affects` cite S12/R13. |
| X6 | Distribution §24, S13/R07, AC07: a comparison exits with failure only for a reported regression or an unresolvable side; not comparable and unjudged do not fail it, so Step 28's verify command succeeds without an invoker. |
| X7 | Distribution §9 example uses the family-ID `production_skills` mapping. |
| X8 | S11 output `package-manager-delegation`; R08 enumerates the seam's requests (install as development dependency, request at constraint, exact restore, removal, isolated acquisition); AC10 `installed-then-refused`. Q43 `affects` cite S11/R09. |
| X9 | S11/R02, AC05 and Distribution §15: restoration is to the previous installed version and constraint, or removal of a dependency `use` added, not byte identity of the package manifest. |
| X10 | S12/R12 states the hand-off semantics of the direction-less `/capture-intent` and the mutation-less `/propose-contracts`. |
| X11 | Distribution §5: a pack declaring any `production_skills` entry is not accepted by that release, matching S10/AC05 and constraining Q46. |
| X12 | Checkpoint 1 Step 11 deliverable summary lists `package-manager-delegation` with the contract's wording (owner review 5323346597). |

Later-stage follow-ups, owned and non-blocking for Stage 3:

- **Q46 (Stage 4, Step 18):** S18/R03's "configured external Production Skills import" should read "declared by the selected pack", since the declaration lives only in the pack manifest.
- **Q48 / Q49 (Stage 4, Step 19):** a `0.0.1` project upgrading its runtime holds a pack declaring `pactwright: 0.0.1` exactly; the runtime-upgrade sequence (Checkpoint 2 line 106 runs the runtime upgrade first) must state how that intermediate environment is treated before `agent-pack upgrade` runs.
- **Checkpoint 2:** the first provider invoker owns judge identity and whether an incompatible-runtime baseline's cases are evaluated.
- **Step 28 prose (unconverted):** its expected result should say that without an invoker every assertion is not comparable and the changed components are listed.
- **Checkpoint 3 line 168** still says `agent-pack use` and `eval --baseline` "remain deferred as recorded in Checkpoint 1"; it is stale wording outside this pass.

## Stage-level result (§7)

Checks at `3bad48a` confirmed by the reviewers and unchanged by the corrections: every S10–S13 requirement has an exercising criterion; verifier bindings across CP01 are unique; `requires` are feasible in step order (Step 11 precedes Steps 12, 15 and 17; Step 13 precedes Step 28); the Stage 3 deliverable summaries equal the contract `outputs` (re-checked after X8 added the `package-manager-delegation` output, whose Step 11 summary owner review 5323346597 found missing and this pass added, X12); no requirement, criterion, `covers`, `source` or `verify` entry from `6b9ee65` was removed without explanation; Q34–Q40 each have a supported disposition; the Stage 1–2 clauses S06/R04, R09, R11, S07/R01, R09, S08/R03, S09/R09, R10 and the Stage 4–5 clauses S14/R04, S15/R01, R05–R07, AC07, S16/R03, R12, S17/AC06, S19/R02 are consistent; Steps 22–28 and Checkpoint 2 lines 106 and 449 remain valid under the source grammar and delegation; Distribution §§7, 12 keys agree with the family-ID mapping.

With X1–X11 applied, the corrected tree is consistent with Core v6 and Distribution v4, and no unresolved behaviour needed by Stage 3 steps remains. The corrections were authored by the record's author and so require fresh independent review (methodology §6); the verdict below records that review's result. This is scoped T2 work; it authorises no implementation, harness construction or acceptance.

**Verdict:** pending fresh review of X1–X12.

## Verification

Commands on the corrected tree, Node `v22.22.2`, pnpm `11.7.0`:

| Command | Result |
|---|---|
| `pnpm contracts:check` | PASS |
| `pnpm format:check` | PASS |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS, 20/20 |
| `pnpm build` / `pnpm verify` | FAIL, inherited: no runtime sources and no `@pactwright/standard` project; identical on `6b9ee65` |

Schema, citation and mapping checks establish structural consistency only. No verifier binding, runtime or harness was executed.

**Checkpoint 1 Stage 3 exit review v1**
