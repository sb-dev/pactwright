# Pactwright — Delivery Graph and Lifecycle Engineering Spec

## 1. Purpose

Pactwright provides a repository-native delivery graph and lifecycle runtime that preserve enough durable context for humans and AI agents to understand:

- what change was requested
- what was decided
- what behaviour was agreed
- what should be delivered
- what was actually delivered
- what lifecycle action may happen next

The graph stores current durable truth.

Git stores history.

Transient AI reasoning stays transient.

The Delivery Graph is Pactwright's required core Project Graph subgraph. Optional extensions may register independently owned graph semantics, contribute delivery context and continue from completed Delivery into specialised post-delivery state, but they MUST NOT redefine Delivery Graph semantics or lifecycle behaviour.

---

## 2. Stable Delivery Semantics

Pactwright's stable delivery flow is:

```text
intent
→ transient contract alternatives
→ decision
→ canonical contract
→ brief
→ delivery
→ review
→ evidence
```

Evidence is the end of the core Delivery lifecycle.

Extensions may continue from Evidence into specialised post-delivery semantics such as:

- approved Assets and Publications;
- software Deployments;
- production Observations;
- other extension-owned outcomes.

Those records are not additional Delivery lifecycle stages.

The stable core defines:

- graph semantics
- explicit decisions
- scope integrity
- context composition
- graph validation
- lifecycle orchestration

A decision MUST exist when an intent is resolved.

The decision MAY be made by:

- human
- agent
- automation

according to repository lifecycle policy.

Human approval is therefore a configurable gate, not a hard-coded lifecycle requirement.

Prompts, skills, agents, models and delivery techniques are replaceable implementations of these semantics.

The core does not define the delivery medium or production surface. Software implementation is one delivery capability. Extensions may provide other delivery capabilities, output types, verification rules and post-delivery semantics while reusing the same lifecycle.

They MUST NOT:

- redefine graph meaning
- bypass configured approval gates
- silently widen scope
- mutate durable graph state outside permitted ownership and lifecycle boundaries

---

## 3. Principles

### Graph for truth, Git for history

Do not use the graph as an archive of:

- rejected proposals
- critic transcripts
- intermediate reasoning
- delivery attempts
- obsolete detail already preserved by Git

### Information compresses

As certainty increases, context becomes smaller and more precise:

```text
intent
↓
small transient alternatives
↓
decision
↓
canonical contract
↓
focused brief
↓
factual evidence
```

### Each node owns unique information

| Node | Owns |
| --- | --- |
| Intent | WHY / WHAT |
| Decision | CHOICE / RATIONALE |
| Contract | AGREED BEHAVIOUR |
| Brief | DELIVERY DELTA |
| Evidence | ACTUAL RESULT |

Downstream nodes reference upstream information rather than repeating it.

### Incomplete is valid

The graph may represent work at any lifecycle stage.

An unfinished lifecycle is valid.

A contradictory or ambiguous graph is not.

---

## 4. Project Structure

A repository using Pactwright contains:

```text
.pactwright/
  config.yml
  lifecycle.yml
  lock.yml

specs/
  nodes/
  graph/
    edges.yml

.claude/
  agents/
  commands/
```

`specs/nodes/` contains Delivery Graph nodes.

`specs/graph/edges.yml` is the shared Project Graph typed-edge store. Delivery registers its core edge types there; enabled extensions may register additional edge types and cross-graph relationships while retaining ownership of their canonical records.

`.pactwright/` contains Pactwright configuration and the resolved runtime/agent setup.

`.claude/` is a generated adapter surface.

Canonical agent prompts, skills and workflow definitions do not live there.

Pactwright regenerates the adapter through:

```text
pactwright sync
```

The Pactwright runtime is installed as a dependency and is not copied into the project.

### `config.yml`

Describes the Pactwright installation and integrations.

Example:

```yaml
version: 1

agent_pack:
  source: "@pactwright/standard"

adapter:
  type: claude-code

github:
  enabled: true
```

### `lifecycle.yml`

Describes how the repository operates the delivery lifecycle.

It controls:

- which stages run automatically
- which stages require manual execution
- who may make decisions
- human approval gates
- remote automation triggers
- operational projections

### `lock.yml`

Records the exact resolved runtime and AI configuration, including:

- runtime version
- agent-pack version
- agent hashes
- skill hashes

Configuration describes intent.

The lock file describes the exact resolved setup.

---

## 5. Graph Model

The core Delivery Graph has five node types:

- intent
- decision
- contract
- brief
- evidence

Enabled Project Graph extensions may register additional independently owned node types.

Examples include extension-owned:

- Asset;
- Publication;
- Deployment;
- Observation.

They are not Delivery Graph nodes.

Delivery execution and review are lifecycle stages, not durable node types.

Each node is Markdown with YAML frontmatter.

Required common fields:

```yaml
id:
type:
title:
created:
```

IDs use:

```text
<type>-<slug>-<short-hash>
```

IDs never change.

### Project Graph revision

Pactwright runtime derives one deterministic Project Graph revision from registered canonical Project Graph state.

The revision represents the canonical input state consumed by extensions, reviews, generated reports and operational projections.

It includes canonical registered:

- Project Graph nodes;
- typed edges;
- extension-owned canonical graph records.

It excludes:

- generated reports;
- adapter output;
- execution provenance;
- operational projections;
- GitHub state;
- other derived state.

Conceptually:

```text
canonical registered Project Graph state
                ↓
     deterministic graph revision
                ↓
extensions + reviews + reports + projections
```

The same canonical Project Graph state MUST produce the same revision.

Extensions and integrations consume this runtime-supplied revision rather than deriving independent revision schemes.

A Git commit containing generated or operational output is therefore not the Project Graph revision.

---

## 6. Intent

An intent captures the requested outcome.

It owns:

- problem
- desired behaviour
- constraints
- expected outcome
- important non-goals

It MUST NOT contain:

- delivery plans
- file or output inventories
- candidate solutions
- agent design
- verification implementation
- validator design

---

## 7. Contract Alternatives

Alternatives are transient.

They are not graph nodes.

`/propose-contracts <intent-id>` may generate a small number of genuinely different candidate contracts.

Alternatives are presented for selection but are not persisted as durable graph state.

Rejected alternatives disappear from normal working context after the decision.

GitHub discussion, session history or Git may retain them when historical investigation is needed.

---

## 8. Decision

A decision resolves an intent.

It contains:

```yaml
id:
type: decision
title:
created:
decided_by:
outcome:
```

`decided_by` records the actual actor, for example:

```text
human:samir
agent:spec
automation:pactwright
```

Allowed outcomes:

- proceed
- reject
- defer

The body records:

- choice
- concise rationale
- concise rejected-option summaries when useful

A decision MUST NOT become a second specification.

For `proceed`, Pactwright creates one canonical contract.

The actor making the decision MUST be authorised by `lifecycle.yml`.

---

## 9. Contract

There is one current canonical contract for an approved direction.

Candidate contracts are not stored.

The contract owns:

- agreed behaviour
- scope
- non-scope
- acceptance behaviour
- significant constraints
- important failure cases

It does not contain:

- rejected approaches
- critic transcripts
- decision rationale
- detailed implementation steps
- speculative extensions

The contract must be independently readable as the current agreed behaviour.

---

## 10. Brief

A contract normally has one current delivery brief.

The brief is produced after inspecting relevant project and repository state.

It owns:

- relevant delivery areas
- delivery approach
- important existing patterns
- required changes or outputs
- verification required
- delivery-specific constraints

It MUST NOT repeat:

- the original problem
- the complete contract
- decision rationale
- rejected alternatives

Detailed delivery reasoning remains transient.

---

## 11. Delivery Execution and Review

Delivery execution starts from:

- intent
- decision
- contract
- brief
- relevant project and repository state

Delivery execution performs the work defined by the brief.

Depending on the active delivery capability, it may modify repository artefacts or produce external or binary outputs.

It does not directly mutate the Delivery Graph.

Extensions may define specialised output types, storage and provenance while preserving the same Delivery lifecycle.

Review checks:

- contract compliance
- scope
- required verification
- unnecessary complexity
- project consistency

Delivery-specific review capabilities may add checks without redefining the core review stage.

Review reasoning remains transient unless it changes durable delivery truth.

If review identifies a scope problem, the graph is updated through the normal decision and supersession rules.

Review establishes whether the delivered output satisfies Delivery requirements.

It does not establish how that output later behaves in production.

---

## 12. Evidence

Evidence records what actually happened during Delivery and verification.

It owns:

- meaningful delivered changes or outputs
- verification performed
- verification results
- deviations
- known risks
- follow-up work

It MUST NOT reproduce:

- the contract
- the brief
- review transcripts
- delivery reasoning

Evidence should be factual and compact.

Evidence does not mean that an output:

- was deployed;
- was published;
- reached users;
- performed successfully in production.

Those are post-Delivery semantics owned by extensions.

For example:

```text
software:
Evidence
   ↓
Operations Deployment
```

and:

```text
creative:
Evidence
   ↓
approved Asset
   ↓
Publication
```

Production findings about those exposures remain extension-owned rather than being written back into Delivery Evidence.

---

## 13. Edges

Canonical Project Graph relationships use the shared typed-edge store:

```text
specs/graph/edges.yml
```

The store is shared infrastructure, not Delivery-owned semantics.

Delivery registers the core edge types below.

Enabled extensions may register additional edge types and cross-graph relationships without changing Delivery node ownership or meaning.

An edge contains:

```yaml
source:
type:
target:
```

The tuple `(source, type, target)` is unique.

Core edge types:

```text
decision --resolves----> intent
decision --selects-----> contract
brief    --decomposes--> contract
evidence --evidences---> brief
node     --supersedes--> same node type
```

A `reject` or `defer` decision resolves an intent but selects no contract.

Extensions may continue from Delivery records using independently owned edges.

For example:

```text
evidence --deployed-as--> deployment
evidence --produces----> asset
```

Those edges are registered and validated by their owning extensions.

They do not change Delivery lineage semantics.

---

## 14. Derived State

Lifecycle state is derived from graph structure rather than stored redundantly.

Examples:

| Graph state | Derived state |
| --- | --- |
| No decision | open |
| Decision = defer | deferred |
| Decision = reject | rejected |
| Proceeding decision + contract, no brief | contracted |
| Current brief, no evidence | delivering |
| Current evidence | done |

These are Delivery lifecycle views, not canonical node fields.

`done` means the core Delivery lifecycle is complete.

It does not imply that an output has been deployed, published or proven successful in production.

Extensions may derive their own post-Delivery state independently.

---

## 15. Supersession and Scope Changes

Durable truth changes explicitly.

### Brief changes, contract remains valid

```text
new brief --supersedes--> old brief
```

### Contract changes

Return to the decision stage.

Create:

- a new authorised decision
- a new canonical contract

Supersede the previous current records.

Do not represent the effective contract as:

```text
old contract + decision amendments
```

There must always be one readable canonical contract.

### Evidence correction

```text
new evidence --supersedes--> old evidence
```

A later production Observation does not supersede Evidence merely because the delivered work performed differently than expected.

Evidence describes the Delivery result.

Operations describes subsequent production reality.

---

## 16. Workflow Responsibilities

The stable core defines responsibilities, not fixed agent implementations.

### Specification

- understand intent
- generate useful contract alternatives
- produce the canonical contract
- produce focused briefs

### Delivery

- inspect relevant project and repository state
- execute the brief
- produce the required changes or outputs
- respect scope

### Review

- verify contract compliance
- identify defects
- detect scope creep
- challenge unnecessary complexity

### Graph mutation

- create graph nodes
- create relationships
- supersede records
- maintain graph integrity

The selected agent pack determines how these responsibilities are implemented.

Post-Delivery responsibilities such as deployment recording, publication and production analysis belong to the extensions that define those semantics.

---

## 17. Lifecycle Configuration

Pactwright provides a default lifecycle, but repositories configure how it operates.

Example `.pactwright/lifecycle.yml`:

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

A more automated repository may use:

```yaml
version: 1

stages:
  capture-intent:
    execution: manual

  propose-contracts:
    execution: automatic

  approve-contract:
    execution: automatic
    actor: agent

  write-brief:
    execution: automatic

  deliver-brief:
    execution: automatic

  review:
    execution: automatic

  prepare-evidence:
    execution: automatic
```

The lifecycle structure remains the same.

Only execution and gates change.

Extension-owned post-Delivery processes are configured by their owning extension rather than being added as core Delivery stages.

---

## 18. Lifecycle Semantics

Pactwright owns the lifecycle state machine.

Automation surfaces execute it.

Agent prompts do not decide what stage comes next.

The runtime determines the next valid transition from:

```text
graph state
+ lifecycle.yml
+ repository state
```

Conceptually:

```text
intent exists
    ↓
propose-contracts
    ↓
decision required
    ↓
configured actor/gate
    ↓
canonical contract
    ↓
write-brief
    ↓
deliver-brief
    ↓
review
    ↓
prepare-evidence
```

AI performs lifecycle responsibilities.

Pactwright controls stage transitions.

The core lifecycle completes at Evidence.

Any later Deployment, Asset, Publication or Observation follows extension-owned semantics and does not alter the core state machine.

---

## 19. Workflow Commands

AI-facing workflow commands are exposed through the active adapter.

The initial Claude Code adapter exposes:

```text
/capture-intent <text>
/propose-contracts <intent-id>
/approve-contract <contract-id> [notes]
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

These are distinct from Pactwright runtime CLI commands.

### `/capture-intent`

Creates an intent.

### `/propose-contracts`

Read-only from the graph perspective.

Generates transient contract alternatives for the intent.

### `/approve-contract`

Human-gated adapter command.

The selected alternative is synthesised into one canonical contract.

Pactwright records:

- decision
- canonical contract
- `resolves` edge
- `selects` edge

Rejected alternatives are not persisted.

When lifecycle policy delegates the decision to an agent or automation, Pactwright invokes the same underlying decision responsibility without requiring this human-facing command.

### `/write-brief`

Inspects relevant project and repository state and creates the delivery brief for the approved contract.

### `/deliver-brief`

Loads current delivery context and executes the brief.

It may change repository artefacts or produce extension-defined outputs, but it does not mutate the Delivery Graph.

A delivery extension or agent pack may expose a domain-specific adapter alias, such as `/implement-brief` for software, but the underlying lifecycle responsibility remains `deliver-brief`.

### `/review`

Reviews:

- contract
- brief
- delivered changes or output references
- required verification

It reports findings but does not persist review reasoning as graph state.

### `/prepare-evidence`

Records final delivery and verification facts.

It completes the core Delivery lifecycle when valid Evidence is created.

Post-Delivery extension commands operate separately.

---

## 20. Runtime Lifecycle Interface

The runtime exposes:

```text
pactwright lifecycle status
pactwright lifecycle next
pactwright lifecycle run
```

### `lifecycle status`

Reports:

- current stage
- completed stages
- blocked stage
- required actor
- validation problems
- current lineage

Extension-owned post-Delivery state may be shown separately but MUST NOT redefine the Delivery lifecycle stage.

### `lifecycle next`

Determines the next permitted core Delivery lifecycle action without executing it.

When Evidence is current, the core lifecycle has no next Delivery stage.

### `lifecycle run`

Runs automatic stages until:

- a human gate is reached
- the lifecycle completes
- a stage fails
- a validation error occurs

It MUST NOT skip a configured gate.

Other core runtime commands include:

```text
pactwright validate
pactwright context <node-id>
pactwright sync
```

---

## 21. Graph Validation

`pactwright validate` validates core Delivery Graph integrity and shared typed-edge integrity.

Enabled extensions may contribute validation for semantics they own.

Core Delivery validation does not reinterpret extension-owned records.

Validation does not require the lifecycle to be complete.

### Nodes

Validate:

- frontmatter
- required fields
- declared node type
- unique ID
- valid decision outcome
- required body

### Edges

Validate:

- required fields
- declared type
- source exists
- target exists
- valid endpoint types
- unique tuple
- valid same-type supersession
- no self-supersession
- no supersession cycles

Extension-owned edges are validated according to their registered ownership.

### Current-lineage ambiguity

Validate:

- at most one current decision resolves an intent
- `proceed` selects exactly one current contract
- `reject` and `defer` select none
- at most one current brief decomposes a contract
- at most one current evidence record evidences a brief

Post-Delivery extension records do not participate in determining the current Delivery lineage.

The validator does NOT judge:

- alternative quality
- delivery quality
- verification quality
- production performance
- release readiness
- semantic drift
- whether the authorised actor made a good decision

---

## 22. Context Loading

The graph's primary job is to provide high-signal working context.

```text
pactwright context <node-id>
```

resolves the current core Delivery lineage:

```text
Intent
Decision
Contract
Brief
Evidence
```

Only existing stages are returned.

Enabled extensions may contribute additional namespaced context after the core lineage is resolved.

Extension context may include, when relevant:

- Project Intelligence grounding;
- review findings;
- approved Assets or Publications;
- production Deployments;
- relevant operational Observations.

Extension context MUST NOT alter the Delivery lineage, redefine Delivery node meaning or make core Delivery records depend on extension-specific semantics.

Normal context excludes:

- rejected alternatives
- superseded nodes
- review transcripts
- obsolete delivery reasoning
- raw telemetry or execution provenance

Historical graph records may be requested with:

```text
pactwright context <node-id> --history
```

Git remains the deeper historical archive.

### Context discipline

Delivery execution receives:

- intent
- decision
- contract
- brief
- relevant extension context, when enabled and applicable
- relevant project and repository state

Review receives:

- contract
- brief
- delivered changes, diff or output references
- required verification
- relevant extension context when required by the active delivery capability

Evidence generation receives:

- brief
- delivered changes, diff or output references
- verification results

Do not preload unrelated historical or operational state.

---

## 23. Information Budgets

These are writing guidelines, not validation rules.

| Artifact | Normal target |
| --- | --- |
| Intent | ≤300 words |
| Alternative | ≤200 words |
| Decision | ≤200 words |
| Contract | ≤800 words |
| Brief | ≤600 words |
| Evidence | ≤400 words |

The stronger rule is:

> Every node contains only information it uniquely owns.

---

## 24. Core Definition of Done

The core is working when real changes can reliably follow:

```text
intent
→ transient contract alternatives
→ authorised decision
→ canonical contract
→ focused brief
→ delivery
→ review
→ factual evidence
```

and:

- lifecycle policy determines automation and approval
- every resolved intent has an explicit decision
- configured gates cannot be bypassed
- rejected alternatives do not accumulate
- downstream nodes do not repeat upstream information
- unfinished work remains valid
- graph state remains unambiguous
- lifecycle state is derived
- Evidence is the explicit end of the core Delivery lifecycle
- completion of Delivery does not imply deployment, publication or production success
- the runtime derives one deterministic Project Graph revision from canonical registered graph state
- extensions and integrations consume the same runtime-supplied Project Graph revision
- current context can be recovered with one runtime command
- lifecycle failures block progression
- delivery capabilities can produce software changes or extension-defined outputs without changing core lifecycle semantics
- extensions may continue from Evidence into specialised post-delivery records without inserting new core Delivery stages
- Operations may connect Evidence to Deployment and production Observations without changing Delivery semantics
- production findings may influence later work through extension and Project Intelligence semantics rather than rewriting Delivery Evidence
- agent implementations can evolve without changing graph semantics
- graph maintenance requires no manual coherence work

---

## 25. Future Improvements

Review these only after the core workflow has been implemented and exercised.

### Risk-Based Lifecycle

Allow different lifecycle policies for different categories of change only when real usage demonstrates the need.

### Specialist Delivery Review

Add security, architecture, reliability or other specialist implementations of the core Delivery Review stage when general Delivery Review repeatedly misses those defects.

This is distinct from Graph Review, which critiques broader Project Graph state through extension-owned Review Definitions.

### Multiple Briefs and Integration

Introduce parallel delivery lanes only when one brief becomes a demonstrated coordination bottleneck.

### Competing Deliveries

Generate alternative delivery outputs only when execution-level competition proves more useful than contract-level alternatives.

### Semantic Drift

Detect behaviour changes not represented in the graph once concrete drift cases exist.

Operations Observations may provide evidence for drift detection, but drift semantics should not be added to Delivery until concrete cases justify them.

### Automated Repair Loops

Allow bounded:

```text
review
→ repair
→ review
```

automation only after benchmarking demonstrates reliable improvement.

### Production-Aware Lifecycle Policy

Allow production or operational state to influence whether future Delivery stages may proceed only when real usage demonstrates that extension-level context and policy hooks are insufficient.

Do not add Deployment or Observation as core lifecycle stages.

### Graph Indexes

Add indexes only when direct traversal becomes measurably inefficient.

### Automated Graph Compaction

Automate retention only when graph growth becomes a demonstrated context problem.

---

## 26. Governing Rule

For graph or lifecycle changes ask:

> What observed delivery failure requires changing Pactwright's stable semantics?

For post-Delivery state ask:

> Can this be owned by an extension without changing the core Delivery lifecycle?

For production feedback ask:

> Is this evidence about what happened after Delivery rather than a correction to what Delivery Evidence originally recorded?

For AI behaviour changes ask:

> Can this be solved by improving an agent, prompt or skill instead?

Prefer evolving extensions and the AI layer.

Change the Delivery Graph only when the underlying delivery semantics need to change.

---

Pactwright — Delivery Graph and Lifecycle Engineering Spec v5
