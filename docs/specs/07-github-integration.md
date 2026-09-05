# Pactwright GitHub Integration

## 1. Purpose

GitHub is Pactwright's primary remote collaboration, automation and projection surface.

```text
Pactwright Project Graph + policy
              ↓
        Pactwright runtime
              ↓
        GitHub Actions
              ↓
          GitHub views
```

Pactwright remains the source of Project Graph truth.

This specification owns the **exact GitHub operating surface**: generated workflows, triggers, checks, PR/Issue summaries, Project fields/views, remote provisioning and runtime projection behaviour.

GitHub must not become a second graph, lifecycle store, Extension database, knowledge store, observability store or roadmap engine.

---

## 2. Operating Boundary

Semantic ownership remains:

```text
Delivery semantics
→ Pactwright Core

Project Intelligence semantics
→ Project Intelligence

Graph Review semantics
→ Graph Review

Asset / Publication semantics
→ Assets / Publication

Operations semantics
→ Operations

GitHub execution and projection
→ GitHub Integration
```

GitHub metadata alone must never create canonical:

```text
Intent
Decision
Contract
Brief
Evidence
Knowledge
Finding
Asset
Publication
Deployment
Observation
```

GitHub invokes Pactwright. Pactwright validates any canonical mutation.

---

# 3. Provisioning vs Projection

`pactwright github sync` owns Pactwright-managed remote desired state, including:

- repository settings where supported;
- labels;
- rulesets;
- required-check configuration;
- the shared Pactwright GitHub Project;
- Project fields;
- Project views.

GitHub Actions own runtime projections, including:

- checks;
- PR and Issue summaries;
- Project items;
- derived Project field values;
- generated summaries.

Actions must not independently redefine remote schema owned by `pactwright github sync`.

`pactwright github sync` should support dry-run before mutation and must converge when desired state is unchanged.

---

# 4. GitHub Profile Composition

Enabled components contribute GitHub requirements through profiles:

```text
Delivery profile
        +
Project Intelligence profile
        +
Graph Review profile
        +
Assets / Publication profile
        +
Operations profile
        +
repository overrides
        ↓
resolved GitHub desired state
```

Rules:

- only enabled components contribute;
- Extension dependencies resolve before profile composition;
- identical requirements collapse;
- compatible requirements merge;
- incompatible requirements fail validation;
- all profiles contribute to one repository integration;
- one shared GitHub Project is used per repository by default when Projects are enabled;
- an Extension must not create an independent Project merely to isolate its views.

---

# 5. Managed Workflow Surface

The initial Pactwright-managed workflow surface is:

```text
.github/workflows/
├── pactwright.yml
├── pactwright-intelligence.yml
├── pactwright-graph-review.yml
├── pactwright-assets-publication.yml
└── pactwright-operations.yml
```

Responsibilities:

```text
pactwright.yml
→ Delivery Graph and lifecycle

pactwright-intelligence.yml
→ Project Intelligence

pactwright-graph-review.yml
→ Graph Review

pactwright-assets-publication.yml
→ Asset / Publication validation and publication integration

pactwright-operations.yml
→ Operations
```

Extension workflows exist only while their Extension is enabled.

Scheduled responsibilities should share the owning Extension workflow rather than create one workflow per command.

Every Pactwright workflow:

1. installs the locked Pactwright runtime;
2. loads configuration and lock state;
3. loads enabled Extensions and the selected Agent Pack;
4. uses the same resolved Production Skills environment as interactive execution;
5. invokes Pactwright runtime commands;
6. publishes checks and derived projections.

Workflow YAML remains thin. Pactwright semantics must not be reimplemented in Actions.

---

# 6. Shared Execution Environment

Interactive and GitHub execution use the same resolved environment:

```text
same Pactwright runtime
same Extensions
same Agent Pack
same Production Skills
same Pactwright lock
```

There must not be separate CI agents and interactive agents implementing different semantic behaviour.

---

# 7. Core Delivery Automation

On meaningful Delivery changes, run:

```text
pactwright validate
```

and the relevant lifecycle validation.

Graph or configuration changes under:

```text
specs/**
.pactwright/**
```

must be routed to the validators owning the changed canonical records and relationships.

`specs/graph/edges.yml` is shared graph storage. Changes to it are routed by edge type and endpoints rather than path alone. Cross-graph relationships may require multiple validators.

Where automatic continuation is configured, GitHub may invoke:

```text
pactwright lifecycle run
```

until:

- a Gate requiring external authority is reached;
- Review blocks;
- validation fails;
- execution fails;
- lifecycle completes.

GitHub must not infer Pactwright authority merely from generic PR approval, labels, comments or merge state unless repository policy explicitly maps that event into the appropriate Pactwright authority operation.

GitHub consumes the **runtime-resolved lifecycle state**. It does not decide where lifecycle-shape identity is stored or persisted.

---

# 8. Core Delivery Checks

Core Delivery checks are:

```text
Pactwright / Graph
Pactwright / Lifecycle
Pactwright / Review
```

`Pactwright / Graph` validates graph structure and coordinates enabled Extension validators for shared relationships.

`Pactwright / Lifecycle` validates current lifecycle state, permitted transitions, Gates and required authority.

`Pactwright / Review` reflects whether applicable Delivery Review has blocking findings.

The implementation of Review may use different Agent Pack/Production Skills composition without changing the check's semantic meaning.

---

# 9. Delivery Pull Request Projection

A Pactwright Delivery PR exposes a concise lifecycle projection, for example:

```text
Pactwright

Intent       ✓
Contract     ✓
Brief        ✓
Delivery     ✓
Review       ✗
Evidence     blocked

Current step: Review
```

The summary links to canonical records instead of copying their full contents.

It may show the runtime-resolved lifecycle topology/state without making GitHub the owner of that topology.

---

# 10. Delivery Project Fields

The shared GitHub Project Delivery view supports derived fields including:

```text
lifecycle step/state
blocked
Contract
Brief
pull request
last activity
```

When Project Intelligence is enabled it may additionally project:

```text
domain
intelligence grounding
knowledge blocker
launch tranche
```

When Operations is enabled it may additionally project:

```text
latest Deployment
production environment
active production findings
corrective origin
```

Fields are derived and regenerable. Editing them does not silently mutate canonical Pactwright state.

---

# 11. Project Intelligence Source Capture Automation

When Project Intelligence is enabled, changes to:

```text
docs/project-intelligence/sources/**
```

run the Project Intelligence capture/validation path.

It validates at least:

- Source schema;
- canonical identity and content hash;
- version links;
- registered domain;
- origin and trust value;
- storage mode;
- secret scan before snapshots;
- triage output.

Internal Sources from Graph Review and Operations use the same path.

Duplicate or irrelevant material may stop cheaply. Class 0/1 mutations remain bounded by Project Intelligence automatic-mutation rules.

---

# 12. Project Intelligence Promotion Automation

Changes proposing canonical Intelligence mutations under:

```text
docs/project-intelligence/domains/**
docs/project-intelligence/knowledge/**
```

or Intelligence-owned shared relationships run:

```text
pactwright intelligence validate
```

Promotion validation checks:

- proposed Knowledge changes;
- Domain ownership;
- typed relationships;
- required human review/approval;
- automatic-boundary compliance;
- affected Delivery and sibling-Extension records;
- required logical owners resolved to GitHub reviewers through repository configuration.

Promotion validation must not mutate Delivery-owned or sibling-owned canonical records.

---

# 13. Project Intelligence Report Automation

After relevant accepted Knowledge changes run:

```text
pactwright intelligence onboard
```

and regenerate:

```text
docs/project-intelligence/reports/domain-map.md
docs/project-intelligence/reports/onboarding.md
```

After relevant Intelligence, Delivery or accepted Extension-originated changes run:

```text
pactwright intelligence derive-intent-roadmap
```

and regenerate:

```text
docs/project-intelligence/reports/intent-roadmap.md
```

After accepted challenge, supersession or retraction run:

```text
pactwright intelligence propagate <knowledge-id>
```

On configured freshness schedules run:

```text
pactwright intelligence refresh
```

and regenerate:

```text
docs/project-intelligence/reports/freshness.md
```

GitHub automation must never turn a roadmap candidate directly into an Intent or propagation proposal directly into sibling canonical mutation.

---

# 14. Project Intelligence Checks

When Project Intelligence is enabled, the exact check surface includes:

```text
Pactwright / Intelligence
Pactwright / Intelligence Promotion
Pactwright / Intelligence Views
Pactwright / Intelligence Grounding
```

`Intelligence` validates Sources, the Domain registry, Knowledge, intelligence relationships, cross-graph ownership and internal-source provenance.

`Intelligence Promotion` validates required approval, canonical-meaning authority, automatic-boundary compliance and proposed cross-graph effects.

`Intelligence Views` verifies committed derived reports against the **current runtime-supplied Project Graph revision**.

`Intelligence Grounding` projects one of:

```text
grounded
attention
blocked
not-applicable
```

Stale Knowledge does not automatically mean `blocked`; blocking follows Project Intelligence and lifecycle policy.

---

# 15. Project Intelligence Promotion PR View

A promotion PR has its own governance summary, for example:

```text
Pactwright Project Intelligence

Source           src-...
Domain           discovery
Triage           class 3 · contradictory
Knowledge        2 changed · 1 new
Delivery impact  2 Intents · 1 Contract
Propagation      required
Review           domain owner + delivery owner
```

An Operations-originated Source may additionally show its Observation and exposure provenance.

The PR distinguishes Intelligence mutations actually proposed in the branch from downstream Delivery/Extension changes merely recommended for normal handling.

The PR remains a governance surface, not a proposal graph node.

---

# 16. Project Intelligence Project Views

The shared Project supports configured Project Intelligence views:

```text
Promotions
Coverage
Roadmap
Freshness
Propagation
```

`Coverage` projects domain-map/onboarding state.

`Roadmap` projects the single Project Intelligence candidate model.

`Freshness` projects current/stale/challenged Knowledge.

`Propagation` projects downstream impact before dependant canonical records change.

These views remain derived.

---

# 17. Delivery Intelligence PR Projection

When Project Intelligence is enabled, a Delivery PR may expose relevant grounding:

```text
Project Intelligence

Domain          product
Grounding       grounded
Freshness       1 stale item
Knowledge       6 relevant records
```

It links to motivating Knowledge, Domain Definitions, stale/challenged records and blocking gaps without copying complete Knowledge contents.

---

# 18. Graph Review Automation

When Graph Review is enabled, GitHub owns automation for:

- Graph Review validation;
- manual, scheduled or configured event-triggered execution;
- Review Execution provenance validation;
- Finding hand-off to Project Intelligence;
- review projection updates.

Execution uses:

```text
pactwright graph-review run
```

and validation uses:

```text
pactwright graph-review validate
```

Every run records the Project Graph revision supplied by Pactwright runtime.

Every Finding from a successful review must be handed to Project Intelligence through normal internal Source ingestion.

A failed hand-off leaves the successful Finding valid and retryable. GitHub must not rerun the review merely to retry Source hand-off.

A failed Review Execution records failure provenance and emits no Findings.

---

# 19. Graph Review Paths and Projections

Relevant managed/validated Graph Review state includes:

```text
.pactwright/executions/graph-reviews/**
docs/graph-review/reports/**
```

plus shared Project Graph relationships affected by Graph Review-owned semantics.

The shared Project may expose:

```text
Reviews
Findings
```

A review summary may show:

```text
Pactwright Graph Review

Perspective      architecture
Graph revision   <revision>
Status           succeeded
Critical         0
Material         2
Advisory         3
Source hand-off  5
```

Review Executions and Findings remain execution provenance/output until Findings enter Project Intelligence as Sources.

---

# 20. Assets / Publication Automation

When Assets / Publication is enabled, changes to canonical records or repository-backed Asset content must run:

```text
pactwright assets validate
```

Relevant paths include:

```text
assets/**
docs/assets-publication/assets/**
docs/assets-publication/publications/**
```

Asset validation checks at least:

- referenced Delivery Evidence;
- human Asset approval;
- exact stored/referenced content hash where verifiable;
- required grounding id/hash pairs;
- Asset immutability and valid supersession relationships.

Changes under `assets/**` must validate affected Asset records so repository-backed content cannot diverge from approved `content_hash`.

Publication validation checks at least:

- referenced Asset exists and is approved;
- `Publication.asset_hash == Asset.content_hash`;
- channel and locator information;
- `published_by` and `published_at`;
- canonical `Publication --publishes--> Asset` relationship.

GitHub approval metadata alone cannot create an Asset.

---

# 21. Asset Approval and Publication Automation Boundary

Repository policy may explicitly map a safe GitHub authority event to:

```text
pactwright assets approve-asset <evidence-id>
```

but Pactwright must still create the canonical Asset with human approval and exact content identity.

Scheduled or event-triggered release of an already approved Asset may invoke:

```text
pactwright assets record-publication <asset-id> <channel>
```

Scheduling must not bypass Asset approval.

A failed Publication operation leaves the approved Asset unchanged.

When Operations is enabled, a valid Publication may subsequently become an operational exposure without transferring Publication ownership.

---

# 22. Assets / Publication Checks and Views

The exact check surface includes:

```text
Pactwright / Assets
Pactwright / Publication
```

`Assets` validates Asset structure, Evidence provenance, approval, content identity, grounding and supersession.

`Publication` validates the referenced approved Asset, asset-hash equality, publication provenance and `publishes` relationship.

The shared Project may expose:

```text
Assets
Publications
```

Asset fields may include:

```text
title
media type
Delivery lineage
grounding state
approved by
current/superseded
Publication count
```

Publication fields may include:

```text
Asset
channel
locator
published by
published at
linked operational Observations when Operations is enabled
```

Candidate outputs never appear as canonical Assets.

---

# 23. Operations Deployment Automation

When Operations is enabled, Deployment recording may be triggered by:

- a trusted repository deployment event;
- completion of a configured deployment workflow;
- manual dispatch;
- another configured trusted integration.

The workflow invokes:

```text
pactwright operations record-deployment <evidence-id>
```

and records exact production exposure through Operations semantics.

GitHub deployment metadata is not canonical Deployment state.

Recording preserves traceability to Delivery Evidence, deployed artifact/revision, environment, deployment time and responsible human/automation.

---

# 24. Operations Source and Refresh Automation

Changes to:

```text
.pactwright/operations/sources/**
.pactwright/operations/environments/**
```

run Operations configuration validation through:

```text
pactwright operations validate
```

On configured schedules run:

```text
pactwright operations refresh
```

`refresh` may:

1. ingest bounded evidence from configured sources;
2. create immutable Operations execution provenance;
3. analyse evidence;
4. create or supersede Observations when durable findings exist;
5. hand every canonical Observation to Project Intelligence as an internal Source.

A successful refresh may produce no Observation. Absence of sufficient evidence is not an execution failure.

Raw operational payloads must not be written into the Project Graph or GitHub projection simply because Actions retrieved them.

---

# 25. Operations Observation and Hand-Off Automation

Changes to:

```text
docs/operations/observations/**
```

validate:

- exposure identity;
- evidence window and evidence references;
- direction, significance and confidence values;
- `Observation --observes--> exposure` endpoints;
- registered exposure type;
- acyclic supersession;
- separation between correlation and unsupported causality.

A valid Observation enters Project Intelligence through normal Source ingestion.

GitHub must not directly create Knowledge, create canonical Intents, assign Project Intelligence consequence class or reorder the global roadmap.

A failed hand-off leaves the canonical Observation valid and retryable.

---

# 26. Operations Corrective Roadmap Automation

After relevant accepted Project Intelligence changes originating from Operations run:

```text
pactwright operations corrective-roadmap
```

and regenerate:

```text
docs/operations/reports/corrective-intent-roadmap.md
```

The report is a filtered projection of Project Intelligence candidates whose accepted motivation traces to Operations.

It must not create a second candidate model, independent priority or canonical Intent.

---

# 27. Operations Checks and Views

The exact check surface includes:

```text
Pactwright / Operations
Pactwright / Operations Views
```

`Operations` validates Deployment schema/Evidence, artifact/environment identity, Observation schema, evidence provenance, registered exposure relationships, `deployed-as`, `observes`, supersession, source/environment configuration and relevant execution provenance.

External source/authentication/analysis failure is distinguishable from invalid canonical Operations state.

`Operations Views` verifies `corrective-intent-roadmap.md` against both the current applicable Project Intelligence candidate derivation and the current runtime Project Graph revision.

The shared Project may expose:

```text
Operations
Deployments
Production Findings
Corrective Roadmap
```

Deployment fields may include environment, Delivery Evidence, artifact revision, deployed time/by, active Observation count and current/superseded state.

Production Finding fields may include exposure, exposure type, direction, significance, confidence, evidence window, current derived state, resulting Source and resulting Knowledge/promotion PR when available.

---

# 28. Operations Delivery PR Context

When Operations is enabled, a Delivery PR may expose relevant historical production context before merge:

```text
Operations

Previous deployment   production · current
Active findings       2 material
Prior regression      checkout latency
Corrective origin     observation-...
```

The section may link to prior Deployments, relevant Observations, accepted operational Knowledge and corrective provenance.

It must not display raw telemetry.

A PR is not considered deployed merely because it merges or completes Delivery. Deployment remains Operations-owned post-Delivery state.

---

# 29. Intent Issue Projection

An Intent may have a GitHub Issue projection.

Core fields include:

```text
title
current lifecycle state
current Contract
current Brief
linked pull request
blocking state
```

Project Intelligence may add motivating Domain/Knowledge, grounding, missing knowledge dependencies, onboarding guidance and launch tranche.

Graph Review may add relevant Findings.

Assets / Publication may add linked approved Asset or Publication.

Operations may add corrective origin, motivating Observation, affected Deployment/Publication, significance and current condition.

The Issue owns none of these values.

---

# 30. Pull Request Model

One meaningful repository-backed Delivery normally uses one branch and one pull request. There is no requirement for one PR per lifecycle step.

Separate Pactwright-managed PRs may represent genuine governance boundaries such as:

- Project Intelligence promotion;
- headless Graph Review Finding → Source hand-off;
- Operations canonical-state review where repository policy requires it.

Routine raw telemetry never enters such PRs.

Asset approval, Publication, Deployment and Observation do not create new core Delivery stages.

---

# 31. Deterministic Project Graph Revision

GitHub consumes one deterministic Project Graph revision supplied by Pactwright runtime.

```text
canonical registered Project Graph state
        ↓
Pactwright runtime revision
        ↓
reviews + generated reports + GitHub projections
```

GitHub must not derive an independent revision scheme.

The revision:

- **includes canonical Extension records**, including Project Intelligence canonical state, Assets, Publications, Deployments and Observations;
- **excludes generated reports and derived views**;
- **excludes execution provenance and other non-canonical execution outputs**, including Review/Operations execution records;
- is independent of the Git commit containing generated output.

The same canonical Project Graph state must produce the same revision.

**Every generated Pactwright report records its source Project Graph revision.**

Every applicable view-freshness check compares the report's recorded revision with the current runtime-supplied revision.

A mismatch means derived state is stale. It does not by itself mean canonical Project Graph state is invalid.

---

# 32. Shared GitHub Project

When enabled, one shared Project per repository is the default projection surface.

Configured views may include:

```text
Core
→ Delivery
→ Blocked

Project Intelligence
→ Promotions
→ Coverage
→ Roadmap
→ Freshness
→ Propagation

Graph Review
→ Reviews
→ Findings

Assets / Publication
→ Assets
→ Publications

Operations
→ Operations
→ Deployments
→ Production Findings
→ Corrective Roadmap
```

`pactwright github sync` owns Project creation, fields and views.

Actions update items and derived values.

Canonical records and execution provenance remain owned by Pactwright, not GitHub Projects.

---

# 33. GitHub Configuration and Logical Ownership

Repository configuration may selectively enable checks, PR summaries, Issue projections, Project views, schedules and ruleset details.

It may also map logical Pactwright owners/stewards to GitHub users or teams.

Semantic specifications refer to logical authority. GitHub usernames/team names remain integration configuration, not core semantics.

Extension GitHub configuration is ignored when the Extension is disabled.

Project-backed views require GitHub Projects; checks and PR summaries may operate without Projects.

Enabling an Extension does not force every optional view.

---

# 34. Managed Ownership and Reconciliation

Pactwright may mutate only remote GitHub resources it owns or has explicitly adopted.

It must preserve unrelated user-owned:

```text
workflows
labels
Projects
fields
rulesets
repository settings
```

Disabling a feature or Extension removes/updates only its managed contribution where safe.

Managed resources must be identifiable strongly enough for deterministic reconciliation.

The exact persistent ownership/adoption identity for remote GitHub resources, including rename/collision handling, remains an open implementation contract and must not be inferred from display names alone.

---

# 35. Failure Behaviour

GitHub automation fails closed where canonical validity or lifecycle authority is affected.

Component-specific guarantees are:

- invalid Delivery graph/lifecycle/review state blocks the relevant checks;
- Project Intelligence ingestion failures are surfaced; failed promotion does not remove accepted Source capture; report failure does not mutate canonical state;
- failed Graph Review execution remains failed execution provenance and emits no Findings;
- failed Graph Review → Project Intelligence hand-off leaves successful Findings valid and retryable without promoting truth;
- invalid Asset prevents Asset acceptance;
- failed Publication leaves the approved Asset unchanged;
- Operations authentication/availability failure records failed execution provenance and leaves existing canonical Operations state valid;
- failed Operations collection or analysis creates no canonical mutation;
- insufficient operational evidence is a successful no-Observation outcome;
- failed Observation → Project Intelligence hand-off leaves the Observation valid and retryable;
- failed corrective-roadmap or other projection generation does not mutate canonical state;
- failed optional Project/summary updates do not rewrite otherwise valid Pactwright truth.

Execution failure and canonical invalidity must remain distinguishable.

The exact GitHub check conclusion mapping for distinctions such as external execution failure versus canonical validation failure remains an implementation detail and should be made consistent when the workflows are implemented.

---

# 36. Permissions and Untrusted Contributions

GitHub Actions use least privilege.

Examples:

```text
validation
→ repository read + check write

managed repository mutation
→ only required contents/PR write permissions

Project projection
→ Project permissions only when enabled

publication/deployment/operational integrations
→ only explicitly configured external permissions
```

Credentials belong in GitHub secrets or external secret stores, never canonical Pactwright state.

Untrusted pull-request content must not automatically gain access to privileged secrets, publication/deployment credentials, operational systems or write-capable tokens.

Privileged automation runs only under safe triggers and repository policy.

---

# 37. Generated vs User-Owned Workflows

Pactwright-managed workflows may be regenerated by Pactwright synchronisation.

User-authored workflows remain user-owned.

Prefer a small number of generated workflows:

```text
GitHub workflow
→ trigger + environment + Pactwright invocation

Pactwright runtime
→ semantics
```

not semantic YAML duplication.

---

# 38. Automation Mutation Concurrency

Headless Graph Review, Project Intelligence promotion and Operations hand-offs may require Pactwright-managed branch or pull-request mutation.

The source architecture establishes those repository mutations but does not define how concurrent automation targeting the same canonical files is serialised, rebased or deduplicated.

This remains an explicit implementation gap. Implementations must preserve canonical validation against current Project Graph state and must not use last-writer-wins behaviour that can silently discard another accepted mutation.

---

# 39. Evaluation

GitHub Integration evaluation should verify:

- profile composition and conflict detection;
- deterministic workflow generation;
- exact trigger/path routing;
- lifecycle Gate stopping;
- check semantics;
- PR/Issue projection accuracy;
- Intelligence Grounding states;
- promotion PR projection;
- Project field/view derivation;
- Operations PR context;
- report revision and stale-view detection;
- Extension enable/disable behaviour;
- remote reconciliation;
- preservation of unmanaged GitHub state;
- least-privilege configuration;
- failure-state separation;
- canonical-state independence from GitHub metadata.

Extension-specific business semantics remain evaluated by their owning Extensions.

---

# 40. Core Invariants

1. The Pactwright Project Graph is canonical; GitHub is execution and projection.
2. GitHub Actions invoke Pactwright rather than reimplement semantics.
3. GitHub metadata alone cannot create canonical Pactwright truth.
4. `pactwright github sync` owns managed remote structure.
5. Actions own runtime projection updates.
6. Enabled profiles compose into one desired GitHub state.
7. One shared GitHub Project per repository is the default.
8. Interactive and CI execution use the same locked Pactwright environment.
9. Shared graph changes are routed by semantic ownership, not path alone.
10. GitHub consumes but does not define lifecycle topology or Project Graph revision.
11. Every generated Pactwright report records its source Project Graph revision.
12. Applicable view checks compare the recorded report revision with the current runtime revision.
13. Generated reports and execution provenance are excluded from Project Graph revision; canonical Extension records are included.
14. `Pactwright / Intelligence Grounding` uses `grounded | attention | blocked | not-applicable`.
15. Graph Review execution and Finding hand-off preserve Spec 04 failure/provenance boundaries.
16. Asset and Publication automation preserves Spec 05 hash, approval and failure boundaries.
17. Operations automation uses `record-deployment`, `refresh`, `corrective-roadmap` and `validate` rather than inventing alternate semantics.
18. Insufficient operational evidence is not an error and creates no Observation.
19. GitHub Project edits do not silently mutate canonical Pactwright state.
20. Reconciliation preserves unmanaged resources.
21. Permissions follow least privilege.
22. Disabling an Extension affects only its managed GitHub contribution.

---

# 41. Anti-Overengineering Constraints and Open Gaps

Do not introduce initially:

```text
one GitHub Project per Extension
one workflow per command
GitHub-owned lifecycle state
generic two-way Project-field synchronisation
GitHub-native knowledge semantics
GitHub-native roadmap semantics
custom GitHub App while Actions + CLI are sufficient
alert-management platform
observability dashboard replacement
complex cross-repository portfolio system
```

Prefer:

```text
profiles
→ desired state
→ github sync
→ thin Actions
→ checks / summaries / views
```

Open implementation gaps remain:

- stable ownership/adoption identity for managed GitHub resources and rename/collision behaviour;
- concurrency/rebase/idempotency policy for automation-generated branches and PRs;
- exact GitHub check conclusion mapping between execution failure, stale derived state and canonical invalidity;
- the concrete repository configuration that maps a safe GitHub human-authority event to canonical Pactwright operations such as Asset approval.

These gaps must not be resolved by making GitHub metadata canonical.

---

# 42. Current Implementation Baseline

The established GitHub design provides the required architecture:

- Pactwright remains canonical;
- GitHub Actions execute Pactwright responsibilities;
- GitHub views are derived;
- `pactwright github sync` owns remote provisioning;
- component profiles compose into one desired GitHub state;
- incompatible profiles fail validation;
- one shared GitHub Project is used by default;
- PRs, Issues and Projects remain collaboration/projection surfaces.

The redesign separates the old Review & Creative surface into:

```text
Graph Review
Assets / Publication
```

while preserving the sourced GitHub behaviours under their new owners.

---

# 43. Relationship to Other Canonical Specifications

```text
01 Core System and Lifecycle
→ owns Delivery/lifecycle semantics consumed by GitHub

02 Distribution, Agent Packs, Extensions and Evaluation
→ owns GitHub profile contribution and resolved environment

03 Project Intelligence
→ owns Intelligence commands, reports and governance

04 Graph Review
→ owns Review Executions, Findings and PI hand-off

05 Assets and Publication
→ owns Asset approval, hashes and Publication truth

06 Operations
→ owns Deployment, Observation and corrective-roadmap semantics

07 GitHub Integration
→ owns exact remote automation and projection surface

08 Open-Source Project Organisation
→ governs repository/ecosystem organisation
```

---

# 44. Governing Rule

> **GitHub executes and projects Pactwright; it does not become Pactwright. Every workflow invokes the owning Pactwright semantics, every generated report and applicable view is revision-aware, and every GitHub field, check, PR, Issue and Project remains a derived collaboration surface unless repository policy explicitly routes a safe authority event through a canonical Pactwright operation.**

---

**Pactwright GitHub Integration v1**