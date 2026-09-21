<!-- Captured verbatim by A1. Do not edit; corrections belong in findings, not in the capture. -->
**Source:** https://github.com/sb-dev/pactwright/pull/39
**Captured:** 2026-09-21T22:23Z via `gh pr view 39 --json body`
**PR opened:** 2026-09-20T22:43:19Z · **last updated:** 2026-09-21T07:24:57Z · **author:** sb-dev
**Head at capture:** `19c66d5f2368932ff05306db1fae8da8ec5810dd` (`review/checkpoint-1`) · **base:** `main`

---

Closes every finding the 19 September Checkpoint 1 review reproduced (R01–R13), by consolidating responsibilities the runtime already had rather than adding new ones.

Two research logs carry the reasoning: the review itself, and the design that turned its closing paragraph into seven steps. The design log's §16 records delivery against each finding, section and step, and is the place to start reading.

## The consolidation

**One lifecycle transition reducer.** `transition()` is the only thing that applies a transition. Completing a Gate is refused unless an actor its authority admits has resolved it — on every path, including the adapter's — and a refusal leaves execution state byte-identical. `pactwright lifecycle record gate` records that resolution, so a configured human Gate no longer needs state edited by hand. Completion is an outcome of routing, so a failed run no longer reports `completed` on retry.

**One validation kernel, five scopes.** `validateSnapshot()` judges an in-memory state under the scopes a caller asks for, and the mutation gate validates the complete *proposed* state before any write. Relationship cardinality is declared on the node schemas, so an orphan Decision, Contract, Brief or Evidence — and one Decision resolving two Intents — now fail through `validate` and the mutation gate alike. Environment agreement is the fifth scope, enforced rather than only reported.

**One environment transaction.** One managed file set — configuration, lifecycle, both locks, `package.json`, every generated file — and every environment-changing operation runs inside it. Four private snapshot routines owning four different subsets are gone, and the render, which had none, is covered. `restored` is the result of re-reading that set and the installed versions, not a flag set by whoever believed they had restored.

**One capability executor.** `execution.executor` declares who performs automatic responsibilities. `lifecycle run` and `pactwright eval` use the same interface, and evaluation without a declared executor reports every case unevaluated instead of scoring the harness's own reference.

**Acquisition before activation.** `upgrade` selects an exact release instead of handing `pactwright@latest` to the package manager; `extension upgrade` installs the version it selects instead of re-locking whatever was on disk. An incompatible version is refused before it is fetched.

**Extensions declare enforceable semantics.** Required fields, required relationships and edge endpoint types, validated by the same mechanics core records are; schema changes carried by declared, versioned migrations that Pactwright applies itself. Nothing an Extension ships is executed.

**Verifiable closure and permitted supersession.** Evidence carries a runtime-written closure block, so a completed lineage stays verifiable after its run state is cleared. `permittedOperations()` makes Core §45's Brief change, Contract change and Evidence correction reachable from the commands, and `lifecycle record` and `lifecycle status` read the same list.

**A repository writer lock** makes a mutation's load → validate → write → reload atomic against other processes.

## Specifications

Five amendments landed first, in `fdee1be`, because the runtime must not rely on semantics the owning specification has not adopted: Core §14 (closure provenance, with a dated boundary for Evidence predating the block), Core §46 (`lifecycle record` and its Gate stage), Core §53, Distribution §3 (`execution.executor`) and Distribution §11 (Extension graph types and migrations). Steps 4 and 6 needed none — Distribution §§12, 13, 15 and Core §45 already required what was missing.

## Worth a reviewer's attention

Several of the design's own instructions could not be built as written. Each is recorded in the log's §16 and pinned by a test:

- **§6's operation order deadlocks the runtime upgrade.** It holds the writer lock across a step that spawns the new runtime as a child process, and the lock's re-entrancy set is per-process. The upgrade is two transactions. An in-process test double cannot catch this — it takes the lock re-entrantly and passes — so the test spawns a real child.
- **Installation cannot be dependency-first.** An Extension's dependencies live in its manifest, which cannot be read until the package is installed. Enabling is what Distribution §10 is about, and that is ordered.
- **A migration cannot load the project it is migrating**, because the canonical path validates against the new schema and the records are still at the old one.
- **§4's caller table contradicts §4's proof** on whether the mutation gate checks the environment. The proof won.

**Five tests pinned a defect rather than a behaviour** and now assert the intended behaviour: two fixtures were invalid rather than untested; a dependency-ordering test asserted the dependant first under a name describing the opposite; the extension-upgrade tests faked a new version by editing the installed manifest, because no acquisition step existed to stub; and the CLI walk asserted that a second `write-brief` exits 1 — which is exactly the §45 Brief replacement R11 is about.

Two latent production bugs surfaced and were fixed: a writer-lock race where an absent lock read back as reclaimable, and an infinite loop where a Delivery step reporting no revision wrote state that would not parse.

## Breaking API changes

Listed in full in `CHANGELOG.md` under *Checkpoint 1 consolidation*. The larger ones: `validateSnapshot` returns `ScopedProblem[]`; `PackageInstaller` moves to `environment/transaction` with an optional `spec`; `UpgradeReport.restored` becomes computed and gains `recovery`; `isCurrent(id, edges)` becomes `GraphIndex.isCurrent`; execution state moves to version 2, migrating version 1 documents on read.

## Verification

`pnpm verify` — format, lint, typecheck, 684 tests, build, then `verify:self` (`doctor`, `validate`, a double `sync`, and `git diff --exit-code` over `.claude` and `.pactwright`) — passes on every commit in the branch. Where a new test claims to be a regression test, it was confirmed by reverting the fix and watching it fail.

## Not in this branch

Step 7 of the design — release, clean-consumer replay and the Kakeibo domain Delivery — which §15 already records as not design work. The open Intent `intent-give-extensions-versioned-schema-migrations-2bebaf56` stays open in the graph: the work that closes it was built as a plain engineering change rather than driven through the lifecycle, and a retrospective lineage would carry a closure block describing a run that never happened.

---
_Generated by [Claude Code](https://claude.ai/code/session_01MFDxvNvU3Q7veZvzecqni1)_
