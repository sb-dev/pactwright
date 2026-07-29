---
description: Capture a new intent node in the /specs graph
---
Input: the entire $ARGUMENTS is the intent text. It may be multi-line
quoted text spanning dozens of lines — preserve its line breaks and
formatting verbatim in the node body.
Determine the intent's work `class` (integer 0–3) per the CLAUDE.md
work-class routing table; if the input does not state one, ask the human
before creating the node (`class` is required and range-checked).
Invoke graph-maintainer to create one intent node per CLAUDE.md
lifecycle step 1, with a title distilled from the text, the chosen
`class` in its frontmatter, and the full text as the body. Create no edges and
no contracts.

ECHO BEFORE MUTATING: print the title, the chosen `class` and the body's first
line, so the operator sees what will be written.
The mutating step ends with `pnpm spec:index && pnpm spec:validate`; nothing is
committed on red.
ON RED: print the findings, the remediation, and explicitly NO next step — no NEXT
block and no fallback. A failed graph write must never route the operator onward.
NEXT BLOCK: after a GREEN validate, run `pnpm spec:status <intent-id>` and reproduce
its NEXT block verbatim. "Verbatim" binds the block only — the judgement content this
command owns belongs around it, never inside it.
CLOSING REPORT: the new intent id and its class.
FALLBACK (RESOLVER UNAVAILABLE):
  Used ONLY when the resolver itself is unavailable — the status subcommand missing,
  throwing, or unable to load the spec — and NEVER when the graph write failed.
  Print, unresolved:
    /propose-contracts <intent-id>
  The placeholders are REQUIRED here and are not defects. This region resolves
  nothing and substitutes no id, not even ids this command already holds, so a
  degraded print stays visibly distinguishable from a resolved one. It is the
  degraded path, NOT a routing source.
CONVEYOR: the conveyor prints, never executes; a printed command still obeys its
class's standing rules.
