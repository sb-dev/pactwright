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
   required; body = the rationale + the accepted trade-off + why each loser lost,
   citing the market's `comparison` node id) and its `selects` edge to the winner
   (`decision —selects→ patch`), plus the status changes: every LOSING patch —
   INCLUDING the parent patches of a selected synthesis patch — set to `superseded`;
   the winner set to `selected`. Then regenerate indexes and validate (`pnpm
   spec:index && pnpm spec:validate`); nothing is committed on red.
3. Close the losing patches' DRAFT PRs via `gh pr close`, but KEEP their branches
   (do not delete the refs).
4. Hand the winner's branch off to `/prepare-evidence` — which authors the evidence
   node, its `evidences` edge, and the `touches` edges. Do not prepare evidence
   inline; do not integrate.
CLOSING REPORT: the decision id, the winner patch id now `selected`, every
superseded loser id (and any superseded synthesis-parent ids), the brief id (plus
any superseding-brief id or follow-up-intent id if a scope-integrity branch fired),
the closed PR numbers, and the next step `/prepare-evidence <winner-branch>`. Stop
there — do not prepare evidence inline.
