# Pactwright — Checkpoint 4 — Graph Review

**Version:** 12  
**Entry condition:** Checkpoint 3 is accepted.  
**Release:** `0.0.4`  
**Exit capability:** Pactwright and Kakeido can run reproducible specialist Graph Reviews over registered Project Graph state, retain immutable Review Execution provenance, route every successful Finding through Project Intelligence, and turn accepted Project Intelligence consequences motivated by Findings into normal governed Delivery.

## 1. Goal

Implement Graph Review as a small independent Pactwright Extension:

```text
review request
→ registered Project Graph scope
→ graph-review capability
→ immutable Review Execution
→ Finding
→ Project Intelligence Source
→ triage / promotion where justified
→ Delivery candidate
→ explicit Intent
→ normal Delivery
```

Checkpoint 4 consumes the Extension dependency, capability-resolution, Project Intelligence, replay and GitHub composition machinery established by Checkpoints 1–3. It must not introduce Graph Review-specific alternatives to those mechanisms.

Do not rebuild the removed Review & Creative architecture.

Graph Review is specialist Project Graph analysis. It is not Delivery Review, a provider runtime, a reviewer catalogue or a second roadmap.

## 2. Canonical baseline

Canonical Pactwright semantics come from:

- [01 — Core System and Lifecycle](../specs/01-pactwright-core-system-and-lifecycle.md)
- [02 — Distribution, Agent Packs, Extensions and Evaluation](../specs/02-distribution-agent-packs-extensions-and-evaluation.md)
- [03 — Project Intelligence](../specs/03-project-intelligence.md)
- [04 — Graph Review](../specs/04-graph-review.md)
- [07 — GitHub Integration](../specs/07-github-integration.md)
- [08 — Open-Source Project Organisation](../specs/08-open-source-project-organisation.md)
- [Implementation Principles](./00-implementation-principles.md)
- [Implementation Guide](./00-implementation-guide.md)

Research logs are rationale only.

Kakeido acceptance uses the current canonical Kakeido specifications from the Kakeido repository.

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

Default execution location is the Pactwright repository root unless a step names Kakeido or a fixture.

For repository/code changes:

```bash
pnpm verify
```

Before invoking newly implemented repository-local commands:

```bash
pnpm build
```

After Checkpoint 2, coherent changes land through pull requests and required checks. New generated workflows follow its existing workflow-availability preflight before any corresponding required checks are enabled.

Dynamic ids consumed by later steps must be printed or resolved by earlier steps.

Release and consumer upgrades follow [Checkpoint 2 — Exact-version upgrade acceptance](./02-remote-delivery.md#exact-version-upgrade-acceptance), including explicit desired component constraints, compatible intermediate environments and package/lock verification after each owning command.

## 4. Checkpoint scope

Checkpoint 4 implements and proves:

```text
@pactwright/graph-review
real Graph Review → Project Intelligence dependency lifecycle with explicit fixture-pack prerequisites
one graph-review semantic capability
Graph Review request input
extension-aware scope resolution
immutable Review Execution provenance
Finding semantics and severity neutrality
Finding → PI Source hand-off
retryable hand-off without rerunning review
pinned replay and explicit --current rerun
complete Spec 04 Graph Review validation matrix
derived-report determinism and failure isolation
bounded external-evidence provenance/replay behaviour
graph-review Pactwright evaluation cases
pactwright-graph-review.yml
Graph Review GitHub profile/automation/projections through the shared integration
real Pactwright Graph Reviews
real Kakeido Graph Reviews
review-driven corrective Delivery
Graph Review public learning path under existing PI readiness gates
exact real 0.0.3 → 0.0.4 ownership-specific upgrade/install path
```

### Explicitly removed from the checkpoint

Do not implement:

```text
Review Definitions
reviewer roster
review next-actions
ProviderRuntime
provider registry
model router
task catalogue
Generation Records
Generation Guidance
generation budgets
@pactwright/review-creative
@pactwright/creative
pactwright review ...
pactwright creative ...
Assets / Publication semantics
```

Specialist perspectives come from the review request plus the selected Agent Pack and relevant Production Skills where available.

### Explicitly unresolved

Do not silently solve:

- physical storage format of Findings beyond immutable identity/provenance requirements;
- long-term retention/reacquisition of historical Git objects, packages or external Production Skills revisions;
- exact retention/reconstruction mechanism for mutable external research evidence;
- any persistent Review Definition abstraction;
- specialised Graph Review capabilities beyond `graph-review`.

Full external Production Skills integration/locking remains owned by Checkpoint 5. Checkpoint 4 uses resolved direct skills from the selected Agent Pack and representative environment fixtures without claiming external imports already work. Checkpoint 5 repeats replay conformance with real external skill and Production Extension Pack dependencies.

## Stage 1 — Package the Graph Review Extension

### Step 1 — Create `@pactwright/graph-review` and prove the real PI dependency lifecycle

**References:** Specs 02 and 04 Extension/capability/dependency boundaries.

**Run**

```text
Using normal self-hosted Pactwright Delivery, create `@pactwright/graph-review` as a publishable first-party Extension package.

Its manifest must:
- identify the graph-review Extension;
- require Project Intelligence;
- require exactly the `graph-review` Agent Pack capability;
- register the `graph-review` runtime namespace;
- register only Graph Review-owned execution/configuration/GitHub contributions;
- not register Asset, Publication or Operations semantics.

Keep Review Executions and Findings as execution provenance/output rather than normal Project Graph node types.
Use the existing generic Extension dependency path. Do not add PI-specific dependency installation logic.

Before the positive installation fixture, prepare and explicitly select a compatible fixture Agent Pack providing the core capabilities plus `graph-review` using normal `agent-pack use`. Record its exact source/version/lock identity.
This fixture implements only enough AI behaviour for dependency testing. It is not a replacement public pack or reviewer system.
Do not assume the current standard pack already provides graph-review; Step 2 adds that real implementation and repeats this installation proof with it.
```

**Expected result**

With its explicit fixture-pack prerequisite satisfied, Distribution can install Graph Review, resolve PI first where absent, record the exact dependency and validate the complete capability set.

**Verify before continuing**

Prove the real dependency lifecycle with fixtures:

```text
compatible fixture Agent Pack explicitly selected; PI absent
→ extension add graph-review
→ PI resolves/installs first through normal Extension installation
→ Graph Review installs
→ exact dependency appears in configuration/lock

Graph Review enabled
→ remove/disable PI
→ rejected while dependency remains

Graph Review removed/disabled
→ PI may then be removed normally
```

Also prove:

- an incompatible environment or pack missing `graph-review` fails before canonical mutation;
- failure preserves the previous valid configuration, package state, lock and generated environment without silently replacing the selected pack;
- Operations and Assets / Publication are not Graph Review dependencies;
- dependency install/removal uses the same compatibility, locking and synchronisation machinery as explicit Extension operations.

### Step 2 — Add `graph-review` to `@pactwright/standard`

**References:** Spec 02 Agent Pack/capability model; Spec 04 one-capability and Production Skills rules.

**Run**

```text
Extend `@pactwright/standard` to provide exactly one new Pactwright capability: `graph-review`.

Implement a generic Graph Review agent that consumes:
- the review request;
- runtime-resolved Graph Review context/scope;
- accepted relevant Project Intelligence context;
- one or more relevant skills already resolved from the selected Agent Pack.

Do not create architecture-review, ux-review, product-review, cost-review or other Pactwright capabilities.
Do not introduce reviewer identities as canonical configuration.
Do not assume one Graph Review capability maps to one production domain or one skill.
Resolve and lock the built standard pack through normal Agent Pack mechanisms before exercising real Extension activation; untracked workspace bytes are not a locked environment.
```

**Expected result**

The standard pack satisfies Graph Review through one semantic responsibility while allowing multiple already resolved specialist skills to participate.

**Verify before continuing**

Repeat Step 1's successful dependency lifecycle with the built/packed standard Agent Pack explicitly selected and locked, then require:

- standard supplies the complete capability set;
- a pack lacking `graph-review` fails activation without mutating the valid environment;
- a fixture resolved environment exposes multiple relevant direct skills to one Graph Review without additional Pactwright capabilities;
- Production Skill technique quality remains outside Pactwright evaluation ownership.

## Stage 2 — Implement request, scope and immutable execution provenance

### Step 3 — Implement Graph Review request input

**References:** Spec 04 review request and no-Review-Definition rule.

**Run**

```text
Implement Graph Review request parsing for the canonical execution inputs supported by Spec 04, including:
- perspective/question;
- objective;
- requested scope;
- relevant domains/records where supplied;
- constraints;
- required output expectations.

The request is execution input, not Project Graph truth.

Provide thin initial CLI input ergonomics for `pactwright graph-review run`; the exact flags/file encoding are implementation interface and must not introduce a persistent Review Definition model.
```

**Expected result**

A user can request specialist Graph Review without creating a durable reviewer/configuration abstraction.

**Verify before continuing**

Test valid, incomplete and malformed requests. Confirm requests create no Project Graph nodes and no persistent reviewer identity.

### Step 4 — Implement registered-graph scope resolution

**References:** Spec 04 review scope.

**Run**

```text
Resolve Graph Review scope from the registered Project Graph schema plus the review request.

Support whole-project and bounded review over applicable:
- subgraphs;
- domains;
- record types;
- relationships;
- active lineages;
- explicit records;
- relevant derived views;
- explicitly requested execution provenance.

Do not hard-code the current Extension list.
Reading sibling Extension state never transfers ownership.
```

**Expected result**

Graph Review automatically understands compatible future registered canonical record types.

**Verify before continuing**

Add a fixture Extension with a registered canonical record/edge type and prove project-wide scope can include it without Graph Review engine changes. Invalid requested scope must fail before specialist analysis begins.

### Step 5 — Implement immutable Review Execution records

**References:** Spec 04 Review Execution/replay base; Implementation Guide replay provenance.

**Run**

```text
Implement one immutable Review Execution for every attempted Graph Review.

Every execution records at least:
- id;
- repository_revision;
- project_graph_revision;
- environment_lock_hash;
- review request;
- resolved scope;
- resolved Agent Pack / agent / skill identities as useful explicit provenance;
- status: succeeded | failed;
- Finding identities when successful;
- creation time.

Store execution provenance in an implementation-owned repository location outside normal Project Graph traversal. A repository-local `.pactwright/executions/graph-reviews/` layout is acceptable as an implementation choice, but is not new canonical semantics.

Failed attempts still create Review Execution provenance.
Partial/failed model output remains execution evidence only and never becomes a successful Finding.
```

**Expected result**

Every attempted review is explainable against an exact replay base without making Review Execution Project Graph truth.

**Verify before continuing**

Run deterministic request/config failure, agent failure and successful execution fixtures. All attempts record immutable provenance; failed executions have no Findings; later attempts/reruns create new executions rather than mutate the original.

## Stage 3 — Implement Findings and PI governance

### Step 6 — Implement Finding output and severity neutrality

**References:** Spec 04 Finding/severity semantics; Spec 03 triage boundary.

**Run**

```text
Implement immutable Finding output for successful Review Executions.

A Finding records:
- identity;
- supported claim;
- supporting Project Graph records/evidence;
- why the finding matters;
- useful suggested improvement where applicable;
- advisory severity: advisory | material | critical;
- originating Review Execution.

Findings remain Review Execution outputs, not normal Project Graph nodes and not accepted project truth.

Do not suppress duplicate-looking Findings in Graph Review; PI triage owns duplicate/corroboration consequence.

Severity is advisory only and must not directly determine:
- Project Intelligence trust;
- triage class;
- Knowledge status;
- roadmap priority;
- automatic Delivery creation.
```

**Expected result**

Successful Graph Review produces supported immutable Findings without mutating canonical meaning or bypassing PI consequence analysis.

**Verify before continuing**

Test advisory/material/critical Findings, invalid supporting references and attempted direct Project Graph mutation. Explicitly prove:

```text
critical Finding
≠ automatically class 3

advisory Finding
≠ automatically low consequence
```

PI triage must determine consequence from current project state rather than Finding severity.

### Step 7 — Implement Finding → Project Intelligence Source hand-off

**References:** Specs 03 and 04 internal Source boundary.

**Run**

```text
For every Finding from a successful Review Execution, invoke the Project Intelligence internal Source ingestion boundary.

Preserve execution-output provenance:
- originating Graph Review process/Extension;
- Finding identity/hash;
- Review Execution identity;
- reviewed repository_revision;
- reviewed project_graph_revision;
- supporting records/evidence;
- relevant origin metadata.

Do not describe the Finding as a canonical originating record; it is immutable Graph Review execution output.

Print the created PI Source id for later triage.
```

**Expected result**

Every successful Finding enters the same governed PI Source path and no Finding directly changes Knowledge, Delivery or roadmap priority.

**Verify before continuing**

Run a successful review with multiple Findings and confirm one internal Source hand-off per Finding with the non-canonical execution-output provenance shape established by Checkpoint 3.

### Step 8 — Implement retryable hand-off failure

**References:** Specs 03, 04 and 07 failure/idempotency.

**Run**

```text
If PI hand-off fails after a successful review:
- preserve the successful Review Execution;
- preserve the Finding;
- record retryable hand-off failure;
- retry hand-off from the existing Finding without rerunning Graph Review.

A hand-off retry must not create duplicate PI Sources when the original hand-off actually succeeded but acknowledgement was uncertain.
```

**Expected result**

PI availability failure does not invalidate or repeat successful specialist analysis.

**Verify before continuing**

Simulate failed acknowledgement/retry and prove the review is not rerun and the Source path converges without duplicate canonical Sources. The retry must use the existing immutable Finding identity/hash.

## Stage 4 — Implement replay, validation and external-evidence boundaries

### Step 9 — Implement new run and pinned/current rerun

**References:** Specs 01, 02 and 04 replay/rerun semantics.

**Run**

```text
Implement:

pactwright graph-review run
pactwright graph-review rerun <execution-id>
pactwright graph-review rerun <execution-id> --current

New run records the current replay base plus current request/scope.

Pinned rerun reconstructs and verifies the original:
- repository_revision;
- project_graph_revision;
- environment_lock_hash;
- request;
- resolved scope/configuration.

Before execution, verify that reconstructed repository state derives the recorded Project Graph revision and that the exact recorded environment resolves.

If any required pinned input cannot be reconstructed exactly, fail explicitly.

`--current` reuses the original request but deliberately resolves current repository, Project Graph and compatible execution environment, creating a new Review Execution marked as current-state rerun.

Never fall back from pinned to current state.
```

**Expected result**

Historical replay identity is exact even though model output itself need not be byte-identical.

**Verify before continuing**

Exercise:

- successful pinned rerun;
- repository revision that does not derive the recorded Project Graph revision => explicit failure;
- unavailable historical environment => explicit failure;
- explicit current-state rerun with a new replay base;
- every rerun creates a new immutable Review Execution;
- no failed pinned replay silently substitutes current repository/environment state.

### Step 10 — Implement the complete validator and derived-report failure guards

**References:** Spec 04 sections 18–20, derived reports, failure and validation.

**Run**

Implement `pactwright graph-review validate` to enforce all canonical minimum rules:

```text
1. every Review Execution is immutable once recorded;
2. every attempted review records a valid execution status;
3. every Review Execution records repository_revision, project_graph_revision and environment_lock_hash;
4. when replay is requested, the recorded repository revision verifies to the recorded Project Graph revision;
5. review scope references valid registered graph state for the recorded revision;
6. the resolved Agent Pack supplied graph-review;
7. referenced Production Skills belong to the recorded resolved environment;
8. Findings exist only for successful Review Executions;
9. every Finding references its Review Execution;
10. supporting Project Graph records are valid against the reviewed revision;
11. every Finding from a successful review has a PI Source hand-off or recorded retryable hand-off failure;
12. Graph Review does not directly mutate sibling-owned canonical records;
13. pinned reruns identify and resolve the original complete replay base;
14. current-state reruns are explicitly marked and record their new replay base;
15. generated reports identify their source Project Graph revision and relevant Review Execution provenance.
```

Core `pactwright validate` invokes Graph Review validation when enabled and does not reinterpret Graph Review semantics itself. Validation is read-only. Test skill-environment membership with representative resolved-environment fixtures here and repeat with actual external imports in Checkpoint 5.

For every Graph Review report implemented in this checkpoint, use deterministic derived generation. A report records the runtime-supplied graph revision from which it was derived and the Review Execution identities it summarises. Ordinary regeneration uses current graph state; an explicitly pinned historical report uses its requested historical input. Never replace an execution's original reviewed revision with a report's current source revision.

A report-generation failure must leave canonical Project Graph state, Review Execution/Finding provenance and Project Intelligence state unchanged. It must not turn a successful review into a failed review, create or suppress Findings, or pretend a Source hand-off succeeded. Do not introduce a new report command or canonical report node merely for testing.

**Expected result**

The full Graph Review contract is validated, and derived reporting cannot corrupt canonical or immutable execution state.

**Verify before continuing**

Maintain positive fixtures and a failing fixture mapped to every numbered rule or tightly coupled group. Run both Extension and core validation; deliberate invalidity must fail without mutating canonical or execution state.

For each implemented report path, compare repeated generation from identical inputs; verify current versus explicitly pinned source-revision stamps. Inject render/write failures and compare before/after hashes for Project Graph records, Review Executions, Findings and PI Sources/Knowledge. All must remain unchanged, and retrying only report generation must not rerun specialist analysis or duplicate hand-offs.

### Step 11 — Keep external research provenance bounded

**References:** Specs 03 and 04 research/external-evidence boundaries.

**Run**

```text
Support recording immutable provenance for external evidence used materially by a Graph Review when supplied by the selected Agent Pack/skills.

Distinguish:
- claims supported by the pinned Project Graph;
- claims suggested by newly gathered external evidence.

Do not build a provider/search subsystem in Graph Review.
Do not claim a mutable external source is historically replayable unless the relevant evidence/provenance can actually be reconstructed.

If external evidence itself should become durable project knowledge, hand it to Project Intelligence through the normal Source path; a Finding is not a substitute for accepted Knowledge or traceable research Sources.
```

**Expected result**

External research can support a Finding without becoming hidden accepted project truth or forcing a Pactwright provider layer.

**Verify before continuing**

Use fixture external-evidence input and verify provenance is recorded. If evidence required by the original review cannot be reconstructed, pinned replay must **fail explicitly** rather than merely warn or substitute a current external source. An explicit `--current` rerun may gather current evidence under a new Review Execution.

## Stage 5 — Evaluation and GitHub integration

### Step 12 — Add Graph Review evaluation cases

**References:** Specs 02 and 04 evaluation.

**Run**

```text
Contribute Graph Review cases to `pactwright eval` covering:
- supported issue detection;
- unsupported-claim avoidance;
- cross-record inconsistency detection;
- relevant PI context use;
- distinction between local Delivery Review defects and project-wide concerns;
- useful supporting evidence/provenance;
- Finding severity not bypassing PI governance;
- forbidden direct canonical mutation;
- correct use of available specialist skills for the request;
- report-failure isolation from canonical truth and immutable execution provenance.

Keep Production Skill technique quality in the owning Production Skills benchmarks.
Do not compute one aggregate quality score.
```

**Expected result**

The Pactwright Graph Review responsibility is measurable independently of specialist-domain benchmark ownership.

**Verify before continuing**

Run `pnpm pactwright eval` and inspect Graph Review cases individually, including the resolved multi-direct-skill fixture and deterministic report-failure cases. External Production Skills integration remains a Checkpoint 5 conformance extension, not a prerequisite hidden here.

### Step 13 — Implement and prove the Graph Review GitHub profile/workflow

**References:** Spec 07 Graph Review integration; Checkpoint 2 profile composition; Implementation Guide GitHub Actions baseline.

**Run**

```text
Contribute Graph Review to the existing generic GitHub profile-composition/reconciliation engine and generate:

.github/workflows/pactwright-graph-review.yml

The Graph Review GitHub surface must support the configured Spec 07 responsibilities:
- Graph Review validation;
- manual execution;
- scheduled execution where configured;
- configured repository-event execution;
- Review Execution provenance validation;
- Finding → PI hand-off;
- review projection updates;
- pinned rerun through Pactwright runtime without workflow-current fallback.

Relevant managed/validated state includes:
- .pactwright/executions/graph-reviews/**
- docs/graph-review/reports/**
- affected registered relationships where applicable.

The existing shared Project may gain configured:
- Reviews view;
- Findings view.

Review summaries may project:
- perspective;
- graph revision;
- status;
- critical/material/advisory counts;
- Source hand-off count.

The workflow invokes Pactwright runtime commands and preserves runtime-provided replay provenance.
Do not recreate scope, Finding, replay or PI hand-off semantics inside YAML.
Do not invent a new required check name not defined by Spec 07.
Apply the shared workflow-availability preflight to any already specified/configured required-check contribution.
GitHub never promotes a Finding or treats workflow metadata as canonical Graph Review truth.
Report/projection failure retains the same state-isolation guarantees as local report generation.
```

**Expected result**

Core + PI + Graph Review compose into the same integration and shared Project while Graph Review executes/projects remotely through thin runtime automation.

**Verify before continuing**

In a configured fixture with workflow prerequisites satisfied, run:

```bash
pnpm pactwright sync
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
pnpm pactwright github sync --dry-run
```

Require:

- one shared Project remains in use;
- Graph Review contributes only its workflow/views/projections;
- PI/Core contributions remain unchanged;
- second dry-run converges;
- least privilege, SHA pinning, frozen install and bounded timeout/concurrency are preserved;
- manual, scheduled/configured-event routes invoke the same runtime semantics;
- remote hand-off failure retries the existing Finding without rerunning Graph Review;
- remote pinned replay with unreconstructible inputs fails instead of using workflow-current checkout/environment;
- remote report/projection failure leaves canonical state, Review Executions, Findings and PI state unchanged.

Disable/remove Graph Review in a fixture and prove only its owned generated/remote contributions are removed; PI/Core integration and historical Review Execution/Finding provenance remain unless separately deleted through an explicit supported operation.

## Stage 6 — Adopt Graph Review in Pactwright

### Step 14 — Enable Graph Review from the workspace

**References:** Specs 02, 03, 04 and 07.

**Run**

Verify that the built standard pack from Step 2 has been explicitly resolved/locked in the selected environment before Extension activation.

```bash
pnpm build
pnpm pactwright extension add graph-review
pnpm pactwright sync
pnpm pactwright graph-review validate
```

Land the generated Graph Review workflow through normal repository authority. Preserve the existing required Core/PI checks and satisfy the shared availability preflight for any configured contribution before applying remote state.

```bash
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
pnpm pactwright github sync --dry-run
pnpm pactwright validate
```

`extension add` resolves the workspace package, its PI dependency and the explicitly selected standard pack's `graph-review` capability through the existing generic mechanisms.

**Expected result**

Pactwright uses Graph Review before public release without silently changing its selected AI environment.

**Verify before continuing**

All validation passes, PI remains the recorded dependency, the shared Project remains singular, no implicit pack substitution occurred and a second local/remote sync converges.

### Step 15 — Run real Pactwright Graph Reviews

**References:** Spec 04 review requests/scope; current canonical Pactwright Specs 01–08.

**Run**

Run at least three bounded real reviews using review requests rather than reviewer ids:

```text
1. Architecture/coherence question
   Scope: canonical Specs 01–08 + registered relationships
   Objective: identify contradictions or ownership violations.

2. Product/public-system question
   Scope: current Project Intelligence + public-product Delivery lineages + current canonical specs
   Objective: identify unsupported or incoherent product claims/progression.

3. Project progression question
   Scope: PI coverage/roadmap + open Delivery + previous Findings
   Objective: identify material blockers or misplaced work without creating a second roadmap.
```

Invoke each through `pnpm pactwright graph-review run` using the implemented request-input interface.

**Expected result**

Real Review Executions and supported Findings are created; every Finding from a successful review is handed to PI. Do not manufacture Findings to satisfy a count.

**Verify before continuing**

For every Source id printed:

```bash
pnpm pactwright intelligence triage <source-id>
```

Promote only where normal PI rules require and human approval accepts the proposal.

Confirm:

- no review command directly changed canonical Knowledge or Delivery;
- severity did not determine PI triage class;
- duplicate/corroborating Findings were handled by PI rather than suppressed by Graph Review.

### Step 16 — Deliver one Pactwright correction motivated by Graph Review

**References:** Specs 01, 03 and 04.

**Run**

From an accepted PI consequence/candidate traceable to a Graph Review Finding:

```text
explicitly capture Intent
→ propose Contract alternatives
→ authorised Decision
→ Contract
→ Brief
→ Delivery
→ Review
→ Evidence
```

Do not describe the Finding itself as accepted truth. The accepted authority is governed PI meaning and/or the normal Delivery authority that follows it.

**Expected result**

Graph Review affects Pactwright only through Finding → PI governance → explicit normal Delivery.

**Verify before continuing**

Trace:

```text
Review Execution
→ Finding
→ PI Source
→ accepted Knowledge/candidate where justified
→ Intent
→ Evidence
```

## Stage 7 — Publish the Graph Review learning path

### Step 17 — Deliver current Graph Review documentation/example/Academy material

**References:** Specs 03 and 08 Graph Review milestone/public-content readiness.

**Run**

Before approving public work, reuse the Checkpoint 3 public-content readiness gate:

```text
identify applicable domains for the Graph Review public work
→ require each applicable Spec 08 domain to be Covered
→ require relied-on claims/constraints to be accepted, in-horizon PI Knowledge with traceable Sources
→ block approval while applicable coverage/grounding is missing
```

Do not require unrelated domains to become Covered.

Then, through normal Pactwright Delivery, publish/update the smallest useful set:

```text
Graph Review concept/guide
one executable Graph Review example
Academy Graph Review lesson
public capability summary linking to the deeper material
review of the existing public Pactwright corpus
```

Ground public claims in accepted current PI Knowledge and actual Checkpoint 4 behaviour.
Retain the applicable Knowledge used to ground the public Delivery.

Do not document Review Definitions, reviewer rosters or provider infrastructure.

**Expected result**

Users can distinguish Delivery Review from Graph Review and execute a review from shipped, governed material.

**Verify before continuing**

Run the executable example in CI where practical, then a fresh Graph Review against public Pactwright material and triage every resulting Finding through PI. Missing applicable readiness blocks approval; challenged/superseded/retracted relied-on Knowledge before approval requires re-grounding.

## Stage 8 — Release `0.0.4`

### Step 18 — Publish the `0.0.4` family

**References:** Implementation Guide npm release model; Checkpoint 2 exact-version upgrade acceptance.

**Run**

Prepare the release from accepted Checkpoint 4 Evidence. First fixture-prove Step 19's exact `0.0.3 → 0.0.4` runtime, standard pack, PI and new Graph Review transition, including compatibility after each operation. Verify desired constraints prevent accidentally resolving newer compatible component versions and the pack supplies `graph-review` before new Extension activation.

The new package is:

```text
@pactwright/graph-review@0.0.4
```

Existing family members also release as compatible `0.0.4`, including `@pactwright/standard` with the new capability.

Use the Implementation Guide release PR/tag flow. Bootstrap only the new Graph Review package's first npm publication/trusted publisher; do not interactively republish existing packages.

**Expected result**

The compatible family is published under `next` with provenance and a fixture-proven exact consumer transition.

**Verify before continuing**

```bash
pnpm view pactwright@0.0.4 version
pnpm view @pactwright/standard@0.0.4 version
pnpm view @pactwright/project-intelligence@0.0.4 version
pnpm view @pactwright/graph-review@0.0.4 version
```

Every command returns `0.0.4`; the complete transition fixtures pass before real consumer upgrade.

## Stage 9 — Prove Graph Review on Kakeido

### Step 19 — Upgrade Kakeido from accepted `0.0.3` through exact ownership-specific targets

**References:** Spec 02 upgrades/Extension dependencies; current Kakeido canonical specs; Checkpoint 2 exact-version upgrade acceptance.

**Run**

Record the accepted Checkpoint 3 Kakeido `0.0.3` installed/configuration/lock state and use the fixture-proven compatible sequence. Do not preinstall `0.0.4` packages or edit either lock manually.

```bash
pnpm pactwright upgrade --to 0.0.4
pnpm pactwright validate
```

Verify runtime `0.0.4`, new-runtime migration provenance and compatibility with the existing selected pack/PI. Set only the selected `@pactwright/standard` desired version to exact `0.0.4` through existing configuration, preserving its identity:

```bash
pnpm pactwright agent-pack upgrade
pnpm pactwright validate
```

Verify exact pack/lock identity and the `graph-review` capability. Then set only the existing PI Extension's desired version constraint to exact `0.0.4` through its supported configuration:

```bash
pnpm pactwright extension upgrade project-intelligence
pnpm pactwright intelligence validate
pnpm pactwright validate
```

Verify exact PI package/version/hash and compatible dependency state before installing Graph Review:

```bash
pnpm pactwright extension add @pactwright/graph-review@0.0.4
pnpm pactwright graph-review validate
pnpm pactwright sync
```

Verify the complete exact family and land the generated workflow through the normal repository process. Then:

```bash
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
pnpm pactwright github sync --dry-run
pnpm pactwright doctor
pnpm pactwright validate
```

Each owning command must finish in a valid environment before the next begins. Recover failures rather than bypassing validation. Runtime upgrade is not shorthand for pack/Extension upgrades, and a floating later compatible version does not satisfy this checkpoint.

**Expected result**

Kakeido moves from the real published `0.0.3` environment to the exact compatible `0.0.4` family through the respective component owners.

**Verify before continuing**

Verify package-manager state and `.pactwright/lock.yml` identify:

```text
pactwright@0.0.4
@pactwright/standard@0.0.4
@pactwright/project-intelligence@0.0.4
@pactwright/graph-review@0.0.4
```

Also require compatibility/lock agreement after every operation, preserved identities and historical provenance, new-runtime migration/validation, PI as the recorded Graph Review dependency, the existing shared Project, a converged final dry-run and unchanged user-owned workflows/remote state.

### Step 20 — Run cross-spec Kakeido Graph Reviews

**References:** current canonical Kakeido specification corpus.

**Run**

Resolve the current Kakeido canonical specification set and run bounded review requests covering at least:

```text
financial/domain semantics ↔ product/review UX
product/review UX ↔ mobile interaction design
assistant authority/uncertainty ↔ deterministic financial rules
technical architecture ↔ product/security/privacy requirements
```

Use request perspectives/objectives, not persistent reviewer ids.

**Expected result**

Graph Review identifies supported cross-domain issues without flattening Kakeido into generic Pactwright semantics.

**Verify before continuing**

Triage every resulting PI Source; no Finding itself becomes canonical Kakeido truth and severity does not determine triage consequence.

### Step 21 — Deliver one Kakeido correction motivated by a governed Finding consequence

**References:** Specs 01, 03, 04; current Kakeido owner specs.

**Run**

Select one supported Finding whose governed PI consequence justifies Delivery, then execute a normal explicit Intent → Evidence lineage.

**Expected result**

One real Kakeido cross-spec correction proves the complete Graph Review governance path.

**Verify before continuing**

Trace:

```text
Review Execution
→ Finding
→ PI Source
→ accepted PI consequence/candidate
→ Intent
→ Evidence
```

Run the Kakeido repository-defined tests required by the owning specifications.

## Stage 10 — Capture Checkpoint 4 feedback

### Step 22 — Route material checkpoint findings through PI and resolve blockers

**References:** Implementation Principles feedback/evaluation rules; Implementation Guide transition rule.

**Run**

Capture defects, friction, replay problems, bad scope selection, unsupported Finding patterns, report failures, installation problems and public-documentation gaps observed while implementing and using Graph Review.

Ingest each material Pactwright finding through PI, distinguishing Kakeido-specific choices from repeatable Pactwright responsibility failures. Convert repeatable failures into evaluation/product candidates where justified; do not automatically create Intents.

A blocking failure must be corrected and its acceptance rerun inside this checkpoint. Merely recording a blocker as a governed future candidate does not resolve it. Only non-blocking findings/design gaps may cross the checkpoint under the Implementation Guide conditions.

**Expected result**

Learning remains governed evidence and no blocker is deferred into Checkpoint 5 under another label.

**Verify before continuing**

Trace each blocker to its correction and passing re-verification. Require no unresolved blocking failure before closing; retained future candidates must be explicitly non-blocking and must not undermine the current canonical contract.

## Exit gate

Checkpoint 4 closes only when:

- `@pactwright/graph-review` exists as an independent Extension requiring PI;
- its real dependency lifecycle is proven first with an explicitly compatible fixture pack and then with the built standard pack after that capability exists;
- incompatible dependency/capability resolution preserves the previous valid environment without implicit pack substitution;
- `@pactwright/standard` supplies exactly the `graph-review` Pactwright capability for specialist Graph Review;
- one Graph Review may consume multiple already resolved specialist skills without creating extra Pactwright capabilities;
- there is no Review Definition system, reviewer roster, provider registry, Generation Record or Review & Creative package;
- request and scope resolution operate over the registered Project Graph;
- every attempted review creates immutable Review Execution provenance;
- every Review Execution records `repository_revision + project_graph_revision + environment_lock_hash` plus request/scope;
- failed reviews emit no Findings;
- Findings remain immutable non-graph execution outputs and are never accepted project truth;
- Finding severity cannot directly determine PI trust/class/Knowledge/roadmap/Delivery consequences;
- every successful Finding enters PI as an internal Source;
- failed PI hand-off is retryable without rerunning the review and converges idempotently;
- pinned replay fails explicitly when repository, graph, environment or required external-evidence inputs cannot be reconstructed;
- `--current` is the only path to current-state rerun and creates a new replay base;
- all 15 canonical Graph Review validation rules are enforced through Extension and core validation;
- implemented reports are deterministic, correctly revision-stamped, and their render/write failures leave canonical Project Graph, Review Execution/Finding provenance and PI state unchanged;
- report-only retry does not rerun review, alter execution success or duplicate Source hand-offs;
- Graph Review evaluation uses the runtime and leaves Production Skill technique quality with its owner;
- the GitHub profile composes through the existing integration/Project and implements Spec 07 automation/projection without semantic YAML duplication;
- remote hand-off retry, pinned-replay failure and report-failure isolation preserve local semantics;
- disabling/removing Graph Review removes only its managed contribution while preserving PI/Core state and historical execution provenance;
- Pactwright and Kakeido each complete one Finding → PI → explicit Delivery correction path;
- the public learning path satisfies existing PI readiness and matches shipped behaviour;
- the `0.0.4` family including `@pactwright/graph-review` is registry verified;
- Kakeido proves the exact published `0.0.3 → 0.0.4` transition with explicit desired component constraints and compatible verified intermediate environments;
- historical-package/external-evidence retention mechanisms remain explicit open implementation concerns, not invented infrastructure;
- every blocking failure has a correction and passing re-verification; only non-blocking findings may remain future candidates;
- no known blocking failure is carried into Checkpoint 5.

---

**Pactwright — Checkpoint 4 — Graph Review v12**
