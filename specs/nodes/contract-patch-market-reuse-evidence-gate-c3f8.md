---
id: contract-patch-market-reuse-evidence-gate-c3f8
type: contract
title: Lane-aware patch market — fold the multi-patch merge gate into the existing pr-evidence/spec:gate path (no new workflow; maximal reuse; deviates from the intent's literal patch-comparison.yml)
status: candidate
created: 2026-06-24
class: 3
---

This intent (`intent-patch-market-synthesis-3b1e`, class 3) is multi-surface — schema,
validator, four commands, `CLAUDE.md`, and CI. It is a **Class 3** change, so this market
carries three candidate contracts (this is candidate **C** of three). All three share an
identical common core and differ on one axis: **where the multi-patch merge gate lives.**
Candidate **C** does **not** add a new gate or workflow at all — it **folds the
multi-patch requirement into the existing `spec:gate`/`pr-evidence` merge gate** that
already runs on every code PR. This is the maximal-reuse candidate; it deliberately
**deviates from the intent's literal "New workflow patch-comparison.yml"** and owns that
gap honestly, the way Phase-7's `registry-driven` candidate openly did not create the nine
named critic files the intent enumerated.

## Problem interpretation

The patch market itself (per-lane candidate patches → one `comparison` → human
`/select-patch`; within-lane synthesis via `synthesizes`; cross-lane combination is
integration; judged in lane isolation) is **identical in all three candidates**, as is the
irreducible common core — the same as candidate A
(`contract-patch-market-validate-authoritative-9d41`); see its Problem interpretation for
the full text. Restated in brief:

- **Schema (`node-types.yaml`).** New `patch` node (`required_fields [id, type, title,
  status, branch, strategy, created]`, `status_values [candidate, selected, superseded]`,
  `requires_body: true`); optional boolean `patch_market` flag on `brief`.
- **Schema (`edge-types.yaml`).** New `competes-for` (`patch → brief`) and `synthesizes`
  (`patch → patch`); widen `compares.target`/`selects.target` to `[contract, patch]` (list
  targets already supported by `edge_endpoint_types`; the intent's "`selects` already
  allows decision → patch" is inaccurate — widening it is in-scope work).
- **Commands (`.claude/commands/`).** `/propose-patches`, `/compare-patches`,
  `/synthesize-patches`, `/select-patch` with exactly the intent's behaviours, carrying the
  Phase-6 scope-integrity rules into patch review.
- **CLAUDE.md.** Per-lane patch-market prose; the by-class row; within-lane synthesis vs
  across-lane integration; scope-integrity in patch review.
- **Two intent-mandated `spec:validate` extensions (structural).** `synthesis_parentage`
  (≥2 `synthesizes` edges) and selected-patch comparison coverage — pure `Finding[]`
  handlers after `edges-references-resolve`, counting only non-superseded competitors.

What distinguishes **candidate C**: the **merge gate** is implemented by **extending the
existing `tools/gate.ts` (`evaluateGate`)** — the gate behind `pr-evidence.yml` that
already blocks every code PR lacking evidence-or-override — with one additional clause: if
the PR implements a brief that has >1 live `competes-for` edge, the gate **also** requires
a `comparison` covering those patches plus a `selects` decision, else it fails. Override is
**already wired**: the existing `override` + `waives → pr-evidence` path suppresses the
whole gate, the new clause included. **No `patch-comparison.yml`, no new named check, no
new subcommand** — one merge gate enforces both evidence-or-override and patch-comparison.

## Scope

- **Common core** — schema, four commands, CLAUDE.md, the two structural validate rules
  (identical to candidates A and B).
- **`tools/gate.ts` (extend `evaluateGate`)** — add the multi-patch clause: derive the
  brief the PR implements (graph-first via the `patch` node whose `branch` == head →
  `competes-for` brief; branch-name fallback); if that brief has >1 live `competes-for`
  edge, require a `comparison` covering them + a `selects` in the added/live graph. The
  clause reuses the existing `gitdiff.ts` helpers, the `override`/`waives → pr-evidence`
  suppression, and `toDateString` already in the module.
- **`tools/validator.ts` + `tools/handlers/*` + `validation-rules.yaml`** — only the two
  structural rules.
- **`CLAUDE.md`** — additionally documents that the multi-patch merge gate is enforced by
  the existing `pr-evidence` check (not a separate workflow), so a reader is not left
  expecting a `patch-comparison.yml`.
- **No new workflow file; no `checks.yaml` change** (reuses `pr-evidence`).
- **Capability ownership, this PR** — per the Phase-8 capability-wiring flow.

## Non-scope

- **No `patch-comparison.yml` workflow and no `patch-comparison` named check.** This is C's
  defining choice and the source of its literal-fidelity gap (below); candidates A and B
  both create the named workflow.
- **No merge-gate logic in `spec:validate`** (candidate A's mechanism, not adopted).
- **No PR-state tracking in the graph;** no across-lane synthesis; no auto-selection; no
  release/`includes` work.

## Trade-offs

- **+** Maximal reuse — **one** merge gate (`pr-evidence`) enforces evidence-or-override
  **and** patch-comparison; zero new workflow files; smallest CI surface of the three.
- **+** Override support is **already there** — `waives → pr-evidence` suppresses the new
  clause with no new check, no new wiring.
- **+** No PR→brief-mapping code beyond what the gate already does to find the implemented
  brief; the new logic is a small clause in a module that already maps PRs to the graph.
- **−** **Deviates from the intent's literal "New workflow patch-comparison.yml"** and from
  acceptance criterion 3's wording ("blocked by `patch-comparison.yml`"). The merge IS
  blocked — by `pr-evidence`, not by a file of that name. This is a real literal-fidelity
  gap (the Phase-7 `registry-driven` archetype), stated upfront and owned, not hidden. The
  reviewer must decide whether the intent's value ("a multi-patch PR without comparison
  cannot merge") is met by *the merge being blocked* or specifically by *a workflow named
  patch-comparison.yml*.
- **−** **Overloads `pr-evidence`'s single responsibility** — it now gates two distinct
  concerns (evidence provenance AND patch-market resolution); a future reader of one gate
  must know it enforces both, and a `waives → pr-evidence` override now waives **both** at
  once (coarser than a dedicated `patch-comparison` waiver).
- **−** **Coverage hole:** `pr-evidence.yml` skips specs-only PRs (it runs only when code
  changes exist). A patch-proposal step that lands only graph nodes (no code) would not hit
  the gate. **Owned** in Risks with a mitigation, but it is a genuine gap A (a validate
  rule, always run) and B (a dedicated always-on workflow) do not have.

## Risks

- **Specs-only-PR bypass (C's defining risk).** A PR that adds patch nodes/edges but no
  code skips `pr-evidence`, so the multi-patch clause never runs. **Mitigation:** the
  winner's branch always carries the implementation (code), so the *merge that matters* —
  the one bringing the chosen patch's code to main — does hit the gate; document that
  graph-only PRs are not the gated artifact. The reviewer should weigh whether that
  reasoning is airtight.
- **Overloaded override.** `waives → pr-evidence` now waives patch-comparison too.
  **Mitigation:** document the coarser semantics; if finer control is later needed, this is
  the upgrade path to candidate B's dedicated check.
- **Status-blind competitor count (the recurring trap).** **Mitigation:** count only
  non-superseded patches as competitors in both the gate clause and the structural rules;
  share one helper; test parity.
- **PR→brief mapping inside the gate.** **Mitigation:** graph-first mapping with
  branch-name fallback, fail-closed on no match; unit-test all three paths.

## Acceptance examples

1. **(Two real candidate patches → compare → select, fully traced.)** As in all candidates:
   propose two patches, `/compare-patches` writes one `comparison` with `compares` edges to
   both, `/select-patch <winner>` records the `decision` + `selects`, loser superseded;
   chain fully walkable.
2. **(Multi-patch brief whose impl PR skips comparison is blocked.)** The winner's
   implementation PR for a brief with two live `competes-for` edges and **no**
   `comparison`/`selects` makes `spec:gate` (the `pr-evidence` check) **exit non-zero**.
   Recording the `comparison` + `selects` makes it pass. The merge is blocked — by
   `pr-evidence`, satisfying the intent's *spirit*; C explicitly does **not** provide a
   workflow literally named `patch-comparison.yml` (its owned deviation).
3. **(Override.)** An added `override` + `waives → pr-evidence` (non-expired) makes the
   gate pass with the market unresolved; this simultaneously waives the evidence clause —
   the owned coarser semantics.
4. **(`spec:validate` stays green mid-market.)** While the market is open, `spec:validate`
   is green (only the structural rules exist there); the merge gate is the existing
   `pr-evidence` check.
5. **(Synthesis.)** As in all candidates: a synthesis `patch` on
   `patch/<brief-slug>/synthesis` with `synthesizes` edges to its two parents and a
   `competes-for` to the same brief; selecting it supersedes the parents; one
   `synthesizes` edge fails `synthesis_parentage`.

## Verification needs

- **`node --test`** over the extended `evaluateGate`: (a) PR for a >1-competitor brief with
  no comparison/selects → fail; with both → pass; (b) PR for a single-competitor brief →
  pass unaffected; (c) evidence-or-override base behaviour unchanged for non-patch PRs (no
  regression); (d) `waives → pr-evidence` suppresses both clauses, expired does not; (e)
  PR→brief mapping graph-first / branch fallback / no-match fail-closed.
- **`node --test`** over the two structural handlers (synthesis ≥2 parents; selected-patch
  comparison coverage; superseded competitor excluded; unresolved endpoint skipped).
- **Regression check:** the existing `pr-evidence` acceptance fixtures still pass with the
  added clause (no false fails on ordinary evidence-bearing PRs).
- **Real-tree checks:** `spec:validate` green on the post-migration graph; `spec:gate`
  exercised against a synthetic patch-market diff.
- **Schema-for-free:** `patch.status` enum, `competes-for`/`synthesizes` endpoints, and
  `compares`/`selects` to a `patch` (now valid) enforced by existing handlers.
- **CI:** no new workflow; `pr-evidence.yml` carries the gate; mutating steps end with
  `… index && … validate` and never commit on red.
