---
id: brief-lifecycle-thin-commands-705d
type: brief
title: Implement thin lifecycle commands delegating to four fat agents
status: implemented
created: 2026-06-13
---

## Scope

Implement `contract-lifecycle-thin-commands-7c20` (as modified by
`decision-lifecycle-thin-commands-41c8`): four agent files under
`.claude/agents/` carrying all behaviour and graph rules, and eight
thin command files under `.claude/commands/` that parse `$ARGUMENTS`,
locate context via `specs/indexes/`, and delegate. graph-maintainer is
the sole writer of canonical graph data (`specs/nodes/` and
`specs/graph/edges.yaml`); spec-writer and spec-critic draft content
but never write node or edge files themselves.

## Files to create — `.claude/agents/`

- `spec-writer.md` — drafts candidate contracts (2–3 per intent,
  distinct trade-offs, closing comparison table, never selects) and
  briefs; hands all graph writes to graph-maintainer.
- `spec-critic.md` — adversarial reviewer; drafts `## Critique`
  sections covering ambiguity, missing cases, and scope creep; hands
  writes to graph-maintainer.
- `graph-maintainer.md` — sole writer of `specs/nodes/` and
  `specs/graph/edges.yaml`; owns ID conventions, frontmatter fields,
  status transitions, supersede-don't-delete, and the closing
  index+validate postcondition.
- `contract-reviewer.md` — approval support; summarises candidates and
  confirms a selection's consequences (chosen → approved, siblings →
  rejected, intent stays open).

## Files to create — `.claude/commands/`

- `capture-intent.md` — parse `$ARGUMENTS` as the intent text
  (multi-line quoted text supported); delegate to graph-maintainer to
  create the intent node (status: open).
- `propose-contracts.md` — resolve the intent via indexes; spec-writer
  drafts 2–3 candidates with `proposes` edges; ends with a comparison
  table; never selects.
- `review-contracts.md` — resolve all candidate contracts for the
  intent via indexes; spec-critic critiques each; graph-maintainer
  appends the `## Critique` sections.
- `approve-contract.md` — decision node + `selects` edge; chosen →
  `approved`, sibling candidates → `rejected`; intent stays `open`;
  notes go in the decision body.
- `write-brief.md` — one brief node + `decomposes` edge; the brief
  names files, script entries, libraries, ordered implementation
  steps, and non-scope.
- `implement-brief.md` — follow edges to the brief and its contract;
  implement exactly what the brief says; if the brief seems wrong,
  stop and ask — never expand scope silently; performs no graph
  writes.
- `prepare-evidence.md` — evidence node + `evidences` edge; brief →
  `implemented`; walk edges back (brief —decomposes→ contract
  —proposes→ intent) to set the intent → `addressed`; regenerate
  indexes.
- `update-spec-graph.md` — direct graph-maintainer invocation for
  ad-hoc graph changes.

## Shared conventions

- **`$ARGUMENTS` parsing.** Where a command takes a node ID, the first
  whitespace-delimited token of `$ARGUMENTS` is the ID and any
  remainder is free text (e.g. `/approve-contract <id> [notes]`).
  `/capture-intent` and `/update-spec-graph` instead treat the whole
  of `$ARGUMENTS` as text; `/capture-intent` must accept multi-line
  quoted text without mangling line breaks.
- **Context loading.** Commands and agents locate nodes and
  relationships through `specs/indexes/` (`incoming.yaml`,
  `outgoing.yaml`, `by-type.yaml`) and then read only the named node
  files. Never glob `specs/nodes/` to discover relationships.
- **Postcondition.** Every mutating step ends with
  `pnpm spec:index && pnpm spec:validate`; on failure, report the
  errors and do not commit.
- **Thinness.** Command files stay ≤ 15 lines, contain no graph rules
  (no ID conventions, no status transitions), and delegate to exactly
  one agent.

## Implementation order

1. `graph-maintainer.md` — every mutating path depends on it.
2. `spec-writer.md`, `spec-critic.md`, `contract-reviewer.md`.
3. Mutating commands: `capture-intent.md`, `update-spec-graph.md`,
   `approve-contract.md`, `prepare-evidence.md`.
4. Drafting commands: `propose-contracts.md`, `review-contracts.md`,
   `write-brief.md`.
5. `implement-brief.md` — the only non-mutating command.

## Out of scope (explicit)

- No CI workflows (no `.github/` changes).
- No drift review mechanism between agent files.
- No patch market.
- No changes to `tools/`, `specs/schema/`, or validation rules.
- No new node types, edge types, or lifecycle steps.

## Acceptance test

One trivial change run end-to-end through commands only, with zero raw
prompts used for lifecycle steps:

1. `/capture-intent` with a toy intent (e.g. fix a typo in a doc).
2. `/propose-contracts <intent-id>` → 2–3 candidates + edges + table.
3. `/review-contracts <intent-id>` → Critique sections appended.
4. `/approve-contract <chosen-id>` → decision + selects edge; statuses
   flip; intent stays open.
5. `/write-brief <contract-id>` → brief + decomposes edge.
6. `/implement-brief <brief-id>` → the trivial change lands.
7. `/prepare-evidence <brief-id>` → evidence + evidences edge; brief
   `implemented`; intent `addressed`.

Pass criteria: every step's graph writes validate green
(`pnpm spec:validate`, 0 errors), the final intent is `addressed`, and
no lifecycle step required a raw prompt.

## Verification

- After the `.claude/` files land: `pnpm spec:validate` green on the
  real `/specs` tree (the files are outside the graph; this is a
  no-regression check).
- Grep check per the contract's acceptance example 5: no
  status-transition or ID-convention text in any
  `.claude/commands/*.md`; every command file ≤ 15 lines.
- The acceptance test above executed on a scratch branch, with its
  graph artifacts discarded afterwards (or kept as the first real use,
  at the operator's discretion).
