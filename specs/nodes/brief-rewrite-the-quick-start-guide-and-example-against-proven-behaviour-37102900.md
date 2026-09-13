---
id: brief-rewrite-the-quick-start-guide-and-example-against-proven-behaviour-37102900
type: brief
title: Rewrite the Quick Start, guide and example against proven behaviour
created: '2026-09-13'
---

Scope: README.md, docs/getting-started.md, examples/core-delivery/README.md.

Work:

- Setup in all three leads with `init --agent-pack <source>`, and shows the
  explicit three-step path as the operations it composes. State plainly
  that a plain `init` stops at a scaffold.
- Replace stage language with command language. Name the fulfilment shape
  Brief -> Delivery -> Review -> Evidence as what governs from the Brief on.
- Document the five closure conditions, the Review-invalidated-by-delivery
  rule, and declared corrective routing with bounded iteration. The example
  shows the refusal a reader can reproduce.
- Document doctor, upgrade and upgrade --to, agent-pack use and upgrade,
  and eval --baseline/--candidate.
- Remove the "first npm release ships at the end of the current checkpoint"
  notes.

Verification: `pnpm verify` passes, and every command sequence published in
the three documents has been executed against packed artefacts in a clean
consumer outside this workspace.
