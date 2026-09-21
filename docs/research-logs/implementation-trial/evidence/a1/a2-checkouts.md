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

All five were created on 21 September 2026, after PR #40 existed, so the
`state.md` each one carries already resolves the analysis branch and PR.

Overlaid from `trial/restart-analysis` at `4981f4d2269f1b43129df0316c4c565639acb339`.

| Session | Branch | Overlay commit |
|---|---|---|
| Graph and persistence | `trial/a2-graph` | `be08d0283036b52b2c64647652129c99fef50490` |
| Lifecycle and agent execution | `trial/a2-lifecycle` | `b185f601f112c33daead01660add0ad7162d91bd` |
| Distribution, recovery, concurrency | `trial/a2-distribution` | `290f3edbc70d2bbe31ada8120f41e4e3e294cdac` |
| Tests, evaluation, simplicity | `trial/a2-verification` | `037f01c8b03e381abcc420814a8ba2daaf8ab8bf` |
| Specifications and checkpoints | `trial/a2-runbooks` | `a295986a4b8a75cc2f50eb82cc3840f21d8980e1` |

Each overlay commit is the sole commit on top of
`19c66d5f2368932ff05306db1fae8da8ec5810dd`.

### Verified, not assumed

For every checkout:

- `git diff --name-only 19c66d5f <overlay> -- src packages tests specs .pactwright .claude .github examples skills-lock.json package.json pnpm-lock.yaml …`
  returns **0 paths**.
- The overlay diff against the reference contains **only** the 28 files listed
  under *What the overlay contains* — no path outside
  `docs/research-logs/implementation-trial/`, the runbook and
  `tools/implementation-trial/`.
- `git status --porcelain` is **empty**: no stray working-tree change.
- The `src`, `packages` and `tests` tree hashes are identical across all five
  checkouts and identical to the reference's:

  ```
  src      ea6a948d0b1a84ceb3f8690396a8c1f554e91c43
  packages 874973b940b485550d86854df9861ad62a2010d6
  tests    c8089f77e7102923b554121485a517507c0d30b6
  ```

### Before a session starts work

Dependencies are not installed. Run `pnpm install --frozen-lockfile` in the
checkout first; A1 measured that at 1.7s against a warm pnpm store on the
reference.

A session that wants a clean reference *without* the overlay — to compare
against, or to run a probe on untouched code — can use
`/Users/samir/workspace/pactwright-trial/reference`, which is detached at the
pinned SHA and already installed and built. Do not commit in it.
