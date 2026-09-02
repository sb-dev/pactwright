# Pactwright — Kakeibo System-Level Acceptance Profile

**Version:** 2  
**Status:** Cross-owner checkpoint acceptance profile  
**Date:** 2026-09-02

## 1. Purpose

Kakeibo is Pactwright's persistent external proving project.

This profile centralises **Kakeibo-specific system-level acceptance cross-checks** so individual Pactwright checkpoint runbooks do not repeatedly copy product, financial, Kei, architecture, operations and open-source rules that evolve independently.

The Pactwright checkpoints define:

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

Kakeibo semantics always come from the owning canonical Kakeibo specifications. This profile is a cross-owner acceptance layer, not another product specification and not an override mechanism.

Pactwright core/extension semantics remain owned by their Pactwright specifications.

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

Current baseline on 2026-09-02:

```text
03 Kei Assistant                         v2
05 System Architecture and Data         v2
06 Engineering Delivery and Operations  v2
07 Open-Source Project Organisation     v3
```

`docs/specs/README.md` owns the Kakeibo authority/conflict-resolution map.

Do not use retained August Kakeido research snapshots as implementation authority.

Product spelling in new Pactwright material is **Kakeibo**.

---

## 3. Kakeibo architecture and open-source baseline

The accepted product/runtime flow is:

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

Kakeibo maintains **one public product architecture**:

```text
React Native / Expo
Cloudflare
Neon
R2
bounded Kei runtime
AI Gateway
Better Stack
supported external providers
```

The official service is one supported production deployment of that public software. Independent operators use the same supported architecture with their own provider accounts, credentials and operational configuration.

Do not create a separate Community Edition, Self-Hosted Edition, open-source architecture, Docker-only stack, SQLite variant, local object-storage stack, local LLM stack or parallel database/workflow implementation merely to make the repository appear self-hostable.

Private information may differ between deployments. Hidden product architecture may not.

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

public source
≠ production credentials / user data / commercial agreements
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

The ingestion seam is also the strongest initial contribution seam. New adapters must preserve provenance, source identity/idempotency, normalisation, review-state separation, synthetic fixtures and deterministic tests.

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

### Open-source/public-private boundary

Normally public:

```text
product source
financial domain/application behaviour
database migrations
public deployment infrastructure/configuration
canonical specs
technical documentation
synthetic fixtures
Kei policy/persona/task/grounding/output contracts
Kei release manifests
Kei benchmark/red-team definitions + safe synthetic datasets
analytics contracts
CI/CD workflows
contribution/security policy
```

Private by necessity:

```text
production credentials / provider secrets
production financial data
production analytics rows
raw production Kei grounding/prompts/responses with user data
production AI traces with personal/financial data
support/customer data
commercial agreements
billing-account information
emergency/admin credentials
sensitive incident evidence / anti-abuse intelligence where disclosure adds material risk
```

Private material must not become a hidden software dependency.

### Open-source proposition

Kakeibo's public claim is:

> **Kakeibo is open-source personal-finance software. The official Kakeibo service is a supported production deployment of the same public codebase.**

The public repository must contain the real financial/review/Kei product rather than a reduced shell with a private premium core.

Open-source availability does not imply a free hosted tier.

### Licence, trademark and security

```text
software licence → Apache License 2.0
root LICENSE      → authoritative licence text
trademark         → separate from software rights
security reports  → private disclosure route first
```

Forks may exercise software rights without implying official Kakeibo endorsement.

Security-sensitive reports must not be forced through public Issues.

### Repository growth

Repository structure grows from demonstrated responsibility:

```text
real capability
→ real implementation/content
→ repeated or clearly distinct responsibility
→ smallest justified structural expansion
```

not:

```text
possible future capability
→ speculative abstraction
→ permanent maintenance burden
```

Prefer extending existing apps/packages/docs/specs before creating new top-level areas. Do not create marketplace, plugin-registry, LMS, community-portal or agent-framework structure before real evidence justifies it.

### Public knowledge flow

```text
canonical spec
→ implementation
→ tests / Kei benchmarks where applicable
→ release manifest
→ technical docs
→ concise README/site explanation
```

README, Blog, Issues, Discussions and marketing pages may explain or explore. They cannot silently redefine canonical behaviour.

Synthetic financial fixtures replace real personal financial data in tests, docs, screenshots, benchmarks and contributor onboarding.

---

# Checkpoint acceptance slices

## 5. Checkpoint 1 — Core Delivery / Financial Domain

### Goal

Use Pactwright Core Delivery to create the first executable deterministic Kakeibo financial-domain foundation while establishing the minimum open-source repository safeguards that `07` requires from the beginning.

### Owning Kakeibo specs

```text
02 Financial Domain Model
05 System Architecture/Data — package/layer boundary only
06 Engineering Delivery/Operations — deterministic test expectations
07 Open-Source Project Organisation — repository/licence/security foundation only
```

### Required Kakeibo work

Before installing the first Pactwright package, establish the minimum pnpm workspace root required by the consumer repository if it does not yet exist.

Also establish or verify the smallest initial public-repository foundation where absent:

```text
README.md
LICENSE                → Apache-2.0
SECURITY.md            → private disclosure route
CONTRIBUTING.md
canonical docs/specs/ authority set
working deterministic tests
safe synthetic financial fixtures sufficient for the delivered domain slice
```

Do not scaffold Academy, Blog, marketplace, registry, parallel self-hosting architecture or speculative package directories merely because `07` describes where mature content may eventually live.

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
- public synthetic fixtures contain no real personal financial exports;
- the repository licence is Apache-2.0 and security reporting has a private route;
- no hidden private financial/review engine is required for the delivered slice;
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
07 Open-Source Project Organisation — public ingestion/contribution seam
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

The public seam must already be understandable as:

```text
source-specific input
→ IngestionAdapter
→ NormalisedSourceRecord
→ FinancialEntry
```

Do **not** describe the output as "canonical spendings". The canonical persisted concept is `FinancialEntry`; the product may later present ordinary outflows as spendings.

### Acceptance

- mobile/private clients never connect directly to Neon;
- R2 owns raw files, not canonical parsed state;
- Neon owns canonical parsed/application state;
- Workflows own resumable multi-step ingestion, not normal CRUD;
- exact re-import does not create another canonical entry;
- financial duplicates still require explicit resolution;
- source/provider semantics do not leak into the financial domain;
- CSV implementation/fixtures/tests are public-source assets rather than hosted-service-only behaviour;
- core tests do not require production Meta, Salt Edge, app-store or production LLM credentials;
- no official-service secret/configuration becomes a hidden dependency of the ingestion architecture.

---

## 7. Checkpoint 3 — Project Intelligence / Kakeibo Cold Start

### Goal

Prove Project Intelligence can understand the complete multi-owner Kakeibo system, including bounded AI behaviour, open-source governance and unresolved decisions, without flattening it into a generic product summary.

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
07 v3
```

Treat each as a separate Source and preserve its owning authority.

### Required distinctions

PI onboarding/context must distinguish:

```text
current product/runtime/governance
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
  one public product architecture
  Apache-2.0 software licence
  private security-disclosure route
  public production-defining Kei behaviour/evaluation definitions

planned extension:
  Salt Edge Account Information

future optional:
  Ask Kei
  persistent agent runtime
  dynamic skills
  write-capable agent tools
  extension/integration index only after demonstrated ecosystem demand

open decisions before public launch where still unresolved:
  authentication provider
  billing implementation
  primary model/provider choices within the model-routing boundary
  retention/recovery details
  trademark policy maturity
  brand/asset licence
  copyright ownership wording
  contributor licence policy if any
  supported-version/security policy details
  official wording for independent deployments

non-goals:
  Community/Self-Hosted Edition architecture
  alternate local production stack
  marketplace / generic plugin registry
  LMS / badges / course accounts
  community portal built ahead of demand
```

### Knowledge ownership test

PI must preserve:

```text
03 → Kei behaviour/authority
05 → Kei runtime + architecture
06 → Kei evaluation/release/operations
07 → public/private boundary, repository organisation, licensing, deployment and contribution governance
```

A Delivery context needing Kei implementation, deployment documentation, adapter contribution work or public trust material must receive all relevant owners without treating one as replacement for another.

---

## 8. Checkpoint 4 — Graph Review / Cross-Spec Kakeibo Review

### Goal

Prove specialist Graph Review can find contradictions across the seven-owner Kakeibo system, including contradictions between product architecture and its open-source/public representation.

### Minimum cross-owner review matrix

```text
02 Financial Domain ↔ 01 Product & UX
01 Product & UX ↔ 04 Mobile Design
03 Kei behaviour ↔ 02 Financial truth
03 Kei behaviour ↔ 05 Kei runtime
03 Kei behaviour ↔ 06 Kei release/evaluation
02 Financial truth ↔ 07 public financial transparency
05 Architecture ↔ 06 Engineering/Operations
05 Architecture ↔ 07 one public architecture / independent deployment
06 Delivery/Operations ↔ 07 public release/security/deployment expectations
06 Kei release/evaluation ↔ 07 public evaluation/transparency
01 Product/commercial claims ↔ 07 official-service/open-source claims
04 Brand/assets ↔ 07 trademark/asset-licence boundary where relevant
```

### Required reviewer attention

Reviewers must explicitly look for:

- Kei task/policy authority being assembled ad hoc in route handlers;
- optional skills increasing Kei authority;
- raw imported/provider text being treated as instructions;
- model/provider concerns leaking into financial semantics;
- private production traces accidentally required to understand public production behaviour;
- analytics/telemetry/audit conflation;
- future agentic capability being implemented as if already accepted;
- hidden premium financial/review/Kei behaviour not represented in the public repository;
- official-service-only architecture or secret configuration becoming a software dependency;
- deployment docs describing a parallel self-hosting stack rather than the supported architecture;
- public README/site/blog language silently redefining canonical behaviour;
- public Issues being used for vulnerability reports that require private disclosure;
- Apache-2.0 software rights being confused with trademark/brand permission;
- speculative directories/packages/marketplace/LMS/community infrastructure without demonstrated responsibility.

At least one accepted finding must complete Review → PI → governed Delivery.

---

## 9. Checkpoint 5 — Creative Production / Versioned Kei Foundation

### Goal

Prove Creative Delivery against a public-facing Kakeibo claim whose grounding depends on a real, inspectable bounded Kei implementation.

Checkpoint 5 establishes the **offline/repository half** of the Kei engineering lifecycle before publishing a Kakeibo Kei-related public Asset.

### Owning Kakeibo specs

```text
03 Kei Assistant v2
05 System Architecture/Data v2
06 Engineering Delivery/Operations v2 offline gates
07 Open-Source Project Organisation v3 Kei/public-source transparency
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

Do not create `skills/`, `tools/`, `memory/`, `agents/` or `subagents/` merely because an agent framework supports them. Add those structures only if `03`, `05` and `06` later accept the corresponding capability.

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
public source commit
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
07 public/private + Git-traceability rules
```

Verify:

- no adviser claims;
- no confidence-score language;
- explicit bounded-task/user-authority model;
- official production-defining Kei behaviour resolves to public Git-traceable source;
- the official service is not described as having a hidden private Kei behaviour layer;
- safe benchmark/red-team definitions and synthetic evaluation assets are public where implementation exists;
- evaluation assets remain engineering evidence rather than a new marketplace/examples subsystem;
- no raw production financial trace is published;
- external prompt/evaluation dashboards are supplementary, never the sole canonical behaviour source.

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
- production-defining behaviour traceable to public source;
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
- retained data is evaluation metadata by default, not raw financial prompts/grounding/responses;
- private experiment evidence is not copied into the public repository merely to demonstrate open-source transparency.

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

Keep the Publication → Operations → PI loop while enforcing Kakeibo's public/private, canonical-writing and analytics boundaries.

### Additional Kakeibo acceptance

When observing a Kakeibo publication:

- publication analytics remain external/bounded evidence;
- first-party marketing analytics may supply evidence;
- mobile/product financial behaviour does not flow to Meta;
- no identifiable production financial data appears in public content;
- if the publication makes Kei claims, the Asset remains traceable to the exact public behavioural/evaluation sources current when it was approved;
- public writing may propose ideas but cannot silently redefine `01`–`07`;
- later Experiment/production evidence may motivate a superseding Asset but cannot mutate the original approved Asset;
- software licensing, trademark/brand permission and third-party asset licensing remain distinct when public creative work uses Kakeibo branding/assets.

---

## 12. Checkpoint 8 — Full Project Operating Surface

### Goal

Project the complete first-party Pactwright system including Operations Experiment state while preserving Kakeibo's public contribution/security boundaries.

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

GitHub remains projection only.

Kakeibo repository collaboration surfaces preserve their own authority:

```text
Issues       → actionable work, not canonical behaviour
Discussions  → exploration/questions, not canonical behaviour
SECURITY.md  → private vulnerability route
PRs          → implementation proposals; canonical changes identify/update owning spec
```

No Project view, Issue, Discussion or PR field may turn a noncanonical proposal into Kakeibo product truth.

---

## 13. Checkpoint 9 — Hardened Closed Loop / Open-Source Readiness / Kei Regression Learning

### Goal

Turn observed failures into permanent evaluation coverage, prove Kakeibo's production Kei regression lifecycle, and harden the public repository so the real supported product can be inspected, deployed and contributed to without a hidden parallel architecture.

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

Production failure evidence becomes public regression coverage only after minimum reproduction and sanitisation/synthetic reconstruction.

### Kakeibo seven-owner regression review

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
hidden premium financial/review/Kei implementation
official-service-only software dependency
parallel Community/Self-Hosted architecture
public docs/README/blog contradicting canonical specs
Apache-2.0/trademark/asset-rights conflation
public vulnerability disclosure where private reporting is required
speculative marketplace/plugin/LMS/community infrastructure
repository areas with no demonstrated responsibility
```

### Public repository readiness

By Checkpoint 9 acceptance, Kakeibo's public repository must contain or deliberately resolve the initial-public-project surfaces required by `07`:

```text
README.md
LICENSE                    → Apache-2.0
SECURITY.md                → private disclosure + supported-version process
CONTRIBUTING.md
CODE_OF_CONDUCT.md
TRADEMARKS.md              → software rights separated from official branding
CHANGELOG / Releases
canonical specs
working source + tests
synthetic financial fixtures
public Kei benchmark/red-team assets
basic product/technical/deployment docs
```

The README/public trust path must explain, without duplicating all documentation:

```text
what Kakeibo is
weekly-review model
why open source
financial / AI / privacy boundaries
Kei behaviour + evaluation
architecture at a glance
Quick Start / tests
deployment
canonical specs
contributing / security
official service
licence / trademark
```

### Independent-deployment acceptance

Prove that a technically capable operator can follow the documented supported architecture using operator-owned provider accounts/credentials without access to hidden official code/configuration.

The proof may use test/sandbox provider configuration where production accounts are inappropriate. The core Quick Start must not require production Meta, Salt Edge, mobile-store submission or production LLM credentials merely to run tests and a representative review flow.

Deployment docs separate:

```text
required
optional capability
production-only
future
```

and cover the actual managed-provider architecture rather than inventing a second local-production stack.

### Contribution/governance acceptance

Verify lightweight contributor mechanics support:

```text
Level 1 local improvement
Level 2 behavioural implementation
Level 3 canonical change
```

Meaningful PRs identify affected canonical spec plus privacy/security/analytics/Kei/release impact where relevant.

Structural expansion follows the `07` evidence rule. Do not scaffold a marketplace, plugin framework, LMS or community portal for launch completeness.

### Pre-public-launch decisions

Resolve or explicitly document the accepted mechanism for remaining `07` launch decisions:

```text
trademark policy
brand/asset licence
copyright ownership wording
contributor licence policy if any
supported-version/security policy
official wording for independent deployments
```

Do not add a Contributor Licence Agreement without a concrete reason.

### Failure matrix

Include at least one Experiment failure drill plus an open-source boundary drill, for example:

```text
private production trace accidentally selected for a public artefact
or
hidden official-only configuration required by a documented independent deployment
```

The failure must be caught before publication/release acceptance.

---

## 14. Graduation — Connected Banking / Salt Edge

### Goal

Prove the complete Pactwright system can add Kakeibo's planned second ingestion mechanism without changing downstream financial, review or Kei semantics, while exercising the v3 public adapter/contributor/deployment model.

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

### Public adapter contract

Salt Edge graduates as a normal public ingestion implementation, for example:

```text
packages/financial-ingestion/
  core/
  csv/
  salt-edge/
```

Public:

```text
adapter implementation
mapping / normalisation
callback logic
synthetic fixtures
deterministic tests
provider setup/sandbox documentation
known limitations/recovery guidance
```

Private:

```text
production credentials / private keys
commercial/provider agreement
production connection/user data
```

Every deployment uses operator-owned Salt Edge credentials where that capability is enabled.

### Semantic invariants

- provider lifecycle remains distinct from Kakeibo review truth;
- provider categories/merchant enrichment are evidence only;
- provider IDs/cursors do not redefine FinancialEntry identity semantics;
- no payment initiation is implied;
- provider outage does not damage trusted history or disable CSV ingestion;
- Salt Edge-specific fields stay outside the financial domain;
- the public adapter does not create a second Kakeibo financial model;
- adding the second real source still does not justify a generic plugin marketplace/registry unless concrete ecosystem demand exists.

### Adapter contribution acceptance

Prove the adapter boundary is understandable enough that another contributor could implement a compatible source using:

```text
source identity
raw-source boundary
normalisation
idempotency
fixtures
failure behaviour
known limitations
```

without changing the financial core.

### Kei-specific connected-banking regression

Provider labels/references are untrusted data and must remain unable to alter Kei policy/task selection.

A future connected-banking Kei task/skill may explain provider state only within the accepted bounded authority model; it must not cause dynamic agent-selected financial workflows.

### Public synchronisation

When Salt Edge becomes usable, update the smallest necessary public surfaces:

```text
adapter implementation
ingestion/provider docs
security/provider notes
fixtures/tests
README capability summary
release notes
website capability summary where user-relevant
```

Do not mechanically update every public surface.

---

## 15. Public-source acceptance progression

As Kakeibo capabilities become real, update only the smallest public surface set required to make them understandable, inspectable and operable.

General flow:

```text
canonical spec
→ implementation
→ tests/evaluation
→ release artefact
→ technical/reference docs
→ concise public explanation
```

Kei flow:

```text
03 behavioural contract
→ policy/persona/task/schema implementation
→ deterministic tests
→ benchmark/red-team definitions + safe synthetic data
→ immutable KeiRelease manifest
→ production promotion evidence at safe/public granularity
→ README/docs trust explanation
```

Ingestion flow:

```text
ingestion contract
→ CSV adapter
→ Salt Edge adapter
→ contributor/deployment guide
```

Synthetic fixtures should be reused across domain/adapter/API tests, Kei evaluation, documentation, screenshots and contributor onboarding where safe.

Do not publish raw production financial traces to prove transparency.

External model/evaluation dashboards may support analysis but cannot become the only source of production-defining Kei behaviour.

---

## 16. Graph boundary summary

The earlier Kakeibo v2 runtime changes required **one generic Pactwright graph addition**:

```text
Operations Graph
├── Deployment
├── Experiment
└── Observation
```

The v3 open-source organisation changes do **not** justify another Pactwright graph node type. They strengthen repository/public/private/contribution/deployment acceptance around existing project truth.

Do **not** add:

```text
KeiRelease
KeiTask
KeiPolicy
KeiPersona
ModelRoute
BenchmarkCase
OpenSourceEdition
AdapterMarketplace
```

as Pactwright core/extension node types.

Those remain Kakeibo-owned implementation/release/governance concepts delivered through normal Delivery where applicable.

The distinction is:

```text
what Kakeibo behaviour is
→ Kakeibo canonical specs + repository + Delivery

what controlled comparison was run
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

The Kakeibo proving project is doing its job when materially richer product requirements can force Pactwright to add a **generic missing responsibility** without causing Pactwright to absorb Kakeibo-specific semantics.

The controlled-production need justified generic `Experiment` semantics because it introduced a reusable missing Operations responsibility.

The Open-Source Project Organisation v3 update does not cross that threshold. Its requirements are correctly expressed as Kakeibo repository, governance, deployment, security, contribution and public-product acceptance using Pactwright's existing Delivery, Review, Creative, Operations and Project Intelligence capabilities.
