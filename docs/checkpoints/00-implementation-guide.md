# Pactwright — Implementation Guide

**Version:** 14  
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

## Kakeibo System-Level Acceptance authority

Kakeibo is Pactwright's persistent external proving project.

`00-kakeibo-acceptance-profile.md` is the current authority for Kakeibo-specific acceptance semantics across Checkpoints 1–9 and Graduation.

Individual checkpoint files continue to own the Pactwright capability/release sequence. Older embedded `Kakeido` or August-spec acceptance wording is historical context only when it conflicts with the acceptance profile.

At execution time, Kakeibo work uses the current canonical Kakeibo repository spec set:

```text
docs/specs/README.md
01-product-and-ux-spec.md
02-financial-domain-model-spec.md
03-kei-assistant-spec.md
04-mobile-design-system-spec.md
05-system-architecture-and-data-spec.md
06-engineering-delivery-and-operations-spec.md
07-open-source-project-organisation-spec.md
```

The retained August Kakeido Tech Stack snapshot is not implementation authority. Current architecture/data is owned by `05`; testing, delivery and operations by `06`.

Checkpoint 6 additionally uses:

```text
../research-logs/2026-09-02-pactwright-operations-experiment-semantics.md
```

That amendment activates generic Operations-owned `Experiment` state. Project-specific release artefacts such as Kakeibo `KeiRelease`, policy/persona/task contracts, model routes and benchmark datasets remain project-owned and are not Pactwright Project Graph node types.

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
0.0.6  Operations docs/example/Academy + production-learning content
0.0.7  Publication-feedback guide + evidence-driven revision of a real Publication
0.0.8  full operating guide/example + advanced Academy + extension catalogue
0.0.9  case study + contribution/launch material + public-surface completion
```

Use the strongest Pactwright capability already available.

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

first supported public release → 0.1.0
```

`0.0.x` publishes under `next`; `0.1.0` publishes under `latest`.

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

The tag triggers the trusted release workflow.

### Release failure

Published npm versions are immutable.

- Do not overwrite or routinely unpublish a released version.
- If the release workflow fails before publication, fix the cause and rerun safely.
- Recursive pnpm publishing skips workspace versions already present in the registry, so a partial workspace publish can be resumed after the cause is fixed.
- If a published release is defective, fix forward with the next version.
- Moving a dist-tag to a previously published known-good version is an emergency recovery action and must be recorded as a Decision.

## Execution location

Unless a step says otherwise:

- Pactwright implementation/release commands run from the Pactwright repository root;
- Kakeibo acceptance commands run from the Kakeibo repository root;
- fixture verification uses test fixtures unless the step explicitly creates a real repository/resource;
- ids consumed later must be printed or resolved by an earlier step.

## Execution order

0. `00-kakeibo-acceptance-profile.md` — read as the Kakeibo acceptance authority before executing any Kakeibo stage.
1. `01-self-hosted-delivery.md`
2. `02-remote-delivery.md`
3. `03-project-intelligence.md`
4. `04-graph-review.md`
5. `05-creative-production.md`
6. `06-operations.md` + `2026-09-02-pactwright-operations-experiment-semantics.md`
7. `07-published-work-feedback.md`
8. `08-github-project-surface.md`
9. `09-hardened-closed-loop.md`
10. `10-graduation-connected-banking.md`

## Transition rule

A checkpoint closes only after:

```text
implementation verified
→ capability used on Pactwright
→ real Pactwright work accepted
→ release prepared from accepted source
→ exact npm version published
→ exact version installed in Kakeibo
→ Kakeibo System-Level Acceptance passed
→ blocking feedback captured
```

Do not carry a known blocking failure into the next checkpoint.

---

**Pactwright — Implementation Guide v14**
