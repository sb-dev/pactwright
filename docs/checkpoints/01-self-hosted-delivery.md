# Pactwright — Checkpoint 1 — Self-Hosted Delivery

**Version:** 12 
**Entry condition:** No installable Pactwright runtime exists. 
**Release:** `0.0.1`  
**Exit capability:** Pactwright is installable by consumers, manages its own repository, and completes Intent → Evidence in Pactwright and Kakeido without manual graph-coherence work.

## 1. Goal

Bootstrap the smallest installable Pactwright core, then immediately use it on Pactwright and Kakeido. This is the only checkpoint whose implementation cannot itself be delivered through Pactwright.

## 2. Specification baseline

- [Pactwright — Delivery Graph and Lifecycle Engineering Spec](../research-logs/2026-08-11-pactwright-delivery-graph-and-lifecycle-engineering-spec.md)
- [Pactwright — Distribution, Agents and Evaluation](../research-logs/2026-08-11-pactwright-distribution-agents-and-evaluation.md)
- [Pactwright — GitHub Actions and Views](../research-logs/2026-08-11-pactwright-github-actions-and-views.md)
- [Pactwright — Project Intelligence Graph Engineering Spec](../research-logs/2026-08-11-pactwright-project-intelligence-graph-engineering-spec.md)
- [Pactwright — Graph Review & Creative Delivery Engineering Spec](../research-logs/2026-08-11-pactwright-graph-review-and-creative-delivery-engineering-spec.md)
- [Pactwright — Operations Graph Engineering Spec](../research-logs/2026-08-11-pactwright-operations-graph-engineering-spec.md)
- [Pactwright — System Architecture](../research-logs/2026-08-11-pactwright-system-architecture.md)
- [Pactwright — Implementation Principles](./00-implementation-principles.md)
- [Pactwright — Implementation Guide](./00-implementation-guide.md)
- [Pactwright Open-Source Project Organisation](../research-logs/2026-08-11-pactwright-open-source-project-organisation.md)
- [Kakeido — Financial Model Spec](../research-logs/2026-08-11-kakeido-financial-model-spec.md)

Only the owning specifications listed in each step define semantics. This runbook defines execution order, not new product meaning.

Repository engineering infrastructure and the npm release model (CI workflow rules, trusted publishing, dist-tag policy, versioning, CHANGELOG, release-failure handling) are owned by the Implementation Guide's **Engineering baseline** and **npm release model** sections, not by the Distribution specification. Steps in Stages 5 and 9 cite the Implementation Guide for those semantics.

Other Kakeido specifications (Product & UX, Mobile Design, Assistant, Tech Stack, Astro) become baseline material in later checkpoints; Checkpoint 1 exercises only the Financial Model Spec.

## 3. Execution contract

Every implementation action is a runnable step with the same shape:

```text
Step
→ References
→ Run (prompt or command)
→ Expected result
→ Verify
→ continue only if verification passes
```

Use a prompt for repository/code changes. Once Pactwright owns a deterministic operation, use the Pactwright command instead of asking the model to emulate it.

Lifecycle adapter commands become available only after Checkpoint 1 generates the active adapter.

## 4. Checkpoint specification map

- **Delivery Graph** — Pactwright — Delivery Graph and Lifecycle Engineering Spec §§2–24 (§23 is writing guidance for node-authoring agents)
- **Distribution** — Pactwright — Distribution, Agents and Evaluation §§2–8, §§15–19
- **Open-Source Project Organisation** — Pactwright Open-Source Project Organisation §§1.3, 2–3, 8, 15–16
- **Implementation Principles** — §§6–7, 12, 14
- **Implementation Guide** — Engineering baseline; npm release model
- **First Kakeido semantic acceptance** — Kakeido — Financial Model Spec §§2–18

### Explicitly out of scope for Checkpoint 1

The following capabilities fall inside the cited specification ranges but are deliberately deferred:

- `pactwright agent-pack use` and `pactwright upgrade` (Distribution §§7, 15) — deferred until a second complete first-party pack exists (Checkpoint 5 introduces `@pactwright/creative`). Checkpoint 1 ships one pack selected by default.
- `pactwright eval --baseline` comparison (Distribution §16) — deferred until a released pack baseline exists. Checkpoint 1 implements the runner and initial core suite only.
- GitHub provisioning, `pactwright github sync` and all generated GitHub workflow surfaces (Distribution §§9–14 and the workflow-rendering part of §8) — deferred to Checkpoint 2. In Checkpoint 1, `init` sets `github.enabled: false`, creates no `.github/` content, and `sync` renders no GitHub workflow files.

## Stage 1 — Build the repository-native Project Graph substrate

Implement canonical graph storage and deterministic core mechanics before any agent or extension behaviour.

### Step 1 — Create the runtime/package foundation

**References:** Delivery Graph §§4–5; Distribution §§2–3

**Run**

```text
Read Delivery Graph §§4–5 and Distribution §§2–3.

Implement the Pactwright runtime/package foundation and parsers for:
- .pactwright/config.yml
- .pactwright/lifecycle.yml
- .pactwright/lock.yml
- specs/nodes/
- specs/graph/edges.yml

Make the root Node package distributable as `pactwright`:
- `pnpm build` produces the executable distribution
- `package.json` exposes the built CLI as `bin.pactwright`
- `packageManager` pins the repository pnpm version
- package metadata declares the supported Node range, repository, licence and published files
- `prepack` runs the package build so `pnpm pack`/`pnpm publish` package the current distribution
- a repository-local `pactwright` script invokes the same built CLI so this source repository can later run `pnpm pactwright ...` without adding itself as a dependency
- `pnpm pack` includes only the runtime files required by a consumer
- a root `pnpm verify` script runs formatting check, lint, typecheck, tests and build using the repository's chosen tools

Use one canonical loader path. Do not implement optional extensions or GitHub provisioning. Add repository tests using existing project conventions.
```

**Expected result**

The runtime has one canonical project/config/graph loading path, a buildable/packable `pactwright` CLI package, and no optional-extension dependency.

**Verify before continuing**

Run `pnpm verify`. Confirm the built package exposes `bin.pactwright`, package metadata matches the declared support surface, and no verification stage is skipped.

### Step 2 — Implement the five core Delivery node schemas

**References:** Delivery Graph §§5–12

**Run**

```text
Implement exactly the five durable core Delivery node types from Delivery Graph: intent, decision, contract, brief, evidence.

Enforce common frontmatter, the ID format `<type>-<slug>-<short-hash>`, ID immutability, type-specific required fields and Decision outcomes proceed/reject/defer.

Do NOT create durable types for contract alternatives, Delivery execution or Review execution. Add positive and negative schema fixtures, including fixtures for malformed IDs and for an ID change being rejected.
```

**Expected result**

The runtime can parse and validate all five core node types; transient/execution concepts are not graph node types.

**Verify before continuing**

Run schema tests. Inspect the schema registry and confirm it contains only the five core Delivery node types at this stage.

### Step 3 — Implement the shared typed-edge registry/store

**References:** Delivery Graph §§13, 21

**Run**

```text
Implement specs/graph/edges.yml and the shared typed-edge registry. Register core relations: resolves, selects, decomposes, evidences and same-type supersedes.

Validate source/target existence, endpoint types, unique tuples, no self-supersession and acyclic supersession. Keep the registry extensible for later extension-owned edge types.
```

**Expected result**

Core edge semantics are deterministic and later extensions can register additional owned edge types without changing Delivery semantics.

**Verify before continuing**

Run fixtures for invalid endpoint, invalid endpoint type, duplicate tuple, self-supersession and cycle; all must fail.

### Step 4 — Implement current-lineage derivation

**References:** Delivery Graph §§14–15, 21

**Run**

```text
Implement current Delivery lineage derivation from graph structure. Enforce at most one current Decision per Intent, proceed selecting one current Contract, reject/defer selecting none, at most one current Brief per Contract and one current Evidence per Brief. Superseded records are not current.

Derive lifecycle state; do not store redundant state fields.
```

**Expected result**

Open, deferred, rejected, contracted, delivering and done are derived views of canonical graph structure.

**Verify before continuing**

Run lineage fixtures including an ambiguous lineage and confirm validation fails.

### Step 5 — Implement the deterministic Project Graph revision

**References:** Delivery Graph §5

**Run**

```text
Implement one deterministic Project Graph revision over canonical registered Project Graph state. Include registered canonical nodes/edges and future extension canonical records. Exclude generated reports, adapter output, execution provenance, operational projections, GitHub state and other derived state. Canonicalise ordering before hashing.
```

**Expected result**

The same canonical graph state always produces the same revision and non-canonical files cannot change it.

**Verify before continuing**

Run three fixtures: identical state => identical revision; generated-file change => unchanged revision; canonical node/edge change => changed revision.

## Stage 2 — Build the core Delivery lifecycle runtime

Make lifecycle progression deterministic and graph-backed before adding AI execution.

### Step 6 — Implement lifecycle configuration

**References:** Delivery Graph §17

**Run**

```text
Implement .pactwright/lifecycle.yml parsing/validation for the stable stages capture-intent, propose-contracts, approve-contract, write-brief, deliver-brief, review and prepare-evidence. Support manual/automatic execution, authorised Decision actor and human gates. Do not add Deployment, Asset, Publication or Observation as stages.
```

**Expected result**

Repositories can configure execution/gates without changing the stable lifecycle structure.

**Verify before continuing**

Run tests for both lifecycle examples in Delivery Graph §17 plus invalid actor/stage fixtures.

### Step 7 — Implement lifecycle graph mutations

**References:** Delivery Graph §§6–15, 19

**Run**

```text
Implement runtime graph-mutation responsibilities for creating Intent, recording Decision, creating the canonical Contract, creating Brief and creating Evidence plus required core edges and explicit supersession. Recording a Decision must enforce Delivery Graph §8: the acting actor must be authorised for approve-contract by lifecycle.yml, and the actual actor is recorded in decided_by. Mutations must validate the complete proposed state before commit and use atomic file replacement so validation or write failure cannot leave partial graph state. Contract alternatives remain transient. Delivery execution and Review do not directly mutate the Delivery Graph.
```

**Expected result**

Proceed/reject/defer produce the exact canonical structures defined by the Delivery spec, and a Decision by an unauthorised actor is rejected before any graph mutation.

**Verify before continuing**

Run proceed, reject and defer fixtures and inspect resulting graph state. Run an unauthorised-actor Decision fixture and confirm it fails with no graph mutation.

### Step 8 — Implement lifecycle status/next/run

**References:** Delivery Graph §§18, 20

**Run**

```text
Implement pactwright lifecycle status, next and run. The runtime derives transitions from graph state + lifecycle.yml + repository state. lifecycle run stops at a human gate, completion, failure or validation error and never skips configured gates. When current Evidence exists, next reports no further core Delivery stage.
```

**Expected result**

The runtime—not prompts—owns stage progression.

**Verify before continuing**

Use fixture repositories to prove run stops at a manual gate and no next core stage exists after Evidence.

### Step 9 — Implement validate and context

**References:** Delivery Graph §§21–22

**Run**

```text
Implement pactwright validate and pactwright context <node-id> [--history]. Default context returns the current core lineage only and excludes rejected alternatives, superseded nodes, review transcripts, obsolete reasoning and execution provenance. Keep a namespaced extension-context seam for later checkpoints.
```

**Expected result**

A user or agent can recover high-signal current Delivery context from one command.

**Verify before continuing**

Run validate and context against open, delivering and done fixtures; inspect output for excluded historical/transient material.

## Stage 3 — Add replaceable AI execution

Connect core responsibilities to an agent pack and generated Claude Code adapter without moving lifecycle semantics into prompts.

### Step 10 — Implement the core capability model and default agent pack

**References:** Distribution §7; Delivery Graph §16

**Run**

```text
Implement the initial capability model and `@pactwright/standard` agent pack for delivery-specification, delivery-execution and delivery-review.

Create `@pactwright/standard` as a publishable workspace package with the same normal build/prepack discipline as `pactwright`. Make `pactwright` depend on it through `workspace:*` so a normal `pnpm add -D pactwright@<version>` installs the default pack automatically. This satisfies Distribution §2's "the core package contains the default agent pack" as an automatic dependency rather than an inlined copy; consumers still receive the pack from one `pnpm add -D pactwright`.

During the `0.0.x` development series, the pack manifest declares the exact matching `0.0.x` runtime version as its `pactwright` compatibility (the `^1.0.0` examples in Distribution §7 apply from `0.1.0` onward, since caret ranges do not span `0.0.x` versions).

Resolve agents/skills and lock their hashes. Reject a pack missing a required capability before canonical graph mutation.

Do not implement `pactwright agent-pack use` or `pactwright upgrade` in this checkpoint; the standard pack is the only pack and is selected by default (see §4 deferrals).
```

**Expected result**

Core AI behaviour is replaceable and capability-checked.

**Verify before continuing**

Run a complete-pack fixture and an incomplete-pack fixture; the latter must fail without lock/graph mutation.

### Step 11 — Implement Claude Code adapter rendering

**References:** Distribution §8; Delivery Graph §19

**Run**

```text
Implement the initial Claude Code adapter generation into .claude/agents and .claude/commands. Generate /capture-intent, /propose-contracts, /approve-contract, /write-brief, /deliver-brief, /review and /prepare-evidence. Generated commands invoke runtime responsibilities; prompts must not own transition rules.
```

**Expected result**

The adapter is generated and deterministic.

**Verify before continuing**

Run the adapter renderer twice against the same fixture inputs and require byte-identical generated output. Full `sync` idempotency is verified in Step 16.

### Step 12 — Implement the initial evaluation runner

**References:** Distribution §16

**Run**

```text
Implement pactwright eval with an initial core Delivery suite. Keep deterministic assertions separate from semantic judgement. Add cases for contract fidelity, scope discipline, required graph/output structure, forbidden mutation and Review defect detection. Do not calculate one aggregate quality score. Do not implement `--baseline` comparison yet; it requires a released pack baseline (see §4 deferrals).
```

**Expected result**

Core agent behaviour can be evaluated independently from project Delivery.

**Verify before continuing**

Run `pnpm pactwright eval` once the CLI is wired and inspect per-case output.

## Stage 4 — Make Pactwright installable and composable

Implement Distribution commands and deterministic local generation.

### Step 13 — Implement `pactwright init`

**References:** Distribution §§2–3

**Run**

```text
Implement pactwright init. In a clean repository create only Pactwright-owned core configuration/graph structure from Distribution §§2–3 using @pactwright/standard and Claude Code defaults. In this checkpoint, init writes `github.enabled: false` and creates no `.github/` content; the `.github/workflows/` entry in Distribution §2's core structure activates with GitHub provisioning in Checkpoint 2. Do not copy runtime scripts into the consumer repository. Handle existing files safely.
```

**Expected result**

A clean repository can initialise Pactwright with no manual copying.

**Verify before continuing**

Run the `init` integration tests against a temporary repository using the repository-local CLI implementation. Confirm only the owned core structure is created. Packaged-consumer installation is verified in Stage 6.

### Step 14 — Implement config/lock resolution

**References:** Distribution §§3, 6

**Run**

```text
Implement desired-state config resolution and exact lock state. Lock runtime version, selected agent pack version/hash and resolved agent/skill hashes; prepare extension lock structure for later use. Same desired state must resolve reproducibly.
```

**Expected result**

Config expresses intent; lock records exact resolved runtime/AI state.

**Verify before continuing**

Resolve the same fixture twice and compare lock output byte-for-byte.

### Step 15 — Implement extension manifests/dependency resolution

**References:** Distribution §§4–5

**Run**

```text
Implement package-backed extension manifest loading, compatibility checks, dependency resolution, graph contribution registration, command namespaces, required capabilities and GitHub profile metadata. Implement extension add/remove/upgrade using an internal fixture extension first. Block dependency removal while enabled dependants exist and preserve user-authored canonical extension data on removal.
```

**Expected result**

The runtime can safely compose independently versioned extensions before first-party extensions are implemented.

**Verify before continuing**

Run fixture tests for add, dependency add, blocked removal, safe disable and preserved canonical data.

### Step 16 — Implement deterministic `pactwright sync`

**References:** Distribution §8

**Run**

```text
Implement pactwright sync: load config/lock/extensions, validate capability union, assemble agents/skills and render only Pactwright-managed local integration. In this checkpoint, sync renders the `.claude/` adapter surface only: the Distribution §8 rendering step for Pactwright-managed GitHub workflow files is a seam that activates in Checkpoint 2, and sync must never claim ownership of user-authored `.github/workflows/**` (including this repository's hand-written `ci.yml` and `release.yml`). It must not mutate GitHub remote state or unrelated user files. Repeated sync with unchanged inputs must be byte-identical.
```

**Expected result**

Local generated integration converges from config + lock.

**Verify before continuing**

Run the `sync` integration test against a temporary repository using the repository-local CLI implementation. Invoke `sync` twice with identical inputs and require byte-identical managed output after the second run.

## Stage 5 — Establish repository CI and release safety

These workflows are Pactwright repository engineering infrastructure. They are not generated Pactwright product workflows.

### Step 17 — Implement the repository verification workflow

**References:** Implementation Guide — Engineering baseline (Verification, GitHub Actions); Distribution §§18–19

**Run**

```text
Create `.github/workflows/ci.yml`.

Requirements:
- run on pull requests and pushes to the default branch;
- checkout with `persist-credentials: false`;
- pin every third-party action to a full commit SHA;
- use the Node versions the package explicitly supports; do not claim untested compatibility;
- enable Corepack/use the repository-pinned pnpm;
- run `pnpm install --frozen-lockfile`;
- run `pnpm verify`;
- grant only `contents: read`;
- set a bounded timeout;
- cancel superseded runs for the same pull request.

Name the required check `CI / Verify`.
Do not use `pull_request_target`.
```

**Expected result**

A clean checkout can prove the same repository verification gate used locally without write credentials.

**Verify before continuing**

Run `pnpm verify` and inspect the workflow file for SHA-pinned actions and least-privilege permissions. The first real `CI / Verify` run is required when the self-hosting commit is pushed in Stage 7.

### Step 18 — Implement the trusted release workflow

**References:** Implementation Guide — npm release model, Engineering baseline (GitHub Actions); Distribution §§2, 18–19

**Run**

```text
Create `.github/workflows/release.yml` as repository-owned release infrastructure.

Requirements:
- trigger only on pushed tags matching `v*`;
- run on a GitHub-hosted runner;
- use the `npm-release` GitHub environment;
- permissions are `contents: read` and `id-token: write`;
- checkout uses `persist-credentials: false`;
- pin every third-party action to a full commit SHA;
- use a Node/npm version compatible with npm trusted publishing and the repository-pinned pnpm;
- do not use dependency caching for the release job;
- run `pnpm install --frozen-lockfile`;
- run `pnpm verify`;
- assert the tag version equals all publishable workspace package versions;
- assert the tagged commit belongs to the default-branch history;
- run a recursive publish dry-run before the first immutable registry write;
- use `next` for `0.0.x`, otherwise `latest`;
- publish recursively with public access and provenance;
- skip workspace versions already present in the registry so a rerun or a tag whose versions were bootstrap-published interactively completes successfully without attempting an immutable-registry rewrite (recursive pnpm publishing provides this; the workflow must not defeat it);
- after publishing, verify each expected package/version resolves from the registry and fail the run if any is missing;
- because tag checkouts are detached, disable pnpm's built-in git checks only after the explicit tag/default-branch assertions pass;
- use release concurrency with `cancel-in-progress: false`;
- store no npm publish token.
```

**Expected result**

After trusted publishers are configured, a version tag is sufficient to verify and publish the exact tagged source through OIDC.

**Verify before continuing**

Validate the workflow syntax and inspect that it has no npm token secret, no write-capable checkout credential and no release path that bypasses `pnpm verify`.

## Stage 6 — Package and prove the bootstrap runtime

Build a real consumer artefact, then run it outside the Pactwright source repository.

### Step 19 — Pack the bootstrap distribution

**References:** Distribution §§2, 18–19

**Run**

From the Pactwright repository root:

```bash
pnpm pack --out /tmp/pactwright-checkpoint-1-bootstrap.tgz
pnpm --filter @pactwright/standard pack --out /tmp/pactwright-standard-checkpoint-1-bootstrap.tgz
```

`prepack` builds the current distribution before pnpm creates each archive.

Both tarballs are required: `pnpm pack` rewrites the `workspace:*` dependency on `@pactwright/standard` to a concrete registry version, and that version is not published to npm until Stage 9. A fixture installing only the runtime tarball would fail dependency resolution.

**Expected result**

`/tmp/pactwright-checkpoint-1-bootstrap.tgz` and `/tmp/pactwright-standard-checkpoint-1-bootstrap.tgz` are the installable bootstrap packages produced by pnpm.

**Verify before continuing**

```bash
test -f /tmp/pactwright-checkpoint-1-bootstrap.tgz
test -f /tmp/pactwright-standard-checkpoint-1-bootstrap.tgz
```

### Step 20 — Install and initialise the bootstrap package in a clean fixture

**References:** Distribution §§2, 8; Delivery Graph §§20–22

**Run**

From a temporary directory outside the Pactwright source repository:

```bash
rm -rf /tmp/pactwright-checkpoint-1-fixture
mkdir -p /tmp/pactwright-checkpoint-1-fixture
cd /tmp/pactwright-checkpoint-1-fixture

pnpm init
npm pkg set 'pnpm.overrides.@pactwright/standard=file:/tmp/pactwright-standard-checkpoint-1-bootstrap.tgz'
pnpm add -D /tmp/pactwright-checkpoint-1-bootstrap.tgz
pnpm pactwright init
pnpm pactwright sync
pnpm pactwright validate
pnpm pactwright lifecycle status
```

The override satisfies the runtime's `@pactwright/standard` dependency from the local tarball because that package does not exist on npm until Stage 9. It is a bootstrap-fixture mechanism only; published consumers (Stage 10) resolve the dependency normally from the registry.

**Expected result**

The fixture becomes a valid Pactwright consumer using only the packed artefacts and generated project integration.

**Verify before continuing**

`validate` and `lifecycle status` complete successfully without any manual repair to Pactwright-managed files.

### Step 21 — Complete one full Delivery in the fixture

**References:** Delivery Graph §19

**Run**

From `/tmp/pactwright-checkpoint-1-fixture`:

```text
/capture-intent "Create one small repository artefact that proves the complete Pactwright Delivery lifecycle."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

Then, from the same repository:

```bash
pnpm pactwright validate
pnpm pactwright lifecycle status
pnpm pactwright context <intent-id>
```

**Expected result**

The packed consumer installation completes Intent → Decision → Contract → Brief → Delivery → Review → Evidence; rejected alternatives remain transient.

**Verify before continuing**

Confirm all three commands pass and the current graph contains exactly the expected durable Delivery lineage.

## Stage 7 — Adopt Pactwright in Pactwright

Cross the self-hosting boundary using the repository-local CLI built from the same package source. The `pactwright` package does not add itself as a dependency of its own source repository.

### Step 22 — Initialise the Pactwright repository

**References:** Distribution §§2, 8

**Run**

From the Pactwright repository root:

```bash
DEFAULT_BRANCH="$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name)"

git switch "$DEFAULT_BRANCH"
git pull --ff-only
test -z "$(git status --porcelain)"

pnpm build
pnpm pactwright init
pnpm pactwright sync
pnpm pactwright validate
pnpm pactwright lifecycle status
pnpm verify

git add -A
git commit -m "Adopt Pactwright for self-hosting"
git push origin "$DEFAULT_BRANCH"
```

**Expected result**

The Pactwright repository is now managed by Pactwright using its repository-local CLI and generated integration.

**Verify before continuing**

From the Pactwright repository root:

```bash
pnpm pactwright validate
pnpm pactwright lifecycle status
pnpm pactwright sync
test -z "$(git status --porcelain)"
```

The second `sync` must leave the committed self-hosting state unchanged. Confirm the `CI / Verify` run triggered by the push passed before continuing.

### Step 23 — Deliver the first self-hosted Quick Start improvement

**References:** Open-Source Project Organisation §§2–3, 8, 15–16; Delivery Graph §19

**Run**

From the Pactwright repository root:

```text
/capture-intent "Create or refine Pactwright's core Quick Start so it documents the installation and Delivery commands that now actually work."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

Then:

```bash
pnpm pactwright validate
pnpm pactwright lifecycle status
pnpm verify

git add -A
git commit -m "Deliver Pactwright Quick Start through Pactwright"
git push origin "$DEFAULT_BRANCH"
```

**Expected result**

Pactwright has completed a real change to its own repository through its own Delivery lifecycle.

**Verify before continuing**

Confirm the Quick Start only documents commands proven in the bootstrap/fixture stages, the corresponding Intent → Evidence lineage is valid, and the triggered `CI / Verify` run passes.

## Stage 8 — Complete the `0.0.1` public product

Before Project Intelligence exists, public-product work still goes through the normal Delivery lifecycle. This stage runs before the release: the Implementation Guide's public-product progression maps `0.0.1` to "README Quick Start + Getting Started + core Delivery example", so that content set must exist in the source that Stage 9 tags and publishes.

### Step 24 — Deliver the core Delivery learning path

**References:** Open-Source Project Organisation §§1.3, 3; Implementation Principles §§6, 12; Implementation Guide — Public-product progression

**Run**

From the Pactwright repository root:

```text
/capture-intent "Publish Pactwright's first usable learning path for Core Delivery: keep the README Quick Start current, add a concise Getting Started guide, and add one runnable core Delivery example. Reuse the same commands and semantics already proven in this checkpoint."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

Then:

```bash
DEFAULT_BRANCH="$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name)"

pnpm pactwright validate
pnpm verify

git add -A
git commit -m "Deliver the core Delivery learning path through Pactwright"
git push origin "$DEFAULT_BRANCH"
```

**Expected result**

A new user can understand, install and try the exact Core Delivery capability that `0.0.1` will ship, without depending on future extensions, and the content is part of the source that Stage 9 releases.

**Verify before continuing**

Follow the Getting Started guide and example from a clean consumer fixture built with the Stage 6 tarballs. README, guide and example must agree on the same working command surface, the corresponding Intent → Evidence lineage must be valid, and the triggered `CI / Verify` run must pass.

## Stage 9 — Publish `0.0.1` and bootstrap npm trusted publishing

Release the accepted source, including the Stage 8 public content, as the Checkpoint 1 package family.

### Step 25 — Publish `0.0.1` and bootstrap npm trusted publishing

**References:** Implementation Guide — npm release model; Distribution §§2, 6–8, 18–19

**Run**

First update `CHANGELOG.md` from accepted Checkpoint 1 Evidence only.

From the Pactwright repository root:

```bash
DEFAULT_BRANCH="$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name)"

pnpm whoami || npm login

pnpm -r --include-workspace-root exec npm version 0.0.1 --no-git-tag-version --allow-same-version
pnpm install
pnpm verify
pnpm publish -r --dry-run --tag next --access public

git add -A
git commit -m "chore: release 0.0.1"
git push origin "$DEFAULT_BRANCH"

pnpm publish -r --tag next --access public
```

The interactive publish is the one-time bootstrap required before npm can attach a trusted publisher to a new package (Implementation Guide — First publication of a package). It requires an authenticated npm account with 2FA; the `npm login` fallback establishes it if `pnpm whoami` fails.

Then configure the trusted release workflow for both published packages:

```bash
REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"

npx -y npm@^11.15 trust github pactwright \
  --repo "$REPO" \
  --file release.yml \
  --environment npm-release \
  --allow-publish

npx -y npm@^11.15 trust github @pactwright/standard \
  --repo "$REPO" \
  --file release.yml \
  --environment npm-release \
  --allow-publish
```

If the installed npm version does not provide the `trust` subcommand, configure the trusted publisher for each package in the npm web interface instead (package settings → trusted publisher: this repository, workflow `release.yml`, environment `npm-release`), then continue.

Finally tag the accepted release commit:

```bash
git tag -a v0.0.1 -m "v0.0.1"
git push origin v0.0.1
```

**Expected result**

`pactwright@0.0.1` and `@pactwright/standard@0.0.1` exist under `next`, and both packages trust `.github/workflows/release.yml` for subsequent OIDC publishing.

**Verify before continuing**

```bash
pnpm view pactwright@0.0.1 version
pnpm view @pactwright/standard@0.0.1 version

npx -y npm@^11.15 trust list pactwright
npx -y npm@^11.15 trust list @pactwright/standard
```

If the `trust` subcommand is unavailable, confirm the trusted-publisher configuration for both packages in the npm web interface instead.

Confirm the tag-triggered release workflow also completes successfully; because `0.0.1` already exists in the registry, the Step 18 skip-already-published behaviour must leave it unaltered and the run must still finish green, including its registry-verification stage.

## Stage 10 — Prove the published release on Kakeido

Use the final Checkpoint 1 package on the persistent external proving project.

### Step 26 — Install the published Checkpoint 1 release in Kakeido

**References:** Distribution §§2–3

**Run**

From the Kakeido repository root:

```bash
pnpm add -D pactwright@0.0.1
pnpm pactwright init
pnpm pactwright sync
pnpm pactwright validate
pnpm pactwright lifecycle status
```

**Expected result**

Kakeido is running the final Checkpoint 1 package with core Delivery only; no optional extension is enabled.

**Verify before continuing**

`validate` and `lifecycle status` complete successfully using the installed Checkpoint 1 package.

### Step 27 — Deliver Kakeido financial-domain invariants

**References:** First Kakeido semantic acceptance — Kakeido — Financial Model Spec §§2–18; Delivery Graph §19

**Run**

From the Kakeido repository root:

```text
/capture-intent "Implement Kakeido's shared financial-domain model and deterministic invariant tests from Kakeido — Financial Model Spec v1.0 §§2–17, accepted against §18."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

Then:

```bash
pnpm pactwright validate
pnpm pactwright lifecycle status
```

Run the Kakeido repository-defined financial-domain tests as part of the same acceptance step.

**Expected result**

Implementation preserves fixed/flexible separation, envelope reconciliation, split/duplicate determinism, reviewed-only totals, user-confirmed classification and immutable historical spendings across plan changes.

**Verify before continuing**

Pactwright validation/status and the Kakeido financial-domain tests all pass, and the delivered behaviour satisfies the acceptance criteria in Kakeido — Financial Model Spec §18. The Kakeido graph contains a valid Intent → Evidence lineage for the delivered work.

## Stage 11 — Capture checkpoint feedback

Close the checkpoint's learning loop before declaring it complete.

### Step 28 — Capture Checkpoint 1 findings as future project work

**References:** Implementation Principles §§7, 14; Implementation Guide — Transition rule

**Run**

Review the execution of Stages 1–10, including bootstrap-fixture friction, self-hosting friction, Kakeido installation and onboarding problems, content gaps and any deviation between specification and implementation.

From the Pactwright repository root, for each finding worth acting on:

```text
/capture-intent "<finding phrased as a requested outcome>"
```

Project Intelligence does not exist yet, so findings are captured directly as Intents through normal Delivery (Implementation Principles §14). Leave the captured Intents open; they are future work, not part of this checkpoint's Delivery.

Blocking failures must instead be fixed within this checkpoint: repeat the affected stage's steps until its verification passes.

**Expected result**

Every material Checkpoint 1 finding exists as an open Intent in the Pactwright graph, and no known blocking failure is carried into Checkpoint 2.

**Verify before continuing**

Run `pnpm pactwright validate` and `pnpm pactwright lifecycle status`; captured Intents are valid open lineages. Confirm no blocking failure remains unresolved.

## Exit gate

All Stage 1–11 verifications pass.

The checkpoint is complete only when:

- `pactwright` has been built and packed as a real Node package;
- the bootstrap tarballs install and complete a full lifecycle in a clean external fixture;
- Pactwright manages its own repository and completes a real self-hosted Delivery;
- the `0.0.1` public content set (README Quick Start, Getting Started guide, core Delivery example) is delivered through Pactwright and included in the tagged release source;
- `0.0.1` is published to npm and installs into Kakeido;
- Kakeido completes a real Intent → Evidence Delivery using that final package;
- repeated `sync` operations converge;
- no lifecycle or graph coherence requires hand-maintained relationships;
- checkpoint findings are captured as open Intents and no known blocking failure is carried into Checkpoint 2.

---

**Pactwright — Checkpoint 1 — Self-Hosted Delivery v12**