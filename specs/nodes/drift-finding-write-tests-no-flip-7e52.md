---
id: drift-finding-write-tests-no-flip-7e52
type: drift-finding
title: /write-tests performs no graph write, so the conveyor reprints it forever and the paste-only chain breaks on the test-verification lane
status: open
created: 2026-07-30
produced_by: "/integrate"
---
The divergence recorded here is between `contract-conveyor-derived-4c8c`'s headline Acceptance 1 — "a
real change runs end to end by pasting only printed commands" — and what the merged change actually
does on one of its seven lanes.

## What diverged

`.claude/commands/write-tests.md` performs **no graph write**. A7 gave `/implement-brief` exactly one
graph write — the brief moves to `implemented` — and that flip is what makes the
implementation-to-evidence hop derivable: the resolver keys on the resulting `implemented` status to
emit `/prepare-evidence`. A7 names only `/implement-brief`.

`/write-tests` is the one command a `test-verification` brief must go through, because CLAUDE.md's
lane rule 1 forbids the invocation that wrote the code under test from writing its verification. So
the single lane that may not be run through `/implement-brief` is also the single lane that never
receives A7's flip. Its brief stays at its pre-implementation status, `deriveStage` keeps returning
the pre-implementation stage, Behaviour 2.5(b) keeps matching, and `nextSteps` keeps emitting
`/write-tests <brief-id>` — the exact loop A7 closes everywhere else.

## Observed, not theorised

During this change's own delivery: `/write-tests brief-conveyor-tests-4c86` ran and wrote 289 passing
tests. `pnpm spec:status brief-conveyor-tests-4c86` then printed `/write-tests
brief-conveyor-tests-4c86` again. An operator pasting only printed commands would loop there
indefinitely. The chain was continued only because the operator knew to run `/prepare-evidence
brief-conveyor-tests-4c86` instead — a command the resolver had not printed.

**Precise scope of the failure.** Acceptance 1 has two clauses and only one failed:

1. "any hand-assembled ID is a defect" — **PASSED.** No id was hand-assembled at any point in the
   change. `brief-conveyor-tests-4c86` came out of the resolver's own printed line; only the command
   verb was chosen by the operator.
2. "runs end to end by pasting only printed commands" — **FAILED**, on 1 of 7 lanes.

A second, lesser break is recorded for completeness: `/update-spec-graph` was hand-invoked for the
deferred Scope 14 graph data. That one was a deliberate human choice made when `/implement-brief`'s
own wording ("performs no graph writes") contradicted a lane whose entire deliverable was graph data
— itself now captured as `intent-implement-brief-graph-lane-b3f5`.

## Why this is a finding rather than an absorbed defect

`.claude/commands/write-tests.md` states the gap in its own text as a KNOWN GAP and directs the
operator to run `/prepare-evidence` by hand. `evidence-conveyor-commands-8a52` records it at length
as a rule-5 event the `api-integration` lane surfaced and deliberately did **not** resolve, on the
ground that extending A7's flip to a second command changes intended behaviour beyond A7's letter.
That routing was correct. What was still owed was the record at integration, which is this node.

CLAUDE.md's standing rule on paste-only acceptance claims is explicit that a failed run is recorded,
not waived: the run's verdict belongs in the final integration node's `combined-test-run` section,
the remediation on failure is a `drift-finding` plus a rule 5 route, and **a change does not reach a
final integration on a failed run**. `integration-conveyor-derived-4d19` is therefore `draft`, and
`intent-self-guiding-delivery-loop-6d79` stays `open`.

## Rule 5 route

Branch taken: *contract incomplete, intended behaviour unchanged* — a follow-up intent for the
missing scope, captured as `intent-write-tests-status-flip-2b64`. The approved contract is **not**
widened, and A7 is **not** reinterpreted to cover a command it does not name.

Not taken, and why: the brief boundary was not wrong (no `supersedes` — `brief-conveyor-commands-c14d`
correctly identified the gap and correctly declined to close it), and this is not a return to human
approval in itself (the behaviour change that closes it is, and that is what the follow-up intent
exists to route).

## Resolution condition

This finding moves to `resolved` when the paste-only chain closes for a `test-verification` lane
without weakening separation of duties — that is, when `/write-tests` (or whatever supersedes it)
leaves its brief in a state from which the resolver prints `/prepare-evidence` unaided, under a
recorded decision. It moves to `accepted` only if a human decides the manual hop is the intended
behaviour, in which case Acceptance 1's wording is what needs superseding.

## Flagged artifact

`flags → evidence-conveyor-commands-8a52`. The defect lives in `.claude/commands/write-tests.md`,
which is the `api-integration` lane's file, and that lane's evidence already documents the gap. The
`test-verification` lane is where it manifested, but flagging the artifact that holds it is what a
later reader needs.
