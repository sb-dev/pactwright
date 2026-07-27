# SPEC — The Project Graph (v3)

One typed-edge graph, stored as files in a GitHub repository, that runs an entire project: what it knows, what it intends to build, how that becomes shipped software and published creative work, what happens in production, and what is learned. Agents do the structured work. Humans make the decisions. GitHub is the only platform.

This is the root specification. It describes the final state — what exists once every document in §4 has been built, in order. The details live in those documents; this one is the map.

## 1. The problems

AI made building cheap. It did not make intent durable, knowledge reliable, or spend bounded. Without a system, an AI-heavy project fails in predictable ways:

1. **Intent evaporates.** Requests go straight to code through a chat window. What was meant, what alternatives existed, and why — gone when the session ends.
2. **The first answer wins.** An agent produces one implementation. Trade-offs are never laid out as options, so humans can only accept or reject.
3. **Every change gets the same process.** A typo fix and a payments change receive equal ceremony — or equally none. Nothing records how much scrutiny a change actually got.
4. **Scope drifts silently.** When the spec turns out to be wrong, agents quietly widen the work. What was approved and what shipped diverge without a trace.
5. **The author grades its own work.** The agent that wrote the code writes the tests. The model that generated the asset verifies it.
6. **Truth rots.** Specs, code, tests, and docs drift apart with no detector, and nothing from production feeds back after merge.
7. **Knowledge is scattered and mortal.** Research, feedback, incidents, and decisions live in threads and heads. Nothing deduplicates, nothing expires, and a disproven assumption never reaches the strategy built on it.
8. **Attention is untriaged.** Either a human reviews everything and becomes the bottleneck, or reviews nothing and contradictions slip through.
9. **Context is rebuilt every session.** What to build next — and the stack, journeys, and constraints to build it with — is reconstructed from memory each time.
10. **Production is folklore.** Incidents live in external tools, root causes are asserted rather than proven, and nobody can say for sure which change caused what.
11. **Creative work and spend are ungoverned.** Assets ship untraceable, unverified, and unmeasured. Headless multi-provider AI runs with no record to reproduce a run from and no budget it can't exceed.

## 2. The fix

**One graph, in the repository.** Everything — intents, contracts, patches, evidence, releases, knowledge, incidents, assets, measurements, decisions — is a node in a file, connected by one typed, schema-checked edge table. Agents propose; a single maintainer role is the only writer; humans approve. Records are superseded, never deleted. Boards, indexes, and reports are generated from the graph, never edited by hand. It is all plain files, pull requests, Actions, and CODEOWNERS — no custom platform, no database, no service.

The graph grows in three checkpoints, with two engines running on top.

**Checkpoint 1 — Delivery** *(fixes 1–6)*. Intent becomes shipped software through markets and gates. Every intent gets a work class (0–3) that sets how much process it receives. Meaningful work gets several candidate contracts, each a different trade-off; critics attack them; a human picks, and the comparison and decision are saved forever. Approved work splits into parallel lanes with an independent test lane, and competing patches are compared and selected the same way. Scope changes are recorded, never absorbed. Every PR carries evidence, drift review catches behavior the graph doesn't know about, and releases plus post-deploy findings close the loop — every surprise becomes a new intent.

**Checkpoint 2 — Intelligence** *(fixes 7–9)*. Everything the project learns — research, articles, metrics, incidents, the founding spec itself — enters as a source through one triage gate. Repetition is absorbed automatically, raising confidence and refreshing freshness; only the novel, the contradictory, and the design-affecting reach a human steward. Knowledge is organized into domains, each with its own steward, expiry clock, and recipe for what it feeds into implementation briefs. When a conclusion is challenged or replaced, a cascade flags everything built on it. Comparing what the project knows against what it has shipped generates the ordered backlog automatically.

**Checkpoint 3 — Operations** *(fixes 10)*. Production gets its own record: one intake gate classifies every ticket, alert, and failure by severity. Every deploy, flag, and config change is a recorded event, so "what caused this" always points at something real. Root causes require evidence plus a named owner — agents propose, never declare. Data corrections are scoped, approved, validated, and reversible. Everything significant resolves into learning that flows back through Checkpoint 2's triage. Observed truth never silently edits intended truth, and intended truth never silently ignores it.

**The engines and runtime** *(fixes 11)*. Standing reviewers — UX, product, GTM, architecture, cost, and more — examine the graph itself on a schedule and file findings through the same triage. Creative work travels the same lifecycle as code: competing concepts, critics, per-modality lanes, an independent verifier, human-approved publication, every asset immutable and grounded in the exact knowledge it may claim. Underneath sits a provider runtime spanning Anthropic, OpenAI, Gemini, and Perplexity: model choice is a recorded market decision, every call leaves a generation record, and token and currency budgets are enforced at one choke point. Recurring work is scheduled Actions invoking the same commands an analyst runs by hand: every execution records exactly what it read, by snapshot and content hash, so a failed or disputed run repeats against identical inputs — and when knowledge is superseded mid-flight, the cascade flags every unshipped brief and asset resting on it before anything ships. Success metrics are declared before work runs; misses come back as challenges to the strategy behind the work.

**The workflow platform** *(built last)*. Every loop above — the delivery cycle, the creative cycle, ingestion, the standing reviews — can be declared as a workflow: a definition in a file, a plan approved once against pinned truth, and cheap, retryable runs against it, with token and currency budget lines reserved before spend rather than discovered after. Defaults ship for each loop and add orchestration only — a wrapped loop keeps its own records and gates, and removing the wrapper leaves it running exactly as its own document specifies. Stale plans refuse to run; retries repeat exactly what was approved; improvements supersede with rationale. The graph can also derive its own extensions — agents, skills, workflows, rendered views — from the knowledge that justifies them, and import community ones with pinned provenance; either path earns the same reviewed registration as a hand-written file.

**The same moves, everywhere.** Learn one checkpoint and you know them all:

| The move | Where it shows up |
|---|---|
| Ceremony scales with risk | Work class (delivery), impact class (knowledge), severity (operations) |
| One front door | Intent capture, triage, intake |
| Options before commitment | Contract, patch, concept, and asset markets; competing hypotheses |
| Independent verification | Test lane, stewards, named owners, verifier ≠ generator |
| Behavior lives in registries | Domains, lanes, providers, models, reviewers, metrics, guidelines, workflows, views — new capability is a file and a PR |
| Nothing is deleted | Supersede, retract, override — always on the record |

## 3. What emerges

- **Everything traces.** A ticket walks to the bug, the fix, the release, the violated spec, and the knowledge beneath it. A published post walks back to the strategy it expressed. Provenance is an edge walk, not archaeology.
- **The graph is shared memory.** Briefs assemble their own context by walking edges — stack, journeys, requirements, voice, guidelines. Any agent, any provider, any session loads the same truth. More agents means more capacity, not more chaos.
- **Attention goes where it matters.** Repetition absorbs itself. Humans see only the novel, the conflicting, and the decisions — each arriving with options and the case against them already attached.
- **Truth self-corrects.** Stale knowledge surfaces for review, challenged conclusions flag their dependents — unshipped work included — and drift review catches the rest. Failure shows up as visible backlog, not quiet rot.
- **Planning is generated.** The ordered backlog is derived from the gap between what is known and what has shipped, and regenerates as either moves. Nobody maintains a roadmap by hand.
- **Autonomy is safe to scale.** Every call leaves a record, every command runs under a budget with hard period ceilings, every write goes through one maintainer, every decision through a human. Reviews, campaigns, and code cycles run concurrently and headlessly without racing each other, and recurring shapes run as approved plans — retryable, amendable, and reserved against the period's budget before a token is spent.
- **The system improves through itself.** Schemas, prompts, workflows, and budgets are governed files that change through the very lifecycle they enforce — and the system is built the same way, each phase entering as an intent through the workflow before it.

## 4. Documents and build order

Each specification is delivered by the system its predecessors built: every phase enters as an intent and travels the workflow as it exists at that moment. The final state is all five running as one graph in one repository.

| Order | Document | Delivers |
|---|---|---|
| 1 | **docs/research-logs/07-12-2026-delivery-graph.md** | Checkpoint 1: the delivery graph; turns human intent into verified, traceable releases through risk-scaled markets, lanes, evidence, and gates |
| 2 | **docs/research-logs/07-12-2026-project-intelligence-graph.md** | Checkpoint 2: the intelligence graph; ingests the founding corpus and ongoing sources, governs knowledge freshness and contradiction, propagates challenges to dependents, and derives the ordered backlog |
| 3 | **docs/research-logs/07-12-2026-operations-graph.md** | Checkpoint 3: the operations graph; records production events, governs incident diagnosis and data correction, and returns operational learning through ingestion |
| 4 | **docs/research-logs/07-12-2026-review-and-creative-delivery.md** | The review and creative engines; adds scheduled graph review, governed asset production and publication, multi-provider generation, budget enforcement, recorded snapshot-repeatable executions, and outcome measurement |
| 5 | **docs/research-logs/07-24-2026-graph-native-workflow-runtime-spec.md** | The workflow platform; declares any loop as a workflow with approved plans, retryable runs, and reserved budget lines; ships the default catalog, derived capability, registered views, and the marketplace |

No document adds a second pipeline or a second authority: reviews enter through ingestion, assets travel delivery, operations proposes and never edits, and workflows orchestrate without owning — wrapped loops keep their own records and gates.

## 5. Done when

One real change of every kind traces end to end by edges alone. Repetition absorbs without a steward, while nothing important slips past one. Nothing intended ever changes without a human. No model call spends outside a budget or without leaving a record. And the whole thing still feels like an ordinary, disciplined GitHub workflow — files, PRs, Actions, and agents — with knowledge, media, operations, and spend leaving the same trail code always has. And a recurring production that fails repeats from its approved plan — identical inputs, identical budget — rather than from memory.

---

*SPEC v3*
