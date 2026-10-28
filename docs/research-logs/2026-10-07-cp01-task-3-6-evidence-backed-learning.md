# Checkpoint 1 Task 3.6 — Evidence-Backed Learning

**Version:** 1

**Date:** 9 October 2026

**Status:** Implementation plan. No implementation or acceptance is claimed.

**Planning baseline:** `refactor/pactwright-v2` at `cb6a0f76e2c3bfad9d2bc79fb482456e9ab05d19`.

**Authority:** [Spec 00 v10](../specs/00-checkpoint-step-contract-and-delivery-tasks.md), §§3–5. [T3.5](2026-09-30-cp01-task-3-5-harness-production-readiness.md) remains the H1–H3 baseline. [T4](2026-09-29-cp01-task-4-false-completion-proof.md) owns the independent false-completion proof.

## 1. Decision and scope

Implement Option 1: one working candidate with evidence-backed learning. Retain one saved harness run and one controller-owned acceptance gate. Improve how later attempts use earlier evidence, including PR correction rounds within that run.

T3.6 follows T3.5 and precedes T4. It does not reopen the H1–H3 definitions or count their historical acceptance as proof of new behaviour. Before implementation, confirm their acceptance evidence applies to the chosen baseline. A merged implementation alone does not establish acceptance.

The extension adds four behaviours:

- Separate attempted work from supported, reusable knowledge.
- Retain scoped negative results and useful fragments from failed candidates.
- Explore two approaches independently, then challenge assumptions across attempts.
- Use reviewed failure evidence to select bounded guidance for later attempts.

Reuse the journal, evidence store, portable archive, provider adapter, role settings, containment, budgets and PR correction path. Keep their existing authority boundaries.

Competing code candidates, shared memory across unrelated runs, additional providers, autonomous edits to harness code or shared skills, and a second acceptance system are outside scope. Historical snapshots support inspection; they are not active implementation branches.

## 2. Design contract

Expected change areas:

```text
tools/checkpoint-harness/
  src/knowledge.ts           knowledge admission, applicability and derived views
  src/evidence.ts            committed records and consumed-input identity
  src/state.ts               portable state and compatibility validation
  src/claude.ts              packets, invocation purposes and structured outputs
  src/software-bootstrap.ts  review rubrics and binding policy
  src/verification.ts        support review, challenge and acceptance integration
  src/runner.ts              scheduling, reservations, recovery and summaries
  src/pull-requests.ts       existing correction-round evidence
  src/dispatch.schema.json  validated learning configuration
  test/                     focused fault/control and regression tests
  test/integration/         contained diagnostic execution
  test/live/                provider compatibility for new purposes
  test/hosted/              fresh-runner recovery and correction proof
  README.md                 operator procedure

.github/
  checkpoint-harness/cp01-t5.yml  validated settings; adoption remains gated
  workflows/                    existing hosted execution paths, only as needed
```

These paths assign responsibilities. They do not require a new abstraction or test file for each item. Keep shared mechanics in their existing owners.

### 2.1 Records and supported knowledge

Add a small `knowledge.ts` module to derive three views from committed journal events and immutable evidence: attempt history, supported knowledge and process guidance. A saved view is a disposable cache. The journal and referenced evidence remain its source.

Each knowledge proposal records:

| Field | Required meaning |
| --- | --- |
| Identity | Stable entry ID, record version, source run, attempt and optional PR round. |
| Claim | One precise assertion, its requirement or target, and whether it describes a positive result, failed approach or counterexample. |
| Evidence | Original observation references and digests, plus the review that assessed their relevance and limits. |
| Basis | `reported`, `inspected` or `executed`; preserve the basis of each supporting observation. |
| Scope | Repository and candidate identity, pinned definitions and the input, verifier, configuration or toolchain dependencies on which the claim relies. |
| Disposition | Proposed, supported, rejected or superseded, with reason and links to earlier entries. Current applicability is evaluated separately. |

These are semantic requirements, not a prescribed JSON layout. Reuse existing identity types where possible.

An agent may propose an entry. A separate reviewer invocation checks the assertion against its original evidence. The controller validates record types, committed references, identities, scope and the required review before recording support. The proposer cannot review its own proposal. Model agreement alone cannot create support.

`reported` entries remain historical context. `inspected` means the assertion was supported by source inspection. `executed` requires actual command or verifier observations that establish the stated result. A successful command does not establish an arbitrary assertion attached to it. Preserve mixed evidence without upgrading inspection to execution.

A fragment from a failed candidate may become supported if it has its own adequate evidence and review. It cannot become an `AcceptedOutput` through this mechanism. Existing required verifiers, independent candidate review and approvals still decide acceptance.

Record negative results at the scope proved. “This approach failed this case at this revision” is different from “this approach cannot work”. Timeouts, unavailable resources and provider failures remain execution problems. They are not counterexamples.

Append corrections and supersession records. Do not rewrite history. If supported entries conflict within the same scope, withhold them from current support until review resolves the conflict. Preserve both original records. A conflict affecting a required acceptance fact blocks progression.

### 2.2 Applicability and frozen context

Select only knowledge from the same saved run. Validate each consumed entry against the current target and its recorded dependencies. Unknown or changed dependencies make the entry historical until revalidated. Do not assume a claim survives a candidate change because its text still looks relevant. A narrower dependency scope requires evidence and review; otherwise use the full candidate identity.

Before production starts, freeze the selected entry versions, guidance and their digests for that attempt. Freeze diagnostic inputs before exploration starts. Record each invocation's actual input manifest. Include consumed context in the relevant evaluation identity. Entries produced during an attempt become eligible only for a later attempt.

Hash the selected inputs, not the entire changing journal. A new, unrelated journal entry must not invalidate an unchanged evaluation. A changed consumed entry, source dependency or guidance version must renew affected evidence through the existing invalidation path.

Keep context bounded by validated configuration. Use deterministic ordering and record what was selected or omitted. Context limits cannot remove governing requirements, required findings or review obligations. Give reviewers scoped access to original evidence when summaries are insufficient. Do not expose controller credentials or unfiltered private records.

### 2.3 Independent exploration and selection

Trigger exploration when a reviewed finding identifies an unresolved choice needing a discriminating check, or the same reviewed causal failure persists across two correction attempts. Repeated error text alone is insufficient. Record the triggering finding and cause before scheduling work.

Run two fresh diagnostic sessions against the same sealed starting snapshot. Reuse the reviewer role's model, effort and read-only tools with distinct invocation purposes. One briefing seeks a viable approach; the other seeks counterexamples and alternatives. Both receive the same governing requirements and applicable knowledge. Neither receives the other's proposal or session history before both finish. Serial execution is sufficient for this isolation.

Each structured result names an approach, assumptions, evidence references and a check that can distinguish it from the alternative. Neither diagnostic session may edit the candidate, issue external effects or accept an output. Any proposed command runs only after controller validation through the existing contained execution path, against a disposable copy of the sealed snapshot. Retain its observations and charge its resource use to the run.

A separate reviewer invocation compares the proposals and available observations and recommends the next approach. The controller validates the recommendation's references and scope, records the routing decision, then invokes the existing producer. Selection is a search decision, not verification that the approach works. Missing evidence or an unresolved contradiction returns a blocker instead of an invented winner.

Allow at most one exploration round before each production attempt. Pin finite per-run exploration and context limits in validated configuration. A further round needs a new or still-supported trigger and remaining budget. Every diagnostic, comparison, knowledge-review and challenge call consumes the existing run limits. Reserve allowance before dispatch. If a required phase lacks resources, pause unaccepted and resumable; do not silently skip it.

### 2.4 Cross-attempt challenge

Keep ordinary candidate review independent of diagnostic recommendations. After it finishes, require a separate cross-attempt review when exploration occurred or the repeated-failure trigger applies.

This review consumes the current sealed candidate, ordinary review, relevant earlier attempts, original observations and PR correction records. It checks shared unsupported assumptions, symptom-only fixes and stale evidence. It returns structured findings or blockers through existing correction handling. Agreement between attempts cannot substitute for evidence.

Freeze this review's selected history and input digests when dispatched. Required challenge completion is part of the existing acceptance gate. A missing, stale or blocking challenge cannot be ignored. Re-seal and re-verify any correction made after review; transformation of a reviewed result does not preserve acceptance automatically.

### 2.5 Bounded process guidance

A guidance proposal must cite at least two reviewed occurrences of the same causal failure and name the requirement or check it helps satisfy. A separate reviewer invocation checks relevance, evidence and authority. The controller may activate the reviewed reminder for a later attempt within the same run.

Guidance is subordinate context. It may suggest attention or diagnostic work. It cannot change requirements, rubrics, verifier admission, role settings, permissions, budgets or approval authority. PR comments, logs and generated text remain untrusted data through extraction, review and activation. Structural validation alone does not establish that a reminder is safe or correct.

Select guidance by bounded, versioned entries rather than rewriting the whole instruction set. Record activation, supersession and withdrawal with reasons. Stale, contradictory or unsupported reminders are withheld. Changes to shared prompts, skills, configuration or control rules use the existing governed change path, including `amend` where applicable.

### 2.6 Recovery and compatibility

Persist proposal, support, guidance, exploration and challenge phases through the existing journal and portable archive. Restore exact committed progress, input manifests and reservations on a fresh hosted runner. Stable phase identities prevent duplicate admission or replay of completed diagnostic work. Unresolved provider usage stays reserved after interruption.

Pin record/schema versions and controller identity. This extension does not include migration of old runs to new controller code. Reject incompatible restore without mutating the archive or resetting counters. Existing runs can continue only with their compatible pinned controller. Future migration requires a separate explicit contract.

New runs record whether learning is enabled. Freeze that mode for the run. A disabled mode supports baseline comparison; it cannot satisfy T3.6 feature proof. Operator summaries distinguish historical, currently supported and withheld entries, selected guidance, exploration/challenge status and consumed budget. They must not call knowledge reuse step acceptance.

## 3. Implementation units

Implement L1 → L2 → L3 → L4 on branches based on `refactor/pactwright-v2`. Each unit needs fresh review before dependent work. Use one implementation commit per unit, with corrections in `fix:` commits. Follow repository commit and verification rules. These units do not execute T5 product work.

Suggested implementation subjects:

```text
feature: implement T3.6-L1 knowledge records and views
feature: implement T3.6-L2 frozen context and guidance
feature: implement T3.6-L3 exploration and cross-attempt review
feature: implement T3.6-L4 hosted proof and evaluation
```

Each acceptance row needs observable assertions for its listed cases. Every refusal needs a valid control. Record the unit's requirement-to-test mapping and execution evidence in the PR and handoff; do not create another manually maintained acceptance registry.

### T3.6-L1 — Knowledge records and views

**Prerequisites:** applicable T3.5 acceptance evidence; the existing journal, evidence and portable-state contracts.

**Deliver:** versioned knowledge records, validated admission and deterministic views under §2.1, with applicability checks under §2.2.

**Implementation requirements:** reuse `evidence.ts`, `verification.ts` and `state.ts`; add `knowledge.ts`; retain original observations; preserve trust basis, negative-result scope, conflicts and historical records. Keep `AcceptedOutput` separate. Reject unsupported schema/controller versions without migrating runs.

**Acceptance:**

| ID | Observable result |
| --- | --- |
| L1-01 | A valid independently reviewed claim becomes supported. Fabricated, missing, uncommitted, mismatched or self-reviewed evidence cannot do so. |
| L1-02 | A verified counterexample and a useful fragment survive a failed candidate. An infrastructure failure cannot become a disproof; neither entry accepts the candidate. |
| L1-03 | Changed or unknown dependencies withhold current support. Revalidation restores it where justified. Conflicting claims are withheld without deleting history. |
| L1-04 | Rebuilding from committed records reproduces the view. Uncommitted, altered or incompatible records are refused; a compatible archive restores correctly. |

**Handoff:** record types, admission rules and fixtures used by L2–L4 and T4.

### T3.6-L2 — Frozen context and guidance

**Prerequisites:** accepted L1; existing packet construction, review schemas and evaluation identity.

**Deliver:** bounded knowledge inputs and reviewed guidance under §§2.2 and 2.5.

**Implementation requirements:** extend `Packet`, `buildPacket`, structured outputs and review purposes in `claude.ts`; reuse rubric ownership in `software-bootstrap.ts`. Record consumed versions and digests. Enforce authority outside generated context. A guidance proposer cannot provide its admission review.

**Acceptance:**

| ID | Observable result |
| --- | --- |
| L2-01 | The saved input manifest reproduces the dispatched context. Mid-attempt additions cannot change it. Changed consumed inputs renew affected evidence; unrelated journal appends do not. |
| L2-02 | Independently reviewed reminders from repeated causal failures can activate for a later attempt. Matching error text, one occurrence or unsupported advice cannot activate them. |
| L2-03 | Feedback/log instructions cannot weaken checks, change roles, expand authority or reset limits. A valid reminder can guide work while the original acceptance gate remains mandatory. |
| L2-04 | Context selection is bounded and reproducible. Omission cannot hide required findings or obligations. Stale or contradictory guidance is withheld and reported. |

**Handoff:** packet and guidance fixtures, identity/invalidation evidence and traceable operator fields.

### T3.6-L3 — Exploration and cross-attempt review

**Prerequisites:** accepted L2; H2 role settings and H3 scheduling, reservations and correction records.

**Deliver:** the bounded flow in §§2.3–2.4 through the existing `runner.ts`, provider and verification paths.

**Implementation requirements:** add invocation purposes and durable phase records rather than new permanent roles or a scheduler. Reuse `pull-requests.ts` records. Preserve one active candidate, independent diagnostic contexts, required cross-attempt challenge and the existing acceptance decision.

**Acceptance:**

| ID | Observable result |
| --- | --- |
| L3-01 | Valid triggers schedule two isolated diagnostic sessions on the same snapshot. Each is denied the other's early output and candidate writes; normal read-only inspection succeeds. |
| L3-02 | An authorised diagnostic check runs through containment and records observations. Prohibited commands/effects are refused. Proposal selection cannot grant acceptance. |
| L3-03 | Cross-attempt review detects a seeded shared assumption or symptom-only fix that ordinary review missed. Agreement, missing challenge and stale challenge cannot advance; a corrected control can. |
| L3-04 | All added calls reserve and consume the same run budget. Limits and at-most-one-round scheduling hold. Interruption resumes committed phases without replay and retains unresolved allowance. |

**Handoff:** integrated scheduling and correction fixtures for hosted proof and T4 challenges.

### T3.6-L4 — Hosted proof and evaluation

**Prerequisites:** accepted L1–L3; authorised GitHub Actions, Docker and provider access for the proofs that require them.

**Deliver:** hosted recovery evidence, the comparison in §4, updated harness README and validated template settings. Update workflow plumbing only where existing paths cannot carry the new state or summaries.

**Implementation requirements:** run the full extension on hosted runners. Retain initial publication and two PR correction rounds in one run. Include failure, useful knowledge, later reuse, guidance and cross-attempt challenge. Interrupt around durable knowledge/admission, guidance activation and exploration dispatch/result recording. Use fixture effects.

**Acceptance:**

| ID | Observable result |
| --- | --- |
| L4-01 | Separate hosted jobs restore exact knowledge, manifests, guidance, phase results and budgets. Loss around each new durable boundary causes neither duplicate completed work nor unsupported support/acceptance. |
| L4-02 | Initial publication and two correction rounds retain one run and one active candidate. Current evidence is renewed where needed; receipts and unaffected history persist. Summaries match saved state, including explicit unavailable fields. |
| L4-03 | The pinned comparison protocol produces traceable per-task quality, repeated-failure, cost and time results. The report distinguishes improvement, regression and inconclusive evidence. |

**Handoff:** exact final harness revision, unit review records, GitHub job/attempt IDs, archive identities and comparison report for T4-A. Missing hosted or live proof remains a blocker for the corresponding acceptance.

## 4. Verification and benefit measurement

Run implementation verification in GitHub Actions on the recorded revision. Use the existing repository gate and focused harness checks. Do not add duplicate executions solely to produce another green result. Before a unit is accepted, record coverage from:

```bash
pnpm --filter @pactwright/checkpoint-harness test
pnpm contracts:check
pnpm verify --force
git diff --check
```

Run existing Docker integration where containment or contained commands change. Run live-provider proof for new invocation purposes and schemas. Prove fresh-runner recovery with separate hosted jobs and retained archives. Mocks and local process restarts cannot establish those facts.

Before collecting benefit results, pin a comparison protocol: task fixtures, starting revisions, model/effort, skills, toolchain, total budgets, repeat count, scoring rules and permitted cost/time regressions. Use repeated paired runs. Keep tuning cases separate from held-out cases. Each run has its own archive; knowledge must not cross between comparison runs.

Compare the current baseline with the extension. Also compare the new controller with learning disabled to distinguish learning effects from unrelated controller changes. Include ordinary delivery, repeated defects, misleading feedback, stale knowledge and recovery. Charge all added calls to the same total allowance. Retain failures, pauses and exhausted budgets in the results.

Report valid accepted outcomes, seeded false acceptances, repeated failed approaches, provider usage/cost and elapsed time per task. Report unknown provider costs as unknown. Explain variability and the limits of the sample; a bounded fixture study cannot establish a general performance gain.

Safety acceptance requires zero seeded false acceptances and all required valid controls to progress. A benefit claim also requires improved valid outcomes or reduced repeated work, no observed valid-outcome regression on held-out cases, and cost/time within the limits fixed before execution. Otherwise report regression or inconclusive benefit. Do not enable learning in the T5 template by default without both T4 PASS and supported benefit; a changed rollout decision requires an explicit amendment.

## 5. T4 obligations and exit

The T4 plan owns the consolidated adversarial case list. Its T3.6 table maps L1–L4 to fault/control challenges. T4-A must trace the final acceptance and next-step dispatch, not just record serialisation. T4-C independently checks adequacy at the final revision.

T3.6 is complete when L1–L4 have current reviewed evidence on one harness revision, required hosted/provider proof exists, and the benefit report states its measured result. Completion of the implementation does not imply a benefit or permit T5 adoption.

Unimplemented L requirements block T4 and return to T3.6. Defects or missing proof in implemented behaviour use the existing T4-B correction path. Rerun affected proof after corrections. T5 requires T4 PASS for the resulting harness revision; historical H1–H3 acceptance cannot waive the extension's obligations.

**Checkpoint 1 Task 3.6 — Evidence-Backed Learning, Version 1**
