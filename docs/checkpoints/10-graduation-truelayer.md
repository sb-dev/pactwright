# Pactwright — Graduation — TrueLayer

**Version:** 9 
**Entry condition:** Checkpoint 9 is accepted, Kakeido runs the exact accepted `0.1.0` registry packages, and a dedicated Kakeido TrueLayer integration specification exists. 
**Exit capability:** TrueLayer is added as a second financial-data source without semantic drift, the new integration is observed in production, and graduation findings are captured as governed Pactwright evidence.

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
- [Pactwright — Implementation Guide](./00-implementation-guide.md)
- [Pactwright Open-Source Project Organisation](../research-logs/2026-08-11-pactwright-open-source-project-organisation.md)
- [Design Specification: Astro + Cloudflare Workers + Meta CAPI](../research-logs/2026-08-11-astro-design-spec.md)
- [Kakeido — Financial Model Spec](../research-logs/2026-08-11-kakeido-financial-model-spec.md)
- [Kakeido — Product & UX Spec](../research-logs/2026-08-11-kakeido-product-and-ux-spec.md)
- [Kakeido — Mobile Design Spec](../research-logs/2026-08-11-kakeido-mobile-design-spec.md)
- [Kei — Assistant Spec](../research-logs/2026-08-11-kakeido-assistant-spec.md)
- [Kakeido — Tech Stack Engineering Spec](../research-logs/2026-08-11-kakeido-tech-stack-engineering-spec.md)

Only the owning specifications listed in each step define semantics. This runbook defines execution order, not new product meaning.

Once accepted through Stage 1, the dedicated Kakeido TrueLayer integration specification is the owning specification for provider-specific semantics: connect flow, consent, sync/webhook mechanics and provider error handling. This runbook does not define them.

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

**Default execution location:** the Kakeido repository root. Stage 4 runs from the Pactwright repository root.

For repository/code changes, finish with `pnpm verify`.

Land coherent repository changes through pull requests and required checks rather than direct default-branch commits.

Dynamic ids such as `<source-id>`, `<brief-id>` and `<evidence-id>` must come from an earlier command in the runbook. Commands that create or resolve durable records must print the ids required by later steps.

Fixture verification means repository test fixtures unless a step explicitly creates a real repository or GitHub resource.

## 4. Checkpoint specification map

- **Existing ingestion boundary** — Implementation Principles §16; Kakeido — Tech Stack Engineering Spec §§8–9
- **Financial semantics** — Kakeido — Financial Model Spec §§2–18
- **Security and privacy** — Kakeido — Tech Stack Engineering Spec §17
- **Product/review semantics** — Kakeido — Product & UX Spec §§2–10
- **Mobile semantics** — Kakeido — Mobile Design Spec §§5–18
- **Kei authority** — Kei — Assistant Spec §§6–14
- **Full Pactwright loop** — PI/Review/Delivery/Operations owning specs
- **Checkpoint closure** — Implementation Principles §§7, 13–14; Implementation Guide transition rule

## 5. Out of scope

- **Pactwright core, extension or agent-pack changes.** A Pactwright gap discovered during graduation is captured through Stage 4 and delivered as normal future Pactwright work (Implementation Principles §§14, 17). Do not modify the Pactwright runtime mid-graduation.
- **Provider mechanics not defined by the accepted TrueLayer specification.** Do not implement connect-flow UX, sync scheduling, webhook handling or consent behaviour from provider assumptions.
- **New Operations graph semantics.** Observing TrueLayer uses existing source-adapter and Observation semantics; adding an operational data source does not change Operations Graph semantics (Operations §3, invariant 14).

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

**References:** Review & Creative §§6–7

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

Every accepted integration concern is traceable to Review evidence and PI governance, and the accepted TrueLayer work appears as a derived intent-roadmap candidate with provenance to its motivating Knowledge and Sources.

## Stage 2 — Deliver the second ingestion source

Run the TrueLayer implementation on a Kakeido feature branch. Merge only after the existing Kakeido CI/Pactwright checks pass.

Add provider-specific ingestion behind the canonical Kakeido boundary (Implementation Principles §16).

If the accepted TrueLayer specification includes mobile connect-flow surfaces, mobile changes follow the Kakeido Mobile Design Spec and mobile delivery follows Tech Stack §14; they remain part of this same Delivery lineage.

### Step 3 — Capture/deliver the accepted TrueLayer outcome

**References:** Financial semantics §§6–18; Tech Stack §§3, 7–9, 12, 17

**Run**

```text
/capture-intent "Add TrueLayer as an additional Kakeido financial-data source behind the canonical ingestion/normalisation boundary defined by the accepted TrueLayer specification, satisfying the intent-roadmap candidate derived from that specification. Provider credentials, tokens and consent state are handled per Kakeido Tech Stack §17; raw provider payloads and secrets never appear in logs or canonical graph state."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

Capture the intent for the roadmap candidate derived in Stage 1 so the motivating Knowledge links to the Intent through `requires-delivery` and candidate provenance is preserved.

**Expected result**

CSV and TrueLayer feed compatible canonical spending semantics rather than separate downstream models.

**Verify before continuing**

Run `pnpm verify`. Run Kakeido tests for source equivalence, duplicates, reviewed state and canonical financial invariants against Financial Model §§15, 17–18.

### Step 4 — Verify canonical surfaces did not absorb provider semantics

**References:** Product & UX §4; Mobile §§7–11; Kei §§6, 9, 14; Review & Creative §§6–7

**Run**

```text
Complete one weekly review in the operational Kakeido build over spendings originating from both CSV and TrueLayer. Confirm review states, decision cards, group checks, Looks Safe and totals behave identically regardless of source, and that Kei explains patterns from reviewed evidence without provider-specific language or authority changes.
```

**Run**

```bash
pnpm pactwright review run architecture-reviewer
pnpm pactwright review run graph-auditor
```

For every internal Source id printed by the reviews, run triage/promotion as in Step 2, then `pnpm pactwright intelligence derive-intent-roadmap`.

**Expected result**

Review/Kei/mobile semantics show no source-specific behaviour; the regression review surfaces no new structural drift.

**Verify before continuing**

No review finding shows provider semantics leaking into review, Kei or domain layers; every accepted finding is traceable through PI governance.

## Stage 3 — Deploy and observe TrueLayer

Use the full production feedback loop on the new integration.

### Step 5 — Deploy the TrueLayer integration

**References:** Operations §7; Kakeido Tech Stack §13; Kakeido Tech Stack §14 when mobile surfaces changed

**Run**

```text
Execute Kakeido's existing deployment/release mechanism for the accepted TrueLayer Evidence in the configured operational environment: backend through the Tech Stack §13 Wrangler path, and mobile through the Tech Stack §14 EAS path when the accepted scope changed mobile surfaces. Report the Evidence id plus each deployed artifact revision/locator. Do not introduce a provider-specific release path.
```

**Run**

```bash
pnpm pactwright operations record-deployment <evidence-id>
pnpm pactwright operations validate
```

Record one Deployment per deployed artifact; repeated or multi-surface deployments create distinct immutable Deployment records.

**Expected result**

The TrueLayer Delivery has a canonical Deployment tied to exact Evidence for each deployed artifact.

**Verify before continuing**

Deployment identity is exact per artifact, and raw TrueLayer payloads and credentials are absent from canonical graph state and Deployment records.

### Step 6 — Configure the TrueLayer operational source

**References:** Operations §§5, 8–10; Kakeido Tech Stack §11, §17

**Run**

```text
Configure or extend the minimum Kakeido Operations source needed to observe the TrueLayer integration through existing Better Stack or Cloudflare evidence: provider API errors/latency, token/consent failures, sync or webhook failures and ingestion outcomes. Store only configuration and provenance. Do not store or log access tokens, client secrets, raw provider payloads or unnecessary personal data. Print the source id.
```

**Run**

```bash
pnpm pactwright operations validate
```

**Expected result**

TrueLayer production behaviour is observable without copying sensitive provider payloads or credentials.

**Verify before continuing**

Inspect the source configuration and logging path and confirm `operations validate` passes.

### Step 7 — Observe and govern TrueLayer production evidence

**References:** Operations §§8–15; PI §§8, 11, 14

**Run**

```bash
pnpm pactwright operations ingest <source-id>
pnpm pactwright operations observe <source-id>
pnpm pactwright operations validate
```

`<source-id>` is the id printed by Step 6. `observe` prints created/matched Observation ids and the internal PI Source ids produced by the hand-off; use those internal Source ids below.

```bash
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

## Stage 4 — Capture graduation feedback as Pactwright evidence

**Execution location:** the Pactwright repository root.

### Step 8 — Route graduation findings into Pactwright governance

**References:** Implementation Principles §§7, 13–14; PI §§8, 11

**Run**

```text
Inventory Pactwright defects, friction and generalisation failures observed during the TrueLayer graduation — installation problems, context selection, semantic loss across domains, review misses, Operations gaps — distinguishing Kakeido-specific choices from Pactwright responsibility failures. Write the findings to a source document and print its path.
```

**Run**

```bash
pnpm pactwright intelligence ingest "<findings-path>"
pnpm pactwright intelligence triage <source-id>

# only when triage requires reviewed promotion and the proposal is accepted
pnpm pactwright intelligence promote <source-id>

pnpm pactwright intelligence derive-intent-roadmap
```

**Expected result**

Graduation findings are governed Pactwright evidence, and repeatable Pactwright responsibility failures appear as intent-roadmap candidates.

**Verify before continuing**

Every blocking finding is captured, and no Pactwright runtime, extension or agent-pack change was made during graduation.

## Exit gate

Graduation passes only when: the accepted TrueLayer specification governs all provider semantics through normal PI governance; equivalent CSV/TrueLayer inputs converge on compatible canonical Kakeido semantics with Financial Model §§17–18 invariants and acceptance criteria intact; a completed weekly review and regression Graph Review show no source-specific behaviour leaking into review/Kei/domain layers; deployment identity is exact per deployed artifact; production feedback follows Operations → PI → Delivery without storing raw provider payloads, tokens or credentials in canonical graph state, source configuration or logs; and graduation findings are captured as governed Pactwright evidence with no mid-graduation Pactwright changes — satisfying the six System-Level Acceptance dimensions of Implementation Principles §13.

---

**Pactwright — Graduation — TrueLayer v9**
