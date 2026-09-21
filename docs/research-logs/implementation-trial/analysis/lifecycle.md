# A2 — Lifecycle and agent execution

**Boundary:** `lifecycle run` / `record` / `status` / `next`, Decision authority,
Gates, bounded retries, the seven adapter commands and the production executor.
**Session:** A2-L, independent. No sibling report was read; no reference code was
repaired.
**Tested at:** the pinned reference `19c66d5f2368932ff05306db1fae8da8ec5810dd`.
The probe checkout carries A1's records overlaid on it and nothing else; its
`src` tree hash is `ea6a948d0b1a84ceb3f8690396a8c1f554e91c43`, identical to the
reference's as recorded in [`evidence/a1/a2-checkouts.md`](../evidence/a1/a2-checkouts.md).
**Probes:** [`tools/implementation-trial/a2-lifecycle/`](../../../../tools/implementation-trial/a2-lifecycle/).
One command reproduces everything below: `bash tools/implementation-trial/a2-lifecycle/run-all.sh`.

## How this was tested

Every scenario drives the product through its public surface. Projects are
built by `pactwright init`, `pactwright agent-pack use` and
`pactwright lifecycle record` — never by writing graph files or execution
documents directly. `lifecycle run` is the shipped command resolving the
shipped executor from `.pactwright/config.yml` and spawning a real child
process; prompt construction, `--agents` assembly, `parsePrintMode` and the
review-outcome derivation all execute unmodified.

The only thing replaced anywhere is the external `claude` process. The stand-in
prints one print-mode JSON response. **It creates no Evidence, writes no
execution state and repairs nothing.** In its `obey` mode it calls
`pactwright lifecycle record` — which is precisely what the prompt the runtime
hands it instructs an agent to do — and nothing else. No probe supplies a
capability the product lacks.

Intermediate states are inspected, not just endings: each probe prints the
run document after every step, and the findings below quote those
intermediates as often as they quote exit codes.

**Environment.** Node v22.22.2, Linux 6.18.44 x86_64, pnpm 11.7.0. At this
tree `pnpm test` reports **684 tests, 683 pass, 1 skipped, 0 fail, exit 0**.
That agrees with PR #39's comment and with CI, and differs from A1's macOS
result of one failure ([`evidence/a1/baseline-checks.md`](../evidence/a1/baseline-checks.md)).
The failure A1 saw is therefore platform-dependent and is **not** in this
report's scope; I did not reach it and make no claim about it.

---

## Findings

Evidence status vocabulary and cause vocabulary are the ones in
[`analysis/README.md`](README.md).

### L01 — `lifecycle run` reports `completed` without creating Evidence, and leaves the lineage permanently un-closable

| | |
|---|---|
| **Requirement** | Spec 01 §25 invariant 5, "every successful path reaches Evidence closure"; §20, `lifecycle run` runs until a Gate, completion, a block or a failure |
| **Public trigger** | `pactwright lifecycle run` on a `delivering` lineage with a configured executor |
| **Source** | `src/execute/select.ts:136-139` (`lifecycleExecutor`, the `evidence` branch); `src/lifecycle/run.ts:290-306` (`advance`, then the completion return); `src/lifecycle/transition.ts:265-267` |
| **Tests** | `tests/lifecycle-run.test.ts` — no test asserts that a run which reports `completed` produced an Evidence node |
| **Expected** | The run reaches the closing Evidence step and either creates Evidence through the Step 7 guards, or stops and says it cannot |
| **Actual** | The Evidence step is a no-op. `lifecycleExecutor` returns `{status:"completed"}` for `kind === "evidence"` without invoking any mutation; `transition` then routes off the end of the shape and reports `completed`. No Evidence node is created. The lineage stays `delivering`. The run document is left `status: completed` with no `current_step`, which makes `atClosingStep` false, so `prepare-evidence` is no longer a permitted operation — the lineage cannot be closed by any command |
| **Evidence** | **executed-fail**, probe `02a`. `lifecycle run --json` → `{"stop":"completed","executed":["delivery","review","evidence"]}`, **exit 0**. Evidence nodes created: **0**. `lifecycle status` → `state: delivering`, `shape: direct (completed)`, `permitted: capture-intent, write-brief (supersede), approve-contract (supersede)`. `lifecycle record prepare-evidence` → exit 1, *"prepare-evidence is not a permitted action … lineage is delivering; record a new Decision with approve-contract to resume"*. A second `lifecycle run` → `{"stop":"blocked"}`. Durable effect: one orphaned run document, a delivered-and-reviewed lineage that can only be abandoned |
| **Cause** | **missing requirement.** `STEP_CAPABILITY.evidence` is `undefined` and the comment at `select.ts:137` says the closure step "invokes the runtime's own guards, not an agent" — but no code path invokes them. Nothing in the checkpoint states who performs the closure step in the automatic loop |
| **Acceptance proposal** | The Evidence step must perform closure. Give the run loop an `evidence` branch that calls `createEvidence` through `assertEvidenceClosure`, or state explicitly that `lifecycle run` cannot close a lineage and make it stop with `human-gate` at the Evidence step rather than reporting `completed`. Acceptance: a run that reports `completed` on a lineage in its shape phase must leave that lineage `done`; a run that cannot close must not report `completed` |

### L02 — Evidence closes over content no Review saw, whenever the repository revision is unresolvable

| | |
|---|---|
| **Requirement** | Spec 01 §53 precondition 2, "a delivery change after Review requires Review of the new delivered state before closure" |
| **Public trigger** | `pactwright lifecycle record prepare-evidence` in a project that is not inside a git work tree, or inside a repository with no commits |
| **Source** | `src/graph/repository.ts:136-146` (`repositoryRevision` returns `NO_REPOSITORY_REVISION` twice); `src/graph/closure.ts:52-73` (`reviewCoversLatestDelivery` re-reads the repository only when `review.revision.startsWith("git:")`) |
| **Tests** | `tests/closure.test.ts` exercises the guard with `git:` identities only |
| **Expected** | Closure is refused, or the closure block records that the delivered state could not be identified |
| **Actual** | Both `delivered_revision` and `review.revision` are the constant string `"none"`, so they always compare equal, and the repository re-check is skipped because `"none"` is not a `git:` identity. Every post-Review change is invisible. The Evidence record carries a self-consistent closure block asserting a closure that did not happen |
| **Evidence** | **executed-fail**, probe `01a`. Delivery and Review recorded, then `src/backdoor.ts` added, then `lifecycle record prepare-evidence` → *"created evidence evidence-delivered-…"*, **exit 0**. Closure block written: `delivered_revision: none`, `reviewed_revision: none`, `review_step: review`, `gates: {}`. `pactwright validate` → **`Valid: 5 nodes, 4 edges, 1 lineages`, exit 0**. The unreviewed file is still on disk. Durable effect: a `done` lineage whose Evidence attests to a state that was never reviewed |
| **Positive control** | Probe `01b`: the identical sequence in a repository *with* commits is refused — *"cannot close brief …: the repository has changed since the Review (reviewed "git:8847…+sha256:b92a…", now "git:8847…+sha256:2ba0…")"*, exit 1, no Evidence node. The guard is correct; only the `none` path escapes it |
| **Cause** | **environment assumption.** `repositoryRevision` "fails soft" by design (its own comment), and `isReconstructible` already treats `none` as unreconstructible for replay — but closure never asks |
| **Acceptance proposal** | Treat `NO_REPOSITORY_REVISION` as a closure-blocking condition in `checkEvidenceClosure`, the same way `replayProvenance` already treats it. A project that cannot identify its delivered state cannot prove a Review covered it. Acceptance: closing a Brief in a non-git project is refused with a named precondition, and the refusal is a distinct code from the drift case |

### L03 — the run loop writes back a pre-executor snapshot, discarding whatever was recorded during the executor call

| | |
|---|---|
| **Requirement** | Spec 01 §10, the writer lock; `src/lifecycle/state.ts:336-340` claims the lock "stops a concurrent mutation interleaving between a caller's read of this state and its write back" |
| **Public trigger** | `pactwright lifecycle run` where the agent does what the prompt it is handed tells it to do |
| **Source** | `src/lifecycle/run.ts:182` (`let execution = executionFor(...)`), `run.ts:244` (`await options.execute(...)`), `run.ts:290` (`advance(project, execution.state, …)` — the value read at :182) |
| **Tests** | none. No test runs an executor that writes execution state |
| **Expected** | Either the loop refuses to proceed when the run document changed underneath it, or it re-reads before applying its transition |
| **Actual** | `executionFor` is read before the executor is invoked; the executor may (and, following its prompt, does) call `lifecycle record`, which writes new state; the loop then applies its own transition to the snapshot it read *before* the call and writes that. The agent's write is silently overwritten. `withRepositoryLock` is taken inside `writeExecutionState` only — it does not span the read-execute-write window, so the comment quoted above does not describe the code |
| **Evidence** | **executed-fail**, probe `02b`. The agent recorded `outcome: revise` through the runtime — stub log: *"agent recorded -> recorded review for brief …; run is running at delivery"*. The loop then wrote `review: {outcome: pass}`, `iterations: {}`, `status: completed`, and reported `{"stop":"completed","executed":["delivery","review","evidence"]}`, exit 0. Both the verdict and the corrective iteration the agent took were erased |
| **Cause** | **contradiction.** The code comment states a serialisation guarantee the lock does not provide at this granularity |
| **Acceptance proposal** | Re-read the run document after the executor returns and refuse if it changed (an optimistic-concurrency check on the document), or hold the repository lock across the whole step. Either way, correct `state.ts`'s comment. Acceptance: a run in which the executor writes execution state must not silently discard that write |

### L04 — the Review verdict is derived by scanning prose for three words, and inverts on ordinary English

| | |
|---|---|
| **Requirement** | Spec 01 §32, a Review's conclusion selects the transition |
| **Public trigger** | `pactwright lifecycle run` reaching a Review step, where the agent returns a prose report rather than `{"outcome": …}` |
| **Source** | `src/execute/select.ts:203-214` (`readOutcome`), reached from `interpret` at `select.ts:180-202` |
| **Tests** | `tests/execute.test.ts` exercises well-formed single-word outputs |
| **Expected** | A verdict is read from a structured field, or the runtime refuses and says the Review must report one |
| **Actual** | The whole report is matched against `\bblocked\b`, `\brevise\b`, `\bpass\b` **in that order**, first match wins. The three words are ordinary English; a report that mentions any earlier one for an unrelated reason is classified by it |
| **Evidence** | **executed-fail**, probe `05`, section 1. All ten cases behaved exactly as predicted (`0 differed`): <br>• `"Two defects remain. I have asked for another delivery pass."` → **pass** <br>• `"Nothing is blocked and nothing needs revision: ship it."` → **blocked** <br>• `"I could not pass judgement; I have no access to the tests."` → **pass** <br>Also reproduced end to end in probe `02b`, where the second of those strings routed a `revise` run to closure |
| **Positive control** | The structured path is correct: `{outcome:"pass"|"revise"|"blocked"}` each yield the matching verdict; `{verdict:"pass"}` (a different key) and `""` both fail cleanly with *"reported no outcome"*; `{outcome:"pass", blocked:true}` reads only `outcome` |
| **Cause** | **unenforced requirement.** §32 requires the Review to report an outcome; the runtime accepts anything and guesses |
| **Acceptance proposal** | Require the structured field. If `output.outcome` is absent or not one of the three values, fail the step with the message that already exists. Delete the prose fallback rather than improving the regex — a verdict inferred from prose cannot be audited. Acceptance: each of the three strings above must fail the step, not classify it |

### L05 — the adapter path launders unparseable run state, discarding an exhausted iteration bound

| | |
|---|---|
| **Requirement** | Spec 01 §34, corrective loops are bounded by policy; PR #39 R04, "the adapter path launders unparseable execution state" |
| **Public trigger** | `pactwright lifecycle record delivery` (or `review`, or `gate`) when `.pactwright/execution/<brief>.yml` does not parse |
| **Source** | `src/lifecycle/provenance.ts:30-47` (`runFor` reads `executionFor(...)` and never inspects `.problems`); compare `src/lifecycle/run.ts:186-196`, which *does* |
| **Tests** | `tests/lifecycle-record.test.ts` — no test records provenance against unparseable state |
| **Expected** | The same refusal `lifecycle run` gives |
| **Actual** | `executionFor` synthesises a pristine run when the document fails to parse. `run.ts` guards this explicitly; `provenance.ts` does not, so the adapter writes the synthesised run over the unreadable one and reports success. History, Gate records and iteration counts are gone |
| **Evidence** | **executed-fail**, probes `03f`, `03g`, `03h`. `03f`: with `status: not-a-status` on disk, `lifecycle run` → `{"stop":"validation-error","message":"the run state for brief … cannot be read"}` (correct). `03g`: the same state, `lifecycle record delivery` → *"recorded delivery …; run is running at review"*, **exit 0**; the file is replaced by a fresh run; `validate` → `Valid: 4 nodes, 3 edges`. `03h`: a run **blocked at 3 of 3 permitted iterations** has its `status` field alone corrupted; `lifecycle record delivery` → exit 0, `status: running`, `iterations: {}` — the exhausted §34 bound is discarded and three more corrective iterations become available |
| **Positive control** | `03h` first shows the intact case: on the untouched blocked run, `lifecycle record review --outcome revise` → *"run is blocked at review"*, `iterations` stays `"review->delivery": 3`. The bound itself is correctly re-checked |
| **Cause** | **inadequate test.** The fix was applied to one of the two paths that read `executionFor`, and no test covers the other. The design's §12 claim that "a CLI command and an adapter command cannot disagree about what is legal" is false here |
| **Acceptance proposal** | Move the parse-problem check into `executionFor`'s callers as a shared precondition, or have `executionFor` return a discriminated result that cannot be used without handling the problem case. Acceptance: for every path that reads a run document, an unparseable document is a refusal with the problems attached, and the file on disk is unchanged |

### L06 — a failed Review is recorded as visited before it fails, producing a `review → review` walk that fails validation on state no human wrote

| | |
|---|---|
| **Requirement** | Spec 01 §57 rule 11, recorded transitions must exist in the shape; PR #39 R12 |
| **Public trigger** | `pactwright lifecycle run` twice, on a shape whose first Review precedes any Delivery |
| **Source** | `src/lifecycle/transition.ts:221` appends `step.name` to `visited` **before** the two review guards at `:226-247` that can return `failed`. Contrast `step-failed` at `:174-181`, which correctly does not append |
| **Tests** | `tests/lifecycle-transition.test.ts` covers the no-outcome branch's `failed` status but not the `visited` it leaves behind |
| **Expected** | A step that failed is not recorded as visited; retrying it produces no transition |
| **Actual** | Each failed attempt appends another copy of the step name. The run is unrecoverable (it fails the same way every time), and from the second attempt `validate` reports `undeclared-transition` for a `review → review` move the runtime itself wrote |
| **Evidence** | **executed-fail**, probe `06c`. Two `lifecycle run` invocations, no human edit: run 1 and run 2 both → `{"stop":"stage-failed","message":"review step \"triage-review\" completed but no delivered state is on record…"}`. `visited: ["triage-review","triage-review"]`. `validate` → **exit 1**, two × *"the run for brief … moved from \"triage-review\" to \"triage-review\", which the \"direct\" shape does not declare"*. One further problem accrues per retry |
| **Positive control** | Probe `02g`: when the *executor* fails at the same Review step, `step-failed` does not append, the resumed run produces `visited: [delivery, review, evidence]`, and `validate` passes. The v2 `visited`-as-chronology change genuinely fixed the realistic retry path. R12 is **narrowed, not closed** |
| **Cause** | **contradiction.** `step-failed` and the in-reducer failure branches disagree about whether a failed step is visited |
| **Acceptance proposal** | Build `carried` only after the guards pass, so no failure path appends. Acceptance: for every event that returns `failed`, the returned state's `visited` equals the input's |

### L07 — the shape invariants admit a shape whose first Review can never be satisfied

| | |
|---|---|
| **Requirement** | Spec 01 §25 invariants 2, 3, 5, 6 |
| **Public trigger** | a `.pactwright/lifecycle.yml` whose shape places a `review` step before any `delivery` step |
| **Source** | `src/lifecycle/shape.ts:198-262` (`checkInvariants`: the `review-must-precede-evidence` rule at `:230-239` constrains the closing end only, and nothing requires a delivery before the *first* review); `src/lifecycle/transition.ts:238-247` makes such a step permanently fail |
| **Tests** | `tests/lifecycle.test.ts` covers the declared invariants; none covers this ordering |
| **Expected** | The shape is rejected at parse time, or the first Review is satisfiable |
| **Actual** | The shape parses, `validate` accepts it (exit 0) and `doctor` is healthy. The first Review then fails forever with *"no delivered state is on record"* — a deadlock the runtime created from a configuration it told the user was valid |
| **Evidence** | **executed-fail**, probe `06c`. `pactwright validate` on the four-step shape → **exit 0**; every subsequent `lifecycle run` → `stage-failed`, identical message |
| **Cause** | **missing requirement.** §25 states the invariants that must hold at the closing end of the shape and says nothing about the opening end |
| **Acceptance proposal** | Add an invariant: no `review` step may precede the first `delivery` step. Reject it in `checkInvariants` with a named code, next to `review-must-precede-evidence`. Acceptance: the shape in probe `06c` fails `validate` with a shape-invariant problem |

### L08 — run state the runtime wrote blocks every operation `lifecycle status` advertises, including `capture-intent`, and no command clears it

| | |
|---|---|
| **Requirement** | Consolidation design §12, `permittedOperations` is "the single answer to what is legal now", read by both `lifecycle status` and `lifecycle record`; `validate/kernel.ts:561` — "A new lineage is always available: capture-intent starts one and constrains nothing that already exists" |
| **Public trigger** | any `pactwright lifecycle record` in a project carrying a run document that fails an `execution`-scope rule |
| **Source** | `src/graph/mutations.ts:174-181` (`commitGraphChange` validates the proposed snapshot under `structural, authority, execution, environment`); `src/validate/kernel.ts:547-604` (`permittedOperations` consults the lineage only) |
| **Tests** | none. No test records a mutation in a project whose run state already violates an execution rule |
| **Expected** | The two agree: what `status` lists as permitted, `record` performs. `capture-intent` in particular is unconditional |
| **Actual** | `permittedOperations` does not consider execution problems, so `status` lists operations the mutation gate will refuse. The mutation gate validates the whole proposed snapshot, so it fails on a pre-existing problem the mutation neither introduced nor can fix. Nothing removes a run document: closure clears it, and nothing else does. The project is wedged for **all** work, including new lineages |
| **Evidence** | **executed-fail**, probe `06d`, on the project probe `06c` produced (state the runtime wrote, no human edit). `lifecycle status` → `permitted: capture-intent, write-brief (supersede), approve-contract (supersede)`. Then: `record write-brief` → exit 1, `record approve-contract` → exit 1, `record capture-intent` → exit 1 — **all three** refused with the same two `undeclared-transition` problems in the pre-existing run document. `ls .pactwright/execution/` still lists it. The only escape is deleting runtime-owned state by hand |
| **Cause** | **contradiction.** Two mechanisms that the design says are one answer are two, and they disagree in the direction that makes the product unusable |
| **Acceptance proposal** | Two changes, independently useful. (a) `permittedOperations` must account for problems that will block a mutation, so `status` never advertises an operation `record` refuses. (b) The mutation gate should judge the problems the proposed change is responsible for; a pre-existing execution problem should be reported, not used to refuse an unrelated `capture-intent`. Add a supported way to discard a run document. Acceptance: on the probe `06c` project, `capture-intent` succeeds, and any operation `status` lists can be performed |

### L09 — `lifecycle next` presents a fabricated run and reports no problem

| | |
|---|---|
| **Requirement** | Spec 01 §20, `lifecycle next` reports the next permitted action |
| **Public trigger** | `pactwright lifecycle next` with an unreadable run document |
| **Source** | `src/lifecycle/engine.ts:327-329` (`lifecycleNext` returns actions only, with no `problems` channel); `engine.ts:114-133` (`executionFor` synthesises a pristine run on parse failure) |
| **Tests** | `tests/lifecycle-engine.test.ts` — no test calls `next` against unparseable state |
| **Expected** | The problem is surfaced, as `run`, `status` and `validate` all surface it |
| **Actual** | `next` reports `next: delivery (step, automatic)` — the synthesised first step — with no indication that the run document is unreadable. An agent driving from `next`, which is what the adapter commands tell it to do, is told to re-deliver from the beginning |
| **Evidence** | **executed-fail**, probe `03f`. With `status: not-a-status` on disk: `run` → `validation-error` with the problem; `status` → prints `shape: direct (running)`, `steps visited: none` **and** the problem; `validate` → the problem, exit 1; `next` → *"next: delivery (step, automatic) / shape step \"delivery\" runs automatic"*, **no problem reported** |
| **Cause** | **missing requirement.** `NextAction` has no field for problems, so the command cannot report one |
| **Acceptance proposal** | Give `lifecycleNext` the same `problems` channel `lifecycleStatus` has, and have `status` mark a synthesised run as synthesised rather than printing it as fact. Acceptance: `next` against an unreadable run document reports the problem and does not name a next action |

### L10 — the headless instruction drops the guardrail section and keeps the double-write section

| | |
|---|---|
| **Requirement** | `src/execute/select.ts:82-87` — "The instruction body comes from the same `COMMAND_TEMPLATES` entry the adapter renders, so the interactive surface and the headless path cannot diverge in what they ask for"; `select.ts:123-129` — letting the agent run `lifecycle record` inside an automatic step "double-advances the run … and it would put a canonical write outside the mutation guards" |
| **Public trigger** | `pactwright lifecycle run` with `execution.executor: claude-code` |
| **Source** | `src/execute/select.ts:89-120` (`taskForAction` builds the instruction from `template.body(...)` only); `src/adapter/claude-code.ts` renders section 1 ahead of the same body |
| **Tests** | `tests/execute.test.ts` asserts the instruction contains the template body; none compares it with the rendered command |
| **Expected** | Either the two surfaces carry the same instruction, or the headless one omits the sections that do not apply to it |
| **Actual** | The divergence is inverted. The headless prompt **omits `## 1. Ask the runtime first`** — the section that tells the agent to consult `lifecycle status` and act only on a permitted operation — and **keeps `## 3. Hand the result to the runtime`**, which instructs the agent to run `pactwright lifecycle record …`: the exact call the same file identifies as a hazard. The agent is spawned with `--permission-mode acceptEdits --permission-prompts none` and `--add-dir <project root>`, so nothing stops it complying |
| **Evidence** | **executed-fail**, probe `04c`, read from the real spawn argv. Rendered `/propose-contracts`: `## 1. Ask the runtime first │ ## 2. Propose alternatives │ ## 3. Report, do not record │ ## 4. Stop`. Headless: `## 2. Propose alternatives │ ## 3. Report, do not record │ ## 4. Stop`. Probe `02b` shows a compliant agent then making the write, and L03 shows the loop discarding it |
| **Cause** | **contradiction** between the stated intent and the composition |
| **Acceptance proposal** | Split the template body into sections tagged by surface, so the headless path can take the runtime-context section and drop the recording section, rather than taking a suffix of a document written for a human-driven command. Acceptance: the headless instruction for every one of the seven commands contains no `lifecycle record` call, and contains the runtime-context section |

### L11 — `executor: scripted` validates, passes `doctor`, then reports "no executor is configured"

| | |
|---|---|
| **Requirement** | Distribution §3, the declared executor set |
| **Public trigger** | `execution: { executor: scripted }` in `.pactwright/config.yml` |
| **Source** | `src/execute/task.ts:62` (`EXECUTOR_IDS` includes `scripted`, and `src/config/config.ts:134` validates against it); `src/execute/select.ts:22-30` (`selectExecutor`'s `default:` branch returns `noneExecutor`) |
| **Tests** | `tests/execute.test.ts` asserts `selectExecutor` returns `noneExecutor` for `scripted` — it pins the behaviour without noticing the contradiction it creates for a user |
| **Expected** | Either the value is rejected at config validation, or selecting it does something |
| **Actual** | Accepted everywhere and silently mapped to `none`, then reported with a message that contradicts the configuration the user wrote |
| **Evidence** | **executed-fail**, probe `02f`. `validate` exit 0; `doctor` exit 0 with `[healthy] capabilities` and no executor finding; `lifecycle run` → *"no executor is configured, so capability \"delivery-execution\" was not performed; declare one with execution.executor in .pactwright/config.yml"* |
| **Cause** | **ambiguity.** `EXECUTOR_IDS` serves two purposes — the set of implementations and the set of configurable values — and they are not the same set |
| **Acceptance proposal** | Split the two sets: keep `scripted` as an implementation id, and validate `config.execution.executor` against the configurable subset. Acceptance: `executor: scripted` fails config validation with a message naming the permitted values |

### L12 — the automatic loop requires the agent to make the canonical write, which the same file forbids

| | |
|---|---|
| **Requirement** | Spec 01 §11, canonical records are the runtime's; `src/execute/select.ts:130-135` as quoted in L10 |
| **Public trigger** | `pactwright lifecycle run` on a `contracted` lineage (the `write-brief` responsibility) |
| **Source** | `src/lifecycle/run.ts:325-340` (a recording responsibility must have advanced the graph); `src/execute/select.ts:131-179` (`lifecycleExecutor` performs no mutation) |
| **Tests** | `tests/lifecycle-run.test.ts` uses executors that mutate the graph themselves, so the seam is never exercised as shipped |
| **Expected** | Consistency: either the runtime performs the write for recording responsibilities, or the agent does, on every path |
| **Actual** | For `capture-intent`, `approve-contract` and `write-brief` the loop *requires* the agent to have called `lifecycle record`, else it stops with *"…completed without advancing the graph"*. For shape steps the same file calls that call a hazard. The two halves of the loop hold opposite rules |
| **Evidence** | **executed-fail**, probe `04b`. With an agent that does not call the runtime: `{"stop":"stage-failed","action":"write-brief","message":"write-brief completed without advancing the graph"}`, exit 1. With the call made as the prompt instructs: *"created brief brief-b-aabd2263"*, exit 0 |
| **Positive control** | Probe `04a`: from the `open` state, the transient `propose-contracts` responsibility executes and the run stops correctly at the `approve-contract` human Gate — `{"stop":"human-gate","action":"approve-contract","requiredActor":"human","executed":["propose-contracts"]}` |
| **Cause** | **ambiguity.** The checkpoint does not say who performs the canonical write in the headless loop |
| **Acceptance proposal** | Decide it once. Recommendation: the runtime performs every canonical write, and `lifecycleExecutor` gains a recording branch per responsibility, mirroring the Evidence branch L01 asks for. Acceptance: `lifecycle run` from `contracted` produces a Brief without the agent invoking any `pactwright` command |

### L13 — `denials` and `cost` are produced and never read

| | |
|---|---|
| **Requirement** | `src/execute/task.ts:52-59` — denials exist so "the lifecycle can tell 'the agent could not do this' from 'the agent did this badly' … and the first is an environment failure" |
| **Public trigger** | any executor run whose tool reports `permission_denials` or usage |
| **Source** | `src/execute/claude-code.ts:130-144` populates both; `src/execute/select.ts:131-202` reads neither |
| **Expected** | An environment failure is distinguishable from bad work |
| **Actual** | `grep -rn "denials" src/` outside the executor returns exactly one line — the type declaration. `cost` has no reader at all. On a *failed* run the denials reach a message string; on a **successful** run that was denied permissions they are discarded entirely, and the step is recorded as a clean completion |
| **Evidence** | **executed-pass** for the production of the data (probe `05` §2: denials parsed as structured data; a `subtype: success` response carrying denials → `status: completed`); **code-traced** for the absence of consumers, by exhaustive grep at the tested tree |
| **Cause** | **missing requirement.** No requirement states what the lifecycle does with a partial denial |
| **Acceptance proposal** | Either consume it — a Delivery step whose run reported denials should not complete silently — or delete the fields and the comment. Acceptance: a `success` response carrying denials does not produce a bare `completed` outcome |

### L14 — a superseded Brief's run document is never removed

| | |
|---|---|
| **Requirement** | `src/validate/kernel.ts:591-594` — for the §45 Brief change, "The old run is closed by the replacement" |
| **Public trigger** | `pactwright lifecycle record write-brief` or `approve-contract` on a `delivering` lineage |
| **Source** | `src/lifecycle/record.ts:305-314` clears execution state for `prepare-evidence` only |
| **Expected** | The superseded Brief's run document is removed, as the comment says |
| **Actual** | It stays. `loadAllExecutionState` keeps reading it, so rules 10, 11, 14 and 15 keep judging a run belonging to a Brief nothing can reach. This is the reservoir L08 draws on |
| **Evidence** | **executed-fail**, probes `06a` and `06b`. After each supersede, `ls .pactwright/execution/` still lists the superseded Brief's document |
| **Positive control** | Both replacements themselves work — see P08 |
| **Cause** | **unenforced requirement.** The comment states the intent; no code implements it |
| **Acceptance proposal** | Clear the superseded Brief's run document inside the same mutation, under the same lock. Acceptance: after a `write-brief (supersede)`, `.pactwright/execution/` contains no document for the superseded Brief |

---

## What works, and should be kept

A reimplementation that discards these would be worse than one that keeps
them. Each was executed, not read.

| ID | Mechanism | Evidence |
|---|---|---|
| **P01** | The §53 drift guard, when the repository revision resolves | `01b` — a post-Review change is refused, naming both digests, exit 1, no Evidence node written |
| **P02** | Honest closure | `01c` — a reviewed, unchanged tree closes, exit 0 |
| **P03** | The §45 Evidence correction (PR #39 R11) | `01d` — on a `done` lineage, `status` advertises `prepare-evidence (supersede)` and recording it succeeds: new Evidence node, `supersedes` edge emitted, `validate` clean. Closure provenance is carried forward from the superseded record, so the correction does not fabricate a new closure |
| **P04** | The bounded corrective loop (§34) | `02c` — `revise` on every Review runs exactly three corrective iterations, then `{"stop":"blocked","message":"corrective route review->delivery has run 3 of 3 permitted iterations; policy requires human intervention now"}`, `iterations: {"review->delivery": 3}` |
| **P05** | The iteration bound is re-checked, not just counted | `03h` — on an intact blocked run, a further `revise` is refused: *"run is blocked at review"*, count unchanged |
| **P06** | Gate authority (§31, §46) | `03a-03d` — the automatic run stops at a human Gate having spawned nothing for it; `resolved_by: agent:impostor` is refused with the state file unchanged (`gates: {}`); `human:samir` is accepted; the Gate then appears in the Evidence closure block as `review: human:samir` |
| **P07** | Decision authority (rule 13) | `03e` — `decided_by: agent:autopilot` against a `human` policy is refused before any write; no Decision or Contract node is created |
| **P08** | The §45 replacements on a delivering lineage | `06a`, `06b` — `write-brief (supersede)` and `approve-contract (supersede)` both execute, emit `supersedes` edges and leave the graph valid |
| **P09** | Executor failure is loud, not silent | `02d`, `05` §4 — a missing binary, a timeout with no output and an unreadable agent prompt all fail; a permission denial surfaces as *"the executor was denied 1 permission: …"* and the run stops `stage-failed` |
| **P10** | Governed retry | `02d` (a Delivery failure) and `02g` (a Review failure) — a failed step records `status: failed` with `current_step`, and the next run resumes at that step. `step-failed` does not append to `visited`, so the resumed walk is clean and `validate` passes |
| **P11** | The refusal default | `02e` — with no executor declared, the run refuses rather than pretending the responsibility was discharged. This is the safe state and should survive |
| **P12** | `lifecycle run` guards unparseable state | `03f` — `validation-error` with the parse problem attached, no write. The guard is right; L05 is that only one caller has it |
| **P13** | Print-mode parsing | `05` §2 — non-JSON, `is_error`, a non-`success` subtype, `null` and a bare JSON string are all refused; denials are structured data, not pattern-matched prose |
| **P14** | Structured Review outcomes | `05` §1 — the structured path is exactly right, including ignoring fields other than `outcome`. L04 is only about the prose fallback beside it |
| **P15** | All seven adapter commands render and are reachable | `agent-pack use` writes all seven `.claude/commands/*.md` with an ownership banner; six carry a runtime call, `propose-contracts` correctly carries none and leaves no graph record |

---

## PR #39 trigger coverage

Triggers, not labels, per [`analysis/README.md`](README.md). The comment is an
investigation input by the branch's own author; each claim below is my result,
not its claim.

| Trigger (PR #39) | Status | Result |
|---|---|---|
| R05a — false `completed` with no Evidence | **executed-fail** | Confirmed and worse than stated: the lineage is also left un-closable (L01) |
| R05b — a compliant agent cannot complete a Review | **not-reproduced** | A compliant agent *can* complete a Review; its verdict is then discarded by the loop (L03). Different mechanism, same class of harm |
| R05c — the outcome parser misreads prose | **executed-fail** | Confirmed, with three inverting strings (L04) |
| R02a — caller-supplied `revision` disables the drift guard | **not-run** | `lifecycle record delivery` accepts a `revision` key. I probed the default path only. **Coverage gap** |
| R02b — a project outside a git work tree closes over unreviewed content | **executed-fail** | Confirmed for a repository with no commits; the no-`.git` case is the same code path and the same constant, and I did not run it separately (L02) |
| R04 — the adapter path launders unparseable execution state | **executed-fail** | Confirmed still open, and shown to discard an exhausted policy bound (L05) |
| R12 — `review → review` fails validation on state no human touched | **executed-fail, narrowed** | The executor-failure retry path is fixed (P10). A shape the validator accepts still produces it (L06, L07) |
| R11 — Evidence correction advertised then refused | **executed-pass** | **Closed.** The correction works end to end (P03) |
| §12 — "a CLI command and an adapter command cannot disagree" | **executed-fail** | They disagree twice: L05 and L08 |
| §10 — the writer lock releases a lock it no longer owns | **not-run** | Lock ownership is the distribution audit's boundary. **Coverage gap** |
| R03 — back-dating `created` skips the closure-block requirement | **code-traced** | Not reachable through `lifecycle record`: `prepare-evidence` allows only `brief`, `title`, `body` (`record.ts:164-176`), so the adapter surface cannot back-date. `createEvidence`'s `created` input remains. Graph audit's boundary |
| R06 (evaluation), R07/R10 (extension migration), R08 (package-manager lock), R09 (upgrade/acquire), R01, R13 | **not-run** | Outside this boundary — distribution, verification and graph audits |

---

## What I did not reach

Stated plainly rather than left to silence.

- **`lifecycle record delivery --revision <x>`** (R02a). The field is accepted; I
  exercised only the default. This is the highest-value gap in my own coverage.
- **Multi-lineage runs.** Every probe used one lineage. `selectLineages`'s
  no-`intentId` path, the capture-intent fan-out in `runLifecycle`, and
  `--intent` against an unknown or ambiguous intent are **not-run**.
- **Concurrency.** No probe runs two processes against one project. The
  read-execute-write window in L03 is shown with a *nested* writer (the agent
  the runtime itself spawned), not with a race. Genuine concurrency and lock
  ownership belong to the distribution audit.
- **Extension-contributed lifecycle policy.** All probes used the shipped
  `@pactwright/standard` pack and core shape only.
- **The `context` command**, which every adapter command's section 1 tells the
  agent to run first.
- **The macOS test failure A1 recorded.** Not reproducible here; out of scope.
- **Gate steps other than a human Gate on `review`**, and shapes with more than
  one Gate.

## One thing a reimplementation should decide first

Three of the defects above (L01, L03, L10, L12) are the same unmade decision
wearing different clothes: **in the headless loop, who performs the canonical
write — the runtime or the agent?** Today the answer is "the runtime, except
for recording responsibilities, where it is the agent, except that the prompt
tells the agent to do it for shape steps too, where the runtime then discards
it." Every one of those four findings dissolves once that question has a single
answer. It is worth settling before any of them is patched individually.
