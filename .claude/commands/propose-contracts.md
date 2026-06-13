---
description: Propose candidate contracts for an open intent
---
Input: intent node ID ($ARGUMENTS). Locate it via specs/indexes/by-type.yaml.
Act as spec-writer: produce 2-3 candidate contract nodes with distinct
trade-offs (per CLAUDE.md contract structure), then invoke graph-maintainer
to write nodes and `proposes` edges, then regenerate indexes and
validate; nothing is committed on red.
End by printing a trade-off comparison table and asking for a human decision.
Do NOT select a winner.
