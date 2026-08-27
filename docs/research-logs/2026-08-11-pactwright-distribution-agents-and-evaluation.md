# Pactwright — Distribution, Agents and Evaluation

## 1. Purpose and Architecture

This specification defines how Pactwright is packaged, installed, extended, synchronised, provisioned into GitHub, upgraded and evaluated.

Pactwright separates:

```text
stable Project Graph semantics
        ↓
runtime
        ↓
optional graph extensions
        ↓
agent pack
        ↓
project configuration
        ↓
generated local + GitHub integration
```

The layers evolve independently.

### Runtime

The `pactwright` runtime owns deterministic mechanics:

- CLI
- Project Graph storage and validation
- context loading
- Delivery lifecycle orchestration
- configuration and locking
- extension loading
- agent/skill loading
- adapter generation
- GitHub provisioning
- evaluation runner

The runtime should contain as little model-specific AI behaviour as possible.

### Graph extensions

Extensions add specialised Project Graph semantics without redefining the Delivery Graph.

Initial first-party extensions include:

```text
@pactwright/project-intelligence
@pactwright/review-creative
@pactwright/operations
```

Extensions may depend on other extensions.

Dependency resolution is handled by Pactwright during installation and upgrade.

An extension may contribute:

- node and edge types
- schemas and validation
- namespaced runtime commands
- context contribution
- required agent capabilities
- generated repository integration
- GitHub automation requirements
- GitHub projection requirements

Extensions define their own graph semantics.

They do not own GitHub-specific projection mechanics.

### Agent packs

Agent packs contain fast-moving AI behaviour:

- system prompts
- agent definitions
- skills
- model adaptations
- evaluation cases

Extensions define what capability is required.

Agent packs define how current models perform it.

---

## 2. Distribution and Initialisation

Install Pactwright as a Node development dependency:

```text
pnpm add -D pactwright
```

The core package contains:

- runtime and CLI
- core graph schemas
- Delivery lifecycle engine
- extension loader
- default agent pack
- Claude Code adapter
- GitHub provisioner
- evaluation framework

Project Graph data is never distributed with the package.

Initialise a repository:

```text
pnpm pactwright init
```

Core structure:

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

.github/
  workflows/
```

`.pactwright/` contains project configuration, `specs/` contains Project Graph state, and `.claude/` plus Pactwright-managed GitHub files are generated integration surfaces.

Users should not manually copy Pactwright runtime scripts, agents or workflow commands between repositories.

---

## 3. Project Configuration

`.pactwright/config.yml` describes desired installation state.

```yaml
version: 1

agent_pack:
  source: "@pactwright/standard"
  version: "^1.0.0"

adapter:
  type: claude-code

extensions: {}

github:
  enabled: true
```

Configuration expresses intent.

Exact resolved versions and hashes live in `.pactwright/lock.yml`.

Generated files and GitHub remote state derive from configuration plus the lock file.

---

## 4. Managed Extensions

Pactwright manages extension installation.

Install Project Intelligence:

```text
pactwright extension add project-intelligence
```

Pactwright resolves:

```text
@pactwright/project-intelligence
```

The command:

1. resolves a compatible package
2. adds it as a project dependency
3. registers it in `config.yml`
4. records the exact package/version/hash in `lock.yml`
5. validates runtime compatibility
6. validates required agent capabilities
7. creates extension-owned repository structure
8. runs `pactwright sync`
9. reports required GitHub provisioning

The explicit package form is also valid:

```text
pactwright extension add @pactwright/project-intelligence
```

### Graph Review & Creative Delivery

Install:

```text
pactwright extension add review-creative
```

Pactwright resolves:

```text
@pactwright/review-creative
```

Its manifest requires Project Intelligence.

If Project Intelligence is not already enabled, Pactwright resolves and installs the compatible dependency before enabling `review-creative`.

### Operations Graph

Install:

```text
pactwright extension add operations
```

Pactwright resolves:

```text
@pactwright/operations
```

Its manifest requires Project Intelligence.

If Project Intelligence is not already enabled, Pactwright resolves and installs the compatible dependency before enabling "operations".

```text
The dependency graph is:
review-creative ──requires──┐
                           ↓
                  project-intelligence
                           ↑
operations ─────requires───┘
                           ↓
                      Delivery core
```

`review-creative` and "operations" are independent sibling extensions.

Neither requires the other.

Dependency installation uses the same compatibility, locking, capability-validation, sync and provisioning path as explicit extension installation.

The first version only needs package-backed first-party extensions.

### One-shot setup

```text
pactwright init --with project-intelligence --github
```

MUST compose the same operations as:

```text
pactwright init
pactwright extension add project-intelligence
pactwright github sync
```

There is no separate full-install implementation.

A creative-capable setup may use:

```text
pactwright init --with review-creative --agent-pack @pactwright/creative --github
```

An Operations-capable setup may use:

```text
pactwright init --with operations --github
```

Both extensions resolve their Project Intelligence dependency automatically.

A repository may enable both:

```text
pactwright init \
  --with review-creative \
  --with operations \
  --agent-pack @pactwright/creative \
  --github
```

These commands compose normal initialisation, agent-pack selection, extension installation and GitHub sync rather than introducing separate setup paths.

### Configuration

```yaml
extensions:
  project-intelligence:
    enabled: true
    source: "@pactwright/project-intelligence"

  review-creative:
    enabled: true
    source: "@pactwright/review-creative"

  operations:
    enabled: true
    source: "@pactwright/operations"
```

Disabling an extension stops loading its behaviour but does not change the meaning of records owned by Delivery or other extensions.

Remove explicitly:

```text
pactwright extension remove operations
```

Removal MUST preserve user-authored extension graph data unless the user separately chooses to delete it.

Only generated files and remote GitHub state exclusively owned by that extension may be removed automatically.

An extension cannot be disabled or removed while an enabled extension still depends on it unless the dependent extension is disabled or removed in the same operation.

---

## 5. Extension Contract

Each extension contains a versioned manifest.

### Project Intelligence

```yaml
id: project-intelligence
package: "@pactwright/project-intelligence"
version: 1.0.0
pactwright: "^1.0.0"

graph:
  node_types:
    - source
    - domain
    - knowledge

runtime:
  namespace: intelligence

agent_capabilities:
  - intelligence-triage
  - intelligence-promotion
  - intelligence-context

github:
  profile: project-intelligence
```

### Graph Review & Creative Delivery

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

github:
  profile: review-creative
```

### Operations Graph

```yaml
id: operations
package: "@pactwright/operations"
version: 1.0.0
pactwright: "^1.0.0"

dependencies:
  extensions:
    - project-intelligence

graph:
  node_types:
    - deployment
    - observation

  edge_types:
    - deployed-as
    - observes

runtime:
  namespace: operations

agent_capabilities:
  - operations-analysis

github:
  profile: operations
```

Shared core relations such as `supersedes` are reused rather than redeclared by extensions.

The manifest declares:

- runtime compatibility
- extension dependencies
- graph contribution
- command namespace
- required agent capabilities
- GitHub profile

It contains no project-specific configuration.

Extensions register namespaced commands such as:

```text
pactwright intelligence ingest
pactwright intelligence validate
pactwright intelligence onboard
pactwright review run
pactwright review roster
pactwright creative approve-asset
pactwright creative validate
pactwright operations record-deployment
pactwright operations ingest
pactwright operations observe
pactwright operations validate
```

The selected agent pack must satisfy every capability required by enabled extensions.

Installation fails before canonical graph mutation when compatibility is incomplete.

GitHub profiles declare logical automation and projection requirements.

They do not define GitHub as canonical state and do not override the GitHub Actions and Views specification.

---

## 6. Locking and Reproducibility

`.pactwright/lock.yml` records the exact resolved environment.

```yaml
runtime:
  version: 1.2.0

extensions:
  project-intelligence:
    package: "@pactwright/project-intelligence"
    version: 1.1.0
    hash: sha256:...

  review-creative:
    package: "@pactwright/review-creative"
    version: 1.0.0
    hash: sha256:...
    dependencies:
      project-intelligence: 1.1.0

  operations:
    package: "@pactwright/operations"
    version: 1.0.0
    hash: sha256:...
    dependencies:
      project-intelligence: 1.1.0

agent_pack:
  name: "@pactwright/creative"
  version: 1.1.0
  hash: sha256:...

agents:
  spec: sha256:...
  deliverer: sha256:...
  reviewer: sha256:...
  review-runner: sha256:...
  operations-analyst: sha256:...
```

Execution metadata may additionally record provider/model identifiers when useful.

Runtime, extensions and agent packs are independently versioned and reviewable.

---

## 7. Agent Packs and Capabilities

The default pack is:

```text
@pactwright/standard
```

Example manifest:

```yaml
name: "@pactwright/standard"
version: 1.5.0
pactwright: "^1.0.0"

capabilities:
  delivery-specification: spec
  delivery-execution: implementer
  delivery-review: reviewer

  intelligence-triage: spec
  intelligence-promotion: spec
  intelligence-context: spec

  operations-analysis: operations-analyst

agents:
  spec:
    prompt: agents/spec.md
    skills:
      - repository-analysis
      - contract-writing

  implementer:
    prompt: agents/implementer.md
    skills:
      - repository-analysis

  reviewer:
    prompt: agents/reviewer.md
    skills:
      - implementation-review

  operations-analyst:
    prompt: agents/operations-analyst.md
    skills:
      - operational-evidence-analysis
```

A pack may provide capabilities for extensions that are not enabled.

Unused capabilities are simply not invoked.

This allows the first-party packs to remain complete without introducing one package for every possible extension combination.

Runtime composition is:

```text
core Pactwright semantics
+ enabled extension semantics
+ agent system prompt
+ selected skills
+ task-specific Project Graph context
```

Precedence is:

```text
core semantics
    ↓
extension semantics within owned scope
    ↓
agent behaviour
```

Skills encode reusable techniques, not lifecycle stages.

A new AI technique should normally change a skill or agent pack rather than graph semantics.

### Creative-capable agent pack

A repository using Graph Review & Creative Delivery may select:

```text
@pactwright/creative
```

The pack is complete for the first-party extension set, including Operations.

**Example:**

```yaml
name: "@pactwright/creative"
version: 1.1.0
pactwright: "^1.0.0"

capabilities:
  delivery-specification: spec
  delivery-execution: deliverer
  delivery-review: reviewer

  intelligence-triage: spec
  intelligence-promotion: spec
  intelligence-context: spec

  graph-review: review-runner
  creative-delivery: creative-producer
  creative-verification: creative-verifier
  generation-review: generation-reviewer

  operations-analysis: operations-analyst

agents:
  spec:
    prompt: agents/spec.md
    skills:
      - repository-analysis
      - contract-writing

  deliverer:
    prompt: agents/deliverer.md
    skills:
      - repository-analysis
      - delivery-execution

  reviewer:
    prompt: agents/reviewer.md
    skills:
      - delivery-review

  review-runner:
    prompt: agents/review-runner.md
    skills:
      - graph-analysis
      - specialist-review

  creative-producer:
    prompt: agents/creative-producer.md
    skills:
      - grounded-generation
      - creative-production

  creative-verifier:
    prompt: agents/creative-verifier.md
    skills:
      - grounding-verification
      - creative-review

  generation-reviewer:
    prompt: agents/generation-reviewer.md
    skills:
      - generation-analysis
      - evaluation-design

  operations-analyst:
    prompt: agents/operations-analyst.md
    skills:
      - operational-evidence-analysis
```

The pack is complete rather than layered on top of `@pactwright/standard`.

Pactwright selects one agent pack initially.

Different Review Definitions may map to the same `graph-review` implementation.

Adding a reviewer does not require adding another agent unless evaluation demonstrates the need.

Software repositories may still map `delivery-execution` to an agent named "implementer".

Creative repositories may map the same core responsibility to a more general "deliverer", while the `creative-delivery` extension capability handles specialised asset production.

Operations analysis remains independent from Delivery execution and Project Intelligence promotion.

### Capability compatibility

When enabling or upgrading extensions, Pactwright resolves the union of required capabilities:

Delivery core capabilities

```text
+ enabled extension capabilities
        ↓
required capability set
        ↓
selected agent pack
```

For all initial first-party extensions, the complete capability set is:

delivery-specification

delivery-execution

delivery-review

intelligence-triage

intelligence-promotion

intelligence-context

graph-review

creative-delivery

creative-verification

generation-review

operations-analysis

Only capabilities required by enabled extensions are mandatory.

For example, a project using Delivery + Project Intelligence + Operations does not require the Review & Creative capabilities.

If the selected pack is incomplete, the operation stops before canonical graph mutation and reports the missing capabilities.

Pactwright may recommend a known compatible pack, but it MUST NOT silently replace the configured agent pack.

### Agent-pack selection

Select a different complete pack through:

```text
pactwright agent-pack use @pactwright/creative
```

The command:

1. resolves a compatible pack;
2. validates it against core and enabled-extension capabilities;
3. updates `config.yml`;
4. records the exact package/version/hash and resolved agent hashes in `lock.yml`;
5. runs `pactwright sync`;
6. reports GitHub integration changes if any.

Pack selection fails without changing the lock file when required capabilities are missing.

Agent-pack composition is not required initially.

---

## 8. Adapter and Local Synchronisation

Canonical agent definitions do not live in `.claude/`.

The initial Claude Code adapter renders resolved agents and commands into:

```text
.claude/agents/
.claude/commands/
```

Enabled extensions contribute through the same adapter process.

Run:

```text
pactwright sync
```

after configuration, runtime, extension or agent-pack changes.

"sync":

1. loads configuration and lock state
2. loads enabled extensions
3. validates required capabilities
4. assembles agents and skills
5. renders the active AI adapter
6. renders Pactwright-managed GitHub workflow files
7. updates other Pactwright-managed generated repository files

Repeated sync with unchanged inputs MUST produce identical output.

`pactwright sync` owns only Pactwright-managed local generated state.

Examples include:

```text
.claude/agents/**
.claude/commands/**

.github/workflows/pactwright.yml
.github/workflows/pactwright-intelligence.yml
.github/workflows/pactwright-review-creative.yml
.github/workflows/pactwright-operations.yml
```

Pactwright-managed CODEOWNERS entries

Pactwright-managed issue/PR templates or managed regions

Additional generated files MUST be explicitly declared as Pactwright-managed.

`sync` MUST NOT claim ownership of unrelated user-authored files such as arbitrary `.github/workflows/**`.

It does not mutate GitHub remote configuration.

---

## 9. GitHub Provisioning

Remote GitHub structure and configuration are reconciled through:

```text
pactwright github sync
```

Preview:

```text
pactwright github sync --dry-run
```

The command is idempotent and manages only Pactwright-owned state.

Dry-run MUST inspect current state, show proposed creates/updates/removals and perform no remote mutation.

### Provisioning boundary

`pactwright github sync` owns Pactwright-managed remote structure and configuration, including where enabled:

- repository settings
- semantic labels
- rulesets and required-check configuration
- the shared Pactwright GitHub Project
- Project fields
- Project views
- other Pactwright-owned remote configuration

GitHub Actions own runtime projection updates, including:

- checks and summaries
- Project items
- derived field values
- PR and Issue projections
- regenerated operational content

Actions MUST NOT independently redefine the remote schema that `github sync` reconciles.

The GitHub Actions and Views specification is authoritative for exact workflows, checks, projection behaviour, field semantics and view definitions.

### GitHub CLI boundary

Pactwright uses the authenticated "gh" CLI rather than maintaining its own GitHub credentials.

Use:

```text
native gh command
      ↓ when unavailable
gh api
```

Native commands cover operations such as:

```text
gh repo edit
gh label create
gh project create
gh project field-create
gh project link
```

`gh api` covers writable capabilities not exposed by first-class commands, including ruleset and Project-view operations where needed.

Users should not need to run these low-level commands during normal Pactwright setup.

### Authentication preflight

Before applying changes, Pactwright validates:

- "gh" is installed and authenticated
- the target repository is correct
- required repository permissions exist
- required Project scope exists when Projects are enabled

If an additional scope is required, stop and print the exact remediation, for example:

```text
gh auth refresh -s project
```

Pactwright MUST NOT silently broaden GitHub authentication scopes.

---

## 10. GitHub Desired State

Enabled components contribute GitHub profiles:

```text
Delivery profile
        +
Project Intelligence profile
        +
Review & Creative profile
        +
Operations profile
        +
project overrides
        ↓
resolved GitHub desired state
        ↓
pactwright github sync
```

Only enabled extension profiles contribute requirements.

Because both `review-creative` and "operations" depend on Project Intelligence, enabling either also activates the Project Intelligence profile.

Profiles may contribute logical requirements for:

- generated workflows
- repository settings
- labels
- checks
- Project fields
- Project views
- ruleset requirements

Identical requirements collapse.

Compatible requirements merge.

Incompatible requirements fail validation.

The initial implementation needs the Delivery profile plus the profiles contributed by enabled first-party extensions.

This is not a marketplace or generic plugin system.

Distribution owns profile composition and reconciliation.

The GitHub Actions and Views specification owns the exact GitHub operating surface produced from those profiles.

### Reviewer and owner identity mapping

Graph semantics refer to logical stewards and owners, not GitHub-specific identities.

Repository configuration maps those principals to GitHub users or teams when automation requires it.

The GitHub adapter uses that mapping for:

- CODEOWNERS generation
- review requests
- promotion ownership
- Operations review ownership where configured
- other GitHub review gates

Extensions MUST NOT embed GitHub usernames or team handles into canonical graph semantics.

If a required principal cannot be resolved to a GitHub reviewer, Pactwright reports the missing mapping rather than inventing one.

---

## 11. Repository Settings and Labels

`github sync` may reconcile only settings required by enabled Pactwright features.

**Examples:**

- enable Issues when Intent Issue views are used
- enable Projects when Pactwright Projects are used
- allow PR branch updates when configured
- delete branches after merge when configured
- enable auto-merge when lifecycle policy requires it

Pactwright MUST NOT impose unrelated repository preferences.

Semantic labels may include:

pactwright:intent

pactwright:generated

pactwright:intelligence

pactwright:promotion

pactwright:operations

Labels identify purpose, not lifecycle state.

Do not mirror canonical states such as "contracted", "reviewing", `stale`, `active` or `blocked` into labels when checks or Project fields already expose them.

---

## 12. GitHub Project

When GitHub Projects are enabled, Pactwright uses one shared GitHub Project per repository by default.

It is the operational projection of the whole Pactwright Project Graph.

The Delivery profile provides the core Project structure.

Enabled extensions may contribute compatible fields and views to the same Project.

Project Intelligence, Graph Review & Creative Delivery and Operations MUST NOT create separate Projects merely because those extensions are enabled.

Conceptually:

```text
Pactwright Project
├── Delivery projections
├── Project Intelligence projections
├── Review & Creative projections
└── Operations projections
```

Detailed canonical records remain in repository state.

### Provisioning

When enabled, `github sync`:

1. resolves or creates the shared Pactwright Project
2. links it to the repository
3. creates required fields
4. creates or updates Pactwright-owned views
5. records the resolved Project identifier
6. validates that configuration can be reproduced

Only fields and views required by enabled profiles are created.

The exact field catalogue, view catalogue and projection semantics are defined by the GitHub Actions and Views specification.

Pactwright generates Projects from versioned desired state.

A remote Project template is not required initially.

---

## 13. Rulesets, Checks and Actions Permissions

Pactwright may create or update a Pactwright-owned ruleset for the default branch.

Profiles may require checks.

The exact check names and blocking behaviour are defined by the GitHub Actions and Views specification.

Where writable `gh ruleset` commands are unavailable, Pactwright uses `gh api`.

It MUST NOT replace unrelated repository or organisation rulesets.

Conflicts are reported.

Generated workflows declare explicit least-privilege "permissions:".

Pactwright does not require broad repository-wide write defaults.

If repository or organisation policy prevents required automation, the provisioner reports the unavailable capability rather than weakening security controls.

Operational source credentials remain repository or organisation secrets and MUST NOT be copied into canonical configuration or generated workflow content.

---

## 14. Reconciliation and Removal

Pactwright removes remote configuration only when:

- Pactwright owns it
- no enabled component still requires it
- removal does not affect unrelated user state

Examples include an extension-only Project view, label or required check.

Shared fields/views remain while another profile requires them.

Removing Operations may remove Operations-only:

- workflows;
- views;
- fields;
- checks;
- labels;

but MUST NOT remove Project Intelligence integration while another enabled extension still requires it.

If ownership is ambiguous, leave the remote object intact and report it.

Fail safe rather than delete user state.

---

## 15. Upgrades

Runtime, extensions and agent packs upgrade independently.

### Runtime

```text
pnpm up pactwright
```

### Extensions

```text
pactwright extension upgrade project-intelligence
pactwright extension upgrade review-creative
pactwright extension upgrade operations
```

The command:

1. resolves a compatible package;
2. validates the complete extension dependency graph;
3. updates dependency and lock state;
4. validates schema compatibility and required agent capabilities;
5. runs explicitly defined migrations;
6. runs `pactwright sync`;
7. reports GitHub changes requiring `pactwright github sync`.

An extension upgrade MUST NOT silently reinterpret canonical Project Graph state.

A dependency upgrade must satisfy every enabled dependent extension before the lock file changes.

Agent pack

Select a pack:

```text
pactwright agent-pack use @pactwright/creative
```

Upgrade the configured pack:

```text
pactwright upgrade
```

Both operations validate the complete required capability set before updating lock state and regenerated adapter files.

New AI behaviour remains reviewable in Git.

---

## 16. Evaluation

Pactwright evaluates AI behaviour independently from normal project delivery.

```text
pactwright eval
```

Evaluation covers questions such as:

- contract fidelity
- scope discipline
- delivery compliance
- review defect detection
- prompt verbosity
- Project Intelligence source triage
- evidence comparison
- intelligence-context selection
- extension-aware graph review
- review finding quality and routing
- creative Brief adherence
- creative grounding and verification
- generation-guidance effectiveness
- operational signal compression
- exposure attribution
- baseline interpretation
- unsupported causality avoidance
- positive operational finding recognition
- Operations → Project Intelligence routing

Evaluation cases are versioned with the component that owns the responsibility.

Core cases test Delivery responsibilities.

Extensions contribute cases for their required capabilities.

The agent pack supplies the implementation being evaluated.

Conceptually:

responsibility

× agent implementation

× model

× evaluation suite

### Operations evaluation boundary

Operations evaluation should distinguish deterministic mechanics from semantic analysis.

Deterministic assertions may verify:

- required evidence references exist;
- Observation schema is valid;
- raw telemetry was not persisted as Project Graph nodes;
- the referenced production exposure exists;
- forbidden graph mutations did not occur;
- internal Source hand-off used Project Intelligence.

Semantic evaluation may judge:

- whether a signal was worth retaining;
- whether the Observation is supported by evidence;
- whether it is concise;
- whether uncertainty is preserved;
- whether significance is reasonable;
- whether causal language is justified.

### Evaluation strategy

Prefer deterministic assertions:

- required graph output exists
- forbidden mutation does not occur
- structured output is valid
- correct files changed
- scope and ownership boundaries are respected
- correct context records are selected

Use semantic judgement for qualities such as:

- clarity
- alternative quality
- contract fidelity
- review usefulness
- evidence interpretation
- operational finding quality
- unnecessary verbosity

Deterministic checks and semantic judgement remain separate.

### Baselines

A released agent pack establishes a baseline.

```text
pactwright eval \
  --baseline @pactwright/standard@1.5.0 \
  --candidate ./pack
```

Reports expose regressions by capability, agent and evaluation case.

Routine results are generated artefacts, not Project Graph nodes.

Do not use one aggregate score to decide whether a pack is better.

### Model variants

The same prompt may behave differently across providers and model versions.

Do not assume:

better model = same prompt but better results

Model-specific prompt variants are allowed only when evaluation demonstrates a material need.

---

## 17. Evolution Model

Pactwright has three evolution rates.

Runtime — slow-moving

May change:

- core Project Graph semantics
- Delivery lifecycle
- extension contract
- CLI and validation
- adapter API
- GitHub provisioner
- evaluation framework

Graph extensions — independently versioned

May change:

- extension-owned semantics
- schemas and validation
- commands
- GitHub profile requirements
- required agent capabilities

For example:

```text
Project Intelligence
    → knowledge + intent derivation
```

```text
Review & Creative
    → reviews + approved creative outputs
```

```text
Operations
    → deployment + production observations
```

Agent packs — fast-moving

May change:

- prompts
- skills
- agent composition
- model adaptations
- evaluation cases

A new model should normally require only an agent-pack release.

A Project Intelligence semantic change should normally require only a Project Intelligence release.

A Graph Review & Creative Delivery semantic change should normally require only a `review-creative` release.

An Operations semantic change should normally require only an "operations" release.

Operations analysis technique, creative generation technique, reviewer prompting or model-specific guidance should normally require only an agent-pack or project-guidance change.

None should require redesigning the Delivery Graph unless Delivery semantics themselves change.

---

## 18. Initial Packaging Target

The first distributable system implements:

### Core

```text
pactwright init
pactwright sync
pactwright validate
pactwright context
pactwright lifecycle ...
```

### Extensions

```text
pactwright extension add
pactwright extension remove
pactwright extension upgrade
```

and first-party packages:

```text
@pactwright/project-intelligence
@pactwright/review-creative
@pactwright/operations

with:
```

- manifest and dependency resolution
- independent locking
- capability validation
- Project Intelligence dependency enforcement for `review-creative`
- Project Intelligence dependency enforcement for "operations"
- no dependency between `review-creative` and "operations"

### GitHub

```text
pactwright github sync
pactwright github sync --dry-run
with:
```

- "gh" authentication preflight
- Pactwright-managed generated Actions
- required repository settings
- semantic labels
- one shared Pactwright Project when Projects are enabled
- Delivery and optional extension-contributed fields/views
- Pactwright-owned ruleset/check requirements
- least-privilege workflow permissions

Exact workflow, check, field and view definitions come from the GitHub Actions and Views specification.

### Agents and evaluation

```text
pactwright agent-pack use
with:
```

- default agent pack
- creative-capable complete pack
- `operations-analysis` in first-party complete packs
- capability mapping
- skills
- Claude Code adapter
- `pactwright eval`
- core and extension evaluation fixtures
- baseline comparison
- review, creative and Operations evaluation cases

Do not build yet:

- extension marketplace or central registry
- arbitrary remote extension sources
- agent-pack composition
- hosted evaluation
- automatic prompt optimisation/promotion
- remote GitHub Project template dependency
- organisation-wide cross-repository Project provisioning
- centralised operational telemetry infrastructure

---

## 19. Definition of Done

Distribution is working when:

- Pactwright installs as one Node development dependency
- Project Intelligence installs through `pactwright extension add project-intelligence`
- Graph Review & Creative Delivery installs through `pactwright extension add review-creative`
- Operations installs through `pactwright extension add operations`
- installing `review-creative` resolves and locks its Project Intelligence dependency
- installing "operations" resolves and locks its Project Intelligence dependency
- Review & Creative and Operations remain independent sibling extensions
- enabled extension dependencies cannot be removed underneath dependants
- runtime, extension and agent-pack versions are independently locked
- extension installation validates the complete required agent-capability union
- extension manifests explicitly register the graph types they own
- first-party packs can satisfy Operations without introducing another pack-composition system
- `pactwright agent-pack use` can switch to a compatible complete pack without manual generated-file edits
- `pactwright sync` deterministically renders only Pactwright-managed adapters, workflows and generated repository integration
- enabled first-party extensions generate only their owned Pactwright workflow surfaces
- Operations generates `.github/workflows/pactwright-operations.yml` only when enabled
- user-authored workflow files remain outside Pactwright ownership
- `pactwright github sync --dry-run` previews remote changes
- `pactwright github sync` converges Pactwright-owned remote structure and configuration
- GitHub Actions update derived operational projections without becoming a second provisioning authority
- native "gh" commands are preferred and `gh api` fills unsupported write gaps
- GitHub authentication scopes are never silently broadened
- one shared GitHub Project exposes Delivery and enabled extension views when Projects are enabled
- Project Intelligence, Review & Creative and Operations contribute to that Project rather than creating parallel Projects
- logical graph stewards and owners can resolve to GitHub reviewers without embedding GitHub identities into graph semantics
- Pactwright-owned rulesets can require configured checks
- workflow permissions remain least-privilege
- operational credentials remain outside canonical generated state
- removing/disabling Review & Creative leaves Delivery and Project Intelligence semantics valid
- removing/disabling Operations leaves Delivery and Project Intelligence semantics valid
- removing/disabling Project Intelligence is blocked while Review & Creative or Operations still depends on it
- runtime, extensions and agent packs upgrade independently
- software and creative delivery can use different complete agent packs without changing core Delivery semantics
- Operations analysis can evolve without changing Operations Graph semantics
- AI behaviour is benchmarked against core and extension suites
- normal setup requires no manual copying of Pactwright files or hand-building GitHub views

---

## 20. Governing Boundary

For runtime changes ask:

> Does this change deterministic Pactwright mechanics or stable Project Graph semantics?

For extension changes ask:

> Does this change specialised graph semantics owned by that extension?

For agent changes ask:

> Can this be solved by improving prompts, skills, generation guidance or agent composition instead?

For Operations agent changes ask:

> Is this an improvement to how production evidence is analysed rather than a change to what Deployment or Observation means?

For GitHub distribution changes ask:

> Is this local generated integration, remote GitHub structure/configuration, or runtime projection data?

For exact GitHub behaviour ask:

> Does this belong in the GitHub Actions and Views specification instead?

Keep those responsibilities separate.

---

---

Pactwright — Distribution, Agents and Evaluation v5
