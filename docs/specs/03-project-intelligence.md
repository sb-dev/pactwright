# Pactwright Project Intelligence

## 1. Purpose

Project Intelligence is an optional Pactwright Extension that turns project material into durable, traceable knowledge.

Its core flow is:

```text
Source
→ triage
→ Knowledge
→ future context or Delivery candidate
```

Project Intelligence answers:

> What does this project currently know, what supports that knowledge, and what should that knowledge influence?

It supports:

- project onboarding;
- accepted project knowledge;
- evidence and provenance;
- project-specific guidance;
- freshness and contradiction detection;
- Delivery and Review context;
- impact propagation;
- future Intent candidates.

The founding corpus uses the same ingestion path as later Sources. Cold start is ingestion against an empty Project Intelligence graph, not a separate pipeline.

Project Intelligence does not redefine the Delivery Graph or create a parallel delivery lifecycle.

---

## 2. Scope and Ownership

Project Intelligence owns:

```text
Source
Domain Definition
Knowledge
```

plus:

- ingestion;
- triage;
- promotion;
- trust and evidence;
- coverage;
- freshness;
- propagation;
- context assembly;
- onboarding;
- intent-roadmap derivation.

Other Pactwright semantics retain their own ownership:

```text
Delivery
→ Intent, Decision, Contract, Brief, Evidence

Graph Review
→ Findings

Assets / Publication
→ Asset, Publication

Operations
→ Deployment, Observation
```

Project Intelligence may read and link to those records.

It must not redefine or mutate them on their owner's behalf.

Cross-graph relationships connect records without transferring ownership.

Disabling Project Intelligence must not change the meaning of Delivery or sibling-Extension records. An enabled Extension that requires Project Intelligence cannot remain enabled if Project Intelligence is removed.

---

# 3. Core Invariants

1. Every accepted Knowledge record is traceable to at least one Source.
2. Source content is immutable; changed material creates a new Source version.
3. Every Source and Knowledge record belongs to a registered domain.
4. Every project using Project Intelligence has the nine-domain core registry.
5. Ingestion may propose Delivery-owned changes but never silently apply them.
6. Changes to canonical Knowledge meaning require human approval.
7. Corroborating evidence may auto-apply only when canonical meaning is unchanged.
8. Challenges, supersessions and retractions propagate through explicit graph relationships.
9. Onboarding and the Intent roadmap are generated views, not hand-maintained canonical state.
10. Missing knowledge is an intelligence gap, not automatically a Delivery Intent.
11. Delivery work enters the normal Delivery Graph lifecycle.
12. Findings from other Extensions enter through normal Source ingestion.
13. An Operations Observation is operational truth, not automatically accepted project knowledge.
14. Extension-originated findings cannot directly create canonical Delivery Intents.
15. There is one Project Intelligence Intent-roadmap derivation model.
16. Extension-specific roadmap views may filter Project Intelligence candidates but must not introduce independent candidate or prioritisation models.
17. Project Intelligence consumes the deterministic Project Graph revision supplied by Pactwright runtime.

---

# 4. Knowledge Boundary

Project Intelligence holds **project-specific knowledge**.

It does not replace reusable expertise owned by Agent Packs or Production Skills.

```text
Production Skills
→ reusable general expertise

Production Extension Packs
→ reusable specialised expertise

Project Intelligence
→ project-specific accepted knowledge
```

For example:

```text
"Kafka consumers require careful idempotency handling"
→ Software Engineering Skills

"This project's subscription consumer requires ordering by account ID"
→ Project Intelligence
```

Likewise, reusable production guidance belongs in Production Skills, while lessons specific to this project belong in Project Intelligence.

Agent Packs and Production Skills must not become hidden project memory.

---

# 5. Source Model

A Source records material received by the project.

Sources may originate from founding material, research, requirements, feedback, experiments, metrics, incidents, Delivery Evidence, Graph Review Findings, Operations Observations, Production Skills outputs or other enabled Extensions.

Conceptually:

```yaml
id: src-...
canonical_id: ...
content_hash: ...
captured_at: ...
observed_at: ...
source_type: document | internal | digest
storage: snapshot | reference
location: ...
version_of: null | src-...
status: active | withdrawn | retracted
origin: ...
trust: T0 | T1 | T2 | T3

triage:
  disposition: irrelevant | duplicate | corroborating | incremental | novel | contradictory
  class: 0 | 1 | 2 | 3
  domain: ...
  affected_nodes: []
  graph_revision: ...
  agent_version: ...
  rationale: ...
```

Source identity is:

```text
canonical_id + content_hash
```

Rules:

- the same identity is a no-op;
- the same `canonical_id` with a new hash creates a new Source linked through `version_of`;
- `source_type` describes the evidential form;
- `storage` independently describes whether permitted content is stored as a repository `snapshot` or retained as a `reference` with provenance, hash and pointer;
- secret detection must run before snapshot content is committed;
- if stored bytes must later be removed, provenance and hash remain and dependent Knowledge must be revalidated;
- every Source must resolve to a registered domain through triage.

`digest` remains a supported Source type. This specification does not invent additional digest semantics beyond the existing Source identity, provenance, trust and triage rules.

---

# 6. Internal Sources

Other Pactwright Extensions may contribute internal Sources.

Examples:

```text
Graph Review Finding
→ internal Source

Operations Observation
→ internal Source

Delivery or Production evaluation
→ internal Source
```

The Source must preserve enough provenance to recover:

- originating Extension or process;
- originating canonical record where applicable;
- content hash;
- supporting evidence where applicable;
- originating Project Graph revision.

The originating record remains owned by its original subsystem.

Capture as a Source does not mean its interpretation has automatically become accepted project knowledge.

Normal triage still applies.

---

# 7. Trust

Trust is qualitative and claim-relative.

| Tier | Meaning |
|---|---|
| **T0** | primary or authoritative evidence |
| **T1** | reliable secondary evidence |
| **T2** | unverified evidence or anecdote |
| **T3** | speculative or unchecked inference |

Trust is not assigned solely from Source type or origin.

An Operations Observation is not automatically T0. An AI-generated research synthesis is not automatically trusted because it came from Deep Research Skills.

The strength and independence of the underlying evidence determine trust.

Project-specific trust guidance may be expressed through Domain Definitions.

---

# 8. Domain Definitions

Domains organise project knowledge and drive:

```text
coverage
onboarding
freshness
context assembly
stewardship
roadmap readiness
```

Conceptually:

```yaml
id: discovery
core: true
scope: ...
steward: ...
review_horizon: 180d
depends_on: []

canonical_artifacts: []

coverage_slots:
  - id: ...
    question: ...

brief_recipe:
  - ...

trust_examples: []
```

A Domain Definition specifies, where applicable:

- scope;
- whether the domain is core;
- steward;
- review horizon;
- dependencies;
- canonical knowledge categories;
- coverage questions;
- context-selection rules;
- trust guidance.

Projects and compatible Extensions may register additional domains without changing the Project Intelligence engine.

Registering or retiring a non-core domain requires review.

Core domains must never be silently removed.

The supported registration interface is:

```text
pactwright intelligence register-domain <id>
```

---

# 9. Core Domain Registry

Every project using Project Intelligence starts with these nine domains.

| Domain | Canonical knowledge | Default horizon |
|---|---|---|
| `discovery` | user research, personas, market landscape, competitor analysis, ranked problem inventory | 2 quarters |
| `product` | vision, roadmap, product requirements, product bets and metrics | 2 quarters |
| `identity` | identity, values, tone/voice, ethics boundaries | 2 quarters |
| `go-to-market` | positioning, messaging, GTM strategy, campaign briefs/results, content strategy | 1 quarter |
| `content` | published surfaces, social strategy, content calendar | 1 quarter |
| `decisions` | durable project decisions and rationale | no decay |
| `delivery/ux` | UX principles, flows, wireframes, component patterns | 2 quarters |
| `delivery/eng` | tech stack, architecture, engineering specs, APIs, data/event models, observability | 6–12 months |
| `handbooks` | ways of working, quality bar, release process, security/compliance expectations | 12 months |

The core registry is part of the Project Intelligence contract, not an example.

Core dependency conventions are:

1. `go-to-market` depends on accepted `discovery`, `product` and `identity` knowledge.
2. `content` depends on `go-to-market`.
3. `discovery` evidence supports `product` bets and requirements.
4. `identity` constrains Delivery producing outbound language.
5. `handbooks` constrain Delivery through quality, release, security and compliance rules.
6. accepted `go-to-market` strategy may affect motivated Intents and launch sequencing.

`discovery`, `product` and `identity` are the strategic upstream core and have no domain prerequisite for onboarding.

Other domains may be populated in parallel unless their Domain Definition declares dependencies.

An Extension does not automatically require a matching intelligence domain. Add a domain only when durable project knowledge does not fit the existing registry cleanly.

---

# 10. Knowledge Model

Knowledge represents a conclusion the project currently relies on.

Conceptually:

```yaml
id: knowledge-...
domain: ...
kind: observation | interpretation | hypothesis | requirement | constraint | decision | recommendation | forecast
status: provisional | accepted | stale | challenged | superseded | retracted

conclusion: ...

evidence:
  - source: src-...
    relation: supports | contradicts

last_refreshed: ...
review_by: ...
superseded_by: null | knowledge-...
recurrence: null | { cadence_or_trigger: ..., owner: ..., command: ... }
```

Every accepted Knowledge record must:

- belong to a registered domain;
- be traceable to at least one Source;
- have explicit governance state.

Recurring obligations use the `recurrence` policy instead of remaining permanently unsatisfied one-off obligations.

The recurrence record defines the durable obligation policy. The mechanism that schedules or triggers recurrence execution is not defined here and must not be inferred as Project Intelligence-owned scheduling infrastructure.

---

# 11. Knowledge Governance

Different kinds of Knowledge gain authority differently.

Evidence-driven kinds include:

```text
observation
interpretation
hypothesis
recommendation
forecast
```

Authority-driven kinds include:

```text
requirement
constraint
decision
```

Rules:

- new canonical Knowledge and changed conclusions require human review and approval;
- `observation`, `interpretation` and `hypothesis` gain authority from evidence and may decay;
- `requirement` and `constraint` gain authority through approval, not evidence counts;
- Project Intelligence `decision` is durable project knowledge distinct from a Delivery Graph Decision and changes only through a new approved decision that supersedes it;
- `recommendation` requires steward acceptance and may decay;
- `forecast` remains provisional until resolved and expires at its stated horizon;
- evidence may challenge authority-driven Knowledge but does not silently overturn it.

A requirement cannot be outvoted by Source count.

---

# 12. Supersession and Retraction

Knowledge does not silently mutate when its meaning changes.

```text
new Knowledge
--supersedes-->
old Knowledge
```

Supersession replaces an older conclusion with a newer accepted one.

Retraction means the basis is no longer considered valid.

Retraction requires direct dependants to be revalidated.

Historical Sources remain traceable even when resulting Knowledge is superseded or retracted.

---

# 13. Relationships and Delivery Obligations

Project Intelligence uses the shared typed-edge graph.

Core intelligence relations are:

```text
depends-on
supports
contradicts
constrains
affects
requires-delivery
satisfied-by
supersedes
retracts
informs-only
```

Typical semantics include:

```text
Knowledge --supports----------> Knowledge
Knowledge --contradicts-------> Knowledge
Knowledge --depends-on--------> Knowledge
Knowledge --constrains--------> Delivery record
Knowledge --affects-----------> Delivery record
Knowledge --requires-delivery-> Intent
Knowledge --satisfied-by------> Evidence
```

Delivery-obligation rules:

- accepted `requirement` Knowledge produces a roadmap candidate unless already satisfied;
- accepted Knowledge whose approved conclusion explicitly requires Delivery may produce a roadmap candidate;
- once captured as an Intent, motivating Knowledge links to it with `requires-delivery`;
- `constraint` normally contributes `constrains`;
- `observation`, `interpretation`, `hypothesis` and `recommendation` are normally `informs-only` unless an approved conclusion explicitly creates a Delivery obligation;
- a reviewed Project Intelligence decision may create whichever relation its conclusion requires;
- recurring work is surfaced through its recurrence policy rather than as a permanently unsatisfied one-off obligation.

An Operations Observation cannot directly create a `requires-delivery` edge. Its promoted Project Intelligence meaning may do so after approval.

---

# 14. Ingestion and Triage

Every Source is triaged before expensive analysis.

Triage determines:

1. identity;
2. relevance;
3. primary registered domain;
4. comparison with accepted Knowledge and linked dependants;
5. disposition;
6. consequence class.

If no registered domain fits, triage proposes a new Domain Definition and treats the change as class 2.

The main dispositions are:

```text
irrelevant
duplicate
corroborating
incremental
novel
contradictory
```

| Class | Meaning | Behaviour |
|---|---|---|
| **0** | irrelevant, duplicate, pure corroboration | stop or attach eligible evidence |
| **1** | additive evidence, canonical meaning unchanged | add Source/evidence links and eligible freshness updates |
| **2** | genuinely new Knowledge or non-conflicting Delivery impact | reviewed promotion |
| **3** | contradiction or invalidation of accepted Knowledge or delivered work | reviewed promotion + propagation |

Class depends on consequences, not Source origin.

---

# 15. Automatic Mutation Boundary and Promotion

Class 0/1 processing may automatically:

- capture Sources;
- add supporting evidence;
- update derived evidence state;
- refresh freshness when eligible;
- regenerate derived reports.

It must not automatically change:

```text
Knowledge conclusions
requirements
constraints
decisions
supersessions
retractions
Delivery Graph records
other Extension-owned canonical records
```

Any such change is class 2/3.

For class 2/3 material, Project Intelligence:

1. analyses against current Project Graph state;
2. extracts relevant statements;
3. proposes Knowledge and edge changes;
4. identifies affected Delivery and Extension-owned records;
5. includes Delivery proposals where needed;
6. creates one reviewed promotion unit through normal repository review infrastructure;
7. routes review through relevant owners;
8. applies validated Project Intelligence mutations after human approval;
9. runs propagation for class 3.

Separate proposal graph nodes are not required initially.

Extension-originated Sources use exactly the same path. Origin does not pre-decide project meaning, consequence class, Delivery work or roadmap priority.

---

# 16. Evidence and Freshness

Project Intelligence does not compute one numeric truth score.

For empirical Knowledge:

- one T0 Source may be sufficient when appropriate;
- T1 normally requires independent corroboration;
- T2/T3 cannot alone establish accepted empirical Knowledge;
- copied, syndicated or agent-generated derivatives sharing one origin count as one evidential origin.

A corroborating Source may refresh Knowledge only when the evidence is newly observed, from a distinct origin, in scope and trusted enough for the domain.

Every accepted Knowledge record has `review_by` where freshness is meaningful.

A freshness run marks overdue Knowledge `stale` and regenerates the freshness view.

Staleness flags review. It does not silently change canonical meaning.

Normative Knowledge such as requirements and durable decisions may use different or no decay policy.

---

# 17. Coverage and Onboarding

Project Intelligence derives coverage for every registered domain.

Coverage states have precise meanings:

- **Missing**: one or more canonical artifact types have no accepted, in-horizon Knowledge.
- **Seeded**: every canonical artifact type has at least one accepted, in-horizon Knowledge record.
- **Covered**: the domain is Seeded and every declared `coverage_slot` is answered by accepted current Knowledge.

A domain without coverage slots stops at **Seeded**.

Onboarding asks:

> What does this project still need to know?

It compares the domain registry with current Knowledge and produces dependency-aware Source-ingestion guidance.

Ordering rules are:

1. surface gaps in domains whose prerequisites are already Seeded;
2. at cold start prioritise `discovery`, `product` and `identity`;
3. surface independent Delivery and `handbooks` gaps in parallel;
4. unlock `go-to-market` guidance when the strategic upstream core is Seeded;
5. unlock `content` guidance when `go-to-market` is Seeded;
6. continue until required domains are Seeded or Covered.

Onboarding recommends Sources to provide, create or research. It must not fabricate Knowledge directly.

```text
knowledge gap
→ obtain/create Source
→ ingest
→ triage
→ promote
→ accepted Knowledge
```

Coverage is regenerated after accepted Knowledge changes, staleness, domain changes, supersessions and retractions.

Missing knowledge is not automatically a Delivery Intent.

---

# 18. Research and Production Skills Integration

Production Skills may create material suitable for Project Intelligence ingestion.

Examples include Deep Research outputs, UI/UX evaluation, Delivery evaluation and repeated project-specific production lessons.

The boundary is:

> Production Skills perform specialised work. Project Intelligence determines what the project should retain as durable knowledge.

Not every Production Skills result should become Knowledge.

Reusable generic rules remain in Production Skills or Production Extension Packs.

Project-specific guidance worth retaining follows normal Source → Knowledge governance rather than a separate generation-guidance subsystem.

---

# 19. Delivery Context

Project Intelligence contributes relevant accepted Knowledge when Pactwright constructs context for:

```text
Contract crafting
Brief generation
Delivery
Review
Graph Review
```

Context selection is driven by:

- relevant domains;
- graph relationships;
- Domain Definition `brief_recipe` rules;
- current status and freshness;
- the requested responsibility.

Only accepted, relevant and sufficiently current Knowledge is included by default.

Do not load every project document, raw telemetry, complete Source histories, execution logs or stale/challenged Knowledge without explicit reason.

Agents should not reconstruct durable project knowledge from conversation history when Project Intelligence can provide canonical context.

---

# 20. Project Intelligence Does Not Override Contracts

Accepted Knowledge may inform a Contract.

It does not silently modify one.

If new Knowledge shows that an authorised outcome should change:

```text
new Knowledge
→ Delivery candidate
→ normal Intent / Decision / Contract lifecycle
```

Project Intelligence may identify affected Contracts, Briefs or delivered work, but the owning Delivery semantics decide what changes.

---

# 21. Intent Roadmap

Project Intelligence derives one project-wide view of Delivery obligations.

The roadmap answers:

> What does the project currently need to build, change or reconsider?

Candidates may come from:

- accepted requirements not yet satisfied;
- accepted Knowledge explicitly requiring Delivery;
- existing open Intents;
- delivered work whose grounding Knowledge was challenged, superseded or retracted;
- accepted operational meaning requiring corrective work.

Raw Sources, Graph Review Findings and Operations Observations do not directly create Delivery work.

The required path is:

```text
Finding / Observation / other Source
→ Source
→ accepted Knowledge
→ Intent candidate
```

Recurring obligations are surfaced through their recurrence policy rather than as permanently unimplemented work.

The exact scheduler or event mechanism that determines when a recurrence becomes due is outside this specification.

The roadmap proposes Intents. It does not create them.

---

# 22. Candidate Provenance, Readiness and Ordering

Every roadmap candidate retains traceability to:

```text
motivating Knowledge
supporting Sources
relevant existing Intent
originating Extension records where applicable
```

Candidate states are:

```text
ready
blocked
open
reopen-proposed
```

A candidate is `ready` when:

- hard Delivery dependencies are satisfied;
- required domain dependencies are Seeded.

Otherwise it is `blocked` and links back to corresponding knowledge gaps.

The roadmap is a dependency DAG rendered as waves, not an artificial total ranking.

Within otherwise ready work, precedence is:

1. legal, security and safety obligations;
2. active reliability risk;
3. hard technical dependencies;
4. committed Delivery obligations;
5. approved go-to-market launch sequencing;
6. uncertainty reduction and strategic value.

Operational evidence may inform severity, frequency, recurrence, user impact, duration and active regression state only after that meaning has passed through Project Intelligence governance.

Extensions may filter this candidate set for specialised views but must not introduce candidates absent from the Project Intelligence roadmap or define an independent priority engine.

---

# 23. Delivery Satisfaction and Recurrence

When delivered work satisfies a Project Intelligence obligation:

```text
Knowledge
--satisfied-by-->
Evidence
```

For one-off obligations this removes the obligation from the outstanding set where appropriate.

For recurring obligations, satisfaction closes the current occurrence while the recurrence policy remains the durable source for future occurrences. Recurring work must not remain permanently represented as an unsatisfied one-off candidate.

If later evidence shows that the real-world outcome was not achieved:

```text
Observation
→ Source
→ new Knowledge
→ new or reopened candidate
```

Prior Delivery Evidence remains factual history and is not rewritten.

---

# 24. Propagation

Propagation runs when accepted Knowledge is challenged, superseded or retracted.

It traverses existing relationships and produces review/change proposals rather than silently editing dependants.

Typical consequences:

| Relation | Consequence |
|---|---|
| `depends-on` | review dependant Knowledge |
| `supports` | recompute or flag evidential support |
| `contradicts` | challenge affected Knowledge |
| `constrains` | re-evaluate affected Delivery context |
| `affects` | notify owner and reconsider roadmap ordering |
| `requires-delivery` | re-evaluate linked Intent |
| `satisfied-by` | re-evaluate whether delivered Evidence remains grounded |

Retraction always requires direct dependant revalidation.

Propagation never directly mutates Delivery, Graph Review, Assets / Publication or Operations records.

---

# 25. Graph Review and Operations Integration

Graph Review Findings and Operations Observations use the same governance boundary:

```text
Extension-owned canonical record
→ internal Source
→ triage
→ Knowledge / candidate
```

Every successful Graph Review Finding is handed to Project Intelligence as a Source by the Graph Review Extension. Project Intelligence triage decides whether that Source is irrelevant, corroborating, novel or contradictory.

Operations Observations remain operational truth. Project Intelligence owns only the project meaning accepted from them.

Extension metadata such as severity, significance, direction or confidence may inform analysis but does not directly determine trust, triage class, Knowledge status or roadmap priority.

---

# 26. Commands and Required Capabilities

Initial Project Intelligence commands are:

```text
pactwright intelligence ingest <path-or-url>
pactwright intelligence triage <source-id>
pactwright intelligence promote <source-id>
pactwright intelligence register-domain <id>
pactwright intelligence onboard
pactwright intelligence derive-intent-roadmap
pactwright intelligence propagate <knowledge-id>
pactwright intelligence refresh
pactwright intelligence validate
```

Enabled Extensions invoke the same ingestion path for internal Sources rather than introducing Extension-specific Knowledge mutation commands.

Project Intelligence requires these Pactwright capabilities:

```text
intelligence-triage
intelligence-promotion
intelligence-context
```

The selected Agent Pack decides which agents and Production Skills implement them.

The runtime owns deterministic transition, validation and canonical mutation mechanics.

---

# 27. Repository Model

When enabled, Project Intelligence keeps canonical records and derived reports separate.

Conceptually:

```text
docs/project-intelligence/
├── sources/
├── domains/
├── knowledge/<domain>/
└── reports/
    ├── onboarding.md
    ├── domain-map.md
    ├── freshness.md
    ├── intent-roadmap.md
    └── failed-ingestion.md
```

Canonical records are Sources, Domain Definitions, Knowledge and typed relationships.

Reports are deterministic derived views over a Project Graph revision and must not become hand-maintained second sources of truth.

Exact paths may evolve without changing these ownership rules.

---

# 28. Automation

Automation may run:

1. capture validation, including Source schema, identity/hash and secret scan;
2. promotion validation, including Knowledge/edge changes and required review;
3. coverage/onboarding regeneration;
4. Intent-roadmap regeneration after relevant Knowledge, Delivery or accepted Extension-originated changes;
5. propagation after class-3 changes;
6. scheduled freshness scans.

Workflow definitions remain thin. Project Intelligence semantics belong in Pactwright rather than being duplicated in GitHub Actions.

---

# 29. Idempotency, Concurrency and Failure

Idempotency rules:

- Source identity is `canonical_id + content_hash`;
- rerunning ingestion for the same identity converges on the same Source;
- Extension-originated Sources use stable originating record identity and content hash;
- reports are deterministic views over a pinned Project Graph revision;
- mutations validate against current graph state before application.

Concurrency uses normal repository isolation. Conflicting promotions must rebase and rerun validation against current state. No application-level lease system is required initially.

Failure rules:

- transient automation failures may retry with bounded backoff;
- deterministic validation failures stop immediately;
- failed ingestion is recorded in `reports/failed-ingestion.md`;
- failed promotion never removes an already captured Source;
- failed Extension hand-off leaves the originating Extension record valid and retryable;
- rerunning triage or promotion uses current Project Graph state;
- report-generation failure never mutates canonical state.

---

# 30. Validation

`pactwright intelligence validate` must enforce at least:

1. Source IDs, hashes, version links, domains, origins and trust values are valid.
2. Source type and storage mode are valid independent fields.
3. Snapshot Sources passed required secret scanning before canonical capture.
4. Removing stored Source bytes retains provenance/hash and causes dependent Knowledge revalidation.
5. Internal Sources reference valid originating provenance when declared.
6. All nine core Domain Definitions exist while Project Intelligence is enabled.
7. Domain Definitions contain required scope, stewardship, horizon, artifact and dependency information.
8. Domain dependencies reference registered domains and are acyclic.
9. Every accepted Knowledge record references a registered domain and at least one Source.
10. Knowledge kinds follow their governance rules.
11. Superseded Knowledge points to valid replacements.
12. Retracted Knowledge triggers direct-dependant revalidation.
13. Class 0/1 mutations do not change canonical meaning, Delivery state or Extension-owned canonical state.
14. Class 2/3 canonical changes have required human approval.
15. Intelligence-specific edge types use valid endpoints.
16. Cross-graph edges preserve record ownership.
17. `requires-delivery` targets a valid Delivery Intent.
18. `satisfied-by` targets valid Delivery Evidence.
19. Recurring obligations are not simultaneously treated as permanently unsatisfied one-off obligations without explicit justification.
20. Roadmap candidates preserve valid motivating Knowledge and Source provenance.
21. Extension-originated roadmap provenance traces through valid Sources.
22. An Extension finding alone cannot create a canonical Delivery Intent.
23. Generated onboarding and roadmap reports identify the Project Graph revision they derive from.
24. Extension-specific roadmap projections do not introduce candidates absent from Project Intelligence roadmap derivation.
25. Coverage states obey the exact Missing/Seeded/Covered rules, including that domains without coverage slots stop at Seeded.

Core `pactwright validate` may invoke Project Intelligence validation when the Extension is enabled.

---

# 31. Anti-Overengineering Constraints

Do not introduce initially:

```text
numeric truth scores
Claim nodes
proposal graph nodes
processing-record graphs
custom queue/service/database
automatic web research engine
complex confidence matrices
optimisation-based roadmap planning
separate Extension-specific knowledge pipelines
generation-guidance subsystem
independent Extension roadmap engines
```

Use:

```text
Source
Domain
Knowledge
typed relationships
triage
review
derived views
```

until observed scale or quality problems demonstrate that additional machinery is necessary.

The following remain deliberately unresolved rather than being invented here:

- richer semantics for the `digest` Source type;
- the scheduler or trigger mechanism that materialises recurring obligations;
- richer evidence-independence metadata beyond `origin`;
- first-class processing/promotion records;
- richer coverage scoring.

---

# 32. Current Implementation Baseline

Project Intelligence is primarily a canonical target rather than a completed `0.0.1` subsystem.

The existing Pactwright architecture already provides:

- optional Extension loading;
- Project Graph ownership boundaries;
- Agent Pack capability resolution;
- deterministic Project Graph revision concepts;
- repository-native canonical state;
- Git-based review and history.

The canonical redesign preserves:

```text
Source
→ triage
→ Knowledge
→ Delivery context / Intent candidate
```

while updating integration boundaries:

- Graph Review is independent from Assets / Publication;
- durable production guidance belongs in Project Intelligence;
- Production Skills outputs may become Sources;
- reusable Production Skills expertise remains outside Project Intelligence;
- Operations and Graph Review use the same Source-ingestion boundary.

---

# 33. Relationship to Other Canonical Specifications

```text
01 Core System and Lifecycle
→ owns Contract and Delivery semantics

02 Distribution, Agent Packs, Extensions and Evaluation
→ owns Extension distribution and AI composition

03 Project Intelligence
→ owns project-specific durable knowledge

04 Graph Review
→ produces specialist Findings

05 Assets and Publication
→ owns approved durable outputs

06 Operations
→ produces real-world Observations

07 GitHub Integration
→ projects automation and review to GitHub

08 Open-Source Project Organisation
→ governs repository and ecosystem structure
```

---

# 34. Governing Rule

> **Project Intelligence turns project material, research, Delivery experience, Review Findings and operational evidence into traceable accepted project knowledge. It contributes that knowledge to future Pactwright work and may propose Delivery obligations, but it never bypasses Contract authority, Delivery ownership or the normal Intent lifecycle. Reusable expertise stays in Production Skills; only project-specific knowledge worth future reliance belongs in Project Intelligence.**

---

**Pactwright Project Intelligence v1**