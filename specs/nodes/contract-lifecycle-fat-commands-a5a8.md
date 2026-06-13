---
id: contract-lifecycle-fat-commands-a5a8
type: contract
title: Self-contained slash commands with no agent layer
status: rejected
created: 2026-06-12
---

## Problem interpretation

The intent (`intent-claude-lifecycle-commands-f367`) wants every
lifecycle step runnable without a raw prompt. The simplest thing that
achieves this is one complete instruction file per step: everything the
session needs — context-loading, behaviour, graph mutation rules, the
validation gate — inline in the command itself. No roles, no
delegation; reading one file tells you exactly what one command does.

## Scope

- Eight self-contained command files in `.claude/commands/`, one per
  lifecycle entry point (`/capture-intent`, `/propose-contracts`,
  `/review-contracts`, `/approve-contract`, `/write-brief`,
  `/implement-brief`, `/prepare-evidence`, `/update-spec-graph`).
- Each file carries, inline:
  - argument parsing (`$ARGUMENTS`) and context-loading instructions
    (which nodes to read, which `specs/indexes/` views to consult,
    which edges to follow);
  - the step's full behaviour (e.g. `/propose-contracts`: 2–3
    candidates with distinct trade-offs, `proposes` edges, closing
    comparison table, never selects; `/approve-contract`: decision
    node + `selects` edge, chosen → `approved`, siblings → `rejected`,
    intent stays `open`, notes in the decision body);
  - the graph rules it needs: node ID convention, frontmatter fields,
    edge format, supersede-don't-delete, edges-only-in-`edges.yaml`;
  - the closing gate: `pnpm spec:index && pnpm spec:validate`, and no
    commit on failure.
- No `.claude/agents/` directory at all.

## Non-scope

- No changes to `tools/spec.ts`, the schema files, or validation rules.
- No new lifecycle steps, node types, or edge types.
- No shared include/template mechanism for the duplicated rule blocks
  (if such a mechanism is wanted later, that is a superseding
  contract).
- No automation of human selection — `/approve-contract` records a
  decision a human has already made.

## Trade-offs

- **+** Zero indirection: one file fully describes one command;
  debugging a misbehaving command means reading that file only.
- **+** No delegation overhead — no subagent spawn or context handoff
  per invocation; cheap commands stay cheap.
- **+** Each command's rules can be tuned to exactly what that step
  needs (e.g. `/capture-intent` carries only intent-node rules, not
  the whole rulebook).
- **−** Graph rules are duplicated across every mutating command
  (at least 6 of 8 files); a rule change must be applied to each copy.
- **−** Drift between copies becomes possible: two commands can
  silently disagree about, say, the edge ID convention, and nothing
  structural catches it before `spec:validate` does — and prose-level
  drift (tone, ordering, emphasis) is never caught.
- **−** No reusable roles: behaviour is reachable only through its
  command; an ad-hoc session doing graph work by raw prompt gets none
  of the encoded rules.

## Risks

- **Drift is the headline risk.** A fix lands in `/approve-contract`'s
  rule block but not `/prepare-evidence`'s; months later the two
  produce inconsistent graph writes. Mitigation: keep the duplicated
  block textually identical and grep-comparable across files, and
  treat any divergence found in review as a bug.
- Fat files exceed what a session reliably follows: a ~150-line
  command mixing parsing, behaviour, and rules invites partial
  compliance. Mitigation: strict section ordering inside every
  command file.
- The duplication tax discourages adding new rules at all — the
  cheapest path becomes "don't encode it", quietly recreating the
  raw-prompt problem the intent exists to solve.

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
3. **Self-containedness.** Each mutating command file greps positive
   for the full rule block (ID convention, edge format, validation
   gate) — the duplication is visible and auditable, and
   `.claude/agents/` does not exist.
4. **Red gate.** If `pnpm spec:validate` fails after a mutation, the
   command reports the failure and `git log` shows no new commit.
5. **No hidden deps.** Deleting any seven command files leaves the
   eighth fully functional — no command reads another file under
   `.claude/`.

## Verification needs

- A dry run of each command against the live graph on a scratch
  branch, asserting examples 1, 2 and 4.
- A diff/grep check that the shared rule block is byte-identical
  across all mutating commands at landing time (example 3), plus a
  documented expectation that reviewers re-check this on every change
  to any command file.
- Example 5 verified by inspection (no cross-references between
  command files).
- `pnpm spec:validate` green on the real `/specs` tree after the
  `.claude/` files land.
