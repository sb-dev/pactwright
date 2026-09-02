# Pactwright — Kakeibo System-Level Acceptance Profile

**Version:** 1  
**Status:** Checkpoint acceptance authority  
**Date:** 2026-09-02

## 1. Purpose

Kakeibo is Pactwright's persistent external proving project.

This profile centralises **Kakeibo-specific system-level acceptance semantics** so individual Pactwright checkpoint runbooks do not repeatedly copy product, financial, Kei, architecture, operations and open-source rules that evolve independently.

The Pactwright checkpoints still define:

```text
what Pactwright capability is built
→ how Pactwright dogfoods it
→ which release is published
→ when Kakeibo installs it
```

This profile defines:

```text
what real Kakeibo work is used to prove that checkpoint
→ which Kakeibo authorities govern it
→ which cross-domain invariants must be verified
```

When Kakeibo-specific wording in an older checkpoint conflicts with this profile, **this profile wins**. Pactwright core/extension semantics remain owned by their Pactwright specifications.

The purpose is to remove Kakeibo semantic duplication from the checkpoint programme, not to create another Kakeibo specification.

---

## 2. Canonical Kakeibo authority

At execution time, use the canonical Kakeibo spec set from the Kakeibo repository:

```text
docs/specs/README.md

docs/specs/01-product-and-ux-spec.md
docs/specs/02-financial-domain-model-spec.md
docs/specs/03-kei-assistant-spec.md
docs/specs/04-mobile-design-system-spec.md
docs/specs/05-system-architecture-and-data-spec.md
docs/specs/06-engineering-delivery-and-operations-spec.md
docs/specs/07-open-source-project-organisation-spec.md
```

The 2026-09-02 v2 updates to `03`, `05`, `06` and `07` are part of this acceptance baseline even while their corresponding Kakeibo repository commit is being prepared.

`docs/specs/README.md` owns the Kakeibo authority/conflict-resolution map.

Do not use the retained August `Kakeido — Tech Stack Engineering Spec` as implementation authority. Its responsibilities are now split across current `05` and `06`.

Product spelling in new Pactwright material is **Kakeibo**. Legacy `Kakeido` names inside not-yet-renamed Kakeibo spec files are source titles, not a reason to perpetuate the old project name in Pactwright runbooks.

---

## 3. Kakeibo architecture baseline

The current accepted product/runtime boundaries are:

```text
Source financial data
→ General financial core
→ Kakeibo planning + optional goals
→ Weekly review / user confirmation
→ Trusted financial history
→ Kei explanations
```

Supporting runtime boundaries:

```text
Neon application schema  → canonical financial/application state
Neon analytics schema    → first-party product + marketing events
Hono API                 → application + analytics boundary
Cloudflare Workflows     → durable multi-step work
R2                       → uploaded/generated blobs
Durable Objects          → live workflow coordination only
Kei runtime              → bounded task + grounding + validated interpretation
AI Gateway / LLM         → versioned model-routing boundary
Better Stack/Cloudflare  → operational telemetry
```

Critical separations:

```text
financial domain state
≠ financial audit history
≠ product / marketing analytics
≠ operational telemetry

FinancialEntry
≠ spending

provider/source lifecycle
≠ Kakeibo review truth

preparation state
≠ reviewed truth

Kei behavioural release
≠ model route

Kei generated interpretation
≠ canonical financial state
```

---

## 4. Global Kakeibo acceptance invariants

Every checkpoint touching Kakeibo must preserve all applicable invariants below.

### Financial truth

```text
fixed commitments never consume flexible envelopes
plan-funded goal allocations never also consume a flexible envelope
transfers do not become spending because cash left an account
credit-card settlement does not double-count tracked card purchases
business activity does not consume personal Kakeibo envelopes
reviewed totals contain only reviewed entries
rules and assistant suggestions never create reviewed truth
sum(split parts) = original amount
confirmed split parts replace the source amount in aggregates
source re-import idempotency ≠ financial duplicate resolution
goal allocation ≠ reviewed goal contribution
plan/goal/rule changes do not rewrite historical financial truth
```

### Source and ingestion truth

```text
FinancialSource
→ SourceAccount
→ IngestionRun
→ SourceRecord
→ IngestionAdapter
→ NormalisedSourceRecord
→ FinancialEntry
```

CSV is an initial adapter, not the meaning of a financial source.

Source-specific amount signs, provider categories, lifecycle state and provider metadata remain behind the ingestion boundary.

### Review truth

```text
needs decision
worth checking
looks safe
```

are preparation states.

Only explicit user confirmation creates reviewed truth.

`Looks Safe` never means auto-approved.

### Kei authority

Kei may explain canonical state but never redefine it.

Kakeibo chooses the task and supplies bounded grounding. Kei returns a bounded structured explanation/suggestion which Kakeibo validates.

Initial canonical Kei tasks:

```text
Review Brief
Explain Decision
Explain Group
Explain Looks Safe
Weekly Summary
Goal Progress Explanation
Reflection Prompt
```

Initial Kei does **not** require:

```text
persistent memory
autonomous tool use
dynamic skill selection
subagents
agent-selected workflows
general-purpose chat
```

Imported merchant descriptions, CSV fields, bank references and provider labels are untrusted data even when they contain instruction-like text.

### Advice boundary

Kakeibo and Kei may track and explain user-selected financial goals.

They do not select suitable investments, pension contributions, debt strategies, mortgage-overpayment strategies, financial products or personalised targets for the user.

### Analytics/privacy boundary

```text
product analytics → first-party Neon
marketing analytics → separate Neon stream
operational telemetry → Better Stack / Cloudflare
financial audit → canonical application/audit state
Meta → allowlisted consented marketing conversions only
```

Mobile/product financial behaviour never routes to Meta.

### Open-source boundary

The official Kakeibo service runs the same public product architecture.

Production-defining Kei policy/persona/task/schema behaviour, release manifests, benchmark/red-team definitions and safe synthetic evaluation data remain Git-traceable/public by default.

Raw production financial grounding, prompts, responses, AI traces with user data, credentials and production analytics remain private.

---

# Checkpoint acceptance slices

## 5. Checkpoint 1 — Core Delivery / Financial Domain

### Goal

Use Pactwright Core Delivery to create the first executable deterministic Kakeibo financial-domain foundation.

### Owning Kakeibo specs

```text
02 Financial Domain Model
05 System Architecture/Data — package/layer boundary only
06 Engineering Delivery/Operations — deterministic test expectations
```

### Required Kakeibo work

Before installing the first Pactwright package, establish the minimum pnpm workspace root required by the consumer repository if it does not yet exist.

Then deliver a `packages/domain` slice covering at least:

```text
FinancialEntry movement semantics
planning income
fixed commitments
Needs / Wants / Culture / Unexpected envelopes
plan-funded vs tracking-only goals
goal allocation vs contribution
transfers
credit-card settlement
personal vs business scope
reviewed vs unreviewed truth
preparation-state independence
rule priority / first-match
split conservation
source identity / re-import idempotency
duplicate-candidate vs confirmed-duplicate semantics
plan/goal/rule history preservation
```

### Acceptance

- tests are deterministic and use explicit numeric assertions where applicable;
- domain code has no Hono/Neon/Cloudflare/UI/analytics/provider dependency;
- no research-derived financial target becomes a default/recommendation;
- Pactwright preserves the Contract's financial invariants through Intent → Evidence.

---

## 6. Checkpoint 2 — Remote Delivery / CSV Ingestion Foundation

### Goal

Use GitHub-operated Pactwright Delivery to establish the first real ingestion slice through the canonical general financial core.

### Owning Kakeibo specs

```text
01 Product & UX — import/review preparation
02 Financial Domain — source/entry semantics
05 System Architecture/Data — ingestion architecture
06 Engineering Delivery/Operations — adapter/API/persistence tests
```

### Required Kakeibo work

Establish only the infrastructure needed for the slice:

```text
pnpm + Turborepo structure
Hono application API
Neon app schema / database package
Hyperdrive boundary where required by the environment
R2 upload storage
Cloudflare Workflow import path
financial-ingestion package
```

Deliver:

```text
file FinancialSource
SourceAccount
IngestionRun
SourceRecord provenance
CSV IngestionAdapter
NormalisedSourceRecord
FinancialEntry persistence
source identity / re-import idempotency
invalid-row handling
duplicate-candidate preparation
deterministic rule/history preparation
```

Do **not** describe the output as "canonical spendings". The canonical persisted concept is `FinancialEntry`; the product may later present ordinary outflows as spendings.

### Acceptance

- mobile/private clients never connect directly to Neon;
- R2 owns raw files, not canonical parsed state;
- Neon owns canonical parsed/application state;
- Workflows own resumable multi-step ingestion, not normal CRUD;
- exact re-import does not create another canonical entry;
- financial duplicates still require explicit resolution;
- source/provider semantics do not leak into the financial domain.

---

## 7. Checkpoint 3 — Project Intelligence / Kakeibo Cold Start

### Goal

Prove Project Intelligence can understand the complete multi-owner Kakeibo system, including bounded AI behaviour and unresolved decisions, without flattening it into a generic product summary.

### Required Source corpus

Ingest:

```text
docs/specs/README.md
01
02
03
04
05
06
07
```

Treat each as a separate Source and preserve its owning authority.

### Required distinctions

PI onboarding/context must distinguish:

```text
current product/runtime
planned extension
future optional capability
open decision
non-goal
```

Examples that must remain distinct:

```text
current:
  CSV ingestion
  bounded explicit Kei tasks
  Neon analytics
  weekly review

planned extension:
  Salt Edge Account Information

future optional:
  Ask Kei
  persistent agent runtime
  dynamic skills
  write-capable agent tools

open decisions:
  authentication provider
  billing implementation
  primary model/provider choices within the model-routing boundary
  retention/recovery details where still explicitly open
```

### Kei knowledge ownership test

PI must preserve:

```text
03 → Kei behaviour/authority
05 → Kei runtime architecture
06 → Kei evaluation/release/operations
07 → public/private and open-source transparency
```

A Delivery context needing Kei implementation must receive all relevant owners without treating one as replacement for another.

---

## 8. Checkpoint 4 — Graph Review / Cross-Spec Kakeibo Review

### Goal

Prove specialist Graph Review can find contradictions across the seven-owner Kakeibo system.

### Minimum cross-owner review matrix

```text
02 Financial Domain ↔ 01 Product & UX
01 Product & UX ↔ 04 Mobile Design
03 Kei behaviour ↔ 02 Financial truth
03 Kei behaviour ↔ 05 Kei runtime
03 Kei behaviour ↔ 06 Kei release/evaluation
05 Architecture ↔ 06 Engineering/Operations
05 Architecture ↔ 07 Open-source claims
06 Kei release/evaluation ↔ 07 public evaluation/transparency
01 Product/commercial claims ↔ 07 public surfaces
```

### Required reviewer attention

Reviewers must explicitly look for:

- Kei task/policy authority being assembled ad hoc in route handlers;
- optional skills increasing Kei authority;
- raw imported/provider text being treated as instructions;
- model/provider concerns leaking into financial semantics;
- private production traces accidentally required to understand public production behaviour;
- analytics/telemetry/audit conflation;
- future agentic capability being implemented as if already accepted.

At least one accepted finding must complete Review → PI → governed Delivery.

---

## 9. Checkpoint 5 — Creative Production / Versioned Kei Foundation

### Goal

Prove Creative Delivery against a public-facing Kakeibo claim whose grounding depends on a real, inspectable bounded Kei implementation.

Checkpoint 5 therefore establishes the **offline/repository half** of the Kei engineering lifecycle before publishing a Kakeibo Kei-related public Asset.

### Owning Kakeibo specs

```text
03 Kei Assistant v2
05 System Architecture/Data v2 §23
06 Engineering Delivery/Operations v2 §15 offline gates
07 Open-Source Organisation v2 Kei transparency
```

### Required Kakeibo Delivery A — bounded Kei runtime foundation

Deliver the smallest useful repository-owned Kei subsystem:

```text
packages/kei/
  policy/
  persona/
  tasks/
  schemas/
  evals/
  release/
```

Implement the initial explicit task boundary:

```text
application selects task
→ application builds authorised bounded grounding
→ release resolver selects exact KeiRelease
→ AI Gateway model route
→ structured output
→ deterministic validation
→ display or deterministic fallback
```

Implement at least one real task end to end and contracts for the initial task set.

The first candidate/release manifest must resolve:

```text
Kei semantic version
bundle hash
policy version/hash
persona version/hash
task contract versions/hashes
output schema version/hash
tool/skill set version/hash
model-route reference
application commit
benchmark-suite version/hash
benchmark-dataset version/hash
```

### Required offline gates

Create permanent synthetic/safe evaluation assets covering at least:

```text
financial correctness
evidence discipline
authority / financial safety
tone / usefulness
prompt injection / hostile financial text
operational schema/latency/cost signals where testable offline
```

Hard deterministic assertions have priority over model-judge scores.

Critical cases are evaluated repeatedly where probabilistic variance matters.

A prompt-only behaviour change requires a new Kei release version; do not mutate an already released version.

### Required Kakeibo Delivery B — grounded public Asset

Only after the implementation/evaluation foundation is accepted, use Creative Delivery to create a real Kakeibo public Asset explaining or demonstrating Kei.

Ground public claims in:

```text
03 behavioural contract
05 runtime implementation/architecture
06 evaluation/release rules
07 open-source transparency rules
```

Verify:

- no adviser claims;
- no confidence-score language;
- explicit bounded-task/user-authority model;
- production behaviour is described as Git-traceable/versioned;
- safe benchmark/evaluation assets are public where the implementation exists;
- no raw production financial trace is published.

Then human-approve and publish the exact Asset through normal Review & Creative semantics.

### Out of scope for Checkpoint 5

Production shadowing, canary/A-B comparison and controlled rollout are deferred to Checkpoint 6 because those are production Operations concerns.

---

## 10. Checkpoint 6 — Production Learning / Controlled Kei Experiment

### Goal

Extend Operations with the generic `Experiment` semantics required by the observed Kakeibo use case, then prove the full production-evaluation loop on Kakeibo without adding Kei-specific Pactwright graph types.

### Pactwright semantic authority

Use:

```text
2026-09-02-pactwright-operations-experiment-semantics.md
```

The Operations extension now supports:

```text
Deployment
Experiment
Observation
```

`Experiment` is a native operational exposure. `Observation --observes--> Experiment` reuses the existing relation.

### Kakeibo prerequisites

Kakeibo has:

- an accepted immutable KeiRelease candidate from Checkpoint 5;
- an active baseline KeiRelease/model route or controlled staging equivalent;
- benchmark/red-team hard gates passing;
- exact bundle hashes and model-route references;
- operational/evaluation metadata with raw financial prompts/responses minimised.

### Required Kakeibo production-evaluation work

1. Record exact active and candidate evaluation exposures through normal Deployment semantics.
2. Record an immutable Pactwright Experiment contract before inspecting outcome evidence.
3. Use a safe comparison whose variant does not weaken a Kakeibo invariant.
4. Run shadow mode first when required by `06`.
5. If user-facing comparison is justified and hard gates pass, use limited canary/A-B with stable assignment and predeclared metrics.
6. Observe the Experiment through bounded Operations evidence.
7. Route the result through Observation → internal Source → PI.
8. Accept/reject/promote through normal Kakeibo/Pactwright Delivery governance; Experiment must not auto-promote.
9. Prove rollback can target the smallest failing layer.

### Experiment contract must contain

```text
experiment id
hypothesis
exact control exposure/hash
exact candidate exposure/hash
mode
eligible population
assignment rule
primary metric
guardrail metrics
minimum evidence / decision rule
start/end or review condition
referenced non-experimentable constraints
```

### Kakeibo hard gates

Never A/B weaken:

```text
financial truth
privacy
user authority
confirmation requirements
Known / Likely / Unknown
advice boundaries
canonical state-mutation rules
```

### Shadow acceptance

- active and candidate use the same immutable grounding snapshot where comparison requires it;
- candidate output never reaches the user;
- candidate cannot mutate canonical state or trigger normal product side effects;
- candidate failure cannot delay/fail the active response;
- retained data is evaluation metadata by default, not raw financial prompts/grounding/responses.

### Rollback acceptance

Demonstrate at least one safe drill selecting the smallest relevant recovery:

```text
previous KeiRelease
previous model route
disable one optional Kei task
deterministic fallback
```

Core financial workflows remain usable without Kei.

### Genericity acceptance

Also run one non-Kakeibo fixture proving Pactwright Experiment schema/commands contain no Kei-specific fields.

---

## 11. Checkpoint 7 — Published-Work Feedback

### Goal

Keep the existing Publication → Operations → PI loop, but apply the v2 trust boundary when the Publication concerns Kei.

### Additional Kakeibo acceptance

When observing a Kakeibo publication:

- publication analytics remain external/bounded evidence;
- first-party marketing analytics may supply evidence;
- mobile/product financial behaviour does not flow to Meta;
- if the publication makes Kei claims, the Asset must remain traceable to the exact public behavioural/evaluation sources current when it was approved;
- experiment or production evidence may motivate a superseding Asset, but must not mutate the previously approved Asset.

---

## 12. Checkpoint 8 — Full Project Operating Surface

### Goal

Project the complete first-party Pactwright system including the new Operations Experiment state.

### Additional required Operations projection

The shared GitHub Project gains an `Experiments` view when configured.

Useful derived fields:

```text
mode
hypothesis
control exposure
candidate exposure
primary metric
guardrails
window
current derived state
latest outcome Observation
resulting PI Source / Knowledge / Delivery provenance
```

### Kakeibo acceptance

A real Kakeibo lineage should expose, where applicable:

```text
Delivery Evidence
→ Deployment
→ Experiment
→ Observation
→ PI Source/Knowledge/candidate
→ later Delivery
```

GitHub must remain projection only.

---

## 13. Checkpoint 9 — Hardened Closed Loop / Kei Regression Learning

### Goal

Turn observed failures from the complete programme into permanent evaluation coverage, including Kakeibo's production Kei lifecycle.

### Pactwright evaluation additions

Operations evaluation must include generic cases for:

```text
invalid Experiment exposure/hash
post-record Experiment contract mutation
missing predeclared primary metric/decision rule
invalid shadow user-facing assignment
unstable assignment where stable assignment is required by contract
guardrail evidence ignored by analysis
insufficient evidence represented as conclusive
Experiment Observation attempting automatic promotion
raw experiment samples copied into Project Graph state
```

Do not create one aggregate experiment quality score.

### Kakeibo production-defect loop

Prove at least one real or safely simulated confirmed Kei defect follows:

```text
incident / observed failure
→ minimum reproducible scenario
→ sanitised or synthetic benchmark case
→ regression assertion/evaluator
→ candidate fix
→ new immutable KeiRelease
→ deterministic tests
→ benchmark + red team
→ staging
→ shadow where required
→ controlled promotion or rejection
```

### Kakeibo regression review

Review all seven canonical owners, not the old Financial/Product/Mobile/Kei/Tech-Stack subset.

Inspect specifically for:

```text
financial double counting
preparation becoming reviewed truth
provider lifecycle leaking into review truth
direct mobile → Neon access
analytics/telemetry/audit conflation
Kei calculating canonical values
Kei task selection by the model
optional skills increasing authority
prompt injection through financial-source text
Kei release/model route conflation
dashboard-only production behaviour
unsafe experiment variants
raw private AI traces becoming public artefacts
```

### Failure matrix

Include at least one Experiment failure drill in addition to the existing core/extension failure boundaries.

---

## 14. Graduation — Connected Banking / Salt Edge

### Goal

Prove the complete Pactwright system can add Kakeibo's planned second ingestion mechanism without changing downstream financial, review or Kei semantics.

The graduation scenario is provider-neutral in architecture, with **Salt Edge Account Information** as the current planned first connected-banking implementation.

Canonical boundary:

```text
CSV -----------┐
               │
Salt Edge -----┼→ IngestionAdapter
               │
future --------┘
                    ↓
             NormalisedSourceRecord
                    ↓
               FinancialEntry
                    ↓
             Kakeibo review
```

### Required provider behaviour

Exercise accepted provider-specific work for:

```text
connection session / hosted authorisation
account discovery
initial sync
incremental sync
callback verification/idempotency
pending → posted reconciliation
provider record updates
reconnect
connection removal
rate-limit/retry
provider outage
```

### Semantic invariants

- provider lifecycle remains distinct from Kakeibo review truth;
- provider categories/merchant enrichment are evidence only;
- provider IDs/cursors do not redefine FinancialEntry identity semantics;
- no payment initiation is implied;
- provider outage does not damage trusted history or disable CSV ingestion;
- Salt Edge-specific fields stay outside the financial domain.

### Kei-specific connected-banking regression

Provider labels/references are untrusted data and must remain unable to alter Kei policy/task selection.

A future connected-banking Kei task/skill may explain provider state only within the accepted bounded authority model; it must not cause dynamic agent-selected financial workflows.

---

## 15. Public-source acceptance progression

As Kakeibo capabilities become real, update only the smallest public surface set required to make them inspectable.

For Kei this means, when implemented:

```text
03 behavioural contract
→ policy/persona/task/schema implementation
→ deterministic tests
→ benchmark/red-team definitions + safe synthetic data
→ immutable KeiRelease manifest
→ production promotion evidence at safe/public granularity
→ README/docs trust explanation
```

Do not publish raw production financial traces to prove transparency.

External model/evaluation dashboards may support analysis but cannot become the only source of production-defining Kei behaviour.

---

## 16. Graph boundary summary

The v2 Kakeibo changes require **one generic Pactwright graph addition**:

```text
Operations Graph
├── Deployment
├── Experiment      ← added
└── Observation
```

They do **not** justify adding:

```text
KeiRelease
KeiTask
KeiPolicy
KeiPersona
ModelRoute
BenchmarkCase
```

as Pactwright core/extension node types.

Those are Kakeibo-owned implementation/release artefacts delivered through normal Delivery and referenced by exact production exposures.

The distinction is:

```text
what Kakeibo behaviour is
→ Kakeibo repository + Delivery

what controlled comparison was run in production
→ Pactwright Operations Experiment

what happened
→ Pactwright Operations Observation

what it means for the project
→ Project Intelligence

what to change next
→ normal Delivery
```

---

## 17. Governing test

The Kakeibo proving project is doing its job when a materially richer product requirement can force Pactwright to add a **generic missing responsibility** without causing Pactwright to absorb Kakeibo-specific product semantics.

For the 2026-09-02 v2 update, controlled Experiment truth meets that threshold. Kei-specific release internals do not.
