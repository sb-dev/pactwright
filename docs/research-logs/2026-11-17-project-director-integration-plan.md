# Project Director Integration — Research Log and Amendment Plan

**Date:** 17 November 2026

**Status:** Proposed research and implementation planning; not normative specification text.

**Historical analysis baseline:** `4e78f174e6c148e7c45ec463d9d9b347bb2ce407`.

**Repository baseline checked for this save:** `main` at the same commit.

**Scope of this change:** Preserve the findings and revised plan. Do not implement the proposed specification, checkpoint or runtime changes.

## 1. Provenance and current state

The user proposed a Project Director that maintains project direction across Deliveries. The findings below preserve the prior analysis of that proposal. They are recommendations unless a paragraph identifies an existing specification rule. The original proposal is an input, not Pactwright authority.

The user reported that Waves 1 and 2 were complete: S01 (Spec 09), S02 (Core alignment) and S03 (Distribution and Toolsmith lifecycle). This plan retains those tasks as complete. That status concerns the specification work. It does not establish runtime support or checkpoint acceptance.

The repository inspection for this save independently confirmed the corresponding specification text and commit history:

| Completed task | Repository evidence | Limit of the evidence |
| --- | --- | --- |
| S01 — Agent methodology | [Spec 09][methodology], initially added in [2401941](https://github.com/sb-dev/pactwright/commit/2401941be9ea1c23d3b2c4bacbc2620f7d8249cb), with later clarifications. | Defines the target contract; does not prove shipped methods. |
| S02 — Core alignment | [Core][core], amended in [c41652a](https://github.com/sb-dev/pactwright/commit/c41652a7d1ed600b8e53e5f3b7f661d2ad870ded) and [4e78f17](https://github.com/sb-dev/pactwright/commit/4e78f174e6c148e7c45ec463d9d9b347bb2ce407). | Includes stale-dispatch restart rules; does not prove their runtime implementation. |
| S03 — Distribution and Toolsmith lifecycle | [Distribution][distribution], amended in [22c603f](https://github.com/sb-dev/pactwright/commit/22c603f700c09298f76a06d146f9aeaefdc65b84). | Defines pack development and adoption; explicitly leaves advisory entry unsupported on the seven-command adapter path. |

At inspection, `main` had not advanced beyond the historical baseline. No later A01 amendment was present on that branch. This is a statement about the inspected branch, not about unmerged branches or work elsewhere. Recheck the target branch before starting an amendment and credit any work already adopted.

The prior analysis reviewed definitions and layout. It changed no files and ran no runtime tests. This save adds a research log only. Checks for this save are recorded in section 11; they must not be read as execution of the proposed integration cases.

Source links in this log are pinned to the historical Pactwright baseline. The external [Production Skills cross-domain specification][production-skills] was read during this save at file blob `2be3cdecaf8e326d1c1076bb6044d60bbbe14616` (version 1.1). Its link follows that repository's `main`, so later readers must check its revision.

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
| Strategy or accepted conclusion must change | Propose the PI change, obtain approval and propagate its effects. |
| Evidence is missing | Run bounded research or an experiment under the required authority. |

The first three routes follow [Core §§32–34 and 45][core]. Operational feedback follows [Operations §§13–14][operations]: Observation → Source → accepted Knowledge → Intent candidate. Research without operational exposure can use an ordinary Source; it need not invent an Operations Observation.

[PI §11][pi] requires human review and approval for new canonical Knowledge and changed conclusions. A Director can propose a pivot. It cannot silently approve one or rewrite historical Evidence.

## 5. Specification amendment work

Retain completed S01–S03. Insert A01 and A02 as an integration wave, then resume the existing task IDs. All items below are proposed work, not claims of implementation.

### A01 — Define continuing Director responsibility

**Owner:** [Spec 09][methodology], with targeted [Core][core] references where needed.

1. Define ongoing project-direction responsibility and the bounded cycle in section 3.
2. Define the direction document's status and its Source/Knowledge boundary.
3. Route advice, research, production, review and decisions in proportion to the request.
4. Define selection of active skills, specialist handoffs, human decisions and external handoffs.
5. Define truthful progress reports and proposals to change approach or direction.
6. Preserve separate capability accountability, independent review and runtime/controller acceptance.

**Acceptance:** Trace a small request, a multi-Delivery project and an ongoing operation. Each action identifies its owner, authority and observable check. Basic use works without PI where its dependencies permit. Completed S01–S03 remain complete.

### A02 — Define and expose the pack entry agent

**Owner:** [Distribution §§5, 12 and 14][distribution], coordinated with [Spec 09 §5][methodology].

1. Define an optional manifest field, `entry_agent`, referencing an agent declared in the selected pack.
2. Validate that reference and include it in resolved environment identity.
3. Define the host entry that invokes the resolved agent instructions and skills.
4. Keep advisory invocation separate from a canonical responsibility result.
5. Use normal governed operations when the user commits an outcome to Delivery.
6. Define compatibility, migration and unsupported-host behavior before claiming support.
7. Preserve the seven adapter commands. Without the field, capability mappings remain usable but no advisory entry is declared.

The historical baseline explicitly lacks a pre-Delivery advisory entry. Prompt text alone cannot supply the missing host contract. Do not repurpose `/capture-intent` or infer that ordinary conversation invoked the resolved pack.

**Acceptance:** Use two packs with distinct agent names and mappings. Show that a real host invocation loads the correct resolved instructions. Show that advisory work leaves canonical Delivery records unchanged. Invalid references and unsupported hosts report their actual limits.

### S04 — Define PI direction and plan composition

**Owner:** [Project Intelligence][pi], especially §§11, 19–24 and 27–30.

1. Define direction ingestion and the proposed plan schema, storage and registration.
2. Specify reviewed mutations, validation and contribution to graph revision.
3. Define coverage, hard dependencies, group progress and references to combined acceptance.
4. Keep readiness and precedence in the one roadmap.
5. Define recurrence, adoption, replanning and propagation after approved changes.

**Acceptance:** Cycles and invalid references fail validation. Canonical plan edits change graph revision. Coverage is not reported as proven fulfilment. A pivot changes affected work while preserving valid work and history. Each recurring occurrence can close while its durable policy remains.

### S06 — Define bounded continuation and recovery

**Owner:** General host semantics in [Core][core] and [Distribution][distribution]; GitHub-specific behavior in [Spec 07][github].

1. Define trigger inputs, saved state, budgets and ownership of continuation.
2. Record duplicate events and external-effect receipts.
3. Restore consumed budgets and reconcile current authority after restart.
4. Prevent replay of a confirmed external effect. Check an uncertain effect before retry.
5. Preserve the host/runtime boundary: the host cannot authorise work or declare acceptance.

**Acceptance:** Another worker resumes from durable state without losing budget use or replaying a confirmed effect. Irrelevant or duplicate events do not advance work. Interrupted effects are reconciled before retry.

Preserve [Core §34][core] exactly in meaning: a stale result ends that invocation; it cannot redispatch the step. A fresh invocation may restart under current policy after validation. Consumed lifecycle and host budgets remain. Do not add a permanent restart-approval gate. Useful prior work may be retained, but only current, accepted results may advance governed state.

### S05 — Define Extension ownership and outcome feedback

**Owner:** [Graph Review][graph-review], [Assets and Publication][assets] and [Operations][operations].

1. Explain ownership with business and creative examples as well as software.
2. Distinguish fulfilled Delivery, approved Asset, actual Publication and observed outcome.
3. Define the relevant measures, observation windows and uncertainty.
4. Route combined failures to the responsible owner and route findings or observations through PI governance.

**Acceptance:** A fulfilled Delivery can remain unpublished or produce a weak outcome. Reports show those states separately. A failed combination is not hidden by individually accepted components. The next action has an owner and the required authority.

### S07 — Align organisation and implementation guidance

**Owner:** [Spec 08][organisation], [Spec 00][tasks] and the [shared checkpoint guide][guide].

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
| C01 | [CP01][cp01] S08–S13, plus affected early Core contracts. | Reference Director, direct skills, current-context handoff, `entry_agent`, adapter exposure and method evaluation. Preserve one accountable agent per capability and all seven commands. Amend earlier identity or mutation contracts only where required by the owning semantics. |
| C02 | [CP01][cp01] S24–S27 and S30–S31. | Exercise the real generated adapter from advice to committed work, delegation, correction, walkthrough and truthful report. Show proportionate handling of a small request. Write guides from the observed journey. |
| C03 | [CP02][cp02] S04–S07 and S12–S15. | Prove actual runtime invocation and bounded durable continuation. Recover with another worker, retain budgets, select relevant events and reconcile duplicates and effects. Implement and accept the first Pactwright-backed run model under T8. |
| C04 | [CP03][cp03] S02–S12, S18–S20 and S25–S26. | Prove PI plan storage and validation, direction ingestion, coverage, hard dependencies, one roadmap, combined proof, replanning and human approval of Knowledge. |
| C05 | [CP04][cp04] affected S02–S12; proof in S15–S17 and S20–S21. | Supply the right project and Delivery context. Detect an integration failure despite individually accepted components. Retain independent review and a retryable Finding → Source handoff. |
| C06 | [CP05][cp05] S01–S04, S16, S19–S21 and S24–S26. | Resolve exact external skill composition. Exercise Toolsmith research, design, implementation, evaluation, release and explicit adoption. Prove a clean consumer, real non-software output and Kakeibo reuse. |
| C07 | [CP06][cp06]–[CP08][cp08] feedback and operating surfaces; [CP09][cp09] recovery and repeated-loop proofs; [CP10][cp10] consumption. | Govern learning and future work. Report owners, blockers and next actions. Exercise corrections, exhausted budgets, stale inputs, interrupted effects and pivots. Consume the accepted facilities at graduation. |

### 6.1 Preserve the CP01/CP02 invocation boundary

CP01 proves real-model work through the generated adapter, with an instrumented runtime seam. [CP01-S08 R03 and AC02][cp01-s08] supplies no provider invoker. A run without an invoker stops and simulates nothing.

CP02 owns real unattended runtime invocation and durable continuation. Do not bring that responsibility into CP01 merely to demonstrate the Director. Keep actual model use, instrumented runtime checks and later unattended invocation distinguishable in evidence.

### 6.2 C06 connected cross-domain proof

Extend the existing CP05 public-output exercise rather than inventing an unrelated demo:

1. A Founder-style Director scopes a bounded launch or positioning package.
2. Business and research specialists provide analysis against the same direction.
3. Creative specialists provide narrative and visual output.
4. A separate review invocation checks the combined package and shared inputs.
5. The owning Asset approval and Publication operations govern release.
6. Later outcome feedback follows Operations and PI governance.

Use Pactwright, Kakeibo and a clean consumer as their checkpoint obligations require. Use accepted, compatible external skills with exact identities. If a skill or integration is absent, record an explicit upstream blocker. Do not substitute a simulated success for the missing proof.

## 7. Integration cases to allocate

These are proposed acceptance cases. None was executed by the historical analysis or by saving this log.

| Case | Observable result | Primary allocation |
| --- | --- | --- |
| Advice entry | The actual host loads the resolved entry agent; advisory work creates no canonical Delivery records. | A02, C01–C02. |
| Missing skill | The report names the gap and owner; discovery does not activate the skill or change the worker environment. | A01, C01, C06. |
| Combined component failure | Independent review identifies the failed combined requirement and routes governed corrective work. | S04–S05, C04–C06. |
| Changed approach | A new Brief replaces the approach while the authorised Contract remains valid. | A01, C02. |
| Strategic pivot | Affected conclusions and obligations change through approval; valid work and historical Evidence remain. | S04–S05, C04, C07. |
| Concurrent stale work | A stale result cannot advance state; the invocation ends. Current-policy restart preserves consumed budgets and reconciles useful work. | S06, C01, C03, C07. |
| Interrupted external effect | Resume checks the effect's actual state before retry; a confirmed effect is not replayed. | S06, C03, C07. |
| Fulfilled output, weak outcome | Delivery fulfilment and observed effect are reported separately, with a governed next action. | S05, C06–C07. |
| Recurring obligation | Evidence closes the current occurrence while the recurrence policy remains in force. | S04, C04, C07. |

[Spec 09 §10][methodology] requires truthful evaluation status. Distinguish executed checks, cases not evaluated and semantic outcomes not judged. At the baseline, `pactwright eval` does not automatically discover pack-owned method cases. A documented, supported execution path is required. A standalone advisory test cannot prove that the adapter exposes advisory entry.

## 8. Execution order and delivery milestones

The amendment order is:

1. A01, then A02.
2. S04 and S06 may proceed in parallel once their interfaces are clear.
3. S05 and S07 follow those shared decisions.
4. C01 establishes the early checkpoint amendments.
5. C02, C03, C04 and C06 amendment work proceeds when its owning interfaces are ready.
6. C05 and C07 complete integration and feedback coverage.
7. V01 checks the complete amendment set.

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

## 9. V01 — Final consistency and verification

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

Repository checks validate their covered properties. They do not replace the live adapter, model, external-effect, skill-composition or outcome proofs assigned above. Report each unavailable proof as unavailable.

## 10. Next implementation action

Start with A01 against the latest target branch. Compare its current text with this log before editing. If A01 or part of it has since been adopted, preserve that work and continue from the remaining gap.

Then define A02's concrete manifest and host contract before claiming advisory support. Retain S01–S03 as complete. Resume the remaining tasks in section 8 without renumbering or discarding the original checkpoint obligations.

## 11. Validation of this research-log change

The save used a full-history checkout of the baseline. Repository guidance and recent commit conventions were inspected before preparing the change. No research-log index exists in the inspected layout, and this change does not alter the normative checkpoint authority map.

The required repository checks for this file change are `pnpm contracts:check` and `pnpm verify`. Their observed results are recorded in the commit and pull request. The proposed runtime and integration cases remain unexecuted by this save.

## Source register

Section numbers in this log refer to these source snapshots unless stated otherwise.

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
[cp08]: https://github.com/sb-dev/pactwright/blob/4e78f174e6c148e7c45ec463d9d9b347bb2ce407/docs/checkpoints/08-github-project-surface.md
[cp09]: https://github.com/sb-dev/pactwright/blob/4e78f174e6c148e7c45ec463d9d9b347bb2ce407/docs/checkpoints/09-hardened-closed-loop.md
[cp10]: https://github.com/sb-dev/pactwright/blob/4e78f174e6c148e7c45ec463d9d9b347bb2ce407/docs/checkpoints/10-graduation-connected-banking.md
[production-skills]: https://github.com/sb-dev/production-skills/blob/main/docs/specs/04-cross-domain-orchestration-and-integration.md
