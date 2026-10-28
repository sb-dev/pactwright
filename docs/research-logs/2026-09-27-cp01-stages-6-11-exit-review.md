# Checkpoint 1 Stages 6–11 — T2 exit review and checkpoint-wide acceptance

**Scope:** Spec 00 T2 for Checkpoint 1 Stages 6–11 (Steps 22–31) and the checkpoint-wide obligations T2 requires, under the [resolution methodology](../open-question-resolution-methodology.md) v2 §7. Branch `claude/cp01-stages-6-11-contracts`, base `refactor/pactwright-v2` at `0f81839`. Source revisions at review: Implementation Guide v19 (from v18), Core v6, Distribution v5, OSS v2, Principles v4, Kakeibo Acceptance Profile v2, Checkpoint 1 v31 (from v30), Checkpoint 2 v18, Spec 00 v6 (from v5), contract format 2. Questions Q57–Q67 are recorded in the crosswalk; the batch records [B22](./2026-09-27-cp01-stages-6-11-b22-packed-consumer-proofs.md) to [B28](./2026-09-27-cp01-stages-6-11-b28-unconverted-steps.md) are the decision records.

## Current execution decision — 1 October 2026

The [superseding Q67 owner decision](https://github.com/sb-dev/pactwright/pull/60#issuecomment-5938936037) replaces the original convert-before-run boundary. Steps 22–31 remain reviewed prose operational/CLI steps under Spec 00 v8 §§2, 4–5. T3.5-H3 executes their pinned procedures directly, T4 proves rejection of invalid operational evidence, and T5 uses the proven path. Hash protection and shared checkpoint obligations remain in force.

The T2 results and review evidence below remain historical records. They do not establish acceptance of the new execution path. [B28 v2](./2026-09-27-cp01-stages-6-11-b28-unconverted-steps.md) identifies retained checker evidence and the new proof required from T3.5 and T4.

## Original T2 method

The first commit on this branch, `b3b1553`, converted Steps 22–31 into contract files. The owner then stated that Task 1 is complete and that Task 2 does not convert steps, and chose, when asked, to have Steps 22–31 reviewed and amended in their version 17 prose form. The conversion was removed. The T2 decisions it had reached were re-expressed as prose amendments to Steps 22–31, `CP01/R02`–`R05` in `checkpoint.yml`, Guide v19 and the crosswalk's question list. Original consequence, now superseded by the current execution decision: the Task 3 plan (§2) says unconverted Markdown cannot execute or count towards checkpoint completion, so the harness cannot run Steps 22–31 until they are converted. Owner review 5330975497 then found that this decision contradicted Spec 00 §2 and was recorded only in notes; B28 resolves it in Spec 00 v6, which defines unconverted steps, records their reviewed hashes in `checkpoint.yml` and makes `pnpm contracts:check` detect them.

The review covered the five T2 checks for each step: canonical fidelity against the owning clauses; positive and negative coverage in "Verify before continuing"; step dependencies on earlier steps and accepted contracts; a stated verification method for every obligation; and complete product scope against the checkpoint goal, §4 and the exit gate. Two independent read-only reviewers examined `b3b1553`: one for whole-checkpoint consistency, one for cross-stage allocation and authority. Their semantic findings apply to the prose as well and are listed below with their dispositions. A fresh read-only reviewer then examined the prose amendments (section "Fresh review").

## Owner decisions this pass needs

The owner approved all four semantic decisions in the producing session on 2026-09-27, answering direct questions (the owner had asked to be asked directly rather than through the PR). Each question, summarised, and its answer: Step 25 start state (fresh `init`; `main`'s self-hosted records stay Git history, not migrated): "Approve"; Implementation Guide v19 clauses (release-PR procedure from `0.0.2` with an owner-merged pull request; CHANGELOG from accepted work only; an unpublished tag may be recreated; a published defect consumes the version number and renumbers later versions; before Project Intelligence, findings become open Intents): "Approve"; Step 30 invariant set (Kakeibo 02 §14 verbatim at `75443233` plus the credit-card and goal-contribution invariants, re-derived through a reviewed amendment if the recorded revision differs, nothing deferred to Step 31): "Approve"; `0.0.2` wording in §1 and the Stage 8 and 9 headings: "Approve". The PR carries a comment recording these answers. On the same day the owner approved, again in answer to a direct question, two refinements raised by the second and third fresh reviews: the Step 30 set is re-derived only if §14 itself differs, and the CHANGELOG describes work up to and including Step 25's acceptance from its step or criterion results. The owner also approved correcting the "version 14" mentions to version 12. The Kakeibo write authority is different: it is an execution prerequisite for Steps 29 and 30, granted by the Kakeibo owner at execution, not by this review.

| Decision | Where | Effect |
|---|---|---|
| Steps 22–31 keep the reviewed prose form | Checkpoint 1 §3; Spec 00 v8 §§2, 4, 5; `checkpoint.yml` `prose_steps`; B28 v2 | Decided by the owner in the producing session on 2026-09-27 ("T2 on the prose"). After review 5330975497 the owner directed: "Do anything you think is necessary to support my decision to keep these steps in prose, in order to complete task 2." B28 applies that direction; owner review 5331122570 confirmed Spec 00 v6's convert-before-run boundary. That execution boundary was superseded by the [1 October owner decision](https://github.com/sb-dev/pactwright/pull/60#issuecomment-5938936037). Current consequence: T3.5-H3 executes the pinned operational procedures without YAML conversion; verification, review, authority and receipts still determine acceptance. |
| Project-state boundary for self-hosting (Q60) | Step 25 Run | Step 25 starts from a candidate with no Pactwright project state; `main`'s self-hosted records stay Git history. B23 records why migration is infeasible under the accepted Stage 4 contracts. |
| Guide v19 clauses (Q62, Q65) | Guide §Preparing a development release, §Release failure, §Transition rule | Release-PR procedure from `0.0.2` with the owner-merged pull request as pre-Checkpoint-2 landing; CHANGELOG from accepted work only (Evidence for work after Step 25's acceptance, step or criterion results for work up to and including it, nothing outside the tagged graph; refinement approved on 2026-09-27); unpublished tag may be recreated; a published defect consumes a number and renumbers the version line; findings before Project Intelligence become open Intents. |
| Step 30 invariant set (Q64) | Step 30 | Kakeibo 02 §14 at `75443233`, re-derived through a reviewed amendment only if §14 at the recorded revision differs (refinement approved on 2026-09-27); no invariant deferred to Step 31. |
| `0.0.2` wording (Q61) | Checkpoint 1 §1, Stage 8 and 9 headings | The release is `0.0.2`; `0.0.1` names the content set. Step 27's `0.0.2` wording follows from the approved headings. |

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
| O6 | Review 5330975497 at `ac08ec9`: T2 was declared complete without contracts for Steps 22–31, contrary to Spec 00 §2, and `pnpm contracts:check` could not detect the ten missing contracts. | Applied (B28), with the review's second option in a convert-before-run form: Spec 00 v6 defines unconverted steps; `checkpoint.yml` lists Steps 22–31 under `prose_steps` with hashes of their reviewed text, stage introductions included; the checker reports a step with neither form, both forms, a repeated heading or changed text, and checks a later conversion against its reviewed hash; the original harness pauses at an unconverted step and the original T5 allocation required conversion first. Owner review 5331122570 confirmed that historical boundary; the current Q67 decision above supersedes it. |
| O7 | Review 5331097103 at `41f4e47` (O1–O6 resolved): a repeated step heading overwrote the earlier section, so an unreviewed `### Step 22` placed before the real one left the checker green. | Applied in `a70f60f` as J6, which the review predates: every repeated step heading, converted or unconverted, is an error, with a planted-defect test. The reviewer's exact case at `a70f60f` reports "Step 22 has more than one heading". |

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

**Second fresh review** of the corrections at `da4b4f3` (read-only, this session) confirmed that O1–O4 and F1–F15 are present, that Step 30's block is byte-identical to 02 §14 at `75443233`, that the Kakeibo citations support their sentences, and that `pnpm add -D -w` succeeds where `pnpm add -D` fails. It returned one blocking and eleven non-blocking findings:

| ID | Finding | Disposition |
|---|---|---|
| G1 | Blocking: the crosswalk header attached the owner's approval to every applied clause, not the four decisions asked; the Q61 row named Step 27, which the question did not. | Applied: the header names Q60, Q61, Q62/Q65 and Q64; the Q61 row says Step 27 follows from the headings. |
| G2 | Step 30's "These include" sentence pointed at §14, which holds neither profile invariant; allocation is 02 §6.2, not §6.3. | Applied: "In addition to §14 …" with 02 §§6.2, 6.3, 11. |
| G3 | `CP01/R05` revision groups overlapped for the self-hosted Delivery lines. | Applied: final revision only for the convergence and coherence line and Step 31, re-running only `validate` and `lifecycle status`. |
| G4 | Step 30's re-derivation trigger fired on any Kakeibo commit. | Applied: fires only if 02 §14 differs from the block. |
| G5 | Step 29's 07 citation implied CI and Kei assets; neither References line cited 07. | Applied: the listed items only, later 07 §49 items excluded; 07 in both References lines. |
| G6 | The Guide said "checkpoint results" for a checkpoint not yet accepted; Step 25's own work fell between the two CHANGELOG rules. | Applied: "step or criterion results" in both; the boundary is Step 25's acceptance. |
| G7 | Step 26's proven set became circular. | Applied: the fixture confirms the proven set and adds nothing to it. |
| G8 | Step 24 deferred `status`/`next` to S08/AC01, which has no no-lineage case. | Applied: no-lineage behaviour stated; closure is S08/AC01's shape-step case. |
| G9 | `CP01/AC03` still inspected workspace packages; `AC04` did not inventory them. | Applied. |
| G10 | Step 22's verify header said "both archives". | Applied: four archives; same version for the two published ones. |
| G11 | Checkpoint 1 (header, Step 28) and Guide v19 (§Public-product progression, §npm release model) say `0.0.1` was published against runbook version 14; the `v0.0.1` tag `207ac08` carries version 12, and version 14 first appears in `84e32cd` on 2026-09-07. | Applied with the owner's approval, given in answer to a direct question on 2026-09-27 ("Correct to v12"): the four mentions, and a fifth in `CHANGELOG.md` found by the third review, now say version 12, the version tagged `v0.0.1`. |
| G12 | The owner-decisions table listed the Kakeibo write authority; "verbatim in substance" was self-contradictory. | Applied: row removed; "summarised". |

**Third fresh review** of `7fde9d0` (read-only) confirmed G1, G2, G4, G5, G7, G9, G10, G12 and the version-12 edits, and returned:

| ID | Finding | Disposition |
|---|---|---|
| H1 | Blocking: `CP01/R05` bound the sync-convergence line to the final revision, where only `validate` and `lifecycle status` run, which cannot prove convergence. | Applied: that line stays on the revisions of its proving steps; only the Step 31 line uses the final revision. |
| H2 | `CHANGELOG.md` held a fifth "version 14" mention. | Applied under the owner's version-12 approval. |
| H3 | Step 25's own work fell between the two CHANGELOG rules. | Applied: "up to and including Step 25's acceptance"; the owner approved this refinement on 2026-09-27. |
| H4 | The owner-decisions rows still showed the pre-G4 and pre-G6 wording. | Applied: both rows updated; the owner approved both refinements on 2026-09-27 in answer to a direct question. |
| H5 | Step 24 cited a closure case CP01-S08/AC01 does not have. | Applied: the closure position's `status` and `next` are stated, citing AC01's "shape step otherwise" branch. |

**Fourth fresh review** of `e7e2937` (read-only) confirmed H1–H5 fixed, found every exit-gate line provable in a named revision group, confirmed that no approval claim exceeds the questions asked, and returned **ACCEPT WITH NON-BLOCKING ITEMS**:

| ID | Finding | Disposition |
|---|---|---|
| I1 | Step 24's closure clause dropped the rest of CP01-S08/AC01's `then` at that position. | Applied: the full `then` applies there, with Delivery and Review completed. |
| I2 | The exit record credited both refinements to the third review. | Applied: second and third reviews. |
| I3 | B25 and B26 still carried wording superseded by G2, G4 and G6. | Applied: both records aligned. |

The review also asked whether the CHANGELOG question put to the owner contained "step or criterion results"; it did, verbatim.

**Fifth fresh review** of B28 at `41f4e47` (read-only) recomputed all ten hashes independently, confirmed by mutation that each new check had a failing test, and returned **CHANGES REQUIRED**:

| ID | Finding | Disposition |
|---|---|---|
| J1 | Blocking: the Stage 10 introduction, which holds the Kakeibo write authority, was outside every hash; deleting that sentence left the checker green. | Applied: a stage's heading and introduction belong to its first step's hashed text (Spec 00 §2, `stepSections`); hashes of Steps 22, 25, 27, 28, 29 and 31 re-recorded; a planted-defect test deletes the authority sentence. |
| J2 | Blocking unless the owner confirms: the review asked for an executable prose form; v6 defines a convert-before-run form, and B28's reason cited the clause being amended. | Applied: B28 quotes both options, states that v6 takes the second in a convert-before-run form, justifies it (executing prose means unreviewed conversion at dispatch) and lists the owner's confirmation as open. |
| J3 | T3, T4, the §2 opening, the T1–T2 summary and the source basis did not reflect v6. | Applied in Spec 00 v6. The Task 3 plan still cites v5; Spec 00's T3 row now governs the pause. |
| J4 | Eligibility of an unconverted step and the exact hash input were undefined. | Applied: eligible once every earlier step is accepted; UTF-8, LF, no final newline, the exact heading form. |
| J5 | Nothing tied a later conversion to the reviewed text. | Applied: the conversion moves the hash to its crosswalk source as `reviewed`, which the checker verifies; tested with a failing and a passing case. |
| J6 | No test for an entry without a heading; repeated headings overwrote each other. | Applied: both reported and tested. |
| J7 | Records overstated readiness while v6 awaits approval; a paraphrase of review 5330975497; no statement on re-running challenges; `checkpoint.yml` cited a commit a squash merge removes. | Applied: readiness is conditional on the owner's approval of v6; B28 quotes what the review said; challenges not re-run because no step text changed; the comment cites PR #53 and B28. |

**Sixth fresh review** of `a70f60f` (read-only) recomputed the ten hashes, found every J item applied and returned **ACCEPT WITH NON-BLOCKING ITEMS**. Owner review 5331122570 then passed `2ca1724`. Asked whether these items should wait for a follow-up, the owner answered "No follow up, I asked to complete task 2", so they are applied here:

| ID | Finding | Disposition |
|---|---|---|
| K1 | Spec 00 §2 did not say which `##` heading starts an intro, what counts as a heading or which whitespace is trailing. | Applied: the last `##` heading before the step; any line starting with `## `; ECMAScript `trimEnd`; tests for the last-heading rule and trailing whitespace. |
| K2 | Once Step 29 is converted, the Stage 10 introduction and its Kakeibo write authority would leave every hash, and a crosswalk quoted only step sections. | Applied: `splitUnits` emits a stage introduction as the first step's `intro` units, so a conversion must quote it; Stages 1–5 have empty introductions at every crosswalk source, so no existing mapping changes; tested. |
| K3 | The check for a `reviewed` hash on an unlisted step had no test, and the passing `reviewed` case was manual. | Applied: both are tests; J5 and the verification row are now accurate. |
| K4 | The crosswalk header said the owner directed "the Q67 resolution"; B28 and this record still listed the v6 confirmation as open. | Applied: the header says the owner directed that Steps 22–31 stay in prose and cites review 5331122570; B28 and this record cite that review. |
| K5 | The T2 title, §2's "coverage views" sentence and the source-check skip conditions predated v6; the Task 3 plan cites Spec 00 v5. | Applied to Spec 00. The Task 3 plan is left as written: it records the versions it was planned against, and Spec 00's T3 row now governs the pause. |

**Seventh fresh review** of `b0861d8` (read-only) confirmed K1–K5, that Steps 1–21 keep identical units at every crosswalk source, and the mutation claims, and returned **ACCEPT WITH NON-BLOCKING ITEMS**. Owner review 5331273962 passed `b0861d8`. Under the owner's "No follow up" instruction the items are applied here:

| ID | Finding | Disposition |
|---|---|---|
| L1 | Step prose after `**References:**` and before the first Run, Expected result or Verify label was discarded; Steps 27 and 28 have no Run label, so most of their obligations, including Step 28's publish authority, would not need quoting at conversion. | Applied: that prose becomes `body` units (Spec 00 §2, `splitUnits`); no converted step has such text at its crosswalk source, so the checker still passes; tested with Step 28's publish-authority sentence. |
| L2 | This record called 5331122570 a pass of the whole change after `b0861d8` changed normative text. | Applied: the result paragraph names what each owner review passed and that L1–L4 need the owner's re-check. |
| L3 | The PR description still said 32 tests and had no K1–K5 row. | Applied on the PR. |
| L4 | A label or References line inside a stage introduction would leave the `intro` part and shift the step's own unit numbering. | Applied: inside an introduction such lines are intro text; tested. |

## Checkpoint-level result (§7)

Identity, storage, relationships and authority were settled in Stages 1–5. The shared decisions of Stages 6–11 are the archive identity, fixture isolation, the first real AI execution and its approvals, the project-state boundary, the landing process, the self-hosting threshold, the exact-version instruction, the release receipts and fix-forward rule, the Kakeibo foundation split and authority, and the finding definitions. They agree across Steps 22–31, `checkpoint.yml`, Checkpoint 1 v31 and Guide v19. The one accepted premise they change is the Stage 2 exit record's expectation that Step 25 migrates self-hosted records (B23), which the owner decides.

**Verification on the changed tree** (Node v22.22.2, pnpm 11.7.0):

| Command | Result |
|---|---|
| `pnpm contracts:check` | `docs/checkpoints/01-self-hosted-delivery: ok` |
| `pnpm format:check`, `pnpm lint`, `pnpm typecheck` | pass |
| `pnpm test` | 39 tests, 39 pass, 0 fail (fourteen tests added by B28; disabling any new check, or the `trimEnd` normalisation, fails at least one) |
| `pnpm build` / `pnpm verify` | FAIL, inherited: no runtime sources and no `@pactwright/standard` project on `refactor/pactwright-v2`; identical on `0f81839`, as the Stage 4 and 5 exit records recorded |
| Batch challenge plans | executed as recorded in B22–B27 (registry reads of both packages on 2026-09-27; `207ac08`, `defd052` and `origin/main` reads; README, CHANGELOG and docs greps at `0f81839`; Checkpoint 2 greps; Kakeibo README, 02, 05, 06 and 07 at `75443233`; `ERR_PNPM_ADDING_TO_ROOT` and `-w` reproduced with pnpm 12.6.0) |
| B28 | the ten `prose_steps` hashes equal those of the text at `ac08ec9`, so no step section or stage introduction changed after the reviewed head and the B22–B27 challenge plans were not re-run |
| Not verified | the current Kakeibo default-branch revision; Step 29 records the revision it runs against, and Step 30 re-derives its invariant set if 02 changed |

With the owner's approvals recorded above, the fourth fresh review's acceptance, whose non-blocking items I1–I3 are applied here, the J1–J7, K1–K5 and L1–L4 corrections, owner review 5331122570, which passed `2ca1724` and confirmed Spec 00 v6, and owner review 5331273962, which passed K1–K5 at `b0861d8`, Stages 6–11 are requirement-ready once the owner re-checks the L1–L4 commit in the methodology §7 sense: no unresolved behaviour needed by Steps 22–31 remains in their prose; each obligation has a stated verification; and deferred proofs have owners (Checkpoint 2's invoker, `0.0.3` and Kakeibo upgrade; Checkpoint 3's Source ingestion; the owner's Release-line amendment if a further corrective release is needed). Checkpoint-wide, the simplicity, graph-boundary and self-hosting obligations are declared and inherited (`CP01/R02`–`R05`) and every exit-gate line has a named proof. Steps 22–31 remain unconverted steps with reviewed prose pinned by hash and checked. Under the current Spec 00 v8 rule, T3.5-H3 executes them as reviewed operational steps without prior conversion. That path requires new T3.5 and T4 proof; the historical verification table above does not establish it. This is scoped T2 work: it authorises no implementation, builds no harness and grants no acceptance.

**Revision record:** v2 reconciles Q67 with the approved operational-step rule. Original T2 review and execution results remain historical evidence.

**Checkpoint 1 Stages 6–11 exit review v2**
