# Pactwright — Operations Graph Engineering Spec

## 1. Purpose

Operations Graph is an optional first-party Pactwright Project Graph extension.

It closes the feedback loop between delivered work and real-world outcomes.

It adds two capabilities:

1. Production traceability — identify which delivered software or published creative work reached a real operating surface.
2. Operational feedback — compress meaningful production signals into durable Observations, route them through Project Intelligence, and expose corrective intent candidates through the existing intent-roadmap model.

Core flow:

```text
Project Graph
    ↓
Delivery
    ↓
Evidence
    ↓
production exposure
    ↓
real-world signals
    ↓
Observation
    ↓
Project Intelligence Source
    ↓
triage / promotion
    ↓
Knowledge + intent candidates
    ↓
normal Delivery lifecycle
    ↓
production
    ↺
```

Operations Graph does not introduce:

- a second Delivery lifecycle;
- a second knowledge graph;
- a second intent-roadmap engine;
- an observability database;
- an incident-management platform;
- a telemetry store.

External operational systems remain the source of detailed runtime evidence.

The Project Graph stores only durable operational truth worth retaining.

---

## 2. Extension Boundary

The Pactwright Project Graph may contain:

```text
Pactwright Project Graph
├── Delivery Graph                         required
├── Project Intelligence                   optional
├── Graph Review & Creative Delivery       optional
└── Operations Graph                       optional
```

Operations Graph requires Project Intelligence.

Conceptually:

```text
operations
    ↓ requires
project-intelligence
    ↓
Delivery core
```

Graph Review & Creative Delivery and Operations remain independent sibling extensions.

When both are enabled, Review & Creative may expose "Publication" as an operational exposure consumed by Operations.

The Operations extension owns:

- Deployment semantics;
- Observation semantics;
- operational exposure integration;
- operational source adapters;
- signal collection and compression;
- operational execution provenance;
- Operations-specific derived reports.

It MAY:

- read the complete registered Project Graph;
- create Deployment records for delivered software;
- observe compatible production exposures contributed by other extensions;
- ingest signals from external operational systems;
- create Observations supported by operational evidence;
- create internal Sources through normal Project Intelligence ingestion;
- contribute context to Delivery where relevant;
- contribute agent capabilities, evaluation cases and GitHub requirements.

It MUST NOT:

- redefine Delivery stages or Evidence semantics;
- redefine Asset or Publication semantics;
- directly mutate Delivery-owned canonical nodes;
- directly mutate Project Intelligence Knowledge;
- directly create canonical Delivery Intents;
- own global intent prioritisation;
- store raw high-volume telemetry in the Project Graph;
- make external monitoring or analytics systems canonical Pactwright state;
- make GitHub state canonical.

Disabling Operations MUST NOT change the meaning of Delivery, Project Intelligence or Review & Creative records.

Operations-owned canonical records remain preserved unless explicitly removed.

---

## 3. Invariants

1. Production exposure is distinct from successful Delivery Evidence.
2. Deployment is post-Delivery extension state, not a Delivery lifecycle stage.
3. Raw logs, traces, metrics, analytics events and support messages are not Project Graph nodes.
4. Observations contain compressed operational facts supported by evidence.
5. Observations may represent failures, regressions, successes, usage patterns or other meaningful outcomes.
6. An Observation does not automatically become project knowledge.
7. Operational findings enter Project Intelligence through normal Source ingestion and triage.
8. Operations cannot directly create or prioritise canonical Delivery Intents.
9. The corrective intent roadmap is a filtered view of existing Project Intelligence intent candidates, not a second roadmap engine.
10. Operations consumes the deterministic Project Graph revision supplied by Pactwright runtime.
11. External evidence remains addressable from the Observation that depends on it.
12. Canonical operational records change through supersession rather than silent mutation.
13. Production integrations MUST NOT require Operations to understand every external event.
14. Adding an operational data source does not require changing Operations Graph semantics.
15. Adding a compatible production exposure type does not require changing Observation semantics.

---

## 4. Extension Manifest

**Example:**

```yaml
id: operations
package: "@pactwright/operations"
version: 1.0.0
pactwright: "^1.0.0"

dependencies:
  extensions:
    - project-intelligence

graph:
  node_types:
    - deployment
    - observation

  edge_types:
    - deployed-as
    - observes

runtime:
  namespace: operations

agent_capabilities:
  - operations-analysis

github:
  profile: operations
```

`supersedes` reuses the shared Project Graph relation.

Distribution, locking, installation and GitHub provisioning follow the Pactwright Distribution specification.

---

## 5. Repository Layout

When enabled:

```text
docs/operations/
  deployments/
  observations/
  reports/
    corrective-intent-roadmap.md

.pactwright/operations/
  sources/
  environments/

.pactwright/executions/
  operations/
```

The shared Project Graph edge store remains:

```text
specs/graph/edges.yml
```

**Rules:**

- `deployments/` contains canonical Deployment records;
- `observations/` contains canonical Observation records;
- `reports/` contains derived operational views;
- `sources/` contains operational source configuration;
- `environments/` contains repository-specific environment configuration;
- `.pactwright/executions/operations/` contains ingestion and analysis provenance, not graph nodes.

Credentials never live in canonical Operations records.

---

## 6. Production Exposure

An operational exposure identifies work that reached a surface where real-world outcomes can occur.

Operations supports two mechanisms:

```text
native exposure
    → Deployment
```

```text
extension-contributed exposure
    → compatible registered Project Graph node
```

Initially:

Software:

```text
Evidence → Deployment
```

Creative:

```text
Evidence → Asset → Publication
```

Operations owns Deployment.

Graph Review & Creative Delivery continues to own Publication.

Operations does not copy Publication state into an Operations node.

### Exposure registration

An enabled extension may declare canonical node types that can act as operational exposures.

Conceptually:

```yaml
operations:
  exposure_types:
    - publication
```

Operations resolves exposure types from enabled extension manifests.

It MUST NOT hard-code knowledge of every future extension.

An operational exposure type must provide enough durable identity for an Observation to reference the exact exposed work.

---

## 7. Deployment

A Deployment records that delivered software became active in an operating environment.

Delivery Evidence means:

> The work was delivered and verified.

Deployment means:

> This delivered work became active in this environment.

Deployment is therefore extension-owned post-Delivery state.

**Minimum structure:**

```yaml
id: deployment-checkout-api-a31f
type: deployment
title: Checkout API production deployment
created: ...

environment: production

delivery_evidence: evidence-checkout-api-91fe

artifact:
  revision: ...
  locator: ...
  hash: ...

deployed_at: ...
deployed_by: human:... | automation:...
```

The extension adds:

evidence --deployed-as--> deployment

**Rules:**

- a Deployment MUST reference valid Delivery Evidence;
- the deployed artifact must be identifiable;
- environment identity must be configured;
- repeated deployments create distinct Deployment records;
- rollback or redeployment creates another Deployment;
- Deployment does not mutate Delivery Evidence;
- deployment success does not itself prove production correctness.

Deployment records are immutable.

Corrections use `supersedes`.

---

## 8. Operational Sources

Operations may ingest evidence from external systems such as:

- monitoring platforms;
- logs and tracing systems;
- error trackers;
- analytics platforms;
- support systems;
- customer feedback;
- incident systems;
- application databases;
- deployment platforms;
- publication analytics;
- repository or issue systems.

These systems remain external evidence stores.

Pactwright does not mirror their complete contents.

Conceptually:

```text
external operational systems
        ↓
source adapter
        ↓
bounded evidence window
        ↓
analysis / compression
        ↓
Observation
```

A source definition lives under:

```text
.pactwright/operations/sources/
```

**Example:**

```yaml
id: checkout-errors
type: metrics

adapter: prometheus

target:
  ...

evidence:
  ...

schedule: hourly
```

Exact provider-specific configuration belongs to adapters.

Adding a source adapter requires:

1. adapter implementation;
2. source schema;
3. conformance tests.

It does not require new graph semantics.

---

## 9. Signal Collection Boundary

Operations must preserve the high-signal nature of the Project Graph.

The following remain outside canonical graph state:

- individual log entries;
- individual traces;
- metric samples;
- analytics events;
- page views;
- clicks;
- alert notifications;
- complete support conversations;
- raw monitoring payloads.

Operations ingests enough evidence to determine whether a durable Observation is justified.

Conceptually:

```text
10,000 runtime events
        ↓
analysis
        ↓
1 meaningful Observation
```

No Observation is required when collected signals contain no durable project-relevant information.

Routine collection runs may therefore complete without graph mutation.

---

## 10. Operational Execution

Each collection or analysis run creates operational execution provenance.

Execution provenance is not a Project Graph node.

Minimum record:

```yaml
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

created: ...
status: succeeded | failed
```

Execution records provide:

- source provenance;
- query/evidence window;
- Project Graph revision;
- relevant exposures;
- resulting Observations;
- failure information.

Operational execution history stays outside normal Project Graph traversal.

---

## 11. Observation

An Observation is a durable real-world fact worth retaining in the Project Graph.

**Examples:**

Checkout error rate materially increased after deployment X.

Subscription cancellation latency repeatedly exceeds the accepted threshold.

Users consistently abandon onboarding at the same step.

Support contacts increased after the latest account-flow release.

Publication X materially outperformed the established campaign baseline.

The new caching approach reduced production latency without increasing errors.

**Minimum structure:**

```yaml
id: observation-checkout-errors-a819
type: observation
title: Checkout errors increased after deployment
created: ...

exposure:
  id: deployment-checkout-api-a31f
  hash: ...

window:
  from: ...
  to: ...

finding: ...

direction: negative | positive | mixed | neutral
significance: advisory | material | critical
confidence: low | medium | high

evidence:
  - source: checkout-errors
    locator: ...
    summary: ...

baseline: null | ...
```

The extension adds:

observation --observes--> operational exposure

The target may initially be:

- Deployment;
- Publication when Review & Creative is enabled;
- another registered operational exposure type.

### Observation rules

An Observation MUST:

- state a factual operational finding;
- identify the exposure or project surface observed;
- define the relevant evidence window;
- reference supporting evidence;
- avoid unsupported causal claims;
- remain concise enough for normal Project Graph context.

An Observation SHOULD record a baseline when the finding depends on comparison.

"significance" represents operational importance.

It does not determine Project Intelligence promotion class or roadmap priority.

### Positive observations

Operations is not only a defect system.

Positive Observations may establish evidence that:

- a technical approach worked;
- a product behaviour improved;
- a creative message performed well;
- a user journey improved;
- an operational constraint was satisfied.

They follow the same Project Intelligence governance path as negative findings.

---

## 12. Observation Identity and Deduplication

Repeated evidence should not create unlimited duplicate Observations.

Before creating an Observation, Operations compares current findings with relevant existing Observations.

Possible outcomes:

```text
new durable finding
    → create Observation
```

```text
same finding, new evidence
    → no new canonical Observation unless meaning changed
```

```text
meaning materially changed
    → create new Observation and supersede prior record
```

External evidence remains available through execution provenance even when no new Observation is created.

Project Intelligence performs its own Source-level duplicate and corroboration handling after hand-off.

Operations deduplication does not replace Project Intelligence triage.

---

## 13. Project Intelligence Hand-off

A meaningful Observation enters Project Intelligence through normal Source ingestion.

Conceptually:

```text
Observation
    ↓
internal Source
    ↓
Project Intelligence triage
    ↓
duplicate / corroborating / novel / contradictory
    ↓
promotion where required
    ↓
Knowledge
```

The internal Source references:

- Observation id;
- Observation hash;
- evidence locators;
- originating exposure;
- Operations execution where useful.

Operations ends at the operational finding.

It MUST NOT directly:

- create or edit Knowledge Cards;
- alter Domain definitions;
- create canonical Delivery Intents;
- amend Contracts or Briefs;
- reprioritise Delivery work.

Project Intelligence remains authoritative for meaning and consequence.

---

## 14. Corrective Intent Candidates

Operational findings may motivate corrective Delivery work.

The flow remains:

```text
Observation
    ↓
Project Intelligence Source
    ↓
Knowledge / accepted operational meaning
    ↓
intent candidate derivation
    ↓
normal Delivery Intent decision
```

Project Intelligence owns intent candidate derivation.

Operations may contribute operational prioritisation evidence such as:

- significance;
- frequency;
- recurrence;
- user impact;
- affected production surface;
- affected Delivery lineage;
- duration;
- regression against baseline;
- whether the problem remains active.

Project Intelligence may combine these with:

- domain priority;
- strategic importance;
- existing Knowledge;
- existing Intents;
- Delivery state;
- other project context.

Operations MUST NOT create canonical Intents automatically.

---

## 15. Corrective Intent Roadmap

Operations exposes:

```text
docs/operations/reports/corrective-intent-roadmap.md
```

This is a derived Operations view over Project Intelligence intent candidates.

It is not a second roadmap engine.

Conceptually:

```text
Project Intelligence intent candidates
                ↓
        origin / evidence filter
                ↓
corrective-intent-roadmap.md
```

A roadmap entry may contain:

```yaml
candidate: ...
observation: ...
exposure: ...
significance: ...
user_impact: ...
status: ...
```

The report answers:

> What corrective work is currently suggested by production evidence?

The global Project Intelligence intent roadmap remains authoritative for project-wide candidate ordering.

Editing `corrective-intent-roadmap.md` MUST NOT create an Intent or change priority.

---

## 16. Active and Resolved Findings

An Observation records what was true for its evidence window.

It is not silently mutated when production changes.

If later evidence shows that a condition changed materially:

```text
original Observation
        ↓
new Observation
        ↓
supersedes
```

For example:

Observation A:

Checkout error rate increased after deployment.

Observation B:

Checkout error rate returned to baseline after corrective deployment.

Observation B --supersedes--> Observation A

Derived operational views may classify the current condition as:

- active;
- improved;
- resolved;
- superseded;
- unknown.

Those states are derived from current Observation relationships and evidence.

They are not required canonical fields.

---

## 17. Correlation and Causality

Operations may correlate findings with:

- Deployments;
- Publications;
- Delivery lineages;
- prior Observations;
- accepted Project Intelligence knowledge.

Temporal correlation is not automatically causation.

For example:

error rate increased after deployment X

may be recorded when supported.

The stronger claim:

deployment X caused the error increase

requires adequate evidence.

When causality remains uncertain, the Observation must preserve that uncertainty.

Project Intelligence may later promote a stronger causal interpretation when evidence justifies it.

---

## 18. Operations Context

Operations may contribute namespaced context to relevant Pactwright responsibilities.

For an active Delivery lineage, useful Operations context may include:

- Observations affecting prior versions of the same surface;
- unresolved production findings;
- relevant successful operational patterns;
- Deployments associated with the lineage;
- corrective intent evidence.

Operations context MUST remain bounded.

It MUST NOT preload:

- complete telemetry history;
- unrelated incidents;
- all historical Deployments;
- every Observation in the repository.

Accepted reusable meaning should normally flow through Project Intelligence rather than requiring repeated raw operational context.

---

## 19. Commands

Initial runtime commands:

```text
pactwright operations record-deployment <evidence-id>
pactwright operations ingest [<source-id>]
pactwright operations observe [<source-id>]
pactwright operations refresh
pactwright operations corrective-roadmap
pactwright operations validate
```

`record-deployment`

Creates a Deployment from valid Delivery Evidence and environment/artifact information.

`ingest`

Collects bounded evidence from configured operational sources.

It does not require creation of an Observation.

`observe`

Analyses collected evidence and creates or supersedes Observations when durable findings exist.

`refresh`

Runs configured collection and Observation processing for eligible sources.

`corrective-roadmap`

Regenerates the Operations-filtered corrective intent roadmap from current Project Intelligence candidates.

`validate`

Validates Operations-owned graph semantics, source configuration and cross-graph relationships.

The active AI adapter may expose equivalent interactive commands.

---

## 20. Agent Responsibilities

The initial extension requires:

```text
operations-analysis
```

This capability may:

- interpret bounded operational evidence;
- compare evidence with baselines;
- identify durable findings;
- correlate findings with known exposures;
- distinguish evidence from speculation;
- produce concise candidate Observations.

Deterministic responsibilities remain in Pactwright runtime:

- source collection;
- hashing;
- exposure resolution;
- schema validation;
- deduplication mechanics;
- edge creation;
- graph mutation;
- Project Intelligence hand-off;
- report generation.

A source adapter does not need an AI agent.

A new operational analysis technique should normally change the agent pack or skill rather than Operations Graph semantics.

---

## 21. Evaluation

The extension contributes evaluation cases for `operations-analysis`.

Evaluation should test:

- signal-to-Observation compression;
- correct exposure attribution;
- factual grounding;
- baseline interpretation;
- false-positive avoidance;
- unsupported causality avoidance;
- duplicate finding handling;
- positive finding recognition;
- correct Project Intelligence routing;
- scope discipline.

Prefer deterministic assertions where possible:

- required evidence references exist;
- raw telemetry is not persisted as graph nodes;
- Observation schema is valid;
- forbidden graph mutations do not occur;
- exposure relationships are valid.

Semantic evaluation may judge:

- whether the finding is meaningful;
- whether evidence supports the claim;
- whether significance is reasonable;
- whether the Observation is concise;
- whether uncertainty is represented correctly.

Do not use one aggregate score to decide quality.

---

## 22. Validation

`pactwright operations validate` MUST enforce:

1. every Deployment references valid Delivery Evidence;
2. every Deployment identifies its deployed artifact and environment;
3. every `deployed-as` edge has valid endpoints;
4. every Observation references a valid operational exposure;
5. every Observation defines an evidence window;
6. every Observation contains supporting evidence references;
7. every Observation uses valid direction, significance and confidence values;
8. every `observes` edge points to a registered operational exposure type;
9. supersession remains valid and acyclic;
10. canonical Operations records do not contain raw credential material;
11. operational execution records are not treated as Project Graph nodes;
12. Observation hand-off uses normal Project Intelligence Source ingestion;
13. the corrective intent roadmap identifies the Project Graph revision from which it was generated;
14. the corrective intent roadmap contains derived candidates rather than canonical Intents.

Core `pactwright validate` may invoke Operations validation when the extension is enabled.

---

## 23. Failure and Idempotency

### Deployment

- invalid Evidence prevents Deployment creation;
- deployment recording failure does not mutate Evidence;
- repeated recording of the same deployment must not create uncontrolled duplicates.

### Collection

- source authentication or availability failure records execution failure;
- failed collection does not mutate canonical graph state;
- retries are bounded by adapter policy;
- one unavailable source does not make existing Operations truth invalid.

### Observation

- failed analysis creates no canonical Observation;
- insufficient evidence creates no Observation;
- duplicate findings do not create uncontrolled graph growth;
- supersession is explicit;
- failed Project Intelligence hand-off leaves the Observation valid and retryable.

### Reports

- corrective-roadmap generation failure does not mutate canonical graph state;
- regenerated reports use the current deterministic Project Graph revision unless explicitly pinned.

---

## 24. GitHub Automation Boundary

Operations may contribute GitHub requirements for:

- Deployment recording;
- scheduled source refresh;
- Operations validation;
- Observation summaries;
- corrective-roadmap regeneration;
- Operations Project views.

Workflow YAML remains thin and invokes Pactwright runtime commands.

Exact workflows, checks, fields, triggers and views belong to the Pactwright GitHub Actions and Views specification.

Potential GitHub views include:

### Operations

Production Findings

Deployments

Corrective Roadmap

These remain projections.

GitHub metadata does not own Deployment, Observation or corrective-intent state.

---

## 25. Review & Creative Integration

Operations does not depend on Graph Review & Creative Delivery.

When both extensions are enabled, Review & Creative may register:

publication

as an operational exposure type.

Operations may then create Observations about:

- reach;
- engagement;
- conversion;
- user response;
- publication errors;
- channel performance;
- other meaningful publication outcomes.

Operations MUST NOT:

- redefine Asset approval;
- redefine Publication state;
- mutate Publications;
- create a second publication record.

A Publication remains owned by Review & Creative.

Operations only observes its real-world outcome.

---

## 26. Initial Build Order

## 1. Deployment

**Build:**

- Deployment schema;
- environment configuration;
- `record-deployment`;
- `deployed-as` edge;
- validation.

**Prove:**

```text
Evidence → Deployment
```

for one software delivery.

## 2. Operational sources

**Build:**

- source adapter contract;
- source configuration;
- execution provenance;
- bounded evidence collection;
- one initial operational adapter.

Do not persist raw telemetry into the graph.

## 3. Observation

**Build:**

- Observation schema;
- `observes` edge;
- operations-analysis capability;
- evidence grounding;
- deduplication;
- supersession.

Prove one negative and one positive Observation.

## 4. Project Intelligence hand-off

**Build:**

- Observation → internal Source;
- normal Project Intelligence triage;
- cross-graph traceability.

**Prove:**

```text
Observation
→ Source
→ Knowledge or intent candidate
```

without Operations mutating Knowledge or Delivery truth.

## 5. Corrective roadmap

**Build:**

- Operations-origin filtering;
- `corrective-intent-roadmap.md`;
- Project Graph revision provenance.

The report must reuse Project Intelligence intent candidates.

## 6. Extension-aware exposure

Add registered operational exposure support.

Prove "Publication" observation when Review & Creative is enabled.

## 7. Automation

**Add:**

- scheduled refresh;
- validation;
- GitHub requirements;
- evaluation cases.

---

## 27. Definition of Done

Operations Graph is working when:

- it installs as an optional extension without changing Delivery semantics;
- Project Intelligence is resolved as its required extension dependency;
- Deployment records which delivered software became active in an environment;
- Deployment remains post-Delivery extension state rather than a lifecycle stage;
- raw telemetry remains outside the Project Graph;
- configured sources can collect bounded operational evidence;
- collection runs remain execution provenance rather than graph nodes;
- meaningful production evidence can produce concise Observations;
- Observations may represent both negative and positive outcomes;
- every Observation traces to evidence and an operational exposure;
- unsupported causal claims are not promoted as facts;
- repeated evidence does not create uncontrolled duplicate Observations;
- changed operational truth uses explicit supersession;
- Observations enter Project Intelligence through normal Source ingestion;
- Operations cannot directly mutate Knowledge Cards or Delivery Intents;
- Project Intelligence remains authoritative for intent candidate derivation and global roadmap ordering;
- `corrective-intent-roadmap.md` is a filtered derived view rather than a second roadmap engine;
- Operations can contribute relevant bounded context to future Delivery;
- extensions may register compatible production exposure types;
- Review & Creative Publications can be observed without creating a dependency between the two extensions;
- one deterministic Project Graph revision is used across Operations, Project Intelligence and GitHub projections;
- GitHub remains an automation and projection surface rather than canonical Operations state;
- disabling Operations leaves Delivery, Project Intelligence and Review & Creative semantics valid.

---

## 28. Future Improvements

Add only when observed usage demonstrates the need.

### Incident semantics

Add a first-class Incident node only when external incident records and Observations cannot represent required durable project truth.

### Operational objectives

Add first-class SLO or operational-target semantics only when accepted project constraints cannot represent them cleanly.

### Automated anomaly detection

Add Pactwright-owned anomaly detection only when external monitoring systems and bounded analysis are insufficient.

### Richer correlation

Add automated multi-exposure or multi-deployment correlation only after simpler attribution produces concrete limitations.

### Experiment outcomes

Add dedicated experiment semantics only when normal Deployments, Publications and Observations cannot represent controlled experiments adequately.

### Support workflow

Add ticket grouping, ownership or response workflow only when Operations needs to become responsible for support operations rather than merely consuming support evidence.

### Period-wide operational summaries

Add durable reporting periods only when individual Observations and derived views are insufficient.

### Operational retention

Add automatic execution-record retention only when provenance volume becomes a demonstrated storage problem.

### Cross-repository Operations

Add organisation-wide operational correlation only when multiple Pactwright repositories need shared production reasoning.

---

## 29. Governing Rule

For Operations Graph changes ask:

> Does this represent durable real-world truth about delivered work that future project decisions need?

For telemetry changes ask:

> Can the detailed evidence remain in the external operational system and be referenced instead?

For knowledge changes ask:

> Should this operational fact first pass through Project Intelligence before becoming accepted project meaning?

For roadmap changes ask:

> Can this remain an Operations-filtered view of the existing Project Intelligence intent roadmap rather than creating another prioritisation system?

Keep Delivery responsible for what was delivered, Operations responsible for what happened in production, Project Intelligence responsible for what that means, and the normal Delivery lifecycle responsible for what happens next.

---

---

Pactwright — Operations Graph Engineering Spec v1
