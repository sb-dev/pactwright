# Pactwright — Checkpoint 9 — Hardened Closed Loop

**Version:** 11  
**Entry condition:** Checkpoint 8 is accepted.  
**Release:** `0.0.9`  
**Exit capability:** The complete first-party Pactwright system is evaluated, failure-hardened, publicly documented and repeatedly proven in closed loops on Pactwright and Kakeibo, including permanent Experiment regression coverage and a production Kei defect learning loop, without expanding semantics beyond observed need.

## 1. Goal

Turn evidence from Checkpoints 1–8 into regression coverage and targeted hardening, complete the initial public product, prove repeated feedback loops, and prepare the compatible `0.1.0` release candidate.

Hardening is evidence-driven:

```text
observed failure
→ owning responsibility
→ regression case
→ smallest fix
→ validation/evaluation
→ real closed-loop proof
```

Do not use this checkpoint as a licence to implement speculative future architecture.

## 2. Canonical baseline

Use canonical Specs 01–08 plus the Implementation Principles and Implementation Guide. Research logs are rationale only.

Checkpoints 6–9 additionally use the adopted Operations amendment in [Pactwright — Operations Experiment Semantics](../research-logs/2026-09-02-pactwright-operations-experiment-semantics.md), and the [Kakeibo System-Level Acceptance Profile](./00-kakeibo-acceptance-profile.md).

Kakeibo acceptance uses its current canonical specifications.

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

**Default execution location:** the Pactwright repository root unless the step explicitly names Kakeibo or a fixture.

## 3. Evaluation ownership

Dynamic ids such as `<source-id>`, `<internal-source-id>`, `<brief-id>`, `<evidence-id>`, `<deployment-id>`, `<experiment-id>` and `<observation-id>` must come from an earlier command or from configuration this runbook explicitly creates.

Pactwright-level evaluation owners are:

```text
Core Delivery
Project Intelligence
Graph Review
Assets / Publication
Operations
Distribution / GitHub
Agent Pack Pactwright responsibilities
```

Production-domain quality remains in the relevant Production Skills repositories.

Examples:

```text
Pactwright
→ did Delivery preserve Contract scope?
→ did Graph Review produce supported Findings and route them correctly?
→ did Asset approval enforce exact bytes/grounding?

Production Skills
→ is the software implementation technically good?
→ is the UX/design good?
→ is the narrative/video/music quality good?
```

Do not recreate Creative Delivery evaluation, Generation Guidance evaluation or a universal production benchmark inside Pactwright.

Kakeibo-owned product or Kei regressions belong in Kakeibo's own permanent tests and evaluations rather than in generic Pactwright semantics. A fix to Experiment handling must remain generic; a fix to Kakeibo Kei behaviour belongs to Kakeibo and must not create new Pactwright Kei node types.

## Stage 1 — Convert observed failures into owned regression cases

### Step 1 — Inventory repeatable failures by semantic owner

**Run**

Review accepted Pactwright Evidence, PI Sources/Knowledge changes, Graph Review Executions/Findings, Assets/Publications, Operations Observations/executions, GitHub reconciliation failures and Kakeibo acceptance failures from Checkpoints 1–8.

Create a bounded inventory grouped by:

```text
Delivery
Project Intelligence
Graph Review
Assets / Publication
Operations
Distribution / GitHub
Agent Pack responsibility
Production Skills owner where the failure is domain quality
```

Each candidate must cite concrete prior evidence. Exclude taste and one-off project preference.

**Expected result**

Every proposed hardening case has evidence and a clear owner.

### Step 2 — Implement Delivery and PI regression cases

**Run**

Add accepted Pactwright evaluation cases for:

```text
Delivery
→ Contract fidelity
→ scope discipline
→ Brief quality
→ forbidden mutation
→ Review defect detection
→ Evidence accuracy

Project Intelligence
→ triage correctness
→ consequence class
→ evidence comparison
→ context selection
→ human-approval boundary
→ roadmap provenance
→ no automatic Intent creation
```

Prefer deterministic assertions where possible and keep semantic dimensions separate.

### Step 3 — Implement Graph Review regression cases

**Run**

Add cases for:

```text
supported issue detection
unsupported-claim avoidance
cross-record contradictions
scope resolution
PI context use
Finding provenance
Finding → PI hand-off
failed hand-off retry
pinned replay failure/current rerun separation
forbidden sibling-owned mutation
```

Do not add reviewer-roster or Review Definition cases.

### Step 4 — Implement Assets / Publication regression cases

**Run**

Add cases for:

```text
candidate output cannot become Asset without human approval
exact content hash validation
governed grounding required only when applicable
Asset immutability
Asset supersession history
Publication requires approved Asset
Publication asset_hash equality
failed Publication leaves Asset unchanged
Operations absence/failure does not invalidate Publication
```

Keep production quality outside this Extension's evaluation.

### Step 5 — Implement Operations and Distribution/GitHub regression cases

**Run**

Add accepted cases covering:

```text
Operations
→ exposure attribution
→ signal compression
→ baseline interpretation
→ unsupported causality
→ duplicate handling
→ PI routing
→ no raw telemetry in graph

Distribution / GitHub
→ capability/dependency resolution
→ exact lock/replay environment identity
→ extension disablement
→ owned remote reconciliation
→ profile conflict handling
→ canonical-vs-derived boundaries
```

Do not invent answers to the declared remote-resource/concurrency/check-mapping gaps merely to make tests pass.

## Stage 2 — Baseline and harden only observed weak points

The generic controlled-evaluation contract must also carry permanent regression coverage.

```text
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
```

Use the non-Kakeibo generic Experiment fixture from Checkpoint 6 for framework assertions. Do not create one aggregate Experiment-quality score.

Include the Experiment projection failures required by Checkpoint 8: wrong or stale control/candidate links; derived state implying a promotion that did not occur; a missing material guardrail breach in a derived projection; an empty Experiments view fabricating state; raw experiment evidence projected to GitHub; disabling Operations leaving Experiments fields, views or path ownership behind; and a GitHub field edit attempting to author or mutate Experiment truth.

### Step 6 — Run the complete Pactwright evaluation suite

**Run**

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm pactwright eval
```

**Expected result**

Per-capability/per-case results exist across all Pactwright responsibilities.

### Step 7 — Compare a real Agent Pack candidate only when one exists

**Run**

If hardening changes `@pactwright/standard` AI behaviour, build the candidate and compare it against the compatible `0.0.8` baseline using:

```bash
pnpm pactwright eval \
  --baseline @pactwright/standard@0.0.8 \
  --candidate <candidate-pack-or-environment>
```

If no Agent Pack behaviour changed, mark this step not applicable. Do not invent a candidate.

**Expected result**

Real AI responsibility changes are compared against the last released baseline without one aggregate score.

### Step 8 — Implement only evidence-backed fixes

**Run**

For every accepted failure:

```text
identify owning spec/responsibility
→ implement smallest fix
→ add regression case
→ preserve existing ownership boundaries
```

Do not:

- add a generic workflow/BPM engine;
- add provider/model routing to Pactwright;
- add Review Definitions/reviewer roster;
- add a Creative Delivery lifecycle;
- add new graph semantics for production-domain quality;
- resolve declared open gaps unless the evidence demonstrates the missing minimal contract and the owning canonical spec is deliberately updated first.

### Step 9 — Run the complete validation matrix

**Run**

```bash
pnpm pactwright validate
pnpm pactwright intelligence validate
pnpm pactwright graph-review validate
pnpm pactwright assets validate
pnpm pactwright operations validate
pnpm pactwright github sync --dry-run
pnpm pactwright eval
```

**Expected result**

All deterministic validations pass and semantic regressions are explicitly reviewed.

## Stage 3 — Run failure drills at real subsystem boundaries

### Step 10 — Run Graph Review and replay failure drills

Prove at least:

```text
failed Graph Review execution
→ provenance exists
→ no Findings

successful Finding + failed PI hand-off
→ Finding remains valid
→ retry hand-off without rerun

unavailable pinned replay input
→ explicit failure
→ no current-state substitution
```

### Step 11 — Run Asset/Publication failure drills

Prove at least:

```text
fact-bearing Asset + required PI unavailable/ungrounded
→ approval blocked

external Asset bytes unverifiable
→ validation cannot claim hash match

failed Publication recording
→ approved Asset unchanged
```

Do not invent Publication retry identity if the canonical gap remains unresolved.

### Step 12 — Run Operations and GitHub failure drills

Prove at least:

```text
source unavailable
→ failed Operations execution
→ existing canonical truth remains valid

insufficient evidence
→ no Observation

failed Observation → PI hand-off
→ Observation valid/retryable

ambiguous GitHub-owned resource
→ preserve/report ambiguity
→ no destructive reconciliation
```

Experiment failure drills must additionally cover:

```text
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

At least one actual Experiment failure drill must execute end to end rather than existing only as a schema unit test.

## Stage 4 — Complete the initial public product

### Step 13 — Audit public surfaces against actual shipped capability

Inspect:

```text
README
Docs
Academy
Examples
Website
Case Studies
Blog
Ecosystem registry/catalogue
Contribution material
Release/launch material
```

Identify only gaps required for:

```text
Discover
→ Understand
→ Try
→ Learn
→ Extend
→ Contribute
```

Do not document unimplemented future semantics.

### Step 14 — Deliver blocking public-product gaps

For each user-blocking gap, run normal Pactwright Delivery using relevant Production Skills where specialised expertise is needed.

Before fact-bearing public Asset approval, satisfy the applicable PI grounding/readiness rules.

Do not require Assets/Publications for every documentation change; use them only when the output has independent durable publication value.

### Step 15 — Publish the Pactwright-building-Pactwright case study

**Run**

Use verified implementation evidence from the entire programme to deliver a factual case study covering:

```text
bootstrap
self-hosted Delivery
Project Intelligence
Graph Review
Production Skills integration
Assets / Publication
Operations feedback
corrective Delivery
GitHub projection
```

Do not describe Creative Delivery or reviewer rosters.

After successful Evidence and explicit human approval of the exact final output:

```bash
pnpm pactwright assets approve-asset <evidence-id>
pnpm pactwright assets record-publication <asset-id> <channel>
pnpm pactwright assets validate
```

**Expected result**

The flagship case study is itself a governed Asset/Publication produced through the system it describes.

## Stage 5 — Prove repeated closed loops on Pactwright

### Step 16 — Collect a real operational finding

**Run**

```bash
pnpm pactwright operations refresh
pnpm pactwright operations validate
```

If a canonical Observation exists, capture its PI Source id.

If no durable Observation is justified, do not manufacture one; use another real bounded operational source/surface with sufficient evidence.

### Step 17 — Route the finding and deliver a correction

**Run**

```bash
pnpm pactwright intelligence triage <internal-source-id>

# where reviewed promotion is required and accepted
pnpm pactwright intelligence promote <internal-source-id>

pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright operations corrective-roadmap
```

For one accepted candidate, capture an explicit Intent and complete normal Delivery to Evidence.

**Expected result**

Operational evidence becomes Delivery only through PI governance and explicit authority.

### Step 18 — Expose the correction and observe again

For software:

```bash
pnpm pactwright operations record-deployment <evidence-id>
```

For an approved durable public output:

```bash
pnpm pactwright assets approve-asset <evidence-id>
pnpm pactwright assets record-publication <asset-id> <channel>
```

Use an Experiment only if the correction independently requires controlled comparison under the CP6 contract; do not make Experiment mandatory for this repeated loop.

Then:

```bash
pnpm pactwright operations refresh
```

**Expected result**

Second-round evidence validates the correction, provides new learning or explicitly shows no durable new Observation.

## Stage 6 — Prove Kakeibo regression integrity and production Kei learning

Run this stage from the Kakeibo repository root unless explicitly stated otherwise.

### Step 19 — Upgrade/reconcile Kakeibo fully

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

### Step 20 — Run the seven-owner Kakeibo regression Review

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

### Step 21 — Select a confirmed Kei production defect and create a minimum reproduction

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

### Step 22 — Convert the defect into a permanent Kakeibo benchmark/regression case

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

### Step 23 — Deliver the candidate fix as a new immutable KeiRelease

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

### Step 24 — Run the normal Kei release gates and controlled production evaluation

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

### Step 25 — Complete one real Kakeibo repeated closed loop

**References:** Operations / PI / Delivery; current Kakeibo `06`

**Run**

Using current Kakeibo state, select one accepted real production Observation (it may be the Kei regression outcome above when appropriate). Route it through PI and normal Delivery, expose the accepted result as Deployment or Publication, then run Operations again.

Do not force a new Experiment unless controlled comparison is independently required.

**Expected result**

The external product proves the general closed-loop architecture after hardening as well as the specialised Kei regression lifecycle.

**Verify before continuing**

Review exact trace ids through the later Observation and run Kakeibo repository tests plus Pactwright validations.

## Stage 7 — Prepare and publish the supported `0.1.0`

### Step 26 — Define supported-release acceptance from observed maturity

Before changing dist-tag, confirm:

```text
all Checkpoints 1–9 accepted
full validation/eval matrix understood
Pactwright and Kakeibo closed loops proven
public Discover→Contribute journey complete
known blocking failures resolved
remaining open gaps explicitly documented and non-blocking
```

This is not a new semantic maturity framework; it is the release acceptance evidence for the first supported version.

### Step 27 — Publish `0.1.0`

Use the Implementation Guide release process and publish the compatible first-party family under `latest`:

```text
pactwright
@pactwright/standard
@pactwright/project-intelligence
@pactwright/graph-review
@pactwright/assets-publication
@pactwright/operations
```

No `@pactwright/creative` or `@pactwright/review-creative` package exists.

Verify registry versions/dist-tags/provenance and install the exact `0.1.0` family into Kakeibo before Graduation.

## Stage 8 — Capture final checkpoint learning

### Step 28 — Govern remaining non-blocking findings

Ingest remaining evidence-backed Pactwright findings through PI, distinguishing:

```text
known non-blocking open design gap
repeatable product defect
future improvement backed by usage
project-specific preference
```

Do not convert every remaining idea into an Intent.

## Exit gate

Checkpoint 9 closes only when:

- evaluation ownership matches current subsystem boundaries;
- Production Skills own domain-specific quality benchmarks;
- all observed repeatable Pactwright failures have an owner and regression coverage where justified;
- failure drills prove Graph Review replay/hand-off, Asset/Publication grounding/hash boundaries, Operations failure semantics and conservative GitHub reconciliation;
- the full validation matrix passes;
- no Creative Delivery, reviewer roster, provider registry or Generation Guidance subsystem has returned;
- Pactwright public surfaces match implemented behaviour;
- the Pactwright-building-Pactwright case study is a real governed Publication;
- Pactwright and Kakeibo each complete repeated evidence-driven closed loops;
- the supported package family is exactly the six current first-party packages;
- `0.1.0` is published under `latest` and installed in Kakeibo;
- generic Operations Experiment coverage includes invalid exposure/hash, immutable-contract enforcement, required predeclared success/guardrail/decision semantics, assignment/shadow safety, insufficient evidence, no auto-promotion, no raw sample persistence and failed-execution isolation;
- no single aggregate Experiment or agent score decides acceptance, and deterministic assertions outrank model judgement where applicable;
- Distribution/GitHub regressions prove Experiment projections cannot fabricate promotion, leak raw evidence, survive Operations disablement incorrectly or become canonical through UI edits;
- the final generic failure matrix includes at least one end-to-end Experiment failure drill and every drill preserves unrelated canonical state;
- `0.0.9` is published under `next` with verified provenance before Kakeibo hardened acceptance;
- Kakeibo runs a regression Review across all seven current canonical owners, explicitly checking financial/review truth, architecture/privacy separation, bounded Kei authority, source prompt injection, release/model-route identity, Git-owned behaviour, safe experiments and private/public trace boundaries;
- at least one real or clearly labelled safely simulated confirmed Kei defect completes `failure → minimum reproduction → sanitised/synthetic permanent benchmark case → candidate fix → new immutable KeiRelease → deterministic/offline gates → staging/shadow where required → controlled promotion or rejection`;
- the previous KeiRelease remains immutable and addressable, production behaviour changes never silently reuse its release identity, and behavioural release identity remains distinct from model route;
- any new controlled comparison for the Kei fix uses a new immutable Operations Experiment rather than rewriting the Checkpoint 6 contract, and its result reaches Project Intelligence through Observation without auto-promotion;
- Experiment is used only when independently justified, and Pactwright and Kakeibo each also close a normal repeated production-feedback loop without making Experiment mandatory;
- no Kakeibo-specific `KeiRelease`, model-route, task, policy, persona or benchmark node type has been added to Pactwright merely to support the regression lifecycle;
- the shipped Quick Start passes in a clean repository and Kakeibo upgrades to the exact supported registry family;
- remaining open gaps are explicit, evidence-backed and non-blocking;
- no known blocking failure enters Graduation.

---

**Pactwright — Checkpoint 9 — Hardened Closed Loop v11**
