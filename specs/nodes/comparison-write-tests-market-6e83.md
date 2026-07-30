---
id: comparison-write-tests-market-6e83
type: comparison
title: Write-tests status-flip market — three candidates compared across ten routed perspectives
created: 2026-07-30
produced_by: "/review-contracts"
---
The market for `intent-write-tests-status-flip-2b64` (class 2), comparing
`contract-write-tests-flip-3a71` (**A**, extend A7's flip), `contract-write-tests-derived-9c48`
(**B**, injected artifact probe) and `contract-write-tests-market-5e26` (**C**, ordered two-step
print).

Ten perspectives were routed — `spec` plus the full nine-specialist panel — because the union of the
three candidates' `## Scope` reaches every axis: all three edit `tests/**`; B changes the signature
of the repo's single routing entry point and parses paths into a syscall; B and C put logic on a
path that runs inside `handlers/indexes_fresh.ts` on every `spec:validate`; the `NEXT` block is the
operator's whole interface; and two of three leave no durable record that verification happened.
Every routed critic returned a verdict for every candidate: **thirty verdict pointers, no
perspective dropped.** `ux` returned an explicit "no concern on this axis" for A, which is a clean
verdict and not silence.

**All three candidates received `Concern.` from nine of ten perspectives.** No candidate was
endorsed outright by any axis.

## Candidate trade-off table

| Axis | A `flip-3a71` | B `derived-9c48` | C `market-5e26` |
|---|---|---|---|
| Mechanism | agent-written status | injected filesystem probe | unconditional ordered pair |
| `tools/` change | none | `conveyor.ts`, `spec.ts`, `indexer.ts` | `conveyor.ts`, one branch |
| Fixture blocks re-recorded | 3 promised untouched, actually move | 1 counted, 4 affected | 4 counted, correct |
| Forward step gated on | a narrated green report | file presence, not greenness | nothing |
| Views vs `spec:status` | agree | disagree by design, plus 3 undeclared | disagree via `[0]` truncation |
| Fixes the observed case | yes | no — probe false on that brief | accompanies, does not close |
| Reds an existing test | no | CC-12 replay, by construction | `conveyor.test.ts:464`, unscoped |
| Rollback | 5 artifacts, not 1 clause | signature + 5 files, atomic | 1 line plus 4 blocks |
| Audit record of verification | durable, undated | working-tree only, mutable | none |
| Sharpest single defect | pins code it declares untouched | fails on the real brief | no oracle exists |

## Shared-core findings (binding whichever candidate wins)

These apply to all three equally and are the material for mandatory-fix amendments in the selecting
decision. They are recorded outside the table because they are not discriminators.

1. **The whole market rests on a false premise about who produces `implemented`, and every
   candidate's headline trade-off is mis-scaled by it.** Each Problem interpretation treats
   `/implement-brief` as the sole producer. `.claude/commands/prepare-evidence.md:9-13` already
   reads "for a LANED brief, set the brief to `implemented` IF IT IS NOT ALREADY", routed through
   graph-maintainer at `:29-32`. **Verified on disk:** both live `test-verification` briefs are
   already `implemented` — `brief-conveyor-tests-4c86.md:5` and `brief-patch-market-tests-f6c7.md:5`
   — and lane rule 1 forbids `/implement-brief` on either, so both were flipped by
   `/prepare-evidence`. Consequences: A's "decisive advantage" (Trade-off 2) is a window one command
   wide, not a durable property; B's and C's "the status stays `draft` forever" (B Behaviour 4 /
   Trade-off 6, C Behaviour 3 / Trade-off 6) are **false**; and A's "second rule-5 behaviour change"
   is arithmetically a third writer of that field. The defect is a **one-step ordering gap**, not a
   missing or unobservable fact. The winning contract must state the bound explicitly so its
   selecting decision is not read as endorsing the overstatement.
2. **The loop is real and worth closing, notwithstanding finding 1.** `tools/conveyor.ts:574` does
   dead-end paste-only operation, and `.claude/commands/write-tests.md:21-25` does direct a
   hand-run. The window is bounded but it is exactly the window in which an operator following
   printed commands is stuck.
3. **No candidate makes greenness observable, and each substitutes a proxy forgeable by the party it
   trusts.** A trusts a narrated green report; B trusts file presence and disclaims greenness
   outright; C trusts the operator's reading order. The verification the lane exists to provide is
   asserted rather than demonstrated to any tool in all three.
4. **No candidate names which artifact records a red suite** — the ordinary state, since
   `.claude/lanes/test-verification.md:10-16` has the code under test land in five other lanes
   first. A forbids the flip and reprints with no remediation; B and C route forward regardless.
   CLAUDE.md's paste-only rule requires the run's verdict **and** the remediation-on-failure both be
   named.
5. **All three mark `drift-finding-write-tests-no-flip-7e52` `resolved` as an implementation step,
   decoupled from any passing run.** That node's own condition (`:72-78`) requires the chain to
   close "under a recorded decision", so a resolution written before the selecting decision exists
   is a false closure. None returns it to `open` on revert, and it is the sole durable record of the
   defect's observable behaviour.
6. **The finding's `accepted` branch was never priced.** `7e52:74-78` offers `accepted` "if a human
   decides the manual hop is the intended behaviour, in which case Acceptance 1's wording is what
   needs superseding". All three candidates are variations on "close it"; the class-2 ≥2-candidate
   bar is met without the finding's own alternative being on the table.
7. **`.claude/commands/write-tests.md` has no idempotency clause, and no candidate adds one.**
   `prepare-evidence.md:24-28` carries an explicit `IDEMPOTENT / RE-ENTRANT` clause;
   `write-tests.md` has nothing comparable, yet all three leave `/write-tests` re-runnable against a
   lane already written — C makes re-running it a standing printed line.
8. **The `## Strategy tension` interaction is unspecified in all three.** `conveyor.ts:574` falls
   through to `:586-602`, and `/decompose-lanes` may author that heading into any lane brief. A and
   B silently drop the `/propose-patches` offer by returning early; C emits it beside a
   `/prepare-evidence` line, telling the operator to record the lane's evidence and open a market on
   it in one block. No live brief carries the heading today, so this is unspecified-by-design rather
   than a live break.
9. **`Step.why` is never printed by `spec:status`.** `tools/spec.ts:39` renders
   `${s.kind} ${s.rendered}` only. All three candidates write `why` copy; B's Acceptance 2 and C's
   Risk 1 mitigation both *depend* on the operator reading it, and are unsatisfiable as written.
10. **None reconciles the fix with `write-tests.md`'s own FALLBACK region** (`:29-37`), which prints
    an unresolved `/prepare-evidence <brief-id>` and asserts a degraded print "stays visibly
    distinguishable from a resolved one". Under B and C the resolved and degraded paths print the
    same command for different reasons.
11. **No candidate sequences the open integration's return to `final`.**
    `integration-conveyor-derived-4d19` is `draft` *because* this lane failed contract Acceptance 1.
    A defers it explicitly; B and C do not mention it at all. Merging any candidate leaves an
    integration asserting a failure that no longer exists and
    `intent-self-guiding-delivery-loop-6d79` still `open`.
12. **Every structural claim about `tools/conveyor.ts` checks out** — `:510` evidence-first, `:521`
    `implemented` before `:574` `lane === "test-verification"`, `:533` resolved-market. No candidate
    misquotes the code; the disagreements are about consequences.
13. **No personal data, payments, credentials or network egress in any candidate** — recorded as an
    explicit clean finding on those sub-axes rather than as silence. The live security sub-axes are
    trust boundaries, authorisation and the integrity of a verification claim.

## Critic findings by perspective

### spec

Verdict: **Concern** on all three.

1. **A** — Trade-off 2's decisive advantage is refuted by shared-core 1. Scope 2 names the wrong
   CLAUDE.md home: it puts `/write-tests` under the lifecycle Implementation step, which is
   `/implement-brief`'s, while CLAUDE.md already names `/write-tests` under lane rule 1. Behaviour 1
   has no case for a legitimately red suite — the ordinary state — and Scope 1.3's `ON RED` clause
   is modelled on a failed *graph write*, not a failed suite.
2. **B** — the probe is unreachable after the lane's first `/prepare-evidence`, because `:521`
   short-circuits before `:574`, so Behaviour 6's self-healing is dead code for that brief. Scope
   7's premise is false: `brief-laned-tests-0f06` has no `## Files` section, so the probe returns
   `undefined` however many stub files the fixture gains. Behaviour 4's `deriveStage` claim is wrong
   twice — `:313` returns `brief-evidenced` with final evidence, `:315` returns `brief-market` with
   `patch_market: true`.
3. **C** — Acceptance 1 ("running them in order") and Scope 4 ("the operator runs the second line")
   give one block two incompatible readings it cannot distinguish. Behaviour 2 misattributes the
   pair's retirement to `:510` when `:521` retires it a step earlier — and Out-of-scope 1 denies the
   very mechanism the retirement depends on. Out-of-scope 3's licence is stated as a property of the
   lane when it is a property of the lane's no-market state.

### architecture

Verdict: **Concern** on all three.

1. **A** — the write-authority boundary holds and is not new: `/implement-brief` already delegates
   then has the *command* invoke graph-maintainer. But `/implement-brief` may implement **inline**
   while `/write-tests` **always** delegates, so under A this command's mutation is always gated on
   a fact only a subagent holds — strictly weaker than the bound A calls "the same honest bound A7
   already carries". Out of scope 3's closed set of two is wrong; it is three.
2. **B** — `LaneArtifacts` is not a pure-core/impure-shell seam. `briefSteps` is reached from
   `:442`, `:653`, `:678` and recursively through `:353`; Scope 1.2 threads one. Because the
   parameter is **optional**, every missed hop compiles silently — including `integrationSteps:653`,
   the live path for this very lane, so `spec:status <integration-id>` and `spec:status <intent-id>`
   would still print `/write-tests`. B keeps the letter of the single-producer property and spends
   what the letter was written to buy.
3. **C** — C's headline claim is refuted by three lines of the indexer. `tools/indexer.ts:257` takes
   `nextSteps(spec, b)[0]`, so `status.md`'s brief row shows only the **stale** `/write-tests`
   member and never the forward one, while the same file's intent section shows the pair. C commits
   by truncation the divergence it charges against B, and unlike B does not know it. C also
   overloads `Step[]` position with two incompatible meanings — a sequential plan at brief level, an
   unordered enumeration inside `contractCoverageSteps`' flatMap — with nothing in the `Step` type
   able to express which is which.

### qa-test

Verdict: **Concern** on all three.

1. **A** — four of six machine-checkable acceptance items pin code A declares untouched, so **A's
   suite stays green with the entire diff reverted**. Acceptance 3's negative grep cannot be for the
   command name: `write-tests.md:27` and `:33` legitimately mention `/prepare-evidence` and Scope
   1.4 preserves both, so only the phrase `by hand` is greppable — the leg asserts the absence of a
   phrase, not of a behaviour. Acceptance 4 is self-satisfying (discharged by pointing the entry at
   a different node id) and Acceptance 5 is a one-time pre-merge observation.
2. **B** — the probe returns `false` on the very brief whose loop produced this intent, and B fails
   toward reprint, so the defect is re-derived rather than fixed. No proposed leg would catch it:
   Scope 5's legs are explicitly fs-free, Scope 6 is one hand-built well-formed path, and nothing
   tests the parser against a real brief body — although `conveyor.test.ts:1079` already loads the
   live tree, so the precedent exists in the file B is editing.
3. **C** — **C's headline acceptance has no oracle.** Nothing observable differs between "tests
   written" and "not started", so every leg C offers is green whether the operator pastes line 2 or
   re-pastes line 1 forever. C also reds an existing leg its Scope never names:
   `conveyor.test.ts:464-470` wraps the branch in `only()`, which asserts `steps.length === 1`.

### reliability-ops

Verdict: **Concern** on all three.

1. **A** — the flip is instructed, never observed, and its absence is **silently repaired**:
   `prepare-evidence.md:9-13` fixes a skipped flip, so the graph afterwards is byte-identical to a
   correct run and the diagnostic is destroyed. Offsetting this, A's failure direction is the only
   benign one in the market — a skipped flip degrades to exactly today's behaviour. The
   partial-revert hazard is specific and sharp: delete the flip clause, forget to restore the
   `KNOWN GAP` block, and the file neither flips nor documents the workaround.
2. **B** — `undefined` → reprint is the **wrong** failure direction and is the same defect B
   convicts C of. The module's floor for an unknown is `noStep(why)` (`:269-272`), an explicit "no
   derivable next step, and why"; B instead emits a `paste` line, which `:38-40` defines as "safe to
   run as printed", for a state where it knows nothing. `fs.existsSync` also returns true for a
   directory and follows symlinks.
3. **C** — the stale first line is **not** the "no-op repeat" Behaviour 2 calls it. Re-pasting
   `/write-tests` re-invokes a file-writing agent with no idempotency clause anywhere in its command
   file, so it can overwrite or duplicate the lane's tests. The trust erosion is not scoped to this
   lane: once a printed `paste` line requires judgement, the operator must apply that judgement to
   every printed line.

### security-privacy

Verdict: **Concern** on all three, proportionate — no candidate touches personal data, payments,
credentials or the network.

1. **A** — the authorisation delta is **zero**: A adds no tool, widens no fence, adds no writer. The
   real finding is an abuse path A is silent on: Behaviour 1 conditions a graph write on the agent's
   narration of the suite result, and `test-writer` reads exactly the untrusted material
   (`.claude/agents/test-writer.md:28-29` warns of it) that makes a "report green" injection produce
   a false `implemented` rather than merely a false sentence. Proportionate amendment: have
   `ECHO BEFORE MUTATING` echo the runner's own exit status, not the agent's summary.
2. **B** — an agent-authored string reaches a syscall with no validation. Scope 2's only stated
   bound is "under `tests/`", leaving `..` traversal, absolute paths, symlink-following `existsSync`
   and globs unaddressed; `tests/../README.md` forges `allNamedTestFilesPresent: true` with zero
   tests written. **B owes the CC-6 refusal.** That precedent
   (`comparison-conveyor-market-890e:238-240`, implemented at `conveyor.ts:161-173` and
   `issue_sync.ts:251-255`) treated an unvalidated agent-authored string reaching a shell as a real
   trust boundary and required a refusal at the egress point plus `shell: false`. A path handed to
   `fs.existsSync` is the same class of egress.
3. **C** — the most direct path in the market to work being *claimed* as verified: no forgery, no
   injection, no agent misbehaviour needed, only an operator pasting two lines in the order printed.
   No mechanical actor would notice — `/prepare-evidence`'s gathering is agent judgement with no
   exit code behind it, performed by the same invocation that would be fabricating. Against that, C
   adds the least attack surface of the three: no new input parsed, no filesystem read, no new
   writer.

### cost-maintainability

Verdict: **Concern** on all three.

1. **A** — the fixture plan is unbuildable as scoped, and the alternative attachment point corrupts
   the fixture's meaning: hanging a laned `test-verification` brief off trail D's class-1
   `contract-single-0d02` makes the regression fixture assert a graph state the work-class table
   forbids. A also declines the one cheap guard against the precedent creep it names as Risk 3 —
   nothing asserts the `EXACTLY ONE GRAPH WRITE` set has size two, so a third command acquiring the
   clause reds nothing.
2. **B** — routing becomes a function of unenforced brief prose: the phrases `## Files to create` /
   `## Files to modify` appear nowhere under `.claude/`, `write-brief.md` mentions neither, and Out
   of scope 4 declines a validation rule. A section rename silently reverts every verification lane
   to the loop. B also adds a second hand-synced doc/test byte-pair of the kind CLAUDE.md already
   pays for once, and Acceptance 5 **inverts the signal**: removing the divergence reds CI, so the
   cheapest way past a red test is to restore the wart.
3. **C** — the fixture ends up documenting the reprint as *intended*. The `write-tests` entry today
   records a block whose first line reprints the command just run, recognisable as the recorded bug;
   under C the same shape becomes the recorded design, and a maintainer cannot distinguish "this
   records a defect" from "this records the pair". Nothing asserts that exactly one `lane` value
   yields a multi-step plan, so the exception spreads by analogy with no machine guard.

### release

Verdict: **Concern** on all three.

1. **A** — the new fixture brief cannot attach anywhere without reddening blocks Scope 4 promises
   stay byte-identical: attached to `contract-laned-0f02` it adds a line to `transcript.yaml:88`,
   `:170` and `:181`; attached to `contract-done-1c02` it breaks the `integrate` block at
   `:190-192`. The revert also leaves the drift finding falsely `resolved`. Graph residue from
   already-flipped briefs is genuinely benign — verified.
2. **B** — **B's re-record is impossible as scoped.** `ci.yml:121-122` copies only
   `path.join(FIXTURE, "specs")` and `:125` runs `spec:status` with `cwd` set to that scratch dir,
   which contains no `tests/` at all, so the probe returns `false` and a block recorded as
   `/prepare-evidence` mismatches and fails at `:135`. Fixing it requires editing `ci.yml` —
   `observability-release`'s file, named nowhere in B's Scope. Removing the optional parameter on
   revert also reds `typecheck` on arity.
3. **C** — C alone counts all four affected transcript blocks correctly, which is a real credit. But
   it never states that `tools/conveyor.ts` and the four re-recorded blocks must land in one commit
   in that order, so a laned split reproduces the red-suite window
   `integration-conveyor-derived-4d19:349-355` was opened to record.

### product

Verdict: **Concern** on all three.

1. **A** — solves the stated problem rather than a proxy: A is the only candidate where the print
   *after* `/write-tests` differs from the print before it. But the machine-checked leg tests the
   half that is not broken, and the dropped case is a false `implemented` on the one lane that
   exists to be the check.
2. **B** — **B closes the loop on only one of two operator surfaces.** `status.md`'s per-brief
   `next` column keeps printing `/write-tests` forever (Scope 3 passes no probe), so the operator
   whose habit is the dashboard — the artifact the parent contract built precisely so the loop is
   self-guiding — re-enters the loop. B also solves a problem the operator does not have: no
   recorded instance exists of anyone deleting a lane's tests and needing re-routing, and
   self-healing is what B pays three `tools/` files for.
3. **C** — relocates the operator's out-of-print knowledge from "which verb to invent" to "which
   printed line is stale", and books the finding's `resolved` exit while delivering its `accepted`
   branch without superseding Acceptance 1.

### ux

Verdict: **No concern** for A; **Concern** for B and C. The interface under review is the
operator-facing `NEXT` block and the two committed views.

1. **A** — no concern on this axis, structurally: one markdown file changes, so every surface keeps
   its shape, and A is the only candidate whose **stage line and step line agree**. It is also the
   only one that leaves the degraded `FALLBACK` print consistent with the resolved print; under B
   and C the *degraded* print becomes a better instruction than the *resolved* one, teaching the
   operator the fallback is more trustworthy. A's one residual cost, recorded rather than passed
   over: A is the only candidate that can render a *confident falsehood* — `implemented` on both
   views for a lane whose suite was red.
2. **B** — the probe's oracle is the brief's prose file list, and on the very brief that motivated
   this intent that list is globs and brace-expansions `fs.existsSync` can never satisfy, so B
   reprints forever with the explanatory `why` discarded by `printNextBlock`: the original bug, made
   invisible. Recovering from a misroute costs a **superseded brief** under rule 5, and the only
   symptom is a reprint.
3. **C** — `status.md`'s brief row renders `nextSteps(...)[0]` only, so the dashboard shows the
   stale line and never the forward one. Both pair members carry `kind: paste`, and nothing in the
   rendered output distinguishes the completed step from the pending one — not `kind`, not
   `rendered`, not the stage line, which reads `brief-open` before and after. C's mitigation for its
   own central weakness is addressed to a field the operator cannot read.

### compliance-risk

Verdict: **Concern** on all three, proportionate — no regulated data. The live axis is
**auditability**, which is what this repository exists to provide.

1. **A** — the only candidate that answers "was this lane verified?" from the graph alone, surviving
   a clone and a checkout of an older commit. But the flip is **undated and unattributed**: `brief`
   has no `implemented_at` and no actor field, `produced_by` is unvalidated, and Scope 1.2 does not
   require updating it — so two lanes, one flipped on a green suite and one on a red one, produce a
   byte-identical graph. Retention is clean and better than clean: Scope 4 adds a *new* fixture node
   rather than mutating the existing one.
2. **B** — the audit answer stops being durable: a checkout, a shallow clone or a `tests/`
   reorganisation retroactively changes the record of a past verification. `/detect-drift` receives
   an internally contradictory packet, since `driftmap.ts` embeds brief `status` and B keeps it
   `draft`. B creates a second class of node-less, edge-less truth that
   `intent-unbacked-addressed-guard-8c4e`'s eventual rule **cannot reach** — it can check edges, not
   what a working tree contained at merge time.
3. **C** — unverified *and* unrecorded is worse than either alone. The failure is reachable by a
   *compliant* operator, and no field, edge or file exists whose absence contradicts it: a
   fabricated verification lane is graph-indistinguishable from a real one. C makes the
   unbacked-provenance problem worse than B does, because the chain stays formally complete —
   `evidences`, `integrates`, `selects` — while the one lane whose job *is* verification records
   nothing.

**Bound on this whole axis, checked rather than assumed:** no validation rule reads brief status.
`coverage_coherence.ts` consults intent, selected-contract, evidence and integration status, and
excludes only `superseded` briefs; `validation-rules.yaml` has no rule reading brief status; and
`brief.status === "implemented"` is read in exactly two places, both in `tools/conveyor.ts` (`:314`,
`:521`). So B's and C's permanent-`draft` cost nothing a rule enforces, and A's gain is equally
unenforced. Every finding on this axis is audit-legibility, not validation.

## The case against each candidate

### contract-write-tests-flip-3a71 (A)

**A's own suite would stay green with A's entire diff reverted.** Four of six machine-checkable
acceptance items pin `:521`-before-`:574` ordering that A's Problem interpretation states already
holds with zero code change, and Acceptance 3's negative grep can only match the phrase `by hand`
because two other legitimate `/prepare-evidence` mentions in the same file are preserved
byte-for-byte by Scope 1.4. The observed failure mode — an agent that reads the clause and does not
act on it — is pinned by nothing, and `prepare-evidence.md:9-13` **silently repairs** it, leaving a
graph byte-identical to a correct run. So A's central mechanism is unobservable, its recurrence
detector is an operator remembering this intent, and its stated decisive advantage is a window one
command wide. Add the unbuildable fixture plan (Scope 4 promises three blocks stay byte-identical
while adding a brief that puts a line in each) and the understated five-artifact rollback, and A is
a contract whose cheapness is real and whose guarantees are mostly asserted.

### contract-write-tests-derived-9c48 (B)

**B would not fix the bug on the only case for which a reproduction is recorded.** Applied to
`brief-conveyor-tests-4c86`'s own file lists, seven of sixteen named paths are globs
(`tests/*.test.ts`), brace-expansions (`.../{trails.md,status.md}`) or absolute paths — none
satisfiable by `fs.existsSync` — so `allNamedTestFilesPresent` is `false` permanently and B reprints
`/write-tests` forever. In the opposite direction, every path in a `## Files to modify` list exists
*before* the lane runs, so a lane whose work is entirely modification probes `true` with zero work
done and B prints `/prepare-evidence` for an unstarted lane. B is therefore broken in **both**
directions depending on parse details it never specifies. Its fixture scope is unsatisfiable —
`brief-laned-tests-0f06` has no `## Files` section at all — its re-recorded block cannot pass either
the in-process CC-12 replay (no probe) or the CI replay (`cwd` is a scratch dir with no `tests/`),
and closing that needs an edit to `ci.yml`, another lane's file. It threads the probe into one of
four `briefSteps` entry points while the parameter's optionality makes every miss compile silently,
owes the CC-6 refusal for an agent-authored path reaching a syscall, and pays all of it on the
repo's most sensitive surface for a self-healing property that `:521` makes dead code after the
lane's first evidence.

### contract-write-tests-market-5e26 (C)

**C has no oracle: nothing in the repository differs between "tests written" and "not started", so
every leg C proposes is equally green in a world where the operator pastes line 2 and one where it
re-pastes line 1 forever.** C's own Behaviour 2 concedes the loop is "accompanied" rather than
closed, which is what its Acceptance 1 denies. Its headline architectural advantage — that views and
`spec:status` cannot disagree — is refuted by `indexer.ts:257`, which renders `nextSteps(...)[0]`,
so the dashboard shows the stale member forever while the same file's intent section shows the pair:
C commits by truncation the defect it charges against B, and does not know it. The stale first line
is not the no-op C calls it, because re-pasting re-invokes a file-writing agent with no idempotency
clause. It reds an existing test (`conveyor.test.ts:464-470`'s `only()`) that its Scope never names,
degrades what `kind: paste` promises for every printed block in the system, and turns the fixture
that currently records the bug into one that records the same shape as the intended design.
