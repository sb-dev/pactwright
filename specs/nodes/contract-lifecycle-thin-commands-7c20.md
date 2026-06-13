---
id: contract-lifecycle-thin-commands-7c20
type: contract
title: Thin slash commands delegating to four fat agents
status: approved
created: 2026-06-12
---

## Problem interpretation

The intent (`intent-claude-lifecycle-commands-f367`) wants every
lifecycle step runnable without a raw prompt. The deeper need is that
the *rules* — node/edge conventions, status transitions, "no commit on
red" — are stated once and enforced everywhere. A command is just an
entry point; the knowledge belongs to the role performing the work.
This candidate therefore treats the four agents as the canonical
carriers of behaviour and keeps commands as thin dispatch shims.

## Scope

- Four agent files in `.claude/agents/`, each owning its role's full
  behaviour, graph rules, and output conventions:
  - `spec-writer.md` — drafts candidate contracts (2–3 per intent,
    distinct trade-offs, comparison table, never selects) and briefs
    (files, script entries, libraries, ordered steps, non-scope).
  - `spec-critic.md` — adversarial review: ambiguity, missing cases,
    scope creep; appends a `## Critique` section to each reviewed node.
  - `graph-maintainer.md` — the only writer of canonical graph data:
    node files, `edges.yaml` entries, status transitions, ID
    conventions, supersede-don't-delete, and the closing
    `pnpm spec:index && pnpm spec:validate` gate with no commit on
    failure.
  - `contract-reviewer.md` — supports approval: summarises candidates,
    confirms the selection's consequences (chosen → `approved`,
    siblings → `rejected`, intent stays `open`).
- Eight command files in `.claude/commands/`, each ~10 lines: parse
  `$ARGUMENTS`, locate the referenced node(s) via `specs/indexes/`
  (incoming/outgoing/by-type), and delegate to the owning agent with
  the resolved context. Mapping:
  - `/capture-intent`, `/approve-contract`, `/prepare-evidence`,
    `/update-spec-graph` → graph-maintainer
  - `/propose-contracts`, `/write-brief` → spec-writer (graph writes
    handed to graph-maintainer)
  - `/review-contracts` → spec-critic
  - `/implement-brief` → reads brief + contract by following edges,
    implements exactly, stops and asks if the brief seems wrong
- Every graph-mutating path ends with
  `pnpm spec:index && pnpm spec:validate`; on failure, no commit.

## Non-scope

- No changes to `tools/spec.ts`, the schema files, or validation rules.
- No new lifecycle steps, node types, or edge types.
- No CI wiring beyond what already invokes `pnpm spec:validate`.
- No automation of human selection — `/approve-contract` records a
  decision a human has already made.

## Trade-offs

- **+** Graph rules live in exactly one place per role; fixing a rule
  in `graph-maintainer.md` fixes every command that mutates the graph.
- **+** Agents are reusable from any entry point — a raw conversation,
  another command, or a future command gets identical behaviour by
  delegating to the same agent.
- **+** Commands are trivially auditable (~10 lines each); adding a
  ninth command is cheap.
- **−** Two-hop indirection: understanding what `/approve-contract`
  does requires reading both the command and `graph-maintainer.md`.
- **−** Delegation overhead per invocation (subagent spawn, context
  handoff) on even trivial operations like `/capture-intent`.
- **−** Agent files grow fat; `graph-maintainer.md` in particular
  accumulates every mutation rule and may become the new monolith.

## Risks

- A command passes incomplete context to its agent and the agent
  re-derives it wrongly. Mitigation: commands pass node IDs only;
  agents are required to resolve canonical state from
  `specs/nodes/` + `specs/indexes/` themselves.
- Behaviour drift between what a command's one-line description claims
  and what the agent actually does. Mitigation: command files contain
  no behavioural claims beyond the delegation target.
- Subagent context limits: a large graph could make agent-side context
  loading slow. Mitigation: indexes exist precisely to avoid scanning
  every node.

## Acceptance examples

1. **Propose.** Running `/propose-contracts <id>` against an open
   intent yields 2–3 new `status: candidate` contract nodes, one
   `proposes` edge per contract in `specs/graph/edges.yaml`,
   regenerated `specs/indexes/`, a green `pnpm spec:validate`, and a
   closing comparison table. No decision node is created.
2. **Approve.** Running `/approve-contract <id> "notes"` creates one
   decision node (notes in body) and one `selects` edge; the chosen
   contract becomes `approved`, sibling candidates become `rejected`,
   the intent stays `open`, and validation is green.
3. **Reuse.** Asking graph-maintainer directly (no command) to record
   an intent produces a node byte-identical in conventions to one made
   via `/capture-intent` — proving the rules live in the agent.
4. **Red gate.** If `pnpm spec:validate` fails after a mutation, the
   command reports the failure and `git log` shows no new commit.
5. **Thinness.** Every file in `.claude/commands/` is ≤ 15 lines and
   contains no status-transition or ID-convention rules (verifiable by
   grep).

## Verification needs

- A dry run of each command against the live graph on a scratch
  branch, asserting examples 1–4.
- Grep-based check for example 5 (no rule text in command files).
- `pnpm spec:validate` green on the real `/specs` tree after the
  `.claude/` files land (they are outside the graph, so this is a
  no-regression check).
