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
- Project Graph revision and repository replay identity;
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

## Storage envelope and identity

A core graph record is UTF-8 Markdown with one YAML frontmatter mapping delimited by `---`, followed by a body that is non-empty after section 6 canonical normalisation (a whitespace-only body is invalid). Common required fields are non-blank strings `id`, `type`, `title` and `created`; `created` is a valid Gregorian date in `YYYY-MM-DD` form, not a parsed date object. Core `type` is one of the five names above. Extensions own their record schemas and identities; the generic contribution seam in section 54 must not impose this core envelope on them or let them replace a core type.

A core record identity is `<type>-<slug>-<suffix>`; this grammar does not constrain Extension-owned identities. The exact `type` prefix matches the record type; type is a lower-case kebab token starting with a letter, slug is one or more lower-case alphanumeric kebab tokens, and suffix is at least four lower-case hexadecimal digits. The filename is exactly `<id>.md`. Core IDs are unique among all active graph-node endpoint identities, assigned once by the runtime at creation, persisted and never regenerated on loading. The suffix is an identity discriminator, not a promise that the current body hashes to it. Allocation must check collisions before writing; its particular minting algorithm is internal.

All Pactwright-owned YAML inputs, including core frontmatter, configuration, lifecycle and lock documents, use JSON-compatible values: string-keyed objects, arrays, strings, booleans, null and finite numbers. Reject duplicate keys, aliases, merge keys, custom tags, invalid Unicode, non-finite numbers and integers outside the interoperable safe-integer range. Do not implicitly convert dates into objects. Extra descriptive frontmatter is allowed but has no independent lifecycle authority and is included in canonical content.

Plain scalars resolve by the [YAML 1.2.2 Core Schema, section 10.3.2](https://yaml.org/spec/1.2.2/#1032-tag-resolution), not a parser's similarly named default. Null spellings are `null`, `Null`, `NULL`, `~` and an empty plain value; booleans are the six Core spellings of true/false. Integers use the Core decimal, `0o` octal and `0x` hexadecimal patterns; decimal floating-point and exponent forms use its float pattern, subject to the finite/safe-number restrictions above. Unmatched plain scalars are strings, including `yes`, `on`, `0b101`, `1_000`, sexagesimal and timestamps. Quoted strings remain strings. Mapping keys must resolve to strings before native-object construction; reject non-string keys rather than stringifying them. Explicit standard tags cannot bypass these value restrictions. Preserve this profile across parser changes; the released-format migration boundary is defined in Spec 02 section 15.

## Structural validation and content review

Structural validation checks the common envelope, identity, field types and the Decision fields in section 9. The other information owned by sections 7, 9, 10, 11 and 14 is required semantic content expressed in the body, not a new mandatory structured-field inventory. A non-empty body alone does not prove semantic acceptance.

Independent content review must check each applicable ownership item, the exclusions in those sections, upstream non-duplication, Contract completeness, Brief fidelity and factual Evidence. An omitted conditional item needs an explicit, defensible not-applicable judgement. The reviewer cites the relevant text and returns a reasoned pass or specific failures; concision and factuality are not inferred from a field being present or an arbitrary word count. Decision rationale and any rejected-option summaries receive the same review. These judgements do not introduce new core record fields.

## Canonical content

For comparison and hashing, canonical record content is its complete parsed frontmatter plus its body after CRLF/CR line endings become LF and leading/trailing whitespace is trimmed as defined by ECMAScript `String.prototype.trim`. YAML comments, mapping-key order, quoting style and this boundary whitespace do not change content. Internal Markdown whitespace, line wrapping, string values and array order remain significant. Do not normalise Unicode or interpret Markdown into a different document. Physical paths and parser diagnostics are not content.

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

Persist both actor kind and identity in the required `decided_by` string, `<kind>:<identity>`, where kind is `human`, `agent` or `automation` and identity is non-empty and contains no ECMAScript WhiteSpace or LineTerminator character (the same set used by `String.prototype.trim`). Persist the selected outcome in the required `outcome` field. Actor syntax is not authentication. `decided_by` is attribution supplied by the invoking entry point; for an adapter command it names the actor on whose behalf the command runs. Pactwright does not verify that identity against an identity provider, Git identity or an identity allow-list. Lifecycle configuration version 1 authorises actor kinds only (section 27): before committing a Decision the mutation guard requires the supplied actor kind to be allowed and records the supplied actor unchanged. An allowed kind with a different well-formed identity remains permitted; an adapter process must not replace human attribution with its own agent identity.

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
- supersession points from a replacement record to its predecessor;
- optional extensions may register additional cross-graph relationships without changing core Delivery meaning.

## Validation and registration

Stored edges are mappings with exactly `source`, `type` and `target` string fields; `type` is the relation name. Validate endpoint existence and registered endpoint types, and reject duplicate `(source, type, target)` tuples. Core `supersedes` applies to all five core record types, including Intent, and to registered Extension node types. It requires equal registered node endpoint types, no self-link, no cycle, at most one outgoing and at most one incoming supersession edge per node. Both a split replacement and a merge replacement are invalid at edge validation, not merely a later lineage warning.

Relation names and type names have one owner. Registration cannot reuse a core name, replace a core definition, or relax endpoint existence/types, tuple uniqueness, same-type supersession, acyclicity or supersession cardinality. A rejected registration leaves the previous registry effective. Additional relations may permit two-way links and cycles; supersession-only constraints do not make the whole graph a DAG.

Unknown types or relations in active canonical storage are errors, including a misspelt relation. They are preserved and reported, never silently omitted from a successful graph revision. Inactive Extension storage is handled separately under section 54; a core record cannot depend on an inactive endpoint. Generic canonical-record registration and optional node projection belong to the record model; relation registration belongs to the edge store. Installed Extensions compose those same registries rather than substituting another parser, validator, derivation path or hash implementation.

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

The released `version: 1` / `stages` mapping is a recognised native policy format. Its seven named responsibilities are policy entries, not lifecycle-shape stages. `approve-contract.actor` authorises one of `human`, `agent` or `automation`; it does not authorise named identities. It authorises the kind of every Decision outcome, `proceed`, `reject` and `defer`, including withdrawal and re-authorisation. An entry with `execution: manual` is never dispatched by the runtime; lifecycle status reports it as the blocking step, with required actor `human` when the entry declares no `actor` and with its declared kind for `approve-contract`.

A Gate's required authority is declared as one or more actor kinds from the same vocabulary and enforced by kind only. A Gate resolution supplies its actor in the section 9 `<kind>:<identity>` syntax and an outcome, `passed` or `refused`; execution state records both unchanged as attribution, with the delivered state the resolution approved, never as a graph record. The Gate permits progression only while its most recent resolution is `passed` and no corrective transition has since returned to a Delivery step before the Gate; after such a return the Gate must be resolved again. The initial `direct` fulfilment shape uses the delivery/review/closure policy entries without turning Contract-crafting responsibilities into shape topology. Read-only loading preserves these declarations. Any later incompatible lifecycle representation needs an explicitly versioned schema and migration; an unreleased `version: 2` draft is not implicitly a supported released format.

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
dispatch record (revision at dispatch of the current step)
```

The exact representation of `resolved shape identity`, including whether it uses a version or hash, remains part of the lifecycle-shape storage and locking design.

Execution state is Pactwright-owned ordinary repository content below `.pactwright/`, one versioned document per Brief, read through the canonical loader (section 54) and written within the serialised mutation boundary (section 55). It is excluded from the Project Graph revision (section 56) and is never a canonical record. Like other provenance Pactwright writes, it is committed with the work it accompanies. Its exact path and serialisation are implementation concerns.

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

Pactwright needs enough structured Review output for the runtime to choose among declared transitions. The runtime's structured Review result states at least which delivered state it evaluated and one of three outcomes: the state may progress, it requires correction at a named declared Delivery step, or it cannot currently progress. The runtime recognises the result by its declared form and never infers it from free text; output that does not map to it is an execution failure, never a transition. Review may report more, never less; this specification defines no richer protocol.

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
- preserving valid existing work where possible;
- stating the delivered work and verification facts that Evidence records.

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

For each non-superseded Intent, derive at most one current Decision; a current proceeding Decision selects exactly one current Contract. Each Contract is selected by exactly one Decision. A later Decision of the same or another Intent cannot select an existing Contract, whether current, withdrawn or superseded. An Intent direction comprises its linear Intent-supersession chain. Re-authorisation, Contract change and Intent replacement create a new Contract that supersedes the last Contract of that direction when one exists; omitting that supersession is invalid lineage. Independent Intent directions may progress concurrently; competing current Briefs or Evidence for the same parent are ambiguity, not parallel execution. Records reached only through a non-current ancestor are not current merely because they have no direct supersession edge.

Required relationship cardinalities apply to all stored records, including non-current history: each Decision resolves one Intent and selects exactly one Contract for proceed and none for reject/defer; each Brief decomposes one Contract and each Evidence evidences one Brief. Each stored Intent has at most one unsuperseded Decision, each stored Contract at most one unsuperseded Brief, and each stored Brief at most one unsuperseded Evidence. Count these heads before filtering ancestor currency; preserving historical records does not excuse contradictory historical lineage.

Reject contradictory cardinality, malformed records, invalid edges and cross-direction supersession rather than choosing by order, timestamp or ID. Decision supersession stays within one Intent; Contract supersession stays within the same Intent-supersession direction (including an explicit replacement Intent), never an unrelated direction; Brief supersession stays within one Contract and Evidence supersession within one Brief. A superseded Intent and its descendants cease to be a current direction; its replacement starts without inheriting the old Decision.

This is structural derivation from graph records and edges, including the syntactic validity of a Decision actor. It does not evaluate lifecycle policy or authenticate that actor. The selected Contract is recorded graph authority, not permission to execute. Policy validation and mutation/execution guards must reject unauthorised action before effects; changing policy neither edits historical Decisions nor changes the graph revision. Derivation is per Intent. An affected Intent returns its problems and no current lineage, recorded Contract or broad state, while every unaffected Intent's lineage, recorded Contract and broad state are derived exactly as without the defect. An incomplete load (section 54) makes all results diagnostic-only. A complete load with a lineage defect still fails complete-state validation for execution/mutation; diagnostic availability of another Intent cannot bypass section 55.

---

# 45. Supersession

Canonical truth changes explicitly. Every already stored core record, including an unresolved Intent, is immutable in identity, type and canonical content. Before mutation, compare the complete proposed graph with the completely loaded stored graph the mutation plan validated, not a scan of Git history. Removing an existing core ID is invalid, including removal followed by an addition under another ID. Removing or replacing an existing core edge tuple is invalid. Additions and explicit supersession preserve their predecessors; normalisation-equivalent edits are not semantic mutations.

A single snapshot cannot establish whether a user manually rewrote an earlier snapshot. Normal loading does not claim historical tamper detection. Git remains the history mechanism. Extension-owned data has its owning semantics and the explicit preservation/deletion authority in Spec 02; that cannot authorise rewriting core records or lineage edges.

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

A current `reject` or `defer` Decision may instead supersede a proceeding Decision. It selects no Contract: the old Contract and its descendants remain stored but are withdrawn from current lineage through the superseded Decision. No replacement Contract or cross-type supersession is manufactured. Later re-authorisation creates a new proceeding Decision and a new Contract, superseding the previous Decision and the last Contract of that direction where one exists; it does not revive the withdrawn Contract or its Brief/Evidence. Omitting the new Contract or required supersession, or re-selecting a stored Contract, is a lineage validation error, not just a mutation-policy violation. Withdrawal and re-authorisation are validated and written as one complete proposed graph. The released runtime's refusal to withdraw a proceeding Decision is not the target behaviour.

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

Each adapter command invokes one core capability (section 35): `/capture-intent`, `/propose-contracts`, `/approve-contract` and `/write-brief` invoke `delivery-specification`; `/deliver-brief` and `/prepare-evidence` invoke `delivery-execution`; `/review` invokes `delivery-review`. The adapter reaches the runtime through Pactwright-owned hand-off commands under `pactwright lifecycle`, rendered by the adapter and versioned with the runtime: one dispatches a responsibility, checking that it is the permitted next action for its direction (`/capture-intent` starts a direction and is always permitted, subject to actor policy), resolving its capability to the agent the selected Agent Pack maps and returning that agent with the section 39 context, and one hands the responsibility's structured result to the runtime, which applies the canonical mutation or execution-state write under section 55 and, for `/propose-contracts`, records nothing. In the adapter path the rendered command delegates the work to the rendered agent; the runtime's in-process capability-invocation seam is the path `lifecycle run` and evaluation use. They are adapter protocol, not a public contract, and a rendered prompt never performs the runtime's work itself.

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

Section 32 fixes the minimum structured Review result; any richer Review-result vocabulary is not fixed by this specification.

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

The latest delivered state is the state the most recent Delivery step produced; a Delivery step completed after the latest Review is a delivery change that requires Review. Changes made outside a Delivery step are not delivered state.

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
- resolving repository revision for replayable execution provenance;
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

## Canonical loading profile

All runtime reads of Pactwright-owned repository inputs use one canonical loader and its registered decoders. For a supplied project root, the required paths are:

| Input | Path and representation |
|---|---|
| Desired configuration | `.pactwright/config.yml`, YAML mapping owned by Spec 02 |
| Lifecycle configuration | `.pactwright/lifecycle.yml`, YAML mapping owned by section 27 |
| Resolved environment | `.pactwright/lock.yml`, YAML mapping owned by Spec 02 |
| Core records | `specs/nodes/<id>.md`, section 6 envelope |
| Core edges | `specs/graph/edges.yml`, YAML mapping containing only `edges`, an array of section 15 tuples |

These retain the released `0.0.1` core paths and representation. Valid released core-type records and core-relation tuples conforming to section 6 remain readable without rewrite. Released Extension-typed records in `specs/nodes/` and Extension relation tuples in `specs/graph/edges.yml` are a changed stored format: report them and never move them during loading. Spec 02 section 15 requires an explicit versioned upgrade migration into the owning Extension store when enabled registered types/relations establish unambiguous ownership; otherwise preserve the bytes and report the migration prerequisite.

Recognised released formats are desired configuration `version: 1`, lifecycle `version: 1` / `stages` (section 27), and the released unversioned lock shape (Spec 02 section 12). Recognised earlier formats are read-only inputs to diagnostics and explicit migration, not unknown/unsupported data and never rewritten on load. Unknown versions remain explicit errors. Shape, lock and package semantics use owning decoders through this loader, not parsers at each caller. Empty/null edge documents and non-`.md` entries formerly accepted by `0.0.1` are intentional compatibility tightenings, not retrospectively labelled malformed old data; loading reports and preserves them. Spec 02 section 15 owns their explicit migration/remediation treatment.

Missing required files or the records directory, unreadable inputs, malformed documents and unrecognised active-storage entries are reported with path and cause. `specs/nodes/` permits only `<id>.md` records and an optional empty `.gitkeep`; `specs/graph/` permits only `edges.yml` and an optional empty `.gitkeep`. Nested directories in these two core stores are errors. An existing empty records directory and explicit `edges: []` are valid for loading; a blank document or `edges: null` is not an empty graph.

`specs/extensions/` is optional with no declared Extension stores. When present, it permits only valid Extension-ID directories and an optional empty `.gitkeep`; stray files, invalid directory names and symlinked directories are errors. Within an active owner root, only manifest-declared canonical files/subdirectories, the owner edge file and an optional empty `.gitkeep` are accepted; declarations cannot escape that root. Symlinked store roots, ancestors or entries are never followed. Inactive roots are inventoried without decoding their contents; their data is preserved. All unexpected entries, including `.DS_Store`, are reported without deletion. Loading never invents defaults, repairs data, writes files, installs components or accesses GitHub.

The result retains parseable values and all problems for `validate`, `doctor` and read-only diagnostics, with an explicit incomplete/error result when required inputs fail. No ordinary mutation, execution or successful complete Project Graph revision may use that partial result. The sole migration exception is Spec 02 section 15: a recognised complete legacy input is read-only input to an explicitly selected, versioned migration, validated under its source format before any write. An arbitrary parse failure is not migration authority. Component-level inspection is not whole-repository acceptance.

Configuration may declare Extensions and GitHub before their implementations are available. Preserve those declarations. An enabled Extension that cannot register its canonical contribution is an unsupported/incomplete-environment error; it cannot be treated as an empty contribution. A disabled or removed Extension requires no installed implementation to preserve and report its inactive owned directory; it does not block an otherwise complete active load. A GitHub declaration is inert during local loading: report unavailable GitHub operations without provisioning them or disabling otherwise supported local graph inspection. Neither declaration proves the corresponding capability works.

## Extension storage ownership

The shared store is the union of the core stores above and enabled Extension contributions. Each Extension owns its canonical storage below `specs/extensions/<extension-id>/`; the Extension declares the files/subdirectories, decoders, schemas and canonical projections there. `specs/extensions/<extension-id>/edges.yml` uses the shared edge envelope and holds exactly tuples of relations that Extension registers, plus `supersedes` tuples between its own registered node types. The relation owner determines placement, not the source endpoint owner; `supersedes` is the reserved exception, placed with the common endpoint-type owner. Any foreign tuple there, and any non-core tuple in `specs/graph/edges.yml`, is an ownership error. Reports and execution output are not canonical files. Extension IDs are lower-case kebab tokens starting with a letter; `core` is reserved and cannot name an Extension. Core storage accepts only core record types and core lineage tuples. An Extension cannot claim another owner's path, store its records in core storage, store a core node type in its directory, or place tuples of core lineage relations between core records there. An Extension-owned additional relation between core records still belongs to that Extension's edge file. Additional cross-graph relations and same-type supersession of its own registered node types remain permitted through the shared validator.

Every canonical contribution has a reserved owner (`core` or an Extension ID), a non-empty `kind`, a stable non-empty `key` and a JSON-compatible canonical `value`. `(owner, kind, key)` is unique in the active contribution set. The core contribution uses its type as kind, ID as key, and complete normalised frontmatter/body as value. All contribution values obey the JSON, Unicode and numeric domain in section 6. Extension keys, values and serialisations otherwise follow their own semantic schemas: a Domain Definition or Source must not acquire a core ID/title/date/body merely to be hashed. A contribution becomes an edge endpoint only when its owner also registers a node projection with a globally unique endpoint ID and a registered node type. Non-node canonical records still contribute to graph revision.

The record-model seam validates contribution ownership, key/value, owner schema and optional node projection, including global endpoint identity and registered node type. The shared edge validator then validates tuples against those node projections under section 15. An Extension's canonical projection is part of its versioned semantic format, not permission to reinterpret stored data silently during upgrade. Installed Extensions supply the same declarations through Spec 02 sections 10–12 compatibility/locking and every declared canonical input through the canonical loader; there is no parallel installed-only validator or hash path.

Disabled or removed Extension directories remain user data: list them as inactive, preserve every byte and exclude their records/edges from the active graph and its revision. Do not interpret or repair inactive contents, and do not let active edges resolve to their records. Re-enabling requires successful registration and full validation before activation. Unknown data in active/core stores still fails closed; moving or deleting that data is never an automatic repair. Legacy Extension data with ambiguous ownership is preserved and reported as a migration prerequisite, not silently attributed or discarded.

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

Every public mutation entry point, including CLI, API and adapter-driven calls, uses the same plan, complete-state validation, section 45 immutability check and authority guards. The stored base is the exact bytes and existence/inventory of all required configuration, lifecycle, lock and active canonical-storage inputs used by the plan, together with the resolved registry/decoder identities. It is not just `project_graph_revision`; a concurrent policy edit or newly added input makes the plan stale even if pg1 is unchanged. Recheck that complete base and perform the write/result validation in one serialised mutation boundary, indivisible with respect to other Pactwright mutations. A stale base or failed guard leaves records, edges and unrelated files unchanged; do not overwrite a concurrent input change. The locking/transaction implementation is internal, not a second state database. Lifecycle execution-state writes (section 28) use the same serialised boundary, and a plan that reads execution state includes it in its stored base. Validate the resulting state before reporting success. A prompt instruction or an early fixture does not substitute for this integrated guard.

A dispatched Delivery or Review step completes only against the canonical state it was dispatched against. Dispatch records the Project Graph revision in the Brief's execution state; a result that arrives after any canonical change, whether made by the executing agent or by anyone else, is refused as an execution failure reporting that canonical state changed since dispatch. The step stays current for a fresh dispatch, execution state does not advance, and the change is reported, never reverted. Across the dispatch gap only canonical change is checked; configuration, lifecycle and lock changes are not detected across it, and the result is planned and validated against the state current at result time under the result command's own stored base. Execution-state documents are written only through this boundary; a hand edit of one has the same standing as a hand edit of a canonical record, visible in repository history and checked by validation, not prevented by the runtime.

---

# 56. Project Graph Revision and Shared Replay Identity

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

A Project Graph revision identifies semantic graph state. It does **not** identify all repository bytes or the AI execution environment used by an execution.

## Graph revision protocol

The initial protocol is `pg1:sha256:<digest>`, with exactly 64 lower-case hexadecimal digest digits. Compute SHA-256 over the UTF-8 [RFC 8785 JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785.html) serialization, without a trailing newline, of:

```json
{"format":1,"records":[],"edges":[]}
```

Populate `records` with `{ "owner": <owner>, "kind": <kind>, "key": <key>, "value": <canonical value> }` from the section 54 contribution registry for every stored core record, including superseded records, and every enabled registered Extension canonical record, including non-node records. Sort records by `owner`, then `kind`, then `key`. Populate `edges` with the exact active tuples and sort by `source`, then `type`, then `target`. These comparisons use unsigned UTF-16 code-unit order, not locale order. Core values are `{ "frontmatter": <complete mapping>, "body": <normalised body> }` using section 6 normalisation; Extension values follow their owning canonical projection. JCS preserves other array order and string content. Do not include file paths, directory order, registry implementation objects or any excluded derived state. A successful revision requires a complete active load whose contributions and edges pass sections 6, 15 and 54 validation. Invalid encoding/value domain, record or owner-schema failure, invalid identity, ownership or registration failure, an unknown type/relation, a missing or inactive endpoint, a disallowed endpoint type, duplicate tuples, self/cyclic/branching/merging supersession, any failed required input (including configuration, lifecycle or lock), or an enabled Extension that cannot register yields no successful revision. Section 44 lineage failures and section 57 actor-policy failures do not prevent one when that structural/load boundary passes. A graph with two current Briefs is therefore hashable but not executable. This keeps graph revision independent of lineage acceptance and execution policy.

A runtime or platform change must preserve this protocol's bytes and digest for the same canonical input. Any future incompatible normalisation/serialization change needs a different protocol identifier and explicit replay compatibility handling; never reinterpret a recorded `pg1` digest using new rules. Unknown protocols fail pinned replay. Frozen input, canonical-byte and digest examples are retained in [the pg1 protocol vectors](./fixtures/project-graph-revision-pg1.json). Their `input` collections are unsorted projections; apply the specified record/edge sort before JCS. Vectors with `stored_files` also fix exact UTF-8 source bytes and expected parsed projections, including CRLF, comments, reordered keys and YAML scalar resolution. They are definition fixtures, not evidence that a runtime verifier has executed. This protocol does not define environment-lock or lifecycle-shape hashing.

The released unprefixed `sha256:<digest>` graph identity is a recognised legacy protocol, not an alias for `pg1`. Never add the pg1 prefix to an old digest or compare the two as equivalent. A legacy replay requires its exact old runtime/environment and algorithm; without that implementation it is explicitly unavailable. Migration can compute a new pg1 identity for the migrated state but must preserve existing provenance and its legacy identity.

Project Graph revision is derived from the canonical inputs loaded at the supplied project root, not from HEAD objects. It requires no Git repository, commit or clean working tree. Unavailable repository revision prevents a replay base, not hashing of a complete structurally valid graph.

For execution provenance that promises pinned replay, Pactwright uses the shared replay base:

```text
repository_revision
+ project_graph_revision
+ environment_lock_hash
```

`repository_revision` identifies the exact committed repository input base as `git:<object-format>:<full-commit-id>`, with `object-format` exactly `sha1` (40 lower-case hexadecimal commit digits) or `sha256` (64), not a branch/ref name, abbreviated ID, tree-only ID or an unrecorded working-tree hash. Recorded values must satisfy this grammar and resolve to commits. The supplied project root must equal the Git top level for this profile; a nested project root reports repository revision unavailable rather than losing its subdirectory identity. Graph-only loading/hashing still uses the supplied root.

Resolution requires an existing Git commit, no staged/unstaged tracked changes and no non-ignored untracked files. Required Pactwright input files, including active graph stores, configuration, lifecycle and locks, must be tracked in that commit even if an ignore rule would hide them. An empty record directory represented by its tracked `.gitkeep` is valid. Ignored generated output and installed dependencies are not part of the repository input base; the resolved environment and other external inputs retain their separate provenance. Do not read an ignored input and describe it as reconstructed from the commit.

Without Git, without a commit, with a dirty input base or with required input bytes unavailable from the recorded commit, report the repository revision as unavailable and refuse pinned execution/replay. Do not auto-commit, stash, reset, add or delete files to make it available. Graph-only diagnostics and hashing of a complete valid graph do not require Git. For this initial repository-identity profile, a required input supplied by a submodule, an LFS pointer, a symlink or other external-only content is unavailable; do not pretend the Git pointer contains the required bytes. Ordinary ignored installed dependencies remain owned by the separate environment lock. Supporting extra repository input transports requires a later explicit provenance/verification contract, not an implementation-specific fallback. Restoring an old revision uses existing Git mechanisms in an isolated location and verifies the recorded graph revision before execution.

An operation that promises pinned replay resolves and verifies its complete replay base before any execution effect. If an identity is unavailable, refuse before an execution attempt exists; report the refusal without creating replay provenance, Findings, agent invocations or canonical mutation. After preflight succeeds, an attempted operation records success or failure against that pinned base. Provenance Pactwright writes is ordinary repository content and must be committed before the next pinned execution; the revision resolver must not commit it automatically. The operation owner declares its provenance inputs and applies this boundary (Graph Review: Spec 04 sections 8/20).

`project_graph_revision` identifies the canonical Project Graph state derived from that repository state.

`environment_lock_hash` identifies the exact resolved Pactwright execution environment and is owned by Spec 02.

The identities are deliberately distinct:

```text
repository_revision
≠ project_graph_revision
≠ environment_lock_hash
```

A replay operation must reconstruct the recorded repository revision and verify that Pactwright derives the recorded Project Graph revision from it before executing. It must also resolve the recorded environment lock through Spec 02.

If any required identity cannot be reconstructed or verified, pinned replay fails explicitly rather than substituting current state.

This shared tuple does not define every execution-specific input. Lifecycle shape identity, Graph Review request/scope and mutable external evidence remain additional provenance where applicable.

The exact lifecycle-shape identity mechanism remains unresolved under sections 23 and 28; this replay contract does not force shape identity into the Brief or require a shape hash.

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
- extension state that illegally redefines core Delivery semantics;
- replay provenance whose recorded repository state does not derive its recorded Project Graph revision when replay validation is requested.

Validation should fail before canonical mutation where possible.

Structural graph validation and read-only lineage derivation do not authenticate actors. Integrated validation checks current Decisions' recorded actor kinds against the applicable lifecycle policy and reports unauthorised Decisions; mutation and execution guards enforce that policy before effects. A changed current policy does not retroactively invalidate withdrawn historical Decisions solely because their actors are no longer allowed. Historical attribution remains stored; a requested historical policy check reads the recorded repository revision from its replay-base document and reads lifecycle policy from that revision. Missing revision/policy means unavailable verification, not failure of the old actor under today's rules; no separate policy-history store is introduced. Such a check establishes kind-policy compatibility, not identity authentication. A missing policy or incomplete load cannot grant permission.

Replay validation (the last rule above) and the historical policy check are requested explicitly. A replay-base document records the section 56 tuple as `version: 1`, `repository_revision`, `project_graph_revision` and `environment_lock_hash`; it is supplied by path and decoded by the canonical loader, and it is validation input, not a provenance store. Replay validation requires the document. The historical policy check names one stored Decision and may omit the document; when it is omitted, or its recorded revision cannot be reconstructed, the check reports unavailable verification without failing validation.

The check for Evidence attempted before successful closing Review reads the Brief's execution state (section 28). Current Evidence whose Brief has no execution-state document fails the check. Evidence written by a runtime that predates execution state is immutable and cannot be repaired, so the explicit released-format migration (Spec 02 section 15) writes a legacy-closure execution-state document for each such Brief; the check reports a Brief with that document as unavailable verification and does not fail validation. The runtime writes a legacy-closure document only in that migration.

Diagnostic results distinguish malformed structure, unsupported/inactive components and unavailable execution authority rather than claiming that every parsed record is ready to run.

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
21. Repository revision and Project Graph revision are distinct identities.
22. Replayable execution provenance uses `repository_revision + project_graph_revision + environment_lock_hash` as its shared replay base.
23. Pinned replay fails rather than silently substituting current repository, graph or environment state.

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

The shared replay tuple does not justify a new snapshot database, repository abstraction or environment archive. Existing repository and package mechanisms should be used until real retention failures demonstrate a need for additional infrastructure.

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
- support for richer domain-neutral shapes without adding domain-specific stages;
- shared replay identity across repository state, Project Graph state and the resolved execution environment.

The replay tuple resolves the cross-spec identity contract but deliberately leaves historical repository/package retention and lifecycle-shape representation to their existing owners and implementation evidence.

These are evolutions of the existing lifecycle architecture rather than a replacement for it.

---

# 61. Relationship to Other Canonical Specifications

This specification defines Pactwright core semantics.

The surrounding canonical system is:

```text
01 Pactwright Core System and Lifecycle
→ Contracts, Delivery Graph, lifecycle and repository/Project Graph replay identity

02 Distribution, Agent Packs, Extensions and Evaluation
→ execution composition, environment-lock identity and distribution

03 Project Intelligence
→ durable project knowledge and guidance

04 Graph Review
→ specialist Project Graph analysis and pinned replay

05 Assets and Publication
→ approved durable outputs and publication

06 Operations
→ real-world exposure and feedback

07 GitHub Integration
→ remote automation and replay-aware projection

08 Open-Source Project Organisation
→ repository, ecosystem and public project structure
```

No neighbouring specification may redefine the Contract, Delivery Graph or core lifecycle semantics established here.

---

**Pactwright Core System and Lifecycle v6**
