---
id: brief-write-tests-flip-4e19
type: brief
title: Extend A7's single graph write to /write-tests — command clauses, the CLAUDE.md record, the clause-set and negative-leg pins, and transcript trail I
status: implemented
created: 2026-07-30
produced_by: "/write-brief"
---

This brief decomposes `contract-write-tests-flip-3a71` (status: approved, class 2) for
`intent-write-tests-status-flip-2b64` (status: open, class 2), per its selecting decision
`decision-write-tests-flip-7f14`. **The effective contract is the contract body plus that decision's
twenty-one amendments and thirteen common-core findings**; both sets are carried below by
identifier, and work that satisfies the body while dropping an amendment is not done.

**ROUTING CHOICE, recorded because it is a choice.** Class 2 makes lanes *optional*. This is a
**deliberate unlaned single brief**: the whole diff is four files plus five small fixture nodes, no
two of which are separable by surface, and a lane split would buy ceremony rather than isolation.
Consequence, stated rather than discovered later: a single-brief contract skips integration
(CLAUDE.md lane rule 2), so this contract completes at this brief's lone **final evidence**.

**VERIFICATION PATH, and how separation of duties still holds.** `/write-tests` refuses any brief
whose `lane` is not `test-verification` (`.claude/commands/write-tests.md:4-6`), and Out-of-scope 1
keeps that precondition byte-for-byte — widening it is `intent-write-tests-unlaned-brief-b3d8`, not
this change. So this brief takes that command's own **recoverable action (b)**: the tests are
written outside `/write-tests`, by `test-writer`, in an invocation **separate** from the one that
edits `.claude/commands/write-tests.md`. Only the entry point differs; the invariant lane rule 1
exists to protect — the code's author does not mark its own work — is unchanged, and step 5 below
makes the separation an ordered requirement, not an intention.

## Grounding (reuse, don't reinvent)

All paths absolute under `/home/samir/workspace/pactwright/`. Every anchor below was verified in
this session; re-confirm before editing, since earlier edits shift line numbers.

- **`.claude/commands/write-tests.md` is 39 lines.** Input `:4-6`; `REFUSAL REPORT` `:7-14`;
  invoke-test-writer `:15-17`; **`:18` is the file's only blank line**; `NEXT BLOCK:` `:19-20`;
  `KNOWN GAP` `:21-25`; `CLOSING REPORT:` `:26-28`; `FALLBACK (RESOLVER UNAVAILABLE):` opens `:29`;
  `CONVEYOR:` `:38-39`.
- **`:15-17` stays TRUE and must not be "fixed".** It says *the agent* performs no graph writes —
  still correct after this change, because the **command** invokes graph-maintainer and
  `test-writer` never does. `.claude/agents/test-writer.md:24-25` is the same sentence about the
  same agent and is likewise untouched. A later reader must not read either as newly false.
- **`.claude/commands/implement-brief.md` is the model, including its ORDER**: blank `:17` →
  `EXACTLY ONE GRAPH WRITE:` `:18-30` → blank `:31` → `ECHO BEFORE MUTATING:` `:32-33` → the
  mutating-step line `:34-35` → `ON RED:` `:36-37` → `NEXT BLOCK:` `:38-40`. Mutation precedes
  print.
- **`.claude/commands/prepare-evidence.md`** — `:9-13` already flips a laned brief to `implemented`;
  `:24-28` is the `IDEMPOTENT / RE-ENTRANT:` clause amendment 13 mirrors. Neither is edited here.
- **`tests/conveyor.test.ts` idioms to reuse, never reinvent:** `chainCommandFiles()` `:810-816`
  (readdir `.claude/commands`, drop `NON_CHAIN`, sort); `fallbackRanges` / `fallbackRegions` /
  `exciseFallbacks` `:818-843`; the `A6 NEGATIVE LEG` `:895-941` (mutate in memory, assert the pin
  reds, assert `fallbackRegions` stayed byte-identical, re-inject inside the fallback and assert it
  still reds); the header-comment idiom `:19-46` and `:807-808`; builders
  `node`/`edge`/`spec`/`withBody` `:57-71`; `only()` `:86-89`; `CORPUS` `:348-368`.
- **`CORPUS` is not optional.** A synthetic graph not appended there is invisible to the
  kind/why/determinism/never-empty sweeps.
- **`tests/conveyor.test.ts:464-470` is NOT at risk and must not be "fixed".** `gTestLane`'s brief
  is `draft` (`:171`); this change touches only the `implemented` path. It stays green untouched.
- **Nothing pins `EXACTLY ONE GRAPH WRITE` today** — repo-wide the only live hit is
  `implement-brief.md:18`; every other match is spec-graph prose. Amendment 4's set-equality leg
  therefore **retroactively protects A7** as well as this change.
- **`CLAUDE.md` anchors:** lifecycle step 6 is `:96-102` and is `/implement-brief`'s, carrying A7's
  rule-5 approval — `/write-tests` does **not** go there (amendment 10). Lane rule 1 is `:220-222`
  and already names `/write-tests`; the conveyor section is `:302-310`.
- **`tests/fixtures/conveyor-transcript/transcript.yaml`** — 17 entries. The recording procedure is
  `:16-20`: run `node_modules/.bin/tsx tools/spec.ts status <node-id>` with cwd a **copy** of the
  fixture and paste verbatim. Header says "eight trails, A-H" at `:22`, list at `:22-35`. The
  `REGENERATED <date>:` comment idiom is `:134-140`. The `write-tests` entry is `:99-105`.
- **`brief-laned-tests-0f06` must not move.** Three other entries (`:83-90`, `:165-172`, `:176-183`)
  print its step and stay valid only while it is `draft`, and the four
  `action consider whether this lane deserves a patch market` lines (`:89`, `:104`, `:171`, `:182`)
  are the fixture's **only** recordings of the 2.5(c) reminder — all four sourced from `0f06`.
- **`brief-done-tests-1c06` cannot serve the pin** either: it is already `implemented` +
  `test-verification` but carries final evidence, so `conveyor.ts:510` fires before `:521` and it
  routes to contract coverage. Trail I is needed because no existing node has the shape.
- **Fixture constraints.** Field order in that fixture's `edges.yaml` is
  `id, source, type, target, created`. No `YYYY-MM-DD` in any node title (CC-8 leg 3). Its schema
  omits the `drift-finding`, `capability` and `override` node types and the `touches`, `flags`,
  `waives` edge types, so trail I uses none. `tests/spec.test.ts:331-369` requires `spec:index` then
  `spec:validate` to exit 0 on it, and it must keep **no** committed `specs/indexes/`.
- **Harness.** `package.json:12` is `node --test --import tsx tests/*.test.ts`; in this PRoot
  environment `pnpm` is broken, so the canonical `pnpm spec:index && pnpm spec:validate` runs as
  `node_modules/.bin/tsx tools/spec.ts index && node_modules/.bin/tsx tools/spec.ts validate`.

## Pinned decisions

### The clause literal contract for `write-tests.md` (pinned, not negotiated at write time)

The command file and the test file are one negotiated pair; these literals are what the pins assert,
so neither artifact may vary them unilaterally.

1. Label token `EXACTLY ONE GRAPH WRITE:` appears in the file's text **outside** every fallback
   region.
2. `ECHO BEFORE MUTATING:` appears and its clause contains the exact phrase
   `the test runner's own exit status`.
3. The line ``The mutating step ends with `pnpm spec:index && pnpm spec:validate` `` appears.
4. `ON RED:` (failed graph write) and `ON RED SUITE:` (red verification suite) are **two distinct
   labels**; both appear. `ON RED:` never satisfies a search for `ON RED SUITE:` and vice versa.
5. `IDEMPOTENT / RE-ENTRANT:` appears.
6. **Relative order:** the line index of `EXACTLY ONE GRAPH WRITE:` is strictly less than the line
   index of `NEXT BLOCK:`.
7. **Negative:** the phrase `by hand` appears nowhere in the non-fallback text.
8. The `FALLBACK (RESOLVER UNAVAILABLE):` region (`:29-37`) and the precondition/`REFUSAL REPORT`
   block (`:4-14`) are **byte-unchanged**.

### The twenty-one amendments of `decision-write-tests-flip-7f14`

1. **Both-ways falsifiability.** Every new command-file leg carries the `A6 NEGATIVE LEG` treatment
   (`tests/conveyor.test.ts:895-941`): mutate in memory, assert the pin reds.
2. **Failure direction, named.** A sentence in the clause and in the test-file header: a skipped
   flip degrades to exactly today's reprint, and that is the chosen weaker failure mode.
3. **The invariant lives where the PIN lives.** A header comment in `tests/conveyor.test.ts` naming
   the closed clause set, in the `:806-808` idiom.
4. **Clause-set equality.** Assert the set of chain command files whose non-fallback text contains
   `EXACTLY ONE GRAPH WRITE:` equals exactly `{implement-brief.md, write-tests.md}`, built on
   `chainCommandFiles()`. Nothing pins this today, so the leg retroactively protects A7.
5. **C's fixture accounting is the baseline** — four blocks name `0f06`; amendment 19 moves none.
6. **Atomicity.** Command-file change and re-recorded fixture in **one commit, in that order**.
7. Not grafted — Behaviour 5 stands, as corrected by amendment 20.
8. Scope 4's fixture plan is void; amendment 19 replaces it entirely.
9. **Echo the runner's exit status, not the agent's narration** — literal 2 above. A HOW refinement:
   it narrows the states in which the mutation occurs and adds no writer, field or print.
10. **CLAUDE.md target.** Lane rule 1 (`:220-222`) and the conveyor section (`:302-310`). **NOT**
    the lifecycle Implementation step (`:96-102`), which is `/implement-brief`'s and where A7's
    rule-5 approval is recorded.
11. **Grep stated honestly.** The negative leg matches `by hand` only; `write-tests.md:27` and `:33`
    legitimately name `/prepare-evidence` and are preserved, so a command-name absence leg would be
    unsatisfiable.
12. **Red suite, with a named remediation** — literal 4's `ON RED SUITE:`: no flip, no next step,
    and the remediation is a `drift-finding` plus a rule-5 route, because a red verification suite
    points at another lane's files.
13. **`IDEMPOTENT / RE-ENTRANT:`** mirroring `prepare-evidence.md:24-28`, covering the red-suite
    re-run and the already-`implemented` no-op.
14. **Contract-text correction, restated here:** the *clause* set is **two**; the commands that may
    write `implemented` are **three** — `/implement-brief`, `/prepare-evidence`, `/write-tests`.
    Out-of-scope 3 conflates them. The pin is on the clause set only.
15. **Drift finding stays `open` here.** Its `resolved` write is coupled to the recorded acceptance
    run's commit (Acceptance 1, deferred), not to merge, with a stated revert obligation back to
    `open`.
16. **Contract-text correction, restated here:** because `:521` returns before `:574`, an
    `implemented` `test-verification` brief carrying `## Strategy tension` silently loses its
    `/propose-patches` offer. **DOCUMENT this; changing it is a second rule-5 event and is not
    approved.** One line in the clause, one recording leg in the tests.
17. **Insertion point.** The mutation clauses go **before `write-tests.md:19`**. Placing them where
    `KNOWN GAP` was would instruct the command to print `NEXT` before it flips — and the pre-flip
    block is `paste /write-tests <brief-id>`, reproducing the exact bug with the clause present.
    Acceptance 3 asserts **relative order**, not mere presence (literal 6).
18. **Upper bound on the window.** `exciseFallbacks` closes a region at the next line matching
    `/^[A-Z][A-Z0-9 /()-]*:$/`, and **no such line follows `:29`** (`CONVEYOR:` carries prose on the
    same line and does not match), so the region runs to EOF. Anything placed after `:29` is excised
    from A6.2's scan and trips A6.3/A6.4. **Insert between `:17` and `:19`.**
19. **A NEW TRAIL I in the transcript fixture — not a brief plus an edge, and NOT a flip of
    `brief-laned-tests-0f06`.** Flipping `0f06` looks cheapest and **destroys evidence**: the four
    `action consider…` lines at `transcript.yaml:89`, `:104`, `:171` and `:182` are the fixture's
    only recordings of the 2.5(c) reminder, all sourced from `0f06`, and they vanish because `:521`
    returns before the reminder appends. Trail I is standalone, dated `2026-06-11` so both cutoffs
    grandfather it, and **zero existing blocks move**. Honest framing to carry into the fixture
    comment: the existing recorded block for a `draft` `0f06` is **not** the bug — it is the correct
    pre-run output; what is stale is the manifest's post-run semantics, which is why the entry is
    **repointed** rather than rewritten. Files listed under `## Files to create` and
    `## Files to modify` items 4-5.
20. **Contract-text correction, restated here:** `:521` returns **unconditionally** before `:533`,
    so an `implemented` brief that later has a market opened prints `/prepare-evidence` and
    **never** the market steps. Not new behaviour, but Behaviour 5 reads as a guarantee it does not
    hold. Correct it in the clause text and pin it cheaply.
21. **Ordering, which for an unlaned brief is a WITHIN-BRIEF ordering.** No lanes exist to sequence;
    the constraint survives as step order: `.claude/commands/write-tests.md` is edited and committed
    **before** any acceptance run, or the run exercises the old file and proves nothing.

### The thirteen common-core findings of `comparison-write-tests-market-6e83` (binding in full)

1. **Headline — carry into the artifacts.** `/prepare-evidence` already flips a laned brief to
   `implemented` (`prepare-evidence.md:9-13`), and both live `test-verification` briefs are already
   `implemented` although lane rule 1 forbids `/implement-brief` on either. **The `draft` window is
   ONE COMMAND WIDE, not permanent.** Contract Trade-off 2 is restated accordingly: the defect is a
   one-step ordering gap, not a missing fact. This sentence goes in the test-file header comment and
   in the CLAUDE.md record, so no reader takes the overstatement as endorsed.
2. **The loop is real notwithstanding finding 1** — `conveyor.ts:574` does dead-end paste-only
   operation. That is the rationale for building this at all; recorded, not re-argued.
3. **Greenness is not observable**, and amendment 9 narrows rather than solves it. Honest bound
   stated in the clause and in this brief's evidence.
4. **The red-suite artifact** is amendment 12.
5. **Premature `resolved` is a false closure** — amendment 15 defers it.
6. **The finding's `accepted` branch was priced by this market and lost** (the decision's case
   against C). Recorded so a later reader does not reopen it as an omission.
7. **No idempotency clause today** — amendment 13.
8. **`## Strategy tension` interaction** — amendment 16.
9. **`Step.why` is never printed** (`tools/spec.ts:39` renders `${s.kind} ${s.rendered}`). **No
   acceptance leg in this brief may depend on an operator reading `why`**; none does.
10. **The FALLBACK region** (`:29-37`) stays byte-unchanged and becomes consistent rather than
    compensatory — it already prints `/prepare-evidence <brief-id>`. Amendment 18 is the machine
    reason not to touch it.
11. **`integration-conveyor-derived-4d19`'s return to `final` is NOT sequenced here** — routed-out
    item 3 of the decision. Named in Non-scope so it is deferred, not dropped.
12. **Every structural claim about `tools/conveyor.ts` checks out** (`:510`, `:521`, `:533`,
    `:574`), which is why no file under `tools/` is edited — and why the four ordering legs are
    retained with their weakness admitted rather than presented as coverage of the change.
13. **No personal data, payments, credentials or network egress** — an explicit clean finding, not
    silence. The live axis is the integrity of the verification claim, handled by amendment 9.

## Files to create

Five fixture nodes under
`/home/samir/workspace/pactwright/tests/fixtures/conveyor-transcript/specs/nodes/`, all
`created: 2026-06-11` (both dated cutoffs are `2026-06-18`, so both grandfather them), all titles
free of any `YYYY-MM-DD`, each body naming "Trail I" in the style of trails A-H:

1. `intent-tested-1d01.md` — `type: intent`, `status: open`, `class: 2`.
2. `contract-tested-1d02.md` — `type: contract`, `status: approved`, `class: 2`.
3. `contract-tested-alt-1d03.md` — `type: contract`, `status: candidate`, `class: 2`. **Required:**
   `class-market-quorum` needs ≥2 live candidates on a selected class-≥2 intent.
4. `decision-tested-1d04.md` — `type: decision`, **status-less** (the fixture schema's `decision`
   block requires `decided_by`, not `status`).
5. `brief-tested-1d05.md` — `type: brief`, `status: implemented`, `lane: test-verification`, **no
   evidence node and no `evidences` edge**. This is the shape nothing in the fixture has today.

## Files to modify

1. `.claude/commands/write-tests.md` — delete `KNOWN GAP` (`:21-25`); insert the clause block
   between `:17` and `:19` per amendments 17 and 18, in `implement-brief.md`'s order and satisfying
   every literal of the clause literal contract. `:4-14`, `:15-17`, `:26-28` and `:29-37` unchanged.
2. `CLAUDE.md` — lane rule 1 (`:220-222`) and the conveyor section (`:302-310`) record that
   `/write-tests` carries the same single graph write, citing `decision-write-tests-flip-7f14`, and
   carry finding 1's one-command-wide bound. The lifecycle Implementation step (`:96-102`) is
   **not** touched. Command and governing document land in the same diff — no repeat of the intra-PR
   disagreement `implement-brief.md:29-30` records.
3. `tests/conveyor.test.ts` — the header comment (amendments 2, 3 and finding 1) plus the legs of
   Acceptance 2 and 3; three new synthetic graphs, all appended to `CORPUS`.
4. `tests/fixtures/conveyor-transcript/specs/graph/edges.yaml` — a `# Trail I` block of four edges,
   field order `id, source, type, target, created`, all `created: 2026-06-11`:
   `edge-tested-proposes-1d11` (`contract-tested-1d02` —proposes→ `intent-tested-1d01`),
   `edge-tested-alt-proposes-1d12` (`contract-tested-alt-1d03` —proposes→ `intent-tested-1d01`),
   `edge-tested-selects-1d13` (`decision-tested-1d04` —selects→ `contract-tested-1d02`),
   `edge-tested-decomposes-1d14` (`brief-tested-1d05` —decomposes→ `contract-tested-1d02`).
5. `tests/fixtures/conveyor-transcript/transcript.yaml` — header `:22` "eight trails, A-H" → "nine
   trails, A-I" with a trail I line added to the `:22-35` list; the `write-tests` entry's `node`
   (`:100`) repointed to `brief-tested-1d05` and its `block` re-recorded by the `:16-20` procedure;
   a `REGENERATED 2026-07-30:` comment above it, in the `:134-140` idiom, carrying amendment 19's
   honest framing.

No other file in the repository is touched.

## Ordered implementation steps

1. **Re-confirm the anchors before editing.** `write-tests.md` is 39 lines with its only blank line
   at `:18`; `NEXT BLOCK:` at `:19`; `KNOWN GAP` at `:21-25`; the fallback opener at `:29` with no
   ALL-CAPS label line after it. If any differs, stop and re-derive rather than editing by line
   number.
2. **Edit `.claude/commands/write-tests.md`** (amendments 17, 18, 21). Delete `:21-25`. Insert, in
   this order and all before the `NEXT BLOCK:` line: `EXACTLY ONE GRAPH WRITE:` (flip
   `draft`|`approved` → `implemented` on this brief and nothing else, through graph-maintainer,
   never inline, only after a green suite — plus one line each for amendment 2's failure direction,
   amendment 16's dropped `/propose-patches` offer, and amendment 20's unconditional `:521` return);
   `ON RED SUITE:` (no flip, no next step, remediation = `drift-finding` + rule-5 route);
   `IDEMPOTENT / RE-ENTRANT:`; `ECHO BEFORE MUTATING:` (brief id, current status, and **the test
   runner's own exit status**); the `pnpm spec:index && pnpm spec:validate` line; `ON RED:`. Leave
   `:15-17` alone — it remains true of the *agent*.
3. **Edit `CLAUDE.md`** (amendment 10) at lane rule 1 and the conveyor section only.
4. **Author the fixture, then re-record — same commit as steps 2-3, in that order** (amendment 6).
   Write the five trail I nodes and the four edges; run
   `node_modules/.bin/tsx tools/spec.ts index && node_modules/.bin/tsx tools/spec.ts validate` in a
   **copy** of the fixture to confirm both exit 0 and to leave the fixture itself with **no**
   `specs/indexes/`; then run `node_modules/.bin/tsx tools/spec.ts status brief-tested-1d05` in that
   copy and paste the block verbatim. Expected shape, as a check on the run and **not** as text to
   hand-write: stage `brief-implemented`, one step, `paste /prepare-evidence brief-tested-1d05`.
   Re-run the full transcript replay: the four `0f06` blocks and the 2.5(c) recordings must be
   byte-identical.
5. **In a SEPARATE invocation** (the verification-path requirement above), have `test-writer` write
   `tests/conveyor.test.ts`'s new legs — tests under `tests/` only, no graph writes:
   1. **Acceptance 2** — `gTestLaneImplemented`: approved class-2 contract + `decomposes` edge +
      brief `{ status: "implemented", lane: "test-verification" }`. `only(nextSteps(...))` is
      `/prepare-evidence <brief-id>`, `kind: "paste"`, the step set excludes `write-tests`, and
      `deriveStage(...) === "brief-implemented"`. Append to `CORPUS`.
   2. **Amendment 20** — `gImplementedMarketLate`: the same brief plus `patch_market: true` and no
      comparison; still exactly one step, `/prepare-evidence`, never `/compare-patches`. Append to
      `CORPUS`.
   3. **Amendment 16** — the same brief with a `## Strategy tension` body via `withBody`: exactly
      one step, no `/propose-patches`. Comment it as **recording** the early-return consequence,
      which amendment 16 forbids changing. Append to `CORPUS`.
   4. **Acceptance 3** — over `write-tests.md`: literals 1-5 present in `exciseFallbacks(text)`,
      literal 6's relative order over line indices, literal 7's `by hand` absence.
   5. **Amendment 4** — set equality of the `EXACTLY ONE GRAPH WRITE:` clause set with exactly
      `{implement-brief.md, write-tests.md}`, built on `chainCommandFiles()`.
   6. **Amendment 1** — the negative leg, modelled on `:895-941`: (a) delete the clause block in
      memory and assert the presence and set-equality legs red, asserting `fallbackRegions` stayed
      byte-identical; (b) move the block below the `NEXT BLOCK:` line in memory and assert the
      relative-order leg reds; (c) re-inject the clause **inside** the fallback region and assert
      the presence leg still reds.
   7. **Amendments 2, 3 and finding 1** — the header comment naming the closed clause set, the
      chosen failure direction, and the one-command-wide bound.
6. **Run everything and commit nothing on red.** `node --test --import tsx tests/*.test.ts` green,
   then `node_modules/.bin/tsx tools/spec.ts index && node_modules/.bin/tsx tools/spec.ts validate`
   green on the post-change tree. Each commit is individually green; never weaken a leg to reach it
   — CLAUDE.md rule 5 governs.
7. **Falsify Acceptance 5 in one command:** `git diff --stat` for the whole change names no file
   under `tools/` and none under `specs/schema/`.

## Non-scope

- **`tools/**` — no file, declared and not incidental.** Finding 12 confirms every structural claim
  about `tools/conveyor.ts`; there is nothing to change there.
- **`specs/schema/**`** — no new field, no `implemented_at`, no actor field, no validation rule, no
  CI gate. Dating and attributing the flip is routed out, not deferred silently: the dated record is
  the `evidence` node, and the residual (a green-suite flip and a red-suite flip produce
  byte-identical graphs) is accepted and stated.
- **`.claude/commands/prepare-evidence.md`** — its `:9-13` silent repair of a skipped flip is a
  distinct rule-5 event on a second command file; routed to a follow-up intent, not ridden in.
- **`/write-tests` on an unlaned brief** — `intent-write-tests-unlaned-brief-b3d8`. The precondition
  and `REFUSAL REPORT` are unchanged byte-for-byte.
- **`/implement-brief` on a graph-data lane** — `intent-implement-brief-graph-lane-b3f5`.
- **A third command acquiring the clause** — the closed *clause* set is two (amendment 14); a third
  needs its own decision.
- **`drift-finding-write-tests-no-flip-7e52` stays `open`** through this brief and its evidence
  (amendment 15).
- **`integration-conveyor-derived-4d19`'s return to `final`** and any superseding of
  `contract-conveyor-derived-4c8c` Acceptance 1's wording — finding 11 and routed-out item 3; a new
  intent against `capability-lifecycle-commands-4f5a`.
- **Flipping `brief-laned-tests-0f06`, or attaching the new fixture brief to any existing
  contract.** Trail I is standalone precisely so zero existing blocks move.

## Acceptance & verification

**Dischargeable by this brief: Acceptance 2, 3, 4, 5. Deferred: Acceptance 1, and Acceptance 6 with
it. Review-only: Acceptance 7.** Stated plainly rather than discovered at evidence time.

1. **Acceptance 1 is DEFERRED, and this brief says so.** It nominates "the next `test-verification`
   lane — this change's own verification lane included". **This is an unlaned brief and has no
   verification lane**, so the paste-only live run has no host here. It discharges on the next
   `test-verification` lane run after this change lands; its remediation on failure is a
   `drift-finding` plus a rule-5 route. Do not claim it, and do not manufacture a lane to host it.
2. **Acceptance 6 is coupled to it by amendment 15**, so `drift-finding-write-tests-no-flip-7e52`
   remains **`open`** at this brief's evidence, and the evidence records why rather than leaving the
   reader to infer it.
3. **Acceptance 2** → step 5.1: `nextSteps` on an `implemented` `lane: test-verification` brief
   returns exactly one step, `/prepare-evidence <brief-id>`; `deriveStage` is `brief-implemented`;
   moving the `:574` lane branch above `:521` reds it. **Admitted weakness (finding 12, qa-test):
   this leg pins ordering the change does not touch, and is green with the whole diff reverted.**
4. **Acceptance 3** → steps 5.4-5.6: presence, **relative order** (amendment 17), the honest
   `by hand` negative (amendment 11), the two-member clause set (amendment 4), each with a negative
   leg that reds (amendment 1). This is the only leg with power over the diff, and the brief says
   so.
5. **Acceptance 4** → step 4: no manifest entry records a `/write-tests` block that reprints
   `/write-tests` for the node just written; the new block was produced by the manifest's own
   procedure; the four `0f06` blocks and all four 2.5(c) recordings are byte-identical.
6. **Acceptance 5** → step 7, falsifiable in one command.
7. **Acceptance 7, review-only and admitted** → whether an agent will reliably run the flip, and
   whether it judged the suite green honestly, stays reviewer judgement. Recorded in the evidence,
   never claimed away.

---

**Edge for graph-maintainer to record for this brief node:**
`brief-write-tests-flip-4e19 —decomposes→ contract-write-tests-flip-3a71`, with this brief carrying
**no `lane` key** (a deliberate unlaned single brief) and **no `owner` key**.

**Capability wiring, for this brief's later `/prepare-evidence`:** the diff falls under
`capability-lifecycle-commands-4f5a` (`.claude/commands/**`, `CLAUDE.md`) and
`capability-spec-tests-3a6e` (`tests/**`); confirm both globs against `specs/indexes/by-type.yaml`
at evidence time and author one `touches` edge per capability.

**Mutating-step reminder:** when graph-maintainer records this brief (and later its evidence and
`touches` edges), the step ends with `pnpm spec:index && pnpm spec:validate` — in this PRoot
environment
`node_modules/.bin/tsx tools/spec.ts index && node_modules/.bin/tsx tools/spec.ts validate` — and
must not commit on failure.
