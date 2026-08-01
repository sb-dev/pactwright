---
id: evidence-unbacked-addressed-edge-8f52
type: evidence
title: Unbacked-addressed guard implemented — the singleton predicate proved to close the laundering path, the anchored subsumption, and the trail section
status: final
created: 2026-07-31
produced_by: "/prepare-evidence"
---
Evidence that `brief-unbacked-addressed-edge-6b73` satisfies `contract-unbacked-addressed-edge-5b71`
plus the **sixteen amendments** of `decision-unbacked-addressed-edge-9d3f` and the thirteen
common-core findings of `comparison-unbacked-addressed-7c48`. Landed in `547b553`: 38 files,
+1633/−17. `spec:validate` goes from 20 rules to **21 rules, 0 errors**.

This was an **unlaned single brief** — the class-2 routing choice recorded in the brief. It carried
no `owner`, so implementation was inline, with one deliberate exception: every file under `tests/`
was written by `test-writer` in a separate invocation from the one that wrote the code under test.
That is the brief's recoverable-action-(b) verification path, and it is an ordered step rather than
an intention, because `/write-tests` refuses a brief with no `test-verification` lane and this brief
has none by design.

## The delivery took three invocations, and that is a finding, not an accident

`/implement-brief` may make **exactly one** graph write — the brief's status flip, explicitly "no
edges, no other node". But the effective contract also required a new `decision-*` node and a
`subsumes` edge, and **without them the new rule reds the graph**. The work therefore could not be
declared complete inside one invocation. The operator-approved split:

1. `/implement-brief` — steps 1–8 and 10. Ended **red on exactly one finding**, subject
   `intent-status-coherence-d4f2`. No flip, no commit.
2. `/update-spec-graph` — authored `decision-status-coherence-subsumed-3c7e` with both edges. Green.
3. `/implement-brief` — detected the work complete and took the single flip.

The red state in step 1 is not a defect; it is Acceptance 1's red half, **observed** rather than
asserted. Recorded here because the brief's step 9 as written did not work and the correction was a
human decision, not a silent repair.

## What landed

**`tools/handlers/unbacked_addressed.ts` (new)** — walks `spec.nodes` filtered to
`type: intent, status: addressed` rather than `spec.edges` filtered to `selects`. That inversion is
the whole mechanism: `coverage_coherence.ts:78` opens with a `selects` scan, so an intent no
`selects` edge reaches is never visited. Three `detail` branches — no selected proposer, ambiguous
market, broken anchor — each leading with the cheapest correct remedy (revert to `open`) per
amendment 12, and each naming the intent id inside `detail` per amendment 2, because
`formatFinding` (`validator.ts:46-48`) never prints `subject`.

**`tools/handlers/coverage_traversal.ts`** — two new exports. `selectedContracts` is the
**authoritative spelling of "selected"** (amendment 8): it resolves and type-checks both endpoints,
where the const it replaces was a raw target scan. The two spellings disagree on a `selects` edge
with an unresolved source, and every no-double-report criterion rests on both rules meaning the same
thing. `backingContracts` is the amendment-6 predicate, kept in **one named function** so the
degradation amendment 9 warns about is foreclosed by construction.

**`specs/schema/`** — `subsumes: {source: decision, target: intent}` declared, and the
`unbacked-addressed` rule entry inserted after `coverage-coherence`, carrying the honest bound and
the residual grant path in its comment.

**`tools/indexer.ts`** — a `### subsumed by` trail section (amendment 13, the operator's choice over
recording the invisibility as a bound). This **overrides the approved contract's Out-of-scope 6**,
which the amendment permits.

**`CLAUDE.md`** — rule 3 gains the `subsumes` companion paragraph, the mnemonic gains the cross-type
case, and a `Backing, and its honest bound` paragraph states what green does and does not assert.

**Graph data** — `decision-status-coherence-subsumed-3c7e` plus
`edge-selects-status-coherence-subsumed-9c15` and `edge-subsumes-status-coherence-2d38`.

## The pins were proved to bite, not assumed

Amendment 6 is the change's centre, so its power was measured on the **live graph** rather than only
in unit fixtures:

- **Acceptance 1, red half** — remove the `subsumes` edge in a scratch copy, regenerate indexes,
  validate → **exactly one** finding, subject `intent-status-coherence-d4f2`. Regeneration is not
  optional: without it `indexes-fresh` fires alongside and "exactly one" is false.
- **Acceptance 1, green half** — edge present → **0 errors across 21 rules**.
- **Acceptance 2, the laundering path (amendment 6)** — flip `intent-docs-arrow-lint-e7b3` (open,
  zero edges) to `addressed` and append **one** `proposes` edge from the already-selected
  `contract-ci-gate-spec-tool-5039`. Result: **two** `unbacked-addressed` findings — the laundered
  intent **and** `intent-ci-enforcement-gates-5c90`, that contract's own previously-green intent.
  Under the backing definition all three market candidates shared, this produced **zero**. The
  cheapest attack is now a loud regression on someone else's delivered work.
- **The anchor is required, verified** — a decision recording only a subsumption selects nothing, so
  the anchor never holds and the graph stays red with an `unanchored` finding. This is why
  `decision-status-coherence-subsumed-3c7e` carries the `selects` edge.
- **Acceptance 7** — `trails.md` renders a populated `### subsumed by` under d4f2, and a second
  `spec:index` run is byte-identical.

## Test output and validation runs

- `node --test --import tsx tests/*.test.ts` → **319 tests, 319 pass, 0 fail** (was 295; +24).
- `node_modules/.bin/tsc --noEmit` → exit 0.
- `node_modules/.bin/tsx tools/spec.ts index && … validate` → **OK, 21 rules, 0 errors** (was 20).
- Both new bad fixtures verified in isolation: exit 1 with the pinned error, byte-matching
  `expected-errors.txt`.

**Two pre-existing tests were repaired rather than weakened**, both caused by the `selectedContracts`
lift: `tests/coverage_coherence.test.ts`'s `selects()` helper sourced from a `decision-d` node the
file never built, so under the resolving spelling every selected set went empty and F3 flipped — fixed
by making the node resolvable in the factory, with F3's assertion byte-unchanged. And
`tests/fixtures/good/specs/indexes/trails.md` needed regenerating for the new section.

## Capability wiring

Four `touches` edges. Every path in the diff maps; none is unowned outside the confirmed exclusion.

- `specs/schema/**` → **`capability-spec-schema-2c3d`** — the **sensitive-path owning capability**,
  required because `specs/schema/**` is `sensitive_paths`' sole glob.
- `tools/**` → `capability-spec-tooling-1a2b`
- `tests/**` → `capability-spec-tests-3a6e`
- `CLAUDE.md` → `capability-spec-docs-8c1d`

`specs/{nodes,graph,indexes}/**` is intentionally unowned per `decision-graph-data-unowned-2f7b`, so
it triggers no coverage STOP. No file under `.github/` or `.claude/` was touched.

## Amendment discharge

Eleven amendments are directly verifiable in the landed diff and all eleven are present: **1**
(broken-anchor text), **2** (details self-identifying), **3** (CODEOWNERS pin with its bound), **4**
(residual declared), **6** (singleton predicate, proved above), **7** (new decision, not `9f3b`), **8**
(lift plus authoritative spelling), **12** (remedy ordering), **13** (trail section), **14**
(defensive guards), **16** (honest bound with the six-intent residue named). **9**'s two fixture
requirements landed, including the proposes-but-not-selected shape rather than the zero-edge one.
**5** and **10** were discharged by committing atomically in `547b553`. **11** and **15** are
discharged by this node, below.

## Corrections and bounds, recorded rather than quietly fixed (amendments 11 and 15)

1. **The contract's Out-of-scope 1 is contradicted by its Scope 1.** The anchor re-derives a
   coverage verdict — roughly 25 lines including the superseded filter, the exactly-one constraint
   and the `final`-status filter. It is a second coverage notion.
2. **Out-of-scope 3 is contradicted by Behaviour 2.** Letting an intent stand `addressed` with no
   market, no decision selecting a contract for it and no brief is a lifecycle shortcut in the only
   sense at issue.
3. **Scope 2 ("imported, not modified") is false** and was already voided by amendment 8.
4. **`contractCovered` is a second, unshared definition of "covered"** — found independently by
   `test-writer`. Amendment 8's reasoning ("the two rules must mean the same thing by *selected*")
   applies verbatim to *covered* and was not applied to it. It is also **cutoff-blind** where
   `coverage-coherence` grandfathers on `coverage_coherence_from`, so the two genuinely disagree
   about pre-cutoff contracts. Harmless for `contract-lane-integration-convention-body-4c1f`
   (`created: 2026-06-19`, post-cutoff), and **nothing tests the divergence**. This is the clearest
   follow-up this change leaves behind.
5. **Amendment 7 is half satisfied and cannot be fully satisfied.** Authoring a new decision node
   trips `.github/CODEOWNERS` review, which appending an edge from an already-merged decision would
   not — the procedural half. But the anchor still resolves through
   `evidence-lane-integration-9b4c`, the evidence-for-a-different-brief the amendment objected to,
   because `4c1f` is the contract that accounts for d4f2 and `9b4c` is what covers `4c1f`. No graph
   shape available under the anchoring mechanism avoids this.
6. **`4c1f` is now the target of two `selects` edges** — the 2026-06-20 historical selection and this
   change's anchoring re-affirmation. A reader should not infer a second market from the second edge.
7. **Two acceptance items have no test, deliberately.** The whole-graph "nine backed intents by name"
   leg reads the live graph, which was mid-change throughout; and no rule-ordering pin was added,
   because the handler explicitly disclaims order as a precondition per amendment 14 — pinning it
   would assert something the implementation denies.

## What this evidence does NOT claim

It does not claim the guard is unbypassable: the residual grant path is a new
`specs/nodes/contract-*.md` proposing only the target intent plus a `selects` edge, and while
CODEOWNERS covers the contract file, the edge half is unreviewed. Nothing counts or caps how often
that is done, and the rule comment says so. It does not claim coverage: green asserts **provenance**,
and six of the ten addressed intents have selected contracts predating `coverage_coherence_from`, so
they are checked for coverage by neither rule. It does not claim the `subsumes` escape is safe in
general — the anchor proves the subsuming decision delivered *something covered*, never that what it
delivered covers *this* intent; that judgement stays human and is recorded in
`decision-status-coherence-subsumed-3c7e`'s body.
