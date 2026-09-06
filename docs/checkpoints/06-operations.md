# Pactwright — Checkpoint 6 — Operations

**Version:** 12  
**Entry condition:** Checkpoint 5 is accepted.  
**Release:** `0.0.6`  
**Exit capability:** Pactwright and Kakeido can record real software exposure, collect bounded operational evidence, create durable Observations, route every Observation through Project Intelligence, and derive corrective Delivery candidates without turning Operations into a telemetry store or second roadmap.

## 1. Goal

Implement Operations as the next independent Pactwright Extension:

```text
Evidence
→ operational exposure
→ bounded operational evidence
→ Observation
→ Project Intelligence Source
→ governed meaning / candidate
→ explicit Intent
→ normal Delivery
```

Checkpoint 6 proves the generic exposure model with native `Deployment` plus a fixture Extension-contributed exposure type. Real Publication feedback is exercised in Checkpoint 7.

## 2. Canonical baseline

Canonical Pactwright semantics come from:

- [01 — Core System and Lifecycle](../specs/01-pactwright-core-system-and-lifecycle.md)
- [02 — Distribution, Agent Packs, Extensions and Evaluation](../specs/02-distribution-agent-packs-extensions-and-evaluation.md)
- [03 — Project Intelligence](../specs/03-project-intelligence.md)
- [04 — Graph Review](../specs/04-graph-review.md)
- [05 — Assets and Publication](../specs/05-assets-and-publication.md)
- [06 — Operations](../specs/06-operations.md)
- [07 — GitHub Integration](../specs/07-github-integration.md)
- [08 — Open-Source Project Organisation](../specs/08-open-source-project-organisation.md)
- [Implementation Principles](./00-implementation-principles.md)
- [Implementation Guide](./00-implementation-guide.md)

Research logs are rationale only.

Kakeido acceptance uses the current canonical Kakeido specifications in the Kakeido repository.

## 3. Execution contract

Every implementation action follows:

```text
Step
→ References
→ Run
→ Expected result
→ Verify before continuing
```

Default execution location is the Pactwright repository root unless a step names Kakeido or a fixture.

For repository/code changes:

```bash
pnpm verify
```

Before newly implemented repository-local commands:

```bash
pnpm build
```

After Checkpoint 2, coherent changes land through pull requests and required checks.

## 4. Checkpoint scope

Checkpoint 6 implements:

```text
@pactwright/operations
operations-analysis capability in the selected first-party Agent Pack
Deployment
registered operational exposure discovery
fixture Extension-contributed exposure compatibility
operational sources and environments
bounded collection
Operations execution provenance
Observation
Observation → PI Source hand-off
corrective roadmap projection
Operations validation/evaluation
pactwright-operations.yml
real Pactwright software Operations loop
real Kakeido software Operations loop
```

### Open gaps that remain open

Do not silently invent:

- exact Deployment event identity distinguishing retry from genuine redeployment/rollback;
- exact Observation identity/deduplication key for semantic equivalence;
- durable retention policy for mutable/expiring external evidence locators;
- exact persistence/lifetime of bounded evidence between `ingest` and `observe`;
- exact pinned corrective-roadmap CLI syntax.

Implement the canonical behaviours around those gaps and fail conservatively where exact identity cannot be established.

## Stage 1 — Package Operations and its capability

### Step 1 — Create `@pactwright/operations`

**References:** Specs 02 and 06 Extension boundaries.

**Run**

```text
Using self-hosted Pactwright Delivery, create `@pactwright/operations` as a publishable first-party Extension package.

Its manifest must:
- require Project Intelligence;
- register Deployment and Observation canonical record types;
- register `Evidence --deployed-as--> Deployment` and `Observation --observes--> operational exposure` relationships;
- register the `operations` runtime namespace;
- require exactly the distinct Pactwright capability `operations-analysis`;
- register the Operations GitHub profile;
- not depend on Graph Review or Assets / Publication.
```

**Expected result**

Operations is independently installable and depends only on PI for durable consequence governance.

**Verify before continuing**

Exercise Extension add/remove/dependency fixtures and confirm Graph Review/Assets are not dependencies.

### Step 2 — Add `operations-analysis` to `@pactwright/standard`

**References:** Specs 02 and 06 capability boundary.

**Run**

```text
Extend `@pactwright/standard` to provide `operations-analysis`.

The capability performs bounded interpretation of already collected operational evidence:
- compare with relevant baselines;
- correlate with registered exposures;
- distinguish noise from durable findings;
- preserve uncertainty;
- avoid unsupported causal claims;
- propose concise candidate Observations.

Do not require Production Skills or Deep Research Skills merely because they might help a particular project. Deterministic collection, hashing, exposure resolution, schema validation, dedup mechanics, graph mutation, PI hand-off and report generation remain runtime-owned.
```

**Expected result**

The existing selected first-party pack satisfies Operations without introducing another Agent Pack.

**Verify before continuing**

A fixture pack lacking `operations-analysis` must fail Operations activation without changing the valid environment.

## Stage 2 — Implement operational exposure semantics

### Step 3 — Implement immutable Deployment and `record-deployment`

**References:** Spec 06 Deployment/failure/idempotency.

**Run**

```text
Implement Deployment schema/validation and:

pactwright operations record-deployment <evidence-id>

Require valid Delivery Evidence plus configured environment, exact deployed artifact identity, deployment time and actor. Create `Evidence --deployed-as--> Deployment`.

A genuine redeployment/rollback/new deployment event creates a distinct immutable Deployment.
A retry of the same deployment event must be idempotent.

Do not invent a universal event-id algorithm. Where the available trusted deployment event cannot establish whether a call is retry or genuinely new exposure, fail/report ambiguity rather than silently choosing.
```

**Expected result**

Delivery success and production exposure are distinct canonical facts.

**Verify before continuing**

Test invalid Evidence, missing artifact/environment, same-event retry, explicit distinct redeployment and immutable historical Deployment.

### Step 4 — Implement generic operational exposure registration/discovery

**References:** Spec 06 Production Exposure; Spec 02 Extension manifests.

**Run**

```text
Implement the generic contract by which an enabled Pactwright Extension may declare one of its canonical record types as Operations-compatible exposure state.

Operations resolves registered compatible exposure types from enabled Extension metadata rather than hard-coding Publication or future types.

Validation requires:
- the contributed type is canonical and owned by the contributing Extension;
- enough stable identity/hash information exists for an Observation to reference the exact exposure;
- disabling the contributing Extension makes that exposure type unavailable without copying its records into Operations.

Prove the mechanism with a fixture Extension type. Do not make Assets / Publication depend on Operations in this checkpoint.
```

**Expected result**

Operations supports native Deployment and future sibling-owned exposure types through one generic registration boundary.

**Verify before continuing**

Use native Deployment plus a fixture Extension-contributed exposure. Adding the fixture type must require no Operations engine change.

## Stage 3 — Implement bounded evidence collection

### Step 5 — Implement source/environment configuration and adapters

**References:** Spec 06 Operational Sources/Adapters.

**Run**

```text
Implement `.pactwright/operations/sources/` and `.pactwright/operations/environments/` plus a source adapter contract.

Provider-specific settings belong in adapters/configuration. Credentials never enter canonical Operations records.
Adding an operational data source must not require new Project Graph semantics.
```

**Expected result**

Operational integrations are pluggable without making Pactwright an observability provider registry.

**Verify before continuing**

Add one initial adapter plus a fixture second adapter and run conformance/schema tests.

### Step 6 — Implement Operations execution provenance and `ingest`

**References:** Spec 06 collection/execution provenance/commands.

**Run**

```text
Implement immutable execution provenance for every collection attempt and:

pactwright operations ingest [<source-id>]

Record at least:
- operation/source;
- Project Graph revision;
- bounded evidence window;
- relevant exposure identities;
- external evidence locators;
- status/failure.

Raw logs/traces/metrics/analytics/support payloads remain external and are never Project Graph nodes.
A successful ingest may create no canonical mutation.
A source/authentication failure records failed provenance and mutates no canonical state.

Do not prematurely prescribe the long-term storage mechanism for bounded evidence passed to `observe`.
```

**Expected result**

Collection is retryable/auditable without graph pollution.

**Verify before continuing**

Run successful/no-finding and failed-source fixtures with high-volume raw input and confirm raw events never appear as canonical records.

## Stage 4 — Implement Observation and PI governance

### Step 7 — Implement Observation schema and relationship

**References:** Spec 06 Observation/correlation/causality.

**Run**

```text
Implement immutable Observation semantics including:
- exact registered exposure id/hash;
- evidence window;
- factual finding;
- direction;
- operational significance;
- confidence;
- evidence source/locator/summary;
- relevant baseline where comparison is required;
- `Observation --observes--> exposure`.

Preserve uncertainty and reject unsupported causal claims.
Operational significance must not determine PI consequence class, Knowledge status or roadmap priority.
```

**Expected result**

Operations compresses high-volume evidence into concise durable facts.

**Verify before continuing**

Exercise negative, positive, mixed/neutral, baseline-dependent and unsupported-causality fixtures.

### Step 8 — Implement bounded deduplication/supersession without over-specifying identity

**References:** Spec 06 Observation identity/deduplication gap.

**Run**

```text
Implement the required outcomes:

new durable meaning
→ create Observation

same durable meaning + more evidence
→ retain/match existing Observation

materially changed meaning
→ create new Observation
→ explicit supersession where appropriate

Use deterministic duplicate checks only where identity can be established safely. Where semantic equivalence requires `operations-analysis`, keep that judgement explicit and covered by evaluation.

Do not canonise an exact universal Observation dedup key in this checkpoint.
```

**Expected result**

Repeated monitoring does not create uncontrolled duplicates while history remains immutable.

**Verify before continuing**

Exercise exact retry, same-meaning/new-evidence and changed-meaning fixtures and retain evidence provenance even when no new Observation is created.

### Step 9 — Implement `observe` and Observation → PI Source hand-off

**References:** Specs 03 and 06 internal Source boundary.

**Run**

```text
Implement:

pactwright operations observe [<source-id>]

Use `operations-analysis` only for bounded interpretation. Runtime owns deterministic exposure resolution, validation and mutation.

For every canonical Observation, invoke PI internal Source ingestion preserving:
- Observation id/hash;
- exposure id/hash;
- evidence locators;
- originating Operations execution.

The Observation is a canonical Operations record and must be represented as canonical-record provenance, unlike Graph Review Findings.

If PI hand-off fails, preserve the valid Observation and retry hand-off without rerunning collection/analysis.
```

**Expected result**

Every durable operational fact enters the same PI governance path without ownership transfer.

**Verify before continuing**

Run no-Observation, Observation-created, matched-Observation, failed-hand-off and retry fixtures. No failed hand-off invalidates the Observation.

## Stage 5 — Implement derived corrective work and validation

### Step 10 — Implement `refresh`

**References:** Spec 06 commands/failure semantics.

**Run**

```text
Implement:

pactwright operations refresh

Compose configured ingest + observe for eligible sources. One unavailable source must not invalidate existing Operations truth. Every collection/analysis attempt retains execution provenance.
```

**Expected result**

Operations can execute its configured bounded feedback loop safely.

**Verify before continuing**

Run success, no-finding, partial-source-failure and complete-source-failure fixtures.

### Step 11 — Implement corrective roadmap projection

**References:** Specs 03 and 06 corrective roadmap.

**Run**

```text
Implement:

pactwright operations corrective-roadmap

Generate `docs/operations/reports/corrective-intent-roadmap.md` as a filtered projection of existing PI intent candidates whose motivation traces to Operations provenance.

Reuse PI candidate readiness/ordering. Do not create a second candidate set or priority model. Report entries are candidates, not canonical Intents.
Record the current Project Graph revision used to generate the report.

Do not invent the exact pinned-regeneration CLI syntax; leave that interface unresolved while preserving the semantic requirement that generated reports identify their revision.
```

**Expected result**

Operations can show corrective candidates without becoming a roadmap engine.

**Verify before continuing**

Mix operational/non-operational PI candidates and confirm only the former appear; editing the report changes no canonical state.

### Step 12 — Implement `operations validate`

**References:** Spec 06 validation.

**Run**

```text
Implement:

pactwright operations validate

Enforce Deployment, registered-exposure, Observation, source/environment, execution provenance, PI hand-off and cross-owner relationship invariants.

Core `pactwright validate` invokes Operations validation when enabled.
```

**Expected result**

Operations fails closed without conflating external telemetry availability with canonical validity.

**Verify before continuing**

Create one invalid fixture per major validation category. Existing valid Deployment/Observation truth must remain valid when a source is temporarily unavailable.

### Step 13 — Add bounded Operations context contribution

**References:** Specs 01, 03 and 06 context boundary.

**Run**

```text
Add a namespaced Operations contribution to the runtime context-assembly API used by Delivery/Agent Packs.

Include only relevant prior Deployments, Observations, accepted operational Knowledge and corrective provenance for the active work.
Never preload raw telemetry or complete operational history.

Do not reintroduce `pactwright context` as a required public CLI.
```

**Expected result**

Future Delivery can use relevant production history without unbounded operational context.

**Verify before continuing**

A fixture active lineage receives relevant operational context while unrelated Deployments/Observations/raw evidence remain absent.

## Stage 6 — Evaluation and GitHub automation

### Step 14 — Add Operations evaluation cases

**References:** Specs 02 and 06 evaluation.

**Run**

```text
Add `operations-analysis` evaluation cases covering:
- signal compression;
- correct exposure attribution;
- baseline interpretation;
- unsupported-causality avoidance;
- duplicate handling;
- positive finding recognition;
- PI routing;
- scope discipline.

Prefer deterministic assertions where possible and report semantic dimensions individually.
```

**Expected result**

Operations AI responsibility failures are measurable without a domain benchmark framework.

**Verify before continuing**

Run `pnpm pactwright eval` and inspect Operations cases individually.

### Step 15 — Implement Operations GitHub profile/workflow

**References:** Spec 07 Operations automation/checks/views.

**Run**

```text
Implement the Operations GitHub profile and generated:

.github/workflows/pactwright-operations.yml

Use the exact checks:
- Pactwright / Operations
- Pactwright / Operations Views

Project durable Deployments/Observations/corrective candidates only. Never mirror raw telemetry.
Workflow YAML invokes runtime commands rather than reimplementing Operations semantics.
```

**Expected result**

Operations can run/project remotely as a thin Pactwright execution surface.

**Verify before continuing**

Run local sync plus `github sync --dry-run` and inspect least privilege, frozen install, SHA pinning, bounded timeout/concurrency and absence of raw payload projection.

## Stage 7 — Adopt Operations in Pactwright

### Step 16 — Enable Operations from the workspace

**Run**

```bash
pnpm build
pnpm pactwright extension add operations
pnpm pactwright sync
pnpm pactwright operations validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
pnpm pactwright validate
```

**Expected result**

Pactwright runs Operations before release.

**Verify before continuing**

PI dependency and `operations-analysis` capability resolve; second local/remote sync converges.

### Step 17 — Record a real Pactwright software Deployment

**Run**

Use an existing successful Pactwright Delivery Evidence whose software/website output has actually been deployed. Execute the real deployment mechanism first, then:

```bash
pnpm pactwright operations record-deployment <evidence-id>
pnpm pactwright operations validate
```

**Expected result**

The real production exposure is distinct from its Delivery Evidence.

**Verify before continuing**

Trace exact environment/artifact identity and confirm the same trusted event retry does not create a duplicate Deployment.

### Step 18 — Configure and run one real Pactwright operational source

**Run**

Configure the smallest bounded evidence source for the deployed surface, then:

```bash
pnpm pactwright operations ingest <source-id>
pnpm pactwright operations observe <source-id>
pnpm pactwright operations validate
```

If an Observation is produced, triage its printed PI Source id:

```bash
pnpm pactwright intelligence triage <internal-source-id>
```

**Expected result**

A real production signal either legitimately yields no Observation or produces an Observation governed through PI.

**Verify before continuing**

No raw telemetry enters the Project Graph and no Observation directly creates an Intent.

## Stage 8 — Publish Operations learning material

### Step 19 — Deliver Operations docs/example/Academy material

**References:** Spec 08 Operations milestone.

**Run**

Through normal Delivery, update the smallest useful set:

```text
Operations concept/guide
one executable production-feedback example
Academy Operations/production-learning lesson
public capability summary
```

Use accepted PI grounding for public project claims and actual Checkpoint 6 behaviour.

**Expected result**

Users can understand Evidence vs Deployment, raw telemetry vs Observation, and Observation → PI governance.

**Verify before continuing**

Run Graph Review over the resulting public material and route Findings through PI.

## Stage 9 — Release `0.0.6`

### Step 20 — Publish the compatible family

**References:** Implementation Guide npm release model.

**Run**

Prepare and publish the compatible `0.0.6` package family. The new package is:

```text
@pactwright/operations@0.0.6
```

Existing first-party packages also release as compatible `0.0.6`, including `@pactwright/standard` with `operations-analysis`.

Bootstrap only the new Operations package's first npm publication/trusted publisher.

**Verify before continuing**

```bash
pnpm view pactwright@0.0.6 version
pnpm view @pactwright/standard@0.0.6 version
pnpm view @pactwright/project-intelligence@0.0.6 version
pnpm view @pactwright/graph-review@0.0.6 version
pnpm view @pactwright/assets-publication@0.0.6 version
pnpm view @pactwright/operations@0.0.6 version
```

All return `0.0.6`.

## Stage 10 — Prove Operations on Kakeido

### Step 21 — Upgrade Kakeido to the `0.0.6` family

**Run**

Install the exact compatible package family, then use the explicit ownership-specific upgrades:

```bash
pnpm pactwright upgrade --to 0.0.6
pnpm pactwright agent-pack upgrade
pnpm pactwright extension upgrade project-intelligence
pnpm pactwright extension upgrade graph-review
pnpm pactwright extension upgrade assets-publication
pnpm pactwright extension add operations
pnpm pactwright sync
pnpm pactwright operations validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
pnpm pactwright validate
```

**Expected result**

Kakeido runs the exact `0.0.6` environment with Operations enabled.

### Step 22 — Record and observe one real Kakeido software exposure

**Run**

Using current Kakeido canonical specs and its existing deployment mechanism:

```text
complete one real governed Delivery
→ deploy the accepted Evidence
→ pactwright operations record-deployment <evidence-id>
→ configure one bounded operational source
→ pactwright operations ingest <source-id>
→ pactwright operations observe <source-id>
```

Triage any Observation-derived Source through PI.

**Expected result**

Kakeido proves the same software exposure → Observation → PI path without Pactwright-specific assumptions.

**Verify before continuing**

Run Kakeido repository tests plus Pactwright/PI/Operations validation. Confirm raw operational data and credentials remain external.

## Stage 11 — Capture checkpoint feedback

### Step 23 — Govern material Operations findings

**Run**

Ingest material checkpoint defects/friction through Pactwright PI, including deployment ambiguity, source-adapter issues, evidence-retention problems, Observation-quality failures and context problems.

Distinguish project-specific operational choices from repeatable Pactwright responsibility failures. Add evaluation candidates where justified; do not automatically create Intents.

**Expected result**

Checkpoint learning remains governed without prematurely defining the open Deployment/Observation identity gaps.

## Exit gate

Checkpoint 6 closes only when:

- `@pactwright/operations` exists and requires PI but not Graph Review/Assets;
- `@pactwright/standard` provides `operations-analysis`;
- Deployment is immutable and same-event retry is idempotent without inventing a universal event identity;
- generic Extension-contributed exposure registration/discovery works using a fixture type;
- raw operational evidence remains external;
- every collection/analysis attempt has execution provenance;
- insufficient evidence may legitimately create no Observation;
- Observation dedup/supersession satisfies canonical outcomes without canonising an unsupported universal key;
- every canonical Observation enters PI as canonical-record provenance;
- failed PI hand-off leaves Observation valid/retryable;
- corrective roadmap is a PI-derived candidate projection, not a second roadmap;
- bounded Operations context uses the runtime context contribution seam, not a new public `context` CLI;
- Operations evaluation and GitHub automation use the runtime;
- Pactwright and Kakeido both prove real software exposure feedback;
- `@pactwright/operations@0.0.6` and the compatible family are registry verified;
- external-evidence durability, ingest→observe persistence and pinned-roadmap CLI remain explicit gaps rather than accidental checkpoint semantics;
- no known blocking failure enters Checkpoint 7.

---

**Pactwright — Checkpoint 6 — Operations v12**
