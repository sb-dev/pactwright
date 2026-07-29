---
description: Write a test-verification lane's tests via the test-writer agent
---
Input: test-verification brief node ID ($ARGUMENTS). Locate the brief via
specs/indexes/ and confirm its `lane` is `test-verification`; stop and report
otherwise.
REFUSAL REPORT (the precondition above is UNCHANGED and does not widen): when the
brief's `lane` is not `test-verification`, stop and name the two recoverable actions
rather than leaving the operator stuck — (a) re-decompose the contract with a
`test-verification` lane via `/decompose-lanes`, or (b) write the tests outside this
command, still in a separate invocation from the one that wrote the code under test.
Independent verification is still required either way. Widening this precondition to
accept an unlaned brief would change intended behaviour, so it is routed to a
follow-up intent rather than done here.
Invoke test-writer against it — a SEPARATE invocation from any /implement-brief
that wrote the code under test (verification is always its own lane). The agent
writes/extends tests under `tests/` only and performs no graph writes.

NEXT BLOCK: run `pnpm spec:status <brief-id>` and reproduce its NEXT block verbatim.
"Verbatim" binds the block only — the list of test files written belongs around it.
KNOWN GAP, stated rather than hidden: this command performs no graph write, so the
brief does not reach `implemented` here and the resolver keeps printing this same
step. Run `/prepare-evidence <brief-id>` by hand. Extending A7's status flip to this
command would change intended behaviour on a second command, so it is routed to human
approval rather than taken here.
CLOSING REPORT: the test files written and how to run them. The test-verification
lane reaches its own evidence via /prepare-evidence, and /integrate keeps the
contract's integration at `draft` until that lane is at final evidence. Stop there.
FALLBACK (RESOLVER UNAVAILABLE):
  Used ONLY when the resolver itself is unavailable — the status subcommand missing,
  throwing, or unable to load the spec — and NEVER when a graph write failed.
  Print, unresolved:
    /prepare-evidence <brief-id>
  The placeholders are REQUIRED here and are not defects. This region resolves
  nothing and substitutes no id, not even ids this command already holds, so a
  degraded print stays visibly distinguishable from a resolved one. It is the
  degraded path, NOT a routing source.
CONVEYOR: the conveyor prints, never executes; a printed command still obeys its
class's standing rules.
