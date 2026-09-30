# Checkpoint 1 Task 4 — False-Completion Proof

**Version:** 5

**Date:** 30 September 2026

**T3 accepted baseline:** `9294813b9b62631804ca5a61547bd329c924bf94`

**Authority:** [Spec 00 v7](../specs/00-checkpoint-step-contract-and-delivery-tasks.md), §§3–5, and [T3 plan v4](2026-09-26-cp01-task-3-harness-and-software-run-model.md), §§5–9 and §12.

## 1. Objective

Establish whether the harness revision intended for T5 rejects false completion and permits valid correction. Reuse applicable T3 tests and evidence, then audit the changes delivered by the [H1–H3 prerequisite contracts](2026-09-30-cp01-t5-harness-prerequisites.md).

The recorded T3 baseline remains historical evidence. It does not prove later GitHub Actions or operational-step behaviour. If a prerequisite is not implemented, record that dependency as missing rather than as a defect in T3. H1–H3 implementation stays in the separate prerequisite work.

## 2. Execution

| Stage | Work | Output |
| --- | --- | --- |
| T4-A | Audit applicable T3 and H1–H3 evidence. | Coverage and exact gaps. |
| T4-B | Close those gaps, if any. | Added evidence or tested corrections. |
| T4-C | Independently review the final result. | T4 verdict. |

Run A first. Skip B when A finds no gaps. Run C in a fresh reviewer session.

**Working branch:** `feature/cp01-t4-false-completion` in `sb-dev/pactwright`. At A, create it from `refactor/pactwright-v2` if absent; otherwise inspect and continue the existing branch. Use this branch for all three stages.

**Exit-review file:**

```text
docs/research-logs/2026-09-29-cp01-task-4-false-completion-exit-review.md
```

Use these report sections: **Baseline, Coverage, Gap resolution, Verification, Independent review, Verdict**. Each stage updates this report.

### Required cases

| Case | Required result |
| --- | --- |
| Missing outputs | An absent or incorrect required output prevents acceptance. |
| Reviewed operational step | The pinned procedure executes in its declared target. Missing command results, outputs or required review prevent acceptance; valid evidence permits progression. |
| No-op producer | An incomplete candidate cannot pass from a completion claim alone. |
| Weak or missing checks | Missing or skipped targets, inadequate checks and forged results cannot satisfy acceptance. |
| Denied operations | A denied write or effect does not occur or count as successful. |
| Stale review | Review invalidated by a changed candidate or evaluation cannot satisfy acceptance. |
| Changed inputs | Evidence affected by an input change is invalidated before reuse. |
| Altered acceptance | Candidate edits cannot weaken approved criteria. Approved changes invalidate affected evidence. |
| Interruption | Resume preserves valid evidence, findings and configured limits. |
| Repeated external effects | Completed effects are not repeated by retries. Uncertain outcomes are reconciled before retry. |

Each fault needs a valid control. Show that invalid work cannot advance and that corrected valid work can. A no-diff submission is not a fault when the required work is already complete.

### GitHub Actions cases

Use the prerequisite tests where they already exercise these paths. Test valid and faulty cases through the same restore, dispatch or acceptance boundary.

| Case | Required result |
| --- | --- |
| Fresh runner | Restored journal, evidence, Git history, configuration and metadata support the same next action. |
| Missing, corrupt or stale state | Restore refuses the archive without resetting progress or selecting an older sequence. |
| Competing controllers | Only a stopped or released owner permits takeover. Active or unknown ownership cannot create a second writer. |
| Yield or runner loss | Attempts, retries and spend remain accounted for, including a lost invocation's reserved allowance. |
| Interrupted external action | Uploaded intent survives runner loss before or after execution. Target read-back prevents both duplicate effects and unsupported completion claims. |
| Approval and containment | Unauthorised or stale approvals are refused. Candidate code cannot access controller credentials or the Docker control socket. |
| Model and verifier identity | Unsupported model/effort pairs and unadmitted verifiers cannot pass. Changed settings or bindings invalidate affected evidence. |
| Scope and target changes | Omitted `through` keeps an existing selection; a new T5 run defaults to S01. Explicit extension, landed revisions and repository changes preserve the correct evidence links. |
| Checkpoint-wide targets | Applicable early checks can pass while later-only obligations remain pending. Final completion still requires the full exit evidence. |

### Verification and evidence

A and B run focused checks as needed. Run the commands below in GitHub Actions on the recorded candidate revision. After changing code or tests, B runs the offline/repository checks. C runs them on the final candidate.

```bash
pnpm --filter @pactwright/checkpoint-harness test
pnpm contracts:check
pnpm verify --force
git diff --check
```

Reuse T3 Docker and live execution evidence when its relevant code, verifier, review, configuration and toolchain inputs still apply. Record why it remains applicable. Rerun the affected suite when those inputs change or retained evidence does not prove a required fact.

```bash
# Docker integration
pnpm --filter @pactwright/checkpoint-harness test:integration
# Live provider; retain its run directory
PACTWRIGHT_LIVE_KEEP=1 pnpm --filter @pactwright/checkpoint-harness test:live
```

Prove runner replacement with separate hosted jobs and retained artifacts, including interruption around an external intent. Local process restart tests do not establish this behaviour. Reuse fixture effects rather than performing a real publication.

For each execution result, record the command, revision, outcome, GitHub job/attempt and evidence artifact identity. Distinguish T4 executions from reported T3 results and code inspection. If a required rerun is unavailable, record the missing proof. Retain the report and supporting run evidence for any new live execution.

## 3. T4-A — Coverage audit

### Inputs

Read the authorities above, H1–H3 implementation and acceptance records, the source and tests in `tools/checkpoint-harness/`, and T3 A–F reviews in PRs #54–#59. Start with [T3-E, PR #58](https://github.com/sb-dev/pactwright/pull/58) and [T3-F, PR #59](https://github.com/sb-dev/pactwright/pull/59) for integration and retained execution evidence.

### Tasks

1. Use the working branch from §2. Record its starting SHA, the included H1–H3 revisions and relevant changes from the T3 baseline.
2. Map every required case to its exact test, deliberate fault, valid control and execution evidence. Trace the controller's acceptance and next-step dispatch where progression is at issue.
3. Run existing probes where inspection does not establish coverage. Record an unproved behaviour as an evidence gap, not as a confirmed code defect.

**Review question:** can a later candidate invalidate an earlier review-only obligation without triggering a fresh review or safe pause? Trace the actual runner and review records before drawing a conclusion.

### Deliverable

Fill Baseline and Coverage. Record executed checks in Verification. Use coverage columns: **Case; test and control; execution path; evidence and revision; remaining gap**. Describe the smallest probe needed for each gap.

### Exit

Every required case has adequate evidence or a precise gap. Route an unimplemented H1–H3 requirement to the prerequisite work. Continue to B for proof gaps or defects in implemented behaviour; otherwise go to C. Harness behaviour remains unchanged during A.

### Run prompt

```text
In sb-dev/pactwright, read:
docs/research-logs/2026-09-29-cp01-task-4-false-completion-proof.md

Execute T4-A (§3), using the working branch and report defined in §2.
Update the exit review and stop at the T4-A exit condition.
```

## 4. T4-B — Gap closure

### Inputs

Use the gaps and evidence recorded by A, or findings returned by C. Newly required H1–H3 capabilities are implemented under their prerequisite contracts, not added as T5 product work.

### Tasks

1. Exercise each gap through the runner or decision path that owns the behaviour. Retain an equivalent valid control.
2. If the current harness behaves correctly, retain the new proof and leave the implementation unchanged. If it exposes a defect, record the failing result before fixing it. Then show the faulty case is rejected and the valid correction can progress.
3. Run the applicable checks from §2. Update the gap evidence and identify any retained Docker or live proof that needs a rerun.

### Deliverable

Update Gap resolution and Verification with each probe, pre-fix result, correction if needed, and final evidence. Any unresolved gap names the exact remaining work or blocker.

### Exit

Every gap has supporting evidence or a specific blocker. Continue to C for the verdict.

### Run prompt

```text
In sb-dev/pactwright, read:
docs/research-logs/2026-09-29-cp01-task-4-false-completion-proof.md

Execute T4-B (§4) on the working branch defined in §2.
Use and update the exit review. Stop at the T4-B exit condition.
```

## 5. T4-C — Independent final review

### Inputs

Use a fresh session that did not implement B's corrections. Read the final candidate, exit review, new tests and retained T3 evidence.

### Tasks

1. Independently check each required case and its control against the code and execution records. Check test adequacy: the evidence must show rejection for the intended fault, not an unrelated setup failure.
2. Apply the verification policy in §2 to the final candidate. Check whether later changes invalidate any retained proof.
3. Record findings and a verdict. Return code corrections to B rather than implementing them in the review session.

### Deliverable

Complete Verification, Independent review and Verdict. Record the reviewed SHA. For uncommitted code, also retain the diff and hashes of new files so the report identifies what was actually reviewed.

### Exit

| Verdict | Outcome |
| --- | --- |
| **PASS** | All required cases have current adequate evidence and independent adequacy review. T4 is complete. |
| **CHANGES REQUIRED** | A defect or evidence gap remains. Return the specific findings to B, then repeat C. |
| **BLOCKED** | A missing prerequisite implementation, resource or authority prevents required proof that retained evidence cannot establish. |

### Run prompt

```text
In a fresh reviewer session for sb-dev/pactwright, read:
docs/research-logs/2026-09-29-cp01-task-4-false-completion-proof.md

Execute T4-C (§5) on the working branch defined in §2.
Update the exit review with the reviewed candidate, findings and verdict.
```

## 6. Revision record

Version 4 consolidates the case checklist, report layout and verification policy. All stages use the same structure, one working branch and short stage-specific launch prompts.

Version 5 adds H1–H3 and GitHub Actions proof, replaces the conversion-pause case with operational execution, and keeps historical T3 evidence separate from the revised target.

**Checkpoint 1 Task 4 — False-Completion Proof, Version 5**
