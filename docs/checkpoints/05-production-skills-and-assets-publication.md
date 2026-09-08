# Pactwright — Checkpoint 5 — Production Skills + Assets / Publication

**Version:** 11  
**Entry condition:** Checkpoint 4 is accepted.  
**Release:** `0.0.5`  
**Exit capability:** Pactwright and Kakeido can resolve exact external Production Skills and Production Extension Packs through the selected Agent Pack during normal Delivery, then turn successful Delivery Evidence into exact human-approved Assets and real Publications without introducing a second production lifecycle.

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

Checkpoint 5 consumes the capability, Agent Pack, Extension, locking, replay, Project Intelligence and GitHub composition machinery established by Checkpoints 1–4. It must not introduce Production Skills or Assets / Publication-specific alternatives to those mechanisms.

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

Default execution location is Pactwright unless a step names Kakeido, a Production Skills repository or a fixture.

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
Production Skills resolved-environment validation and doctor diagnostics
multiple Production Skills contributing to one Pactwright capability
Production Extension Pack selection/resolution/locking
Production Skills / Extension Pack regression attribution
Pactwright integration-boundary validation for Production Skills
@pactwright/assets-publication
exact Asset / Publication canonical schemas
Asset approval atomicity / immutability / grounding
Evidence --produces--> Asset
Asset --grounded-in--> Knowledge where applicable
Asset --supersedes--> Asset semantic support
Publication exact Asset hash / release provenance
Publication --publishes--> Asset
multiple Publications and correction history
complete Spec 05 validation matrix
pactwright assets approve-asset
pactwright assets record-publication
pactwright assets validate
Assets / Publication GitHub workflow/checks/views through the shared integration
first grounded approved Pactwright public Asset + Publication
real Pactwright Production Skills use
real Kakeibo Production Skills use
real Kakeibo Asset + Publication where appropriate
real 0.0.4 → 0.0.5 ownership-specific upgrade/install path
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

Production Skills remain composed **through the selected Agent Pack**. Do not introduce peer-level project `production_skills` configuration beside Agent Pack / Extensions / Adapter / Lifecycle / GitHub configuration.

### Explicitly unresolved

Do not silently solve:

- exact command ergonomics for declaring `Asset --supersedes--> Asset`;
- exact idempotency identity for uncertain/retried `record-publication` operations;
- validation strategy for externally stored Asset bytes when unavailable, mutable or access-controlled;
- whether generic additional production provenance beyond Evidence/hash/grounding becomes necessary;
- canonical policy for selecting which Publications later enter Operations feedback.

## Stage 1 — Prove Production Skills integration

### Step 1 — Implement Production Skills integration manifest resolution and complete environment validation

**References:** Spec 02 Production Skills integration manifest, validation and resolution.

**Run**

```text
Implement support for optional external Production Skills `integrations/pactwright.yml` manifests.

Resolve only the canonical integration concerns:
- Production Skills identity/source;
- Pactwright compatibility;
- capability → skill bindings;
- Production Extension Pack discovery/selection where configured;
- exact revision/version and manifest identity for locking.

Before accepting the resolved environment, validate:
- integration manifest syntax;
- Pactwright compatibility;
- referenced skill existence;
- selected Production Extension Pack existence in the owning family;
- deterministic skill identity;
- source/revision availability;
- adapter representability;
- ambiguity across imported skill identities;
- complete runtime / Extension / Agent Pack compatibility;
- package-manager lock ↔ `.pactwright/lock.yml` consistency where both identify package-backed components;
- deterministic environment-lock derivation.

If two imported families expose an ambiguous skill identity, fail resolution rather than silently selecting one.

Do not allow a Production Skills integration manifest to define:
- Pactwright agents or prompts;
- lifecycle shapes;
- Project Graph node/edge types;
- Pactwright commands;
- provider routing;
- Project Intelligence rules;
- production-domain workflow semantics.
```

**Expected result**

Pactwright can consume Production Skills integration metadata and fail closed on an invalid complete environment without absorbing the Production Skills system.

**Verify before continuing**

Use fixtures for valid compatibility, invalid compatibility, missing source/revision, missing skill, ambiguous skill identity, adapter-unrepresentable skill, malformed manifest and invalid Extension Pack references. Every failed resolution preserves the previous valid configuration, lock and generated environment.

### Step 2 — Implement exact Production Skills / Extension Pack locking and deterministic sync

**References:** Spec 02 locking, Production Extension Pack and synchronisation rules.

**Run**

```text
Extend `.pactwright/lock.yml` and sync resolution to lock exact external Production Skills dependencies selected by the Agent Pack, including:
- source;
- exact revision/version;
- integration manifest hash/identity;
- referenced skills;
- selected Production Extension Packs.

Prove the Production Extension Pack boundary with at least one selected pack from an owning Production Skills family:
- Pactwright owns selection, resolution, locking and availability;
- the Production Skills family owns pack meaning, rules, validation, evaluation and behavioural effect;
- a Production Extension Pack never appears as a Pactwright Extension.

Do not copy or reinterpret the Production Skills repository's own internal lock graph.

Changing any of these must change `environment_lock_hash`:
- Production Skills revision/version;
- integration manifest identity when effective resolution changes;
- selected Production Extension Pack.

`pactwright sync` must materialise the resolved skills/packs into the active adapter without writing into external Production Skills repositories.
```

**Expected result**

Production Skills and selected Production Extension Packs become exact parts of the Pactwright execution environment without becoming Pactwright-owned packages or semantics.

**Verify before continuing**

Prove:
- identical locked inputs produce identical lock, environment hash and generated adapter output;
- changing one Production Skills revision changes the hash;
- changing one selected Production Extension Pack changes the hash;
- nonexistent/wrong-family packs fail closed;
- external Production Skills repository hashes remain unchanged before/after `pactwright sync`;
- repeated sync converges.

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
Do not expose Production Skills as a peer-level project configuration surface.
```

**Expected result**

One Delivery can use multiple specialised production domains without changing lifecycle or Project Graph semantics.

**Verify before continuing**

Run a fixture Delivery whose Brief genuinely needs two Production Skills families and prove both are available to one selected agent while the capability remains `delivery-execution` / `delivery-review`.

### Step 4 — Diagnose, evaluate and baseline the Production Skills integration boundary

**References:** Spec 02 doctor, evaluation, benchmark ownership and baseline reporting.

**Run**

```text
Extend `pactwright doctor` to diagnose the new resolved-environment failures read-only, including:
- missing/unresolvable Production Skills source or revision;
- missing referenced skill;
- invalid/missing Production Extension Pack;
- package/Pactwright lock drift;
- adapter inability to represent the resolved skill;
- validation failures affecting the resolved environment.

Where remediation is deterministic, report the appropriate command without running it.

Extend Pactwright evaluation only at the integration boundary:
- required Production Skills binding resolves;
- multiple skills can be supplied to one Pactwright responsibility;
- Contract/Brief lineage is preserved;
- forbidden Pactwright mutation does not occur;
- missing/ambiguous skill resolution fails closed.

Do not execute or duplicate entire external Production Skills benchmark suites as Pactwright evaluation.
Domain quality remains owned by those repositories.

Use the existing baseline interface to prove regression attribution for:
- a changed Production Skills revision;
- a changed Production Extension Pack selection.

Reports must identify the affected capability/case and the relevant Production Skills / Production Extension Pack change rather than relying on one opaque aggregate score.
```

**Expected result**

Pactwright can diagnose, validate and regress its Production Skills integration boundary without becoming a universal domain benchmark framework.

**Verify before continuing**

Run:

```bash
pnpm pactwright doctor
pnpm pactwright eval
```

and baseline/candidate fixture comparisons. Confirm doctor is read-only and regression output attributes the changed Production Skills / Extension Pack dimension.

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

Do not require a new Agent Pack capability: approval, hashing, validation and recording are deterministic Extension responsibilities under the current spec.

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

All structurally valid combinations remain valid and no new production-domain capability is required.

## Stage 3 — Implement Asset semantics and approval

### Step 6 — Implement the exact Asset schema and content identity

**References:** Spec 05 Asset identity/immutability/storage.

**Run**

```text
Implement Asset canonical state with at least the canonical minimum fields:
- id;
- type: asset;
- title;
- created;
- media_type;
- exact content_hash;
- storage_pointer;
- delivery_evidence;
- grounding id/hash pairs where applicable;
- approved_by human identity;
- approved_at;
- sufficient generic audit provenance.

Do not include provider-specific Generation Records or copy Production Skills execution history into the canonical Asset schema.

Candidate outputs, drafts, renders, mixes, prototypes, build artefacts, research drafts and temporary exports remain non-canonical until exact human approval.
Successful Delivery Evidence does not automatically create an Asset.
```

**Expected result**

Asset identity means one exact approved durable output, independent of how it was produced.

**Verify before continuing**

Test valid Asset structure, missing title/created/Evidence/approver/hash/storage identity, attempted content-hash mutation and candidate-output non-canonicality.

### Step 7 — Implement conditional grounding and post-approval reconsideration

**References:** Specs 03, 05 and 08 grounding/readiness.

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

Before approval, challenged/superseded/retracted or mismatched grounding requires re-grounding/re-evaluation.

After approval, later Knowledge challenge/supersession/retraction:
- never rewrites the historical Asset or its recorded grounding hashes;
- identifies the affected Asset through existing graph relationships;
- flows through normal PI propagation/review/candidate governance where correction is justified;
- requires normal new Delivery and a new Asset if corrected content is produced.
```

**Expected result**

Neutral durable outputs can be approved without PI, while governed outputs fail closed and historical grounded Assets remain immutable when project knowledge changes.

**Verify before continuing**

Use fixtures for:
- ungrounded neutral Asset with PI disabled => allowed;
- governed-claim Asset with PI disabled => rejected;
- valid accepted Knowledge grounding => allowed;
- mismatched grounding hash => rejected;
- challenged/superseded/retracted grounding before approval => re-ground required;
- approved grounded Asset followed by Knowledge challenge/supersession/retraction => Asset unchanged, affected Asset surfaced through normal PI propagation/reconsideration.

### Step 8 — Implement Asset relationships and supersession semantics

**References:** Spec 05 Evidence/Asset relationships and supersession.

**Run**

```text
Register and validate:

Evidence --produces--> Asset
Asset --grounded-in--> Knowledge        where applicable
Asset --supersedes--> Asset

One Evidence may produce multiple Assets when those outputs have useful independent identity.

A material revision creates a new Asset; the earlier Asset remains immutable historical truth.

Implement graph/runtime semantic support for supersession, but do not invent:
- a public standalone `assets supersede` command;
- Asset withdrawal state/command;
- Publication supersession semantics.
```

**Expected result**

Asset provenance and correction history are explicit without a withdrawal lifecycle.

**Verify before continuing**

Test valid Evidence production, multiple Assets from one Evidence, invalid endpoints/directions, immutable superseded Asset, acyclic supersession and rejection/absence of invented withdrawal semantics.

### Step 9 — Implement atomic `pactwright assets approve-asset`

**References:** Spec 05 commands/human approval/failure semantics.

**Run**

```text
Implement:

pactwright assets approve-asset <evidence-id>

The command prepares and validates the candidate Asset from successful Delivery Evidence, exact output content identity, required grounding and explicit human approval.

Human approval must apply to the exact content hash being recorded.
Automation may calculate and validate but cannot independently create approval authority.

Asset creation is atomic:
- invalid Evidence/content identity/grounding/approval => no canonical Asset;
- no partial `produces` / `grounded-in` relationships remain after failure.

Print the created Asset id only after successful canonical creation.
```

**Expected result**

Only an exact reviewed and human-approved durable output becomes an Asset, and failed approval leaves no partial canonical state.

**Verify before continuing**

Approve a repository-backed fixture output, mutate its bytes and prove `assets validate` fails against the recorded hash. Separately induce invalid grounding and invalid Evidence during approval and prove no partial Asset or relationship is created.

### Step 10 — Handle external Asset verification conservatively

**References:** Spec 05 external storage implementation gap.

**Run**

```text
Support repository-backed content verification completely.

For external storage pointers:
- verify bytes/hash when the storage mechanism is actually accessible and deterministic;
- if current bytes cannot be verified, report the Asset as unverifiable according to validation semantics rather than treating the pointer itself as proof.

Do not introduce a universal storage provider, replication layer, DAM or binary archive merely to close this checkpoint.
```

**Expected result**

Pactwright never equates an inaccessible pointer with verified content identity.

**Verify before continuing**

Test repository-backed success, externally accessible success and inaccessible/mutable/access-controlled external pointer handling. Keep the broader cross-provider verification mechanism explicitly open.

## Stage 4 — Implement Publication

### Step 11 — Implement the exact Publication schema and canonical relationship

**References:** Spec 05 Publication semantics.

**Run**

```text
Implement Publication canonical state with at least the canonical minimum fields:
- id;
- type: publication;
- title;
- created;
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

Publication records where/when/by whom an exact approved Asset was actually released.

**Verify before continuing**

Test valid Publication, unapproved Asset, mismatched asset hash, missing title/created/channel/publication provenance and reversed relation direction.

### Step 12 — Implement safe `record-publication`, multiple releases and correction history

**References:** Spec 05 command/failure/idempotency/multiple-Publication semantics.

**Run**

```text
Implement:

pactwright assets record-publication <asset-id> <channel>

The command records canonical Publication only after the project/channel mechanism has actually released the approved Asset.
Capture actual release provenance and locator where available.

A failed publication attempt:
- never mutates the Asset;
- never creates a valid Publication;
- never becomes a valid Operations exposure.

One approved Asset may have multiple Publications when they represent intentional distinct release events/surfaces.

A material content correction follows:

new content
→ new Asset
→ new Asset supersedes old Asset
→ new Publication when released

Do not introduce Publication-to-Publication supersession or Publication withdrawal semantics.

The canonical idempotency identity for uncertain/retried recording remains unresolved. Implement minimum safe retry protection for the current channel integration and surface ambiguity rather than silently treating an uncertain retry as either a new intentional Publication or a duplicate.
```

**Expected result**

Only actual release of exact approved Assets becomes Publication history, while intentional multiple releases and corrections remain distinguishable from uncertain retries.

**Verify before continuing**

Test:
- successful recording;
- failed release;
- mismatched hash;
- two intentional Publications of one Asset;
- uncertain retry does not silently create a duplicate;
- corrected content uses a new superseding Asset + new Publication;
- no Publication withdrawal or Publication→Publication supersession appears.

### Step 13 — Implement the complete `pactwright assets validate` contract

**References:** Spec 05 validation.

**Run**

Implement `pactwright assets validate` to enforce all canonical minimum rules:

```text
1. every Asset references valid Delivery Evidence;
2. every Asset records a valid human approver and approval time;
3. every Asset has a content_hash;
4. every Asset content hash exactly matches the stored/referenced approved output when verifiable;
5. every declared grounding id/hash pair resolves to accepted applicable PI Knowledge and exact referenced canonical state;
6. Assets asserting governed project claims require PI and valid accepted grounding before approval;
7. Assets without governed grounding requirements may remain valid without PI;
8. Asset content identity is immutable after creation;
9. Asset supersedes relationships have valid Asset endpoints;
10. every Publication references an approved Asset;
11. every Publication records asset_hash, channel, published_by and published_at;
12. every Publication asset_hash exactly equals the referenced Asset content_hash;
13. every produces, grounded-in, publishes and supersedes edge uses valid endpoints and canonical direction;
14. publishes is Publication → Asset;
15. where an Operations exposure fixture/integration is present, it references an existing Publication rather than copied Publication state;
16. Asset / Publication validity does not depend on operational performance.
```

Core `pactwright validate` invokes Assets / Publication validation when the Extension is enabled and does not reinterpret Extension semantics itself.

Validation is read-only. Unverifiable external bytes must never be reported as verified merely because a pointer exists.

**Expected result**

The complete Assets / Publication canonical contract is machine-enforced without acquiring Production Skills or Operations semantics.

**Verify before continuing**

Maintain positive fixtures plus at least one failing fixture for every numbered rule or tightly coupled rule group. Use a future-Operations fixture for rule 15 rather than implementing Operations early. Run both `pactwright assets validate` and core `pactwright validate`; deliberate invalidity must fail without mutation.

## Stage 5 — GitHub integration and evaluation

### Step 14 — Implement Assets / Publication evaluation cases

**References:** Specs 02 and 05 evaluation.

**Run**

```text
Contribute Assets / Publication cases to `pactwright eval` for semantic-boundary failures:
- candidate output cannot become Asset without exact human approval;
- failed Asset approval leaves no partial canonical state;
- wrong content hash rejected;
- invalid/missing required grounding rejected;
- genuinely ungrounded Asset allowed without forcing PI;
- post-approval grounding change preserves historical Asset and routes reconsideration normally;
- direct Publication from Evidence/unapproved output rejected;
- Publication hash mismatch rejected;
- Asset immutability/supersession preserved;
- multiple intentional Publications allowed;
- uncertain retry does not silently duplicate;
- Publication → Asset direction enforced;
- Publication withdrawal / Publication supersession are not invented;
- Operations absence/failure/performance does not invalidate Publication.

Do not evaluate domain production quality here.
```

**Expected result**

The post-Delivery durable-output boundary has repeatable Pactwright-level evaluation coverage.

**Verify before continuing**

Run `pnpm pactwright eval` and inspect Assets / Publication cases individually.

### Step 15 — Implement Assets / Publication GitHub profile/workflow through the shared integration

**References:** Spec 07 Assets / Publication integration; Implementation Guide GitHub Actions baseline.

**Run**

```text
Contribute the Assets / Publication profile to the generic GitHub composition/reconciliation engine established in Checkpoint 2.

Generate:

.github/workflows/pactwright-assets-publication.yml

Relevant managed/validated paths include:
- assets/**
- docs/assets-publication/assets/**
- docs/assets-publication/publications/**

Implement the exact checks:
- Pactwright / Assets
- Pactwright / Publication

The shared Project may add the configured views:
- Assets
- Publications

Asset projection may include:
- title;
- media type;
- Delivery lineage;
- grounding state;
- approved by;
- current/superseded;
- Publication count.

Publication projection may include:
- Asset;
- channel;
- locator;
- published by;
- published at;
- linked operational Observations only when Operations later exists.

Candidate outputs never appear as canonical Assets.
Changes under `assets/**` validate affected approved Asset hashes.
GitHub never owns Publication truth.

Generic GitHub approval metadata alone cannot create an Asset.
If repository policy maps a trusted authority event to `pactwright assets approve-asset`, the runtime must still verify exact human authority, Evidence, content hash and required grounding.

If scheduled/event-triggered release is supported, it may invoke `record-publication` only for an already approved Asset; failed release leaves the Asset unchanged.

Disabling Assets / Publication removes only generated local/remote state exclusively owned by this profile. Preserve canonical Asset/Publication records and Core/PI/Graph Review surfaces.
```

**Expected result**

Assets / Publication composes into the existing one-repository/one-shared-Project GitHub integration without moving authority into GitHub.

**Verify before continuing**

Run local/remote sync and dry-run fixtures proving:
- Core + PI + Graph Review + Assets / Publication still uses one shared Project;
- candidate-only output absent from Asset projection;
- generic GitHub approval without canonical authority creates no Asset;
- valid Asset/Publication projects exact fields;
- repository-backed byte drift fails the Assets check;
- disabling Assets / Publication removes only its managed workflow/views and preserves canonical records/other profiles;
- second dry-run converges.

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

Add/validate their `integrations/pactwright.yml` manifests where needed, then update `@pactwright/standard` as the owning Agent Pack to import/bind them to existing `delivery-execution` / `delivery-review` responsibilities.

Where one selected family exposes a Production Extension Pack genuinely useful to the proof, select it through the Agent Pack and lock it. Do not select a pack merely for ceremony; the Stage 1 fixture already proves the general pack mechanism.

Do not add peer-level project Production Skills configuration and do not change Pactwright core capabilities for the domains.
```

**Expected result**

Pactwright can use real independently maintained Production Skills through its existing Delivery responsibilities.

**Verify before continuing**

```bash
pnpm pactwright sync
pnpm pactwright doctor
pnpm pactwright validate
```

Inspect `.pactwright/lock.yml` and confirm exact external revisions/manifests/skills/packs are locked as applicable and reflected in `environment_lock_hash`. Confirm external Production Skills repositories remain untouched.

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

A second local/remote sync converges, the same shared Project is retained and all validation passes.

### Step 18 — Enforce the existing public-content readiness gate for the selected Pactwright work

**References:** Specs 03, 05 and 08 readiness/grounding.

**Run**

```bash
pnpm pactwright intelligence onboard
pnpm pactwright intelligence validate
```

Determine the actual domains the selected public work depends on and enforce the existing Spec 08 gate:

```text
identity
→ Covered where identity/voice/values matter

content
→ Covered for editorial/educational/marketing work

product
→ Covered for Pactwright capability/value/behaviour/limitation claims

go-to-market
→ Covered for acquisition/positioning/CTA/campaign work

delivery/ux
→ Covered for user-facing workflow/UX claims

delivery/eng
→ Covered for technical implementation claims

other applicable subject domain
→ Covered where factual claims depend on it
```

Every relied-on claim/constraint must also be accepted, in-horizon Knowledge with traceable Sources.

If required coverage is missing, use the existing PI gap → Delivery/research → ingest → triage/promotion path before proceeding.

Asset grounding is not a substitute for public-content readiness.
```

**Expected result**

Every applicable domain is Covered and the selected public Delivery is grounded in current accepted project truth.

**Verify before continuing**

Inspect domain-map/onboarding, assert Covered for every applicable domain and trace the exact accepted Knowledge/Sources relied on by the Brief/Delivery. Missing applicable coverage blocks public approval.

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

Run relevant Production Skills benchmarks/evaluations according to their owning repositories plus `pnpm pactwright validate`. Confirm no production-domain Pactwright nodes/capabilities were introduced and Contract/Brief authority was not weakened by lower-layer skills.

### Step 20 — Approve the first grounded Pactwright public Asset and record its Publication

**References:** Specs 05 and 08 Asset/Publication authority and public milestone.

**Run**

Use the real public output from Step 19 so Checkpoint 5 proves the Spec 08 milestone's first **grounded approved public Asset**.

After a human inspects the exact successful Delivery output:

```bash
pnpm pactwright assets approve-asset <evidence-id>
```

The Asset must record the exact accepted PI Knowledge ids/hashes required by the public claims/identity/constraints used by this output.

Use Pactwright's real project publication/release mechanism to release the approved Asset. Then:

```bash
pnpm pactwright assets record-publication <asset-id> <channel>
pnpm pactwright assets validate
```

**Expected result**

Pactwright records a real Evidence → grounded human-approved Asset → Publication lineage for the exact public output.

**Verify before continuing**

Confirm:
- Asset content hash matches exact approved bytes;
- required grounding ids/hashes match accepted Knowledge used by the public Delivery;
- Publication asset hash matches;
- Publication records actual release provenance;
- no candidate output appears as canonical Asset;
- changing grounding later would not mutate the historical Asset.

## Stage 7 — Publish the Production Skills + Assets / Publication learning path

### Step 21 — Deliver public guide/example/Academy material

**References:** Spec 08 Production Skills + Assets / Publication milestone.

**Run**

Through normal Pactwright Delivery with relevant Production Skills, publish/update:

```text
Production Skills integration guide
one executable multi-Production-Skills Delivery example
Assets / Publication guide/example
Academy production lesson
README/website capability summary
```

The multi-production and Assets / Publication examples may share one end-to-end scenario where that keeps the material simpler, but both boundaries must be executable and covered in CI where practical.

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

Run executable examples, then Graph Review over the new public material; triage all Findings through PI and resolve blocking inconsistencies through normal Delivery.

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

## Stage 9 — Prove specialised production and publication in Kakeibo

### Step 23 — Upgrade Kakeibo from accepted `0.0.4` through ownership-specific paths

**References:** Spec 02 upgrades; current Kakeibo specs.

**Run**

Start from the accepted Checkpoint 4 Kakeibo environment. Do **not** preinstall `0.0.5` packages manually before exercising Pactwright upgrade/install commands.

```bash
pnpm pactwright upgrade --to 0.0.5
pnpm pactwright agent-pack upgrade
pnpm pactwright extension upgrade project-intelligence
pnpm pactwright extension upgrade graph-review
pnpm pactwright extension add @pactwright/assets-publication@0.0.5
pnpm pactwright assets validate
pnpm pactwright sync
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
pnpm pactwright validate
```

Ownership remains explicit:
- `pactwright upgrade` orchestrates runtime package replacement through the project package manager and re-enters through the new runtime;
- `agent-pack upgrade` upgrades the selected Agent Pack within its configured compatibility constraints;
- `extension upgrade` upgrades existing PI/Graph Review Extensions;
- `extension add` installs/registers/locks the new Assets / Publication package.

Do not use runtime upgrade as shorthand for Agent Pack or Extension upgrades.
```

**Expected result**

Kakeibo moves from the real published `0.0.4` environment to the exact compatible `0.0.5` family without bypassing Pactwright's ownership-specific upgrade/install mechanisms.

**Verify before continuing**

Verify package-manager state and `.pactwright/lock.yml` agree on the `0.0.5` runtime, standard Agent Pack and enabled first-party Extensions; target migration/validation completed through the new runtime; remote desired state converges; unrelated user state is preserved.

### Step 24 — Resolve Production Skills appropriate to one real Kakeibo outcome through the selected Agent Pack

**References:** current Kakeibo owner specs; Spec 02 Production Skills.

**Run**

Select one real Kakeibo Delivery whose constraints make specialist Production Skills useful. Examples may include:

```text
product/UX + software implementation
research + product content
narrative/content + UI/UX
```

Choose only Production Skills families genuinely required by the owning Kakeibo specs.

Production Skills must remain owned by the selected Agent Pack:
- use the Production Skills imports/bindings already supplied by the published selected pack; or
- explicitly select another compatible Agent Pack with `pactwright agent-pack use <source>` if a different pack is required.

Do not add a Kakeibo peer-level Production Skills configuration mechanism.

Run sync so the exact Production Skills revisions and any genuinely selected Production Extension Packs are resolved/locked through the Agent Pack.
```

**Expected result**

Kakeibo uses the same generic Agent Pack → Production Skills integration model for a materially different product/domain.

**Verify before continuing**

Run doctor/validation; lock shows exact Production Skills identities/packs without copying their internal semantics into Pactwright, and project configuration still treats Agent Pack—not Production Skills—as the project-level AI composition surface.

### Step 25 — Deliver the Kakeibo outcome through normal Delivery

**References:** current Kakeibo canonical specs; Specs 01–03.

**Run**

Use normal Contract-driven Delivery with the selected Production Skills and current Kakeibo governing specifications.

Review must preserve Kakeibo-specific invariants such as deterministic financial authority, product/UX constraints, assistant uncertainty/authority boundaries, technical/security/privacy constraints and any other rules applicable to the selected outcome.
```

**Expected result**

A real Kakeibo cross-domain Delivery completes at valid Evidence without production-domain Pactwright semantics.

**Verify before continuing**

Run Kakeibo repository-defined tests plus relevant Production Skills benchmark/evaluation and Pactwright validation.

### Step 26 — Create a Kakeibo Asset/Publication where the output warrants durable identity

**References:** Spec 05; current Kakeibo product/public-surface specs.

**Run**

If the selected Evidence contains an output that genuinely warrants durable independent Asset identity, human-approve the exact output:

```bash
pnpm pactwright assets approve-asset <evidence-id>
```

Publish it through Kakeibo's existing real channel mechanism, then:

```bash
pnpm pactwright assets record-publication <asset-id> <channel>
pnpm pactwright assets validate
```

If the selected Delivery is ordinary software repository state for which Asset semantics add no independent value, select a separate bounded Kakeibo public/durable output for this acceptance step rather than turning every build/commit into an Asset.
```

**Expected result**

Kakeibo proves Assets / Publication on an output where the abstraction is semantically useful, not mechanically mandatory.

**Verify before continuing**

Inspect exact hash, approval, grounding where applicable, channel/locator and Publication relationship direction. Confirm no direct Evidence→Publication shortcut and no candidate output became an Asset.

## Stage 10 — Capture Checkpoint 5 feedback

### Step 27 — Route implementation and production findings through PI

**References:** Implementation Principles feedback/evaluation ownership.

**Run**

Capture material findings from:
- external Production Skills integration;
- Production Extension Pack resolution;
- multi-skill composition;
- environment locking/doctor/regression attribution;
- Asset approval/hash/grounding;
- external-byte verification;
- publication recording/retry/multiple-release behaviour;
- GitHub projection/composition;
- Pactwright and Kakeibo usage.

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

- external Production Skills manifests resolve through the selected Agent Pack and the complete resolved environment fails closed on incompatibility/ambiguity/unavailable revisions;
- Production Skills and selected Production Extension Packs lock exact source/revision/manifest/skill/pack identity;
- changing a Production Skills revision or selected Production Extension Pack changes `environment_lock_hash`;
- repeated sync is deterministic and never rewrites external Production Skills repositories;
- one Pactwright capability can use multiple Production Skills without domain-specific Pactwright capabilities or peer-level project Production Skills configuration;
- `pactwright doctor` diagnoses Production Skills resolution/lock/adapter failures read-only;
- baseline regression reporting attributes Production Skills / Production Extension Pack changes at meaningful capability/case dimensions;
- Production-domain quality remains owned by Production Skills benchmarks;
- `@pactwright/assets-publication` exists as an independent post-Delivery Extension requiring no new production AI capability;
- Assets / Publication does not require Graph Review or Operations;
- PI is required only when an Asset has governed project-grounding requirements;
- Asset and Publication canonical records implement their exact Spec 05 minimum fields;
- candidate outputs and successful Evidence remain non-canonical until exact human Asset approval;
- failed Asset approval creates no partial Asset or relationships;
- every Asset references valid Evidence and exact content identity;
- Asset grounding uses accepted applicable Knowledge ids/hashes where required;
- post-approval grounding change never mutates Asset history and flows through normal PI reconsideration;
- Asset content identity is immutable and supersession preserves history;
- exact supersession command ergonomics remain open rather than invented;
- multiple intentional Publications of one Asset are supported;
- corrected content uses a new Asset and new Publication rather than historical mutation;
- Publication withdrawal and Publication-to-Publication supersession are not invented;
- Publications reference approved Assets and exact matching hashes through `Publication --publishes--> Asset`;
- publication recording does not silently duplicate uncertain retries despite unresolved universal idempotency identity;
- external Asset bytes are never treated as verified merely because a pointer exists;
- the complete 16-rule Assets / Publication validation contract passes and core validation delegates when enabled;
- `pactwright assets approve-asset`, `record-publication` and `validate` work;
- `pactwright-assets-publication.yml`, `Pactwright / Assets`, `Pactwright / Publication`, relevant paths and Assets/Publications views compose into the existing shared GitHub integration;
- GitHub approval/release automation cannot bypass exact Asset authority/hash/grounding or Publication semantics;
- disabling Assets / Publication removes only owned generated integration and preserves canonical records plus Core/PI/Graph Review surfaces;
- Pactwright's public work passes the existing PI Covered-domain readiness gate and produces the first grounded approved public Asset plus real Publication;
- Pactwright completes a real specialised cross-domain Delivery using external Production Skills;
- Kakeibo upgrades from real `0.0.4` to `0.0.5` through ownership-specific commands and proves the same architecture on a materially different outcome;
- no Creative Delivery, provider registry, Generation Guidance or creative Agent Pack has been recreated;
- the `0.0.5` first-party package family is registry verified;
- no known blocking failure is carried into Checkpoint 6.

---

**Pactwright — Checkpoint 5 — Production Skills + Assets / Publication v11**