---
description: Implement exactly what an approved brief specifies
---
Input: brief node ID ($ARGUMENTS). Read the brief, then follow its
`decomposes` edge in specs/graph/edges.yaml to the contract it
implements (and that contract's decision node, for modifications).
Implement exactly what the brief says — code and project files only;
this command performs no graph writes and delegates to no agent.
If the brief seems wrong, incomplete, or contradicts its contract, STOP
and ask the human — never expand scope silently.
End by listing the files created or changed and how to verify them.
