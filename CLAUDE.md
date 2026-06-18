# pactwright — file-based spec graph

This repository is a **graph of specifications** stored as plain files. The
graph is the source of truth for what we intend to build, what we've agreed
to build, and what we've actually built.

## Structure

```
/specs/
├── schema/
│   ├── node-types.yaml        # allowed node types + required fields
│   ├── edge-types.yaml        # allowed edge types + source→target rules
│   └── validation-rules.yaml  # cross-cutting graph invariants (stub)
├── nodes/                     # one file per node: <id>.md, flat layout
├── graph/
│   └── edges.yaml             # ALL relationships between nodes
├── indexes/                   # generated views (never hand-edit)
└── reports/                   # generated reports (never hand-edit)
```

### Where canonical truth lives

- **Nodes** — `/specs/nodes/<id>.md`. YAML frontmatter (`id`, `type`,
  `title`, `status`, `created`) followed by a markdown body.
- **Edges** — `/specs/graph/edges.yaml` ONLY. Each edge has `id`
  (`edge-<slug>-<4 hex>`), `source`, `type`, `target`, `created`.
- **Schema** — `/specs/schema/`. Constrains what nodes and edges may exist.
- **Indexes & reports** — derived artifacts. Regenerate; never edit.

### Node IDs

`<type>-<slug>-<4 hex chars>` — e.g. `intent-spec-tooling-7f3a`,
`contract-cli-flag-parsing-b21d`.

## Rules

1. **Relationships go in `edges.yaml` only.** Do not encode "this contract
   proposes intent X" inside a node body as canonical data. Prose in node
   bodies may *reference* other nodes for context, but the relationship
   itself only exists if there is an edge for it.
2. **No implementation without an approved contract and a brief.** If you
   are about to write production code and there is no `contract` (status
   `approved`) plus a `brief` decomposing it, stop and create them first.
3. **Never delete nodes — supersede them.** When a node is wrong or
   replaced, create the new node and add a `supersedes` edge from new → old.
   Move the old node's status to its terminal value (e.g. contract →
   `superseded`). The history must remain readable.
4. **Arrows mean edges, not time.** An arrow (→) anywhere in this
   repository's docs means canonical edge direction (source → target),
   never lifecycle order. Lifecycle order is written as numbered steps.
5. **Scope-integrity — record why scope moves; never absorb drift
   silently.** Whenever any review (contract, patch, or integration)
   reveals the approved contract or brief was wrong:
   - *Brief boundary wrong, contract intact* — supersede the brief with a
     corrected brief (`supersedes` edge). Never edit an approved brief in
     place.
   - *Contract incomplete, intended behaviour unchanged* — capture a
     follow-up intent (`/capture-intent`) for the missing scope. Do not
     widen the current contract silently.
   - *Selected work changes the intended behaviour* — stop and return to
     human approval. A new `decision` node is required before proceeding.

## Lifecycle (numbered steps; each shows the edge it authors)

1. Intent captured (status: open)
2. Candidate contracts proposed      contract —proposes→ intent
3. Human selection                   decision —selects→ contract
   (chosen contract becomes approved, siblings rejected; intent stays open)
4. Brief written                     brief —decomposes→ contract
5. Implementation (code only; no graph writes)
6. Evidence prepared                 evidence —evidences→ brief
   (brief becomes implemented; intent becomes addressed)

Mnemonic: edges point backwards in time, from the newer record to what
it is about — provenance, like citations. Superseding follows the same
shape: a same-type successor points back via `supersedes` (newer
—supersedes→ older); the superseded node stays in place, its status
moved to its terminal value.

## Work-class routing

Every intent is classified at capture; its contracts inherit the class and
may revise it with recorded rationale in the contract body. The class routes
how much process a change earns. `class` is a required integer field (0–3) on
every `intent` and `contract`, range-checked by the `nodes-class-in-range`
validation rule.

| Class | Change | Proposal market | Critics | Lanes | Patch market | Human gates |
|-------|--------|-----------------|---------|-------|--------------|-------------|
| 0 | Trivial mechanical (typo, dependency bump, comment) | skipped — one contract, one brief | spec-critic only | none | none | none |
| 1 | Simple low-risk change on a single surface | one candidate + one brief permitted | spec-critic only | none | none | none |
| 2 | Meaningful product or technical change | required (≥2 candidates) | specialist critics where the change touches their surface | optional | optional per brief | none beyond selection |
| 3 | High-risk or ambiguous; anything touching security, privacy, compliance, payments, or production-sensitive paths; or any multi-surface change | required (≥2 candidates) | full specialist critic panel | required | available per lane | explicit, at contract selection AND at integration |

The "≥2 candidates" bar for class ≥2 is machine-enforced: the
`class-market-quorum` validation rule fails the graph when a selected
(`selects`-edged) class-≥2 intent has fewer than two live (non-superseded)
candidate contracts — so **an under-proposed class-≥2 approval cannot stand in
a green graph / cannot merge.** `/propose-contracts` and `/approve-contract`
also refuse up front in the normal path; the validation rule is the
unbypassable backstop, not the only line of defence.

### Critic routing

`/review-contracts` routes critics by the intent's `class` and the candidates'
declared scope — there is no code diff at proposal time, so routing reads each
candidate's `## Scope`, never a diff:

- **Class 0–1** — `spec-critic` only.
- **Class 2** — `spec-critic` plus the specialist critics whose surface the
  candidates' scope touches (when scope is ambiguous, route in *more* critics,
  never fewer):
  - UI: `ux-critic`
  - payments or personal data: `security-privacy-critic` and `compliance-risk-critic`
  - schema or service-boundary: `architecture-critic`
  - testing: `qa-test-critic`
  - runtime or ops: `reliability-ops-critic`
  - cost or maintainability: `cost-maintainability-critic`
  - release or rollout: `release-critic`
  - product or value: `product-critic`
- **Class 3** — `spec-critic` plus the full specialist panel (all nine),
  regardless of apparent surface.

Anything touching security, privacy, compliance, payments, production-sensitive
paths, or multiple surfaces is already **Class 3** by the table above, so the
full panel is the backstop for the class-2 scope-text heuristic. A perspective
routed in but finding nothing is recorded as an explicit "no concern on this
axis" — distinct from an axis never routed, so silence is never read as a clean
bill.

### Proposal comparison

A class-2+ review ends by recording exactly **one** `comparison` node per market
(`comparison —compares→ contract`, one edge per live candidate). Its body holds
the candidate trade-off table, the critic findings grouped by perspective, and
the case against each candidate; that body structure is a command/graph-maintainer
convention, not a validation rule. The comparison is the durable record of *why
the losers lost* — `/approve-contract`'s `decision` cites it, and it is never
superseded by selection; re-running `/review-contracts` replaces the existing
comparison rather than authoring a second.

The gate is dated. `comparison_required_from` (in `schema/validation-rules.yaml`,
currently `2026-06-18`) is the cutoff: a `selects` decision on a Class 2 or 3
contract **created on or after** the cutoff is valid only if a `comparison` node
already covers the live candidate set with at least two `compares` edges —
machine-enforced by the `comparison-required` validation rule. Contracts created
**before** the cutoff, and any class-≤1 selection, are grandfathered: the rule
skips them, so every pre-cutoff selection stays green with no comparison and **no
backfill** is performed.

The optional free-text `produced_by` field records the agent or human that
authored a node body. It is provenance plumbing for future agent scorecards,
never a gate: it may be absent or hold any value, and no validation rule reads
it.
