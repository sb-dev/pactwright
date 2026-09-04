# Pactwright Graph Review

## 1. Purpose

Graph Review is an optional Pactwright Extension for specialist analysis of the current Project Graph.

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

> What does specialist analysis of the current Project Graph reveal?

It may review concerns such as:

- architecture;
- product coherence;
- UX;
- research quality;
- production quality;
- cost;
- graph integrity;
- progression;
- cross-domain consistency.

Graph Review does not directly change Project Graph truth.

It proposes Findings.

Project Intelligence determines what durable meaning, if any, the project should retain from them.

---

## 2. Scope and Ownership

Graph Review owns:

- the `graph-review` capability;
- review scope resolution;
- specialist Project Graph analysis;
- review execution provenance;
- Findings;
- hand-off of Findings to Project Intelligence.

It does not own:

```text
Delivery Review
Production Skills
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

These concerns remain with their respective owners.

---

# 3. Extension Boundary

Graph Review is a sibling of the other optional Pactwright Extensions:

```text
Pactwright Project Graph
├── Delivery Graph                 core
├── Project Intelligence           optional
├── Graph Review                   optional
├── Assets / Publication           optional
└── Operations                     optional
```

Graph Review requires Project Intelligence because Findings use Project Intelligence as their durable governance path.

```text
Graph Review
      ↓ requires
Project Intelligence
      ↓
Pactwright Core
```

Graph Review may read compatible canonical state from any enabled Project Graph extension.

Reading another extension's state does not transfer ownership.

---

# 4. Graph Review vs Delivery Review

Delivery Review and Graph Review serve different purposes.

## Delivery Review

```text
Contract
→ Brief
→ Delivery
→ Review
→ Evidence
```

Delivery Review asks:

> Does the current delivered work satisfy its governing Contract and Brief?

It is part of the core Delivery lifecycle.

## Graph Review

```text
Project Graph
→ specialist analysis
→ Finding
```

Graph Review asks:

> What issues, inconsistencies, opportunities or risks are visible across current project state?

It may span:

- multiple Contracts;
- Project Intelligence;
- completed Delivery;
- current Delivery;
- extension-owned state;
- cross-graph relationships.

Graph Review does not close Delivery and does not produce Evidence.

---

# 5. One Graph Review Capability

The semantic capability is:

```text
graph-review
```

Do not introduce separate Pactwright capabilities such as:

```text
architecture-review
ux-review
generation-review
product-review
cost-review
```

Those are specialist applications of the same responsibility.

For example:

```text
architecture review
→ graph-review
→ reviewer
→ Software Engineering / Deep Research skills
```

```text
UX review
→ graph-review
→ reviewer
→ UI/UX evaluation skills
```

```text
generation review
→ graph-review
→ reviewer
→ relevant production evaluation skills
```

```text
research review
→ graph-review
→ reviewer
→ Deep Research evaluation skills
```

The Agent Pack determines which agent and Production Skills implement the review.

---

# 6. No Review Definition System

Graph Review does not require a separate persistent Review Definition abstraction.

A review should normally be expressible through:

```text
review request
+ current Project Graph context
+ Agent Pack
+ Production Skills
```

A review request may identify:

- perspective or question;
- scope;
- relevant domains;
- target records;
- constraints;
- required output.

This request is execution input, not automatically Project Graph truth.

Reusable specialist behaviour belongs in:

```text
Agent Pack
or
Production Skills
```

Project-specific review guidance belongs in:

```text
Project Intelligence
```

A persistent Graph Review-specific definition mechanism should be introduced only if demonstrated requirements cannot be expressed through those existing owners.

---

# 7. Review Scope

Graph Review resolves scope from the registered Project Graph rather than from a hard-coded list of extensions.

Conceptually:

```text
registered Project Graph
        ↓
available node + edge types
        ↓
review request
        ↓
resolved review context
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

---

# 8. Project Graph Revision

Every Graph Review executes against a deterministic Project Graph revision supplied by Pactwright Core.

Conceptually:

```text
canonical Project Graph state
        ↓
Project Graph revision
        ↓
Graph Review
```

The review records the revision it inspected.

This provides:

- reproducibility;
- provenance;
- comparison between reviews;
- protection against ambiguous moving-state analysis.

Graph Review does not define its own revision mechanism.

---

# 9. Review Execution

A Graph Review execution records enough provenance to explain and reproduce the analysis.

Conceptually:

```yaml
id: graph-review-...
graph_revision: ...

request:
  perspective: ...
  scope: ...
  objective: ...

resolved_context: ...

agent_pack: ...
agent: ...
skills: []

findings: []

status: succeeded | failed
created: ...
```

The exact representation may evolve.

A Review Execution is execution provenance, not a normal Project Graph node.

Model output is not expected to be byte-identical when rerun.

Reproduction means that the same:

```text
Project Graph revision
+ review request
+ resolved Agent Pack
+ Production Skills environment
```

can be reconstructed.

---

# 10. Findings

A Finding is a supported result of Graph Review.

Conceptually:

```yaml
id: finding-...
claim: ...
supporting_records: []
suggested_improvement: ...
severity: advisory | material | critical
review_execution: ...
```

A Finding should identify:

- what was found;
- which Project Graph state supports it;
- why it matters;
- a useful next action where appropriate;
- originating Review Execution.

A Finding is not automatically accepted project truth.

---

# 11. Finding Governance

Every successful Finding intended for durable project use enters Project Intelligence as an internal Source.

```text
Finding
→ Project Intelligence Source
→ triage
→ irrelevant / duplicate / corroborating / novel / contradictory
→ Knowledge or Delivery candidate where justified
```

Graph Review ends at the Finding.

It must not directly create or modify:

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

Project Intelligence owns durable interpretation.

The relevant graph owner controls any subsequent canonical mutation.

---

# 12. Severity

Finding severity is advisory metadata.

Useful levels are:

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

For example:

```text
critical Finding
≠ automatically class 3 Intelligence change
```

Project Intelligence evaluates actual consequences against current project state.

---

# 13. Agent Pack and Production Skills Integration

Graph Review uses the normal Pactwright AI composition model.

```text
graph-review
      ↓
Agent Pack
      ↓
reviewer
      ↓
one or more Production Skills
```

Examples:

```text
architecture review
→ software-review
→ deep-research where evidence is required
```

```text
product/UX review
→ uiux-evaluate
→ research skills where required
```

```text
children's TV review
→ narrative-evaluate
→ music-evaluate
→ video-evaluate
```

Several Production Skills may participate in one review.

Pactwright does not need a bespoke reviewer agent for every domain.

Specialised agents should be added only when evaluation demonstrates that the generic reviewer plus appropriate skills is insufficient.

---

# 14. Research During Review

A review may require evidence that is not currently represented in the Project Graph.

Deep Research Skills may be used to investigate that evidence.

However:

```text
external evidence
→ research output
→ Project Intelligence Source
```

must occur before the resulting claim is treated as accepted project truth.

Graph Review should distinguish:

```text
what current Project Graph state supports
```

from:

```text
what newly gathered external evidence suggests
```

Review must not silently smuggle external assumptions into canonical project knowledge.

---

# 15. Production Review Boundary

Graph Review may analyse production-related project state when the question spans the wider Project Graph.

Examples include:

- whether recurring video-generation failures reveal a systematic project issue;
- whether production cost is inconsistent with project constraints;
- whether multiple outputs violate accepted visual identity;
- whether research practices are producing unreliable Knowledge.

It must not become the normal mechanism for evaluating an individual Delivery output.

Individual output verification remains:

```text
Delivery
→ delivery-review
→ relevant Production Skills evaluation
```

Graph Review is appropriate when the question concerns broader project state or patterns across work.

---

# 16. Operations Boundary

Graph Review may inspect canonical Operations state when relevant.

For example:

```text
Deployment
Observation
accepted operational Knowledge
```

may provide useful context for an architecture or progression review.

Graph Review must not become a parallel production-monitoring system.

Operational reality is recorded by Operations:

```text
real-world exposure
→ Observation
```

and enters durable project meaning through:

```text
Observation
→ Project Intelligence
```

Graph Review may analyse that state but does not replace either path.

---

# 17. Assets / Publication Boundary

Graph Review does not own Assets or Publications.

It may inspect them where useful.

For example:

```text
Asset
+ Publication
+ identity Knowledge
→ graph-review
→ Finding
```

A Finding that an Asset conflicts with current project identity does not directly mutate or supersede that Asset.

It enters Project Intelligence and follows normal downstream governance.

Asset approval and Publication remain owned by the Assets / Publication Extension.

---

# 18. Project Progression Review

One useful application of Graph Review is project progression.

It may inspect:

- Project Intelligence coverage;
- stale or challenged Knowledge;
- Intent roadmap;
- open Delivery;
- blocked lifecycle state;
- unresolved Findings;
- completed work;
- relevant operational evidence.

It may answer:

> Given current project state, what deserves attention?

The resulting suggestions are Findings.

Graph Review does not create a separate roadmap or prioritisation engine.

Project Intelligence remains authoritative for derived Delivery candidates and their readiness.

---

# 19. Commands

Graph Review should expose a small command surface.

Conceptually:

```text
pactwright graph-review run
pactwright graph-review rerun <execution-id>
pactwright graph-review validate
```

A run may accept scope or perspective input through the active adapter.

Exact CLI ergonomics may evolve without changing the semantic model.

A rerun should distinguish between:

```text
pinned rerun
→ original Project Graph revision and resolved environment
```

and:

```text
current-state review
→ latest Project Graph revision
```

where both behaviours are exposed.

---

# 20. Automation

Graph Review may run:

```text
manually
on a schedule
in response to a relevant repository event
```

Triggering does not change Graph Review semantics.

GitHub Actions or other automation should remain thin.

They may invoke Graph Review but must not duplicate:

- scope resolution;
- Finding semantics;
- Project Intelligence hand-off;
- review validation.

Those remain Pactwright responsibilities.

---

# 21. Repository Model

Graph Review should keep execution provenance and derived reporting separate from canonical Project Graph state.

Conceptually:

```text
.pactwright/executions/
└── graph-reviews/

docs/graph-review/
└── reports/
```

Exact paths may evolve.

Review executions are provenance.

Reports are derived views.

Neither should become a second hand-maintained source of project truth.

Findings intended for durable project use flow into Project Intelligence.

---

# 22. Validation

Graph Review validation should ensure:

- every successful review identifies a Project Graph revision;
- review scope references valid registered graph state;
- the resolved Agent Pack supplies `graph-review`;
- referenced Production Skills are part of the locked environment;
- Findings reference their Review Execution;
- supporting Project Graph records are valid;
- Finding hand-off uses Project Intelligence Source ingestion;
- Graph Review does not directly mutate sibling-owned graph records;
- reruns identify whether they use pinned or current Project Graph state.

Core `pactwright validate` may invoke Graph Review validation when the Extension is enabled.

---

# 23. Evaluation

Graph Review evaluation belongs at the Pactwright responsibility boundary.

It should assess whether `graph-review` can:

- identify supported issues;
- avoid unsupported claims;
- find meaningful cross-record inconsistencies;
- use appropriate Project Intelligence context;
- distinguish local Delivery defects from project-wide concerns;
- provide useful evidence and provenance;
- avoid directly mutating canonical truth;
- choose appropriate Production Skills for the requested perspective.

Domain expertise remains benchmarked by the relevant Production Skills repositories.

For example:

```text
uiux-evaluate quality
→ UI/UX Design Skills benchmark

graph-review + uiux-evaluate integration
→ Pactwright Graph Review evaluation
```

---

# 24. Core Invariants

1. Graph Review is optional and does not redefine core Delivery semantics.
2. Graph Review and Delivery Review are distinct responsibilities.
3. There is one `graph-review` semantic capability.
4. Specialist perspectives do not require new Pactwright capabilities.
5. Review behaviour is supplied through Agent Packs and Production Skills.
6. Graph Review does not require a persistent Review Definition system.
7. Every review pins the Project Graph revision it inspects.
8. Review scope is resolved from the registered Project Graph.
9. Review Executions are provenance, not normal Project Graph nodes.
10. Findings are proposals, not automatically accepted truth.
11. Durable Findings enter Project Intelligence through Source ingestion.
12. Finding severity does not determine Intelligence consequence class or roadmap priority.
13. Graph Review does not directly mutate records owned by Delivery, Project Intelligence, Assets / Publication or Operations.
14. Graph Review does not own provider routing, task catalogues or production guidance.
15. Multiple Production Skills may participate in one Graph Review.
16. Production-specific evaluation remains owned by Production Skills.
17. Graph Review does not create a parallel roadmap, knowledge graph or production-analysis pipeline.

---

# 25. Anti-Overengineering Constraints

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
+ Finding
+ Project Intelligence
```

until real use demonstrates that another abstraction is necessary.

---

# 26. Current Implementation Baseline

The existing Graph Review & Creative Delivery research design already established several useful Graph Review principles:

- reviews inspect a deterministic Project Graph revision;
- scope resolves from the registered Project Graph;
- executions are provenance rather than graph nodes;
- reviewers emit Findings;
- Findings enter Project Intelligence through Source ingestion;
- review severity is advisory rather than authoritative. 

The canonical redesign removes the unrelated or duplicative machinery previously bundled with Graph Review:

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

The surviving Graph Review responsibility is therefore substantially smaller than the previous combined extension. The old specification itself already treated Graph Review Findings as proposals routed through Project Intelligence rather than direct canonical mutations. 

---

# 27. Relationship to Other Canonical Specifications

```text
01 Core System and Lifecycle
→ Delivery Review and Project Graph foundation

02 Distribution, Agent Packs, Extensions and Evaluation
→ graph-review capability implementation and distribution

03 Project Intelligence
→ durable governance of Findings

04 Graph Review
→ specialist analysis and Findings

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

# 28. Governing Rule

> **Graph Review performs specialist analysis over a pinned view of the current Project Graph and produces supported Findings. Agent Packs and Production Skills determine how each review is performed. Findings do not become project truth directly: durable meaning enters Project Intelligence through normal Source ingestion, while all downstream changes remain governed by their owning Pactwright semantics.**

---

**Pactwright Graph Review v1**