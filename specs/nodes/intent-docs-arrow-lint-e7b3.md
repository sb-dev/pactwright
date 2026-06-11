---
id: intent-docs-arrow-lint-e7b3
type: intent
title: Lint arrow semantics in repository markdown
status: open
created: 2026-06-11
---

## Rule

A lint (standalone script, or a `spec:check-diff` rule) flags any arrow
(`→` or `->`) that sits between two node-type names — `intent`,
`contract`, `brief`, `decision`, `evidence` — in repository markdown,
**outside an edge declaration**.

The only place arrows of this shape are canonical is inside
`specs/graph/edges.yaml` (and equivalent generated views in
`specs/indexes/`). Everywhere else — CLAUDE.md, READMEs, node bodies,
PR descriptions — an arrow between node-type names must be read as the
canonical edge direction (source → target), per CLAUDE.md rule 4.

## Origin

Phase 1 review. The CLAUDE.md lifecycle diagram was initially authored
with arrows pointing forward in time (e.g. `contract → decision →
brief`), inverting canonical edge direction. The narrative arrows became
visually indistinguishable from edge arrows, so a careful reader could
not tell whether a doc was describing time or provenance. This lint
prevents the same drift on future doc edits.
