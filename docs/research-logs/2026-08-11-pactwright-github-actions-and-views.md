# Pactwright — GitHub Actions and Views

## 1. Purpose

GitHub is Pactwright's primary remote automation and operational surface.

Pactwright remains the source of Project Graph truth.

GitHub Actions execute Pactwright runtime responsibilities.

GitHub views project Pactwright state.

GitHub MUST NOT become a second graph, lifecycle, extension database, observability store or roadmap engine.

This specification is authoritative for Pactwright's exact GitHub operating surface, including:

- generated workflows;
- checks;
- PR and Issue summaries;
- GitHub Project fields and views;
- runtime projection behaviour.

Distribution and extension specifications may declare GitHub profiles and requirements, but they do not redefine these GitHub semantics.

The GitHub integration supports:

- core Delivery automation and views;
- optional Project Intelligence automation and views;
- optional Graph Review & Creative Delivery automation and views;
- optional Operations automation and views.

Extension-specific GitHub integration is active only when the corresponding extension is enabled.

---

## 2. Operating Boundary

The relationship is:

```text
Pactwright Project Graph + policy
              ↓
        Pactwright runtime
              ↓
        GitHub Actions
              ↓
          GitHub views
```

The Project Graph remains canonical.

GitHub Actions invoke Pactwright.

GitHub views are derived and may be regenerated.

Workflow YAML MUST remain thin.

Ownership remains:

```text
Delivery semantics
    → Delivery runtime

Project Intelligence semantics
    → Project Intelligence extension

Graph Review & Creative Delivery semantics
    → Review/Creative extension

Operations semantics
    → Operations extension

GitHub execution and projection
    → this specification
```

GitHub metadata owns none of those semantics.

External monitoring, analytics, support and publication platforms remain external evidence systems.

GitHub MUST NOT mirror their raw telemetry into Pactwright state.

### Provisioning vs projection

`pactwright github sync` owns Pactwright-managed remote structure and configuration, including:

- repository settings;
- labels;
- rulesets;
- required-check configuration;
- the shared Pactwright GitHub Project;
- Project fields;
- Project views.

GitHub Actions own runtime projection updates, including:

- checks;
- PR and Issue summaries;
- Project items;
- derived Project field values;
- generated operational summaries.

Actions MUST NOT independently redefine remote schema that `pactwright github sync` reconciles.

---

## 3. Extension Profile Composition

Enabled components contribute GitHub requirements through profiles.

Conceptually:

```text
Delivery profile
        +
Project Intelligence profile
        +
Review & Creative profile
        +
Operations profile
        +
repository overrides
        ↓
resolved GitHub desired state
```

Rules:

- Delivery remains independently usable.
- Project Intelligence contributes only when enabled.
- Review & Creative contributes only when enabled.
- Operations contributes only when enabled.
- `review-creative` depends on Project Intelligence.
- `operations` depends on Project Intelligence.
- Review & Creative and Operations do not depend on each other.
- identical requirements collapse;
- compatible requirements merge;
- incompatible requirements fail validation.

Enabling Review & Creative or Operations therefore activates the Project Intelligence profile as a dependency.

All profiles contribute to the same repository integration and, when enabled, the same shared GitHub Project.

An extension MUST NOT create an independent Project merely to isolate its views.

---

## 4. Workflow Surface

The initial Pactwright-managed workflow surface is:

```text
.github/
  workflows/
    pactwright.yml
    pactwright-intelligence.yml
    pactwright-review-creative.yml
    pactwright-operations.yml
```

Responsibilities:

```text
pactwright.yml
    → Delivery Graph and lifecycle

pactwright-intelligence.yml
    → Project Intelligence

pactwright-review-creative.yml
    → Graph Review & Creative Delivery

pactwright-operations.yml
    → Operations Graph
```

Extension workflows are generated only when their extension is enabled.

Scheduled triggers may live in the owning extension workflow instead of creating one workflow per scheduled responsibility.

Generated trigger paths may incorporate requirements contributed by enabled extensions.

For example, when Review & Creative and Operations are both enabled, registered "Publication" exposure changes may contribute Review & Creative publication paths to the Operations workflow.

These are Pactwright-managed files.

Unrelated user-authored workflows remain outside Pactwright ownership.

Every Pactwright workflow:

1. installs the locked Pactwright version;
2. loads project configuration and lock state;
3. loads enabled extensions and the selected agent pack;
4. invokes Pactwright runtime commands;
5. publishes checks, summaries and derived projections.

There MUST NOT be separate CI agents and interactive agents implementing different semantics.

Interactive and GitHub execution use the same locked capability implementations.

---

## 5. Delivery GitHub Actions

### Pull request changes

On meaningful Delivery changes run:

```text
pactwright validate
```

and determine whether the delivered work still matches its Delivery lineage.

Where configured, automatically run the Review stage.

This should catch:

- Contract violations;
- scope creep;
- missing required verification;
- unnecessary complexity;
- graph inconsistencies.

### Graph or configuration changes

Validate when:

```text
specs/**
.pactwright/**
```

change.

`specs/graph/edges.yml` is shared Project Graph storage.

When the shared edge store changes, Pactwright determines validation responsibilities from changed edge types and endpoints rather than path ownership alone.

Core Delivery edges are validated by Delivery semantics.

Extension-owned edges are validated by their owning extension.

Cross-graph edges may require multiple validators.

Extension-owned node paths remain validated by their owning extension workflow.

### Lifecycle continuation

When an automatic Delivery stage completes, GitHub Actions may continue:

```text
pactwright lifecycle run
```

until:

- a human gate is reached;
- a stage fails;
- validation fails;
- the lifecycle completes.

### Human approval

When a human-gated Delivery stage is reached, automation stops.

After the required Decision is recorded through normal Pactwright semantics, automation may resume.

Automation MUST NOT infer Delivery approval from GitHub metadata alone.

---

## 6. Project Intelligence GitHub Actions

Project Intelligence has its own automation surface.

It is inactive when the extension is disabled.

Initial responsibilities are:

1. Source capture validation;
2. promotion validation;
3. coverage and onboarding regeneration;
4. intent roadmap regeneration;
5. propagation;
6. freshness.

### Source capture validation

When Source material or Source metadata changes:

```text
docs/project-intelligence/sources/**
```

run the Project Intelligence capture path.

It validates:

- Source schema;
- canonical identity;
- content hash;
- version links;
- domain;
- origin;
- trust value;
- secret scan for snapshots;
- triage output.

Internal Sources created from Graph Review or Operations follow the same validation path.

Duplicate or irrelevant material may stop without further processing.

Class 0/1 changes may proceed only within the automatic mutation boundary defined by the Project Intelligence specification.

### Promotion validation

When a promotion proposes changes to:

```text
docs/project-intelligence/domains/**
docs/project-intelligence/knowledge/**
```

or Intelligence-owned graph edges, run:

```text
pactwright intelligence validate
```

The workflow verifies:

- proposed Knowledge Card changes;
- domain ownership;
- typed edges;
- class 2/3 approval requirements;
- affected Delivery records;
- affected extension-owned records;
- required owner review.

Reviewer identities are resolved through Pactwright repository configuration.

Promotion validation MUST NOT directly mutate Delivery-owned or sibling-extension-owned records.

Delivery changes proposed by promotion follow normal Delivery semantics.

### Coverage and onboarding

After relevant accepted knowledge changes run:

```text
pactwright intelligence onboard
```

and regenerate:

```text
docs/project-intelligence/reports/domain-map.md
docs/project-intelligence/reports/onboarding.md
```

### Intent roadmap

After relevant Intelligence, Delivery or accepted extension-originated changes run:

```text
pactwright intelligence derive-intent-roadmap
```

and regenerate:

```text
docs/project-intelligence/reports/intent-roadmap.md
```

The roadmap remains derived.

GitHub automation MUST NOT turn roadmap candidates into Delivery Intents automatically.

Extension-specific roadmap views MUST derive from this candidate model rather than create independent candidate sets.

### Propagation

After an accepted challenge, supersession or retraction run:

```text
pactwright intelligence propagate <knowledge-id>
```

Propagation surfaces affected records and proposals.

It never silently edits dependent canonical records.

### Freshness

On the configured schedule run:

```text
pactwright intelligence refresh
```

and regenerate:

```text
docs/project-intelligence/reports/freshness.md
```

Staleness is surfaced without silently rewriting canonical meaning.

---

## 7. Graph Review & Creative Delivery GitHub Actions

Graph Review & Creative Delivery has its own automation surface.

It is inactive when the extension is disabled.

Initial responsibilities are:

1. extension validation;
2. Review Definition execution;
3. review-finding hand-off to Project Intelligence;
4. next-actions regeneration;
5. creative grounding validation;
6. Asset and Publication validation;
7. generation configuration and evaluation triggers.

### Extension validation

When Review & Creative canonical state, configuration, repository-backed Asset content or shared edges change, run:

```text
pactwright creative validate
```

Relevant paths include:

```text
reviews/definitions/**
assets/**
docs/review-creative/assets/**
docs/review-creative/publications/**
.pactwright/review-creative/**
```

Execution records may also be schema-validated when they change:

```text
.pactwright/executions/reviews/**
.pactwright/executions/generations/**
```

Validation distinguishes canonical graph state from execution provenance.

Changes to `assets/**` MUST validate affected Asset records so repository-backed content cannot diverge from its approved `content_hash`.

### Review execution

Review Definitions may run:

- manually;
- on their configured schedule;
- on configured repository or Project Graph events.

The workflow invokes:

```text
pactwright review run <review-id>
```

Each run pins the deterministic Project Graph revision supplied by the Pactwright runtime and creates a Review Execution record.

The workflow surfaces:

- reviewer;
- Project Graph revision;
- scope;
- execution status;
- findings by severity;
- resulting internal Sources.

### Finding hand-off

Review findings MUST enter Project Intelligence through normal Source ingestion.

A headless review may create or update a Pactwright-managed branch or pull request containing the resulting internal Sources.

It MUST NOT directly:

- change Knowledge Cards;
- create Delivery Intents;
- reorder the roadmap;
- amend Contracts or Briefs.

Project Intelligence triage and promotion remain authoritative.

### Next actions

After relevant Project Graph, review or progression changes run:

```text
pactwright review next-actions
```

and regenerate:

```text
docs/review-creative/reports/next-actions.md
```

The report remains a derived recommendation view.

It does not replace Project Intelligence onboarding, the intent roadmap or Delivery lifecycle state.

### Creative grounding

When a Delivery lineage uses the creative-delivery capability, GitHub validates extension-specific grounding around the normal Delivery lifecycle.

It checks:

- grounding manifest exists when required;
- referenced Project Graph records and hashes are valid;
- challenged, superseded or retracted grounding is surfaced;
- required identity/voice knowledge is present for applicable outbound work.

Creative grounding does not become a new Delivery lifecycle stage.

### Asset validation

When an approved Asset record or repository-backed Asset content changes:

```text
docs/review-creative/assets/**
assets/**
```

the workflow validates:

- referenced Delivery Evidence exists;
- the output content hash matches;
- required grounding is valid;
- human Asset approval is recorded;
- Generation Record references are valid when present;
- supersession rules are respected.

GitHub approval metadata alone is not sufficient to create an Asset.

The explicit Pactwright Asset approval record remains authoritative.

### Publication validation

When Publication state changes:

```text
docs/review-creative/publications/**
```

the workflow validates:

- the referenced Asset is approved;
- the Publication asset hash matches the approved Asset;
- the channel configuration is valid;
- a superseded Asset is not accidentally published as current work unless explicitly intended.

Scheduled publication may invoke Pactwright for an already approved Asset when a configured channel integration exists.

Scheduling MUST NOT bypass Asset approval.

When Operations is enabled, a valid Publication may also become an operational exposure.

Operations does not change Publication ownership or approval semantics.

### Generation configuration and evaluation

When provider, task-catalog or generation-guidance configuration changes:

```text
.pactwright/review-creative/providers/**
.pactwright/review-creative/tasks/**
.pactwright/review-creative/generation-guidance/**
```

the workflow validates configuration and may run relevant Pactwright evaluation cases.

Generation-guidance evaluation uses normal:

```text
pactwright eval
```

semantics.

GitHub does not introduce a separate guidance-promotion lifecycle.

---

## 8. Operations GitHub Actions

Operations has its own automation surface.

It is inactive when the extension is disabled.

Initial responsibilities are:

1. Deployment recording and validation;
2. operational source configuration validation;
3. scheduled source refresh;
4. Observation validation;
5. Observation hand-off to Project Intelligence;
6. corrective-roadmap regeneration;
7. Operations projection updates.

### Operations validation

When Operations canonical state, configuration or shared edges change, run:

```text
pactwright operations validate
```

Relevant paths include:

```text
docs/operations/deployments/**
docs/operations/observations/**
.pactwright/operations/**
```

Operational execution provenance may be schema-validated separately when:

```text
.pactwright/executions/operations/**
```

changes.

Generated reports are validated as derived state rather than canonical Operations truth.

### Deployment recording

A Deployment may be recorded after delivered software becomes active in a configured environment.

The exact trigger may be:

- a repository deployment event;
- completion of a configured deployment workflow;
- manual dispatch;
- another configured integration.

The workflow invokes:

```text
pactwright operations record-deployment <evidence-id>
```

and records the exact production exposure through normal Operations semantics.

GitHub metadata alone MUST NOT be treated as the canonical Deployment record.

Deployment recording MUST preserve traceability to:

- Delivery Evidence;
- deployed artifact/revision;
- environment;
- deployment time;
- responsible human or automation.

Deployment is post-Delivery extension state.

It MUST NOT become another Delivery lifecycle stage.

### Operational source configuration

When:

```text
.pactwright/operations/sources/**
.pactwright/operations/environments/**
```

change, the workflow validates source and environment configuration.

Credentials remain GitHub Actions secrets or external secret-manager state.

They MUST NOT be committed to canonical Operations configuration.

### Scheduled refresh

On configured schedules run:

```text
pactwright operations refresh
```

The command may:

1. collect bounded evidence from configured sources;
2. create operational execution provenance;
3. analyse evidence;
4. create or supersede Observations when durable findings exist;
5. hand relevant Observations to Project Intelligence as internal Sources.

A successful refresh may produce no Observation.

GitHub MUST NOT treat absence of a new Observation as a failure.

Raw logs, traces, metric samples, analytics events and support payloads MUST NOT be written into the Project Graph merely because the workflow retrieved them.

### Observation validation

When:

```text
docs/operations/observations/**
```

change, validate:

- operational exposure exists;
- evidence window exists;
- evidence references are valid;
- direction, significance and confidence are valid;
- unsupported causal claims are not represented as validated structure;
- `observes` relationships use registered exposure types;
- supersession is valid.

The workflow does not decide whether the Observation becomes accepted project knowledge.

### Observation hand-off

A valid meaningful Observation enters Project Intelligence through normal internal Source ingestion.

Conceptually:

```text
Observation
    ↓
internal Source
    ↓
Project Intelligence triage
```

The Operations workflow MUST NOT directly:

- create or edit Knowledge Cards;
- create canonical Delivery Intents;
- change Project Intelligence consequence class;
- reorder the global intent roadmap.

If Source creation requires repository mutation, automation may use a Pactwright-managed branch or pull request according to repository policy.

### Registered production exposures

Operations resolves compatible exposure types from enabled extension semantics.

Initially:

```text
Operations:
  Deployment

Review & Creative:
  Publication
```

When both Review & Creative and Operations are enabled, Publication changes may trigger Operations validation or projection updates because "Publication" is a registered operational exposure.

The workflow MUST NOT duplicate Publication into an Operations-owned node.

Future extension-contributed exposure types use the same runtime registration model rather than requiring new Operations workflow semantics.

### Corrective roadmap

After relevant accepted Project Intelligence changes originating from operational evidence run:

```text
pactwright operations corrective-roadmap
```

and regenerate:

```text
docs/operations/reports/corrective-intent-roadmap.md
```

This report is a filtered Operations view over Project Intelligence intent candidates.

GitHub automation MUST NOT:

- create a second candidate model;
- assign an independent Operations priority;
- turn a candidate into a Delivery Intent.

### Projection updates

After relevant Deployment, Observation or corrective-roadmap changes, Actions may update Operations fields and items in the shared GitHub Project.

Projection data remains derived.

---

## 9. Project Graph Revision

Pactwright runtime derives one deterministic Project Graph revision from canonical registered Project Graph state.

GitHub consumes that revision for generated reports, Review Executions and operational projections.

GitHub MUST NOT define or derive an independent revision scheme.

Generated reports and GitHub projections MUST NOT identify canonical input state by the Git commit containing the generated report.

The runtime revision excludes generated reports and operational execution provenance according to core Project Graph semantics.

It includes canonical extension-owned records such as:

- Assets;
- Publications;
- Deployments;
- Observations.

Conceptually:

```text
canonical Project Graph state
        ↓
Pactwright runtime revision
        ↓
reviews + reports + GitHub projections
```

The same canonical Project Graph state MUST produce the same revision.

Generated reports record this revision.

Relevant view checks compare recorded revisions with the current runtime-supplied Project Graph revision.

---

## 10. Failure Behaviour

Automation fails closed where canonical validity or required lifecycle gates are affected.

### Delivery

If a Delivery lifecycle stage fails:

1. stop;
2. surface the failure;
3. do not continue to the next stage.

Example:

```text
delivery
   ↓
review
   ↓
blocking findings
   ↓
BLOCKED
```

### Project Intelligence

If Intelligence processing fails:

- deterministic validation failures stop immediately;
- failed promotion does not remove accepted Source capture;
- failed propagation does not mutate dependants;
- failed report generation does not mutate canonical state;
- failed ingestion is surfaced;
- reruns use current Project Graph state unless explicitly pinned.

### Review & Creative

If Review & Creative processing fails:

- failed review execution records the failure but creates no promoted truth;
- failed finding hand-off does not mutate Knowledge or Delivery state;
- failed next-actions generation does not mutate canonical state;
- failed creative grounding or Review blocks successful Evidence according to Delivery policy;
- failed Asset validation prevents Asset acceptance;
- failed publication leaves the approved Asset unchanged;
- failed generation or provider calls remain execution records and do not become Assets.

### Operations

If Operations processing fails:

- failed Deployment recording does not mutate Delivery Evidence;
- failed source collection does not mutate canonical Operations state;
- failed source authentication is surfaced without invalidating existing Observations;
- failed analysis creates no Observation;
- insufficient evidence creates no Observation and is not an error;
- failed Observation validation prevents canonical acceptance;
- failed Project Intelligence hand-off leaves the Observation valid and retryable;
- failed corrective-roadmap generation does not mutate canonical Project Graph state;
- raw telemetry retrieved before failure remains outside canonical Project Graph state.

Automatic repair loops are not required initially.

---

## 11. Pull Request Model

A meaningful repository-backed Delivery change normally uses one branch and one pull request.

The branch may accumulate:

```text
Intent
Decision + Contract
Brief
delivered repository changes or output references
Evidence
```

There is no requirement for one pull request per lifecycle stage.

A Project Intelligence promotion may use its own pull request because promotion is a knowledge-governance boundary.

A headless Graph Review may use a separate Pactwright-managed pull request to introduce its findings as internal Sources.

Creative Delivery may use the normal Delivery pull request even when the resulting output is stored externally; the PR can carry the Delivery lineage, Evidence and eventual Asset record.

Operations automation may use a managed branch or pull request when repository policy requires review before accepting:

- Deployment records;
- Observations;
- internal Sources resulting from Observations.

Routine external telemetry is never copied into such a pull request.

Asset approval, Publication, Deployment and Observation do not add new core Delivery stages.

GitHub remains a collaboration and merge surface.

The Project Graph remains canonical.

---

## 12. Delivery Pull Request View

A Pactwright-managed Delivery PR exposes a concise lifecycle summary.

Example:

```text
Pactwright

Intent       ✓
Contract     ✓
Brief        ✓
Delivery     ✓
Review       ✗ 2 findings
Evidence     blocked

Current stage: Review
```

The summary links to relevant graph nodes rather than copying their contents.

The PR view is a projection.

It does not own lifecycle state.

---

## 13. Delivery Pull Request Intelligence Integration

When Project Intelligence is enabled, the Delivery PR view may expose relevant grounding.

Example:

```text
Project Intelligence

Domain          product
Grounding       ✓ accepted
Freshness       ⚠ 1 stale card
Challenges      ✓ none
Knowledge       6 relevant cards
```

The exact values derive from the context assembled for the Delivery lineage.

The section links to:

- motivating Knowledge Cards;
- relevant Domain Definitions;
- stale or challenged cards;
- onboarding gaps when they block grounding.

It MUST NOT copy full Knowledge Card contents.

### Grounding state

The runtime derives:

- `grounded`;
- `attention`;
- `blocked`;
- `not-applicable`.

Stale knowledge does not automatically block Delivery.

Blocking behaviour follows Project Intelligence and lifecycle policy.

---

## 14. Delivery Pull Request Review & Creative Integration

When `review-creative` is enabled and relevant to the Delivery lineage, the PR may add:

```text
Graph Review & Creative Delivery

Delivery type    creative
Modality         image
Grounding        ✓ valid
Verification     ✓ passed
Generation       3 calls
Asset            awaiting approval
Publication      —
```

The section may link to:

- grounding records;
- Generation Records;
- verification Evidence;
- approved Asset;
- Publication when one exists.

It MUST NOT copy prompts, full generation logs or binary asset content into the PR summary.

For non-creative Delivery work, Graph Review results may still appear as linked findings when they materially affect the active lineage.

The section is a projection.

It cannot approve an Asset or Publication.

---

## 15. Delivery Pull Request Operations Integration

When Operations is enabled, a Delivery PR may expose relevant historical production context before new work is merged.

Example:

```text
Operations

Previous deployment   production · current
Active findings       2 material
Prior regression      checkout latency
Corrective origin     observation-checkout-latency-...
```

This section is optional and context-driven.

It may link to:

- relevant prior Deployments;
- active or superseded Observations;
- accepted Knowledge derived from production evidence;
- corrective intent provenance.

It MUST NOT preload or display raw telemetry.

A PR is not considered deployed merely because Delivery completes or merges.

Post-merge Deployment state remains owned by Operations.

---

## 16. Delivery Checks

Core Delivery checks are:

```text
Pactwright / Graph
Pactwright / Lifecycle
Pactwright / Review
```

### Graph

Passes when Delivery Graph structure is valid.

For shared-edge changes it validates Delivery-owned semantics and coordinates with enabled extension validators.

### Lifecycle

Passes when the PR is at a valid Delivery lifecycle state and required gates are satisfied.

### Review

Passes when the configured Review stage has no blocking findings.

The Review implementation may be software-specific, creative-specific or supplied by another capability without changing this check's core meaning.

### Optional extension grounding

When Project Intelligence is enabled:

```text
Pactwright / Intelligence Grounding
```

may expose Delivery grounding.

When Review & Creative is enabled for creative Delivery:

```text
Pactwright / Creative Grounding
```

may expose creative-specific grounding validity.

Operations findings do not create a new mandatory Delivery lifecycle check.

A repository may configure production-related policy for future Delivery, but operational state remains extension context rather than a core lifecycle stage.

---

## 17. Intent Issue View

An Intent may have a corresponding GitHub Issue.

The Issue remains a navigation and collaboration surface.

Core fields may show:

- title;
- current lifecycle stage;
- current Contract;
- current Brief;
- linked pull request;
- blocking state.

Project Intelligence may additionally contribute:

- motivating domain;
- motivating Knowledge Cards;
- intelligence grounding;
- missing knowledge dependencies;
- onboarding guidance;
- launch tranche.

Review & Creative may additionally contribute when relevant:

- delivery type or modality;
- linked review findings;
- creative grounding;
- approved Asset;
- Publication.

Operations may additionally contribute when the Intent was motivated by production evidence:

- corrective origin;
- motivating Observation;
- affected Deployment or Publication;
- operational significance;
- whether the originating finding is still active.

The Issue does not own these values.

They are generated from Pactwright state.

---

## 18. Shared GitHub Project

When GitHub Projects are enabled, Pactwright uses one shared GitHub Project per repository by default.

It projects the whole Pactwright Project Graph and relevant operational state.

Enabled profiles contribute independent views to the same Project.

Conceptually:

```text
Pactwright Project

Core:
  Delivery
  Blocked

Project Intelligence:
  Intelligence
  Promotions
  Coverage
  Roadmap
  Freshness
  Propagation

Review & Creative:
  Reviews
  Assets
  Publications
  Next Actions

Operations:
  Operations
  Deployments
  Production Findings
  Corrective Roadmap
```

Only configured views are provisioned.

Canonical Knowledge Cards, Assets, Publications, Deployments and Observations remain repository Project Graph state.

Review Executions, Generation Records and Operations execution records remain operational provenance even when projected.

`pactwright github sync` owns Project creation, fields and view definitions.

GitHub Actions update items and derived field values.

---

## 19. Delivery GitHub Project View

Useful Delivery fields include:

- lifecycle stage;
- blocked;
- Contract;
- Brief;
- pull request;
- last activity.

Project Intelligence may add:

- domain;
- intelligence grounding;
- knowledge blocker;
- launch tranche.

Review & Creative may add, when useful:

- delivery type;
- modality;
- creative grounding;
- approved Asset.

Operations may add derived fields such as:

- latest Deployment;
- production environment;
- active production findings;
- corrective origin.

Fields are projections and may be regenerated.

---

## 20. Project Intelligence Promotion PR View

Project Intelligence promotions retain their own PR summary.

Example:

```text
Pactwright Project Intelligence

Source           src-market-study-a31f
Domain           discovery
Triage           class 3 · contradictory
Knowledge        2 changed · 1 new
Delivery impact  2 Intents · 1 Contract
Propagation      required
Review           discovery owner + delivery owner
```

For an Operations-originated Source the summary may additionally expose:

```text
Origin           operations
Observation      observation-checkout-errors-a819
Exposure         deployment-checkout-api-a31f
```

The view distinguishes Intelligence mutations in the PR from Delivery or extension changes merely proposed for normal handling.

The promotion PR remains a governance surface, not a canonical proposal node.

---

## 21. Project Intelligence Checks and Views

When Project Intelligence is enabled:

```text
Pactwright / Intelligence
Pactwright / Intelligence Promotion
Pactwright / Intelligence Views
```

remain available.

### Intelligence

Validates:

- Sources;
- Domain registry;
- Knowledge Cards;
- Intelligence edges;
- cross-graph ownership;
- extension-origin provenance when present.

### Intelligence Promotion

Validates:

- required reviews;
- canonical meaning authorisation;
- automatic-boundary compliance;
- proposed cross-graph effects.

### Intelligence Views

Checks that committed derived reports match the current Project Graph revision supplied by Pactwright runtime.

It covers:

- domain map;
- onboarding;
- intent roadmap;
- freshness.

A mismatch means the view is stale, not that canonical Project Graph state is invalid.

### Coverage

The Coverage view projects `domain-map.md` and onboarding state.

### Roadmap

The Roadmap view projects the single Project Intelligence candidate model.

Candidates may expose origin such as:

```text
project-intelligence
review-creative
operations
```

Origin does not create separate roadmap semantics.

### Freshness

The Freshness view projects current/stale/challenged knowledge state.

### Propagation

The Propagation view shows downstream impact before dependent canonical records change.

---

## 22. Graph Review Checks and Views

When Review & Creative is enabled, Graph Review exposes:

```text
Pactwright / Review Creative
```

for extension-owned structural and execution validation.

The check may cover:

- Review Definition validity;
- Review Execution provenance;
- Generation Record validity;
- Asset and Publication schema;
- repository-backed Asset content hashes;
- extension-owned shared-edge validity;
- provider/task/guidance configuration.

A failed review execution is not automatically a graph-validation failure.

The check distinguishes execution failure from invalid extension state.

### Review summary

A completed review may expose:

```text
Pactwright Graph Review

Reviewer        architecture-reviewer
Graph revision  <revision>
Status          succeeded
Critical        0
Material        2
Advisory        3
Source hand-off 5 findings
```

The summary links to:

- Review Execution;
- relevant graph scope;
- resulting internal Sources;
- promotion PRs when they later exist.

### Reviews view

The shared Project may expose a "Reviews" view containing recent or active review work.

Useful derived fields include:

- reviewer;
- graph revision;
- execution status;
- highest finding severity;
- finding count;
- resulting Source or PR;
- last run.

Review Execution state remains operational provenance, not Project Graph truth.

### Next Actions view

The shared Project may expose "Next Actions" from:

```text
docs/review-creative/reports/next-actions.md
```

Suggestions remain derived recommendations.

Editing the GitHub view MUST NOT create canonical work.

---

## 23. Creative Checks and Views

### Creative Grounding

When configured:

```text
Pactwright / Creative Grounding
```

passes when creative Delivery has the grounding required by the active Brief and extension policy.

It surfaces:

- missing grounding;
- invalid graph hashes;
- challenged or retracted grounding;
- missing identity/voice context;
- grounding that requires re-verification.

### Asset and Publication validation

Publication changes may expose:

```text
Pactwright / Publication
```

It passes when:

- the Asset is approved;
- the Asset hash matches;
- publication configuration is valid;
- scheduled publication cannot bypass approval.

Asset structural validity and repository-backed content-hash validity remain part of `Pactwright / Review Creative`.

### Assets view

The shared Project may expose approved Assets with fields such as:

- title;
- media type;
- Delivery lineage;
- grounding state;
- approved by;
- current/superseded;
- Publication count.

Candidate generation outputs do not appear as Assets.

### Publications view

The shared Project may expose Publications with fields such as:

- Asset;
- channel;
- published at;
- locator;
- publication status.

When Operations is enabled, the view may additionally show whether the Publication has linked operational Observations.

The view projects Publication records.

It does not own publication or operational state.

---

## 24. Operations Checks and Views

When Operations is enabled:

```text
Pactwright / Operations
Pactwright / Operations Views
```

are available.

### Operations

Validates:

- Deployment schema and Evidence references;
- deployed artifact and environment identity;
- Observation schema;
- evidence windows and evidence references;
- registered operational exposure relationships;
- `deployed-as` and `observes` edges;
- supersession;
- source/environment configuration;
- Operations execution provenance where applicable.

A failed source collection or analysis execution is not automatically canonical graph invalidity.

The check distinguishes:

```text
external/execution failure
```

from:

```text
invalid Operations graph state
```

### Operations Views

Checks that:

```text
docs/operations/reports/corrective-intent-roadmap.md
```

matches the current applicable Project Intelligence candidate derivation and current Project Graph revision.

A stale report is a derived-view failure, not invalid canonical Operations truth.

### Operations summary

A completed refresh may expose:

```text
Pactwright Operations

Window            last 1h
Sources           4
Deployments       1 relevant
Observations      2 new · 1 matched
Critical          0
Material          1
Source hand-off   2
```

The summary MUST NOT dump raw source payloads.

### Deployments view

The shared Project may expose Deployments with fields such as:

- environment;
- Delivery Evidence;
- artifact revision;
- deployed at;
- deployed by;
- active Observation count;
- current/superseded.

Deployment remains canonical Operations state, not GitHub deployment metadata.

### Production Findings view

The shared Project may expose current Observations.

Useful fields include:

- title;
- exposure;
- exposure type;
- direction;
- significance;
- confidence;
- evidence window;
- current derived state;
- resulting internal Source;
- resulting Knowledge or promotion PR when available.

The view should focus on durable Observations rather than individual alerts or telemetry events.

### Operations view

A combined "Operations" view may provide the current production picture across Deployments, Publications and active Observations.

It remains a projection over registered operational exposures and findings.

### Corrective Roadmap view

The shared Project may expose:

```text
docs/operations/reports/corrective-intent-roadmap.md
```

The view contains Project Intelligence candidates whose accepted motivation traces to Operations.

It MUST NOT:

- create candidates;
- independently reorder the global roadmap;
- create canonical Intents.

Editing the GitHub view does not change Project Intelligence priority or Delivery state.

---

## 25. Configuration

GitHub integration is configured in repository configuration.

Example:

```yaml
github:
  pull_request:
    lifecycle_summary: true

  checks:
    graph: true
    lifecycle: true
    review: true

  issues:
    intents: true

  project:
    enabled: false

  project_intelligence:
    delivery_grounding: true

    checks:
      intelligence: true
      promotion: true
      views: true
      grounding: true

    views:
      coverage: true
      roadmap: true
      freshness: true
      propagation: true

  review_creative:
    pull_request:
      creative_summary: true

    checks:
      extension: true
      grounding: true
      publication: true

    reviews:
      summaries: true
      scheduled: true

    views:
      reviews: true
      assets: true
      publications: true
      next_actions: true

    publication:
      scheduled: false

  operations:
    pull_request:
      context_summary: true

    checks:
      operations: true
      views: true

    refresh:
      scheduled: true

    views:
      operations: true
      deployments: true
      production_findings: true
      corrective_roadmap: true
```

There is one shared:

```text
github.project.enabled
```

switch.

Rules:

- `project_intelligence` is ignored when Project Intelligence is disabled.
- `review_creative` is ignored when Review & Creative is disabled.
- `operations` is ignored when Operations is disabled.
- Review & Creative and Operations each require Project Intelligence through extension dependency resolution.
- Project-backed views require `github.project.enabled: true`.
- extension checks and PR summaries may operate without GitHub Projects.
- enabling an extension does not force every optional view or scheduled action on.
- scheduled publication applies only to already approved Assets and configured channel integrations.
- scheduled Operations refresh uses only configured external sources and never requires raw telemetry to be stored in Git.

---

## 26. Continuous Delivery and Feedback Cycle

Core Delivery remains:

```text
capture Intent
      ↓
propose Contracts
      ↓
Decision
      ↓
canonical Contract
      ↓
write Brief
      ↓
Delivery
      ↓
Review
      ↓
Evidence
```

Project Intelligence may inform it through:

```text
Sources
   ↓
triage
   ↓
Knowledge
   ↓
grounding / delivery proposal
   ↓
normal Delivery lifecycle
```

Graph Review feeds Project Intelligence:

```text
Project Graph
   ↓
specialist review
   ↓
finding
   ↓
internal Source
   ↓
Project Intelligence triage
```

Creative Delivery extends normal Delivery after Evidence:

```text
normal Delivery lifecycle
        ↓
      Evidence
        ↓
human Asset approval
        ↓
       Asset
        ↓
   Publication
```

Operations closes the production feedback loop:

```text
Software:
Evidence
   ↓
Deployment
   ↓
Observation

Creative:
Publication
   ↓
Observation
```

and then:

```text
Observation
    ↓
internal Source
    ↓
Project Intelligence
    ↓
Knowledge / corrective intent candidate
    ↓
normal Delivery lifecycle
```

The Project Intelligence intent roadmap remains the single candidate derivation model.

Operations may project an Operations-filtered corrective roadmap from it.

GitHub Actions execute each responsibility through its owning Pactwright runtime.

GitHub views show how the systems connect.

---

## 27. Definition of Done

The GitHub integration is working when:

### Delivery

- lifecycle stages execute through GitHub Actions;
- workflow YAML delegates lifecycle decisions to Pactwright;
- Delivery changes trigger graph/lifecycle validation;
- shared-edge changes are validated by semantic ownership;
- configured Review can run automatically;
- human gates stop automation;
- lifecycle failures block progression;
- PR checks expose graph, lifecycle and Review state;
- Issues and Projects remain derived views;
- interactive and CI execution use the same locked capabilities.

### Project Intelligence

When enabled:

- Source capture validation runs independently from Delivery lifecycle automation;
- internal Sources from Review & Creative or Operations use the same ingestion path;
- class 2/3 promotions receive dedicated validation and review;
- coverage/onboarding, roadmap, freshness and propagation projections regenerate;
- generated reports identify the deterministic Project Graph revision supplied by Pactwright runtime;
- Delivery PRs may expose intelligence grounding;
- roadmap candidates remain distinct from Delivery Intents;
- Operations-origin candidates remain part of the same Project Intelligence candidate model;
- no Intelligence GitHub view becomes canonical state.

### Graph Review & Creative Delivery

When enabled:

- one Pactwright-managed extension workflow executes Review & Creative automation;
- Review Definitions can run manually, on schedules or configured events;
- each review pins a Project Graph revision supplied by Pactwright runtime;
- review findings are handed to Project Intelligence as internal Sources;
- GitHub automation cannot promote review findings directly into Knowledge or Delivery truth;
- `next-actions` remains a derived recommendation view;
- creative Delivery continues through the normal Delivery lifecycle;
- creative PRs may expose grounding, verification and Asset status;
- creative grounding can be checked independently from core Delivery validation;
- GitHub approval metadata alone cannot create an Asset;
- approved Assets and Publications validate against exact content hashes;
- changes to repository-backed Asset content trigger validation against the approved Asset hash;
- candidate generation outputs do not appear as canonical Assets;
- Reviews, Assets, Publications and Next Actions may appear as independent views in the shared Project;
- scheduled publication cannot bypass Asset approval;
- Generation Records and Review Executions remain operational provenance rather than canonical Project Graph nodes;
- Publications may become registered Operations exposures without changing Review & Creative ownership.

### Operations

When enabled:

- one Pactwright-managed `pactwright-operations.yml` workflow executes Operations automation;
- valid Delivery Evidence can be linked to a canonical Deployment without adding a Delivery lifecycle stage;
- GitHub deployment metadata alone cannot become canonical Deployment truth;
- configured operational sources can refresh on schedule;
- raw telemetry remains outside the Project Graph and GitHub views;
- operational execution records remain provenance rather than Project Graph nodes;
- a successful refresh may legitimately create no Observation;
- durable production findings can create or supersede Observations;
- Observations validate against evidence and registered operational exposures;
- Operations distinguishes execution failure from invalid canonical graph state;
- valid Observations are handed to Project Intelligence as internal Sources;
- GitHub automation cannot turn an Observation directly into Knowledge or a Delivery Intent;
- Review & Creative Publications can be observed when both extensions are enabled without introducing a dependency between them;
- Operations, Deployments, Production Findings and Corrective Roadmap may appear as independent views in the shared Project;
- the Corrective Roadmap view filters the Project Intelligence candidate model rather than introducing another roadmap engine;
- `Pactwright / Operations Views` detects stale corrective-roadmap projections without invalidating canonical Operations state.

### Shared boundary

- this specification remains authoritative for exact Pactwright workflows, checks, fields, views and projection semantics;
- Project Graph revision derivation remains owned by Pactwright runtime rather than GitHub;
- `pactwright github sync` owns remote structure/configuration;
- GitHub Actions own runtime projection updates;
- extension profiles compose into one GitHub integration;
- one shared GitHub Project is used per repository by default when Projects are enabled;
- GitHub state can be regenerated from Pactwright canonical state and execution provenance;
- GitHub metadata never becomes canonical Delivery, Intelligence, Asset, Publication, Deployment or Observation state;
- external operational systems remain evidence sources rather than being mirrored into GitHub;
- disabling an extension removes only its owned integration and leaves remaining profiles valid.

---

## 28. Future Improvements

Review only after the corresponding operating models have been exercised.

### Automated Repair

Add bounded Review/repair loops only when evaluation shows reliable improvement.

### Production Gates

Allow Operations-derived state to influence future Delivery merge or release policy only when real usage demonstrates that informational context is insufficient.

Do not turn Deployment or Observation into core Delivery stages.

### Intelligence Review Queues

Add queue, SLA or workload management only when promotion volume requires it.

### Review Notifications

Add richer reviewer routing or escalation only when summaries and existing GitHub review surfaces are insufficient.

### Creative Previews

Add richer Asset preview surfaces only when normal PR links and repository previews are inadequate.

### Publication Integrations

Add broader channel-specific publication automation only after approved-Asset publication is reliable.

### Operations Notifications

Add alert routing or escalation only when existing external monitoring systems and GitHub summaries are insufficient.

GitHub should not become an alert-management platform by default.

### Operations Dashboards

Add richer production dashboards only when derived Deployment and Observation views no longer provide enough operational context.

Raw monitoring dashboards should remain in their specialised external systems.

### Richer Portfolio Views

Add fields or views only when existing Delivery, Intelligence, Review, Creative and Operations projections fail to expose information teams actually need.

### Cross-Repository Projections

Add organisation-level views only when projects require shared operational visibility.

---

Pactwright — GitHub Actions and Views v5
