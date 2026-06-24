---
id: intent-lane-model-integration-a1f7
type: intent
title: Add lane model, integration node, and evidence-to-capability wiring
status: addressed
created: 2026-06-18
class: 3
---

Add the minimal lane model and integration, and wire
evidence to capabilities.

Schema migration first:
- Add optional field `lane` to node type brief, an enum:
  product-spec | domain-backend | frontend-ui | data-migration |
  api-integration | test-verification | observability-release | docs-spec.
  Unset means an unlaned single brief and is allowed.
- Add node type `integration` (required: id, type, title,
  status(draft|final), created; requires_body). Its body is the
  contract-level evidence for a multi-lane change and must cover: the lane
  outputs combined and conflicts resolved; the COMBINED test run on the
  integrated result with commands and results (this catches defects present
  in no single lane); the joint contract-compliance verdict (the whole
  change against the whole contract); cross-lane rollback and release
  sequencing; combined risk; follow-ups; and any scope-integrity outcome.
- Add edge type `integrates`: integration -> evidence.

New agents:
- .claude/agents/integration-reviewer.md — given the selected per-lane
  outputs for a contract, judge whether they combine to satisfy the
  approved contract, surface conflicts and residual risk, apply the
  scope-integrity rules, and produce the integration-node body above.
  Judgement only; invokes graph-maintainer to write the node and edges.
- .claude/agents/test-writer.md — writes or extends tests for a brief
  independently of the implementation agent; never the same invocation that
  implemented the code under test.

New commands:
- /decompose-lanes <contract-id> <lane-list>: create one brief per named
  lane (each with its `lane` field and a decomposes edge); state the
  integration expectation; include a test-verification lane brief whenever
  there is at least one implementation lane. /write-brief remains for
  single-brief contracts.
- /write-tests <brief-id>: invoke test-writer against a test-verification
  brief, independent of /implement-brief.
- /integrate <contract-id>: invoke integration-reviewer over the final
  per-lane evidence; create exactly one integration node with integrates
  edges to each lane's final evidence; add `touches` edges to the
  capabilities the integrated change falls under, applying the
  capability-coverage check below; apply scope-integrity rules; set the
  integration to final only when it covers every lane; then run
  pnpm spec:index && pnpm spec:validate and commit only on green.

Command updates:
- /prepare-evidence: (a) for a laned brief, set the brief to implemented but
  leave the intent open — the intent becomes addressed only via /integrate;
  for an unlaned single brief, behaviour is unchanged. (b) Capability
  wiring: map the change's diff to capability `paths[]` globs (from
  specs/indexes/by-type.yaml) and add `touches` edges from the new evidence
  to every capability the change falls under. If the diff touches paths no
  capability owns, STOP and ask the human — extend an existing capability,
  create one (via /update-spec-graph in this PR), or confirm the paths are
  intentionally unowned. Drift detection is only as good as this map.

CLAUDE.md additions:
- The lane catalog above and what each lane owns.
- Rule: Class 3 multi-surface work decomposes into lanes; Class 2 may.
- Rule: verification is always its own lane for any multi-lane work, owned
  by test-writer, never by an implementation lane.
- Rule: a contract decomposed into a single brief skips integration; its
  lone final evidence completes the contract. A multi-lane change is
  completed by a final integration node, which is the contract's coverage
  artifact and the release's includes target.
- Rule: every evidence node records `touches` edges to the capabilities its
  change falls under; a diff touching unowned paths is a coverage gap that
  is resolved in the same PR, never ignored.

Validation (extend spec:validate; land the single-lane intent-coherence
rule from the Phase 1 finding if absent, then generalise it — no new
workflow):
- Single-brief contract: covered when exactly one final evidence evidences
  its brief.
- Multi-brief contract: covered only when a FINAL integration node
  integrates a FINAL evidence for EVERY brief that decomposes the contract.
- An intent is `addressed` iff its selected contract is covered, through
  the existing decision/selects and decomposes/proposes chain. A multi-brief
  contract treated as covered without a final integration node is a
  validation failure.

Acceptance: a contract decomposed into two lane briefs cannot mark its
intent addressed until a final integration node integrates final evidence
for both lanes; a single-brief contract still completes with no integration
node; /prepare-evidence on a change touching an unowned path stops and asks;
spec:validate exits non-zero if a two-brief contract is completed without
integration.
