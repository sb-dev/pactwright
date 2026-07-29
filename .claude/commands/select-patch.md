---
description: Record a human decision selecting a winning patch — apply the scope-integrity gate, supersede losers (and a synthesis winner's parents), then hand the winner to /prepare-evidence
---
Input: `<patch-id> <rationale>` ($ARGUMENTS) — the winner patch id (first token);
the remainder is the free-text rationale for the decision body. Locate the winner
via specs/indexes/, its brief via the winner's `competes-for` edge, the market's
`comparison` node, and the sibling competing patches via the brief's `competes-for`
incomings.
PRECONDITION (graph-maintainer relies on this at validate): depends on the
data-migration lane's widened `selects.target` (`[contract, patch]`) and the
domain-backend lane's Fix-1 `intentsForContract` type-guard, so a `selects → patch`
edge does not red `class_market_quorum` / `comparison_required`.

1. SCOPE-INTEGRITY GATE FIRST (CLAUDE.md rule 5, Phase-6) — before recording
   anything, apply the three branches:
   - Brief boundary wrong, contract intact → instruct graph-maintainer to SUPERSEDE
     the brief with a corrected brief (`supersedes` edge, old brief to its terminal
     status). Never edit the approved brief in place; never widen scope inside the
     winner.
   - Contract incomplete, intended behaviour unchanged → STOP and `/capture-intent`
     a follow-up intent for the missing scope. Do not widen the winner.
   - Selected work CHANGES intended behaviour → STOP and return to human approval (a
     new `decision` is required) before proceeding. Never absorb the drift into the
     winner.
2. Then invoke graph-maintainer to author one `decision` node (`decided_by`
   required; body per the DECISION BODY TEMPLATE below) and its `selects` edge to the
   winner (`decision —selects→ patch`), plus the status changes: every LOSING patch —
   INCLUDING the parent patches of a selected synthesis patch — set to `superseded`;
   the winner set to `selected`.
3. Close the losing patches' DRAFT PRs via `gh pr close`, but KEEP their branches
   (do not delete the refs).
4. Hand the winner off to `/prepare-evidence` — which authors the evidence node, its
   `evidences` edge, and the `touches` edges. Do not prepare evidence inline; do not
   integrate.

DECISION BODY TEMPLATE (a prose convention for graph-maintainer, NOT a validation
rule — no rule reads a decision body): a SELECTED / REJECTED lead line naming every
candidate and its resulting status; `## Accepted trade-off (why <winner>)`; `## Why
each rejected candidate lost`, one paragraph each; any grafts and mandatory fixes as
an IDENTIFIER-PREFIXED numbered list, since that list is the discharge key a later
integration node enumerates; `## Consequences`, listing each node's resulting status;
the citation of the market's `comparison` node id (the comparison holds the analysis,
the decision holds the choice); and a closing `**Next step:**` line. Optional, when
they apply: `## Common-core findings (binding in full)` and `## Rule-5 declaration`.
On-disk exemplars to match: `decision-patch-market-ci-gate-8a2f` and
`decision-conveyor-derived-5a91`.

ECHO BEFORE MUTATING: print the winner id, every loser id, the brief id and the
comparison id you are about to write, so the operator sees what will change.
The mutating step ends with `pnpm spec:index && pnpm spec:validate`; nothing is
committed on red.
ON RED: print the findings, the remediation, and explicitly NO next step — no NEXT
block and no fallback. A failed graph write must never route the operator onward.
NEXT BLOCK: after a GREEN validate, run `pnpm spec:status <brief-id>` and reproduce
its NEXT block verbatim. "Verbatim" binds the block only — the judgement content this
command owns belongs around it, never inside it. The block resolves the winner's
brief through its `competes-for` edge, so the printed step is
`/prepare-evidence <brief-id>` — a BRIEF ID, never a branch. The winner's branch is
context for the reader, never the argument.
CLOSING REPORT: the decision id, the winner patch id now `selected`, every superseded
loser id (and any superseded synthesis-parent ids), the brief id (plus any
superseding-brief id or follow-up-intent id if a scope-integrity branch fired), and
the closed PR numbers. Stop there — do not prepare evidence inline.
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
