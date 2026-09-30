# Pactwright — Checkpoint Step Contract and Delivery Tasks

**Version:** 7

**Date:** 30 September 2026

**Purpose:** Replace checkpoint prompts with requirements and acceptance criteria, then execute them through progressively self-hosted run models.

## 1. Execution model

Canonical specifications own product meaning. Checkpoint files allocate requirements, deliverables and acceptance criteria. A **run model** defines how agents, production skills, verifiers and reviewers cooperate. A **harness** executes the model and controls progression.

```text
Canonical specifications → checkpoint contracts
                                  ↓
                     produce → verify → review
                         ↑                ↓
                         └── correct ─────┤
                                         └── accept → next eligible step
```

Agent prompts are generated invocation context, not requirements or acceptance authority. The harness accepts outputs only against the approved contract and current evidence.

Checkpoint 1 proves a software-development instance using an external bootstrap harness. That experience informs Pactwright-backed run models for software and other production domains. Later models use the existing Pactwright lifecycle and graph, not competing versions of them.

For T5, the bootstrap harness runs on GitHub Actions. A **run** is the full harness execution. Its **controller** is the trusted process that schedules work, invokes agents, evaluates evidence and records progress. A replacement job restores the same run rather than starting its acceptance history again.

## 2. Checkpoint organisation

Keep `docs/checkpoints/`, the existing numbered files, goals, scope, canonical references, Stage/Step headings and checkpoint exit obligations. Replace each step's prompt and duplicated expected-result/verification prose with one YAML contract in its own file, unless the owner keeps the step unconverted (below). The step section keeps its heading, a link to the contract and a short summary of the contract's `outputs`:

```text
docs/checkpoints/
├── contract.schema.json          minimal format schema
├── 01-self-hosted-delivery.md    goal, scope, Stage/Step headings, deliverable summaries, exit gate
└── 01-self-hosted-delivery/
    ├── checkpoint.yml            common settings, shared requirements and prose-step hashes
    ├── CP01-S01.yml              one contract per step, named by step ID
    ├── …
    └── crosswalk.yml             conversion record: replaced prose → requirement/criterion IDs
```

The deliverable summary restates the contract's outputs and adds no obligation. If the two disagree, the contract governs.

The owner may keep a step in its prose form instead. Such an **unconverted step** keeps its full section in the checkpoint file, and that prose is its definition. The shared requirements in `checkpoint.yml` and the owning specifications apply to it as to a contract. It is listed in `checkpoint.yml` under `prose_steps` with the SHA-256 of its reviewed text. That text is the step's `### Step N — ` heading (an em dash between single spaces) and its lines up to the next step or `##` heading. For the first step after a `##` heading, such as a stage heading, it begins with the last `##` heading before the step and the lines between them, the stage introduction. A `##` heading is any line starting with `## `. The hash is taken over UTF-8 text split into lines at LF, each line without the trailing whitespace ECMAScript `trimEnd` removes, trailing blank lines removed, lines joined by LF with no final newline. A change to that text is an amendment: it needs review and records the new hash. Each step is either converted or listed, never both and never neither, and has one heading. An unconverted step has no crosswalk source or entries until it is converted. Its conversion moves the recorded hash to its crosswalk source as `reviewed`, so the replaced prose is the prose that was reviewed, and quotes all of that text: the stage introduction, if any, as the step's `intro` units, and any prose before the step's first Run, Expected result or Verify label as its `body` units.

Declare common settings once at checkpoint level, in `checkpoint.yml`:

```yaml
format: 2
checkpoint: CP01
run_model: software-bootstrap
sources:
  CORE: ../../specs/01-pactwright-core-system-and-lifecycle.md
  DISTRIBUTION: ../../specs/02-distribution-agent-packs-extensions-and-evaluation.md
prose_steps:                     # only when a step stays unconverted
  CP01-S22: sha256:<64 hex digits>
```

`software-bootstrap` identifies the bootstrap software run model. Source paths are relative to `checkpoint.yml`. `CORE#15` identifies numbered section 15; a heading without a section number, in any source, is cited by its GitHub heading anchor, such as `GUIDE#replay-provenance`. The harness resolves and pins the actual source revisions for each run.

Shared requirements, mandatory review policy and checkpoint exit criteria are declared once and inherited. Shared requirements live in `checkpoint.yml`; their IDs take the checkpoint prefix, such as `CP01/R01`. Do not maintain a second hand-written plan or acceptance registry duplicating these contracts; generate indexes and coverage views from the contract files and `prose_steps`.

While a checkpoint is converted, `crosswalk.yml` records where each obligation of the replaced prose went, quoting it verbatim. Its `sources` list names, for each set of converted steps, the checkpoint revision whose prose they replaced, so stages converted at different revisions each quote their own text. It is conversion evidence for T1 and T2 review, not a plan to maintain.

`pnpm contracts:check` validates every checkpoint directory that has a `checkpoint.yml`. It checks the format schema, step identity, key order, requirement coverage, `requires` targets and source citations, that every step heading of the checkpoint file appears once and has a contract or a `prose_steps` entry but not both, and that each unconverted step still has its recorded hash. It also checks the crosswalk's IDs and, reading each step's replaced text from its source revision in Git history, its verbatim quotes and each `reviewed` hash; these source checks are skipped with `--skip-source` and, in a shallow clone, for a revision the clone lacks. `pnpm test` runs the same checks.

## 3. Compact step format

| Field | Meaning |
|---|---|
| `id` | Stable step identity, retained when a heading moves. |
| `requires` | Step IDs whose accepted results are prerequisites. |
| `outputs` | Map of deliverable IDs to their required meaning. |
| `requirements` | Map of requirement IDs to source clauses and obligations. |
| `acceptance` | Map of criterion IDs to observable scenarios and verification bindings. |
| `inputs`, `uses` | Optional named input references and required previously accepted Pactwright capabilities. Omit when unnecessary. |

Requirements use `{source, statement}`. Criteria use `covers`, `given`, `when`, `then` and `verify`; `cases` is optional. Every requirement needs acceptance coverage, and every declared case needs its own result.

`verify` maps methods to verifier IDs: `automated`, `review` or `approval`. All listed bindings are required. The run model supplies the common evidence-record format, so every criterion need not repeat an evidence checklist. A binding declares any specialised evidence it needs.

Requirement/criterion IDs are local: `R01` becomes `CP01-S03/R01`. Optional `inputs` maps names to source references or accepted outputs such as `CP01-S02/core-record-model`. `uses` names capabilities that must actually participate in execution, not features merely installed.

### Example — Step 3: shared typed-edge store

This example is adapted from Checkpoint 1's Step 3 contract at `3c053bd622630c2e460d8cec40a633ead884873f`. It illustrates the format, not the complete current Step 3 requirements; the current `01-self-hosted-delivery/CP01-S03.yml` contract governs. Verifier IDs identify bindings to implement, not existing commands.

```yaml
id: CP01-S03
requires: [CP01-S02]
outputs:
  typed-edge-store: Shared persistence, validation and relation registration for typed relationships.
requirements:
  R01:
    source: [CORE#15]
    statement: The runtime shall preserve directed edge tuples when storing and reloading them.
  R02:
    source: [CORE#15, CORE#57]
    statement: The validator shall reject edges with absent endpoints.
  R03:
    source: [CORE#15, CORE#45, CORE#57]
    statement: The validator shall enforce registered endpoint types, including same-type supersession.
  R04:
    source: [CORE#15, CORE#57]
    statement: The validator shall reject duplicate source/relation/target tuples.
  R05:
    source: [CORE#15, CORE#45, CORE#57]
    statement: The validator shall reject supersession cycles, including self-supersession.
  R06:
    source: [CORE#15, CORE#57]
    statement: Additional relations shall not replace or weaken core relationship constraints.
  R07:
    source: [CORE#4, CORE#15, DISTRIBUTION#10]
    statement: The registry shall accept an additional relation with its own endpoint constraints, and the shared store and validator shall apply those constraints to its edges.
acceptance:
  AC01:
    covers: [R01, R03]
    cases: [resolves, selects, decomposes, evidences, supersedes]
    given: Valid core records and a permitted edge of the listed relation.
    when: The edge set is validated, stored and reloaded.
    then: Validation succeeds and repeated loading preserves the exact directed tuples.
    verify: {automated: [edges.valid-roundtrip]}
  AC02:
    covers: [R02]
    cases: [missing-source, missing-target]
    given: An edge whose only defect is the listed absent endpoint.
    when: The edge set is validated.
    then: Validation rejects the edge and identifies the missing endpoint.
    verify: {automated: [edges.missing-endpoint]}
  AC03:
    covers: [R03]
    cases: [wrong-source-type, wrong-target-type, cross-type-supersession]
    given: An edge whose only defect is the listed endpoint-type violation.
    when: The edge set is validated.
    then: Validation rejects the edge for the violated relation constraint.
    verify: {automated: [edges.endpoint-types]}
  AC04:
    covers: [R04]
    given: An otherwise valid edge set with an exact repeated tuple.
    when: The edge set is validated.
    then: Validation rejects the edge set and identifies the duplicate tuple.
    verify: {automated: [edges.duplicate-tuple]}
  AC05:
    covers: [R05]
    cases: [self-loop, two-record-cycle, longer-cycle]
    given: Otherwise valid same-type records with the listed supersession cycle.
    when: The edge set is validated.
    then: Validation rejects the edge set and identifies the illegal supersession cycle.
    verify: {automated: [edges.supersession-cycles]}
  AC06:
    covers: [R01, R07]
    given: A fixture registers an additional relation that permits two-way links.
    when: Two-way links are validated, stored and reloaded.
    then: The links are preserved without imposing supersession-only acyclicity.
    verify: {automated: [edges.additional-relation]}
  AC07:
    covers: [R06]
    given: A fixture attempts to replace a core relation's endpoint constraints.
    when: Registration processes the declaration.
    then: Registration refuses it and the original core constraints remain effective.
    verify: {automated: [edges.core-registration-protection]}
  AC08:
    covers: [R03, R07]
    cases: [wrong-source-type, wrong-target-type]
    given: A fixture-registered additional relation and an edge of it whose only defect is the listed violation of that relation's endpoint types.
    when: The edge set is validated.
    then: Validation rejects the edge for the violated additional-relation constraint.
    verify: {automated: [edges.additional-relation-endpoint-types]}
  AC09:
    covers: [R06]
    cases: [supersession-cycle, cross-type-supersession]
    given: Valid two-way links of a fixture-registered additional relation and core supersession edges whose only defect is the listed violation.
    when: The edge set is validated.
    then: Validation rejects the edge set for the violated core supersession constraint.
    verify: {automated: [edges.core-constraints-kept]}
```

This step proves the registration mechanism. Installed Extension composition must later exercise the real integration; a fixture does not establish that later capability.

### Verification and ownership rules

An **automated** binding defines executable assertions and required observations. A **review** binding defines its independent role, rubric, pass rule and evidence. An **approval** binding identifies the authority and exact output/effect being authorised. Common independent review is required by the run model even when the step lists only automated bindings.

Repository, branch, permitted writes, per-role model and effort, skill versions, credentials and execution budgets belong to validated run configuration. Effective model and effort are recorded in invocation evidence and evaluation identity. They must be resolved before dispatch, not guessed by an agent. Verifier implementations can be delivered alongside a capability, but an unresolved or untested binding cannot satisfy acceptance.

Canonical specifications remain authoritative. A source conflict requires an explicit decision and amendment, not an agent choosing an easier interpretation. Neither the producer nor its generated tests may weaken the approved contract. Review checks semantic coverage and test adequacy, not just ID mapping or a green process exit.

## 4. Harness rules

The harness validates contracts and dependencies, resolves inputs and targets, dispatches production, runs verifiers, obtains independent review and feeds specific failures back into correction automatically.

A step advances only when its required outputs, every criterion/case, inherited constraints and required reviews/approvals have current supporting evidence. Missing cases, skipped checks, stale results and a producer's completion claim cannot pass.

Record definition/source revisions, inputs, candidate identity, verifier/reviewer identity and results separately from checkpoint definitions. Freeze these inputs for an attempt. Scope or acceptance changes require a visible amendment; preserve the earlier instructions and evidence. Re-verify affected accepted obligations after changes, and evaluate the integrated checkpoint at its exit gate.

The harness executes both converted contracts and reviewed operational steps retained in prose. An operational step is eligible once every earlier step of its checkpoint is accepted. The harness runs its prescribed commands and adapter work in the declared repository or fixture, then verifies its outputs and observations against the pinned procedure and shared requirements. Prose is an execution authority, not a completion claim; conversion to YAML is not an execution prerequisite.

Checkpoint-wide targets apply at the point their conditions specify. Later-only obligations remain pending until that point; they do not block an otherwise valid earlier step or disappear from the final exit evaluation.

### GitHub Actions execution

The committed run template holds stable settings. The workflow composes the effective configuration from that template, dispatch inputs and saved run state. For T5, `through` is an optional `workflow_dispatch` input: a new run without it selects `CP01-S01`; a continuation without it retains the saved boundary. An explicit boundary is validated and recorded before work continues. Automatic continuation stays within that boundary.

Run state includes the journal, evidence, candidate Git history, effective configuration, approvals, counters and external receipts. Save a consistent, identifiable artifact after durable phases, before external effects and before a planned yield. Restore and validate the exact saved sequence on a fresh runner; missing, corrupt or stale state cannot reset progress or limits.

One controller writes a run at a time. Takeover uses recorded GitHub run/job/attempt identity and verified job state, not a hostname, process ID or elapsed time. Jobs yield before their time limit. Invocation allowances are saved before dispatch, and unresolved usage remains reserved after runner loss.

Pinned controller code and credentials stay outside candidate workspaces. Privileged effects use only their declared authority. An approval binds an authorised GitHub actor to the exact request and candidate. Persist intent before an effect and read its target back before recording completion or deciding whether to retry.

Repository transitions retain links to earlier evidence and re-evaluate affected obligations on the declared target. Job completion or artifact upload alone does not establish step or checkpoint acceptance.

Missing authority, unavailable resources, contradictory requirements, missing execution support or exhausted execution limits pause the run as **unaccepted and resumable**. They neither grant acceptance nor justify an uncontrolled loop. Publishing and other external effects require their declared authority and receipts; retries must not duplicate them.

## 5. Delivery tasks

These are work definitions, not progress records. Execute them in dependency order. Task 9 is the repeatable process for the remaining checkpoints.

| Task | Work | Completion evidence |
|---|---|---|
| **T1 — Convert Checkpoint 1** | Replace every CP1 prompt with the compact contract, except the steps the owner keeps as unconverted steps (§2). Retain headings, full scope, shell commands that remain valid and every exit obligation. Add the minimal format schema and generate an old-obligation-to-requirement/criterion crosswalk. | Every original obligation is accounted for; IDs, source references and requirement/criterion mappings validate. Every step is converted or listed as unconverted. No second manually maintained plan is introduced. |
| **T2 — Review the converted contract and unconverted steps** | Review each converted contract, and each unconverted step's prose in place. Check canonical fidelity, positive/negative coverage, step dependencies, verification methods and complete product scope. Resolve necessary semantic decisions in the owning specifications. Define checkpoint-wide simplicity, graph-boundary and self-hosting obligations. | Independent review finds no unresolved instruction ambiguity or impossible prerequisite needed to execute CP1. Each criterion, and each obligation of an unconverted step, has a specified verification method, with later integration proofs explicitly allocated. Each unconverted step's reviewed hash is recorded. Verifiers need not all exist yet. |
| **T3 — Build the CP1 harness and software run model** | Implement contract parsing, `prose_steps` reading, dependency selection, producer/reviewer roles, skill selection, verifier bindings, evidence capture, correction loops and resume. Protect accepted definitions from candidate edits. Resolve run targets and authorised effects before dispatch. | A bounded fixture project runs through the complete produce–verify–review–correct loop without hand-written per-step prompts or manual progress edits. |
| **T4 — Prove the harness cannot accept false completion** | Test missing outputs, reviewed operational steps, no-op producers, weak or missing checks, denied operations, stale review, changed inputs, altered acceptance, interruption and repeated external effects. Include fresh-runner restore, invalid saved state, competing controllers and GitHub-bound approvals. Use valid controls and deliberately faulty candidates. | Invalid candidates cannot advance; corrected valid candidates can. Resume preserves the right evidence and does not repeat authorised external effects blindly. Verifier/test adequacy is independently reviewed. |
| **T5 — Implement and accept Checkpoint 1** | Prepare an isolated candidate with an explicit retained/replaced boundary; prevent reference code or stale binaries from satisfying its checks. Run contract-driven implementation and the reviewed operational procedures through the GitHub Actions harness. Use the S01 pilot, then extend through the existing stage boundaries. Build verifiers alongside capabilities and review them independently. Use accepted Pactwright features as soon as the declared self-hosting threshold is met. Retain distribution, upgrades, evaluation, clean consumers, self-hosted work, learning material, authorised release and external acceptance. | Every CP1 criterion and integrated exit obligation has current evidence, including actual published/external proofs. Capture execution friction, code quality, graph behaviour and model/skill effectiveness without attributing improvements to model choice alone. |
| **T6 — Design Pactwright-backed run models** | Use CP1 execution evidence to design the reusable orchestration model and its software instance. Define shared inputs, deliverables, role/skill composition and domain verifiers for research, games, music, video and campaigns, including mixed-skill work. Separate shared mechanics from domain policy. | Reviewed designs explain what reuses CP1, what remains domain-specific and which later capabilities each model needs. No parallel canonical lifecycle or completion graph is proposed. |
| **T7 — Update the owning specifications and remaining checkpoints** | Place run-model semantics with their correct owner. Convert remaining checkpoint prompts to contracts in the existing files. Allocate implementation/adoption of successor models to explicit steps, with complete earlier-feature usage and integration proofs. | The dependency plan is feasible, original checkpoint obligations remain covered, and each checkpoint declares which prior features it must use. Optional Extension and Production Skills integration stays at its owning checkpoint unless explicitly amended. |
| **T8 — Implement and adopt the first Pactwright-backed run model** | Use the accepted CP1 harness/runtime to build the successor software model in its assigned next-checkpoint step. Route governed work through Pactwright's Contract, Brief, lifecycle and Evidence mechanisms; migrate execution links through supported operations. | The successor completes a real step through Pactwright, including correction and resume, without manual graph maintenance or retrospective Evidence. It is accepted before it replaces the bootstrap runner for subsequent work. |
| **T9 — Execute subsequent checkpoints and expand the run models** | Run each checkpoint with the latest accepted model and all applicable previously built features. Implement and prove further domain models and integrations at their assigned steps, then adopt them for later work. Include representative real mixed-skill deliverables as capabilities become available. | Each checkpoint passes its integrated exit gate and provides evidence of prior-feature use. Multi-skill runs verify shared-input consistency and final combined deliverables, not merely individual agent outputs. |

T1–T2 establish the step definitions; T3 builds the bootstrap executor; T4 proves the relevant executor revision; T5 delivers CP1. T6–T9 use that evidence for progressively self-hosted orchestration.

The [T5 harness prerequisites](../research-logs/2026-09-30-cp01-t5-harness-prerequisites.md) define H1 production verification, H2 model/effort control and H3 GitHub Actions operation. Implement these separately from T5 and include their changed behaviour in T4 proof. The [T5 run guide](../research-logs/2026-09-29-cp01-task-5-implementation-and-acceptance.md) owns the operator procedure. The historical T3 plan remains the record of its original implementation.

## 6. Progressive use and production domains

At each checkpoint entry, the harness resolves previously accepted features. Applicable features become required execution dependencies with evidence of actual use; non-applicability needs a stated reason. Installing or enabling a feature is insufficient.

After safe CP1 Delivery exists, work uses it. Once remote collaboration, Project Intelligence, Graph Review, skill integration, Assets/Publication or Operations become available, subsequent applicable work consumes them through their owning interfaces. A new run model is built and reviewed by the previous accepted model; it cannot introduce or approve itself.

Production remains domain-neutral: software uses integration/performance checks, music uses technical audio checks and listening review, video uses cross-artefact and editorial review, research uses reproducibility and methodological review, and campaigns use claim/brand checks and publication authority. Mixed-skill projects also require acceptance of their combined outputs.

Step definitions remain project plans. Pactwright owns authorised graph mutations and completion semantics; run records and views are derived or linked through the runtime, never hand-maintained graph edges. Producing an accepted artefact does not prove publication or real-world impact; those require separate evidence.

## Source basis

Version 2 edited the supplied v1 proposal; version 3 moves each step contract into its own file; version 6 adds unconverted steps (§§2, 4, 5). None re-audits the repository or claims that any task above has run. The original example and capability boundaries were grounded in `sb-dev/pactwright` at `19c66d5f2368932ff05306db1fae8da8ec5810dd`:

- [Checkpoint 1](https://github.com/sb-dev/pactwright/blob/19c66d5f2368932ff05306db1fae8da8ec5810dd/docs/checkpoints/01-self-hosted-delivery.md), particularly Step 3 and the exit gate.
- [Core specification](https://github.com/sb-dev/pactwright/blob/19c66d5f2368932ff05306db1fae8da8ec5810dd/docs/specs/01-pactwright-core-system-and-lifecycle.md), especially §§15, 34–38 and 53–57.
- [Implementation Principles](https://github.com/sb-dev/pactwright/blob/19c66d5f2368932ff05306db1fae8da8ec5810dd/docs/checkpoints/00-implementation-principles.md), §§3–6.

Version 7 defines operational-step execution and GitHub Actions continuation, adds per-role effort, and separates harness prerequisites from T5 execution. It does not claim those changes have been implemented.

**Pactwright — Checkpoint Step Contract and Delivery Tasks v7**
