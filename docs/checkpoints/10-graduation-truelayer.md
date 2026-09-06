# Pactwright — Graduation — TrueLayer

**Version:** 10  
**Entry condition:** Checkpoint 9 is accepted, Kakeido runs the exact accepted Pactwright `0.1.0` family, and a dedicated current Kakeido TrueLayer integration specification exists.  
**Exit capability:** TrueLayer is added as a second financial-data source without semantic drift, the integration is observed through the existing Operations model, and any Pactwright generalisation failures discovered during graduation are captured as governed evidence rather than fixed ad hoc inside Kakeido.

## 1. Goal

Use the complete Pactwright system on a materially different external integration while preserving Kakeido's canonical financial, review, UX, privacy/security and assistant semantics.

Graduation tests whether the system generalises. It is not another Pactwright implementation checkpoint.

## 2. Canonical baseline

Pactwright behaviour is governed by canonical Specs 01–08, the Implementation Principles and the Implementation Guide.

Kakeido behaviour is governed by the **current canonical Kakeido specifications in the Kakeido repository**, including the dedicated TrueLayer integration specification.

Research logs and stale embedded Kakeido copies in Pactwright are not authoritative.

Once accepted through Stage 1, the dedicated TrueLayer specification owns provider-specific semantics such as:

```text
connect/consent flow
provider authentication/token handling
sync/webhook mechanics
provider-specific errors/retries
source mapping constraints
```

This runbook must not invent those semantics.

## 3. Graduation constraints

During Graduation:

- do not change Pactwright core, first-party Extensions or `@pactwright/standard` merely to make TrueLayer work;
- Pactwright gaps are captured as evidence for future governed Pactwright Delivery;
- do not create TrueLayer-specific Project Graph semantics when existing Kakeido ingestion and Operations boundaries are sufficient;
- raw provider payloads, access tokens, refresh tokens, client secrets and unnecessary personal data never become Pactwright canonical state;
- use Production Skills appropriate to the implementation domain, but keep Kakeido-specific/domain quality in those skills and Kakeido specs rather than Pactwright semantics.

## 4. Target architecture

The ingestion boundary remains:

```text
CSV --------┐
            │
TrueLayer --┼→ canonical ingestion / normalisation
            │
future -----┘
                 ↓
       canonical Kakeido financial model
                 ↓
            weekly review
                 ↓
                 Kei
```

TrueLayer must not create a parallel downstream financial/review model.

The delivery/feedback path remains:

```text
accepted Kakeido spec
→ PI Source / governed Knowledge
→ explicit Intent
→ normal Delivery
→ Evidence
→ Deployment
→ Operations evidence
→ Observation
→ PI Source
→ future Delivery where justified
```

## Stage 1 — Govern and analyse the TrueLayer specification

### Step 1 — Ingest the dedicated TrueLayer specification

**Run**

```bash
pnpm pactwright intelligence ingest "<current-kakeido-truelayer-spec-path>"
pnpm pactwright intelligence triage <source-id>

# only when reviewed promotion is required and accepted
pnpm pactwright intelligence promote <source-id>

pnpm pactwright intelligence onboard
pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright intelligence validate
pnpm pactwright validate
```

**Expected result**

Provider semantics enter normal Kakeido project knowledge governance without automatically creating an Intent.

**Verify before continuing**

The accepted TrueLayer knowledge/candidate provenance traces to the current source spec and no provider assumption outside it has become canonical truth.

### Step 2 — Run bounded Graph Review requests before Delivery

**Run**

Run explicit Graph Review requests through:

```bash
pnpm pactwright graph-review run
```

using the implemented request-input interface for at least these questions:

```text
Architecture
→ Does TrueLayer preserve the canonical ingestion/normalisation boundary and avoid provider leakage downstream?

Product/UX
→ Does the accepted integration fit existing Kakeido review/mobile interaction semantics?

Authority/privacy
→ Do provider data/consent/error states preserve Kei authority and Kakeido privacy/security boundaries?

Graph coherence
→ Do the accepted specification and current Kakeido Project Graph contradict existing financial/review rules?
```

Do not invoke named reviewer ids or a persistent reviewer roster.

**Expected result**

Material contradictions are surfaced as Graph Review Findings before implementation.

**Verify before continuing**

For every Finding-derived PI Source:

```bash
pnpm pactwright intelligence triage <source-id>

# where reviewed promotion is required and accepted
pnpm pactwright intelligence promote <source-id>
```

Then regenerate the PI roadmap. Every accepted concern remains traceable to Review Execution → Finding → PI Source.

## Stage 2 — Deliver TrueLayer behind the canonical Kakeido boundary

### Step 3 — Capture the accepted TrueLayer Intent

**Run**

Capture one explicit Intent corresponding to the accepted PI candidate, then complete:

```text
Intent
→ Contract alternatives
→ authorised Decision
→ Contract
→ Brief
→ Delivery
→ Review
→ Evidence
```

The Brief must ground itself in the current TrueLayer spec plus applicable accepted Kakeido Knowledge.

Use relevant Production Skills for software engineering, security/privacy review, mobile/UI work and testing where applicable.

**Expected result**

TrueLayer is implemented as another input to existing canonical Kakeido semantics rather than a separate product path.

### Step 4 — Verify source equivalence and no semantic leakage

**Run**

Run Kakeido repository tests and acceptance scenarios proving at least:

```text
CSV + TrueLayer inputs
→ compatible canonical financial records

same economic transaction
→ same downstream financial semantics regardless of source

review states/totals/classification invariants
→ source independent

Kei explanations/authority
→ source independent except where provider provenance is genuinely relevant

mobile/review UX
→ no provider-specific domain semantics leak into canonical review behaviour
```

**Expected result**

The provider boundary is contained.

**Verify before continuing**

`pnpm verify` and all current Kakeido spec-defined acceptance tests pass.

### Step 5 — Run post-delivery Graph Review

**Run**

Run bounded Graph Review requests for:

```text
architecture boundary leakage
financial semantic drift
security/privacy violations
UX/review semantic divergence
```

Route Findings through PI as usual.

**Expected result**

The delivered implementation is reviewed through the same generic Graph Review capability used elsewhere.

**Verify before continuing**

No accepted Finding remains blocking before production exposure.

## Stage 3 — Deploy and observe through existing Operations semantics

### Step 6 — Deploy the accepted TrueLayer Evidence

**Run**

Use Kakeido's existing deployment/release mechanisms for every changed deployable surface.

For each genuine deployment event:

```bash
pnpm pactwright operations record-deployment <evidence-id>
pnpm pactwright operations validate
```

A backend/mobile multi-surface release may create distinct immutable Deployment records where they are genuinely distinct exposure events.

Do not define a TrueLayer-specific deployment model.

**Expected result**

Production exposure is traceable to exact Delivery Evidence/artifact identity.

**Verify before continuing**

Deployment records contain no credentials or raw provider payloads. Same-event retry does not duplicate where event identity is known; ambiguous retry-vs-redeployment remains an explicit Operations gap rather than being guessed.

### Step 7 — Configure bounded TrueLayer operational evidence

**Run**

Configure the minimum Operations source(s) needed to observe the integration through existing evidence systems, for example where supported by the accepted Kakeido architecture:

```text
provider API availability/latency
consent/token failures
sync/webhook failures
ingestion success/failure/duplication outcomes
```

Store only source configuration and provenance. Do not store raw TrueLayer payloads, credentials or unnecessary personal data in Pactwright state/logs.

Then:

```bash
pnpm pactwright operations validate
```

**Expected result**

The integration is observable using the generic Operations adapter/source model.

### Step 8 — Ingest, observe and govern production evidence

**Run**

```bash
pnpm pactwright operations ingest <source-id>
pnpm pactwright operations observe <source-id>
pnpm pactwright operations validate
```

For every Observation-derived PI Source:

```bash
pnpm pactwright intelligence triage <internal-source-id>

# where reviewed promotion is required and accepted
pnpm pactwright intelligence promote <internal-source-id>

pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright operations corrective-roadmap
```

**Expected result**

TrueLayer production behaviour enters the same Observation → PI governance path as every other operational surface.

**Verify before continuing**

No provider payload becomes a Project Graph node; no Observation directly creates or prioritises an Intent.

## Stage 4 — Prove a corrective loop when evidence justifies one

### Step 9 — Select one evidence-supported corrective candidate

If Operations evidence produces a material accepted PI candidate, capture an explicit Intent and deliver the correction through normal Delivery.

If the evidence is healthy and no corrective Delivery is justified, do not manufacture a defect merely to exercise the loop. Instead record that Graduation observed the integration without a corrective requirement and use other acceptance evidence to prove the feedback path is operational.

**Expected result**

Corrective work is driven by real evidence, not checkpoint choreography.

### Step 10 — Re-expose and re-observe any correction

If Step 9 produced a correction:

```text
Delivery → Evidence
→ real deployment
→ operations record-deployment
→ operations refresh
```

**Expected result**

Second-round evidence either confirms improvement, identifies further learning, or legitimately produces no new durable Observation.

## Stage 5 — Capture Pactwright graduation findings without changing Pactwright

**Execution location:** Pactwright repository root.

### Step 11 — Inventory generalisation failures

**Run**

Create a source document containing only Pactwright-level findings observed while using the fixed `0.1.0` system on TrueLayer, such as:

```text
installation/distribution friction
context selection failures
Production Skills composition problems
Graph Review misses
PI governance/context problems
Operations integration gaps
GitHub projection/reconciliation problems
open identity/idempotency gaps that became materially blocking
```

Separate those from Kakeido/TrueLayer-specific design choices.

### Step 12 — Ingest graduation findings into Pactwright PI

**Run**

```bash
pnpm pactwright intelligence ingest "<graduation-findings-path>"
pnpm pactwright intelligence triage <source-id>

# where reviewed promotion is required and accepted
pnpm pactwright intelligence promote <source-id>

pnpm pactwright intelligence derive-intent-roadmap
```

**Expected result**

Repeatable Pactwright responsibility failures become governed candidates for future Pactwright work.

**Verify before continuing**

No Pactwright runtime/Extension/Agent Pack code was changed during Graduation.

## Stage 6 — Final graduation acceptance

### Step 13 — Validate the full Kakeido Pactwright surface

**Run**

```bash
pnpm pactwright validate
pnpm pactwright intelligence validate
pnpm pactwright graph-review validate
pnpm pactwright assets validate
pnpm pactwright operations validate
pnpm pactwright github sync --dry-run
```

`assets validate` may report no relevant TrueLayer Asset work if the integration produced no Assets; the Extension must nevertheless remain valid when enabled.

**Expected result**

The complete installed Pactwright system remains coherent after a materially different external integration.

### Step 14 — Assess the six system-level acceptance dimensions

Record evidence for:

```text
Semantics
→ Kakeido financial/review/assistant meaning remained correct.

Execution
→ Pactwright could govern and deliver the integration.

Boundaries
→ provider semantics stayed inside the accepted Kakeido integration boundary; Pactwright ownership did not collapse.

Installation
→ fixed `0.1.0` packages worked in Kakeido without mid-graduation Pactwright changes.

Content
→ shipped Pactwright/Kakeido guidance was sufficient to execute the work or gaps were captured explicitly.

Feedback
→ operational/generalisation findings entered normal PI governance.
```

## Exit gate

Graduation passes only when:

- a current accepted Kakeido TrueLayer specification governs all provider-specific semantics;
- CSV and TrueLayer converge on compatible canonical Kakeido financial/review semantics;
- Graph Review uses explicit review requests, not named reviewer ids;
- relevant Production Skills are used without becoming Pactwright-specific semantics;
- no source-specific behaviour improperly leaks into Kakeido financial/review/Kei authority layers;
- TrueLayer deployment uses existing Operations Deployment semantics;
- production evidence uses existing Operations source/Observation semantics;
- raw provider payloads, credentials and unnecessary personal data remain outside canonical Pactwright state;
- any corrective work follows Observation → PI → explicit Intent → normal Delivery;
- open Deployment/Observation/evidence-retention identity gaps are not guessed around;
- all Pactwright validation surfaces remain coherent;
- Pactwright `0.1.0` itself was not modified during Graduation;
- repeatable Pactwright generalisation failures are captured as governed Pactwright evidence for future work;
- all six System-Level Acceptance dimensions have concrete supporting evidence.

---

**Pactwright — Graduation — TrueLayer v10**
