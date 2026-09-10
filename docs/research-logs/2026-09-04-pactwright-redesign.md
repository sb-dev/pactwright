Here is the compact redesign brief I would carry forward.

## 1. Pactwright's purpose

Pactwright is fundamentally a **contract-crafting and contract-fulfilment system**, not a generic agent runner.

Its core semantic spine is:

```text
Intent
→ Contract alternatives
→ Decision
→ Canonical Contract
→ Brief
→ Delivery
→ Review
→ Evidence
```

The Contract defines what must be true.

The Brief translates that Contract into focused executable work.

Delivery attempts to satisfy it.

Review verifies it.

Evidence records what was actually satisfied.

This contract-centric identity must remain the root of every redesign decision.

---

## 2. Pactwright is not greenfield

Pactwright already exists at release `0.0.1`.

The implementation already contains:

* the Delivery Graph;
* the seven-stage lifecycle;
* lifecycle status/next/run;
* deterministic graph mutation and validation;
* agent-pack selection and locking;
* Claude Code adapter generation;
* extension loading;
* evaluation infrastructure;
* GitHub integration foundations.

The published package is `0.0.1`.

The current runtime already treats `propose-contracts`, `deliver-brief`, and `review` as transient lifecycle stages while Intent, Decision/Contract, Brief and Evidence create durable graph state.

Therefore the redesign should **generalise the working architecture**, not replace it.

---

## 3. One Delivery model

We explicitly rejected separate:

```text
software delivery
creative delivery
```

Pactwright has one Delivery model:

```text
Contract
→ Brief
→ Delivery
→ Review
→ Evidence
```

Software, video, music, narrative, UI/UX and future domains differ in **skills and workflow shape**, not in Pactwright Delivery semantics.

This means these old concepts should disappear:

```text
creative-delivery capability
creative-verification capability
```

Instead:

```text
delivery-execution
→ agent
→ appropriate domain skills
```

and:

```text
delivery-review
→ reviewer
→ appropriate evaluation skills
```

---

## 4. Core agent responsibilities stay small

The proven core capability model is:

```text
delivery-specification
delivery-execution
delivery-review
```

`@pactwright/standard@0.0.1` already maps those three responsibilities to `spec`, `implementer`, and `reviewer`.

The important rule is:

> A new delivery domain does not justify a new Pactwright capability merely because it requires different specialised skills.

For example:

```text
delivery-execution
├── software engineering skills
├── video-production
├── music-compose / music-produce
└── narrative-* skills
```

Likewise:

```text
delivery-review
├── software review/testing skills
├── video-evaluate
├── music-evaluate
└── narrative-evaluate
```

---

## 5. Commands define the operation; agent packs define execution

The architectural ownership remains:

```text
Pactwright
→ owns Contract and lifecycle semantics

Command
→ defines what operation must happen

Capability
→ identifies the semantic responsibility

Agent pack
→ decides which agent performs it

Agent
→ defines behavioural approach

Skills
→ provide specialised techniques

Runtime
→ owns deterministic orchestration and canonical mutation
```

A useful shorthand remains:

```text
Runtime = when
Command = what
Agent = behavioural how
Skill = specialised how
Context = what is true here
```

But all of that operates **under the governing Contract**.

---

## 6. Agent packs remain a first-class customisation mechanism

We must preserve the existing agent-pack model.

Agent packs contain:

```text
agents
system prompts
skills
model adaptations
evaluation cases
```

Extensions declare required capabilities.

The selected agent pack provides compatible implementations.

Current project configuration already supports:

```yaml
agent_pack:
  source: "@pactwright/standard"
```

The redesign should not invent independent project-level skill selection unless there is a demonstrated need.

Current intended model:

```text
Project
→ selects Agent Pack
→ Agent Pack defines agents + skills
```

---

## 7. Extensions remain the semantic customisation mechanism

Extensions add optional Pactwright semantics without redefining the core Delivery Graph.

The existing extension contract already supports contributions such as:

* node and edge types;
* schemas and validation;
* namespaced commands;
* context;
* required agent capabilities;
* generated repository integration;
* GitHub requirements.

We should preserve this rather than introduce another plugin abstraction.

The redesigned extension set should become:

```text
Project Intelligence
Graph Review
Assets / Publication
Operations
```

not the old combined:

```text
Graph Review & Creative Delivery
```

---

## 8. Project Intelligence

Project Intelligence owns durable project knowledge.

Core flow:

```text
Source
→ triage
→ Knowledge
→ future Contract / Delivery / Review context
```

It remains responsible for:

* project knowledge;
* grounding;
* durable guidance;
* domains;
* freshness;
* contradictions;
* propagation;
* delivery context;
* intent candidates.

The important redesign decision is:

> **Generation/model/production guidance that is worth retaining belongs in Project Intelligence as project knowledge.**

For example:

```text
review / evaluation / production evidence
→ Source
→ triage
→ accepted Knowledge
→ future agent context
```

That is preferable to a special `generation-guidance` subsystem.

---

## 9. Graph Review becomes its own extension

Graph Review should own only specialist review over Project Graph state.

Conceptually:

```text
Project Graph
→ graph-review
→ reviewer + skills
→ Finding
→ Project Intelligence Source
```

Keep:

```text
graph-review
```

as a genuine capability because it is semantically different from Delivery Review.

Difference:

```text
Delivery Review
→ verifies a Brief/Contract
→ contributes to Evidence

Graph Review
→ analyses wider Project Graph state
→ emits Findings
→ feeds Project Intelligence
```

The old `generation-review` capability is unnecessary.

Generation review becomes:

```text
graph-review
→ reviewer
→ generation-analysis skills
```

Likewise architecture, UX, product or cost review can reuse the same capability with different skills/context.

---

## 10. Review Definitions should probably disappear

The redesign showed that much of the old Review Definition machinery can be expressed more simply through:

```text
command
+ context
+ agent pack
+ skills
```

For example:

```text
pactwright review architecture
→ graph-review
→ reviewer
→ architecture skills
```

rather than:

```text
Review Definition
→ special reviewer configuration
→ capability
→ provider/task machinery
```

We should only retain a separate Review Definition concept if, during canonical-spec drafting, we find information that genuinely cannot be expressed through commands, configuration and the agent pack.

Do not preserve it merely because it existed in the old spec.

---

## 11. Provider registry and task catalog should leave Pactwright

The creative skill projects demonstrated a cleaner execution model.

Pactwright should not own a bespoke:

```text
provider registry
task catalog
model router
```

for production work.

Instead:

```text
Pactwright responsibility
→ agent
→ skill
→ skill-owned tools/provider integration
```

For example:

```text
delivery-execution
→ deliverer
→ video-production
→ Replicate/model skills
```

or:

```text
delivery-review
→ reviewer
→ video-evaluate
```

Pactwright should only retain the execution provenance actually required for Contract fulfilment, Evidence, reproducibility or audit.

---

## 12. Assets / Publication becomes a separate extension

Assets and Publication have nothing inherently to do with Graph Review.

This extension owns the durable post-Delivery output model:

```text
Evidence
→ approval
→ Asset
→ Publication
```

It should own things such as:

* Asset identity;
* content/provenance;
* approval;
* immutability/supersession;
* Publication records;
* publication traceability;
* links to Evidence;
* exposing Publications to Operations.

It does **not** own how an Asset was produced.

Production remains normal Delivery:

```text
Contract
→ Brief
→ lifecycle shape
→ delivery-execution
→ agent pack
→ specialised skills
```

---

## 13. Operations remains separate

Operations owns what happens after something reaches the real world.

Typical flows:

```text
software:
Evidence
→ Deployment
→ Observation
```

```text
published output:
Evidence
→ Asset
→ Publication
→ Observation
```

Then:

```text
Observation
→ Project Intelligence Source
→ Knowledge
→ possible future Contract
```

Operations should continue to own:

* Deployment;
* Observation;
* operational sources;
* environments;
* operational evidence compression.

It must not become part of core Delivery.

---

## 14. Lifecycle shapes are the genuinely new concept

The current lifecycle configuration only customises **execution policy**.

For example:

```yaml
approve-contract:
  execution: manual
  actor: human
```

The topology itself is currently fixed. The existing Delivery spec explicitly assumes that lifecycle structure remains unchanged while execution/gates vary.

The redesign introduces:

> **Lifecycle shape: the topology by which a Brief progresses from authorised work to Evidence.**

This is new.

---

## 15. Contract crafting remains invariant; Delivery topology varies

Lifecycle shapes should not replace Pactwright's Contract-crafting spine.

Invariant:

```text
Intent
→ Contract alternatives
→ Decision
→ Contract
→ Brief
```

Then:

```text
<selected lifecycle shape>
```

Then:

```text
Evidence
```

So:

```text
Pactwright lifecycle
=
Contract-crafting spine
+
Delivery lifecycle shape
+
Evidence closure
```

---

## 16. Minimal lifecycle-shape vocabulary

We converged on only four concepts:

```text
delivery
review
gate
transition
```

We do not need separate primitives for:

```text
loop
retry
revision
selection
storyboard
composition
shot
scene
mix
master
implementation
```

A loop is simply a backward transition.

Revision is another Delivery execution.

Domain-specific artifacts remain inside skills.

---

## 17. Lifecycle shapes stay domain-neutral

Do not create:

```text
software lifecycle
video lifecycle
music lifecycle
narrative lifecycle
```

Prefer generic topology such as:

```text
direct
iterative
checkpointed
progressive
```

For example:

```text
direct:
Brief
→ Delivery
→ Review
→ Evidence
```

or:

```text
progressive:
Brief
→ Delivery
→ Review
→ Gate
→ Delivery
→ Review
→ Delivery
→ final Review
→ Evidence
```

A video skill interprets phases in video terms.

A music skill interprets them in music terms.

Pactwright remains domain-neutral.

---

## 18. The current lifecycle becomes the `direct` shape

This gives us an incremental migration from `0.0.1`.

Current:

```text
write-brief
→ deliver-brief
→ review
→ prepare-evidence
```

becomes conceptually:

```text
shape: direct

Brief
→ Delivery
→ Review
→ Evidence
```

Then the lifecycle engine can later be generalised to support additional shapes.

No rewrite is necessary.

---

## 19. `/deliver-brief` and `/review` become phase-aware

Under lifecycle shapes:

```text
/deliver-brief
```

means:

> Execute the currently active Delivery step of the selected lifecycle shape.

It may therefore run multiple times.

Likewise:

```text
/review
```

means:

> Execute the current Review step.

This keeps the command surface stable while supporting richer workflows.

---

## 20. Gates are not Contract Decisions

We must keep this distinction explicit.

Contract Decision:

```text
Contract alternatives
→ Decision
→ canonical Contract
```

changes Project Graph truth.

Delivery gate:

```text
working output
→ approval
→ next lifecycle-shape step
```

does not.

The test is:

> Does this approval change what the authorised outcome is?

If yes:

```text
return to Contract/Brief semantics
```

If no:

```text
Delivery gate
```

---

## 21. Shape and policy are distinct

Keep:

```text
Shape
→ topology

Policy
→ automatic/manual
→ actor/authority
→ iteration limits
```

The current `lifecycle.yml` mixes lifecycle stages with execution policy. The redesign should separate these concerns conceptually, while probably evolving the same configuration file rather than creating another subsystem.

---

## 22. Shape selection belongs downstream of the Contract

The Contract defines success.

The lifecycle shape defines how work progresses towards success.

Therefore shape selection belongs around Brief creation rather than inside the Contract.

Conceptually:

```text
Contract
→ /write-brief
→ Brief + selected shape
```

If only execution strategy changes:

```text
new Brief
→ supersedes old Brief
```

If desired outcome changes:

```text
new Decision
→ new Contract
```

---

## 23. Shape execution state is not Project Graph truth

Richer workflows require runtime state such as:

```text
current step
completed steps
waiting gate
iteration count
selected shape/version
```

But these should remain execution state.

Do not add graph nodes for:

```text
storyboard
mix
revision
checkpoint
phase
review attempt
```

The Delivery Graph stays intentionally small.

---

## 24. Existing top-level customisation options to preserve

From the current specs and implementation, the real repository-level choices are:

```text
Agent Pack
Extensions
Adapter
Lifecycle configuration
GitHub configuration
```

`0.0.1` already exposes:

```yaml
agent_pack: ...
adapter: ...
extensions: {}
github:
  enabled: false
```

Lifecycle configuration lives separately in `lifecycle.yml`.

We should evolve these mechanisms instead of inventing another generic customisation framework.

---

# Working target architecture

The redesign now looks roughly like:

```text
PACTWRIGHT CORE
│
├── Contract / Delivery Graph
├── Contract-crafting lifecycle
├── Lifecycle Shapes
├── Commands
├── Runtime
│
├── Agent Pack
│   ├── agents
│   └── skills
│
└── Extensions
    ├── Project Intelligence
    ├── Graph Review
    ├── Assets / Publication
    └── Operations
```

And externally:

```text
Adapter
→ Claude Code initially
→ future execution environments

GitHub integration
→ automation and projections
→ never canonical graph truth
```

## The most important redesign rule

If one sentence needs to guide the canonical-spec rewrite, I would use:

> **Pactwright crafts and authorises Contracts, derives Briefs, and governs their fulfilment through selectable lifecycle shapes. Core responsibilities remain domain-neutral; Agent Packs provide AI behaviour and specialised skills; Extensions add optional durable semantics without redefining Delivery.**

That captures the redesign without dragging the obsolete creative/provider/review machinery forward.
