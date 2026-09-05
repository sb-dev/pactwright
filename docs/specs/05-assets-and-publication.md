# Pactwright Assets and Publication

## 1. Purpose

Assets / Publication is an optional Pactwright Extension for recording approved durable outputs and where they are published.

Its core flow is:

```text
Evidence
→ human approval
→ Asset
→ Publication
```

It answers:

```text
Asset
→ What exact output was approved as a durable project artefact?

Publication
→ Where, when and by whom was that approved Asset released?
```

The Extension is production-domain neutral and does not define how outputs are created.

---

## 2. Scope and Ownership

Assets / Publication owns:

```text
Asset
Publication
Asset approval
Asset content identity
Asset provenance
Asset supersession
Publication traceability
Evidence → Asset relationships
Publication → Asset relationships
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

Production remains owned by Delivery, Agent Packs and Production Skills.

Verification remains part of core Delivery and ends at Evidence.

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

It does not require Operations.

Project Intelligence is not required for the basic existence of Asset or Publication records, but applicable grounding must still satisfy the grounding rules in this specification.

When Operations is enabled, Publication may be registered as an operational exposure.

```text
Assets / Publication
→ owns what was approved and published

Operations
→ owns what happened after exposure

Project Intelligence
→ owns durable project meaning derived from later evidence
```

---

# 4. Post-Delivery Boundary

Core Delivery ends at Evidence:

```text
Intent
→ Decision
→ Contract
→ Brief
→ Delivery
→ Review
→ Evidence
```

An Asset is not another Delivery stage.

```text
Evidence
→ human approval
→ Asset
```

Evidence means the governing Contract and Brief were delivered and verified.

Asset means the exact output was separately approved as a durable project artefact.

Publication means that approved Asset was released through a defined channel or surface.

These are distinct claims.

---

# 5. Candidate Outputs Are Not Assets

Drafts, alternatives, renders, mixes, candidate images, prototypes, research drafts, build artefacts and temporary exports do not become Project Graph Assets merely because they exist.

They remain production or execution artefacts until the exact output is approved.

Successful Delivery Evidence also does not automatically create an Asset.

---

# 6. Asset

An Asset is an approved durable project output.

Minimum structure:

```yaml
id: asset-...
type: asset
title: ...
created: ...

media_type: ...
content_hash: ...
storage_pointer: ...

delivery_evidence: evidence-...

grounding:
  - id: ...
    hash: ...

approved_by: human:...
approved_at: ...
```

Additional production provenance may be referenced where necessary for traceability or reproducibility, but this Extension does not define provider-specific Generation Records or copy Production Skills execution history into the Asset model.

An Asset must establish:

- stable identity;
- exact content identity;
- valid originating Delivery Evidence;
- human approval of that exact content;
- storage or retrieval location;
- applicable grounding;
- sufficient provenance for auditability.

---

# 7. Human Asset Approval

Human approval is required before an output becomes a canonical Asset.

```text
Evidence
→ human approval of exact content hash
→ Asset
```

Every Asset records:

```text
approved_by: human:...
approved_at: ...
```

Automation may prepare hashes, provenance and validation, but must not independently convert a candidate output into an Asset.

Asset approval is a post-Delivery authority check. It does not change the governing Contract and is not a Delivery Graph Decision.

---

# 8. Asset Identity, Immutability and Supersession

An Asset identifies one exact approved content state.

`content_hash` identifies that state and must never be silently changed.

A material revision creates a new Asset:

```text
new Asset
--supersedes-->
old Asset
```

The previous Asset remains historical canonical truth.

The source design establishes Asset supersession. It does **not** establish a separate Asset withdrawal lifecycle, so no withdrawal state or command is defined here.

---

# 9. Asset Storage and Content Verification

The canonical Asset record and Asset bytes are separate concerns.

```text
Asset record
→ content_hash
→ repository path or external storage pointer
```

Repository-suitable files may live directly in Git. Large or externally managed binaries may use durable external storage.

Validation must establish that:

```text
recorded Asset content_hash
=
hash of the stored or referenced approved output
```

External storage does not become canonical Project Graph state.

The exact mechanism for validating externally stored bytes when a storage target is unavailable, mutable or access-controlled remains an explicit implementation gap. Pactwright must not treat an unverifiable pointer as proof that the recorded hash still matches.

---

# 10. Asset Grounding

When an Asset asserts project facts, its grounding must identify the canonical project records and exact content states supporting those assertions.

Conceptually:

```yaml
grounding:
  - id: knowledge-product-positioning
    hash: ...
  - id: knowledge-brand-voice
    hash: ...
```

Validation must ensure every declared grounding id exists and every grounding hash matches the referenced canonical state.

Applicable grounding may be represented through:

```text
Asset --grounded-in--> Project Intelligence record
```

Later challenge, supersession or retraction of grounding may identify the Asset for reconsideration but must not silently mutate it.

The redesign allows Assets / Publication to exist without Project Intelligence, while the earlier grounding contract assumes canonical fact grounding is available. The policy for approving fact-bearing Assets when Project Intelligence is disabled remains unresolved. The invariant is that required grounding must not simply be omitted to bypass validation.

---

# 11. Evidence and Asset Relationships

The canonical Delivery relationship is:

```text
Evidence --produces--> Asset
```

One Delivery Evidence record may produce multiple Assets where those outputs have useful independent identity, approval or Publication traceability.

Do not force several independently meaningful outputs into one Asset, and do not split one coherent output without semantic need.

---

# 12. Production Skills Boundary

Production Skills own how an output is made and evaluated within Delivery.

```text
Production Skills
→ production expertise and workflows

Pactwright Delivery
→ Contract fulfilment and Evidence

Assets / Publication
→ exact approved durable output and exposure record
```

Assets / Publication must not interpret Production Skill internals or introduce a second creative/production lifecycle.

---

# 13. Publication

A Publication records that an approved Asset was released to an external or project-facing surface.

Minimum structure:

```yaml
id: publication-...
type: publication
title: ...
created: ...

asset: asset-...
asset_hash: ...
channel: ...
locator: null | ...
published_by: human:... | automation:...
published_at: ...
```

The Publication records the **approved Asset hash at the time of publication**.

Validation must ensure:

```text
Publication.asset_hash
=
referenced Asset.content_hash
```

Publication records exposure, not performance.

---

# 14. Publication Relationship Direction

The shared typed-edge relationship is:

```text
Publication --publishes--> Asset
```

This direction is canonical and must not be reversed.

Together with Asset provenance:

```text
Evidence ----produces-----> Asset
Publication -publishes----> Asset
Asset -------grounded-in--> Knowledge      where applicable
Asset -------supersedes---> Asset
```

Cross-graph relationships do not transfer semantic ownership.

---

# 15. Only Approved Assets May Be Published

Publication cannot bypass Asset approval.

```text
candidate output
✗ Publication

Evidence
✗ direct Publication

approved Asset
✓ Publication
```

A Publication must reference an existing approved Asset and its exact approved content hash.

---

# 16. Multiple Publications and Corrections

One Asset may have multiple Publications representing distinct release events or surfaces.

```text
Asset
├── Publication A
├── Publication B
└── Publication C
```

If content changes materially:

```text
new content
→ new Asset
→ Asset supersedes old Asset
→ new Publication when released
```

The original design does **not** establish Publication-to-Publication supersession or a Publication withdrawal lifecycle. Those semantics and related commands are therefore not defined here.

A Publication records that release occurred. A scheduling intent or pending release is not itself a Publication.

Scheduled publication of an already approved Asset may be automated, but the canonical Publication records the actual release and its `published_by` / `published_at` provenance.

---

# 17. Project Intelligence Integration

Project Intelligence may provide grounding used by Delivery and retained on an approved Asset.

If grounding Knowledge later changes:

```text
Knowledge change
→ affected Asset identified
→ review / Delivery candidate where justified
→ new Delivery
→ new Asset if corrected
```

Project Intelligence must not silently alter existing Asset history.

---

# 18. Graph Review Integration

Graph Review may inspect Assets and Publications.

```text
Asset + Publication + wider Project Graph
→ Graph Review
→ Finding
→ Project Intelligence
```

A Finding does not directly alter an Asset or Publication.

Any corrective work follows normal Project Intelligence and Delivery governance.

---

# 19. Operations Integration

When Operations is enabled, Publication may be an operational exposure.

```text
Publication
→ Operations Observation
```

Operations must reference the existing Publication. It must not copy, replace or reinterpret Publication as Operations-owned canonical state.

The following safeguards are mandatory:

- a failed Publication attempt never changes the approved Asset;
- Publication remains valid if Operations processing later fails;
- Publication remains valid when Operations is disabled or absent;
- a failed Operations Observation does not alter Publication or Asset state;
- poor real-world performance does not make a valid Publication invalid;
- operational performance becomes project meaning only through Operations → Project Intelligence governance.

Publication validity concerns whether the correct approved Asset was actually recorded as released, not whether that release succeeded commercially or operationally.

---

# 20. Software Boundary

Not every software Delivery needs an Asset.

Ordinary software repository state and Deployment may already provide the appropriate durable and operational semantics.

Asset semantics are useful only when a distinct approved output has independent value, such as a distributable package, SDK, binary, published specification or documentation bundle.

Do not turn every commit or build into an Asset.

---

# 21. Research and Documentation Boundary

Research or documentation Delivery may produce an Asset when the approved output itself is a durable project artefact.

```text
research Delivery
→ Evidence
→ human approval
→ Asset
→ Publication where released
```

The Asset represents the approved output, not all supporting research Sources.

---

# 22. Commands

The separated Extension preserves the operations established by the earlier combined design under an Assets / Publication namespace:

```text
pactwright assets approve-asset <evidence-id>
pactwright assets record-publication <asset-id> <channel>
pactwright assets validate
```

`approve-asset` creates an Asset only after validating the referenced Evidence, exact output hash, required grounding and human approval.

`record-publication` records an actual release of the exact approved Asset hash and captures `channel`, `locator`, `published_by` and `published_at` as applicable.

`assets validate` validates the Extension's canonical state and relationships.

No `withdraw`, Publication-supersession or standalone Asset-supersede command is defined by the source contract. Asset supersession remains a graph semantic applied when a revised approved Asset replaces an earlier one; exact command ergonomics for declaring that relationship remain unresolved.

---

# 23. Automation

Automation may assist with:

- exact content hashing;
- provenance capture;
- grounding validation;
- schema validation;
- Publication metadata capture;
- scheduled release of an already approved Asset;
- detecting broken references.

Automation must not:

```text
approve an Asset without the required human approval
publish an unapproved Asset
rewrite approved Asset content
rewrite historical Publication records to hide previous releases
reinterpret operational outcomes as Publication validity
```

---

# 24. Repository Model

Conceptually:

```text
assets/
  ...

docs/assets-publication/
├── assets/
└── publications/
```

Exact paths may evolve.

Canonical Extension state consists of:

```text
Asset records
Publication records
typed relationships
```

Asset bytes may live inside or outside the repository depending on storage suitability.

Assets / Publication does **not** own a generated reports subsystem. The earlier sourced generated report belonged to Graph Review, not this separated Extension.

---

# 25. Failure and Idempotency

Failure rules are:

- invalid Evidence, content hash, grounding or approval prevents Asset creation;
- failed Asset creation must not leave a partial canonical Asset;
- a failed Publication attempt must not modify the approved Asset;
- a failed Publication record must not become a valid operational exposure;
- Operations failure does not invalidate an otherwise valid Publication;
- downstream performance failure does not alter Asset approval or Publication history.

The exact idempotency identity for repeated `record-publication` calls is not defined by the earlier source and remains unresolved. Implementations must not silently create duplicate canonical Publications when retrying an uncertain publication-recording operation.

---

# 26. Validation

`pactwright assets validate` must enforce at least:

1. every Asset references valid Delivery Evidence;
2. every Asset records a valid human approver and approval time;
3. every Asset has a `content_hash`;
4. every Asset content hash exactly matches the stored or referenced approved output when that output is verifiable;
5. every declared grounding id/hash pair resolves to the referenced canonical state;
6. Assets that assert project facts satisfy the applicable grounding requirement;
7. Asset content identity is immutable after creation;
8. Asset `supersedes` relationships have valid Asset endpoints;
9. every Publication references an approved Asset;
10. every Publication records `asset_hash`, `channel`, `published_by` and `published_at`;
11. every Publication `asset_hash` exactly equals the referenced Asset `content_hash`;
12. every `produces`, `grounded-in`, `publishes` and `supersedes` edge uses valid endpoints and the canonical direction;
13. `publishes` is `Publication → Asset`;
14. Operations exposure references an existing Publication rather than copied Publication state;
15. Asset / Publication validation does not depend on operational performance.

Core `pactwright validate` may invoke this validation when the Extension is enabled.

---

# 27. Evaluation

Assets / Publication evaluation tests its semantic boundary rather than production quality.

Useful cases include:

- rejecting candidate output without human Asset approval;
- rejecting Asset creation when stored content does not match `content_hash`;
- rejecting invalid grounding id/hash pairs;
- preventing direct Publication from Evidence or unapproved output;
- rejecting a Publication whose `asset_hash` differs from the approved Asset hash;
- preserving Asset immutability and Asset supersession history;
- enforcing `Publication --publishes--> Asset` direction;
- preserving Publication validity when Operations is absent or fails;
- keeping real-world performance separate from Publication validity.

Production quality remains evaluated before Evidence through Delivery Review and relevant Production Skills.

---

# 28. Core Invariants

1. Assets / Publication is optional and does not redefine Delivery semantics.
2. Core Delivery ends at Evidence.
3. An Asset is an exact durable output created only after human approval.
4. Candidate outputs and Delivery attempts are not Assets.
5. Every Asset is traceable to valid Delivery Evidence.
6. Asset content hash identifies the exact approved output and is immutable.
7. Material Asset changes create a new Asset linked through `supersedes`.
8. Applicable project-fact grounding is recorded and hash-validated.
9. Only an approved Asset may have a canonical Publication.
10. Publication snapshots the approved `asset_hash` and records who published it and when.
11. The canonical publication edge is `Publication --publishes--> Asset`.
12. One Asset may have multiple Publications.
13. Corrections use a new Asset and a new Publication when released.
14. Publication withdrawal and Publication-to-Publication supersession are not established semantics.
15. Publication records exposure, not performance.
16. Operations owns real-world outcomes after exposure and must reference the existing Publication.
17. Operations failure or absence does not invalidate Publication.
18. Project Intelligence owns durable meaning derived from later evidence.
19. Graph Review may inspect Assets and Publications but does not govern them.
20. Production Skills own how outputs are created.
21. Assets / Publication does not own provider/model routing, production workflow or generated reports.
22. Cross-extension relationships never transfer semantic ownership.

---

# 29. Anti-Overengineering Constraints and Open Gaps

Do not introduce initially:

```text
generic digital asset management system
media library service
provider/model registry
generation task catalogue
creative production lifecycle
Asset version-control engine
Publication withdrawal lifecycle
Publication-to-Publication supersession
publication scheduler platform
content management system
approval workflow engine
binary storage service
analytics subsystem
Extension-owned generated reports
```

Use:

```text
Evidence
→ human approval
→ Asset
→ Publication
```

The following gaps remain explicit rather than being invented here:

- how Pactwright proves the hash of externally stored Asset bytes when storage is unavailable, mutable or access-controlled;
- how fact-bearing Asset grounding should behave when Project Intelligence is disabled;
- the exact CLI operation for attaching `Asset --supersedes--> Asset` during approval of a revision;
- the idempotency identity used to distinguish an intentional second Publication from a retry of the same publication-recording operation;
- whether additional generic production provenance beyond Delivery Evidence, content hash and grounding becomes necessary after the old Generation Record machinery has been removed.

---

# 30. Current Implementation Baseline

The earlier Graph Review & Creative Delivery research established the surviving durable-output contracts:

- Assets are distinct from transient candidates;
- human approval creates the durable Asset;
- Asset content identity is immutable;
- revised Assets use `supersedes`;
- `Evidence --produces--> Asset`;
- applicable grounding uses exact id/hash references;
- Publications reference approved Assets and snapshot `asset_hash`;
- Publications record channel, locator, publisher and publication time;
- `Publication --publishes--> Asset`;
- failed Publication does not change the Asset;
- Operations references Publications without copying or replacing them;
- Operations failure, absence or poor performance does not invalidate Publication.

The redesign removes the unrelated machinery previously bundled with these semantics:

```text
Creative Delivery
Graph Review
Review Definitions
creative-verification
generation-review
provider registry
task catalogue
generation guidance
```

Production now uses normal Pactwright Delivery plus Production Skills.

Graph Review is a separate Extension.

Assets / Publication is therefore a small post-Delivery semantic layer rather than a production system.

---

# 31. Relationship to Other Canonical Specifications

```text
01 Core System and Lifecycle
→ owns Delivery through Evidence

02 Distribution, Agent Packs, Extensions and Evaluation
→ distributes this Extension

03 Project Intelligence
→ owns project-specific durable knowledge and applicable grounding

04 Graph Review
→ may identify issues affecting Assets / Publications

05 Assets and Publication
→ owns approved exact outputs and Publication records

06 Operations
→ observes real-world exposure and outcomes

07 GitHub Integration
→ may automate validation and publication integration

08 Open-Source Project Organisation
→ governs ecosystem and repository structure
```

---

# 32. Governing Rule

> **Assets / Publication begins after successful Pactwright Delivery. A human approves an exact content hash to create an immutable Asset. A Publication records that exact approved Asset hash being released through a channel and points to the Asset through `Publication --publishes--> Asset`. Production remains owned by Delivery and Production Skills; real-world outcomes remain owned by Operations; durable lessons from those outcomes remain owned by Project Intelligence.**

---

**Pactwright Assets and Publication v1**