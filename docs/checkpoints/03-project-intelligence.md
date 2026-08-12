# Pactwright — Checkpoint 3 — Project Intelligence

**Version:** 8 
**Entry condition:** Checkpoint 2 is accepted. 
**Exit capability:** Project Intelligence can cold-start both projects, govern knowledge, supply bounded Delivery context and derive one intent roadmap.

## 1. Goal

Implement Project Intelligence as a complete optional extension, adopt it in Pactwright, ingest the Pactwright corpus, then prove cold-start onboarding/context/roadmap behaviour in Kakeido.

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

- **PI boundary/layout/data** — Pactwright — Project Intelligence Graph Engineering Spec §§1–7
- **Triage/freshness/onboarding/roadmap** — Pactwright — Project Intelligence Graph Engineering Spec §§8–12
- **Delivery/extension integration/commands** — Pactwright — Project Intelligence Graph Engineering Spec §§13–17
- **Distribution/GitHub** — Pactwright — Distribution, Agents and Evaluation §§4–8; Pactwright — GitHub Actions and Views §§6, 13, 20–21, 25–27

## Stage 1 — Package and register Project Intelligence

Create the extension boundary before semantic operations.

### Step 1 — Implement package manifest and dependency/capability registration

**References:** PI boundary/layout/data §§1–4; Distribution/GitHub §§4–5

**Run**

```text
Using Pactwright Delivery, create `@pactwright/project-intelligence` as a publishable workspace package and implement its manifest/registration: Source/Domain/Knowledge node types, Intelligence namespace, required intelligence-triage/intelligence-promotion/intelligence-context capabilities and Project Intelligence GitHub profile. Do not mutate Delivery semantics.
```

**Expected result**

The extension is independently loadable and owns only its declared graph semantics.

**Verify before continuing**

Run manifest/dependency-resolution fixtures, including the case where a compatible `@pactwright/project-intelligence` package is already installed as a project dependency; then run `pnpm build`. Pactwright installation is exercised in Stage 6.

### Step 2 — Implement PI repository layout and nine core Domain definitions

**References:** PI boundary/layout/data §§4, 5.2, 7

**Run**

```text
When Project Intelligence is enabled, create the repository layout from PI §4 and seed all nine core Domain Definitions from §7 with their required metadata/dependencies. Do not create project-specific Sources or Knowledge automatically.
```

**Expected result**

Every PI-enabled project starts with the mandatory core registry.

**Verify before continuing**

Run `pnpm pactwright intelligence validate`; remove one core Domain in a fixture and confirm validation fails.

## Stage 2 — Implement Source ingestion and triage

Create the single ingestion path used by founding material and future extension findings.

### Step 3 — Implement Source identity/versioning/storage boundary

**References:** PI boundary/layout/data §5.1

**Run**

```text
Implement Source semantics: canonical_id + content_hash identity, captured/observed times, source type, snapshot/reference storage, version_of, status, origin, trust and triage metadata. Add secret-scan boundary before snapshot commit. Same identity is a no-op; same canonical_id with new hash creates a version.
```

**Expected result**

Source capture is immutable, traceable and idempotent.

**Verify before continuing**

Add fixtures for duplicate, changed version, reference-only and secret-rejected snapshot.

### Step 4 — Implement triage and class 0–3 automatic boundary

**References:** Triage/freshness/onboarding/roadmap §8

**Run**

```text
Implement triage identity, relevance, domain, comparison, disposition and consequence class 0/1/2/3. Enforce that class 0/1 may only add Source/evidence/derived freshness and cannot change canonical meaning, Delivery state or sibling extension state. Class 2/3 require reviewed promotion.
```

**Expected result**

Consequence determines ceremony; origin/domain alone does not.

**Verify before continuing**

Run fixtures proving a class-1 Source cannot edit a requirement, constraint, decision or Delivery node.

### Step 5 — Expose `ingest`, `triage`, `promote`

**References:** Triage/freshness/onboarding/roadmap §8; Delivery/extension integration/commands §§15–17

**Run**

```text
Implement pactwright intelligence ingest <path-or-url>, triage <source-id> and promote <source-id>. Wire them to the Source/triage/promotion semantics already implemented. Preserve idempotency, approval and failure behaviour from PI §§16–17.
```

**Expected result**

The runtime now owns deterministic PI ingestion/promotion mechanics.

**Verify before continuing**

Run ingest+triage on a fixture twice, then modify the source and ingest again; verify correct no-op/version behaviour.

## Stage 3 — Implement Knowledge and relationships

Make accepted project meaning durable and traceable.

### Step 6 — Implement Knowledge Cards and kind governance

**References:** PI boundary/layout/data §5.3

**Run**

```text
Implement Knowledge Cards with domain, kind, status, conclusion, evidence, refresh/review metadata, supersession and recurrence. Enforce kind-specific governance: normative kinds gain authority through approval; empirical kinds remain evidence-governed. Accepted cards require at least one Source.
```

**Expected result**

Knowledge represents current accepted project meaning without replacing Source provenance.

**Verify before continuing**

Run validation fixtures for missing Source, invalid kind/status, supersession and retraction.

### Step 7 — Implement Intelligence edges and cross-graph ownership

**References:** PI boundary/layout/data §6

**Run**

```text
Register and validate PI relations depends-on, supports, contradicts, constrains, affects, requires-delivery, satisfied-by, supersedes, retracts and informs-only. Preserve endpoint ownership; requires-delivery targets a Delivery Intent and satisfied-by targets Delivery Evidence without transferring ownership.
```

**Expected result**

PI can connect meaning to Delivery while each subgraph keeps canonical ownership.

**Verify before continuing**

Run valid/invalid cross-graph edge fixtures and `pactwright intelligence validate`.

## Stage 4 — Implement onboarding, roadmap, propagation and freshness

Turn durable Knowledge into project guidance and candidate work without a second lifecycle.

### Step 8 — Implement onboarding/coverage reports

**References:** Triage/freshness/onboarding/roadmap §10

**Run**

```text
Implement domain coverage states Missing/Seeded/Covered and pactwright intelligence onboard. Generate domain-map.md and onboarding.md from Domain definitions + accepted in-horizon Knowledge. Follow dependency-aware cold-start ordering. Missing knowledge becomes Source-ingestion guidance, never an Intent.
```

**Expected result**

Onboarding answers what the project still needs to know.

**Verify before continuing**

Run `pnpm pactwright intelligence onboard` on an empty PI fixture and inspect strategic-upstream guidance.

### Step 9 — Implement the single intent-roadmap derivation model

**References:** Triage/freshness/onboarding/roadmap §11

**Run**

```text
Implement pactwright intelligence derive-intent-roadmap and the single Project Intelligence candidate model. Derive candidates from accepted delivery obligations/existing Intents/reconsideration needs, preserve provenance/readiness/dependency waves/precedence, and never create canonical Intents automatically.
```

**Expected result**

The roadmap proposes what to build/correct and remains derived.

**Verify before continuing**

Run the command and prove no new Intent node appears unless separately captured.

### Step 10 — Implement propagation and freshness

**References:** Triage/freshness/onboarding/roadmap §§9, 12; Delivery/extension integration/commands §15

**Run**

```text
Implement pactwright intelligence propagate <knowledge-id> and refresh. Propagation emits proposals/impact for changed Knowledge and never silently edits dependants. Freshness marks/report staleness without changing canonical meaning.
```

**Expected result**

Changed/stale Knowledge is surfaced mechanically without ownership violations.

**Verify before continuing**

Run propagate/refresh fixtures and inspect derived reports.

## Stage 5 — Integrate PI with Delivery and GitHub

Make accepted Knowledge useful during work and visible remotely.

### Step 11 — Implement bounded Delivery context contribution

**References:** Delivery/extension integration/commands §13; Delivery Graph §22

**Run**

```text
Implement namespaced PI context contribution using registered Domain brief recipes. Include only accepted, relevant and sufficiently current Knowledge; preserve the core Delivery lineage and exclude raw extension execution/telemetry.
```

**Expected result**

Delivery gets high-signal project grounding without loading the whole Intelligence Graph.

**Verify before continuing**

Run `pactwright context <brief-id>` against fixtures requiring different domains and inspect bounded selection.

### Step 12 — Implement PI GitHub workflow/checks/views

**References:** Distribution/GitHub §§6, 13, 20–21

**Run**

```text
Implement the Project Intelligence GitHub profile and generated pactwright-intelligence.yml. Follow the core GitHub workflow hardening invariant from Checkpoint 2: frozen installs, least privilege, SHA-pinned third-party actions, bounded timeouts/concurrency, and no `pull_request_target`. Add Source/promotion validation, onboarding/coverage, roadmap, freshness/propagation regeneration and PI checks/views exactly as defined by GitHub. Reports remain revision-stamped derived views.
```

**Expected result**

PI operates remotely without GitHub owning Knowledge/candidates.

**Verify before continuing**

Run `pactwright sync` and `pactwright github sync --dry-run`; inspect only PI-owned contributions.

## Stage 6 — Adopt Project Intelligence in Pactwright

Use PI on the project that defines it.

### Step 13 — Install/reconcile PI in Pactwright

Run from the Pactwright repository root.

**References:** Distribution/GitHub §§4, 6

**Run**

```bash
pnpm add -D \
  pactwright@0.0.3 \
  @pactwright/project-intelligence@0.0.3
pnpm install --frozen-lockfile

pnpm pactwright extension add project-intelligence
pnpm pactwright sync
pnpm pactwright intelligence validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

**Expected result**

Pactwright has PI enabled and valid.

**Verify before continuing**

Run `pnpm pactwright validate`.

### Step 14 — Ingest the Pactwright authoritative corpus

Run from the Pactwright repository root.

**References:** Triage/freshness/onboarding/roadmap §§8, 10–11; Delivery/extension integration/commands §15

**Run**

```bash
pnpm pactwright intelligence ingest "<system-architecture-path>"
pnpm pactwright intelligence ingest "<delivery-spec-path>"
pnpm pactwright intelligence ingest "<distribution-spec-path>"
pnpm pactwright intelligence ingest "<github-spec-path>"
pnpm pactwright intelligence ingest "<project-intelligence-spec-path>"
pnpm pactwright intelligence ingest "<review-creative-spec-path>"
pnpm pactwright intelligence ingest "<operations-spec-path>"
pnpm pactwright intelligence ingest "<open-source-organisation-v2-path>"
pnpm pactwright intelligence ingest "<website-spec-path>"
pnpm pactwright intelligence ingest "README.md"
```

Then enumerate the current public project material under `docs/`, `academy/`, `examples/` and `website/`. Ingest each Markdown/MDX source that materially contains current product claims, identity/voice, guidance, examples or published public content:

```bash
pnpm pactwright intelligence ingest <public-content-file>
```

Repeat for each selected file and retain the Source ids printed by the commands.
```

**Expected result**

The founding authoritative corpus and the current README/Docs/Academy/Examples/Website material enter the normal Source path as separate traceable Sources. Public content is visible to Project Intelligence without automatically becoming authoritative Knowledge.

**Run**

For each Source id printed by the ingest commands:

```bash
pnpm pactwright intelligence triage <source-id>

# only when triage reports reviewed promotion is required and the proposal is accepted
pnpm pactwright intelligence promote <source-id>
```

Then:

```bash
pnpm pactwright intelligence onboard
pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright intelligence validate
pnpm pactwright validate
```

**Verify before continuing**

Every accepted Knowledge item remains traceable to its Source and the roadmap contains no automatically created Intent.

### Step 15 — Use one ready roadmap candidate to drive real Pactwright Delivery

Run from the Pactwright repository root.

**References:** Triage/freshness/onboarding/roadmap §11; Delivery Graph §19

**Run**

```bash
pnpm pactwright intelligence derive-intent-roadmap
```


**Run**

```text
/capture-intent "<selected ready Pactwright outcome>"
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
```

**Run**

```bash
pnpm pactwright context <brief-id>
```

**Run**

```text
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Expected result**

The roadmap candidate becomes Delivery work only through explicit Intent capture and uses relevant PI context.

**Verify before continuing**

Trace candidate → Knowledge/Sources and Intent → Evidence; confirm no candidate-to-Intent automatic mutation.

## Stage 7 — Establish Pactwright public-content knowledge readiness

Project Intelligence must know enough about Pactwright before later Creative Delivery is allowed to generate public work.

### Step 16 — Cover identity, content and product knowledge

**References:** PI boundary/layout/data §7; Triage/freshness/onboarding/roadmap §§8–10; Delivery/extension integration/commands §13; Open-Source Project Organisation §1.2; Implementation Principles §5A

**Run**

From the Pactwright repository root:

```bash
pnpm pactwright intelligence onboard
```

Inspect the generated domain map.

For each required domain that is not `Covered`, run a normal Delivery to create or collect the missing source material. Start with:

```text
/capture-intent "Establish the accepted Project Intelligence source material needed to make Pactwright's <identity|content|product> domain Covered for public content. Derive from existing authoritative specifications and current product behaviour. Any new strategic choice must become an explicit Decision rather than being invented silently."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

For each delivered source document:

```bash
pnpm pactwright intelligence ingest <delivered-source-path>
pnpm pactwright intelligence triage <source-id>

# only when reviewed promotion is required and accepted
pnpm pactwright intelligence promote <source-id>
```

Re-run:

```bash
pnpm pactwright intelligence onboard
pnpm pactwright intelligence validate
```

**Expected result**

Before Checkpoint 3 closes:

- `identity` is `Covered`;
- `content` is `Covered`;
- `product` is `Covered`;
- accepted Knowledge traces to authoritative Sources and explicit Decisions where strategy was created.

**Verify before continuing**

Inspect `domain-map.md`/onboarding output and sample the accepted identity/content/product Knowledge. No identity, positioning, voice or product claim may exist only in a generated public artefact.

### Step 17 — Publish the Project Intelligence learning path

**References:** Open-Source Project Organisation §1.3; Triage/freshness/onboarding/roadmap §§10–12; Delivery/extension integration/commands §13

**Run**

Use the accepted Project Intelligence context through normal Delivery:

```text
/capture-intent "Publish Pactwright's Project Intelligence learning path: PI concept documentation, onboarding guide, one project-intelligence-onboarding example, and an Academy Project Understanding lesson. Ground claims in current accepted Project Intelligence."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
```

Inspect:

```bash
pnpm pactwright context <brief-id>
```

Then:

```text
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

Ingest the accepted public material as internal Sources where it materially represents current public claims:

```bash
pnpm pactwright intelligence ingest <public-content-path>
pnpm pactwright intelligence triage <source-id>
```

Do not promote derived public copy back into authoritative Knowledge unless triage identifies genuinely new accepted meaning.

**Expected result**

Project Intelligence is both a product capability and the source of grounded public explanation for that capability.

**Verify before continuing**

Docs, example and Academy lesson agree with accepted PI Knowledge, and the graph records both the Delivery lineage and the public-content Sources.

## Stage 8 — Release `0.0.3`

### Step 18 — Prepare, publish and tag `0.0.3`

**References:** Distribution §§2, 4, 6–8, 15, 18–19

**Run**

Update `CHANGELOG.md` from accepted Checkpoint 3 Evidence only, then create the release PR:

```bash
VERSION=0.0.3
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

The following package names are new in this release and cannot use trusted publishing until their first registry version exists:

- `@pactwright/project-intelligence`

After the release PR is merged, bootstrap only those new packages interactively:

```bash
pnpm --filter @pactwright/project-intelligence publish --dry-run --tag next --access public
pnpm --filter @pactwright/project-intelligence publish --tag next --access public

REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"

npx -y npm@^11.15 trust github @pactwright/project-intelligence \
  --repo "$REPO" \
  --file release.yml \
  --environment npm-release \
  --allow-publish
```

Do not manually publish packages that already have trusted publishing configured.

Tag the accepted merge commit:

```bash
git tag -a "v$VERSION" -m "v$VERSION"
git push origin "v$VERSION"
```

**Expected result**

The tag-triggered trusted `release.yml` workflow verifies the exact merged source and publishes every still-unpublished package in the `0.0.3` family under `next`. Existing published members are not overwritten.

**Verify before continuing**

Confirm the `release.yml` run for `v0.0.3` succeeded, then:

```bash
pnpm view pactwright@0.0.3 version
pnpm view @pactwright/standard@0.0.3 version
pnpm view @pactwright/project-intelligence@0.0.3 version
```

Every command must return `0.0.3`.

For the newly introduced package(s), also run:

```bash
npx -y npm@^11.15 trust list @pactwright/project-intelligence
```

Existing package-family members must show npm provenance/trusted-publisher metadata; the newly bootstrapped package(s) must now trust `release.yml` for the next release.


## Stage 9 — Cold-start Kakeido

Run this stage from the Kakeido repository root unless a step explicitly says otherwise.

Prove PI can understand a different multi-domain project from its real specs.

### Step 19 — Install PI in Kakeido

**References:** Distribution/GitHub §4

**Run**

```bash
pnpm add -D \
  pactwright@0.0.3 \
  @pactwright/project-intelligence@0.0.3

pnpm pactwright extension add project-intelligence
pnpm pactwright sync
pnpm pactwright intelligence validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

**Expected result**

Kakeido has the same published `0.0.3` PI/runtime family.

**Verify before continuing**

Run `pnpm pactwright validate`.

### Step 20 — Ingest all five Kakeido specifications

**References:** Triage/freshness/onboarding/roadmap §§8, 10–11; Kakeido specs

**Run**

```bash
pnpm pactwright intelligence ingest "<Financial-Model-path>"
pnpm pactwright intelligence ingest "<Product-UX-path>"
pnpm pactwright intelligence ingest "<Mobile-Design-path>"
pnpm pactwright intelligence ingest "<Kei-Spec-path>"
pnpm pactwright intelligence ingest "<Tech-Stack-path>"
```

**Expected result**

Kakeido knowledge is distributed into appropriate PI domains rather than flattened into one generic summary.

**Run**

For each Source id printed above:

```bash
pnpm pactwright intelligence triage <source-id>

# only when triage reports reviewed promotion is required and the proposal is accepted
pnpm pactwright intelligence promote <source-id>
```

Then:

```bash
pnpm pactwright intelligence onboard
pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright intelligence validate
pnpm pactwright validate
```

**Verify before continuing**

Onboarding and roadmap output reflect Kakeido's distinct domains and no roadmap candidate has become a canonical Intent automatically.

### Step 21 — Deliver a cross-domain Kakeido candidate

**References:** Financial Model §§2–17; Product & UX §§2–10; Tech Stack §§3–10


**Run**

```text
/capture-intent "<ready Kakeido outcome requiring Financial Model + Product/UX + Tech Stack context>"
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
```

**Run**

```bash
pnpm pactwright context <brief-id>
```

**Run**

```text
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Expected result**

Delivery context is relevant/bounded and preserves financial/product/engineering constraints.

**Verify before continuing**

Review for no fixed/flexible double counting, correct Review IA, mobile→API→Neon boundary, and Kei remaining non-authoritative for deterministic finance.

## Exit gate

PI is installable and self-hosted; both projects are onboarded through the normal Source path; the roadmap is derived and non-canonical; one real candidate in each project enters Delivery only through explicit Intent capture; context selection is bounded and semantically correct.

---

**Pactwright — Checkpoint 3 — Project Understanding v8**