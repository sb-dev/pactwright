# Pactwright — Checkpoint 1 — Self-Hosted Delivery

**Version:** 15  
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
Core Project Graph semantics and the complete Spec 01 validation contract
Contract authority and Evidence closure preconditions
initial direct Delivery shape
lifecycle execution state, policy and Gates
Project Graph revision
repository revision resolution
Agent Pack capability resolution
@pactwright/standard
seven canonical Claude Code adapter commands
exact environment locking and package-manager lock agreement
pactwright init / sync / validate / doctor / eval
one-shot init composition with explicit Agent Pack selection
pactwright upgrade / pactwright upgrade --to
Agent Pack selection and agent-pack upgrade
transaction-safe Pactwright Extension package/dependency framework
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
- External Production Skills integration manifests, import resolution, Production Extension Packs and their diagnostics: Checkpoint 5. Direct skills contained in an Agent Pack remain in scope. Earlier runtimes must report unsupported external imports rather than silently ignore them or claim to resolve them.
- Historical environment retention/reacquisition machinery: identity and fail-explicitly semantics are implemented, archival strategy is not.
- Lifecycle-shape hashing or a universal lifecycle-shape persistence scheme: still unresolved.

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
Project Graph revision includes registered canonical Delivery records, typed edges and enabled Extension-owned canonical records.
It excludes generated reports, adapter output, lifecycle execution state, execution provenance, GitHub projections and other derived state.
Canonicalise ordering before hashing.
```

**Expected result**

Repository revision and Project Graph revision are stable, distinct identities.

**Verify before continuing**

Prove identical state gives identical graph revision; generated-file or execution-state change does not; canonical mutation does. Repeat the inclusion/exclusion proof with an enabled fixture Extension in Step 16 once its registration path exists.

## Stage 2 — Implement Contract-driven lifecycle execution

### Step 6 — Implement the initial direct lifecycle shape and execution policy

**References:** Spec 01 lifecycle shape, execution state, policy and Gate boundaries.

**Run**

```text
Implement the initial built-in direct fulfilment shape:
Brief → Delivery → Review → Evidence

Keep separate:
- Contract/Decision authority;
- lifecycle shape/topology;
- execution policy such as automatic/manual execution and human Gates;
- fine-grained lifecycle execution state.

Execution state must identify the current Brief, resolved shape, current/completed steps, Gate state, iteration counts where applicable and execution status.
Broad Delivery state remains derived from canonical lineage; fine-grained progression is not stored as Delivery Graph truth.

Do not encode capture-intent, propose-contracts, approve-contract or write-brief as shape stages.
Do not add Deployment, Asset, Publication or Observation to the core lifecycle.
Do not invent lifecycle-shape hashes or make shape identity part of Brief identity.
Any configured corrective transition must exist in its declared shape and have bounded execution policy; AI cannot invent routes.
```

**Expected result**

The runtime represents fulfilment topology and execution progress without conflating either with Contract authority or durable graph state.

**Verify before continuing**

Test automatic/manual policy, authorised and unauthorised Gate progression, invalid shape/policy configuration, impossible corrective routes and unbounded-loop rejection. Changing execution progress alone must leave canonical graph records and `project_graph_revision` unchanged.

### Step 7 — Implement authoritative core mutations and Evidence closure guards

**References:** Spec 01 authority, graph mutation, supersession and `/prepare-evidence`.

**Run**

```text
Implement runtime mutation responsibilities for Intent, Decision, selected Contract, Brief, Evidence, required edges and explicit supersession.
Contract alternatives remain transient until selection.
Approval/Gate state never auto-creates a Decision.
All mutations use plan → validate complete proposed state → atomic write → validate resulting state.

Before creating Evidence or its evidences edge, require:
- the Brief is current;
- the latest delivered state has been reviewed;
- the closing Review permits successful Evidence closure;
- no required Gate remains unresolved;
- Contract and Brief lineage is valid.

Enforce these as pre-mutation runtime guards, not only as checks after writing Evidence.
A delivery change after Review requires Review of the new delivered state before closure.
```

**Expected result**

Only authorised paths produce canonical structures; successful closing Review of the latest state is required for Evidence, and failed mutation leaves no partial state.

**Verify before continuing**

Exercise authorised/unauthorised Decisions and forced write/validation failure. For each Evidence precondition, provide a failing fixture and require no Evidence or partial edge to be written. Include superseded Brief, unreviewed delivery change, blocking closing Review, pending Gate and invalid-lineage cases, plus successful closure.

### Step 8 — Implement lifecycle status, next and run

**References:** Spec 01 lifecycle command surface and execution-state boundary.

**Run**

```text
Implement:
pactwright lifecycle status
pactwright lifecycle next
pactwright lifecycle run

`status` reports current/completed steps, blocking step, required actor, validation problems and current lineage.
`next` determines the next permitted lifecycle action without executing it.
Both are read-only.

`run` executes automatic responsibilities through the resolved shape/policy until a required Gate, completion, execution failure or validation failure.
It cannot skip Gates, invent transitions or create Evidence before the Step 7 closure guards pass.

Derive progression from current Contract/Brief lineage, resolved shape, policy, Gate state and repository state.
Keep execution progress outside the Delivery Graph.
```

**Expected result**

The runtime owns fulfilment progression and exposes inspection separately from execution.

**Verify before continuing**

Prove status/next perform no writes, report the correct actor/blocker/lineage, and next does not invoke an agent. Prove Gate/failure stopping, no next core fulfilment stage after current Evidence, and execution-state changes do not alter graph truth.

### Step 9 — Implement the complete core validation contract and bounded context assembly

**References:** Spec 01 sections 39, 46–57.

**Run**

Implement read-only `pactwright validate` with the full minimum detection contract:

```text
1. malformed core nodes;
2. invalid core relationships;
3. missing required lineage;
4. contradictory current records;
5. multiple unsuperseded canonical Decisions or Contracts for one active direction;
6. invalid Brief-to-Contract lineage;
7. invalid Evidence-to-Brief lineage;
8. illegal supersession;
9. missing lifecycle shape;
10. unresolved or incompatible shape identity;
11. impossible shape transitions;
12. Evidence attempted before successful closing Review;
13. unauthorised Decision;
14. unauthorised Gate progression;
15. unbounded configured corrective loops;
16. Extension state illegally redefining core Delivery semantics;
17. repository replay provenance that does not derive the recorded Project Graph revision when replay validation is requested.
```

Use the same validation mechanics before canonical mutation wherever possible. Do not repair graph state as a side effect of validation.

Implement the runtime context-assembly API consumed by Agent Packs/adapters. Default Delivery context contains current relevant Contract/Brief lineage and excludes rejected alternatives, superseded state, execution transcripts and unrelated history unless explicitly required. Keep a namespaced context-contribution seam for later Extensions. Do not introduce `pactwright context` as a required public CLI contract.

**Expected result**

The core semantic contract is machine-enforced and agents receive bounded canonical context rather than reconstructing truth from chat history.

**Verify before continuing**

Maintain valid controls and a failing fixture mapped to each numbered rule. Use a fixture graph contribution for rule 16 now and rerun it through real fixture Extension loading in Step 16. Verify rule 17 on a requested replay check, not by requiring historical reconstruction on every ordinary validation. Test context inclusions/exclusions and prove validation failures perform no writes.

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

Select standard, switch to a compatible fixture pack, reject an incompatible pack without state loss, upgrade a selected fixture pack to a compatible newer version, then reject an incompatible upgrade while preserving the previous valid environment. Prove an exact configured target remains selected even when a newer compatible package is available; desired constraints do not authorise silently changing pack identity.

### Step 12 — Implement the seven canonical Claude Code adapter commands

**References:** Specs 01 sections 46–53 and 02 adapter boundary.

**Run**

```text
Render deterministic Pactwright-managed Claude Code agents and these exact commands:
/capture-intent
/propose-contracts
/approve-contract
/write-brief
/deliver-brief
/review
/prepare-evidence

The commands invoke runtime responsibilities and the selected Agent Pack capabilities:
- capture-intent creates an Intent through the runtime;
- propose-contracts is graph-read-only and keeps alternatives transient;
- approve-contract applies normal Decision authority and, for proceed, creates the selected Contract and required lineage;
- write-brief inspects current state and creates the Brief under its canonical Contract;
- deliver-brief executes the active Delivery step without directly mutating the Delivery Graph or independently selecting transitions;
- review evaluates the latest delivered state without creating Evidence or inventing transitions;
- prepare-evidence invokes all Step 7 preconditions before creating Evidence and its evidences relationship.

Their decomposition does not define lifecycle topology.
Do not duplicate graph-transition or authority semantics in prompts.
```

**Expected result**

The adapter exposes the canonical command surface with explicit, runtime-enforced mutation boundaries.

**Verify before continuing**

Assert the exact seven command names, render twice from identical locked inputs and require byte-identical output. Exercise every command's permitted/forbidden mutations, including graph-read-only alternatives, no direct Delivery graph writes, no Evidence from review, and failed premature prepare-evidence. Then complete one valid command lineage.

### Step 13 — Implement Pactwright evaluation and baseline comparison

**References:** Spec 02 evaluation and baseline/regression reporting.

**Run**

```text
Implement `pactwright eval` with core responsibility cases for Contract fidelity, scope discipline, Brief quality, Review quality/defect detection, Evidence accuracy and lifecycle compliance, plus required output structure and forbidden mutation.

Evidence accuracy cases compare claimed delivered work and verification with actual recorded results.
Lifecycle compliance cases cover authority, Gate stopping, valid transitions and successful closing Review before Evidence.

Implement the canonical comparison surface:
pactwright eval --baseline <released-pack-or-baseline> --candidate <candidate-pack-or-environment>

Keep deterministic assertions separate from semantic judgement.
Report regressions by meaningful dimensions such as capability, agent, evaluation case and changed Agent Pack/prompt/direct-skill environment.
Do not compute one opaque aggregate score.

Before the first public release, prove comparison mechanics with exact fixture/pinned package inputs. After `0.0.1` is published, Step 28 must prove resolution against the real released baseline.
```

**Expected result**

The AI execution environment is evaluable independently from a real Delivery and candidate changes can be compared against an exact baseline.

**Verify before continuing**

Run core eval, compare compatible baseline/candidate fixtures and introduce known regressions in Evidence accuracy and lifecycle compliance. Require each to appear at its affected capability/agent/case dimensions rather than being hidden in an aggregate result.

## Stage 4 — Implement exact environment resolution and local composition

### Step 14 — Implement `pactwright init` with explicit Agent Pack selection

**References:** Spec 02 initialisation/configuration and Agent Pack selection.

**Run**

```text
Implement init so a clean repository receives only Pactwright-owned core configuration/Project Graph structure.
Checkpoint 1 keeps GitHub disabled and creates no Pactwright-managed GitHub workflow.
Do not silently select or switch Agent Pack identity.

A plain init may create the initial scaffold before `agent-pack use` explicitly selects a pack; do not claim that scaffold is a complete activated execution environment.
For compositional init that activates an Extension or later GitHub integration, obtain an explicit compatible Agent Pack choice through the documented normal init selection interaction/input before activation. Reuse agent-pack selection/resolution, not a second resolver.

Tests must supply the same explicit pack source and target version in both the one-shot and explicit setup paths. With no supplied choice, do not activate dependent features or silently choose standard.
Exact input ergonomics are implementation details; do not invent an additional canonical CLI flag in this runbook.
```

**Expected result**

A clean repository can initialise safely, and one-shot activation preserves explicit pack authority.

**Verify before continuing**

Run init in a temporary repository with unrelated files. Test scaffold then explicit `agent-pack use`, explicit selection during one-shot init, missing selection, incompatible selection and preservation of an existing pack choice. Require no Extension activation on missing/incompatible selection and no unrelated writes.

### Step 15 — Implement config/lock agreement and `environment_lock_hash`

**References:** Spec 02 locking; Implementation Guide replay provenance.

**Run**

```text
Resolve and lock the exact Pactwright execution environment: runtime, selected Agent Pack, resolved agents/direct skills and fixture Extensions once Step 16 is available.
Retain integration seams for the external Production Skills resolver delivered in Checkpoint 5; do not implement or pretend to resolve those imports here.

Configuration records desired constraints. The package-manager manifest/lock records installed packages; `.pactwright/lock.yml` records the resolved Pactwright environment.
The two locks must agree on every runtime and package-backed component version they both identify.
Record exact package/source, version, content identity and resolved dependencies as applicable.
Reject lock mismatch or incompatible resolution before accepting a new environment or replacing generated integration.

Derive deterministic `environment_lock_hash` from the exact resolved `.pactwright/lock.yml` state.
The shared replay base is:
repository_revision + project_graph_revision + environment_lock_hash
```

**Expected result**

Identical exact environments produce identical locks/hashes and inconsistent installed/resolved state is not accepted.

**Verify before continuing**

Resolve twice and compare byte-for-byte, then change one resolved identity and require a hash change. Test runtime/Agent Pack lock disagreement and tampered component identity; repeat for package-backed fixture Extensions in Step 16. Failed resolution preserves the previous valid environment.

### Step 16 — Implement transaction-safe Extension mechanics and one-shot init composition

**References:** Spec 02 sections 10–15 and one-shot initialisation.

**Run**

```text
Using fixture Extensions only, implement manifest loading, graph contribution registration, command namespaces, capability contribution and GitHub profile metadata.

Implement:
pactwright extension add <id-or-package>
pactwright extension remove <id>
pactwright extension upgrade <id>

Installation must:
- resolve a compatible package and the complete Extension dependency graph;
- validate runtime/schema compatibility and the selected pack's complete required capability set before activation or canonical mutation;
- install required dependencies first through the same normal installation path;
- delegate package installation to the project package manager;
- register the Extension in project configuration;
- record exact package/version/hash and resolved dependencies in the Pactwright lock, consistent with the package-manager lock;
- create owned repository structure only for the valid environment;
- run normal sync;
- report any later GitHub provisioning needs without mutating remote state.

On incompatibility or installation/sync failure, preserve or restore the previous valid package/configuration/lock/generated environment and leave no partial canonical graph mutation. Never silently switch Agent Packs.

Upgrade validates every enabled dependent Extension and the complete capability set. Canonical schema changes use explicitly defined versioned migrations, not silent reinterpretation. Protect canonical state from partial migration and preserve recovery to the prior valid environment.

Removal/disable preserves user-authored canonical data. Remove only unambiguously owned generated contributions no enabled component still requires. Reject removal of a required dependency unless the dependent is disabled/removed in the same supported operation. Preserve ambiguous ownership and report it.

Do not implement first-party Extension semantics yet.

One-shot `pactwright init --with <fixture-extension>` composes normal init + explicit Agent Pack selection + normal Extension installation + sync, using Step 14's documented selection input.
Later first-party Extension ids and `--github` reuse this composition mechanism; they do not create a new setup implementation.
```

**Expected result**

Later Extensions can compose through one transactional distribution path, and one-shot initialisation uses the same explicit selection and managed operations as separate setup.

**Verify before continuing**

Exercise dependency-first add, exact lock agreement, compatible upgrade/migration, incompatible dependent upgrade, missing capability, blocked removal, safe disable and preserved canonical data. Inject package, migration and sync failures; require no partial graph records and restoration/recoverability of the previous valid environment without a pack switch.

Repeat Steps 5 and 9 through the actual fixture Extension loader: its canonical node/edge mutation changes `project_graph_revision`; its generated files and execution output do not; attempted redefinition of core semantics fails.

Compare clean one-shot and explicit init + `agent-pack use` + `extension add` + sync paths using the same explicitly chosen compatible fixture pack/version. Require equivalent configuration, package locks, resolved environment identity, canonical structure and generated output, not merely successful exit codes.

### Step 17 — Implement deterministic `pactwright sync`

**References:** Spec 02 synchronisation.

**Run**

```text
Implement sync over config + lock + enabled fixture Extensions + selected Agent Pack and its direct skills.
Validate the complete supported composition and lock agreement before rendering only Pactwright-managed local integration.
Checkpoint 1 renders no GitHub product workflow.
External Production Skills imports remain a Checkpoint 5 capability; report them as unsupported rather than silently dropping or resolving them.
Repeated sync with identical locked inputs must be byte-identical.
```

**Expected result**

Local generated integration converges without claiming later Production Skills support.

**Verify before continuing**

Run sync twice in a fixture and require a clean second run. An unsupported external import or lock mismatch must fail without replacing the previous generated environment; unrelated local files remain unchanged.

### Step 18 — Implement `pactwright doctor`

**References:** Spec 02 doctor.

**Run**

```text
Implement read-only diagnostics for runtime/package-manager state, config/lock consistency, capability/dependency compatibility, migrations, generated local drift and validation failures.
Report available runtime upgrades where determinable.
Identify configured external Production Skills imports as unsupported by this release, rather than claiming the full dependency diagnostics implemented in Checkpoint 5.
Report healthy / warning / action required with deterministic remediation commands where known.
Do not auto-fix or create a second GitHub reconciler.
```

**Expected result**

Environment problems can be diagnosed without mutation and the reported capability boundary matches the installed release.

**Verify before continuing**

Run healthy, lock-drift, missing-capability, pending-migration and unsupported-import fixtures. Prove doctor performs no writes and gives concrete remediation only when supported and deterministic.

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

In a second clean fixture, prove one-shot init with a fixture Extension and explicitly supply the same compatible packed Agent Pack source/version through the documented init selection input. Compare against the equivalent explicit operations; pack installation alone is not pack selection.

**Expected result**

A repository becomes a valid Pactwright consumer from packed artefacts only, and one-shot init does not create a divergent setup or silently select a pack.

**Verify before continuing**

Doctor has no action-required issue; validation/status pass; second sync is clean; explicit and one-shot composition resolve equivalent state.

### Step 24 — Complete one full fixture Delivery

**Run**

Use the generated adapter to complete:

```text
Intent → Contract alternatives → authorised Decision → Contract → Brief → Delivery → Review → Evidence
```

Then run validation/status and the complete core invariant suite through the assembled runtime, adapter and fixture Extension loader.

**Expected result**

The full canonical Delivery lineage completes with alternatives/execution transcripts remaining non-canonical.

**Verify before continuing**

Inspect durable Project Graph state. Require all 17 validation cases, Evidence precondition failures, seven adapter mutation-boundary cases and complete core evaluation dimensions to pass before self-hosting.

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

Kakeido runs the exact published runtime and Agent Pack without optional Extensions.

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
- the five durable core record types and typed relationships validate, including all 17 Spec 01 minimum validation rules;
- Contract authority is distinct from Gate/execution policy;
- direct `Brief → Delivery → Review → Evidence` works without encoding adapter responsibilities as lifecycle topology;
- fine-grained execution state remains outside the Delivery Graph, and status/next are read-only while run respects authority and declared bounded transitions;
- all five Evidence closure preconditions are enforced before atomic canonical mutation;
- the seven exact adapter commands preserve their permitted and forbidden mutation boundaries;
- repository revision, Project Graph revision and `environment_lock_hash` provide the shared replay base;
- fixture Extension canonical state contributes to graph revision while generated and execution state does not;
- package-manager and Pactwright locks agree on every shared package-backed identity;
- Agent Pack selection is explicit and capability checked, including clean one-shot initialisation;
- `pactwright agent-pack upgrade` safely upgrades the selected pack within configured constraints without changing identity or corrupting the previous valid environment on failure;
- `pactwright upgrade` and `pactwright upgrade --to` are fixture-proven, re-enter through the new runtime and preserve recoverability on failure;
- one-shot init composes the same explicit pack selection, Extension installation and sync operations as separate setup;
- Extension dependency-first installation, exact locking, versioned migration, failure recovery, blocked removal and preservation of user-authored data are fixture-proven;
- external Production Skills resolution remains explicitly assigned to Checkpoint 5, and unsupported imports are not silently ignored;
- `init`, `sync`, `doctor`, `validate`, lifecycle commands and core `eval` work;
- core evaluation covers Contract fidelity, scope discipline, Brief quality, Review quality, Evidence accuracy and lifecycle compliance;
- baseline/candidate evaluation reports meaningful per-dimension regressions and resolves the real released `@pactwright/standard@0.0.1` baseline after publication;
- a clean packed consumer completes a full Delivery;
- Pactwright completes real self-hosted Delivery;
- public learning material matches shipped capability;
- `pactwright@0.0.1` and `@pactwright/standard@0.0.1` are registry verified;
- Kakeido completes one real Delivery from current canonical specifications;
- repeated sync converges and graph coherence is not hand maintained;
- no known blocking failure is carried into Checkpoint 2.

---

**Pactwright — Checkpoint 1 — Self-Hosted Delivery v15**
