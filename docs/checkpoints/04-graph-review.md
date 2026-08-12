# Pactwright — Checkpoint 4 — Graph Review

**Version:** 8 
**Entry condition:** Checkpoint 3 is accepted. 
**Exit capability:** Pactwright can run reproducible specialist Graph Reviews over the registered Project Graph and route findings through PI.

## 1. Goal

Implement Review execution infrastructure, the generic Review engine and full standard roster; then review Pactwright and Kakeido and turn at least one finding in each into governed corrected Delivery.

## 2. Specification baseline

- [Pactwright — Delivery Graph and Lifecycle Engineering Spec](../research-logs/2026-08-11-pactwright-delivery-graph-and-lifecycle-engineering-spec.md)
- [Pactwright — Distribution, Agents and Evaluation](../research-logs/2026-08-11-pactwright-distribution-agents-and-evaluation.md)
- [Pactwright — GitHub Actions and Views](../research-logs/2026-08-11-pactwright-github-actions-and-views.md)
- [Pactwright — Project Intelligence Graph Engineering Spec](../research-logs/2026-08-11-pactwright-project-intelligence-graph-engineering-spec.md)
- [Pactwright — Graph Review & Creative Delivery Engineering Spec](../research-logs/2026-08-11-pactwright-graph-review-and-creative-delivery-engineering-spec.md)
- [Pactwright — Operations Graph Engineering Spec](../research-logs/2026-08-11-pactwright-operations-graph-engineering-spec.md)
- [Pactwright — System Architecture](../research-logs/2026-08-11-pactwright-system-architecture.md)
- [Pactwright — Implementation Principles](./00-implementation-principles.md)
- [Pactwright Open-Source Project Organisation](../research-logs/2026-08-11-pactwright-open-source-project-organisation.md)
- [Design Specification: Astro + Cloudflare Workers + Meta CAPI](../research-logs/2026-08-11-astro-design-spec.md)
- [Kakeido — Financial Model Spec](../research-logs/2026-08-11-kakeido-financial-model-spec.md)
- [Kakeido — Product & UX Spec](../research-logs/2026-08-11-kakeido-product-and-ux-spec.md)
- [Kakeido — Mobile Design Spec](../research-logs/2026-08-11-kakeido-mobile-design-spec.md)
- [Kei — Assistant Spec](../research-logs/2026-08-11-kakeido-assistant-spec.md)
- [Kakeido — Tech Stack Engineering Spec](../research-logs/2026-08-11-kakeido-tech-stack-engineering-spec.md)

Only the owning specifications listed in each step define semantics. This runbook defines execution order, not new product meaning.

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

**Default execution location:** the Pactwright repository root unless the step explicitly names Kakeido or a fixture

For repository/code changes, finish with `pnpm verify`. Before invoking a newly implemented Pactwright runtime command during implementation, run `pnpm build` so the repository-local CLI is not using stale distribution output.

After Checkpoint 2 activates GitHub, land coherent repository changes through pull requests and required checks rather than direct default-branch commits.

Dynamic ids such as `<source-id>`, `<brief-id>` and `<evidence-id>` must come from an earlier command in the runbook. Commands that create or resolve durable records must print the ids required by later steps.

Fixture verification means repository test fixtures unless a step explicitly creates a real repository or GitHub resource.

## 4. Checkpoint specification map

- **Review boundary/engine/roster** — Pactwright — Graph Review & Creative Delivery Engineering Spec §§1–8
- **Provider/Generation provenance** — Pactwright — Graph Review & Creative Delivery Engineering Spec §§14–16
- **Commands/validation/build order** — Pactwright — Graph Review & Creative Delivery Engineering Spec §§19, 21–24
- **Finding governance** — Pactwright — Project Intelligence Graph Engineering Spec §§8, 14–17
- **GitHub review surface** — Pactwright — GitHub Actions and Views §§7, 22

## Stage 1 — Build provider execution provenance required by Review

Establish extension-owned provider execution before Review depends on it.

### Step 1 — Implement Provider Runtime interface/error model

**References:** Provider/Generation provenance §14

**Run**

```text
Using self-hosted Delivery, implement the Review & Creative ProviderRuntime interface and normalised auth/rate-limit/content-policy/transient/permanent errors. Keep provider-specific SDK translation inside adapters and do not implement Asset/Publication semantics yet.
```

**Expected result**

Extension-owned direct provider calls use one repository-local runtime.

**Verify before continuing**

Run adapter conformance tests through the implementation environment.

### Step 2 — Implement provider/task configuration

**References:** Provider/Generation provenance §15

**Run**

```text
Implement .pactwright/review-creative/providers and tasks configuration, eligible provider/model sets and default selection. Adding a provider must require adapter + conformance tests + Provider Definition + task eligibility, not Review engine changes.
```

**Expected result**

Provider/model eligibility is explicit and project-configurable.

**Verify before continuing**

Run a mock second-adapter conformance fixture.

### Step 3 — Implement immutable Generation Records

**References:** Provider/Generation provenance §16

**Run**

```text
Implement one immutable Generation Record for every extension-owned provider call, recording caller, provider/model/capability/task, graph revision, prompt hash, guidance/grounding, usage/cost/latency, status and output hash/error. Failed/refused calls are recorded; records are execution provenance, not graph nodes.
```

**Expected result**

Provider calls are traceable without polluting normal Project Graph traversal.

**Verify before continuing**

Run success/failure/refusal fixtures and inspect graph revision/traversal exclusions.

## Stage 2 — Build the generic Graph Review engine

Implement definition-driven review over the registered graph.

### Step 4 — Implement Review Definition loading/validation

**References:** Review boundary/engine/roster §6.1

**Run**

```text
Implement Review Definition loading/validation for stable id/version, perspective, graph scope, rubric, trigger, task class, steward and optional secondary model. Definitions are configuration, not graph nodes.
```

**Expected result**

Projects can add reviewer perspectives without new graph semantics.

**Verify before continuing**

Run valid/invalid definition fixtures.

### Step 5 — Implement extension-aware scope resolution

**References:** Review boundary/engine/roster §6.2

**Run**

```text
Implement review scope resolution from the registered Project Graph schema. graph: project must include compatible enabled-extension canonical state without hard-coded extension names. Allow narrowing by subgraph/node type/domain/relationship/lineage/report/execution when explicitly configured.
```

**Expected result**

The Review engine automatically understands future registered graph types.

**Verify before continuing**

Add a fixture future extension node type and prove a project-wide scope sees it.

### Step 6 — Implement Review Execution and `review run`

**References:** Review boundary/engine/roster §6.3

**Run**

```text
Implement immutable Review Execution and pactwright review run <review-id>. Resolve the current core Project Graph revision, resolved scope/configuration, invoke graph-review, record execution status/findings/generation records, and print the Review Execution id plus any internal Source ids created for findings. Failed runs record provenance but emit no accepted truth.
```

**Expected result**

Every review is pinned to deterministic graph/configuration inputs.

**Verify before continuing**

After installation, run architecture-reviewer and inspect the Review Execution record.

### Step 7 — Implement findings → PI internal Sources

**References:** Review boundary/engine/roster §6.4; Finding governance §14

**Run**

```text
Implement review Finding records inside Review Execution and hand every successful finding into Project Intelligence as an internal Source. Review ends at the finding and cannot edit Knowledge, Intents, Decisions, Contracts, Briefs, Assets, Publications, Deployments or Observations.
```

**Expected result**

Review proposes; PI governs consequence.

**Verify before continuing**

Run a fixture where Review attempts direct Knowledge mutation and require rejection.

### Step 8 — Implement historical/current rerun

**References:** Review boundary/engine/roster §6.3; Commands/validation/build order §§19, 22

**Run**

```text
Implement pactwright review rerun <execution-id> using the recorded pinned graph revision and resolved configuration by default; fail if those inputs cannot be resolved. Implement --current as the explicit latest-state rerun.
```

**Expected result**

Historical review does not silently drift to current state.

**Verify before continuing**

Run one historical rerun and one `--current`; compare recorded input revisions.

### Step 9 — Ship the complete standard reviewer roster

**References:** Review boundary/engine/roster §7

**Run**

```text
Add Review Definitions for ux-researcher, product-strategist, gtm-strategist, architecture-reviewer, graph-auditor, voice-auditor, cost-reviewer, generation-reviewer and progression-reviewer. Map multiple definitions to the generic graph-review capability unless evaluation justifies specialised agents.
```

**Expected result**

The full initial roster exists without one bespoke engine per reviewer.

**Verify before continuing**

Run `pnpm pactwright review roster` after installation and confirm all nine definitions.

### Step 10 — Implement progression next-actions

**References:** Review boundary/engine/roster §8

**Run**

```text
Implement progression-reviewer and pactwright review next-actions, generating docs/review-creative/reports/next-actions.md as a derived recommendation view over onboarding/roadmap/lifecycle/review state. It must not become another roadmap or create graph nodes.
```

**Expected result**

Pactwright can recommend the next useful command without duplicating PI roadmap/lifecycle.

**Verify before continuing**

Run `pactwright review next-actions` on fixtures with a known onboarding gap and stalled lifecycle.

## Stage 3 — Package and project Graph Review

Wire capabilities into Distribution and GitHub.

### Step 11 — Complete review-creative extension registration

**References:** Distribution §§4–7; Review boundary/engine/roster §4

**Run**

```text
Create/complete `@pactwright/review-creative` as a publishable workspace package and implement its manifest/dependency registration for Graph Review: require Project Intelligence, register review namespace/capabilities/configuration/GitHub profile, but do not depend on Operations.
```

**Expected result**

Distribution can install the extension and validate capability union/dependency graph.

**Verify before continuing**

Use a fixture add/remove test and confirm PI resolves automatically and Operations is not required.

### Step 12 — Implement the creative agent-pack package

**References:** Distribution §7

**Run**

```text
Implement `@pactwright/creative` as a publishable first-party agent-pack workspace package using the exact capability mapping defined by Distribution §7. Keep the package replaceable through the existing agent-pack interface; do not move graph or lifecycle semantics into the pack.
```

**Expected result**

`@pactwright/creative` is a real installable agent-pack package that can satisfy the Review & Creative capability requirements.

**Verify before continuing**

Run the agent-pack compatibility fixtures against `@pactwright/creative` and confirm its package build/prepack succeeds.

### Step 13 — Implement Review GitHub workflow/summaries/views

**References:** GitHub review surface §§7, 22

**Run**

```text
Implement generated pactwright-review-creative.yml Review automation, extension validation, Review summaries, Reviews view and Next Actions view. GitHub links to execution/findings/Sources but cannot promote them.
```

**Expected result**

Review can run remotely without GitHub becoming the Review store/knowledge authority.

**Verify before continuing**

Run `pactwright sync` and `github sync --dry-run`; inspect Review-owned contributions.

## Stage 4 — Adopt Graph Review in Pactwright

Run this stage from the Pactwright repository root.

Use real reviews on Pactwright immediately.

### Step 14 — Select the creative-capable pack and install Review & Creative

**References:** Distribution §§4, 7

**Run**

```bash
pnpm add -D \
  pactwright@0.0.4 \
  @pactwright/project-intelligence@0.0.4 \
  @pactwright/review-creative@0.0.4 \
  @pactwright/creative@0.0.4
pnpm install --frozen-lockfile

pnpm pactwright agent-pack use @pactwright/creative
pnpm pactwright extension add review-creative
pnpm pactwright sync
pnpm pactwright creative validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

**Expected result**

Pactwright has Review capability and all required PI dependencies.

**Verify before continuing**

Run `pnpm pactwright review roster` and `pnpm pactwright validate`.

### Step 15 — Run the first Pactwright specialist reviews

**References:** Review boundary/engine/roster §§6–8

**Run**

```bash
pnpm pactwright review run architecture-reviewer
pnpm pactwright review run graph-auditor
pnpm pactwright review run product-strategist
pnpm pactwright review next-actions
```

**Expected result**

Real Review Executions/findings/internal Sources are produced.

**Run**

For each internal Source id printed by the review commands:

```bash
pnpm pactwright intelligence triage <source-id>

# only when triage requires reviewed promotion and the proposal is accepted
pnpm pactwright intelligence promote <source-id>
```

Then:

```bash
pnpm pactwright intelligence derive-intent-roadmap
```

**Verify before continuing**

Each finding remains Review-owned provenance until its Source is governed by PI; no Review command directly mutates Knowledge or Delivery.

### Step 16 — Deliver one review-driven Pactwright correction

**References:** PI §§8, 11; Delivery Graph §19


**Run**

```text
/capture-intent "<accepted Pactwright correction motivated by Review>"
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Expected result**

A review finding affects the project only after PI governance and normal Delivery.

**Verify before continuing**

Trace Review Execution → Finding → Source → accepted meaning/candidate → Intent → Evidence.

### Step 17 — Prove historical replay semantics

**References:** Review boundary/engine/roster §6.3; Commands/validation/build order §§19, 22

**Run**

```bash
pnpm pactwright review rerun <execution-id>
pnpm pactwright review rerun <execution-id> --current
```

**Expected result**

Default uses pinned historical inputs; `--current` uses current graph state.

**Verify before continuing**

Inspect the two Review Executions and confirm input revision/configuration differences are explicit.

## Stage 5 — Review and advance the public product

### Step 18 — Review the existing Pactwright public corpus

**References:** Review boundary/engine/roster §§6–8; Open-Source Project Organisation §§1.1–1.3

**Run**

From the Pactwright repository root:

```bash
pnpm pactwright review run product-strategist
pnpm pactwright review run voice-auditor
pnpm pactwright review run graph-auditor
pnpm pactwright review next-actions
```

Triage every supported public-content finding through Project Intelligence:

```bash
pnpm pactwright intelligence triage <source-id>

# when reviewed promotion is required and accepted
pnpm pactwright intelligence promote <source-id>
```

**Expected result**

The existing README/Docs/Academy/Examples/Website corpus is reviewed against current graph truth, product strategy and identity/voice Knowledge.

**Verify before continuing**

Every accepted correction routes through PI; reviewers do not directly rewrite public content.

### Step 19 — Publish the Graph Review learning path

**References:** Open-Source Project Organisation §1.3; Review boundary/engine/roster §§6–8

**Run**

```text
/capture-intent "Publish Pactwright's Graph Review learning path: concise Graph Review documentation, one review workflow example, and an Academy Review & Improvement lesson. Use accepted Project Intelligence context and address accepted public-corpus review findings that are in scope."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

Then rerun the relevant reviewer(s) on current state.

**Expected result**

The newly available review capability improves both Pactwright's implementation and how Pactwright explains itself.

**Verify before continuing**

Blocking review findings are resolved or explicitly deferred through normal graph Decisions; public material remains consistent with accepted Knowledge.

## Stage 6 — Release `0.0.4`

### Step 20 — Prepare, publish and tag `0.0.4`

**References:** Distribution §§2, 4, 6–8, 15, 18–19

**Run**

Update `CHANGELOG.md` from accepted Checkpoint 4 Evidence only, then create the release PR:

```bash
VERSION=0.0.4
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
```

The following package names are new in this release and cannot use trusted publishing until their first registry version exists:

- `@pactwright/review-creative`
- `@pactwright/creative`

After the release PR is merged, bootstrap only those new packages interactively:

```bash
pnpm --filter @pactwright/review-creative publish --dry-run --tag next --access public
pnpm --filter @pactwright/review-creative publish --tag next --access public
pnpm --filter @pactwright/creative publish --dry-run --tag next --access public
pnpm --filter @pactwright/creative publish --tag next --access public

REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"

npx -y npm@^11.15 trust github @pactwright/review-creative \
  --repo "$REPO" \
  --file release.yml \
  --environment npm-release \
  --allow-publish

npx -y npm@^11.15 trust github @pactwright/creative \
  --repo "$REPO" \
  --file release.yml \
  --environment npm-release \
  --allow-publish
```

Do not manually publish packages that already have trusted publishing configured.

Tag the accepted merge commit:

```bash
git tag -a "v$VERSION" -m "v$VERSION"
git push origin "v$VERSION"
```

**Expected result**

The tag-triggered trusted `release.yml` workflow verifies the exact merged source and publishes every still-unpublished package in the `0.0.4` family under `next`. Existing published members are not overwritten.

**Verify before continuing**

Confirm the `release.yml` run for `v0.0.4` succeeded, then:

```bash
pnpm view pactwright@0.0.4 version
pnpm view @pactwright/standard@0.0.4 version
pnpm view @pactwright/project-intelligence@0.0.4 version
pnpm view @pactwright/review-creative@0.0.4 version
pnpm view @pactwright/creative@0.0.4 version
```

Every command must return `0.0.4`.

For the newly introduced package(s), also run:

```bash
npx -y npm@^11.15 trust list @pactwright/review-creative
npx -y npm@^11.15 trust list @pactwright/creative
```

Existing package-family members must show npm provenance/trusted-publisher metadata; the newly bootstrapped package(s) must now trust `release.yml` for the next release.


## Stage 7 — Prove Graph Review on Kakeido

Run this stage from the Kakeido repository root unless a step explicitly says otherwise.

Use specialist review to find cross-spec inconsistencies in a real unrelated project.

### Step 21 — Install Review & Creative in Kakeido

**References:** Distribution §§4, 7

**Run**

```bash
pnpm add -D \
  pactwright@0.0.4 \
  @pactwright/project-intelligence@0.0.4 \
  @pactwright/review-creative@0.0.4 \
  @pactwright/creative@0.0.4

pnpm pactwright extension upgrade project-intelligence
pnpm pactwright agent-pack use @pactwright/creative
pnpm pactwright extension add review-creative
pnpm pactwright sync
pnpm pactwright creative validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

**Expected result**

Kakeido has the same Review engine and standard roster.

**Verify before continuing**

Run `pnpm pactwright review roster`.

### Step 22 — Run cross-spec Kakeido reviews

**References:** Kakeido specs; Review boundary/engine/roster §7

**Run**

```bash
pnpm pactwright review run product-strategist
pnpm pactwright review run ux-researcher
pnpm pactwright review run architecture-reviewer
pnpm pactwright review run graph-auditor
```

**Expected result**

Reviews inspect Financial Model ↔ Product/UX, Product/UX ↔ Mobile, Kei ↔ Financial Model, Tech Stack ↔ product requirements.

**Run**

For every internal Source id printed by the reviews:

```bash
pnpm pactwright intelligence triage <source-id>

# only when triage requires reviewed promotion and the proposal is accepted
pnpm pactwright intelligence promote <source-id>
```

Then:

```bash
pnpm pactwright intelligence derive-intent-roadmap
```

**Verify before continuing**

Every accepted correction candidate traces to a supported Review finding and PI Source.

### Step 23 — Deliver one accepted Kakeido correction

**References:** PI §§8, 11; Delivery Graph §19

**Run**

```bash
pnpm pactwright intelligence derive-intent-roadmap
```


**Run**

```text
/capture-intent "<accepted Kakeido correction motivated by Review>"
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Expected result**

One real cross-spec finding completes the full governed correction path.

**Verify before continuing**

Trace finding provenance end-to-end and run all relevant Kakeido tests.

## Exit gate

Review Definitions are configuration, project-wide scope is extension-aware, Review Executions are pinned/replayable, failed reviews emit no truth, every successful finding enters PI, and at least one Pactwright and one Kakeido finding become corrected Delivery through normal governance.

---

**Pactwright — Checkpoint 4 — Self-Review v8**