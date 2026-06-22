---
description: Record evidence that an implemented brief satisfies its contract
---
Input: brief node ID ($ARGUMENTS). Locate the brief via specs/indexes/ and walk
specs/graph/edges.yaml back (brief —decomposes→ contract —proposes→ intent) to
find the covered intent.
Gather concrete evidence that the implementation satisfies the brief (files landed,
test output, validation runs).
STATUS (laned lifecycle): for a LANED brief, set the brief to `implemented` but
leave the intent `open` — the intent reaches `addressed` only via /integrate's
final integration node. An UNLANED single brief is unchanged: its final evidence
completes the contract and addresses the intent.
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
node or edge.
Then invoke graph-maintainer to write the evidence node, its `evidences` edge, the
`touches` edges, and the status changes of CLAUDE.md lifecycle step 6, regenerate
indexes, and validate; commit only on green.
End by reporting the evidence ID and each updated node's status. Stop there — do not
start new lifecycle work.
