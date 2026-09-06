# Pactwright — Checkpoint 5 — Production Skills + Assets / Publication

**Version:** 10  
**Entry condition:** Checkpoint 4 is accepted.  
**Release:** `0.0.5`  
**Exit capability:** Pactwright and Kakeido can use specialised external Production Skills through the selected Agent Pack during normal Delivery, then turn successful Delivery Evidence into exact human-approved Assets and real Publications without introducing a second production lifecycle.

## 1. Goal

Prove two complementary boundaries:

```text
normal Delivery
→ selected Agent Pack
→ relevant Production Skills
→ Delivery Review
→ Evidence
```

and, only when the output deserves durable independent identity:

```text
Evidence
→ human approval of exact output
→ Asset
→ actual release
→ Publication
```

Checkpoint 5 must demonstrate specialised production and durable publication **without** recreating Creative Delivery, provider routing or generation-specific Pactwright semantics.

## 2. Canonical baseline

Canonical Pactwright semantics come from:

- [01 — Core System and Lifecycle](../specs/01-pactwright-core-system-and-lifecycle.md)
- [02 — Distribution, Agent Packs, Extensions and Evaluation](../specs/02-distribution-agent-packs-extensions-and-evaluation.md)
- [03 — Project Intelligence](../specs/03-project-intelligence.md)
- [04 — Graph Review](../specs/04-graph-review.md)
- [05 — Assets and Publication](../specs/05-assets-and-publication.md)
- [07 — GitHub Integration](../specs/07-github-integration.md)
- [08 — Open-Source Project Organisation](../specs/08-open-source-project-organisation.md)
- [Implementation Principles](./00-implementation-principles.md)
- [Implementation Guide](./00-implementation-guide.md)

Production-domain behaviour comes from the selected external Production Skills repositories and their own canonical skills/workflows/benchmarks.

Kakeido acceptance uses the current canonical Kakeido specifications in the Kakeido repository.

Research logs are rationale only.

This runbook defines implementation order, not new Pactwright semantics.

## 3. Execution contract

Every implementation action follows:

```text
Step
→ References
→ Run
→ Expected result
→ Verify before continuing
```

Default execution location is the Pactwright repository root unless a step names Kakeido, a Production Skills repository or a fixture.

For repository/code changes:

```bash
pnpm verify
```

Before invoking newly implemented repository-local commands:

```bash
pnpm build
```

After Checkpoint 2, coherent changes land through pull requests and required checks.

Dynamic ids consumed later must be printed or resolved by earlier steps.

## 4. Checkpoint scope

Checkpoint 5 implements and proves:

```text
Production Skills integration manifest support
multiple Production Skills contributing to one Pactwright capability
Production Extension Pack resolution/locking where selected
Pactwright integration-boundary validation for Production Skills
@pactwright/assets-publication
Asset schema / approval / immutability / grounding
Evidence --produces--> Asset
Asset --grounded-in--> Knowledge where applicable
Asset --supersedes--> Asset semantic support
Publication schema / exact Asset hash / release provenance
Publication --publishes--> Asset
pactwright assets approve-asset
pactwright assets record-publication
pactwright assets validate
Assets / Publication GitHub workflow/checks/views from Spec 07
real Pactwright Production Skills use
real Pactwright Asset + Publication
real Kakeido Production Skills use
real Kakeido Asset + Publication where appropriate
```

### Explicitly removed

Do not implement:

```text
Creative Delivery lifecycle
creative-delivery capability
creative-verification capability
Generation Records
Generation Guidance
generation-reviewer
provider registry
model router
task catalogue
generation budgets
@pactwright/review-creative
@pactwright/creative
pactwright creative ...
```

Delivery Review remains the verification point before Evidence. Production quality uses relevant Production Skills evaluation/benchmarks.

### Explicitly unresolved

Do not silently solve:

- exact command ergonomics for declaring `Asset --supersedes--> Asset`;
- exact idempotency identity for uncertain/retried `record-publication` operations;
- validation strategy for externally stored Asset bytes when unavailable, mutable or access-controlled;
- whether generic additional production provenance beyond Evidence/hash/grounding becomes necessary;
- canonical policy for selecting which Publications later enter Operations feedback.

## Stage 1 — Prove Production Skills integration

### Step 1 — Implement Production Skills integration manifest resolution

**References:** Spec 02 Production Skills integration manifest and resolution.

**Run**

```text
Implement support for optional external Production Skills `integrations/pactwright.yml` manifests.

Resolve only the canonical integration concerns:
- Production Skills identity/source;
- Pactwright compatibility;
- capability → skill bindings;
- Production Extension Pack discovery/selection where configured;
- exact revision/version and manifest identity for locking.

Do not allow the manifest to define:
- Pactwright agents;
- lifecycle shapes;
- Project Graph node types;
- Pactwright commands;
- provider routing;
- Project Intelligence rules;
- production-domain workflow semantics.
```

**Expected result**

Pactwright can consume Production Skills integration metadata without absorbing the Production Skills system.

**Verify before continuing**

Use fixture manifests for valid compatibility, invalid compatibility, missing skill, ambiguous skill identity and malformed Extension Pack references.

### Step 2 — Implement exact Production Skills locking and sync

**References:** Spec 02 locking/synchronisation.

**Run**

```text
Extend `.pactwright/lock.yml` and sync resolution to lock exact external Production Skills dependencies selected by the Agent Pack, including:
- source;
- exact revision/version;
- integration manifest hash/identity;
- referenced skills;
- selected Production Extension Packs.

Do not copy or reinterpret the Production Skills repository's own internal lock graph.

Changing a locked Production Skills revision must change `environment_lock_hash`.
```

**Expected result**

Production Skills become part of the exact Pactwright execution environment without becoming Pactwright-owned packages or semantics.

**Verify before continuing**

Resolve identical inputs twice; require identical lock/environment hash. Change one Production Skills revision and require the environment hash to change.

### Step 3 — Prove multiple Production Skills on one capability

**References:** Spec 02 multi-Production-Skills composition.

**Run**

```text
Create an Agent Pack fixture/configuration in which one Pactwright capability uses multiple Production Skills families.

Prove at least:

`delivery-execution`
→ two or more compatible Production Skills skill bindings

and/or

`delivery-review`
→ two or more compatible specialist evaluation skills.

The Agent Pack decides how to compose them. Pactwright resolves, validates, locks and exposes them through the adapter.

Do not create one Pactwright capability per production domain.
```

**Expected result**

One Delivery can use multiple specialised production domains without changing lifecycle or Project Graph semantics.

**Verify before continuing**

Run a fixture Delivery whose Brief genuinely needs two Production Skills families and prove both are available to the selected agent while the capability remains `delivery-execution` / `delivery-review`.

### Step 4 — Add Production Skills integration-boundary evaluation

**References:** Spec 02 evaluation/benchmark ownership.

**Run**

```text
Extend Pactwright evaluation only at the integration boundary:
- required Production Skills binding resolves;
- multiple skills can be supplied to one Pactwright responsibility;
- Contract/Brief lineage is preserved;
- forbidden Pactwright mutation does not occur;
- missing/ambiguous skill resolution fails closed.

Do not execute or duplicate entire external Production Skills benchmark suites as Pactwright evaluation.
Domain quality remains owned by those repositories.
```

**Expected result**

Pactwright can verify correct Production Skills integration without becoming a universal domain benchmark framework.

**Verify before continuing**

Run `pnpm pactwright eval` and inspect the new integration-boundary cases separately from Production Skills benchmark output.

## Stage 2 — Package Assets / Publication

### Step 5 — Create `@pactwright/assets-publication`

**References:** Specs 02 and 05 Extension boundaries.

**Run**

```text
Create `@pactwright/assets-publication` as a publishable first-party Pactwright Extension.

Its manifest/runtime owns:
- Asset canonical records;
- Publication canonical records;
- Evidence → Asset relation;
- Publication → Asset relation;
- Asset grounding relation where applicable;
- Asset supersession relation;
- `assets` command namespace;
- Assets / Publication GitHub profile.

Do not require Graph Review or Operations.
Do not require Project Intelligence merely for the Extension to be enabled or for ungrounded Assets to exist.
PI becomes a semantic prerequisite only when an Asset requires governed project grounding.
```

**Expected result**

Assets / Publication installs independently as a post-Delivery Extension with conditional grounding dependency rather than unconditional Extension dependency.

**Verify before continuing**

Test enablement with:
- PI disabled and no governed grounding requirement;
- PI enabled;
- Graph Review disabled;
- Operations disabled.

All structurally valid combinations remain valid.

## Stage 3 — Implement Asset semantics and approval

### Step 6 — Implement Asset schema and exact content identity

**References:** Spec 05 Asset identity/immutability/storage.

**Run**

```text
Implement Asset canonical state with at least:
- stable Asset identity;
- media_type;
- exact content_hash;
- storage_pointer;
- originating Delivery Evidence;
- applicable grounding ids/hashes;
- approved_by human identity;
- approved_at;
- sufficient generic audit provenance.

Do not include provider-specific Generation Records or Production Skills execution history in the canonical Asset schema.

Candidate outputs, drafts, renders, prototypes and temporary exports remain non-canonical until exact human approval.
```

**Expected result**

Asset identity means one exact approved durable output, independent of how it was produced.

**Verify before continuing**

Test valid Asset structure, missing Evidence, missing approver, missing hash, attempted content-hash mutation and candidate-output non-canonicality.

### Step 7 — Implement conditional grounding validation

**References:** Specs 03, 05 and 08 public grounding/readiness.

**Run**

```text
Implement the canonical conditional grounding rule:

no governed grounding requirement
→ PI not required for Asset approval

governed project facts / identity / voice / positioning / product claims / accepted project constraints
→ PI required
→ referenced Knowledge must be accepted and applicable
→ Asset records exact Knowledge ids + hashes

Required grounding may not be omitted to bypass PI.

Grounding changes after approval never silently rewrite the historical Asset.
```

**Expected result**

Neutral durable outputs can be approved without PI, while fact-bearing/project-grounded outputs fail closed when durable project truth is unavailable or mismatched.

**Verify before continuing**

Use fixtures for:
- ungrounded neutral Asset with PI disabled => allowed;
- governed-claim Asset with PI disabled => rejected;
- valid accepted Knowledge grounding => allowed;
- stale/mismatched grounding hash => rejected;
- challenged/superseded/retracted grounding before approval => rejected/re-ground required.

### Step 8 — Implement Asset relationships and supersession semantics

**References:** Spec 05 Evidence/Asset relationships and supersession.

**Run**

```text
Register and validate:

Evidence --produces--> Asset
Asset --grounded-in--> Knowledge        where applicable
Asset --supersedes--> Asset

A material revision creates a new Asset; the earlier Asset remains immutable historical truth.

Implement the graph/runtime semantic support needed for supersession, but do not invent a public standalone `assets supersede` command unless the owning canonical spec is first updated to establish that interface.
```

**Expected result**

Asset provenance and revision history are explicit without a withdrawal lifecycle.

**Verify before continuing**

Test valid Evidence production, multiple Assets from one Evidence, invalid endpoints, immutable superseded Asset and acyclic supersession.

### Step 9 — Implement `pactwright assets approve-asset`

**References:** Spec 05 commands/human approval.

**Run**

```text
Implement:

pactwright assets approve-asset <evidence-id>

The command prepares/validates the candidate Asset from successful Delivery Evidence, exact output content identity, required grounding and explicit human approval.

Human approval must apply to the exact content hash being recorded.
Automation may calculate and validate but cannot independently create the approval authority.

Print the created Asset id.
```

**Expected result**

Only an exact reviewed and human-approved durable output becomes an Asset.

**Verify before continuing**

Approve a repository-backed fixture output, then mutate its bytes and prove `assets validate` fails against the recorded hash.

### Step 10 — Handle external Asset verification conservatively

**References:** Spec 05 external storage implementation gap.

**Run**

```text
Support repository-backed content verification completely.

For external storage pointers:
- verify bytes/hash when the storage mechanism is actually accessible and deterministic;
- if current bytes cannot be verified, report the Asset as unverifiable according to validation semantics rather than treating the pointer itself as proof.

Do not introduce a new universal storage provider/replication system merely to close this checkpoint.
```

**Expected result**

Pactwright never equates an inaccessible pointer with verified content identity.

**Verify before continuing**

Test repository-backed success, externally accessible success and inaccessible external pointer handling. Keep the broader cross-provider verification mechanism explicitly open.

## Stage 4 — Implement Publication

### Step 11 — Implement Publication schema and canonical relationship

**References:** Spec 05 Publication semantics.

**Run**

```text
Implement Publication canonical state with at least:
- Publication identity;
- referenced approved Asset;
- exact asset_hash;
- channel;
- locator where applicable;
- published_by;
- published_at.

Register the canonical relationship:

Publication --publishes--> Asset

Publication records an actual release event, not scheduling intent and not performance.
```

**Expected result**

Publication records where/when/by whom an exact approved Asset was released.

**Verify before continuing**

Test valid Publication, unapproved Asset, mismatched asset hash, missing channel/provenance and reversed relation direction.

### Step 12 — Implement `pactwright assets record-publication`

**References:** Spec 05 command/failure semantics.

**Run**

```text
Implement:

pactwright assets record-publication <asset-id> <channel>

The command records canonical Publication only after the project/channel mechanism has actually released the approved Asset.
Capture actual release provenance and locator where available.

A failed publication attempt never mutates the Asset and never creates a valid Publication.

The canonical idempotency identity for uncertain/retried recording is unresolved. Implement the minimum safe retry protection required by the current channel integration without claiming a universal semantic identity; surface ambiguity rather than silently duplicating canonical Publications.
```

**Expected result**

Only actual release of the exact approved Asset becomes canonical Publication history.

**Verify before continuing**

Test successful recording, failed release, mismatched hash and an uncertain retry scenario that does not silently create duplicate canonical Publications.

### Step 13 — Implement `pactwright assets validate`

**References:** Spec 05 validation.

**Run**

```text
Implement Assets / Publication validation covering:
- valid Delivery Evidence provenance;
- human approval and exact Asset content hash;
- conditional grounding rules;
- Asset immutability;
- valid produces/grounded-in/supersedes relationships;
- approved Asset prerequisite for Publication;
- Publication.asset_hash == Asset.content_hash;
- Publication → Asset direction;
- actual release provenance;
- independence from Operations performance/availability;
- conservative handling of unverifiable external bytes.

Core `pactwright validate` invokes this when the Extension is enabled.
```

**Expected result**

Assets and Publications fail closed without acquiring production or Operations semantics.

**Verify before continuing**

Run one invalid fixture per major invariant and prove validation failure does not mutate canonical state.

## Stage 5 — GitHub integration and evaluation

### Step 14 — Implement Assets / Publication evaluation cases

**References:** Specs 02 and 05 evaluation.

**Run**

```text
Contribute Assets / Publication cases to `pactwright eval` for semantic-boundary failures:
- candidate output cannot become Asset without human approval;
- wrong content hash rejected;
- invalid/missing required grounding rejected;
- genuinely ungrounded Asset class allowed without forcing PI;
- direct Publication from Evidence/unapproved output rejected;
- Publication hash mismatch rejected;
- Asset immutability/supersession preserved;
- Publication → Asset direction enforced;
- Operations absence/failure does not invalidate Publication.

Do not evaluate domain production quality here.
```

**Expected result**

The post-Delivery durable-output boundary has repeatable Pactwright-level evaluation coverage.

**Verify before continuing**

Run `pnpm pactwright eval` and inspect Assets / Publication cases individually.

### Step 15 — Implement Assets / Publication GitHub profile/workflow

**References:** Spec 07 Assets / Publication integration; Implementation Guide GitHub Actions baseline.

**Run**

```text
Implement the Assets / Publication GitHub profile and generated:

.github/workflows/pactwright-assets-publication.yml

Implement the exact checks defined by Spec 07:
- Pactwright / Assets
- Pactwright / Publication

and the configured Asset/Publication projections/views owned by Spec 07.

GitHub may validate/project approval metadata already represented through Pactwright authority but must never convert GitHub approval metadata alone into an Asset.

Repository-backed Asset changes must trigger exact hash validation where relevant.
GitHub must not own Publication truth.
```

**Expected result**

GitHub exposes durable output/publication state while canonical authority remains in Pactwright.

**Verify before continuing**

Run local/remote sync dry-run fixtures including:
- candidate-only output absent from Asset projection;
- GitHub approval without canonical Asset => no Asset created;
- valid Asset/Publication projected correctly.

## Stage 6 — Adopt Production Skills and Assets / Publication in Pactwright

### Step 16 — Integrate real external Production Skills through the standard Agent Pack

**References:** Spec 02 Production Skills boundary; current Production Skills repositories selected for the proof.

**Run**

Choose at least two real Production Skills families already maintained independently and useful for a real Pactwright public-product Delivery. Prefer a cross-domain combination such as:

```text
deep-research-skills
+
ui-ux-design-skills or narrative-production-skills
```

or another combination genuinely required by the selected work.

Add/validate their `integrations/pactwright.yml` manifests where needed, then configure `@pactwright/standard` to import and bind them to existing `delivery-execution` / `delivery-review` responsibilities.

Do not change Pactwright core capabilities for the domains.
```

**Expected result**

Pactwright can use real independently maintained Production Skills through its existing Delivery responsibilities.

**Verify before continuing**

```bash
pnpm pactwright sync
pnpm pactwright doctor
pnpm pactwright validate
```

Inspect `.pactwright/lock.yml` and confirm exact external revisions/manifests/skills are locked and reflected in `environment_lock_hash`.

### Step 17 — Enable Assets / Publication in Pactwright

**References:** Specs 02, 05 and 07.

**Run**

```bash
pnpm build
pnpm pactwright extension add assets-publication
pnpm pactwright sync
pnpm pactwright assets validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
pnpm pactwright validate
```

**Expected result**

Pactwright has the post-Delivery Assets / Publication surface without enabling Operations.

**Verify before continuing**

A second local/remote sync converges and all validation passes.

### Step 18 — Verify public-content readiness for the selected Pactwright work

**References:** Specs 03, 05 and 08 readiness/grounding.

**Run**

```bash
pnpm pactwright intelligence onboard
pnpm pactwright intelligence validate
```

Determine the **actual** domain coverage required by the selected public work rather than forcing a fixed matrix.

For example:
- identity if voice/identity matters;
- content for editorial/educational material;
- product for capability/value/behaviour claims;
- go-to-market for acquisition/CTA/positioning work;
- delivery/ux for workflow/UX claims;
- delivery/eng for technical implementation claims;
- other subject domains where factual claims depend on them.

If required coverage is missing, use the existing PI gap → Delivery/research → ingest → triage/promotion path before proceeding.
```

**Expected result**

The selected public Delivery is grounded in current accepted project truth and does not use Asset grounding as a substitute for missing PI readiness.

**Verify before continuing**

Inspect the exact accepted Knowledge relied on by the Brief/Delivery and ensure claims are traceable.

### Step 19 — Deliver one real cross-domain Pactwright public output

**References:** Specs 01–05 and selected Production Skills.

**Run**

Use normal Pactwright Delivery for one real public output whose production genuinely benefits from the selected Production Skills.

The Delivery must preserve:

```text
Intent
→ Decision
→ Contract
→ Brief
→ specialised Production Skills execution
→ Delivery Review using relevant skills
→ Evidence
```

Candidate/draft outputs remain execution artefacts.

Where practical, follow the Production Skills principle:

```text
cheap adequate representation
→ evaluate
→ select / approve where necessary
→ higher fidelity
→ evaluate
→ targeted correction
```

without turning that pattern into Pactwright lifecycle semantics.
```

**Expected result**

Specialised cross-domain production succeeds through normal Delivery and finishes at valid Evidence.

**Verify before continuing**

Run relevant Production Skills benchmarks/evaluations according to their owning repositories plus `pnpm pactwright validate`. Confirm no production-domain Pactwright nodes/capabilities were introduced.

### Step 20 — Approve and publish the Pactwright Asset

**References:** Spec 05 Asset/Publication authority.

**Run**

After a human inspects the exact successful Delivery output:

```bash
pnpm pactwright assets approve-asset <evidence-id>
```

Use the project's real publication/release mechanism to release the approved Asset. Then:

```bash
pnpm pactwright assets record-publication <asset-id> <channel>
pnpm pactwright assets validate
```

**Expected result**

Pactwright records a real Evidence → approved Asset → Publication lineage for the exact output.

**Verify before continuing**

Confirm:
- Asset content hash matches exact approved bytes;
- required grounding ids/hashes are valid;
- Publication asset hash matches;
- Publication records actual release provenance;
- no candidate output appears as canonical Asset.

## Stage 7 — Publish the Production Skills + Assets / Publication learning path

### Step 21 — Deliver public guide/example/Academy material

**References:** Spec 08 Production Skills + Assets / Publication milestone.

**Run**

Through normal Pactwright Delivery with relevant Production Skills, publish/update:

```text
Production Skills integration guide
one multi-Production-Skills Delivery example
Assets / Publication guide
Academy production lesson
README/website capability summary
```

The material must make clear:

```text
Production Skills
→ how specialised work is produced/reviewed

Delivery
→ Contract fulfilment and Evidence

Assets / Publication
→ exact approved durable output and release record
```

Do not describe a Creative Delivery lifecycle.
```

**Expected result**

Users can understand how specialised production and durable publication compose without conflating their ownership.

**Verify before continuing**

Run Graph Review over the new public material, triage all Findings through PI, and resolve blocking inconsistencies through normal Delivery.

## Stage 8 — Release `0.0.5`

### Step 22 — Publish the `0.0.5` family

**References:** Implementation Guide npm release model.

**Run**

Prepare the release from accepted Checkpoint 5 Evidence.

The new first-party package is:

```text
@pactwright/assets-publication@0.0.5
```

Existing compatible first-party packages also release as `0.0.5`:

```text
pactwright
@pactwright/standard
@pactwright/project-intelligence
@pactwright/graph-review
```

Production Skills remain external and are locked to their own exact revisions/versions; they are not republished as Pactwright packages.

Use the Implementation Guide release PR/tag flow. Bootstrap only the new Assets / Publication package's first npm publication/trusted publisher.
```

**Expected result**

The complete compatible `0.0.5` Pactwright family is available under `next` with provenance.

**Verify before continuing**

```bash
pnpm view pactwright@0.0.5 version
pnpm view @pactwright/standard@0.0.5 version
pnpm view @pactwright/project-intelligence@0.0.5 version
pnpm view @pactwright/graph-review@0.0.5 version
pnpm view @pactwright/assets-publication@0.0.5 version
```

Every command returns `0.0.5`.

## Stage 9 — Prove specialised production and publication in Kakeido

### Step 23 — Upgrade Kakeido to the published `0.0.5` family

**References:** Spec 02 upgrades; current Kakeido specs.

**Run**

```bash
pnpm add -D \
  pactwright@0.0.5 \
  @pactwright/standard@0.0.5 \
  @pactwright/project-intelligence@0.0.5 \
  @pactwright/graph-review@0.0.5 \
  @pactwright/assets-publication@0.0.5

pnpm pactwright upgrade --to 0.0.5
pnpm pactwright agent-pack upgrade
pnpm pactwright extension upgrade project-intelligence
pnpm pactwright extension upgrade graph-review
pnpm pactwright extension add assets-publication
pnpm pactwright sync
pnpm pactwright assets validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
pnpm pactwright validate
```

**Expected result**

Kakeido consumes the exact compatible Pactwright `0.0.5` family.

**Verify before continuing**

All validation passes and remote desired state converges.

### Step 24 — Resolve Production Skills appropriate to one real Kakeido outcome

**References:** current Kakeido owner specs; Spec 02 Production Skills.

**Run**

Select one real Kakeido Delivery whose constraints make specialist Production Skills useful. Examples may include:

```text
product/UX + software implementation
research + product content
narrative/content + UI/UX
```

Choose only Production Skills families genuinely required by the owning Kakeido specs.

Configure the selected Agent Pack imports/bindings, sync and lock exact revisions.
```

**Expected result**

Kakeido uses the same generic Production Skills integration model for a materially different product/domain.

**Verify before continuing**

Doctor/validation pass; lock shows exact Production Skills identities without copying their internal semantics into Pactwright.

### Step 25 — Deliver the Kakeido outcome through normal Delivery

**References:** current Kakeido canonical specs; Specs 01–03.

**Run**

Use normal Contract-driven Delivery with the selected Production Skills and the current Kakeido governing specifications.

Review must preserve Kakeido-specific invariants such as deterministic financial authority, product/UX constraints, assistant uncertainty/authority boundaries, technical/security/privacy constraints and any other rules applicable to the selected outcome.
```

**Expected result**

A real Kakeido cross-domain Delivery completes at valid Evidence without production-domain Pactwright semantics.

**Verify before continuing**

Run Kakeido repository-defined tests plus relevant Production Skills benchmark/evaluation and Pactwright validation.

### Step 26 — Create a Kakeido Asset/Publication where the output warrants durable identity

**References:** Spec 05; current Kakeido product/public-surface specs.

**Run**

If the selected Evidence contains an output that genuinely warrants durable independent Asset identity, human-approve the exact output:

```bash
pnpm pactwright assets approve-asset <evidence-id>
```

Publish it through Kakeido's existing real channel mechanism, then:

```bash
pnpm pactwright assets record-publication <asset-id> <channel>
pnpm pactwright assets validate
```

If the selected Delivery is ordinary software repository state for which Asset semantics add no independent value, select a separate bounded Kakeido public/durable output for this acceptance step rather than turning every build/commit into an Asset.
```

**Expected result**

Kakeido proves Assets / Publication on an output where the abstraction is semantically useful, not mechanically mandatory.

**Verify before continuing**

Inspect exact hash, approval, grounding where applicable, channel/locator and Publication relationship direction.

## Stage 10 — Capture Checkpoint 5 feedback

### Step 27 — Route implementation and production findings through PI

**References:** Implementation Principles feedback/evaluation ownership.

**Run**

Capture material findings from:
- external Production Skills integration;
- multi-skill composition;
- environment locking;
- Asset approval/hash/grounding;
- external-byte verification;
- publication recording/retry behaviour;
- GitHub projection;
- Pactwright and Kakeido usage.

Route Pactwright responsibility failures through PI Source/triage/promotion/candidate governance.

Route production-domain technique/quality failures to the owning Production Skills repository/benchmark rather than converting them into Pactwright semantics.

Do not automatically create Intents.
```

**Expected result**

Learning is routed to the correct owner and the checkpoint does not become a dumping ground for domain-specific workflow semantics.

**Verify before continuing**

Every blocking Pactwright failure is resolved or explicitly governed before Checkpoint 6. Production Skills failures are traceable to their owning family.

## Exit gate

Checkpoint 5 closes only when:

- external Production Skills integration manifests resolve and lock exactly;
- changing a Production Skills revision changes `environment_lock_hash`;
- one Pactwright capability can use multiple Production Skills without creating domain-specific Pactwright capabilities;
- Production-domain quality remains owned by Production Skills benchmarks;
- `@pactwright/assets-publication` exists as an independent post-Delivery Extension;
- Assets / Publication does not require Graph Review or Operations;
- PI is required only when an Asset has governed project-grounding requirements;
- candidate outputs remain non-canonical until exact human approval;
- every Asset references valid Evidence and exact content identity;
- Asset grounding uses accepted Knowledge ids/hashes where required;
- Asset content identity is immutable and supersession preserves history;
- exact supersession command ergonomics remain open rather than invented;
- Publications reference approved Assets and exact matching hashes through `Publication --publishes--> Asset`;
- publication recording does not silently duplicate uncertain retries despite unresolved universal idempotency identity;
- external Asset bytes are never treated as verified merely because a pointer exists;
- `pactwright assets approve-asset`, `record-publication` and `validate` work;
- `pactwright-assets-publication.yml`, `Pactwright / Assets` and `Pactwright / Publication` integrate through Spec 07 without moving authority into GitHub;
- Pactwright completes a real specialised cross-domain Delivery and records a real Asset/Publication;
- Kakeido proves the same architecture on a materially different outcome;
- no Creative Delivery, provider registry, Generation Guidance or creative Agent Pack has been recreated;
- the `0.0.5` first-party package family is registry verified;
- no known blocking failure is carried into Checkpoint 6.

---

**Pactwright — Checkpoint 5 — Production Skills + Assets / Publication v10**
