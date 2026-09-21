# A1 — PR #39 capture

Captured 2026-09-21T22:23Z with the authenticated GitHub CLI. The verbatim text
is in [`pr39/`](pr39/); this file records provenance and, as importantly, what
is *not* in the capture.

PR #39 is an **investigation input, not the oracle** (runbook §1.3). Nothing
below is an A1 result. A2 verifies or qualifies each of its claims.

## Source

| | |
|---|---|
| PR | <https://github.com/sb-dev/pactwright/pull/39> |
| Title | *Close the Checkpoint 1 consolidation: all thirteen review findings* |
| Author | `sb-dev` |
| State | open, **not** draft, `MERGEABLE` / `CLEAN` at capture |
| Base → head | `main` → `review/checkpoint-1` at `19c66d5f2368932ff05306db1fae8da8ec5810dd` |
| Opened | 2026-09-20T22:43:19Z |
| Last updated | 2026-09-21T07:24:57Z |
| Diff | 104 files, +9,613 / −1,352 |
| `reviewDecision` | empty |

## What was captured

| File | Source | Command |
|---|---|---|
| [`pr39/body.md`](pr39/body.md) | the PR description, 6,727 characters | `gh pr view 39 --json body` |
| [`pr39/issue-comment-5756888228.md`](pr39/issue-comment-5756888228.md) | <https://github.com/sb-dev/pactwright/pull/39#issuecomment-5756888228>, created and last updated 2026-09-21T07:24:57Z by `sb-dev`, 27,187 characters | `gh api repos/sb-dev/pactwright/issues/39/comments --paginate` |
| [`pr39/reviews.json`](pr39/reviews.json) | formal reviews | `gh api repos/sb-dev/pactwright/pulls/39/reviews --paginate` |
| [`pr39/inline-comments.json`](pr39/inline-comments.json) | inline review comments | `gh api repos/sb-dev/pactwright/pulls/39/comments --paginate` |
| [`pr39/metadata.json`](pr39/metadata.json) | the structured PR record above | `gh pr view 39 --json …` |

## What is not there, and why that matters

**There are zero formal reviews and zero inline comments.** Both collections
came back as empty arrays, not as errors. The runbook's A1 prompt asks for "PR
#39's body, conversation, review and inline comments"; the honest answer is that
the conversation is **one issue comment** and the other two surfaces are empty.

So the document everyone calls "the PR #39 review" is an issue comment by the
PR's own author, posted through the same account that authored the branch. Under
§1.2 that is not an independent review: *"A review is independent only when the
reviewer did not author the material being judged."* It is a detailed,
specific and useful investigation input. It is not a second human approval, and
A2 must not treat its findings as settled because they are written confidently.

## What the comment claims

Verbatim text is in the capture. In outline, so that A2 can plan coverage
without re-reading 27,000 characters:

- **Verdict:** keep Checkpoint 1 open. Three of thirteen findings (R01, R04,
  R13) fully closed; nine with blocking gaps.
- **Blocking findings named against source locations:** R05 (three separate
  failures — false `completed` with no Evidence; a compliant agent cannot
  complete a Review; the outcome parser misreads prose), R06 (three — comparison
  reports agreement when nothing was evaluated; `eval` scores a pack the
  executor never invoked; the Step 28 command cannot succeed because every
  released baseline is pinned incompatible), R02 (two — a caller-supplied
  `revision` disables the drift guard; a project outside a git work tree closes
  over unreviewed content), R03 (back-dating `created` skips the closure-block
  requirement), R12 (`review → review` synthetic edge fails validation on state
  no human touched), R04 (the adapter path launders unparseable execution
  state), R07/R10 (a failed Extension migration leaves the graph migrated and
  the project unloadable; a pending migration is silently discarded), R08 (the
  package-manager lock's contents are still never read), R09 (two — `agent-pack
  upgrade` still does not acquire; the runtime upgrade can silently downgrade),
  R11 (Evidence correction advertised then refused for every record here), §12
  (the new adapter sentence stops three commands), §10 (the writer lock releases
  a lock it no longer owns).
- **A stated root cause:** *"a test double more capable than the shipped code"*,
  with seven instances named.
- **Two meta-claims:** that installation and CLI re-entry cross the "nothing an
  Extension ships is executed" boundary, and that every commit SHA cited in the
  PR description and in design log §16 is dangling.
- **A suggested repair order**, and a separate decision request about
  `.claude/agents/` and `.claude/commands/` being excluded from the delivery
  digest.

Counting finding *labels* gives thirteen. Counting distinct **triggers** gives
more — R05, R06, R02 and R09 each carry several. A2's coverage must be per
trigger; §1.3 and A2's ChatGPT prompt both say so explicitly.

## A1's own position on these claims

A1 reproduced **none** of them; that is A2's work. A1 did check two things that
bear directly on whether the capture can be trusted as a starting point, and one
of the comment's claims needs qualifying before A2 inherits it:

1. **Verification status.** The comment states `pnpm verify` passes at this head
   with 684 tests, 683 passing, 1 skipped, 0 failing. On the A1 machine the same
   command at the same SHA returns **684 tests, 682 passing, 1 skipped, 1
   failing, exit 1**. Both can be true: GitHub Actions is green on this SHA on
   Linux, and the failure is platform-dependent. See
   [`baseline-checks.md`](baseline-checks.md). Neither the comment's result nor
   the green CI badge is A1's result.

2. **"Every commit SHA … is dangling. All fifteen … return `MISSING`."** This
   needs splitting. All fifteen are indeed **not ancestors of the pinned
   reference** — the branch was rebased, so the log cites commits that its own
   branch no longer contains. But they are **not** missing from the repository:
   every one is reachable from `origin/claude/pactwright-checkpoint-1-consolidation-2bsnud`,
   which is still a live remote branch. The delivery record is recoverable
   today, and is one branch deletion away from not being. A1 pinned it; see
   [`reference-preservation.md`](reference-preservation.md).
