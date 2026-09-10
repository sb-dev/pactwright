# Pactwright Open-Source Project Organisation

## 1. Purpose

Pactwright is one coherent open-source product with several publishing, learning and contribution surfaces.

The repository remains the source of truth.

```text
Repository
    ↓
README
Docs
Academy
Examples
Website
Case Studies
Blog
Ecosystem catalogue
```

These surfaces reuse repository-owned knowledge rather than evolving into independent knowledge bases.

The public journey is:

```text
Discover
→ Understand
→ Try
→ Learn
→ Extend
→ Contribute
```

This specification owns:

- monorepo organisation;
- package boundaries;
- documentation structure;
- public product surfaces;
- examples and case studies;
- Academy organisation;
- ecosystem discovery;
- content ownership and reuse;
- contribution structure;
- Pactwright dogfooding;
- public-content readiness;
- public-product progression.

---

## 2. Product Identity

Public material should describe Pactwright around its core purpose:

> Pactwright turns intent into explicit, authorised Contracts and governs their fulfilment by humans and AI agents.

The canonical Delivery model is:

```text
Intent
→ Contract alternatives
→ Decision
→ Contract
→ Brief
→ Delivery
→ Review
→ Evidence
```

Optional Extensions add:

```text
Project Intelligence
→ durable project knowledge

Graph Review
→ specialist Project Graph analysis

Assets / Publication
→ approved durable outputs and release records

Operations
→ real-world outcomes
```

Public material must not revert to older software-only or Creative Delivery-specific models.

Creative, software, research, design and other specialised production use normal Delivery plus the relevant Production Skills.

---

# 3. Public Surfaces

Each public surface has one primary responsibility:

```text
README
→ understand Pactwright and achieve first success

Docs
→ product concepts, guides and reference

Academy
→ methodology, judgement and proficiency

Examples
→ executable realistic workflows

Case Studies
→ evidence-backed real journeys and outcomes

Blog
→ current thinking and project developments

Ecosystem
→ Agent Packs, Extensions and compatible Production Skills

Website
→ primary public discovery and product surface
```

One information type should not have several independently maintained sources of truth.

---

# 4. Target Monorepo

Pactwright should evolve as a pnpm + Turborepo monorepo.

```text
pactwright/
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── CHANGELOG.md
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.json
│
├── apps/
│   └── website/
│       └── ...
│
├── packages/
│   ├── pactwright/
│   ├── standard/
│   ├── project-intelligence/
│   ├── graph-review/
│   ├── assets-publication/
│   └── operations/
│
├── docs/
│   ├── specs/
│   ├── concepts/
│   ├── guides/
│   ├── reference/
│   ├── architecture/
│   ├── checkpoints/
│   └── research-logs/
│
├── academy/
│   ├── foundations/
│   ├── workflows/
│   ├── advanced/
│   └── projects/
│
├── examples/
│   ├── core-delivery/
│   ├── existing-project/
│   ├── project-intelligence/
│   ├── graph-review/
│   ├── assets-publication/
│   ├── operations/
│   ├── multi-production-skills/
│   └── end-to-end/
│
├── registry/
│   ├── agent-packs/
│   ├── extensions/
│   └── production-skills/
│
├── tooling/
│   └── ...
│
├── .pactwright/
│   └── ...
│
└── .github/
    └── ...
```

Exact directory names may evolve. Ownership boundaries should not.

---

# 5. Build Graph vs Project Graph

Turborepo manages the repository build graph.

Pactwright manages the Project Graph.

```text
Turborepo
→ build
→ lint
→ typecheck
→ test
→ eval
→ examples
→ docs validation
→ website build
```

```text
Pactwright
→ Intent
→ Contract
→ Brief
→ Delivery
→ Review
→ Evidence
```

These graphs must not be conflated.

---

# 6. Package Boundaries

## Core runtime

```text
packages/pactwright/
```

owns the Pactwright runtime and CLI, including core Delivery semantics, graph validation, configuration, locking, Extension loading, Agent Pack loading, Production Skills integration resolution, adapters, synchronisation and common evaluation infrastructure.

It remains production-domain neutral.

## Standard Agent Pack

```text
packages/standard/
```

remains separate from the runtime:

```text
Pactwright Core
→ defines responsibilities

Standard Agent Pack
→ implements those responsibilities with AI
```

## First-party Extensions

```text
packages/project-intelligence/
packages/graph-review/
packages/assets-publication/
packages/operations/
```

are independently testable and versionable.

There is no replacement `review-creative` package.

```text
Graph Review
→ specialist analysis

Assets / Publication
→ approved durable outputs

normal Delivery + Production Skills
→ specialised production
```

---

# 7. Production Skills Stay External

Production Skills families normally remain independent repositories.

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

Their relationship is:

```text
Pactwright
→ Agent Pack
→ compatible Production Skills
```

Production Skills remain independently usable without Pactwright.

Pactwright integration is supplied through their integration manifest where supported.

---

# 8. Ecosystem Categories and Registry

Pactwright exposes three distinct ecosystem categories:

```text
Agent Pack
→ how AI performs Pactwright responsibilities

Pactwright Extension
→ optional Pactwright semantics

Production Skills
→ specialised reusable production expertise
```

The repository initially provides a lightweight registry, not a marketplace:

```text
registry/
├── agent-packs/
├── extensions/
└── production-skills/
```

Registry entries are discovery metadata, not another runtime plugin system.

Useful metadata includes name, description, author, version, repository, Pactwright compatibility, category, installation and documentation.

---

# 9. Canonical Specifications and Document Authority

Canonical system semantics live in:

```text
docs/specs/
├── 01-pactwright-core-system-and-lifecycle.md
├── 02-distribution-agent-packs-extensions-and-evaluation.md
├── 03-project-intelligence.md
├── 04-graph-review.md
├── 05-assets-and-publication.md
├── 06-operations.md
├── 07-github-integration.md
└── 08-open-source-project-organisation.md
```

Authority is:

```text
docs/specs/
→ canonical system semantics

source + schemas + configuration
→ implementation

docs/checkpoints/
→ implementation progression

docs/research-logs/
→ exploration and rationale

docs/concepts + guides + reference
→ user-facing product documentation

academy/
→ methodology and learning

examples/
→ executable demonstrations
```

Implementation lag does not automatically change canonical semantics. Checkpoints describe how implementation reaches the canonical target.

---

# 10. Documentation

Documentation remains product-centred.

```text
docs/
├── concepts/
├── guides/
├── reference/
├── architecture/
├── specs/
├── checkpoints/
└── research-logs/
```

Concepts explain stable Pactwright ideas.

Guides explain task-oriented workflows.

Reference defines exact CLI, configuration, schemas, manifests and contracts.

Architecture explains component interaction without redefining canonical semantics.

---

# 11. Website and README

The website answers:

> Why should I use Pactwright?

The README answers:

> What is Pactwright and how do I start?

The website should render or reuse repository-owned Markdown and metadata wherever practical.

The README journey is:

```text
Understand
→ Believe
→ Try
→ Succeed
→ Explore
```

It should include a concise product definition, Contract-driven model, one concrete example, Quick Start, compact capability overview, Examples, Docs/Academy links, ecosystem overview and contribution routes.

Neither surface should become a second documentation system.

---

# 12. Progressive Disclosure

Users encounter complexity gradually:

```text
Homepage / README
→ Quick Start
→ Examples
→ Guides
→ Concepts
→ Academy
→ Reference
→ Canonical Specs
```

Project Intelligence internals, Extension manifests, Production Skills integration details and Project Graph revision mechanics should not be prerequisites for understanding the basic Contract lifecycle.

---

# 13. Academy

The Academy teaches methodology and judgement rather than mirroring the CLI.

```text
academy/
├── foundations/
├── workflows/
├── advanced/
└── projects/
```

Foundations cover Contract-driven Delivery, human/agent responsibilities, evidence, Project Graph thinking and cheap-to-expensive production.

Workflows cover Contract crafting, Delivery, Review, Project Intelligence, Graph Review and Operations feedback.

Advanced material covers Agent Pack design, Production Skills integration, Extension development, evaluation, lifecycle design and complex composition.

Projects provide realistic end-to-end exercises.

Academy lessons should remain useful as CLI details evolve.

---

# 14. Examples as Executable Validation

Examples are first-class executable assets, not decorative tutorials.

```text
examples/
├── core-delivery/
├── existing-project/
├── project-intelligence/
├── graph-review/
├── assets-publication/
├── operations/
├── multi-production-skills/
└── end-to-end/
```

One example may support:

```text
integration test
README walkthrough
Docs guide
Academy exercise
website demonstration
case-study foundation
```

Examples should run in CI where practical and detect architecture drift.

A multi-production example may use Narrative + Music + Video Production Skills without adding domain-specific Pactwright lifecycle stages.

---

# 15. Case Studies

Case studies are evidence-backed accounts of actual use and outcomes.

Useful cases include:

```text
Adding Pactwright to an existing project

Software product Delivery
→ Software Engineering + UI/UX + Deep Research

Children's television production
→ Narrative + Music + Video

Production incident
→ Operations → Project Intelligence → corrective Delivery

Pactwright Building Pactwright
→ complete dogfooding journey
```

An Example is reusable executable workflow material.

A Case Study demonstrates what actually happened.

---

# 16. Pactwright Building Pactwright

The Pactwright repository should progressively become a valid Pactwright project and use Pactwright to govern its own:

```text
specifications
runtime
Agent Pack
Extensions
documentation
examples
Academy
website
releases
Graph Reviews
Assets / Publications
Operations feedback
```

This provides continuous real-world validation and a flagship case study.

Dogfooding must use the same public mechanisms expected of other Pactwright projects wherever practical.

**Do not manually create or revise project material outside Pactwright when the current Pactwright system can represent that work.**

For dogfooded work, the Project Graph retains the available canonical lineage:

```text
Intent
+ applicable grounding
+ governing Contract / Brief lineage
+ Delivery Evidence
+ Asset where the output becomes an approved durable artefact
+ Publication where it is released
```

This is a provenance requirement, not a requirement that every repository change become an Asset or Publication.

The exact acceptance test for deciding when the current implementation is capable enough to represent a class of work remains unresolved. That threshold must not be used as an indefinite excuse to bypass dogfooding once the relevant public mechanism works.

---

# 17. Graph-Driven Publishing

Public product work uses Pactwright itself.

```text
project knowledge
→ Intent
→ Contract
→ Brief
→ Delivery
→ Review
→ Evidence
→ Asset / Publication where applicable
→ Operations feedback where applicable
→ Project Intelligence
→ future Intent
```

Reference documentation or an internal repository update may end at Evidence.

A public article, video, diagram or other durable approved output may continue:

```text
Evidence
→ Asset
→ Publication
```

A measurable public surface may continue:

```text
Publication
→ Observation
→ Project Intelligence
```

There is no separate Creative Delivery lifecycle.

Public narrative, visual, educational and marketing work uses normal Delivery plus the relevant Production Skills.

---

# 18. Public Content Readiness

Public content must not compensate for missing project knowledge.

## Before Project Intelligence

Before Project Intelligence is enabled, public work still requires explicit authority. For the specific work being delivered:

```text
Intent
→ authorised Decision
→ selected Contract
→ Brief
→ Delivery
```

The authorised Decision and selected Contract are the bootstrap authority for identity, positioning, product claims or other strategic choices required by that work. They are not a substitute for a long-term project knowledge store.

A model must not invent identity or positioning assumptions merely because Project Intelligence does not yet exist.

Verified project evidence and existing authorised repository material may inform Contract crafting, but strategic choices still require explicit Decision authority.

## With Project Intelligence

Once Project Intelligence is available for the relevant project state, public/outbound work must satisfy the applicable readiness gate before approval.

The required domain matrix is:

```text
identity
→ Covered for all public/outbound work whose identity, voice or values matter

content
→ Covered for editorial, educational or marketing work

product
→ Covered when making capability, value, behaviour or limitation claims about Pactwright

go-to-market
→ Covered for acquisition, positioning, CTA or campaign work

delivery/ux
→ Covered when describing or generating user-facing workflow or UX material

delivery/eng
→ Covered for technical implementation claims

other applicable subject domain
→ Covered when factual claims depend on it
```

`Covered` is owned by Project Intelligence Spec 03. This specification does not create a competing coverage state definition.

For public-content readiness, the specific current claims and constraints relied on by the work must also be represented by accepted, in-horizon Knowledge with traceable Sources.

Coverage means the required current project truth is sufficiently represented for the intended surface. It does not mean the domain is exhaustively complete.

---

# 19. Project Intelligence Bootstrap and Missing Coverage

When Project Intelligence first becomes available, authorised bootstrap material that should become durable project knowledge enters the normal governance path:

```text
existing authorised Decision / Contract / verified material
↓
Project Intelligence Source
↓
triage
↓
reviewed promotion where required
↓
accepted Knowledge
```

For identity/positioning, this means the pre-PI Decision and Contract remain historical Delivery authority while Project Intelligence becomes the durable current knowledge owner after accepted promotion.

There is no silent conversion from Contract text to Knowledge. Normal Source provenance, triage and approval apply.

If required public-content coverage is later missing:

```text
pactwright intelligence onboard
↓
identify missing Source material or strategic decisions
↓
normal Delivery / research obtains or creates the required material
↓
pactwright intelligence ingest ...
↓
triage / reviewed promotion
↓
required Knowledge becomes accepted and coverage becomes sufficient
↓
public Delivery may proceed
```

Missing truth must be researched, observed or decided before public work depends on it.

Production Skills may perform specialised research or production work, but Project Intelligence governs what becomes durable project knowledge.

Strategic identity or positioning choices are **Decisions**. A generation model must not silently invent them as if they were established project truth.

---

# 20. Grounding and Re-grounding

Before Project Intelligence exists, public Delivery is grounded through its authorised Decision, Contract, Brief and verified project evidence as applicable.

After Project Intelligence is enabled and relevant bootstrap knowledge has been accepted, later grounded public work uses accepted Project Intelligence Knowledge under the readiness rules in this specification.

Public Delivery must retain the accepted Knowledge actually relied on where Project Intelligence grounding is applicable.

If relied-on Knowledge becomes:

```text
challenged
superseded
retracted
```

before approval, the work must be re-grounded and re-evaluated before it can become an approved Asset or Publication.

An existing approved Asset or historical Publication is not silently rewritten when later Knowledge changes. Any correction follows normal Project Intelligence propagation and Delivery governance.

---

# 21. Content Ownership and Reuse

Canonical ownership should remain clear:

```text
System semantics
→ Canonical Specs

Implementation behaviour
→ source + schemas + configuration

Design rationale
→ Research Logs

Implementation progression
→ Checkpoints

Product concepts / guides / CLI reference
→ Docs

Methodology
→ Academy

Executable workflows
→ Examples

Observed real-world outcomes
→ Case Studies

Current exploratory thinking
→ Blog

Ecosystem metadata
→ Registry
```

Before Project Intelligence exists, authorised Delivery Decisions and Contracts provide bounded bootstrap authority for the public work they govern. Once Project Intelligence is enabled, accepted Knowledge becomes the durable project-specific grounding source for later public work.

README and website remain presentation surfaces, not independent authority.

Prefer reusable sources:

```text
Canonical spec
→ architecture/reference explanations

Executable example
→ README + Docs + Academy + website + case study

Registry metadata
→ website catalogue + CLI discovery + docs
```

---

# 22. Blog

The blog may cover:

```text
Pactwright
→ releases, architecture, design choices, capabilities, ecosystem, case-study updates

AI Delivery
→ agents, skills, specification-driven development, evaluation, context, graphs, review, production workflows

Practice
→ Contract design, project knowledge, Production Skills composition, review, operations, evaluation
```

Blog exploration does not become Pactwright semantics until accepted into the appropriate canonical specification.

---

# 23. Contribution Model

Contribution routes include:

```text
runtime contribution
Extension contribution
Agent Pack contribution
documentation contribution
example contribution
Academy contribution
Production Skills integration
ecosystem registry entry
```

`CONTRIBUTING.md` should explain repository structure, package ownership, test expectations, specification authority, when canonical spec changes are required, how examples/docs stay aligned and contribution review.

Third-party Agent Packs and Production Skills need not move into this repository to participate.

---

# 24. Public Product Progression

Public surfaces advance alongside usable Pactwright capabilities.

This is a progression target, not a requirement to update every surface after every checkpoint.

## Core Delivery

Advance:

```text
README Quick Start
Getting Started docs
first Delivery example
```

Before Project Intelligence exists, the bootstrap-authority rules in sections 18–20 apply to public material created at this milestone.

## Remote Delivery

Advance:

```text
deployable website
GitHub setup guide
remote Delivery example
```

The original progression requires this milestone, but the exact canonical acceptance criterion for "Remote Delivery" remains unresolved. GitHub Integration is the obvious supporting surface, but this specification does not redefine its semantics.

## Project Intelligence

Advance:

```text
Project Intelligence concepts and onboarding docs
Project Intelligence example
Academy Project Understanding lesson
identity/content knowledge foundation for public work
promotion of applicable authorised bootstrap material into accepted Knowledge
```

## Graph Review

Advance:

```text
Graph Review docs
Graph Review example
Academy review lesson
review of the existing public Pactwright corpus
```

The corpus review uses Graph Review Findings and normal Project Intelligence governance.

## Production Skills + Assets / Publication

This replaces the old Creative Delivery milestone without introducing another lifecycle.

Advance:

```text
normal Delivery + Production Skills public-production example/guide
relevant Academy production lesson
README / website capability update
first grounded approved public Asset
first Publication where applicable
```

## Operations

Advance:

```text
Operations docs
production-feedback example
Academy production-learning lesson
website capability update
```

## Publication Feedback

Advance:

```text
Publication-feedback guide
real Operations evidence from a selected Publication
Project Intelligence interpretation
one evidence-driven revision of an existing Pactwright Publication
```

The revision follows normal Intent → Contract → Delivery → Review → Evidence → Asset/Publication governance.

## Full Operating Surface

Advance:

```text
end-to-end operating guide
end-to-end example
advanced Academy workflow
ecosystem / Extension catalogue
complete README capability map
```

## Hardened Loop

Advance:

```text
public-surface audit
Pactwright-Building-Pactwright case study
contribution material
release / launch content
```

At every milestone, update the **smallest set of surfaces** needed to make the newly delivered capability:

```text
discoverable
understandable
usable
```

---

# 25. Release Surface

A repository release may contain independently versioned workspace packages.

```text
Pactwright release
├── core runtime
├── standard Agent Pack
└── compatible first-party Extensions
```

Compatibility belongs to package and Extension contracts, not repository directory position.

---

# 26. Repository Task Graph and CI

Turborepo should coordinate consistent repository tasks such as:

```text
turbo build
turbo lint
turbo typecheck
turbo test
turbo eval
```

Repository-wide verification may include:

```text
canonical spec validation
docs link/reference validation
example execution
registry validation
website build
Pactwright self-validation
```

CI validates the monorepo as one coherent product and runs affected build, test, eval, example, docs and website checks.

Changes affecting canonical semantics additionally validate relevant Pactwright specs and dogfooded Project Graph state.

CI mechanics remain owned by GitHub Integration and repository tooling.

---

# 27. Markdown First

Where practical, public product knowledge remains Markdown-first, especially:

```text
Docs
Academy
Examples
Case Studies
Blog
registry metadata
canonical specs
```

The website enhances presentation without requiring equivalent content to be maintained separately in application code or a CMS.

---

# 28. Core Invariants

1. The repository is the canonical product source.
2. Public surfaces reuse repository-owned knowledge wherever practical.
3. Canonical system semantics live in `docs/specs/`.
4. Research logs preserve exploration rather than current authority.
5. Checkpoints describe implementation progression rather than system semantics.
6. Documentation explains Pactwright; Academy teaches methodology.
7. Examples are executable validation assets.
8. Case studies represent actual journeys and evidence.
9. The ecosystem distinguishes Agent Packs, Pactwright Extensions and Production Skills.
10. Production Skills remain independently maintained where appropriate.
11. First-party Extensions have independent package boundaries.
12. The standard Agent Pack remains separate from the core runtime.
13. Turborepo manages the build graph, not the Pactwright Project Graph.
14. Website content is not an independent product truth store.
15. Public work progressively dogfoods Pactwright.
16. When Pactwright can represent public work, that work is not manually maintained outside Pactwright.
17. Dogfooded public work retains Intent, applicable grounding, Delivery Evidence and applicable Asset/Publication provenance.
18. Before Project Intelligence exists, strategic public choices require explicit Decision/Contract authority for the work being delivered.
19. Once Project Intelligence is available, public/outbound work satisfies the applicable Project Intelligence coverage gate before approval.
20. Applicable authorised bootstrap material is ingested and governed through normal Project Intelligence promotion rather than silently converted to Knowledge.
21. Identity and positioning choices are Decisions rather than generated assumptions.
22. Public work is re-grounded when relied-on Knowledge is challenged, superseded or retracted before approval.
23. The public-product progression includes Remote Delivery, Publication Feedback, Full Operating Surface and Hardened Loop milestones.
24. New infrastructure requires demonstrated scale, content or community need.

---

# 29. Anti-Overengineering Constraints and Open Gaps

Do not introduce initially:

```text
documentation SaaS platform
learning-management system
complex marketplace
custom package registry
Pactwright-hosted Production Skills repository
content database
CMS
separate website knowledge model
one repository per first-party package
microservice documentation infrastructure
```

Start with:

```text
pnpm
Turborepo
Markdown
GitHub
repository registries
static website rendering
```

Open gaps remain:

- the acceptance test for when a Pactwright capability is mature enough that dogfooding becomes mandatory for that class of work;
- the exact completion criterion for the Remote Delivery public milestone;
- the exact policy for selecting which Publications should enter the Publication Feedback milestone when Operations can observe many surfaces.

These gaps should be resolved from observed use rather than by adding parallel content-management or governance systems.

---

# 30. Current Implementation Baseline

Pactwright already has the beginnings of the target workspace model:

```text
root Pactwright package
+
packages/standard
+
pnpm workspace
```

The canonical target expands this into:

```text
apps/
→ public applications

packages/
→ runtime, Agent Pack and first-party Extensions

docs/
→ canonical and user-facing knowledge

examples/
academy/
registry/
→ public ecosystem and learning assets
```

The migration should preserve working behaviour while moving responsibilities into canonical package boundaries.

The repository should progressively dogfood each capability as soon as the capability can represent its own corresponding work.

Before Project Intelligence is available, bounded Decision/Contract authority governs public bootstrap work. After Project Intelligence is available, applicable bootstrap truth migrates through Source ingestion and reviewed promotion into the normal durable-knowledge model.

---

# 31. Relationship to Other Canonical Specifications

```text
01 Core System and Lifecycle
→ defines Pactwright core Delivery authority used for pre-PI bootstrap work

02 Distribution, Agent Packs, Extensions and Evaluation
→ defines package and AI composition contracts

03 Project Intelligence
→ owns coverage, durable public-product knowledge and post-bootstrap grounding

04 Graph Review
→ owns public-corpus review Findings

05 Assets and Publication
→ owns approved public Assets and Publication records

06 Operations
→ owns feedback from public production exposure

07 GitHub Integration
→ owns repository automation and projections

08 Open-Source Project Organisation
→ composes these into one repository and public product
```

---

# 32. Governing Rule

> **Pactwright is one open-source product whose repository is the source of truth. Before Project Intelligence exists, authorised Decisions and Contracts provide bounded bootstrap authority for the public work they govern; once Project Intelligence is available, applicable project truth enters its normal Source and promotion path and later public work uses accepted Knowledge. Durable public outputs become approved Assets and Publications where applicable, Operations feeds real-world evidence back through Project Intelligence, and public surfaces evolve alongside the capabilities that make them possible.**

---

**Pactwright Open-Source Project Organisation v1**