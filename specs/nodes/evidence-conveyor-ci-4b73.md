---
id: evidence-conveyor-ci-4b73
type: evidence
title: Observability-release lane implemented — issue-sync workflow, A9 transcription check (now manifest-correct and verified), sensitive-paths gate graduation, decision-* CODEOWNERS
status: final
created: 2026-07-30
produced_by: "/prepare-evidence"
---
Evidence that `brief-conveyor-ci-6a9f` (lane `observability-release`) satisfies its slice of
`contract-conveyor-derived-4c8c` plus the amendments of `decision-conveyor-derived-5a91`. Landed in
`88d4ded`, with one correction in this evidence's own commit (see *A9's fixture contract* below).

## What landed

**`.github/workflows/issue-sync.yml` (new) — Scope 5, CC-3, CC-5, A16.** One-way graph → issues
projection. Triggers: `push` on `main` filtered to `specs/nodes/**` and `specs/graph/**`,
`workflow_dispatch` with a `dry_run` input defaulting true, and a weekly `schedule:` cron (CC-5's
self-healing trigger). Workflow-level `permissions: {contents: read, issues: write}`, which also
sets every unlisted scope to `none`. `concurrency: {group: issue-sync, cancel-in-progress: false}`
so a scheduled run and a merge-triggered run cannot interleave one run's listing with another's
mutations, and an in-flight run is never cancelled mid-mutation. A job `timeout-minutes` so a hung
GraphQL call cannot pin a runner. The sync step carries `continue-on-error: true` and a report step
runs `if: always()`, writing planned/applied/failed and per-item lines to `$GITHUB_STEP_SUMMARY`.

**`.github/workflows/drift-review.yml` — Scope 6, Acceptance 6, the graduation.** The header was
rewritten in `patch-comparison.yml`'s honest-bound register, stating the three layers' *different*
enforcement. The step comment became a statement of current state rather than an instruction for
work now done. The step name became `Sensitive-paths gate (blocking)`. Exactly **one**
`continue-on-error: true` was deleted, from the sensitive-paths step.

**`.github/workflows/ci.yml` — A9.** The transcription check as a STEP in the already-required `ci`
job, with no `continue-on-error`.

**`.github/CODEOWNERS` — CC-10(a).** `/specs/nodes/decision-* @sb-dev` with a rationale comment,
and the stale `:1` header corrected to name decision nodes alongside schema and contract nodes.

## A9's fixture contract — a reconciliation, recorded not absorbed

As first committed, A9's step read a **per-command-directory** transcript layout
(`<command>/{specs/,node-id,expected-next.txt}`) that this lane invented in order to make the step
executable at all, and flagged at the time as a cross-lane interface needing reconciliation. The
`test-verification` lane's brief owns the fixture and specifies a different shape: **one shared
recorded graph plus a `transcript.yaml` manifest** of `{command, node, block}` entries. A human
settled it on 2026-07-30 in favour of the brief's layout — the fixture's owning lane wins.

So the step was corrected to read the manifest, in this lane's own file. Had it shipped
unreconciled, A9's legs 1 and 2 would have failed in CI against the fixture that actually landed,
and this evidence would have asserted a check that could not pass.

## A9 verified — enforced, and provably not vacuous

Run by extracting the step's `run:` script from the workflow and executing it locally (each pass
spawns 18 CLI invocations):

- **Positive** — all three legs pass, exit 0:
  `- OK: live-graph smoke (leg 3)`;
  `- OK: completeness — 14 chain commands, 17 recorded blocks (leg 1)`;
  `- OK: fixture replay — 17 blocks byte-identical (leg 2)`.
- **Negative, fixture absent** — with the fixture directory moved away the step **FAILS**, it does
  not skip: `::error … transcript fixture tests/fixtures/conveyor-transcript is absent (leg 1)`.
  That is the anti-vacuity property leg 1 exists for, and the analogue of the lane-pin's
  `git ls-files` leg.
- **Negative, one-character drift** — changing a single character inside one recorded block makes
  the step **FAIL** and name the offender:
  `::error … capture-intent/intent-fresh-0a01: recorded NEXT block differs from spec:status output
  (leg 2)`, with a unified diff written to the step summary.

The fixture was restored byte-identically after both negative runs (`git diff` on the fixture is
empty).

Leg 2's scratch copy is created **inside the repository**, not under `os.tmpdir()`: `--import tsx`
resolves through `./node_modules`, so a `/tmp` scratch dir makes every spawn exit 1 with
`ERR_MODULE_NOT_FOUND`. That trap cost a debugging round here and is the same one
`tests/spec.test.ts` documents at its `copyFixture` helper; the reason is now a comment in the step.

**HONEST BOUND, unchanged and not argued away.** A9 proves the recorded block is byte-identical to
what the resolver produces for the recorded graph, and that `spec:status` runs against the live
graph. It does **not** prove a human ran `spec:status` when they wrote a block — a hand-typed
byte-equal block passes. Closing that needs a run stamp or digest; this change does not take it, and
adding one is a follow-up intent under rule 5, never a silent addition.

**A9 is enforced, with one bound.** Because the check is a step inside the already-required `ci`
job, a transcription mismatch fails a required check on merge day with no admin action. What was
*not* done: inducing the failure on a live PR and observing `ci` go red in GitHub's UI. The local
negative runs above are the substitute, and the difference is stated rather than glossed.

## The graduation, verified

- `grep -cE '^\s+continue-on-error:' .github/workflows/drift-review.yml` → **1**, on the
  `Drift map (informational)` step. That survivor is deliberate and is **not** a graduation
  candidate: `drift-map` is a reporter, not a gate. Both the workflow header and
  `docs/drift-detection.md` say so, so no later reader "cleans it up" for symmetry.
- The four remaining `warn-only` strings in the file all describe the **semantic**
  `/detect-drift` layer, which stays warn-only. No global replace was run.
- `fetch-depth: 0` and `GATE_BASE` are untouched — the two inputs `spec:check-diff` needs to resolve
  a base, and the two known throw sources that removing `continue-on-error` promotes from an
  annotation to a red check.
- The required-check identity is the **job** id `drift-review` (no job-level `name:`), so renaming
  the step cannot change what branch protection would match.

**Graduation precondition.** `drift-review.yml` landed in PR #5 (`b4d3562`); five real PRs have run
the warn-only gate since — #6 `0ca4a72`, #10 `e396662`, #11 `3ad793b`, #13 `a65968c`, #15
`d189697` — so the "~5 real PRs" bar is met. `git log` proves the **count**; that the gate *behaved
correctly* on each is the judgement `decision-conveyor-derived-5a91` approved in selecting Scope 6.
Only the first is claimed as verified.

**Acceptance 6's honest bound, written into the file itself.** After the flip `drift-review` goes
**red** on a violating PR but **blocks nothing** until a repo admin marks it a required status
check. That wiring is repo-admin state, out of this diff and not reproducible from files in this
repository. Red is not blocked.

## CC-3, with no precedent

Verified: **no** other workflow in this repository declares `permissions:` at any level, references
a secret, or sets `concurrency:`/`timeout-minutes:`. `issue-sync.yml` therefore copied nothing and
declares its own model. `grep -rln '^permissions:' .github/` returns only that file, and it contains
**exactly one** `secrets.` reference (`secrets.GITHUB_TOKEN`).

**The scoped-secret question, answered rather than deferred.** The built-in `GITHUB_TOKEN` with
`issues: write` covers issue create/update/close/reopen with certainty. The GraphQL sub-issue and
blocked-by mutations are the least stable surface here (contract Risk 5), and whether the built-in
token is accepted for them is not verifiable from this repository. Decision: attempt them with the
built-in token; a permission or availability error is recorded as `failed` and warns. **No PAT
secret is introduced** — a repo secret held by a post-merge workflow on `main`, with no review gate
between a graph edit and a token use, is a privilege expansion this contract does not authorize. If
the built-in token proves insufficient in practice, adding `ISSUE_SYNC_TOKEN` is a follow-up intent
under rule 5.

**Apply is opt-in, never opt-out.** The sync mutates only when `ISSUE_SYNC_APPLY` is set; absent,
empty or misspelled, it plans and prints and changes nothing. Note the deliberate asymmetry with
`gitdiff.ts`: a **gate** fails closed because it blocks; a **mutator** fails safe because it acts.
Consequence, stated: `/decompose-lanes`' local `spec:issue-sync` invocation runs **dry** and the
authoritative apply happens post-merge here — which is also the correct semantics, since issues
project **merged** graph state, so a lane brief that never lands never gets an issue.

**Warn, never block.** The sync step's `continue-on-error: true` is **permanent by design** and is
explicitly not a graduation candidate, in deliberate contrast to the one `drift-review.yml` lost in
the same change. `issue-sync` must never be added to `docs/branch-protection.md`'s required checks.
This lane therefore deletes one `continue-on-error: true` and adds another, and the two are
opposites on purpose.

## Verification observed

- All seven workflow files parse as YAML (`js-yaml` load of each).
- Every inline `run:` block passes `bash -n`.
- A9's step executed for real: three legs green, two negative paths red. See above.
- `node_modules/.bin/tsx tools/spec.ts validate` → **OK, 20 rules, 0 errors.**
- `node_modules/.bin/tsc --noEmit` → exit 0; `eslint .` clean.
- `node --test --import tsx tests/*.test.ts` → **287 pass, 0 fail.**
- `spec:index` twice → byte-identical.

**Not verified, and not claimable from this repository:** no workflow was executed by GitHub. A
`workflow_dispatch` dry run producing a populated step summary, a forced sync failure leaving the
job's conclusion at `success`, and `drift-review` transitioning red on a live PR are all runtime
observations that need a real Actions run. They are named here as outstanding rather than asserted.

## Deviations and residuals

1. **A9's fixture layout was reconciled, not as first shipped.** Covered above. The correction is in
   this lane's own file, which is why it belongs in this lane's evidence rather than a follow-up.
2. **No `permissions:` retrofit** onto the five workflows this lane does not otherwise touch.
   Declined deliberately as hygiene the contract does not scope; recorded as a candidate follow-up
   intent rather than absorbed (rule 5).
3. **Post-flip failure surface, named as a cost.** Removing `continue-on-error` promotes every
   fail-closed throw in `tools/checkdiff.ts` and `tools/gitdiff.ts` from an annotation to a red
   check — an unresolvable base ref or unreadable object now reds `drift-review`. The two known
   throw sources are provisioned (`fetch-depth: 0`, `GATE_BASE`); the residual risk is real.
4. **`docs/branch-protection.md` staleness caused by this lane** was corrected by the `docs-spec`
   lane in `d666190`: the check count is now six with a `drift-review` row, the CODEOWNERS bullet
   list names `decision-*`, and the `ci` row's Enforces cell names A9's step. Cross-lane, reconciled.
5. **Leg 2's scratch directory leaks on failure.** `fs.rmSync` runs only on the success path, so a
   failing run leaves a `.a9-replay-*` directory in the workspace. Harmless on an ephemeral runner
   and it makes a failure inspectable; noted rather than hidden.

## Discharge key (CC-10(d))

This brief is the named discharger for **A9**, **A16**'s issue-sync half, **CC-3**, **CC-5**'s
complete-listing / per-run-report / scheduled-trigger halves, and **CC-10(a)**.
