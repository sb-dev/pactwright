---
id: contract-unbacked-addressed-dated-2e94
type: contract
title: Unbacked `addressed` guard behind a dated `unbacked_addressed_from` cutoff (no new vocabulary)
status: candidate
created: 2026-07-30
class: 2
produced_by: "/propose-contracts"
---

This contract proposes `intent-unbacked-addressed-guard-8c4e` (class 2). The market carries
**three** candidates and this is **B**. All three ship an identical guard — one intent-scoped
validation rule that reaches an intent no existing rule can see — and differ on exactly one axis:
**how the single standing exception, `intent-status-coherence-d4f2`, is recorded.** B takes the
**dated** position: no new edge type, no waiver, no record of any kind. A top-level
`unbacked_addressed_from` cutoff grandfathers everything created before it, on the exact precedent
of `comparison_required_from` and `coverage_coherence_from`, and d4f2 falls out of scope by date.

## Problem interpretation

Ten intents are `addressed`. Nine carry two or three incoming `proposes` edges from their candidate
contracts; exactly one — `intent-status-coherence-d4f2` — has **zero** incoming edges. It was never
proposed and never contracted; it was flipped by `decision-lane-integration-9f3b`'s closing prose
plus `evidence-lane-integration-9b4c`, which evidences a *different* brief. That is the CLAUDE.md
rule-1 anti-pattern and today it is uncatchable.

Incoming-edge *count* is not the discriminator: a live intent legitimately carries `proposes` edges
from candidates before anything is selected. The discriminator is the **`selects`-coverage chain**
— `decision —selects→ contract —proposes→ intent`. `coverage-coherence` is that chain's rule and it
is `selects`-**scoped**: `coverage_coherence.ts:78` opens with `spec.edges.forEach` filtered to
`selects`, so an intent no `selects` edge reaches is never visited. d4f2 is not mis-judged; it is
structurally invisible.

The shared core, identical in A, B and C:

1. **One new rule** — id `unbacked-addressed`, kind `unbacked_addressed`, handler
   `tools/handlers/unbacked_addressed.ts`, registered in `tools/validator.ts`'s `HANDLERS`, and
   inserted in `specs/schema/validation-rules.yaml` directly **after** `coverage-coherence`.
2. **The iteration is inverted.** The rule walks `spec.nodes` filtered to
   `type: intent, status: addressed`, not `spec.edges` filtered to `selects`. That inversion is the
   whole mechanism: it reaches d4f2 on the first pass.
3. **Backing is provenance, not a second coverage notion.** An addressed intent is backed iff at
   least one live (non-`superseded`) contract both `proposes` it and is the target of a `selects`
   edge — from `liveProposingContracts` in `tools/handlers/coverage_traversal.ts` intersected with
   the `selects`-target set `coverage_coherence.ts:66-71` already builds. Whether that contract is
   *covered* stays `coverage-coherence`'s verdict, so the two rules never double-report a subject.
4. **The honest bound.** Green asserts an addressed intent has decision-backed provenance, not that
   the work is covered; the coverage half stays grandfathered at `coverage_coherence_from`.

B adds a fifth clause: the rule is **dated**, and the date is the whole exception mechanism.

## Scope

1. **`tools/handlers/unbacked_addressed.ts` (new)** — the shared-core rule, preceded by the cutoff
   guard in the shape of `comparison_required.ts:32-34`: normalize `spec.unbackedAddressedFrom`
   through `toDateString`; `undefined` → return no findings (fail-open, gate off). Per addressed
   intent, normalize the **intent's own** `created` and skip it when it is strictly before the
   cutoff.
2. **`tools/loader.ts`** — `unbackedAddressedFrom?: string` on `LoadedSpec` plus the read
   `asString(rulesDoc["unbacked_addressed_from"])`, mirroring `:141` and `:144`. This is a **named
   field**, not free reuse — the same small loader edit `decision-lane-integration-9f3b`'s
   correction 1 called out for `coverage_coherence_from`.
3. **`specs/schema/validation-rules.yaml`** — the one rule entry, plus the new top-level scalar
   `unbacked_addressed_from: "2026-06-12"`. That value is **the day after d4f2's `created`
   (2026-06-11)** — deliberately the latest date that still grandfathers it, so the exempt set is as
   small as the mechanism allows. Its comment states three things: the fail-open contract, the fact
   that it keys on the **intent's** `created` rather than a selected contract's, and that the one
   live intent it grandfathers is `intent-status-coherence-d4f2`.
4. **`tools/validator.ts`** — one `HANDLERS` entry, dispatch-pinned (id / kind / handler filename).
5. **`CLAUDE.md`** — the honest bound of core item 4, and one line noting the third dated gate.
6. **`tests/`** — `unbacked_addressed.test.ts` (new), the cutoff cases added to
   `tests/loader.test.ts` on the existing absent/empty/non-string precedent, and
   `tests/fixtures/bad/unbacked-addressed/` with `expected-errors.txt`.
7. **Evidence obligations** — `specs/schema/**` is `sensitive_paths`' sole glob, so this change's
   evidence must carry `touches → capability-spec-schema-2c3d`, plus
   `capability-spec-tooling-1a2b` (`tools/**`), `capability-spec-tests-3a6e` (`tests/**`) and
   `capability-spec-docs-8c1d` (`CLAUDE.md`). `specs/{nodes,graph}/**` stays intentionally unowned
   per `decision-graph-data-unowned-2f7b`.

## Out of scope

1. **No new edge type.** The subsumption the intent describes stays inexpressible as an edge; B
   asserts it does not need to be expressed, because the guard is forward-looking only.
2. **No new node of any kind for d4f2** — no override, no decision, no record. That is the point and
   the cost.
3. **No change to `coverage-coherence`, its cutoff, or its verdict**, and no backfill of the nine
   already-backed addressed intents.
4. **No fix to the malformed-cutoff hazard.** `intent-malformed-cutoff-finding-b3d7` is open and
   names two scalars plus a contract's `created`; B **adds a third scalar** to that surface and
   fixes none of it. The new scalar's comment points at b3d7 so the eventual fix cannot miss it.
   Widening b3d7's scope silently is a rule-5 violation, so the widening is declared here instead.
5. **No `spec:status` / `trails.md` change** — d4f2 is `addressed`, therefore not a live intent.

## Behaviour

1. Read `unbacked_addressed_from`. Absent, empty, non-string or malformed → `undefined` → the rule
   returns no findings. Absent is the documented way to switch the gate off.
2. For each node with `type: intent` and `status: addressed`: normalize its `created`; `undefined`
   → skip (fail-open, matching both precedents); strictly before the cutoff → skip (grandfathered).
3. Otherwise compute `backing = liveProposingContracts(intent) ∩ selectsTargets`. Non-empty → emit
   nothing (that intent is `coverage-coherence`'s subject). Empty → emit one finding, subject = the
   intent id, detail naming the intent, its `created`, the cutoff it failed, and the one remedy:
   propose a contract, select it, and let the existing chain carry the status.
4. Because the cutoff keys on the intent's `created`, an intent captured *today* and flipped to
   `addressed` with no market is caught immediately — the gap the intent was written to close.
5. There is no escape clause. Nothing in the graph can excuse a post-cutoff unbacked intent; the
   only way past the rule is real provenance.

## Trade-offs

1. **+ The smallest diff and zero new vocabulary.** One rule, one scalar, one loader field, one
   handler. Two live precedents already use exactly this shape, so a reviewer reads it in one pass
   and no future reader learns a new concept.
2. **+ It adds no escape hatch at all.** A adds a permanent edge type that any decision may use; C
   makes every validation rule waivable. B adds nothing that can be used to excuse the next
   violation — the guard has no door in it.
3. **+ It cannot get d4f2's exception wrong**, because it writes nothing about d4f2.
4. **− The exception is silent, and that is the case against B.** `edges.yaml` gains nothing;
   `incoming.yaml` still shows d4f2 with no incomings. A reader six months from now sees a date in
   a schema file and must reconstruct the *why* from a merged PR or this contract body — precisely
   the "canonical data living outside the graph" habit the parent intent objects to.
5. **− A third grandfathering idiom.** Both precedents key on the **selected contract's** `created`;
   B must key on the **intent's**, because an unbacked intent has no selected contract. The
   divergence is forced, but it is one more shape to hold in mind.
6. **− It inherits a known, open defect.** A one-character typo (`2026-6-12`) silently disables the
   guard on a green graph. `intent-malformed-cutoff-finding-b3d7` exists precisely because this
   fail-open is already a hazard on two scalars; B makes it three.
7. **− The exemption is blanket, not targeted.** It exempts every pre-cutoff intent, not d4f2
   specifically. Today those are all backed on their merits, so exactly one verdict changes; the
   untargetedness is structural, not situational.

## Acceptance

1. **Three-state cutoff behaviour, on the live graph.** Cutoff absent → **0** findings (gate off).
   Cutoff `"2026-06-10"` → **exactly one** finding, subject `intent-status-coherence-d4f2`. Cutoff
   at the shipped `"2026-06-12"` → **0** findings. All three asserted in one test.
2. **The grandfathered set is named and tested.** A test asserts the shipped cutoff grandfathers
   **exactly one** live addressed intent, `intent-status-coherence-d4f2`, by id — so any later edit
   that moves the cutoff forward to silence a *new* violation fails the suite rather than passing
   quietly. **Honest bound:** this makes the exception discoverable in `tests/`, not in the graph.
3. **Loader cases on the precedent.** Absent, empty string, non-string, and malformed `2026-6-12`
   each yield `undefined` and therefore a disabled gate — four cases in `tests/loader.test.ts`.
4. **Post-cutoff catch.** `tests/fixtures/bad/unbacked-addressed/` holds an addressed intent created
   after the cutoff with zero incoming edges; `expected-errors.txt` carries a
   `[rule: unbacked-addressed]` line naming it.
5. **No double-report.** An addressed intent whose selected contract is uncovered yields exactly one
   finding, from `coverage-coherence`, and none from `unbacked-addressed`.
6. **Whole-graph no-regression.** `pnpm spec:validate` is clean after the change, with the nine
   already-backed addressed intents asserted by name to produce no finding.
7. **Dispatch pinning.** Kind `unbacked_addressed` resolves to the named handler; an unknown kind
   still hard-fails; `tests/fixtures/bad/dispatch-all-kinds/` passes unchanged.

## Risks

1. **A malformed cutoff silently disables the guard.** *Mitigation:* acceptance 3's loader tests
   make the behaviour explicit, and the scalar's comment points at
   `intent-malformed-cutoff-finding-b3d7`. *Not fixed here* — B inherits the defect and says so.
2. **Cutoff drift.** A future author moves the date forward to silence an inconvenient finding.
   *Mitigation:* acceptance 2's named-set test reds on any widening of the exempt set.
3. **`created` is author-supplied and unvalidated as a date**, so a backdated intent slips under the
   cutoff. *Mitigation:* none mechanical; `created` is already trusted by both existing dated gates.
   Named, not solved.
4. **The reason for d4f2's exception exists only outside the graph.** *Mitigation:* the scalar's
   comment names d4f2 and `decision-lane-integration-9f3b`. That is grep-recoverable prose in a
   schema file, not a graph query, and no rule checks it.
5. **Self-application ordering.** This PR touches `specs/schema/**`, so `drift-review`'s
   sensitive-paths gate needs the approved contract link and the
   `touches → capability-spec-schema-2c3d` edge in the **same** diff. *Mitigation:* pinned as
   within-PR ordering in the brief.

## Critique (spec)

Concern. Acceptance 2 and the shipped schema comment are false on the live graph (the `2026-06-12`
cutoff grandfathers two addressed intents, not one), and keying on the intent's `created` leaves
the zero-edge open intent `intent-docs-arrow-lint-e7b3` permanently exempt. Full finding in
`comparison-unbacked-addressed-7c48`.

## Critique (security-privacy)

Concern. B's Behaviour 5 ("there is no escape clause") is contradicted by its own Behaviour 2,
which skips any addressed intent whose `created` fails `toDateString`, so a one-character
malformation in an intent file — a path no CODEOWNERS rule covers — silently exempts that intent on
a green graph. Full finding in `comparison-unbacked-addressed-7c48`.

## Critique (compliance-risk)

Concern. No query over the graph has "d4f2" as its answer, and the cutoff exempts two live
addressed intents from evaluation rather than the one its acceptance names. Full finding in
`comparison-unbacked-addressed-7c48`.

## Critique (architecture)

Concern. The third `_from` scalar grandfathers on a different node's `created` than the two
precedents it cites, so it is a third hand-copy of a fail-open idiom that an open finding
(`intent-malformed-cutoff-finding-b3d7`) already names as defective, not a third use of one
mechanism. Full finding in `comparison-unbacked-addressed-7c48`.

## Critique (ux)

Concern. The exemption is invisible in every operator surface — no finding, no index entry, and a
green `spec:validate` line that reads identically whether the guard ran or a one-character typo
disabled it. Full finding in `comparison-unbacked-addressed-7c48`.

## Critique (qa-test)

Concern. Acceptance 2's "grandfathers exactly one addressed intent" is already false on today's
graph — `intent-spec-index-validate-a3f1` is also `addressed` and `created: 2026-06-11`. Full
finding in `comparison-unbacked-addressed-7c48`.

## Critique (product)

Concern. The cutoff keys on the intent's `created`, leaving `intent-docs-arrow-lint-e7b3`
(`2026-06-11`, open, zero incoming edges) permanently flippable to `addressed` with the guard
silent, while Acceptance 2's named-set test is scoped to today's addressed intents and passes
either way. Full finding in `comparison-unbacked-addressed-7c48`.

## Critique (reliability-ops)

Concern. B ships three zero-output silent-disable paths — malformed scalar, malformed intent
`created`, backdated `created` — two of which its own acceptance pins as correct behaviour, and it
has no bounded break-glass when the rule false-positives. Full finding in
`comparison-unbacked-addressed-7c48`.

## Critique (release)

Concern. `unbacked_addressed_from: "2026-06-12"` grandfathers TWO live addressed intents
(`intent-status-coherence-d4f2` and `intent-spec-index-validate-a3f1`, both `created: 2026-06-11`),
so B's Acceptance 2 named-set test reds on day one and no cutoff value can fix it. Full finding in
`comparison-unbacked-addressed-7c48`.

## Critique (cost-maintainability)

Concern. B adds a third dated fail-open scalar to the exact surface
`intent-malformed-cutoff-finding-b3d7` already flags as broken, without fixing it — and authors
four loader assertions whose purpose is to be reversed when that intent lands. Full finding in
`comparison-unbacked-addressed-7c48`.
