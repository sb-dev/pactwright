# Checkpoint 1 Task 3 — Harness and Software Run Model

**Version:** 2

**Date:** 26 September 2026

**Branch analysed:** `refactor/pactwright-v2`

**Inspected revision:** `0ef869c09c04cb80054182889612596ada349e7e`

**Authority:** Spec 00 v5, especially §§1–6; Checkpoint 1 v28. This log records design proposals, not amendments to those authorities or task acceptance.

## 1. Purpose and dependency boundary

Build a small TypeScript controller that executes checkpoint requirements through production, verification, independent review and correction. Agents perform work; the controller alone records acceptance from current evidence. Prompts are generated invocation context, never the source of requirements or progression rules.

The inspected [checkpoint](../checkpoints/01-self-hosted-delivery.md#3-execution-contract) reports Stage 1–3 requirement-ready and Stage 4/5 questions pending. That is the checkpoint's recorded assessment, not a fresh acceptance review performed for this log.

[Spec 00 §5](../specs/00-checkpoint-step-contract-and-delivery-tasks.md#5-delivery-tasks) places T3 after T2. Research and bounded design experiments can inform T3 while remaining questions are resolved. This log does not silently authorise starting the dependent implementation task early. Any proposal to build isolated fixture-only tooling in parallel needs an explicit dependency decision. Full CP1 execution in T5 still requires completed T2 and accepted T3/T4 results.

Distinguish three conditions: structurally valid contracts, requirement-ready contracts, and executable bindings. A schema pass proves only the first. Unknown semantics cannot be filled in by the producer. Missing verifiers can be implemented with their capability, but cannot count as passing evidence.

## 2. Existing foundations and authority

Reuse the existing structure rather than inventing another plan or acceptance registry:

| Repository input | Use in T3 |
| --- | --- |
| [Spec 00](../specs/00-checkpoint-step-contract-and-delivery-tasks.md) | Contract format, ownership, harness rules and task boundaries. |
| [Checkpoint 1](../checkpoints/01-self-hosted-delivery.md) | Stage/Step organisation, scope and integrated exit obligations. |
| [checkpoint.yml](../checkpoints/01-self-hosted-delivery/checkpoint.yml) | Format 2, run-model selection, sources and inherited requirements. |
| [contract.schema.json](../checkpoints/contract.schema.json) | Existing structural schema; do not fork it. |
| [checkpoint-contracts.ts](../../scripts/checkpoint-contracts.ts) | Extract and reuse loading, identity, citation and coverage checks. |
| [crosswalk.yml](../checkpoints/01-self-hosted-delivery/crosswalk.yml) | Historical conversion evidence; not scheduling or progress state. |
| [package.json](../../package.json), [tsconfig.json](../../tsconfig.json) | Existing TypeScript, Ajv, `js-yaml`, `tsx`, Node tests and strict compiler configuration. |

Source aliases resolve relative to `checkpoint.yml`. Preserve the exact requirement text and source references in generated invocation context. Pin the resolved files, including transitive normative references needed for the assignment. Do not paraphrase canonical clauses into a new authority.

Reuse the checker's conversion validation as appropriate, but keep it distinct from execution admission. Its historical-source skip options must not imply that missing execution authority is acceptable. The harness requires actual contract files and resolvable prerequisites; a Markdown heading alone cannot supply executable work.

## 3. Architecture and the two loops

```text
Canonical sources + checkpoint contracts + validated run configuration
                              ↓
                    TypeScript harness
             schedule, isolate, verify, record, decide
                              ↓
                 software-bootstrap run model
               producer/reviewer/skills/bindings
                              ↓
                      Claude adapter
                 inspect → edit → test → report
```

The **inner agent loop** explores and changes the assigned workspace. The **outer harness loop** captures its candidate, verifies it, requests independent review and decides progression. A successful inner-loop response cannot accept an outer-loop step.

| Component | Owns | Does not own |
| --- | --- | --- |
| Harness | Scheduling, target resolution, enforcement, evidence, acceptance, recovery. | Product meaning or discretionary approval of its own changes. |
| `software-bootstrap` | Software production policy, role/skill selection, bindings, review rubric and correction policy. | A second Pactwright lifecycle or Project Graph. |
| Claude adapter | Provider sessions, controlled tools, structured results and cancellation. | Requirement changes, acceptance or release authority. |
| Run configuration | Concrete repository, branch, credentials, budgets and environment. | A duplicate step plan or editable acceptance criteria. |

Use ordinary TypeScript functions and a small discriminated state model. Start with one producer at a time and a fresh reviewer. Do not add a workflow language, event bus, graph library, service fleet or general provider framework. The harness still enforces tool/effect boundaries during inner-loop execution; candidate evaluation alone cannot undo an unauthorised external action.

## 4. Run configuration and admission

The following is a proposed configuration shape, not an existing CLI or a new checkpoint schema. Capitalised values are mandatory values to resolve, not defaults that an agent may guess.

```yaml
repository:
  name: sb-dev/pactwright
  branch: EXPLICIT_RUN_BRANCH
  expected_head: FULL_COMMIT_SHA
checkpoint: docs/checkpoints/01-self-hosted-delivery/checkpoint.yml
selection:
  through: CP01-S03
run_model: software-bootstrap
roles:
  producer:
    adapter: claude-sdk
    model: EXPLICIT_MODEL_ID
    skills: [karpathy-guidelines, typescript-magician]
  reviewer:
    adapter: claude-sdk
    model: EXPLICIT_MODEL_ID
    skills: [code-review-and-quality, evaluation]
workspace:
  candidate_root: ISOLATED_WORKSPACE
  controller_root: PROTECTED_CONTROLLER_DIRECTORY
permissions:
  policy: APPROVED_POLICY_REFERENCE
  publication: explicit-approval
credentials:
  provider: SECRET_REFERENCE
budgets:
  attempts: POSITIVE_INTEGER
  wall_time_seconds: POSITIVE_INTEGER
  provider_spend_limit: EXPLICIT_LIMIT
```

Resolve and validate the repository identity, exact branch/base, selected checkpoint, approved definition revision, writable paths, tool/network policy, role settings and execution limits before dispatch. Resolve skill paths/hashes and supported provider authentication too. Validate that the branch contains the intended base and no unrelated workspace changes. The candidate cannot select a different repository or branch to make a test pass.

Secrets remain outside committed configuration, candidate environment and logs wherever possible. Record credential method/reference and redacted policy, not secret values. An API key available to the session driver must not automatically be available to candidate shell commands.

Store the resolved configuration as evidence. Reuse a stable policy/profile reference for repeated settings. Do not copy requirements, dependencies or acceptance criteria into it. A selected step is a run filter, not permission to omit its prerequisites or claim checkpoint completion.

## 5. Contract resolution, scheduling and accepted outputs

Derive the execution plan from `requires`, `inputs`, `uses` and inherited obligations. Do not let an LLM schedule work from summaries.

The initial scheduler is serial: select the earliest eligible step in checkpoint order, execute it, record acceptance and recalculate eligibility. Validate dependency references and reject impossible schedules before execution. If nothing is eligible, report the actual unmet prerequisites rather than choosing an arbitrary step.

Resolve an input such as `CP01-S02/core-record-model` to an **accepted output instance**. Its record identifies the output ID, producer step, accepted candidate, artefact location/digest and acceptance evidence. A matching filename or a previous agent's claim is insufficient. Refuse missing or stale input instances.

`uses` requires evidence that the named accepted capability participated in the run. Installation alone is not use. Missing earlier capability blocks the dependent work unless the owning contract is amended. The controller stores these dependency records; it does not create another manually maintained graph.

Re-evaluate affected accepted obligations after changes. Start conservatively: rerun verification for previously accepted steps whose results might be affected, plus inherited constraints. Optimise reuse only after dependency tracking proves the relevant inputs unchanged. Final checkpoint acceptance checks the integrated candidate, not a collection of old per-step passes.

## 6. Production context and candidate capture

Generate one invocation packet per role/attempt from the approved sources. Include the step's exact requirements and criteria, inherited constraints, accepted inputs, allowed effects, selected skills and actionable failures from the previous attempt. Include relevant existing code references, not the entire prior conversation.

The producer can inspect, implement and run development checks within its scope. It can propose tests and verifier additions. It cannot modify the controller, canonical sources, checkpoint contracts, review rubric or its acceptance records. If the available context is insufficient, it requests the missing input; it does not invent a requirement.

The producer returns a candidate proposal, changed-file inventory, verifier proposals and any blockers. These are untrusted claims. The harness stops or fences all producer processes, captures actual workspace content and checks its permitted scope before evaluation.

Prefer a sealed, committed source snapshot for evaluation. Work in progress may be dirty during production. Before verification, include every allowed required source file in the snapshot; reject undeclared untracked input and exclude stale build output. Rebuild in a clean verifier workspace. Git commit/tree identity does not identify untracked inputs, toolchains or installed packages by itself.

## 7. Candidate identity and evidence identity

Keep source identity distinct from the evaluation identity. The controller creates both.

| Identity component | Required contents |
| --- | --- |
| Candidate | Repository, exact source commit/tree, retained/replaced boundary and any declared non-Git input digest. |
| Definitions | Checkpoint, step, canonical-source and schema revisions. |
| Inputs | Accepted output identities and immutable external input references. |
| Evaluation | Verifier code, binding map, review rubric, harness/run-model revision and resolved run configuration. |
| Environment | Node/package-manager versions, dependency lock, isolated execution image/profile and relevant environment inputs. |
| Role | Requested and actually resolved model identity, adapter version, session ID and selected/supplied/invoked skill evidence. |

A correction creates candidate B; candidate A's review cannot authorise B. A verifier or rubric change creates a different evaluation even if the source tree is unchanged. Missing provider metadata is recorded as unknown, not filled from a marketing name.

These are harness evidence identities. They must not redefine Pactwright's canonical repository revision or `project_graph_revision` protocol. An SDK conversation/session ID is also not a checkpoint acceptance identity.

## 8. Verification and complete result accounting

[Spec 00 §§3–4](../specs/00-checkpoint-step-contract-and-delivery-tasks.md#4-harness-rules) requires every criterion/case and every listed binding, inherited constraints, required outputs and common independent review.

| Method | Establishes | Cannot replace |
| --- | --- | --- |
| `automated` | Executed assertions and required observations against the identified candidate. | Missing cases, semantic test-adequacy review or effect authority. |
| `review` | Evidence-based assessment against the approved rubric. | A failed automated check. |
| `approval` | The configured authority's decision for the exact output/effect. | Technical correctness or a required review. |

Expand the expected result set before evaluating the returned results:

```text
owner × criterion × case (or one explicit no-case target) × method/binding
```

For the three cases in `CP01-S03/AC05`, the `edges.supersession-cycles` binding needs these three distinct results:

```text
CP01-S03/AC05/self-loop/automated/edges.supersession-cycles
CP01-S03/AC05/two-record-cycle/automated/edges.supersession-cycles
CP01-S03/AC05/longer-cycle/automated/edges.supersession-cycles
```

The [current Step 3 contract](../checkpoints/01-self-hosted-delivery/CP01-S03.yml) is the authority for this example. A binding may batch execution, but must return separate observations for each expected target. One suite-level pass is insufficient.

A proposed TypeScript boundary is:

```ts
type VerificationTarget = Readonly<{
  owner: string;
  criterion: string;
  caseId: string | null;
  method: "automated" | "review" | "approval";
  binding: string;
}>;

type CheckResult =
  | Readonly<{
      outcome: "passed";
      target: VerificationTarget;
      evidence: readonly [string, ...string[]];
    }>
  | Readonly<{
      outcome: "failed" | "unavailable";
      target: VerificationTarget;
      reason: string;
    }>;

type RecordedCheck = Readonly<{
  runId: string;
  attemptId: string;
  candidateId: string;
  evaluationId: string;
  result: CheckResult;
}>;
```

Validate external values from `unknown`; TypeScript types are not runtime validation. The controller wraps results with identities from its own invocation. Validate evidence existence, digest, origin and linkage, not just non-empty strings.

The reconciler classifies absent results as `missing`, malformed/conflicting results as `invalid`, and mismatched evidence as `stale`. A skipped or timed-out check does not pass. Reject unexpected targets and duplicate conflicting claims; never silently select the last favourable result. Missing required bindings keep the step unaccepted.

Acceptance requires a complete expected set, all required passes, verified outputs and common review. Empty results cannot pass by vacuous `every()` logic. Shared `CP01/R01` and `repo.verify` remain required for applicable repository changes. Applicability follows the approved condition; it is not a producer-selected skip.

## 9. Verifier lifecycle and test adequacy

An ID in `verify` is not an executable verifier. Resolve it through a versioned binding map owned by the run model. The map supplies method, executable or role, case protocol, required observations and evidence validation. It references checkpoint IDs rather than duplicating their requirements.

Verifiers may be delivered alongside a capability. Mark new/changed implementations as proposed. Independently review whether their assertions establish the declared outcomes, then pin the reviewed code for the evaluation. Early diagnostic runs are permitted but cannot satisfy acceptance before adequacy review. Rerun if the verifier changed or its evaluated identity cannot be established.

Adequacy review checks public entry points, positive controls, failure effects, case isolation and test doubles. A double must not perform product work that the implementation omits. Challenge important checks with deliberately faulty candidates; a test that always passes or rejects everything is insufficient. There is no claim that an LLM can prove arbitrary test correctness.

Approved verifier definitions, runner/report parsing and test-selection rules are protected. Candidate package scripts and tests remain untrusted executable code. Pin and review their effective dependency on the candidate so a modified script cannot turn `repo.verify` into a silent no-op. Candidate stdout is an observation, not authority to write the controller's final result record.

T4 supplies the broader adversarial campaign. T3 must already implement and unit/integration-test these controls. Normal testing is not postponed to T4.

## 10. Independent review and the software quality rubric

Common independent review is mandatory even when a step lists only automated bindings. The earlier log's statement limiting judgement to explicitly listed review methods was too narrow.

A reviewer starts in fresh context with read-only access to the sealed candidate, canonical clauses, tests, binding code, actual results and approved rubric. It does not inherit the producer conversation or accept the producer's summary as proof. It may request additional read-only evidence or sandboxed verification through the controller. It cannot repair the candidate during review.

Review covers requirement compliance, implementation correctness, positive/negative and integration coverage, test adequacy, scope, architecture, simplicity/readability, security and relevant performance. For graph work, check canonical ownership, duplicated truth, unnecessary generic abstractions and misuse of graph-wide rules for relation-specific constraints.

Each blocking finding identifies a requirement/criterion or inherited rule, exact code/test/evidence location, observed defect and required correction. Distinguish executed observations from code-traced concerns. Optional style preferences are not acceptance blockers. No aggregate quality score can conceal a failed mandatory requirement.

Use the repository's `code-review-and-quality` and `evaluation` skills. Apply `advanced-evaluation` when designing/calibrating the judge, not to replace deterministic acceptance. Test the reviewer against known acceptable and defective fixture candidates, including confident but unsupported producer claims. Record false acceptance/rejection and unresolved disagreement rather than asserting perfect reliability.

A separate session using the same model gives context separation, not model independence. Start there; assess a second model only if it improves measured review quality. Do not reroll reviews until a favourable answer appears. Route substantive disagreements through evidence-based re-evaluation and then the configured authority if unresolved.

## 11. Correction routing and limits

```text
prepare → produce → seal candidate → verify → review → decide
              ↑                         │        │
              └──── specific failures ──┴────────┘
```

| Condition | Route |
| --- | --- |
| Implementation or output failure | Producer correction, new candidate, fresh applicable verification/review. |
| Missing or inadequate test/verifier | Propose its repair, independently review adequacy, then evaluate. |
| Malformed provider response | Bounded protocol retry; pause if the adapter cannot obtain usable output. |
| Conflicting review findings | Evidence-based review clarification; authority if necessary, not majority voting. |
| Contradictory canonical requirements | Pause and request an owner decision/amendment. |
| Missing approval or credential | Pause for the configured authority/operator. |
| Temporary environment failure | Bounded retry under the same inputs, then resumable pause. |
| Exhausted attempts, time or spend | Stop execution unaccepted with reason and next action. |

Ordinary correctable failures continue automatically. Only accepted work enables dependants. Preserve failed attempts and their specific findings. Attempts do not reset their budgets on resume. A changed limit or scope is a recorded configuration amendment, not permission to reinterpret old results.

## 12. Skills and configuration isolation

Select relevant skills by role and pin their contents, including referenced files needed by that skill. Avoid installing a second process over the checkpoint contract.

| Activity | Skills to use selectively |
| --- | --- |
| Harness design | `harness-engineering`, `project-development`, `tool-design`, `multi-agent-patterns`. |
| TypeScript production | `karpathy-guidelines`, `typescript-magician`, task-relevant implementation/testing skills. |
| Candidate review | `code-review-and-quality`, `evaluation`, relevant architecture/security skills. |
| Reviewer calibration | `advanced-evaluation`; deterministic checks still decide mechanical obligations. |

Distinguish **available**, **selected**, **supplied**, and **observed invoked**. Record role, skill path/version/hash and observable loading/invocation evidence. Neither installation nor an agent's assertion proves invocation or behavioural influence. If invocation is not observable, report that limitation.

Skills are techniques, not authority. For example, generic advice to infer completion from file existence, parse missing results with permissive defaults or average quality dimensions must not override Spec 00's evidence rules.

Use approved project skill/settings snapshots and controlled configuration discovery. Do not inherit personal `~/.claude` settings, unreviewed hooks, MCP servers, commands or repository instructions from the candidate implicitly. Record the effective settings, allowed plugins/tools and environment policy. Validate the pinned adapter's actual discovery behaviour; the official [skills documentation](https://code.claude.com/docs/en/agent-sdk/skills) describes filesystem-based skills, but availability alone is not execution evidence.

## 13. Controller protection and execution isolation

| Surface | Enforcement direction |
| --- | --- |
| Canonical sources, contracts, schema, run model, review policy and approved verifiers | Protected snapshot outside candidate write access. |
| Candidate implementation and proposed tests | Scope-limited writable workspace. |
| Result journal and accepted evidence | Controller-owned; candidate submits observations only. |
| Merge, publish, credentials and destructive effects | Explicit approved operation through a restricted effect boundary. |

A worktree or a second process under the same unrestricted OS identity is not sufficient isolation. Choose and prove one supported arrangement before autonomous use. A candidate container with read-only control inputs, a private writable workspace and no host/container-control socket is a candidate approach, not an implemented guarantee.

Test path traversal, symlinks, child processes, test/build scripts, settings hooks and network escape routes. Use least-privilege credential access; candidate execution should have no general publication credential. Reviewers cannot gain producer write rights by invoking a tool indirectly. Untrusted repository text, logs and tool output cannot change authority.

Tool availability, allow/deny rules, callbacks and filesystem/network containment are separate controls. The official [permission documentation](https://code.claude.com/docs/en/agent-sdk/permissions) states that allow rules can resolve calls before `canUseTool`; `allowedTools` is not a universal restriction on other tools. Test the pinned mode and effective tool set. A callback alone is not the security boundary.

A change to protected rules requires separate authorised review and a new definition/evaluation identity. Preserve earlier instructions and evidence. The candidate cannot modify its own passing criteria or the harness that will accept it.

## 14. Durable evidence, resume and external effects

Start with a controller-owned append-only JSONL journal and immutable artefact files. Keep one controller writer per run. Treat snapshots and status views as derived caches, not another source of truth.

An event identifies sequence, run/attempt, action, relevant candidate/evaluation and evidence references. Store redacted tool outcomes, verification observations, reviews, decisions, costs where available and effect receipts. Mark unknown usage/cost honestly. Do not persist private reasoning as required evidence.

Write and validate evidence before committing its journal reference; record acceptance last. Define flush/atomic-publication behaviour. On restart, detect an interrupted trailing write and preserve it for diagnosis. Corruption of a committed record pauses the run; it must not silently reset progress or become an empty success.

Resume reconstructs controller state from the journal, not chat history or SDK session completion. Fence orphan workers and reconcile unfinished invocations. Recheck candidate, definitions, accepted inputs, verifier/rubric and environment identities. Rerun stale obligations. Reusing a provider conversation is optional and cannot transfer acceptance.

For an external action, record the intended operation and exact approval before execution, then the returned receipt. If interruption leaves the effect uncertain, read external state before retrying. Use service-supported idempotency only where available. Otherwise require reconciliation or operator action; do not claim generic exactly-once effects.

Publishing accepted code also checks the expected remote branch head. A concurrent change invalidates that publication base and triggers reconciliation/reverification, never force push. Local candidate acceptance, remote publication and final release approval are separate records.

## 15. Claude integration choice, authentication and spike

| Option | Assessment |
| --- | --- |
| TypeScript Claude Agent SDK | Preferred candidate for programmatic sessions, permissions, structured responses and cancellation. |
| TypeScript driver spawning `claude -p` | Fallback when the approved CLI setup is simpler; requires subprocess, timeout and result handling. |

The [official overview](https://code.claude.com/docs/en/agent-sdk/overview) describes the SDK as Claude Code's agent loop exposed to TypeScript/Python and also documents subprocess invocation. Neither mode gives the harness acceptance automatically. Structured output validates shape, not correctness.

Do not add a general workflow framework merely to orchestrate this small loop. Select one production adapter after a bounded spike; do not maintain two implementations in T3.

Authentication and billing are explicit decisions. Do not assume an interactive subscription funds programmatic runs, or assert that every local SDK use necessarily has identical authentication rules. The overview documents API-key setup and restrictions on third-party products offering claude.ai login without approval. Establish a supported method for this deployment, its credential source, account and budget. A live proof without usable credentials remains unexecuted.

The spike records exact SDK/CLI/model versions and demonstrates fresh producer/reviewer sessions, controlled skills/settings, structured output, malformed-result handling, denial, cancellation and protected-file refusal. Check session resume separately from controller resume. Record cost/latency where exposed. Use the CLI fallback only if the SDK fails a required capability or creates avoidable complexity. No spike is claimed as executed by this log.

External documentation was consulted on 26 September 2026. Recheck it against the pinned installed versions before implementation. Links are research evidence, not a substitute for version-specific execution tests.

## 16. TypeScript module boundaries

Keep T3 as repository tooling, outside the candidate runtime it will rebuild:

```text
scripts/checkpoint-harness/
  cli.ts                  command boundary and resolved configuration
  contracts.ts            reuse loader, resolve inputs, expand targets
  runner.ts               serial scheduling and deterministic transitions
  software-bootstrap.ts   roles, rubric and software binding policy
  claude.ts               one selected provider adapter
  verification.ts         dispatch and expected-result reconciliation
  workspace.ts            isolation, candidate capture and effect boundary
  evidence.ts             journal, artefacts, identity and resume

tests/
  checkpoint-harness-*.test.ts
```

This is a proposed responsibility map, not a requirement to create eight wrappers. Extract focused helpers only where needed. Reuse existing validation without pulling conversion-only logic into each attempt. Keep controller decisions pure where practical; inject process/filesystem/provider boundaries for deterministic tests.

Use strict TypeScript, `unknown` at untrusted inputs, validated narrowing and explicit outcome unions. Avoid casts that manufacture acceptance, optional fields that hide missing invariants and elaborate type-level frameworks. Use the existing Ajv, YAML and Node testing stack. Validate any new configuration/result schema; do not modify format 2 merely to hold execution state.

## 17. Testing and proof layers

| Layer | Required coverage |
| --- | --- |
| Unit | Target expansion, prerequisites, accepted-output resolution, state transitions, evidence matching, invalidation and budgets. |
| Integration | Real workspace/process boundaries, script execution, verifier bindings, correction, approvals, journal recovery and effect reconciliation with controlled external services. |
| Deterministic agents | Scripted success, no-op, failure, malformed result, denial, timeout, reviewer rejection and crash. |
| Live Claude | The selected real adapter runs producer and reviewer through the same orchestration interfaces on the bounded fixture. |

Scripted agents prove controller behaviour under forced conditions. They must not secretly implement production work for the real adapter. Live runs demonstrate integration, not universal correctness of the state machine. Record them separately. Run repository-required `pnpm verify` for implementation changes; report failures/skips rather than labelling unexecuted checks passed.

T3 supplies ordinary correctness and integration tests. T4 systematically tries to obtain false acceptance with altered definitions, weak tests, stale outputs, missing cases, no-op producers and repeated effects. Keep accepted controls as well as faulty candidates so a harness that rejects everything cannot pass.

## 18. T3-A through T3-F

These are proposed deliverables for T3, not progress records or authority to bypass T2. Each unit includes its own tests and review. Resolve an open decision before the unit that depends on it.

| Unit | Work | Completion evidence |
| --- | --- | --- |
| **T3-A — Contract loading and preparation** | Reuse format 2 validation. Resolve configuration, sources, prerequisites, accepted inputs and inherited/case-expanded targets. | Exact fixture plan; missing authority, unresolved references and ineligible selections cannot dispatch. |
| **T3-B — Isolation and durable records** | Implement one supported containment arrangement, candidate identities, journal and state reconstruction. | Real protected-file refusal; restart reconstructs records; concurrent/orphan workers cannot write accepted state. |
| **T3-C — Producer adapter and skills** | Resolve the adapter/authentication spike, then implement one real adapter with controlled settings and limits. | Fixture edits under generated contract context; observed skill/config identities; denial, malformed output and limit exhaustion distinct from completion. |
| **T3-D — Verification and review** | Bind checks, reconcile all expected results and apply common independent review plus verifier-adequacy review. | Missing/duplicate/stale results cannot pass; test-green but semantically wrong work receives a supported rejection. |
| **T3-E — Correction, approval and resume** | Route correctable failures; pause owner/environment blockers; reconcile approvals and interrupted effects. | New candidate after correction; stale review invalidated; resume preserves budget/evidence and avoids blind effect retry. |
| **T3-F — End-to-end demonstration** | Run a configuration-validation library and dependent CLI as a multi-step TypeScript fixture. | Accepted output reuse and the full produce–verify–review–correct loop without per-step hand-written prompts or progress edits, including a real-provider run. |

For T3-F, use a known faulty starting fixture or controlled injection to exercise correction; do not depend on Claude happening to make a mistake. The fixture should exercise public invocation and failure effects without reimplementing Pactwright's graph. A fault injection is labelled as such, not attributed to the model.

The T3 completion review checks the combined evidence: controller state survives restart; producers cannot grant acceptance; missing verifiers cannot pass; reviewer rejection returns to correction; candidate/input changes invalidate old evidence; effective skills/configuration are recorded; and the real adapter follows the same tested loop. A happy-path fixture alone does not establish T3 completion.

## 19. Decisions and progressive adoption

The following decisions remain proposals until supported and approved where necessary:

| Decision | Proposed direction | Required evidence before relying on it |
| --- | --- | --- |
| Provider integration/authentication | One SDK adapter; CLI fallback only if needed. | T3-C spike with the intended account and version. |
| Isolation | One local container/OS containment profile. | T3-B escape/refusal tests, including shell children and configuration discovery. |
| Candidate/evidence identity | Sealed committed sources plus an evaluation manifest. | Dirty/untracked input and stale-result tests. |
| New verifier approval | Independent adequacy review, pinned executable bindings. | A weak check cannot self-authorise; valid proposed checks can be accepted. |
| Reviewer rubric | Evidence-first, rule-specific findings; no universal quality score. | Known-good/bad fixture calibration and disagreement handling. |
| Self-hosting transition | Explicit capability-use obligations at the owning checkpoint. | Supported runtime use and migration of execution links without invented Evidence. |

T3 does not implement CP1 product requirements, resolve Stage 4/5 semantics or add a provider invoker to `pactwright lifecycle run`. Checkpoint 1 explicitly reserves that invoker for CP2; its own AI work uses adapter commands. The external bootstrap driver must not cross that boundary.

During T5, use previously accepted Pactwright capabilities when their declared self-hosting threshold is met. Keep the controller separate from the unaccepted replacement. Required uses need actual runtime receipts, not enabled-feature lists. Complete CP1 scope still includes distribution, upgrades, evaluation, clean consumers, learning material, authorised publication and external acceptance.

T6–T9 use CP1 evidence to design and adopt successor run models. The previous accepted model builds/reviews its successor. Later models govern work through Pactwright's Contract, Brief, lifecycle and Evidence interfaces; bootstrap logs do not become manually written canonical records. Shared mechanics can later support music, television, campaigns, research and games through domain verifiers and combined-deliverable review, without a parallel canonical lifecycle.

No new published package, database, generic workflow engine, hosted-agent platform or multiple-provider framework is required for T3.

## 20. Sources and revision record

Repository observations above refer to the inspected commit, not moving branch contents. The authoritative files remain Spec 00 and the owning checkpoint/specification clauses. Research recommendations require review before adoption.

Skills used as design guidance are under [.claude/skills](../../.claude/skills): `harness-engineering`, `karpathy-guidelines`, `typescript-magician`, `tool-design`, `evaluation`, `multi-agent-patterns`, `project-development`, `code-review-and-quality` and `advanced-evaluation`. Their generic advice is subordinate to Pactwright's contracts.

External references: [Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview), [permissions](https://code.claude.com/docs/en/agent-sdk/permissions) and [skills](https://code.claude.com/docs/en/agent-sdk/skills), consulted 26 September 2026. SDK suitability, credential availability, containment and runtime behaviour still require the named experiments.

Version 2 expands the original unnumbered log with configuration, identities, accepted inputs, complete result accounting, reviewer and verifier contracts, skills evidence, isolation, recovery, proof layers and decision criteria. It also clarifies mandatory common review and preserves the T2 dependency instead of authorising an early start by implication. No task is marked complete and no canonical requirement is changed by this revision.

**Checkpoint 1 Task 3 — Harness and Software Run Model, Version 2**
