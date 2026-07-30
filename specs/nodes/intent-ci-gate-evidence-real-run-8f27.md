---
id: intent-ci-gate-evidence-real-run-8f27
type: intent
title: Require evidence for a CI-gated artifact to cite a real CI run, not a local re-enactment
status: open
created: 2026-07-30
class: 2
produced_by: "/capture-intent"
---

## Problem

A lane can reach **final evidence** for a CI check that has **never executed in CI**, and the graph
stays green while the check is broken.

This is demonstrated, not hypothetical. `evidence-conveyor-ci-4b73` records amendment A9's
transcription check as verified — "A9's step executed for real: three legs green, two negative paths
red" — and it was honest about how: it also states, at the end of its verification list, *"Not
verified, and not claimable from this repository: no workflow was executed by GitHub."* Both
statements were true. The lane verified A9 by extracting the step's `run:` script and executing it
locally, which is the only thing this repository can do.

The first time GitHub actually ran that step, it failed before doing any work:

```
Transcription check (A9) — printed NEXT blocks vs spec:status
  Error: Cannot find module 'js-yaml'
  requireStack: [ '/tmp/a9.ts' ]
```

`.github/workflows/ci.yml` wrote the script to `/tmp/a9.ts` and ran it from there. `--import tsx`
resolves bare specifiers through `./node_modules` by walking up from the **script's own** directory,
so a script under `/tmp` cannot import `js-yaml`. A local re-enactment never reproduces this, because
extracting the script into the repository puts it where resolution succeeds. The local verification
and the CI execution differ in exactly the dimension that was broken.

**The sharpest part: the lane had already diagnosed this pattern and written it down.**
`evidence-conveyor-ci-4b73` documents the identical trap for leg 2's scratch directory — "a `/tmp`
scratch dir makes every spawn exit 1 with `ERR_MODULE_NOT_FOUND` … that trap cost a debugging round
here" — and the step was fixed for the scratch dir while the script file one screen above it was
left in `/tmp`. The instance was fixed; the pattern was not. That is the failure mode common-core
finding CC-16 exists to name, recurring inside the very change that named it.

The path bug itself is in-scope repair and is being fixed under A9, which already requires the check
to work. **This intent is about the hole the bug came through, not the bug.** Nothing in
`contract-conveyor-derived-4c8c`, its sixteen amendments, or its sixteen common-core findings
requires a lane's evidence to cite an observed CI run for a check it ships. So
`observability-release` did the correct thing available to it — disclosed the bound rather than
claiming past it — and the bound is precisely where the defect lived.

The hole is not specific to A9. Three artifacts this change shipped have never executed on GitHub:

- **`ci.yml`'s A9 step** — the case above.
- **`issue-sync.yml`** — recorded in `integration-conveyor-derived-4d19`'s `combined-risk` item 3:
  the `planIssueSync` seam is unit-tested at 18 cases and the adapter is dry by default, but no run
  has confirmed the GraphQL sub-issue and blocked-by mutations against the built-in token.
- **`drift-review.yml`'s graduated gate** — it goes red on a violating PR and blocks nothing until an
  admin marks the check required, so its post-graduation failure surface is unobserved.

## Goal

Decide what a lane must observe before its evidence may treat a CI-gated artifact as verified, and
what a lane may claim when it cannot observe it.

Candidates worth comparing rather than assuming:

1. **Require a cited run.** Evidence for a workflow change names a real GitHub run id or check
   conclusion. Strongest, but it inverts the ordering — the run only exists after the PR is pushed,
   so evidence would have to be authored or amended after CI reports, which changes when
   `/prepare-evidence` can complete.
2. **Require the local re-enactment to be faithful in the dimension that matters.** Execute the
   extracted `run:` block under `bash -e` from a working directory matching the runner's, with the
   runner's environment variables set — which is what would have caught this one. Cheaper and
   ordering-preserving, but it verifies a simulation, so it narrows the gap without closing it.
3. **Make the unobserved-CI bound a first-class, machine-visible declaration** rather than prose an
   evidence node may or may not include — so an integration node can enumerate every shipped CI
   artifact that has never run and refuse a final verdict while any remain.

Any resolution must keep two things intact: `graph-maintainer` stays the sole writer of the graph
(CLAUDE.md rule 6), and a lane must never be able to claim an unobserved run as observed — the
honest-bound discipline that made this diagnosable is the thing to strengthen, not replace.

Success is that a broken CI gate cannot sit behind a final evidence node with a green graph, and that
whatever a lane cannot observe is stated in a form a later integration can enumerate.

## Source

Found while answering "what's left to be done" after
`integration-conveyor-derived-4d19` was recorded: PR #16's `ci` job was red on the A9 step while
`pnpm test`, `typecheck` and `lint` all passed, and every other required check was green. The graph
asserted nothing false — the bound was disclosed — which is why this is captured as missing scope
under CLAUDE.md scope-integrity rule 5's **second** branch (contract incomplete, intended behaviour
unchanged) rather than recorded as a `drift-finding`.

Related: `intent-write-tests-status-flip-2b64` and `drift-finding-write-tests-no-flip-7e52` (the
other gap that kept `integration-conveyor-derived-4d19` at `draft`, also a case of a mechanism
verified in one context and broken in the one that counts);
`intent-implement-brief-graph-lane-b3f5` and `intent-wave-persistence-5c93` (the other two follow-ups
this change's integration routed).

**Class rationale.** Class 2 — a meaningful technical change to the evidence discipline, plausibly
touching `.claude/commands/prepare-evidence.md`, `.claude/agents/integration-reviewer.md` and
possibly `specs/schema/`. It is not class 3: it touches no security, privacy, compliance, payments or
production-sensitive path, and a resolution may well land on a single surface. A contract may revise
the class upward with recorded rationale if its chosen approach spans more.
