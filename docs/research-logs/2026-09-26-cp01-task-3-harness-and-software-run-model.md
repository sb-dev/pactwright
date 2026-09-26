# Checkpoint 1 Task 3 — Harness and Software Run Model

**Version:** 3  
**Date:** 26 September 2026  
**Branch analysed:** `refactor/pactwright-v2`  
**Inspected revision:** `0b783170467395adf577ec64be9faea996995a00`  
**Authority:** Spec 00 v5 and Checkpoint 1 v28. This log records design proposals only.

## 1. Purpose and dependency boundary

Task 3 should build a small **TypeScript harness** that executes checkpoint contracts through:

```text
prepare → produce → verify → review → correct → accept
```

Canonical specifications define product meaning. Checkpoint contracts define requirements, outputs and acceptance criteria. The harness owns progression and evidence. Agents implement and review candidates but cannot accept their own work.

Spec 00 places T3 after T2. Stage 4 and 5 still have unresolved T2 questions, so this log can guide design and bounded fixture experiments but does not authorise bypassing that dependency. Full Checkpoint 1 execution in T5 requires completed T2 and accepted T3/T4.

Distinguish:

- **structurally valid contract** — schema and references pass;
- **requirement-ready contract** — semantics and prerequisites are resolved;
- **executable contract** — required verifier/reviewer bindings exist.

A missing binding never counts as acceptance.

## 2. Reuse the existing contract system

Do not create another plan, schema or acceptance registry.

Reuse:

- `contract.schema.json`;
- `checkpoint.yml`;
- `CP01-Sxx.yml`;
- `scripts/checkpoint-contracts.ts`;
- `crosswalk.yml` only as conversion evidence;
- the existing TypeScript/Ajv/`js-yaml`/Node test stack.

Extract reusable loading and validation helpers from `checkpoint-contracts.ts`; do not duplicate its parser.

## 3. Architecture

```text
Canonical specs + checkpoint contracts + run configuration
                         ↓
                 TypeScript harness
          schedule, isolate, verify, record
                         ↓
              software-bootstrap run model
          roles, skills, review, correction
                         ↓
                    Claude adapter
               inspect → edit → test
```

There are two loops:

- **Inner agent loop:** Claude inspects, edits and tests the assigned workspace.
- **Outer harness loop:** captures the candidate, runs verification, requests independent review and decides progression.

A successful agent response is not step acceptance.

| Component | Owns |
|---|---|
| Harness | scheduling, target resolution, evidence, acceptance, recovery |
| `software-bootstrap` | producer/reviewer policy, skills, software bindings, correction policy |
| Claude adapter | provider sessions, tools, limits, structured results |
| Run configuration | repository/branch, models, credentials, budgets, workspace |

Keep T3 as ordinary TypeScript functions. Do not add a workflow DSL, graph library, event bus, DI framework or service fleet.

## 4. Run configuration

Execution-specific values belong outside checkpoint contracts.

Proposed shape:

```yaml
repository:
  name: sb-dev/pactwright
  branch: EXPLICIT_BRANCH
  expected_head: FULL_SHA
checkpoint: docs/checkpoints/01-self-hosted-delivery/checkpoint.yml
selection:
  through: CP01-S03
roles:
  producer:
    adapter: claude-sdk
    model: EXPLICIT_MODEL
    skills: [karpathy-guidelines, typescript-magician]
  reviewer:
    adapter: claude-sdk
    model: EXPLICIT_MODEL
    skills: [code-review-and-quality, evaluation]
workspace:
  candidate_root: ISOLATED_WORKSPACE
  controller_root: PROTECTED_CONTROLLER_ROOT
permissions:
  policy: APPROVED_POLICY
credentials:
  provider: SECRET_REFERENCE
budgets:
  attempts: POSITIVE_INTEGER
  wall_time_seconds: POSITIVE_INTEGER
  provider_spend_limit: EXPLICIT_LIMIT
```

Before dispatch, resolve and pin:

- repository and exact base SHA;
- checkpoint and canonical source revisions;
- writable paths and tool/network policy;
- model and skill revisions;
- credential method;
- execution limits.

Secrets stay outside candidate files and logs. The candidate cannot switch repository, branch or acceptance definitions.

## 5. Scheduling, inputs and candidate identity

Derive scheduling from `requires`, `inputs`, `uses` and inherited checkpoint requirements.

Start serially:

```text
load accepted steps
→ find first eligible step
→ execute
→ record acceptance
→ recalculate eligibility
```

Parallel step execution is deferred.

An input such as `CP01-S02/core-record-model` resolves to an **accepted output instance**, not a filename or agent claim. Record:

- output ID;
- producing step;
- accepted candidate identity;
- artefact/reference digest;
- supporting evidence.

`uses` requires evidence that the accepted capability actually participated in execution.

The evaluated candidate identity must bind at least:

- source snapshot;
- contract and source revisions;
- accepted inputs;
- verifier/reviewer revisions;
- run configuration relevant to evaluation.

A correction creates a new candidate identity. Evidence from the previous candidate is stale unless the harness can prove its inputs are unchanged.

Prefer a sealed committed source snapshot for evaluation. Reject undeclared untracked inputs and rebuild in a clean verification workspace.

## 6. Acceptance and verification

Expand every contract into the complete required target set:

```text
owner × criterion × case × verification binding
```

Example:

```text
CP01-S03/AC05/self-loop/automated/edges.supersession-cycles
CP01-S03/AC05/two-record-cycle/automated/edges.supersession-cycles
CP01-S03/AC05/longer-cycle/automated/edges.supersession-cycles
```

Do not accept one aggregate `edges.supersession-cycles = passed` result when three cases are required.

Suggested boundary:

```ts
type VerificationTarget = {
  owner: string;
  criterion: string;
  caseId: string | null;
  method: "automated" | "review" | "approval";
  binding: string;
};

type CheckResult =
  | { outcome: "passed"; target: VerificationTarget; evidence: readonly [string, ...string[]] }
  | { outcome: "failed" | "unavailable" | "invalid" | "stale"; target: VerificationTarget; reason: string };
```

Acceptance requires the expected target set to equal the valid passing evidence set. Missing, skipped, invalid, stale or unexpected results cannot satisfy it.

Verification methods have different authority:

- **automated** — executable assertions; reviewer opinion cannot override failure;
- **review** — evidence-based judgement against a defined rubric;
- **approval** — authority for a decision/effect, not technical proof.

Common independent review remains mandatory through the run model even when a criterion lists only automated bindings.

### Verifier lifecycle

A verifier ID does not prove its implementation exists.

A new or changed verifier:

1. is proposed with the implementation;
2. receives independent adequacy review against the requirement;
3. is pinned for the evaluation using it;
4. invalidates that adequacy evidence if later changed.

The producer cannot weaken its acceptance test and use the weaker test for self-approval.

## 7. Independent review and correction

The reviewer starts with a fresh context and receives the sealed candidate, requirements, tests and evidence — not the producer conversation.

Review covers:

- requirement compliance;
- test/verifier adequacy;
- correctness and integration;
- scope;
- architecture and simplicity;
- security and relevant performance.

Blocking findings identify the requirement/criterion, code or evidence location, observed defect and required correction. Optional style preferences do not block acceptance.

The reviewer cannot edit the candidate and approve the repair in the same review. A correction creates a new candidate and requires applicable verification/review again.

Using the same model in a fresh session provides context separation, not model independence. A second model/provider is optional and should be justified by measured review quality.

Failure routing:

| Failure | Route |
|---|---|
| Implementation/output defect | producer correction |
| Weak/missing verifier | repair + independent verifier review |
| Malformed provider result | bounded retry, then pause |
| Conflicting review | evidence-based re-evaluation, then authority if unresolved |
| Contradictory requirement | pause for specification owner |
| Missing approval/credential | pause |
| Environment failure | bounded retry, then resumable pause |
| Budget exhausted | stop unaccepted |

The harness must never ask the coding agent to resolve canonical ambiguity by invention.

## 8. Skills, configuration and isolation

Use repository skills selectively:

| Activity | Skills |
|---|---|
| Harness design | `harness-engineering`, `project-development`, `tool-design`, `multi-agent-patterns` |
| Producer | `karpathy-guidelines`, `typescript-magician`, task-specific implementation/testing skills |
| Reviewer | `code-review-and-quality`, `evaluation`, relevant architecture/security skills |
| Judge calibration | `advanced-evaluation` |

Record skills as distinct states: **available → selected → supplied → observed invoked**. Store role, path/version/hash and observable loading evidence. Installation alone is not proof of use.

Runs should not implicitly inherit personal `~/.claude` settings, hooks, MCP servers or skills. Record the effective project settings and tool/plugin policy.

Protect four surfaces:

| Surface | Rule |
|---|---|
| canonical specs, contracts, schema, run model, review policy, approved verifiers | read-only/protected |
| candidate source and proposed tests | scoped writable |
| journal/evidence | controller-owned |
| credentials, merge, publish, destructive effects | explicit authority boundary |

A Git worktree is useful but not a security boundary. Candidate shell commands must not be able to edit controller-owned files through another path. Test path traversal, symlinks, child processes, hooks and network/effect escape routes.

Tool allowlists, permission callbacks and filesystem/network containment are separate controls; prove the selected Claude mode's effective restrictions.

## 9. Evidence, resume and external effects

Use a controller-owned append-only JSONL journal plus immutable evidence files initially. No database or second graph is needed.

Record:

- definitions and input revisions;
- run configuration;
- producer/reviewer attempts;
- candidate identities;
- verifier results;
- review findings;
- corrections;
- approvals;
- external-effect intent/receipts;
- acceptance or pause events.

Progress is derived from evidence. Agents never write `completed: true`.

Resume reconstructs state from the journal, fences orphan workers and checks whether candidate, definitions, inputs and verifier/reviewer revisions still match. Stale evidence is rerun.

For an external effect:

```text
record intent + approval
→ execute
→ record receipt
```

If interrupted after intent but before receipt, inspect external state before retrying. Do not assume generic exactly-once behaviour.

## 10. Claude integration

Evaluate only two options:

| Option | Position |
|---|---|
| TypeScript Claude Agent SDK | preferred candidate |
| TypeScript wrapper around `claude -p` | fallback if materially simpler |

Do not implement both.

Before choosing, run a bounded spike proving:

- producer and fresh reviewer sessions;
- controlled skills/settings;
- structured output and malformed-output handling;
- tool denial;
- cancellation/timeout;
- protected-file refusal;
- supported authentication and budget visibility.

Interactive Claude Code authentication and programmatic execution must not be assumed equivalent. The run configuration records the supported credential source.

The external bootstrap adapter must not become a provider invoker inside `pactwright lifecycle run`; Checkpoint 1 keeps that capability outside the runtime.

## 11. TypeScript layout and testing

Keep T3 as repository tooling:

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

This is a responsibility map, not a requirement for eight wrappers.

Use strict TypeScript and runtime validation for untrusted inputs.

Testing layers:

| Layer | Coverage |
|---|---|
| Unit | scheduling, target expansion, output resolution, state transitions, invalidation, budgets |
| Integration | workspace/process isolation, verifier execution, correction, approvals, journal recovery |
| Deterministic agents | success, no-op, failure, malformed output, denial, timeout, review rejection, crash |
| Live Claude | real producer and reviewer through the same interfaces |

Deterministic adapters prove harness behaviour. Live Claude proves provider integration. Keep those results separate.

## 12. T3 implementation units

| Unit | Work | Required proof |
|---|---|---|
| **T3-A** | contract loading, run admission, scheduling, accepted inputs, complete target expansion | exact fixture plan; invalid/ineligible work cannot dispatch |
| **T3-B** | isolation, candidate identity, append-only evidence and resume | protected-file refusal; restart reconstructs state |
| **T3-C** | one Claude adapter, authentication, skills and limits | live fixture edit; malformed/denied/timed-out results remain distinct |
| **T3-D** | verifier dispatch, complete result reconciliation, mandatory independent review | missing/stale results cannot pass; weak verifier or semantic defect is rejected |
| **T3-E** | correction, approval, pause/resume and external-effect reconciliation | new candidate after correction; stale evidence invalidated; no blind effect retry |
| **T3-F** | end-to-end multi-step TypeScript fixture | dependency/output reuse plus produce–verify–review–correct with deterministic and live adapters |

Use a small configuration-validation library followed by a CLI as the fixture. Seed a known fault so correction is exercised deliberately.

T3 is complete only when combined evidence proves:

- controller state survives restart;
- producer cannot grant acceptance;
- missing verifiers/cases cannot pass;
- reviewer rejection returns to correction;
- changed candidate/input invalidates stale evidence;
- effective model/skills/configuration are recorded;
- the real Claude adapter follows the same tested loop.

A happy-path run alone is insufficient.

## 13. Non-goals and open decisions

T3 does not:

- implement Checkpoint 1 product requirements;
- resolve Stage 4/5 semantics;
- create another Project Graph/lifecycle;
- add a provider invoker to `pactwright lifecycle run`;
- design all later production-domain run models;
- require multiple providers or hosted-agent infrastructure.

Open decisions to settle before the relevant unit:

1. Agent SDK versus `claude -p`, including supported authentication.
2. Concrete local isolation mechanism.
3. Candidate/evaluation identity representation.
4. Verifier adequacy-review representation.
5. Reviewer rubric and disagreement handling.

T4 attacks these acceptance controls. T5 uses the proven harness to implement Checkpoint 1. T6–T9 use CP1 evidence to design and adopt Pactwright-backed successor run models.

## 14. Sources and revision record

Repository guidance used: Spec 00, Checkpoint 1, `checkpoint.yml`, `contract.schema.json`, `checkpoint-contracts.ts`, `package.json`, `tsconfig.json` and the relevant skills under `.claude/skills`.

Version 3 tightens Version 2 while retaining its implementation-critical decisions: dependency boundary, two-loop architecture, run configuration, scheduling, accepted outputs, candidate identity, complete acceptance accounting, verifier/reviewer independence, correction routing, skill reproducibility, isolation, durable evidence, provider spike, testing and T3-A–F proof criteria.
