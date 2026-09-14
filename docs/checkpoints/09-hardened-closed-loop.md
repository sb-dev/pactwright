# Pactwright — Checkpoint 9 — Hardened Closed Loop

**Version:** 10  
**Entry condition:** Checkpoint 8 is accepted.  
**Exit capability:** The complete first-party system is evaluated, failure-hardened, documented and repeatedly proven in closed loops on Pactwright and Kakeibo, including permanent Experiment regression coverage and a production Kei defect becoming a new immutable evaluated release.

## 1. Goal

Turn observed failures from Checkpoints 1–8 into permanent evaluation/regression coverage, harden only demonstrated weak points, complete the initial public product, prove repeated production-feedback loops, and demonstrate that a confirmed Kakeibo Kei production defect can travel from observation to a sanitised regression case and a safely controlled replacement release.

Checkpoint 9 does not add speculative product semantics. It converts evidence into durable tests and proves the existing governance/release boundaries under failure.

## 2. Specification baseline

### Pactwright

- [Pactwright — Delivery Graph and Lifecycle Engineering Spec](../research-logs/2026-08-11-pactwright-delivery-graph-and-lifecycle-engineering-spec.md)
- [Pactwright — Distribution, Agents and Evaluation](../research-logs/2026-08-11-pactwright-distribution-agents-and-evaluation.md)
- [Pactwright — GitHub Actions and Views](../research-logs/2026-08-11-pactwright-github-actions-and-views.md)
- [Pactwright — Project Intelligence Graph Engineering Spec](../research-logs/2026-08-11-pactwright-project-intelligence-graph-engineering-spec.md)
- [Pactwright — Graph Review & Creative Delivery Engineering Spec](../research-logs/2026-08-11-pactwright-graph-review-and-creative-delivery-engineering-spec.md)
- [Pactwright — Operations Graph Engineering Spec](../research-logs/2026-08-11-pactwright-operations-graph-engineering-spec.md)
- [Pactwright — Operations Experiment Semantics](../research-logs/2026-09-02-pactwright-operations-experiment-semantics.md)
- [Pactwright — System Architecture](../research-logs/2026-08-11-pactwright-system-architecture.md)
- [Pactwright — Implementation Principles](./00-implementation-principles.md)
- [Pactwright — Implementation Guide](./00-implementation-guide.md)
- [Pactwright Open-Source Project Organisation](../research-logs/2026-08-11-pactwright-open-source-project-organisation.md)
- [Design Specification: Astro + Cloudflare Workers + Meta CAPI](../research-logs/2026-08-11-astro-design-spec.md)
- [Kakeibo System-Level Acceptance Profile](./00-kakeibo-acceptance-profile.md)

### Kakeibo

At execution time use the complete current canonical authority set:

```text
docs/specs/README.md
docs/specs/01-product-and-ux-spec.md
docs/specs/02-financial-domain-model-spec.md
docs/specs/03-kei-assistant-spec.md
docs/specs/04-mobile-design-system-spec.md
docs/specs/05-system-architecture-and-data-spec.md
docs/specs/06-engineering-delivery-and-operations-spec.md
docs/specs/07-open-source-project-organisation-spec.md
```

`00-kakeibo-acceptance-profile.md` §13 defines the Kakeibo-specific Checkpoint 9 acceptance additions.

Preserve the owner boundaries established in earlier checkpoints. In particular:

```text
Kakeibo KeiRelease / model route / task / benchmark artefacts
→ Kakeibo repository/application state

Pactwright Experiment / Observation
→ Operations state

production outcome meaning
→ Observation → PI Source → normal governance
```

The retained August Kakeido snapshots are not implementation authority.

Only owning specifications define semantics. This runbook defines execution order and acceptance. Release mechanics remain owned by the Implementation Guide.

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

**Default execution location:** the Pactwright repository root unless the step explicitly names Kakeibo or a fixture.

For repository/code changes, finish with `pnpm verify`. Before invoking a newly implemented Pactwright runtime command during implementation, run `pnpm build`.

After Checkpoint 2 activates GitHub, land coherent repository changes through pull requests and required checks rather than direct default-branch commits.

Dynamic ids such as `<source-id>`, `<internal-source-id>`, `<brief-id>`, `<evidence-id>`, `<deployment-id>`, `<experiment-id>` and `<observation-id>` must come from an earlier command or explicit configuration. Commands creating durable records must print ids required later.

Fixture verification means repository test fixtures unless a step explicitly creates a real repository or GitHub resource.

## 4. Checkpoint specification map

- **Shared evaluation** — Distribution, Agents and Evaluation §16
- **Graph Review / Creative evaluation** — Graph Review & Creative Delivery §17
- **Operations evaluation** — Operations Graph Engineering §21
- **Experiment validation/failure/genericity** — Operations Experiment Semantics §§11–15
- **Definitions of Done / future boundary** — Delivery §§24–26; PI §§17–20; Review & Creative §§21–26; Operations §§22–29; GitHub §§26–28
- **Kakeibo production Kei lifecycle** — current Kakeibo `03`, `05`, `06`, `07`, cross-checked against `02`
- **Kakeibo regression review** — all seven current Kakeibo specs; Acceptance Profile §13
- **Public project** — Pactwright Open-Source Project Organisation §§3–16
- **Release model** — Implementation Guide (npm release model, trusted release workflow, release failure, test layers)

## Stage 1 — Convert observed failures into permanent evaluation cases

Ground hardening in evidence from Checkpoints 1–8. Do not manufacture cases merely to make each subsystem look symmetrical.

### Step 1 — Inventory repeatable failures by owner

**References:** Implementation Principles §§14–17; owning specs; Kakeibo Acceptance Profile §13

**Run**

```text
Review Pactwright Delivery Evidence, Review findings, Operations Observations, Experiment outcomes, validation/test failures, GitHub projection defects and Kakeibo acceptance failures from Checkpoints 1–8.

Produce a bounded evaluation inventory grouped by:
- Delivery;
- Project Intelligence;
- Graph Review;
- Creative Delivery;
- Operations / Experiment;
- Distribution / GitHub;
- Kakeibo-owned product/Kei regressions that belong in Kakeibo's own permanent tests/evals rather than generic Pactwright semantics.

Every candidate must point to concrete prior evidence or a required failure invariant already activated by an accepted spec. Exclude one-off taste and avoid turning Kakeibo-specific implementation choices into generic Pactwright concepts.
```

**Expected result**

A traceable evaluation backlog exists before new test code.

**Verify before continuing**

Every case has provenance, a clear owner and an assertion/evaluator type. No case exists solely because it is conceivable.

### Step 2 — Implement Delivery evaluation fixtures

**References:** Shared evaluation; Delivery Definition of Done

**Run**

```text
Implement accepted Delivery cases for contract fidelity, scope discipline, required structure, forbidden mutation, lifecycle ownership and Review defect detection. Keep deterministic assertions separate from semantic judgement.
```

**Expected result**

Observed core Delivery failures become repeatable tests.

**Verify before continuing**

Run `pnpm pactwright eval` and inspect Delivery cases individually.

### Step 3 — Implement PI evaluation fixtures

**References:** Shared evaluation; PI §§8–13

**Run**

```text
Implement accepted Project Intelligence cases for triage, consequence class, evidence comparison, context selection, roadmap provenance, operational-origin hand-off and no automatic Intent creation. Include a favourable Experiment Observation fixture proving experiment significance or metric direction cannot directly set Knowledge class, priority or Intent state.
```

**Expected result**

Observed Intelligence/governance failures become repeatable tests.

**Verify before continuing**

Run `pnpm pactwright eval` and inspect PI cases individually.

### Step 4 — Implement Review & Creative evaluation fixtures

**References:** Shared evaluation; Review & Creative §§6–17; Checkpoint 7 publication immutability

**Run**

```text
Implement accepted Graph Review and Creative Delivery cases for finding support/routing, Brief adherence, grounding, independent verification, Generation Guidance, human approval boundary, immutable Asset/Publication state and superseding-Asset lineage.

Where a Kakeibo fixture is useful, test public-claim grounding and private-trace exclusion rather than encoding Kakeibo-specific voice/product semantics into generic Pactwright evaluators.
```

**Expected result**

Review/Creative failures are measurable without leaking product-specific meaning into the framework.

**Verify before continuing**

Run eval and inspect Review/Creative cases individually.

### Step 5 — Implement Operations and Experiment evaluation fixtures

**References:** Operations evaluation; Experiment §§11–15; Kakeibo Acceptance Profile §13

**Run**

```text
Implement accepted Operations cases for signal compression, exposure attribution, baseline use, unsupported causality, duplicate handling, positive/neutral/insufficient findings and PI hand-off.

Make the following generic Experiment cases permanent:
- invalid control/candidate exposure id or hash;
- control/candidate resolving to the same exact exposure;
- post-record Experiment contract mutation;
- missing predeclared primary metric where required;
- missing minimum evidence / decision rule;
- invalid shadow user-facing assignment;
- unstable/invalid assignment where stable assignment is required by contract;
- guardrail evidence ignored by analysis;
- insufficient evidence represented as conclusive;
- favourable Experiment Observation attempting automatic candidate promotion;
- raw experiment assignments/samples copied into Project Graph state;
- failed experiment execution mutating an exposure or canonical Experiment state;
- repeated identical outcome evidence creating duplicate Observations.

Use the non-Kakeibo generic Experiment fixture from Checkpoint 6 for framework assertions. Do not create one aggregate Experiment-quality score.
```

**Expected result**

The generic controlled-evaluation contract has permanent regression coverage.

**Verify before continuing**

Run `pnpm pactwright eval` and `pnpm pactwright operations validate` against each Experiment failure case individually. Confirm generic fixtures contain no Kei-specific fields.

### Step 6 — Implement Distribution/GitHub projection regression fixtures

**References:** GitHub §§26–28; Checkpoint 8 Experiment projection

**Run**

```text
Implement accepted Distribution/GitHub cases for dependency removal, desired-state conflict, stale derived views, owned drift reconciliation, extension-disable cleanup and projection-only semantics.

Include Experiment projection failures observed or required by Checkpoint 8:
- wrong/stale control or candidate link;
- derived state implying promotion that did not occur;
- missing material guardrail breach in derived projection;
- empty Experiments view fabricating state;
- raw experiment evidence projected to GitHub;
- disabling Operations leaving Experiments fields/views/path ownership behind;
- GitHub field edit attempting to author or mutate Experiment truth.
```

**Expected result**

The complete GitHub surface has permanent projection/governance regression coverage.

**Verify before continuing**

Run relevant GitHub desired-state fixtures and `pnpm pactwright github sync --dry-run`; canonical files must remain authoritative.

## Stage 2 — Baseline behaviour and harden observed failures

Improve reliability without speculative new semantics.

### Step 7 — Run the complete evaluation suite

**References:** Shared evaluation

**Run**

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm pactwright eval
```

The suite runs against the repository-local workspace build; `0.0.9` does not exist in the registry until Stage 6.

**Expected result**

A per-capability/per-case result set exists, including the permanent Experiment cases.

**Verify before continuing**

Inspect every failing case individually. No aggregate score decides acceptance.

### Step 8 — Compare a real candidate agent pack when one exists

**References:** Shared evaluation

**Run**

```text
Inspect accepted hardening work. If no change affects an agent pack or Generation Guidance, record this step as not applicable and do not invent a candidate. If AI behaviour changes, build the candidate pack through the normal package build and report its local package path and pack family.
```

Only when a real candidate exists:

```bash
pnpm pactwright eval \
  --baseline <baseline-pack>@0.0.8 \
  --candidate <candidate-pack-path>
```

**Expected result**

A real AI-behaviour change is compared with the last published release of its own pack family.

**Verify before continuing**

Review each regression individually; deterministic ownership/safety failures override model-judge preference.

### Step 9 — Implement only observed hardening fixes

**References:** Owning specs; future-improvement sections

**Run**

```text
Implement fixes only for concrete failure modes observed in Checkpoints 1–8 or the accepted evaluation inventory. Preserve owner boundaries and do not pull future improvements into the core without observed need. Add or tighten a regression fixture for every fix.

A fix to Experiment handling must remain generic. A fix to Kakeibo Kei behaviour belongs to Kakeibo and must not create new Pactwright Kei node types.
```

**Expected result**

Known failure paths fail closed without unnecessary semantic expansion.

**Verify before continuing**

Run `pnpm verify` and `pnpm pactwright eval`.

### Step 10 — Run the full Pactwright validation matrix

**References:** All Pactwright owning specs

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

Canonical state is valid, projections converge and evaluation regressions are understood.

**Verify before continuing**

All deterministic validation passes; every semantic regression has an explicit accepted disposition.

## Stage 3 — Complete the initial Pactwright public product

Make shipped content match implemented capability after the complete checkpoint sequence.

### Step 11 — Audit public surfaces against actual product state

**References:** Public project §§3–16; Implementation Guide — public-product progression

**Run**

```text
Inspect README, Docs, Academy, Examples, Extensions, Website, Case Studies and Blog against current implemented Pactwright capability. Identify only gaps required for the initial Discover → Understand → Try → Learn → Extend → Contribute journey.

Ensure public material accurately covers:
- Delivery / PI / Review & Creative / Operations boundaries;
- ordinary production feedback without Experiment;
- controlled Experiment semantics and their optional nature;
- Publication feedback and immutable superseding Assets;
- projection-only GitHub behaviour;
- the contribution guide and launch material named for 0.0.9.

Do not document unimplemented future behaviour. Return a bounded backlog ordered by user-blocking impact.
```

**Expected result**

A public-product backlog exists based on actual implemented behaviour.

**Verify before continuing**

Remove aspirational items and confirm contribution/launch material plus Experiment boundary documentation are represented where incomplete.

### Step 12 — Deliver each blocking public-surface gap through Pactwright

**References:** Public project §§3–16; Delivery §19; Review & Creative §9

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

Repeat only for blocking audit gaps; contribution guide and launch material must be delivered before completion.

### Step 13 — Re-check public creative readiness

**References:** Open-Source Project Organisation §1.2; PI §§10, 13

**Run**

```bash
pnpm pactwright intelligence onboard
```

Require `identity`, `content`, `product` and `go-to-market` to be Covered before launch/case-study work. Fill gaps through normal Delivery → ingest → triage/promotion.

**Expected result**

Launch and case-study content is grounded in current accepted truth.

**Verify before continuing**

Inspect coverage and selected Knowledge for positioning, audience, voice, product claims and CTA decisions.

### Step 14 — Create and publish the Pactwright-building-Pactwright case study

**References:** Public project §9; Review & Creative §§9–13

**Run**

```text
Inspect canonical Pactwright graph/Evidence, Review findings, Publications, Deployments, Experiments where actually used, Operations Observations and PI/Delivery outcomes from the programme. Prepare a factual grounding set for the Pactwright-building-Pactwright case study covering bootstrap, self-hosted Delivery, PI, Graph Review, Creative Delivery, production learning and corrective Delivery. Include Experiment only if verified programme evidence supports the claim; do not invent milestones/outcomes.
```

Then:

```text
/capture-intent "Create the Pactwright-building-Pactwright case study from verified implementation evidence."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

After manual approval of the exact output:

```bash
pnpm pactwright creative approve-asset <evidence-id>
pnpm pactwright creative record-publication <asset-id> <channel>
pnpm pactwright creative validate
```

**Expected result**

The case study is a real grounded Publication produced through the lifecycle it describes.

**Verify before continuing**

Trace factual claims to grounding and Publication to the approved Asset hash; no raw operational/Experiment payload is published.

## Stage 4 — Prove a repeated closed loop on Pactwright

Run this stage from the Pactwright repository root.

### Step 15 — Collect a real Pactwright production finding

**References:** Operations §§8–13

**Run**

```bash
pnpm pactwright operations refresh
pnpm pactwright operations validate
```

**Expected result**

A new or matched real operational finding is available.

**Verify before continuing**

Inspect the execution/Observation. When a durable new meaning exists, confirm PI hand-off printed `<internal-source-id>`. If the refresh legitimately produces no new durable finding, use another already observed real Pactwright finding from the programme; do not manufacture one.

### Step 16 — Route the finding and deliver a correction

**References:** Operations §13; PI §11; Delivery §19

**Run**

```bash
pnpm pactwright intelligence triage <internal-source-id>

# only when reviewed promotion is required and accepted
pnpm pactwright intelligence promote <internal-source-id>

pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright operations corrective-roadmap
```

Then:

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

Production meaning becomes Delivery only through PI governance.

**Verify before continuing**

Trace Observation → Source → accepted candidate → Intent → Evidence.

### Step 17 — Expose the correction and observe again

**References:** Operations §§7–16; Review & Creative §§12–13

**Run**

For software:

```bash
pnpm pactwright operations record-deployment <evidence-id>
```

For creative work, after human approval and real publication:

```bash
pnpm pactwright creative approve-asset <evidence-id>
pnpm pactwright creative record-publication <asset-id> <channel>
```

Use an Experiment only if the correction independently requires controlled comparison under the CP6 contract; do not make Experiment mandatory for this repeated loop.

Then:

```bash
pnpm pactwright operations refresh
```

**Expected result**

Second-round evidence validates the correction, produces new learning or exposes another explicit issue.

**Verify before continuing**

Prior Evidence/Deployment/Experiment/Observation records remain immutable; changed operational truth uses new records/supersession as defined by owners.

## Stage 5 — Run failure drills

Prove known boundaries fail closed before releasing the hardened line. Any drill failure blocks release and returns to Stage 2 with a permanent regression fixture.

### Step 18 — Execute the final generic failure matrix

**References:** All Pactwright owning specs; Experiment §§11–12

**Run**

Run safe real-path/fixture drills for at least:

```text
invalid extension dependency removal
invalid Asset hash
Deployment with invalid Evidence
Publication mutation attempt from Operations
duplicate Observation
stale PI derived report
GitHub Project drift
missing agent-pack capability
failed Operations collection
failed Review provider call
invalid Experiment exposure/hash
post-record Experiment mutation
missing Experiment primary metric/decision rule
shadow represented as user-facing
invalid/unstable assignment where stability is required
guardrail breach ignored by analysis
insufficient Experiment evidence forced conclusive
Experiment Observation attempting automatic promotion
raw experiment sample copied into graph
failed experiment execution corrupting compared exposure
```

For each, execute the real Pactwright path where practical, record the expected failure boundary and prove unrelated canonical state remains valid.

**Expected result**

Known core/extension/Experiment failures fail closed without corrupting sibling/core truth.

**Verify before continuing**

Review drill evidence individually and rerun the full validation/evaluation matrix. At least one actual Experiment failure drill must execute end to end rather than existing only as a schema unit test.

## Stage 6 — Release `0.0.9`

`0.0.9` releases only after Stages 1–5 are accepted.

### Step 19 — Prepare, publish and tag `0.0.9`

**References:** Implementation Guide — npm release model, trusted release workflow, release failure; Distribution §2

**Run**

Update `CHANGELOG.md` from accepted Checkpoint 9 Evidence only, then create the release PR:

```bash
VERSION=0.0.9
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

Trusted `release.yml` verifies the exact merged source and publishes every still-unpublished package in the `0.0.9` family under `next`.

**Verify before continuing**

```bash
pnpm view pactwright@0.0.9 version
pnpm view @pactwright/standard@0.0.9 version
pnpm view @pactwright/project-intelligence@0.0.9 version
pnpm view @pactwright/review-creative@0.0.9 version
pnpm view @pactwright/creative@0.0.9 version
pnpm view @pactwright/operations@0.0.9 version
```

Every command returns `0.0.9`; every package shows provenance/trusted-publisher metadata.

## Stage 7 — Prove Kakeibo regression integrity and production Kei learning

Run this stage from the Kakeibo repository root unless explicitly stated otherwise.

### Step 20 — Upgrade/reconcile Kakeibo fully

**References:** Distribution §15; Kakeibo Acceptance Profile §13

**Run**

```bash
pnpm add -D \
  pactwright@0.0.9 \
  @pactwright/project-intelligence@0.0.9 \
  @pactwright/review-creative@0.0.9 \
  @pactwright/creative@0.0.9 \
  @pactwright/operations@0.0.9

pnpm pactwright extension upgrade project-intelligence
pnpm pactwright extension upgrade review-creative
pnpm pactwright extension upgrade operations
pnpm pactwright upgrade
pnpm pactwright sync
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

**Expected result**

Kakeibo runs the hardened checkpoint release and complete configured agent pack.

**Verify before continuing**

Run:

```bash
pnpm pactwright validate
pnpm pactwright intelligence validate
pnpm pactwright creative validate
pnpm pactwright operations validate
pnpm pactwright eval
```

Also run Kakeibo's repository-defined deterministic/application/evaluation test suites required by current `06`.

### Step 21 — Run the seven-owner Kakeibo regression Review

**References:** all current Kakeibo specs; Graph Review; Kakeibo Acceptance Profile §13

**Run**

Run the configured reviewers needed to cover product/financial/UX/Kei/architecture/operations/public boundaries. At minimum include product, architecture and graph/system consistency review; use additional configured specialist reviewers where needed rather than assuming four fixed agents cover all seven owners.

Review explicitly for:

```text
financial double counting
preparation / needs-decision / worth-checking / looks-safe becoming reviewed truth
provider lifecycle leaking into review state
transfer or credit-card repayment becoming spending incorrectly
direct mobile/private client → Neon access
financial domain / audit / analytics / telemetry conflation
product/mobile financial behaviour flowing to marketing analytics/Meta
Kei recalculating or inventing canonical financial values
model-selected task expanding application authority
optional skill/tool increasing Kei authority
prompt injection through merchant / CSV / provider text
Known / Likely / Unknown drift or unsupported certainty
financial-advice boundary weakening
KeiRelease and model-route identity conflation
released behaviour mutable without new KeiRelease
production behaviour existing only in an external prompt/dashboard rather than Git-traceable source
unsafe Experiment variant weakening financial/privacy/user-authority invariants
shadow candidate becoming user-facing / side-effecting / blocking active response
raw private production AI traces required by or leaking into public artefacts
published Asset/grounding mutated by later production evidence
```

**Expected result**

The complete current Kakeibo design remains coherent after the Pactwright hardening changes.

**Verify before continuing**

Every accepted finding identifies the owning Kakeibo spec and routes through Review → PI → governed Delivery where correction is required. Do not fix owner conflicts inside this checkpoint text.

### Step 22 — Select a confirmed Kei production defect and create a minimum reproduction

**References:** current Kakeibo `03`, `05`, `06`; Acceptance Profile §13

**Run**

```text
Select one real confirmed Kei defect from Operations/Experiment/production evidence accumulated in Checkpoints 6–8. If no real confirmed defect exists, use a safely simulated defect drawn from an accepted critical failure class in current Kakeibo `06`; label it simulated and do not fabricate production evidence.

Reduce it to the minimum reproducible scenario needed to demonstrate the behavioural failure. Remove real financial/private data. Preserve only the semantic conditions needed to reproduce the defect.
```

Examples of valid failure classes include authority breach, incorrect evidence discipline, prompt-injection susceptibility, invalid structured output/fallback, financial-truth contradiction or unsafe task behaviour. A mere style preference is not sufficient.

**Expected result**

A confirmed/safely simulated defect has a minimal sanitised reproduction and clear owner.

**Verify before continuing**

The reproduction fails the current accepted Kei release in the intended way, contains no unnecessary production personal/financial payload, and does not change Pactwright Experiment semantics.

### Step 23 — Convert the defect into a permanent Kakeibo benchmark/regression case

**References:** current Kakeibo `06`; Checkpoint 5 offline gates; Acceptance Profile §13

**Run**

Add the minimum sanitised/synthetic case to Kakeibo's repository-owned permanent evaluation assets:

```text
minimum reproduction
→ sanitised/synthetic benchmark case
→ strongest deterministic assertion available
→ evaluator only for genuinely semantic/probabilistic dimensions
```

Classify it into the appropriate permanent benchmark class, such as:

```text
financial correctness
evidence discipline
authority / financial safety
tone / usefulness
prompt injection / hostile financial text
structured output / fallback
operational quality
```

Version/hash the affected benchmark suite/dataset according to Kakeibo `06`. Do not rely on one LLM judge or one aggregate score.

**Expected result**

The production defect becomes permanent repository-owned regression knowledge.

**Verify before continuing**

The case fails the current defective behaviour, passes deterministic dataset/schema validation and is safe to retain/share according to Kakeibo `07`.

### Step 24 — Deliver the candidate fix as a new immutable KeiRelease

**References:** current Kakeibo `03`, `05`, `06`; Delivery/Review

**Run**

Route the accepted defect through normal PI/Delivery if that governance path has not already occurred, then implement the smallest owning-layer fix.

The fix must produce a new immutable Kei release identity whenever production behaviour changes, including prompt/policy/persona/task/output/tool/skill changes. Resolve the exact candidate manifest:

```text
Kei semantic version
bundle hash
policy version/hash
persona version/hash
task-contract versions/hashes
output schema version/hash
tool/skill set version/hash
model-route reference
application commit
benchmark-suite version/hash
benchmark-dataset version/hash
```

Do not mutate the prior KeiRelease. Do not conflate changing the behaviour bundle with changing the model route.

**Expected result**

A traceable candidate fix exists as a new Kakeibo-owned immutable KeiRelease.

**Verify before continuing**

The defect case passes on the candidate; old release identity remains unchanged/addressable; exact bundle and benchmark identities differ where required.

### Step 25 — Run the normal Kei release gates and controlled production evaluation

**References:** current Kakeibo `06`; Operations Experiment Semantics; Acceptance Profile §§10, 13

**Run**

Execute the existing Kakeibo lifecycle rather than creating a CP9-specific shortcut:

```text
candidate implementation
→ deterministic contract tests
→ complete offline benchmark
→ red-team suite
→ repeated probabilistic evaluation where required
→ human sample review where required
→ staging
→ shadow where required
→ controlled promotion or rejection
```

When production comparison is required:

1. record exact candidate operational Deployment through normal Operations;
2. compare with the appropriate exact active exposure using a **new immutable Experiment** if the comparison is a new controlled evaluation;
3. predeclare hypothesis/metrics/guardrails/minimum evidence/decision rule;
4. run shadow first where required;
5. route outcome through Observation → PI;
6. promote/reject only through normal Kakeibo governance.

Do not mutate/reuse the old Checkpoint 6 Experiment contract for a new candidate comparison.

**Expected result**

The defect fix completes the same engineering/Operations lifecycle required for any production Kei behaviour change.

**Verify before continuing**

Trace:

```text
production defect
→ minimum reproduction
→ permanent benchmark case
→ candidate fix
→ new KeiRelease
→ deterministic/offline gates
→ Deployment
→ new Experiment where required
→ Observation
→ PI/governed promotion or rejection
```

Confirm hard financial/privacy/user-authority/advice invariants were never used as experimental variables and no automatic promotion occurred.

### Step 26 — Complete one real Kakeibo repeated closed loop

**References:** Operations / PI / Delivery; current Kakeibo `06`

**Run**

Using current Kakeibo state, select one accepted real production Observation (it may be the Kei regression outcome above when appropriate). Route it through PI and normal Delivery, expose the accepted result as Deployment or Publication, then run Operations again.

Do not force a new Experiment unless controlled comparison is independently required.

**Expected result**

The external product proves the general closed-loop architecture after hardening as well as the specialised Kei regression lifecycle.

**Verify before continuing**

Review exact trace ids through the later Observation and run Kakeibo repository tests plus Pactwright validations.

## Stage 8 — Publish the first supported Pactwright release

`0.0.9` has already passed failure drills and Kakeibo acceptance. Promote the same accepted code line through the trusted tag workflow.

If a defect is found after `0.0.9` publication, do not promote it: published versions are immutable. Fix forward with the next development version and repeat relevant acceptance before returning here.

### Step 27 — Prepare and tag `0.1.0`

**References:** Implementation Guide — npm release model, trusted release workflow, release failure; Distribution §2

**Run**

Update `CHANGELOG.md` with a `0.1.0` summary from accepted programme Evidence and clearly mark the supported CLI/package surface.

```bash
VERSION=0.1.0
DEFAULT_BRANCH="$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name)"

git switch "$DEFAULT_BRANCH"
git pull --ff-only
git switch -c "release/$VERSION"

pnpm -r exec npm version "$VERSION" --no-git-tag-version --allow-same-version
npm version "$VERSION" --no-git-tag-version --allow-same-version
pnpm install
pnpm verify
pnpm publish -r --dry-run --tag latest --access public

git add -A
git commit -m "chore: release $VERSION"
git push -u origin HEAD

gh pr create \
  --title "Release $VERSION" \
  --body "Prepare the first supported Pactwright release."

gh pr checks --watch
gh pr merge --squash --delete-branch

git switch "$DEFAULT_BRANCH"
git pull --ff-only

git tag -a "v$VERSION" -m "v$VERSION"
git push origin "v$VERSION"
```

**Expected result**

Trusted `release.yml` runs the complete verification/compatibility gate and publishes the accepted package family as `0.1.0` under `latest` with provenance.

**Verify before continuing**

```bash
pnpm view pactwright@latest version
pnpm view @pactwright/standard@latest version
pnpm view @pactwright/project-intelligence@latest version
pnpm view @pactwright/review-creative@latest version
pnpm view @pactwright/creative@latest version
pnpm view @pactwright/operations@latest version
pnpm view pactwright@next version
```

The first six return `0.1.0`; `next` remains the accepted development line according to the Implementation Guide (normally `0.0.9` at this checkpoint unless a required fix-forward release occurred).

### Step 28 — Smoke-test the supported release from shipped material

**References:** Implementation Guide — test layers/public-product progression; Public project §3.4; Implementation Principles §13

**Run**

In a clean repository outside Pactwright/Kakeibo:

```bash
mkdir -p /tmp/pactwright-quickstart && cd /tmp/pactwright-quickstart
git init .
pnpm init
pnpm add -D pactwright@0.1.0
```

Then follow the published README Quick Start verbatim using only shipped public material. Complete initialisation, validation and the documented minimal Delivery pass. Record every deviation.

**Expected result**

A new user can install and operate the supported release from shipped material alone.

**Verify before continuing**

No undocumented step is required. Any blocking deviation must be fixed through normal Delivery and the smoke test repeated before closure.

### Step 29 — Upgrade Kakeibo to the supported release

**References:** Distribution §§2, 15; Implementation Guide — npm release model

**Run**

From a Kakeibo acceptance branch:

```bash
pnpm add -D \
  pactwright@0.1.0 \
  @pactwright/project-intelligence@0.1.0 \
  @pactwright/review-creative@0.1.0 \
  @pactwright/creative@0.1.0 \
  @pactwright/operations@0.1.0

pnpm pactwright extension upgrade project-intelligence
pnpm pactwright extension upgrade review-creative
pnpm pactwright extension upgrade operations
pnpm pactwright upgrade
pnpm pactwright sync
pnpm pactwright github sync --dry-run
pnpm pactwright github sync

pnpm pactwright validate
pnpm pactwright intelligence validate
pnpm pactwright creative validate
pnpm pactwright operations validate
pnpm pactwright eval
```

Commit package/lock/config changes, push, open a PR, wait for required checks and merge.

**Expected result**

Kakeibo consumes the exact supported `0.1.0` family and passes its normal repository/Pactwright checks.

**Verify before continuing**

```bash
pnpm list pactwright @pactwright/project-intelligence @pactwright/review-creative @pactwright/creative @pactwright/operations
```

Every direct Pactwright package resolves to `0.1.0`, and the Kakeibo PR is merged with required checks green.

## Stage 9 — Capture checkpoint feedback

Run from the Pactwright repository root.

### Step 30 — Capture blocking feedback as product evidence

**References:** Implementation Principles §§7, 13–14; PI §8; Implementation Guide — transition rule

**Run**

```text
Collect defects, friction and gaps observed during Checkpoint 9 implementation, generic failure drills, Experiment hardening, Kakeibo seven-owner review, production Kei regression lifecycle, both Kakeibo installs and the Quick Start smoke test.

Ingest each material finding as a PI Source and triage it. Record blocking findings as intent candidates only through normal PI governance. Distinguish Kakeibo-specific product/Kei findings from generic Pactwright responsibility failures; do not generalise Kakeibo-specific semantics merely because they produced a useful regression case.
```

**Expected result**

Blocking feedback is captured as traceable product evidence before Graduation.

**Verify before continuing**

Every blocking finding traces to a Source and triage record; no known blocking failure is carried silently into Graduation.

## Exit gate

Checkpoint 9 passes only when all of the following hold:

1. Repeatable failures from Checkpoints 1–8 have a traceable owner and accepted permanent regression/evaluation coverage; one-off taste has not been converted into framework semantics.
2. Generic Operations Experiment coverage includes invalid exposure/hash, immutable-contract enforcement, required predeclared success/guardrail/decision semantics, assignment/shadow safety, insufficient evidence, no auto-promotion, no raw sample persistence and failed-execution isolation.
3. No single aggregate Experiment/agent score decides acceptance; deterministic assertions outrank model judgement where applicable.
4. Distribution/GitHub regressions prove Experiment projections cannot fabricate promotion, leak raw evidence, survive Operations disablement incorrectly or become canonical through UI edits.
5. Only observed hardening fixes were implemented and each fix has regression coverage.
6. The full Pactwright validation/evaluation matrix passes and GitHub desired state converges.
7. Public surfaces match actual capability, including optional controlled Experiment semantics, contribution guidance and launch material; the grounded Pactwright case study is published.
8. Pactwright closes a repeated production-feedback loop without making Experiment mandatory.
9. The final generic failure matrix includes at least one end-to-end Experiment failure drill and all drills preserve unrelated canonical state.
10. `0.0.9` is published under `next` with verified provenance before Kakeibo hardened acceptance.
11. Kakeibo runs a regression Review across all seven current canonical owners and explicitly checks financial/review truth, architecture/privacy separation, bounded Kei authority, source prompt injection, release/model-route identity, Git-owned behaviour, safe experiments and private/public trace boundaries.
12. At least one real or clearly labelled safely simulated confirmed Kei defect completes `failure → minimum reproduction → sanitised/synthetic permanent benchmark case → candidate fix → new immutable KeiRelease → deterministic/offline gates → staging/shadow where required → controlled promotion or rejection`.
13. The previous KeiRelease remains immutable/addressable; production behaviour changes never silently reuse its release identity and behavioural release identity remains distinct from model route.
14. Any new controlled comparison for the Kei fix uses a new immutable Operations Experiment rather than rewriting the Checkpoint 6 contract; the result reaches PI through Observation and cannot auto-promote.
15. Kakeibo also completes one normal repeated production-feedback loop after hardening; Experiment is used only when independently justified.
16. The accepted family is published as supported `0.1.0` under `latest`, the shipped Quick Start passes in a clean repository and Kakeibo upgrades to the exact supported registry family.
17. Blocking implementation/installation/Quick Start/Kakeibo findings are captured through PI and no known blocking failure is silently carried into Graduation.
18. No Kakeibo-specific `KeiRelease`, model-route, task, policy, persona or benchmark node type has been added to Pactwright merely to support the regression lifecycle.
19. No speculative future semantics were introduced merely for completeness.

---

**Pactwright — Checkpoint 9 — Hardened Closed Loop v10**
