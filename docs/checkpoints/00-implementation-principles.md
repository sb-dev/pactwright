# Pactwright — Implementation Principles

**Version:** 3  
**Status:** Implementation guidance

## 1. Purpose

This document defines how Pactwright should be implemented and proven.

It is intentionally separate from canonical system semantics.

Authority is:

```text
docs/specs/01–08
→ canonical Pactwright semantics

Implementation Principles
→ how the system should be built and proven

Implementation Guide
→ checkpoint sequence, engineering baseline and release model

Checkpoint files
→ executable implementation runbooks
```

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
- Contract and Delivery lifecycle mechanics;
- an AI adapter;
- installation/distribution;

those capabilities must be implemented directly.

As soon as the first installable core exists, subsequent Pactwright work should use Pactwright wherever the implemented capability set can represent that work safely.

A later implementation stage must not ignore an already working Pactwright capability merely because using it introduces ceremony.

If the ceremony is obstructive, that is product evidence.

The exact acceptance threshold for when a newly implemented capability becomes mandatory for dogfooding remains an open design gap. It must not become an indefinite excuse to bypass a working public mechanism.

---

## 4. Use the Previous Stage to Build the Next

A capability cannot depend on itself to introduce itself.

Each stage uses the system available at the end of the previous accepted stage.

Examples:

```text
Core GitHub integration
→ built using local Delivery

Project Intelligence
→ built using Delivery + GitHub

Graph Review
→ built using Delivery + GitHub + Project Intelligence

Production Skills + Assets / Publication
→ built using Delivery + PI + Graph Review where applicable

Operations
→ built using Delivery + Project Intelligence

Publication Feedback
→ built using Assets / Publication + Operations + Project Intelligence
```

Do not write implementation instructions that assume a command, Extension or automation exists before its own stage has delivered it.

---

## 5. Vertical Slices, Not Spec-by-Spec Construction

Canonical specifications overlap at integration boundaries.

Implementation should therefore follow vertical capabilities rather than:

```text
finish spec A
→ finish spec B
→ finish spec C
```

A useful early slice is:

```text
Intent
→ Decision
→ Contract
→ Brief
→ Delivery
→ Review
→ Evidence
```

That is more valuable than independently completing schemas, prompts and GitHub files with no working lifecycle.

A vertical slice may cross multiple subsystem boundaries.

It must not erase those boundaries.

---

## 6. Use the Strongest Available Pactwright Capability

Pactwright should increasingly build the whole project through itself, not only its runtime source.

Use the strongest capability currently proven:

```text
Delivery exists
→ material project changes use normal Contract-governed Delivery

Project Intelligence exists
→ knowledge-dependent work uses accepted PI context
→ new project meaning returns through Sources and governance

Graph Review exists
→ specialist Project Graph analysis uses Graph Review
→ Findings enter Project Intelligence before consequence

Production Skills are integrated
→ specialised software, research, design, narrative, video, music, game and other work uses the relevant Production Skills through the selected Agent Pack

Assets / Publication exists
→ approved durable outputs become Assets
→ real release of an Asset becomes a Publication where applicable

Operations exists
→ deployed or otherwise registered real-world exposures can produce Observations
→ Observations enter Project Intelligence

Publication feedback is available
→ selected Publications may enter the same Operations → PI feedback loop
```

Do not create a parallel lifecycle for specialised production.

The model remains:

```text
normal Delivery
+ selected Agent Pack
+ relevant Production Skills
+ Assets / Publication where the output becomes a durable approved artefact
```

---

## 7. Public-Content Authority and Readiness

Public content must not compensate for missing project truth.

### Before Project Intelligence

Before PI exists, strategic public choices require bounded Delivery authority for the specific work:

```text
Intent
→ authorised Decision
→ selected Contract
→ Brief
→ Delivery
```

Identity, positioning, product claims and other strategic choices must not be invented by the production model merely because no project knowledge store exists yet.

### With Project Intelligence

Once PI exists for the relevant project state, public/outbound work uses accepted current Knowledge and must satisfy the applicable coverage gate before approval.

Typical domain requirements are:

```text
identity
→ when identity, voice or values matter

content
→ editorial, educational or marketing work

product
→ capability, value, behaviour or limitation claims

go-to-market
→ acquisition, positioning, CTA or campaign work

delivery/ux
→ user-facing workflow or UX material

delivery/eng
→ technical implementation claims

other subject domains
→ factual claims that depend on them
```

Coverage is scoped to the work. It means the necessary current claims and constraints are represented by accepted, in-horizon Knowledge with traceable Sources, not that the whole domain is complete.

If coverage is insufficient:

```text
intelligence onboard
→ identify missing Sources or Decisions
→ normal Delivery / research creates or collects the missing material
→ intelligence ingest
→ triage / reviewed promotion where required
→ re-check coverage
```

If relied-on Knowledge is challenged, superseded or retracted before approval, re-ground and re-evaluate the work before it becomes an Asset or Publication.

---

## 8. Two Longitudinal Acceptance Projects

Pactwright uses two persistent real projects.

### Pactwright

Pactwright is the primary dogfooding project.

It includes:

```text
runtime + CLI
standard Agent Pack
first-party Extensions
GitHub integration
README
Docs
Examples
Academy
registry
Website
Case Studies
Blog
```

The public project is implementation work, not post-launch decoration.

Every checkpoint should advance code and the smallest useful public surface enabled by that capability.

Pactwright must prove it can deliver:

- code;
- specifications;
- documentation;
- education;
- examples;
- public content;
- approved durable Assets;
- releases;
- production improvements.

### Kakeido

Kakeido is the external consumer project.

It exercises a materially different product/domain surface, including:

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
- weak production guidance;
- weak UX/content guidance.

Use Kakeido's current canonical project specifications for acceptance. Do not treat stale copies embedded in Pactwright as authoritative.

Do not add another longitudinal acceptance project unless neither Pactwright nor Kakeido can realistically exercise a required capability class.

---

## 9. Checkpoints Are Installable Product Milestones

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

Problems found during installation and use become future governed project work.

A checkpoint is not accepted when only its happy-path unit tests pass.

---

## 10. Real Work Before Synthetic Demos

Prefer real acceptance work whenever possible.

Use Pactwright work to test Pactwright capabilities.

Use Kakeido work to test external consumption.

Synthetic fixtures remain essential for deterministic semantics, failure boundaries and regression suites, but they are not substitutes for system-level use.

The strongest acceptance result is:

```text
real project requirement
→ correct durable state
→ useful Delivery
→ real exposure where applicable
→ observable result
→ traceable feedback
```

not:

```text
command exited 0
```

---

## 11. Commands Must Follow Ownership

Pactwright has distinct execution surfaces.

### Runtime CLI

Use the runtime for deterministic Pactwright mechanics:

```text
pactwright init
pactwright sync
pactwright validate
pactwright doctor
pactwright upgrade
pactwright lifecycle ...
pactwright agent-pack use ...
pactwright agent-pack upgrade
pactwright extension ...
pactwright github sync
pactwright intelligence ...
pactwright graph-review ...
pactwright assets ...
pactwright operations ...
pactwright eval
```

When Pactwright is installed as a project dependency, invoke through:

```bash
pnpm pactwright ...
```

Upgrade ownership is explicit:

```text
pactwright upgrade
→ runtime

pactwright agent-pack upgrade
→ selected Agent Pack

pactwright extension upgrade <id>
→ Extension
```

### AI adapter responsibilities

The generated adapter exposes AI responsibilities such as Contract crafting, Brief creation, Delivery and Review according to the active adapter and selected Agent Pack.

Conceptually:

```text
capture Intent
propose Contract alternatives
record authorised Contract selection
write Brief
deliver Brief
review Delivery
prepare Evidence
```

Adapter commands execute responsibilities.

The Pactwright runtime remains authoritative for graph semantics, authority and valid transitions.

### Production Skills commands

Production Skills may expose narrower production commands for their own composition, tooling, tests and benchmarks.

Those commands remain owned by the Production Skills repositories and do not automatically become Pactwright CLI commands.

### Configuration

Do not invent commands for behaviour intentionally driven by configuration.

Edit the owning Pactwright configuration, then run:

```bash
pnpm pactwright sync
```

and, when GitHub remote structure changes:

```bash
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

---

## 12. Repository and Graph Boundaries Remain Intact

Implementation convenience must not collapse architectural ownership.

Keep:

```text
Delivery
→ what was requested, authorised and delivered

Project Intelligence
→ what the project currently understands

Graph Review
→ specialist Project Graph analysis and Finding production

Production Skills
→ specialised reusable production expertise

Assets / Publication
→ approved durable outputs and release records

Operations
→ what happened after work reached a real-world exposure

Distribution
→ installation, composition, locking, upgrades and reconciliation

GitHub
→ remote execution and projection
```

In particular:

- Evidence is not Deployment.
- Evidence is not Publication.
- a Graph Review Finding is not accepted Knowledge.
- a Finding is execution output, not a normal Project Graph node.
- an Observation is canonical Operations state but not accepted Knowledge.
- Project Intelligence candidates are not canonical Intents.
- candidate production outputs are not Assets.
- GitHub fields are not canonical graph state.
- execution provenance is not normal Project Graph truth.
- Production Skills do not own Pactwright lifecycle semantics.

A vertical slice may cross boundaries. It must not erase them.

---

## 13. Repository as Source of Truth

The Pactwright repository remains the source of truth for the open-source product.

Public surfaces should reuse canonical project material wherever practical.

```text
authoritative project semantics / knowledge
        ↓
README / Docs / Academy / Examples / Website
```

Do not allow tutorials, blog posts, case studies or generated website copy to silently become alternative definitions of product behaviour.

If public content reveals that product semantics are missing or wrong, fix the owning canonical specification or Project Intelligence first.

---

## 14. Content Is Part of Product Quality

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

Once Project Intelligence exists, ground applicable public work in accepted Knowledge.

Specialised public production uses normal Delivery plus relevant Production Skills. When the result becomes an approved durable output, record it through Assets / Publication.

Content failures are product failures.

The public journey should progressively cover:

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
→ PI docs + onboarding example + Academy lesson + public-content knowledge foundation

Graph Review
→ Graph Review docs/example/Academy + review the existing public corpus

Production Skills + Assets / Publication
→ specialised-production guide/example/Academy + first grounded approved public Asset/Publication

Operations
→ Operations docs/example/Academy + production-feedback content

Publication Feedback
→ revise a selected real Publication from Operations evidence

Full Operating Surface
→ end-to-end guide/example + advanced Academy + ecosystem/Extension catalogue

Hardened Loop
→ case study + contribution/launch material + final public-surface audit
```

---

## 15. System-Level Acceptance Dimensions

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

Could discovered defects become normal governed future project work?

A checkpoint may pass its internal tests and still fail System-Level Acceptance.

---

## 16. Feedback Becomes Product Evidence

Real use should create evidence about Pactwright itself.

Before Project Intelligence exists, capture important findings and corrections through normal Delivery work.

When Project Intelligence becomes available, ingest applicable existing authorised Pactwright material and the current public corpus through the normal Source path.

After Project Intelligence exists:

```text
finding / feedback
→ Source
→ triage
→ Knowledge where justified
→ intent candidate where justified
→ explicit Intent
→ normal Delivery
```

Graph Review Findings and Operations Observations enter this same governance boundary through their required PI hand-offs.

Do not automatically generalise every project preference into Pactwright behaviour.

Ask:

> Is this a Kakeido-specific choice, or evidence that a Pactwright responsibility failed?

Only repeatable Pactwright responsibility failures belong in generic evaluation or product semantics.

---

## 17. Evaluation Grows From Real Failures

Evaluation should combine:

- deterministic fixtures;
- Extension-owned semantic cases;
- Agent Pack responsibility cases;
- failures observed while building Pactwright;
- failures observed while using Pactwright on Kakeido.

Useful Pactwright-level cases include:

- a Contract loses a financial invariant;
- Delivery widens scope;
- Project Intelligence selects irrelevant Knowledge;
- Graph Review misses a supported cross-spec contradiction;
- a Finding bypasses PI governance;
- an Asset is accepted without required approval/hash/grounding;
- Operations makes an unsupported causal claim;
- installation output omits a required step.

Production-domain quality belongs to Production Skills benchmarks.

For example, voice quality, video quality, music quality or framework-specific engineering quality should not be reinvented as generic Pactwright evaluation when the owning Production Skills family already has the benchmark responsibility.

Do not collapse evaluation into one aggregate quality score.

---

## 18. Replay Must Be Exact or Fail Explicitly

Replayable execution provenance uses:

```text
repository_revision
+ project_graph_revision
+ environment_lock_hash
```

Execution-specific records may add their own immutable provenance on top.

A pinned replay must not silently use current repository state, current Project Graph state or current dependencies when recorded inputs cannot be reconstructed.

If historical inputs are unavailable:

```text
fail explicitly
→ preserve the original execution/provenance
→ do not fabricate replay equivalence
```

The exact mechanism for retaining or reacquiring historical runtime packages, Extensions, Agent Packs and external Production Skills revisions is intentionally not prescribed until implementation evidence requires it.

---

## 19. Kakeido Ingestion Progression

Kakeido initially uses CSV ingestion.

That is deliberate.

The boundary is:

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

When introduced:

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

A dedicated current Kakeido TrueLayer specification must exist before that work begins.

---

## 20. Keep the Core Lean

Do not add future sophistication merely because the implementation programme can foresee it.

Prefer:

```text
existing core responsibility
→ existing Pactwright Extension
→ Agent Pack / Production Skill improvement
→ small explicit new Extension only when stable Pactwright semantics genuinely require one
```

before changing stable Delivery semantics.

Do not create Pactwright capabilities for production domains when an existing responsibility plus Production Skills is sufficient.

Do not add provider registries, model routers, task catalogues or generation platforms that belong to Production Skills/tooling.

Future improvements remain future improvements until observed usage justifies them.

Implementation should maximise learning rate, not feature count.

---

## 21. Open Gaps Stay Open Until Evidence Resolves Them

When a canonical spec deliberately leaves a question unresolved, implementation should expose and test the boundary rather than invent hidden semantics.

Examples include:

- lifecycle-shape persistence identity;
- historical environment retention/reacquisition;
- Deployment event identity;
- Observation semantic identity/deduplication;
- external Asset byte verification;
- Asset supersession command ergonomics;
- Publication idempotency;
- GitHub managed-resource identity;
- automation branch/PR concurrency;
- exact GitHub check-conclusion mapping;
- the dogfooding maturity threshold;
- Remote Delivery public milestone completion;
- selection policy for Publications entering feedback.

Resolve these from observed use and then update the owning canonical specification deliberately.

Do not let checkpoint code become the only place where new semantics exist.

---

## 22. Completion Principle

The programme succeeds when Pactwright repeatedly demonstrates:

```text
understanding
→ Intent
→ authorised Contract
→ Delivery
→ real exposure where applicable
→ Observation / Finding / feedback
→ improved understanding
→ future Delivery
```

across both:

```text
Pactwright
Kakeido
```

without manual graph-coherence work, hidden subsystem ownership changes or silent semantic fallback.

---

## 23. Governing Questions

For implementation planning:

> What is the smallest vertical capability that can perform useful real work?

For sequencing:

> Which currently implemented Pactwright capabilities can build this stage?

For self-hosting:

> Can Pactwright safely represent this class of its own work now?

For checkpoints:

> Is this version genuinely installable and useful in Kakeido?

For content:

> Can a user succeed with this capability from what the project ships?

For feedback:

> Is this project-specific, or evidence of a Pactwright responsibility failure?

For architecture:

> Can the change stay within existing ownership boundaries?

For open gaps:

> Is this behaviour already canonical, or are we about to invent semantics inside an implementation step?

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