# A1 — reference preservation and live-branch divergence

The runbook requires the pinned reference to stay reachable and any live-branch
divergence to be recorded. It also forbids repairing it, resetting its branch or
merging its unresolved runtime. This file records what A1 verified, what it
found at risk, and what it did about it.

## The reference exists and is unambiguous

```
$ git cat-file -t 19c66d5f2368932ff05306db1fae8da8ec5810dd
commit
$ git log -1 --format='%H %an %ad %s' 19c66d5f2368932ff05306db1fae8da8ec5810dd
19c66d5f2368932ff05306db1fae8da8ec5810dd
Claude <noreply@anthropic.com>
Sun Sep 20 22:27:51 2026 +0000
docs: record the Checkpoint 1 consolidation as closed
```

## Divergence: none, at A1

| Pointer | SHA | Divergence |
|---|---|---|
| Pinned reference | `19c66d5f2368932ff05306db1fae8da8ec5810dd` | — |
| `review/checkpoint-1` (local) | `19c66d5f…` | none |
| `origin/review/checkpoint-1` | `19c66d5f…` | none |
| PR #39 `headRefOid` | `19c66d5f…` | none |
| `main` / `origin/main` (default branch) | `c38fa95afe66fb68dcc3a297cebc04587365f23d` | see below |

`git merge-base main 19c66d5f` is `c38fa95a`, and `git merge-base --is-ancestor
main 19c66d5f` succeeds. So **`main` is an ancestor of the reference**: the
reference is `main` plus 19 commits, and `git rev-list --count main --not
19c66d5f` is `0`. There is nothing on the default branch that the reference
lacks, which is why `trial/restart-analysis` could be branched from `main`
cleanly and why PR #39 reports `MERGEABLE` / `CLEAN`.

The 19 commits between them are exactly the consolidation: 12 `feature:`,
1 `fix:`, 5 `docs:` (the design log, the spec-amendment commit, a delivery-log
update, a Kakeibo step edit and the closing record) and 1 `review:`.

## The disposable reference checkout

`/Users/samir/workspace/pactwright-trial/reference` is a full clone made with
`git clone --no-hardlinks`, checked out detached at the pinned SHA. It has its
own object store, so nothing an A2 session does there can reach the canonical
repository.

Its fidelity was verified rather than assumed: the working tree hashes to
`f4775cfc1540292f5ef863e6ade6a03bca866a52`, which is
`19c66d5f2368932ff05306db1fae8da8ec5810dd^{tree}`. `git status --porcelain` is
empty.

Nothing in it was repaired. The one failing test recorded in
[`baseline-checks.md`](baseline-checks.md) is still failing there.

## The preservation hazard A1 found

PR #39's review comment states:

> Every commit SHA in this description and in design log §16 is dangling. All
> fifteen — `fdee1be`, `a9366bc`, `8c4bf92`, `d672cc2` and the rest — return
> `MISSING` from `git cat-file`.

A1 checked every SHA-shaped token in
`docs/research-logs/2026-09-20-pactwright-checkpoint-1-consolidation-design.md`.
Of 21 tokens, 18 are commits and 3 are node-id suffixes
(`1aa06050`, `2bebaf56`, `f7c969ea`) that only look like short SHAs.

The result splits in two, and both halves matter:

| Question | Answer |
|---|---|
| Are the fifteen cited commits ancestors of the pinned reference? | **No** — not one of them. The branch was rebased after the log was written, so the log cites the pre-rebase commits. `fdee1be`'s post-rebase counterpart is `df243bc`. |
| Do they exist in the repository? | **Yes** — every one resolves. All fifteen are reachable from `origin/claude/pactwright-checkpoint-1-consolidation-2bsnud`, tip `3fbaa22051d7f91c21ae6f2d22c3d73bf0eeaf32`, which is still a live remote branch carrying its own 19 commits. |

So the delivery record for the whole consolidation is recoverable today, and
would stop being recoverable the moment that branch is deleted on `origin`.
That is a preservation risk, not a documentation nit: §16 is the only record
mapping the design's steps to the commits that delivered them.

**What A1 did.** Pinned both lineages with refs, in the canonical repository and
in the reference checkout, so neither garbage collection nor an upstream branch
deletion can make them unreachable locally:

```
refs/trial/reference                 19c66d5f2368932ff05306db1fae8da8ec5810dd
refs/trial/pre-rebase-consolidation  3fbaa22051d7f91c21ae6f2d22c3d73bf0eeaf32
```

These are plain refs outside `refs/heads/`, so they do not appear as branches,
are never pushed, and change nothing about what PR #39 or `review/checkpoint-1`
point at. No branch was moved, reset or force-updated.

**What A1 did not do.** It did not correct §16, re-point the log at the
post-rebase SHAs, or reconstruct the mapping. Deciding whether that record is
repaired, superseded or left as found is A5's, and A2's runbook audit owns
reporting it. A1 only made sure the material to decide with still exists.

**What is still exposed.** The pinned refs above are local to the A1 machine.
Nothing prevents `origin/claude/pactwright-checkpoint-1-consolidation-2bsnud`
from being deleted on GitHub, after which the pre-rebase objects survive only in
local clones. If that record is judged worth keeping, the durable fix is a tag
pushed to `origin` — which is a maintainer action, not one A1 takes unasked.
