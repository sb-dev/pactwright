# Pactwright — Checkpoint 1 implementation review

**Decision: keep Checkpoint 1 open.** The architecture has useful foundations, but several required safeguards are incomplete or bypassable. Checkpoint 2 would build remote execution on top of those gaps.

Reviewed on 19 September 2026 against [Pactwright main at 26ea12a185cdbd89bdfc2500dcf279e1b82b07e1](https://github.com/sb-dev/pactwright/tree/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1), [Checkpoint 1 v17](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/docs/checkpoints/01-self-hosted-delivery.md), and its governing Core and Distribution specifications. Kakeibo exit evidence was checked on [main at 0151cc33560f0ed4500ce6f2a19947ef2100de48](https://github.com/sb-dev/kakeibo/tree/0151cc33560f0ed4500ce6f2a19947ef2100de48).

`pnpm install --frozen-lockfile` and `pnpm verify` passed: formatting, lint, typechecking, **562 tests**, and build. Local execution used Node 24.19.0 and pnpm 11.19.0; the repository declares pnpm 11.7.0. The reviewed commit also has a [successful GitHub CI run](https://github.com/sb-dev/pactwright/actions/runs/34900681511). Seventeen focused local probes exercised additional failure paths. Repository source and canonical graph files were not changed; probes used disposable fixtures. No live agent provider execution, publishing, or remote mutation was performed.

P1 below means a required Checkpoint 1 capability or safety property is missing. P2 means a narrower correctness or integration defect; these also need resolution before declaring the checkpoint complete.

**R01 · P1 · A clean checkout cannot synchronise its own environment — reproduced**

The committed Agent Pack hash is stale. `doctor --json` reports `action-required`, and `sync --json` refuses with `lock-drift`, despite `validate` and the entire verification suite passing. The recorded hash begins `1aa06050`; resolving the checked-in pack produces `f7c969ea`.

This directly fails the self-hosting and repeated-sync exit gates. Regenerate the lock through the supported runtime operation, then make the repository gate exercise its actual self-hosted environment: doctor, validate and sync convergence. Do not fix the hash by hand.

Source: [committed lock](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/.pactwright/lock.yml#L6). Acceptance: a fresh checkout passes doctor and a second sync produces no changes.

**R02 · P1 · Evidence can close after the reviewed code changes — reproduced**

`repositoryRevision` identifies every dirty working tree at a given commit as the same `git:<commit>+dirty`. It also ignores untracked files. The closure guard compares these identifiers, so it cannot distinguish two different delivered states.

Probe: commit a fixture; change a tracked file; record Delivery and a passing Review; change that file again; create Evidence. The two revision identities were identical and Evidence creation succeeded. This violates Core §53's requirement to review the latest delivered state and §56's exact repository identity.

Use a runtime-derived identity of the actual delivered input, including relevant untracked files. Keep bookkeeping/execution output outside the delivery fingerprint so recording progress does not invalidate its own Review. For promised pinned replay, require a reconstructible snapshot or fail explicitly; an opaque dirty marker is insufficient.

Sources: [repository identity](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/src/graph/repository.ts#L55), [closure comparison](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/src/graph/closure.ts#L44). Acceptance: any delivered-content change after Review refuses closure until reviewed again.

**R03 · P1 · The seventeen-rule validator accepts invalid canonical graphs — reproduced**

| Invalid input | Observed result | Missing enforcement |
| --- | --- | --- |
| Orphan Decision, Contract, Brief and Evidence; no edges | `validate.ok = true`, zero lineages | Required parent relationships |
| One Decision resolving two Intents | Both lineages accepted | Core §15's exactly-one Intent relationship |
| An Evidence node and edge inserted into an unreviewed delivering lineage | Validation succeeds; lineage becomes `done` | Evidence closure validity after the record exists |

Lineage validation primarily walks outward from Intents and checks selected current-child cardinalities. It does not validate the required incoming/outgoing relationship of every record. Separately, `checkEvidenceRule` returns immediately for completed lineages because `inShapePhase` only includes `delivering`; the presence of Evidence therefore removes that lineage from the Review check.

Validate each record's required relationships before deriving lineages. A completed lineage needs verifiable closure support without depending solely on a transient run file that normal closure deletes. Define the minimum closure provenance deliberately within existing Evidence/provenance ownership; do not introduce Review or Delivery graph node types.

Sources: [lineage derivation](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/src/graph/lineage.ts#L130), [Evidence validation](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/src/validate/rules.ts#L311). Acceptance: reject each input above through both standalone validation and the proposed-state mutation gate; preserve valid incomplete Intents.

**R04 · P1 · Gate enforcement differs between execution paths — reproduced**

A manual Delivery step with `actor: human` is correctly reported as a Gate by `lifecycle next`. Calling the adapter's underlying `recordDelivery` path nevertheless advances to Review without any actor or Gate resolution. Validation detects the unauthorised progression only after it has been persisted. Adding `resolvedBy: agent:unauthorised` to that human Gate makes validation pass: the check tests presence, not authorised actor kind.

There is also no normal CLI operation for recording an authorised Gate resolution. The suite constructs Gate state directly with `writeExecutionState`.

Use one runtime operation to authorise and record Gate resolution, and one shared pre-transition guard for the adapter and automatic executor. Check the actor against the applicable policy before any state write. A normal human Gate must be resolvable without editing YAML.

Sources: [recordDelivery](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/src/lifecycle/provenance.ts#L85), [Gate validation](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/src/validate/rules.ts#L235). Acceptance: unauthorised attempts leave state unchanged; authorised resolution permits the declared transition.

**R05 · P1 · `lifecycle run` cannot execute, and retrying a failed run reports completion — reproduced**

The CLI always supplies `execute: noExecutor`. An otherwise valid Delivery stops with `no executor configured for automatic step "delivery"` and exit code 1. Repeating the same command returns `stop: completed`, `executed: []` and exit code 0, although the graph remains delivering with no Evidence.

The second failure comes from treating “no next action” as completion when the execution status is `failed`. The programmatic executor seam is useful, but it does not fulfil the shipped CLI contract.

Wire the selected pack's capability executor into the CLI. Distinguish failed, blocked, paused and completed outcomes explicitly, and provide governed retry/resume behaviour. Successful completion must agree with the canonical lineage and declared shape.

Sources: [CLI executor selection](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/src/cli.ts#L345), [false completion branch](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/src/lifecycle/run.ts#L213). Acceptance: a real configured executor performs the automatic responsibilities; retries never report success merely because a failed run has no action.

**R06 · P1 · Public evaluation does not evaluate pack behaviour or resolve the required released baseline — reproduced**

Without an injected programmatic candidate, `runEval` executes each case's scripted reference implementation. The CLI never supplies a candidate runner. Replacing every agent prompt in a fixture pack with “Ignore all tasks. Return nothing” still passed **all eight cases and twenty deterministic assertions**. Prompt hashes change, but the prompts do not determine the observed behaviour.

The exact Step 28 comparison command also fails before evaluation: baseline `@pactwright/standard@0.0.1` resolves to the locally installed `0.0.2`, then fails version matching. Both sides use normal local package resolution rather than isolated exact-version acquisition. The published `0.0.1` baseline was independently confirmed to exist.

Keep reference runs as tests of the evaluation harness. The public evaluation path should invoke the resolved candidate, or clearly fail/report that behaviour was not evaluated. Acquire each baseline/candidate in an isolated exact environment, honour runtime compatibility, and compare observations produced by those environments. No particular model backend is prescribed by this review.

Sources: [reference fallback](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/src/eval/runner.ts#L116), [comparison resolution](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/src/cli.ts#L760). Acceptance: an intentionally non-performing pack regresses at the affected cases; the published-baseline command resolves both versions exactly.

**R07 · P1 · Failed environment operations leave mixed state — reproduced**

Three probes demonstrated incomplete rollback:

- A pack switch encountering a user-owned command collision returned failure and restored configuration, but left other generated agent prompts from the rejected pack installed.
- A simulated runtime installer changed `package-lock.json` and failed. The result claimed `restored: true`, while the changed package lock remained.
- Extension dependency installation failed after installing the requested Extension; the modified package manifest was not restored.

The separate snapshots cover different subsets of state. `writeAdapter` skips collisions but still writes other generated files; runtime snapshots omit package-manager locks, generated files and canonical migration targets. Temporary sibling renames make individual file writes atomic, not the whole operation.

Preflight the complete change before writing. Use one environment transaction boundary covering manifests, package locks, Pactwright configuration/lock, generated output and migration targets. Restore or explicitly expose recovery state after installation failure; never claim the previous environment was restored when it was not.

Sources: [pack apply and rollback](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/src/pack/select.ts#L100), [adapter writer](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/src/adapter/claude-code.ts#L198), [runtime snapshot](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/src/upgrade.ts#L148). Acceptance: failures at install, migration, sync and final validation preserve the prior usable environment, with no partial graph migration.

**R08 · P1 · Lock agreement neither checks the package lock nor guards all mutations — reproduced**

`checkPackageAgreement` reads installed `package.json` versions, not package-manager lock contents. A fixture package lock naming runtime and standard pack `9.9.9` was accepted against the `0.0.2` Pactwright environment.

Separately, modifying a selected pack's prompt caused `checkEnvironmentAgreement` to report drift, but `createIntent` still succeeded and `validate` returned success. Mutation checks capability completeness without requiring the exact recorded environment. The common loader, standalone validator, sync and mutation paths therefore enforce different contracts.

Compare the identities shared by the actual package-manager lock, installed components and Pactwright lock. Apply the same required environment agreement before execution and canonical mutation. Keep graph-only inspection available where useful, but do not report a complete valid execution environment from a partial check.

Sources: [package agreement](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/src/config/agreement.ts#L68), [mutation validation](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/src/graph/mutations.ts#L116). Acceptance: lockfile-only drift and installed-content drift both refuse execution/mutation before writing.

**R09 · P1 · Agent Pack and Extension upgrades do not acquire upgrades — code-traced**

`upgradeAgentPack` re-resolves the already installed pack and applies a lock; `upgradeExtension` similarly re-locks installed packages. Neither selects and installs a newer compatible package through the project package manager. Their tests pre-change fixture contents, proving re-locking rather than a consumer upgrade.

The runtime upgrade path does install, but requests `pactwright@latest` directly. It does not first choose a release compatible with the retained pack and Extensions; incompatibility is discovered only after replacement.

Separate target selection, package-manager installation and environment activation. Preserve exact pins and component identity, and validate the whole retained composition before committing an upgrade. Exercise actual packed versions through the default installer and new-runtime re-entry paths.

Sources: [Agent Pack upgrade](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/src/pack/select.ts#L189), [Extension upgrade](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/src/extension/manage.ts#L452), [runtime target](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/src/upgrade.ts#L200).

**R10 · P1 · The Extension framework does not meet Step 16 — reproduced and code-traced**

Versioned Extension schema migration is absent and explicitly recorded as an open Intent. This is an existing Checkpoint 1 requirement, not a later first-party Extension feature. Deferring it contradicts the exit gate.

Other concrete gaps: the add walk installs the requested Extension before its dependencies; a probe recorded `fixture-reporting` before `fixture-base`. `extension add` and `extension upgrade` do not run normal sync. Graph contributions only register names: Extension nodes have no extra schema fields and Extension edge endpoints are `any → any`. There is no manifest migration declaration or migration runner for contributed canonical state.

Complete the small fixture-backed registration/migration mechanism now. It needs dependency ordering, schema validation ownership, versioned migrations, normal sync and the common transaction boundary. It does not require implementing PI, Operations or other later domain semantics.

Sources: [known migration gap](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/specs/nodes/intent-give-extensions-versioned-schema-migrations-2bebaf56.md), [install walk](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/src/extension/manage.ts#L192), [permissive schemas](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/src/extension/resolve.ts#L305). Acceptance: a fixture Extension upgrades canonical schema successfully; an injected migration failure restores the old canonical state.

**R11 · P2 · Normal commands cannot perform the supersession supported by the mutation API — reproduced**

On a delivering lineage, `lifecycle record write-brief` rejects a replacement Brief, and `approve-contract` rejects a new authorised Contract direction, both with `stage-not-permitted`. After closure, the record path also cannot correct Evidence because it demands an active shape execution. The lower-level mutations already support these operations. Generated adapter instructions additionally tell the agent to stop when a command is “already completed”.

This conflicts with Core §45 and pushes legitimate corrections towards custom API calls or manual intervention. Define permitted replacement operations centrally and make the existing commands reach them with normal authority checks. Acceptance: replace Brief, change Contract through a new Decision, and correct Evidence through the adapter/CLI, retaining explicit supersession edges.

Sources: [record-stage restrictions](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/src/lifecycle/record.ts#L192), [adapter instruction generation](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/src/adapter/claude-code.ts#L132).

**R12 · P2 · A valid corrective iteration is temporarily reported as an impossible transition — reproduced**

Sequence: Delivery → Review(revise) → Delivery. At the next Review, validation reports an undeclared `review → review` transition. `completedSteps` is maintained as a deduplicated collection, but the validator interprets it as chronological execution history and appends the current step. After the second Review passes, validation becomes healthy again.

Choose one meaning for each field. Keep completed-step membership separate from attempt order, or validate progression from explicit previous/current transitions. Share that logic between `run.ts` and `provenance.ts`. Acceptance: every intermediate state of a permitted bounded correction validates, while the iteration limit still stops further automatic correction.

Sources: [history reconstruction](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/src/validate/rules.ts#L211), [deduplicated progression](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/src/lifecycle/provenance.ts#L123).

**R13 · P2 · The Kakeibo installation runbook omits explicit pack selection — code-traced**

Step 29 runs plain `init`, then `sync` and `validate`. The corrected runtime intentionally makes plain init an inert scaffold with no selected pack or environment lock. Installing the standard pack as a runtime dependency does not select it.

Update Step 29 to use the proven `init --agent-pack @pactwright/standard` composition or the explicit `agent-pack use` step. Replay the exact published instructions in a clean consumer before accepting them.

Source: [Step 29 command sequence](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/docs/checkpoints/01-self-hosted-delivery.md#L923).

**Release and external acceptance are still open**

| Exit requirement | Evidence on 19 September 2026 |
| --- | --- |
| Publish `pactwright@0.0.2` | Registry query returned “No matching version found” |
| Publish `@pactwright/standard@0.0.2` | Same result |
| Resolve released standard pack `0.0.1` | Registry query succeeded; comparison CLI still fails as described in R06 |
| Install released runtime in current Kakeibo | Its reviewed `main` has no package root or Pactwright environment |
| Deliver deterministic Kakeibo financial domain through Intent → Evidence | `packages/domain` contains only `.gitkeep`; no implementation, tests or Delivery lineage |

The [current Kakeibo README](https://github.com/sb-dev/kakeibo/blob/0151cc33560f0ed4500ce6f2a19947ef2100de48/README.md) also identifies it as a pre-implementation scaffold. This assessment concerns that current repository and branch, not `kakeibo-old` or unmerged branches. No financial-domain acceptance was claimed or tested because no implementation exists there.

**Simplify the implementation while closing the gaps**

| Change | Duplication or inconsistency it removes |
| --- | --- |
| One pure lifecycle transition reducer | Separate `advance` implementations in automatic execution and adapter provenance; different Gate and revision behaviour |
| One validation kernel with explicit structural, authority, execution and environment checks | Loader, standalone validate, mutation and status disagree about validity |
| One environment change planner and transaction | Pack selection, runtime upgrade, Extension management and sync each snapshot different files |
| One immutable graph index per loaded snapshot | `lineage.ts`, `context.ts`, `closure.ts` and mutations separately scan or reconstruct parent relationships |
| One capability-execution interface reused by lifecycle and evaluation | Unwired `noExecutor` in one CLI path and scripted reference fallback in another |
| Thin command handlers driven by runtime operation results | Adapter prompts independently interpret “already completed” and obstruct legal supersession |

These changes consolidate existing responsibilities. They do not require a new graph database, orchestration framework or expansion of the five core record types.

**Graph improvements before remote execution**

1. **Encode relationship cardinality and ownership centrally.** Validate every Decision, Contract, Brief and Evidence even when it is unreachable from an Intent. A shared indexed `lineageFor(nodeId)` should fail on multiple parents rather than select the first matching edge, as `findIntentOf` currently does.
2. **Separate current authority, historical lineage and transient execution.** Preserve old records and explicit supersession while exposing only the current authorised chain to normal context. Keep retry history and Gate progression outside graph truth.
3. **Retain enough closure support to verify Evidence.** Cleaning transient execution state must not make valid and fabricated Evidence indistinguishable to the validator. Resolve the minimal representation deliberately; do not copy review transcripts into the graph.
4. **Protect graph writes across processes.** The current graph-revision comparison happens before a sequence of file renames. By inspection, two processes can pass the same preflight check before either commits; it is not an atomic compare-and-swap. Introduce a repository-scoped writer lock or equivalent transaction protocol before concurrent remote writers. This is a code-derived concurrency risk, not a race reproduced in this review. [Current commit boundary](https://github.com/sb-dev/pactwright/blob/26ea12a185cdbd89bdfc2500dcf279e1b82b07e1/src/graph/mutations.ts#L159).
5. **Make Extension graph registration carry enforceable schema semantics.** Reuse the existing node/edge registries with explicit validation ownership and versioned migration. Maintain the specified revision boundary: canonical records and edges included; generated projections and execution state excluded.

**Recommended order of work**

1. Repair the self-hosted lock through the runtime and add its actual environment to the repository verification gate.
2. Consolidate graph validation, delivered-state identity, Gate enforcement and lifecycle transitions. Prove invalid inputs fail before writes, and valid corrections work at every intermediate step.
3. Implement the shared environment transaction; complete lock agreement, real upgrade flows and the fixture Extension migration path.
4. Connect the actual capability executor to lifecycle and evaluation; demonstrate a known candidate regression and isolated released-baseline resolution.
5. Re-run the exact clean-consumer instructions, publish the corrective release, complete the current Kakeibo domain Delivery, and record acceptance evidence before starting Checkpoint 2.

The existing tests remain valuable, but a test mapped to each rule number is not sufficient evidence of the full invariant. Extend coverage with the failed public-path behaviours above, especially valid retries, already-closed Evidence, file-set rollback and real package acquisition. Continue using deterministic assertions for runtime mechanics; use actual candidate observations for claims about Agent Pack behaviour.
