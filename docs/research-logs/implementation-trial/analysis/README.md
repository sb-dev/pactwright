# A2 — independent audits

Nothing is published here yet. A2 has not started.

Five sessions audit different boundaries of the pinned reference **before
reading each other's conclusions**. Each writes one report into this directory.
A1 prepared their checkouts and coordinates publication; it does not write their
reports.

| Report | Boundary | Assigned skills (from `skills-lock.json`) | Commit subject prefix |
|---|---|---|---|
| `graph.md` | Graph and persistence | `acquire-codebase-knowledge`, `architecture-patterns`, `property-based-testing` | `A2-G` |
| `lifecycle.md` | Lifecycle and agent execution | `acquire-codebase-knowledge`, `systematic-debugging`, `contract-testing` | `A2-L` |
| `distribution.md` | Distribution, recovery and concurrency | `systematic-debugging`, `security-and-hardening`, `acquire-codebase-knowledge` | `A2-D` |
| `verification.md` | Tests, evaluation and simplicity | `test-strategy`, `mutation-testing`, `risk-based-testing`, `code-review-and-quality` | `A2-V` |
| `runbooks.md` | Specifications and checkpoint instructions | `documentation-and-adrs`, `acquire-codebase-knowledge` | `A2-R` |

Each session's full prompt is in the runbook's A2 section. Run it as written;
do not substitute a plan of your own.

## Where each session works

Its own isolated checkout, listed in
[`../evidence/a1/a2-checkouts.md`](../evidence/a1/a2-checkouts.md). Production
files there are byte-identical to the pinned reference, so a report is written
against the same code every other session sees. Sessions do not share a
checkout and do not write to `trial/restart-analysis`.

## Finding format

Every finding carries: a stable ID, the requirement it belongs to, the public
trigger, source and test locations, expected and actual effect, evidence, cause
and an acceptance proposal.

Cause is one of: **missing requirement, ambiguity, contradiction, unenforced
requirement, inadequate test, environment assumption**. Do not assume the
checkpoints caused every defect.

Evidence status is one of `executed-pass`, `executed-fail`, `code-traced`,
`not-reproduced`, `not-run`, `environment-blocked`, with the tested SHA,
expected and actual result, exit status and durable effects. A finding you
reasoned about but did not run is `code-traced` — saying so is not a weakness in
the report, it is the report being usable.

Record successes as well as defects. A reimplementation that discards a working
mechanism because nobody wrote down that it worked is a worse outcome than one
that keeps a flawed mechanism knowingly.

## PR #39's findings are inputs, not a checklist

Thirteen labels (R01–R13) are not thirteen tests. R05, R06, R02 and R09 each
carry several distinct triggers; the capture in
[`../evidence/a1/pr39-capture.md`](../evidence/a1/pr39-capture.md) lists them.
Cover triggers, not labels. Give each one an evidence status or an explicit
coverage gap — and say plainly which areas you did not reach, rather than
letting silence imply coverage.

Note also that the "review" on PR #39 is an issue comment by the branch's own
author. Confidence in its prose is not evidence. Verify or qualify each claim.

## Publication protocol

One writer at a time on `trial/restart-analysis` (§1.2). Sessions never push to
it; they hand their commit to the A1 coordinator, which publishes serially.

A session finishes by reporting: its checkout, its branch, its report commit SHA
and the exact paths it wrote. The coordinator then takes **only those paths**:

```bash
git -C <planning checkout> fetch <session checkout path> <session branch>
git -C <planning checkout> checkout FETCH_HEAD -- \
  docs/research-logs/implementation-trial/analysis/<report>.md \
  tools/implementation-trial/<probe paths…>
```

Path-restricted, never a merge and never a cherry-pick of the whole commit.
That is what keeps reference production code out of the planning branch: the
session's checkout sits on top of the pinned reference, so merging it would
import all 104 of PR #39's production files onto a branch that must not carry
them.

After publishing, the coordinator verifies that:

```bash
git diff --stat main..trial/restart-analysis -- src packages tests specs .pactwright .claude
```

is still empty. If it is not, the publication took more than it should have.
