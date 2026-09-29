# Checkpoint harness — operator procedure

The bootstrap harness of Spec 00 Task 3
([research log](../../docs/research-logs/2026-09-26-cp01-task-3-harness-and-software-run-model.md)).
It runs checkpoint steps through produce → verify → review → correct and
records every fact in a controller-owned run directory. This page covers
running, resuming and approving, and what to do at each pause.

Never edit a run directory: not the journal, not the evidence, not the source
repository. Resume derives everything from the recorded facts. Approvals enter
only through `approve`.

## Commands

Run from inside the repository that holds the definitions and the source
branch. pnpm runs the script in `tools/checkpoint-harness`, so give absolute
paths:

```bash
pnpm --filter @pactwright/checkpoint-harness harness plan --config FILE
pnpm --filter @pactwright/checkpoint-harness harness run --config FILE
pnpm --filter @pactwright/checkpoint-harness harness resume --run DIR
pnpm --filter @pactwright/checkpoint-harness harness approve --run DIR --request ID [--deny]
pnpm --filter @pactwright/checkpoint-harness harness status --run DIR
```

| Command   | Exit 0                         | Exit 2                                                          | Exit 3                                      |
| --------- | ------------------------------ | --------------------------------------------------------------- | ------------------------------------------- |
| `run`     | the selection is accepted      | invalid admission: configuration, definitions, roles, head      | the run stopped unaccepted; see its reasons |
| `resume`  | the selection is accepted      | not a run, a live owner, or the pinned configuration is invalid | the run stopped unaccepted, or is corrupt   |
| `approve` | the decision is recorded       | refused: see the diagnostics                                    | —                                           |
| `status`  | facts printed; nothing written | not a run or corrupt                                            | —                                           |

`run` and `resume` print one JSON result:

- `outcome` is `selection-accepted` or `paused`;
- `dir` is the run directory;
- `accepted` lists the accepted steps;
- each entry of `reasons` has a `code`, a `subject`, a `detail`, the linked
  `requirements` and, when an operator can answer it, a `request`.

Exit 0 means the selected steps are accepted, never that the checkpoint is
complete. Progress events go to stderr. SIGINT or SIGTERM stops the run
resumably. An unexpected controller error prints `outcome: failed` and exits
3; `resume` recovers the run.

## Run configuration

Besides the planning sections, `run` needs:

- **`roles.producer`** and **`roles.reviewer`**: see `dispatch.schema.json`.
- **`credentials.provider`**: `env:NAME`, the variable that holds the
  credential.
- **`budgets`**:
  - `attempts`: production attempts per step, corrections included;
  - `retries`: protocol retries per step;
  - `wall_time_seconds` and `provider_spend_limit`: limits per invocation.
- **`workspace`**:
  - `candidate_root`: holds the contained workspaces;
  - `controller_root`: holds the run directories.
- **`permissions`**:
  - `writable`, `scratch` and `protected` paths;
  - `approvers`: authority → the operator accounts that hold it.

The repository branch must be at `repository.expected_head`. The
configuration is pinned in the run, so `resume` uses it unchanged.

## Pauses

`status --run DIR` shows the latest pause and the runner state. A repeated
execution always counts as a retry, including after a crash or cancellation.
Counters never reset on resume.

| Code                                         | Meaning                                                                                                                                                                                                                                                                                 | Operator action                                                                                                                                                                                                              |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval` with `awaiting approval`          | The step passed verification and review, and needs an approval of this exact evaluation.                                                                                                                                                                                                | Inspect the request in the evidence. As an account listed under its authority, run `approve --run DIR --request ID`, or add `--deny`. Then `resume`. An approved effect runs once, after acceptance.                          |
| `approval` with `denied` or another mismatch | The approval was denied, or a recorded approval does not match this target, authority or evaluation.                                                                                                                                                                                   | It cannot be approved again in this run. Fix the cause, then start a new run.                                                                                                                                                |
| `cancelled`                                  | The controller was stopped.                                                                                                                                                                                                                                                             | `resume`.                                                                                                                                                                                                                    |
| `retries`                                    | The step used its protocol retries: malformed results, faults or interruptions.                                                                                                                                                                                                         | Read the failures in the journal. Budgets cannot be changed within a run: start a new run.                                                                                                                                   |
| `exhausted`                                  | Correction attempts, or a provider time, turn or spend limit, ran out.                                                                                                                                                                                                                  | Read the last findings. Start a new run with an amended configuration.                                                                                                                                                      |
| `producer-blocked`                           | The producer reported a contradiction or missing authority.                                                                                                                                                                                                                             | The owner resolves it, by amending a definition or granting authority. Then start a new run.                                                                                                                                 |
| `owner`                                      | An owner decision is needed. Possible causes: an unregistered or misused binding; no effect service; an accepted input that changed; a paused admission; a changed protected verifier; a self-contradicting or blocked review; an approval bound to no request. | The detail names the cause. Fix it through its owner, for example with a new binding version or a reviewed definition amendment. Then start a new run.                                                                  |
| `retry`                                      | A decision found records it cannot count, after every retry of its phases.                                                                                                                                                                                                              | Investigate: this indicates a harness defect. Start a new run.                                                                                                                                                               |
| `unmet-dependency`                           | A step `uses` a capability that has no current receipt.                                                                                                                                                                                                                                 | The step cannot run until that capability is accepted.                                                                                                                                                                      |
| `unconverted`                                | The next eligible step is reviewed prose (Spec 00 §4).                                                                                                                                                                                                                                  | Convert and review the step. Then start a new run at the new definitions revision.                                                                                                                                           |
| `effect-uncertain`                           | An effect may have run, and its service cannot read the target back.                                                                                                                                                                                                                    | The harness never repeats it. Check the target by hand. A new run needs its approval again: deny it if the effect already happened.                                                                                          |
| `effect-invalid`                             | A receipt names another effect or target.                                                                                                                                                                                                                                               | Owner investigation. The effect is not repeated.                                                                                                                                                                             |
| `corrupt`                                    | Committed journal records failed validation.                                                                                                                                                                                                                                            | Keep the run directory unchanged for investigation. Do not edit it.                                                                                                                                                          |

`resume` exits 2 in these cases:

- the branch head moved away from `expected_head`;
- the credential is missing, or a skill pinned by `skill_digests` changed;
- another controller is live.

A moved head needs a new run. For the others, fix the environment and resume
again.
