---
description: Propose candidate contracts for an open intent
---
Input: intent node ID ($ARGUMENTS). Locate it via specs/indexes/by-type.yaml
and read its `class`.
Act as spec-writer: produce candidate contract nodes with distinct
trade-offs (per CLAUDE.md contract structure) — exactly one candidate for a
class 0–1 intent, two or more for a class 2–3 intent (the proposal market the
work-class routing table requires).
NARROW-SCOPE REDUCTION (class 2 ONLY): a class-2 intent whose change is confined
to a single surface may instead take ONE candidate declaring `scope: narrow` in
its frontmatter. Only do this when the change genuinely is narrow — the test is
whether a second candidate would express a real alternative approach or merely
manufacture one. When taken, the contract body MUST carry the rationale in its
own section; the field without a stated reason is a defect, and a reviewer who
disagrees asks for the market. NEVER at class 3, and never as a substitute for
classifying a risky change honestly. When in doubt, run the market.
Then invoke graph-maintainer
to write nodes and `proposes` edges, then regenerate indexes and
validate; nothing is committed on red.
End by printing a trade-off comparison table (or, for a single candidate, its
summary) and asking for a human decision. Do NOT select a winner.
