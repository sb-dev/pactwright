---
id: evidence-work-class-routing-f0a3
type: evidence
title: Work-class routing implemented — validation green, tests pass
status: final
created: 2026-06-17
---
Evidences `brief-work-class-routing-9a1c`, which decomposes
`contract-work-class-validate-invariant-c3d4` (approved) for intent
`intent-work-class-routing-b9c4`. The implementation landed in commit `d6f0688`
("spec: implement work-class routing — class field, validation rules, backfill");
this node records that it satisfies the brief, with the verification below.

## What landed — code

- `tools/handlers/class_range.ts` — integer-aware range handler (skips absent;
  rejects strings, non-integral, and out-of-range; `2` and `2.0` both pass).
- `tools/handlers/class_market_quorum.ts` — market-quorum invariant (live =
  non-superseded `proposes` source; explicit no-proposes finding; per-intent;
  defensive `nodesById` skip). Both registered in `tools/validator.ts` `HANDLERS`.
- `specs/schema/validation-rules.yaml` — `nodes-class-in-range` (after
  `nodes-status-in-enum`) and `class-market-quorum` (after `edges-references-resolve`,
  before `indexes-fresh`).
- `specs/schema/node-types.yaml` — `class` added to `required_fields` for `intent`
  and `contract`; `produced_by` added nowhere (optional, unvalidated by omission).
- `CLAUDE.md` — Work-class routing table (Class 0–3) after `## Lifecycle`;
  Scope-integrity as Rule 5; honest "cannot stand in a green graph / cannot merge"
  framing; `produced_by` note.
- `.claude/commands/{capture-intent,propose-contracts,write-brief,approve-contract}.md`
  — class-aware (capture sets/asks class; propose emits 1 for class 0–1 and ≥2 for
  class 2–3; write-brief reads class; approve-contract preventive pre-check).
- `tests/class_range.test.ts`, `tests/class_market_quorum.test.ts` — 16 unit tests.

## What landed — graph

- All 22 existing intent/contract nodes backfilled with `class` (default 2;
  smoke-test intents 0; `intent-work-class-routing-b9c4` and
  `contract-work-class-validate-invariant-c3d4` 3).

## Verification (run 2026-06-17, on the committed tree)

- `pnpm spec:validate` → `OK — 13 rules, 0 errors` (the whole graph, not just the
  new nodes).
- `pnpm test` → 77 tests, 77 pass, 0 fail (16 new across the two handler test files).
- `pnpm typecheck` (`tsc --noEmit`) → clean.
- `pnpm lint` (`eslint .`) → clean.

## Maps to the brief's acceptance criteria

1. An intent without `class` is rejected by `nodes-required-fields` (class is now
   required on intent/contract). ✓
2. A class-0 intent runs with one contract and one brief, no market;
   `class-market-quorum` never fires for class < 2. ✓
3. A class-3 intent with < 2 live candidates fails `class-market-quorum`;
   `/propose-contracts` and `/approve-contract` refuse up front. Unit-tested:
   boundary 1 (finding) vs 2 (pass); superseded source excluded; no-proposes
   finding; per-intent counting. ✓
4. `class: 2` and `class: 2.0` pass; `class: "2"`, `2.5`, `4` fail
   `nodes-class-in-range`. Unit-tested. ✓
5. Post-backfill `pnpm spec:validate` is green over all 22 backfilled nodes and all
   5 `selects` edges (live-candidate counts 2 / 2 / 3 / 3 / 3). ✓
6. `produced_by` set, empty, or absent all pass — no rule references it. ✓
