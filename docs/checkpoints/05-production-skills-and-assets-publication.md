# Pactwright — Checkpoint 5 — Production Skills + Assets / Publication

**Version:** 12  
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

Evidence is canonical Delivery Graph state after successful closure. Human Asset approval is a separate post-Delivery authority operation: it does not make Evidence canonical or change its meaning.

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

Kakeido acceptance uses the current canonical Kakeido specifications in its existing repository. Kakeido denotes the same longitudinal acceptance project as Checkpoints 1–4 and the Implementation Guide; this checkpoint does not rename the project or change its repository identity.

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

After Checkpoint 2, coherent changes land through pull requests and required checks. New generated workflows use its shared workflow-availability preflight before corresponding required checks are enabled.

Dynamic ids consumed later must be printed or resolved by earlier steps.

Release and consumer upgrades follow [Checkpoint 2 — Exact-version upgrade acceptance](./02-remote-delivery.md#exact-version-upgrade-acceptance): explicit desired component constraints, compatible intermediate environments, owning commands and package/lock verification after each operation.

## 4. Checkpoint scope

Checkpoint 5 implements and proves:

```text
Production Skills integration manifest support
Production Skills resolved-environment validation and doctor diagnostics
multiple Production Skills contributing to one Pactwright capability
Production Extension Pack selection/resolution/locking
Production Skills / Extension Pack regression attribution
locked local/Actions environment equality with external dependencies
historical Graph Review replay with exact external skills/packs
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
acceptance for each supported optional authority/release automation path
first grounded approved Pactwright public Asset + Publication
real Pactwright Production Skills use
real Pactwright Asset + Publication
real Kakeido Production Skills use
real Kakeido Asset + Publication where appropriate
exact real 0.0.4 → 0.0.5 ownership-specific upgrade/install path
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

Assets / Publication does not own a generated reports subsystem. Do not add a DAM, CMS, scheduler platform or provider/storage framework to satisfy this checkpoint.

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
- complete runtime / Extension / Agent Pack compatibility and required capability set;
- package-manager lock ↔ `.pactwright/lock.yml` consistency where both identify package-backed components;
- deterministic environment-lock derivation.

If two imported families expose an ambiguous skill identity, fail resolution rather than silently selecting one.

Do not allow a Production Skills integration manifest to define:
- Pactwright agents or prompts;
- lifecycle shapes;
- Project Graph node/edge types;
- Pactwright commands or Extension semantics;
- provider routing;
- Project Intelligence rules;
- production-domain workflow semantics.
```

**Expected result**

Pactwright consumes Production Skills integration metadata and fails closed on an invalid complete environment without absorbing the Production Skills system.

**Verify before continuing**

Use fixtures for valid/invalid compatibility, missing source/revision, missing skill, ambiguous identity, missing required capability, adapter-unrepresentable skill, malformed manifest and invalid Extension Pack references. Every failed resolution preserves the previous valid configuration, lock and generated environment.

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

Prove at least one selected Production Extension Pack from its owning family:
- Pactwright owns selection, resolution, locking and availability;
- the family owns pack meaning, rules, validation, evaluation and behavioural effect;
- a Production Extension Pack never appears as a Pactwright Extension.

Use a real pack where suitable, otherwise a clearly labelled representative pack in an isolated owning-family fixture. Fixture proof is not evidence of real production use.
Do not copy or reinterpret the Production Skills repository's own internal lock graph.

Changing a resolved Production Skills revision/version, recorded integration identity or selected Production Extension Pack must change `environment_lock_hash` when the exact resolved environment changes.

`pactwright sync` materialises resolved skills/packs into the adapter without writing into external repositories.
Pinned reconstruction must resolve the recorded skills/packs, not newer compatible replacements. Preserve existing replay failure semantics rather than adding a new archive service.
```

**Expected result**

External skills and selected packs become exact parts of the Pactwright execution environment without becoming Pactwright-owned production semantics.

**Verify before continuing**

Prove:
- identical locked inputs produce identical lock, environment hash and generated output;
- changing one Production Skills revision changes the hash;
- changing one selected Production Extension Pack changes the hash;
- nonexistent/wrong-family packs fail closed;
- external repository hashes remain unchanged before/after sync;
- repeated sync converges;
- an unavailable historical skill or pack cannot resolve to a newer substitute merely because that substitute is accessible.

Repeat environment equality and full Graph Review replay conformance with real external imports in Step 16.

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

One Delivery uses multiple specialised production domains without changing lifecycle or Project Graph semantics.

**Verify before continuing**

Run a fixture Delivery whose Brief genuinely needs two families and prove both are available to one selected agent while the capability remains `delivery-execution` / `delivery-review`.

### Step 4 — Diagnose, evaluate and baseline the Production Skills integration boundary

**References:** Spec 02 doctor, evaluation, benchmark ownership and baseline reporting.

**Run**

```text
Extend `pactwright doctor` to diagnose the new resolved-environment failures read-only:
- missing/unresolvable Production Skills source or revision;
- missing referenced skill;
- invalid/missing Production Extension Pack;
- package/Pactwright lock drift;
- adapter inability to represent the resolved skill;
- validation failures affecting the resolved environment.

Where remediation is deterministic, report the appropriate command without running it.

Extend Pactwright evaluation only at the integration boundary:
- required binding resolves;
- multiple skills can serve one Pactwright responsibility;
- Contract/Brief lineage is preserved;
- forbidden Pactwright mutation does not occur;
- missing/ambiguous resolution fails closed;
- local/Actions resolution and pinned replay preserve exact external dependency identities.

Do not execute or duplicate entire external Production Skills benchmark suites as normal Pactwright evaluation.
Domain quality remains owned by those repositories.

Use the existing baseline interface to attribute regressions to a changed Production Skills revision or Production Extension Pack selection.
Reports identify the affected capability/case and dependency change rather than relying on one opaque aggregate score.
```

**Expected result**

Pactwright diagnoses and evaluates its integration boundary without becoming a universal domain benchmark framework.

**Verify before continuing**

Run:

```bash
pnpm pactwright doctor
pnpm pactwright eval
pnpm pactwright eval --baseline <released-pack-or-baseline> --candidate <candidate-pack-or-environment>
```

Use exact fixture inputs for both changed-skill and changed-pack comparisons and inject known case-level regressions. Confirm doctor performs no writes, each declared failure class has a diagnostic fixture, and regressions identify the responsible dependency/capability/case.

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

Do not require a new Agent Pack capability: approval enforcement, hashing, validation and recording use deterministic Extension responsibilities under the current spec.

Do not require Graph Review or Operations.
Do not require PI merely for the Extension to be enabled or for ungrounded Assets to exist.
PI becomes a semantic prerequisite when an Asset requires governed project grounding.
```

**Expected result**

Assets / Publication installs independently with a conditional grounding prerequisite rather than an unconditional PI dependency.

**Verify before continuing**

Test PI disabled with no governed grounding requirement, PI enabled, Graph Review disabled and Operations disabled. All structurally valid combinations remain valid and no new production-domain capability is required.

## Stage 3 — Implement Asset semantics and approval

### Step 6 — Implement the exact Asset schema and content identity

**References:** Spec 05 Asset identity/immutability/storage; Spec 01 Evidence canonicality.

**Run**

```text
Implement the canonical minimum Asset fields:
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

Do not include provider-specific Generation Records or copy Production Skills execution history into Asset records.

Drafts, renders, mixes, prototypes, build artefacts, research drafts and temporary exports do not become canonical Assets merely because they exist. Asset approval is required for that separate durable identity.
Successful Evidence is already canonical Delivery state and does not automatically create an Asset.
```

**Expected result**

An Asset identifies one exact human-approved durable output; Evidence retains its independent canonical verified-result meaning.

**Verify before continuing**

Test valid structure, missing title/created/Evidence/approver/hash/storage identity, content-hash mutation and candidate-output exclusion from Asset state. Complete a Delivery without creating an Asset and require its Evidence to remain canonical and valid; later Asset approval must not rewrite that Evidence.

### Step 7 — Implement conditional grounding and post-approval reconsideration

**References:** Specs 03, 05 and 08 grounding/readiness.

**Run**

```text
Implement the conditional grounding rule:

no governed grounding requirement
→ PI not required for Asset approval

governed project facts / identity / voice / positioning / product claims / accepted project constraints
→ PI required
→ referenced Knowledge must be accepted and applicable
→ Asset records exact Knowledge ids + hashes

Required grounding may not be omitted to bypass PI.
Before approval, challenged/superseded/retracted or mismatched grounding requires re-grounding/re-evaluation.

After approval, later Knowledge challenge/supersession/retraction:
- never rewrites the historical Asset or its grounding hashes;
- identifies the affected Asset through existing relationships;
- follows normal PI propagation/review/candidate governance where correction is justified;
- requires normal new Delivery and a new Asset for corrected content.
```

**Expected result**

Neutral outputs can be approved without PI, governed outputs fail closed, and later knowledge changes do not silently rewrite Asset history.

**Verify before continuing**

Test neutral Asset without PI, governed-claim rejection without PI, accepted applicable grounding, mismatched hashes, pre-approval re-grounding and post-approval challenge/supersession/retraction. In the last case require unchanged historical Asset identity/content/grounding plus PI identification and reconsideration of the affected Asset.

### Step 8 — Implement Asset relationships and supersession semantics

**References:** Spec 05 Evidence/Asset relationships and supersession.

**Run**

```text
Register and validate:

Evidence --produces--> Asset
Asset --grounded-in--> Knowledge        where applicable
Asset --supersedes--> Asset

One Evidence may produce multiple Assets with useful independent identity.
A material revision creates a new Asset; the earlier Asset remains immutable historical truth.

Implement graph/runtime supersession support, but do not invent:
- a standalone `assets supersede` command;
- Asset withdrawal state/command;
- Publication supersession semantics.
```

**Expected result**

Asset provenance and correction history are explicit without a withdrawal lifecycle.

**Verify before continuing**

Test valid Evidence production, multiple Assets from one Evidence, invalid endpoints/directions, preserved superseded Asset identity, acyclic supersession and absence of invented withdrawal semantics.

### Step 9 — Implement atomic `pactwright assets approve-asset`

**References:** Spec 05 commands/human approval/failure semantics.

**Run**

```text
Implement:

pactwright assets approve-asset <evidence-id>

Prepare and validate the candidate Asset from successful canonical Evidence, exact output content identity, required grounding and explicit human approval.
Human approval applies to the exact content hash recorded.
Automation may calculate/validate but cannot independently create approval authority.

Creation is atomic:
- invalid Evidence/content/grounding/approval => no canonical Asset;
- no partial produces/grounded-in relationships remain after failure;
- existing Evidence and other canonical records remain unchanged.

Print the Asset id only after successful creation.
```

**Expected result**

Only exact human-approved output becomes an Asset; failed approval leaves no partial canonical state or changes to valid Evidence.

**Verify before continuing**

Approve a repository-backed fixture, then mutate its bytes and require hash validation to fail. Separately inject invalid grounding, invalid Evidence, changed content after approval and a write failure. Require no partial Asset/edges and unchanged pre-existing canonical records.

### Step 10 — Handle external Asset verification conservatively

**References:** Spec 05 external storage implementation gap.

**Run**

```text
Support repository-backed content verification completely.

For external storage pointers:
- verify bytes/hash when accessible and deterministic;
- otherwise report unverifiable content rather than treating the pointer itself as proof.

Do not introduce a universal storage provider, replication layer, DAM or binary archive to close this checkpoint.
```

**Expected result**

An inaccessible pointer is never equated with verified content identity.

**Verify before continuing**

Test repository-backed and accessible-external success, plus inaccessible/mutable/access-controlled storage. Keep the broader cross-provider mechanism explicitly open and do not mutate approved history merely because current verification is unavailable.

## Stage 4 — Implement Publication

### Step 11 — Implement the exact Publication schema and canonical relationship

**References:** Spec 05 Publication semantics.

**Run**

```text
Implement the canonical minimum Publication fields:
- id;
- type: publication;
- title;
- created;
- asset: referenced approved Asset;
- exact asset_hash;
- channel;
- locator where applicable;
- published_by;
- published_at.

Register:
Publication --publishes--> Asset

Publication records an actual release event, not scheduling intent or performance.
```

**Expected result**

Publication records where, when and by whom an exact approved Asset was actually released.

**Verify before continuing**

Test valid Publication, unapproved Asset, mismatched hash, missing title/created/channel/provenance and reversed relationship direction.

### Step 12 — Implement safe `record-publication`, multiple releases and correction history

**References:** Spec 05 command/failure/idempotency/multiple-Publication semantics.

**Run**

```text
Implement:

pactwright assets record-publication <asset-id> <channel>

Record canonical Publication only after the project/channel mechanism actually releases the approved Asset.
Capture actual release provenance and locator where available.

A failed publication attempt:
- never mutates the approved Asset;
- never creates a valid Publication;
- never becomes a valid Operations exposure.

One approved Asset may have multiple Publications for intentional distinct release events/surfaces.

A material correction follows:
new content
→ new Asset
→ new Asset supersedes old Asset
→ new Publication when released

Do not introduce Publication-to-Publication supersession or withdrawal.

Universal retry/idempotency identity remains unresolved. Implement minimum safe retry protection for the supported channel and surface uncertainty rather than silently treating a retry as a new intentional release or duplicate.
```

**Expected result**

Actual releases, intentional multiple publications and corrections remain distinguishable from uncertain retries without rewriting history.

**Verify before continuing**

Test successful recording, failed release, mismatched hash, two intentional Publications of one Asset, uncertain retry without duplication and corrected content using a new superseding Asset/new Publication. Require no Publication withdrawal or Publication-to-Publication supersession.

### Step 13 — Implement the complete `pactwright assets validate` contract

**References:** Spec 05 validation.

**Run**

Enforce all canonical minimum rules:

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

Core `pactwright validate` delegates to the enabled Extension without reinterpreting its semantics. Validation is read-only. An unverifiable pointer is not proof of a matching content hash.

**Expected result**

The complete canonical boundary is validated without acquiring Production Skills or Operations responsibilities.

**Verify before continuing**

Maintain valid controls and a failing fixture for every numbered rule or tightly coupled group. Use a future-Operations fixture for rule 15, not an early Operations implementation. Run Extension/core validation and require no mutation on failure. Also require valid canonical Evidence to pass independently of whether an Asset exists.

## Stage 5 — GitHub integration and evaluation

### Step 14 — Implement Assets / Publication evaluation cases

**References:** Specs 02 and 05 evaluation.

**Run**

```text
Contribute boundary cases to `pactwright eval`:
- canonical Evidence remains valid without Asset approval;
- candidate output cannot become an Asset without exact human approval;
- failed approval leaves no partial canonical state;
- wrong content hash rejected;
- invalid/missing required grounding rejected;
- genuinely ungrounded Asset allowed without forcing PI;
- post-approval grounding change preserves history and follows normal reconsideration;
- direct Publication from Evidence/unapproved output rejected;
- Publication hash mismatch rejected;
- Asset immutability/supersession preserved;
- multiple intentional Publications allowed;
- uncertain retry does not silently duplicate;
- Publication → Asset direction enforced;
- Publication withdrawal/supersession not invented;
- Operations absence/failure/performance does not invalidate Publication;
- each supported optional GitHub approval/release route preserves runtime authority.

Do not evaluate domain production quality here.
```

**Expected result**

The post-Delivery durable-output boundary has repeatable Pactwright-level evaluation coverage.

**Verify before continuing**

Run `pnpm pactwright eval` and inspect cases individually. Conditional automation cases are required for supported paths and explicitly not applicable for disabled/unimplemented paths, rather than silently omitted while advertised as working.

### Step 15 — Implement Assets / Publication GitHub integration and conditional authority tests

**References:** Spec 07 Assets / Publication integration; Implementation Guide GitHub Actions baseline.

**Run**

```text
Contribute the profile to the existing generic GitHub composition/reconciliation engine.

Generate:
.github/workflows/pactwright-assets-publication.yml

Relevant managed/validated paths:
- assets/**
- docs/assets-publication/assets/**
- docs/assets-publication/publications/**

Exact checks:
- Pactwright / Assets
- Pactwright / Publication

The same shared Project may add configured Assets and Publications views.
Asset fields may include title, media type, Delivery lineage, grounding state, approved by, current/superseded and Publication count.
Publication fields may include Asset, channel, locator, published by, published at and linked operational Observations only when Operations later exists.

Candidate outputs never appear as canonical Assets.
Changes under assets/** validate affected approved Asset hashes.
GitHub never owns Publication truth.

Generic approval metadata alone cannot create an Asset.
Where repository policy explicitly maps a safe trusted authority event to approve-asset, the runtime still validates exact human authority, Evidence, content hash and required grounding.

Where scheduled/event-triggered release is supported, it releases only an already approved Asset and records Publication only after actual release. Failure leaves the Asset unchanged.

Record which optional authority/release mechanisms are supported; do not invent an approval engine or scheduler to satisfy an unused optional path.
Disabling the Extension removes only exclusively owned generated local/remote contributions and preserves canonical Assets/Publications and other profiles.
```

**Expected result**

The Extension composes into one shared GitHub integration, and supported optional automation remains subordinate to Pactwright authority.

**Verify before continuing**

Use configured local/remote fixtures to prove one shared Project with Core + PI + Graph Review + Assets / Publication, correct fields, candidate exclusion, no Asset from generic PR approval, hash-drift failure, preservation on disable and a converged second dry-run. Follow the shared workflow-availability preflight before enabling required checks and retain least privilege/untrusted-PR isolation.

For each supported trusted-authority mapping, test valid approval bound to the exact output, an unauthorised actor, missing human approval, changed bytes/hash since approval and missing/invalid required grounding. Only the valid exact-authority case may create an Asset; every negative case leaves no Asset or partial relationships. An untrusted event must not gain write or publication credentials.

For each supported scheduled/event-release route, test an approved Asset, an unapproved candidate, scheduling without actual release, release failure and uncertain recording acknowledgement. Require no release invocation for unapproved output, no Publication for scheduling alone, no valid Publication on failed release, an unchanged Asset on failure and safe retry without duplicate Publications.

For unimplemented optional mechanisms, record them as unsupported, require no generated route implying support, and reject unsupported configuration rather than claiming those tests passed. These conditions do not mandate implementing every optional trigger.

## Stage 6 — Adopt Production Skills and Assets / Publication in Pactwright

### Step 16 — Integrate real external Production Skills and repeat environment/replay conformance

**References:** Specs 02 and 04; Checkpoint 2 shared environment; Checkpoint 4 replay; selected external repositories.

**Run**

Choose at least two independently maintained Production Skills families genuinely useful to a real Pactwright public-product Delivery. Suitable combinations may include:

```text
deep-research-skills
+
ui-ux-design-skills or narrative-production-skills
```

Make any required integration-manifest contribution through the owning repository's normal authorised contribution process, then pin its accepted exact revision. Take the external-repository preservation baseline after those intentional upstream changes, before Pactwright resolution/sync.

Update `@pactwright/standard` as the owning Agent Pack to import/bind the families to existing Delivery responsibilities. Resolve its built version through normal Agent Pack mechanisms. Select a genuinely useful real Production Extension Pack where available; use the explicitly labelled Stage 1 fixture to cover pack mechanics when the production task does not need one. Do not add peer-level project Production Skills configuration or new domain capabilities.

```bash
pnpm pactwright sync
pnpm pactwright doctor
pnpm pactwright validate
```

Repeat the earlier environment/replay guarantees now that external imports exist:

```text
same repository inputs + exact Pactwright lock
→ local resolution
→ GitHub Actions resolution
→ equal runtime-supplied environment_lock_hash
→ identical resolved external source/revision/manifest/skill/pack identities
```

Use the real imported families in this conformance proof. Include a selected Production Extension Pack in a separate conformance fixture when no pack is relevant to the real task; do not misrepresent fixture data as actual production use.

In an isolated conformance repository, explicitly select a compatible Agent Pack binding appropriate external skills to the existing `graph-review` capability. Run a bounded review using environment A and retain its emitted execution id and complete replay tuple. Through normal pack selection/upgrade and sync, change the current environment to B with a different exact skill revision and/or pack selection while retaining A's historical inputs.

```bash
pnpm pactwright graph-review rerun <execution-id>
pnpm pactwright graph-review rerun <execution-id> --current
```

The default rerun must reconstruct A; only `--current` may use B. Each rerun creates a new immutable Review Execution and leaves the original unchanged. Model output need not be byte-identical.

In separate failure fixtures, make the recorded external skill revision or selected pack unavailable while a newer compatible alternative remains accessible. Both local and GitHub-triggered pinned reruns must fail explicitly before specialist analysis, emit no successful Findings and never substitute the newer dependency/current environment. Use the existing runtime reconstruction path; do not create a test-only resolver or archive service.

**Expected result**

Real external skills work through the selected Agent Pack, and their introduction does not break local/Actions identity or historical replay guarantees.

**Verify before continuing**

Inspect exact locked identities, generated adapter output and runtime-supplied hashes from local/Actions execution. Require equality for the same lock, unchanged external repository hashes after sync, successful pinned-A/current-B distinction and explicit missing-skill/missing-pack replay failures locally and remotely. Keep original Review Executions immutable and preserve no-current-substitution semantics.

Include these conformance fixtures in repository verification and the relevant Pactwright integration evaluation, not in copied domain benchmark suites. Restore the intended selected pack/environment after isolated experiments.

### Step 17 — Enable Assets / Publication in Pactwright

**References:** Specs 02, 05 and 07.

**Run**

```bash
pnpm build
pnpm pactwright extension add assets-publication
pnpm pactwright sync
pnpm pactwright assets validate
```

Land the generated Assets / Publication workflow on the default branch before requiring its checks. Then:

```bash
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
pnpm pactwright github sync --dry-run
pnpm pactwright validate
```

**Expected result**

Pactwright has the post-Delivery surface without enabling Operations or bypassing safe workflow activation.

**Verify before continuing**

A second local/remote sync converges, the same shared Project remains, existing profiles/user state are preserved and all validation passes.

### Step 18 — Enforce existing public-content readiness for the selected Pactwright work

**References:** Specs 03, 05 and 08 readiness/grounding.

**Run**

```bash
pnpm pactwright intelligence onboard
pnpm pactwright intelligence validate
```

Determine actual applicable domains and enforce the existing Spec 08 gate:

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

Every relied-on claim/constraint must be accepted, in-horizon Knowledge with traceable Sources. Resolve missing coverage through the existing PI gap → Delivery/research → ingest → triage/promotion path. Do not require unrelated domains to be Covered or use Asset grounding as a substitute for readiness.

**Expected result**

Every applicable domain is Covered and public Delivery uses current accepted project truth.

**Verify before continuing**

Inspect domain-map/onboarding and the exact Knowledge/Sources used by the Brief/Delivery. Missing applicable coverage blocks public approval. Recheck the same gate for the learning material and any separately selected public output later in this checkpoint.

### Step 19 — Deliver one real cross-domain Pactwright public output

**References:** Specs 01–05 and selected Production Skills.

**Run**

Use normal Pactwright Delivery for real public work that benefits from the selected families:

```text
Intent
→ Decision
→ Contract
→ Brief
→ specialised Production Skills execution
→ Delivery Review using relevant skills
→ Evidence
```

Candidate/draft outputs remain production/execution artefacts. Where useful, follow the owning Production Skills' cheap-to-expensive practice:

```text
cheap adequate representation
→ evaluate
→ select / approve where necessary
→ higher fidelity
→ evaluate
→ targeted correction
```

Do not turn that production practice into a mandatory Pactwright lifecycle.

**Expected result**

Specialised cross-domain work completes at valid canonical Evidence independently of later Asset approval.

**Verify before continuing**

Run relevant domain evaluations under their owning repositories and `pnpm pactwright validate`. Confirm no domain-specific Pactwright nodes/capabilities, no weakened Contract/Brief authority, and valid Evidence before any Asset exists.

### Step 20 — Approve the first grounded public Asset and record its Publication

**References:** Specs 05 and 08 Asset/Publication authority and public milestone.

**Run**

Use Step 19's public output to prove the first **grounded approved Pactwright public Asset**. After a human inspects the exact successful output:

```bash
pnpm pactwright assets approve-asset <evidence-id>
```

Record the exact accepted PI Knowledge ids/hashes actually required by the public claims, identity and constraints. Re-ground and re-evaluate before approval if relied-on Knowledge has been challenged, superseded or retracted.

Use the project's actual channel/release mechanism to release that approved Asset, then:

```bash
pnpm pactwright assets record-publication <asset-id> <channel>
pnpm pactwright assets validate
```

**Expected result**

Canonical Evidence leads to a separate grounded human-approved Asset and a real Publication of its exact content.

**Verify before continuing**

Verify approved bytes/hash, required Knowledge ids/hashes, matching Publication hash, actual publisher/time/channel/locator and candidate exclusion. Existing Evidence remains unchanged; subsequent grounding changes cannot silently rewrite historical Asset/Publication records.

## Stage 7 — Publish the Production Skills + Assets / Publication learning path

### Step 21 — Deliver public guide/example/Academy material

**References:** Spec 08 Production Skills + Assets / Publication milestone.

**Run**

Through normal Delivery with applicable public readiness and relevant skills, publish/update:

```text
Production Skills integration guide
one executable multi-Production-Skills Delivery example
Assets / Publication guide/example
Academy production lesson
README/website capability summary
```

The examples may share one end-to-end scenario, but both production and post-Delivery boundaries must be executable and covered in CI where practical. Explain:

```text
Production Skills
→ specialised production/review

Delivery
→ Contract fulfilment and canonical Evidence

Assets / Publication
→ separate exact approved durable output and actual release record
```

Do not describe a Creative Delivery lifecycle or make Evidence depend on Asset approval. Document only supported optional GitHub authority/release mechanisms.

**Expected result**

Users can reproduce specialised production and durable publication without conflating their owners.

**Verify before continuing**

Run examples and Graph Review over the new public material. Triage all Findings through PI and resolve blocking inconsistencies through normal Delivery. Public claims and supported automation guidance must match actual checkpoint acceptance.

## Stage 8 — Release `0.0.5`

### Step 22 — Publish the `0.0.5` family

**References:** Implementation Guide npm release model; Checkpoint 2 exact-version upgrade acceptance.

**Run**

Prepare release from accepted Evidence. Before publication, fixture-prove Step 23's exact transition from `0.0.4`: runtime, selected standard pack, PI, Graph Review and new Assets / Publication. Verify the old Graph Review remains compatible during its PI dependency upgrade, then verify the full target environment. An incompatible intermediate sequence or ignored target constraint is a blocker, not grounds to bypass component owners.

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

External Production Skills and packs remain at their independently owned exact revisions/versions, not republished as Pactwright packages. Preserve their exact identities during the release.

Use the normal release PR/tag flow and bootstrap trusted publishing only for the new Assets / Publication package.

**Expected result**

The compatible `0.0.5` family is available under `next` with provenance, exact external dependencies and a verified consumer upgrade sequence.

**Verify before continuing**

```bash
pnpm view pactwright@0.0.5 version
pnpm view @pactwright/standard@0.0.5 version
pnpm view @pactwright/project-intelligence@0.0.5 version
pnpm view @pactwright/graph-review@0.0.5 version
pnpm view @pactwright/assets-publication@0.0.5 version
```

Every command returns `0.0.5`. Require exact-target fixtures, Step 16 environment/replay conformance and all blocking acceptance fixes before real consumer upgrade.

## Stage 9 — Prove specialised production and publication in Kakeido

### Step 23 — Upgrade Kakeido from accepted `0.0.4` through exact ownership-specific paths

**References:** Spec 02 upgrades; current Kakeido specs; Checkpoint 2 exact-version upgrade acceptance.

**Run**

Record the accepted `0.0.4` installed/configuration/lock state and use the compatible sequence proven in Step 22. Do not preinstall target packages or edit either lock manually.

```bash
pnpm pactwright upgrade --to 0.0.5
pnpm pactwright validate
```

Verify runtime `0.0.5`, new-runtime migration and compatibility with existing components. Set only the selected `@pactwright/standard` desired version to exact `0.0.5` through its existing configuration, preserving identity:

```bash
pnpm pactwright agent-pack upgrade
pnpm pactwright validate
```

Verify exact pack and external dependency identities. Next set only PI's desired version constraint to exact `0.0.5` through its supported Extension configuration:

```bash
pnpm pactwright extension upgrade project-intelligence
pnpm pactwright intelligence validate
pnpm pactwright validate
```

Verify exact PI and compatibility with the still-enabled Graph Review. Set only Graph Review's desired version constraint to exact `0.0.5`:

```bash
pnpm pactwright extension upgrade graph-review
pnpm pactwright graph-review validate
pnpm pactwright validate
```

Verify exact Graph Review/dependency locks before installing the new Extension:

```bash
pnpm pactwright extension add @pactwright/assets-publication@0.0.5
pnpm pactwright assets validate
pnpm pactwright sync
```

Verify the complete exact environment. Land the generated workflow before its checks become required, then:

```bash
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
pnpm pactwright github sync --dry-run
pnpm pactwright doctor
pnpm pactwright validate
```

After each owning command, record actual installed versions, both locks and complete compatibility before continuing. Recover failed operations rather than running through invalid state. Do not substitute a later compatible version, change Agent Pack identity or use runtime upgrade as shorthand for component upgrades.

**Expected result**

Kakeido moves from the real `0.0.4` environment to the exact `0.0.5` family without bypassing installation/upgrade ownership.

**Verify before continuing**

Verify intermediate and final package/lock agreement, exact `0.0.5` runtime/standard/PI/Graph Review/Assets packages, recorded external identities, unchanged pack identity, new-runtime migration/validation, preserved historical replay provenance and unrelated user state, and converged remote integration.

### Step 24 — Resolve skills for one real Kakeido outcome through the selected Agent Pack

**References:** current Kakeido owner specs; Spec 02 Production Skills.

**Run**

Select a real Delivery for which specialist skills are useful, such as:

```text
product/UX + software implementation
research + product content
narrative/content + UI/UX
```

Choose only families required by the owning Kakeido specs. Use imports/bindings already provided by the published selected pack, or explicitly select another compatible pack with `pactwright agent-pack use <source>` when genuinely needed. Such a later deliberate selection is distinct from the identity-preserving upgrade already verified in Step 23.

Do not introduce a peer-level project Production Skills setting. Resolve/sync/lock exact external revisions and any selected packs through the chosen Agent Pack. Preserve external repositories.

**Expected result**

Kakeido uses the same Agent Pack → Production Skills model for a materially different product/domain.

**Verify before continuing**

Run doctor/validation, inspect exact locks and compare the runtime-supplied local/Actions environment identity for this consumer. Any deliberately changed pack remains compatible with all enabled capabilities; project configuration still selects an Agent Pack rather than independently composing Production Skills.

### Step 25 — Deliver the Kakeido outcome through normal Delivery

**References:** current Kakeido canonical specs; Specs 01–03.

**Run**

Use normal Contract-driven Delivery with the selected skills and current governing specifications. Preserve deterministic financial authority, product/UX constraints, assistant uncertainty/authority boundaries, technical/security/privacy constraints and other applicable invariants.

For public/outbound work, apply the existing readiness gate and current Source-traceable grounding before approval.

**Expected result**

A real Kakeido cross-domain Delivery completes at canonical Evidence without new domain-specific Pactwright semantics.

**Verify before continuing**

Run repository-defined tests, relevant independently owned domain evaluations and Pactwright validation. Verify Evidence is canonical before any separate Asset approval.

### Step 26 — Create a Kakeido Asset/Publication where durable identity is useful

**References:** Spec 05; current Kakeido product/public-surface specs.

**Run**

For an output that warrants independent durable identity, satisfy applicable public readiness/grounding and human-approve its exact successful output:

```bash
pnpm pactwright assets approve-asset <evidence-id>
```

Publish through the existing real channel mechanism, then:

```bash
pnpm pactwright assets record-publication <asset-id> <channel>
pnpm pactwright assets validate
```

If the selected software Delivery does not warrant an Asset, select a separate bounded public/durable output for this proof rather than turning every build/commit into an Asset. Its Evidence must come from normal Delivery, not be inferred from publication.

**Expected result**

Kakeido proves the abstraction on a semantically useful durable output, not mechanically on every Delivery.

**Verify before continuing**

Inspect exact hash, human approval, applicable Knowledge grounding, channel/locator/publisher/time and Publication relationship direction. Require no Evidence→Publication shortcut, no candidate promoted without approval and no rewriting of prior Evidence.

## Stage 10 — Capture Checkpoint 5 feedback

### Step 27 — Route findings to their owners and resolve blocking failures

**References:** Implementation Principles feedback/evaluation ownership; Implementation Guide transition rule.

**Run**

Capture material integration, pack-resolution, composition, lock/doctor/regression, environment/replay, Asset approval/grounding, external-byte, Publication retry/history, GitHub authority/projection and real-use findings.

Route Pactwright responsibility failures through PI Source/triage/promotion/candidate governance. Route domain technique/quality failures to the owning Production Skills repository/benchmark rather than turning them into Pactwright semantics. Do not automatically create Intents.

Correct every blocking failure and rerun its acceptance before closing. Recording a blocker as governed future work is not resolution. A domain-owned defect that prevents this checkpoint's required outcome still blocks acceptance until corrected or the required outcome is otherwise validly achieved and reverified.

Only explicitly non-blocking findings/design gaps may remain future candidates under the Implementation Guide transition conditions.

**Expected result**

Learning reaches the correct owner, while governance cannot be used to defer a failure that invalidates checkpoint acceptance.

**Verify before continuing**

Trace every blocker to a correction and passing re-verification. Require no unresolved blocker before Checkpoint 6, and trace retained domain findings to their owning family with an explicit non-blocking disposition.

## Exit gate

Checkpoint 5 closes only when:

- external manifests resolve through the selected Agent Pack and invalid/ambiguous/unavailable complete environments fail closed;
- external skills and selected packs lock exact source/revision/manifest/skill/pack identity;
- changing resolved skill revisions or pack selections changes `environment_lock_hash`;
- repeated sync is deterministic and leaves external repositories unchanged;
- one capability can use multiple families without domain-specific capabilities or peer-level project skills configuration;
- doctor diagnoses source/skill/pack/lock/adapter failures read-only;
- baseline reporting attributes skill/pack regressions to meaningful capability/case dimensions;
- local and Actions execution resolve identical external dependency identities and runtime-supplied environment hashes from the same lock;
- pinned Graph Review reconstruction uses its exact recorded external skills/packs, explicit --current uses the current environment, and missing historical dependencies fail locally/remotely without newer substitutions;
- domain quality remains owned by Production Skills benchmarks;
- Assets / Publication is an independent post-Delivery Extension requiring no new production AI capability, Graph Review or Operations;
- PI is required conditionally for governed Asset grounding, not universally for every Asset;
- Asset and Publication schemas contain the exact canonical minimum fields;
- successful Delivery Evidence is canonical before and independently of Asset approval, and does not automatically create an Asset;
- candidate outputs do not become canonical Assets until exact human Asset approval;
- failed approval creates no partial Asset/edges and leaves existing Evidence unchanged;
- every Asset references valid Evidence, exact approved content and applicable accepted Knowledge ids/hashes;
- later grounding change preserves historical Asset identity and follows normal PI reconsideration;
- material corrections create a new superseding Asset and new Publication while preserving earlier history;
- exact Asset-supersession command ergonomics remain open rather than invented;
- intentional multiple Publications are supported and uncertain retries do not silently duplicate;
- Publication withdrawal and Publication-to-Publication supersession are not invented;
- Publications identify actual releases of approved Assets through exact matching hashes and Publication --publishes--> Asset;
- external bytes are not considered verified merely because a pointer exists;
- all 16 validation rules are enforced and core validation delegates when enabled;
- approve-asset, record-publication and validate work through the runtime;
- exact GitHub checks, paths and configured views compose into the existing shared integration with safe workflow activation;
- each supported optional authority/release route has positive and negative acceptance proving human authority, exact hash/grounding, approved-only actual release and unchanged state on failure; unsupported optional routes are not advertised or generated;
- disabling the Extension removes only owned generated integration and preserves canonical records and other profiles;
- public readiness is enforced and Pactwright produces its first grounded approved public Asset and real Publication;
- Pactwright completes real specialised cross-domain Delivery with external skills;
- Kakeido performs the exact 0.0.4 → 0.0.5 transition using explicit desired constraints and owning commands, with compatible intermediate states, then proves production/publication on a materially different outcome;
- no Creative Delivery, provider registry, Generation Guidance, creative Agent Pack, DAM/CMS or Extension-owned report subsystem has been recreated;
- the exact 0.0.5 first-party family is registry verified;
- every blocking failure has a correction and passing re-verification; only non-blocking findings remain future candidates;
- no known blocking failure is carried into Checkpoint 6.

---

**Pactwright — Checkpoint 5 — Production Skills + Assets / Publication v12**
