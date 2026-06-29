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
   (`patch —competes-for→ brief`). Then regenerate indexes and validate (`pnpm
   spec:index && pnpm spec:validate`); nothing is committed on red.
CLOSING REPORT: the synthesis patch id + its branch + its `candidate` status, the
parent patch ids it `synthesizes`, the brief id it `competes-for`, the draft-PR url,
and that it now competes in the same market — re-run `/compare-patches <brief-id>`
then `/select-patch <winner>` to resolve it. Stop there.
