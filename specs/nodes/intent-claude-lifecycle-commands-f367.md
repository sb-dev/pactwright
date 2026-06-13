---
id: intent-claude-lifecycle-commands-f367
type: intent
title: Add Claude Code agents and slash commands covering every lifecycle step
status: addressed
created: 2026-06-12
---

## Problem

Every step of the spec-graph lifecycle — capturing an intent, proposing
contracts, reviewing them, approving one, writing a brief, implementing
it, preparing evidence — is currently driven by a raw prompt. The
operator must restate the rules from `CLAUDE.md` each time, and nothing
prevents a session from skipping steps, writing edges into node bodies,
or committing a graph that fails validation.

We want Claude Code agents and slash commands so that no lifecycle step
needs a raw prompt.

## Agents (`.claude/agents/`)

- **spec-writer** — drafts candidate contracts and briefs.
- **spec-critic** — reviews candidate contracts adversarially.
- **graph-maintainer** — performs canonical graph writes (nodes,
  edges, statuses, index regeneration).
- **contract-reviewer** — supports the approval step.

## Commands (`.claude/commands/`)

- `/capture-intent <text>` — create an intent node (via
  graph-maintainer).
- `/propose-contracts <intent-id>` — spec-writer drafts 2–3 candidate
  contracts with distinct trade-offs plus their `proposes` edges, and
  ends with a comparison table. It never selects a winner.
- `/review-contracts <intent-id>` — spec-critic reviews every candidate
  for ambiguity, missing cases, and scope creep, appending a Critique
  section to each contract node.
- `/approve-contract <id> [notes]` — create the decision node and
  `selects` edge; the chosen contract becomes `approved`, siblings
  become `rejected`; the intent stays `open`. Notes go in the decision
  body.
- `/write-brief <contract-id>` — create one brief node and its
  `decomposes` edge. The brief names files, script entries, libraries,
  ordered implementation steps, and non-scope.
- `/implement-brief <brief-id>` — read the brief and its contract by
  following edges, then implement exactly what the brief says. If the
  brief seems wrong, stop and ask — never expand scope silently.
- `/prepare-evidence <brief-id>` — create the evidence node and
  `evidences` edge; the brief becomes `implemented`; walk edges back to
  set the intent to `addressed`; regenerate indexes.
- `/update-spec-graph <instruction>` — direct graph-maintainer
  invocation for ad-hoc graph changes.

## Operational requirements

Every command that mutates the graph ends with
`pnpm spec:index && pnpm spec:validate` and must not commit on failure.
