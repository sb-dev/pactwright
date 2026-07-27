# Graph Review & Creative Asset Delivery — Two Engines, One Multi-Provider Runtime (v10)

> **Scope.** This spec defines two engines and their shared execution layer, all operating **over** the one project graph and all orchestrated by **Claude Code**: the **Review Engine** — standing specialist reviewers (a UX researcher, a GTM strategist, an architecture reviewer, and others) that examine the graph itself and propose improvements — and the **Creative Delivery Engine** — the production of text, image, audio, and video assets as versioned, evidence-carrying deliverables, with the same lifecycle discipline as code. Claude Code cannot natively reach every model the engines need — image, speech, transcription, video, grounded search, and non-Claude text models — so both engines rest on the **Provider Runtime**: the engines’ external-model gateway, a pluggable TypeScript layer over the Anthropic, OpenAI, Gemini, and Perplexity SDKs, open to further providers. The runtime extends the models available to Claude Code; it does not replace Claude Code as the orchestrator. This spec adds **no fourth checkpoint of truth**: the delivery graph (checkpoint 1) is extended only through its own forward-fix migrations (§22); the intelligence graph with its ingestion engine (checkpoint 2) is extended only through its registry’s standard path (§16); and the Operations Graph (checkpoint 3) is consumed as-is — it governs what the project builds and ships, and the machinery defined here is **not its tenant**: failures surface where commands execute, spend is stopped and reviewed at the runtime choke point (§8), drift returns as findings through triage (§9–§10), and defects in the runtime itself are ordinary checkpoint-1 work, the tool being a deliverable of the very delivery system it serves. Reviews enter the graph through ingestion; assets travel the delivery lifecycle; guidelines travel ingestion’s promotion gates; measurements travel its feed machinery. The spec is generic throughout; material specific to any one project appears only in the worked examples (§23).

## 1. Purpose

The three checkpoints make the graph the project’s memory: what it knows and intends, how intent becomes shipped software, and what happens in production. Three things they do not yet provide:

1. **Nothing examines the graph itself.** Drift detection finds where delivery diverged from design, and cycle derivation finds where design awaits delivery — but no standing perspective asks whether the *design is good*. Are the user journeys coherent end to end? Is the positioning still consistent with the personas? Is the architecture accumulating unowned complexity? Today those questions are answered only when a human happens to ask them.
2. **Only code ships with discipline.** The delivery graph gives software intents, candidate contracts, critic panels, competing patches, human selection, evidence, and releases. The project’s *creative* output — a GTM campaign’s social images, audio, and video; a blog post or newsletter written from graph knowledge — has no equivalent path. The ingestion spec already declares that published artifacts live outside the graph while their sources, knowledge, and links live inside it; this spec supplies the missing production lifecycle in between: how a creative intent becomes versioned, grounded, human-approved assets with evidence and a performance loop.
3. **Claude Code cannot reach the models the engines need.** It orchestrates agents, commands, and graph interactions, but it has no native access to image, speech, transcription, or video generation, to grounded search, or to non-Claude text models — and model choice has folklore where it needs knowledge: the same brief is not prompted the same way to every model, and what works per provider/model changes with every release, currently living in prompt files and heads — unversioned, unevidenced, unable to improve through the gates everything else improves through.

Both engines therefore rest on the **Provider Runtime**: a thin, repo-local TypeScript package exposing a capability-typed interface, shipped with Anthropic, OpenAI, Gemini, and Perplexity adapters, and open to more through the same interface and a registration path modelled on the domain registry. Those SDK calls are also a **new token-consumption vector** the project did not have while interactive Claude Code sessions were the only surface: headless invocations, concurrent lanes, and expensive media calls can spend without a human watching, which is why cost controls sit at the runtime choke point (§8).

**Core principle, carried from the delivery system: GitHub-native, not a custom platform.** No review service, no digital-asset-management system, no rendering farm. Reviewers are agent definitions plus scheduled Actions; assets are content-addressed files in the repository (Git LFS for binaries) with graph nodes carrying their provenance; the runtime is a library invoked by commands and Actions, never a running service. Every mechanism this spec names is realized by the primitives the three checkpoints already use.

## 2. Design rationale — why standing reviewers, why one runtime, why assets as delivery

**Why standing reviewers rather than ad-hoc prompts.** Anyone can paste "review our user journeys" into a session today. That produces unversioned judgement: no record of what slice of the graph was read, which model produced the opinion, what it found last quarter, or whether its suggestion was ever adopted or rejected. A review that cannot be compared to its predecessor cannot detect regression, and a finding that leaves no node behind cannot be routed, deduplicated, or learned from. Reviews therefore become first-class: a **Review Definition** fixes the perspective, scope, and rubric; a planned, snapshotted execution records exactly what was read (by index-view snapshot and content hash) and by which provider and model; **Review Findings** enter the graph as internal sources through the existing triage gate, where impact class, steward routing, deduplication, and the cascade already apply. Nothing in ingestion changes; reviews are one more producer of internal sources, exactly as the Operations Graph's learning is.

**Why one pluggable runtime rather than per-tool scripts.** The obvious design would call each vendor SDK directly from whichever script needs it. That design fails four ways: capability drift (image generation exists in two SDKs today and a third tomorrow, and every call site would need to know); no provenance (nothing normalized records model, parameters, prompt version, and input hashes, so no asset or review is reproducible or auditable); no market (the lane market taught the system that eligibility plus a default plus a recorded reason beats hard-coding an owner — the same applies to models); and no budget seam (cost ceilings need one choke point, not N). The runtime fixes all four with one interface, adapters behind it, catalog files in front of it, and a **Generation Record** minted for every call.

**Why assets as versioned delivery rather than a content folder.** A campaign image that cannot be traced to the positioning card it expresses, the voice specification it complied with, and the human who approved it is a liability the moment strategy pivots or the voice changes — the cascade cannot reach what the graph cannot see. Treating assets like patches — competing candidates, comparison records, an independent verification lane, human selection, evidence, release, and supersession instead of deletion — makes creative output as accountable as code, and lets the existing cross-domain machinery (identity constrains copy; content depends on go-to-market; performance returns as digests) operate on it without new mechanisms.

**Why metrics as pinned configuration rather than post-hoc analytics.** A campaign whose success criteria are chosen after the results arrive can never fail, and therefore can never teach. Declaring metrics at planning time — this deliverable type, these metrics, these targets, this measurement window — makes underperformance a fact the graph can route (a challenge to the very cards the work expressed) instead of an opinion in a retrospective. Different deliverables measure differently — a social post by conversion and screen prints, a blog post by views, a shipped UX capability by web analytics — so the metric set is registry configuration, not engine behavior.

**Why Claude Code stays the only orchestrator.** The engines’ lifecycles are sequences of judgement — snapshot, generate, critique, compare, select, verify, publish — and Claude Code commands and subagents already sequence judgement everywhere else in the system. Adding a second orchestration layer for the same lifecycles would split every question in two: which layer owns the gate, which owns the retry, which owns the record. So the split is by kind, not by layer: **Claude Code orchestrates the lifecycles; the Provider Runtime executes individual external model operations** — resolve the catalog, select the model, assemble the prompt with accepted guidelines, enforce cost limits, invoke the adapter, mint the Generation Record. The creative lifecycle needs no plan object above it because its own objects already are the plan: the selected concept is the approved shape, the briefs are the stage specification, the comparisons are the merge.

**Why guidelines as knowledge rather than code or prompt text.** How to prompt a given provider/model well is genuine project knowledge: it is learned from evidence, it decays as models change, it can simply be wrong, and it should improve over time under review. That is precisely the lifecycle the ingestion engine already gives knowledge cards — sources, trust × corroboration, human promotion, freshness horizons, supersession, and the cascade. Burying per-model guidance inside each prompt file would duplicate it unversioned; hard-coding it in the runtime would hide it from review. Guidelines therefore live in the intelligence graph as ordinary knowledge cards in a registered domain (§16); the Provider Runtime *applies* accepted cards at assembly time and *records* exactly which versions it applied.

## 3. Core thesis and governing principles

Reviews and creative production are **the delivery discipline applied to judgement and media**: perspectives generate options, critics and verifiers expose weaknesses, records are durable, humans select, and everything significant leaves nodes and edges behind.

The governing principles:

1. **The graph is the subject and the ground.** Reviewers read the graph through its generated indexes and views; asset briefs carry an explicit grounding manifest of knowledge cards. No reviewer opines on, and no asset asserts, what the graph does not contain — external claims enter through ingestion first.
2. **Propose-only, sole writer, human gates — unchanged.** Reviewers and creative agents produce judgement and candidates; `graph-maintainer` remains the only writer; findings change intended truth only through ingestion's triage and promotion gates; no asset publishes without human approval.
3. **Every generation is a recorded event.** Provider, model, parameters, prompt version, applied guideline versions, input manifest, cost, and output hash — one Generation Record per call, the creative counterpart of the delivery graph's evidence discipline and the Operations Graph's change-event anchoring.
4. **Providers are a market, not a hard-coding.** Capability-typed catalogs pair each task class with eligible provider/models and a default; deviation states a reason; the pairing is recorded. Adding a provider is an adapter plus a registration PR, no engine change.
5. **Ceremony scales with blast radius.** Reviews carry impact through triage's existing classes; creative work carries the delivery graph's work classes — a single social post is class 1, a full campaign or anything touching positioning is class 2/3 with critic panels and human gates at selection.
6. **Assets are immutable and content-addressed.** Updates create new versions that supersede; publication is a recorded event; performance returns as digest sources, closing the loop the ingestion spec's cross-domain patterns already draw.
7. **Verification is independent of generation.** The agent (and by default the provider) that verifies an asset — factual grounding, voice compliance, rights, accessibility — is never the one that generated it, mirroring the test-writer separation.
8. **Claude Code orchestrates; every external call goes through the Provider Runtime.** No agent calls a vendor SDK or an adapter directly. Every engine execution leaves provenance behind: a Review Execution records what a review read and produced; the creative lifecycle’s own objects — concept, brief, comparison, verification, publication — record what creative work decided and did. Nothing is edited in place; repeats and revisions supersede.
9. **Success is declared before work runs.** Class 2+ concepts pin Metric Definitions with targets and windows at selection; Measurements return through digests and corroborate or challenge the cards the work expressed. A metric miss is learning, never a silent shrug — and never an automatic strategy change.
10. **Prompting knowledge travels as knowledge.** Model guidelines are knowledge cards in `delivery/generation`, promoted only on comparative evidence of real improvement, applied by the runtime only once accepted, and pinned (`guided-by`) in every Generation Record they shaped.

## 4. Design goals

The system must:

- Provide a **pluggable provider interface** in TypeScript with first-party adapters for the Anthropic, OpenAI, Gemini, and Perplexity SDKs, and a documented path to add adapters without touching call sites.
- Type providers by **capability** — text, structured output, grounded search, image, speech synthesis, transcription, video, embeddings — declared per adapter and verified at registration.
- Maintain a **provider registry and model catalogs** as CODEOWNERS-gated repository files, mirroring the domain registry and the lane market.
- Mint a **Generation Record** for every runtime call, sufficient to reproduce or audit the call: provider, model, parameters, immutable prompt version, applied guideline card versions, input manifest with content hashes, seed where supported, cost, latency, output hash.
- Run the **modality lanes of one campaign concurrently** — copy, image, audio, video fanned out by Claude Code, verification joining them — and let independent engine work (a review, a social batch, a blog post) proceed in parallel, serialized only at the graph writer and the human gates.
- Enforce **generation cost controls at the runtime choke point**: per-call caps from catalogs and Provider Definitions, a cumulative per-command budget, and hard period ceilings on recorded actuals; refuse and record calls that would exceed; surface spend in the runtime’s own reports and feeds, watched by its own reviewers.
- Make **success metrics configurable**: Metric Definitions registered per deliverable type; concepts pin them with targets and windows at selection; digest feeds score them into Measurements; verdicts route as learning through ingestion.
- Treat **model guidelines as evolving knowledge**: register the `delivery/generation` domain; ingest candidates from vendor docs, observed records, and findings; promote only on comparative trial evidence; apply accepted cards at prompt assembly; supersede as models move, with the cascade reaching everything that cited them.
- Run **standing specialist reviews** of any slice of the graph on a cadence or trigger, from a registered roster of Review Definitions, each with a fixed perspective, scope, rubric, and steward.
- Route **Review Findings into ingestion as internal sources**, so triage, impact classes, steward review, corroboration, and the cascade govern their promotion into intents, spec amendments, or drift items.
- Let the **same review run on multiple providers**, with disagreement between models surfaced as signal rather than averaged away.
- Carry creative work through the **delivery lifecycle**: creative intent → candidate concepts (contracts) → specialist critics → human selection → decomposition into per-modality asset briefs with an independent verification lane → competing candidate assets → comparison → human selection → evidence → publication release → measurement.
- Ground every asset in an explicit **grounding manifest** of knowledge cards (the voice specification always included for outbound language, per the canonical `constrains` pattern), hash-pinned at generation time.
- Store assets as **immutable, content-addressed, versioned files** — text in-repo, binaries via Git LFS, oversized media via GitHub Releases with hash pointers — with supersession, never deletion.
- Record every **publication** (channel, URL, version, approver) and receive its **performance as digest sources** through ingestion, scored against the concept's pinned metrics.
- Stay **GitHub-native**: repository files, the typed edge table, Actions, PRs, CODEOWNERS, Projects, Git LFS, and Claude Code — no service, queue, database, scheduler, or DAM.

## 5. Non-goals

- It does not add a fourth checkpoint or a second pipeline. Reviews enter through ingestion; creative work travels the delivery lifecycle; guidelines travel ingestion's promotion gates; this spec adds node types and a runtime, not authority.
- It does not auto-apply any review finding. A finding becomes an intent, amendment, or drift item only through triage and human promotion — principle 4 of ingestion, preserved.
- It does not auto-publish. Every publication is human-approved; scheduled posting of an approved asset is permitted, autonomous publishing of an unapproved one is not.
- It does not define a workflow scheduler or a workflow-definition engine — no generic plan/run orchestration, no stage DAGs, no reservation accounting. The engines' lifecycles carry their own execution records (Review Executions; the concept–brief–comparison chain), and that is all they need.
- It does not auto-promote a guideline because a vendor published it. Vendor documentation enters at its trust tier like any source; promotion requires comparative evidence of real improvement (§16).
- It does not let a metric miss change strategy automatically. Measurements challenge cards through ingestion's ordinary machinery; humans decide what the miss means.
- It does not build an analytics warehouse. Channel and product analytics live in their own tools; the feed machinery carries scored observations in as digests, and the graph holds Measurements, not event streams.
- It does not build a DAM, CMS, or rendering platform. Published artifacts live in their destination channels; the repository holds the canonical versioned asset and the graph holds its provenance.
- It does not run the Provider Runtime as a service. It is a library invoked by commands, agents, and Actions; it holds no state beyond the records it writes through the normal PR path.
- It does not replace Claude Code as the orchestration surface. The runtime exists for external model calls only; orchestration, graph maintenance, and human interaction remain where they are.
- It does not embed API keys or per-provider credentials in the repository. Keys arrive via Actions secrets or local environment only.
- It does not fine-tune models, host models, or manage provider accounts; it consumes hosted APIs through their official SDKs.
- It does not let a generator verify its own output (§14), and it does not let cost optimization silently override a catalog default — deviation always states a reason.

## 6. The Provider Runtime — the engines’ external-model gateway

The runtime is one workspace package, `packages/provider-runtime/`, plus one thin CLI entry (`spec:generate`, §20) that commands and Actions invoke. Its shape:

**Capabilities.** A closed, extensible enum the whole system shares:

```
text | structured | grounded-search | image | tts | transcription | video | embeddings
```

**The engine-facing interface.** Agents and commands call one method and never anything below it:

```ts
interface ProviderRuntime {
  generate<T>(request: GenerationRequest<T>, context: GenerationContext): Promise<GenerationResult<T>>;
}
```

A `GenerationRequest<T>` carries the required capability, the task-class catalog id, the prompt input and output schema where applicable, modality-specific parameters, and — only with a stated reason — a provider/model override. A `GenerationContext` carries the calling engine (`review | creative`), the calling node (brief, concept, or Review Execution id), the grounding manifest, the prompt-template version, the execution budget (§8), and the expected artifact type. For each call the runtime performs, in order: catalog resolution; provider/model selection (the market, §7); guideline resolution (§16); prompt assembly; cost checking; adapter invocation; usage and error normalisation; Generation Record creation; result return.

**The internal adapter contract.** Each provider implements identity, capability declaration, and only the methods for capabilities it has — translating the normalised request into vendor SDK calls, returning output plus provider usage and request metadata, and normalising provider errors. Adapters own nothing else: no catalog or policy decisions, no grounding, no guideline resolution, no cost policy, no Generation Records. **Agents never call adapters directly.**

```ts
interface ProviderAdapter {
  readonly id: string;                       // "anthropic" | "openai" | "gemini" | "perplexity" | ...
  readonly capabilities: Capability[];
  listModels(): Promise<ModelInfo[]>;        // id, capabilities, context/limits, cost hints
  generateText?(req: TextRequest): Promise<Generation<TextArtifact>>;
  generateStructured?<T>(req: StructuredRequest<T>): Promise<Generation<T>>;
  groundedSearch?(req: SearchRequest): Promise<Generation<GroundedAnswer>>; // answer + citations
  generateImage?(req: ImageRequest): Promise<Generation<BinaryArtifact>>;
  synthesizeSpeech?(req: TtsRequest): Promise<Generation<BinaryArtifact>>;
  transcribe?(req: TranscriptionRequest): Promise<Generation<Transcript>>;
  generateVideo?(req: VideoRequest): Promise<Generation<BinaryArtifact>>;  // or start/resume, below
  embed?(req: EmbeddingRequest): Promise<Generation<number[][]>>;
}
```

Every `Generation<T>` returns the artifact plus the normalized metadata the Generation Record needs (model, parameters as sent, usage in tokens, cost, latency, provider request id). Long-running providers (video, batch) additionally expose a **resumable job contract** — `start(request) → ProviderJob` and `resume(job) → ProviderJobResult` — a provider-job lifecycle, not an orchestration model: the job reference persists in the Generation Record so an interrupted command resumes the render instead of paying for it twice; callers that don’t care still see one promise. Adapters normalize errors into a shared taxonomy (auth, rate-limit, content-policy, budget-refusal, transient, permanent) so retry and fallback policy lives once, in the runtime, not per adapter.

**Prompt assembly.** For a given call the runtime composes: the immutable prompt template version (§18) + the **accepted `delivery/generation` guideline cards** applicable to the chosen provider/model (§16), each hash-pinned. The Generation Record carries `guided-by` edges to the guideline versions applied, alongside its `grounded-in` edges to the manifest. Templates carry the task's structure and rubric; guidelines carry the per-model shaping; both are versioned, both are pinned, neither hides in the other.

**First-party adapters.**

| Adapter | SDK | Capabilities (initial) |
|---|---|---|
| `anthropic` | `@anthropic-ai/sdk` | text, structured |
| `openai` | `openai` | text, structured, image, tts, transcription, video, embeddings |
| `gemini` | `@google/genai` | text, structured, image, tts, video, embeddings |
| `perplexity` | OpenAI-compatible client against the Perplexity API | text, grounded-search |

Capability rows are **claims verified at registration** (§7), not documentation trusted forever: a provider's capability set is re-checked by a smoke test in CI, and gaining or losing a capability is a registry change like any other.

**Extension.** A new provider is: implement `ProviderAdapter` in `packages/provider-runtime/adapters/<id>/`, pass the shared adapter conformance test (interface shape, error taxonomy, Generation Record completeness, budget observance), and open the class-2 registration PR (§7). No call site changes; catalogs opt the new provider into task classes explicitly.

**Keys and budgets.** Credentials resolve from environment only (`<ID>_API_KEY`), locally or via Actions secrets. The runtime enforces the cost controls of §8 — per-call caps, the per-command budget, and period ceilings on recorded actuals — refusing calls that would exceed them and recording refusals; a rerun with a raised limit is a recorded override, never a silent bypass.

## 7. Provider registry and the model market

Mirroring the domain registry and the lane market:

**Provider Definitions** — `providers/<id>.md`, CODEOWNERS-gated, one per adapter: capability matrix, available models with cost and limit notes, data-handling notes (training-use policy, retention — inputs may include unreleased strategy), trust notes, and the steward accountable for the entry. Registration and retirement are class-2 changes; retirement is supersession, and the cascade proposes re-pointing catalogs that referenced it.

**Model catalogs** — `.claude/models/<task-class>.md`, one file per task class (e.g. `review-analysis.md`, `copy-generation.md`, `image-generation.md`, `video-generation.md`, `grounded-research.md`, `verification.md`), each with frontmatter `eligible` (provider/model pairs) and `default`, plus sections *Suits* (what this task class covers) and *Trade-off notes*, which may cite the accepted guideline cards that inform them. The **model market** runs per call: the runtime picks `default` unless a stated reason favors another eligible pair; winner and reason are recorded in each Generation Record (and on the Review Execution for reviews). Runtime discovery (`listModels()`) validates the registry in CI; it never silently determines production eligibility — the repository-controlled definitions and catalogs are the source of truth. A drift test pins the market mechanically: every catalog entry resolves to a registered provider and a model its adapter lists; `default` is a member of `eligible`; every guideline card a catalog cites resolves to an **accepted** card in `delivery/generation`; and `verification.md`'s eligible set is disjoint from the generating catalog's chosen pair for any given brief (the separation-of-duties invariant, §14).

## 8. Generation cost controls — the runtime choke point

The TypeScript SDKs are a token-consumption vector the project did not have when interactive sessions were the only surface: headless invocations, concurrent lanes, retries, and video-class calls can spend without a human watching. The controls sit where every call already passes — the runtime — and stay deliberately simple: everything computes from recorded actuals; reservation accounting is deliberately absent.

**Per-call caps.** Catalogs and Provider Definitions may cap any call: maximum tokens, maximum cost, image count and resolution, audio and video duration, quality tier, and parameters that are prohibited or approval-required. The runtime refuses a non-conforming call before the adapter sees it.

**Per-command budgets.** Every command invokes the runtime under a `GenerationBudget { executionId, maxCostUsd }` — a cumulative ceiling for that execution. The runtime meters each call against it and refuses the call that would exceed it; the refusal is itself a recorded Generation Record naming the budget. A human may rerun the command with a higher limit; the override and its reason are recorded.

**Period ceilings.** `providers/budgets.yaml` declares hard ceilings in **tokens and currency** per provider, per task class, and in total, per period. The runtime refuses any call once the period’s **recorded actuals** exceed the ceiling — a hard stop computed from Generation Records alone: no reservations, no admission mathematics, no state beyond the records. Tokens catch runaway context assembly and retry loops before any invoice does; currency catches expensive modalities that token counts do not measure.

**Watching spend — the runtime watches itself.** Every call’s actual usage and cost live in its Generation Record; `reports/provider-spend.md` aggregates them by engine, task class, provider, model, modality, command, and period, in tokens and currency, against the ceilings. Spend digests into `delivery/generation` on the ingestion spec’s feed machinery; the **cost-reviewer**’s scheduled pass turns a drifting baseline into a finding — an internal source through triage, earning attention the way every other conclusion does. Editing `budgets.yaml` remains a gated change.

## 9. The Review Engine

**Review Definitions** — `reviews/definitions/<id>.md`, CODEOWNERS-gated, one per standing reviewer:

- **Perspective** — the single lens (user-journey coherence; positioning consistency; architecture health; graph hygiene; cost; accessibility; voice compliance across published assets).
- **Scope** — which slices of the graph it reads, expressed as index views and domain filters (e.g. `delivery/ux` knowledge cards, journey specs, and the intents touching them), never "the whole repo".
- **Rubric** — the questions it must answer and the finding format, so runs are comparable across time and providers.
- **Cadence and triggers** — scheduled (weekly, per release) and/or event-driven (cascade touched its scope; a domain's staleness crossed threshold; a release merged).
- **Model eligibility** — which task-class catalog governs it; optionally a second provider for cross-model corroboration.
- **Steward** — the human whose triage queue its findings reach.

**Review Executions.** Each review run mints one **Review Execution** record: the definition version; the trigger and timestamp; the resolved scope with the content hash of every node read; the catalog resolution and provider/model pairing with its reason; the Generation Records minted; the findings emitted; disagreement records where multiple models ran; completion status; and, when it repeats an earlier failed or disputed execution, a `repeats` link to it. Claude Code orchestrates the whole pass — load the definition, resolve and snapshot the scope, select eligible models through the catalog, invoke the Provider Runtime once per selected model against the *same* hashes, compare, emit — and a repeat reads the execution’s **recorded** snapshot, not the graph that has since moved, so findings across attempts are byte-comparable. A rubric change is a new definition version with provenance. What was read, which model ran it, and what it cost are facts, not folklore.

**Review Findings** are structured observations: the claim, the evidence (node ids), the suggested improvement, and a self-assessed severity. Each finding is emitted as an **internal source** into `sources/internal/` — exactly the seam the Operations Graph uses — and enters triage, where the standard machinery takes over: duplicates of prior findings corroborate rather than multiply; low-impact observations absorb cheaply; design-affecting findings route class 2/3 to the steward and, on acceptance, become intents, spec-amendment proposals, or drift items through the normal promotion path. A finding rejected in triage is a recorded rejection the next run can see — reviewers learn what the project has already declined.

**Cross-model corroboration.** Where a definition names two providers, both run the same rubric over the same snapshot — mechanically guaranteed because one execution invokes the runtime per model with identical scope hashes. Agreement raises the finding's initial confidence; disagreement is emitted explicitly as a lower-confidence finding pair for the steward — never averaged into false consensus.

**Improvement execution.** The Review Engine ends at the promoted intent. Executing the improvement is the delivery system's job (for spec/code changes) or the Creative Delivery Engine's (for asset changes); reviews create no side channel around either.

**Reviews that steer.** One review’s subject is the graph’s own coverage and momentum, and its findings are the system’s **suggested actions**. The `progression-reviewer` (§10) runs three comparisons, none new in kind: the **coverage derivation** (ingestion §24) — which registered domains are not yet *seeded* (accepted, in-horizon cards per canonical artifact type) and, past that bar, which declared coverage slots remain unsatisfied before a domain counts as *covered*, surfaced in the dependency order the registry and its cross-domain edges declare, so a domain’s gaps become actionable only once the domains it grounds on are seeded; **cycle readiness** — which derived cycles (software, creative, improvement rounds) have their dependencies delivered and await release into intake; and **momentum** — which standing reviews have lapsed cadence or scopes whose content hashes moved since their last snapshot, which publications sit past their measurement window unscored, which target misses have no follow-up round. Each suggestion in the emitted report (`reports/next-actions.md`, §20) names the gap, links its evidence, and carries exactly one paste-ready command: accepting a suggestion *is* running that command, and the node that results carries its own class and gates. Suggestions are pointers, never nodes — nothing enters the graph by being suggested, so the propose-only invariant holds untouched.

**Onboarding is this review at empty baseline, not a mode.** On a young graph the dependency order does the guiding by itself: `discovery`, `product`, and `identity` are grounded on nothing, so their canonical artifacts are the only actionable gaps and surface first; seeding them unlocks `go-to-market`, whose suggestions prompt for its own canonical artifacts — the GTM strategy, plan, and positioning; accepting those unlocks `content`, campaign work, and the first implementation guide. The operator is steered from an empty graph to a running project by the same review that will steer the mature one (§23 walks day zero).

## 10. Core reviewer roster

A starting set, extended per project through registration PRs exactly as domains are:

| Reviewer | Perspective | Typical scope | Typical cadence |
|---|---|---|---|
| `ux-researcher` | Do the user journeys hold together — coverage, dead ends, contradiction with personas and interaction principles? | `delivery/ux` + `discovery` cards, journey specs, open UX intents | Per release + monthly |
| `product-strategist` | Are bets, roadmap, and intents still consistent with discovery evidence and each other? | `product`, `discovery`, roadmap, implementation guide | Monthly |
| `gtm-strategist` | Does positioning still match personas and product truth; is content executing the strategy? | `go-to-market`, `content`, publication records, measurements | Monthly + post-campaign |
| `architecture-reviewer` | Structural drift, unowned complexity, constraint erosion across delivered change | `delivery/eng` cards, contracts, evidence, drift items | Per release |
| `graph-auditor` | Graph hygiene: orphan nodes, missing canonical edges, stale statuses, index anomalies | The whole edge table, via indexes | Weekly |
| `voice-auditor` | Do published assets still comply with the identity and voice cards that constrained them? | `identity` cards, assets, publication records | Monthly + on voice-card change |
| `cost-reviewer` | Provider spend vs. caps and ceilings; command budgets vs. actuals; catalog defaults vs. observed quality/cost | Generation records, budgets, catalogs | Monthly |
| `generation-reviewer` | Are catalog defaults and accepted guideline cards still earning their keep against observed records and measurements? | Generation records, `delivery/generation` cards, catalogs, `reports/guideline-impact.md` | Monthly + on model release |
| `progression-reviewer` | What should happen next — coverage gaps in dependency order, cycles ready for intake, lapsed reviews, unscored publications, unanswered target misses | Domain registry + Domain Definitions, implementation guide, Review Executions, `reports/metric-scoreboard.md` | Weekly + on merge to graph paths |

Each is one markdown definition; none requires engine change. The `ux-researcher` is the spec's canonical example: its findings ("journey X assumes a capability no spec provides"; "persona A's core loop has no journey at all") land as internal sources, triage classes them, the UX steward promotes the real ones to intents, and the delivery system builds the fix — the full loop with zero new authority.

## 11. Creative Delivery — the asset lifecycle

Creative work reuses the delivery lifecycle wholesale, orchestrated by Claude Code commands and subagents (§21). This section states only the mappings and additions.

1. **Creative intent** — captured like any intent, work-classed by blast radius: one social post riffing on accepted knowledge is class 1; a campaign, a newsletter with strategic claims, or anything expressing positioning is class 2; anything that would *change* positioning or voice is class 3 and belongs to ingestion/spec-amendment first — creative delivery expresses approved truth, it does not mint it.
2. **Concept market** — for class 2+, candidate **concepts** are the contract analogue: audience, message, channels, modalities, tone within the voice spec, the grounding manifest each concept rests on, and — first-class in this version — the **success metrics** to be pinned on the selected concept (§15), with proposed targets. Success criteria are part of the concept, not the retrospective. Multiple concepts, `proposes` edges, durable comparison, human selection — unchanged machinery.
3. **Critic panel** — routed by class and surface as in delivery, with the **Voice/Identity critic mandatory** for any outbound language or brand-bearing visual, and the GTM critic mandatory for campaign-class work.
4. **Decomposition into asset briefs** — one brief per modality lane: `copy`, `image`, `audio`, `video`, plus the independent **`creative-verification` lane** (§14). Each brief carries the grounding manifest (card ids + hashes, the voice specification always included per the canonical `constrains` pattern), the channel specs (dimensions, durations, formats), and its task-class catalog reference. The lane market pairs each lane with an owning agent from its catalog file, as in delivery; independent lanes run concurrently (below).
5. **Asset market** — where trade-offs are meaningful (hero image, campaign video, headline copy), competing candidate assets are produced — different eligible provider/models, different prompt versions, different guideline sets, or any combination — each with its Generation Record. A comparison node records the review-agent's verdicts; a human selects or requests synthesis. Routine class-1 assets take one candidate.
6. **Verification** — the verification lane checks the selected candidates (§14) and its report is part of the evidence.
7. **Evidence and integration** — evidence nodes per brief; an integration node reconciles multi-lane campaigns (does the video's script match the approved copy; do visuals carry the same message) — the same join delivery uses.
8. **Publication release** — a release node `includes` the evidence; a **Publication record** per channel captures where, when, which asset version, and who approved. Scheduled posting of the approved version is permitted; publishing anything else is not.
9. **Measurement loop** — on each pinned window, channel metrics return as digest sources on the ingestion spec's feed machinery and are **scored against the concept's pinned Metric Definitions**, minting Measurement records (§15) whose verdicts corroborate or challenge the content-calendar and GTM cards the assets executed — closing cross-domain pattern 3 with declared, not retrofitted, criteria. A miss becomes learning and, by human promotion, next quarter's intent like any other.

**Engine parallelism.** Independent modality lanes run concurrently: Claude Code fans out `/produce-assets` per lane — copy, image, audio, video at once — each invocation under its own per-command budget (§8), with the verification lane joining on their outputs. The merges are the lifecycle’s own objects, not a scheduler’s: complementary lanes **combine** at the integration node; competing candidates **select-best** through comparison and human selection; a directed recombination is the existing synthesis mechanics. Across workstreams, independent engine work — a review, a social batch, a blog post, a code cycle — proceeds in parallel with no coordination beyond what already exists: immutable content-addressed inputs mean concurrent readers race nothing, `graph-maintainer` behind PRs is the single writer, and human gates are queue items on the steward board, not locks. The known trade-off carries over: `edges.yaml` is a merge hotspot under heavy parallelism, and the sharding escape hatch (`graph/edges/<domain>.yaml`) applies unchanged if it bites.

## 12. Grounding — assets carry their truth

Every asset brief carries a **grounding manifest**: the knowledge cards, spec nodes, and (for data-driven pieces like a metrics newsletter) digest sources the asset may draw on, each pinned by content hash at brief creation. The rules:

- **Claims trace or die.** Any factual claim in generated copy must trace to a manifest entry; the verification lane fails claims it cannot trace. Wanting to say something the graph doesn't know is an ingestion task, not a prompt-engineering task.
- **Voice always rides along.** The current identity/voice cards are in every manifest whose deliverable contains outbound language — the brief seam the ingestion spec already promises, exercised here.
- **Hashes make drift visible.** If a manifest card is superseded between brief and publication, the standard cascade flags the brief and its assets, and flagged work re-verifies before publication — a campaign never ships on silently invalidated strategy.
- **Generation Records point back.** Every asset's record carries `grounded-in` edges to its manifest entries, so "which published assets rest on this persona?" is an edge walk, not an archaeology project.
- **Guidelines shape the asking; manifests bound the saying.** `grounded-in` points at the knowledge an asset may *assert*; `guided-by` points at the guideline cards that shaped *how the model was prompted* (§16). The verifier checks claims against the former; the generation-reviewer checks value against the latter; neither substitutes for the other.

## 13. Asset storage and versioning

- **Identity.** An asset's identity is its content hash; its node carries hash, media type, dimensions/duration, and storage pointer. Assets are immutable; a revision is a new asset node with a `supersedes` edge. Nothing is deleted.
- **Location.** Text assets (posts, scripts, newsletters) live in-repo under `assets/` as plain files. Images and audio live in `assets/` under **Git LFS**. Video and anything beyond the LFS comfort zone attaches to a **GitHub Release**, with the node's pointer carrying release tag + asset name + hash. In all three cases the node and hash live in the graph and the bytes are fetchable from GitHub — no third store.
- **Naming.** Content-addressed filenames (`<node-id>.<hash8>.<ext>`), so a stale reference is impossible and diffs never mutate media in place.
- **Rights.** The asset node records the license/usage terms the generating provider grants and any third-party inputs used; the verification lane checks the channel's requirements against them.

## 14. The creative-verification lane

The test-writer separation, applied to media. The verification lane is owned by a `creative-verifier` agent that is never the generator of the assets under review, running on a catalog whose chosen model must differ from the one that generated the asset being verified (pinned by the §7 drift test). It checks:

- **Factual grounding** — every claim traces to the manifest (§12); numbers match their digest sources.
- **Voice and identity compliance** — against the manifest's identity cards, with specific violations cited, not a vibe score.
- **Channel conformance** — dimensions, duration, character limits, format.
- **Accessibility** — alt text present and accurate, captions/transcripts for audio and video, contrast on text-bearing images.
- **Rights** — provider usage terms and third-party inputs compatible with the intended channels (§13).
- **Measurability** — the concept's pinned Metric Definitions have a live feed for each target channel; a campaign that cannot be measured is flagged before it publishes, not discovered at the window.
- **Safety/brand risk** — flags for human judgement; the verifier proposes, the human at selection decides.

Its report is a node, `evidences` the brief, and blocks the publication release while red.

## 15. Success metrics — declared, pinned, measured

Different deliverables succeed differently, and what counts as success is project configuration, not engine behavior.

**Metric Definitions** — `metrics/<id>.md`, CODEOWNERS-gated; registration is class 2; replacement is supersession, never deletion. Each declares: what is measured (name, unit, direction — higher or lower is better), the **source feed** it arrives by (the ingestion spec's feed machinery), the **window** at which scoring happens (e.g. +14 days, +30 days, per release), the **default target or threshold**, and the deliverable types it applies to. Illustrative pairings — every project registers its own:

| Deliverable | Typical metrics |
|---|---|
| Social post | Conversion rate; screen prints; click-throughs per channel |
| Blog post / newsletter | Views; read-through or open rate; attributed sign-ups |
| Shipped UX capability | Web analytics — activation, funnel completion, error-recovery rate |
| Standing review | Findings promoted vs. filed; rejected-finding recurrence |
| Model guideline (via controlled comparison) | Verification pass rate; market selection rate; cost per accepted asset |

**Pinning.** A class-2+ concept pins its metric set — definitions, targets, windows — via `targets` edges at selection, exactly as the concept market proposed them (§11); briefs inherit the pins. Publication (or, for product capabilities, the delivery graph's release) is the anchor every measurement attributes to.

**Measurement.** When a window opens, the feed's digest scores observed against target and mints a **Measurement**: `measures` the Publication or Release, `scores` the Metric Definition, cites the digest source behind it. Verdicts are graph facts, and they route as everything routes: a hit **corroborates** the cards the work expressed; a miss **challenges** them through ingestion's ordinary machinery — typically class 2, class 3 where it contradicts accepted strategy — and becomes an intent only by human promotion, never by reflex. `reports/metric-scoreboard.md` is generated from Measurements, per definition and per deliverable type.

Web-analytics metrics for shipped UX capabilities ride the same rails with a different anchor: the delivery graph's release, the feed digesting into `product` / `delivery/ux`, a funnel miss challenging the journey and bet cards behind the capability. No fourth checkpoint appears; this is checkpoints 1–3 doing their jobs with success criteria declared up front.

## 16. Model guidelines — provider knowledge that improves over time

**The problem.** One model wants XML-ish structure where another wants a JSON schema; one honors system-prompt nuance another flattens; parameter and formatting sweet spots differ per provider and *move* with every model release. Left implicit — in prompt files, in heads — unversioned, unevidenced, and unable to improve through review.

**The home.** This spec registers **`delivery/generation`** in the intelligence graph's domain registry — one reviewed PR, the registry's standard extension path, exactly as the Operations Graph registered `operations`:

| Domain | What it holds | Canonical artifact types | Default review horizon |
|---|---|---|---|
| `delivery/generation` | How generation providers and models are used well | Per-provider/model prompting guidelines; capability and parameter guidance; output-format recipes; known failure modes and workarounds; catalog trade-off evidence | 1 quarter — model releases move fast |

The Domain Definition carries the registry's standard fields: the provider steward owns `knowledge/delivery/generation/` through CODEOWNERS; the **trust exemplars** are what makes "real improvement" concrete — a **comparative trial** (paired Generation Records over one brief and manifest, guideline on vs. off, judged by verification pass and the brief's metrics) is T0; official vendor documentation is T1 (it describes intent, not observed improvement); a practitioner post is T2; and the **brief recipe** attaches the accepted guideline cards for the chosen provider/model to any generation-bearing brief, where the runtime applies them.

Guidelines are **ordinary knowledge cards** — no new node type. That is the point: sources, trust × corroboration, human promotion, freshness, contradiction, supersession, and the cascade all apply without a line of new machinery.

**The lifecycle — ingest, trial, promote, apply, measure, supersede.**

1. **Ingest.** Candidates arrive as ordinary sources: a vendor's release notes, the `generation-reviewer`'s finding from observed records, a verification-failure pattern, an engineer's note. Triage classes them into `delivery/generation`; a candidate contradicting an accepted guideline is class 3, as always.
2. **Trial.** Real improvement is demonstrated, not asserted: a **controlled comparison** runs the asset market with two candidates differing only in the candidate guideline — same brief, same manifest hashes, same model, one produced with the card applied and one without — and the comparison record, verification results, and (where windows allow) Measurements are the promotion evidence. This is ordinary engine machinery; a project may automate recurring trials however it wishes, but promotion never requires automation.
3. **Promote.** The steward promotes on trust × corroboration like any card. A card that never cleared a trial stays provisional, and **the runtime does not apply provisional cards**.
4. **Apply.** At prompt assembly the Provider Runtime resolves the accepted cards for the chosen provider/model, hash-pins them, and mints `guided-by` edges on the Generation Record (§6-style pinning, per §6). Which guidance shaped which output is an edge walk.
5. **Measure.** Because every guided record is walkable, `reports/guideline-impact.md` is generated from records and Measurements — market selection rates, verification pass rates, cost per accepted asset, per guideline version. The `generation-reviewer`'s monthly run reads the report, not recollection.
6. **Supersede.** A model release or a decaying scoreboard challenges the card — class 3 where it contradicts accepted guidance. Supersession cascades to the catalogs and prompt versions that cite it, and the cascade flags any unshipped brief whose records pinned the old card for re-verification — the same dead-strategy protection assets already enjoy.

## 17. Node and link types

New elements, extending — never replacing — the existing vocabulary. Creative work **reuses** intent, contract (as concept), brief, comparison, decision, evidence, integration, release, and override nodes, and the existing edges (`proposes`, `compares`, `selects`, `decomposes`, `competes-for`, `evidences`, `integrates`, `includes`, `learns-from`, `constrains`, `depends-on`, `supersedes`). Model guidelines reuse Source, Claim, and Knowledge Card wholesale (§16).

| Element | Definition | Key fields / behavior |
|---|---|---|
| **Provider Definition** | Registry entry for one adapter: capabilities, models, cost, data-handling, steward (§7) | Lifecycle `registered → superseded`; class-2 registration; CODEOWNERS-gated |
| **Generation Record** | The provenance of one runtime call: provider, model, parameters, runtime and adapter version, registry and catalog hashes, prompt version, applied guideline versions, input manifest + hashes, seed, usage, cost, latency, output hash, command budget drawn (§8) | Immutable; minted by the runtime, written by `graph-maintainer`; one per call, including failed/refused calls |
| **Review Definition** | One standing reviewer: perspective, scope, rubric, cadence, model eligibility, steward (§9) | Registry-style lifecycle; registration is class 2 |
| **Review Execution** | One review pass: definition version, trigger, scope + content hashes, catalog pairing with reason, Generation Records, findings, disagreements, status (§9) | Immutable once terminal; a repeat carries `repeats` to the execution it repeats |
| **Review Finding** | One observation: claim, evidence node ids, suggested improvement, severity | Emitted as an internal source into triage; duplicates corroborate; promotion is human |
| **Metric Definition** | One declared measure: name/unit/direction, source feed, window, default target, applicable deliverable types or workflows (§15) | `metrics/`, CODEOWNERS-gated; class-2 registration; supersession |
| **Measurement** | One scored window: observed vs. target for one publication/release under one metric (§15) | Immutable; minted by the digest machinery; verdicts corroborate/challenge through ingestion |
| **Asset** | One immutable creative artifact: content hash, media type, storage pointer, rights (§13) | `candidate → selected → published → superseded`; competes via `competes-for` on its brief |
| **Publication** | One channel release event: channel, URL/locator, asset version, approver, timestamp (§11) | The anchor Measurements attribute to |
| `generated-by` link | Asset or review output → its Generation Record | Every generated artifact carries exactly one |
| `grounded-in` link | Generation Record → the manifest entries it drew on (§12) | The walk from published claim back to knowledge |
| `guided-by` link | Generation Record → the accepted guideline card versions applied (§16) | Shaping, distinct from asserting; the walk from output back to prompting knowledge |
| `targets` link | Concept (or brief) → Metric Definition | Success declared before work runs |
| `measures` link | Measurement → Publication \| Release | The anchor scored |
| `scores` link | Measurement → Metric Definition | Which yardstick scored it |
| `reviews` link | Review Execution → the nodes in its scope snapshot | What was examined, explicitly |
| `emits` link | Review Execution → its findings' internal sources | The audit trail from execution to triage |
| `repeats` link | Review Execution → the failed or disputed execution it repeats | Same recorded snapshot, byte-comparable findings |
| `publishes` link | Publication → the asset version it released | One per channel per version |

## 18. Component versioning

Every component of the tool that shapes a run's behaviour is versioned, and the principle is single: **any record the system mints must answer "what produced this?" completely and immutably** — every execution must be attributable, and a repeat must mean the same thing as the attempt it repeats. Two mechanisms cover every component; nothing is exempt.

**Identity-versioned artifacts** — components that evolve deliberately and are compared across versions — carry a stable id plus semver, immutable per version, superseded never edited: prompt templates (`prompts/<name>@<semver>.md`), Review Definitions (`reviews/definitions/`, registry lifecycle), model catalogs (`.claude/models/<provider>@<semver>.md`), and Metric Definitions (`metrics/<id>.md` under graph supersession). Guideline cards get the same property from the intelligence graph itself: card versions, supersession, and the cascade. A version's release *is* its registration merge; its rollback is a superseding version; no release machinery beyond the PR exists or is needed.

**Repository-pinned components** — everything else behaviour-shaping, where per-file semver would be ceremony — are versioned by the repository and pinned at the point of use: the runtime packages and their adapters (package semver plus lockfile), `budgets.yaml`, subagent and command definitions (`.claude/`), and the Actions workflow files. A Review Execution pins its definition version, the content hashes of its scope, and the registry and catalog hashes it resolved against; every engine command records the commit SHA and host it executed from; a Generation Record names the runtime and adapter version, the registry and catalog hashes, provider, model, and prompt version (§17).

The two mechanisms meet at the same doors: a **repeat reads recorded hashes**, never the graph that has since moved, and the cascade flags anything whose pinned truth was superseded; changing any versioned component — a prompt, a definition, a catalog, a budget ceiling — is a normal work-classed change: the rubric that judges the graph, the orchestration that runs it, and the configuration that constrains it are themselves governed by the graph. Templates and guideline cards divide the labor as §6 states: structure and rubric in the template, per-model shaping in the cards, both pinned per call.

## 19. Governance, budgets, and safety

- **Human gates**: concept selection (class 2+), asset selection, publication approval, finding **and guideline** promotion (via triage), provider, reviewer, and metric registration, budget changes and **per-command budget overrides**. Agents propose everywhere; these are where humans decide.
- **Budgets**: per-call caps, per-command cumulative limits, and hard period ceilings on recorded actuals, all enforced at the runtime choke point (§8); the cost-reviewer watches the records; a raised limit is a recorded override with a reason, never a silent bypass.
- **Data handling**: manifests can carry unreleased strategy; Provider Definitions record each vendor's training-use and retention posture, and catalogs may restrict sensitive task classes (e.g. `grounded-research` over public questions only) to compatible providers.
- **Content safety**: the verification lane flags risk; the publication gate is human; nothing in this spec creates an autonomous path from model output to public channel; scheduled posting of an already approved asset is permitted, autonomous publication is not.

## 20. GitHub-native realization

- `packages/provider-runtime/` — the workspace package: runtime core, adapters, conformance tests. `pnpm spec:generate` is its CLI seam for commands and Actions.
- `providers/` — Provider Definitions and `budgets.yaml`; `.claude/models/` — the task-class catalogs (§7). Both CODEOWNERS-gated.
- `metrics/` — Metric Definitions, CODEOWNERS-gated. Review Executions and Measurements are graph nodes under `nodes/` like everything else.
- `reviews/definitions/` — Review Definitions. Findings land in `sources/internal/` (ingestion's directory, unchanged).
- `assets/` — text assets in git, binary assets in Git LFS; oversized media on GitHub Releases with pointers (§13). `prompts/` — versioned prompt files (§18).
- `nodes/` + `graph/edges.yaml` + `schema/` — unchanged home of graph state; the new node and edge types are schema migrations travelling the delivery workflow like any other (§22).
- **Actions**: cron and event triggers invoke `/run-review` per each definition’s cadence and `/measure` per pinned window (the **measurement scheduler**); scheduled posting of already approved assets where a channel permits it; the adapter conformance and capability smoke tests run in CI; existing index-freshness and validation checks extend to the new types; a `generation-record-present` check verifies every asset in a PR carries its record, grounding, and guideline edges.
- **Projects**: the review queue is the existing steward queue (findings are triage items); a board view shows reviewer cadence health, open Review Executions, publication status, and spend vs. ceiling — one-way sync, the graph is truth.
- **Reports** (generated, never hand-edited): `reports/review-coverage.md` (which reviewers ran when, over what, finding what), `reports/provider-spend.md` (token and currency cost by provider/task-class vs. caps and ceilings), `reports/metric-scoreboard.md` (Measurements vs. targets per definition and deliverable type), `reports/guideline-impact.md` (per guideline version: selection rates, verification pass rates, cost per accepted asset), `reports/asset-catalog.md` (published assets, versions, grounding health), and `reports/next-actions.md` — the progression review’s suggested actions, each gap with its evidence and one paste-ready command

## 21. Claude Code surface

**Subagents** (`.claude/agents/`), each narrow, all propose-only; `graph-maintainer` remains the sole writer:

- `review-runner` — executes one review pass: resolve and snapshot scope, run the rubric through the runtime per selected model, mint the Review Execution, emit findings as internal sources.
- `concept-writer` — produces multiple candidate concepts from a creative intent, each with its grounding manifest and proposed metrics.
- `creative-critic` — the voice/identity and GTM critics for the concept panel (joining the existing specialist panel, routed by class and surface).
- `asset-producer` — one per modality lane (`copy-producer`, `image-producer`, `audio-producer`, `video-producer`), turning a brief into candidate assets through the runtime, never expanding scope.
- `creative-verifier` — the independent verification lane (§14).
- `asset-reviewer` — compares competing candidate assets against the brief and records the comparison, the patch-review analogue.
- `provider-steward` — drafts Provider Definition registrations and capability updates from adapter conformance output; stewards `delivery/generation`.

**Slash commands** (`.claude/commands/`), thin wrappers that parse `$ARGUMENTS`, load context through generated indexes, delegate, and end by invoking `graph-maintainer`; every closing report prints the paste-ready next command, per the conveyor:

- `/register-provider <id>`, `/register-reviewer <id>`, `/register-metric <id>` — draft the class-2 registration PRs.
- `/run-review <definition-id>` — snapshot, execute, and record one Review Execution; `/rerun-review <execution-id>` — repeat against the recorded snapshot (`repeats` link); `/review-roster` — cadence health and coverage.
- `/next-actions` — render `reports/next-actions.md`: the suggested actions in dependency order, each with its one command.
- `/capture-creative-intent "<text>"` — enter the creative lifecycle, work-classed.
- `/propose-concepts <intent-id>` → `/review-concepts <intent-id>` → `/select-concept <id> '<notes>'` — the concept market.
- `/decompose-assets <concept-id>` — modality lanes + verification lane, lane market pairing.
- `/produce-assets <brief-id>` — candidate assets with Generation Records; `/compare-assets <brief-id>`; `/select-asset <comparison-id>`.
- `/verify-assets <brief-id>` — the verification report.
- `/prepare-publication <release-id>` → human approval → `/record-publication <asset-id> <channel>`.
- `/measure <publication-id>` — score the channel's digest against the concept's pinned definitions, minting Measurements.

**CLAUDE.md** gains the standing rules: Claude Code orchestrates the lifecycles, and every external model call goes through the Provider Runtime — never an adapter directly — under a per-command budget, leaving a record, refusals included; repeats read recorded hashes; class-2+ concepts pin their metrics at selection; guidelines apply only once accepted and are always pinned; reviewers propose through ingestion only; assets are immutable and content-addressed; the verifier never generated what it verifies; catalogs govern model choice and deviation states a reason; publication is human-gated; keys never enter the repo.

**Headless invocation** — cadenced reviews, scheduled measurement, and CI checks run the same agent definitions non-interactively (`claude -p`), so a terminal session and a scheduled Action execute identical definitions, as everywhere else in the system.

## 22. Forward fixes to checkpoint 1

The GitHub Workflow Specification is implemented and frozen; nothing in this spec edits it. What this version needs from that system arrives as ordinary **contract-driven schema migrations and validation extensions through its own lifecycle** — the exact path that spec provides for its own evolution. The queue, each entry one intent into its intake:

1. **Schema migration — measurement vocabulary**: node types `metric-definition`, `measurement`; edges `targets`, `measures`, `scores`.
2. **Schema migration — generation vocabulary** (where not yet landed): `provider-definition`, `generation-record`, `review-definition`, `review-execution`, `review-finding`, `asset`, `publication`; edges `generated-by`, `grounded-in`, `guided-by`, `reviews`, `emits`, `repeats`, `publishes`.
3. **Validation extensions** to `spec:validate`: every Generation Record attaches to an engine object (a Review Execution, or a brief/asset chain); every Review Finding references its execution; every class-2+ selected concept carries at least one `targets` edge; every asset carries exactly one `generated-by` with its `grounded-in` set; every `guided-by` target is an **accepted** card in `delivery/generation`; `verification.md` disjointness (§7) as a drift test.
4. **The `release includes` extension to integration nodes** — already queued as that spec's Phase 11 note; multi-lane campaign releases depend on it.
5. **Projects view fields**: reviewer cadence health, Review Execution status, publication status, spend vs. ceiling — added to the existing one-way sync; the board remains a view.

None of these changes checkpoint 1's operating model; each is the kind of migration it was built to absorb.

## 23. Worked examples

**Day zero, guided.** A fresh repository: registry present, graph empty. `/next-actions` shows exactly three suggestions — seed `discovery`, `product`, and `identity` — each listing the canonical artifacts missing (personas and problem inventory; vision and bets; identity definition and voice) and the one command that captures each, from a founding document or a capture session through ordinary ingestion. Nothing else appears: `go-to-market` is a registered domain with every artifact missing, but its dependencies aren’t seeded, so it isn’t actionable yet. Two weeks of capture later the core is seeded and the report changes shape: the GTM gaps surface, prompting for strategy, plan, and positioning, each pre-linked to the persona and bet cards it must build on. Accepting those unlocks `content` suggestions (social strategy, calendar), the first campaign concept, and the first implementation guide with its MVP tranche — and from then on the same report simply keeps steering: the `ux-researcher` is suggested when journey specs land in its scope, `/measure` when a publication passes its window, an improvement round when a Measurement misses — and once every domain is seeded, the report keeps steering toward *covered*: the coverage slots each Domain Definition declares. The operator never consulted a manual for what comes next; the graph’s own dependency structure was the manual.

**A UX researcher reviews the user journeys.** The `ux-researcher` definition scopes `delivery/ux` and `discovery` cards plus journey specs. Its monthly trigger opens a class-1 Review Execution, snapshotting 41 nodes by hash; the pass finds that the *error-recovery* journey assumes an undo capability no spec provides, and that one persona's core loop has no journey at all. Two findings land as internal sources; triage classes the first 2 (design-affecting) and the second 3 (a structural gap contradicting the interaction principles). The UX steward promotes both; the first becomes a spec-amendment proposal, the second an intent that enters the proposal market. Mid-quarter a provider outage fails an execution: `/rerun-review` repeats it against the identical recorded snapshot (`repeats` link), and its findings are byte-comparable with the failed attempt’s partial output. Next month’s execution sees the open intent and corroborates rather than re-files. Nothing edited the graph except `graph-maintainer`; nothing reached design except through triage.

**A GTM campaign ships as versioned assets.** A class-2 creative intent — launch campaign for a shipped capability. Three concepts grounded in the positioning, persona, and voice cards enter the concept market, each proposing its metrics; the voice and GTM critics attack them; a human selects one with an amendment, and the selection pins the metric set — conversion rate and screen prints per channel at a +14-day window — as `targets` edges on the concept. Decomposition mints copy, image, and video briefs plus verification, each manifest pinning the same card hashes. Claude Code fans the lanes out **concurrently**, each `/produce-assets` under its own per-command budget. The image lane produces two candidates (different eligible models per the `image-generation` catalog), each with a Generation Record carrying its `guided-by` pins; comparison and human selection pick one. The video lane’s finishing render would exceed its command budget — the runtime refuses the call and records the refusal; the operator reruns the lane with a raised limit and a recorded reason, rather than discovering the spend on an invoice; the resumable provider job means the partial render is resumed, not repurchased. Verification traces every claim, checks voice, formats, alt text, rights — and confirms each pinned metric has a live feed for its channel. Integration confirms the video script matches approved copy; the release includes all evidence; Publications record the channel posts. At +14 days the measurement scheduler mints Measurements per channel; one channel misses its conversion target, and the Measurement challenges the content-calendar card — a class-2 internal source the steward promotes into next quarter’s intent. Mid-campaign, the positioning card is superseded — the cascade flags the manifests, and the unshipped video re-verifies against the amended truth before publication rather than shipping on dead strategy.

**A newsletter writes itself from the graph — under governance.** A monthly scheduled Action invokes the ordinary creative commands as a class-1 fast path: newsletter from the month’s accepted knowledge and release evidence. The copy brief’s manifest pins the relevant cards and digests; `copy-producer` drafts through the `copy-generation` catalog's default with its accepted guideline cards applied; `creative-verifier` (different model, per the pinned disjointness) fails one untraceable claim, which is dropped; a human approves publication; open rate returns at the +7-day window as a Measurement against the pinned definition. The pipeline is boring — which is the point: boring, traceable, measured, and never able to state what the graph does not know.

**A guideline earns its place — and loses it.** A vendor ships model X.2; its release notes enter as a T1 source and triage files them under `delivery/generation` with a drafted guideline candidate: a structured-output recipe. A controlled comparison runs the asset market on a live social brief — two candidates, identical manifest and model, guideline on and off. The comparison and verification results favor the recipe; the steward promotes; the runtime begins applying it, `guided-by` pins accumulating on every record it shapes. Two model releases later, `reports/guideline-impact.md` shows its market selection rate decaying — the scoreboard challenges the card, class 3 against accepted guidance. The card is superseded by an X.3-era recipe; the cascade re-points the two catalogs and one prompt version that cited it, and flags one unshipped brief whose records pinned the old card for re-verification — five minutes of work. Prompting knowledge moved through the same gates as every other conclusion, and no engine changed.

## 24. Build order

Bootstrapped as always: each phase enters as an intent and travels the delivery workflow as it exists.

1. **Runtime core + two adapters** — the package, the two-layer interface, error taxonomy, Generation Records, per-call caps and per-command budgets; Anthropic and OpenAI adapters; conformance tests. Schema migrations §22.1–2 land here.
2. **Registry + model market** — Provider Definitions, `budgets.yaml` with period ceilings, task-class catalogs, the market drift test; Gemini and Perplexity adapters through the now-real registration path (proving §6 extension).
3. **Review Engine** — Review Definitions, Review Executions with snapshot hashes, `/run-review` and `/rerun-review` proving snapshot repeatability end to end with the `ux-researcher`.
4. **Roster + cadence** — remaining core reviewers on scheduled Actions, cross-model corroboration within one execution, `reports/review-coverage.md` and `reports/next-actions.md`.
5. **Creative lifecycle, text only** — concept market with pinned metrics, copy + verification lanes, asset nodes, `assets/`, prompts-as-versions, one newsletter shipped end to end on a scheduled Action.
6. **Binary modalities + lane concurrency** — image/audio/video lanes fanned out concurrently, resumable provider jobs, Git LFS + Releases storage, the asset market with competing candidates, integration for multi-lane campaigns.
7. **Metrics + measurement loop** — Metric Definitions, `targets` pinning at concept selection, the measurement scheduler, Measurements challenging cards through ingestion, `reports/metric-scoreboard.md`.
8. **Model guidelines** — register `delivery/generation`, controlled comparisons, `guided-by` pinning in the runtime, `reports/guideline-impact.md`, the `generation-reviewer`.

## 25. Success criteria

The system works when:

- A fresh project is steered from an empty graph to its first campaign by suggested actions alone — core domains in dependency order, then go-to-market, then content — every acceptance a human running one named command, and the same review keeps steering the mature project thereafter.
- A **new provider** is an adapter, a conformance pass, and one reviewed PR — with no call-site change — and a lost capability is caught by CI, not by a failed campaign.
- A **new reviewer or metric** is a file and one reviewed PR — no engine change; the registry lesson, again.
- Every generated artifact — review output or asset — carries **exactly one Generation Record**, any published claim walks back through `grounded-in` to accepted knowledge, and any output's prompting walks back through `guided-by` to accepted guidance.
- A failed or disputed review **repeats against the identical recorded snapshot** — same hashes, same pairing — with findings byte-comparable across attempts, and a superseded manifest card reliably flags every unshipped brief and asset resting on it for re-verification.
- A review, a social batch, a blog post, and a code cycle run **concurrently** without racing the graph or each other's budgets; the only serialization points are the sole writer and the human gates.
- **No SDK call escapes the choke point**: every call passes per-call caps, a per-command budget, and the period ceiling on recorded actuals; a refusal is a record, a raised limit is a recorded override — and the invoice never carries the news first.
- Every class-2+ concept **declares its metrics at selection**; every publication window mints Measurements; a miss reliably challenges the cards the work expressed — and changes nothing without a human.
- A model guideline is **promoted only on comparative evidence**, applied only once accepted, pinned in every record it shaped, and challenged by its own scoreboard when it decays — prompting knowledge travels the same gates as every other conclusion.
- The **`ux-researcher`'s findings reliably reach the UX steward through triage**, duplicates corroborate instead of multiplying, and a rejected finding is not re-filed the next month.
- **No review finding ever changes a spec, decision, intent, or roadmap item without a human**, at any volume.
- Model disagreement in a two-provider review is **surfaced, never averaged** — and provably over the same snapshot, because one execution invokes the runtime per model against identical scope hashes.
- A campaign is traceable, by edges alone, from **published post → Measurement → asset version → selection decision → comparison → Generation Record → brief → concept → creative intent → the knowledge cards it expressed** — and a superseded card mid-flight flags every unshipped asset resting on it.
- The **verifier never generated what it verified**, pinned mechanically by the catalog drift test, not by prose.
- Asset revision is **supersession with history**, publication is a recorded human-approved event, and performance metrics return as Measurements that can challenge the strategy cards the campaign executed.
- The whole thing still feels like **the same disciplined GitHub workflow** — files, PRs, Actions, Projects, and agents — with judgement, media, spend, and success now leaving the same trail code always has.

## 26. Final shape

The final shape is the existing system with two new muscles and one shared tendon. The graph remains the source of truth: `nodes/` + `graph/edges.yaml` + `schema/`, with `providers/`, `metrics/`, `reviews/`, `assets/`, and `prompts/` alongside. Claude Code remains the only orchestrator. The Provider Runtime turns four vendor SDKs — and any future ones — into one capability-typed, cost-governed, guideline-aware, record-keeping gateway. The Review Engine turns "someone should look at this" into registered perspectives that run on cadence, read the graph through its own indexes, record exactly what they read and produced, and feed what they find into the same triage every other source passes. The Creative Delivery Engine turns campaigns, posts, and newsletters into what patches already are: grounded candidates, compared, verified independently, selected by humans, released with evidence, versioned forever, and answerable — against success criteria declared at selection — to the performance data that comes back. Model guidelines make even the prompting itself versioned, evidenced, and improvable knowledge. Agents generate options, critics and verifiers expose weaknesses, humans select, and everything — every model call, every token, every measured result — is a node, an edge, or a recorded event.
