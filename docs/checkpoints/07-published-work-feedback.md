# Pactwright — Checkpoint 7 — Published-Work Feedback

**Version:** 8 
**Entry condition:** Checkpoint 6 is accepted. 
**Exit capability:** Operations can observe Review & Creative Publications through manifest-driven exposure compatibility without ownership transfer or sibling dependency.

## 1. Goal

Complete the cross-extension Publication → Observation loop and prove it on real Pactwright and Kakeido Publications.

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

- **Publication ownership/exposure declaration** — Pactwright — Graph Review & Creative Delivery Engineering Spec §§1–4, 13
- **Generic production exposure/Observation** — Pactwright — Operations Graph Engineering Spec §§6, 11–15, 25
- **Sibling dependency model** — Pactwright — Distribution, Agents and Evaluation §§4–5
- **Cross-extension GitHub integration** — Pactwright — GitHub Actions and Views §§7–8, 23–24, 26–27

## Stage 1 — Implement manifest-driven exposure compatibility

Let sibling extensions integrate by contract, not hard-coded dependency.

### Step 1 — Declare Publication as an Operations-compatible exposure

**References:** Publication ownership/exposure declaration §4

**Run**

```text
Add operations.exposure_types: [publication] to the Review & Creative manifest as defined by the spec. This declaration must be inert when Operations is disabled and must not introduce an Operations dependency.
```

**Expected result**

Review & Creative advertises compatible exposure semantics without depending on Operations.

**Verify before continuing**

Run manifest/dependency tests with Review & Creative enabled alone.

### Step 2 — Implement generic exposure-type discovery in Operations

**References:** Generic production exposure/Observation §6

**Run**

```text
Implement Operations resolution of compatible exposure types from enabled extension manifests. Do not hard-code Publication or any future extension type. Require enough durable identity for exact exposure reference.
```

**Expected result**

Operations can consume registered exposure types generically.

**Verify before continuing**

Add a fixture extension contributing a second exposure type and prove no Operations engine code change is needed.

### Step 3 — Validate Observation targets against the registered exposure registry

**References:** Operations §§6, 11, 22

**Run**

```text
Extend Operations validation so observes edges target only registered operational exposure types. When the target is Publication, reference the existing Review & Creative record; never copy/rewrite it into Operations storage.
```

**Expected result**

Cross-extension edges preserve canonical ownership.

**Verify before continuing**

Run valid Publication target, disabled-extension target and unregistered-type fixtures.

## Stage 2 — Add cross-extension automation composition

Trigger Operations from Publication changes while keeping workflow ownership clear.

### Step 4 — Compose Publication paths/events into the Operations workflow

**References:** GitHub §§4, 7–8

**Run**

```text
Update GitHub desired-state/profile composition so, when both extensions are enabled, Publication changes can contribute trigger/path requirements to .github/workflows/pactwright-operations.yml. Keep Operations automation owned by the Operations workflow; do not add production analysis to Review & Creative semantics.
```

**Expected result**

Cross-extension automation composes from profiles without a new sibling dependency.

**Verify before continuing**

Run `pactwright sync` and `github sync --dry-run` with Review-only, Operations-only and both-enabled fixtures.

## Stage 3 — Prove Publication feedback on Pactwright

Run this stage from the Pactwright repository root.

Observe a real public Pactwright output.

### Step 5 — Select or record a real Pactwright Publication

**References:** Publication ownership/exposure declaration §13

**Run**

```bash
pnpm add -D \
  pactwright@0.0.7 \
  @pactwright/project-intelligence@0.0.7 \
  @pactwright/review-creative@0.0.7 \
  @pactwright/creative@0.0.7 \
  @pactwright/operations@0.0.7
pnpm install --frozen-lockfile

pnpm pactwright creative record-publication <asset-id> <channel>
pnpm pactwright creative validate
```

**Expected result**

A canonical Publication exists for a real Pactwright public surface.

**Verify before continuing**

Inspect the Publication’s Asset/hash/channel/locator.

### Step 6 — Configure a publication evidence source

**References:** Operations §§8–11

**Run**

```text
Create the minimum Operations source configuration needed to observe the selected Pactwright Publication through an existing analytics/evidence system. Store only configuration/provenance. Do not commit credentials or raw analytics events. Run operations validate.
```

**Expected result**

Operations can collect bounded evidence about the Publication.

**Verify before continuing**

Run `pnpm pactwright operations validate` and inspect committed config.

### Step 7 — Create/route a Pactwright Publication Observation

**References:** Generic production exposure/Observation §§11–15; PI §14

**Run**

```bash
pnpm pactwright operations ingest <publication-source-id>
pnpm pactwright operations observe <publication-source-id>
pnpm pactwright operations validate
pnpm pactwright intelligence triage <internal-source-id>
```

**Expected result**

Real publication performance/failure becomes an Operations Observation then PI Source.

**Run**

```bash
# only when triage requires reviewed promotion and the proposal is accepted
pnpm pactwright intelligence promote <internal-source-id>

pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright operations corrective-roadmap
```

**Verify before continuing**

Trace the Observation to the exact Publication id/hash and confirm no Asset/Publication mutation occurred.

## Stage 4 — Prove ownership and disablement

Demonstrate the sibling extensions remain independent.

### Step 8 — Prove Review & Creative works without Operations

**References:** Publication ownership/exposure declaration §§1–4, 13

**Run**

```text
In a fixture, enable Review & Creative + PI but not Operations. Create/validate an Asset and Publication. Confirm all Review & Creative semantics remain valid and no Operations command/state is required.
```

**Expected result**

Publication semantics do not depend on Operations.

**Verify before continuing**

Run Review & Creative validation with Operations disabled.

### Step 9 — Prove Operations cannot mutate Publication

**References:** Generic production exposure/Observation §25

**Run**

```text
In a fixture with both extensions enabled, create a valid Publication and Observation targeting it. Attempt an Operations-side mutation/copy of Publication state and prove it is rejected; compare Publication bytes/hash before and after.
```

**Expected result**

Observation references but never owns Publication.

**Verify before continuing**

Record before/after Publication hash and `operations validate` result.

### Step 10 — Prove disabling Operations leaves Publications valid

**References:** Operations §2; Distribution §14

**Run**

```text
In a fixture with both extensions, create Publication + Observation, then disable/remove Operations according to Distribution ownership rules. Confirm existing Asset/Publication/Delivery records remain semantically valid and only Operations-owned integration is removed.
```

**Expected result**

Removing Operations does not reinterpret Review & Creative truth.

**Verify before continuing**

Run `creative validate` after Operations disable/removal.

## Stage 5 — Improve a real Pactwright Publication from evidence

This is the first checkpoint where the public product itself must close the production-feedback loop.

### Step 11 — Derive a public-content correction from Publication evidence

**References:** Generic production exposure/Observation §§11–15; Project Intelligence §§8, 11–14; Open-Source Project Organisation §1.3

**Run**

Use the real Pactwright Publication observed earlier in this checkpoint:

```bash
pnpm pactwright operations ingest <publication-source-id>
pnpm pactwright operations observe <publication-source-id>
pnpm pactwright intelligence triage <internal-source-id>

# only when required and accepted
pnpm pactwright intelligence promote <internal-source-id>

pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright operations corrective-roadmap
```

Select an accepted content/positioning/usability correction only if the evidence supports one.

**Expected result**

A public-content improvement is proposed by the same governed Observation → PI candidate model as software corrections.

**Verify before continuing**

The candidate traces to the exact Publication and supporting operational evidence; unsupported causal claims are absent.

### Step 12 — Publish the evidence-driven revision

**References:** Review & Creative §§9–13; Open-Source Project Organisation §1.3

**Run**

Re-check creative readiness first:

```bash
pnpm pactwright intelligence onboard
```

Then deliver the accepted correction:

```text
/capture-intent "<accepted Publication correction derived from the observed Pactwright Publication>"
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

After manual approval, publish the superseding Asset:

```bash
pnpm pactwright creative approve-asset <evidence-id>
pnpm pactwright creative record-publication <asset-id> <channel>
pnpm pactwright creative validate
```

Also publish a concise Publication-feedback guide/example grounded in this real loop.

**Expected result**

Pactwright has improved an actual piece of public content from production evidence, with the complete graph lineage retained.

**Verify before continuing**

Trace:

```text
original Publication
→ Observation
→ PI Source / accepted meaning
→ candidate
→ Intent
→ Evidence
→ superseding Asset
→ new Publication
```

## Stage 6 — Release `0.0.7`

### Step 13 — Prepare, publish and tag `0.0.7`

**References:** Distribution §§2, 4, 6–8, 15, 18–19

**Run**

Update `CHANGELOG.md` from accepted Checkpoint 7 Evidence only, then create the release PR:

```bash
VERSION=0.0.7
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

Tag the accepted merge commit:

```bash
git tag -a "v$VERSION" -m "v$VERSION"
git push origin "v$VERSION"
```

**Expected result**

The tag-triggered trusted `release.yml` workflow verifies the exact merged source and publishes every still-unpublished package in the `0.0.7` family under `next`. Existing published members are not overwritten.

**Verify before continuing**

Confirm the `release.yml` run for `v0.0.7` succeeded, then:

```bash
pnpm view pactwright@0.0.7 version
pnpm view @pactwright/standard@0.0.7 version
pnpm view @pactwright/project-intelligence@0.0.7 version
pnpm view @pactwright/review-creative@0.0.7 version
pnpm view @pactwright/creative@0.0.7 version
pnpm view @pactwright/operations@0.0.7 version
```

Every command must return `0.0.7`. Packages already configured for trusted publishing must show npm provenance/trusted-publisher metadata; any package bootstrapped in this step is trusted for its next release.


## Stage 7 — Prove Publication feedback on Kakeido

Run this stage from the Kakeido repository root unless a step explicitly says otherwise.

Use a real Kakeido marketing/publication surface.

### Step 14 — Upgrade Review & Creative and Operations

**References:** Distribution §15

**Run**

```bash
pnpm add -D \
  pactwright@0.0.7 \
  @pactwright/project-intelligence@0.0.7 \
  @pactwright/review-creative@0.0.7 \
  @pactwright/creative@0.0.7 \
  @pactwright/operations@0.0.7

pnpm pactwright extension upgrade project-intelligence
pnpm pactwright agent-pack use @pactwright/creative
pnpm pactwright extension upgrade review-creative
pnpm pactwright extension upgrade operations
pnpm pactwright sync
pnpm pactwright creative validate
pnpm pactwright operations validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

**Expected result**

Kakeido has compatible sibling extension versions.

**Verify before continuing**

Run core/PI/creative/operations validation.

### Step 15 — Observe a real Kakeido Publication

**References:** Publication ownership/exposure declaration §13; Generic production exposure/Observation §§11–15

**Run**

```bash
pnpm pactwright operations ingest <publication-source-id>
pnpm pactwright operations observe <publication-source-id>
pnpm pactwright operations validate
pnpm pactwright intelligence triage <internal-source-id>
```

**Expected result**

Kakeido Publication outcome enters PI through Operations without altering the published Asset.

**Verify before continuing**

Inspect Asset/Publication hashes before/after and route any required promotion through normal PI commands.

## Exit gate

At least one real Pactwright Publication and one real Kakeido Publication are observed by Operations; Review & Creative remains valid without Operations; Operations references but never mutates Publications; dependency graph still has only PI as the shared dependency.

---

**Pactwright — Checkpoint 7 — Published-Work Feedback v8**