# Pactwright Assets and Publication

## 1. Purpose

Assets / Publication is an optional Pactwright Extension for recording approved durable outputs and where they are published.

Its core flow is:

```text
Evidence
→ approval
→ Asset
→ Publication
```

It answers two questions:

```text
Asset
→ What approved durable output exists?

Publication
→ Where and how was that Asset exposed?
```

The Extension is production-domain neutral.

An Asset may originate from:

- software Delivery;
- design work;
- research;
- narrative production;
- music production;
- video production;
- game development;
- documentation;
- generated media;
- manually produced work.

The Extension does not define how those outputs are created.

---

## 2. Scope and Ownership

Assets / Publication owns:

```text
Asset
Publication
Asset approval
Asset provenance
Asset supersession
publication traceability
Evidence → Asset relationships
Asset → Publication relationships
```

It does not own:

```text
Contract
Brief
Delivery
Delivery Review
Production Skills
Graph Review
Project Intelligence Knowledge
provider/model routing
generation workflows
Deployment
Observation
operational performance
```

Production remains:

```text
Delivery
→ delivery-execution
→ Agent Pack
→ Production Skills
```

Verification remains:

```text
Delivery
→ delivery-review
→ Evidence
```

Assets / Publication begins after successful Delivery Evidence.

---

# 3. Extension Boundary

The Project Graph may contain:

```text
Pactwright Project Graph
├── Delivery Graph                 core
├── Project Intelligence           optional
├── Graph Review                   optional
├── Assets / Publication           optional
└── Operations                     optional
```

Assets / Publication does not require Graph Review.

It does not require Project Intelligence for its basic meaning.

Operations is an independent sibling Extension.

When both are enabled:

```text
Publication
→ may become an Operations exposure
```

Operations then owns what happened after publication.

Assets / Publication continues to own what was approved and published.

---

# 4. Post-Delivery Boundary

Core Delivery ends at Evidence.

```text
Intent
→ Decision
→ Contract
→ Brief
→ Delivery
→ Review
→ Evidence
```

Assets / Publication extends that lifecycle only when a durable approved output needs to be recorded:

```text
Evidence
→ approval
→ Asset
→ Publication
```

This distinction is important.

Evidence means:

> The governing Contract and Brief were delivered and verified.

Asset means:

> This specific output has been approved as a durable project artefact.

Publication means:

> This approved Asset was exposed through a defined channel or surface.

These are different claims.

---

# 5. Asset

An Asset is an approved durable output produced or selected through completed Delivery.

Conceptually:

```yaml
id: asset-...
type: ...
title: ...
content:
  location: ...
  hash: ...

derived_from:
  evidence: evidence-...

approved_at: ...
approved_by: ...

status: current | superseded | withdrawn
superseded_by: null | asset-...

provenance: ...
```

The exact schema may evolve.

An Asset should record enough information to establish:

- stable identity;
- content identity;
- originating Evidence;
- approval;
- provenance;
- current/superseded state.

---

# 6. Asset Approval

Successful Delivery does not automatically create an Asset.

The transition is explicit:

```text
Evidence
→ approval
→ Asset
```

Approval answers:

> Is this output authorised to become a durable project Asset?

This approval does not change the governing Contract.

It is therefore not a Delivery Graph Decision.

It is a post-Delivery Asset authority check.

A project may choose different approval policies depending on Asset type.

For example:

```text
internal architecture document
→ delegated approval

public campaign video
→ human approval
```

The exact authority is repository policy.

---

# 7. Candidate Outputs Are Not Assets

Production may create:

```text
drafts
alternatives
renders
mixes
candidate images
prototype screens
research drafts
build artefacts
temporary exports
```

These do not become Project Graph Assets merely because they exist.

They remain production or execution artefacts until explicitly approved.

This avoids turning the Project Graph into an archive of every production attempt.

---

# 8. Asset Identity and Immutability

An approved Asset represents a specific approved content state.

Its content identity should be immutable.

When the output changes materially:

```text
new Asset
--supersedes-->
old Asset
```

Do not silently mutate the content behind an existing Asset record.

This preserves:

- auditability;
- approval history;
- Publication traceability;
- operational provenance;
- reproducibility.

An Asset may be marked withdrawn without erasing its history.

---

# 9. Asset Storage

The canonical Asset record and the Asset bytes are distinct concerns.

Repository-friendly content may live directly in the repository.

Large or externally managed artefacts may use a durable reference.

Conceptually:

```text
Asset record
→ content hash
→ repository path or external location
```

Examples include:

```text
Markdown
source code
small images
configuration
```

stored directly, while:

```text
large videos
audio masters
large design exports
build binaries
```

may use external storage.

The Asset record remains canonical Pactwright state.

The storage system does not become the Project Graph.

---

# 10. Asset Provenance

An Asset must remain traceable to the Delivery that produced it.

At minimum:

```text
Evidence
→ Asset
```

Additional provenance may include:

- contributing files;
- production outputs;
- selected candidate;
- relevant content hashes;
- tool or model metadata where needed;
- relevant Project Intelligence grounding.

Pactwright should record only provenance necessary for:

```text
traceability
reproducibility
approval
auditability
```

It should not recreate complete Production Skills execution history inside the Asset record.

---

# 11. Production Skills Boundary

Production Skills own how an output is made.

Examples:

```text
Narrative Skills
→ script

Music Skills
→ score/master

Video Skills
→ final episode

UI/UX Skills
→ approved prototype/design package

Deep Research Skills
→ research dossier
```

Assets / Publication does not interpret their internal workflows.

The boundary is:

```text
Production Skills
→ produce and evaluate work

Pactwright Delivery
→ verifies Contract fulfilment

Assets / Publication
→ records approved durable output
```

---

# 12. Multiple Assets from One Delivery

One Delivery may produce several Assets.

For example:

```text
children's TV episode Delivery
        ↓
Evidence
        ├── episode master
        ├── subtitle file
        ├── soundtrack master
        └── key artwork
```

Each may become its own Asset when independent identity, approval or Publication traceability is useful.

Do not force all outputs into one composite Asset when they have distinct lifecycle or Publication needs.

Likewise, avoid splitting one coherent output into many Assets without a real semantic need.

---

# 13. Publication

A Publication records the exposure of an approved Asset through a defined channel or surface.

Conceptually:

```yaml
id: publication-...
asset: asset-...
channel: ...
location: ...
published_at: ...
status: active | withdrawn | superseded
metadata: ...
```

Publication should answer:

```text
what Asset?
where?
when?
through which channel/surface?
under what publication identity?
```

It does not record whether the publication performed well.

That belongs to Operations.

---

# 14. Only Assets May Be Published

Canonical Pactwright Publication must originate from an approved Asset.

```text
candidate output
✗ Publication

Evidence
✗ direct Publication

approved Asset
✓ Publication
```

This preserves a clean authority chain:

```text
Contract
→ Delivery
→ Evidence
→ Asset approval
→ Asset
→ Publication
```

Publication must not become a shortcut around Asset approval.

---

# 15. Multiple Publications

One Asset may have several Publications.

Example:

```text
Asset: episode-trailer-v1
        ├── YouTube Publication
        ├── website Publication
        └── social Publication
```

These are distinct exposure events or surfaces referencing the same approved Asset.

If the underlying content changes materially, a new Asset should normally be created rather than mutating the old Asset while retaining its Publications.

---

# 16. Publication Withdrawal and Supersession

A Publication may be:

```text
active
withdrawn
superseded
```

Withdrawal means the Asset is no longer exposed through that Publication.

It does not erase:

- the Asset;
- the Publication record;
- historical Operations evidence.

A replacement Publication may reference:

```text
same Asset
```

when only the exposure changes, or:

```text
new superseding Asset
```

when the content itself changes.

---

# 17. Relationships

The Extension uses the shared typed-edge graph.

Core relationships include conceptually:

```text
Evidence ----produces------> Asset
Asset -------publishes-----> Publication
Asset -------supersedes----> Asset
Publication -supersedes----> Publication
```

Exact relation names should remain consistent with the shared Project Graph vocabulary.

Optional cross-graph relationships may include:

```text
Asset --grounded-in--> Knowledge
```

where Project Intelligence grounding matters.

Cross-graph edges connect canonical records without transferring ownership.

---

# 18. Project Intelligence Integration

Project Intelligence may provide grounding or guidance used during Delivery.

An approved Asset may retain references to relevant accepted Knowledge where useful.

Example:

```text
brand identity Knowledge
        ↓
Delivery
        ↓
Evidence
        ↓
Asset
```

If that Knowledge later changes, Project Intelligence propagation may identify affected Assets for reconsideration.

It must not silently mutate them.

The result may be:

```text
Knowledge change
→ affected Asset review
→ new Delivery if correction is required
→ new Asset
```

Asset history remains intact.

---

# 19. Graph Review Integration

Graph Review may inspect Assets and Publications.

Example:

```text
Asset
+ Publication
+ identity Knowledge
→ Graph Review
→ Finding
```

A Finding does not directly change an Asset or Publication.

It enters Project Intelligence through normal Source ingestion.

If corrective Delivery is justified, it follows the normal Contract lifecycle.

Graph Review therefore remains analysis, not Asset governance.

---

# 20. Operations Integration

When Operations is enabled, Publication may be registered as an operational exposure.

```text
Asset
→ Publication
→ Observation
```

Operations may then record:

- availability;
- engagement;
- errors;
- reach;
- conversion;
- user response;
- other real-world signals.

Assets / Publication does not own those outcomes.

The boundary is:

```text
Assets / Publication
→ what was exposed

Operations
→ what happened after exposure

Project Intelligence
→ what the project concludes from it
```

An Operations Observation must not mutate the Asset or Publication it observes.

---

# 21. Software Boundary

Not every software Delivery needs an Asset.

For normal software changes:

```text
Evidence
→ Deployment
```

may be sufficient when Operations is enabled.

Assets are useful where a distinct approved durable output has value beyond ordinary repository state.

Examples might include:

```text
release package
SDK distribution
downloadable binary
published specification
public documentation bundle
```

Do not force all software commits or builds into Asset semantics.

---

# 22. Research and Documentation

Research or documentation Delivery may produce Assets where the approved output itself is significant.

Example:

```text
research Contract
→ research Delivery
→ Evidence
→ approved dossier
→ Asset
→ public Publication
```

The research evidence supporting the conclusions remains owned by the relevant research process and Project Intelligence Sources.

The Asset represents the approved output, not every supporting Source.

---

# 23. Commands

The Extension should expose a small command surface.

Conceptually:

```text
pactwright asset approve <evidence-or-output>
pactwright asset supersede <asset-id>
pactwright asset withdraw <asset-id>

pactwright publication create <asset-id>
pactwright publication withdraw <publication-id>

pactwright assets-publication validate
```

Exact CLI ergonomics may evolve.

Commands must preserve ownership boundaries and authority rules.

---

# 24. Automation

Automation may assist with:

- content hashing;
- provenance capture;
- schema validation;
- Publication metadata capture;
- generated reporting;
- detecting missing or broken references.

Automation must not silently:

```text
approve Assets
publish unapproved Assets
rewrite approved content
delete historical provenance
reinterpret operational outcomes
```

unless repository policy explicitly delegates the relevant authority.

---

# 25. Repository Model

Conceptually:

```text
assets/
  ...

docs/assets-publication/
├── assets/
├── publications/
└── reports/
```

Large artefacts may be external.

Exact paths may evolve.

Canonical state consists of:

```text
Asset records
Publication records
typed relationships
```

Generated reports are derived views.

Asset bytes themselves may live inside or outside the repository depending on storage suitability.

---

# 26. Validation

Validation should ensure at least:

- every Asset references valid Delivery Evidence;
- every Asset has valid approval;
- Asset content identity is present and immutable;
- supersession relationships are valid;
- every Publication references an approved Asset;
- Publication identity and channel information are valid;
- withdrawn records remain historically traceable;
- cross-graph relationships preserve ownership;
- external Asset references retain content identity where possible;
- Operations exposure references valid Publications when used;
- generated reports do not become canonical state.

Core `pactwright validate` may invoke Extension validation when enabled.

---

# 27. Evaluation

Evaluation should focus on Assets / Publication semantics rather than production quality.

Useful cases include:

- rejecting an unapproved output as an Asset;
- preventing Publication of a non-Asset candidate;
- preserving immutable Asset identity;
- superseding rather than rewriting an approved Asset;
- maintaining Publication traceability;
- preserving provenance to Evidence;
- keeping Operations outcomes separate from Publication truth.

Production quality remains evaluated by:

```text
delivery-review
+ relevant Production Skills
```

before Evidence and Asset approval.

---

# 28. Core Invariants

1. Assets / Publication is optional and does not redefine Delivery semantics.
2. Core Delivery ends at Evidence.
3. An Asset is an explicitly approved durable output.
4. Delivery attempts and candidate outputs are not automatically Assets.
5. Every Asset is traceable to Delivery Evidence.
6. Asset content identity is immutable.
7. Material Asset changes create a new Asset linked through supersession.
8. Only an approved Asset may have a canonical Publication.
9. One Asset may have multiple Publications.
10. Publication records exposure, not performance.
11. Operations owns real-world outcomes after exposure.
12. Project Intelligence owns durable project meaning derived from later evidence.
13. Graph Review may inspect Assets and Publications but does not govern them.
14. Production Skills own how outputs are created.
15. Provider/model routing does not belong in this Extension.
16. Asset provenance records only what is necessary for traceability, reproducibility and audit.
17. Withdrawal preserves historical records.
18. Cross-extension relationships never transfer semantic ownership.

---

# 29. Anti-Overengineering Constraints

Do not introduce initially:

```text
generic digital asset management system
media library service
provider/model registry
generation task catalogue
creative production lifecycle
Asset version-control engine
publication scheduler platform
content management system
approval workflow engine
binary storage service
analytics subsystem
```

Use the smallest semantic model:

```text
Evidence
→ approval
→ Asset
→ Publication
```

and integrate with existing repository, storage and Operations systems rather than replacing them.

---

# 30. Current Implementation Baseline

The earlier combined Graph Review & Creative Delivery design already identified several useful durable output semantics:

- Assets are distinct from transient production candidates;
- human or authorised approval occurs before durable Asset creation;
- Assets are immutable and revisions use supersession;
- Publications reference approved Assets;
- Operations observes Publications without taking ownership of them.

The canonical redesign preserves those principles while removing unrelated concerns from the Extension:

```text
Creative Delivery
Review Definitions
generation-review
creative-verification
provider registry
task catalogue
generation guidance
```

Creative and other production now use normal Pactwright Delivery plus Production Skills.

Graph Review is a separate Extension.

Assets / Publication therefore becomes a small post-Delivery semantic layer rather than a production system.

---

# 31. Relationship to Other Canonical Specifications

```text
01 Core System and Lifecycle
→ owns Delivery through Evidence

02 Distribution, Agent Packs, Extensions and Evaluation
→ distributes this Extension

03 Project Intelligence
→ owns project-specific durable knowledge

04 Graph Review
→ may identify issues affecting Assets/Publications

05 Assets and Publication
→ owns approved outputs and exposure records

06 Operations
→ observes real-world exposure and outcomes

07 GitHub Integration
→ may project approval/publication automation

08 Open-Source Project Organisation
→ governs ecosystem and repository structure
```

---

# 32. Governing Rule

> **Assets / Publication begins after successful Pactwright Delivery. It records which outputs were explicitly approved as durable Assets and where those Assets were published. Production remains owned by Delivery, Agent Packs and Production Skills; real-world outcomes remain owned by Operations; durable lessons from those outcomes remain owned by Project Intelligence.**

---

**Pactwright Assets and Publication v1**