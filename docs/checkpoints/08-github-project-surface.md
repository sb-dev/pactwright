# Pactwright — Checkpoint 8 — Full Project Operating Surface

**Version:** 10  
**Entry condition:** Checkpoint 7 is accepted and all first-party graph semantics, including Operations Experiment, exist.  
**Release:** `0.0.8`  
**Exit capability:** One shared GitHub Project and generated workflow surface project the complete enabled Pactwright system in both projects, including controlled Experiment state where it exists, without making GitHub canonical state.

## 1. Goal

Complete all remaining GitHub profile composition, checks, summaries, fields and views, including the Operations `Experiments` view introduced by the adopted Experiment amendment, then prove regeneration, projection-only behaviour and extension-disable reconciliation.

For Kakeibo, the shared Project must expose the real production-learning lineage from exact Delivery/Deployment through Experiment and Observation into Project Intelligence and later Delivery where justified. It must not invent an Experiment merely to fill a view or flatten Kakeibo-owned Kei release/model-route semantics into GitHub fields.

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

At execution time treat the current Kakeibo authority set as the consumer-system baseline:

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

`00-kakeibo-acceptance-profile.md` §12 is the shared System-Level Acceptance cross-check for the Kakeibo projection proof.

Kakeibo-specific concepts such as `KeiRelease`, Kei task, policy, persona, model route and benchmark case remain Kakeibo-owned repository/application artefacts. GitHub may project bounded provenance already represented through Pactwright graph relationships, but it must not turn those project-specific artefacts into new Pactwright/GitHub lifecycle types.

The retained August Kakeido snapshots are not implementation authority.

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

Dynamic ids such as `<source-id>`, `<brief-id>`, `<evidence-id>`, `<asset-id>`, `<deployment-id>`, `<experiment-id>` and `<observation-id>` must come from an earlier command in the runbook. Commands that create or resolve durable records must print the ids required by later steps.

Fixture verification means repository test fixtures unless a step explicitly creates a real repository or GitHub resource.

Step references use the labels defined in the checkpoint specification map below.

## 4. Checkpoint specification map

- **GitHub operating/profile/workflow** — Pactwright — GitHub Actions and Views §§1–4
- **Actions** — Pactwright — GitHub Actions and Views §§5–8
- **Revision/failure/PR/checks** — Pactwright — GitHub Actions and Views §§9–16
- **Issues/views** — Pactwright — GitHub Actions and Views §§17–24
- **Experiment GitHub projection** — Operations Experiment Semantics §13
- **Experiment PI lineage** — Operations Experiment Semantics §14
- **Provisioning/reconciliation** — Pactwright — Distribution, Agents and Evaluation §§9–14
- **Distribution/upgrade** — Pactwright — Distribution, Agents and Evaluation §§2, 4, 6–8, 15, 18–19
- **Release model** — Pactwright — Implementation Guide (npm release model, trusted release workflow, preparing a development release)
- **Public product** — Pactwright Open-Source Project Organisation §1.3
- **Roadmap/corrective feedback** — Pactwright — Project Intelligence Graph Engineering Spec §11; Pactwright — Operations Graph Engineering Spec §§13–15
- **Graph validation** — Delivery Graph §21; Project Intelligence §17; Review & Creative §21; Operations §22; Experiment Semantics §11
- **Kakeibo full lineage projection** — Kakeibo Acceptance Profile §12
- **Feedback capture** — Pactwright — Implementation Principles §§5A, 7, 14

## Stage 1 — Complete profile composition

Resolve one deterministic GitHub desired state from enabled components.

### Step 1 — Implement requirement merge/conflict handling

**References:** GitHub operating/profile/workflow §3; Provisioning/reconciliation §10

**Run**

```text
Implement deterministic composition across Delivery, Project Intelligence, Review & Creative and Operations GitHub profiles. Include Operations Experiment path/check/view requirements contributed by the adopted Experiment semantics. Identical requirements collapse, compatible requirements merge and incompatible requirements fail validation before remote mutation.
```

**Expected result**

One desired-state model composes all enabled profiles safely, including Experiment projection requirements.

**Verify before continuing**

Run fixtures for identical, compatible and incompatible requirements, including an Operations fixture containing Deployment/Experiment/Observation state.

### Step 2 — Enforce one shared GitHub Project

**References:** Issues/views §18; Provisioning/reconciliation §12; Experiment GitHub projection

**Run**

```text
Complete shared Project provisioning so all enabled profiles contribute fields/views to one repository Project by default. Do not create a Project per extension or a separate Project for Experiments. Preserve only enabled/configured profile requirements.
```

**Expected result**

One Project represents the whole Pactwright operating surface.

**Verify before continuing**

Run an all-enabled fixture plus partial-combination fixtures (core-only, core + PI, Review & Creative without Operations, Operations without Review & Creative). Inspect exactly one linked Pactwright Project in each, with Experiments present only when Operations and its configured view surface require it.

### Step 3 — Prove configuration gating

**References:** Configuration/DoD §25; Provisioning/reconciliation §12; Experiment GitHub projection

**Run**

```text
Implement and test configuration gating for the GitHub surface: individual view toggles omit unconfigured views from desired state; github.project.enabled: false suppresses all Project-backed views while extension checks and PR summaries remain operational; enabling an extension does not force every optional view or scheduled action on; scheduled publication and scheduled Operations refresh activate only from explicit configuration; the Experiments view is projected only when configured and Operations is enabled.

Do not require an Experiment record merely because the Experiments view exists. Empty is a valid derived view state.
```

**Expected result**

Desired state contains exactly the configured surface and nothing more.

**Verify before continuing**

Run fixtures for each gating rule, including `github.project.enabled: false`, Operations enabled with Experiments view disabled, and Experiments view enabled with zero Experiment records.

## Stage 2 — Complete Delivery and PI projections

Fill the core and Intelligence operating views.

### Step 4 — Complete Intent Issue/Delivery Project projection

**References:** Issues/views §§17, 19

**Run**

```text
Implement the remaining Intent Issue and Delivery Project fields, deriving title/stage/Contract/Brief/PR/blocking and enabled-extension context from Pactwright state. Where an Intent is motivated by an Operations Observation or Experiment outcome, project links/provenance rather than copying the underlying experiment/evidence content. Editing Project fields must not mutate canonical graph state.
```

**Expected result**

Delivery navigation/status is fully projected and operational provenance remains linked rather than duplicated.

**Verify before continuing**

Use a fixture Intent/PR motivated by an Experiment Observation and compare GitHub values to runtime-derived state; edit a projected field and prove canonical state is unchanged/reconciled from Pactwright.

### Step 5 — Complete PR lifecycle and extension summaries

**References:** Revision/failure/PR/checks §§11–16; Experiment PI lineage

**Run**

```text
Audit the implemented Delivery PR surface and complete remaining gaps in: Delivery lifecycle summary, PI grounding section, Review & Creative section, Operations context section and core Delivery checks. Operations context may link relevant Deployment/Experiment/Observation lineage where bounded and relevant. Summaries link to graph nodes rather than copying contents; no prompts, generation logs, binary assets, raw telemetry, raw experiment samples or private financial grounding appear. No summary/check owns lifecycle state.
```

**Expected result**

Every PR summary/check projects only bounded derived state.

**Verify before continuing**

Use a fixture Delivery PR with all extensions enabled and a prior Experiment Observation; compare rendered sections against owner semantics and verify no raw evidence leaks into the summary.

### Step 6 — Complete PI checks/views and promotion PR summary

**References:** Issues/views §§20–21; Experiment PI lineage

**Run**

```text
Complete Pactwright / Intelligence, / Intelligence Promotion and / Intelligence Views plus Coverage, Roadmap, Freshness and Propagation views. Complete the PI promotion PR summary including Operations-origin fields: Origin, Observation and Exposure. When the exposure is an Experiment, link the exact Experiment and latest relevant outcome Observation without treating experiment significance/favourable metrics as Knowledge class, priority or automatic promotion. Detect stale generated reports by Project Graph revision without treating stale derived views as invalid canonical Knowledge.
```

**Expected result**

PI GitHub surface distinguishes canonical governance from operational/experiment provenance.

**Verify before continuing**

Create a stale-report fixture and an Experiment-origin promotion fixture. Confirm the promotion summary links exact Experiment/Observation provenance while promotion class/priority still comes from PI governance.

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
Complete Pactwright / Creative Grounding, / Publication, Assets and Publications views, including the Publications-view field showing linked operational Observations when Operations is enabled. Candidate generation outputs must never appear as Assets. GitHub approval cannot create Asset/Publication state. Later production or Experiment evidence may be linked as provenance for a superseding Delivery/Asset, but must never rewrite the historical Asset/Publication projection.
```

**Expected result**

Only canonical approved Assets/Publications appear and historical publication truth remains immutable.

**Verify before continuing**

Use a candidate-only fixture and confirm it is absent from Assets; use an observed Publication and a later superseding Asset fixture and confirm both historical/new lineage remain visible without mutation.

## Stage 4 — Complete Operations and Experiment projections

Expose durable production/evaluation state without duplicating observability or experimentation systems.

### Step 9 — Complete Operations checks/summaries/views

**References:** Issues/views §24; Experiment GitHub projection; Experiment PI lineage

**Run**

```text
Complete Pactwright / Operations and / Operations Views, the Operations refresh summary, plus the Operations, Deployments, Experiments, Production Findings and Corrective Roadmap views.

The Experiments view projects canonical/derived Operations state only. Include useful derived fields/links for:
- mode;
- hypothesis;
- exact control exposure;
- exact candidate exposure;
- primary metric;
- active guardrails;
- evidence window / review condition;
- current derived state;
- latest outcome Observation;
- resulting PI Source / Knowledge / intent candidate / later Delivery provenance where available.

Project exact ids/hashes/links where the UI supports them rather than copying raw contracts. Never project raw assignment rows, metric samples, analytics payloads, prompts, responses, financial grounding or external traces.

The view is observational. Editing GitHub fields cannot change an Experiment contract, exposure hash, assignment, metric, decision rule, candidate promotion or rollout configuration.

Do not force every Deployment, release or rollout to create an Experiment. Show Experiment lineage only where canonical Experiment state exists.
```

**Expected result**

The shared Project shows production and controlled-evaluation truth at graph-level signal density.

**Verify before continuing**

Run/inspect fixtures for:

- Deployment with no Experiment: visible in Deployments, absent from Experiments;
- running/pre-outcome Experiment: contract fields visible, no fabricated outcome;
- observed Experiment: latest Observation and PI provenance visible;
- favourable Experiment with no promotion: no implied promoted state;
- superseded Experiment: immutable historical contract remains addressable;
- raw evidence fixture: no sample/event/prompt payload appears in Project or refresh summary.

### Step 10 — Complete Experiment path triggers and projection validation

**References:** Experiment GitHub projection; GitHub operating/profile/workflow §§3–4

**Run**

```text
Complete managed-path and validation composition for docs/operations/experiments/** in the Operations GitHub profile. Experiment file changes trigger the appropriate deterministic Operations validation/projection refresh. GitHub may validate/project/trigger analysis, but a Project field edit alone cannot create a valid Experiment and there is no GitHub promotion action.
```

**Expected result**

Experiment state participates in the same generated GitHub operating surface as other durable Operations state.

**Verify before continuing**

Run a dry-run/profile fixture for an Experiment contract change and confirm Operations validation/projection requirements are composed. Attempt to represent a new Experiment only via Project fields and require no canonical Experiment creation.

## Stage 5 — Reconcile Pactwright and prove regeneration

Run this stage from the Pactwright repository root.

Make GitHub fully reproducible from Pactwright-owned desired/canonical state.

### Step 11 — Regenerate local integration

**References:** Distribution/upgrade §8

**Run**

```bash
pnpm install --frozen-lockfile
pnpm build

pnpm pactwright sync
```

The Pactwright repository consumes its own workspace packages; registry consumption of the `0.0.8` family is proven post-release in Stage 8.

**Expected result**

All managed workflows/adapter files reflect enabled profiles including Experiment paths/projections.

**Verify before continuing**

Inspect git diff; only Pactwright-managed files/regions may change. Repository-owned release infrastructure (`release.yml`) and user-authored workflows are untouched.

### Step 12 — Land regenerated integration

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

The default branch contains regenerated managed files and the working tree is clean before remote reconciliation/release preparation.

**Verify before continuing**

`git status` is clean on the default branch and all required checks passed on the merged PR.

### Step 13 — Preview/apply complete remote desired state

**References:** Provisioning/reconciliation §§9–14

**Run**

```bash
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
pnpm pactwright github sync --dry-run
```

**Expected result**

All configured fields/views/check/ruleset requirements, including Experiments when configured, are applied and converged.

**Verify before continuing**

The final dry-run is clean except intentional external drift.

### Step 14 — Validate all enabled graph semantics

**References:** Graph validation

**Run**

```bash
pnpm pactwright validate
pnpm pactwright intelligence validate
pnpm pactwright creative validate
pnpm pactwright operations validate
```

**Expected result**

Canonical state across all subgraphs, including Experiment invariants, is valid.

**Verify before continuing**

All four commands pass.

### Step 15 — Prove remote drift reconciliation

**References:** Provisioning/reconciliation §14; GitHub operating/profile/workflow §2

**Run**

```text
Using one safe Pactwright-owned Project field/view, preferably one Experiment-view presentation property rather than canonical content, record current state, make one reversible remote change, run github sync --dry-run to detect drift, apply github sync and verify desired state is restored. Do not touch unrelated user-owned objects and do not modify canonical Experiment files for this test.
```

**Expected result**

Owned remote projection drift is detectable/recoverable while repository state remains authoritative.

**Verify before continuing**

Record before/drift/after state and final clean dry-run; `operations validate` remains unchanged throughout.

### Step 16 — Prove extension disable/removal reconciliation

**References:** Distribution/upgrade §4; Provisioning/reconciliation §14

**Run**

```text
In fixture repositories test: disable Operations while Review & Creative remains; disable Review & Creative while Operations remains; attempt to remove PI while either dependant remains. Verify through composed desired state and github sync --dry-run diffs that only owned GitHub integration is removed. Disabling Operations removes Operations-owned Deployments/Experiments/Production Findings/Corrective Roadmap projections and experiment path handling but does not reinterpret Review & Creative Publications. Shared PI integration remains while another enabled extension requires it. Fixtures perform no remote mutation.
```

**Expected result**

Profile composition/removal obeys extension ownership/dependencies.

**Verify before continuing**

Run relevant validation after each fixture transition and inspect dry-run diffs for owned-only removals; PI dependency removal is blocked when required.

## Stage 6 — Publish the full operating workflow

### Step 17 — Publish the end-to-end operating path

**References:** Public product §1.3; Issues/views §§17–24; Experiment GitHub projection; Configuration/DoD §§26–27; Feedback capture §5A

**Run**

First confirm creative readiness:

```bash
pnpm pactwright intelligence onboard
```

`identity`, `content`, `product` and `go-to-market` must be **Covered**. If coverage is missing, create/ingest the missing project knowledge through normal Delivery before continuing.

Then use current Project Intelligence and Graph Review to deliver:

```text
Docs
→ full Pactwright operating/GitHub guide

Examples
→ one ordinary closed-loop path without Experiment
→ one controlled-evaluation path showing Delivery Evidence → Deployments → Experiment → Observation → PI → later Delivery where justified

Academy
→ advanced closed-loop workflow lesson

Extensions
→ current first-party extension catalogue

README
→ complete capability map linking to the correct deeper surfaces
```

The documentation must make clear:

```text
Experiment is optional controlled-evaluation truth
not every Deployment/rollout needs an Experiment
GitHub projects Experiment state but cannot author/promote it
raw telemetry/experiment samples remain external
product-specific release semantics remain project-owned
```

Run the work through normal Delivery; use Creative Delivery for public-facing material and Graph Review before acceptance.

**Expected result**

The public project exposes the full implemented operating model, including when to use and when not to use Experiment.

**Verify before continuing**

Run `product-strategist`, `voice-auditor`, `architecture-reviewer` and `graph-auditor`; route accepted findings through PI. Inspect the shared Project and confirm the example lineages are accurately projected without fabricated Experiment state.

## Stage 7 — Release `0.0.8`

### Step 18 — Prepare, publish and tag `0.0.8`

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

The tag-triggered trusted `release.yml` workflow verifies the exact merged source and publishes every still-unpublished package in the `0.0.8` family under `next`.

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

Every command must return `0.0.8`. All six packages were introduced by `0.0.6`, so no bootstrap publication occurs; every package must show npm provenance/trusted-publisher metadata.

## Stage 8 — Upgrade Kakeibo and prove the full projected operating lineage

Run this stage from the Kakeibo repository root unless a step explicitly says otherwise.

Use the real state accumulated through Checkpoints 1–7. Projection acceptance must not require manufacturing new semantic records solely for GitHub.

### Step 19 — Upgrade/reconcile Kakeibo fully

**References:** Distribution/upgrade §15; Kakeibo Acceptance Profile §12

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

`pnpm pactwright upgrade` upgrades the already configured `@pactwright/creative` agent pack.

**Expected result**

Kakeibo has the complete first-party GitHub profile set including the configured Experiments view.

**Verify before continuing**

Run all four graph validation commands; inspect exactly one linked Pactwright Project containing every configured enabled-profile field/view; confirm a final `pnpm pactwright github sync --dry-run` is clean.

### Step 20 — Project the real Kakeibo Experiment lineage from Checkpoint 6

**References:** Kakeibo Acceptance Profile §12; Experiment GitHub projection; Experiment PI lineage

**Run**

Resolve the real controlled Kei Experiment created in Checkpoint 6 and its exact related records. Do not create another Experiment for this checkpoint.

Trace/project the existing lineage where present:

```text
Delivery Evidence
→ active/candidate Deployment
→ Experiment
→ latest outcome Observation
→ internal PI Source
→ Knowledge / intent candidate where accepted
→ later Delivery where justified and already governed
```

Inspect the shared GitHub Project's Experiments, Deployments, Production Findings, PI and Delivery projections.

For the Experiment row/view confirm the projected values come from canonical/derived Pactwright state:

```text
mode
hypothesis
control exposure
candidate exposure
primary metric
guardrails
window
current derived state
latest outcome Observation
resulting PI / later Delivery provenance
```

Kakeibo `KeiRelease` and model-route details remain Kakeibo-owned. Only bounded exact exposure/provenance already represented by Pactwright is projected.

**Expected result**

GitHub exposes the real Kakeibo controlled-evaluation lineage without becoming its source of truth.

**Verify before continuing**

- each projected link resolves to the corresponding repository graph/provenance record;
- control/candidate identities match the exact Checkpoint 6 Deployment hashes;
- no raw financial prompt/response/grounding/experiment sample appears;
- favourable evidence does not render as automatic promotion unless PI/Delivery actually accepted it;
- if the outcome was neutral/insufficient/no-change, GitHub preserves that state rather than fabricating later Delivery;
- no Kakeibo-specific Kei graph type exists solely for the UI.

### Step 21 — Close one justified Kakeibo feedback lineage through the full Project surface

**References:** Configuration/DoD §26; Roadmap/corrective feedback; Kakeibo Acceptance Profile §§11–12

**Run**

Use existing triaged Kakeibo Operations/Publication/Experiment evidence from Checkpoints 6–7. Select one accepted candidate that genuinely warrants Delivery. If no such candidate exists, use another already accepted real Kakeibo PI candidate; do not invent a correction merely to satisfy the checkpoint.

```bash
pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright operations corrective-roadmap
```

For the selected accepted candidate:

```text
/capture-intent "<selected accepted Kakeibo candidate>"
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

If the delivered change is deployed, record the Deployment after the real environment exposure. If it is public creative work, approve/publish the exact Asset through Review & Creative. Do not add another Experiment unless the change independently requires controlled evaluation under Checkpoint 6 semantics.

Then refresh projections:

```bash
pnpm pactwright operations refresh
pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright operations corrective-roadmap
pnpm pactwright github sync --dry-run
```

**Expected result**

At least one real Kakeibo feedback-driven Delivery is visible end to end on the same Project surface, while Experiment remains optional rather than a mandatory lifecycle stage.

**Verify before continuing**

Trace every Project field/link back to repository state. If the selected candidate originated from the CP6 Experiment, confirm the complete projected chain:

```text
Delivery Evidence
→ Deployment
→ Experiment
→ Observation
→ PI Source/Knowledge/candidate
→ later Delivery
```

If it originated elsewhere, confirm the actual lineage without inserting a fake Experiment.

## Stage 9 — Capture Checkpoint 8 feedback

### Step 22 — Route checkpoint findings through Project Intelligence

**References:** Feedback capture §§7, 14; Kakeibo Acceptance Profile §12

**Run**

```text
Capture every defect, friction point, provisioning problem, projection ambiguity and content gap discovered during Checkpoint 8 across Pactwright and Kakeibo as internal Sources through `pnpm pactwright intelligence ingest`, then triage them. Include Experiment-view failures such as stale/wrong exposure links, misleading derived state, hidden guardrails, fabricated promotion, raw-evidence leakage or extension-disable residue. Promote to Knowledge or intent candidates only where justified. Distinguish Kakeibo-specific choices from Pactwright responsibility failures. Do not automatically create Delivery Intents.
```

**Expected result**

Checkpoint 8 learning exists as durable PI Sources with triage outcomes.

**Verify before continuing**

`pnpm pactwright intelligence validate` passes and every blocking finding is either resolved in this checkpoint or exists as a triaged candidate before closure.

## Exit gate

Checkpoint 8 is complete only when all of the following hold:

1. Both projects use one shared GitHub Project projecting every configured enabled profile; no extension creates a competing Project.
2. Configuration gating provisions only configured views while checks/PR summaries can operate without Project views; an empty configured Experiments view is valid and does not manufacture Experiment state.
3. PR summaries, checks and views remain derived projections; GitHub edits alone cannot mutate Delivery, PI, Asset/Publication, Deployment, Experiment or Observation truth.
4. Operations exposes Operations, Deployments, **Experiments**, Production Findings and Corrective Roadmap views when configured.
5. The Experiments view projects mode, hypothesis, exact control/candidate exposure, primary metric, guardrails, window, derived state, latest Observation and resulting PI/later Delivery provenance where available, without raw telemetry/experiment samples/private prompts or grounding.
6. Deployment/rollout without Experiment remains representable; Experiment is not turned into a mandatory lifecycle stage.
7. Favourable Experiment evidence is not rendered as promotion unless normal PI/Delivery governance actually accepted it.
8. Remote state regenerates/converges from Pactwright-owned desired/canonical state, including after reversible projection drift.
9. Extension disable/removal affects only owned integration: disabling Operations removes its Experiment surface but preserves Review & Creative/PI truth; PI removal remains blocked under dependants.
10. Regenerated integration lands through reviewed pull requests and all Delivery/PI/Creative/Operations validation passes.
11. The public operating guide/examples/Academy/catalogue/README explain both ordinary feedback loops and controlled Experiment loops without implying every rollout needs experimentation.
12. `0.0.8` is published with verified provenance and installed in Kakeibo.
13. Kakeibo's real Checkpoint 6 controlled Kei Experiment is projected from exact existing Deployment/Experiment/Observation/PI records without adding Kei-specific Pactwright graph types or exposing private production trace data.
14. A real Kakeibo feedback-driven Delivery is fully projected; where it originates from the Experiment lineage, the Project exposes `Delivery Evidence → Deployment → Experiment → Observation → PI → later Delivery`; otherwise it displays the actual lineage without fabricating Experiment state.
15. Checkpoint 8 feedback is captured as PI Sources and no blocking projection/governance defect is silently carried into Checkpoint 9.

---

**Pactwright — Checkpoint 8 — Full Project Operating Surface v10**
