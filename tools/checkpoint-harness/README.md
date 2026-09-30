# Checkpoint harness — operator procedure

The harness runs checkpoint work through produce → verify → review → correct → accept.

GitHub Actions operation below is the interface specified by the [H1–H3 prerequisites](../../docs/research-logs/2026-09-30-cp01-t5-harness-prerequisites.md). At baseline `5dccd16373d8988a7294548de6f9de61be48e33a`, the CLI exists; the hosted workflow, portable recovery and GitHub approval channel still require implementation.

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
| Harness defect | Correct the relevant prerequisite outside T5, verify it, and record the changed harness revision before recovery. |

Operational steps use their declared repository or fixture. The harness retains evidence links when work lands or the target changes, and reruns affected checks. Reviewed prose does not require conversion before execution; missing required execution evidence still prevents acceptance.

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
