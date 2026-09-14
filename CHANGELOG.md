# Changelog

## 0.0.2 — unreleased

Corrective development release, published under the npm dist-tag `next`:
`pactwright` (runtime and CLI) and `@pactwright/standard` (default agent
pack). `0.0.1` was published against version 14 of the Checkpoint 1 runbook
and remains on the registry as the released baseline.

**Lifecycle.** The seven adapter commands are no longer the lifecycle's
topology. Contract authority, the fulfilment shape (`Brief → Delivery →
Review → Evidence`), execution policy and fine-grained progress are four
separate things. Progress persists under `.pactwright/execution/` and is not
graph truth: advancing a run leaves `project_graph_revision` unchanged.
`.pactwright/lifecycle.yml` moves to version 2 (`responsibilities` plus
`shape`); `pactwright upgrade` migrates a version 1 document and preserves
its policy.

**Closure.** All five Evidence preconditions are enforced before any
mutation, so a lineage can no longer be closed on work that was never
delivered or never reviewed. Delivering again after a Review invalidates that
Review. A Review asking for correction routes back along a route the shape
declares, bounded by policy.

**Validation.** `pactwright validate` implements the complete seventeen-rule
detection contract, including unauthorised Decisions in records that never
passed a mutation guard, unauthorised Gate progression, undeclared
transitions, unbounded corrective loops and — on request — replay provenance.
It reports the three replay identities: repository revision, Project Graph
revision and `environment_lock_hash`.

**Distribution.** New: `pactwright doctor`, `pactwright upgrade` and
`upgrade --to`, `pactwright agent-pack use` and `agent-pack upgrade`, and
`pactwright init --agent-pack <source> [--with <extension>]`. A plain `init`
now creates a scaffold and selects no agent pack — Pactwright never chooses
one for you. The Pactwright lock is load-bearing: `sync` refuses a lock that
disagrees with the installed environment instead of rendering from it.
Extension installation is delegated to the project package manager,
dependency-first.

**Evaluation.** The core suite adds Brief quality, Evidence accuracy and
lifecycle compliance. `pactwright eval --baseline <pack> --candidate <pack>`
reports regressions per capability, agent and case, with no aggregate score.

Public learning material was re-delivered through Pactwright itself
(`evidence-learning-path-realigned-and-checked-against-packed-artefacts-ee25a0b4`).

## 0.0.1 — 2026-09-01

First public development release, published under the npm dist-tag `next`:
`pactwright` (runtime and CLI) and `@pactwright/standard` (default agent
pack).

Delivered through Pactwright's own lifecycle, from accepted Checkpoint 1
Evidence:

- README Quick Start documenting the proven installation and Delivery
  command surface
  (`evidence-readme-quick-start-delivered-and-verified-553fab7f`).
- Core Delivery learning path — the Getting Started guide
  (`docs/getting-started.md`) and the runnable core Delivery example
  (`examples/core-delivery/`), verified end to end in a clean consumer
  fixture built from the bootstrap tarballs
  (`evidence-learning-path-delivered-and-fixture-verified-63e97869`).
