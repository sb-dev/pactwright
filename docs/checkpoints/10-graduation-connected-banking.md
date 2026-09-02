# Pactwright — Graduation — Connected Banking

**Version:** 1  
**Entry condition:** Checkpoint 9 is accepted, Kakeibo runs the exact accepted `0.1.0` registry packages, and an accepted Kakeibo connected-banking integration specification exists.  
**Current provider target:** Salt Edge Account Information  
**Exit capability:** A second financial-data source is added behind Kakeibo's canonical ingestion boundary without semantic drift, the integration is observed in production, and graduation findings become governed Pactwright evidence.

## 1. Goal

Use the complete Pactwright system on a materially different external integration while preserving Kakeibo financial, review, Kei, architecture, privacy and open-source semantics.

The architectural test is provider-neutral:

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
                    ↓
             bounded Kei
```

Salt Edge is the current planned first connected-banking implementation. Graduation must not make Salt Edge-specific concepts part of the general financial model.

---

## 2. Specification baseline

### Pactwright

- [Pactwright — Delivery Graph and Lifecycle Engineering Spec](../research-logs/2026-08-11-pactwright-delivery-graph-and-lifecycle-engineering-spec.md)
- [Pactwright — Distribution, Agents and Evaluation](../research-logs/2026-08-11-pactwright-distribution-agents-and-evaluation.md)
- [Pactwright — GitHub Actions and Views](../research-logs/2026-08-11-pactwright-github-actions-and-views.md)
- [Pactwright — Project Intelligence Graph Engineering Spec](../research-logs/2026-08-11-pactwright-project-intelligence-graph-engineering-spec.md)
- [Pactwright — Graph Review & Creative Delivery Engineering Spec](../research-logs/2026-08-11-pactwright-graph-review-and-creative-delivery-engineering-spec.md)
- [Pactwright — Operations Graph Engineering Spec](../research-logs/2026-08-11-pactwright-operations-graph-engineering-spec.md)
- [Pactwright — Operations Experiment Semantics](../research-logs/2026-09-02-pactwright-operations-experiment-semantics.md)
- [Pactwright — Implementation Principles](./00-implementation-principles.md)
- [Pactwright — Implementation Guide](./00-implementation-guide.md)
- [Kakeibo System-Level Acceptance Profile](./00-kakeibo-acceptance-profile.md)

### Kakeibo

At execution time use the current canonical Kakeibo repository sources:

```text
docs/specs/README.md
01-product-and-ux-spec.md
02-financial-domain-model-spec.md
03-kei-assistant-spec.md
04-mobile-design-system-spec.md
05-system-architecture-and-data-spec.md
06-engineering-delivery-and-operations-spec.md
07-open-source-project-organisation-spec.md
```

The accepted provider-specific connected-banking specification owns Salt Edge-specific connect, consent, callback, synchronisation and provider-error behaviour.

This runbook does not invent provider mechanics that the accepted Kakeibo spec does not define.

---

## 3. Execution contract

Every implementation action uses:

```text
Step
→ References
→ Run
→ Expected result
→ Verify before continuing
```

**Default execution location:** the Kakeibo repository root. The final feedback stage runs from the Pactwright repository root.

Repository/code changes finish with Kakeibo's repository-defined verification gate.

Land coherent repository changes through pull requests and required checks.

Dynamic ids come from earlier commands. Commands creating durable records must print ids required later.

Do not modify Pactwright core, extensions or agent packs during graduation. A Pactwright gap becomes governed future Pactwright work.

---

## 4. Graduation invariants

Graduation must preserve:

```text
FinancialSource source kind
≠ provider-specific connection details

provider/source lifecycle
≠ Kakeibo review truth

provider category / enrichment
≠ reviewed Kakeibo classification

provider cursor / watermark
≠ FinancialEntry identity

source re-import/synchronisation identity
≠ user-resolved financial duplicate
```

And:

- provider-specific fields stay behind `financial-ingestion` / provider boundaries;
- mobile does not poll providers continuously or hold provider secrets;
- callbacks are infrastructure signals, not canonical financial events;
- pending→posted or provider-record replacement preserves lineage and does not silently erase reviewed interpretation;
- no payment-initiation capability is implied;
- Salt Edge failure can be isolated while CSV ingestion and existing canonical history remain usable;
- provider labels/references remain untrusted input for Kei and cannot alter Kei policy/task selection;
- adding connected banking does not introduce another primary database, analytics system, review model or Kei authority model.

---

# Stage 1 — Govern the provider integration specification

## Step 1 — Ingest the accepted connected-banking specification

**References:** Project Intelligence ingestion/triage/promotion semantics; Kakeibo Acceptance Profile §14

**Run**

```bash
pnpm pactwright intelligence ingest "<Kakeibo-connected-banking-spec-path>"
pnpm pactwright intelligence triage <source-id>
```

Only when reviewed promotion is required and accepted:

```bash
pnpm pactwright intelligence promote <source-id>
```

Then:

```bash
pnpm pactwright intelligence onboard
pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright intelligence validate
pnpm pactwright validate
```

**Expected result**

Provider-specific behaviour enters normal Kakeibo Project Intelligence governance and appears as accepted Knowledge/candidates without creating an Intent automatically.

**Verify before continuing**

Confirm the accepted material preserves the generic ingestion boundary and does not redefine `FinancialEntry`, review truth or Kei authority.

## Step 2 — Review cross-spec impact before implementation

**References:** Graph Review; Kakeibo 02/03/04/05/06/07

**Run**

```bash
pnpm pactwright review run architecture-reviewer
pnpm pactwright review run product-strategist
pnpm pactwright review run ux-researcher
pnpm pactwright review run graph-auditor
```

For every internal Source id printed:

```bash
pnpm pactwright intelligence triage <source-id>
# promote only when required and accepted
```

Then:

```bash
pnpm pactwright intelligence derive-intent-roadmap
```

**Expected result**

Architecture/product/UX/privacy/Kei contradictions are surfaced before Delivery.

**Verify before continuing**

Every accepted concern traces to Review evidence and PI governance. No reviewer directly mutates Kakeibo truth.

---

# Stage 2 — Deliver the second ingestion source

## Step 3 — Capture and deliver the connected-banking outcome

**References:** Kakeibo 02 financial semantics; 05 §§9–21 and security sections; 06 provider testing/operations; accepted provider integration spec

**Run**

```text
/capture-intent "Add Salt Edge Account Information as Kakeibo's first connected financial-data source behind the existing FinancialSource → IngestionAdapter → NormalisedSourceRecord → FinancialEntry boundary. Preserve provider/source lifecycle separately from review truth; keep provider categories as preparation evidence only; preserve source lineage through reconciliation; keep provider credentials server-side; and satisfy the accepted connected-banking integration specification."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Expected result**

The implementation adds the provider adapter/connection mechanics needed by the accepted specification without creating a second downstream financial model.

**Verify before continuing**

Run Kakeibo verification and provider contract/integration tests covering at least the accepted applicable set:

```text
connection creation / hosted return
account discovery
initial sync
incremental sync
callback verification + idempotency
pending → posted reconciliation
provider record update/replacement
reconnect
connection removal
rate limit / retry
provider outage
```

Prove both CSV and Salt Edge converge through `NormalisedSourceRecord` to compatible `FinancialEntry` meaning.

## Step 4 — Prove source equivalence through the product

**References:** Kakeibo 01 review UX; 02 review/classification truth; 03 Kei; 04 mobile; 05 ingestion architecture

**Run**

```text
Complete one representative weekly review containing financial activity originating from both CSV and Salt Edge. Exercise Decisions, Group Checks, Looks Safe and All Spendings where applicable. Inspect one bounded Kei explanation over connected-provider-originated data.
```

Then:

```bash
pnpm pactwright review run architecture-reviewer
pnpm pactwright review run graph-auditor
```

**Expected result**

Normalised source origin does not create a second review model or provider-specific Kei authority.

**Verify before continuing**

Confirm:

- preparation remains distinct from reviewed truth;
- provider categories do not appear as user-confirmed Kakeibo truth without confirmation;
- pending/posted provider state is not confused with reviewed/unreviewed state;
- provider labels/reference text containing instruction-like content remains data for Kei;
- reviewed interpretations survive provider reconciliation according to the accepted architecture.

Route any accepted regression finding through PI.

---

# Stage 3 — Deploy and observe the provider integration

## Step 5 — Deploy the accepted Evidence

**References:** Operations Deployment; Kakeibo 06 delivery/rollout; Kakeibo Acceptance Profile

**Run**

```text
Execute Kakeibo's existing release mechanism for the accepted connected-banking Evidence. Use the normal backend path and the normal mobile path only when the accepted scope changed mobile/native surfaces. Report each exact artifact revision/locator and the Evidence id. Do not create a provider-specific release mechanism.
```

For each deployed artifact where Operations records a separate exposure:

```bash
pnpm pactwright operations record-deployment <evidence-id>
pnpm pactwright operations validate
```

**Expected result**

Exact delivered Evidence is distinguishable from production exposure.

**Verify before continuing**

Deployment records contain no provider credentials, tokens or raw provider payloads.

## Step 6 — Configure bounded operational evidence

**References:** Operations sources; Kakeibo 06 provider operations/signals/privacy

**Run**

```text
Configure or extend the minimum Kakeibo Operations source needed to observe the connected-banking integration through already adopted operational evidence. Cover useful provider/API/callback/synchronisation/reconciliation failures without copying raw financial/provider payloads into Pactwright. Print the source id.
```

Then:

```bash
pnpm pactwright operations validate
```

**Expected result**

Provider reliability is observable without turning Pactwright into a telemetry store.

**Verify before continuing**

Inspect configuration and logging boundaries. Credentials and sensitive payloads remain outside canonical Project Graph state.

## Step 7 — Observe and govern production evidence

**References:** Operations Observation → PI hand-off

**Run**

```bash
pnpm pactwright operations ingest <source-id>
pnpm pactwright operations observe <source-id>
pnpm pactwright operations validate
```

For every internal Source produced:

```bash
pnpm pactwright intelligence triage <internal-source-id>
# promote only when required and accepted
```

Then:

```bash
pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright operations corrective-roadmap
```

**Expected result**

Provider production behaviour follows the same Operations → PI governance path as other Kakeibo production evidence.

**Verify before continuing**

At least one meaningful success/failure or explicitly justified no-finding execution is traceable to bounded external evidence. Raw provider events remain outside the Project Graph.

---

# Stage 4 — Isolate provider failure

## Step 8 — Run the connected-banking failure drill

**References:** Kakeibo 05 connected-provider extension; Kakeibo 06 provider operations/rollback; Operations failure isolation

**Run**

```text
Safely simulate or exercise an accepted provider-outage/reconnect failure path. Disable or isolate connected-provider synchronisation without modifying trusted FinancialEntry history. Demonstrate that CSV ingestion and existing review/history remain usable. Restore normal provider operation using the documented recovery path.
```

**Expected result**

Connected banking is an optional source capability rather than a dependency of canonical financial truth.

**Verify before continuing**

Run Kakeibo financial/import tests and Pactwright validations before and after recovery. No reviewed history is silently deleted or reinterpreted.

---

# Stage 5 — Capture graduation findings as Pactwright evidence

**Execution location:** Pactwright repository root.

## Step 9 — Route generalisation findings through Pactwright PI

**References:** Implementation Principles feedback rule; Project Intelligence

**Run**

```text
Inventory Pactwright defects, friction and generalisation failures observed during connected-banking graduation. Separate Kakeibo/Salt-Edge-specific choices from repeatable Pactwright responsibility failures. Write only the latter as Pactwright finding sources; do not modify Pactwright runtime/extensions during graduation.
```

For each finding document:

```bash
pnpm pactwright intelligence ingest <finding-path>
pnpm pactwright intelligence triage <source-id>
# promote only when required and accepted
pnpm pactwright intelligence derive-intent-roadmap
```

**Expected result**

Graduation teaches Pactwright without turning provider-specific behaviour into Pactwright semantics.

**Verify before continuing**

Every blocking Pactwright finding is represented as governed evidence/candidate, and no mid-graduation Pactwright implementation change occurred.

---

## Exit gate

Graduation passes only when:

1. an accepted Kakeibo connected-banking specification owns provider mechanics;
2. provider-specific material entered normal PI governance before implementation;
3. CSV and Salt Edge converge through the same ingestion/normalisation contract;
4. provider lifecycle remains separate from Kakeibo review truth;
5. provider categorisation/enrichment cannot create reviewed classification truth;
6. pending→posted/provider-record reconciliation preserves lineage and user-reviewed interpretation;
7. the weekly review and bounded Kei behaviour remain source-independent after normalisation;
8. instruction-like provider text remains untrusted data for Kei;
9. exact Delivery Evidence is recorded as production Deployment without provider secrets/payloads;
10. provider operational evidence becomes Operations Observations without raw telemetry entering the graph;
11. provider outage can be isolated while CSV and trusted history remain usable;
12. no payment-initiation capability or second financial model was introduced implicitly;
13. graduation findings are captured as governed Pactwright evidence without changing Pactwright during the exercise;
14. all six System-Level Acceptance dimensions remain satisfied: semantics, execution, boundaries, installation, content and feedback.

---

**Pactwright — Graduation — Connected Banking v1**
