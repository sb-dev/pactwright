---
id: evidence-conveyor-schema-graph-7c41
type: evidence
title: Data-migration lane implemented — optional owner on brief, lane-list pointer, live-intent definition, and the five Scope-14 graph migrations
status: final
created: 2026-07-30
produced_by: "/prepare-evidence"
---
Evidence that `brief-conveyor-schema-graph-8b2e` (lane `data-migration`) satisfies its slice of
`contract-conveyor-derived-4c8c` plus the amendments of `decision-conveyor-derived-5a91`. Landed in
two commits: `4f94e41` (the schema half) and `46eb5bd` (the graph data).

## What landed — schema (Scope 7)

`specs/schema/node-types.yaml`, three comment-level edits, no `required_fields` and no
`status_values` list changed anywhere in the file:

1. **Optional `owner` on `brief`** (CC-9), worded on the `patch_market` precedent: unvalidated like
   `produced_by`, not in `required_fields`, no validation rule. Absence is legal and means
   UNASSIGNED, never an error — which is the state of all seven briefs of this decomposition.
2. **The inline eight-lane enumeration became a pointer** to `brief-lane-valid`'s `keys` as the
   machine-authoritative list and the CLAUDE.md table plus `.claude/lanes/` as the human-readable
   one. The file now holds ZERO lane names, retiring one of the six live copies.
3. **CC-13's single "live intent" definition** on the `intent` block: live iff `status` is `open`
   AND the node is not the target of a `supersedes` edge. The edge clause is load-bearing because
   `status_values` declares no `superseded` value.

## What landed — graph data (Scope 14, all five sub-items)

- **14.1 — ten `touches` edges.** `evidence-work-class-routing-f0a3` and
  `evidence-critics-literal-panel-e2a7` each had exactly one edge and ZERO `touches`; each body
  spans all five capabilities, so five edges each. The repo carried two id conventions; the
  **full** form (`edge-touches-<evidence-slug>-<capability-slug>-<4hex>`, the Phase-9 shape) was
  pinned going forward. The five existing short-form ids were left untouched — ids are immutable.
- **14.2 — two capability widenings.** `capability-lifecycle-commands-4f5a` gained
  `.claude/lanes/**`; `capability-spec-docs-8c1d` gained `SPEC.md`, `README.md`, `CONTRIBUTING.md`,
  and its singular "Owns the governing-doctrine document `CLAUDE.md`" body claim was widened. No
  `created` key was added to `8c1d` — `created` is not in `capability`'s `required_fields` and
  inventing one would have fabricated a date.
- **14.3 — the PR #4 `/detect-drift` verdict: NO DRIFT.** Recorded in full below.
- **14.4 — two follow-up intents**, both `open`, `class: 2`: the malformed-cutoff gate
  (`intent-malformed-cutoff-finding-b3d7`) and `/write-tests` on unlaned briefs
  (`intent-write-tests-unlaned-brief-b3d8`).
- **14.5 — the `.gitignore` authorization**, `decision-gitignore-unowned-6b3d`, edgeless, on the
  `decision-graph-data-unowned-2f7b` shape, `decided_by: Samir Benzenine`, authorization given
  2026-07-29.

## Scope 14.3 — the PR #4 drift verdict

**Verdict: no drift.** No `drift-finding` node was created.

PR #4 is merge commit `cc2004b` ("Phase 4: enforce spec-graph gates and human approval via GitHub
Actions"); its base is `cc2004b^1` = `07bdc66`. Its diff is 44 files. Every one of the five
capabilities it touches resolves `linked`, and the reachable approved contract for the CI and
schema surfaces is `contract-ci-gate-spec-tool-5039` — the contract PR #4 exists to implement,
already covered by `evidence-ci-gate-spec-tool-693d`. The diff is therefore the implementation of
its own approved contract, which is the definition of not-drift: the observable behaviour it
changed IS represented in the linked contract. The holistic cross-capability pass found no
divergence either — the gate suite (CI, schema, tooling, tests, docs) landed coherently in one PR.

Packets, all `linked`: `capability-ci-enforcement-3e4f` (5 files),
`capability-spec-docs-8c1d` (1), `capability-spec-schema-2c3d` (3),
`capability-spec-tests-3a6e` (16), `capability-spec-tooling-1a2b` (6).

**Coverage holes, reported explicitly rather than folded into "no drift"** (per
`.claude/commands/detect-drift.md` step 4) — 13 `uncovered` paths:
`eslint.config.js` and `pnpm-lock.yaml`, owned by no capability; plus eleven
`specs/{nodes,graph,indexes}/**` files, which are the recorded intentionally-unowned set of
`decision-graph-data-unowned-2f7b` and are not a gap. The two root files are pre-existing and are
the same unowned set this brief already recorded as a coverage observation taken by no lane.

**RECIPE DEVIATION, recorded not absorbed.** The brief pinned a worktree overlay — `git worktree
add <dir> cc2004b`, copy the current `specs/` in, run `spec:drift-map` from there. That was not
used, because `buildDriftMap(spec, changed)` is directly callable and needs no worktree: the file
list came from `git diff --name-only cc2004b^1 cc2004b` (a commit-to-commit diff, so working-tree
state is irrelevant) and was mapped against the CURRENT loaded spec. Same two inputs the recipe
constructs, same result, fewer moving parts. A re-run is reproducible from the two shas plus that
one call.

**HONEST BOUND.** This is a judgement about a 2026-06-13 diff mapped against a capability set
seeded one PR later (contract Risk 6). Pinning the run order — last, after 14.1 and 14.2 — makes a
re-run comparable; it does not make the verdict time-invariant. Verified alongside it: PR #4's diff
touches none of the paths 14.2 added, so 14.2's widening is immaterial to this particular verdict.

## Verification observed

- `node_modules/.bin/tsx tools/spec.ts validate` → **OK, 20 rules, 0 errors.** The rule count is
  UNCHANGED, which is the check that this lane added no validation rule (contract Out of scope 1
  forbids one for `owner`).
- `node_modules/.bin/tsc --noEmit` → exit 0.
- `node --test --import tsx tests/*.test.ts` → **287 pass, 0 fail** on the post-change tree.
- `grep` for any lane name in `specs/schema/node-types.yaml` → **zero hits** (the pointer landed).
- `spec:index` run twice → byte-identical; `specs/schema/*.yaml` is not indexed, so the schema half
  produced no index delta.
- Negative controls were run for the rules this lane's data engages, in a throwaway copy, so a
  green run is not mistaken for a vacuous one: `nodes-id-unique`, `nodes-required-fields`,
  `nodes-status-in-enum`, `nodes-class-in-range`, `edges-endpoint-types`,
  `edges-references-resolve` and `capability-paths-shape` each fired on exactly the artifact they
  should when deliberately broken.

## Self-application (contract Acceptance 7)

This lane's diff touches `specs/schema/node-types.yaml`, and `specs/schema/**` is the sole
`sensitive_paths` glob and a CODEOWNERS-gated path. `spec:check-diff` passes only when the PR adds
an `evidences` edge whose evidence carries `touches → capability-spec-schema-2c3d` and whose brief
`decomposes` an `approved` contract. This evidence and that edge are what clear it;
`contract-conveyor-derived-4c8c` is already `approved`, so the third leg holds. A13's correction
applies to the contract's Acceptance-7 wording: read "the schema lane" as **`data-migration`** —
`brief-lane-valid` rejects `schema` as a lane value.

## Deviations and residuals

1. **`created` dates are `2026-07-29`, not the brief's pinned `2026-07-28`.** The work ran a day
   later; nodes carry their true creation date, and no rule keys on these (both dated cutoffs are
   `2026-06-18`). Recorded rather than absorbed, per rule 5.
2. **A fifth node beyond the brief's enumerated four.**
   `intent-implement-brief-graph-lane-b3f5` records that `/implement-brief` performs no graph
   writes and delegates to no agent while graph-maintainer is the sole graph writer, so a lane
   whose deliverable IS graph data cannot be implemented under that constraint. Human-authorized
   under rule 5's second branch during implementation. The brief's conditional `drift-finding` was
   not created, because 14.3 found no drift.
3. **The lane was split across two commands.** `/implement-brief` did the schema file;
   `/update-spec-graph` did the graph data via graph-maintainer. Neither command could do both:
   `/implement-brief` performs no graph writes, and graph-maintainer is the sole writer of
   `specs/nodes/` and `specs/graph/edges.yaml`. That split is the subject of residual 2's intent.
4. **`.gitattributes` is owned by no capability.** Created by the `product-spec` lane under CC-16,
   and `decision-gitignore-unowned-6b3d` scopes itself to `.gitignore` only. A real coverage gap,
   surfaced for integration; both remedies are graph-data edits, so a follow-up rather than a
   silent widening here.

## Discharge key (CC-10(d))

This brief is the named discharger for **CC-9** (the `owner` field; its live-graph leg is
`test-verification`'s), **CC-13** (the single "live intent" definition; its lifecycle-map half is
`docs-spec`'s) and **A13**'s lane-name correction naming `data-migration` as the catalog lane.
