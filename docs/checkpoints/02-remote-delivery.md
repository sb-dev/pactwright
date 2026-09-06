# Pactwright — Checkpoint 2 — Remote Delivery

**Version:** 10  
**Entry condition:** Checkpoint 1 is accepted and Pactwright can self-host core Delivery.  
**Release:** `0.0.2`  
**Exit capability:** Pactwright and Kakeido can execute and project Contract-driven Delivery through GitHub while repository canonical state remains authoritative.

## 1. Goal

Implement deterministic GitHub provisioning, the core managed workflow/checks/projections and remote reconciliation, then prove them on real Pactwright and Kakeido Delivery.

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
pactwright github sync --dry-run
pactwright github sync
.github/workflows/pactwright.yml
Pactwright / Graph
Pactwright / Lifecycle
Pactwright / Review
Delivery PR summary
Intent Issue projection
one shared GitHub Project foundation
Delivery fields/views
runtime replay provenance in remote execution/projection
remote drift reconciliation
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
- concurrent automated branch/PR rebase policy;
- exact check-conclusion mapping for every execution failure class;
- repository-wide policy for PRs with no Delivery lineage.

The checkpoint may implement the minimum safe mechanism needed for its acceptance scenarios, but any new durable semantic rule must first be reconciled with Spec 07.

## Stage 1 — Implement deterministic GitHub desired state

### Step 1 — Implement `github sync --dry-run`

**References:** Specs 02 and 07 provisioning/reconciliation.

**Run**

```text
Implement `pactwright github sync --dry-run` using authenticated GitHub tooling.

Resolve Pactwright-owned desired remote state from current configuration and enabled profiles.
Print planned creates/updates/removals without mutation.
Validate repository identity, permissions and required scopes.
Never silently broaden authentication scopes.
Preserve ambiguous/unowned state and report it.
```

**Expected result**

Dry-run is deterministic, non-mutating and ownership-aware.

**Verify before continuing**

Run fixtures for create/update/no-op/removal-plan/unowned collision plus one real Pactwright dry-run before apply.

### Step 2 — Implement `github sync` apply/reconciliation

**References:** Specs 02 and 07.

**Run**

```text
Implement apply using the exact same desired-state planner as dry-run.
Own only Pactwright-managed repository/Project integration.
Remove a remote object only when ownership is established and no enabled component still requires it.
Leave ambiguous/unowned objects untouched and report them.
```

**Expected result**

Apply converges without deleting unrelated GitHub state.

**Verify before continuing**

Run reconciliation fixtures for create/update/no-op/owned removal/unowned preservation.

## Stage 2 — Generate the core Delivery workflow

### Step 3 — Generate `.github/workflows/pactwright.yml`

**References:** Spec 07 managed workflows and Core profile; Spec 02 sync.

**Run**

```text
Extend `pactwright sync` to render `.github/workflows/pactwright.yml` when GitHub is enabled.

The workflow must:
- install/use the locked Pactwright runtime/environment;
- invoke Pactwright runtime responsibilities rather than duplicate semantics in YAML;
- trigger on relevant Delivery/config/canonical-state changes;
- validate graph/lifecycle/review state;
- continue lifecycle execution only within the runtime's resolved lifecycle shape/policy and stop at Gates/failure/completion;
- use least privilege and the Implementation Guide GitHub Actions baseline;
- never infer Pactwright approval or Decision authority from GitHub approval metadata.
```

**Expected result**

Core remote execution is a thin runtime surface generated from Pactwright state.

**Verify before continuing**

Run sync twice and require byte-identical managed output on the second run.

### Step 4 — Implement core checks

**References:** Spec 07 exact check surface.

**Run**

```text
Implement:
- Pactwright / Graph
- Pactwright / Lifecycle
- Pactwright / Review

Each check consumes runtime-resolved canonical/execution state.
GitHub does not recompute lifecycle topology or infer Review/Decision truth from PR metadata.

For a PR without resolvable Delivery lineage, do not invent a permanent product rule inside this checkpoint. Implement the safest behaviour consistent with current Spec 07 and record any remaining release/maintenance-PR policy gap explicitly.
```

**Expected result**

Checks expose Pactwright truth without becoming its source.

**Verify before continuing**

Test valid/invalid graph, Gate/lifecycle failure and blocking/non-blocking Review cases plus the currently supported non-Delivery PR behaviour.

### Step 5 — Implement Delivery PR summary with replay provenance

**References:** Spec 07 PR summary and revision rules; Implementation Guide replay provenance.

**Run**

```text
Render a concise Delivery PR summary from runtime state.
Link to canonical records instead of copying them.
Show the current Contract/Brief/Delivery/Review/Evidence progression as applicable.

For replayable execution/report context, carry the runtime-supplied identities:
- repository_revision
- project_graph_revision
- environment_lock_hash

GitHub must never derive or substitute those identities itself.
```

**Expected result**

PRs expose useful progress plus exact Pactwright provenance without duplicating canonical truth.

**Verify before continuing**

Compare summary fixtures against runtime outputs and verify all replay identities originate from the runtime.

### Step 6 — Implement Intent Issue and one shared Project foundation

**References:** Spec 07 Intent/Project projection and Delivery field set.

**Run**

```text
Implement the core Intent Issue projection and one shared Pactwright GitHub Project.
Provision the Delivery field set and initial Delivery/Blocked views defined by Spec 07.

Project/Issue fields are derived collaboration state only.
Editing them must not mutate canonical Pactwright records.

Support github.project.enabled: false while checks and PR summaries remain usable.
```

**Expected result**

One reusable Project foundation exists for later Extension profiles.

**Verify before continuing**

Run all-enabled/core-only/project-disabled projection fixtures and prove no extension-specific Project is created.

## Stage 3 — Activate GitHub on Pactwright

### Step 7 — Land generated core workflow before requiring its checks

**References:** Spec 07; Implementation Guide repository changes.

**Run**

```bash
pnpm build
pnpm pactwright sync
```

Land the generated Pactwright-managed workflow through the safest repository path available before its own checks are required.

Then:

```bash
pnpm pactwright github sync --dry-run
```

**Expected result**

The workflow exists on the default branch before remote rules require its checks.

**Verify before continuing**

Review the dry-run and ensure only Pactwright-owned remote state is planned.

### Step 8 — Apply Pactwright GitHub desired state

**Run**

```bash
pnpm pactwright github sync
pnpm pactwright validate
pnpm pactwright github sync --dry-run
```

**Expected result**

Remote state is applied and converged.

**Verify before continuing**

Final dry-run has no unintended drift. Open a safe test PR and prove the managed checks/reporting surface works under the currently supported non-Delivery/Delivery-lineage rules.

## Stage 4 — Prove real Remote Delivery in Pactwright

### Step 9 — Deliver the website foundation through normal Pactwright Delivery

**References:** Spec 08 Remote Delivery milestone; current Pactwright website architecture choices.

**Run**

Use Contract-driven Delivery to create a bounded deployable website foundation using the project's current chosen web architecture.

Before Project Intelligence exists, any product identity/positioning choice required by the public website must be authorised through Decision + Contract rather than inferred by the model.

**Expected result**

A real Pactwright change is delivered through a GitHub PR with canonical lineage, checks, summary and Project/Issue projection.

**Verify before continuing**

Local runtime status and GitHub projections agree; GitHub edits alone cannot advance the Pactwright lifecycle.

### Step 10 — Prove Gate/failure behaviour on a real PR

**References:** Specs 01 and 07.

**Run**

```text
Create a safe Delivery/follow-up where Review blocks completion or a human Gate is pending.
Prove merge/automation does not bypass the runtime state.
GitHub PR approval alone must not create a Decision or satisfy a Pactwright Gate.
Resolve the underlying Pactwright condition through normal runtime/adapter responsibilities and prove checks recover.
```

**Expected result**

Remote automation fails closed at Pactwright authority boundaries.

**Verify before continuing**

Check history and local runtime state agree before and after resolution.

## Stage 5 — Publish the Remote Delivery learning path

### Step 11 — Deliver the GitHub operating guide and example

**References:** Spec 08 Remote Delivery public milestone.

**Run**

Through normal Pactwright Delivery, produce/update:

```text
website foundation/public discovery surface
GitHub setup/operating guide
one executable Remote Delivery example
```

Document only behaviour proven in this checkpoint.

**Expected result**

Users can discover and reproduce Remote Delivery without depending on later Extensions.

**Verify before continuing**

Follow the guide against the real Pactwright GitHub setup or a clean test repository.

## Stage 6 — Release `0.0.2`

### Step 12 — Prepare and tag `0.0.2`

**References:** Implementation Guide npm release model.

Use the standard release PR path, update CHANGELOG from accepted Evidence, tag the merged release commit `v0.0.2`, and let trusted publishing release:

```text
pactwright@0.0.2
@pactwright/standard@0.0.2
```

**Verify before continuing**

Both registry versions resolve and the trusted release workflow succeeds.

## Stage 7 — Prove Remote Delivery in Kakeido

### Step 13 — Upgrade Kakeido to `0.0.2`

**Run**

```bash
pnpm add -D pactwright@0.0.2 @pactwright/standard@0.0.2
pnpm pactwright upgrade --to 0.0.2
pnpm pactwright agent-pack upgrade
pnpm pactwright sync
pnpm pactwright validate
```

Land Pactwright-managed workflow files before applying remote rules, then run:

```bash
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
pnpm pactwright github sync --dry-run
```

**Expected result**

Kakeido gains Pactwright GitHub integration without losing user-authored workflows or remote state.

**Verify before continuing**

Second dry-run converges and pre-existing user workflow hashes remain unchanged.

### Step 14 — Resolve current Kakeido ingestion prerequisites

**References:** current Kakeido canonical engineering/product specifications.

**Run**

```text
Inspect current Kakeido canonical specs and establish only the prerequisites required by the selected first Remote Delivery acceptance target.
Do not use stale embedded copies as authority.
Account/service provisioning remains execution prerequisite/provenance rather than Pactwright graph truth unless the owning project semantics require a Decision.
```

**Expected result**

The real Kakeido acceptance target can be built/tested through its current architecture.

### Step 15 — Deliver a bounded Kakeido ingestion outcome through GitHub

**Run**

Use normal Pactwright Delivery for a current, bounded ingestion-related outcome selected from the Kakeido canonical specs.

The work must preserve the project's current financial and architectural boundaries.

**Expected result**

Kakeido completes a real GitHub-operated Delivery using the published `0.0.2` family.

**Verify before continuing**

Run Pactwright validation and the Kakeido repository-defined tests required by the current specifications.

### Step 16 — Prove all three ownership surfaces

**References:** Specs 02 and 07.

**Run**

Prove separately:

```text
local generated ownership
→ sync changes only Pactwright-managed local files/regions

remote structural ownership
→ github sync detects/restores drift only for Pactwright-owned remote structure

Actions projection ownership
→ derived summaries/fields regenerate from canonical repository state
```

**Expected result**

No GitHub mutation can silently become canonical Pactwright state.

**Verify before continuing**

Record before/after hashes/state and run `pactwright validate`.

## Stage 8 — Capture Checkpoint 2 feedback

### Step 17 — Capture material findings before PI exists

Before Project Intelligence exists, capture material Pactwright responsibility failures as explicit open Intents through normal Delivery authority.

Do not generalise Kakeido-specific preferences.

Blocking failures must be fixed inside this checkpoint.

## Exit gate

Checkpoint 2 closes only when:

- deterministic dry-run/apply reconciliation exists;
- `.github/workflows/pactwright.yml` is generated from locked Pactwright state;
- `Pactwright / Graph`, `/ Lifecycle` and `/ Review` project runtime truth;
- PR summaries carry runtime-provided replay provenance where applicable;
- one shared GitHub Project foundation exists and remains projection-only;
- GitHub metadata cannot create Decisions, satisfy Gates or mutate canonical Project Graph state;
- Pactwright completes one real GitHub-operated Delivery;
- public Remote Delivery guidance matches the implemented surface;
- `0.0.2` is registry verified;
- Kakeido completes one real Remote Delivery from its current canonical specs;
- unmanaged local/remote GitHub state is preserved;
- unresolved managed-resource identity/concurrency/check-mapping policy is not silently canonised;
- no known blocking failure is carried into Checkpoint 3.

---

**Pactwright — Checkpoint 2 — Remote Delivery v10**
