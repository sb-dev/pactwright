---
description: Review a brief's live candidate patches and record one durable comparison — six-axis scoring, reviewer + drift findings; never selects
---
Input: brief node id ($ARGUMENTS). Locate the brief via specs/indexes/, then its
live (non-superseded) candidate patches via the brief's `competes-for` incomings in
specs/indexes/incoming.yaml, reading only the named patch node files.
PRECONDITION (graph-maintainer enforces at validate): depends on the data-migration
lane's widened `compares.target` (`[contract, patch]`) so `comparison —compares→
patch` validates.

1. For EACH live candidate branch (the patch node's `branch`):
   - Run `contract-reviewer` (judgement-only; it writes nothing — graph-maintainer
     records) over the branch to summarise the candidate and its consequences.
   - Run `/detect-drift <patch-branch>` to obtain that branch's observable-behaviour
     drift verdict (a `drift-finding` or 'no drift').
2. Then invoke graph-maintainer to author exactly ONE `comparison` node for the
   market — body per the COMPARISON BODY TEMPLATE below — with one `compares` edge
   per live candidate patch (`comparison —compares→ patch`). If a `comparison`
   already covers this market, REPLACE it (regenerate its body and re-author its
   `compares` edges to the current live candidate set) rather than author a second;
   never leave two comparison nodes for one market. A comparison is never superseded
   by selection.

COMPARISON BODY TEMPLATE (a prose convention for graph-maintainer, NOT a validation
rule — no rule reads a comparison body): `## Candidate trade-off table` SCORING each
patch on the six axes (contract fit, scope control, simplicity, test quality, drift
risk, rollback safety); `## Critic findings by perspective`, with the reviewer and
drift findings grouped per candidate; and `## The case against each candidate`, one
`### <candidate>` each. Patch comparison judges THIS LANE IN ISOLATION against the
lane brief's slice of the contract — cross-lane fit is judged at integration, never
here. On-disk exemplars to match: `comparison-patch-market-synthesis-7b1d` and
`comparison-conveyor-market-890e`.

ECHO BEFORE MUTATING: print the comparison's intended id and every patch id its
`compares` edges will point at, so the operator sees what will change.
The mutating step ends with `pnpm spec:index && pnpm spec:validate`; nothing is
committed on red.
ON RED: print the findings, the remediation, and explicitly NO next step — no NEXT
block and no fallback. A failed graph write must never route the operator onward.
NEXT BLOCK: after a GREEN validate, run `pnpm spec:status <brief-id>` and reproduce
its NEXT block verbatim — one `/select-patch <patch-id> "<rationale>"` line per live
competitor. "Verbatim" binds the block only; the six-axis summary belongs around it.
`<winner>` below and `"<rationale>"` here are NOT unsubstituted-placeholder defects —
they are the human's choice and the human's words, which this command does not hold
and is forbidden to supply, since it must not select or rank.
CLOSING REPORT: the comparison id, the patch ids it `compares`, each candidate's
six-axis line, the `patch-comparison` check named by its exact literal as the gate
the operator must clear (the `waives → patch-comparison` override is the sanctioned
escape), and the next command `/select-patch <winner> "<rationale>"`. End by asking
for a HUMAN DECISION. Do NOT select or rank the candidates. Stop there.
FALLBACK (RESOLVER UNAVAILABLE):
  Used ONLY when the resolver itself is unavailable — the status subcommand missing,
  throwing, or unable to load the spec — and NEVER when the graph write failed.
  Print, unresolved:
    /select-patch <patch-id> "<rationale>"
  The placeholders are REQUIRED here and are not defects. This region resolves
  nothing and substitutes no id, not even ids this command already holds, so a
  degraded print stays visibly distinguishable from a resolved one. It is the
  degraded path, NOT a routing source.
CONVEYOR: the conveyor prints, never executes; a printed command still obeys its
class's standing rules.
