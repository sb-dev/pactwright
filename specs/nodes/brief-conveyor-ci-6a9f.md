---
id: brief-conveyor-ci-6a9f
type: brief
title: Conveyor CI surface — issue-sync workflow, A9 transcription check, sensitive-paths gate graduation, decision-* CODEOWNERS
status: implemented
created: 2026-07-28
lane: observability-release
produced_by: "/decompose-lanes"
---
This brief decomposes `contract-conveyor-derived-4c8c` (status: approved, class 3) for the
`observability-release` lane of `intent-self-guiding-delivery-loop-6d79` (status: open), per
decision `decision-conveyor-derived-5a91` — whose sixteen amendments A1-A16, together with the
sixteen common-core findings CC-1-CC-16 binding in full through `comparison-conveyor-market-890e`,
are the effective contract this brief carries. This lane owns the `.github/` surface and nothing
else: the new `issue-sync.yml` workflow, A9's transcription check, the `drift-review.yml`
warn-to-blocking graduation, and the `.github/CODEOWNERS` addition. Every other surface belongs to
another lane — `tools/**` and `package.json` to `domain-backend`, `specs/schema/**` and all graph
data to `data-migration`, the fifteen `.claude/commands/*.md` files to `api-integration`,
`.claude/lanes/**` and `.claude/agents/**` to `product-spec`, `CLAUDE.md` and `docs/**` to
`docs-spec`, and `tests/**` to `test-verification`. **BOOTSTRAP:** this decomposition predates the
lane market the contract builds — `.claude/lanes/` does not exist, `owner` is not in the schema, and
none of the seven implementer agents exist — so no brief in this decomposition carries an `owner`
key, and lane owners are assigned by `/decompose-lanes` only after this change lands.

## Grounding (reuse, don't reinvent)

All paths absolute under `/home/samir/workspace/pactwright/`. Line numbers were verified in this
session; **re-confirm each before editing**, since earlier edits in the same file shift them.

- **`.github/workflows/drift-review.yml` — 50 lines.** Job id `drift-review` at `:14` with **no**
  job-level `name:` key, so the GitHub check name that branch protection would require is
  `drift-review`. The four things this lane changes in it: the false header comment block at `:3-9`
  ("Warn-only drift detection on every PR — nothing here fails the build yet"), the step comment at
  `:29` ("graduates to blocking FIRST (drop continue-on-error)"), the step **name** at `:30`
  (`Sensitive-paths gate (warn-only)`), and `continue-on-error: true` at `:31`. Steps already carry
  `fetch-depth: 0` (`:18-19`) and `GATE_BASE` (`:32-33`), which are the two inputs `spec:check-diff`
  needs to resolve a base.
- **`.github/workflows/patch-comparison.yml` — 33 lines; the honest-bound header precedent.** Its
  `:3-11` comment block is the in-repo voice for "this workflow COMPUTES and REPORTS; BLOCKING
  depends on the repo-admin branch-protection required-check setting … not reproducible from files
  in this repo". Reuse that register verbatim in style for the rewritten `drift-review.yml` header
  rather than inventing a new one.
- **`.github/workflows/ci.yml` — 21 lines.** Job id `ci` at `:7`, no job-level `name:`; steps are
  checkout (`:10`, no `fetch-depth`), pnpm setup (`:11-13`), node 22 (`:14-17`), install (`:18`),
  `pnpm test` (`:19`), `pnpm typecheck` (`:20`), `pnpm lint` (`:21`). `ci` is the one
  already-required check in `docs/branch-protection.md:18`, which is why A9 lands here (see Pinned
  decisions).
- **Named-check convention, 6/6.** Every workflow in `.github/workflows/` names its job identically
  to its workflow and sets no job-level `name:` — `ci`, `spec-index`, `spec-validate`,
  `pr-evidence`, `patch-comparison`, `drift-review`. A check name is the **job** id; a step name is
  cosmetic. Renaming the `:30` step therefore changes no required-check identity.
- **`.github/CODEOWNERS` — 8 lines.** `:1` header comment ("Schema changes and contract nodes
  require review by the graph owner."), `:2` `/specs/schema/`, `:3` `/specs/nodes/contract-*`,
  `:4-7` the four-line rationale comment explaining why `override-*` needs code-owner review, `:8`
  `/specs/nodes/override-*`. That `:4-7` comment is the shape to mirror for the new `decision-*`
  rule.
- **`specs/schema/checks.yaml` — the flip needs no registry change.** `check-diff` is already a
  registered check id (`:13`), so the override path for the newly-blocking gate — an `override` node
  plus `waives → check-diff` — already resolves under `edges-references-resolve`. This lane adds no
  check id and touches no file under `specs/schema/**`.
- **`capability-ci-enforcement-3e4f`** owns `paths: [.github/workflows/**, .github/CODEOWNERS]`
  (`:7`). Every file this lane creates or modifies falls inside that glob, so this lane's diff opens
  **no** coverage gap and its evidence `touches` exactly one capability. This is a hard design
  constraint, not an observation: a helper script at `.github/scripts/` would be owned by no
  capability and would force a graph-data fix in another lane, so **all shell this lane needs stays
  inline in the workflow files**.
- **`tools/gitdiff.ts:5-12`** — the fail-closed doctrine this repo already writes down: "Every
  helper fails CLOSED — a spawn failure or unexpected non-zero exit throws rather than yielding
  empty base sets that would make the whole tree look 'added' and a gate pass for the wrong reason."
  CC-5's complete-listing guarantee is the same discipline applied to `gh` listings; cite it, do not
  restate it differently.
- **`tools/spec.ts:78-85`** — the per-run report precedent: findings are printed line by line,
  then one summary line naming counts and where the durable report was written, in the shape
  `spec:validate: N error(s) across M rules (report: …)`. CC-5's planned/applied/failed report
  takes the same shape.
- **`docs/branch-protection.md:24-30`** — the required-check doctrine: `pr-evidence` and
  `spec-validate` run on **every** PR and decide scope *inside* the job, because "a check that
  filters at the event level (a workflow-level `paths:` filter) must **not** be made required: on a
  PR it never runs for, no status is posted and GitHub blocks the PR forever waiting on it." This
  constrains the transcription check (never filter at the event level) and explicitly **releases**
  `issue-sync.yml` (never a required check, so it may filter).
- **`tests/spec.test.ts:14-28`** — how the CLI is already exercised against a fixture graph: copy
  the fixture into a temp dir, then spawn `node --import tsx tools/spec.ts <subcommand>` with `cwd`
  set to that dir. `loadSpec()` (`tools/loader.ts:92`) defaults its root to `process.cwd()/specs`,
  so replaying a recorded graph is a `cd` plus a spawn — no new tooling entry point is required for
  A9.
- **Graduation precondition, verified from history.** `drift-review.yml` landed in PR #5
  (`b4d3562`). Five real PRs have run the warn-only gate since — #6 (`0ca4a72`), #10 (`e396662`),
  #11 (`3ad793b`), #13 (`a65968c`), #15 (`d189697`) — so the "~5 real PRs" bar written into the
  header at `:6` and into `docs/drift-detection.md:38-40` is **met**. What `git log` proves is the
  count; that the gate *behaved correctly* on each is the judgement `decision-conveyor-derived-5a91`
  approved in selecting Scope 6. State both halves; claim only the first as verified.
- **No `permissions:` precedent exists — state this plainly in the PR.** None of the six workflows
  (`ci.yml`, `drift-review.yml`, `patch-comparison.yml`, `pr-evidence.yml`, `spec-index.yml`,
  `spec-validate.yml`) declares a `permissions:` block at workflow level or job level; none
  references any secret; none declares `concurrency:` or `timeout-minutes:`. `issue-sync.yml`
  therefore has nothing to copy and must declare its own model from first principles (CC-3).

## Pinned decisions (the amendments THIS lane discharges — binding constraints)

- **A9 — the transcription check is a STEP in the existing `ci` job of `.github/workflows/ci.yml`,
  not its own workflow and not a new job. Decided and recorded here.** A9's text is that the check
  makes "IDs resolved not recalled" stop being prose-enforced and **retires** B's Acceptance 1
  honest bound. A GitHub check name is the job id, so both a new workflow and a new job inside
  `ci.yml` would create a check that is **not required** and therefore blocks nothing until an
  out-of-diff admin action — which would not retire the honest bound, only exchange it for the same
  bound Acceptance 6 already admits for `drift-review`. Only a step inside the already-required `ci`
  job (`docs/branch-protection.md:18`) is enforced on merge day. The accepted costs, stated not
  claimed away: `ci`'s blast radius grows, a transcription mismatch now blocks every merge, and the
  verdict shares the `ci` check name with test/typecheck/lint. Both costs are mitigated by a
  distinctive step `name:`, an `::error::` annotation, and a `$GITHUB_STEP_SUMMARY` verdict block
  (CC-12's "name where the verdict is recorded") — never by weakening the step to non-fatal.
- **A9 — honest bound, stated in the step's own comment.** The check proves the recorded block is
  byte-identical to what the resolver produces for the recorded graph, and that `spec:status` runs
  against the live graph. It does **not** prove a human ran `spec:status` when they wrote the block:
  a hand-typed block that happens to be byte-equal passes (the reliability panel's finding 2 on B).
  A run-stamp or digest would close that (the compliance panel's finding 2 on B); this change does
  not take it, and adding one later is a follow-up intent under rule 5, never a silent addition.
- **A9 — fail-closed, never vacuous.** The step FAILS, never skips, when the transcript fixture
  directory is absent or empty, when a fixture is unparseable, or when the NEXT-block sentinel is
  missing from `spec:status` output. It carries an explicit completeness leg: every chain command
  file listed by `git ls-files .claude/commands` — minus `detect-drift.md` and
  `update-spec-graph.md`, which are not chain steps — must appear in the transcript set. This is the
  analogue of pin leg 12 (`git ls-files .claude/lanes` lists eight files) and exists for the same
  reason: without it the whole check passes vacuously on an empty set. **Drift-pin leg numbers in
  this brief follow the thirteen-leg union pinned in `brief-conveyor-tests-4c86` (amendment A13),
  not the approved contract's superseded ten-leg Behaviour 3 numbering; the A9 step's own leg
  numbers below are unrelated to it.**
- **A16 (issue-sync half) / CC-3 — `issue-sync.yml` declares its own credential and permission
  model, with no in-repo precedent.** Workflow-level `permissions: {contents: read, issues: write}`,
  which also sets every unlisted scope to `none`; `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` and
  `GH_REPO: ${{ github.repository }}` exported for the sync; the sync passes `--repo "$GH_REPO"`
  explicitly on every `gh` and `gh api` invocation and refuses to run when `GH_REPO` is unset rather
  than falling back to a git remote. The workflow references **exactly one** `secrets.` value,
  `secrets.GITHUB_TOKEN`, and no other.
- **CC-3 — the scoped-secret question, answered.** The built-in `GITHUB_TOKEN` with `issues: write`
  covers issue create/update/close/reopen/comment with certainty. The GraphQL **sub-issue** and
  **blocked-by** mutations are the least stable surface in this change (contract Risk 5) and whether
  the built-in token is accepted for them is not verifiable from this repo. **Decision:** attempt
  them with the built-in token; a permission or availability error is recorded as `failed` in the
  per-run report and warns. This change does **not** introduce a scoped PAT secret — a repo secret
  held by a workflow running post-merge on `main`, where no review gate stands between a graph edit
  and a token use, is a privilege expansion the contract does not authorize. If the built-in token
  proves insufficient in practice, adding `ISSUE_SYNC_TOKEN` is a follow-up intent under rule 5.
- **CC-3 — local runs default to dry-run, and apply is opt-in, never opt-out.** The sync mutates
  only when the workflow explicitly sets the apply switch (`ISSUE_SYNC_APPLY=1`); with the variable
  absent, misspelled, or empty the sync plans and prints and mutates nothing. Note the deliberate
  asymmetry with `gitdiff.ts`: a **gate** fails closed (it blocks), a **mutator** fails safe (it
  does nothing). Consequence to state in the PR: `/decompose-lanes`' local `spec:issue-sync`
  invocation (Behaviour 9) runs dry — it plans and prints the projection — and the authoritative
  apply happens post-merge in this workflow. This is also the correct semantics: issues project
  **merged** graph state, never an unmerged working tree, so a lane brief that never lands never
  gets an issue.
- **CC-5 (this lane's three halves; the `planIssueSync` seam is `domain-backend`'s).** (a)
  *Complete-listing guarantee* — the workflow invokes the sync in a mode where an incomplete or
  errored `gh` listing aborts **before any mutation** rather than proceeding against a partial view
  (the `tools/gitdiff.ts:5-12` fail-closed doctrine); the workflow never retries a failed run
  blindly and never passes a flag that downgrades that abort. (b) *Per-run report* — the workflow
  echoes the sync's `planned` / `applied` / `failed` counts and per-item lines into
  `$GITHUB_STEP_SUMMARY` so each run leaves a durable record, in the `tools/spec.ts:78-85` shape.
  (c) *Scheduled trigger* — a weekly `schedule:` cron for self-healing reconciliation, in addition
  to `push` on `main` and `workflow_dispatch`.
- **Warn, never block — and never a graduation candidate.** The sync step carries
  `continue-on-error: true` and the job's conclusion stays success even when the sync fails; a
  failure surfaces as a `::warning::` annotation and in the step summary. This lane therefore
  **deletes** one `continue-on-error: true` and **adds** another, and the two are opposites on
  purpose: the sensitive-paths gate is a correctness control that has earned graduation, while the
  sync is a best-effort projection into a lossy external system where **the graph stays truth**
  (contract Risk 5). Write that distinction into `issue-sync.yml`'s header so no later reader
  "cleans up" the survivor. `issue-sync` must never be added to `docs/branch-protection.md`'s
  required checks.
- **Scope 6 / Acceptance 6 — delete exactly one `continue-on-error: true`, at `:31`.** The second
  one at `:38` on the **Drift map (informational)** step is **NOT in scope** and must survive:
  `drift-map` is a reporter, not a gate, and Acceptance 6 constrains only the sensitive-paths step.
  Say so in the diff so nobody removes it as symmetry.
- **The fourth stale string Scope 6 does not name.** The step **name** at `:30` —
  `Sensitive-paths gate (warn-only)` — becomes false on the flip and is included in this lane. It
  becomes `Sensitive-paths gate (blocking)`. The four *other* "warn-only" occurrences in the file —
  `:8`, `:43`, `:47`, `:49` — all describe the **semantic** `/detect-drift` layer, which stays
  warn-only, and must **not** be touched. Do not run a global replace on "warn-only".
- **Acceptance 6's honest bound is this lane's to restate, in the file itself.** After the flip,
  `drift-review` goes **red** on a violating PR but **blocks nothing** until a repo admin marks
  `drift-review` a required status check. That wiring is repo-admin state, out of this diff and not
  reproducible from files in this repo. Red is not blocked; state the distinction in the rewritten
  header rather than implying the flip is enforcement. The audit row that records the intended
  configuration is `docs/branch-protection.md`'s — CC-10(b), the `docs-spec` lane's — and is a
  cross-lane dependency of this lane's acceptance, not a file this lane edits.
- **CC-10(a) — add `/specs/nodes/decision-*` to `.github/CODEOWNERS`.** It is the one node path with
  no required review, and decision bodies now bind: this contract's own effective text lives in
  `decision-conveyor-derived-5a91`, so an unreviewed decision edit silently rewrites an approved
  contract's effective content. The `:1` header comment ("Schema changes and contract nodes require
  review by the graph owner.") goes stale with this addition and is corrected in the same edit — a
  **fifth** stale string, in a different file, that the Scope does not name.
- **Post-flip failure surface, named as a cost.** Removing `continue-on-error` also promotes every
  fail-closed *throw* inside `tools/checkdiff.ts` and `tools/gitdiff.ts` from an annotation to a red
  check — an unresolvable base ref or an unreadable object now reds `drift-review` rather than
  passing quietly. The two known throw sources are already provisioned in this file
  (`fetch-depth: 0` at `:18-19`, `GATE_BASE` at `:32-33`); the residual risk is real and belongs in
  the PR body, not in a mitigation claim.
- **No retrofit of the other workflows.** CC-3 requires a permissions model for `issue-sync.yml`.
  Adding `permissions:` blocks to `ci.yml`, `drift-review.yml`, `patch-comparison.yml`,
  `pr-evidence.yml`, `spec-index.yml` and `spec-validate.yml` is adjacent hygiene the contract does
  not scope; this lane declines it deliberately and records it as a candidate follow-up intent
  rather than absorbing it silently (rule 5). New files this lane authors declare least privilege at
  birth; that is a default, not a retrofit.

## Files to create

1. `/home/samir/workspace/pactwright/.github/workflows/issue-sync.yml` — the one-way graph→issues
   sync workflow: `push` on `main`, `workflow_dispatch` with a `dry_run` input, and a weekly
   `schedule:` cron; workflow-level `permissions: {contents: read, issues: write}`; `concurrency`
   guard; the sync step `continue-on-error: true`; a step-summary report step.

This lane creates no other file. A9's check is a step in an existing workflow, and all shell it
needs is inline (see the `capability-ci-enforcement-3e4f` grounding note — a `.github/scripts/`
helper would be owned by no capability).

## Files to modify

1. `/home/samir/workspace/pactwright/.github/workflows/drift-review.yml` — the graduation: rewrite
   the header comment (`:3-9`) and the step comment (`:29`), rename the step (`:30`), delete
   `continue-on-error: true` (`:31`) and **only** that one.
2. `/home/samir/workspace/pactwright/.github/workflows/ci.yml` — append A9's transcription step
   after `pnpm lint` (`:21`).
3. `/home/samir/workspace/pactwright/.github/CODEOWNERS` — correct the `:1` header comment and add
   the `/specs/nodes/decision-*` rule with a rationale comment in the `:4-7` shape.

## Ordered implementation steps

Line numbers below are the current-tree anchors verified in this session; **re-confirm each before
editing**. Steps 1-3 are mutually independent in content; step 4 depends on nothing in this lane but
is inert until two other lanes land (see Cross-lane dependencies).

1. **`.github/CODEOWNERS` — CC-10(a).** Rewrite `:1` so it names decision nodes alongside schema and
   contract nodes. Insert the new rule after the existing `/specs/nodes/contract-*` line (`:3`),
   keeping the `:4-7` comment contiguous with the `/specs/nodes/override-*` line it explains, and
   give the new rule its own rationale comment in that same shape — that decision bodies now carry
   binding amendments, so an unreviewed decision edit rewrites an approved contract's effective
   text. Note in the PR that CODEOWNERS is last-match-wins and the three `/specs/nodes/*` patterns
   are disjoint, so ordering among them is immaterial today; a future overlapping glob would not be.

2. **`.github/workflows/drift-review.yml` — the graduation (Scope 6, Acceptance 6).**
   1. Replace the `:3-9` header block. It must state, in `patch-comparison.yml:3-11`'s register: the
      deterministic sensitive-paths gate (`spec:check-diff`) is **blocking** — its failure fails
      this job; the semantic `/detect-drift` layer remains **warn-only** and manual until a Claude
      Code action is wired with pinned credentials; the **Drift map** step is informational and
      keeps its `continue-on-error: true` deliberately; the waiver path is an `override` node plus
      `waives → check-diff` (registered at `specs/schema/checks.yaml:13`); and the honest bound — a
      failing job blocks no merge until a repo admin marks `drift-review` a required status check,
      which is repo-admin state not reproducible from files in this repo
      (`docs/branch-protection.md`). Delete the "flip it to BLOCKING by removing
      `continue-on-error: true` … once it has behaved correctly on ~5 real PRs" instruction: it has
      been carried out.
   2. Replace the `:29` step comment. It currently reads "Deterministic layer — graduates to
      blocking FIRST (drop continue-on-error)", an instruction for work now done; it becomes a
      statement of the current state — the deterministic layer is blocking, and it is waivable by an
      `override` + `waives → check-diff`.
   3. Rename the step at `:30`. `Sensitive-paths gate (warn-only)` becomes
      `Sensitive-paths gate (blocking)`. Note in the PR that the required-check identity is the
      **job** id `drift-review` (`:14`, no job-level `name:`), so a step rename cannot change what
      branch protection would match.
   4. Delete line `:31`, `continue-on-error: true`, from the `Sensitive-paths gate` step. **Leave
      `:38` alone** — the identical line on the `Drift map (informational)` step (`:37`) is out of
      scope and must remain.
   5. Re-read the whole file. Confirm exactly one `continue-on-error: true` survives, on the Drift
      map step; confirm the four remaining "warn-only" strings (`:8`, `:43`, `:47`, `:49` pre-edit)
      all still refer to the semantic layer and are all still true; confirm `fetch-depth: 0` and
      `GATE_BASE` are untouched.

3. **`.github/workflows/ci.yml` — A9's transcription step.** Append after `pnpm lint` (`:21`) a step
   named distinctively (e.g. `Transcription check (A9) — printed NEXT blocks vs spec:status`) with
   an inline `run: |` block, no `continue-on-error`, and a comment carrying A9's honest bound. Do
   **not** add `fetch-depth: 0` to `:10` — the completeness leg uses `git ls-files`, which reads the
   index and works on a shallow checkout. Do **not** add a `permissions:` block (no retrofit). The
   step's three legs, in this order:
   1. **Completeness / anti-vacuity.** Enumerate the chain command files by running
      `git ls-files` over `.claude/commands`, subtract the two non-chain files (`detect-drift.md`,
      `update-spec-graph.md`), and require every remaining command to be represented in the
      transcript fixture set. An absent or empty fixture directory is a **failure**, not a skip.
   2. **Fixture replay (A9's diff, over CC-12's artifact).** For each committed transcript, re-run
      `spec:status <node-id>` against the recorded fixture graph — copy the fixture to a temp dir
      and spawn the CLI with `cwd` set there, exactly as `tests/spec.test.ts:14-28` already does —
      extract the NEXT block, and require it to be **byte-identical** to the block the transcript
      records. A missing opening or closing sentinel is a failure, never an empty match that
      compares equal.
   3. **Live-graph smoke.** Run `spec:status` against the real repository graph, require exit 0 and
      a well-formed NEXT block. This leg needs no fixture, so it gives the step non-vacuous value
      even before leg 2's fixtures exist; leg 1 still reds until they do, which is correct.

   Write the verdict — per-leg pass/fail and, on failure, the offending command and a unified diff
   of the two blocks — to `$GITHUB_STEP_SUMMARY`, and emit an `::error::` annotation naming the
   step, so the failure is diagnosable without reading the whole `ci` log.

4. **`.github/workflows/issue-sync.yml` — Scope 5, CC-3, CC-5, A16.** Author the new workflow:
   1. `name: issue-sync`, job id `issue-sync`, no job-level `name:` (the 6/6 convention).
   2. A header comment stating: the sync is **one-way**, graph → issues, and issues are never graph
      inputs (contract Out-of-scope 3); it is **best-effort — it warns, never blocks**, and the
      graph stays truth (contract Risk 5); its `continue-on-error: true` is **permanent by design
      and is not a graduation candidate**, unlike the one `drift-review.yml` just lost; and it must
      never be made a required status check.
   3. Triggers: `push: {branches: [main], paths: ['specs/nodes/**', 'specs/graph/**']}`;
      `workflow_dispatch` with a `dry_run` boolean input defaulting to `true`; and a weekly
      `schedule:` cron (CC-5's self-healing trigger) at an off-the-hour minute, e.g. `'17 6 * * 1'`.
      Record two facts in the comment: an event-level `paths:` filter is safe **only** because this
      is never a required check (`docs/branch-protection.md:24-30` bans it for required ones), and
      GitHub disables `schedule:` after ~60 days of repository inactivity, so a silent stop must not
      be read as "no drift".
   4. `permissions: {contents: read, issues: write}` at workflow level, with a comment stating that
      declaring any block sets every unlisted scope to `none`, and that there is **no in-repo
      precedent** — no workflow in this repository declares `permissions:` at any level.
   5. `concurrency: {group: issue-sync, cancel-in-progress: false}` — a scheduled run and a
      merge-triggered run must not interleave a listing with another run's mutations, and an
      in-flight run is **never** cancelled mid-mutation. Also set a `timeout-minutes:` on the job so
      a hung GraphQL call cannot pin a runner. Neither has an in-repo precedent; say so.
   6. Checkout / pnpm / node 22 / `pnpm install --frozen-lockfile`, mirroring `ci.yml:10-18`.
   7. The sync step: `continue-on-error: true`; an `env:` block carrying `GH_TOKEN` from
      `secrets.GITHUB_TOKEN` and `GH_REPO` from `github.repository`; the apply switch set **only**
      on `push` and `schedule`, and on `workflow_dispatch` only when the `dry_run` input is false;
      and `pnpm spec:issue-sync` as the command. A comment records the CC-3 answer on scoped
      secrets: the built-in token is used for the GraphQL sub-issue and blocked-by mutations, a
      rejection is reported as `failed`, and no PAT secret is introduced by this change.
   8. A final report step with `if: always()`: append the sync's planned / applied / failed counts
      and per-item lines to `$GITHUB_STEP_SUMMARY`, and emit `::warning::` when `failed` is non-zero
      or the sync step's outcome is failure. The job's own conclusion stays success.
   9. Re-read the file. Confirm exactly one `secrets.` reference; confirm `--repo` reaches every
      `gh` call through `GH_REPO`; confirm no trigger path can reach the mutating branch without the
      apply switch; confirm the job cannot fail.

5. **Verify locally and open the PR.** This lane authors no graph node or edge of its own, so it
   runs no mutating `spec:` step — but the PR it lands in does. The canonical instruction is
   `pnpm spec:index && pnpm spec:validate`; in this PRoot environment pnpm/corepack are broken, so
   it runs as `node_modules/.bin/tsx tools/spec.ts index` followed by
   `node_modules/.bin/tsx tools/spec.ts validate`. Both must exit 0; **nothing is committed on
   red.** Confirm the YAML of all three workflow files parses (a one-line `js-yaml` load under
   `node_modules/.bin/tsx`, or any local YAML linter) before pushing — a malformed workflow is not
   caught by any check in this repository.

## Non-scope (explicitly the other six lanes' files and work)

- **`domain-backend` (`brief-conveyor-resolver-3f7a`)** — `tools/**` and `package.json`:
  `tools/conveyor.ts` (`nextSteps`, `deriveStage`, `CONVEYOR_CLASS_ROUTING`), `tools/issue_sync.ts`
  with CC-5's pure `planIssueSync(spec, existingIssues)` seam and CC-4's write conditions, the
  `spec:status` subcommand in `tools/spec.ts`, `tools/indexer.ts`'s `INDEX_FILES` widening,
  `tools/driftmap.ts` (CC-10c), and the `spec:status` / `spec:issue-sync` `package.json` scripts.
  This lane **invokes** `pnpm spec:issue-sync` and `spec:status` and writes neither. A2, A5, A7, A8,
  A11, A12, CC-4, CC-5's seam, CC-6, CC-8, CC-10(c), CC-11, CC-14 are theirs.
- **`data-migration` (`brief-conveyor-schema-graph-8b2e`)** — `specs/schema/node-types.yaml` and all
  graph data (Scope 14): the `touches` backfill, the capability `paths` widenings, the PR #4
  `drift-finding`, the two follow-up intents, the `.gitignore` unowned authorization. In particular,
  **no file under `specs/schema/**` is this lane's** — it is the sole `sensitive_paths` glob and a
  CODEOWNERS-gated path — and no new entry in `specs/schema/checks.yaml` is needed or taken (see
  below). CC-9, CC-13 and A13 are theirs.
- **`api-integration` (`brief-conveyor-commands-c14d`)** — the fifteen `.claude/commands/*.md`
  files, including `decompose-lanes.md`'s `spec:issue-sync` invocation, the A1 degraded fallback,
  A15/CC-7's suppressed print on red, and A16's `test-verification` refusal. A1, A3, A4, A7's
  command half, A14, A15/CC-7, A16's command half and CC-11 are theirs.
- **`product-spec` (`brief-conveyor-lane-catalog-2d5b`)** — `.claude/lanes/**`, `.claude/agents/**`
  and `.gitignore`: the eight catalog files, the seven implementer agents, the `!.claude/lanes/`
  negation, and the agent `tools:` edits. A10, CC-2, CC-9, CC-16 and CC-10(d)'s
  `integration-reviewer.md` half are theirs.
- **`docs-spec` (`brief-conveyor-docs-9e31`)** — `CLAUDE.md`, `README.md`, `CONTRIBUTING.md` and
  `docs/**`, including **`docs/branch-protection.md`** (CC-10(b)'s `drift-review` row, the count of
  required checks, the CODEOWNERS path list) and **`docs/drift-detection.md`** (the `:32-40`
  warn-only section). This lane changes the *behaviour* those two documents record and edits
  **neither**; both are named as cross-lane dependencies below. A7's governing-doc half, CC-10(b),
  CC-10(d)'s doctrine half, CC-12, CC-13 and CC-14 are theirs.
- **`test-verification` (`brief-conveyor-tests-4c86`)** — `tests/**`, written by `test-writer` via
  `/write-tests`, never by the invocation that implements the code under test. **CC-12's transcript
  fixtures are theirs**, and A9's step in `ci.yml` is inert without them. A6's pin — that every
  chain command still invokes the resolver — is also theirs and is a *different* assertion from
  A9's: A6 reads the command **files**, A9 diffs the printed **blocks**. A6, A12's pin, A13, CC-2,
  CC-5's tests, CC-8, CC-9, CC-12, CC-15 and CC-16 are theirs.
- **Also out of scope for this lane, deliberately:** no new check id in `specs/schema/checks.yaml` —
  `check-diff` (`:13`) already makes the newly-blocking gate waivable, and the transcription step
  carries **no** override path in this change (adding one would be a schema widening in another lane
  and beyond Scope 7's "nothing else is added"; if it is later wanted it is a follow-up intent under
  rule 5). No `permissions:` retrofit onto the five workflows this lane does not otherwise touch. No
  `.github/dependabot.yml` change. No branch-protection API application — contract Out-of-scope 3
  keeps it out-of-diff. No helper script under `.github/scripts/`, which no capability owns.

## Cross-lane dependencies & integration expectation

- **This lane depends on `domain-backend` for two runtime entry points:** `pnpm spec:issue-sync`
  (invoked by `issue-sync.yml`) and `spec:status` (invoked by A9's step). Neither exists yet; both
  workflows are authored against the contract's Scope 3 and Scope 5 names and are red until those
  land.
- **The NEXT-block extraction contract is a cross-lane interface that must be pinned.** A9's step
  must extract the block from `spec:status` output with an unambiguous opening sentinel, an
  unambiguous closing sentinel, and a hard failure when either is absent — never a permissive match
  that yields an empty string comparing equal to an empty fixture. Contract Behaviour 5's
  "machine-stable `NEXT` block" is the `domain-backend` lane's to render; **this lane proposes a
  fenced block with the info string `next` (opening ```` ```next ````, closing ```` ``` ````)**
  because it is visible, stable under an agent transcribing markdown, and trivially extractable in
  shell. The resolver's rendering is the authority; byte-agreement between it and the extractor is
  confirmed at integration.
- **This lane depends on `test-verification` for CC-12's transcript fixtures.** A9's leg 1
  (completeness) and leg 2 (replay) are red until the fixture directory, its naming convention and
  its per-case contents (fixture graph, node id, recorded block) exist. **This must not be "fixed"
  by making the step skip on an absent directory** — that is exactly the vacuous pass leg 1 exists
  to prevent. Both lanes land in the same PR, so the dependency resolves inside one diff.
- **This lane supplies a fact `domain-backend`'s CC-4 depends on:** the sync identity that CC-4's
  author check must match is the built-in token's actor, `github-actions[bot]`. A local run has a
  different identity — one more reason a local run never mutates.
- **This lane supplies the condition under which `api-integration`'s and `domain-backend`'s CC-11
  matters:** because local runs are dry, a freshly decomposed lane brief legitimately shows
  `issue: not synced` until the post-merge run, so CC-11's explicit rendering is what keeps a blank
  column from reading as a lost lane.
- **This lane's flip is what makes Acceptance 7's self-application bite, and it must land in the
  same PR as `data-migration`'s evidence.** Once `continue-on-error` is gone, `spec:check-diff`
  fails the `drift-review` job on a PR touching `specs/schema/**` that does not add, in the same
  diff, evidence which both `touches` `capability-spec-schema-2c3d` and reaches an approved
  contract. That is precisely this PR. Restated honestly: the PR goes **red**, and red is not
  blocked — `drift-review` is not a required check, so nothing prevents a merge until an admin marks
  it required.
- **`docs/branch-protection.md` and `docs/drift-detection.md` are the `docs-spec` lane's and must be
  reconciled against what this lane actually ships**, or the audit record contradicts the controls:
  (a) CC-10(b)'s new `drift-review` row; (b) the `:13` required-checks count, which is already wrong
  at "four checks" over a five-row table and becomes **six** once the `drift-review` row lands —
  Scope 13's "four→five" and Acceptance 6's "`branch-protection.md` says five" both undercount by
  one; (c) the CODEOWNERS bullet list at `:45-47`, which goes stale the moment this lane adds
  `/specs/nodes/decision-*` — a consequence of CC-10(a) that neither the Scope nor CC-10(b) names;
  (d) the `ci` row's "Enforces" cell at `:18`, which today lists only `pnpm test`, `pnpm typecheck`
  and `pnpm lint` and must gain A9's transcription step; and (e) `docs/drift-detection.md`'s
  `## Warn-only, then blocking` section (`:32-40`), whose flip instruction this lane has now
  carried out.
- **Integration expectation.** This laned brief reaches `implemented` via **this lane's own final
  `evidence`** (`evidence —evidences→ brief`, with `touches → capability-ci-enforcement-3e4f`),
  while `intent-self-guiding-delivery-loop-6d79` stays **`open`**. A laned brief's evidence
  implements the brief; it never addresses the intent. `contract-conveyor-derived-4c8c` is a
  seven-brief, multi-lane contract created `2026-07-27`, after the `2026-06-18`
  `coverage_coherence_from` cutoff, so it completes **only** via a final `integration` node
  (`/integrate`) that `integrates` a final evidence for **every live lane** — the
  `coverage-coherence` rule. If a lane collapses, it is **superseded** per CLAUDE.md rule 3 (a
  `supersedes` edge, its status moved to its terminal value), never forced into a ceremonial
  integration; the integration node covers only the lanes that remain live.
- **CC-10(d) keys off this brief.** The final integration node's `compliance-verdict` section
  enumerates CC-1…CC-16 and A1…A16 and names each item's discharging brief. This brief is the named
  discharger for **A9, A16's issue-sync half, CC-3, CC-5's complete-listing / per-run-report /
  scheduled-trigger halves, and CC-10(a)**.

## Acceptance & verification (scoped to this lane)

Mapped to the contract's Acceptance 3, 6 and 7 and to Risk 5, restricted to the `.github/` surface.
The `test-verification` lane owns all test code; this lane states what its slice must satisfy.

1. **Gate graduation (Acceptance 6).** `drift-review.yml` carries **no** `continue-on-error` on the
   sensitive-paths step; exactly one `continue-on-error: true` remains in the file, on the
   `Drift map (informational)` step. The header comment block no longer claims "nothing here fails
   the build yet" and no longer carries the flip instruction; the step comment states the current
   blocking state; the step name no longer says `(warn-only)`. The four "warn-only" strings
   describing the semantic layer survive unchanged. Verified by direct read of the edited file and
   by `grep -c 'continue-on-error' .github/workflows/drift-review.yml` returning 1.
2. **Acceptance 6's honest bound is written down, not implied.** The rewritten header states that a
   failing `drift-review` job blocks no merge until a repo admin marks `drift-review` a required
   status check, and that this is repo-admin state not reproducible from this repository — in
   `patch-comparison.yml:3-11`'s register. Verified by read.
3. **Self-application, honestly bounded (Acceptance 7).** On this PR, `spec:check-diff` runs
   blocking over a diff that touches `specs/schema/node-types.yaml`, so `drift-review` reports
   **red** until the `data-migration` lane's evidence, and its
   `touches → capability-spec-schema-2c3d`, land in the same diff. Verified by observing the
   check's transition on the live PR; the honest bound — red is not blocked, because `drift-review`
   is not a required check — is restated in the PR body.
4. **A9 is enforced, not merely present.** The transcription check runs inside the already-required
   `ci` job, so a divergence between a printed NEXT block and `spec:status` output **fails a
   required check on merge day** with no admin action. Verified by inducing a one-character change
   in a transcript fixture and observing `ci` go red with the step's `::error::` annotation and
   step-summary diff naming the offending command. The decision to site A9 in `ci` rather than a new
   workflow, and its accepted costs, are recorded in this brief and in the step's own comment.
5. **A9 cannot pass vacuously.** With the transcript fixture directory absent, empty, or missing any
   chain command, the step **fails**; with the NEXT-block sentinel absent from `spec:status` output,
   the step **fails**. Verified by deleting the directory locally and observing a failure, not a
   skip — the same anti-vacuity property pin leg 12 gives the lane catalog.
6. **A9's honest bound is stated, not claimed away.** The step's comment and the PR body both state
   that the check proves the recorded block equals the resolver's output for the recorded graph, not
   that a human ran `spec:status`; a hand-typed byte-equal block passes. Verified by read.
7. **CC-3, with no precedent, discharged explicitly.** `issue-sync.yml` declares workflow-level
   `permissions: {contents: read, issues: write}`; exports `GH_TOKEN` from `secrets.GITHUB_TOKEN`
   and `GH_REPO` from `github.repository`; contains exactly one `secrets.` reference; introduces no
   PAT; and its comments state (a) that no workflow in this repository declares `permissions:` at
   any level, so nothing was copied, (b) that the GraphQL sub-issue and blocked-by mutations are
   attempted with the built-in token and a rejection is reported as `failed` rather than escalated,
   and (c) that apply is opt-in so a local run is dry. Verified by read, and by a recursive grep for
   `permissions` under `.github/` returning only the new file's block.
8. **CC-5's three halves (Acceptance 3, Risk 5).** The workflow carries a weekly `schedule:` trigger
   in addition to `push` on `main` and `workflow_dispatch`; it invokes the sync in the mode that
   aborts before mutating on an incomplete listing and passes no flag downgrading that abort; and it
   writes planned / applied / failed counts and per-item lines to `$GITHUB_STEP_SUMMARY` on every
   run, including a failed one (`if: always()`). Verified by a `workflow_dispatch` dry run producing
   a populated summary with zero mutations, and by reading the sync step's env for the absent apply
   switch on that path.
9. **Warn, never block (Scope 5, Risk 5).** A forced sync failure leaves the `issue-sync` job's
   conclusion at **success** with a `::warning::` annotation; the workflow appears in no
   required-check list. Verified by a dispatch run against a deliberately invalid `GH_REPO`. The PR
   body states that this `continue-on-error: true` is permanent by design and is not a graduation
   candidate, in explicit contrast to the one deleted from `drift-review.yml` in the same diff.
10. **CC-10(a).** `.github/CODEOWNERS` contains `/specs/nodes/decision-* @sb-dev` with a rationale
    comment, and its `:1` header comment names decision nodes. Verified by read; and by noting in
    the PR that `docs/branch-protection.md:45-47`'s CODEOWNERS bullet list is now stale and is the
    `docs-spec` lane's to correct.
11. **No coverage gap, and one capability touched.** Every path in this lane's diff
    (`.github/workflows/issue-sync.yml`, `.github/workflows/drift-review.yml`,
    `.github/workflows/ci.yml`, `.github/CODEOWNERS`) falls under `capability-ci-enforcement-3e4f`'s
    `paths: [.github/workflows/**, .github/CODEOWNERS]`, so this lane's evidence authors exactly one
    `touches` edge and `spec:drift-map` reports no `uncovered` path from it. Verified by
    `node_modules/.bin/tsx tools/spec.ts drift-map` against this lane's diff.
12. **Workflow YAML parses.** All three workflow files load as YAML before push. No check in this
    repository catches a malformed workflow — GitHub silently ignores it — so this is a manual step,
    stated as such rather than assumed.
13. **Mutation discipline.** This lane authors no graph node or edge; the PR's graph writes (this
    brief's `decomposes` edge, and later this lane's `evidence` and `touches`) end with
    `pnpm spec:index && pnpm spec:validate` — in this PRoot environment
    `node_modules/.bin/tsx tools/spec.ts index` then `node_modules/.bin/tsx tools/spec.ts validate`
    — and **nothing is committed on red.**

Edge for graph-maintainer to record for this brief node:
`brief-conveyor-ci-6a9f —decomposes→ contract-conveyor-derived-4c8c`, with this brief carrying
`lane: observability-release`.
