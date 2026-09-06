# Pactwright — Checkpoint 4 — Graph Review

**Version:** 10  
**Entry condition:** Checkpoint 3 is accepted.  
**Release:** `0.0.4`  
**Exit capability:** Pactwright and Kakeido can run reproducible specialist Graph Reviews over registered Project Graph state, retain immutable Review Execution provenance, route every successful Finding through Project Intelligence, and turn accepted Findings into normal governed Delivery.

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

After Checkpoint 2, coherent changes land through pull requests and required checks.

Dynamic ids consumed by later steps must be printed or resolved by earlier steps.

## 4. Checkpoint scope

Checkpoint 4 implements:

```text
@pactwright/graph-review
Graph Review Extension dependency on Project Intelligence
one graph-review semantic capability
Graph Review request input
extension-aware scope resolution
immutable Review Execution provenance
Finding semantics
Finding → PI Source hand-off
retryable hand-off without rerunning review
pinned replay and explicit --current rerun
Graph Review validation
graph-review Pactwright evaluation cases
pactwright-graph-review.yml
Graph Review GitHub projection defined by Spec 07
real Pactwright Graph Reviews
real Kakeido Graph Reviews
review-driven corrective Delivery
Graph Review public learning path
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

## Stage 1 — Package the Graph Review Extension

### Step 1 — Create `@pactwright/graph-review`

**References:** Specs 02 and 04 Extension/capability boundaries.

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
```

**Expected result**

Distribution can install Graph Review independently, automatically resolve PI, and validate the selected Agent Pack capability set.

**Verify before continuing**

Use fixture Extension add/remove/dependency tests. Confirm Operations and Assets / Publication are not dependencies.

### Step 2 — Add `graph-review` to `@pactwright/standard`

**References:** Spec 02 Agent Pack/capability model; Spec 04 one-capability rule.

**Run**

```text
Extend `@pactwright/standard` to provide exactly one new Pactwright capability: `graph-review`.

Implement a generic Graph Review agent that consumes:
- the review request;
- runtime-resolved Graph Review context/scope;
- accepted relevant Project Intelligence context;
- relevant skills available in the selected Agent Pack.

Do not create architecture-review, ux-review, product-review, cost-review or other Pactwright capabilities.
Do not introduce reviewer identities as canonical configuration.
```

**Expected result**

The standard pack can satisfy Graph Review without a second first-party Agent Pack.

**Verify before continuing**

Run capability-resolution fixtures: standard passes; a pack lacking `graph-review` fails Extension activation without mutating the valid environment.

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

Test valid, incomplete and malformed requests. Confirm requests create no Project Graph nodes.

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

Add a fixture Extension with a registered canonical record/edge type and prove project-wide scope can include it without Graph Review engine changes.

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
- status;
- Finding identities when successful;
- creation time.

Store execution provenance in an implementation-owned repository location outside normal Project Graph traversal. A repository-local `.pactwright/executions/graph-reviews/` layout is acceptable as an implementation choice, but is not new canonical semantics.

Failed attempts still create Review Execution provenance.
```

**Expected result**

Every attempted review is explainable against an exact replay base.

**Verify before continuing**

Run deterministic request/config failure, agent failure and successful execution fixtures. All attempts record immutable provenance; failed executions have no Findings.

## Stage 3 — Implement Findings and PI governance

### Step 6 — Implement Finding output

**References:** Spec 04 Finding semantics.

**Run**

```text
Implement immutable Finding output for successful Review Executions.

A Finding records:
- identity;
- supported claim;
- supporting Project Graph records/evidence;
- why the finding matters;
- useful suggested improvement where applicable;
- advisory severity;
- originating Review Execution.

Findings remain Review Execution outputs, not normal Project Graph nodes and not accepted project truth.

Do not suppress duplicate-looking Findings in Graph Review; PI triage owns duplicate/corroboration consequence.
```

**Expected result**

Successful Graph Review produces supported immutable findings without mutating canonical project meaning.

**Verify before continuing**

Test advisory/material/critical Findings, invalid supporting references and attempted direct Project Graph mutation.

### Step 7 — Implement Finding → Project Intelligence Source hand-off

**References:** Specs 03 and 04 internal Source boundary.

**Run**

```text
For every Finding from a successful Review Execution, invoke the Project Intelligence internal Source ingestion boundary.

Preserve execution-output provenance:
- Finding identity/hash;
- Review Execution identity;
- reviewed repository / Project Graph revision;
- supporting records/evidence;
- relevant origin metadata.

Do not describe the Finding as a canonical originating record; it is immutable Graph Review execution output.

Print the created PI Source id for later triage.
```

**Expected result**

Every successful Finding enters the same governed PI Source path and no Finding directly changes Knowledge or Delivery.

**Verify before continuing**

Run a successful review with multiple Findings and confirm one internal Source hand-off per Finding.

### Step 8 — Implement retryable hand-off failure

**References:** Spec 04 failure/idempotency.

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

Simulate failed acknowledgement/retry and prove the review is not rerun and the Source path converges without duplicate canonical Sources.

## Stage 4 — Implement replay and validation

### Step 9 — Implement new run and pinned/current rerun

**References:** Spec 04 command/rerun semantics; Spec 02 environment lock.

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

If any pinned input cannot be reconstructed exactly, fail explicitly.

`--current` reuses the original request but deliberately resolves current repository, Project Graph and compatible execution environment, creating a new Review Execution.

Never fall back from pinned to current state.
```

**Expected result**

Historical replay identity is exact even though model output itself need not be byte-identical.

**Verify before continuing**

Exercise:
- successful pinned rerun;
- pinned rerun with unavailable historical environment => explicit failure;
- explicit current-state rerun;
- verification that every rerun creates a new immutable Review Execution.

### Step 10 — Implement `graph-review validate`

**References:** Spec 04 validation.

**Run**

```text
Implement `pactwright graph-review validate` covering the canonical validation contract:
- immutable Review Executions;
- valid status on every attempt;
- complete shared replay base;
- valid resolved scope against the recorded graph revision;
- recorded environment supplied `graph-review`;
- valid recorded skill identities;
- Findings only on successful executions;
- every Finding references its execution and valid reviewed support;
- every successful Finding has PI Source hand-off or recorded retryable failure;
- no sibling-owned canonical mutation;
- correct pinned/current rerun identity;
- derived reports identify source graph revision/execution provenance where reports exist.

Core `pactwright validate` invokes this validation when Graph Review is enabled.
```

**Expected result**

Graph Review structural/replay/governance invariants fail closed.

**Verify before continuing**

Create one invalid fixture per major rule and verify no validation failure mutates canonical state.

### Step 11 — Keep external research provenance bounded

**References:** Spec 04 research/external evidence.

**Run**

```text
Support recording immutable provenance for external evidence used materially by a Graph Review when such evidence is supplied by the selected Agent Pack/skills.

Distinguish:
- claims supported by the pinned Project Graph;
- claims suggested by newly gathered external evidence.

Do not build a provider/search subsystem in Graph Review.
Do not claim a mutable external source is historically replayable unless the relevant evidence/provenance can actually be reconstructed.
```

**Expected result**

External research can support a Finding without becoming hidden accepted project truth or forcing a Pactwright provider layer.

**Verify before continuing**

Use a fixture external-evidence input and verify provenance is recorded; simulate unavailable mutable evidence and require pinned replay to report the reconstruction limitation explicitly.

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
- useful supporting provenance;
- forbidden direct canonical mutation;
- correct use of available specialist skills for the request.

Keep Production Skill technique quality in the owning Production Skills benchmarks.
Do not compute one aggregate quality score.
```

**Expected result**

The Pactwright Graph Review responsibility is measurable independently of specialist-domain benchmark ownership.

**Verify before continuing**

Run `pnpm pactwright eval` and inspect Graph Review cases individually.

### Step 13 — Implement Graph Review GitHub profile/workflow

**References:** Spec 07 Graph Review integration; Implementation Guide GitHub Actions baseline.

**Run**

```text
Implement the Graph Review GitHub profile and generated:

.github/workflows/pactwright-graph-review.yml

The workflow invokes Pactwright Graph Review/runtime commands and preserves runtime-provided replay provenance.

Implement only the Graph Review summaries/views/automation owned by Spec 07.
Do not recreate scope, Finding, replay or PI hand-off semantics inside YAML.
Do not invent a new required check name not defined by Spec 07.
GitHub never promotes a Finding or treats workflow metadata as canonical Graph Review truth.
```

**Expected result**

Graph Review can execute/project remotely while repository provenance remains authoritative.

**Verify before continuing**

Run:

```bash
pnpm pactwright sync
pnpm pactwright github sync --dry-run
```

Inspect the generated workflow/profile contribution for least privilege, SHA pinning, frozen install, bounded timeout/concurrency and no semantic duplication.

## Stage 6 — Adopt Graph Review in Pactwright

### Step 14 — Enable Graph Review from the workspace

**References:** Specs 02, 03, 04 and 07.

**Run**

```bash
pnpm build
pnpm pactwright extension add graph-review
pnpm pactwright sync
pnpm pactwright graph-review validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
pnpm pactwright validate
```

`extension add` resolves the workspace Graph Review package, its PI dependency and the standard pack's `graph-review` capability.

**Expected result**

Pactwright uses the new Graph Review Extension before its public release.

**Verify before continuing**

All validation passes and a second local/remote sync converges.

### Step 15 — Run real Pactwright Graph Reviews

**References:** Spec 04 review requests/scope; current canonical Pactwright Specs 01–08.

**Run**

Run at least three bounded real reviews using review requests rather than reviewer ids:

```text
1. Architecture/coherence question
   Scope: canonical Specs 01–08 + registered relationships
   Objective: identify contradictions or ownership violations.

2. Product/public-system question
   Scope: current Product Intelligence + public-product Delivery lineages + current canonical specs
   Objective: identify unsupported or incoherent product claims/progression.

3. Project progression question
   Scope: PI coverage/roadmap + open Delivery + previous Findings
   Objective: identify material blockers or misplaced work without creating a second roadmap.
```

Invoke each through `pnpm pactwright graph-review run` using the implemented request-input interface.

**Expected result**

Real Review Executions and Findings are created; every Finding is handed to PI.

**Verify before continuing**

For every Source id printed:

```bash
pnpm pactwright intelligence triage <source-id>
```

Promote only where the normal PI rules require and human approval accepts the proposal.

Confirm no review command directly changed canonical Knowledge or Delivery.

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

**References:** Spec 08 Graph Review public-product milestone.

**Run**

Through normal Pactwright Delivery, publish/update the smallest useful set:

```text
Graph Review concept/guide
one executable Graph Review example
Academy Graph Review lesson
public capability summary linking to the deeper material
```

Ground public claims in accepted PI Knowledge and actual Checkpoint 4 behaviour.

Do not document Review Definitions, reviewer rosters or provider infrastructure.

**Expected result**

Users can understand the distinction between Delivery Review and Graph Review and can execute a review from shipped material.

**Verify before continuing**

Run a fresh Graph Review against the public material and triage any resulting Findings through PI.

## Stage 8 — Release `0.0.4`

### Step 18 — Publish the `0.0.4` family

**References:** Implementation Guide npm release model.

**Run**

Prepare the release from accepted Checkpoint 4 Evidence.

The new package is:

```text
@pactwright/graph-review@0.0.4
```

Existing family members also release as compatible `0.0.4`, including the updated `@pactwright/standard` with `graph-review` capability.

Use the Implementation Guide release PR/tag flow. Bootstrap only the new Graph Review package's first npm publication/trusted publisher; do not interactively republish existing packages.

**Expected result**

The compatible family is published under `next` with provenance.

**Verify before continuing**

```bash
pnpm view pactwright@0.0.4 version
pnpm view @pactwright/standard@0.0.4 version
pnpm view @pactwright/project-intelligence@0.0.4 version
pnpm view @pactwright/graph-review@0.0.4 version
```

Every command returns `0.0.4`.

## Stage 9 — Prove Graph Review on Kakeido

### Step 19 — Install/upgrade the published family in Kakeido

**References:** Spec 02 upgrades; current Kakeido canonical specs.

**Run**

```bash
pnpm add -D \
  pactwright@0.0.4 \
  @pactwright/standard@0.0.4 \
  @pactwright/project-intelligence@0.0.4 \
  @pactwright/graph-review@0.0.4

pnpm pactwright upgrade --to 0.0.4
pnpm pactwright agent-pack upgrade
pnpm pactwright extension upgrade project-intelligence
pnpm pactwright extension add graph-review
pnpm pactwright sync
pnpm pactwright graph-review validate
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
pnpm pactwright validate
```

Do not use `pactwright upgrade` as shorthand for Agent Pack or Extension upgrade.

**Expected result**

Kakeido runs the exact compatible `0.0.4` family.

**Verify before continuing**

All validation passes and remote desired state converges.

### Step 20 — Run cross-spec Kakeido Graph Reviews

**References:** current canonical Kakeido specification corpus.

**Run**

Resolve the current Kakeido canonical specification set and run bounded Graph Review requests that cover at least:

```text
financial/domain semantics ↔ product/review UX
product/review UX ↔ mobile interaction design
assistant authority/uncertainty ↔ deterministic financial rules
technical architecture ↔ product/security/privacy requirements
```

Use request perspectives/objectives, not persistent reviewer ids.

**Expected result**

Graph Review finds supported cross-domain issues without flattening Kakeido into generic Pactwright semantics.

**Verify before continuing**

Triage every resulting PI Source; no Finding itself becomes canonical Kakeido truth.

### Step 21 — Deliver one accepted Kakeido correction

**References:** Specs 01, 03, 04; current Kakeido owner specs.

**Run**

Select one supported Finding whose PI consequence justifies Delivery, then execute a normal explicit Intent → Evidence lineage.

**Expected result**

One real Kakeido cross-spec correction proves the complete Graph Review governance path.

**Verify before continuing**

Trace Finding provenance end to end and run the Kakeido repository-defined tests required by the owning specifications.

## Stage 10 — Capture Checkpoint 4 feedback

### Step 22 — Route material checkpoint findings through PI

**References:** Implementation Principles feedback/evaluation rules.

**Run**

Capture defects, friction, replay problems, bad scope selection, unsupported Finding patterns, installation problems and public-documentation gaps observed while implementing and using Graph Review.

Ingest each material Pactwright finding through Project Intelligence, distinguishing Kakeido-specific choices from repeatable Pactwright responsibility failures.

Convert repeatable failures into future evaluation/product candidates where justified; do not automatically create Intents.

**Expected result**

Checkpoint learning becomes governed evidence rather than a new reviewer-definition/configuration layer.

**Verify before continuing**

Every blocking finding is resolved or represented by an explicit governed future candidate before Checkpoint 5 begins.

## Exit gate

Checkpoint 4 closes only when:

- `@pactwright/graph-review` exists as an independent Extension requiring PI;
- `@pactwright/standard` supplies exactly the `graph-review` Pactwright capability for specialist Graph Review;
- there is no Review Definition system, reviewer roster, provider registry, Generation Record or Review & Creative package;
- request and scope resolution operate over the registered Project Graph;
- every attempted review creates immutable Review Execution provenance;
- every Review Execution records `repository_revision + project_graph_revision + environment_lock_hash` plus request/scope;
- failed reviews emit no Findings;
- Findings remain immutable non-graph execution outputs;
- every successful Finding enters PI as an internal Source;
- failed PI hand-off is retryable without rerunning the review;
- pinned replay fails explicitly when historical inputs cannot be reconstructed;
- `--current` is the only path to current-state rerun;
- Graph Review evaluation and GitHub automation use the runtime rather than duplicating semantics;
- Pactwright and Kakeido each complete one Finding → PI → explicit Delivery correction path;
- the public Graph Review learning path matches shipped behaviour;
- the `0.0.4` family including `@pactwright/graph-review` is registry verified;
- unresolved historical-package/external-evidence retention mechanisms remain explicit rather than silently invented;
- no known blocking failure is carried into Checkpoint 5.

---

**Pactwright — Checkpoint 4 — Graph Review v10**
