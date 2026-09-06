# Pactwright — Checkpoint 7 — Publication Feedback

**Version:** 10  
**Entry condition:** Checkpoint 6 is accepted.  
**Release:** `0.0.7`  
**Exit capability:** Operations can observe canonical Publications through the generic exposure contract already implemented in Checkpoint 6, and Pactwright closes its first evidence-driven Publication revision without transferring ownership between Assets / Publication and Operations.

## 1. Goal

Prove the cross-Extension loop:

```text
Publication
→ registered operational exposure
→ bounded evidence
→ Observation
→ PI Source
→ governed candidate
→ explicit Intent
→ normal Delivery
→ new Asset
→ new Publication
```

Checkpoint 7 introduces no new generic exposure subsystem. It is a conformance and integration checkpoint over the contracts already owned by Specs 05 and 06.

## 2. Canonical baseline

Use canonical Specs 01–08 plus the Implementation Principles and Implementation Guide. Research logs are rationale only.

Kakeido acceptance uses the current canonical Kakeido specifications from the Kakeido repository.

## 3. Execution contract

Every implementation action follows:

```text
Step
→ References
→ Run
→ Expected result
→ Verify before continuing
```

Default execution location is Pactwright unless Kakeido or a fixture is named.

For repository/code changes run `pnpm verify`; build before invoking newly implemented repository-local commands. Land coherent changes through pull requests and required checks.

## 4. Checkpoint scope

Checkpoint 7 implements/proves:

```text
Publication conformance with Operations exposure registration
Publication → Observation ownership boundary
cross-Extension GitHub profile composition
real Pactwright Publication evidence loop
real Kakeido Publication evidence loop
one evidence-driven Pactwright Publication revision
```

It does not add:

- new Publication performance fields;
- new Asset/Publication lifecycle states;
- Publication withdrawal/supersession semantics;
- a new publication-specific Operations model;
- a new reviewer/provider/generation subsystem;
- automatic Publication-selection policy.

The exact policy for which Publications should enter feedback remains an open product gap. This checkpoint uses an explicit selected Publication as its acceptance case.

## Stage 1 — Prove Publication exposure conformance

### Step 1 — Declare Publication as Operations-compatible exposure metadata

**References:** Specs 02, 05 and 06.

**Run**

```text
Extend the Assets / Publication Extension manifest so its canonical `publication` record type is declared compatible with the generic Operations exposure contract implemented in Checkpoint 6.

The declaration must:
- be inert when Operations is disabled;
- not introduce an Operations dependency;
- reference the existing canonical Publication type rather than copy it;
- provide the stable identity/hash information required by Operations exposure validation.
```

**Expected result**

Assets / Publication advertises compatible exposure semantics while remaining independently valid.

**Verify before continuing**

Run Assets / Publication with Operations disabled and validate a Publication successfully. Confirm no Operations-owned state is required.

### Step 2 — Prove Operations discovers Publication generically

**References:** Spec 06 generic exposure discovery.

**Run**

```text
Enable Assets / Publication + Operations in a fixture and confirm Operations discovers `publication` only through the generic registered-exposure mechanism.

No Operations engine branch may special-case Publication identity or storage.
```

**Expected result**

Publication behaves exactly like any compatible sibling-owned exposure type.

**Verify before continuing**

Validate a correct Publication target and reject disabled/unregistered/invalid exposure targets.

### Step 3 — Add publication-focused Operations evaluation cases

**References:** Specs 02 and 06 evaluation boundaries.

**Run**

```text
Add `operations-analysis` cases for Publication evidence:
- baseline/channel comparison;
- unsupported creative/content causality;
- positive outcome recognition;
- duplicate/same-meaning evidence handling;
- exact Publication attribution;
- no Asset/Publication mutation.

Keep production/content quality itself with relevant Production Skills benchmarks.
```

**Expected result**

Publication evidence interpretation is tested at the Operations responsibility boundary.

**Verify before continuing**

Run `pnpm pactwright eval` and inspect the new cases individually.

## Stage 2 — Compose GitHub integration

### Step 4 — Compose Publication paths/events into Operations automation

**References:** Spec 07 profile composition and workflow ownership.

**Run**

```text
When both Extensions are enabled, compose Assets / Publication profile requirements with the Operations profile so relevant Publication changes/events may trigger the existing:

.github/workflows/pactwright-operations.yml

Keep runtime semantics in Pactwright. Do not create a separate publication-feedback workflow.
```

**Expected result**

Cross-Extension automation composes without creating a sibling dependency.

**Verify before continuing**

Run sync/dry-run for:
- Assets / Publication only;
- Operations only;
- both enabled.

Only the both-enabled case contains composed Publication trigger requirements in the Operations workflow.

### Step 5 — Prove sibling disablement boundaries

**Run**

In fixtures prove:

```text
Assets / Publication enabled, Operations disabled
→ Assets and Publications remain fully valid

Operations enabled, Assets / Publication disabled
→ native Deployment Operations remains valid

both enabled
→ Observation may reference Publication

Operations removed after Publication Observation exists
→ Asset/Publication history remains valid
```

Operations must never mutate/copy Publication state.

**Expected result**

Sibling ownership is independent and cross-Extension relationships do not transfer authority.

**Verify before continuing**

Run the relevant `assets validate`, `operations validate` and core validation commands before/after each transition.

## Stage 3 — Observe a real Pactwright Publication

### Step 6 — Select a real canonical Publication

**References:** Spec 05 Publication semantics; Spec 08 Publication Feedback milestone.

**Run**

```bash
pnpm pactwright assets validate
```

Select one existing canonical Pactwright Publication produced in Checkpoint 5 that has a real observable public surface. Record its Publication id, Asset id/hash, channel and locator.

Do not invent a general automatic selection policy from this one case.

**Expected result**

One explicit real Publication is selected as the feedback acceptance case.

### Step 7 — Configure bounded Publication evidence

**Run**

Configure the minimum Operations source required to observe the selected Publication through an existing analytics/evidence system.

Store configuration/provenance only; no credentials or raw analytics events enter canonical state.

Then:

```bash
pnpm pactwright operations ingest <source-id>
pnpm pactwright operations observe <source-id>
pnpm pactwright operations validate
```

**Expected result**

Publication evidence either produces no durable Observation or a canonical Observation tied to the exact Publication.

**Verify before continuing**

If an Observation is produced, trace exact Publication id/hash and confirm the Asset/Publication bytes/records are unchanged.

### Step 8 — Route the Publication Observation through PI

**Run**

For every Observation-derived internal Source id:

```bash
pnpm pactwright intelligence triage <internal-source-id>

# only where reviewed promotion is required and accepted
pnpm pactwright intelligence promote <internal-source-id>

pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright operations corrective-roadmap
```

**Expected result**

Observed Publication performance becomes project meaning/candidates only through PI governance.

**Verify before continuing**

No Operations or Assets command directly creates an Intent or changes roadmap priority.

## Stage 4 — Close one Pactwright Publication revision loop

### Step 9 — Select an evidence-supported correction

**References:** Specs 03, 05, 06 and 08.

**Run**

If the selected Publication evidence justifies a correction, choose one accepted PI candidate whose provenance traces to the exact Observation/Publication.

If the evidence does not justify a correction, select another explicit real Publication with sufficient evidence rather than manufacturing a causal conclusion.

**Expected result**

The correction is evidence-supported and traceable.

### Step 10 — Deliver the correction through normal Delivery

**Run**

Use normal Pactwright Delivery:

```text
Intent
→ Contract alternatives
→ authorised Decision
→ Contract
→ Brief
→ Delivery using relevant Production Skills
→ Review
→ Evidence
```

Before approving a fact-bearing public Asset, verify required PI grounding is accepted/current.

**Expected result**

Publication evidence influences production only through normal governed Delivery.

### Step 11 — Approve the revised Asset and record its Publication

**Run**

After human approval of the exact revised bytes:

```bash
pnpm pactwright assets approve-asset <evidence-id>
pnpm pactwright assets record-publication <new-asset-id> <channel>
pnpm pactwright assets validate
```

Where the revised Asset semantically replaces the original Asset, record the canonical Asset supersession relationship using the graph mutation mechanism available from Checkpoint 5. Do not invent a new unsupported Asset-supersede CLI.

**Expected result**

The evidence-driven correction becomes a new immutable Asset and real Publication while preserving original history.

**Verify before continuing**

Trace:

```text
original Publication
→ Observation
→ PI Source
→ candidate
→ Intent
→ Evidence
→ new Asset
→ new Publication
```

## Stage 5 — Publish Publication Feedback learning material

### Step 12 — Deliver the feedback guide

**References:** Spec 08 Publication Feedback milestone.

**Run**

Through normal Delivery, update the smallest useful public set:

```text
Publication Feedback guide
real evidence-driven Pactwright example/case fragment
links from Operations and Assets / Publication docs
```

Use actual evidence and accepted PI grounding. Do not imply that every Publication must be monitored or that Pactwright chooses Publications automatically.

**Expected result**

Users can understand how publication performance enters the same Operations → PI → Delivery loop.

**Verify before continuing**

Run Graph Review over the new material and route Findings through PI.

## Stage 6 — Release and Kakeido proof

### Step 13 — Publish the `0.0.7` compatible family

Use the Implementation Guide release flow. No new first-party package is introduced in Checkpoint 7.

Verify:

```bash
pnpm view pactwright@0.0.7 version
pnpm view @pactwright/standard@0.0.7 version
pnpm view @pactwright/project-intelligence@0.0.7 version
pnpm view @pactwright/graph-review@0.0.7 version
pnpm view @pactwright/assets-publication@0.0.7 version
pnpm view @pactwright/operations@0.0.7 version
```

### Step 14 — Upgrade Kakeido and observe one Publication

Upgrade runtime, Agent Pack and each enabled Extension through their owning upgrade commands, then identify one real Kakeido Publication created from current canonical Kakeido work.

Configure a bounded evidence source and run:

```bash
pnpm pactwright operations ingest <source-id>
pnpm pactwright operations observe <source-id>
pnpm pactwright operations validate
```

Triage any Observation-derived PI Source.

**Expected result**

Kakeido proves Publication → Observation → PI without any Review & Creative or creative-specific Pactwright semantics.

**Verify before continuing**

Assets/Publications remain valid with Operations disabled; Operations cannot mutate Publication; current Kakeido specs remain the authority for any resulting corrective work.

## Stage 7 — Capture feedback

### Step 15 — Govern material integration findings

Ingest material Pactwright-level friction/failures through PI. Preserve as open gaps where appropriate:

- automatic Publication selection policy;
- Publication recording idempotency identity;
- Asset supersession CLI ergonomics;
- Operations Observation identity/evidence durability.

Do not solve those gaps merely to close this checkpoint unless implementation evidence proves a necessary minimal contract change and the owning canonical spec is deliberately updated first.

## Exit gate

Checkpoint 7 closes only when:

- Publication conforms to generic Operations exposure registration without a sibling dependency;
- Assets / Publication remains valid without Operations;
- native Operations remains valid without Assets / Publication;
- Operations references, never copies/mutates, Publication;
- publication-focused `operations-analysis` evaluation exists;
- the existing Operations workflow composes Publication triggers without a new workflow/subsystem;
- one real Pactwright Publication is observed and routed through PI;
- one evidence-supported Pactwright Publication revision completes the full governed loop;
- one real Kakeido Publication proves the same integration boundary;
- no creative/reviewer/provider architecture is reintroduced;
- Publication-selection policy and other declared identity/idempotency gaps remain explicit;
- no known blocking failure enters Checkpoint 8.

---

**Pactwright — Checkpoint 7 — Publication Feedback v10**
