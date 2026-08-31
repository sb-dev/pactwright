---
id: brief-insert-the-quick-start-section-into-readme-md-ad337723
type: brief
title: Insert the Quick Start section into README.md
created: '2026-08-31'
---

Implements contract-readme-quick-start-for-the-proven-delivery-surface-c9a8f1db.

Repository state: README.md is 29 lines. Line 1 is the `# Pactwright`
heading, line 3 the introduction paragraph, line 5 starts `## Packages`.
There is no Quick Start anywhere. Prettier checks README.md (`*.md` is not
ignored for the root README; docs/ is).

Work: insert one `## Quick Start` section between the introduction
paragraph and `## Packages`, with three short sub-parts in this order:

1. Install and set up: fenced bash block with `pnpm add -D pactwright`,
   `pnpm pactwright init`, `pnpm pactwright sync`; one line each for what
   init and sync create; one note line that the first npm release (0.0.1)
   ships at the end of the current checkpoint.
2. Run a Delivery: the seven generated Claude Code commands in lifecycle
   order, each with at most one sentence (capture-intent, propose-contracts,
   approve-contract, write-brief, deliver-brief, review, prepare-evidence).
3. Inspect the graph: fenced bash block with `pnpm pactwright validate`,
   `pnpm pactwright lifecycle status`, `pnpm pactwright context <intent-id>`;
   one line each.

Mention nothing deferred (GitHub provisioning, agent-pack use/upgrade,
eval baselines). Keep the README's existing tone: short bold-led bullets,
plain prose, no marketing.

Verification: `pnpm verify` passes (Prettier includes README.md); manual
check that the section lists exactly the contract's commands and no other.
