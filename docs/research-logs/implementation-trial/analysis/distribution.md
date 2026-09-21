# A2-D — Distribution, recovery and concurrency

**Boundary:** packaging, selection, installation, synchronisation, upgrade,
migration, diagnosis, environment recovery and writer concurrency.
**Reference audited:** `19c66d5f2368932ff05306db1fae8da8ec5810dd`, production
files byte-identical to the pinned reference.
**Skills applied:** `systematic-debugging`, `security-and-hardening`,
`acquire-codebase-knowledge`.
**Sibling reports read:** none. `analysis/` held only `README.md` when this
was written.
**Reference repaired:** nothing. No production file was edited, and
`git diff 19c66d5f..HEAD -- src packages tests specs .pactwright .claude .github`
is empty.

## How to read this

Every finding carries an evidence status. `executed-fail` means a probe ran
and the reference behaved as described; `executed-pass` means a probe ran and
the reference behaved as it should; `code-traced` means the claim was derived
by reading the source and was **not** run. The distinction is load-bearing:
four findings below are code-traced and should be treated as hypotheses until
A3 executes them.

The probes are in [`tools/implementation-trial/a2-distribution/`](../../../../tools/implementation-trial/a2-distribution/),
with the captured output of one full run under `logs/`. They drive the
reference's own code; none of them patches it.

Successes are recorded alongside defects, in [§4](#4-what-is-well-built).
A reimplementation that discards a working mechanism because nobody wrote
down that it worked is a worse outcome than one that keeps a known flaw.

## 1. Environment

| | |
|---|---|
| Platform | Linux 6.18.44, x86_64 (a remote container, **not** the A1 macOS machine) |
| Node | `v22.22.2` |
| Package manager | `pnpm` 11.7.0, matching the reference's `packageManager` pin |
| Checkout | an independent clone at `19c66d5f` plus one overlay commit carrying the trial records and these probes |
| Test suite | `pnpm test`: **684 tests, 683 pass, 1 skipped, 0 fail**, exit 0 |

That last row matters. A1 recorded 682 passing and **1 failing** at the same
SHA on macOS, and flagged the difference as possibly platform-dependent. On
Linux the suite is green, which agrees with CI and with PR #39's own claim.
So the failure A1 saw is platform-dependent and this report cannot
characterise it; **A3 should reproduce it on macOS before treating it as
either a real defect or an environment artefact.** Nothing below depends on
it.

## 2. The surface, as it actually is

Ten public commands reach this boundary: `init`, `sync`, `upgrade`
(`--to`, and the undocumented `--finish`), `doctor`, `validate`,
`agent-pack use|upgrade`, `extension add|remove|upgrade`, and
`eval --baseline/--candidate`. `src/cli.ts:949` (`main`) dispatches them as a
flat sequence of equality tests, `cli.ts:955–975`; there is no command
registry.

**Writers.** Everything that mutates durable state goes through a
temporary-sibling write followed by `renameSync` (`src/atomic.ts`), so no
single file is ever seen half-written. The writers are: `init.ts` (scaffold
files), `pack/resolve.ts` (`writeLock`), `pack/select.ts` (config + lock),
`extension/manage.ts` (config + lock), `extension/migrate.ts`
(`specs/nodes/*.md`), `adapter/claude-code.ts` (`writeAdapter`, the only one
that also deletes), `upgrade.ts` (lifecycle + lock),
`environment/transaction.ts` (restore), `graph/writer-lock.ts` (the lock
file), `lifecycle/state.ts` and `graph/mutations.ts` (other boundaries).

**Lock ownership.** Two different locks share the word. `.pactwright/lock.yml`
is Pactwright's resolved-environment record; `.pactwright/.lock` is the
repository writer lock (`graph/writer-lock.ts`), excluded from the
transaction's managed set. The writer lock is taken by `finishUpgrade` and by
graph mutation. It is **not** taken by `agent-pack use`, `extension add`,
`extension remove`, `extension upgrade` or `sync` — and `extension upgrade`
writes canonical graph records (`writeMigration`). See D-09 and D-04.

**Executable origins.** Three things are executed. The package manager, via
`spawnSync(manager, …)` with `manager` drawn from a four-name allowlist and
resolved through `PATH` — no shell, no absolute path, no pinning. The newly
installed runtime, via `spawnSync(<root>/node_modules/.bin/pactwright,
["upgrade","--finish"])` — an absolute in-project path, existence-checked.
And the `claude` binary, from `execute/claude-code.ts`, also via `PATH`.
Nothing an Agent Pack or Extension *ships* is executed by Pactwright itself:
manifests are parsed, prompts and skills are read, hashed and rendered.
That boundary holds for everything except installation — see D-11.

## 3. Findings

### D-01 · `agent-pack upgrade` acquires nothing, and can move the lock backwards while reporting "unchanged"

**Requirement.** Distribution §15 (Agent Pack upgrade): an upgrade selects,
acquires and activates. PR #39 R09: *"`agent-pack upgrade` still does not
acquire."*

**Public trigger.** `pactwright agent-pack upgrade` in a project whose
installed pack is older than the one its lock records — which is what a
`pnpm add -D pack@<older>`, a branch switch, or a partially-applied install
leaves behind.

**Source.** `src/pack/select.ts:168` (`upgradeAgentPack`) → `apply` →
`resolveDesiredState` → `pack/resolve.ts:48` (`locatePack`) →
`pack/locate.ts:54` (`locatePackage`), which is `createRequire(...).resolve`.
No installer, no `selectTarget`, no `PackageView`. `currentSelection`
(`select.ts:116`) computes "what was selected before" by **re-resolving the
installed tree**, not by reading `.pactwright/lock.yml`.

**Test.** `tests/extension.test.ts` covers `extension upgrade`'s acquisition.
Nothing covers `agent-pack upgrade` acquiring, because it does not.

**Expected.** Either acquire the newest compatible published version within
the configured constraint, or refuse and say the operation cannot acquire.

**Actual.** Zero package-manager invocations. The lock is rewritten to
whatever happens to be installed — including a version *older* than the one
it recorded — and, because `currentSelection` re-resolves the same installed
tree, `previous === selected`, so the report says `unchanged: true` and the
CLI prints `unchanged: @probe/pack@0.1.0 is already selected` while
`lock.yml` moves from `0.2.0` to `0.1.0`.

**Evidence.** `executed-fail`.
`tools/implementation-trial/a2-distribution/p01-selection.ts`, log
`logs/p01-selection.log`, at `19c66d5f`:

```
--- agent-pack upgrade, with 0.1.0 installed over a 0.2.0 lock ---
{ "ok": true, "selected": { "name": "@probe/pack", "version": "0.1.0" },
  "unchanged": true, "problems": [], "packageManagerInvocations": 0 }

--- lock.yml agent_pack block after the 'upgrade' ---
agent_pack:
  name: '@probe/pack'
  version: 0.1.0
```

Durable effect: `.pactwright/lock.yml` rewritten; `config.yml` untouched;
`.claude/` re-rendered from the older pack. Exit status of the library call
is `ok: true`.

**Cause.** **Unenforced requirement.** §15's three steps exist in
`environment/select-target.ts` and are wired into `extension upgrade` and the
runtime path, but never into the Agent Pack path. The "unchanged" misreport
is a second, distinct defect of the same function: `currentSelection` asks
the wrong oracle.

**Acceptance proposal.** (a) `agent-pack upgrade` must call `selectTarget`
with the configured constraint and the pack's declared runtime range, then
install through the package manager. (b) "previous" must be read from
`.pactwright/lock.yml`, not re-resolved. (c) A resolved version *below* the
locked one must be refused unless the operation explicitly names a rollback.
Acceptance test: lock at 0.2.0, tree at 0.1.0, registry publishing 0.2.0 —
the command must acquire 0.2.0, or fail; it must never report `unchanged`
while the lock moves.

---

### D-02 · `pactwright upgrade` performs no compatibility check and can silently install an older runtime

**Requirement.** Distribution §15: *"If the target has no compatible complete
environment, the operation must fail clearly rather than silently substitute
components."* PR #39 R09: *"the runtime upgrade can silently downgrade."*

**Public trigger.** `pactwright upgrade` (no `--to`) in any project whose
installed runtime is newer than anything the registry publishes as `x.y.z` —
a prerelease, a packed tarball, a workspace link, which is exactly what
Checkpoint 1's own Stage 6 packed-consumer proof creates.

**Source.** `src/upgrade.ts:215` calls
`selectTarget({kind:"runtime",…}, undefined, { runtimeVersion: from }, …)`
with **no `declaredRuntimeRange`**. In `select-target.ts:159`,
`retained.declaredRuntimeRange?.(version)` is then `undefined` for every
candidate, so the first branch returns `newestFirst[0]` unconditionally with
`rejected: []`. Nothing anywhere compares the selected version with `from`.

**Test.** `selectTarget: skips versions the running runtime cannot satisfy`
passes — because the test supplies `declaredRuntimeRange`. See D-03.

**Expected.** A target incompatible with the retained environment is
rejected before installing; a target older than the running runtime is
refused, or at minimum reported as a downgrade.

**Actual.** The newest published version is selected with no check, installed,
and found incompatible only by the re-entered child. When the newest
published version is *older* than the running one, it is installed and the
operation reports success.

**Evidence.** `executed-fail`. `p01-selection.ts`, `logs/p01-selection.log`:

```
--- selectTarget as upgradeRuntime calls it (view publishes 9.9.9) ---
{ "version": "9.9.9", "rejected": [] }

--- selectTarget *with* a declaredRuntimeRange, for contrast ---
{ "version": "0.0.2", "rejected": [ "9.9.9" ] }

--- upgrade with only an OLDER version published ---
{ "ok": true, "from": "0.0.2", "to": "0.0.1", "unchanged": false,
  "problems": [], "installerCalls": [ "pactwright@0.0.1" ] }
```

The CLI renders that last report as
`upgraded runtime 0.0.2 -> 0.0.1 via pnpm` (`src/cli.ts:609`). Durable
effect: the package manager replaced the runtime; the child re-locked and
re-synced under the older code.

**Cause.** **Unenforced requirement**, with an aggravating **contradiction**:
`select-target.ts:155` states *"Compatibility is checked before installing,
which is the whole point"* on the one path that never checks it.

**Acceptance proposal.** `upgradeRuntime` must supply a
`declaredRuntimeRange` for the runtime — the selected pack's `pactwright`
range and every enabled extension's, which the project already knows — and
must refuse a target below `from` unless `--to` names it. Acceptance test:
a pack pinning `pactwright: 0.0.2` plus a registry publishing `0.9.0` must
produce `incompatible-target` **with no install performed**.

---

### D-03 · The pre-install compatibility check is reachable only from tests

**Requirement.** Distribution §15, as D-02.

**Public trigger.** `pactwright extension upgrade <id>`, and `pactwright
upgrade`.

**Source.** `declaredRuntimeRange` appears in exactly three places in `src/`:
its declaration in `environment/select-target.ts:57`, its single use at
`:159`, and its pass-through in `extension/manage.ts:567,597`. **No
production caller supplies it.** `src/cli.ts` invokes the extension verbs as
`operation(root, options.positional[0]!)` with no options object, and
`upgradeRuntime` passes none. The only suppliers are
`tests/extension.test.ts:635` and its neighbours.

**Test.** `extension upgrade: acquires the newest compatible version, not
merely the newest` passes and asserts `"0.9.0 must never be fetched"` — true
only because the test injects the seam that makes it true.

**Expected.** The guarantee the specification states, the code comments
claim and the test asserts is the behaviour a user gets.

**Actual.** In production both upgrade paths select blind, install, and
discover incompatibility afterwards, relying on the transaction to undo.

**Evidence.** `code-traced`, corroborated by D-02's executed result on the
runtime path. Not separately executed for `extension upgrade`.

**Cause.** **Inadequate test.** The test proves a capability rather than the
shipped behaviour — the same family as PR #39's "a test double more capable
than the shipped code", here in its seam-injection form.

**Acceptance proposal.** A default `declaredRuntimeRange` implementation
that asks the package manager for published metadata, used when the caller
supplies none; and an acceptance test that drives the **CLI**, not the
library, so an unsupplied seam cannot hide the gap.

---

### D-04 · A migration failure after the write leaves the records migrated and the project unloadable

**Requirement.** Distribution §15 step 4 and §11: an Extension's canonical
records end up fully migrated or untouched. PR #39 R07/R10: *"a failed
Extension migration leaves the graph migrated and the project unloadable."*

**Public trigger.** `pactwright extension upgrade <id>` where the declared
migration cannot carry every record the extension owns — a record missing the
field a `rename` needs, which the v2 schema then requires.

**Source.** `src/extension/manage.ts:645` (`upgradeExtension`) runs inside
`applyEnvironmentPlan`; `runMigration` (`manage.ts:622`, called from `manage.ts:690`) calls
`extension/migrate.ts:189` `writeMigration`, which renames files under
`specs/nodes/`. The transaction's managed set,
`environment/transaction.ts:123` `managedSet`, is `.pactwright/config.yml`,
`.pactwright/lifecycle.yml`, `.pactwright/lock.yml`, `package.json`, the
package-manager lock file, and `.md` files under
`MANAGED_DIRS = [".claude/agents", ".claude/commands"]`. **`specs/` is not in
it.** `migrate.ts:188` nevertheless says *"The transaction owns the undo"*,
and `migrate.ts:22` says *"the whole thing runs inside the environment
transaction — so canonical state is either fully migrated or untouched"*.

**Test.** `tests/extension.test.ts:886`,
`extension upgrade: a failed migration leaves the records and lock untouched`
— **passes**. See D-05.

**Expected.** On failure, `specs/nodes/*.md` are byte-identical to their
pre-upgrade contents.

**Actual.** Both records are left rewritten at schema version 2. The lock is
correctly restored to version 1 and the frozen reinstall correctly puts the
v1 extension package back — so the project is left with v2 records and a v1
manifest, and the canonical loader rejects it.

**Evidence.** `executed-fail`.
`tools/implementation-trial/a2-distribution/p02-migration.ts`, log
`logs/p02-migration.log`, at `19c66d5f`:

```
--- managed set the transaction will snapshot ---
[ ".pactwright/config.yml", ".pactwright/lifecycle.yml",
  ".pactwright/lock.yml", "package.json", "pnpm-lock.yaml" ]

--- extension upgrade result ---
{ "ok": false, "changes": [],
  "problems": [ "missing-field: frontmatter is missing required field \"exposure\"" ],
  "installerCalls": 2 }

--- records AFTER the failed upgrade ---
alpha: [ …, "exposure: high", "environment: unknown" ]
beta:  [ …, "exposure_level_typo: high", "environment: unknown" ]

--- installed extension manifest AFTER the failed upgrade ---  (back at v1)
--- lock schema_version AFTER --- absent (= version 1)

--- loadProject after the failed upgrade ---
{ "threw": "2 problems:",
  "problems": [ "missing-field: … \"exposure_level\"",
                "missing-field: … \"exposure_level\"" ] }

--- doctor after the failed upgrade ---
{ "status": "action-required",
  "checks": [ "[healthy] package-manager: …",
              "[action-required] configuration: the project does not load" ] }
```

Durable effect: two canonical records rewritten; the project no longer loads;
every command that loads the project now fails, including `doctor`'s
remaining checks (see D-06). Library exit `ok: false`.

Two further observations from the same run. The migration is not all-or-
nothing **in memory** either: the record the migration could not carry was
still written with its `set-default` applied. And re-serialisation changes
bytes the declared operations do not name — `created: 2026-09-01` became
`created: '2026-09-01'` — so a migration reformats frontmatter beyond its
declared scope.

**Cause.** **Unenforced requirement**, in the strict sense that the mechanism
named as the enforcer does not cover the state in question. R07's
consolidation unified four private snapshots into one managed set and then
did not add the one directory the new migration feature writes.

**Acceptance proposal.** Either (a) extend the managed set to the canonical
record paths a planned migration will touch — the plan can know them, since
`applyMigration` computes `changed` before anything is written — or (b) take
the writer lock and write records only after the post-migration validation
has passed against the in-memory result. (b) is the smaller change and also
fixes the partial-record problem. Acceptance test: the failure must be
injected **after** the write (see D-05), and must assert the records' bytes,
the lock, the installed manifest **and** that `loadProject` still succeeds.

---

### D-05 · The test that asserts D-04's guarantee injects its failure before the write

**Requirement.** As D-04.

**Source/test.** `tests/extension.test.ts:886–916`. The test poisons a record
so that the `rename` operation is ambiguous, which `migrate.ts:164` detects
**inside `applyMigration`**, in memory, returning `migration-conflict` before
`writeMigration` is ever called (`manage.ts:691` returns on
`migrated.length > 0`). Its assertion `"records must be untouched"` is
therefore true because nothing was written, not because anything was undone.

**Expected.** A test of "fully migrated or untouched" injects a failure on
both sides of the write.

**Actual.** Only the pre-write refusal is covered. The post-write path — the
one §15's wording is about — has no test.

**Evidence.** `code-traced` (the test source is quoted above; the behaviour
it fails to cover is D-04's `executed-fail`).

**Cause.** **Inadequate test.**

**Acceptance proposal.** The acceptance harness must require, for every
operation with durable effects, at least one case whose failure is injected
*after* the effect. A4 should make this a property of the harness rather than
a per-test habit.

---

### D-06 · `doctor` cannot diagnose an unloadable project, so three of the states this layer produces are undiagnosable

**Requirement.** Distribution §16 requires `doctor` to report, among others,
*"pending or incomplete migrations"* and *"validation failures affecting the
resolved environment"*. §11 calls a pending or partially applied migration an
environment fault.

**Public trigger.** `pactwright doctor` after any of: a pending extension
migration with records of the migrating type; a failed migration (D-04); an
`extension remove` that preserved user-authored records; a crashed
transaction (D-10).

**Source.** `src/doctor.ts:99–120`: `loadProject` is called inside a `try`,
and on `PactwrightError` the function pushes one `configuration` check and
**returns** — *"Nothing below can be judged without a loaded project."* The
pending-migration check is at `doctor.ts:198`, after that return.

**Test.** `tests/extension.test.ts:945`,
`doctor: a pending extension migration is action required, not a healthy
environment`, passes — on a fixture project that has **no records of the
migrating type**, so the loader succeeds.

**Expected.** The one command whose job is diagnosis names the fault in the
states the rest of the layer is designed to produce.

**Actual.** With one record present, `doctor` emits two checks and stops.

**Evidence.** `executed-fail`.
`tools/implementation-trial/a2-distribution/p10-doctor-pending.ts`, log
`logs/p10-doctor-pending.log`. Same pending migration, twice:

```
--- pending migration with NO records of that type (the shape the suite tests) ---
"reachedTheMigrationCheck": true
  [action-required] extension-migrations: extension "probe-mig" records are at
  schema version 1 but the installed manifest declares 2

--- pending migration WITH records of the migrating type ---
"reachedTheMigrationCheck": false
  [healthy] package-manager: …
  [action-required] configuration: the project does not load
```

`logs/p09-remove-readd.log` shows the same collapse after a perfectly
successful `extension remove` that preserved a record by design, and
`logs/p02-migration.log` and `logs/p04-crash.log` after D-04 and D-10.

**Cause.** **Inadequate test** (the fixture avoids the state that matters)
over an **unenforced requirement** (§16's list is not structurally checked
against what `doctor` can emit).

**Acceptance proposal.** `doctor`'s checks must be independently computable:
package-manager detection, the two locks' agreement, installed-versus-locked
versions, pending migrations and generated drift can all be answered from
files without a fully validated graph. Only the graph-validation check needs
`loadProject`, and it should degrade to `action-required` with the load
problems rather than short-circuiting the report. A4 should hold a registry
of §16's thirteen items and assert `doctor` emits a check for each.

---

### D-07 · The package-manager lock's contents are read by nothing

**Requirement.** Distribution §13: *"Before accepting a resolved environment,
Pactwright validates … package-manager and Pactwright lock consistency."*
§16: `doctor` reports *"package-manager lock ↔ .pactwright/lock.yml drift"*.
Invariant 15: *"Package-manager and Pactwright lock state must agree on
package-backed Pactwright components."* PR #39 R08: *"the package-manager
lock's contents are still never read."*

**Public trigger.** `pactwright doctor` and `pactwright validate` in any
project whose `pnpm-lock.yaml` disagrees with `.pactwright/lock.yml` — a bad
merge, a reverted lock, a hand-edited pin.

**Source.** The lock file names appear in exactly one place,
`config/package-manager.ts:14–19`, and are used only with `existsSync`.
`detectPackageManager` returns `lockFile` as a *name*. Its two consumers are
`environment/transaction.ts:131` (which snapshots the bytes for restore) and
`doctor.ts:86` (which prints the name). The §13 check that does exist,
`validate/kernel.ts:380` `packageAgreement`, compares the Pactwright lock
against `installedVersion` — the `node_modules` **tree**, not the
package-manager lock.

**Expected.** A project whose package-manager lock pins versions the
Pactwright lock does not record is reported as drift.

**Actual.** Every check is healthy.

**Evidence.** `executed-fail`.
`tools/implementation-trial/a2-distribution/p07-locks-and-doctor.ts`, log
`logs/p07-locks-and-doctor.log`. `pnpm-lock.yaml` rewritten to pin
`pactwright@0.0.1` and `@probe/pack@9.9.9` while the Pactwright lock records
`0.0.2` and `0.1.0`:

```
--- after the package-manager lock is made to disagree with everything ---
{ "doctorStatus": "healthy",
  "doctorChecks": [ "[healthy] package-manager: pnpm@11.7.0 (declared in package.json)",
                    "[healthy] configuration: …", "[healthy] runtime: runtime 0.0.2 matches the lock",
                    "[healthy] capabilities: …", "[healthy] lock-agreement: environment_lock_hash sha256:5541bc…",
                    "[healthy] extensions: …", "[healthy] generated-drift: …", "[healthy] validation: …" ],
  "validateOk": true }
```

**Why this is not cosmetic.** §12 makes `environment_lock_hash` one third of
the replay base and requires that the environment it identifies *"must be
resolvable without silently substituting newer … versions"*. A CI runner
doing `pnpm install --frozen-lockfile` installs what the package-manager lock
says. Here that is `pactwright@0.0.1` and `@probe/pack@9.9.9` — a different
environment from the one the recorded hash names, and the substitution is
silent on both sides.

**Cause.** **Unenforced requirement.** The consolidation moved the check from
"absent" to "against `node_modules`", which is a different and weaker
predicate than the one §13 and §16 state.

**Acceptance proposal.** A minimal per-manager reader that answers one
question — "what version does this lock pin for package `X`?" — for
`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock` and `bun.lock`, compared
against `.pactwright/lock.yml` for every package-backed component, in the
`environment` validation scope and as a named `doctor` check. A5 should
decide explicitly whether an unparseable lock is a warning or a refusal;
parsing four formats is real cost and the decision should be taken
deliberately rather than by omission.

---

### D-08 · `doctor` does not report an available runtime upgrade

**Requirement.** Distribution §16: `doctor` reports *"available runtime
upgrade where determinable"*.

**Public trigger.** `pactwright doctor`.

**Source.** `src/doctor.ts` imports neither `selectTarget` nor
`packageManagerView`, and emits no such check. The machinery exists
(`environment/select-target.ts`) and `doctor` is the natural caller — it is
read-only, and `packageManagerView` mutates nothing.

**Evidence.** `code-traced`, corroborated by the check inventory in
`logs/p07-locks-and-doctor.log`, which lists the twelve checks `doctor` can
emit against §16's thirteen required items.

**Cause.** **Unenforced requirement.**

**Acceptance proposal.** Add the check, bounded and offline-tolerant: a
registry that cannot be reached is a `warning` naming that, not a failure.

---

### D-09 · The writer lock releases a lock it no longer owns, admitting a silent third writer

**Requirement.** PR #39 §10: *"the writer lock releases a lock it no longer
owns."* Core §59 and `graph/writer-lock.ts`'s own contract: one writer in the
critical section, and reclamation is reported, never silent.

**Public trigger.** Any two Pactwright writers where the first holds the lock
longer than `staleAfterMs` (default 120 s) — which the code's own comment
anticipates: *"a complete load → validate → write → reload of the graph, so
the wait has to exceed that on a slow machine with a large graph."*

**Source.** `src/graph/writer-lock.ts:225–230`. The release is
unconditional:

```ts
  try {
    return fn();
  } finally {
    held.delete(path);
    rmSync(path, { force: true });
  }
```

The *reclaim* path (`:127` `reclaim`) carefully re-reads the holder and
compares pid, host and `startedAt` before deleting — *"Re-reading immediately
before the delete closes the window…"*. The release path performs no such
check.

**Test.** `tests/writer-lock.test.ts` covers acquisition, reclamation of a
dead pid, reclamation of an over-age live pid, release on throw and
re-entrancy — all in one process. None covers what a reclaimed holder does
when it later releases.

**Expected.** A holder whose lock was reclaimed releases nothing, and says
so.

**Actual.** It deletes the current holder's lock. A third process then
acquires immediately, with no reclamation notice, while the second is still
inside its critical section.

**Evidence.** `executed-fail`. Three real processes with file-based
synchronisation (no sleeps as the ordering mechanism):
`tools/implementation-trial/a2-distribution/p03-writer-lock.ts`, log
`logs/p03-writer-lock.log`:

```
--- two holders at once ---
{ "p1Pid": 1323, "p2Pid": 1335,
  "lockFileWhileP1Held":       "{\"pid\":1323,…}",
  "lockFileAfterP2Reclaimed":  "{\"pid\":1335,…}",
  "p2ReclaimNotice": "stale-writer-lock: reclaimed a writer lock held by vm:1323 …",
  "bothInsideCriticalSection": true }

--- after P1's ordinary release, while P2 is still inside its critical section ---
{ "p2StillHolding": true, "lockFile": "<absent>",
  "lockFileBelongsTo": "nobody — P2's lock was deleted" }

--- a third writer entered while P2 had not left ---
{ "p3Pid": 1347, "p2StillHolding": true, "lockFile": "{\"pid\":1347,…}" }
```

Two writers at once is the reclaim policy's accepted cost and it is
*reported*. The third is neither.

**Cause.** **Missing requirement.** The reclamation design reasons carefully
about the acquire side and does not state what a displaced holder owes on the
release side.

**Acceptance proposal.** Record the holder token (`pid`/`host`/`startedAt`)
at acquisition, re-read before deleting, and delete only on an exact match;
on a mismatch, emit the mirror of `stale-writer-lock` — the displaced holder
must learn it lost the lock, because whatever it wrote was written outside
the critical section. A5 should also decide whether age-based reclamation of
a *live* holder is wanted at all, or whether a live pid should block
indefinitely with a clear message.

---

### D-10 · The environment transaction is a handled-failure mechanism only; a crash leaves half-applied state with no record

**Requirement.** Distribution §14–§15: a failed environment operation leaves
the previous valid state, or reports what a human must do.
`environment/transaction.ts:30`: *"A snapshot covers all of it, a restore
rewrites all of it, and `restored` is the *result* of re-reading it."*

**Public trigger.** Any environment command interrupted — `Ctrl-C` at the
wrong moment, a CI job cancelled, an OOM kill, a laptop lid.

**Source.** `src/environment/transaction.ts:207`: the snapshot is an
in-memory array. There is no on-disk journal, no intent record and no
recovery entry point. `try/catch` covers a *thrown* body; nothing covers a
dead process.

**Expected.** The two endings should be distinguished in the specification
and in the report surface, so a user knows which guarantee they have.

**Actual.** They are not distinguished anywhere, and the crash ending has no
guarantee at all.

**Evidence.** `executed-fail`. The same transaction over the same effect,
ended two ways:
`tools/implementation-trial/a2-distribution/p04-crash.ts`, log
`logs/p04-crash.log`:

```
--- A — handled failure after the effect ---
{ "restored": true, "recovery": [], "lockBackToItsPreviousBytes": true,
  "writerLockLeftBehind": false }

--- B — SIGKILL after the same effect ---
{ "lockBackToItsPreviousBytes": false,
  "lockYmlNow": [ "runtime:", "  version: 9.9.9", "# half-applied by a crashed transaction" ],
  "writerLockLeftBehind": true,
  "writerLockContents": "{\"pid\":1424,\"host\":\"vm\",…}",
  "recoveryRecordOnDisk": "none — the snapshot lived only in the dead process" }

--- B — what doctor says about the crashed project ---
{ "status": "action-required",
  "checks": [ "[healthy] package-manager: …",
              "[action-required] configuration: the project does not load" ],
  "namesTheHalfAppliedTransaction": false }
```

The abandoned writer lock is self-healing — the next writer sees a dead pid
and reclaims it — so the durable harm is the half-applied managed file and
the absence of any statement about it.

**Cause.** **Ambiguity.** Distribution §14–§15 say what a failed operation
leaves without distinguishing a returned failure from a lost process, so an
in-memory mechanism reads as satisfying them.

**Acceptance proposal.** Two separate stated guarantees. For a handled
failure: complete restoration, verified, as today. For a crash: at minimum
crash-*detectability* — an intent record written before the first effect and
removed after the last, so `doctor` can say "an environment operation was
interrupted; these files may be half-applied" and name a recovery command.
A4 should treat "process killed after the effect" as a first-class control
alongside "operation returned a failure"; A5 should decide whether full
crash-recovery is in scope for the restart or whether detection plus a manual
remedy is the accepted position.

---

### D-11 · Installation executes code an Extension ships, crossing a boundary the design states

**Requirement.** `extension/migrate.ts:18`: *"Migrations are data, not code.
Pactwright applies the operations itself, so an Extension stays a manifest:
nothing it ships is ever executed."* Distribution §25: Pactwright never
becomes a second package manager. PR #39 meta-claim: *"installation and CLI
re-entry cross the 'nothing an Extension ships is executed' boundary."*
`security-and-hardening`: *"Block dependency scripts before first
execution … Never blanket-approve."*

**Public trigger.** `pactwright extension add <package>`,
`pactwright extension upgrade <id>`, `pactwright init --with <id>`,
`pactwright upgrade`, `pactwright eval --baseline/--candidate`.

**Source.** `src/upgrade.ts:114` `packageManagerInstaller` builds
`["add","-D",spec]` (pnpm/bun), `["install","--save-dev",spec]` (npm) or
`["add","--dev",spec]` (yarn). No `--ignore-scripts`, no policy file. The
repository itself declares no script policy: there is no `.npmrc`, and
`package.json` has no `pnpm` block.

**Expected.** A package is fetched and its manifest read before anything it
ships can run, or the boundary statement is withdrawn.

**Actual.** Every install runs the package's lifecycle scripts with the
user's privileges, before Pactwright has read a single field of
`extension.yml`. The `pnpm install` performed in this audit's own setup ran
`esbuild`'s `postinstall`, which is the mechanism in question.

**Evidence.** `executed-pass` for the argv (a recording shim first on `PATH`
captured exactly what the runtime constructs);
`code-traced` for the consequence, which was not detonated.
`tools/implementation-trial/a2-distribution/p06-package-manager.ts`, log
`logs/p06-package-manager.log`:

```
--- argv the runtime hands the package manager to install / to undo ---
[ "pnpm\tadd\t-D\tpactwright@0.0.2", "pnpm\tinstall",
  "npm\tinstall\t--save-dev\tpactwright@0.0.2", "npm\tinstall",
  "yarn\tadd\t--dev\tpactwright@0.0.2", "yarn\tinstall",
  "bun\tadd\t-D\tpactwright@0.0.2", "bun\tinstall" ]

--- does any install carry a dependency-script policy? ---
{ "ignoreScriptsAnywhere": false, "frozenLockfileOnTheUndo": false }
```

No registry was contacted and no credential used.

**Cause.** **Contradiction.** Two true statements — "Pactwright applies
migration operations itself" and "package installation belongs to the project
package manager" — are combined into a third that is false: that nothing an
Extension ships is executed. Delegating installation delegates script
execution with it.

**Acceptance proposal.** Pick one and state it. Either (a) install with
scripts disabled by default and require an explicit, recorded per-package
approval before any script runs — the `security-and-hardening` gate — or (b)
amend the Distribution specification to say plainly that enabling an
Extension executes code from its package and that Extension sources are
therefore a trust decision. (a) is the stronger position and is mechanically
enforceable; (b) at least stops the codebase asserting a boundary it does not
hold. This is A5's decision, and it should not be made silently.

*Second-order note, same probe.* The undo is `pnpm install` / `npm install`
with **no** `--frozen-lockfile`, so a rollback may re-resolve rather than
replay. The transaction's post-restore verification does catch a changed lock
file and reports `restored: false`, so this degrades honesty rather than
losing it — but a frozen install is the correct command and costs nothing.

---

### D-12 · Arguments reach the package manager unfiltered through `eval`

**Requirement.** `security-and-hardening`: validate at the boundary with an
allowlisted shape. Distribution §5: a pack source is a package name or a
path.

**Public trigger.** `pactwright eval --baseline <spec> --candidate <spec>`,
where `<spec>` is interpolated from anything the caller does not control —
a CI variable, a workflow input, a script argument.

**Source.** `src/cli.ts:157–167` rejects a value that `startsWith("--")` and
nothing else. `src/pack/select.ts:184` `parseSpec` returns
`{ source: trimmed }` for anything that is not a path and contains no `@`,
with no shape check on `source`. `src/eval/acquire.ts:72` passes it straight
to the installer, which places it as its own argv element.

**Expected.** A pack source is validated against the package-name grammar the
rest of the codebase already has (`PACKAGE_NAME_PATTERN`,
`EXTENSION_ID_PATTERN`) before it can become a package-manager operand.

**Actual.** A single-dash value passes the CLI guard and arrives as a flag.

**Evidence.** `executed-fail`. `p06-package-manager.ts`,
`logs/p06-package-manager.log`:

```
--- acquireSide with a single-dash spec (the CLI guard only rejects `--`) ---
{ "argvTheManagerReceived": [ "pnpm\tadd\t-D\t-C" ],
  "outcome": [ "pack-not-found: agent pack \"-C\" is not installed…" ] }
```

`-C` is pnpm's `--dir`. `spawnSync` is used without a shell, so this is
argument injection into the package manager, not command injection — the
blast radius is whatever flags that manager accepts, which for every
supported manager includes registry, directory and workspace selection. No
credential was used and no registry contacted.

For contrast, `extension add` is properly constrained:
`manage.ts:76` `parseSpec` requires `EXTENSION_ID_PATTERN`, and the verb
table is guarded with `Object.hasOwn` against inherited members
(`cli.ts:477`). The pack path simply did not receive the same treatment.

**Cause.** **Unenforced requirement.** The grammar exists; the one entry
point that feeds a package manager does not apply it.

**Acceptance proposal.** `parseSpec` in `pack/select.ts` validates `source`
against `PACKAGE_NAME_PATTERN` for non-path sources, and the installer
refuses any spec beginning with `-`. Acceptance test: `-C`, `-w`, `-r` and
`--registry=…` all refused before any spawn.

---

### D-13 · The transaction's restore sweep deletes files it does not own

**Requirement.** Distribution §14: leave ambiguous state intact and report
it. `adapter/claude-code.ts:24`: the managed directories are *"the scope of
ownership, not the proof of it"*. `security-and-hardening`: a destructive
operation on a derived path requires ownership evidence, not only an
allowlisted root.

**Public trigger.** Any failing environment operation while anything else —
an editor, a generator, a second process — creates a `.md` file under
`.claude/agents/` or `.claude/commands/`.

**Source.** `environment/transaction.ts:275–287`: every `.md` file found in a
managed directory that is not in the snapshot is `rmSync`'d, with the
justification *"a file with no snapshot is by definition one this operation
created"*. That is true only if nothing else can write there. There is no
`isGenerated` check, and the deletion is not reported in
`EnvironmentResult`.

**Expected.** The transaction proves ownership per file, as `writeAdapter`
does — or at minimum reports what it removed.

**Actual.** The file is deleted silently.

**Evidence.** `executed-fail`.
`tools/implementation-trial/a2-distribution/p08-writers.ts`, log
`logs/p08-writers.log`:

```
--- a non-generated file created inside a managed directory during a failing transaction ---
{ "survivedTheRestore": false,
  "managedDirNow": [ "approve-contract.md", …, "notes.md", …, "write-brief.md" ] }
```

`notes.md` — present before the transaction, so snapshotted — survived;
`concurrent.md`, created during it, did not. The same file is reported as
`kept` by `sync`, which refuses to touch it.

**Cause.** **Contradiction.** Two writers hold opposite ownership rules for
the same directories, and the destructive one holds the weaker rule.

**Acceptance proposal.** The sweep deletes only files that pass
`isGenerated`, and every deletion appears in `EnvironmentResult`. Window
narrowing is not enough: the correct test is ownership, which the codebase
already implements.

---

### D-14 · A refused install still triggers a real package-manager install on the rollback

**Requirement.** `AddExtensionOptions.allowInstall`: *"When false, a package
that is not installed is reported rather than installed. `extension add`
installs; a plain `sync` must not."*

**Public trigger.** Any caller passing `allowInstall: false` where the
package is genuinely absent.

**Source.** `extension/manage.ts:284–285`: `about.installing(...)` is
called **before** `installPackage`, and `installPackage` (`manage.ts:388`) is
where `allowInstall === false` short-circuits. The transaction therefore
believes an install occurred, and `transaction.ts:311–324` runs
`seams.installer({ root, manager })` — a real `<manager> install` — during
restore.

**Expected.** A path that installs nothing performs no package-manager
command.

**Actual.** It runs one.

**Evidence.** `executed-fail`. `logs/p09-remove-readd.log`:

```
--- id derivation in `extension add` ---
{ "packageWhoseTailIsNotTheId": [
    "extension-not-installed: extension package \"@probe/notes\" is not installed; …",
    "package-manager-failed: pnpm install exited 1: no output" ] }
```

The second problem is the rollback's own install, in a temporary project with
no resolvable dependencies.

**Cause.** **Unenforced requirement**, from ordering: intent is recorded
before the refusal that makes it untrue.

**Acceptance proposal.** Move `about.installing` inside `installPackage`,
after the `allowInstall` gate. Acceptance test: with `allowInstall: false`
and a missing package, zero package-manager invocations.

---

### D-15 · `extension add <package>` derives the id from the package name, an undocumented coupling

**Requirement.** Distribution §4 and `manage.ts:73`: *"`add
project-intelligence` resolves `@pactwright/project-intelligence`; the
explicit package form is also valid."*

**Public trigger.** `pactwright extension add @scope/pkg` where the manifest's
`id` is not the package name's last segment.

**Source.** `extension/manage.ts:76–92` (`parseSpec`): for a scoped spec the id is
`spec.slice(slash + 1)`. The manifest schema
(`extension/manifest.ts:403–424`) validates `id` and `package` **independently**
— `id` against `EXTENSION_ID_PATTERN`, `package` against
`PACKAGE_NAME_PATTERN` — and never requires the one to be a suffix of the
other.

**Expected.** Either the explicit package form works for any legal manifest,
or the manifest schema enforces the coupling the CLI assumes.

**Actual.** The add writes `config.extensions.<package-tail>` and resolution
fails with `extension-id-mismatch: config.extensions.notes resolves a
manifest declaring id "probe-notes"` — naming a configuration key the user
never wrote. No durable damage: the refusal happens in
`resolveDesiredState`, before any write.

**Evidence.** `executed-fail`, `logs/p08-writers.log` (first run) and
`logs/p09-remove-readd.log` (contrast: with a conforming package name the
same call succeeds).

**Cause.** **Ambiguity.** Two fields are independent in the schema and
coupled in the CLI.

**Acceptance proposal.** Resolve the package first and take the id from its
manifest, rather than guessing it from the name — or state the coupling in
§4 and enforce it in the manifest checker. The first is better: it makes the
explicit package form mean what it says.

---

### D-16 · `pactwright upgrade` reports that nothing happened while the child migrated and re-synced

**Requirement.** Distribution §15: migration, locking, sync and validation are
performed by the new runtime — and, implicitly, reported.

**Public trigger.** `pactwright upgrade` in a project whose
`lifecycle.yml` is at version 1.

**Source.** `upgrade.ts:281–291` returns `migrations: []`, `synced: []` and
`unchanged: installed === from` unconditionally. The child's own
`UpgradeReport` (`finishUpgrade`, which does populate both) goes to the
child's stdout, and `cliReentry` (`upgrade.ts:150`) discards stdout on
success.

**Expected.** The parent reports what the child did.

**Actual.** It reports nothing, and when the version did not change it says
so.

**Evidence.** `executed-fail`. Real child re-entry through a real
`node_modules/.bin/pactwright`:
`tools/implementation-trial/a2-distribution/p05-reentry.ts`, log
`logs/p05-reentry.log`:

```
--- B — successful re-entry through the installed binary ---
{ "parentReport": { "ok": true, "from": "0.0.2", "to": "0.0.2",
                    "unchanged": true, "migrations": [], "synced": [] },
  "theChildActuallyMigrated": true,
  "lifecycleFirstLines": [ "version: 2", "", "responsibilities:" ],
  "adapterFilesRendered": true }
```

The CLI renders that as
`unchanged: runtime 0.0.2 is already the target` while `lifecycle.yml` — a
canonical configuration document — was rewritten and ten adapter files
landed.

**Cause.** **Missing requirement.** Splitting the operation across a process
boundary left no channel for the child's result.

**Acceptance proposal.** Re-enter with `upgrade --finish --json`, parse the
child's `UpgradeReport` and merge its `migrations`, `synced` and `problems`
into the parent's. `--json` output already exists; it is not being used.

---

### D-17 · A failed re-entry loses the child's structured problems

**Requirement.** Distribution §14: report clearly.

**Source.** `upgrade.ts:161–173`: on a non-zero child exit, `cliReentry`
builds one `reentry-failed` problem from the child's trimmed stderr, else its
stdout.

**Actual.** The operator is told
`reentry-failed: the new runtime could not complete the upgrade: upgrade
failed; the previous environment was restored` — the child's human-readable
banner — and never learns the cause, which in the probe was
`incompatible-runtime`.

**Evidence.** `executed-fail`, `logs/p05-reentry.log`, case A.

**Cause.** **Missing requirement**, same root as D-16.

**Acceptance proposal.** As D-16: `--json` re-entry and problem-list
propagation.

---

### D-18 · Three smaller code-traced findings

| ID | Finding | Source | Cause |
|---|---|---|---|
| D-18a | `applyEnvironmentPlan` never reads `plan.problems`. `planEnvironmentChange` accepts *"refusals detectable before anything is installed or written"*, and a caller that supplied them would have them silently ignored — the body runs regardless. No current caller supplies any, so nothing is broken today; it is a trap for the next one. | `environment/transaction.ts:168–181`, `:198` | Missing requirement |
| D-18b | `restoreAll`'s installer call is **not** wrapped in `try`. Its file operations are individually guarded, but an installer that throws escapes the transaction and the caller receives a raw exception instead of an `EnvironmentResult`. Observed incidentally during probe development, when a probe installer threw: the ENOENT propagated out of `upgradeRuntime`. The shipped `packageManagerInstaller` returns problems rather than throwing, so this is latent. | `environment/transaction.ts:319` | Missing requirement |
| D-18c | `environmentLockHash` deliberately excludes `schemaVersion` so that existing locks keep their bytes. Two environments whose canonical records are at different schema versions therefore share an `environment_lock_hash`, while §11 calls a pending migration an environment fault. §12's "deterministically identifies the exact resolved environment" and §11's fault are in tension, and A5 has to resolve it — probably by keeping the hash stable and reporting the fault separately, but the decision should be recorded. | `config/lock.ts:234`, `:270` | Ambiguity |

Two further code-traced observations, both low:

- `eval/sandbox.ts:24` provisions every evaluation sandbox with a
  `version: 1` lifecycle document, which `config/lifecycle.ts:145` refuses
  with `lifecycle-needs-migration`. Nothing in `eval` loads the sandbox
  through `loadProject`, so the suite does not notice — but a candidate agent
  that runs any `pactwright` command inside its own sandbox gets a project the
  shipped runtime will not load. The sandbox is a distribution artefact and
  should be provisioned by the same code `init` uses.
- `detectPackageManager` reads `packageManager: pnpm@11.7.0` and `doctor`
  prints it, but the declared version is never checked against the binary
  `PATH` resolves, and nothing uses corepack. `doctor`'s
  `pnpm@11.7.0 (declared in package.json)` reads as a statement about what
  will run; it is only a statement about what is declared.

## 4. What is well built

These are not filler. Each was exercised, and each is something a
reimplementation should carry forward rather than rediscover.

| ID | Behaviour | Evidence |
|---|---|---|
| S-01 | **`init` is honest about what it is.** A plain `init` writes no lock, reports `scaffold: true`, and refuses `--with <id>` without an explicit `--agent-pack` rather than defaulting to one. A second run skips every path and changes no bytes. | `executed-pass`, `logs/p08-writers.log` |
| S-02 | **`sync` is deterministic and proves ownership per file.** Second run: 0 changed, 10 unchanged. An unmarked file at a rendered path becomes a `conflict` with its bytes untouched while every *other* rendered file still lands; a file quoting the banner in its prose is `kept`; a genuinely generated orphan is `removed`. Ownership is the banner's *position* after the frontmatter, not the marker appearing anywhere — which is what makes a user document that mentions the banner safe. | `executed-pass`, `logs/p08-writers.log` |
| S-03 | **`writeAdapter` contains its own paths.** A rendered key with a traversal segment is refused: `refusing to write outside the managed adapter directories`. Keys are normalised before the containment test and the canonical form is the single key used to write, report and prune. | `executed-pass`, `logs/p08-writers.log` |
| S-04 | **The transaction's `restored` is a measurement, not a claim.** It re-reads every managed file and compares hashes, and re-reads the installed version of every package it recorded an install for. The specific regression it was built to fix — reporting `restored: true` after restoring four files while the installed package stayed replaced — cannot recur. Probe 04 case A: `restored: true` with the file bytes verified equal. | `executed-pass`, `logs/p04-crash.log` |
| S-05 | **Real child re-entry works, and nothing deadlocks across it.** With a genuinely different runtime build installed at `node_modules/.bin/pactwright`, the child really does perform the migration, re-lock, sync and validate; the parent holds no writer lock while spawning and the child takes it without contention; a missing local binary is a clean `reentry-unavailable` rather than a hang. When the child fails, its own transaction restores its half and the parent's restores the package replacement, verified — across two processes and two nested transactions the environment comes back byte-identical. | `executed-pass`, `logs/p05-reentry.log` cases A, B, C |
| S-06 | **Remove/re-add round-trips exactly, and removal preserves user data.** `extension remove` reports the preserved record by *attribution* — the types the removed extension registered — rather than by guesswork, says so when it cannot attribute because the manifest is gone, and falls back to the previous lock minus the entry when the remaining configuration no longer resolves, so the command that repairs a broken extension set stays available while the set is broken. A re-add restores config and lock to byte-identical contents. | `executed-pass`, `logs/p09-remove-readd.log` |
| S-07 | **Input validation on the extension verbs.** Ids are checked against `EXTENSION_ID_PATTERN`; the verb table is looked up with `Object.hasOwn`, so `constructor` cannot be dispatched as an operation. This is exactly the discipline D-12 shows missing on the pack path — the codebase knows how. | `code-traced` + `executed-pass` |
| S-08 | **The eval acquisition isolation guard.** `acquireSide` refuses a side that resolved outside the acquired directory (`pack-not-isolated`), which closes the leak whereby a requested baseline silently resolved to the locally installed pack. | `executed-pass`, `logs/p06-package-manager.log` |
| S-09 | **Package-manager detection is declaration-first and refuses to guess.** An explicit `packageManager` wins; a single lock file is used otherwise; two competing lock files are `ambiguous-package-manager` rather than a guess; no lock and no declaration is reported, not assumed. | `executed-pass`, `logs/p07-locks-and-doctor.log` |
| S-10 | **Writer-lock acquisition is correct.** `openSync(path, "wx")` is an atomic create; a failed create followed by an unreadable file is retried rather than reclaimed immediately, precisely because reclaiming on that basis is a race; reclamation re-reads and compares the holder token before deleting, and is always reported through `onProblem`; the lock is re-entrant within a process so a mutation can wrap its whole sequence. Everything about taking the lock is right — see D-09 for the release. | `executed-pass`, `logs/p03-writer-lock.log` |
| S-11 | **Migrations are bounded data.** A migration is a declared, ordered list of `rename` / `set-default` / `remove` operations applied by Pactwright over the extension's *own* node types only, with a refusal to migrate backwards and a refusal when a step is missing. What a migration can do is bounded by the operation set rather than by whatever a script could reach. The mechanism is sound; D-04 is about where its output is written, not about what it can do. | `code-traced` + `executed-pass` |

## 5. PR #39 coverage, per trigger

PR #39's "review" is an issue comment by the branch's own author (A1's
capture, §1.2), so each claim below was verified or qualified rather than
inherited.

| Trigger | Verdict | Where |
|---|---|---|
| R07 — a failed Extension migration leaves the graph migrated and the project unloadable | **Confirmed, still present.** Reproduced end to end. | D-04 |
| R10 — a pending migration is silently discarded / not reported | **Qualified.** `doctor` *does* have a pending-migration check and it works — but only on a project with no records of the migrating type, i.e. never when it matters. | D-06 |
| R08 — the package-manager lock's contents are still never read | **Confirmed, literally true.** The consolidation added a check against `node_modules`, which is a different and weaker predicate than §13's and §16's. | D-07 |
| R09a — `agent-pack upgrade` still does not acquire | **Confirmed, still present**, plus a second defect the review did not name: the downgrade is reported as `unchanged`. | D-01 |
| R09b — the runtime upgrade can silently downgrade | **Confirmed, still present.** `upgrade` installed `0.0.1` over a running `0.0.2` and reported success. | D-02 |
| §10 — the writer lock releases a lock it no longer owns | **Confirmed, still present**, with the consequence demonstrated: a third writer enters silently. | D-09 |
| Meta-claim — installation and CLI re-entry cross the "nothing an Extension ships is executed" boundary | **Split.** Installation: **confirmed** — no install carries a script policy. CLI re-entry: **not a violation** — the child is the newly installed *runtime* at an absolute in-project path, which is the mechanism §15 requires, not Extension-shipped code. | D-11, S-05 |
| Stated root cause — "a test double more capable than the shipped code" | **Qualified for this boundary.** The pattern here is not a more-capable double but two other shapes: a failure injected *before* the effect (D-05) and a **seam supplied only by tests** (D-03). Both produce the same outcome — a green test for a guarantee the user does not get — and A3 should treat them as three distinct failure modes rather than one. | D-03, D-05 |

## 6. Coverage gaps — what this report did not reach

Stated plainly, so silence is not read as coverage.

1. **No registry was contacted and no credential used.** Every acquisition ran
   through the production seams or a recording `PATH` shim. A real
   `pnpm add @pactwright/standard@0.0.1` against npmjs.com is untested here,
   so registry-specific behaviour — version metadata shape, auth failures,
   `pnpm view` output on a package with one published version — is
   `not-run`.
2. **The script-execution consequence in D-11 was not detonated.** The missing
   `--ignore-scripts` is `executed-pass` evidence about the argv; that a
   malicious `postinstall` would run is `code-traced`.
3. **Linux only.** `onDiskName`'s case-insensitive-filesystem handling
   (`adapter/claude-code.ts:82`) and A1's macOS-only test failure are
   `not-run`. So is any Windows behaviour.
4. **Single host.** `isLive`'s cross-host branch (`holder.host !== hostname()`
   → treated as live) and pid-reuse are `not-run`.
5. **GitHub provisioning is a declared seam** in this checkpoint —
   `renderGitHubWorkflows` returns an empty map and `github.enabled` is false.
   Not exercised; whether the seam is correctly shaped is a Checkpoint 2
   question.
6. **Production Skills resolution** is reported as unsupported by `doctor` and
   was not probed beyond confirming the report.
7. **Adjacent boundaries touched only where distribution overlaps**: the
   lifecycle engine and executor (A2-L), the graph and its mutations (A2-G),
   and the evaluation suite's semantics and any coverage or mutation
   measurement (A2-V). In particular, PR #39's R01–R06, R11–R13 and its §12
   adapter-sentence claim are **outside this boundary and uncovered here**.
8. **No performance or scale work.** Lock wait behaviour under many writers,
   and migration over a large graph, are `not-run`.

## 7. What A3 should decide first

Ordered by what blocks the most other decisions, not by severity.

1. **D-11, the execution boundary.** It is the only finding that changes what
   the product *is*. Every other finding is repairable inside the current
   design; this one requires A5 to either adopt a script gate or withdraw a
   stated guarantee.
2. **D-04 and D-10 together — what a transaction owns and what a crash
   costs.** Both are answers to "what is the unit of atomicity here", and
   deciding it once settles the managed set, the writer lock's scope and
   whether crash recovery is in scope.
3. **D-03 and D-05 — the harness rule.** A4 should adopt two properties: a
   failure injected after the effect for every durable operation, and no
   guarantee provable only through a seam the CLI never supplies. These two
   rules would have caught D-02, D-03, D-04 and D-06 before they shipped.
4. **D-07 — read the package-manager lock, or amend §12–§13.** Four formats
   is real cost; the decision should be deliberate.
5. **D-01, D-02, D-09, D-06, D-12** are then ordinary repairs against the
   decisions above.

---

*A2-D, written against `19c66d5f2368932ff05306db1fae8da8ec5810dd`. No sibling
A2 report was read. No production file was modified.*
