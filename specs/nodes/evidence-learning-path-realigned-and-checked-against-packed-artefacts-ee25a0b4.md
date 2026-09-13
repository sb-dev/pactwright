---
id: evidence-learning-path-realigned-and-checked-against-packed-artefacts-ee25a0b4
type: evidence
title: Learning path realigned and checked against packed artefacts
created: '2026-09-13'
---

Delivered:

- README.md: Quick Start leads with `init --agent-pack`, shows the explicit
  three-step path as the operations it composes, and states that a plain
  init stops at a scaffold. The command list now describes delivery and
  review as recording provenance rather than nothing, and names the
  closure guard and declared corrective routing. The capability list adds
  validation, doctor, upgrade, agent-pack selection and baseline
  comparison, and describes the lifecycle as policy, shape and execution
  state rather than stages.
- docs/getting-started.md: same setup correction, a section on what the
  runtime will not let you skip, an environment-upkeep section covering
  upgrade and agent-pack upgrade, and inspection updated to the three
  replay identities.
- examples/core-delivery/README.md: setup corrected, plus a reproducible
  "try skipping a step" section showing the refusal a reader gets from
  prepare-evidence before delivery and review.

Verified:

- `pnpm verify` passes: format, lint, typecheck, 559 tests, build.
- Every published command sequence was executed against packed artefacts
  (`pnpm pack` of both packages) in clean consumers outside this
  workspace. init --agent-pack, the explicit three-step path, doctor,
  validate and lifecycle status all behaved as documented; explicit and
  one-shot setup produced byte-identical config, lock, lifecycle and
  generated .claude files.
- The documented refusal was reproduced verbatim: prepare-evidence before
  delivery reported "shape step \"delivery\" runs automatic", and again
  before review reported "shape step \"review\" runs automatic".
- A full lineage was completed in the packed consumer, including a Review
  returning revise and routing back to Delivery, and closed to state: done
  with validate reporting 5 nodes, 4 edges, 1 lineage.

Not verified: the Claude Code command invocations themselves (/capture-intent
and the rest) were exercised through their runtime responsibilities, not by
driving Claude Code.
