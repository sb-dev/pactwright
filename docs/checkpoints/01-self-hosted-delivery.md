# Pactwright — Checkpoint 1 — Self-Hosted Delivery

**Version:** 21  
**Entry condition:** No installable Pactwright runtime exists.  
**Release:** `0.0.2` (corrective; `0.0.1` was published against version 14 of this runbook and remains the released baseline)  
**Exit capability:** Pactwright is installable, upgradeable, can govern one complete Contract-driven Delivery in its own repository and in Kakeibo, can compare an Agent Pack candidate against a released baseline, and requires no manual Project Graph coherence work.

## 1. Goal

Bootstrap the smallest installable Pactwright core, prove it in a clean consumer, adopt it in Pactwright, publish `0.0.1`, then install the same release in Kakeibo and complete one real external Delivery.

The Kakeibo proof is deliberately narrow: create the first executable deterministic financial-domain foundation. CSV ingestion, application/API infrastructure, UI, Kei, analytics and provider integration remain later checkpoints.

Checkpoint 1 also establishes the complete core distribution surface needed by later checkpoints: compositional one-shot initialisation, runtime upgrade, Agent Pack upgrade and released-baseline evaluation.

This is the only checkpoint whose implementation begins before Pactwright can govern its own work.

## 2. Canonical baseline

Canonical Pactwright semantics come from:

- [01 — Core System and Lifecycle](../specs/01-pactwright-core-system-and-lifecycle.md)
- [02 — Distribution, Agent Packs, Extensions and Evaluation](../specs/02-distribution-agent-packs-extensions-and-evaluation.md)
- [08 — Open-Source Project Organisation](../specs/08-open-source-project-organisation.md)
- [Implementation Principles](./00-implementation-principles.md)
- [Implementation Guide](./00-implementation-guide.md)
- [Kakeibo System-Level Acceptance Profile](./00-kakeibo-acceptance-profile.md)

Research logs are rationale only.

### Kakeibo

Kakeibo acceptance uses the current canonical Kakeibo specifications in the Kakeibo repository. Do not use stale copies embedded in Pactwright as authority. At execution time use the current canonical Kakeibo repository authorities:

```text
docs/specs/README.md

docs/specs/02-financial-domain-model-spec.md
docs/specs/05-system-architecture-and-data-spec.md
docs/specs/06-engineering-delivery-and-operations-spec.md
```

For this checkpoint:

```text
02 → financial-domain semantics
05 → package/layer boundary only
06 → deterministic test expectations only
```

`00-kakeibo-acceptance-profile.md` §5 is the shared System-Level Acceptance cross-check for this slice, and §§2–5 carry the wider Kakeibo System-Level Acceptance requirements.

Retained August Kakeido Financial Model or Tech Stack research snapshots are not implementation authority.

This runbook defines implementation order, not new Pactwright semantics.

## 3. Execution contract

A converted step is defined by its YAML contract in [`01-self-hosted-delivery/`](./01-self-hosted-delivery/), in the format owned by [Spec 00](../specs/00-checkpoint-step-contract-and-delivery-tasks.md). The step section here links the contract and summarises its deliverables; the contract holds the requirements and acceptance criteria. Every contract inherits the settings and shared requirements in [`checkpoint.yml`](./01-self-hosted-delivery/checkpoint.yml), and [`crosswalk.yml`](./01-self-hosted-delivery/crosswalk.yml) records where each obligation of the replaced step prose went: version 17 for Stage 1 and version 20 for Stage 2.

Stages 1 and 2 are converted. Stage 1 contracts are amended against Core v3 through the Q01–Q20 resolution pass. Stage 2 contracts are drafted against Core v3; their open questions Q21–Q33 await T2 review. Later steps retain the version 17 form, with the integration obligations below amended in version 20, until they are converted:

```text
Step
→ References
→ Run
→ Expected result
→ Verify before continuing
```

For Pactwright repository/code changes, finish with `pnpm verify` (shared requirement `CP01/R01`).

The Q01–Q20 resolution pass is recorded in six dependency-ordered [batch records](../research-logs/2026-09-23-pr41-b1-loading.md). The crosswalk retains the original questions and replaced-prose quotes; the amended specifications and contracts govern new attempts. These document changes do not establish runtime acceptance or bypass independent review.

Once a deterministic Pactwright responsibility exists, use the runtime rather than asking an agent to emulate it.

**Default execution location:** the Pactwright repository root unless the step explicitly names Kakeibo or a fixture.

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
first Kakeibo Delivery
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
- Kakeibo CSV ingestion, Hono API, Neon persistence, Hyperdrive, R2 and Cloudflare Workflows: Checkpoint 2.
- Kakeibo mobile/web UI and weekly-review implementation: later product slices.
- Kakeibo Kei runtime/release/evaluation: Checkpoint 5 onward.
- Kakeibo analytics, operational telemetry and controlled Experiments: later checkpoints.
- Connected banking: Graduation.

## Stage 1 — Build the canonical Project Graph substrate

### Step 1 — Create the runtime/package foundation

**Contract:** [`CP01-S01`](./01-self-hosted-delivery/CP01-S01.yml)

**Deliverables**

- `runtime-package` — The pactwright runtime and CLI package, built, tested and packed through the repository's normal build, prepack and verify discipline.
- `canonical-loader` — One loading path for Pactwright configuration, lifecycle configuration, .pactwright/lock.yml, core Project Graph records and typed edges.
- `repository-cli` — A repository-local pnpm pactwright path that runs the same built runtime the package publishes.

### Step 2 — Implement the five durable core Delivery record types

**Contract:** [`CP01-S02`](./01-self-hosted-delivery/CP01-S02.yml)

**Deliverables**

- `core-record-model` — The five durable core Delivery record types, Intent, Decision, Contract, Brief and Evidence, with canonical identity, immutability and type-specific validation.
- `canonical-contribution-registry` — Generic owner/schema/canonical-value and optional node-projection registration for core and Extension-owned records, including non-node records; installed packages reuse this seam.

Step 2 also owns the generic canonical-contribution registry described in Core §54. Fixture Extension records keep their own schema and identity; they are not forced into the core record envelope. Step 16 repeats this proof through installed packages.

### Step 3 — Implement the shared typed-edge store

**Contract:** [`CP01-S03`](./01-self-hosted-delivery/CP01-S03.yml)

**Deliverables**

- `typed-edge-store` — Shared persistence, validation and relation registration for typed relationships.

This step proves relation registration with fixture relations. Installed Extension composition exercises the real integration in Step 16; a fixture does not establish that later capability.

### Step 4 — Implement current-lineage and authority derivation

**Contract:** [`CP01-S04`](./01-self-hosted-delivery/CP01-S04.yml)

**Deliverables**

- `lineage-derivation` — Derivation of each Intent's current Delivery lineage, recorded authorised Contract and broad Delivery state from canonical records and typed edges alone.

Gate state and executable policy arrive with Step 6. Step 4 derives exact recorded Decision/Contract lineage, not permission to execute; Steps 7 and 9 enforce and diagnose actor-kind policy compatibility. Attribution is not identity-provider authentication. Approval outside a Decision cannot act as Decision authority.

### Step 5 — Implement repository and Project Graph revision identity

**Contract:** [`CP01-S05`](./01-self-hosted-delivery/CP01-S05.yml)

**Deliverables**

- `repository-revision` — A runtime-provided repository revision identifying the exact committed repository state used as the reconstructible execution input base.
- `project-graph-revision` — A deterministic Project Graph revision hashed from canonically ordered, registered canonical Project Graph state only.

This step proves inclusion of Extension-owned canonical records, including non-node records with their own schema, and relations with fixture registrations. Step 16 repeats the inclusion/exclusion proof with an enabled fixture Extension installed through its loader. The `pg1` byte/digest vectors in Core §56 are protocol tests, not proof that the runtime implements them.

## Stage 2 — Implement Contract-driven lifecycle execution

### Step 6 — Implement the initial direct lifecycle shape and execution policy

**Contract:** [`CP01-S06`](./01-self-hosted-delivery/CP01-S06.yml)

**Deliverables**

- `lifecycle-shape` — The built-in direct fulfilment shape, Brief → Delivery → Review → Evidence, and shape validation over the domain-neutral delivery, review, gate and transition vocabulary.
- `execution-policy` — Execution policy loaded from lifecycle configuration through the canonical loader, covering automatic or manual execution, allowed actor kinds, Gate authority and iteration bounds, separate from shape topology and Contract authority.
- `execution-state` — Fine-grained lifecycle execution state for a Brief, held outside the Project Graph, identifying the current Brief, resolved shape, current and completed steps, Gate state, iteration counts and execution status.

Contract-crafting responsibilities such as capture-intent and write-brief remain policy entries, not shape steps. Step 8 exposes progression through the lifecycle commands and Step 9 diagnoses shape and policy configuration.

### Step 7 — Implement authoritative core mutations and Evidence closure guards

**Contract:** [`CP01-S07`](./01-self-hosted-delivery/CP01-S07.yml)

**Deliverables**

- `mutation-api` — The runtime canonical mutation API that every public entry point calls, performing plan, complete-state validation, immutability and authority guards, a serialised stored-base check, an atomic write and result validation.
- `authoritative-mutations` — Authorised mutations creating Intent, Decision with its selected Contract, Brief, Evidence, required edges and explicit supersession, including withdrawal and re-authorisation.
- `evidence-closure-guards` — Pre-mutation guards that refuse Evidence and its evidences edge until all five closure preconditions hold.

Step 7 proves the guards through the runtime mutation API. Step 8 repeats them through `lifecycle run`, Step 12 through each mutating adapter command and Step 24 through the assembled runtime. The supplied actor is attribution, not identity-provider authentication.

### Step 8 — Implement lifecycle status, next and run

**Contract:** [`CP01-S08`](./01-self-hosted-delivery/CP01-S08.yml)

**Deliverables**

- `lifecycle-status` — A read-only pactwright lifecycle status reporting current and completed steps, blocking step, required actor, validation problems and current lineage.
- `lifecycle-next` — A read-only pactwright lifecycle next that determines the next permitted lifecycle action without executing it.
- `lifecycle-run` — A pactwright lifecycle run that executes automatic responsibilities through the resolved shape and policy until a required Gate, completion, execution failure or validation failure.

Agent Pack capabilities arrive in Step 10 and adapter commands in Step 12; Step 24 completes a full Delivery through them. Execution progress stays outside the Delivery Graph.

### Step 9 — Implement the complete core validation contract and bounded context assembly

**Contract:** [`CP01-S09`](./01-self-hosted-delivery/CP01-S09.yml)

**Deliverables**

- `validate-command` — A read-only pactwright validate implementing the complete Core §57 minimum detection contract without repairing state.
- `context-assembly` — A runtime context-assembly API giving Agent Packs and adapters bounded current Contract/Brief lineage context, with a namespaced contribution seam for later Extensions.

Rule 16 uses a fixture graph contribution here; Step 16 reruns it through installed fixture Extension loading. Rule 17 runs only when replay validation is requested. Agent Packs and adapters consume context assembly from Steps 10 and 12.

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

Read and round-trip the actual selected-pack configuration through the Step 1 loader. Missing or malformed configuration must not trigger silent pack selection, a second parser or replacement of the previous valid environment; repeat with the real resolved lock once Step 15 exists.

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

Repeat the Step 7 guard matrix through each mutating command (`/capture-intent`, `/approve-contract`, `/write-brief`, `/prepare-evidence`): stale graph or policy/config/lock base, record rewrite/removal/re-identification, core-edge replacement/removal, incomplete load and disallowed actor kind must not commit or partially write. Exercise the relevant valid control for each command through the same runtime API, rather than only asserting prompt text. An adapter running on behalf of an allowed human records that human attribution unchanged; a different well-formed identity of that allowed kind remains permitted. For `/approve-contract`, repeat reject/defer withdrawal, fresh re-authorisation over the last Contract in the withdrawn chain, existing-Contract re-selection refusal and missing-supersession refusal. No public API or adapter may bypass the checks already proved at Step 7.

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

Round-trip the created Core §54 paths and actual configuration through Step 1. A plain scaffold without a selected/resolved environment remains explicitly incomplete; it is not a healthy executable environment. An empty graph uses `specs/nodes/.gitkeep` (empty) and `edges: []`. Init creates the placeholder but never stages or commits it; the owner commits the scaffold, including `.gitkeep` and every required input, before requesting a reconstructible repository revision. An untracked empty directory is not reconstructible merely because git status is clean.

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

Load the actual lock and configuration formats through Step 1. Exercise malformed, absent and unsupported-version inputs and require explicit incomplete diagnostics, no successful environment identity and no replacement of valid generated state. This proves the real lock integration rather than only the Step 1 parse fixture.

### Step 16 — Implement transaction-safe Extension mechanics and one-shot init composition

**References:** Spec 02 sections 10–15 and one-shot initialisation.

**Run**

```text
Using fixture Extensions only, implement Spec 02 §11 manifest loading (including graph.format_version, registration export and declared storage/decoder/schema/projections), graph contribution registration, command namespaces, capability contribution and GitHub profile metadata. Do not invent a second installed-only declaration format.

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

Repeat S02/AC12–AC13 contribution controls through installed declarations: core/Extension and cross-owner endpoint collisions, duplicate node or relation ownership, reserved `core`, unsafe owner values and non-node canonical records. Repeat S03/AC06–AC13, including Extension cross-type supersession, all reverse/wrong-owner placements and a valid cross-graph tuple in its relation owner's `specs/extensions/<id>/edges.yml`. Missing decoder/schema/projection exports, escaping/overlapping storage declarations, unknown graph format versions and tampered graph implementation bytes must fail before activation, preserving the prior registry, lock and generated state. A changed implementation hash must affect environment identity; equal graph meaning still yields the same pg1. Repeat S04 exact-lineage and unaffected-Intent controls through the installed fixture loader.

Also repeat the Step 2 contribution-registration proof with an Extension-owned non-node canonical record lacking core envelope fields, plus a separately registered node projection. Repeat CP01-S03/AC06–AC13 through the installed loader, including core-name/constraint protection, valid two-way additional relations, wrong endpoint types, linear supersession, unknown active relations and ownership failures. Exercise Step 4 current lineage, competing records and withdrawn Contract behaviour with that composition; the Extension must not change core authority or lineage meaning.

Disable/remove and then re-enable the fixture: preserve inactive user-authored bytes, exclude inactive canonical contributions from the active graph revision, reject active references to inactive endpoints and validate all preserved state before reactivation. Do not infer unknown core-store data to be an inactive Extension. Any legacy Extension layout with ambiguous ownership requires an explicit migration disposition, never automatic deletion. These are installed-package integration results, not repeats of a mocked registry call.

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

Include partial-input diagnostics, preserved inactive Extension data, recognised migration-required formats and unavailable repository revision. The last is a warning for otherwise valid local graph inspection, but action required for a requested pinned execution/replay. An incomplete active load or required migration is action required for activation, never healthy. Prove each severity separately, with no repair, Git mutation or replay record from a preflight refusal.

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

Use a released `0.0.1` project with core records, an enabled fixture Extension's records in `specs/nodes/`, its tuples in `specs/graph/edges.yml`, configuration v1, lifecycle v1/stages and the unversioned lock. Exercise Spec 02 §15's named `released-0.0.1-to-owned-stores-v1` migration through new-runtime re-entry. Before explicit upgrade, ordinary load/validate/doctor report the recognised native/migration-required dispositions without writes. Migration preserves core IDs/content/actor attribution, moves only unambiguously owned Extension data to its declared owner root, preserves tuples, retains chosen component constraints and actor-kind settings, and writes an exact version-1 lock. A complete legacy source is permitted as migration input; arbitrary partial/current parse failures are not.

Require separate results for disabled/removed/ambiguous ownership, target collision, missing declared owner migration, malformed source, stale policy/base and forced write/validation/sync failure: each leaves no partial graph move and preserves recovery to the complete source environment. Include intentional empty/null-edge migration to `edges: []`, and non-Markdown core-store entries such as `.DS_Store` preserved with a prerequisite for explicit owner remediation, never silently discarded. Include a legacy scalar requiring value-preserving representation under the pinned YAML profile. Prove explicit rollback restores the recognised original layout/lock or fails recoverably before exposing new-format stores to the older runtime. Preserve historical `sha256:` provenance unchanged; do not relabel it `pg1:`. No old acceptance result is carried forward across a changed definition or revision protocol.

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

Then run validation/status and the complete core invariant suite through the assembled runtime, adapter and fixture Extension loader, including the strengthened Stage 1 cases and Step 12 guard/withdrawal/re-authorisation matrix.

**Expected result**

The full canonical Delivery lineage completes with alternatives/execution transcripts remaining non-canonical.

**Verify before continuing**

Inspect durable Project Graph state. Require all 17 validation cases, Evidence precondition failures, seven adapter mutation-boundary cases and complete core evaluation dimensions to pass before self-hosting.

Rerun the strengthened Stage 1 loading, record, edge, lineage and revision cases through the assembled runtime and installed fixture Extension. Include non-node canonical contributions, withdrawal/re-authorisation, actor-policy denial and no-write failure controls. Neither schema validation of these contract files nor their declared verifier IDs count as execution evidence.

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

### Step 28 — Publish the corrective release and prove a real released baseline

**References:** Implementation Guide npm release model; Spec 02 baseline evaluation.

`0.0.1` was published on 2026-09-01 against version 14 of this runbook, before
the corrections version 15 introduced. npm reserves a version number
permanently once used, so `0.0.1` cannot be re-cut; it stays on the registry
as the released baseline, which is what the comparison below needs.

Publish exactly:

```text
pactwright@0.0.2
@pactwright/standard@0.0.2
```

The npm trusted-publisher bootstrap was completed for `0.0.1`, so `release.yml`
already publishes both packages without a token. Tag accepted source as
`v0.0.2` and verify the tag workflow.

**Verify before continuing**

```bash
pnpm view pactwright@0.0.2 version
pnpm view @pactwright/standard@0.0.2 version

pnpm pactwright eval \
  --baseline @pactwright/standard@0.0.1 \
  --candidate @pactwright/standard@0.0.2
```

The comparison must resolve the published `0.0.1` baseline exactly and emit
per-capability/agent/case comparison results. A candidate whose behaviour is
unchanged may correctly report no regressions; the purpose is to prove the
real released-baseline path, not manufacture a difference.

## Stage 10 — Prove the published release on Kakeibo

Use the final Checkpoint 1 package on the persistent external proving project.

Kakeibo may still be a documentation-first/pre-implementation repository at this point. The only pre-Pactwright bootstrap permitted here is the minimum pnpm package/workspace root required to install a development dependency. Full Turborepo/application infrastructure belongs to Checkpoint 2.

### Step 29 — Establish the minimum Kakeibo consumer root and install `0.0.2`

**References:** Distribution §§2–3; Kakeibo Acceptance Profile §5; current Kakeibo 05 package/layer boundary

**Run**

From the Kakeibo repository root:

```bash
if [ ! -f package.json ]; then
  cat > package.json <<'JSON'
{
  "name": "kakeibo",
  "version": "0.0.0",
  "private": true
}
JSON
fi

if [ ! -f pnpm-workspace.yaml ]; then
  cat > pnpm-workspace.yaml <<'YAML'
packages:
  - "apps/*"
  - "packages/*"
YAML
fi

pnpm add -D pactwright@0.0.2
pnpm pactwright init
pnpm pactwright sync
pnpm pactwright validate
pnpm pactwright lifecycle status
```

If the repository already has `package.json` or `pnpm-workspace.yaml`, preserve the existing files and use their adopted package/workspace configuration rather than replacing them.

This step must not create application packages, Hono services, database code, R2/Workflow infrastructure or a Turborepo pipeline merely to install Pactwright.

**Expected result**

Kakeibo has the minimum consumer package root required by its future pnpm/Turborepo architecture and is running the final Checkpoint 1 package with core Delivery only; no optional extension is enabled.

**Verify before continuing**

- existing Kakeibo specs and repository-authored files are unchanged except for the intentional minimal package/workspace/bootstrap files and Pactwright-owned files;
- `pnpm pactwright validate` passes;
- `pnpm pactwright lifecycle status` passes;
- no CP2 application/infrastructure concern has been implemented early.

### Step 30 — Deliver the deterministic Kakeibo financial-domain foundation

**References:** Kakeibo Acceptance Profile §§3–5; current Kakeibo `02-financial-domain-model-spec.md`; current Kakeibo `05-system-architecture-and-data-spec.md` package/layer boundary; current Kakeibo `06-engineering-delivery-and-operations-spec.md` deterministic test expectations; Delivery Graph §19

**Run**

From the Kakeibo repository root:

```text
/capture-intent "Create Kakeibo's first executable deterministic financial-domain foundation in packages/domain from the current canonical Kakeibo specs. Cover FinancialEntry movement semantics; planning income; fixed commitments; Needs, Wants, Culture and Unexpected plan treatment; plan-funded versus tracking-only goals; goal allocation versus reviewed contribution; transfers, credit-card settlement and other non-spending movements; personal versus business scope; reviewed versus unreviewed truth; preparation-state independence; deterministic rule priority and first-match behaviour; split conservation; source identity and re-import idempotency; financial duplicate-candidate versus confirmed-duplicate semantics; and preservation of historical interpretation across plan, goal and rule changes. Add deterministic invariant tests with explicit numeric assertions where applicable. Keep the domain package free of Hono, Neon, Cloudflare, UI, analytics and provider dependencies. Do not introduce research-derived financial targets or recommendations."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

Then:

```bash
pnpm pactwright validate
pnpm pactwright lifecycle status
```

Run the Kakeibo repository-defined deterministic domain tests as part of the same acceptance step.

**Expected result**

The first Kakeibo executable slice represents `FinancialEntry` as the general financial concept rather than treating every entry as spending, and preserves at least these observable invariants:

```text
fixed commitments do not consume flexible envelopes
plan-funded goal allocations do not also consume a flexible envelope
transfers do not become spending because cash moved
credit-card settlement does not double-count tracked purchases
business activity does not consume personal envelopes
reviewed totals include only reviewed entries
preparation state does not create reviewed truth
rules/suggestions do not create reviewed truth
sum(split parts) = original amount
confirmed split parts replace the source amount in aggregates
source re-import idempotency ≠ financial duplicate resolution
goal allocation ≠ reviewed goal contribution
plan/goal/rule changes do not rewrite historical financial truth
```

The package remains deterministic and independent of application/API/storage/UI/provider concerns.

**Verify before continuing**

- `pnpm pactwright validate` and `pnpm pactwright lifecycle status` pass;
- the Kakeibo deterministic financial-domain tests pass with explicit numeric assertions where applicable;
- domain code has no Hono/Neon/Cloudflare/UI/analytics/provider dependency;
- no research-derived financial target is encoded as a default or recommendation;
- the approved Contract retains all applicable financial invariants through Brief, Delivery, Review and Evidence;
- the Kakeibo graph contains one valid Intent → Decision → Contract → Brief → Evidence lineage for the delivered financial-domain foundation.

## Stage 11 — Capture Checkpoint 1 feedback

Close the checkpoint's learning loop before declaring it complete.

### Step 31 — Capture Checkpoint 1 findings as future project work

**References:** Implementation Principles §§7, 14; Implementation Guide — Transition rule

**Run**

Review the execution of Stages 1–10, including bootstrap-fixture friction, self-hosting friction, Kakeibo installation/workspace bootstrap and onboarding problems, financial-invariant preservation, content gaps and any deviation between specification and implementation.

From the Pactwright repository root, for each finding worth acting on:

```text
/capture-intent "<finding phrased as a requested outcome>"
```

Project Intelligence does not exist yet, so findings are captured directly as Intents through normal Delivery (Implementation Principles §14). Leave the captured Intents open; they are future work, not part of this checkpoint's Delivery.

Blocking failures must instead be fixed within this checkpoint: repeat the affected stage's steps until its verification passes.

Do not generalise a Kakeibo-specific domain/product choice into Pactwright semantics unless it exposes a repeatable Pactwright responsibility failure.

**Expected result**

Every material Checkpoint 1 finding exists as an open Intent in the Pactwright graph, and no known blocking failure is carried into Checkpoint 2.

**Verify before continuing**

Run `pnpm pactwright validate` and `pnpm pactwright lifecycle status`; captured Intents are valid open lineages. Confirm no blocking failure remains unresolved.

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
- baseline/candidate evaluation reports meaningful per-dimension regressions and resolves the real released `@pactwright/standard@0.0.1` baseline;
- a clean packed consumer completes a full Delivery;
- Pactwright completes real self-hosted Delivery;
- public learning material matches shipped capability;
- `pactwright@0.0.2` and `@pactwright/standard@0.0.2` are registry verified, and `0.0.1` remains resolvable as the comparison baseline;
- `0.0.2` is published to npm and installs into Kakeibo;
- the `0.0.1` public content set (README Quick Start, Getting Started guide, core Delivery example) is delivered through Pactwright and included in the tagged release source;
- a documentation-first Kakeibo repository can establish the minimum consumer package/workspace root without prematurely building CP2 infrastructure;
- Kakeibo completes a real Intent → Evidence Delivery implementing the deterministic `packages/domain` financial foundation;
- the delivered financial foundation preserves the current `FinancialEntry`, review, movement, goal, split, duplicate, idempotency and history invariants required by the acceptance profile;
- Kakeibo domain code remains independent of Hono/Neon/Cloudflare/UI/analytics/provider concerns;
- repeated sync converges and graph coherence is not hand maintained;
- no known blocking failure is carried into Checkpoint 2.

---

**Pactwright — Checkpoint 1 — Self-Hosted Delivery v21**
