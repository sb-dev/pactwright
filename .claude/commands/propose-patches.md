---
description: Propose N candidate patches for a lane/single brief — one branch + draft PR + candidate patch node per strategy
---
Input: `<brief-id> <n> <strategy-list>` ($ARGUMENTS) — the brief node id (first
token), the count `n`, and a comma-separated list of strategy tokens. Locate the
brief via specs/indexes/by-type.yaml; confirm it is a LANE brief (carries a `lane`
field) or a single (unlaned) brief — stop and report if the id is not a brief.
PRECONDITION (graph-maintainer enforces at validate): this command depends on the
data-migration lane's `patch` node type, the `competes-for` edge type, and the
`patch_market` brief flag existing in the schema; without them the graph write
below reds `pnpm spec:validate` with an unknown node/edge type.

1. Confirm the strategy list has `n` tokens; derive the brief slug from the brief
   id (the `<slug>` between `brief-` and the 4-hex suffix).
2. For EACH named strategy, in turn, on a clean tree:
   - `git checkout -b patch/<brief-slug>/<strategy>` off the lane's base.
   - Run the implementation agent (the `/implement-brief` flow) against the brief
     PLUS an injected strategy directive that biases HOW the brief is implemented
     (the strategy), carrying `/implement-brief`'s scope discipline — if the brief
     seems wrong, incomplete, or contradicts its contract, STOP and ask the human;
     never expand scope silently.
   - Open a DRAFT PR for the branch via `gh pr create --draft`.
3. Then invoke graph-maintainer to create one `patch` node per strategy
   (frontmatter `status: candidate`; `branch:` set BYTE-EQUAL to the created branch
   name `patch/<brief-slug>/<strategy>`; `strategy:` set to the strategy token; body
   = the evidence summary of what the strategy did) plus one `competes-for` edge per
   patch (`patch —competes-for→ brief`), and set `patch_market: true` on the brief
   frontmatter. Then regenerate indexes and validate (`pnpm spec:index && pnpm
   spec:validate`); nothing is committed on red.
CLOSING REPORT: each new `patch` id + its branch + its `candidate` status, the brief
id now carrying `patch_market: true`, the draft-PR urls, and a pointer that the
market is now OPEN — its merge is gated by the `patch-comparison` check until
`/compare-patches <brief-id>` then `/select-patch <winner>` resolve it (the
`waives → patch-comparison` override is the sanctioned escape). Stop there.
