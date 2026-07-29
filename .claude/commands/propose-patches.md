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
   frontmatter.

ECHO BEFORE MUTATING: print each patch's intended id, its branch and its strategy, and
the brief id they will `competes-for`, so the operator sees what will change.
The mutating step ends with `pnpm spec:index && pnpm spec:validate`; nothing is
committed on red.
ON RED: print the findings, the remediation, and explicitly NO next step — no NEXT
block and no fallback. A failed graph write must never route the operator onward.
NEXT BLOCK: after a GREEN validate, run `pnpm spec:status <brief-id>` and reproduce
its NEXT block verbatim. "Verbatim" binds the block only — the market pointer below
belongs around it, never inside it. Substitute the brief id you already hold: never
print `/compare-patches` with an unfilled brief argument. `<winner>` is different —
it is a human choice this command does not hold, so it correctly stays a placeholder.
CLOSING REPORT: each new `patch` id + its branch + its `candidate` status, the brief
id now carrying `patch_market: true`, the draft-PR urls, and a pointer that the
market is now OPEN — its merge is gated by the `patch-comparison` check until
`/compare-patches` then `/select-patch <winner>` resolve it (the
`waives → patch-comparison` override is the sanctioned escape). Stop there.
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
