---
id: contract-write-tests-flip-3a71
type: contract
title: Extend A7's single graph write to /write-tests (command-file change, no resolver change)
status: candidate
created: 2026-07-30
class: 2
produced_by: "/propose-contracts"
---

This contract proposes `intent-write-tests-status-flip-2b64` (class 2) and is candidate **A** of
three. The market's single axis is **what makes the `test-verification` hop derivable**: a status an
agent writes (A), a working-tree fact the resolver reads (B, `contract-write-tests-derived-9c48`),
or a printed step the resolver emits unconditionally (C, `contract-write-tests-market-5e26`). A
takes the **status** position: `/write-tests` gains exactly the graph write A7 gave
`/implement-brief`, and `tools/conveyor.ts` is not touched at all.

## Problem interpretation

The loop recorded in `drift-finding-write-tests-no-flip-7e52` is **not** a resolver defect. In
`tools/conveyor.ts`'s `briefSteps` the `status === "implemented"` check at `:521` runs **before**
the `lane === "test-verification"` check at `:574`, so a `test-verification` brief that reaches
`implemented` **already** routes to `/prepare-evidence <brief-id>` with zero code change. The
missing piece is a **producer** of that status for the one lane that may not go through
`/implement-brief`: `/write-tests` performs no graph write, so the brief stays at its
pre-implementation status and `:574` keeps matching forever.

Two facts narrow the gap further and both are load-bearing here:

1. A `test-verification` brief whose **patch market is resolved** already closes today — the `:533`
   branch (`marketOpen && patchMarketResolved`) returns `/prepare-evidence` before the lane branch
   is reached. The break is therefore exactly the **no-market** path, which is the path every
   `test-verification` lane written so far has taken.
2. `/prepare-evidence` is already written for an upstream flip: `prepare-evidence.md:24-28` states
   that "a brief already at `implemented` is a NO-OP, not a conflict … whether it reached that
   status here or upstream in `/implement-brief`". A second upstream producer needs no change there.

Four constraints this candidate must hold, and does:

1. **Lane rule 1 holds.** The tests are still written by `test-writer` through `/write-tests`, a
   separate invocation from the `/implement-brief` that wrote the code under test.
   `.claude/lanes/test-verification.md`'s `eligible_agents: [test-writer]` is untouched, and
   `/implement-brief` never handles a `test-verification` brief.
2. **Rule 6 holds.** `test-writer` writes nothing under `specs/`. The command — not the agent —
   invokes `graph-maintainer` for the flip, exactly as `/implement-brief` does.
3. **`/prepare-evidence` stays idempotent**, by its own existing clause above.
4. **The lane reaches final evidence by paste alone**, because `:521` then prints
   `/prepare-evidence <brief-id>` unaided.

## Scope

1. **`.claude/commands/write-tests.md`** — the whole of the code change.
   1. Delete the `KNOWN GAP` block (`:21-25`) that directs a hand-run `/prepare-evidence`.
   2. Add an `EXACTLY ONE GRAPH WRITE` clause modelled on `implement-brief.md:18-31`: on completion
      `graph-maintainer` flips this brief from its pre-implementation status (`draft` or `approved`)
      to `implemented`; no edges, no other node, no other status; the flip goes through
      graph-maintainer, never inline.
   3. Add the three clauses that clause implies: `ECHO BEFORE MUTATING` (brief id and current
      status), `The mutating step ends with pnpm spec:index && pnpm spec:validate`, and `ON RED`
      (findings, remediation, explicitly **no** next step).
   4. The lane precondition and `REFUSAL REPORT` (`:4-14`) are **unchanged, byte for byte** — that
      is `intent-write-tests-unlaned-brief-b3d8`, not this change. The `FALLBACK` region is
      unchanged and becomes consistent rather than compensatory.
2. **`CLAUDE.md`** — the lifecycle Implementation step and the conveyor subsection name **both**
   commands that carry the single write, citing this contract's selecting decision. Command and
   governing document agree in the same diff; the one-intra-PR-window disagreement recorded at
   `implement-brief.md:29-30` is not repeated.
3. **`tests/conveyor.test.ts`** — the regression pin the intent requires:
   1. an `implemented` `lane: test-verification` brief routes to `/prepare-evidence`, never
      `/write-tests` — the `:521`-before-`:574` ordering, pinned rather than incidental;
   2. `deriveStage` on that brief is `brief-implemented`;
   3. a command-file leg: `write-tests.md` contains the single-write clause and contains **no** text
      directing a hand-run `/prepare-evidence`, so deleting the clause reds CI.
4. **`tests/fixtures/conveyor-transcript/`** — the manifest's `write-tests` entry
   (`transcript.yaml:99-105`) currently records the bug. `brief-laned-tests-0f06` must stay `draft`
   for the three other entries that print its step (`:88`, `:170`, `:181`), so add a **new**
   `implemented` `test-verification` brief node plus its `decomposes` edge and re-record the
   `write-tests` entry by the manifest's own procedure (`tsx tools/spec.ts status <node-id>` in a
   fixture copy, pasted verbatim).
5. **Graph records** — `drift-finding-write-tests-no-flip-7e52` moves to `resolved` (its resolution
   condition is met), through graph-maintainer.
6. **`tools/**` is not touched.** Declared, not incidental: no resolver, subcommand, indexer or
   schema change is required by this candidate.

## Out of scope

1. **`/write-tests` on an unlaned brief** — `intent-write-tests-unlaned-brief-b3d8`. The
   precondition is not widened.
2. **`/implement-brief` on a graph-data lane** — `intent-implement-brief-graph-lane-b3f5`.
3. **Any further extension of the single-write pattern.** After this change the closed set is
   `/implement-brief` and `/write-tests`; a third command needs its own decision.
4. **No schema change.** `brief.status_values` already carries `implemented`; no new field, no
   validation rule, no CI gate.
5. **No re-run of `integration-conveyor-derived-4d19`'s combined test suite as part of this
   contract** — that integration's return to `final` is its own step under rule 5.

## Behaviour

1. `/write-tests <brief-id>` invokes `test-writer` (tests under `tests/` only, no graph writes), and
   **only after** the agent reports the suite green does the command invoke `graph-maintainer` for
   one status flip. On a red suite there is no flip and no next step.
2. The flip is `draft`|`approved` → `implemented` on that brief and nothing else. It is idempotent:
   a brief already `implemented` is a no-op.
3. The resolver is unchanged. `:521` matches, `nextSteps` returns
   `paste /prepare-evidence <brief-id>`, and `deriveStage` returns `brief-implemented`, so
   `spec:status`, `trails.md` and `status.md` all report the lane truthfully from graph state alone.
4. Because `:521` returns early, the 2.5(c) class-≥2 judgement reminder no longer appends for this
   brief once it is `implemented` — the lane branch is never reached.
5. **Patch market.** The `:533`-`:557` branches run before the lane branch, so an open market
   (uncompared, or compared and unselected) still routes to `/compare-patches`,
   `/synthesize-patches` or `/select-patch` and `/write-tests` is not printed — no flip can occur
   mid-market. A **resolved** market already prints `/prepare-evidence` at `:533`; the flip does not
   disturb it, and if `/write-tests` did run, `/prepare-evidence` is a no-op on the status.
6. **Class 2 with an optional verification lane.** Identical behaviour: the flip is
   class-independent and needs no lane-count or class condition.
7. Extending A7 to a second command changes intended behaviour, so the selecting `decision` carries
   the rule-5 declaration; nothing is implemented before it exists.

## Trade-offs

1. **+ No TypeScript at all.** The routing already works; this candidate supplies the state it keys
   on. `tools/**` (`capability-spec-tooling-1a2b`, a Phase-9-gated sensitive surface) is untouched,
   and no signature, subcommand, view or fixture-determinism property is disturbed.
2. **+ The brief's `status` becomes true.** `brief-implemented` means "the lane's work is done" for
   every lane, so `spec:status`, `trails.md`, `status.md`, issue sync and any future consumer can
   distinguish "tests written" from "not started". B and C cannot — this is A's decisive advantage.
3. **+ One mental model, and reversible.** Every implementing command ends in one flip; the revert
   is deleting a clause from one markdown file, and already-flipped briefs keep a status that stayed
   true.
4. **− It spends a second rule-5 behaviour change and widens A7's precedent** to a command whose
   *agent* holds no graph-write authority. The resolution is real but subtle: the command
   orchestrates the write, `test-writer` never does. A reader who conflates the two will read this
   as a weakening of rule 6, and that misreading is a cost.
5. **− The status is a claim, not an observation.** Nothing in CI proves the flip happened or that
   the suite was green when it did; an agent that skips the clause silently restores the loop, and
   an agent that flips on a red suite records a false `implemented`. The command-file pin (Scope
   3.3) catches the deleted clause, not the skipped run — the same honest bound A7 already carries.

## Acceptance

1. **Paste-only, live.** On the next `test-verification` lane — this change's own verification lane
   included — `/write-tests <brief-id>` is run, then `pnpm spec:status <brief-id>` prints a block
   whose only paste line is `paste /prepare-evidence <brief-id>`. Pasting that line reaches final
   evidence. **The discharging run** is the acceptance run recorded in the delivering evidence, and
   its remediation on failure is a `drift-finding` plus a rule 5 route.
2. **Unit-pinned ordering.** In `tests/conveyor.test.ts`, `nextSteps` on an `implemented`
   `lane: test-verification` brief returns exactly one step, `/prepare-evidence <brief-id>`; moving
   the `:574` lane branch above `:521` fails that test.
3. **Command-file pin.** `write-tests.md` contains the single-write clause and no hand-run
   direction; deleting the clause reds `pnpm test`.
4. **Transcript re-recorded.** No manifest entry records a `/write-tests` block that reprints
   `/write-tests` for the node just written; the new entry was produced by the manifest's procedure,
   not hand-written.
5. **No tooling diff.** `git diff --stat` for this change names no file under `tools/` and no file
   under `specs/schema/` — falsifiable in one command.
6. **Finding closed.** `drift-finding-write-tests-no-flip-7e52` is `resolved` with the closing
   condition quoted.
7. **Review-only, admitted.** Whether an agent will reliably run the flip, and whether it judged the
   suite green honestly, stays reviewer judgement.

## Risks

1. **The agent skips the flip and the loop returns silently.** *Mitigation:* the command-file pin
   (Scope 3.3) reds a deleted clause; the `ECHO BEFORE MUTATING` line makes a skipped write visible
   in the transcript; the resolver reprinting `/write-tests` is itself the symptom an operator now
   recognises.
2. **A flip on a red suite records a false `implemented`.** *Mitigation:* Behaviour 1 orders the
   flip strictly after a green report and forbids it otherwise; `/prepare-evidence` must still
   gather concrete test output, so a false flip surfaces at the evidence step, and a false evidence
   is a rule-5 event.
3. **Precedent creep** — the next write-free command gets a flip "by analogy". *Mitigation:* Out of
   scope 3 names the closed two-command set; a third requires its own decision.
4. **Double write against `/prepare-evidence`.** *Mitigation:* none needed —
   `prepare-evidence.md:24-28` already declares the no-op; the pin in Scope 3.1 keeps the routing
   that reaches it.
5. **Fixture conflict.** The new `implemented` fixture brief must not perturb the four existing
   blocks that print `brief-laned-tests-0f06`. *Mitigation:* a new node in its own trail, and the
   whole manifest re-verified by re-running the recorded procedure.

## Critique (spec)

Concern. The decisive advantage claimed in Trade-off 2 is refuted by `prepare-evidence.md:9-13`,
which already flips a laned brief to `implemented`, and Scope 4's fixture plan adds a line to the
three transcript blocks it promises to leave untouched. Full finding in
`comparison-write-tests-market-6e83`.

## Critique (product)

Concern. Solves the stated problem rather than a proxy, but the machine-checked leg pins the half
that is not broken, and a false `implemented` lands on the one lane that exists to be the check.
Full finding in `comparison-write-tests-market-6e83`.

## Critique (ux)

No concern on this axis. One node, one step, stage and step agree on all three surfaces, and it is
the only candidate leaving the resolver-unavailable FALLBACK print consistent with the resolved
print. Full finding in `comparison-write-tests-market-6e83`.

## Critique (architecture)

Concern. The command-orchestrates/agent-does-not-write boundary is real and already shipped by A7,
but `/write-tests` always delegates where `/implement-brief` may run inline, so this mutation is
always gated on a fact only a subagent holds. Full finding in `comparison-write-tests-market-6e83`.

## Critique (security-privacy)

Concern. The authorisation delta is zero, but the flip is gated on a narrated green report from an
agent that reads the files under test, so a "report green" injection becomes a recorded
`implemented` rather than merely a wrong console line. Full finding in
`comparison-write-tests-market-6e83`.

## Critique (compliance-risk)

Concern. The only candidate answering "was this lane verified?" from the graph alone, but the flip
is undated and unattributed — `brief` carries no `implemented_at` and no actor field, so a
green-suite flip and a red-suite flip produce byte-identical graphs. Full finding in
`comparison-write-tests-market-6e83`.

## Critique (qa-test)

Concern. Four of six machine-checkable acceptance items pin code A declares untouched, so the suite
stays green with the entire diff reverted, leaving one phrase-coupled markdown grep as the only leg
with power over the change. Full finding in `comparison-write-tests-market-6e83`.

## Critique (reliability-ops)

Concern. The flip is instructed but never observed, and `prepare-evidence.md:9-13` silently repairs
a skipped one — so the omission leaves a graph byte-identical to a correct run and destroys its own
diagnostic. Full finding in `comparison-write-tests-market-6e83`.

## Critique (cost-maintainability)

Concern. Scope 4's fixture plan is unbuildable as written and silently owes a ninth fixture trail,
and nothing asserts the `EXACTLY ONE GRAPH WRITE` set has size two, so a third command acquiring the
clause reds nothing. Full finding in `comparison-write-tests-market-6e83`.

## Critique (release)

Concern. The new `implemented` fixture brief cannot attach to any recorded contract without
reddening blocks Scope 4 claims stay byte-identical, and the revert leaves
`drift-finding-write-tests-no-flip-7e52` falsely `resolved`. Full finding in
`comparison-write-tests-market-6e83`.
