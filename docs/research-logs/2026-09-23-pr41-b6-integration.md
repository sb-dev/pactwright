# PR #41 B6 — Integration and final validation

**Scope:** PR #41, `claude/checkpoint-contract-files-o06rm4`, starting `73dad7b2aa5cc00bdccf9e6e51908d7a0480913a`; Checkpoint 1 Stage 1 only. Source revisions: Core v1, Checkpoint 1 v18, Spec 00 v3, methodology v1, contract format 2. The crosswalk retains its v17 source `26ea12a` and original Q01–Q20 wording.

**Authorisation and definition history:** the owner requested resolution and fixes in this conversation; [the original SHA-bound outcome](https://github.com/sb-dev/pactwright/pull/41#issuecomment-5802879622) identifies resolution `0363777` and cleanup `1bcd2ea`. The owner's subsequent instruction to address the new review is recorded in [the correction hand-off](https://github.com/sb-dev/pactwright/pull/41#issuecomment-5808776011) at `1bcd2ea667ac32912b7af96a9978416379fc1b91`. This pass keeps the chosen direction while correcting the review findings, including the explicitly named compatibility changes. Core v3 and Checkpoint 1 v20 replace v2/v19 for new attempts; dependent specifications/checkpoints are amended at their owners. Earlier definitions and evidence remain in Git, not silently reused. No runtime or harness is implemented.

**Acceptance status:** [independent review 5298715756](https://github.com/sb-dev/pactwright/pull/41#pullrequestreview-5298715756) returned changes required at `1bcd2ea`. The corrections below are applied for fresh review, not self-accepted. The inherited build failure remains a failed mandatory gate; B6 and the SHA-bound PR reply distinguish current checks from future acceptance.

**Dependencies:** B1–B5. **Q20 — explicit answer:** yes. The early loader, record/projection, edge, lineage and revision mechanisms must be reused by their real later consumers; only execution of those integrated proofs is deferred to the step where each entry point exists. A fixture never establishes installed Extension or adapter capability.

**Affected definitions:** S01/R05–R06/R09, AC05–AC12; S02/R07–R09, AC06–AC13; S03/R03/R05–R09, AC06–AC13; S04/R01–R06, AC01–AC10; S05/R01–R07, AC03–AC15; CP01 Steps 6–9/11–12/14–16/18–19/24. Owners: Core §§6/9/15/27/44–45/54–57 and Distribution §§10–12/15–16.

## Applied integration and review fixes

| Owner | Required actual proof / review finding |
|---|---|
| Steps 6/11/14/15 | Real native lifecycle/configuration and current lock formats use the Step 1 loader. Recognised released formats remain read-only migration inputs; unknown formats are distinct failures. Empty graph creation includes `.gitkeep`, which the owner must commit for replay. R2/R13. |
| Step 7 | Prove the shared mutation **API**, not an unavailable adapter. Immutable records/edges, exact-input stale-base check (including policy/config/lock) and serialised writes; actor-kind policy with unchanged attribution; reject/defer withdrawal and fresh re-authorisation over the last Contract. R5–R7/R15b and stored-base minor. |
| Steps 8/12 | Repeat the same negative/positive guard matrix through `lifecycle run` and each mutating adapter command when those entry points exist. `/approve-contract` repeats withdrawal/re-authorisation and rejects Contract reuse/missing supersession. R15a. |
| Step 9 | Compose structural checks without pretending diagnostic lineage is executable. Validate kind-only policy separately, historical policy only from reconstructible recorded provenance, and requested typed Git/pg1 replay including preflight refusal. R5–R9/R14. |
| Step 16 | Installed manifest declarations feed the same contribution/node/edge/lineage/revision mechanisms. Repeat S02/AC12–AC13, S03/AC06–AC13 and S04 exact derivation. Prove ownership, collision, decoder/format/implementation-identity failures and inactive-data preservation. R1/R10–R12. |
| Steps 18/19/24 | Explicit doctor severity; complete released-0.0.1 project migration (including enabled Extension and legacy config/lifecycle/lock), transactional failure/rollback; integrated strengthened Stage 1/adapter proof before self-hosting. R2/R13/R15. |
| Specs 03–07, CP02/04–08 | Owner-separated canonical paths and cross-owner routing; Graph Review preflight versus attempted failure and commit-before-next-pinned-run consequences. Reports/configuration/provenance remain non-canonical. R1/R16. |

The original 40 crosswalk quotes, source `26ea12a` and Q01–Q20 wording stay unchanged. S05.run.1 now includes S05/R07. No acceptance database or unsupported YAML progress metadata was added. Existing IDs retain obligations; the first pass's dropped package and lineage assertions are restored, and widened cases are explicit amendments rather than reuse of old execution evidence.

The earlier validator change was the uncovered-requirement **test fixture**, not a new product validator capability: adding an uncovered R07 correctly exercises coverage after R06 gained multiple legitimate criteria. The other five planted-defect tests remain. The new pg1 vector test checks frozen definition examples only, not future runtime acceptance bindings.

## Revision-bound verification history

The original pre-publication Python/schema and Node/Git probes reported in B6 v1 remain in Git at `0363777`; their scratch scripts were not committed and are not a reproducible repository command. They are not used as current proof.

At `1bcd2ea667ac32912b7af96a9978416379fc1b91`, independent review [5298715756](https://github.com/sb-dev/pactwright/pull/41#pullrequestreview-5298715756) executed frozen install, `pnpm contracts:check` with `26ea12a` available, format, lint, typecheck and 8/8 tests successfully. It reproduced build failure (`@pactwright/standard` missing; TS18003 no runtime inputs), hence `pnpm verify` fails at build. It returned semantic changes required despite those passes. This supersedes the obsolete “pnpm unavailable” state of the first authoring attempt, without claiming that structural checks resolved its findings.

### Current correction checks

Current command results and the exact published correction SHA are recorded in the SHA-bound PR response to review 5298715756. The retained checkout/dependencies are used only after verifying the starting tree matches `1bcd2ea`; no temporary workflow is created. Commands are run on the actual corrected tree, with the original v17 source present. Missing/skipped checks and the inherited build failure are not passes.

Environment: Node `v22.16.0`, pnpm `11.7.0`, retained lockfile-resolved dependencies. The check invocation sets `pnpm_config_verify_deps_before_run=false` and uses `pnpm --config.verify-deps-before-run=false <command>` to prevent an automatic reinstall of the restored dependency directory; it does not skip any requested repository command. No package or lockfile is changed by that execution setting.

| Current corrected-tree command | Result |
|---|---|
| `contracts:check` | PASS, including Git-source verbatim checks (`26ea12a` is present). |
| `format:check` | PASS. |
| `lint` | PASS. |
| `typecheck` | PASS. |
| `test` | PASS, 16/16: eight existing contract tests and eight frozen-vector definition checks. No skipped tests. |
| `build` | FAIL (exit 2), inherited missing `@pactwright/standard` and TS18003 runtime inputs. |
| `verify` | FAIL (exit 2) at the same build after all prior stages pass. |

The final SHA-bound PR reply ties these commands to the published tree after confirming the uploaded tree matches the checked local tree. Markdown version headers intentionally retain their two-space hard line breaks.

No runtime loader, future verifier binding, installed-Extension flow, migration or adapter execution is claimed by these document/fixture checks. Each future listed acceptance case still needs its own executed result.

## Outcome and hand-off

R1–R16 and the minor items have an applied disposition in the owning specs/contracts, batch records and later integration owners. B1–B5 record the intentional compatibility consequences, rejected alternatives and source evidence. The owner instruction and starting SHA are linked above; it is authority to make corrections, not a substitute for independent acceptance.

**Fresh independent review is required for these corrections.** No batch is declared formally resolved, Stage 1 is not declared requirement-ready, and the inherited failing build/verify gate is not waived. Review the actual integrated diff against the original questions and all findings, not only this record or a green schema check. No runtime implementation, merge or completion of all T1/T2 is claimed.

**PR #41 B6 v2**
