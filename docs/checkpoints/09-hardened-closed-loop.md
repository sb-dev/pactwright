# Pactwright — Checkpoint 9 — Hardened Closed Loop

**Version:** 9
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
- [Pactwright — Implementation Guide](./00-implementation-guide.md)
- [Pactwright Open-Source Project Organisation](../research-logs/2026-08-11-pactwright-open-source-project-organisation.md)
- [Design Specification: Astro + Cloudflare Workers + Meta CAPI](../research-logs/2026-08-11-astro-design-spec.md)
- [Kakeido — Financial Model Spec](../research-logs/2026-08-11-kakeido-financial-model-spec.md)
- [Kakeido — Product & UX Spec](../research-logs/2026-08-11-kakeido-product-and-ux-spec.md)
- [Kakeido — Mobile Design Spec](../research-logs/2026-08-11-kakeido-mobile-design-spec.md)
- [Kei — Assistant Spec](../research-logs/2026-08-11-kakeido-assistant-spec.md)
- [Kakeido — Tech Stack Engineering Spec](../research-logs/2026-08-11-kakeido-tech-stack-engineering-spec.md)

Only the owning specifications listed in each step define semantics. This runbook defines execution order, not new product meaning. Release mechanics — the SemVer/dist-tag model, the release PR recipe, the trusted `release.yml` workflow and release-failure handling — are owned by the Implementation Guide.

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

Dynamic ids such as `<source-id>`, `<internal-source-id>`, `<brief-id>` and `<evidence-id>` must come from an earlier command in the runbook. Commands that create or resolve durable records must print the ids required by later steps.

Fixture verification means repository test fixtures unless a step explicitly creates a real repository or GitHub resource.

## 4. Checkpoint specification map

- **Evaluation** — Pactwright — Distribution, Agents and Evaluation §16; Pactwright — Graph Review & Creative Delivery Engineering Spec §17; Pactwright — Operations Graph Engineering Spec §21
- **Definitions of Done/future boundary** — Pactwright — Delivery Graph and Lifecycle Engineering Spec §§24–26; Pactwright — Project Intelligence Graph Engineering Spec §§17–20; Pactwright — Graph Review & Creative Delivery Engineering Spec §§21–26; Pactwright — Operations Graph Engineering Spec §§22–29; Pactwright — GitHub Actions and Views §§26–28
- **Public project** — Pactwright Open-Source Project Organisation §§3–16
- **Release model** — Pactwright — Implementation Guide (npm release model, trusted release workflow, release failure, test layers)

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

**References:** Evaluation — Distribution §16; Core Definition of Done — Delivery Graph §24

**Run**

```text
Implement the accepted Delivery evaluation cases for contract fidelity, scope discipline, required structure, forbidden mutation and Review defect detection. Keep deterministic assertions separate from semantic judgement.
```

**Expected result**

Observed core Delivery failures become repeatable tests.

**Verify before continuing**

Run `pnpm pactwright eval` and inspect Delivery cases individually.

### Step 3 — Implement PI evaluation fixtures

**References:** Evaluation — Distribution §16; PI §§8–13

**Run**

```text
Implement accepted Project Intelligence evaluation cases for triage, consequence class, evidence comparison, context selection, roadmap provenance and no automatic Intent creation.
```

**Expected result**

Observed Intelligence failures become repeatable tests.

**Verify before continuing**

Run `pnpm pactwright eval` and inspect PI cases individually.

### Step 4 — Implement Review/Creative evaluation fixtures

**References:** Evaluation — Distribution §16; Review & Creative §§6–17

**Run**

```text
Implement accepted Graph Review and Creative Delivery evaluation cases for scope/finding support/routing, Brief adherence, grounding, Kakeido/Kei voice constraints, independent verification and Generation Guidance.
```

**Expected result**

Review/Creative failures are measurable.

**Verify before continuing**

Run eval and inspect Review/Creative cases individually.

### Step 5 — Implement Operations evaluation fixtures

**References:** Evaluation — Operations §21

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

**References:** Evaluation — Distribution §16

**Run**

```bash
pnpm install --frozen-lockfile
pnpm build

pnpm pactwright eval
```

The suite runs against the repository-local workspace build; the `0.0.9` package family does not exist in the registry until Stage 6 and is not installed here.

**Expected result**

A per-capability/per-case result set exists.

**Verify before continuing**

Per-capability/per-case results exist and every failing case has been inspected individually; record observed regressions as input to Step 8.

### Step 7 — Compare a real candidate agent pack when one exists

**References:** Evaluation — Distribution §16

**Run**

```text
Inspect the accepted hardening work. If no change affects an agent pack or Generation Guidance, record this step as not applicable and do not invent a candidate. If AI behaviour changes, build the candidate pack through the normal package build and report its local package path and the pack family it derives from.
```

**Run**

Only when a real candidate exists:

```bash
pnpm pactwright eval \
  --baseline <baseline-pack>@0.0.8 \
  --candidate <candidate-pack-path>
```

`<baseline-pack>` is the `0.0.8` release of the same pack family the candidate derives from (for example `@pactwright/creative@0.0.8`); `<candidate-pack-path>` comes from the previous Run.

**Expected result**

Any real AI-behaviour change is compared against the last published checkpoint baseline of its own pack family.

**Verify before continuing**

Review each regression individually; no aggregate score decides release acceptance.

### Step 8 — Implement only observed hardening fixes

**References:** All owning specs; future-improvement sections

**Run**

```text
Implement fixes only for concrete failure modes observed in Checkpoints 1–8 or evaluation. Preserve owning-spec semantics and do not pull Future Improvements into the core without observed need. Add a regression fixture for each fix.
```

**Expected result**

Known failure paths fail closed/reliably without expanding semantics unnecessarily.

**Verify before continuing**

Run `pnpm verify` plus `pnpm pactwright eval`.

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

**References:** Public project §§3–16; Implementation Guide — public-product progression

**Run**

```text
Inspect README, Docs, Academy, Examples, Extensions, Website, Case Studies and Blog against the current implemented Pactwright capability. Identify only gaps needed for the initial Discover → Understand → Try → Learn → Extend → Contribute journey. The contribution guide and launch material are named 0.0.9 deliverables (Implementation Guide — public-product progression) and must appear in the backlog wherever incomplete; they are not optional audit findings. Do not document unimplemented future behaviour. Return a bounded backlog ordered by user-blocking impact.
```

**Expected result**

A content/product backlog exists based on real current behaviour, including the contribution and launch deliverables.

**Verify before continuing**

Review the backlog against repository truth and remove aspirational items; confirm contribution and launch material are represented.

### Step 11 — Deliver each blocking public-surface gap through Pactwright

**References:** Public project §§3–16; Delivery Graph §19; Review & Creative §9

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

Repeat this step only for blocking gaps identified by the audit; run relevant validation after each. The contribution guide and launch material must be delivered before this step completes.

### Step 12 — Re-check public creative readiness

**References:** Open-Source Project Organisation §1.2; Project Intelligence §§10, 13

**Run**

```bash
pnpm pactwright intelligence onboard
```

Before launch/case-study work, require `identity`, `content`, `product` and `go-to-market` to be Covered. Fill any gap through normal Delivery → ingest → triage/promotion before continuing.

**Expected result**

Launch and case-study content is grounded in current accepted strategy/product truth.

**Verify before continuing**

Inspect domain coverage and the Knowledge selected for positioning, audience, voice, product claims and CTA decisions.

### Step 13 — Create and publish the Pactwright-building-Pactwright case study

**References:** Public project §9; Review & Creative §§9–13

**Run**

```text
Inspect canonical Pactwright graph/Evidence, Review Executions/findings, Publications and Operations Observations from the implementation programme. Prepare a factual grounding set for a Pactwright-building-Pactwright case study covering bootstrap, self-hosted Delivery, PI, Graph Review, Creative Delivery, Operations feedback and corrective Delivery. Do not invent milestones or outcomes.
```

**Run**

```text
/capture-intent "Create the Pactwright-building-Pactwright case study from the verified implementation evidence."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Run**

After manually approving the exact case-study output:

```bash
pnpm pactwright creative approve-asset <evidence-id>
```

`approve-asset` prints the Asset id consumed below. Publish the approved Asset through the existing Pactwright content mechanism, then:

```bash
pnpm pactwright creative record-publication <asset-id> <channel>
pnpm pactwright creative validate
```

`<channel>` is a configured Review & Creative publication channel.

**Expected result**

The case study is a real grounded Publication produced through the same lifecycle it describes.

**Verify before continuing**

Trace its factual claims to the grounding set and its Publication to the approved Asset hash.

## Stage 4 — Prove a repeated closed loop on Pactwright

Run this stage from the Pactwright repository root.

Show that a correction can itself be observed after exposure.

### Step 14 — Collect a real Pactwright production finding

**References:** Operations §§8–11

**Run**

```bash
pnpm pactwright operations refresh
pnpm pactwright operations validate
```

**Expected result**

A new or matched operational finding is produced from a real surface.

**Verify before continuing**

Inspect the Operations execution and any Observation. Confirm the Project Intelligence hand-off created an internal Source and that its id was printed; record `<internal-source-id>` for Step 15. Do not continue without it.

### Step 15 — Route the finding and deliver a correction

**References:** Operations §13; PI §11; Delivery Graph §19

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

### Step 16 — Expose the correction and observe again

**References:** Operations §§7–16; Review & Creative §§12–13

**Run**

For a software correction:

```bash
pnpm pactwright operations record-deployment <evidence-id>
```

For a creative correction, after human approval and real publication:

```bash
pnpm pactwright creative approve-asset <evidence-id>
pnpm pactwright creative record-publication <asset-id> <channel>
```

Then:

```bash
pnpm pactwright operations refresh
```

**Expected result**

Second-round production evidence either validates the correction, creates new learning or exposes another explicit issue.

**Verify before continuing**

Confirm prior Evidence/Observation records remain immutable and any changed operational truth uses a new Observation/supersession.

## Stage 5 — Run failure drills

Run this stage from the Pactwright repository root.

Prove failures remain isolated to their owning boundaries before releasing the hardened line. The Kakeido classification drill runs as a repository fixture reproducing Kakeido's classification-suggestion semantics; it does not require the Kakeido repository.

Any drill failure is a blocking hardening defect: return to Stage 2, implement the observed fix with a regression fixture, and repeat Stages 2–5 before releasing.

### Step 17 — Execute the final failure matrix

**References:** All owning specs

**Run**

```text
Run safe fixture drills for: invalid extension dependency removal; invalid Asset hash; Deployment with invalid Evidence; duplicate Observation; stale PI derived report; GitHub Project drift; missing agent-pack capability; Kakeido classification suggestion attempting canonical mutation; failed Operations collection; failed Review provider call. For each, execute the real Pactwright path, record the expected failure boundary and prove unrelated canonical state remains valid.
```

**Expected result**

Known failure boundaries fail closed and do not corrupt sibling/core truth.

**Verify before continuing**

Review the evidence for all ten drills; rerun the full validation matrix.

## Stage 6 — Release `0.0.9`

`0.0.9` releases only after Stages 1–5 are accepted, so the published line already carries the hardening and drill evidence.

### Step 18 — Prepare, publish and tag `0.0.9`

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

The tag-triggered trusted `release.yml` workflow verifies the exact merged source and publishes every still-unpublished package in the `0.0.9` family under `next`. Existing published members are not overwritten.

**Verify before continuing**

Confirm the `release.yml` run for `v0.0.9` succeeded, then:

```bash
pnpm view pactwright@0.0.9 version
pnpm view @pactwright/standard@0.0.9 version
pnpm view @pactwright/project-intelligence@0.0.9 version
pnpm view @pactwright/review-creative@0.0.9 version
pnpm view @pactwright/creative@0.0.9 version
pnpm view @pactwright/operations@0.0.9 version
```

Every command must return `0.0.9`. Every package must show npm provenance/trusted-publisher metadata; the complete family was introduced by `0.0.6`, so no interactive bootstrap publication occurs in this checkpoint.

## Stage 7 — Prove the hardened full loop on Kakeido

Run this stage from the Kakeido repository root unless a step explicitly says otherwise.

Repeat the same model on the external product and guard its domain semantics.

### Step 19 — Upgrade/reconcile Kakeido fully

**References:** Distribution §15

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

Kakeido runs the hardened checkpoint release, including the upgraded configured agent pack.

**Verify before continuing**

Run all four graph validations plus `pnpm pactwright eval`.

### Step 20 — Run a Kakeido regression Review

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

### Step 21 — Complete one real Kakeido closed loop

**References:** Operations/PI/Delivery specs

**Run**

```text
Using current Kakeido state, select one real production Observation with accepted meaning. Execute the real Pactwright commands to route it through PI, capture/deliver the resulting Intent, expose the result as Deployment or Publication, and run Operations again. Record the exact command sequence and trace IDs from Observation through the later Observation.
```

**Expected result**

The external product proves the same closed-loop architecture after hardening.

**Verify before continuing**

Review the full trace and run Kakeido repository-defined tests plus Pactwright validations.

## Stage 8 — Publish the first supported Pactwright release

`0.0.9` has already passed the failure drills and Kakeido. Promote the same accepted code line through the trusted tag workflow.

If any defect is found after `0.0.9` publication, do not promote: published versions are immutable, so fix forward with the next development version per the Implementation Guide (release failure) and repeat Stages 6–7 before returning here.

### Step 22 — Prepare and tag `0.1.0`

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

The trusted `release.yml` workflow runs the complete verification/compatibility gate and publishes the accepted package family as `0.1.0` under `latest` with provenance.

**Verify before continuing**

Confirm the `release.yml` run for `v0.1.0` succeeded, then:

```bash
pnpm view pactwright@latest version
pnpm view @pactwright/standard@latest version
pnpm view @pactwright/project-intelligence@latest version
pnpm view @pactwright/review-creative@latest version
pnpm view @pactwright/creative@latest version
pnpm view @pactwright/operations@latest version

pnpm view pactwright@next version
```

The first six commands must return `0.1.0`; `next` must remain `0.0.9`.

### Step 23 — Smoke-test the supported release from shipped material

**References:** Implementation Guide — test layers, public-product progression; Public project §3.4; Implementation Principles §13

**Run**

In a clean repository outside the Pactwright and Kakeido workspaces:

```bash
mkdir -p /tmp/pactwright-quickstart && cd /tmp/pactwright-quickstart
git init .
pnpm init
pnpm add -D pactwright@0.1.0
```

Then:

```text
Follow the published README Quick Start verbatim against the registry 0.1.0 family, using only shipped public material and no repository-local knowledge. Complete the Quick Start's initialisation, validation and minimal Delivery pass exactly as documented. Record every deviation between shipped instructions and actual behaviour.
```

**Expected result**

A new user can install and operate the supported release from shipped material alone.

**Verify before continuing**

The Quick Start completes without undocumented steps. Any deviation is a blocking public-surface defect: deliver the correction through the Stage 3 mechanism and repeat this step before continuing.

### Step 24 — Upgrade Kakeido to the stable release

**References:** Distribution §§2, 15; Implementation Guide — npm release model

**Run**

From a Kakeido acceptance branch:

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

Commit the package/lock/config changes, push the branch, open a PR, wait for required checks and merge it.

**Expected result**

Kakeido consumes the exact supported `0.1.0` registry family, its GitHub projections converge, and it passes the same repository checks used for normal development.

**Verify before continuing**

```bash
pnpm list pactwright @pactwright/project-intelligence @pactwright/review-creative @pactwright/creative @pactwright/operations
```

Every direct Pactwright package resolves to `0.1.0`, and the Kakeido PR is merged with all required checks green.

## Stage 9 — Capture checkpoint feedback

Run this stage from the Pactwright repository root.

Close the checkpoint's Learn phase: findings from implementation, installation and public use become product evidence, not tribal memory.

### Step 25 — Capture blocking feedback as product evidence

**References:** Implementation Principles §§7, 13–14; PI §8; Implementation Guide — transition rule

**Run**

```text
Collect defects, friction and gaps observed during Checkpoint 9 implementation, the failure drills, both Kakeido installs and the Quick Start smoke test. Ingest each finding as a Project Intelligence Source with pnpm pactwright intelligence ingest, triage it, and record blocking findings as intent candidates through normal PI governance. Do not create Intents automatically and do not generalise Kakeido-specific preferences into Pactwright behaviour.
```

**Expected result**

Blocking feedback is captured as traceable product evidence before Checkpoint 10.

**Verify before continuing**

Every blocking finding traces to a Source and triage record; no known blocking failure is carried silently into Checkpoint 10.

## Exit gate

Checkpoint 9 passes only when:

- `0.0.9` published under `next` has passed the full Kakeido closed-loop acceptance;
- the accepted package family is published to npm as `0.1.0` under `latest`;
- the published `0.1.0` Quick Start passes a clean-repository smoke test from shipped material alone;
- Kakeido has upgraded to the exact `0.1.0` registry packages and all validations pass;
- the complete first-party system repeatedly closes the loop in Pactwright and Kakeido;
- real failures are represented in evaluation;
- public surfaces match actual capability, including the contribution guide and launch material;
- GitHub/projections converge;
- failure drills preserve ownership;
- blocking feedback from implementation, installation and the smoke test is captured through Project Intelligence;
- no speculative future semantics were introduced merely for completeness.

---

**Pactwright — Checkpoint 9 — Hardened Closed Loop v9**
