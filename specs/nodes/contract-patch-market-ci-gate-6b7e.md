---
id: contract-patch-market-ci-gate-6b7e
type: contract
title: Lane-aware patch market — dedicated diff-aware CI gate (new spec:patch-gate + patch-comparison.yml + patch-comparison named check, mirroring pr-evidence; validate stays pure)
status: candidate
created: 2026-06-24
class: 3
---

This intent (`intent-patch-market-synthesis-3b1e`, class 3) is multi-surface — schema,
validator, four commands, `CLAUDE.md`, and CI. It is a **Class 3** change, so this market
carries three candidate contracts (this is candidate **B** of three). All three share an
identical common core and differ on one axis: **where the multi-patch merge gate lives.**
Candidate **B** realises that gate as a **new diff-aware subcommand** `spec:patch-gate`
(modelled on `tools/gate.ts`/`tools/checkdiff.ts`) consumed by a dedicated
`patch-comparison.yml` workflow, overridable through the existing `override` + `waives`
mechanism — the most literal reading of the intent's "merging its implementation PR
requires … overridable via an override node." `spec:validate` stays pure (only the two
structural rules).

## Problem interpretation

The patch market the intent describes (per-lane candidate patches → one `comparison` →
human `/select-patch`; within-lane synthesis via `synthesizes` edges; cross-lane
combination is integration, never synthesis; judged in lane isolation) is **identical in
all three candidates.** So is the irreducible common core, which is the same as candidate
A (`contract-patch-market-validate-authoritative-9d41`); see its Problem interpretation
for the full text. Restated in brief:

- **Schema (`node-types.yaml`).** New `patch` node (`required_fields [id, type, title,
  status, branch, strategy, created]`, `status_values [candidate, selected, superseded]`,
  `requires_body: true`); optional boolean `patch_market` flag on `brief` (unset = no
  market, like the `lane` precedent).
- **Schema (`edge-types.yaml`).** New `competes-for` (`patch → brief`) and `synthesizes`
  (`patch → patch`); widen `compares.target` and `selects.target` to `[contract, patch]`.
  **No `edge_endpoint_types` change needed** — list targets are already supported (the
  `flags` edge uses `target: [evidence, capability]`). (The intent's "`selects` already
  allows decision → patch" is inaccurate; today it is `decision → contract` only — the
  widening is in-scope work, not a scope change.)
- **Commands (`.claude/commands/`).** `/propose-patches`, `/compare-patches`,
  `/synthesize-patches`, `/select-patch` with exactly the behaviours the intent specifies
  (branch `patch/<brief-slug>/<strategy>`, draft PRs, `patch` nodes + `competes-for`
  edges, `patch_market: true`; comparison scoring contract fit / scope control /
  simplicity / test quality / drift risk / rollback safety; synthesis on
  `patch/<brief-slug>/synthesis` competing for the SAME lane brief; selection supersedes
  losers + closes their PRs + keeps branches, winner → `/prepare-evidence`), carrying the
  Phase-6 scope-integrity rules into patch review.
- **CLAUDE.md.** Per-lane patch-market prose; the by-class row (0–1 single/no market, 2
  optional, 3 per lane); within-lane synthesis vs across-lane integration; scope-integrity
  in patch review.
- **Two intent-mandated `spec:validate` extensions (structural).** `synthesis_parentage`
  (a synthesis patch needs ≥2 `synthesizes` edges) and selected-patch comparison coverage
  (a `selects`-edged patch's brief must have a `comparison` covering its competing
  patches) — pure `Finding[]` handlers after `edges-references-resolve`, counting only
  non-superseded competitors.

What distinguishes **candidate B**: the **merge gate** is a **diff-aware
`spec:patch-gate` subcommand** in `tools/`, structured exactly like `tools/gate.ts`
(`evaluateGate`) and `tools/checkdiff.ts` (`evaluateCheckDiff`): given the PR base
(`$GATE_BASE`), it identifies the brief the PR implements — from the head branch
`patch/<brief-slug>/<strategy>` and/or the `patch` node whose `branch` equals the head —
counts that brief's **live** `competes-for` edges, and if >1 requires a `comparison`
covering them plus a `selects` decision in the graph; else it **fails the merge**. It is
overridable through the existing pattern: an added `override` + `waives → patch-comparison`
(a new entry in `specs/schema/checks.yaml`), with the same non-expired-`expires` check the
other gates use. A dedicated `patch-comparison.yml` workflow runs it on every PR.
`spec:validate` is untouched beyond the two structural rules — it stays diff-agnostic.

## Scope

- **Common core** — schema, four commands, CLAUDE.md, the two structural validate rules,
  as above (identical to candidates A and C).
- **`tools/patch_gate.ts` (new) + a `patch-gate` case in `tools/spec.ts` + a `spec:patch-gate`
  script** — a pure `evaluatePatchGate(input)` over an immutable input (added/changed ids,
  the PR head branch, the live graph, today), wrapped by a `runPatchGate()` that derives
  git state via the existing `gitdiff.ts` helpers (`addedNodeIds`, `changedFiles`,
  `resolveBase`) and the override-expiry helper (`toDateString`) reused from `gate.ts`. The
  PR→brief mapping is graph-first (the `patch` node whose `branch` == head → its
  `competes-for` brief), with the branch-name convention as the fallback.
- **`specs/schema/checks.yaml`** — add the `patch-comparison` named check.
- **`.github/workflows/patch-comparison.yml`** — runs `pnpm spec:patch-gate` with
  `GATE_BASE: ${{ github.event.pull_request.base.sha }}`, modelled on `pr-evidence.yml`;
  a required check that fails the PR when the gate fails.
- **`tools/validator.ts` + `tools/handlers/*` + `validation-rules.yaml`** — only the two
  structural rules; no third "resolved" rule (that is candidate A's mechanism).
- **Capability ownership, this PR** — per the Phase-8 capability-wiring flow.

## Non-scope

- **No merge-gate logic in `spec:validate`.** The gate is diff-aware CI, never a graph-state
  validate rule. This is B's defining choice and is candidate A's mechanism, not adopted.
- **No fold into `pr-evidence`.** B keeps a **separate** gate and workflow; reusing the
  existing `spec:gate` is candidate C's mechanism, not adopted.
- **No PR-state tracking in the graph;** no across-lane synthesis; no auto-selection; no
  release/`includes` work (as in all candidates).

## Trade-offs

- **+** Mirrors the established `pr-evidence`/`check-diff` pattern exactly: "block the
  merge PR" and "overridable via an override node" fall out for free from the existing
  gate + `waives` machinery — **the most literal reading of the intent.**
- **+** `spec:validate` stays diff- and override-agnostic — no architectural impurity; the
  two structural rules remain pure graph-shape checks.
- **+** WIP branches stay **green** in `spec:validate` mid-market; the merge gate is a
  separate concern that fires only on the PR actually being merged, with real PR context.
- **+** Reuses `gitdiff.ts` + `toDateString` + the `override`/`waives` path — the new
  surface is one gate module + one workflow + one checks entry.
- **−** Patch-market knowledge now lives in **two places** — `tools/patch_gate.ts` (the
  merge gate) and `tools/handlers/*` (the structural rules) — a drift surface (the same
  con Phase-6's `command-discipline` carried).
- **−** Needs a robust **PR→brief mapping**; a branch rename or a missing patch node could
  misidentify the brief. (Mitigated by graph-first mapping, but it is real complexity A
  does not have.)
- **−** Largest new **tool surface** of the three (new subcommand + module + workflow +
  named check), and the gate is testable only with synthetic diff inputs, not pure graph
  fixtures.

## Risks

- **PR→brief misidentification.** If `spec:patch-gate` can't map the PR to a brief, it must
  **fail closed** (treat as ungated only when there is provably ≤1 competitor), never
  silently pass. **Mitigation:** prefer the graph mapping (`patch.branch` == head →
  `competes-for` brief); fall back to branch-name parse; unit-test both and the
  no-match case.
- **Two-places drift.** The structural rules and the gate could diverge on "what counts as
  a live competitor." **Mitigation:** share one helper (counting non-superseded
  `competes-for` sources) between `patch_gate.ts` and the handlers; test parity.
- **Status-blind competitor count (the recurring trap).** **Mitigation:** count only
  non-superseded patches as competitors, in both the gate and the structural rules.
- **Override expiry / date parsing.** **Mitigation:** reuse `toDateString` and the
  `expires >= today` check verbatim from `gate.ts`; test an expired override does not
  suppress.

## Acceptance examples

1. **(Two real candidate patches → compare → select, fully traced.)** As in all candidates:
   `/propose-patches <brief> 2 strategyA,strategyB` → two `patch` nodes + `competes-for`
   edges; `/compare-patches` → one `comparison` with `compares` edges to both;
   `/select-patch <winner>` → a `decision` + `selects` edge, loser superseded; chain fully
   walkable.
2. **(Multi-patch brief whose PR skips comparison is blocked by `patch-comparison.yml`.)**
   A PR on `patch/<brief-slug>/winner` for a brief with two live `competes-for` edges and
   **no** `comparison`/`selects` makes `spec:patch-gate` **exit non-zero**, failing the
   `patch-comparison` required check. Recording the `comparison` + a `selects` makes the
   gate pass. This is the intent's headline acceptance, met by the literal named workflow.
3. **(Override.)** An added `override` + `waives → patch-comparison` (non-expired) makes
   the gate pass with the market still unresolved; an expired override does not.
4. **(`spec:validate` stays green mid-market.)** While the market is open (patches proposed,
   not yet compared), `spec:validate` is **green** — the structural rules don't fire, and
   the merge gate is not a validate rule. Only `patch-comparison.yml` blocks the merge.
5. **(Synthesis.)** `/synthesize-patches <brief> p1,p2 "<instruction>"` → a synthesis
   `patch` on `patch/<brief-slug>/synthesis` with `synthesizes` edges to p1,p2 and a
   `competes-for` to the same brief; selecting it supersedes p1,p2; a synthesis patch with
   one `synthesizes` edge fails `synthesis_parentage`.

## Verification needs

- **`node --test`** over `evaluatePatchGate`: (a) >1 competitor + no comparison/selects →
  fail; (b) + comparison + selects → pass; (c) graph PR→brief mapping vs branch-name
  fallback vs no-match (fail-closed); (d) `waives → patch-comparison` override passes,
  expired does not; (e) single-competitor brief → pass (no market).
- **`node --test`** over the two structural handlers (synthesis ≥2 parents; selected-patch
  comparison coverage; superseded competitor excluded; unresolved endpoint skipped).
- **Real-tree checks:** `spec:validate` green on the post-migration graph; `spec:patch-gate`
  exercised against a synthetic diff/branch.
- **Schema-for-free:** `patch.status` enum, `competes-for`/`synthesizes` endpoint types,
  and `compares`/`selects` to a `patch` (now valid) all enforced by existing handlers.
- **CI:** `patch-comparison.yml` runs `spec:patch-gate` as a required check; mutating
  steps end with `… index && … validate` and never commit on red.
