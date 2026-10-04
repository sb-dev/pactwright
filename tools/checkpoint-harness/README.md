# Checkpoint harness — operator procedure

The harness runs checkpoint work through produce → verify → review → correct → accept.

GitHub Actions operation below is the interface specified by the [T3.5 production readiness](../../docs/research-logs/2026-09-30-cp01-task-3-5-harness-production-readiness.md). H1 adds production verification, described under [Production verification](#production-verification). H2 adds each role's model and effort, described under [Role model and effort](#role-model-and-effort). H3 adds the hosted workflow, portable run state, GitHub-bound ownership and decisions, operational steps and pull-request correction rounds, described from [Workflow controls](#workflow-controls) to [Pull-request correction rounds](#pull-request-correction-rounds).

For the S01 pilot and stage selections, use the [T5 run guide](../../docs/research-logs/2026-09-29-cp01-task-5-implementation-and-acceptance.md). The [T3 log](../../docs/research-logs/2026-09-26-cp01-task-3-harness-and-software-run-model.md) records the original design.

## Execution model

A **run** is the full harness execution. Its identifier is separate from the GitHub workflow run ID.

The **controller** is the trusted harness process inside a job. It reads saved state, chooses the next action, invokes Claude, runs checks and records acceptance. GitHub supplies the runner; it does not decide acceptance.

Candidate commands run in disposable Docker workspaces. Verification and review use fresh workspaces for the sealed candidate. Provider credentials stay with the controller. Repository writes and publication use narrowly authorised effect jobs.

The durable run state contains the journal, evidence, candidate Git history, effective configuration, approvals, counters and receipts. A fresh job restores this state and continues the same run.

## Workflow controls

**Workflow file:** `.github/workflows/checkpoint-harness.yml`

**T5 configuration file:** `.github/checkpoint-harness/cp01-t5.yml`

**Hosted fixture configuration:** `.github/checkpoint-harness/h3-fixture.yml` (checkpoint CP95, for the H3 hosted proof only)

H3 supplies the workflow named **Checkpoint harness** and the complete configuration template. Operate it through **Actions → Checkpoint harness → Run workflow**, on the branch that holds the harness revision. Continuations and forwarded reviews are dispatched on the ref the run was started from.

| Input | Use |
| --- | --- |
| `action` | `start`, `continue`, `approve`, `deny`, `amend`, `status` or `address-comments`. |
| `run` | Stable name of the full harness execution, such as `cp01-t5`: lower-case letters, digits and `-`, at most 40 characters. |
| `through` | Optional boundary for `start` or `continue`. A new run defaults to the checkpoint's first step; an existing run keeps its saved boundary when omitted. |
| `request` | Exact pending request from the summary, for `approve` or `deny`. |
| `candidate` | The candidate commit that request names, for `approve` or `deny`. |
| `config` | The template file in `.github/checkpoint-harness`, for `start`. |
| `config_revision` | Full commit SHA containing the revised template, for `amend`. |
| `reason` | Explanation recorded with an amendment. |
| `pr` | The run's pull request number, for `address-comments`. |
| `review` | One submitted review to address, for `address-comments`; empty collects all authorised feedback. |
| `fault` | Hosted fixture only: `crash-after-intent` or `crash-after-effect[:ACTION]`. A template without `job.faults: true` refuses it. |

The committed template omits `selection.through`, `repository.expected_head` and `workspace`. At `start`, the workflow reads the template at the dispatched commit, resolves the branch head and the boundary, and records the result as the run's configuration. Later jobs use the saved configuration only. A blank continuation never resets the boundary.

### Jobs and credentials

| Job | Holds | Does |
| --- | --- | --- |
| `route` | Read-only token. No provider credential. | Validates the dispatch, restores the latest state, records approvals, amendments and feedback, and runs work that needs neither an agent nor an external effect. |
| `controller` | The `claude-live` environment's provider secret. Read-only token. | Agent sessions and contained candidate work. The environment's reviewer approves each job. |
| `effects` | Contents and pull-request write. No provider credential. | Publication, replies and fixture effects, each read back. It runs no candidate code. |
| `continue` | Actions write. No checkout. | Dispatches the next `continue` after a planned yield or a hand-off, unless another run of the workflow is waiting. |
| `forward` | Actions write. No checkout. | Dispatches `address-comments` for a review submitted on a `harness/RUN` pull request of this repository. |
| `check` | Read-only token. | Validates the configuration templates of a pull request that changes them. |

Every job after `route` checks out the controller commit the run was started with; a job of another harness revision refuses the run. Candidate code runs only in T3 containment and never sees a token, a provider credential or the Docker socket.

### Start and continue

Use `start` for a new run. The workflow validates the configuration and pins the controller, definitions and candidate revisions.

Use `continue` with the same run identifier to resume. Supply `through` to extend the selected boundary, or omit it to retain the current selection. The workflow records a changed selection and restores the exact saved artifact; no local run-directory path is needed.

A job can stop at selection acceptance, an operator pause or a planned yield before timeout. A yield saves state and schedules continuation within the same selection. It does not extend the scope or reset a budget.

### Approve or amend

For `approve` or `deny`, copy the pending request and candidate from the summary. The workflow records the GitHub actor who triggered the dispatch against that request. An actor outside the binding's authority in `permissions.approvers`, a decided or superseded request and another candidate are refused, and nothing is recorded. An approval is not permission for a different candidate or effect. A denial is recorded; its effect never runs and the step is not accepted.

For `amend`, commit the template change, supply its `config_revision` and a reason, then continue the run. The actor must be in `permissions.approvers.amend`; a hosted run whose configuration names no such list is never amended. The revision must descend from the run's recorded configuration revision. The repository, checkpoint, approvers, publication and operations cannot be amended within a run. Later jobs use the saved effective configuration, not an unrecorded edit on a branch. Role, effort, skill, verifier, policy or definition changes re-evaluate affected evidence. Existing receipts and counters are retained.

### Read the result

The job summary shows the run name and identifier, selected boundary, accepted steps, requested and reported model and effort, reported spending and unresolved reservations, pause reason and next action. It links the job and the saved state, lists evidence records by path in that state, and shows the saved-state identity and expiry and any pull request. Each job compares every field with the state it saved and fails on a mismatch. A job refused before restoring state reports every run field as `unknown`.

`status` restores the latest state and reports it. It saves nothing and takes no ownership.

`selection-accepted` means the requested selection is accepted. A green job or successful artifact upload does not mean the checkpoint is complete. Final completion also requires its exit evaluation.

Every `run` and `resume` result carries `checkpoint`: `complete`, the checkpoint's `unaccepted` steps and the inherited targets still `pending`, each with the rule that defers it. Only `complete: true` reports checkpoint completion.

## Save and recover

H3 stores the run state as immutable Actions artifacts named `harness-RUN-NNNNNN`, with increasing sequence numbers. Each holds `state.tar.gz` (the run directory) and `state.json` (name, sequence, journal head, pinned controller commit and archive digest). A job saves after each durable phase, before an agent session or external effect, and before a planned yield. Artifacts follow the repository's retention; the latest state must not expire during a run.

A run is operated from the branch it was started on. Only artifacts of `workflow_dispatch` runs of this workflow in this repository, on that branch, count; a dispatch on another branch is refused. The route job checks that the dispatched commit's history carries the run's pinned controller commit before it runs that code. Protect the branch: whoever can push to it controls the harness code.

A save that finds the same or a later sequence fails, so two controllers cannot both write the run. If two writers race past that check, the first save of the sequence stands and the later writer stops.

The workflow allows one run per run name at a time, with `cancel-in-progress: false`. GitHub keeps one pending run per group: a newer dispatch for the same run replaces an older pending one, so wait for a dispatch to start before sending the next. A continuation is not dispatched while another dispatch of the run waits. Each owner record names its GitHub repository, workflow run, attempt and job. A new job takes over only an owner that released the run or whose job has completed; an active or unknown owner is refused.

An agent session reserves its spend allowance before it starts. A session lost with its runner stays reserved and counted. `budgets.run_spend_usd`, when set, pauses the run before a session it cannot cover.

| Condition | Action |
| --- | --- |
| Planned yield | Automatic continuation restores the saved selection. Use `continue` if scheduling failed. |
| Runner lost | `continue` restores the last valid state, preserves counters and reconciles any pending effect. |
| Pending approval | Review the exact request, choose `approve` or `deny`, then continue when authorised. |
| Budget exhausted | Amend only the required limit and record the reason. Existing usage remains counted. |
| Missing, corrupt or stale archive | Stop and investigate the named state. Do not silently start a fresh run or restore an older sequence. |
| Uncertain external result | Read the target back. Retain a matching receipt; retry only when the target proves the action did not complete. |
| Harness defect | Return the missing capability or design defect to T3.5, verify the corrected harness revision through T4, then resume T5. |

## Operational steps

A step kept in reviewed prose runs as an operational step. Its reviewed section text is its one requirement, `PROCEDURE`. The producer carries the procedure out with `run_command`. The controller records each command, its exit status and its output. The step is accepted only when a command ran, its output is in the journal, the run used the declared target and a fresh review finds the expected result. Prose whose hash differs from `prose_steps`, or a step with neither a contract nor a hash, fails planning and never runs.

By default a procedure runs on the candidate and can land a revision; later steps build on it and rerun earlier automated checks. A configuration can declare another repository instead:

```yaml
operations:
  targets:
    TARGET_NAME:
      repository: OWNER/REPOSITORY
      revision: FULL_COMMIT_SHA
      writable: [PATH, ...]
  steps:
    STEP_ID: TARGET_NAME
```

The target is imported at `start`. Its steps build on each other, never on the candidate; the candidate's checks do not run there, and its evidence stays current. A target outside this repository needs a local copy the controller can read; the hosted workflow provides none, so such a run is refused at start. A procedure that needs the network, a registry or another repository's merge cannot run in containment: its producer reports `blocked` and the run pauses for the owner (CP01 S28–S30).

## Pull-request correction rounds

When the selection is accepted, the `effects` job pushes the integrated candidate to `harness/RUN` as one deterministic commit whose parent is the run's recorded source head, and opens a pull request against `publication.pull_request.base`, else the run's branch. Each later accepted candidate becomes one commit on top of the published head. The branch is never force-pushed; a branch that moved elsewhere refuses the push.

Run `address-comments` with `run` and `pr` to address feedback. A review submitted on the pull request by a member of `permissions.approvers.feedback` is forwarded to the same action with `review`. A person who dispatches a round must hold that authority too; a dismissed review starts nothing. A review submitted while a round is open is recorded and starts the next round when that one completes. Both paths:

1. restore the run and check the pull request number, repository, base branch and `harness/RUN` head branch;
2. collect the review (body and inline comments), or for a manual round every authorised review, inline comment and conversation comment; the harness's own replies and app accounts are ignored;
3. resume an unfinished round, skip feedback already disposed of, and assess edited feedback again;
4. adopt newer commits on the head that build on the published commit and stay within the write policy; a diverged head pauses the round;
5. assess each item with a fresh reviewer: `actionable`, `already-addressed`, `declined` or `blocked`, with a reason; feedback that would change definitions, verifiers, the workflow or the configuration is declined;
6. correct actionable feedback through the final step's next attempt: produce, seal, verify, review and decide again, within the same budgets;
7. push the fixing commit on the current head, reply to each item with its disposition, the fixing commit and its checks, and read both back before recording the round. A receipt is what reading the target back finds: the branch head, the open pull request, a reply carrying the effect's marker written by the workflow's own account, or a fixture artifact from this run's branch.

A fixing commit or a reply alone never restores acceptance. The reviewer resolves threads and decides acceptance.

## Production verification

H1 lets CP01 capabilities deliver their own verifiers and checks each sealed candidate with the repository's real commands. The run configuration declares it under `verification`:

```yaml
verification:
  bindings: DECLARATIONS_DIRECTORY
  dependencies:
    inputs: [MANIFEST_OR_LOCKFILE_PATH, ...]
    command: [PACKAGE_MANAGER, ARGUMENT, ...]
    outputs: [DEPENDENCY_DIRECTORY, ...]
    network: none
    timeout_ms: POSITIVE_INTEGER
```

Upper-case values are operator inputs. Amending this section re-evaluates affected evidence.

### Binding declarations

A capability delivers each verifier binding as one `<bindings>/<binding-id>.yml` file in the candidate, validated by [binding.schema.json](src/binding.schema.json). It is the binding's definition as the controller registry would hold it, so no controller edit is needed per binding.

- **Automated:** `id`, `method`, `version`, `command`, `judge`, `files`, `timeoutMs`, `observations`, and optionally `scratch` (writable build-output paths) and `dependencies: true`.
- **Review:** `id`, `method`, `version` and `rubric`.
- **Approval:** not declarable. Authorities and effects stay controller-owned.

The loader refuses a declaration that is not YAML, repeats a key, fails the schema, is named for another ID, redefines a controller binding, names no planned target or is used as another method. A refused or missing declaration in the producer's writable paths is a correction; elsewhere it pauses for its owner.

A declared binding counts only after admission. Automated bindings run provisionally, are reviewed for adequacy, are pinned and then run fresh for acceptance. Declared review rubrics are reviewed against the review-binding adequacy rubric before they govern a review. Any change to a declaration or verifier file is a new identity and repeats admission.

### Repository commands

Each subject workspace is a fresh export of the sealed candidate. A binding's `scratch` paths start empty and are writable; nothing else is. A candidate holding files under a scratch path fails that binding's targets, so committed build output cannot pass. The same holds for a scratch, dependency-output or mount path that a candidate link on it or an ancestor would resolve into other source. Host working trees, the controller checkout and host-installed packages are never mounted.

For a binding with `dependencies: true`, the harness prepares dependencies once per key: the snapshot of the candidate's `inputs` paths, the command and the profile. The command runs as the candidate user in a contained workspace holding only those paths, with only `outputs` writable and the configured network. Use flags that skip lifecycle scripts, such as `--ignore-scripts`. The outputs are mounted read-only into subject workspaces. A failed preparation fails the targets; a preparation that could not run leaves them unavailable. Each preparation is journaled as `dependency-preparation`, and each invocation records the key it used.

### Applicability and the exit evaluation

The run model's rules state when each inherited criterion applies. For CP01, `AC02` applies from the first acceptance of `CP01-S25`, `AC05` only at the checkpoint exit, and every other criterion to every step. Each evaluation records the inherited targets it leaves pending. Pending targets do not block an earlier step and are never waived.

When the selection covers every step and the integrated acceptance left targets pending, the harness runs the exit evaluation `<checkpoint>/exit`. It evaluates the integrated candidate against every inherited target, without a producer of its own.

The exit evaluation is given the controller's checkpoint evidence: each step's current acceptance record, the revision it names, its proven targets and outputs, the evidence it counted and its effects' receipts. The exit manifest names that record by digest. Each exit judge receives it on stdin as `checkpoint`, and the exit reviewer is shown it with every accepted output. Neither reads the journal or a candidate-authored summary. A decision refuses evidence that is missing, uncommitted, stale, incomplete or was not given to its judges and reviewer.

The exit's correctable findings, including a missing or rejected exit binding, go to the selection's final step. Its next attempt, within its attempt budget, starts from the integrated candidate with those findings. Its acceptance moves the integrated candidate, and the exit is evaluated again. Earlier records stay as history. Authority and resource problems pause the run unaccepted and leave the checkpoint incomplete.

## Role model and effort

H2 sets the Claude model and reasoning effort of each role in the run configuration:

```yaml
roles:
  producer:
    adapter: claude-sdk
    model: MODEL_ID
    effort: EFFORT_LEVEL
    skills: [SKILL, ...]
    max_turns: POSITIVE_INTEGER
  reviewer:
    adapter: claude-sdk
    model: MODEL_ID
    effort: EFFORT_LEVEL
    skills: [SKILL, ...]
    max_turns: POSITIVE_INTEGER
```

| Model | Effort levels |
| --- | --- |
| `claude-fable-5-1`, `claude-opus-5-5`, `claude-sonnet-5` | `low`, `medium`, `high`, `xhigh`, `max` |
| `claude-haiku-4-5-20251001` | None. Haiku 4.5 rejects the effort parameter, so no role can use it. |

- **Admission.** `run`, `resume` and `amend` refuse a missing effort, an unknown level or a level the model does not accept, before any session starts. The CLI would otherwise lower such a level silently. The table is `EFFORT_LEVELS` in [claude.ts](src/claude.ts); adding a model or level is a reviewed change.
- **Dispatch.** Every session of a role runs with its model and effort: production, candidate review and verifier adequacy review. The SDK passes them to the CLI as `--model` and `--effort`.
- **Evidence.** Each invocation's observation records `model: {configured, reported, used}` and `effort: {configured, reported}`. The API does not echo effort, so `effort.reported` lists the levels the session reports applying to its turns, after any silent downgrade, or `"not-reported"` when it reports none. A reported level other than the configured one fails the invocation at once, and its later tool calls are refused.
- **Identity.** The roles are part of the evaluated configuration. Changing any role's model or effort gives every evaluation a new identity.
- **Amendment.** Amending a model or effort re-verifies and re-reviews each accepted evaluation on the same candidate. The candidate is not produced again, so its producer's original settings remain in that invocation's record. Admitted verifiers are pinned by digest and are not reviewed again. Approvals are requested again for the new evaluation, but an effect with a receipt never runs again.
- **Budgets.** Effort does not change limits. Attempts, retries and recorded usage persist across an amendment. Lowering effort after a spend stop reruns the same attempt as a counted retry.
- **Existing runs.** A run started before H2 has no effort in its saved configuration. Amend it with each role's effort before resuming.

## Internal CLI reference

The workflow jobs run `harness workflow check|prepare|route|controller|effects`, which read the dispatch inputs from `HARNESS_*` variables. The entry points below operate a local run directory. `FILE` and `DIR` denote resolved absolute paths, not operator shell variables.

```text
pnpm --filter @pactwright/checkpoint-harness harness plan --config FILE
pnpm --filter @pactwright/checkpoint-harness harness run --config FILE
pnpm --filter @pactwright/checkpoint-harness harness resume --run DIR
pnpm --filter @pactwright/checkpoint-harness harness approve --run DIR --request ID [--deny]
pnpm --filter @pactwright/checkpoint-harness harness amend --run DIR --config FILE --reason TEXT
pnpm --filter @pactwright/checkpoint-harness harness status --run DIR
```

| Command | Exit 0 | Exit 2 | Exit 3 |
| --- | --- | --- | --- |
| `plan` | Plan prepared; no acceptance. | Invalid configuration or definitions. | — |
| `run`, `resume` | Selection accepted. | Invalid admission or run. | Stopped unaccepted; inspect reasons. |
| `approve`, `amend` | Decision or amendment recorded. | Request refused. | — |
| `status` | Recorded facts printed. | Invalid or corrupt run. | — |

`run` and `resume` print the result as JSON, with progress on stderr. `status` reads records without writing them. A workflow job exits 0 when the run stops in order (selection accepted, a pause, a yield or a hand-off) and non-zero when it refuses the dispatch or the state.
