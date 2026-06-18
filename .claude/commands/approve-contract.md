---
description: Record a human decision selecting a candidate contract
---
Input: contract node ID (first token of $ARGUMENTS); any remainder is
free-text notes for the decision body. Locate the contract's intent via
its `proposes` edge in specs/indexes/outgoing.yaml, then sibling
candidates via the intent's entry in specs/indexes/incoming.yaml.
Pre-check the work-class quorum: if the intent's `class` is ≥2 and it has
fewer than two live (non-superseded) candidate contracts, refuse to record
the selection and report why — an under-proposed class-≥2 intent cannot be
approved (the `class-market-quorum` validation rule is the backstop).
Act as contract-reviewer: summarise the candidates and spell out the
selection's consequences. Then invoke graph-maintainer to record the
decision node (notes and rationale in its body), its `selects` edge,
and the status changes of CLAUDE.md lifecycle step 3, then regenerate
indexes and validate; nothing is committed on red. The decision body must
record the accepted trade-off and why each rejected candidate lost; and for
a selection of a Class 2 or 3 contract created on or after
`comparison_required_from`, it must cite the market's `comparison` node id
(the comparison holds the analysis; the decision holds the choice). A
pre-cutoff or class-≤1 selection is grandfathered — there is no comparison
node to cite, so record the analysis of record instead (e.g. the candidates'
appended critiques).
End by reporting the decision ID and each affected node's status.
Stop there — do not write a brief.
