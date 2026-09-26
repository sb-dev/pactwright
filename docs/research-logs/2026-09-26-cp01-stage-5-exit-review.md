# Checkpoint 1 Stage 5 — T2 stage-level exit review

**Scope:** Spec 00 T2 for Checkpoint 1 Stage 5 (CP01-S20 and CP01-S21) under the [resolution methodology](../open-question-resolution-methodology.md) v2 §7. Reviewed on branch `claude/stage-5-step-contracts-s6seah`, base `refactor/pactwright-v2` at `f47af29`. Source revisions at review: Implementation Guide v18, Core v6, Distribution v5, OSS v2, Spec 07 v2, Principles v4, Checkpoint 1 v30, Checkpoint 2 v17, Spec 00 v5, contract format 2. Questions Q52–Q56 keep their crosswalk IDs and wording; the batch records [B19](./2026-09-26-cp01-stage-5-b19-ci-coverage-and-triggers.md), [B20](./2026-09-26-cp01-stage-5-b20-release-version-line.md) and [B21](./2026-09-26-cp01-stage-5-b21-publish-safety-and-authority.md) remain the decision records.

## Method

The first commit, `b095bc8`, carried the three batch records and the amended Guide, contracts, crosswalk and checkpoint text. Two independent read-only reviewers ran on it. One checked whole-stage consistency: the Q52–Q56 dispositions under the two-implementations test; agreement between Guide v18, the S20/S21 statements, the criteria and the records; requirement coverage, case distinctness and binding uniqueness across CP01; loss against `f47af29`; deliverable-summary equality; the records' factual claims against the released `c5992d7` workflows and tests, the registry and the npm documentation. The other audited cross-stage allocation and authority: contradictions with the requirement-ready Stages 1–4 and their exit records, the unconverted Steps 22–31 and the exit gate, Checkpoints 2–6, Spec 07 §§33–37, OSS §§25–26 and the Principles; whether anything outside the named owning clauses changed; the soundness of the Q54 hold; the existence of every later owner. The owner reviewed the same commit on the PR ([5327216977](https://github.com/sb-dev/pactwright/pull/52#pullrequestreview-5327216977)) with fresh GitHub API and registry reads. Each reviewer refuted its own candidates before reporting; the author verified every finding against the text and the platform documentation before acting.

## Findings and dispositions

Blocking findings at `b095bc8`, applied in the correction commit that carries this record:

| ID | Source | Finding | Correction |
|---|---|---|---|
| X1 | Owner P1 | S20/AC01 required the candidate to run as a default-branch push, which needs the unaccepted workflow to be on the default branch first: an admission cycle under Spec 00 §§3–4, and three implementations (fixture push, merge, static inspection) would produce different evidence. | AC01 runs the candidate as a pull request only; the default-branch trigger and completing concurrency are proven statically (AC03; AC04 `cancel-default-branch`, `missing-trigger`); the first real default-branch run is Step 25's self-hosting commit, as B19 already allocated. R07 unchanged in substance. |
| X2 | Owner P1 | S21/R07 and AC07 required a tag-only `npm-release` environment and a version-tag ruleset that do not exist: the rulesets endpoint returns `[]` and the environment has no protection rules or deployment policy. B21 said "All hold" and "Remaining blockers: none". | R07 makes the owner's configuration of both controls an approved prerequisite of Step 21's review, read back into the run configuration; AC07 gains the `approval` binding `release.authority-configuration` (authority: the repository owner; effect: the configured environment and ruleset) beside its review, and compares the live configuration with the run configuration's record. Guide §Trusted release workflow says the owner configures them before review. B21 records the absent controls, the re-run challenge and the prerequisite as the remaining Stage 5 blocker. |
| X3 | Owner P1 | "Release runs queue and are never cancelled" was false under GitHub's default concurrency, which keeps one pending run and cancels the older pending run when a newer arrives; `queue: max` retains up to 100 pending runs and cancels further ones. No case rejected the default queue and nothing proved three queued releases are retained. | Guide and S21/R05 state the queue semantics (`queue: max`, one at a time in arrival order, no cancellation up to the platform bound; the default single slot is a defect). AC01 checks retained queueing; AC02 `default-queue`; AC06 traces three tags pushed during a run and states the bound. Because a queue can run releases out of version order, R02 adds the assertion that the expected npm tag is not already at a higher version (AC03 fixture; AC04 `dist-tag-ahead`), which keeps R06 true. |
| X4 | Owner P2; both reviewers | Three documents linked this exit record before it existed, and the batch records' "Verification" fields pointed at nothing. | This record; verification below. Q54's disposition is preserved as an owner-authorisation hold, not an adopted change. |
| X5 | Reviewer 1 B1 | S21/R03's "npm CLI that supports trusted publishing" had no rejecting criterion: Node 22 is admitted and bundles an older npm, so a Node 22 release job passed every Stage 5 criterion and failed only at Step 28. | R02 asserts the npm CLI minimum before any publish; AC01 lists the assertion; AC03 fixture supplies a conforming npm; AC04 `npm-too-old`. |
| X6 | Reviewer 1 B2; reviewer 2 B2 | S20/R05's "no `os` or `cpu` restriction" had no exercising criterion. | AC03 parses the publishable manifests and requires no `os`/`cpu`; AC04 `os-or-cpu-restriction`. |

Non-blocking findings, applied:

| ID | Correction |
|---|---|
| X7 | Guide §First publication: the interactive publish uses the npm tag the version line selects, npm also sets `latest` on a first publication, and the trusted-publisher entry is evidenced by the first workflow publish (reviewer 1). |
| X8 | S20/AC02 asks for the run's failure conclusion and a failing `CI / Verify`, not "no context reports success" (reviewer 1). |
| X9 | S20/AC01 "No job runs the verify gate on another Node version", since the aggregate job runs a shell step on the runner's default Node (reviewer 1). |
| X10 | S21/AC01 orders each package's presence check before its own publish and allows a recursive dry-run, which writes nothing; AC02 `recursive-publish` is a non-dry-run recursive publish; the Guide's flow block shows the per-package step (reviewer 1; reviewer 2 N5). |
| X11 | S20/R07 no longer states Checkpoint 2's obligation; the Guide carries it, citing Spec 07 §34 (reviewer 1; reviewer 2 N4). |
| X12 | S21/AC07 compares the live environment and ruleset with the run configuration's record (reviewer 1). |
| X13 | Crosswalk `S01.references` note states the adopted allocation: CI carries the claim, the packed consumers prove packaging only (both reviewers). |
| X14 | Guide §Package metadata replaces "CI or package smoke tests" with "CI", instead of qualifying it (reviewer 1). |
| X15 | Guide: a reviewer gate "would gate every rerun", not block it (reviewer 1). |
| X16 | Step 28 prose no longer claims that `release.yml` already publishes without a token: both `0.0.1` versions were published interactively and the `v0.0.1` run published nothing, so `v0.0.2` is the first trusted publish, and Step 28 verifies the deployment record and attestations; the Step 21 summary is shortened accordingly (reviewer 1; reviewer 2 N2). |
| X17 | S21/R01 and AC01 name "the engines range of any publishable package", matching S20/R05 (reviewer 1). |
| X18 | B20 names Step 27's conversion as the owner of the exact-version instruction and records that the current README install line is floating (reviewer 2 N1). |
| X19 | S20/AC06 requires that the recorded required context for the verification workflow, if any, is `CI / Verify` and not a per-Node-major context, so managed or unrelated required checks added later do not fail the rubric (reviewer 2 N3). |

Findings confirmed and not changed: the Q54 hold (both reviewers: the Guide table's `Checkpoint 2 → 0.0.2` against Checkpoint 1's `0.0.2` is pre-existing at `f47af29`, no Stage 5 requirement depends on the mapping, and amending the Guide table alone would create a fresh Guide-to-Checkpoint 2 contradiction); the run configuration as a concept rather than a document (reviewer 2 N9).

**Fresh review of X1–X19 (methodology §6):** pending; recorded here when the fresh read-only reviewer has examined the correction commit.

## Owner decision held open

Q54's renumbering (Checkpoint 2 → `0.0.3` … Checkpoint 9 → `0.0.10`, package introduction points shifted by one, `0.1.0` unchanged) rewrites the Guide's three version tables and Checkpoints 2–9, which the owner asked to be consulted about. Until authorised, Guide v18 knowingly keeps `Checkpoint 2 → 0.0.2` while Checkpoint 1 v30 publishes `0.0.2`; Checkpoint 2 Step 16 cannot run as written. This blocks no Stage 5 step.

## Stage-level result (§7)

Checks confirmed by the reviewers at `b095bc8` and re-checked by the author on the corrected tree: every S20 and S21 requirement has an exercising criterion, including the two clauses X5 and X6 uncovered; verifier binding IDs are unique across CP01 (the new `release.authority-configuration` included); case names are unique per criterion; `requires` are feasible in step order (S21 needs S01, S10, S20); the Stage 5 deliverable summaries equal the contract `outputs`; no requirement, criterion, `covers`, `source` or `verify` entry from `f47af29` was removed without explanation (S21/R06's recursive-resume clause and AC06's tag-advance clause were replaced, recorded in B21); only the named owning Guide sections, Checkpoint 1, the two contracts, the crosswalk and the research logs changed; Stage 1's expectation that S01 stays unchanged with S20/R05 and AC01 carrying the compatibility proof holds; S17/AC02 and Checkpoint 2 line 837 agree with S20/R04; every Stage 5 exit-gate line has an owning criterion or a named later owner (registry verification and the `0.0.1` baseline: S21/R04, R06, AC05 and Step 28; "0.0.2 is published": Step 28's approval binding; Step 25's "repository CI passes": `CI / Verify` on the self-hosting commit); every later owner the records name exists (Steps 25, 27, 28; Checkpoint 2 Steps 3, 10, 11 with Spec 07 §34; Checkpoints 3–6 bootstraps).

Identity, storage, relationships and authority are not Stage 5 concerns; its shared decisions are the compatibility claim, the check context, the version line, the publish authority and the failure behaviour, and they agree across S20, S21, the Guide and Steps 25 and 28.

**Verification on the corrected tree** (commands, exact results):

| Command | Result |
|---|---|
| `pnpm contracts:check` | `docs/checkpoints/01-self-hosted-delivery: ok` |
| `pnpm format:check` | pass |
| `pnpm lint` | pass |
| `pnpm typecheck` | pass |
| `pnpm test` | 25 tests, 25 pass, 0 fail |
| `pnpm build` / `pnpm verify` | FAIL, inherited: no runtime sources and no `@pactwright/standard` project; identical on `f47af29` and recorded the same way by the Stage 4 exit record |
| Batch challenge plans | executed as recorded in B19–B21; B21 check 6 (rulesets endpoint `[]`, concurrency queue documentation) added after the owner's review |
| External reads | npm registry for both packages; GitHub Actions run 33495980356 and its jobs; npm trusted-publishing and pnpm publish documentation; GitHub concurrency documentation; repository rulesets endpoint. The `npm-release` environment endpoint was not reachable through this session's proxy; its state is as the owner's review reports |

Stage 5 is requirement-ready in the methodology §7 sense once the fresh review above accepts X1–X19: no unresolved behaviour needed by Steps 20 and 21 remains, each obligation has acceptance coverage, and the deferred proofs have owners (Step 25's default-branch run, Step 28's first trusted publish and approval, Step 27's exact-version instruction). Two items stay open and are not requirement gaps: the owner's configuration of the `npm-release` environment and version-tag ruleset before Step 21's review (an approved execution prerequisite, S21/AC07), and the owner's authorisation of the Q54 renumbering. This result is scoped T2 work and does not declare T1/T2 complete for Checkpoint 1, build the harness or authorise implementation.

**CP01 Stage 5 exit review v1**
