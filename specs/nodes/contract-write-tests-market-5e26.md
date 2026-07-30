---
id: contract-write-tests-market-5e26
type: contract
title: Treat the test-verification lane branch as terminal-once-run (ordered two-step print, no flip, no probe)
status: rejected
created: 2026-07-30
class: 2
produced_by: "/propose-contracts"
---

This contract proposes `intent-write-tests-status-flip-2b64` (class 2) and is candidate **C** of
three. The market's single axis is **what makes the `test-verification` hop derivable**: a status an
agent writes (A, `contract-write-tests-flip-3a71`), a working-tree fact the resolver reads (B,
`contract-write-tests-derived-9c48`), or a printed step the resolver emits unconditionally (C). C
takes the **narrowest** position: nothing new is observed and nothing new is recorded — the lane
branch stops pretending to be a single step and prints the lane's **ordered pair**, run then record.

## Problem interpretation

Both A and B answer the question "how does the resolver learn that the tests are written?". C denies
that the resolver needs to learn it. For a `test-verification` brief with no patch market there is
exactly one path to final evidence and it has exactly two commands: `/write-tests <brief-id>` then
`/prepare-evidence <brief-id>`. The resolver already knows both ids. Emitting only the first is what
dead-ends the chain; emitting both, in order, closes it with no new fact source, no new status and
no new field.

The structural facts C is built on, verified in `tools/conveyor.ts`:

1. `briefSteps`'s `status === "implemented"` check at `:521` precedes the
   `lane === "test-verification"` check at `:574`. Candidate A needs no code because it produces
   that status. **C needs code** — a change at `:574` in `tools/conveyor.ts`, a
   `capability-spec-tooling-1a2b` surface, with new legs in `tests/conveyor.test.ts`. C's edit is,
   however, the smallest of the three: one additional `pasteStep` push and its comment.
2. The evidence-first check at `:510` means the pair **cannot** outlive its usefulness: as soon as
   the lane carries final evidence the brief routes through its contract's coverage instead, so the
   pair is printed at most for the window in which it is the correct plan.
3. A `test-verification` brief whose patch market is **resolved** already prints `/prepare-evidence`
   at `:533` — an existing precedent for the resolver printing this exact step for a brief that
   never reached `implemented`. C generalises that precedent to the no-market path rather than
   inventing one.

Four constraints this candidate holds:

1. **Lane rule 1 holds** — `/write-tests` and `test-writer` are unchanged; verification is still a
   separate invocation from the code under test.
2. **Rule 6 holds trivially** — C authors no graph write in the lane and no new writer.
3. **`/prepare-evidence` stays idempotent** — it is reached at `draft`, its normal laned entry
   (`prepare-evidence.md:9-13`), and re-running it is already a no-op on an already-written
   evidence.
4. **The lane reaches final evidence by paste alone**, because both commands of the pair are
   printed.

## Scope

1. **`tools/conveyor.ts`** — the `:574` lane branch pushes an **ordered pair**:
   `paste /write-tests <brief-id>` (`why`: the lane field) followed by
   `paste /prepare-evidence <brief-id>` (`why`: the verification lane is run-then-record, and
   `/prepare-evidence` is idempotent on a lane already recorded). A comment states the two
   properties that make the pair safe: `:510` retires it once evidence exists, and the market
   branches above mean it is only ever printed on the no-market path.
2. **`tests/conveyor.test.ts`** —
   1. a `lane: test-verification` brief with no market returns the pair, **in that order**, both
      `kind: paste`, with the brief's own id in each;
   2. once the brief carries final evidence the pair is gone and the contract-coverage route is
      taken — the pair cannot reprint after the lane is recorded;
   3. an open, uncompared market on the same brief still returns the market steps and **neither**
      member of the pair;
   4. at class ≥2 the block is the pair **plus** the 2.5(c) judgement reminder, three lines, pinned
      explicitly so the reminder's position after the pair is not accidental.
3. **`tests/fixtures/conveyor-transcript/transcript.yaml`** — every manifest entry whose block
   contains a `/write-tests brief-laned-tests-0f06` line gains the paired line: the
   `decompose-lanes` entry (`:88`), the `write-tests` entry (`:103`), and both `prepare-evidence`
   entries (`:170`, `:181`) — four blocks, re-recorded by the manifest's own procedure, not
   hand-edited.
4. **`.claude/commands/write-tests.md`** — the `KNOWN GAP` block (`:21-25`) is replaced by the
   pair's semantics: the command is write-free by design, its closing `NEXT` block reproduces the
   pair verbatim, and the operator runs the **second** line after this command returns. The lane
   precondition and `REFUSAL REPORT` (`:4-14`) are unchanged, byte for byte.
5. **`CLAUDE.md`** — the conveyor subsection records the one semantic exception: for this lane the
   `NEXT` block is a two-step plan rather than a single next step, and why (the lane's path is fixed
   and its second command is idempotent).
6. **Graph records** — `drift-finding-write-tests-no-flip-7e52` moves to `resolved`, through
   graph-maintainer.

## Out of scope

1. **No status flip and no new producer of `implemented`.** A7 stays scoped to `/implement-brief`.
2. **No artifact inspection.** No filesystem read, no suite execution, no probe parameter; the
   resolver's PURE/TOTAL properties (`conveyor.ts:19-30`) are untouched and no caller's facts
   change.
3. **No pair for any other lane.** The pair is licensed by this lane having exactly one path with
   exactly two commands; no other branch is generalised.
4. **No schema change, no new field, no new `Stage` value, no validation rule.**
5. **`intent-write-tests-unlaned-brief-b3d8`** and **`intent-implement-brief-graph-lane-b3f5`**.

## Behaviour

1. For a `test-verification` brief with no market and no final evidence, `nextSteps` returns the
   pair in run order, both `paste`. Every id is resolved; nothing is hand-assembled.
2. The pair is **stable while the lane is unfinished** and disappears the moment final evidence
   exists, because `:510` runs first. It therefore reprints identically after `/write-tests` has run
   — the operator's second paste is the forward move, and the first line is a no-op repeat rather
   than a dead end. **This is C's central weakness and it is not concealed:** the loop is not
   closed, it is *accompanied*.
3. **The brief's `status` stays `draft` forever.** `deriveStage` returns `brief-open`, so
   `spec:status`'s stage line, `trails.md` and `status.md` cannot distinguish "tests written" from
   "not started" — the same honest bound B carries.
4. **No divergence between callers.** Unlike B, the views and the subcommand print the same pair,
   because the routing is still a function of graph state alone. C's honest bound is semantic, not
   architectural.
5. **Patch market.** Unchanged and unaffected: `:533`-`:557` precede the lane branch, so an open or
   compared-unselected market prints market steps only, and a resolved market already prints
   `/prepare-evidence` alone.
6. **Class 2 with an optional verification lane.** The pair is class-independent; at class ≥2 the
   2.5(c) reminder still appends, so the block is three lines. Pinned by Scope 2.4.
7. Emitting a step whose precondition the resolver has not verified is a change of intended
   behaviour for the resolver, so the selecting `decision` carries the rule-5 declaration.

## Trade-offs

1. **+ The smallest change that closes the chain.** One branch in `tools/conveyor.ts`, one command
   file, one doc sentence, four re-recorded fixture blocks. No signature change, no new parameter,
   no new fact source, no graph write, no new field.
2. **+ Nothing about the resolver's character changes.** PURE, TOTAL and NEVER-EMPTY hold verbatim;
   routing stays a function of the graph; the views and the subcommand cannot disagree. B trades
   that away and A does not touch it.
3. **+ Reversible in one line.** Deleting the second push restores today's behaviour exactly, and
   there is no graph residue to unwind — no candidate leaves less behind.
4. **− The resolver prints a step whose precondition it has not checked.** It asserts nothing about
   the tests existing, so an operator pasting blindly can run `/prepare-evidence` on a lane never
   written. A and B both gate the forward step on *something*; C gates it on the operator reading
   the order. This is the strongest case for losing C.
5. **− One lane becomes a semantic exception.** "The next step" becomes "the next two steps" for
   `test-verification` only, and a class-2 block is three lines whose first is often stale. Every
   later reader of `nextSteps`, and every future consumer of the `NEXT` block, must learn the
   exception.
6. **− The status stays `draft` forever** (Behaviour 3), so no consumer reading brief status learns
   that the lane is done — and unlike B there is not even a working-tree fact that does.

## Acceptance

1. **Paste-only, live.** On the next `test-verification` lane, `pnpm spec:status <brief-id>` prints
   `paste /write-tests <brief-id>` and `paste /prepare-evidence <brief-id>` in that order; running
   them in order reaches final evidence with no hand-assembled id and no command the resolver did
   not print. That run is the discharging acceptance run; remediation on failure is a
   `drift-finding` plus a rule 5 route.
2. **The pair retires.** After that lane's final evidence, `pnpm spec:status <brief-id>` prints
   neither member of the pair — the contract-coverage route instead. Pinned as a unit leg and
   observed in the live run.
3. **Order is pinned, not incidental.** `tests/conveyor.test.ts` asserts index 0 is `write-tests`
   and index 1 is `prepare-evidence`; swapping them reds `pnpm test`.
4. **Market precedence intact.** With `patch_market: true` on the same brief, `nextSteps` returns
   the market steps and neither member of the pair.
5. **Purity intact.** `pnpm spec:index` run twice is byte-identical, `pnpm spec:validate` is green,
   and `tools/conveyor.ts` imports nothing new — falsifiable by inspection of the import list.
6. **Transcript re-recorded.** All four blocks that name `brief-laned-tests-0f06` carry the paired
   line, produced by the manifest's procedure.
7. **Finding closed.** `drift-finding-write-tests-no-flip-7e52` is `resolved`.
8. **Review-only, admitted.** Whether an unverified forward step is acceptable, and whether the
   two-step exception is worth its narrowness, stays reviewer judgement.

## Risks

1. **A blind paste records evidence for a lane with no tests.** *Mitigation:* the second step's
   `why` states the order explicitly; `/prepare-evidence` must gather concrete test output, so an
   evidence with no run is a rule-5 event; `/integrate` keeps the integration at `draft` until the
   lane's combined run is recorded. The mitigation is procedural, and that is the honest limit.
2. **The stale first line trains operators to ignore printed steps.** *Mitigation:* Behaviour 2
   names it, the command file states that its own closing block reprints the pair, and the pair
   retires at final evidence so the window is one command long.
3. **The exception spreads.** A later lane gets a pair "by analogy" where the path is not fixed.
   *Mitigation:* Out of scope 3 licenses the pair only where the lane has one path of two commands;
   another lane needs its own decision.
4. **The permanently `draft` status misleads a future consumer.** *Mitigation:* declared in
   Behaviour 3 and Trade-off 6; a consumer that needs the distinction routes to a follow-up intent.
5. **Fixture churn hides a real routing change.** Four blocks move at once. *Mitigation:* each is
   re-recorded by the manifest's procedure and the diff is read as a finding to explain, per the
   fixture's own instruction, never overwritten blindly.

## Critique (spec)

Concern. Acceptance 1 ("running them in order") and Scope 4 ("the operator runs the second line")
give the same two-line block two incompatible readings the block cannot distinguish, so by C's own
Behaviour 2 the loop is accompanied rather than closed. Full finding in
`comparison-write-tests-market-6e83`.

## Critique (product)

Concern. C relocates the operator's out-of-print knowledge from "which verb to invent" to "which
printed line is stale", and books the drift finding's `resolved` exit while delivering its
`accepted` branch without superseding Acceptance 1. Full finding in
`comparison-write-tests-market-6e83`.

## Critique (ux)

Concern. `status.md`'s brief table renders `nextSteps(...)[0]` only, so the operator's dashboard row
shows the stale `/write-tests` line and never the forward one — C reintroduces by truncation the
exact cross-surface disagreement it charges against B. Full finding in
`comparison-write-tests-market-6e83`.

## Critique (architecture)

Concern. C's headline claim that callers cannot disagree is refuted by `indexer.ts:257`, and C
overloads `Step[]` position with two incompatible meanings — a sequential plan at brief level, an
unordered enumeration inside the coverage flatMap. Full finding in
`comparison-write-tests-market-6e83`.

## Critique (security-privacy)

Concern. The resolver prints `/prepare-evidence` for a lane it has checked nothing about, so a blind
paste records evidence for tests never written and only a human at integration would notice — though
C adds no new input and no new writer. Full finding in `comparison-write-tests-market-6e83`.

## Critique (compliance-risk)

Concern. Nothing is recorded and nothing is observed, so a fabricated verification lane is
graph-indistinguishable from a real one while the provenance chain stays formally complete. Full
finding in `comparison-write-tests-market-6e83`.

## Critique (qa-test)

Concern. No artifact differs between "tests written" and "not started", so C's headline acceptance
has no oracle — every leg is equally green whether the operator pastes line 2 or re-pastes line 1
forever — and it reds `conveyor.test.ts:464`'s `only()` unscoped. Full finding in
`comparison-write-tests-market-6e83`.

## Critique (reliability-ops)

Concern. The stale first line is not the "no-op repeat" Behaviour 2 calls it — re-pasting
`/write-tests` re-invokes a file-writing agent that has no idempotency clause anywhere in its
command file. Full finding in `comparison-write-tests-market-6e83`.

## Critique (cost-maintainability)

Concern. The fixture stops being able to distinguish a recorded defect from a recorded design, since
under C the block whose first line reprints the command just run becomes the intended output rather
than the bug. Full finding in `comparison-write-tests-market-6e83`.

## Critique (release)

Concern. C alone counts all four affected transcript blocks correctly, but never states that
`tools/conveyor.ts` and the four re-recorded blocks must land in one commit in that order, so a
laned split reproduces the recorded red-suite window. Full finding in
`comparison-write-tests-market-6e83`.
