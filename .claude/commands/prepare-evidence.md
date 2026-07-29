---
description: Record evidence that an implemented brief satisfies its contract
---
Input: brief node ID ($ARGUMENTS). Locate the brief via specs/indexes/ and walk
specs/graph/edges.yaml back (brief —decomposes→ contract —proposes→ intent) to
find the covered intent.
Gather concrete evidence that the implementation satisfies the brief (files landed,
test output, validation runs).
STATUS (laned lifecycle): for a LANED brief, set the brief to `implemented` IF IT IS
NOT ALREADY — `/implement-brief` now flips it as its single graph write, so this is
frequently a no-op — but leave the intent `open`; the intent reaches `addressed` only
via /integrate's final integration node. An UNLANED single brief is unchanged: its
final evidence completes the contract and addresses the intent.
CAPABILITY WIRING: map the change's diff to capability `paths[]` globs (from
specs/indexes/by-type.yaml) and add `touches` edges FROM THE NEW EVIDENCE
(source = evidence) to every capability the change falls under; a sensitive-path
(specs/schema/**) change must `touches` the OWNING capability. If the diff touches
paths NO capability owns, STOP and ask the human — the prompt enumerates the unowned
paths, lists the extendable capabilities with their current globs, and names the
three resolutions: extend a capability, create one via /update-spec-graph in this
PR, or confirm the paths intentionally unowned (the last recorded as a durable dated
authorization artifact). `specs/{nodes,graph,indexes}/**` is confirmed intentionally
unowned, so graph-data files do not trigger the STOP.
IDEMPOTENT / RE-ENTRANT: operate on a clean tree; on resume, detect already-written
evidence and only complete missing `touches` wiring — never duplicate an evidence
node or edge. A brief already at `implemented` is a NO-OP, not a conflict: whether it
reached that status here or upstream in `/implement-brief`, this command leaves it
alone and proceeds to the evidence and its wiring.
Then invoke graph-maintainer to write the evidence node, its `evidences` edge, the
`touches` edges, and the status changes this command still makes — the intent's, and
the brief's only if it was not already `implemented`; the brief's flip may have
happened upstream (CLAUDE.md's lifecycle numbering is the reference for the step).

ECHO BEFORE MUTATING: print the evidence's intended id, the brief id, the intent id,
and every capability the `touches` edges will point at, so the operator sees what will
change.
The mutating step ends with `pnpm spec:index && pnpm spec:validate`; nothing is
committed on red.
ON RED: print the findings, the remediation, and explicitly NO next step — no NEXT
block and no fallback. A failed graph write must never route the operator onward.
NEXT BLOCK: after a GREEN validate, run `pnpm spec:status <brief-id>` and reproduce
its NEXT block verbatim. "Verbatim" binds the block only — the evidence summary
belongs around it, never inside it.
CLOSING REPORT: the evidence id and each updated node's status. Stop there — do not
start new lifecycle work.
FALLBACK (RESOLVER UNAVAILABLE):
  Used ONLY when the resolver itself is unavailable — the status subcommand missing,
  throwing, or unable to load the spec — and NEVER when the graph write failed.
  Print, unresolved:
    /integrate <contract-id>
  The placeholders are REQUIRED here and are not defects. This region resolves
  nothing and substitutes no id, not even ids this command already holds, so a
  degraded print stays visibly distinguishable from a resolved one. It is the
  degraded path, NOT a routing source.
CONVEYOR: the conveyor prints, never executes; a printed command still obeys its
class's standing rules.
