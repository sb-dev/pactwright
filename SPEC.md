# Claude Code Implementation Outline: GitHub-Native AI Software Delivery (v2)

Revision note: this version replaces the original frontmatter-link spec graph with the File-Based Graph Repository model. Relationships now live in a canonical edge table, the schema is explicit, and indexes are generated. Sections 4, 5, 16, 17, 18, 19, and 22 changed substantially; the operating model is unchanged.

## 1. Purpose

Implement an AI-native software delivery workflow using Claude Code, GitHub, repository files, GitHub Actions, pull requests, and GitHub Projects.

The goal is not to build a custom platform first.

The goal is to make a GitHub repository operate as a lightweight AI-native delivery system where human intent can be transformed into verified, traceable, production-aware change.

The implementation must preserve these core concepts:

* Human intent before implementation
* Multiple candidate change contracts before approval
* Human trade-off selection between candidate contracts
* Planner decomposition of approved contracts into implementation briefs
* Competing implementation patches where the brief has meaningful implementation trade-offs
* Review-agent comparison of candidate patches
* Human selection, rejection, or synthesis of the best implementation approach
* Explicit, schema-governed spec graph in the repository
* Automated graph maintenance from the start
* Independent subagent roles
* Contract-based review
* PR evidence
* Drift detection
* Release and post-deploy learning
* GitHub Projects as the view of ongoing work
* GitHub Actions as the lightweight enforcement layer

## 2. Core Principle

The implementation stays lean by limiting infrastructure, not by collapsing the operating model.

Use:

* Claude Code for agent execution
* Repository files for the spec graph: node records, a canonical edge table, and a schema
* Pull requests for change, review, approval, and evidence
* GitHub Actions for tests, validation, drift checks, and release checks
* GitHub Projects for visibility of ongoing work
* CODEOWNERS for human gates
* Small scripts for graph indexing and validation
* Explicit overrides for exceptional cases

Do not remove core agent roles, candidate contracts, drift detection, or graph maintenance just to make the implementation appear smaller.

Lean means avoiding a custom platform.

It does not mean weakening the lifecycle.

## 3. GitHub as the Coordination Layer

The implementation is GitHub-native.

GitHub provides the workflow surface:

* The repository stores code, tests, and the spec graph: intents, contracts, briefs, patches, evidence, releases, findings, and the edges between them.
* Pull requests carry implementation changes, graph updates, review discussion, approvals, and evidence.
* GitHub Actions runs tests, typecheck, linting, graph indexing, graph validation, drift checks, evidence checks, and release checks.
* GitHub Projects gives humans a view of ongoing work across intent, candidate contracts, approved contracts, briefs, PRs, releases, drift findings, and follow-ups.
* CODEOWNERS provides lightweight approval paths over the schema and contract nodes.
* Issues can be used for raw intake, but once an intent node exists, the repo spec graph becomes the source of truth.

Key rule:

GitHub Projects is the view.
The repository spec graph is the truth.

## 4. Repository-Native Spec Graph

The spec graph lives inside the repository beside the code and instantiates the File-Based Graph Repository spec under `/specs`:

* `/specs/schema/`

  * `node-types.yaml` — allowed node types and their required fields
  * `edge-types.yaml` — allowed edge types and allowed source → target combinations
  * `validation-rules.yaml` — additional rules, including sensitive-path declarations
* `/specs/nodes/` — one file per node; flat at first, foldered for navigation only
* `/specs/graph/edges.yaml` — the canonical edge table; the only place relationships live
* `/specs/indexes/` — generated: `incoming.yaml`, `outgoing.yaml`, `by-type.yaml`, `unresolved.yaml`
* `/specs/reports/` — generated validation and drift diagnostics

Canonical graph state is exactly: `nodes/` + `graph/edges.yaml` + `schema/`. Indexes and reports are generated, committed for reviewability, and never hand-edited. If an index is wrong, fix the canonical inputs and regenerate.

### Node types

The delivery objects are node types declared in `node-types.yaml`. Core set, present from the first slice:

* `intent` — status: open | addressed | rejected
* `contract` — status: candidate | approved | rejected | superseded (candidate and approved contracts are one type distinguished by status, not two types)
* `brief` — status: draft | approved | implemented
* `evidence` — status: draft | final
* `decision` — records a human selection, with `decided_by` and rationale

Added by later phases, each via a contract-driven schema migration:

* `capability` — owns repo path globs via `paths[]` metadata
* `override` — reason, approved_by, expiry
* `drift-finding` — status: open | resolved | accepted
* `patch` — status: candidate | selected | superseded; carries branch and strategy
* `comparison` — patch comparison record
* `release`
* `post-deploy-finding`
* `risk` and other types only when a real change needs them

### Edge types

Relationships are first-class, typed, reviewable records in `edges.yaml`, each with a stable branch-safe edge ID. Core set:

* `proposes` — contract → intent
* `selects` — decision → contract | patch
* `decomposes` — brief → contract
* `evidences` — evidence → brief
* `supersedes` — any → same type

Added by later phases:

* `touches` — evidence → capability
* `waives` — override → node or named check
* `flags` — drift-finding → evidence | capability
* `competes-for` — patch → brief
* `compares` — comparison → patch
* `includes` — release → evidence
* `learns-from` — post-deploy-finding → release

The graph starts with the core set and grows from real changes. Do not design the full taxonomy upfront; every type above beyond the core set arrives with the phase that needs it.

The traceability requirement is unchanged: every meaningful change can be traced from intent to post-deploy learning by walking the edge table. Canonical edges point in provenance direction — from the newer record to the thing it is about (contract proposes intent, brief decomposes contract, evidence evidences brief, release includes evidence, finding learns-from release) — so forward, lifecycle-order traversal is done through the generated `incoming.yaml` index, never by authoring forward edges.

The graph is not maintained manually. Claude Code and the Graph Maintainer update nodes and edges as part of the delivery workflow. Humans review and approve the meaning of those changes.

## 5. Graph Rules

* Node files carry identity, type, title, status, and human-readable content. They never carry canonical relationships — no link frontmatter, no inline references treated as edges.
* All relationships live in `graph/edges.yaml` as typed edge records: id, source, type, target, created, optional status and metadata (reason, confidence, evidence, author).
* IDs are stable and branch-safe for both nodes and edges: `<type>-<slug>-<short-hash>`, minted at creation. No fragile counters like `CC-001` — two branches can mint IDs concurrently without collision.
* Edges are authored once, in one direction, in the edge table. Reverse lookups are never authored; they are generated into `indexes/incoming.yaml`.
* Documentation convention: an arrow (→) in any document in the repository means canonical edge direction (source → target), never lifecycle or narrative order. Lifecycle order is written as numbered steps. Mnemonic: edges point backwards in time, from the newer record to what it is about — provenance, like citations.
* The schema governs the graph: allowed node types, required fields, allowed edge types, allowed source → target combinations. A node or edge the schema does not allow is a validation failure, not a convention question.
* Schema changes are contracts. They travel through the same lifecycle as code changes and are gated by CODEOWNERS.
* Do not delete operational memory. Supersede old records via `supersedes` edges and status changes.
* Folder placement under `nodes/` is navigation only. It must never be the source of graph meaning.
* Approval is recorded through Git review of node and edge changes, with human selections captured as `decision` nodes.
* Graph updates are produced by Claude Code and the Graph Maintainer; humans review the resulting diffs, but do not manually maintain graph coherence.

Known trade-off: a single `edges.yaml` is a merge hotspot when parallel branches add edges. Accept this initially. If it becomes painful, shard to `graph/edges/<domain>.yaml` without changing the model — the edge record format and validation are unaffected.

Graph tooling progresses in this order:

1. `spec:index` — generates `incoming.yaml`, `outgoing.yaml`, `by-type.yaml`, `unresolved.yaml`
2. `spec:validate` — deterministic validation per the graph spec
3. `spec:check-diff` — diff-aware checks
4. Drift checks
5. CI enforcement

## 6. Proposal Market: Candidate Contracts and Human Trade-Off Selection

This is a core part of the system.

Claude Code should not turn intent into a single change contract by default.

For meaningful work, the Spec Writer proposes multiple contract nodes (status: candidate) from the same intent, each linked to the intent by a `proposes` edge.

Each candidate represents a different trade-off, for example:

* Fastest delivery
* Safest implementation
* Lowest technical risk
* Best user experience
* Smallest code change
* Best long-term architecture
* Lowest operational cost
* Most complete product solution

Each candidate should explain:

* Problem interpretation
* Proposed scope
* Non-scope
* Trade-offs
* Risks
* Acceptance examples
* Verification needs
* Release implications

Critic agents review the candidates.

The human then decides whether to:

* Approve one candidate
* Merge parts of multiple candidates
* Request another candidate
* Reject all candidates
* Defer the work

The selection is recorded as a `decision` node with a `selects` edge to the chosen contract. The chosen contract's status becomes approved; siblings become rejected. The intent stays open — it becomes addressed only when final evidence covers a brief decomposing the approved contract. Statuses never duplicate what the edge table already encodes: "approved but not yet delivered" is readable from an open intent with a `selects` decision among its `proposes` edges.

This is what makes the human decision gate meaningful.

The proposal market is the first decision market. It should not collapse into a single generated ticket unless the change is genuinely trivial.

## 7. Patch Market: Competing Implementation Patches

After an approved contract has been decomposed into implementation briefs, meaningful briefs may enter a patch market.

The patch market is used when there are multiple valid implementation strategies, meaningful technical trade-offs, architecture risk, operational risk, UX trade-offs, or uncertainty about the safest path.

In the patch market:

* One implementation brief may produce multiple `patch` nodes, each with a `competes-for` edge to the brief, each living on its own branch or draft PR and carrying its strategy and an evidence summary.
* Each candidate patch must stay within the approved contract and implementation brief.
* Review agents compare the patches; the result is a `comparison` node with `compares` edges to each candidate.
* Humans approve the best trade-off, request synthesis, reject all patches, or ask for another candidate. The selection is a `decision` node with a `selects` edge to the winning patch; losers become superseded.

Candidate patches may represent different implementation trade-offs, such as:

* Smallest safe change
* Cleanest architecture
* Lowest operational risk
* Best user experience
* Best testability
* Best migration path
* Best observability
* Lowest long-term maintenance cost
* Instrumentation-first approach

Review agents should compare candidate patches against:

* Contract fit
* Scope control
* Simplicity
* Maintainability
* Test quality
* Evidence quality
* Drift risk
* Release risk
* Rollback safety
* Operational impact

The selected patch, or a human-directed synthesis of multiple patches, becomes the implementation that proceeds toward merge.

Trivial or mechanical changes may use a single patch, but the workflow must support competing patches as a first-class path.

## 8. Core Delivery Flow

The full flow for a meaningful change is:

1. Human describes intent.
2. Intent is captured as an `intent` node (an issue or project item may precede it as intake).
3. Spec Writer proposes multiple candidate contract nodes; Graph Maintainer writes the nodes and `proposes` edges.
4. Spec Critic reviews all candidate contracts.
5. Relevant specialist critics challenge the candidates where needed.
6. Claude produces a trade-off comparison.
7. Human selects, rejects, or merges candidates; the choice is recorded as a `decision` node with a `selects` edge, and statuses are updated.
8. Decomposer creates one or more brief nodes with `decomposes` edges.
9. Code Archaeologist inspects relevant code context.
10. Where implementation trade-offs matter, Implementation Agents produce competing patch nodes with `competes-for` edges; otherwise one patch proceeds directly.
11. Test Writer adds or updates tests independently from the implementation agents.
12. Contract Reviewer checks candidate patches against the approved contract.
13. Drift Reviewer checks candidate patches against specs, code, tests, docs, and evidence.
14. Release Reviewer checks release risk where relevant.
15. Claude produces a `comparison` node.
16. Human selects one patch, requests a synthesis, asks for another candidate, or rejects all; the choice is a `decision` node with a `selects` edge.
17. The selected patch proceeds as the implementation PR.
18. An `evidence` node is prepared with an `evidences` edge to the brief and `touches` edges to affected capabilities.
19. Graph Maintainer updates statuses, regenerates indexes, and verifies validation passes.
20. Human reviews meaningful or risky changes.
21. GitHub Actions runs required checks, including index freshness and graph validation.
22. Release Reviewer checks release readiness.
23. PR is merged.
24. A `release` node is created with `includes` edges to the released evidence.
25. A `post-deploy-finding` node records what actually happened, with a `learns-from` edge.
26. Divergent findings spawn follow-up intent nodes, re-entering the loop at step 1.
27. The GitHub Project reflects the current lifecycle state via one-way sync from the graph.

The loop is complete only when the graph reflects what was intended, proposed, selected, built, released, and learned.

## 9. Core Subagents

Use the full core subagent set.

The implementation stays lean because each subagent is narrow and repo-native, not because responsibilities are collapsed.

### Spec Writer

Produces multiple candidate contract nodes from human intent.

### Spec Critic

Reviews candidate contracts for ambiguity, missing cases, contradictions, weak trade-offs, risk, and scope creep.

### Decomposer

Turns the approved contract into focused implementation briefs.

### Code Archaeologist

Reads the existing codebase before implementation and identifies relevant files, tests, patterns, constraints, and risks.

### Implementation Agent

Produces a candidate patch for one implementation brief without silently expanding scope.

Multiple Implementation Agents may produce competing patches for the same brief when there are meaningful implementation trade-offs.

### Test Writer

Writes or updates tests independently from the implementer.

### Contract Reviewer

Checks whether each candidate patch satisfies the approved contract and avoids excluded scope.

When multiple patches exist, compares their contract fit, scope control, evidence quality, test coverage, simplicity, maintainability, and risk.

### Drift Reviewer

Checks whether specs, code, tests, docs, release records, and evidence still agree.

When multiple patches exist, compares the drift risk of each candidate patch.

### Release Reviewer

Checks release readiness, rollback, monitoring, flags, migrations, release notes, and operational risk.

When multiple patches exist, compares the release risk of each candidate patch where relevant.

### Graph Maintainer

The only role that writes to `/specs`. Applies node, edge, and status changes; never authors relationships outside `edges.yaml`; never deletes — supersedes; regenerates indexes and runs validation after every change; never leaves the graph invalid; reports touched IDs.

Graph Maintainer is responsible for keeping the spec graph usable as working context for Claude Code. Humans review its diffs, but do not manually maintain the graph.

## 10. Claude Code Commands

Use slash commands as thin workflow helpers. Mutating commands end by invoking Graph Maintainer, which regenerates indexes and must pass `spec:validate` before committing.

Initial commands:

* `/capture-intent <text>` — must accept multi-line quoted text; later intents are full specifications
* `/propose-contracts <intent-id>`
* `/review-contracts <intent-id>`
* `/approve-contract <contract-id> [notes]`
* `/write-brief <contract-id>`
* `/implement-brief <brief-id>`
* `/write-tests <brief-id>`
* `/propose-patches <brief-id> <n> <strategy-list>`
* `/compare-patches <brief-id>`
* `/select-patch <patch-id> <rationale>`
* `/review-contract-compliance <brief-id>`
* `/detect-drift <pr-number|branch>`
* `/prepare-evidence <brief-id>`
* `/release-check`
* `/post-deploy-review <release-id>`
* `/update-spec-graph <instruction>`

Commands should move one lifecycle step forward.

They should not become a hidden orchestration platform.

## 11. Claude Code Operating Instructions

`CLAUDE.md` defines how Claude Code operates in the repository.

It should cover:

* The graph structure: where canonical truth lives (`nodes/` + `graph/edges.yaml` + `schema/`) and what is generated
* The rule that relationships exist only in the edge table
* The ID scheme for nodes and edges
* How candidate contracts are proposed and how decisions are recorded
* When human selection is required
* When an approved contract and a brief are required
* When competing implementation patches are required, and how they are created, compared, and selected
* How subagents are used and that only Graph Maintainer writes to `/specs`
* How scope expansion is prevented
* How PR evidence is prepared
* How drift is detected
* When human approval is required
* How overrides are recorded as graph nodes

Key rules:

* No meaningful implementation without an approved contract and an implementation brief.
* When implementation trade-offs are meaningful, a brief produces candidate patches before a final implementation is selected.
* No lifecycle step leaves the graph invalid or the indexes stale.
* Never delete graph records; supersede them.

## 12. Pull Requests as the Execution Unit

A PR should usually represent one candidate patch for one implementation brief.

A meaningful implementation brief may produce multiple candidate branches or draft PRs. The selected patch, or a human-directed synthesis, becomes the implementation PR that proceeds toward merge.

Each meaningful PR carries its graph trace in the same diff: the evidence node, the new edges, status changes, and regenerated indexes. The PR description points at the evidence node path.

The PR is where GitHub brings together:

* Code diff
* Graph diff (nodes, edges, statuses, indexes)
* Agent output
* Human review
* CI evidence
* Approval history

PR review should be evidence-led, not just diff-led.

## 13. PR Evidence

Every meaningful PR includes an `evidence` node with an `evidences` edge to its brief and `touches` edges to affected capabilities.

The evidence body covers:

* Intended change (from the brief)
* Actual code changes
* Tests added or updated
* Commands run and results
* Contract compliance result
* Drift review result
* Patch comparison reference, when competing patches were produced
* Risks
* Rollback notes
* Follow-up work
* Overrides, if any

For competing patches, each patch node carries enough evidence summary to support fair comparison. The selected patch must carry the full evidence node before merge.

## 14. GitHub Projects View

Use GitHub Projects to track ongoing work.

The project does not replace the spec graph. It is treated as one more generated index: a `spec:project-sync` script pushes lifecycle stage, status, risk, and links from the graph to the board via the `gh` CLI, in one direction only. The board is never edited by hand as a source of truth.

Recommended fields:

* Status
* Lifecycle stage
* Risk level
* Capability
* Contract ID
* Brief ID
* PR
* Owner
* Human gate required
* Drift status
* Release status
* Post-deploy status

Recommended lifecycle stages:

* Intent captured
* Candidate contracts proposed
* Contract review
* Human decision
* Approved contract
* Brief ready
* Candidate patches
* Patch comparison
* Human patch decision
* Implementation
* Tests and evidence
* Contract review
* Drift review
* Ready to merge
* Released
* Post-deploy review
* Closed or superseded

## 15. Drift Detection

Drift detection is a core capability, not an optional enhancement.

It checks whether the repository still tells one coherent story.

Two layers:

* Mechanical incoherence — missing endpoints, schema violations, stale indexes, broken references — is caught deterministically by `spec:validate` and surfaces in `indexes/unresolved.yaml`. This exists from the first tooling phase.
* Semantic drift — behaviour changed without graph representation — is Claude-assisted. `capability` nodes declare the repo paths they own; the drift reviewer maps a PR diff to affected capabilities, follows their incoming edges to contracts and briefs, and answers one question: does this diff change observable behaviour not represented in the linked contract or brief? Findings become `drift-finding` nodes with `flags` edges.

Main drift categories remain: spec-code, code-spec, test-spec, doc-code, release-spec, post-deploy.

Start with Claude-assisted drift review, warn-only. Add deterministic checks and blocking behaviour once real drift patterns are visible.

## 16. Approval and Human Gates

Use Git for approval.

Contracts are approved through reviewed changes to contract nodes and their `decision` records.

Use CODEOWNERS for human approval paths: at minimum `/specs/schema/` (schema migrations) and contract node files.

Human approval is required for:

* Selecting the approved contract from candidates
* Selecting the winning patch from candidates
* Scope changes
* Schema migrations
* High-risk changes
* Architecture decisions
* Security, privacy, compliance, payments, or production-sensitive changes
* Release decisions where risk is meaningful
* Overrides for high-risk checks
* Accepted drift that changes product truth

Scripts catch mechanical problems: missing edges, missing evidence, schema violations, stale indexes.

Humans decide trade-offs. Humans review graph diffs as part of PR review, but are never responsible for manually maintaining graph coherence.

## 17. Overrides

Every blocking rule must support an override with a recorded reason.

An override is a graph record: an `override` node (reason, approved_by, expiry) with a `waives` edge naming the node or check it waives. It is findable through `by-type.yaml` like any other node, and expires rather than lingers.

A gate with no escape hatch will eventually be bypassed or removed.

Overrides are allowed, but they live in the delivery record, not in CI logs.

## 18. GitHub Actions

GitHub Actions should enforce the workflow progressively.

Initial workflows:

* `ci.yml` — tests, typecheck, lint.
* `spec-index.yml` — runs `spec:index`, fails if committed indexes differ from regenerated output (`git diff --exit-code specs/indexes/`). This enforces that indexes are generated, committed, and honest.
* `spec-validate.yml` — runs `spec:validate` on every PR touching `/specs`.
* `pr-evidence.yml` — a pure graph query over the edge-table diff: the PR must add at least one `evidences` edge whose target brief `decomposes` an approved contract, or add an `override` node with a `waives` edge naming this check.

Later workflows:

* `drift-review.yml` — runs `spec:check-diff` and the drift reviewer; warn-only first, blocking after proven on real PRs.
* `patch-comparison.yml` — if a brief has more than one `competes-for` edge, merging requires a `comparison` node and a `selects` decision in the graph.
* `release-check.yml` — verifies a release node covers the tagged commit's evidence.
* `post-deploy-review.yml` — scheduled; opens an issue if a release has no `learns-from` finding after a set period.

Every blocking workflow must support override-with-reason via override nodes.

## 19. Tooling

Add tooling progressively.

First:

* `spec:index` — generates `incoming.yaml`, `outgoing.yaml`, `by-type.yaml`, `unresolved.yaml` deterministically (stable ordering, byte-identical on rerun).

Then:

* `spec:validate` — checks unique node and edge IDs, edge endpoint existence, schema-allowed node and edge types, allowed source → target combinations, required fields, index freshness. Deterministic, non-zero exit on failure, suitable for pre-merge. Semantic rules accumulate here as findings prove them out — e.g., intent status coherence (`addressed` iff covered by final evidence through the evidences/decomposes/proposes chain) and a docs lint reserving arrows for edge direction.

Then:

* `spec:check-diff` — reads `sensitive_paths` from `validation-rules.yaml`; a PR touching a sensitive glob requires a linked approved contract or an override node in the same PR. Start with one rule.

Then:

* Drift review support
* Evidence checks
* Release checks
* `spec:project-sync`

Expand only when the need is proven.

## 20. CI Enforcement Strategy

CI should enforce the workflow only after the vertical loop has been proven.

Initial CI checks: tests, typecheck, lint, index freshness, graph validation.

Later CI checks: evidence edge exists, approved contract linked, targeted diff-aware checks, drift review completed or waived, contract compliance review completed, patch comparison recorded, release check completed where relevant.

CI never creates discipline; it verifies the discipline the agents already exercise. Enforce a check only after the corresponding artifact is produced consistently.

CI should support explicit, auditable overrides via override nodes.

## 21. Release and Post-Deploy Learning

Release is part of the AI-native loop.

A `release` node captures:

* What was released, via `includes` edges to evidence nodes
* Which candidate patch was selected, when competing patches existed
* Feature flags involved
* Rollback path
* Monitoring and alerts that matter
* Remaining risks

A `post-deploy-finding` node, linked by `learns-from`, captures:

* Expected outcome
* Actual outcome
* Metrics checked
* Incidents or support feedback
* Unexpected behaviour
* Drift findings, if any

Every divergence spawns a follow-up intent node automatically, re-entering the lifecycle.

The system is incomplete if learning stops at merge.

Learning is also not only post-deploy. Any finding during review or operation — by a human or an agent — is captured as an intent node with its origin recorded in the body, and enters the proposal market like any other intent. Conversations are not delivery records; the graph is.

## 22. Build Order

The build order is bootstrapped: each phase's deliverable enters the system as an intent node and travels through the workflow as it exists at the end of the previous phase. Detailed execution steps and prompts live in the implementation plan; the spec records only the sequence and what each phase delivers.

1. **Graph skeleton + manual slice** — `/specs` structure, core schema, `CLAUDE.md`; one real change traced intent → contracts → decision → brief by raw prompts. The first change is the next phase's tooling.
2. **`spec:index` + `spec:validate`** — generated indexes and deterministic validation, built against the Phase 1 brief.
3. **Subagents + commands** — the lifecycle becomes command-driven; Graph Maintainer's postcondition is passing validation.
4. **Actions enforcement** — index freshness, validation, evidence checks, CODEOWNERS, override nodes.
5. **Drift** — capability nodes, `/detect-drift`, one diff-aware rule, warn-first.
6. **Patch market** — patch and comparison nodes, market commands, comparison enforcement.
7. **Release loop + Projects sync** — release and finding nodes, scheduled review, one-way board sync.

Each schema migration after Phase 1 is itself a contract-driven change.

## 23. Non-Goals

Do not build these first:

* Custom platform
* Web UI
* Graph database — the file-based graph with explicit edges is deliberately not a database; if it ever migrates to one, the node/edge/schema model maps directly
* Agent marketplace
* Broad policy engine
* Complex permission system
* Fully automated merge
* Fully automated release
* Full graph taxonomy upfront

The implementation should remain GitHub-native until the GitHub-native workflow becomes the bottleneck.

## 24. Success Criteria

The implementation works when one real change can be traced, by following edges in `edges.yaml`, through:

* Intent node
* Multiple candidate contract nodes with `proposes` edges
* Trade-off comparison
* Decision node with a `selects` edge
* Approved contract
* Brief with a `decomposes` edge
* Competing patch nodes with `competes-for` edges, where trade-offs mattered
* Comparison node and patch decision
* Code change
* Tests
* Evidence node with `evidences` and `touches` edges
* Contract review
* Drift review
* GitHub Actions checks, including index freshness and validation
* Release node with `includes` edges
* Post-deploy finding with a `learns-from` edge
* GitHub Project status, synced one-way

The system is lean if it feels like a disciplined GitHub and Claude Code workflow.

It is complete if Claude Code can load reliable working context from the generated indexes without humans manually maintaining the graph.

## 25. Final Shape

The final implementation is a GitHub-native AI delivery workflow.

It uses:

* Claude Code
* Repository files
* An explicit, schema-governed spec graph: node records, a canonical edge table, generated indexes
* Pull requests
* GitHub Actions
* GitHub Projects as a generated view
* CODEOWNERS
* Small deterministic scripts
* Core subagents, with Graph Maintainer as the sole graph writer
* Candidate contract proposals and decision records
* Candidate patch proposals, comparison records, and human selection
* Evidence nodes
* Drift findings
* Override nodes
* Release records and post-deploy findings

The repository remains the source of truth: `nodes/` + `graph/edges.yaml` + `schema/`.

GitHub provides the operating surface.

Claude Code performs the structured work.

Humans make the trade-off decisions.

The graph is continuously maintained and validated by the workflow so it remains reliable context for Claude Code.

The system is not a single pipeline: it is a GitHub-native proposal-and-patch market where agents generate options, critics expose trade-offs, reviewers compare implementations, and humans approve the best direction — with every option, decision, and outcome recorded as nodes and edges.
