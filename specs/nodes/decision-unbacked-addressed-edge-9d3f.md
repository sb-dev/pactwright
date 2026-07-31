---
id: decision-unbacked-addressed-edge-9d3f
type: decision
title: Select the `subsumes`-edge guard for unbacked `addressed` intents, with sixteen amendments
created: 2026-07-31
decided_by: Samir Benzenine
produced_by: "/approve-contract"
---

**SELECTED:** `contract-unbacked-addressed-edge-5b71` (A) → `approved`.
**REJECTED:** `contract-unbacked-addressed-dated-2e94` (B) → `rejected`;
`contract-unbacked-addressed-waiver-8d36` (C) → `rejected`.
`intent-unbacked-addressed-guard-8c4e` stays `open` until covering evidence lands.

The analysis of record is `comparison-unbacked-addressed-7c48`, which compares all three live
candidates across ten routed perspectives. Every amendment below cites it rather than restating it.

## Accepted trade-off (why A)

A is the only candidate that puts the exception in the graph as queryable, typed provenance, and
the only one whose defects are closable by amendment. Its costs are real and accepted: a permanent
new edge type every future reader must learn, an escape hatch nothing counts or caps, and — until
amendment 13 — no rendering in the view humans actually open.

What decided it is amendability, not score. All ten perspectives returned `Concern` on all three
candidates, so this is a selection among flawed options. B's central defect is structural and no
amendment repairs it; C's is a graph-wide capability bought to excuse one immutable fact. A's
defects are an unreviewed grant path, a wrong anchor instance, and an unstated revert story —
each closed below by a named fix.

## Why each rejected candidate lost

**B — dated cutoff.** B grandfathers on the intent's `created` while the abuse it guards is an
event on `status`, and the two are decoupled: d4f2 itself was created 2026-06-11 and flipped weeks
later. The consequence is already live in the graph — `intent-docs-arrow-lint-e7b3` is `open`,
`created: 2026-06-11`, with zero incoming edges, so under B it is exempt **forever** and can be
flipped to `addressed` with no contract, no decision and no evidence while the guard stays silent.
No cutoff value repairs this, because the exempt set is a permanent function of `created` over all
intents while the tested set is only those addressed today. Separately, B's Acceptance 2 is false
on day one: `intent-spec-index-validate-a3f1` is also `addressed` and also `created: 2026-06-11`,
so the shipped cutoff grandfathers two intents, not the one its acceptance and its schema comment
both name. B's genuine strengths are recorded rather than dismissed — it is the cheapest to
revert, the only single-actor single-commit rollback, and its documented switch sits behind both
CODEOWNERS and the sole `sensitive_paths` glob.

**C — override waiver.** C buys a graph-wide exemption capability plus the repository's first
wall-clock dependency in order to excuse one historical, immutable fact. Verified: **zero**
validation handlers read `override` nodes, so after C a `waives → class-market-quorum` edge would
resolve, index, and pass code-owner review while waiving nothing. The hazard is the inverse of the
one C names — the graph gains the ability to carry legible, green, indexed waivers that are
decorative, which in a repository whose product is auditability is a manufactured audit record.
C's expiry is the only scheduled re-examination in the market and is misapplied here: d4f2's
exempting facts cannot change, so a 2027 re-signature can only restate them, while the mechanism
buys a dated unattended merge block whose remedy routes to one named reviewer. C also carries the
largest incidental surface — 18 `LoadedSpec` literals, the first live `waives` edge permanently
populating `unresolved.yaml`, and an `override` type with no status and therefore no revocation.

## Amendments (the discharge key — a later integration enumerates these by number)

Grafts from C:

1. Adopt C's near-miss finding text (modelled on `gate.ts:99-121`) for the branch A leaves
   unspecified: a `subsumes` edge exists but its anchor is broken. A's Behaviour 3 specifies detail
   text only for the no-edge case.
2. Every finding detail must be self-identifying. `formatFinding` (`validator.ts:46-48`) never
   prints `subject`, so the intent id appears in `detail` on every branch.
3. Pin the CODEOWNERS glob by executable test, in C's Acceptance 6 idiom — carrying its honest
   bound: the test proves the pattern matches, never that review is required, which
   `docs/branch-protection.md:5-7` records as repo-admin state not reproducible from files.

Grafts from B:

4. Adopt B's declare-rather-than-absorb idiom (its Out-of-scope 4) for anything this change widens.
5. State the revert story explicitly, which A omits entirely — see fix 10.

Mandatory fixes:

6. **Headline, binding regardless of base — close or bound the laundering path.** Backing is
   satisfied by any live contract that both proposes the intent and is a `selects` target anywhere
   in the graph; `proposes` has no cardinality constraint (`edge-types.yaml:9-11`) and ten
   already-selected contracts exist, so one appended line in `specs/graph/edges.yaml` — a path
   `.github/CODEOWNERS` does not cover and `sensitive_paths` does not reach — launders any intent.
   That is cheaper than A's own hatch, which needs a `decision-*` node. Either constrain the
   backing walk to the intent the selecting decision's contract actually markets, or ship an
   explicit, tested honest bound naming the path. A tested acceptance case is required either way.
7. **Do not reuse `decision-lane-integration-9f3b` as the anchor.** A's Scope 7 wires d4f2 to
   `evidence-lane-integration-9b4c` — the evidence-for-a-DIFFERENT-intent that
   `intent-unbacked-addressed-guard-8c4e:17-20` names as the anti-pattern, and which already backs
   `intent-lane-model-integration-a1f7`. A's sole shipped instance is the intent's own
   counter-example. Author a new decision node recording the subsumption judgement for d4f2
   specifically; that also puts the first grant behind `CODEOWNERS:9`, which reusing an existing
   decision does not.
8. **Fix Scope 2, which is false.** Both `selectedContracts` (`coverage_coherence.ts:66-71`) and
   `supersededTargets` (`:57-62`) are function-local consts exported from nowhere, so "imported,
   not modified" cannot hold. Add an explicit scope item lifting `selectedContracts` into
   `coverage_traversal.ts` as an exported walk, and state which spelling of "selected" is
   authoritative — the raw scan and `liveSourcesByEdge` disagree on a typo'd decision id, which is
   what all three no-double-report criteria rest on.
9. **Fixtures.** The named fixture must include an addressed intent carrying live `proposes` edges
   but **no** `selects` edge; every candidate's fixture is the zero-edge shape, so an
   implementation computing backing as `liveProposingContracts(intent).size > 0` — dropping the
   intersection, the exact error the contract warns against — passes all of them. And add every new
   fixture directory name to `tests/spec.test.ts:106-122`'s hard-coded literal: 19 bad-fixture
   directories exist, the array lists 15, and there is no `readdirSync`, so an omitted fixture is
   silently never run.
10. **State the revert story.** The `subsumes` edge and its `edge-types.yaml` declaration land and
    revert in ONE commit, because a code-only revert leaves an undeclared edge type that hard-reds
    `edges-type-declared` on `main` for unrelated changes. Name `specs/indexes/` as the fourth
    artifact in that commit.
11. **Correct Out-of-scope 1 and Out-of-scope 3**, both contradicted by A's own Scope 1 and
    Behaviour 2: the anchor re-derives a coverage verdict (~25 lines including the superseded
    filter, the exactly-one constraint and the `final`-status filter), and letting an intent stand
    `addressed` with no market IS a lifecycle shortcut in the only sense at issue.
12. **The finding text leads with the cheapest correct remedy** — revert the status flip to `open`
    — not with the `subsumes` route. A's Behaviour 3 advertises the escape hatch to every operator
    at the moment they are most motivated to take it.
13. **Handle the `trails.md` invisibility explicitly.** `indexer.ts:175-189` builds trails from six
    fixed sections and `subsumes` is in none, so d4f2 still renders six `_none_` blocks after A
    lands. Either add the section or record it as a stated honest bound; A's Out-of-scope 6
    justifies the omission on liveness, true for `status.md` and false for `trails.md`.
14. **Guard unresolved endpoints defensively in the handler** rather than relying on rule order:
    `runValidation` (`validator.ts:63-89`) never short-circuits, and `validator.ts:87` has no
    try/catch, so a throw in the new handler aborts `spec:validate` and loses every other rule's
    findings.
15. **Acceptance 1 must name the run that discharges it**, per CLAUDE.md's paste-only clause, plus
    the remediation if it fails. As written it is a paste. A's red state also mutates
    `incoming.yaml` and `outgoing.yaml`, so `indexes-fresh` fires unless the leg regenerates
    indexes — "exactly one finding" is false otherwise.
16. **State the composite honest bound with its size:** green asserts provenance for every
    addressed intent and coverage only for those whose selected contract postdates 2026-06-18.
    Verified — six of ten addressed intents (`a3f1`, `f367`, `5c90`, `c7b1`, `b9c4`, `7ada`) fall
    outside any coverage check after this lands.

## Common-core findings (binding in full)

All thirteen shared-core findings of `comparison-unbacked-addressed-7c48` bind in full; this is not
a summary and the comparison is not superseded by this selection. Finding 8 is carried with its
bound: a legitimate `supersedes` turns a backed intent unbacked with no author action, but the
graph contains zero superseded contracts today, so it is a forward-looking failure mode rather than
a live one.

## Routed out, not amended

1. **Adding `/specs/graph/` to `.github/CODEOWNERS`** — the highest-value change this review
   surfaced outside the three candidates, and a change to a control surface this contract does not
   scope. Follow-up intent under rule 5, never a silent widening.
2. **The `rejected` exit.** `conveyor.ts:294-296` drops both `addressed` and `rejected` from the
   live set, but the shared rule is `addressed`-scoped, so a body-only rejection erases an intent
   with zero provenance and zero coverage. A gap in the market's premise, not in A.
3. **Attributing the status transition.** No intent field records who flipped a status or when;
   adding one would edit `node-types.yaml`, the sole `sensitive_paths` glob.
4. **Self-application cannot be observed on this branch.** `checkdiff.ts:113-146` evaluates per
   owning capability and this branch already satisfies it, so the acceptance must be a unit test
   over `evaluateCheckDiff` with a constructed added-id set, or land from a branch cut off `main`.

## Consequences

- `contract-unbacked-addressed-edge-5b71` → `approved`
- `contract-unbacked-addressed-dated-2e94` → `rejected`
- `contract-unbacked-addressed-waiver-8d36` → `rejected`
- `intent-unbacked-addressed-guard-8c4e` → stays `open`
- `comparison-unbacked-addressed-7c48` → unchanged; a comparison is never superseded by selection

The approved contract body is never edited. The effective contract is
`contract-unbacked-addressed-edge-5b71` plus the sixteen amendments above.

**Next step:** `/write-brief contract-unbacked-addressed-edge-5b71` — class 2, so lanes are
optional and the choice is recorded in the brief.
