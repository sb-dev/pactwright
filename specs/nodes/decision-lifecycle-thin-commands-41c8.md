---
id: decision-lifecycle-thin-commands-41c8
type: decision
title: Select thin commands + fat agents for lifecycle tooling
decided_by: samir
created: 2026-06-13
---

## Selection

`contract-lifecycle-thin-commands-7c20` is selected for
`intent-claude-lifecycle-commands-f367`. Its sibling candidate
`contract-lifecycle-fat-commands-a5a8` is rejected.

## Rationale

- The intent's own scope names four agents in `.claude/agents/`
  (spec-writer, spec-critic, graph-maintainer, contract-reviewer).
  Candidate B removes that surface entirely, so approving it would
  put the approved contract in contradiction with the intent it
  proposes to address.
- This repository has already chosen single-source-of-truth over
  duplicated copies once: `decision-spec-tooling-schema-driven-5e8c`
  picked schema-driven validation rules over hardcoded ones.
  Candidate B's headline risk — rule blocks duplicated across every
  mutating command, drifting apart with only grep discipline as
  mitigation — is the same failure mode that decision rejected.
- Candidate A keeps each rule in exactly one place per role, so a fix
  to `graph-maintainer.md` corrects every command that mutates the
  graph, and agents remain reusable from any entry point.

## Modification

The contract is approved with one clarification: **graph-maintainer is
the sole writer of canonical graph data** (`specs/nodes/` and
`specs/graph/edges.yaml`). spec-writer and spec-critic draft content
but always hand graph writes to graph-maintainer; they never write
node or edge files themselves. This closes the ambiguity in the
contract's scope where spec-writer's "graph writes handed to
graph-maintainer" was not stated as an invariant.

## Consequences

- `contract-lifecycle-thin-commands-7c20` → `approved`
- `contract-lifecycle-fat-commands-a5a8` → `rejected`
- `intent-claude-lifecycle-commands-f367` stays `open`; it becomes
  `addressed` only when final evidence covers a brief that decomposes
  this contract.
