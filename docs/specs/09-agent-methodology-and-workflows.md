# Pactwright Agent Methodology and Workflows

## 1. Purpose and Scope

This specification defines the common contract for Agent Pack methodology.

An Agent Pack defines who does the work, how agents cooperate and how they use Production Skills. Each pack chooses its agents and methods. Pactwright does not require one team structure or one production process.

The contract applies to software delivery, research, business advice and creative work. It supports useful work before a governed Delivery, as well as work under an authorised Contract and Brief.

This specification owns agent responsibilities, method descriptions, routing, handoffs, review separation and Toolsmith's pack-authoring responsibilities. It does not own runtime transitions, canonical records, package formats, provider routing or domain techniques. Implementation checkpoints determine when these requirements are supported; this document is not evidence that they have shipped.

This document defines the target methodology contract. [Core v7](./01-pactwright-core-system-and-lifecycle.md) defines its Delivery, authority and dispatch-freshness requirements. [Distribution v6](./02-distribution-agent-packs-extensions-and-evaluation.md) defines its packaging, exposure, evaluation and adoption requirements. These specification amendments do not establish runtime support or checkpoint acceptance. Registration in [Open-Source Project Organisation, section 9](./08-open-source-project-organisation.md) remains follow-on work. Sections 5 and 10 retain the current limits on advisory entry and pack-case discovery.

## 2. Terms and Ownership

The terms below have distinct meanings:

- A **capability** is a Pactwright semantic responsibility, such as `delivery-review`.
- An **agent** is a pack-defined worker with instructions and skills.
- A **role** is an agent's responsibility within a method, such as researcher or coordinator.
- A **method** describes how to achieve one useful result, including its inputs, outputs and checks.
- A **methodology** combines roles and methods into an approach to work.

One agent may fulfil several roles. A public persona is a presentation choice, not an authority boundary or a requirement for a separate agent.

| Owner | Responsibility |
| --- | --- |
| Pactwright Core | Delivery semantics, authority, legal transitions, canonical mutations and Evidence closure. |
| Pactwright Extensions | Their optional semantics, records, capabilities and validation. |
| Agent Pack | Agent responsibilities, cross-agent coordination, method routing and skill composition. |
| Production Skills | Reusable domain methods, production workflows, tools, artefacts and domain evaluation. |
| Production Extension Packs | Specialised knowledge for their owning Production Skills family. |
| Execution host and adapter | Supported execution facilities and projection of the resolved Pactwright environment. |
| Checkpoint harness and run model | Checkpoint acceptance and the configured agents, skills and review cooperation, as separated in Spec 00. |

These boundaries follow [Core, sections 35–43](./01-pactwright-core-system-and-lifecycle.md), [Distribution, sections 4–11, 14 and 18–20](./02-distribution-agent-packs-extensions-and-evaluation.md), and [Spec 00, sections 1–4](./00-checkpoint-step-contract-and-delivery-tasks.md).

During checkpoint execution, the approved run model takes precedence over pack methods for agent cooperation, role assignments and review separation. Neither may override the owning specifications or checkpoint acceptance contract.

A pack composes domain methods; it does not move their ownership into Pactwright. For example, a pack can route a pricing question to a business research skill. That skill owns the pricing technique. The pack owns which role uses it and how the result reaches its consumer.

## 3. Agent Responsibility Contract

Each agent must make the following clear in its instructions:

- Its purpose and the results for which it is accountable.
- Its mapped capabilities, where applicable, and its roles within methods.
- The inputs and Production Skills it needs.
- The outputs it supplies and who uses them next.
- The checks it performs before handoff.
- Its authority limits and the conditions that require escalation.

The selected pack maps each required capability to one accountable agent. That agent can delegate bounded work to specialists. It remains responsible for integrating their results and returning the capability result. Delegation does not create another runtime capability mapping.

Role ownership does not grant decision authority. A coordinator cannot approve a Contract because it planned the work. A reviewer cannot close a Delivery because it recommends acceptance. Runtime policy and the owning operations determine who may act.

The pack must distinguish producing work, checking work and accepting work. A producer's self-check is useful but is not independent review. Where independent review is required, it uses a separate invocation in the review role. That invocation receives the governing requirements, delivered result and relevant evidence. It must reach its own assessment rather than adopt the producer's conclusion.

Review independence does not require a different provider or model unless the governing policy requires one. One public advisor may coordinate both production and review, but the pack must preserve the separate review invocation and report its actual result.

## 4. Method Contract

Each method offered by a pack must describe the following information. This is a content contract for instructions and supporting material, not a new manifest or stored-record schema.

| Element | Required meaning |
| --- | --- |
| Purpose and entry | The user goal it serves, when to use it and when another method is more suitable. |
| Owner and consumer | The accountable role and the person or role that needs the result. |
| Inputs | Required context, source provenance, governing records and missing-input handling. |
| Availability | Required skills, tools, Extensions and host facilities. |
| Approach | The smallest useful sequence, its decisions and any specialist delegation. |
| Outputs | Expected artefacts or results, their status and their destination. |
| Quality criteria | Observable checks that determine whether the result is useful to its consumer. |
| Authority and stops | Permitted actions, approval points, scope limits and blocking conditions. |
| Handoff and recovery | What the next actor receives and how interrupted or rejected work continues. |
| Evaluation | Cases that test the method's routing, conduct and result. |

Descriptions may share common instructions by reference. They must not repeat a full skill, governing specification or project history in every prompt. Load the context needed for the current method and follow relevant references when needed.

A method must state whether it supports interactive work, unattended work or both, as defined in section 8. These are interaction patterns, not new lifecycle policy values. If a required facility is unavailable, the agent must report the limitation and offer a supported path without weakening the method's authority or quality requirements.

Quality criteria must describe the result, not only the steps followed. Reading all inputs, producing a long report or completing every checklist item does not by itself prove that the consumer can use the output.

## 5. Entry, Routing and Advisory Work

The pack must help users choose a useful next action from their goal and current state. It must not require users to know internal agent names or the full method catalogue.

For governed work, routing guidance belongs in the selected agent's prompt and direct skills behind the existing adapter commands. `/capture-intent` remains the entry for a requested outcome that is to become a canonical Intent; it is not an advisory-only command. The other commands retain their Core sections 46–53 responsibilities.

Pre-Delivery advice requires a host surface that can invoke the pack's agent and skills without submitting a canonical responsibility result. The seven-command adapter contract does not define that entry surface. A [Distribution](./02-distribution-agent-packs-extensions-and-evaluation.md) amendment must specify its exposure; a [Checkpoint 1](../checkpoints/01-self-hosted-delivery.md) amendment must allocate its implementation and invocation proof. Until that surface is supported and verified, packs must describe pre-Delivery advice as unavailable on that adapter path. They must not repurpose `/capture-intent`, add a command implicitly or claim that ordinary conversation already invokes the resolved pack.

Routing must:

- Inspect available context before asking for information already present.
- Separate the requested outcome from assumptions about how to achieve it.
- Choose a method proportionate to scope, risk and uncertainty.
- Explain the expected result and any decision needed from the user.
- Offer only methods whose dependencies are available, or state the missing dependency.

A small correction may need one focused Delivery. A large or uncertain goal may need research, alternatives and several separately governed outcomes. Packs must not force a product requirements document, architecture exercise or fixed waterfall sequence onto every request.

Conversation, research, coaching and draft artefacts may precede governed Delivery. An advisor can explore a startup idea or critique a story without creating an Intent for each exchange. These outputs remain advice, research or drafts. They are not authorised Contracts, accepted Knowledge or permission for external actions.

When the user commits an outcome to governed Delivery, the pack uses the existing Intent, Decision, Contract and Brief responsibilities. The authorised Contract defines the outcome; the Brief defines the current fulfilment approach. Conversation agreement must not substitute for an operation's required approval.

Reusable expertise belongs in Production Skills. Project-specific material follows [Project Intelligence](./03-project-intelligence.md) when that Extension is enabled, including its distinction between Sources and accepted Knowledge. Without it, packs can use ordinary project artefacts but must not present them as accepted PI records. Basic pack use must not depend on PI.

## 6. Reference Method Families

The following families guide pack design. They are not mandatory runtime stages or a universal sequence. A pack selects and names the methods that serve its users, while satisfying its required capabilities.

| Family | Useful result and handoff |
| --- | --- |
| Explore and research | Sources, assumptions, uncertainties and options that support a named decision. Separate sourced facts from inference. |
| Plan larger work | Bounded outcomes, dependencies, risks and readiness conditions. Keep each governed outcome tied to its own Delivery records. |
| Work in an existing project | A focused account of current behaviour, conventions and constraints, with links to evidence. Distinguish observed behaviour from approved intent. |
| Build or produce a change | The result required by the active Brief, verification facts, remaining gaps and the next review target. |
| Review a change | An independent assessment against the Contract and Brief, with supported findings and a permitted corrective route. |
| Walk through a change | An explanation for its consumer: what changed, why, how to inspect or use it, and what remains uncertain. |
| Test completed work | Results from relevant checks or domain evaluations, with the tested target and limits stated. |
| Finish a group of work | Reconciled member outcomes, integration checks, unresolved work and lessons. Report each member's actual closure state. |
| Develop an Agent Pack | A reviewed candidate pack, evaluation results and an explicit adoption or maintenance decision. |

Planning can coordinate several Deliveries, but it must not create several current Briefs for one Contract or invent a second planning authority. Group plans and summaries use ordinary artefacts or records supported by their owning Extension. This specification adds no epic node, planning record or shared acceptance state.

Review, testing and walkthroughs serve different purposes. Tests provide verification facts. Review assesses fulfilment and defects. A walkthrough helps the consumer understand the result. None replaces the others when the Contract requires them.

Finishing a group must not hide an unclosed member behind an overall success label. Any shared outcome used for acceptance must be expressed in the authorised member Contracts or in a separately authorised integration Delivery's Contract. Its checks and Evidence follow those Contracts; an ordinary group summary cannot introduce acceptance criteria. A retrospective can propose future changes; it cannot rewrite historical Evidence or silently change the remaining Contracts.

Existing-project work should inspect only the context needed for the goal. Repository code, operational observations and old documentation can disagree. The method must expose that disagreement instead of treating whichever source it read first as canonical truth.

## 7. Delegation and Handoffs

Delegate when a specialist method, an independent assessment or separable work improves the result. More agents are not a quality criterion.

The parent agent must bound each assignment by its goal, inputs, permitted actions, expected output and completion checks. It must identify dependencies before parallel work starts. Parallel assignments must not write conflicting state. The parent remains accountable for checking and integrating delegated results.

Each handoff must give the receiver enough information to continue:

- The goal, governing Contract and Brief when applicable, and the target being handed over.
- Relevant artefacts, source references and available revision or environment identity.
- Work completed, checks actually run and their results.
- Assumptions, unresolved findings, blockers and approvals still needed.
- The receiving role and the next permitted action.

This information can be part of an existing artefact or invocation result. It does not require a new persistent handoff store. A conversation summary alone is insufficient when the receiver needs the delivered artefacts or verification output.

The receiver must check that the handoff applies to its current target. A changed target or missing governing input requires reconciliation before the result is used. Agents must respect the runtime's actual mutation and revision guards. [Core, sections 55–56](./01-pactwright-core-system-and-lifecycle.md) owns dispatch freshness and replay identity. Core's methodology amendment requires checks for configuration, lifecycle and lock changes across dispatch. Packs must not claim that guarantee until the runtime and checkpoint evidence demonstrate it.

Delivery Review remains distinct from [Graph Review](./04-graph-review.md). Specialist graph findings do not substitute for review of a delivered change or directly authorise canonical mutations.

## 8. Interactive and Unattended Work

Interactive work can request decisions as they arise. Unattended work can proceed only within authority, scope and limits established before execution.

These terms describe access to user interaction. Core section 27's `execution: manual|automatic` controls runtime dispatch: a `manual` responsibility is never dispatched automatically, while `automatic` permits dispatch subject to the governing policy. Interactive use does not require every responsibility to be `manual`, and unattended use does not convert a `manual` responsibility to `automatic`. An unattended run must stop when it reaches a required manual action.

A method that supports unattended work must state:

- Which bounded unit a worker may execute.
- How a coordinator proposes or selects the next unit within the governing policy.
- Which governing checks and reviews apply before a progression request, by reference to their owner.
- The applicable policy limits and any stricter local time, iteration or resource budget.
- How it reports policy stops, local blockers and the owning resume action.

The method operates within Core sections 26–27 and 34 and the governing execution policy. Policy takes precedence on conflict. A method may stop earlier or use a smaller local budget; it may not increase a policy limit, bypass a gate or define lifecycle transitions in prompt content. A method budget of five iterations cannot extend a policy limit of three. Unsupported policy controls must be reported as unavailable, not treated as runtime-enforced because a prompt mentions them.

The runtime owns legal Delivery transitions. For checkpoint execution, the harness/controller owns acceptance under [Spec 00](./00-checkpoint-step-contract-and-delivery-tasks.md). A coordinator's success statement, a worker's exit status, a passing local test or a pull request does not replace that acceptance.

Stop when authority is missing, a required decision is unresolved, a dependency is unavailable, work exceeds its scope or a configured limit is reached. Retain the last supported state and report the remaining work. A retry must not silently change the goal, weaken a check or edit an acceptance condition.

Resume against the current governed state and the recorded work target. Report what was preserved and what must be checked again. Do not infer acceptance from an interrupted worker's last message.

The pack describes behaviour, not a second execution engine. Scheduling, process supervision and provider/model selection stay with their existing owners. A pack must not advertise an autonomous loop unless its required host and controller facilities are available.

## 9. Toolsmith and the Agent Pack Lifecycle

Toolsmith is the role accountable for researching, designing, implementing, evaluating and maintaining Agent Packs. `@pactwright/standard` is the reference pack and must provide this role when its methodology implementation is delivered. The initial direct-skill implementation belongs in a [Checkpoint 1](../checkpoints/01-self-hosted-delivery.md) amendment. External Production Skills integration and specialist-pack proof belong in a [Checkpoint 5](../checkpoints/05-production-skills-and-assets-publication.md) amendment. Other packs may provide the role when relevant to their users.

Toolsmith is not a new core capability. Pack-authoring work under governed Delivery uses the existing specification, execution and review capabilities. Toolsmith may coordinate specialist contributions, but capability accountability and independent review remain as defined in section 3.

### Authoring responsibilities

Toolsmith must cover the following lifecycle, scaled to the change:

1. **Research the need.** Identify users, decisions, recurring work, available skills and evidence of current failures. Assess relevant external methods without treating them as Pactwright authority.
2. **Design the pack.** Define roles, capability mappings, method contracts, context needs, handoffs and authority limits. Reuse Production Skills before adding duplicate expertise.
3. **Implement the candidate.** Create or change pack prompts, direct skills, composition and supporting examples. Keep reusable domain logic with its owning Production Skills family.
4. **Exercise and review it.** Try representative work, blocked paths and misuse cases. Obtain an independent assessment where required. Inspect actual artefacts and consumer usability, not only prompt wording.
5. **Evaluate and prepare adoption.** Validate compatibility and compare the candidate with a relevant released baseline when one exists. Otherwise, report initial case results without a comparison. Report regressions, missing checks and the exact candidate identity. An accepted release can establish the baseline for later candidates.
6. **Maintain it.** Investigate failures, assess upstream changes, update affected methods and evaluation cases, and document compatibility or migration needs.

For each material change, Toolsmith must connect the observed need to the changed instructions and the checks used to assess the result. Routine evaluation reports remain artefacts, not canonical project truth.

### Bootstrap and adoption

Toolsmith uses the currently selected complete pack to develop a candidate in its source workspace. It does not need the unfinished candidate to be active before it can author or test it.

Candidate evaluation does not select that pack for a consumer project. Adoption uses the explicit selection or upgrade path in [Distribution, sections 5 and 12–15](./02-distribution-agent-packs-extensions-and-evaluation.md). The project still has one selected complete Agent Pack.

Toolsmith must not silently replace installed pack content, generated adapters or the active environment while a worker continues under the old assumptions. A required environment change follows the owning operation and a deliberate handoff or restart. This requirement does not add runtime guards beyond those in section 7.

Toolsmith owns the preparation and maintenance work, not automatic release approval. Candidate promotion must satisfy the applicable policy and evaluation requirements.

### Learning and correction

Route a problem to its owner:

- A delivery defect follows the existing review and correction route.
- A changed fulfilment approach follows Brief revision rules.
- A changed authorised outcome follows Decision and Contract revision rules.
- Project-specific learning follows PI when enabled.
- Reusable domain expertise belongs in Production Skills.
- A role, routing or coordination defect becomes a candidate Agent Pack change.

Do not treat learning as permission to change active policy or rewrite accepted history. [Core, sections 24 and 44–45](./01-pactwright-core-system-and-lifecycle.md) governs Delivery lineage.

## 10. Quality and Evaluation

Pack evaluation must test conduct and useful results, not only file structure or prompt style. Cases must cover the behaviours the pack claims to support, including:

- Correct method selection, including similar requests for which the method should not run.
- Missing inputs, unavailable skills and unsupported interactive or unattended work.
- Authority limits, scope discipline and truthful output status.
- Specialist handoffs and independent review.
- Corrections, interruption, resumption and exhausted limits.
- Results that a consumer can inspect and use without hidden conversational context.

A valid manifest proves structural compatibility, not behavioural or domain quality. Pactwright and pack cases test responsibility fulfilment and coordination. Production Skills own domain benchmarks. Do not run a whole external benchmark suite implicitly or present its domain scores as Pactwright acceptance.

These are coverage requirements, not a new runtime case format. For now, pack-owned cases are versioned test instructions or tests in the pack's source workspace. They identify the candidate, entry surface, inputs, expected result and observed result. They run through an explicitly supported test path; merely listing them does not establish execution.

Distribution section 5 declares no evaluation cases in the recognised manifest. Section 24's `pactwright eval --baseline --candidate` uses the running runtime's case set; it does not discover these pack-owned cases. Any later case declaration, discovery and runner contract requires a [Distribution](./02-distribution-agent-packs-extensions-and-evaluation.md) amendment. Until that support exists, reports must distinguish runtime CLI results from separately executed pack-method cases and identify missing coverage.

Capability-backed cases in the runtime case set use the actual candidate through the invocation and judgement interfaces defined by [Distribution, sections 21–24](./02-distribution-agent-packs-extensions-and-evaluation.md). Advisory methods and other pack-owned cases use a documented test path supplied by their owning pack or Production Skills, with the actual candidate. A case without a supported entry or test path is **not evaluated** and cannot support a claim that the method is available. This does not add a Pactwright runtime invocation interface.

Reports identify the resolved components, invoker, judge and cases that ran. Record the actual model and effort when the host exposes them; otherwise state that they are unavailable rather than guess. For checkpoint runs, Spec 00 requires model and effort to be resolved before dispatch. Reporting them as unavailable does not permit execution.

Without an invoker, behaviour-dependent results are **not evaluated**. Without a judge, semantic results are **unjudged**. Scripted stand-ins cannot count as the candidate's behaviour. A successful comparison exit status does not prove that unevaluated behaviour passed; the owning specification defines result and exit-status semantics.

Report regressions by affected capability, agent and case. Keep deterministic failures separate from semantic judgements and missing checks. Do not use one aggregate score as release approval.

## 11. Cross-Domain Examples

These are design examples, not claims that the packs or integrations are available.

### Software delivery

A software pack routes a small defect to a focused change method. A larger feature may first need research, design alternatives and dependency planning. It composes engineering, interface design or security skills as needed.

The execution agent produces the change and verification facts. A separate review invocation assesses the delivered target. The walkthrough explains the change to its consumer. Runtime operations retain Delivery and Evidence authority.

### Founder advice

A founder-advisor pack may present one advisor, such as Nadia, while composing business research, pricing and fundraising skills. The advisor can coach an uncertain founder before any governed Delivery begins.

A committed pricing study can use a Contract covering research scope, assumptions, calculations and decision criteria. The pack produces the study, obtains the required review and presents the options to the founder. This can prove fulfilment of the study's Contract; it cannot prove future revenue or fundraising success.

The pack must still satisfy all required capabilities. One visible advisor does not remove review separation or grant permission to contact investors, spend money or publish material.

### Creative production

A creative pack can compose research, narrative, design and production skills. Its methods may move from a creative brief through drafts, critique and final artefacts without adopting software-specific stages.

The Contract defines the commissioned outcome and quality criteria. Domain skills supply the production and evaluation techniques. Delivery closure does not itself approve an Asset or publish it; [Assets and Publication](./05-assets-and-publication.md) owns those semantics. Real-world performance belongs to [Operations](./06-operations.md), not a predicted outcome in the final report.

## 12. Compatibility and Design References

This contract does not add `pack.yml` keys, capability identifiers, adapter commands, graph nodes or runtime workflow schemas. The recognised formats and interfaces remain those in Core and Distribution. Method descriptions use supported prompt, skill and documentation content.

Direct skills can support a pack without external imports. A pack that needs external Production Skills must use a release that supports their resolution. Unsupported imports must not be ignored or described as active. A complete specialist pack remains an alternative selected pack, not a partial overlay onto another active pack.

`@pactwright/standard` is the reference implementation target for this contract. It is not a special runtime identity, and other packs need not copy its persona names or role count. Repository packaging, documentation and examples remain owned by [Open-Source Project Organisation](./08-open-source-project-organisation.md).

The following BMAD material informs the design but does not define Pactwright behaviour:

- [Build a change](https://docs.bmad-method.org/build/build-a-change/), [review a change](https://docs.bmad-method.org/build/review-a-change/), [walk through a change](https://docs.bmad-method.org/build/walk-through-a-change/) and [test completed work](https://docs.bmad-method.org/build/test-completed-work/).
- [Finish an epic](https://docs.bmad-method.org/build/finish-an-epic/) and [autonomous development loops](https://docs.bmad-method.org/build/autonomous-development-loops/).
- [Choose a planning path](https://docs.bmad-method.org/plan/choose-a-planning-path/) and [start in an existing codebase](https://docs.bmad-method.org/existing-codebases/start-in-an-existing-codebase/).
- [Toolsmith](https://docs.bmad-method.org/toolsmith/toolsmith/), the [Founder Advisor source](https://github.com/bmad-code-org/BMAD-METHOD/blob/e435a22574fe55722841086e5566420178b98df3/skills/founder/bmad-founder-agent-advisor/SKILL.md) and [Creative Intelligence Suite documentation](https://cis-docs.bmad-method.org/).

---

**Pactwright Agent Methodology and Workflows v2**
