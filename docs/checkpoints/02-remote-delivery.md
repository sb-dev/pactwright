# Pactwright — Checkpoint 2 — Remote Delivery

**Version:** 11  
**Entry condition:** Checkpoint 1 is accepted and Pactwright can self-host core Delivery.  
**Release:** `0.0.2`  
**Exit capability:** Pactwright and Kakeido can initialise, execute, evaluate and project Contract-driven Delivery through GitHub using one deterministic profile-composition/reconciliation model while repository canonical state remains authoritative.

## 1. Goal

Implement the generic GitHub composition, provisioning, execution and projection foundation; expose the Core Delivery profile through the first managed workflow/checks/Project surface; prove one-shot GitHub initialisation and real published-version upgrade; then use the result for real Pactwright and Kakeido Remote Delivery.

Checkpoint 2 establishes the reusable GitHub machinery later Extensions contribute to. Later checkpoints add their own profiles, workflows, checks and views; they do not introduce a second profile-composition or remote-reconciliation engine.

## 2. Canonical baseline

- [01 — Core System and Lifecycle](../specs/01-pactwright-core-system-and-lifecycle.md)
- [02 — Distribution, Agent Packs, Extensions and Evaluation](../specs/02-distribution-agent-packs-extensions-and-evaluation.md)
- [07 — GitHub Integration](../specs/07-github-integration.md)
- [08 — Open-Source Project Organisation](../specs/08-open-source-project-organisation.md)
- [Implementation Principles](./00-implementation-principles.md)
- [Implementation Guide](./00-implementation-guide.md)

Kakeido acceptance uses the current canonical Kakeido specifications from the Kakeido repository.

Research logs are rationale only.

This runbook defines execution order, not new GitHub or lifecycle semantics.

## 3. Execution contract

Every implementation action follows:

```text
Step
→ References
→ Run
→ Expected result
→ Verify before continuing
```

Default location is the Pactwright repository unless a step names Kakeido or a fixture.

For repository/code changes:

```bash
pnpm verify
```

Before running newly implemented runtime commands from the source repository:

```bash
pnpm build
```

After GitHub integration becomes active, coherent repository changes land through pull requests and required checks.

## 4. Checkpoint scope

Checkpoint 2 implements and proves:

```text
pactwright init --github
generic GitHub profile composition
repository override composition
profile conflict detection
pactwright github sync --dry-run
pactwright github sync
managed settings / labels / rulesets / required-check configuration where configured/supported
one shared GitHub Project foundation
Delivery Project fields/views/items
semantic trigger and validator routing
.github/workflows/pactwright.yml
Pactwright / Graph
Pactwright / Lifecycle
Pactwright / Review
Delivery PR summary
Intent Issue projection
shared locked interactive/Actions environment
runtime replay provenance in remote execution/projection
GitHub Integration evaluation cases
remote drift reconciliation
real 0.0.1 → 0.0.2 runtime/Agent Pack upgrade
```

GitHub remains:

```text
execution
+ checks
+ collaboration/projection
+ remote reconciliation
```

It is not:

```text
Project Graph
lifecycle authority
knowledge store
roadmap engine
```

### Explicitly unresolved in this checkpoint

Do not silently invent canonical policy for:

- stable identity/rename/collision handling of Pactwright-managed remote resources;
- concurrent automated branch/PR rebase/idempotency policy;
- exact check-conclusion mapping for every execution failure class;
- repository-wide policy for PRs with no Delivery lineage.

The checkpoint may implement the minimum safe mechanism needed for its acceptance scenarios, but any new durable semantic rule must first be reconciled with Spec 07.

## Stage 1 — Implement generic GitHub desired-state composition and reconciliation

### Step 1 — Implement GitHub profile composition and desired-state planning

**References:** Specs 02 and 07 profile composition/provisioning.

**Run**

```text
Implement one generic GitHub desired-state planner over:
- the enabled Core Delivery profile;
- enabled Extension-contributed profiles;
- repository GitHub overrides.

Composition must:
- include only enabled components;
- resolve Extension dependencies before profile composition;
- collapse identical requirements;
- merge compatible requirements;
- fail incompatible requirements before remote mutation;
- contribute all profiles to one repository integration;
- use one shared GitHub Project by default when Projects are enabled.

Use the Core Delivery profile plus fixture Extension profiles to prove the generic mechanism before real first-party Extension profiles exist.

The Core Delivery remote desired state must cover the applicable configured/supported Spec 07 structural surface:
- repository settings;
- labels;
- rulesets;
- required-check configuration;
- shared Pactwright Project;
- Delivery Project fields;
- Delivery/Blocked views.

Do not create one Project per profile or Extension.
```

**Expected result**

One deterministic composition engine produces the complete managed GitHub desired state for the currently enabled profiles.

**Verify before continuing**

Exercise core-only, fixture-profile, identical-requirement, compatible-merge, incompatible-conflict, repository-override and Projects-disabled fixtures. Incompatible composition must fail before mutation and leave the previous valid desired state intact.

### Step 2 — Implement `github sync --dry-run`

**References:** Specs 02 and 07 provisioning/reconciliation.

**Run**

```text
Implement `pactwright github sync --dry-run` over the exact planner from Step 1 using authenticated GitHub tooling.

Print planned creates/updates/removals without mutation.
Validate repository identity, permissions and required scopes.
Never silently broaden authentication scopes.
Preserve ambiguous/unowned state and report it.
```

**Expected result**

Dry-run is deterministic, non-mutating and ownership-aware.

**Verify before continuing**

Run fixtures for create/update/no-op/removal-plan/unowned collision plus one real Pactwright dry-run before apply. Repeated dry-run against unchanged desired/remote state must be stable.

### Step 3 — Implement `github sync` apply/reconciliation

**References:** Specs 02 and 07 managed ownership/reconciliation.

**Run**

```text
Implement apply using the exact same desired-state planner as dry-run.
Own only Pactwright-managed remote repository/Project integration.
Remove a remote object only when ownership is established and no enabled component still requires it.
Leave ambiguous/unowned objects untouched and report them.

Actions/runtime projection state such as PR summaries, Issue summaries, Project items and derived field values is not remote schema owned by this planner.
```

**Expected result**

Apply converges without deleting or adopting unrelated GitHub state.

**Verify before continuing**

Run reconciliation fixtures for create/update/no-op/owned removal/unowned preservation and require a clean second dry-run after apply.

## Stage 2 — Generate the Core Delivery workflow and projection surface

### Step 4 — Generate `.github/workflows/pactwright.yml` from the locked environment

**References:** Spec 07 managed workflows/shared execution environment; Spec 02 sync.

**Run**

```text
Extend `pactwright sync` to render `.github/workflows/pactwright.yml` when GitHub is enabled.

The workflow must:
- install/use the complete locked Pactwright execution environment;
- load the same runtime, enabled Extensions, Agent Pack, Production Skills and Pactwright lock as interactive execution;
- invoke Pactwright runtime responsibilities rather than duplicate semantics in YAML;
- use the runtime-supplied environment identity rather than derive a CI-specific identity;
- validate graph/lifecycle/review state;
- continue lifecycle execution only through `pactwright lifecycle run` and the runtime's resolved lifecycle shape/policy;
- stop at Gates requiring authority, blocking Review, validation failure, execution failure or lifecycle completion;
- use least privilege and the Implementation Guide GitHub Actions baseline;
- prevent untrusted pull-request content from automatically receiving privileged secrets or write-capable credentials;
- never infer Pactwright approval or Decision/Gate authority from generic GitHub approval, labels, comments or merge metadata.
```

**Expected result**

Core remote execution is a thin runtime surface using the same semantic/AI environment as local execution.

**Verify before continuing**

Run sync twice and require byte-identical managed output on the second run. Compare local and Actions-resolved `environment_lock_hash` for the same lock and require equality. Inspect triggers/permissions to prove untrusted PR execution cannot access privileged credentials.

### Step 5 — Implement semantic trigger and validator routing

**References:** Spec 07 Core Delivery automation/shared graph routing.

**Run**

```text
Implement deterministic routing for relevant changes under:
- specs/**
- .pactwright/**
- other currently registered canonical paths.

Route changed canonical records to the validators that own their semantics.

For shared graph storage such as `specs/graph/edges.yml`, route by registered edge type/endpoints/semantic ownership rather than path alone. A cross-owner relationship may require multiple validators.

Prove the generic mechanism using one fixture Extension-owned canonical type/edge contribution without adding first-party Extension semantics.
```

**Expected result**

GitHub execution routes validation by registered semantic ownership rather than hard-coded current file paths.

**Verify before continuing**

Test Core-only node changes, Core edges, fixture Extension records, cross-owner fixture edges, config/lock changes and irrelevant paths. Adding the fixture type must require no workflow-engine branch dedicated to that Extension identity.

### Step 6 — Implement the exact Core Delivery checks

**References:** Spec 07 Core Delivery checks.

**Run**

```text
Implement exactly:
- Pactwright / Graph
- Pactwright / Lifecycle
- Pactwright / Review

`Pactwright / Graph` validates graph structure and coordinates enabled validators for affected shared relationships.
`Pactwright / Lifecycle` consumes runtime-resolved lifecycle state, transitions, Gates and authority.
`Pactwright / Review` reflects blocking Delivery Review state.

GitHub does not recompute lifecycle topology or infer Review/Decision truth from PR metadata.

For a PR without resolvable Delivery lineage, do not invent a permanent product rule inside this checkpoint. Implement the safest behaviour consistent with current Spec 07 and record the remaining policy gap explicitly.
```

**Expected result**

Checks expose Pactwright truth without becoming its source.

**Verify before continuing**

Test valid/invalid graph, shared-edge validation, Gate/lifecycle failure, blocking/non-blocking Review, execution failure versus canonical invalidity, and the currently supported non-Delivery PR behaviour.

### Step 7 — Implement Delivery PR summary and remote execution provenance

**References:** Specs 01, 02 and 07 PR summary/replay rules; Implementation Guide replay provenance.

**Run**

```text
Render a concise Delivery PR summary from runtime state.
Link to canonical records instead of copying them.
Show the applicable progression:
Intent → Contract → Brief → Delivery → Review → Evidence
plus the current runtime-resolved lifecycle step/state.

For every replayable GitHub-triggered execution/projection context, carry the runtime-supplied identities:
- repository_revision;
- project_graph_revision;
- environment_lock_hash.

GitHub must never derive, replace or reinterpret those identities.
Projection of provenance is distinct from recording provenance on the underlying runtime execution.

Where any operation claims pinned replay, invoke the owning Pactwright operation against the recorded replay base and fail explicitly if it cannot be reconstructed; never substitute the workflow's current checkout/environment.
```

**Expected result**

Remote executions preserve Pactwright provenance and PRs expose useful progress without duplicating canonical truth.

**Verify before continuing**

Compare summary fixtures against runtime outputs; prove all replay identities originate from the runtime; prove GitHub-only metadata changes do not change them; and use a replay-capable fixture operation to require explicit failure rather than current-state substitution when a recorded input is unavailable.

### Step 8 — Implement Intent Issue and shared Project runtime projection

**References:** Spec 07 Intent Issue, Delivery fields and shared Project.

**Run**

```text
Implement the core Intent Issue projection with:
- title;
- current lifecycle state;
- current Contract;
- current Brief;
- linked pull request;
- blocking state.

Provision one shared Pactwright GitHub Project with Core Delivery fields/views including:
- lifecycle step/state;
- blocked;
- Contract;
- Brief;
- pull request;
- last activity;
- Delivery view;
- Blocked view.

Actions own Project item creation/update and derived field values from runtime state.
`pactwright github sync` owns the Project/field/view schema.

Issue/Project values are derived collaboration state only.
Editing them must not mutate canonical Pactwright records.

Support `github.project.enabled: false` while checks and PR summaries remain usable.
```

**Expected result**

One reusable Project foundation exists for later Extension profiles and regenerates from canonical Pactwright state.

**Verify before continuing**

Run core-only, fixture-profile and project-disabled projection fixtures. Mutate derived Issue/Project values and require Actions projection to restore canonical runtime truth without changing the Project Graph. Prove no fixture Extension creates an independent Project.

## Stage 3 — Prove compositional GitHub initialisation and activate Pactwright

### Step 9 — Implement and prove `pactwright init --github`

**References:** Spec 02 one-shot initialisation; Specs 02 and 07 sync ownership.

**Run**

```text
Activate the Checkpoint 1 one-shot composition mechanism for GitHub:

pactwright init --github

It must compose the same underlying operations as explicit setup:
normal init
→ enable GitHub configuration
→ pactwright sync
→ pactwright github sync

Do not create a second initialisation/provisioning implementation.
Use the same local sync, profile planner, remote dry-run/apply/reconciliation and ownership rules implemented above.
```

**Expected result**

A clean repository can initialise the complete Core Remote Delivery surface through one compositional command.

**Verify before continuing**

In isolated clean test repositories, compare `init --github` against the equivalent explicit operations and require equivalent Pactwright configuration/lock, generated managed files and resolved managed remote state while preserving unrelated repository/remote resources.

### Step 10 — Land the generated Core workflow before requiring its checks

**References:** Spec 07; Implementation Guide repository changes.

**Run**

```bash
pnpm build
pnpm pactwright sync
```

Land the generated Pactwright-managed workflow through the safest repository path available before its own required checks/rules are enabled.

Then:

```bash
pnpm pactwright github sync --dry-run
```

Review the exact managed plan for settings, labels, rulesets/required checks and shared Project structure before apply.

**Expected result**

The workflow exists on the default branch before remote policy requires its checks.

**Verify before continuing**

Ensure only Pactwright-owned remote state is planned and the three required Core checks are not required before the workflow capable of producing them exists.

### Step 11 — Apply and prove Pactwright GitHub desired state

**Run**

```bash
pnpm pactwright github sync
pnpm pactwright validate
pnpm pactwright github sync --dry-run
```

Open a safe test PR after apply.

**Expected result**

Pactwright remote state is applied, checks/projections run and reconciliation converges.

**Verify before continuing**

Final dry-run has no unintended drift. Verify the configured/supported Core Delivery labels/settings/rules/required checks/Project surface, the shared locked environment, Issue/PR/Project projection, and preservation of unrelated workflows/labels/Projects/settings.

## Stage 4 — Prove real Remote Delivery in Pactwright

### Step 12 — Deliver the website foundation through normal Pactwright Delivery

**References:** Spec 08 Remote Delivery milestone; current Pactwright website architecture choices.

**Run**

Use Contract-driven Delivery to create a bounded deployable website foundation using the project's current chosen web architecture.

Before Project Intelligence exists, any product identity/positioning choice required by the public website must be authorised through Decision + Contract rather than inferred by the model.

One meaningful repository-backed Delivery normally uses one branch and one pull request; do not create one PR per lifecycle step.

**Expected result**

A real Pactwright change is delivered through a GitHub PR with canonical lineage, checks, summary, Intent Issue and shared Project projection.

**Verify before continuing**

Local runtime status and GitHub projections agree; GitHub edits alone cannot advance the Pactwright lifecycle.

### Step 13 — Prove Gate, failure and authority boundaries on a real PR

**References:** Specs 01 and 07.

**Run**

```text
Create a safe Delivery/follow-up where Review blocks completion or a human Gate is pending.
Prove merge/automation does not bypass runtime state.
GitHub PR approval alone must not create a Decision or satisfy a Pactwright Gate.
Distinguish execution failure from canonical invalidity in the available check/reporting surface without canonising the still-open universal check-conclusion mapping.
Resolve the underlying Pactwright condition through normal runtime/adapter responsibilities and prove checks recover.
```

**Expected result**

Remote automation fails closed at Pactwright authority boundaries while preserving failure provenance/state distinctions.

**Verify before continuing**

Check history, PR projection and local runtime state agree before and after resolution.

## Stage 5 — Evaluate and publish the Remote Delivery learning path

### Step 14 — Add GitHub Integration evaluation cases

**References:** Specs 02 and 07 evaluation.

**Run**

```text
Contribute Checkpoint-2 GitHub Integration cases to `pactwright eval` covering the currently implemented surface:
- profile composition and conflict detection;
- deterministic workflow generation;
- semantic trigger/path routing;
- lifecycle Gate stopping;
- Core check semantics;
- PR/Issue projection accuracy;
- Project item/field/view derivation;
- replay provenance pass-through without GitHub-derived substitution;
- pinned replay failure without current-state fallback where applicable;
- remote reconciliation;
- preservation of unmanaged GitHub state;
- least-privilege/untrusted-PR configuration;
- execution-failure versus canonical-invalidity separation;
- canonical-state independence from GitHub metadata.

Keep Extension-specific business semantics with their owning later Extension evaluations.
Do not compute one opaque aggregate score.
```

**Expected result**

The generic GitHub Integration responsibility is independently evaluable before later Extension profiles arrive.

**Verify before continuing**

Run `pnpm pactwright eval`, inspect the GitHub cases individually, introduce representative composition/routing/projection failures and require the responsible cases to fail.

### Step 15 — Deliver the GitHub operating guide and Remote Delivery example

**References:** Spec 08 Remote Delivery public milestone.

**Run**

Through normal Pactwright Delivery, produce/update:

```text
deployable website/public discovery surface
GitHub setup/operating guide
one executable Remote Delivery example
```

Document `pactwright init --github`, explicit setup, ownership boundaries, checks/projections and safe reconciliation using only behaviour proven in this checkpoint.

**Expected result**

Users can discover and reproduce Remote Delivery without depending on later Extensions.

**Verify before continuing**

Follow the guide against the real Pactwright GitHub setup and a clean test repository. Run the Remote Delivery example in CI where practical.

## Stage 6 — Release `0.0.2`

### Step 16 — Prepare and tag `0.0.2`

**References:** Implementation Guide npm release model.

Use the standard release PR path, update CHANGELOG from accepted Evidence, tag the merged release commit `v0.0.2`, and let trusted publishing release:

```text
pactwright@0.0.2
@pactwright/standard@0.0.2
```

**Verify before continuing**

Both registry versions resolve and the trusted release workflow succeeds.

## Stage 7 — Prove published upgrade and Remote Delivery in Kakeido

### Step 17 — Upgrade Kakeido from `0.0.1` to `0.0.2` through Pactwright ownership-specific commands

**References:** Spec 02 upgrade model; Checkpoint 1 upgrade capability.

**Run**

Begin with Kakeido running the exact published Checkpoint 1 family:

```text
pactwright@0.0.1
@pactwright/standard@0.0.1
```

Do **not** preinstall `0.0.2` with `pnpm add`.

Run:

```bash
pnpm pactwright upgrade --to 0.0.2
pnpm pactwright agent-pack upgrade
pnpm pactwright doctor
pnpm pactwright sync
pnpm pactwright validate
```

Confirm the project package manager performed the package replacements and the newly installed runtime completed migration/lock/sync/validation.

Then enable GitHub through the same compositional operations delivered in this checkpoint. For an existing Pactwright project, update the owning GitHub configuration and run:

```bash
pnpm pactwright sync
```

Land Pactwright-managed workflow files before applying required remote checks/rules, then:

```bash
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
pnpm pactwright github sync --dry-run
```

**Expected result**

Kakeido proves a real published `0.0.1 → 0.0.2` runtime/Agent Pack upgrade and gains GitHub integration without losing user-authored local or remote state.

**Verify before continuing**

Package manifest/package-manager lock/`.pactwright/lock.yml` agree on the expected `0.0.2` runtime and Agent Pack. Second GitHub dry-run converges. Pre-existing user workflow hashes and unmanaged remote resources remain unchanged.

### Step 18 — Resolve current Kakeido ingestion prerequisites

**References:** current Kakeido canonical engineering/product specifications.

**Run**

```text
Inspect current Kakeido canonical specs and establish only the prerequisites required by the selected first Remote Delivery acceptance target.
Do not use stale embedded copies as authority.
Account/service provisioning remains execution prerequisite/provenance rather than Pactwright graph truth unless the owning project semantics require a Decision.
```

**Expected result**

The real Kakeido acceptance target can be built/tested through its current architecture.

### Step 19 — Deliver a bounded Kakeido ingestion outcome through GitHub

**Run**

Use normal Pactwright Delivery for a current, bounded ingestion-related outcome selected from the Kakeido canonical specs.

The work must preserve the project's current financial and architectural boundaries.

**Expected result**

Kakeido completes a real GitHub-operated Delivery using the published `0.0.2` family.

**Verify before continuing**

Run Pactwright validation and the Kakeido repository-defined tests required by the current specifications. Confirm local lifecycle state, PR/Issue/Project projections and Core checks agree.

### Step 20 — Prove all three GitHub ownership surfaces

**References:** Specs 02 and 07.

**Run**

Prove separately:

```text
local generated ownership
→ sync changes only Pactwright-managed local files/regions

remote structural ownership
→ github sync detects/restores drift only for Pactwright-owned remote settings/labels/rules/checks/Project schema

Actions projection ownership
→ derived summaries/Issue values/Project items and fields regenerate from canonical repository state
```

**Expected result**

No local or remote GitHub mutation can silently become canonical Pactwright state.

**Verify before continuing**

Record before/after hashes/state, mutate one safe derived projection and one clearly owned remote structural value, reconcile each through its correct owner, preserve unrelated state, then run `pactwright validate`.

## Stage 8 — Capture Checkpoint 2 feedback

### Step 21 — Capture material findings before PI exists

Before Project Intelligence exists, capture material Pactwright responsibility failures as explicit open Intents through normal Delivery authority.

Do not generalise Kakeido-specific preferences.

Blocking failures must be fixed inside this checkpoint.

## Exit gate

Checkpoint 2 closes only when:

- the generic GitHub profile-composition engine exists before first-party Extension profiles and deterministically collapses/merges/rejects requirements;
- repository overrides compose through the same desired-state model;
- `pactwright init --github` is proven equivalent to the corresponding explicit operations rather than a second setup path;
- deterministic `github sync --dry-run` and apply reconciliation share one planner;
- the applicable configured/supported Core remote surface covers managed settings/labels/rulesets/required checks plus one shared Project schema;
- `.github/workflows/pactwright.yml` is generated from the exact locked Pactwright environment and local/Actions `environment_lock_hash` agrees;
- semantic trigger/validator routing handles registered record/edge ownership rather than path-only hard-coding;
- `Pactwright / Graph`, `/ Lifecycle` and `/ Review` project runtime truth;
- untrusted PR content cannot automatically access privileged secrets/write credentials;
- PR summaries include Intent-through-Evidence progression and runtime-provided replay provenance;
- replay identities are preserved on remote execution as well as projected in GitHub, with no current-state substitution for claimed pinned replay;
- the Intent Issue and shared Project fields/items/views regenerate from canonical runtime state and remain projection-only;
- GitHub Integration evaluation covers the generic Checkpoint-2 responsibilities;
- GitHub metadata cannot create Decisions, satisfy Gates or mutate canonical Project Graph state;
- Pactwright completes one real GitHub-operated Delivery;
- public Remote Delivery guidance matches the implemented surface;
- `pactwright@0.0.2` and `@pactwright/standard@0.0.2` are registry verified;
- Kakeido proves a real published `0.0.1 → 0.0.2` runtime/Agent Pack upgrade without manually preinstalling the target packages;
- Kakeido completes one real Remote Delivery from its current canonical specs;
- unmanaged local/remote GitHub state is preserved;
- local generated ownership, remote structural ownership and Actions projection ownership are proven separately;
- unresolved managed-resource identity/concurrency/check-mapping/non-Delivery-PR policy is not silently canonised;
- no known blocking failure is carried into Checkpoint 3.

---

**Pactwright — Checkpoint 2 — Remote Delivery v11**
