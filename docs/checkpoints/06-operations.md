# Pactwright — Checkpoint 6 — Operations

**Version:** 3 
**Entry condition:** Checkpoint 5 is accepted. 
**Exit capability:** Software production exposure and durable operational findings feed governed future work through Operations → PI → Delivery.

## 1. Goal

Implement Operations for software exposure first, use the Pactwright website as the first self-hosted production surface, then prove the same feedback path on Kakeido.

## 2. Specification baseline

- `Pactwright — Delivery Graph and Lifecycle Engineering Spec v5`
- `Pactwright — Distribution, Agents and Evaluation v5`
- `Pactwright — GitHub Actions and Views v5`
- `Pactwright — Project Intelligence Graph Engineering Spec v3`
- `Pactwright — Graph Review & Creative Delivery Engineering Spec v3`
- `Pactwright — Operations Graph Engineering Spec v1`
- `Pactwright — System Architecture v2`
- `Pactwright — Implementation Principles v1`
- `Pactwright Open-Source Project Organisation`
- `Pactwright website engineering/design specification`
- `Kakeido — Financial Model Spec v1`
- `Kakeido — Product & UX Spec v2`
- `Kakeido — Mobile Design Spec v1`
- `Kei — Assistant Spec v2`
- `Kakeido — Tech Stack Engineering Spec v1`

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

## 4. Checkpoint specification map

- **Operations boundary/exposure/deployment** — Operations v1 §§1–7
- **Sources/execution/Observation** — Operations §§8–12
- **PI hand-off/corrective roadmap/context/commands** — Operations §§13–20
- **Evaluation/validation/failure/GitHub/build order** — Operations §§21–27
- **Kakeido evidence sources/privacy** — Tech Stack §11, §§17–18

## Stage 1 — Package Operations and implement Deployment

Record which delivered software actually reached an environment.

### Step 1 — Implement Operations manifest/layout/dependency

**References:** Operations §§4–5; Distribution §§4–5

**Run**

```text
Implement @pactwright/operations manifest and repository layout: require Project Intelligence, register Deployment/Observation, deployed-as/observes, operations namespace, operations-analysis capability and Operations GitHub profile. Do not depend on Review & Creative.
```

**Expected result**

Operations is an independently installable sibling extension requiring PI only.

**Verify before continuing**

Use fixture extension add/remove tests; confirm PI auto-resolves and Review & Creative is not required.

### Step 2 — Implement immutable Deployment and `record-deployment`

**References:** Operations §7, §19

**Run**

```text
Implement Deployment schema/validation and pactwright operations record-deployment <evidence-id>. Require valid Delivery Evidence, configured environment, identifiable artifact revision/locator/hash, deployed_at and deployed_by. Create evidence --deployed-as--> deployment. Repeated deployments are distinct immutable records.
```

**Expected result**

Delivery Evidence and production exposure are explicitly distinct.

**Verify before continuing**

Run fixtures for invalid Evidence, missing environment/artifact, repeated deployment and no Evidence mutation.

## Stage 2 — Implement bounded operational collection

Connect external systems without turning Pactwright into a telemetry store.

### Step 3 — Implement operational source adapter contract/config

**References:** Operations §8

**Run**

```text
Implement .pactwright/operations/sources and environments configuration plus a source adapter contract. Provider-specific settings live in adapters; credentials never live in canonical records. Adding a source adapter must not change graph semantics.
```

**Expected result**

Operational sources are pluggable and configuration-driven.

**Verify before continuing**

Run source-schema/conformance fixtures for one initial adapter.

### Step 4 — Implement bounded evidence collection + execution provenance

**References:** Operations §§9–10

**Run**

```text
Implement bounded collection windows and immutable Operations execution records containing source, graph revision, window, exposures, evidence locators, observations created/matched and status. Raw log/trace/metric/analytics/support payloads remain external and are never Project Graph nodes.
```

**Expected result**

Collection provenance is retained without graph pollution.

**Verify before continuing**

Run a fixture returning many raw events and inspect that canonical graph contains none of them.

### Step 5 — Expose `operations ingest`

**References:** Operations §19

**Run**

```text
Implement pactwright operations ingest [<source-id>] over the collection layer. Ingest may complete successfully with no Observation/canonical graph mutation. Authentication/source failure records execution failure and leaves canonical graph untouched.
```

**Expected result**

Evidence collection is independently executable/retryable.

**Verify before continuing**

Run successful/no-finding and failed-auth fixtures.

## Stage 3 — Implement durable Observation semantics

Compress operational signals into concise facts worth retaining.

### Step 6 — Implement Observation schema/grounding

**References:** Operations §11

**Run**

```text
Implement Observation schema/validation: exposure id/hash, evidence window, factual finding, direction, significance, confidence, evidence source/locator/summary and optional baseline plus observation --observes--> exposure. Preserve uncertainty and prohibit unsupported causal claims.
```

**Expected result**

An Observation is a concise durable operational fact tied to evidence and exact exposure.

**Verify before continuing**

Run negative, positive, baseline-dependent and unsupported-causality fixtures.

### Step 7 — Implement Observation deduplication/supersession

**References:** Operations §12

**Run**

```text
Before creating an Observation, compare with relevant existing Observations. Same finding with new evidence creates no new canonical Observation unless meaning changed. Materially changed meaning creates a new Observation explicitly superseding the previous one.
```

**Expected result**

Repeated monitoring does not create uncontrolled graph growth.

**Verify before continuing**

Run repeated-identical and materially-changed finding fixtures.

### Step 8 — Expose `operations observe`

**References:** Operations §§19–20

**Run**

```text
Implement pactwright operations observe [<source-id>] using operations-analysis for bounded evidence interpretation. It may create/supersede concise Observations or legitimately create none. Deterministic source collection, validation, edge creation and graph mutation remain runtime-owned.
```

**Expected result**

Semantic analysis is bounded; deterministic mechanics stay in Pactwright.

**Verify before continuing**

Run one no-observation, one negative and one positive fixture.

## Stage 4 — Route operational meaning through PI

Close the governance boundary without letting Operations become a knowledge/roadmap engine.

### Step 9 — Implement Observation → PI internal Source hand-off

**References:** Operations §13; PI §14

**Run**

```text
Implement internal Source creation from meaningful Observations, preserving Observation id/hash, evidence locators, exposure and execution provenance. Operations must not directly create/edit Knowledge, Domains, Intents, Contracts or Briefs. Failed hand-off leaves Observation valid/retryable.
```

**Expected result**

Operational truth enters the same PI ingestion/governance path as other Sources.

**Verify before continuing**

Run a failed-hand-off fixture and confirm Observation remains valid and retryable.

### Step 10 — Implement corrective roadmap filter

**References:** Operations §§14–15; PI §11

**Run**

```text
Implement pactwright operations corrective-roadmap as a derived filter over Project Intelligence intent candidates whose accepted motivation traces to Operations. Reuse PI candidate ordering; do not create a second candidate set/priority model or canonical Intents.
```

**Expected result**

Operations can answer what corrective work production suggests without owning project prioritisation.

**Verify before continuing**

Run the command against PI candidates from operational/non-operational origins and inspect filtering/provenance.

### Step 11 — Implement `operations refresh` and `validate`

**References:** Operations §§19, 22–23

**Run**

```text
Implement pactwright operations refresh to compose configured ingest + observe and pactwright operations validate to enforce Deployment, Observation, source configuration, execution provenance and cross-graph rules. A successful refresh with no Observation is valid.
```

**Expected result**

Operations has a complete deterministic runtime surface.

**Verify before continuing**

Run refresh/validate on success, no-finding, source-failure and invalid-graph fixtures.

## Stage 5 — Add Operations GitHub automation

Run/visualise Operations remotely without mirroring telemetry.

### Step 12 — Implement Operations workflow/checks/views

**References:** GitHub §§8, 15, 24

**Run**

```text
Implement generated pactwright-operations.yml, Deployment recording hooks, source-config validation, scheduled refresh, Observation hand-off, corrective-roadmap regeneration, Pactwright / Operations and / Operations Views checks, and Deployments/Production Findings/Operations/Corrective Roadmap projections. Never write raw telemetry into GitHub/Pactwright graph.
```

**Expected result**

Operations remote automation remains a thin runtime projection/execution surface.

**Verify before continuing**

Run sync/dry-run and inspect that only durable records/derived summaries are projected.

## Stage 6 — Adopt Operations on the Pactwright website

Use the first real production surface to create immediate tool feedback.

### Step 13 — Install/reconcile Operations

**References:** Distribution §4; GitHub §8

**Run**

```bash
pnpm pactwright extension add operations
pnpm pactwright sync
pnpm pactwright operations validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

**Expected result**

Pactwright has Operations enabled and PI dependency resolved.

**Verify before continuing**

Run `pnpm pactwright validate`.

### Step 14 — Configure one real website environment/source

**References:** Operations §§5, 8, 18; website spec

**Run**

```text
Inspect the existing Pactwright website stack and configure the minimum .pactwright/operations environment + one bounded source using systems already adopted by the website. Do not add a new observability vendor, commit credentials or persist raw analytics/log payloads. Run operations validate after editing.
```

**Expected result**

The website has one real Operations source using existing infrastructure.

**Verify before continuing**

Run `pnpm pactwright operations validate` and inspect committed config for secrets/raw payloads.

### Step 15 — Record a real website deployment

**References:** Operations §7

**Run**

```bash
pnpm pactwright operations record-deployment <website-evidence-id>
pnpm pactwright operations validate
```

**Expected result**

A canonical Deployment identifies exact delivered Evidence/artifact/environment.

**Verify before continuing**

Inspect Deployment and deployed-as edge; Evidence bytes remain unchanged.

### Step 16 — Collect and analyse website evidence

**References:** Operations §§8–12, 19

**Run**

```bash
pnpm pactwright operations ingest <source-id>
pnpm pactwright operations observe <source-id>
pnpm pactwright operations validate
```

**Expected result**

The run creates execution provenance and zero or more durable Observations.

**Verify before continuing**

Inspect execution record and confirm raw source payloads are not graph nodes.

### Step 17 — Route one accepted Observation into future Delivery

**References:** Operations §§13–15; PI §11

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

## Stage 7 — Prove Operations on Kakeido

Exercise the same feedback loop against sensitive financial-product infrastructure.

### Step 18 — Install/reconcile Operations in Kakeido

**References:** Distribution §4

**Run**

```bash
pnpm add -D pactwright@<checkpoint-version>
pnpm pactwright extension add operations
pnpm pactwright sync
pnpm pactwright operations validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

**Expected result**

Kakeido has Operations with PI dependency resolved.

**Verify before continuing**

Run `pnpm pactwright validate`.

### Step 19 — Configure one safe Kakeido operational source

**References:** Kakeido Tech Stack §11; Operations §§8–10

**Run**

```text
Configure one Kakeido Operations source using existing Better Stack or Cloudflare evidence for failed imports, failed Workflows, API errors/latency, LLM failures or deployment markers. Do not log/store raw financial CSV contents, secrets, access tokens or unnecessary personal data. Run operations validate.
```

**Expected result**

Kakeido Operations observes product reliability without copying sensitive financial payloads.

**Verify before continuing**

Inspect source config/logging path and run `pactwright operations validate`.

### Step 20 — Run the Kakeido software feedback loop

**References:** Operations §§7–15

**Run**

```bash
pnpm pactwright operations record-deployment <evidence-id>
pnpm pactwright operations ingest <source-id>
pnpm pactwright operations observe <source-id>
pnpm pactwright operations validate
pnpm pactwright intelligence triage <internal-source-id>
```

**Expected result**

A real Kakeido exposure can yield governed production meaning.

**Verify before continuing**

If promotion is required, promote/derive roadmap and deliver one correction; also prove one positive Observation path during the checkpoint.

## Exit gate

Deployment remains distinct from Evidence; raw telemetry remains external; Observation dedup/causality rules hold; both projects prove at least one governed production-feedback path and the checkpoint includes both negative and positive Observation acceptance.

---

**Pactwright — Checkpoint 6 — Operations v3**
