# Pactwright Operations

## 1. Purpose

Operations is an optional Pactwright Extension that connects completed Delivery to real-world outcomes.

Its core flow is:

```text
Evidence
→ production exposure
→ bounded operational evidence
→ Observation
→ Project Intelligence Source
→ Knowledge / Intent candidate
→ normal Delivery lifecycle
```

Operations answers:

> What happened after delivered or published work reached the real world?

It provides:

- Deployment semantics for software;
- support for Extension-contributed exposure types such as Publication;
- operational source integration;
- bounded evidence collection;
- signal compression;
- durable Observations;
- operational execution provenance;
- Project Intelligence hand-off;
- a corrective Delivery view derived from Project Intelligence candidates.

Operations is not an observability platform, telemetry database, incident-management system, analytics warehouse or second roadmap engine.

External operational systems remain authoritative for detailed runtime evidence.

---

## 2. Scope and Ownership

Operations owns:

```text
Deployment
Observation
operational exposure integration
operational source configuration
source adapters
environment configuration
bounded evidence collection
operational analysis/compression
operational execution provenance
corrective-intent-roadmap projection
```

It does not own:

```text
Delivery Evidence
Asset
Publication
Project Intelligence Knowledge
Delivery Intents
project-wide prioritisation
raw telemetry
external observability systems
```

The ownership boundary is:

```text
Delivery
→ what was successfully delivered

Assets / Publication
→ what approved output was published

Operations
→ what happened after exposure

Project Intelligence
→ what the project concludes from those outcomes
```

Operations requires Project Intelligence because every canonical Observation uses Project Intelligence as its durable meaning and consequence path.

---

# 3. Core Invariants

1. Production exposure is distinct from successful Delivery Evidence.
2. Deployment is post-Delivery Extension state, not a Delivery lifecycle stage.
3. Raw logs, traces, metrics, analytics events and support messages are not Project Graph nodes.
4. Observations are compressed operational facts supported by addressable evidence.
5. Positive and negative outcomes use the same Observation model.
6. Every canonical Observation enters Project Intelligence through normal Source ingestion.
7. An Observation does not automatically become accepted project Knowledge.
8. Operations cannot directly create or prioritise canonical Delivery Intents.
9. The corrective intent roadmap is a filtered view of Project Intelligence candidates, not a second roadmap engine.
10. Operations consumes the deterministic Project Graph revision supplied by Pactwright runtime.
11. Historical Deployment and Observation records are not silently rewritten.
12. Canonical corrections use explicit supersession.
13. Adding an operational data source does not require new Project Graph semantics.
14. Adding a compatible exposure type does not require new Observation semantics.
15. External operational systems remain authoritative for detailed telemetry.

---

# 4. Production Exposure

An operational exposure identifies work that reached a surface where real-world outcomes can occur.

Operations supports:

```text
native exposure
→ Deployment
```

and:

```text
Extension-contributed exposure
→ compatible registered Project Graph node
```

Initially:

```text
software:
Evidence
→ Deployment
```

and, when Assets / Publication is enabled:

```text
published output:
Asset
→ Publication
```

Operations owns Deployment.

Assets / Publication continues to own Publication.

Operations references compatible exposure records rather than copying them.

A Pactwright Extension may declare compatible exposure node types through its manifest. Operations resolves those registrations rather than hard-coding every future Extension.

---

# 5. Deployment

A Deployment records that delivered software became active in an operating environment.

Minimum structure:

```yaml
id: deployment-...
type: deployment
title: ...
created: ...

environment: production

delivery_evidence: evidence-...

artifact:
  revision: ...
  locator: ...
  hash: ...

deployed_at: ...
deployed_by: human:... | automation:...
```

The canonical relationship is:

```text
Evidence --deployed-as--> Deployment
```

A Deployment must:

- reference valid Delivery Evidence;
- identify the deployed artefact and exact content/revision identity;
- reference a configured environment;
- record deployment time and actor;
- remain immutable once recorded.

A genuine redeployment or rollback creates another Deployment.

Correction of canonical Deployment information uses `supersedes` rather than silent mutation.

Repeated recording of the **same deployment event** must be idempotent and must not create uncontrolled duplicates.

The exact deployment-event identity needed to distinguish a retry from a genuine redeployment is not defined by the existing source and remains an explicit gap.

---

# 6. Operational Sources and Environments

Operational evidence may come from monitoring, logs/traces, error tracking, analytics, deployment systems, support systems, customer feedback, incidents, application databases, publication analytics or repository/issue systems.

These remain external evidence stores.

Repository configuration is conceptually:

```text
.pactwright/operations/
├── sources/
└── environments/
```

A source definition may contain:

```yaml
id: checkout-errors
type: metrics
adapter: prometheus

target: ...
evidence: ...
schedule: hourly
```

An environment definition identifies a stable operating surface such as `production`, `staging`, a regional deployment or another registered surface.

Credentials must never live in canonical Operations records.

---

# 7. Source Adapters

Provider-specific operational integrations are adapters.

Adding a source adapter requires only:

```text
adapter implementation
source schema
conformance tests
```

It must not require new graph semantics.

Source adapters collect operational evidence. They do not determine Project Intelligence meaning or Delivery priority.

---

# 8. Signal Collection Boundary

The Project Graph must remain high signal.

Do not create Project Graph nodes for:

```text
individual log entries
traces
metric samples
analytics events
page views
clicks
alerts
raw support messages
monitoring payloads
```

Operations collects only bounded evidence needed to decide whether a durable Observation is justified.

```text
high-volume operational evidence
        ↓
bounded collection
        ↓
analysis / compression
        ↓
0..n Observations
```

Insufficient or unimportant evidence legitimately produces no Observation and no canonical graph mutation.

---

# 9. Operational Execution Provenance

**Every collection and every analysis run creates immutable operational execution provenance.**

Execution provenance is not a Project Graph node.

Conceptually:

```yaml
id: operations-execution-...
operation: ingest | observe
source: checkout-errors

graph_revision: ...

window:
  from: ...
  to: ...

exposures: []

evidence:
  locators: []

observations:
  created: []
  matched: []

status: succeeded | failed
created: ...
failure: null | ...
```

It preserves:

- operation and source;
- evidence/query window;
- Project Graph revision;
- relevant exposures;
- external evidence locators;
- resulting or matched Observations;
- failure information.

External evidence referenced by an Observation must remain addressable enough to audit the finding. The policy for evidence locators that later expire, mutate or become inaccessible remains unresolved; Operations must not pretend an unreachable locator is reproducible evidence.

---

# 10. Observation

An Observation is a concise durable real-world fact worth retaining in the Project Graph.

Minimum structure:

```yaml
id: observation-...
type: observation
title: ...
created: ...

exposure:
  id: ...
  hash: ...

window:
  from: ...
  to: ...

finding: ...

direction: negative | positive | mixed | neutral
significance: advisory | material | critical
confidence: low | medium | high

evidence:
  - source: ...
    locator: ...
    summary: ...

baseline: null | ...
```

The canonical relationship is:

```text
Observation --observes--> operational exposure
```

An Observation must:

- state a factual operational finding;
- identify the exact exposure or project surface observed;
- define its evidence window;
- reference supporting evidence;
- preserve uncertainty;
- avoid unsupported causal claims;
- remain compact enough for normal Project Graph use.

When the finding depends on comparison, the relevant baseline should be recorded.

`significance` does not determine Project Intelligence triage class, Knowledge status, roadmap priority or automatic Delivery creation.

---

# 11. Observation Identity, Deduplication and Supersession

Repeated evidence must not create unlimited duplicate Observations.

Possible outcomes are:

```text
new durable finding
→ create Observation

same meaning + additional evidence
→ retain existing Observation

materially changed meaning
→ create new Observation
→ supersede earlier Observation where appropriate
```

Observation records are immutable for their evidence window.

Later evidence describing resolution or a materially changed condition creates another Observation rather than rewriting history.

`supersedes` relationships between Observations must be explicit and acyclic.

The exact stable identity/deduplication key used to separate deterministic duplicate detection from semantic comparison is not fully defined and remains an implementation gap.

---

# 12. Correlation and Causality

Operations may correlate findings with Deployments, Publications, Delivery lineages, prior Observations and accepted Project Intelligence Knowledge.

But:

```text
after
≠ caused by
```

An Observation may state that a signal changed after an exposure when supported without claiming that the exposure caused the change.

Stronger causal interpretation requires adequate evidence and may later become Project Intelligence Knowledge.

---

# 13. Project Intelligence Hand-Off

Every canonical Observation enters Project Intelligence through normal internal Source ingestion.

```text
Observation
→ internal Source
→ triage
→ Knowledge / candidate where justified
```

The Source must retain provenance to:

- Observation id and content hash;
- observed exposure;
- supporting external evidence locators;
- originating Operations execution where applicable.

Operations ends at operational truth.

It must not directly:

```text
create or edit Knowledge
alter Domain Definitions
create canonical Delivery Intents
amend Contracts or Briefs
reprioritise Delivery work
```

A failed Project Intelligence hand-off leaves the Observation valid and retryable without rerunning collection or analysis.

---

# 14. Corrective Delivery and Roadmap

Operational evidence may motivate future Delivery only through Project Intelligence:

```text
Observation
→ Project Intelligence Source
→ accepted Knowledge
→ Intent candidate
→ normal Intent capture
→ Contract lifecycle
```

Operations may contribute evidence such as significance, frequency, recurrence, user impact, duration, affected exposure, Delivery lineage, regression against baseline and whether a condition remains active.

Project Intelligence combines those signals with project-wide constraints and remains authoritative for candidate readiness and ordering.

Operations exposes the derived report:

```text
docs/operations/reports/corrective-intent-roadmap.md
```

It is a filtered projection of existing Project Intelligence candidates motivated by Operations provenance.

Roadmap entries are **derived candidates, not canonical Intents**.

Editing the report must not create an Intent or change priority.

Every generated corrective roadmap identifies the Project Graph revision from which it was derived.

Regeneration uses the current deterministic Project Graph revision unless the operation explicitly requests a pinned revision.

The exact CLI syntax for requesting a pinned corrective-roadmap regeneration is not yet defined.

---

# 15. Assets / Publication Integration

When Assets / Publication is enabled, Publication may act as an operational exposure.

```text
Publication
→ Observation
```

Operations references the existing Publication and must not copy, replace, mutate or redefine it.

Publication validity remains independent of Operations processing.

---

# 16. Graph Review and Delivery Context

Graph Review may inspect Deployments, Observations and accepted operational Knowledge when analysing wider project state.

It must not become an alternative operational evidence pipeline.

Accepted operational meaning may influence future Contract crafting, Brief generation, Delivery and Review through Project Intelligence.

Raw telemetry must not be loaded directly into normal Delivery context merely because Operations can access it.

---

# 17. Operations Analysis Capability

Operations requires one distinct Pactwright AI responsibility:

```text
operations-analysis
```

It covers:

- interpreting bounded operational evidence;
- comparing evidence with baselines;
- correlating signals with known exposures;
- distinguishing noise from durable findings;
- preserving uncertainty;
- producing concise candidate Observations.

The selected Agent Pack determines the implementation of this capability.

No specific Production Skills or Deep Research Skills dependency is established by the source contract and none is required by this specification.

Deterministic responsibilities remain in Pactwright runtime, including source collection, hashing, exposure resolution, schema validation, graph mutation, edge creation, Project Intelligence hand-off and report generation.

---

# 18. Commands

The supported Operations command surface is:

```text
pactwright operations record-deployment <evidence-id>
pactwright operations ingest [<source-id>]
pactwright operations observe [<source-id>]
pactwright operations refresh
pactwright operations corrective-roadmap
pactwright operations validate
```

`record-deployment`

Creates a Deployment from valid Delivery Evidence plus configured environment and artefact information.

`ingest`

Collects bounded evidence from configured operational sources and records collection execution provenance. It does not require creation of an Observation.

`observe`

Analyses collected evidence and creates or supersedes Observations only when durable findings are sufficiently supported.

`refresh`

Runs configured ingestion and Observation processing for eligible sources.

`corrective-roadmap`

Regenerates the Operations-filtered corrective roadmap from current Project Intelligence candidates.

`validate`

Validates Operations-owned graph semantics, source/environment configuration, execution provenance and cross-graph relationships.

`ingest` and `observe` are deliberately distinct responsibilities. The exact persistence/lifetime of bounded evidence between those commands is not yet defined; implementations must preserve provenance and retryability without turning raw operational evidence into Project Graph state.

---

# 19. Automation

Automation may:

- record Deployment from trusted deployment events;
- run scheduled `refresh`;
- collect bounded source evidence;
- invoke Observation analysis;
- hand canonical Observations to Project Intelligence;
- regenerate the corrective roadmap;
- run Operations validation.

Automation must not silently rewrite Evidence, alter Asset/Publication state, accept Project Intelligence Knowledge, create canonical Delivery Intents or alter project-wide priority.

Exact GitHub triggers, workflow paths, checks and Project views belong to the GitHub Integration specification.

---

# 20. Repository Model

Conceptually:

```text
docs/operations/
├── deployments/
├── observations/
└── reports/
    └── corrective-intent-roadmap.md

.pactwright/operations/
├── sources/
└── environments/

.pactwright/executions/
└── operations/
```

Canonical Operations state is:

```text
Deployment
Observation
typed relationships
```

Operational execution records and the corrective roadmap are non-canonical provenance/derived views.

External telemetry remains external.

---

# 21. Failure and Idempotency

## Deployment

- invalid Delivery Evidence prevents Deployment creation;
- deployment-recording failure does not mutate Evidence;
- repeated recording of the same deployment event is idempotent;
- genuine redeployments and rollbacks remain distinct Deployment events.

## Collection

- source authentication or availability failure creates a failed Operations execution record;
- failed collection creates no canonical graph mutation;
- retries are bounded by adapter policy;
- deterministic validation failures stop immediately;
- one unavailable source does not invalidate existing Operations truth.

## Observation analysis

- every analysis attempt records execution provenance;
- failed analysis creates no canonical Observation;
- insufficient evidence creates no Observation;
- duplicate findings do not create uncontrolled graph growth;
- supersession is explicit;
- failed Project Intelligence hand-off leaves the Observation valid and retryable.

## Corrective roadmap

- report-generation failure does not mutate canonical graph state;
- regenerated reports use the current deterministic Project Graph revision unless explicitly pinned.

---

# 22. Validation

`pactwright operations validate` must enforce at least:

1. every Deployment references valid Delivery Evidence;
2. every Deployment identifies a valid deployed artefact and configured environment;
3. every `deployed-as` edge has valid `Evidence → Deployment` endpoints;
4. every Observation references a valid registered operational exposure;
5. every Observation defines a valid evidence window;
6. every Observation contains supporting evidence references;
7. every Observation uses valid `direction`, `significance` and `confidence` enum values;
8. every `observes` edge points from `Observation` to a registered operational exposure type;
9. Observation and Deployment supersession relationships are valid and acyclic;
10. canonical Operations records contain no credentials or raw high-volume telemetry;
11. every collection and analysis attempt has execution provenance with status and Project Graph revision;
12. failed collection or analysis did not mutate canonical Operations state;
13. every canonical Observation has either a valid Project Intelligence Source hand-off or a recorded retryable hand-off failure;
14. Extension-contributed exposures remain owned by their source Extension;
15. the corrective-intent roadmap identifies its source Project Graph revision;
16. corrective-roadmap entries are derived Project Intelligence candidates rather than canonical Intents;
17. Operations does not directly mutate Delivery, Project Intelligence, Asset or Publication canonical state.

Core `pactwright validate` may invoke Operations validation when the Extension is enabled.

---

# 23. Evaluation

Operations evaluation tests `operations-analysis` plus deterministic Extension semantics.

It should cover:

- signal-to-Observation compression;
- correct exposure attribution;
- factual grounding;
- baseline interpretation;
- false-positive avoidance;
- unsupported causality avoidance;
- duplicate finding handling;
- positive finding recognition;
- correct Project Intelligence routing;
- scope discipline;
- no Observation when evidence is insufficient;
- no canonical mutation after failed collection or analysis.

Prefer deterministic assertions for schema, evidence references, edge direction, forbidden mutations and absence of raw telemetry in Project Graph state.

Do not collapse semantic quality into one aggregate score.

---

# 24. Anti-Overengineering Constraints and Open Gaps

Do not introduce initially:

```text
observability database
telemetry warehouse
incident-management platform
alert manager
generic event-processing engine
Operations-specific knowledge graph
independent prioritisation engine
automatic root-cause system
universal analytics abstraction
one Project Graph node per operational event
```

Use:

```text
Exposure
→ bounded external evidence
→ Observation
→ Project Intelligence
```

The following gaps remain explicit rather than being invented here:

- stable deployment-event identity for distinguishing command retries from genuine redeployments;
- stable Observation identity/deduplication rules where semantic equivalence is involved;
- evidence-retention/addressability policy for external locators that expire, mutate or become inaccessible;
- persistence and lifetime of bounded evidence between `ingest` and `observe`;
- CLI ergonomics for explicitly pinned corrective-roadmap regeneration.

---

# 25. Current Implementation Baseline

The original Operations research established the surviving contracts:

- Operations requires Project Intelligence;
- Deployment and Observation are the canonical Operations node types;
- `deployed-as` and `observes` are deterministic typed relationships;
- raw telemetry remains external;
- every collection/analysis run records provenance;
- failed collection/analysis creates no canonical mutation;
- insufficient evidence creates no Observation;
- canonical Observations enter Project Intelligence;
- failed Project Intelligence hand-off is retryable;
- corrective roadmap is a derived Project Intelligence candidate view;
- generated corrective roadmaps identify their Project Graph revision;
- repeated deployment recording must not create uncontrolled duplicates.

The redesign preserves these semantics while separating Graph Review and Assets / Publication and retaining `operations-analysis` as the Operations-specific AI responsibility.

---

# 26. Relationship to Other Canonical Specifications

```text
01 Core System and Lifecycle
→ owns Delivery through Evidence

02 Distribution, Agent Packs, Extensions and Evaluation
→ distributes Operations and resolves `operations-analysis`

03 Project Intelligence
→ owns durable project meaning and the authoritative Intent-roadmap model

04 Graph Review
→ may inspect Operations state but does not produce operational truth

05 Assets and Publication
→ owns Publication as an optional operational exposure

06 Operations
→ owns Deployment, Observation and operational evidence processing

07 GitHub Integration
→ owns exact Operations automation and GitHub projections

08 Open-Source Project Organisation
→ governs repository and ecosystem structure
```

---

# 27. Governing Rule

> **Operations records which delivered work reached real operating surfaces and compresses bounded external evidence into durable Observations. Every canonical Observation enters Project Intelligence for meaning and Delivery consequence. Operations never turns raw telemetry into Project Graph state, never creates canonical Intents directly, and never becomes a second prioritisation or observability system.**

---

**Pactwright Operations v1**