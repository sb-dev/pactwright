# Pactwright — Checkpoint 1 consolidation design

This log takes the 19 September Checkpoint 1 review and turns its closing recommendation into a design. The review ended with one compressed paragraph:

> The strongest simplification is to consolidate existing responsibilities into one lifecycle transition reducer, one validation kernel, one capability executor and one environment transaction. For the graph, prioritise explicit relationship cardinalities, shared indexed lineage resolution, verifiable Evidence closure and protection against concurrent writers. These changes preserve the five core record types.

What follows is that paragraph expanded to the level of interfaces, file ownership and proof, after re-reading the runtime at [main `26ea12a`](https://github.com/sb-dev/pactwright/tree/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1). Line references below are to that commit. `Core §N` means `docs/specs/01-pactwright-core-system-and-lifecycle.md`; `Distribution §N` means `docs/specs/02-distribution-agent-packs-extensions-and-evaluation.md`; `Delivery Graph §N` means the August engineering spec the graph code cites in its comments.

Everything here is a consolidation of responsibilities the runtime already has. Nothing adds a graph node type, a database, an orchestration language, or provider knowledge to Pactwright (Core §59, Distribution §25, redesign log §11).

---

## 1. Triage of the review's findings

The review reproduced ten P1 and three P2 findings. Every one of them held up against the source. The table gives the verdict, the consolidation that closes it, and the evidence that fixes its scope.

| Finding                                             | Verdict                                                       | Closed by                                                                    | Evidence at `26ea12a`                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R01 stale self-hosted lock                          | fix now, mechanical                                           | re-lock through the runtime; add the repository's own environment to `verify` | reproduced again on this checkout: `doctor --json` reports `lock-agreement: action-required`, recorded `sha256:1aa06050…`, resolved `sha256:f7c969ea…`. `upgradeAgentPack` is today's re-lock in disguise (`src/pack/select.ts:189-197`); it stays the lock-regeneration path until R09 separates acquisition |
| R02 Evidence closes after the reviewed code changes | fix now                                                       | §9 delivered-state identity, §4 kernel                                       | `repositoryRevision` ignores untracked files and gives every dirty tree the same `+dirty` suffix (`src/graph/repository.ts:61-66`); `reviewCoversLatestDelivery` compares those strings (`src/graph/closure.ts:44-68`)                                                                                  |
| R03 validator accepts invalid graphs                | fix now                                                       | §7 cardinality, §4 kernel, §9 closure                                        | lineage validation walks outward from intents only (`src/graph/lineage.ts:274-305`), so an orphan Decision, Contract, Brief or Evidence is never visited; `checkEvidenceRule` returns on `inShapePhase` before looking at a `done` lineage (`src/validate/rules.ts:311-323`)                              |
| R04 Gate enforcement differs by path                | fix now                                                       | §3 reducer                                                                   | `recordDelivery` advances with no Gate or actor check (`src/lifecycle/provenance.ts:85-93`); rule 14 tests presence of a Gate record, never the actor (`src/validate/rules.ts:236-247`); the same presence test in closure (`src/graph/closure.ts:156`)                                                  |
| R05 `run` cannot execute; retry reports completion  | fix now                                                       | §5 executor, §3 reducer                                                      | `execute: noExecutor` is hard-wired (`src/cli.ts:345-349`); "no next action" returns `completed` for a `failed` run (`src/lifecycle/run.ts:215-219`)                                                                                                                                                   |
| R06 evaluation does not evaluate the pack           | fix now (executor); isolated acquisition after §6             | §5 executor                                                                  | the reference fallback keeps only `task.root` and discards `instruction`, `capability` and `agent` (`src/eval/runner.ts:117-118`); `resolveSide` builds a synthetic config and resolves through ordinary Node resolution from the caller's `node_modules` (`src/cli.ts:760-773`, `src/pack/locate.ts:59-62`) |
| R07 failed environment operations leave mixed state | fix now                                                       | §6 transaction                                                               | four snapshot routines with four different file sets (`src/pack/select.ts:44-68`, `src/upgrade.ts:148-167`, `src/extension/manage.ts:94-130`, none in `src/adapter/claude-code.ts:198-276`); `addExtension` installs packages during its walk before any snapshot (`src/extension/manage.ts:192-241`)   |
| R08 lock agreement is partial and not enforced      | fix now                                                       | §4 kernel, `environment` scope                                               | `checkPackageAgreement` detects the package manager and discards it (`src/config/agreement.ts:74-75`), then reads `package.json` versions; agreement is enforced by `sync` only and reported by `doctor`; `validate`, mutations and `lifecycle run` never call it                                        |
| R09 upgrades do not acquire                         | fix after §6 lands                                            | §6 target selection                                                          | `upgradeExtension` calls no installer at all (`src/extension/manage.ts:452-495`); the runtime upgrade requests `pactwright@latest` without a compatibility check (`src/upgrade.ts:200`)                                                                                                                 |
| R10 Extension framework short of Step 16            | fix now, fixture scope only                                   | §11 registration, §6 transaction                                             | contributed schemas are `requiredFields: []` and `any → any` (`src/extension/resolve.ts:305-320`); the install walk starts from the requested extension (`src/extension/manage.ts:192`) although its comment promises dependency-first order; neither `add` nor `upgrade` runs sync                      |
| R11 supersession unreachable from commands          | fix now                                                       | §12 thin handlers                                                            | `assertPermitted` refuses any stage that is not pending (`src/lifecycle/record.ts:192-235`); the generated command text tells the agent to stop when a command is "already completed" (`src/adapter/claude-code.ts:142-148`); Core §45 permits all three replacements                                     |
| R12 corrective iteration reported as impossible     | fix now                                                       | §3 reducer                                                                   | both `advance` implementations deduplicate `completedSteps` (`src/lifecycle/provenance.ts:131-133`, `src/lifecycle/run.ts:133-135`); rule 11 reads the same field as chronology (`src/validate/rules.ts:211`)                                                                                            |
| R13 Kakeibo runbook omits pack selection            | fix now, one line in Step 29                                  | none                                                                         | outside this design; listed so the triage is complete                                                                                                                                                                                                                                                  |
| release and external acceptance                     | not design work                                               | §15 step 7                                                                   | unchanged from the review                                                                                                                                                                                                                                                                              |

Three things the review states more gently than the source warrants:

- **No runtime path writes a Gate record.** `ExecutionState.gates` is parsed, serialised, initialised empty and read by closure and validation, but the only producers in the repository are two tests (`tests/validation-contract.test.ts:301`, `tests/closure.test.ts:147`). Gate authority is therefore not "weakly checked"; it is unimplemented on the write side.
- **The pre-mutation gate runs structural validation only.** `commitGraphChange` validates nodes, edges, lineages and id immutability (`src/graph/mutations.ts:150-156`). Decision authority is checked only inside `recordDecision`, closure only inside `createEvidence`, and none of the execution-state or environment rules run before a write. Rule 13 keeps its own copy of the authority table (`src/validate/rules.ts:172-173`) beside `AUTHORISED_KINDS` (`src/graph/mutations.ts:320-323`).
- **The closure tests never pass through either `advance`.** `reachEvidenceClosure` hand-writes an execution state with `completedSteps: ["delivery", "review"]` and empty gates (`tests/helpers.ts:264-285`). Every closure and validation test that reaches Evidence starts from a state no runtime path can produce.

Smaller facts that shape the design: `loadProject` runs three times per typed mutation (entry, compare-and-swap at `src/graph/mutations.ts:163`, post-write at `:215`); `executionFor` synthesises a pristine run when the state file fails to parse (`src/lifecycle/engine.ts:129-134`); the evaluation sandbox still seeds a version 1 lifecycle document (`src/eval/sandbox.ts:24-42`); `GraphIndex` exists but is rebuilt on every derivation (`src/graph/lineage.ts:53`).

One deliberate departure from the review's wording is recorded in §9: verifiable closure after run-state cleanup needs durable closure facts with a canonical owner, and the only owner the specifications permit is Evidence itself. That is a schema change and a specification amendment, not just a validator change.

---

## 2. The shape of the consolidation

```text
today                                     target

run.ts advance                            transition()          one pure reducer
provenance.ts advance             →       gateSatisfied()

loader validation                         validateSnapshot()    one kernel, five scopes
validate.ts rules                 →       structural | authority | execution
mutations.ts pre-commit checks            | environment | replay
agreement.ts

noExecutor                                CapabilityExecutor    one interface
CandidateRunner reference fallback →      claude-code | scripted | none

select.ts begin/restore                   planEnvironmentChange()
upgrade.ts snapshot               →       applyEnvironmentPlan()
manage.ts writeDesiredState               one managed file set, one restore
writeAdapter (no restore)
```

The graph work underneath: one `GraphIndex` per loaded snapshot, relationship cardinality declared on the node schemas, a closure block owned by Evidence, and a repository writer lock around every write.

---

## 3. One lifecycle transition reducer

### Today

Two private `advance` functions apply a completed step and route the run. `src/lifecycle/run.ts:117-182` guards unknown steps, folds the delivered revision and review into the state, and returns a `stop` with a reason. `src/lifecycle/provenance.ts:123-149` does the same routing with a non-null assertion on the step lookup and collapses every stop into `status: "blocked"` with no reason. Both share `routeAfter` (`src/lifecycle/engine.ts:165-198`), so the routing agrees; the guards do not.

The only Gate check in the runtime is in the automatic loop, before the executor is consulted (`src/lifecycle/run.ts:223-231`). The adapter path (`recordDelivery`, `recordReview`) never reaches it. Nothing writes `gates`.

`completedSteps` is a membership set in both writers and a chronology in the validator. One revise loop produces the walk `delivery, review, review` and a spurious `undeclared-transition` until the next Review passes.

### Target

`src/lifecycle/transition.ts`, pure, no I/O:

```ts
export type LifecycleEvent =
  | { kind: "step-completed"; step: string; review?: ReviewOutcome; revision?: string }
  | { kind: "gate-resolved"; step: string; resolvedBy: string } // "<kind>:<id>"
  | { kind: "step-failed"; step: string; message: string }
  | { kind: "resume" }; // governed retry of a failed run at its current step

export type TransitionOutcome =
  | "advanced"
  | "waiting-gate"
  | "blocked"
  | "completed"
  | "failed"
  | "refused";

export interface TransitionResult {
  /** Identical to the input when the outcome is `refused`. */
  readonly state: ExecutionState;
  readonly outcome: TransitionOutcome;
  readonly reason?: string;
}

export function transition(
  shape: LifecycleShape,
  policy: LifecyclePolicy,
  state: ExecutionState,
  event: LifecycleEvent,
): TransitionResult;

/** Shared by the reducer, rule 14 and the closure check. */
export function gateSatisfied(step: ShapeStep, gates: ExecutionState["gates"]): boolean;
```

Rules the reducer owns, and nothing else does:

- A `step-completed` event for a Gate step (manual execution or a human actor; today's `isGate` and `isActionGate` become one predicate) is `refused` unless `gates[step]` exists and the resolver's kind is permitted for `step.actor` by the same `AUTHORISED_KINDS` table `recordDecision` uses. Refusal changes nothing, so an unauthorised attempt through the adapter leaves state exactly as it was.
- `gate-resolved` records `{ resolvedBy }` after the same actor check. This is the write side that does not exist today.
- Routing after a Review uses `routeAfter`, moved into this module. `blocked`, `iteration-exhausted` and `no-corrective-route` keep their reasons on every path.
- `step-failed` sets `failed` and keeps `currentStep`. `resume` returns a `failed` run to `running` at that step without touching history. That is the governed retry the review asks for; it needs no new policy field.
- Completion is an outcome of routing, never an inference from "no next action".

Execution state changes with it. `completedSteps` becomes `visited`, chronological, repeats allowed; the completed set is derived. `status` becomes `running | waiting-gate | blocked | failed | completed`. `EXECUTION_STATE_VERSION` moves to 2 with a read-side migration of version 1 documents. Core §28 makes the representation an implementation concern, so no specification changes.

```text
lifecycle run            → transition(shape, policy, state, event) → write
lifecycle record delivery
lifecycle record review  → the same call, then write
lifecycle record gate    → new stage: { step, resolved_by }
```

`lifecycle record gate` is a runtime stage under the existing `record` verb, so a human Gate is resolvable without editing YAML. Core §29 forbids a separate adapter `/gate` command; it says nothing against a runtime operation, and the adapter's `/deliver-brief` can tell the human which stage to run.

`run` reports the reducer's outcome. A `failed` run re-entered by `lifecycle run` emits `resume`, tries the step again through the executor, and reports `stage-failed` again if it fails. It never reports `completed` while the lineage is `delivering`.

### Closes

R04, R05 (the false-completion half), R12.

### Bounded by

Core §25 invariants 4, 7 and 8; Core §31 (a Gate changes progression only); Core §32 (declared routes only); Core §54 ("enforcing gates and authority" is a runtime responsibility); Core §28.

### Proof

- `tests/lifecycle-transition.test.ts`: table tests over shape, policy, state and event. Gate refused for `agent:*` on a human Gate, permitted for `human:*`; revise loop to the bound then `iteration-exhausted`; `blocked`; `step-failed` then `resume`; forward to `completed`.
- `tests/helpers.ts`: `reachEvidenceClosure` drives the reducer from `beginExecution` through `step-completed` events instead of writing a literal, so every closure test uses a reachable state.
- A corrective-loop-then-validate test: Delivery, Review `revise`, Delivery, then `validate` at every intermediate state is healthy (R12 acceptance).
- The R04 probe: `recordDelivery` against a human-gated Delivery step with no Gate record throws and leaves the state file byte-identical.

---

## 4. One validation kernel

### Today

Seven entry points validate different subsets:

| Path                       | Structural | Authority          | Gate          | Execution | Closure                    | Environment |
| -------------------------- | ---------- | ------------------ | ------------- | --------- | -------------------------- | ----------- |
| `loadProject`              | yes        | no                 | no            | no        | no                         | no          |
| `validateProject`          | yes        | rule 13, kind only | presence only | rules 10, 11, 15 | rule 12, `delivering` only | no          |
| `commitGraphChange`        | yes        | `recordDecision` only | no         | no        | `createEvidence` only      | no          |
| `recordDelivery`/`Review`  | load only  | no                 | no            | writes    | no                         | no          |
| `runLifecycle`             | yes        | via policy         | before executor | writes  | via `createEvidence`       | no          |
| `sync`                     | yes        | no                 | no            | no        | no                         | yes         |
| `doctor`                   | yes        | via `validate`     | via `validate` | via `validate` | via `validate`      | yes         |

`validateProject` reports the environment lock hash but never checks agreement (`src/validate.ts:88`). `checkPackageAgreement` compares installed `package.json` versions, not the package-manager lock, and skips a component it cannot find in `node_modules`.

### Target

`src/validate/kernel.ts`. `rules.ts` keeps `VALIDATION_RULES`, the ids and the messages; its logic moves here.

```ts
export type ValidationScope = "structural" | "authority" | "execution" | "environment" | "replay";

/** An in-memory graph state: what is on disk, or a proposed state before a write. */
export interface GraphSnapshot {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly Edge[];
  readonly records: readonly CanonicalRecord[];
  readonly index: GraphIndex; // §8
  readonly registries: ComposedRegistries;
  readonly shape: LifecycleShape;
  readonly policy: LifecyclePolicy;
  readonly executions: readonly ExecutionState[];
  readonly config: PactwrightConfig;
  readonly lock: LockFile;
  /** Absent when the caller has not resolved the installed environment. */
  readonly installed?: InstalledEnvironment;
}

export interface InstalledEnvironment {
  readonly runtimeVersion: string;
  /** Identities the package-manager lock records for pactwright, the pack and each extension. */
  readonly packageLock: ReadonlyMap<string, { version: string; source: "registry" | "workspace" | "path" }>;
  readonly resolved: DesiredState; // resolveDesiredState against what is installed
}

export function validateSnapshot(
  snapshot: GraphSnapshot,
  scopes: ReadonlySet<ValidationScope>,
  replay?: ReplayBase,
): readonly RuleProblem[];
```

Scope contents:

- `structural`: the loader's node, edge and lineage checks; the per-record relationship cardinality of §7; rule 16.
- `authority`: rule 13 through the one `AUTHORISED_KINDS` table.
- `execution`: rules 10, 11, 14, 15 over `visited`, using `gateSatisfied`; rule 12 through the closure check of §9 for every Evidence, `done` lineages included.
- `environment`: runtime version against the lock; package-manager lock identities against the Pactwright lock for every package-backed component (`workspace:` links are path sources with a version; a package-backed component missing from the package lock is a disagreement, not a skip); re-resolution drift through `compareLocks`.
- `replay`: rule 17, only when a `ReplayBase` is supplied.

Who calls which scopes:

```text
loadProject                 structural
commitGraphChange           structural + authority + execution   on the merged proposed snapshot, before any write
lifecycle run / record      structural + authority + execution + environment
validate                    all four, + replay when requested
doctor, lifecycle status    reuse the same result; doctor adds package-manager detection and drift
sync                        all four before rendering
```

The loader builds the snapshot once and hands it to the mutation. A typed mutation loads once, validates the merged proposal in memory, takes the writer lock (§10), re-checks the revision, writes, and reloads once. Three loads become two.

Rule 12 for a `done` lineage becomes possible only because Evidence carries its closure block (§9); today the rule has nothing to read once the run file is deleted.

### Closes

R03 (rows 1 and 2 through §7; row 3 through §9), R08, and the loader/validate/mutation disagreements in the simplification table.

### Bounded by

Core §57 ("validation should fail before canonical mutation where possible"); Distribution §12 (the two locks "must agree on the installed Pactwright and package-backed component versions they both identify"); Distribution §13; Checkpoint Step 9 ("use the same validation mechanics before canonical mutation wherever possible").

### Proof

- `tests/validation-contract.test.ts` keeps one failing fixture per rule; its meta-test now also asserts each rule is reachable through the mutation gate.
- The three R03 inputs (orphan records, one Decision resolving two Intents, Evidence inserted into an unreviewed lineage) fail through `validate` and through `createIntent` on the same fixture.
- Lockfile-only drift (a `pnpm-lock.yaml` naming `9.9.9`) and installed-content drift (a modified pack prompt) each refuse `createIntent` and `lifecycle run` before any write, with the state directory byte-identical afterwards.
- `validate --json` on a valid project reports `environment: ok`; on a drifted one it reports the same problems `doctor` does.

---

## 5. One capability executor

### Today

`ActionExecutor` (`src/lifecycle/run.ts:24-55`) and `CandidateRunner` (`src/eval/case.ts:97-119`) ask for the same work: a capability, the pack agent that implements it, an instruction, a root, and a structured result. The only implementations are `noExecutor` and the evaluation's reference fallback, which ignores everything but the sandbox root. The CLI never supplies either seam (`src/cli.ts:345-349`, `:804-805`, `:866`). Replacing every prompt in a pack changes hashes and nothing else.

### Target

`src/execute/`:

```ts
export interface CapabilityTask {
  readonly capability: string;
  readonly agent: { readonly key: string; readonly prompt: string; readonly skills: readonly string[] };
  readonly instruction: string;
  readonly root: string;
  readonly context?: DeliveryContext;
}

export interface CapabilityResult {
  readonly status: "completed" | "failed";
  /** The agent's structured proposal; the runtime decides what becomes graph truth. */
  readonly output: unknown;
  readonly message?: string;
  readonly cost?: { readonly inputTokens: number; readonly outputTokens: number };
}

export interface CapabilityExecutor {
  readonly id: "claude-code" | "scripted" | "none";
  invoke(task: CapabilityTask): Promise<CapabilityResult>;
}
```

`CapabilityTask` is `CandidateTask` promoted out of evaluation; `CandidateRunner` becomes `executor.invoke`.

Lifecycle side. `run.ts` keeps `ActionExecutor` as a thin adapter over the interface: a `LifecycleAction` becomes a task whose capability and instruction body come from `COMMAND_TEMPLATES` (`src/adapter/commands.ts`), so the interactive `.claude/commands/*.md` and the headless path cannot diverge. Responsibility actions read their capability from the same table instead of a second one. The executor returns a proposal; the runtime performs the typed mutation or the `transition` event itself. The agent never runs `lifecycle record` inside an automatic step, which is what double-advanced the state in the September measurement.

Evaluation side. `runEval` takes the same executor. `scripted` replays the case references and is the harness's own test double. Without a configured executor, a case reports `evaluated: false` with a reason and the suite cannot pass; it never silently scores the reference.

Selection is declared in `.pactwright/config.yml`:

```yaml
execution:
  executor: claude-code # or none (default)
```

Opt-in, never inferred from a binary on `PATH`. With `none`, `lifecycle run` fails exactly as today, which remains the safe state.

Isolated acquisition for comparison. `eval --baseline @pactwright/standard@0.0.1 --candidate …` acquires each side into a temporary project through the existing `PackageInstaller` seam (`src/upgrade.ts:40-44`) at the exact version, checks the pack's `pactwright` range against the running runtime, and resolves from that directory. It never resolves from the caller's `node_modules`, so `0.0.1` cannot resolve to an installed `0.0.2`.

### Closes

R05 (the execution half), R06.

### Bounded by

Model-backed execution log §3 (one mechanism, two seams), §4 (no provider knowledge), §10 (agent proposes, runtime disposes), §11 (opt-in); Core §54 ("invoking the required semantic capability"); Distribution §21 and §24 (per-dimension observations, no aggregate score).

### Proof

- Offline tests of task construction from each command template and of result parsing; no subprocess.
- A `scripted` executor test that the lifecycle loop completes Delivery → Review → Evidence through the interface and that the closure block (§9) is written.
- The review's acceptance: a fixture pack with every prompt replaced by "Ignore all tasks. Return nothing" regresses at the affected cases under the `claude-code` executor in a manually run acceptance, and under a `scripted` executor that honours the prompt in CI.
- Baseline comparison against two local `file:` tarballs at `0.0.1` and `0.0.2` resolves both exactly and reports per-capability deltas.

---

## 6. One environment transaction

### Today

Every environment-changing operation carries its own snapshot:

| Operation                                   | Config | Lock | Lifecycle | `package.json` | PM lock | `.claude/**`              | Migration targets |
| ------------------------------------------- | ------ | ---- | --------- | -------------- | ------- | ------------------------- | ----------------- |
| `useAgentPack`, `upgradeAgentPack`          | yes    | yes  | –         | –              | –       | written by sync, not restored | –             |
| `upgradeRuntime`, `finishUpgrade`           | yes    | yes  | yes       | yes            | –       | written by sync, not restored | –             |
| `addExtension`                              | yes    | yes  | –         | mutated first, not restored | mutated, not restored | not synced | –  |
| `upgradeExtension`                          | –      | yes  | –         | –              | –       | not synced                | –                 |
| `syncProject`                               | read   | read | read      | –              | –       | written, no rollback      | –                 |
| `initProject`                               | create | via pack | create | –              | –       | mkdir + sync              | –                 |

`writeAdapter` skips a colliding file and writes the rest (`src/adapter/claude-code.ts:226-238`); a throw during renames leaves already-renamed files in place (`:252-257`). `upgradeRuntime` reports `restored: true` after restoring four files while the installer's changes to the package-manager lock remain.

### Target

`src/environment/transaction.ts`:

```ts
export interface EnvironmentPlan {
  readonly desired: DesiredState; // resolveDesiredState output
  readonly installs: readonly PackageChange[]; // post-order over extension dependencies
  readonly migrations: readonly Migration[]; // lifecycle v1→v2 today; Extension migrations (§11)
  readonly writes: readonly ManagedWrite[]; // every file the plan will touch
  readonly problems: readonly Problem[];
}

export interface TransactionSeams {
  readonly installer: PackageInstaller;
  readonly reentry?: Reentry;
}

export interface EnvironmentResult {
  readonly ok: boolean;
  /** True only when every managed file re-hashes to its snapshot. */
  readonly restored: boolean;
  /** What a human must do when restoration was impossible. */
  readonly recovery?: readonly string[];
  readonly problems: readonly Problem[];
}

export function planEnvironmentChange(root: string, desired: DesiredChange, seams: TransactionSeams): EnvironmentPlan;
export function applyEnvironmentPlan(plan: EnvironmentPlan, seams: TransactionSeams): EnvironmentResult;
```

The managed set is one list, owned by the transaction: `.pactwright/config.yml`, `.pactwright/lifecycle.yml`, `.pactwright/lock.yml`, `package.json`, the detected package-manager lock, every generated file under `.claude/agents` and `.claude/commands`, and every canonical file a migration will rewrite. The snapshot covers the whole list; restoration rewrites it and re-hashes it, and `restored` is the result of that comparison.

Order inside `apply`:

```text
preflight   resolve desired state, capability set, dependency post-order, migration dry run in memory
snapshot    the complete managed set
installs    through the package manager, dependencies first
migrations  in memory first, then written
config/lock
render      adapter output; a collision refuses the whole render
validate    kernel, all four scopes
commit      release the writer lock
```

Any failure after `snapshot` restores. A package install is undone by restoring `package.json` and the package-manager lock and running the manager's frozen install; the transaction still never becomes a package manager (Distribution §15).

Every caller becomes a plan: `useAgentPack`, `upgradeAgentPack`, `finishUpgrade`, `addExtension`, `upgradeExtension`, `removeExtension`, the `initProject` composition, and `syncProject` as a plan with no installs. The four private snapshot routines are deleted.

Target selection for R09 sits beside the transaction, not inside it:

```ts
export function selectTarget(
  component: { kind: "runtime" | "agent-pack" | "extension"; name: string },
  constraint: string, // the configured range
  retained: DesiredState, // what must stay compatible
  seams: { view: PackageView },
): { version: string } | Problem[];
```

It queries the manager (`pnpm view`, `npm view`) for versions satisfying the constraint, keeps those whose declared `pactwright` range and dependency ranges are satisfied by the retained composition, and picks the newest. Selection, installation and activation are three steps with three results, as the review asks.

### Closes

R07, R09 (with `selectTarget`), the transactional half of R10.

### Bounded by

Implementation Guide "Filesystem mutation" (plan → validate → write atomically → validate); Distribution §15 (delegation, no silent major upgrades, recoverability); Checkpoint Steps 16, 17 and 19.

### Proof

The review's three probes become fixtures, each asserting byte-identical restoration of every managed file and `restored: true` only when that holds:

- a pack switch whose render collides with a user-owned command;
- an injected installer that rewrites `pnpm-lock.yaml` and then fails;
- a dependency install that fails after the requested extension installed.

Plus: one-shot `init --agent-pack … --with …` and the stepwise path produce identical config, locks, environment hash and generated output (Checkpoint Step 16's own verify text); `upgradeExtension` against a fixture registry with a newer compatible version installs it, and against an incompatible one refuses before installing.

---

## 7. Explicit relationship cardinality and ownership

### Today

Cardinality lives in the lineage walk. `derive` reports at most one current Decision per Intent and exactly one selected Contract for `proceed` (`src/graph/lineage.ts:168-265`); `checkGlobalCardinality` reports at most one current Brief per Contract and one current Evidence per Brief (`:130-161`). Nothing checks that a Decision has an outgoing `resolves` edge at all, or that a Brief decomposes anything. `EdgeSchema` knows endpoints and acyclicity, not multiplicity (`src/graph/edge-schema.ts:25-35`). A Decision resolving two Intents passes because each Intent's walk sees one Decision.

### Target

Relationship requirements are declared on the node schema and checked for every record, reachable or not:

```ts
export interface RelationshipRule {
  readonly type: string; // edge type
  readonly direction: "out" | "in";
  readonly min: number;
  readonly max?: number;
  /** Conditional rules, e.g. `selects` only for a `proceed` Decision. */
  readonly when?: (node: GraphNode) => boolean;
}

export interface NodeSchema {
  readonly type: string;
  readonly requiredFields: readonly string[];
  readonly relationships: readonly RelationshipRule[];
  readonly validate?: (node: GraphNode) => readonly Problem[];
}
```

Core declarations, straight from Core §15:

```text
decision   resolves   out  exactly 1
decision   selects    out  exactly 1 when outcome = proceed, exactly 0 otherwise
brief      decomposes out  exactly 1
evidence   evidences  out  exactly 1
contract   selects    in   at least 1
```

These are structural: they hold across superseded records too, because a superseded Decision still resolved one Intent. The current-record rules (one current Decision per Intent, one current Brief per Contract, one current Evidence per Brief) keep their meaning and move from `lineage.ts` into the kernel, computed over the shared index.

Extension node and edge declarations carry the same fields (§11), so contributed types get real multiplicity rather than `any → any`.

### Closes

R03 rows 1 and 2.

### Bounded by

Core §15; Delivery Graph §21 "Current-lineage ambiguity"; Core §58 invariant 2.

### Proof

Fixtures for each declared rule, both directions of failure (missing and excess), through `validate` and through the mutation gate; the existing ambiguity fixtures unchanged.

---

## 8. Shared indexed lineage resolution

### Today

Parent discovery is written four times. `GraphIndex` is the only indexed one, rebuilt on every call (`src/graph/lineage.ts:53-102`, `:274-305`). `findIntentOf` walks one hop at a time with `edges.find`, taking the first matching edge and ignoring a second parent (`src/context.ts:66-91`). `lineageOf` in closure nests three full scans and takes `[0]` (`src/graph/closure.ts:178-196`). `isSuperseded` inside `currentSources` scans the edge list per candidate (`src/graph/mutations.ts:241-251`).

### Target

```ts
export class GraphIndex {
  static build(nodes: readonly GraphNode[], edges: readonly Edge[]): GraphIndex;
  node(id: string): GraphNode | undefined;
  isCurrent(id: string): boolean;
  sourcesOf(target: string, edgeType: string, nodeType?: string): readonly GraphNode[];
  targetsOf(source: string, edgeType: string, nodeType?: string): readonly GraphNode[];
}

export interface Resolved {
  readonly intent: GraphNode;
  readonly lineage: Lineage;
}

/** Throws `ambiguous-parent` when any hop towards the Intent has more than one structural parent. */
export function lineageFor(index: GraphIndex, nodeId: string): Resolved;
```

The index is built once per loaded snapshot and exposed as `project.graph.index`; a proposed mutation builds one for its merged state. `findIntentOf`, `lineageOf`, `runFor` and `currentSources` all become `lineageFor` or index calls. `isCurrent(id, edges)` as a free scanning function is removed. Context assembly (`lineageTree`, history) uses the index's buckets instead of four `filter` passes.

Failing on a second parent, rather than selecting the first, is the whole point: a record with two parents is invalid (§7), and an operation that quietly picked one would act on state validation rejects.

### Closes

The multi-parent half of R03; the "separately scan or reconstruct parent relationships" row of the simplification table; the O(E²) scans.

### Bounded by

Delivery Graph §21; Checkpoint Step 4 ("invalid ambiguity fails closed").

### Proof

`tests/lineage.test.ts` gains the two-parent fixture asserting `ambiguous-parent` from every former entry point; `tests/context.test.ts` and `tests/closure.test.ts` pass unchanged; a benchmark-style test over a few thousand synthetic edges confirms derivation stays linear.

---

## 9. Verifiable Evidence closure and delivered-state identity

### Today

The five Core §53 preconditions are checked before Evidence is created, against the run file (`src/graph/closure.ts:74-176`). The run file is then deleted (`src/lifecycle/record.ts:300`, `src/lifecycle/run.ts:283`). After that, a valid Evidence record and one written by hand are indistinguishable: rule 12 exits on the first line for a `done` lineage, and even if it did not, there is nothing left to read. Evidence itself has no required fields (`src/graph/schema.ts:95-101`).

Separately, the delivered-state identity is `git:<commit>+dirty` for every modified tree at a commit, and untracked files are not dirt (`src/graph/repository.ts:61-66`). The R02 probe passes closure because two different working trees share one identity.

### Target: a closure block owned by Evidence

Evidence gains runtime-written frontmatter:

```yaml
closure:
  shape: direct
  delivered_revision: git:9b393d6…+sha256:4c1a…
  reviewed_revision: git:9b393d6…+sha256:4c1a…
  review_step: review
  gates:
    delivery: human:samir
```

`createEvidence` writes it from the `ClosureCheck` it already computes; the caller cannot supply it. The run file is still cleared. Rule 12 then reads every Evidence record, on `delivering` and `done` lineages alike:

- the block is present and well-formed;
- `reviewed_revision` equals `delivered_revision`;
- `shape` and `review_step` name a resolved shape and a Review step in it;
- every Gate step the shape declares has an entry whose actor kind `gateSatisfied` accepts.

Evidence inserted by hand into an unreviewed lineage fails on the first check. A forged block is a question for git history and Graph Review, not for the validator, and the log says so rather than pretending otherwise.

Why Evidence, and not a durable file under `.pactwright/`: Core §14 says Evidence owns "verification performed" and "verification results", which is exactly what these five facts are; a file outside the graph is not canonical, does not move the graph revision, and cannot be checked from a clean clone. Why not a Review node: Core §13 forbids it. The block is compact and factual and reproduces neither the Contract, the Brief nor a transcript, which keeps it inside Core §14's limits.

This is a schema change to a core record. It needs Core §14 and §53 amended before the runtime relies on it (§14 below).

### Target: delivered-state identity

```ts
export interface RepositoryRevision {
  readonly commit?: string;
  /** sha256 over tracked modifications and untracked, non-ignored files, excluding bookkeeping. */
  readonly workingTree?: string;
  readonly id: string; // git:<commit> | git:<commit>+sha256:<hex> | none
}
```

The working-tree hash covers `git diff HEAD` content for tracked files and the content of untracked, non-ignored files, excluding `.pactwright/execution/**` and the generated files under `.claude/agents` and `.claude/commands`, so recording progress or re-rendering the adapter does not invalidate a Review of the delivered code. Untracked files count, because an agent's new file is delivered input.

A `+sha256:` identity records what was delivered but is not reconstructible from git. Replay validation (rule 17) therefore fails explicitly on it, which is what Core §56 and Principles §18 require; ordinary closure does not.

### Closes

R02, R03 row 3, the "verifiable closure" graph item.

### Bounded by

Core §14, §53, §56; Checkpoint Step 7 ("a delivery change after Review requires Review of the new delivered state before closure").

### Proof

- The R02 probe: commit, change, record Delivery and a passing Review, change again, `prepare-evidence` refuses with `latest-delivery-reviewed`.
- Untracked-file variant of the same probe.
- Evidence written by hand fails `validate` with rule 12 on a `done` lineage.
- The closure block survives `clearExecutionState` and moves `project_graph_revision` (it is canonical); execution-state changes still do not.
- Replay validation with a `+sha256:` repository revision fails explicitly.

---

## 10. Protection against concurrent writers

### Today

`commitGraphChange` compares the planned-against revision with a fresh load, then writes node files and `edges.yml` through temporary siblings and renames (`src/graph/mutations.ts:159-210`). Two processes can pass the comparison before either renames, and the second wholesale `edges.yml` rewrite drops the first's edge. There is no lock anywhere in `src/`. Execution-state writes and environment operations have no protection at all.

### Target

`src/graph/writer-lock.ts`:

```ts
export interface WriterLockOptions {
  readonly waitMs?: number; // bounded wait with backoff; default a few seconds
  readonly staleAfterMs?: number; // a lock older than this from a dead pid is reclaimed
}

export function withRepositoryLock<T>(root: string, fn: () => T, options?: WriterLockOptions): T;
```

The lock is `.pactwright/.lock`, created with `O_EXCL`, holding `{ pid, host, startedAt }`, released in `finally`. A live pid on the same host blocks; a dead pid or an over-age lock is reclaimed with a problem reported. It is held across load → validate → write → reload in every typed mutation, around every execution-state write, and around the whole environment transaction. The revision compare stays inside the lock as the cheap second check, so a caller that planned against a stale snapshot still gets `concurrent-modification`.

This is a file, not a database, and it answers a code-derived risk before Checkpoint 2 introduces remote writers.

### Closes

Graph improvement 4; the precondition for Checkpoint 2.

### Bounded by

Core §59 (no snapshot database); Implementation Guide canonical gap discipline ("automation branch/PR concurrency" stays open; this lock is process-local to one checkout and does not resolve it).

### Proof

Two worker processes call `createIntent` against one fixture simultaneously; with the lock both succeed and both records are in `edges.yml`. A stale-lock fixture (dead pid, old timestamp) is reclaimed; a live-lock fixture times out with `repository-locked`.

---

## 11. Extension registration with enforceable semantics

### Today

An Extension declares node and edge types as bare names (`src/extension/manifest.ts:133-154`); `extensionSchemas` turns them into `requiredFields: []` and `any → any` (`src/extension/resolve.ts:305-320`). There is no migration declaration, no runner, and `extension upgrade` re-locks without acquiring or migrating (`src/extension/manage.ts:452-495`). The install walk begins with the requested Extension (`:192`). This is the open Intent `intent-give-extensions-versioned-schema-migrations-2bebaf56`.

### Target

The manifest's `graph` block becomes structured and reuses the core schema types:

```yaml
graph:
  node_types:
    deployment:
      required_fields: [environment, exposure]
      relationships:
        - { type: deployed-as, direction: in, min: 1, max: 1 }
  edge_types:
    deployed-as:
      source_types: [evidence]
      target_types: [deployment]
  migrations:
    - { from: 1, to: 2, script: migrations/0002-exposure.js }
```

`extensionSchemas` maps these into the same `NodeSchema` and `EdgeSchema` the core uses. The migration runner is a transaction step (§6): each declared migration runs against an in-memory snapshot of the Extension's canonical records, the result validates through the kernel, and only then is it written under the writer lock. `doctor` reports a pending or half-applied migration as `action-required`. The dependency walk becomes post-order, and `add` and `upgrade` end with a normal sync inside the same plan.

Fixture Extensions only; no first-party semantics (Checkpoint Step 16). The revision boundary is unchanged: canonical records and edges in, generated projections and execution state out (Core §56).

### Closes

R10, and the fifth graph improvement.

### Bounded by

Distribution §10, §11, §15 ("explicitly defined, versioned migrations"); Checkpoint Step 16.

### Proof

A fixture Extension at version 2 upgrades canonical records from a version 1 fixture project; an injected migration failure restores the version 1 records and lock byte for byte; `fixture-reporting` installs `fixture-base` first; the Step 16 revision inclusion/exclusion proof runs through the real loader.

---

## 12. Thin command handlers and permitted supersession

### Today

`assertPermitted` allows only pending responsibilities, so a replacement Brief or a new Contract direction on a delivering lineage is `stage-not-permitted` (`src/lifecycle/record.ts:192-235`), and Evidence correction after closure demands an active run. The mutations already support all three. The adapter command text tells the agent to stop when a command is "already completed" (`src/adapter/claude-code.ts:142-148`).

### Target

One function in the kernel lists what is permitted now, including replacements:

```ts
export interface PermittedOperation {
  readonly stage: RecordingStage | "gate";
  readonly mode: "initial" | "supersede";
  readonly actor?: Actor;
}

export function permittedOperations(snapshot: GraphSnapshot, lineage: Lineage): readonly PermittedOperation[];
```

Replacements follow Core §45 exactly:

```text
write-brief       on delivering   → new Brief --supersedes--> old Brief; the old run is closed
approve-contract  on delivering   → new Decision and Contract supersede the current pair;
                                    the old Brief is no longer current; the lineage is `contracted`
prepare-evidence  on done         → new Evidence --supersedes--> old Evidence, with its own closure block
```

`recordStage` and `lifecycle status` read the same list, so a CLI command and an adapter command can never disagree about what is legal. The generated command text becomes "run `lifecycle status`; act only on an operation it lists as permitted", and the "already completed, stop" sentence is removed.

### Closes

R11.

### Bounded by

Core §45; Core §55 (the runtime controls whether content becomes graph truth); Core §58 invariant 17.

### Proof

Replace a Brief, change a Contract through a new Decision, and correct Evidence, each through `lifecycle record` with the resulting `supersedes` edges asserted; the same three through the adapter fixtures; an unauthorised actor refused for each.

---

## 13. What stays out

- No new node types. Delivery, Review, Gate, attempt and revision remain processes or execution state (Core §13, §59).
- No graph database, snapshot store or archive. The writer lock is a file; the environment snapshot is in memory for one operation.
- No orchestration language. The reducer takes events; shapes and policy keep their current vocabulary.
- No provider registry, model router or task catalog. The executor is one subprocess or one scripted double.
- No GitHub state in any of the above.

---

## 14. Specification amendments that come first

Canonical gap discipline (Implementation Guide) says a runtime must not rely on semantics the owning specification has not adopted. Three items above need that:

1. **Core §14 and §53**: Evidence owns a compact closure block (shape, delivered and reviewed revisions, closing Review step, Gate resolutions), written by the runtime at `/prepare-evidence` and validated thereafter.
2. **Distribution §11**: an Extension manifest may declare required fields, relationships and endpoint types for its graph types, and versioned migrations for its canonical records.
3. **Distribution §3**: project configuration declares `execution.executor`, default `none`.

The execution-state changes (`visited`, `waiting-gate`, version 2) need none: Core §28 leaves representation to the implementation.

---

## 15. Order of work

The review's order holds. Two cheap foundations move ahead because everything after them is simpler with them in place.

1. **Self-hosted lock.** Regenerate `.pactwright/lock.yml` through the runtime, then add `doctor` and a double `sync` on the repository's own environment to the verification gate. R01.
2. **Writer lock and shared index.** §10 and §8. No semantic change; every later step writes under the lock and resolves through the index.
3. **Reducer, kernel, cardinality, closure.** §3, §4 (structural, authority, execution), §7, §9, with the Core §14/§53 amendment in the same change set. R02, R03, R04, R12, and the false completion of R05.
4. **Transaction, environment scope, Extensions.** §6, §4 (environment), §11, `selectTarget`, with the Distribution §11 amendment. R07, R08, R09, R10.
5. **Executor.** §5 wired to lifecycle and evaluation, isolated baseline acquisition, the regression demonstration, with the Distribution §3 amendment. R05, R06.
6. **Thin handlers.** §12 and the adapter text. R11.
7. **Release and acceptance.** Clean-consumer replay of the corrected Step 29, the corrective release, the Kakeibo domain Delivery. Unchanged from the review.

Each step's proof list is its acceptance; the review's per-finding acceptance lines map onto them one to one. When steps 1 to 6 are green, the exit-gate lines the review found open (self-hosting, closure preconditions, Gate authority, lock agreement, upgrade safety, Extension migration, evaluation of pack behaviour) are closed by construction rather than by a test per rule number.
