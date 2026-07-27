# Operations Graph — Closing the Loop to Production (v5)

> **Scope.** This spec defines the **Operations Graph**: the third checkpoint of the one project graph, recording observed operational reality — customer impact, production behaviour, operational decisions, evidence, remediation, and learning — and feeding that reality back into the Project Intelligence Graph. The software delivery graph (checkpoint 1) and the intelligence graph with its ingestion engine (checkpoint 2) are consumed and extended here, not redefined. **This graph's subject is the product being built — its environments, releases, incidents, and users — not the tooling that builds it**: the delivery machinery monitors itself inside its own spec, and appears here only through what it ships. The spec is generic throughout; material specific to any one project appears only in the worked examples (§19). Sections 21–26 are the normative contracts — artifact catalogue, lifecycles, edge registry, signal ledger, write protocol, reconciliation and data policy — that make the architecture executable.

## 1. Purpose

The Project Intelligence Graph records **intended truth**: what the project knows, has decided, and means to build. The delivery graph records how that intent becomes shipped software. Neither records what happens next — when the software meets users, infrastructure, data, partners, and production conditions. The Operations Graph records that **observed truth**: support tickets, incidents, bugs, data corrections, alerts, workflow failures, provider outages, known issues, runbooks, postmortems, prevention actions.

The core rule that binds the two truths:

> The Project Intelligence Graph records intended truth. The Operations Graph records observed truth. When observed truth contradicts intended truth, the system creates an explicit finding and routes it — through ingestion, under human approval — into product, specification, testing, monitoring, runbook, or architectural work. Intended truth is never silently edited to match reality, and reality is never silently ignored to protect intent.

The loop this closes: knowledge grounds intents, intents become delivered software, delivered software produces operational reality, and operational reality returns as knowledge (§14). A project running all three checkpoints can trace a customer's ticket to the log cluster that evidenced it, the bug it confirmed, the fix that resolved it, the release that shipped the fix, the specification the bug violated, and the knowledge and sources that specification rests on — one graph, walked end to end.

## 2. One graph, three checkpoints

The three graphs are not three systems. They are three **checkpoints** in the maturity of one file-based, typed-edge graph, sharing the same edge table, the same sole-writer maintainer, the same propose-only discipline, and the same human governance:

| Checkpoint | Graph | Records | Status |
|---|---|---|---|
| **1** | Software delivery graph | Intents, contracts, briefs, patches, evidence, releases, drift, governance — how work becomes shipped software | Almost complete |
| **2** | Project intelligence graph | Sources, claims, knowledge cards, domains, specifications, decisions — what the project knows and intends | Specified; implementation not yet started |
| **3** | Operations graph | Signals, operational items, evidence references, investigations, responses, learning — what actually happens in production | This document |

Checkpoint 3 depends on both predecessors: it attributes observed behaviour to the change events checkpoint 1 produces (§3), and it writes its learning back through the ingestion engine checkpoint 2 defines (§14). Where checkpoint 2 is not yet running, operational records can still accumulate — incidents, corrections, and runbooks are valuable on their own — but the loop only closes once ingestion exists to receive them.

## 3. How deliverables reach production

The Operations Graph can only attribute observed behaviour to delivered change if every production change is a recorded event. This section fixes those anchors.

**Most software ships as code.** A cycle takes an intent through contract, brief, patch, and evidence to a **Release**; a **Deployment** puts a release into an environment. Deployments are recorded change events carrying the release (and thereby the patches, and thereby the intent) that produced them. Rollout is typically progressive — canary in the general sense: a small fraction of real traffic first, widening only while the evidence stays clean, halting automatically on regression, the concrete ladder being the project's own — and each stage, halt, and completion is an event.

**Some production change is not a deploy.** **Feature-flag changes** and **configuration changes** alter behaviour without shipping code; they are recorded change events of the same rank as deployments.

**Some deliverables are not code.** Whatever the project builds, some of its deliverables change production behaviour without a code deploy — configuration the running system consults, thresholds that gate behaviour, templates and rules that shape output. The category is defined by its **effect**, not by artifact type: production behaves differently after the change, so the change must be exactly as accountable as a deploy. That is the principle the instances only illustrate — an AI product's prompts and model-routing configuration, a commerce product's pricing rules and feature flags, a content platform's layout templates are all the same kind of thing to this graph. Non-code deliverables therefore ship with the same discipline as code: versioned artifacts, releases that map a version to an environment, progressive exposure where the project's rollout process supports it, and rollback as the reversal (§13). Every such release and rollback is a recorded change event. *Which* non-code deliverables a project has is a fact about that project — named as knowledge in the domain that owns each one, with §19 walking one project's set end to end.

**Published content closes its own loop.** Content and campaigns reach production through their own channels; their results return to the intelligence graph as digest feeds, as the ingestion spec defines. The Operations Graph does not model them beyond the workflows that produce them.

The anchoring rule: **every production change event links to the release, version, flag, or configuration that caused it.** These anchors are what give `introduced_by` and `caused_by` (§10) something to point at — without them, attribution is folklore.

## 4. Core thesis and governing principles

Operations is **evidence-routed response and learning against delivered software**: signals are classified against what is already known, impact decides ceremony, response precedes explanation when impact demands it, explanations are earned from evidence, and everything significant resolves into durable knowledge, a verified corrective action, or an explicit accepted-risk decision.

The governing principles:

1. **Observed truth is recorded, not inferred.** Every operational claim traces to evidence — a log cluster, a trace, a metric, a reconciliation, a customer artifact. Raw telemetry stays in its source systems; the graph stores durable references, grouped findings, and links (§9).
2. **One intake path; ceremony scales with impact.** Every signal — ticket, alert, anomaly, workflow failure, correction request — passes one classification gate (§8), and the process it triggers scales with severity, exactly as ingestion scales with impact class and delivery scales with work class.
3. **Respond before explaining when impact demands it.** Mitigation (rollback, flag change, workaround) is legitimate before root cause is known; containment and explanation are separate obligations with separate clocks (§12).
4. **Root cause is earned, not asserted.** Hypotheses carry supporting and contradicting evidence; a root cause is confirmed only when the evidence suffices and a named accountable owner confirms it (§11). Agents propose; they never declare.
5. **Production and data changes are human-gated in proportion to risk.** No agent executes a high-risk correction, rollback, billing, or entitlement change without the applicable human approval (§16).
6. **Every significant event resolves.** Into durable knowledge, a verified corrective action, or an explicit accepted-risk decision — never into silence (§14).
7. **Learning crosses into intended truth only through ingestion.** Gap findings, product insights, and postmortem conclusions are emitted as internal sources into the intelligence graph's triage, where the standard promotion gates and cascade apply. The Operations Graph never edits a specification, decision, or intent directly.

## 5. Design goals

The Operations Graph must:

- Record observed operational reality as **first-class graph state**: signals, operational items, evidence references, context, investigations, responses, and learning, in the same file-based, typed-edge model as the other checkpoints.
- Provide a single **intake gate** that deduplicates, links known issues, classifies, and routes every signal by severity and kind (§8).
- Keep **raw telemetry in source systems** and model only durable references, recurring signatures, representative samples, and confirmed findings (§9).
- Attribute observed behaviour to **recorded change events** — deployments, flag and config changes, non-code releases (§3, §13).
- Separate **internal defects from dependency failures**, making external-provider risk visible (§9).
- Enforce the **investigation discipline**: hypotheses with evidence for and against, root cause confirmed only by evidence plus a named owner (§11).
- Support the full **response vocabulary** — mitigation, workaround, data correction, fix, runbook update, product change intent — each validated after execution (§12).
- Make **data correction** a governed operation with scope, evidence, approval, validation, reversal, and audit — never a bare database update (§9).
- Operate **non-code deliverables** with the same rigor as code: versioned releases, exposure experiments, quality telemetry, and rollbacks as recorded events and signals (§13).
- Turn operational events into **learning that flows back**: gap findings and insights emitted as internal sources into the ingestion engine, with durable operational knowledge — runbooks, known issues, monitoring standards — promoted into the intelligence graph under an `operations` domain (§14).
- Keep humans in control of every high-risk action through explicit, auditable control points (§16).
- Stay **GitHub-native**: repository files, the shared edge table, Actions, pull requests, CODEOWNERS, Projects, and Claude Code — no custom incident platform, service, queue, or database (§17–§18).

## 6. Non-goals

- It does not replace observability tooling, pagers, or helpdesk systems. Telemetry, paging, and customer conversations live where they live; the graph holds references, findings, and the durable record (§9).
- It does not model every log line, trace, or metric point as a node. The evidence rule (§9) is a filter, not a suggestion.
- It does not let agents execute high-risk actions. Agents classify, link, investigate, draft, and propose; humans approve and execute per the control table (§16).
- It does not confirm root causes statistically. Correlation proposes; evidence plus a named owner confirms (§11).
- It does not edit intended truth. Specification, test, monitoring, runbook, and product-model changes route through ingestion and its human gates (§14, principle 7).
- It does not run before its anchors exist. Without recorded change events (§3), attribution edges would be guesses; the graph refuses folklore.

## 7. The operational funnel

Every operational record lives in one of five layers, and work flows through them left to right:

| Layer | Holds | Produces |
|---|---|---|
| **Signals** | Support tickets, alerts, metric anomalies, log clusters, trace samples, analytics cohorts, workflow failures, data-correction requests | Symptoms and candidate items, via intake (§8) |
| **Context** | Customers/tenants, user workflows, services/components, external providers, deployments, flags and configs, the specifications and invariants the workflows implement | The frame every item is assessed in |
| **Investigation** | Operational items, impact assessments, hypotheses, root causes, known-issue matches | Confirmed explanations and scoped impact (§11) |
| **Response** | Mitigations, workarounds, data corrections, fixes, rollbacks and config changes, runbook updates | Contained impact and durable resolution (§12) |
| **Learning** | Postmortems, prevention actions, gap findings, product insights | Internal sources into the intelligence graph; durable operational knowledge (§14) |

A signal becomes a symptom; a symptom joins or opens an operational item; the item is assessed in context, investigated to a confirmed cause where warranted, answered with the right response, and closed into learning. Nothing significant exits the funnel sideways.

## 8. Intake: classification, severity, and routing

Intake is the operational front door — the analogue of ingestion's triage gate. For every signal it computes, and records on an **Intake Record**:

- **Identity / dedup** — is this a duplicate of an active item? Duplicates link (`duplicates`) and stop; the duplicate count is itself evidence of breadth.
- **Known-issue match** — does an accepted Known Issue explain it? If so, link, apply the approved workaround, and count the occurrence (§14).
- **Classification and routing** — what kind of thing is this, and what does it open? Classification is **multi-valued**: one signal may confirm a bug, contribute to a live incident, require a data correction, and reveal a monitoring gap at once — each classification routes, every created artifact links back to the originating signal, and the table below names the *default primary* object, not the only one. **Security, privacy, and abuse** are classifications, not new lifecycles: they attach restricted-evidence handling, limited access, communication controls, and notification obligations (§26) to the ordinary funnel.

| Classification | Primary object | Default action |
|---|---|---|
| User confusion | Support ticket | Explain; improve copy or documentation if recurring |
| Known issue | Known issue link | Apply approved workaround; count occurrence |
| Confirmed defect | Bug | Prioritise and implement a fix |
| Material production impact | Incident | Mitigate, communicate, investigate |
| Incorrect state | Data correction | Scope, approve, execute, validate |
| Provider failure | Provider issue or incident | Mitigate, escalate, assess fallback |
| Repeated product friction | Product insight | Route a change intent into the intelligence graph (§14) |
| Alert without user impact | Operational finding | Investigate, tune, or improve monitoring |
| Support detected before telemetry | Monitoring gap | Improve alerting or dashboards (§14) |

- **Severity** — how much ceremony the item gets. Severity is the operations analogue of impact class, and like it, scales process rather than importance-signalling:

| Severity | Meaning | Ceremony |
|---|---|---|
| **S0 — Routine** | Single-user confusion, known-issue occurrence, tunable alert | Handled at intake; linked and logged, no investigation opened |
| **S1 — Degradation** | Confirmed defect or friction without material live impact | Standard investigation and response, asynchronous |
| **S2 — Material impact** | Live impact on customers, data, or commitments | Expedited: incident opened, owner named, impact assessed, communication started |
| **S3 — Critical** | Broad or severe impact, data integrity at risk, contractual or regulatory exposure | Paged: incident command, mandatory postmortem, expedited everything |

Severity may rise as evidence lands; every revision is recorded with rationale. **Recurrence has its own escalation**: a project-declared recurrence policy (occurrence rate, distinct customers, workflow importance, workaround failure rate, duration, contractual exposure — the thresholds are project facts, the mechanism is not) turns accumulating S0 occurrences into a **recurrence finding** that forces an explicit disposition (INV-OPS-04), so a hundred routine occurrences cannot stay routine by never individually qualifying. Classification and severity are orthogonal, exactly as domain and class are in ingestion: one says what kind, the other says how much process.

## 9. Node and link types

The Operations Graph extends the same file-based, typed-edge graph as the other checkpoints, adding operational node types and relations (§10). It links freely into checkpoint 1's vocabulary (Intents, Contracts, Briefs, Patches, Evidence, Releases, Decisions) and checkpoint 2's (Sources, Knowledge Cards, Triage Records); Deployments and the other change events of §3 are this graph's own nodes, each anchored to the checkpoint-1 Release it put into an environment. Checkpoint 1's post-deploy loop — `release → post-deploy-finding → follow-up intent` — is the seam this graph deepens, not a parallel path: the finding's evidence, investigation, and owner-confirmed cause live here, and the intent that re-enters delivery cites the operational record. Operational records carry the intelligence graph's `domain` field where learning will route — an infrastructure incident tags `delivery/eng`, repeated user friction tags `product` or `discovery`, and a regression in any deliverable tags the domain that owns it, whether core or project-registered — so the write-back (§14) reaches the right steward.

**Signals and evidence.** Raw telemetry stays in source systems; these nodes are durable references and groupings:

| Node | Represents | Typical use |
|---|---|---|
| Alert | Automated threshold or anomaly trigger | Detection and escalation |
| Metric anomaly | Meaningful departure from baseline | Impact and regression analysis |
| Log cluster | Repeating error or behavioural signature | Diagnosis and recurrence detection |
| Trace sample | Representative distributed request path | Cross-service root-cause analysis |
| Workflow failure | Failed import, job, sync, payment, export, or scheduled run | Operational state and repair scope |
| Analytics cohort | Behavioural pattern across users | Product friction and product drift |
| Reconciliation result | Comparison between expected and observed data state | Data integrity and correction validation |
| Customer evidence | Screenshots, examples, identifiers, messages | Support diagnosis and verification |

The **evidence rule**: create nodes only for recurring signatures, representative samples, anomalies, confirmed evidence sets, customer-impacting findings, and reusable operational knowledge — never for every log line, trace, or metric point.

**Context.** The frame items are assessed in:

| Node | Key content |
|---|---|
| Customer / Tenant | Plan or contract, segment, SLA, region, feature access, integration configuration, incident exposure history; sensitive detail stays in source systems, the graph carries identifiers and impact context |
| User workflow | The bridge between technology and product reality — `specified_by` a Specification, `implemented_by` services, `measured_by` metrics, `covered_by` tests; the unit impact is expressed in |
| Service / Component | Emits telemetry, `changed_by` deployments, `owned_by` a team, `implements` workflows and specifications, `depends_on` providers and services |
| External provider | `serves` workflows, `returns` error patterns, `causes` incidents and data-quality issues, `constrained_by` an integration contract — separating internal defects from dependency failures and making provider risk visible |
| Deployment / Flag / Config change / Non-code release | The recorded change events of §3; the anchors of attribution |

**Operational items.** The unit of managed work:

| Node | Definition | Key fields |
|---|---|---|
| Support ticket | A report from a customer, partner, or internal user | Reported symptom, customer/tenant, affected workflow, user impact, customer-perspective severity, supplied evidence, duplicates, status, final outcome |
| Incident | A time-bounded production event with material impact | Severity; start, detection, mitigation, and resolution times; owner; affected workflows, customers, regions; customer, operational, and commercial impact; timeline; mitigations; root-cause status; follow-ups |
| Bug | A confirmed discrepancy between expected and actual behaviour | Expected vs actual, affected workflow and users, reproduction path, evidence, suspected or confirmed source, linked specification, linked regression test, fix status |
| Data correction | A governed repair of incorrect, duplicated, incomplete, or inconsistent state | Scope of affected records, reason, evidenced current state, intended state, proposed transformation, validation plan, reversal plan, approval, execution record, audit evidence, customer-notification status, prevention action |
| Known issue (candidate) | An accepted, explained condition with an approved workaround | Explanation, workaround, `occurrence_count`, `affected_entity_count`, `independent_evidence_count`, `workaround_success_count` / `_failure_count`, `first_observed_at` / `last_observed_at`, affected workflows, resolution intent — prevalence and evidential corroboration are separate numbers (§14) |

The **data-correction rule**: a data correction is never merely a database update. It has explicit scope, evidence of current state, an intended state, approval proportional to risk, validation after execution, a reversal strategy where feasible, and an immutable audit trail — every element a required field, not a custom.

**Investigation and response.** Hypotheses, root causes, and impact assessments (§11); mitigations, workarounds, fixes, rollbacks, operational communications, and runbook drafts (§12).

**Promotion provenance — candidates here, canon in the intelligence graph.** Runbooks and known issues live in *two* records with one canonical: operations authors a **RunbookDraft** or **KnownIssueCandidate** (immutable operational provenance, listed above); it is emitted as an internal source; ingestion evaluates it; promotion creates or updates the canonical Knowledge Card under `knowledge/operations/`; the candidate gains a `promoted_as` edge to the card. Future occurrences and uses link to the **canonical card**; historical items keep their links to the draft; when the card is superseded, the cascade reaches the operational records citing it. The candidate never becomes the card and the card never rewrites the candidate — provenance and canon, cleanly split (§14).

**Learning.** Postmortems, prevention actions, gap findings (specification, test, monitoring, runbook, product-model, data-model, dependency, eval), and product insights — the layer that becomes internal sources (§14).

## 10. Relationship vocabulary

Operations adds relations to the shared edge table under the delivery system's discipline — stable names, one meaning each, a new relation only when existing vocabulary cannot express it — and the **normative edge registry (§23)** is the single authority: canonical name, direction, permitted types, cardinality, meaning, confirmation requirement, and whether an agent may propose it. No edge exists outside the registry; prose elsewhere in this spec uses registry names only. Two rules preview it: `violates` points at checkpoint 2's specification invariants — the edge that turns an incident into a drift finding — and **causal edges are graded** (§23): a recent deployment can be `observed_after` or `suspected_introduced_by` an item, but `introduced_by` and `caused_by` exist only once confirmed under the root-cause rule (§11).

## 11. Investigation model

Investigation is the disciplined path from symptom to confirmed cause:

1. **Gather evidence** — the evidence linker connects the item to logs, traces, metrics, recent deployments, flags, configs, prior tickets, known issues, and customer history.
2. **Hypothesise** — each hypothesis is a node stating its claim, confidence, evidence for (`supported_by`), evidence against (`contradicted_by`), owner, and next validation step.
3. **Validate or reject** — hypotheses are tested against evidence until one is `confirmed_as` a root cause or all are `rejected_by` the investigation, in which case evidence-gathering resumes.
4. **Assess impact** — affected customers, workflows, financial and SLA exposure, compliance and trust impact, escalation recommendation.

The **root-cause rule**: agents may propose and compare hypotheses, but a root cause is confirmed only when the graph contains sufficient supporting evidence **and** a named accountable owner confirms it. This is the operations rhyme of ingestion's trust-and-corroboration gate: correlation may open an explanation, only evidence plus accountability may close one.

## 12. Response model

Response and explanation run on separate clocks: when impact is live, containment comes first.

| Response | What it is | Examples |
|---|---|---|
| **Mitigation** | Temporary reduction of live impact | Roll back a deployment, disable a flag, route to a fallback, pause a job, replay a failed workflow, apply an approved workaround, rate-limit a failing integration |
| **Workaround** | An approved user-facing path around a known issue | Documented on the Known Issue and applied at intake |
| **Data correction** | Governed state repair (§9) | Scoped, approved, executed, validated, reversible, audited |
| **Fix** | Permanent behavioural or technical change | `implemented_by` a pull request, `deployed_in` a release, `validated_by` a test, metric, or customer confirmation — a normal delivery cycle, expedited by severity |
| **Runbook update** | Improved operating procedure | Routed as knowledge (§14) |
| **Operational communication** | A customer- or stakeholder-facing message about an item | First-class artifact: audience, channel, approved facts only, author, approver, sent time, next-update commitment, correction/retraction links (§21) — commitments and claims carry provenance |
| **Product change intent** | The system behaves as designed, but users repeatedly experience avoidable friction | A Product Insight, `supported_by` cohorts and ticket clusters, routed into the intelligence graph as an internal source that proposes a change intent (§14) |

Two closing obligations apply to every response: it is **validated** after execution (`validated_by`), and its item resolves into learning (§14). A fix is not done when merged; it is done when observed working.

Note the loop through checkpoint 1: a Fix travels intent → brief → patch → release like any other work, and its Deployment is a new change event the Operations Graph observes — response is not outside delivery, it is delivery at operational tempo.

## 13. Operating non-code deliverables

Some deliverables alter runtime behaviour without shipping code — the configuration, thresholds, templates, and rules the running system consults (§3's definition by effect). Published content is the other non-code kind, closing its loop through feeds (§3). These deliverables are operated with the same rigor as code; *which* of them a project has, and the concrete practice around each, are facts about the project — defined as knowledge in the domain that owns the deliverable and instantiated in its own tooling.

**Change events.** A non-code deliverable ships as a **versioned artifact**: versions are immutable, a **release** maps a version to an environment, exposure is progressive where the project's rollout process supports it (experiments, staged traffic), and **rollback** re-points to the previous version. Every release, exposure change, halt, and rollback is a recorded change event of the same rank as a deployment (§3) — no version reaches production outside one.

**Signals.** Where the project verifies these deliverables continuously — evaluation suites, quality checks, scorecards — the scores arrive as a feed, and a regression is a metric anomaly like any other. Behavioural drift in outputs arrives as analytics cohorts; cost and latency anomalies arrive as metrics; halts arrive as alerts. Signals that belong to a specific intelligence-graph domain file toward it — voice or sentiment drift toward `identity`, for instance — exactly as the ingestion spec anticipates.

**Responses.** Rollback is the canonical mitigation, recorded and linked to its trigger. A repaired deliverable is a new immutable version shipped through a new release — a normal expedited cycle, with whatever verification gates and rollout policy the owning domain's knowledge attaches to its brief.

**Learning.** A regression that escaped the deliverable's verification suite is **eval drift** — the non-code sibling of test drift (§14) — and produces a coverage-gap finding. Durable release and rollback procedures are runbooks under the `operations` domain; the observed record of every release and regression stays here, as evidence the next investigation can walk.

**The split of truth**, restated for these deliverables: the versioning strategy, verification design, and rollout policy are *intended* truth — intelligence-graph knowledge in the domain that owns the deliverable. This release, this regression, this rollback are *observed* truth — records here. The procedures for operating them safely are `operations` knowledge (§14). One project's instantiation of all of this appears in §19.

## 14. The learning seam: drift, gaps, and write-back through ingestion

Every significant operational event ends in an operational review asking one question: **what was missing?** The answers are typed:

| Drift type | Evidence | Meaning | Required response |
|---|---|---|---|
| Specification drift | Production behaviour contradicts an invariant | Intended behaviour is wrong, incomplete, or ambiguous | Update the specification and create a test |
| Test drift | A real failure escaped coverage | Verification did not represent operational reality | Add regression, integration, or contract coverage |
| Eval drift | A regression in a non-code deliverable escaped its verification suite | Evaluation coverage does not represent production behaviour | Add evaluation cases; adjust gates (§13) |
| Monitoring drift | Users reported before systems detected | Detection is inadequate | Add alert, dashboard, SLO, or anomaly rule |
| Runbook drift | The documented response did not work safely | Operational knowledge is stale | Update and re-validate the procedure |
| Product drift | Repeated workarounds, abandonment, or confusion | The product model does not fit real usage | Create a product intent |
| Data-model drift | Repeated state corrections | Data invariants or repair capability are inadequate | Improve validation, migration, or correction tooling |
| Dependency drift | Provider behaviour changed externally | Integration assumptions are stale | Update contract, fallback, monitoring, and communication |

**Ingestion receives learning, not raw signals.** Raw operational events — tickets, alerts, incidents, corrections — never reach the intelligence graph's triage directly. They pass through this graph's funnel first: intake classifies them, investigation earns their explanations, response resolves them, and only the **learning layer's output** crosses the seam. The operational funnel is thereby the intelligence graph's pre-processor for observed reality: what arrives at triage is deduplicated, evidence-linked, and — where a root cause exists — confirmed by a named owner, so ingestion's trust model can rate it on the evidence it carries rather than re-deriving it.

**The seam is ingestion.** Each gap finding, product insight, and postmortem conclusion is **auto-captured as an internal source** into the intelligence graph's `sources/internal/` and routed through its triage gate — typically class 2 (a new conclusion) or class 3 (it contradicts accepted knowledge or a specification, in which case the cascade flags every dependent). Promotion, spec amendment, and intent creation then follow the standard human gates. This realizes principle 7: operations proposes into intended truth; it never edits it.

**Durable operational knowledge gets a domain.** This extension registers **`operations`** in the intelligence graph's domain registry — one reviewed pull request, exactly the registry's standard extension path — with the following definition:

| Domain | What it holds | Canonical artifact types | Default review horizon |
|---|---|---|---|
| `operations` | How the project runs in production | Runbooks, known issues, monitoring and alerting standards, SLOs, incident-response process, postmortem learnings | 1 quarter, refreshed by validated use |

The Domain Definition carries the rest of the registry's standard fields: the operations steward owns `knowledge/operations/` through CODEOWNERS; the trust exemplar is an operational finding carrying its evidence trail and an owner-confirmed root cause; and the brief recipe attaches monitoring and alerting standards as standing `constrains` on any brief that ships production behaviour, with the relevant runbooks linked into operational work.

Use is corroboration in this domain: a runbook that carries an incident successfully is refreshed by that use as a corroborating internal source; one that fails in use is contradicted by it — runbook drift arriving as a class-3 challenge, not a stale page nobody rereads. A known issue is likewise a knowledge card — but **occurrence is prevalence, not corroboration**: every deduplicated ticket raises `occurrence_count` and establishes how widespread the condition is, while the card’s *evidential* confidence moves only on independent evidence — a workaround succeeding or failing in distinct contexts, a reproduced diagnosis, an owner-confirmed cause. The fields stay separate (§9) so a thousand tickets cannot make a wrong explanation look well-evidenced.

## 15. Operational invariants

- **INV-OPS-01** — Every incident has an impact assessment, a named owner, a timeline, and a resolution state.
- **INV-OPS-02** — Every confirmed bug links expected behaviour, actual behaviour, the affected workflow, evidence, and a resolution path.
- **INV-OPS-03** — Every data correction has scope, approval, execution evidence, validation, and a recorded outcome.
- **INV-OPS-04** — Every recurring support pattern resolves into a known issue, a bug, a product insight, or an explicit decision to accept the behaviour.
- **INV-OPS-05** — Every significant operational event is assessed for specification, test, eval, monitoring, runbook, and product-model gaps.
- **INV-OPS-06** — Raw telemetry remains in source systems; the graph stores references, clusters, and reusable findings.
- **INV-OPS-07** — No agent executes a high-risk data correction, production rollback, billing change, or entitlement change without the applicable human approval.
- **INV-OPS-08** — When operational reality must change intended truth, the change travels as an internal source through ingestion, leaving an explicit link between the operational item and the knowledge, specification, or intent it changed.
- **INV-OPS-09** — Every production change — deployment, flag, configuration, or non-code release — is a recorded event linked to the version that caused it; no unrecorded change reaches production.

Invariants are enforced as checks in the same progressive, override-able style as the other checkpoints: a check blocks only once its artifact is produced consistently, and every blocking check supports an override node with a recorded reason.

## 16. Human control points

| Action | Human approval |
|---|---|
| Classify a low-risk ticket | Not required |
| Link duplicate tickets | Not required |
| Create a bug record | Not required |
| Send a known-issue reply | Policy dependent |
| Declare a major incident | On-call or named authority |
| Roll back production | Required unless a pre-authorised runbook applies |
| Modify customer data | Required |
| Execute a high-risk correction | Two-person approval — mandatory where the project’s risk policy defines the class, otherwise a configurable project policy; never a mere recommendation |
| Change billing, entitlement, compliance, or regulated state | Required |
| Mark a root cause confirmed | Named technical or incident owner |
| Close a major incident without a postmortem | Required |
| Update a product or technical specification | Intelligence-graph governance (via ingestion, §14) |

Every control point carries one of four **control categories**, and the category — not the reviewer’s mood — decides bypassability:

| Category | Behaviour |
|---|---|
| **Hard control** | Cannot be bypassed: regulated-state changes, billing and entitlement changes, immutable audit evidence |
| **Emergency control** | Break-glass execution by a named authority, mandatory review after — the break-glass record is required, not optional (§25) |
| **Waivable quality gate** | Override node with reason, owner, and expiry — the graph’s standard override |
| **Advisory check** | Warn-only |

The progressive-enforcement rule (§15) applies to waivable and advisory categories; hard and emergency controls are exempt from it — they are never "not yet enforced".

## 17. GitHub-native realization

Operational records live in `docs/operations/`, all Markdown, in the same repository and edge table as the other checkpoints:

- `intake/ledger/` — the **signal receipt ledger** (§24): generated, append-only, partitioned by date and source — never one file per event. `intake/records/` — materialised Intake Record nodes only, per §24’s policy.
- `items/` — `incidents/`, `bugs/`, `corrections/`, `tickets/`, `known-issue-candidates/`; where tickets originate in helpdesk tooling, the record here references the source and carries the graph-relevant fields, per the evidence rule.
- `investigations/` — impact assessments, hypotheses, root causes. `responses/` — mitigations, workarounds, fixes, rollbacks, runbook drafts. `communications/` — operational communications (§12). `learning/` — gap findings, product insights, prevention actions, postmortem drafts, staged for the seam (§14).
- `evidence/` — durable references and groupings: log clusters, trace samples, anomalies, reconciliation results.
- `context/` — `services/`, `workflows/`, `providers/`, and `changes/` (deployments, flags, configs, non-code releases — the change-event log of §3).
- `postmortems/` — one per qualifying incident.
- `reports/` — generated, never hand-edited: `live-items.md` (open items by severity), `recurrences.md` (patterns approaching INV-OPS-04's threshold), `gap-backlog.md` (learning awaiting ingestion), `provider-risk.md`, `correction-audit.md`.

Durable operational knowledge — runbooks, known issues, monitoring standards — lives not here but in the intelligence graph's `knowledge/operations/`, where promotion, freshness, and CODEOWNERS review already operate (§14).

| Mechanism | GitHub-native realization |
|---|---|
| Intake gate (§8) | An Action on the webhook or Issue that appends to the signal ledger with an idempotency key (§24, §25); deterministic parts (dedup by identity, known-issue matching by signature) are scripts, classification and severity are Claude-assisted and warn-first |
| Severity routing (§8) | Labels plus Projects views; S2/S3 open a tracking Issue with the named owner |
| Change-event log (§3) | Deploy, flag, config, and non-code release pipelines append records to `context/changes/` as a required step — the anchor INV-OPS-09 checks |
| Incident record (§9) | A file in `items/incidents/` as truth, with a linked Issue for coordination; timeline entries carry **event time from the source system** — commits record persistence, never occurrence (§25) |
| Data-correction approval (§16) | The correction plan is a pull request gated by CODEOWNERS; high-risk plans require two approving reviews; execution evidence and validation are follow-up commits |
| Investigation (§11) | Hypothesis and root-cause nodes as files; confirmation is a review by the named owner |
| Learning capture (§14) | A Claude-assisted Action that, on item resolution, writes gap findings and insights as internal sources into the intelligence graph's `sources/internal/` — the seam, realized as files |
| Runbook and known-issue promotion (§14) | Ordinary ingestion pull requests into `knowledge/operations/`, CODEOWNERS-gated |
| Reconciliation and recurrence scans | Scheduled Actions regenerating `reports/` |
| Overrides | Override nodes with `waives` edges, as everywhere else in the graph |

## 18. Claude Code surface

Subagents (`.claude/agents/`), each narrow, all propose-only; the delivery system's `graph-maintainer` remains the sole writer:

- `ops-intake` — runs the intake gate (§8): dedup, known-issue match, classification, severity suggestion, affected workflow, next action.
- `evidence-linker` — connects an item to logs, traces, metrics, recent change events, prior tickets, known issues, and customer history.
- `impact-analyst` — affected customers and workflows, financial, SLA, compliance, and trust exposure, escalation recommendation.
- `investigator` — competing hypotheses with evidence for and against, root-cause candidates, explicit uncertainty, next-best validation step; never confirms (§11).
- `correction-planner` — scoped record set, proposed transformation, validation and reversal plans, approval requirement, audit-record draft (§9).
- `support-resolver` — customer-facing communication grounded in confirmed graph facts: status, workaround, required information, resolution confirmation — no invented certainty or timelines.
- `ops-learning` — on resolution: known-issue update, postmortem draft where required, gap findings, product insights, prevention actions, and the internal sources that carry them into ingestion (§14).

Slash commands (`.claude/commands/`), thin wrappers that load context through generated indexes and end by invoking `graph-maintainer`: `/ops-intake <signal>`, `/investigate <item>`, `/assess-impact <item>`, `/plan-correction <item>`, `/mitigate <item>` (drafts options and the record; execution is human per §16), `/postmortem <incident>`, `/ops-learn <item>`, `/known-issue <item>`, `/rollback <release>` (drafts the rollback record and checklist; execution per the control table).

CLAUDE.md gains the operational rules: agents never execute high-risk actions; root causes are confirmed only by the named owner; telemetry stays in source systems; intended truth changes only through ingestion; every production change is a recorded event; `graph-maintainer` is the sole writer.

## 19. Worked examples

Both examples instantiate the generic machinery; the second draws its concrete processes from one project's system overviews — an AI orchestration platform — and its details are that project's, not the spec's.

**A data-integrity loop: duplicate transaction import.** A ticket reports duplicated transactions. Intake links the customer and the *import transactions* workflow (S1, confirmed-defect route). The evidence linker finds a log cluster — retries after timeout — and a matching trace sample; the investigator's leading hypothesis, idempotency failure on retry, is confirmed by the named owner against the evidence. The bug `violates` the specification invariant *import is idempotent*. Response: a correction-planner-drafted, CODEOWNERS-approved data correction removes the duplicates with validation by reconciliation and a reversal plan; a fix introduces an idempotency key, `implemented_by` a pull request, `deployed_in` a release, `prevented_by` a new regression test. Learning: a prevention action adds a duplicate-import-ratio alert (monitoring gap) and a reconciliation monitor; the specification clarification travels as an internal source through ingestion; the pattern is recorded as a known issue until the fix is fully rolled out, each further ticket corroborating it. Ticket → evidence → bug → correction → fix → release → invariant → knowledge: the loop, walked.

**An AI-native loop: prompt release regression.** A release maps a new prompt version to production — shipped through the practice this project's overviews call **PromptOps** — behind the project's canary ladder (1 % → 5 % → 25 % → 100 % with auto-halt). At 5 %, the continuous-evaluation loop reports a grounding-score regression — a metric anomaly — and the ladder auto-halts: an alert, S2. Mitigation is the pre-authorised rollback runbook: single-click re-point to the prior version, recorded and linked to its trigger. Investigation confirms the regression class escaped the eval suite — **eval drift** — so learning emits an eval-coverage gap as an internal source; triage routes it class 2 into `delivery/orchestration`, where the promoted knowledge tightens the eval gates every future model-touching brief inherits. The successful rollback refreshes the runbook's freshness as corroborating use. A fixed prompt version ships as a new release through the same ladder. No unrecorded change touched production at any point (INV-OPS-09), and the eval suite is stronger than before the incident.

## 20. Definition of done

The Operations Graph is working when the team can answer, with evidence: what is happening; who is affected; which workflow is broken; whether this is new, known, or a recurrence; what changed; what the safest response is; what the durable fix is; and what must be learned. Each outcome below is a **configurable check** — the durations and thresholds are project policy; the checks are not:

- Every signal has a ledger entry (§24); every materialised node cites its ledger keys; duplicates and known-issue occurrences are absorbed at S0 with no investigation ceremony, their counts accumulating as prevalence.
- Every resolved S2/S3 incident produces a learning-capture result within the project’s configured duration, and links to an accepted postmortem before closure where its severity requires one (INV-OPS-01, INV-OPS-05).
- Every closed data correction contains successful validation evidence or a recorded reversal (INV-OPS-03).
- Every confirmed causal edge (`introduced_by`, `caused_by`) records the confirming owner and its supporting evidence set (§11, §23); no agent-confirmed cause exists.
- Every production change is a recorded event, every causal edge points at one, and **every active environment matches its recorded effective state or has an open reconciliation finding** (§26) — attribution is never folklore, including about itself.
- Every threshold-crossing recurrence has an explicit disposition — known issue, bug, product insight, or accepted-risk decision (INV-OPS-04).
- Every production fix is validated against production evidence before its bug closes (§12).
- An incident resolved tonight is a triaged internal source in the intelligence graph by the project’s configured deadline, and no specification, decision, or intent was ever edited except through that gate (INV-OPS-08).
- One query walks the whole loop: ticket → evidence → bug → fix → pull request → release → violated invariant → amended specification → the knowledge and sources beneath it. Three checkpoints, one graph.

## 21. Canonical artifact catalogue

Every artifact this spec names is typed here — location, required fields, states, owner, key edges, and terminal condition. Prose elsewhere describes; this table binds. States reference the lifecycles of §22; edges reference the registry of §23. All artifacts carry `domain` where learning will route (§9) and are immutable once terminal.

| Artifact | Location | Required fields (beyond id, timestamps, domain) | States (§22) | Owner | Key edges (§23) | Terminal when |
|---|---|---|---|---|---|---|
| Intake Record | `intake/records/` | Ledger keys, identity/dedup result, classifications (multi-valued), severity, routing result | Intake | Intake automation | `duplicates`, `relates_to`, `creates` | Classified and linked or routed |
| Support ticket | `items/tickets/` | Symptom, customer ref, workflow, user impact, evidence refs, outcome | Item | Support steward | `reports`, `affects`, `evidenced_by` | Outcome recorded, learning captured where significant |
| Incident | `items/incidents/` | Severity, times (§25), owner, affected workflows/customers/regions, impact, timeline, root-cause status, follow-ups | Incident | Named incident owner | `caused_by`*, `mitigated_by`, `resolved_by` | Closed after review; postmortem linked where required |
| Bug | `items/bugs/` | Expected vs actual, workflow, reproduction, evidence, suspected/confirmed source, linked spec, fix status | Bug | Component owner | `violates`, `introduced_by`*, `fixed_by`, `prevented_by` | Fix validated in production |
| Data correction | `items/corrections/` | Scope, reason, evidenced current state, intended state, transformation, validation plan, reversal plan, approval ref, execution evidence, audit trail | Correction | Correction approver | `approved_by`, `executed_by`, `validated_by` | Validated, or reversed and reviewed |
| Provider issue | `items/providers/` | Provider, error pattern, affected workflows, fallback status, escalation ref | Item | Integration owner | `caused_by`*, `escalates_to` | Resolved or accepted as dependency risk |
| Impact assessment | `investigations/` | Affected customers/workflows, financial/SLA/compliance/trust exposure, escalation recommendation | — (immutable) | Assessing agent + reviewing owner | `assesses` | On creation |
| Hypothesis | `investigations/` | Claim, confidence, evidence for/against, owner, next validation step | Hypothesis | Investigation owner | `supported_by`, `contradicted_by` | Confirmed or rejected |
| Root cause | `investigations/` | Explanation, evidence set, confirming owner, confirmation time | — | **Named accountable owner** | `confirmed_as` (from hypothesis), `caused_by`* | On owner confirmation |
| Response (mitigation / workaround / fix / rollback) | `responses/` | Type, trigger, action, executor, approval ref where required (§16), validation result | Response | Executor + approver | `mitigated_by`/`fixed_by` (inbound), `validated_by` | Validated or failed-and-superseded |
| Operational communication | `communications/` | Item ref, audience, channel, approved facts, author, approver, sent time, next-update commitment, impact scope | — | Approver | `communicates`, `corrects` (a prior message) | On send; corrections supersede |
| Postmortem | `postmortems/` | Incident ref, timeline, causes, what worked/failed, prevention actions, acceptance | Learning | Incident owner | `documents`, `creates` (prevention actions) | Accepted |
| Prevention action | `learning/` | Gap addressed, action, owner, due, verification | Learning | Named owner | `prevents` | Verified done, or explicitly declined |
| Gap finding / Product insight | `learning/` | Drift type (§14) or friction pattern, evidence set, proposed change | Learning | Ops-learning + domain steward | `reveals_gap_in`, emitted as internal source | Triaged by ingestion (promoted, rejected, or superseded) |
| KnownIssueCandidate / RunbookDraft | `items/known-issue-candidates/`, `responses/` | Per §9; prevalence and corroboration fields separate | Known issue | Operations steward | `promoted_as` → canonical card | Promoted (candidate remains immutable provenance) or retired |
| Accepted-risk decision | `learning/` | Risk, rationale, scope, expiry/review date, deciding owner | — | Deciding owner | `accepts` | On decision; reviewed at expiry |
| Change event (deploy / flag / config / non-code release) | `context/changes/` | Artifact + version, environment, target scope, actor identity, source mechanism, requested/start/completion times, before and after state, exposure %, approval ref, verification outcome, effective-state status, `supersedes` prior change, rollback link | Change | Releasing actor | `changed_by` (inbound), `caused_by`* target | Verified, superseded, or reversed |

\* Causal edges only under the graded vocabulary and confirmation rules of §23.

## 22. Lifecycle and transition model

State names below are the only valid values; a transition is legal only with its required evidence, actor, and approval, and every transition is a recorded event with source-event time (§25).

- **Intake**: `received → classified → { linked | routed | rejected }`. Classification requires the ledger entry; routing requires the created or linked artifacts.
- **Incident**: `open → mitigating → contained → resolved → reviewed → closed`. `contained` requires a validated mitigation; `resolved` requires impact ended; `reviewed` requires learning capture (and the postmortem where severity demands it); `closed` requires the owner. Reopening is a new transition with rationale, never an edit.
- **Bug**: `suspected → confirmed → planned → fixed → deployed → validated → closed`. `confirmed` requires evidence; `validated` requires production evidence; no skip from `fixed` to `closed`.
- **Data correction**: `proposed → approved → executing → validated → closed`, with the failure path `executing → failed → reversed → reviewed`. Execution before approval is a hard-control violation (§16), not a state.
- **Hypothesis**: `proposed → testing → { confirmed | rejected }`. `confirmed` requires the root-cause rule (§11): sufficient evidence plus the named owner.
- **Response**: `proposed → approved → executed → { validated | failed }`. Approval per the control table; a failed response is superseded by a new one, never edited into success.
- **Learning artifact**: `drafted → captured → triaged → { promoted | rejected | superseded }` — the last three states live in ingestion; the seam is `captured → triaged`.
- **Known issue**: `proposed → accepted → active → { resolved | retired }` on the canonical card; the operational candidate freezes at `promoted_as`.
- **Change event**: `requested → executing → { verified | failed → reversed }`, with effective-state status maintained by reconciliation (§26).

## 23. Normative edge registry

The single authority for operational relations. Direction is provenance-style — from the newer record to what it is about — unless noted. Cardinality is per source node. "Confirm" marks edges that require the root-cause rule or a named approval before they may exist; all others are agent-proposable through the write protocol (§25).

| Edge | From → To | Cardinality | Meaning | Confirm |
|---|---|---|---|---|
| `reports` | Ticket → Workflow/Item | 1..n | A report concerns this subject | — |
| `duplicates` | Intake/Item → Item | n..1 | Same underlying condition | — |
| `relates_to` | Any → Any | n..n | Relevant, weaker than duplicate | — |
| `detected_by` | Item → Alert/Signal node | 1..n | What surfaced it | — |
| `evidenced_by` | Item/Hypothesis/Root cause → Evidence node | 1..n | Supporting material, durable reference | — |
| `supported_by` / `contradicted_by` | Hypothesis → Evidence node | n..n | Evidence for / against the claim | — |
| `confirmed_as` | Hypothesis → Root cause | 1..1 | The surviving explanation | **Owner** |
| `observed_after` | Item → Change event | n..n | Temporal adjacency only — never causal | — |
| `suspected_introduced_by` | Item → Change event | n..n | Under investigation | — |
| `introduced_by` | Bug/Item → Change event | n..1 | Confirmed: this change introduced the defect | **Owner** |
| `triggered_by` | Item → Change event/Condition | n..1 | Confirmed: activated a pre-existing failure mode | **Owner** |
| `caused_by` | Item → Root cause/Change event | n..1 | Confirmed causal explanation | **Owner** |
| `violates` | Item/Bug → Specification invariant | n..n | Observed truth contradicts intended truth | — |
| `mitigated_by` / `resolved_by` / `fixed_by` | Item → Response | 1..n | Containment / resolution / permanent change | — |
| `validated_by` | Response/Fix/Correction → Evidence | 1..n | Observed working | — |
| `approved_by` / `executed_by` | Correction/Response → Actor/Override | 1..n | The accountable approval / execution | **Per §16** |
| `implemented_by` / `deployed_in` | Fix → Patch / Release | 1..1 | The delivery-cycle anchors | — |
| `prevented_by` | Item/Bug → Prevention action/Test | n..n | The recurrence guard | — |
| `reveals_gap_in` | Gap finding → Spec/Test/Eval/Monitor/Runbook/Product model | 1..n | The drift table's pointer (§14) | — |
| `promoted_as` | Candidate → Knowledge card | 1..1 | Operational provenance → canonical knowledge | — |
| `communicates` / `corrects` | Communication → Item / prior Communication | 1..1 | Messaging provenance | — |
| `accepts` | Accepted-risk decision → Item/Known issue | 1..n | Risk explicitly carried | **Owner** |
| `escalates_to` | Item/Provider issue → Item/Authority | n..1 | Raised severity or external escalation | — |
| `changed_by` / `owned_by` / `serves` / `returns` / `implements` / `specified_by` / `measured_by` / `covered_by` / `constrained_by` / `depends_on` / `belongs_to` / `uses` / `affects` | Context edges (§9) | n..n | Structural context; `affects`, `depends_on` keep their cross-checkpoint meaning; evidence-`supports` is **not** used here — providers `serve` workflows | — |

No inverse edges are stored; inverses are derived by the generated indexes. An edge outside this registry fails validation.

## 24. Signal ledger and materialisation policy

Two storage levels reconcile "every signal is received" with the evidence rule's "never a node per event".

**The signal receipt ledger** (`intake/ledger/`) is generated, append-only, and partitioned by date and source system — structured entries, many per file, never one file per event. Each entry: source-system id, receipt time, signal type, identity/dedup key, routing result, linked operational object, processing version, integrity hash. The ledger is complete — a thousand duplicate alerts in a paging storm are a thousand entries — and it is the idempotency substrate: the dedup key rejects replayed webhooks (§25).

**Graph nodes materialise only when a signal**: opens a new operational item; changes severity; adds materially new evidence; confirms a recurrence; creates a gap finding; changes an accepted known issue; or requires an accountable response. Everything else updates aggregates (occurrence counts, `last_observed_at`) on already-materialised nodes, citing its ledger keys. During a major incident the graph gains one incident, its evidence set, and its responses — not the alert storm — while the ledger holds the storm for later forensics.

## 25. Graph-write and concurrency protocol

Many producers, one writer. `graph-maintainer` remains the sole writer; this protocol makes that safe under webhooks, pipelines, scheduled scans, incident commands, and humans arriving at once:

1. Every proposed operation carries a **stable operation id** (source system + event id, or content hash).
2. Every proposal declares the **graph revision** it was computed against.
3. The maintainer applies operations **idempotently**: an already-applied operation id is acknowledged as a duplicate, not re-applied — replayed webhook deliveries converge to one write.
4. A proposal whose base revision is stale is **re-evaluated against the current revision**: commutative updates (aggregates, added evidence) apply; conflicting updates return for re-proposal.
5. Partial application does not exist: an operation's writes land **atomically in one commit** or not at all, and a failed maintainer run leaves no half-state to repair.
6. **Five timestamps, never conflated**: event time (from the source system), detection time, recording time (proposal), commit time (persistence), review time. Timelines and SLAs compute on event and detection time; commits prove persistence only.
7. **Emergency direct edits are break-glass records**: the edit, the named authority, and the reason land together, and mandatory review follows (§16) — an undocumented direct edit is an incident about the graph itself.
8. A **scheduled reconciliation pass** compares source systems' recent events against the ledger and the graph, surfacing unapplied or missing operations as findings.

## 26. Effective-state reconciliation and repository data policy

**Reconciliation.** INV-OPS-09 demands every production change be recorded, but a pipeline rule cannot see console changes, provider-dashboard flips, emergency scripts, or half-completed rollouts. So the invariant is enforced from both ends: pipelines record as a required step, and a **scheduled effective-state reconciliation** compares recorded state to actual state — deployed version vs. runtime version, recorded flags vs. actual flag values, recorded configuration vs. effective configuration, recorded non-code version vs. serving version. Any unexplained mismatch creates an **UnrecordedChangeFinding**: an operational item whose investigation identifies the actor and mechanism, whose resolution records the change retroactively with a break-glass annotation, and whose learning asks why the recording path was bypassable. The change-event schema (§21) carries `effective-state status` precisely so the graph can say "recorded and verified live" as distinct from "recorded".

**Repository data policy.** Repository history is durable and replicated; what enters it is therefore a hard rule, not a habit: only **opaque customer and tenant references** — never raw personal or payment data, credentials, tokens, or customer message bodies; customer evidence remains in its source system behind a **durable evidence reference** (source system, object/query id, time range, capture time, access classification, redaction status, integrity hash where possible, retention status); agent inputs are redacted before prompting; security- and privacy-classified items (§8) may hold their evidence in restricted repositories or external stores, with the graph carrying classified references; retention and deletion duties are declared per evidence class, and source-system permissions remain authoritative — a graph link never widens access. These are the operations-grade instance of the same discipline ingestion v14 defines for source storage: provenance always durable, bytes only where lawful and safe.
