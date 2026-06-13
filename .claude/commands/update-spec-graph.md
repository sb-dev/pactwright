---
description: Ad-hoc /specs graph change via graph-maintainer
---
Input: the entire $ARGUMENTS is a free-text instruction describing the
graph change (nodes, edges, statuses, supersessions).
Invoke graph-maintainer to apply it per CLAUDE.md, regenerate indexes,
and validate; nothing is committed on red.
If the instruction would require deleting a node or authoring a
relationship outside specs/graph/edges.yaml, refuse and explain why.
End by reporting the IDs of every node and edge touched.
