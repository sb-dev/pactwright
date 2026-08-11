# Pactwright — Checkpoint 4 — Graph Review

**Version:** 3 
**Entry condition:** Checkpoint 3 is accepted. 
**Exit capability:** Pactwright can run reproducible specialist Graph Reviews over the registered Project Graph and route findings through PI.

## 1. Goal

Implement Review execution infrastructure, the generic Review engine and full standard roster; then review Pactwright and Kakeido and turn at least one finding in each into governed corrected Delivery.

## 2. Specification baseline

- `Pactwright — Delivery Graph and Lifecycle Engineering Spec v5`
- `Pactwright — Distribution, Agents and Evaluation v5`
- `Pactwright — GitHub Actions and Views v5`
- `Pactwright — Project Intelligence Graph Engineering Spec v3`
- `Pactwright — Graph Review & Creative Delivery Engineering Spec v3`
- `Pactwright — Operations Graph Engineering Spec v1`
- `Pactwright — System Architecture v2`
- `Pactwright — Implementation Principles v1`
- `Pactwright Open-Source Project Organisation`
- `Pactwright website engineering/design specification`
- `Kakeido — Financial Model Spec v1`
- `Kakeido — Product & UX Spec v2`
- `Kakeido — Mobile Design Spec v1`
- `Kei — Assistant Spec v2`
- `Kakeido — Tech Stack Engineering Spec v1`

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

## 4. Checkpoint specification map

- **Review boundary/engine/roster** — Review & Creative v3 §§1–8
- **Provider/Generation provenance** — Review & Creative §§14–16
- **Commands/validation/build order** — Review & Creative §§19, 21–24
- **Finding governance** — PI §§8, 14–17
- **GitHub review surface** — GitHub §§7, 22

## Stage 1 — Build provider execution provenance required by Review

Establish extension-owned provider execution before Review depends on it.

### Step 1 — Implement Provider Runtime interface/error model

**References:** Review & Creative §14

**Run**

```text
Using self-hosted Delivery, implement the Review & Creative ProviderRuntime interface and normalised auth/rate-limit/content-policy/transient/permanent errors. Keep provider-specific SDK translation inside adapters and do not implement Asset/Publication semantics yet.
```

**Expected result**

Extension-owned direct provider calls use one repository-local runtime.

**Verify before continuing**

Run adapter conformance tests.

### Step 2 — Implement provider/task configuration

**References:** Review & Creative §15

**Run**

```text
Implement .pactwright/review-creative/providers and tasks configuration, eligible provider/model sets and default selection. Adding a provider must require adapter + conformance tests + Provider Definition + task eligibility, not Review engine changes.
```

**Expected result**

Provider/model eligibility is explicit and project-configurable.

**Verify before continuing**

Run a mock second-adapter conformance fixture.

### Step 3 — Implement immutable Generation Records

**References:** Review & Creative §16

**Run**

```text
Implement one immutable Generation Record for every extension-owned provider call, recording caller, provider/model/capability/task, graph revision, prompt hash, guidance/grounding, usage/cost/latency, status and output hash/error. Failed/refused calls are recorded; records are execution provenance, not graph nodes.
```

**Expected result**

Provider calls are traceable without polluting normal Project Graph traversal.

**Verify before continuing**

Run success/failure/refusal fixtures and inspect graph revision/traversal exclusions.

## Stage 2 — Build the generic Graph Review engine

Implement definition-driven review over the registered graph.

### Step 4 — Implement Review Definition loading/validation

**References:** Review & Creative §6.1

**Run**

```text
Implement Review Definition loading/validation for stable id/version, perspective, graph scope, rubric, trigger, task class, steward and optional secondary model. Definitions are configuration, not graph nodes.
```

**Expected result**

Projects can add reviewer perspectives without new graph semantics.

**Verify before continuing**

Run valid/invalid definition fixtures.

### Step 5 — Implement extension-aware scope resolution

**References:** Review & Creative §6.2

**Run**

```text
Implement review scope resolution from the registered Project Graph schema. graph: project must include compatible enabled-extension canonical state without hard-coded extension names. Allow narrowing by subgraph/node type/domain/relationship/lineage/report/execution when explicitly configured.
```

**Expected result**

The Review engine automatically understands future registered graph types.

**Verify before continuing**

Add a fixture future extension node type and prove a project-wide scope sees it.

### Step 6 — Implement Review Execution and `review run`

**References:** Review & Creative §6.3

**Run**

```text
Implement immutable Review Execution and pactwright review run <review-id>. Resolve the current core Project Graph revision, resolved scope/configuration, invoke graph-review, record execution status/findings/generation records. Failed runs record provenance but emit no accepted truth.
```

**Expected result**

Every review is pinned to deterministic graph/configuration inputs.

**Verify before continuing**

After installation, run architecture-reviewer and inspect the Review Execution record.

### Step 7 — Implement findings → PI internal Sources

**References:** Review & Creative §6.4; PI §14

**Run**

```text
Implement review Finding records inside Review Execution and hand every successful finding into Project Intelligence as an internal Source. Review ends at the finding and cannot edit Knowledge, Intents, Decisions, Contracts, Briefs, Assets, Publications, Deployments or Observations.
```

**Expected result**

Review proposes; PI governs consequence.

**Verify before continuing**

Run a fixture where Review attempts direct Knowledge mutation and require rejection.

### Step 8 — Implement historical/current rerun

**References:** Review & Creative §§6.3, 19, 22

**Run**

```text
Implement pactwright review rerun <execution-id> using the recorded pinned graph revision and resolved configuration by default; fail if those inputs cannot be resolved. Implement --current as the explicit latest-state rerun.
```

**Expected result**

Historical review does not silently drift to current state.

**Verify before continuing**

Run one historical rerun and one `--current`; compare recorded input revisions.

### Step 9 — Ship the complete standard reviewer roster

**References:** Review & Creative §7

**Run**

```text
Add Review Definitions for ux-researcher, product-strategist, gtm-strategist, architecture-reviewer, graph-auditor, voice-auditor, cost-reviewer, generation-reviewer and progression-reviewer. Map multiple definitions to the generic graph-review capability unless evaluation justifies specialised agents.
```

**Expected result**

The full initial roster exists without one bespoke engine per reviewer.

**Verify before continuing**

Run `pnpm pactwright review roster` after installation and confirm all nine definitions.

### Step 10 — Implement progression next-actions

**References:** Review & Creative §8

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

**References:** Distribution §§4–7; Review & Creative §4

**Run**

```text
Complete @pactwright/review-creative manifest/dependency registration for Graph Review: require Project Intelligence, register review namespace/capabilities/configuration/GitHub profile, but do not depend on Operations.
```

**Expected result**

Distribution can install the extension and validate capability union/dependency graph.

**Verify before continuing**

Use a fixture add/remove test and confirm PI resolves automatically and Operations is not required.

### Step 12 — Implement Review GitHub workflow/summaries/views

**References:** GitHub §§7, 22

**Run**

```text
Implement generated pactwright-review-creative.yml Review automation, extension validation, Review summaries, Reviews view and Next Actions view. GitHub links to execution/findings/Sources but cannot promote them.
```

**Expected result**

Review can run remotely without GitHub becoming the Review store/knowledge authority.

**Verify before continuing**

Run `pactwright sync` and `github sync --dry-run`; inspect Review-owned contributions.

## Stage 4 — Adopt Graph Review in Pactwright

Use real reviews on Pactwright immediately.

### Step 13 — Select the creative-capable pack and install Review & Creative

**References:** Distribution §§4, 7

**Run**

```bash
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

### Step 14 — Run the first Pactwright specialist reviews

**References:** Review & Creative §§6–8

**Run**

```bash
pnpm pactwright review run architecture-reviewer
pnpm pactwright review run graph-auditor
pnpm pactwright review run product-strategist
pnpm pactwright review next-actions
```

**Expected result**

Real Review Executions/findings/internal Sources are produced.

**Verify before continuing**

Triage each resulting Source; promote only when required; regenerate PI roadmap.

### Step 15 — Deliver one review-driven Pactwright correction

**References:** PI §§8, 11; Delivery §19

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

### Step 16 — Prove historical replay semantics

**References:** Review & Creative §§6.3, 19, 22

**Run**

```bash
pnpm pactwright review rerun <execution-id>
pnpm pactwright review rerun <execution-id> --current
```

**Expected result**

Default uses pinned historical inputs; `--current` uses current graph state.

**Verify before continuing**

Inspect the two Review Executions and confirm input revision/configuration differences are explicit.

## Stage 5 — Prove Graph Review on Kakeido

Use specialist review to find cross-spec inconsistencies in a real unrelated project.

### Step 17 — Install Review & Creative in Kakeido

**References:** Distribution §§4, 7

**Run**

```bash
pnpm add -D pactwright@<checkpoint-version>
pnpm pactwright agent-pack use @pactwright/creative
pnpm pactwright extension add review-creative
pnpm pactwright sync
pnpm pactwright creative validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

**Expected result**

Kakeido has the same Review engine and standard roster.

**Verify before continuing**

Run `pnpm pactwright review roster`.

### Step 18 — Run cross-spec Kakeido reviews

**References:** Kakeido specs; Review & Creative §7

**Run**

```bash
pnpm pactwright review run product-strategist
pnpm pactwright review run ux-researcher
pnpm pactwright review run architecture-reviewer
pnpm pactwright review run graph-auditor
```

**Expected result**

Reviews inspect Financial Model ↔ Product/UX, Product/UX ↔ Mobile, Kei ↔ Financial Model, Tech Stack ↔ product requirements.

**Verify before continuing**

Inspect findings for explicit supporting nodes; route each through `intelligence triage`.

### Step 19 — Deliver one accepted Kakeido correction

**References:** PI §§8, 11; Delivery §19

**Run**

```bash
pnpm pactwright intelligence derive-intent-roadmap
```

**Run**

```text
/capture-intent "<accepted Kakeido correction motivated by Review>"
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Expected result**

One real cross-spec finding completes the full governed correction path.

**Verify before continuing**

Trace finding provenance end-to-end and run all relevant Kakeido tests.

## Exit gate

Review Definitions are configuration, project-wide scope is extension-aware, Review Executions are pinned/replayable, failed reviews emit no truth, every successful finding enters PI, and at least one Pactwright and one Kakeido finding become corrected Delivery through normal governance.

---

**Pactwright — Checkpoint 4 — Graph Review v3**
