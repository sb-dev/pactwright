# Pactwright Distribution, Agent Packs, Extensions and Evaluation

## 1. Purpose

This specification defines how Pactwright is packaged, configured, extended, composed with AI capabilities, synchronised, locked, upgraded and evaluated.

The architecture is:

```text id="dauycn"
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

```text id="oz70sz"
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

- Pactwright distribution;
- project configuration;
- locking and reproducibility;
- Agent Packs;
- capability resolution;
- Pactwright Extensions;
- Production Skills integration;
- Production Extension Pack resolution;
- adapters;
- synchronisation;
- upgrades;
- compatibility validation;
- Pactwright-level evaluation.

It does not own:

- Contract or lifecycle semantics;
- extension-specific graph semantics;
- domain production workflows;
- Production Skill commands;
- Production Extension Pack internals;
- domain-specific benchmarks.

---

# 3. Project Customisation Model

The repository-level Pactwright customisation mechanisms are:

```text id="uwr76b"
Agent Pack
Pactwright Extensions
Adapter
Lifecycle configuration
GitHub configuration
```

Production Skills are not another peer-level project setting.

They are composed through the selected Agent Pack.

Conceptually:

```yaml id="wjej0o"
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

Configuration records desired state.

`.pactwright/lock.yml` records the exact resolved environment.

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

```text id="0o5ti1"
delivery-specification
delivery-execution
delivery-review
```

Extensions may add genuinely distinct responsibilities such as:

```text id="uce6ng"
intelligence-triage
intelligence-promotion
intelligence-context
graph-review
operations-analysis
```

Do not create capabilities such as:

```text id="xeza62"
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

```text id="s2zk98"
capability mappings
agents
prompts
direct skills
Production Skills imports
evaluation cases
```

Conceptually:

```yaml id="thfu3g"
capabilities:
  delivery-specification: spec
  delivery-execution: implementer
  delivery-review: reviewer
```

Agent identity is not capability identity.

For example:

```text id="nw9oh1"
delivery-execution
→ implementer
```

or:

```text id="o6wh4v"
delivery-execution
→ producer
```

represent the same Pactwright responsibility.

A project selects **one Agent Pack**.

Agent Pack composition is not required because one Agent Pack may already compose multiple Production Skills families.

---

# 6. Production Skills

Production Skills are independently maintained repositories containing specialised production expertise.

Examples include:

```text id="gtsasy"
software-engineering-skills
ui-ux-design-skills
deep-research-skills
video-game-development-skills
video-production-skills
music-production-skills
narrative-production-skills
```

They own their own:

```text id="gou3q7"
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

```text id="osz47u"
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

```text id="5prxbv"
integrations/
└── pactwright.yml
```

The manifest declares how its skills can participate in Pactwright responsibilities.

Conceptually:

```yaml id="gh99k1"
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

```text id="reye6w"
identity
Pactwright compatibility
capability → skill bindings
Production Extension Pack discovery
resolution metadata where necessary
```

It must not define:

```text id="b19lmm"
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

```yaml id="2lythd"
production_skills:
  - source: github:sb-dev/narrative-production-skills
  - source: github:sb-dev/music-production-skills
  - source: github:sb-dev/video-production-skills
```

Multiple Production Skills may contribute to the same capability:

```text id="s8hjzf"
delivery-execution
        ↓
producer
        ├── narrative-production
        ├── music-production
        └── video-production
```

Likewise:

```text id="n4regk"
delivery-review
        ↓
reviewer
        ├── narrative-evaluate
        ├── music-evaluate
        └── video-evaluate
```

Pactwright must therefore assume:

```text id="xpru8k"
one capability
→ one agent
→ potentially many Production Skills
```

not:

```text id="9o4zcx"
one capability
→ one domain
```

A children's television project may combine Narrative, Music and Video.

A game may combine Game Development, Game Assets, Narrative, Music and UI/UX.

A software product may combine Software Engineering, UI/UX and Deep Research.

---

# 9. Production Extension Packs

A Production Extension Pack adds specialised production knowledge to one Production Skills family.

Examples:

```text id="v2usip"
software-engineering-skills
+ spring-boot
+ kafka-event-driven

ui-ux-design-skills
+ mobile-native

video-game-development-skills
+ godot
+ arcade

deep-research-skills
+ market-research
```

An Agent Pack may select packs while importing the owning family:

```yaml id="jdy7k4"
production_skills:
  - source: narrative-production-skills
    extension_packs:
      - childrens-television
```

Pactwright owns:

```text id="iw8cwy"
selection
resolution
locking
availability
```

The Production Skills family owns:

```text id="n0nf9x"
pack meaning
production rules
validation
evaluation
behavioural effect
```

A Production Extension Pack is not a Pactwright Extension.

```text id="z2ityr"
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

The redesigned first-party extension set is:

```text id="h9pygu"
Project Intelligence
Graph Review
Assets / Publication
Operations
```

Conceptually:

```text id="r9la6p"
Pactwright Project Graph
├── Delivery Graph                 core
├── Project Intelligence           optional
├── Graph Review                   optional
├── Assets / Publication           optional
└── Operations                     optional
```

Extensions may depend on other Extensions when there is a real semantic dependency.

Expected examples include:

```text id="p0nm8d"
Graph Review
→ Project Intelligence

Operations
→ Project Intelligence
```

because durable findings are routed through Project Intelligence.

Dependencies must not be introduced merely for implementation convenience.

---

# 11. Extension Manifest and Capability Resolution

A Pactwright Extension manifest declares its integration contract.

Conceptually:

```yaml id="ntxb0o"
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

```text id="kbv47c"
core capabilities
+
enabled Extension capabilities
=
required capability set
```

The selected Agent Pack must satisfy the complete set.

If it does not:

- the operation fails;
- Pactwright must not silently switch Agent Packs;
- the current valid lock remains intact.

---

# 12. Resolution and Locking

Pactwright resolves the complete AI execution environment.

For Production Skills this means:

```text id="4sqpu8"
source
→ exact revision/version
→ integration manifest
→ capability bindings
→ referenced skills
→ selected Production Extension Packs
```

The lock should record enough immutable identity to reproduce the result.

Conceptually:

```yaml id="ekgzmh"
runtime:
  version: ...

extensions:
  graph-review:
    version: ...
    hash: ...

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

```text id="qmr6kj"
Production Skills lock
→ owned by Production Skills

Pactwright lock
→ records Pactwright's exact dependency on it
```

---

# 13. Validation

Before accepting a resolved environment, Pactwright validates:

- runtime compatibility;
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

A structurally valid `video-evaluate` skill is not automatically a good evaluator.

Its quality belongs to the Production Skills benchmark.

---

# 14. Synchronisation and Adapters

`pactwright sync` materialises the configured and locked execution environment.

Conceptually:

```text id="ioehx9"
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

Synchronisation should:

1. load configuration and lock;
2. load Extensions;
3. derive required capabilities;
4. load the Agent Pack;
5. resolve Production Skills and selected Extension Packs;
6. validate the complete composition;
7. assemble agents and skills;
8. render the active adapter;
9. render Pactwright-managed repository integration.

The same locked inputs must produce equivalent output.

Adapters convert the resolved environment into an AI execution surface.

Initial example:

```text id="eubj2n"
resolved Pactwright environment
        ↓
Claude Code adapter
        ↓
.claude/
```

Adapters do not define Pactwright semantics.

Pactwright may only regenerate files it explicitly owns.

User-authored source and external Production Skills repositories must remain untouched.

---

# 15. Upgrades

Environment-changing operations include:

```text id="knmffj"
Pactwright upgrade
Extension add/remove/upgrade
Agent Pack switch
Production Skills revision change
Production Extension Pack change
```

Pactwright must resolve and validate the complete target environment before replacing the current lock or generated integration.

An incompatible change must not leave:

- partial configuration;
- partial lock state;
- partial adapter output;
- invalid canonical Project Graph mutation.

---

# 16. Production Skill Commands

Production Skills may decompose skills into narrower commands.

Example:

```text id="j8z2iw"
software-debug
├── reproduce
├── gather-evidence
├── isolate-root-cause
├── implement-fix
└── verify-regression
```

These are Production Skills operations used for composition, testing and benchmarks.

They do not automatically become Pactwright commands.

Pactwright commands remain Contract-driven lifecycle operations.

---

# 17. Authority Boundaries

Semantic authority flows from stable Pactwright semantics towards increasingly specialised execution:

```text id="kmow7m"
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

Lower layers may specialise execution.

They cannot override higher-layer semantics.

Examples:

- an Agent Pack cannot bypass a lifecycle Gate;
- a Production Skill cannot weaken the Contract;
- a Production Extension Pack cannot register Project Graph semantics;
- an Extension cannot redefine core Evidence meaning.

---

# 18. Project Knowledge Boundary

Reusable expertise and project-specific knowledge have different owners.

```text id="k8t22h"
Production Skills
→ reusable general expertise

Production Extension Packs
→ reusable specialised expertise

Project Intelligence
→ project-specific learned knowledge
```

Examples:

```text id="o1v122"
"Kafka consumers should consider idempotency"
→ Production Skills
```

```text id="77bruj"
"This project's payment consumer requires ordering rule X"
→ Project Intelligence
```

Production Skills and Agent Packs should not become hidden project memory.

---

# 19. Provider Boundary

Pactwright should not recreate:

```text id="xam9ec"
provider registry
model router
task catalogue
generation routing
```

for work already owned by Production Skills.

Production Skills may know how to invoke coding tools, research services, image/video/audio models or other domain tooling.

Pactwright records only the provenance required for:

```text id="t40y09"
Contract fulfilment
Evidence
reproducibility
auditability
```

where applicable.

---

# 20. Evaluation Model

Pactwright Evaluation answers:

> Can the resolved AI execution environment correctly perform its Pactwright responsibilities?

Evaluation is layered:

```text id="dbgviz"
Pactwright Core
→ core responsibility evaluation

Pactwright Extension
→ extension responsibility evaluation

Agent Pack
→ pack-specific Pactwright evaluation

Production Skills
→ domain benchmark and evaluation
```

Pactwright core evaluation should cover concerns such as:

```text id="kn01rt"
Intent interpretation
Contract quality
Contract preservation
Brief quality
scope discipline
Review quality
Evidence accuracy
lifecycle compliance
```

Extension evaluations cover their own responsibilities.

Examples:

```text id="8y7hs4"
Project Intelligence
→ triage / promotion / context

Graph Review
→ supported useful findings

Operations
→ interpretation of operational evidence
```

---

# 21. Production Benchmark Ownership

Domain-specific benchmarks stay in Production Skills.

Examples:

```text id="ic35bi"
software
→ build/tests/regression/scope

UI/UX
→ task clarity/accessibility/state completeness

games
→ playability/soft locks/balance/performance

research
→ evidence quality/citation grounding/confidence

video/music/narrative
→ domain production quality
```

Pactwright instead tests the integration boundary.

Example:

```text id="dht1fk"
delivery-execution
+
children-TV Agent Pack
+
Narrative/Music/Video Production Skills
        ↓
Does the result satisfy the Pactwright Brief?
```

or:

```text id="n8kwap"
delivery-review
+
software Agent Pack
+
Software/UIUX Production Skills
        ↓
Does Review correctly identify Contract violations?
```

Pactwright should not silently execute entire external Production Skills benchmark suites as part of normal Pactwright evaluation.

---

# 22. Evaluation Cases

Evaluation cases belong to the component that owns the behaviour.

```text id="b12ddx"
core responsibility
→ core case

Extension responsibility
→ Extension case

Agent Pack behaviour
→ Agent Pack case

Production Skill behaviour
→ Production Skills benchmark
```

Pactwright evaluation may combine deterministic and semantic assertions.

Prefer deterministic validation where possible.

Examples include:

- valid graph mutation;
- valid capability routing;
- lifecycle compliance;
- required output presence;
- forbidden mutation absence;
- Contract lineage preservation.

Semantic evaluation may assess:

- usefulness;
- unsupported assumptions;
- scope creep;
- unnecessary complexity;
- quality of Contract, Brief or Review output.

---

# 23. Evaluation Regression

Evaluation should support comparing a candidate environment against an accepted baseline.

Useful regression dimensions include:

```text id="o5lvei"
Agent Pack change
prompt change
Production Skills upgrade
Production Extension Pack change
Extension capability change
model adaptation
```

Report dimension-level regressions rather than relying on one opaque aggregate score.

---

# 24. Anti-Overengineering Constraints

Do not introduce initially:

```text id="rwyzeh"
Agent Pack composition
generic executable plugin system
generic skill dependency solver
one Pactwright Extension per production domain
generic provider registry
generic task catalogue
Production Extension Pack interpretation engine
cross-family pack dependency language
universal domain benchmark framework
```

The required bridge is deliberately small:

```text id="f6i1lg"
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

# 25. Core Invariants

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
14. Configuration expresses desired state; the lock records exact resolved state.
15. The complete environment is validated before activation.
16. Synchronisation is deterministic for identical locked inputs.
17. Adapters project the resolved environment but do not define semantics.
18. Production Skill commands do not automatically become Pactwright commands.
19. Pactwright evaluates Pactwright responsibility fulfilment.
20. Production-domain benchmarks remain owned by Production Skills.
21. Project-specific learned knowledge belongs in Project Intelligence.
22. Provider and model routing remain outside Pactwright where Production Skills already own them.

---

# 26. Current Implementation Baseline

Pactwright `0.0.1` already implements important parts of this model:

- project-level Agent Pack selection;
- `@pactwright/standard`;
- `delivery-specification`;
- `delivery-execution`;
- `delivery-review`;
- agent definitions;
- skills attached to agents;
- adapter configuration;
- Extension configuration;
- locking concepts;
- synchronisation foundations;
- evaluation infrastructure.

The redesigned architecture preserves those mechanisms while simplifying the older domain-specific capability model.

The principal new integration is:

```text id="xz5jhf"
Production Skills repository
→ optional Pactwright integration manifest
→ Agent Pack import
→ capability-to-skill bindings
```

This adds:

- multi-Production-Skills composition;
- Production Extension Pack selection;
- Production Skills revision locking;
- integration validation;
- explicit Pactwright vs Production Skills evaluation ownership.

It extends the Agent Pack model rather than introducing a second AI composition system.

---

# 27. Relationship to Other Canonical Specifications

```text id="flnzai"
01 Pactwright Core System and Lifecycle
→ Contracts, Delivery and core capabilities

02 Distribution, Agent Packs, Extensions and Evaluation
→ composition, distribution and AI execution

03 Project Intelligence
→ project-specific knowledge

04 Graph Review
→ specialist Project Graph analysis

05 Assets and Publication
→ approved durable outputs

06 Operations
→ real-world exposure and feedback

07 GitHub Integration
→ GitHub automation and projection

08 Open-Source Project Organisation
→ repository and ecosystem structure
```

Extension-specific semantics remain in their owning specifications.

Production-specific semantics remain in independent Production Skills repositories.

---

# 28. Governing Rule

> **Pactwright defines semantic responsibilities. Pactwright Extensions add optional system semantics. The selected Agent Pack maps responsibilities to agents and may compose multiple independently maintained Production Skills through optional Pactwright integration manifests. Production Skills retain ownership of their workflows, commands, Extension Packs, tools and benchmarks. Pactwright resolves, validates and locks the resulting environment without absorbing production-domain semantics.**

---

**Pactwright Distribution, Agent Packs, Extensions and Evaluation v1**