# Checkpoint 1 Task 3 — Harness and Software Run Model

**Date:** 26 September 2026  
**Branch analysed:** `refactor/pactwright-v2`  
**Reference:** Spec 00 v5, Checkpoint 1 v28  
**Status:** Research direction for T3; no runtime implementation decision is established by this log.

## 1. Purpose

Task 3 should build a small TypeScript execution controller for Checkpoint 1. The controller executes the contracts already defined by Spec 00; it does not introduce another planning format or canonical lifecycle.

The target flow is:

```text
Checkpoint contracts + canonical sources
                    │
                    ▼
            TypeScript harness
       scheduling, evidence, acceptance,
          permissions and recovery
                    │
                    ▼
         software-bootstrap run model
       production/review roles, skills,
        software verification policy
                    │
                    ▼
           Claude Code adapter
       coding tools and model sessions
```

Canonical specifications remain authoritative. Checkpoint contracts allocate requirements, outputs and acceptance criteria. The harness decides progression from evidence. Agents produce and review candidates but do not decide acceptance.

## 2. Existing foundations to reuse

Do not create a second contract parser or plan format.

Reuse:

- `docs/checkpoints/contract.schema.json` for format 2 validation.
- `docs/checkpoints/01-self-hosted-delivery/checkpoint.yml` for checkpoint settings, source aliases and shared requirements.
- `docs/checkpoints/01-self-hosted-delivery/CP01-Sxx.yml` for step dependencies, outputs, requirements and acceptance bindings.
- `scripts/checkpoint-contracts.ts` for schema, source-reference, identity and coverage validation.
- `crosswalk.yml` only as conversion evidence, not runtime orchestration state.

The current repository already uses TypeScript, Ajv, `js-yaml`, `tsx`, strict compiler settings and Node's test runner. T3 should extend those choices rather than add another workflow framework.

## 3. Design principles

Apply the repository skills selectively:

- `harness-engineering`: protected/evaluable surfaces, durable state, recovery and approval boundaries.
- `karpathy-guidelines`: minimum code, explicit assumptions and verifiable outcomes.
- `typescript-magician`: strict boundary types and runtime-safe narrowing.
- `tool-design`: small, unambiguous agent interfaces and actionable failures.
- `evaluation`: outcome-based verification and complete result accounting.
- `multi-agent-patterns`: context separation between producer and reviewer, not agent-role proliferation.

The harness should stay deterministic where possible. LLM judgement belongs only where the contract declares review or approval semantics that cannot be reduced to deterministic checks.

## 4. Responsibilities

### 4.1 Harness

The harness owns:

- contract loading and validation;
- prerequisite and input resolution;
- step eligibility;
- run-target resolution;
- protected/editable surface enforcement;
- candidate identity;
- verifier dispatch;
- evidence recording;
- review dispatch;
- correction routing;
- acceptance decisions;
- pause/resume and recovery.

A producer saying that work is finished has no acceptance authority.

### 4.2 `software-bootstrap` run model

The run model owns the software-development method used by the harness:

- producer role;
- independent reviewer role;
- relevant skill selection;
- software verifier bindings;
- correction policy;
- execution limits;
- approval boundaries for external effects.

Keep this as TypeScript configuration/functions for T3. Do not introduce a generic workflow DSL before a second real run model requires one.

### 4.3 Claude adapter

Use one real Claude integration behind a narrow adapter. Prefer the TypeScript Agent SDK if it satisfies the required local-session, tool, permission and structured-result needs. A `claude -p` subprocess remains a fallback if CLI compatibility is materially simpler.

Do not implement both in T3.

The adapter owns provider interaction only. It must not become a new Pactwright lifecycle capability. Checkpoint 1 still keeps AI provider invocation outside `pactwright lifecycle run`.

## 5. Execution loop

For one eligible step:

```text
prepare
  ↓
produce candidate
  ↓
capture exact candidate identity
  ↓
run deterministic verification
  ↓
independent review
  ↓
all obligations satisfied?
  ├─ no → correct → verify again → review again
  └─ yes → record acceptance → enable dependants
```

Deterministic failures should return directly to correction. Do not spend reviewer work on a candidate that already fails required automated checks.

A review rejection must identify the failed requirement, criterion or test-adequacy issue. The reviewer must not modify the candidate and then approve its own repair.

## 6. Acceptance accounting

Expand each contract into the complete required result set:

```text
checkpoint/step
× acceptance criterion
× declared case, where present
× required verification binding
```

Acceptance compares the expected set with actual evidence. It must not accept merely because every result that happened to be returned is green.

Suggested TypeScript boundary:

```ts
type VerificationTarget = {
  owner: string;
  criterion: string;
  caseId: string | null;
  method: "automated" | "review" | "approval";
  binding: string;
};

type CheckResult =
  | {
      outcome: "passed";
      target: VerificationTarget;
      evidence: readonly [string, ...string[]];
    }
  | {
      outcome: "failed" | "unavailable";
      target: VerificationTarget;
      reason: string;
    };
```

Runtime validation must reject malformed or unexpected results and evidence for another candidate or attempt.

Inherited checkpoint requirements are part of the expected set. A step-local verifier cannot replace the shared `CP01/R01` repository verification gate.

## 7. Verifier lifecycle

Verifier IDs in checkpoint contracts are bindings, not proof that verifier implementations already exist.

T3 should support verifiers delivered alongside capabilities without allowing self-approval:

- canonical specifications, checkpoint contracts, acceptance decisions and approved review policy are protected;
- implementation code and proposed tests/verifiers are editable within the assigned scope;
- a new or changed verifier receives independent adequacy review against the requirement it claims to prove;
- the reviewed verifier revision is pinned for the candidate evaluation that uses it;
- changing the verifier invalidates that adequacy result.

T4 will deliberately challenge these controls with weak verifiers and faulty candidates. T3 still needs normal tests for the control boundaries it implements.

## 8. Isolation and evidence

Use four surface classes:

| Surface | T3 treatment |
|---|---|
| Approved contracts, canonical sources, acceptance policy | protected/read-only to candidate execution |
| Candidate implementation workspace | writable within resolved scope |
| Evidence journal/store | controller-owned |
| Merge, publish, credentials and destructive/external effects | explicit authority boundary |

A Git worktree is useful isolation but is not itself a security boundary. Candidate execution must not be able to rewrite controller-owned rules or evidence through another path.

Use a small append-only JSONL journal plus immutable evidence files initially. Do not add a database or another graph.

Record at least:

- contract/source revisions;
- resolved configuration and skill identities;
- candidate identity;
- producer/reviewer attempt identities;
- verifier results;
- review findings;
- corrections;
- approvals and external-effect receipts;
- acceptance or pause events.

Progress is derived from evidence. Agents do not write `completed: true` state.

## 9. Resume and failure semantics

On resume, verify that definitions, inputs, candidate and verifier revisions still match recorded evidence. Changed inputs invalidate affected evidence rather than inheriting earlier acceptance silently.

Missing authority, unavailable external resources or exhausted execution limits pause the step as unaccepted and resumable.

Ordinary implementation failures stay inside the correction loop.

For external effects, record intended action before execution and receipt after execution. If interrupted between those events, reconcile remote state before retrying.

## 10. Initial TypeScript layout

Keep the bootstrap harness as repository tooling:

```text
scripts/checkpoint-harness/
  cli.ts
  contracts.ts
  runner.ts
  software-bootstrap.ts
  claude.ts
  verification.ts
  workspace.ts
  evidence.ts

tests/
  checkpoint-harness-*.test.ts
```

Extract reusable contract-validation functions from `scripts/checkpoint-contracts.ts`; do not duplicate its parser and validation logic.

Do not add a graph library, event bus, dependency-injection framework, workflow engine or separate service for T3.

## 11. T3 implementation units

### T3-A — Contract loading and execution preparation

Implement shared contract loading, eligibility, prerequisite/input resolution, inherited acceptance and expansion of the complete verification target set.

**Proof:** a fixture generates the exact expected execution/verification plan; invalid references or configuration cannot dispatch an agent.

### T3-B — Candidate isolation and evidence journal

Implement controller/candidate separation, candidate identity, durable append-only run records and state reconstruction.

**Proof:** restart reconstructs the same state; candidate work cannot overwrite protected definitions or controller evidence.

### T3-C — Producer adapter and skill configuration

Implement one Claude adapter with bounded sessions, selected project skills, scoped tools and structured outcome reporting.

**Proof:** a producer modifies a fixture through generated contract context; completion, failure, denial and limit exhaustion remain distinguishable.

### T3-D — Verification and independent review

Implement verifier dispatch, complete case accounting, verifier-adequacy checks and candidate-bound independent review.

**Proof:** missing results cannot pass; a reviewer can reject a test-green candidate with requirement-specific findings.

### T3-E — Correction, approvals and resume

Implement targeted correction routing, retained failed-attempt evidence, approval boundaries and interrupted-effect reconciliation.

**Proof:** corrected candidates can pass; resumed runs preserve findings and do not blindly repeat an external effect.

### T3-F — End-to-end bootstrap demonstration

Run a small multi-step TypeScript fixture through production, verification, review and correction.

Use a small configuration-validation library followed by a CLI that consumes it. Exercise dependencies, accepted output reuse, public invocation and correction without implementing Pactwright graph semantics as the fixture.

Use deterministic producer/reviewer doubles for harness failure tests, then prove the same integration path with real Claude sessions. Keep scripted-controller proof and live-provider proof distinct.

**Completion:** the fixture reaches acceptance without hand-written per-step prompts or manual progress edits.

## 12. Boundaries for T3

T3 does **not**:

- implement Checkpoint 1 product requirements;
- resolve Stage 4 or Stage 5 open questions;
- add a provider invoker to the Pactwright lifecycle runtime;
- create a second canonical Project Graph or lifecycle;
- design all later production-domain run models;
- require a generic provider abstraction;
- require hosted/background-agent infrastructure.

T3 produces the bootstrap executor. T4 attacks its acceptance controls. T5 then uses the proven harness to implement Checkpoint 1. T6–T8 use that execution evidence to design and adopt Pactwright-backed successor run models.

## 13. Recommended direction

Implement T3 as a **small TypeScript controller plus one `software-bootstrap` run model and one real Claude adapter**.

The controller owns progression and evidence. Claude owns production/review work within its assigned role. Checkpoint contracts remain the execution authority, and canonical specifications remain the semantic authority.
