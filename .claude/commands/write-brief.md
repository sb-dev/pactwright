---
description: Decompose an approved contract into one implementation brief
---
Input: contract node ID ($ARGUMENTS). Locate it via specs/indexes/ and
confirm an inbound `selects` edge exists in incoming.yaml; stop and
report if the contract was never selected. Read the contract's `class` to
decide whether lane decomposition and the patch market apply, per the CLAUDE.md
work-class routing table, which is the authority:
  - class 3 — lanes are REQUIRED; use `/decompose-lanes`, not this command.
  - class 2 — lanes are OPTIONAL and a patch market is optional PER BRIEF; either
    this command or `/decompose-lanes` is legitimate, and the choice is recorded.
  - class 0–1 — a single unlaned brief and no market.
Act as spec-writer: draft exactly one brief naming the files to create,
script entries, libraries, ordered implementation steps, and explicit
non-scope.
CARRY THE AMENDMENTS: the effective contract is the approved contract PLUS its
selecting decision's amendments — a brief that satisfies the contract body while
dropping an amendment is not complete. Read the contract's inbound `selects`
decision and carry this brief's slice into it, naming each amendment by its
identifier so a later integration node can enumerate the discharge key.
Then invoke graph-maintainer to write the brief node and its `decomposes` edge.

ECHO BEFORE MUTATING: print the brief's intended id, title and the contract id it
will `decomposes`, so the operator sees what will be written.
The mutating step ends with `pnpm spec:index && pnpm spec:validate`; nothing is
committed on red.
ON RED: print the findings, the remediation, and explicitly NO next step — no NEXT
block and no fallback. A failed graph write must never route the operator onward.
NEXT BLOCK: after a GREEN validate, run `pnpm spec:status <brief-id>` and reproduce
its NEXT block verbatim. "Verbatim" binds the block only — the judgement content this
command owns belongs around it, never inside it.
VERIFICATION REMINDER (class ≥1, unlaned brief only): this is a judgement reminder,
NOT a runnable step, and it is deliberately not paste-shaped — `/write-tests` refuses
any brief whose `lane` is not `test-verification`, so handing over a command line
would hand over a refusal. Independent verification is still required. The two
recoverable actions are: re-decompose the contract with a `test-verification` lane
via `/decompose-lanes`, or write the tests outside the command in an invocation
separate from the one that wrote the code under test.
CLOSING REPORT: the brief id, its contract id, and the amendments it carries. Stop
there — do not implement anything.
FALLBACK (RESOLVER UNAVAILABLE):
  Used ONLY when the resolver itself is unavailable — the status subcommand missing,
  throwing, or unable to load the spec — and NEVER when the graph write failed.
  Print, unresolved:
    /implement-brief <brief-id>
  The placeholders are REQUIRED here and are not defects. This region resolves
  nothing and substitutes no id, not even ids this command already holds, so a
  degraded print stays visibly distinguishable from a resolved one. It is the
  degraded path, NOT a routing source.
CONVEYOR: the conveyor prints, never executes; a printed command still obeys its
class's standing rules.
