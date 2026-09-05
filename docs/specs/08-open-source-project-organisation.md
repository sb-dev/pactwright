# Pactwright Open-Source Project Organisation

## 1. Purpose

Pactwright should be organised as one coherent open-source product with several publishing and learning surfaces.

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

These surfaces should reuse canonical repository content rather than evolve into independent knowledge bases.

The user journey is:

```text
Discover
→ Understand
→ Try
→ Learn
→ Extend
→ Contribute
```

This specification defines:

* monorepo organisation;
* package boundaries;
* documentation structure;
* public product surfaces;
* examples and case studies;
* Academy organisation;
* ecosystem discovery;
* content ownership and reuse;
* contribution structure;
* Pactwright dogfooding.

---

## 2. Product Identity

Public material should consistently describe Pactwright around its core purpose:

> Pactwright turns intent into explicit, authorised Contracts and governs their fulfilment by humans and AI agents.

The canonical lifecycle is:

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

Optional Extensions continue the system where needed:

```text
Project Intelligence
→ durable project knowledge

Graph Review
→ specialist Project Graph analysis

Assets / Publication
→ approved durable outputs

Operations
→ real-world outcomes
```

Public material must not revert to older software-only or creative-delivery-specific models.

---

# 3. Project Surfaces

| Surface      | Purpose                                                           |
| ------------ | ----------------------------------------------------------------- |
| README       | Understand Pactwright and achieve first success                   |
| Docs         | Product concepts, guides and reference                            |
| Academy      | Learn Pactwright methodology and judgement                        |
| Examples     | Execute realistic Pactwright workflows                            |
| Case Studies | Show complete real-world journeys                                 |
| Blog         | Publish current thinking and project developments                 |
| Ecosystem    | Discover Agent Packs, Extensions and compatible Production Skills |
| Website      | Main public product and discovery surface                         |

Each information type should have one canonical home.

---

# 4. Target Monorepo

Pactwright should evolve into a pnpm + Turborepo monorepo.

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
│       ├── src/
│       └── content/
│           ├── blog/
│           └── case-studies/
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
│   └── end-to-end/
│
├── registry/
│   ├── agent-packs/
│   ├── extensions/
│   └── production-skills/
│
├── tooling/
│   ├── eslint/
│   ├── typescript/
│   └── test/
│
├── .pactwright/
│   ├── config.yml
│   ├── lifecycle.yml
│   └── lock.yml
│
└── .github/
    └── ...
```

Exact directory names may evolve.

The ownership boundaries should not.

---

# 5. Turborepo Boundary

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

Turborepo determines build dependencies.

Pactwright governs project meaning and Delivery.

---

# 6. Core Runtime Package

```text
packages/pactwright/
```

contains the Pactwright runtime and CLI.

It owns implementation of:

* Delivery Graph;
* Contract lifecycle;
* lifecycle shapes;
* graph validation;
* configuration;
* locking;
* Extension loading;
* Agent Pack loading;
* Production Skills integration resolution;
* adapters;
* synchronisation;
* common evaluation infrastructure.

The runtime must remain independent of any particular production domain.

---

# 7. Standard Agent Pack

```text
packages/standard/
```

contains the default Pactwright Agent Pack.

Conceptually:

```text
packages/standard/
├── agents/
├── skills/
├── evals/
├── pack.yml
└── package.json
```

It remains separate from the core runtime because:

```text
Pactwright Core
→ defines responsibilities

Standard Agent Pack
→ implements those responsibilities with AI
```

Alternative Agent Packs may exist without changing core Pactwright.

---

# 8. First-Party Extensions

First-party Pactwright Extensions should be independently packaged:

```text
packages/
├── project-intelligence/
├── graph-review/
├── assets-publication/
└── operations/
```

Each package owns only its canonical semantic boundary.

There should be no replacement `review-creative` package.

The redesigned split is:

```text
Graph Review
→ specialist analysis

Assets / Publication
→ approved outputs

normal Delivery + Production Skills
→ creative or other production
```

Extensions should be independently testable and versionable while using common Pactwright runtime contracts.

---

# 9. Production Skills Stay External

Production Skills families should normally remain independent repositories.

Examples:

```text
software-engineering-skills
ui-ux-design-skills
deep-research-skills
video-game-development-skills
video-production-skills
music-production-skills
narrative-production-skills
```

They are not moved into `packages/`.

Their relationship is:

```text
Pactwright Agent Pack
→ optional Production Skills integration
→ external Production Skills repository
```

This preserves independent usage:

```text
without Pactwright
→ Production Skills work normally

with Pactwright
→ Agent Pack consumes integrations/pactwright.yml
```

---

# 10. Ecosystem Categories

Pactwright should expose three clearly different ecosystem categories.

## Agent Packs

```text
Agent Pack
→ defines how AI performs Pactwright responsibilities
```

## Pactwright Extensions

```text
Extension
→ adds optional Pactwright semantics
```

## Compatible Production Skills

```text
Production Skills
→ provide specialised production expertise
```

These replace the older catalogue model that treated:

```text
agents
reviewers
evaluators
skills
commands
workflows
templates
```

as peer-level Pactwright extension categories.

Those concepts now belong inside their owning architectural layer.

---

# 11. Registry

The repository should initially provide a lightweight registry, not a marketplace.

```text
registry/
├── agent-packs/
├── extensions/
└── production-skills/
```

Registry entries are discovery metadata.

They do not become another runtime plugin system.

Useful metadata includes:

```text
name
description
author
version
repository
Pactwright compatibility
category
installation
documentation
```

For Production Skills, registry metadata may also indicate the availability of:

```text
integrations/pactwright.yml
```

Third-party components remain in their own repositories.

---

# 12. Canonical Specifications

The authoritative system definition lives in:

```text
docs/specs/
├── README.md
├── 01-pactwright-core-system-and-lifecycle.md
├── 02-distribution-agent-packs-extensions-and-evaluation.md
├── 03-project-intelligence.md
├── 04-graph-review.md
├── 05-assets-and-publication.md
├── 06-operations.md
├── 07-github-integration.md
└── 08-open-source-project-organisation.md
```

`docs/specs/README.md` should provide:

* system overview;
* specification index;
* ownership map;
* dependency map;
* document authority rules.

Do not create another independent System Architecture specification merely to summarise these files.

---

# 13. Document Authority

Documentation layers have distinct authority.

```text
docs/specs/
→ canonical system semantics

source + schemas + configuration
→ implementation

docs/checkpoints/
→ implementation progression

docs/research-logs/
→ design exploration and rationale

docs/concepts + guides + reference
→ user-facing product documentation

academy/
→ methodology and learning

examples/
→ executable demonstrations
```

If implementation temporarily differs from a canonical specification, that may indicate unfinished implementation rather than a reason to rewrite the specification to match current code.

Checkpoints describe how the implementation reaches the canonical target.

---

# 14. Documentation

Documentation should be product-centred.

Suggested structure:

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

## Concepts

Explain stable Pactwright ideas:

```text
Contracts
Delivery Graph
Lifecycle Shapes
Agent Packs
Production Skills integration
Project Intelligence
Graph Review
Assets / Publication
Operations
```

## Guides

Task-oriented workflows:

```text
Start a project
Add Pactwright to an existing repository
Configure lifecycle policy
Configure an Agent Pack
Integrate Production Skills
Enable an Extension
Configure GitHub
```

## Reference

Precise behaviour:

```text
CLI
configuration
schemas
manifests
Extension contracts
Agent Pack contracts
integration manifests
```

## Architecture

Explain how the canonical components interact without redefining their semantics.

---

# 15. Website

The website is the primary public product surface.

It should answer:

> Why should I use Pactwright?

while the README primarily answers:

> What is Pactwright and how do I start?

Suggested navigation:

```text
Product
Docs
Academy
Examples
Ecosystem
Case Studies
Blog
GitHub
```

The website should render or reuse repository-owned Markdown and metadata wherever practical.

It must not become a separate product-knowledge database.

---

# 16. Homepage

The homepage should demonstrate Pactwright before explaining every subsystem.

A compact progression is:

```text
Hero
↓
Problem
↓
Contract-driven model
↓
Lifecycle
↓
Example
↓
Capabilities
↓
Production Skills integration
↓
Extensions
↓
Case study
↓
Open-source CTA
```

The core message should remain centred on:

```text
Intent
→ Contract
→ governed Delivery
→ verified Evidence
```

rather than generic agent orchestration.

---

# 17. README

The README journey is:

```text
Understand
→ Believe
→ Try
→ Succeed
→ Explore
```

It should contain:

* concise product definition;
* core Contract lifecycle;
* why Pactwright exists;
* one concrete example;
* Quick Start;
* brief capability overview;
* links to Examples;
* links to Docs and Academy;
* ecosystem overview;
* contribution routes.

It must not become the complete documentation.

The first useful result should appear early.

---

# 18. Progressive Disclosure

Users should encounter complexity gradually:

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

Do not introduce:

```text
Project Intelligence internals
Extension manifests
Production Skills integration details
Graph revision mechanics
```

before users understand Pactwright's basic Contract lifecycle.

---

# 19. Academy

The Academy teaches methodology and judgement rather than acting as another command reference.

Suggested organisation:

```text
academy/
├── foundations/
├── workflows/
├── advanced/
└── projects/
```

## Foundations

Teach:

* Contract-driven delivery;
* human and agent responsibilities;
* evidence;
* Project Graph thinking;
* cheap-to-expensive production.

## Workflows

Teach complete Pactwright use:

* Contract crafting;
* Delivery;
* Review;
* Project Intelligence;
* Graph Review;
* Operations feedback.

## Advanced

Teach:

* Agent Pack design;
* Production Skills integration;
* Extension development;
* evaluation;
* lifecycle-shape design;
* complex project composition.

## Projects

Provide realistic end-to-end exercises.

The Academy should remain useful even when CLI details change.

---

# 20. Examples

Examples are first-class executable assets.

Avoid limiting examples to toy demonstrations.

Suggested examples include:

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

Each example should demonstrate a complete coherent concern.

A multi-production example could use:

```text
children's television
→ Narrative + Music + Video Production Skills
```

to demonstrate Production Skills composition without adding domain-specific Pactwright lifecycle stages.

---

# 21. Examples as Validation

A good example serves several purposes:

```text
Example
├── executable workflow
├── integration test
├── README walkthrough
├── Docs guide
├── Academy exercise
├── website demonstration
└── possible case study
```

Examples should run in CI where practical.

They should therefore detect architecture drift rather than becoming stale documentation.

---

# 22. Case Studies

Case studies show complete journeys and real outcomes.

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

Case studies differ from Examples:

```text
Example
→ reusable executable workflow

Case Study
→ evidence-backed account of actual use and outcome
```

---

# 23. Pactwright Building Pactwright

The Pactwright repository should progressively become a valid Pactwright project.

Pactwright should govern its own:

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

This provides both:

* continuous real-world system validation;
* a flagship case study.

Dogfooding must use the same public mechanisms expected of other Pactwright projects wherever practical.

---

# 24. Graph-Driven Publishing

Public product work should use Pactwright itself.

The generic flow is:

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

A documentation update may end at Evidence.

A public video or article may continue:

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

Creative work uses normal Delivery plus relevant Production Skills.

---

# 25. Content Readiness

Public content should not invent missing project truth.

Claims about Pactwright should be grounded in:

```text
canonical specifications
current implementation
accepted Project Intelligence
verified examples
real case-study evidence
```

Where Project Intelligence is enabled, project-specific public guidance should use relevant accepted Knowledge.

Missing knowledge should be researched or decided before public material depends on it.

Production Skills may perform that research or production work.

Project Intelligence governs what Pactwright subsequently accepts as project knowledge.

---

# 26. Content Ownership

Each content type should have one canonical owner.

| Information                           | Canonical home   |
| ------------------------------------- | ---------------- |
| Product identity                      | README / website |
| Installation                          | Docs             |
| Product concepts                      | Docs             |
| CLI and configuration                 | Reference        |
| System semantics                      | Canonical specs  |
| Design rationale                      | Research logs    |
| Implementation progression            | Checkpoints      |
| Methodology                           | Academy          |
| Executable workflows                  | Examples         |
| Real-world evidence                   | Case Studies     |
| Current thinking                      | Blog             |
| Agent Pack metadata                   | Registry         |
| Pactwright Extension metadata         | Registry         |
| Compatible Production Skills metadata | Registry         |

A blog post or tutorial may explain product behaviour.

It must not define product behaviour.

---

# 27. Content Reuse

Prefer one reusable source over independent copies.

```text
Canonical specification
├── architecture documentation
└── reference documentation
```

```text
Executable example
├── README excerpt
├── Docs walkthrough
├── Academy exercise
├── website demo
└── case-study foundation
```

```text
Registry metadata
├── website catalogue
├── CLI discovery
└── documentation
```

The website should primarily be a presentation layer over repository-owned content.

---

# 28. Blog

The blog should cover three broad streams.

## Pactwright

```text
releases
architecture
design decisions
new capabilities
ecosystem development
case-study updates
```

## AI Delivery

```text
coding agents
Agent Skills
specification-driven development
evaluation
context engineering
graph engineering
AI review
production workflows
```

## Practice

```text
Contract design
project knowledge
Production Skills composition
review methodology
operational feedback
agent evaluation
```

Blog content may explore future ideas.

Exploration does not become Pactwright semantics until incorporated into the appropriate canonical specification.

---

# 29. Contribution Model

Contribution routes should be explicit:

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

`CONTRIBUTING.md` should explain:

* repository structure;
* package ownership;
* test expectations;
* specification authority;
* when a canonical spec change is required;
* how examples and docs stay aligned;
* contribution review process.

Third-party Production Skills and Agent Packs need not be moved into the Pactwright repository to participate in the ecosystem.

---

# 30. Public Product Progression

Public surfaces should grow with usable capabilities.

Examples:

| Capability                    | Public material              |
| ----------------------------- | ---------------------------- |
| Core Delivery                 | Quick Start + core example   |
| Lifecycle shapes              | lifecycle concept/guide      |
| Project Intelligence          | concept + onboarding example |
| Graph Review                  | review guide + example       |
| Assets / Publication          | approved-output example      |
| Operations                    | feedback-loop example        |
| Production Skills integration | multi-domain example         |
| Full system                   | end-to-end case study        |

Do not update every surface for every implementation change.

Update the smallest set needed to make a capability:

```text
discoverable
understandable
usable
```

---

# 31. Release Surface

A Pactwright release may include independently versioned workspace packages.

The repository should make package ownership and compatibility explicit.

Conceptually:

```text
Pactwright release
├── core runtime
├── standard Agent Pack
└── compatible first-party Extensions
```

Packages need not share versions forever if independent versioning provides value.

Compatibility belongs to package and Extension contracts, not repository directory position.

---

# 32. Turborepo Tasks

The root task graph should eventually support consistent commands such as:

```text
turbo build
turbo lint
turbo typecheck
turbo test
turbo eval
```

Additional repository-wide verification may include:

```text
canonical spec validation
docs link/reference validation
example execution
registry validation
website build
Pactwright self-validation
```

Tasks should be cacheable where outputs are deterministic.

Turborepo should coordinate package work without embedding Pactwright semantic logic.

---

# 33. CI

Repository CI should validate the monorepo as one coherent product.

A normal change may run affected:

```text
build
lint
typecheck
unit tests
integration tests
Pactwright evals
example validation
docs validation
website build
```

Changes affecting canonical semantics should additionally validate relevant Pactwright specifications and dogfooded Project Graph state.

CI mechanics belong to GitHub Integration and repository tooling.

This specification defines only the repository-wide quality expectation.

---

# 34. Markdown First

Where practical, public product knowledge should remain Markdown-first.

This applies especially to:

```text
Docs
Academy
Examples
Case Studies
Blog
registry metadata
canonical specs
```

The website may enhance presentation.

It should not require content authors to maintain equivalent information separately inside application code or a CMS.

---

# 35. Anti-Overengineering Constraints

Do not introduce initially:

```text
documentation SaaS platform
learning-management system
complex extension marketplace
custom package registry
Pactwright-hosted Production Skills repository
content database
CMS
separate website knowledge model
one repository per first-party package
microservice infrastructure for documentation
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

Add richer infrastructure only after actual project or community needs justify it.

---

# 36. Core Invariants

1. The repository is the canonical product source.
2. Public surfaces reuse repository-owned knowledge wherever practical.
3. Canonical system semantics live in `docs/specs/`.
4. Research logs preserve exploration rather than becoming current authority.
5. Checkpoints describe implementation progression rather than system semantics.
6. Documentation explains Pactwright; Academy teaches methodology.
7. Examples are executable validation assets, not decorative tutorials.
8. Case studies demonstrate actual complete journeys.
9. The ecosystem distinguishes Agent Packs, Pactwright Extensions and compatible Production Skills.
10. Production Skills remain independently maintained where appropriate.
11. First-party Pactwright Extensions have independent package boundaries.
12. The standard Agent Pack remains separate from the core runtime.
13. Turborepo coordinates the build graph but does not replace the Pactwright Project Graph.
14. Website content must not become an independent source of product truth.
15. Public work should progressively dogfood Pactwright.
16. New infrastructure should be justified by real content, scale or community requirements.

---

# 37. Current Implementation Baseline

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
→ Pactwright runtime, Agent Pack and first-party Extensions

docs/
→ canonical and user-facing product knowledge

examples/
academy/
registry/
→ public ecosystem and learning assets
```

The migration should preserve working `0.0.1` behaviour while moving responsibilities into their canonical package boundaries.

The Turborepo structure is therefore an evolution of the existing workspace, not a rewrite of Pactwright's product architecture.

---

# 38. Relationship to Other Canonical Specifications

```text
01 Core System and Lifecycle
→ defines Pactwright's core product semantics

02 Distribution, Agent Packs, Extensions and Evaluation
→ defines component packaging and integration contracts

03 Project Intelligence
→ defines durable project knowledge

04 Graph Review
→ defines specialist analysis

05 Assets and Publication
→ defines durable approved outputs

06 Operations
→ defines real-world feedback

07 GitHub Integration
→ defines GitHub automation and projection

08 Open-Source Project Organisation
→ defines how all of these become one coherent repository and public product
```

---

# 39. Governing Rule

> **Pactwright is one open-source product whose repository is the source of truth for implementation, specifications, documentation, examples, education and ecosystem metadata. Turborepo organises the buildable product, canonical specifications define system semantics, public surfaces progressively disclose and reuse that knowledge, and Pactwright should increasingly govern its own development and publication as a demonstration of the system it provides.**

---

**Pactwright Open-Source Project Organisation v1**
