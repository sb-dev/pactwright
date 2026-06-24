---
id: contract-patch-market-validate-authoritative-9d41
type: contract
title: Lane-aware patch market — graph-validate-authoritative (multi-patch merge gate as a spec:validate rule; patch-comparison.yml thin-runs validate)
status: candidate
created: 2026-06-24
class: 3
---

This intent (`intent-patch-market-synthesis-3b1e`, class 3) is itself multi-surface — it
migrates the schema (`specs/schema/node-types.yaml`, `specs/schema/edge-types.yaml`),
extends the validator (`tools/validator.ts` + new `tools/handlers/*.ts`), adds four
commands under `.claude/commands/`, edits `CLAUDE.md`, and adds CI. Under the routing
table that is a **Class 3** change, so this proposal market carries three candidate
contracts (this is candidate **A** of three). All three share an identical common core
and differ on exactly one axis: **where the multi-patch merge gate lives** — the
requirement that "a brief with >1 `competes-for` edge — merging its implementation PR
requires a comparison node + a `selects` decision; fail otherwise; overridable via an
override node." Candidate **A** realises that gate as a **third `spec:validate` rule** (a
red graph blocks the merge); `patch-comparison.yml` is a thin workflow that runs
`spec:validate`.

## Problem interpretation

The intent asks for a per-lane patch market: for one lane brief you implement the same
brief N ways on N branches, open N draft PRs, record each as a `patch` node that
`competes-for` the brief, compare them in one `comparison` node, and let a human
`/select-patch` one winner (losers superseded, branches kept, PRs closed). Within-lane
combination is a `synthesis` patch with `synthesizes` edges to its parents; across-lane
combination is integration (Phase 8), never synthesis. The market is judged **in lane
isolation** — cross-lane fit is integration's job, never patch comparison's.

The intent is unusually prescriptive: it dictates the schema, the four commands, the
CLAUDE.md prose, and **two** explicit `spec:validate` extensions. Those are the
irreducible common core, identical across all three candidates:

- **Schema — `specs/schema/node-types.yaml`.** Add node type `patch` with
  `required_fields [id, type, title, status, branch, strategy, created]`,
  `status_values [candidate, selected, superseded]`, `requires_body: true` (body = the
  patch's evidence summary). Add an optional boolean `patch_market` flag to `brief` (not
  in `required_fields`; set `true` by `/propose-patches`; unset means no market —
  modelled on the optional `lane` precedent). `nodes-status-in-enum` constrains
  `patch.status` for free; `nodes-required-fields` + `requires_body` cover presence and a
  non-empty body for free.
- **Schema — `specs/schema/edge-types.yaml`.** Add `competes-for` (`source: patch`,
  `target: brief`) and `synthesizes` (`source: patch`, `target: patch`). Widen
  `compares.target` from `contract` to `[contract, patch]` and `selects.target` from
  `contract` to `[contract, patch]`. **No handler change is needed**: `edge_endpoint_types`
  already enforces a list target (the existing `flags` edge uses `target: [evidence,
  capability]`), so union-target membership is free. (The intent's claim that `selects`
  "already allows decision → patch" is inaccurate — today it is `decision → contract`
  only; widening its target is the in-scope work that delivers the intended behaviour,
  not a scope change.)
- **Commands — `.claude/commands/`.** `/propose-patches <brief-id> <n> <strategy-list>`
  (brief must be a lane brief or single brief; per strategy create branch
  `patch/<brief-slug>/<strategy>`, run the implementation agent with the brief PLUS an
  injected strategy directive, open a draft PR, create a `patch` node carrying branch,
  strategy and an evidence summary with a `competes-for` edge to the brief, set
  `patch_market: true`). `/compare-patches <brief-id>` (per candidate branch run
  `contract-reviewer` and `/detect-drift`; invoke graph-maintainer to author one
  `comparison` node scoring contract fit, scope control, simplicity, test quality, drift
  risk and rollback safety, with `compares` edges to each candidate patch; end by asking
  for a human decision; never select). `/synthesize-patches <brief-id> <patch-id-list>
  <instruction>` (create a synthesis `patch` (status `candidate`) on branch
  `patch/<brief-slug>/synthesis`, combining the named patches per the human instruction;
  add `synthesizes` edges to each parent and a `competes-for` edge to the **same** lane
  brief; carry an evidence summary). `/select-patch <patch-id> <rationale>` (author a
  `decision` with a `selects` edge to the winner; set losing patches — including the
  parents of a selected synthesis patch — to `superseded`, close their draft PRs, keep
  their branches; the winner's branch proceeds to `/prepare-evidence`; apply the
  scope-integrity rules — if comparison exposed the contract or brief was wrong,
  supersede the brief, capture a follow-up intent, or return to human approval rather
  than widening scope inside the winner).
- **CLAUDE.md.** The patch market runs per lane brief; patches compete within one lane;
  patch comparison judges that lane in isolation; cross-lane fit is judged at integration,
  never in patch comparison. Patch market by class: Class 0–1 a single patch, no market;
  Class 2 optional per brief; Class 3 available per lane. Within-lane synthesis is a
  synthesis patch with `synthesizes` edges; across-lane combination is integration. Patch
  review carries the Phase-6 scope-integrity rules.
- **Two intent-mandated `spec:validate` extensions (structural, in every candidate).** (1)
  `synthesis_parentage` — a synthesis patch (any patch with ≥1 `synthesizes` edge) must
  carry `synthesizes` edges to **≥2** parent patches, else a finding. (2) selected-patch
  comparison coverage — a `selects`-edged `patch`'s brief must have a `comparison` node
  whose `compares` edges cover the patches that `competes-for` that brief (a set/coverage
  traversal modelled on `tools/handlers/comparison_required.ts`). Both are pure
  `(rule, spec) => Finding[]` handlers registered in the `HANDLERS` map, listed after
  `edges-references-resolve`, counting only non-superseded competitors and defensively
  skipping unresolved endpoints.

What distinguishes **candidate A**: the **merge gate** — "a brief with >1 `competes-for`
edge needs a comparison + a `selects` before its implementation can merge" — is realised
as a **third `spec:validate` rule** (`patch_market_resolved`): a brief with >1 live
`competes-for` edge is *unresolved* until a `comparison` covers those patches AND a
`selects` decision points at one of them; while unresolved the graph is **red**.
`patch-comparison.yml` is a thin workflow that runs `spec:validate` (it adds no
independent logic). Override is handled by making this one rule waiver-aware: a
`waives → patch-comparison` edge from a non-expired `override` suppresses the finding.
The graph becomes the single source of truth for every patch-market invariant.

## Scope

- **`specs/schema/node-types.yaml`, `specs/schema/edge-types.yaml`** — the schema
  migration above (patch node, `patch_market` brief flag, `competes-for`/`synthesizes`
  edges, widened `compares`/`selects` targets).
- **`.claude/commands/`** — the four commands above.
- **`CLAUDE.md`** — the patch-market prose, the by-class row, synthesis-vs-integration,
  scope-integrity in patch review.
- **`tools/handlers/` (three new handlers) + `tools/validator.ts` (register) +
  `specs/schema/validation-rules.yaml` (declare, after `edges-references-resolve`)** — the
  two structural rules AND candidate A's distinguishing third rule
  `patch_market_resolved` (multi-patch brief unresolved ⇒ red, waiver-aware). All scoped
  to live (non-superseded) nodes.
- **`.github/workflows/patch-comparison.yml`** — a thin workflow that runs
  `pnpm spec:validate` (modelled on `spec-validate.yml`); blocking comes from the red
  graph, not independent gate logic.
- **`specs/schema/checks.yaml`** — add the `patch-comparison` named check so a
  `waives → patch-comparison` override resolves.
- **Capability ownership, this PR.** The diff touches `tools/**`, `.claude/commands/**`,
  `.github/**`, `specs/schema/**` and `CLAUDE.md`; a diff touching unowned paths is
  resolved in the same PR per the Phase-8 capability-wiring flow.

## Non-scope

- **No diff-aware patch gate.** The merge gate is a graph-state validate rule, not a
  `gate.ts`/`check-diff`-style diff consumer. This is A's defining choice and is candidate
  B's mechanism, deliberately not adopted here.
- **No PR-state tracking in the graph.** A patch node records `branch`, `strategy` and an
  evidence summary; the draft PR's open/closed state lives in git/GitHub, not the graph.
- **No across-lane synthesis.** `/synthesize-patches` combines only patches competing for
  the **same** lane brief; cross-lane combination is `/integrate` (Phase 8).
- **No auto-selection.** `/compare-patches` never selects; selection is a human `decision`.
- **No new release/`includes` work.**

## Trade-offs

- **+** Single source of truth — every patch-market invariant (structural AND the merge
  gate) lives in `spec:validate`; the graph alone tells you whether a market is resolved.
- **+** Fully offline-testable via synthetic node fixtures; no PR context, branch-name
  parsing, or GitHub state needed to test the gate.
- **+** Matches the winning precedent — Phase 3's `ci-gate-spec-tool` and Phase 6's
  `work-class-validate-invariant` both pushed enforcement into `spec:` tooling with thin
  CI on top.
- **+** No PR→brief mapping problem: the rule reads `competes-for`/`compares`/`selects`
  edges directly, immune to branch renames.
- **−** `spec:validate` must become **override-aware** for this one rule (it is otherwise
  diff- and override-agnostic) — an architectural impurity; the waiver-suppression branch
  is logic validate has never carried.
- **−** A half-built market (patches proposed, not yet compared/selected) makes the graph
  **red**, so there is no green WIP graph mid-market — the winner's branch cannot show a
  green tree until selection is recorded. (Arguably correct — the market is genuinely
  unresolved — but it couples "graph well-formed" to "market finished.")
- **−** `patch-comparison.yml` nearly duplicates `spec-validate.yml`; the dedicated
  workflow the intent names earns its keep only as a separately-named required check.

## Risks

- **Status-blind competitor count (primary trap — a prior critique caught exactly this on
  the quorum rule).** If `patch_market_resolved` or the coverage rule counts competitors
  status-blind, a superseded patch could be mistaken for a live competitor. **Mitigation:**
  count only **non-superseded** patches as live competitors; mirror `comparison_required.ts`'s
  exclusion of superseded targets; unit-test a market with one superseded loser.
- **Override-awareness leaking into validate.** **Mitigation:** confine the waiver check to
  the single `patch_market_resolved` handler; keep the two structural rules pure; document
  the exception in `validation-rules.yaml`.
- **Red WIP blocks routine pushes.** An open market is red, so pushing the winner's branch
  for review before `/select-patch` fails CI. **Mitigation:** the override path exists for
  genuine WIP; document `/select-patch` as the normal resolution, not the override.
- **Rule ordering / unresolved endpoints.** **Mitigation:** list the three rules after
  `edges-references-resolve` and defensively skip absent endpoints.

## Acceptance examples

1. **(Two real candidate patches → compare → select, fully traced.)** A lane brief gets
   `/propose-patches <brief> 2 strategyA,strategyB` → two `patch` nodes each
   `competes-for` the brief, `patch_market: true` set. `/compare-patches <brief>` writes
   one `comparison` with `compares` edges to both. A human `/select-patch <winner>` writes
   a `decision` with a `selects` edge to the winner, supersedes the loser; the chain
   intent→…→brief→patches→comparison→decision is fully walkable.
2. **(Multi-patch brief unresolved ⇒ red — the merge gate.)** A brief with two live
   `competes-for` edges but **no** `comparison`/`selects` makes
   `node_modules/.bin/tsx tools/spec.ts validate` **exit non-zero** on
   `patch_market_resolved`. Adding the comparison and a `selects` flips it green;
   `patch-comparison.yml` (running `spec:validate`) blocks the merge until then.
3. **(Override.)** With the market unresolved, an `override` node + a non-expired
   `waives → patch-comparison` edge suppresses the finding and the graph is green.
4. **(Synthesis.)** `/synthesize-patches <brief> p1,p2 "<instruction>"` creates a
   synthesis `patch` on `patch/<brief-slug>/synthesis` with `synthesizes` edges to p1 and
   p2 and a `competes-for` edge to the same brief; `/select-patch <synthesis>` supersedes
   p1 and p2. A synthesis patch with only **one** `synthesizes` edge fails
   `synthesis_parentage`.
5. **(Lane isolation.)** A patch competing for lane brief X is compared only against other
   patches competing for X; a comparison never spans two briefs.

## Verification needs

- **`node --test`** over the three handlers: (a) two-patch brief without comparison/selects
  → finding; with both → none; (b) synthesis patch with 1 vs ≥2 `synthesizes` edges; (c)
  superseded loser excluded from the live competitor set; (d) `waives → patch-comparison`
  override suppresses the gate finding, expired override does not; (e) unresolved endpoint
  skipped, not thrown.
- **Real-tree green check:** `node_modules/.bin/tsx tools/spec.ts validate` green on the
  post-migration graph.
- **Schema-for-free checks:** a `patch` with `status: merged` fails `nodes-status-in-enum`;
  a `competes-for` from a non-`patch` source or to a non-`brief` target fails
  `edge_endpoint_types`; a `compares`/`selects` edge to a `patch` now **passes** (union
  target).
- **Acceptance trace:** the end-to-end propose→compare→select run on one real lane brief
  and the blocked-PR demonstration, green/red as specified.
- **CI:** `patch-comparison.yml` runs `spec:validate`; mutating steps end with
  `… index && … validate` and never commit on red.
