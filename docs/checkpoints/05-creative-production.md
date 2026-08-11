# Pactwright — Checkpoint 5 — Creative Production

**Version:** 3 
**Entry condition:** Checkpoint 4 is accepted. 
**Exit capability:** Grounded creative Delivery can produce a human-approved immutable Asset and Publication in Pactwright and Kakeido.

## 1. Goal

Complete the Creative Delivery half of Review & Creative, including grounding, verification, Asset approval, Publication and Generation Guidance, then publish real work in both projects.

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

- **Creative lifecycle/grounding/verification** — Review & Creative §§9–11
- **Asset/Publication** — Review & Creative §§12–13
- **Generation runtime/guidance/cost** — Review & Creative §§14–18
- **Commands/validation/automation** — Review & Creative §§19–24; GitHub §§7, 14, 22–23
- **Kakeido creative constraints** — Kei §§4–19; Product & UX §§3,10; Mobile Design §§1–18

## Stage 1 — Add creative Brief grounding to normal Delivery

Extend Delivery context without creating a second lifecycle.

### Step 1 — Implement creative Brief contribution

**References:** Review & Creative §9

**Run**

```text
Implement Review & Creative's contribution to normal Delivery Briefs: modality, target channel/surface, format constraints, task class, grounding manifest, identity/voice context and verification requirements. Keep Brief ownership in Delivery and do not introduce an Asset Brief node.
```

**Expected result**

A normal Delivery Brief can express creative work requirements.

**Verify before continuing**

Create fixture creative/non-creative Briefs and confirm only creative work gets the extension contribution.

### Step 2 — Implement explicit grounding manifests

**References:** Review & Creative §10; PI §13

**Run**

```text
Implement creative grounding as Project Graph id + content hash pairs. Factual project claims must be supportable by grounding; applicable outbound language requires current accepted identity/voice knowledge. Challenged/superseded/retracted grounding must be surfaced for unapproved work.
```

**Expected result**

Creative outputs are traceably grounded in accepted project truth.

**Verify before continuing**

Run fixtures for valid, missing, hash-mismatched and challenged grounding.

## Stage 2 — Implement creative execution and verification

Reuse core deliver-brief/review responsibilities.

### Step 3 — Implement `creative-delivery` capability

**References:** Review & Creative §9

**Run**

```text
Implement the creative-delivery extension capability invoked by the existing deliver-brief responsibility. Candidate outputs and generation attempts stay execution/transient state; generation must not create Asset nodes. Support one first tested modality end-to-end.
```

**Expected result**

Creative execution plugs into normal Delivery.

**Verify before continuing**

Run a fixture creative Brief through delivery and inspect that no Asset exists before approval.

### Step 4 — Implement independent `creative-verification`

**References:** Review & Creative §11

**Run**

```text
Implement creative-verification in the core Review stage. Check grounding, Contract/Brief adherence, identity/voice, target format/channel, accessibility and applicable rights/safety constraints. Blocking findings prevent successful Evidence. Do not judge real-world publication performance here.
```

**Expected result**

Creative Delivery quality is reviewed before Evidence and remains distinct from Operations performance.

**Verify before continuing**

Run one deliberately ungrounded/voice-breaking candidate and confirm Evidence cannot represent successful Delivery.

## Stage 3 — Implement Asset approval and immutability

Create canonical durable creative outputs only after explicit human approval.

### Step 5 — Implement Asset schema/edges/supersession

**References:** Review & Creative §12

**Run**

```text
Implement immutable Asset semantics: media type, exact content_hash, storage_pointer, Delivery Evidence, Generation Records, grounding, human approved_by/approved_at, evidence --produces--> asset, grounded-in and same-type supersedes. Candidate outputs remain non-canonical.
```

**Expected result**

An Asset is the exact approved durable output.

**Verify before continuing**

Run fixtures for valid Asset, missing Evidence, missing human approval, hash mismatch and supersession.

### Step 6 — Implement `creative approve-asset`

**References:** Review & Creative §§12, 19

**Run**

```text
Implement pactwright creative approve-asset <evidence-id>. Require reviewed successful Delivery Evidence plus explicit human approval of the exact content hash. Creation must go through Pactwright graph mutation and validation.
```

**Expected result**

Human approval creates the canonical Asset record and only for the reviewed bytes.

**Verify before continuing**

After installation, approve a fixture then alter the repository-backed bytes and confirm `creative validate` fails.

## Stage 4 — Implement Publication

Record real release of an approved Asset without mutating it.

### Step 7 — Implement Publication schema/edge

**References:** Review & Creative §13

**Run**

```text
Implement Publication semantics: approved Asset reference/hash, channel, locator, published_by and published_at plus publication --publishes--> asset. Publication is post-Delivery extension state and never mutates Asset/Evidence.
```

**Expected result**

A publication records exact exposure of an approved Asset.

**Verify before continuing**

Run valid/invalid Publication fixtures including unapproved Asset and hash mismatch.

### Step 8 — Implement `creative record-publication`

**References:** Review & Creative §§13, 19

**Run**

```text
Implement pactwright creative record-publication <asset-id> <channel>. Validate approval/hash/channel; record Publication after the project/channel mechanism actually releases the Asset. Keep channel-specific publishing mechanics outside canonical Publication semantics.
```

**Expected result**

Only approved Assets become canonical Publications.

**Verify before continuing**

Record a fixture Publication and run `pactwright creative validate`.

## Stage 5 — Implement Generation Guidance and evaluation

Allow fast-moving provider/model guidance to evolve outside graph semantics.

### Step 9 — Implement guidance resolution/provenance

**References:** Review & Creative §17

**Run**

```text
Implement standard guidance → project override resolution under .pactwright/review-creative/generation-guidance. Guidance versions are immutable when selected and each Generation Record stores exact ids/versions/hashes.
```

**Expected result**

Generation behaviour is versioned and reproducible.

**Verify before continuing**

Run a fixture with standard + project override and inspect resolved provenance.

### Step 10 — Implement generation-reviewer evaluation loop

**References:** Review & Creative §17; Distribution §16

**Run**

```text
Implement generation-reviewer proposals and candidate-guidance comparison through pactwright eval. Hold provider/model/task input/Brief/grounding/prompt constant where practical. Report grounding, adherence, format, verification failures, regeneration, human preference and cost without a single aggregate score.
```

**Expected result**

Guidance can improve through normal eval + human merge.

**Verify before continuing**

Run `pnpm pactwright eval` with one baseline/candidate guidance fixture.

### Step 11 — Implement execution-local generation budgets

**References:** Review & Creative §18

**Run**

```text
Implement command-local GenerationBudget enforcement in Provider Runtime/task config. Refuse an avoidable call that would exceed remaining budget and record actual usage/cost. Do not add period-wide accounting.
```

**Expected result**

Creative provider use has a lean cost guardrail.

**Verify before continuing**

Run one within-budget and one over-budget fixture.

## Stage 6 — Complete creative GitHub integration

Project grounding/Asset/Publication state without moving approval into GitHub.

### Step 12 — Implement creative checks/PR summary/views

**References:** GitHub §§7, 14, 22–23

**Run**

```text
Complete Review & Creative GitHub integration: Creative Grounding check, Publication check, creative PR summary, Assets view and Publications view. Repository-backed Asset byte changes must trigger hash validation. GitHub approval metadata alone must never create an Asset.
```

**Expected result**

GitHub exposes creative state but cannot approve/publish by itself.

**Verify before continuing**

Run sync/dry-run; use a fixture GitHub approval without Asset record and prove no canonical Asset appears.

## Stage 7 — Publish real Pactwright work

Use Creative Delivery on the open-source project.

### Step 13 — Deliver one grounded Pactwright public asset

**References:** Open-Source Project Organisation §§3–14; Review & Creative §§9–13

**Run**

```text
/capture-intent "Create one real Pactwright public asset for the website, README, Docs, Academy, case study or blog, grounded in current accepted Pactwright knowledge."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Expected result**

A real public output reaches reviewed Evidence with explicit grounding.

**Verify before continuing**

Inspect Evidence and grounding manifest; confirm no Asset exists yet.

### Step 14 — Human-approve the exact Pactwright output

**References:** Review & Creative §12

**Run**

```bash
pnpm pactwright creative approve-asset <evidence-id>
pnpm pactwright creative validate
```

**Expected result**

An immutable Asset is created for the exact reviewed content hash.

**Verify before continuing**

Inspect Asset record and verify human approver, Evidence and grounding.

### Step 15 — Publish and record the Pactwright Asset

**References:** Review & Creative §13

**Run**

```bash
pnpm pactwright creative record-publication <asset-id> <channel>
pnpm pactwright creative validate
```

**Expected result**

A canonical Publication references the approved Asset/hash.

**Verify before continuing**

Inspect Publication and verify it does not mutate Asset/Evidence.

## Stage 8 — Publish real Kakeido work

Prove creative grounding/voice on a different product.

### Step 16 — Upgrade Review & Creative in Kakeido

**References:** Distribution §15

**Run**

```bash
pnpm add -D pactwright@<checkpoint-version>
pnpm pactwright extension upgrade review-creative
pnpm pactwright sync
pnpm pactwright creative validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

**Expected result**

Kakeido uses the checkpoint creative runtime.

**Verify before continuing**

Run `pnpm pactwright validate`.

### Step 17 — Deliver grounded Kakeido public content

**References:** Kei §§4–19; Product & UX §§3,10; Mobile Design §§1–18

**Run**

```text
/capture-intent "Create one real Kakeido public asset such as trykakeido.com copy, a Kei introduction, onboarding illustration or store asset. Ground factual/product claims in accepted Kakeido knowledge and preserve Kei/Product/Mobile constraints."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Expected result**

The output is calm, non-judgemental, evidence-bounded and visually/product-consistent.

**Verify before continuing**

Review specifically for no adviser claims, no confidence-score language, preserved uncertainty and no mascot-dominant behaviour.

### Step 18 — Approve/publish Kakeido Asset

**References:** Review & Creative §§12–13

**Run**

```bash
pnpm pactwright creative approve-asset <evidence-id>
pnpm pactwright creative record-publication <asset-id> <channel>
pnpm pactwright creative validate
```

**Expected result**

Kakeido has a real approved Asset and Publication.

**Verify before continuing**

Inspect exact hashes/grounding/approval and published surface.

## Exit gate

Both projects have delivered, human-approved and published real grounded creative work through the normal Delivery lifecycle; candidate generations remain non-canonical; Asset/Publication invariants and GitHub projection boundaries pass.

---

**Pactwright — Checkpoint 5 — Creative Production v3**
