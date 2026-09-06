# Pactwright — Checkpoint 3 — Project Intelligence

**Version:** 10  
**Entry condition:** Checkpoint 2 is accepted.  
**Release:** `0.0.3`  
**Exit capability:** Project Intelligence can cold-start Pactwright and Kakeido, govern durable project knowledge, contribute bounded context and derive one dependency-aware Intent roadmap without automatically creating Delivery work.

## 1. Goal

Implement Project Intelligence as the first real optional Pactwright Extension, adopt it in Pactwright, ingest the current Pactwright authoritative/public corpus, then prove cold-start onboarding, grounding, context contribution and roadmap behaviour on Kakeido.

## 2. Canonical baseline

- [01 — Core System and Lifecycle](../specs/01-pactwright-core-system-and-lifecycle.md)
- [02 — Distribution, Agent Packs, Extensions and Evaluation](../specs/02-distribution-agent-packs-extensions-and-evaluation.md)
- [03 — Project Intelligence](../specs/03-project-intelligence.md)
- [07 — GitHub Integration](../specs/07-github-integration.md)
- [08 — Open-Source Project Organisation](../specs/08-open-source-project-organisation.md)
- [Implementation Principles](./00-implementation-principles.md)
- [Implementation Guide](./00-implementation-guide.md)

Research logs are rationale only.

Kakeido acceptance uses the current canonical Kakeido specifications from the Kakeido repository.

This runbook defines implementation order, not new Project Intelligence semantics.

## 3. Execution contract

Every action follows:

```text
Step
→ References
→ Run
→ Expected result
→ Verify before continuing
```

Default location is Pactwright unless a step names Kakeido or a fixture.

For repository/code changes:

```bash
pnpm verify
```

After Checkpoint 2, coherent changes land through pull requests and required checks.

Class 2/3 PI promotion uses normal reviewed repository change infrastructure and applies canonical Knowledge mutations only after required approval.

## 4. Checkpoint scope

Checkpoint 3 implements:

```text
@pactwright/project-intelligence
Source
Domain Definition
Knowledge
Source ingestion
triage classes 0–3
promotion boundary
nine-domain registry
trust/evidence rules
coverage: Missing / Seeded / Covered
onboarding
one Intent roadmap derivation
propagation
freshness
bounded PI context contribution
PI GitHub workflow/checks/views
PI evaluation cases
Pactwright corpus ingestion
Kakeido cold start
```

### Capability rule

Project Intelligence may need AI-mediated responsibilities through the selected Agent Pack, but canonical Specs 02–03 deliberately do **not** define stable capability identifiers for triage, promotion and context.

Therefore this checkpoint must not recreate:

```text
intelligence-triage
intelligence-promotion
intelligence-context
```

under those or replacement names merely to satisfy implementation structure.

Implement PI AI behaviour through the existing selected Agent Pack/adaptation seam. If real implementation/evaluation proves a genuinely distinct capability decomposition is necessary, capture that evidence and update Specs 02–03 deliberately before treating the names as public contracts.

### Extension-originated Source scope

Real Graph Review Findings and Operations Observations do not exist yet.

This checkpoint must nevertheless implement their **different provenance shapes** through fixtures:

```text
Graph Review Finding
→ immutable non-graph execution output
→ internal Source using execution-output provenance

Operations Observation
→ canonical Operations Project Graph record
→ internal Source using canonical-record provenance
```

Do not assume every internal Source originates from a canonical Project Graph record.

### Deliberately unresolved

Do not invent:

- richer `digest` semantics;
- a recurrence scheduler/trigger service;
- richer evidence-independence metadata beyond current origin semantics;
- first-class processing/promotion graph records;
- richer numeric coverage scoring;
- canonical PI Agent Pack capability names.

## Stage 1 — Package and register Project Intelligence

### Step 1 — Create `@pactwright/project-intelligence`

**References:** Specs 02–03 Extension/package ownership.

**Run**

```text
Create `@pactwright/project-intelligence` as an independently publishable Pactwright Extension.

Register only PI-owned semantics:
- Source
- Domain Definition
- Knowledge
- PI edge types
- intelligence command namespace
- PI context contribution
- PI GitHub profile
- PI evaluation cases

Require no invented PI capability identifiers in the manifest.
If the implementation needs AI execution, resolve it through the selected Agent Pack without making a speculative public capability decomposition.
```

**Expected result**

Project Intelligence is independently loadable and owns only its canonical semantics.

**Verify before continuing**

Run manifest/Extension-resolution fixtures and prove disabling PI does not reinterpret core Delivery state.

### Step 2 — Implement PI repository layout and nine core domains

**References:** Spec 03 domain registry/repository model.

**Run**

```text
When PI is enabled, create canonical PI storage and derived-report locations and seed exactly the nine core Domain Definitions with their canonical dependency rules and default horizons.

Do not create project-specific Sources or Knowledge automatically.
```

**Expected result**

Every PI-enabled project begins with the canonical registry.

**Verify before continuing**

Assert all nine domains, dependency acyclicity and required definition fields.

### Step 3 — Implement `intelligence validate` and `register-domain`

**References:** Spec 03 commands/validation.

**Run**

```text
Implement:
- pactwright intelligence validate
- pactwright intelligence register-domain <id>

Validation starts with Source/Domain structure, core registry, dependencies and internal-Source provenance and expands as later stages implement Knowledge/roadmap semantics.

Non-core domain registration/retirement follows reviewed governance.
Core domains cannot be silently removed.
```

**Expected result**

PI has deterministic validation before semantic ingestion starts.

**Verify before continuing**

Remove a core domain and require failure; register a valid non-core domain; reject invalid dependency cycles.

## Stage 2 — Implement Source ingestion and triage

### Step 4 — Implement Source identity, versioning and storage boundary

**References:** Spec 03 Source model.

**Run**

```text
Implement Source identity as `canonical_id + content_hash`.
Support:
- document / internal / digest source types;
- snapshot / reference storage independently;
- captured_at / observed_at;
- version_of;
- active / withdrawn / retracted status;
- origin;
- trust;
- triage metadata.

Run secret detection before committing snapshot content.
If stored bytes are later removed, retain provenance/hash and require dependent Knowledge revalidation.

Internal Source provenance must support both:
- originating canonical record identity + hash where one exists;
- originating execution-output identity + hash where the upstream object is non-canonical.
```

**Expected result**

Source capture is immutable, traceable and idempotent across external and future Extension origins.

**Verify before continuing**

Test duplicate, changed version, reference-only, secret rejection, byte removal/revalidation, valid canonical-origin internal Source and valid non-canonical execution-output internal Source.

### Step 5 — Implement triage classes 0–3

**References:** Spec 03 ingestion/triage and automatic-mutation boundary.

**Run**

```text
Implement triage over identity, relevance, primary domain, comparison with current Knowledge, disposition and consequence class.

Dispositions:
- irrelevant
- duplicate
- corroborating
- incremental
- novel
- contradictory

Class 0/1 may capture Sources, evidence links and eligible freshness effects only.
Class 2/3 require reviewed promotion before canonical meaning changes.
No registered domain fit => propose a new Domain Definition as class 2; do not write one silently.
```

**Expected result**

Consequence, not origin, determines governance ceremony.

**Verify before continuing**

Prove a class-1 Source cannot alter a requirement/constraint/decision/Delivery record and no-domain-fit produces a reviewed proposal.

### Step 6 — Expose `ingest`, `triage` and `promote`

**References:** Spec 03 command/promotion/failure model.

**Run**

```text
Implement:
- pactwright intelligence ingest <path-or-url>
- pactwright intelligence triage <source-id>
- pactwright intelligence promote <source-id>

Promotion assembles reviewed PI mutations and affected-record information, performs no canonical class-2/3 mutation before approval, and preserves captured Source state on failure.

Failed ingestion is represented in the canonical derived failure report without partial canonical mutation.
```

**Expected result**

One ingestion/promotion path serves founding material, research and future Extension-originated Sources.

**Verify before continuing**

Run duplicate/versioned ingestion, class-2 no-preapproval-mutation and failed-ingestion fixtures.

## Stage 3 — Implement Knowledge and relationships

### Step 7 — Implement Knowledge governance

**References:** Spec 03 Knowledge model/governance/evidence/freshness.

**Run**

```text
Implement Knowledge fields, status, evidence links, review horizon, supersession/retraction and recurrence policy.

Enforce:
- accepted Knowledge has at least one Source;
- new/changed canonical conclusion requires human approval;
- empirical kinds derive authority from evidence;
- requirement/constraint/decision authority is approval-governed and cannot be outvoted by Source counts;
- recurrence records durable policy only; no scheduler is introduced here.
```

**Expected result**

Knowledge represents accepted current project meaning without replacing Source provenance.

**Verify before continuing**

Test evidence sufficiency/origin independence, normative-governance, supersession, retraction and recurrence validation.

### Step 8 — Implement PI and cross-graph relationships

**References:** Spec 03 relationships/Delivery obligations.

**Run**

```text
Register and validate:
- depends-on
- supports
- contradicts
- constrains
- affects
- requires-delivery
- satisfied-by
- supersedes
- retracts
- informs-only

Preserve ownership across graph boundaries.
`requires-delivery` targets a Delivery Intent.
`satisfied-by` targets Delivery Evidence.
Raw Sources, Findings and Observations cannot directly create Delivery Intents.
```

**Expected result**

PI connects project meaning to Delivery without owning Delivery records.

**Verify before continuing**

Run valid/invalid cross-owner relation fixtures.

## Stage 4 — Implement onboarding, roadmap, propagation and freshness

### Step 9 — Implement coverage and onboarding

**References:** Spec 03 coverage/onboarding.

**Run**

```text
Implement exact states:
Missing
Seeded
Covered

A domain without coverage slots stops at Seeded.

Implement `pactwright intelligence onboard` and deterministic revision-stamped onboarding/domain-map reports.
Follow the canonical dependency-aware ordering: discovery/product/identity strategic core, then go-to-market, then content, while independent applicable domains may proceed in parallel.

Knowledge gaps produce Source/research/Decision guidance, never automatic Intents.
```

**Expected result**

Onboarding answers what the project still needs to know.

**Verify before continuing**

Test Missing→Seeded→Covered, slot-free Seeded ceiling, dependency unlock and regeneration after staleness/supersession.

### Step 10 — Implement the single Intent roadmap derivation

**References:** Spec 03 Intent roadmap/readiness/ordering.

**Run**

```text
Implement `pactwright intelligence derive-intent-roadmap`.

Derive one project-wide candidate set from accepted Delivery obligations, current/open Intents and reconsideration needs.
Preserve motivating Knowledge/Source provenance, readiness, blocked dependencies and dependency waves.
Do not create Intents automatically.
Do not invent an Extension-specific second ranking model.
```

**Expected result**

The roadmap proposes work while Delivery remains authoritative for creating Intents.

**Verify before continuing**

Prove roadmap generation creates no Intent and blocked candidates point back to missing knowledge/dependency conditions.

### Step 11 — Implement propagation and freshness

**References:** Spec 03 propagation/freshness.

**Run**

```text
Implement:
- pactwright intelligence propagate <knowledge-id>
- pactwright intelligence refresh

Propagation produces review/change proposals for affected dependants and never silently edits sibling-owned canonical records.
Freshness marks/report staleness without changing Knowledge conclusion.
```

**Expected result**

Changed/stale knowledge is surfaced mechanically without ownership violations.

**Verify before continuing**

Run challenged/superseded/retracted propagation plus freshness fixtures.

## Stage 5 — Integrate PI with Delivery, GitHub and evaluation

### Step 12 — Implement bounded PI context contribution

**References:** Spec 03 Delivery context; Spec 01 context assembly.

**Run**

```text
Contribute namespaced PI context into the existing Pactwright context-assembly API.
Select accepted, relevant and sufficiently current Knowledge using Domain Definition recipes and graph relationships.
Do not load every Source, report or stale/challenged record by default.
Do not introduce `pactwright context` as a required public CLI contract merely for this checkpoint.
```

**Expected result**

Contract crafting, Brief creation, Delivery and Review can receive bounded project grounding.

**Verify before continuing**

Use fixture responsibilities needing different domains and inspect selected context.

### Step 13 — Implement PI GitHub workflow/checks/views

**References:** Spec 07 Project Intelligence workflow/profile.

**Run**

```text
Implement generated `.github/workflows/pactwright-intelligence.yml` and the canonical PI GitHub surface:
- Pactwright / Intelligence
- Pactwright / Intelligence Promotion
- Pactwright / Intelligence Views
- Pactwright / Intelligence Grounding
- promotion view/summary
- Coverage/Roadmap/Freshness/Propagation projections where defined

Reports remain revision-stamped derived views.
GitHub never owns Source/Knowledge/candidate semantics.
```

**Expected result**

PI operates remotely through thin runtime execution/projection.

**Verify before continuing**

Run sync + GitHub dry-run and verify only PI-owned contributions appear; stale derived reports are distinguishable from invalid canonical Knowledge.

### Step 14 — Add PI evaluation cases without canonising capability names

**References:** Specs 02–03 evaluation boundary.

**Run**

```text
Add Project Intelligence evaluation cases for:
- source triage/disposition/class;
- evidence comparison;
- unsupported promotion;
- bounded Knowledge selection/context contribution;
- roadmap provenance/no automatic Intents.

Route cases through the actual PI AI execution seam used by the implementation.
Do not name a public PI capability decomposition unless implementation evidence first justifies updating Specs 02–03.
```

**Expected result**

PI AI-mediated behaviour is measurable without speculative capability contracts.

**Verify before continuing**

Run `pactwright eval` and inspect PI cases individually.

## Stage 6 — Adopt Project Intelligence in Pactwright

### Step 15 — Enable PI from the workspace

**References:** Spec 02 Extension add; Spec 03.

**Run**

```bash
pnpm build
pnpm pactwright extension add project-intelligence
pnpm pactwright intelligence validate
pnpm pactwright sync
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
pnpm pactwright validate
```

**Expected result**

Pactwright has PI enabled from its workspace build with no invented capability requirement.

**Verify before continuing**

All PI/core validations pass and remote state converges.

### Step 16 — Ingest the current Pactwright authoritative corpus

**References:** Specs 03 and 08 document authority.

**Run**

Ingest the current canonical Pactwright sources, including:

```text
docs/specs/01-pactwright-core-system-and-lifecycle.md
docs/specs/02-distribution-agent-packs-extensions-and-evaluation.md
docs/specs/03-project-intelligence.md
docs/specs/04-graph-review.md
docs/specs/05-assets-and-publication.md
docs/specs/06-operations.md
docs/specs/07-github-integration.md
docs/specs/08-open-source-project-organisation.md
README.md
current material public enough to contain product claims/identity/guidance
```

Do not ingest obsolete research logs as if they were current authority merely because they historically informed the specs.

For each Source, triage and promote only where required/approved.

Then run:

```bash
pnpm pactwright intelligence onboard
pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright intelligence validate
pnpm pactwright validate
```

**Expected result**

Current Pactwright truth enters PI through normal Source governance.

**Verify before continuing**

Accepted Knowledge remains Source-traceable; class 2/3 changes have approved promotion; no roadmap candidate became an Intent automatically.

### Step 17 — Promote pre-PI bootstrap authority into durable Knowledge where applicable

**References:** Spec 08 PI bootstrap/public-content authority.

**Run**

```text
Identify authorised pre-PI Decisions, Contracts and verified repository material that should become durable current project knowledge, especially identity/positioning/product authority used by Checkpoints 1–2.

Capture them as Sources, triage normally and use reviewed promotion where required.
Do not silently convert Contract text into Knowledge.
```

**Expected result**

Pre-PI Delivery authority remains historical lineage while accepted PI Knowledge becomes the durable current grounding source.

**Verify before continuing**

Sample each promoted strategic item and trace Source → approval → accepted Knowledge.

### Step 18 — Deliver one real Pactwright roadmap candidate

**Run**

```bash
pnpm pactwright intelligence derive-intent-roadmap
```

Select one ready Pactwright outcome, explicitly capture it as an Intent, then deliver it through normal Contract-driven Delivery using bounded PI context.

**Expected result**

PI proposes; Delivery authorises and executes.

**Verify before continuing**

Trace candidate → motivating Knowledge/Sources → explicit Intent → Evidence.

## Stage 7 — Establish Pactwright public-content readiness

### Step 19 — Establish required public domains in dependency order

**References:** Specs 03 and 08 public-content readiness.

**Run**

```bash
pnpm pactwright intelligence onboard
```

For the Checkpoint 3 public learning path, establish only the coverage actually required by the work.

At minimum, preserve the canonical dependency ordering:

```text
discovery/product/identity strategic upstream
→ go-to-market where required
→ content where required
```

Any missing strategic choice must become an explicit Decision through normal Delivery before it is promoted into PI Knowledge.

Do not require unrelated domains to become Covered merely for ceremony.

**Expected result**

Required public claims/constraints are accepted, in-horizon and Source-traceable.

**Verify before continuing**

Inspect domain-map/onboarding plus the exact Knowledge used by the planned public work.

### Step 20 — Publish the Project Intelligence learning path

**References:** Spec 08 Project Intelligence milestone.

**Run**

Through normal Pactwright Delivery, publish/update:

```text
Project Intelligence concepts
PI onboarding guide
one project-intelligence example
Academy Project Understanding lesson
README/website discovery links where needed
```

Ground applicable public claims in accepted current PI Knowledge.

After acceptance, ingest material public content as Sources when it materially represents current project claims. Do not promote derivative copy back into Knowledge unless it contains genuinely new accepted meaning.

**Expected result**

Project Intelligence both governs the project and explains itself from governed truth.

**Verify before continuing**

Public claims agree with accepted PI Knowledge and resulting Sources remain traceable.

## Stage 8 — Release `0.0.3`

### Step 21 — Publish the `0.0.3` package family

**References:** Implementation Guide npm release model.

Use the normal release PR path.

The new first-publication package is:

```text
@pactwright/project-intelligence@0.0.3
```

Bootstrap trusted publishing only for that new package, then tag accepted source `v0.0.3` so trusted publishing releases the full compatible family:

```text
pactwright@0.0.3
@pactwright/standard@0.0.3
@pactwright/project-intelligence@0.0.3
```

**Verify before continuing**

All three versions resolve and trusted-publisher/provenance expectations hold.

## Stage 9 — Cold-start Kakeido

### Step 22 — Upgrade/install PI in Kakeido

**Run**

```bash
pnpm add -D \
  pactwright@0.0.3 \
  @pactwright/standard@0.0.3 \
  @pactwright/project-intelligence@0.0.3

pnpm pactwright upgrade --to 0.0.3
pnpm pactwright agent-pack upgrade
pnpm pactwright extension add project-intelligence
pnpm pactwright sync
pnpm pactwright intelligence validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
pnpm pactwright validate
```

**Expected result**

Kakeido runs the exact published Checkpoint 3 family with PI enabled.

### Step 23 — Discover and ingest the current Kakeido canonical corpus

**References:** current Kakeido repository document authority.

**Run**

```text
Enumerate the current canonical Kakeido specification set from the Kakeido repository.
Record the selected file paths/versions.
Ingest each authoritative specification through `pactwright intelligence ingest`.
Do not assume the historical five August documents are still the complete canonical set.
```

For every Source:

```bash
pnpm pactwright intelligence triage <source-id>
# promote only where reviewed promotion is required and approved
```

Then:

```bash
pnpm pactwright intelligence onboard
pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright intelligence validate
pnpm pactwright validate
```

**Expected result**

Kakeido knowledge is distributed across the canonical domain registry rather than flattened into one summary.

**Verify before continuing**

Onboarding/roadmap reflect the current Kakeido project and no candidate became a canonical Intent automatically.

### Step 24 — Deliver one current cross-domain Kakeido candidate

Select one ready Kakeido candidate requiring multiple current knowledge domains, explicitly capture it as an Intent and complete normal Delivery.

Use the implementation's bounded PI context contribution through the Agent Pack/adapter path, not an invented public `pactwright context` dependency.

**Expected result**

The Delivery preserves relevant Kakeido product/domain/engineering constraints without loading unrelated project history.

**Verify before continuing**

Trace candidate → Knowledge/Sources → Intent → Evidence and run current Kakeido repository-defined tests.

## Stage 10 — Capture Checkpoint 3 feedback through PI

### Step 25 — Ingest checkpoint findings as Sources

**References:** Implementation Principles feedback/evaluation rules.

Capture defects, installation friction, context-selection failures, promotion/governance problems and public-content corrections from Pactwright/Kakeido as Sources.

For each:

```bash
pnpm pactwright intelligence ingest <finding-path>
pnpm pactwright intelligence triage <source-id>
# promote only where justified and approved
```

Then regenerate the Intent roadmap.

Do not generalise Kakeido-specific preferences into Pactwright semantics.

**Expected result**

Checkpoint learning is durable project evidence rather than chat/repository folklore.

**Verify before continuing**

Each material finding has Source provenance/triage and justified candidates remain candidates until explicitly captured as Intents.

## Exit gate

Checkpoint 3 closes only when:

- `@pactwright/project-intelligence` is independently installable;
- no unsupported PI capability identifiers have been canonised;
- all nine core domains exist and validate;
- Source identity/versioning/storage/provenance works for both canonical-record and non-canonical execution-output origins;
- triage classes and class 0/1 automatic-mutation boundaries are enforced;
- changed/new canonical Knowledge meaning requires approval;
- trust/evidence, supersession, retraction and recurrence-policy rules validate;
- Missing/Seeded/Covered and dependency-aware onboarding work;
- exactly one PI Intent-roadmap derivation exists and creates no Intents automatically;
- propagation/freshness preserve ownership boundaries;
- bounded PI context contributes through the existing Pactwright context assembly seam;
- `pactwright-intelligence.yml` and all four canonical PI GitHub checks/projections operate as thin runtime surfaces;
- Pactwright's current canonical/public corpus and applicable pre-PI bootstrap authority are governed through Source ingestion/promotion;
- Pactwright delivers one real roadmap candidate only after explicit Intent capture;
- the PI public learning path is grounded in accepted current Knowledge;
- the `0.0.3` family is registry verified;
- Kakeido is cold-started from its current canonical specification corpus and completes one cross-domain Delivery;
- checkpoint findings flow through PI itself;
- no known blocking failure is carried into Checkpoint 4.

---

**Pactwright — Checkpoint 3 — Project Intelligence v10**
