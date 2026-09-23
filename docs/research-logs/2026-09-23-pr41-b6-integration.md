# PR #41 B6 — Integration and final validation

**Scope:** PR #41, `claude/checkpoint-contract-files-o06rm4`, starting `73dad7b2aa5cc00bdccf9e6e51908d7a0480913a`; Checkpoint 1 Stage 1 only. Source revisions: Core v1, Checkpoint 1 v18, Spec 00 v3, methodology v1, contract format 2. The crosswalk retains its v17 source `26ea12a` and original Q01–Q20 wording.

**Adoption:** the user's explicit instruction to resolve the questions and apply fixes authorises this design pass. Core v2 and Checkpoint 1 v19 are a material amendment, not an equivalent conversion or reuse of an earlier execution pass. Existing requirement/criterion IDs retain their obligation; refinements require reassessment at the new definition revision. No runtime, T3 harness or future verifiers are implemented here.

**Acceptance status:** decisions applied; mandatory checks and independent semantic acceptance pending. This writer's review is not independent acceptance. See B6 for the exact available/blocked validation results and final hand-off.

**Dependencies:** B1–B5, applied in that order. **Q20 classification:** missing later integration obligations, not permission to defer the early mechanisms. **Owners:** Core §§54/55/57 and Checkpoint 1 v19 Steps 6–9/11/14–16/18–19/24.

## Applied integration fixes

| Owner | Required actual proof |
|---|---|
| Steps 6/11/14/15 | Real lifecycle, pack selection, init and lock formats pass through Step 1's canonical loader. Missing/malformed/unsupported inputs cannot use fallback parsing, silent activation or replace valid state. A plain scaffold is not an activated environment. |
| Step 7 | CLI/API/adapter mutations use stored-versus-proposed record and core-edge checks, full proposed-state validation, actor-policy checks and stale-base protection before atomic writes. Valid additions/supersession and each failing removal/rewrite/partial-load case have separate results and no forbidden effects. |
| Steps 8/9 | Diagnostic lineage is not execution permission. Exercise current actor-policy denial, all 17 validation categories, competing lineage, and requested typed Git/pg1 replay failures without requiring Git for ordinary graph diagnostics. |
| Step 16 | Installed fixture packages feed the same record/node/edge mechanisms. Repeat S03/AC06–AC13 and S04 derivation, not just core-redefinition failure. Include non-node canonical records, node/edge hash sensitivity, generated exclusions, inactive-data preservation and validated reactivation. |
| Steps 18/19/24 | Diagnose incomplete/inactive state without repair; check released core-format and explicit migration/rollback compatibility; rerun strengthened Stage 1 cases through the assembled runtime before self-hosting. |

The crosswalk's 40 original obligation texts, source revision and 20 question wordings remain unchanged. Mappings/notes now cite the strengthened acceptance and later owners. F01 canonical-record inclusion and F02 actual hashing are both retained. No unsupported progress/status keys were added to contract YAML.

A necessary validator-test correction replaces the brittle removal of one `covers: [R06]` occurrence with an explicitly added uncovered R07. R06 now has multiple legitimate acceptance links; deleting only one would no longer plant the intended defect. The other five planted-defect scenarios are retained. This is a contract-validation fix, not T3 harness or product implementation.

## Executed checks and limits

Checks ran against the local candidate file contents, before publication on the PR branch. Original Core, checkpoint, crosswalk, shared settings and test-file bytes were checked against their Git blob SHA before editing.

| Command/check | Result |
|---|---|
| Local `python check_documents.py` using PyYAML 6.0.3 and jsonschema 4.26.0 | PASS for the available structural subset: five step contracts plus unchanged shared settings; 40 step requirements / 60 criteria; schema rules, ordering, IDs, dependencies, local Core/checkpoint anchors, declared source aliases and mapping targets. |
| Same local check, six separate planted defects | All rejected: bad source section, uncovered requirement, later prerequisite, invalid case name, unknown crosswalk ID and changed historical quote. This is not the TypeScript test runner. |
| Historical preservation comparison | All 40 quoted units and Q01–Q20 IDs/wording match the starting crosswalk. A fresh Git-history unit extraction was not executed. |
| Local `node evidence/probe-pg1.mjs` and `python evidence/probe-git.py` | PASS: five fixed byte/digest vectors checked independently for the chosen fixture values; Git clean/dirty/ignored-input/read-only controls passed. Definition probes only. |
| `pnpm contracts:check` | BLOCKED before execution, exit 127: `pnpm: command not found`. |
| `pnpm verify` | BLOCKED before execution, exit 127: `pnpm: command not found`. |
| Official TypeScript tests, full external-source anchor checks, package/build checks | Not executed. Repository cloning failed on DNS; local Node dependencies are unavailable. |
| Independent integrated semantic review | Pending. No independently executed reviewer result is available for these authored changes. |

The schema rules were transcribed from repository schema blob `fe02fcca7a2fb4ec85aa488a0b5f2c406fa024b9` for the local Python check; it is not a claim to have run the repository's Ajv harness. The PR author's earlier report that the inherited build lacks runtime/package inputs remains author-reported, not a fresh pass or a newly reproduced failure. No unrelated code or build gate was weakened to hide it.

## Outcome and hand-off

All 20 questions have adopted answers and applied fixes across six batches. **No batch is claimed formally resolved and Stage 1 is not declared requirement-ready**, because mandatory verification and independent acceptance remain pending under methodology §6. Future binding IDs and these documentation checks do not establish product acceptance.

On the published commit, run `pnpm contracts:check` with `26ea12a` available, `pnpm test` and `pnpm verify`; report each actual result and preserve any inherited build failure as a failure. Then an independent reviewer must compare all six records and the actual diff with Q01–Q20, check the compatibility/normalisation/Extension/authority choices and criterion coverage, and accept or return specific corrections. Review any correction afresh. The SHA-bound PR comment identifies the exact published revision.

**PR #41 B6 v1**
