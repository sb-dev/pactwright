---
id: contract-core-delivery-learning-path-in-guide-and-example-6f423688
type: contract
title: Core Delivery learning path in guide and example
created: '2026-08-31'
---

Scope: three surfaces, nothing else.

1. docs/getting-started.md (new): a concise guide from empty repository
   to first completed Delivery. Sections: what Pactwright is (two or
   three sentences); install and set-up (pnpm add -D pactwright,
   pnpm pactwright init, pnpm pactwright sync, with the note that the
   first npm release 0.0.1 ships at the end of the current checkpoint);
   the Delivery lifecycle explained stage by stage with the seven
   generated Claude Code commands and what each records; inspecting the
   graph (validate, lifecycle status, context); a link to the runnable
   example.

2. examples/core-delivery/README.md (new): a concrete walkthrough a
   reader can run end to end in a fresh repository: install and
   initialise, then deliver one small proof artefact through all seven
   stages, then inspect the resulting lineage. Every command shown must
   be one proven in this checkpoint. Expected output may be summarised,
   not fabricated verbatim.

3. README.md: keep the Quick Start current; add links to the guide and
   the example. No other README changes.

Constraints:
- Only commands and semantics proven in this checkpoint's bootstrap,
  fixture and self-hosting stages; no deferred capability (GitHub
  provisioning, agent-pack use/upgrade, eval baselines) may appear.
- README, guide and example must agree on one command surface.
- Prettier-clean repository; pnpm verify passes.

Verification: pnpm verify passes, and the guide plus example are
followed end to end in a clean consumer fixture built from the Stage 6
tarballs, completing a valid Intent to Evidence lineage there.

Out of scope: website or published-docs tooling, automation scripts for
the example, changes to runtime behaviour.
