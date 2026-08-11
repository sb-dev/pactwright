# Pactwright — Checkpoint 1 — Self-Hosted Delivery

**Version:** 3 
**Entry condition:** No installable Pactwright runtime exists. 
**Exit capability:** Pactwright installs into itself and Kakeido and completes Intent → Evidence without manual graph-coherence work.

## 1. Goal

Bootstrap the smallest installable Pactwright core, then immediately use it on Pactwright and Kakeido. This is the only checkpoint whose implementation cannot itself be delivered through Pactwright.

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

- **Core graph and lifecycle** — Delivery Graph v5 §§2–22, §24
- **Installation, locking, agents, extensions** — Distribution v5 §§2–8, §§16–19
- **First Kakeido semantic acceptance** — Financial Model v1 §§2–17

## Stage 1 — Build the repository-native Project Graph substrate

Implement canonical graph storage and deterministic core mechanics before any agent or extension behaviour.

### Step 1 — Create the runtime/package foundation

**References:** Delivery §§4–5; Distribution §§2–3

**Run**

```text
Read Delivery Graph v5 §§4–5 and Distribution v5 §§2–3.

Implement the Pactwright runtime/package foundation and parsers for:
- .pactwright/config.yml
- .pactwright/lifecycle.yml
- .pactwright/lock.yml
- specs/nodes/
- specs/graph/edges.yml

Use one canonical loader path. Do not implement optional extensions or GitHub provisioning. Add repository tests using existing project conventions.
```

**Expected result**

The runtime has one canonical project/config/graph loading path and no optional-extension dependency.

**Verify before continuing**

Run the repository-defined typecheck/test commands. Report the exact commands and confirm a clean pass.

### Step 2 — Implement the five core Delivery node schemas

**References:** Delivery §§5–12

**Run**

```text
Implement exactly the five durable core Delivery node types from Delivery Graph v5: intent, decision, contract, brief, evidence.

Enforce common frontmatter, stable IDs, type-specific required fields and Decision outcomes proceed/reject/defer.

Do NOT create durable types for contract alternatives, Delivery execution or Review execution. Add positive and negative schema fixtures.
```

**Expected result**

The runtime can parse and validate all five core node types; transient/execution concepts are not graph node types.

**Verify before continuing**

Run schema tests. Inspect the schema registry and confirm it contains only the five core Delivery node types at this stage.

### Step 3 — Implement the shared typed-edge registry/store

**References:** Delivery §§13, 21

**Run**

```text
Implement specs/graph/edges.yml and the shared typed-edge registry. Register core relations: resolves, selects, decomposes, evidences and same-type supersedes.

Validate source/target existence, endpoint types, unique tuples, no self-supersession and acyclic supersession. Keep the registry extensible for later extension-owned edge types.
```

**Expected result**

Core edge semantics are deterministic and later extensions can register additional owned edge types without changing Delivery semantics.

**Verify before continuing**

Run fixtures for invalid endpoint, invalid endpoint type, duplicate tuple, self-supersession and cycle; all must fail.

### Step 4 — Implement current-lineage derivation

**References:** Delivery §§14–15, 21

**Run**

```text
Implement current Delivery lineage derivation from graph structure. Enforce at most one current Decision per Intent, proceed selecting one current Contract, reject/defer selecting none, at most one current Brief per Contract and one current Evidence per Brief. Superseded records are not current.

Derive lifecycle state; do not store redundant state fields.
```

**Expected result**

Open, deferred, rejected, contracted, delivering and done are derived views of canonical graph structure.

**Verify before continuing**

Run lineage fixtures including an ambiguous lineage and confirm validation fails.

### Step 5 — Implement the deterministic Project Graph revision

**References:** Delivery §5

**Run**

```text
Implement one deterministic Project Graph revision over canonical registered Project Graph state. Include registered canonical nodes/edges and future extension canonical records. Exclude generated reports, adapter output, execution provenance, GitHub state and other derived state. Canonicalise ordering before hashing.
```

**Expected result**

The same canonical graph state always produces the same revision and non-canonical files cannot change it.

**Verify before continuing**

Run three fixtures: identical state => identical revision; generated-file change => unchanged revision; canonical node/edge change => changed revision.

## Stage 2 — Build the core Delivery lifecycle runtime

Make lifecycle progression deterministic and graph-backed before adding AI execution.

### Step 6 — Implement lifecycle configuration

**References:** Delivery §17

**Run**

```text
Implement .pactwright/lifecycle.yml parsing/validation for the stable stages capture-intent, propose-contracts, approve-contract, write-brief, deliver-brief, review and prepare-evidence. Support manual/automatic execution, authorised Decision actor and human gates. Do not add Deployment, Asset, Publication or Observation as stages.
```

**Expected result**

Repositories can configure execution/gates without changing the stable lifecycle structure.

**Verify before continuing**

Run tests for both lifecycle examples in Delivery §17 plus invalid actor/stage fixtures.

### Step 7 — Implement lifecycle graph mutations

**References:** Delivery §§6–15, 19

**Run**

```text
Implement runtime graph-mutation responsibilities for creating Intent, recording Decision, creating the canonical Contract, creating Brief and creating Evidence plus required core edges and explicit supersession. Contract alternatives remain transient. Delivery execution and Review do not directly mutate the Delivery Graph.
```

**Expected result**

Proceed/reject/defer produce the exact canonical structures defined by the Delivery spec.

**Verify before continuing**

Run proceed, reject and defer fixtures and inspect resulting graph state.

### Step 8 — Implement lifecycle status/next/run

**References:** Delivery §§18, 20

**Run**

```text
Implement pactwright lifecycle status, next and run. The runtime derives transitions from graph state + lifecycle.yml + repository state. lifecycle run stops at a human gate, completion, failure or validation error and never skips configured gates. When current Evidence exists, next reports no further core Delivery stage.
```

**Expected result**

The runtime—not prompts—owns stage progression.

**Verify before continuing**

Use fixture repositories to prove run stops at a manual gate and no next core stage exists after Evidence.

### Step 9 — Implement validate and context

**References:** Delivery §§21–22

**Run**

```text
Implement pactwright validate and pactwright context <node-id> [--history]. Default context returns the current core lineage only and excludes rejected alternatives, superseded nodes, review transcripts, obsolete reasoning and execution provenance. Keep a namespaced extension-context seam for later checkpoints.
```

**Expected result**

A user or agent can recover high-signal current Delivery context from one command.

**Verify before continuing**

Run validate and context against open, delivering and done fixtures; inspect output for excluded historical/transient material.

## Stage 3 — Add replaceable AI execution

Connect core responsibilities to an agent pack and generated Claude Code adapter without moving lifecycle semantics into prompts.

### Step 10 — Implement the core capability model and default agent pack

**References:** Distribution §7; Delivery §16

**Run**

```text
Implement the initial capability model and @pactwright/standard agent pack for delivery-specification, delivery-execution and delivery-review. Resolve agents/skills and lock their hashes. Reject a pack missing a required capability before canonical graph mutation.
```

**Expected result**

Core AI behaviour is replaceable and capability-checked.

**Verify before continuing**

Run a complete-pack fixture and an incomplete-pack fixture; the latter must fail without lock/graph mutation.

### Step 11 — Implement Claude Code adapter rendering

**References:** Distribution §8; Delivery §19

**Run**

```text
Implement the initial Claude Code adapter generation into .claude/agents and .claude/commands. Generate /capture-intent, /propose-contracts, /approve-contract, /write-brief, /deliver-brief, /review and /prepare-evidence. Generated commands invoke runtime responsibilities; prompts must not own transition rules.
```

**Expected result**

The adapter is generated and deterministic.

**Verify before continuing**

After sync exists, run it twice and require byte-identical generated adapter output.

### Step 12 — Implement the initial evaluation runner

**References:** Distribution §16

**Run**

```text
Implement pactwright eval with an initial core Delivery suite. Keep deterministic assertions separate from semantic judgement. Add cases for contract fidelity, scope discipline, required graph/output structure, forbidden mutation and Review defect detection. Do not calculate one aggregate quality score.
```

**Expected result**

Core agent behaviour can be evaluated independently from project Delivery.

**Verify before continuing**

Run `pnpm pactwright eval` once the CLI is wired and inspect per-case output.

## Stage 4 — Make Pactwright installable and composable

Implement Distribution commands and deterministic local generation.

### Step 13 — Implement `pactwright init`

**References:** Distribution §§2–3

**Run**

```text
Implement pactwright init. In a clean repository create only Pactwright-owned core configuration/graph structure from Distribution §§2–3 using @pactwright/standard and Claude Code defaults. Do not copy runtime scripts into the consumer repository. Handle existing files safely.
```

**Expected result**

A clean repository can initialise Pactwright with no manual copying.

**Verify before continuing**

Install the local package in a clean fixture and run `pnpm pactwright init` followed by `pnpm pactwright validate`.

### Step 14 — Implement config/lock resolution

**References:** Distribution §§3, 6

**Run**

```text
Implement desired-state config resolution and exact lock state. Lock runtime version, selected agent pack version/hash and resolved agent/skill hashes; prepare extension lock structure for later use. Same desired state must resolve reproducibly.
```

**Expected result**

Config expresses intent; lock records exact resolved runtime/AI state.

**Verify before continuing**

Resolve the same fixture twice and compare lock output byte-for-byte.

### Step 15 — Implement extension manifests/dependency resolution

**References:** Distribution §§4–5

**Run**

```text
Implement package-backed extension manifest loading, compatibility checks, dependency resolution, graph contribution registration, command namespaces, required capabilities and GitHub profile metadata. Implement extension add/remove/upgrade using an internal fixture extension first. Block dependency removal while enabled dependants exist and preserve user-authored canonical extension data on removal.
```

**Expected result**

The runtime can safely compose independently versioned extensions before first-party extensions are implemented.

**Verify before continuing**

Run fixture tests for add, dependency add, blocked removal, safe disable and preserved canonical data.

### Step 16 — Implement deterministic `pactwright sync`

**References:** Distribution §8

**Run**

```text
Implement pactwright sync: load config/lock/extensions, validate capability union, assemble agents/skills and render only Pactwright-managed local integration. It must not mutate GitHub remote state or unrelated user files. Repeated sync with unchanged inputs must be byte-identical.
```

**Expected result**

Local generated integration converges from config + lock.

**Verify before continuing**

Run `pnpm pactwright sync` twice in a fixture and require `git diff --exit-code` after the second run.

## Stage 5 — Prove the bootstrap runtime

Run the real commands in a clean consumer before self-hosting.

### Step 17 — Install and initialise a clean fixture

**References:** Distribution §§2, 8; Delivery §§20–22

**Run**

```bash
pnpm add -D pactwright@<local-package>
pnpm pactwright init
pnpm pactwright sync
pnpm pactwright validate
pnpm pactwright lifecycle status
```

**Expected result**

The fixture becomes a valid core Pactwright repository.

**Verify before continuing**

No manual edit to graph/config/generated files is required beyond intentional project configuration.

### Step 18 — Complete one full Delivery with the generated adapter

**References:** Delivery §19

**Run**

```text
/capture-intent "Create one small repository artefact that proves the complete Pactwright Delivery lifecycle."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Expected result**

Canonical graph contains current Intent, Decision, Contract, Brief and Evidence; rejected alternatives remain transient.

**Verify before continuing**

Run `pnpm pactwright validate`, `pnpm pactwright lifecycle status`, and `pnpm pactwright context <intent-id>`.

## Stage 6 — Adopt Pactwright in Pactwright

Cross the self-hosting boundary.

### Step 19 — Initialise the Pactwright repository with its own build

**References:** Distribution §§2, 8

**Run**

```bash
pnpm add -D pactwright@<checkpoint-build>
pnpm pactwright init
pnpm pactwright sync
pnpm pactwright validate
```

**Expected result**

Pactwright is now a consumer of its own runtime.

**Verify before continuing**

Run `pnpm pactwright lifecycle status` and confirm the repository is valid.

### Step 20 — Deliver the first self-hosted Quick Start improvement

**References:** Open-Source Project Organisation §§2–3, 8, 15–16; Delivery §19

**Run**

```text
/capture-intent "Create or refine Pactwright's core Quick Start so it documents the installation and Delivery commands that now actually work."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Expected result**

The first self-hosted project change is real documentation tied to working behaviour.

**Verify before continuing**

Follow the resulting Quick Start in a clean fixture and confirm it reaches a valid repository.

## Stage 7 — Prove Checkpoint 1 on Kakeido

Use the same installable release on a semantically unrelated consumer.

### Step 21 — Install core Pactwright in Kakeido

**References:** Distribution §§2–3

**Run**

```bash
pnpm add -D pactwright@<checkpoint-version>
pnpm pactwright init
pnpm pactwright sync
pnpm pactwright validate
```

**Expected result**

Kakeido has core Delivery only; no optional extension is enabled.

**Verify before continuing**

Run `pnpm pactwright lifecycle status`.

### Step 22 — Deliver Kakeido financial-domain invariants

**References:** Kakeido Financial Model §§2–17; Delivery §19

**Run**

```text
/capture-intent "Implement Kakeido's shared financial-domain model and deterministic invariant tests from Kakeido — Financial Model Spec v1 §§2–17."
/propose-contracts <intent-id>
/approve-contract <contract-id> "<selection notes>"
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

**Expected result**

Implementation preserves fixed/flexible separation, envelope reconciliation, split/duplicate determinism, reviewed-only totals, user-confirmed classification and immutable historical spendings across plan changes.

**Verify before continuing**

Run Pactwright validation/status and the Kakeido repository-defined financial-domain tests, reporting exact commands/results.

## Exit gate

All Stage 1–7 verifications pass; Pactwright and Kakeido each complete a real Intent → Evidence path; the second `sync` is clean; no lifecycle/graph coherence requires hand-maintained relationships.

---

**Pactwright — Checkpoint 1 — Self-Hosted Delivery v3**
