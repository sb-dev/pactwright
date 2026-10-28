# Checkpoint 1 Task 3.5 — Harness Production Readiness

**Version:** 4

**Date:** 2 October 2026

**T3 accepted baseline:** `9294813b9b62631804ca5a61547bd329c924bf94`

**Planning baseline:** `refactor/pactwright-v2` at `5dccd16373d8988a7294548de6f9de61be48e33a`

**Authority:** [Spec 00 v9](../specs/00-checkpoint-step-contract-and-delivery-tasks.md), §§3–5, and [B28 v2](2026-09-27-cp01-stages-6-11-b28-unconverted-steps.md), current Q67 decision approved on [PR #60](https://github.com/sb-dev/pactwright/pull/60#issuecomment-5938936037).

**Historical implementation baseline:** [T3 plan v4](2026-09-26-cp01-task-3-harness-and-software-run-model.md), §§4–12. Reuse its applicable containment, verifier and evidence boundaries. Its convert-before-run rule is superseded by Spec 00 and B28; it does not govern H3 operational execution.

## 1. Purpose and entry conditions

Task 3.5 productionises the accepted T3 harness before T4 tests false completion and before T5 executes CP01.

T3.5 does not implement CP01 product steps. It closes three harness gaps found while preparing T5:

- **H1 — CP01 production verification:** admit real CP01 verifier bindings and run candidate repository checks.
- **H2 — Claude model and effort:** configure and record model/effort independently for producer and reviewer.
- **H3 — GitHub Actions execution and operational continuation:** run the harness on hosted runners with portable state, GitHub-bound decisions, operational-step support and PR correction rounds.

H1 and H2 may be implemented independently. H3 depends on both. T4 starts only after H1–H3 are accepted.

## 2. Implementation layout and shared verification

Expected change areas:

```text
tools/checkpoint-harness/
  src/software-bootstrap.ts   production binding admission and target policy
  src/verification.ts         candidate verification and verifier adequacy
  src/dispatch.schema.json    role model/effort configuration
  src/claude.ts               provider model/effort dispatch and evidence
  src/evidence.ts             portable ownership and run-state records
  src/runner.ts               yield, restore and operational execution
  src/cli.ts                  workflow-facing start/resume/decision paths

.github/
  workflows/checkpoint-harness.yml
  checkpoint-harness/cp01-t5.yml

tools/checkpoint-harness/test/
  checkpoint-harness-h1.test.ts
  checkpoint-harness-h2.test.ts
  checkpoint-harness-h3.test.ts
  checkpoint-harness-h3-operations.test.ts
  checkpoint-harness-h3-pr.test.ts
  integration/
  live/
```

These names assign responsibilities; they do not require one new wrapper per item. Reuse T3 boundaries where they already own the behaviour.

For each unit, run its focused tests, accumulated harness tests and repository gate before acceptance:

```bash
pnpm --filter @pactwright/checkpoint-harness test
pnpm contracts:check
pnpm verify
```

Run Docker integration where the unit changes containment or candidate execution. Run live-provider checks only where provider behaviour must be observed. Missing Docker, provider access or GitHub-hosted execution is a blocker for the proof that requires it, not a pass.

Use one implementation commit per unit. Suggested subjects:

```text
feature: implement T3.5-H1 production verification
feature: implement T3.5-H2 Claude role effort
feature: implement T3.5-H3 GitHub Actions execution
```

Corrections use `fix:`. Fresh review precedes dependent work. Commits alone are not acceptance.

## 3. T3.5 implementation units

Implement H1 and H2, then H3.

### T3.5-H1 — CP01 production verification

**Prerequisites:** accepted T3-F; current CP01 contracts and shared checkpoint requirements; a supported Linux Docker environment for candidate execution. No live provider call is required.

**Deliver:** a production binding admission path for CP01, candidate repository verification from sealed snapshots, and applicability rules that distinguish step-level checks from checkpoint-exit checks.

**Implementation requirements:**

1. Replace the empty production-binding assumption with a registry/loading path that can admit verifier bindings delivered with a CP01 capability without editing controller source for every binding.
2. Apply the T3-D verifier lifecycle to every new or changed production verifier: isolated execution, adequacy review, pinning, then fresh acceptance execution. A weak or unreviewed verifier cannot count.
3. Run repository build/test/verification commands against the sealed candidate and prepared dependencies. Stale host build output, controller checkout state or reference binaries cannot satisfy candidate checks.
4. Evaluate shared checkpoint targets only when their declared scope applies. Later-only exit obligations remain pending without blocking an otherwise valid early step, and remain mandatory at checkpoint exit.
5. Record binding version/digest, candidate identity, command observations and applicability decision in the normal evidence model.

**Acceptance — `test/checkpoint-harness-h1.test.ts` plus applicable integration tests:**

| ID | Observable result |
| --- | --- |
| H1-01 | A supplied production binding is admitted without a per-binding controller-source edit; an unknown or malformed binding is rejected. |
| H1-02 | A weak verifier is rejected by adequacy review; an accepted changed verifier gets a new identity and fresh execution before its result counts. |
| H1-03 | Candidate verification runs from the sealed candidate and fails when only stale host/reference output could make the check pass. |
| H1-04 | An early step can pass its applicable targets while missing terminal evidence still prevents checkpoint completion. |

Run the real candidate containment path where H1 invokes repository commands.

**Handoff:** an admitted production-verifier mechanism, adequacy evidence and candidate-execution fixtures used by H3 and T4. Product verifiers themselves still arrive with the CP01 capabilities that own them.

### T3.5-H2 — Claude model and effort

**Prerequisites:** accepted T3-C provider adapter and evidence identity; authorised provider account for the live compatibility proof. H1 is not required.

**Deliver:** per-role `model` and `effort` settings in validated run configuration, adapter propagation for both producer and reviewer, and evidence that records requested and provider-reported settings separately.

**Implementation requirements:**

1. Extend role configuration so producer and reviewer each declare a model and effort supported by the pinned adapter. Reject unsupported combinations before production work.
2. Pass the configured model and effort through the existing Claude SDK adapter rather than introducing a second provider path.
3. Include requested model/effort in evaluation identity. Record provider-reported model/usage/settings separately when the API exposes them; absence remains explicit rather than inferred.
4. A model or effort amendment invalidates affected evaluation/review evidence under the existing amendment rules. Unaffected receipts and history remain.
5. Keep provider limits and harness budgets separate from effort. Changing effort does not reset attempts, retries or spend accounting.

**Acceptance — `test/checkpoint-harness-h2.test.ts` and the live Claude adapter test:**

| ID | Observable result |
| --- | --- |
| H2-01 | Producer and reviewer may use distinct admitted model/effort settings; unsupported settings fail admission before dispatch. |
| H2-02 | Captured SDK requests contain each role's configured model and effort. |
| H2-03 | Evidence distinguishes requested settings from provider-reported values and changes evaluation identity when model or effort changes. |
| H2-04 | Amending model/effort re-evaluates affected work without resetting run budgets or replaying completed effects. |

Run the existing live Claude test with the admitted settings to prove the SDK/provider path accepts them. Missing provider access leaves H2 unaccepted.

**Handoff:** validated role settings and execution identity used by H3 workflow configuration and T4 evidence.

### T3.5-H3 — GitHub Actions execution and operational continuation

**Prerequisites:** accepted H1 and H2; a GitHub-hosted Ubuntu runner with Docker; repository permission to run the workflow; provider credential for the live fixture. Use fixture effects for recovery proof rather than a real release.

**Deliver:** `.github/workflows/checkpoint-harness.yml`, the complete `.github/checkpoint-harness/cp01-t5.yml` template, portable run-state persistence, GitHub-aware controller ownership, workflow-dispatch operator actions, operational-step execution and PR correction rounds using the same saved run.

The **controller** is the trusted harness process inside a GitHub Actions job. It decides the next harness action, invokes providers and verifiers, records evidence and owns the run while that job is active. A new job starts a new controller process but resumes the same full harness run from saved state.

**Implementation requirements:**

1. **Portable state.** Persist the journal, evidence, candidate Git history, effective configuration, approvals, counters and receipts as one validated run-state archive. Save after durable phases, before an external effect and before planned yield.
2. **Restore and ownership.** Restore the exact latest saved sequence on a fresh runner. Replace hostname/PID liveness with recorded GitHub workflow run/job/attempt identity plus verified job status. Active or unknown ownership cannot be taken over.
3. **Bounded jobs.** Yield before the hosted-job limit with enough time to save state. Persist attempts, retries and spend counters. Reserve invocation allowance before provider dispatch so runner loss cannot make unresolved usage disappear.
4. **Workflow inputs.** Expose `start`, `continue`, `approve`, `deny`, `amend`, `status` and `address-comments`. The last action requires `run` and `pr`; it retains the saved selection and cannot extend scope. `through` is optional: a new T5 run without it selects `CP01-S01`; a continuation without it keeps the saved selection; an explicit new boundary is validated and recorded.
5. **Containment and credentials.** Keep pinned controller code, provider credentials, repository-write credentials and the Docker control socket outside candidate execution. Candidate code continues through the T3 containment boundary.
6. **GitHub decisions.** Bind approval/denial to the authenticated GitHub actor, exact pending request, candidate and authority. A stale or unauthorised decision is refused. Record a denial without executing its effect or granting acceptance.
7. **External effects.** Persist intent before execution. After interruption, inspect the target and record the receipt if the action completed; retry only when read-back proves it did not. Unsupported reconciliation pauses.
8. **Operational steps.** Execute reviewed prose procedures in their declared repository or fixture, capture command/observation evidence, preserve earlier evidence across landed revisions or repository changes, and re-evaluate affected obligations before continuing.
9. **Amend and status.** An amendment requires an authorised actor, a valid configuration revision and a reason. Record it and re-evaluate affected evidence before continuation. Reject stale or invalid configuration without changing effective state. Preserve receipts and counters. `status` reads the latest recorded state without changing the journal, run-state digest or effect records.
10. **Operator summary.** Each workflow job reports run identity, selected boundary, accepted steps, model/effort, budget state, pause reason, next action, evidence links and saved-state identity. For a PR correction round, include the PR/head, feedback dispositions, fixing commit, checks and reply receipts. A green job or successful artifact upload cannot be reported as checkpoint acceptance.
11. **PR correction rounds.** Restore the latest portable state and acquire the existing controller ownership. Fetch the current PR, submitted reviews, inline threads and conversation comments. Validate the saved PR association, repository, base branch and head before editing. Reconcile newer commits through existing candidate handling without discarding them; pause if reconciliation cannot be established. Recheck the head before publishing and never overwrite intervening work.
12. **Feedback and correction.** Assess each item against pinned requirements and current code. Record it as actionable, already addressed, declined with a reason, or blocked. Feed actionable findings into the existing correction loop, invalidate affected acceptance evidence before progression, and seal, verify and independently review the corrected candidate. Preserve history, unaffected evidence, receipts, attempts and spending. Feedback cannot amend definitions, scope or approval authority.
13. **Shared triggers.** Manual `address-comments` and a submitted-review event from a configured authorised reviewer call the same correction path. Batch the submitted review rather than triggering per inline comment. Manual dispatch also collects conversation comments. Validate the actor and PR scope against trusted effective configuration. Ignore the harness's own replies and reject unauthorised triggers. Duplicate events resume unfinished recorded work or skip completed unchanged feedback; changed content is assessed again.
14. **PR records and publication.** Store the PR association (repository, number, base/head branches and published head SHA), feedback snapshots with IDs/content digests, dispositions and round results in the existing journal and evidence store. Initial harness publication must retain complete portable state. Publish corrections to the same PR branch through existing effect handling. Reply with each disposition and the fixing commit/check evidence where applicable. Read back the remote head and replies before recording completion, then save state. Reconcile interrupted pushes and replies before retrying. Leave thread resolution and acceptance to the reviewer. Importing standalone Claude Code sessions is outside this change.

Do not introduce a separate PR-fixing harness, scheduler or state model. Reuse T3 configuration, correction, review, amendment and effect boundaries. Explicitly dispatch a further GHA review where token-generated changes do not trigger it; do not assume pushes or replies restart the loop.

**Acceptance — automated assertions in `test/checkpoint-harness-h3*.test.ts` plus a hosted fixture:**

Each semicolon-separated case below needs its own asserted result and valid control where rejection is required. Exercise every operator action through the workflow dispatch path in the hosted fixture; retain workflow/job IDs and observations for each case. Summary checks must compare fields with saved state, not just check that labels exist.

| ID | Observable result |
| --- | --- |
| H3-01 | A fresh runner restores the exact valid state; missing, damaged or stale archives are refused without resetting the run. |
| H3-02 | A second controller cannot take over an active or unknown owner; a stopped/released owner can be resumed without competing writes. |
| H3-03 | Planned yield and runner loss preserve attempts, retries, spend and unresolved invocation allowance. |
| H3-04 | Candidate code cannot obtain provider/repository credentials or Docker control while normal contained work still succeeds. |
| H3-05 | `approve` from an authorised actor for the exact request/candidate records approval and permits only that effect; valid `deny` records denial and the effect does not execute or count as accepted; for each action, unauthorised actor, stale request and mismatched candidate are refused without changing decisions or executing the effect. |
| H3-06 | Interruption before/after a fixture external effect does not duplicate a completed action or claim completion without a receipt. |
| H3-07 | `start` without `through` selects S01; `start` with a valid boundary records it; `continue` without `through` retains the saved boundary; `continue` with a valid extension records it; invalid boundaries for either action are refused without starting or changing the run; automatic continuation never extends scope. |
| H3-08 | A pinned operational fixture executes in the declared target; missing command/observation evidence, wrong target and changed or unreviewed prose prevent acceptance; valid execution can land a revision or change repository, resume on a fresh runner and retain valid earlier evidence while rerunning affected checks. |
| H3-09 | `amend` with an authorised actor, valid revision and reason records the change and re-evaluates affected evidence before continuing; unauthorised actor, missing reason, stale revision and invalid configuration are each refused without changing effective state; completed receipts and counters remain intact in both paths. |
| H3-10 | `status` reports the latest recorded state; before/after journal, run-state digest and effect records are identical; corrupt or stale restored state is refused rather than presented as current. |
| H3-11 | Every workflow action reports run identity, selected boundary, accepted steps, requested/provider-reported model and effort (or explicit absence), spending and unresolved reservations, pause reason, next action, resolvable evidence links and saved-state identity/expiry; each field agrees with recorded state; omitting or falsifying any field fails its own assertion. A pre-restore refusal reports unknown fields explicitly and grants no acceptance. |
| H3-12 | The hosted fixture yields and automatically continues within the selected boundary while preserving counters; it stops at the boundary or a human decision; a green job and successful artifact upload with incomplete required evidence still leave the step/checkpoint unaccepted. |
| H3-13 | Initial publication and two PR correction rounds reuse one run across separate hosted jobs. History, receipts, attempts and spending persist. Affected evidence is renewed; unaffected evidence remains valid. A fixing commit or reply alone cannot restore acceptance. |
| H3-14 | Manual dispatch and authorised submitted-review events use the same correction path. Manual handling includes conversation comments. Duplicate events resume incomplete work or skip completed work without repeated commits/replies; edited feedback is reassessed. Unauthorised triggers, wrong PR association and unsupported scope changes are rejected. Own replies do not trigger correction. Valid feedback is corrected; already addressed or unsupported feedback receives a recorded disposition and reason where required. |
| H3-15 | Runner loss after a correction push or reply is recovered through target read-back without duplicating completed effects or claiming an unresolved effect completed. A changed PR head is reconciled without losing newer commits or causes a pause; missing saved state cannot start a new correction run. Concurrent triggers cannot acquire competing ownership; budget exhaustion pauses without resetting limits. |

The hosted proof must span at least two GitHub-hosted jobs and include interruption after an external intent. The PR fixture must retain initial publication and two correction rounds in separate hosted jobs, with feedback snapshots, fixing commits and reply receipts. A local process restart does not establish H3 acceptance.

**Handoff:** the exact harness revision, workflow run IDs, state artifacts, fixture-effect receipts, PR correction-round records and acceptance records used by T4. T5 does not begin from H3 acceptance alone.

## 4. T3.5 exit

Task 3.5 is complete when:

- H1, H2 and H3 have accepted evidence at the same harness revision;
- the shared repository gate passes;
- required Docker, live-provider and hosted-runner proofs are executed rather than skipped;
- the final operator procedure in [the harness README][harness] matches the implemented workflow;
- no T5 product capability is counted as T3.5 completion.

T4 then evaluates false completion against this exact harness revision. A T4 defect in behaviour claimed by H1–H3 returns to the owning T3.5 unit for correction, after which the affected T4 proof is repeated.

[harness]: ../../tools/checkpoint-harness/README.md
[bindings-source]: https://github.com/sb-dev/pactwright/blob/5dccd16373d8988a7294548de6f9de61be48e33a/tools/checkpoint-harness/src/software-bootstrap.ts
[evidence-source]: https://github.com/sb-dev/pactwright/blob/5dccd16373d8988a7294548de6f9de61be48e33a/tools/checkpoint-harness/src/evidence.ts

## 5. Revision record

Version 1 expressed H1–H3 as a separate pseudo-checkpoint contract bundle.

Version 2 follows the T3 implementation-unit format: prerequisites, deliverables, implementation requirements, executable acceptance and handoff for each H unit. It removes the CP00 contract bundle and makes the T3.5 → T4 handoff explicit.

Version 3 records the superseding Q67 authority, treats T3 as a historical baseline, and adds explicit workflow-action, failure-case and summary acceptance coverage.

Version 4 adds PR correction rounds to H3 using existing portable state, correction and effect handling. It adds shared manual/automatic triggers and H3-13–H3-15 proof without claiming implementation or acceptance.

**Checkpoint 1 Task 3.5 — Harness Production Readiness, Version 4**
