---
id: intent-wave-persistence-5c93
type: intent
title: Persist each lane brief's wave assignment as an optional `wave` frontmatter field
status: open
created: 2026-07-30
class: 2
produced_by: "/capture-intent"
---

Persist each lane brief's wave assignment as a documented optional `wave`
frontmatter field on `brief` in specs/schema/node-types.yaml, and have /decompose-lanes write it,
so status.md's `wave` column can populate. CC-11 of comparison-conveyor-market-890e requires the
wave be persisted on each lane brief; the conveyor change discharged only the rendering half —
api-integration writes the wave as brief-body prose and declined the field as data-migration's
surface, data-migration never lists it, and domain-backend's views read a field that does not
exist. Class 2.

## Source

Captured from `integration-conveyor-derived-4d19`'s `## follow-ups` item 2, which named this as
**mandatory under scope-integrity rule 5** — the second branch, *contract incomplete, intended
behaviour unchanged*. The text above is that node's verbatim capture instruction.

The gap is one only integration could see, and it is a silent one: three lanes of
`contract-conveyor-derived-4c8c` each reasoned correctly and locally about `wave` and the
requirement fell between them. `brief-conveyor-commands-c14d:245-248` writes the wave into the lane
brief's **body prose** and explicitly declines a `wave` frontmatter field, on the ground that the
field "would be `data-migration`'s schema surface". `brief-conveyor-resolver-3f7a:260-265` specifies
the two index views against a **persisted** `wave` — a frontmatter read — and `:480-486` records the
resulting asymmetry itself, saying the integration node should resolve it.
`brief-conveyor-schema-graph-8b2e` never mentions `wave` at all. No lane declares the field.

Net effect in the merged tree: `specs/indexes/status.md` renders a `wave` column that can never
populate, with its legend line documenting `wave: —` as the permanent value. The graph stays **green**
— unknown frontmatter validates and the view read is total — so nothing reds, and a reader has no
signal distinguishing "this lane was not waved" from "this column cannot work". That silence is why
this was captured rather than left as a note.

Bound worth carrying into the contract market: `owner` is schema-documented and optional while `wave`
is neither, so the two fields the lane market depends on are asymmetric. Whether to close that by
declaring `wave` alongside `owner`, by having the views read the body prose that already exists, or by
dropping the column belongs to the proposal market, not to this capture.

**Class rationale.** Class 2 as stated in the input text, consistent with this repo's precedent for
schema-touching follow-up intents (`intent-malformed-cutoff-finding-b3d7`, also class 2, also a
`specs/schema/**` change). A case exists for class 3 on the multi-surface test — a resolution
plausibly touches `specs/schema/node-types.yaml`, `.claude/commands/decompose-lanes.md` and
`tools/indexer.ts` — and a contract may revise the class upward with recorded rationale under
CLAUDE.md's work-class routing, which is the sanctioned place for that call.
