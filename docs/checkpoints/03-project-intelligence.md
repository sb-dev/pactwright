# Pactwright — Checkpoint 3 — Project Intelligence

**Version:** 9 
**Entry condition:** Checkpoint 2 is accepted. 
**Release:** `0.0.3` 
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

After Checkpoint 2 activates GitHub, land coherent repository changes through pull requests and required checks rather than direct default-branch commits. This includes class 2/3 Project Intelligence promotions once they exist: the promotion pull request is the promotion proposal.

Dynamic ids such as `<source-id>`, `<brief-id>` and `<evidence-id>` must come from an earlier command in the runbook. Commands that create or resolve durable records must print the ids required by later steps.

Fixture verification means repository test fixtures unless a step explicitly creates a real repository or GitHub resource.

## 4. Checkpoint specification map

- **PI boundary/layout/data** — Pactwright — Project Intelligence Graph Engineering Spec §§1–7
- **Triage/freshness/onboarding/roadmap** — Pactwright — Project Intelligence Graph Engineering Spec §§8–12
- **PI integration/commands/validation** — Pactwright — Project Intelligence Graph Engineering Spec §§13–17
- **Extensions & packaging** — Pactwright — Distribution, Agents and Evaluation §§4–8, 16, 18
- **PI GitHub surface** — Pactwright — GitHub Actions and Views §§6, 13, 20–21, 25
- **Delivery lifecycle & context** — Pactwright — Delivery Graph and Lifecycle Engineering Spec §§19, 22
- **Release execution** — Pactwright — Implementation Guide (npm release model; GitHub Actions baseline)
- **Public product** — Pactwright Open-Source Project Organisation §§1.2–1.3; Pactwright — Implementation Principles §§5A, 7, 13–14
- **Kakeido semantics** — Kakeido Financial Model, Product & UX, Mobile Design, Kei Assistant and Tech Stack specs

## 5. Out of scope for Checkpoint 3

The following are intentionally deferred and must not be implemented or emulated in this checkpoint:

- **Real extension-originated internal Sources.** Graph Review findings arrive in Checkpoint 4 and Operations Observations in Checkpoint 6. Checkpoint 3 implements and fixture-tests internal-Source semantics (`source_type: internal`, origin provenance, validation of originating provenance) so those hand-offs have a working boundary, but no real extension contributes Sources yet.
- **`@pactwright/creative`.** The creative-capable agent pack is Checkpoint 4 work. Checkpoint 3 extends only `@pactwright/standard`.
- **`agent-pack use` and `eval --baseline`.** These remain deferred as recorded in Checkpoint 1.
- **`go-to-market` at Covered.** Full go-to-market coverage is required only for acquisition/positioning/campaign work and is deferred to the creative checkpoints. Checkpoint 3 requires `go-to-market` at least Seeded so `content` can be covered without violating the core dependency chain.
- **GTM-driven launch sequencing.** `launch_tranche` and go-to-market influence on discretionary roadmap ordering are exercised only through fixtures in this checkpoint; real GTM sequencing waits for accepted go-to-market strategy.
- **Automatic research and ingestion adapters.** Listed as future improvements in the Project Intelligence spec §19; not implemented here.

## Stage 1 — Package and register Project Intelligence

Create the extension boundary and its runtime commands before semantic operations.

### Step 1 — Implement package manifest and dependency/capability registration

**References:** PI boundary/layout/data §§1–4; Extensions & packaging §§4–5

**Run**

```text
Using Pactwright Delivery, create `@pactwright/project-intelligence` as a publishable workspace package and implement its manifest/registration: Source/Domain/Knowledge node types, Intelligence namespace, required intelligence-triage/intelligence-promotion/intelligence-context capabilities and Project Intelligence GitHub profile. Do not mutate Delivery semantics.
```

**Expected result**

The extension is independently loadable and owns only its declared graph semantics.

**Verify before continuing**

Run manifest/dependency-resolution fixtures, including the case where a compatible `@pactwright/project-intelligence` package is already installed as a project dependency; then run `pnpm build`. Pactwright installation is exercised in Stage 6.

### Step 2 — Provide the intelligence capabilities in `@pactwright/standard`

**References:** Extensions & packaging §7

**Run**

```text
Extend the `@pactwright/standard` agent-pack manifest to provide the intelligence-triage, intelligence-promotion and intelligence-context capabilities with their agent prompts and skills, following the capability mapping defined by Distribution §7. Unused capabilities remain inert when the extension is disabled. Do not move Project Intelligence graph or lifecycle semantics into the pack.
```

**Expected result**

`extension add project-intelligence` can pass required-capability validation against the default pack, and triage/promotion/context semantic analysis has a resolvable agent implementation.

**Verify before continuing**

Run agent-pack capability-resolution fixtures for all three intelligence capabilities, including the failure fixture where a pack lacking them is selected; confirm the `@pactwright/standard` package build/prepack succeeds; then run `pnpm build`.

### Step 3 — Implement PI repository layout and nine core Domain definitions

**References:** PI boundary/layout/data §§4, 5.2, 7

**Run**

```text
When Project Intelligence is enabled, create the repository layout from PI §4 and seed all nine core Domain Definitions from §7 with their required metadata/dependencies, including the core dependency chain (go-to-market depends on discovery/product/identity; content depends on go-to-market). Do not create project-specific Sources or Knowledge automatically.
```

**Expected result**

Every PI-enabled project starts with the mandatory core registry and its canonical dependency chain.

**Verify before continuing**

Run layout/registry fixtures asserting all nine core domains, their `depends_on` chains and required Domain Definition fields; then run `pnpm build`. Command-level validation is exercised in Step 4.

### Step 4 — Implement `intelligence validate` and `register-domain`

**References:** PI integration/commands/validation §§15, 17; PI boundary/layout/data §5.2

**Run**

```text
Implement pactwright intelligence validate covering the PI §17 rules implementable at this point (Source/Domain structural rules, core-registry presence, acyclic registered domain dependencies, internal-Source originating provenance) and extend it in later steps as Knowledge, edge, class and roadmap semantics land. Implement pactwright intelligence register-domain <id> with reviewed registration/retirement of non-core domains; core domains are never silently removed.
```

**Expected result**

Deterministic PI validation and reviewed domain registration are runtime-owned commands available to every subsequent step.

**Verify before continuing**

Run `pnpm pactwright intelligence validate` on a clean fixture; remove one core Domain in a fixture and confirm validation fails; register a non-core domain through `register-domain` and confirm unreviewed registration/retirement is rejected.

## Stage 2 — Implement Source ingestion and triage

Create the single ingestion path used by founding material and future extension findings.

### Step 5 — Implement Source identity/versioning/storage boundary

**References:** PI boundary/layout/data §5.1

**Run**

```text
Implement Source semantics: canonical_id + content_hash identity, captured/observed times, source type (document/internal/digest), snapshot/reference storage, version_of, status, origin, trust and triage metadata. For internal Sources, preserve originating extension and canonical record identity in origin, plus content hash, supporting evidence and originating Project Graph revision. Add secret-scan boundary before snapshot commit. If stored snapshot bytes must later be removed, retain provenance/hash and flag dependent knowledge for revalidation. Same identity is a no-op; same canonical_id with new hash creates a version.
```

**Expected result**

Source capture is immutable, traceable and idempotent for external and internal origins alike.

**Verify before continuing**

Add fixtures for duplicate, changed version, reference-only, secret-rejected snapshot, an internal Source with valid extension origin provenance, an internal Source with missing originating provenance (validation must fail), and snapshot-byte removal retaining provenance/hash and triggering dependant revalidation.

### Step 6 — Implement triage and class 0–3 automatic boundary

**References:** Triage/freshness/onboarding/roadmap §8

**Run**

```text
Implement triage identity, relevance, domain, comparison, disposition and consequence class 0/1/2/3. Enforce that class 0/1 may only add Source/evidence/derived freshness and cannot change canonical meaning, Delivery state or sibling extension state. Class 2/3 require reviewed promotion. When no registered domain fits, triage proposes a new Domain Definition and treats the change as class 2.
```

**Expected result**

Consequence determines ceremony; origin/domain alone does not.

**Verify before continuing**

Run fixtures proving a class-1 Source cannot edit a requirement, constraint, decision or Delivery node, and a fixture where no registered domain fits and triage emits a class-2 Domain Definition proposal rather than writing one.

### Step 7 — Expose `ingest`, `triage`, `promote`

**References:** Triage/freshness/onboarding/roadmap §8; PI integration/commands/validation §§15–17

**Run**

```text
Implement pactwright intelligence ingest <path-or-url>, triage <source-id> and promote <source-id>. Wire them to the Source/triage/promotion semantics already implemented. For class 2/3, promote assembles one promotion proposal — Knowledge Card and edge changes, affected Delivery and extension-owned records, delivery proposals where needed — as a branch/pull-request payload routed through relevant owners, and applies validated Intelligence Graph mutations only after approval. Preserve idempotency, approval and failure behaviour from PI §§16–17, including listing failed ingestion in reports/failed-ingestion.md without mutating canonical state.
```

**Expected result**

The runtime owns deterministic PI ingestion/promotion mechanics, and the promotion pull request is the class 2/3 proposal.

**Verify before continuing**

Run ingest+triage on a fixture twice, then modify the source and ingest again; verify correct no-op/version behaviour. Run a class-2 fixture proving promote produces a promotion proposal and performs no canonical mutation before approval. Run a failed-ingestion fixture and confirm the failure is listed in `reports/failed-ingestion.md` with captured Source state preserved.

## Stage 3 — Implement Knowledge and relationships

Make accepted project meaning durable and traceable.

### Step 8 — Implement Knowledge Cards, kind governance and evidence rules

**References:** PI boundary/layout/data §5.3; Triage/freshness/onboarding/roadmap §9

**Run**

```text
Implement Knowledge Cards with domain, kind, status, conclusion, evidence, refresh/review metadata, supersession and recurrence. Enforce kind-specific governance: normative kinds gain authority through approval; empirical kinds remain evidence-governed. Accepted cards require at least one Source. Implement the PI §9 evidence rules: one T0 may suffice, T1 needs independent corroboration, T2/T3 cannot alone establish accepted empirical knowledge, copied/syndicated Sources sharing one origin count as one evidential origin, and corroborating Sources refresh a card only when newly observed, from a distinct origin, in scope and sufficiently trusted.
```

**Expected result**

Knowledge represents current accepted project meaning without replacing Source provenance, and evidence weighing cannot outvote approval-governed kinds.

**Verify before continuing**

Run validation fixtures for missing Source, invalid kind/status, supersession and retraction. Add evidence fixtures proving: T2/T3-only evidence cannot establish an accepted empirical card; two Sources sharing one origin count as one; an ineligible corroborating Source does not refresh; and additional supporting Sources cannot change an approved requirement/constraint/decision without review.

### Step 9 — Implement Intelligence edges and cross-graph ownership

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

### Step 10 — Implement onboarding/coverage reports

**References:** Triage/freshness/onboarding/roadmap §10

**Run**

```text
Implement domain coverage states Missing/Seeded/Covered and pactwright intelligence onboard. Generate domain-map.md and onboarding.md from Domain definitions + accepted in-horizon Knowledge, stamped with the Project Graph revision they derive from. Follow dependency-aware cold-start ordering: strategic upstream core first, go-to-market guidance unlocking when discovery/product/identity are seeded, content guidance unlocking when go-to-market is seeded. A domain without coverage slots stops at Seeded. Missing knowledge becomes Source-ingestion guidance, never an Intent. Regenerate coverage after accepted knowledge changes, staleness, domain changes, supersessions and retractions.
```

**Expected result**

Onboarding answers what the project still needs to know.

**Verify before continuing**

Run `pnpm pactwright intelligence onboard` on an empty PI fixture and inspect strategic-upstream guidance. Add fixtures proving: a domain transitions Missing → Seeded → Covered as artifact and coverage-slot cards are accepted; a slot-free domain stops at Seeded; go-to-market guidance appears only after the strategic core is seeded and content guidance only after go-to-market is seeded; coverage regenerates after a supersession; and both reports carry the pinned Project Graph revision.

### Step 11 — Implement the single intent-roadmap derivation model

**References:** Triage/freshness/onboarding/roadmap §11

**Run**

```text
Implement pactwright intelligence derive-intent-roadmap and the single Project Intelligence candidate model. Derive candidates from accepted delivery obligations/existing Intents/reconsideration needs, preserve provenance/readiness/dependency waves/precedence, link blocked candidates back to the onboarding guidance for their missing knowledge, stamp the report with its Project Graph revision, and never create canonical Intents automatically.
```

**Expected result**

The roadmap proposes what to build/correct and remains derived.

**Verify before continuing**

Run the command and prove no new Intent node appears unless separately captured. Add a fixture where a candidate's required domain dependency is unseeded: the candidate must be `blocked` and its report entry must link to the corresponding onboarding action. Confirm the report identifies its Project Graph revision.

### Step 12 — Implement propagation and freshness

**References:** Triage/freshness/onboarding/roadmap §§9, 12; PI integration/commands/validation §15

**Run**

```text
Implement pactwright intelligence propagate <knowledge-id> and refresh. Propagation emits proposals/impact for changed Knowledge and never silently edits dependants. Freshness marks/report staleness without changing canonical meaning.
```

**Expected result**

Changed/stale Knowledge is surfaced mechanically without ownership violations.

**Verify before continuing**

Run propagate/refresh fixtures and inspect derived reports.

## Stage 5 — Integrate PI with Delivery, GitHub and evaluation

Make accepted Knowledge useful during work, visible remotely and measurable.

### Step 13 — Implement bounded Delivery context contribution

**References:** PI integration/commands/validation §13; Delivery lifecycle & context §22

**Run**

```text
Implement namespaced PI context contribution using registered Domain brief recipes. Include only accepted, relevant and sufficiently current Knowledge; preserve the core Delivery lineage and exclude raw extension execution/telemetry.
```

**Expected result**

Delivery gets high-signal project grounding without loading the whole Intelligence Graph.

**Verify before continuing**

Run `pactwright context <brief-id>` against fixtures requiring different domains and inspect bounded selection.

### Step 14 — Implement PI GitHub workflow/checks/views

**References:** PI GitHub surface §§6, 20–21, 25; Release execution (GitHub Actions baseline)

**Run**

```text
Implement the Project Intelligence GitHub profile and generated pactwright-intelligence.yml. Follow the Implementation Guide's GitHub Actions baseline: least-privilege GITHUB_TOKEN permissions, third-party actions pinned to full commit SHAs, persist-credentials: false where checkout does not push, frozen installs, bounded job timeouts, concurrency cancellation for superseded PR validation runs, and no pull_request_target for normal validation. Add Source/promotion validation, onboarding/coverage, roadmap, freshness/propagation regeneration and PI checks/views exactly as defined by the GitHub spec. Reports remain revision-stamped derived views.
```

**Expected result**

PI operates remotely without GitHub owning Knowledge/candidates.

**Verify before continuing**

Run `pactwright sync` and `pactwright github sync --dry-run`; inspect only PI-owned contributions. Confirm the generated workflow satisfies every GitHub Actions baseline rule and that PI checks are registered for promotion pull requests.

### Step 15 — Contribute Project Intelligence evaluation cases

**References:** Extensions & packaging §16; Implementation Principles §15

**Run**

```text
Extend pactwright eval with Project Intelligence cases owned by @pactwright/project-intelligence: source triage (including irrelevant/duplicate stops and class assignment), evidence comparison, and intelligence-context selection including the "selects irrelevant knowledge" failure. Keep deterministic assertions separate from semantic judgement and do not calculate one aggregate quality score.
```

**Expected result**

The required intelligence capabilities are evaluable independently from project delivery, with cases versioned alongside the extension that owns them.

**Verify before continuing**

Run `pnpm pactwright eval` and inspect per-case PI output alongside the existing core Delivery suite.

## Stage 6 — Adopt Project Intelligence in Pactwright

Use PI on the project that defines it.

### Step 16 — Enable PI in Pactwright from the workspace

Run from the Pactwright repository root.

**References:** Extensions & packaging §4; PI GitHub surface §6

The published `0.0.3` family does not exist yet; it is released in Stage 8 and installed from the registry in Kakeido (Stage 9). Pactwright adopts its own workspace build, consistent with the repository-local CLI discipline in the execution contract.

**Run**

```bash
pnpm build

pnpm pactwright extension add project-intelligence
pnpm pactwright intelligence validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

`extension add` resolves the compatible workspace `@pactwright/project-intelligence`, registers it in config/lock, validates required agent capabilities against `@pactwright/standard`, creates the extension-owned layout and runs `pactwright sync`.

**Expected result**

Pactwright has PI enabled and valid against its own workspace build.

**Verify before continuing**

Run `pnpm pactwright validate`.

### Step 17 — Ingest the Pactwright authoritative corpus

Run from the Pactwright repository root.

**References:** Triage/freshness/onboarding/roadmap §§8, 10–11; PI integration/commands/validation §15

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

**Expected result**

The founding authoritative corpus and the current README/Docs/Academy/Examples/Website material enter the normal Source path as separate traceable Sources. Public content is visible to Project Intelligence without automatically becoming authoritative Knowledge.

**Run**

For each Source id printed by the ingest commands:

```bash
pnpm pactwright intelligence triage <source-id>

# only when triage reports reviewed promotion is required and the proposal is accepted
pnpm pactwright intelligence promote <source-id>
```

Class 2/3 promotions land through their promotion pull requests and required checks.

Then:

```bash
pnpm pactwright intelligence onboard
pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright intelligence validate
pnpm pactwright validate
```

**Verify before continuing**

Every accepted Knowledge item remains traceable to its Source, every class 2/3 promotion is traceable to an approved promotion pull request, and the roadmap contains no automatically created Intent.

### Step 18 — Use one ready roadmap candidate to drive real Pactwright Delivery

Run from the Pactwright repository root.

**References:** Triage/freshness/onboarding/roadmap §11; Delivery lifecycle & context §19

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

Project Intelligence must know enough about Pactwright before later Creative Delivery is allowed to generate public work. Coverage is built in the order the core dependency chain requires: strategic upstream core first, then `go-to-market` seeded, then `content`.

### Step 19 — Cover identity, product, go-to-market and content knowledge in dependency order

**References:** PI boundary/layout/data §7; Triage/freshness/onboarding/roadmap §§8–10; PI integration/commands/validation §13; Public product — Open-Source Project Organisation §1.2; Implementation Principles §5A

**Run**

From the Pactwright repository root:

```bash
pnpm pactwright intelligence onboard
```

Inspect the generated domain map.

For each required domain below that has not reached its target state, run a normal Delivery to create or collect the missing source material, respecting the dependency chain: `discovery` at least Seeded and `identity`/`product` Covered before `go-to-market` work; `go-to-market` at least Seeded before `content` work. Start with:

```text
/capture-intent "Establish the accepted Project Intelligence source material needed to bring Pactwright's <discovery|identity|product|go-to-market|content> domain to its Checkpoint 3 target state for public content. Derive from existing authoritative specifications and current product behaviour. Any new strategic choice must become an explicit Decision rather than being invented silently."
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

- `discovery` is at least `Seeded`;
- `identity` is `Covered`;
- `product` is `Covered`;
- `go-to-market` is at least `Seeded` (full coverage is deferred per the out-of-scope block);
- `content` is `Covered`, reached only after `go-to-market` was seeded;
- accepted Knowledge traces to authoritative Sources and explicit Decisions where strategy was created.

**Verify before continuing**

Inspect `domain-map.md`/onboarding output and sample the accepted identity/product/go-to-market/content Knowledge. Confirm onboarding surfaced `content` guidance only after `go-to-market` was seeded. No identity, positioning, voice or product claim may exist only in a generated public artefact.

### Step 20 — Publish the Project Intelligence learning path

**References:** Public product — Open-Source Project Organisation §1.3; Triage/freshness/onboarding/roadmap §§10–12; PI integration/commands/validation §13

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

### Step 21 — Prepare, publish and tag `0.0.3`

**References:** Release execution (npm release model); Extensions & packaging §18

**Run**

Update `CHANGELOG.md` from accepted Checkpoint 3 Evidence only, then create the release PR:

```bash
VERSION=0.0.3
DEFAULT_BRANCH="$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name)"

git switch "$DEFAULT_BRANCH"
git pull --ff-only
git switch -c "release/$VERSION"

pnpm -r exec npm version "$VERSION" --no-git-tag-version --allow-same-version
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
pnpm install --frozen-lockfile
pnpm build
```

The following package names are new in this release and cannot use trusted publishing until their first registry version exists:

- `@pactwright/project-intelligence`

After the release PR is merged, bootstrap only those new packages interactively:

```bash
pnpm whoami

pnpm --filter @pactwright/project-intelligence publish --dry-run --tag next --access public
pnpm --filter @pactwright/project-intelligence publish --tag next --access public

REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"

npx -y npm@^11.15 trust github @pactwright/project-intelligence \
  --repo "$REPO" \
  --file release.yml \
  --environment npm-release \
  --allow-publish
```

If the `npm trust` subcommand is unavailable in the resolved npm version, configure the trusted publisher in the npm web UI instead: package → Settings → Trusted Publisher, with the repository, workflow file `release.yml` and environment `npm-release`.

Do not manually publish packages that already have trusted publishing configured.

Tag the accepted merge commit:

```bash
git tag -a "v$VERSION" -m "v$VERSION"
git push origin "v$VERSION"
```

**Expected result**

The tag-triggered trusted `release.yml` workflow verifies the exact merged source and publishes every still-unpublished package in the `0.0.3` family under `next`, including the capability-extended `@pactwright/standard`. Existing published members are not overwritten.

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

Existing package-family members must show npm provenance/trusted-publisher metadata; the newly bootstrapped package(s) must now trust `release.yml` for the next release. If the CLI is unavailable, verify the trusted publisher in the npm web UI.

## Stage 9 — Cold-start Kakeido

Run this stage from the Kakeido repository root unless a step explicitly says otherwise.

Prove PI can understand a different multi-domain project from its real specs.

### Step 22 — Install PI in Kakeido

**References:** Extensions & packaging §4

**Run**

```bash
pnpm add -D \
  pactwright@0.0.3 \
  @pactwright/project-intelligence@0.0.3

pnpm pactwright extension add project-intelligence
pnpm pactwright intelligence validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

`extension add` resolves the already-installed compatible dependency, registers config/lock, validates required agent capabilities and runs `pactwright sync`.

**Expected result**

Kakeido has the same published `0.0.3` PI/runtime family.

**Verify before continuing**

Run `pnpm pactwright validate`.

### Step 23 — Ingest all five Kakeido specifications

**References:** Triage/freshness/onboarding/roadmap §§8, 10–11; Kakeido semantics

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

Class 2/3 promotions land through their promotion pull requests and required checks.

Then:

```bash
pnpm pactwright intelligence onboard
pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright intelligence validate
pnpm pactwright validate
```

**Verify before continuing**

Onboarding and roadmap output reflect Kakeido's distinct domains and no roadmap candidate has become a canonical Intent automatically.

### Step 24 — Deliver a cross-domain Kakeido candidate

**References:** Kakeido semantics — Financial Model §§2–17; Product & UX §§2–10; Tech Stack §§3–10

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

## Stage 10 — Capture Checkpoint 3 feedback through Project Intelligence

From this checkpoint on, findings about Pactwright itself flow through the capability just built.

### Step 25 — Ingest checkpoint findings as Sources

Run from the Pactwright repository root.

**References:** Implementation Principles §§7, 13–14; Triage/freshness/onboarding/roadmap §§8, 11

**Run**

Collect the material findings from implementing Checkpoint 3 and from installing/using it on Kakeido: defects, friction, missing guidance, installation problems and public-content corrections. For each material finding, write a short finding document, then:

```bash
pnpm pactwright intelligence ingest <finding-path>
pnpm pactwright intelligence triage <source-id>

# only when reviewed promotion is required and the proposal is accepted
pnpm pactwright intelligence promote <source-id>
```

Then:

```bash
pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright intelligence validate
```

For each finding, apply the Implementation Principles §14 question — is this a Kakeido-specific choice, or evidence that a Pactwright responsibility failed? — and only promote repeatable Pactwright responsibility failures toward product-affecting Knowledge or evaluation cases.

**Expected result**

Checkpoint findings are durable, traceable Sources; justified findings become accepted Knowledge and roadmap candidates for future checkpoints; nothing becomes an Intent automatically.

**Verify before continuing**

Each ingested finding is traceable as a Source with provenance; promoted findings appear as Knowledge with correct kind/status; justified candidates appear on the intent roadmap without any automatically created Intent; Kakeido-specific preferences were not generalised into Pactwright semantics.

## Exit gate

Checkpoint 3 is complete only when all of the following hold:

1. `@pactwright/project-intelligence` exists as an independently loadable extension, and `@pactwright/standard` provides its required intelligence capabilities (Stage 1).
2. `intelligence validate` and `register-domain` are runtime-owned, the nine core domains exist automatically, and non-core domains require reviewed registration (Stage 1).
3. Source identity/versioning/storage, internal-Source provenance, triage classes and the class 0/1 automatic boundary are implemented and fixture-proven, and class 2/3 promotion proposals are pull requests applied only after approval (Stage 2).
4. Knowledge Cards, kind governance, the §9 evidence rules and all PI relations validate, with approval-governed kinds immune to evidence outvoting (Stage 3).
5. Onboarding/coverage, the single intent-roadmap derivation, propagation and freshness are implemented; blocked candidates link to onboarding guidance; reports are revision-stamped; the dependency-aware unlock chain is proven (Stage 4).
6. Bounded PI Delivery context, the hardened `pactwright-intelligence.yml` surface and PI evaluation cases exist (Stage 5).
7. Pactwright has PI enabled from its workspace build, its authoritative and public corpus is ingested through the normal Source path, and one real roadmap candidate entered Delivery only through explicit Intent capture (Stage 6).
8. `identity`, `product` and `content` are Covered and `discovery`/`go-to-market` at least Seeded, in dependency order, and the Project Intelligence learning path is published from accepted Knowledge (Stage 7).
9. `0.0.3` is published and registry-verified for the whole family, and `@pactwright/project-intelligence` has a bootstrapped trusted publisher (Stage 8).
10. Kakeido is installed from the published `0.0.3`, onboarded through the normal Source path from its five specifications, and delivered one cross-domain candidate with bounded, semantically correct context (Stage 9).
11. Checkpoint findings are captured through Project Intelligence itself as traceable Sources, Knowledge and roadmap candidates, with no automatic Intents (Stage 10).

---

**Pactwright — Checkpoint 3 — Project Intelligence v9**
