# Pactwright — Implementation Guide

**Version:** 15  
**Status:** Checkpoint index, engineering standard and release model

## Purpose

The checkpoint files are executable engineering runbooks. Every step uses:

```text
Step
→ References
→ Run
→ Expected result
→ Verify before continuing
```

`Run` contains the actual prompt, slash command or shell command. The runbook does not encode which AI coding provider is active.

The runbooks define execution order and acceptance work. They do not replace the owning Pactwright or Kakeibo specifications.

## Kakeibo acceptance model

Kakeibo is Pactwright's persistent external proving project.

At execution time, Kakeibo semantics come from the current canonical Kakeibo repository authority set:

```text
docs/specs/README.md
docs/specs/01-product-and-ux-spec.md
docs/specs/02-financial-domain-model-spec.md
docs/specs/03-kei-assistant-spec.md
docs/specs/04-mobile-design-system-spec.md
docs/specs/05-system-architecture-and-data-spec.md
docs/specs/06-engineering-delivery-and-operations-spec.md
docs/specs/07-open-source-project-organisation-spec.md
```

The owner specification controls its semantic domain; dependent specifications integrate or present that meaning. `docs/specs/README.md` owns the current authority/conflict map.

`00-kakeibo-acceptance-profile.md` defines the System-Level Acceptance cross-checks that must hold when the seven owners are exercised through Checkpoints 1–9 and Graduation. It is an acceptance profile, not a replacement product specification.

The numbered checkpoint runbooks are aligned to this current Kakeibo authority set. Retained August Kakeido snapshots are historical research inputs only and are not implementation authority.

## Operations Experiment authority

Checkpoints 6–9 additionally use the adopted Operations amendment:

```text
../research-logs/2026-09-02-pactwright-operations-experiment-semantics.md
```

It activates generic Operations-owned `Experiment` state for controlled production comparisons:

```text
Delivery Evidence
→ exact operational exposures
→ Experiment
→ bounded external evidence
→ Observation
→ Project Intelligence
→ normal Delivery governance
```

`Experiment` is optional controlled-evaluation state. It is not a mandatory Deployment, release or rollout stage.

Operations owns the generic Experiment contract, exact exposure identity, observation relationship and execution/provenance boundary. Product-specific release/configuration artefacts remain project-owned.

For Kakeibo this includes:

```text
KeiRelease
Kei policy
Kei persona
Kei task contracts
model routes
benchmark suites / datasets
```

These do not become Pactwright Project Graph node types merely because an Experiment compares exposures containing them.

The amendment remains an adopted semantic authority until its rules are folded into a later canonical Operations specification revision. Checkpoint implementation must follow the adopted amendment directly rather than treating it as optional historical context.

## Engineering baseline

These rules apply to every checkpoint.

### Verification

Pactwright owns one root verification gate:

```bash
pnpm verify
```

It runs the repository's formatting check, linting, type checking, tests and build in the order defined by the repository. Do not duplicate that gate differently across workflows.

Repository/code changes are not complete until `pnpm verify` passes.

CI installs from the committed lockfile:

```bash
pnpm install --frozen-lockfile
```

The lockfile is updated intentionally during dependency or version changes, then committed.

### Test layers

Use the cheapest test that proves the responsibility:

```text
pure semantics
→ unit test

filesystem / CLI / adapter boundary
→ integration fixture

packed or published consumer behaviour
→ clean-repository smoke test

cross-system behaviour
→ Pactwright or Kakeibo System-Level Acceptance
```

Do not replace deterministic tests with LLM judgement. Do not add arbitrary coverage targets.

For probabilistic behaviour, deterministic contract/safety assertions remain the strongest gate. Model-based or human evaluation supplements deterministic verification; it does not replace it or collapse acceptance into one aggregate score.

### Repository changes

After Checkpoint 2 activates GitHub:

- coherent Pactwright and Kakeibo changes land through pull requests;
- required checks must pass before merge;
- the default branch is not force-pushed or deleted;
- no approval-count requirement is added merely for ceremony in a one-maintainer project.

Release version changes use a small release PR.

### Filesystem mutation

Runtime mutations follow:

```text
plan
→ validate complete proposed state
→ write atomically
→ validate resulting state
```

A failed mutation must not leave a partially updated graph, config, lock file or managed-file set.

Immutable graph/release records are superseded with new records where their owning semantics require change; they are not rewritten in place.

### GitHub Actions

All Pactwright-owned workflows:

- use least-privilege `GITHUB_TOKEN` permissions;
- pin third-party actions to full commit SHAs;
- use `persist-credentials: false` when checkout does not need to push;
- install with `pnpm install --frozen-lockfile`;
- set bounded job timeouts;
- avoid `pull_request_target` for normal validation;
- use concurrency cancellation for superseded PR validation runs;
- never place credentials or sensitive payloads in workflow files or logs.

GitHub Projects, checks, summaries and views are derived projections. Editing projected GitHub fields does not create or mutate canonical Pactwright graph state, including Experiment state.

### Package metadata

Every publishable package has:

- an explicit supported Node range;
- repository and licence metadata;
- an explicit public/private status;
- controlled package contents;
- valid entry points / `bin` / exports as applicable;
- a normal `prepack` build.

Do not claim compatibility that CI or package smoke tests do not exercise.

## Public-product progression

Pactwright does not wait until the end of implementation to document or explain itself.

Each checkpoint advances the smallest public surface set needed by the new capability:

```text
0.0.1  README Quick Start + Getting Started + core Delivery example
0.0.2  website foundation + GitHub guide + remote Delivery example
0.0.3  PI docs/onboarding/example/Academy + identity/content readiness
0.0.4  Graph Review docs/example/Academy + public-corpus review
0.0.5  Creative Delivery docs/example/Academy + first grounded Publication
0.0.6  Operations docs/example/Academy + production learning + controlled Experiment explanation
0.0.7  Publication-feedback guide + evidence-driven superseding revision of a real Publication
0.0.8  full operating guide/example + Experiments projection + advanced Academy + extension catalogue
0.0.9  permanent regression hardening + case study + contribution/launch material + public-surface completion
0.1.0  first supported public release of the accepted 0.0.9 capability line
```

Use the strongest Pactwright capability already available.

Public material must distinguish ordinary production feedback from controlled Experiment workflows. Do not imply every Deployment/rollout requires experimentation.

### Project Intelligence before creative work

From Checkpoint 3 onward, public content should use relevant accepted Project Intelligence context.

Before public creative Delivery:

```text
pactwright intelligence onboard
→ identity = Covered
→ content = Covered where applicable
→ product = Covered for product claims
→ go-to-market = Covered for acquisition/marketing
→ subject domains = Covered where claims depend on them
```

If required coverage is missing, stop creative execution and create/ingest the missing project knowledge through normal Delivery first.

After content is accepted, feed material changes back through the normal Pactwright path so the graph remains current. Public content is never an untracked side channel.

Approved Assets/Publications remain immutable. Later analytics, Operations Observations or Experiment evidence may motivate a superseding Asset through PI → Delivery → Creative, but must not rewrite the original approved/published artefact.

## npm release model

The checkpoint number remains internal. Public package versions are normal SemVer development releases:

```text
Checkpoint 1 → 0.0.1
Checkpoint 2 → 0.0.2
Checkpoint 3 → 0.0.3
Checkpoint 4 → 0.0.4
Checkpoint 5 → 0.0.5
Checkpoint 6 → 0.0.6
Checkpoint 7 → 0.0.7
Checkpoint 8 → 0.0.8
Checkpoint 9 → 0.0.9

first supported public release after Checkpoint 9 acceptance → 0.1.0
```

`0.0.x` publishes under `next`; `0.1.0` publishes under `latest`.

Graduation is not another Pactwright package version. It proves the supported system can extend Kakeibo through the existing ingestion abstraction after the Checkpoint 9 / `0.1.0` acceptance line.

### First publication of a package

npm trusted publishing can only be configured after the package exists in the registry.

Therefore the first version of each newly introduced package is the only bootstrap exception:

```text
verify
→ publish that new package interactively with npm 2FA
→ configure its GitHub Actions trusted publisher
→ all later versions publish from CI with OIDC
```

New package introduction points:

```text
0.0.1
  pactwright
  @pactwright/standard

0.0.3
  @pactwright/project-intelligence

0.0.4
  @pactwright/review-creative
  @pactwright/creative

0.0.6
  @pactwright/operations
```

No long-lived npm publish token is stored in GitHub.

### Trusted release workflow

`.github/workflows/release.yml` is repository-owned release infrastructure, not a Pactwright-generated product workflow.

It runs on version tags:

```text
v0.0.x → npm tag next
v0.1.0+ → npm tag latest
```

The workflow:

```text
tag
→ clean GitHub-hosted checkout
→ frozen install
→ pnpm verify
→ tag/version/default-branch assertions
→ publish dry-run
→ npm trusted publish
→ registry verification
```

It uses:

```yaml
permissions:
  contents: read
  id-token: write
```

and the `npm-release` GitHub environment.

Release builds do not depend on a cached `node_modules` tree.

### Preparing a development release

From Checkpoint 2 onwards, create a release PR:

```bash
VERSION=0.0.N
DEFAULT_BRANCH="$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name)"

git switch "$DEFAULT_BRANCH"
git pull --ff-only
git switch -c "release/$VERSION"

pnpm version "$VERSION" -r --no-git-tag-version --allow-same-version
pnpm install
pnpm verify
pnpm publish -r --dry-run --tag next --access public

git add -A
git commit -m "chore: release $VERSION"
git push -u origin HEAD

gh pr create \
  --title "Release $VERSION" \
  --body "Prepare Pactwright $VERSION."

gh pr checks --watch
gh pr merge --squash --delete-branch

git switch "$DEFAULT_BRANCH"
git pull --ff-only

git tag -a "v$VERSION" -m "v$VERSION"
git push origin "v$VERSION"
```

If a checkpoint's executable release runbook uses an equivalent workspace-safe version command required by the current package tooling, that checkpoint command is authoritative for that release. The release invariants above remain unchanged.

The tag triggers the trusted release workflow.

### Preparing the first supported release

Checkpoint 9 owns the `0.1.0` promotion after `0.0.9` has passed the full generic failure matrix and Kakeibo hardened acceptance.

`0.1.0` is a new immutable SemVer version of the accepted supported line, not a dist-tag-only promotion of `0.0.9`.

Before `latest` moves to `0.1.0`:

```text
0.0.9 accepted under next
→ Pactwright failure drills pass
→ Kakeibo seven-owner regression review passes
→ Kakeibo production Kei regression lifecycle passes
→ 0.1.0 release PR/tag/trusted publish
→ clean-repository Quick Start smoke test
→ Kakeibo upgrades to exact 0.1.0 registry family
```

### Release failure

Published npm versions are immutable.

- Do not overwrite or routinely unpublish a released version.
- If the release workflow fails before publication, fix the cause and rerun safely.
- Recursive pnpm publishing skips workspace versions already present in the registry, so a partial workspace publish can be resumed after the cause is fixed.
- If a published release is defective, fix forward with the next version.
- Do not promote a known-defective `0.0.x` line to `latest`.
- Moving a dist-tag to a previously published known-good version is an emergency recovery action and must be recorded as a Decision.

## Execution location

Unless a step says otherwise:

- Pactwright implementation/release commands run from the Pactwright repository root;
- Kakeibo acceptance commands run from the Kakeibo repository root;
- fixture verification uses test fixtures unless the step explicitly creates a real repository/resource;
- ids consumed later must be printed or resolved by an earlier step.

## Execution order

Read `README.md`, `00-implementation-principles.md` and the relevant owning specifications before running the sequence. Read `00-kakeibo-acceptance-profile.md` before each Kakeibo acceptance stage as the cross-owner acceptance profile.

```text
1.  01-self-hosted-delivery.md
2.  02-remote-delivery.md
3.  03-project-intelligence.md
4.  04-graph-review.md
5.  05-creative-production.md
6.  06-operations.md
7.  07-published-work-feedback.md
8.  08-github-project-surface.md
9.  09-hardened-closed-loop.md
10. 10-graduation-connected-banking.md
```

For Checkpoints 6–9, also apply `2026-09-02-pactwright-operations-experiment-semantics.md` wherever the runbook references controlled Experiment semantics.

Graduation starts only after Checkpoint 9 closes, the supported `0.1.0` line is accepted and Kakeibo consumes that supported family.

## Transition rule

A normal Checkpoint 1–8 closes only after:

```text
implementation verified
→ capability used on Pactwright
→ real Pactwright work accepted
→ checkpoint release prepared from accepted source
→ exact npm version published
→ exact version installed in Kakeibo
→ Kakeibo System-Level Acceptance passed
→ blocking feedback captured through Project Intelligence
```

Checkpoint 9 additionally closes only after the generic failure matrix, Kakeibo seven-owner regression/Kei-defect lifecycle, `0.1.0` supported release, clean Quick Start smoke test and Kakeibo supported-family upgrade all pass.

Graduation closes only after connected banking is proven through the existing Kakeibo ingestion abstraction without changing downstream financial, review or Kei semantics.

Do not carry a known blocking failure into the next checkpoint or Graduation.

---

**Pactwright — Implementation Guide v15**
