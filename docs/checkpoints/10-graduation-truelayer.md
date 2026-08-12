# Pactwright — Graduation — TrueLayer

**Version:** 8 
**Entry condition:** Checkpoint 9 is accepted and a dedicated Kakeido TrueLayer integration specification exists. 
**Exit capability:** TrueLayer is added as a second financial-data source without semantic drift and the new integration is observed in production.

## 1. Goal

Use the complete Pactwright system on a materially different external integration while preserving Kakeido canonical financial/review/assistant semantics.

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

**Default execution location:** the Kakeido repository root

For repository/code changes, finish with `pnpm verify`. Before invoking a newly implemented Pactwright runtime command during implementation, run `pnpm build` so the repository-local CLI is not using stale distribution output.

After Checkpoint 2 activates GitHub, land coherent repository changes through pull requests and required checks rather than direct default-branch commits.

Dynamic ids such as `<source-id>`, `<brief-id>` and `<evidence-id>` must come from an earlier command in the runbook. Commands that create or resolve durable records must print the ids required by later steps.

Fixture verification means repository test fixtures unless a step explicitly creates a real repository or GitHub resource.

## 4. Checkpoint specification map

- **Existing ingestion boundary** — Kakeido — Tech Stack Engineering Spec §§8–9
- **Financial semantics** — Kakeido — Financial Model Spec §§2–17
- **Product/review semantics** — Kakeido — Product & UX Spec §§2–10
- **Mobile semantics** — Kakeido — Mobile Design Spec §§5–18
- **Kei authority** — Kei — Assistant Spec §§6–14
- **Full Pactwright loop** — PI/Review/Delivery/Operations owning specs

## Stage 1 — Ingest/govern the TrueLayer specification

Do not begin implementation from provider assumptions outside an accepted Kakeido spec.

### Step 1 — Ingest the dedicated integration spec

**References:** PI §§8–11

**Run**

```bash
pnpm pactwright intelligence ingest "<Kakeido-TrueLayer-spec-path>"
pnpm pactwright intelligence triage <source-id>
```

**Expected result**

The integration spec enters normal PI governance.

**Run**

```bash
# only when triage requires reviewed promotion and the proposal is accepted
pnpm pactwright intelligence promote <source-id>

pnpm pactwright intelligence onboard
pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright intelligence validate
pnpm pactwright validate
```

**Verify before continuing**

The integration specification is represented as governed project knowledge/candidates and has not created a Delivery Intent automatically.

### Step 2 — Review integration impact

**References:** Review & Creative §7

**Run**

```bash
pnpm pactwright review run architecture-reviewer
pnpm pactwright review run product-strategist
pnpm pactwright review run ux-researcher
pnpm pactwright review run graph-auditor
```

**Expected result**

Architecture/product/UX contradictions are surfaced before Delivery.

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

Every accepted integration concern is traceable to Review evidence and PI governance.

## Stage 2 — Deliver the second ingestion source

Run the TrueLayer implementation on a Kakeido feature branch. Merge only after the existing Kakeido CI/Pactwright checks pass.

Add provider-specific ingestion behind the canonical Kakeido boundary.

### Step 3 — Capture/deliver the accepted TrueLayer outcome

**References:** Financial semantics §§6–17; Tech Stack §§3,7–10


**Run**

```text
/capture-intent "Add TrueLayer as an additional Kakeido financial-data source behind the canonical ingestion/normalisation boundary defined by the accepted TrueLayer specification."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Expected result**

CSV and TrueLayer feed compatible canonical spending semantics rather than separate downstream models.

**Verify before continuing**

Run Kakeido tests for source equivalence, duplicates, reviewed state and canonical financial invariants.

## Stage 3 — Deploy and observe TrueLayer

Use the full production feedback loop on the new integration.

### Step 4 — Deploy the TrueLayer integration

**References:** Operations §7; Kakeido Tech Stack release strategy

**Run**

```text
Execute Kakeido's existing deployment/release mechanism for the accepted TrueLayer Evidence in the configured operational environment. Report the Evidence id plus deployed artifact revision/locator. Do not introduce a provider-specific release path.
```

**Run**

```bash
pnpm pactwright operations record-deployment <evidence-id>
pnpm pactwright operations validate
```

**Expected result**

The TrueLayer Delivery has a canonical Deployment tied to exact Evidence.

**Verify before continuing**

Deployment identity is exact and raw TrueLayer payloads are absent from canonical graph state.

### Step 5 — Observe and govern TrueLayer production evidence

**References:** Operations §§8–15; PI §§8, 11, 14

**Run**

```bash
pnpm pactwright operations ingest <source-id>
pnpm pactwright operations observe <source-id>
pnpm pactwright operations validate
pnpm pactwright intelligence triage <internal-source-id>

# only when triage requires reviewed promotion and the proposal is accepted
pnpm pactwright intelligence promote <internal-source-id>

pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright operations corrective-roadmap
```

**Expected result**

The new provider integration is production-traceable and governed like prior Kakeido work.

**Verify before continuing**

Inspect the Observation evidence and confirm raw provider payloads are not Project Graph state.

## Exit gate

Equivalent CSV/TrueLayer inputs converge on compatible canonical Kakeido semantics; source-specific behaviour does not leak into unrelated review/Kei/domain layers; production feedback follows Operations → PI → Delivery without storing sensitive raw payloads in the Project Graph.

---

**Pactwright — Graduation — TrueLayer v8**