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

EXACTLY ONE GRAPH WRITE: when the suite is green, graph-maintainer flips this brief
from its pre-implementation status (`draft` or `approved`) to `implemented`. That is
the whole of this command's graph mutation — no edges, no other node, no status but
this one. graph-maintainer remains the sole writer; the flip goes through it, never
inline, and `test-writer` still performs no graph write of its own. The flip is what
makes this lane's hop derivable: the resolver keys on the RESULTING `implemented`
status to emit `/prepare-evidence`, closing the loop where this command used to
reprint itself. This changes intended behaviour on a second command and is approved
under CLAUDE.md scope-integrity rule 5 by `decision-write-tests-flip-7f14`.
FAILURE DIRECTION, chosen deliberately: if the flip is skipped the brief stays at its
pre-implementation status and this command reprints — exactly today's behaviour, the
weaker of the two failure modes. Nothing routes forward on an unwritten lane.
TWO CONSEQUENCES OF THE RESULTING STATUS, documented rather than changed: an
`implemented` brief carrying a `## Strategy tension` section no longer receives the
`/propose-patches` offer, and an `implemented` brief whose patch market is opened
later prints `/prepare-evidence` and never the market steps. Both follow from the
resolver returning on `implemented` before it reaches the lane and market branches.
Changing either is a separate change of intended behaviour and is not approved here.

ON RED SUITE: when the suite is not green there is no flip and no next step. A red
verification suite is ordinary — the code under test lands in other lanes first — so
report the failing output, and if the cause is another lane's artifact rather than
this lane's tests, that divergence is recorded as a `drift-finding` and routed under
CLAUDE.md scope-integrity rule 5. Never flip to clear a red.
IDEMPOTENT / RE-ENTRANT: operate on a clean tree; on resume, detect the flip already
made and do not repeat it. A brief already at `implemented` is a NO-OP, not a
conflict. Re-running this command against a lane whose tests exist re-invokes
test-writer, so state what changed rather than silently rewriting a green suite.
ECHO BEFORE MUTATING: print the brief id, its current status, and
the test runner's own exit status — the observed value, never the agent's summary of
it — so the operator sees what is about to change and the evidence it changes on.
The mutating step ends with `pnpm spec:index && pnpm spec:validate`; nothing is
committed on red.
ON RED: print the findings, the remediation, and explicitly NO next step — no NEXT
block and no fallback. A failed graph write must never route the operator onward.
NEXT BLOCK: after a GREEN validate, run `pnpm spec:status <brief-id>` and reproduce
its NEXT block verbatim.
"Verbatim" binds the block only — the list of test files written belongs around it.
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
