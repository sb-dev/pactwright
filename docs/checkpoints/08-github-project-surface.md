# Pactwright — Checkpoint 8 — GitHub Project Surface

**Version:** 3 
**Entry condition:** Checkpoint 7 is accepted and all first-party graph semantics exist. 
**Exit capability:** One shared GitHub Project and generated workflow surface project the complete enabled Pactwright system in both projects.

## 1. Goal

Complete all remaining GitHub profile composition, checks, summaries, fields and views, then prove regeneration and extension-disable reconciliation.

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

- **GitHub operating/profile/workflow** — GitHub §§1–4
- **Actions** — GitHub §§5–8
- **Revision/failure/PR/checks** — GitHub §§9–16
- **Issues/views** — GitHub §§17–24
- **Configuration/DoD** — GitHub §§25–27
- **Provisioning/reconciliation** — Distribution §§9–14

## Stage 1 — Complete profile composition

Resolve one deterministic GitHub desired state from enabled components.

### Step 1 — Implement requirement merge/conflict handling

**References:** GitHub §3; Distribution §10

**Run**

```text
Implement deterministic composition across Delivery, Project Intelligence, Review & Creative and Operations GitHub profiles. Identical requirements collapse, compatible requirements merge and incompatible requirements fail validation before remote mutation.
```

**Expected result**

One desired-state model composes all enabled profiles safely.

**Verify before continuing**

Run fixtures for identical, compatible and incompatible requirements.

### Step 2 — Enforce one shared GitHub Project

**References:** GitHub §18; Distribution §12

**Run**

```text
Complete shared Project provisioning so all enabled profiles contribute fields/views to one repository Project by default. Do not create a Project per extension. Preserve only enabled-profile requirements.
```

**Expected result**

One Project represents the whole Pactwright operating surface.

**Verify before continuing**

Run both-enabled fixture and inspect exactly one linked Pactwright Project.

## Stage 2 — Complete Delivery and PI projections

Fill the core and Intelligence operating views.

### Step 3 — Complete Intent Issue/Delivery Project projection

**References:** GitHub §§17, 19

**Run**

```text
Implement the remaining Intent Issue and Delivery Project fields from GitHub v5, deriving title/stage/Contract/Brief/PR/blocking and enabled-extension context fields from Pactwright state. Editing these fields must not mutate canonical graph state.
```

**Expected result**

Delivery navigation and status are fully projected.

**Verify before continuing**

Use a fixture Intent/PR and compare GitHub values to runtime-derived state.

### Step 4 — Complete PI checks/views

**References:** GitHub §§20–21

**Run**

```text
Complete Pactwright / Intelligence, / Intelligence Promotion and / Intelligence Views plus Coverage, Roadmap, Freshness and Propagation views. Detect stale generated reports by Project Graph revision without treating stale derived views as invalid canonical Knowledge.
```

**Expected result**

PI GitHub surface is complete and correctly distinguishes canonical vs derived state.

**Verify before continuing**

Create a stale report fixture and confirm the view check fails while `intelligence validate` can still distinguish canonical validity.

## Stage 3 — Complete Review & Creative projections

Project executions/findings/assets/publications without promoting transient state.

### Step 5 — Complete Review checks/summaries/views

**References:** GitHub §22

**Run**

```text
Complete Pactwright / Review Creative structural/execution validation, Review summary, Reviews view and Next Actions view. Keep Review Executions operational provenance and link resulting Sources/promotion PRs rather than copying them.
```

**Expected result**

Review activity is visible but remains non-canonical execution/proposal state.

**Verify before continuing**

Run one Review and inspect all projected fields/links.

### Step 6 — Complete Creative checks/views

**References:** GitHub §23

**Run**

```text
Complete Pactwright / Creative Grounding, / Publication, Assets and Publications views. Candidate generation outputs must never appear as Assets. GitHub approval cannot create Asset/Publication state.
```

**Expected result**

Only canonical approved Assets/Publications appear in the project views.

**Verify before continuing**

Use a candidate-only fixture and confirm it is absent from Assets view.

## Stage 4 — Complete Operations projections

Expose durable production state without duplicating observability systems.

### Step 7 — Complete Operations checks/views

**References:** GitHub §24

**Run**

```text
Complete Pactwright / Operations and / Operations Views plus Operations, Deployments, Production Findings and Corrective Roadmap views. Project only durable Deployments/Observations and PI-derived corrective candidates; never raw telemetry or a separate Operations priority model.
```

**Expected result**

The Project shows the current production picture at graph-level signal density.

**Verify before continuing**

Run a refresh and inspect that individual raw events are absent while Observations appear.

## Stage 5 — Reconcile Pactwright and prove regeneration

Make GitHub fully reproducible from Pactwright-owned desired/canonical state.

### Step 8 — Regenerate local integration

**References:** Distribution §8

**Run**

```bash
pnpm pactwright sync
```

**Expected result**

All four managed workflows/adapter files reflect enabled profiles.

**Verify before continuing**

Inspect git diff; only Pactwright-managed files/regions may change.

### Step 9 — Preview/apply complete remote desired state

**References:** Distribution §§9–14

**Run**

```bash
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
pnpm pactwright github sync --dry-run
```

**Expected result**

All fields/views/check/ruleset requirements are applied and converged.

**Verify before continuing**

The final dry-run is clean except intentional external drift.

### Step 10 — Validate all enabled graph semantics

**References:** All owning specs

**Run**

```bash
pnpm pactwright validate
pnpm pactwright intelligence validate
pnpm pactwright creative validate
pnpm pactwright operations validate
```

**Expected result**

Canonical state across all subgraphs is valid.

**Verify before continuing**

All four commands pass.

### Step 11 — Prove remote drift reconciliation

**References:** Distribution §14; GitHub §2

**Run**

```text
Using one safe Pactwright-owned Project field/view in a test repository, record current state, make one reversible remote change, run github sync --dry-run to detect drift, apply github sync, and verify desired state is restored. Do not touch unrelated user-owned objects.
```

**Expected result**

Owned remote drift is detectable/recoverable.

**Verify before continuing**

Record before/drift/after state and final clean dry-run.

### Step 12 — Prove extension disable/removal reconciliation

**References:** Distribution §§4, 14

**Run**

```text
In fixture repositories test: disable Operations while Review & Creative remains; disable Review & Creative while Operations remains; attempt to remove Project Intelligence while either dependant remains. Verify only owned GitHub integration is removed, remaining sibling/profile state stays valid and PI dependency removal is blocked.
```

**Expected result**

Profile composition/removal obeys extension ownership/dependencies.

**Verify before continuing**

Run all relevant validation commands after each fixture transition.

## Stage 6 — Upgrade Kakeido and run a full projected lineage

Prove the complete operating surface in the consumer repository.

### Step 13 — Upgrade/reconcile Kakeido fully

**References:** Distribution §15

**Run**

```bash
pnpm add -D pactwright@<checkpoint-version>
pnpm pactwright extension upgrade project-intelligence
pnpm pactwright extension upgrade review-creative
pnpm pactwright extension upgrade operations
pnpm pactwright sync
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

**Expected result**

Kakeido has the complete first-party GitHub profile set.

**Verify before continuing**

Run all four graph validation commands.

### Step 14 — Run one real end-to-end Kakeido lineage

**References:** GitHub §26; PI §11; Operations §§13–15

**Run**

```bash
pnpm pactwright intelligence derive-intent-roadmap
```

**Run**

```text
/capture-intent "<selected real Kakeido candidate>"
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Run**

```bash
# choose the relevant exposure path
pnpm pactwright operations record-deployment <evidence-id>
# or creative approve-asset / record-publication
pnpm pactwright operations refresh
pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright operations corrective-roadmap
```

**Expected result**

GitHub projects the complete lineage/feedback without owning any of its canonical state.

**Verify before continuing**

Inspect the shared Project and trace every projected field back to repository graph/provenance.

## Exit gate

Both projects use one shared GitHub Project; all managed workflows/checks/views exist only when required; remote state regenerates/converges; extension disable/removal affects only owned integration; no GitHub edit alone mutates canonical Pactwright state.

---

**Pactwright — Checkpoint 8 — GitHub Project Surface v3**
