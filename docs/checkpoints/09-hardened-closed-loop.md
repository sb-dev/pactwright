# Pactwright — Checkpoint 9 — Hardened Closed Loop

**Version:** 10  
**Entry condition:** Checkpoint 8 is accepted.  
**Release:** `0.0.9`  
**Exit capability:** The complete first-party Pactwright system is evaluated, failure-hardened, publicly documented and repeatedly proven in closed loops on Pactwright and Kakeido without expanding semantics beyond observed need.

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

Kakeido acceptance uses its current canonical specifications.

## 3. Evaluation ownership

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

## Stage 1 — Convert observed failures into owned regression cases

### Step 1 — Inventory repeatable failures by semantic owner

**Run**

Review accepted Pactwright Evidence, PI Sources/Knowledge changes, Graph Review Executions/Findings, Assets/Publications, Operations Observations/executions, GitHub reconciliation failures and Kakeido acceptance failures from Checkpoints 1–8.

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

Then:

```bash
pnpm pactwright operations refresh
```

**Expected result**

Second-round evidence validates the correction, provides new learning or explicitly shows no durable new Observation.

## Stage 6 — Prove the same closed loop on Kakeido

### Step 19 — Upgrade Kakeido to the compatible `0.0.9` family

Use ownership-specific runtime, Agent Pack and Extension upgrade commands. Then run the full validation matrix and GitHub dry-run.

### Step 20 — Run one repeated Kakeido feedback loop

Using current Kakeido canonical specs:

```text
real exposure
→ Operations evidence
→ Observation
→ PI Source
→ accepted candidate
→ explicit Intent
→ Delivery
→ new exposure
→ second Operations refresh
```

Use relevant Production Skills for domain implementation/evaluation. Do not pull Kakeido-specific quality rules into Pactwright evaluation.

**Expected result**

The same generic closed-loop architecture works in a materially different external project.

## Stage 7 — Prepare and publish the supported `0.1.0`

### Step 21 — Define supported-release acceptance from observed maturity

Before changing dist-tag, confirm:

```text
all Checkpoints 1–9 accepted
full validation/eval matrix understood
Pactwright and Kakeido closed loops proven
public Discover→Contribute journey complete
known blocking failures resolved
remaining open gaps explicitly documented and non-blocking
```

This is not a new semantic maturity framework; it is the release acceptance evidence for the first supported version.

### Step 22 — Publish `0.1.0`

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

Verify registry versions/dist-tags/provenance and install the exact `0.1.0` family into Kakeido before Graduation.

## Stage 8 — Capture final checkpoint learning

### Step 23 — Govern remaining non-blocking findings

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
- Pactwright and Kakeido each complete repeated evidence-driven closed loops;
- the supported package family is exactly the six current first-party packages;
- `0.1.0` is published under `latest` and installed in Kakeido;
- remaining open gaps are explicit, evidence-backed and non-blocking;
- no known blocking failure enters Graduation.

---

**Pactwright — Checkpoint 9 — Hardened Closed Loop v10**
