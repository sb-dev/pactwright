---
id: evidence-patch-market-docs-5b6c
type: evidence
title: CLAUDE.md patch-market docs landed (docs-spec lane)
status: final
created: 2026-06-25
produced_by: "/prepare-evidence"
---

Evidence that `brief-patch-market-docs-e2b5` (the `docs-spec` lane of `contract-patch-market-ci-gate-6b7e`, proposing `intent-patch-market-synthesis-3b1e`) is implemented.

## What landed (code & project files)
- `CLAUDE.md` — a new `### Patch market` subsection under `## Lane model and integration`: the per-lane / lane-isolation doctrine (patches compete within one lane; comparison judges that lane in isolation; cross-lane fit is judged at integration, never in patch comparison); the patch-market-by-class elaboration tied to the existing `Patch market` table column (no cells changed); within-lane synthesis vs across-lane integration; the comparison-as-durable-record note; the scope-integrity pointer (rule 5); and the honest-bound note on the `patch-comparison` check.
- Committed as `d619bb3`.

## Verification (run 2026-06-25)
- The work-class table cells are unchanged (`none` / `none` / `optional per brief` / `available per lane`); the prose elaborates them.
- Identifiers byte-correct (`patch`, `competes-for`, `synthesizes`, `synthesis_parentage`, `patch_market`, `patch-comparison`, the four `/…-patches` commands).
- `node_modules/.bin/tsx tools/spec.ts validate` → OK, 20 rules, 0 errors.

## Touches
- `capability-spec-docs-8c1d` (owns `CLAUDE.md`, and after this PR `docs/**`).
