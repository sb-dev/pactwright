---
id: intent-implement-brief-graph-lane-b3f5
type: intent
title: Define how a lane whose deliverable is graph data is implemented within the lifecycle
status: open
created: 2026-07-29
class: 2
produced_by: "/capture-intent"
---

## Problem

The lifecycle has no route for implementing a brief whose deliverable **is** graph data. Three facts
collide:

1. **`.claude/commands/implement-brief.md:8`** — "this command performs no graph writes and
   delegates to no agent."
2. **`CLAUDE.md:71`**, lifecycle step 5 — "Implementation (code only; no graph writes)".
3. **`.claude/agents/graph-maintainer.md:8-11`** — "You are the sole writer of specs/nodes/ and
   specs/graph/edges.yaml — spec-writer and spec-critic draft content and hand it to you; they
   never write graph files themselves." The same rule is stated in that agent's frontmatter
   description (quoted at `:4-5`: "Sole writer of specs/nodes/ and specs/graph/edges.yaml").
   *Verified location:* this rule lives in the agent file, **not** in CLAUDE.md — CLAUDE.md names
   graph-maintainer exactly once, at `:137`, and only in passing ("a command/graph-maintainer
   convention", `:137-138`).

Taken together, the command that must implement such a brief may not write the graph itself (2, 3)
and may not delegate to the one agent that may (1). The brief is therefore unimplementable as
written by `/implement-brief`, with no documented alternative route.

`brief-conveyor-schema-graph-8b2e` is a live instance. Its Scope-14 slice is ten `touches` edges
(step 5, `:317-330`), two capability-node edits (step 4, `:303-316`) and four new node files
(steps 6-8, listed under `## Files to create`, `:236-252`) — and that section says of those files
that they are "all authored by graph-maintainer (the sole writer of `specs/nodes/` and
`specs/graph/edges.yaml`)" (`:238-239`). The brief is right about who must write them; what is
missing is any lifecycle account of how `/implement-brief` gets there.

## Goal

Define how a graph-data lane is implemented within the lifecycle: which command implements a brief
whose deliverable is nodes and edges, and how the no-graph-writes rule and the sole-writer rule are
both satisfied by that route. This intent does **not** propose a solution — that is the contract
market's job.

Adjacent precedent, recorded because it bounds the problem, not because it solves it. Amendment
**A7** of `decision-conveyor-derived-5a91` (`:96-102`) already amends this exact prohibition:
`/implement-brief` flips its brief from `approved` to `implemented` "via graph-maintainer as its
single graph write, and CLAUDE.md lifecycle step 5 is amended from 'code only; no graph writes'
accordingly", and "graph-maintainer remains the sole writer — the flip goes through it" (`:102`).
That decision records the amendment under scope-integrity rule 5's third branch as approved
intended behaviour (`## Rule-5 declaration (A7)`, `:155-161`). A7 therefore establishes that step
5's blanket prohibition is **already** too strict — but it authorizes exactly one status flip on
the brief being implemented, not graph data as a deliverable. The gap named here is one A7 does not
close.

## Source

**Authorization.** This intent is not in `brief-conveyor-schema-graph-8b2e`. It was authorized by
the human during that brief's implementation, under CLAUDE.md scope-integrity rule 5's second branch
(`:58-60`): "*Contract incomplete, intended behaviour unchanged* — capture a follow-up intent
(`/capture-intent`) for the missing scope. Do not widen the current contract silently." The missing
scope is captured here rather than absorbed into the running lane.

Hit while implementing `brief-conveyor-schema-graph-8b2e` — the `data-migration` lane of
`contract-conveyor-derived-4c8c` — on 2026-07-29.

**Interim resolution taken there**, recorded so the workaround stays visible instead of hardening
into silent practice: the lane was split across two commands. `/implement-brief` did the
`specs/schema/node-types.yaml` edits (brief steps 1-3), and `/update-spec-graph` — which exists
precisely for an "Ad-hoc /specs graph change via graph-maintainer"
(`.claude/commands/update-spec-graph.md:2`) — did the Scope-14 graph data (brief steps 4-8). That
split respects both constraints, but it means **one brief needs two commands**, which no lifecycle
document describes: CLAUDE.md's numbered lifecycle has a single implementation step, and no command
or agent file states that a brief may legitimately be implemented by more than one invocation.

Likely class 2 — a command-contract change (`implement-brief.md`, possibly `update-spec-graph.md`)
plus a CLAUDE.md lifecycle edit.
