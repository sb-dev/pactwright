# Pactwright — Checkpoint 5 — Creative Production

**Version:** 8 
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

**Default execution location:** the Pactwright repository root unless the step explicitly names Kakeido or a fixture

For repository/code changes, finish with `pnpm verify`. Before invoking a newly implemented Pactwright runtime command during implementation, run `pnpm build` so the repository-local CLI is not using stale distribution output.

After Checkpoint 2 activates GitHub, land coherent repository changes through pull requests and required checks rather than direct default-branch commits.

Dynamic ids such as `<source-id>`, `<brief-id>` and `<evidence-id>` must come from an earlier command in the runbook. Commands that create or resolve durable records must print the ids required by later steps.

Fixture verification means repository test fixtures unless a step explicitly creates a real repository or GitHub resource.

## 4. Checkpoint specification map

- **Creative lifecycle/grounding/verification** — Pactwright — Graph Review & Creative Delivery Engineering Spec §§9–11
- **Asset/Publication** — Pactwright — Graph Review & Creative Delivery Engineering Spec §§12–13
- **Generation runtime/guidance/cost** — Pactwright — Graph Review & Creative Delivery Engineering Spec §§14–18
- **Commands/validation/automation** — Pactwright — Graph Review & Creative Delivery Engineering Spec §§19–24; Pactwright — GitHub Actions and Views §§7, 14, 22–23
- **Kakeido creative constraints** — Kei — Assistant Spec §§4–19; Kakeido — Product & UX Spec §§3,10; Kakeido — Mobile Design Spec §§1–18

## Stage 1 — Add creative Brief grounding to normal Delivery

Extend Delivery context without creating a second lifecycle.

### Step 1 — Implement creative Brief contribution

**References:** Creative lifecycle/grounding/verification §9

**Run**

```text
Implement Review & Creative's contribution to normal Delivery Briefs: modality, target channel/surface, format constraints, task class, grounding manifest, identity/voice context and verification requirements.

For public creative work, perform a Project Intelligence readiness preflight before generation:
- `identity` must be Covered;
- `content` must be Covered for editorial/educational/marketing work;
- `product` must be Covered for product/capability/value claims;
- `go-to-market` must be Covered for acquisition/positioning/campaign work;
- any domain needed for factual claims must be Covered.

If readiness is insufficient, stop before generation and report the missing domains/Knowledge. Do not let the generation model fill the gap. Keep Brief ownership in Delivery and do not introduce an Asset Brief node.
```

**Expected result**

A normal Delivery Brief can express creative work requirements.

**Verify before continuing**

Create fixture creative/non-creative Briefs and confirm only creative work gets the extension contribution. Add fixtures proving public creative generation is blocked when `identity` is not Covered and when required subject knowledge is missing.

### Step 2 — Implement explicit grounding manifests

**References:** Creative lifecycle/grounding/verification §10; PI §13

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

**References:** Creative lifecycle/grounding/verification §9

**Run**

```text
Implement the creative-delivery extension capability invoked by the existing deliver-brief responsibility. Candidate outputs and generation attempts stay execution/transient state; generation must not create Asset nodes. Support one first tested modality end-to-end.
```

**Expected result**

Creative execution plugs into normal Delivery.

**Verify before continuing**

Run a fixture creative Brief through delivery and inspect that no Asset exists before approval.

### Step 4 — Implement independent `creative-verification`

**References:** Creative lifecycle/grounding/verification §11

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

**References:** Asset/Publication §12

**Run**

```text
Implement immutable Asset semantics: media type, exact content_hash, storage_pointer, Delivery Evidence, Generation Records, grounding, human approved_by/approved_at, evidence --produces--> asset, grounded-in and same-type supersedes. Candidate outputs remain non-canonical.
```

**Expected result**

An Asset is the exact approved durable output.

**Verify before continuing**

Run fixtures for valid Asset, missing Evidence, missing human approval, hash mismatch and supersession.

### Step 6 — Implement `creative approve-asset`

**References:** Asset/Publication §12; Commands/validation/automation §19

**Run**

```text
Implement pactwright creative approve-asset <evidence-id>. Require reviewed successful Delivery Evidence plus explicit human approval of the exact content hash. Creation must go through Pactwright graph mutation and validation and print the created Asset id.
```

**Expected result**

Human approval creates the canonical Asset record and only for the reviewed bytes.

**Verify before continuing**

After installation, approve a fixture then alter the repository-backed bytes and confirm `creative validate` fails.

## Stage 4 — Implement Publication

Record real release of an approved Asset without mutating it.

### Step 7 — Implement Publication schema/edge

**References:** Asset/Publication §13

**Run**

```text
Implement Publication semantics: approved Asset reference/hash, channel, locator, published_by and published_at plus publication --publishes--> asset. Publication is post-Delivery extension state and never mutates Asset/Evidence.
```

**Expected result**

A publication records exact exposure of an approved Asset.

**Verify before continuing**

Run valid/invalid Publication fixtures including unapproved Asset and hash mismatch.

### Step 8 — Implement `creative record-publication`

**References:** Asset/Publication §13; Commands/validation/automation §19

**Run**

```text
Implement pactwright creative record-publication <asset-id> <channel>. Validate approval/hash/channel; record Publication after the project/channel mechanism actually releases the Asset; print the Publication id. Keep channel-specific publishing mechanics outside canonical Publication semantics.
```

**Expected result**

Only approved Assets become canonical Publications.

**Verify before continuing**

Record a fixture Publication and run `pactwright creative validate`.

## Stage 5 — Implement Generation Guidance and evaluation

Allow fast-moving provider/model guidance to evolve outside graph semantics.

### Step 9 — Implement guidance resolution/provenance

**References:** Generation runtime/guidance/cost §17

**Run**

```text
Implement standard guidance → project override resolution under .pactwright/review-creative/generation-guidance. Guidance versions are immutable when selected and each Generation Record stores exact ids/versions/hashes.
```

**Expected result**

Generation behaviour is versioned and reproducible.

**Verify before continuing**

Run a fixture with standard + project override and inspect resolved provenance.

### Step 10 — Implement generation-reviewer evaluation loop

**References:** Generation runtime/guidance/cost §17; Distribution §16

**Run**

```text
Implement generation-reviewer proposals and candidate-guidance comparison through pactwright eval. Hold provider/model/task input/Brief/grounding/prompt constant where practical. Report grounding, adherence, format, verification failures, regeneration, human preference and cost without a single aggregate score.
```

**Expected result**

Guidance can improve through normal eval + human merge.

**Verify before continuing**

Run `pnpm pactwright eval` with one baseline/candidate guidance fixture.

### Step 11 — Implement execution-local generation budgets

**References:** Generation runtime/guidance/cost §18

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

**References:** Commands/validation/automation §§7, 14, 22–23

**Run**

```text
Complete Review & Creative GitHub integration Follow the core GitHub workflow hardening invariant from Checkpoint 2: frozen installs, least privilege, SHA-pinned third-party actions, bounded timeouts/concurrency, and no `pull_request_target`.: Creative Grounding check, Publication check, creative PR summary, Assets view and Publications view. Repository-backed Asset byte changes must trigger hash validation. GitHub approval metadata alone must never create an Asset.
```

**Expected result**

GitHub exposes creative state but cannot approve/publish by itself.

**Verify before continuing**

Run sync/dry-run; use a fixture GitHub approval without Asset record and prove no canonical Asset appears.

## Stage 7 — Publish grounded Pactwright creative work

Run all public creative work from current accepted Project Intelligence, not from ad-hoc prompt context.

### Step 13 — Verify creative readiness

**References:** Open-Source Project Organisation §1.2; Project Intelligence §§10, 13; Creative lifecycle/grounding/verification §§9–11

**Run**

```bash
pnpm pactwright intelligence onboard
pnpm pactwright intelligence validate
```

For the initial Pactwright creative package require:

```text
identity = Covered
content = Covered
product = Covered
```

If the website/README work includes acquisition positioning or CTAs, also require:

```text
go-to-market = Covered
```

If a required domain is not Covered, stop this stage and use the Project Intelligence gap → Delivery → ingest → triage/promotion loop established in Checkpoint 3.

**Expected result**

Creative Delivery starts from accepted project truth rather than trying to manufacture missing identity, product or content strategy.

**Verify before continuing**

Inspect the exact Knowledge selected for identity, product and content; all required claims/constraints are current and traceable.

### Step 14 — Publish the Creative Delivery learning path and capability presentation

**References:** Open-Source Project Organisation §1.3; Creative lifecycle/grounding/verification §§9–11; Asset/Publication §§12–13

**Run**

```text
/capture-intent "Publish Pactwright's Creative Delivery public package: Creative Delivery documentation, one creative-delivery example, an Academy Creative Delivery lesson, and the concise README/website capability presentation needed to make the feature discoverable. Ground all public claims and voice in current accepted Project Intelligence."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
```

Inspect the grounded context:

```bash
pnpm pactwright context <brief-id>
```

Then:

```text
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Expected result**

The first Creative Delivery capability is explained and taught using the same grounded system being implemented.

**Verify before continuing**

Graph Review/creative verification finds no blocking grounding, identity/voice or product-claim defect.

### Step 15 — Approve and publish the public creative output

**References:** Asset/Publication §§12–13

**Run**

After manually inspecting the exact reviewed output:

```bash
pnpm pactwright creative approve-asset <evidence-id>
```

Use the existing website/content publication mechanism to publish the approved output, then:

```bash
pnpm pactwright creative record-publication <asset-id> <channel>
pnpm pactwright creative validate
```

**Expected result**

The Project Graph records Intent → Delivery Evidence → approved Asset → Publication for real Pactwright public work.

**Verify before continuing**

Publication references the approved Asset hash and grounding; no public creative work in this stage exists only as an untracked file edit.


## Stage 8 — Release `0.0.5`

### Step 16 — Prepare, publish and tag `0.0.5`

**References:** Distribution §§2, 4, 6–8, 15, 18–19

**Run**

Update `CHANGELOG.md` from accepted Checkpoint 5 Evidence only, then create the release PR:

```bash
VERSION=0.0.5
DEFAULT_BRANCH="$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name)"

git switch "$DEFAULT_BRANCH"
git pull --ff-only
git switch -c "release/$VERSION"

pnpm version "$VERSION" -r --no-git-tag-version --allow-same-version
pnpm install
pnpm verify
pnpm publish -r --dry-run --tag next --access public

git add -A
git commit -m "chore: release $VERSION"
git push -u origin HEAD

gh pr create \
  --title "Release $VERSION" \
  --body "Prepare Pactwright $VERSION."

gh pr checks --watch
gh pr merge --squash --delete-branch

git switch "$DEFAULT_BRANCH"
git pull --ff-only
```

Tag the accepted merge commit:

```bash
git tag -a "v$VERSION" -m "v$VERSION"
git push origin "v$VERSION"
```

**Expected result**

The tag-triggered trusted `release.yml` workflow verifies the exact merged source and publishes every still-unpublished package in the `0.0.5` family under `next`. Existing published members are not overwritten.

**Verify before continuing**

Confirm the `release.yml` run for `v0.0.5` succeeded, then:

```bash
pnpm view pactwright@0.0.5 version
pnpm view @pactwright/standard@0.0.5 version
pnpm view @pactwright/project-intelligence@0.0.5 version
pnpm view @pactwright/review-creative@0.0.5 version
pnpm view @pactwright/creative@0.0.5 version
```

Every command must return `0.0.5`. Packages already configured for trusted publishing must show npm provenance/trusted-publisher metadata; any package bootstrapped in this step is trusted for its next release.


## Stage 9 — Publish real Kakeido work

Run this stage from the Kakeido repository root unless a step explicitly says otherwise.

Prove creative grounding/voice on a different product.

### Step 17 — Upgrade Review & Creative in Kakeido

**References:** Distribution §15

**Run**

```bash
pnpm add -D \
  pactwright@0.0.5 \
  @pactwright/project-intelligence@0.0.5 \
  @pactwright/review-creative@0.0.5 \
  @pactwright/creative@0.0.5

pnpm pactwright extension upgrade project-intelligence
pnpm pactwright agent-pack use @pactwright/creative
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

### Step 18 — Deliver grounded Kakeido public content

**References:** Kakeido creative constraints §§4–19, 3, 10, 1–18


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

### Step 19 — Approve/publish Kakeido Asset

**References:** Asset/Publication §§12–13

**Run**

After manually inspecting the exact output:

```bash
pnpm pactwright creative approve-asset <evidence-id>
```

Use the Asset id printed by the command.

**Run**

```text
Publish the approved Asset through Kakeido's existing channel mechanism. Confirm the released bytes match the approved Asset hash and report the public locator.
```

**Run**

```bash
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

**Pactwright — Checkpoint 5 — Creative Production v8**