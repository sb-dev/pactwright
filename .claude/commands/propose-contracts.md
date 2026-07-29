---
description: Propose candidate contracts for an open intent
---
Input: intent node ID ($ARGUMENTS). Locate it via specs/indexes/by-type.yaml
and read its `class`.
Act as spec-writer: produce candidate contract nodes with distinct
trade-offs (per CLAUDE.md contract structure) — exactly one candidate for a
class 0–1 intent, two or more for a class 2–3 intent (the proposal market the
work-class routing table requires). Then invoke graph-maintainer
to write nodes and `proposes` edges.
End by printing a trade-off comparison table (or, for a single candidate, its
summary) and asking for a human decision. Do NOT select a winner.

ECHO BEFORE MUTATING: print each candidate's intended id and title, and the intent
id they will `proposes`, so the operator sees what will be written.
The mutating step ends with `pnpm spec:index && pnpm spec:validate`; nothing is
committed on red.
ON RED: print the findings, the remediation, and explicitly NO next step — no NEXT
block and no fallback. A failed graph write must never route the operator onward.
NEXT BLOCK: after a GREEN validate, run `pnpm spec:status <intent-id>` and reproduce
its NEXT block verbatim. "Verbatim" binds the block only — the trade-off table and
the request for a human decision belong around it, never inside it.
CLOSING REPORT: every candidate contract id created, its class, and the intent id.
FALLBACK (RESOLVER UNAVAILABLE):
  Used ONLY when the resolver itself is unavailable — the status subcommand missing,
  throwing, or unable to load the spec — and NEVER when the graph write failed.
  Print, unresolved, whichever the intent's class calls for:
    /review-contracts <intent-id>
    /approve-contract <contract-id> "<notes>"
  The placeholders are REQUIRED here and are not defects. This region resolves
  nothing and substitutes no id, not even ids this command already holds, so a
  degraded print stays visibly distinguishable from a resolved one. It is the
  degraded path, NOT a routing source.
CONVEYOR: the conveyor prints, never executes; a printed command still obeys its
class's standing rules.
