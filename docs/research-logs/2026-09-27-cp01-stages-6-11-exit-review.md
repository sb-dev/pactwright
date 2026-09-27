# Checkpoint 1 Stages 6–11 — T2 exit review and checkpoint-wide acceptance

**Scope:** Spec 00 T2 for Checkpoint 1 Stages 6–11 (Steps 22–31) and the checkpoint-wide obligations T2 requires, under the [resolution methodology](../open-question-resolution-methodology.md) v2 §7. Branch `claude/cp01-stages-6-11-contracts`, base `refactor/pactwright-v2` at `0f81839`. Source revisions at review: Implementation Guide v19 (from v18), Core v6, Distribution v5, OSS v2, Principles v4, Kakeibo Acceptance Profile v2, Checkpoint 1 v31 (from v30), Checkpoint 2 v18, Spec 00 v5, contract format 2. Questions Q57–Q66 are recorded in the crosswalk; the batch records [B22](./2026-09-27-cp01-stages-6-11-b22-packed-consumer-proofs.md) to [B27](./2026-09-27-cp01-stages-6-11-b27-feedback-and-checkpoint-wide-obligations.md) are the decision records.

## Method

The first commit on this branch, `b3b1553`, converted Steps 22–31 into contract files. The owner then stated that Task 1 is complete and that Task 2 does not convert steps, and chose, when asked, to have Steps 22–31 reviewed and amended in their version 17 prose form. The conversion was removed. The T2 decisions it had reached were re-expressed as prose amendments to Steps 22–31, `CP01/R02`–`R05` in `checkpoint.yml`, Guide v19 and the crosswalk's question list. Consequence, stated for the owner: the Task 3 plan (§2) says unconverted Markdown cannot execute or count towards checkpoint completion, so the harness cannot run Steps 22–31 until they are converted.

The review covered the five T2 checks for each step: canonical fidelity against the owning clauses; positive and negative coverage in "Verify before continuing"; step dependencies on earlier steps and accepted contracts; a stated verification method for every obligation; and complete product scope against the checkpoint goal, §4 and the exit gate. Two independent read-only reviewers examined `b3b1553`: one for whole-checkpoint consistency, one for cross-stage allocation and authority. Their semantic findings apply to the prose as well and are listed below with their dispositions. A fresh read-only reviewer then examined the prose amendments (section "Fresh review").

## Owner decisions this pass needs

The owner approved all four semantic decisions in the producing session on 2026-09-27, answering direct questions (the owner had asked to be asked directly rather than through the PR). Each question and its answer, verbatim in substance: Step 25 start state (fresh `init`; `main`'s self-hosted records stay Git history, not migrated): "Approve"; Implementation Guide v19 clauses (release-PR procedure from `0.0.2` with an owner-merged pull request; CHANGELOG from accepted work only; an unpublished tag may be recreated; a published defect consumes the version number and renumbers later versions; before Project Intelligence, findings become open Intents): "Approve"; Step 30 invariant set (Kakeibo 02 §14 verbatim at `75443233` plus the credit-card and goal-contribution invariants, re-derived through a reviewed amendment if the recorded revision differs, nothing deferred to Step 31): "Approve"; `0.0.2` wording in §1 and the Stage 8 and 9 headings: "Approve". The PR carries a comment recording these answers. The Kakeibo write authority is different: it is an execution prerequisite for Steps 29 and 30, granted by the Kakeibo owner at execution, not by this review.

| Decision | Where | Effect |
|---|---|---|
| Steps 22–31 keep the version 17 prose form | Checkpoint 1 §3 | Decided by the owner in the producing session on 2026-09-27 ("T2 on the prose"). Consequence: under the Task 3 plan §2 the harness cannot execute Steps 22–31 or count them towards completion until they are converted. |
| Project-state boundary for self-hosting (Q60) | Step 25 Run | Step 25 starts from a candidate with no Pactwright project state; `main`'s self-hosted records stay Git history. B23 records why migration is infeasible under the accepted Stage 4 contracts. |
| Guide v19 clauses (Q62, Q65) | Guide §Preparing a development release, §Release failure, §Transition rule | Release-PR procedure from `0.0.2` with the owner-merged pull request as pre-Checkpoint-2 landing; CHANGELOG from accepted work only (Evidence for self-hosted work, checkpoint results for earlier work, nothing outside the tagged graph); unpublished tag may be recreated; a published defect consumes a number and renumbers the version line; findings before Project Intelligence become open Intents. |
| Step 30 invariant set (Q64) | Step 30 | Kakeibo 02 §14 at `75443233`, re-derived through a reviewed amendment if the recorded revision differs; no invariant deferred to Step 31. |
| Kakeibo write authority (Q63) | Stage 10 intro | Writes to the Kakeibo repository and its default-branch commits in Steps 29 and 30. |
| `0.0.2` wording (Q61) | Checkpoint 1 §1, Stage 8 and 9 headings, Step 27 | The release is `0.0.2`; `0.0.1` names the content set. |

## Exit-gate ownership (T2 evidence, not a maintained registry)

Derived at this revision; the `CP01/AC05` reviewer re-derives it at the exit gate.

| Exit-gate line | Proved by |
|---|---|
| runtime and `@pactwright/standard` are real publishable packages | S01/AC01, AC02; S10/AC04; Step 22 verify; Step 28 verify |
| five core record types and typed relationships validate, all 17 rules | S02, S03 automated criteria; S09/AC01; Step 24 verify (rules on the consumer; suite re-run) |
| Contract authority distinct from Gate/execution policy | S06/AC03, AC09; S07/AC03, AC04 |
| direct shape without adapter responsibilities as topology | S06/AC01; S12/AC09; Step 24 run |
| execution state outside the graph; status/next read-only; run respects authority and bounded transitions | S06/AC13; S08/AC01, AC02, AC03, AC05; Step 24 expected and verify |
| five Evidence closure preconditions before atomic mutation | S07/AC12, AC13; S12/AC10; Step 24 verify |
| seven adapter commands keep their mutation boundaries | S12/AC02, AC03; Step 24 verify |
| repository revision, Project Graph revision and `environment_lock_hash` as replay base | S05/AC01–AC03; S15/AC03; S09/AC05; Step 25 verify |
| fixture Extension canonical state in revision, generated and execution state not | S05/AC04, AC05; S16/AC12; Step 24 suite |
| package-manager and Pactwright locks agree | S15/AC04, AC07; Step 25 verify |
| explicit, capability-checked pack selection incl. clean one-shot init | S11/AC01–AC03; S14/AC03–AC05; S16/AC14; Step 23 verify |
| `agent-pack upgrade` safe within constraints | S11/AC04–AC06, AC11, AC12 |
| `pactwright upgrade` and `--to` fixture-proven, re-enter, recoverable | S19/AC01, AC02, AC05, AC07, AC10, AC12, AC14 |
| one-shot init composes the same operations as separate setup | S16/AC14, AC16; Step 23 verify |
| Extension install, locking, migration, recovery, blocked removal, preserved data fixture-proven | S16/AC02–AC10, AC15, AC16 |
| external Production Skills resolution assigned to Checkpoint 5; unsupported imports not ignored | S10/AC05; S15/AC08, AC10; S17/AC04; S18/AC06 |
| `init`, `sync`, `doctor`, `validate`, lifecycle commands and core `eval` work | S14/AC01, AC02; S17/AC01; S18/AC01; S09/AC11; S08/AC01, AC02; S13/AC01; Steps 23, 24 and 28 verify |
| core evaluation covers the six dimensions | S13/AC01–AC04; Step 24 suite |
| baseline/candidate evaluation reports per-dimension regressions and resolves the released `0.0.1` baseline | S13/AC06, AC07; Step 28 verify |
| a clean packed consumer completes a full Delivery | Steps 23 and 24 |
| Pactwright completes real self-hosted Delivery | Steps 26 and 27; `CP01/AC02` |
| public learning material matches shipped capability | Step 27 verify |
| `0.0.2` registry verified, `0.0.1` resolvable as baseline | Step 28 verify; S21/AC05 |
| `0.0.2` published and installs into Kakeibo | Step 28 verify; Step 29 verify |
| `0.0.1` content set delivered through Pactwright and in the tagged release source | Steps 26, 27; Step 28 run |
| documentation-first Kakeibo establishes the minimum consumer root without CP2 infrastructure | Step 29 verify |
| Kakeibo completes a real Intent → Evidence Delivery of `packages/domain` | Step 30 verify |
| financial foundation preserves the profile's invariants | Step 30 verify |
| Kakeibo domain code independent of infrastructure concerns | Step 30 verify |
| repeated sync converges; graph coherence not hand maintained | S17/AC01, AC06; Steps 23 and 25 verify; Step 30 verify; `CP01/AC02` |
| no known blocking failure carried into Checkpoint 2 | Step 31 verify; `CP01/AC05` |

Every line has a proof. The later proofs the Stage 1–5 records allocated to Steps 22–31 land as follows: S01.references → Step 22 and 23 verify (packaging only); S08.run.8 and S12.verify.3 → Step 24 run and verify; S09.run.21 → Step 24 suite (S12/AC08); S10.run.5 → Step 22 verify, Step 28 verify; S13.run.9 → Step 28 verify; S20.expected.1 → Step 25 run and verify; S21.expected.1 → Step 28 run and verify; B14 → Steps 24, 28; B15, B16 → Steps 23, 25, 29; B19 → Step 25; B20 → Steps 26, 27; B21 → Step 28. B18's "Step 28 … migration and rollback run for real" has no real target after the Step 25 decision and stays with S19/AC06, AC07, AC10 (B23).

## Findings and dispositions

From the two reviews of `b3b1553`; each was verified against the text before acting. "Applied" names where the prose or record now carries it.

| ID | Source | Finding | Disposition |
|---|---|---|---|
| X1 | Consistency 1 | `lifecycle run` at open fails with the missing invoker at the automatic `propose-contracts` (S08/R03, released policy), not at the manual `approve-contract`. | Applied: Step 24 verify states each position's stop. |
| X2 | Consistency 2 | The tagged release commit cannot be the final revision, since Step 31 and later fixes land after it. | Applied: `CP01/R05` names the tagged commit for publication lines and the final revision for the rest; Step 28 run. |
| X3 | Consistency 3 | Byte-for-byte preservation of an existing `package.json` is impossible after `pnpm add`. | Applied: Step 29 run. |
| X4 | Consistency 4 | Material and blocking overlap without precedence. | Applied: Step 31 run orders blocking, material, excluded. |
| X5 | Consistency 5 | No disposition for an invariant the governing specification contradicts. | Applied: Step 30 run. |
| X6 | Consistency 6; allocation 1 | `CP01/R02`'s exemption failed every lineage's own records and Step 31's Intents. | Applied: `CP01/R02` exempts runtime-written files. |
| X7 | Consistency 7 | Archive reuse contradicted repacking by Steps 26–28. | Applied: Step 22 run. |
| X8 | Consistency 8 | Re-selection after a pack edit had no stated mechanism. | Already specified (Distribution §5, S11/R01); Step 25 run states it; B23 cites it. |
| X9 | Consistency 9 | Candidate identity in the comparison was unchecked. | Applied: Step 28 verify records both sides' version and hash. |
| X10 | Consistency 10 | Archive identity undefined. | Applied: Step 22 run (entry list with per-entry SHA-256). |
| X11 | Consistency 11 | B23 facts: the `link:` form is at `207ac08`, not `0f81839`; `main` holds unreleased `0.0.2` state. | Applied: B23 corrected; the decision rests on the content mismatch. |
| X12 | Consistency 12 | §1 still said "publish `0.0.1`". | Applied: §1. |
| X13 | Consistency 13 | Violating variants must be verifier-owned; foundation lineages need approval. | Applied: Step 30 run and verify. |
| X14 | Allocation 3 | S12/AC08 (context consumption) missing from the Step 24 suite; two crosswalk notes still said "remains Q33". | Applied: Step 24 run; crosswalk notes. |
| X15 | Allocation 4 | B18's real-migration owner dropped by the Step 25 decision. | Recorded in B23 and above. |
| X16 | Allocation 5 | Step 25's committed set was ambiguous between the commit and the pull request. | Applied: Step 25 verify names the self-hosting commit. |
| X17 | Allocation 6 | A model-authored specification set cannot be authority. | Applied: Step 29 pauses Stage 10 if the set is absent; Step 30 excludes it. |
| X18 | Allocation 7 | Landing authority unstated for Steps 27, 30 and 31. | Applied: each step's prose. |
| X19 | Allocation 8 | Fix-forward did not renumber the version line. | Applied: Guide v19 §Release failure; Step 28 run. |
| X20 | Allocation 9 | `CP01/R03` fixture wording broke the consumer fixtures. | Applied: `CP01/R03`. |
| X21 | Allocation 10 | Runtime-written files in Kakeibo unasserted. | Applied: Step 30 verify. |
| X22 | Allocation 11 | No accepted requirement makes `validate` print the replay identities. | Applied: Step 25 verify no longer relies on it. |
| X23 | Allocation 12 | Control attribution in the Step 24 suite; exit-table citation for one-shot equivalence. | Applied: Step 24 verify; table cites S16/AC16. |
| — | Both | Contract-only items (binding placement, binding counts, contract `then` wording). | Moot after the conversion was removed. |

Owner review [5330105036](https://github.com/sb-dev/pactwright/pull/53#pullrequestreview-5330105036) examined `b3b1553` and returned five P1 findings. They concern contract text that the prose now replaces, but each applies to the prose too:

| ID | Owner finding | Disposition |
|---|---|---|
| O1 | Step 30 verified a shorter list than Kakeibo 02 §14, and the Kakeibo repository was not read. | Applied: 02, 05, 06, 07 and README read at `75443233`; Step 30's set is 02 §14 verbatim plus the two profile invariants; §15 criteria in the Contract; no deferral to Step 31 (B26). |
| O2 | An existing `package.json` cannot stay byte-identical through `pnpm add`. | Applied: Step 29 keeps the workspace file byte-identical and the manifest apart from package-manager fields (B26). |
| O3 | The one-shot fixture Extension was consumed but never produced. | Applied: Step 22 packs and verifies both fixture Extension archives; Steps 23 and 24 install them (B22). |
| O4 | Material and blocking overlapped. | Applied: blocking takes precedence; Step 31 verify has the dual-qualifying control (B27). |
| O5 | Semantic approvals were identified but not evidenced. | Resolved: the owner approved all four decisions directly in the producing session on 2026-09-27, recorded above and on the PR. |

**Fresh review** of `dd93560` (read-only, this session) returned four blocking and eleven non-blocking findings:

| ID | Finding | Disposition |
|---|---|---|
| F1 | `CP01/R05` demanded the final revision for all non-publication lines, forcing Step 24's real-model Delivery to be re-run at the end. | Applied: revision per evidence group; current means produced on its named revision and unaffected since. |
| F2 | The CHANGELOG rule required Evidence the fresh self-hosted graph cannot hold for Steps 1–24. | Applied: Guide v19 and Step 28 describe pre-self-hosting work from accepted results. |
| F3 | `pnpm add -D` fails at the Kakeibo workspace root. | Applied: `pnpm add -D -w`; reproduced here. |
| F4 | Stage 10 omitted Kakeibo 07, which owns the foundation files. | Applied: §2, Stage 10, Steps 29 and 30. |
| F5 | Step 22 said Step 28 repacks. | Applied: Steps 26 and 27 repack; Step 28 publishes through the workflow. |
| F6 | Step 26's proven behaviour required evidence of its own revision that cannot exist. | Applied: includes the step's own fixture execution. |
| F7 | Step 24 omitted the closure position and over-pinned `next`. | Applied: `prepare-evidence` stop added; `status` and `next` defer to CP01-S08/AC01. |
| F8 | Step 23's refusal cases ran in an order that changes their starting state. | Applied: `init --with` refusal first. |
| F9 | Step 25's prompt-edit probe did not say it uses a throwaway copy. | Applied: disposable, never committed copy. |
| F10 | Step 27 lacked Step 26's lineage and decider checks, and B24 mislabelled its command list as Distribution §27's. | Applied: Step 27 verify; B24 wording. |
| F11 | Step 30's "own lineage" clashed with tests and fixtures; two profile §5 checks missing. | Applied: tests and fixtures via the domain lineage; no-real-export and no-hidden-engine checks. |
| F12 | Step 29 checked a `node_modules` ignore rule it never wrote. | Applied: Step 29 adds it when absent. |
| F13 | `CP01/AC03` held a simplicity assertion; `AC04` used an undefined declared dependency set. | Applied: workspace-package check moved to `AC04`; dependencies traced to requirements. |
| F14 | B22 and B25 attributed text to runbook version 14; it is version 12 at `207ac08`. | Applied: both records. |
| F15 | The owner-decisions table omitted the consequence of keeping the prose form. | Applied: first row of that table. |

The fresh reviewer confirmed that `pnpm contracts:check` and `pnpm test` pass, every cited criterion ID and case name exists with the claimed meaning, X1–X23 match the amended text, and Guide v19 changes only its three stated sections. These corrections were authored by this record's author and need fresh review (methodology §6); the owner's next review of the PR is requested as that review.

## Checkpoint-level result (§7)

Identity, storage, relationships and authority were settled in Stages 1–5. The shared decisions of Stages 6–11 are the archive identity, fixture isolation, the first real AI execution and its approvals, the project-state boundary, the landing process, the self-hosting threshold, the exact-version instruction, the release receipts and fix-forward rule, the Kakeibo foundation split and authority, and the finding definitions. They agree across Steps 22–31, `checkpoint.yml`, Checkpoint 1 v31 and Guide v19. The one accepted premise they change is the Stage 2 exit record's expectation that Step 25 migrates self-hosted records (B23), which the owner decides.

**Verification on the changed tree** (Node v22.22.2, pnpm 11.7.0):

| Command | Result |
|---|---|
| `pnpm contracts:check` | `docs/checkpoints/01-self-hosted-delivery: ok` |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck` | pass |
| `pnpm test` | 25 tests, 25 pass, 0 fail |
| `pnpm build` / `pnpm verify` | FAIL, inherited: no runtime sources and no `@pactwright/standard` project on `refactor/pactwright-v2`; identical on `0f81839`, as the Stage 4 and 5 exit records recorded |
| Batch challenge plans | executed as recorded in B22–B27 (registry reads of both packages on 2026-09-27; `207ac08`, `defd052` and `origin/main` reads; README, CHANGELOG and docs greps at `0f81839`; Checkpoint 2 greps; Kakeibo README, 02, 05, 06 and 07 at `75443233`; `ERR_PNPM_ADDING_TO_ROOT` and `-w` reproduced with pnpm 12.6.0) |
| Not verified | the current Kakeibo default-branch revision; Step 29 records the revision it runs against, and Step 30 re-derives its invariant set if 02 changed |

With the owner's approvals recorded above, Stages 6–11 are requirement-ready in the methodology §7 sense once a fresh review accepts the corrections of `945545e`; the result is: no unresolved behaviour needed by Steps 22–31 remains in their prose; each obligation has a stated verification; and deferred proofs have owners (Checkpoint 2's invoker, `0.0.3` and Kakeibo upgrade; Checkpoint 3's Source ingestion; the owner's Release-line amendment if a further corrective release is needed). Checkpoint-wide, the simplicity, graph-boundary and self-hosting obligations are declared and inherited (`CP01/R02`–`R05`) and every exit-gate line has a named proof. This is scoped T2 work: it authorises no implementation, builds no harness and grants no acceptance.

**Checkpoint 1 Stages 6–11 exit review v1**
