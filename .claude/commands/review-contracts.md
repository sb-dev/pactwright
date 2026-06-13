---
description: Adversarially review every candidate contract for an intent
---
Input: intent node ID ($ARGUMENTS). Locate its candidate contracts via
specs/indexes/incoming.yaml (the `proposes` edges pointing at it).
Act as spec-critic: review every candidate for ambiguity, missing
cases, and scope creep, drafting one `## Critique` section per
candidate. Then invoke graph-maintainer to append each section to its
node, regenerate indexes, and validate; nothing is committed on red.
End by summarising the critiques. Do NOT select or rank the candidates.
