---
id: evidence-write-tests-flip-6a24
type: evidence
title: Write-tests status flip implemented — the clause block placed before the print, the CLAUDE.md record, six pins with a negative leg proved to bite, and transcript trail I
status: final
created: 2026-07-30
produced_by: "/prepare-evidence"
---
Evidence that `brief-write-tests-flip-4e19` satisfies `contract-write-tests-flip-3a71` plus the
twenty-one amendments and thirteen common-core findings of `decision-write-tests-flip-7f14`. Landed
in `fe46f47`: thirteen files, +536/−17. No file under `tools/` and none under `specs/schema/`.

This was an **unlaned single brief** — the class-2 routing choice recorded in the brief. It carried
no `owner`, so implementation was inline, with one deliberate exception: the six test legs were
written by `test-writer` in a separate invocation from the one that edited
`.claude/commands/write-tests.md`. That is the brief's recoverable-action-(b) verification path, and
it is an ordered step rather than an intention, because `/write-tests` refuses a brief with no
`test-verification` lane and this brief has none by design.

## What landed

**`.claude/commands/write-tests.md`** — the `KNOWN GAP` block deleted and six clauses inserted, in
`implement-brief.md`'s order: `EXACTLY ONE GRAPH WRITE:` (the flip, through graph-maintainer, never
inline, only on a green suite), the declared failure direction, the two documented consequences of
the resulting status, `ON RED SUITE:`, `IDEMPOTENT / RE-ENTRANT:`, `ECHO BEFORE MUTATING:`, the
mutating-step line, and `ON RED:`. `EXACTLY ONE GRAPH WRITE:` is now at `:19` and `NEXT BLOCK:` at
`:54`.

**`CLAUDE.md`** — lane rule 1 records that `/write-tests` carries the same single graph write,
citing `decision-write-tests-flip-7f14`, and states that the agent still writes nothing under
`specs/`. The conveyor section records that two commands carry the write, with common-core finding
1's bound. **Lifecycle step 6 was not touched**, per amendment 10: it is `/implement-brief`'s and
carries A7's rule-5 approval, and putting `/write-tests` there would make the document assert it
*is* the Implementation step, which lane rule 1 forbids.

**`tests/conveyor.test.ts`** — +387 lines, purely additive; the pre-existing 66 legs are
byte-unchanged. Six new legs, three synthetic graphs all appended to `CORPUS`, and a header comment
carrying the closed clause set, the chosen failure direction and finding 1's bound.

**`tests/fixtures/conveyor-transcript/`** — trail I: five nodes (`intent-tested-1d01`,
`contract-tested-1d02`, `contract-tested-alt-1d03`, `decision-tested-1d04`, `brief-tested-1d05`) and
four edges, all `created: 2026-06-11` so both dated cutoffs grandfather them. The `write-tests`
manifest entry was repointed to `brief-tested-1d05` and re-recorded by the manifest's own procedure
— run in a fixture copy, pasted verbatim, never hand-written.

## The pins were proved to bite, not assumed

Amendment 1 makes the command-file pins the only legs with power over this diff, so their power was
measured rather than asserted. Mutating `.claude/commands/write-tests.md` and re-running the suite:

- **Clause block deleted** → **3 legs red** (the literal-presence leg, the clause-set equality leg,
  and the negative leg's own precondition).
- **Clause block moved below `NEXT BLOCK:`** → **1 leg red**, precisely the relative-order leg.
- **Restored** → 72/72 green again.

The second result is the one that matters. Amendment 17 records a defect **all ten routed
perspectives missed**: placing the clauses where the `KNOWN GAP` was would have left them *below*
the `NEXT BLOCK:` clause at `:19`, instructing the command to print before it flips — and the
pre-flip block is `paste /write-tests <brief-id>`, reproducing the exact bug with the clause present
and a presence-only test green. That failure mode is now machine-caught by one named leg.

`test-writer` independently hardened it further: pre-change `firstLineIndex` of the clause is `-1`,
and `-1 < 19` would have made the order comparison pass **vacuously**, so the leg asserts both
tokens are present before comparing.

## Test output and validation runs

- `node --test --import tsx tests/*.test.ts` → **295 tests, 295 pass, 0 fail**, 0 skipped (was 289;
  +6). `tests/conveyor.test.ts` alone: 72/72, up from 66.
- `node_modules/.bin/tsc --noEmit` → exit 0, no output.
- `node_modules/.bin/tsx tools/spec.ts index && … validate` → **OK, 20 rules, 0 errors** on the
  post-change tree.
- The fixture validates standalone: `spec:index` then `spec:validate` inside a copy of
  `tests/fixtures/conveyor-transcript/` → 19 rules, 0 errors, with the fixture itself keeping **no**
  committed `specs/indexes/`.
- The re-recorded block, produced by the manifest's procedure:
  `NEXT brief-tested-1d05 brief-implemented` / `paste /prepare-evidence brief-tested-1d05` / `END`.
  That is the fix demonstrated on a recorded graph — an `implemented` `test-verification` brief
  routing forward instead of reprinting the command that just ran.

## Acceptance, item by item

**Dischargeable here: 2, 3, 4, 5. Deferred: 1, and 6 with it. Review-only: 7.** Stated as the brief
required, not discovered at review.

1. **Paste-only, live — DEFERRED, not claimed.** Acceptance 1 nominates "the next
   `test-verification` lane — this change's own verification lane included". This is an unlaned
   brief with no verification lane, and no live `test-verification` brief currently sits in a state
   where `/write-tests` could be run against it — both existing ones are already `implemented`. So
   the live run has no host and discharges on the next real verification lane. Its remediation on
   failure remains a `drift-finding` plus a rule-5 route. **Not claimed, and no lane was
   manufactured to host it.**
2. **Unit-pinned ordering — MET**, with its weakness admitted. `nextSteps` on an `implemented`
   `lane: test-verification` brief returns exactly one step, `/prepare-evidence <brief-id>`, and
   `deriveStage` is `brief-implemented`. **Admitted:** these legs pin `conveyor.ts`'s `:521`-before-
   `:574` ordering, which this change does not touch — they are green with the whole diff reverted.
   Recorded in the test-file header rather than presented as coverage of the change.
3. **Command-file pin — MET**, and it is the only leg set with power over this diff. Every literal
   of the brief's clause contract is asserted outside the fallback region, relative order included,
   with the `by hand` negative and a three-way negative leg.
4. **Transcript re-recorded — MET.** No manifest entry records a `/write-tests` block that reprints
   `/write-tests` for the node just written. The block was produced by the manifest's own procedure.
5. **No tooling diff — MET**, falsifiable in one command: the change names no path under `tools/`
   and none under `specs/schema/`.
6. **Finding closed — DEFERRED with Acceptance 1.** `drift-finding-write-tests-no-flip-7e52` remains
   **`open`** by amendment 15, which couples its `resolved` write to the recorded acceptance run
   rather than to merge. Worth stating precisely: that node's *own* resolution condition — the
   command leaving its brief in a state from which the resolver prints `/prepare-evidence` unaided,
   under a recorded decision — is now materially satisfied. Amendment 15 is deliberately stricter,
   and the stricter reading governs.
7. **Review-only, admitted.** Whether an agent will reliably run the flip, and whether it judged the
   suite green honestly, stays reviewer judgement.

## Capability wiring, and a correction to the brief

Three `touches` edges, not the two the brief's closing note named:

- `.claude/commands/write-tests.md` → `capability-lifecycle-commands-4f5a`
  (`[.claude/commands/**, .claude/agents/**, .claude/lanes/**]`)
- `CLAUDE.md` → **`capability-spec-docs-8c1d`**
  (`[CLAUDE.md, SPEC.md, README.md, CONTRIBUTING.md, docs/**]`)
- `tests/**`, including the whole fixture → `capability-spec-tests-3a6e` (`[tests/**]`)

**The brief's capability note was wrong** and this is recorded rather than quietly fixed: it
assigned `CLAUDE.md` to `capability-lifecycle-commands-4f5a`, whose globs cover only `.claude/**`.
The brief also said to "confirm both globs against `specs/indexes/by-type.yaml` at evidence time",
and the confirmation is what caught it. No sensitive path (`specs/schema/**`) is touched, so no
owning-capability requirement arises. `specs/nodes/**` and `specs/indexes/**` are intentionally
unowned by `decision-graph-data-unowned-2f7b`, so they trigger no coverage STOP.

## The tension this evidence creates, stated rather than buried

This is an unlaned single brief, so its lone **final** evidence covers the contract, and
`coverage-coherence`'s bidirectional check then *requires* `intent-write-tests-status-flip-2b64` to
be `addressed` — a `draft` evidence would have left both open. Both the brief and
`/prepare-evidence` direct that outcome.

The result is a graph in which the intent reads `addressed` while
`drift-finding-write-tests-no-flip-7e52` reads `open`, and that pairing deserves an explanation
rather than a reader's inference. **The finding tracks the acceptance demonstration, not the
mechanism.** The mechanism is delivered and verified: the command flips, the resolver routes
forward, and six legs pin it with a negative leg proving they bite. What is outstanding is a live
operator run on a real verification lane, which by construction cannot happen until a future change
has one. If a reviewer judges that the intent should not read `addressed` until that run lands, the
correction is to supersede this evidence at `draft` and return the intent to `open` — cheap, and
preferable to leaving the discrepancy unexplained.

## What this evidence does NOT claim

It does not claim the paste-only chain has been walked end to end on a live lane — Acceptance 1 is
deferred and the drift finding stays open. It does not claim the flip is observable: nothing in CI
proves an agent performed it, which is why amendment 9's `ECHO BEFORE MUTATING` echoes the runner's
own exit status rather than an agent's summary, and why Acceptance 7 stays review-only. It does not
claim the ordering legs cover this change — they do not, and the test-file header says so. It does
not address `integration-conveyor-derived-4d19`, which stays `draft`, or
`intent-self-guiding-delivery-loop-6d79`, which stays `open`; sequencing those is the routed-out
item 3 of `decision-write-tests-flip-7f14`.
