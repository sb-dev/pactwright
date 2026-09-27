# Pactwright — Checkpoint 1 — Self-Hosted Delivery

**Version:** 31  
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

A converted step is defined by its YAML contract in [`01-self-hosted-delivery/`](./01-self-hosted-delivery/), in the format owned by [Spec 00](../specs/00-checkpoint-step-contract-and-delivery-tasks.md). The step section here links the contract and summarises its deliverables; the contract holds the requirements and acceptance criteria. Every contract inherits the settings and shared requirements in [`checkpoint.yml`](./01-self-hosted-delivery/checkpoint.yml), and [`crosswalk.yml`](./01-self-hosted-delivery/crosswalk.yml) records where each obligation of the replaced step prose went: version 17 for Stage 1, version 20 for Stage 2, version 21 for Stage 3, version 22 for Stage 4, version 23 for Stage 5 and version 30 for Stages 6–11.

Stages 1–11 are converted. Stage 1 contracts are amended against Core v3 through the Q01–Q20 resolution pass, accepted by independent review 5298715756 and its correction review 5301803981 at `87bd3eb`, and reviewed as a whole under methodology §7 in [the Stage 1 exit record](../research-logs/2026-09-25-cp01-stage-1-exit-review.md). That record lists the corrections it applied, including the owner-directed Distribution §3 and pg1-fixture decisions, and the remaining non-blocking specification recommendations; independent review 5318255407 accepted those corrections at `f5e75db` and the record states Stage 1 requirement-ready. Stage 2 contracts are amended against Core v5 through the Q21–Q33 resolution pass, recorded in five [batch records](../research-logs/2026-09-25-cp01-stage-2-b7-shapes-and-identity.md) (B7–B11). The owner approved the Core §§27, 28, 32, 52, 53, 55 and 57 clauses, the two §4 scope lines and the Step 24 lifecycle-command obligation, and three further decisions from the stage-level exit review recorded in [the Stage 2 exit record](../research-logs/2026-09-25-cp01-stage-2-exit-review.md); independent review 5322976729 accepted that record's corrections at `ac370f2` and the record states Stage 2 requirement-ready. Stage 3 contracts are amended against Core v6 and Distribution v4 through the Q34–Q40 resolution pass, recorded in three [batch records](../research-logs/2026-09-25-cp01-stage-3-b12-agent-pack-format-and-selection.md) (B12–B14); the owning clauses are Distribution §§5, 8, 15, 21, 24 and Core §§35, 46, 55, and this pass added the Step 24 evaluation sentence below. The methodology §7 whole-stage review is recorded in [the Stage 3 exit record](../research-logs/2026-09-25-cp01-stage-3-exit-review.md), whose corrections X1–X19 were accepted by fresh independent review, and the record states Stage 3 requirement-ready. Stage 4 contracts are amended against Distribution v5 through the Q41–Q51 resolution pass, recorded in four [batch records](../research-logs/2026-09-26-cp01-stage-4-b15-init-and-scaffold.md) (B15–B18); the owning clauses are Distribution §§3, 10, 11, 12, 15, 16 and 27 and Implementation Guide command ownership, and this pass added the Step 29 selection command below and the env1 lock-hash grammar to CP01-S09/R06 and the version-listing request to CP01-S11/R08. The methodology §7 whole-stage review is recorded in [the Stage 4 exit record](../research-logs/2026-09-26-cp01-stage-4-exit-review.md). Stage 5 contracts are amended against Implementation Guide v18 through the Q52–Q56 resolution pass, recorded in three [batch records](../research-logs/2026-09-26-cp01-stage-5-b19-ci-coverage-and-triggers.md) (B19–B21); the owning clauses are the Guide's GitHub Actions, package metadata, npm release model, trusted release workflow and release failure sections. Q54's renumbering of the Guide's version tables and of Checkpoints 2–9 (Checkpoint 2 → `0.0.3` through Checkpoint 9 → `0.0.10`) was authorised by the owner and applied in the same pass. The methodology §7 whole-stage review is recorded in [the Stage 5 exit record](../research-logs/2026-09-26-cp01-stage-5-exit-review.md). Stages 6–11 are converted in the same pass that resolves their open questions Q57–Q66, recorded in six [batch records](../research-logs/2026-09-27-cp01-stages-6-11-b22-packed-consumer-proofs.md) (B22–B27); the owning clauses are the Implementation Guide's release model, test layers, public-product progression and transition rule, Open-Source Project Organisation §§14, 16, 18 and 24, Distribution §§3, 5, 12, 15 and 24 and Kakeibo Acceptance Profile §§2–5, and this pass amended the Guide's release preparation and transition-rule sections (v19). The methodology §7 whole-checkpoint review and the checkpoint-wide simplicity, graph-boundary and self-hosting obligations (`CP01/R02`–`R05`) are recorded in [the Stages 6–11 exit and checkpoint-wide acceptance record](../research-logs/2026-09-27-cp01-stages-6-11-exit-review.md). Every step is now defined by its contract; the checkpoint retains only goal, scope, stage headings, deliverable summaries and the exit gate.

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

**Contract:** [`CP01-S22`](./01-self-hosted-delivery/CP01-S22.yml)

**Deliverables**

- `packed-archives` — The two consumer archives, pactwright and @pactwright/standard, packed from one named candidate revision through each package's normal prepack build, with each archive's content identity and the revision recorded as the inputs the packed-consumer steps install.
- `packing-procedure` — The repeatable procedure, pnpm pack at the repository root and pnpm --filter @pactwright/standard pack from a clean checkout with no prior build output, that Steps 27 and 28 re-run to pack a later candidate revision into equivalent archives.

The archives of one candidate revision are the inputs of Steps 23 and 24; Steps 27 and 28 re-run the procedure on their own revisions.

### Step 23 — Install and initialise clean consumer fixtures

**Contract:** [`CP01-S23`](./01-self-hosted-delivery/CP01-S23.yml)

**Deliverables**

- `consumer-fixtures` — Two clean repositories outside the workspace that become valid Pactwright consumers from the packed archives alone, one through the explicit path init, agent-pack use, sync, doctor, validate and lifecycle status, and one through one-shot init with a packed fixture Extension and the same explicit pack selection, with the explicit-path fixture retained in its recorded state as the starting point of Step 24.

The explicit-path fixture is retained as the starting point of Step 24. Before Step 28 publishes, the standard archive reaches the fixture only through a recorded local-package override.

### Step 24 — Complete one full fixture Delivery

**Contract:** [`CP01-S24`](./01-self-hosted-delivery/CP01-S24.yml)

**Deliverables**

- `fixture-delivery` — One complete Delivery, Intent → Decision → Contract → Brief → Evidence, completed in the Step 23 explicit-path fixture through the rendered adapter commands executed by the selected pack's agents, with Contract alternatives and execution transcripts kept out of the Project Graph.
- `integration-verification` — Fresh executed results, on the candidate revision Step 22 packed, of the accepted validation, Evidence-closure, adapter-boundary, evaluation and installed-Extension criteria this contract names, together with the packed consumer's own proof of the validation rules, closure guards, mutation boundaries and lifecycle commands it can exercise.

Step 24 is the integration gate before self-hosting: the first real execution of the pack's agents, and fresh results of the accepted criteria the contract names on the revision Step 22 packed.

## Stage 7 — Adopt Pactwright in Pactwright

### Step 25 — Initialise the Pactwright repository

**Contract:** [`CP01-S25`](./01-self-hosted-delivery/CP01-S25.yml)

**Deliverables**

- `self-hosted-project` — The Pactwright repository as a valid Pactwright project, holding Pactwright-owned configuration, lifecycle policy, version 1 lock, empty Project Graph stores and the rendered Claude Code adapter, created by the repository-local CLI with @pactwright/standard explicitly selected from the workspace and landed on the default branch with CI / Verify passing, from which the checkpoint's self-hosting obligation applies.

Step 25 starts from a candidate with no Pactwright project state (owner-approved boundary, CP01-S25/R02); its acceptance is the self-hosting threshold from which `CP01/R02` applies.

### Step 26 — Deliver a real self-hosted Quick Start improvement

**Contract:** [`CP01-S26`](./01-self-hosted-delivery/CP01-S26.yml)

**Deliverables**

- `self-hosted-quick-start-delivery` — One Intent → Decision → Contract → Brief → Evidence lineage in the Pactwright repository's own Project Graph that improves the README Quick Start using only behaviour proven in this checkpoint, with every public claim it makes authorised by the Decision and Contract and its instructions executed in a clean packed consumer.

The first self-hosted Delivery. Public claims are authorised by the owner's Decision and Contract, and the Quick Start is executed in a clean packed consumer.

## Stage 8 — Complete the `0.0.2` public learning path

### Step 27 — Deliver Core Delivery learning material

**Contract:** [`CP01-S27`](./01-self-hosted-delivery/CP01-S27.yml)

**Deliverables**

- `learning-material` — The README Quick Start, the Getting Started guide and one executable core Delivery example, delivered through Pactwright Delivery lineages in the repository's own Project Graph, documenting only behaviour proven in this checkpoint, including the core distribution commands the release ships, so that a new user can understand, install, execute and upgrade the released 0.0.2 without any Extension.

The `0.0.1` content set of the Implementation Guide's public-product progression, re-delivered for the corrective `0.0.2`. Its install instructions name the exact version, since `latest` stays at `0.0.1`.

## Stage 9 — Publish `0.0.2`

### Step 28 — Publish the corrective release and prove a real released baseline

**Contract:** [`CP01-S28`](./01-self-hosted-delivery/CP01-S28.yml)

**Deliverables**

- `corrective-release` — pactwright@0.0.2 and @pactwright/standard@0.0.2 published to npm under the tag next from the accepted, tagged default-branch source through the trusted release workflow, its first trusted publish, with 0.0.1 retained as the released baseline.
- `released-baseline-comparison` — The pactwright eval comparison of the published @pactwright/standard@0.0.1 baseline against the 0.0.2 candidate, resolving the released baseline exactly through the package-manager delegation seam and reporting the changed components and not-comparable results of a run without an invoker.

`0.0.1` was published on 2026-09-01 against version 14 of this runbook and stays on the registry as the released baseline; the `v0.0.2` run is the first publish through trusted publishing. Without an invoker the comparison reports every assertion as not comparable and lists the changed components.

## Stage 10 — Prove the published release on Kakeibo

Use the final Checkpoint 1 package on the persistent external proving project.

Kakeibo may still be a documentation-first/pre-implementation repository at this point. The only pre-Pactwright bootstrap permitted here is the minimum pnpm package/workspace root required to install a development dependency. Full Turborepo/application infrastructure belongs to Checkpoint 2.

### Step 29 — Establish the minimum Kakeibo consumer root and install `0.0.2`

**Contract:** [`CP01-S29`](./01-self-hosted-delivery/CP01-S29.yml)

**Deliverables**

- `kakeibo-consumer-root` — The Kakeibo repository holding the minimum pnpm package/workspace root, with pactwright@0.0.2 installed from the registry as a development dependency, @pactwright/standard explicitly selected, the adapter rendered and core Delivery only, every pre-existing Kakeibo file unchanged and the public-repository foundation inventoried for Step 30.

The only pre-Pactwright bootstrap is the package/workspace root. The public-repository foundation of the acceptance profile is inventoried here and, where absent, delivered through Kakeibo Delivery in Step 30.

### Step 30 — Deliver the deterministic Kakeibo financial-domain foundation

**Contract:** [`CP01-S30`](./01-self-hosted-delivery/CP01-S30.yml)

**Deliverables**

- `kakeibo-domain-foundation` — Kakeibo's first executable deterministic financial-domain foundation in packages/domain, delivered through one Kakeibo Delivery lineage from the current canonical Kakeibo specifications, representing FinancialEntry as a general financial concept, preserving the acceptance profile's financial invariants through deterministic tests, and free of application, API, storage, UI, analytics and provider dependencies.
- `kakeibo-repository-foundation` — The minimum public-repository foundation of Kakeibo Acceptance Profile section 5, present at the starting revision or delivered through a Kakeibo Delivery lineage where Step 29 found it absent.

The current canonical Kakeibo specifications govern the semantics; the contract's invariant list is the minimum the acceptance profile requires.

## Stage 11 — Capture Checkpoint 1 feedback

Close the checkpoint's learning loop before declaring it complete.

### Step 31 — Capture Checkpoint 1 findings as future project work

**Contract:** [`CP01-S31`](./01-self-hosted-delivery/CP01-S31.yml)

**Deliverables**

- `checkpoint-findings` — A reviewed inventory of the Stage 1 to 10 execution findings, each classified once as material, blocking or excluded with its reason, with every material finding captured as an open Intent in the Pactwright repository's own Project Graph and every blocking finding fixed and re-verified within Checkpoint 1.

Project Intelligence does not exist yet, so findings are captured as open Intents; blocking failures are fixed within this checkpoint.

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

**Pactwright — Checkpoint 1 — Self-Hosted Delivery v31**
