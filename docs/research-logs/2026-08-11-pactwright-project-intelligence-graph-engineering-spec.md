# Pactwright — Project Intelligence Graph Engineering Spec

## 1. Purpose

The Project Intelligence Graph is an optional Pactwright Project Graph extension.

It turns project material into durable, traceable knowledge that can:

- guide project onboarding
- supply relevant context to delivery
- surface stale or contradicted knowledge
- derive a roadmap of delivery obligations
- turn accepted real-world feedback into future delivery guidance

The extension does not redefine Delivery Graph or other extension semantics.

Its core flow is:

```text
Source
→ triage
→ Knowledge
→ delivery context or proposal
```

Sources may originate from:

- founding project material;
- research;
- feedback;
- metrics;
- incidents;
- experiments;
- internal review findings;
- Operations Observations;
- other enabled extensions.

Extension findings use the same ingestion and governance path as other project material.

For example:

```text
Operations Observation
        ↓
internal Source
        ↓
triage / promotion
        ↓
Knowledge
        ↓
corrective intent candidate
```

The founding corpus uses the same path as later Sources.

Cold start is ingestion against an empty Intelligence Graph, not a separate pipeline.

The implementation is repository-native. Repository files and the shared typed-edge graph are canonical state. GitHub Actions may run automation; pull requests and CODEOWNERS provide review gates.

No custom service, queue or database is required.

---

## 2. Extension Boundary

The Pactwright Project Graph contains independently owned subgraphs:

```text
Pactwright Project Graph
├── Delivery Graph                         required
├── Project Intelligence Graph             optional
├── Graph Review & Creative Delivery       optional
└── Operations Graph                       optional
```

Project Intelligence owns:

- Sources
- Domain Definitions
- Knowledge Cards

Delivery owns:

- Intents
- Decisions
- Contracts
- Briefs
- Evidence

Other extensions retain ownership of their canonical records.

For example:

```text
Review & Creative
    → Assets
    → Publications
```

```text
Operations
    → Deployments
    → Observations
```

Project Intelligence MAY:

- read registered Project Graph state
- register intelligence-specific node and edge types
- ingest internal Sources contributed by enabled extensions
- contribute accepted knowledge to delivery context
- derive delivery work candidates
- link intelligence records to records owned by other subgraphs through typed edges
- use extension-provided evidence when deriving roadmap readiness and ordering

It MUST NOT:

- redefine Delivery Graph semantics
- directly mutate delivery-owned canonical nodes
- redefine Operations Observations or Deployments
- redefine Review & Creative Assets or Publications
- bypass Delivery lifecycle policy
- create a parallel delivery lifecycle
- create extension-owned records on another extension's behalf
- make core Delivery Graph records depend on intelligence-specific semantics for their meaning

Canonical records never migrate between owners.

Extension findings become intelligence inputs through Source ingestion rather than ownership transfer.

Disabling Project Intelligence may remove intelligence context and derived reports, but MUST NOT change the meaning of existing Delivery or other extension-owned records.

An enabled extension that requires Project Intelligence cannot remain enabled if Project Intelligence is removed.

---

## 3. Invariants

1. Every accepted Knowledge Card is traceable to at least one Source.
2. Source content is immutable; changed content creates a new Source version.
3. Every Source and Knowledge Card belongs to a registered domain.
4. Every project using this extension has the core domain registry.
5. Ingestion may propose delivery-owned changes but never silently apply them.
6. Changes to canonical knowledge meaning require human approval.
7. Corroborating evidence may auto-apply only when canonical meaning is unchanged.
8. Canonical graph mutations go through the graph-maintenance responsibility.
9. Challenges, supersessions and retractions propagate through explicit graph edges.
10. Onboarding and the intent roadmap are generated views, not hand-maintained canonical state.
11. Missing knowledge is an intelligence gap, not automatically a Delivery Intent.
12. Delivery work enters the normal Delivery Graph lifecycle.
13. Findings from other extensions enter Project Intelligence through normal Source ingestion.
14. An Operations Observation is operational truth, not automatically accepted project knowledge.
15. Operational findings cannot directly create canonical Delivery Intents.
16. There is one Project Intelligence intent-roadmap derivation model.
17. Extension-specific roadmaps may filter Project Intelligence candidates but MUST NOT become independent prioritisation engines.
18. Project Intelligence consumes the deterministic Project Graph revision supplied by Pactwright runtime.

---

## 4. Repository Layout

When enabled, the extension adds:

```text
docs/project-intelligence/
  sources/
  domains/
  knowledge/<domain>/
  reports/
    onboarding.md
    domain-map.md
    freshness.md
    intent-roadmap.md
    failed-ingestion.md
```

Cross-graph relationships use the Project Graph's shared typed-edge storage.

Delivery-owned and other extension-owned canonical files remain under their owning paths.

The extension is enabled through Pactwright project configuration.

**Example:**

```yaml
extensions:
  project-intelligence:
    enabled: true
```

Distribution, versioning and locking of extensions are defined by the Pactwright Distribution specification.

---

## 5. Data Model

### 5.1 Source

A Source records material received by the project.

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

canonical_id + content_hash

**Rules:**

- same identity → no-op
- same `canonical_id`, new hash → new Source linked through `version_of`
- `snapshot` stores permitted source content in Git
- `reference` stores provenance, hash and pointer only
- secret detection runs before snapshot commit
- if stored bytes must be removed, retain provenance/hash and revalidate dependent knowledge

"origin" identifies the evidential origin.

For extension-produced internal Sources it SHOULD preserve the contributing extension and canonical record identity.

**Examples:**

review-creative:review-execution-...

operations:observation-checkout-errors-a819

The Source remains Project Intelligence-owned.

The originating record remains owned by its extension.

### Internal extension Sources

An enabled extension may contribute an internal Source when its canonical finding is relevant to durable project understanding.

For example:

```text
Review Finding
→ internal Source
```

```text
Operations Observation
→ internal Source
```

The internal Source references enough provenance to recover:

- originating extension;
- canonical originating record;
- content hash;
- supporting evidence where applicable;
- originating Project Graph revision.

Project Intelligence does not reinterpret the originating record as canonical knowledge during capture.

Normal triage still determines whether it is:

- irrelevant;
- duplicate;
- corroborating;
- incremental;
- novel;
- contradictory.

### Trust

Trust is qualitative:

| Tier | Meaning |
| --- | --- |
| T0 | primary / authoritative evidence for the claim |
| T1 | reliable secondary evidence |
| T2 | unverified evidence or anecdote |
| T3 | speculative / unchecked inference |

Trust is claim-relative.

An Operations Observation does not receive a fixed trust tier merely because it came from Operations.

Its trust depends on the evidence supporting the project claim being considered.

Domain Definitions may provide domain-specific trust examples.

---

### 5.2 Domain Definition

Domains organise project knowledge and drive:

- coverage
- onboarding
- freshness
- delivery context assembly
- roadmap readiness

The extension ships a core registry and allows reviewed extensions.

**Example:**

```yaml
id: discovery
core: true
scope: ...
steward: team-or-user
review_horizon: 180d
depends_on: []

canonical_artifacts:
  - user-research
  - personas

coverage_slots:
  - id: target-users
    question: Who are the target users and what evidence supports this?

brief_recipe:
  - relation: supports
    select: relevant accepted cards

trust_examples: []
```

**Fields:**

- "scope" — what belongs in the domain
- "canonical_artifacts" — minimum knowledge categories onboarding expects
- `coverage_slots` — optional project questions required for full coverage
- "depends_on" — domain prerequisites used by onboarding and roadmap readiness
- "steward" — review owner for the domain
- "review_horizon" — default freshness horizon
- `brief_recipe` — accepted knowledge eligible for delivery context
- "trust_examples" — optional domain-specific trust guidance

Registering or retiring a non-core domain requires review.

Core domains are never silently removed.

---

### 5.3 Knowledge Card

A Knowledge Card is a conclusion the project currently relies on.

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

**Rules:**

- new canonical cards and changed conclusions require review
- "observation", "interpretation" and "hypothesis" gain authority from evidence and may decay
- "requirement" and "constraint" gain authority through approval, not evidence counts
- "decision" represents durable project knowledge; it is distinct from a Delivery Graph Decision
- "decision" changes only through a new approved decision that supersedes it
- "recommendation" requires steward acceptance and may decay
- "forecast" remains provisional until resolved and expires at its stated horizon
- supersession replaces an older conclusion with a newer one
- retraction invalidates the basis and requires dependant revalidation

A Knowledge Card of kind "observation" is distinct from an Operations "Observation".

For example:

```text
Operations Observation
    "Checkout errors increased after deployment X"
            ↓ Source ingestion
Project Intelligence Knowledge
    "Checkout reliability is below the accepted operating level"
```

The first records operational reality.

The second records accepted project meaning.

---

## 6. Relationships

Project Intelligence registers relationships in the shared typed-edge graph.

Core intelligence relations:

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

Typical semantics:

knowledge --supports-------> knowledge

knowledge --contradicts----> knowledge

knowledge --depends-on-----> knowledge

knowledge --constrains-----> delivery node

knowledge --affects--------> delivery node

knowledge --requires-delivery--> intent

knowledge --satisfied-by---> evidence

knowledge --supersedes-----> knowledge

knowledge --retracts-------> knowledge

knowledge --informs-only---> delivery node

Cross-graph edges connect records without transferring ownership.

Delivery-obligation rules:

- accepted "requirement" knowledge produces a roadmap candidate unless already satisfied
- accepted knowledge whose approved conclusion explicitly requires delivery may produce a roadmap candidate
- once captured as an Intent, the motivating knowledge links to it with `requires-delivery`
- "constraint" normally contributes `constrains`
- "observation", "interpretation", "hypothesis" and "recommendation" are normally `informs-only` unless an approved conclusion explicitly creates a delivery obligation
- a reviewed decision may create whichever relation its conclusion requires
- recurring work uses "recurrence" rather than remaining a permanently unsatisfied one-off obligation

Extension-originated evidence follows the same rules.

An Operations Observation cannot directly create a `requires-delivery` edge.

Its promoted Project Intelligence meaning may do so when approved.

---

## 7. Core Domain Registry

Every project using Project Intelligence starts with these domains.

| Domain | Canonical knowledge | Default horizon |
| --- | --- | --- |
| discovery | user research, personas, market landscape, competitor analysis, ranked problem inventory | 2 quarters |
| product | vision, roadmap, product requirements, product bets and metrics | 2 quarters |
| identity | identity, values, tone/voice, ethics boundaries | 2 quarters |
| go-to-market | positioning, messaging, GTM strategy, campaign briefs/results, content strategy | 1 quarter |
| content | published surfaces, social strategy, content calendar | 1 quarter |
| decisions | durable project decisions and rationale | no decay |
| delivery/ux | UX principles, flows, wireframes, component patterns | 2 quarters |
| delivery/eng | tech stack, architecture, engineering specs, APIs, data/event models, observability | 6–12 months |
| handbooks | ways of working, quality bar, release process, security/compliance expectations | 12 months |

The core registry is part of the Project Intelligence contract, not an example.

### Core dependency chain

Canonical conventions:

1. `go-to-market` depends on accepted "discovery", "product" and "identity" knowledge.
2. "content" depends on `go-to-market`.
3. "discovery" evidence supports "product" bets and requirements.
4. "identity" constrains delivery producing outbound language.
5. "handbooks" constrain delivery through quality, release, security and compliance rules.
6. accepted `go-to-market` strategy may affect motivated Intents and launch sequencing.

"discovery", "product" and "identity" are the strategic upstream core.

They have no domain prerequisite for onboarding.

Other domains may be populated in parallel unless their Domain Definition declares dependencies.

### Extension domains

Projects may register additional intelligence domains without engine changes.

**Examples:**

- "operations"
- `delivery/generation`
- `delivery/orchestration`

An extension does not automatically require a matching intelligence domain.

For example, Operations findings may belong to:

- "product";
- `delivery/eng`;
- `go-to-market`;
- another appropriate registered domain.

A dedicated "operations" domain should exist only when the project has durable operational knowledge that does not fit the existing registry cleanly.

Extension domains use the same ingestion, coverage, freshness, propagation, context and roadmap rules.

A specialised Project Graph extension may own canonical semantics that also produce intelligence inputs.

Cross-extension ownership follows the same Project Graph rules.

---

## 8. Triage and Ingestion

Triage runs on every Source before expensive analysis:

1. Identity — duplicate or new version.
2. Relevance — whether the Source belongs to the project.
3. Domain — primary registered domain.
4. Comparison — compare with accepted knowledge and linked dependants.
5. Disposition — relationship to existing knowledge.
6. Impact class — ceremony required by the consequences.

If no registered domain fits, triage proposes a new Domain Definition and treats the change as class 2.

| Class | Meaning | Behaviour |
| --- | --- | --- |
| 0 | irrelevant, duplicate, pure corroboration | stop or add eligible evidence |
| 1 | additive information; canonical meaning unchanged | add Source/evidence links |
| 2 | genuinely new knowledge or non-conflicting delivery impact | reviewed promotion |
| 3 | contradiction or invalidation of accepted knowledge or delivered work | reviewed promotion + propagation |

Class is determined by consequences, not Source origin or domain.

An Operations Observation may therefore be class 0, 1, 2 or 3.

### Automatic boundary

Class 0/1 may only:

- add Source records
- add supporting evidence links
- update derived evidence state
- refresh freshness when eligible
- regenerate reports

It MUST NOT automatically change:

- Knowledge Card conclusions
- requirements
- constraints
- decisions
- supersessions
- retractions
- Delivery Graph nodes
- extension-owned canonical records

Any such change is class 2/3.

### Class 2/3 promotion

After Source capture:

1. analyse against current Project Graph state
2. extract relevant statements
3. propose Knowledge Card and edge changes
4. identify affected Delivery Graph and relevant extension-owned records
5. include delivery proposals where needed
6. open one promotion pull request
7. route review through relevant owners
8. apply validated Intelligence Graph mutations after approval
9. run propagation for class 3

The pull request is the promotion proposal.

Separate proposal nodes are not required initially.

### Extension findings

For internal Sources originating from another extension:

```text
extension canonical finding
        ↓
internal Source
        ↓
normal triage
```

Project Intelligence MUST NOT assume the extension finding already determines:

- project meaning;
- consequence class;
- required Delivery work;
- roadmap priority.

Those remain Project Intelligence decisions subject to normal governance.

---

## 9. Evidence and Freshness

The extension does not compute a numeric truth score.

For empirical knowledge:

- one T0 source may be sufficient when appropriate
- T1 normally requires independent corroboration
- T2/T3 cannot alone establish accepted empirical knowledge
- copied or syndicated sources sharing one "origin" count as one evidential origin

Normative kinds such as "requirement", "constraint" and "decision" are governed by approval, not evidence voting.

A corroborating Source may refresh a card only when the evidence is:

- newly observed
- from a distinct origin
- in scope
- trusted enough for the domain

Extension-produced internal Sources follow the same evidence rules.

Multiple summaries derived from the same underlying operational evidence MUST NOT be treated as independent corroboration merely because different agents or extensions produced them.

Each accepted card has `review_by`.

A scheduled freshness run marks overdue cards `stale` and regenerates:

reports/freshness.md

Staleness flags review.

It does not silently change canonical meaning.

---

## 10. Onboarding and Coverage

Onboarding is a generated graph operation.

It is not a separate questionnaire database.

### Coverage states

For each registered domain:

- Missing — one or more canonical artifact types have no accepted, in-horizon card
- Seeded — every canonical artifact type has at least one accepted, in-horizon card
- Covered — seeded and every declared `coverage_slot` is answered by accepted cards

A domain without coverage slots stops at `seeded`.

### Onboarding derivation

`onboard` compares the domain registry with accepted Knowledge Cards and regenerates:

reports/domain-map.md

reports/onboarding.md

`domain-map.md` shows:

- domain
- coverage state
- missing artifact types
- stale cards
- open obligations

`onboarding.md` lists the next source-ingestion actions needed to close knowledge gaps.

Guidance is dependency-aware:

1. surface gaps in domains whose prerequisites are already seeded
2. at cold start, prioritise "discovery", "product" and "identity"
3. surface independent delivery and handbook gaps in parallel
4. unlock `go-to-market` guidance when the strategic upstream core is seeded
5. unlock "content" guidance when `go-to-market` is seeded
6. continue until required domains are seeded or covered

Example onboarding action:

```yaml
domain: discovery
artifact_or_slot: personas
why_needed: ...
guidance: Provide an existing source describing target users, needs, behaviours and evidence.
depends_on: []
action: ingest-source
```

The guide asks for Sources, not answers written directly into canonical knowledge.

The user may provide existing material or create/research missing material.

That material then enters normal ingestion and triage.

Enabled extensions may also satisfy knowledge gaps by contributing relevant internal Sources through their normal semantics.

They MUST NOT write directly into Knowledge Cards to satisfy onboarding.

Knowledge gaps are onboarding actions, not Delivery Intents.

Coverage is regenerated after:

- accepted knowledge changes
- staleness
- domain changes
- supersessions
- retractions

Onboarding therefore remains useful after cold start.

---

## 11. Intent Roadmap

The Intelligence Graph derives one project-wide view of delivery obligations from accepted knowledge and existing Delivery state.

The roadmap is not canonical graph state and is not maintained by hand.

### What creates roadmap work

A roadmap candidate may come from:

- accepted "requirement" knowledge not already satisfied
- accepted knowledge whose approved conclusion explicitly requires delivery
- an existing open Intent
- previously delivered work whose grounding knowledge was challenged, superseded or retracted and should be reconsidered
- accepted operational meaning that requires corrective delivery

An Operations Observation alone does not create roadmap work.

The required path is:

```text
Observation
→ Source
→ accepted Project Intelligence meaning
→ intent candidate
```

`informs-only`, `supports` and `constrains` knowledge do not independently generate Intents.

Recurring obligations are surfaced through their recurrence policy rather than as permanently unimplemented work.

### Candidate provenance

Each derived candidate preserves enough provenance to explain why it exists.

This includes:

- motivating Knowledge Cards;
- relevant Sources;
- existing Intent when one already exists;
- contributing extension origins when relevant.

For Operations-originated work, provenance may trace:

```text
candidate
→ Knowledge
→ internal Source
→ Operations Observation
→ Deployment or Publication
```

The roadmap does not copy the Observation into Project Intelligence ownership.

### Readiness

A candidate inherits the domain of its motivating knowledge.

It is `ready` when:

- hard delivery dependencies are satisfied
- required domain dependencies are seeded

Otherwise it is `blocked`.

Missing knowledge links back to onboarding guidance.

### Ordering

The roadmap is a dependency DAG rendered as waves, not an artificial total order.

Within ready work, precedence is:

1. legal, security and safety obligations
2. active reliability risk
3. hard technical dependencies
4. committed delivery obligations
5. accepted go-to-market launch sequencing
6. uncertainty reduction and strategic value

GTM strategy may influence discretionary sequencing.

Operational evidence may influence appropriate ordering through accepted information such as:

- severity;
- frequency;
- recurrence;
- user impact;
- duration;
- affected production surface;
- regression against baseline;
- whether the issue remains active.

Operational metadata MUST NOT override:

- legal, security or safety obligations;
- hard dependencies;
- explicit project constraints.

Project Intelligence remains responsible for combining these signals into the roadmap.

Operations does not own roadmap priority.

### Output

`derive-intent-roadmap` regenerates:

reports/intent-roadmap.md

Each candidate contains:

```yaml
outcome: ...
domain: product
state: ready | blocked | open | reopen-proposed
depends_on: []

motivated_by:
  knowledge: []
  sources: []

origins: []

launch_tranche: null | ...
```

"origins" is derived provenance, not prioritisation state.

Examples may include:

```text
project-intelligence
review-creative
operations
```

This allows extension-specific views to filter the same candidate set.

For example, Operations may derive:

```text
docs/operations/reports/corrective-intent-roadmap.md
```

by selecting candidates whose accepted motivation traces to Operations.

That report remains a filtered view of this roadmap model.

It does not derive an independent candidate set or priority model.

Candidates are grouped at one coherent desired outcome with one evidenceable definition of done.

The report proposes Intents.

It does not create them.

A candidate enters the Delivery Graph through the normal intent-capture responsibility.

```text
After delivery, "satisfied-by" links motivating knowledge to Delivery Evidence and removes the obligation from the unimplemented set where appropriate.
If later operational evidence shows that delivered work did not achieve the required real-world outcome, normal Operations → Source → Project Intelligence processing may generate new knowledge and a new or reopened candidate.
```

Onboarding answers:

> What does the project still need to know?

The intent roadmap answers:

> What does the project still need to build or correct?

---

## 12. Propagation

Propagation runs after an accepted challenge, supersession or retraction.

It walks existing edges from changed knowledge to dependants and emits proposals.

It never silently edits dependants.

| Relation | Consequence |
| --- | --- |
| depends-on | propose dependant review |
| constrains | re-evaluate affected delivery context |
| supports | recompute/flag evidential support |
| contradicts | challenge affected knowledge |
| affects | notify owner and re-evaluate roadmap ordering |
| requires-delivery | re-evaluate linked Intent |
| satisfied-by | re-evaluate whether delivered evidence remains grounded |

Retraction always requires direct dependant revalidation.

Changes introduced through extension-originated Sources use exactly the same propagation semantics.

For example:

```text
Operations Observation
→ Source
→ accepted Knowledge change
→ propagation
→ affected Contract / Intent / Knowledge review
```

Propagation does not directly mutate Operations, Review & Creative or Delivery records.

Canonical cross-domain and cross-graph edges make impact analysis mechanical.

All downstream canonical changes remain subject to the owning graph's rules.

---

## 13. Delivery Integration

### Knowledge → delivery proposal

Class 2/3 promotion may propose:

- a new Intent
- reconsideration of an existing Intent
- review of a Contract or Brief affected by changed knowledge
- corrective work motivated by accepted production evidence

Every proposal links to the Knowledge Cards and Sources that motivated it.

When operational evidence contributes, provenance SHOULD remain traceable to the originating Observation and production exposure.

The Intelligence Graph does not directly create or amend Delivery Graph records.

```text
They enter the normal Delivery lifecycle.
Knowledge → delivery context
```

When Pactwright assembles context for delivery, Project Intelligence evaluates relevant Domain Definitions and their `brief_recipe`.

```text
Typical mappings:
```

- `delivery/eng` → architecture, stack, API and data constraints
- `delivery/ux` + "discovery" → journeys, personas and experience rules
- "product" → requirements and acceptance context
- "identity" → tone/voice constraints for outbound language
- "handbooks" → quality, release, security and compliance constraints
- extension domains → their registered context recipes

Only accepted, relevant and sufficiently current knowledge is included by default.

Accepted knowledge derived from production Observations is treated like other accepted knowledge.

Raw operational telemetry and extension execution provenance are not loaded through Project Intelligence context.

Context assembly is edge- and registry-driven.

Agents should not reconstruct project knowledge from conversation history.

---

## 14. Extension Integration

Project Intelligence provides the shared governance path for findings from specialised extensions.

### Graph Review & Creative Delivery

Review findings enter as internal Sources:

```text
Review Finding
→ internal Source
→ triage
→ Knowledge / proposal
```

Review severity does not determine Intelligence consequence class.

### Operations

Operations Observations enter as internal Sources:

```text
Observation
→ internal Source
→ triage
→ Knowledge / proposal
```

Operations "significance", "direction" and "confidence" may inform analysis.

They do not directly determine:

- trust tier;
- triage class;
- Knowledge status;
- roadmap priority.

Project Intelligence remains authoritative for accepted meaning and delivery consequences.

### Ownership

Project Intelligence may reference extension-owned records for provenance and context.

It MUST NOT:

- mutate those records;
- duplicate their canonical semantics;
- turn execution provenance into Project Intelligence graph nodes.

New extensions may use the same Source boundary without requiring new Project Intelligence ingestion semantics.

---

## 15. Commands and Automation

Initial extension commands:

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

Enabled extensions may invoke the same ingestion path for internal Sources rather than introducing extension-specific knowledge mutation commands.

AI adapters may expose equivalent interactive commands.

The Pactwright runtime owns deterministic transition and validation mechanics.

Semantic analysis may use the configured agent pack.

### Automation responsibilities

GitHub automation may run:

1. Capture validation — Source schema, identity/hash and secret scan.
2. Promotion validation — Knowledge/edge changes and required review.
3. Coverage/onboarding — regenerate domain and onboarding views.
4. Intent roadmap — regenerate after relevant knowledge, delivery or accepted extension-originated changes.
5. Propagation — identify dependants after class-3 changes.
6. Freshness — scheduled `review_by` scan and report regeneration.

Workflow YAML remains thin.

Extension semantics belong in Pactwright, not duplicated in GitHub Actions.

---

## 16. Idempotency, Concurrency and Failure

### Idempotency

- Source identity is `canonical_id + content_hash`
- re-running ingestion for the same identity converges on the same Source
- extension-originated internal Sources use stable originating record identity and content hash
- Project Graph revision is supplied by Pactwright runtime from canonical registered Project Graph state
- reports are deterministic views over a pinned Project Graph revision
- mutations validate against current graph state before application

### Concurrency

Git branches and pull requests provide isolation.

Conflicting promotions rebase and rerun validation against current state.

No application-level lease system is required initially.

### Failure

- transient automation failures may retry with bounded backoff
- deterministic validation failures stop immediately
- failed promotion never removes already captured Source state
- failed ingestion is listed in `reports/failed-ingestion.md`
- failed extension hand-off leaves the originating extension record valid and retryable
- rerunning triage or promotion uses current Project Graph state
- failure to regenerate a report never mutates canonical graph state

---

## 17. Validation

`pactwright intelligence validate` MUST enforce:

1. Source IDs, hashes, version links, domains, origins and trust values are valid.
2. Internal extension Sources reference valid originating provenance when declared.
3. All core Domain Definitions exist while the extension is enabled.
4. Domain Definitions contain required scope, stewardship, horizon, artifact and dependency information.
5. Domain dependencies reference registered domains and are acyclic.
6. Every accepted Knowledge Card references a registered domain and at least one Source.
7. Knowledge kinds follow their governance rules.
8. Superseded cards point to replacements.
9. Retracted cards trigger direct-dependant revalidation.
10. Class 0/1 mutations do not change canonical meaning, Delivery Graph state or extension-owned canonical state.
11. Class 2/3 canonical changes have required approval.
12. Intelligence-specific edge types use valid endpoints.
13. Cross-graph edges preserve record ownership.
14. `requires-delivery` targets a valid Delivery Intent.
15. `satisfied-by` targets valid Delivery Evidence.
16. Recurring obligations are not simultaneously treated as unsatisfied one-off obligations without explicit justification.
17. Roadmap candidates preserve valid motivating Knowledge provenance.
18. Extension-originated roadmap provenance traces through valid Sources.
19. An extension finding alone cannot create a canonical Delivery Intent.
20. Generated onboarding and roadmap reports identify the Project Graph revision they derive from.
21. Extension-specific roadmap projections do not introduce candidates absent from the Project Intelligence roadmap derivation.

Core `pactwright validate` may invoke extension validation when Project Intelligence is enabled.

---

## 18. Definition of Done

Project Intelligence is working when:

- the founding corpus uses the same ingestion path as later Sources
- the nine core domains exist automatically when the extension is enabled
- domains can be extended without engine changes
- onboarding identifies missing canonical knowledge and gives dependency-aware ingestion guidance
- "discovery", "product" and "identity" seed the strategic upstream core
- GTM guidance unlocks from that core and content guidance follows GTM
- missing knowledge is never confused with delivery work
- duplicate and irrelevant Sources stop cheaply
- corroboration can apply without changing canonical meaning
- novel or contradictory knowledge requires review
- requirements and decisions cannot be outvoted by source counts
- stale knowledge is surfaced automatically
- cross-domain changes propagate through graph edges
- findings from enabled extensions enter through normal internal Source ingestion
- Operations Observations remain distinct from accepted Project Intelligence meaning
- accepted operational meaning can motivate corrective delivery candidates
- operational significance and impact can inform roadmap ordering without becoming an independent priority system
- accepted delivery obligations generate one traceable intent roadmap
- extension-specific roadmaps can filter that candidate set without introducing separate roadmap engines
- blocked roadmap work links back to missing intelligence
- GTM strategy can influence discretionary sequencing without overriding mandatory dependencies
- roadmap candidates require normal intent capture before becoming Delivery Intents
- delivery context retrieves relevant accepted knowledge through domain recipes
- delivered Evidence can satisfy intelligence obligations through cross-graph edges
- later production evidence can motivate new or reopened work without rewriting prior Delivery Evidence
- re-running ingestion and report derivation converges
- Project Intelligence consumes the deterministic Project Graph revision supplied by Pactwright runtime
- Project Intelligence can be disabled without changing Delivery or sibling-extension record meaning

---

## 19. Future Improvements

Add only when observed scale or quality needs justify them.

### Claim Nodes

Introduce explicit Claim nodes only when Knowledge Cards become too coarse for evidence consolidation.

### Processing Records

Add first-class processing or promotion records only when Git and CI audit history become insufficient.

### Richer Evidence Independence

Add evidence-independence metadata beyond "origin" only when copied, correlated or extension-derived Sources create real validation failures.

### Confidence Policy

Add richer confidence matrices only when qualitative trust tiers are insufficient.

### Review Queues

Add veto windows, review SLAs or queue management only when promotion volume requires them.

### Richer Coverage

Add scoring beyond missing/seeded/covered only when those states fail to guide onboarding.

### Automatic Research

Add research/fetch connectors only after source-driven onboarding works reliably.

### Roadmap Optimisation

Add optimisation or simulation beyond dependency waves and precedence rules only when teams need it.

Operational signals should first prove useful within the existing ordering model.

### Retention

Add richer retention classes, tombstones or legal-history rewrite workflows only when required.

### Ingestion Adapters

Add document-specific extraction skills, hooks, MCP connectors and continuous feeds only when repeated ingestion needs justify them.

Operational source adapters remain owned by Operations; Project Intelligence consumes their resulting internal Sources rather than duplicating those integrations.

---

## 20. Governing Rule

For Project Intelligence changes ask:

> Does this improve the project's durable understanding without redefining delivery or extension-owned semantics?

For extension findings ask:

> Can this enter through the normal Source boundary rather than creating another knowledge path?

For operational feedback ask:

> What accepted project meaning follows from the Observation, and does that meaning require future delivery?

For roadmap changes ask:

> Can this remain one Project Intelligence candidate model with extension-specific filtered views?

If the change belongs to Delivery state or lifecycle, it belongs in the Delivery Graph.

If it represents what happened in production, it belongs in Operations.

If it represents specialised approved output or publication state, it belongs in Review & Creative.

If it improves durable project knowledge, provenance, onboarding, delivery context or delivery-obligation derivation, it belongs in Project Intelligence.

Keep Project Intelligence authoritative for meaning without turning it into a second delivery, operations or extension runtime.

---

---

Pactwright — Project Intelligence Graph Engineering Spec v3
