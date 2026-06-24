---
id: decision-graph-data-unowned-2f7b
type: decision
title: specs/{nodes,graph,indexes}/** is intentionally unowned graph data
decided_by: Samir Benzenine
created: 2026-06-20
---

Records that the paths under `specs/nodes/**`, `specs/graph/**`, and
`specs/indexes/**` are INTENTIONALLY UNOWNED by any capability.

These paths are graph data — the substrate that the `coverage-coherence`
validation rule and the `check-diff` / drift tooling read and trust as the
source of truth. They are not a behavioural surface that a path-owning
capability would gate; gating them behind a capability would be circular
(the graph guarding the graph). They are therefore deliberately left
uncovered by any `capability.paths` glob.

This is the durable, dated authorization that `/prepare-evidence`'s
human-confirm branch points at: a diff that touches only
`specs/{nodes,graph,indexes}/**` (such as this PR's new capability and
decision nodes and the edges that wire them) is a recorded
intentionally-unowned change, not a coverage gap.

Authorized by Samir Benzenine on 2026-06-20, per
`decision-lane-integration-9f3b` (correction 6: persist the
intentionally-unowned authorization as a durable dated artifact, its single
home being this dedicated decision node rather than a capability body or
9f3b itself).
