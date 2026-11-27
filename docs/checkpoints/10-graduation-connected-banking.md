# Pactwright — Graduation — Connected Banking

**Version:** 3\
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

## 2. Canonical baseline

### Pactwright

Pactwright behaviour is governed by the canonical specifications:

- [01 — Core System and Lifecycle](../specs/01-pactwright-core-system-and-lifecycle.md)
- [02 — Distribution, Agent Packs, Extensions and Evaluation](../specs/02-distribution-agent-packs-extensions-and-evaluation.md)
- [03 — Project Intelligence](../specs/03-project-intelligence.md)
- [04 — Graph Review](../specs/04-graph-review.md)
- [05 — Assets and Publication](../specs/05-assets-and-publication.md)
- [06 — Operations](../specs/06-operations.md)
- [07 — GitHub Integration](../specs/07-github-integration.md)
- [08 — Open-Source Project Organisation](../specs/08-open-source-project-organisation.md)
- [09 — Agent Methodology and Workflows](../specs/09-agent-methodology-and-workflows.md)
- [Pactwright — Operations Experiment Semantics](../research-logs/2026-09-02-pactwright-operations-experiment-semantics.md)
- [Pactwright — Implementation Principles](./00-implementation-principles.md)
- [Pactwright — Implementation Guide](./00-implementation-guide.md)
- [Kakeibo System-Level Acceptance Profile](./00-kakeibo-acceptance-profile.md)

Research logs and stale embedded Kakeibo copies in Pactwright are not authoritative.

Once accepted through Stage 1, the dedicated connected-banking specification owns provider-specific semantics such as:

```text
connect/consent flow
provider authentication/token handling
sync/webhook mechanics
provider-specific errors/retries
source mapping constraints
```

This runbook must not invent those semantics.

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

### Version 3 amendment

[PDI-CP07 amendment review (#139)](https://github.com/sb-dev/pactwright/pull/139) covers CP10-S01–S03 and CP10-S05–S10. Spec 00 §§5–6 governs the accepted run model and prior-feature use. Core §§27–39 and 55 govern Delivery authority and result integration. Agent Methodology §§5 and 7–10 govern entry, delegation, unattended methods, pack ownership and evaluation. Distribution §§5, 12, 14 and 16 govern the resolved environment, adapter entry and durable host state. GitHub Integration §§5–7 and 36 govern managed remote workflows and their trust boundary. PI §§11 and 21–24, Graph Review, Assets and Publication, Operations §§8–14 and GitHub Integration govern the evidence traced through the existing stages. Open-Source Project Organisation §§14–21 governs public claims.

The hashes use the Spec 00 §2 text normalisation, with the existing Graduation heading levels. Each section starts at its `## Step N —` heading and ends at the next step, stage or exit heading. The first step in each stage includes the `# Stage` heading and its introduction.

| Step | Version 3 prose SHA-256 |
| --- | --- |
| CP10-S01 | `dee8defa993bf47185dca7732de5769d8960fef1c9db456f57375bfb48a0c7c0` |
| CP10-S02 | `c57b5c1e984667e552834149e1fdb009ebb637aa726560b8fcc694adca850112` |
| CP10-S03 | `f26b615f9fb1b657c7f10d4180321be2689752b078ec34c8f2dc225d067de708` |
| CP10-S05 | `f3751967ccc856be11b3c58601c6f20d789d46dee221a2d6ed79a735d3024187` |
| CP10-S06 | `e3f6697a3b6b70479855c5855bf06ffab7fdd9660d80eb83a868741ed7b5ac9f` |
| CP10-S07 | `8968dc8d720700b7acd9c057d8f0f1fe5799405c9fc416da7e2993c10713a716` |
| CP10-S08 | `561064456114c764f8df990d037d738cefe8e3cfc041dc151400e34305f761d4` |
| CP10-S09 | `b557a4b90f075a1e3d68ceff9150bd9e0b17a8fbeefbf2e463cad0a2cde2dd48` |
| CP10-S10 | `64ffa227c5c4a82c72ad203afc2ac49e9d0f03b1ed45bb7b6c0fd881b1cee594` |

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

## 4. Graduation constraints and invariants

During Graduation:

- do not change Pactwright core, first-party Extensions or `@pactwright/standard` merely to make connected banking work;
- Pactwright gaps are captured as evidence for future governed Pactwright Delivery;
- do not create provider-specific Project Graph semantics when existing Kakeibo ingestion and Operations boundaries are sufficient;
- raw provider payloads, access tokens, refresh tokens, client secrets and unnecessary personal data never become Pactwright canonical state;
- use Production Skills appropriate to the implementation domain, but keep Kakeibo-specific and domain quality in those skills and Kakeibo specs rather than Pactwright semantics.

The delivery and feedback path remains:

```text
accepted Kakeibo spec
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

Before ingestion, record the CP09 acceptance and supported release evidence, the exact installed `0.1.0` package family, the selected Agent Pack and resolved lock, and the current accepted run model and controller. Use Spec 00 §§5–6 to identify each applicable prior facility, its owning step below, and the expected execution evidence. Record a reason for each facility that does not apply. A missing required facility blocks its dependent work.

Use the installed pack's supported advisory entry for initial scoping. Record the actual host invocation and resolved entry identity under Distribution §§5, 12 and 14 and Spec 09 §5. Verify that advice leaves Delivery records and execution state unchanged. Record the accepted provider specification as a Source and trace reviewed conclusions through human-approved Knowledge to eligibility on the existing PI roadmap. Use the readiness and dependency checks in PI §§11 and 21–23 before selecting work.

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

Record independent reviewers, the accepted input revisions and the affected requirements under Graph Review. When the adapter crosses several Deliveries or owners, use the governing combined acceptance requirement to check that both source paths produce consistent downstream meaning. Trace accepted Findings to their PI Sources and any human-approved Knowledge. Keep the responsible owner and next action visible for unresolved findings.

---

# Stage 2 — Deliver the second ingestion source

## Step 3 — Capture and deliver the connected-banking outcome

**References:** Kakeibo 02 financial semantics; 05 §§9–21 and security sections; 06 provider testing/operations; accepted provider integration spec

**Run**

Use the accepted software run model and the existing generated adapter for governed work. Record the accountable capability owners, any active Production Skills and the resolved identities used. Trace specialist assignments, accepted results and independent review to the governing Contract and Brief under Core §§27–39 and Spec 09 §§5 and 7–8. For remote work, bound the assignment under Spec 09 §§7–8 and use the managed GitHub workflow under Spec 07 §§5–7 and 36. Retain the assignment and attempt identities in durable host state under Distribution §14. Before integrating the returned result, check its dispatch identity, freshness and current authority under Core §§34 and 55. Trace the applicable CP09 correction or continuation path to its observed result or blocker. Preserve accepted Evidence and consumed limits when current-policy restart or reconciliation applies.

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

Read back the actual release or deployment at its destination and trace the exact revision to the governing Evidence. For any in-scope public guidance or release Asset, use the accepted Asset approval and Publication path and retain the approved revision, destination and actual Publication. Use accepted GitHub projections where applicable to show the accountable owner, verified outcome or blocker and next permitted action from the governing records.

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

Record the intended measure, counting rule, exposure, observation window, comparison baseline where applicable and evidence limits under Operations §§8–14. Use privacy-safe references that allow the result to be checked without copying sensitive input into the graph.

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

Trace actual Deployment or Publication exposure to the Observation and any PI Source. Report fulfilment, exposure and observed outcome separately. Distinguish insufficient evidence from collection failure. Where Publication Feedback applies, use the accepted CP07 path against the actual Publication. Route qualified new meaning through human Knowledge approval before changing plan readiness or proposing governed Delivery. For recurring work, record the current occurrence's disposition and the continuing policy under PI §23.

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

Record the failure drill, observed isolation and recovery, evidence, accountable owner and next permitted action for any blocker. If recovery crosses an interrupted external write, use the accepted CP09 reconciliation path. Read back the destination before retry, reuse a confirmed effect and stop on an ambiguous result. Report unavailable recovery as a blocker where required by the accepted path.

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

For each Pactwright finding, retain a privacy-safe link to the observed failure and identify the accountable owner, blocker or disposition and next permitted action. Route reusable domain-method findings to the owning Production Skills family. Route pack-method findings to the pack owner under Spec 09 §9. Project Knowledge and future Delivery remain under normal PI governance. Retain the earlier Evidence when future work changes direction.

---

## Step 10 — Assess the six system-level acceptance dimensions

Record evidence for:

```text
Semantics
→ Kakeibo financial/review/assistant meaning remained correct.

Execution
→ Pactwright could govern and deliver the integration.

Boundaries
→ provider semantics stayed inside the accepted Kakeibo integration boundary; Pactwright ownership did not collapse.

Installation
→ fixed `0.1.0` packages worked in Kakeibo without mid-graduation Pactwright changes.

Content
→ shipped Pactwright/Kakeibo guidance was sufficient to execute the work or gaps were captured explicitly.

Feedback
→ operational/generalisation findings entered normal PI governance.
```

Attach the entry inventory from Step 1 to the six-dimension evidence. For each applicable facility, record the exact accepted configuration, owning step, actual execution path, Evidence or effect reference, and verified result or blocker. For evaluated pack methods, record the invoker, judge and cases that ran under Spec 09 §10. Record unavailable execution as **not evaluated** and missing semantic judgement as **unjudged**. Verify public claims against exercised paths under Spec 08 §§14–21 and record gaps with an accountable owner and next permitted action.

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
14. all six System-Level Acceptance dimensions remain satisfied: semantics, execution, boundaries, installation, content and feedback;
15. every applicable prior facility has current execution evidence under Spec 00 §6, and each blocking gap has been corrected and reverified.

---

**Pactwright — Graduation — Connected Banking v3**
