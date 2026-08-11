# Pactwright — Graduation — TrueLayer

**Version:** 3 
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

## 4. Checkpoint specification map

- **Existing ingestion boundary** — Kakeido Tech Stack §§8–9
- **Financial semantics** — Financial Model §§2–17
- **Product/review semantics** — Product & UX §§2–10
- **Mobile semantics** — Mobile Design §§5–18
- **Kei authority** — Kei §§6–14
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

**Verify before continuing**

Promote if required, then run onboarding/intent-roadmap/validation.

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

**Verify before continuing**

Route every finding through PI and regenerate roadmap.

## Stage 2 — Deliver the second ingestion source

Add provider-specific ingestion behind the canonical Kakeido boundary.

### Step 3 — Capture/deliver the accepted TrueLayer outcome

**References:** Financial Model §§6–17; Tech Stack §§3,7–10

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

### Step 4 — Record deployment and run Operations

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

The new provider integration is production-traceable and governed like prior Kakeido work.

**Verify before continuing**

Promote/derive corrective work only when PI governance requires it; inspect that raw provider payloads are not Project Graph state.

## Exit gate

Equivalent CSV/TrueLayer inputs converge on compatible canonical Kakeido semantics; source-specific behaviour does not leak into unrelated review/Kei/domain layers; production feedback follows Operations → PI → Delivery without storing sensitive raw payloads in the Project Graph.

---

**Pactwright — Graduation — TrueLayer v3**
