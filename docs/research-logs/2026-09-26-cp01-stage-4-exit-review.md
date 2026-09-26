# Checkpoint 1 Stage 4 — T2 stage-level exit review

**Scope:** Spec 00 T2 for Checkpoint 1 Stage 4 (CP01-S14 to CP01-S19) under the [resolution methodology](../open-question-resolution-methodology.md) v2 §7. Reviewed on branch `claude/stage-4-step-contracts`, base `refactor/pactwright-v2` at `0ef869c`. Source revisions at review: Core v6, Distribution v5, Implementation Guide v17, Principles v4, Checkpoint 1 v29, Spec 00 v5, contract format 2. Questions Q41–Q51 keep their crosswalk IDs and wording; the batch records [B15](./2026-09-26-cp01-stage-4-b15-init-and-scaffold.md), [B16](./2026-09-26-cp01-stage-4-b16-extension-composition.md), [B17](./2026-09-26-cp01-stage-4-b17-environment-identity.md) and [B18](./2026-09-26-cp01-stage-4-b18-doctor-and-runtime-upgrade.md) remain the decision records.

## Method

Two independent read-only reviewers ran on the uncommitted tree. One checked whole-stage consistency: the Q41–Q51 dispositions under the two-implementations test; identity, storage, authority and failure agreement across S14–S19 and with Distribution v5 / Core v6; requirement coverage, case distinctness, binding uniqueness, `requires` and `inputs` order, deliverable-summary equality and loss against `0ef869c`; pinned behaviour against the released `207ac08` code; and the env1 vectors. The other audited cross-stage allocation: contradictions with requirement-ready Stages 1–3 and their exit follow-ups, the Stage 5 contracts, the unconverted Steps 22–31, Checkpoint 2 §3 and Steps 7 and one-shot `init --github`, Checkpoint 5 and Distribution §§6–8, the Guide and Principles, the exit gate and every later owner the records name. Each refuted its own candidates before reporting. The author verified every finding against the text before acting.

## Findings and dispositions

The two reviews ran at `c750a60`. Blocking findings, applied in this pass:

| ID | Location | Finding | Correction |
|---|---|---|---|
| X1 | Distribution §15 migration table, "Released unversioned lock"; S19/AC14 | The row still required a "compatible complete target environment", so for the real consumer path (`@pactwright/standard@0.0.1` pins `pactwright: 0.0.1`) one implementation refuses the released-format migration and another completes it runtime-ahead, and S19/AC06–AC07 could not tell them apart. | The row records a selected pack whose declared range excludes the target unchanged under the runtime-ahead rule. S19/AC14 `released-migration-with-pinned-pack`: the AC06 project with the pinned pack migrates, writes the version 1 lock with the pack unchanged, exits zero and reports the pack as action required. |
| X2 | Distribution §13; S15/R03, AC09 | "An incompatible resolution is rejected before a new environment is accepted" and "the lock is written only after agreement and validation succeed" contradicted the runtime-ahead lock, so an implementation passing S19/AC14 failed S15/AC09. | §13, S15/R03 and AC09 carve out the runtime-ahead lock as the one exception: it records an incompatible component unchanged and is not an accepted executable environment. |

Non-blocking findings, applied:

| ID | Correction |
|---|---|
| X3 | Distribution §15 and S19/R05 pin what `upgrade` does while a recovery record exists: only `--to` naming the record's recovery target (the previous runtime after an interrupted or failed upgrade, the current runtime after a failed rollback) is accepted; it writes no new record, performs the recovery the record's stage requires (byte restoration and the seam's restore request, or re-running the forward migration over released-format stores) and removes the record; any other invocation is refused naming the record. S19/AC05 `other-target-refused`; the `interrupted-after-replacement` case asserts the remediation and that no new record is written. Doctor's remediation names the record's recovery target (§16, S18/R05). |
| X4 | Distribution §3 states that `validate` reports the scaffold valid and exits zero, the missing selection being doctor's finding; S14/R03 and AC02 `validate-passes`. |
| X5 | The seam's removal request covers an Extension's package on `extension remove` (Distribution §15, S11/R08), instead of a separate sentence beside the request list. |
| X6 | S14/AC02 no longer derives `environment_lock_hash` at Step 14, which S11/R09 reserves for Step 15; R03 defers to CP01-S15/AC11 (second reviewer). |
| X7 | S18/AC02 no longer builds a Step 19 recovery record; the interrupted-upgrade diagnosis stays with S19/AC05, where the record exists (second reviewer). |
| X8 | S17/AC03 `incompatible-pack` proves sync refuses the runtime-ahead lock that Distribution §15 relies on (second reviewer). |
| X9 | S14/R01 qualifies "creates no generated directory" to plain init (second reviewer). |
| X10 | S18 declares the `package-manager-delegation` input its version listing uses (second reviewer). |
| X11 | Distribution §16 and S18/R04, R05, AC02 `disabled-in-configuration-only`: a configuration ↔ lock disagreement about an Extension's enabled state, such as a hand-edited `enabled: false` whose lock entry remains, is action required with `pactwright extension disable <id>` or `extension add <id>` as the remediation, so Principles §11's "edit the owning configuration" path has a defined outcome (second reviewer). |
| X12 | Distribution §15 rollback blockers include a project with no selected pack, since the released lock needs one (second reviewer). |
| X13 | Distribution §3's refusal clause covers `--github` without a selection, which Checkpoint 2 line 451 expects (second reviewer). |
| X14 | S18/AC02 `lock-drift` names the drifted component (the fixture Extension), so its remediation is testable. |
| X15 | Crosswalk header names the `affects` entries this pass added (S15/AC11, S16/AC06); Q47 gains S17/AC03. |
| X16 | B18 names Checkpoint 2 Step 17, not Step 7, and records the removal of S19/AC05 `no-compatible-environment` and R05's draft clause, split into R12/AC14 and AC05 `missing-capability`. |
| X17 | The env1 fixture's `fixture-base` entry carries a `graph` block, as Distribution §12 requires of an enabled Extension entry; its digests were regenerated and the definition test passes. |
| X18 | This record exists; the first commit `c750a60` carried it as pending. |

Later-stage follow-ups, owned and non-blocking for Stage 4:

- **Checkpoint 2 (owner decision; not edited by this pass):** §3 line 104 "Every completed operation must leave a compatible resolved environment", line 106 "regenerates locks and runs validation", line 110 "verify … compatibility of all still-enabled components" and Step 17 lines 669 and 700 ("the still-compatible selected pack"; "Record compatibility … after each upgrade") are inconsistent with the runtime-ahead state, in which `pactwright upgrade --to 0.0.2` on a `0.0.1` project exits zero with the pack reported as action required and runs no sync; line 449 should read `init --agent-pack <source>` rather than a "selection interaction". Line 667's `validate` after the runtime upgrade can pass, since Core §57 has no environment-compatibility rule; the owner should confirm that reading.
- **Checkpoint 2 (`init --github`):** init on a partial scaffold (configuration present, lock absent) and `init --with`/`--github` on an initialised project with a pack already selected and no `--agent-pack` are not pinned by Stage 4; Distribution §3 covers the initialised-project case only for a named selection.
- **Exit gate wording (optional):** the `pactwright upgrade` gate line could name the runtime-ahead state, which Checkpoint 2 Step 17 now depends on.

## Stage-level result (§7)

Checks confirmed by the reviewers at `c750a60` and unchanged by the corrections: every S14–S19 requirement has an exercising criterion; verifier bindings across CP01 are unique; case names are unique per criterion; `requires` and `inputs` are feasible in step order (Step 12 precedes Step 16; Step 11's seam output precedes Steps 16, 18 and 19); the Stage 4 deliverable summaries equal the contract `outputs` (46 of 46 across CP01); no requirement, criterion, `covers`, `source` or `verify` entry from `0ef869c` was removed without explanation (X16); Q41–Q51 each have a supported disposition; the Stage 1 exit review's Q42 constraint is met by the first branch (plain init writes a lock; Core §§54/56, S01/AC09 and S05/AC12 unchanged); the S09/R06 and S11/R08 amendments are the consequences B11 and B12 planned; Checkpoint 5 §4 and Distribution §§6–8 agree with "declared by the selected pack's installed manifest"; the Guide and Principles §§12, 20, 21 are not contradicted; every Stage 4 exit-gate line has an owning criterion; every later owner the records name exists. The claims the records make about the released `207ac08` code were verified against it, and the four env1 digests were recomputed independently.

With X1–X17 applied, the corrected tree is consistent with Distribution v5 and Core v6, and no unresolved behaviour needed by Stage 4 steps remains. The corrections were authored by the record's author and so require fresh independent review (methodology §6); the verdict below records that review's result. This is scoped T2 work; it authorises no implementation, harness construction or acceptance.

**Fresh review of the corrections (methodology §6):** pending at this revision; its result and verdict are recorded in the next revision of this record.

## Verification

Commands on the corrected tree, Node `v22.22.2`, pnpm `11.7.0`:

| Command | Result |
|---|---|
| `pnpm contracts:check` | PASS |
| `pnpm format:check` | PASS |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS, 25/25 (20 existing, 5 env1 vector checks) |
| `pnpm build` / `pnpm verify` | FAIL, inherited: no runtime sources and no `@pactwright/standard` project; identical on `0ef869c` |

Recorded challenge-plan checks executed by the author: the released `207ac08` reads cited in B15–B18; the Checkpoint 2, 5 and later-checkpoint greps; deliverable-summary equality (46 of 46 outputs across CP01-S01–S21 equal their summaries); verifier-binding uniqueness across CP01; case-name uniqueness per criterion; independent recomputation of the four env1 digests in Python and in the Node definition test. Schema, citation and mapping checks establish structural consistency only. No verifier binding, runtime or harness was executed.
