# Pactwright — Checkpoint 1 — Self-Hosted Delivery

**Version:** 26  
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

A converted step is defined by its YAML contract in [`01-self-hosted-delivery/`](./01-self-hosted-delivery/), in the format owned by [Spec 00](../specs/00-checkpoint-step-contract-and-delivery-tasks.md). The step section here links the contract and summarises its deliverables; the contract holds the requirements and acceptance criteria. Every contract inherits the settings and shared requirements in [`checkpoint.yml`](./01-self-hosted-delivery/checkpoint.yml), and [`crosswalk.yml`](./01-self-hosted-delivery/crosswalk.yml) records where each obligation of the replaced step prose went: version 17 for Stage 1, version 20 for Stage 2, version 21 for Stage 3, version 22 for Stage 4 and version 23 for Stage 5.

Stages 1–5 are converted. Stage 1 contracts are amended against Core v3 through the Q01–Q20 resolution pass, accepted by independent review 5298715756 and its correction review 5301803981 at `87bd3eb`, and reviewed as a whole under methodology §7 in [the Stage 1 exit record](../research-logs/2026-09-25-cp01-stage-1-exit-review.md). That record lists the corrections it applied, including the owner-directed Distribution §3 and pg1-fixture decisions, and the remaining non-blocking specification recommendations; independent review 5318255407 accepted those corrections at `f5e75db` and the record states Stage 1 requirement-ready. Stage 2 contracts are amended against Core v3 through the Q21–Q33 resolution pass, recorded in five [batch records](../research-logs/2026-09-25-cp01-stage-2-b7-shapes-and-identity.md) (B7–B11) that pin the answers at contract level and propose the Core and checkpoint wording amendments for the owner's decision; independent review and the §7 stage-level exit review are pending. Stage 3 contracts are drafted against Core v3 and Distribution v2; their open questions Q34–Q40 await T2 review. Stage 4 contracts are drafted against Core v3 and Distribution v2; their open questions Q41–Q51 await T2 review. Stage 5 contracts are drafted against the Implementation Guide; their open questions Q52–Q56 await T2 review. Later steps retain the version 17 form, with the integration obligations below amended in version 20, until they are converted:

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

**Contract:** [`CP01-S10`](./01-self-hosted-delivery/CP01-S10.yml)

**Deliverables**

- `core-capabilities` — The core capability identities delivery-specification, delivery-execution and delivery-review, and the runtime capability check that a candidate Agent Pack implements each required capability.
- `agent-pack-loading` — Runtime loading and validation of an Agent Pack's capability mappings, agents, prompts and direct skills, independent of the pack's identity.
- `standard-agent-pack` — @pactwright/standard, a separate publishable Agent Pack package that implements the three core capabilities without owning graph or lifecycle semantics.

Step 11 repeats the incomplete-pack proof through `agent-pack use`. Step 22 packs `@pactwright/standard` for clean consumers and Step 28 publishes it. External Production Skills imports remain unsupported until Checkpoint 5.

### Step 11 — Implement Agent Pack selection and upgrade

**Contract:** [`CP01-S11`](./01-self-hosted-delivery/CP01-S11.yml)

**Deliverables**

- `agent-pack-use` — A pactwright agent-pack use <source> that explicitly selects one compatible complete Agent Pack, updating configuration and lock only after successful resolution and validation.
- `agent-pack-upgrade` — A pactwright agent-pack upgrade that upgrades the selected pack within its configured compatibility constraints without changing its identity.

Step 15 repeats the configuration proof with the real resolved lock, and Step 14 reuses this selection path for one-shot init.

### Step 12 — Implement the seven canonical Claude Code adapter commands

**Contract:** [`CP01-S12`](./01-self-hosted-delivery/CP01-S12.yml)

**Deliverables**

- `claude-code-adapter` — Deterministic rendering of Pactwright-managed Claude Code agents and the seven canonical commands from the resolved environment into Pactwright-owned files under .claude/.
- `adapter-commands` — The seven commands /capture-intent, /propose-contracts, /approve-contract, /write-brief, /deliver-brief, /review and /prepare-evidence, each invoking runtime responsibilities and the selected pack's capabilities within runtime-enforced mutation boundaries.

The command decomposition does not define lifecycle topology. Step 12 repeats the Step 7 guard, withdrawal and re-authorisation matrix through each mutating command; Step 24 completes a full Delivery through the generated adapter.

### Step 13 — Implement Pactwright evaluation and baseline comparison

**Contract:** [`CP01-S13`](./01-self-hosted-delivery/CP01-S13.yml)

**Deliverables**

- `eval-command` — A pactwright eval that runs core responsibility evaluation against the resolved AI execution environment, keeping deterministic assertions separate from semantic judgement.
- `core-eval-cases` — Core-owned evaluation cases for Contract fidelity, scope discipline, Brief quality, Review quality and defect detection, Evidence accuracy and lifecycle compliance, plus required output structure and forbidden mutation.
- `baseline-comparison` — A pactwright eval --baseline --candidate comparison that resolves both sides exactly and reports regressions by capability, agent, case and changed environment component.

Step 13 proves comparison with exact fixture and pinned package inputs. Step 28 resolves the real released `@pactwright/standard@0.0.1` baseline.

## Stage 4 — Implement exact environment resolution and local composition

### Step 14 — Implement `pactwright init` with explicit Agent Pack selection

**Contract:** [`CP01-S14`](./01-self-hosted-delivery/CP01-S14.yml)

**Deliverables**

- `init-command` — A pactwright init that gives a repository only Pactwright-owned core configuration and Project Graph structure, reported as an incomplete scaffold until an Agent Pack is explicitly selected.
- `init-pack-selection` — A documented init selection input through which initialisation obtains an explicit compatible Agent Pack choice, resolved and validated through the agent-pack use selection path rather than a second resolver.

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
- `extension-commands` — pactwright extension add, remove and upgrade, which install, remove and upgrade fixture Extensions and their dependencies transactionally, with exact locking, versioned migrations and preserved user-authored data.
- `one-shot-init` — A pactwright init --with <extension> that composes normal init, explicit Agent Pack selection, normal Extension installation and sync, producing the same state as the equivalent separate operations.

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

- `runtime-upgrade` — pactwright upgrade and pactwright upgrade --to <version>, which replace the runtime through the detected project package manager, re-enter through the new runtime and leave the environment valid at the target or recoverable to the previous one.
- `released-format-migration` — The named released-0.0.1-to-owned-stores-v1 migration, which moves a complete released 0.0.1 project to owner-separated stores and the version 1 lock without partial moves.

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

Step 21 validates the workflow without publishing. Step 28 runs it on the `v0.0.2` tag and verifies the registry.

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

**Pactwright — Checkpoint 1 — Self-Hosted Delivery v26**
