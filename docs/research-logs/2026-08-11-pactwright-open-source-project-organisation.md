# Pactwright Open-Source Project Organisation

Pactwright should be organised as one open-source product with several publishing surfaces, each serving a distinct part of the user journey.

The repository remains the source of truth. The website, documentation, Academy, examples, case studies, blog, and extension catalogue should build on that source rather than evolve into independent knowledge bases.

The overall journey is:

**Discover → Understand → Try → Learn → Extend → Contribute**

---

## 1. Project Surfaces

| Surface | Primary purpose | User question |
|---|---|---|
| README | Acquisition and first success | What is Pactwright, and can I try it? |
| Docs | Product knowledge and reference | How does Pactwright work? |
| Academy | Skill development | How do I become proficient with Pactwright? |
| Examples | Concrete reusable workflows | What does this look like in practice? |
| Case Studies | Evidence and complete journeys | How is Pactwright used on real projects? |
| Blog | Current thinking and discovery | What is happening in AI-driven delivery? |
| Extensions | Ecosystem and customisation | What can I add or reuse? |
| Website | Main public entry point | Why should I use Pactwright? |

Each surface should have a clear responsibility to minimise duplication and documentation drift.


## 1.1 Graph-Driven Publishing

The public project must evolve with the product.

Public content is not a separate marketing backlog that is completed after the software. When a capability becomes usable, Pactwright should also publish the smallest useful set of material needed for users to discover, understand, try or learn it.

The operating rule is:

```text
project knowledge
↓
Intent
↓
Delivery
↓
public artefact
↓
Publication where applicable
↓
production feedback when available
↓
Project Intelligence
↓
future corrective Intent
```

Use the strongest Pactwright capability already available:

```text
before Project Intelligence
→ normal Delivery

after Project Intelligence
→ Project Intelligence-grounded Delivery

after Graph Review
→ review relevant public work before acceptance

after Creative Delivery
→ public narrative / visual / educational creative work uses Creative Delivery

after Operations can observe Publications
→ selected real Publications feed production evidence back into Project Intelligence
```

Do not manually create or revise material outside Pactwright when the current system can represent the work. The Project Graph should retain the Intent, grounding, Delivery Evidence and, where applicable, Asset and Publication.

Reference documentation and executable examples may remain normal Delivery work. Public-facing narrative, visual, educational and marketing artefacts should use Creative Delivery once available.

## 1.2 Creative Readiness

Creative work must not compensate for missing project knowledge.

Before public creative work begins, Project Intelligence must show sufficient accepted Knowledge for the intended surface.

Minimum readiness:

| Domain | Requirement |
|---|---|
| identity | **Covered** for all public/outbound creative work |
| content | **Covered** for editorial, educational or marketing work |
| product | **Covered** when making Pactwright capability, value or limitation claims |
| go-to-market | **Covered** for acquisition, positioning, CTA or campaign work |
| delivery/ux | **Covered** when describing or generating user-facing workflow/UX material |
| delivery/eng | **Covered** for technical implementation claims |
| other subject domain | Covered when factual claims depend on it |

`Covered` means the required current claims and constraints are represented by accepted, in-horizon Knowledge with traceable Sources. It does not mean the domain must be exhaustively complete.

If required coverage is missing:

```text
intelligence onboard
↓
identify missing Source material / strategic decisions
↓
normal Delivery creates or collects that material
↓
intelligence ingest
↓
triage / reviewed promotion
↓
coverage becomes sufficient
↓
creative Delivery may start
```

Strategic identity or positioning choices are Decisions. They must not be invented silently by a generation model.

Creative Brief grounding must reference the accepted Knowledge actually used. If the required Knowledge becomes challenged, superseded or retracted before approval, the work must be re-grounded.

## 1.3 Progressive Public Product

The initial public product should grow alongside the implementation programme.

| Capability milestone | Public surfaces that should advance |
|---|---|
| Core Delivery | README Quick Start, Getting Started docs, first Delivery example |
| Remote Delivery | deployable website, GitHub setup guide, remote Delivery example |
| Project Intelligence | PI concepts/onboarding docs, PI example, Academy Project Understanding lesson, identity/content knowledge foundation |
| Graph Review | Review docs, review example, Academy review lesson, review of the existing public corpus |
| Creative Delivery | Creative Delivery docs/example/Academy lesson, README/website capability update, first grounded public Asset/Publication |
| Operations | Operations docs, production-feedback example, Academy production-learning lesson, website capability update |
| Publication feedback | Publication-feedback guide and a real evidence-driven revision of an existing Pactwright Publication |
| Full operating surface | end-to-end operating guide/example, advanced Academy workflow, extension catalogue, complete README capability map |
| Hardened loop | public-surface audit, Pactwright-building-Pactwright case study, contribution material, release/launch content |

This is a progression target, not a requirement to update every surface on every checkpoint.

The rule is to update the smallest set of surfaces necessary to make the newly delivered capability discoverable, understandable and usable.

---

## 2. Repository Structure

Start with a single monorepo.

```text
pactwright/
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── CHANGELOG.md
│
├── src/
│   └── ...
│
├── docs/
│   ├── concepts/
│   ├── guides/
│   ├── reference/
│   └── architecture/
│
├── academy/
│   ├── foundations/
│   ├── workflows/
│   ├── advanced/
│   └── projects/
│
├── examples/
│   ├── new-api-service/
│   ├── existing-project/
│   ├── production-incident/
│   └── ...
│
├── extensions/
│   ├── official/
│   └── registry/
│
├── website/
│   ├── pages/
│   ├── components/
│   └── content/
│       ├── blog/
│       └── case-studies/
│
└── .github/
    └── ...
```

The exact directory names can evolve. The important rule is that the repository remains the canonical source for product knowledge and ecosystem metadata.

The website should render or reuse repository content wherever practical rather than maintaining separate copies.

---

# 3. README.md

The README is one of Pactwright's primary acquisition surfaces.

Many users will first encounter Pactwright through GitHub, search engines, developer communities, technical articles, or links from other repositories.

Its journey should be:

**Understand → Believe → Try → Succeed → Explore**

The README should not become the complete documentation or Academy. It should teach enough to get someone to their first meaningful result and then direct them deeper into the project.

## 3.1 Hero

Start with a concise explanation of the product.

For example:

> Pactwright turns software delivery into a graph that AI agents and humans can reason about together.

Follow it immediately with a simple representation of the lifecycle:

```text
Intent
  ↓
Specification
  ↓
Plan
  ↓
Implementation
  ↓
Review
  ↓
Delivery
  ↓
Evaluation
```

The underlying graph connects decisions, requirements, implementation, delivery, evaluation, and operational feedback.

---

## 3.2 Why Pactwright Exists

Explain the problem briefly.

AI tools are increasingly capable at individual engineering tasks but often lose context across:

- requirements
- specifications
- architectural decisions
- implementation
- reviews
- CI/CD
- releases
- incidents
- operational findings
- project knowledge

Pactwright gives these activities a shared graph that can be used by both humans and agents.

---

## 3.3 Show Before Explaining

Demonstrate a concrete workflow early.

For example:

> Add Google authentication.

Show how Pactwright turns the intent into connected project information such as:

```text
Intent
  ↓
Specification
  ↓
Constraints
  ↓
Implementation tasks
  ↓
Review
  ↓
Delivery
  ↓
Evaluation
```

A reader should understand the basic product value before installing anything.

---

## 3.4 Quick Start

The Quick Start should produce the first useful result with the minimum number of steps.

It should avoid:

- exhaustive configuration
- architecture explanations
- every command option
- advanced extension concepts

Those belong in the documentation.

---

## 3.5 Core Concepts

Introduce Pactwright's major concepts briefly.

Examples include:

- Delivery Graph
- Project Intelligence Graph
- Graph Review
- Operations Graph
- Agents
- Evaluation
- Extensions
- Lifecycle automation

Each concept should contain a short explanation and link to deeper documentation.

---

## 3.6 Learn Pactwright

The README should act as the first layer of onboarding.

For example:

### 10-minute introduction

Create and inspect your first project graph.

### 30-minute workflow

Take an intent through specification, decomposition, implementation, review, and delivery.

### Academy

Learn graph-driven delivery, agent workflows, project intelligence, evaluation, and extension development.

The README therefore becomes the first Academy lesson rather than trying to contain the whole Academy.

---

## 3.7 Examples

Real examples should be visible directly from the README.

Examples might include:

- creating a new service
- adding a feature to an existing system
- upgrading a dependency
- handling a production incident
- performing an architecture migration
- creating a custom reviewer
- building a creative delivery workflow

---

## 3.8 Extensions

Introduce the extension model briefly.

Explain that Pactwright can be extended with additional:

- agents
- reviewers
- evaluators
- workflows
- integrations
- skills
- commands
- templates
- graph extensions

Then link to the extension catalogue.

---

## 3.9 Community

The README should end with clear routes into:

- contributing
- issues
- discussions
- extension development
- documentation
- Academy
- website

---

# 4. Website

The website should be broader and more visual than the README.

The README primarily answers:

> How can I understand and start using Pactwright?

The website primarily answers:

> Why should I care about Pactwright?

A simple top-level navigation could be:

```text
Product
Docs
Academy
Extensions
Case Studies
Blog
GitHub
```

The homepage can initially serve as the main Product page.

---

# 5. Homepage

The homepage should work primarily as a selling document.

A useful structure is:

```text
Hero
↓
The problem with AI-driven delivery
↓
How Pactwright works
↓
Delivery Graph visualisation
↓
Example workflow
↓
Core capabilities
↓
Agents and automation
↓
Extensions
↓
Case study
↓
Academy
↓
Open-source call to action
```

It should communicate the system visually and demonstrate concrete outcomes rather than reproduce documentation.

---

# 6. Documentation

Documentation should be product-centred.

It answers questions such as:

- How do I create a graph node?
- How does a dependency work?
- How does the lifecycle work?
- How do GitHub Actions integrations work?
- How are evaluation results stored?
- How do I configure an extension?

A possible structure is:

```text
Docs

Getting Started

Concepts
  Delivery Graph
  Project Intelligence Graph
  Graph Review
  Operations Graph
  Lifecycle
  Agents
  Evaluation
  Extensions

Guides
  Start a new project
  Add Pactwright to an existing project
  Configure CI
  Create an agent
  Create a reviewer
  Create a workflow
  Build an extension

Reference
  CLI
  Configuration
  Graph schema
  Extension API

Architecture
  Core architecture
  Graph model
  Extension model
```

Documentation describes how Pactwright behaves.

It should remain distinct from methodology and educational material.

---

# 7. Academy

The Academy should be user-centred rather than feature-centred.

Its purpose is to improve proficiency with Pactwright and the broader discipline of AI-driven delivery.

A possible curriculum is:

```text
Academy

1. Foundations
   AI-driven software delivery
   Intent-driven development
   Graph-based delivery
   Human and agent responsibilities

2. Working with Pactwright
   Creating useful intent
   Building specifications
   Decomposing work
   Working with agents
   Human decision points

3. Delivery
   Implementation workflows
   Review
   Evaluation
   CI/CD
   Release workflows

4. Project Intelligence
   Project onboarding
   Architecture knowledge
   Requirements
   Constraints
   Decisions
   Operational knowledge
   Intent roadmaps

5. Review and Improvement
   Multi-reviewer workflows
   Quality evaluation
   Production feedback
   Corrective intent
   Continuous improvement

6. Advanced Workflows
   Multi-agent workflows
   Multi-graph workflows
   Custom agents
   Custom reviewers
   Workflow composition
   Extension development

7. Projects
   Build a service
   Extend an existing application
   Handle a production incident
   Perform a migration
   Build a custom workflow
```

The Academy should teach judgement and methodology, not merely CLI commands.

That allows lessons to remain useful even as implementation details evolve.

---

# 8. Examples

Examples should be treated as first-class project assets.

Avoid limiting them to toy examples such as `hello-world`.

Use realistic engineering and delivery scenarios.

For example:

```text
examples/
├── new-api-service/
├── add-feature-existing-system/
├── dependency-upgrade/
├── production-incident/
├── architecture-migration/
├── custom-review-workflow/
├── project-intelligence-onboarding/
└── creative-delivery/
```

A good example can be reused by several surfaces simultaneously:

```text
Example
   │
   ├── README walkthrough
   ├── Documentation guide
   ├── Academy exercise
   ├── Case study
   ├── Automated test
   └── Demo
```

This reduces duplicated content while ensuring examples remain executable.

---

# 9. Case Studies

Case studies should demonstrate complete journeys rather than isolated features.

## Example: Building a New Service

Follow the work from:

```text
Initial intent
↓
Project intelligence
↓
Specification
↓
Decomposition
↓
Implementation
↓
Review
↓
GitHub pull requests
↓
CI
↓
Release
↓
Evaluation
↓
Production feedback
↓
Graph evolution
```

Other useful case studies include:

### Adding Authentication to an Existing System

Demonstrates project discovery and graph onboarding.

### Production Incident

Demonstrates Operations Graph integration and corrective intent.

### Architecture Migration

Demonstrates long-running dependency and planning relationships.

### Creative Delivery

Demonstrates that the delivery graph can coordinate outputs beyond software.

### Pactwright Building Pactwright

Use the Pactwright repository itself as a continuing dogfooding case study.

Case studies provide evidence that the methodology works across complete delivery lifecycles.

---

# 10. Blog

The blog should not be limited to Pactwright announcements.

It can establish Pactwright as part of the broader discipline of AI-driven work.

Three main editorial streams are useful.

## Pactwright

Topics such as:

- releases
- capabilities
- architecture decisions
- extension development
- project updates
- design decisions

## AI Delivery

Topics such as:

- coding agents
- agent orchestration
- specification-driven development
- context engineering
- evaluation
- AI code review
- GitHub automation
- graph engineering
- loop engineering
- multi-agent systems
- new AI tools and skills

## Practice

Actionable methodology.

Examples:

- Structuring project knowledge for coding agents
- Designing effective AI reviewers
- What belongs in `AGENTS.md`
- Managing context across long-running projects
- Turning production findings into corrective intent
- Designing useful evaluation loops
- Comparing specification-driven development approaches

The blog can therefore attract people who are interested in AI engineering even before they know Pactwright exists.

---

# 11. Extensions

Pactwright should initially provide an **extension registry**, not a complex marketplace.

Third-party extensions can remain in their own repositories.

Pactwright only needs enough metadata to discover, understand, install, and evaluate them.

A basic extension manifest could contain:

```text
name
description
author
version
repository
compatibility
capabilities
installation
```

The website can expose extension categories such as:

```text
Extensions

Agents
Reviewers
Evaluators
Workflows
Integrations
Skills
Commands
Templates
Graph Extensions
```

Each extension page can contain:

- description
- capabilities
- examples
- installation
- documentation
- source repository
- author
- compatibility
- supported Pactwright versions

Official extensions can live inside the Pactwright organisation while community extensions remain independently maintained.

---

# 12. Content Ownership

Each type of information should have one canonical home.

| Information | Canonical location |
|---|---|
| What Pactwright is | README / website |
| Installation | Docs |
| Product concepts | Docs |
| CLI behaviour | Reference |
| Graph model | Engineering specs / docs |
| Methodology | Academy |
| Executable workflows | Examples |
| Real-world outcomes | Case studies |
| Current thinking | Blog |
| Extension metadata | Extension registry |

This prevents accidental product behaviour being defined inside tutorials, blog posts, or case studies.

For example:

A blog article may discuss a new methodology, but if that methodology becomes Pactwright behaviour it must also be represented in the appropriate specification and documentation.

---

# 13. Content Reuse

Avoid writing the same material independently for every surface.

Prefer reusable source material.

For example:

```text
Canonical example
      │
      ├── README summary
      ├── Docs walkthrough
      ├── Academy exercise
      ├── Case study
      └── Website demo
```

Likewise:

```text
Extension manifest
      │
      ├── CLI discovery
      ├── Website catalogue
      └── Documentation
```

And:

```text
Engineering specification
      │
      ├── Product implementation
      ├── Reference documentation
      └── Architecture documentation
```

The website becomes primarily a presentation layer over project knowledge rather than a separate content silo.

---

# 14. User Journey

The complete ecosystem should support a clear progression.

```text
Article / GitHub / Search / Recommendation
                    │
                    ▼
            Website or README
                    │
                    ▼
             Understand Pactwright
                    │
                    ▼
                Quick Start
                    │
                    ▼
             First useful graph
                    │
                    ▼
                 Examples
                    │
                    ▼
                  Academy
                    │
                    ▼
            Advanced workflows
                    │
                    ▼
                Extensions
                    │
                    ▼
           Build own extension
                    │
                    ▼
          Contribute to ecosystem
```

Not every user needs to follow the complete path, but each step should provide a clear next step for those who want to go deeper.

---

# 15. Core Principles

## Repository as Source of Truth

Product knowledge, examples, educational material, and extension metadata should be version-controlled wherever practical.

## Progressive Disclosure

Do not explain everything immediately.

Provide increasing depth through:

```text
Homepage
→ README
→ Quick Start
→ Examples
→ Docs
→ Academy
→ Engineering specifications
```

## Show Real Work

Prefer complete workflows and realistic examples over abstract feature descriptions.

## Separate Product Knowledge from Methodology

Documentation explains Pactwright.

The Academy teaches how to use Pactwright effectively.

## Reuse Content

Examples, specifications, extension manifests, and project metadata should feed multiple publishing surfaces.

## Dogfood Pactwright

Use Pactwright to manage Pactwright's own:

- specifications
- development
- reviews
- documentation
- website
- content
- Academy
- extensions
- releases
- operational feedback

The Pactwright project itself should become one of its strongest case studies.

---

# 16. Recommended Initial Scope

Avoid building the entire ecosystem infrastructure at once.

Start with:

```text
Repository
├── README
├── Source
├── Docs
├── Examples
├── Academy content
├── Extension registry
└── Website
    ├── Homepage
    ├── Docs
    ├── Academy
    ├── Extensions
    ├── Case Studies
    └── Blog
```

Keep all content Markdown-first where practical.

Add richer infrastructure only when the content or community requires it.

The goal is not to build a documentation platform, learning-management system, or marketplace.

The goal is to create a coherent path that helps someone:

**discover Pactwright, understand it, become productive, improve their practice, customise the system, and eventually contribute back to the ecosystem.**

---

**Pactwright Open-Source Project Organisation v2**
