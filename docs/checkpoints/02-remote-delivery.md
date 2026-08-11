# Pactwright — Checkpoint 2 — Remote Delivery

**Version:** 3 
**Entry condition:** Checkpoint 1 is accepted and Pactwright can self-host core Delivery. 
**Exit capability:** Pactwright and Kakeido can execute/project Delivery through GitHub while repository graph state remains canonical.

## 1. Goal

Implement GitHub provisioning, the core Delivery workflow/checks and remote projections, then use them to deliver the first Pactwright website foundation and Kakeido CSV-ingestion foundation.

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

- **GitHub boundary/profile/workflow** — GitHub v5 §§1–5
- **PR/check/project projections** — GitHub §§9–19, §25, §27
- **Provisioning/reconciliation** — Distribution §§8–14
- **Kakeido delivery target** — Tech Stack §§8, 13–16; Product & UX §4.1

## Stage 1 — Implement deterministic GitHub provisioning

Build Distribution-owned remote reconciliation before Actions projection.

### Step 1 — Implement `github sync --dry-run`

**References:** Distribution §§9–14

**Run**

```text
Using Checkpoint 1 Delivery, implement pactwright github sync --dry-run. Use authenticated gh, validate repository/permissions/scopes, resolve Pactwright-owned desired remote state and print planned creates/updates/removals without mutation. If project scope is missing, print the exact gh auth remediation. Never silently broaden auth scopes.
```

**Expected result**

Dry-run is deterministic, non-mutating and ownership-aware.

**Verify before continuing**

Run `pnpm pactwright github sync --dry-run` against a fixture repository and confirm no remote state changes.

### Step 2 — Implement `github sync` apply/reconciliation

**References:** Distribution §§9–14

**Run**

```text
Implement pactwright github sync using the same desired-state planner as dry-run. Own only Pactwright-managed repository settings, semantic labels, ruleset/check requirements, shared Project, fields and views. Prefer native gh commands; use gh api only for unsupported write operations. Leave ambiguous/unowned remote objects intact and report them.
```

**Expected result**

Applying desired state converges without deleting unrelated GitHub objects.

**Verify before continuing**

Run `pnpm pactwright github sync` then `pnpm pactwright github sync --dry-run`; the second command must report convergence.

## Stage 2 — Generate the core Delivery workflow and checks

Use thin Actions that invoke the locked Pactwright runtime.

### Step 3 — Generate `.github/workflows/pactwright.yml`

**References:** GitHub §§4–5; Distribution §8

**Run**

```text
Extend pactwright sync to generate .github/workflows/pactwright.yml. The workflow installs/uses the locked Pactwright runtime, loads config/lock, invokes pactwright validate/lifecycle responsibilities and declares least-privilege permissions. It must not duplicate lifecycle semantics in YAML and must not own unrelated user workflows.
```

**Expected result**

Core Delivery CI is generated from Pactwright desired state.

**Verify before continuing**

Run `pnpm pactwright sync` twice and require a clean second diff; inspect that only pactwright.yml is newly owned.

### Step 4 — Implement core GitHub checks

**References:** GitHub §16

**Run**

```text
Implement projection for Pactwright / Graph, Pactwright / Lifecycle and Pactwright / Review. Each result derives from runtime state: structural graph validity, valid lifecycle/gates, and configured Review blocking status. GitHub metadata must not be treated as canonical lifecycle state.
```

**Expected result**

Core checks accurately expose runtime truth.

**Verify before continuing**

Use fixture PRs for valid graph, invalid graph and blocking Review; confirm expected check states.

### Step 5 — Implement the concise Delivery PR summary

**References:** GitHub §12

**Run**

```text
Implement the Pactwright Delivery PR summary showing derived Intent, Contract, Brief, Delivery, Review, Evidence and current stage, linking to graph artefacts rather than copying their contents. Do not persist lifecycle state in GitHub.
```

**Expected result**

PRs expose progress without duplicating graph truth.

**Verify before continuing**

Open a fixture PR and compare the summary to `pnpm pactwright lifecycle status`.

### Step 6 — Implement core Intent Issue/shared Project foundation

**References:** GitHub §§17–19; Distribution §12

**Run**

```text
Implement the core shared GitHub Project foundation and Intent Issue projection required by the Delivery profile. Project values are derived navigation/collaboration state only. Do not create extension-specific Projects.
```

**Expected result**

One reusable Project foundation exists for later profiles.

**Verify before continuing**

Run dry-run/apply and inspect that one Project is linked to the repository when configured.

## Stage 3 — Activate GitHub on Pactwright

Adopt the new remote surface before using it on Kakeido.

### Step 7 — Generate and preview Pactwright GitHub desired state

**References:** Distribution §§8–10

**Run**

```bash
pnpm pactwright sync
pnpm pactwright github sync --dry-run
```

**Expected result**

The dry-run lists exactly the Pactwright-owned remote objects to create/update.

**Verify before continuing**

Review the plan manually; no unrelated project/repository objects should appear.

### Step 8 — Apply Pactwright GitHub desired state

**References:** Distribution §§9–14

**Run**

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

**References:** Open-Source Project Organisation §§4–6, 12–16; website engineering spec; Delivery §19

**Run**

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

**References:** Delivery §19; GitHub §§5, 12, 16

**Run**

```text
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Expected result**

The change is delivered through a GitHub PR with Pactwright checks/summary.

**Verify before continuing**

Run `pnpm pactwright validate`; inspect the PR summary/checks and confirm they match local runtime state.

## Stage 5 — Upgrade Kakeido and prove remote Delivery

Install the same checkpoint and deliver a real CSV-ingestion foundation.

### Step 11 — Upgrade/reconcile Kakeido

**References:** Distribution §§8–14

**Run**

```bash
pnpm add -D pactwright@<checkpoint-version>
pnpm pactwright sync
pnpm pactwright validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
```

**Expected result**

Kakeido gets Pactwright-owned GitHub integration without losing application/release workflows.

**Verify before continuing**

Run a final dry-run and compare hashes of pre-existing Kakeido user-authored workflows.

### Step 12 — Deliver the CSV ingestion foundation

**References:** Kakeido Tech Stack §§7–9; Product & UX §4.1; Financial Model §§6–8, 15, 17

**Run**

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

### Step 13 — Prove unmanaged GitHub state remains untouched

**References:** Distribution §8; GitHub §2

**Run**

```text
In a safe fixture or Kakeido branch, create/identify one user-authored workflow outside Pactwright ownership, hash it, run pactwright sync and verify the hash is unchanged. Then modify one Pactwright-projected GitHub field and prove canonical graph files are unchanged and github sync can detect/restore owned desired state.
```

**Expected result**

Pactwright ownership boundaries hold locally and remotely.

**Verify before continuing**

Record before/after hashes and run `pnpm pactwright validate`.

## Exit gate

Pactwright and Kakeido each complete a real GitHub-operated Delivery; dry-run/apply converge; unmanaged workflows/remote objects are preserved; GitHub metadata alone cannot create canonical Delivery state.

---

**Pactwright — Checkpoint 2 — Remote Delivery v3**
