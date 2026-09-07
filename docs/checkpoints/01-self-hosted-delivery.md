# Pactwright — Checkpoint 1 — Self-Hosted Delivery

**Version:** 14  
**Entry condition:** No installable Pactwright runtime exists.  
**Release:** `0.0.1`  
**Exit capability:** Pactwright is installable, upgradeable, can govern one complete Contract-driven Delivery in its own repository and in Kakeido, can compare an Agent Pack candidate against a released baseline, and requires no manual Project Graph coherence work.

## 1. Goal

Bootstrap the smallest installable Pactwright core, prove it in a clean consumer, adopt it in Pactwright, publish `0.0.1`, then install the same release in Kakeido and complete one real external Delivery.

Checkpoint 1 also establishes the complete core distribution surface needed by later checkpoints: compositional one-shot initialisation, runtime upgrade, Agent Pack upgrade and released-baseline evaluation.

This is the only checkpoint whose implementation begins before Pactwright can govern its own work.

## 2. Canonical baseline

Canonical Pactwright semantics come from:

- [01 — Core System and Lifecycle](../specs/01-pactwright-core-system-and-lifecycle.md)
- [02 — Distribution, Agent Packs, Extensions and Evaluation](../specs/02-distribution-agent-packs-extensions-and-evaluation.md)
- [08 — Open-Source Project Organisation](../specs/08-open-source-project-organisation.md)
- [Implementation Principles](./00-implementation-principles.md)
- [Implementation Guide](./00-implementation-guide.md)

Research logs are rationale only.

Kakeido acceptance uses the current canonical Kakeido specifications in the Kakeido repository. Do not use stale copies embedded in Pactwright as authority.

This runbook defines implementation order, not new Pactwright semantics.

## 3. Execution contract

Every implementation action follows:

```text
Step
→ References
→ Run
→ Expected result
→ Verify before continuing
```

For repository/code changes, finish with `pnpm verify`.

Once a deterministic Pactwright responsibility exists, use the runtime rather than asking an agent to emulate it.

## 4. Checkpoint scope

Checkpoint 1 implements:

```text
Core Project Graph semantics
Contract authority
initial direct Delivery shape
lifecycle execution policy and Gates
runtime validation
Project Graph revision
repository revision resolution
Agent Pack capability resolution
@pactwright/standard
Claude Code adapter
exact environment locking
pactwright init / sync / validate / doctor / eval
one-shot init composition
pactwright upgrade / pactwright upgrade --to
Agent Pack selection and agent-pack upgrade
Pactwright Extension package/dependency framework
baseline evaluation and regression reporting
clean-consumer installation
Pactwright self-hosting
first Kakeido Delivery
```

The initial built-in fulfilment shape is:

```text
Brief
→ Delivery
→ Review
→ Evidence
```

Contract crafting and authorisation remain the stable authority spine around that fulfilment shape.

Checkpoint 1 must not turn adapter responsibilities such as capture-intent or write-brief into a fixed lifecycle topology.

### Explicitly out of scope

- GitHub provisioning, managed product workflows, Projects and remote projections: Checkpoint 2.
- Project Intelligence, Graph Review, Assets / Publication and Operations semantics: later checkpoints.
- historical environment retention/reacquisition machinery: identity and fail-explicitly semantics are implemented, archival strategy is not.
- lifecycle-shape hashing or a universal lifecycle-shape persistence scheme: still unresolved.

## Stage 1 — Build the canonical Project Graph substrate

### Step 1 — Create the runtime/package foundation

**References:** Specs 01–02; Implementation Guide engineering baseline.

**Run**

```text
Create the Pactwright runtime and CLI package foundation.

Implement one canonical loader for Pactwright configuration, lifecycle configuration, .pactwright/lock.yml, core Project Graph records and typed edges.

Make the runtime publishable as `pactwright` with the repository's normal build/prepack/verify discipline and a repository-local `pnpm pactwright ...` path using the same built runtime.

Do not implement optional Extension semantics or GitHub provisioning.
```

**Expected result**

One buildable, testable and packable Pactwright runtime exists with one canonical loading path.

**Verify before continuing**

Run `pnpm verify`, pack the runtime and inspect the archive.

### Step 2 — Implement the five durable core Delivery record types

**References:** Spec 01 core Project Graph model.

**Run**

```text
Implement exactly:
- Intent
- Decision
- Contract
- Brief
- Evidence

Enforce canonical identity, immutability and type-specific validation.
Contract alternatives remain transient.
Delivery and Review executions remain execution provenance rather than core Project Graph record types.
```

**Expected result**

The runtime validates the complete core record set without inventing execution nodes.

**Verify before continuing**

Add positive/negative fixtures for every record type and identity mutation.

### Step 3 — Implement the shared typed-edge store

**References:** Spec 01 relationships and supersession.

**Run**

```text
Implement the shared typed-edge registry/store for core lineage and same-type supersession.
Validate endpoint existence/types, duplicate tuples, self-supersession and supersession cycles.
Keep the registry extensible for later Pactwright Extension relations.
```

**Expected result**

Core relationships are deterministic and extension-ready.

**Verify before continuing**

Run invalid endpoint/type, duplicate, self-supersession and cycle fixtures.

### Step 4 — Implement current-lineage and authority derivation

**References:** Spec 01 authority and supersession.

**Run**

```text
Derive current Delivery lineage from canonical graph structure.
Decision changes WHAT authorised outcome is current.
Gate state controls HOW execution continues and cannot substitute for Decision authority.
Do not store redundant derived lifecycle state.
```

**Expected result**

The runtime derives authoritative current lineage from Project Graph state.

**Verify before continuing**

Use proceed/reject/defer, supersession and ambiguous-lineage fixtures; invalid ambiguity fails closed.

### Step 5 — Implement repository and Project Graph revision identity

**References:** Spec 01 replay/revision semantics; Implementation Guide replay provenance.

**Run**

```text
Implement runtime-provided repository revision and deterministic Project Graph revision.
Project Graph revision includes registered canonical Pactwright state and excludes generated reports, adapter output, execution provenance, GitHub projections and other derived state.
Canonicalise ordering before hashing.
```

**Expected result**

Repository revision and Project Graph revision are stable, distinct identities.

**Verify before continuing**

Prove identical state gives identical graph revision; generated-file change does not; canonical mutation does.

## Stage 2 — Implement Contract-driven lifecycle execution

### Step 6 — Implement the initial direct lifecycle shape and execution policy

**References:** Spec 01 lifecycle shape, policy and Gate boundaries.

**Run**

```text
Implement the initial built-in direct fulfilment shape:
Brief → Delivery → Review → Evidence

Keep separate:
- Contract/Decision authority;
- lifecycle shape/topology;
- execution policy such as automatic/manual execution and human Gates.

Do not encode capture-intent, propose-contracts, approve-contract or write-brief as shape stages.
Do not add Deployment, Asset, Publication or Observation to the core lifecycle.
Do not invent lifecycle-shape hashes.
```

**Expected result**

The runtime represents the initial fulfilment topology without conflating it with Contract crafting or execution policy.

**Verify before continuing**

Test automatic/manual policy, Gate stopping and invalid shape/policy configuration.

### Step 7 — Implement authoritative core mutations

**References:** Spec 01 authority, graph mutation and supersession.

**Run**

```text
Implement runtime mutation responsibilities for Intent, Decision, selected Contract, Brief, Evidence, required edges and explicit supersession.
Contract alternatives remain transient until selection.
Approval/Gate state never auto-creates a Decision.
All mutations use plan → validate complete proposed state → atomic write → validate resulting state.
```

**Expected result**

Authorised paths produce valid canonical structures and failed mutation leaves no partial state.

**Verify before continuing**

Exercise authorised/unauthorised Decisions plus forced write/validation failure.

### Step 8 — Implement lifecycle status, next and run

**References:** Spec 01 lifecycle command surface.

**Run**

```text
Implement:
pactwright lifecycle status
pactwright lifecycle next
pactwright lifecycle run

Derive progression from current Contract/Brief lineage, resolved shape, policy, Gate state and repository state.
Run stops at human Gate, failure, validation error or completion.
```

**Expected result**

The runtime owns fulfilment progression.

**Verify before continuing**

Prove Gate/failure stopping and no next core fulfilment stage after current Evidence.

### Step 9 — Implement core validation and bounded context assembly

**References:** Spec 01 validation/context responsibilities.

**Run**

```text
Implement `pactwright validate` and the runtime context-assembly API consumed by Agent Packs/adapters.
Default Delivery context contains current relevant Contract/Brief lineage and excludes rejected alternatives, superseded state, execution transcripts and unrelated history unless explicitly required.
Keep a namespaced context-contribution seam for later Extensions.
Do not introduce `pactwright context` as a required public CLI contract.
```

**Expected result**

Agents receive bounded canonical Delivery context without reconstructing truth from chat history.

**Verify before continuing**

Test context assembly against multiple lineage states and verify exclusions.

## Stage 3 — Add replaceable AI execution

### Step 10 — Implement core capabilities and `@pactwright/standard`

**References:** Spec 02 capabilities and Agent Packs.

**Run**

```text
Implement:
- delivery-specification
- delivery-execution
- delivery-review

Create `@pactwright/standard` as a separate publishable Agent Pack package.
The pack maps capabilities to agents/prompts/skills but does not own graph or lifecycle semantics.
Do not make Pactwright semantics depend on this specific pack identity.
```

**Expected result**

Core AI responsibilities are replaceable and capability checked.

**Verify before continuing**

Test complete and incomplete fixture packs; incomplete selection leaves valid state intact.

### Step 11 — Implement Agent Pack selection and upgrade

**References:** Spec 02 Agent Pack selection and upgrade.

**Run**

```text
Implement:
pactwright agent-pack use <source>
pactwright agent-pack upgrade

`agent-pack use` resolves a compatible complete pack, validates all required capabilities, updates configuration only after success, locks exact identity, runs sync and reports later GitHub reconciliation needs.
Never silently switch packs.

`agent-pack upgrade` upgrades the currently selected pack within its configured compatibility constraints without changing Agent Pack identity.
It validates the complete required capability set before changing the current lock or generated environment.
Failure leaves the previous valid configuration, lock and generated environment intact.
```

**Expected result**

Projects explicitly select one complete Agent Pack and can upgrade it independently from the runtime.

**Verify before continuing**

Select standard, switch to a compatible fixture pack, reject an incompatible pack without state loss, upgrade a selected fixture pack to a compatible newer version, then reject an incompatible upgrade while preserving the previous valid environment.

### Step 12 — Implement the initial Claude Code adapter

**References:** Specs 01–02 adapter boundary.

**Run**

```text
Render deterministic Pactwright-managed Claude Code agents/commands for useful responsibilities around Intent, Contract alternatives/selection, Brief, Delivery, Review and Evidence.
These invoke runtime responsibilities and selected Agent Pack capabilities.
Their decomposition does not define lifecycle topology.
```

**Expected result**

The adapter is deterministic and contains no duplicated graph-transition semantics.

**Verify before continuing**

Render twice from identical locked inputs and require byte-identical output.

### Step 13 — Implement Pactwright evaluation and baseline comparison

**References:** Spec 02 evaluation and baseline/regression reporting.

**Run**

```text
Implement `pactwright eval` with core responsibility cases for:
- Contract fidelity;
- scope discipline;
- Brief quality;
- Review defect detection/quality;
- Evidence accuracy;
- lifecycle compliance;
- required output structure;
- forbidden mutation.

Implement the canonical comparison surface:
pactwright eval --baseline <released-pack-or-baseline> --candidate <candidate-pack-or-environment>

Keep deterministic assertions separate from semantic judgement.
Report regressions by meaningful dimensions such as capability, agent, evaluation case and changed Agent Pack/prompt/skill environment.
Do not compute one opaque aggregate score.

Before the first public release, prove comparison mechanics with exact fixture/pinned package inputs. After `0.0.1` is published, Step 28 must prove resolution against the real released baseline.
```

**Expected result**

The AI execution environment is evaluable independently from a real Delivery and candidate changes can be compared against an exact baseline.

**Verify before continuing**

Run core eval, compare compatible baseline/candidate fixtures, introduce a known regression and require it to appear at the affected capability/agent/case dimensions.

## Stage 4 — Implement exact environment resolution, initialisation and local composition

### Step 14 — Implement `pactwright init` and one-shot composition

**References:** Spec 02 initialisation/configuration.

**Run**

```text
Implement init so a clean repository receives only Pactwright-owned core configuration/Project Graph structure.
Checkpoint 1 keeps GitHub disabled and creates no Pactwright-managed GitHub workflow.
Do not silently switch or select Agent Pack identity.

Implement one-shot init as a composition surface over the same underlying operations, never as a second setup path.
At Checkpoint 1, prove `pactwright init --with <fixture-extension>` composes normal init + Extension installation + sync using the generic Extension mechanism implemented in Step 16.
Later first-party Extension ids and `--github` reuse this composition mechanism when those capabilities exist; they do not create a new initialisation implementation.
```

**Expected result**

A clean repository can initialise Pactwright safely and one-shot options compose the same managed operations as explicit setup.

**Verify before continuing**

Run plain init in a temporary repository with unrelated files and prove ownership boundaries. In a second clean fixture, compare one-shot `init --with <fixture-extension>` against the equivalent explicit `init` + `extension add` + `sync` path and require equivalent resolved state/generated output.

### Step 15 — Implement config/lock resolution and `environment_lock_hash`

**References:** Spec 02 locking; Implementation Guide replay provenance.

**Run**

```text
Resolve and lock the exact Pactwright execution environment, including runtime, selected Agent Pack and resolved agents/skills, with seams for later Extensions/Production Skills.
Derive deterministic `environment_lock_hash` from `.pactwright/lock.yml`.
The shared replay base is:
repository_revision + project_graph_revision + environment_lock_hash
```

**Expected result**

Identical exact environment produces identical lock and hash.

**Verify before continuing**

Resolve twice, compare byte-for-byte, then change one resolved identity and require hash change.

### Step 16 — Implement generic Pactwright Extension package/dependency mechanics

**References:** Spec 02 Extensions.

**Run**

```text
Using fixture Extensions only, implement manifest loading, compatibility/dependency resolution, graph contribution registration, command namespaces, capability contribution, GitHub profile metadata, add/remove/upgrade and blocked dependency removal.
Preserve user-authored Extension state on disable/removal.
Do not implement first-party Extension semantics yet.
```

**Expected result**

Later first-party Extensions can compose without changing core architecture.

**Verify before continuing**

Exercise add, dependency add, compatible upgrade, blocked removal, safe disable and preserved canonical data.

### Step 17 — Implement deterministic `pactwright sync`

**References:** Spec 02 synchronisation.

**Run**

```text
Implement sync over config + lock + enabled Extensions + selected Agent Pack + any Production Skills imports.
Validate the complete composition and render only Pactwright-managed local integration.
Checkpoint 1 renders no GitHub product workflow.
Repeated sync with identical locked inputs must be byte-identical.
```

**Expected result**

Local generated integration converges.

**Verify before continuing**

Run sync twice in a fixture and require a clean second run.

### Step 18 — Implement `pactwright doctor`

**References:** Spec 02 doctor.

**Run**

```text
Implement read-only doctor diagnostics for runtime/package-manager state, config/lock consistency, capability/dependency compatibility, unresolved Production Skills, migrations, generated local drift and validation failures.
Report healthy / warning / action required with deterministic remediation commands where known.
Do not auto-fix.
```

**Expected result**

Environment problems can be diagnosed without mutation.

**Verify before continuing**

Run healthy and broken fixtures and prove doctor performs no writes.

### Step 19 — Implement Pactwright runtime upgrade and rollback-safe failure

**References:** Spec 02 upgrade model; Implementation Guide package/release rules.

**Run**

```text
Implement:
pactwright upgrade
pactwright upgrade --to <version>

The runtime upgrade flow must:
- detect the project package manager from explicit declaration or unambiguous lock state;
- resolve the target Pactwright release;
- delegate package replacement to that package manager;
- re-enter through the newly installed Pactwright runtime;
- validate the complete resolved environment;
- run explicit versioned migrations where required;
- update `.pactwright/lock.yml`;
- run `pactwright sync` and `pactwright validate` using the new runtime.

`pactwright upgrade` upgrades the runtime only. It must not silently change Agent Pack or Extension identity or major-upgrade them.
`--to` supports explicit forward upgrade or rollback target selection.
If the target environment cannot complete safely, canonical Project Graph state must not be left partially migrated and enough prior package/config/lock state must remain to recover or explicitly target the previous runtime.
```

**Expected result**

Pactwright can safely replace its own runtime without becoming a second package manager or corrupting canonical state.

**Verify before continuing**

Use packed fixture runtime versions to prove latest-compatible upgrade, explicit `--to` upgrade/rollback, package-manager detection, new-runtime re-entry, unchanged Agent Pack/Extension identities, migration execution and failed-target recovery with the previous valid Project Graph/config/lock intact.

## Stage 5 — Establish repository CI and release safety

### Step 20 — Implement repository verification workflow

**References:** Implementation Guide GitHub Actions baseline.

**Run**

```text
Create repository-owned `.github/workflows/ci.yml` using least privilege, SHA-pinned actions, frozen install, `pnpm verify`, bounded timeout/concurrency and no pull_request_target.
This is repository engineering infrastructure, not generated Pactwright product integration.
```

**Expected result**

A clean checkout proves the same repository gate used locally.

**Verify before continuing**

Run `pnpm verify` and inspect workflow hardening.

### Step 21 — Implement trusted release workflow

**References:** Implementation Guide npm release model.

**Run**

```text
Create repository-owned `.github/workflows/release.yml` following the trusted-release contract: exact tagged source, frozen install, verify, publish dry-run, OIDC publishing after bootstrap, registry verification, no npm publish token.
```

**Expected result**

A version tag can later release accepted source reproducibly.

**Verify before continuing**

Validate workflow syntax, permissions and release assertions.

## Stage 6 — Prove packed consumer behaviour

### Step 22 — Pack runtime and standard Agent Pack

**Run**

```bash
pnpm pack --out /tmp/pactwright-checkpoint-1.tgz
pnpm --filter @pactwright/standard pack --out /tmp/pactwright-standard-checkpoint-1.tgz
```

**Expected result**

Real consumer artefacts exist for both components.

**Verify before continuing**

Inspect both archives.

### Step 23 — Install and initialise clean consumer fixtures

**Run**

Install the two packed artefacts in a clean repository outside the workspace, using a local-package override only if needed before first registry publication, then run the explicit path:

```bash
pnpm pactwright init
pnpm pactwright agent-pack use @pactwright/standard
pnpm pactwright sync
pnpm pactwright doctor
pnpm pactwright validate
pnpm pactwright lifecycle status
```

In a second clean fixture, prove the supported one-shot init composition path with a fixture Extension and compare the result with the equivalent explicit operations.

**Expected result**

A repository becomes a valid Pactwright consumer from packed artefacts only, and one-shot init does not create a divergent setup path.

**Verify before continuing**

Doctor has no action-required issue; validation/status pass; second sync is clean; explicit and one-shot composition resolve equivalent state.

### Step 24 — Complete one full fixture Delivery

**Run**

Use the generated adapter to complete:

```text
Intent → Contract alternatives → authorised Decision → Contract → Brief → Delivery → Review → Evidence
```

Then run validation/status.

**Expected result**

The full canonical Delivery lineage completes with alternatives/execution transcripts remaining non-canonical.

**Verify before continuing**

Inspect durable Project Graph state.

## Stage 7 — Adopt Pactwright in Pactwright

### Step 25 — Initialise the Pactwright repository

**Run**

```bash
pnpm build
pnpm pactwright init
pnpm pactwright agent-pack use @pactwright/standard
pnpm pactwright sync
pnpm pactwright doctor
pnpm pactwright validate
pnpm pactwright lifecycle status
pnpm verify
```

Land self-hosting state through the repository process available before Checkpoint 2 product GitHub integration exists.

**Expected result**

Pactwright is now a valid Pactwright project.

**Verify before continuing**

Second sync is clean and repository CI passes.

### Step 26 — Deliver a real self-hosted Quick Start improvement

**References:** Spec 08 Core Delivery public milestone.

**Run**

Use Pactwright itself to improve the Quick Start based only on behaviour proven in this checkpoint.
Before PI exists, identity/positioning/product choices required by this public work must be authorised through Decision + Contract rather than invented.

**Expected result**

Pactwright completes a real public-product change through itself.

**Verify before continuing**

Evidence and public instructions agree with clean-consumer behaviour.

## Stage 8 — Complete the `0.0.1` public learning path

### Step 27 — Deliver Core Delivery learning material

Through normal Pactwright Delivery, produce/update:

```text
README Quick Start
Getting Started guide
one executable Core Delivery example
```

Only document proven behaviour, including the core distribution commands shipped in `0.0.1`.

**Expected result**

A new user can understand/install/execute/upgrade `0.0.1` without future Extensions.

**Verify before continuing**

Follow the material in a clean packed-consumer fixture.

## Stage 9 — Publish `0.0.1`

### Step 28 — Bootstrap first npm publication and prove a real released baseline

**References:** Implementation Guide npm release model; Spec 02 baseline evaluation.

Publish exactly:

```text
pactwright@0.0.1
@pactwright/standard@0.0.1
```

Use the one-time interactive bootstrap, configure `release.yml` as trusted publisher for both, tag accepted source as `v0.0.1`, and verify the tag workflow.

**Verify before continuing**

```bash
pnpm view pactwright@0.0.1 version
pnpm view @pactwright/standard@0.0.1 version

pnpm pactwright eval \
  --baseline @pactwright/standard@0.0.1 \
  --candidate @pactwright/standard
```

The comparison must resolve the published `0.0.1` baseline exactly and emit per-capability/agent/case comparison results. An unchanged accepted candidate may correctly report no regressions; the purpose is to prove the real released-baseline path, not manufacture a difference.

## Stage 10 — Prove the published release in Kakeido

### Step 29 — Install Pactwright `0.0.1` in Kakeido

```bash
pnpm add -D pactwright@0.0.1 @pactwright/standard@0.0.1
pnpm pactwright init
pnpm pactwright agent-pack use @pactwright/standard
pnpm pactwright sync
pnpm pactwright doctor
pnpm pactwright validate
pnpm pactwright lifecycle status
```

**Expected result**

Kakeido runs the exact published runtime and Agent Pack without optional first-party Extensions.

### Step 30 — Deliver one current Kakeido financial-domain outcome

Resolve the current Kakeido canonical specification(s) governing the first bounded financial-domain target and record their paths/versions in the Brief grounding.

Use normal Pactwright Delivery to implement one meaningful outcome proving current financial invariants and deterministic domain tests.

**Expected result**

Kakeido completes a real full Delivery lineage using the published family.

**Verify before continuing**

Run Pactwright validation plus the Kakeido repository-defined tests required by current specifications.

## Stage 11 — Capture Checkpoint 1 feedback

### Step 31 — Capture material findings as future Intents

Before PI exists, material Pactwright responsibility failures become explicit open Intents through normal Delivery authority. Do not generalise Kakeido-specific preferences.

Blocking failures are fixed inside this checkpoint.

**Verify before continuing**

`pactwright validate` passes and no known blocking failure remains.

## Exit gate

Checkpoint 1 closes only when:

- the runtime and `@pactwright/standard` are real publishable packages;
- the five core durable record types and typed relationships validate;
- Contract authority is distinct from Gate/execution policy;
- direct `Brief → Delivery → Review → Evidence` works without encoding adapter responsibilities as lifecycle topology;
- repository revision, Project Graph revision and `environment_lock_hash` provide the shared replay base;
- Agent Pack selection is explicit and capability checked;
- `pactwright agent-pack upgrade` safely upgrades the selected pack without changing identity or corrupting the previous valid environment on failure;
- `pactwright upgrade` and `pactwright upgrade --to` are fixture-proven, re-enter through the new runtime and preserve recoverability on failure;
- one-shot `pactwright init` composition is equivalent to the corresponding explicit operations rather than a separate setup path;
- generic Extension package/dependency mechanics are fixture-proven;
- `init`, `sync`, `doctor`, `validate`, lifecycle commands and core `eval` work;
- baseline/candidate evaluation reports meaningful per-dimension regressions and resolves the real released `@pactwright/standard@0.0.1` baseline after publication;
- a clean packed consumer completes a full Delivery;
- Pactwright completes real self-hosted Delivery;
- public learning material matches shipped capability;
- `pactwright@0.0.1` and `@pactwright/standard@0.0.1` are registry verified;
- Kakeido completes one real Delivery from current canonical specifications;
- repeated sync converges and graph coherence is not hand maintained;
- no known blocking failure is carried into Checkpoint 2.

---

**Pactwright — Checkpoint 1 — Self-Hosted Delivery v14**
