---
id: intent-write-tests-status-flip-2b64
type: intent
title: Close the paste-only chain for a test-verification lane without weakening separation of duties
status: open
created: 2026-07-30
class: 2
produced_by: "/integrate"
---

## Problem

A `test-verification` lane brief never reaches `implemented`, so the conveyor reprints
`/write-tests <brief-id>` forever and the paste-only chain dead-ends on that lane.

A7 (`decision-conveyor-derived-5a91`) gave `/implement-brief` exactly one graph write — its brief
moves to `implemented` — and that flip is the whole mechanism by which the implementation-to-evidence
hop became derivable rather than recalled: the resolver keys on the resulting status to emit
`/prepare-evidence`. A7 names only `/implement-brief`.

`/write-tests` performs no graph write at all. CLAUDE.md's lane rule 1 requires that verification
never be written by the invocation that wrote the code under test, and
`.claude/lanes/test-verification.md` pins `eligible_agents: [test-writer]` exactly — so the one lane
that may **not** be run through `/implement-brief` is also the one lane that never receives A7's
flip. Its brief stays at its pre-implementation status, Behaviour 2.5(b) keeps matching, and
`nextSteps` keeps emitting `/write-tests <brief-id>`: the exact loop A7 closes everywhere else.

Observed during this change's own delivery, not theorised. `/write-tests brief-conveyor-tests-4c86`
ran and produced 289 passing tests; `pnpm spec:status brief-conveyor-tests-4c86` then printed
`/write-tests brief-conveyor-tests-4c86` again. The chain continued only because the operator knew to
run `/prepare-evidence` — a command the resolver had not printed. This is the failure of
`contract-conveyor-derived-4c8c` Acceptance 1's paste-only clause recorded in
`drift-finding-write-tests-no-flip-7e52` and in `integration-conveyor-derived-4d19`'s
`combined-test-run`, and it is why that integration is `draft` and
`intent-self-guiding-delivery-loop-6d79` remains `open`.

**This is NOT `intent-write-tests-unlaned-brief-b3d8`.** That intent asks how `/write-tests` should
behave when handed an **unlaned** brief — the lane *precondition* at
`.claude/commands/write-tests.md:4-6`, which refuses any brief whose `lane` is not
`test-verification`. This intent is about the missing **status flip** on a brief the command already
accepts. The two are independent: closing either leaves the other open. They are recorded as separate
intents deliberately so a later reader does not collapse them.

## Goal

Decide how a `test-verification` lane reaches `implemented` such that the resolver prints
`/prepare-evidence` unaided, and record that decision. Any candidate must hold three things
simultaneously:

1. **Separation of duties is not weakened.** The invocation that writes the tests must remain
   distinct from the one that wrote the code under test. A solution that closes the chain by letting
   `/implement-brief` handle `test-verification` briefs fails here.
2. **`graph-maintainer` stays the sole writer** of `specs/nodes/` and `specs/graph/edges.yaml`
   (CLAUDE.md rule 6). `test-writer` performs no graph writes; whatever flips the status does so
   through `graph-maintainer`.
3. **Intended behaviour changes are approved, not absorbed.** Extending A7's single-write pattern to
   a second command is a change of intended behaviour, so it needs a `decision` node before it is
   implemented — which is precisely why `brief-conveyor-commands-c14d` declined to take it and
   `evidence-conveyor-commands-8a52` routed it here instead of closing it quietly.

Candidate directions worth comparing rather than assuming: give `/write-tests` the same single graph
write A7 gave `/implement-brief`; keep `/write-tests` write-free and have the resolver derive the
`test-verification` hop from the presence of the lane's tests rather than from a status; or make
`/prepare-evidence` the printed next step for a `test-verification` brief whose market is closed,
without any status flip. The trade-offs differ in how much they widen A7's precedent and in whether
the resolver keeps deriving from graph state alone.

Success is that a `test-verification` lane completes by paste alone, and that a regression test pins
it so the loop cannot silently return.

## Source

Raised by the `api-integration` lane of `contract-conveyor-derived-4c8c` and deliberately left
unresolved there: `evidence-conveyor-commands-8a52` records it as a rule-5 event, and
`.claude/commands/write-tests.md` carries it as a stated KNOWN GAP directing a hand-run
`/prepare-evidence`. Captured at integration under CLAUDE.md's rule that a failed paste-only
acceptance run is remediated by a `drift-finding` plus a rule 5 route — the branch taken being
*contract incomplete, intended behaviour unchanged*, so the approved contract is not widened and A7 is
not reinterpreted to cover a command it does not name.

Related: `drift-finding-write-tests-no-flip-7e52` (the finding this intent routes),
`intent-write-tests-unlaned-brief-b3d8` (the other, distinct `/write-tests` question),
`intent-implement-brief-graph-lane-b3f5` (the sibling case where a lane's deliverable is graph data
and `/implement-brief`'s no-graph-writes clause contradicts it).
