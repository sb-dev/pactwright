# Pactwright — Checkpoint 6 — Production Learning

**Version:** 11 
**Entry condition:** Checkpoint 5 is accepted. 
**Release:** `0.0.6` 
**Exit capability:** Software production exposure and durable operational findings feed governed future work through Operations → PI → Delivery.

## 1. Goal

Implement Operations for software exposure first, use the Pactwright website as the first self-hosted production surface, then prove the same feedback path on Kakeido.

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

Dynamic ids such as `<source-id>`, `<brief-id>` and `<evidence-id>` must come from an earlier command in the runbook, or from configuration this runbook explicitly creates (a `<source-id>` is the `id` field of a source configured by an earlier step). Commands that create or resolve durable records must print the ids required by later steps.

Fixture verification means repository test fixtures unless a step explicitly creates a real repository or GitHub resource.

## 4. Checkpoint specification map

- **Operations boundary/exposure/deployment** — Pactwright — Operations Graph Engineering Spec §§1–7
- **Sources/execution/Observation** — Pactwright — Operations Graph Engineering Spec §§8–12
- **PI hand-off/corrective roadmap/context/commands** — Pactwright — Operations Graph Engineering Spec §§13–20
- **Evaluation/validation/failure/GitHub/build order** — Pactwright — Operations Graph Engineering Spec §§21–27
- **Project Intelligence** — Pactwright — Project Intelligence Graph Engineering Spec §§8, 11, 14
- **Distribution** — Pactwright — Distribution, Agents and Evaluation §§4–8, 15–16, 18
- **GitHub** — Pactwright — GitHub Actions and Views §§4, 8, 15, 24
- **Open-Source Project Organisation** — Pactwright Open-Source Project Organisation §§1.2–1.3
- **Release model** — Pactwright — Implementation Guide (npm release model, trusted release workflow, release failure rules)
- **Implementation Principles** — Pactwright — Implementation Principles §§7, 14
- **Website spec** — Design Specification: Astro + Cloudflare Workers + Meta CAPI
- **Kakeido evidence sources/privacy/delivery** — Kakeido — Tech Stack Engineering Spec §11, §13, §§17–18

### Out of scope in this checkpoint

The following Operations capabilities are intentionally deferred to Checkpoint 7 — Published-Work Feedback and must not be implemented here:

- generic exposure-type registration and manifest-driven exposure discovery (Operations Graph Engineering Spec §6);
- Publication as a registered operational exposure and Publication Observations (Operations Graph Engineering Spec §25; build order item 6);
- cross-extension composition of Publication paths and events into `pactwright-operations.yml` (GitHub Actions and Views §4).

In this checkpoint the only registered operational exposure type is `deployment`. Validation of `observes` targets (Operations Graph Engineering Spec §22 rule 8) is scoped to that registry, and the deferred registration mechanism must not be pre-built.

## Stage 1 — Package Operations and implement Deployment

Record which delivered software actually reached an environment.

### Step 1 — Implement Operations manifest/layout/dependency

**References:** Operations boundary/exposure/deployment §§4–5; Distribution §§4–5

**Run**

```text
Create `@pactwright/operations` as a publishable workspace package and implement its manifest and repository layout: require Project Intelligence, register Deployment/Observation, deployed-as/observes, operations namespace, operations-analysis capability and Operations GitHub profile. Do not depend on Review & Creative.
```

**Expected result**

Operations is an independently installable sibling extension requiring PI only.

**Verify before continuing**

Use fixture extension add/remove tests; confirm PI auto-resolves and Review & Creative is not required.

### Step 2 — Implement immutable Deployment and `record-deployment`

**References:** Operations boundary/exposure/deployment §7; PI hand-off/corrective roadmap/context/commands §19

**Run**

```text
Implement Deployment schema/validation and pactwright operations record-deployment <evidence-id>. Require valid Delivery Evidence, configured environment, identifiable artifact revision/locator/hash, deployed_at and deployed_by. Create evidence --deployed-as--> deployment, print the Deployment id, and keep repeated deployments as distinct immutable records. Corrections to a Deployment use explicit supersession, never mutation.
```

**Expected result**

Delivery Evidence and production exposure are explicitly distinct.

**Verify before continuing**

Run fixtures for invalid Evidence, missing environment/artifact, repeated deployment, supersession and no Evidence mutation.

## Stage 2 — Implement bounded operational collection

Connect external systems without turning Pactwright into a telemetry store.

### Step 3 — Implement operational source adapter contract/config

**References:** Sources/execution/Observation §8

**Run**

```text
Implement .pactwright/operations/sources and environments configuration plus a source adapter contract. Provider-specific settings live in adapters; credentials never live in canonical records. Adding a source adapter must not change graph semantics.
```

**Expected result**

Operational sources are pluggable and configuration-driven.

**Verify before continuing**

Run source-schema/conformance fixtures for one initial adapter.

### Step 4 — Implement bounded evidence collection + execution provenance

**References:** Sources/execution/Observation §§9–10

**Run**

```text
Implement bounded collection windows and immutable Operations execution records containing source, graph revision, window, exposures, evidence locators, observations created/matched and status. Raw log/trace/metric/analytics/support payloads remain external and are never Project Graph nodes.
```

**Expected result**

Collection provenance is retained without graph pollution.

**Verify before continuing**

Run a fixture returning many raw events and inspect that canonical graph contains none of them.

### Step 5 — Expose `operations ingest`

**References:** PI hand-off/corrective roadmap/context/commands §19

**Run**

```text
Implement pactwright operations ingest [<source-id>] over the collection layer. Print the Operations execution id. Ingest may complete successfully with no Observation/canonical graph mutation. Authentication/source failure records execution failure and leaves canonical graph untouched.
```

**Expected result**

Evidence collection is independently executable/retryable.

**Verify before continuing**

Run successful/no-finding and failed-auth fixtures.

## Stage 3 — Implement durable Observation semantics

Compress operational signals into concise facts worth retaining.

### Step 6 — Implement Observation schema/grounding

**References:** Sources/execution/Observation §11

**Run**

```text
Implement Observation schema/validation: exposure id/hash, evidence window, factual finding, direction, significance, confidence, evidence source/locator/summary and optional baseline plus observation --observes--> exposure. Preserve uncertainty and prohibit unsupported causal claims. Significance represents operational importance only and must not determine Project Intelligence promotion class or roadmap priority.
```

**Expected result**

An Observation is a concise durable operational fact tied to evidence and exact exposure.

**Verify before continuing**

Run negative, positive, baseline-dependent and unsupported-causality fixtures.

### Step 7 — Implement Observation deduplication/supersession

**References:** Sources/execution/Observation §12

**Run**

```text
Before creating an Observation, compare with relevant existing Observations. Same finding with new evidence creates no new canonical Observation unless meaning changed. Materially changed meaning creates a new Observation explicitly superseding the previous one. External evidence remains addressable through execution provenance when no new Observation is created. Operations deduplication does not replace Project Intelligence Source-level triage.
```

**Expected result**

Repeated monitoring does not create uncontrolled graph growth.

**Verify before continuing**

Run repeated-identical and materially-changed finding fixtures; confirm the repeated-identical case retains its evidence through execution provenance.

### Step 8 — Expose `operations observe`

**References:** PI hand-off/corrective roadmap/context/commands §§19–20

**Run**

```text
Implement pactwright operations observe [<source-id>] using operations-analysis for bounded evidence interpretation. Print created/matched Observation ids and any internal PI Source ids produced by the hand-off. It may create/supersede concise Observations or legitimately create none. Deterministic source collection, validation, edge creation and graph mutation remain runtime-owned.
```

**Expected result**

Semantic analysis is bounded; deterministic mechanics stay in Pactwright.

**Verify before continuing**

Run one no-observation, one negative and one positive fixture.

### Step 9 — Deliver `operations-analysis` in the first-party complete pack

**References:** PI hand-off/corrective roadmap/context/commands §20; Distribution §§7, 18

**Run**

```text
Implement the operations-analysis capability in the @pactwright/creative complete pack so the Operations manifest requirement is satisfied by a first-party pack: bounded evidence interpretation, baseline comparison, durable-finding identification, exposure correlation, evidence/speculation separation and concise candidate Observation production. Regenerate adapter files through the normal agent-pack path. Deterministic responsibilities (collection, hashing, exposure resolution, schema validation, deduplication mechanics, edge creation, graph mutation, PI hand-off, report generation) remain runtime-owned.
```

**Expected result**

`extension add operations` capability validation passes wherever the complete pack is selected.

**Verify before continuing**

Run fixture extension-add tests: enabling Operations with the updated pack passes capability validation; enabling it with a pack lacking `operations-analysis` fails with a clear capability error.

## Stage 4 — Route operational meaning through PI

Close the governance boundary without letting Operations become a knowledge/roadmap engine.

### Step 10 — Implement Observation → PI internal Source hand-off

**References:** PI hand-off/corrective roadmap/context/commands §13; Project Intelligence §14

**Run**

```text
Implement internal Source creation from meaningful Observations, preserving Observation id/hash, evidence locators, exposure and execution provenance. Operations must not directly create/edit Knowledge, Domains, Intents, Contracts or Briefs. Failed hand-off leaves Observation valid/retryable.
```

**Expected result**

Operational truth enters the same PI ingestion/governance path as other Sources.

**Verify before continuing**

Run a failed-hand-off fixture and confirm Observation remains valid and retryable.

### Step 11 — Implement corrective roadmap filter

**References:** PI hand-off/corrective roadmap/context/commands §§14–15; Project Intelligence §11

**Run**

```text
Implement pactwright operations corrective-roadmap as a derived filter over Project Intelligence intent candidates whose accepted motivation traces to Operations, regenerating docs/operations/reports/corrective-intent-roadmap.md and recording the Project Graph revision it was generated from. Reuse PI candidate ordering; do not create a second candidate set/priority model or canonical Intents. Editing the report must not create an Intent or change any priority.
```

**Expected result**

Operations can answer what corrective work production suggests without owning project prioritisation.

**Verify before continuing**

Run the command against PI candidates from operational/non-operational origins and inspect filtering, the recorded Project Graph revision and provenance; confirm editing the generated report changes no canonical state.

### Step 12 — Implement `operations refresh` and `validate`

**References:** PI hand-off/corrective roadmap/context/commands §19; Evaluation/validation/failure/GitHub/build order §§22–23

**Run**

```text
Implement pactwright operations refresh to compose configured ingest + observe and pactwright operations validate to enforce Deployment, Observation, source configuration, execution provenance and cross-graph rules. A successful refresh with no Observation is valid.
```

**Expected result**

Operations has a complete deterministic runtime surface.

**Verify before continuing**

Run refresh/validate on success, no-finding, source-failure and invalid-graph fixtures.

### Step 13 — Implement bounded Operations context contribution

**References:** PI hand-off/corrective roadmap/context/commands §18; GitHub §15

**Run**

```text
Implement namespaced bounded Operations context for active Delivery lineages: Observations affecting prior versions of the same surface, unresolved production findings, relevant successful operational patterns, Deployments associated with the lineage and corrective intent evidence, surfaced through pactwright context and the Delivery PR Operations section. Never preload complete telemetry history, unrelated incidents, all historical Deployments or every Observation in the repository.
```

**Expected result**

Future Delivery sees relevant production history without raw telemetry or unbounded context.

**Verify before continuing**

Run a context fixture for a lineage with prior Observations and Deployments: relevant records appear, unrelated records and raw payloads do not.

## Stage 5 — Add Operations evaluation and GitHub automation

Prove the analysis capability, then run/visualise Operations remotely without mirroring telemetry.

### Step 14 — Implement Operations evaluation cases

**References:** Evaluation/validation/failure/GitHub/build order §21; Distribution §§16, 18

**Run**

```text
Contribute operations-analysis evaluation cases covering signal-to-Observation compression, correct exposure attribution, factual grounding, baseline interpretation, false-positive avoidance, unsupported-causality avoidance, duplicate finding handling, positive-finding recognition, correct Project Intelligence routing and scope discipline. Prefer deterministic assertions (required evidence references exist, raw telemetry is not persisted as graph nodes, Observation schema is valid, forbidden graph mutations do not occur, exposure relationships are valid); report semantic dimensions individually without a single aggregate score.
```

**Expected result**

Operations analysis quality is testable through the shared evaluation surface.

**Verify before continuing**

Run `pnpm pactwright eval` with the Operations cases and inspect per-dimension reporting.

### Step 15 — Implement Operations workflow/checks/views

**References:** GitHub §§4, 8, 15, 24

**Run**

```text
Implement generated pactwright-operations.yml, Deployment recording hooks, source-config validation, scheduled refresh, Observation hand-off, corrective-roadmap regeneration, the Delivery PR Operations context section, the Operations refresh summary, Pactwright / Operations and Pactwright / Operations Views checks, and Deployments/Production Findings/Operations/Corrective Roadmap projections. Never write raw telemetry into GitHub/Pactwright graph.
```

**Expected result**

Operations remote automation remains a thin runtime projection/execution surface.

**Verify before continuing**

Run sync/dry-run and inspect that only durable records/derived summaries are projected and that the PR Operations section contains no raw telemetry.

## Stage 6 — Adopt Operations on the Pactwright website

Run this stage from the Pactwright repository root.

Use the first real production surface to create immediate tool feedback.

### Step 16 — Enable Operations through the repository-local CLI

**References:** Distribution §4; GitHub §8

**Run**

The `pactwright` package does not add itself as a dependency of its own source repository. Enable Operations from the workspace:

```bash
pnpm build

pnpm pactwright extension add operations
pnpm pactwright sync
pnpm pactwright operations validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

**Expected result**

Pactwright has Operations enabled with the PI dependency resolved from the workspace.

**Verify before continuing**

Run `pnpm pactwright validate`.

### Step 17 — Configure one real website environment/source

**References:** Operations boundary/exposure/deployment §5; Sources/execution/Observation §8; Website spec

**Run**

```text
Inspect the existing Pactwright website stack and configure the minimum .pactwright/operations environment + one bounded source using systems already adopted by the website. Do not add a new observability vendor, commit credentials or persist raw analytics/log payloads. Run operations validate after editing.
```

**Expected result**

The website has one real Operations source using existing infrastructure.

**Verify before continuing**

Run `pnpm pactwright operations validate` and inspect committed config for secrets/raw payloads.

### Step 18 — Record a real website deployment

**References:** Operations boundary/exposure/deployment §7; Website spec

**Run**

```text
Identify the accepted Pactwright website Evidence to expose. Execute the website's existing deployment mechanism for that Evidence and report the deployed artifact revision/locator and Evidence id. Do not invent a new deployment path.
```

**Run**

```bash
pnpm pactwright operations record-deployment <website-evidence-id>
pnpm pactwright operations validate
```

**Expected result**

A canonical Deployment identifies exact delivered Evidence/artifact/environment.

**Verify before continuing**

Inspect Deployment and deployed-as edge; Evidence bytes remain unchanged.

### Step 19 — Collect and analyse website evidence

**References:** Sources/execution/Observation §§8–12; PI hand-off/corrective roadmap/context/commands §19

**Run**

`<source-id>` is the `id` of the source configured in Step 17.

```bash
pnpm pactwright operations ingest <source-id>
pnpm pactwright operations observe <source-id>
pnpm pactwright operations validate
```

**Expected result**

The run creates execution provenance and zero or more durable Observations.

**Verify before continuing**

Inspect execution record and confirm raw source payloads are not graph nodes.

### Step 20 — Route one accepted Observation into future Delivery

**References:** PI hand-off/corrective roadmap/context/commands §§13–15; Project Intelligence §11

**Run**

```bash
pnpm pactwright intelligence triage <internal-source-id>
```

**Run**

```bash
# only if triage requires reviewed promotion
pnpm pactwright intelligence promote <internal-source-id>
pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright operations corrective-roadmap
```


**Run**

```text
/capture-intent "<accepted corrective outcome>"
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Expected result**

At least one real production finding reaches normal Delivery only after PI governance.

**Verify before continuing**

Trace Deployment → Observation → Source → Knowledge/candidate → Intent → Evidence.

## Stage 7 — Publish the Operations learning path

### Step 21 — Deliver grounded Operations content

**References:** Open-Source Project Organisation §§1.2–1.3; Operations boundary/exposure/deployment §7; Sources/execution/Observation §§8–12; PI hand-off/corrective roadmap/context/commands §§13–16

**Run**

From the Pactwright repository root:

```bash
pnpm pactwright intelligence onboard
```

Require `identity`, `content`, `product` and `delivery/eng` to be Covered for this work. Fill any missing coverage through the established PI gap loop before continuing.

Then:

```text
/capture-intent "Publish Pactwright's Operations learning path: concise Operations documentation, one production-feedback/incident example, an Academy Production Learning lesson, and the website capability update needed to explain the production feedback loop. Ground the content in accepted Project Intelligence and the real Operations behaviour delivered in this checkpoint."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

For the public-facing creative portion, approve and publish through Creative Delivery.

**Expected result**

Operations is understandable from Docs/Examples/Academy/Website and the public-facing material is grounded in accepted project truth.

**Verify before continuing**

Technical claims match the implemented Operations boundary; public narrative has valid identity/product grounding and, where published as an Asset, canonical Publication lineage.

## Stage 8 — Release `0.0.6`

### Step 22 — Prepare, publish and tag `0.0.6`

**References:** Release model (Implementation Guide); Distribution §§6, 18

**Run**

Update `CHANGELOG.md` from accepted Checkpoint 6 Evidence only, then create the release PR:

```bash
VERSION=0.0.6
DEFAULT_BRANCH="$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name)"

git switch "$DEFAULT_BRANCH"
git pull --ff-only
git switch -c "release/$VERSION"

pnpm -r exec npm version "$VERSION" --no-git-tag-version --allow-same-version
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

- `@pactwright/operations`

After the release PR is merged, bootstrap only those new packages interactively:

```bash
pnpm --filter @pactwright/operations publish --dry-run --tag next --access public
pnpm --filter @pactwright/operations publish --tag next --access public

REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"

npx -y npm@^11.15 trust github @pactwright/operations \
  --repo "$REPO" \
  --file release.yml \
  --environment npm-release \
  --allow-publish
```

If the npm CLI `trust` command is unavailable in the installed npm version, configure the trusted publisher for `@pactwright/operations` through the npm package settings web UI instead (GitHub Actions publisher: this repository, workflow `release.yml`, environment `npm-release`) before tagging.

Do not manually publish packages that already have trusted publishing configured.

Tag the accepted merge commit:

```bash
git tag -a "v$VERSION" -m "v$VERSION"
git push origin "v$VERSION"
```

**Expected result**

The tag-triggered trusted `release.yml` workflow verifies the exact merged source and publishes every still-unpublished package in the `0.0.6` family under `next`. Existing published members are not overwritten.

**Verify before continuing**

Confirm the `release.yml` run for `v0.0.6` succeeded, then:

```bash
pnpm view pactwright@0.0.6 version
pnpm view @pactwright/standard@0.0.6 version
pnpm view @pactwright/project-intelligence@0.0.6 version
pnpm view @pactwright/review-creative@0.0.6 version
pnpm view @pactwright/creative@0.0.6 version
pnpm view @pactwright/operations@0.0.6 version
```

Every command must return `0.0.6`.

For the newly introduced package(s), also run:

```bash
npx -y npm@^11.15 trust list @pactwright/operations
```

Existing package-family members must show npm provenance/trusted-publisher metadata; the newly bootstrapped package(s) must now trust `release.yml` for the next release.


## Stage 9 — Prove Operations on Kakeido

Run this stage from the Kakeido repository root unless a step explicitly says otherwise.

Exercise the same feedback loop against sensitive financial-product infrastructure.

### Step 23 — Install/reconcile Operations in Kakeido

**References:** Distribution §4

**Run**

```bash
pnpm add -D \
  pactwright@0.0.6 \
  @pactwright/project-intelligence@0.0.6 \
  @pactwright/review-creative@0.0.6 \
  @pactwright/creative@0.0.6 \
  @pactwright/operations@0.0.6

pnpm pactwright extension upgrade project-intelligence
pnpm pactwright agent-pack use @pactwright/creative
pnpm pactwright extension upgrade review-creative
pnpm pactwright extension add operations
pnpm pactwright sync
pnpm pactwright operations validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

**Expected result**

Kakeido has Operations with PI dependency resolved and the upgraded pack providing `operations-analysis`.

**Verify before continuing**

Run `pnpm pactwright validate`.

### Step 24 — Configure one safe Kakeido environment and operational source

**References:** Operations boundary/exposure/deployment §5; Kakeido evidence sources/privacy/delivery §11; Sources/execution/Observation §§8–10

**Run**

```text
Configure the minimum .pactwright/operations environment for the exposed Kakeido surface plus one Operations source using existing Better Stack or Cloudflare evidence for failed imports, failed Workflows, API errors/latency, LLM failures or deployment markers. For native mobile crash evidence, Apple App Store Connect and Google Play Vitals platform diagnostics are permitted existing sources per Kakeido Tech Stack §11 (v1.1); record that choice as a canonical Decision in the Kakeido graph as part of this step. Do not add a new observability vendor. Do not log/store raw financial CSV contents, secrets, access tokens or unnecessary personal data. Run operations validate.
```

**Expected result**

Kakeido has a configured environment and observes product reliability without copying sensitive financial payloads.

**Verify before continuing**

Inspect environment/source config and logging path and run `pactwright operations validate`.

### Step 25 — Deploy accepted Kakeido Evidence

**References:** Operations boundary/exposure/deployment §7; Kakeido evidence sources/privacy/delivery §13; Kakeido Tech Stack §13, and §14 when mobile surfaces changed

**Run**

```text
Identify the accepted Kakeido Delivery Evidence to expose and report its Evidence id. Execute Kakeido's existing deployment mechanism for that Evidence: backend through the Tech Stack §13 Wrangler path, and mobile through the Tech Stack §13 mobile delivery path — including the OTA staging-channel verification gate for EAS Updates — and §14 when the accepted scope changed mobile surfaces. Report the deployed artifact revision/locator. Do not invent a new deployment path.
```

**Run**

```bash
pnpm pactwright operations record-deployment <kakeido-evidence-id>
pnpm pactwright operations validate
```

**Expected result**

A canonical Kakeido Deployment identifies exact delivered Evidence/artifact/environment.

**Verify before continuing**

Inspect Deployment and deployed-as edge; Evidence bytes remain unchanged.

### Step 26 — Run the Kakeido software feedback loop

**References:** Sources/execution/Observation §§8–12; PI hand-off/corrective roadmap/context/commands §§13–15

**Run**

`<source-id>` is the `id` of the source configured in Step 24; `<internal-source-id>` is printed by `operations observe`.

```bash
pnpm pactwright operations ingest <source-id>
pnpm pactwright operations observe <source-id>
pnpm pactwright operations validate
pnpm pactwright intelligence triage <internal-source-id>
```

**Run**

```bash
# only if triage requires reviewed promotion
pnpm pactwright intelligence promote <internal-source-id>
pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright operations corrective-roadmap
```

**Run**

```text
/capture-intent "<accepted corrective outcome>"
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

During the checkpoint, also prove one positive Observation path through the same ingest/observe/triage flow.

**Expected result**

A real Kakeido exposure yields governed production meaning, one corrective Delivery and one accepted positive Observation.

**Verify before continuing**

Trace Deployment → Observation → Source → Knowledge/candidate → Intent → Evidence for the corrective path and confirm the positive Observation reached PI through the same governance path.

## Stage 10 — Capture checkpoint feedback

### Step 27 — Route Checkpoint 6 findings into project truth

**References:** Implementation Principles §§7, 14; Project Intelligence §8

**Run**

From the Pactwright repository root:

```text
Record the material findings from building, adopting, releasing and installing Operations in this checkpoint — defects, obstructive ceremony, installation problems, content gaps and evaluation gaps from both the Pactwright website and Kakeido loops — as Project Intelligence Sources. Distinguish Kakeido-specific choices from evidence of Pactwright responsibility failures; only the latter become candidate Pactwright work or generic evaluation cases.
```

```bash
pnpm pactwright intelligence ingest
pnpm pactwright intelligence triage <feedback-source-id>
pnpm pactwright intelligence derive-intent-roadmap
```

Regenerate the corrective view where accepted findings are operational in origin:

```bash
pnpm pactwright operations corrective-roadmap
```

**Expected result**

Checkpoint learning is durable, governed project truth rather than untracked memory.

**Verify before continuing**

Each blocking finding traces to a Source and a triage outcome; no blocking failure is carried silently into Checkpoint 7.

## Exit gate

Operations installs as a sibling extension requiring PI only, and Deployment remains distinct from Delivery Evidence, immutable, and corrected only through explicit supersession. Raw telemetry remains external, execution provenance is not Project Graph state, and Observation grounding, deduplication and causality rules hold with both negative and positive Observation acceptance during the checkpoint. Operational meaning enters Project Intelligence only through internal Source ingestion, and the corrective roadmap remains a revision-stamped filtered view that creates no Intents and changes no priority. `operations-analysis` ships in the first-party complete pack with its evaluation cases passing, and bounded Operations context reaches Delivery without raw telemetry. GitHub automation stays a thin projection with the Operations checks and views green. The Pactwright website and Kakeido each prove a governed Deployment → Observation → PI → Delivery path; the `0.0.6` family is published, registry-verified and installed in Kakeido; the Operations learning path is published from accepted project truth; and checkpoint feedback is captured as Sources with no blocking failure carried into Checkpoint 7.

---

**Pactwright — Checkpoint 6 — Production Learning v11**
