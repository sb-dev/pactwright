# Pactwright Core System and Lifecycle

## 1. Purpose

Pactwright is a repository-native system for crafting explicit Contracts from project intent and governing their fulfilment by humans and AI agents.

Its canonical lifecycle is:

```text
Intent
→ transient Contract alternatives
→ Decision
→ canonical Contract
→ Brief
→ Delivery
→ Review
→ Evidence
```

The Contract is the governing artefact.

It defines the authorised outcome and what must be true for the work to be considered successful.

Everything downstream operates under that Contract:

```text
Contract
→ defines what must be true

Brief
→ translates the Contract into focused executable work

Delivery
→ attempts to satisfy the Contract

Review
→ verifies whether the Contract and Brief were satisfied

Evidence
→ records the verified result
```

Pactwright preserves durable project truth while keeping exploratory reasoning, rejected alternatives, intermediate attempts and production-specific working artefacts transient unless another Pactwright semantic explicitly requires them to become durable.

Pactwright is not:

- a generic workflow engine;
- a generic agent orchestration framework;
- a production-skills framework;
- an AI provider router;
- a replacement for Git history;
- a second observability or project-management database.

---

## 2. Scope

This specification is authoritative for:

- Pactwright's core system purpose;
- Delivery Graph semantics;
- Intent, Decision, Contract, Brief and Evidence;
- Contract alternatives;
- core Delivery relationships;
- the Contract-driven lifecycle;
- lifecycle shapes;
- Delivery and Review lifecycle semantics;
- gates and lifecycle policy;
- lifecycle execution state;
- lifecycle transitions;
- core workflow commands;
- derived Delivery state;
- supersession;
- deterministic runtime responsibilities;
- core validation invariants;
- the boundary between Pactwright core, Agent Packs, Production Skills and extensions.

This specification does not define:

- Agent Pack packaging or installation;
- Production Skills integration manifests;
- extension distribution;
- Project Intelligence semantics;
- Graph Review semantics;
- Asset or Publication semantics;
- Operations semantics;
- GitHub projection mechanics;
- provider-specific production workflows;
- domain-specific production stages.

Those concerns belong to their owning canonical specifications or external Production Skills projects.

---

# 3. Core Principle: Pactwright Crafts Contracts

The central Pactwright responsibility is:

> Turn project intent into an explicit, authorised Contract and govern delivery against it.

The Contract must not be reduced to an incidental intermediate artefact inside a generic workflow.

The core progression is:

```text
uncertain intent
      ↓
alternative interpretations and outcomes
      ↓
explicit decision
      ↓
one authorised Contract
      ↓
focused Brief
      ↓
controlled fulfilment
      ↓
verified Evidence
```

This progression compresses uncertainty.

As work advances, Pactwright should retain less speculative material and more precise durable truth.

```text
Intent
↓
small transient alternative set
↓
Decision
↓
canonical Contract
↓
focused Brief
↓
factual Evidence
```

Rejected reasoning and obsolete attempts remain recoverable through Git, discussion history or execution provenance where necessary.

They are not normal Project Graph context.

---

# 4. Project Graph and Delivery Graph

The Pactwright Project Graph is the repository-native graph of canonical Pactwright state.

The **Delivery Graph** is its required core subgraph.

Optional extensions may contribute independently owned Project Graph semantics.

Conceptually:

```text
Pactwright Project Graph
├── Delivery Graph                  required
├── Project Intelligence            optional
├── Graph Review                    optional
├── Assets / Publication            optional
└── Operations                      optional
```

The Delivery Graph owns:

```text
Intent
Decision
Contract
Brief
Evidence
```

Optional extensions may:

- register additional node and edge types;
- read compatible Delivery state;
- contribute context to Delivery;
- continue from completed Delivery into specialised post-Delivery semantics.

They must not redefine the meaning of Delivery Graph records.

---

# 5. Canonical State

The Project Graph stores current durable truth.

Git stores history.

Execution state stores transient progression.

AI reasoning remains transient unless it produces a canonical Pactwright record through an authorised mutation path.

This gives three distinct layers:

```text
Project Graph
→ durable semantic truth

Execution state
→ current runtime progression

Git
→ historical repository evolution
```

These layers must not be collapsed.

For example:

- a Review attempt is not automatically a Project Graph node;
- a lifecycle gate is not automatically a Decision;
- an intermediate video storyboard is not automatically a Pactwright node;
- an implementation attempt is not automatically Evidence;
- a Git commit is not itself a Pactwright Contract or Project Graph revision.

---

# 6. Core Delivery Graph Nodes

The core Delivery Graph contains five durable node types:

```text
intent
decision
contract
brief
evidence
```

Each node owns information that is not redundantly owned by another node.

| Node | Owns |
|---|---|
| Intent | WHY / WHAT is wanted |
| Decision | CHOICE / AUTHORITY / RATIONALE |
| Contract | AUTHORISED BEHAVIOUR / OUTCOME |
| Brief | DELIVERY DELTA / EXECUTION CONTEXT |
| Evidence | VERIFIED RESULT |

Downstream records reference upstream truth instead of reproducing it.

---

# 7. Intent

An Intent captures a desired project change, problem or outcome before its authorised solution has been selected.

It owns:

- the problem or opportunity;
- desired outcome;
- important constraints;
- important non-goals;
- context necessary to understand what is being requested.

An Intent must not become a delivery plan.

It should not contain:

- implementation inventories;
- production workflow details;
- agent configuration;
- rejected solution detail;
- verification implementation;
- lifecycle-shape internals.

An Intent may exist without any subsequent Decision.

That is valid incomplete graph state.

---

# 8. Contract Alternatives

Contract alternatives represent genuinely different candidate interpretations or solutions for an Intent.

They are transient.

They are not Delivery Graph nodes.

Conceptually:

```text
Intent
→ Contract alternative A
→ Contract alternative B
→ Contract alternative C
```

Only the selected direction becomes canonical.

Rejected alternatives should disappear from normal working context once the Intent is resolved.

Historical investigation may recover them from:

- GitHub discussion;
- session history;
- execution provenance;
- Git history where applicable.

Pactwright should avoid turning rejected alternatives into permanent graph clutter.

---

# 9. Decision

A Decision resolves an Intent.

Allowed outcomes are:

```text
proceed
reject
defer
```

A Decision records:

- the selected outcome;
- the authorised actor;
- concise rationale;
- rejected-option summaries where materially useful.

The actor may be:

```text
human
agent
automation
```

according to repository lifecycle policy.

A Decision is about **what is authorised**.

It is not a generic approval record.

For `proceed`, the Decision selects one canonical Contract.

For `reject` or `defer`, no Contract is selected.

---

# 10. Contract

A Contract is the current authorised definition of success for an approved Intent.

It owns:

- agreed behaviour or outcome;
- scope;
- non-scope;
- acceptance behaviour;
- important constraints;
- important failure cases;
- material requirements that downstream Delivery must preserve.

A Contract must be independently readable as the current authorised agreement.

It must not depend on reconstructing its meaning from:

```text
old Contract
+ amendment
+ later comment
+ implicit implementation assumption
```

When authorised meaning changes materially, Pactwright creates a new canonical Contract through the normal Decision path.

A Contract must not contain:

- rejected alternatives;
- critic transcripts;
- detailed implementation plans;
- transient production reasoning;
- speculative future extensions.

---

# 11. Brief

A Brief translates a canonical Contract into focused executable work.

It is created after inspecting relevant current project and repository state.

A Brief owns:

- relevant delivery areas;
- delivery approach;
- relevant existing patterns;
- required changes or outputs;
- required verification;
- delivery-specific constraints.

It should not repeat:

- the original Intent;
- the complete Contract;
- Decision rationale;
- rejected alternatives.

The Brief is downstream of the Contract.

It may refine **how** the Contract will be fulfilled but may not weaken or reinterpret **what** the Contract requires.

Lifecycle shape selection occurs around Brief creation, but the exact persistence location of the resolved shape identity is part of the lifecycle-shape storage and locking design rather than a Brief schema requirement.

---

# 12. Contract Authority

The Contract constrains all downstream execution.

```text
Contract
   ↓ constrains
Brief
   ↓ constrains
Lifecycle execution
   ↓
Delivery
   ↓
Review
```

A Brief, lifecycle shape, Agent Pack or Production Skill must not silently weaken Contract requirements.

If execution discovers that the authorised outcome itself must change, the work returns to Contract semantics.

It must not encode the effective change as an implementation workaround.

---

# 13. Delivery and Review Are Processes

Delivery and Review are lifecycle responsibilities.

They are not core graph node types.

```text
Brief
→ Delivery
→ Review
→ Evidence
```

Delivery attempts to realise the Brief.

Review determines whether the latest delivered state satisfies the applicable Contract and Brief requirements.

Intermediate:

- attempts;
- drafts;
- reviewer reasoning;
- retries;
- corrections;
- working artefacts

remain execution state unless another Pactwright semantic explicitly promotes them into durable Project Graph state.

---

# 14. Evidence

Evidence closes successful core Delivery.

Evidence records what actually happened during Delivery and verification.

It owns:

- meaningful delivered changes or outputs;
- verification performed;
- verification results;
- deviations;
- known residual risks;
- relevant follow-up work.

Evidence must be factual and compact.

It must not reproduce:

- the Contract;
- the Brief;
- full review transcripts;
- implementation reasoning;
- production-workflow history.

Evidence means:

> This Delivery was completed and verified against its governing requirements.

Evidence does not by itself mean that an output:

- was deployed;
- was published;
- reached users;
- performed successfully in production;
- produced its intended real-world impact.

Those are optional post-Delivery semantics.

Examples:

```text
software:

Evidence
→ Operations Deployment
```

```text
published output:

Evidence
→ Asset
→ Publication
```

---

# 15. Core Delivery Relationships

Canonical relationships use the shared typed-edge graph.

Core Delivery relationships are:

```text
decision --resolves----> intent
decision --selects-----> contract
brief    --decomposes--> contract
evidence --evidences---> brief
node     --supersedes--> same node type
```

Rules:

- a `proceed` Decision resolves one Intent and selects one canonical Contract;
- a `reject` or `defer` Decision resolves the Intent without selecting a Contract;
- a Brief decomposes one canonical Contract;
- Evidence evidences the current Brief;
- supersession links one durable record to its replacement;
- optional extensions may register additional cross-graph relationships without changing core Delivery meaning.

---

# 16. Contract-Driven Lifecycle

The Pactwright lifecycle has three conceptual regions:

```text
1. Contract crafting
2. Contract fulfilment
3. Evidence closure
```

Expanded:

```text
Intent
→ Contract alternatives
→ Decision
→ Contract
→ Brief
→ <Lifecycle Shape>
→ Evidence
```

The Contract-crafting spine remains stable.

The lifecycle shape governs how work progresses from the Brief towards Evidence.

This distinction prevents production-domain workflows from redefining Pactwright's core Contract semantics.

---

# 17. Lifecycle Shapes

A lifecycle shape is:

> The domain-neutral topology by which an authorised Brief progresses towards Evidence.

A lifecycle shape begins after a valid Brief exists.

It ends when its successful path is ready for Evidence creation.

A lifecycle shape does not define:

- the production domain;
- domain-specific artefacts;
- production techniques;
- Agent Pack behaviour;
- skill commands;
- provider selection;
- Project Graph semantics.

The same shape may be used across software, UI/UX, video, music, narrative, game development, research and other production domains.

---

# 18. Lifecycle Shape Vocabulary

Pactwright uses a deliberately small shape vocabulary:

```text
delivery
review
gate
transition
```

## Delivery

A Delivery step invokes the current Delivery responsibility.

It means:

> Perform the work required by the currently active Delivery step.

The production meaning is interpreted by the selected Agent Pack and Production Skills.

## Review

A Review step independently evaluates the latest relevant delivered state.

It means:

> Determine whether this state is fit to continue or close under the governing Contract and Brief.

## Gate

A Gate requires configured authority before progression may continue.

A Gate changes progression authority.

It does not change Contract meaning.

## Transition

A Transition connects lifecycle steps.

Transitions may:

- continue forward;
- route to another declared step;
- return to a prior Delivery step for correction.

No additional core lifecycle primitives are required initially.

---

# 19. Domain-Specific Stages Stay Outside Pactwright

Pactwright must not encode production-domain stages such as storyboard, shot generation, edit, mix, master, wireframe, prototype, implementation, migration, grey-box, search map or claim synthesis.

Those concepts belong to Production Skills.

Pactwright models only the domain-independent orchestration around them.

For example:

```text
Brief
→ Delivery
→ Review
→ Gate
→ Delivery
→ Review
→ Evidence
```

may be interpreted differently by different Production Skills without changing Pactwright semantics.

The shape is shared.

The production grammar is not.

---

# 20. Initial Built-In Shape

The initial required built-in shape is:

```text
direct

Brief
→ Delivery
→ Review
→ Evidence
```

This corresponds closely to Pactwright's existing `0.0.1` Delivery behaviour.

`direct` should remain sufficient for work where one main Delivery execution followed by Review is appropriate.

The core architecture must support richer shapes without requiring domain-specific lifecycle semantics.

---

# 21. Reference Lifecycle Shapes

The following patterns illustrate possible domain-neutral topologies. They are reference examples, not mandatory built-ins or a normative catalogue.

## Iterative

```text
Brief
→ Delivery
→ Review
   ├→ Evidence
   └→ Delivery
```

## Checkpointed

```text
Brief
→ Delivery
→ Gate
→ Delivery
→ Review
→ Evidence
```

## Progressive

```text
Brief
→ Delivery
→ Review
→ Gate
→ Delivery
→ Review
→ Delivery
→ Review
→ Evidence
```

These examples show that lifecycle shapes may support repeated Delivery and Review, Gates and corrective transitions without introducing domain-specific stages.

They do not establish required built-ins or justify a generic workflow language.

---

# 22. Cheap-to-Expensive Production

Production Skills research across Narrative, Music and Video supports a common principle:

> Resolve important uncertainty using the cheapest adequate representation before committing to more expensive production where that approach is useful.

Examples include concepts and outlines in Narrative, motifs/MIDI/demos in Music, and storyboards/references in Video.

This is a production doctrine that Pactwright lifecycle shapes should be able to accommodate. It is not a mandatory Pactwright lifecycle progression, and Pactwright does not define a universal sequence of exploration, selection, approval, production and correction stages.

Domain-specific representations and production decisions remain owned by Production Skills.

---

# 23. Shape Selection

Lifecycle shape selection occurs downstream of the Contract, around Brief creation.

Conceptually:

```text
Contract
+ relevant project context
+ lifecycle configuration
        ↓
write Brief
        ↓
resolved lifecycle strategy
```

A lifecycle run must be able to identify which resolved shape definition it is executing.

The exact persistence and identity mechanism is unresolved. It may ultimately use an id, version, lock identity, hash or another reproducible representation.

This specification does not require shape hashing or make shape identity part of Brief identity.

---

# 24. Shape Changes

Changing the lifecycle strategy does not automatically change the Contract.

If the authorised outcome remains valid but another execution strategy is required:

```text
new Brief
--supersedes-->
old Brief
```

If the required outcome itself changes materially:

```text
new Decision
→ new Contract
→ new Brief
```

The test is:

> Did the authorised definition of success change?

If yes, return to Contract semantics.

If no, a Brief-level execution-strategy change may be sufficient.

---

# 25. Shape Invariants

Every valid lifecycle shape must satisfy these invariants:

1. It starts from a valid current Brief.
2. Every Delivery step maps to the core Delivery responsibility.
3. Every Review step maps to the core Review responsibility.
4. Every Gate identifies required authority through lifecycle policy.
5. Every successful path reaches Evidence closure.
6. Evidence cannot represent successful Delivery without Review of the latest delivered state.
7. Corrective transitions use declared routes.
8. Iterative transitions are bounded by policy.
9. The shape cannot modify or weaken Contract semantics.
10. The shape cannot invent new Pactwright capabilities.
11. Domain-specific production stages remain outside the core shape vocabulary.
12. Active shape changes require an explicit Brief-level change.
13. Shape execution state does not become Delivery Graph state.

---

# 26. Lifecycle Shape vs Execution Policy

Topology and policy are separate concerns.

```text
Lifecycle shape
→ what progression paths exist

Execution policy
→ how those paths are operated
```

Policy may determine:

- automatic vs manual execution;
- authorised actor;
- human approval requirements;
- iteration limits;
- remote automation behaviour;
- other execution constraints.

For example, the same shape may use automatic Delivery and Review with a human Gate, or delegate that Gate to an authorised agent under repository policy.

Changing authority should not require creating a different lifecycle shape.

---

# 27. Lifecycle Configuration

Repository lifecycle configuration defines how the lifecycle operates.

The current configuration concept is:

```yaml
version: 1

stages:
  capture-intent:
    execution: manual

  propose-contracts:
    execution: automatic

  approve-contract:
    execution: manual
    actor: human

  write-brief:
    execution: automatic

  deliver-brief:
    execution: automatic

  review:
    execution: automatic

  prepare-evidence:
    execution: automatic
```

The redesigned model should preserve these policy concerns while allowing the Brief-to-Evidence portion to be governed by a lifecycle shape.

The final configuration schema may evolve.

The semantic separation must remain:

```text
Contract-crafting lifecycle
+
selected lifecycle shape
+
execution policy
```

---

# 28. Lifecycle Execution State

Multi-step shapes require runtime progression state.

This state is not Project Graph truth.

It may include:

```text
Brief identity
resolved shape identity
current step
completed steps
gate state
iteration counts
execution status
```

The exact representation of `resolved shape identity`, including whether it uses a version or hash, remains part of the lifecycle-shape storage and locking design.

The exact storage path and serialisation are implementation concerns.

The semantic requirement is:

> Fine-grained lifecycle progression belongs to execution state, not the Delivery Graph.

The Delivery Graph may still simply derive that the Brief is `delivering`.

---

# 29. Phase-Aware Delivery

`/deliver-brief` does not permanently mean:

> Execute the entire Brief in one invocation.

Under lifecycle shapes it means:

> Execute the currently active Delivery step for this Brief.

The command may therefore be invoked several times during one Contract fulfilment, with Reviews and configured Gates controlling progression between declared steps.

No domain phase names or separate `/gate` command are defined by this specification.

The Pactwright command remains domain-neutral. Production Skills determine what work the active Delivery step requires.

---

# 30. Phase-Aware Review

`/review` means:

> Execute the currently active Review step for this Brief.

Review may therefore occur more than once.

Intermediate Review determines whether the current delivered state is ready to progress.

Closing Review determines whether the latest delivered state satisfies the Contract and Brief sufficiently for Evidence.

All Review steps use the same core semantic responsibility.

Different review needs should normally be satisfied by current context, the Agent Pack and appropriate Production Skills rather than by creating new Pactwright Review capabilities.

---

# 31. Delivery Gate vs Contract Decision

A lifecycle Gate and a Contract Decision are different concepts.

## Contract Decision

Answers:

> What outcome is authorised?

It creates durable Delivery Graph truth.

```text
Intent
→ alternatives
→ Decision
→ Contract
```

## Delivery Gate

Answers:

> May this realisation continue?

It changes execution progression only.

```text
Delivery state
→ Gate
→ next Delivery state
```

A Gate does not create a Decision node merely because a human approved something.

Use this test:

```text
Does the approval change WHAT the authorised outcome is?

YES
→ Contract / Decision semantics

NO
→ lifecycle Gate
```

---

# 32. Corrective Routing

Review may identify that work can continue, requires correction, or cannot currently progress.

Pactwright needs enough structured Review output for the runtime to choose among declared transitions, but this specification does not define a formal `pass | revise | blocked` protocol.

When correction is required, Review may identify the relevant Delivery step or responsibility. The runtime validates that the requested corrective route exists in the selected shape.

AI must not invent lifecycle transitions.

---

# 33. Smallest Sufficient Correction

Production Skills research across Narrative, Music and Video supports preserving valid work and correcting the smallest useful production scope that owns a defect.

Pactwright's responsibility is limited to allowing a bounded transition back to an appropriate declared Delivery step.

The Production Skill determines the domain-specific correction unit, what can be preserved and what must be reopened.

Pactwright does not model scenes, shots, musical sections, components or equivalent domain units as lifecycle primitives.

---

# 34. Bounded Iteration

Lifecycle loops must not be unbounded.

Iteration limits are execution policy.

A Review may route back to Delivery through a declared transition, but policy determines how many automatic iterations are permitted before human intervention, a stop condition or another configured escalation.

Pactwright should not create separate retry, revision or repair shapes for this purpose.

A backward transition plus bounded policy is sufficient.

---

# 35. Core Capability Boundary

The stable core AI responsibilities are:

```text
delivery-specification
delivery-execution
delivery-review
```

## delivery-specification

Responsible for:

- understanding Intent;
- generating useful Contract alternatives;
- supporting authorised selection;
- producing the canonical Contract;
- producing a focused Brief.

## delivery-execution

Responsible for:

- understanding the active Delivery step;
- inspecting relevant project and repository state;
- executing the required work;
- respecting Contract and Brief scope;
- preserving valid existing work where possible.

## delivery-review

Responsible for:

- verifying Contract compliance;
- verifying Brief requirements;
- identifying defects;
- detecting scope creep;
- challenging unnecessary complexity;
- identifying whether corrective Delivery is required and where it should return within the declared lifecycle shape.

The selected Agent Pack determines which agent implements each responsibility.

Production Skills provide specialised techniques.

---

# 36. Production-Domain Boundary

Pactwright owns:

```text
Contract semantics
lifecycle topology
transition validity
authority
canonical mutation
Evidence closure
```

Agent Packs own:

```text
AI role composition
agent behaviour
skill composition
```

Production Skills own:

```text
domain workflows
domain artefacts
specialised techniques
skill commands
Extension Packs
domain evaluation
production tools
```

For example:

```text
Pactwright
→ delivery-execution

Agent Pack
→ producer

Production Skills
→ narrative + music + video
```

Pactwright need not understand screenplay structure, musical arrangement, storyboarding or shot construction to govern an episode Contract successfully.

---

# 37. Multiple Production Skills

One Pactwright Delivery may require several Production Skills families.

Examples include Narrative + Music + Video for children's television, or Software Engineering + UI/UX + Deep Research for a software product.

The core lifecycle must therefore assume:

```text
one Delivery responsibility
→ potentially many specialised Production Skills
```

rather than:

```text
one Delivery
→ one domain
```

Composition belongs to the Agent Pack and Production Skills integration model.

It does not require additional lifecycle stages.

---

# 38. Domain Design Artefacts

Production Skills may create domain-specific design or technical artefacts while fulfilling a Pactwright Contract.

Pactwright core does not define a separate class of API, event, interface, component, schema or other technical contracts.

The only core authority rule is:

> Domain-specific artefacts must remain subordinate to the governing Pactwright Contract and must not become competing definitions of the authorised project outcome.

Their semantics remain owned by the relevant Production Skills or project domain.

---

# 39. Context

Delivery and Review may consume relevant context from:

- the governing Delivery lineage;
- current repository state;
- project configuration;
- enabled extensions;
- Project Intelligence when enabled;
- Agent Pack configuration;
- Production Skills.

Context contribution does not transfer semantic ownership.

For example:

```text
Project Intelligence
→ supplies accepted project knowledge

Production Skills
→ supply reusable production expertise

Contract
→ remains authoritative for the current Delivery outcome
```

---

# 40. Core vs Project Intelligence

The Delivery Graph does not depend on Project Intelligence for its basic meaning.

Pactwright core remains usable without Project Intelligence.

When enabled, Project Intelligence may contribute accepted knowledge to:

```text
Contract crafting
Brief generation
Delivery context
Review context
```

Project Intelligence must not silently:

- rewrite a Contract;
- create Delivery truth;
- bypass Decision authority;
- alter lifecycle transitions.

New project knowledge that requires changed authorised behaviour must enter normal Delivery semantics.

---

# 41. Core vs Graph Review

Delivery Review and Graph Review are different responsibilities.

```text
Delivery Review
→ evaluates current Contract fulfilment
→ contributes to Evidence
```

```text
Graph Review
→ evaluates wider Project Graph state
→ produces Findings
→ routes findings through Project Intelligence
```

Graph Review is optional extension behaviour.

It is not another Delivery lifecycle stage.

---

# 42. Core vs Assets / Publication

Core Delivery ends at Evidence.

When Assets / Publication is enabled:

```text
Evidence
→ approval
→ Asset
→ Publication
```

Asset and Publication are post-Delivery semantics.

They must not be inserted into the core Delivery lifecycle.

The extension owns what was approved and published.

The Delivery Graph owns whether the governing Contract was fulfilled.

---

# 43. Core vs Operations

Operations begins when delivered or published work becomes exposed to real-world conditions.

Examples:

```text
Evidence
→ Deployment
→ Observation
```

or:

```text
Evidence
→ Asset
→ Publication
→ Observation
```

Deployment and Observation are post-Delivery extension semantics.

Production performance must not be retroactively written into Delivery Evidence as though it were known during Delivery.

---

# 44. Derived Delivery State

Broad lifecycle state should be derived from canonical graph structure rather than duplicated as mutable node fields.

Core states include:

| Canonical graph state | Derived state |
|---|---|
| Intent, no Decision | `open` |
| Decision = `defer` | `deferred` |
| Decision = `reject` | `rejected` |
| Proceeding Decision + Contract, no Brief | `contracted` |
| Current Brief, no Evidence | `delivering` |
| Current Evidence | `done` |

Fine-grained lifecycle-shape progression remains execution state.

Therefore:

```text
Delivery Graph
→ broad semantic state

execution state
→ exact active lifecycle step
```

`done` means core Contract fulfilment is complete.

It does not imply deployed, published or successful in production.

---

# 45. Supersession

Canonical truth changes explicitly.

## Brief changes

When the Contract remains valid but execution strategy or delivery detail changes:

```text
new Brief
--supersedes-->
old Brief
```

## Contract changes

When authorised meaning changes, return to the Decision stage and create a new authorised Decision and new canonical Contract.

```text
new Decision --supersedes--> previous current Decision
new Contract --supersedes--> previous current Contract
new Brief    --decomposes--> new Contract
```

The previous current Decision and Contract are both superseded so there remains one current authorised direction and one readable canonical Contract.

## Evidence correction

When Evidence itself requires correction:

```text
new Evidence
--supersedes-->
old Evidence
```

A later production Observation does not supersede Evidence merely because real-world performance differs from expectations.

---

# 46. Workflow and Runtime Commands

AI-facing commands expose Contract-driven operations through the active adapter.

The stable adapter command surface includes:

```text
/capture-intent
/propose-contracts
/approve-contract
/write-brief
/deliver-brief
/review
/prepare-evidence
```

These commands express Pactwright lifecycle operations and are distinct from Production Skill commands.

Pactwright also preserves the runtime lifecycle interface already present in the working architecture:

```text
pactwright lifecycle status
pactwright lifecycle next
pactwright lifecycle run
```

`lifecycle status` reports current stage, completed stages, blocking stage, required actor, validation problems and current lineage.

`lifecycle next` determines the next permitted core Delivery lifecycle action without executing it.

`lifecycle run` executes automatic stages until a configured gate is reached, the lifecycle completes, a stage fails or validation fails. It must not skip a configured gate.

---

# 47. `/capture-intent`

Purpose:

> Create a canonical Intent from the requested project outcome.

It should capture enough durable context to support later Contract crafting without prematurely selecting an implementation.

Canonical mutation:

```text
create Intent
```

---

# 48. `/propose-contracts`

Purpose:

> Generate a small set of genuinely different Contract alternatives for an unresolved Intent.

This operation is graph-read-only.

Alternatives remain transient.

Canonical mutation:

```text
none
```

---

# 49. `/approve-contract`

Purpose:

> Authorise the selected Contract direction.

For a proceeding outcome Pactwright creates:

```text
Decision
Contract
decision --resolves--> intent
decision --selects----> contract
```

The user-facing command may be human-oriented.

When lifecycle policy delegates authority to an agent or automation, the runtime may invoke the same underlying decision responsibility without requiring a human-facing interaction.

---

# 50. `/write-brief`

Purpose:

> Translate the current canonical Contract into focused executable work.

The operation:

- inspects relevant project state;
- resolves delivery context;
- resolves the lifecycle strategy;
- creates the current Brief.

Canonical mutation:

```text
Brief
brief --decomposes--> contract
```

The exact storage of resolved lifecycle-shape identity is not defined as part of the Brief schema by this specification.

---

# 51. `/deliver-brief`

Purpose:

> Execute the currently active Delivery step for the current Brief.

It:

- reads current lifecycle execution state;
- determines the active Delivery step;
- invokes `delivery-execution`;
- provides relevant Contract, Brief and project context;
- does not independently choose the next lifecycle transition;
- does not directly mutate the Delivery Graph.

The runtime controls progression.

---

# 52. `/review`

Purpose:

> Execute the currently active Review step for the current Brief.

It:

- evaluates the latest relevant delivered state;
- invokes `delivery-review`;
- reports whether progression may continue or corrective action is required;
- may identify the relevant Delivery step for correction;
- cannot invent transitions;
- does not create Evidence directly.

The exact Review-result vocabulary is not fixed by this specification.

The runtime validates and applies the next permitted lifecycle transition.

---

# 53. `/prepare-evidence`

Purpose:

> Create factual Evidence after successful closing Review.

Before mutation, Pactwright must verify that:

- the Brief is current;
- the latest delivered state has been reviewed;
- the closing Review permits successful Evidence closure;
- no required Gate remains unresolved;
- the Contract and Brief lineage is valid.

Canonical mutation:

```text
Evidence
evidence --evidences--> brief
```

Evidence closes core Delivery.

---

# 54. Runtime Responsibilities

Pactwright runtime owns deterministic mechanics.

These include:

- loading canonical graph state;
- validating graph schemas;
- deriving Project Graph revision;
- deriving broad lifecycle state;
- selecting valid next lifecycle operations;
- loading lifecycle shape and policy;
- tracking shape execution state;
- enforcing gates and authority;
- validating corrective transitions;
- enforcing iteration bounds;
- loading Agent Pack configuration;
- invoking the required semantic capability;
- applying authorised canonical mutations;
- maintaining graph integrity.

AI must not independently decide canonical transition validity.

---

# 55. Graph Mutation Boundary

Canonical mutation must be deterministic and governed by Pactwright.

AI may propose semantic content.

The runtime controls whether and how that content becomes graph truth.

Examples:

```text
AI
→ drafts Contract content

runtime
→ validates Decision authority
→ creates canonical Contract
→ writes typed relationships
```

and:

```text
reviewer
→ reports that correction is required and identifies a relevant Delivery step

runtime
→ validates the declared corrective transition
→ updates execution state
```

This prevents prompts and model behaviour from becoming an implicit state machine.

---

# 56. Project Graph Revision

Pactwright derives one deterministic Project Graph revision from canonical registered Project Graph state.

The revision includes registered canonical:

- Delivery Graph nodes;
- typed edges;
- enabled extension-owned canonical graph records.

It excludes:

- generated reports;
- execution provenance;
- lifecycle execution state;
- adapter output;
- GitHub state;
- derived projections.

Conceptually:

```text
canonical Project Graph state
        ↓
deterministic revision
        ↓
reviews / extensions / reports / projections
```

The same canonical graph state must produce the same Project Graph revision.

---

# 57. Validation

Pactwright validation must detect at least:

- malformed core nodes;
- invalid core relationships;
- missing required lineage;
- contradictory current records;
- multiple unsuperseded canonical Decisions or Contracts for one active direction;
- invalid Brief-to-Contract lineage;
- invalid Evidence-to-Brief lineage;
- illegal supersession;
- missing lifecycle shape;
- unresolved or incompatible shape identity;
- impossible shape transitions;
- Evidence attempted before successful closing Review;
- unauthorised Decision;
- unauthorised Gate progression;
- unbounded configured corrective loops;
- extension state that illegally redefines core Delivery semantics.

Validation should fail before canonical mutation where possible.

---

# 58. Core Invariants

The following are canonical Pactwright invariants.

1. Pactwright exists to turn Intent into an explicit authorised Contract and govern fulfilment against it.
2. There is one current canonical Decision and Contract for an authorised direction.
3. Contract alternatives are transient.
4. Every proceeding Contract is selected by an authorised Decision.
5. A Brief is downstream of and constrained by its Contract.
6. Lifecycle shape selection cannot weaken Contract requirements.
7. Delivery and Review are processes, not core graph nodes.
8. Every successful core Delivery closes with Evidence.
9. Evidence requires successful Review of the latest delivered state.
10. Core Delivery ends at Evidence.
11. Deployment, Asset, Publication and Observation remain post-Delivery extension semantics.
12. Lifecycle Gates do not create Decision nodes unless authorised Contract meaning changes.
13. Fine-grained lifecycle progression remains execution state.
14. Lifecycle shapes use domain-neutral orchestration concepts.
15. Domain production artefacts remain outside core Pactwright semantics.
16. Production Skills may be composed without introducing new core Delivery capabilities.
17. Pactwright runtime, not agent prompts, determines valid lifecycle transitions.
18. Corrective execution follows declared bounded transitions.
19. Durable truth changes through explicit canonical mutation and supersession.
20. Git remains history; the Project Graph remains current semantic truth.

---

# 59. Anti-Overengineering Constraints

The core lifecycle must not evolve into a generic BPMN or workflow language without demonstrated need.

Do not introduce core abstractions merely because one production domain uses them.

In particular, the initial core does not need dedicated concepts for:

```text
retry
revision
loop
selection
branch
parallel task
storyboard
wireframe
scene
shot
mix
master
implementation
research claim
production asset
```

Use existing concepts first:

```text
Delivery
Review
Gate
Transition
execution state
Production Skills
```

New lifecycle primitives should be introduced only when multiple materially different domains demonstrate that the existing vocabulary cannot represent the required contract-fulfilment topology cleanly.

---

# 60. Current Implementation Baseline

Pactwright `0.0.1` already implements substantial parts of this specification.

## Implemented in `0.0.1`

Broadly implemented:

- repository-native Delivery Graph;
- Intent, Decision, Contract, Brief and Evidence semantics;
- transient Contract alternatives;
- Contract-driven workflow commands;
- graph-derived Delivery state;
- deterministic graph mutation;
- `pactwright lifecycle status`, `next` and `run`;
- automatic/manual stage policy;
- human-gated Contract approval;
- transient Delivery and Review stages;
- Agent Pack-based execution responsibilities;
- Evidence as core lifecycle closure.

## Partially implemented in `0.0.1`

The current lifecycle engine already separates graph-mutating and transient stages and can determine valid next actions from graph state.

However, the Brief-to-Evidence topology is fixed rather than shape-driven.

The current fixed sequence effectively corresponds to:

```text
direct

Brief
→ Delivery
→ Review
→ Evidence
```

## Not yet fully represented

The canonical target adds:

- explicit lifecycle-shape semantics;
- reproducible identification of the selected shape, with exact persistence unresolved;
- phase-aware repeated Delivery and Review;
- shape execution state;
- declared corrective transitions;
- bounded iteration policy;
- Delivery Gates distinct from Contract Decisions;
- support for richer domain-neutral shapes without adding domain-specific stages.

These are evolutions of the existing lifecycle architecture rather than a replacement for it.

---

# 61. Relationship to Other Canonical Specifications

This specification defines Pactwright core semantics.

The surrounding canonical system is:

```text
01 Pactwright Core System and Lifecycle
→ Contracts, Delivery Graph and lifecycle

02 Distribution, Agent Packs, Extensions and Evaluation
→ execution composition and distribution

03 Project Intelligence
→ durable project knowledge and guidance

04 Graph Review
→ specialist Project Graph analysis

05 Assets and Publication
→ approved durable outputs and publication

06 Operations
→ real-world exposure and feedback

07 GitHub Integration
→ remote automation and projection

08 Open-Source Project Organisation
→ repository, ecosystem and public project structure
```

No neighbouring specification may redefine the Contract, Delivery Graph or core lifecycle semantics established here.

---

**Pactwright Core System and Lifecycle v1**