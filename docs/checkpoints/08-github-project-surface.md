# Pactwright — Checkpoint 8 — Full Project Operating Surface

**Version:** 9 
**Entry condition:** Checkpoint 7 is accepted and all first-party graph semantics exist. 
**Release:** `0.0.8` 
**Exit capability:** One shared GitHub Project and generated workflow surface project the complete enabled Pactwright system in both projects.

## 1. Goal

Complete all remaining GitHub profile composition, checks, summaries, fields and views, then prove regeneration and extension-disable reconciliation.

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

Dynamic ids such as `<source-id>`, `<brief-id>`, `<evidence-id>` and `<asset-id>` must come from an earlier command in the runbook. Commands that create or resolve durable records must print the ids required by later steps.

Fixture verification means repository test fixtures unless a step explicitly creates a real repository or GitHub resource.

Step references use the labels defined in the checkpoint specification map below.

## 4. Checkpoint specification map

- **GitHub operating/profile/workflow** — Pactwright — GitHub Actions and Views §§1–4
- **Actions** — Pactwright — GitHub Actions and Views §§5–8
- **Revision/failure/PR/checks** — Pactwright — GitHub Actions and Views §§9–16
- **Issues/views** — Pactwright — GitHub Actions and Views §§17–24
- **Configuration/DoD** — Pactwright — GitHub Actions and Views §§25–27
- **Provisioning/reconciliation** — Pactwright — Distribution, Agents and Evaluation §§9–14
- **Distribution/upgrade** — Pactwright — Distribution, Agents and Evaluation §§2, 4, 6–8, 15, 18–19
- **Release model** — Pactwright — Implementation Guide (npm release model, trusted release workflow, preparing a development release)
- **Public product** — Pactwright Open-Source Project Organisation §1.3
- **Roadmap/corrective feedback** — Pactwright — Project Intelligence Graph Engineering Spec §11; Pactwright — Operations Graph Engineering Spec §§13–15
- **Graph validation** — Delivery Graph §21; Project Intelligence §17; Review & Creative §21; Operations §22
- **Feedback capture** — Pactwright — Implementation Principles §§5A, 7, 14

## Stage 1 — Complete profile composition

Resolve one deterministic GitHub desired state from enabled components.

### Step 1 — Implement requirement merge/conflict handling

**References:** GitHub operating/profile/workflow §3; Provisioning/reconciliation §10

**Run**

```text
Implement deterministic composition across Delivery, Project Intelligence, Review & Creative and Operations GitHub profiles. Identical requirements collapse, compatible requirements merge and incompatible requirements fail validation before remote mutation.
```

**Expected result**

One desired-state model composes all enabled profiles safely.

**Verify before continuing**

Run fixtures for identical, compatible and incompatible requirements.

### Step 2 — Enforce one shared GitHub Project

**References:** Issues/views §18; Provisioning/reconciliation §12

**Run**

```text
Complete shared Project provisioning so all enabled profiles contribute fields/views to one repository Project by default. Do not create a Project per extension. Preserve only enabled-profile requirements.
```

**Expected result**

One Project represents the whole Pactwright operating surface.

**Verify before continuing**

Run an all-enabled fixture plus partial-combination fixtures (core-only, core + Project Intelligence, each sibling extension alone) and inspect exactly one linked Pactwright Project in each.

### Step 3 — Prove configuration gating

**References:** Configuration/DoD §25; Provisioning/reconciliation §12

**Run**

```text
Implement and test configuration gating for the GitHub surface: individual view toggles omit unconfigured views from desired state; github.project.enabled: false suppresses all Project-backed views while extension checks and PR summaries remain operational; enabling an extension does not force every optional view or scheduled action on; scheduled publication and scheduled Operations refresh activate only from their explicit configuration.
```

**Expected result**

Desired state contains exactly the configured surface and nothing more.

**Verify before continuing**

Run fixtures for each gating rule, including a `github.project.enabled: false` fixture whose checks and PR summaries still resolve.

## Stage 2 — Complete Delivery and PI projections

Fill the core and Intelligence operating views.

### Step 4 — Complete Intent Issue/Delivery Project projection

**References:** Issues/views §§17, 19

**Run**

```text
Implement the remaining Intent Issue and Delivery Project fields from GitHub, deriving title/stage/Contract/Brief/PR/blocking and enabled-extension context fields from Pactwright state. Editing these fields must not mutate canonical graph state.
```

**Expected result**

Delivery navigation and status are fully projected.

**Verify before continuing**

Use a fixture Intent/PR and compare GitHub values to runtime-derived state.

### Step 5 — Complete PR lifecycle and extension summaries

**References:** Revision/failure/PR/checks §§11–16

**Run**

```text
Audit the implemented Delivery PR surface against the specification and complete any remaining gaps in: the Delivery lifecycle summary, the Project Intelligence grounding section, the Review & Creative section, the Operations context section and the core Delivery checks. Summaries link to graph nodes rather than copying contents; no prompts, generation logs, binary assets or raw telemetry appear in a summary; no summary or check owns lifecycle state.
```

**Expected result**

Every PR summary and Delivery check defined by the specification exists and projects only derived state.

**Verify before continuing**

Use a fixture Delivery PR with all extensions enabled and compare each rendered section and check field-by-field against the owning specification sections.

### Step 6 — Complete PI checks/views and the promotion PR summary

**References:** Issues/views §§20–21

**Run**

```text
Complete Pactwright / Intelligence, / Intelligence Promotion and / Intelligence Views plus Coverage, Roadmap, Freshness and Propagation views, and complete the Project Intelligence promotion PR summary including the Operations-origin fields (Origin, Observation, Exposure) for operationally motivated Sources. Detect stale generated reports by Project Graph revision without treating stale derived views as invalid canonical Knowledge.
```

**Expected result**

PI GitHub surface is complete and correctly distinguishes canonical vs derived state.

**Verify before continuing**

Create a stale report fixture and confirm the view check fails while `intelligence validate` can still distinguish canonical validity; render a promotion PR summary fixture for an Operations-originated Source and inspect its origin fields.

## Stage 3 — Complete Review & Creative projections

Project executions/findings/assets/publications without promoting transient state.

### Step 7 — Complete Review checks/summaries/views

**References:** Issues/views §22

**Run**

```text
Complete Pactwright / Review Creative structural/execution validation, Review summary, Reviews view and Next Actions view. Keep Review Executions operational provenance and link resulting Sources/promotion PRs rather than copying them.
```

**Expected result**

Review activity is visible but remains non-canonical execution/proposal state.

**Verify before continuing**

Run one Review and inspect all projected fields/links.

### Step 8 — Complete Creative checks/views

**References:** Issues/views §23

**Run**

```text
Complete Pactwright / Creative Grounding, / Publication, Assets and Publications views, including the Publications-view field showing linked operational Observations when Operations is enabled. Candidate generation outputs must never appear as Assets. GitHub approval cannot create Asset/Publication state.
```

**Expected result**

Only canonical approved Assets/Publications appear in the project views.

**Verify before continuing**

Use a candidate-only fixture and confirm it is absent from Assets view; use an observed-Publication fixture and confirm its Observation link renders.

## Stage 4 — Complete Operations projections

Expose durable production state without duplicating observability systems.

### Step 9 — Complete Operations checks/summaries/views

**References:** Issues/views §24

**Run**

```text
Complete Pactwright / Operations and / Operations Views, the Operations refresh summary, plus Operations, Deployments, Production Findings and Corrective Roadmap views. Project only durable Deployments/Observations and PI-derived corrective candidates; never raw telemetry or a separate Operations priority model. The refresh summary must never dump raw source payloads.
```

**Expected result**

The Project shows the current production picture at graph-level signal density.

**Verify before continuing**

Run a refresh and inspect that individual raw events are absent while Observations appear and the refresh summary contains only aggregated fields.

## Stage 5 — Reconcile Pactwright and prove regeneration

Run this stage from the Pactwright repository root.

Make GitHub fully reproducible from Pactwright-owned desired/canonical state.

### Step 10 — Regenerate local integration

**References:** Distribution/upgrade §8

**Run**

```bash
pnpm install --frozen-lockfile
pnpm build

pnpm pactwright sync
```

The Pactwright repository consumes its own workspace packages; registry consumption of the `0.0.8` family is proven post-release in Stage 8.

**Expected result**

All four managed workflows/adapter files reflect enabled profiles.

**Verify before continuing**

Inspect git diff; only Pactwright-managed files/regions may change. Repository-owned release infrastructure (`release.yml`) and user-authored workflows are untouched.

### Step 11 — Land regenerated integration

**References:** Implementation Guide (engineering baseline: repository changes)

**Run**

```bash
DEFAULT_BRANCH="$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name)"

git switch -c chore/checkpoint-8-regeneration
git add -A
git commit -m "chore: regenerate managed integration for checkpoint 8"
git push -u origin HEAD

gh pr create \
  --title "Regenerate managed integration for Checkpoint 8" \
  --body "Stage 5 regeneration of Pactwright-managed adapters and workflows."

gh pr checks --watch
gh pr merge --squash --delete-branch

git switch "$DEFAULT_BRANCH"
git pull --ff-only
```

**Expected result**

The default branch contains the regenerated managed files and the working tree is clean before remote reconciliation and release preparation.

**Verify before continuing**

`git status` is clean on the default branch and all required checks passed on the merged PR.

### Step 12 — Preview/apply complete remote desired state

**References:** Provisioning/reconciliation §§9–14

**Run**

```bash
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
pnpm pactwright github sync --dry-run
```

**Expected result**

All fields/views/check/ruleset requirements are applied and converged.

**Verify before continuing**

The final dry-run is clean except intentional external drift.

### Step 13 — Validate all enabled graph semantics

**References:** Graph validation — Delivery Graph §21; Project Intelligence §17; Review & Creative §21; Operations §22

**Run**

```bash
pnpm pactwright validate
pnpm pactwright intelligence validate
pnpm pactwright creative validate
pnpm pactwright operations validate
```

**Expected result**

Canonical state across all subgraphs is valid.

**Verify before continuing**

All four commands pass.

### Step 14 — Prove remote drift reconciliation

**References:** Provisioning/reconciliation §14; GitHub operating/profile/workflow §2

**Run**

```text
Using one safe Pactwright-owned Project field/view in the Pactwright repository's own shared Project, record current state, make one reversible remote change, run github sync --dry-run to detect drift, apply github sync, and verify desired state is restored. Do not touch unrelated user-owned objects.
```

**Expected result**

Owned remote drift is detectable/recoverable.

**Verify before continuing**

Record before/drift/after state and final clean dry-run.

### Step 15 — Prove extension disable/removal reconciliation

**References:** Distribution/upgrade §4; Provisioning/reconciliation §14

**Run**

```text
In fixture repositories test: disable Operations while Review & Creative remains; disable Review & Creative while Operations remains; attempt to remove Project Intelligence while either dependant remains. Verify through composed desired state and github sync --dry-run diffs that only owned GitHub integration would be removed and shared Project Intelligence integration is preserved while another enabled extension requires it; fixtures perform no remote mutation. Verify remaining sibling/profile state stays valid and PI dependency removal is blocked.
```

**Expected result**

Profile composition/removal obeys extension ownership/dependencies.

**Verify before continuing**

Run all relevant validation commands after each fixture transition and inspect each dry-run diff for owned-only removals.

## Stage 6 — Publish the full operating workflow

### Step 16 — Publish the end-to-end operating path

**References:** Public product §1.3; Issues/views §§17–24; Configuration/DoD §§26–27; Feedback capture §5A

**Run**

First confirm creative readiness:

```bash
pnpm pactwright intelligence onboard
```

`identity`, `content`, `product` and `go-to-market` must be **Covered** for this work. If coverage is missing, stop and create/ingest the missing project knowledge through normal Delivery before continuing.

Then use current Project Intelligence and Graph Review to deliver:

```text
Docs
→ full Pactwright operating/GitHub guide

Examples
→ one end-to-end Project Intelligence → Delivery → Review → Deployment/Publication → Operations workflow

Academy
→ advanced closed-loop workflow lesson

Extensions
→ current first-party extension catalogue

README
→ complete capability map linking to the correct deeper surfaces
```

Run the work through normal Delivery; use Creative Delivery for public-facing narrative/visual material and Graph Review before acceptance.

**Expected result**

The public project now exposes the full implemented operating model without forcing users to infer it from individual subsystem docs.

**Verify before continuing**

Run `product-strategist`, `voice-auditor`, `architecture-reviewer` and `graph-auditor` against current state; route any accepted findings through Project Intelligence and resolve blocking public-product drift. Inspect the Pactwright repository's shared Project and confirm this delivery lineage is fully projected (Intent Issue, Delivery view, Review, Assets/Publications where applicable).

## Stage 7 — Release `0.0.8`

### Step 17 — Prepare, publish and tag `0.0.8`

**References:** Release model — Implementation Guide; Distribution/upgrade §§2, 6–8, 15, 18–19

**Run**

Update `CHANGELOG.md` from accepted Checkpoint 8 Evidence only, then create the release PR:

```bash
VERSION=0.0.8
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

The tag-triggered trusted `release.yml` workflow verifies the exact merged source and publishes every still-unpublished package in the `0.0.8` family under `next`. Existing published members are not overwritten.

**Verify before continuing**

Confirm the `release.yml` run for `v0.0.8` succeeded, then:

```bash
pnpm view pactwright@0.0.8 version
pnpm view @pactwright/standard@0.0.8 version
pnpm view @pactwright/project-intelligence@0.0.8 version
pnpm view @pactwright/review-creative@0.0.8 version
pnpm view @pactwright/creative@0.0.8 version
pnpm view @pactwright/operations@0.0.8 version
```

Every command must return `0.0.8`. All six packages were introduced by `0.0.6`, so no bootstrap publication occurs at this release; every package must show npm provenance/trusted-publisher metadata.

## Stage 8 — Upgrade Kakeido and run a full projected lineage

Run this stage from the Kakeido repository root unless a step explicitly says otherwise.

Prove the complete operating surface in the consumer repository.

### Step 18 — Upgrade/reconcile Kakeido fully

**References:** Distribution/upgrade §15

**Run**

```bash
pnpm add -D \
  pactwright@0.0.8 \
  @pactwright/project-intelligence@0.0.8 \
  @pactwright/review-creative@0.0.8 \
  @pactwright/creative@0.0.8 \
  @pactwright/operations@0.0.8

pnpm pactwright extension upgrade project-intelligence
pnpm pactwright extension upgrade review-creative
pnpm pactwright extension upgrade operations
pnpm pactwright upgrade
pnpm pactwright sync
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

`pnpm pactwright upgrade` upgrades the already configured `@pactwright/creative` agent pack per the Distribution upgrade semantics.

**Expected result**

Kakeido has the complete first-party GitHub profile set.

**Verify before continuing**

Run all four graph validation commands; inspect exactly one linked Pactwright Project containing every enabled-profile field and view; confirm a final `pnpm pactwright github sync --dry-run` is clean.

### Step 19 — Run one real end-to-end Kakeido lineage

**References:** Configuration/DoD §26; Roadmap/corrective feedback

**Run**

```bash
pnpm pactwright intelligence derive-intent-roadmap
```

**Run**

```text
/capture-intent "<selected real Kakeido candidate>"
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Run**

Software path — after the delivered work is active in the Kakeido environment configured in Checkpoint 6:

```bash
pnpm pactwright operations record-deployment <evidence-id>
```

Creative path — for public-facing output (`<asset-id>` is printed by `approve-asset`):

```bash
pnpm pactwright creative approve-asset <evidence-id>
pnpm pactwright creative record-publication <asset-id> <channel>
```

Then close the loop on whichever path was exercised:

```bash
pnpm pactwright operations refresh
pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright operations corrective-roadmap
```

**Expected result**

GitHub projects the complete lineage/feedback without owning any of its canonical state.

**Verify before continuing**

Inspect the shared Project and trace every projected field back to repository graph/provenance.

## Stage 9 — Capture Checkpoint 8 feedback

### Step 20 — Route checkpoint findings through Project Intelligence

**References:** Feedback capture §§7, 14

**Run**

```text
Capture every defect, friction point, provisioning problem and content gap discovered during Checkpoint 8 across Pactwright and Kakeido as internal Sources through pnpm pactwright intelligence ingest, then triage them. Promote to Knowledge or intent candidates only where justified. Distinguish Kakeido-specific choices from Pactwright responsibility failures. Do not automatically create Delivery Intents.
```

**Expected result**

Checkpoint 8 learning exists as durable Project Intelligence Sources with triage outcomes.

**Verify before continuing**

`pnpm pactwright intelligence validate` passes and every blocking finding is either resolved in this checkpoint or exists as a triaged candidate before the checkpoint closes.

## Exit gate

Both projects use one shared GitHub Project projecting every enabled profile; configuration gating provisions only configured views while checks and PR summaries operate without Projects; PR summaries, checks and Project views match the owning specification sections; remote state regenerates and converges from Pactwright-owned state, including after reversible drift; extension disable/removal affects only owned integration and Project Intelligence removal remains blocked under dependants; regenerated integration landed through reviewed pull requests; the full operating guide, end-to-end example, advanced Academy lesson, extension catalogue and README capability map are published from covered knowledge through Creative Delivery and Graph Review; `0.0.8` is published with verified provenance and installed in Kakeido; one real Kakeido lineage is fully projected and traceable; no GitHub edit alone mutates canonical Pactwright state; Checkpoint 8 feedback is captured as Project Intelligence Sources.

---

**Pactwright — Checkpoint 8 — Full Project Operating Surface v9**
