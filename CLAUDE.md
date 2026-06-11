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
