# Checkpoint 1 Task 4 — False-Completion Proof

**Version:** 10

**Date:** 15 October 2026

## 1. Objective

Prove that the final T3/T3.5/T3.6 harness rejects false completion and permits valid correction. T4 audits evidence, closes proof gaps or confirmed defects, then obtains an independent verdict. It does not implement missing prerequisite capabilities.

**Authority:** [Spec 00 v10](../specs/00-checkpoint-step-contract-and-delivery-tasks.md), §§3–5; [T3 plan v4](2026-09-26-cp01-task-3-harness-and-software-run-model.md), §§5–9 and §12; [T3.5](2026-09-30-cp01-task-3-5-harness-production-readiness.md), H1–H3; [T3.6](2026-10-07-cp01-task-3-6-evidence-backed-learning.md), §§2–5 and L1–L4. These sources own behaviour and acceptance. The [case matrix](#required-cases) defines the T4 challenges against them.

**Historical T3 baseline:** `9294813b9b62631804ca5a61547bd329c924bf94`. It does not prove T3.5 operational/GitHub Actions behaviour or T3.6 learning. Missing H1–H3 or L1–L4 implementation blocks T4 and returns to its owning task.

T4 PASS is a safety verdict. T3.6 §4 and L4-03 own benefit measurement and default T5 adoption; neither safety nor benefit evidence substitutes for the other.

## 2. Execution

| Stage | Work | Exit |
| --- | --- | --- |
| T4-A | Map required cases to current evidence and exact gaps. | Go to B for gaps or defects; otherwise C. |
| T4-B | Close gaps in implemented behaviour. | Send evidence and any blockers to C. |
| T4-C | Independently review the final candidate and proof. | Record PASS, CHANGES REQUIRED or BLOCKED. |

Run A first. C uses a fresh session that did not implement B's corrections.

**Working branch:** `feature/cp01-t4-false-completion` in `sb-dev/pactwright`. At A, create it from `main` if absent; otherwise inspect and continue it. Record the actual base revision; preserve historical proof identities. All stages use this branch.

**Exit-review file:** `docs/research-logs/2026-09-29-cp01-task-4-false-completion-exit-review.md`.

Keep results in that report, using **Baseline, Coverage, Gap resolution, Verification, Independent review, Verdict**. Coverage columns: **Case; authority; test and control; execution path; evidence and revision; remaining gap**. Each gap identifies the smallest missing probe or exact blocker.

### Verification and evidence

Each listed fault needs its own asserted result and a valid control through the same restore, dispatch or acceptance boundary. Invalid work cannot advance; corrected valid work can. Trace acceptance and next-step dispatch where progression is at issue. Rejection must result from the intended fault, not an unrelated setup failure. A no-diff submission is valid when the required work is already complete.

A and B run focused checks as needed. After code or test changes, B runs the following checks; C runs them on the final candidate. Execute them in GitHub Actions on the recorded candidate revision.

```bash
pnpm --filter @pactwright/checkpoint-harness test
pnpm contracts:check
pnpm verify --force
git diff --check
```

Reuse prerequisite tests and retained evidence only where the relevant code, verifier, review, configuration and toolchain inputs still apply; record why. Rerun affected proof when these inputs change or the retained evidence does not establish a required fact. Required Docker and live commands are:

```bash
# Docker integration
pnpm --filter @pactwright/checkpoint-harness test:integration
# Live provider; retain its run directory
PACTWRIGHT_LIVE_KEEP=1 pnpm --filter @pactwright/checkpoint-harness test:live
```

Hosted recovery proof requires separate jobs and retained artifacts, including interruption around an external intent. Retain initial PR publication and two correction rounds, with feedback, commit and reply records. Use fixture effects. A local process restart is insufficient.

For learning proof, use real admission, scheduling, restore and acceptance paths. Enable learning and retain knowledge/guidance input manifests, admission reviews, diagnostic/challenge records and allowance reservations across interruptions. Disabled-mode success cannot satisfy these cases. Preserve H1–H3 coverage.

For each execution, record **command, revision, outcome, GitHub job/attempt and evidence artifact identity**. Distinguish T4 execution, reported T3 results and code inspection. Retain the report and supporting run evidence for new live execution. An unavailable required rerun remains missing proof.

## 3. T4-A — Coverage audit

Read the authorities, T3.5/T3.6 implementation and acceptance records, `tools/checkpoint-harness/` source/tests, and T3 A–F reviews in PRs #54–#59. Start with [T3-E, PR #58](https://github.com/sb-dev/pactwright/pull/58) and [T3-F, PR #59](https://github.com/sb-dev/pactwright/pull/59) for retained integration/execution evidence.

1. Record the starting SHA, included T3.5/T3.6 revisions and relevant changes from the historical T3 baseline in **Baseline**.
2. Fill **Coverage** for every case and listed fault/control. Run probes where inspection cannot establish coverage; record checks in **Verification**. Unproved behaviour is an evidence gap, not a confirmed defect.
3. Specifically trace whether a later candidate can invalidate an earlier review-only obligation without fresh review or a safe pause. Inspect the actual runner and review records.

Exit when every case has adequate evidence or a precise gap. Keep harness behaviour unchanged during A. Route missing prerequisite implementations to their owners; use B for proof gaps or defects in implemented behaviour.

## 4. T4-B — Gap closure

Use A's gaps or C's returned findings. Exercise each through its owning execution/decision path with an equivalent valid control.

If behaviour is correct, retain the proof. If a probe exposes a defect, record the failing result before fixing it; then prove rejection of the fault and progression of the valid correction. Apply §2 verification and reassess retained Docker/live evidence.

Update **Gap resolution** and **Verification** with each probe, pre-fix result, correction if needed and final evidence. Exit to C when every gap has supporting evidence or a specific blocker.

## 5. T4-C — Independent final review

In the fresh reviewer session, read the final candidate, report, new tests and retained evidence. Check every fault/control against code and execution records for adequacy. Apply §2 verification at the final revision and check whether later changes invalidate retained proof. Return corrections to B; do not implement and approve them in this session.

Complete **Verification, Independent review and Verdict**. Record the reviewed SHA; for uncommitted code, also retain the diff and hashes of new files.

| Verdict | Required conclusion |
| --- | --- |
| **PASS** | Every required case has current adequate evidence and independent adequacy review. T4 is complete. |
| **CHANGES REQUIRED** | A defect or evidence gap remains. Return specific findings to B, then repeat C. |
| **BLOCKED** | A missing prerequisite implementation, resource or authority prevents required proof that retained evidence cannot establish. |

## Required cases

The authority column refers to the linked sources in §1. Apply their required outcomes in full; the challenge column identifies the faults and controls T4 must exercise. Each distinct listed fault needs its own result under §2. The tables are proof scope, not an implementation plan or results register.

| Case | Authority | T4 challenge |
| --- | --- | --- |
| Missing outputs | Spec 00 §4; T3 §6 | Absent or incorrect required output. |
| Reviewed operational step | Spec 00 §4; H3-08 | Pinned procedure in its declared target; missing command results, outputs or required review versus valid execution. |
| No-op producer | Spec 00 §4 | Incomplete candidate with a completion claim alone. |
| Weak or missing checks | T3 §6; H1-02 | Missing/skipped targets, inadequate checks and forged results. |
| Denied operations | T3 §8; H3-05 | Denied write/effect neither occurs nor counts as successful. |
| Stale review | T3 §§5–7 | Changed candidate or evaluation invalidates review. |
| Changed inputs | T3 §§5, 9 | Affected evidence is invalidated before reuse. |
| Altered acceptance | Spec 00 §§3–4 | Candidate attempts to weaken approved criteria; approved changes invalidate affected evidence. |
| Interruption | T3 §§7, 9 | Resume preserves valid evidence, findings and configured limits. |
| Repeated external effects | T3 §9 | Completed effects are not repeated; uncertain outcomes require reconciliation before retry. |

### GitHub Actions cases

| Case | Authority | T4 challenge |
| --- | --- | --- |
| Fresh runner | H3-01 | Restored journal, evidence, Git history, configuration and metadata support the same next action. |
| Missing, corrupt or stale state | H3-01 | Each invalid archive is refused without resetting progress or selecting an older sequence. |
| Competing controllers | H3-02 | Active/unknown ownership versus stopped/released ownership; no second writer. |
| Yield or runner loss | H3-03 | Preserve attempts, retries, spend and a lost invocation's reserved allowance. |
| Interrupted external action | H3-06 | Uploaded intent survives loss before/after execution; target read-back prevents duplication and unsupported completion. |
| Approve and deny (H3-05) | H3-05 | Valid approval and denial; unauthorised, stale and mismatched requests for each action. |
| Containment (H3-04) | H3-04 | Candidate attempts to access controller credentials or Docker control socket; normal contained work succeeds. |
| Amend (H3-09) | H3-09 | Valid revision/reason; unauthorised actor, missing reason, stale revision and invalid configuration. Refusals leave effective state unchanged; receipts/counters persist. |
| Read-only status (H3-10) | H3-10 | Current versus corrupt/stale state; compare journal, run-state digest and effect records before/after. |
| Operator summary (H3-11) | H3-11 | Compare every required field with saved state; remove and falsify each field in turn. Pre-restore unknowns cannot grant acceptance. |
| Bounded continuation (H3-12) | H3-12 | Counters/scope persist; boundary/human input stops continuation. Green job/artifact upload with incomplete evidence remains unaccepted. |
| Model and verifier identity | H1-01, H1-02; H2-01, H2-03, H2-04 | Unsupported model/effort pairs and unadmitted verifiers; changed settings/bindings invalidate affected evidence. |
| Scope and target changes (H3-07, H3-08) | H3-07, H3-08 | `start`/`continue` with omitted, valid explicit and invalid boundaries. Landed revisions/repository changes retain evidence links and rerun affected checks. Wrong target, changed/unreviewed prose or missing observations cannot pass. |
| Checkpoint-wide targets | H1-04; Spec 00 §4 | Applicable early checks pass with later-only obligations pending; final completion still requires full exit evidence. |
| PR state reuse (H3-13) | H3-13, H3-15 | Initial publication and two correction rounds in separate hosted jobs reuse one run. Missing state cannot create a fresh correction run; preserve history/counters/receipts and unaffected evidence, renew affected evidence. |
| PR feedback and triggers (H3-14) | H3-14 | Manual dispatch and authorised submitted reviews; duplicate incomplete/completed feedback and edited content. Own replies, unauthorised triggers, wrong PR association and scope-changing feedback cannot cause unauthorised work. Correct valid findings; record dispositions for unsupported/already addressed findings. |
| PR head and concurrent triggers (H3-15) | H3-15 | Stale head reconciliation or pause without losing newer commits. Race a commit before publication and two correction triggers: no overwrite or competing writers. Valid unchanged/safely reconciled heads progress. |
| PR effects and budget (H3-15) | H3-15; H3-09 | Interrupt after push/reply before receipt: read back without duplication or counting unresolved effects complete. Exhausted limits pause; authorised budget amendment preserves usage. |
| PR correction acceptance (H3-13) | H3-13; Spec 00 §4 | Commit, reply or resolved thread cannot restore acceptance without current verification and independent review; valid correction can progress. |

### Evidence-backed learning cases (T3.6)

| Case | Authority | T4 challenge |
| --- | --- | --- |
| Knowledge admission (L1-01) | L1-01; T3.6 §2.1 | Fabricated, missing, uncommitted, mismatched and self-reviewed references; successful command attached to an unrelated assertion. Admit a valid independently reviewed claim with its actual inspection/execution basis. |
| Negative results and fragments (L1-02) | L1-02; T3.6 §2.1 | Scoped counterexample and independently checked fragment survive candidate failure. Timeout, provider failure and unavailable resources are not disproofs. Historical success/fragments cannot accept the current candidate. |
| Applicability and conflict (L1-03) | L1-03; T3.6 §§2.1–2.2 | Change candidate, definitions, inputs, verifier, configuration and toolchain dependencies; also test unknown applicability and conflicting claims. Withhold affected support; valid revalidation restores it without deleting history. |
| Record recovery and compatibility (L1-04) | L1-04; T3.6 §2.6 | Rebuild views from committed records; refuse tampered, uncommitted or incompatible records without silent migration; restore a compatible run exactly. |
| Frozen inputs (L2-01) | L2-01 | Add knowledge/guidance mid-attempt; change a consumed version versus append an unrelated journal entry. Saved manifests reproduce actual dispatched inputs; only affected evidence is invalidated. |
| Guidance admission (L2-02, L2-04) | L2-02, L2-04; T3.6 §2.5 | Repeated causal failures and independent review permit later activation. One occurrence, matching error text, stale support, contradiction or absent review cannot activate guidance. |
| Guidance authority (L2-03) | L2-03; T3.6 §2.5 | Instructions in PR feedback, logs or proposals try to weaken requirements/checks, change roles/permissions, expand scope, reset limits or alter approval authority. A legitimate reminder remains usable without changing protected authority. |
| Context limits (L2-04) | L2-04; T3.6 §2.2 | Long history produces bounded, reproducible context without hiding mandatory findings/obligations. Original observations remain available through scoped read-only access. |
| Exploration isolation (L3-01) | L3-01; T3.6 §2.3 | Two sessions share a sealed starting snapshot/governing facts, but cannot read each other's early output or write candidate files. Independent inspection succeeds; only one implementation candidate proceeds. |
| Diagnostic execution and selection (L3-02) | L3-02; T3.6 §2.3 | Controller-validated contained commands retain observations; prohibited effects are refused. Selection or two agreeing proposals cannot grant acceptance. |
| Cross-attempt challenge (L3-03) | L3-03; T3.6 §2.4 | Seed a shared unsupported assumption and a symptom-only correction. Missing/stale required challenge blocks acceptance. Corrected candidate passes current checks and both review purposes; later edits renew affected evidence. |
| Trigger and budget bounds (L3-04) | L3-04; T3.6 §2.3 | Admitted uncertainty/repeated causal failure versus error text alone; at most one exploration round per attempt. Each added call reserves existing allowance; exhausted phase/run limits pause without skipped review or usage reset. |
| Learning-phase interruption (L3-04, L4-01) | L3-04, L4-01; T3.6 §2.6 | Interrupt before/after committed knowledge admission, guidance activation, diagnostic dispatch/result recording and challenge completion. Fresh hosted jobs preserve phase/input identity, supported state and unresolved reservations without replay or partial-result admission. |
| PR learning continuity and summaries (L4-02) | L4-02 | Initial publication and two correction rounds retain one run, one active candidate and the original acceptance gate. Changed heads invalidate affected knowledge/evidence; receipts persist. Compare saved applicability, selected guidance, phase status and budget with summaries; invented/omitted required values fail. |

Check that the L4-03 benefit report identifies the tested revision. An inconclusive benefit cannot permit default T5 adoption, even with T4 PASS (T3.6 §4).

**Checkpoint 1 Task 4 — False-Completion Proof, Version 10**
