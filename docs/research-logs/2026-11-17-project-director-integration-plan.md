# Project Director Integration — Research Log and Amendment Plan

**Date:** 17 November 2026

**Purpose:** Describe the full Agent Pack methodology and Project Director integration work, its dependencies and acceptance criteria.

**Historical analysis baseline:** `4e78f174e6c148e7c45ec463d9d9b347bb2ce407`.

## 1. Research question and scope

This log examines a Project Director that maintains project direction across several Deliveries. The role keeps purpose, outcomes and constraints in view; selects methods; delegates bounded work; integrates results; and proposes corrections or changes in direction. It must preserve authority, independent review and acceptance boundaries. Sections 2–4 develop that design. Sections 5–9 describe the foundation, integration amendments, checkpoint allocations and verification work.

The task catalogue describes the complete scope without tracking completion. Canonical specifications own the requirements. Checkpoint contracts own implementation acceptance. This research log defines neither runtime support nor checkpoint acceptance.

Research citations remain pinned to the historical baseline. Task-owner links point to the canonical repository files. Compare those files with the task scope before editing to preserve applicable definitions and reconcile any differences.

The external [Production Skills cross-domain specification][production-skills] is pinned to commit `165f00af9256268f1dfbd3432cf9d0cad2de3639`. Its file blob, `2be3cdecaf8e326d1c1076bb6044d60bbbe14616` (version 1.1), identifies the text used for this research.

## 2. Recommended integration model

Use one pack-defined Project Director with specialists. The Director maintains direction, selects methods, delegates bounded work, integrates results and proposes changes. The selected Agent Pack defines the role; it is not a new Core capability or a second controller.

For complex parallel projects, workstream leads are an alternative. They use the same assignment and handoff contract. They add coordination cost, so introduce them only when the work justifies it.

Keep one selected Agent Pack. Map each required capability to one accountable agent. A Director may be mapped to `delivery-specification`, but that mapping is optional. Delegation does not add another capability mapping. Independent review remains a separate invocation. These boundaries already follow [Spec 09 §§2–3][methodology].

Keep three owners distinct:

| Owner | Responsibility |
| --- | --- |
| Agent Pack | Reusable methods, role responsibilities, routing and skill composition. |
| Run model | Agent cooperation and review arrangements for a particular execution context. During checkpoint execution, the approved run model takes precedence over pack methods. |
| Controller and runtime | Checkpoint acceptance and legal lifecycle progression under their respective contracts. A Director or worker cannot declare either complete. |

Connect the Director design to [Spec 00 §5, T6–T9][tasks]:

1. T6 uses CP01 evidence to design reusable orchestration and its domain instances.
2. T7 assigns each semantic change to its owning specification and checkpoint.
3. T8 implements and accepts the first Pactwright-backed successor before adoption.
4. T9 expands accepted run models through later checkpoints.

This proposal does not bring optional Extensions forward or replace the checkpoint sequence.

## 3. Director decision cycle and state ownership

### 3.1 Continuing responsibility, bounded execution

The proposed Director cycle is:

1. Load current direction, governing records and relevant evidence.
2. Identify changed facts, blockers and decisions.
3. Select eligible work under the current authority and readiness rules.
4. Delegate a bounded assignment with expected output and checks.
5. Inspect the result and obtain independent review where required.
6. Assess progress against the intended outcome.
7. Continue, correct, request a decision or stop.

Continuing responsibility does not mean an unbounded process. Each invocation has authority, scope, stop conditions and budgets. A method cannot enlarge runtime or host limits by retrying or delegating.

Project direction is broader than an **Intent direction** in [Core §44][core]. An Intent direction is a linear chain of superseded Intents. A project can have several such directions, including concurrent work. Do not change that term's Core meaning.

### 3.2 State belongs to its semantic owner

| State | Proposed or existing owner | Boundary |
| --- | --- | --- |
| Purpose, outcomes, measures, assumptions, constraints and review conditions | Versioned project direction document. With PI enabled, conclusions follow Source and Knowledge governance. | The document cannot authorise a Delivery or silently change accepted Knowledge. |
| Groups, work slices, coverage, dependencies and accountable owners | Proposed PI plan-composition record. | Readiness and progress are derived from governing records. |
| Authority and acceptance | Core Intent, Decision, Contract, Brief and Evidence. | A plan or conversation summary creates no new authority. |
| Assignments, trigger receipts, consumed budgets and interruption state | Execution host, linked to current governing records. | Saved execution state cannot authorise or accept work. |
| Reusable methods and domain expertise | Agent Pack and Production Skills, respectively. | Project-specific conclusions stay in the consuming project. |

A basic Director must remain usable without PI. It may use ordinary project documents and report their limits. It must not label those documents accepted PI records. This follows [Spec 09 §5][methodology].

### 3.3 Proposed PI plan-composition record

Keep the plan as a PI-owned canonical record without a graph-node projection. It needs:

- Stable group and work-slice IDs.
- One accountable owner for each assigned slice.
- References to accepted requirements, constraints and decisions.
- Group membership and planned coverage.
- Hard dependencies.
- Links to captured Intents.
- References to the Contracts that own combined acceptance.

Do not add a separate priority ranking, worker queue, mutable completion status or acceptance criteria. Planned coverage shows intended work. Contracts and Evidence establish fulfilment. Accepted components do not alone prove that their combination fulfils a shared outcome.

[Core §§54–56][core] already permits registered Extension records without node projections to contribute to graph revision. The required amendment is therefore a PI schema and registration contract. It does not require a new Core node type or revision protocol.

[PI §§21–23][pi] remains the one roadmap. Its readiness, hard dependencies and precedence govern selection. Plan views may explain that roadmap; they must not create a competing one.

## 4. Skills, progress and corrective action

### 4.1 Select active skills; govern missing skills

The Director selects skills from the already-resolved active pack environment. It loads instructions when needed and records the selected skill identity.

If a needed skill, family, specialisation or version is absent, report the gap and its owner. Route the work to Toolsmith or the owning Production Skills family. Research, implement and evaluate the candidate as needed, then explicitly adopt the environment. Discovery is not activation. A worker must not silently switch environments.

Under [Production Skills §§2–4 and 8–11][production-skills], the consuming project owns requirements, selection, integration and final product checks. Each family owns its domain methods and benchmarks. A family benchmark does not prove the assembled product works.

### 4.2 Report three separate results

| Result | Evidence required |
| --- | --- |
| Delivered and verified | The governing Contract, Brief, checks and Delivery Evidence. |
| Approved and in use | The owning approval plus actual adoption, exposure or publication records. |
| Observed effect | Outcome evidence with measures, observation window and uncertainty. |

[Core §44][core] defines `done` as Contract fulfilment. It does not establish publication or real-world success. [Assets §7][assets] retains human Asset approval.

For example, a pricing study can fulfil its Contract while later market evidence rejects its assumptions. Preserve the original Evidence. Record the new finding and route the required change through its owner.

### 4.3 Use the smallest sufficient corrective route

| Finding | Route |
| --- | --- |
| Defect within the authorised agreement and current approach | Correct under the current Contract and Brief. |
| Current approach is wrong | Create a new Brief under the same Contract. |
| Authorised outcome must change | Use a new Decision and Contract under the applicable lineage rules. |
| Missing authority, dependency or required decision | Report a blocker; do not advance until it is resolved through its owning operation. |
| Strategy or accepted conclusion must change | Propose the PI change, obtain approval and propagate its effects. |
| Evidence is missing | Run bounded research or an experiment only when its authority, dependencies and required decisions are in place. Otherwise, use the blocker route. |

The first four routes follow [Core §§32–34 and 45][core]. Operational feedback follows [Operations §§13–14][operations]: Observation → Source → accepted Knowledge → Intent candidate. Research without operational exposure can use an ordinary Source; it need not invent an Operations Observation.

[PI §11][pi] requires human review and approval for new canonical Knowledge and changed conclusions. A Director can propose a pivot. It cannot silently approve one or rewrite historical Evidence.

## 5. Specification amendment work

The tasks below define the local **Project Director Integration (PDI)** plan. Foundation tasks establish the methodology, Core and Distribution contracts. Integration tasks connect them to continuing project direction and the owning Extensions.

The alias column preserves the earlier planning labels and defines their mapping here. These aliases and PDI IDs do not rename Spec 00 tasks or checkpoint steps. `CP02-S04`, for example, means Checkpoint 2, Step 4.

| Planning alias | Local task ID | Work |
| --- | --- | --- |
| S01 | PDI-FOUND01 | Define the Agent Pack methodology contract. |
| S02 | PDI-FOUND02 | Align Core lifecycle and authority semantics. |
| S03 | PDI-FOUND03 | Define the Agent Pack lifecycle and Toolsmith ownership. |
| A01 | PDI-SPEC01 | Define continuing Director responsibility. |
| A02 | PDI-SPEC02 | Define the pack entry agent and host invocation. |
| S04 | PDI-SPEC03 | Define PI direction, planning and existing-project adoption. |
| S06 | PDI-SPEC04 | Define remote coordination, continuation and recovery. |
| S05 | PDI-SPEC05 | Align Extension ownership and outcome feedback. |
| S07 | PDI-SPEC06 | Align authority and implementation guidance. |
| C01 | PDI-CP01 | Amend standard methodology and entry requirements. |
| C02 | PDI-CP02 | Amend real-adapter and consumer acceptance. |
| C03 | PDI-CP03 | Amend remote execution and continuation acceptance. |
| C04 | PDI-CP04 | Amend direction, planning and adoption acceptance. |
| C05 | PDI-CP05 | Amend combined-review acceptance. |
| C06 | PDI-CP06 | Amend Toolsmith and specialist-pack acceptance. |
| C07 | PDI-CP07 | Amend feedback, hardening and graduation requirements. |
| V01 | PDI-VERIFY01 | Verify the complete amendment set. |

Specification tasks supply the design and ownership work for Spec 00 T6–T7. Checkpoint amendments allocate implementation and adoption under T7–T9. PDI-VERIFY01 checks consistency without replacing checkpoint acceptance.

### PDI-FOUND01 — Define Agent Pack methodology

**Owner:** [Spec 09](../specs/09-agent-methodology-and-workflows.md).

**Dependencies:** Core capability and authority boundaries; Distribution pack and Production Skills ownership.

1. Define pack-owned agents, responsibilities, methods, routing, outputs and handoffs.
2. Define interactive work, autonomous work, specialist delegation and independent review.
3. Separate pack methodology from reusable Production Skills expertise and runtime authority.
4. Define Toolsmith's authoring responsibilities and method evaluation requirements.
5. Provide software, business and creative examples without mandatory domain-specific roles or phases.

**Acceptance:** Different complete packs can define different teams and methods. Each method identifies its inputs, outputs, dependencies, accountable owner and checks. Delegation preserves capability accountability and independent review. Methods introduce no lifecycle transitions or approval rights.

### PDI-FOUND02 — Align Core lifecycle semantics

**Owner:** [Core §§27–39 and 44–55](../specs/01-pactwright-core-system-and-lifecycle.md), coordinated with [Spec 09](../specs/09-agent-methodology-and-workflows.md).

**Dependencies:** PDI-FOUND01.

1. Define the boundary between advisory work and governed Delivery.
2. Explain when one Delivery suffices and when related Deliveries need separate Contracts and combined acceptance.
3. Align correction, Brief replacement, Contract changes and Evidence closure with pack methods.
4. Define bounded worker handoffs, result integration and independent review.
5. Preserve dispatch freshness, stale-result stops, current-policy restart and consumed budgets.
6. Reconcile Core references without adding capabilities, canonical nodes or lifecycle stages.

**Acceptance:** Advice cannot advance Delivery state. Worker results pass current authority and freshness checks before use. A stale invocation ends; restart follows current policy without resetting budgets. Related Deliveries retain their own Contracts and Evidence. Combined acceptance has an explicit governing Contract.

### PDI-FOUND03 — Define the Agent Pack lifecycle and Toolsmith ownership

**Owner:** [Distribution §§5–8, 12–18 and 21–24](../specs/02-distribution-agent-packs-extensions-and-evaluation.md), coordinated with [Spec 09 §9](../specs/09-agent-methodology-and-workflows.md).

**Dependencies:** PDI-FOUND01. Reconcile authority and freshness boundaries with PDI-FOUND02.

1. Define packaging and discovery of agents, methods, direct skills and external skill composition.
2. Assign research, design, implementation, evaluation and maintenance to Toolsmith where provided, with pack-maintainer accountability.
3. Define candidate development in a source workspace using a complete selected pack.
4. Specify candidate evaluation, regression evidence, versioning, compatibility and release requirements.
5. Preserve one selected pack, exact dependency locking, explicit adoption and deliberate worker handoff when the environment changes.
6. Keep reusable domain methods with their Production Skills families and project conclusions with their project owner.

**Acceptance:** Trace a pack change from its motivating need through candidate evaluation, release and consumer adoption. Candidate work cannot silently replace an active environment. First-release evaluation works in an isolated consumer. Pack and domain-method corrections reach their respective owners.

### PDI-SPEC01 — Define continuing Director responsibility

**Owner:** [Spec 09](../specs/09-agent-methodology-and-workflows.md), with targeted [Core](../specs/01-pactwright-core-system-and-lifecycle.md) references where needed.

**Dependencies:** PDI-FOUND01–PDI-FOUND03.

1. Define ongoing project-direction responsibility and the bounded cycle in section 3.
2. Define the direction document's status and its Source/Knowledge boundary.
3. Route advice, research, production, review and decisions in proportion to the request.
4. Define selection of active skills, specialist handoffs, human decisions and external handoffs.
5. Define truthful progress reports and proposals to change approach or direction.
6. Preserve separate capability accountability, independent review and runtime/controller acceptance.

**Acceptance:** Trace a small request, a multi-Delivery project and an ongoing operation. Each action identifies its owner, authority and observable check. Missing authority, dependency or required decision produces a blocker and no advancement. Basic use works without PI where its dependencies permit. The existing authority and review boundaries remain intact.

### PDI-SPEC02 — Define and expose the pack entry agent

**Owner:** [Distribution §§5, 12 and 14](../specs/02-distribution-agent-packs-extensions-and-evaluation.md), coordinated with [Spec 09 §5](../specs/09-agent-methodology-and-workflows.md).

**Dependencies:** PDI-SPEC01 and PDI-FOUND03.

1. Define an optional manifest field, `entry_agent`, referencing an agent declared in the selected pack.
2. Validate that reference and include it in resolved environment identity.
3. Define the host entry that invokes the resolved agent instructions and skills.
4. Keep advisory invocation separate from a canonical responsibility result.
5. Use normal governed operations when the user commits an outcome to Delivery.
6. Define compatibility, migration and unsupported-host behavior before claiming support.
7. Preserve the seven adapter commands. Without the field, capability mappings remain usable but no advisory entry is declared.

The historical baseline explicitly lacks a pre-Delivery advisory entry. Prompt text alone cannot supply the missing host contract. Do not repurpose `/capture-intent` or infer that ordinary conversation invoked the resolved pack.

**Acceptance:** Use two packs with distinct agent names and mappings. Show that a real host invocation loads the correct resolved instructions. Show that advisory work leaves canonical Delivery records unchanged. Invalid references and unsupported hosts report their actual limits.

### PDI-SPEC03 — Define PI direction and plan composition

**Owner:** [Project Intelligence](../specs/03-project-intelligence.md), especially §§11, 19–24 and 27–30.

**Dependencies:** PDI-SPEC01–PDI-SPEC02 and PDI-FOUND02.

1. Define direction ingestion and the proposed plan schema, storage and registration.
2. Specify reviewed mutations, validation and contribution to graph revision.
3. Define coverage, hard dependencies, group progress and references to combined acceptance.
4. Keep readiness and precedence in the one roadmap.
5. Define recurrence, targeted replanning and propagation after approved changes.
6. Define existing-project adoption: inspect existing code and documents, record their sources, review conclusions through Knowledge governance and map accepted requirements to work. Keep inferred coverage separate from fulfilment evidence.

**Acceptance:** Cycles and invalid references fail validation. Canonical plan edits change graph revision. Coverage is not reported as proven fulfilment. A pivot changes affected work while preserving valid work and history. Each recurring occurrence can close while its durable policy remains. An existing project can establish a grounded plan without treating code presence or imported documents as accepted Knowledge or proven fulfilment.

### PDI-SPEC04 — Define remote coordination, continuation and recovery

**Owner:** General host semantics in [Core](../specs/01-pactwright-core-system-and-lifecycle.md) and [Distribution](../specs/02-distribution-agent-packs-extensions-and-evaluation.md); GitHub-specific behavior in [Spec 07](../specs/07-github-integration.md).

**Dependencies:** PDI-SPEC01–PDI-SPEC02 and PDI-FOUND02. Coordinate shared context references with PDI-SPEC03.

1. Define trigger inputs, saved state, budgets and ownership of continuation.
2. Record duplicate events and external-effect receipts.
3. Restore consumed budgets and reconcile current authority after restart.
4. Prevent replay of a confirmed external effect. Check an uncertain effect before retry.
5. Preserve the host/runtime boundary: the host cannot authorise work or declare acceptance.
6. Define bounded remote assignments, dispatch identity, worker results, blockers, failure reports and reconciliation with current governing records.
7. Define GitHub event routing and projections of owners, blockers and results. GitHub state cannot authorise or complete Delivery.

**Acceptance:** Another worker resumes from durable state without losing budget use or replaying a confirmed effect. Irrelevant or duplicate events do not advance work. Interrupted effects are reconciled before retry. Worker results retain assignment and replay identity. Blockers and failures reach the accountable owner. GitHub projections cannot bypass runtime checks.

Preserve [Core §34][core] exactly in meaning: a stale result ends that invocation; it cannot redispatch the step. A fresh invocation may restart under current policy after validation. Consumed lifecycle and host budgets remain. Do not add a permanent restart-approval gate. Useful prior work may be retained, but only current, accepted results may advance governed state.

### PDI-SPEC05 — Define Extension ownership and outcome feedback

**Owner:** [Graph Review](../specs/04-graph-review.md), [Assets and Publication](../specs/05-assets-and-publication.md) and [Operations](../specs/06-operations.md).

**Dependencies:** PDI-SPEC03–PDI-SPEC04.

1. Explain ownership with business and creative examples as well as software.
2. Distinguish fulfilled Delivery, approved Asset, actual Publication and observed outcome.
3. Define the relevant measures, observation windows and uncertainty.
4. Route combined failures to the responsible owner and route findings or observations through PI governance.

**Acceptance:** A fulfilled Delivery can remain unpublished or produce a weak outcome. Reports show those states separately. A failed combination is not hidden by individually accepted components. The next action has an owner and the required authority.

### PDI-SPEC06 — Align organisation and implementation guidance

**Owner:** [Spec 08](../specs/08-open-source-project-organisation.md), [Spec 00](../specs/00-checkpoint-step-contract-and-delivery-tasks.md) and the [shared checkpoint guide](../checkpoints/00-implementation-guide.md).

**Dependencies:** PDI-FOUND01–PDI-FOUND03 and PDI-SPEC01–PDI-SPEC05.

1. Register Spec 09 in the specification authority map.
2. Link the Director work to T6–T9 and identify task dependencies.
3. Keep Agent Pack methods, run-model cooperation and controller acceptance distinct.
4. Update task guides from observed use rather than invented walkthroughs.
5. Require evidence-based acceptance of a successor before adoption.

**Acceptance:** Every semantic requirement and implementation task has one owner. Existing checkpoint obligations remain covered. The guide cannot imply that a proposed method or successor is already accepted.

## 6. Checkpoint amendment allocation

These IDs are planning labels for amendments to the existing checkpoint steps. They do not replace checkpoint or requirement IDs. Keep CP01 onward in its established order.

| Task | Owning checkpoint steps | Required amendment and proof |
| --- | --- | --- |
| PDI-CP01 | [CP01](../checkpoints/01-self-hosted-delivery.md) CP01-S08–CP01-S13, plus affected early Core contracts. | Reference roles, Director and Toolsmith methods through direct skills, current-context handoff and method evaluation. Allocate `entry_agent` validation and reference binding to CP01-S10, resolution and locking to CP01-S11, and adapter generation and invocation to CP01-S12. Preserve one accountable agent per capability and all seven commands. Amend earlier identity or mutation contracts only where required by the owning semantics. |
| PDI-CP02 | [CP01](../checkpoints/01-self-hosted-delivery.md) CP01-S24–CP01-S27 and CP01-S30–CP01-S31. | Exercise the real generated adapter from advice to committed work, delegation, correction, walkthrough and truthful report. Show proportionate handling of a small request. Exercise self-hosted Pactwright use and Kakeibo reuse, including recovery. Write user guides from the observed journeys. |
| PDI-CP03 | [CP02](../checkpoints/02-remote-delivery.md) CP02-S04–CP02-S07 and CP02-S12–CP02-S15. | Prove actual runtime invocation, bounded remote assignments, worker-result integration, authority stops, failure reporting and durable continuation. Recover with another worker, retain budgets, select relevant events and reconcile duplicates and effects. Implement and accept the first Pactwright-backed run model under T8. |
| PDI-CP04 | [CP03](../checkpoints/03-project-intelligence.md) CP03-S02–CP03-S12, CP03-S18–CP03-S20 and CP03-S25–CP03-S26. | Prove PI plan storage and validation, direction ingestion, coverage, hard dependencies, one roadmap, combined proof, targeted replanning and human approval of Knowledge. Adopt an existing codebase using sourced documents and reviewed conclusions; propagate Knowledge changes to affected work. |
| PDI-CP05 | [CP04](../checkpoints/04-graph-review.md) affected CP04-S02–CP04-S12; proof in CP04-S15–CP04-S17 and CP04-S20–CP04-S21. | Supply the right project and Delivery context. Detect an integration failure despite individually accepted components. Retain independent review and a retryable Finding → Source handoff. |
| PDI-CP06 | [CP05](../checkpoints/05-production-skills-and-assets-publication.md) CP05-S01–CP05-S04, CP05-S16, CP05-S19–CP05-S21 and CP05-S24–CP05-S26. | Resolve exact external skill composition. Exercise Toolsmith research, design, implementation, evaluation, release and explicit adoption. Add the proposed clean-consumer proof to CP05-S16. Prove real non-software output and Kakeibo reuse through the existing public-output and consumer exercises. |
| PDI-CP07 | [CP06](../checkpoints/06-operations.md) feedback; [CP07](../checkpoints/07-publication-feedback.md) CP07-S07–CP07-S11 and CP07-S14–CP07-S15; [CP08](../checkpoints/08-github-project-surface.md) operating surfaces; [CP09](../checkpoints/09-hardened-closed-loop.md) recovery and repeated-loop proofs; [CP10](../checkpoints/10-graduation-connected-banking.md) consumption. | Govern learning and future work. Report owners, blockers and next actions. Exercise repeated corrections, exhausted budgets, stale inputs, interrupted effects and pivots. Add methodology regression cases and failure drills with an accountable owner. Align public documentation with supported behaviour. Consume the accepted facilities at graduation. |

The owning checkpoint steps above own the contract amendments. Each row's required proof defines its acceptance criteria. Amend both the prose and YAML contracts while preserving requirement IDs and historical evidence. Use these documentation dependencies:

| Task | Dependencies |
| --- | --- |
| PDI-CP01 | PDI-FOUND01–PDI-FOUND03; PDI-SPEC01–PDI-SPEC02; applicable dispatch and host boundaries from PDI-SPEC04; PDI-SPEC06. |
| PDI-CP02 | PDI-CP01 and the routing and reporting contracts in PDI-SPEC01–PDI-SPEC02. |
| PDI-CP03 | PDI-CP01; PDI-SPEC04; run-model allocation in PDI-SPEC06. |
| PDI-CP04 | PDI-CP01; PDI-SPEC03. |
| PDI-CP05 | PDI-CP04; combined-review ownership in PDI-SPEC05. |
| PDI-CP06 | PDI-CP01; PDI-FOUND03; PDI-SPEC02 and PDI-SPEC05. External skill proof requires accepted compatible upstream revisions. |
| PDI-CP07 | PDI-CP02–PDI-CP06; feedback and recovery contracts in PDI-SPEC03–PDI-SPEC05. |

### 6.1 Preserve the CP01/CP02 invocation boundary

CP01 proves real-model work through the generated adapter, with an instrumented runtime seam. [CP01-S08 R03 and AC02](../checkpoints/01-self-hosted-delivery/CP01-S08.yml) supplies no provider invoker. A run without an invoker stops and simulates nothing.

CP02 owns real unattended runtime invocation and durable continuation. Do not bring that responsibility into CP01 merely to demonstrate the Director. Keep actual model use, instrumented runtime checks and later unattended invocation distinguishable in evidence.

### 6.2 PDI-CP06 connected cross-domain proof

Extend the existing CP05 public-output exercise rather than inventing an unrelated demo:

1. A Founder-style Director scopes a bounded launch or positioning package.
2. Business and research specialists provide analysis against the same direction.
3. Creative specialists provide narrative and visual output.
4. A separate review invocation checks the combined package and shared inputs.
5. The owning Asset approval and Publication operations govern release.
6. Later outcome feedback follows Operations and PI governance.

Use Pactwright and Kakeibo under the existing [CP05](../checkpoints/05-production-skills-and-assets-publication.md) public-output and consumer exercises (CP05-S19–CP05-S21 and CP05-S24–CP05-S26). Add a clean-consumer proof as a **proposed CP05-S16 amendment**, not an existing CP05 obligation: install the candidate pack in a separate repository without the author's local configuration, resolve its declared dependencies and exercise the supported entry and skill composition. This extends CP05-S16's existing isolated conformance work.

Use accepted, compatible external skills with exact identities. If a skill or integration is absent, record an explicit upstream blocker. Do not substitute a simulated success for the missing proof.

### 6.3 PDI-CP07 Publication Feedback allocation

Allocate PDI-SPEC05's publication-feedback and truthful outcome-reporting requirements to these [CP07](../checkpoints/07-publication-feedback.md) steps:

| Existing step | Proposed Director-specific proof |
| --- | --- |
| CP07-S07 | Report bounded live evidence, its observation window and uncertainty separately from Delivery fulfilment. Preserve legitimate no-Observation results. |
| CP07-S08–CP07-S09 | Trace feedback through Source, approved Knowledge and the one PI roadmap before selecting a corrective candidate. Do not invent a candidate or claim an unproven improvement. |
| CP07-S10–CP07-S11 | Distinguish verified corrective Delivery, human Asset approval and actual publication. Preserve earlier Evidence and release history. Reconcile uncertain publication effects before retry. |
| CP07-S14–CP07-S15 | Repeat truthful outcome reporting on the Kakeibo surface. Give each finding an owner and next action; resolve and reverify blocking failures before checkpoint exit. |

These amendments extend existing step obligations. They do not authorise a new lifecycle, automatic Knowledge approval or early CP07 execution.

## 7. Integration cases to allocate

Allocate these acceptance cases to the owning specification and checkpoint tasks.

| Case | Observable result | Primary allocation |
| --- | --- | --- |
| Advice entry | The actual host loads the resolved entry agent; advisory work creates no canonical Delivery records. | PDI-SPEC02, PDI-CP01–PDI-CP02. |
| Missing skill | The report names the gap and owner; discovery does not activate the skill or change the worker environment. | PDI-SPEC01, PDI-CP01, PDI-CP06. |
| Combined component failure | Independent review identifies the failed combined requirement and routes governed corrective work. | PDI-SPEC03 and PDI-SPEC05, PDI-CP04–PDI-CP06. |
| Changed approach | A new Brief replaces the approach while the authorised Contract remains valid. | PDI-SPEC01, PDI-CP02. |
| Strategic pivot | Affected conclusions and obligations change through approval; valid work and historical Evidence remain. | PDI-SPEC03 and PDI-SPEC05, PDI-CP04, PDI-CP07. |
| Concurrent stale work | A stale result cannot advance state; the invocation ends. Current-policy restart preserves consumed budgets and reconciles useful work. | PDI-SPEC04, PDI-CP01, PDI-CP03, PDI-CP07. |
| Interrupted external effect | Resume checks the effect's actual state before retry; a confirmed effect is not replayed. | PDI-SPEC04, PDI-CP03, PDI-CP07. |
| Fulfilled output, weak outcome | Delivery fulfilment and observed effect are reported separately, with a governed next action. | PDI-SPEC05, PDI-CP06–PDI-CP07; CP07-S07–CP07-S11 provide the Publication Feedback proof. |
| Recurring obligation | Evidence closes the current occurrence while the recurrence policy remains in force. | PDI-SPEC03, PDI-CP04, PDI-CP07. |

[Spec 09 §10][methodology] requires truthful evaluation status. Distinguish executed checks, cases not evaluated and semantic outcomes not judged. At the baseline, `pactwright eval` does not automatically discover pack-owned method cases. A documented, supported execution path is required. A standalone advisory test cannot prove that the adapter exposes advisory entry.

## 8. Execution order and delivery milestones

The documentation dependency order is:

1. PDI-FOUND01 establishes the methodology contract.
2. PDI-FOUND02 and PDI-FOUND03 align Core and Distribution; reconcile their shared boundaries.
3. PDI-SPEC01 defines continuing direction, followed by PDI-SPEC02 for entry.
4. PDI-SPEC03 and PDI-SPEC04 define PI planning and host coordination once their shared interfaces are clear.
5. PDI-SPEC05 and PDI-SPEC06 reconcile Extension ownership and implementation guidance.
6. PDI-CP01 establishes the early checkpoint interfaces and acceptance requirements.
7. PDI-CP02, PDI-CP03, PDI-CP04 and PDI-CP06 amend their checkpoint contracts under the dependencies in section 6.
8. PDI-CP05 and PDI-CP07 cover combined review, feedback and hardening.
9. PDI-VERIFY01 checks the full amendment set.

Parallelism here concerns document work with clear ownership. Runtime execution still follows CP01 → CP02 → CP03 and the later checkpoints in order. An early-written CP05 amendment does not permit early CP05 execution.

| Accepted checkpoint | Intended milestone after the proposed amendments |
| --- | --- |
| CP01 | Usable Director, direct skills, supported advisory entry and bounded governed Delivery. |
| CP02 | Remote invocation, durable continuation and the first accepted Pactwright-backed successor. |
| CP03 | PI-backed grouped direction, planning and roadmap derivation. |
| CP04 | Context-aware combined review and governed findings. |
| CP05 | Exact external skill composition, Toolsmith lifecycle and real cross-domain output. |
| CP06–CP09 | Operational feedback, publication feedback, project surfaces and recovery hardening. |
| CP10 | Graduation using the accepted system and prior-feature obligations. |

## 9. PDI-VERIFY01 — Final consistency and verification

**Owner:** [Spec 00](../specs/00-checkpoint-step-contract-and-delivery-tasks.md) and the [shared checkpoint guide](../checkpoints/00-implementation-guide.md), coordinated with each semantic owner.

**Dependencies:** PDI-FOUND01–PDI-FOUND03, PDI-SPEC01–PDI-SPEC06 and PDI-CP01–PDI-CP07.

Before implementing the amended checkpoints:

1. Assign every requirement a semantic owner and implementation step.
2. Give each acceptance condition an observable result and a supported execution path.
3. Preserve Core authority, human Knowledge approval, Asset approval and independent review.
4. Check schemas, compatibility, environment identity and unsupported behavior.
5. Keep existing task, step and requirement IDs stable where their meaning remains valid.
6. Review changed prose contracts and refresh their recorded hashes through the required process.
7. Retain the historical crosswalk. Earlier evidence is history, not proof of an amended requirement.
8. Run `pnpm contracts:check` and `pnpm verify` against the actual changes.
9. Supply full historical Git source to contract verification. A shallow checkout can leave historical checks unavailable.

**Acceptance:** All 17 tasks map to their owning documents and acceptance criteria. Cross-document checks find no conflicting ownership, missing allocation or broken task references. Repository verification passes with the historical sources available.

Repository checks validate their covered properties. They do not replace the live adapter, model, external-effect, skill-composition or outcome proofs assigned above. Report each unavailable proof as unavailable.

## Source register

Research citations and their section numbers refer to these source snapshots. Relative task-owner links identify the canonical files to amend.

[tasks]: https://github.com/sb-dev/pactwright/blob/4e78f174e6c148e7c45ec463d9d9b347bb2ce407/docs/specs/00-checkpoint-step-contract-and-delivery-tasks.md
[core]: https://github.com/sb-dev/pactwright/blob/4e78f174e6c148e7c45ec463d9d9b347bb2ce407/docs/specs/01-pactwright-core-system-and-lifecycle.md
[distribution]: https://github.com/sb-dev/pactwright/blob/4e78f174e6c148e7c45ec463d9d9b347bb2ce407/docs/specs/02-distribution-agent-packs-extensions-and-evaluation.md
[pi]: https://github.com/sb-dev/pactwright/blob/4e78f174e6c148e7c45ec463d9d9b347bb2ce407/docs/specs/03-project-intelligence.md
[graph-review]: https://github.com/sb-dev/pactwright/blob/4e78f174e6c148e7c45ec463d9d9b347bb2ce407/docs/specs/04-graph-review.md
[assets]: https://github.com/sb-dev/pactwright/blob/4e78f174e6c148e7c45ec463d9d9b347bb2ce407/docs/specs/05-assets-and-publication.md
[operations]: https://github.com/sb-dev/pactwright/blob/4e78f174e6c148e7c45ec463d9d9b347bb2ce407/docs/specs/06-operations.md
[github]: https://github.com/sb-dev/pactwright/blob/4e78f174e6c148e7c45ec463d9d9b347bb2ce407/docs/specs/07-github-integration.md
[organisation]: https://github.com/sb-dev/pactwright/blob/4e78f174e6c148e7c45ec463d9d9b347bb2ce407/docs/specs/08-open-source-project-organisation.md
[methodology]: https://github.com/sb-dev/pactwright/blob/4e78f174e6c148e7c45ec463d9d9b347bb2ce407/docs/specs/09-agent-methodology-and-workflows.md
[guide]: https://github.com/sb-dev/pactwright/blob/4e78f174e6c148e7c45ec463d9d9b347bb2ce407/docs/checkpoints/00-implementation-guide.md
[cp01]: https://github.com/sb-dev/pactwright/blob/4e78f174e6c148e7c45ec463d9d9b347bb2ce407/docs/checkpoints/01-self-hosted-delivery.md
[cp01-s08]: https://github.com/sb-dev/pactwright/blob/4e78f174e6c148e7c45ec463d9d9b347bb2ce407/docs/checkpoints/01-self-hosted-delivery/CP01-S08.yml
[cp02]: https://github.com/sb-dev/pactwright/blob/4e78f174e6c148e7c45ec463d9d9b347bb2ce407/docs/checkpoints/02-remote-delivery.md
[cp03]: https://github.com/sb-dev/pactwright/blob/4e78f174e6c148e7c45ec463d9d9b347bb2ce407/docs/checkpoints/03-project-intelligence.md
[cp04]: https://github.com/sb-dev/pactwright/blob/4e78f174e6c148e7c45ec463d9d9b347bb2ce407/docs/checkpoints/04-graph-review.md
[cp05]: https://github.com/sb-dev/pactwright/blob/4e78f174e6c148e7c45ec463d9d9b347bb2ce407/docs/checkpoints/05-production-skills-and-assets-publication.md
[cp06]: https://github.com/sb-dev/pactwright/blob/4e78f174e6c148e7c45ec463d9d9b347bb2ce407/docs/checkpoints/06-operations.md
[cp07]: https://github.com/sb-dev/pactwright/blob/4e78f174e6c148e7c45ec463d9d9b347bb2ce407/docs/checkpoints/07-publication-feedback.md
[cp08]: https://github.com/sb-dev/pactwright/blob/4e78f174e6c148e7c45ec463d9d9b347bb2ce407/docs/checkpoints/08-github-project-surface.md
[cp09]: https://github.com/sb-dev/pactwright/blob/4e78f174e6c148e7c45ec463d9d9b347bb2ce407/docs/checkpoints/09-hardened-closed-loop.md
[cp10]: https://github.com/sb-dev/pactwright/blob/4e78f174e6c148e7c45ec463d9d9b347bb2ce407/docs/checkpoints/10-graduation-connected-banking.md
[production-skills]: https://github.com/sb-dev/production-skills/blob/165f00af9256268f1dfbd3432cf9d0cad2de3639/docs/specs/04-cross-domain-orchestration-and-integration.md
