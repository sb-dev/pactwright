# A2-V — tests, evaluation and simplicity

**Audit:** A2, verification boundary · **Branch:** `trial/a2-verification`
**Reference:** `19c66d5f2368932ff05306db1fae8da8ec5810dd`, plus one overlay
commit that adds no production file.
**Evidence:** [`../evidence/a2/verification/`](../evidence/a2/verification/) ·
**Probes:** [`tools/implementation-trial/a2/verification/`](../../../../tools/implementation-trial/a2/verification/)

Skills applied from `skills-lock.json`: `test-strategy`, `mutation-testing`,
`risk-based-testing`, `code-review-and-quality`. No skill was installed or
modified.

---

## What this audit did, in one paragraph

It derived expected behaviour from the specifications and the consolidation
design, then asked of each critical proof: *would this fail if the thing it
proves were broken?* Twenty-two disposable defects were seeded into a **copy** of
the tree and the reference's own gate run against each. Nineteen probes compose
the public surface the way the CLI composes it. Every public command was traced
with `strace` to count the work it actually repeats. The result is eighteen
findings, of which **five confirm a PR #39 claim by execution, two qualify one,
and eleven are new**.

The headline is narrow and specific. The consolidation identified its own root
cause correctly — *"a test double more capable than the shipped code"* — and
then closed it with a test whose double is more capable than the shipped code
(V07). The `evaluated` flag introduced to stop an unevaluated run passing is not
read by the comparison path that decides releases (V01, V02), is not rendered in
the report a human reads (V13), and its guard in `evalPassed` survives deletion
with the whole suite green (V18). The mechanism is sound. Nothing checks that it
is connected.

## The baseline this was measured against

`pnpm test` on the reference **passes here**: 684 tests, 683 passing, 1 skipped,
0 failing, exit 0. A1 recorded `executed-fail` on macOS; both are correct on
their platform and the test is the thing that is wrong
([`baseline-on-linux.md`](../evidence/a2/verification/baseline-on-linux.md), and
V16 below). Every finding was therefore reproduced against a green baseline: a
failure reported here is this audit's seed or this audit's composition, never an
inherited red.

`executor: claude-code performs a capability end to end` is still
`environment-blocked`. `PACTWRIGHT_E2E_CLAUDE` was not set and no credential was
used. The only test that exercises the real provider executor did not run here
either.

---

## What works, and should survive a reimplementation

Recording these matters as much as the defects: a rewrite that discards a
working mechanism because nobody wrote down that it worked is the worse outcome.

| Strength | Where | Why it is worth keeping |
|---|---|---|
| **Every deterministic assertion is proven to detect its own violation** | `tests/eval.test.ts:73-79` and `:173-188` | The suite ships `violations` — candidates that act wrongly — and a generated test per violation asserts the named assertions fail. Line 74 goes further and requires *every* assertion to have such a violation, and all twenty are covered by twenty-one candidates. This is mutation adequacy built into the product, not bolted on. It is the single best thing in the verification surface. |
| **Deterministic and semantic channels never merge** | `src/eval/case.ts:45-53`, `tests/eval.test.ts:83` | No aggregate score exists anywhere, and a test asserts the two channels share no ids. `tests/eval-compare.test.ts:88` asserts the rendered comparison contains no `/score/i`. Distribution §16 and §24 are enforced, not just stated. |
| **Failures are data, never thrown runs** | `src/eval/runner.ts:229-241`, six tests at `tests/eval.test.ts:255-322` | Sandbox failure, setup failure, a candidate that destroys its sandbox, a candidate timeout, a judge timeout and a missing capability are each a case error with the rest of the suite still evaluated. |
| **Isolated baseline acquisition works against the real registry** | `src/eval/acquire.ts`, verified in [`incompatible-baseline.txt`](../evidence/a2/verification/incompatible-baseline.txt) | `@pactwright/standard@0.0.1` was installed into its own temporary project at the exact version, the incompatibility was caught there rather than by silently resolving the local `0.0.2`, and the directory was removed on the failure path. |
| **Response parsing is deterministic and offline** | `src/execute/claude-code.ts:116-164` | Malformed JSON, `is_error`, a non-`success` subtype, denials and cost are all parsed without a network call, and each has a test. Seeds s10, s12 and s14 are all killed. The parser is sound; V06 is about the *invocation* around it. |
| **The runtime refuses to guess a Review verdict** | `src/execute/select.ts:193-199` | A review with no recognisable outcome is a stage failure, not a default pass. Seed s15 is killed. |
| **Sandboxes are per-case, removed, and symlink-aware** | `tests/eval.test.ts:148-169`, `:234-253` | Roots are distinct, all removed, and snapshots record symlinks without following them. |

---

## Findings

Cause uses A2's vocabulary: missing requirement, ambiguity, contradiction,
unenforced requirement, inadequate test, environment assumption. Evidence status
uses `executed-pass`, `executed-fail`, `code-traced`, `not-reproduced`,
`not-run`, `environment-blocked`. Every finding below was tested at
`19c66d5f` + the overlay.

| ID | Finding | Cause | Evidence | PR #39 |
|---|---|---|---|---|
| [V01](#v01) | A comparison reports agreement when neither side was evaluated | unenforced requirement | `executed-fail` | confirms R06.1, **qualifies its trigger** |
| [V02](#v02) | `compareEvalReports` never reads `evaluated` at all | unenforced requirement | `executed-fail` | new (V01's root cause) |
| [V03](#v03) | The evaluation candidate discards executor `status`, so an environment failure is recorded as pack misbehaviour | inadequate test | `executed-fail` | confirms R06.2, exact count |
| [V04](#v04) | Eleven of twenty assertions, and two of eight whole cases, pass when nothing ran | inadequate test | `executed-fail` | new |
| [V05](#v05) | `denials` and `cost` are parsed and then dropped; no production code reads either | unenforced requirement | `code-traced` | extends R06.2 |
| [V06](#v06) | The executor never reads the child process's exit status | missing requirement | `executed-fail` | new |
| [V07](#v07) | The acceptance proof for "a double more capable than the shipped code" is built on a double more capable than the shipped code | inadequate test | `executed-pass` | confirms the stated root cause |
| [V08](#v08) | The refusal recogniser is a three-phrase regular expression, in production and in the public export | inadequate test | `executed-pass` | **strengthens** R06's sentinel claim |
| [V09](#v09) | `executor: scripted` validates, then resolves silently to `none` | contradiction | `executed-pass` | new |
| [V10](#v10) | `doctor` has no execution check; a project that cannot run one automatic step is `healthy` | missing requirement | `executed-pass` | new |
| [V11](#v11) | The Review outcome parser scans free prose by fixed precedence | ambiguity | `executed-fail` | confirms R05.3, adds the unproven precedence |
| [V12](#v12) | The no-executor error instructs an action the CLI does not support | contradiction | `code-traced` | new |
| [V13](#v13) | `pactwright eval`'s human-readable report never renders `evaluated` | unenforced requirement | `executed-fail` | new |
| [V14](#v14) | Five tests query the live npm registry; the gate depends on it | environment assumption | `executed-fail` | confirms, with counts |
| [V15](#v15) | Every released baseline is incompatible with every later runtime by construction | contradiction | `executed-fail` | confirms R06.3 |
| [V16](#v16) | The acquire isolation test asserts a path-prefix relation that is false where `tmpdir` is a symlink | environment assumption | `executed-pass` | new |
| [V17](#v17) | `validate` spawns forty-eight git subprocesses for twelve identical queries; `doctor` loads the graph twice | unenforced requirement | `executed-pass` | new |
| [V18](#v18) | Three fault seeds survive the whole suite: `evalPassed`'s `evaluated` guard, the assertion-throw guard, and the verdict precedence | inadequate test | `executed-pass` | new |

Plus [V19](#v19), on A1's source accounting, which is an input to A4 rather than
a defect in the reference.

---

<a id="v01"></a>
### V01 — A comparison reports agreement when neither side was evaluated

**Requirement.** Distribution §24: a released Agent Pack establishes a baseline
and a candidate is compared against it, so that a release decision can be made
on the dimensions it is actually made on. A comparison that cannot tell "the two
packs behaved identically" from "neither pack was asked to behave" does not
support that decision.

**Public trigger.** `pactwright eval --baseline <pack> --candidate <pack>` in a
project whose `.pactwright/config.yml` declares no `execution:` block — which is
the reference repository's own configuration.

**Source.** `src/eval/compare.ts:145` (`compareCase` returns `undefined` when no
assertion moved and both sides carry the same error), `:227-230`
(`formatComparison` returns early on an empty case list), `src/cli.ts:845` (the
exit code is `hasRegressions` alone).
**Test.** `tests/eval-compare.test.ts` — all seven tests build `EvalCaseResult`
objects by hand with `evaluated: true` hard-coded at line 21. No test compares
two reports in which anything was unevaluated.

**Expected.** A comparison in which no case was evaluated reports that fact and
does not exit 0.
**Actual.** Every case is dropped from the report, `hasRegressions` is `false`,
and the rendered output is the single affirmative line *"No differences: every
case behaved identically."* — which is not merely empty but a positive claim
about behaviour that was never observed. Exit 0.

**Evidence.** `executed-fail`. `V01`, `V02`, `V02b` in
[`probe-suite.txt`](../evidence/a2/verification/probe-suite.txt), and the CLI
run in [`incompatible-baseline.txt`](../evidence/a2/verification/incompatible-baseline.txt).
The probe compares the real `complete` fixture pack against a copy whose every
agent prompt reads "Ignore all tasks. Return nothing." — the review's own
sentinel — and the environment delta correctly names all three changed prompts
one line above the verdict:

```
  changed:   agent pack; prompts (implementer, reviewer, spec)

No differences: every case behaved identically.
```

`V02b` shows it is not specific to the no-executor message: any error both sides
share disappears, including a setup failure that means the assertions never ran.

**Qualification of PR #39.** R06's first sub-claim says the literal Step 28
command takes this path. It does not — see V15: acquisition fails first, and a
reader running Step 28 today sees `incompatible-runtime`. The false-agreement
output is real and is reached whenever both sides acquire successfully, for
example with two path sources. A3 should not treat one execution as evidence for
the other.

**Acceptance proposal.** `AC-EVAL-COMPARE-UNEVALUATED`: given a baseline and a
candidate report in which any case has `evaluated: false`, the comparison names
those cases, `hasRegressions` is true, and the command exits non-zero. Given
both sides carrying the same error, the case appears in the report with that
error rather than being dropped. The emptiness check in `formatComparison` must
distinguish "nothing differed" from "nothing was measured".

---

<a id="v02"></a>
### V02 — `compareEvalReports` never reads `evaluated`

**Requirement.** `src/eval/runner.ts:32-40` states the purpose of the field:
*"False when no executor performed the capability, so nothing about the pack's
behaviour was observed. A case that was not evaluated can never pass."*

**Source.** `src/eval/compare.ts` — the identifier `evaluated` does not appear in
the file. `evalPassed` honours it; the comparison does not.

**Expected.** The guard introduced to stop an unevaluated run being read as a
good one applies on the path where a release is decided.
**Actual.** It applies only to the single-pack gate. The comparison path, which
is the one Checkpoint 1 Step 28 uses, is blind to it.

**Evidence.** `code-traced`, and `executed-fail` through V01.

**Cause.** Unenforced requirement. The field was added and one of its two
consumers was not updated. This is the specific shape worth carrying into A4: a
guard that exists is not a guard that is applied, and nothing in the suite
distinguishes the two.

**Acceptance proposal.** Fold into `AC-EVAL-COMPARE-UNEVALUATED`. More
generally, `EvalCaseResult.evaluated` should be impossible to ignore — for
example by making an unevaluated case a distinct variant rather than a boolean
on the same record, so a consumer that does not handle it does not compile.

---

<a id="v03"></a>
### V03 — The evaluation candidate discards the executor's status

**Requirement.** `src/execute/task.ts:53-58`, on `denials`: *"An environment
failure is a different thing from work done badly, and the lifecycle cares about
the difference."*

**Public trigger.** `pactwright eval` in a project declaring
`execution.executor: claude-code` where the `claude` binary is not installed —
the state of any consumer who configured the executor before installing the tool.

**Source.** `src/cli.ts:920`:

```ts
candidate: async (task) => (await executor.invoke({ ...task, label: task.caseId })).output,
```

`.output` and nothing else. `status`, `message`, `denials` and `cost` are
discarded. A failed invocation yields `undefined` output on a sandbox where
nothing happened; `runCase` never sees a throw, so the case is
`evaluated: true, error: undefined` with assertions that fail for want of any
action.

**Expected.** An executor that could not run is reported as an environment
failure and the cases are not evaluated.
**Actual.** The failure is attributed to the Agent Pack.

**Evidence.** `executed-fail`, end to end through the built CLI under
`env -i PATH=<empty dir>` so the binary genuinely cannot be resolved
([`eval-misattribution.txt`](../evidence/a2/verification/eval-misattribution.txt)):

```
Deterministic assertions: 11 passed, 9 failed.
Semantic dimensions: 0 judged, 9 unjudged. No aggregate quality score is calculated.
exit=1

  contract-fidelity        evaluated=true  error=none  assertions 0/1 passed
  ...
  lifecycle-compliance     evaluated=true  error=none  assertions 4/4 passed

--- does any output name the executor failure? ---
    no: the report names neither the executor nor its failure.
```

**Confirmation of PR #39.** R06's second sub-claim is exactly right, including
its predicted "11 assertions passed". Its line reference is `src/cli.ts:916`; at
the pinned SHA the line is `920`.

**Compounding.** V03b in the probe suite shows the two failures composing: with
one broken executor, the *working* pack and the *declining* pack produce
identical reports, so the comparison prints "every case behaved identically".
The commonest real misconfiguration silently defeats the release gate.

**Acceptance proposal.** `AC-EVAL-EXECUTOR-FAILURE`: given a declared executor
whose invocation returns `status: "failed"`, every case reports
`evaluated: false` with the executor's own message, the gate fails, and the
rendered report names the executor. The `CandidateRunner` type should carry the
executor's result rather than its `output`, so that discarding the status
requires writing code that says so.

---

<a id="v04"></a>
### V04 — Eleven of twenty assertions pass when nothing ran

**Requirement.** Distribution §16: an evaluation case observes what the pack
*did*. An assertion satisfied by inaction observes nothing.

**Source.** `src/eval/core-suite.ts`. The suite's twenty deterministic
assertions include eleven of the form "the forbidden thing did not happen".

**Actual**, with an executor that cannot run
([`dead-executor-suite.txt`](../evidence/a2/verification/dead-executor-suite.txt)):

```
11 of 20 deterministic assertions pass when nothing ran.
Wholly vacuous cases: forbidden-mutation, lifecycle-compliance
evalPassed = false — and it is false only because other
cases carry positive assertions, not because anything noticed the executor.
```

Two of eight cases — `forbidden-mutation` (2/2) and `lifecycle-compliance`
(4/4) — are satisfied in full by a candidate that does nothing whatever.

**Why the existing mutation adequacy missed it.** `tests/eval.test.ts:74-79`
requires every assertion to have a violation candidate that breaks it. Every
violation candidate *acts wrongly*; the suite has exactly one that *does
nothing* — `delivers-nothing` at `src/eval/core-suite.ts:210`, in
`scope-discipline`, breaking one assertion. Twenty-one violation candidates
across the two case files; one of them declines to act. The pattern that would have caught
this is already in the suite and is applied once.

**Evidence.** `executed-fail`. Probe `V03c` asserts the counts; the table is the
evidence file above.

**Acceptance proposal.** `AC-EVAL-NO-VACUOUS-ASSERTION`: every case carries a
`delivers-nothing` violation whose `breaks` names **every** deterministic
assertion in that case, and `tests/eval.test.ts`'s adequacy check requires it.
That forces each of the eleven negative assertions to be paired with a positive
one — "the graph is unchanged **and** the required record exists" — so that
inaction can never satisfy a case. This is the cheapest high-value change in
this report: it is nine lines of fixture data and it closes V04 at design time.

---

<a id="v05"></a>
### V05 — `denials` and `cost` are parsed and then dropped

**Source.** `src/execute/claude-code.ts:131-149` builds both.
`src/execute/select.ts:168-172` maps `CapabilityResult` onto `ActionOutcome`,
and `ActionOutcome` (`src/lifecycle/run.ts:23-31`) has no field for either.

**Consumers.** Outside `src/execute/`, the identifier `denials` appears only at
`tests/execute.test.ts:179` and `cost` only at `tests/execute.test.ts:165`. Both
are asserted by a test and read by nothing in the product.

**Why it matters for denials.** Claude Code reports a run that finished but was
refused a permission as `subtype: "success"` with a populated
`permission_denials`. `parsePrintMode` correctly returns `completed` **with**
denials — and `lifecycleExecutor` then returns `{ status: "completed" }`, so for
a Delivery step the run records a revision and advances. A Delivery that was
denied the write it needed is indistinguishable from one that succeeded.

**Why it matters for cost.** `tests/execute.test.ts:163` states the intent: *"a
bounded corrective loop is also what stands between it and a bill."* There is no
bound. Nothing accumulates, inspects or limits cost.

**Evidence.** `code-traced` for the dead-field claim (the grep is exhaustive);
`executed-pass` for the parse behaviour (probe `V04`).

**Acceptance proposal.** `AC-EXEC-DENIAL-VISIBLE`: a capability result carrying
denials cannot be recorded as a clean completion — either the step fails as an
environment failure, or the denials are carried into the run result and the
Evidence. `AC-EXEC-COST-BOUNDED`: accumulated cost is reported by `lifecycle
run` and a configured ceiling stops the run. If cost is not wanted in
Checkpoint 1, remove the field rather than shipping a parsed-and-discarded one.

---

<a id="v06"></a>
### V06 — The executor never reads the child's exit status

**Source.** `src/execute/claude-code.ts:198-229`. `SpawnResult.code` is set on
both paths of `defaultSpawn` (`:175`, `:185`) and read nowhere. The only failure
gate is `result.error !== undefined && result.stdout.trim().length === 0`.

**Expected.** A child that exits non-zero has failed.
**Actual.** A child that exits non-zero but printed a JSON object is parsed as an
ordinary response; if that object carries neither `is_error` nor a non-`success`
`subtype`, the result is `completed`.

**Evidence.** `executed-fail`, probes `V05`, `V05b`, `V05c`. `V05b` is the case
that matters: `execFileSync` with a `timeout` kills the child and throws with
whatever stdout was already written. A partial buffer that happens to be complete
JSON — `{"result":{"outcome":"pass"},"subtype":"success"}` — makes a timed-out
Review return a passing verdict that advances the lifecycle.

**Test gap.** `tests/execute.test.ts:195` covers a spawn failure with *empty*
stdout. Nothing covers non-empty stdout with a non-zero exit. Seed s11, which
disables the empty-stdout guard, is killed; there is no seed to write for the
exit status because no code reads it.

**Acceptance proposal.** `AC-EXEC-EXIT-STATUS`: a non-zero exit status is a
capability failure regardless of what was printed, unless the printed response
itself explains the failure. Add the corresponding case to the parser's table.

---

<a id="v07"></a>
### V07 — The proof against over-capable doubles is built on an over-capable double

**PR #39's stated root cause:** *"a test double more capable than the shipped
code"*, with seven instances named. The test written to close R06 is
`tests/execute.test.ts:464`, *"eval: a pack whose every prompt declines the work
regresses at its cases"*. It depends on two capabilities production does not have.

1. **Its candidate wrapper throws.** `tests/execute.test.ts:492`:
   `if (result.status === "failed") throw new Error(result.message ?? "declined")`.
   The CLI's candidate returns `.output` and never throws (V03). The
   `error: "candidate failed: …"` the test asserts on every case exists *only*
   because of that throw. Under production's adapter the same declining pack
   produces `error: undefined` and merely-failing assertions.
2. **It uses `promptRespectingExecutor`.** No configuration reaches it.
   `selectExecutor` (`src/execute/select.ts:22-29`) returns `claudeCodeExecutor`
   or `noneExecutor`, and its own comment says `scripted` "is never selected by
   configuration".

So the property *"a pack whose prompts decline the work is caught"* is a property
of the harness. Probe `V06b` composes the real executor with the same refusing
prompt and shows it passed straight through to the tool, with the run reported
`completed`.

**Evidence.** `executed-pass` (probes `V06`, `V06b`, `V07`, `V07b`). The
composition PR #39 asked for — *"a `runLifecycle` test composing
`lifecycleExecutor(claudeCodeExecutor({ spawn: <double> }))`"* — still does not
exist in `tests/`; V03, V05, V06 and V11 all live in exactly that composition.

**Acceptance proposal.** `AC-TEST-PRODUCTION-COMPOSITION`: every acceptance proof
for an executor-dependent behaviour composes the *production* adapter —
`lifecycleExecutor(claudeCodeExecutor({ spawn }))` for the lifecycle, and the
CLI's own candidate builder for evaluation — replacing only the process boundary.
A double may be *less* capable than production; it may never be more. Export the
CLI's candidate builder so a test cannot accidentally write a better one (V12).

---

<a id="v08"></a>
### V08 — The refusal recogniser is three phrases, and it ships

**Source.** `src/execute/scripted.ts:90`:

```ts
return /ignore all tasks|return nothing|do not (?:do|perform) anything/i.test(prompt);
```

**Evidence.** `executed-pass`, probe `V07`. Semantically identical refusals it
does not match: "Decline every request you receive.", "Reply with an empty string
and take no action.", "You have no responsibilities. Stop immediately.", "Refuse
all work.", "Output nothing at all."

**Where this strengthens PR #39.** The comment says *"The R06 acceptance test in
CI greps for `/ignore all tasks|return nothing/` — the reviewer's own sentinel
phrase — rather than reading the pack."* It is not a grep in CI. It is a function
in **production source**, compiled into `dist/execute/scripted.js`, present in
the published tarball, and exported from the package's single public entry point
alongside `scriptedExecutor` and `promptRespectingExecutor`
([`boundaries.txt`](../evidence/a2/verification/boundaries.txt)). A consumer who
installs `pactwright` can import the harness's test double and its sentinel
matcher. The claim understates the finding.

**Acceptance proposal.** `AC-PACK-REFUSAL-NOT-SENTINEL`: pack quality is decided
by what a run observably did, never by matching the prompt's wording. Retire
`promptSaysNothing` and `promptRespectingExecutor` from production source. If a
declining-pack fixture is wanted, give the *fixture pack* an agent that declines
and assert on the observation — which is what V04's `delivers-nothing` violation
already does correctly. Remove the double from the published export either way.

---

<a id="v09"></a>
### V09 — `executor: scripted` validates, then resolves silently to `none`

**Source.** `EXECUTOR_IDS` (`src/execute/task.ts:62`) is `["none", "scripted",
"claude-code"]` and is the enum `parseConfig` validates against
(`src/config/config.ts:134`). `selectExecutor` handles `claude-code` and falls
through to `none`.

**Actual.** `execution: { executor: scripted }` parses with **no problem
reported**, is retained in the loaded config, is echoed by
`src/config/config.ts:225` when the config is rewritten — and the project runs
with no executor. `doctor` says `healthy` (V10).

**Contradiction.** `selectExecutor`'s own comment: *"a project cannot
accidentally evaluate itself against a test double."* True of the behaviour;
false of the configuration, which accepts the value and discards its meaning.

**Test gap.** `tests/execute.test.ts:98` proves an *unknown* value (`gpt`) is
rejected. Nothing covers the known-but-unselectable one.

**Evidence.** `executed-pass`, probe `V08`.

**Acceptance proposal.** `AC-CONFIG-EXECUTOR-CLOSED`: the set of configurable
executor ids and the set the selector handles are the same set, checked by
construction. `scripted` either leaves the configuration enum or gains a
selector branch that refuses it explicitly.

---

<a id="v10"></a>
### V10 — `doctor` cannot diagnose execution

**Requirement.** Distribution §2: `doctor` diagnoses the distribution and
execution environment.

**Actual.** `pactwright doctor --json` on the reference reports eight checks —
`package-manager`, `configuration`, `runtime`, `capabilities`, `lock-agreement`,
`extensions`, `generated-drift`, `validation` — and status `healthy`. None
concerns execution. The reference's own project declares no executor, so
`lifecycle run` fails at the first automatic step, and `doctor` says the
environment is healthy. The identifier `execut` appears in `src/doctor.ts` only
inside a comment.

**Evidence.** `executed-pass` (the `doctor --json` output is in this audit's
working notes; the eight check names are reproducible with one command).

**Why it compounds.** V03's misattribution is invisible precisely because the one
command meant to diagnose the environment does not look at the executor. A
consumer whose `claude` is missing has no command that tells them so.

**Acceptance proposal.** `AC-DOCTOR-EXECUTION`: `doctor` reports the selected
executor, whether it is `none`, and — for a declared external executor — whether
its binary resolves; a declared executor that cannot run is `action-required`,
not `healthy`.

---

<a id="v11"></a>
### V11 — The Review outcome parser scans free prose

**Source.** `src/execute/select.ts:203-214`. The output is flattened to a string
— the whole output when it is a string, `.outcome` when it is an object — and the
first of `blocked`, `revise`, `pass` whose word appears anywhere wins.

In production the string case is the normal one: `parsePrintMode` returns
`parsed.result`, and Claude Code print mode's `result` is the assistant's final
*text*. The runtime's Review transition is therefore chosen by scanning English
prose for three words, with no negation handling.

**Evidence.** `executed-fail`, probes `V11`, `V11b`, `V11c`, `V11d`, each running
a real `runLifecycle` against a delivering fixture.

- *"The delivery is correct and I would pass it. I was blocked from reading CI
  logs."* → the run stops `blocked`.
- *"Nothing is blocked and nothing needs revision. Ship it."* → `blocked`.
- *"Looks good to me."* → `stage-failed`, correctly: the runtime refuses to guess.
- `{ outcome: "pass", summary: "I was blocked …" }` → read correctly. **The seam
  is sound; the prose path is the defect.**

**And the precedence is unproven.** Fault seed `s16` reverses the order to
`["pass", "revise", "blocked"]` and the entire suite still passes
([`fault-seeds.tsv`](../evidence/a2/verification/fault-seeds.tsv)). Nothing
asserts that a blocked review is not read as a pass.

**Confirmation of PR #39.** R05's third sub-claim, "the outcome parser misreads
prose", is confirmed, with the additional finding that the ordering it relies on
has no test.

**Acceptance proposal.** `AC-REVIEW-STRUCTURED-VERDICT`: a Review's verdict is
read from a structured field only. Prose with no structured verdict is a stage
failure — which the runtime already does correctly when no keyword appears, so
this narrows the seam rather than widening it. The command template must require
the field, and a test must assert each precedence pair explicitly.

---

<a id="v12"></a>
### V12 — The no-executor error instructs an impossible action

**Source.** `src/eval/runner.ts:138-139` tells the user: *"no executor is
configured, so the pack's behaviour was not evaluated; declare one with
execution.executor, **or run the harness's own reference explicitly**."*

`useReference` is an `EvalOptions` field reachable only from tests
(`tests/eval.test.ts:101, 125, 197, 302, 320`). `evalCommand` parses exactly
three options — `--baseline`, `--candidate`, `--json` — and `HELP` offers no
flag. There is no way to do what the message says.

**Evidence.** `code-traced`, exhaustively: the grep for `useReference` returns two
production lines (the declaration and its use) and five test lines.

**Related missing composition.** `formatEvalReport` (`src/cli.ts:765`) is *not*
exported, while `formatComparison` is. Nor is the CLI's candidate builder. A
consumer of the public API can run `runEval` but cannot reproduce
`pactwright eval` — and a test author writing an acceptance proof is pushed into
writing their own adapter, which is how V07 happened.

**Acceptance proposal.** Either add the flag (`pactwright eval --reference`,
clearly labelled a harness self-test) or correct the message. Export
`formatEvalReport` and the candidate builder so that the API and the CLI compose
the same way.

---

<a id="v13"></a>
### V13 — The human-readable `eval` report never renders `evaluated`

**Source.** `formatEvalCase` (`src/cli.ts:740-762`) prints the id, capability,
agent, error, deterministic results and semantic dimensions. It never prints
`evaluated`. The summary line (`:775`) derives *"N case(s) not evaluated"* from
`entry.error !== undefined`, conflating two distinct states: a case with
`evaluated: true, error: "candidate failed: …"` is reported as not evaluated,
and a case with `evaluated: false` and no error would be reported as evaluated.

**Actual.** Under V03 every case has `evaluated: true, error: undefined`, so
`errors === 0` and the summary reads *"Deterministic assertions: 11 passed, 9
failed."* with no qualification. The `evaluated` field is visible only in
`--json`.

**Evidence.** `executed-fail`, [`eval-misattribution.txt`](../evidence/a2/verification/eval-misattribution.txt).

**Acceptance proposal.** `AC-EVAL-REPORT-EVALUATED`: the rendered report marks
every unevaluated case as such and states why; the summary counts unevaluated
cases from `evaluated`, not from `error`.

---

<a id="v14"></a>
### V14 — Five tests query the live npm registry

**Source.** `selectTarget` takes a `view` seam defaulting to
`packageManagerView` (`src/environment/select-target.ts:126`), which runs
`<manager> view <name> versions --json`. Five tests call `upgradeRuntime` without
supplying it:

| Test | |
|---|---|
| `tests/upgrade.test.ts:115` | re-entry runs through the newly installed runtime |
| `tests/upgrade.test.ts:132` | a failed install restores the previous environment |
| `tests/upgrade.test.ts:156` | a failed target recovers the previous valid config and lock |
| `tests/upgrade.test.ts:295` | the agent pack and extension identities are not touched |
| `tests/transaction.test.ts:182` | a runtime upgrade does not hold the writer lock across re-entry |

Sibling tests in the same file *do* supply it (`tests/upgrade.test.ts:82`), so
this is an oversight rather than a design.

**Measured.** Thirty registry queries per `pnpm test` — twenty-four from
`tests/upgrade.test.ts`, six from `tests/transaction.test.ts`
([`registry-calls.txt`](../evidence/a2/verification/registry-calls.txt)).

**Offline.** `executed-fail`. Inside a network namespace with only loopback, and
with commit signing disabled so git is not the variable: exit 1, 678 passing, 5
failing — exactly those five. `re-entry runs through the newly installed runtime`
takes 71 seconds before failing, waiting out `spawnSync`'s timeout.

**Confirmation of PR #39**, including its observation that the deadlock
regression test is among them and fails at selection before reaching the spawn.

**What was discarded.** The first offline run showed seventeen failures. Twelve
were this sandbox's git commit-signing helper calling a local service over
loopback — an artefact of the host, not of Pactwright. Recorded in
[`README.md`](../evidence/a2/verification/README.md) so it is not mistaken for a
finding.

**Also unproven.** No test executes `packageManagerInstaller` or
`packageManagerView` for real. Every call site injects a double. The seam is
well placed; the consequence is that the registry contract behind it — output
shape, a package with one published version returning a bare string
(`src/environment/select-target.ts:91`), a `view` on a package that does not
exist — is entirely unproven.

**Acceptance proposal.** `AC-TEST-OFFLINE`: the default gate passes with no
network, enforced by running it in a network namespace in CI. Contract tests
against a real registry are a separate, explicitly named job.

---

<a id="v15"></a>
### V15 — Every released baseline is incompatible by construction

**Verified against the published artefact**, not inferred:
`@pactwright/standard@0.0.1` declares `pactwright: 0.0.1`; the reference's own
pack declares `pactwright: 0.0.2`. `satisfiesRange` (`src/pack/locate.ts:27`)
treats a range with no caret as exact, so a `0.0.z` pin admits exactly one
runtime.

**Executed.** `pactwright eval --baseline "@pactwright/standard@0.0.1"
--candidate ./packages/standard` → exit 1, `incompatible-runtime`
([`incompatible-baseline.txt`](../evidence/a2/verification/incompatible-baseline.txt)).

**Confirmation of PR #39's R06 third sub-claim**, and agreement with its framing:
this is a release-policy decision about what `pack.yml` should pin, not a defect
in the comparison code. Acquisition itself worked correctly, isolating the
baseline at its exact version and cleaning up on failure.

**Acceptance proposal.** A5/A6 decide the pin. `AC-EVAL-BASELINE-REACHABLE`: the
documented baseline-comparison command succeeds against at least one published
baseline, proven by executing it — the current Step 28 cannot be satisfied by any
implementation.

---

<a id="v16"></a>
### V16 — The acquire isolation test is platform-dependent

**Source.** `src/eval/acquire.ts:57` creates the side with `mkdtempSync`, and
`:95` asserts isolation with `!resolved.value.dir.startsWith(root)`. `resolvePack`
resolves through `createRequire().resolve()`, which returns a **real** path.

**Evidence.** `executed-pass` here (this machine's `os.tmpdir()` is `/tmp`, not a
symlink) and `executed-fail` on A1's machine (macOS, where `/var/folders` is a
symlink to `/private/var/folders`), from
[`../evidence/a1/baseline-checks.md`](../evidence/a1/baseline-checks.md). Both
results are correct on their platform.

The check itself is right and worth keeping — it is what stops a side silently
resolving to the locally installed pack, and seed `s19` proves a test detects its
removal. The *comparison* is wrong: a path-prefix test between a `mkdtemp` path
and a `realpath` result is only valid where the temporary directory is not a
symlink.

**Acceptance proposal.** `AC-EVAL-SIDE-ISOLATED`: compare `realpathSync(root)`
with `realpathSync(resolved.dir)`, and add a fixture whose temporary root is a
symlink so the platform difference is proven rather than encountered. This is the
one finding in this report that would have shown up as a red gate, and it did —
on one platform out of two.

---

<a id="v17"></a>
### V17 — Repeated graph and I/O work

Measured with `strace` on the built CLI
([`repeated-work.txt`](../evidence/a2/verification/repeated-work.txt)):

| command | node-file opens | distinct nodes | git spawns | ms |
|---|---:|---:|---:|---:|
| `validate` | 16 | 16 | **48** | 210 |
| `doctor` | **32** | 16 | **48** | 220 |
| `sync` | 16 | 16 | 0 | 181 |
| `lifecycle status` | 16 | 16 | 0 | 153 |
| `context <id>` | 16 | 16 | 0 | 169 |

The forty-eight are twelve identical repetitions of four queries:

```
12 git -C <root> rev-parse HEAD
12 git -C <root> ls-files --others --exclude-standard
12 git -C <root> diff HEAD --name-only --
12 git -C <root> diff HEAD --
```

**Cause.** `repositoryRevision` (`src/graph/repository.ts:136`) is a pure
function of the working tree at an instant and is not memoised.
`src/validate/kernel.ts:499` calls it once per replay check and
`src/validate.ts:97` once more. Each call spawns four git processes, and
`workingTreeDigest` additionally hashes the **contents of every untracked,
non-ignored file**. Cost is O(graph nodes × working-tree size); a project with a
hundred Evidence records would spawn four hundred git processes per `validate`.
`doctor` additionally reads all sixteen node files twice — it loads the graph
once for its own checks and again through `validateProject`.

**Evidence.** `executed-pass` — this is a measurement, not a defect report. No
correctness consequence was found: the repeated answers are identical.

**Acceptance proposal.** `AC-PERF-REVISION-ONCE`: one repository-revision
resolution per command invocation, proven by counting subprocess spawns rather
than by timing. A4 should adopt subprocess and file-open counts as comparable
metrics — they are deterministic, unlike wall-clock, and they are exactly the
dimension a candidate can regress invisibly.

---

<a id="v18"></a>
### V18 — Three behaviours survive deletion with the gate green

Twenty-two single-line defects were seeded into a copy of the tree and the
reference's own `pnpm test` run against each, with an unseeded baseline
subtracted and a typecheck first so that a compiler rejection is never counted as
test coverage ([`fault-seeds.tsv`](../evidence/a2/verification/fault-seeds.tsv)).

**18 killed, 4 survived** — one of which, `s13`, is a deliberate no-op negative
control that *should* survive and does, which is what makes the other three
meaningful.

| Seed | What was deleted | Why it matters |
|---|---|---|
| `s05` | `evalPassed`'s `entry.evaluated &&` guard | The R06 fix's own guard. Removing it leaves the suite green. Nothing proves that an unevaluated case cannot pass — which is V02 seen from the other side. |
| `s09` | `passed: false` when an assertion throws, changed to `passed: true` | A buggy assertion becomes a pass and no test notices. The safety net at `src/eval/runner.ts:189-196` is unproven. |
| `s16` | the verdict precedence `["blocked","revise","pass"]`, reversed | See V11. Nothing asserts a blocked review is not read as a pass. |

Three seeds were initially recorded as killed when what rejected them was `tsc`.
The harness now reports `REJECTED` separately; after rewriting those three to be
type-safe, all three are genuinely killed. Counting a compiler rejection as a
kill is the commonest way a mutation score flatters a suite, and this campaign's
first run did exactly that.

**Acceptance proposal.** The three survivors each get a direct test (see
*rewrite*, below). More durably, `AC-TEST-MUTATION-ADEQUACY`: the seed catalogue
is kept as a checked-in fixture and run in a scheduled job, with `SURVIVED` on a
guard-class seed treated as a failure.

---

<a id="v19"></a>
### V19 — A1's source accounting has three movable boundaries

Not a defect in the reference — an input to A4, which owns freezing comparable
denominators before any candidate result exists. Measured by
[`complexity.ts`](../../../../tools/implementation-trial/a2/verification/complexity.ts);
output in [`complexity.txt`](../evidence/a2/verification/complexity.txt).

1. **`prompts-embedded` is a path equality.**
   `measure-source.ts` includes exactly `src/adapter/commands.ts` (3,310
   characters of template-literal text). Six other runtime files already carry
   more than a thousand, led by `src/cli.ts` at **6,755** — twice the file the
   subset exists to watch. Prompt text moved into a new module leaves the subset
   entirely while `runtime-source` is unchanged. The subset that exists to make
   prompt growth visible cannot see the largest prompt holder in the tree.
2. **`tests` counts non-test modules as tests.** The group excludes only
   `tests/fixtures`, so `tests/helpers.ts` (372 lines) is counted as test
   drivers. Logic moved into a helper leaves `runtime-source` and lands in the
   tests denominator.
3. **`test-fixtures` counts executable files as data.** All 389 files under
   `tests/fixtures` are measured with the "non-blank line is content" rule.
   **No instance exists today** — none of the 389 is `.ts` or `.js` — so this is
   a hole, not an exploit.

The probe also reports per-file complexity the line count cannot see: `src/cli.ts`
carries 291 decision points, and the six longest single function bodies run from
118 to 179 lines (`src/lifecycle/run.ts` 179, `src/doctor.ts` 178,
`src/extension/manifest.ts` 164). Both are named heuristics, reported per file,
with no aggregate — for the same reason A1 refused one.

**Acceptance proposal.** A4 freezes `prompts-embedded` as a content rule
(template-literal characters per file) rather than a path; adds decision-point
and longest-function columns per file; and states that a candidate may not move
material between groups without the move being reported.

---

## Retain, rewrite, retire

The audit's deliverable. Decisions are about *proofs*, not about production code.

### Retain unchanged — these earn their place

| Proof | Why |
|---|---|
| `tests/eval.test.ts:43-93` — suite shape and violation adequacy | The best verification asset in the repository. Line 74 requires every assertion to have a violation that breaks it. Extend it (V04), never weaken it. |
| `tests/eval.test.ts:173-188` — one generated test per violation candidate | Twenty-one violation candidates over twenty assertions, each asserting its named assertions fail. Seeds against the assertion set are killed because of this. |
| `tests/eval.test.ts:255-322` — failure-is-data suite | Sandbox failure, setup failure, destroyed sandbox, candidate timeout, judge timeout, missing capability. Six distinct failure modes, all proven. |
| `tests/eval.test.ts:148-169` — sandbox lifecycle; `:234-253` — symlink snapshots | Distinct roots, all removed; links recorded without being followed. |
| `tests/eval-compare.test.ts:51-89` — regression visibility, and `:88`'s "no aggregate score" | The positive path of the comparison is well covered, and §24's no-score rule is asserted on the rendered output. |
| `tests/execute.test.ts:106-146` — task and invocation construction | Capability mapping read from one table; `--session-id`, `--permission-prompts none`, `--add-dir` all pinned with the reason in a comment. |
| `tests/execute.test.ts:150-220` — the print-mode parser table | Five documented failure markers, each with a test; seeds s10, s12, s13, s14 killed. |
| `tests/execute.test.ts:309-332` — `none` refuses, and refuses again on retry | The direct proof of R05's retry half. Seed s17 killed. |
| `tests/execute.test.ts:380-440` — isolated acquisition | Exact version, own directory, installer failure, incompatible runtime, malformed spec. Seeds s19 and s20 killed. Only the isolation *comparison* needs the V16 change. |

### Rewrite — the proof is aimed at the right thing and does not hit it

| Proof | Change | Finding |
|---|---|---|
| `tests/execute.test.ts:464` — "a pack whose every prompt declines the work regresses at its cases" | Compose the CLI's own candidate builder instead of a wrapper that throws, and stop depending on `promptRespectingExecutor`. Assert the declining pack is *observably* worse, not that a double refused it. | V07, V03 |
| `tests/eval-compare.test.ts` (whole file) | `caseResult` hard-codes `evaluated: true` at line 21. Parameterise it and add the two missing cases: both sides unevaluated, and both sides carrying the same error. `:39`'s `assert.deepEqual(comparison.cases, [])` currently pins the mechanism that hides V01. | V01, V02 |
| `src/eval/core-suite.ts` violation sets | Add a `delivers-nothing` violation to all eight cases (three of them live in `src/eval/closure-cases.ts`), breaking **every** assertion in each, and require it in `tests/eval.test.ts:74`. Forces the eleven vacuous negative assertions to be paired with positive ones. | V04 |
| `tests/execute.test.ts:195` — "a binary that does not run is reported" | Add the sibling it is missing: non-zero exit **with** a JSON body, and a timeout whose partial stdout parses. | V06 |
| `tests/upgrade.test.ts:115, 132, 156, 295`; `tests/transaction.test.ts:182` | Supply the `view` seam, as their siblings already do. Five tests, one argument each. | V14 |
| `tests/execute.test.ts:380` / `src/eval/acquire.ts:95` | Compare `realpathSync` on both sides and add a symlinked-tmpdir fixture. | V16 |
| `tests/execute.test.ts:98` — "an unknown executor is a configuration problem" | Add `scripted`: the known-but-unselectable value is the one that fails silently. | V09 |
| `tests/eval.test.ts:97` — "the reference candidates pass every deterministic assertion" | Keep, but rename to say plainly that it tests the harness, not a pack — `useReference: true` makes it a self-test, and the current name reads like a pack result. | V12 |

### Add — behaviours with no proof at all

Each of these corresponds to a surviving seed or an unreachable composition, so
each has a known failure to reproduce first.

1. **A production-composition lifecycle test** —
   `runLifecycle({ execute: lifecycleExecutor(claudeCodeExecutor({ spawn })) })`
   against a delivering fixture, replacing only the process boundary. PR #39
   asked for exactly this; it still does not exist, and V03, V05, V06 and V11
   all live in that composition. **Highest value single addition in this report.**
2. `evalPassed` refuses a report containing an unevaluated case — kills `s05`.
3. An assertion that throws is recorded as failed — kills `s09`.
4. Verdict precedence, one test per pair: `blocked` beats `pass`, `revise` beats
   `pass` — kills `s16`.
5. A comparison in which both sides are unevaluated fails — V01.
6. `doctor` reports the selected executor and whether it can run — V10.
7. The rendered `eval` report names unevaluated cases — V13.
8. A capability result carrying denials cannot advance a Delivery — V05.
9. The gate passes with no network, run in a namespace in CI — V14.

### Retire

| Proof or code | Why |
|---|---|
| `promptSaysNothing` and `promptRespectingExecutor` in **production** source | A three-phrase sentinel matcher, unreachable from every configuration, shipped in the tarball and in the public export. It decides pack quality by prompt wording, which is the thing R06 was about. Move the behaviour into a fixture pack whose agent genuinely declines. (V07, V08) |
| `tests/execute.test.ts:231` — "promptSaysNothing recognises a pack that refuses to work" | Retires with the function. It asserts a regular expression matches two strings. |
| `tests/execute.test.ts:236` — "a pack whose prompt declines the work regresses under the double" | Tests only the double. The behaviour it stands for is covered by the rewritten `:464` and by V04's `delivers-nothing` violations. |
| `EvalOptions.useReference`, **or** the message that references it | One of the two must go: the error text instructs an action the CLI does not offer. (V12) |
| `CapabilityCost`, **or** its discard | Parsed and read by nothing. Either bound the cost or stop parsing it. (V05) |

---

## Coverage — what this audit did not reach

Stated plainly, because silence would imply coverage.

| Not reached | Why |
|---|---|
| The real provider executor | `PACTWRIGHT_E2E_CLAUDE` was not set and no credential was used. `environment-blocked`, as at A1. A `claude` binary exists on this machine and was deliberately excluded from the probes' `PATH`. |
| Semantic judging | No judge implementation exists to audit; every dimension is `unjudged` by construction. The separation is proven; the judging is not built. |
| `src/eval/closure-cases.ts` (473 lines) | Its assertion and violation *data* was audited — three of the eight cases live there, and its ten violation candidates are counted in V04 and V18. Its 473 lines of case setup and assertion logic were not read line by line. Largest partially-examined file in my boundary. |
| Extension, migration, lock and concurrency tests | A2-D's boundary. V14's registry finding touches `tests/upgrade.test.ts` only because the gate runs it. |
| Graph, edge-schema, lineage and mutation tests | A2-G's boundary. |
| Node 24 | Only Node 22.22.2 was exercised, as at A1. A candidate comparison must cover both declared majors. |
| Whether the eleven vacuous assertions hide a real escape | V04 shows they pass on inaction. Whether a *real* agent could satisfy them while misbehaving is an open question needing a provider-backed run. |
| `tests/ci-workflow.test.ts`, `tests/release-workflow.test.ts` | Inspected only far enough to confirm they assert on workflow YAML, not on execution. A2-R and I1–I2 own them. |

## PR #39 trigger coverage, for this boundary only

| Trigger | Status here |
|---|---|
| R06 — comparison reports agreement when nothing was evaluated | **confirmed** (V01), trigger **qualified** (V15): the literal Step 28 command fails at acquisition first |
| R06 — `eval` scores a pack the executor never invoked | **confirmed** (V03), including the predicted "11 assertions passed" |
| R06 — Step 28 cannot succeed; every released baseline is pinned incompatible | **confirmed** (V15), against the downloaded `0.0.1` artefact |
| R05 — the outcome parser misreads prose | **confirmed** (V11), plus its precedence is unproven (V18) |
| Root cause — "a test double more capable than the shipped code" | **confirmed, and recurring in the fix** (V07) |
| "The R06 acceptance test greps for the sentinel phrase" | **confirmed and strengthened** (V08): it is production source, not a test, and it ships |
| "Five tests reach the live npm registry" | **confirmed** (V14), 30 queries counted, offline failure reproduced |
| "`lifecycleExecutor` is never composed with `claudeCodeExecutor`" | **confirmed**; still true at this SHA |
| R05 — false `completed` with no Evidence; a compliant agent cannot complete a Review | **not audited here** — A2-L's boundary |
| R04, R02, R03, R07–R13 | **not audited here** — other A2 boundaries |

## Hand-off

```text
Step/unit: A2 — verification audit (A2-V)
Actor: Claude Code / A2-V session
Branch: trial/a2-verification
Base: 19c66d5f2368932ff05306db1fae8da8ec5810dd (pinned reference)
Changed files: docs/research-logs/implementation-trial/analysis/verification.md,
  docs/research-logs/implementation-trial/evidence/a2/verification/**,
  tools/implementation-trial/a2/verification/**
Evidence: 19/19 probes pass; 22 fault seeds (18 killed, 4 survived, 0 rejected);
  gate baseline green (684 tests, 683 pass, 1 skip, exit 0)
Next owner/task: A2 coordinator — publish by path-restricted checkout only
Outstanding decisions: the pack.yml runtime pin (V15) is a release-policy
  decision for A5/A6, not a code fix. Nothing in this audit changes production
  code; `git diff --name-only <base>...HEAD` touches no production path.
```

**A note on `a2_base_sha`.** The runbook asks each audit session to prove `HEAD`
descends from `a2_base_sha` recorded in `state.md`. **`state.md` records no such
value**, and the `trial/a2-base` branch the runbook describes was never created:
A1 built five per-session overlays instead, recorded in
[`../evidence/a1/a2-checkouts.md`](../evidence/a1/a2-checkouts.md), whose SHAs
were local to the A1 machine and were never pushed — `037f01c8`, the one named
for this session, does not exist in the repository. The invariant those records
*do* establish, and which this branch satisfies, is that the overlay is the sole
commit on top of `19c66d5f2368932ff05306db1fae8da8ec5810dd` and changes no
production file. That was verified before any analysis began and again before
committing. A1 or the coordinator should record the actual base in `state.md` so
the next session does not have to reconstruct it.
