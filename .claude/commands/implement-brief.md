---
description: Implement exactly what an approved brief specifies
---
Input: brief node ID ($ARGUMENTS). Read the brief, then follow its
`decomposes` edge in specs/graph/edges.yaml to the contract it
implements, AND that contract's selecting `decision` — the effective contract is the
contract plus the decision's amendments, so work that satisfies the contract body
while dropping an amendment is not done.
Implement exactly what the brief says — code and project files only.
ROUTING: when the brief carries an `owner`, delegate the implementation to that
agent. When it carries none, implement INLINE exactly as before, and say which path
was taken in the closing report. An absent `owner` is legal and means unassigned,
never an error — it is the path every brief written before the lane market existed
takes.
If the brief seems wrong, incomplete, or contradicts its contract, STOP
and ask the human — never expand scope silently.

EXACTLY ONE GRAPH WRITE: when the implementation is complete, graph-maintainer flips
this brief from its pre-implementation status (`draft` or `approved`) to
`implemented`. That is the whole of this command's graph mutation — no edges, no
other node, no status but this one. graph-maintainer remains the sole writer; the
flip goes through it, never inline. The flip is what makes the implementation-to-
evidence hop derivable: the resolver keys on the RESULTING `implemented` status to
emit `/prepare-evidence`, closing the loop where this command used to reprint itself.
This changes intended behaviour and is approved under CLAUDE.md scope-integrity
rule 5 by `decision-conveyor-derived-5a91` (amendment A7, `## Rule-5 declaration`).
CLAUDE.md's lifecycle Implementation step documents this single write, so the command
and the governing document now agree. (They did not for one intra-PR window: this
clause was written while that step still said "code only; no graph writes", and the
`docs-spec` lane closed the gap.)

ECHO BEFORE MUTATING: print the brief id and its current status, so the operator sees
what is about to change.
The mutating step ends with `pnpm spec:index && pnpm spec:validate`; nothing is
committed on red.
ON RED: print the findings, the remediation, and explicitly NO next step — no NEXT
block and no fallback. A failed graph write must never route the operator onward.
NEXT BLOCK: after a GREEN validate, run `pnpm spec:status <brief-id>` and reproduce
its NEXT block verbatim. "Verbatim" binds the block only — the list of files created
or changed and how to verify them belongs around it, never inside it.
CLOSING REPORT: the files created or changed, how to verify them, the brief id now
`implemented`, and whether the work was delegated to an `owner` or implemented inline.
FALLBACK (RESOLVER UNAVAILABLE):
  Used ONLY when the resolver itself is unavailable — the status subcommand missing,
  throwing, or unable to load the spec — and NEVER when the graph write failed.
  Print, unresolved:
    /prepare-evidence <brief-id>
  The placeholders are REQUIRED here and are not defects. This region resolves
  nothing and substitutes no id, not even ids this command already holds, so a
  degraded print stays visibly distinguishable from a resolved one. It is the
  degraded path, NOT a routing source.
CONVEYOR: the conveyor prints, never executes; a printed command still obeys its
class's standing rules.
