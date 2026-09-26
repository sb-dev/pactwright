# Checkpoint 1 Task 3 — Harness and Software Run Model

**Version:** 4  
**Date:** 26 September 2026  
**Branch analysed:** `refactor/pactwright-v2`  
**Inspected revision:** `10ffb890b1eb8c0338b339cbb07788a006c76318`  
**Authority:** [Spec 00 v5](../specs/00-checkpoint-step-contract-and-delivery-tasks.md), §§1–6, and [Checkpoint 1 v30](../checkpoints/01-self-hosted-delivery.md). This is a T3 implementation plan, not a change to product semantics or a progress record.

## 1. Purpose and entry conditions

Build a **TypeScript harness** that turns checkpoint requirements into produced, verified and independently reviewed outputs. Canonical specifications own meaning; checkpoint contracts allocate work; only the harness records acceptance. Agent prompts remain generated context.

Spec 00 places T3 after T2. Resolve the T2 review evidence for the exact definition revision before implementation. Merged resolution commits and schema checks do not establish acceptance. This plan does not reopen historical work or grant T2 acceptance. T5 requires accepted T2, T3 and T4 results.

Distinguish **structurally valid**, **requirement-ready** and **executable**. Verifiers may arrive with their capability, but missing bindings never pass. Canonical contradictions require an owner decision.

## 2. Reuse and scope

Reuse [format 2](../checkpoints/contract.schema.json), [checkpoint.yml](../checkpoints/01-self-hosted-delivery/checkpoint.yml), per-step YAML and [checkpoint-contracts.ts](../../scripts/checkpoint-contracts.ts). Extract shared loading/validation; preserve the existing checker and regression tests. Keep crosswalk validation as conversion evidence, not runtime scheduling.

Resolve aliases relative to checkpoint.yml and pin exact clauses and necessary normative references. Conversion-source skip options do not permit missing execution authority. Unconverted Markdown cannot execute or count towards checkpoint completion.

Use the existing TypeScript, Ajv, js-yaml, tsx and Node tests. No second plan, workflow language, graph database, event bus, provider framework or published package is needed.

## 3. Architecture

```text
Canonical sources + checkpoint contracts + run configuration
                            ↓
                  TypeScript harness
             schedule, isolate, record, decide
                            ↓
               software-bootstrap run model
                roles, skills, bindings, review
                            ↓
                      Claude adapter
                 inspect → edit → test → report
```

The **inner agent loop** performs scoped work. The **outer harness loop** seals, verifies and reviews its candidate, then corrects or accepts it. Tool/effect restrictions also apply during production.

| Component | Owns |
| --- | --- |
| Harness | Admission, scheduling, evidence identity, acceptance and recovery. |
| Run model | Software roles, skills, bindings, rubric and correction policy. |
| Adapter | Sessions, controlled tools, responses and cancellation. |
| Configuration | Concrete targets, credentials, permissions and budgets. |

Use TypeScript functions and outcome unions, one producer at a time, and a fresh read-only reviewer. Do not add a provider invoker to Pactwright's CP1 lifecycle runtime.

## 4. Run configuration

Proposed run configuration; upper-case values are operator inputs. Read run_model from checkpoint.yml, not an override.

```yaml
repository:
  name: sb-dev/pactwright
  branch: EXPLICIT_CANDIDATE_BRANCH
  expected_head: FULL_COMMIT_SHA
checkpoint: docs/checkpoints/01-self-hosted-delivery/checkpoint.yml
definitions:
  revision: APPROVED_DEFINITION_SHA
  review: T2_REVIEW_REFERENCE
selection:
  through: CP01-S03
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
  controller_root: PROTECTED_CONTROLLER_ROOT
permissions:
  policy: APPROVED_POLICY_REFERENCE
credentials:
  provider: SECRET_REFERENCE
budgets:
  attempts: POSITIVE_INTEGER
  wall_time_seconds: POSITIVE_INTEGER
  provider_spend_limit: EXPLICIT_LIMIT
```

Validate identity, expected head, definitions, selection, writable paths, tool/network policy, roles, skill hashes and limits before dispatch. Resolve the credential without putting its value in configuration, logs or candidate commands. `plan` may inspect without credentials or a provider call; `run` cannot dispatch without its required resources and authority.

Persist the resolved configuration/policy digest. Selection does not bypass prerequisites or grant checkpoint completion. Never duplicate requirements or override acceptance here.

## 5. Scheduling, inputs and identities

Derive a serial schedule from requires, inputs, uses and inherited obligations. Select the first eligible step in checkpoint order; report exact unmet prerequisites rather than skipping work.

An **accepted output instance** identifies output, producing step, accepted source snapshot, artefact path/digest and acceptance evidence. Every declared output needs a verified instance. A matching file or enabled capability is insufficient; uses needs actual participation evidence.

Keep source and evaluation identity separate:

- **Source:** sealed Git commit/tree, including authorised new files; reject undeclared inputs and rebuild without stale outputs.
- **Evaluation:** source plus definition digests, accepted inputs, harness/run-model version, verifier/rubric/skill revisions, effective configuration and toolchain/lockfile identity. Hash stable key-ordered JSON with SHA-256. This is not Pactwright's pg1 protocol.

Every correction creates a new attempt/evaluation. Start without cross-candidate result caching. Recheck affected earlier obligations on the integrated candidate, but inspect receipts instead of replaying irreversible effects. Preserve historical acceptances.

## 6. Acceptance and verifier lifecycle

Expand each criterion into every required `owner × criterion × case × method × binding` target. A criterion without `cases` has one target per binding with `caseId: null`.

```text
CP01-S03/AC05/self-loop/automated/edges.supersession-cycles
CP01-S03/AC05/two-record-cycle/automated/edges.supersession-cycles
CP01-S03/AC05/longer-cycle/automated/edges.supersession-cycles
```

One aggregate pass cannot satisfy those three targets. Inherited criteria, including `CP01/R01`, are required too. Apply their stated conditions through reviewed bindings; agents cannot invent a skip or an applicability exemption.

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
      outcome: "failed" | "unavailable" | "invalid" | "stale";
      target: VerificationTarget;
      reason: string;
    };
```

The controller adds run, attempt, evaluation and invocation identities to observations. It validates actual evidence references and hashes. An agent-supplied ID or process exit code alone cannot establish a pass. Reject missing, duplicate, unexpected, skipped, malformed or stale target results before comparing the complete expected and passing sets.

| Method | What it establishes |
| --- | --- |
| `automated` | Executed assertions and observations. Review cannot override failure. |
| `review` | Evidence-based judgement against an approved rubric. |
| `approval` | Authority for an exact decision/effect, not technical correctness. |

Common independent review is mandatory even without explicit review bindings. Acceptance also requires all outputs, inherited constraints and approvals, not merely a complete result set.

A new verifier can be proposed alongside implementation. Run it provisionally in isolation, review its adequacy, pin the approved executable and fixtures, then rerun it for acceptance. Provisional passes never count. A verifier change invalidates its approval. Existing approved verifiers are protected; changing them requires separate authorised review. Missing bindings return to producer work only when their implementation is within scope; otherwise pause with the responsible owner identified.

## 7. Review and correction

Review receives exact requirements, sealed code/diff, tests and evidence in a fresh context, not the producer conversation. It covers compliance, outputs, test adequacy, integration, scope, architecture, simplicity, security and relevant performance. Graph review includes ownership, duplicated truth and relation-specific rules.

A structured verdict (pass, changes-required or blocked) covers every requirement/output. Blockers cite the rule, location, defect and correction; distinguish executed observations from inspection. Optional style preferences do not block. Missing review coverage cannot pass.

The reviewer cannot edit and approve its own repair. Same-model sessions provide context separation, not model independence. Calibrate on good/bad fixtures; do not reroll until a favourable verdict appears or average away mandatory failures.

| Condition | Route |
| --- | --- |
| Implementation/output failure or supported rejection | Correct automatically; seal, verify and review again. |
| New/weak verifier | Independent adequacy route in §6. |
| Malformed response or temporary fault | Bounded retry, then pause. |
| Review conflict | Evidence-based clarification, then configured authority. |
| Contradictory requirement or missing authority/credential | Pause unaccepted; no invented semantics. |
| Exhausted attempts/time/spend | Stop unaccepted, preserving evidence and resume reason. |

Counters survive resume. Operator budget/configuration amendments record old/new values and reason. Definition amendments require owner approval and fresh preparation, not rewritten history.

## 8. Skills and containment

| Activity | Repository skills |
| --- | --- |
| Harness design | harness-engineering, project-development, tool-design, multi-agent-patterns |
| Producer | karpathy-guidelines, typescript-magician, relevant implementation/testing skills |
| Reviewer | code-review-and-quality, evaluation, relevant architecture/security skills |
| Judge calibration | advanced-evaluation |

Pin skills/resources and distinguish **available → selected → supplied → observed invoked**. Supply is observable; influence is not. Report missing telemetry. Skills cannot override canonical requirements.

Use controlled project settings, not personal settings or implicit candidate hooks/MCP/instructions. Keep provider secrets with the session driver, outside candidate commands.

Initial profile: **Linux Docker containers controlled by TypeScript**, with a pinned image, unprivileged user, resource limits and scoped writable mounts. No host home, credentials or container-control socket is exposed. Definitions are read-only; verification uses a fresh workspace. Other profiles need tests, not an unrestricted fallback.

Agents cannot use generic host shell/write tools. Project read/search/patch/command operations cross the contained workspace boundary. Fixture commands have no external network; provision reviewed dependencies separately. Protect contracts, schema, run model, approved verifiers, rubric and journal. A control change pauses execution.

Worktrees, tool allowlists, permission callbacks and filesystem/network containment are separate controls. B/C test effective restrictions, including links, shell children and configuration discovery.

## 9. Evidence and recovery

Use a single-writer JSONL journal plus immutable evidence blobs. Events carry sequence, run/attempt, action, evaluation identity, time and evidence references. Record redacted process outcomes, findings, approvals, observable usage and receipts; never require private reasoning.

Flush evidence before its journal reference and acceptance last. Use atomic publication and an exclusive run lock; never steal a live/uncertain owner by age. Recovery fences workers, validates records/digests and quarantines an incomplete final line. Corrupt committed records pause recovery, not reset progress.

External effects require **intent + exact approval → execute → receipt**. An uncertain outcome requires read-back before retry, or operator reconciliation when unsupported. Prove this with a local receipt service, not npm publication. Local acceptance, remote publication and release approval remain distinct. A moved remote head never permits force push.

## 10. Provider decision

Try one TypeScript Claude Agent SDK adapter. Select a claude -p adapter only if C's bounded spike proves a required capability unavailable or materially simpler there; record why and retain one implementation.

C must prove sessions, settings/skills, tool restrictions, structured outcomes, denial, cancellation, supported authentication and spend control with pinned versions. Do not assume an interactive subscription funds programmatic use. Missing credentials mean unexecuted live proof.

Check official [permissions](https://code.claude.com/docs/en/agent-sdk/permissions) and [skills](https://code.claude.com/docs/en/agent-sdk/skills) against the selected version. SDK schema-valid output is not truthful acceptance evidence.

## 11. Implementation layout and shared verification

```text
scripts/checkpoint-harness/
  cli.ts                  plan/run/status/resume/approve entry points
  contracts.ts            shared loading and target expansion
  runner.ts               serial state transitions
  software-bootstrap.ts   roles, binding policy and review rubric
  claude.ts               one provider adapter
  verification.ts         dispatch and reconciliation
  workspace.ts            containment and source snapshots
  evidence.ts             journal and evidence identities

tests/
  checkpoint-harness-{a,b,c,d,e,f}.test.ts
  fixtures/checkpoint-harness/
  integration/checkpoint-harness-workspace.test.ts
  integration/checkpoint-harness.test.ts
  live/checkpoint-harness-claude.test.ts
  live/checkpoint-harness.test.ts
```

This assigns responsibilities, not a quota of eight wrappers. Keep decisions pure where practical; inject filesystem/process/provider boundaries. Use strict TypeScript and validate `unknown` at boundaries. Schemas for run configuration and observations are separate from format 2. No `any`, casts or default passes may conceal absent invariants.

Implement on `feature/cp01-t3-harness` in `sb-dev/pactwright`, created from an authorised SHA of `refactor/pactwright-v2`, with one draft PR against that branch. Verify existing branches instead of resetting them. One writer and one accepted predecessor per unit. This edit creates no implementation branch/PR.

Scope: harness, tests/fixtures, shared checker extraction and necessary package/lock/config changes. No product code in src/** or packages/**, canonical/criteria edits or live workflows. Review changed assumptions separately. Keep progress in SHA-bound PR evidence and controller records, never task definitions.

For each unit, run its named test file, the accumulated harness tests, and the repository gate before committing:

```bash
# Replace UNIT with a, b, c, d, e or f after that file is delivered.
pnpm exec node --test --import tsx tests/checkpoint-harness-UNIT.test.ts
pnpm contracts:check
pnpm verify
```

Use `feature: implement T3-A contract preparation` as the unit-specific subject pattern; corrections use fix:. Cite Spec 00/unit and the actual model in one co-author trailer. Fresh review precedes dependent work. Record unavailable/failed checks; commits alone are not acceptance. No automatic merge/release.

## 12. T3 implementation units

Implement A → B → C → D → E → F. Interfaces and test names below are deliverables, not existing APIs. Root tests are offline. Explicit tests/integration/** require Docker; tests/live/** also require provider access. Neither missing environment counts as a pass.

### T3-A — Load contracts and prepare executable work

**Prerequisites:** the definition/T2 review evidence required by §1, repository gate baseline, and the approved format-2 fixture authorities. No provider or Docker access is needed for this unit.

**Deliver:** `prepareRun(config)` and pure `nextEligible(plan, acceptedOutputs)` functions; a `PreparedRun` value containing pinned sources, selected dependency closure, output declarations, inherited targets and unresolved bindings. Add `plan --config FILE` to `cli.ts`; it prints deterministic JSON and never calls an agent or writes progress.

**Implementation requirements:**

1. Share validated parsing with the existing checker. Reject duplicate YAML keys, bad schemas, unknown IDs/outputs, missing source headings, source-path escape, dependency cycles and a selection with unresolved prerequisite contracts. Preserve exact requirement/criterion text.
2. Validate `inputs` against existing source clauses or declared earlier outputs and resolve `uses` against accepted capability receipts. Test-seeded acceptances are explicit fixtures, never fabricated production progress.
3. Expand every case and binding, including inherited requirements; use `null` for a no-case criterion. Bindings planned for this step may be unresolved at preparation, but remain unsatisfied until T3-D validates them.
4. A valid plan exits 0; invalid input exits 2 with file/ID/cause. Exit 0 means only planning succeeded. Dispatch readiness additionally checks resources and acceptance prerequisites.

**Acceptance — `tests/checkpoint-harness-a.test.ts`:**

| ID | Observable result |
| --- | --- |
| A01 | Two cases × two bindings yield four targets; no-case and inherited targets remain distinct. |
| A02 | Only an eligible step is selected; missing/stale output and capability receipts prevent its dispatch. |
| A03 | Each schema/reference/path/dependency defect reports its cause; no adapter is called and inputs stay unchanged. |
| A04 | Repeated plans for identical inputs are identical; existing checker/crosswalk regression tests still pass. |

**Handoff:** typed plan/target fixtures and diagnostics used by B–F. No harness or product acceptance is inferred from this plan.

### T3-B — Isolate candidates and persist evidence

**Prerequisite:** accepted T3-A; a supported Linux Docker environment. Choose and pin one image/profile here. Missing containment support blocks this unit's integration proof.

**Deliver:** `createWorkspace`, `sealCandidate`, `appendEvent` and `recoverRun` boundaries in `workspace.ts`/`evidence.ts`; a controller-owned run directory with manifest, journal, evidence and source snapshots. Candidate work receives exported source, not a writable shared Git/control directory.

**Implementation requirements:**

1. Apply §8 containment to file operations and actual shell children. Provide allowed-write, protected-read and forbidden host paths; scope-check the captured diff as a second control. Never run candidate scripts inside the controller process.
2. Stop/fence writers before sealing. Include authorised new source files, preserve binary bytes and file modes, and reject undeclared inputs or unsafe links. Produce the source identity and stable evaluation-manifest digest defined in §5.
3. Implement ordered durable writes and the exclusive lock from §9. An old worker cannot append after a new controller takes ownership. The read-only `status --run DIR` derives facts from valid records, not a mutable status file.

**Acceptance:** offline identity/journal tests in `tests/checkpoint-harness-b.test.ts`; real containment/recovery tests in `tests/integration/checkpoint-harness-workspace.test.ts`. Run the latter explicitly with `pnpm exec node --test --import tsx tests/integration/checkpoint-harness-workspace.test.ts`.

| ID | Observable result |
| --- | --- |
| B01 | Allowed file/command work succeeds; traversal, symlink, child-process and protected-file writes fail without changing host/control data. |
| B02 | New/binary/source changes alter identity; unchanged snapshots reproduce it; stale builds cannot satisfy capture. |
| B03 | Restart reconstructs the same events; truncated final writes are quarantined, while corrupt committed data pauses recovery. |
| B04 | A second live controller is refused; orphan/late writes cannot change evidence after fencing. |

**Handoff:** a sealed fixture candidate and recoverable journal. This unit stores test events; production acceptance is added only by D/E.

### T3-C — Connect one real producer and controlled skills

**Prerequisites:** accepted T3-B, authorised provider account and bounded live-test budget. The selected adapter and authentication method must pass the spike before D depends on them.

**Deliver:** `invokeAgent(role, packet, workspace, signal)` with a validated outcome union: `submitted`, `blocked`, `failed`, `cancelled`, `exhausted`. Submission contains proposed output paths, changes, verifier proposals and blockers, never an acceptance flag. The controller validates actual effects independently.

**Implementation requirements:**

1. Run the §10 spike with the SDK first. A fallback decision records the exact failed requirement and CLI result. Pin the chosen dependency and lockfile; unsupported flags or authentication cannot become success defaults.
2. Generate packets from A's exact clauses, accepted inputs, permitted effects, selected skill bytes and prior findings. Pin template/skill/settings digests. Exclude producer conversation from reviewer packets.
3. Keep the session driver and secrets outside candidate execution. Expose only contained project read/search/patch/command operations; disable unrestricted host tools and automatic candidate settings/hooks/MCP discovery. Supplied skill content counts as supplied, not native invocation unless observed.
4. Validate structured outcomes, capture redacted observations and available usage/model identity, and enforce cancellation/time/attempt limits. Unknown reported usage is recorded as unknown. A configured hard spend limit requires an enforceable provider cap or conservative reservation; otherwise refuse dispatch rather than claim it is bounded.

**Acceptance:** `tests/checkpoint-harness-c.test.ts` forces each outcome, malformed JSON, unexpected fields, timeout and late output. `tests/live/checkpoint-harness-claude.test.ts` must demonstrate a real scoped edit, a fresh read-only session, effective settings/skills and a denied protected operation through B's containment. Run it explicitly:

```bash
pnpm exec node --test --import tsx tests/live/checkpoint-harness-claude.test.ts
```

Missing live credentials fail this command clearly; they are not a skip counted as success. **Handoff:** one adapter and its compatibility evidence. No coding-model response grants acceptance.

### T3-D — Bind verification and independent review

**Prerequisites:** accepted A–C; sealed candidates, immutable evidence access and an approved common review rubric. Fixture verifiers remain separate from CP1 product verifiers.

**Deliver:** a code-owned binding registry, `verifyCandidate`, `reviewCandidate` and pure `decideAcceptance`. A binding declares ID/method, executable or review recipe, timeout, required observations and version/digest. It refers to contract targets without restating their requirements.

**Implementation requirements:**

1. Implement the §6 new-verifier route: provisional isolated execution → adequacy review → pin → fresh acceptance execution. Rejection returns a precise test defect. Never import candidate verifier code into the privileged controller; run it in B's verifier workspace.
2. Reconcile exact target keys, invocation identity, observed exit/termination, evidence digests and complete case results. Command exit 0, missing tests and producer-written result files alone cannot pass. Record every invocation even when several bindings share one command.
3. Require an output inventory covering every declared output and its verified meaning. Run common review even when no criterion names a review binding. Validate coverage and findings as specified in §7. Separate technical judgement from effect approval.
4. Return `accept`, `correct` or `pause` with specific reasons; only the controller may append acceptance. A pass requires all current targets, output proofs, common review and required approvals. Do not fabricate IDs or reduce this to a single quality score.

**Acceptance — `tests/checkpoint-harness-d.test.ts`:**

| ID | Observable result |
| --- | --- |
| D01 | Missing, duplicate, extra, malformed, skipped, cross-attempt and stale observations each prevent acceptance. |
| D02 | A weak proposed verifier is rejected; a valid replacement passes adequacy and executes before its results count. |
| D03 | A test-green semantic defect or missing output receives a requirement-linked rejection; optional nits alone do not block. |
| D04 | Correct complete evidence, common review and exact approvals permit acceptance; favourable review cannot override a failed binding. |

**Handoff:** decision and finding fixtures for E, with known-good and known-bad reviewer calibration records. Review uncertainty is not silently converted to pass.

### T3-E — Run correction, approvals and recovery

**Prerequisite:** accepted T3-D. No real release or remote-write credential is needed; use a controlled local effect service with inspectable receipts.

**Deliver:** `run --config FILE`, `resume --run DIR` and operator-only `approve --run DIR --request ID` CLI paths. The deterministic runner uses `prepared → producing → verifying → reviewing → accepted`, with correction returning to production and explicit unaccepted pauses. Per-binding approvals and verifier-review substeps do not create a second product lifecycle.

**Implementation requirements:**

1. Route findings under §7. Preserve failed attempts, feed specific fixes to the next production packet, and capture a new candidate before verification. Count protocol retries and correction attempts against their configured run limits; resume cannot reset them.
2. Resume from the last valid event. Fence interrupted workers; rerun uncertain local checks. A changed source/definition/input/rubric invalidates affected evidence. Preserve the prior acceptance history and revalidate dependent outputs before their next use.
3. Bind approval to the effect request digest, target/version, authorised actor and scope. The candidate cannot call the operator channel. Journal approval and intent before an effect, then receipt. Reconcile a lost response by inspecting the target; unsupported reconciliation pauses rather than repeats it.
4. Accept one step only after D permits it, then select the next eligible step. A selection ending early reports selection acceptance, not whole-checkpoint completion. `run`/`resume` exit 0 only for accepted requested scope, 2 for invalid admission and 3 for an unaccepted pause/failure, with machine-readable reasons.

**Acceptance — `tests/checkpoint-harness-e.test.ts`:** forced verification failure and review rejection each lead to correction and eventual valid acceptance; budget exhaustion never passes; missing/denied/wrong-target approval prevents effects; crashes before/after effect and journal writes recover without duplicate action; modified inputs invalidate prior results; no eligible step reports its unmet dependency.

**Handoff:** a complete offline loop, recovery traces and an operator procedure for genuine pauses. No manual journal/progress editing is permitted.

### T3-F — Demonstrate the integrated bootstrap model

**Prerequisite:** accepted T3-E, reviewed fixture contracts and a live provider budget. Use the same runner/bindings in deterministic and live modes; do not hide product work inside live-test doubles.

**Deliver:** a format-2 two-step fixture under `tests/fixtures/checkpoint-harness/`, its verifier implementations, and an independently reviewed evidence report. The fixture has its own authority; it is not acceptance of CP01 product requirements.

- **Library step:** parse a JSON configuration with an integer `port` from 1 through 65535 and a non-empty trimmed `label`. Reject malformed JSON, wrong types, out-of-range ports, blank labels and unknown fields. Publish its typed API as an accepted output.
- **CLI step:** consume that accepted library, read one file, print normalised JSON and exit 0 for valid input. Invalid input or an unreadable file produces a diagnostic on stderr, no success payload, nonzero exit and no input-file mutation. Do not duplicate the library's validation rules.

Test boundaries, successful controls and accepted-input reuse. Seed an upper-bound fault and a test-green duplicate-validation defect to exercise verification and review correction deliberately. Label injected defects; do not attribute them to a model. Force every controller path with scripted adapters, then run actual production and fresh review through C. A live correction may start from the known-fault submission; it need not depend on the model making a mistake first.

**Acceptance:** `tests/checkpoint-harness-f.test.ts` covers the deterministic runner. `tests/integration/checkpoint-harness.test.ts` proves real containment, two-step scheduling, correction, reuse and restart with scripted agents; run it with `pnpm exec node --test --import tsx tests/integration/checkpoint-harness.test.ts`. Run the real-provider path separately:

```bash
pnpm exec node --test --import tsx tests/live/checkpoint-harness.test.ts
```

The live evidence identifies actual provider/model/skills, candidate and verifier digests, a correction invocation, independent review and final output checks. Missing resources leave this proof unexecuted. No retrospective pass or manually edited progress is allowed.

**Exit review:** confirm all A–F evidence plus root `pnpm verify`, without treating live success as universal correctness. Verify that previous accepted obligations are checked on the final fixture candidate, injected faults are disclosed, and no unaccepted runtime approved itself. Hand T4 the fault cases and evidence locations; T5 still requires its separate acceptance.

## 13. Decisions and later adoption

Decision owners are explicit: **A** owns configuration/admission; **B** proves Linux Docker containment and source/evaluation identities; **C** selects one adapter/authentication path; **D** proves verifier admission and review rubrics; **E** proves approvals/recovery. Failed proofs need a bounded correction and review before dependent work, never weaker acceptance. Exact model/account settings and resource availability remain operator inputs.

T3 builds the executor, T4 challenges it and T5 implements CP1. Use accepted Pactwright features at their declared self-hosting threshold through supported interfaces. Preserve full release, consumer, upgrade, evaluation, learning-material and external-acceptance scope.

T6–T9 use that evidence for successor run models. The previous accepted model builds/reviews its successor. Software, research, music, video, campaigns and games reuse Pactwright's lifecycle/graph; bootstrap logs do not become hand-written canonical records. Mixed-skill work needs combined-output acceptance.

## 14. Sources and revision record

Repository facts refer to the inspected SHA: Spec 00, Checkpoint 1, [package.json](../../package.json), [tsconfig.json](../../tsconfig.json), [CLAUDE.md](../../CLAUDE.md) and the named [.claude/skills](../../.claude/skills). Stage 4/5 resolution records are linked by the current checkpoint; this plan does not assert whole-T2 acceptance.

Provider references: [SDK overview](https://code.claude.com/docs/en/agent-sdk/overview), [permissions](https://code.claude.com/docs/en/agent-sdk/permissions), [skills](https://code.claude.com/docs/en/agent-sdk/skills). C must pin and test its versions.

Version 4 adds bounded A–F requirements, tests and handoffs; assigns decision owners; and removes stale dependency wording. APIs, commands and proofs are implementation targets, not claims that the harness exists or has passed.

**Checkpoint 1 Task 3 — Harness and Software Run Model, Version 4**
