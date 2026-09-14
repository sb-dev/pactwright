# Pactwright — Checkpoint 6 — Production Learning

**Version:** 12  
**Entry condition:** Checkpoint 5 is accepted.  
**Release:** `0.0.6`  
**Exit capability:** Deployment, controlled Experiment and durable Observation state feed governed future work through Operations → PI → Delivery without moving product-specific release semantics or raw production evidence into Pactwright.

## 1. Goal

Implement Operations for software exposure and production learning, use the Pactwright website to prove the Deployment → Observation path, then activate the generic Operations `Experiment` seam and prove it with Kakeibo's versioned Kei subsystem.

The Kakeibo proof must compare exact active/candidate operational exposures through a predeclared immutable Experiment, observe the result through bounded external evidence, and route any decision through normal PI/Delivery governance. Pactwright must not gain Kei-specific graph types or automatic promotion semantics.

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

At execution time use the current canonical Kakeibo authorities relevant to production Kei evaluation:

```text
docs/specs/README.md

docs/specs/02-financial-domain-model-spec.md
docs/specs/03-kei-assistant-spec.md
docs/specs/05-system-architecture-and-data-spec.md
docs/specs/06-engineering-delivery-and-operations-spec.md
docs/specs/07-open-source-project-organisation-spec.md
```

Preserve the Kakeibo ownership split:

```text
02 → financial truth and non-experimentable financial invariants
03 → Kei behaviour / authority / task contract
05 → Kei runtime / release / model-route architecture
06 → evaluation / experiment / rollout / rollback engineering
07 → public/private and production-evidence transparency boundary
```

`00-kakeibo-acceptance-profile.md` §10 is the shared System-Level Acceptance cross-check for the Kakeibo proof.

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

Dynamic ids such as `<source-id>`, `<brief-id>`, `<evidence-id>`, `<deployment-id>` and `<experiment-id>` must come from an earlier command in the runbook, or from configuration this runbook explicitly creates. Commands that create or resolve durable records must print the ids required by later steps.

Fixture verification means repository test fixtures unless a step explicitly creates a real repository or GitHub resource.

## 4. Checkpoint specification map

- **Operations boundary/exposure/deployment** — Pactwright — Operations Graph Engineering Spec §§1–7
- **Sources/execution/Observation** — Pactwright — Operations Graph Engineering Spec §§8–12
- **PI hand-off/corrective roadmap/context/commands** — Pactwright — Operations Graph Engineering Spec §§13–20
- **Evaluation/validation/failure/GitHub/build order** — Pactwright — Operations Graph Engineering Spec §§21–27
- **Experiment ownership/invariants/graph/layout** — Operations Experiment Semantics §§1–5
- **Experiment contract/modes/constraints/execution/outcomes** — Operations Experiment Semantics §§6–9
- **Experiment commands/validation/failure/GitHub/PI hand-off** — Operations Experiment Semantics §§10–14
- **Experiment acceptance/genericity** — Operations Experiment Semantics §§15–17
- **Project Intelligence** — Pactwright — Project Intelligence Graph Engineering Spec §§8, 11, 14
- **Distribution** — Pactwright — Distribution, Agents and Evaluation §§4–8, 15–16, 18
- **GitHub** — Pactwright — GitHub Actions and Views §§4, 8, 15, 24
- **Open-Source Project Organisation** — Pactwright Open-Source Project Organisation §§1.2–1.3
- **Release model** — Pactwright — Implementation Guide (npm release model, trusted release workflow, release failure rules)
- **Implementation Principles** — Pactwright — Implementation Principles §§7, 14
- **Website spec** — Design Specification: Astro + Cloudflare Workers + Meta CAPI
- **Kakeibo controlled Kei experiment** — current Kakeibo `02`, `03`, `05`, `06`, `07`; Kakeibo Acceptance Profile §10

### Out of scope in this checkpoint

The following remain deferred to Checkpoint 7 — Published-Work Feedback:

- generic manifest-driven exposure registration/discovery across sibling extensions;
- Publication as a registered operational exposure and Publication Observations;
- cross-extension composition of Publication paths and events into `pactwright-operations.yml`.

This checkpoint has two native Operations exposure types:

```text
deployment
experiment
```

`Experiment` is activated directly by the adopted Operations amendment. This does not pre-build the generic cross-extension exposure registry deferred to Checkpoint 7.

Also out of scope:

- Kakeibo `KeiRelease`, Kei task, policy, persona, model route or benchmark case as Pactwright graph node types;
- raw experiment assignments, analytics rows, financial grounding, prompts, responses, traces or metric samples as Project Graph nodes;
- a `promote-experiment` command or any automatic candidate promotion;
- Pactwright ownership of Kakeibo rollout percentages or product-specific release configuration;
- a dedicated shared GitHub Project `Experiments` view, which is completed with the full operating surface in Checkpoint 8. Checkpoint 6 must still validate and project Experiment state in Operations summaries/workflows.

## Stage 1 — Package Operations and implement exact exposures

Record exact delivered software exposure and predeclared controlled comparisons.

### Step 1 — Implement Operations manifest/layout/dependency

**References:** Operations boundary/exposure/deployment §§4–5; Distribution §§4–5; Experiment §§4–5

**Run**

```text
Create `@pactwright/operations` as a publishable workspace package and implement its manifest and repository layout: require Project Intelligence; register Deployment, Experiment and Observation node types; register deployed-as and observes edge types; register the operations namespace, operations-analysis capability and Operations GitHub profile; create docs/operations/deployments, docs/operations/experiments, docs/operations/observations and reports plus Operations execution provenance. Do not depend on Review & Creative and do not add product-specific experiment fields.
```

**Expected result**

Operations is an independently installable sibling extension requiring PI only, with native Deployment/Experiment/Observation semantics.

**Verify before continuing**

Use fixture extension add/remove tests; confirm PI auto-resolves, Review & Creative is not required, `experiment` is registered by Operations, and no Kei/product-specific type appears in the manifest.

### Step 2 — Implement immutable Deployment and `record-deployment`

**References:** Operations boundary/exposure/deployment §7; PI hand-off/corrective roadmap/context/commands §19

**Run**

```text
Implement Deployment schema/validation and pactwright operations record-deployment <evidence-id>. Require valid Delivery Evidence, configured environment, identifiable artifact revision/locator/hash, deployed_at and deployed_by. Create evidence --deployed-as--> deployment, print the Deployment id, and keep repeated deployments as distinct immutable records. Deployment records exact exposure of the delivered artifact but does not imply user visibility. Corrections use explicit supersession, never mutation.
```

**Expected result**

Delivery Evidence and operational exposure are explicitly distinct, including isolated/shadow deployments that are not user-facing.

**Verify before continuing**

Run fixtures for invalid Evidence, missing environment/artifact, repeated deployment, isolated non-user-facing deployment, supersession and no Evidence mutation.

### Step 3 — Implement immutable Experiment and `record-experiment`

**References:** Experiment §§6–7, 10–12

**Run**

```text
Implement the Operations Experiment schema and pactwright operations record-experiment <contract-path>. Validate the complete proposed contract before mutation, resolve exact control/candidate exposure ids and hashes, then write one immutable Experiment and print its id. Re-recording the same exact contract is idempotent or resolves to the existing Experiment; any semantic change creates a new Experiment that explicitly supersedes the previous one.

The canonical contract must represent:
- mode: shadow | canary | ab | controlled_rollout;
- hypothesis;
- exact control exposure id/hash;
- exact candidate exposure id/hash;
- eligibility description;
- assignment strategy/subject key where applicable;
- one primary metric where comparative success requires it;
- guardrail metrics;
- minimum evidence;
- decision rule;
- start/end window or review condition;
- referenced project constraints.

Do not add product-specific fields or a promotion action.
```

**Expected result**

Operations can record what was deliberately compared and how success was to be judged before outcome evidence is inspected.

**Verify before continuing**

Run fixtures for all four modes plus invalid/missing exposure, same control/candidate, hash mismatch, missing hypothesis, missing primary metric where required, missing decision rule, invalid assignment, invalid shadow user-facing assignment, unresolved required constraint, duplicate exact contract and valid supersession. Confirm failure leaves no partial canonical Experiment.

## Stage 2 — Implement bounded operational collection

Connect external systems without turning Pactwright into a telemetry or experiment-sample store.

### Step 4 — Implement operational source adapter contract/config

**References:** Sources/execution/Observation §8; Experiment §8

**Run**

```text
Implement .pactwright/operations/sources and environments configuration plus a source adapter contract. Provider-specific settings live in adapters; credentials never live in canonical records. Sources may provide bounded evidence about Deployments or Experiments. Adding a source adapter must not change graph semantics.
```

**Expected result**

Operational/evaluation sources are pluggable and configuration-driven.

**Verify before continuing**

Run source-schema/conformance fixtures for one initial adapter and one bounded experiment-evidence fixture.

### Step 5 — Implement bounded evidence collection + execution provenance

**References:** Sources/execution/Observation §§9–10; Experiment §8

**Run**

```text
Implement bounded collection windows and immutable Operations execution records containing source, graph revision, window, exact exposures, evidence locators/fingerprints, observations created/matched and status. When execution concerns an Experiment, also retain the Experiment id, mode and exact control/candidate exposure references needed for reproducibility. Raw logs, traces, analytics rows, assignments, prompts, responses, metric samples, support payloads and financial grounding remain external and are never Project Graph nodes.
```

**Expected result**

Collection/evaluation provenance is retained without graph pollution or unnecessary personal-data retention.

**Verify before continuing**

Run fixtures returning many raw telemetry/experiment samples and inspect that canonical graph contains none of them while the execution record retains only bounded locators/fingerprints and reproducibility metadata.

### Step 6 — Expose `operations ingest`

**References:** PI hand-off/corrective roadmap/context/commands §19; Experiment §§8–10

**Run**

```text
Implement pactwright operations ingest [<source-id>] over the collection layer. Print the Operations execution id. Ingest may complete successfully with no Observation/canonical graph mutation. Authentication/source/assignment/evaluation failure records execution failure and leaves existing Deployments, Experiments and canonical graph state untouched.
```

**Expected result**

Evidence collection is independently executable/retryable.

**Verify before continuing**

Run successful/no-finding, failed-auth and failed-experiment-evidence fixtures.

## Stage 3 — Implement durable Observation semantics

Compress operational signals and Experiment outcomes into concise facts worth retaining.

### Step 7 — Implement Observation schema/grounding

**References:** Sources/execution/Observation §11; Experiment §9

**Run**

```text
Implement Observation schema/validation: exposure id/hash, evidence window, factual finding, direction, significance, confidence, evidence source/locator/summary and optional baseline plus observation --observes--> exposure. Exposure may be a Deployment or Experiment registered by Operations. Preserve uncertainty and prohibit unsupported causal claims. For Experiment outcomes, preserve the predeclared contract, report material guardrail breaches and allow positive, negative, mixed, neutral or insufficient-evidence findings. Significance must not determine PI consequence class or roadmap priority.
```

**Expected result**

An Observation is a concise durable operational fact tied to evidence and an exact Deployment or Experiment.

**Verify before continuing**

Run negative, positive, mixed, neutral, insufficient-evidence, baseline-dependent and unsupported-causality fixtures, including `Observation --observes--> Experiment`.

### Step 8 — Implement Observation deduplication/supersession

**References:** Sources/execution/Observation §12; Experiment §12

**Run**

```text
Before creating an Observation, compare with relevant existing Observations. Same finding with new evidence creates no new canonical Observation unless meaning changed. Materially changed meaning creates a new Observation explicitly superseding the previous one. External evidence remains addressable through execution provenance when no new Observation is created. Re-running analysis over the same Experiment/evidence must not create uncontrolled duplicate Observations.
```

**Expected result**

Repeated monitoring/evaluation does not create uncontrolled graph growth.

**Verify before continuing**

Run repeated-identical and materially-changed Deployment and Experiment finding fixtures.

### Step 9 — Expose `operations observe`

**References:** PI hand-off/corrective roadmap/context/commands §§19–20; Experiment §§9–10

**Run**

```text
Implement pactwright operations observe [<source-id>] using operations-analysis for bounded evidence interpretation. Print created/matched Observation ids and any internal PI Source ids produced by the hand-off. It may create/supersede concise Observations about Deployments or Experiments or legitimately create none. It must not rewrite an Experiment hypothesis, metrics, guardrails, decision rule or compared exposures after seeing results. Deterministic collection, validation, edge creation and graph mutation remain runtime-owned.
```

**Expected result**

Semantic analysis is bounded and predeclared Experiment truth cannot drift after outcome inspection.

**Verify before continuing**

Run one no-observation, one Deployment outcome and one Experiment outcome fixture; attempt post-result Experiment mutation and require rejection.

### Step 10 — Deliver `operations-analysis` in the first-party complete pack

**References:** PI hand-off/corrective roadmap/context/commands §20; Distribution §§7, 18; Experiment §9

**Run**

```text
Implement the operations-analysis capability in the @pactwright/creative complete pack: bounded evidence interpretation, baseline/control-candidate comparison, durable-finding identification, exposure correlation, evidence/speculation separation, guardrail reporting and concise candidate Observation production. An Experiment result may be favourable, unfavourable, mixed, neutral or insufficient under the predeclared decision rule. Deterministic responsibilities — collection, hashing, exposure resolution, schema validation, deduplication, edge creation, graph mutation, PI hand-off and report generation — remain runtime-owned.
```

**Expected result**

`extension add operations` capability validation passes wherever the complete pack is selected and Experiment analysis does not become promotion logic.

**Verify before continuing**

Run fixture extension-add tests plus a favourable Experiment fixture proving `operations-analysis` emits only a candidate Observation and cannot mutate/promote the candidate exposure.

## Stage 4 — Route operational meaning through PI and validate the complete boundary

Close governance without letting Operations become a knowledge, roadmap or release-promotion engine.

### Step 11 — Implement Observation → PI internal Source hand-off

**References:** PI hand-off/corrective roadmap/context/commands §13; Project Intelligence §14; Experiment §14

**Run**

```text
Implement internal Source creation from meaningful Observations, preserving Observation id/hash, evidence locators, exact exposure and execution provenance. For Experiment outcomes preserve the Experiment id/hash and bounded result evidence. Operations must not directly create/edit Knowledge, Domains, Intents, Contracts, Briefs or project-specific release state. Failed hand-off leaves Observation valid/retryable.
```

**Expected result**

Deployment and Experiment outcomes enter the same PI governance path as other Sources.

**Verify before continuing**

Run a failed-hand-off fixture and confirm Observation/Experiment remain valid and retryable/immutable.

### Step 12 — Implement corrective roadmap filter

**References:** PI hand-off/corrective roadmap/context/commands §§14–15; Project Intelligence §11; Experiment §14

**Run**

```text
Implement pactwright operations corrective-roadmap as a derived filter over PI intent candidates whose accepted motivation traces to Operations, regenerating docs/operations/reports/corrective-intent-roadmap.md with its Project Graph revision. Reuse PI candidate ordering; do not create a second candidate set/priority model or canonical Intents. A favourable Experiment result does not independently set consequence class, priority or promotion.
```

**Expected result**

Operations can answer what production/evaluation evidence suggests without owning project prioritisation.

**Verify before continuing**

Run the command against operational/non-operational candidates, including a favourable Experiment result, and prove editing the derived report changes no canonical state or candidate priority.

### Step 13 — Implement `operations refresh` and complete `operations validate`

**References:** PI hand-off/corrective roadmap/context/commands §19; Evaluation/validation/failure/GitHub/build order §§22–23; Experiment §§11–12

**Run**

```text
Implement pactwright operations refresh to compose configured ingest + observe and complete pactwright operations validate for Deployment, Experiment, Observation, source configuration, execution provenance and cross-graph rules. A successful refresh with no Observation is valid.

Experiment validation must enforce at least:
- valid mode/hypothesis/exact control and candidate refs;
- control/candidate resolve to registered operational exposure types and hashes match;
- control and candidate are not the same exact exposure;
- required primary metric, guardrails, minimum evidence and decision rule are present;
- assignment is valid for mode and stable_hash has an appropriate subject key/rule;
- shadow cannot be user-facing;
- required project constraints resolve;
- no credentials/raw user payloads are stored;
- supersession is valid/acyclic;
- Experiment Observations use `observes`;
- execution provenance is not Project Graph state.
```

**Expected result**

Operations has a complete deterministic runtime surface including controlled Experiment invariants.

**Verify before continuing**

Run refresh/validate on success, no-finding, source-failure, invalid Deployment, invalid Experiment, invalid Observation and raw-payload-leak fixtures.

### Step 14 — Implement bounded Operations context contribution

**References:** PI hand-off/corrective roadmap/context/commands §18; GitHub §15; Experiment §14

**Run**

```text
Implement namespaced bounded Operations context for active Delivery lineages: relevant prior Deployments, Experiments, Observations, unresolved findings, successful operational patterns and corrective intent evidence. Experiment context includes only the contract/result facts relevant to the lineage, not raw samples or every historical comparison. Never preload complete telemetry, unrelated incidents, all Deployments/Experiments or private experiment payloads.
```

**Expected result**

Future Delivery can learn from production experiments without unbounded or sensitive context.

**Verify before continuing**

Run a context fixture with related/unrelated Deployments, Experiments and Observations; only relevant durable records appear.

## Stage 5 — Add Operations evaluation and GitHub automation

Prove generic Operations/Experiment quality, then run/project the capability remotely without mirroring telemetry.

### Step 15 — Implement Operations evaluation cases and generic Experiment fixture

**References:** Evaluation/validation/failure/GitHub/build order §21; Distribution §§16, 18; Experiment §§11–15

**Run**

```text
Contribute operations-analysis evaluation cases covering signal-to-Observation compression, correct exposure attribution, factual grounding, baseline interpretation, false-positive/unsupported-causality avoidance, duplicate handling, positive-finding recognition, PI routing and scope discipline.

Add Experiment-specific cases for:
- invalid/mismatched exposure hashes;
- predeclared contract integrity;
- shadow user-visibility rejection;
- stable assignment validation;
- primary/guardrail metric interpretation;
- insufficient evidence not forced into a conclusion;
- favourable result not auto-promoting a candidate;
- raw assignment/sample data not persisted;
- failed experiment execution preserving existing exposure state.

Also add one non-Kakeibo fixture comparing two generic immutable software/configuration Deployment exposures. Its Experiment schema, commands and assertions must contain no Kei/Kakeibo-specific fields.

Prefer deterministic assertions and report semantic dimensions individually without a single aggregate score.
```

**Expected result**

Operations Experiment semantics are demonstrably generic before Kakeibo uses them.

**Verify before continuing**

Run `pnpm pactwright eval`; inspect the generic Experiment fixture and search its canonical schema/records for Kakeibo/Kei-specific fields — none may exist.

### Step 16 — Implement Operations workflow/checks/projections with Experiment support

**References:** GitHub §§4, 8, 15, 24; Experiment §13

**Run**

```text
Implement generated pactwright-operations.yml, Deployment recording hooks, source-config validation, scheduled refresh, Observation hand-off, corrective-roadmap regeneration, Delivery PR Operations context, Operations refresh summary and existing Operations projections. Add managed-path/validation/summary support for docs/operations/experiments/** and surface derived Experiment fields needed for review: mode, hypothesis, control/candidate, primary metric, guardrails, window, current derived state and latest Observation/resulting PI references where available.

Do not create candidate promotion actions and do not write raw telemetry/experiment samples into GitHub. The dedicated shared Project Experiments view is completed in Checkpoint 8.
```

**Expected result**

Operations remote automation understands Experiment state while GitHub remains a projection/execution surface.

**Verify before continuing**

Run sync/dry-run; inspect Experiment path triggers/validation and summaries; confirm GitHub field edits alone cannot create a valid Experiment or promote a candidate.

## Stage 6 — Adopt Operations on the Pactwright website

Run this stage from the Pactwright repository root.

Use the first real production surface to prove the base Deployment → Observation feedback path independently of the Kakeibo experiment.

### Step 17 — Enable Operations through the repository-local CLI

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

Pactwright has Operations enabled with PI dependency resolved from the workspace.

**Verify before continuing**

Run `pnpm pactwright validate`.

### Step 18 — Configure one real website environment/source

**References:** Operations boundary/exposure/deployment §5; Sources/execution/Observation §8; Website spec

**Run**

```text
Inspect the existing Pactwright website stack and configure the minimum .pactwright/operations environment + one bounded source using systems already adopted by the website. Do not add a new observability vendor, commit credentials or persist raw analytics/log payloads. Run operations validate after editing.
```

**Expected result**

The website has one real Operations source using existing infrastructure.

**Verify before continuing**

Run `pnpm pactwright operations validate` and inspect committed config for secrets/raw payloads.

### Step 19 — Record a real website deployment

**References:** Operations boundary/exposure/deployment §7; Website spec

**Run**

```text
Identify the accepted Pactwright website Evidence to expose. Execute the website's existing deployment mechanism for that Evidence and report the deployed artifact revision/locator and Evidence id. Do not invent a new deployment path.
```

Then:

```bash
pnpm pactwright operations record-deployment <website-evidence-id>
pnpm pactwright operations validate
```

**Expected result**

A canonical Deployment identifies exact delivered Evidence/artifact/environment.

**Verify before continuing**

Inspect Deployment and deployed-as edge; Evidence bytes remain unchanged.

### Step 20 — Collect and analyse website evidence

**References:** Sources/execution/Observation §§8–12; PI hand-off/corrective roadmap/context/commands §19

**Run**

`<source-id>` is the `id` of the source configured in Step 18.

```bash
pnpm pactwright operations ingest <source-id>
pnpm pactwright operations observe <source-id>
pnpm pactwright operations validate
```

**Expected result**

The run creates execution provenance and zero or more durable Observations.

**Verify before continuing**

Inspect execution record and confirm raw source payloads are not graph nodes.

### Step 21 — Route one accepted website Observation into future Delivery

**References:** PI hand-off/corrective roadmap/context/commands §§13–15; Project Intelligence §11

**Run**

```bash
pnpm pactwright intelligence triage <internal-source-id>

# only if triage requires reviewed promotion
pnpm pactwright intelligence promote <internal-source-id>

pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright operations corrective-roadmap
```

Then:

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

### Step 22 — Deliver grounded Operations content

**References:** Open-Source Project Organisation §§1.2–1.3; Operations Graph Engineering; Operations Experiment Semantics; Project Intelligence §§10, 13

**Run**

From the Pactwright repository root:

```bash
pnpm pactwright intelligence onboard
```

Require `identity`, `content`, `product` and `delivery/eng` to be Covered. Fill any missing coverage through the established PI gap loop before continuing.

Then:

```text
/capture-intent "Publish Pactwright's Operations learning path: concise Operations documentation, one production-feedback example, one generic controlled-Experiment example, an Academy Production Learning lesson, and the website capability update needed to explain Deployment → Experiment/Observation → PI → Delivery. Ground the content in accepted Project Intelligence and the real Operations behaviour delivered in this checkpoint. Make clear that Experiment records predeclared comparison truth, not raw samples or automatic promotion."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

For the public-facing creative portion, approve/publish through Creative Delivery.

**Expected result**

Operations and controlled Experiment semantics are understandable without implying product-specific release ownership.

**Verify before continuing**

Technical claims match the implemented boundaries and the generic Experiment example contains no Kakeibo/Kei-specific semantics.

## Stage 8 — Release `0.0.6`

### Step 23 — Prepare, publish and tag `0.0.6`

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

The following package name is new in this release and cannot use trusted publishing until its first registry version exists:

- `@pactwright/operations`

After the release PR is merged, bootstrap only that new package interactively:

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

If the npm CLI `trust` command is unavailable, configure the trusted publisher through npm package settings instead before tagging. Do not manually publish packages that already have trusted publishing configured.

Tag the accepted merge commit:

```bash
git tag -a "v$VERSION" -m "v$VERSION"
git push origin "v$VERSION"
```

**Expected result**

The tag-triggered trusted `release.yml` workflow verifies the exact merged source and publishes every still-unpublished package in the `0.0.6` family under `next`.

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

For the newly introduced package, also run:

```bash
npx -y npm@^11.15 trust list @pactwright/operations
```

Existing package-family members must show npm provenance/trusted-publisher metadata; `@pactwright/operations` must now trust `release.yml` for the next release.

## Stage 9 — Prove a controlled Kei Experiment on Kakeibo

Run this stage from the Kakeibo repository root unless a step explicitly says otherwise.

Kakeibo provides the first real production-evaluation need for generic Experiment semantics. Kakeibo owns what each Kei release/model route means; Pactwright Operations owns only the durable comparison contract and resulting Observation.

### Step 24 — Install/reconcile Operations in Kakeibo

**References:** Distribution §4; Kakeibo Acceptance Profile §10

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

Kakeibo has the published Operations runtime and the complete pack provides `operations-analysis`.

**Verify before continuing**

Run `pnpm pactwright intelligence validate` and `pnpm pactwright validate`.

### Step 25 — Configure a privacy-safe Kakeibo evaluation environment/source

**References:** Sources/execution/Observation §§8–10; Experiment §8; current Kakeibo `05`, `06`, `07`

**Run**

```text
Configure the minimum .pactwright/operations environment and bounded source needed to observe Kei active/candidate evaluation using Kakeibo's already adopted operational/evaluation infrastructure. Prefer bounded evaluation metadata and metric aggregates/locators. Do not add a new observability vendor, create a new unrelated diagnostics Decision, or persist raw financial CSV contents, canonical financial payloads, credentials, access tokens, production grounding, prompts, responses or unnecessary personal data in Pactwright.
```

**Expected result**

Operations can address the evidence required for controlled Kei evaluation without becoming Kakeibo's telemetry or AI-trace store.

**Verify before continuing**

Run `pnpm pactwright operations validate`; inspect source/environment config and one collection fixture for secret/private-payload leakage.

### Step 26 — Record exact active and candidate Kei evaluation exposures

**References:** Operations Deployment §7; Experiment §6; Kakeibo Acceptance Profile §10; current Kakeibo `03`, `05`, `06`

**Run**

Identify:

```text
active baseline KeiRelease + model-route reference + exact bundle hash + accepted Delivery Evidence
accepted candidate KeiRelease + model-route reference + exact bundle hash + accepted Delivery Evidence from the CP5 release/evaluation path
```

All CP5 deterministic/benchmark/red-team hard gates must still pass for the candidate before production evaluation.

Expose the active baseline through Kakeibo's normal production mechanism and expose the candidate only through the isolated evaluation/shadow path required by the current Kakeibo architecture. A Deployment for the shadow candidate records exact operational exposure but does not imply user visibility.

Then record both exact exposures:

```bash
pnpm pactwright operations record-deployment <active-kei-evidence-id>
pnpm pactwright operations record-deployment <candidate-kei-evidence-id>
pnpm pactwright operations validate
```

Retain the printed Deployment ids/hashes as the Experiment control/candidate references.

**Expected result**

Pactwright knows the exact immutable operational exposures being compared while `KeiRelease`, model-route and task semantics remain Kakeibo repository/application state.

**Verify before continuing**

- both Deployment records resolve to exact accepted Evidence/artifact/bundle hashes;
- active and candidate are distinct exposures;
- candidate hard gates pass before experimentation;
- the candidate shadow Deployment is not represented as user-facing merely because it is deployed;
- no `KeiRelease`, model-route or benchmark node type was added to Pactwright.

### Step 27 — Record and run the initial shadow Experiment

**References:** Experiment §§6–8, 10–12; Kakeibo Acceptance Profile §10; current Kakeibo `02`, `03`, `05`, `06`, `07`

**Run**

Create a proposed Experiment contract before inspecting outcome evidence. The initial real proof uses `shadow` mode unless the current Kakeibo engineering spec explicitly supports an equally safe earlier mode.

The contract must predeclare:

```text
experiment id/title
mode = shadow
hypothesis
exact control Deployment id/hash
exact candidate Deployment id/hash
eligible population / grounding eligibility
assignment = mirror (or equivalent non-user-facing shadow assignment)
primary metric
guardrail metrics
minimum evidence
decision rule
start/end or review condition
hard Kakeibo constraints
```

Reference, without moving ownership, the Kakeibo constraints that cannot be weakened:

```text
financial truth
privacy
user authority
explicit confirmation requirements
Known / Likely / Unknown semantics
financial-advice boundaries
canonical-state mutation boundaries
```

Record the Experiment:

```bash
pnpm pactwright operations record-experiment <experiment-contract-path>
pnpm pactwright operations validate
```

Then execute Kakeibo's isolated shadow mechanism against eligible production evaluation input. Where comparison requires it, active and candidate use the same immutable grounding snapshot.

Shadow acceptance is strict:

```text
candidate output never reaches the user
candidate cannot mutate canonical state
candidate cannot trigger normal product side effects
candidate failure cannot delay or fail the active response
raw financial grounding/prompts/responses are not retained by default for experiment analysis
evaluation cost remains bounded
```

**Expected result**

A canonical immutable Experiment records the comparison contract before outcome inspection while Kakeibo executes the comparison safely outside Pactwright graph state.

**Verify before continuing**

- Experiment ids/hashes exactly match the two Deployment exposures;
- hypothesis/primary metric/guardrails/minimum evidence/decision rule were recorded before evidence analysis;
- shadow has no user-facing assignment;
- the experiment contract contains no Kakeibo-specific schema fields beyond generic constraint references/exposure metadata;
- changing the contract after recording is rejected and requires supersession;
- failed candidate execution cannot alter active production behaviour or Experiment state.

### Step 28 — Observe, govern and prove rollback

**References:** Experiment §§9, 12, 14–15; PI hand-off/corrective roadmap §§13–15; Kakeibo Acceptance Profile §10; current Kakeibo `06`

**Run**

Use the source configured in Step 25:

```bash
pnpm pactwright operations ingest <source-id>
pnpm pactwright operations observe <source-id>
pnpm pactwright operations validate
```

The durable result, when evidence is sufficient, must be an Observation targeting the Experiment rather than a mutation of the Experiment or candidate. It may be positive, negative, mixed or neutral. Insufficient evidence may legitimately create no outcome Observation or an explicitly insufficient-evidence Observation according to the implemented rules.

For every internal PI Source emitted from the outcome:

```bash
pnpm pactwright intelligence triage <internal-source-id>

# only when reviewed promotion is required and accepted
pnpm pactwright intelligence promote <internal-source-id>

pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright operations corrective-roadmap
```

There is no automatic candidate promotion. If the evidence justifies accepting, rejecting or modifying the candidate, capture that outcome through normal Kakeibo Delivery/governance.

If a user-facing comparison is justified by the current Kakeibo spec and hard gates pass, create a **new** Experiment contract for a limited canary or A/B stage. For Kakeibo user-facing A/B assignment, preserve the repository-defined stable assignment rule (for example the accepted `hash(experiment_id + stable_subject_id)` rule) and predeclare rollback/guardrails before exposure. Do not create a user-facing experiment merely to satisfy this checkpoint.

Demonstrate one rollback drill selecting the smallest failing layer from the Kakeibo-owned recovery options:

```text
previous KeiRelease
previous model route
disable one optional Kei task
deterministic fallback
```

Core financial workflows must remain usable without Kei.

**Expected result**

The complete loop is proven:

```text
Delivery Evidence
→ exact active/candidate Deployments
→ immutable predeclared Experiment
→ bounded external evidence
→ Observation
→ PI Source
→ governed accept/reject/change decision
→ normal Delivery when required
```

**Verify before continuing**

- Observation uses `observes` to the exact Experiment id/hash;
- raw samples/financial prompts/responses are absent from Pactwright graph state;
- guardrail breaches and uncertainty are preserved;
- a favourable result did not automatically mutate/promote the candidate;
- any canary/A-B follow-on is a distinct immutable Experiment with stable assignment where required;
- the rollback drill restores the smallest appropriate layer and leaves core financial workflows usable;
- rollback can distinguish behavioural KeiRelease rollback from model-route rollback where practical;
- the complete lineage reaches PI/Delivery only through normal governance.

## Stage 10 — Capture checkpoint feedback

### Step 29 — Route Checkpoint 6 findings into project truth

**References:** Implementation Principles §§7, 14; Project Intelligence §8; Experiment §15

**Run**

From the Pactwright repository root:

```text
Record material findings from building, adopting, releasing and using Operations/Experiment in this checkpoint — defects, obstructive ceremony, installation problems, content gaps, evaluation gaps, unsafe defaults, false conclusions or missing generic semantics from both the Pactwright website and Kakeibo experiment — as Project Intelligence Sources. Distinguish Kakeibo-specific Kei choices from evidence of a generic Pactwright Operations responsibility failure. Do not promote KeiRelease/model-route/task/benchmark concepts into Pactwright graph semantics unless independent cross-domain evidence later justifies them.
```

For each retained feedback Source:

```bash
pnpm pactwright intelligence ingest <feedback-source-path>
pnpm pactwright intelligence triage <feedback-source-id>

# only when reviewed promotion is required and accepted
pnpm pactwright intelligence promote <feedback-source-id>

pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright operations corrective-roadmap
```

**Expected result**

Checkpoint learning becomes durable governed evidence without product-specific leakage into generic Operations semantics.

**Verify before continuing**

Each blocking finding traces to a Source and triage outcome; no blocking failure is carried silently into Checkpoint 7; the Experiment abstraction still contains no Kakeibo/Kei-specific canonical fields.

## Exit gate

Checkpoint 6 is complete only when all of the following hold:

1. `@pactwright/operations` installs as a sibling extension requiring PI only and registers native `Deployment`, `Experiment` and `Observation` state without changing Delivery semantics.
2. Deployment remains distinct from Delivery Evidence, immutable and exact; isolated/shadow Deployment does not imply user visibility.
3. `record-experiment` creates immutable predeclared Experiment contracts over exact control/candidate exposure ids/hashes, validates mode/hypothesis/metrics/guardrails/assignment/minimum evidence/decision rule/constraints and provides no promotion command.
4. Raw telemetry, analytics rows, experiment assignments/samples, prompts, responses and private financial grounding remain external; Operations execution provenance is not Project Graph state.
5. Observation grounding, causality, uncertainty, deduplication and supersession rules hold for both Deployment and Experiment exposures, including `Observation --observes--> Experiment`.
6. Operational/experiment meaning enters PI only through Observation → internal Source; the corrective roadmap remains a revision-stamped filtered PI view that creates no Intents and changes no priority.
7. `operations-analysis` ships in the first-party complete pack with Deployment and Experiment evaluation cases passing; a non-Kakeibo fixture proves the Experiment schema/commands contain no Kei-specific fields.
8. Bounded Operations context reaches Delivery without raw telemetry/experiment samples, and GitHub automation validates/projects Experiment state without owning canonical contracts or promotion; the dedicated Experiments Project view remains deferred to CP8.
9. The Pactwright website proves a real governed Deployment → Observation → PI → Delivery path independently of Kakeibo.
10. The Operations learning path documents both production feedback and generic controlled Experiment semantics from accepted project truth.
11. `0.0.6` is published, registry-verified and installed in Kakeibo.
12. Kakeibo records exact active/candidate Kei Deployments, then records an immutable predeclared shadow Experiment referencing those exact exposure hashes while KeiRelease/model-route semantics remain Kakeibo-owned.
13. Kakeibo shadow execution preserves same grounding where required, never exposes candidate output to users, cannot mutate/side-effect, cannot delay the active response and minimises raw financial trace retention.
14. The Kakeibo Experiment produces bounded Observation/PI evidence without automatic promotion; any justified user-facing canary/A-B is a separate controlled Experiment with stable assignment and unchanged financial/privacy/user-authority/advice invariants.
15. Kakeibo demonstrates a smallest-layer rollback drill and core financial workflows remain usable without Kei.
16. Checkpoint feedback is captured as governed Sources with no blocking failure carried into Checkpoint 7 and no Kakeibo-specific release artefacts promoted into Pactwright graph types.

---

**Pactwright — Checkpoint 6 — Production Learning v12**
