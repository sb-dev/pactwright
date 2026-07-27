# Project Intelligence Graph — Continuous Knowledge Ingestion (v14)

> **Scope.** This spec defines the ingestion engine of the Project Intelligence Graph: how material enters the graph and becomes knowledge, and how knowledge — under human approval — becomes proposals into approved design, future work, and implementation context. The intelligence graph is an extension of the delivery system's Specification Graph, the second of three checkpoints of one file-based, typed-edge graph: the software delivery graph before it, the Operations Graph after it. Each graph canonically owns its records (§4); this engine proposes into the others and never stores their state. The spec is organized as enforceable contracts in seven parts — boundaries, data model, classification, lifecycle, propagation, delivery integration, execution — generic throughout, with project-specific material only in the registry seeding example (§7.5).

# Part I — System boundaries

## 1. Purpose

This spec defines how material enters the **intelligence graph** — the Sources and Knowledge layers the Project Intelligence Graph adds on top of the delivery system's Specification Graph. It is an extension of that spec graph, not a replacement: the same file-based, typed-edge model, with new node and relationship types layered on and the existing specification nodes preserved as the design authority.

Everything flows through this graph before it becomes approved design or future work — the founding specification at the start, then research, articles, incidents, metrics, user feedback, and experiment results for the entire life of the project. The engine spends scarce human attention only where incoming material changes the project's truth, and it keeps the ingested knowledge as durable context that grounds both what the project decides to build and how the delivery system builds it. Compared against the delivery graph, it also yields what remains to be built and in what order (§24). And every node carries a domain from a small, extensible registry (§11), so the graph also answers who stewards a piece of knowledge, how fast it ages, and which briefs it must reach.

**Core principle, carried from the delivery system: GitHub-native, not a custom platform.** The goal is not to build an ingestion platform first. The goal is to make a GitHub repository operate as a lightweight AI-native ingestion engine, where incoming material is transformed into verified, traceable, production-aware knowledge and intent. Every mechanism this spec names — the triage gate, the review queue, the cascade — is realized by the primitives the delivery system already uses: repository files for nodes, a typed edge table for relationships, GitHub Actions for checks and scheduled work, pull requests and CODEOWNERS for steward review, GitHub Projects for queue visibility, and Claude Code (alongside Codex CLI, Gemini CLI, and other agents) for the processing. No custom service, queue, or database is introduced; "engine" and "gate" are roles played by repository files, small scripts, and Actions, not software to build before the work can start (§25–§26).

## 2. Design rationale — why a routed funnel, not a uniform pipeline

The delivery system this graph extends covers *building*; continuous knowledge ingestion is new alongside it. The requirements below therefore originate from design analysis — from examining and rejecting the obvious design — not from an existing system's shortcomings.

The obvious design would run one uniform pipeline for every source: intake → source page → claim extraction → knowledge comparison → promotion proposal → steward review → graph update, with a human steward gating **every** promotion. That design is right for the **formative phase**, when the graph is being built and nearly every document is genuinely new. It would not survive contact with the steady state:

- **Uniform ceremony.** A document that merely repeats accepted knowledge would receive the same source page and steward review as one that overturns an approved spec. Steward attention — the scarcest resource — would become the bottleneck, and ingestion could not keep pace with its inflow.
- **No front door.** Nothing would test relevance or novelty before expensive processing. Declaring "do not create a page for every small observation" a non-goal is not a mechanism to honor it.
- **No deduplication or corroboration.** The same claim arriving from ten sources could spawn ten cards; nothing would consolidate them or let repeated independent evidence raise confidence.
- **One-shot, document-only.** Continuous feeds (metrics, telemetry) and auto-generated internal signals (incidents, release evidence, drift) would have no path in except a human dropping a Markdown file.
- **No freshness or decay.** Accepted knowledge would carry no review horizon, so it would rot silently while the world moves.
- **No cascade.** When new evidence challenged a knowledge card, nothing would flag the specs, intents, and roadmap items that depend on it.
- **Synchronous and single-threaded.** With no state model for in-flight ingestion and no concurrency control, multiple agents ingesting overlapping material would collide.
- **No retraction.** Supersession (replaced by something better) and retraction (the basis was invalid) would be conflated.
- **Knowledge feeds planning but not building.** Ingested material would inform intents and specs, but nothing would carry context like the tech stack, user journeys, and requirements to the agents that later turn an intent into code.

Beneath all of these sits one structural gap: a uniform design types knowledge by **lifecycle** — source, claim, card — but not by **kind**. "The project's domains" would appear in any relevance test without being defined anywhere; steward review would have no notion of who owns what; freshness would run one clock over campaign results and architecture diagrams alike; and the implementation brief's context would be an ad-hoc list. Each failure mode above maps to a mechanism in this spec — the triage gate (§10), corroboration (§14), feeds and digests (§8), freshness (§18), the cascade (§20), the entity lifecycles and concurrency rules (§6), retraction (§21), the brief seam (§22) — and the structural gap is closed by the domain model (§11): a registry of information domains that the whole pipeline reads.

## 3. Core thesis — one ingestion path, with cold start as its first event

Everything enters the project the same way. A new research log, an incident, a metrics digest, **and the founding specification itself** all enter as Sources, become Knowledge in the intelligence graph, and only then — under human approval — become approved design in the Specification Graph or future work in the Intent Graph. Nothing is turned into an intent without first leaving a knowledge and source trail behind it.

This means there is no separate "cold-start" mode. **Cold start is simply ingestion when the baseline is empty.** With nothing in the graph to match against, the triage gate (§10) classifies the founding spec as wholly novel, so it routes to the full pipeline (class 2/3) and gets the heavy, human-led processing the formative phase deserves. As knowledge accumulates, triage begins finding matches and most later material routes to the cheap classes. Same engine, different baseline density — the founding decomposition and the steady trickle are the same operation seen at two points in the graph's life.

Steady-state ingestion is therefore **impact-routed novelty detection against the established graph** — the move the delivery system makes when it routes a change by work-class, applied to knowledge: flag only what deviates from the established baseline, and let everything else pass cheaply.

The governing principles:

1. **One path in.** All material — the founding spec included — passes through the intelligence graph (Sources → Knowledge) before becoming approved design or an intent.
2. **Process matches impact.** Ceremony scales with how much a document could change the project, not uniformly; an empty baseline makes the founding spec heavy, a full baseline makes the tenth corroborating note free.
3. **Human attention is reserved for novelty, contradiction, and design impact.** Corroboration is absorbed automatically; only genuinely new, conflicting, or design-affecting material reaches a steward.
4. **New knowledge changes future work only through explicit links.** Ingestion may *propose* changes and *flag* affected downstream nodes automatically, but acceptance of any spec amendment, decision, intent, or roadmap change stays human. (Preserved through the cascade in §20.)
5. **Knowledge grounds both what to build and how to build it.** Ingested material becomes durable project memory that feeds intent creation *and* the implementation that follows (§22).
6. **Knowledge carries its domain.** Every source, claim, card, intent, and decision is classified into a small, project-extensible registry of information domains (§11). Domains shape routing, stewardship, freshness, and retrieval — they never add a second pipeline or gate a promotion by themselves.

## 4. Graph ownership and the single-writer contract

Three graphs, one file-based typed-edge model, three owners — and every canonical node lives in exactly one of them:

| Graph | Canonical owner of | Everyone else may |
|---|---|---|
| **Intelligence Graph** (this spec) | Sources and source versions, Triage Records, Processing Runs, Claims, Knowledge Cards, Contradiction Records, Promotion Proposals, Domain Definitions | Read; cite; propose challenges through ingestion |
| **Specification & Delivery Graph** (checkpoint 1) | Specification nodes, Intents, Roadmap commitments, Implementation Briefs, contracts, patches, evidence, releases | Read; **propose** amendments, new intents, and drift items — never store or edit them |
| **Operations Graph** (checkpoint 3) | Operational signals, investigations, incidents, corrective actions, validated operational learning | Read; receive its emitted learning as internal sources |

The ingestion engine therefore **proposes changes to delivery-owned records; it never stores or owns them** — a spec-amendment proposal, a candidate intent, and a drift item are ingestion's outputs, but the spec, the intent, and the roadmap item they become are checkpoint 1's records in checkpoint 1's paths. Cross-graph indexes and reports may combine all three; canonical state never migrates.

**The single-writer contract, stated once and binding everywhere.** Judgement agents — triage, analysis, proposal, cascade — emit **structured change requests**; `graph-maintainer` validates and applies them; **no other agent writes canonical graph state**, on any path, in any class. Where later sections say an agent "writes" a record, read: emits the change request that `graph-maintainer` applies.

## 5. Design goals and non-goals

The ingestion engine must:

- Route every incoming source by an **impact class** that scales the work it triggers.
- Provide a cheap **triage gate** that detects identity, relevance, novelty, contradiction, and trust before any expensive processing.
- Classify every source into a **domain** from a project-extensible registry at triage, and let the domain drive steward routing, freshness horizons, and brief assembly (§11).
- Ship a **core domain set** every project starts with, and let projects **register additional domains** — `delivery/orchestration` for an AI orchestration project, say — through the same human-gated path, with no engine change (§11).
- Make the canonical **cross-domain dependencies** explicit as typed edges, so a change in one domain reliably reaches the work it drives in another (§19).
- **Absorb corroboration automatically** — repeated evidence raises confidence and refreshes freshness without minting duplicate nodes or consuming steward time.
- Handle **discrete documents, continuous feeds, and auto-captured internal signals** through one routed pipeline.
- Carry **trust tiers and corroboration counts** that gate how far a claim can travel without human review.
- Keep knowledge **fresh**, surfacing accepted conclusions for re-validation as they age.
- **Cascade** the consequences of challenged, superseded, or retracted knowledge to dependent specs, intents, roadmap items, and briefs — as proposals, never silent edits.
- Be **asynchronous, concurrent-safe, and idempotent** across multiple agents (Claude Code, Codex CLI, Gemini CLI, and others).
- Distinguish **retraction** from **supersession**.
- Route **all** material — the founding specification included — through the intelligence graph before it becomes approved design or an intent.
- Make ingested knowledge **durable context for implementation**, linking tech stack, user journeys, requirements, and specs into the briefs the delivery system builds from.
- **Derive the remaining work as cycles**: compare the intelligence graph against the delivery graph to generate the **implementation guide** — a dependency DAG of work-classed cycles rendered as executable waves, one cycle per delivery obligation (§24).
- Stay **GitHub-native**: repository files, a typed edge table, GitHub Actions, pull requests, CODEOWNERS, GitHub Projects, and Claude Code — introducing **no custom hosted ingestion service, application server, queue, or database**. The engine *is* software — adapters, hashing, validation, baseline computation, cascade traversal, index and report generation — but all of it lives as repository scripts, agents, and Actions.

**Non-goals.**

- It does not auto-accept anything that alters canonical meaning: class-1 autonomy is strictly additive (§16), and amendments to an approved spec, accepted decision, or active roadmap commitment remain human (§13, §20).
- It does not raise a claim above accepted knowledge on a single low-trust source (§14).
- It does not create a node for low-value material; triage logs it and stops (§10).
- It does not replace the steward; it filters and orders what the steward sees (§17).
- It does not re-run the cold-start decomposition; it folds material in incrementally (§3, §22).
- It does not run the cycles it derives or release them into intake; the generated implementation guide is a proposal, and a human feeds each cycle to intake (§24).
- It does not hard-code the taxonomy. The core set (§11) is a starting registry; projects extend, nest, or retire domains through the same reviewed path as any other structural change.
- It does not let domain gate promotion. Impact class and trust × corroboration still govern what a claim may become; domain routes and organizes, it never approves.
- It does not become the content store. Published artifacts — posts, pages, campaigns, decks — live in their own systems; the graph holds their sources, the knowledge derived from them, and the links between them.

# Part II — Data model

## 6. Entities and their lifecycles

One state machine over "the source" conflated four things that live and die independently: a source stays valid when its proposal is rejected; a processing attempt fails while the source stays captured; a card is superseded while its source stands. Four entities, four machines:

**Source Capture** — the immutable material and its provenance. States: `captured | duplicate | versioned | withdrawn | restricted`. Identity is content hash + canonical source ID; re-ingesting identical content is a no-op against the existing identity; changed content of a living source becomes a new **Source Version** linked `version-of` its predecessor, re-triggering triage. Capture is durable: rejecting a derived proposal never rejects the record that the source was received.

**Processing Run** — one attempt to analyse a source. States: `queued | leased | processing | completed | failed | cancelled`. Every run records its **reproducibility metadata**: agent name and definition version, model and provider (version where available), prompt version, repository commit, graph-index snapshot, the candidate matches considered, output rationale and confidence, any manual override, and — when it re-processes — the run it supersedes. Rerunning a source with a different model is a new run, auditable against the old one; semantic classification is thereby a recorded judgement, not an anonymous one.

**Promotion Proposal** — one proposed graph mutation, first-class. States: `draft | pending-review | accepted | rejected | deferred | withdrawn`. A proposal names the exact mutations it requests (new or updated card, supersession, contradiction record, candidate intent, spec-amendment proposal, drift item) and cites the run and claims behind it. Rejection is durable and visible to later runs.

**Knowledge Card** — the canonical conclusion. States: `provisional | accepted | stale | challenged | superseded | retracted` (freshness and challenge mechanics in §18–§21).

Claims, Triage Records, and Contradiction Records are immutable once minted and need no machine beyond creation and supersession. **Claim consolidation** holds across all of it: a semantically matching incoming claim merges into the existing claim as corroboration, never a duplicate. The four machines advance independently — and the pull-request boundaries keep them transactionally separate (§25): capture, analysis output, promotion proposal, and canonical mutation are separate merges, so any one can fail or be rejected without corrupting the others.

## 7. Node and link types

The intelligence graph extends the delivery system's file-based, typed-edge graph. The delivery-side vocabulary it links into — **Specification Nodes** (approved design, the design authority), **Intents** (future work), **Decisions** (human-gated resolutions), **Roadmap Items** (active commitments), **Implementation Briefs**, and **Drift Items** (proposals recording a questioned dependency), connected by the typed links `affects`, `constrains`, `supports`, `implements`, `depends-on`, and `supersedes` — is defined by that system; ingestion reads it and proposes against it, never silently edits it.

The intelligence elements themselves:

| Element | Definition | Key fields / behavior |
|---|---|---|
| **Source** | The immutable captured artifact, with its provenance. Identity is content hash + canonical source ID (§6); updates create new versions, never edits | `trust_tier` (§14), `capture_state`, `storage_mode` (§9), `version-of` link (§6) |
| **Source Page** | The project-facing analysis of a source: summary, candidate claims, affected specs and intents, contradictions raised | **Conditional** — created for class 2/3 only; class 0/1 skip it |
| **Claim** | A discrete, checkable statement extracted from a source, kept distinct from the analyst's interpretation | Corroboration set; consolidation/dedup (a matching incoming claim merges as corroboration, §6); multi-dimensional `confidence` (§14) |
| **Knowledge Card** | A durable conclusion the project relies on, consolidated from claims | Lifecycle `provisional → accepted → { superseded \| retracted }`, with a soft `stale` state (§18); `review_by`, `last_refreshed`, `freshness` (§18); confidence derived from corroboration (§14) |
| **Triage Record** | The per-source routing decision: disposition, impact class, domain, and assertion kind, plus the identity, relevance, novelty, contradiction, and trust assessment behind it (§10) | One per source version; the audit trail of ceremony |
| **Processing Run** | One analysis attempt over a source, with full reproducibility metadata (§6) | `queued → leased → processing → { completed \| failed \| cancelled }`; reruns supersede |
| **Promotion Proposal** | One proposed graph mutation, citing the run and claims behind it (§6) | `draft → pending-review → { accepted \| rejected \| deferred \| withdrawn }`; rejection durable |
| **Contradiction Record** | Both sides of a conflict, held open until strong evidence resolves it via Decision or supersession (§21) | First-class; never resolved by silently rewriting the older node |
| **Digest Source** | A periodic aggregation of a continuous feed; emits claims only on baseline deviation (§8) | Generated on a cadence, never per event |
| **Retraction record** | Marks that a source's basis was invalid, via a `retracts` link — distinct from supersession (§21) | Flags derivations invalid pending re-validation |
| **Domain Definition** | A registry entry defining one domain: scope, canonical artifacts, steward, review horizon, trust exemplars, brief recipe (§11) | Lifecycle `registered → superseded`; registration and retirement are class-2 changes |
| `corroborates` link | A counted form of `supports`: an additional independent source backing an existing claim or card | Corroboration breadth feeds confidence and freshness |
| `retracts` link | Connects a retraction record to what it invalidates | Cascades at higher severity (§17) |

Every Source, Triage Record, Claim, and Knowledge Card additionally carries `domain` — one primary and optional secondaries from the registry — and Claims and Cards carry `assertion_kind` (§12); both fields are proposed onto the Intents, Decisions, and Roadmap Items the graph links to, so the dimensions span both subgraphs. Cards additionally carry their **delivery-obligation** edge where one applies (§23): `requires-delivery`, `realised-by` / `satisfied-by` once delivered, or `informs-only` / `constrains` for knowledge that guides without obliging.

Class 0/1 fast-path absorption still produces durable, linked graph state — a corroboration link and a confidence/freshness update — so nothing is lost by skipping the source page; the source itself remains the record.

## 8. Source kinds: discrete, continuous, internal

The funnel accepts three kinds, all routed through the same triage:

- **Discrete sources** — documents, notes, articles, transcripts, and the design-and-context documents that ground the project (the founding spec, requirements, tech-stack descriptions, user-journey maps). One source, one capture, processed as in §15.
- **Continuous feeds** — metrics, telemetry, ongoing dashboards. These are **not** ingested per event. A **Digest Source** is generated on a cadence, and the feed produces a claim **only when it deviates from its baseline** — an anomaly, not a heartbeat. This keeps a high-frequency feed from flooding the graph: baseline-and-anomaly discipline, not per-event capture.
- **Internal sources** — the system's own outputs, auto-captured and routed through triage like any external document. They arrive from two places. From the **delivery graph**: release evidence and drift items — delivery evidence that challenges an earlier assumption arrives as a class-3 source and cascades (§20), rather than waiting for a human to transcribe it. From the **Operations Graph** (the third checkpoint, recording observed production reality, defined in its own specification): raw operational signals — tickets, alerts, incidents, corrections — never reach this gate directly. They pass through that graph's intake, investigation, and response first, and what enters here is its **learning**: gap findings, product insights, postmortem conclusions, runbook and known-issue candidates, each carrying its evidence trail and, where one exists, a root cause confirmed by a named owner — which informs the trust tier (§14). Where that checkpoint is not yet running, direct capture of incidents and post-deploy findings is the stopgap.

Which feeds and internal signals exist is domain-shaped: campaign results and channel analytics digest into `go-to-market` and `content` — and where the Review & Creative Delivery spec is running, a performance digest additionally **scores each publication against the Metric Definitions its concept pinned**, minting Measurement records whose verdicts corroborate (target hit) or challenge (target missed) the strategy and guideline cards behind the work, so underperformance is a routed graph fact rather than a retrospective opinion; generation feeds — token and currency spend per provider and task class, verification pass rates, market selection rates — digest into `delivery/generation` where it is registered, feeding that domain's guideline-impact reporting; eval-suite scores and canary telemetry digest into `delivery/orchestration` where it is registered; and where the product monitors its own voice and sentiment, drift detections enter as operational signals whose learning files under `identity` — a detected voice drift handled exactly like an incident: through the operational funnel, arriving here as a class-3 candidate, not a note somebody remembers to file.

## 9. Source storage, privacy, and retention

Sources may contain personal information, customer content, security-sensitive data, secrets, licensed or copyrighted material — a permanent Markdown copy in Git may be inappropriate or unlawful. Capture therefore declares a **storage mode**: `full-snapshot | redacted-snapshot | metadata-and-hash | external-pointer | restricted-reference`. Provenance — the hash, the Triage Record, the derivation links — is always durable; the bytes are not always ours to keep.

The rules: secret detection runs at capture and blocks a full snapshot that trips it; redaction policy is per source kind and recorded on the capture; licensed and copyrighted material defaults to metadata-and-hash with an external pointer; retention periods and access restrictions ride the Domain Definition or the capture itself; and **legal deletion is honored** — the content is removed, a **tombstone** preserves the hash, the fact of capture, and the reason, and derived knowledge is flagged for re-validation exactly as a retraction cascades (§21). History rewriting is the exceptional last resort for content that may not persist even in history, executed as a recorded operational decision. "Never delete" governs graph provenance where lawful and safe; it never overrides privacy, licensing, or security obligations.

# Part III — Classification

## 10. The triage gate — the classification sequence

Triage is a cheap first pass run on every source before any expensive processing. For each source it computes, and records on a **Triage Record**:

- **Identity / dedup** — content hash + canonical source identity. A re-ingest of the same content is a no-op; a changed source becomes a new version (§6).
- **Relevance** — does the material fall inside any registered domain's scope (§11)? The registry is what makes this test concrete. Below threshold for every domain → class 0, logged, stop.
- **Domain** — the primary domain the material belongs to, plus optional secondaries. Corroborating material inherits the domain of the card it matches; novel material is classified against the registry's scope statements. Substantive material with **no** domain home routes class 2 with a drafted Domain Definition attached — registering the domain becomes part of the promotion decision (§11).
- **Novelty** — semantic comparison against existing claims and knowledge cards. A match → corroboration (class 0/1); no match → candidate-new (class 2). The comparison runs against the assigned domain's slice of the graph first — cheaper and sharper — then across the canonical cross-domain edges (§19) so a conflict that crosses domains is not missed.
- **Contradiction** — does it conflict with accepted knowledge, an approved spec, or an active roadmap item? Any conflict → class 3.
- **Trust tier** — assigned from provenance (§14).

The Triage Record's output is the impact class, the domain, and the routing decision. Triage is what operationalizes the non-goal of §5 — no node for low-value material — and it is the steady-state analogue of anomaly detection against a baseline: it exists to find what is **new or conflicting** relative to established knowledge and to let everything else pass cheaply.

## 11. The domain model — what the graph holds

A **domain** is a category of project knowledge with its own steward, its own freshness clock, and its own role in grounding work. Domains are recorded in a **domain registry** — one Domain Definition per domain — and every Source, Triage Record, Claim, Knowledge Card, Intent, and Decision carries a `domain` field (one primary, optional secondaries) drawn from it. The registry is deliberately small: a category earns a domain when it needs a distinct steward, a distinct review horizon, or a distinct brief recipe; anything less is a tag on cards, not a domain.

### 11.1 The core set

Every project starts with this registry:

| Domain | What it holds | Canonical artifact types | Default review horizon |
|---|---|---|---|
| `discovery` | What is true about users and the market | User research, personas, market landscape, competitor analysis, the ranked problem inventory | 2 quarters |
| `product` | What the project intends to build, and why | Vision, roadmap, PRDs, product bets and their metrics | 2 quarters |
| `identity` | Who the project/product is | Identity definition, values hierarchy, tone and voice, ethics boundaries — the authority for copy across product surfaces and social channels | 2 quarters, with drift signals arriving continuously (§8) |
| `go-to-market` | How it reaches the market | Messaging and positioning and their usage, GTM strategy, campaign briefs and their results, content strategy | 1 quarter |
| `content` | What is published outside the product | Blog posts, marketing websites, social media posts and profiles, the social strategy derived from go-to-market goals, the content calendar | 1 quarter |
| `decisions` | Durable decisions | Decision records with their rationale and evidence | None — decisions are superseded, never decayed |
| `delivery/ux` | How the product behaves for people | UX principles (e.g. cognitive-load budgets, progressive disclosure), UX flows, wireframes, component patterns | 2 quarters |
| `delivery/eng` | How the product is built | Tech stack (languages, frameworks, services, platform constraints), architecture overview, engineering specs, APIs, data models and event formats, observability standards | 6–12 months |
| `handbooks` | How the project works | Project process, ways of working, the quality bar, shipping and release process, project-wide security and compliance expectations | 12 months |

The artifact lists are the domains' generic contents; every project fills them with its own instances — its own personas, its own vision, its own architecture. Horizons are registry defaults; each Domain Definition sets its own and any card may override (§18). The artifact-type column is the default **coverage checklist**, and coverage has two bars. A domain is **seeded** when each canonical type has at least one accepted, in-horizon card — a computable minimum that works on day zero, unlocks the domains that depend on it, and drives onboarding (§24). A domain is **covered** when its **coverage slots** are satisfied: project-specific questions the Domain Definition may declare ("target users identified", "critical user journeys covered", "security model documented"), each answered by named accepted cards. Slots are optional — a domain without them reports only the seeded bar — but one persona never silently equals "users understood": card counts support the coverage report; slots, where declared, determine completeness, and the progression machinery keeps steering seeded domains toward covered.

Two placement notes:

- **`discovery`, `product`, and `identity` form the upstream core; `go-to-market` derives from it.** What users need, what the project intends to build, and who it is come first — a GTM strategy is hard to even state without them. `go-to-market` is the hinge between that core and executed work: downstream of the core it depends on, upstream of the intent backlog, the order in which its cycles ship (§24), and the `content` domain it drives. §19 makes the whole chain mechanical rather than aspirational.
- **`decisions` is realized by an existing node type.** Decision nodes (the delivery system's human-gated resolutions) take `decisions` as their primary domain and the subject they resolve as a secondary, so the durable decision log is simply the `decisions` slice of the graph, while each decision stays visible from the domain it touches.

### 11.2 Extension- and project-registered domains

The registry grows in two ways beyond the core, both through the standard path of §11.4.

**System extensions register domains.** When a checkpoint of the wider system needs a home for the durable knowledge it produces, its specification registers one. The Operations Graph — the third checkpoint, recording observed production reality — registers:

| Domain | What it holds | Canonical artifact types | Default review horizon |
|---|---|---|---|
| `operations` | How the project runs in production | Runbooks, known issues, monitoring and alerting standards, SLOs, incident-response process, postmortem learnings | 1 quarter, refreshed by validated use |

The Review & Creative Delivery spec — the fourth extension, defining the engines and runtimes that operate over the graph — registers:

| Domain | What it holds | Canonical artifact types | Default review horizon |
|---|---|---|---|
| `delivery/generation` | How generation providers and models are used well | Per-provider/model prompting guidelines, capability and parameter guidance, output-format recipes, known failure modes and workarounds, catalog trade-off evidence | 1 quarter — model releases move fast |

Its cards are ordinary knowledge — sources, trust × corroboration, promotion, freshness, supersession, and the cascade all apply unchanged — with one consequence stated in that spec: its Provider Runtime applies only **accepted** cards at prompt assembly and pins the applied versions (`guided-by`) on every Generation Record, so a superseded guideline reaches, through the cascade, every catalog, prompt version, and unshipped plan that cited it.

**Projects register domains** for the knowledge only they carry. For example, an AI orchestration project registers:

| Domain | What it holds | Canonical artifact types | Default review horizon |
|---|---|---|---|
| `delivery/orchestration` | How agent work is orchestrated and kept safe to ship | Orchestration pipelines, evals and quality gates, prompt versioning strategy, shadow releases and rollback procedure | 1 quarter |

Nesting is one level deep and purely a naming convention: `delivery/ux` and `delivery/orchestration` share a prefix, not fields — each Domain Definition states all of its own fields; there is no inheritance and no parent `delivery` definition to inherit from.

### 11.3 The Domain Definition

Each registry entry (`domains/<id>.md`, §25) records:

- **Scope** — one paragraph: what belongs, what explicitly does not, and the nearest adjacent domains (the triage classifier's hints).
- **Canonical artifact types** — what this domain's sources and cards usually are.
- **Steward** — the CODEOWNERS mapping for `knowledge/<id>/` (§17, §25).
- **Default review horizon** — the freshness clock (§18).
- **Trust exemplars** — what earns T0/T1 in this domain (§14).
- **Brief recipe** — what an Implementation Brief pulls from this domain, and by which edge (§22).

### 11.4 Extending and retiring

- **Registering** a domain is one class-2 pull request: the Domain Definition plus a CODEOWNERS line. Triage may draft one when substantive material has no home (§10); it never silently mints one.
- **Retiring** a domain is supersession, never deletion: the definition gains a `supersedes` link to its replacement (or to the domain it merges into), and the cascade proposes re-tagging its cards.

### 11.5 Seeding a registry from a founding corpus — a worked example

No two projects seed the same content: each fills the registry with its own instances of the generic categories above. Seeding is ordinary ingestion at cold start (§3): the founding corpus enters as class 2/3 sources and its accepted knowledge files under the domains. As an illustration only — every detail below belongs to one project, an AI orchestration platform described by a set of system-overview documents — such a corpus would seed:

| Domain | First sources — one project's example |
|---|---|
| `identity` | Its identity package: an identity document (values hierarchy, decision principles, behavioural boundaries), a voice specification (vocabulary, formality gradients per context, emotional range), an ethics framework, relationship-health and purpose-alignment measures, and sentiment baselines — the copy-defining authority its overview requires every customer-facing output to pass through |
| `discovery` | Its user research to date: its personas with their mental models, core loops, and key metrics; its evidence-board assumptions awaiting validation; its market landscape, competitor analysis, and ranked problem inventory as far as they are written |
| `product` | Its vision and explicit non-goals; its bets and their metrics (an NPS target, a decision-resolution latency, an error-recovery rate); its capability framework; its phased roadmap with exit criteria |
| `delivery/ux` | Its interaction principles (never ask what you can infer; show, don't ask; one decision per screen; smart defaults) and cognitive-load budget; its information architecture of surfaces; its collaboration patterns; its reference exemplars |
| `delivery/eng` | Its tech stack (languages, frameworks, services, platform constraints); its architecture overview (four layers with a failure-isolation constraint); its event-sourcing schema and aggregate types — the data models and event formats; its APIs and object relationships; its metric definitions — the observability standard |
| `delivery/orchestration` | Its orchestration pipelines and workflow definitions — how work is decomposed across agents, coordinated, and recomposed; its context-engineering approach; its evaluation dimensions (correctness, completeness, grounding), testing hierarchy, and quality gates; its prompt versioning strategy (immutable versions, releases mapping versions to environments); its shadow and canary experiments with single-click rollback; its continuous-evaluation loop |
| `delivery/generation` | Its per-provider prompting knowledge as far as written — its prompt-compiler layering conventions, output-format recipes, and model-routing rules ("cheap model for drafts, best model for finals") — entering at T1 from vendor documentation and its own overviews, each awaiting a comparative trial before promotion |
| `handbooks` | Its write-back rule; its ways of working (standing teams + dynamic squads); its per-layer quality gates; its release ladder (1 % → 5 % → 25 % → 100 % with auto-halt); its security boundaries, permission model, and audit expectations |
| `operations` | Its monitoring and alerting standards, metric definitions, and SLO targets as designed; its incident-response process; runbooks and known issues accumulate once production traffic arrives, each validated use corroborating them (per the Operations Graph specification) |
| `go-to-market` | Its positioning and messaging, derived from the upstream core — the personas it targets, the vision it sells, the voice it speaks in; its GTM strategy (target segment, channels, launch motion); its content strategy, from which the content backlog is minted; campaign briefs as campaigns are planned, with their measured results returning as digest feeds (§8); its open questions (pricing, segment focus) entering as assumptions and intents rather than knowledge until evidence lands |
| `content` | Derived from `go-to-market` as strategy lands: its content calendar enters as a versioned living source (§6), and its content-creation workflow is the producer this domain's knowledge — above all the voice specification — constrains |
| `decisions` | Seeded as decisions are made; the first candidates are `go-to-market`'s open questions above, once resolved |

## 12. Assertion kinds — what a statement is

Domains say what area of the project knowledge concerns; they do not say what *kind* of assertion it is — and "42% of users abandon the flow", "the product must not require account creation", and "the team decided to defer multi-region" demand different treatment even inside one domain. Every Claim and Knowledge Card therefore carries a mandatory field:

`assertion_kind: observation | interpretation | hypothesis | requirement | constraint | decision | recommendation | forecast`

Promotion, contradiction, freshness, and corroboration rules are defined over **domain × assertion kind**:

| Kind | Gains authority by | Loses authority by | Freshness behaviour |
|---|---|---|---|
| `observation` | Independent corroboration (§14) | Contradicting observations; retraction of its source | Decays; refreshed by new observation |
| `interpretation` / `hypothesis` | Corroborating evidence; validation | Failed test; stronger counter-interpretation | Stays provisional until tested; decays |
| `requirement` / `constraint` | **Approval** — governance, not evidence | **Supersession through governance**; a constraint may also be voided by environmental or architectural change | No empirical decay; reviewed on horizon |
| `decision` | The human gate that minted it | A **new decision** that supersedes it, rationale preserved | Never decays (§11 registry) |
| `recommendation` | Steward acceptance | Supersession | Decays |
| `forecast` | Cannot become accepted fact; held provisional | **Expires** at its stated horizon; resolved by the observation that confirms or refutes it | Hard expiry, never indefinite |

The founding specification is the canonical illustration: it is not empirical evidence accumulating corroboration — its requirements and decisions derive authority from **approval**, and challenging one is a governance event (class 3 through a Decision), not a statistical one. Without this field, the graph would apply empirical confidence rules to normative project authority.

## 13. Disposition and impact class

Routing separates **what happened** (disposition) from **how much ceremony it earns** (impact class). Triage first assigns a disposition:

`disposition: irrelevant | duplicate | corroborating | incremental | novel | contradictory`

Each disposition has distinct graph behaviour — an exact duplicate is a no-op against the existing source identity; irrelevant material stops after the Triage Record; corroborating material updates evidence breadth, confidence, and (where eligible, §18) freshness. Impact class is then **derived** from disposition × affected authority — from the actual nodes and edges the material touches, never from the domain name alone:

| Class | Derived from | Source page | Claim handling | Human review | Cascade |
|---|---|---|---|---|---|
| **0** | `irrelevant` (log only), `duplicate` (identity link only), or `corroborating` (evidence + eligible freshness update) | None (logged on the Triage Record) | Corroboration linked; counts and confidence updated | None (automatic) | None |
| **1 — Incremental** | `incremental`: extends an existing card within its scope; nothing canonical changes | Lightweight stub | New provisional claim attached; strictly additive (§16) | Asynchronous; auto-accepts after an SLA window unless vetoed | None |
| **2 — Novel** | `novel`: no existing home, or affects an intent/spec without contradicting it | Full source page | New claims + a candidate knowledge card | **Required** steward decision | Propose-only: affected specs/intents linked |
| **3 — Disruptive** | `contradictory`, or any disposition whose consequences invalidate a dependency, change a binding constraint or active commitment, or force re-evaluation of released or planned work | Full source page | Claims + a **mandatory Contradiction Record** | **Required** steward decision; may require a Decision node | **Mandatory** (§20) |

Class follows consequences: a voice-card update that clarifies examples and touches nothing is class 1; one that invalidates product copy, campaign templates, and the content calendar — visible as the `constrains` edges it would break — is class 3. The cross-domain edge patterns (§19) make such blast radii *predictable*; they never make a domain class-3 by name. Class and disposition are both fields on the Triage Record and Source, so the ceremony a document received is auditable, and claims may revise the class upward with recorded rationale.

## 14. Trust, corroboration, and evidence independence

Every source carries a **trust tier**:

| Tier | Examples |
|---|---|
| **T0 — Primary / authoritative** | Peer-reviewed work, first-party telemetry, reproduced experiments |
| **T1 — Reliable secondary** | Reputable reporting, official and vendor documentation, a single internal experiment, expert opinion |
| **T2 — Unverified** | Blog posts, individual user feedback, unreplicated anecdotes |
| **T3 — Speculative** | Rumor, forecast, unbased opinion, unchecked agent inference |

Promotion is gated by trust × corroboration:

- **Provisional → accepted** requires corroboration weight above a threshold. One T0 source may suffice; T1 needs some corroboration; T2/T3 cannot alone reach accepted — they must accumulate multiple **independent** corroborations rising to effective T1.
- **Accepted → superseded** requires evidence at least as strong as what established the conclusion. A lone T2/T3 source may **challenge** (open a contradiction) but never **supersede**.
- **Any** source may open a contradiction regardless of tier; only sufficiently strong evidence can **resolve** one, via a human-gated Decision or supersession.

A claim's and a card's **confidence** is qualitative (low / medium / high), derived from four dimensions — best-source trust, corroboration breadth (independent sources), contradiction level, and freshness — and is never collapsed into a fake-precision number.

What earns a tier differs by domain, so each Domain Definition names exemplars: first-party telemetry and a reproduced benchmark are T0 for `delivery/eng`; a completed campaign's measured results are T0 for `go-to-market`; a well-run primary study is T0 for `discovery`; the approved identity definition is T0 for `identity`; an operational finding carrying its evidence trail and an owner-confirmed root cause is T0 for `operations`; and a **comparative trial** — paired Generation Records over one brief and manifest, guideline on and off, judged by verification results and the brief's pinned metrics — is T0 for `delivery/generation`, where official vendor documentation alone is T1: it describes intent, not observed improvement. The tiers, thresholds, and promotion rules themselves are domain-independent; the *examples* above are defaults only, and domain trust policy overrides them. Trust is also **claim-relative**: official documentation is authoritative for supported parameters, documented behaviour, and declared limits, and merely secondary for comparative quality, production reliability, cost, or suitability — the same source can be T0 for one claim and T1 for another, and the Triage Record says which.

**Evidence independence is a recorded property, not a count.** Ten articles repeating one press release are one origin, and two experiments over one dataset are not fully independent. Each evidence record carries `origin_id`, `publisher_id`, `derived_from`, `methodology_id`, `dataset_id`, `observed_at`, `applicable_period`, and `conflict_of_interest` where known; **corroboration breadth is computed over distinct origins and methodologies**, never raw source count, and syndication collapses into the origin it derives from.

# Part IV — Lifecycle and governance

## 15. The ingestion pipeline — a routed funnel, not a uniform line

Every source enters one funnel whose width depends on impact:

1. **Capture** — the raw source lands in `sources/` (discrete) or is generated as a digest/internal source (§8). It is immutable; updates create new versions (§6).
2. **Triage** — the front door (§10) mints a **Triage Record** assigning an impact class (§13), a **domain** from the registry (§11), and a routing decision.
3. **Route by class** —
   - **Class 0 / 1** take the **fast path**: corroborate or provisionally extend existing knowledge, no source page, no synchronous steward review.
   - **Class 2 / 3** take the **full path** (defined below), plus a mandatory contradiction record and cascade for class 3.
4. **Settle** — each entity reaches its own terminal state (§6): the capture stands; the run completes or fails; the proposal is accepted, rejected, deferred, or withdrawn; the card advances. There is no single "source state" — the entities settle independently, in separate merges (§25).

**The full path, step by step.** For a class 2/3 source:

1. **Source page** — a project-facing analysis of the source: summary, candidate claims, the specs and intents it affects, and any contradictions it raises.
2. **Claim extraction** — discrete, checkable Claims are extracted, kept distinct from the analyst's own interpretation.
3. **Knowledge comparison** — each claim is compared against the existing graph and labelled: support, overlap, duplicate, contradiction, or obsolete.
4. **Promotion proposal** — the comparison output becomes a proposal: a new or updated Knowledge Card, a supersession, a contradiction record, a new or revised Intent, a spec-amendment proposal, or a Drift Item.
5. **Steward review** — the Promotion Proposal is a pull request gated by CODEOWNERS; promotion is a merge.
6. **Graph update** — the accepted change is applied to the graph, with statuses and links updated.

The full path is the **class 2 / 3 branch** of this funnel, not the universal path.

## 16. Class-1 autonomy — the additive boundary

Class 1 is **strictly additive** — the precise boundary of what may happen without a human:

It may automatically: attach a provisional claim to an existing card; add a supporting evidence link; update evidence indexes and derived confidence; refresh freshness where the eligibility rules hold (§18); create its lightweight source stub (the class-1 exception to "source pages are class 2/3 only" — a stub is provenance, not analysis); and notify the steward's digest.

It may never automatically: alter a card's canonical conclusion or wording; broaden a card's scope; change a `requirement`, `constraint`, or accepted `decision` (§12); amend a specification; or touch roadmap commitments. **Any change to canonical meaning is class 2 or 3 by definition** — the auto-accept window applies to additions around accepted meaning, never to the meaning itself. The steward's veto window (§17) closes the loop: what auto-accepted is visible as a digest, and a veto reverts the addition, not a rewrite.

## 17. Steward review and the queue

`pending-review` proposals sit in a **review queue**, grouped by steward and impact class. Service expectations by class: **3** expedited, **2** standard, **1** auto-accepts after a window unless a steward vetoes, **0** never queued. The queue makes the steward's load visible and bounded, and lets ingestion run continuously while review happens asynchronously — a proposal awaiting a steward blocks nothing else.

The steward no longer reviews every document. They work a bounded queue:

- **Class 0** never appears.
- **Class 1** appears as a digest of auto-accepted incremental updates, with a veto window.
- **Class 2** appears as discrete promotion decisions (new knowledge).
- **Class 3** appears expedited, as contradiction or design-impact decisions, each carrying the affected downstream nodes the cascade flagged.

The queue is grouped **class × domain**, and CODEOWNERS over `knowledge/<domain>/` (§25) routes each review to that domain's steward — the go-to-market steward never triages event-schema changes, and vice versa. A class-3 item touching several domains reaches every touched steward, with the primary domain's steward owning the decision. Domain Definitions name the stewards, so registering a domain is also declaring who reviews it (§11).

What reaches a human is, by construction, the novel, the conflicting, and the design-affecting — and nothing else.

## 18. Knowledge freshness and decay

Accepted knowledge does not stay accepted forever by default. Each card carries:

- `review_by` — a domain-dependent horizon by which it should be re-validated.
- `last_refreshed` — updated whenever corroborating evidence is absorbed.
- `freshness` — derived; once past `review_by`, the card enters a soft **stale** state and surfaces in reports for re-validation.

The `review_by` default comes from the card's Domain Definition (§11) — a quarter for `go-to-market`, `content`, and `operations`, up to a year for `delivery/eng` and `handbooks`, no decay for `decisions` — and any card may override its default with a recorded reason. One clock per domain replaces one clock for everything: campaign knowledge surfaces for re-validation while architecture is still comfortably fresh.

Corroborating ingestion (class 0) refreshes the horizon; absence of any corroboration lets a card age toward stale. Decay prevents the silent rot of conclusions the project has stopped re-examining, and it gives low-cost class-0 ingestion a second job beyond confidence: keeping the graph current.

**Refresh eligibility.** Not every corroborating source resets the clock. A refresh requires evidence that is **newly observed** (its `observed_at`, not its ingestion date — the four dates are distinct: ingested, published, observed, applicable period), **independent** (a new origin, not syndication), **in scope** (the same market, segment, or system the card speaks about), and **trusted enough** for the domain and assertion kind. An old article newly ingested, a syndicated copy, or a restatement without new observation corroborates confidence at most — it never refreshes `review_by`.

# Part V — Propagation

## 19. Canonical cross-domain edges

Domains would be mere filing without the edges between them. These six patterns are conventions over the existing typed links — no new mechanism — and they are where the cascade (§20) earns its keep:

1. **The strategic core grounds go-to-market.** `go-to-market` strategy cards carry `depends-on` edges to the `discovery`, `product`, and `identity` cards they are built on — the personas targeted, the bets being sold, the voice they speak in. A superseded persona or a pivoted vision therefore cascades into positioning and the GTM plan before anything else does; strategy is never left standing on invalidated foundations.
2. **Go-to-market drives the backlog — and its order.** Accepted `go-to-market` strategy cards — positioning, the GTM plan, the content strategy — carry `affects` edges to the intents they motivate, in every domain, and the launch motion they define is a first-class input to cycle derivation (§24): it sets the MVP cut and breaks ordering ties. The backlog and its sequence are thereby *traceably* driven by strategy, and a repositioning is class 3 by construction: the cascade re-opens dependent intents and re-orders the implementation guide rather than trusting anyone's memory to.
3. **Content depends on go-to-market.** The social strategy and each content-calendar entry carry `depends-on` edges to the GTM cards they execute; published-content performance returns as digest sources (§8) that corroborate or challenge those cards. The loop from strategy to publication to evidence closes inside the graph — and, through pattern 1, evidence that challenges the strategy can reach all the way back to the discovery assumptions beneath it.
4. **Identity constrains copy.** The tone-and-voice and values cards attach `constrains` to every brief whose deliverable contains outbound language — product surface copy, blog, social. A voice change is disruptive by construction and reaches the content calendar, post templates, and product strings through the cascade.
5. **Discovery evidences product.** Problem-inventory and research cards `support` the product bets they justify. An evidence-board pattern maps directly onto this machinery: an assumption is a provisional card, its evidence entries are corroborating or contradicting sources, and its green/amber/red status is the card's confidence — a bet resting on a red assumption inherits low confidence, and the handbook quality bar decides whether that blocks.
6. **Handbooks and orchestration constrain delivery.** The quality bar, release process, and security expectations attach as standing `constrains` on every brief — the domain most often linked and least often changed. Where `delivery/orchestration` is registered, it adds the AI-specific gate: eval dimensions and the shadow → canary → rollback ladder constrain every brief that ships model-touching behavior, and release evidence from those runs auto-captures as internal sources (§8).

Patterns 1–3 chain into one traceable line — discovery, product, and identity ground the go-to-market strategy, which drives the intent backlog, its implementation order, and the content that executes it — so a change anywhere on the line propagates forward through proposals, and evidence flows back up it.

## 20. The propagation matrix and the cascade

When ingestion **challenges, supersedes, or retracts** a knowledge card — or accepts a claim that affects a specification — the cascade engine walks the existing typed links to the dependent specs, intents, roadmap items, and briefs, and emits — per dependent — the consequence the **propagation matrix** assigns. The matrix is what makes cascade severity mechanical rather than agent interpretation: each edge type × event type names one consequence.

| Edge (dependent side) | Challenge | Supersession | Retraction | Staleness |
|---|---|---|---|---|
| `depends-on` | Review required | Review required; dependent flagged outdated | **Invalidated pending re-validation** | Notify |
| `supports` (evidence) | Confidence reduced | Evidence re-pointed or reduced | **Evidence invalidated**; confidence recomputed | Confidence decays |
| `constrains` | Review required | Dependent outdated — re-check against the new constraint, implementation not presumed wrong | Constraint void; review required | Notify |
| `affects` | Notify | Review required | Review required | Notify |
| `implements` / `realised-by` | Review required | **Re-opened intent proposed** | **Re-opened intent proposed**, expedited | Notify |

Consequences are proposals, graded: *notify* is a steward ping; *confidence reduced/recomputed* is a derived-field update; *review required* is a Drift Item; *outdated/invalidated* is a Drift Item that blocks dependent promotion until resolved; *re-opened intent* is a proposed intent state change. For every dependent the cascade emits the matrix consequence plus a steward notification.

The cascade only ever **proposes** through links that already exist, and acceptance of every downstream change stays human. This preserves governing principle 4 (§3) — new knowledge changes future work only through explicit links — while removing the silent gap where a challenged card left its dependents quietly wrong.

Domains make the cascade's highest-value walks legible in advance: the canonical cross-domain edges (§19) are precisely where a change in one domain must not leave another silently wrong — a superseded persona under `discovery` reaches the positioning built on it; a repositioning under `go-to-market` reaches the intent backlog, the implementation guide's order, and the content calendar; a voice change under `identity` reaches every outbound-copy brief.

## 21. Contradiction and retraction

Contradictions are first-class: a contradiction record captures both sides, and nothing is resolved by silently rewriting the older node — only sufficiently strong evidence resolves one, via a human-gated Decision or supersession (§14). The steady state needs one further distinction:

- **Supersession** (`supersedes`) — the older conclusion is replaced by a stronger one. Provenance is retained; downstream work continues under the new conclusion.
- **Retraction** (`retracts`) — the **basis was invalid** (fabricated source, error, withdrawn paper). Everything derived from it is flagged invalid pending re-validation, and the cascade (§20) runs with higher severity. Retraction is rarer and stronger than supersession, and conflating the two would let invalid evidence keep propagating under the gentler "replaced" framing.

# Part VI — Delivery integration

## 22. Integration: one path in, two seams into the delivery system

This engine is an extension of the delivery system's Specification Graph, and it connects to that system at two seams.

**Seam 1 — knowledge becomes intent (what to build).** Material enters as Sources, becomes Knowledge, and from there — under human approval — flows into the Specification Graph (approved design) and the Intent Graph (future work). The *Spec → Intent* decomposition therefore operates on the **intelligence graph**, not on raw documents: an intent is derived from accepted knowledge and the specs it affects, and carries links back to both. At cold start this is the founding spec being ingested, turned into knowledge and specification nodes, and seeding the founding backlog; in steady state it is a class-2 source minting a new intent or a class-3 contradiction re-opening an existing one through the cascade. Either way intents reach the delivery system's intake the same way, and that system expands each into contracts, briefs, lanes, patches, and evidence as before.

**Seam 2 — knowledge grounds implementation (how to build it).** Ingested data is not only an input to *planning*; it is durable context for *building*. When the delivery system turns an intent into code, the relevant knowledge is linked into the **Implementation Brief** and consulted by its agents — the spec writer, the code archaeologist, the implementation agents — so they build from established project context rather than reconstructing it from conversation or guesswork. The most valuable categories of such context are:

- **Tech stack** — languages, frameworks, services, versions, platform constraints → linked as `constrains` on the brief; bounds the candidate patches the proposal market may generate.
- **User journeys** — flows, personas, and experience rules → linked as `supports` / `constrains`; informs acceptance criteria and what "done" must look like.
- **Requirements** — functional and non-functional expectations → become acceptance criteria on the brief.
- **Specs** — approved design for the affected area → the relevant **Specification Nodes** the brief already references.

These four categories are instances of one general rule — the **brief recipe** each Domain Definition carries (§11): what a brief pulls from that domain, and by which edge. The four map onto the registry — tech stack is `delivery/eng`, user journeys are `delivery/ux` (with `discovery`'s personas behind them), requirements are `product`, specs are the domain-tagged Specification Nodes — and the recipes extend the same treatment to the rest: `identity` supplies the tone-and-voice definition as `constrains` on any deliverable containing outbound language; `handbooks` supplies the quality bar and release process as standing constraints; `delivery/orchestration`, where registered, supplies eval gates and the rollout ladder for model-touching work; and `delivery/generation`, where registered, supplies the accepted per-model guideline cards for any generation-bearing brief — the cards the Provider Runtime applies at prompt assembly and pins as `guided-by` on the resulting Generation Records. The brief assembles by walking domain-tagged edges, not by an agent remembering what matters.

So the intelligence graph is the project's durable memory feeding both ends of delivery: it is where work is decided (Seam 1) and the context against which that work is built (Seam 2). The same knowledge card that justified an intent can later ground the patch that implements it, with the trace intact from source to code.

## 23. Delivery obligations and recurring work

Not every accepted card implies work: a persona informs, a constraint bounds, a decision may *close* work, a research card may only strengthen a direction. Cycle derivation therefore requires an explicit **delivery obligation** before knowledge can generate a cycle — stated as edge conventions over existing links, no new node type:

- `requires-delivery` — this knowledge obliges the project to build something; the gap comparison reads exactly these.
- `realised-by` / `satisfied-by` — the obligation is met; points at the capability, release, or evidence that meets it.
- `validated-by` — the knowledge is confirmed by delivered work without having obliged it.
- `informs-only` / `constrains` — context and bounds; **never independently generates a cycle**.

Assertion kinds (§12) supply the defaults — `requirement` cards default to `requires-delivery`; `observation`, `interpretation`, and `recommendation` default to `informs-only`; `constraint` to `constrains`; `decision` to whichever its content states — and triage proposes the edge with the card, so the steward accepts obligation and knowledge in one gate.

**Recurring obligations are not capabilities.** Publishing to a content calendar, running periodic campaigns, refreshing evaluations, revalidating knowledge — these never become "done" and must not sit in the gap report forever or vanish after one execution. A card whose obligation is recurring carries a **recurrence policy** (cadence or trigger, owner, the definition or command that executes an instance) instead of `requires-delivery`; instances are executed work (scheduled Actions, the engines’ commands, or the companion workflow platform), and the derivation counts recurring obligations as *standing*, never as unimplemented.

## 24. Cycle derivation — the implementation guide as DAG and waves

One pass through the delivery system's command sequence — capture an intent, propose and select a contract, brief, implement, evidence, and for multi-lane work integrate — is a **cycle**: the unit of delivery that takes a single intent from capture to delivered evidence. Planning, in this engine, is deriving which cycles to run and in what order.

The intelligence records and the delivery records live in one file-based graph; for this derivation they are treated as two subgraphs, separated only to make the comparison clear:

- the **intelligence graph** — accepted Knowledge Cards, approved Specification Nodes, and the intents they motivate: what the project has established it should build;
- the **delivery graph** — contracts, briefs, patches, evidence, integrations, and releases: what has actually been built and proven.

An **unimplemented capability** is a `requires-delivery` obligation (§23) the delivery graph does not cover — knowledge without an obligation edge informs and constrains the derivation but never generates a cycle. The comparison finds three kinds of gap:

1. Accepted knowledge or an approved spec with **no intent yet minted** — Seam 1 (§22) not yet crossed.
2. An intent that exists but is **still open** — captured, but not yet addressed by delivered evidence.
3. An intent previously addressed whose **grounding knowledge was since challenged, superseded, or retracted** — re-opened through the cascade (§20).

The derivation then turns the delta into an ordered plan: gaps are grouped into capabilities at the trade-off grain — each admitting one genuine implementation trade-off and one coherent, evidenceable "done"; dependencies are drawn between them (foundational, component, hardening); the result is a **dependency DAG rendered as executable waves** — blocked and ready states per cycle, prioritization inside each wave — never a single total order that fabricates sequence where none exists; **prioritization follows an explicit precedence policy**: (1) mandatory legal, security, and safety work, (2) active incident and reliability risk, (3) hard technical dependencies, (4) committed delivery obligations, (5) go-to-market sequencing, (6) uncertainty reduction and strategic value — the accepted `go-to-market` strategy orders the *discretionary* space inside what the mandatory ranks and dependencies leave, and the launch motion defines the **first launch tranche**: the waves that must ship for launch; and each capability is emitted as a full desired-outcome intent with a work-class — **one cycle each**, carrying links back to the knowledge and specs that motivate it, exactly the links Seam 1 requires of every intent. When no GTM strategy is accepted yet, ordering falls back to uncertainty and value alone — and the derived guide is itself a signal that the `go-to-market` domain needs writing.

Each emitted cycle inherits the domain of the knowledge and specs that motivate it, so the implementation guide reads as a plan **across** domains, and the domain map (§25) shows where the intelligence graph is rich but delivery is absent. Domains also widen what "unimplemented" means without changing the derivation: a positioning card carrying `requires-delivery` toward a campaign is a gap the same comparison finds — while the calendar it feeds is a recurring obligation (§23), standing rather than unimplemented. Non-engineering cycles enter intake identically and produce their own evidence — the published artifact and its results feed (§8) — while only code-bearing cycles proceed into the delivery system's contract-brief-patch machinery. Gap kind 3 widens the same way: measurements that missed their pinned targets and operational write-backs group, at the same trade-off grain, into **improvement cycles** — a defect-fixing round, a campaign’s next iteration — ordered and released like any other.

The emitted artifact is the **implementation guide**: the ordered, work-classed series of cycles that, run in order through the delivery system, implements every unimplemented capability — its first launch tranche as the accepted `go-to-market` strategy defines it. It is generated, never hand-maintained — a report (`reports/implementation-guide.md`, §25), regenerated as knowledge and delivery move, and never canonical graph state. Derivation is propose-only: the comparison mints no intent, and a human releases each cycle into intake — `/capture-intent`, with the emitted specification as its input — once the cycles it depends on are delivered. Principle 4 (§3) is preserved: the guide orders future work; accepting any of it stays human.

**The same comparison, turned on the graph itself.** Delivery gaps are not the only kind the one graph exposes. The **coverage derivation** compares the intelligence graph against the domain registry: each registered domain, checked against its canonical artifact types (§11.1), yields the knowledge gaps — a canonical type with no accepted, in-horizon card — and the §19 dependency chain orders them: a domain’s gaps become actionable once the domains it grounds on are seeded, so `discovery`, `product`, and `identity`, grounded on nothing, always surface first, and `go-to-market` surfaces the moment that core is seeded, its own canonical artifacts becoming the prompts. Knowledge gaps are not cycles — they are filled through ingestion (capture sessions, research, founding documents), not through delivery — so they emit as suggested actions on the Review spec’s progression surface, not into the implementation guide.

At cold start the delivery graph is empty, so everything the ingested founding specification established is unimplemented, and the first derivation **is** the founding implementation guide — while the coverage derivation at the same baseline is the project’s onboarding: every core canonical artifact is a gap, surfaced in dependency order — the same operation the steady state runs after every accepted change, seen at a different baseline density (§3). The derivation is also the planning counterpart of drift detection: drift finds where delivery diverged from established design; cycle derivation finds where established design still awaits delivery. Among them, the one graph answers “is what we built still true?”, “what do we build next?”, and — through the coverage derivation — “what does the graph still need to know?”

# Part VII — Execution

## 25. GitHub-native realization

The engine's records live in `docs/project-intelligence/`, all Markdown, reviewable in Git, usable without a database:

- `sources/` — captured sources, with `digests/` for Digest Sources and `internal/` for auto-captured internal sources — the Operations Graph's emitted learning, and the delivery graph's release evidence and drift items.
- `domains/` — the domain registry: one Domain Definition per domain, CODEOWNERS-gated (§11).
- `knowledge/<domain>/` — the knowledge layer, gated by CODEOWNERS (§13, §17); knowledge files by primary domain, so review routes by path. **Delivery-owned records live in checkpoint 1's own paths** — specs, intents, and roadmap under the delivery graph's tree, never under `docs/project-intelligence/`: ingestion's proposals target those paths under their own gates (§4).
- `triage/` — Triage Records (one per source), the audit trail of routing decisions.
- `reports/` — generated, never hand-edited: `freshness.md` (stale-knowledge surfacing), `review-queue.md` (steward load by class and domain), `corroboration.md` (claims awaiting promotion thresholds), `domain-map.md` (per-domain coverage: card counts, confidence mix, staleness, open intents — the balance view that surfaces a blind spot like an empty `go-to-market` instead of leaving it to be discovered), and `implementation-guide.md` (the derived cycle order — §24).

No part of this engine is new software. Every mechanism above is one of the delivery system's existing primitives:

| Mechanism | GitHub-native realization |
|---|---|
| Triage gate (§10) | A script + GitHub Action on the pull request that adds a source; deterministic parts (content-hash identity, freshness) are scripts, the semantic parts (novelty, contradiction, domain classification) are Claude-assisted and warn-first — exactly as drift review is in the delivery system |
| Impact class (§13) | A `class` field on the Source and Triage Record, the same shape as the delivery system's work-class |
| Domain registry (§11) | One Domain Definition file per domain under `domains/`; registration and retirement are class-2 pull requests gated by CODEOWNERS |
| Domain classification (§10) | A `domain` field on Source, Triage Record, Claim, and Card, assigned at triage; `knowledge/<domain>/` paths route steward review |
| Fast path, class 0/1 (§15) | A change request applied by `graph-maintainer` — the corroboration edge and confidence/freshness update; class 0 may auto-merge, class 1 auto-merges after an SLA window via a scheduled Action unless a steward applies a veto label. **Branch protection differs by path**: additive-evidence paths (corroboration links, evidence indexes, stubs) take status checks without required review, so unattended auto-merge is possible; `knowledge/<domain>/` canonical files and every delivery-graph path keep required CODEOWNERS review — the class-1 boundary (§16) is exactly the line between the two policies |
| Steward review, class 2/3 (§17) | Pull-request review gated by CODEOWNERS over `knowledge/<domain>/` and, for proposals into delivery-owned records, that graph’s own paths; promotion is a merge |
| Review queue (§17) | A GitHub Projects board synced one-way from the graph, with saved views per impact class and domain — the board is a view, never edited as truth |
| Entity lifecycles (§6) | State fields on Source Capture, Processing Run, Promotion Proposal, and Card, advanced by commits; Git history is the audit trail. **PR boundaries are the transactions**: capture merges first and stands alone; analysis output second; the promotion proposal third; the canonical mutation last — rejecting any later stage never unwinds an earlier one |
| Cascade (§20) | A script + Claude-assisted Action that walks the edge table on an accepted challenge/supersede/retract, writes Drift Items, and opens Issues to notify stewards |
| Continuous feeds / digests (§8) | A scheduled Action (cron) that pulls a feed, computes baseline deviation, and writes a Digest Source plus claims only on anomaly |
| Freshness / decay (§18) | A scheduled Action that scans `review_by` against each domain's default horizon, marks cards stale, and regenerates `reports/freshness.md` |
| Domain map (§11, §24) | A scheduled Action regenerating `reports/domain-map.md` from the generated indexes |
| Concurrency / idempotency (§6) | Content-hash + source-ID keys and Git's merge model; a processing lease is a claimed branch or draft pull request |
| Cycle derivation (§24) | A Claude-assisted command/Action that compares the intelligence and delivery subgraphs through the generated indexes and regenerates `reports/implementation-guide.md`; propose-only — each cycle enters intake through a human-run `/capture-intent` |
| Overrides | Override nodes with `waives` edges in the graph, as in the delivery system — never in CI logs |

Enforcement is progressive and override-able, exactly as in the delivery system: a check blocks only once the artifact it guards is produced consistently, and every blocking check supports an override node with a recorded reason.

## 26. Claude Code surface

The agents that do the work are Claude Code subagents and slash commands defined in the repository, exactly as in the delivery system, and GitHub Actions invoke them headlessly so the same definitions serve an interactive session and an automated run alike.

**Subagents** (`.claude/agents/`), each narrow and single-responsibility:

- `triage` — runs the triage gate (§10): identity, relevance, novelty, and contradiction against the graph, trust tier, impact class, and domain (primary and secondaries) against the registry's scope statements, written to a Triage Record. Deterministic parts (content hash, freshness) call out to scripts; the semantic comparison is the agent's judgement, warn-first.
- `source-analyst` — for class 2/3, writes the Source Page, extracts discrete Claims, and runs the knowledge comparison (§15, full-path steps 1–3), keeping the source's claims distinct from its own interpretation.
- `promotion-proposer` — turns comparison output into proposals (§15, full-path step 4): a new or updated Knowledge Card, a supersession, a contradiction record, a new or revised Intent, a spec-amendment proposal, or a Drift Item — never a silent promotion.
- `cascade` — on an accepted challenge, supersession, or retraction, walks the edge table and applies the propagation matrix (§20), emitting the graded consequences as change requests and opening Issues for stewards.
- `cycle-planner` — compares the intelligence graph to the delivery graph (§24): finds unimplemented capabilities, sizes them to the trade-off grain, draws their dependencies, orders them, and emits the implementation guide. Proposals only; it mints no intent.
- `graph-maintainer` — the delivery system's existing sole writer to the graph, reused unchanged: it applies node/edge/status changes, authors no relationship outside the edge table, never deletes (supersedes), regenerates indexes, and runs validation after every change. The ingestion agents produce judgement; only `graph-maintainer` writes.

**Slash commands** (`.claude/commands/`), thin helpers that parse `$ARGUMENTS`, load context through the generated indexes rather than by globbing the corpus, delegate to an agent, and end by invoking `graph-maintainer` to regenerate indexes and pass validation before committing:

- `/ingest <path-or-url>` — capture a source into `sources/` and run triage.
- `/triage <source-id>` — (re-)run the triage gate on a captured or changed source.
- `/promote <source-id>` — produce the promotion proposal for a class-2/3 source.
- `/cascade <node-id>` — run the cascade for a challenged, superseded, or retracted node.
- `/register-domain <id>` — draft a Domain Definition from a scope statement and open the class-2 registration pull request (§11).
- `/refresh-knowledge` — run the freshness scan and regenerate `reports/freshness.md` and `reports/domain-map.md`.
- `/digest <feed>` — generate a Digest Source from a continuous feed, emitting claims only on baseline deviation.
- `/review-queue` — sync the steward queue to the Projects board.
- `/derive-cycles` — compare the intelligence graph to the delivery graph and regenerate `reports/implementation-guide.md`, the ordered series of cycles for every unimplemented capability.

**CLAUDE.md** — the delivery system's repo-root operating instructions, extended for ingestion: where sources enter and that they are immutable; how triage assigns impact class and domain and what each class requires; that the registry under `domains/` is the closed list triage classifies against, and no domain exists until its definition merges; when steward review is mandatory (class 2/3) and what auto-absorbs (class 0/1); that only `graph-maintainer` writes to the graph; that the cascade only ever proposes and humans decide; that the implementation guide is derived by `/derive-cycles` and each cycle enters intake only through a human; and the trust × corroboration rules for promotion.

**Headless invocation** — every Claude-assisted check in §25 (triage novelty/contradiction/domain, cascade, cycle derivation) runs the same subagent non-interactively from a GitHub Action (`claude -p`), so an analyst at a terminal and an automated pull-request check execute identical definitions.

**Supporting features, added only when a real need appears** — hooks can auto-run `/triage` when a source lands; skills (`SKILL.md`) carry doc-type-specific extraction recipes, which naturally organize by domain (a campaign-brief recipe, a PRD recipe, an incident recipe); MCP connectors can pull external sources into `sources/`. Consistent with the delivery system's progressive approach, none of these is built before it is needed.

## 27. Failure and recovery

Ingestion fails in ordinary ways — fetch failures, unsupported formats, agent timeouts, malformed output, validation failures, merge conflicts, unavailable stewards, broken feeds — and each has a defined recovery rather than an invented one:

- **Retry with policy.** Transient failures (fetch, timeout, rate limit) retry with backoff inside the Processing Run; the run records each attempt. Deterministic failures (unsupported format, malformed output) fail the run immediately.
- **Failed runs are visible, not lost.** `reports/failed-ingestion.md` is the dead-letter surface: every `failed` Processing Run with its error, attempt count, and the paste-ready recovery command. `/reprocess <source-id>` opens a superseding run; a source failing repeatedly escalates to its domain steward as a queue item.
- **Leases expire.** An Actions concurrency slot released by a crashed run frees on job termination; a stale `leased` state past its timeout is reset by the scheduled hygiene pass, and the idempotency keys make the rerun converge.
- **Validation before commit.** `graph-maintainer` validates every change request before applying; a validation failure fails the run, never half-writes — and since PR boundaries are the transactions (§25), there is no partial canonical state to roll back.
- **Broken feeds alarm by silence.** A continuous feed that stops producing digests past its cadence is itself an anomaly on the feed’s baseline, surfaced in the same report.
- **Non-deterministic classification is auditable.** Two runs disagreeing over one source is not a crash — the runs’ recorded rationales (§6) make the disagreement reviewable, and the steward’s resolution is a manual override on the surviving run.

## 28. Forward fixes to checkpoint 1

The GitHub Workflow Specification is implemented and frozen; what this version needs from checkpoint 1 arrives as contract-driven schema migrations and validation extensions through its own lifecycle:

1. **Schema migration — ingestion vocabulary** (where not yet landed): node types `source`, `source-page`, `claim`, `knowledge-card`, `triage-record`, `digest-source`, `retraction-record`, `domain-definition`, `processing-run`, `promotion-proposal`, `contradiction-record`; edges `corroborates`, `retracts`, `version-of`, `requires-delivery`, `realised-by`, `satisfied-by`, `validated-by`, `informs-only`.
2. **Field migrations**: `assertion_kind` and `disposition` on the types that carry them (§7); `storage_mode` on Source.
3. **Validation extensions** to `spec:validate`: every Claim and Card carries `domain` and `assertion_kind`; every accepted mutation cites an accepted Promotion Proposal; every `requires-delivery` edge originates from an accepted card; capture, analysis, proposal, and mutation arrive in separate merges; tombstones preserve hash and reason.
4. **Projects view fields**: disposition, entity states, failed-run count — added to the existing one-way sync; the board remains a view.

## 29. Success criteria

The ingestion engine works when:

- A document that merely corroborates accepted knowledge is absorbed with **no steward involvement**, raising confidence and refreshing freshness.
- Genuinely new, contradictory, or design-affecting material **reliably escalates** to a steward, and nothing of that kind is auto-absorbed.
- **No spec amendment, decision, intent, or roadmap change** ever happens without a human, even as the volume of ingested material grows.
- A continuous feed produces claims **only on deviation**, never as a flood.
- A challenged, superseded, or retracted card leaves **no dependent silently wrong** — every dependent is flagged for human re-evaluation.
- Steward load stays bounded and visible as inflow scales.
- The project's **intent stream keeps flowing** from incoming knowledge, with the steady state feeling like a quiet, well-filtered queue rather than a backlog of unread documents.
- The **founding specification enters as a source** and produces knowledge and specification nodes before any intent is minted; no intent exists without a source-and-knowledge trail behind it.
- Every accepted card carries a **primary domain from the registry**; nothing files as miscellaneous, and substantive material with no home visibly proposes a new domain rather than forcing a bad fit.
- Stewards see **only their domains' queues**; a cross-domain class-3 item reaches every steward it touches, with the primary domain's steward owning the decision.
- A `go-to-market` strategy change **reliably re-opens the intents it drives and re-orders the implementation guide** — launch-tranche scope and wave order included — and a challenged `discovery`, `product`, or `identity` card **reliably reaches the strategy built on it**. The chain runs through edges, not memory.
- Registering a **project-specific domain** (such as `delivery/orchestration` for an AI orchestration project) is one reviewed pull request and no engine change.
- **Freshness clocks differ by domain**: campaign knowledge surfaces for re-validation while architecture knowledge is still fresh, and the domain map keeps per-domain coverage and staleness visible.
- The brief for outbound-copy work always carries the **current tone-and-voice definition**; the brief for model-touching work always carries the **eval gates and rollout ladder**; the brief for generation-bearing work always carries the **accepted guideline cards for its provider/model**.
- A **model guideline** enters as a source like anything else, is promoted only on comparative evidence of real improvement, and is challenged by its own measurements when it decays — prompting knowledge travels the same gates as every other conclusion the project relies on.
- A **publication's performance digest scores against the metrics its plan pinned**, and a target miss reliably reaches — as a challenge through this gate, never an edit — the strategy cards the work expressed.
- Comparing the intelligence graph to the delivery graph yields the **implementation guide** — a dependency DAG of work-classed cycles rendered as executable waves, covering every `requires-delivery` obligation, each entry traceable to the knowledge and specs that motivate it; recurring obligations report as standing, never as unimplemented. At cold start, this derivation over the ingested founding spec **is** the founding implementation guide; thereafter it regenerates as knowledge and delivery move, and is never hand-maintained.
- When the delivery system turns an intent into code, the relevant **tech stack, user journeys, requirements, and specs reach its agents through the brief**, not reconstructed ad hoc — with the trace intact from source to patch.
- Every ingestion step runs as a **Claude Code subagent or slash command** that a GitHub Action can invoke headlessly, so an analyst at a terminal and an automated pull-request check execute the same definitions — and only `graph-maintainer` writes to the graph.
- A rejected promotion **never unwinds the capture**; a failed processing run is visible in the dead-letter report with its recovery command; and rerunning any stage converges idempotently.
- A `requirement` is never outvoted by articles: normative authority changes **only through governance**, while observations rise and fall on independent corroboration — `domain × assertion kind` rules, applied mechanically.
- Ten syndicated copies of one press release count as **one origin**, and freshness refreshes only on newly observed, independent, in-scope evidence.
- A source containing personal or licensed content is captured under the **storage mode** its content demands, and a legal deletion leaves a tombstone and re-validation flags, never silent absence.
