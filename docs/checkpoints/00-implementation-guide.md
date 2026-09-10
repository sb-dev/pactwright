# Pactwright — Implementation Guide

**Version:** 14  
**Status:** Checkpoint index, engineering standard and release model

## Purpose

The checkpoint files are executable engineering runbooks.

Every step uses:

```text
Step
→ References
→ Run
→ Expected result
→ Verify before continuing
```

`Run` contains the actual prompt, adapter command or shell command. The runbook does not encode which AI coding provider is active.

Checkpoints describe **implementation progression**. They do not define Pactwright semantics.

Canonical authority is:

```text
docs/specs/01-pactwright-core-system-and-lifecycle.md
docs/specs/02-distribution-agent-packs-extensions-and-evaluation.md
docs/specs/03-project-intelligence.md
docs/specs/04-graph-review.md
docs/specs/05-assets-and-publication.md
docs/specs/06-operations.md
docs/specs/07-github-integration.md
docs/specs/08-open-source-project-organisation.md
```

Research logs provide rationale and historical design context only.

If a checkpoint conflicts with a canonical spec, the canonical spec wins and the checkpoint must be corrected before implementation continues.

## Engineering baseline

These rules apply to every checkpoint.

### Verification

Pactwright owns one root repository verification gate:

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
→ Pactwright or Kakeido System-Level Acceptance
```

Do not replace deterministic tests with LLM judgement.

Do not add arbitrary coverage percentages. Test responsibilities and failure boundaries.

### Repository changes

After Checkpoint 2 activates GitHub:

- coherent Pactwright and Kakeido changes land through pull requests;
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

A failed mutation must not leave a partially updated Project Graph, configuration, lock file or managed-file set.

### Replay provenance

Replayable execution uses the shared Pactwright replay base:

```text
repository_revision
+ project_graph_revision
+ environment_lock_hash
```

The repository and Project Graph revisions are runtime-provided canonical identities. `environment_lock_hash` identifies the exact resolved Pactwright execution environment.

Pinned replay must never silently substitute newer runtime, Extension, Agent Pack, Production Skills or Production Extension Pack versions.

If the recorded environment or repository state cannot be reconstructed, replay fails explicitly.

The exact long-term retention or reacquisition mechanism for historical packages and external Production Skills revisions remains unresolved. Checkpoints must not invent a hidden package archive or fallback-to-current behaviour merely to make replay pass.

### GitHub Actions

All Pactwright-owned workflows:

- use least-privilege `GITHUB_TOKEN` permissions;
- pin third-party actions to full commit SHAs;
- use `persist-credentials: false` when checkout does not need to push;
- install with `pnpm install --frozen-lockfile`;
- set bounded job timeouts;
- avoid `pull_request_target` for normal validation;
- use appropriate concurrency controls for superseded validation runs;
- never place credentials or sensitive payloads in workflow files or logs.

Generated Pactwright workflows remain thin execution/projection surfaces. Lifecycle, Project Graph, Extension and authority semantics stay in the Pactwright runtime and owning specifications.

### Package metadata

Every publishable package has:

- an explicit supported Node range;
- repository and licence metadata;
- an explicit public/private status;
- controlled package contents;
- valid entry points / `bin` / exports as applicable;
- a normal `prepack` build.

Do not claim compatibility that CI or package smoke tests do not exercise.

### Canonical gap discipline

A checkpoint may reveal a missing implementation decision. It must not silently convert that gap into new Pactwright semantics.

When a canonical specification explicitly leaves a question open:

```text
identify the gap
→ implement only what the existing contract requires
→ collect real evidence
→ resolve the design deliberately when required
→ update the owning canonical spec before relying on new semantics
```

Examples include:

- lifecycle-shape persistence identity;
- historical environment retention/reacquisition;
- Deployment event identity;
- Observation semantic identity/deduplication;
- Asset verification when bytes are external;
- Asset supersession command ergonomics;
- Publication idempotency;
- GitHub managed-resource identity and rename/collision handling;
- automation branch/PR concurrency and rebasing;
- exact GitHub check-conclusion mapping.

A runbook must not resolve these accidentally inside an implementation prompt.

## Command ownership

Use Pactwright runtime commands only for semantics owned by Pactwright.

Core/distribution examples:

```text
pactwright init
pactwright sync
pactwright validate
pactwright doctor
pactwright upgrade
pactwright upgrade --to <version>
pactwright lifecycle ...
pactwright agent-pack use <source>
pactwright agent-pack upgrade
pactwright extension add <id-or-package>
pactwright extension remove <id>
pactwright extension upgrade <id>
pactwright github sync
pactwright eval
```

First-party Extension namespaces are:

```text
pactwright intelligence ...
pactwright graph-review ...
pactwright assets ...
pactwright operations ...
```

Production Skill commands remain owned by their Production Skills repositories and do not automatically become Pactwright CLI commands.

Upgrade ownership is explicit:

```text
pactwright upgrade
→ Pactwright runtime

pactwright agent-pack upgrade
→ currently selected Agent Pack

pactwright extension upgrade <id>
→ one Pactwright Extension
```

Do not use `pactwright upgrade` as shorthand for Agent Pack or Extension upgrade.

## Public-product progression

Pactwright does not wait until the end of implementation to document or explain itself.

Each checkpoint advances the smallest public surface set needed by the newly usable capability:

```text
0.0.1  README Quick Start + Getting Started + core Delivery example
0.0.2  website foundation + GitHub guide + remote Delivery example
0.0.3  PI docs/onboarding/example/Academy + public-content knowledge foundation
0.0.4  Graph Review docs/example/Academy + public-corpus review
0.0.5  Production Skills + Assets / Publication guide/example/Academy + first grounded Asset/Publication
0.0.6  Operations docs/example/Academy + production-feedback content
0.0.7  Publication-feedback guide + evidence-driven revision of a real Publication
0.0.8  full operating guide/example + advanced Academy + ecosystem/Extension catalogue
0.0.9  case study + contribution/launch material + public-surface completion
```

Use the strongest Pactwright capability already available.

Specialised software, research, design, narrative, video, music, game and other production remains:

```text
normal Delivery
+ selected Agent Pack
+ relevant Production Skills
```

There is no separate Creative Delivery lifecycle.

### Public-content authority before Project Intelligence

Before Project Intelligence exists, public work still requires explicit authority for the specific work being delivered:

```text
Intent
→ authorised Decision
→ selected Contract
→ Brief
→ Delivery
```

The Decision and Contract provide bounded bootstrap authority for identity, positioning, product claims and other strategic choices needed by that work.

A model must not invent missing project truth because Project Intelligence is unavailable.

### Public-content readiness with Project Intelligence

Once Project Intelligence is available for the relevant project state, public/outbound work must satisfy the applicable readiness gate before approval.

Use:

```text
pactwright intelligence onboard
```

and require the domains relevant to the work to be `Covered`:

```text
identity
→ public/outbound work where identity, voice or values matter

content
→ editorial, educational or marketing work

product
→ capability, value, behaviour or limitation claims

go-to-market
→ acquisition, positioning, CTA or campaign work

delivery/ux
→ user-facing workflow or UX claims/material

delivery/eng
→ technical implementation claims

other applicable subject domain
→ factual claims that depend on it
```

The specific current claims and constraints relied on must be represented by accepted, in-horizon Knowledge with traceable Sources.

If required coverage is missing:

```text
pactwright intelligence onboard
→ identify missing Sources or strategic Decisions
→ normal Delivery / research obtains or creates the material
→ pactwright intelligence ingest ...
→ triage / reviewed promotion where required
→ re-check coverage
```

Public content is never an untracked side channel.

If relied-on Knowledge becomes challenged, superseded or retracted before approval, the work must be re-grounded and re-evaluated before it becomes an approved Asset or Publication.

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

Target first-party package introduction points are:

```text
0.0.1
  pactwright
  @pactwright/standard

0.0.3
  @pactwright/project-intelligence

0.0.4
  @pactwright/graph-review

0.0.5
  @pactwright/assets-publication

0.0.6
  @pactwright/operations
```

Production Skills normally remain external repositories and are not part of this first-party package family.

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
- Recursive publishing may resume only where the package manager/registry behaviour has been verified to skip already published immutable versions safely.
- If a published release is defective, fix forward with the next version.
- Moving a dist-tag to a previously published known-good version is an emergency recovery action and must be recorded as a Decision.

## Execution location

Unless a step says otherwise:

- Pactwright implementation/release commands run from the Pactwright repository root;
- Kakeido acceptance commands run from the Kakeido repository root;
- fixture verification uses test fixtures unless the step explicitly creates a real repository/resource;
- dynamic ids consumed later must be printed or resolved by an earlier step;
- current Kakeido canonical specifications govern Kakeido acceptance, not stale copies embedded in Pactwright checkpoints.

## Execution order

1. Checkpoint 1 — Self-Hosted Delivery
2. Checkpoint 2 — Remote Delivery
3. Checkpoint 3 — Project Intelligence
4. Checkpoint 4 — Graph Review
5. Checkpoint 5 — Production Skills + Assets / Publication
6. Checkpoint 6 — Operations
7. Checkpoint 7 — Publication Feedback
8. Checkpoint 8 — Full Project Operating Surface
9. Checkpoint 9 — Hardened Closed Loop
10. Graduation — TrueLayer

## Transition rule

A checkpoint closes only after:

```text
implementation verified
→ capability used on Pactwright
→ real Pactwright work accepted
→ release prepared from accepted source
→ exact npm version published
→ exact version installed in Kakeido
→ Kakeido System-Level Acceptance passed
→ blocking feedback captured
```

Do not carry a known blocking failure into the next checkpoint.

A non-blocking open design gap may cross a checkpoint only when:

- the current canonical contract can still be satisfied safely;
- the gap is recorded explicitly;
- no implementation relies on an invented answer;
- the next checkpoint does not silently treat the gap as resolved.

---

**Pactwright — Implementation Guide v14**