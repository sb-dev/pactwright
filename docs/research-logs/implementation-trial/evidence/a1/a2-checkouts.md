# A1 — the five isolated A2 checkouts

A2 runs five sessions that must not see each other's conclusions and must not
write to the same branch. Each gets its own checkout whose **production files
are byte-identical to the pinned reference**, with the trial's own records
overlaid on top and nothing else.

## Why they are built this way

Two constraints pull in opposite directions.

A2's sessions have to read and probe the reference *as it is* — the whole point
is to audit `19c66d5f`'s runtime, so their checkouts sit on that commit. But
their reports land on `trial/restart-analysis`, which was branched from `main`
and **must never carry PR #39's production changes**. Merging a session branch
into the planning branch would import all 104 of them.

So: sessions work on top of the reference, and the coordinator publishes by
copying report paths only. The branch topology makes the mistake visible rather
than relying on care.

## Layout

| Session | Checkout | Branch | Writes |
|---|---|---|---|
| Graph and persistence | `/Users/samir/workspace/pactwright-trial/a2/graph` | `trial/a2-graph` | `analysis/graph.md` |
| Lifecycle and agent execution | `/Users/samir/workspace/pactwright-trial/a2/lifecycle` | `trial/a2-lifecycle` | `analysis/lifecycle.md` |
| Distribution, recovery, concurrency | `/Users/samir/workspace/pactwright-trial/a2/distribution` | `trial/a2-distribution` | `analysis/distribution.md` |
| Tests, evaluation, simplicity | `/Users/samir/workspace/pactwright-trial/a2/verification` | `trial/a2-verification` | `analysis/verification.md` |
| Specifications and checkpoints | `/Users/samir/workspace/pactwright-trial/a2/runbooks` | `trial/a2-runbooks` | `analysis/runbooks.md` |

Each is an independent `git clone --no-hardlinks` with its own object store, so
no session can reach the canonical repository or another session's work. The
branch is created from `19c66d5f2368932ff05306db1fae8da8ec5810dd` and carries
exactly one A1 commit on top of it: the overlay.

## What the overlay contains

Only what a session needs to resolve the assignment and avoid duplicating A1:

- `docs/research-logs/2026-09-21-pactwright-implementation-trial-spec.md` — the runbook
- `docs/research-logs/implementation-trial/` — `state.md`, `results.md`,
  `analysis/README.md` and all of `evidence/a1/`
- `tools/implementation-trial/` — the A1 measurement probe, which the
  verification audit needs to assess source-size metrics for gaming

Nothing else. No production file is added, removed or modified by the overlay,
which is checked after creation rather than assumed:

```bash
git diff --stat 19c66d5f2368932ff05306db1fae8da8ec5810dd <overlay sha> \
  -- src packages tests specs .pactwright .claude .github
# must be empty
```

The overlay is a snapshot of the planning branch at the time the checkout was
made. A session that wants the current planning head refreshes it with
`git fetch` from the planning checkout and a path-restricted checkout of
`docs/research-logs/implementation-trial/` — never a merge.

The overlay deliberately does **not** contain a record of its own creation; that
is this file, which is written on the planning branch afterwards.

## Rules for a session

1. Work only in your own checkout. Do not read another `analysis/*.md`.
2. Do not repair the reference. It fails where it fails; a fix hides the
   finding you were sent to report.
3. Commit your report and probes with your `A2-x` subject prefix. Probes go
   under `tools/implementation-trial/`.
4. Do not push anything, and do not write to `trial/restart-analysis`.
5. Hand back: checkout path, branch, report commit SHA, exact paths written.

The coordinator publishes serially with a path-restricted checkout; the exact
commands are in [`../../analysis/README.md`](../../analysis/README.md).

## Created

The checkouts are created in the A1 publication step, after the analysis PR
exists, so that the `state.md` they carry already resolves the PR. Their branch
names and overlay SHAs are recorded in the table above and below once created.

*Creation record: pending in this commit; written in the A1 publication commit.*
