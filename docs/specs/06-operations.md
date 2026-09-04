# Pactwright Operations

## 1. Purpose

Operations is an optional Pactwright Extension that connects completed Delivery to real-world outcomes.

Its core flow is:

```text id="u4v5zo"
Evidence
→ production exposure
→ real-world signals
→ Observation
→ Project Intelligence Source
→ Knowledge / future Delivery candidate
```

It answers:

> What happened after delivered or published work reached the real world?

Operations provides:

- production traceability;
- Deployment semantics for software;
- support for other registered exposure types such as Publication;
- operational source integration;
- bounded evidence collection;
- signal compression;
- durable Observations;
- operational provenance;
- Project Intelligence hand-off.

It is not an observability platform, telemetry database, incident-management system or second roadmap engine.

External operational systems remain the detailed evidence stores.

Pactwright retains only durable operational truth worth preserving in the Project Graph.

---

## 2. Scope and Ownership

Operations owns:

```text id="rmtl5w"
Deployment
Observation
operational exposure integration
operational source configuration
environment configuration
signal collection and compression
operational execution provenance
Operations-derived views
```

It does not own:

```text id="5x8fqo"
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

```text id="vef4te"
Delivery
→ what was successfully delivered

Assets / Publication
→ what approved output was published

Operations
→ what happened after exposure

Project Intelligence
→ what the project concludes from those outcomes
```

---

# 3. Extension Boundary

Operations is a sibling Pactwright Extension:

```text id="q50new"
Pactwright Project Graph
├── Delivery Graph                 core
├── Project Intelligence           optional
├── Graph Review                   optional
├── Assets / Publication           optional
└── Operations                     optional
```

Operations requires Project Intelligence because durable operational meaning and future Delivery consequences flow through its governance.

```text id="vi3bez"
Operations
    ↓ requires
Project Intelligence
    ↓
Pactwright Core
```

Assets / Publication is an independent sibling.

When both are enabled, a Publication may become an operational exposure.

Graph Review may inspect Operations state but does not own it.

---

# 4. Delivery vs Production Reality

Successful Delivery Evidence and successful real-world operation are different claims.

```text id="tsdvkl"
Evidence
→ the Contract was delivered and verified

Deployment / Publication
→ the result became exposed

Observation
→ what happened after exposure
```

A system may satisfy its Contract and later:

- fail under production load;
- produce unexpected user behaviour;
- perform better than expected;
- create operational cost;
- generate new evidence about user needs.

Likewise, a published Asset may be correct and approved but perform poorly after publication.

Operations must preserve this distinction.

---

# 5. Production Exposure

An operational exposure identifies work that reached a surface where real-world outcomes can occur.

Operations supports:

```text id="9yjp4m"
native exposure
→ Deployment
```

and:

```text id="mmwc8q"
Extension-contributed exposure
→ registered compatible Project Graph node
```

Initially:

```text id="fl9zrk"
software:
Evidence
→ Deployment
```

and, when Assets / Publication is enabled:

```text id="9mbofz"
published output:
Evidence
→ Asset
→ Publication
```

Operations owns Deployment.

Assets / Publication continues to own Publication.

Operations references compatible exposure records rather than copying them into Operations-owned equivalents.

---

# 6. Exposure Registration

A Pactwright Extension may declare that one of its canonical node types can act as an operational exposure.

Conceptually:

```yaml id="3rfiez"
operations:
  exposure_types:
    - publication
```

Operations resolves compatible exposure types from enabled Extension manifests.

It must not hard-code every future production domain or Extension.

A valid exposure type must provide stable enough identity for an Observation to reference the exact exposed work.

---

# 7. Deployment

A Deployment records that delivered software became active in an operating environment.

Conceptually:

```yaml id="p1n3e0"
id: deployment-...
environment: production

delivery_evidence: evidence-...

artifact:
  revision: ...
  locator: ...
  hash: ...

deployed_at: ...
deployed_by: ...
```

A Deployment must:

- reference valid Delivery Evidence;
- identify the deployed artefact;
- identify the environment;
- preserve deployment time and authority.

Repeated deployments create distinct records.

Rollback and redeployment also create new records.

Deployment does not mutate Evidence.

Deployment success does not prove production correctness.

---

# 8. Deployment Immutability

A Deployment records a historical exposure event.

It must not be silently rewritten because the deployed state later changes.

Corrections to canonical Deployment information use explicit supersession where needed.

Operational state such as:

```text id="usj51c"
currently active
rolled back
superseded
```

may be derived from Deployment relationships rather than repeatedly mutating historical records.

---

# 9. Operational Sources

Operations may gather evidence from systems such as:

- monitoring platforms;
- logs and traces;
- error trackers;
- analytics platforms;
- deployment systems;
- support systems;
- customer-feedback platforms;
- incident systems;
- application databases;
- publication analytics;
- repository or issue systems.

These remain external systems.

Pactwright does not mirror their full datasets.

The integration model is:

```text id="3u3vu6"
external operational system
        ↓
source adapter
        ↓
bounded evidence window
        ↓
analysis / compression
        ↓
Observation
```

---

# 10. Source and Environment Configuration

Repository-specific operational integration belongs under Operations configuration.

Conceptually:

```text id="lnn4ld"
.pactwright/operations/
├── sources/
└── environments/
```

A source definition may contain:

```yaml id="nzdpig"
id: checkout-errors
adapter: prometheus

target: ...
evidence: ...
schedule: hourly
```

An environment definition identifies operating surfaces such as:

```text id="wm7438"
production
staging
regional production
public website
published channel
```

Credentials must not be stored in canonical Operations records.

---

# 11. Source Adapters

Provider-specific operational integrations are adapters.

Adding a source adapter should require only:

```text id="sjhpdc"
adapter implementation
source schema
conformance tests
```

It must not require new Project Graph semantics.

For example:

```text id="8b24rw"
Prometheus
Datadog
Sentry
CloudWatch
analytics provider
support platform
```

may all provide evidence for the same Observation semantics.

Operations should not become coupled to particular vendors.

---

# 12. Signal Collection Boundary

The Project Graph must remain high signal.

The following should not become Project Graph nodes:

```text id="kr9i5r"
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

Operations compresses detailed evidence into durable meaning.

Conceptually:

```text id="6h695p"
10,000 operational events
        ↓
analysis
        ↓
1 meaningful Observation
```

A collection run may legitimately produce no Observation.

No graph mutation is required when nothing materially useful was learned.

---

# 13. Operational Execution Provenance

Each collection or analysis run should retain enough execution provenance to reproduce or audit the result.

Conceptually:

```yaml id="py3x9f"
id: operations-execution-...
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
```

Execution provenance is not normal Project Graph state.

It records:

- source;
- evidence window;
- Project Graph revision;
- exposures inspected;
- external evidence references;
- resulting Observations;
- failures.

---

# 14. Observation

An Observation is a concise durable real-world fact worth retaining in the Project Graph.

Examples:

```text id="fvy9yf"
Checkout error rate materially increased after deployment X.

Users repeatedly abandon onboarding at step Y.

Support contacts increased after the account-flow release.

Publication X materially exceeded its established engagement baseline.

The new caching approach reduced latency without increasing errors.
```

Conceptually:

```yaml id="tfek70"
id: observation-...

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

---

# 15. Observation Rules

An Observation must:

- state a factual operational finding;
- identify the relevant exposure or project surface;
- identify the evidence window;
- reference supporting evidence;
- preserve uncertainty;
- avoid unsupported causal claims;
- remain compact enough for normal Project Graph use.

A baseline should be recorded when the finding depends on comparison.

`significance` expresses operational importance.

It does not determine:

- Project Intelligence triage class;
- Knowledge status;
- roadmap priority;
- automatic Delivery creation.

---

# 16. Positive and Negative Evidence

Operations is not only a defect system.

Observations may describe:

```text id="shda2z"
failure
regression
success
improvement
usage pattern
cost change
unexpected behaviour
validated assumption
```

Positive Observations can be as valuable as failures.

For example:

```text id="0s39va"
a performance optimisation worked
a user flow improved completion
a publication substantially outperformed baseline
a reliability constraint was achieved
```

They use the same Project Intelligence governance path.

---

# 17. Observation Identity and Deduplication

Repeated collection must not create unlimited duplicate Observations.

Possible outcomes:

```text id="rzd8l0"
new durable finding
→ create Observation
```

```text id="izxp7r"
same meaning + new evidence
→ retain existing Observation
```

```text id="nyy93l"
materially changed meaning
→ create new Observation
→ supersede earlier Observation where appropriate
```

External evidence remains available through provenance even when no new canonical Observation is created.

Operations deduplication does not replace Project Intelligence Source-level triage.

---

# 18. Active and Resolved Conditions

An Observation records what was true for its evidence window.

It should not be mutated when later production state changes.

Example:

```text id="m4d4jh"
Observation A:
error rate increased

        ↓ later evidence

Observation B:
error rate returned to baseline
```

Observation B may supersede Observation A as the current operational understanding.

Derived views may classify a condition as:

```text id="pktrqe"
active
improved
resolved
superseded
unknown
```

These may remain derived states rather than canonical fields.

---

# 19. Correlation and Causality

Operations may correlate evidence with:

- Deployments;
- Publications;
- Delivery lineages;
- prior Observations;
- accepted Project Intelligence Knowledge.

But:

```text id="9hwxqu"
after
≠ caused by
```

For example:

```text id="cwpyb7"
error rate increased after deployment X
```

may be supported while:

```text id="az9is3"
deployment X caused the increase
```

may not yet be justified.

Observations must preserve that distinction.

A stronger causal interpretation can later become Project Intelligence Knowledge if sufficient evidence supports it.

---

# 20. Project Intelligence Hand-Off

Every Observation intended to influence durable project understanding enters Project Intelligence through normal Source ingestion.

```text id="1wtbr3"
Observation
→ internal Source
→ triage
→ Knowledge / candidate where justified
```

The internal Source should retain provenance to:

- Observation;
- exposure;
- external evidence;
- Operations execution where useful.

Operations ends at operational truth.

It must not directly:

```text id="9azef7"
create Knowledge
modify Knowledge
create Delivery Intents
amend Contracts
amend Briefs
reprioritise project work
```

Project Intelligence determines durable project meaning and consequence.

---

# 21. Corrective Delivery

Operational evidence may motivate future Delivery.

The required path is:

```text id="ng08nq"
Observation
→ Project Intelligence Source
→ accepted Knowledge
→ Intent candidate
→ normal Intent capture
→ Contract lifecycle
```

Operations may provide useful evidence such as:

```text id="qh4a1z"
significance
frequency
recurrence
user impact
duration
affected exposure
regression against baseline
whether the condition remains active
```

Project Intelligence combines these signals with:

- legal and security requirements;
- dependencies;
- strategy;
- accepted Knowledge;
- current Intents;
- other project constraints.

Operations does not own global prioritisation.

---

# 22. Corrective Roadmap View

Operations may expose a derived view of Project Intelligence candidates motivated by operational evidence.

Conceptually:

```text id="9mgyob"
Project Intelligence intent candidates
        ↓
Operations-origin filter
        ↓
corrective intent view
```

This answers:

> What Delivery work is currently suggested by operational evidence?

It is not a second roadmap engine.

The Project Intelligence intent roadmap remains authoritative for project-wide readiness and ordering.

Editing an Operations report must not create an Intent or change its priority.

---

# 23. Assets / Publication Integration

When Assets / Publication is enabled:

```text id="lzl8hi"
Evidence
→ Asset
→ Publication
→ Observation
```

Operations may observe Publications without taking ownership of them.

Examples include:

- publication availability;
- reach;
- engagement;
- conversion;
- audience response;
- errors or delivery failures.

The boundary remains:

```text id="evj2nt"
Assets / Publication
→ what was published

Operations
→ what happened afterwards
```

An Observation never mutates the Publication or Asset it observes.

---

# 24. Graph Review Integration

Graph Review may inspect:

```text id="uwagzo"
Deployments
Observations
accepted operational Knowledge
```

when conducting wider project analysis.

It must not become an alternative operational evidence pipeline.

New operational facts should originate through Operations.

Graph Review may analyse their project-wide implications and produce Findings through its normal Project Intelligence path.

---

# 25. Delivery Context

Accepted operational Knowledge may later influence:

```text id="5f7cz5"
Contract crafting
Brief generation
Delivery
Review
```

through Project Intelligence.

Raw telemetry should not be loaded directly into Delivery context merely because Operations can access it.

The path is:

```text id="p61z9u"
raw operational evidence
→ Observation
→ Project Intelligence
→ accepted Knowledge
→ relevant future context
```

This preserves compression and semantic governance.

---

# 26. Operations Analysis Capability

Operations may require one distinct AI responsibility:

```text id="7c60xp"
operations-analysis
```

It covers work such as:

- interpreting bounded operational evidence;
- correlating signals with exposures;
- distinguishing noise from durable findings;
- compressing evidence into candidate Observations;
- preserving uncertainty.

The selected Agent Pack determines the implementing agent and skills.

Relevant Production Skills or Deep Research Skills may assist where appropriate.

Operations semantics remain owned by this Extension.

---

# 27. Commands

A compact initial command surface may include:

```text id="vgtezd"
pactwright operations deploy ...
pactwright operations collect <source>
pactwright operations observe ...
pactwright operations refresh
pactwright operations validate
```

Exact CLI ergonomics may evolve.

Commands should map to Operations semantics rather than exposing provider-specific monitoring commands through Pactwright.

---

# 28. Automation

Automation may:

- capture Deployments from trusted deployment events;
- run scheduled source collection;
- evaluate bounded evidence windows;
- create candidate Observations;
- regenerate derived views;
- trigger Project Intelligence ingestion.

Automation must not silently:

```text id="6nd9kr"
rewrite Evidence
change Contracts
create canonical Delivery Intents
accept Project Intelligence Knowledge
alter Asset or Publication semantics
```

unless authority for the specific owning system explicitly permits it.

---

# 29. Repository Model

Conceptually:

```text id="ghsv89"
docs/operations/
├── deployments/
├── observations/
└── reports/

.pactwright/operations/
├── sources/
└── environments/

.pactwright/executions/
└── operations/
```

Exact paths may evolve.

Canonical Operations state consists primarily of:

```text id="w2hn6w"
Deployment
Observation
typed relationships
```

External telemetry remains external.

Reports and execution provenance are derived or operational records, not normal Project Graph truth.

---

# 30. Idempotency and Failure

Operations should converge under repeated execution.

Source collection against the same evidence window should not generate duplicate canonical Observations where meaning is unchanged.

A failed:

- source query;
- analysis;
- report generation;
- Project Intelligence hand-off

must not corrupt canonical state.

Transient integrations may retry with bounded backoff.

Deterministic validation failures should stop immediately.

An existing Observation remains valid even if a later collection run fails.

---

# 31. Validation

Operations validation should ensure at least:

- every Deployment references valid Evidence;
- deployed artefact and environment identities are valid;
- every Observation references a valid exposure or project surface;
- Observation evidence references are present;
- evidence windows are valid;
- unsupported exposure types are rejected;
- source and environment definitions are structurally valid;
- canonical records do not contain credentials;
- Observation supersession is valid;
- Operations does not directly own Project Intelligence or Delivery mutations;
- Extension-contributed exposures remain owned by their source Extension;
- execution provenance is separate from Project Graph state.

Core `pactwright validate` may invoke Operations validation when enabled.

---

# 32. Evaluation

Operations evaluation should test the `operations-analysis` responsibility and deterministic semantics.

Useful cases include:

- mapping Delivery Evidence to correct Deployment;
- preserving repeated deployment history;
- ignoring high-volume operational noise;
- producing no Observation when nothing durable occurred;
- compressing many signals into one supported Observation;
- preserving evidence provenance;
- avoiding unsupported causal claims;
- distinguishing positive from negative outcomes;
- deduplicating repeated findings;
- handing Observations to Project Intelligence without creating Intents directly;
- preserving sibling Extension ownership.

Provider-specific adapter quality belongs to adapter conformance tests.

General domain-analysis expertise remains with relevant Production Skills.

---

# 33. Core Invariants

1. Operations is optional and does not redefine Delivery semantics.
2. Production exposure is distinct from Delivery Evidence.
3. Deployment is post-Delivery state, not a lifecycle stage.
4. Publication remains owned by Assets / Publication.
5. Raw telemetry is not Project Graph state.
6. Observations are compressed durable operational facts.
7. Every Observation is supported by addressable evidence.
8. Observations preserve uncertainty and avoid unsupported causality.
9. Positive and negative outcomes use the same Observation model.
10. Repeated evidence does not create unlimited duplicate Observations.
11. Historical Deployment and Observation records are not silently rewritten.
12. Operations findings enter Project Intelligence through Source ingestion.
13. An Observation is not automatically accepted project Knowledge.
14. Operations cannot directly create or prioritise canonical Delivery Intents.
15. Project Intelligence owns the single project-wide intent-roadmap model.
16. Operations-specific corrective views are filtered projections of that model.
17. Adding a source adapter does not require new graph semantics.
18. Adding a compatible exposure type does not require new Observation semantics.
19. External operational systems remain authoritative for detailed telemetry.
20. Disabling Operations does not change the meaning of Delivery, Asset, Publication or Project Intelligence records.

---

# 34. Anti-Overengineering Constraints

Do not introduce initially:

```text id="50t15z"
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

```text id="urnqy7"
Exposure
→ bounded external evidence
→ Observation
→ Project Intelligence
```

External specialised systems should remain responsible for high-volume operational data.

Pactwright stores only durable operational truth useful to future project reasoning.

---

# 35. Current Implementation Baseline

Operations is primarily a canonical target rather than a completed `0.0.1` subsystem.

The existing Operations research design already established the important architecture:

```text id="m9y7ki"
Evidence
→ production exposure
→ signals
→ Observation
→ Project Intelligence
→ future Delivery
```

It also established that:

- Deployment is post-Delivery state;
- raw telemetry stays outside the Project Graph;
- Observations compress operational evidence;
- Operations requires Project Intelligence;
- Operations cannot directly create Delivery Intents;
- corrective roadmap output is a filtered Project Intelligence view;
- source adapters and environment configuration remain Operations-owned;
- external evidence remains addressable from Observations.

The canonical redesign updates the old extension boundaries:

```text id="fbqy6j"
old Review & Creative Publication
→ Assets / Publication

Operations Observation
→ unchanged Operations ownership

durable operational meaning
→ Project Intelligence
```

The core Operations model therefore remains valid while becoming cleaner in the redesigned Pactwright architecture.

---

# 36. Relationship to Other Canonical Specifications

```text id="lj487o"
01 Core System and Lifecycle
→ owns Delivery through Evidence

02 Distribution, Agent Packs, Extensions and Evaluation
→ distributes Operations and resolves operations-analysis

03 Project Intelligence
→ owns durable meaning and future Delivery candidates

04 Graph Review
→ may analyse wider operational state

05 Assets and Publication
→ owns approved Assets and Publications

06 Operations
→ owns Deployment and Observation

07 GitHub Integration
→ may automate deployment and collection integration

08 Open-Source Project Organisation
→ governs repository and ecosystem structure
```

---

# 37. Governing Rule

> **Operations records what happened after delivered or published work reached the real world. It compresses bounded external evidence into durable Deployments and Observations, then routes operational meaning through Project Intelligence. It does not rewrite Delivery history, own project knowledge or create a second prioritisation system.**

---

**Pactwright Operations v1**