# Changelog

## 0.0.2 — unreleased

Corrective development release, published under the npm dist-tag `next`:
`pactwright` (runtime and CLI) and `@pactwright/standard` (default agent
pack). `0.0.1` was published against version 14 of the Checkpoint 1 runbook
and remains on the registry as the released baseline.

**Lifecycle.** The seven adapter commands are no longer the lifecycle's
topology. Contract authority, the fulfilment shape (`Brief → Delivery →
Review → Evidence`), execution policy and fine-grained progress are four
separate things. Progress persists under `.pactwright/execution/` and is not
graph truth: advancing a run leaves `project_graph_revision` unchanged.
`.pactwright/lifecycle.yml` moves to version 2 (`responsibilities` plus
`shape`); `pactwright upgrade` migrates a version 1 document and preserves
its policy.

**Closure.** All five Evidence preconditions are enforced before any
mutation, so a lineage can no longer be closed on work that was never
delivered or never reviewed. Delivering again after a Review invalidates that
Review. A Review asking for correction routes back along a route the shape
declares, bounded by policy.

**Validation.** `pactwright validate` implements the complete seventeen-rule
detection contract, including unauthorised Decisions in records that never
passed a mutation guard, unauthorised Gate progression, undeclared
transitions, unbounded corrective loops and — on request — replay provenance.
It reports the three replay identities: repository revision, Project Graph
revision and `environment_lock_hash`.

**Distribution.** New: `pactwright doctor`, `pactwright upgrade` and
`upgrade --to`, `pactwright agent-pack use` and `agent-pack upgrade`, and
`pactwright init --agent-pack <source> [--with <extension>]`. A plain `init`
now creates a scaffold and selects no agent pack — Pactwright never chooses
one for you. The Pactwright lock is load-bearing: `sync` refuses a lock that
disagrees with the installed environment instead of rendering from it.
Extension installation is delegated to the project package manager,
dependency-first.

**Evaluation.** The core suite adds Brief quality, Evidence accuracy and
lifecycle compliance. `pactwright eval --baseline <pack> --candidate <pack>`
reports regressions per capability, agent and case, with no aggregate score.

Public learning material was re-delivered through Pactwright itself
(`evidence-learning-path-realigned-and-checked-against-packed-artefacts-ee25a0b4`).

### Checkpoint 1 consolidation

The 19 September Checkpoint 1 review kept the checkpoint open. These changes
close the findings it reproduced, by consolidating responsibilities the
runtime already had rather than adding new ones.

**One lifecycle transition reducer.** `transition()` is the only thing that
applies a lifecycle transition. Completing a Gate step is refused unless the
Gate is resolved by an actor its authority admits — on every path, including
the adapter's — and a refusal leaves execution state byte-identical.
`pactwright lifecycle record gate` records that resolution, so a configured
human Gate no longer needs execution state edited by hand. Completion is an
outcome of routing, so a failed run no longer reports `completed` on retry;
it resumes and reports the failure again.

**One validation kernel.** `validateSnapshot()` judges an in-memory graph
state under the scopes a caller asks for, and `commitGraphChange` validates
the complete *proposed* state before any write. Relationship cardinality is
declared on the node schemas and checked for every record, so an orphan
Decision, Contract, Brief or Evidence, and one Decision resolving two
Intents, now fail through `validate` and the mutation gate alike.

**Verifiable closure.** Evidence carries a compact runtime-written closure
block — resolved shape, delivered and reviewed state identities, closing
Review step, Gate resolutions — so a completed lineage stays verifiable after
its run state is cleared. `repository_revision` replaces the `+dirty` marker
with a digest of tracked modifications and untracked files, so two different
delivered states at one commit are distinguishable and a change after Review
refuses closure.

**One capability executor.** `execution.executor` in `.pactwright/config.yml`
declares who performs automatic responsibilities: `none` (the default, which
refuses) or `claude-code`. `lifecycle run` and `pactwright eval` use the same
interface, and evaluation without a declared executor reports every case as
unevaluated instead of scoring the harness's own reference.
`eval --baseline … --candidate …` acquires each side at its exact version
into its own project.

**A repository writer lock.** `.pactwright/.lock` makes a graph mutation's
load → validate → write → reload atomic against other processes.

**One environment transaction.** `planEnvironmentChange` and
`applyEnvironmentPlan` own one managed file set — configuration, lifecycle,
both locks, `package.json` and every generated file — and every
environment-changing operation runs inside it. Four private snapshot
routines owning four different subsets are gone, and the render, which had
none, is covered. `restored` is the result of re-reading that set and the
installed versions, not a flag a caller sets.

**Acquisition before activation.** `pactwright upgrade` selects an exact
release instead of handing `pactwright@latest` to the package manager, and
`pactwright extension upgrade` installs the version it selects instead of
re-locking whatever was already on disk. A version whose declared
`pactwright` range this runtime does not satisfy is refused before it is
fetched.

**Extensions declare enforceable semantics.** An Extension manifest may
state, per node type, its required fields and required relationships, and
per edge type the node types permitted at each end; these are validated by
the same mechanics core records are. Schema changes are carried by declared,
versioned migrations that Pactwright applies itself — nothing an Extension
ships is executed — run inside the transaction, with `doctor` reporting a
pending one as action-required. The bare-list `graph:` form keeps its
meaning.

**Environment agreement is enforced, not just reported.** It is the
validation kernel's fifth scope, so `validate`, the mutation gate,
`lifecycle run` and `lifecycle record` all refuse a lock that no longer
describes the installed environment — not only `sync` and `doctor`.

**Permitted supersession.** `permittedOperations()` lists what a lineage
admits now, replacements included, and `lifecycle record` and `lifecycle
status` read the same list. Core §45's Brief change, Contract change and
Evidence correction are reachable from the commands; the generated command
text no longer tells an agent to stop when a command is "already completed".

Breaking changes to the package's public API: `isCurrent(id, edges)` is
replaced by `GraphIndex.isCurrent`; `RepositoryRevision.dirty` becomes
`workingTree`; `ExecutionState.completedSteps` becomes `visited` and
execution state moves to version 2, migrating version 1 documents on read;
`ExecutionStatus` gains `waiting-gate`; `EvalCaseResult` gains `evaluated`;
`PackageInstaller` moves to `environment/transaction` and its `spec` becomes
optional, meaning a frozen install; `UpgradeReport.restored` becomes a
computed boolean and gains `recovery`; `validateSnapshot` returns
`ScopedProblem[]`, every problem carrying the scope that found it and only
§57 rules carrying a rule id; `ExtensionManifest` gains `nodeSchemas`,
`edgeSchemas`, `schemaVersion` and `migrations`; `LockExtension` gains an
optional `schemaVersion`, omitted at version 1 so existing locks and their
`environment_lock_hash` are unchanged; `LineageStatus` gains `permitted`.

## 0.0.1 — 2026-09-01

First public development release, published under the npm dist-tag `next`:
`pactwright` (runtime and CLI) and `@pactwright/standard` (default agent
pack).

Delivered through Pactwright's own lifecycle, from accepted Checkpoint 1
Evidence:

- README Quick Start documenting the proven installation and Delivery
  command surface
  (`evidence-readme-quick-start-delivered-and-verified-553fab7f`).
- Core Delivery learning path — the Getting Started guide
  (`docs/getting-started.md`) and the runnable core Delivery example
  (`examples/core-delivery/`), verified end to end in a clean consumer
  fixture built from the bootstrap tarballs
  (`evidence-learning-path-delivered-and-fixture-verified-63e97869`).
