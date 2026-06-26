---
id: brief-patch-market-schema-a4d1
type: brief
title: Patch-market schema migration — patch node, competes-for/synthesizes edges, widened compares/selects targets, patch_market brief flag, patch-comparison check
status: implemented
created: 2026-06-24
lane: data-migration
produced_by: "/decompose-lanes"
---
This brief decomposes `contract-patch-market-ci-gate-6b7e` (status: approved, class 3) for the 'data-migration' lane of `intent-patch-market-synthesis-3b1e`, per decision `decision-patch-market-ci-gate-8a2f`. This lane owns the schema migration ONLY: it adds the `patch` node type, the `competes-for` and `synthesizes` edge types, widens `compares`/`selects` to also target `patch`, documents the optional `patch_market` flag on `brief`, and registers the `patch-comparison` named check — every other surface (the gate code, the commands, the workflow, CLAUDE.md, the tests) belongs to a different lane.

## Grounding (reuse, don't reinvent)

All paths absolute under `/home/samir/workspace/pactwright/`. Line numbers are current-tree anchors; re-confirm before editing, since earlier edits in the same file shift them.

- **`specs/schema/node-types.yaml`** — the node-type registry. The `comparison` block (lines 64-72) is the precedent for a status-less, class-less type (it carries NO `status_values` and NO `class`). The `evidence`/`integration` blocks (lines 32-35, 74-84) are the precedent for a tri/dual-value `status_values` enum. The `brief` block (lines 22-31) ALREADY documents its optional `lane` enum as a frontmatter COMMENT (not in `required_fields`), validated by the separate `brief-lane-valid` rule — this is the exact precedent for documenting the new optional `patch_market` boolean flag the same way (comment only, never in `required_fields`).
- **`specs/schema/edge-types.yaml`** — the edge-type registry. The `proposes` block (lines 9-11) is the two-line `source:`/`target:` shape to mirror for `competes-for`. The `supersedes` block (lines 25-28) shows a `target: same_as_source` self-typed edge, but `synthesizes` is `patch → patch` with a concrete type, so mirror the plain `proposes` shape with `source: patch`, `target: patch`. **The `flags` block (lines 48-52) is the load-bearing list-target precedent: `target: [evidence, capability]`** — proving `edge_endpoint_types` already validates a LIST target against `node_types` keys with NO handler change, exactly what widening `compares.target` and `selects.target` to `[contract, patch]` needs.
- **`specs/schema/validation-rules.yaml`** — `nodes-status-in-enum` (lines 30-33) is the generic `enum_constraint` on `status` that constrains every status-bearing type to its declared `status_values` FOR FREE; once `patch` declares `status_values: [candidate, selected, superseded]`, `patch.status` is constrained with no rule change. `edges-endpoint-types` (lines 45-46) is the generic `edge_endpoint_types` rule that covers the new edges and the widened list targets for free. `brief-lane-valid` (lines 88-97) is the `closed_key_set` `mode: member` precedent for an optional `brief` enum — the `patch_market` flag is a boolean, not an enum, so it earns NO new rule (it is not in `required_fields`, and `enum_constraint`/`closed_key_set` do not validate booleans), exactly as the comment-only `lane` documentation pattern allows.
- **`specs/schema/checks.yaml`** — a flat list of check ids (lines 8-15: `ci, spec-index, spec-validate, pr-evidence, check-diff, drift`). The header (lines 1-7) states this is "the single registry of check identifiers: `references_resolve` treats a `waives` target listed here as resolved." Adding the literal `patch-comparison` line here is the entire deliverable that makes a `waives → patch-comparison` override edge resolve (without it the override edge would red `edges-references-resolve`).

## Pinned decisions (the grafts/fixes THIS lane carries)

- **Graft C (dedicated waiver target).** This lane authors the `patch-comparison` entry in `checks.yaml` so the gate's override (`waives → patch-comparison`, authored later by domain-backend/observability-release) resolves and is NEVER overloaded onto `pr-evidence`. This lane only registers the check name; it writes no gate code and no workflow.
- **The intent's "selects already allows decision → patch" claim is INACCURATE and this widening is the in-scope work.** Today `edge-types.yaml` lines 13-15 declare `selects` as `source: decision`, `target: contract` ONLY. Widening `target` to `[contract, patch]` is real, in-scope schema work — not a no-op and not a scope change.
- **Migration safety — widening must not red existing edges.** Widening `compares.target` and `selects.target` to `[contract, patch]` is purely additive: every existing `compares` and `selects` edge points at a `contract`, which stays in the allowed list, so `edges-endpoint-types` cannot newly red any live edge. No live `competes-for`, `synthesizes`, or `selects → patch` / `compares → patch` edge exists yet (no `patch` node exists), so the new types and widened targets add capacity without invalidating any current edge. State this explicitly in the PR.
- **Schema-for-free coverage (no handler change in this lane).** `nodes-status-in-enum` constrains `patch.status` to `[candidate, selected, superseded]`; `edge_endpoint_types` handles the new `competes-for`/`synthesizes` endpoints AND the widened list targets via the `flags` list-target precedent. This lane touches NO file under `tools/` — the Fix-1 type-guard of `intentsForContract` callers (which the widened `selects → patch` target makes necessary) is the domain-backend lane's work, NOT this lane's.

## Files to modify

This lane creates NO new files. It modifies exactly three schema files:

1. `/home/samir/workspace/pactwright/specs/schema/node-types.yaml` — add the `patch` node type; extend the `brief` comment to document the optional `patch_market` flag.
2. `/home/samir/workspace/pactwright/specs/schema/edge-types.yaml` — add `competes-for` and `synthesizes`; widen `compares.target` and `selects.target` to `[contract, patch]`.
3. `/home/samir/workspace/pactwright/specs/schema/checks.yaml` — add the `patch-comparison` check entry.

It also REGENERATES (never hand-edits) `/home/samir/workspace/pactwright/specs/indexes/*.yaml` via `spec:index` in the same commit so `indexes-fresh` stays green (no `patch` nodes or new edges are authored by THIS lane, so the indexes regenerate with no new entries — the schema files are not indexed; this run keeps the committed indexes byte-identical).

## Ordered implementation steps

These three schema edits are mutually independent in content but share one validation pass; commit them together so `edges-endpoint-types` (which checks edge `source`/`target` against `node_types` keys) never sees a `competes-for`/`synthesizes` edge type whose `patch` source/target node type is not yet declared. Note: no edge of the new types exists in the tree, so there is no ordering HARD dependency within this lane's own files, but landing them atomically is the safe convention (mirrors the comparison-lane Lane-A atomic-commit discipline).

1. **`node-types.yaml` — add the `patch` node type.** Under the `node_types:` map key (line 11), add a sibling block, modelled on the `evidence` status enum (lines 32-35) and `comparison`'s comment style (lines 64-72):
   ```yaml
   patch:
     # A candidate implementation of one lane brief in the patch market. Carries the
     # git `branch` it lives on and the `strategy` it embodies; competes for a brief
     # via `competes-for`, may be a `synthesizes` child of two prior patches. Selected
     # by a decision's `selects` edge (winner -> selected, losers -> superseded).
     required_fields: [id, type, title, status, branch, strategy, created]
     requires_body:   true
     status_values:   [candidate, selected, superseded]
   ```
   `nodes-required-fields` then proves `branch`/`strategy` presence and `nodes-status-in-enum` constrains `status` to the three values — both for free, no rule change.
2. **`node-types.yaml` — document the optional `patch_market` flag on `brief`.** Extend the existing `brief` comment (lines 22-27, which already documents the optional `lane` enum) with one parallel sentence, e.g.:
   ```yaml
     # Optional boolean `patch_market` flag: when true the brief runs a patch market
     # (multiple candidate patches compared and selected). Unset means no market and
     # is allowed; like `lane`, it is NOT in required_fields and carries no enum rule.
   ```
   Do NOT add `patch_market` to `required_fields` and do NOT author a validation rule for it (it is a free boolean, matching the comment-only `lane`-documentation precedent; `enum_constraint`/`closed_key_set` do not validate booleans).
3. **`edge-types.yaml` — add `competes-for`.** Under `edge_types:` (line 8), add a block mirroring the `proposes` two-line shape (lines 9-11):
   ```yaml
   competes-for:
     # patch -> brief. A candidate patch competes to implement one lane brief; a
     # multi-patch brief (>1 live competes-for) requires a comparison + selection
     # before its winner's code merges (the patch-comparison CI gate).
     source: patch
     target: brief
   ```
4. **`edge-types.yaml` — add `synthesizes`.** Add a block (a `patch → patch` edge; mirror the plain `source:`/`target:` shape, NOT `same_as_source`):
   ```yaml
   synthesizes:
     # patch -> patch. A synthesis patch combines >=2 prior candidate patches; it
     # competes for the SAME lane brief and supersedes its parents when selected.
     source: patch
     target: patch
   ```
5. **`edge-types.yaml` — widen `compares.target`.** Change the `compares` block (lines 37-42) `target: contract` to a list, citing the `flags` precedent:
   ```yaml
   compares:
     # comparison -> contract | patch. /review-contracts compares candidate contracts;
     # /compare-patches compares candidate patches. List target, like `flags`.
     source: comparison
     target: [contract, patch]
   ```
6. **`edge-types.yaml` — widen `selects.target`.** Change the `selects` block (lines 13-15) `target: contract` to `target: [contract, patch]`:
   ```yaml
   selects:
     # decision -> contract | patch. A decision selects the winning contract
     # (/approve-contract) OR the winning patch (/select-patch). List target, like
     # `flags`. (Today decision -> contract only; the patch widening is new work.)
     source: decision
     target: [contract, patch]
   ```
7. **`checks.yaml` — register the `patch-comparison` check.** Add one line to the flat `checks:` list (after line 13's `check-diff`, before/after `drift` — order is immaterial, it is a set):
   ```yaml
     - patch-comparison
   ```
   Add a brief comment noting it is the dedicated patch-market merge-gate check (Graft C), waivable via `waives → patch-comparison`, mirroring the `pr-evidence`/`check-diff` entries.
8. **Regenerate indexes + validate, SAME commit.** Run `node_modules/.bin/tsx tools/spec.ts index` then `node_modules/.bin/tsx tools/spec.ts validate` (canonical instruction `pnpm spec:index && pnpm spec:validate`; `pnpm`/corepack are broken in this PRoot env per the toolchain memory). The validate run must be GREEN: the additive node/edge types introduce no new findings (no nodes/edges of the new types exist), and the widened list targets cannot red any existing `compares`/`selects` edge (all currently target a `contract`, still allowed). Do NOT commit on any red.

## Non-scope (explicitly the OTHER lanes' files/work)

Per the six-lane boundary map (no two lanes edit the same file):

- **domain-backend lane** — `tools/**` (`tools/patch_gate.ts` with the pure `evaluatePatchGate(input)`, the two new structural-rule handlers, the shared live-competitor predicate, `tools/spec.ts`, `tools/validator.ts`, `package.json`) AND `specs/schema/validation-rules.yaml` (rule DECLARATIONS only). Carries panel **Fix 1** (type-guard every `intentsForContract` caller to `type === "contract"` — required BECAUSE this lane widens `selects.target`, but the guard itself is code this lane does not touch), **Fix 2** (exclude `selected` as well as `superseded` from the live-competitor set), **Fix 3** (graph-first PR→brief mapping with a fail-closed default), and Grafts A + C's gate core. OUT of scope here.
- **api-integration lane** — `.claude/commands/{propose-patches,compare-patches,synthesize-patches,select-patch}.md` ONLY; carries **Fix 4** (closing status-report contract on all four commands). OUT of scope here. (This lane authors the `patch` nodes and `competes-for`/`synthesizes`/`compares`/`selects` EDGES the schema here permits — but the EDGE DATA is theirs; only the schema that allows them is this lane's.)
- **observability-release lane** — `.github/workflows/patch-comparison.yml` + branch-protection wiring docs ONLY; carries **Fix 5** (document branch-protection / required-check wiring) and Graft C's fire-on-code-merge. The WORKFLOW that runs the gate against the `patch-comparison` check this lane registers is theirs, not ours. OUT of scope here.
- **docs-spec lane** — `CLAUDE.md` ONLY (governance prose: the per-lane patch-market doctrine, the by-class row, within-lane synthesis vs across-lane integration). OUT of scope here.
- **test-verification lane** — `tests/**` ONLY, owned by `test-writer` via `/write-tests` (NEVER the domain-backend invocation); carries the Fix 2 / Fix 3 test coverage. This lane writes NO test of the schema migration; the schema-for-free behaviour (`patch.status` enum, new-edge endpoints, widened list targets) is exercised by that lane's real-tree / fixture checks.
- Also explicitly out of scope for THIS lane: NO `tools/` handler change (the for-free coverage means none is needed), NO `validation-rules.yaml` edit (no new rule — the existing generic rules cover everything; `validation-rules.yaml` rule declarations are the domain-backend lane's), NO `patch_market`-flag validation rule, NO authoring of any `patch` node or any `competes-for`/`synthesizes`/`compares → patch`/`selects → patch` edge (that is graph DATA, authored by the commands the api-integration lane writes).

## Cross-lane dependencies & integration expectation

- **This lane is depended on by:** domain-backend (its `evaluatePatchGate` and the two structural handlers read `patch` nodes, `competes-for` edges, and the widened `selects` targets — they require this lane's schema to exist), api-integration (its four commands author `patch` nodes and the new edges — schema must accept them), and observability-release (its workflow references the `patch-comparison` check this lane registers). Practically, this lane's schema is the foundation; the other implementation lanes' real-tree validation passes assume it has landed.
- **This lane depends on:** nothing in the other lanes for its own green validate — the schema edits stand alone (no node/edge DATA of the new shapes need exist for `spec:validate` to pass on the post-migration tree).
- **Integration expectation (restated).** This laned brief reaches `implemented` via this lane's own final `evidence` (an `evidences` edge from a final evidence to this brief), while `intent-patch-market-synthesis-3b1e` stays `open`. The contract `contract-patch-market-ci-gate-6b7e` completes only via a final `integration` node (authored by `/integrate`) that `integrates` a final evidence for EVERY live lane — enforced by the `coverage-coherence` rule (a multi-brief contract cannot mark its intent `addressed` until that final integration covers every live lane). An intent reaches `addressed` only through that integration, never through this single lane's evidence. If a lane collapses (its work proves unnecessary), it is SUPERSEDED per CLAUDE.md rule 3 (`supersedes` edge, status → terminal), never forced into a ceremonial integration.

## Acceptance & verification (scoped to this lane)

Maps to the contract's Acceptance examples and Verification needs, restricted to the schema surface this lane owns (the test-verification lane owns the actual test CODE; this implementation lane states what its slice must satisfy):

1. **Schema-for-free, green (contract Verification "Schema-for-free", lines 166-167).** After this lane's migration commit, `spec:validate` is GREEN on the real tree. `patch` appears in `node-types.yaml` with `required_fields [id, type, title, status, branch, strategy, created]`, `status_values [candidate, selected, superseded]`, `requires_body: true`; `competes-for` (`patch → brief`) and `synthesizes` (`patch → patch`) appear in `edge-types.yaml`; `compares.target` and `selects.target` are `[contract, patch]`; `patch-comparison` appears in `checks.yaml`; `brief`'s comment documents the optional `patch_market` flag.
2. **Migration is non-breaking (this lane's pinned migration-safety claim).** Confirm via the real `spec:validate` that widening `compares`/`selects` targets reds NO existing edge — every live `compares`/`selects` edge still resolves under `edge_endpoint_types` because `contract` remains in the allowed list (the list-target machinery is the `flags` precedent, exercised here without a handler change).
3. **The override target resolves (Graft C, contract Acceptance example 3, lines 146-147).** With `patch-comparison` registered in `checks.yaml`, a future `waives → patch-comparison` override edge (authored by another lane) resolves under `edges-references-resolve` (the registry treats a listed check name as resolved). This lane's deliverable is precisely that the literal `patch-comparison` exists in the registry so that edge is expressible in a green graph — the gate-side constant match (`spec:patch-gate` to the same literal) is the domain-backend lane's responsibility, kept byte-identical to this entry.
4. **Schema-for-free enforcement to confirm via the real CLI (not new tests — those are the test-verification lane's).** A `patch` node with a status outside `[candidate, selected, superseded]` reds `nodes-status-in-enum`; a `patch` node missing `branch` or `strategy` reds `nodes-required-fields`; a `competes-for` edge whose source is not a `patch` or whose target is not a `brief`, or a `selects`/`compares` edge to a node type outside its (now-widened) allowed list, reds `edges-endpoint-types` — all confirm-do-not-reimplement (this lane adds no handler).
5. **CI / mutation discipline (contract Verification "CI", lines 168-169).** The mutating step ends with `pnpm spec:index && pnpm spec:validate` (env form `node_modules/.bin/tsx tools/spec.ts index` then `... validate`) and must NOT commit on red.

Edge for graph-maintainer to record for this brief node: `brief —decomposes→ contract-patch-market-ci-gate-6b7e` (the `decomposes` edge), with this brief carrying `lane: data-migration`. Per CLAUDE.md, the mutating step that records it ends with `pnpm spec:index && pnpm spec:validate` (env form `node_modules/.bin/tsx tools/spec.ts index && node_modules/.bin/tsx tools/spec.ts validate`) and must not commit on failure.