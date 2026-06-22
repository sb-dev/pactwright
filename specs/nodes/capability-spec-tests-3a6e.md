---
id: capability-spec-tests-3a6e
type: capability
title: Verification suite
status: active
paths: [tests/**]
---

Owns the verification surface under `tests/` — the unit, meta, and
whole-tree fixture suites that exercise the spec-graph loader, handlers,
and validation rules.

This is a dedicated tests capability, authored per `decision-lane-integration-9f3b`:
`tests/**` is deliberately NOT annexed into the spec-graph tooling capability
(`capability-spec-tooling-1a2b`) — the verification surface is its own surface,
owned here.
