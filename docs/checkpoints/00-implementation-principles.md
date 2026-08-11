# Pactwright — Implementation Principles

**Version:** 1  
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
install it on Kakeido
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

Pactwright must prove it can deliver:

- code;
- specifications;
- documentation;
- education;
- examples;
- public content;
- creative assets;
- production improvements.

### Kakeido

Kakeido is the external consumer project.

It exercises:

```text
financial-domain rules
CSV financial-data ingestion
weekly review
mobile UX
Cloudflare backend
Neon persistence
Kei
marketing site
mobile/backend releases
production operations
later TrueLayer ingestion
```

Kakeido exists to catch assumptions that self-hosting can hide:

- installation problems;
- repository-layout assumptions;
- poor onboarding;
- bad context selection;
- semantic loss across unrelated domains;
- generated-file ownership mistakes;
- GitHub provisioning problems;
- weak UX or content guidance.

Do not add another acceptance project unless neither Pactwright nor Kakeido can realistically exercise a required capability class.

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

The same checkpoint can be installed into Kakeido.

### Accept

Kakeido completes a meaningful System-Level Acceptance Scenario.

### Learn

Problems found during installation and use become future project work.

A checkpoint is not accepted when only its happy-path unit tests pass.

---

## 8. Real Work Before Synthetic Demos

Prefer real acceptance work whenever possible.

Use Pactwright work to test Pactwright capabilities.

Use Kakeido work to test external consumption.

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
→ what happened after work reached production

Distribution
→ installation, composition and reconciliation

GitHub
→ remote execution and projection
```

In particular:

- Evidence is not Deployment.
- Evidence is not Publication.
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
- error messages;
- generated command help;
- onboarding.

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

Before Project Intelligence exists, capture important findings through normal Delivery work.

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

> Is this a Kakeido-specific choice, or evidence that a Pactwright responsibility failed?

Only repeatable Pactwright responsibility failures belong in generic evaluation or product semantics.

---

## 15. Evaluation Grows From Real Failures

Evaluation should combine:

- deterministic fixtures;
- extension-owned semantic cases;
- failures observed while building Pactwright;
- failures observed while using Pactwright on Kakeido.

Useful real-derived evaluation cases include:

- a Contract loses a financial invariant;
- Delivery widens scope;
- Project Intelligence selects irrelevant knowledge;
- Graph Review misses a cross-spec contradiction;
- creative output violates grounded product voice;
- Operations makes an unsupported causal claim;
- installation output omits a required step.

Do not collapse evaluation into one aggregate quality score.

---

## 16. Kakeido Ingestion Progression

Kakeido initially uses CSV ingestion.

That is deliberate.

The initial boundary is:

```text
CSV
↓
normalisation
↓
canonical spendings
↓
weekly review
```

TrueLayer is a later graduation scenario.

When introduced, the intended boundary is:

```text
CSV --------┐
            │
TrueLayer --┼→ canonical ingestion / normalisation
            │
future -----┘
                 ↓
              spendings
                 ↓
            weekly review
```

The new source must not silently redefine:

- financial invariants;
- spending semantics;
- classification;
- review state;
- weekly-review UX;
- Kei's authority.

A dedicated TrueLayer specification must exist before that work begins.

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

Future improvements remain future improvements until observed usage justifies them.

Implementation should maximise learning rate, not feature count.

---

## 18. Completion Principle

The programme succeeds when Pactwright repeatedly demonstrates:

```text
understanding
→ Intent
→ Delivery
→ production
→ Observation
→ improved understanding
→ future Delivery
```

across both:

```text
Pactwright
Kakeido
```

and can do so without manual graph-coherence work or hidden subsystem ownership changes.

---

## 19. Governing Questions

For implementation planning:

> What is the smallest vertical capability that can perform useful real work?

For sequencing:

> Which currently implemented Pactwright capabilities can build this stage?

For self-hosting:

> Can Pactwright use this capability on its next change?

For checkpoints:

> Is this version genuinely installable and useful in Kakeido?

For content:

> Can a user succeed with this capability from what the project ships?

For feedback:

> Is this project-specific, or evidence of a Pactwright responsibility failure?

For architecture:

> Can the change stay within existing ownership boundaries?

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

**Pactwright — Implementation Principles v1**
