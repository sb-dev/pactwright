# Pactwright — Checkpoint 5 — Creative Production

**Version:** 10  
**Entry condition:** Checkpoint 4 is accepted.  
**Exit capability:** Grounded creative Delivery can produce a human-approved immutable Asset and Publication in Pactwright and Kakeibo, with Kakeibo public Kei claims grounded in a real versioned offline Kei foundation.

## 1. Goal

Complete the Creative Delivery half of Review & Creative, including grounding, verification, Asset approval, Publication and Generation Guidance, then publish real work in both projects.

For Kakeibo, Creative Production must not publish Kei capability claims ahead of implementation. This checkpoint first establishes the repository-owned, bounded and versioned Kei subsystem plus its offline evaluation gates, then uses Creative Delivery to publish a grounded public Asset explaining that real capability.

## 2. Specification baseline

### Pactwright

- [Pactwright — Delivery Graph and Lifecycle Engineering Spec](../research-logs/2026-08-11-pactwright-delivery-graph-and-lifecycle-engineering-spec.md)
- [Pactwright — Distribution, Agents and Evaluation](../research-logs/2026-08-11-pactwright-distribution-agents-and-evaluation.md)
- [Pactwright — GitHub Actions and Views](../research-logs/2026-08-11-pactwright-github-actions-and-views.md)
- [Pactwright — Project Intelligence Graph Engineering Spec](../research-logs/2026-08-11-pactwright-project-intelligence-graph-engineering-spec.md)
- [Pactwright — Graph Review & Creative Delivery Engineering Spec](../research-logs/2026-08-11-pactwright-graph-review-and-creative-delivery-engineering-spec.md)
- [Pactwright — Operations Graph Engineering Spec](../research-logs/2026-08-11-pactwright-operations-graph-engineering-spec.md)
- [Pactwright — System Architecture](../research-logs/2026-08-11-pactwright-system-architecture.md)
- [Pactwright — Implementation Principles](./00-implementation-principles.md)
- [Pactwright — Implementation Guide](./00-implementation-guide.md)
- [Pactwright Open-Source Project Organisation](../research-logs/2026-08-11-pactwright-open-source-project-organisation.md)
- [Design Specification: Astro + Cloudflare Workers + Meta CAPI](../research-logs/2026-08-11-astro-design-spec.md)
- [Kakeibo System-Level Acceptance Profile](./00-kakeibo-acceptance-profile.md)

### Kakeibo

At execution time use the current canonical Kakeibo authorities relevant to this checkpoint:

```text
docs/specs/README.md

docs/specs/03-kei-assistant-spec.md
docs/specs/05-system-architecture-and-data-spec.md
docs/specs/06-engineering-delivery-and-operations-spec.md
docs/specs/07-open-source-project-organisation-spec.md
```

Supporting public-product/visual context may additionally come from:

```text
docs/specs/01-product-and-ux-spec.md
docs/specs/04-mobile-design-system-spec.md
```

For Kei behaviour and public claims, preserve this ownership split:

```text
03 → Kei behaviour, authority, task contracts
05 → runtime, grounding, release/model-route architecture
06 → testing, benchmark, release and operational engineering
07 → public/private boundary and open-source transparency
```

`00-kakeibo-acceptance-profile.md` §9 is the shared System-Level Acceptance cross-check for the Kakeibo proof.

The retained August Kakeido Financial/Product/Mobile/Assistant/Tech Stack snapshots are not implementation authority.

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

**Default execution location:** the Pactwright repository root unless the step explicitly names Kakeibo or a fixture.

For repository/code changes, finish with `pnpm verify`. Before invoking a newly implemented Pactwright runtime command during implementation, run `pnpm build` so the repository-local CLI is not using stale distribution output.

After Checkpoint 2 activates GitHub, land coherent repository changes through pull requests and required checks rather than direct default-branch commits.

Dynamic ids such as `<source-id>`, `<brief-id>` and `<evidence-id>` must come from an earlier command in the runbook. Commands that create or resolve durable records must print the ids required by later steps.

Fixture verification means repository test fixtures unless a step explicitly creates a real repository or GitHub resource.

## 4. Checkpoint specification map

- **Creative lifecycle/grounding/verification** — Pactwright — Graph Review & Creative Delivery Engineering Spec §§9–11
- **Asset/Publication** — Pactwright — Graph Review & Creative Delivery Engineering Spec §§12–13
- **Generation runtime/guidance/cost** — Pactwright — Graph Review & Creative Delivery Engineering Spec §§14–18
- **Commands/validation/automation** — Pactwright — Graph Review & Creative Delivery Engineering Spec §§19–24; Pactwright — GitHub Actions and Views §§7, 14, 22–23
- **Distribution/upgrades/evaluation** — Pactwright — Distribution, Agents and Evaluation §§2, 4, 6–8, 15–16, 18–19
- **Creative readiness/public product** — Pactwright Open-Source Project Organisation §§1.2–1.3; Pactwright — Project Intelligence Graph Engineering Spec §§10, 13
- **Release procedure** — Pactwright — Implementation Guide ("npm release model", "Preparing a development release", "Project Intelligence before creative work")
- **Kakeibo Kei behaviour** — current `03-kei-assistant-spec.md`
- **Kakeibo Kei runtime/release architecture** — current `05-system-architecture-and-data-spec.md`
- **Kakeibo Kei testing/evaluation/release** — current `06-engineering-delivery-and-operations-spec.md`
- **Kakeibo Kei public/private transparency** — current `07-open-source-project-organisation-spec.md`
- **Kakeibo System-Level Acceptance** — Kakeibo Acceptance Profile §§2–9

**Explicitly out of scope for this checkpoint:**

- `operations.exposure_types: [publication]` manifest registration is deferred to Checkpoint 7, where Operations-compatible exposure declaration is implemented and proven inert without Operations.
- Scheduled publication automation for already approved Assets (GitHub Actions and Views §7) is deferred until a configured channel integration exists; when introduced, scheduling must never bypass Asset approval.
- Kakeibo production shadowing, canary comparison, A/B testing and controlled rollout are deferred to Checkpoint 6. They are Operations concerns and must not be simulated as Creative Delivery or offline evaluation.
- Kakeibo-specific concepts such as `KeiRelease`, task, policy, persona, model route or benchmark case do not become Pactwright graph node types in this checkpoint.
- Persistent memory, autonomous tool use, dynamic skill selection, subagents, agent-selected workflows and general-purpose Ask Kei remain future optional Kakeibo capabilities unless separately accepted later.

## Stage 1 — Add creative Brief grounding to normal Delivery

Extend Delivery context without creating a second lifecycle.

### Step 1 — Implement creative Brief contribution

**References:** Creative lifecycle/grounding/verification §9; Open-Source Project Organisation §1.2

**Run**

```text
Implement Review & Creative's contribution to normal Delivery Briefs: modality, target channel/surface, format constraints, task class, grounding manifest, identity/voice context and acceptance/verification requirements.

For public creative work, perform a Project Intelligence readiness preflight before generation:
- `identity` must be Covered;
- `content` must be Covered for editorial/educational/marketing work;
- `product` must be Covered for product/capability/value claims;
- `go-to-market` must be Covered for acquisition/positioning/campaign work;
- `delivery/ux` must be Covered for user-facing workflow/UX material;
- `delivery/eng` must be Covered for technical implementation claims;
- any other domain needed for factual claims must be Covered.

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
Implement creative grounding as Project Graph id + content hash pairs. Factual project claims must be supportable by grounding; applicable outbound language requires current accepted identity/voice knowledge. External claims not already represented as accepted project knowledge must enter Project Intelligence ingestion before being treated as project truth. Challenged/superseded/retracted grounding must be surfaced for unapproved work.
```

**Expected result**

Creative outputs are traceably grounded in accepted project truth.

**Verify before continuing**

Run fixtures for valid, missing, hash-mismatched and challenged grounding, plus one external-claim fixture proving ingestion is required before the claim can be used as project truth.

## Stage 2 — Implement creative execution and verification

Reuse core deliver-brief/review responsibilities.

### Step 3 — Implement `creative-delivery` capability

**References:** Creative lifecycle/grounding/verification §9

**Run**

```text
Implement the creative-delivery extension capability invoked by the existing deliver-brief responsibility. Candidate outputs and generation attempts stay execution/transient state; generation must not create Asset nodes. Support one first tested modality (text or image) end-to-end.
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

Complete the review-creative extension manifest for the creative half: register the asset and publication node types, the produces/grounded-in/publishes edge types and the creative runtime namespace, validated through normal Distribution manifest/dependency checks. Do not add operations.exposure_types in this checkpoint.
```

**Expected result**

An Asset is the exact approved durable output, and the manifest registers all creative node/edge types.

**Verify before continuing**

Run fixtures for valid Asset, missing Evidence, missing human approval, hash mismatch, supersession and a manually produced Asset with empty generation_records. Confirm Distribution validation accepts the completed manifest.

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

### Step 9 — Extend `creative validate` with the creative-half rules

**References:** Commands/validation/automation §§21–22

**Run**

```text
Extend pactwright creative validate with the Asset/Publication rules: every grounded output references valid graph id/hash pairs; every Asset references valid Delivery Evidence and records a human approver; every Asset content hash matches its stored or referenced output; every produces/grounded-in/publishes/supersedes edge has valid endpoints; every Publication references an approved Asset with a matching hash; superseded Assets remain immutable; generated reports identify their Project Graph revision. Enforce failure semantics: generation retries are bounded and a failed Publication never mutates the approved Asset.
```

**Expected result**

`creative validate` enforces the full Asset/Publication invariant set, not only the review-half rules.

**Verify before continuing**

Run one failing fixture per rule, plus a bounded-retry generation fixture and a failed-publication fixture proving the approved Asset is byte-identical afterwards.

## Stage 5 — Implement Generation Guidance and evaluation

Allow fast-moving provider/model guidance to evolve outside graph semantics.

### Step 10 — Implement guidance resolution/provenance

**References:** Generation runtime/guidance/cost §17

**Run**

```text
Implement standard guidance → project override resolution. Standard guidance ships with the selected agent pack/extension package; project overrides live under .pactwright/review-creative/generation-guidance. Guidance versions are immutable when selected and each Generation Record stores exact ids/versions/hashes.
```

**Expected result**

Generation behaviour is versioned and reproducible.

**Verify before continuing**

Run a fixture with standard + project override and inspect resolved provenance.

### Step 11 — Implement generation-reviewer evaluation loop

**References:** Generation runtime/guidance/cost §17; Distribution §16

**Run**

```text
Implement generation-reviewer proposals and candidate-guidance comparison through pactwright eval. Hold provider/model/task input/Brief/grounding/prompt constant where practical. Report grounding, adherence, format, verification failures, regeneration, human preference and cost without a single aggregate score.
```

**Expected result**

Guidance can improve through normal eval + human merge.

**Verify before continuing**

Run `pnpm pactwright eval` with one baseline/candidate guidance fixture.

### Step 12 — Implement execution-local generation budgets

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

### Step 13 — Implement creative checks/PR summary/views

**References:** Commands/validation/automation §§7, 14, 23

**Run**

```text
Complete Review & Creative GitHub integration: Creative Grounding check, Publication check, creative PR summary, Assets view, Publications view, and generation-configuration validation with evaluation triggers when .pactwright/review-creative/providers, tasks or generation-guidance change. Repository-backed Asset byte changes must trigger hash validation. GitHub approval metadata alone must never create an Asset. Follow the core GitHub workflow hardening invariant from Checkpoint 2: frozen installs, least privilege, SHA-pinned third-party actions, bounded timeouts/concurrency, and no `pull_request_target`.
```

**Expected result**

GitHub exposes creative state but cannot approve/publish by itself.

**Verify before continuing**

Run sync/dry-run; use a fixture GitHub approval without Asset record and prove no canonical Asset appears.

## Stage 7 — Publish grounded Pactwright creative work

Run all public creative work from current accepted Project Intelligence, not from ad-hoc prompt context.

### Step 14 — Adopt the Checkpoint 5 creative runtime in Pactwright

**References:** Distribution §§8, 15; Implementation Principles §7

**Run**

```bash
pnpm build
pnpm pactwright sync
pnpm pactwright creative validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

**Expected result**

Pactwright's own adapter, checks and views reflect the Checkpoint 5 creative runtime before any real creative work runs.

**Verify before continuing**

Run `pnpm pactwright validate`; the creative checks/views from Step 13 appear in the GitHub dry-run diff before sync applies them.

### Step 15 — Verify creative readiness

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
delivery/eng = Covered
delivery/ux = Covered
```

`delivery/eng` and `delivery/ux` are required because the package includes technical documentation, an example and an Academy lesson describing user-facing workflow.

If the website/README work includes acquisition positioning or CTAs, also require:

```text
go-to-market = Covered
```

If a required domain is not Covered, stop this stage and use the Project Intelligence gap → Delivery → ingest → triage/promotion loop established in Checkpoint 3.

**Expected result**

Creative Delivery starts from accepted project truth rather than trying to manufacture missing identity, product or content strategy.

**Verify before continuing**

Inspect the exact Knowledge selected for identity, product and content; all required claims/constraints are current and traceable.

### Step 16 — Publish the Creative Delivery learning path and capability presentation

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

Graph Review/creative verification finds no blocking grounding, identity/voice or product-claim defect; rejected competing Contract alternatives remain transient and create no graph nodes.

### Step 17 — Approve and publish the public creative output

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

### Step 18 — Prepare, publish and tag `0.0.5`

**References:** Implementation Guide — npm release model / Preparing a development release; Distribution §§2, 4, 6–8, 15, 18–19

**Run**

Update `CHANGELOG.md` from accepted Checkpoint 5 Evidence only, then create the release PR:

```bash
VERSION=0.0.5
DEFAULT_BRANCH="$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name)"

git switch "$DEFAULT_BRANCH"
git pull --ff-only
git switch -c "release/$VERSION"

pnpm -r exec npm version "$VERSION" --no-git-tag-version --allow-same-version
npm version "$VERSION" --no-git-tag-version --allow-same-version
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

Every command must return `0.0.5`. All packages must show npm provenance/trusted-publisher metadata; this release introduces no new packages, so no interactive bootstrap publishing occurs.

## Stage 9 — Establish the versioned Kakeibo Kei foundation, then publish real work

Run this stage from the Kakeibo repository root unless a step explicitly says otherwise.

The order is mandatory:

```text
repository-owned Kei implementation
→ deterministic contract tests
→ offline benchmark/red-team acceptance
→ grounded public Asset
→ human approval
→ Publication
```

A public claim must not be used as evidence that the underlying Kei capability exists.

### Step 19 — Upgrade Review & Creative in Kakeibo

**References:** Distribution §15; Kakeibo Acceptance Profile §9

**Run**

```bash
pnpm add -D \
  pactwright@0.0.5 \
  @pactwright/project-intelligence@0.0.5 \
  @pactwright/review-creative@0.0.5 \
  @pactwright/creative@0.0.5

pnpm pactwright extension upgrade project-intelligence
pnpm pactwright upgrade
pnpm pactwright extension upgrade review-creative
pnpm pactwright sync
pnpm pactwright creative validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

**Expected result**

Kakeibo uses the checkpoint creative runtime. `pnpm pactwright upgrade` upgrades the already-selected `@pactwright/creative` pack; `agent-pack use` is only for first selection.

**Verify before continuing**

Run `pnpm pactwright intelligence validate` and `pnpm pactwright validate`.

### Step 20 — Deliver the bounded, repository-owned Kei runtime foundation

**References:** Kakeibo Acceptance Profile §9; current Kakeibo `03-kei-assistant-spec.md`; `05-system-architecture-and-data-spec.md`; `06-engineering-delivery-and-operations-spec.md`; `07-open-source-project-organisation-spec.md`

**Run**

Use normal Pactwright Delivery:

```text
/capture-intent "Implement Kakeibo's first bounded, repository-owned and versioned Kei runtime foundation. Create packages/kei with policy, persona, tasks, schemas, evals and release ownership. The application must select an explicit task, construct authorised bounded grounding from canonical application state, resolve one immutable KeiRelease, route through the configured AI Gateway model route, require structured output, validate it deterministically, then display the validated result or use a deterministic fallback. Implement Review Brief end to end and define contracts for the complete initial task set. Kei may explain canonical values but must never recalculate or redefine financial truth. Treat merchant descriptions, CSV fields, bank references and provider labels as untrusted data rather than instructions. Do not implement persistent memory, autonomous tools, dynamic skill selection, subagents, agent-selected workflows or general-purpose chat."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

The repository layout must include at least:

```text
packages/kei/
  policy/
  persona/
  tasks/
  schemas/
  evals/
  release/
```

The runtime boundary must be:

```text
application selects task
→ application builds authorised bounded grounding
→ release resolver selects exact KeiRelease
→ model-route reference resolves through AI Gateway
→ structured output
→ deterministic schema/authority validation
→ display or deterministic fallback
```

Define contracts for the initial task set:

```text
Review Brief
Explain Decision
Explain Group
Explain Looks Safe
Weekly Summary
Goal Progress Explanation
Reflection Prompt
```

Implement at least `Review Brief` end to end against synthetic/safe financial state from the existing domain/application boundary.

The first candidate/release manifest must resolve exact versions/hashes for:

```text
Kei semantic version
bundle hash
policy
persona
task contracts
output schemas
tool set
skill set
model-route reference
application commit
benchmark suite
benchmark dataset
```

A `KeiRelease` identifies behaviour. A model route identifies provider/model routing. They are related but not interchangeable and must be independently traceable.

Production-defining policy/persona/task/schema/release configuration must be repository source of truth. An external prompt/model dashboard may assist operations but must not become hidden canonical behaviour.

**Expected result**

Kakeibo has a real bounded Kei subsystem whose production-defining behaviour can be inspected, versioned and reproduced from the repository, with at least one real task executing through the complete structured-output boundary.

**Verify before continuing**

Run the Kakeibo deterministic test gate and prove:

- the application selects the Kei task; the model cannot silently select another task;
- grounding is bounded to the selected task and current authorised application state;
- `Review Brief` does not recalculate canonical totals or create reviewed truth;
- source/provider text containing instruction-like content remains untrusted data;
- malformed or authority-violating structured output fails validation and reaches deterministic fallback;
- one response can be traced to the exact release bundle and model-route reference used;
- changing policy/persona/task/schema behaviour changes the release identity rather than mutating an already released bundle;
- no optional skill/tool configuration expands financial authority;
- no raw production financial prompt/response is required for release reproducibility;
- no Kakeibo-specific Kei artefact was added as a Pactwright graph node type.

### Step 21 — Establish the permanent offline Kei evaluation and red-team gate

**References:** Kakeibo Acceptance Profile §9; current Kakeibo `06-engineering-delivery-and-operations-spec.md`; `03-kei-assistant-spec.md`; `07-open-source-project-organisation-spec.md`

**Run**

Use normal Pactwright Delivery to create the permanent repository evaluation assets and gate for candidate Kei releases. Cover at least:

```text
financial correctness
evidence discipline / Known-Likely-Unknown handling
authority and financial-safety boundaries
tone and usefulness
prompt injection / hostile financial source text
structured-output/schema/fallback behaviour
operational latency/cost signals where meaningfully testable offline
```

The gate order must preserve deterministic authority:

```text
deterministic contract tests
→ offline benchmark
→ red-team cases
→ repeated probabilistic evaluation where variance matters
→ human sample review where required
→ candidate accepted for later production evaluation
```

Hard deterministic assertions outrank model-judge preference scores. Do not collapse all evaluation into one aggregate score or one LLM judge.

Create safe synthetic/sanitised datasets and version/hash the benchmark suite and dataset so they can be referenced by `KeiRelease`.

Minimum permanent adversarial cases must include:

```text
merchant/CSV/provider text containing instructions
request to turn Looks Safe into reviewed truth
request to invent or alter canonical financial values
request for personalised investment/product/debt-strategy advice
unsupported certainty where evidence is incomplete
invalid output schema
model output attempting an unavailable tool/skill action
```

Critical probabilistic cases must be run repeatedly where a single pass could hide instability.

A prompt-only or policy/persona/task-contract behaviour change is a production behaviour change and therefore requires a new Kei release version/bundle hash before evaluation.

**Expected result**

Kakeibo has a permanent offline release gate capable of rejecting unsafe or semantically incorrect Kei candidates before any production exposure.

**Verify before continuing**

- deterministic assertions fail independently of model-judge output;
- benchmark/red-team assets have stable versions/hashes and use no real user financial data;
- prompt-injection cases cannot convert untrusted financial text into instructions;
- safety/advice cases cannot be passed merely because tone/usefulness scores are high;
- repeated critical cases expose variance rather than reporting one lucky run;
- the accepted candidate manifest references the exact benchmark suite/dataset used;
- repository-public evaluation definitions/safe synthetic data contain no private production trace;
- there is no shadow/canary/A-B/rollout implementation in this step.

### Step 22 — Deliver a grounded Kakeibo Kei public Asset

**References:** Kakeibo Acceptance Profile §9; current Kakeibo specs `03`, `05`, `06`, `07`; Creative lifecycle/grounding/verification §§9–11; Asset/Publication §§12–13

Only continue after Steps 20–21 are accepted.

**Run**

```text
/capture-intent "Create one real public Kakeibo Asset explaining or demonstrating the implemented bounded Kei capability. Ground behavioural claims in the current Kei behaviour contract, runtime/release implementation, offline evaluation gate and public/private transparency rules. Explain that Kakeibo selects explicit Kei tasks, supplies bounded grounding and validates structured output; Kei explains canonical state rather than redefining financial truth. Describe versioned Git-traceable behaviour only to the extent implemented. Do not claim production shadowing, A/B testing, autonomous tools, persistent memory or other future capabilities."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
```

Inspect the grounded context:

```bash
pnpm pactwright context <brief-id>
```

The relevant grounding must principally trace to:

```text
03 → behaviour/task/authority contract
05 → runtime/release/model-route architecture and implementation
06 → offline testing/evaluation/release gate
07 → open-source/public/private transparency
```

Then:

```text
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Expected result**

The public output describes a capability that now exists in the repository and does not use future production-learning features as marketing claims.

**Verify before continuing**

Review specifically for:

- no adviser or personalised financial-product claims;
- no confidence-score language presented as financial truth;
- explicit bounded-task and user-authority model;
- Kei never presented as recalculating canonical finance;
- Git-traceable/versioned production-defining behaviour described accurately;
- safe benchmark/red-team definitions and synthetic data public where implemented;
- no raw production financial grounding, prompt, response or AI trace published;
- no claim that shadowing/canary/A-B/controlled rollout already exists;
- no optional future agentic feature presented as current.

### Step 23 — Approve and publish the Kakeibo Asset

**References:** Asset/Publication §§12–13

**Run**

After manually inspecting the exact reviewed output:

```bash
pnpm pactwright creative approve-asset <evidence-id>
```

Use the Asset id printed by the command. Publish the approved Asset through Kakeibo's existing channel mechanism, confirm that the released bytes match the approved Asset hash, then:

```bash
pnpm pactwright creative record-publication <asset-id> <channel>
pnpm pactwright creative validate
```

**Expected result**

Kakeibo has a real approved Asset and Publication grounded in the real bounded/versioned Kei implementation and accepted offline evaluation evidence.

**Verify before continuing**

Inspect exact hashes, grounding, human approval and published surface. Trace the public claim back through Delivery Evidence to the implemented Kei foundation and its accepted offline gate.

## Stage 10 — Capture checkpoint feedback as product evidence

Turn real Checkpoint 5 implementation and use into governed future Pactwright work.

### Step 24 — Ingest implementation and usage findings

**References:** Implementation Principles §§7, 14; PI §8; Kakeibo Acceptance Profile §9

**Run**

```text
Capture the notable findings from implementing Checkpoint 5 and installing/using it in Kakeibo — defects, unclear behaviour, missing guidance, creative-verification misses, Kei contract/evaluation friction and installation problems — as Project Intelligence internal Sources. Distinguish Kakeibo-specific choices from evidence that a Pactwright responsibility failed; only repeatable responsibility failures are candidates for generic product or evaluation work. Do not generalise KeiRelease, Kei task, policy, persona, model-route or benchmark-case concepts into Pactwright graph semantics from this single product use case.
```

For each internal Source id created:

```bash
pnpm pactwright intelligence triage <source-id>

# only when triage requires reviewed promotion and the proposal is accepted
pnpm pactwright intelligence promote <source-id>
```

Then:

```bash
pnpm pactwright intelligence derive-intent-roadmap
```

**Expected result**

Real Checkpoint 5 use produces governed future Pactwright work rather than untracked observations or premature generic abstractions.

**Verify before continuing**

Each retained finding traces to a Source and an explicit triage outcome; no finding directly mutates Knowledge or Delivery state; Kakeibo-specific runtime concepts remain Kakeibo-owned unless independent cross-domain evidence later justifies a generic abstraction.

## Exit gate

Checkpoint 5 is complete only when all of the following hold:

1. Creative Briefs carry grounding, readiness and acceptance/verification requirements; grounding manifests, creative execution and independent creative verification pass their fixtures.
2. Assets and Publications enforce human approval, immutability, exact-hash and supersession invariants through the extended `creative validate`.
3. Generation Guidance is versioned with recorded provenance, improvable through `pactwright eval`, and command-budget bounded.
4. GitHub projects creative state and validates generation configuration without approving or publishing anything itself.
5. Pactwright delivered, human-approved and published real grounded creative work through the normal Delivery lifecycle, with candidate generations remaining non-canonical.
6. `0.0.5` is registry-verified with trusted-publisher provenance.
7. Kakeibo contains the repository-owned `packages/kei/{policy,persona,tasks,schemas,evals,release}` foundation, with the application-selected task → bounded grounding → exact KeiRelease → model route → structured output → deterministic validation → display/fallback boundary implemented and `Review Brief` proven end to end.
8. Kakeibo's immutable release manifest identifies exact policy/persona/task/schema/tool/skill/model-route/application/benchmark versions and hashes; behavioural release identity remains distinct from model routing.
9. Kakeibo has permanent deterministic contract tests, offline benchmark and red-team assets covering financial correctness, evidence discipline, authority/safety, tone/usefulness, prompt injection and structured-output/fallback behaviour, with repeated evaluation where probabilistic variance matters and no single aggregate judge controlling acceptance.
10. Kakeibo's public Kei Asset is grounded in current `03/05/06/07` truth, accurately describes only implemented bounded/versioned behaviour, exposes safe evaluation material where applicable, publishes no private production trace, and completes human-approved Asset → Publication semantics.
11. Production shadowing, canary/A-B testing and controlled rollout remain deferred to Checkpoint 6 rather than being implemented or claimed in Checkpoint 5.
12. Checkpoint feedback is ingested through Project Intelligence into governed future work without promoting Kakeibo-specific Kei artefacts into Pactwright graph types.

---

**Pactwright — Checkpoint 5 — Creative Production v10**
