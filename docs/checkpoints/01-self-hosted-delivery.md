# Pactwright — Checkpoint 1 — Self-Hosted Delivery

**Version:** 31  
**Entry condition:** No installable Pactwright runtime exists.  
**Release:** `0.0.2` (corrective; `0.0.1` was published against version 12 of this runbook, the version tagged `v0.0.1`, and remains the released baseline)  
**Exit capability:** Pactwright is installable, upgradeable, can govern one complete Contract-driven Delivery in its own repository and in Kakeibo, can compare an Agent Pack candidate against a released baseline, and requires no manual Project Graph coherence work.

## 1. Goal

Bootstrap the smallest installable Pactwright core, prove it in a clean consumer, adopt it in Pactwright, publish the corrective `0.0.2`, then install the same release in Kakeibo and complete one real external Delivery.

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
docs/specs/07-open-source-project-organisation-spec.md
```

For this checkpoint:

```text
02 → financial-domain semantics
05 → package/layer boundary only
06 → deterministic test expectations only
07 → repository, licence and security foundation only
```

`00-kakeibo-acceptance-profile.md` §5 is the shared System-Level Acceptance cross-check for this slice, and §§2–5 carry the wider Kakeibo System-Level Acceptance requirements.

Retained August Kakeido Financial Model or Tech Stack research snapshots are not implementation authority.

This runbook defines implementation order, not new Pactwright semantics.

## 3. Execution contract

A converted step is defined by its YAML contract in [`01-self-hosted-delivery/`](./01-self-hosted-delivery/), in the format owned by [Spec 00](../specs/00-checkpoint-step-contract-and-delivery-tasks.md). The step section here links the contract and summarises its deliverables; the contract holds the requirements and acceptance criteria. Every contract inherits the settings and shared requirements in [`checkpoint.yml`](./01-self-hosted-delivery/checkpoint.yml), and [`crosswalk.yml`](./01-self-hosted-delivery/crosswalk.yml) records where each obligation of the replaced step prose went: version 17 for Stage 1, version 20 for Stage 2, version 21 for Stage 3, version 22 for Stage 4 and version 23 for Stage 5.

Stages 1–5 are converted to contracts. Stage 1 contracts are amended against Core v3 through the Q01–Q20 resolution pass, accepted by independent review 5298715756 and its correction review 5301803981 at `87bd3eb`, and reviewed as a whole under methodology §7 in [the Stage 1 exit record](../research-logs/2026-09-25-cp01-stage-1-exit-review.md). That record lists the corrections it applied, including the owner-directed Distribution §3 and pg1-fixture decisions, and the remaining non-blocking specification recommendations; independent review 5318255407 accepted those corrections at `f5e75db` and the record states Stage 1 requirement-ready. Stage 2 contracts are amended against Core v5 through the Q21–Q33 resolution pass, recorded in five [batch records](../research-logs/2026-09-25-cp01-stage-2-b7-shapes-and-identity.md) (B7–B11). The owner approved the Core §§27, 28, 32, 52, 53, 55 and 57 clauses, the two §4 scope lines and the Step 24 lifecycle-command obligation, and three further decisions from the stage-level exit review recorded in [the Stage 2 exit record](../research-logs/2026-09-25-cp01-stage-2-exit-review.md); independent review 5322976729 accepted that record's corrections at `ac370f2` and the record states Stage 2 requirement-ready. Stage 3 contracts are amended against Core v6 and Distribution v4 through the Q34–Q40 resolution pass, recorded in three [batch records](../research-logs/2026-09-25-cp01-stage-3-b12-agent-pack-format-and-selection.md) (B12–B14); the owning clauses are Distribution §§5, 8, 15, 21, 24 and Core §§35, 46, 55, and this pass added the Step 24 evaluation sentence below. The methodology §7 whole-stage review is recorded in [the Stage 3 exit record](../research-logs/2026-09-25-cp01-stage-3-exit-review.md), whose corrections X1–X19 were accepted by fresh independent review, and the record states Stage 3 requirement-ready. Stage 4 contracts are amended against Distribution v5 through the Q41–Q51 resolution pass, recorded in four [batch records](../research-logs/2026-09-26-cp01-stage-4-b15-init-and-scaffold.md) (B15–B18); the owning clauses are Distribution §§3, 10, 11, 12, 15, 16 and 27 and Implementation Guide command ownership, and this pass added the Step 29 selection command below and the env1 lock-hash grammar to CP01-S09/R06 and the version-listing request to CP01-S11/R08. The methodology §7 whole-stage review is recorded in [the Stage 4 exit record](../research-logs/2026-09-26-cp01-stage-4-exit-review.md). Stage 5 contracts are amended against Implementation Guide v18 through the Q52–Q56 resolution pass, recorded in three [batch records](../research-logs/2026-09-26-cp01-stage-5-b19-ci-coverage-and-triggers.md) (B19–B21); the owning clauses are the Guide's GitHub Actions, package metadata, npm release model, trusted release workflow and release failure sections. Q54's renumbering of the Guide's version tables and of Checkpoints 2–9 (Checkpoint 2 → `0.0.3` through Checkpoint 9 → `0.0.10`) was authorised by the owner and applied in the same pass. The methodology §7 whole-stage review is recorded in [the Stage 5 exit record](../research-logs/2026-09-26-cp01-stage-5-exit-review.md). Stages 6–11 (Steps 22–31) remain in the version 17 form below, which the owner has decided they keep; they were reviewed under Spec 00 T2 against Implementation Guide v19 and amended in place through the Q57–Q66 resolution pass, recorded in six [batch records](../research-logs/2026-09-27-cp01-stages-6-11-b22-packed-consumer-proofs.md) (B22–B27). The same pass declared the checkpoint-wide self-hosting, graph-boundary, simplicity and exit-gate obligations `CP01/R02`–`R05` in [`checkpoint.yml`](./01-self-hosted-delivery/checkpoint.yml), and its methodology §7 review is recorded in [the Stages 6–11 exit record](../research-logs/2026-09-27-cp01-stages-6-11-exit-review.md). Steps in this form are:

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
- A persisted lifecycle-shape or extended-policy configuration format beyond lifecycle `version: 1`: Checkpoint 1 exercises richer shapes through runtime fixture definitions only.
- A capability invoker that lets `pactwright lifecycle run` call an AI provider itself: Checkpoint 2, where workflows continue lifecycle execution through `lifecycle run`. In Checkpoint 1, AI work runs through the adapter commands, and `lifecycle run` stops with an execution failure at a capability-backed responsibility when no invoker is supplied.
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

Gate state and executable policy arrive with Step 6. Step 4 derives exact recorded Decision/Contract lineage, not permission to execute; Steps 6, 7 and 9 enforce and diagnose actor-kind policy compatibility. Attribution is not identity-provider authentication. Approval outside a Decision cannot act as Decision authority.

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
- `execution-state` — Fine-grained lifecycle execution state for a Brief, held outside the Project Graph, identifying the current Brief, resolved shape, current and completed steps, Gate state, iteration counts and execution status, written through the runtime's serialised mutation boundary that Step 7 extends to canonical mutations.

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
- `lifecycle-run` — A pactwright lifecycle run that executes automatic responsibilities through the resolved shape and policy until a required Gate, a manual responsibility, a blocked Review outcome, completion, execution failure or validation failure.

Agent Pack capabilities arrive in Step 10 and adapter commands in Step 12; Step 24 completes a full Delivery through them. Execution progress stays outside the Delivery Graph.

### Step 9 — Implement the complete core validation contract and bounded context assembly

**Contract:** [`CP01-S09`](./01-self-hosted-delivery/CP01-S09.yml)

**Deliverables**

- `validate-command` — A read-only pactwright validate implementing the complete Core §57 minimum detection contract without repairing state.
- `context-assembly` — A runtime context-assembly API giving Agent Packs and adapters bounded current Contract/Brief lineage context, with a namespaced contribution seam for later Extensions.

Rule 16 uses a fixture graph contribution here; Step 16 reruns it through installed fixture Extension loading. Rule 17 runs only when replay validation is requested. Agent Packs and adapters consume context assembly from Steps 10 and 12.

## Stage 3 — Add replaceable AI execution

### Step 10 — Implement core capabilities and `@pactwright/standard`

**Contract:** [`CP01-S10`](./01-self-hosted-delivery/CP01-S10.yml)

**Deliverables**

- `core-capabilities` — The core capability identities delivery-specification, delivery-execution and delivery-review, and the runtime capability check that a candidate Agent Pack implements each required capability.
- `agent-pack-loading` — Runtime loading and validation of an Agent Pack's capability mappings, agents, prompts and direct skills, independent of the pack's identity.
- `standard-agent-pack` — @pactwright/standard, a separate publishable Agent Pack package that implements the three core capabilities without owning graph or lifecycle semantics.

Step 11 repeats the incomplete-pack proof through `agent-pack use`. Step 22 packs `@pactwright/standard` for clean consumers and Step 28 publishes it. External Production Skills imports remain unsupported until Checkpoint 5.

### Step 11 — Implement Agent Pack selection and upgrade

**Contract:** [`CP01-S11`](./01-self-hosted-delivery/CP01-S11.yml)

**Deliverables**

- `agent-pack-use` — A pactwright agent-pack use <source> that explicitly selects one compatible complete Agent Pack from a package name, optionally versioned, or a pack path, obtains a package it needs through the project package manager, and updates configuration and lock only after successful resolution and validation.
- `agent-pack-upgrade` — A pactwright agent-pack upgrade that upgrades the selected pack within its configured compatibility constraints through the project package manager without changing its identity.
- `package-manager-delegation` — The runtime's single package-manager delegation seam, detecting the project package manager under the DISTRIBUTION#15 rule and issuing its install, request-at-constraint, exact-restore, removal and isolated-acquisition requests, reused by later steps that need packages.

Step 15 repeats the configuration proof with the real resolved lock and Step 17 the sync, Step 14 reuses this selection path for one-shot init, and Step 23 runs `agent-pack use` against installed packed artefacts; real package replacement by `agent-pack upgrade` is proven at Checkpoint 2's component-upgrade step.

### Step 12 — Implement the seven canonical Claude Code adapter commands

**Contract:** [`CP01-S12`](./01-self-hosted-delivery/CP01-S12.yml)

**Deliverables**

- `claude-code-adapter` — Deterministic rendering of Pactwright-managed Claude Code agents and the seven canonical commands from the resolved environment into Pactwright-owned files under .claude/.
- `adapter-commands` — The seven commands /capture-intent, /propose-contracts, /approve-contract, /write-brief, /deliver-brief, /review and /prepare-evidence, each invoking runtime responsibilities and the selected pack's capabilities within runtime-enforced mutation boundaries.
- `runtime-hand-off` — The Pactwright-owned hand-off commands under pactwright lifecycle through which a rendered command dispatches a responsibility and hands its structured result to the runtime, recording dispatch and completion of Delivery and Review steps in execution state.

The command decomposition does not define lifecycle topology. Step 12 repeats the Step 7 guard, withdrawal and re-authorisation matrix through each mutating command; Step 24 completes a full Delivery through the generated adapter.

### Step 13 — Implement Pactwright evaluation and baseline comparison

**Contract:** [`CP01-S13`](./01-self-hosted-delivery/CP01-S13.yml)

**Deliverables**

- `eval-command` — A pactwright eval that runs core responsibility evaluation against the resolved AI execution environment, keeping deterministic assertions separate from semantic judgement.
- `core-eval-cases` — Core-owned evaluation cases for Contract fidelity, scope discipline, Brief quality, Review quality and defect detection, Evidence accuracy and lifecycle compliance, plus required output structure and forbidden mutation.
- `baseline-comparison` — A pactwright eval --baseline --candidate comparison that resolves both sides exactly and reports regressions by capability, agent, case and changed environment component.

Step 13 proves comparison with exact fixture and pinned package inputs and exercises the cases through scripted invokers and judges; Checkpoint 1 supplies no provider invoker, so the command-line eval reports its cases as not evaluated. Step 28 resolves the real released `@pactwright/standard@0.0.1` baseline.

## Stage 4 — Implement exact environment resolution and local composition

### Step 14 — Implement `pactwright init` with explicit Agent Pack selection

**Contract:** [`CP01-S14`](./01-self-hosted-delivery/CP01-S14.yml)

**Deliverables**

- `init-command` — A pactwright init that gives a repository only Pactwright-owned core configuration and Project Graph structure, reported as an incomplete scaffold until an Agent Pack is explicitly selected.
- `init-pack-selection` — The init --agent-pack <source> option, through which initialisation obtains an explicit compatible Agent Pack choice in the agent-pack use source grammar, resolved and validated through the agent-pack use selection path rather than a second resolver.

Step 16 reuses the selection input for one-shot init with a fixture Extension, and Step 23 repeats it with packed artefacts.

### Step 15 — Implement config/lock agreement and `environment_lock_hash`

**Contract:** [`CP01-S15`](./01-self-hosted-delivery/CP01-S15.yml)

**Deliverables**

- `environment-lock` — Resolution of the exact Pactwright execution environment, covering the runtime, the selected Agent Pack and its resolved agents and direct skills, into the version 1 .pactwright/lock.yml.
- `lock-agreement` — A check that the package-manager lock and .pactwright/lock.yml agree on every runtime and package-backed component version they both identify, applied before a new environment is accepted.
- `environment-lock-hash` — A deterministic environment_lock_hash derived from the exact resolved lock state, forming the shared replay base with the repository and Project Graph revisions.

Step 16 adds package-backed fixture Extensions to the lock and repeats the agreement proof. External Production Skills resolution remains a Checkpoint 5 capability.

### Step 16 — Implement transaction-safe Extension mechanics and one-shot init composition

**Contract:** [`CP01-S16`](./01-self-hosted-delivery/CP01-S16.yml)

**Deliverables**

- `extension-loading` — Loading of installed fixture Extension packages through the Distribution §11 manifest, covering graph.format_version, the registration export, declared storage, decoders, schemas and projections, graph contribution registration, command namespaces, capability contribution and GitHub profile metadata.
- `extension-commands` — pactwright extension add, disable, remove and upgrade, which install, deactivate, remove and upgrade fixture Extensions and their dependencies transactionally, with exact locking, declared versioned migrations and preserved user-authored data.
- `one-shot-init` — A pactwright init --with <extension> that composes normal init, explicit Agent Pack selection through --agent-pack, normal Extension installation and sync, producing the same state as the equivalent separate operations.

Step 16 repeats the Step 2 to 5 and Step 9 proofs through the installed fixture Extension loader. First-party Extensions and `--github` reuse this composition in later checkpoints. Step 23 repeats one-shot init with packed artefacts.

### Step 17 — Implement deterministic `pactwright sync`

**Contract:** [`CP01-S17`](./01-self-hosted-delivery/CP01-S17.yml)

**Deliverables**

- `sync-command` — A deterministic pactwright sync that validates the configured and locked composition, including enabled fixture Extensions and the selected Agent Pack with its direct skills, and renders only Pactwright-managed local integration.

Step 17 repeats the Step 11 selection sync and Step 12 rendering through real sync. Step 23 requires a clean second sync in a packed consumer.

### Step 18 — Implement `pactwright doctor`

**Contract:** [`CP01-S18`](./01-self-hosted-delivery/CP01-S18.yml)

**Deliverables**

- `doctor-command` — A read-only pactwright doctor that diagnoses runtime, package-manager, configuration, lock, capability, migration, generated-drift and validation problems as healthy, warning or action required, with deterministic remediation commands where known.

Step 19 relies on doctor to report released `0.0.1` projects as migration required before upgrade.

### Step 19 — Implement Pactwright runtime upgrade and rollback-safe failure

**Contract:** [`CP01-S19`](./01-self-hosted-delivery/CP01-S19.yml)

**Deliverables**

- `runtime-upgrade` — pactwright upgrade and pactwright upgrade --to <version>, which replace the runtime through the detected project package manager, re-enter through the new runtime as a child process and, through the upgrade recovery record, leave the environment valid at the target, runtime-ahead of components that pin an older runtime, or recoverable to the previous runtime, except that the entry from a runtime without this protocol, whose package was replaced before any record existed, recovers only the previous stores under the installed runtime.
- `released-format-migration` — The named released-0.0.1-to-owned-stores-v1 migration, which moves a complete released 0.0.1 project to owner-separated stores and the version 1 lock without partial moves, and writes a legacy-closure execution-state document for each Brief with current Evidence and no execution-state document.

Step 19 proves upgrade with packed fixture runtimes. Step 28 publishes the corrective `0.0.2` release.

## Stage 5 — Establish repository CI and release safety

### Step 20 — Implement repository verification workflow

**Contract:** [`CP01-S20`](./01-self-hosted-delivery/CP01-S20.yml)

**Deliverables**

- `ci-workflow` — A repository-owned .github/workflows/ci.yml that runs the root pnpm verify gate on a clean GitHub-hosted checkout under the Implementation Guide hardening rules.

Step 25 requires this CI to pass for the self-hosted repository. `pactwright sync` leaves the workflow untouched (CP01-S17/AC02).

### Step 21 — Implement trusted release workflow

**Contract:** [`CP01-S21`](./01-self-hosted-delivery/CP01-S21.yml)

**Deliverables**

- `release-workflow` — A repository-owned .github/workflows/release.yml that publishes the accepted tagged source of pactwright and @pactwright/standard through npm trusted publishing and verifies the registry result.

Step 21 validates the workflow without publishing. Step 28 runs it on the `v0.0.2` tag, the first publish through trusted publishing, and verifies the registry.

## Stage 6 — Prove packed consumer behaviour

### Step 22 — Pack runtime and standard Agent Pack

**References:** Implementation Guide — Package metadata, Test layers; Distribution §5; OSS §§6, 25

**Run**

From a clean checkout of the candidate revision with no prior build output:

```bash
pnpm pack --out /tmp/pactwright-checkpoint-1.tgz
pnpm --filter @pactwright/standard pack --out /tmp/pactwright-standard-checkpoint-1.tgz
```

`prepack` builds each package. From the same checkout, also pack the two fixture Extension packages of the repository test suite that later steps install: the fixture Extension used for one-shot init in Step 23 and the defective fixture Extension used for validation rule 16 in Step 24. They are test assets, packed into their own archives and never published. Record the candidate revision and, for each of the four archives, its sorted list of entry paths with the SHA-256 of each entry; that list is the archive's identity. Steps 23 and 24 install exactly these archives. Steps 26 and 27 re-run this procedure on their own candidate revisions and record their own identities; an archive is never reused for a changed revision. Step 28 publishes through the release workflow, which packs the tagged source itself.

**Expected result**

Real consumer artefacts exist for both components, packed from one recorded revision, together with the two fixture Extension archives the consumer fixtures need.

**Verify before continuing**

Inspect the four archives:

- each archive's manifest names its package and version, and the two published archives carry the same version;
- every declared `main`, `types`, `bin` and `exports` target resolves inside its archive;
- the runtime archive holds only the built runtime, its manifest, `LICENSE` and `README.md`; the pack archive holds only `dist`, `pack.yml`, `agents`, `skills`, its manifest, `LICENSE` and `README.md`; neither holds a test, fixture, checkpoint contract, Project Graph record, configuration, execution-state or source file;
- the runtime manifest depends on `@pactwright/standard` at the exact version of the pack archive, rewritten from `workspace:*`, never a range, dist-tag or workspace reference;
- each fixture Extension archive holds only its own package and declares no dependency outside the runtime, and neither fixture Extension appears in either published archive;
- repacking the same revision yields the same identity for every archive, and a revision that changes one packaged file changes only that archive's identity.

### Step 23 — Install and initialise clean consumer fixtures

**References:** Distribution §§3, 5, 10, 14, 16; Implementation Guide — Test layers, Execution location

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

A clean repository is a fresh Git repository in a temporary directory, created with `pnpm init`, with no workspace link, path dependency or global installation that reaches the source repository. Install the runtime archive as a development dependency. Until Step 28 publishes, the runtime's exact dependency on `@pactwright/standard` cannot resolve from the registry, so the pack archive is supplied through a local-package override; record it; it is the fixture's only deviation from a published consumer. `agent-pack use @pactwright/standard` resolves the pack from the runtime's own dependencies and makes no package-manager request. Every command runs the installed package's entry point from the fixture's `node_modules`, never the source repository's build.

In a second clean fixture, prove one-shot init with a fixture Extension and explicitly supply the same compatible packed Agent Pack source/version through the documented init selection input. Compare against the equivalent explicit operations; pack installation alone is not pack selection.

The one-shot command is `pnpm pactwright init --with <fixture-extension-id> --agent-pack @pactwright/standard@<archive version>`. The fixture Extension is the one-shot fixture Extension archive Step 22 recorded, installed through the same override; it is never part of either published archive. The equivalent explicit operations run in a third clean fixture: `init`, `agent-pack use` with the same source and version, `extension add <fixture-extension-id>` and `sync`.

In a fourth clean fixture with the runtime, pack and fixture Extension installed, prove the negative, in this order: `init --with <fixture-extension-id>` without `--agent-pack` is refused and leaves the fixture byte-identical; plain `init` then selects no pack and reports an unactivated scaffold; `sync` and `lifecycle run` then refuse naming the missing selection.

Keep the explicit-path fixture in its recorded state; Step 24 starts from it.

**Expected result**

A repository becomes a valid Pactwright consumer from packed artefacts only, and one-shot init does not create a divergent setup or silently select a pack.

**Verify before continuing**

- `init` creates only the scaffold; `agent-pack use` locks the configured source, the archive's exact version and content hash with no package-manager request; `doctor` exits zero reporting healthy; `validate` exits zero; `lifecycle status` reports no lineage, blocked at `capture-intent` with required actor human;
- a second `sync` in each fixture changes no file;
- the one-shot and explicit fixtures hold byte-identical configuration, lock, canonical stores and generated files, with the Extension enabled and locked;
- the negative cases behave as stated;
- no command loaded a module from the source repository;
- the evidence records, per fixture, the archive identities, Node and pnpm versions, `.pactwright/lock.yml` and `environment_lock_hash`.

### Step 24 — Complete one full fixture Delivery

**References:** Core §§3, 8, 9, 27, 44, 46–53, 57; Distribution §§14, 21; Implementation Principles §10

**Run**

Use the generated adapter to complete:

```text
Intent → Contract alternatives → authorised Decision → Contract → Brief → Delivery → Review → Evidence
```

In the Step 23 explicit-path fixture, run the seven commands in order through the Claude Code adapter session the run configuration names, recording its provider, model, skill and selected-pack identities. This is Checkpoint 1's first execution of the pack's agents by a real model; no scripted result stands in for an agent. The Intent is "Create one small repository artefact that proves the complete Pactwright Delivery lifecycle." `/approve-contract` runs under the fixture's released policy, manual with actor kind human: the approving human the run configuration names selects the alternative and is recorded unchanged as `decided_by`; the policy is not edited to admit another actor.

Then run validation/status and the complete core invariant suite through the assembled runtime, adapter and fixture Extension loader, including the strengthened Stage 1 cases and Step 12 guard/withdrawal/re-authorisation matrix.

The complete core invariant suite is a fresh execution, on the revision Step 22 packed, of these accepted criteria: CP01-S09/AC01, AC03, AC04 and AC06; CP01-S07/AC12 and AC13; CP01-S12/AC02, AC03, AC04, AC06, AC08 and AC10; CP01-S13/AC01 to AC07; every automated criterion of CP01-S02 to CP01-S05; and CP01-S16/AC10 to AC13 and AC17, which carry the Stage 1 cases through the installed fixture Extension.

**Expected result**

The full canonical Delivery lineage completes with alternatives/execution transcripts remaining non-canonical.

The fixture graph holds exactly one lineage of five records and their `resolves`, `selects`, `decomposes` and `evidences` edges, deriving done. Execution state lives under `.pactwright/`, and `project_graph_revision` changed only when a record or edge was written. The delivered artefact exists, and the Evidence names it and the closing Review.

**Verify before continuing**

Inspect durable Project Graph state. Require all 17 validation cases, Evidence precondition failures, seven adapter mutation-boundary cases and complete core evaluation dimensions to pass before self-hosting.

Run `pactwright lifecycle status`, `next` and `run` on the fixture consumer at each lineage position. `run` must stop cleanly at manual entries and, for capability-backed automatic responsibilities, with the missing-invoker execution failure; it must not simulate any output. The consumer's lifecycle `version: 1` cannot declare Gates, corrective routes or iteration bounds, so validation rules 10, 11, 14 and 15 are proven by the repository test suite against the built runtime through the Step 6 fixture definitions; the packed consumer proves the other validation rules, and the published package exposes no fixture-definition entry point.

Under the released policy the positions and stops are: with no lineage, `run` stops at the manual `capture-intent`; at open, contracted, the Delivery step, the Review step and the closure step after a closing Review with outcome may-progress, it stops with the missing-invoker execution failure at `propose-contracts`, `write-brief`, `deliver-brief`, `review` and `prepare-evidence` respectively; at done it performs no step. With no lineage, `status` reports what the Step 23 verify states and `next` names `capture-intent` with required actor human; at the closure position, `status` reports the closure step as current and `next` names `prepare-evidence`, the shape step, as CP01-S08/AC01's "shape step otherwise" branch gives, although AC01 lists no closure case; at every other position `status` and `next` report what CP01-S08/AC01 defines. No position changes a canonical file.

The packed consumer proves validation rules 1–9, 12, 13, 16 and 17 through the installed CLI, each on a copy of the fixture whose only defect is that rule's; rule 16 uses the defective fixture Extension archive Step 22 recorded and rule 17 a replay-base document. The seven mutation-boundary cases are the cases of CP01-S12/AC03, and the Evidence precondition failures are the cases of CP01-S12/AC10 other than `pending-gate`, which version 1 policy cannot express; each runs through the installed CLI's hand-off commands with scripted results.

The complete core evaluation dimensions are proven by the repository test suite against the built runtime through scripted invokers and judges; `pnpm pactwright eval` on the fixture consumer reports every case as not evaluated, names no invoker and exits with failure, since Checkpoint 1 supplies no provider invoker, and it simulates no result.

Rerun the strengthened Stage 1 loading, record, edge, lineage and revision cases through the assembled runtime and installed fixture Extension. Include non-node canonical contributions, withdrawal/re-authorisation, actor-policy denial and no-write failure controls. Neither schema validation of these contract files nor their declared verifier IDs count as execution evidence.

Withdrawal and re-authorisation are CP01-S12/AC06, actor-policy denial CP01-S09/AC04 and CP01-S12/AC04 `disallowed-actor-kind`, and the no-write failure controls CP01-S12/AC04; each result names the revision it ran on. Independent review confirms that the Evidence's statements match the artefact and the Review, and that every result is an executed observation on the packed revision. The fixture Contract's approval is recorded as an approval by the named human.

## Stage 7 — Adopt Pactwright in Pactwright

### Step 25 — Initialise the Pactwright repository

**References:** OSS §16; Implementation Principles §§3, 11; Distribution §§3, 5, 12, 14; Core §§54, 56; Implementation Guide — GitHub Actions, Repository changes

**Run**

Start from the candidate revision, which holds no Pactwright project state. The self-hosted records, configuration and unversioned lock on the default branch before the candidate lands are not migrated or copied; they remain Git history. The repository owner approves this project-state boundary before the step runs.

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

The repository-local CLI runs the built package entry point. `agent-pack use @pactwright/standard` resolves the workspace package `packages/standard` through the project's installed packages with no package-manager request, and records the pack's exact version and content identity. The `pactwright` package is not added as a dependency of its own repository.

With the pack installed as a workspace link, the package-manager lock identifies no pack version, so lock agreement rests on the runtime version and on the pack's recorded content identity. After any change to `packages/standard`, `doctor` reports action required and `sync` refuses until `agent-pack use @pactwright/standard` re-resolves the pack and records its new identity.

Land self-hosting state through the repository process available before Checkpoint 2 product GitHub integration exists.

That process is a pull request that the repository owner merges with `CI / Verify` succeeding on the pull request and on the resulting default-branch commit, which is the first real default-branch run of the Step 20 workflow. Configuration keeps GitHub disabled and no Pactwright-generated workflow exists; the default branch's required-check state is recorded in the run configuration.

**Expected result**

Pactwright is now a valid Pactwright project.

The acceptance of this step is Checkpoint 1's self-hosting threshold: from it, checkpoint requirement `CP01/R02` applies to every later step and every corrective re-run.

**Verify before continuing**

Second sync is clean and repository CI passes.

- the self-hosting commit adds only Pactwright-owned files: `.pactwright/config.yml`, `lifecycle.yml` and `lock.yml`, `specs/nodes/.gitkeep`, `specs/graph/edges.yml` and the rendered files under `.claude/`, with no execution-state document, report or hand-written Pactwright-owned file;
- `doctor` exits zero reporting healthy and `validate` exits zero; after the merge, the repository revision resolves to the default-branch commit and the Project Graph revision is the pg1 empty-graph digest;
- an independent resolution of the environment yields a lock byte-identical to the committed one;
- in a disposable copy of the initialised repository, never committed, editing one prompt under `packages/standard` makes `doctor` report action required and `sync` refuse, and `agent-pack use @pactwright/standard` then records the new identity, after which `doctor` reports healthy.

### Step 26 — Deliver a real self-hosted Quick Start improvement

**References:** Spec 08 Core Delivery public milestone (OSS §24); OSS §§16–18; Implementation Principles §7; Implementation Guide — Public-content authority before Project Intelligence, npm release model

**Run**

Use Pactwright itself to improve the Quick Start based only on behaviour proven in this checkpoint.
Before PI exists, identity/positioning/product choices required by this public work must be authorised through Decision + Contract rather than invented.

Run the seven commands through the adapter in the self-hosted project. The repository owner is the approving human: the Decision selects a Contract that states the claims, positioning and proven behaviour the Quick Start may use, and a claim the Contract does not authorise is a Review failure. Proven behaviour is a command or behaviour with an accepted Checkpoint 1 criterion result or Step 23 or 24 packed-consumer evidence; this step's own clean-fixture execution below confirms that proven set on this revision and adds nothing to it. The install instruction names `pactwright@0.0.2` exactly, because `latest` stays at `0.0.1` until `0.1.0` (Implementation Guide — npm release model). The Quick Start documents no Extension, GitHub integration, Project Intelligence or provider-invoking `lifecycle run` as available. The change lands through a pull request the owner merges with `CI / Verify` passing.

**Expected result**

Pactwright completes a real public-product change through itself.

**Verify before continuing**

Evidence and public instructions agree with clean-consumer behaviour.

Follow the Quick Start in a clean fixture built by the Step 23 procedure from archives packed from this revision, with the exact-version install mapped to them: every instruction produces its documented result. Every command the Quick Start names is in the proven set. The lineage validates and derives done, the owner is recorded as decider, the README changed only during the Delivery step, and `pnpm verify` passes.

## Stage 8 — Complete the `0.0.2` public learning path

### Step 27 — Deliver Core Delivery learning material

**References:** OSS §§3, 11, 14, 24; Implementation Principles §14; Implementation Guide — Public-product progression; Distribution §27

Through normal Pactwright Delivery, produce/update:

```text
README Quick Start
Getting Started guide
one executable Core Delivery example
```

Only document proven behaviour, including the core distribution commands shipped in `0.0.2`.

Proven behaviour and the approving owner are as in Step 26. The Getting Started guide lives at `docs/getting-started.md`, linked from the README, and the example at `examples/core-delivery/README.md`. Across the three documents the material covers the Distribution §27 surface a core user needs, installation, initialisation by `init --agent-pack` and by `init` followed by `agent-pack use` and `sync`, `doctor`, `validate`, `pactwright upgrade` and `upgrade --to` and `agent-pack upgrade`, together with the Core §46 commands: `lifecycle status`, the seven adapter commands with the mutation each is permitted, and the honest posture of `lifecycle run` and `eval` without an invoker. It documents no Extension, GitHub integration or Project Intelligence as available. Every install instruction names `pactwright@0.0.2` exactly. The material and its lineages land on the default branch through pull requests the owner merges with `CI / Verify` passing, before Step 28 tags the release.

**Expected result**

A new user can understand/install/execute/upgrade `0.0.2` without future Extensions.

**Verify before continuing**

Follow the material in a clean packed-consumer fixture.

Each lineage validates and derives done with the owner recorded as decider, and the documents changed only during Delivery steps. The fixture is built by the Step 23 procedure from archives packed from this revision, with the exact-version install mapped to them. Every command runs as documented; the example ends with `validate` exiting zero on a done lineage; `pactwright upgrade` reports no compatible newer release and `agent-pack upgrade` reports nothing changed. Every command the material names exists in the shipped CLI, and README, guide and example agree on one command surface. A reviewer given only the shipped material installs, completes one Delivery and upgrades without outside knowledge; any point where outside knowledge was needed is a content gap that fails the step.

## Stage 9 — Publish `0.0.2`

### Step 28 — Publish the corrective release and prove a real released baseline

**References:** Implementation Guide — npm release model, Preparing a development release, Trusted release workflow, Release failure; Spec 02 §§15, 24 (baseline evaluation)

`0.0.1` was published on 2026-09-01 against version 12 of this runbook, the
version tagged `v0.0.1`, before the corrections later versions introduced. npm reserves a version number
permanently once used, so `0.0.1` cannot be re-cut; it stays on the registry
as the released baseline, which is what the comparison below needs.

Publish exactly:

```text
pactwright@0.0.2
@pactwright/standard@0.0.2
```

Both `0.0.1` versions were published interactively on 2026-09-01 and the
`v0.0.1` run of `release.yml` published nothing, so the `v0.0.2` run is the
first publish through trusted publishing and its provenance attestations are
the first evidence of the trusted-publisher entries. Tag accepted source as
`v0.0.2` and verify the tag workflow, its `npm-release` deployment record and
each published version's provenance attestation (CP01-S21/R04).

Prepare the release through a release pull request (Implementation Guide — Preparing a development release): every publishable version at `0.0.2`, the lockfile refreshed, `pnpm verify` and the publish dry-run passing, and the `CHANGELOG.md` entry dated and written from accepted work only: work delivered after Step 25's acceptance cites its Evidence in the source that will be tagged, and work accepted up to and including Step 25's acceptance is described from its accepted step or criterion results; the entry cites no Evidence outside the tagged Project Graph. The pull request changes nothing else and the owner merges it with `CI / Verify` passing. The owner's push of `v0.0.2` to the merged release commit is the publish authority. The tagged tree holds the README Quick Start, `docs/getting-started.md`, `examples/core-delivery/README.md` and the Step 26 and 27 Evidence records. Nothing is published interactively.

Before any publication, a failed run is fixed and rerun, and a tag that published nothing may be deleted and recreated by the owner on the corrected commit. After a publication the version is consumed: a defect in the published `0.0.2` is fixed forward with the next unused `0.0.x` under an owner-approved amendment of this checkpoint's Release line, the Implementation Guide's version tables and later checkpoints' Release lines (Implementation Guide — Release failure), never by unpublishing, overwriting or moving `latest`.

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

- the tag run succeeded through registry verification with its `npm-release` deployment record; each published version carries a provenance attestation naming this repository and workflow; each package lists exactly `0.0.1` and `0.0.2`, with `next` at `0.0.2` and `latest` at `0.0.1`;
- the comparison runs from the Pactwright repository root; it acquires the baseline through the package-manager delegation seam into an isolated location, leaving the project's packages and locks byte-identical; records the baseline's exact version and content hash and the candidate's; reports the baseline's declared runtime `0.0.1` as an incompatible component; with no invoker, reports every candidate-dependent assertion as not comparable and names no invoker or judge; lists the changed agent, prompt and skill components and no regression; exits zero; and writes its report only to standard output or a named path;
- in a clean fixture outside the workspace, `pnpm add -D pactwright@0.0.2` installs the runtime and pack from the registry with no override, and the Step 23 explicit path passes.

## Stage 10 — Prove the published release on Kakeibo

Use the final Checkpoint 1 package on the persistent external proving project.

Kakeibo may still be a documentation-first/pre-implementation repository at this point. The only pre-Pactwright bootstrap permitted here is the minimum pnpm package/workspace root required to install a development dependency. Full Turborepo/application infrastructure belongs to Checkpoint 2.

The Kakeibo owner authorises writes to the Kakeibo repository and every commit to its default branch in Steps 29 and 30. The run configuration names the Kakeibo repository and its starting revision, and Step 29 records the revisions of Kakeibo `docs/specs/README.md` and the 02, 05, 06 and 07 specifications, which govern this stage.

### Step 29 — Establish the minimum Kakeibo consumer root and install `0.0.2`

**References:** Distribution §§2–3, 5, 14, 16; Kakeibo Acceptance Profile §§2, 4, 5; current Kakeibo 05 package/layer boundary; current Kakeibo 07 §§20, 35, 37, 49; Implementation Guide — Kakeibo acceptance model, Execution location

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

pnpm add -D -w pactwright@0.0.2
pnpm pactwright init
pnpm pactwright agent-pack use @pactwright/standard
pnpm pactwright sync
pnpm pactwright validate
pnpm pactwright lifecycle status
```

pnpm refuses `pnpm add` at a workspace root without `-w`, which the bootstrap `pnpm-workspace.yaml` makes the Kakeibo root.

If the repository already has `package.json` or `pnpm-workspace.yaml`, preserve the existing files and use their adopted package/workspace configuration rather than replacing them.

This step must not create application packages, Hono services, database code, R2/Workflow infrastructure or a Turborepo pipeline merely to install Pactwright.

`pnpm add -D -w pactwright@0.0.2` installs from the registry with no override; `agent-pack use` resolves the pack from the runtime's dependencies at exactly `0.0.2`. An existing `pnpm-workspace.yaml` stays byte-identical. An existing `package.json` keeps all its content apart from the development-dependency and `packageManager` fields the package manager writes. If `.gitignore` has no rule for `node_modules/`, add one.

Record, without creating any of them, whether the starting revision holds each of the following public-repository foundation items, which Kakeibo Acceptance Profile §5 lists and Kakeibo 07 §§20, 35, 37 and 49 require; the other 07 §49 items, such as CI and Kei assets, belong to later checkpoints: `README.md`, a `LICENSE` with the Apache-2.0 text, `SECURITY.md` with a private disclosure route, `CONTRIBUTING.md`, the canonical `docs/specs/` authority set, working deterministic tests and safe synthetic financial fixtures. If the canonical `docs/specs/` authority set is absent, Stage 10 pauses: specifications are the authority for Step 30, not its output. Step 30 delivers every other absent item.

**Expected result**

Kakeibo has the minimum consumer package root required by its future pnpm/Turborepo architecture and is running the final Checkpoint 1 package with core Delivery only; no optional extension is enabled.

**Verify before continuing**

- existing Kakeibo specs and repository-authored files are unchanged except for the intentional minimal package/workspace/bootstrap files and Pactwright-owned files;
- `pnpm pactwright validate` passes;
- `pnpm pactwright lifecycle status` passes;
- no CP2 application/infrastructure concern has been implemented early;
- `pnpm pactwright doctor` exits zero reporting healthy; `pactwright` and `@pactwright/standard` are installed at exactly `0.0.2` with the published content identities, and the lock records them with an `environment_lock_hash`;
- the changed or added paths are exactly the bootstrap files where created, the package manifest fields and lockfile the package manager wrote, a `node_modules` ignore rule where absent, and the Pactwright-owned files; configuration enables no Extension and keeps GitHub disabled;
- the foundation inventory is recorded with the evidence it read, and every command ran the published package from Kakeibo's `node_modules`.

### Step 30 — Deliver the deterministic Kakeibo financial-domain foundation

**References:** Kakeibo Acceptance Profile §§3–5; current Kakeibo `02-financial-domain-model-spec.md`; current Kakeibo `05-system-architecture-and-data-spec.md` package/layer boundary; current Kakeibo `06-engineering-delivery-and-operations-spec.md` deterministic test expectations; current Kakeibo `07-open-source-project-organisation-spec.md` §§20, 35, 37, 42 repository foundation; Delivery Graph §19

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

The commands run through the adapter session the run configuration names, and the Kakeibo owner is the approving human. The Kakeibo specifications at the revisions Step 29 recorded govern: 02 for financial-domain semantics, 05 for the package and layer boundary only, 06 for deterministic test expectations only and 07 for the repository foundation only. The Contract cites the specification sections it implements. The invariant set below is Kakeibo 02 §14 at revision `75443233c474a2a4072348078c22d72d15573645` (02 v1.1). If 02 §14 at the revision Step 29 records differs from the block below, the set is re-derived from that revision's §14 through an amendment of this step, reviewed like this one, before Step 30 runs; no invariant is deferred to Step 31.

Before this step is accepted, deliver each foundation item Step 29 recorded absent through a Kakeibo Delivery lineage approved by the Kakeibo owner: the deterministic tests and synthetic fixtures through this step's domain lineage, and each other item except the specifications through its own lineage. Synthetic fixtures contain no real personal financial export (Kakeibo 07 §20), and no private financial or review engine is required for the delivered slice (07 §42). Do not scaffold Academy, Blog, marketplace, registry, parallel self-hosting architecture or speculative package directories.

**Expected result**

The first Kakeibo executable slice represents `FinancialEntry` as the general financial concept rather than treating every entry as spending, and preserves every invariant of Kakeibo 02 §14. At revision `75443233` these are:

```text
flexible_spending_budget
  = planning_income
  - fixed_commitments
  - plan_funded_goal_allocations

envelope_limits_total = Needs + Wants + Culture + Unexpected
envelope_limits_total = flexible_spending_budget

fixed commitments never consume flexible envelope limits
plan-funded goal allocations never also consume a flexible envelope
transfers never become flexible spending solely because cash left an account
business activity never consumes personal Kakeibo envelopes

reviewed totals contain only reviewed entries
needs decision / worth checking / looks safe do not mean reviewed
review skip does not mean reviewed
rules, heuristics and assistant suggestions do not create reviewed truth
first matching active rule wins according to explicit priority

sum(split amounts) = original entry amount
confirmed split parts replace the original amount in aggregates
re-importing the same source entry is idempotent
a duplicate candidate is not automatically excluded
confirmed duplicates contribute zero to aggregates

plan changes do not rewrite historical reviewed entries
goal changes do not rewrite historical contributions or targets
rule edits do not silently rewrite reviewed history

unreviewed activity remains separately visible
projected values remain explicitly projected
user-selected targets remain distinct from calculated consequences
one amount must not be counted twice across spending, transfer and goal aggregates
```

In addition to §14, the slice preserves the Kakeibo Acceptance Profile §4 invariants §14 does not state in these words: credit-card settlement does not double-count tracked purchases (02 §9), and goal allocation remains distinct from reviewed goal contribution (02 §§6.2, 6.3, 11).

The package remains deterministic and independent of application/API/storage/UI/provider concerns.

**Verify before continuing**

- `pnpm pactwright validate` and `pnpm pactwright lifecycle status` pass;
- the Kakeibo deterministic financial-domain tests pass with explicit numeric assertions where applicable;
- domain code has no Hono/Neon/Cloudflare/UI/analytics/provider dependency;
- no research-derived financial target is encoded as a default or recommendation;
- the approved Contract retains all applicable financial invariants through Brief, Delivery, Review and Evidence;
- the Kakeibo graph contains one valid Intent → Decision → Contract → Brief → Evidence lineage for the delivered financial-domain foundation;
- each §14 invariant, and the credit-card and goal-contribution invariants above, has tests that pass on the delivered code and fail on a variant, supplied by the verifier rather than the producer, that violates only that invariant; two test runs give identical results;
- each Kakeibo 02 §15 acceptance criterion is stated in the Contract and either covered by a test or named as outside this slice with its reason, Kei and UX criteria among them;
- domain logic reads no clock, randomness, network or filesystem, and its manifest and imports contain none of the excluded dependencies;
- independent review traces every invariant through the Contract, Brief, Review result and Evidence, and finds a missing link a failure;
- every foundation item Step 29 recorded absent exists, delivered through a done Kakeibo lineage; the licence is Apache-2.0 and `SECURITY.md` names a private route (07 §§35, 37); the synthetic fixtures hold no real personal financial export and the slice needs no private financial or review engine;
- the graph holds only core record types and relations, every Pactwright-owned file was written by the runtime, and the Kakeibo commits landed under the Kakeibo owner's authority.

## Stage 11 — Capture Checkpoint 1 feedback

Close the checkpoint's learning loop before declaring it complete.

### Step 31 — Capture Checkpoint 1 findings as future project work

**References:** Implementation Principles §§7, 14, 16; Implementation Guide — Transition rule; Kakeibo Acceptance Profile §17

**Run**

Review the execution of Stages 1–10, including bootstrap-fixture friction, self-hosting friction, Kakeibo installation/workspace bootstrap and onboarding problems, financial-invariant preservation, content gaps and any deviation between specification and implementation.

Also record execution friction, code quality, graph behaviour and model and skill effectiveness, without attributing an improvement to model choice alone. Keep the findings inventory as execution evidence outside the Project Graph, linking each finding to its Intent ID, fix reference or exclusion reason.

Classify each finding once, with its reason. A finding is **blocking** when it falsifies an exit-gate line or an accepted criterion's evidence, or when a documented command of the published release fails as documented. Otherwise it is **material** when it names a Pactwright responsibility failure, a manual intervention the runtime or the material should have made unnecessary, a specification-to-implementation deviation or a content gap. Otherwise it is **excluded**: a Kakeibo-specific domain or product choice exposing no repeatable Pactwright responsibility failure.

From the Pactwright repository root, for each finding worth acting on:

```text
/capture-intent "<finding phrased as a requested outcome>"
```

Project Intelligence does not exist yet, so findings are captured directly as Intents through normal Delivery (Implementation Principles §14). Leave the captured Intents open; they are future work, not part of this checkpoint's Delivery.

Blocking failures must instead be fixed within this checkpoint: repeat the affected stage's steps until its verification passes.

Do not generalise a Kakeibo-specific domain/product choice into Pactwright semantics unless it exposes a repeatable Pactwright responsibility failure.

"Each finding worth acting on" is each material finding. A blocking fix re-runs the affected steps and re-verifies every obligation the fix affects; after Step 25 it is delivered under `CP01/R02`, and a defect in the published `0.0.2` follows Step 28's fix-forward rule. The captured Intents land through a pull request the owner merges with `CI / Verify` passing.

**Expected result**

Every material Checkpoint 1 finding exists as an open Intent in the Pactwright graph, and no known blocking failure is carried into Checkpoint 2.

**Verify before continuing**

Run `pnpm pactwright validate` and `pnpm pactwright lifecycle status`; captured Intents are valid open lineages. Confirm no blocking failure remains unresolved.

Each captured Intent states an outcome and no plan and has no Decision; every earlier lineage is unchanged. A finding that meets both the blocking and the material definition is classified blocking, fixed and re-verified, and has no open Intent standing in for the fix. Independent review confirms each classification against its reason and that no material finding was excluded.

## Exit gate

Checkpoint requirement `CP01/R05` binds this gate: every line needs current evidence of the criteria or step verifications that prove it.

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

**Pactwright — Checkpoint 1 — Self-Hosted Delivery v31**
