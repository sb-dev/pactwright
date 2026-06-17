---
description: Propose candidate contracts for an open intent
---
Input: intent node ID ($ARGUMENTS). Locate it via specs/indexes/by-type.yaml
and read its `class`.
Act as spec-writer: produce candidate contract nodes with distinct
trade-offs (per CLAUDE.md contract structure) — exactly one candidate for a
class 0–1 intent, two or more for a class 2–3 intent (the proposal market the
work-class routing table requires). Then invoke graph-maintainer
to write nodes and `proposes` edges, then regenerate indexes and
validate; nothing is committed on red.
End by printing a trade-off comparison table (or, for a single candidate, its
summary) and asking for a human decision. Do NOT select a winner.
