# Pactwright Graph Review

## 1. Purpose

Graph Review is an optional Pactwright Extension for specialist analysis of Project Graph state.

Its core flow is:

```text
Project Graph
→ Graph Review
→ Finding
→ Project Intelligence Source
→ triage
→ Knowledge or Delivery candidate
```

Graph Review answers:

> What does specialist analysis of project state reveal?

It may review architecture, product coherence, UX, research quality, production patterns, cost, graph integrity, progression and cross-domain consistency.

Graph Review does not directly change Project Graph truth.

It produces supported Findings. Project Intelligence determines what durable project meaning, if any, follows from them.

---

## 2. Scope and Ownership

Graph Review owns:

- the `graph-review` capability;
- review request and scope resolution;
- specialist Project Graph analysis;
- immutable Review Execution provenance;
- Findings;
- hand-off of every Finding from a successful review to Project Intelligence.

It does not own:

```text
Delivery Review
Review Definitions
provider/model routing
task catalogues
generation guidance
Assets
Publications
Operations Observations
Project Intelligence Knowledge
Delivery Graph mutation
```

Those concerns remain with their respective owners.

Graph Review requires Project Intelligence because Findings use Project Intelligence as their durable governance path.

---

# 3. Graph Review vs Delivery Review

Delivery Review and Graph Review are different Pactwright responsibilities.

```text
Delivery Review
→ verifies current Contract fulfilment
→ contributes to Evidence
```

```text
Graph Review
→ analyses wider Project Graph state
→ emits Findings
→ feeds Project Intelligence
```

Graph Review may span multiple Contracts, completed and active Delivery, Project Intelligence, sibling Extension state and cross-graph relationships.

It does not close Delivery and does not produce Evidence.

---

# 4. One Graph Review Capability

The semantic capability is:

```text
graph-review
```

Do not create separate Pactwright capabilities for architecture review, UX review, generation review, product review or cost review when the same responsibility plus different context and Production Skills is sufficient.

Conceptually:

```text
review request
→ graph-review
→ selected Agent Pack
→ reviewer
→ relevant Production Skills
```

Several Production Skills may participate in one review.

Specialist agents should be introduced only when evaluation shows the generic capability plus appropriate skills is insufficient.

---

# 5. No Review Definition System

Graph Review does not require a persistent Review Definition abstraction.

A review is normally expressed through:

```text
review request
+ Project Graph context
+ Agent Pack
+ Production Skills
```

A review request may identify:

- perspective or question;
- objective;
- scope;
- relevant domains;
- target records;
- constraints;
- required output.

The request is execution input, not automatically Project Graph truth.

Reusable specialist behaviour belongs in Agent Packs or Production Skills.

Project-specific review guidance belongs in Project Intelligence.

A separate persistent review-definition mechanism should be introduced only if demonstrated requirements cannot be represented through these existing owners.

---

# 6. Review Scope

Graph Review resolves scope from the registered Project Graph rather than a hard-coded Extension list.

Conceptually:

```text
registered Project Graph
        ↓
available node + edge types
        ↓
review request
        ↓
resolved review scope
```

Scope may include:

- the whole Project Graph;
- selected subgraphs;
- selected domains;
- node types;
- relationships;
- active Delivery lineages;
- specific records;
- relevant derived views;
- explicitly required execution provenance.

A future compatible Extension can therefore participate in graph-wide review without changing the Graph Review engine.

Reading another Extension's state does not transfer ownership.

---

# 7. Project Graph Revision

Every Graph Review runs against a deterministic Project Graph revision supplied by Pactwright Core.

```text
canonical Project Graph state
        ↓
Project Graph revision
        ↓
Graph Review
```

The Review Execution records the revision inspected.

Graph Review does not define its own revision scheme.

The revision provides a stable identity for the reviewed graph state, but **a revision hash alone does not define how historical graph bytes are recovered**. Pinned reruns therefore require a reconstructible historical Project Graph input. The storage/locator mechanism for reconstructing an old revision remains a cross-cutting Pactwright design requirement and must not be silently approximated with current state.

---

# 8. Review Execution

Every attempted Graph Review creates an immutable Review Execution record.

Conceptually:

```yaml
id: graph-review-...
graph_revision: ...

request:
  perspective: ...
  scope: ...
  objective: ...

resolved_scope:
  nodes: []
  edges: []

resolved_environment:
  agent_pack: ...
  agent: ...
  skills: []

findings: []
status: succeeded | failed
created: ...
```

The exact representation may evolve, but the execution must preserve enough immutable identity to explain and reconstruct:

```text
Project Graph revision
+ review request
+ resolved scope
+ resolved Agent Pack
+ relevant Production Skills environment
```

A Review Execution is execution provenance, not a normal Project Graph node.

Failed reviews still record their execution provenance.

A failed review emits **no Findings** for Project Intelligence ingestion.

Partial or failed model output remains execution evidence only and must not be promoted as a successful Finding.

Model output is not required to be byte-identical on rerun.

---

# 9. Historical Environment Reconstruction

The pinned-rerun contract requires the original resolved execution environment to remain identifiable after later upgrades.

Review Execution provenance must therefore preserve immutable identities for the Agent Pack and relevant Production Skills used by the run.

Graph Review must never silently substitute a newer Agent Pack, skill revision or Production Extension Pack during a pinned rerun.

If the original environment cannot be resolved, the pinned rerun must fail clearly rather than becoming an implicit current-environment review.

How Pactwright retains or reacquires historical package/skill revisions is owned by the Distribution and locking design and remains an unresolved cross-spec implementation detail.

---

# 10. Findings

A Finding is a supported result emitted by a **successful** Graph Review.

Conceptually:

```yaml
id: finding-...
claim: ...
supporting_records: []
suggested_improvement: ...
severity: advisory | material | critical
review_execution: ...
```

A Finding identifies:

- what was found;
- which reviewed Project Graph state supports it;
- why it matters;
- a useful next action where appropriate;
- its originating Review Execution.

Findings are immutable Review Execution outputs, not normal Project Graph nodes and not automatically accepted project truth.

They may be stored with or referenced from their Review Execution. Exact physical storage is an implementation detail provided identity, provenance and immutability are preserved.

---

# 11. Finding Governance

**Every Finding emitted by a successful Graph Review enters Project Intelligence as an internal Source.**

Graph Review does not pre-filter Findings according to whether it believes they deserve durable project use.

```text
Finding
→ Project Intelligence Source
→ triage
→ irrelevant / duplicate / corroborating / incremental / novel / contradictory
→ Knowledge or Delivery candidate where justified
```

Project Intelligence owns the decision that a Finding is irrelevant, duplicate, merely corroborating or worth durable promotion.

Graph Review ends at the Finding and must not directly create or modify:

```text
Knowledge
Intent
Decision
Contract
Brief
Evidence
Asset
Publication
Deployment
Observation
roadmap priority
```

The relevant semantic owner controls all subsequent canonical mutation.

If Finding hand-off fails, the successful Review Execution and Finding remain valid and the hand-off must be retryable without rerunning the review.

---

# 12. Severity

Finding severity is advisory metadata:

```text
advisory
material
critical
```

Severity expresses the reviewer's assessment of potential importance.

It does not determine:

- Project Intelligence trust;
- triage class;
- Knowledge status;
- roadmap priority;
- automatic Delivery creation.

```text
critical Finding
≠ automatically class 3 Intelligence change
```

Project Intelligence evaluates consequences against current project state.

---

# 13. Research and External Evidence

A Graph Review may require evidence not represented in the current Project Graph.

Relevant research skills may gather that evidence, but Graph Review must distinguish:

```text
claims supported by the pinned Project Graph
```

from:

```text
claims suggested by newly gathered external evidence
```

External evidence that should become durable project knowledge follows normal Project Intelligence Source ingestion.

A review must not silently turn external assumptions into accepted project truth.

Where external research materially supports a Finding, the Review Execution must retain sufficient provenance to identify that research input.

A fully reproducible pinned rerun involving mutable external sources requires the relevant evidence or immutable provenance to remain reconstructible. The exact external-evidence retention mechanism is not yet defined and must not be assumed.

---

# 14. Production, Operations and Assets Boundaries

Graph Review may analyse production-related Project Graph state when the question spans wider project state or repeated patterns.

It must not become the normal evaluator for an individual Delivery output.

```text
individual output
→ delivery-review
→ relevant Production Skills evaluation
```

Graph Review may inspect Assets, Publications, Deployments and Observations where relevant but does not own or mutate them.

Operational reality remains:

```text
real-world exposure
→ Operations Observation
→ Project Intelligence
```

Asset and Publication state remains owned by Assets / Publication.

Graph Review may analyse those records and emit Findings, but cannot replace either subsystem's semantics.

---

# 15. Project Progression Review

Graph Review may inspect:

- Project Intelligence coverage;
- stale or challenged Knowledge;
- the Intent roadmap;
- open Delivery;
- blocked lifecycle state;
- previous Findings;
- completed work;
- relevant operational evidence.

It may answer:

> Given current project state, what deserves attention?

The answers are Findings.

Graph Review does not create a separate roadmap or prioritisation engine.

Project Intelligence remains authoritative for Delivery candidates and readiness.

---

# 16. Commands and Rerun Semantics

Graph Review exposes a small command surface:

```text
pactwright graph-review run
pactwright graph-review rerun <execution-id>
pactwright graph-review rerun <execution-id> --current
pactwright graph-review validate
```

Exact argument ergonomics may evolve, but the semantic distinction is fixed.

## New run

`graph-review run` resolves the current Project Graph revision and current compatible locked execution environment.

## Pinned rerun

```text
pactwright graph-review rerun <execution-id>
```

uses the original Review Execution's:

- Project Graph revision;
- review request;
- resolved scope/configuration;
- resolved Agent Pack and Production Skills identities.

Pinned rerun is the default.

## Current-state rerun

```text
pactwright graph-review rerun <execution-id> --current
```

reuses the original review request but deliberately resolves the latest Project Graph state and current compatible execution environment.

A current-state rerun is a new Review Execution and must record its own revision and resolved environment.

The runtime must never silently convert a failed pinned rerun into a current-state rerun.

---

# 17. Automation

Graph Review may run manually, on a schedule or in response to a relevant repository event.

Triggering does not change Graph Review semantics.

Automation remains thin. It may invoke Graph Review but must not duplicate:

- scope resolution;
- Review Execution provenance;
- Finding semantics;
- Project Intelligence hand-off;
- validation.

Exact GitHub triggers and workflows belong to the GitHub Integration specification.

---

# 18. Repository and Derived Reports

Graph Review keeps execution provenance and derived reporting separate from canonical Project Graph state.

Conceptually:

```text
.pactwright/executions/
└── graph-reviews/

docs/graph-review/
└── reports/
```

Exact paths may evolve.

Review Executions are immutable provenance.

Reports are deterministic derived views, not hand-maintained sources of truth.

Every generated report must identify the Project Graph revision from which it was derived and any Review Execution(s) it summarises.

Report generation failure must not mutate canonical Project Graph state, Review Execution state or Project Intelligence state.

Regeneration against current state uses the current deterministic Project Graph revision unless the operation explicitly requests a pinned historical input.

---

# 19. Failure and Idempotency

Failure rules are:

- deterministic request, scope or configuration errors fail immediately;
- every attempted review records immutable execution provenance;
- a failed review emits no Findings;
- a successful review remains successful even if Finding hand-off later fails;
- failed Project Intelligence hand-off is retryable from the existing Finding;
- pinned rerun uses the original revision and resolved environment by default;
- current-state rerun requires explicit `--current`;
- duplicate Findings are handled by Project Intelligence triage rather than Graph Review suppression;
- report-generation failure never mutates canonical state.

A rerun always creates a new Review Execution rather than mutating the original.

---

# 20. Validation

`pactwright graph-review validate` must ensure at least:

1. every Review Execution is immutable once recorded;
2. every attempted review records a valid execution status;
3. every successful review identifies a valid Project Graph revision;
4. review scope references valid registered graph state for the recorded revision;
5. the resolved Agent Pack supplied `graph-review`;
6. referenced Production Skills belong to the recorded resolved environment;
7. Findings exist only for successful Review Executions;
8. every Finding references its Review Execution;
9. supporting Project Graph records are valid against the reviewed revision;
10. every Finding from a successful review has a Project Intelligence Source hand-off or a recorded retryable hand-off failure;
11. Graph Review does not directly mutate sibling-owned canonical records;
12. pinned reruns identify the original Project Graph revision and resolved environment;
13. current-state reruns are explicitly marked and record the new revision/environment;
14. generated reports identify their source Project Graph revision and relevant Review Execution provenance.

Core `pactwright validate` may invoke Graph Review validation when the Extension is enabled.

---

# 21. Evaluation

Graph Review evaluation belongs at the Pactwright responsibility boundary.

It should assess whether `graph-review` can:

- identify supported issues;
- avoid unsupported claims;
- find meaningful cross-record inconsistencies;
- use appropriate Project Intelligence context;
- distinguish local Delivery defects from project-wide concerns;
- provide useful evidence and provenance;
- avoid direct canonical mutation;
- use appropriate Production Skills for the requested perspective.

Domain expertise remains benchmarked by the relevant Production Skills repositories.

```text
Production Skill evaluation
→ Is the specialist review technique good?

Pactwright Graph Review evaluation
→ Can the resolved environment use that technique correctly within Graph Review semantics?
```

---

# 22. Core Invariants

1. Graph Review is optional and does not redefine core Delivery semantics.
2. Graph Review and Delivery Review are distinct responsibilities.
3. There is one `graph-review` semantic capability.
4. Specialist perspectives do not require new Pactwright capabilities.
5. Review behaviour is supplied through Agent Packs and Production Skills.
6. Graph Review does not require a persistent Review Definition system.
7. Every review records the Project Graph revision it inspects.
8. Review scope is resolved from the registered Project Graph.
9. Every attempted review creates an immutable Review Execution.
10. Failed reviews emit no Findings.
11. Findings are immutable execution outputs, not normal Project Graph nodes or accepted truth.
12. Every Finding emitted by a successful review enters Project Intelligence through Source ingestion.
13. Finding severity does not determine Intelligence consequence class or roadmap priority.
14. Graph Review does not directly mutate records owned by Delivery, Project Intelligence, Assets / Publication or Operations.
15. Pinned rerun uses the original graph revision and resolved environment by default.
16. Current-state rerun requires explicit request.
17. Generated reports identify their source Project Graph revision.
18. Report failure does not mutate canonical state.
19. Multiple Production Skills may participate in one Graph Review.
20. Graph Review does not create a parallel roadmap, knowledge graph or production-analysis pipeline.

---

# 23. Anti-Overengineering Constraints and Open Gaps

Do not introduce initially:

```text
Review Definition registry
standard reviewer catalogue
one agent per review type
one capability per review perspective
provider registry
task catalogue
secondary-model orchestration framework
review-specific knowledge store
review-specific roadmap
generation-review subsystem
creative-delivery machinery
Asset / Publication semantics
```

Use:

```text
review request
+ Project Graph scope
+ graph-review capability
+ Agent Pack
+ Production Skills
+ Review Execution
+ Finding
+ Project Intelligence
```

until real use demonstrates another abstraction is necessary.

The following design gaps remain explicit rather than being invented here:

- how a historical Project Graph revision is reconstructed for a pinned rerun;
- how historical Agent Pack and Production Skills revisions are retained or reacquired after upgrades;
- how mutable external research inputs are reconstructed for fully reproducible reruns;
- the physical storage layout for Findings separate from or embedded in Review Execution records.

These gaps affect implementation detail and reproducibility, not the semantic rule that a pinned rerun must never silently substitute current graph or execution state.

---

# 24. Current Implementation Baseline

The earlier Graph Review & Creative Delivery research established the surviving Graph Review contracts:

- review scope resolves from the registered Project Graph;
- reviews pin deterministic Project Graph revisions;
- Review Executions are immutable provenance;
- reruns use original pinned revision/configuration by default;
- current-state reruns require explicit request;
- successful reviews emit Findings;
- every successful Finding enters Project Intelligence;
- failed reviews still record execution provenance but emit no Findings;
- Finding severity is advisory;
- derived reports identify their source Project Graph revision;
- report-generation failure never mutates canonical graph state.

The redesign removes the unrelated machinery previously bundled with Graph Review:

```text
Creative Delivery
Assets
Publications
Review Definitions
provider/task configuration
generation guidance
creative-delivery
creative-verification
generation-review
```

Creative production now uses normal Delivery plus Production Skills.

Assets / Publication has its own Extension.

Project-specific durable guidance belongs in Project Intelligence.

---

# 25. Relationship to Other Canonical Specifications

```text
01 Core System and Lifecycle
→ Delivery Review and Project Graph foundation

02 Distribution, Agent Packs, Extensions and Evaluation
→ graph-review capability implementation, locking and historical environment resolution

03 Project Intelligence
→ durable governance of every successful Finding

04 Graph Review
→ specialist analysis, Review Execution and Findings

05 Assets and Publication
→ approved durable outputs

06 Operations
→ real-world Observations

07 GitHub Integration
→ automation and projection

08 Open-Source Project Organisation
→ repository and ecosystem structure
```

---

# 26. Governing Rule

> **Graph Review performs specialist analysis over an explicitly identified Project Graph revision and produces supported Findings through immutable Review Executions. Agent Packs and Production Skills determine how analysis is performed. Every Finding from a successful review enters Project Intelligence through normal Source ingestion; all downstream canonical changes remain governed by their owning Pactwright semantics.**

---

**Pactwright Graph Review v1**