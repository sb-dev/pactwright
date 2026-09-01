---
id: evidence-learning-path-delivered-and-fixture-verified-63e97869
type: evidence
title: Learning path delivered and fixture-verified
created: '2026-09-01'
---

Delivered three files: docs/getting-started.md (new, five sections:
what Pactwright is, install and set-up with the 0.0.1 note, the seven
lifecycle stages, graph inspection, link to the example);
examples/core-delivery/README.md (new, three-part walkthrough from fresh
repository to done lineage); README.md (one "Learn more" line appended to
the Quick Start linking guide and example). No other file changed.

Verification run 1: pnpm verify at the repository root on 2026-08-31.
Result: all stages passed; 425 of 425 tests passed.

Verification run 2: on 2026-09-01, both bootstrap tarballs were repacked
from current source (pnpm pack; pnpm --filter @pactwright/standard pack)
and the example was followed end to end in a clean fixture at
/tmp/pactwright-step24-fixture (git init, pnpm init, pnpm-workspace.yaml
override, pnpm add -D tarball, init, sync, validate, lifecycle status,
then all seven stages delivering proof.mjs, then validate, lifecycle
status, context). Results matched the example's stated expectations:
empty graph valid with 0 nodes and blocked at capture-intent before the
Delivery; after it, validate reported 5 nodes, 4 edges, 1 valid lineage;
lifecycle status reported state done with all seven stages completed;
node proof.mjs printed the expected line and exited 0.

Review reported no findings.
