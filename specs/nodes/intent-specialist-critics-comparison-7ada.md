---
id: intent-specialist-critics-comparison-7ada
type: intent
title: Add specialist critics and a durable proposal comparison
status: open
created: 2026-06-17
class: 3
---

Add specialist critics and a durable proposal comparison.

Schema migration first:
- Add node type `comparison` (required: id, type, title, created;
  requires_body; no status — its existence is its meaning). Body holds the
  candidate trade-off table, critic findings grouped by perspective, and
  the case against each candidate.
- Add edge type `compares`: comparison -> contract.
- Declare a cutoff `comparison_required_from` in schema/validation-rules.yaml,
  set to this migration's timestamp, so the rule below applies only to
  contracts created on or after it (existing selections are grandfathered).

New agents in .claude/agents/ (each: frontmatter name/description/tools;
body of numbered review rules ending by writing findings, never selecting):
product-critic, ux-critic, architecture-critic, security-privacy-critic,
compliance-risk-critic, qa-test-critic, reliability-ops-critic,
cost-maintainability-critic, release-critic. Each attacks candidate
contracts from its single perspective: missing cases, risks, and the
strongest argument against each candidate on that axis.

CLAUDE.md additions — critic routing by work-class and declared contract
scope (no code diff exists at proposal time, so routing reads the
candidates' scope, not a diff):
- Class 0-1: spec-critic only.
- Class 2: spec-critic plus the specialist critics whose surface the
  candidates' scope touches (UI scope -> ux-critic; payments or personal
  data -> security-privacy-critic and compliance-risk-critic; schema or
  service-boundary -> architecture-critic; and so on).
- Class 3: spec-critic plus the full specialist panel, regardless of
  apparent surface.

Command update — /review-contracts <intent-id>:
1) read the candidates and the intent class; invoke spec-critic plus the
   routed specialist critics; each appends a Critique section, labelled by
   perspective, to every candidate (the absolute case against that
   candidate);
2) invoke graph-maintainer to create ONE comparison node consolidating the
   trade-off table, the critic findings by perspective, and the relative
   case against each candidate, with a compares edge to each candidate;
3) regenerate indexes, run pnpm spec:validate, end by asking for a human
   decision. Never select.

Command update — /approve-contract: the decision body now cites the
comparison node and records the accepted trade-off and why each rejected
candidate was rejected. The comparison holds the analysis; the decision
holds the choice.

Validation (extend spec:validate; no new workflow): for a Class 2 or
Class 3 contract whose `created` is at or after `comparison_required_from`,
a `selects` decision is valid only if a comparison node with compares edges
to the candidate set already exists, and a comparison node must compare at
least two contracts. Class 0-1 need no comparison. Contracts created before
the cutoff — every Phase 1-6 contract and this phase's own bootstrap
contracts — are grandfathered: they predate the comparison mechanism, so the
rule skips them and the whole graph stays green. No backfill, no graph writes
to existing nodes.

Acceptance: approving a NEW Class 2 contract (created after the cutoff) is
blocked until a comparison node exists, while every pre-cutoff selection
still validates; /review-contracts on a UI-touching Class 2 intent invokes
ux-critic and not the payments critics; a Class 3 intent invokes the full
panel; the comparison node survives as the durable record of why the losers
lost.
