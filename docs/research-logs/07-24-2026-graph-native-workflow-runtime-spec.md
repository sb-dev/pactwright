# Graph-Native Workflow Runtime — Config-Driven Plans and Runs (v13)

Revision note (v13): the four open questions of v12 are resolved as normative text — `corroborate` with one eligible provider runs single and records the gap (§3); `halted` is non-terminal and blocks siblings until override or superseding amendment (§7); a retired one-time definition keeps its immutable file with a `retired-by` marker (§3); auto-approval applies to plan approval only, and definition-declared gates are human at every class (principle 3). The acceptance matrix gains A9–A14, restoring the four v10 guarantees the v12 matrix dropped (period reservation, momentum surfacing, gate parity for derived/imported capability, view exactness and cascade re-derivation) plus rows for the two new resolutions. §12 gains four worked examples with YAML, each demonstrating one of the new rules: envelope-named period lines and a reserve-time refusal; a one-time class-3 migration retired on the record; a derived onboarding for an existing repository; a staleness-triggered refresh riding out a one-provider week and a halt.

Revision note (v12): semantic compression of v10 — rationale consolidated, duplicate rule statements removed, examples condensed, acceptance restated as a scenario matrix. No normative change; earlier revision history remains in v10.

## 1. Scope and fit

The fifth and last document built: a general orchestration platform over the one project graph, adding only **Workflow Definitions**, approved **Workflow Plans** pinned to truth, and cheap, retryable **Workflow Runs**. Every loop the system runs — delivery, creative, ingestion, standing reviews — *can* be declared as a workflow (defaults ship, §4); none must be. The graph can also derive its own extensions — agents, skills, connectors, workflows, onboarding sequences, views — and exchange them through a marketplace that is nothing but Git (§5).

The platform adds orchestration only: no second generation path, no new authority, no duplicate of any loop's records, no fourth checkpoint of truth. Definitions are repository files; plans and runs are graph nodes advanced by commits through `graph-maintainer`; everything needed from the four frozen documents arrives through their own lifecycles (§11).

Some work is a *shape* — stages, dependencies, gates, budgets — executed many times. Run as loose commands, that shape has no approved plan to retry against, no amendment path that keeps what was learned, no spend envelope across concurrent workstreams, and no record separating "wrong approach" from "failed attempt." The platform supplies the separation: a plan reviewed once, and runs cheap and disposable against it — the delivery graph's contract/patch move, generalized. It earns its weight on multi-stage productions, project-defined stage DAGs, and reservation-grade spend across concurrent plans. **Work without that shape should stay as commands; wrapping it is ceremony.**

## 2. Governing principles

These seven are the governing principles. Later sections define their operational contracts, examples, and acceptance tests.

1. **No run without a plan; no plan without pinned truth.** Every execution is a run of an approved plan; the plan pins definition version, parameters, scope hashes, config hashes, pairings, metrics, and budget lines (§6). Retrying re-runs the plan; improving supersedes it; nothing is edited in place.
2. **Propose-only, sole writer, human gates.** Runs propose; `graph-maintainer` is the only writer; approvals and overrides are human.
3. **Ceremony scales with class.** A plan inherits the class of the work it instantiates; class 0/1 may auto-approve, class 2/3 requires a human. Auto-approval applies to **plan approval only**: a gate the definition itself declares is human at every class.
4. **Host-agnostic.** An Actions job and a local machine run the same library against the same files and leave the same commits; where a run executed is a recorded fact, never a difference in behaviour.
5. **Every generation is a recorded event.** Stages call external models only through the Provider Runtime, with the stage's budget line as the ceiling.
6. **Onboarding adds orchestration only.** A loop declared as a workflow keeps its own records, vocabulary, and gates; step records reference them and restate nothing. Removing the wrapper must leave the loop running exactly as its own document specifies — one loop, one record per event, however dispatched.
7. **Derived, never installed.** Hand-written, graph-derived, or imported, an extension enters as a file through the same class-scaled gate, carries the grounding or provenance that justifies it, and is cascade-flagged when that grounding moves. Nothing installs itself; derivation changes who writes the first draft, never who approves it.

## 3. Workflow Definitions

A definition is `workflows/<id>@<semver>.md` — immutable per version, CODEOWNERS-gated. Registering or bumping is class-2; improvement is a new version; replacement is supersession. It declares:

- **Archetype and purpose** — project-named shapes (`recurring-report`, `research-pipeline`, …); an archetype is a convention over definitions, not engine code.
- **Parameters** — the schema `/plan-workflow` accepts.
- **Stages** — a DAG. Each stage names its owning agent (paired through the lane/catalog market), task-class catalog, collaboration pattern (`sequential | parallel | critique-repair | market | corroborate`), `needs:` dependencies (absence **is** permission to run concurrently), human gates, and outputs.
- **Budget defaults** — token and currency lines per stage and per run (§8), overridable per plan.
- **Metric set** — registered metric definitions the runs are scored by, overridable per plan with reason.
- **Triggers** — manual, scheduled (cron), or event-driven (a release merged; the cascade touched a scope; staleness crossed a threshold).
- **Lifecycle** — `recurring` (default) or `one-time`. `/plan-workflow --once '<shape>'` mints a one-time definition and its plan in one reviewed PR; when the plan terminates the definition retires — the file remains, immutable, gaining a `retired-by: <plan-id>` marker, so a retired shape can be read forever but never replanned. Ceremony still scales with class, and a one-time shape that keeps recurring is what the progression reviewer flags for promotion (§4).

**`corroborate`** is the review engine's cross-model discipline as a pattern any stage may declare: two pairings execute the same prompt over the same pinned manifest; agreement raises confidence, disagreement is emitted explicitly for the gate — never averaged. When eligibility resolves to a single provider, the stage runs single and records `corroboration: unavailable`: confidence is not raised, and the gap is visible to the gate.

```yaml
id: quarterly-market-report      # workflows/quarterly-market-report@1.2.0.md
archetype: recurring-report
params: { quarter: string, segments: [list] }
stages:
  - { id: research-market,      catalog: grounded-research }
  - { id: research-competitors, catalog: grounded-research }
  - { id: analysis, needs: [research-market, research-competitors], merge: synthesize }
  - { id: draft,    needs: [analysis], pattern: market }
  - { id: review,   needs: [draft],    pattern: critique-repair, gate: human-approve }
  - { id: publish,  needs: [review],   gate: human-approve }
budgets: { run: { tokens: 1.5M, usd: 25 }, stages: { research-market: { usd: 5 }, research-competitors: { usd: 5 } } }
metrics: [report-read-through, decision-citations]
```

## 4. The default catalog — everything can be a workflow

One shipped definition per loop the system already runs — ordinary versioned files a project revises or retires by class-2 PR. Each declares the loop's shape and leaves its machinery untouched:

| Default definition | Declares | The loop's own machinery, untouched |
|---|---|---|
| `software-delivery-cycle` | intent → contract market → parallel lanes → patch market → compliance & drift review → release | Comparisons, decisions, briefs, evidence, releases stay document-1 nodes; same human gates; step records point at them |
| `creative-delivery-cycle` | concept market → per-modality lanes → independent verification → publication gate → measurement window | Assets, publication records, measurements stay document-4 nodes; verifier ≠ generator holds. A *campaign* is one planned instance — channels and targets are parameters |
| `ingestion-digest` | fetch feed → capture sources → triage routing → digest report | Leases, triage, promotion remain ingestion's; one front door into the graph |
| `standing-review` | resolve & snapshot scope → execute rubric per eligible model → emit findings into triage | Anatomy, cadence, roster, Review Executions remain the review engine's; the step record points at the execution it dispatched |
| `extension-update` | check pinned upstreams of imports → one version-bump proposal PR per drift, diff attached (§5) | Registration gates and CODEOWNERS remain the only authority; the workflow proposes, never merges |

**Two defaults, as files (abridged)** — stages name the loop's existing commands; gates restate its existing gates; nothing else is added:

```yaml
# workflows/software-delivery-cycle@1.0.0.md
id: software-delivery-cycle
archetype: delivery-cycle
params: { intent: node-id }
lifecycle: recurring
triggers: [manual]
stages:
  - { id: contracts, cmd: /propose-contracts,        pattern: market,  gate: approve-contract }
  - { id: lanes,     cmd: /decompose-lanes,          needs: [contracts] }
  - { id: implement, cmd: /propose-patches,          needs: [lanes],   pattern: market }   # patches compete
  - { id: verify,    cmd: /implement-brief lane=tests, needs: [lanes] }                    # verifier ≠ generator
  - { id: select,    cmd: /compare-patches,          needs: [implement, verify], merge: select-best, gate: select-patch }
  - { id: integrate, cmd: /integrate,                needs: [select] }
  - { id: release,   cmd: /release-check,            needs: [integrate], gate: approve-release }
```

```yaml
# workflows/standing-review@1.0.0.md — one definition; each reviewer is an instance
id: standing-review
archetype: standing-review
params: { reviewer: review-definition-id }
lifecycle: recurring
triggers: from-reviewer-definition        # cadence/events read from reviews/definitions/<reviewer>.md
stages:
  - { id: review, cmd: /run-review ${reviewer}, pattern: corroborate }  # engaged when eligibility names a second provider
```

**The reviewer's anatomy maps one-to-one**, which is why `standing-review` stays thin: perspective → purpose; scope-as-slices (never "the whole repo") → the plan's hash snapshot; rubric → stage prompt, comparable because pinned; cadence/triggers → triggers; model eligibility → stage catalog, a second provider engaging `corroborate`; steward → the triage queue findings reach. The Review Definition file remains the single source for all six. One platform guarantee is added: a review stage's pinned manifest includes the recorded triage rejections in scope, so reviewers learn what the project has already declined and a sibling retry critiques against the same declined history.

**When wrapping earns nothing, don't.** A lone review on its own cadence already snapshots, repeats, and reports; a one-stage plan around it is ceremony. Defaults earn their keep where loops *compose* or need the platform's properties — a release whose final stage is the architecture review; a quarter's delivery cycle and launch planned under one set of reserved budget lines. Declared, a loop gains exactly the plan pin, sibling retries, stale-plan refusal, and reserved spend — nothing else.

**Two births, one gate, one drafter.** By command, `/register-workflow <id>` opens the class-2 registration PR. Through the review engine, a reviewer that observes a recurring chain run as loose commands files a finding; triage promotes it; delivery is the registration PR. In both paths the first draft is derived from the chain, gates, and budget history the graph already records (§5).

The **progression reviewer** is the usual observer; its momentum scan extends to workflow signals — plans awaiting approval, halted runs, retry-less failures, lapsed triggers, definition-less chains — each surfacing in `/next-actions` with one paste-ready command. Guidance, onboarding, and standing review remain one mechanism: the progression reviewer steers the cold start at empty baseline, momentum at maturity, and now the platform that dispatches it. `/next-actions` is the single steering surface; `/workflow-status` is a feed into it.

## 5. Derived capability, views, and the marketplace

Every extension is a governed file, and a governed file is something the graph can draft: generated from the slices that justify it, proposed as a registration PR, gated exactly as a hand-written one (principle 7).

- **Agents, skills, connectors.** The distilled skill — grounded in promoted guideline cards, cascade-flagged when they are superseded — is the seed. `/derive-extension <kind>` generalizes it: a subagent role from the domain cards it will argue, a skill from accepted guidelines (homegrown, or a **community skill** imported beside it), an MCP connector config from provider knowledge, a lane config from the implementer/skills/verifier the work needs. Every generated file records its grounding, so capability ages with the knowledge beneath it.
- **Custom onboarding.** Generic onboarding is the progression reviewer at empty baseline (§4). Non-generic starts — adopting an existing repository, a vertical with its own mandatory domains — derive a one-time definition from the domain registry's dependency structure: seeding commands in dependency order, a gate per approval. Run once, retired; its plan and run remain the record of how the project began.
- **Custom graph views.** A **View Definition** (`views/<id>.md`, class-2, derivable) names the slices it reads, the audience, the rendering, and the landing path; the generated document records the hashes it rendered from. The worked default is **`DESIGN.md`**: current design truth — approved contracts, UX and identity cards, journeys, open design intents — at the repository root; stale the moment a hash moves, exact again on regeneration. Views are read surfaces only: one-way, disposable, worthless to edit.
- **The marketplace is Git.** Extensions of every kind are exchanged as versioned files in repositories. **Importing is vendoring** — `/import-extension <source>` pins a version, records provenance (source, version, content hash) in frontmatter, and opens the class-2 registration PR; an import earns the same review as a hand-written file. **Publishing is pushing** — a project's registry directories are its listing; a curated index is itself just a repository. No store, no accounts, no auto-install.
- **Updates run as workflows, both directions.** *Upstream-in*: `extension-update` (§4) proposes one diff-attached PR per version drift. *Knowledge-out*: when grounding is challenged or superseded, the cascade flags the derived extension for re-derivation against the surviving truth. Both go through gates.

This section adds no new node or edge vocabulary: views and derived extensions are registry files, generated views are derived documents, and grounding and provenance live in frontmatter.

## 6. Workflow Plans

A **Workflow Plan** is the approvable instance of one definition version. Status: `draft → approved → superseded | abandoned`. Planning pins everything a run needs:

- definition version and parameters (`instantiates` edge);
- scope resolved through the indexes and snapshotted as content hashes;
- config-file hashes (the definition, the model catalog, `budgets.yaml`) and the runtime version;
- input manifests per generating stage — for review stages including the recorded triage rejections in scope (§4);
- the model market outcome per stage (winner and reason);
- budget lines with estimates (§8);
- the pinned metric set with targets and windows (`targets` edges);
- the ordered gate list.

**Amendment is supersession**: `/amend-plan` mints a successor with fresh hashes where intended and rationale recorded; the old plan and its runs remain the record of what was tried.

## 7. Workflow Runs

A **Workflow Run** executes one approved plan. State: `queued → running → { succeeded | failed | halted | cancelled }`. The run node records commit SHA and host, and per stage a **step record**: status, retry count, tokens and cost drawn, the records the stage's own machinery minted (generation records, a Review Execution, a comparison), and the nodes proposed. Step records live in the run body — one node per run, not per step — while every underlying event still mints its own record (principle 6). Rules:

- **Retry is a sibling run** against the same plan: same hashes, pairings, and lines. A mid-flight death resumes or retries from step records — the graph is the checkpoint, not process memory.
- **Stale plans refuse to run.** Any superseded pinned hash fails admission and asks for an amendment: no run executes on dead truth.
- **Halt is the budget guard's verb** (§8): a run that reaches a line stops at the choke point, records the refusal, and waits for override or amendment. `halted` is **not** terminal: the plan's one active run is still this one, so no sibling may start. The exits are a human override (the run resumes) or a superseding amendment (the halted run is cancelled; a fresh run executes the successor plan).
- Runs are immutable once terminal; nothing is deleted.

**Posture: no service.** `/run-workflow` executes interactively; a `workflow-dispatch` Action runs the same definition headlessly; cron and event triggers open plans (auto-approving class 0/1) and dispatch them; state advances by commits through `graph-maintainer`. A failed run needs no incident process — its mitigation is a sibling run or a superseding plan; recurring failure and drift are watched as patterns by the budget reports (§8) and standing reviewers, becoming findings through triage. A defect in the runtime is ordinary checkpoint-1 work; the Operations Graph is not involved until something ships.

## 8. Budget lines — reservation-grade accounting

`providers/budgets.yaml` declares ceilings in **both tokens and currency** at five scopes: per call, stage, run, plan, and period (per provider and task class). Tokens catch runaway context and retries before the invoice; currency catches modalities tokens don't measure. Each plan instantiates the lines it draws, with estimates. Lifecycle:

1. **Estimate** at planning, from catalog cost hints and prior runs — `reports/workflow-runs.md` is the estimator's memory.
2. **Reserve** at admission: actuals + open reservations + this estimate must fit the period ceiling, else an override node (visible, expiring) or a smaller amended plan. Reservations are derived from approved plans with open runs — a report computation, never held state.
3. **Meter** per call: each stage's line is the ceiling handed to the Provider Runtime; a call that would exceed is refused and recorded.
4. **Reconcile** at run end: actuals vs. estimates per step record. Per-run overrun **halts** at the guard (§7); systematic overrun is the cost-reviewer's finding through triage.

Spend digests as a feed into `delivery/generation` and into `reports/workflow-runs.md`. Editing `budgets.yaml` is gated; overshoot is a visible override, never a silent bypass.

## 9. Concurrency

**Within a run**, stages whose `needs` don't chain run concurrently; every fan-in declares a merge strategy:

| Strategy | Meaning | Realization |
|---|---|---|
| `combine` | Complementary outputs proceed together | The integration join, unchanged |
| `select-best` | Alternatives compete; one wins | Comparison node + human selection — the existing market pattern |
| `synthesize` | Directed combination of named candidates | The existing synthesis mechanics |
| `vote` | Critics rank candidates for the human | Comparison node carrying the ranking; the human selects |

**Across runs**, nothing serializes independent plans. The contract: **one writer** (`graph-maintainer` behind PRs); **one active run per plan** (the ingestion lease discipline, reused — retries and dispatches cannot race); **immutability everywhere else** (content-addressed snapshots and versions — nothing readers read moves); **budget lines partition spend** (the period ceiling admits only what fits, §8); **gates serialize where judgement lives** (approvals are steward-board queue items, not locks). Known trade-off: `edges.yaml` is a merge hotspot; the sharding escape hatch (`graph/edges/<domain>.yaml`) applies if it bites.

## 10. Vocabulary and realization

**Node types.** Workflow Definition (§3), Workflow Plan (§6), Workflow Run (§7).

**Edges.** `instantiates` (Plan → definition version; amendment chains are `supersedes` between plans); `executes` (Run → approved plan; many runs per plan). Plans may carry `targets` edges to registered metrics. This spec adds orchestration vocabulary only.

**Human gates.** Plan approval (class 2+), registration and version bumps, budget changes and overrides, and every gate a definition declares.

**Realization surfaces.** `workflows/` (definitions, defaults included) and `views/` (View Definitions; generated documents land at their declared paths, `DESIGN.md` at root); plans and runs under `nodes/`; the `workflow-dispatch` Action; cron/event triggers; the budget guard; `reports/workflow-runs.md`, generated never hand-edited; a Projects board view (open plans, run states, spend vs. line, next gate) — one-way sync, the graph is truth. The `workflow-planner` subagent drafts plans: it resolves and snapshots scope, assembles manifests, runs the model market per stage, estimates and instantiates lines, and pins metrics.

**Commands.** `/register-workflow <id>` · `/plan-workflow <definition-id> [params | --once '<shape>']` → `/approve-plan` → `/run-workflow` · `/retry-run <run-id>` · `/amend-plan <plan-id> '<changes>'` · `/workflow-status` · `/derive-extension <kind> [params]` · `/import-extension <source>`. `/next-actions` needs no new command. CLAUDE.md gains: no run without an approved plan, no plan on superseded hashes; retries re-run plans, improvements supersede them; a workflow-dispatched loop mints its own records once, never a parallel set.

## 11. Forward fixes to the frozen documents

1. **Schema migration** (checkpoint 1): node types `workflow-definition`, `workflow-plan`, `workflow-run`; edges `instantiates`, `executes`.
2. **Validation extensions** (checkpoint 1): a run's `executes` target is an approved plan; class-2+ plans carry a `targets` edge and instantiated lines; admission-time hash-liveness; a step record that dispatched a loop's machinery references its record and duplicates no fields (principle 6, enforced).
3. **Projects view fields** (checkpoint 1): definition/version, plan status, run status, spend vs. line, next gate.
4. **Reviewer version bumps** (document 4): the progression reviewer gains the §4 workflow momentum signals; graph-auditor gains plan/run hygiene (orphaned plans, runs without `executes`, mutated terminal runs). Two files, two class-2 PRs.
5. **Root spec row** (SPEC.md): the document table gains row 5 for this spec, restoring the plan/run vocabulary its v2 removed, scoped to this document alone.

## 12. Worked examples

Grounded in **Kakeido**, a Kakeibo-inspired weekly spending-review app whose UX spec is a founding corpus in the intelligence graph (principles promoted as guideline cards: *lead with decisions, not data*; *one job per screen*; *make automation inspectable*; *make bulk actions safe*; envelopes Needs / Wants / Culture / Unexpected).

**Four workstreams, one Tuesday** (concurrency + `corroborate`). A release merge triggers an architecture-review plan; a social batch, a blog post, and a code cycle already have approved plans. Four runs on three providers draw four disjoint budget lines; the period ceiling holds the blog run behind a reservation until the social run reconciles under estimate. The review stage runs `corroborate`: both providers read the same pinned hashes and the same previously-declined findings, agree on two findings, and split on a third — which reaches the steward as an explicit, unaveraged disagreement pair. Two human gates queue for the afternoon; the sole writer and those gates are the only turnstiles.

**One screen, one contract, two patches** (halt, amend, learn). `/plan-workflow software-delivery-cycle intent=decision-card` pins the UX-spec cards for the Decision Card screen as scope hashes. The contract market settles the card's behaviour; two lanes implement competing patches while an independent lane writes the tests from the contract alone (verifier ≠ generator). The patch market judges against the pinned acceptance criterion, and the review stage rejects the otherwise-winning patch for making swipe the only way to accept — citing the pinned card *gestures must never be the only way to act* by hash. Mid-run, the implementation stage hits its token line re-reading a 74-row fixture CSV every attempt and **halts**; the amendment moves the fixture into the pinned manifest, and `reports/workflow-runs.md` remembers, so the next screen's estimate is right.

```yaml
# plan node wfp-2031 (abridged) — /plan-workflow software-delivery-cycle intent=decision-card
instantiates: software-delivery-cycle@1.0.0
params: { intent: decision-card }
scope:                                   # content hashes pinned at planning
  ux/decision-card@9f31:     one spending, one reason, one recommended choice
  ux/gestures@77aa:          gestures must never be the only way to act
  fixtures/week-74rows@c04d: added by amendment wfp-2031 → wfp-2044
budgets: { run: { tokens: 900k, usd: 14 }, stages: { implement: { tokens: 400k } } }
metrics:  [decision-resolvable-seconds]
gates:    [approve-contract, select-patch, approve-release]
```

The other worked cases follow the same grain. A **launch** is one planned instance of `creative-delivery-cycle` — a campaign is parameters, not a definition; parallel lanes run under one reserved line set, verification is independent of every generator, a `corroborate` copy split reaches the publication gate explicit, and the metric set pins the measurement window (installs → first completed weekly review, thirty days) as a stage that fires, not a follow-up anyone must remember. A **feedback loop** runs a scheduled `ingestion-digest` over TestFlight feedback; a promoted pattern crosses all four default loops — standing review corroborates it, a delivery cycle amends the flow, a release supersedes a guideline card, and the cascade re-derives the `kakeido-ux` skill, regenerates `DESIGN.md`, and pins the surviving truth into next week's plans — with no hand-off remembered by a person. Earlier, `/derive-extension skill` had created the grounded `kakeido-ux` skill, while `/import-extension` vendored an accessibility reviewer through a class-2 registration PR; when that reviewer's upstream version changes, `extension-update` proposes a diff-attached version-bump PR and never merges it itself. Finally, the team registers **`kakeido-week`**, a Monday-triggered workflow shaped like the product's own review ritual: `/next-actions` briefs, decisions become steward-queue gates, group checks are class-0/1 auto-approvals presented with examples and an undo named supersession, and a repeated hand-run correction becoming a proposed definition is the progression reviewer's move exactly.

**The team budgets like the product: envelopes** (A9). Kakeido sorts money into Needs / Wants / Culture / Unexpected; the team names its period lines the same way. At month end a launch plan's estimate no longer fits `wants`: admission is refused at reserve time — before a token is spent — and the steward either amends the plan smaller or mints a visible, expiring override drawn against `unexpected`. The product's discipline, applied to model spend: surprises exist, so give them an envelope where they can be seen.

```yaml
# providers/budgets.yaml (excerpt) — period lines named like the product's envelopes
period: 2026-08
lines:
  needs:      { task-class: delivery,        tokens: 40M, usd: 600 }  # shipping the app
  wants:      { task-class: creative,        tokens: 12M, usd: 250 }  # launches, experiments
  culture:    { task-class: views-and-docs,  tokens: 4M,  usd: 60 }   # DESIGN.md, reports, journal
  unexpected: { overrides-only: true,        usd: 90 }                # visible, expiring, never silent
defaults: { per-call: { tokens: 200k }, per-stage: { tokens: 500k, usd: 8 } }
```

**A migration runs once and stays on the record** (R3, R4). Splitting the `Unexpected` envelope's semantics — refunds are not surprises — is a class-3 data-model change that must never silently rerun. `/plan-workflow --once` mints the definition and its plan in one reviewed PR; because declared gates are human at every class, nothing auto-approves; when the plan terminates, the definition retires with its marker — readable forever, replannable never.

```yaml
# workflows/envelope-v2-migration@1.0.0.md — minted by /plan-workflow --once
id: envelope-v2-migration
archetype: one-time-migration
lifecycle: one-time
retired-by: wfp-2140                    # added when the plan terminated; file immutable thereafter
stages:
  - { id: contract, cmd: /propose-contracts, gate: approve-contract }
  - { id: migrate,  cmd: /propose-patches,   needs: [contract], pattern: market }
  - { id: verify,   cmd: /implement-brief lane=tests, needs: [contract] }        # verifier ≠ generator
  - { id: select,   cmd: /compare-patches,   needs: [migrate, verify], merge: select-best, gate: select-patch }
  - { id: release,  cmd: /release-check,     needs: [select], gate: approve-release }
budgets: { run: { tokens: 2M, usd: 30 } }
```

**Onboarding an existing repository, derived** (§5). Kakeido's code predates the graph, so generic empty-baseline onboarding doesn't fit. `/derive-extension workflow --archetype onboarding` reads the domain registry's dependency edges and drafts a one-time definition: corpus in first, then domains in dependency order, a gate per approval, and a progression review at the now-populated baseline to say what comes next. Run once, retired; its plan and run are the durable record of how the project joined the graph.

```yaml
# workflows/kakeido-adopt@1.0.0.md — derived from the domain registry's dependency order
id: kakeido-adopt
archetype: onboarding
lifecycle: one-time
stages:
  - { id: corpus,   cmd: /ingest source=App_UX_spec.md,           gate: approve-promotions }
  - { id: users,    cmd: /seed-domain users,    needs: [corpus],  gate: approve-domain }
  - { id: product,  cmd: /seed-domain product,  needs: [users],   gate: approve-domain }
  - { id: identity, cmd: /seed-domain identity, needs: [users],   gate: approve-domain }
  - { id: code,     cmd: /capture-intent adopt-existing-code, needs: [product] }
  - { id: baseline, cmd: /run-review progression-reviewer, needs: [product, identity, code] }
budgets: { run: { tokens: 800k, usd: 12 } }
```

**A refresh that fires itself — and a one-provider week** (A13, A14). No calendar owns the competitor cards; the graph does — the trigger is the domain's own staleness. The week a provider is down, eligibility resolves to one: the research stage runs single and records `corroboration: unavailable`, so triage sees exactly how much to trust. A later run halts on its token line; no sibling may start while it sits `halted` — the steward amends the scope smaller, the halted run is cancelled, and the successor plan's fresh run completes under its line.

```yaml
# workflows/competitor-refresh@1.1.0.md
id: competitor-refresh
archetype: research-pipeline
lifecycle: recurring
triggers: [{ event: staleness, domain: product/competitors, threshold: 45d }]
stages:
  - { id: research, catalog: grounded-research, pattern: corroborate }   # single-provider weeks recorded, not hidden
  - { id: distill,  needs: [research], output: cards -> triage }
budgets: { run: { tokens: 600k, usd: 9 } }
```

## 13. Non-goals, build order, acceptance

**Non-goals.** No scheduler service or queue; no generation machinery (the Provider Runtime is the only path); no new authority (every gate stays human); no mandatory migration (the four loops run as their documents specify regardless); no second guidance surface (`/next-actions` steers; `/workflow-status` feeds it); no hosted marketplace (repositories, versions, PRs — no store, accounts, telemetry, or auto-install); no self-approving capability (derivation and import draft; gates decide).

**Build order** — last, after document 4 completes; each phase an intent through the delivery workflow:

1. Definitions/Plans/Runs, `workflow-planner`, the command spine, the dispatch Action, migration (§11.1) — proving plan/run separation, sibling retry, and stale-plan refusal on one recurring report.
2. Stage DAGs, merge strategies, `corroborate`, the concurrency contract.
3. Budget lines with estimate → reserve → meter → reconcile and the guard.
4. The default catalog as class-2 registrations with the principle-6 no-duplication validation, plus the reviewer bumps (§11.4).
5. Derived capability and the marketplace — `/derive-extension`, `--once`, View Definitions with `DESIGN.md`, `/import-extension`, `extension-update`.

Further archetypes and extension kinds follow the same path; never an engine change.

**Acceptance.** Each scenario tests the canonical rule at the cited authority:

| ID | Scenario | Expected result | Authority |
|---|---|---|---|
| A1 | Retry a failed run | A sibling run uses identical hashes, pairings, and budget lines | §7 |
| A2 | Improve an approach | A superseding plan records the rationale; the old plan remains unchanged | §6 |
| A3 | Dispatch against superseded truth | Admission refuses the run and requests amendment | §7 |
| A4 | Run independent plans | They execute concurrently, serialized only at the sole writer and human gates | §9 |
| A5 | Exceed a stage line | The call is refused and the run halts | §8 |
| A6 | Dispatch a wrapped loop | The native loop mints one record set; step records only reference it | Principle 6 |
| A7 | Corroborating models disagree | The disagreement reaches the human gate explicit and unaveraged, over the same snapshot and declined history | §3 |
| A8 | An imported extension drifts upstream | `extension-update` proposes, but does not merge, a diff-attached version-bump PR | §5 |
| A9 | Dispatch a plan whose estimate exceeds the period ceiling | Admission is refused at reserve time; the only paths are a visible expiring override or a smaller amended plan | §8 |
| A10 | A trigger lapses, a run halts without follow-up, or a chain recurs hand-run | It surfaces in `/next-actions` with one paste-ready command | §4 |
| A11 | Derive or import an extension | It enters through the same class-scaled registration gate as a hand-written file; nothing self-approves | §5 |
| A12 | Regenerate a view; supersede a grounding card | The view regenerates exactly from its recorded hashes; the derived extension is cascade-flagged for re-derivation | §5 |
| A13 | A corroborate stage finds one eligible provider | It runs single and records `corroboration: unavailable`; confidence is not raised | §3 |
| A14 | Start a sibling while a run sits `halted` | Refused — `halted` is non-terminal; exits are override (resume) or superseding amendment (cancel + fresh run) | §7 |

Open questions from v12 are resolved as normative text in §3, §7, and principle 3, and tested by A13–A14.

---

*Graph-Native Workflow Runtime v13*
