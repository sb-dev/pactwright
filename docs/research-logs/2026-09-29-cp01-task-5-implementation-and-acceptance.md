# Checkpoint 1 Task 5 — GitHub Actions Run Guide

**Version:** 14

**Date:** 30 September 2026

**Status:** Execution plan; requires accepted T3.5 harness production readiness and a passing T4 proof.

**Source inspected:** `refactor/pactwright-v2` at `5dccd16373d8988a7294548de6f9de61be48e33a`

**Recommended repository file:** `docs/research-logs/2026-09-29-cp01-task-5-implementation-and-acceptance.md`

## 1. Execution on GitHub Actions

A **T5 run** is the full harness execution for Task 5.

The harness remains the orchestrator. GitHub Actions supplies temporary machines, credentials and a way to resume the T5 run.

```text
workflow dispatch
      ↓
GitHub-hosted runner
      ↓
harness controller
      ├── restore run state
      ├── choose the next eligible step/action
      ├── invoke Claude producer/reviewer
      ├── create Docker candidate/verifier workspaces
      ├── decide acceptance or correction
      └── save run state
              ↓
       Actions artifact
              ↓
       next hosted runner
```

### Harness components

| Component | Role |
| --- | --- |
| **Workflow** | Starts or continues a run and supplies the GitHub runner. It does not decide checkpoint progress. |
| **Controller** | The trusted harness process running inside the job. It reads the recorded run state, decides the next harness action, invokes Claude, runs verification/review, records evidence and releases the T5 run before the job ends. |
| **Candidate workspace** | Disposable Docker workspace where producer-generated changes and candidate commands run. It does not own run state or credentials. |
| **Verifier/reviewer workspaces** | Fresh workspaces used to check the sealed candidate independently of the producer session. |
| **Run state** | Journal, evidence, candidate Git history, configuration, approvals, counters and receipts. This is the durable state transferred between jobs. |
| **External effect job** | Narrowly authorised execution for actions such as repository writes or publication. The controller records intent and later records the read-back receipt. |

A new GitHub runner creates a **new controller process**, but it continues the same T5 run by restoring the previous saved state. Hostname, process ID and runner filesystem are therefore not run identity.

### One job

A job does this:

```text
restore state
→ validate state and ownership
→ run harness actions
→ reach acceptance, a pause, or planned yield
→ release ownership
→ save state
```

One job may complete several producer/verify/review/correct cycles. A checkpoint stage may also require several jobs. The selected `through` step controls the work boundary; the GitHub job boundary is only an execution limit.

### State hand-off

H3 makes the run directory portable. The complete run state is stored as an immutable Actions artifact with a monotonically increasing run sequence.

The next job restores that exact sequence and validates it before taking ownership. Missing, corrupt or stale state stops the T5 run instead of creating a fresh run.

Save state:

- after a completed harness phase that changes durable run state;
- before an external action;
- before a planned job yield.

Do not rely on an upload that runs only at normal job completion. A runner can disappear before that point.

### Ownership and external actions

Only one controller may write a run at a time. GitHub concurrency prevents two normal workflow runs from progressing the same T5 run, while H3 also validates the saved owner/job identity before takeover.

Candidate code remains inside Docker containment. Provider credentials stay with the controller. Repository writes, release operations and other privileged effects use only the credentials required for that action.

The controller does not assume an interrupted external action failed. On resume it reads the target back, records the receipt if the action completed, and only retries when the target proves that it did not.

## 2. Required harness baseline

[T3.5 — Harness Production Readiness](2026-09-30-cp01-task-3-5-harness-production-readiness.md) defines the changes this guide uses:

| Contract | Change |
| --- | --- |
| H1 | CP01 verifier admission, hosted candidate checks and checkpoint-target applicability. |
| H2 | Independent producer/reviewer model and effort settings, with recorded effective values. |
| H3 | GitHub workflow controls, portable state, approvals and operational continuation. |

T3.5 must be accepted before T4 starts, and T4 must pass before this T5 run starts. The remaining sections describe how to use that proven harness.

## 3. Configure the GitHub workflow

### 3.1 Workflow

**Recommended file:** `.github/workflows/checkpoint-harness.yml`

H3 supplies one manually dispatched workflow named **Checkpoint harness**.

The workflow has four responsibilities:

1. restore the selected run state;
2. compose the effective harness configuration for this dispatch;
3. start the harness controller on the hosted runner;
4. save the released run state and publish the run result.

`through` is an optional `workflow_dispatch` input:

- new T5 run + no `through` → `CP01-S01`;
- supplied `through` → use that checkpoint boundary;
- existing T5 run + no `through` → keep the saved boundary.

The committed template omits `selection.through`. The workflow supplies the effective selection before calling the harness and retains it in saved run state.

Use one concurrency group per T5 run with `cancel-in-progress: false`. A continuation job must not cancel the controller that is currently writing run state.

The workflow uses the provider credential required by the harness. Privileged repository or publication credentials are supplied only to the jobs that execute those effects.

### 3.2 Run configuration

**Recommended file:** `.github/checkpoint-harness/cp01-t5.yml`

Use the complete template delivered by H3. These are the initial role and credential settings to set in that file:

```yaml
roles:
  producer:
    adapter: claude-sdk
    model: claude-opus-5-5
    effort: high
    skills: []
    max_turns: 100
  reviewer:
    adapter: claude-sdk
    model: claude-opus-5-5
    effort: high
    skills: []
    max_turns: 100
credentials:
  kind: api-key
  provider: env:ANTHROPIC_API_KEY
```

The complete template also holds the checkpoint path, candidate repository/branch, definitions, write policy, approvers, selected skills and budgets. Use `sb-dev/pactwright` and `refactor/pactwright-v2` as the initial candidate source. H3 resolves and records exact revisions at run start and generates runner-local paths.

Review the complete configuration in GitHub before the first dispatch. Later jobs restore its saved version. A configuration edit takes effect only through the workflow's `amend` action.

## 4. Choose Claude model and effort

These are starting recommendations, not benchmark results:

| Work | Producer | Effort |
| --- | --- | --- |
| S01 pilot; graph, lifecycle, architecture or cross-cutting integration | `claude-opus-5-5` | `high` |
| Well-bounded implementation with strong automated checks | `claude-sonnet-5` | `medium` |
| Repeated requirement or architecture findings | `claude-opus-5-5` | `high` |

Keep the reviewer on `claude-opus-5-5` with `high` effort. Select only models admitted by H2 and available to the Actions credential.

Use `xhigh` or `max` only when the recorded failures show a reasoning problem. Effort is not a spending cap; the T5 run budgets remain separate. [Claude effort][claude-effort].

Make setting changes between stage selections through `amend`. The harness records the change and re-evaluates affected evidence. The workflow launches the SDK sessions; interactive Claude Code settings do not configure them.

## 5. Start the S01 pilot

Open **sb-dev/pactwright → Actions → Checkpoint harness → Run workflow**. Use the default workflow branch.

| Input | Value |
| --- | --- |
| `action` | `start` |
| `run` | `cp01-t5` |
| `through` | optional; leave empty to start at `CP01-S01` |

The workflow validates the complete configuration, pins the controller and candidate revisions, and runs the selected work. If S01 is still in progress at the planned stop point, the workflow saves state and schedules continuation before the job timeout.

Read the workflow summary. It shows the T5 run, selected boundary, accepted steps, current model/effort, reported spending and unresolved reservations, pause reason, next operator action, evidence links, candidate PR where present, and saved-state identity/expiry.

A successful save is not step acceptance. Proceed to Stage 1 when the harness result is `selection-accepted` through `CP01-S01`.

## 6. Continue by stage

Open **Run workflow** again. Keep `run: cp01-t5` and choose `action: continue`.

Set optional `through` when you want to extend the T5 run to a new boundary. Leave it empty to continue the currently selected boundary.

| `through` | Work |
| --- | --- |
| `CP01-S05` | Finish the canonical Project Graph substrate. |
| `CP01-S09` | Lifecycle execution. |
| `CP01-S13` | Agent Pack, adapter and evaluation. |
| `CP01-S19` | Environment resolution and local composition. |
| `CP01-S21` | CI and release safety. |
| `CP01-S24` | Packed-consumer proof. |
| `CP01-S26` | Self-hosting and the Quick Start delivery. |
| `CP01-S27` | Public learning material. |
| `CP01-S28` | Release publication and registry proof. |
| `CP01-S30` | Kakeibo installation and delivery. |
| `CP01-S31` | Feedback and final checkpoint evaluation. |

For each selection, the workflow restores the latest valid run checkpoint, records the scope amendment, and resumes. It locates the exact saved artifact; the operator does not copy run-directory paths between jobs.

The jobs continue within the selected boundary. At acceptance, inspect the summary and choose the next row. Later operational stages use the same Actions controls; their checkpoint procedures supply the commands and required human actions.

## 7. Handle pauses and changes

Use the same **Run workflow** form and run ID.

| Situation | Action |
| --- | --- |
| Planned harness yield | No operator action. The workflow saves state and schedules continuation within the current selection. |
| Failed or cancelled runner | Select `continue` with `through` blank. It restores the saved selection and reconciles incomplete work. |
| Approval request | Review the request and candidate in the summary. Select `approve` or `deny` and copy its exact ID into `request`. The workflow checks your GitHub identity. |
| Required human merge or release action | Perform the specific action named by the checkpoint. Select `continue` so the harness reads back the result. |
| Budget or model change | Edit the run configuration in GitHub. Select `amend`, supply its commit SHA as `config_revision`, and give a `reason`. The workflow records the change before resuming. |
| Inspect without continuing | Select `status`. |
| Harness defect or missing state | Resolve the separate harness or recovery issue, then select `continue`. |

Automatic continuations cannot grant human approvals. An interrupted external action is inspected before it is retried. Approval of an action is not evidence that the action completed.

## 8. Complete T5

After S31, inspect the final workflow summary or dispatch `status`.

Completion requires `selection-accepted` through `CP01-S31` **and** a passing checkpoint exit evaluation, including the required publication and Kakeibo receipts. A green Actions job alone is not that result.

Keep the final state artifact and its evidence links for T6. Archive the evidence before the displayed retention expiry.

## References

The guide uses the repository revision in the header and the official references below. It specifies operation after H1–H3; it is not an execution report.

- [Spec 00 — Checkpoint Step Contract and Delivery Tasks][spec00]
- [T3 — Harness and Software Run Model][t3]
- [T3.5 — Harness Production Readiness][t35]
- [Checkpoint 1 — Self-Hosted Delivery][cp01]
- [Harness operator procedure][harness]
- [GitHub artifacts][gha-artifacts], [limits][gha-limits], [manual dispatch][gha-dispatch], [concurrency][gha-concurrency], [workflow triggering][gha-trigger] and [security][gha-security]
- [Claude effort][claude-effort]

[spec00]: ../specs/00-checkpoint-step-contract-and-delivery-tasks.md
[t3]: 2026-09-26-cp01-task-3-harness-and-software-run-model.md
[t35]: 2026-09-30-cp01-task-3-5-harness-production-readiness.md
[cp01]: ../checkpoints/01-self-hosted-delivery.md
[harness]: ../../tools/checkpoint-harness/README.md
[gha-artifacts]: https://docs.github.com/en/actions/tutorials/store-and-share-data
[gha-limits]: https://docs.github.com/en/actions/reference/limits
[gha-dispatch]: https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow
[gha-concurrency]: https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency
[gha-trigger]: https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow
[gha-security]: https://docs.github.com/en/actions/reference/security/secure-use
[claude-effort]: https://platform.claude.com/docs/en/build-with-claude/effort

**Checkpoint 1 Task 5 — GitHub Actions Run Guide, Version 14**
