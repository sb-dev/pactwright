# Pactwright — Checkpoint 4 — Graph Review

**Version:** 10  
**Entry condition:** Checkpoint 3 is accepted.  
**Exit capability:** Pactwright can run reproducible specialist Graph Reviews over the registered Project Graph and route findings through PI.

## 1. Goal

Implement Review execution infrastructure, the generic Review engine and full standard roster; then review Pactwright and Kakeibo and turn at least one finding in each into governed corrected Delivery.

The Kakeibo proof must review the complete seven-owner system plus its authority index. It must detect contradictions across owner boundaries without allowing Review itself to become a competing source of project truth.

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

At execution time use the complete current Kakeibo authority set:

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

`docs/specs/README.md` owns authority/conflict resolution. Review must preserve the ownership of all seven numbered specs rather than flattening them into one system narrative.

`00-kakeibo-acceptance-profile.md` §8 is the shared System-Level Acceptance cross-check for this checkpoint.

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

- **Review boundary/engine/roster** — Pactwright — Graph Review & Creative Delivery Engineering Spec §§1–8
- **Provider/Generation provenance** — Pactwright — Graph Review & Creative Delivery Engineering Spec §§14–16; §18 for credential handling only
- **Commands/validation/build order** — Pactwright — Graph Review & Creative Delivery Engineering Spec §§19, 21–24
- **Finding governance** — Pactwright — Project Intelligence Graph Engineering Spec §§8, 11, 14–17
- **Delivery correction path** — Pactwright — Delivery Graph and Lifecycle Engineering Spec §19
- **Packaging/agent pack/upgrades** — Pactwright — Distribution, Agents and Evaluation §§4–7, 15, 18
- **GitHub review surface** — Pactwright — GitHub Actions and Views §§4, 7, 22
- **Release model** — Pactwright — Implementation Guide, "npm release model"
- **Public product** — Pactwright Open-Source Project Organisation §§1.1–1.3
- **Kakeibo authority/conflict map** — current `docs/specs/README.md`
- **Kakeibo review targets** — current specs `01`–`07`
- **Kakeibo System-Level Acceptance** — Kakeibo Acceptance Profile §§2–8

## 5. Out of scope — deferred to Checkpoint 5

Checkpoint 4 delivers the Graph Review half of Review & Creative. The following are explicitly deferred to Checkpoint 5 and are not exercised here:

- Creative Delivery semantics — creative Brief contribution, grounding manifests, creative execution, independent creative verification, Asset approval/immutability/supersession and Publication (Graph Review & Creative Delivery spec §§9–13).
- `pactwright creative approve-asset` and `pactwright creative record-publication` (spec §19).
- Generation Guidance resolution, guidance provenance evaluation and the generation-reviewer learning loop (spec §17). Generation Records created in this checkpoint may carry empty guidance arrays; the record schema still carries the guidance fields.
- Execution-local command budgets (spec §18). Credential handling via environment variables and GitHub Actions secrets **is** in scope, because real reviews run in this checkpoint.
- Creative checks, Delivery PR creative integration and Creative views (GitHub Actions and Views §§14, 23).
- Asset/Publication validation rules (spec §21 items 9–14, 16–17). This checkpoint implements the review/generation validation subset only.
- The first meaningful `voice-auditor` run, whose spec perspective is published-Asset compliance; its definition ships with the roster now and is first exercised once Assets exist in Checkpoint 5.
- Exercising cross-model secondary review (spec §7). The `secondary_model` field is loaded and stored, but no standard definition enables it in this checkpoint.

`generation-reviewer` and `cost-reviewer` definitions ship with the roster in this checkpoint; their evaluation and budget loops mature in Checkpoint 5.

## Stage 1 — Build provider execution provenance required by Review

Establish extension-owned provider execution before Review depends on it.

Per spec §14, the `graph-review` capability itself executes through the selected agent pack and active adapter like other agent responsibilities; the ProviderRuntime governs extension-owned direct provider calls only. Provider credentials come from environment variables locally and GitHub Actions secrets in workflows (spec §18).

### Step 1 — Implement Provider Runtime interface/error model

**References:** Provider/Generation provenance §14

**Run**

```text
Using self-hosted Delivery, implement the Review & Creative ProviderRuntime interface and normalised auth/rate-limit/content-policy/transient/permanent errors. Bound provider-call retries per spec §22, and stub the §14 command-budget check as an inert hook; budgets are implemented in Checkpoint 5. Resolve provider credentials from environment variables only. Keep provider-specific SDK translation inside adapters and do not implement Asset/Publication semantics yet. Implement at least one real provider adapter with conformance tests.
```

**Expected result**

Extension-owned direct provider calls use one repository-local runtime.

**Verify before continuing**

Run adapter conformance tests through the implementation environment.

### Step 2 — Implement provider/task configuration

**References:** Provider/Generation provenance §15

**Run**

```text
Implement .pactwright/review-creative/providers and tasks configuration, eligible provider/model sets and default selection. Adding a provider must require adapter + conformance tests + Provider Definition + task eligibility, not Review engine changes.
```

**Expected result**

Provider/model eligibility is explicit and project-configurable.

**Verify before continuing**

Run a mock second-adapter conformance fixture.

### Step 3 — Implement immutable Generation Records

**References:** Provider/Generation provenance §16

**Run**

```text
Implement one immutable Generation Record for every extension-owned provider call, recording caller, provider/model/capability/task, graph revision, prompt hash, guidance/grounding, usage/cost/latency, status and output hash/error. Failed/refused calls are recorded; records are execution provenance, not graph nodes. Guidance arrays may be empty until Checkpoint 5 implements guidance resolution; the schema must still carry the guidance fields.
```

**Expected result**

Provider calls are traceable without polluting normal Project Graph traversal.

**Verify before continuing**

Run success/failure/refusal fixtures and inspect graph revision/traversal exclusions.

## Stage 2 — Build the generic Graph Review engine

Implement definition-driven review over the registered graph.

### Step 4 — Implement Review Definition loading/validation

**References:** Review boundary/engine/roster §6.1

**Run**

```text
Implement Review Definition loading/validation for stable id/version, perspective, graph scope, rubric, trigger, task class, steward and optional secondary model. Definitions are configuration, not graph nodes.
```

**Expected result**

Projects can add reviewer perspectives without new graph semantics.

**Verify before continuing**

Run valid/invalid definition fixtures.

### Step 5 — Implement extension-aware scope resolution

**References:** Review boundary/engine/roster §6.2

**Run**

```text
Implement review scope resolution from the registered Project Graph schema. graph: project must include compatible enabled-extension canonical state without hard-coded extension names. Allow narrowing by subgraph/node type/domain/relationship/lineage/report/execution when explicitly configured.
```

**Expected result**

The Review engine automatically understands future registered graph types.

**Verify before continuing**

Add a fixture future extension node type and prove a project-wide scope sees it.

### Step 6 — Implement Review Execution and `review run`

**References:** Review boundary/engine/roster §6.3

**Run**

```text
Implement immutable Review Execution and pactwright review run <review-id>. Resolve the current core Project Graph revision, resolved scope/configuration, invoke graph-review, record execution status/findings/generation records, and print the Review Execution id. Failed runs record provenance but emit no accepted truth.
```

**Expected result**

Every review is pinned to deterministic graph/configuration inputs.

**Verify before continuing**

Run a fixture Review Definition end to end through the implementation environment, inspect the Review Execution record, and confirm executions are excluded from normal Project Graph traversal/context.

### Step 7 — Implement findings → PI internal Sources

**References:** Review boundary/engine/roster §6.4; Finding governance §14

**Run**

```text
Implement review Finding records inside Review Execution and hand every successful finding into Project Intelligence as an internal Source, printing the internal Source id created for each finding. Review ends at the finding and cannot edit Knowledge, Intents, Decisions, Contracts, Briefs, Assets, Publications, Deployments or Observations.
```

**Expected result**

Review proposes; PI governs consequence.

**Verify before continuing**

Run a fixture where Review attempts direct Knowledge mutation and require rejection.

### Step 8 — Implement historical/current rerun

**References:** Review boundary/engine/roster §6.3; Commands/validation/build order §§19, 22

**Run**

```text
Implement pactwright review rerun <execution-id> using the recorded pinned graph revision and resolved configuration by default; fail if those inputs cannot be resolved. Implement --current as the explicit latest-state rerun.
```

**Expected result**

Historical review does not silently drift to current state.

**Verify before continuing**

Run one historical rerun and one `--current`; compare recorded input revisions.

### Step 9 — Ship the complete standard reviewer roster

**References:** Review boundary/engine/roster §7

**Run**

```text
Add Review Definitions for ux-researcher, product-strategist, gtm-strategist, architecture-reviewer, graph-auditor, voice-auditor, cost-reviewer, generation-reviewer and progression-reviewer. Map multiple definitions to the generic graph-review capability unless evaluation justifies specialised agents.
```

**Expected result**

The full initial roster exists without one bespoke engine per reviewer.

**Verify before continuing**

Run `pnpm build`, then `pactwright review roster` in a fixture project and confirm all nine definitions load.

### Step 10 — Implement progression next-actions

**References:** Review boundary/engine/roster §8

**Run**

```text
Implement progression-reviewer and pactwright review next-actions, generating docs/review-creative/reports/next-actions.md as a derived recommendation view over onboarding/roadmap/lifecycle/review state. It must not become another roadmap or create graph nodes.
```

**Expected result**

Pactwright can recommend the next useful command without duplicating PI roadmap/lifecycle.

**Verify before continuing**

Run `pactwright review next-actions` on fixtures with a known onboarding gap and stalled lifecycle.

## Stage 3 — Package and project Graph Review

Wire capabilities into Distribution and GitHub.

### Step 11 — Complete review-creative extension registration

**References:** Distribution §§4–7; Review boundary/engine/roster §4

**Run**

```text
Create/complete `@pactwright/review-creative` as a publishable workspace package and implement its manifest/dependency registration for Graph Review: require Project Intelligence, register review namespace/capabilities/configuration/GitHub profile, and register the complete §4 manifest including the `asset`/`publication` node types and `produces`/`grounded-in`/`publishes` edge types — their record semantics and validation arrive in Checkpoint 5 (see the out-of-scope block). Do not depend on Operations.
```

**Expected result**

Distribution can install the extension and validate capability union/dependency graph.

**Verify before continuing**

Use a fixture add/remove test and confirm PI resolves automatically and Operations is not required.

### Step 12 — Implement the creative agent-pack package

**References:** Distribution §7

**Run**

```text
Implement `@pactwright/creative` as a publishable first-party agent-pack workspace package using the exact capability mapping defined by Distribution §7. Keep the package replaceable through the existing agent-pack interface; do not move graph or lifecycle semantics into the pack.
```

**Expected result**

`@pactwright/creative` is a real installable agent-pack package that can satisfy the Review & Creative capability requirements.

**Verify before continuing**

Run the agent-pack compatibility fixtures against `@pactwright/creative` and confirm its package build/prepack succeeds.

### Step 13 — Implement review-scope extension validation

**References:** Commands/validation/build order §21 (items 1–8, 15)

**Run**

```text
Implement `pactwright creative validate` and extension validation for the review/generation scope shipped in this checkpoint: Review Definition validity; Review Execution definition-hash and graph-revision references; finding → execution/supporting-record references; findings from successful reviews entering Project Intelligence through Source ingestion rather than direct canonical mutation; Generation Record provider/model/task eligibility; output hashes for successful Generation Records; guidance version/hash checks that tolerate empty guidance until Checkpoint 5; and deterministic Project Graph revision identification for generated reports. Do not implement Asset/Publication validation (§21 items 9–14, 16–17); fail closed if such records appear before Checkpoint 5. Allow core `pactwright validate` to invoke this extension validation when enabled.
```

**Expected result**

`creative validate` enforces the review/generation subset of §21 before any later step invokes it.

**Verify before continuing**

Run valid and invalid review/generation fixtures; invalid fixtures must fail without graph mutation.

### Step 14 — Implement Review GitHub workflow/summaries/views

**References:** GitHub review surface §§7, 22

**Run**

```text
Implement generated pactwright-review-creative.yml Review automation, extension validation, Review summaries, Reviews view and Next Actions view. A headless review may create or update a Pactwright-managed branch or pull request containing the resulting internal Sources and must not create Intents, reorder the roadmap or change Knowledge Cards. Reference required provider credentials as GitHub Actions secrets in the generated workflow. GitHub links to execution/findings/Sources but cannot promote them.
```

**Expected result**

Review can run remotely without GitHub becoming the Review store/knowledge authority.

**Verify before continuing**

Run `pactwright sync` and `github sync --dry-run` in a fixture project; inspect Review-owned contributions.

## Stage 4 — Adopt Graph Review in Pactwright

Run this stage from the Pactwright repository root.

Use real reviews on Pactwright immediately.

### Step 15 — Select the creative-capable pack and install Review & Creative

**References:** Distribution §§4, 7

**Run**

The `0.0.4` registry versions do not exist yet, so install workspace-linked packages; Stage 6 repins these devDependencies to the published `0.0.4` after release:

```bash
pnpm add -D --workspace \
  pactwright \
  @pactwright/project-intelligence \
  @pactwright/review-creative \
  @pactwright/creative
pnpm install

pnpm pactwright agent-pack use @pactwright/creative
pnpm pactwright extension add review-creative
pnpm pactwright sync
pnpm pactwright creative validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

**Expected result**

Pactwright has Review capability and all required PI dependencies.

**Verify before continuing**

Run `pnpm pactwright review roster` and `pnpm pactwright validate`.

### Step 16 — Run the first Pactwright specialist reviews

**References:** Review boundary/engine/roster §§6–8

**Run**

Export the provider credentials required by the enabled review task configuration as environment variables (spec §18), then:

```bash
pnpm pactwright review run architecture-reviewer
pnpm pactwright review run graph-auditor
pnpm pactwright review run product-strategist
pnpm pactwright review next-actions
```

**Expected result**

Real Review Executions/findings/internal Sources are produced.

**Run**

For each internal Source id printed by the review commands:

```bash
pnpm pactwright intelligence triage <source-id>

# only when triage requires reviewed promotion and the proposal is accepted
pnpm pactwright intelligence promote <source-id>
```

Then:

```bash
pnpm pactwright intelligence derive-intent-roadmap
```

**Verify before continuing**

Each finding remains Review-owned provenance until its Source is governed by PI; no Review command directly mutates Knowledge or Delivery.

### Step 17 — Deliver one review-driven Pactwright correction

**References:** PI §§8, 11; Delivery Graph §19

**Run**

```text
/capture-intent "<accepted Pactwright correction motivated by Review>"
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Expected result**

A review finding affects the project only after PI governance and normal Delivery.

**Verify before continuing**

Trace Review Execution → Finding → Source → accepted meaning/candidate → Intent → Evidence.

### Step 18 — Prove historical replay semantics

**References:** Review boundary/engine/roster §6.3; Commands/validation/build order §§19, 22

**Run**

```bash
pnpm pactwright review rerun <execution-id>
pnpm pactwright review rerun <execution-id> --current
```

**Expected result**

Default uses pinned historical inputs; `--current` uses current graph state.

**Verify before continuing**

Inspect the two Review Executions and confirm input revision/configuration differences are explicit.

## Stage 5 — Review and advance the public product

### Step 19 — Review the existing Pactwright public corpus

**References:** Review boundary/engine/roster §§6–8; Open-Source Project Organisation §§1.1–1.3

**Run**

From the Pactwright repository root:

```bash
pnpm pactwright review run product-strategist
pnpm pactwright review run gtm-strategist
pnpm pactwright review run graph-auditor
pnpm pactwright review next-actions
```

Triage every supported public-content finding through Project Intelligence:

```bash
pnpm pactwright intelligence triage <source-id>

# when reviewed promotion is required and accepted
pnpm pactwright intelligence promote <source-id>
```

**Expected result**

The existing README/Docs/Academy/Examples/Website corpus is reviewed against current graph truth, product strategy, positioning and content-alignment Knowledge. `voice-auditor` is deferred until Assets exist (see the out-of-scope block).

**Verify before continuing**

Every accepted correction routes through PI; reviewers do not directly rewrite public content.

### Step 20 — Publish the Graph Review learning path

**References:** Open-Source Project Organisation §1.3; Review boundary/engine/roster §§6–8

**Run**

```text
/capture-intent "Publish Pactwright's Graph Review learning path: concise Graph Review documentation, one review workflow example, and an Academy Review & Improvement lesson. Use accepted Project Intelligence context and address accepted public-corpus review findings that are in scope."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

Then rerun the relevant reviewer(s) on current state.

**Expected result**

The newly available review capability improves both Pactwright's implementation and how Pactwright explains itself.

**Verify before continuing**

Blocking review findings are resolved or explicitly deferred through normal graph Decisions; public material remains consistent with accepted Knowledge.

## Stage 6 — Release `0.0.4`

### Step 21 — Prepare, publish and tag `0.0.4`

**References:** Pactwright — Implementation Guide, "npm release model"; Distribution §§6, 18

**Run**

Update `CHANGELOG.md` from accepted Checkpoint 4 Evidence only, then create the release PR:

```bash
VERSION=0.0.4
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
```

The following package names are new in this release and cannot use trusted publishing until their first registry version exists:

- `@pactwright/review-creative`
- `@pactwright/creative`

After the release PR is merged, bootstrap only those new packages interactively:

```bash
pnpm --filter @pactwright/review-creative publish --dry-run --tag next --access public
pnpm --filter @pactwright/review-creative publish --tag next --access public
pnpm --filter @pactwright/creative publish --dry-run --tag next --access public
pnpm --filter @pactwright/creative publish --tag next --access public

REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"

npx -y npm@^11.15 trust github @pactwright/review-creative \
  --repo "$REPO" \
  --file release.yml \
  --environment npm-release \
  --allow-publish

npx -y npm@^11.15 trust github @pactwright/creative \
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

The tag-triggered trusted `release.yml` workflow verifies the exact merged source and publishes every still-unpublished package in the `0.0.4` family under `next`. Existing published members are not overwritten.

**Verify before continuing**

Confirm the `release.yml` run for `v0.0.4` succeeded, then:

```bash
pnpm view pactwright@0.0.4 version
pnpm view @pactwright/standard@0.0.4 version
pnpm view @pactwright/project-intelligence@0.0.4 version
pnpm view @pactwright/review-creative@0.0.4 version
pnpm view @pactwright/creative@0.0.4 version
```

Every command must return `0.0.4`.

For the newly introduced package(s), also run:

```bash
npx -y npm@^11.15 trust list @pactwright/review-creative
npx -y npm@^11.15 trust list @pactwright/creative
```

Existing package-family members must show npm provenance/trusted-publisher metadata; the newly bootstrapped package(s) must now trust `release.yml` for the next release.

Then replace the Stage 4 workspace links with the published versions and confirm the project remains valid:

```bash
pnpm add -D \
  pactwright@0.0.4 \
  @pactwright/project-intelligence@0.0.4 \
  @pactwright/review-creative@0.0.4 \
  @pactwright/creative@0.0.4
pnpm install --frozen-lockfile
pnpm pactwright validate
```

## Stage 7 — Prove Graph Review on Kakeibo

Run this stage from the Kakeibo repository root unless a step explicitly says otherwise.

Use specialist review to find cross-spec inconsistencies in the complete current Kakeibo system.

### Step 22 — Install Review & Creative in Kakeibo

**References:** Distribution §§4, 6–7, 15; Kakeibo Acceptance Profile §8

**Run**

```bash
pnpm add -D \
  pactwright@0.0.4 \
  @pactwright/project-intelligence@0.0.4 \
  @pactwright/review-creative@0.0.4 \
  @pactwright/creative@0.0.4
pnpm install --frozen-lockfile

pnpm pactwright extension upgrade project-intelligence
pnpm pactwright agent-pack use @pactwright/creative
pnpm pactwright extension add review-creative
pnpm pactwright sync
pnpm pactwright creative validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

**Expected result**

Kakeibo has the same Review engine and standard roster, operating over the PI state established from the complete authority set in Checkpoint 3.

**Verify before continuing**

Run `pnpm pactwright review roster`, `pnpm pactwright intelligence validate` and `pnpm pactwright validate`.

### Step 23 — Run the complete cross-owner Kakeibo review

**References:** current Kakeibo `docs/specs/README.md` and specs `01`–`07`; Kakeibo Acceptance Profile §§3–8; Review boundary/engine/roster §7

**Run**

```bash
pnpm pactwright review run product-strategist
pnpm pactwright review run ux-researcher
pnpm pactwright review run architecture-reviewer
pnpm pactwright review run graph-auditor
```

The combined review must cover at least this cross-owner matrix:

```text
02 Financial Domain ↔ 01 Product & UX
01 Product & UX ↔ 04 Mobile Design
03 Kei behaviour ↔ 02 Financial truth
03 Kei behaviour ↔ 05 Kei runtime architecture
03 Kei behaviour ↔ 06 Kei release/evaluation/operations
05 System Architecture ↔ 06 Engineering/Operations
05 System Architecture ↔ 07 Open-source/public-private boundary
06 Kei release/evaluation ↔ 07 public evaluation/transparency
01 Product/commercial semantics ↔ 07 public surfaces
```

The index must also be checked against all seven owners for stale ownership/conflict-resolution claims.

Reviewer attention must explicitly include these failure classes:

```text
financial / review truth:
  spending-only assumptions leaking back into FinancialEntry
  preparation states treated as reviewed truth
  rules/history/Kei suggestions creating reviewed truth
  transfer/card/business/goal semantics double-counting
  provider/source lifecycle treated as review state

Kei authority / runtime:
  Kei recalculating or redefining canonical financial values
  model-selected tasks bypassing app-selected task contracts
  optional skills/tools/subagents expanding authority
  ad-hoc prompts bypassing versioned policy/persona/task/output contracts
  model-route changes treated as behavioural-release changes or vice versa
  dashboard configuration becoming hidden production behaviour

security / prompt injection:
  merchant descriptions, CSV fields, provider labels or bank references treated as trusted instructions
  untrusted source text reaching system/tool authority without containment

architecture / privacy:
  mobile/private clients accessing Neon directly
  financial domain state, audit history, product/marketing analytics and operational telemetry being conflated
  raw financial prompts/responses/traces becoming public or retained merely for observability
  Meta receiving mobile/product financial behaviour rather than allowlisted consented marketing conversions

maturity / over-engineering:
  planned Salt Edge represented as current implementation
  persistent memory, autonomous tools, dynamic skills, subagents or general-purpose Ask Kei pulled into the initial runtime without evidence
  product-specific Kei artefacts promoted into Pactwright graph semantics
```

**Expected result**

Graph Review tests the seven-owner system as a coherent design while preserving each owner's authority and produces supported findings for real contradictions, omissions or unsafe boundary crossings.

**Run**

For every internal Source id printed by the reviews:

```bash
pnpm pactwright intelligence triage <source-id>

# only when triage requires reviewed promotion and the proposal is accepted
pnpm pactwright intelligence promote <source-id>
```

Then:

```bash
pnpm pactwright intelligence derive-intent-roadmap
```

**Verify before continuing**

- every accepted correction candidate traces to a supported Review finding and PI Source;
- Review did not directly rewrite any Kakeibo spec, Knowledge Card, Delivery node or application state;
- owner attribution for every finding points to the relevant current specs rather than obsolete August documents;
- disagreements caused only by one spec owning a different concern are not misclassified as contradictions;
- findings distinguish actual current defects from planned/future/open design choices;
- no reviewer recommendation weakens explicit financial truth, privacy, advice or user-confirmation boundaries.

### Step 24 — Deliver one accepted Kakeibo correction through the owning specs

**References:** PI §§8, 11; Delivery Graph §19; current Kakeibo authority map and affected owning specs

**Run**

Choose one supported, accepted cross-owner finding from Step 23. The Delivery must update the owning specification(s) and, when required, dependent integration wording without creating a second source of truth.

```text
/capture-intent "<accepted Kakeibo correction motivated by Graph Review, naming the affected owner boundary and desired coherent outcome>"
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

After Delivery, rerun the reviewer(s) that produced or validate the finding:

```bash
pnpm pactwright review rerun <execution-id> --current
pnpm pactwright intelligence validate
pnpm pactwright validate
```

**Expected result**

One real seven-owner coherence finding completes the full governed correction path:

```text
Review Execution
→ Finding
→ PI internal Source
→ triage / accepted meaning
→ roadmap candidate
→ explicit Intent
→ normal Delivery
→ corrected owner/dependent specs
→ current-state Review
```

**Verify before continuing**

Trace the finding provenance end to end, run all Kakeibo tests relevant to any implementation change, and verify:

- the correction was made in the semantic owner rather than duplicated elsewhere;
- dependent specs integrate the corrected meaning without taking ownership;
- `docs/specs/README.md` remains consistent with the resulting authority map;
- the rerun no longer reports the corrected contradiction, or reports it as explicitly unresolved with evidence rather than silently treating it as fixed.

## Stage 8 — Capture checkpoint feedback as product evidence

Run this stage from the Pactwright repository root.

Per Implementation Principles §§7 ("Learn") and 14, problems found during adoption and installation become future project work.

### Step 25 — Ingest Checkpoint 4 installation/usage findings

**References:** Implementation Principles §§7, 14; Finding governance §§8, 11

**Run**

Capture every material problem found while adopting Graph Review in Pactwright (Stages 4–5) and installing it in Kakeibo (Stage 7): defects, unclear commands, missing capabilities, context/owner-selection errors, false-positive contradictions and documentation gaps. Distinguish Kakeibo-specific choices from evidence that a Pactwright responsibility failed; only the latter become Pactwright product candidates.

```bash
pnpm pactwright intelligence ingest <finding-or-feedback-source>
pnpm pactwright intelligence triage <source-id>

# only when triage requires reviewed promotion and the proposal is accepted
pnpm pactwright intelligence promote <source-id>

pnpm pactwright intelligence derive-intent-roadmap
```

**Expected result**

Checkpoint 4 friction is durable Project Intelligence evidence and, where justified, roadmap candidates.

**Verify before continuing**

Each ingested finding traces to a Source; accepted candidates appear in the derived intent roadmap. Kakeibo-specific preferences or product implementation details are not generalised into Pactwright Review semantics without repeatable evidence.

## Exit gate

- **Stage 1** — Provider Runtime, provider/task configuration and immutable Generation Records exist, with bounded retries, at least one conformance-tested adapter and environment-variable credential handling.
- **Stage 2** — Review Definitions are configuration, project-wide scope is extension-aware, Review Executions are pinned/replayable and excluded from normal traversal, failed reviews emit no truth, every successful finding enters PI as an internal Source, and the full nine-reviewer roster plus `next-actions` run through one generic engine.
- **Stage 3** — `@pactwright/review-creative` and `@pactwright/creative` are installable packages, `creative validate` enforces the review/generation subset of §21, and the generated GitHub workflow, checks and views run reviews headlessly with secret-based credentials and without promoting findings.
- **Stage 4** — Pactwright adopted Graph Review and delivered at least one review-driven correction through normal governance; historical and `--current` reruns behave as specified.
- **Stage 5** — The public corpus was reviewed and the Graph Review learning path published through governed Delivery.
- **Stage 6** — `0.0.4` is published and registry-verified, trusted publishing is configured for the newly bootstrapped packages, and Pactwright is repinned to the published versions.
- **Stage 7** — Kakeibo installed the same release; Graph Review covered `README + 01–07` through the required cross-owner matrix; financial/review truth, Kei authority/runtime, prompt-injection, architecture/privacy and maturity/over-engineering failure classes were explicitly checked; and at least one accepted finding completed Review → PI → Delivery → current-state rerun without Review directly changing project truth.
- **Stage 8** — Checkpoint friction was ingested as Project Intelligence evidence, with Kakeibo-specific preferences kept separate from generic Pactwright responsibility failures.

---

**Pactwright — Checkpoint 4 — Graph Review v10**
