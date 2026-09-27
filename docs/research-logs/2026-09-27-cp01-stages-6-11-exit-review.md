# Checkpoint 1 Stages 6–11 — T2 exit review and checkpoint-wide acceptance

**Scope:** Spec 00 T2 for Checkpoint 1 Stages 6–11 (CP01-S22 to CP01-S31) and the checkpoint-wide obligations T2 requires, under the [resolution methodology](../open-question-resolution-methodology.md) v2 §7. Branch `claude/cp01-stages-6-11-contracts`, base `refactor/pactwright-v2` at `0f81839`. Source revisions at review: Implementation Guide v19 (from v18), Core v6, Distribution v5, OSS v2, Principles v4, Kakeibo Acceptance Profile v2, Checkpoint 1 v31 (from v30), Checkpoint 2 v18, Spec 00 v5, contract format 2. Questions Q57–Q66 keep their crosswalk IDs and wording; the batch records [B22](./2026-09-27-cp01-stages-6-11-b22-packed-consumer-proofs.md) to [B27](./2026-09-27-cp01-stages-6-11-b27-feedback-and-checkpoint-wide-obligations.md) remain the decision records.

## Method

Steps 22–31 had no contracts before this pass, so the T1 conversion (contracts, checkpoint summaries generated from the contract `outputs`, crosswalk entries quoting the version 30 prose verbatim, questions Q57–Q66) and the T2 resolution were produced on one branch, in that order: the questions were inventoried from the conversion, classified, batched by shared decision (B22 packed-consumer proofs; B23 self-hosting boundary and threshold; B24 public-content authority; B25 corrective release and baseline; B26 Kakeibo consumer and acceptance; B27 findings and checkpoint-wide obligations), answered with the authority traced, and applied to the contracts, `checkpoint.yml`, Checkpoint 1 and the Guide. Two independent read-only reviewers then ran on the resulting tree. One checked whole-checkpoint consistency: the Q57–Q66 dispositions under the two-implementations test; agreement between the new contracts, the requirement-ready Stage 1–5 contracts they cite, Guide v19 and the specifications; requirement coverage, case distinctness and binding uniqueness across CP01; `requires`, `inputs` and `uses` feasibility; deliverable-summary equality; loss against `0f81839`. The other audited cross-stage allocation and authority: every later-owner named by the Stage 1–5 records (Steps 22–31 were the most-named owners) against the new contracts; contradictions with Checkpoint 2 and the Task 3 plan; whether every change lies inside the named owning clauses; the soundness of the two owner-approval bindings; and the exit-gate map below. Each reviewer refuted its own candidates before reporting; the author verified every finding against the text before acting. The owner reviews the PR.

## Owner decisions this pass needs

These are recorded as `approval` bindings and stated on the PR; none is assumed:

| Decision | Where | Effect |
|---|---|---|
| Project-state boundary for self-hosting (Q60) | `self-host.boundary-approval`, CP01-S25/AC02 | Step 25 starts from a candidate with no Pactwright project state; the released `0.0.1` self-hosted records stay Git history on the default branch and are not migrated or copied. B23 records why migration is infeasible under the accepted Stage 4 contracts. |
| Guide v19 amendments (Q62, Q65) | Guide §Preparing a development release, §Release failure, §Transition rule | Release-PR procedure applies from `0.0.2` with the owner-merged pull request as the pre-Checkpoint-2 landing; CHANGELOG from Evidence in the tagged source; unpublished tag may be recreated; a published defect consumes a number; findings before Project Intelligence are open Intents. |
| Kakeibo write authority (Q63) | `kakeibo.install-authority`, `kakeibo.delivery-landing-authority` | Writes to the Kakeibo repository and commits to its default branch at Steps 29 and 30. |
| Stage 8 and 9 headings (Q61) | Checkpoint 1 v31 | "Complete the `0.0.2` public learning path", "Publish `0.0.2`". |

## Exit-gate ownership (T2 evidence, not a maintained registry)

Derived from the contracts at this revision; `CP01/AC05`'s reviewer re-derives it at the exit gate.

| Exit-gate line | Owning criteria |
|---|---|
| runtime and `@pactwright/standard` are real publishable packages | S01/AC01, AC02; S10/AC04; S22/AC01, AC02; S28/AC03 |
| five core record types and typed relationships validate, all 17 rules | S02/AC01–AC13; S03/AC01–AC14; S09/AC01; S24/AC05, AC09 |
| Contract authority distinct from Gate/execution policy | S06/AC03, AC09; S07/AC03, AC04 |
| direct shape without adapter responsibilities as topology | S06/AC01; S12/AC09; S24/AC01 |
| execution state outside the graph; status/next read-only; run respects authority and bounded transitions | S06/AC13; S08/AC01, AC02, AC03, AC05; S24/AC02, AC03 |
| five Evidence closure preconditions before atomic mutation | S07/AC12, AC13; S12/AC10; S24/AC08, AC09 |
| seven adapter commands keep their mutation boundaries | S12/AC02, AC03; S24/AC07, AC09 |
| repository revision, Project Graph revision and `environment_lock_hash` as replay base | S05/AC01–AC03; S15/AC03; S09/AC05; S25/AC05 |
| fixture Extension canonical state in revision, generated and execution state not | S05/AC04, AC05; S16/AC12; S24/AC09 |
| package-manager and Pactwright locks agree | S15/AC04, AC07; S25/AC03 |
| explicit, capability-checked pack selection incl. clean one-shot init | S11/AC01–AC03; S14/AC03–AC05; S16/AC14; S23/AC02, AC03 |
| `agent-pack upgrade` safe within constraints | S11/AC04–AC06, AC11, AC12 |
| `pactwright upgrade` and `--to` fixture-proven, re-enter, recoverable | S19/AC01, AC02, AC05, AC07, AC10, AC12, AC14 |
| one-shot init composes the same operations as separate setup | S16/AC14; S23/AC02 |
| Extension install, locking, migration, recovery, blocked removal, preserved data fixture-proven | S16/AC02–AC10, AC15, AC16 |
| external Production Skills resolution assigned to Checkpoint 5; unsupported imports not ignored | S10/AC05; S15/AC08, AC10; S17/AC04; S18/AC06 |
| `init`, `sync`, `doctor`, `validate`, lifecycle commands and core `eval` work | S14/AC01, AC02; S17/AC01; S18/AC01; S09/AC11; S08/AC01, AC02; S13/AC01; S23/AC01; S24/AC03, AC04; S28/AC05 |
| core evaluation covers the six dimensions | S13/AC01–AC04; S24/AC09 |
| baseline/candidate evaluation reports per-dimension regressions and resolves the released `0.0.1` baseline | S13/AC06, AC07; S28/AC04 |
| a clean packed consumer completes a full Delivery | S23/AC01; S24/AC01 |
| Pactwright completes real self-hosted Delivery | S26/AC01; S27/AC01; CP01/AC02 |
| public learning material matches shipped capability | S27/AC02–AC05 |
| `0.0.2` registry verified, `0.0.1` resolvable as baseline | S28/AC03, AC04 |
| `0.0.2` published and installs into Kakeibo | S28/AC03, AC05; S29/AC01, AC03 |
| `0.0.1` content set delivered through Pactwright and in the tagged source | S26/AC01; S27/AC01; S28/AC06 |
| documentation-first Kakeibo establishes the minimum consumer root without CP2 infrastructure | S29/AC01, AC02 |
| Kakeibo completes a real Intent → Evidence Delivery of `packages/domain` | S30/AC01, AC05 |
| financial foundation preserves the profile's invariants | S30/AC02, AC04 |
| Kakeibo domain code independent of infrastructure concerns | S30/AC03 |
| repeated sync converges; graph coherence not hand maintained | S17/AC01, AC06; S23/AC01, AC02; S25/AC04; CP01/AC02 |
| no known blocking failure carried into Checkpoint 2 | S31/AC03; CP01/AC05 |

Every line has at least one owning criterion, and the later integration proofs the Stage 1–5 records allocated to Steps 22–31 land in named criteria: S01.references (packaging) → S22/AC01–AC02, S23/AC01; S08.run.8 and S12.verify.3 (adapter Delivery, lifecycle run) → S24/AC01, AC03; S09.run.21 (context consumption) → S24/AC09 through S12/AC08; S10.run.5 → S22/AC01, S28/AC03; S13.run.9 → S28/AC04; S20.expected.1 → S25/AC05; S21.expected.1 → S28/AC03; B14's Step 24 and Step 28 owners → S24/AC04, S28/AC04; B15/B16's Step 23, 25 and 29 owners → S23/AC02, AC03, S25/AC01, S29/AC01; B18's Step 28 owner → S28/AC03; B19's Step 25 owner → S25/AC05; B20's Step 27 owner → S27/AC02, AC04; B21's Step 28 approval → S28/AC03.

## Findings and dispositions

Recorded after the reviewers ran on the tree at the revision the PR's first commit carries; see the correction commits on the PR for each applied item.

| ID | Source | Finding | Correction |
|---|---|---|---|
| (populated after review) | | | |

## Checkpoint-level result (§7)

Identity, storage, relationships and authority were settled in Stages 1–5; the shared decisions of Stages 6–11 are the archive identity, the fixture isolation, the first real AI execution and its approvals, the project-state boundary, the landing process, the self-hosting threshold, the exact-version instruction, the release receipts and fix-forward rule, the Kakeibo foundation split and authority, and the finding definitions. They agree across S22–S31, `checkpoint.yml`, Checkpoint 1 v31 and Guide v19, and they contradict no requirement-ready Stage 1–5 contract: the one accepted premise they change is the Stage 2 exit record's expectation that Step 25 migrates the released self-hosted records (B23), which the owner decides through `self-host.boundary-approval`.

**Verification on the changed tree** (commands, exact results, Node v22.22.2, pnpm 11.7.0):

| Command | Result |
|---|---|
| `pnpm contracts:check` | `docs/checkpoints/01-self-hosted-delivery: ok` (verbatim quotes checked against `0f81839`) |
| `pnpm format:check` | pass |
| `pnpm lint` | pass |
| `pnpm typecheck` | pass |
| `pnpm test` | 25 tests, 25 pass, 0 fail |
| `pnpm build` / `pnpm verify` | FAIL, inherited: no runtime sources and no `@pactwright/standard` project on `refactor/pactwright-v2`; identical on `0f81839` and recorded the same way by the Stage 4 and 5 exit records |
| Deliverable-summary equality | 60 of 60 outputs across CP01-S01 to S31 equal their checkpoint summaries (generated from the contracts) |
| Verifier-binding uniqueness | 307 bindings across CP01, all unique |
| Batch challenge plans | executed as recorded in B22–B27 (registry reads of both packages on 2026-09-27; `207ac08` reads of `package.json`, the lock, the pack manifest and the version 14 runbook; `defd052` and `origin/main` tree reads; README, CHANGELOG and lockfile greps at `0f81839`; Checkpoint 2 greps) |
| Not read | the Kakeibo repository (outside this session); Step 29 inventories its state rather than assuming it |

Stages 6–11 are requirement-ready in the methodology §7 sense subject to the fresh reviews recorded above and the owner decisions listed: no unresolved behaviour needed by Steps 22–31 remains in the contracts, each obligation has acceptance coverage with a specified method, and the deferred proofs have owners (Checkpoint 2's invoker, `0.0.3` release and Kakeibo upgrade; Checkpoint 3's Source ingestion; the owner's Release-line amendment if a further corrective release is needed). With Stages 1–5 already requirement-ready, Checkpoint 1's T2 completion evidence is in place: every criterion has a verification method, later integration proofs are allocated to Steps 22–31 by name, and the checkpoint-wide simplicity, graph-boundary and self-hosting obligations are declared and inherited (`CP01/R02`–`R05`). This is scoped T2 work: it authorises no implementation, does not build the harness and grants no acceptance; T3–T5 remain as Spec 00 §5 defines them.

**Checkpoint 1 Stages 6–11 exit review v1**
