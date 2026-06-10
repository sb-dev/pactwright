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

## Lifecycle

```
 intent ──proposes──▶ contract(candidate)
                             │
                             │  human review records a:
                             ▼
                      decision ──selects──▶ contract(approved)
                                                   │
                                                   │  decomposed by:
                                                   ▼
                                                brief ──evidences──▶ evidence
                                            (draft → approved →
                                                implemented)
```

1. **Intent** — capture *why* / *what problem*. Status starts `open`.
2. **Candidate contracts** — one or more `contract` nodes propose ways to
   address the intent (`proposes` edge: contract → intent). Status
   `candidate`.
3. **Decision** — a human picks one. Record a `decision` node and a
   `selects` edge: decision → chosen contract. Losing candidates move to
   `rejected`.
4. **Approved contract** — chosen contract moves to `approved`.
5. **Brief** — decompose the approved contract into implementable scope.
   `decomposes` edge: brief → contract. Brief moves `draft` → `approved` →
   `implemented`.
6. **Evidence** — once implementation lands, attach `evidence` nodes (test
   runs, benchmark output, links). `evidences` edge: evidence → brief.
   Once evidence covers the brief, the originating intent moves to
   `addressed`.

**Superseding** — any node can be replaced via a `supersedes` edge of the
same type. The superseded node is kept; only its status changes.
