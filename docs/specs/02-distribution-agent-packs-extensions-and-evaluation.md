# Pactwright Distribution, Agent Packs, Extensions and Evaluation

## 1. Purpose

This specification defines how Pactwright is packaged, installed, configured, extended, composed with AI capabilities, synchronised, locked, upgraded, diagnosed and evaluated.

The architecture is:

```text
Pactwright Core
      ↓
enabled Pactwright Extensions
      ↓
required capabilities
      ↓
selected Agent Pack
      ↓
agents
      ↓
Production Skills
      ↓
Production Extension Packs
      ↓
execution adapter
```

Responsibilities are deliberately separated:

```text
Pactwright Core
→ stable semantics and deterministic runtime

Pactwright Extensions
→ optional Pactwright semantics

Agent Pack
→ AI implementation of Pactwright responsibilities

Production Skills
→ specialised production expertise

Production Extension Packs
→ specialised Production Skills knowledge

Adapter
→ execution-environment projection
```

Pactwright must not absorb production-domain workflows merely because it can execute them.

---

## 2. Scope

This specification owns:

- Pactwright distribution and initialisation;
- project configuration;
- package-manager integration;
- locking and reproducibility;
- Agent Packs;
- capability resolution;
- Pactwright Extension installation, removal and upgrade;
- Production Skills integration;
- Production Extension Pack resolution;
- adapters;
- synchronisation;
- runtime and component upgrades;
- migrations;
- environment diagnosis;
- compatibility validation;
- Pactwright-level evaluation and baseline comparison.

It does not own:

- Contract or lifecycle semantics;
- extension-specific graph semantics;
- exact GitHub projection mechanics;
- domain production workflows;
- Production Skill commands;
- Production Extension Pack internals;
- domain-specific benchmarks.

---

# 3. Distribution, Initialisation and Project Configuration

Pactwright is installed as a project development dependency using the project's package manager.

Example:

```text
pnpm add -D pactwright
```

Initialise a repository through:

```text
pnpm pactwright init
```

The initialised repository contains Pactwright configuration, Project Graph storage and generated adapter/integration surfaces. Users should not manually copy Pactwright runtime scripts, agents or workflow commands between repositories.

The repository-level Pactwright customisation mechanisms are:

```text
Agent Pack
Pactwright Extensions
Adapter
Lifecycle configuration
GitHub configuration
```

Production Skills are not another peer-level project setting. They are composed through the selected Agent Pack.

Conceptually:

```yaml
version: 1

agent_pack:
  source: "@pactwright/standard"
  version: "..."

adapter:
  type: claude-code

extensions: {}

github:
  enabled: true
```

Configuration records desired Pactwright state.

The package-manager manifest and lock record installed package state.

`.pactwright/lock.yml` records the exact resolved Pactwright execution environment.

One-shot initialisation options must compose the same underlying operations as the corresponding explicit commands rather than implement a separate setup path. For example:

```text
pactwright init --with project-intelligence --github
```

must compose normal initialisation, Extension installation and GitHub synchronisation.

---

# 4. Pactwright Capabilities

A capability identifies a semantic AI responsibility.

It does not identify:

- an agent;
- a skill;
- a model;
- a provider;
- a production domain.

Core capabilities are:

```text
delivery-specification
delivery-execution
delivery-review
```

Extensions may add genuinely distinct responsibilities such as:

```text
intelligence-triage
intelligence-promotion
intelligence-context
graph-review
operations-analysis
```

Do not create capabilities such as:

```text
software-delivery
creative-delivery
video-delivery
music-delivery
creative-verification
generation-review
```

when an existing Pactwright responsibility plus specialised skills is sufficient.

---

# 5. Agent Packs

An Agent Pack defines how AI performs Pactwright responsibilities.

It may contain:

```text
capability mappings
agents
prompts
direct skills
Production Skills imports
evaluation cases
```

Conceptually:

```yaml
capabilities:
  delivery-specification: spec
  delivery-execution: implementer
  delivery-review: reviewer
```

Agent identity is not capability identity.

A project selects **one Agent Pack**.

Agent Pack composition is not required because one Agent Pack may already compose multiple Production Skills families.

The supported selection interface is:

```text
pactwright agent-pack use <source>
```

The operation must:

1. resolve a compatible complete pack;
2. validate it against core and enabled-Extension capabilities;
3. update configuration only after successful resolution;
4. record exact pack and agent identities in the lock;
5. run `pactwright sync`;
6. report any GitHub integration changes.

If required capabilities are missing, selection fails without replacing the current valid lock or generated environment.

Pactwright may recommend a compatible pack but must not silently select one.

Upgrade the currently configured Agent Pack through:

```text
pactwright agent-pack upgrade
```

This upgrades the selected pack within its configured compatibility constraints without changing Agent Pack identity.

---

# 6. Production Skills

Production Skills are independently maintained repositories containing specialised production expertise.

Examples include:

```text
software-engineering-skills
ui-ux-design-skills
deep-research-skills
video-game-development-skills
video-production-skills
music-production-skills
narrative-production-skills
```

They own their own:

```text
skills
skill commands
production workflows
Extension Packs
tools
examples
tests
benchmarks
evaluation
```

They must remain usable without Pactwright.

```text
standalone:
AI agent
→ Production Skills

with Pactwright:
Pactwright
→ Agent Pack
→ Production Skills
```

Pactwright must not require Production Skills repositories to adopt Pactwright lifecycle or Project Graph semantics.

---

# 7. Pactwright Integration Manifest

A Production Skills repository may optionally expose:

```text
integrations/
└── pactwright.yml
```

The manifest declares how its skills can participate in Pactwright responsibilities.

Conceptually:

```yaml
version: 1
id: video-production-skills

compatibility:
  pactwright: "..."

bindings:
  delivery-execution:
    skills:
      - video-production

  delivery-review:
    skills:
      - video-evaluate

extension_packs:
  path: extension-packs/
```

The exact schema may evolve.

The manifest should contain only:

```text
identity
Pactwright compatibility
capability → skill bindings
Production Extension Pack discovery
resolution metadata where necessary
```

It must not define:

```text
Pactwright agents
agent prompts
Pactwright commands
lifecycle shapes
Project Graph nodes
Pactwright Extension semantics
provider routing
domain workflow definitions
Project Intelligence rules
```

It is an integration contract, not a second Pactwright manifest.

---

# 8. Multi-Production-Skills Composition

An Agent Pack may import multiple Production Skills integrations.

Example:

```yaml
production_skills:
  - source: github:sb-dev/narrative-production-skills
  - source: github:sb-dev/music-production-skills
  - source: github:sb-dev/video-production-skills
```

Multiple Production Skills may contribute to the same capability:

```text
delivery-execution
        ↓
producer
        ├── narrative-production
        ├── music-production
        └── video-production
```

Likewise:

```text
delivery-review
        ↓
reviewer
        ├── narrative-evaluate
        ├── music-evaluate
        └── video-evaluate
```

Pactwright must therefore assume:

```text
one capability
→ one agent
→ potentially many Production Skills
```

not:

```text
one capability
→ one domain
```

---

# 9. Production Extension Packs

A Production Extension Pack adds specialised production knowledge to one Production Skills family.

An Agent Pack may select packs while importing the owning family:

```yaml
production_skills:
  - source: narrative-production-skills
    extension_packs:
      - childrens-television
```

Pactwright owns:

```text
selection
resolution
locking
availability
```

The Production Skills family owns:

```text
pack meaning
production rules
validation
evaluation
behavioural effect
```

A Production Extension Pack is not a Pactwright Extension.

```text
Pactwright Extension
→ extends Pactwright semantics

Production Extension Pack
→ extends Production Skills
```

---

# 10. Pactwright Extensions

A Pactwright Extension adds optional Pactwright semantics without redefining the core Delivery model.

It may contribute:

- Project Graph node and edge types;
- schemas and validation;
- namespaced runtime commands;
- context;
- required capabilities;
- evaluation cases;
- generated repository integration;
- GitHub profile requirements.

The redesigned first-party Extension set is:

```text
Project Intelligence
Graph Review
Assets / Publication
Operations
```

Extensions may depend on other Extensions when there is a real semantic dependency.

Expected examples include:

```text
Graph Review
→ Project Intelligence

Operations
→ Project Intelligence
```

Dependencies must not be introduced merely for implementation convenience.

The supported management interfaces are:

```text
pactwright extension add <id-or-package>
pactwright extension remove <id>
pactwright extension upgrade <id>
```

## Installation

`extension add` must:

1. resolve a compatible package;
2. resolve and install required Extension dependencies first;
3. add package dependencies;
4. register the Extension in project configuration;
5. record exact package/version/hash and resolved dependencies in the lock;
6. validate runtime compatibility and required Agent Pack capabilities;
7. create Extension-owned repository structure;
8. run `pactwright sync`;
9. report any GitHub provisioning changes.

Dependency installation uses the same compatibility, locking, capability-validation and synchronisation path as explicit Extension installation.

Installation fails before canonical Project Graph mutation if the complete environment is incompatible.

## Removal

Removing or disabling an Extension must preserve user-authored Extension graph data unless the user separately chooses to delete it.

Only generated local or remote state exclusively owned by that Extension may be removed automatically.

An Extension cannot be disabled or removed while another enabled Extension still depends on it unless the dependent Extension is disabled or removed in the same operation.

If ownership of generated or remote state is ambiguous, Pactwright must preserve it and report the ambiguity rather than delete user state.

---

# 11. Extension Manifest and Capability Resolution

A Pactwright Extension manifest declares its integration contract.

Conceptually:

```yaml
id: graph-review
package: "@pactwright/graph-review"
version: ...
pactwright: ...

dependencies:
  extensions:
    - project-intelligence

agent_capabilities:
  - graph-review

github:
  profile: graph-review
```

It may additionally register extension-owned graph types.

At runtime:

```text
core capabilities
+
enabled Extension capabilities
=
required capability set
```

The selected Agent Pack must satisfy the complete set.

If it does not:

- the operation fails before activation or canonical mutation;
- Pactwright must not silently switch Agent Packs;
- the current valid configuration, lock and generated environment remain intact.

---

# 12. Resolution, Versioning and Locking

Pactwright resolves the complete execution environment.

Runtime, Pactwright Extensions and Agent Packs are independently versioned and reviewable. External Production Skills are resolved to exact revisions or versions needed by the selected Agent Pack.

For Production Skills this means:

```text
source
→ exact revision/version
→ integration manifest
→ capability bindings
→ referenced skills
→ selected Production Extension Packs
```

The lock must record enough immutable identity to reproduce the result.

Conceptually:

```yaml
runtime:
  version: ...

extensions:
  graph-review:
    version: ...
    hash: ...
    dependencies:
      project-intelligence: ...

agent_pack:
  source: "@pactwright/standard"
  version: ...
  hash: ...

production_skills:
  video-production-skills:
    source: ...
    revision: ...
    integration_hash: ...
    skills:
      - video-production
      - video-evaluate
    extension_packs:
      - ...
```

Pactwright does not copy or reinterpret a Production Skills repository's own internal lock graph.

```text
Production Skills lock
→ owned by Production Skills

Pactwright lock
→ records Pactwright's exact dependency on it
```

The package-manager lock and `.pactwright/lock.yml` have different responsibilities:

```text
package-manager lock
→ exact installed packages

.pactwright/lock.yml
→ exact resolved Pactwright semantic and AI execution environment
```

They must agree on the installed Pactwright and package-backed component versions they both identify.

Configuration expresses intent. The locks record exact resolved state at their respective layers.

---

# 13. Validation

Before accepting a resolved environment, Pactwright validates:

- runtime compatibility;
- package-manager and Pactwright lock consistency;
- Extension dependencies;
- required Agent Pack capabilities;
- Production Skills manifest syntax;
- Production Skills compatibility;
- referenced skill existence;
- selected Production Extension Pack existence;
- deterministic skill identity;
- source/revision availability;
- adapter representability.

If two imported skill families produce ambiguous skill identities, Pactwright must fail resolution rather than silently select one.

Compatibility validation does not imply domain quality.

A structurally valid `video-evaluate` skill is not automatically a good evaluator. Its quality belongs to the Production Skills benchmark.

---

# 14. Synchronisation and Adapters

`pactwright sync` materialises the configured and locked execution environment.

Conceptually:

```text
configuration
+ lock
+ Extensions
+ Agent Pack
+ Production Skills
        ↓
pactwright sync
        ↓
generated execution environment
```

Synchronisation must:

1. load configuration and lock;
2. load enabled Extensions;
3. derive required capabilities;
4. load the Agent Pack;
5. resolve Production Skills and selected Extension Packs;
6. validate the complete composition;
7. assemble agents and skills;
8. render the active adapter;
9. render Pactwright-managed repository integration.

Repeated `sync` with identical locked inputs **must produce identical generated output**.

Adapters convert the resolved environment into an AI execution surface.

Initial example:

```text
resolved Pactwright environment
        ↓
Claude Code adapter
        ↓
.claude/
```

Adapters do not define Pactwright semantics.

Pactwright may regenerate only files or managed regions it explicitly owns.

User-authored source, unrelated workflows and external Production Skills repositories must remain untouched.

`pactwright sync` changes local generated integration only. Remote GitHub reconciliation remains owned by `pactwright github sync` and the GitHub Integration specification.

---

# 15. Upgrade Model

Pactwright owns upgrade orchestration. The project's package manager owns package installation.

The command surface is:

```text
pactwright upgrade
pactwright upgrade --to <version>
pactwright agent-pack upgrade
pactwright agent-pack use <source>
pactwright extension upgrade <id>
```

## Pactwright runtime upgrade

`pactwright upgrade` upgrades the Pactwright runtime itself to the latest compatible release.

`pactwright upgrade --to <version>` targets an explicit release and may be used for controlled forward upgrade or rollback.

The runtime upgrade flow is:

```text
current Pactwright runtime
→ detect project package manager
→ resolve target Pactwright release
→ package manager updates Pactwright package
→ re-enter through newly installed Pactwright runtime
→ validate complete environment compatibility
→ run required migrations
→ update .pactwright lock
→ pactwright sync
→ pactwright validate
```

Pactwright must not implement a parallel package installer.

It delegates package replacement to the detected project package manager.

Package-manager detection should prefer the repository's explicit `packageManager` declaration and otherwise use unambiguous project package-manager state such as its lockfile. Pactwright must not silently switch package managers.

After package replacement, migration, lock regeneration, synchronisation and validation must be performed by the **newly installed runtime**, not by the old runtime that initiated the upgrade.

A runtime upgrade must not silently major-upgrade Extensions, Agent Packs, Production Skills or Production Extension Packs. Their configured constraints remain authoritative unless the user explicitly upgrades those components.

If the target runtime has no compatible complete environment, the operation must fail clearly rather than silently substitute components or reinterpret canonical state.

Canonical Project Graph state must never be left partially migrated. Upgrade implementation must preserve enough previous package/configuration/lock state to restore or explicitly target the previous runtime when an upgrade cannot complete safely.

## Agent Pack upgrade

`pactwright agent-pack upgrade` upgrades the currently selected Agent Pack within its configured compatibility constraints.

It must validate the complete required capability set before changing the current lock or generated environment.

`pactwright agent-pack use <source>` remains the explicit operation for changing Agent Pack identity.

## Extension upgrade

`pactwright extension upgrade <id>` must:

1. resolve a compatible package;
2. validate the complete Extension dependency graph;
3. validate schema compatibility and the complete required capability set;
4. run **explicitly defined, versioned migrations** where canonical Extension state requires migration;
5. update package/configuration and lock state only after the target environment is valid;
6. run `pactwright sync`;
7. report GitHub changes requiring reconciliation.

An Extension upgrade must not silently reinterpret canonical Project Graph state.

A dependency upgrade must satisfy every enabled dependent Extension before the current lock changes.

All upgrade paths must protect canonical Project Graph state from partial mutation and leave the environment either valid at the target version or recoverable to its previous valid state.

---

# 16. `pactwright doctor`

Pactwright exposes a read-only environment health command:

```text
pactwright doctor
```

`doctor` diagnoses distribution and execution-environment problems without mutating project state.

It should report at least:

```text
installed Pactwright runtime version
detected package manager
package-manager declaration/lock consistency
available runtime upgrade where determinable
Pactwright configuration validity
package-manager lock ↔ .pactwright/lock.yml drift
runtime ↔ Extension compatibility
runtime ↔ Agent Pack compatibility
missing required capabilities
missing/unresolvable Production Skills dependencies
pending or incomplete migrations
generated adapter/integration drift
validation failures affecting the resolved environment
```

The command should distinguish:

```text
healthy
warning
action required
```

without inventing a separate health-state subsystem.

`doctor` must provide concrete remediation commands where the correction is deterministic, for example:

```text
pactwright upgrade
pactwright agent-pack upgrade
pactwright extension upgrade <id>
pactwright sync
pactwright validate
```

It must not automatically execute those mutations.

GitHub remote-health diagnosis remains owned by the GitHub Integration surface rather than making `doctor` a second GitHub reconciler.

---

# 17. Production Skill Commands

Production Skills may decompose skills into narrower commands for composition, testing and benchmarks.

These commands do not automatically become Pactwright commands.

Pactwright commands remain Contract-driven lifecycle or Extension operations.

---

# 18. Authority Boundaries

Semantic authority flows from stable Pactwright semantics towards increasingly specialised execution:

```text
Pactwright Core
        ↓
Extension semantics within owned scope
        ↓
repository policy
        ↓
Contract + Brief
        ↓
Agent Pack
        ↓
Production Skills
        ↓
Production Extension Packs
```

Lower layers may specialise execution. They cannot override higher-layer semantics.

Examples:

- an Agent Pack cannot bypass a lifecycle Gate;
- a Production Skill cannot weaken the Contract;
- a Production Extension Pack cannot register Project Graph semantics;
- an Extension cannot redefine core Evidence meaning.

---

# 19. Project Knowledge Boundary

Reusable expertise and project-specific knowledge have different owners.

```text
Production Skills
→ reusable general expertise

Production Extension Packs
→ reusable specialised expertise

Project Intelligence
→ project-specific learned knowledge
```

Production Skills and Agent Packs should not become hidden project memory.

---

# 20. Provider Boundary

Pactwright should not recreate:

```text
provider registry
model router
task catalogue
generation routing
```

for work already owned by Production Skills.

Production Skills may know how to invoke coding tools, research services, image/video/audio models or other domain tooling.

Pactwright records only the provenance required for Contract fulfilment, Evidence, reproducibility or auditability where applicable.

---

# 21. Evaluation Model and Public Interface

Pactwright Evaluation answers:

> Can the resolved AI execution environment correctly perform its Pactwright responsibilities?

The supported runner is:

```text
pactwright eval
```

Evaluation is layered:

```text
Pactwright Core
→ core responsibility evaluation

Pactwright Extension
→ extension responsibility evaluation

Agent Pack
→ pack-specific Pactwright evaluation

Production Skills
→ domain benchmark and evaluation
```

Core evaluation should cover Contract fidelity, scope discipline, Brief quality, Review quality, Evidence accuracy and lifecycle compliance.

Extension evaluations cover the responsibilities owned by each Extension.

Production-domain quality remains owned by Production Skills benchmarks.

---

# 22. Production Benchmark Ownership

Domain-specific benchmarks stay in Production Skills.

Pactwright tests the integration boundary, for example whether an Agent Pack using several Production Skills correctly satisfies a Pactwright Brief or whether Review identifies Contract violations.

Pactwright should not silently execute entire external Production Skills benchmark suites as part of normal Pactwright evaluation.

---

# 23. Evaluation Cases and Artefact Ownership

Evaluation cases belong to the component that owns the behaviour:

```text
core responsibility
→ core case

Extension responsibility
→ Extension case

Agent Pack behaviour
→ Agent Pack case

Production Skill behaviour
→ Production Skills benchmark
```

Cases are versioned with their owning component.

Pactwright evaluation may combine deterministic and semantic assertions.

Prefer deterministic validation where possible, including:

- valid graph mutation;
- valid capability routing;
- lifecycle compliance;
- required output presence;
- forbidden mutation absence;
- Contract lineage preservation.

Semantic evaluation may assess usefulness, unsupported assumptions, scope creep, unnecessary complexity and the quality of Contract, Brief or Review output.

Routine evaluation results and reports are generated artefacts, not Project Graph nodes or canonical project truth.

---

# 24. Baselines and Regression Reporting

A released Agent Pack establishes a baseline that can be compared with a candidate environment.

The supported interface is:

```text
pactwright eval \
  --baseline <released-pack-or-baseline> \
  --candidate <candidate-pack-or-environment>
```

Reports must expose regressions at meaningful dimensions such as:

```text
capability
agent
evaluation case
Agent Pack change
prompt change
Production Skills upgrade
Production Extension Pack change
Extension capability change
model adaptation
```

Do not rely on one opaque aggregate score to decide whether a candidate is better.

A regression report must make the affected capability/case visible so a release decision is reviewable.

---

# 25. Anti-Overengineering Constraints

Do not introduce initially:

```text
Agent Pack composition
generic executable plugin system
generic skill dependency solver
one Pactwright Extension per production domain
generic provider registry
generic task catalogue
Production Extension Pack interpretation engine
cross-family pack dependency language
universal domain benchmark framework
hosted evaluation
automatic prompt optimisation/promotion
parallel Pactwright package installer
doctor auto-fix engine
```

The required bridge is deliberately small:

```text
Production Skills
→ optional integrations/pactwright.yml

Agent Pack
→ imports compatible Production Skills

Pactwright
→ resolves
→ validates
→ locks
→ exposes through adapter
```

Add more machinery only when real integrations demonstrate that this model is insufficient.

---

# 26. Core Invariants

1. Pactwright Core defines stable semantics.
2. Pactwright Extensions add optional Pactwright semantics.
3. Agent Packs implement Pactwright AI responsibilities.
4. A project selects one Agent Pack.
5. One Agent Pack may compose multiple Production Skills families.
6. Production Skills remain independently usable without Pactwright.
7. Production Skills integration is optional.
8. A Production Skills integration manifest is not a Pactwright Extension manifest.
9. Production Extension Packs remain owned by Production Skills.
10. Pactwright Extensions and Production Extension Packs are different concepts.
11. Production domains do not create new Pactwright capabilities when existing responsibilities suffice.
12. Capability identity is independent from agent and skill identity.
13. Production Skills selection flows through the Agent Pack.
14. Configuration expresses desired state; locks record exact resolved state at their respective layers.
15. Package-manager and Pactwright lock state must agree on package-backed Pactwright components.
16. Runtime, Extensions and Agent Packs may version independently under compatibility constraints.
17. Extension dependencies are installed and locked through the same managed path as explicit Extensions.
18. Enabled Extension dependencies cannot be removed underneath dependants.
19. `pactwright upgrade` upgrades the Pactwright runtime, not the Agent Pack.
20. Pactwright owns upgrade orchestration; the detected project package manager owns package installation.
21. Post-install upgrade work is performed by the newly installed runtime.
22. Runtime upgrade does not silently major-upgrade other Pactwright components.
23. Explicit runtime targets support controlled upgrade or rollback.
24. Explicit migrations are required when an upgrade changes canonical stored semantics.
25. Upgrade paths protect canonical Project Graph state from partial migration.
26. Repeated synchronisation with identical locked inputs produces identical generated output.
27. `pactwright doctor` is read-only and diagnoses environment drift and compatibility problems.
28. Adapters project the resolved environment but do not define semantics.
29. Production Skill commands do not automatically become Pactwright commands.
30. Evaluation cases remain owned and versioned by the component whose behaviour they test.
31. Evaluation results are generated artefacts, not Project Graph truth.
32. Baseline comparison reports regressions by meaningful capability/agent/case dimensions.
33. Pactwright evaluates Pactwright responsibility fulfilment.
34. Production-domain benchmarks remain owned by Production Skills.
35. Project-specific learned knowledge belongs in Project Intelligence.
36. Provider and model routing remain outside Pactwright where Production Skills already own them.

---

# 27. Current Implementation Baseline

Pactwright `0.0.1` already implements important parts of this model:

- project-level Agent Pack selection;
- `@pactwright/standard`;
- `delivery-specification`;
- `delivery-execution`;
- `delivery-review`;
- agent definitions;
- skills attached to agents;
- adapter configuration;
- Extension configuration and loading;
- locking concepts;
- synchronisation foundations;
- evaluation infrastructure.

The canonical public distribution surface is:

```text
pnpm add -D pactwright
pnpm pactwright init

pactwright upgrade
pactwright doctor

pactwright extension add
pactwright extension remove
pactwright extension upgrade

pactwright agent-pack use
pactwright agent-pack upgrade

pactwright sync
pactwright validate
pactwright eval
```

The redesigned architecture preserves the working mechanisms while simplifying the older domain-specific capability model.

The principal new integration is:

```text
Production Skills repository
→ optional Pactwright integration manifest
→ Agent Pack import
→ capability-to-skill bindings
```

This adds multi-Production-Skills composition, Production Extension Pack selection, Production Skills revision locking, integration validation and explicit Pactwright vs Production Skills evaluation ownership.

It extends the Agent Pack model rather than introducing a second AI composition system.

---

# 28. Relationship to Other Canonical Specifications

```text
01 Pactwright Core System and Lifecycle
→ Contracts, Delivery and core capabilities

02 Distribution, Agent Packs, Extensions and Evaluation
→ composition, distribution, upgrades, diagnosis and AI execution

03 Project Intelligence
→ project-specific knowledge

04 Graph Review
→ specialist Project Graph analysis

05 Assets and Publication
→ approved durable outputs

06 Operations
→ real-world exposure and feedback

07 GitHub Integration
→ GitHub automation, provisioning and projection

08 Open-Source Project Organisation
→ repository and ecosystem structure
```

Extension-specific semantics remain in their owning specifications.

Production-specific semantics remain in independent Production Skills repositories.

---

# 29. Governing Rule

> **Pactwright defines semantic responsibilities. Pactwright Extensions add optional system semantics. The selected Agent Pack maps responsibilities to agents and may compose multiple independently maintained Production Skills through optional Pactwright integration manifests. Pactwright owns upgrade orchestration and environment diagnosis while the project's package manager owns package installation. Production Skills retain ownership of their workflows, commands, Extension Packs, tools and benchmarks. Pactwright resolves, validates, locks, synchronises, upgrades and evaluates the resulting environment without absorbing production-domain semantics.**

---

**Pactwright Distribution, Agent Packs, Extensions and Evaluation v1**