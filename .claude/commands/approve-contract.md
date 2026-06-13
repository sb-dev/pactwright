---
description: Record a human decision selecting a candidate contract
---
Input: contract node ID (first token of $ARGUMENTS); any remainder is
free-text notes for the decision body. Locate the contract, its intent,
and sibling candidates via specs/indexes/incoming.yaml.
Act as contract-reviewer: summarise the candidates and spell out the
selection's consequences. Then invoke graph-maintainer to record the
decision node (notes and rationale in its body), its `selects` edge,
and the status changes of CLAUDE.md lifecycle step 3, then regenerate
indexes and validate; nothing is committed on red.
End by reporting the decision ID and each affected node's status.
Stop there — do not write a brief.
