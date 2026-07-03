---
id: evidence-patch-market-commands-3f4a
type: evidence
title: Patch-market commands landed (api-integration lane)
status: final
created: 2026-06-25
produced_by: "/prepare-evidence"
---

Evidence that `brief-patch-market-commands-c5f3` (the `api-integration` lane of `contract-patch-market-ci-gate-6b7e`, proposing `intent-patch-market-synthesis-3b1e`) is implemented.

## What landed (code & project files)
- `.claude/commands/propose-patches.md` — `/propose-patches <brief-id> <n> <strategy-list>`: per strategy, branch `patch/<brief-slug>/<strategy>`, run the implementation agent with an injected strategy directive, open a draft PR, author a `candidate` `patch` node (`branch` byte-equal to the created branch, `strategy` token) with a `competes-for` edge, set `patch_market: true` on the brief.
- `.claude/commands/compare-patches.md` — `/compare-patches <brief-id>`: run `contract-reviewer` + `/detect-drift` per live candidate; author exactly ONE `comparison` (six-axis scoring) with `compares` edges to each candidate; ask for a human decision; NEVER select.
- `.claude/commands/synthesize-patches.md` — `/synthesize-patches <brief-id> <patch-id-list> <instruction>`: ≥2 parents all competing for THIS brief; branch `patch/<brief-slug>/synthesis`; author a `synthesis` `patch` with `synthesizes` edges to each parent + a `competes-for` to the same brief.
- `.claude/commands/select-patch.md` — `/select-patch <patch-id> <rationale>`: apply the Phase-6 scope-integrity gate first; author a `decision` + `selects → patch`; supersede losers (and a synthesis winner's parents); close losing draft PRs (keep branches); hand the winner to `/prepare-evidence`.
- Committed as `8aa31ca`.

## Verification (run 2026-06-25)
- House-style match against the existing thin commands (frontmatter `description:` → `Input:` → numbered procedure → graph-maintainer delegation + index/validate → Fix-4 closing status-report → "Stop there").
- The merge-gate named check is referenced by the exact literal `patch-comparison` where the operator meets it (`propose-patches`, `compare-patches`); `compare-patches` never selects; selection lives only in `select-patch`.
- `node_modules/.bin/tsx tools/spec.ts validate` → OK, 20 rules, 0 errors (the command files are not graph data; the graph is unaffected).

## Touches
- `capability-lifecycle-commands-4f5a` (owns `.claude/commands/**`, `.claude/agents/**`).
