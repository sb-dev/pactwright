---
description: Record evidence that an implemented brief satisfies its contract
---
Input: brief node ID ($ARGUMENTS). Locate the brief via specs/indexes/
and walk specs/graph/edges.yaml back (brief —decomposes→ contract
—proposes→ intent) to find the covered intent.
Gather concrete evidence that the implementation satisfies the brief
(files landed, test output, validation runs), then invoke
graph-maintainer to write the evidence node, its `evidences` edge, and
the status changes of CLAUDE.md lifecycle step 6, then regenerate
indexes and validate; nothing is committed on red.
End by reporting the evidence ID and each updated node's status.
Stop there — do not start new lifecycle work.
