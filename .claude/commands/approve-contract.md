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
decision node (body per the DECISION BODY TEMPLATE below), its `selects` edge,
and the status changes of CLAUDE.md lifecycle step 3. The decision body must
record the accepted trade-off and why each rejected candidate lost; and for
a selection of a Class 2 or 3 contract created on or after
`comparison_required_from`, it must cite the market's `comparison` node id
(the comparison holds the analysis; the decision holds the choice). A
pre-cutoff or class-≤1 selection is grandfathered — there is no comparison
node to cite, so record the analysis of record instead: for a CLASS-≤1
selection that is the candidate body's own critique section (a class-0/1 review
records no comparison, so the critique stays on the candidate); for a PRE-CUTOFF
class-2/3 selection it is whatever analysis that market actually recorded, named
explicitly in the decision body. Never cite an artifact the market did not produce.

DECISION BODY TEMPLATE (a prose convention for graph-maintainer, NOT a validation
rule — no rule reads a decision body): a SELECTED / REJECTED lead line naming every
candidate and its resulting status; `## Accepted trade-off (why <base>)`; `## Why
each rejected candidate lost`, one paragraph each; any grafts and mandatory fixes as
an IDENTIFIER-PREFIXED numbered list, since that list is the discharge key a later
integration node enumerates; `## Consequences`, listing each node's resulting status;
the comparison citation; and a closing `**Next step:**` line. Optional, when they
apply: `## Common-core findings (binding in full)` and `## Rule-5 declaration`.
On-disk exemplars to match: `decision-patch-market-ci-gate-8a2f` and
`decision-conveyor-derived-5a91`.

ECHO BEFORE MUTATING: print the decision's intended id, the winning contract id, every
rejected candidate id, and the comparison id being cited, so the operator sees what
will change.
The mutating step ends with `pnpm spec:index && pnpm spec:validate`; nothing is
committed on red.
ON RED: print the findings, the remediation, and explicitly NO next step — no NEXT
block and no fallback. A failed graph write must never route the operator onward.
NEXT BLOCK: after a GREEN validate, run `pnpm spec:status <contract-id>` and reproduce
its NEXT block verbatim. "Verbatim" binds the block only — the consequences summary
belongs around it, never inside it.
CLOSING REPORT: the decision id and each affected node's status. Stop there — do not
write a brief.
FALLBACK (RESOLVER UNAVAILABLE):
  Used ONLY when the resolver itself is unavailable — the status subcommand missing,
  throwing, or unable to load the spec — and NEVER when the graph write failed.
  Print, unresolved, whichever the contract's class calls for:
    /decompose-lanes <contract-id> '<lanes>'
    /write-brief <contract-id>
  The placeholders are REQUIRED here and are not defects. This region resolves
  nothing and substitutes no id, not even ids this command already holds, so a
  degraded print stays visibly distinguishable from a resolved one. It is the
  degraded path, NOT a routing source.
CONVEYOR: the conveyor prints, never executes; a printed command still obeys its
class's standing rules.
