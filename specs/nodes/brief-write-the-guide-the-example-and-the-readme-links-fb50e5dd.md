---
id: brief-write-the-guide-the-example-and-the-readme-links-fb50e5dd
type: brief
title: Write the guide, the example and the README links
created: '2026-08-31'
---

Implements contract-core-delivery-learning-path-in-guide-and-example-6f423688.

Repository state: README.md has the Quick Start (delivered in the previous
lineage) between the introduction and `## Packages`; docs/ holds only
checkpoints/ and research-logs/; there is no examples/ directory.
.prettierignore excludes docs/ and *.md, so new markdown adds no Prettier
surface; nothing under examples/ may be non-markdown.

Work, in order:

1. Create docs/getting-started.md with the contract's five sections. Tone
   as README: plain prose, short bold-led lists, fenced bash blocks.
   Source the lifecycle explanations from the Quick Start and the
   generated .claude/commands/*.md — do not invent semantics.

2. Create examples/core-delivery/README.md: fresh-repository walkthrough
   — git init, pnpm init, pnpm add -D pactwright, pnpm pactwright init,
   sync, validate, lifecycle status; then one Delivery of a one-line
   proof.mjs artefact through the seven Claude Code commands (the same
   artefact shape proven in the bootstrap fixture); then validate,
   lifecycle status and context showing the finished lineage. Summarise
   expected output ("state: done", five nodes), never paste fabricated
   transcripts.

3. In README.md, at the end of the Quick Start section, add one short
   "Learn more" line linking to docs/getting-started.md and
   examples/core-delivery/README.md. Touch nothing else in the README.

Verification: pnpm verify at the root. Then build the Stage 6 bootstrap
fixture (pack both tarballs if absent, pnpm-workspace.yaml override per
the fixed Step 20 mechanism) in a fresh temporary directory and follow the
example end to end there; the fixture must reach a valid done lineage with
the commands exactly as the example states them.
