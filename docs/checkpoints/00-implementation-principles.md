# Pactwright — Implementation Principles

**Version:** 3  
**Status:** Implementation guidance

## 1. Purpose

This document defines the principles used to implement Pactwright.

It is intentionally separate from the operational implementation guide.

- **System Architecture** defines how Pactwright fits together.
- **Engineering specs** define subsystem semantics.
- **Implementation Principles** define how the project should be built and proven.
- **Implementation Guide** defines the concrete build sequence and commands.

This document does not redefine Pactwright semantics.

---

## 2. Governing Principle

Build Pactwright as a sequence of usable vertical capabilities.

```text
build capability
↓
use it on Pactwright
↓
publish an installable checkpoint
↓
install it on Kakeibo
↓
run a real acceptance scenario
↓
capture feedback
↓
improve the next capability
↺
```

Do not build the whole platform and test it at the end.

The smallest useful implementation unit is:

> a capability that can immediately perform real project work.

---

## 3. Progressive Self-Hosting

Pactwright should build Pactwright.

The bootstrap phase is the only exception.

Before Pactwright has:

- Project Graph storage;
- Delivery lifecycle;
- an AI adapter;
- installation/distribution;

those capabilities must be implemented directly.

As soon as the first installable core exists, subsequent Pactwright work should use Pactwright wherever the implemented capability set allows it.

A later implementation stage must not ignore an already working Pactwright capability merely because using it introduces ceremony.

If the ceremony is obstructive, that is product feedback.

---

## 4. Use the Previous Stage to Build the Next

A capability cannot depend on itself to introduce itself.

Each stage therefore uses the workflow that exists **at the end of the previous accepted stage**.

Examples:

```text
Core GitHub integration
→ built using local Delivery

Project Intelligence
→ built using Delivery + GitHub

Graph Review
→ built using Delivery + GitHub + Project Intelligence

Creative Delivery
→ built using the existing Review & Creative extension foundation

Operations
→ built using the existing Delivery + Intelligence system
```

Do not write implementation instructions that assume a command, extension or automation exists before its own stage has delivered it.

---

## 5. Vertical Slices, Not Spec-by-Spec Construction

Engineering specifications overlap at integration boundaries.

Implementation should therefore follow vertical capabilities rather than:

```text
finish spec A
→ finish spec B
→ finish spec C
```

A good slice should include enough of the relevant layers to prove one real behaviour end to end.

For example:

```text
Intent
→ Decision
→ Contract
→ Brief
→ Delivery
→ Review
→ Evidence
```

is a better early milestone than independently completing graph schemas, prompts and GitHub files with no working lifecycle.

---

## 5A. Use the Strongest Available Pactwright Capability

Pactwright must increasingly build the whole project through itself, not only its code.

The capability available at the current checkpoint defines the execution path:

```text
Delivery exists
→ all material project changes use Delivery

Project Intelligence exists
→ knowledge-dependent work uses accepted PI context
→ new project meaning returns through Sources / triage / Knowledge

Graph Review exists
→ relevant project-wide/public work is reviewed through Graph Review

Creative Delivery exists
→ public narrative, visual and educational creative work uses Creative Delivery

Operations exists
→ deployed software is observed through Operations
→ controlled production comparisons use Operations Experiments when justified

Publication exposure exists
→ selected real Publications are observed through Operations
```

Do not bypass an available Pactwright capability merely because a direct file edit is faster.

The purpose is not ceremony. It is to keep the Project Graph current while Pactwright is being built.

### Creative readiness gate

Once Project Intelligence exists, public creative work may begin only when its grounding domains are sufficiently covered.

Always require:

- `identity` = **Covered**;
- `content` = **Covered** for editorial/educational/marketing work;
- `product` = **Covered** for product/capability/value claims;
- `go-to-market` = **Covered** for acquisition/positioning/campaign work;
- any subject domain required by factual claims = **Covered**.

Coverage is scoped to the work. It means the necessary current claims and constraints are represented by accepted Knowledge, not that the entire domain is complete.

If coverage is insufficient:

```text
intelligence onboard
→ identify missing Sources / Decisions
→ normal Delivery creates or collects the missing material
→ intelligence ingest
→ triage / promotion where required
→ re-check coverage
```

Creative generation must not silently invent identity, positioning or other missing project truth.

---

## 6. Two Longitudinal Acceptance Projects

Pactwright uses two persistent real projects.

### Pactwright

Pactwright is the primary dogfooding project.

It includes:

```text
runtime + CLI
first-party extensions
GitHub integration
README
Docs
Examples
Academy
Extension registry
Website
Case Studies
Blog
```

The public project is implementation work, not post-launch decoration.

Every checkpoint must advance code **and** the smallest useful part of the public product enabled by that capability. Public content should not accumulate as a final-documentation phase.

Pactwright must prove it can deliver:

- code;
- specifications;
- documentation;
- education;
- examples;
- public content;
- creative assets;
- production improvements.

### Kakeibo

Kakeibo is the external consumer project.

It exercises:

```text
deterministic financial-domain rules
CSV financial-data ingestion
weekly review
mobile UX
Cloudflare backend
Neon persistence
bounded/versioned Kei behaviour
first-party product and marketing analytics
marketing site
mobile/backend releases
production Operations
controlled production Experiments where justified
connected banking through the generic ingestion boundary
```

The current proving progression is:

```text
deterministic financial core
→ CSV ingestion
→ weekly review
→ bounded/versioned Kei
→ production Operations
→ controlled Experiment where justified
→ connected banking
```

Salt Edge Account Information is the current planned first connected-banking provider. It is a Kakeibo implementation choice, not a Pactwright semantic dependency.

Kakeibo exists to catch assumptions that self-hosting can hide:

- installation problems;
- repository-layout assumptions;
- poor onboarding;
- bad context selection;
- semantic loss across unrelated domains;
- generated-file ownership mistakes;
- GitHub provisioning problems;
- weak UX or content guidance;
- unsafe AI release/evaluation assumptions;
- application-specific concepts leaking into Pactwright graph semantics.

Do not add another acceptance project unless neither Pactwright nor Kakeibo can realistically exercise a required capability class.

---

## 7. Checkpoints Are Installable Product Milestones

A checkpoint is not simply the end of a coding phase.

Every checkpoint must prove:

### Build

The new capability exists and passes its own tests.

### Adopt

Pactwright enables and uses the capability.

### Use

At least one real subsequent Pactwright change is delivered through it.

### Install

The same checkpoint can be installed into Kakeibo.

### Accept

Kakeibo completes a meaningful System-Level Acceptance Scenario.

### Learn

Problems found during installation and use become future project work.

A checkpoint is not accepted when only its happy-path unit tests pass.

---

## 8. Real Work Before Synthetic Demos

Prefer real acceptance work whenever possible.

Use Pactwright work to test Pactwright capabilities.

Use Kakeibo work to test external consumption.

Synthetic fixtures still belong in deterministic and semantic evaluation suites, but they are not substitutes for system-level use.

The strongest acceptance result is:

```text
real project requirement
→ correct durable state
→ useful delivery
→ observable result
→ traceable feedback
```

not:

```text
command exited 0
```

---

## 9. Commands Must Follow Ownership

Pactwright has distinct execution surfaces.

### Runtime CLI

Use for deterministic mechanics:

```text
pactwright init
pactwright sync
pactwright validate
pactwright context
pactwright lifecycle ...
pactwright extension ...
pactwright github sync
pactwright intelligence ...
pactwright review ...
pactwright creative ...
pactwright operations ...
pactwright eval
```

When Pactwright is installed as a project dependency, invoke these through:

```bash
pnpm pactwright ...
```

### AI adapter commands

Use the generated adapter for lifecycle responsibilities:

```text
/capture-intent
/propose-contracts
/approve-contract
/write-brief
/deliver-brief
/review
/prepare-evidence
```

Adapter commands execute lifecycle responsibilities.

The Pactwright runtime remains authoritative for graph semantics and valid transitions.

### Configuration

Do not invent commands for behaviour that is intentionally configuration-driven.

Edit the owning Pactwright configuration and then run:

```bash
pnpm pactwright sync
```

and, when GitHub remote state changes:

```bash
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

---

## 10. Repository and Graph Boundaries Remain Intact During Implementation

Implementation convenience must not collapse architectural boundaries.

Keep:

```text
Delivery
→ what was requested, agreed and delivered

Project Intelligence
→ what the project currently understands

Graph Review
→ specialist critique and finding production

Creative Delivery
→ creative execution plus approved Assets and Publications

Operations
→ what reached production, what controlled comparison was predeclared, and what was observed afterwards

Distribution
→ installation, composition and reconciliation

GitHub
→ remote execution and projection
```

For controlled production evaluation, preserve the generic boundary:

```text
Delivery Evidence
→ exact operational exposures
→ Experiment
→ bounded external evidence
→ Observation
→ Project Intelligence Source
→ normal governance / future Delivery
```

`Experiment` records the immutable comparison contract. It does not own the application-specific candidate being tested, raw assignment/event rows, promotion or rollout policy.

In particular:

- Evidence is not Deployment.
- Evidence is not Publication.
- Experiment is not a Delivery lifecycle stage.
- an Experiment result is not a promotion Decision.
- project-specific release/configuration artefacts are not automatically Pactwright node types.
- Review findings are not accepted Knowledge.
- Observation is not accepted Knowledge.
- Project Intelligence candidates are not canonical Intents.
- GitHub fields are not canonical graph state.
- execution provenance is not normal Project Graph truth.

A vertical slice may cross boundaries.

It must not erase them.

---

## 11. Repository as Source of Truth

The Pactwright repository remains the source of truth for the open-source project.

Public surfaces should reuse canonical project material wherever practical.

```text
authoritative project knowledge
        ↓
README / Docs / Academy / Examples / Website
```

Do not allow:

- tutorials;
- blog posts;
- case studies;
- generated website copy;

to silently become alternative definitions of product behaviour.

If public content reveals that product semantics are missing or wrong, fix the authoritative specification or Project Intelligence first.

---

## 12. Content Is Part of Product Quality

Installation and execution alone are insufficient.

At every checkpoint, evaluate whether a new user could discover and operate the delivered capability from:

- README;
- Quick Start;
- Docs;
- examples;
- Academy;
- website;
- error messages;
- generated command help;
- onboarding.

Deliver the smallest concrete content set needed to close those gaps during the same checkpoint.

Once Project Intelligence exists, derive and ground this work from accepted Knowledge. Once Creative Delivery exists, use it for public narrative, visual and educational creative artefacts.

Content failures are product failures.

The Pactwright public project should progressively cover:

```text
Discover
→ Understand
→ Try
→ Learn
→ Extend
→ Contribute
```

The planned progression is:

```text
Core Delivery
→ README Quick Start + Getting Started + first example

Remote Delivery
→ website foundation + GitHub guide + remote example

Project Intelligence
→ PI docs + onboarding example + Academy lesson + identity/content readiness

Graph Review
→ Review docs/example/Academy + review the existing public corpus

Creative Delivery
→ creative docs/example/Academy + first grounded public Publication

Operations
→ Operations docs/example/Academy + production-learning content

Publication feedback
→ revise a real Publication from production evidence

Full operating surface
→ end-to-end guide/example + advanced Academy + extension catalogue

Hardened loop
→ case study + contribution/launch material + final public-surface audit
```

---

## 13. System-Level Acceptance Dimensions

Every checkpoint scenario should test six dimensions.

### Semantics

Did durable project meaning remain correct?

### Execution

Could Pactwright complete the required responsibility?

### Boundaries

Did any subsystem take ownership of state it does not own?

### Installation

Could the same capability work outside the Pactwright repository?

### Content

Could a user understand and operate it from shipped project material?

### Feedback

Could discovered defects become normal future project work?

A checkpoint may pass its internal tests and still fail System-Level Acceptance.

---

## 14. Feedback Becomes Product Evidence

Real use should create evidence about Pactwright itself.

Before Project Intelligence exists, capture important findings and public-content changes through normal Delivery work.

When Project Intelligence first becomes available, ingest the existing Pactwright public corpus so identity/content/product knowledge and public claims can be inspected against the same project understanding.

After Project Intelligence exists:

```text
finding / feedback
→ Source
→ triage
→ Knowledge where justified
→ intent candidate where justified
→ normal Delivery
```

Do not automatically generalise every project preference into Pactwright behaviour.

Ask:

> Is this a Kakeibo-specific choice, or evidence that a Pactwright responsibility failed?

Only repeatable Pactwright responsibility failures belong in generic evaluation or product semantics.

For controlled Experiments, a favourable metric is still evidence rather than authority:

```text
Experiment
→ Observation
→ Source
→ Project Intelligence governance
→ future Delivery where justified
```

---

## 15. Evaluation Grows From Real Failures

Evaluation should combine:

- deterministic fixtures;
- extension-owned semantic cases;
- failures observed while building Pactwright;
- failures observed while using Pactwright on Kakeibo.

Useful real-derived evaluation cases include:

- a Contract loses a financial invariant;
- Delivery widens scope;
- Project Intelligence selects irrelevant knowledge;
- Graph Review misses a cross-spec contradiction;
- creative output violates grounded product voice;
- Operations makes an unsupported causal claim;
- an Experiment ignores a predeclared guardrail or reports insufficient evidence as conclusive;
- installation output omits a required step.

Do not collapse evaluation into one aggregate quality score.

---

## 16. Kakeibo Ingestion Progression

Kakeibo initially uses CSV ingestion.

That is deliberate.

The canonical ingestion boundary is source-neutral:

```text
source-specific data
→ IngestionAdapter
→ NormalisedSourceRecord
→ FinancialEntry
```

The initial source is:

```text
CSV
→ file-backed FinancialSource
→ IngestionAdapter
→ NormalisedSourceRecord
→ FinancialEntry
```

Connected banking is a later graduation scenario.

The intended progression is:

```text
CSV -----------┐
               │
Salt Edge -----┼→ IngestionAdapter
               │
future --------┘
                    ↓
             NormalisedSourceRecord
                    ↓
               FinancialEntry
                    ↓
          preparation / review
                    ↓
            trusted history
```

Salt Edge Account Information is the current planned first connected-banking implementation. Future providers must use the same general boundary.

The new source must not silently redefine:

- financial invariants;
- `FinancialEntry` semantics;
- movement / plan treatment / category / tags / goal / scope separation;
- review state;
- preparation state;
- weekly-review UX;
- duplicate semantics;
- historical interpretation;
- Kei's authority.

Keep these concepts separate:

```text
provider/source lifecycle
≠ review truth

provider category/enrichment
≠ reviewed classification

provider cursor/source identity
≠ FinancialEntry identity

source re-import idempotency
≠ user-resolved financial duplicate
```

A provider-specific connected-banking specification must exist before that implementation begins. Provider mechanics remain Kakeibo-owned and must not become Pactwright graph semantics.

---

## 17. Keep the Core Lean

Do not add future sophistication merely because the implementation programme can foresee it.

Prefer:

```text
existing core capability
→ existing extension
→ agent/skill improvement
→ small explicit extension
```

before changing stable Delivery semantics.

A new generic graph concept should be introduced only after real use demonstrates that existing semantics cannot represent the durable project truth cleanly.

Kakeibo's controlled production-evaluation need justifies generic Operations `Experiment` semantics. It does **not** justify Kakeibo-specific Pactwright nodes for Kei releases, policies, personas, task contracts, model routes or benchmark cases.

Future improvements remain future improvements until observed usage justifies them.

Implementation should maximise learning rate, not feature count.

---

## 18. Completion Principle

The programme succeeds when Pactwright repeatedly demonstrates:

```text
understanding
→ Intent
→ Delivery
→ production exposure
→ Experiment when a controlled comparison is required
→ Observation
→ improved understanding
→ future Delivery
```

across both:

```text
Pactwright
Kakeibo
```

An Experiment is optional. Normal production learning remains:

```text
Delivery
→ production exposure
→ Observation
→ improved understanding
```

The programme must do this without manual graph-coherence work or hidden subsystem ownership changes.

---

## 19. Governing Questions

For implementation planning:

> What is the smallest vertical capability that can perform useful real work?

For sequencing:

> Which currently implemented Pactwright capabilities can build this stage?

For self-hosting:

> Can Pactwright use this capability on its next change?

For checkpoints:

> Is this version genuinely installable and useful in Kakeibo?

For content:

> Can a user succeed with this capability from what the project ships?

For feedback:

> Is this project-specific, or evidence of a Pactwright responsibility failure?

For architecture:

> Can the change stay within existing ownership boundaries?

For new graph concepts:

> Is this durable generic project truth that existing graph semantics cannot represent cleanly, or merely application-specific state?

Prefer:

```text
build
→ use
→ observe
→ improve
```

over:

```text
build everything
→ integrate everything
→ discover problems at the end
```

---

**Pactwright — Implementation Principles v3**
