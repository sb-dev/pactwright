# Checkpoint 1 — T5 Harness Prerequisites

**Version:** 1

**Date:** 30 September 2026

**Source inspected:** `refactor/pactwright-v2` at `5dccd16373d8988a7294548de6f9de61be48e33a`

**Authority:** [Spec 00](../specs/00-checkpoint-step-contract-and-delivery-tasks.md), §§3–5.

These three changes are implemented outside T5. H1 and H2 retain their separate responsibilities. H3 adds GitHub Actions operation and cross-job recovery.

## 1. Contract context

The three prerequisite files use `CP00-S01` to `CP00-S03` in a separate format-2 bundle. These are H1–H3, not additional CP01 product steps. Verifier IDs below name checks to implement.

**Recommended file:** `docs/research-logs/cp01-t5-prerequisites/checkpoint.yml`

```yaml
format: 2
checkpoint: CP00
run_model: software-bootstrap
sources:
  SPEC00: ../../specs/00-checkpoint-step-contract-and-delivery-tasks.md
  T3: ../2026-09-26-cp01-task-3-harness-and-software-run-model.md
  CP01: ../../checkpoints/01-self-hosted-delivery.md
  T5: ../2026-09-29-cp01-task-5-implementation-and-acceptance.md
```

## 2. H1 — CP01 production verification

The production binding registry is empty in the inspected source. H1 provides binding admission and a candidate environment that can run real CP01 checks on a hosted runner. Product verifiers still arrive with their capabilities during T5. [Binding registry][bindings-source].

**Recommended file:** `docs/research-logs/cp01-t5-prerequisites/CP00-S01.yml`

```yaml
id: CP00-S01
requires: []
outputs:
  cp01-production-verification: CP01 verifier admission and candidate execution on a hosted Ubuntu runner.
requirements:
  R01:
    source: [T3#6, SPEC00#3]
    statement: >-
      The harness shall admit CP01 bindings supplied with a capability without a controller-source
      edit for each binding.
  R02:
    source: [T3#6, SPEC00#3]
    statement: >-
      A new or changed verifier shall complete adequacy review before its results count towards
      acceptance.
  R03:
    source: [T3#8, T5#1]
    statement: >-
      The hosted runner shall execute required build, test and verification commands from isolated
      candidate snapshots with prepared dependencies.
  R04:
    source: [SPEC00#4, CP01#exit-gate]
    statement: >-
      The harness shall apply shared criteria at their declared scope and evaluate terminal
      criteria at checkpoint completion.
acceptance:
  AC01:
    covers: [R01, R02]
    cases: [adequate-verifier, weak-verifier, changed-verifier]
    given: A capability with a supplied verifier binding.
    when: The harness admits the binding and evaluates the candidate.
    then: >-
      No controller-source edit is needed; only an adequately reviewed version can satisfy
      acceptance, and a changed version requires new review.
    verify: {automated: [harness.cp01-binding-admission]}
  AC02:
    covers: [R03]
    given: A clean candidate and its prepared dependencies on a GitHub-hosted runner.
    when: The harness executes the repository verification command.
    then: >-
      Verification uses the candidate snapshot and cannot obtain a pass from stale host build
      output.
    verify: {automated: [harness.cp01-candidate-environment]}
  AC03:
    covers: [R04]
    cases: [early-step, checkpoint-exit]
    given: An early valid step and a checkpoint with missing terminal evidence.
    when: Acceptance is evaluated at the applicable point.
    then: >-
      The early step can pass its applicable checks; the checkpoint cannot close while terminal
      evidence is missing.
    verify: {automated: [harness.checkpoint-target-applicability]}
```

## 3. H2 — Claude model and effort

Add independent model and effort settings for the producer and reviewer. Validate them against the pinned adapter and record what was requested and what the provider reports.

**Recommended file:** `docs/research-logs/cp01-t5-prerequisites/CP00-S02.yml`

```yaml
id: CP00-S02
requires: []
outputs:
  claude-role-settings: Validated model and effort settings for each role, recorded in execution evidence.
requirements:
  R01:
    source: [T3#4, T3#10]
    statement: >-
      Each role shall declare a model and effort combination supported by the pinned adapter and
      available to the configured credential.
  R02:
    source: [T3#10]
    statement: >-
      The Claude adapter shall pass the configured model and effort for each role through its
      supported SDK options.
  R03:
    source: [T3#5, T3#9]
    statement: >-
      Evaluation identity shall include model and effort; invocation evidence shall distinguish
      requested settings from provider-reported settings.
acceptance:
  AC01:
    covers: [R01, R02]
    cases: [producer, reviewer, unsupported-setting]
    given: Roles configured with supported settings and a separate unsupported combination.
    when: The harness validates and dispatches them.
    then: >-
      Supported requests contain the configured settings; the unsupported combination is rejected
      before production work.
    verify: {automated: [harness.claude-role-settings]}
  AC02:
    covers: [R03]
    cases: [recorded-invocation, changed-effort]
    given: A recorded invocation and a later change to effort.
    when: Evidence and evaluation identities are compared.
    then: >-
      Requested and reported settings remain distinguishable, and the effort change produces a
      different evaluation identity.
    verify: {automated: [harness.claude-effort-evidence]}
```

## 4. H3 — GHA execution and operational continuation

The current recovery model uses local ownership, and the operator procedure assumes a persistent run directory. H3 makes that state portable and exposes the operator actions through GitHub. It also supports the later CLI procedures, repository transitions and external actions. [Recovery source][evidence-source]; [operator procedure][harness].

**Recommended file:** `docs/research-logs/cp01-t5-prerequisites/CP00-S03.yml`

```yaml
id: CP00-S03
requires: [CP00-S01, CP00-S02]
outputs:
  gha-workflow: A manually dispatched Checkpoint harness workflow and complete T5 configuration template.
  portable-run-state: Validated Actions artifacts from which a new runner resumes the same T5 run.
  operational-execution: Target-aware CLI execution, GitHub-authorised decisions and external receipts.
requirements:
  R01:
    source: [T3#9, T5#1]
    statement: >-
      The harness shall publish consistent state archives at the save points in T5 section 1 and
      restore the exact trusted run sequence with file metadata and evidence intact.
  R02:
    source: [T3#7, T5#1]
    statement: >-
      Jobs shall yield before timeout and retain attempts, retries and spending across restarts;
      invocation allowance shall be saved before dispatch and unresolved usage shall remain
      reserved.
  R03:
    source: [T3#9, T5#1]
    statement: >-
      A run shall have one active controller, with takeover based on GitHub job status and
      saved sequence rather than hostname, process ID or elapsed time.
  R04:
    source: [T3#8, T5#1]
    statement: >-
      Pinned controller code shall remain separate from candidate code; candidate commands shall
      not receive provider credentials, repository-write credentials or the Docker control socket.
  R05:
    source: [T3#9, T5#7]
    statement: >-
      Approval shall bind an authorised GitHub actor to the exact request and candidate; external
      actions shall follow an uploaded intent and require read-back receipts, including after
      interruption.
  R06:
    source: [SPEC00#4, CP01#stage-10-prove-the-published-release-on-kakeibo]
    statement: >-
      Operational steps shall execute in their declared repository or fixture, preserve acceptance
      links across landed revisions and target changes, and re-evaluate affected obligations
      before continuing.
  R07:
    source: [T5#3, T5#5, T5#6, T5#7, T5#8]
    statement: >-
      The workflow shall provide the documented start, continue, approve, deny, amend and status
      actions, accept an optional through input at dispatch time, compose the effective harness
      selection from that input and saved run state, automatically continue saved work within
      the selected scope, and publish the documented summary.
acceptance:
  AC01:
    covers: [R01]
    cases: [fresh-runner, damaged-archive, missing-archive, stale-sequence]
    given: Saved run state and a fresh runner with different filesystem paths.
    when: The workflow restores the state or encounters the listed defect.
    then: >-
      Valid state preserves the journal, evidence, Git history, configuration and file metadata;
      defective or stale state is rejected without resetting the T5 run.
    verify: {automated: [harness.gha-state-restore]}
  AC02:
    covers: [R02]
    cases: [planned-yield, runner-loss-during-invocation]
    given: A T5 run with recorded limits and an invocation reservation.
    when: A job yields or its runner is lost, then execution resumes elsewhere.
    then: >-
      Counters and unresolved usage remain accounted for; continuation stays within the existing
      scope and limits.
    verify: {automated: [harness.gha-bounded-resume]}
  AC03:
    covers: [R03]
    cases: [active-owner, stopped-owner, unknown-owner]
    given: Two dispatches for the same T5 run.
    when: The second attempts to resume.
    then: >-
      Only a stopped or released owner permits takeover; active or unknown ownership cannot create
      a competing writer.
    verify: {automated: [harness.gha-single-writer]}
  AC04:
    covers: [R04]
    given: Candidate code that attempts to access controller resources and credentials.
    when: It runs in the hosted candidate environment.
    then: The attempts fail while the controller can still invoke Claude and run verifiers.
    verify: {automated: [harness.gha-containment]}
  AC05:
    covers: [R05]
    cases: [authorised-decision, unauthorised-decision, stale-request, completed-effect, interrupted-effect]
    given: >-
      A pending approval and a readable external fixture target that survives runner replacement.
    when: A decision arrives or an approved action is interrupted.
    then: >-
      Only the matching authorised decision is recorded; uploaded intent precedes execution, and
      read-back prevents repeating a completed action or accepting an unresolved one.
    verify: {automated: [harness.gha-approval-recovery]}
  AC06:
    covers: [R06]
    cases: [landed-revision, other-repository]
    given: An accepted candidate followed by a merge or a step in another repository.
    when: The T5 run continues on a new runner.
    then: >-
      Commands use the declared target and revision; earlier evidence stays linked, affected
      checks rerun, and completed external actions are not replayed.
    verify: {automated: [harness.gha-operational-handoff]}
  AC07:
    covers: [R07]
    cases: [new-default-selection, explicit-selection, continue-current-selection]
    given: The workflow, supplied T5 configuration template and optional through input.
    when: A fixture T5 run starts or continues on a fresh runner.
    then: >-
      A new T5 run without through starts at CP01-S01; a supplied through value becomes the
      selected boundary; a continuation without through keeps the saved selection; the workflow
      completes the fixture without local commands and reports the resulting scope and next action.
    verify: {automated: [harness.gha-operator-flow], review: [harness.gha-run-guide]}
```

The first H3 proof is a small fixture across two hosted runners, including interruption after an external intent. Test that hand-off before using the workflow for product implementation.

## 5. Handoff to T4 and T5

Record each contract's implementation revision and acceptance evidence. H1 and H2 can proceed separately; H3 integrates their outputs. The [T4 proof](2026-09-29-cp01-task-4-false-completion-proof.md) reviews the resulting execution and recovery paths. The [T5 guide](2026-09-29-cp01-task-5-implementation-and-acceptance.md) uses the resulting workflow.

[harness]: ../../tools/checkpoint-harness/README.md
[bindings-source]: https://github.com/sb-dev/pactwright/blob/5dccd16373d8988a7294548de6f9de61be48e33a/tools/checkpoint-harness/src/software-bootstrap.ts
[evidence-source]: https://github.com/sb-dev/pactwright/blob/5dccd16373d8988a7294548de6f9de61be48e33a/tools/checkpoint-harness/src/evidence.ts

**Checkpoint 1 — T5 Harness Prerequisites, Version 1**
