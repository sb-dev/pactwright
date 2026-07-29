---
id: intent-write-tests-unlaned-brief-b3d8
type: intent
title: Define `/write-tests` for an unlaned single brief without weakening separation of duties
status: open
created: 2026-07-29
class: 2
produced_by: "/capture-intent"
---

## Problem

`.claude/commands/write-tests.md:4-6` refuses any brief whose `lane` is not `test-verification`,
verbatim:

> Input: test-verification brief node ID ($ARGUMENTS). Locate the brief via
> specs/indexes/ and confirm its `lane` is `test-verification`; stop and report
> otherwise.

(The refusing clause on its own — "confirm its `lane` is `test-verification`; stop and report
otherwise" — is `:5-6`, the anchor `contract-conveyor-derived-4c8c` Out of scope 6 and
`brief-conveyor-commands-c14d:170` both cite. `:4-6` is the full precondition sentence. Both are
true; they differ only in granularity.)

A brief with no `lane` therefore fails the check and the command stops. That is not an edge case.
CLAUDE.md's work-class routing table gives the Lanes column `none` for class 0 and class 1
(`CLAUDE.md:91-92`) and `optional` for class 2 (`:93`), and `CLAUDE.md:161` states that a `brief`
with no `lane` is "an unlaned single brief (the default)". So the default brief shape for a class-1
change — and a permitted brief shape for a class-2 change — has **no in-command route to independent
verification**: `/write-tests` is the only command that invokes `test-writer`, and it will not
accept the brief.

The conveyor inherits the hole rather than closing it. The derived resolver offers `/write-tests
<brief-id>` only "at lane `test-verification`" (`contract-conveyor-derived-4c8c:148-149`), so a
class-≥1 unlaned brief is never routed to it in the first place.

## Goal

Define what `/write-tests` does for an unlaned brief — accept it, or refuse it toward a route that
actually exists — **without weakening the separation-of-duties rule**. CLAUDE.md's lane-model rule 1
(`:180-182`) is the invariant that must survive intact:

> 1. **Verification is always its own lane.** Any multi-lane change includes a
>    `test-verification` lane, owned by the `test-writer` agent (via `/write-tests`) —
>    never the same invocation that implemented the code under test.

The rule's scope is "any multi-lane change"; it is silent on the single unlaned brief, which is
precisely the gap. Whatever the resolution, the "never the same invocation that implemented the code
under test" clause is not negotiable — an unlaned brief must not become a licence for
`/implement-brief` to write its own verification. Widening the precondition so `/write-tests`
accepts an unlaned brief and still dispatches a *separate* `test-writer` invocation is one candidate
direction; requiring lanes at class ≥1 is another; keeping the refusal but making it terminal with a
named, reachable route is a third. Choosing among them is a contract's job, not this intent's.

## Source

Contract `contract-conveyor-derived-4c8c` (approved, class 3), `## Out of scope` item 6
(`:126-130`), verbatim:

> 6. **`/write-tests` on an unlaned brief.** `write-tests.md:5-6` refuses any brief whose `lane` is
>    not `test-verification`, so widening that precondition changes intended behaviour and rule 5
>    routes it to Scope 14.4. Interim, `/write-brief`'s block carries a `kind: action` line —
>    independent verification is still required, by re-decomposing with a `test-verification` lane
>    or writing tests outside the command — so the conveyor never walks a class-≥1 operator past it.

The routing is CLAUDE.md scope-integrity rule 5's third branch (`:61-62`): "*Selected work changes
the intended behaviour* — stop and return to human approval. A new `decision` node is required
before proceeding." This intent is therefore *captured* here and implemented nowhere in that
change: it needs its own contract and its own decision, and is not a patch to the approved conveyor
work.

**Interim mitigation, already scoped elsewhere — a mitigation, not a fix.**
`decision-conveyor-derived-5a91`'s A4 (`:80-82`): "**A4. The BLOCKED `/write-tests` interim clause**
for class-≥1 unlaned briefs, so the chain never silently routes an operator past independent
verification — amended per the UX finding to name a **recoverable action**, not just a block." It is
built in the `api-integration` lane by `brief-conveyor-commands-c14d` (bullet at `:170`,
implementation step 6.2 at `:408-411`): a `kind: action` line in `/write-brief`'s closing block
for a class-≥1 unlaned brief, naming two recoverable actions — re-decompose the contract with a
`test-verification` lane via `/decompose-lanes`, or write the tests outside the command.
`write-tests.md` itself keeps its precondition **unchanged** and gains only A4's recoverable-action
refusal message (`c14d:317`). A4 stops the operator from silently walking past verification; it does
not give an unlaned brief a route *through* the command, which is what this intent exists to settle.

Class 2 per `brief-conveyor-schema-graph-8b2e`'s pinned decision that both Scope-14.4 follow-up
intents are class 2 — matching the two live open non-conveyor intents (`intent-docs-arrow-lint-e7b3`
and `intent-unbacked-addressed-guard-8c4e`, both `open`, class 2). It is a meaningful change to a
governing lifecycle command's relationship with the separation-of-duties rule, on a single surface:
not trivial, and not the multi-surface or sensitive-path work that would make it class 3.
