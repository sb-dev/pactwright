# Pactwright — Checkpoint 7 — Published-Work Feedback

**Version:** 10  
**Release:** `0.0.7`  
**Entry condition:** Checkpoint 6 is accepted.  
**Exit capability:** Operations can observe Review & Creative Publications through manifest-driven exposure compatibility without ownership transfer or sibling dependency, while publication evidence remains bounded/external and evidence-driven revisions create new superseding Assets rather than mutating published truth.

## 1. Goal

Complete the cross-extension Publication → Observation loop and prove it on real Pactwright and Kakeibo Publications.

For Kakeibo, publication feedback must preserve the v2 trust boundary: analytics/evidence remains external and purpose-separated; financial/product behaviour never becomes marketing telemetry; Kei claims remain traceable to the exact public behavioural/evaluation sources current when the Asset was approved; and later production or Experiment evidence can motivate a new Asset but can never rewrite the previously approved one.

## 2. Specification baseline

### Pactwright

- [Pactwright — Delivery Graph and Lifecycle Engineering Spec](../research-logs/2026-08-11-pactwright-delivery-graph-and-lifecycle-engineering-spec.md)
- [Pactwright — Distribution, Agents and Evaluation](../research-logs/2026-08-11-pactwright-distribution-agents-and-evaluation.md)
- [Pactwright — GitHub Actions and Views](../research-logs/2026-08-11-pactwright-github-actions-and-views.md)
- [Pactwright — Project Intelligence Graph Engineering Spec](../research-logs/2026-08-11-pactwright-project-intelligence-graph-engineering-spec.md)
- [Pactwright — Graph Review & Creative Delivery Engineering Spec](../research-logs/2026-08-11-pactwright-graph-review-and-creative-delivery-engineering-spec.md)
- [Pactwright — Operations Graph Engineering Spec](../research-logs/2026-08-11-pactwright-operations-graph-engineering-spec.md)
- [Pactwright — Operations Experiment Semantics](../research-logs/2026-09-02-pactwright-operations-experiment-semantics.md)
- [Pactwright — System Architecture](../research-logs/2026-08-11-pactwright-system-architecture.md)
- [Pactwright — Implementation Principles](./00-implementation-principles.md)
- [Pactwright — Implementation Guide](./00-implementation-guide.md)
- [Pactwright Open-Source Project Organisation](../research-logs/2026-08-11-pactwright-open-source-project-organisation.md)
- [Design Specification: Astro + Cloudflare Workers + Meta CAPI](../research-logs/2026-08-11-astro-design-spec.md)
- [Kakeibo System-Level Acceptance Profile](./00-kakeibo-acceptance-profile.md)

### Kakeibo

At execution time use the current canonical Kakeibo authorities relevant to public claims, analytics and production evidence:

```text
docs/specs/README.md

docs/specs/01-product-and-ux-spec.md
docs/specs/03-kei-assistant-spec.md
docs/specs/05-system-architecture-and-data-spec.md
docs/specs/06-engineering-delivery-and-operations-spec.md
docs/specs/07-open-source-project-organisation-spec.md
```

When a Publication makes financial-domain claims, include current `02-financial-domain-model-spec.md` as supporting authority.

Preserve this Kakeibo ownership split:

```text
01 → product/commercial/public UX semantics
02 → financial truth where the publication makes financial claims
03 → Kei behaviour / authority / task meaning
05 → runtime/data/analytics/privacy architecture
06 → evaluation/release/production evidence practice
07 → public/private and open-source transparency
```

`00-kakeibo-acceptance-profile.md` §11 is the shared System-Level Acceptance cross-check for the Kakeibo proof.

The retained August Kakeido snapshots are not implementation authority.

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

**Default execution location:** the Pactwright repository root unless the step explicitly names Kakeibo or a fixture.

For repository/code changes, finish with `pnpm verify`. Before invoking a newly implemented Pactwright runtime command during implementation, run `pnpm build` so the repository-local CLI is not using stale distribution output.

After Checkpoint 2 activates GitHub, land coherent repository changes through pull requests and required checks rather than direct default-branch commits.

Dynamic ids such as `<source-id>`, `<brief-id>`, `<evidence-id>`, `<publication-id>`, `<asset-id>` and `<internal-source-id>` must come from an earlier command in the runbook. Commands that create or resolve durable records must print the ids required by later steps.

Fixture verification means repository test fixtures unless a step explicitly creates a real repository or GitHub resource.

## 4. Checkpoint specification map

- **Publication ownership/exposure declaration** — Pactwright — Graph Review & Creative Delivery Engineering Spec §§1–4, 9–13, 21
- **Generic production exposure/Observation** — Pactwright — Operations Graph Engineering Spec §§2, 6, 8–15, 21–22, 25–26
- **Experiment evidence as later motivation only** — Operations Experiment Semantics §§9, 14
- **Sibling dependency model** — Pactwright — Distribution, Agents and Evaluation §§4–6, 14–15
- **Cross-extension GitHub integration** — Pactwright — GitHub Actions and Views §§3–4, 7–8, 23–24, 26–27
- **Release engineering** — Pactwright — Implementation Guide (npm release model)
- **Public-product progression and creative readiness** — Pactwright Open-Source Project Organisation §§1.2–1.3
- **Milestone acceptance and feedback capture** — Pactwright — Implementation Principles §§7, 14–15
- **Project Intelligence routing** — Pactwright — Project Intelligence Graph Engineering Spec §§8, 11–14
- **Kakeibo public/product claims** — current Kakeibo `01`, plus `02` where financial truth is claimed
- **Kakeibo Kei public claim grounding** — current Kakeibo `03`, `05`, `06`, `07`
- **Kakeibo analytics/privacy boundary** — current Kakeibo `05`, `06`, `07`
- **Kakeibo System-Level Acceptance** — Kakeibo Acceptance Profile §11

## 5. Out of scope for Checkpoint 7

Deliberately deferred; do not implement in this checkpoint:

- publication-performance-aware creative workflows and publication-specific operational context beyond the existing Operations → PI hand-off;
- performance semantics inside Asset or Publication records;
- mutation of an already approved Asset/Publication because later evidence changed;
- Kakeibo production analytics as Pactwright canonical graph state;
- new analytics/observability vendors or Pactwright-owned telemetry infrastructure;
- governed Kakeibo corrective Delivery beyond Observation → PI triage; Checkpoint 8 operates the complete project surface;
- changes to the native Operations `Experiment` schema introduced in Checkpoint 6;
- dedicated Experiment Project views, which remain Checkpoint 8 work.

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
Implement Operations resolution of compatible exposure types from enabled extension manifests. Do not hard-code Publication or any future extension type. Require enough durable identity for exact exposure reference. Preserve native Operations exposures — Deployment and Experiment — alongside compatible sibling exposure types.
```

**Expected result**

Operations can consume registered exposure types generically without changing ownership of native or sibling records.

**Verify before continuing**

Add a fixture extension contributing a second exposure type and prove no Operations engine code change is needed. Confirm Deployment and Experiment remain valid native Operations exposures.

### Step 3 — Validate Observation targets against the registered exposure registry

**References:** Generic production exposure/Observation §§6, 11, 22

**Run**

```text
Extend Operations validation so observes edges target only registered operational exposure types. When the target is Publication, reference the existing Review & Creative record by exact id/hash; never copy, rewrite or enrich Publication state inside Operations storage.
```

**Expected result**

Cross-extension edges preserve canonical ownership.

**Verify before continuing**

Run valid Publication target, disabled-extension target and unregistered-type fixtures. Compare Publication hash before/after Observation creation.

### Step 4 — Add publication-analysis evaluation cases

**References:** Generic production exposure/Observation §§21, 26; Implementation Principles §15

**Run**

```text
Extend the operations-analysis evaluation suite with publication-observation cases covering:
- channel-performance interpretation against a baseline;
- unsupported causal claims about creative performance;
- positive publication finding recognition;
- neutral/insufficient-evidence outcomes;
- duplicate publication finding handling;
- bot/noise filtering being respected when the configured evidence source provides filtered evidence;
- Observation evidence references remaining bounded while raw analytics rows stay external;
- publication outcome never mutating the Asset/Publication;
- Experiment/production evidence being treated as motivation for future governed work, not as permission to edit the existing Asset.

Keep deterministic assertions separate from semantic judgement and do not collapse results into one aggregate score.
```

**Expected result**

The cross-extension analysis capability is covered by evaluation before it is used on real work.

**Verify before continuing**

Run `pnpm pactwright eval` and confirm deterministic assertions enforce exact exposure relationships, no raw-event graph persistence and immutable Asset/Publication state.

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

The Pactwright repository's managed workflows reflect the composed profiles: `pactwright-operations.yml` includes Publication-contributed trigger paths while preserving Deployment/Experiment Operations behaviour.

**Verify before continuing**

Inspect git diff; only Pactwright-managed files/regions may change, and no Publication ownership/state is duplicated into Operations files.

## Stage 3 — Prove Publication feedback on Pactwright

Run this stage from the Pactwright repository root using the repository-local CLI built in Stage 2. Do not install unreleased `0.0.7` packages; the family is published in Stage 6.

### Step 7 — Select or record a real Pactwright Publication

**References:** Publication ownership/exposure declaration §13

**Run**

```bash
pnpm pactwright creative validate
```

Inspect `docs/review-creative/publications/` and `docs/review-creative/assets/`, select an existing approved public Publication and print its `<publication-id>` and `<asset-id>`.

Only if no suitable Publication exists:

```bash
pnpm pactwright creative record-publication <asset-id> <channel>
pnpm pactwright creative validate
```

**Expected result**

A canonical Publication exists for a real Pactwright public surface.

**Verify before continuing**

Inspect exact Publication id/hash, Asset id/hash, channel and locator.

### Step 8 — Configure a bounded publication evidence source

**References:** Generic production exposure/Observation §§8–11

**Run**

```text
Create the minimum Operations source configuration needed to observe the selected Pactwright Publication through an analytics/evidence system already adopted by that public surface. Prefer bounded aggregated/filtered evidence and stable locators rather than raw visitor events. Store only configuration/provenance; do not commit credentials or raw analytics payloads. Where bot filtering or equivalent source-quality filtering exists, preserve it rather than asking Operations to infer human traffic from unfiltered raw events. Print <publication-source-id> and run operations validate.
```

**Expected result**

Operations can collect bounded evidence about the Publication without becoming the analytics store.

**Verify before continuing**

Run `pnpm pactwright operations validate`; inspect configuration and one collection execution for raw-event leakage.

### Step 9 — Create/route a Pactwright Publication Observation

**References:** Generic production exposure/Observation §§11–13; Project Intelligence routing §§8, 14

**Run**

```bash
pnpm pactwright operations ingest <publication-source-id>
pnpm pactwright operations observe <publication-source-id>
pnpm pactwright operations validate
pnpm pactwright intelligence triage <internal-source-id>
```

`observe` performs PI hand-off through normal Source ingestion and prints `<internal-source-id>` when a durable Observation exists.

**Expected result**

Real publication evidence becomes an Operations Observation then PI Source without changing the publication itself.

**Verify before continuing**

Trace Observation → exact Publication id/hash → bounded evidence locator/window. Compare original Asset/Publication hashes before/after. Promotion and roadmap derivation are deferred to Stage 5.

### Step 10 — Verify cross-extension GitHub checks and views

**References:** Cross-extension GitHub integration §§23–24

**Run**

```text
With the Stage 3 Observation recorded, inspect the projected GitHub surfaces: Publication checks, the shared Publications projection showing linked operational Observation, and Operations checks/views including corrective-roadmap freshness. GitHub must show relationships and derived state without copying analytics payloads or becoming canonical Publication/Observation truth.
```

**Expected result**

GitHub projects the cross-extension state without owning it.

**Verify before continuing**

The Publication projection links the Observation; Operations surfaces distinguish execution failure from invalid canonical state; no raw analytics data is projected.

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

### Step 12 — Prove Operations cannot mutate Publication or Asset

**References:** Generic production exposure/Observation §25

**Run**

```text
In a fixture with both extensions enabled, create a valid Asset/Publication and Observation targeting the Publication. Attempt an Operations-side mutation/copy of Publication or Asset state and require rejection. Also simulate later production/Experiment evidence that contradicts or supersedes the published claim; Operations may create an Observation/PI Source but must not rewrite the approved bytes or grounding manifest.
```

**Expected result**

Operations references published truth but never owns or rewrites it.

**Verify before continuing**

Record Asset/Publication hashes before/after, run `creative validate` and `operations validate`, and confirm only new Operations/PI records were created.

### Step 13 — Prove disabling Operations leaves Publications valid

**References:** Generic production exposure/Observation §2; Sibling dependency model — Distribution §14

**Run**

```text
In a fixture with both extensions, create Publication + Observation, then disable/remove Operations according to Distribution ownership rules. Confirm existing Asset/Publication/Delivery records remain semantically valid and only Operations-owned integration is removed.
```

**Expected result**

Removing Operations does not reinterpret Review & Creative truth.

**Verify before continuing**

Run `creative validate` after Operations removal. Reconciliation removes only Operations-owned workflows/views/fields/checks/labels and retains PI integration required by Review & Creative.

## Stage 5 — Improve a real Pactwright Publication from evidence

This is the first checkpoint where the public product itself closes the publication-feedback loop.

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

Select an accepted content/positioning/usability correction only if the evidence supports one. A metric movement alone is not causal proof.

**Expected result**

A public-content improvement is proposed by the same governed Observation → PI candidate model as software corrections.

**Verify before continuing**

The candidate traces to the exact Publication/evidence window and contains no unsupported causal claim or automatic priority derived solely from significance/performance.

### Step 15 — Publish the evidence-driven revision as a superseding Asset

**References:** Publication ownership/exposure declaration §§9–13; Open-Source Project Organisation §§1.2–1.3

**Run**

Re-check creative readiness and require `identity`, `content` and `product` to be Covered:

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

After explicit human review/approval of the exact revised bytes:

```bash
pnpm pactwright creative approve-asset <evidence-id>
pnpm pactwright creative record-publication <new-asset-id> <channel>
pnpm pactwright creative validate
```

Record the valid `new Asset --supersedes--> original Asset` relation through Pactwright's graph-mutation responsibility.

**Expected result**

Pactwright improves real public content from evidence while historical approved/public truth remains immutable.

**Verify before continuing**

Trace:

```text
original Publication
→ Observation
→ PI Source / accepted meaning
→ candidate
→ Intent
→ Evidence
→ new Asset --supersedes--> original Asset
→ new Publication
```

Confirm the original Asset/Publication bytes and grounding remain unchanged.

### Step 16 — Deliver the Publication-feedback guide

**References:** Publication ownership/exposure declaration §§9–13; Open-Source Project Organisation §§1.2–1.3

**Run**

```text
/capture-intent "Publish Pactwright's Publication-feedback guide: a concise guide and example showing how a real Publication was observed by Operations and revised through PI/Delivery as a new superseding Asset. Explain that publication evidence remains external/bounded, Observation does not mutate published truth, and later revisions preserve complete lineage."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

For the public-facing portion, approve/publish through Creative Delivery.

**Expected result**

Publication feedback is understandable from public surfaces and grounded in the actual implemented loop.

**Verify before continuing**

Technical claims match cross-extension ownership and immutability rules.

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

The tag-triggered trusted `release.yml` workflow verifies the exact merged source and publishes every still-unpublished package in the `0.0.7` family under `next`.

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

Every command must return `0.0.7`, and every package must show npm provenance/trusted-publisher metadata. No new packages are introduced at `0.0.7`.

## Stage 7 — Prove Publication feedback on Kakeibo

Run this stage from the Kakeibo repository root unless a step explicitly says otherwise.

Use a real Kakeibo public/marketing Publication while preserving the financial-product privacy boundary.

### Step 18 — Upgrade Review & Creative, Operations and the agent pack

**References:** Sibling dependency model — Distribution §15; Kakeibo Acceptance Profile §11

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

**Expected result**

Kakeibo has compatible sibling extension versions and the configured agent pack remains selected/upgraded.

**Verify before continuing**

Run core/PI/creative/operations validation.

### Step 19 — Select a real Kakeibo Publication and verify claim grounding

**References:** Publication ownership/exposure declaration §13; current Kakeibo `01`, `03`, `05`, `06`, `07`; Kakeibo Acceptance Profile §11

**Run**

```bash
pnpm pactwright creative validate
```

Inspect `docs/review-creative/publications/` and `docs/review-creative/assets/`, select an existing approved Kakeibo public/marketing Publication and print `<publication-id>` and `<asset-id>`.

Prefer the Kei public Asset produced in Checkpoint 5 when available because it exercises the strongest trust boundary.

If the Asset makes Kei claims, verify its grounding manifest traces the approved claim to the exact public sources/repository state current when the Asset was approved:

```text
03 → behavioural/task/authority contract
05 → runtime/release/model-route architecture
06 → evaluation/release/production-practice claims
07 → public/private/open-source transparency
```

When the Asset makes financial-domain claims, also require exact relevant `02` grounding.

Only if no suitable Publication exists, record one from an already approved Asset:

```bash
pnpm pactwright creative record-publication <asset-id> <channel>
pnpm pactwright creative validate
```

**Expected result**

A canonical Kakeibo Publication exists and its public claims can be traced to the accepted sources that justified those claims when approved.

**Verify before continuing**

Inspect Publication/Asset hashes, grounding hashes, channel and locator. Do not update grounding merely because current project state has changed; historical approved grounding remains historical truth.

### Step 20 — Configure a privacy-safe Kakeibo publication evidence source

**References:** Generic production exposure/Observation §§8–11; current Kakeibo `05`, `06`, `07`; Kakeibo Acceptance Profile §11

**Run**

```text
Create the minimum Kakeibo Operations source configuration needed to observe the selected Publication through analytics/evidence already adopted by the public marketing surface.

Allowed evidence should prefer:
- Cloudflare Web Analytics for bounded public web traffic/engagement evidence where applicable;
- first-party Kakeibo marketing analytics stored in the separate Neon analytics boundary where applicable;
- other already adopted public-channel evidence only when it respects the same privacy/purpose boundary.

Apply source-side bot/noise filtering where available and retain only bounded evidence locators/aggregates needed by Operations.

Meta CAPI may contribute only consent-gated allowlisted marketing conversion evidence defined by Kakeibo's marketing boundary. Mobile/product financial behaviour, transaction/review/goal/import events, financial grounding and private Kei interaction data must never be sent to Meta or repurposed as publication marketing evidence.

Do not add a new analytics/observability vendor, commit credentials, copy raw analytics rows into Pactwright, or conflate:
financial domain state ≠ financial audit history ≠ product/marketing analytics ≠ operational telemetry.

Print `<publication-source-id>` and run operations validate.
```

**Expected result**

Kakeibo Operations can address bounded public-publication evidence without violating product/financial privacy boundaries.

**Verify before continuing**

Run `pnpm pactwright operations validate` and inspect the configured evidence path. Prove:

- raw analytics rows/events are not Project Graph nodes;
- first-party analytics remains in its analytics boundary rather than application financial state;
- Meta receives no mobile/product financial behaviour;
- consent is required for any configured Meta conversion evidence;
- bot/noise filtering is preserved where available;
- no private Kei production trace is copied into Pactwright.

### Step 21 — Observe the Kakeibo Publication without mutating published truth

**References:** Publication ownership/exposure declaration §13; Generic production exposure/Observation §§11–15; Experiment Semantics §§9, 14; Kakeibo Acceptance Profile §11

**Run**

```bash
pnpm pactwright operations ingest <publication-source-id>
pnpm pactwright operations observe <publication-source-id>
pnpm pactwright operations validate
```

If `observe` creates a durable Observation and corresponding PI Source, triage it:

```bash
pnpm pactwright intelligence triage <internal-source-id>
```

The evidence may include publication analytics and may be interpreted alongside already governed production/Experiment evidence where relevant, but the Publication Observation must remain grounded in bounded evidence and must not silently claim causality.

**Expected result**

A Kakeibo Publication outcome enters PI through Operations without altering the approved Asset, Publication or historical grounding.

**Verify before continuing**

Compare original Asset/Publication hashes and grounding before/after. Verify:

- Observation references the exact Publication id/hash;
- evidence remains external/bounded;
- no raw financial/product/Kei trace was persisted;
- a production/Experiment finding can motivate a future correction candidate but cannot rewrite the current Asset;
- any required PI promotion goes through normal commands;
- governed Kakeibo corrective Delivery remains deferred to Checkpoint 8.

## Stage 8 — Capture implementation feedback

Real use of the checkpoint must create evidence about Pactwright itself.

### Step 22 — Capture Checkpoint 7 findings as Project Intelligence Sources

**References:** Implementation Principles §§7, 14; Project Intelligence routing §8; Kakeibo Acceptance Profile §11

**Run**

Capture durable findings from implementing/installing this checkpoint — cross-extension defects, exposure-discovery gaps, analysis/evaluation misses, installation friction, analytics-boundary mistakes, privacy-risking defaults or unclear immutability semantics from either repository — and route each through normal ingestion:

```bash
pnpm pactwright intelligence ingest <finding-path>
pnpm pactwright intelligence triage <source-id>
```

For each finding distinguish Kakeibo-specific analytics/product choices from evidence that Pactwright's generic Publication/Operations responsibility failed. Only repeatable responsibility failures become generic product/evaluation candidates.

**Expected result**

Problems found during real use become governed future project work rather than untracked memory.

**Verify before continuing**

Each captured finding exists as a Source with a triage outcome, justified candidates appear through normal derivation, and no Kakeibo-specific analytics schema or privacy rule is promoted into generic Pactwright semantics unless independent evidence later justifies it.

## Exit gate

Checkpoint 7 is complete only when all of the following hold:

1. Manifest-driven exposure compatibility is generic: Review & Creative advertises Publication without depending on Operations, and a fixture second exposure type requires no Operations engine change.
2. Publication-targeting Observations reference exact Review & Creative records without copying/mutating Asset or Publication state.
3. Publication-analysis evaluation covers baseline interpretation, unsupported causality, positive/neutral/insufficient evidence, duplicate handling, bounded evidence, bot/noise filtering where supplied, immutable publication state and evidence-driven supersession rather than mutation.
4. Cross-extension automation composes from profiles and GitHub projects Publications/Observations without owning canonical state or raw analytics.
5. Review & Creative remains valid without Operations; disabling/removing Operations preserves Asset/Publication validity and removes only Operations-owned integration.
6. A real Pactwright Publication is observed, routed through PI and, where evidence supports correction, revised through normal Delivery as a new human-approved superseding Asset and new Publication while the original remains immutable.
7. The Publication-feedback guide is published from the real governed lineage.
8. `0.0.7` is published under `next` with provenance for all six packages.
9. A real Kakeibo Publication is observed using bounded external evidence from already adopted public analytics/evidence systems; raw analytics rows remain outside Pactwright.
10. Kakeibo preserves `financial domain state ≠ financial audit history ≠ product/marketing analytics ≠ operational telemetry`; first-party public/marketing analytics remain in the analytics boundary rather than becoming financial truth.
11. Kakeibo Meta CAPI usage, where present, is consent-gated and limited to allowlisted marketing conversions; mobile/product financial behaviour and private Kei interaction data never flow to Meta.
12. A Kakeibo Publication making Kei claims remains traceable to the exact public `03/05/06/07` behavioural/runtime/evaluation/transparency sources current at approval; historical grounding is not rewritten when later project state changes.
13. Kakeibo production/Experiment evidence may motivate PI candidates or a later superseding Asset but cannot mutate the previously approved Asset/Publication; governed Kakeibo corrective Delivery remains Checkpoint 8 work.
14. Checkpoint implementation/installation findings are captured as Project Intelligence Sources without leaking Kakeibo-specific analytics/privacy implementation details into generic Pactwright semantics.
15. The sibling dependency graph still has PI as the shared dependency; Publication ownership remains Review & Creative and production evidence ownership remains Operations/external systems according to their established boundaries.

---

**Pactwright — Checkpoint 7 — Published-Work Feedback v10**
