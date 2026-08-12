# Pactwright — Checkpoint 2 — Remote Delivery

**Version:** 8 
**Entry condition:** Checkpoint 1 is accepted and Pactwright can self-host core Delivery. 
**Exit capability:** Pactwright and Kakeido can execute/project Delivery through GitHub while repository graph state remains canonical.

## 1. Goal

Implement GitHub provisioning, the core Delivery workflow/checks and remote projections, then use them to deliver the first Pactwright website foundation and Kakeido CSV-ingestion foundation.

## 2. Specification baseline

- [Pactwright — Delivery Graph and Lifecycle Engineering Spec](../research-logs/2026-08-11-pactwright-delivery-graph-and-lifecycle-engineering-spec.md)
- [Pactwright — Distribution, Agents and Evaluation](../research-logs/2026-08-11-pactwright-distribution-agents-and-evaluation.md)
- [Pactwright — GitHub Actions and Views](../research-logs/2026-08-11-pactwright-github-actions-and-views.md)
- [Pactwright — Project Intelligence Graph Engineering Spec](../research-logs/2026-08-11-pactwright-project-intelligence-graph-engineering-spec.md)
- [Pactwright — Graph Review & Creative Delivery Engineering Spec](../research-logs/2026-08-11-pactwright-graph-review-and-creative-delivery-engineering-spec.md)
- [Pactwright — Operations Graph Engineering Spec](../research-logs/2026-08-11-pactwright-operations-graph-engineering-spec.md)
- [Pactwright — System Architecture](../research-logs/2026-08-11-pactwright-system-architecture.md)
- [Pactwright — Implementation Principles](./00-implementation-principles.md)
- [Pactwright Open-Source Project Organisation](../research-logs/2026-08-11-pactwright-open-source-project-organisation.md)
- [Design Specification: Astro + Cloudflare Workers + Meta CAPI](../research-logs/2026-08-11-astro-design-spec.md)
- [Kakeido — Financial Model Spec](../research-logs/2026-08-11-kakeido-financial-model-spec.md)
- [Kakeido — Product & UX Spec](../research-logs/2026-08-11-kakeido-product-and-ux-spec.md)
- [Kakeido — Mobile Design Spec](../research-logs/2026-08-11-kakeido-mobile-design-spec.md)
- [Kei — Assistant Spec](../research-logs/2026-08-11-kakeido-assistant-spec.md)
- [Kakeido — Tech Stack Engineering Spec](../research-logs/2026-08-11-kakeido-tech-stack-engineering-spec.md)

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

**Default execution location:** the Pactwright repository root unless the step explicitly names Kakeido or a fixture

For repository/code changes, finish with `pnpm verify`. Before invoking a newly implemented Pactwright runtime command during implementation, run `pnpm build` so the repository-local CLI is not using stale distribution output.

After Checkpoint 2 activates GitHub, land coherent repository changes through pull requests and required checks rather than direct default-branch commits.

Dynamic ids such as `<source-id>`, `<brief-id>` and `<evidence-id>` must come from an earlier command in the runbook. Commands that create or resolve durable records must print the ids required by later steps.

Fixture verification means repository test fixtures unless a step explicitly creates a real repository or GitHub resource.

## 4. Checkpoint specification map

- **GitHub boundary/profile/workflow** — Pactwright — GitHub Actions and Views §§1–5
- **PR/check/project projections** — Pactwright — GitHub Actions and Views §§9–19, §25, §27
- **Provisioning/reconciliation** — Pactwright — Distribution, Agents and Evaluation §§8–14
- **Kakeido delivery target** — Kakeido — Tech Stack Engineering Spec §§8, 13–16
- **Kakeido delivery target** — Kakeido — Product & UX Spec §4.1

## Stage 1 — Implement deterministic GitHub provisioning

Build Distribution-owned remote reconciliation before Actions projection.

### Step 1 — Implement `github sync --dry-run`

**References:** Provisioning/reconciliation §§9–14

**Run**

```text
Using Checkpoint 1 Delivery, implement pactwright github sync --dry-run. Use authenticated gh, validate repository/permissions/scopes, resolve Pactwright-owned desired remote state and print planned creates/updates/removals without mutation. If project scope is missing, print the exact gh auth remediation. Never silently broaden auth scopes.
```

**Expected result**

Dry-run is deterministic, non-mutating and ownership-aware.

**Verify before continuing**

Run the GitHub desired-state planner/reconciliation test fixtures, then run `pnpm build`. Real GitHub dry-run is exercised on Pactwright in Stage 3.

### Step 2 — Implement `github sync` apply/reconciliation

**References:** Provisioning/reconciliation §§9–14

**Run**

```text
Implement pactwright github sync using the same desired-state planner as dry-run. Own only Pactwright-managed repository settings, semantic labels, ruleset/check requirements, shared Project, fields and views. Prefer native gh commands; use gh api only for unsupported write operations. Leave ambiguous/unowned remote objects intact and report them.
```

**Expected result**

Applying desired state converges without deleting unrelated GitHub objects.

**Verify before continuing**

Run reconciliation fixtures covering create/update/no-op/unowned objects, then run `pnpm build`. Real remote apply/convergence is exercised on Pactwright in Stage 3.

## Stage 2 — Generate the core Delivery workflow and checks

Use thin Actions that invoke the locked Pactwright runtime.

### Step 3 — Generate `.github/workflows/pactwright.yml`

**References:** GitHub boundary/profile/workflow §§4–5; Provisioning/reconciliation §8

**Run**

```text
Extend pactwright sync to generate .github/workflows/pactwright.yml. The workflow installs/uses the locked Pactwright runtime, loads config/lock, invokes pactwright validate/lifecycle responsibilities and declares least-privilege permissions. It must not duplicate lifecycle semantics in YAML and must not own unrelated user workflows.
```

**Expected result**

Core Delivery CI is generated from Pactwright desired state.

**Verify before continuing**

Run `pnpm build`, then `pnpm pactwright sync` twice from the Pactwright repository root and require the second sync to leave managed output unchanged.

### Step 4 — Implement core GitHub checks

**References:** PR/check/project projections §16

**Run**

```text
Implement projection for Pactwright / Graph, Pactwright / Lifecycle and Pactwright / Review. Each result derives from runtime state: structural graph validity, valid lifecycle/gates, and configured Review blocking status. GitHub metadata must not be treated as canonical lifecycle state.
```

**Expected result**

Core checks accurately expose runtime truth.

**Verify before continuing**

Run projection fixtures for valid graph, invalid graph and blocking Review, then run `pnpm build`.

### Step 5 — Implement the concise Delivery PR summary

**References:** PR/check/project projections §12

**Run**

```text
Implement the Pactwright Delivery PR summary showing derived Intent, Contract, Brief, Delivery, Review, Evidence and current stage, linking to graph artefacts rather than copying their contents. Do not persist lifecycle state in GitHub.
```

**Expected result**

PRs expose progress without duplicating graph truth.

**Verify before continuing**

Run PR-summary projection fixtures against known lifecycle states, then run `pnpm build`. A real PR comparison is exercised in Stage 4.

### Step 6 — Implement core Intent Issue/shared Project foundation

**References:** PR/check/project projections §§17–19; Provisioning/reconciliation §12

**Run**

```text
Implement the core shared GitHub Project foundation and Intent Issue projection required by the Delivery profile. Project values are derived navigation/collaboration state only. Do not create extension-specific Projects.
```

**Expected result**

One reusable Project foundation exists for later profiles.

**Verify before continuing**

Run shared-Project reconciliation fixtures proving one Project is produced and extension-specific Projects are not.

## Stage 3 — Activate GitHub on Pactwright

Adopt the new remote surface before using it on Kakeido.

### Step 7 — Generate and preview Pactwright GitHub desired state

**References:** Provisioning/reconciliation §§8–10

**Run**

From the Pactwright repository root:

```bash
pnpm add -D pactwright@0.0.2

pnpm pactwright sync
pnpm pactwright github sync --dry-run
```

**Expected result**

The dry-run lists exactly the Pactwright-owned remote objects to create/update.

**Verify before continuing**

Review the plan manually; no unrelated project/repository objects should appear.

### Step 8 — Apply Pactwright GitHub desired state

**References:** Provisioning/reconciliation §§9–14

**Run**

From the Pactwright repository root:

```bash
pnpm pactwright github sync
pnpm pactwright validate
pnpm pactwright github sync --dry-run
```

**Expected result**

Remote state is applied and immediately converged.

**Verify before continuing**

The final dry-run shows no unintended drift.

## Stage 4 — Deliver the Pactwright website foundation through GitHub

Use the newly implemented remote Delivery surface on real project work.

### Step 9 — Capture and brief the website foundation

**References:** Open-Source Project Organisation §§4–6, 12–16; website engineering spec; Delivery Graph §19


**Run**

From the Pactwright repository root:

```text
/capture-intent "Create the deployable Pactwright website foundation using the adopted Astro/Cloudflare architecture, Markdown-first content, and repository-as-source-of-truth organisation."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
```

**Expected result**

A bounded Brief exists for a deployable public foundation, not the full future website ecosystem.

**Verify before continuing**

Run `pnpm pactwright context <brief-id>` and inspect that the Brief references only relevant website/project constraints.

### Step 10 — Deliver/review/evidence the website foundation

**References:** Delivery Graph §19; GitHub boundary/profile/workflow §5; PR/check/project projections §§12, 16


**Run**

From the Pactwright repository root:

```text
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Expected result**

The change is delivered through a GitHub PR with Pactwright checks/summary.

**Verify before continuing**

Run `pnpm pactwright validate`; inspect the PR summary/checks and confirm they match local runtime state.

## Stage 5 — Advance the remote-Delivery public product

### Step 11 — Publish the GitHub operating path

**References:** Open-Source Project Organisation §§1.3, 4, 6; Implementation Principles §§5A, 12

**Run**

From the Pactwright repository root:

```text
/capture-intent "Publish the user-facing Remote Delivery path for Pactwright: make the website foundation usable, add the GitHub setup/operating guide, and add one remote Delivery example that matches the GitHub Actions and Views behaviour delivered in this checkpoint."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Expected result**

Users can discover the remote capability from the website and reproduce it from Docs/Examples.

**Verify before continuing**

Use the shipped guide/example against the real Pactwright GitHub setup and confirm no step depends on future Project Intelligence or Review capabilities.

## Stage 6 — Release `0.0.2`

Use the trusted release workflow established in Checkpoint 1.

### Step 12 — Prepare, merge and tag `0.0.2`

**References:** Distribution §§2, 6–8, 15, 18–19

**Run**

Update `CHANGELOG.md` from accepted Checkpoint 2 Evidence only, then:

```bash
VERSION=0.0.2
DEFAULT_BRANCH="$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name)"

git switch "$DEFAULT_BRANCH"
git pull --ff-only
git switch -c "release/$VERSION"

pnpm version "$VERSION" -r --no-git-tag-version --allow-same-version
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

git tag -a "v$VERSION" -m "v$VERSION"
git push origin "v$VERSION"
```

**Expected result**

The tag-triggered `release.yml` workflow verifies the merged source and publishes the already trusted package family as `0.0.2` under `next`.

**Verify before continuing**

Confirm the `release.yml` run for `v0.0.2` succeeded, then:

```bash
pnpm view pactwright@0.0.2 version
pnpm view @pactwright/standard@0.0.2 version
```

Both must return `0.0.2`, and npm provenance/trusted-publisher metadata must be present.


## Stage 7 — Upgrade Kakeido and prove remote Delivery

Run this stage from the Kakeido repository root unless a step explicitly says otherwise.

Install the published checkpoint release and deliver a real CSV-ingestion foundation.

### Step 13 — Upgrade/reconcile Kakeido

**References:** Provisioning/reconciliation §§8–14

**Run**

```bash
pnpm add -D pactwright@0.0.2

pnpm pactwright sync
pnpm pactwright validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

**Expected result**

Kakeido gets Pactwright-owned GitHub integration without losing application/release workflows.

**Verify before continuing**

Run a final dry-run and compare hashes of pre-existing Kakeido user-authored workflows.

### Step 14 — Deliver the CSV ingestion foundation

**References:** Kakeido Tech Stack §§7–9; Kakeido delivery target §4.1; Financial Model §§6–8, 15, 17


**Run**

From the Kakeido repository root:

```text
/capture-intent "Implement Kakeido's first CSV ingestion foundation: upload metadata validation, R2 storage, parse/normalise boundary, possible duplicate/invalid-row preparation and canonical spending persistence. Preserve the Financial Model and Tech Stack boundaries."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Expected result**

CSV ingestion respects API/R2/normalisation/Neon boundaries and possible duplicates remain review findings.

**Verify before continuing**

Run Pactwright validation/status and the Kakeido repository-defined import/domain tests.

### Step 15 — Prove unmanaged GitHub state remains untouched

**References:** Provisioning/reconciliation §8; GitHub boundary/profile/workflow §2

**Run**

```text
In a safe fixture or Kakeido branch, hash repository/user-owned workflows outside Pactwright ownership—including `ci.yml`/`release.yml` where present—run `pactwright sync` and verify every hash is unchanged. Then modify one Pactwright-projected GitHub field and prove canonical graph files are unchanged and github sync can detect/restore owned desired state.
```

**Expected result**

Pactwright ownership boundaries hold locally and remotely.

**Verify before continuing**

Record before/after hashes and run `pnpm pactwright validate`.

## Exit gate

Pactwright and Kakeido each complete a real GitHub-operated Delivery; dry-run/apply converge; unmanaged workflows/remote objects are preserved; GitHub metadata alone cannot create canonical Delivery state.

---

**Pactwright — Checkpoint 2 — Remote Delivery v8**