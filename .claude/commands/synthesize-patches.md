---
description: Combine two or more competing patches of one brief into a synthesis candidate — within-lane only; across-lane combination is /integrate, never synthesis
---
Input: `<brief-id> <patch-id-list> <instruction>` ($ARGUMENTS) — the brief node id
(first token), a comma-separated list of parent patch ids to combine, and the
remaining free-text human instruction for HOW to combine them. Locate the brief via
specs/indexes/; confirm EVERY named parent patch `competes-for` THIS brief (reject
and stop if any parent competes for a different brief — across-lane combination is
integration, not synthesis). REQUIRE ≥2 named parents up front; refuse fewer.
PRECONDITION (graph-maintainer enforces at validate): depends on the data-migration
lane's `synthesizes` edge type and the domain-backend lane's `synthesis_parentage`
rule (which reds a synthesis patch with fewer than two `synthesizes` edges).

1. Derive the brief slug; on a clean tree `git checkout -b patch/<brief-slug>/synthesis`.
2. Combine the named parent patches per the human instruction (the implementation
   work). Open a DRAFT PR for the branch via `gh pr create --draft`.
3. Then invoke graph-maintainer to create one synthesis `patch` node (frontmatter
   `status: candidate`; `branch: patch/<brief-slug>/synthesis` byte-equal to the
   created branch; `strategy: synthesis`; body = the evidence summary of the
   combination, stating that a synthesis patch competes for the SAME lane brief as
   its parents and that ACROSS-LANE combination is `/integrate`, never synthesis)
   with one `synthesizes` edge to EACH named parent patch (`patch —synthesizes→
   patch`) AND one `competes-for` edge to the SAME brief the parents compete for
   (`patch —competes-for→ brief`).

ECHO BEFORE MUTATING: print the synthesis patch's intended id, its branch, every
parent patch id it will `synthesizes`, and the brief id it will `competes-for`, so
the operator sees what will change.
The mutating step ends with `pnpm spec:index && pnpm spec:validate`; nothing is
committed on red.
ON RED: print the findings, the remediation, and explicitly NO next step — no NEXT
block and no fallback. A failed graph write must never route the operator onward.
NEXT BLOCK: after a GREEN validate, run `pnpm spec:status <brief-id>` and reproduce
its NEXT block verbatim. "Verbatim" binds the block only. Substitute the brief id you
already hold: never print `/compare-patches` with an unfilled brief argument.
`<winner>` is different — it is a human choice this command does not hold, so it
correctly stays a placeholder.
CLOSING REPORT: the synthesis patch id + its branch + its `candidate` status, the
parent patch ids it `synthesizes`, the brief id it `competes-for`, the draft-PR url,
and that it now competes in the same market — re-run `/compare-patches` then
`/select-patch <winner>` to resolve it. Stop there.
FALLBACK (RESOLVER UNAVAILABLE):
  Used ONLY when the resolver itself is unavailable — the status subcommand missing,
  throwing, or unable to load the spec — and NEVER when the graph write failed.
  Print, unresolved:
    /compare-patches <brief-id>
  The placeholders are REQUIRED here and are not defects. This region resolves
  nothing and substitutes no id, not even ids this command already holds, so a
  degraded print stays visibly distinguishable from a resolved one. It is the
  degraded path, NOT a routing source.
CONVEYOR: the conveyor prints, never executes; a printed command still obeys its
class's standing rules.
