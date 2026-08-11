# Pactwright — System Architecture

## 1. Purpose

This document describes Pactwright as one integrated system.

It defines:

- the system architecture;
- component boundaries;
- dependency relationships;
- canonical, execution and derived state;
- end-to-end system flows;
- runtime and GitHub operating boundaries.

It does **not** redefine subsystem semantics or implementation sequencing.

Each engineering specification remains authoritative for the component it owns.

This document exists to answer:

> How do the Pactwright components fit together as one coherent system?

Implementation sequencing is defined separately in [**Pactwright — Implementation Guide**](../checkpoints/00-implementation-guide.md).

---

## 2. System Model

Pactwright is a repository-native operating system for AI-assisted project delivery.

Its central abstraction is the **Project Graph**.

The Project Graph combines the required Delivery Graph with optional, independently owned extensions.

```text
Pactwright Project Graph

├── Delivery Graph                         required
├── Project Intelligence Graph             optional
├── Graph Review & Creative Delivery       optional
└── Operations Graph                       optional
```

Around the graph:

```text
Project Graph
    │
    ▼
Pactwright Runtime
    │
    ├── lifecycle
    ├── validation
    ├── context
    ├── extension loading
    ├── graph revision
    ├── agent capabilities
    ├── evaluation
    └── integration generation
    │
    ├───────────────┐
    ▼               ▼
AI Adapter       GitHub
local work       automation + projections
```

The complete project loop is:

```text
Project understanding
        ↓
Intent
        ↓
Delivery
        ↓
Evidence
        ↓
Production exposure
        ↓
Real-world outcome
        ↓
Observation
        ↓
Project Intelligence
        ↓
Future delivery
        ↺
```

Pactwright therefore connects:

**understanding → intent → delivery → production → feedback → improved understanding**

without merging those responsibilities into one graph model.

---

## 3. Authoritative Specifications

This document is an integration map.

Subsystem meaning remains authoritative in the following specifications.

### Delivery Graph and Lifecycle

[Pactwright — Delivery Graph and Lifecycle Engineering Spec](./2026-08-11-pactwright-delivery-graph-and-lifecycle-engineering-spec.md)

Owns:

- core Delivery Graph semantics;
- Delivery node semantics;
- Delivery edges;
- lifecycle state machine;
- context loading;
- Project Graph revision;
- core validation;
- Intent → Evidence flow.

Core Delivery ends at **Evidence**.

### Project Intelligence

[Pactwright — Project Intelligence Graph Engineering Spec](./2026-08-11-pactwright-project-intelligence-graph-engineering-spec.md)

Owns:

- Sources;
- Domain Definitions;
- Knowledge Cards;
- ingestion and triage;
- knowledge promotion;
- onboarding and coverage;
- freshness;
- propagation;
- Delivery context contribution;
- the single project-wide intent-candidate derivation model.

Project Intelligence determines what project evidence **means**.

### Graph Review & Creative Delivery

[Pactwright — Graph Review & Creative Delivery Engineering Spec](./2026-08-11-pactwright-graph-review-and-creative-delivery-engineering-spec.md)

Owns two distinct capability groups.

**Graph Review**

- Review Definitions;
- review execution mechanics;
- Review Execution provenance;
- specialist Project Graph review;
- routing successful review findings into Project Intelligence.

**Creative Delivery**

- creative-delivery integration with the normal Delivery lifecycle;
- generation provenance for extension-owned provider calls;
- generation guidance;
- approved Assets;
- Publications.

It requires Project Intelligence.

### Operations Graph

[Pactwright — Operations Graph Engineering Spec](./2026-08-11-pactwright-operations-graph-engineering-spec.md)

Owns:

- Deployments;
- operational exposures;
- operational source adapters;
- operational execution provenance;
- Observations;
- production feedback;
- corrective-roadmap projection.

It requires Project Intelligence.

### Distribution, Agents and Evaluation

[Pactwright — Distribution, Agents and Evaluation](./2026-08-11-pactwright-distribution-agents-and-evaluation.md)

Owns:

- packaging;
- installation;
- extension dependencies;
- extension locking;
- extension disable/removal;
- agent packs;
- capability resolution;
- adapter generation;
- evaluation;
- GitHub profile composition;
- GitHub desired-state reconciliation.

### GitHub Actions and Views

[Pactwright — GitHub Actions and Views](./2026-08-11-pactwright-github-actions-and-views.md)

Owns the exact GitHub operating surface:

- generated workflows;
- checks;
- PR and Issue projections;
- GitHub Project fields;
- GitHub Project views;
- runtime projection behaviour.

GitHub remains an automation and projection surface.

It is not canonical Project Graph state.

---

## 4. Architectural Boundaries

The primary ownership map is:

```text
Delivery
→ what was requested, agreed and delivered

Project Intelligence
→ what the project currently understands

Review & Creative
→ specialist Project Graph review + approved creative outputs and Publications

Operations
→ what happened after work reached production

Distribution
→ how the system is installed and composed

GitHub
→ how the system is remotely executed and viewed
```

The Review & Creative line deliberately covers two different responsibilities:

```text
Graph Review
→ critique current registered Project Graph state
→ record execution provenance
→ route findings into Project Intelligence

Creative Delivery
→ extend normal Delivery with creative grounding and generation
→ approve durable Assets
→ record Publications
```

Review Execution provenance is not canonical Project Graph truth.

Assets and Publications are canonical extension-owned records.

### Delivery does not own production

Evidence means:

> The agreed work was delivered and verified.

It does not mean:

- deployed;
- published;
- used;
- successful;
- effective.

### Operations does not own project meaning

An Observation means:

> This real-world condition was observed.

It does not automatically mean:

- the project accepts a new conclusion;
- a requirement has changed;
- corrective work must be created.

That interpretation belongs to Project Intelligence.

### Project Intelligence does not own Delivery

Knowledge may motivate future work.

It does not silently create or mutate:

- Intents;
- Contracts;
- Briefs;
- Evidence.

Delivery changes enter the normal Delivery lifecycle.

### Review does not create truth

Graph Review produces findings.

Findings enter:

```text
Finding
→ internal Source
→ Project Intelligence triage
```

A reviewer cannot directly rewrite canonical project meaning.

### Creative approval is distinct from Delivery completion

Creative Delivery uses the normal Delivery lifecycle through Evidence.

After Evidence:

```text
Evidence
→ human Asset approval
→ Asset
→ Publication
```

Asset approval and Publication are Review & Creative semantics, not additional Delivery stages.

### GitHub owns no domain semantics

GitHub consumes Pactwright state.

It must not become:

- another graph;
- another lifecycle engine;
- another roadmap;
- another observability store.

---

## 5. Dependency Model

There are two different dependency classes.

### Graph/package dependencies

```text
Delivery Core
     │
     ▼
Project Intelligence
   ▲             ▲
   │             │
Review &      Operations
Creative
```

Rules:

- Delivery is always present.
- Project Intelligence is optional.
- Review & Creative requires Project Intelligence.
- Operations requires Project Intelligence.
- Review & Creative and Operations do not depend on one another.

They may integrate through explicit compatibility contracts.

Example:

```text
Review & Creative
    owns Publication
          │
          │ registered operational exposure
          ▼
Operations
    observes Publication
```

Operations does not take ownership of Publication.

### Platform dependencies

Distribution and GitHub are not Project Graph subgraphs.

They operate around them.

```text
                    Pactwright Runtime
                         │
          ┌──────────────┴──────────────┐
          │                             │
    Project Graph                  Distribution
          │                             │
          │                      extension + agent
          │                         composition
          │                             │
          └──────────────┬──────────────┘
                         ▼
                       GitHub
                automation + projections
```

Distribution determines which extension profiles are active.

The GitHub specification determines what those profiles mean.

---

## 6. State Model

Pactwright separates three kinds of state.

### Canonical Project Graph state

Durable project truth.

Includes:

**Delivery**

- Intent
- Decision
- Contract
- Brief
- Evidence

**Project Intelligence**

- Source
- Domain Definition
- Knowledge Card

**Review & Creative**

- Asset
- Publication

**Operations**

- Deployment
- Observation

And the shared typed relationships between them.

Canonical state contributes to the deterministic Project Graph revision.

### Execution provenance

Records what happened during an execution without becoming normal graph truth.

Examples:

- Review Execution;
- Generation Record;
- Operations execution record.

Execution provenance may reference a Project Graph revision.

It does not become part of that revision.

### Derived state

Regenerable views over canonical or execution state.

Examples:

- onboarding;
- domain map;
- freshness;
- intent roadmap;
- next actions;
- corrective intent roadmap;
- GitHub checks;
- GitHub PR summaries;
- GitHub Project views.

Derived state can become stale.

Canonical truth remains valid.

---

## 7. Project Graph Revision

The Pactwright runtime derives one deterministic Project Graph revision from canonical registered Project Graph state.

```text
canonical registered graph
          ↓
 deterministic revision
          ↓
 ┌────────┼─────────┬──────────┐
 ▼        ▼         ▼          ▼
reviews  reports  operations  GitHub
```

Extensions and integrations consume this revision.

They do not derive independent graph identities.

The revision excludes:

- generated reports;
- GitHub state;
- execution provenance;
- adapter output;
- provider execution details.

Execution systems that need additional identity record it separately.

For example:

```text
Review Execution
=
Project Graph revision
+
non-graph input manifest
+
execution configuration
+
Generation Records where provider calls occur
```

---

## 8. End-to-End System Flows

### 8.1 Core Delivery

```text
Intent
↓
transient Contract alternatives
↓
Decision
↓
canonical Contract
↓
Brief
↓
Delivery
↓
Review
↓
Evidence
```

Evidence completes the core Delivery lifecycle.

### 8.2 Knowledge-Driven Delivery

```text
Source
↓
triage
↓
Knowledge
↓
intent candidate
↓
Intent capture
↓
normal Delivery lifecycle
```

The intent roadmap proposes work.

It does not create canonical Delivery Intents automatically.

### 8.3 Graph Review

```text
Project Graph
↓
Review Definition
↓
Review Execution
↓
Finding
↓
internal Source
↓
Project Intelligence triage
↓
Knowledge / proposal
```

Review therefore improves the project through the same knowledge-governance path used by other evidence.

### 8.4 Creative Delivery

```text
Intent
↓
Decision
↓
Contract
↓
Brief
↓
Creative Delivery
↓
Review
↓
Evidence
↓
human Asset approval
↓
Asset
↓
Publication
```

Generation attempts remain execution state.

Only approved output becomes an Asset.

Only an approved Asset may become a Publication.

### 8.5 Software Production Feedback

```text
Evidence
↓
Deployment
↓
operational signals
↓
Observation
↓
internal Source
↓
Project Intelligence
↓
Knowledge
↓
corrective intent candidate
↓
normal Delivery lifecycle
```

### 8.6 Creative Production Feedback

```text
Evidence
↓
Asset
↓
Publication
↓
operational signals
↓
Observation
↓
internal Source
↓
Project Intelligence
↓
Knowledge
↓
future delivery candidate
```

The same feedback architecture therefore works for both software and creative production.

---

## 9. Runtime Composition

A Pactwright execution resolves:

```text
core runtime semantics
+
enabled extension semantics
+
selected agent pack
+
project configuration
+
task-specific Project Graph context
```

Stable behaviour belongs as low in the stack as possible.

### Runtime

Owns deterministic mechanics.

### Extensions

Own specialised graph semantics.

### Agent packs

Own fast-moving AI behaviour.

### Skills

Own reusable techniques.

A better prompting or reasoning technique should normally change an agent or skill.

It should not require a Project Graph redesign.

---

## 10. GitHub Operating Model

Local generated integration:

```text
pactwright sync
```

Remote GitHub reconciliation:

```text
pactwright github sync
```

Runtime automation:

```text
GitHub Actions
→ invoke Pactwright
→ update checks and projections
```

Ownership is therefore:

```text
Distribution
→ which GitHub requirements are active

GitHub Actions and Views spec
→ what those requirements mean

pactwright github sync
→ remote desired-state reconciliation

GitHub Actions
→ runtime execution and projections
```

One shared GitHub Project is used by default.

Enabled extensions contribute views rather than creating independent Projects.

---

## 11. System Invariants

The integrated architecture preserves these boundaries:

1. Delivery ends at Evidence.
2. Post-Delivery state remains extension-owned.
3. Project Intelligence owns accepted project meaning and the single intent-candidate derivation model.
4. Graph Review produces findings, not canonical truth.
5. Review Execution and Generation Records remain execution provenance.
6. Human-approved Assets and Publications are canonical Review & Creative state.
7. Operations records production exposure and durable real-world Observations.
8. Raw operational telemetry remains external.
9. Operations findings pass through Project Intelligence before becoming accepted project meaning or future delivery obligations.
10. Review & Creative and Operations remain sibling extensions even when Operations observes Publications.
11. Canonical Project Graph state has one deterministic runtime-supplied revision.
12. GitHub remains regenerable automation and projection state.
13. Disabled extensions may leave preserved canonical state without retaining active behaviour.
14. Agent behaviour can evolve without redefining stable graph semantics.

---

## 12. Governing Rules

For system architecture changes ask:

> Does this require changing ownership between existing components, or can the integration remain explicit across their current boundaries?

For new semantics ask:

> Which component uniquely owns this durable truth?

For Graph Review ask:

> Is this critique of current Project Graph state that should become a finding and enter Project Intelligence?

For Creative Delivery ask:

> Can this reuse the normal Delivery lifecycle and add only the durable approved-output semantics Delivery does not own?

For AI improvements ask:

> Can this change remain in the agent pack, skill or evaluation layer?

For integrations ask:

> Can the components reference one another through typed contracts without copying canonical state or creating unnecessary dependencies?

For production feedback ask:

> What happened, what does it mean, and what should happen next?

Those questions belong respectively to:

```text
Operations
→ Project Intelligence
→ Delivery
```

Keep the system integrated without collapsing its boundaries.

---

**Pactwright — System Architecture v2**
