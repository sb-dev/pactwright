# Checkpoint harness — operator procedure

The harness runs checkpoint work through produce → verify → review → correct → accept.

GitHub Actions operation below is the interface specified by the [T3.5 production readiness](../../docs/research-logs/2026-09-30-cp01-task-3-5-harness-production-readiness.md). At baseline `5dccd16373d8988a7294548de6f9de61be48e33a`, the CLI exists; the hosted workflow, portable recovery and GitHub approval channel still require implementation. H1 adds production verification, described under [Production verification](#production-verification).

For the S01 pilot and stage selections, use the [T5 run guide](../../docs/research-logs/2026-09-29-cp01-task-5-implementation-and-acceptance.md). The [T3 log](../../docs/research-logs/2026-09-26-cp01-task-3-harness-and-software-run-model.md) records the original design.

## Execution model

A **run** is the full harness execution. Its identifier is separate from the GitHub workflow run ID.

The **controller** is the trusted harness process inside a job. It reads saved state, chooses the next action, invokes Claude, runs checks and records acceptance. GitHub supplies the runner; it does not decide acceptance.

Candidate commands run in disposable Docker workspaces. Verification and review use fresh workspaces for the sealed candidate. Provider credentials stay with the controller. Repository writes and publication use narrowly authorised effect jobs.

The durable run state contains the journal, evidence, candidate Git history, effective configuration, approvals, counters and receipts. A fresh job restores this state and continues the same run.

## Workflow controls

**Workflow file:** `.github/workflows/checkpoint-harness.yml`

**T5 configuration file:** `.github/checkpoint-harness/cp01-t5.yml`

H3 supplies the workflow named **Checkpoint harness** on the default branch and the complete configuration template. Operate it through **Actions → Checkpoint harness → Run workflow**.

| Input | Use |
| --- | --- |
| `action` | `start`, `continue`, `approve`, `deny`, `amend` or `status`. |
| `run` | Stable identifier for the full harness execution, such as `cp01-t5`. |
| `through` | Optional boundary for `start` or `continue`. A new T5 run defaults to `CP01-S01`; an existing run keeps its saved boundary when omitted. |
| `request` | Exact pending request from the summary, for `approve` or `deny`. |
| `config_revision` | Commit containing the revised configuration, for `amend`. |
| `reason` | Explanation recorded with an amendment. |

The committed template omits `selection.through`. The workflow combines dispatch inputs with saved state and supplies the resolved selection to the harness. A blank continuation must not reset the boundary to S01.

### Start and continue

Use `start` for a new run. The workflow validates the configuration and pins the controller, definitions and candidate revisions.

Use `continue` with the same run identifier to resume. Supply `through` to extend the selected boundary, or omit it to retain the current selection. The workflow records a changed selection and restores the exact saved artifact; no local run-directory path is needed.

A job can stop at selection acceptance, an operator pause or a planned yield before timeout. A yield saves state and schedules continuation within the same selection. It does not extend the scope or reset a budget.

### Approve or amend

For `approve` or `deny`, inspect the pending request and candidate in the summary. The workflow records the authenticated GitHub actor against that request. An approval is not permission for a different candidate or effect.

For `amend`, commit the configuration change, supply its `config_revision` and a reason, then continue the run. Later jobs use the saved effective configuration, not an unrecorded edit on a branch. Role, effort, skill, verifier, policy or definition changes re-evaluate affected evidence. Existing receipts are retained.

### Read the result

The summary shows the run identifier, selected boundary, accepted steps, model/effort, reported spending and unresolved reservations, pause reason and next action. It links evidence, any candidate PR, and saved-state identity and expiry.

`selection-accepted` means the requested selection is accepted. A green job or successful artifact upload does not mean the checkpoint is complete. Final completion also requires its exit evaluation.

Every `run` and `resume` result carries `checkpoint`: `complete`, the checkpoint's `unaccepted` steps and the inherited targets still `pending`, each with the rule that defers it. Only `complete: true` reports checkpoint completion.

## Save and recover

H3 stores consistent state as immutable Actions artifacts with increasing sequence numbers. Save after durable phases, before an external action and before a planned yield. Retain the state for the full execution; an end-of-job upload alone cannot protect against runner loss.

Use one concurrency group per run with `cancel-in-progress: false`. Recovery also checks the recorded GitHub workflow/job/attempt and saved sequence. An active or unknown owner cannot be replaced merely because another runner has a different hostname or process ID.

| Condition | Action |
| --- | --- |
| Planned yield | Automatic continuation restores the saved selection. Use `continue` if scheduling failed. |
| Runner lost | `continue` restores the last valid state, preserves counters and reconciles any pending effect. |
| Pending approval | Review the exact request, choose `approve` or `deny`, then continue when authorised. |
| Budget exhausted | Amend only the required limit and record the reason. Existing usage remains counted. |
| Missing, corrupt or stale archive | Stop and investigate the named state. Do not silently start a fresh run or restore an older sequence. |
| Uncertain external result | Read the target back. Retain a matching receipt; retry only when the target proves the action did not complete. |
| Harness defect | Return the missing capability or design defect to T3.5, verify the corrected harness revision through T4, then resume T5. |

Operational steps use their declared repository or fixture. The harness retains evidence links when work lands or the target changes, and reruns affected checks. Reviewed prose does not require conversion before execution; missing required execution evidence still prevents acceptance.

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

## Internal CLI reference

These are the existing CLI entry points used inside workflow jobs. `FILE` and `DIR` denote resolved absolute paths supplied by the workflow, not operator shell variables.

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

`run` and `resume` print the result as JSON, with progress on stderr. `status` reads records without writing them. The workflow translates dispatch actions into these operations; H3 supplies the cross-runner state and GitHub identity support that the baseline CLI lacks.
