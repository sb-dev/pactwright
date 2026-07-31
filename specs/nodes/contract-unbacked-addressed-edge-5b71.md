---
id: contract-unbacked-addressed-edge-5b71
type: contract
title: Unbacked `addressed` guard, with subsumption expressed as a `subsumes` edge (decision → intent)
status: approved
created: 2026-07-30
class: 2
produced_by: "/propose-contracts"
---

This contract proposes `intent-unbacked-addressed-guard-8c4e` (class 2). The market carries
**three** candidates and this is **A**. All three ship an identical guard — one intent-scoped
validation rule that reaches an intent no existing rule can see — and differ on exactly one axis:
**how the single standing exception, `intent-status-coherence-d4f2`, is recorded.** A takes the
**edge** position: the decision-backed subsumption the intent says "cannot currently be expressed
as an edge" becomes a first-class edge type, and d4f2 is wired with one.

## Problem interpretation

Ten intents are `addressed`. Nine carry two or three incoming `proposes` edges from their candidate
contracts; exactly one — `intent-status-coherence-d4f2` — has **zero** incoming edges. It was never
proposed and never contracted; it was flipped by `decision-lane-integration-9f3b`'s closing prose
plus `evidence-lane-integration-9b4c`, which evidences a *different* brief. That is the CLAUDE.md
rule-1 anti-pattern — a relationship asserted in a node body rather than as an edge — and today it
is uncatchable.

Incoming-edge *count* is not the discriminator: a live intent legitimately carries `proposes` edges
from candidates long before anything is selected. The discriminator is the **`selects`-coverage
chain** — `decision —selects→ contract —proposes→ intent`. `coverage-coherence` is exactly that
chain's rule, and it is `selects`-**scoped**: `coverage_coherence.ts:78` opens with
`spec.edges.forEach` filtered to `selects`, so an intent that no `selects` edge reaches is never
visited. d4f2 is not mis-judged by the existing rule; it is structurally invisible to it.

The shared core, identical in A, B and C:

1. **One new rule** — id `unbacked-addressed`, kind `unbacked_addressed`, handler
   `tools/handlers/unbacked_addressed.ts`, registered in `tools/validator.ts`'s `HANDLERS`, and
   inserted in `specs/schema/validation-rules.yaml` directly **after** `coverage-coherence` (it
   assumes `edges-references-resolve` has run and reads the same traversal module).
2. **The iteration is inverted.** The rule walks `spec.nodes` filtered to
   `type: intent, status: addressed`, not `spec.edges` filtered to `selects`. That inversion is the
   whole mechanism: it reaches d4f2 on the first pass.
3. **Backing is provenance, not a second coverage notion.** An addressed intent is backed iff at
   least one live (non-`superseded`) contract both `proposes` it and is the target of a `selects`
   edge — computed from `liveProposingContracts` in `tools/handlers/coverage_traversal.ts`
   intersected with the `selects`-target set `coverage_coherence.ts:66-71` already builds. Whether
   that contract is *covered* stays `coverage-coherence`'s verdict, so a backed intent yields no
   finding here and the two rules never double-report one subject.
4. **The honest bound.** Green asserts an addressed intent has decision-backed provenance; it does
   **not** assert the work is covered. The coverage half remains grandfathered at
   `coverage_coherence_from` and is not re-litigated by this rule.

## Scope

1. **`tools/handlers/unbacked_addressed.ts` (new)** — the shared-core rule above, plus A's escape
   clause: an intent is **also** backed when a `decision —subsumes→ intent` edge exists **and** that
   same decision `selects` a contract that is **covered** per the shared walk
   (`liveBriefsForContract`, then `finalEvidenceForBrief` for a single brief or
   `briefsCoveredByIntegration` for a multi-brief contract). The escape is *anchored*: subsumption
   borrows the coverage of delivered work and cannot be conjured from a decision that delivered
   nothing.
2. **`tools/handlers/coverage_traversal.ts` — imported, not modified.** Every walk A needs is
   already exported there; no live rule handler is touched.
3. **`specs/schema/edge-types.yaml`** — new type:
   `subsumes: {source: decision, target: intent}`. `edges-type-declared` and `edges-endpoint-types`
   then enforce it for free, with no handler change.
4. **`specs/schema/validation-rules.yaml`** — the one rule entry, with the honest bound in its
   comment. No new top-level scalar, no cutoff.
5. **`tools/validator.ts`** — one `HANDLERS` entry, dispatch-pinned (id / kind / handler filename).
6. **`CLAUDE.md`** — (a) the edge vocabulary gains `subsumes` with its endpoint rule; (b) the rule-3
   neighbourhood states that `subsumes` is the **cross-type** provenance edge and, unlike
   `supersedes`, changes **no** node's status; (c) the honest bound of core item 4.
7. **Graph data (via graph-maintainer)** — one edge,
   `decision-lane-integration-9f3b —subsumes→ intent-status-coherence-d4f2`. The anchor is verified
   to hold today: `9f3b —selects→ contract-lane-integration-convention-body-4c1f`, whose single live
   brief `brief-lane-integration-5e2d` has exactly one `final` evidence,
   `evidence-lane-integration-9b4c`.
8. **`tests/`** — `unbacked_addressed.test.ts` (new); bad fixtures
   `tests/fixtures/bad/unbacked-addressed/` and `tests/fixtures/bad/subsumes-wrong-endpoint/`, each
   with `expected-errors.txt`.
9. **Evidence obligations** — `specs/schema/**` is `sensitive_paths`' sole glob, so this change's
   evidence must carry `touches → capability-spec-schema-2c3d`, plus
   `capability-spec-tooling-1a2b` (`tools/**`), `capability-spec-tests-3a6e` (`tests/**`) and
   `capability-spec-docs-8c1d` (`CLAUDE.md`). `specs/{nodes,graph}/**` stays intentionally unowned
   per `decision-graph-data-unowned-2f7b`.

## Out of scope

1. **No change to `coverage-coherence`, its cutoff, or its verdict.** Its grandfathering at
   `coverage_coherence_from` is untouched; this rule adds no second coverage notion and re-judges no
   historical contract.
2. **No backfill.** The nine already-backed addressed intents get no new edges and no new records.
3. **No `subsumes` semantics beyond provenance.** The edge does not flip any status, does not make
   an intent `addressed`, is not read by `tools/conveyor.ts`, and grants no lifecycle shortcut.
4. **The malformed-cutoff hazard** (`intent-malformed-cutoff-finding-b3d7`) is untouched — A adds no
   dated scalar, so it neither fixes nor widens that surface.
5. **No `override` or waiver work.** A's escape hatch is the edge; the waiver registry is unchanged.
6. **No `spec:status` / `trails.md` surface change.** d4f2 is `addressed`, therefore not a live
   intent, so the conveyor prints nothing for it either way.

## Behaviour

1. For each node with `type: intent` and `status: addressed`, compute
   `backing = liveProposingContracts(intent) ∩ selectsTargets`. If `backing` is non-empty, emit
   nothing — that intent is `coverage-coherence`'s subject.
2. Otherwise, look for a `subsumes` edge whose `target` is the intent. If one exists and its source
   decision `selects` a covered contract, emit nothing.
3. Otherwise emit one finding, subject = the intent id, detail naming the intent, its status, the
   count of live proposing contracts, and the two ways to resolve it: real provenance, or a
   `subsumes` edge from a decision anchored to covered work.
4. `edges-endpoint-types` rejects a `subsumes` edge whose source is not a `decision` or whose target
   is not an `intent`, with no code change — the declaration in `edge-types.yaml` is the whole
   enforcement.
5. `spec:index` picks the new edge up with no indexer change, so `specs/indexes/incoming.yaml` lists
   the subsumption under d4f2.

## Trade-offs

1. **+ The exception is queryable and permanent.** "Why is d4f2 addressed?" is one lookup in
   `incoming.yaml` or `edges.yaml`, six months or six years later — not archaeology through a merged
   PR or a contract body.
2. **+ It closes the anti-pattern at its root.** The intent states the subsumption relationship
   cannot currently be expressed as an edge. A makes it expressible, so the rule-1 violation stops
   being a thing the graph forces on an author.
3. **+ The escape is anchored, not free.** A `subsumes` edge only backs an intent when its decision
   selected a contract that real evidence or a real integration covers.
4. **− The largest permanent vocabulary cost of the three.** An edge type is forever: every future
   reader, agent, command and tool must know what `subsumes` means and when it is legitimate.
5. **− The escape hatch is a normal graph operation, unbounded and unexpiring.** Any decision may
   subsume any intent. CODEOWNERS on `/specs/nodes/decision-*` puts a human in the loop for the
   decision, but nothing caps how often subsumption is used and nothing forces it to be revisited.
6. **− The anchor is a heuristic, and A says so.** It proves the subsuming decision delivered
   *something covered*; it does not prove what it delivered covers *this* intent. That judgement
   stays human, recorded in the decision body.

## Acceptance

1. **Red-then-green self-application.** With the rule appended and the `subsumes` edge absent,
   `pnpm spec:validate` emits **exactly one** finding, subject `intent-status-coherence-d4f2`. With
   the edge added it emits **zero**. Both states are captured verbatim in the evidence node.
2. **Whole-graph no-regression.** After the edge lands, validate is clean; the nine other addressed
   intents produce no finding, asserted by name in the test.
3. **Fixture.** `tests/fixtures/bad/unbacked-addressed/` holds an addressed intent with zero
   incoming edges; its `expected-errors.txt` carries a `[rule: unbacked-addressed]` line.
4. **Endpoint enforcement is free.** `tests/fixtures/bad/subsumes-wrong-endpoint/` holds a
   `brief —subsumes→ intent` edge and expects
   `edge ... type=subsumes requires source.type=decision, got brief` — proving the new type needed
   no handler change.
5. **The anchor is falsifiable.** A `subsumes` edge from a decision that selects nothing, selects a
   `superseded` contract, or selects a contract whose single brief has zero (or two) `final`
   evidence does **not** back the intent — the finding still fires. Four unit cases.
6. **No double-report.** An addressed intent whose selected contract is uncovered yields exactly one
   finding, from `coverage-coherence`, and none from `unbacked-addressed`.
7. **Dispatch pinning.** A rule with kind `unbacked_addressed` resolves to the named handler; an
   unknown kind still hard-fails; `tests/fixtures/bad/dispatch-all-kinds/` passes unchanged.
8. **Queryability.** `specs/indexes/incoming.yaml` lists the `subsumes` edge under d4f2 after
   `pnpm spec:index`, and a second run is byte-identical.

## Risks

1. **`subsumes` normalizes into a bypass** — the next inconvenient intent is subsumed rather than
   delivered. *Mitigation:* the anchor condition, CODEOWNERS review on the decision that authors it,
   and a rule comment stating subsumption is exceptional. *Honest:* nothing counts or caps it.
2. **Confusion with `supersedes`.** *Mitigation:* the endpoint rules differ structurally
   (`same_as_source` versus `decision → intent`), so a mis-typed edge reds immediately; CLAUDE.md
   states the distinction in one line.
3. **Fixture schema copies drift.** Each `tests/fixtures/**/specs/schema/edge-types.yaml` is an
   independent copy, so a fixture carrying a `subsumes` edge would need the declaration.
   *Mitigation:* none does today; a test asserts no fixture references `subsumes` unless its own
   schema copy declares it.
4. **Self-application ordering.** This PR touches `specs/schema/**`, so `drift-review`'s
   sensitive-paths gate needs the approved contract link and the
   `touches → capability-spec-schema-2c3d` edge in the **same** diff. *Mitigation:* pinned as
   within-PR ordering in the brief.

## Critique (spec)

Concern. The one `subsumes` edge A ships anchors d4f2 on `evidence-lane-integration-9b4c` — the
very "evidence body that evidences a DIFFERENT intent" the parent intent names as the
anti-pattern — and Scope 1 re-derives a coverage verdict Out-of-scope 1 forbids. Full finding in
`comparison-unbacked-addressed-7c48`.

## Critique (security-privacy)

Concern. The escape is a one-line `edges.yaml` addition reusing any already-merged decision that
selected covered work, and `specs/graph/` matches no CODEOWNERS rule and no `sensitive_paths`
glob, so the human-in-the-loop A claims in Trade-off 5 does not exist for the operation that
grants the exception. Full finding in `comparison-unbacked-addressed-7c48`.

## Critique (compliance-risk)

Concern. The escape hatch lands in `specs/graph/edges.yaml`, which `.github/CODEOWNERS` does not
cover, so A's stated human-in-the-loop mitigation does not fire in the case it is meant to cover.
Full finding in `comparison-unbacked-addressed-7c48`.

## Critique (architecture)

Concern. `subsumes` declares as one edge the endpoint of the existing
decision —selects→ contract —proposes→ intent chain, and `serializeTrails` (`tools/indexer.ts:182-189`)
reads only that chain — so the exception A calls "queryable" still renders `_none_` in every
section of d4f2's `trails.md` entry. Full finding in `comparison-unbacked-addressed-7c48`.

## Critique (ux)

Concern. The exception lands only in machine-shaped `incoming.yaml`/`outgoing.yaml` while
`trails.md`'s d4f2 section still prints six `_none_` blocks, so the reader's first stop is
unchanged and now actively wrong. Full finding in `comparison-unbacked-addressed-7c48`.

## Critique (qa-test)

Concern. Acceptance 4's fixture proves endpoint enforcement only against that fixture's own schema
copy, so a typo'd real `subsumes` declaration ships unenforced and green. Full finding in
`comparison-unbacked-addressed-7c48`.

## Critique (product)

Concern. A's escape hatch is one line in `specs/graph/edges.yaml` sourced from any existing
decision — a path no CODEOWNERS rule covers — so it converts a prose excuse into a typed excuse
without raising the cost of issuing one. Full finding in `comparison-unbacked-addressed-7c48`.

## Critique (reliability-ops)

Concern. The escape hatch is entirely unreviewed and untraceable — `.github/CODEOWNERS` has no
entry for `/specs/graph/`, so authoring a `subsumes` edge from an already-merged decision is a
one-line unreviewed edit and withdrawing one is a delete that leaves no record. Full finding in
`comparison-unbacked-addressed-7c48`.

## Critique (release)

Concern. The `subsumes` edge is undeclarable after a code revert, so a `git revert` that leaves it
in `edges.yaml` reds `edges-type-declared` on every later run, and A's rollback is an unstated
three-artifact, two-actor operation. Full finding in `comparison-unbacked-addressed-7c48`.

## Critique (cost-maintainability)

Concern. A ships a permanent, unexpiring new edge type (`subsumes`) that every future reader, agent
and tool must learn, with no cap on reuse — and is not the cheapest to delete, since retiring the
type means first proving no other `subsumes` edge exists anywhere. Full finding in
`comparison-unbacked-addressed-7c48`.
