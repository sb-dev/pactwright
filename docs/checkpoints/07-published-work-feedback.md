# Pactwright — Checkpoint 7 — Published-Work Feedback

**Version:** 3 
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

## 4. Checkpoint specification map

- **Publication ownership/exposure declaration** — Review & Creative §§1–4, 13
- **Generic production exposure/Observation** — Operations §§6, 11–15, 25
- **Sibling dependency model** — Distribution §§4–5
- **Cross-extension GitHub integration** — GitHub §§7–8, 23–24, 26–27

## Stage 1 — Implement manifest-driven exposure compatibility

Let sibling extensions integrate by contract, not hard-coded dependency.

### Step 1 — Declare Publication as an Operations-compatible exposure

**References:** Review & Creative §4

**Run**

```text
Add operations.exposure_types: [publication] to the Review & Creative manifest as defined by the spec. This declaration must be inert when Operations is disabled and must not introduce an Operations dependency.
```

**Expected result**

Review & Creative advertises compatible exposure semantics without depending on Operations.

**Verify before continuing**

Run manifest/dependency tests with Review & Creative enabled alone.

### Step 2 — Implement generic exposure-type discovery in Operations

**References:** Operations §6

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

Observe a real public Pactwright output.

### Step 5 — Select or record a real Pactwright Publication

**References:** Review & Creative §13

**Run**

```bash
# if the approved Asset has not yet been recorded as published
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

**References:** Operations §§11–15; PI §14

**Run**

```bash
pnpm pactwright operations ingest <publication-source-id>
pnpm pactwright operations observe <publication-source-id>
pnpm pactwright operations validate
pnpm pactwright intelligence triage <internal-source-id>
```

**Expected result**

Real publication performance/failure becomes an Operations Observation then PI Source.

**Verify before continuing**

If promotion is required, promote and derive the PI/corrective roadmaps; trace exact Publication identity.

## Stage 4 — Prove ownership and disablement

Demonstrate the sibling extensions remain independent.

### Step 8 — Prove Review & Creative works without Operations

**References:** Review & Creative §§1–4, 13

**Run**

```text
In a fixture, enable Review & Creative + PI but not Operations. Create/validate an Asset and Publication. Confirm all Review & Creative semantics remain valid and no Operations command/state is required.
```

**Expected result**

Publication semantics do not depend on Operations.

**Verify before continuing**

Run Review & Creative validation with Operations disabled.

### Step 9 — Prove Operations cannot mutate Publication

**References:** Operations §25

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

## Stage 5 — Prove Publication feedback on Kakeido

Use a real Kakeido marketing/publication surface.

### Step 11 — Upgrade Review & Creative and Operations

**References:** Distribution §15

**Run**

```bash
pnpm add -D pactwright@<checkpoint-version>
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

### Step 12 — Observe a real Kakeido Publication

**References:** Review & Creative §13; Operations §§11–15

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

**Pactwright — Checkpoint 7 — Published-Work Feedback v3**
