---
id: evidence-patch-market-schema-1d2e
type: evidence
title: Patch-market schema migration landed (data-migration lane)
status: final
created: 2026-06-25
produced_by: "/prepare-evidence"
---

Evidence that `brief-patch-market-schema-a4d1` (the `data-migration` lane of `contract-patch-market-ci-gate-6b7e`, proposing `intent-patch-market-synthesis-3b1e`) is implemented.

## What landed (code & project files)
- `specs/schema/node-types.yaml` — new `patch` node type (required `[id, type, title, status, branch, strategy, created]`, status `candidate|selected|superseded`, requires_body); documented the optional `patch_market` boolean flag on `brief`.
- `specs/schema/edge-types.yaml` — new `competes-for` (patch→brief) and `synthesizes` (patch→patch); widened `compares.target` and `selects.target` to `[contract, patch]`.
- `specs/schema/checks.yaml` — registered the `patch-comparison` named check.
- Committed as `8becd1b`.

## Verification (run 2026-06-25)
- `node_modules/.bin/tsx tools/spec.ts validate` → OK, 20 rules, 0 errors. The new types add no findings (the live graph has no patch instances yet).
- The widened union targets are enforced for free by the existing `edge_endpoint_types` handler (the `flags` edge's `[evidence, capability]` is the list-target precedent); the existing `selects`/`compares` edges (→ contract) still pass.

## Touches
- `capability-spec-schema-2c3d` (owns `specs/schema/**`, a sensitive path — the owning capability for this change).

## Honest bound
This evidence asserts the schema migration is well-formed and green; the patch-market behaviour it enables is exercised by the domain-backend and test-verification lanes. Cross-lane combination is the contract's final `integration` node (`/integrate`), not this evidence.
