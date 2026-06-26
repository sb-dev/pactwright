---
id: capability-spec-tooling-1a2b
type: capability
title: Spec graph tooling
status: active
created: 2026-06-15
paths: [tools/**, package.json]
---

Owns the spec-graph tooling under `tools/` (index, validate, gate, drift).

`CLAUDE.md` and `tests/**` are deliberately NOT annexed into this capability — they get dedicated capabilities (`capability-spec-docs-8c1d` and `capability-spec-tests-3a6e`) per `decision-lane-integration-9f3b`. The `paths` are `[tools/**, package.json]`: `package.json` (the project manifest defining the `spec:*` tooling scripts) was annexed during the Phase-9 patch-market evidence step (`evidence-patch-market-gate-2e3f`).
