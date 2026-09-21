<!-- Captured verbatim by A1. Do not edit; corrections belong in findings, not in the capture. -->
**Source:** https://github.com/sb-dev/pactwright/pull/39#issuecomment-5756888228
**Comment id:** 5756888228 · **author:** sb-dev · **created and last updated:** 2026-09-21T07:24:57Z
**Captured:** 2026-09-21T22:23Z via `gh api repos/sb-dev/pactwright/issues/39/comments`
**Reviewed SHA as stated in the comment:** `19c66d5`

---

# Review — Checkpoint 1 consolidation

**Verdict: keep Checkpoint 1 open.**

Reviewed at `19c66d5` against the acceptance sentences of R01–R13 in the 19 September review log, the specifications as amended by this branch, and the design log's §16 claims. Six reviewers worked separate areas; every finding below was reproduced by running it, and I independently re-verified each blocking one against the source before writing this.

The consolidation is real. The seven architectural moves the description claims all exist in the code, and several are well built — the validation kernel, the environment transaction's rollback of the three original R07 probes, isolated exact-version acquisition, and the declarative migration mechanism are genuine improvements. But the central claim, *"Closes every finding the 19 September Checkpoint 1 review reproduced (R01–R13)"*, does not hold. **Three of thirteen findings are fully closed.** Nine have blocking gaps, and several reproduce the original defect through a new route.

## Verification

`pnpm verify` passes at this head: format, lint, typecheck, **684 tests (683 pass, 1 skipped, 0 fail)**, build, and `verify:self`. CI is green on Node 22 and 24. `doctor` is healthy on all eight checks.

The suite is green and the code below is broken anyway. That is the most important sentence in this review.

## There is no contract to review against

`git diff --name-only origin/main...HEAD -- specs/` is empty. 104 files, 9,613 lines, and not one graph record — so `pactwright context <brief-id>` has nothing to resolve and the `/review` stage cannot run as specified.

The description addresses this, and the reasoning for leaving `intent-give-extensions-versioned-schema-migrations-2bebaf56` open is sound under the new Core §14: a retrospective lineage would carry a closure block describing a run that never happened. But the conclusion doesn't follow. That Intent's body asserts, of the very commit that leaves it standing:

> Extensions have no equivalent. An Extension that changes the shape of the canonical records it owns has no declared way to migrate them, so `extension upgrade` re-resolves the package and re-locks without reinterpreting or migrating anything it contributed to the graph.

Two-thirds of its "what is needed" list is now delivered. So the graph misrepresents reality in both directions at once: it reports `propose-contracts` (not started) for work that is complete, by means of a record the code has falsified — while what genuinely remains open is the narrower defect in R07/R10 below. The honest repair is to supersede the Intent with one stating the residue, not to leave a falsified record in the canonical graph.

## Blocking findings

### R05 — `lifecycle run` reports `completed` with no Evidence

`src/execute/select.ts:136`, `src/lifecycle/run.ts:311`

`lifecycleExecutor` short-circuits the evidence step with `return { status: "completed" }` under the comment *"A closure step invokes the runtime's own guards, not an agent."* Nothing does. `createEvidence` has exactly one caller in `src/` — `lifecycle/record.ts:304`, the `prepare-evidence` recording stage — which the run loop never reaches. `run.ts:311` then claims completion from routing exhaustion rather than lineage closure, even though line 291 already computed `closed`.

Reproduced on a clean fixture with an executor that succeeds at every step:

```
lifecycle run => [{"stop":"completed","executed":["delivery","review","evidence"]}]
lineage state  => delivering
evidence nodes => []
validate ok    => true
```

This is R05's second failure mode verbatim, and design §3 line 140 promises the opposite in as many words: *"It never reports `completed` while the lineage is `delivering`."* The run leaves `status: completed` with the shape spent, so the only way forward is superseding the Contract.

`tests/execute.test.ts:264` asserts `stop: "completed"` and `state === "delivering"` in the same test, pinning the defect as intended behaviour. The tests that do reach `done` use a double that calls `createEvidence` itself.

### R05 — a compliant agent can never complete a Review

`src/execute/select.ts:100`

The headless instruction is built from `COMMAND_TEMPLATES`, so it tells the agent to write a YAML file and run `pnpm pactwright lifecycle record review`. That is precisely the call `select.ts:120`'s own doc comment says must not happen inside an automatic step. It also never asks the agent to *return* a verdict, though `interpret()` reads one from its final text. An agent that does exactly what it is told produces:

```
stop: "stage-failed", message: "the review of \"review\" reported no outcome"
```

and its `lifecycle record` write is clobbered, because `run.ts:290` advances from state captured before the executor ran.

### R05 — the outcome parser misreads prose

`src/execute/select.ts:203`

A fixed-precedence substring scan. Run directly:

```
"No blocked issues were found; the change passes the contract."  =>  blocked
"I could not pass judgement on this."                            =>  pass
```

Claude Code print mode returns the model's final prose, so for the only production executor this is the normal case. A Review verdict is the one value the runtime must not guess. Require a structured `outcome` field and fail otherwise.

### R06 — the comparison path reports agreement when nothing was evaluated

`src/eval/compare.ts:228`

`compareCase` drops cases whose error strings match; two unevaluated sides produce identical errors, so every case drops out and `formatComparison` prints its fixed line gated only on `cases.length === 0`. The review's own probe — the pack with every agent prompt replaced by "Ignore all tasks. Return nothing." — now yields:

```
changed:   agent pack; prompts (implementer, reviewer, spec)

No differences: every case behaved identically.
EXIT=0
```

The banner prints the review's original diagnosis one line above the wrong answer. This repository's `.pactwright/config.yml` has no `execution:` block, so the literal Step 28 command takes exactly this path. The single-pack `eval` handles the same situation correctly.

### R06 — `eval` scores a pack the executor never invoked

`src/cli.ts:916` keeps only `.output`, discarding `CapabilityResult.status`, `.message` and `.denials`. Declare `executor: claude-code` without the provider CLI on `PATH` and the report reads "11 assertions passed" with `evaluated: true, error: null` — indistinguishable from a measurement. `src/execute/task.ts:53` explains that denials exist precisely to keep an environment failure distinct from work done badly.

### R06 — the Step 28 command cannot succeed

`packages/standard/pack.yml:3` pins `pactwright: 0.0.2` exactly, and `0.0.1` pins `0.0.1`. Every released baseline is therefore incompatible with every later runtime by construction. Acquisition itself is genuinely fixed and verified against the real registry, but Step 28's "verify before continuing" block can never pass. This is a release decision, not a code fix.

### R02 — a caller-supplied `revision` disables the drift guard

`src/graph/closure.ts:66`, `src/lifecycle/record.ts:95`

The repository re-check only fires when `review.revision.startsWith("git:")`, and `revision` is an accepted key of `lifecycle record delivery --file`, passed through unvalidated. Through runtime operations only, no hand-edited YAML:

```
recordDelivery({ revision: "delivered-1" }); recordReview({ outcome: "pass" })
  → change a tracked file, add an untracked one
createEvidence → SUCCEEDS, validate.ok = true
```

The runtime wrote `delivered_revision: delivered-1` having verified nothing. The control case with the default revision refuses correctly.

### R02 — a project outside a git work tree closes over unreviewed content

`src/graph/repository.ts:136`. `repositoryRevision` fails soft to the literal `"none"`, which fails the same `git:` test. No adapter trickery needed — this is the default for any project not in a git work tree, or any environment where `git` is unavailable. R02 asked for "a reconstructible snapshot or fail explicitly"; this does neither.

### R03 — back-dating `created` skips the closure-block requirement

`src/graph/evidence-closure.ts:46`

`predatesClosureProvenance` compares `evidence.created` — self-declared frontmatter, validated only as `YYYY-MM-DD`, with the node id never re-derived from content — against the cutover constant. R03 row 3's exact input, three dates, same fixture:

| `created` | `validate` | mutation gate |
|---|---|---|
| `2026-09-20` | refused | refused |
| `2026-09-19` | **passes** | **succeeds** |
| `2026-08-18` | **passes** | **succeeds** |

This is not the forged-block case Core §14 puts out of scope — there is no block to forge. The spec grandfathers Evidence created before a runtime that wrote closure provenance, a fact about when the record was produced; the code substitutes a value the record asserts about itself. The grandfathered set is finite and known: the three Evidence records in this repository. An explicit id allowlist, or a fact outside the record, makes the requirement unconditional for anything new.

### R12 — reintroduced by a new cause

`src/validate/kernel.ts:217`, `src/lifecycle/transition.ts:259`

Rule 11 builds `walked = [...visited, currentStep]`, but the reducer writes a `currentStep` that is already the tail of `visited` on every blocked and failed path. The synthetic edge is `review → review`. The simplest repro is one Delivery and one blocking Review:

```
undeclared-transition | the run for brief "…" moved from "review" to "review",
which the "direct" shape does not declare
EXIT=1
```

Intermediate states of a bounded correction now validate — the old dedup bug is genuinely fixed — but the state *at* the bound, the one the limit itself produces, does not. `pactwright validate` exits 1 on state no human touched, and there is no supported operation to clear it. `tests/provenance.test.ts:133` builds this state and never validates it.

Related, same area: `currentStep()` (`src/lifecycle/engine.ts:139`) excludes only `completed` and `failed`, not `blocked`, so `nextActionFor`'s blocked branch at `:269` is unreachable and the iteration bound does not stop re-execution. Four consecutive runs at `maxIterations: 1` invoked the review executor 2, 3, 4 and 5 times, adding an `undeclared-transition` each time.

### R04 — the adapter path launders unparseable execution state

`src/lifecycle/provenance.ts:39` vs `src/lifecycle/run.ts:188`

`executionFor` synthesises a *pristine* run when the state document fails to parse. `runLineage` correctly refuses on `execution.problems`; `runFor` reads only `.state` and discards them. Corrupt one key and the adapter path starts over: an iteration counter went from 3 to 0, a recorded human Gate resolution was erased, and `validate` flipped from failing to passing in both cases. R04's complaint was that validation detects unauthorised progression only after it is persisted; here the runtime erases the evidence and re-greens the project. `run.ts:185`'s own comment shows this was diagnosed and fixed in one of the two callers.

Related: `transition.ts:222` guards `event.revision !== undefined` only, so a delivery reporting `revision: ""` writes `delivered_revision: ""`, which `expectString` rejects on read. The infinite loop is genuinely fixed, but the runtime still writes state it cannot read back — and the finding above then "repairs" it by discarding the run.

### R07 / R10 — a failed Extension migration leaves the graph migrated and the project unloadable

`src/environment/transaction.ts:123`, `src/extension/migrate.ts:189`, `src/extension/manage.ts:690`

`managedSet` covers config, lifecycle, lock, `package.json`, the package-manager lock and the generated `.claude` files. It does **not** cover `specs/nodes/**`. `runMigration` rewrites canonical records through `writeMigration` inside the transaction body, before the lock write and before `validateProject`, so a later failure restores the environment and leaves the records migrated:

```
canonical files in the managed set: 0
upgradeExtension ok = false
record AFTER:  exposure: public / environment: unknown   <- migrated, not rolled back
lock schemaVersion AFTER: 1                              <- rolled back
installed manifest after the undo: version: 0.1.0
validate: false — missing-field "exposure_level"
doctor: action-required — the project does not load
```

Recovery is `git checkout` of `specs/`. This is R07's acceptance sentence ("with no partial graph migration"), R10's ("an injected migration failure restores the old canonical state") and Distribution §11's "fully migrated or untouched". `tests/extension.test.ts:886` injects a conflict that `applyMigration` catches *before* `writeMigration`, so it proves only that a pre-write refusal writes nothing.

Design §6 says the managed set includes "every canonical file a migration will rewrite", and §16 records no departure. Given §16's own "a plan cannot be total" note, a `TransactionBody` callback analogous to `about.installing` — `about.writing(paths)` — is the shape that fits.

Secondary, code-derived: `writeMigration` rewrites `specs/nodes/` with no writer lock, while `createIntent` and friends rewrite the same directory under one. `addExtension`, `removeExtension`, `upgradeExtension` and `useAgentPack` take no lock at all, so §10's protection stops at the typed mutations — which also contradicts §10's "around the whole environment transaction", since `applyEnvironmentPlan` itself takes none.

### R10 — a pending migration is silently discarded

`src/extension/resolve.ts:280`, called from `src/pack/resolve.ts:247` and `:352`

`extensionLockEntries`' `recorded` parameter carries a doc comment stating exactly why it matters — *"taking the manifest's version would mean a pending migration never existed to be found"* — and **neither call site passes it**. So every lock writer records `manifest.schemaVersion`, asserting records are already migrated. With a pending migration correctly reported by `doctor`, one unrelated `extension add` erases it:

```
lock schemaVersion after the unrelated add: 2
record still lacks `environment`: true
doctor still sees a pending migration: false
later `extension upgrade` ok: true | record: STILL UNMIGRATED
validate: true
```

Distribution §11: *"Silent reinterpretation of existing records is not a migration."* This is worse than the pre-PR state, where there was no version claim at all. The remove/re-add path reaches the same place, since `remove` preserves records by design.

### R08 — the package-manager lock's contents are still never read

`src/validate/kernel.ts:340`. Nothing in `src/` parses `pnpm-lock.yaml`, `package-lock.json` or `yarn.lock` — `src/config/package-manager.ts:15` lists their *names*, and the only other uses are a path and a label. The review's own `9.9.9` fixture is still accepted:

```
package.json + pnpm-lock.yaml:  pactwright 9.9.9, @pactwright/standard 9.9.9
.pactwright/lock.yml:           runtime 0.0.2, agent pack 0.0.2
agreement.ok = true | validate.ok = true | createIntent SUCCEEDED
```

Installed-content drift *is* now caught on every path, and §16's correction about `node_modules` is right in both directions (a genuinely missing component is caught; a transitively-resolved pack is not falsely rejected). Only the lockfile half is missing, and design §4's proof names this fixture verbatim.

### R09 — `agent-pack upgrade` still does not acquire

`src/pack/select.ts:168`. `upgradeAgentPack(root: string)` takes one argument, has no installer and no registry seam. With the package manager replaced by a shim that always exits 1:

```
configured constraint: @pactwright/standard@^0.0.2, locked 0.0.2
upgrade ok: true  unchanged: true
```

It succeeds with the registry unreachable, which is only possible because it never consults one. A project pinned to `^0.1.0` will never move to a published `0.1.5`. R09 names this function first; acquisition was separated for the runtime and Extensions, not for the Agent Pack.

### R09 — the runtime upgrade can silently downgrade

`src/upgrade.ts:213`, `src/environment/select-target.ts:159`

`selectTarget` is called with no `declaredRuntimeRange`, and `RetainedEnvironment` cannot express the runtime case anyway — it asks what the *candidate* declares, where the retained pack and Extensions declare the range the candidate must satisfy. With it absent, selection returns the newest in-range version unconditionally, with no lower bound at the running version:

```
running runtime: 0.0.2
spec handed to the package manager: pactwright@0.0.1
report: { ok: true, from: '0.0.2', to: '0.0.1' }
```

A consumer on 0.0.2 who runs `pactwright upgrade` today is downgraded to 0.0.1, then re-enters `upgrade --finish` through the older runtime, which re-locks, syncs and validates the project. `--to` skips selection entirely (format check only), so there is no compatibility gate on that path at all. The `@latest` string is gone — that part is genuinely fixed — but "incompatibility discovered after replacement" is unchanged, plus a new downgrade path.

Related: `extension upgrade`'s pre-fetch compatibility check exists but is unreachable — `declaredRuntimeRange` is an injected option and `src/cli.ts:509` calls `operation(root, positional[0])` with no options object. `tests/extension.test.ts:616` ("must never be fetched") passes only because the test supplies it by hand.

### R11 — Evidence correction is advertised, then refused for every record here

`src/validate/kernel.ts:607`, `src/graph/mutations.ts:508`

Brief replacement and Contract change both work, with explicit `supersedes` edges and authority preserved. Evidence correction works only when the superseded record carries a closure block — `carriedClosure` returns `undefined` otherwise, and the grandfathering exempts the old record but never the correction, whose `created` is today. All three Evidence records in this repository lack a block, so all three `done` lineages are permanently uncorrectable while `lifecycle status` offers the operation:

```
permitted: capture-intent, prepare-evidence (supersede)
$ pactwright lifecycle record prepare-evidence --file correct.yml
  missing-closure-provenance: evidence "…" carries no closure block
EXIT=1
```

`permittedOperations` genuinely is one list shared by `lifecycle status` and `lifecycle record` — I verified that. But it is not the same predicate the mutation gate applies, so §12's "one answer to what is legal now" fails at the boundary it was built for. Either let a correction inherit the superseded record's grandfathering, or withhold the operation when no block can be carried.

### §12 — the new adapter sentence stops three commands

`src/adapter/claude-code.ts:147`

The "already completed → stop" text is gone, which closes that half of R11. Its replacement — *"Act only on an operation `lifecycle status` lists as permitted"* — is rendered into all seven commands, but `permittedOperations` can only ever return `RECORDING_COMMANDS` plus `gate`. `propose-contracts`, `deliver-brief` and `review` can never appear. This repository's own status output shows the contradiction:

```
Intent: intent-give-extensions-versioned-schema-migrations-2bebaf56
  current: propose-contracts (responsibility)
  permitted: capture-intent, approve-contract
```

An agent invoked as `/propose-contracts` reads its instructions, finds itself absent from `permitted:`, and stops — while `current:` names it as the next action. Same for `/deliver-brief` and `/review`, including the `/propose-contracts → /deliver-brief → /review` sequence Step 30 tells Kakeibo to run. Scope the sentence to the four recording commands and point the read-only three at `current:` / `lifecycle next`.

### §10 — the writer lock releases a lock it no longer owns

`src/graph/writer-lock.ts:224`

`finally { held.delete(path); rmSync(path, { force: true }); }` deletes whatever lock file is present without checking it is still this process's — unsafe precisely because `:207` deliberately reclaims a *live* holder past `staleAfterMs` (120 s default). Three real processes, one repository:

```
A ENTER pid=10547
B PROBLEM stale-writer-lock: reclaimed a lock held by vm:10547
B ENTER pid=10567                  <- A and B both inside
A EXIT  lockfile={"pid":10567,…}   <- A deletes B's lock
C ENTER                            <- C walks in, no contention
B EXIT  lockfile=(gone)
```

The lock is held across `load → validate → write → reload` and around `finishUpgrade`'s whole transaction including package-manager work; a suspended machine, a slow filesystem or a cold install exceeds 120 s. After one eviction the repository has no writer lock at all until every overlapping process drains. `tests/writer-lock.test.ts:134` asserts the live-holder eviction as intended. Release must verify ownership — the same guard `reclaim` at `:127` already implements.

## Genuinely closed

- **R01** — lock repaired through the runtime; `verify:self` (doctor, validate, double sync, clean diff) is wired into `verify`, CI runs it, and `tests/self-hosted.test.ts` + `tests/ci-workflow.test.ts` pin the coupling. Verified healthy on this checkout.
- **R04** — actor *kind* is checked against policy via a shared table, not presence; refusals leave execution state byte-identical on every path including the adapter's, verified by hash, length and mtime; `lifecycle record gate` works and a human Gate no longer needs hand-edited YAML. (The state-laundering finding above is a separate hole in the same area.)
- **R13** — Step 29 replayed clean in a fresh consumer outside the repository: `init --agent-pack` → `sync` → `validate` → `doctor` all exit 0, doctor healthy on all eight checks, second sync reports every file unchanged, and the Steps 23/25 form produces a byte-identical tree.

Also verified working: R03 rows 1 and 2 on both paths; the "preserve valid incomplete Intents" clause; R03's second half (`checkEvidenceClosure`'s early return is gone, and fabricated blocks with divergent revisions are rejected on `done` lineages); R05's retry half; R07's three original probes, all three restoring byte-identically; `restored` genuinely computed rather than asserted, with `recovery` naming what is left; the two-transaction upgrade split, with a regression test that spawns a real child; R06's reference fallback gone from the public path and isolated exact-version acquisition against the real registry; R10's migration success path and `doctor`'s pending-migration check; design §8's `lineageFor` failing closed on multiple parents; and the mutation gate validating the complete proposed state with the `environment` scope, refusing `createIntent` on lock drift before any write.

## Two claims worth restating

**"Nothing an Extension ships is executed"** is true of the migration mechanism, and that mechanism is well built — declarative operations, no `eval`/`vm`/dynamic import anywhere in `src/`, `CORE_SCHEMA` YAML so no `!!js/*` tags, `createRequire().resolve()` which resolves without loading. But the description generalises it past the acquisition boundary the same module owns. `extension add` shells out to the package manager with no `--ignore-scripts` (the flag appears nowhere in `src/`), so npm and yarn run an Extension's `postinstall`; and `cliReentry` spawns `node_modules/.bin/pactwright`, the shared shim, which an installed package's `bin` entry can replace. Delegating installation is a deliberate, specified choice and installing a package does run its scripts — that part is not a hole this PR opened. Resolving re-entry through the shared shim is, and is cheap to close.

**Every commit SHA in this description and in design log §16 is dangling.** All fifteen — `fdee1be`, `a9366bc`, `8c4bf92`, `d672cc2` and the rest — return `MISSING` from `git cat-file`. The branch was rebased after the log was written, and §16 describes itself as "the only live part of the log"; it also points at `claude/pactwright-checkpoint-1-consolidation-2bsnud`, which is not this branch. The mapping is recoverable from the 19 commit subjects (the spec amendment cited as `fdee1be` is `df243bc`), but §16 is the delivery record for the whole consolidation and currently cites nothing that exists.

## The pattern underneath

Most of these share one shape: **a test double more capable than the shipped code.**

- `tests/lifecycle-run.test.ts:107`'s `fullExecutor` calls `createEvidence` itself, which no production executor does — hiding the false completion.
- `tests/extension.test.ts:616` supplies `declaredRuntimeRange` by hand, which no CLI caller can — hiding the unreachable compatibility check.
- The extension-upgrade tests simulate a new version by editing the installed manifest, as §16 concedes.
- `tests/execute.test.ts:264` asserts `stop: "completed"` and `state === "delivering"` together, pinning the defect as the contract.
- `lifecycleExecutor` is never once composed with `claudeCodeExecutor`; three blocking findings live in exactly that composition.
- The R06 acceptance test in CI greps for `/ignore all tasks|return nothing/` — the reviewer's own sentinel phrase — rather than reading the pack.
- Five tests reach the live npm registry, including the deadlock regression test, which fails at selection before reaching the spawn when offline.

That is R06's own finding — the harness scoring itself — recurring as a testing practice across the branch. It is worth treating as the root cause rather than fixing the symptoms one at a time. The cheapest high-value addition is a `runLifecycle` test composing `lifecycleExecutor(claudeCodeExecutor({ spawn: <double> }))` against a delivering fixture: no provider, no network, and it fails on three of the findings above today.

## Suggested order

1. The false completion and the `review → review` validator state — both make `validate` or `lifecycle run` lie about the graph, and both are small.
2. The R02/R03 closure escapes — caller-supplied `revision`, the `"none"` identity, and the `created` boundary. These are the ones that let unreviewed content close.
3. The migration's managed set and the discarded `recorded` carry-forward, together; they are the same defect seen from two ends.
4. `packageAgreement` reading the package-manager lock; `upgradeAgentPack` acquiring; the runtime's retained-composition check.
5. The adapter sentence and the writer-lock release — both one-liners with outsized effect.
6. Then re-run the R06 probe end to end, and decide the `pack.yml` pin question before the release rather than at it.

The `.claude/agents/` and `.claude/commands/` exclusion from the delivery digest (`src/graph/repository.ts:57`) deserves its own decision: both are tracked files, this PR changed seven of them, and their exclusion means an agent can rewrite its own review instructions inside a closed Delivery without moving the delivered-state identity. Two consecutive `sync` runs produce byte-identical output, so the stated justification — that including them would make a Review invalidate itself — does not appear to hold.

---
_Generated by [Claude Code](https://claude.ai/code)_
