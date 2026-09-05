# Pactwright GitHub Integration

## 1. Purpose

GitHub is Pactwright's primary remote collaboration, automation and projection surface.

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

Pactwright remains the source of Project Graph truth.

GitHub may:

- run Pactwright commands;
- enforce checks;
- host pull requests and issues;
- project lifecycle and extension state;
- provision labels, rulesets, Projects, fields and views;
- surface derived summaries.

GitHub must not become:

```text
a second Project Graph
a lifecycle database
an Extension database
a knowledge store
an observability store
a roadmap engine
```

GitHub state must be regenerable from Pactwright canonical state and configuration.

---

## 2. Scope

This specification owns:

- GitHub configuration;
- generated GitHub Actions;
- checks;
- pull request summaries;
- Issue projections;
- GitHub Projects;
- fields and views;
- remote provisioning;
- profile composition;
- GitHub reconciliation;
- permissions and ownership;
- runtime projection behaviour.

Other specifications may declare GitHub requirements.

They do not define GitHub projection mechanics.

---

# 3. Operating Boundary

Semantic ownership remains outside GitHub:

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

GitHub invokes Pactwright.

Pactwright decides what canonical mutation is valid.

---

# 4. Provisioning vs Projection

GitHub integration has two responsibilities.

## Provisioning

```text
pactwright github sync
```

owns Pactwright-managed remote structure such as:

- labels;
- rulesets;
- required checks;
- repository settings where supported;
- GitHub Project;
- Project fields;
- Project views;
- other Pactwright-managed configuration.

## Projection

GitHub Actions update runtime-derived state such as:

- checks;
- PR summaries;
- Issue summaries;
- Project items;
- derived field values.

Actions must not independently redefine remote structure owned by `github sync`.

---

# 5. GitHub Profiles

Core Pactwright and enabled Extensions contribute logical GitHub requirements through profiles.

Conceptually:

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
- identical requirements collapse;
- compatible requirements merge;
- incompatible requirements fail validation;
- Extension dependencies are resolved before GitHub composition;
- profiles contribute to one repository integration;
- GitHub-specific configuration does not redefine Extension semantics.

A Pactwright Extension must not create a separate GitHub Project simply to isolate its own views.

---

# 6. Shared GitHub Project

When GitHub Projects are enabled, Pactwright should use one shared Project per repository by default.

Conceptually:

```text
Pactwright Project

Delivery
Blocked

Project Intelligence
Coverage
Roadmap
Freshness
Promotions

Graph Review
Reviews
Findings

Assets / Publication
Assets
Publications

Operations
Deployments
Production Findings
Corrective Work
```

Only configured views are provisioned.

The Project is a projection.

Canonical records remain in the repository Project Graph.

---

# 7. Workflow Surface

Pactwright should generate a small workflow surface.

Conceptually:

```text
.github/workflows/
├── pactwright.yml
├── pactwright-intelligence.yml
├── pactwright-graph-review.yml
├── pactwright-assets-publication.yml
└── pactwright-operations.yml
```

Extension workflows exist only when their Extension is enabled.

A workflow should:

1. install the locked Pactwright version;
2. load configuration and lock state;
3. load enabled Extensions and Agent Pack;
4. invoke Pactwright commands;
5. publish checks or projections.

Workflow YAML must remain thin.

Semantic rules belong in Pactwright runtime and Extensions.

---

# 8. Shared Execution Environment

Interactive and GitHub execution must use the same resolved Pactwright environment.

```text
same runtime
same Extensions
same Agent Pack
same Production Skills
same lock
```

There must not be separate:

```text
interactive AI semantics
CI AI semantics
```

implementing equivalent Pactwright responsibilities differently.

GitHub is another execution surface for the same locked system.

---

# 9. Core Delivery Automation

Meaningful Delivery changes should invoke:

```text
pactwright validate
```

and relevant lifecycle checks.

GitHub Actions may continue automatic lifecycle execution:

```text
pactwright lifecycle run
```

until:

- a Gate requiring external authority is reached;
- Review blocks;
- validation fails;
- execution fails;
- lifecycle completes.

GitHub must not infer Pactwright approval merely from:

- PR approval;
- labels;
- comments;
- merge state;

unless repository policy explicitly maps that GitHub event into the appropriate Pactwright authority operation.

---

# 10. Lifecycle Shapes

GitHub does not define lifecycle topology.

The runtime reads the lifecycle shape selected by the Brief.

Actions may invoke:

```text
/deliver-brief
/review
```

multiple times as the shape progresses.

GitHub should project:

```text
current lifecycle step
Gate status
blocked state
completion
```

without turning each lifecycle step into GitHub-owned state.

---

# 11. Delivery Pull Request Summary

A Pactwright Delivery pull request should expose a concise projection.

Example:

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

For richer lifecycle shapes it may show the current shape and phase.

The summary should link to canonical records rather than copy their complete contents.

---

# 12. Core Checks

Useful core checks include:

```text
Pactwright / Graph
Pactwright / Lifecycle
Pactwright / Review
```

## Graph

Validates Project Graph structure relevant to the changed records.

## Lifecycle

Validates:

- current lifecycle state;
- valid transitions;
- Gate requirements;
- required authority.

## Review

Reflects whether the applicable Delivery Review passed.

The underlying Review may use different Production Skills without changing the check's meaning.

---

# 13. Shared Graph Validation

Changes to shared graph relationships may involve several semantic owners.

For example:

```text
Knowledge
--satisfied-by-->
Evidence
```

may require validation by both Project Intelligence and Delivery semantics.

GitHub workflow routing should therefore use registered graph ownership rather than relying only on file paths.

Cross-graph relationships may invoke multiple validators.

---

# 14. Project Intelligence Automation

When enabled, GitHub may automate:

```text
Source validation
triage
promotion validation
coverage regeneration
onboarding regeneration
roadmap regeneration
propagation
freshness
```

Relevant operations include:

```text
pactwright intelligence validate
pactwright intelligence onboard
pactwright intelligence derive-intent-roadmap
pactwright intelligence propagate ...
pactwright intelligence refresh
```

GitHub must preserve Project Intelligence's automatic mutation boundary.

It must not turn:

```text
Source
→ directly into Knowledge
```

or:

```text
roadmap candidate
→ directly into Intent
```

without normal governance.

---

# 15. Project Intelligence Checks and Views

Useful checks include:

```text
Pactwright / Intelligence
Pactwright / Intelligence Promotion
Pactwright / Intelligence Views
```

They may validate:

- Sources;
- Domains;
- Knowledge;
- typed relationships;
- promotion authority;
- derived-view freshness.

Useful views include:

```text
Coverage
Roadmap
Freshness
Propagation
```

Derived report mismatch means the projection is stale.

It does not automatically mean canonical Project Graph state is invalid.

---

# 16. Delivery Intelligence Projection

When Project Intelligence is enabled, Delivery PRs may show relevant grounding.

Example:

```text
Project Intelligence

Domain          product
Grounding       accepted
Freshness       1 stale item
Knowledge       6 relevant records
```

It may link to:

- motivating Knowledge;
- relevant Domains;
- stale or challenged Knowledge;
- blocking intelligence gaps.

It should not copy full Knowledge records into GitHub summaries.

---

# 17. Graph Review Automation

When Graph Review is enabled, GitHub may:

- invoke graph reviews;
- validate Review Execution provenance;
- surface review summaries;
- hand Findings to Project Intelligence;
- update review views.

Conceptually:

```text
Project Graph
→ pactwright graph-review run
→ Finding
→ internal Project Intelligence Source
```

GitHub must not directly promote Findings into Knowledge or Delivery truth.

---

# 18. Graph Review Checks and Views

Useful projection surfaces include:

```text
Pactwright / Graph Review
```

and Project views such as:

```text
Reviews
Findings
```

A review summary may show:

```text
Perspective      architecture
Graph revision   ...
Status           succeeded
Critical         0
Material         2
Advisory         3
Findings         5
```

Review Executions remain provenance.

Findings remain Graph Review output until Project Intelligence governs their durable meaning.

---

# 19. Assets / Publication Automation

When enabled, GitHub may support:

- Asset validation;
- repository-backed content-hash validation;
- approval projection;
- Publication validation;
- publication-trigger automation for already approved Assets;
- Asset and Publication views.

GitHub must not turn candidate output into an Asset merely because it appears in a pull request.

Canonical authority remains:

```text
Evidence
→ Asset approval
→ Asset
→ Publication
```

---

# 20. Asset Approval Boundary

GitHub review approval alone is not automatically Asset approval.

Repository policy may explicitly use a GitHub event as the trigger for the Pactwright Asset approval operation, but Pactwright must still record the canonical Asset authority state.

GitHub metadata is therefore:

```text
approval input
```

not:

```text
Asset truth
```

---

# 21. Assets / Publication Checks and Views

Useful checks may include:

```text
Pactwright / Assets
Pactwright / Publication
```

They may validate:

- Evidence provenance;
- approval;
- content hash;
- supersession;
- Publication reference;
- Publication configuration.

Views may expose:

```text
Assets
Publications
```

Useful derived fields include:

```text
Asset:
title
type
Delivery lineage
approval
current/superseded
publication count

Publication:
Asset
channel
location
published at
status
```

Candidate outputs must not appear as canonical Assets.

---

# 22. Operations Automation

When Operations is enabled, GitHub may support:

- Deployment recording;
- Deployment validation;
- source/environment configuration validation;
- scheduled evidence collection;
- Observation validation;
- Project Intelligence hand-off;
- derived corrective views.

A deployment event may invoke Pactwright to record:

```text
Evidence
→ Deployment
```

GitHub deployment metadata itself is not the canonical Deployment record. The previous design already enforced that distinction between GitHub metadata and Operations truth. 

---

# 23. Operations Collection

Scheduled or event-driven automation may invoke:

```text
pactwright operations collect ...
```

or an equivalent runtime operation.

A run may:

1. collect bounded external evidence;
2. create execution provenance;
3. analyse signals;
4. create or supersede Observations where justified;
5. pass Observations to Project Intelligence.

A successful run may produce no Observation.

Raw telemetry must not be copied into GitHub merely because Actions retrieved it.

---

# 24. Operations Checks and Views

Useful checks include:

```text
Pactwright / Operations
Pactwright / Operations Views
```

Useful views include:

```text
Operations
Deployments
Production Findings
Corrective Work
```

These project:

- canonical Deployments;
- canonical Observations;
- derived Project Intelligence candidates motivated by Operations.

They must not create:

- new operational semantics;
- a second roadmap;
- independent priority.

---

# 25. Corrective Work Projection

Operations may expose a filtered view:

```text
Project Intelligence candidates
        ↓
Operations provenance filter
        ↓
Corrective Work
```

The global Project Intelligence roadmap remains authoritative.

Editing GitHub Project fields must not:

- create candidates;
- reorder canonical priority;
- create Intents.

Unless explicitly designed as an authorised Pactwright input, GitHub field edits are projection edits only and should be reconciled back to desired state.

---

# 26. Issues

An Intent may have a GitHub Issue projection.

Useful fields include:

```text
Intent
current Contract
current Brief
lifecycle state
blocked state
linked pull request
```

Enabled Extensions may contribute derived fields such as:

```text
Project Intelligence
→ domain, grounding, knowledge blockers

Graph Review
→ relevant Findings

Assets / Publication
→ linked Asset or Publication

Operations
→ motivating Observation or exposure
```

The Issue remains a navigation and collaboration surface.

It does not own these values.

---

# 27. Pull Request Model

One meaningful Delivery normally uses one branch and one pull request.

The PR may accumulate:

```text
Intent
Decision + Contract
Brief
delivered repository changes
Evidence
```

There is no requirement for one PR per lifecycle step.

Separate PRs may be appropriate for governance boundaries such as:

```text
Project Intelligence promotion
headless Graph Review Source hand-off
Operations canonical-state approval
```

where repository policy requires them.

GitHub collaboration structure must not redefine Pactwright lifecycle structure.

---

# 28. Project Graph Revision

GitHub consumes the deterministic Project Graph revision supplied by Pactwright runtime.

```text
canonical Project Graph state
        ↓
Pactwright revision
        ↓
GitHub projections
```

GitHub must not derive a separate revision scheme.

Generated reports and views should identify the Project Graph revision they project where useful.

A Git commit containing generated output is not itself the Project Graph revision.

---

# 29. GitHub Configuration

Repository configuration may enable GitHub features selectively.

Conceptually:

```yaml
github:
  enabled: true

  pull_request:
    lifecycle_summary: true

  checks:
    graph: true
    lifecycle: true
    review: true

  issues:
    intents: true

  project:
    enabled: true

  extensions:
    project-intelligence:
      enabled: true

    graph-review:
      enabled: true

    assets-publication:
      enabled: true

    operations:
      enabled: true
```

Exact schema may evolve.

Rules:

- Extension GitHub configuration is ignored when that Extension is disabled;
- Project-backed views require GitHub Projects to be enabled;
- checks and PR summaries may work without Projects;
- enabling an Extension does not force every optional GitHub projection;
- Extension dependency resolution happens before GitHub profile composition.

---

# 30. Repository Overrides

Repository configuration may override logical GitHub requirements such as:

```text
owners
stewards
GitHub users or teams
enabled views
required checks
schedules
ruleset details
```

Semantic specifications should refer to logical ownership.

GitHub configuration maps those logical roles to GitHub identities.

This prevents GitHub usernames and team names from becoming core Pactwright semantics.

---

# 31. Reconciliation

GitHub integration should operate as desired-state reconciliation.

```text
Pactwright config
+ enabled profiles
+ repository overrides
        ↓
resolved desired state
        ↓
compare with GitHub
        ↓
create / update / remove managed state
```

`pactwright github sync` should support dry-run before applying changes.

Re-running sync with unchanged desired state should converge without unnecessary mutation.

---

# 32. Managed Ownership

Pactwright may change only GitHub resources it owns or has explicitly adopted.

It must not delete or overwrite unrelated:

```text
workflows
labels
Projects
rulesets
repository settings
Issue fields
```

Managed resources should be identifiable.

Disabling a Pactwright feature should remove or disable its managed projection where safe without affecting unrelated user-owned GitHub configuration.

---

# 33. Failure Behaviour

GitHub automation should fail closed where canonical validity or lifecycle authority is affected.

Examples:

```text
invalid Project Graph
→ block relevant check

failed Delivery Review
→ block lifecycle progression

unresolved Gate
→ stop automation

invalid Asset
→ prevent canonical approval/publication operation

invalid Observation
→ prevent canonical Operations acceptance
```

By contrast:

```text
stale derived report
failed optional projection refresh
failed Project view update
```

should not automatically corrupt or rewrite valid canonical state.

Execution failure and canonical invalidity must remain distinguishable.

---

# 34. Permissions

GitHub Actions should use least privilege.

Workflows receive only the permissions required for their responsibility.

For example:

```text
validation
→ repository read + check write

managed PR mutation
→ contents/pull-request write where required

Project projection
→ Project permissions where enabled

publication/deployment integration
→ only explicitly configured external permissions
```

Credentials belong in GitHub secrets or appropriate external secret stores.

They must not be committed into Pactwright canonical state.

---

# 35. Security Boundary

Untrusted pull-request content must not automatically receive access to privileged:

```text
secrets
publication credentials
deployment credentials
operational systems
write-capable tokens
```

Privileged automation should run only under safe trigger and repository-policy conditions.

GitHub integration must preserve Pactwright authority boundaries even when repository events originate from untrusted contributors.

---

# 36. Generated vs User-Owned Workflows

Pactwright-managed workflows may be regenerated by `pactwright sync`.

User-authored workflows remain user-owned.

The integration should prefer a small number of generated workflows that invoke Pactwright rather than generating large amounts of semantic YAML.

The rule is:

```text
GitHub workflow
→ trigger + environment + Pactwright invocation

Pactwright
→ semantics
```

not:

```text
GitHub workflow
→ reimplementation of Pactwright
```

---

# 37. Evaluation

GitHub Integration evaluation should verify projection and automation semantics.

Useful cases include:

- profile composition;
- conflict detection;
- deterministic generation;
- lifecycle Gate stopping;
- correct check status;
- Issue and PR projection accuracy;
- stale-view detection;
- Extension enable/disable behaviour;
- remote reconciliation;
- preservation of unmanaged GitHub state;
- least-privilege configuration;
- canonical-state independence from GitHub metadata.

Extension-specific business semantics remain evaluated by their owning Extensions.

---

# 38. Core Invariants

1. The repository Project Graph is canonical; GitHub is projection.
2. GitHub Actions invoke Pactwright rather than reimplement its semantics.
3. GitHub metadata alone does not create canonical Pactwright truth.
4. `pactwright github sync` owns managed remote structure.
5. Actions own runtime projection updates.
6. Enabled component profiles compose into one desired GitHub state.
7. One shared GitHub Project is used per repository by default.
8. Extension views remain projections of their owning semantics.
9. GitHub does not derive its own Project Graph revision.
10. Lifecycle Gates cannot be bypassed by generic GitHub approval metadata.
11. Interactive and CI execution use the same locked Pactwright environment.
12. Shared graph changes are validated according to semantic ownership.
13. Operations telemetry remains outside GitHub and the Project Graph.
14. Generated views and reports are not canonical truth.
15. GitHub Project edits do not silently mutate canonical Pactwright state.
16. Reconciliation is deterministic and preserves unmanaged resources.
17. Permissions follow least privilege.
18. Disabling an Extension removes only its managed GitHub contribution.

---

# 39. Anti-Overengineering Constraints

Do not introduce initially:

```text
one GitHub Project per Extension
one workflow per command
GitHub-owned lifecycle state
two-way generic Project-field synchronisation
GitHub-native knowledge semantics
GitHub-native roadmap semantics
custom GitHub app when Actions + CLI are sufficient
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
→ derived checks/views
```

Add richer GitHub surfaces only when the existing projections prove insufficient.

---

# 40. Current Implementation Baseline

The existing GitHub research design already establishes the main architecture:

- Pactwright remains canonical;
- GitHub Actions execute Pactwright responsibilities;
- GitHub views are derived;
- `pactwright github sync` owns remote provisioning;
- Actions own runtime projection updates;
- component profiles compose into one GitHub desired state;
- incompatible profile requirements fail validation;
- one shared GitHub Project is used by default. 

It also establishes that PRs, Issues and Projects are collaboration and projection surfaces rather than canonical lifecycle storage. 

The canonical redesign changes the component decomposition:

```text
old:
Review & Creative

new:
Graph Review
Assets / Publication
```

and removes obsolete GitHub concerns associated with:

```text
Review Definitions
creative-delivery
generation provider/task configuration
generation guidance
```

The surviving GitHub architecture remains valid and becomes simpler.

---

# 41. Relationship to Other Canonical Specifications

```text
01 Core System and Lifecycle
→ owns Contract and lifecycle semantics

02 Distribution, Agent Packs, Extensions and Evaluation
→ owns component profiles and resolved execution environment

03 Project Intelligence
→ owns knowledge governance and roadmap semantics

04 Graph Review
→ owns specialist analysis and Findings

05 Assets and Publication
→ owns approved outputs and Publication

06 Operations
→ owns Deployment and Observation

07 GitHub Integration
→ owns GitHub execution and projection

08 Open-Source Project Organisation
→ owns repository and ecosystem structure
```

---

# 42. Governing Rule

> **GitHub is Pactwright's remote execution, collaboration and projection surface, never its source of semantic truth. Pactwright runtime and Extensions own behaviour; GitHub profiles describe desired integration; `github sync` provisions managed remote state; Actions invoke Pactwright; checks, Issues, pull requests and Projects project the resulting canonical state.**

---

**Pactwright GitHub Integration v1**