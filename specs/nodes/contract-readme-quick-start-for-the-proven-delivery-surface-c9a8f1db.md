---
id: contract-readme-quick-start-for-the-proven-delivery-surface-c9a8f1db
type: contract
title: README Quick Start for the proven Delivery surface
created: '2026-08-31'
---

Scope: add exactly one `## Quick Start` section to `README.md`, placed
between the introduction and `## Packages`. No other file changes.

Content requirements:
- Install: `pnpm add -D pactwright`, with one note that the first npm
  release (0.0.1) ships at the end of the current checkpoint.
- Set-up: `pnpm pactwright init` then `pnpm pactwright sync`, each with
  one line saying what it creates.
- The Delivery lifecycle: the seven generated Claude Code commands
  (/capture-intent, /propose-contracts, /approve-contract, /write-brief,
  /deliver-brief, /review, /prepare-evidence) in order, each with at
  most one sentence on what it does or records.
- Inspection: `pnpm pactwright validate`, `pnpm pactwright lifecycle
  status` and `pnpm pactwright context <intent-id>`, each with one line.

Constraints:
- Document only commands proven in this checkpoint's bootstrap, fixture
  and self-hosting stages; mention no deferred capability (GitHub
  provisioning, agent-pack switching, upgrade, eval baselines).
- Match the README's existing tone and formatting; Prettier-clean.

Verification: `pnpm verify` passes; the section contains only the
commands listed above.

Out of scope: a separate Getting Started guide, runnable examples,
changes to any file other than README.md.
