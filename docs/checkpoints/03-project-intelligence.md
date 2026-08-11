# Pactwright — Checkpoint 3 — Project Intelligence

**Version:** 3 
**Entry condition:** Checkpoint 2 is accepted. 
**Exit capability:** Project Intelligence can cold-start both projects, govern knowledge, supply bounded Delivery context and derive one intent roadmap.

## 1. Goal

Implement Project Intelligence as a complete optional extension, adopt it in Pactwright, ingest the Pactwright corpus, then prove cold-start onboarding/context/roadmap behaviour in Kakeido.

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

- **PI boundary/layout/data** — Project Intelligence v3 §§1–7
- **Triage/freshness/onboarding/roadmap** — PI §§8–12
- **Delivery/extension integration/commands** — PI §§13–17
- **Distribution/GitHub** — Distribution §§4–8; GitHub §§6, 13, 20–21, 25–27

## Stage 1 — Package and register Project Intelligence

Create the extension boundary before semantic operations.

### Step 1 — Implement package manifest and dependency/capability registration

**References:** PI §§1–4; Distribution §§4–5

**Run**

```text
Using Pactwright Delivery, implement @pactwright/project-intelligence manifest/registration: Source/Domain/Knowledge node types, Intelligence namespace, required intelligence-triage/intelligence-promotion/intelligence-context capabilities and Project Intelligence GitHub profile. Do not mutate Delivery semantics.
```

**Expected result**

The extension is independently loadable and owns only its declared graph semantics.

**Verify before continuing**

Install the package in a fixture with `pactwright extension add project-intelligence`; run `pactwright validate` and inspect the resolved manifest.

### Step 2 — Implement PI repository layout and nine core Domain definitions

**References:** PI §§4, 5.2, 7

**Run**

```text
When Project Intelligence is enabled, create the repository layout from PI §4 and seed all nine core Domain Definitions from §7 with their required metadata/dependencies. Do not create project-specific Sources or Knowledge automatically.
```

**Expected result**

Every PI-enabled project starts with the mandatory core registry.

**Verify before continuing**

Run `pnpm pactwright intelligence validate`; remove one core Domain in a fixture and confirm validation fails.

## Stage 2 — Implement Source ingestion and triage

Create the single ingestion path used by founding material and future extension findings.

### Step 3 — Implement Source identity/versioning/storage boundary

**References:** PI §5.1

**Run**

```text
Implement Source semantics: canonical_id + content_hash identity, captured/observed times, source type, snapshot/reference storage, version_of, status, origin, trust and triage metadata. Add secret-scan boundary before snapshot commit. Same identity is a no-op; same canonical_id with new hash creates a version.
```

**Expected result**

Source capture is immutable, traceable and idempotent.

**Verify before continuing**

Add fixtures for duplicate, changed version, reference-only and secret-rejected snapshot.

### Step 4 — Implement triage and class 0–3 automatic boundary

**References:** PI §8

**Run**

```text
Implement triage identity, relevance, domain, comparison, disposition and consequence class 0/1/2/3. Enforce that class 0/1 may only add Source/evidence/derived freshness and cannot change canonical meaning, Delivery state or sibling extension state. Class 2/3 require reviewed promotion.
```

**Expected result**

Consequence determines ceremony; origin/domain alone does not.

**Verify before continuing**

Run fixtures proving a class-1 Source cannot edit a requirement, constraint, decision or Delivery node.

### Step 5 — Expose `ingest`, `triage`, `promote`

**References:** PI §§8, 15–17

**Run**

```text
Implement pactwright intelligence ingest <path-or-url>, triage <source-id> and promote <source-id>. Wire them to the Source/triage/promotion semantics already implemented. Preserve idempotency, approval and failure behaviour from PI §§16–17.
```

**Expected result**

The runtime now owns deterministic PI ingestion/promotion mechanics.

**Verify before continuing**

Run ingest+triage on a fixture twice, then modify the source and ingest again; verify correct no-op/version behaviour.

## Stage 3 — Implement Knowledge and relationships

Make accepted project meaning durable and traceable.

### Step 6 — Implement Knowledge Cards and kind governance

**References:** PI §5.3

**Run**

```text
Implement Knowledge Cards with domain, kind, status, conclusion, evidence, refresh/review metadata, supersession and recurrence. Enforce kind-specific governance: normative kinds gain authority through approval; empirical kinds remain evidence-governed. Accepted cards require at least one Source.
```

**Expected result**

Knowledge represents current accepted project meaning without replacing Source provenance.

**Verify before continuing**

Run validation fixtures for missing Source, invalid kind/status, supersession and retraction.

### Step 7 — Implement Intelligence edges and cross-graph ownership

**References:** PI §6

**Run**

```text
Register and validate PI relations depends-on, supports, contradicts, constrains, affects, requires-delivery, satisfied-by, supersedes, retracts and informs-only. Preserve endpoint ownership; requires-delivery targets a Delivery Intent and satisfied-by targets Delivery Evidence without transferring ownership.
```

**Expected result**

PI can connect meaning to Delivery while each subgraph keeps canonical ownership.

**Verify before continuing**

Run valid/invalid cross-graph edge fixtures and `pactwright intelligence validate`.

## Stage 4 — Implement onboarding, roadmap, propagation and freshness

Turn durable Knowledge into project guidance and candidate work without a second lifecycle.

### Step 8 — Implement onboarding/coverage reports

**References:** PI §10

**Run**

```text
Implement domain coverage states Missing/Seeded/Covered and pactwright intelligence onboard. Generate domain-map.md and onboarding.md from Domain definitions + accepted in-horizon Knowledge. Follow dependency-aware cold-start ordering. Missing knowledge becomes Source-ingestion guidance, never an Intent.
```

**Expected result**

Onboarding answers what the project still needs to know.

**Verify before continuing**

Run `pnpm pactwright intelligence onboard` on an empty PI fixture and inspect strategic-upstream guidance.

### Step 9 — Implement the single intent-roadmap derivation model

**References:** PI §11

**Run**

```text
Implement pactwright intelligence derive-intent-roadmap and the single Project Intelligence candidate model. Derive candidates from accepted delivery obligations/existing Intents/reconsideration needs, preserve provenance/readiness/dependency waves/precedence, and never create canonical Intents automatically.
```

**Expected result**

The roadmap proposes what to build/correct and remains derived.

**Verify before continuing**

Run the command and prove no new Intent node appears unless separately captured.

### Step 10 — Implement propagation and freshness

**References:** PI §§9, 12, 15

**Run**

```text
Implement pactwright intelligence propagate <knowledge-id> and refresh. Propagation emits proposals/impact for changed Knowledge and never silently edits dependants. Freshness marks/report staleness without changing canonical meaning.
```

**Expected result**

Changed/stale Knowledge is surfaced mechanically without ownership violations.

**Verify before continuing**

Run propagate/refresh fixtures and inspect derived reports.

## Stage 5 — Integrate PI with Delivery and GitHub

Make accepted Knowledge useful during work and visible remotely.

### Step 11 — Implement bounded Delivery context contribution

**References:** PI §13; Delivery §22

**Run**

```text
Implement namespaced PI context contribution using registered Domain brief recipes. Include only accepted, relevant and sufficiently current Knowledge; preserve the core Delivery lineage and exclude raw extension execution/telemetry.
```

**Expected result**

Delivery gets high-signal project grounding without loading the whole Intelligence Graph.

**Verify before continuing**

Run `pactwright context <brief-id>` against fixtures requiring different domains and inspect bounded selection.

### Step 12 — Implement PI GitHub workflow/checks/views

**References:** GitHub §§6, 13, 20–21

**Run**

```text
Implement the Project Intelligence GitHub profile and generated pactwright-intelligence.yml. Add Source/promotion validation, onboarding/coverage, roadmap, freshness/propagation regeneration and PI checks/views exactly as defined by GitHub v5. Reports remain revision-stamped derived views.
```

**Expected result**

PI operates remotely without GitHub owning Knowledge/candidates.

**Verify before continuing**

Run `pactwright sync` and `pactwright github sync --dry-run`; inspect only PI-owned contributions.

## Stage 6 — Adopt Project Intelligence in Pactwright

Use PI on the project that defines it.

### Step 13 — Install/reconcile PI in Pactwright

**References:** Distribution §4; GitHub §6

**Run**

```bash
pnpm pactwright extension add project-intelligence
pnpm pactwright sync
pnpm pactwright intelligence validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

**Expected result**

Pactwright has PI enabled and valid.

**Verify before continuing**

Run `pnpm pactwright validate`.

### Step 14 — Ingest the Pactwright authoritative corpus

**References:** PI §§8, 10–11, 15

**Run**

```bash
pnpm pactwright intelligence ingest "<system-architecture-path>"
pnpm pactwright intelligence ingest "<delivery-spec-path>"
pnpm pactwright intelligence ingest "<distribution-spec-path>"
pnpm pactwright intelligence ingest "<github-spec-path>"
pnpm pactwright intelligence ingest "<project-intelligence-spec-path>"
pnpm pactwright intelligence ingest "<review-creative-spec-path>"
pnpm pactwright intelligence ingest "<operations-spec-path>"
pnpm pactwright intelligence ingest "<open-source-organisation-path>"
pnpm pactwright intelligence ingest "<website-spec-path>"
```

**Expected result**

The founding corpus enters the normal Source path as separate traceable Sources.

**Verify before continuing**

Triage each returned Source ID; promote only class 2/3 as required; then run `intelligence onboard`, `derive-intent-roadmap`, and `validate`.

### Step 15 — Use one ready roadmap candidate to drive real Pactwright Delivery

**References:** PI §11; Delivery §19

**Run**

```bash
pnpm pactwright intelligence derive-intent-roadmap
```

**Run**

```text
/capture-intent "<selected ready Pactwright outcome>"
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
```

**Run**

```bash
pnpm pactwright context <brief-id>
```

**Run**

```text
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Expected result**

The roadmap candidate becomes Delivery work only through explicit Intent capture and uses relevant PI context.

**Verify before continuing**

Trace candidate → Knowledge/Sources and Intent → Evidence; confirm no candidate-to-Intent automatic mutation.

## Stage 7 — Cold-start Kakeido

Prove PI can understand a different multi-domain project from its real specs.

### Step 16 — Install PI in Kakeido

**References:** Distribution §4

**Run**

```bash
pnpm add -D pactwright@<checkpoint-version>
pnpm pactwright extension add project-intelligence
pnpm pactwright sync
pnpm pactwright intelligence validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

**Expected result**

Kakeido has the same PI extension/runtime version family.

**Verify before continuing**

Run `pnpm pactwright validate`.

### Step 17 — Ingest all five Kakeido specifications

**References:** PI §§8, 10–11; Kakeido specs

**Run**

```bash
pnpm pactwright intelligence ingest "<Financial-Model-path>"
pnpm pactwright intelligence ingest "<Product-UX-path>"
pnpm pactwright intelligence ingest "<Mobile-Design-path>"
pnpm pactwright intelligence ingest "<Kei-Spec-path>"
pnpm pactwright intelligence ingest "<Tech-Stack-path>"
```

**Expected result**

Kakeido knowledge is distributed into appropriate PI domains rather than flattened into one generic summary.

**Verify before continuing**

Triage/promote as required; run `intelligence onboard`, `derive-intent-roadmap`, `validate`.

### Step 18 — Deliver a cross-domain Kakeido candidate

**References:** Financial Model §§2–17; Product & UX §§2–10; Tech Stack §§3–10

**Run**

```text
/capture-intent "<ready Kakeido outcome requiring Financial Model + Product/UX + Tech Stack context>"
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
```

**Run**

```bash
pnpm pactwright context <brief-id>
```

**Run**

```text
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Expected result**

Delivery context is relevant/bounded and preserves financial/product/engineering constraints.

**Verify before continuing**

Review for no fixed/flexible double counting, correct Review IA, mobile→API→Neon boundary, and Kei remaining non-authoritative for deterministic finance.

## Exit gate

PI is installable and self-hosted; both projects are onboarded through the normal Source path; the roadmap is derived and non-canonical; one real candidate in each project enters Delivery only through explicit Intent capture; context selection is bounded and semantically correct.

---

**Pactwright — Checkpoint 3 — Project Intelligence v3**
