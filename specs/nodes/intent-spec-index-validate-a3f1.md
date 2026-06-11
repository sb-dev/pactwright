---
id: intent-spec-index-validate-a3f1
type: intent
title: Build spec:index and spec:validate tooling for the /specs graph
status: open
created: 2026-06-11
---

## Problem

The `/specs/` graph is the canonical source of truth for intents,
contracts, briefs, decisions, and evidence. Today it consists of flat
node files plus a single `edges.yaml`. With nothing more than that:

- Navigating relationships (what proposes intent X, what evidences brief Y)
  requires scanning every edge by hand.
- Corruption can creep in silently — dangling edge endpoints, duplicate
  IDs, nodes whose type or status falls outside the schema, edges whose
  source→target pair is not allowed, missing required frontmatter fields,
  and committed indexes that have drifted from the underlying data.

We need two pieces of tooling that together keep the graph navigable and
trustworthy: one that derives lookup views from canonical data, and one
that fails CI when the graph violates its own schema.

## What `spec:index` must produce

Generate the following files from canonical nodes and edges:

- `indexes/incoming.yaml` — for each node, the edges pointing at it.
- `indexes/outgoing.yaml` — for each node, the edges originating from it.
- `indexes/by-type.yaml` — nodes grouped by `type`.
- `indexes/unresolved.yaml` — edges whose `source` or `target` does not
  resolve to an existing node.

## What `spec:validate` must check

- Unique node IDs across `/specs/nodes/`.
- Unique edge IDs across `/specs/graph/edges.yaml`.
- Every edge `source` and `target` resolves to an existing node.
- Every node `type` and edge `type` is declared in the schema.
- Every edge's `source.type` → `target.type` pair is allowed by
  `/specs/schema/edge-types.yaml` (including the `same_as_source` rule for
  `supersedes`).
- All `required_fields` are present on every node and every edge.
- The committed contents of `/specs/indexes/` exactly match the output of
  a fresh `spec:index` run (no drift between canonical data and
  committed views).

## Operational requirements

- Both commands are runnable via `pnpm` (e.g. `pnpm spec:index`,
  `pnpm spec:validate`).
- Output is deterministic — stable key ordering, stable file formatting —
  so re-running on unchanged input produces byte-identical results.
- Non-zero exit code on any failure, suitable for use as a CI gate.
