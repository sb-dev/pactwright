---
id: evidence-lifecycle-thin-commands-8296
type: evidence
title: Evidence for the lifecycle agents and slash commands implementation
status: final
created: 2026-06-13
---

## Intended change

Per `brief-lifecycle-thin-commands-705d` (decomposing
`contract-lifecycle-thin-commands-7c20`, as modified by
`decision-lifecycle-thin-commands-41c8`): four agents in
`.claude/agents/` carrying all behaviour and graph rules, eight thin
commands in `.claude/commands/` that parse `$ARGUMENTS`, load context
through `specs/indexes/`, delegate to agents, and end every mutating
step with `pnpm spec:index && pnpm spec:validate` (no commit on red).
graph-maintainer is the sole writer of `specs/nodes/` and
`specs/graph/edges.yaml`.

## Actual changes (commits 3bb82b5, 5d360a2)

- `.claude/agents/graph-maintainer.md` — sole writer; ID conventions,
  status transitions, supersede mechanics, validation postcondition.
- `.claude/agents/spec-writer.md` — drafts candidate contracts and
  briefs; never selects; hands writes to graph-maintainer.
- `.claude/agents/spec-critic.md` — adversarial Critique drafting.
- `.claude/agents/contract-reviewer.md` — approval support.
- `.claude/commands/`: `capture-intent.md`, `propose-contracts.md`
  (user exemplar, verbatim), `review-contracts.md`,
  `approve-contract.md`, `write-brief.md`, `implement-brief.md`,
  `prepare-evidence.md`, `update-spec-graph.md` — all 9–13 lines.
- `.gitignore` — un-anticipated enabling change: the blanket `.claude/`
  ignore (pre-dating this intent) was narrowed to `.claude/*` with
  negations for `agents/` and `commands/` so the deliverable is
  tracked while local Claude state stays ignored.
- Smoke-test graph artifacts: `intent-capture-smoke-test-46d5`
  (multi-line capture, then superseded) and
  `intent-capture-smoke-superseded-e7f8` with
  `edge-supersedes-capture-smoke-3f0a`, kept as history per rule 3.

## Commands run and results

- `pnpm spec:index && pnpm spec:validate` — green (10 rules, 0 errors)
  after every mutation in the implementation and smoke test.
- `wc -l .claude/commands/*.md` — every command file 9–13 lines, under
  the brief's 15-line cap.
- Rule-text grep over `.claude/commands/` (status-transition patterns:
  "set ... status", "becomes approved/rejected", arrow-to-status) —
  zero hits; graph rules live only in agent files.
- `/capture-intent` smoke test — multi-line quoted body (blank lines,
  nested indentation) survived verbatim; validation green; supersede
  path exercised the `same_as_source` endpoint rule.

## Three-defect self-test

Temporarily introduced: (1) `capture-intent.md` padded to 16 lines,
(2) a status-transition rule line appended to `review-contracts.md`,
(3) `edge-selftest-bad-endpoint-ffff`, a `selects` edge targeting an
intent. Outcomes: the thinness gate flagged defect 1
(`16 lines > 15`); the rule-text grep flagged defect 2 (line and file
named); `pnpm spec:validate` exited 1 on defect 3 with
`[rule: edges-endpoint-types] ... requires target.type=contract, got
intent` (plus `indexes-fresh` drift findings, as expected for an
unindexed mutation). After reverting all three, validation returned to
green (10 rules, 0 errors) with a clean `git status`.

## Risks

- Agent and command files are prompts, not code: nothing mechanically
  forces a session to obey them. The validation postcondition catches
  graph damage, but behavioural drift (e.g. a session selecting a
  winner during /propose-contracts) is only caught by review.
- `graph-maintainer.md` concentrates every mutation rule and may grow
  into a monolith (accepted in the contract's trade-offs).
- The brief's "delegate to exactly one agent" was resolved as one
  primary role agent per command with graph-maintainer as the
  universal write path — consistent with the brief's own per-command
  descriptions and the decision's sole-writer modification.
- The word "approved" appears descriptively in two command
  descriptions ("an approved brief/contract"); a naive grep for status
  words would false-positive on it.

## Follow-ups

- Run the brief's full acceptance test: one toy change end-to-end
  through all eight commands (the smoke test covered capture and
  supersede only).
- CI workflow invoking the validation gate (explicit non-scope of this
  brief).
- Open intents remain for future work:
  `intent-status-coherence-d4f2` (mechanical status coherence — would
  also mechanise the step-6 status flips recorded here) and
  `intent-docs-arrow-lint-e7b3`.
