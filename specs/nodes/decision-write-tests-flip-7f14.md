---
id: decision-write-tests-flip-7f14
type: decision
title: Select Candidate A (extend A7's flip to /write-tests) for the write-tests status-flip market, grafting B and C
decided_by: Samir Benzenine
created: 2026-07-30
produced_by: "/approve-contract"
---

SELECTED (→ approved): `contract-write-tests-flip-3a71` (Candidate **A**, extend A7's single graph
write to `/write-tests`) for `intent-write-tests-status-flip-2b64` (class 2). REJECTED (→ rejected):
`contract-write-tests-derived-9c48` (Candidate **B**) and `contract-write-tests-market-5e26`
(Candidate **C**).

The analysis of record is `comparison-write-tests-market-6e83`, which every amendment below cites
rather than restates. That comparison is unusual and the selection must be read against it: **ten
routed perspectives returned `Concern.` on all three candidates** — twenty-nine concerns and one
clean verdict across thirty pointers. No candidate was endorsed by any axis. A is selected as the
base whose defects are *amendable* rather than structural, not as a candidate that passed review.

The three candidates ship an identical goal and differ on exactly one axis — **what makes the
`test-verification` hop derivable**: a status an agent writes (A), a working-tree fact the resolver
reads (B), or a step the resolver prints unconditionally (C). Every amendment below leaves A on the
**status** position; none grafts B's probe or C's pair, so this is amendment rather than
re-proposal. If, while writing the brief, any amendment would change intended behaviour beyond the
one declaration below, STOP and return to human approval rather than widening scope inside the
winner (CLAUDE.md scope-integrity rule 5).

## Accepted trade-off (why A)

A is the only candidate that changes what the operator sees *after* `/write-tests` runs. B closes
the loop in `spec:status` alone and leaves `status.md`'s brief row printing `/write-tests` forever,
because its Scope 3 passes no probe to the indexer. C prints a pair whose first line is stale and,
through `tools/indexer.ts:257`'s `nextSteps(...)[0]` truncation, shows *only* that stale line on the
dashboard.

A is also the only candidate `ux` cleared; the only one where the stage line and the step line agree
(B and C both print `brief-open` above a `/prepare-evidence` line, the disagreement
`tools/conveyor.ts:503-509` exists to prevent); the only one whose failure direction is benign (a
skipped flip degrades to exactly today's behaviour, where B routes *forward* on file presence and C
on nothing); and the only one touching no file under `tools/`, so it neither changes the signature
of the repo's single routing entry point nor puts logic on the path that runs inside
`handlers/indexes_fresh.ts` on every `spec:validate`.

**A is additionally self-verifying, which no critic credited.** A's own delivery includes a
`test-verification` lane, so if the flip does not work, A's own chain dead-ends and the failure is
*observed* rather than argued. That is the only available evidence for the half no test can reach —
an agent reading the clause and not acting on it — and it holds **only** if amendment 21's lane
ordering is respected.

## Why each rejected candidate lost

The full case against each is `comparison-write-tests-market-6e83`'s
`## The case against each candidate`; recorded here is the reason, not the analysis.

**B — `contract-write-tests-derived-9c48`.** Its probe is broken in **both** directions on real
brief bodies, so its central mechanism is unreliable on the data it must read. Applied to
`brief-conveyor-tests-4c86`'s own file lists, 7 of 16 named paths are globs, brace-expansions or
absolute and `fs.existsSync` satisfies none — the probe is `false` permanently for the very brief
whose loop produced this intent, and B fails toward reprint, re-deriving the exact bug. Conversely
every `## Files to modify` path exists *before* the lane runs, so a modification-only lane probes
`true` with zero work done. Its fixture re-record is additionally impossible as scoped, needing a
change to `.github/workflows/ci.yml` that B's Scope names nowhere.

**C — `contract-write-tests-market-5e26`.** C has no oracle by construction: nothing in the
repository differs between "tests written" and "not started", so every leg it proposes is green
whether the operator advances or loops forever. Its own Behaviour 2 concedes it — "the loop is not
closed, it is *accompanied*" — which its Acceptance 1 denies, and its headline claim that the views
and `spec:status` cannot disagree is refuted by `tools/indexer.ts:257`. **C is the drift finding's
`accepted` branch in disguise**, booking that finding's `resolved` exit while delivering its manual
hop. That matters beyond C: the branch common-core finding 6 flags as unpriced was in fact priced by
this market and lost, rather than omitted from it.

## Grafts from B (`contract-write-tests-derived-9c48`)

1. **Both-ways falsifiability for every acceptance leg — sourced from this repository, not from B.**
   B's own legs are the ones the panel found synthetic, so citing B would import the weakness with
   the idea. The idiom is `tests/conveyor.test.ts:895-940`'s `A6 NEGATIVE LEG`, which mutates each
   command file in memory and asserts the pin still reds. Acceptance 3 must carry that treatment:
   delete the clause in memory and assert the pin fires. Four of A's five machine-checkable legs pin
   `conveyor.ts`'s `:521`-before-`:574` ordering A declares untouched, so exactly one leg has power
   today and it is a text predicate on a markdown file.
2. **State the failure direction explicitly.** A has it in substance; promote it to a named
   sentence: a skipped flip degrades to today's reprint, and that is the chosen weaker failure mode.
   Recorded as a wording upgrade, not a mechanism change.
3. **Record the invariant where the PIN lives, not where the code lives** — A has no code. A header
   comment in `tests/conveyor.test.ts` naming the closed clause set, in the idiom of `:806-808`.
4. **A leg that reds a later architectural regression.** Assert the `EXACTLY ONE GRAPH WRITE` clause
   set equals exactly `{implement-brief.md, write-tests.md}`, built on `chainCommandFiles()`
   (`tests/conveyor.test.ts:810-822`). Nothing pins that clause today, so this leg **retroactively
   protects A7**. It pins the *clause* set at two; the set of commands that may write
   `brief.status = implemented` is **three** and is documented, not pinned — see amendment 14.

## Grafts from C (`contract-write-tests-market-5e26`)

5. **C's fixture accounting was the most accurate in the market** — four transcript blocks name
   `brief-laned-tests-0f06`, at `transcript.yaml:88`, `:103`, `:170` and `:181`, because
   `contractCoverageSteps` flatMaps `briefSteps` over every outstanding brief. A's Scope 4 promises
   three of those stay byte-identical while adding a brief that would put a line in each. Amendment
   19 makes the count moot by moving none of them, but C's count is the correct baseline against
   which A's promise was measured and found false.
6. **C's atomicity requirement, upgraded.** Command-file change and re-recorded fixture in one
   commit, in that order — otherwise the branch carries a red suite mid-change, the window
   `integration-conveyor-derived-4d19`'s `rollback-sequencing` section was opened to record. See
   amendment 21 for the lane-ordering constraint this becomes across three capabilities.
7. **C's patch-market precedence statement is deliberately NOT grafted** — A's Behaviour 5 is more
   detailed. But see amendment 20: A's version carries a real omission on the same subject.

## Mandatory fixes, A-specific

8. **Scope 4's fixture plan is wrong** — superseded entirely by amendment 19.
9. **Echo the runner's own observed exit status, not the agent's narration.** Behaviour 1 gates the
   flip on `test-writer` reporting the suite green, and that agent reads the files under test — the
   material `.claude/agents/test-writer.md:28-29` already warns is data and not instruction — so an
   injected "report green" becomes a recorded `implemented` rather than merely a wrong console line.
   Add the grep term so this is pinned, not prose. **This is a HOW refinement**: it strictly narrows
   the states in which the mutation occurs and adds no writer, no field and no print.
10. **Correct Scope 2's `CLAUDE.md` target.** Document the second flip at lane rule 1 and in the
    conveyor subsection. Do **NOT** place `/write-tests` under the lifecycle Implementation step,
    which is `/implement-brief`'s and where A7's rule-5 approval is recorded — doing so would make
    the governing document assert that `/write-tests` *is* the Implementation step, which lane rule
    1 forbids.
11. **State Acceptance 3's grep honestly.** It can only match the phrase `by hand`, because
    `write-tests.md:27` and `:33` legitimately mention `/prepare-evidence` and Scope 1.4 preserves
    both byte-for-byte. A leg asserting the absence of the command name would be unsatisfiable.
12. **Add the red-suite case with a named remediation** — the largest gap in the graft list. A red
    verification suite is the *ordinary* state, since `.claude/lanes/test-verification.md:10-16`
    puts the code under test in five other lanes first. A currently forbids the flip, reprints
    `/write-tests`, and offers no remediation, and Scope 1.3's `ON RED` is modelled on a failed
    **graph write**, not a failed suite. Name: no flip, no next step, and the remediation — which
    points at another lane's files and is therefore a `drift-finding` plus a rule-5 route.
13. **Add an `IDEMPOTENT / RE-ENTRANT` clause to `write-tests.md`**, mirroring
    `prepare-evidence.md:24-28`, covering the red-suite re-run. A shrinks the re-run window and is
    best placed to discharge this cheaply.
14. **Correct Out-of-scope 3.** The *clause* set is two; the commands that may write `implemented`
    are **three** — `/implement-brief`, `/prepare-evidence`, `/write-tests`. A's Out-of-scope 3
    conflates them.
15. **Couple the `drift-finding-write-tests-no-flip-7e52` → `resolved` write to the recorded
    acceptance run's commit**, not to merge, and state the revert obligation back to `open`. That
    node's own condition requires closure under a recorded decision, and it is the sole durable
    record of the defect's observable behaviour.
16. **DOCUMENT, never change, the `## Strategy tension` early-return consequence.** Because `:521`
    returns before `:574`, a `test-verification` brief carrying that marker silently loses its
    `/propose-patches` offer once its tests are written. Changing that behaviour would be a second
    rule-5 event and is **not** approved here; documenting the consequence is a HOW refinement and
    is.
17. **Fix the clause INSERTION POINT. This defect was missed by all ten routed perspectives and is
    the sharpest item in this decision.** `write-tests.md:19` is the `NEXT BLOCK:` clause and sits
    **above** the `KNOWN GAP` block at `:21-25` that Scope 1.1 deletes. In `implement-brief.md` the
    mutation (`:18`) strictly precedes the print (`:38`), and in these prompt files placement is the
    only ordering signal there is. Insert A's clauses where the `KNOWN GAP` was and the command is
    instructed to print the `NEXT` block **before** it flips — and the pre-flip block is
    `paste /write-tests <brief-id>`. **A would reproduce the exact bug verbatim, with its clause
    present and Acceptance 3 green.** The mutation clauses MUST be inserted **before**
    `write-tests.md:19`, and Acceptance 3 must assert **relative order**, not mere presence.
18. **The insertion window is fully determined, and amendment 17 is only half the reason.**
    `tests/conveyor.test.ts:823-843`'s `exciseFallbacks` treats the fallback region as running from
    the line exactly equal to `FALLBACK (RESOLVER UNAVAILABLE):` (`write-tests.md:29`) to the next
    pure ALL-CAPS label line — and there is none, so it runs to EOF. Any clause placed after `:29`
    is excised from the A6.2 scan and, if it carries a resolved id, trips A6.4. **Insert between
    `:17` and `:19`.**
19. **Replace Scope 4's fixture plan with a new trail I** — not a brief plus an edge, and *not* a
    flip of `brief-laned-tests-0f06`. Flipping `0f06` looks cheapest and **destroys evidence**:
    `transcript.yaml:89`, `:104`, `:171` and `:182` are the only four recordings of the 2.5(c)
    judgement reminder, all four come from `0f06`, and they vanish because A's own Behaviour 4 has
    `:521` return before the reminder appends. Trail I is an `intent`, a `contract`, a `selects`
    `decision` and an `implemented` `lane: test-verification` brief, all `created: 2026-06-11` so
    both dated cutoffs grandfather it; repoint `transcript.yaml:99-100`'s `node` and update the
    manifest header's eight-trails-A-H list. **Zero existing blocks move and the 2.5(c) recording
    survives.** Honest framing to carry: the existing recorded block for a `draft` `0f06` is *not*
    the bug — it is the correct pre-run output. What is stale is the manifest's post-run semantics,
    which is why the entry is repointed rather than rewritten.
20. **Correct Behaviour 5's omission.** `:521` returns **unconditionally** before `:533`, so an
    `implemented` brief that later has a market opened prints `/prepare-evidence` and **never** the
    market steps. A creates the first population of `implemented` `test-verification` briefs, so the
    interaction becomes live under A. A introduces no new behaviour here — it is already true for
    `/implement-brief`'d briefs — but the sentence reads as a guarantee it does not hold. Correct it
    and pin it cheaply.
21. **State the LANE ORDERING constraint, not merely commit ordering.** A's diff spans
    `capability-lifecycle-commands-4f5a`, `capability-spec-tests-3a6e` and `specs/{nodes,graph}/**`.
    Because Acceptance 1 nominates **A's own verification lane** as the discharging run, the
    `api-integration` lane editing `write-tests.md` must land **before** the `test-verification`
    lane runs, or the acceptance run exercises the old file and proves nothing. No candidate states
    this, and A's self-verifying property depends on it.

## Common-core findings (binding in full)

All **thirteen** findings of `comparison-write-tests-market-6e83` are binding in full. This decision
does not summarise them and they must not be read as covered by the amendments above.

Finding 1 is the headline and must be carried into the brief's own text: `/prepare-evidence` already
flips a laned brief to `implemented` (`prepare-evidence.md:9-13`), and both live `test-verification`
briefs are already `implemented` although lane rule 1 forbids `/implement-brief` on either. **So the
`draft` window is one command wide, not permanent.** A's Trade-off 2 must be restated accordingly,
or this decision reads as endorsing the overstatement. The defect A fixes is a one-step ordering
gap, not a missing fact.

## Rule-5 declaration

Extending A7's single graph write to a second command changes intended behaviour beyond A7's letter,
which named only `/implement-brief`. **That change is approved here** under CLAUDE.md
scope-integrity rule 5, on the `decision-conveyor-derived-5a91` precedent.

**Exactly one such declaration is made.** Amendment 9 is a HOW refinement and rides in as an
amendment. Amendment 16 explicitly withholds approval for changing the `## Strategy tension`
behaviour. Any extension of the single-write pattern to a third command requires its own decision.

## Routed out, not amended

Recorded so none of it is silently absorbed:

1. **Dating and attributing the flip is NOT binding.** `brief.required_fields` carries no actor or
   timestamp field; adding one edits `specs/schema/node-types.yaml`, which is `sensitive_paths`'
   sole glob; A's Out-of-scope 4 forbids a new field; and **A's own Acceptance 5 makes
   "`git diff --stat` names no file under `specs/schema/`" a falsifiable leg**, so dating would red
   A's own acceptance. Resolution without widening: decline the field. The dated, attributed record
   *is* the `evidence` node, whose `created` is required, written one command later; put date and
   actor in the transcript via `ECHO BEFORE MUTATING`, never in the graph. **Residual accepted and
   stated:** a green-suite flip and a red-suite flip produce byte-identical graphs.
2. **Fixing the silent repair at `prepare-evidence.md:9-13`** — which destroys a skipped flip's
   diagnostic — would change intended behaviour on a **second** command file A's Scope names
   nowhere. That is a distinct rule-5 event; route it to a follow-up intent rather than riding it
   in. Common-core finding 1 bounds the cost to one command, which is why deferral is defensible.
3. **Sequencing `integration-conveyor-derived-4d19` back to `final`**, and superseding
   `contract-conveyor-derived-4c8c` Acceptance 1's wording if the manual hop is later ratified — a
   new intent against `capability-lifecycle-commands-4f5a`, not a fourth candidate in this market.

## Consequences

- `contract-write-tests-flip-3a71` → **`approved`**. The approved contract body is never edited; the
  **effective contract** is this contract plus the twenty-one amendments and thirteen common-core
  findings above.
- `contract-write-tests-derived-9c48` → **`rejected`**.
- `contract-write-tests-market-5e26` → **`rejected`**.
- `intent-write-tests-status-flip-2b64` stays **`open`**. An intent stays open through selection and
  reaches `addressed` only when its contract is covered.
- `drift-finding-write-tests-no-flip-7e52` stays **`open`**. Amendment 15 couples its closure to the
  recorded acceptance run, not to this decision.
- `comparison-write-tests-market-6e83` is unchanged. A comparison is never superseded by selection.
- `integration-conveyor-derived-4d19` stays **`draft`** and `intent-self-guiding-delivery-loop-6d79`
  stays **`open`**; routed-out item 3 owns their sequencing.

**Next step:** `/write-brief contract-write-tests-flip-3a71` — class 2 permits a single unlaned
brief, and amendment 21's lane ordering applies if the brief is instead decomposed. The brief must
carry all twenty-one amendments and all thirteen common-core findings, naming each by its
identifier.
