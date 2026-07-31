---
id: brief-unbacked-addressed-edge-6b73
type: brief
title: Implement the unbacked-addressed guard — singleton-market backing, the `subsumes` edge type, and its trail section
status: draft
created: 2026-07-31
produced_by: "/write-brief"
---

Decomposes `contract-unbacked-addressed-edge-5b71` (approved), honouring the **sixteen amendments**
of `decision-unbacked-addressed-edge-9d3f` and the thirteen common-core findings of
`comparison-unbacked-addressed-7c48`. The effective contract is the contract body **plus** those
amendments; work that satisfies the body while dropping an amendment is not done.

**Routing choice, recorded as the command requires:** class 2 makes lanes optional and this is an
**unlaned single brief**. Consequence, stated here rather than discovered later — `/write-tests`
refuses any brief whose `lane` is not `test-verification` (`.claude/commands/write-tests.md:4-6`),
so verification takes that command's **recoverable action (b)**: the tests in step 8 are written in
an invocation **separate** from the one that writes the code under test. Separation of duties holds;
only the entry point differs.

Ordered so each step keeps `spec:validate` green, except the one window step 9 names explicitly.

## Grounding — reuse, don't reinvent

- `tools/handlers/coverage_traversal.ts` — shared traversal primitives. Exports `liveSourcesByEdge`
  (`:25-31`), `liveProposingContracts` (`:54-60`), `intentsForContract` (`:130-139`, the one export
  taking no `byId` — the precedent for a new `byId`-less signature). Its header (`:3-19`) states the
  two standing conventions: resolve endpoints through the caller's `byId`, and defensively skip both
  unresolved endpoints and `superseded` sources.
- `tools/handlers/comparison_required.ts` — the handler template: doc block, `String(rule.id)` /
  `nodesById(spec)` / `findings: Finding[]` preamble, per-subject guards with inline
  `// unresolved: references_resolve owns it` comments, `findings.push({rule, kind, subject, detail})`.
- `tools/gate.ts:99-121` — the near-miss finding text this brief models branch 3 on.
- `Finding` is `{rule, kind, subject, detail}`, all required strings (`tools/validator.ts:20-25`).

## Step 1 — lift `selectedContracts` (amendment 8)

Add to `tools/handlers/coverage_traversal.ts`, in the top (coverage/quorum) group near
`intentsForContract`:

```ts
export function selectedContracts(spec: LoadedSpec, byId: Map<string, NodeRecord>): Set<string>
```

**The resolving spelling is authoritative** — resolve and type-check both endpoints: the source must
resolve to a `decision`, the target to a `contract` (which also filters `selects → patch`, the case
`coverage_coherence.ts:84` handles after the fact). Amendment 8 requires this choice be *stated*,
because the raw scan and the resolving walk disagree on a `selects` edge with a typo'd decision id,
and all three no-double-report criteria rest on the two rules meaning the same thing by "selected".

Then replace the function-local `const selectedContracts` at `tools/handlers/coverage_coherence.ts:66-71`
with a call to the new export. On the live graph this is a **semantic no-op** — all 11 `selects`
sources resolve to `decision` nodes and all targets are contracts — but see step 8's first item: it
is *not* a no-op on that file's unit tests.

## Step 2 — the backing predicate (amendment 6)

Add to the same file:

```ts
export function backingContracts(spec: LoadedSpec, byId: Map<string, NodeRecord>, intentId: string): Set<string>
```

> A live contract **C backs** intent **I** iff C is a `selects` target (per step 1), C `proposes` I,
> **and `intentsForContract(C)` is exactly `{I}`** — C markets that intent and nothing else.

Compose from `liveProposingContracts` (which already excludes `superseded` sources) and
`intentsForContract` (which already dedupes via a `Set`, so a duplicated `proposes` triple does not
break singleton-ness).

**Why the singleton clause exists — carry this into the doc comment.** A `selects` edge names a
*contract*, not an intent, so it can only be read as endorsing an intent when the contract markets
exactly one. Without it, `proposes` carries no cardinality constraint
(`specs/schema/edge-types.yaml:9-11`) and `specs/graph/edges.yaml` is reached by no
`.github/CODEOWNERS` rule and no `sensitive_paths` glob, so **one appended line** from any of the
eleven already-selected contracts would back any intent — cheaper than this contract's own escape
hatch, which needs a `decision-*` node.

**Verified before adoption, and the brief records it so a reviewer need not re-derive it:** zero
contracts anywhere in the graph propose more than one intent, all 11 `selects` sources resolve to
decisions, and there are no duplicate `proposes` triples. The singleton clause therefore changes the
verdict on **none** of the ten addressed intents. Only d4f2 fires.

Keep the whole predicate in this **one named function**. Amendment 9's failure mode — an
implementation that silently degrades to `liveProposingContracts(i).size > 0` — is only foreclosed
if there is a single unit-tested owner of the rule.

## Step 3 — the handler (amendments 1, 2, 12, 14)

Create `tools/handlers/unbacked_addressed.ts`. Walk `spec.nodes` filtered to
`type: intent, status: addressed`; skip when `backingContracts(...).size > 0`; otherwise apply the
`subsumes` escape (contract Scope 1 / Behaviour 2 — the edge's source decision must `selects` a
contract that is *covered*) and emit one finding.

Three `detail` branches. **Every one leads with the cheapest correct remedy — revert the status flip
to `open`** — and never with the escape hatch (amendment 12). **Every one names the intent id inside
`detail`**, because `formatFinding` (`tools/validator.ts:46-48`) prints `[rule: <id>] <detail>` and
**never prints `subject`** (amendment 2).

1. **No selected proposer** — d4f2's case. Name the live proposing count and that none is selected.
2. **Ambiguous market** — selected contracts propose it but each also markets other intents. New
   with amendment 6; name the offending contracts and the other intents they market.
3. **Broken anchor** — a `subsumes` edge exists but its anchor no longer holds. The contract
   specifies **no text at all** for this branch; model it on `tools/gate.ts:99-121` (amendment 1).

**Amendment 14 — guard defensively, do not rely on rule order.** `runValidation`
(`tools/validator.ts:63-89`) runs every rule unconditionally and never short-circuits, and earlier
rules *report* unresolved endpoints without removing them. `:87` is a bare
`findings.push(...handler(rule, spec))` with **no try/catch**, so a throw here does not produce one
finding — it aborts `spec:validate` and loses every other rule's findings. Skip a node whose `id`
does not resolve rather than dereferencing it.

## Step 4 — register the rule

One import in `tools/validator.ts`'s `:5-18` block and one `HANDLERS` entry (`:29-44`) keyed
`unbacked_addressed`. A kind with no entry surfaces as a normal finding naming the known kinds
(`:77-86`), not a crash.

## Step 5 — schema (amendment 16)

- `specs/schema/edge-types.yaml` — declare, in the `proposes` template shape (`:9-11`) with the
  comment convention `integrates` uses (`:59-62`):

  ```yaml
  subsumes:
    source: decision
    target: intent
  ```

  `edges-type-declared` and `edges-endpoint-types` then enforce it with **no handler change**.

- `specs/schema/validation-rules.yaml` — one entry (`id: unbacked-addressed`,
  `kind: unbacked_addressed`) inserted **after** `coverage-coherence` (`:98-105`) and **before**
  `indexes-fresh` (`:119-120`), preceded by the file's multi-line comment convention carrying:

  1. **The honest bound (amendment 16).** Green asserts every `addressed` intent has one live,
     selected contract that markets it and nothing else. It does **not** assert the work is covered
     — that stays `coverage-coherence`'s verdict, grandfathered at `coverage_coherence_from`.
     **State the residue's size:** six of the ten addressed intents (`a3f1`, `f367`, `5c90`, `c7b1`,
     `b9c4`, `7ada`) are backed by a contract created before 2026-06-18 and so are checked for
     coverage by neither rule.
  2. **The A6 residual (amendment 4's declare-rather-than-absorb idiom).** The remaining grant path
     is a new `specs/nodes/contract-*.md` proposing only the target intent plus a `selects` edge.
     `.github/CODEOWNERS:4` covers the contract file; the edge half is unreviewed.
     `class-market-quorum` raises the class-2+ case to two reviewed contract files. Nothing counts
     or caps how often this is done.

## Step 6 — the trail section (amendment 13)

`tools/indexer.ts`: one `viewSourcesOf` call in the `:175-180` chain (sources of `subsumes` into the
intent, parallel to `contracts` at `:175`) and one tuple in the fixed section list at `:182-189`.
Nothing is needed at `:197-199` — that special case is keyed on `label === "briefs"` and only
governs extra columns.

This **overrides the approved contract's Out-of-scope 6**, which amendment 13 permits. Without it,
`serializeTrails`' six fixed sections exclude `subsumes` and d4f2 keeps rendering six `_none_`
blocks — the reader's first stop asserting nothing exists while an edge does.

## Step 7 — governing doc

`CLAUDE.md`: the edge vocabulary gains `subsumes` with its endpoint rule; the rule-3 neighbourhood
states it is the **cross-type** provenance edge that changes **no** node's status, unlike
`supersedes` (`source: any, target: same_as_source`, which does carry a status consequence two
consumers read); plus the honest bound of step 5.

## Step 8 — tests (amendments 3, 9)

1. **`tests/coverage_coherence.test.ts` — do this first or the suite breaks mysteriously.** Its
   `selects()` helper (`:34`) hard-codes `source: "decision-d"` and **no test in the file ever builds
   that node**. Under step 1's resolving spelling every test's selected set goes empty,
   `wonElsewhere` (`coverage_coherence.ts:159-162`) becomes permanently false, and the F3 case at
   `:470-494` flips to a finding. Fix surgically: append `node({id: "decision-d", type: "decision"})`
   inside the `spec()` factory (`:9-20`) with a one-line comment saying why. A decision node with no
   edges is inert for every other assertion in the file.
2. **`tests/unbacked_addressed.test.ts` (new)** — idiom of `tests/coverage_coherence.test.ts`: local
   `node()` / `spec(nodes, edges)` factories building a `LoadedSpec` literal, handler invoked
   directly, no CLI and no filesystem. Cases, in this order:
   - **Negative control first** — selected contract, single `proposes`, intent addressed →
     `deepEqual(f, [])`. Without it the headline case can pass for the wrong reason.
   - **Amendment 6 headline** — add one `proposes` edge from that same contract to a second
     addressed intent → **two** findings, subjects both intents, `detail` matching the ambiguity
     wording. This is the laundering path, and the point is that the attack costs the contract its
     own previously-green intent.
   - **Amendment 9's discriminator** — addressed intent, three live proposing contracts, **no**
     `selects` edge → exactly one finding. This is the case that kills the
     `liveProposingContracts(i).size > 0` mis-implementation, which passes every zero-edge fixture.
   - **Dedup** — duplicate `proposes` triple does not trip the singleton clause → `deepEqual(f, [])`.
   - **Unresolved `selects` source confers nothing** — same graph as the negative control with the
     decision node omitted → one finding.
   - **Whole-graph no-regression** — the nine backed intents asserted by name (contract Acceptance 2).
3. **`tests/coverage_traversal.test.ts`** — direct assertions on `selectedContracts` and
   `backingContracts`.
4. **`tests/lane_integration_meta.test.ts`** — extend the kind loop at `:30-48` with
   `"unbacked_addressed"`. This is the **real** dispatch oracle: it is hard-coded to two kinds and
   does not enumerate `HANDLERS`.
5. **Fixtures.** `tests/fixtures/bad/unbacked-addressed/` — per amendment 9 this must be an addressed
   intent carrying live `proposes` edges but **no** `selects` edge, **not** the zero-edge shape the
   contract describes. `tests/fixtures/bad/subsumes-wrong-endpoint/` — a `brief —subsumes→ intent`
   edge expecting `edge_endpoint_types.ts:34`'s message. Each fixture carries its own partial copy of
   the three schema files, per house convention.
6. **`tests/spec.test.ts`** — add **both** new fixture names to the hard-coded array at `:106-122`.
   There is **no `readdirSync` over `tests/fixtures/bad` anywhere in the repo**, so a fixture omitted
   from that array is silently never run and the suite stays green with a dead fixture on disk.
7. **Do NOT add the new kind to `tests/fixtures/bad/dispatch-all-kinds/`.** Its two-sided pin at
   `tests/spec.test.ts:216-217` reds both when a rule fires that is absent from `expectedPerRule` and
   when a map key does not fire, so adding the rule without a firing subject reds and with one reds
   the count map. Its "each kind exactly once" header is already false — 14 kinds are registered and
   6 are exercised. The contract's Acceptance 7 ("passes unchanged") holds precisely by not touching
   it.
8. **Amendment 3** — pin the `.github/CODEOWNERS` glob by executable test, carrying its bound: the
   test proves the **pattern matches**, never that code-owner review is *enabled*, which
   `docs/branch-protection.md:5-7` records as repo-admin state not reproducible from files.

## Step 9 — graph data, via graph-maintainer (amendments 5, 7, 10)

**Amendment 7 forbids reusing `decision-lane-integration-9f3b` as the anchor.** Its evidence,
`evidence-lane-integration-9b4c`, is the "evidence body that evidences a DIFFERENT intent" that
`intent-unbacked-addressed-guard-8c4e:17-20` names as *the* anti-pattern, and it already backs
`intent-lane-model-integration-a1f7`. Instead: author a **new** `decision-*` node recording the
subsumption judgement for d4f2 specifically, plus one
`<new-decision> —subsumes→ intent-status-coherence-d4f2` edge. This also puts the first grant behind
`.github/CODEOWNERS:9`, which reusing an already-merged decision does not.

**Amendments 5 and 10 — the revert story, which the contract omits entirely.** The
`edge-types.yaml` declaration, the `subsumes` edge and the regenerated `specs/indexes/` land in
**one commit**, in that order within the commit. A code-only revert that leaves the edge in
`edges.yaml` hard-reds `edges-type-declared` on `main` for changes unrelated to this one, and
edge-before-declaration reds the same rule while rule-before-edge reds `unbacked-addressed`. Only the
atomic commit is green. Name `specs/indexes/` as the fourth artifact — `indexes-fresh` runs over all
six files and the new edge mutates `incoming.yaml`, `outgoing.yaml` and now `trails.md`.

## Step 10 — corrections to the contract's own text (amendment 11)

Record in the evidence, do not silently fix: the contract's **Out-of-scope 1** ("this rule adds no
second coverage notion") is contradicted by its Scope 1, because the anchor re-derives a coverage
verdict — roughly 25 lines including the superseded filter, the exactly-one constraint and the
`final`-status filter, none of which `coverage_traversal.ts` exports as an assembly. Its
**Out-of-scope 3** ("grants no lifecycle shortcut") is contradicted by Behaviour 2, since letting an
intent stand `addressed` with no market, no decision selecting a contract for it and no brief is a
lifecycle shortcut in the only sense at issue. Its **Scope 2** ("imported, not modified") is false
and is already voided by amendment 8.

## Acceptance (amendment 15 governs item 1)

1. **Red-then-green self-application, with the run named.** Amendment 15 and CLAUDE.md's paste-only
   clause require this leg to name **the run that discharges it** and **the remediation if it
   fails** — a `drift-finding` plus a rule 5 route. The run: in a scratch copy, remove the `subsumes`
   edge, **regenerate indexes**, then `spec:validate` → **exactly one** finding, subject
   `intent-status-coherence-d4f2`. Regeneration is not optional: without it `indexes-fresh` fires
   alongside and "exactly one" is false.
2. **The laundering path is closed and tested (amendment 6).** Appending one `proposes` edge from an
   already-selected contract to an unrelated addressed intent yields **two** findings, not zero.
3. **Whole-graph no-regression.** After the edge lands, `spec:validate` is clean; the nine backed
   addressed intents produce no finding, asserted by name.
4. **Endpoint enforcement is free.** The wrong-endpoint fixture proves the declaration needed no
   handler change. Bound, per the qa-test finding: this proves the *handler* enforces that fixture's
   own schema copy, not that the shipped declaration is correct.
5. **Dispatch pinning** via the `lane_integration_meta.test.ts` kind loop, not via
   `dispatch-all-kinds`.
6. **No double-report.** An addressed intent whose selected contract is uncovered yields exactly one
   finding, from `coverage-coherence`.
7. **The trail renders.** `trails.md` shows d4f2 with a populated `### subsumes` section, and a
   second `spec:index` run is byte-identical.

## Verification

```bash
node --test --import tsx tests/unbacked_addressed.test.ts
node --test --import tsx tests/coverage_coherence.test.ts    # F3 green after the decision-d fix
node --test --import tsx tests/*.test.ts
node_modules/.bin/tsc --noEmit
node_modules/.bin/tsx tools/spec.ts index && node_modules/.bin/tsx tools/spec.ts validate
```

`pnpm` is broken in this environment; the tsx invocations above are equivalent. Then run acceptance
1 and 2 as scratch-copy mutations and record both outputs verbatim — the pins are proved to bite,
not assumed.

## Out of scope

No `/specs/graph/` entry in `.github/CODEOWNERS` — routed out by the decision as a follow-up intent
under rule 5, and the highest-value change this review surfaced outside the three candidates. No
guard on the `rejected` exit. No status-transition attribution field, which would edit
`node-types.yaml`, the sole `sensitive_paths` glob. No change to `coverage-coherence`'s verdict or
cutoff and no backfill of the nine backed intents. No `override` or waiver work. No dated scalar. No
second command gaining a graph write. `specs/{nodes,graph}/**` stays intentionally unowned per
`decision-graph-data-unowned-2f7b`.

## Capability wiring (confirm the globs at evidence time)

Expected `touches` targets: `capability-spec-tooling-1a2b` (`tools/**`),
`capability-spec-tests-3a6e` (`tests/**`), `capability-spec-docs-8c1d` (`CLAUDE.md`), and
`capability-spec-schema-2c3d` — **required**, because `specs/schema/**` is `sensitive_paths`' sole
glob and a sensitive-path change must `touches` its owning capability. Confirm each glob against
`specs/indexes/by-type.yaml` at evidence time rather than trusting this list; the last brief's
capability note was wrong and the confirmation is what caught it.
