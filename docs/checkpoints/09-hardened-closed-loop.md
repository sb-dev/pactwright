# Pactwright — Checkpoint 9 — Hardened Closed Loop

**Version:** 3 
**Entry condition:** Checkpoint 8 is accepted. 
**Exit capability:** The complete first-party system is evaluated, failure-hardened, documented and repeatedly proven in closed loops on Pactwright and Kakeido.

## 1. Goal

Turn real failures into evaluation coverage, harden only observed weak points, complete the initial public product and prove repeated production-feedback loops.

## 2. Specification baseline

- [Pactwright — Delivery Graph and Lifecycle Engineering Spec](../research-logs/2026-08-11-pactwright-delivery-graph-and-lifecycle-engineering-spec.md)
- [Pactwright — Distribution, Agents and Evaluation](../research-logs/2026-08-11-pactwright-distribution-agents-and-evaluation.md)
- [Pactwright — GitHub Actions and Views](../research-logs/2026-08-11-pactwright-github-actions-and-views.md)
- [Pactwright — Project Intelligence Graph Engineering Spec](../research-logs/2026-08-11-pactwright-project-intelligence-graph-engineering-spec.md)
- [Pactwright — Graph Review & Creative Delivery Engineering Spec](../research-logs/2026-08-11-pactwright-graph-review-and-creative-delivery-engineering-spec.md)
- [Pactwright — Operations Graph Engineering Spec](../research-logs/2026-08-11-pactwright-operations-graph-engineering-spec.md)
- [Pactwright — System Architecture](../research-logs/2026-08-11-pactwright-system-architecture.md)
- [Pactwright — Implementation Principles](./00-implementation-principles.md)
- [Pactwright Open-Source Project Organisation](../research-logs/2026-08-11-pactwright-open-source-project-organisation.md)
- [Design Specification: Astro + Cloudflare Workers + Meta CAPI](../research-logs/2026-08-11-astro-design-spec.md)
- [Kakeido — Financial Model Spec](../research-logs/2026-08-11-kakeido-financial-model-spec.md)
- [Kakeido — Product & UX Spec](../research-logs/2026-08-11-kakeido-product-and-ux-spec.md)
- [Kakeido — Mobile Design Spec](../research-logs/2026-08-11-kakeido-mobile-design-spec.md)
- [Kei — Assistant Spec](../research-logs/2026-08-11-kakeido-assistant-spec.md)
- [Kakeido — Tech Stack Engineering Spec](../research-logs/2026-08-11-kakeido-tech-stack-engineering-spec.md)

Only the owning specifications listed in each step define semantics. This runbook defines execution order, not new product meaning.

## 3. Execution contract

Every implementation action is a runnable step with the same shape:

```text
Step
→ References
→ Run (prompt or command)
→ Expected result
→ Verify
→ continue only if verification passes
```

Use a prompt for repository/code changes. Once Pactwright owns a deterministic operation, use the Pactwright command instead of asking the model to emulate it.

Lifecycle adapter commands become available only after Checkpoint 1 generates the active adapter.

## 4. Checkpoint specification map

- **Evaluation** — Distribution §16; Review & Creative §17; Operations §21
- **Definitions of Done/future boundary** — Delivery §§24–26; PI §§17–20; Review & Creative §§21–26; Operations §§22–29; GitHub §§26–28
- **Public project** — Open-Source Project Organisation §§3–16

## Stage 1 — Convert observed failures into evaluation cases

Ground hardening in evidence from Checkpoints 1–8.

### Step 1 — Inventory repeatable failures by owner

**References:** Implementation Principles §§14–17; owning specs

**Run**

```text
Review Pactwright Evidence, Review findings, Operations Observations, test failures and Kakeido acceptance failures from Checkpoints 1–8. Produce a bounded evaluation inventory grouped by Delivery, Project Intelligence, Graph Review, Creative Delivery, Operations and Distribution/GitHub. Include only repeatable responsibility failures; exclude one-off taste. Point every case to concrete prior evidence.
```

**Expected result**

A traceable evaluation backlog exists before new test code.

**Verify before continuing**

Manually inspect that every candidate has concrete provenance and an owning capability.

### Step 2 — Implement Delivery evaluation fixtures

**References:** Distribution §16; Delivery §24

**Run**

```text
Implement the accepted Delivery evaluation cases for contract fidelity, scope discipline, required structure, forbidden mutation and Review defect detection. Keep deterministic assertions separate from semantic judgement.
```

**Expected result**

Observed core Delivery failures become repeatable tests.

**Verify before continuing**

Run `pnpm pactwright eval` and inspect Delivery cases individually.

### Step 3 — Implement PI evaluation fixtures

**References:** Distribution §16; PI §§8–13

**Run**

```text
Implement accepted Project Intelligence evaluation cases for triage, consequence class, evidence comparison, context selection, roadmap provenance and no automatic Intent creation.
```

**Expected result**

Observed Intelligence failures become repeatable tests.

**Verify before continuing**

Run `pnpm pactwright eval` and inspect PI cases individually.

### Step 4 — Implement Review/Creative evaluation fixtures

**References:** Distribution §16; Review & Creative §§6–17

**Run**

```text
Implement accepted Graph Review and Creative Delivery evaluation cases for scope/finding support/routing, Brief adherence, grounding, Kakeido/Kei voice constraints, independent verification and Generation Guidance.
```

**Expected result**

Review/Creative failures are measurable.

**Verify before continuing**

Run eval and inspect Review/Creative cases individually.

### Step 5 — Implement Operations evaluation fixtures

**References:** Operations §21

**Run**

```text
Implement accepted Operations evaluation cases for signal compression, exposure attribution, baselines, unsupported causality, duplicate handling, positive findings and PI hand-off.
```

**Expected result**

Production-analysis failures are measurable.

**Verify before continuing**

Run eval and inspect Operations cases individually.

## Stage 2 — Baseline agent behaviour and harden observed failures

Improve reliability without speculative new semantics.

### Step 6 — Run the complete evaluation suite

**References:** Distribution §16

**Run**

```bash
pnpm pactwright eval
```

**Expected result**

A per-capability/per-case result set exists.

**Verify before continuing**

No release decision relies on a single aggregate score.

### Step 7 — Compare candidate agent-pack behaviour

**References:** Distribution §16

**Run**

```bash
pnpm pactwright eval \
 --baseline @pactwright/standard@<released-version> \
 --candidate <candidate-pack>
```

**Expected result**

Regressions/improvements are visible by case/capability.

**Verify before continuing**

Review every regression and either fix or explicitly accept it with rationale.

### Step 8 — Implement only observed hardening fixes

**References:** All owning specs; future-improvement sections

**Run**

```text
Implement fixes only for concrete failure modes observed in Checkpoints 1–8 or evaluation. Preserve owning-spec semantics and do not pull Future Improvements into the core without observed need. Add a regression fixture for each fix.
```

**Expected result**

Known failure paths fail closed/reliably without expanding semantics unnecessarily.

**Verify before continuing**

Run full project tests plus `pnpm pactwright eval`.

### Step 9 — Run the full validation matrix

**References:** All owning specs

**Run**

```bash
pnpm pactwright validate
pnpm pactwright intelligence validate
pnpm pactwright creative validate
pnpm pactwright operations validate
pnpm pactwright github sync --dry-run
pnpm pactwright eval
```

**Expected result**

Canonical state is valid, projections converged and eval results understood.

**Verify before continuing**

All deterministic validations pass; any semantic eval regressions are explicitly resolved.

## Stage 3 — Complete the initial Pactwright public product

Make shipped content match actual implemented capability.

### Step 10 — Audit public surfaces against actual product state

**References:** Open-Source Project Organisation §§3–16

**Run**

```text
Inspect README, Docs, Academy, Examples, Extensions, Website, Case Studies and Blog against the current implemented Pactwright capability. Identify only gaps needed for the initial Discover → Understand → Try → Learn → Extend → Contribute journey. Do not document unimplemented future behaviour. Return a bounded backlog ordered by user-blocking impact.
```

**Expected result**

A content/product backlog exists based on real current behaviour.

**Verify before continuing**

Review the backlog against repository truth and remove aspirational items.

### Step 11 — Deliver each blocking public-surface gap through Pactwright

**References:** Open-Source Project Organisation; Delivery/Creative specs

**Run**

```text
/capture-intent "<highest-priority blocking public-product gap>"
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Expected result**

The initial public journey is coherent and grounded in implemented capability.

**Verify before continuing**

Repeat this step only for blocking gaps identified by the audit; run relevant validation after each.

### Step 12 — Create the Pactwright-building-Pactwright case study

**References:** Open-Source Project Organisation §15; Review & Creative §§9–13

**Run**

```text
Inspect canonical Pactwright graph/Evidence, Review Executions/findings, Publications and Operations Observations from the implementation programme. Prepare a factual grounding set for a Pactwright-building-Pactwright case study covering bootstrap, self-hosted Delivery, PI, Graph Review, Creative Delivery, Operations feedback and corrective Delivery. Do not invent milestones or outcomes.
```

**Expected result**

The case study can be produced from repository evidence.

**Verify before continuing**

Deliver it via Creative Delivery, approve the exact Asset and record its Publication.

## Stage 4 — Prove a repeated closed loop on Pactwright

Show that a correction can itself be observed after exposure.

### Step 13 — Collect a real Pactwright production finding

**References:** Operations §§11–15

**Run**

```bash
pnpm pactwright operations refresh
pnpm pactwright operations validate
```

**Expected result**

A new or matched operational finding is produced from a real surface.

**Verify before continuing**

Inspect Operations execution and any Observation.

### Step 14 — Route the finding and deliver a correction

**References:** Operations §13; PI §11; Delivery §19

**Run**

```bash
pnpm pactwright intelligence triage <internal-source-id>
```

**Run**

```bash
# if reviewed promotion is required
pnpm pactwright intelligence promote <internal-source-id>
pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright operations corrective-roadmap
```

**Run**

```text
/capture-intent "<accepted corrective outcome>"
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Expected result**

A production finding becomes normal Delivery only through PI governance.

**Verify before continuing**

Trace Observation → Source → candidate → Intent → Evidence.

### Step 15 — Expose the correction and observe again

**References:** Operations §§7–16

**Run**

```bash
pnpm pactwright operations record-deployment <evidence-id>
pnpm pactwright operations refresh
```

**Expected result**

Second-round production evidence either validates the correction, creates new learning or exposes another explicit issue.

**Verify before continuing**

Confirm prior Evidence/Observation records remain immutable and any changed operational truth uses a new Observation/supersession.

## Stage 5 — Prove the hardened full loop on Kakeido

Repeat the same model on the external product and guard its domain semantics.

### Step 16 — Upgrade/reconcile Kakeido fully

**References:** Distribution §15

**Run**

```bash
pnpm add -D pactwright@<checkpoint-version>
pnpm pactwright extension upgrade project-intelligence
pnpm pactwright extension upgrade review-creative
pnpm pactwright extension upgrade operations
pnpm pactwright sync
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

**Expected result**

Kakeido runs the hardened checkpoint release.

**Verify before continuing**

Run all four graph validations plus `pnpm pactwright eval`.

### Step 17 — Run a Kakeido regression Review

**References:** Kakeido specs; Review & Creative §7

**Run**

```bash
pnpm pactwright review run product-strategist
pnpm pactwright review run ux-researcher
pnpm pactwright review run architecture-reviewer
pnpm pactwright review run graph-auditor
```

**Expected result**

Core Financial/Product/Mobile/Kei/Tech Stack semantics remain coherent.

**Verify before continuing**

Inspect findings specifically for financial double counting, review IA drift, direct mobile→DB access, and Kei authority/uncertainty regressions.

### Step 18 — Complete one real Kakeido closed loop

**References:** Operations/PI/Delivery specs

**Run**

```text
Using current Kakeido state, select one real production Observation with accepted meaning. Execute the real Pactwright commands to route it through PI, capture/deliver the resulting Intent, expose the result as Deployment or Publication, and run Operations again. Record the exact command sequence and trace IDs from Observation through the later Observation.
```

**Expected result**

The external product proves the same closed-loop architecture after hardening.

**Verify before continuing**

Review the full trace and run Kakeido repository-defined tests plus Pactwright validations.

## Stage 6 — Run failure drills

Prove failures remain isolated to their owning boundaries.

### Step 19 — Execute the final failure matrix

**References:** All owning specs

**Run**

```text
Run safe fixture drills for: invalid extension dependency removal; invalid Asset hash; Deployment with invalid Evidence; duplicate Observation; stale PI derived report; GitHub Project drift; missing agent-pack capability; Kakeido classification suggestion attempting canonical mutation; failed Operations collection; failed Review provider call. For each, execute the real Pactwright path, record the expected failure boundary and prove unrelated canonical state remains valid.
```

**Expected result**

Known failure boundaries fail closed and do not corrupt sibling/core truth.

**Verify before continuing**

Review the evidence for all ten drills; rerun the full validation matrix.

## Exit gate

The complete first-party system repeatedly closes the loop in Pactwright and Kakeido; real failures are represented in evaluation; public surfaces match actual capability; GitHub/projections converge; failure drills preserve ownership; no speculative future semantics were introduced merely for completeness.

---

**Pactwright — Checkpoint 9 — Hardened Closed Loop v3**
