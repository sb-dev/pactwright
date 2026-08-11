# Pactwright — Graph Review & Creative Delivery Engineering Spec

## 1. Purpose

Graph Review & Creative Delivery is an optional first-party Pactwright Project Graph extension.

It adds two capabilities:

1. Graph Review — run specialist reviews over the current Project Graph, including enabled extensions, and route findings through normal Project Intelligence governance.
2. Creative Delivery — use the normal Delivery lifecycle to produce grounded creative work, then record approved Assets and Publications as durable Project Graph truth.

The extension reuses:

- the Delivery Graph lifecycle;
- Project Intelligence ingestion, grounding and propagation;
- Pactwright agent packs and evaluation;
- the shared typed-edge graph;
- Pactwright GitHub integration.

It does not introduce a second delivery lifecycle, knowledge graph, workflow engine, database or orchestration service.

Core flows:

```text
Project Graph
→ specialist review
→ finding
→ Project Intelligence Source
→ triage / promotion
→ normal delivery or knowledge change
```

```text
Intent
→ Decision
→ Contract
→ Brief
→ Delivery
→ Review
→ Evidence
→ approved Asset
→ Publication
```

When Operations is enabled, Publication may become a production exposure:

```text
Publication
→ Operations Observation
→ Project Intelligence
→ future delivery
```

Operations remains responsible for what happens after publication.

This extension remains responsible for what was approved and published.

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

The first version of Graph Review & Creative Delivery requires Project Intelligence.

Conceptually:

```text
review-creative
      ↓ requires
project-intelligence
      ↓
Delivery core
```

Operations is an independent sibling extension.

There is no dependency between:

```text
review-creative
operations
```

When both are enabled, this extension may register "Publication" as a compatible operational exposure.

The extension owns:

- Asset semantics;
- Publication semantics;
- review definitions and review execution mechanics;
- creative-delivery integration;
- generation provenance for extension-owned provider calls.

It MAY:

- read the complete registered Project Graph;
- review Delivery, Project Intelligence and other enabled extension state;
- create internal review findings for Project Intelligence ingestion;
- contribute creative-delivery context to Delivery Briefs;
- use provider/model capabilities during review or delivery;
- register extension-specific edge types;
- register Publication as an operational exposure;
- contribute agent capabilities, evaluation cases and GitHub requirements.

It MUST NOT:

- redefine Delivery node meaning or lifecycle stages;
- directly mutate Delivery-owned canonical nodes;
- directly mutate Project Intelligence knowledge;
- create a parallel roadmap or onboarding model;
- make review findings canonical truth without ingestion and triage;
- make provider-call history part of normal Project Graph traversal;
- redefine Operations Deployment or Observation semantics;
- create production Observations;
- ingest or retain production telemetry;
- reinterpret production performance as Graph Review findings;
- make GitHub state canonical.

Disabling the extension MUST NOT change the meaning of Delivery, Project Intelligence or Operations records.

Extension-owned canonical records remain preserved unless explicitly removed.

Disabling Operations MUST NOT change the meaning of existing Assets or Publications.

---

## 3. Invariants

1. Reviewers propose findings only.
2. Every finding emitted by a successful review enters Project Intelligence through normal Source ingestion and triage.
3. Review scope is resolved from the registered Project Graph, not hard-coded to known extensions.
4. Review executions pin a deterministic Project Graph revision.
5. Creative work uses the normal Delivery lifecycle.
6. Candidate concepts and generation attempts remain transient unless they become durable Delivery truth or an approved Asset.
7. Creative outputs may assert only project knowledge included in their grounding manifest.
8. Missing external facts are ingested before they are treated as project truth.
9. Creative verification is independent from the producing responsibility.
10. Human approval is required before a candidate output becomes an approved Asset.
11. Only an approved Asset may be published.
12. Assets are immutable; revisions create new Assets linked by `supersedes`.
13. Every extension-owned direct provider call creates an immutable Generation Record.
14. Provider/model guidance is versioned and its exact resolved versions are recorded.
15. Generation guidance changes use Pactwright Evaluation and normal human merge; no separate promotion lifecycle exists.
16. Canonical graph mutation uses Pactwright's graph-mutation responsibility.
17. Adding a reviewer or provider does not require changing Review or Creative Delivery semantics.
18. Publication is owned by this extension even when Operations observes it.
19. Operations observations of a Publication do not mutate the Asset or Publication.
20. Production outcomes enter durable project meaning through Operations and Project Intelligence, not through Graph Review.

---

## 4. Extension Manifest

**Example:**

```yaml
id: review-creative
package: "@pactwright/review-creative"
version: 1.0.0
pactwright: "^1.0.0"

dependencies:
  extensions:
    - project-intelligence

graph:
  node_types:
    - asset
    - publication

  edge_types:
    - produces
    - grounded-in
    - publishes

runtime:
  namespaces:
    - review
    - creative

agent_capabilities:
  - graph-review
  - creative-delivery
  - creative-verification
  - generation-review

operations:
  exposure_types:
    - publication

github:
  profile: review-creative
```

`supersedes` is a shared core Project Graph relation and is not redeclared by the extension.

`operations.exposure_types` declares that a Publication can be observed when the Operations extension is enabled.

It does not introduce an Operations dependency.

When Operations is disabled, the declaration has no runtime effect.

Distribution, locking, installation and GitHub provisioning follow the Pactwright Distribution specification.

---

## 5. Repository Layout

When enabled, the extension adds:

```text
reviews/
  definitions/

assets/

docs/review-creative/
  assets/
  publications/
  reports/
    next-actions.md

.pactwright/review-creative/
  providers/
  tasks/
  generation-guidance/

.pactwright/executions/
  reviews/
  generations/
```

The shared Project Graph edge store remains:

```text
specs/graph/edges.yml
```

**Rules:**

- `docs/review-creative/assets/` and `publications/` contain canonical extension records.
- `reviews/definitions/` contains reviewer configuration, not graph truth.
- `.pactwright/executions/` contains immutable execution provenance, not Project Graph nodes.
- `assets/` stores repository-friendly output files; larger or external binaries use a storage pointer.
- generated reports are derived views.

Standard review definitions and standard generation guidance may ship with the extension or selected agent pack and are resolved through normal Pactwright locking.

Production telemetry and Operations execution records do not belong under this extension's repository structure.

---

## 6. Graph Review

### 6.1 Review Definition

A Review Definition declares a specialist perspective without introducing a graph node.

**Example:**

```yaml
id: architecture-reviewer
version: 1

scope:
  graph: project
  include:
    - delivery
    - project-intelligence
    - enabled-extensions

perspective: ...
rubric: ...
trigger: manual
task_class: graph-review
steward: ...
secondary_model: null
```

A definition contains:

- stable id and version;
- perspective;
- graph scope;
- rubric;
- manual, scheduled or event trigger;
- task class;
- steward;
- optional secondary eligible model.

Adding a reviewer normally requires only a Review Definition.

### 6.2 Extension-aware scope

The Review Engine resolves scope from the registered Project Graph schema.

```text
enabled Project Graph
        ↓
registered node + edge types
        ↓
Review Definition scope
        ↓
resolved review context
```

A reviewer using `graph: project` sees compatible state contributed by future extensions without Review Engine code changes.

Definitions may narrow scope to selected:

- subgraphs;
- node types;
- domains;
- relationships;
- active lineages;
- generated reports;
- execution records where explicitly required.

If Operations is enabled, a graph-wide review may therefore inspect canonical Deployment or Observation state where relevant.

That does not transfer Operations ownership to Graph Review.

### 6.3 Review execution

A review run:

1. loads the Review Definition;
2. resolves the current Project Graph revision;
3. resolves its review scope;
4. loads relevant context;
5. invokes the configured review capability;
6. records a Review Execution;
7. emits findings through Project Intelligence ingestion.

Project Graph revision derivation is a core Pactwright runtime concern.

This extension consumes and records that deterministic revision; it does not define a separate revision scheme.

A Review Execution is an immutable execution record, not a graph node.

Minimum record:

```yaml
id: review-execution-...
definition:
  id: architecture-reviewer
  version: 1
  hash: ...

graph_revision: ...
scope:
  nodes: []
  edges: []

generation_records: []
findings: []

trigger: manual
created: ...
status: succeeded | failed
```

"review run" uses the current Project Graph revision.

"review rerun <execution-id>" reproduces the recorded review against its pinned Project Graph revision and resolved configuration by default.

An explicit current-state rerun may instead resolve the latest Project Graph state.

Model outputs are comparable, not assumed byte-identical.

### 6.4 Findings

A finding contains:

```yaml
claim: ...
supporting_nodes: []
suggested_improvement: ...
severity: advisory | material | critical
review_execution: ...
```

Each finding emitted by a successful review enters Project Intelligence as an internal Source.

```text
Review Finding
→ internal Source
→ triage
→ duplicate / corroborating / novel / contradictory
→ reviewed promotion where required
→ normal Project Graph consequences
```

The Review Engine ends at the finding.

It cannot directly change:

- Knowledge Cards;
- Intents;
- Decisions;
- Contracts;
- Briefs;
- roadmap ordering;
- Assets;
- Publications;
- Deployments;
- Observations;
- generation guidance.

Review severity is advisory metadata.

Project Intelligence triage determines actual consequence class.

Production evidence SHOULD first become an Operations Observation when Operations owns its interpretation.

Graph Review should not be used as a parallel production-analysis path.

---

## 7. Standard Reviewer Pack

The extension ships a standard roster of Review Definitions.

| Reviewer | Perspective |
| --- | --- |
| ux-researcher | User journeys, UX coverage, dead ends and persona consistency |
| product-strategist | Product bets, roadmap, intents and discovery alignment |
| gtm-strategist | Positioning, personas, GTM strategy and content alignment |
| architecture-reviewer | Structural drift, complexity and architecture constraints |
| graph-auditor | Orphans, missing edges, stale state and graph integrity |
| voice-auditor | Published Asset compliance with identity and voice |
| cost-reviewer | Provider usage, command budgets and abnormal generation cost |
| generation-reviewer | Provider/model behaviour and generation-guidance quality |
| progression-reviewer | Coverage gaps, ready work, unresolved findings and stalled progression |

Projects may add, replace or disable definitions.

Reviewer identity does not imply a bespoke agent.

The selected agent pack may map several Review Definitions to one generic review capability unless evaluation shows specialised behaviour is required.

Operational production analysis remains an Operations capability rather than another standard Graph Review Definition.

### Cross-model review

A Review Definition may request a secondary eligible provider/model.

Both reviews receive the same pinned scope.

Agreement and disagreement are reported explicitly.

Cross-model review is optional and does not create a second review engine.

---

## 8. Progression Review

`progression-reviewer` reviews existing Pactwright progression state.

It may inspect:

- Project Intelligence onboarding and coverage;
- the derived intent roadmap;
- Delivery lifecycle state;
- unresolved review findings;
- stale reviews;
- stalled active work.

When Operations is enabled, relevant accepted corrective candidates may already appear in the Project Intelligence intent roadmap and therefore be visible to progression review.

The reviewer does not independently derive an Operations roadmap.

It produces:

```text
docs/review-creative/reports/next-actions.md
```

Each suggestion contains:

```yaml
gap: ...
evidence: []
recommended_command: ...
```

The report is a derived view.

It creates no graph nodes and does not replace:

- Project Intelligence onboarding;
- the Project Intelligence intent roadmap;
- the Operations corrective-intent roadmap;
- Delivery lifecycle state.

It answers:

> Given current project state, what is the most useful Pactwright action to take next?

---

## 9. Creative Delivery

Creative Delivery is a Delivery capability, not a parallel lifecycle.

Creative work follows:

```text
Intent
→ transient Contract alternatives
→ Decision
→ canonical Contract
→ Brief
→ Delivery
→ Review
→ Evidence
→ Asset approval
→ Publication
```

Examples include:

- copy;
- articles;
- campaign material;
- diagrams;
- images;
- presentations;
- audio;
- video;
- other generated or manually produced project assets.

The extension does not require all modalities in the first implementation.

### Contract alternatives

For strategically meaningful creative work, ordinary Pactwright Contract alternatives represent competing concepts.

Rejected concepts remain transient.

No separate Concept node is required.

### Creative Brief contribution

A creative Brief uses normal Delivery Brief semantics and adds only the information needed by the creative delivery capability:

- modality;
- target channel or surface;
- format constraints;
- task class;
- grounding manifest;
- required identity/voice context;
- acceptance and verification requirements.

The Brief remains Delivery-owned.

The extension does not introduce an Asset Brief node.

### Delivery execution

`deliver-brief` invokes the creative-delivery capability when the Brief requires creative output.

Delivery attempts and candidate outputs remain execution state.

Where comparison is useful, the capability may produce multiple candidates transiently and select one for Review.

Generation does not itself create an Asset node.

Production performance is not part of creative Delivery verification.

A creative output may satisfy its Contract and Brief and still perform poorly after publication.

That later outcome belongs to Operations when the extension is enabled.

---

## 10. Grounding

Creative output grounding is explicit.

A grounding manifest contains Project Graph ids and content hashes.

**Example:**

```yaml
grounding:
  - id: knowledge-product-positioning
    hash: ...
  - id: knowledge-brand-voice
    hash: ...
```

**Rules:**

- factual project claims must be supportable by the grounding manifest;
- current identity/voice knowledge is required for outbound language when applicable;
- external claims not already represented as accepted project knowledge enter Project Intelligence ingestion first;
- challenged, superseded or retracted grounding may require affected unapproved work to be regenerated or re-verified;
- approved Assets retain the grounding revision they were approved against.

The extension may register `grounded-in` edges from approved Assets to relevant Project Intelligence records so later propagation can identify affected Assets.

Post-publication evidence does not retrospectively alter the grounding manifest.

If production performance reveals new project knowledge:

```text
Publication
→ Operations Observation
→ Project Intelligence
```

handles that feedback.

---

## 11. Creative Verification

Creative verification uses the core Delivery Review stage.

The creative-verification capability is independent from the producing responsibility.

It checks applicable criteria such as:

- factual grounding;
- Contract and Brief adherence;
- identity and voice;
- target channel and format;
- accessibility;
- known rights or usage constraints;
- safety or brand risks requiring human judgement.

Using a different provider/model from the producer may be configured and is preferred when evaluation shows value, but is not a global invariant.

Blocking verification findings prevent Evidence from representing the output as successfully delivered.

Review reasoning remains transient.

Verification results are recorded in Delivery Evidence.

Creative verification answers whether the produced work satisfies the agreed Delivery requirements.

It does not predict or certify real-world publication performance.

---

## 12. Asset

An Asset is an approved durable project output.

Candidate outputs are not graph nodes.

Human approval of reviewed Delivery Evidence creates the Asset.

**Minimum structure:**

```yaml
id: asset-...
type: asset
title: ...
created: ...

media_type: ...
content_hash: ...
storage_pointer: ...

delivery_evidence: evidence-...

generation_records: []

grounding:
  - id: ...
    hash: ...

approved_by: human:...
approved_at: ...
```

**Rules:**

- `content_hash` identifies the exact approved output;
- "storage_pointer" may reference a repository file or external binary store;
- "generation_records" may be empty for manually produced work;
- grounding is required when the Asset asserts project facts;
- an Asset is immutable once created;
- a revision creates a new Asset and uses `supersedes`;
- approval applies to the exact content hash.

The extension adds:

evidence --produces----> asset

asset    --grounded-in-> Project Intelligence record

asset    --supersedes--> asset

Only `produces` and `grounded-in` are new extension edge types in this group.

`supersedes` reuses the shared Project Graph relation.

Operations observes Publications rather than Assets by default because Publication identifies the actual production exposure.

---

## 13. Publication

A Publication records that an approved Asset was released to an external or project-facing surface.

**Minimum structure:**

```yaml
id: publication-...
type: publication
title: ...
created: ...

asset: asset-...
asset_hash: ...
channel: ...
locator: null | ...
published_by: human:... | automation:...
published_at: ...
```

The extension adds:

publication --publishes--> asset

**Rules:**

- only an approved Asset may be published;
- "asset_hash" MUST match the Asset's approved content hash;
- scheduled publication of an already approved Asset may be automated;
- publication never mutates the Asset;
- corrections create a new Asset and, when released, a new Publication.

Publication is post-Delivery extension state.

It does not add a new core Delivery lifecycle stage.

### Operations integration

Publication may be registered as an operational exposure.

When Operations is enabled:

```text
Publication
    ↓
Operations Observation
```

may represent real-world findings such as:

- reach;
- engagement;
- conversion;
- user response;
- publication errors;
- channel performance;
- other meaningful outcomes.

Operations MUST reference the existing Publication.

It MUST NOT copy or replace it.

A production Observation does not mutate:

- Publication;
- Asset;
- Delivery Evidence.

If accepted project meaning follows from the Observation, it proceeds through:

```text
Observation
→ Project Intelligence Source
→ triage / promotion
→ Knowledge
→ future delivery candidate where appropriate
```

Review & Creative does not depend on Operations for Publication to remain valid.

---

## 14. Provider Runtime

The extension may call external model APIs through one repository-local Provider Runtime.

It is execution infrastructure, not Project Graph semantics.

Extension-owned direct provider calls MUST use it.

This requirement does not replace or redefine the active Pactwright AI adapter used to execute normal agent responsibilities.

### Initial interface

type Capability =

```text
  | "text"
  | "structured"
  | "image"
  | "tts"
  | "transcription"
  | "video"
  | "embeddings"
  | "grounded-search";
```

interface ProviderRuntime {

```ts
  generate<T>(
    request: GenerationRequest<T>,
    context: GenerationContext,
  ): Promise<GenerationResult<T>>;
}
```

The runtime owns:

```text
task catalog
→ provider/model selection
→ generation-guidance resolution
→ prompt/input assembly
→ command-budget check
→ adapter call
→ normalisation
→ Generation Record
```

Provider adapters contain provider-specific SDK translation only.

Adding a provider requires:

1. an adapter;
2. conformance tests;
3. a Provider Definition;
4. task-catalog eligibility.

No Review or Creative Delivery call-site changes should be required.

### Errors

Normalised errors:

auth

rate-limit

content-policy

transient

permanent

---

## 15. Provider and Task Configuration

Project configuration lives under:

```text
.pactwright/review-creative/providers/
.pactwright/review-creative/tasks/
```

A Provider Definition declares:

- provider id;
- capabilities;
- allowed models;
- data-handling notes;
- optional per-call restrictions.

A task catalog declares eligible provider/model combinations and a default.

**Example:**

```yaml
task: copy-generation

eligible:
  - provider: openai
    model: <model-id>
  - provider: anthropic
    model: <model-id>

default:
  provider: openai
  model: <model-id>
```

Provider discovery may validate configured models.

It MUST NOT silently change project eligibility.

---

## 16. Generation Record

Every extension-owned direct provider call creates one immutable Generation Record.

Generation Records are execution provenance, not Project Graph nodes.

**Minimum structure:**

```yaml
id: generation-...
caller: ...

provider: ...
model: ...
capability: ...
task_class: ...

parameters: {}

graph_revision: ...
prompt_hash: ...

guidance:
  - id: ...
    version: ...
    hash: ...

grounding:
  - id: ...
    hash: ...

usage: {}
cost_usd: null | ...
latency_ms: ...

status: succeeded | failed | refused
output_hash: null | ...
error: null | auth | rate-limit | content-policy | transient | permanent
```

One provider call creates one record.

Review Executions, Delivery Evidence and Assets may reference multiple Generation Records.

Failed and refused calls are still recorded.

Generation Records are not production telemetry.

Operations does not ingest them merely because it is enabled.

---

## 17. Generation Guidance

Generation Guidance is fast-moving AI behaviour.

It does not introduce another Project Graph extension or knowledge domain.

Standard guidance belongs to the selected agent pack or extension package.

Project-specific overrides may live under:

```text
.pactwright/review-creative/generation-guidance/
```

A guideline has:

```yaml
id: openai-copy-generation
version: 3

applies_to:
  provider: openai
  model: "<pattern>"
  task: copy-generation

guidance:
  - ...

supersedes:
  - openai-copy-generation@2
```

Guidelines are immutable once selected as a released or project-approved version.

Resolution order is:

```text
standard guidance
→ project guidance
```

Every Generation Record stores the exact resolved guideline ids, versions and hashes.

### Learning loop

Generation guidance improves through existing Pactwright evaluation:

```text
Generation Records
+ verification results
+ human selections
+ reviewer findings
        ↓
generation-reviewer
        ↓
guideline or task-catalog proposal
        ↓
pactwright eval
        ↓
human merge
        ↓
future generation
```

Where Operations is enabled, accepted Project Intelligence knowledge derived from publication outcomes may later influence creative strategy or grounding through the normal Project Intelligence context path.

Raw publication analytics do not feed Generation Guidance directly.

A guideline evaluation should keep constant where practical:

- provider/model;
- task input;
- Brief;
- grounding manifest;
- prompt template;
- evaluation cases.

Only the candidate guidance changes.

Evaluation may compare:

- grounding;
- Brief adherence;
- output-format compliance;
- verification failures;
- regeneration count;
- human preference;
- cost where meaningful.

Do not collapse the result into one aggregate score.

---

## 18. Cost Controls

Cost enforcement remains execution-local initially.

Provider Definitions and task catalogs may constrain:

- tokens;
- cost;
- media size/count;
- duration;
- provider parameters.

A command may define:

interface GenerationBudget {

```yaml
  executionId: string;
  maxCostUsd: number;
```

}

The Provider Runtime refuses an avoidable call that would exceed the remaining command budget.

Actual usage and cost are recorded.

Concurrency-safe period-wide accounting is not required initially.

Credentials come from environment variables or GitHub Actions secrets.

---

## 19. Commands and Agent Responsibilities

Initial runtime commands:

```text
pactwright review run <review-id>
pactwright review rerun <execution-id> [--current]
pactwright review roster
pactwright review next-actions
pactwright creative approve-asset <evidence-id>
pactwright creative record-publication <asset-id> <channel>
pactwright creative validate
```

"review rerun" uses the original execution's pinned Project Graph revision and resolved configuration by default.

"--current" explicitly reruns the same Review Definition against current Project Graph state.

Creative work itself uses the existing Delivery lifecycle commands:

```text
capture intent
→ propose contracts
→ decision
→ write brief
→ deliver brief
→ review
→ prepare evidence
```

Required agent capabilities:

graph-review

creative-delivery

creative-verification

generation-review

Review Definitions are perspectives over capabilities, not necessarily separate agents.

Operations analysis is not a capability of this extension.

When publication feedback requires production analysis, it uses the Operations extension's `operations-analysis` capability.

The active adapter may expose equivalent interactive commands.

---

## 20. GitHub Automation Boundary

The extension may contribute GitHub requirements for:

- scheduled or event-triggered reviews;
- provider adapter conformance tests;
- task-catalog validation;
- generation-guidance evaluation;
- extension validation;
- scheduled publication of already approved Assets.

Workflow YAML remains thin and invokes Pactwright runtime commands.

Exact workflows, checks, fields, triggers and views belong to the Pactwright GitHub Actions and Views specification.

When Operations is enabled, Publication changes may also trigger Operations automation because Publication is a registered operational exposure.

That automation remains owned by:

```text
.github/workflows/pactwright-operations.yml
```

rather than being added to Review & Creative runtime semantics.

The extension does not define GitHub state as canonical.

---

## 21. Validation

`pactwright creative validate` and extension validation MUST enforce:

1. every Review Definition has a valid id, version, scope, rubric, trigger and task class;
2. Review Executions reference valid definition hashes and Project Graph revisions;
3. review findings reference their Review Execution and supporting graph records;
4. findings emitted by successful reviews enter Project Intelligence through Source ingestion rather than direct canonical mutation;
5. every Generation Record references valid provider/model/task eligibility;
6. every successful Generation Record has an output hash;
7. every recorded generation-guidance version exists and matches its hash;
8. every grounded output references valid graph id/hash pairs;
9. every Asset references valid Delivery Evidence;
10. every Asset content hash matches its stored or referenced output;
11. every Asset approval records a human approver;
12. every `produces`, `grounded-in`, `publishes` and `supersedes` edge has valid endpoints;
13. every Publication references an approved Asset and matching Asset hash;
14. superseded Assets remain immutable;
15. generated reports identify the Project Graph revision they derive from;
16. any declared operational exposure type is owned by this extension and resolves to a valid canonical node type;
17. Operations integration does not introduce Operations-owned canonical state into this extension's storage.

Core `pactwright validate` may invoke extension validation when enabled.

---

## 22. Failure and Idempotency

### Review

- deterministic definition or scope errors fail immediately;
- failed reviews create execution records but do not emit findings into Project Intelligence;
- "review rerun" uses the original pinned Project Graph revision and resolved configuration by default;
- current-state reruns require an explicit request;
- duplicate findings are handled by Project Intelligence triage.

### Generation

- every attempted provider call records success, failure or refusal;
- retries are bounded;
- failed generation does not create an Asset;
- failed creative verification blocks approval;
- failed Publication never changes the approved Asset.

### Publication and Operations

- Publication remains valid if Operations processing later fails;
- failed Operations observation does not change Publication;
- absence of Operations does not change Publication semantics;
- publication-performance failure is not a Publication validation failure unless the publication record itself is invalid.

### Derived state

- `next-actions.md` is deterministic over its pinned Project Graph revision and review inputs;
- report-generation failure does not mutate canonical graph state.

---

## 23. Initial Build Order

## 1. Provider execution foundation

**Build:**

- Provider Runtime interface;
- Generation Record;
- provider/task configuration;
- command budget;
- initial provider adapters;
- adapter conformance tests.

## 2. Graph Review

**Build:**

- Review Definition;
- Review Execution;
- extension-aware graph scope;
- "review run" / `rerun`;
- findings → Project Intelligence Source ingestion.

Ship the full standard reviewer roster as definitions.

Use one reviewer as the first end-to-end acceptance path, not as the only reviewer.

## 3. Creative Delivery

**Build:**

- creative Brief contribution;
- grounded delivery execution;
- independent creative verification;
- Evidence integration;
- Asset approval;
- Asset supersession;
- Publication;
- Publication operational-exposure registration.

Prove one text or image Asset end to end.

Publication exposure registration must remain inert when Operations is disabled.

## 4. Generation Guidance

**Build:**

- standard/project guidance resolution;
- Generation Record guidance provenance;
- generation-reviewer proposals;
- Pactwright Evaluation comparison.

## 5. Progression and automation

**Build:**

- progression-reviewer;
- `next-actions`;
- scheduled reviews;
- validation;
- GitHub automation requirements.

Operations-specific ingestion, Observation creation and production analysis remain outside this extension's build.

---

## 24. Definition of Done

The extension is working when:

- it installs without changing Delivery or Project Intelligence semantics;
- it does not require Operations;
- its manifest explicitly registers its owned node and edge types;
- its manifest may expose Publication as an operational exposure without creating an Operations dependency;
- a Review Definition can inspect the registered Project Graph, including enabled extensions;
- the standard reviewer roster runs through one generic Review Engine;
- adding a reviewer normally requires only a definition;
- every review pins a Project Graph revision supplied by the Pactwright runtime;
- "review rerun" can reproduce a review against its original pinned revision and configuration;
- findings from successful reviews become Project Intelligence Sources and cannot directly mutate canonical truth;
- production findings are not incorrectly routed through Graph Review when Operations owns them;
- `progression-reviewer` recommends commands without becoming another roadmap;
- creative work uses the normal Delivery lifecycle;
- competing creative concepts use normal transient Contract alternatives;
- delivery attempts do not accumulate as graph nodes;
- creative output is grounded in explicit Project Graph records;
- creative verification is independent from production;
- human approval creates an immutable Asset;
- Asset revisions supersede rather than mutate;
- only an approved Asset can produce a Publication;
- published output traces to Delivery Evidence, grounding and generation provenance;
- Publication remains owned by Review & Creative after release;
- Operations may observe Publication without copying or mutating it;
- production Observations do not alter Asset approval or Publication history;
- every extension-owned provider call creates a Generation Record;
- adding a provider requires no Review or Creative Delivery engine change;
- generation guidance is versioned, evaluated and traceable without becoming graph truth;
- provider-call history does not pollute normal Project Graph context;
- generated reports identify deterministic Project Graph revisions;
- disabling Operations leaves Review & Creative fully valid;
- disabling Review & Creative leaves Operations semantics valid for its remaining exposure types;
- disabling the extension leaves the core Delivery lifecycle and Project Intelligence valid.

---

## 25. Future Improvements

Add only when observed usage justifies them.

### Additional modalities

Expand tested delivery paths for audio, video, transcription, embeddings and other media.

### Richer binary storage

Add Git LFS, GitHub Releases or another managed binary-storage policy only when current pointers become insufficient.

### Review scheduling policy

Add richer review queues, SLAs or cadence management only when review volume requires it.

### Multi-provider corroboration

Require systematic cross-provider review only where evaluation shows material benefit.

### Verifier separation

Require provider/model separation between producer and verifier only where evidence justifies the added cost.

### Campaign composition

Add first-class multi-Asset campaign coordination only when normal Delivery decomposition is insufficient.

### Provider accounting

Add concurrency-safe project or period spend ceilings and dashboards only when command budgets are insufficient.

### Richer Operations integration

Add publication-specific operational context or performance-aware creative workflows only when generic Operations exposure and Project Intelligence feedback prove insufficient.

Do not introduce publication-performance semantics directly into Asset or Publication records.

---

## 26. Governing Rule

For Review changes ask:

> Does this improve how Pactwright critiques current Project Graph state without creating a second source of truth?

For Creative Delivery changes ask:

> Can this reuse the normal Delivery lifecycle and add only the durable output semantics that Delivery does not own?

For provider or generation changes ask:

> Is this execution infrastructure or fast-moving AI behaviour rather than Project Graph truth?

For production outcomes ask:

> Is this about what happened after Publication rather than whether the Asset was correctly delivered and published?

If so, it belongs to Operations.

Keep review findings governed by Project Intelligence, delivery governed by Delivery, approved outputs and Publications governed by this extension, production outcomes governed by Operations, and AI execution details outside normal graph context.

---

---

Pactwright — Graph Review & Creative Delivery Engineering Spec v3
