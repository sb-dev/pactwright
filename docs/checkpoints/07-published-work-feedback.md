# Pactwright — Checkpoint 7 — Published-Work Feedback

**Version:** 9
**Release:** `0.0.7`
**Entry condition:** Checkpoint 6 is accepted.
**Exit capability:** Operations can observe Review & Creative Publications through manifest-driven exposure compatibility without ownership transfer or sibling dependency, and the public product closes its first evidence-driven Publication revision.

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
- [Pactwright — Implementation Guide](./00-implementation-guide.md)
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

- **Publication ownership/exposure declaration** — Pactwright — Graph Review & Creative Delivery Engineering Spec §§1–4, 9–13, 21
- **Generic production exposure/Observation** — Pactwright — Operations Graph Engineering Spec §§2, 6, 8–15, 21–22, 25–26
- **Sibling dependency model** — Pactwright — Distribution, Agents and Evaluation §§4–6, 14–15
- **Cross-extension GitHub integration** — Pactwright — GitHub Actions and Views §§3–4, 7–8, 23–24, 26–27
- **Release engineering** — Pactwright — Implementation Guide (npm release model)
- **Public-product progression and creative readiness** — Pactwright Open-Source Project Organisation §§1.2–1.3
- **Milestone acceptance and feedback capture** — Pactwright — Implementation Principles §§7, 14–15
- **Project Intelligence routing** — Pactwright — Project Intelligence Graph Engineering Spec §§8, 11–14

## 5. Out of scope for Checkpoint 7

Deliberately deferred; do not implement in this checkpoint:

- publication-performance-aware creative workflows and publication-specific operational context (Review & Creative §25 future improvements);
- performance semantics inside Asset or Publication records;
- governed Kakeido corrective delivery beyond Observation → Project Intelligence triage — Checkpoint 8 operates the full project surface;
- new observability vendors or Pactwright-owned telemetry infrastructure.

## Stage 1 — Implement manifest-driven exposure compatibility

Let sibling extensions integrate by contract, not hard-coded dependency.

### Step 1 — Declare Publication as an Operations-compatible exposure

**References:** Publication ownership/exposure declaration §§4, 21 (rules 16–17)

**Run**

```text
Add operations.exposure_types: [publication] to the Review & Creative manifest as defined by the spec. This declaration must be inert when Operations is disabled and must not introduce an Operations dependency.
```

**Expected result**

Review & Creative advertises compatible exposure semantics without depending on Operations.

**Verify before continuing**

Run manifest/dependency tests with Review & Creative enabled alone. Extension validation must confirm the declared exposure type is owned by Review & Creative and resolves to a valid canonical node type, and that no Operations-owned state enters Review & Creative storage.

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

**References:** Generic production exposure/Observation §§6, 11, 22

**Run**

```text
Extend Operations validation so observes edges target only registered operational exposure types. When the target is Publication, reference the existing Review & Creative record; never copy/rewrite it into Operations storage.
```

**Expected result**

Cross-extension edges preserve canonical ownership.

**Verify before continuing**

Run valid Publication target, disabled-extension target and unregistered-type fixtures.

### Step 4 — Add publication-analysis evaluation cases

**References:** Generic production exposure/Observation §§21, 26; Implementation Principles §15

**Run**

```text
Extend the operations-analysis evaluation suite with publication-observation cases: channel-performance interpretation against a baseline, unsupported causal claims about creative performance, positive publication finding recognition, and duplicate publication finding handling. Keep deterministic assertions (evidence references exist, no raw analytics persisted, valid Observation schema, valid exposure relationship) separate from semantic judgement; do not collapse results into one aggregate score.
```

**Expected result**

The new cross-extension analysis capability is covered by evaluation before it is used on real work.

**Verify before continuing**

Run `pnpm pactwright eval` and confirm the new cases execute with their deterministic assertions enforced.

## Stage 2 — Add cross-extension automation composition

Trigger Operations from Publication changes while keeping workflow ownership clear.

### Step 5 — Compose Publication paths/events into the Operations workflow

**References:** Cross-extension GitHub integration §§3–4, 7–8

**Run**

```text
Update GitHub desired-state/profile composition so, when both extensions are enabled, Publication changes can contribute trigger/path requirements to .github/workflows/pactwright-operations.yml. Keep Operations automation owned by the Operations workflow; do not add production analysis to Review & Creative semantics.
```

**Expected result**

Cross-extension automation composes from profiles without a new sibling dependency.

**Verify before continuing**

Run `pactwright sync` and `github sync --dry-run` with Review-only, Operations-only and both-enabled fixtures.

### Step 6 — Regenerate and apply Pactwright repository integration

**References:** Sibling dependency model — Distribution §8; Cross-extension GitHub integration §§3–4

**Run**

```bash
pnpm build
pnpm pactwright sync
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

**Expected result**

The Pactwright repository's managed workflows reflect the composed profiles: `pactwright-operations.yml` now includes the Publication-contributed trigger paths.

**Verify before continuing**

Inspect git diff; only Pactwright-managed files/regions may change, and the Operations workflow contains the composed publication paths.

## Stage 3 — Prove Publication feedback on Pactwright

Run this stage from the Pactwright repository root using the repository-local CLI built in Stage 2. Do not install the unreleased `0.0.7` packages; the `0.0.7` family is published in Stage 6.

Observe a real public Pactwright output.

### Step 7 — Select or record a real Pactwright Publication

**References:** Publication ownership/exposure declaration §13

**Run**

Resolve the target Publication from existing canonical Review & Creative records:

```bash
pnpm pactwright creative validate
```

Inspect `docs/review-creative/publications/` and `docs/review-creative/assets/`, select an existing approved public Publication (for example the grounded public Asset published in Checkpoint 5), and print its `<publication-id>` and `<asset-id>` for later steps.

Only if no suitable Publication exists, record one from an existing approved Asset:

```bash
# only when no suitable Publication exists
pnpm pactwright creative record-publication <asset-id> <channel>
pnpm pactwright creative validate
```

**Expected result**

A canonical Publication exists for a real Pactwright public surface, and its ids are printed.

**Verify before continuing**

Inspect the Publication's Asset/hash/channel/locator.

### Step 8 — Configure a publication evidence source

**References:** Generic production exposure/Observation §§8–11

**Run**

```text
Create the minimum Operations source configuration needed to observe the selected Pactwright Publication through an existing analytics/evidence system. Store only configuration/provenance. Do not commit credentials or raw analytics events. Print the resulting <publication-source-id> for later steps. Run operations validate.
```

**Expected result**

Operations can collect bounded evidence about the Publication, and `<publication-source-id>` is printed.

**Verify before continuing**

Run `pnpm pactwright operations validate` and inspect committed config.

### Step 9 — Create/route a Pactwright Publication Observation

**References:** Generic production exposure/Observation §§11–13; Project Intelligence routing §§8, 14

**Run**

```bash
pnpm pactwright operations ingest <publication-source-id>
pnpm pactwright operations observe <publication-source-id>
pnpm pactwright operations validate
pnpm pactwright intelligence triage <internal-source-id>
```

`observe` performs the Project Intelligence hand-off through normal Source ingestion and must print the resulting `<internal-source-id>`.

**Expected result**

Real publication performance/failure becomes an Operations Observation then PI Source, and the Source is triaged.

**Verify before continuing**

Trace the Observation to the exact Publication id/hash and confirm no Asset/Publication mutation occurred. Promotion and roadmap derivation are deferred to Stage 5.

### Step 10 — Verify cross-extension GitHub checks and views

**References:** Cross-extension GitHub integration §§23–24

**Run**

```text
With the Stage 3 Observation recorded, inspect the projected GitHub surfaces: the Pactwright / Publication check on the relevant publication change, the shared Project's Publications view showing the linked operational Observation, and the Operations checks/views including corrective-intent-roadmap freshness classification.
```

**Expected result**

GitHub projects the cross-extension state without owning it.

**Verify before continuing**

The Publications view shows the Observation link for the observed Publication; Operations views distinguish execution failure from invalid canonical state; no GitHub metadata is treated as canonical Publication or Observation truth.

## Stage 4 — Prove ownership and disablement

Demonstrate the sibling extensions remain independent.

### Step 11 — Prove Review & Creative works without Operations

**References:** Publication ownership/exposure declaration §§1–4, 13

**Run**

```text
In a fixture, enable Review & Creative + PI but not Operations. Create/validate an Asset and Publication. Confirm all Review & Creative semantics remain valid and no Operations command/state is required.
```

**Expected result**

Publication semantics do not depend on Operations.

**Verify before continuing**

Run Review & Creative validation with Operations disabled.

### Step 12 — Prove Operations cannot mutate Publication

**References:** Generic production exposure/Observation §25

**Run**

```text
In a fixture with both extensions enabled, create a valid Publication and Observation targeting it. Attempt an Operations-side mutation/copy of Publication state and prove it is rejected; compare Publication bytes/hash before and after.
```

**Expected result**

Observation references but never owns Publication.

**Verify before continuing**

Record before/after Publication hash and `operations validate` result.

### Step 13 — Prove disabling Operations leaves Publications valid

**References:** Generic production exposure/Observation §2; Sibling dependency model — Distribution §14

**Run**

```text
In a fixture with both extensions, create Publication + Observation, then disable/remove Operations according to Distribution ownership rules. Confirm existing Asset/Publication/Delivery records remain semantically valid and only Operations-owned integration is removed.
```

**Expected result**

Removing Operations does not reinterpret Review & Creative truth.

**Verify before continuing**

Run `creative validate` after Operations disable/removal. Confirm reconciliation removed only Operations-owned workflows/views/fields/checks/labels and retained Project Intelligence integration required by Review & Creative.

## Stage 5 — Improve a real Pactwright Publication from evidence

This is the first checkpoint where the public product itself must close the production-feedback loop.

### Step 14 — Derive a public-content correction from Publication evidence

**References:** Generic production exposure/Observation §§13–15; Project Intelligence routing §§8, 11–14; Open-Source Project Organisation §1.3

**Run**

Continue from the triaged Source produced in Step 9:

```bash
# only when triage requires reviewed promotion and the proposal is accepted
pnpm pactwright intelligence promote <internal-source-id>

pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright operations corrective-roadmap
```

Select an accepted content/positioning/usability correction only if the evidence supports one.

**Expected result**

A public-content improvement is proposed by the same governed Observation → PI candidate model as software corrections.

**Verify before continuing**

The candidate traces to the exact Publication and supporting operational evidence; unsupported causal claims are absent.

### Step 15 — Publish the evidence-driven revision

**References:** Publication ownership/exposure declaration §§9–13; Open-Source Project Organisation §§1.2–1.3

**Run**

Re-check creative readiness first and require the `identity`, `content` and `product` domains to be Covered for this work; fill any missing coverage through the established PI gap loop before continuing:

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

Approve the revised output and publish the superseding Asset, recording the `supersedes` relation from the new Asset to the original Asset through Pactwright's graph-mutation responsibility:

```bash
pnpm pactwright creative approve-asset <evidence-id>
pnpm pactwright creative record-publication <asset-id> <channel>
pnpm pactwright creative validate
```

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
→ superseding Asset (supersedes → original Asset)
→ new Publication
```

`creative validate` must confirm the `supersedes` edge and that the superseded Asset remains immutable.

### Step 16 — Deliver the Publication-feedback guide

**References:** Publication ownership/exposure declaration §§9–13; Open-Source Project Organisation §§1.2–1.3

**Run**

Deliver the §1.3 milestone content through the normal lifecycle, grounded in the real loop just completed:

```text
/capture-intent "Publish Pactwright's Publication-feedback guide: a concise guide and example showing how a real Publication was observed by Operations and revised from production evidence, grounded in accepted Project Intelligence and the actual Checkpoint 7 lineage."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

For the public-facing portion, approve and publish through Creative Delivery.

**Expected result**

Publication feedback is understandable from the public surfaces and the material is grounded in accepted project truth.

**Verify before continuing**

Technical claims match the implemented cross-extension boundary; public narrative has valid identity/product grounding and, where published as an Asset, canonical Publication lineage.

## Stage 6 — Release `0.0.7`

### Step 17 — Prepare, publish and tag `0.0.7`

**References:** Implementation Guide — npm release model; Sibling dependency model — Distribution §6

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

Every command must return `0.0.7`, and every package must show npm provenance/trusted-publisher metadata. No new packages are introduced at `0.0.7`; this is the first trusted OIDC release for `@pactwright/operations`, bootstrapped in Checkpoint 6.

## Stage 7 — Prove Publication feedback on Kakeido

Run this stage from the Kakeido repository root unless a step explicitly says otherwise.

Use a real Kakeido marketing/publication surface.

### Step 18 — Upgrade Review & Creative, Operations and the agent pack

**References:** Sibling dependency model — Distribution §15

**Run**

```bash
pnpm add -D \
  pactwright@0.0.7 \
  @pactwright/project-intelligence@0.0.7 \
  @pactwright/review-creative@0.0.7 \
  @pactwright/creative@0.0.7 \
  @pactwright/operations@0.0.7
pnpm install --frozen-lockfile

pnpm pactwright extension upgrade project-intelligence
pnpm pactwright extension upgrade review-creative
pnpm pactwright extension upgrade operations
pnpm pactwright upgrade
pnpm pactwright sync
pnpm pactwright creative validate
pnpm pactwright operations validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

`pactwright upgrade` upgrades the already configured `@pactwright/creative` agent pack; pack selection does not change in this checkpoint.

**Expected result**

Kakeido has compatible sibling extension versions and an upgraded configured agent pack.

**Verify before continuing**

Run core/PI/creative/operations validation.

### Step 19 — Select or record a real Kakeido Publication

**References:** Publication ownership/exposure declaration §13

**Run**

Resolve the target Publication from Kakeido's canonical Review & Creative records:

```bash
pnpm pactwright creative validate
```

Inspect `docs/review-creative/publications/` and `docs/review-creative/assets/`, select an existing approved Kakeido marketing Publication (for example the real Kakeido public asset published in Checkpoint 5), and print its `<publication-id>` and `<asset-id>`.

Only if no suitable Publication exists, record one from an existing approved Asset:

```bash
# only when no suitable Publication exists
pnpm pactwright creative record-publication <asset-id> <channel>
pnpm pactwright creative validate
```

**Expected result**

A canonical Publication exists for a real Kakeido marketing surface, and its ids are printed.

**Verify before continuing**

Inspect the Publication's Asset/hash/channel/locator.

### Step 20 — Configure a Kakeido publication evidence source

**References:** Generic production exposure/Observation §§8–11

**Run**

```text
Create the minimum Kakeido Operations source configuration needed to observe the selected Publication through an analytics/evidence system already adopted by the Kakeido marketing surface. Do not add a new observability vendor, commit credentials or persist raw analytics events. Print the resulting <publication-source-id>. Run operations validate.
```

**Expected result**

Kakeido Operations can collect bounded evidence about the Publication, and `<publication-source-id>` is printed.

**Verify before continuing**

Run `pnpm pactwright operations validate` and inspect committed config.

### Step 21 — Observe the Kakeido Publication

**References:** Publication ownership/exposure declaration §13; Generic production exposure/Observation §§11–15

**Run**

```bash
pnpm pactwright operations ingest <publication-source-id>
pnpm pactwright operations observe <publication-source-id>
pnpm pactwright operations validate
pnpm pactwright intelligence triage <internal-source-id>
```

`observe` performs the Project Intelligence hand-off and must print the resulting `<internal-source-id>`.

**Expected result**

Kakeido Publication outcome enters PI through Operations without altering the published Asset.

**Verify before continuing**

Inspect Asset/Publication hashes before/after and route any required promotion through normal PI commands. Governed corrective delivery on Kakeido is out of scope for this checkpoint (§5).

## Stage 8 — Capture implementation feedback

Real use of the checkpoint must create evidence about Pactwright itself.

### Step 22 — Capture Checkpoint 7 findings as Project Intelligence Sources

**References:** Implementation Principles §§7, 14; Project Intelligence routing §8

**Run**

Capture the durable findings from implementing and installing this checkpoint — cross-extension defects, spec gaps, evaluation misses and installation friction from both repositories — and route each through normal ingestion. From the Pactwright repository root:

```bash
pnpm pactwright intelligence ingest <finding-path>
pnpm pactwright intelligence triage <source-id>
```

Repeat per finding. For each, ask per Implementation Principles §14 whether it is a Kakeido-specific choice or evidence that a Pactwright responsibility failed; only repeatable responsibility failures become evaluation or product candidates.

**Expected result**

Problems found during installation and use become governed future project work rather than untracked memory.

**Verify before continuing**

Each captured finding exists as a Source with a triage outcome, and justified candidates appear through normal intent-candidate derivation.

## Exit gate

Manifest-driven exposure compatibility is generic — a fixture second exposure type requires no Operations engine change — and publication-analysis evaluation cases run with deterministic assertions. Cross-extension automation composes from profiles and is applied on the Pactwright repository, with GitHub checks/views projecting Publications and their linked Observations without owning them. At least one real Pactwright Publication and one real Kakeido Publication are observed by Operations; Review & Creative remains valid without Operations; Operations references but never mutates Publications; disabling/removing Operations preserves Publication validity and reconciles only Operations-owned GitHub objects. A real Pactwright Publication is revised from production evidence with complete lineage including Asset supersession, and the Publication-feedback guide is published through the normal lifecycle. The `0.0.7` family is published under `next` with provenance for all six packages. Implementation and installation findings are captured as Project Intelligence Sources. The dependency graph still has only PI as the shared dependency.

---

**Pactwright — Checkpoint 7 — Published-Work Feedback v9**
