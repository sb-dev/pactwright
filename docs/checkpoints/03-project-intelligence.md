# Pactwright — Checkpoint 3 — Project Intelligence

**Version:** 11  
**Entry condition:** Checkpoint 2 is accepted.  
**Release:** `0.0.3`  
**Exit capability:** Project Intelligence can cold-start Pactwright and Kakeido, govern durable project knowledge, contribute bounded context, compose into the established GitHub integration and derive one dependency-aware Intent roadmap without automatically creating Delivery work.

## 1. Goal

Implement Project Intelligence as the first real optional Pactwright Extension, prove its complete canonical validation/governance surface and compositional installation path, adopt it in Pactwright, ingest the current Pactwright authoritative/public corpus, then prove cold-start onboarding, grounding, context contribution, roadmap behaviour and published-version installation on Kakeido.

Checkpoint 3 must consume the generic Extension, one-shot initialisation and GitHub profile-composition machinery established by Checkpoints 1–2. It must not introduce PI-specific alternatives to those mechanisms.

## 2. Canonical baseline

- [01 — Core System and Lifecycle](../specs/01-pactwright-core-system-and-lifecycle.md)
- [02 — Distribution, Agent Packs, Extensions and Evaluation](../specs/02-distribution-agent-packs-extensions-and-evaluation.md)
- [03 — Project Intelligence](../specs/03-project-intelligence.md)
- [07 — GitHub Integration](../specs/07-github-integration.md)
- [08 — Open-Source Project Organisation](../specs/08-open-source-project-organisation.md)
- [Implementation Principles](./00-implementation-principles.md)
- [Implementation Guide](./00-implementation-guide.md)

Research logs are rationale only.

Kakeido acceptance uses the current canonical Kakeido specifications from the Kakeido repository.

This runbook defines implementation order, not new Project Intelligence semantics.

## 3. Execution contract

Every action follows:

```text
Step
→ References
→ Run
→ Expected result
→ Verify before continuing
```

Default location is Pactwright unless a step names Kakeido or a fixture.

For repository/code changes:

```bash
pnpm verify
```

After Checkpoint 2, coherent changes land through pull requests and required checks.

Class 2/3 PI promotion uses normal reviewed repository change infrastructure and applies canonical Knowledge mutations only after required approval.

## 4. Checkpoint scope

Checkpoint 3 implements and proves:

```text
@pactwright/project-intelligence
pactwright init --with project-intelligence --github
Source
Domain Definition
Knowledge
Source ingestion
triage classes 0–3
promotion boundary
promotion concurrency/failure rules
nine-domain registry
trust/evidence rules
coverage: Missing / Seeded / Covered
onboarding
one Intent roadmap derivation
ready / blocked / open / reopen-proposed candidate states
Delivery satisfaction and recurrence handling
propagation
freshness
bounded PI context contribution
complete Spec 03 validation matrix
PI GitHub profile/workflow/checks/views
PI evaluation cases
Pactwright corpus ingestion
public-content readiness gates
real 0.0.2 → 0.0.3 runtime/Agent Pack + PI installation
Kakeido cold start
```

### Capability rule

Project Intelligence may need AI-mediated responsibilities through the selected Agent Pack, but canonical Specs 02–03 deliberately do **not** define stable capability identifiers for triage, promotion and context.

Therefore this checkpoint must not recreate:

```text
intelligence-triage
intelligence-promotion
intelligence-context
```

under those or replacement names merely to satisfy implementation structure.

Implement PI AI behaviour through the existing selected Agent Pack/adaptation seam. If real implementation/evaluation proves a genuinely distinct capability decomposition is necessary, capture that evidence and update Specs 02–03 deliberately before treating the names as public contracts.

### Extension-originated Source scope

Real Graph Review Findings and Operations Observations do not exist yet.

This checkpoint must nevertheless implement their **different provenance shapes** through fixtures:

```text
Graph Review Finding
→ immutable non-graph execution output
→ internal Source using execution-output provenance

Operations Observation
→ canonical Operations Project Graph record
→ internal Source using canonical-record provenance
```

Do not assume every internal Source originates from a canonical Project Graph record.

### Deliberately unresolved

Do not invent:

- richer `digest` semantics;
- a recurrence scheduler/trigger service;
- richer evidence-independence metadata beyond current origin semantics;
- first-class processing/promotion graph records;
- richer numeric coverage scoring;
- canonical PI Agent Pack capability names.

## Stage 1 — Package and register Project Intelligence

### Step 1 — Create `@pactwright/project-intelligence`

**References:** Specs 02–03 Extension/package ownership.

**Run**

```text
Create `@pactwright/project-intelligence` as an independently publishable Pactwright Extension.

Register only PI-owned semantics:
- Source
- Domain Definition
- Knowledge
- PI edge types
- intelligence command namespace
- PI context contribution
- PI GitHub profile
- PI evaluation cases

Require no invented PI capability identifiers in the manifest.
If the implementation needs AI execution, resolve it through the selected Agent Pack without making a speculative public capability decomposition.
```

**Expected result**

Project Intelligence is independently loadable and owns only its canonical semantics.

**Verify before continuing**

Run manifest/Extension-resolution fixtures and prove disabling PI does not reinterpret core Delivery state.

### Step 2 — Implement PI repository layout and nine core domains

**References:** Spec 03 domain registry/repository model.

**Run**

```text
When PI is enabled, create canonical PI storage and derived-report locations and seed exactly the nine core Domain Definitions with their canonical dependency rules and default horizons.

Do not create project-specific Sources or Knowledge automatically.
```

**Expected result**

Every PI-enabled project begins with the canonical registry.

**Verify before continuing**

Assert all nine domains, dependency acyclicity and required definition fields.

### Step 3 — Implement `intelligence validate` and `register-domain`

**References:** Spec 03 commands/validation.

**Run**

```text
Implement:
- pactwright intelligence validate
- pactwright intelligence register-domain <id>

Validation starts with Source/Domain structure, core registry, dependencies and internal-Source provenance and expands as later stages implement Knowledge/roadmap semantics.

Non-core domain registration/retirement follows reviewed governance.
Core domains cannot be silently removed.
```

**Expected result**

PI has deterministic validation before semantic ingestion starts.

**Verify before continuing**

Remove a core domain and require failure; register a valid non-core domain; reject invalid dependency cycles.

## Stage 2 — Implement Source ingestion and triage

### Step 4 — Implement Source identity, versioning and storage boundary

**References:** Spec 03 Source/internal-Source model.

**Run**

```text
Implement Source identity as `canonical_id + content_hash`.
Support:
- document / internal / digest source types;
- snapshot / reference storage independently;
- captured_at / observed_at;
- version_of;
- active / withdrawn / retracted status;
- origin;
- trust;
- triage metadata.

Run secret detection before committing snapshot content.
If stored bytes are later removed, retain provenance/hash and require dependent Knowledge revalidation.

Internal Source provenance must preserve enough information to recover:
- originating Extension/process;
- originating canonical record identity + hash where one exists;
- originating execution-output identity + hash where the upstream object is non-canonical;
- supporting evidence where applicable;
- originating Project Graph revision.

Source capture never transfers ownership or changes whether the originating object is canonical Project Graph state.
```

**Expected result**

Source capture is immutable, traceable and idempotent across external and future Extension origins.

**Verify before continuing**

Test duplicate, changed version, reference-only, secret rejection, byte removal/revalidation, valid canonical-origin internal Source and valid non-canonical execution-output internal Source. For both internal forms verify origin/process, hash and originating Project Graph revision are retained.

### Step 5 — Implement triage classes 0–3

**References:** Spec 03 ingestion/triage and automatic-mutation boundary.

**Run**

```text
Implement triage over identity, relevance, primary domain, comparison with current Knowledge and linked dependants, disposition and consequence class.

Dispositions:
- irrelevant
- duplicate
- corroborating
- incremental
- novel
- contradictory

Class 0/1 may capture Sources, evidence links, derived evidence state and eligible freshness effects only.
Class 2/3 require reviewed promotion before canonical meaning changes.
No registered domain fit => propose a new Domain Definition as class 2; do not write one silently.

Consequence, not Source origin or Extension metadata, determines governance ceremony.
```

**Expected result**

Triage stops cheap cases early and routes meaning-changing cases through review.

**Verify before continuing**

Prove a class-1 Source cannot alter Knowledge conclusions, requirement/constraint/decision meaning, Delivery records or sibling-Extension canonical state; prove no-domain-fit produces a reviewed class-2 proposal.

### Step 6 — Expose `ingest`, `triage` and `promote`

**References:** Spec 03 command/promotion/concurrency/failure model.

**Run**

```text
Implement:
- pactwright intelligence ingest <path-or-url>
- pactwright intelligence triage <source-id>
- pactwright intelligence promote <source-id>

Promotion must:
- analyse against current Project Graph state;
- propose PI Knowledge/edge mutations and affected-record information;
- identify Delivery/sibling effects without mutating their records;
- perform no canonical class-2/3 mutation before required approval;
- route review through the relevant logical owners;
- apply only validated PI-owned mutations after approval;
- run propagation after accepted class-3 change.

Conflicting promotions use normal repository isolation: rebase and rerun validation against current Project Graph state. Do not use last-writer-wins semantics.

Failure rules:
- failed ingestion is recorded in derived `reports/failed-ingestion.md` without partial canonical mutation;
- failed promotion preserves the captured Source;
- rerunning triage/promotion uses current Project Graph state;
- failed future Extension hand-off leaves its originating object valid/retryable under the owning semantics;
- report-generation failure never mutates canonical PI state.
```

**Expected result**

One ingestion/promotion path serves founding material, research and future Extension-originated Sources while preserving review and concurrency boundaries.

**Verify before continuing**

Run duplicate/versioned ingestion, class-2 no-preapproval-mutation, failed-ingestion, failed-promotion, stale-promotion/rebase/revalidation and retryable hand-off fixtures.

## Stage 3 — Implement Knowledge and relationships

### Step 7 — Implement Knowledge governance

**References:** Spec 03 Knowledge model/governance/evidence/freshness.

**Run**

```text
Implement Knowledge fields, status, evidence links, review horizon, supersession/retraction and recurrence policy.

Enforce:
- every accepted Knowledge record belongs to a registered domain and has at least one Source;
- new/changed canonical conclusion requires human approval;
- trust is claim-relative and is not assigned solely from Source type/origin;
- empirical observation/interpretation/hypothesis gain authority from evidence and may decay;
- one T0 Source may be sufficient where appropriate;
- T1 normally requires independent corroboration;
- T2/T3 cannot alone establish accepted empirical Knowledge;
- derivatives sharing one evidential origin count as one origin;
- requirement/constraint authority is approval-governed and cannot be outvoted by Source counts;
- PI `decision` is durable project Knowledge distinct from a Delivery Graph Decision and changes by approved superseding decision;
- recommendation requires steward acceptance and may decay;
- forecast remains provisional until resolved and expires at its horizon;
- evidence may challenge authority-driven Knowledge but never silently overturn it;
- recurrence records durable policy only; no scheduler is introduced here.
```

**Expected result**

Knowledge represents accepted current project meaning without replacing Source provenance or Delivery authority.

**Verify before continuing**

Test T0 sufficiency, T1 independent corroboration, T2/T3 insufficiency, shared-origin derivatives, requirement/constraint authority, PI-decision distinction/supersession, recommendation acceptance, forecast expiry, supersession, retraction and recurrence validation.

### Step 8 — Implement PI and cross-graph relationships

**References:** Spec 03 relationships/Delivery obligations.

**Run**

```text
Register and validate:
- depends-on
- supports
- contradicts
- constrains
- affects
- requires-delivery
- satisfied-by
- supersedes
- retracts
- informs-only

Preserve ownership across graph boundaries.
`requires-delivery` targets a Delivery Intent.
`satisfied-by` targets Delivery Evidence.
Raw Sources, Findings and Observations cannot directly create Delivery Intents.

Delivery-obligation semantics remain PI-derived but Delivery-owned:
- accepted requirement Knowledge produces a candidate unless already satisfied;
- other accepted Knowledge produces a candidate only when its approved conclusion explicitly requires Delivery;
- once an Intent is explicitly captured, motivating Knowledge may link through `requires-delivery`;
- constraints normally contribute `constrains`;
- observations/interpretations/hypotheses/recommendations are normally `informs-only` unless approved meaning creates an obligation.
```

**Expected result**

PI connects project meaning to Delivery without owning Delivery records.

**Verify before continuing**

Run valid/invalid cross-owner relation fixtures and prove no raw Source/Finding/Observation can create `requires-delivery` or a canonical Intent directly.

## Stage 4 — Implement onboarding, roadmap, satisfaction, propagation and freshness

### Step 9 — Implement exact coverage and onboarding semantics

**References:** Spec 03 coverage/onboarding.

**Run**

```text
Implement exact states:

Missing
→ one or more canonical artifact types have no accepted, in-horizon Knowledge

Seeded
→ every canonical artifact type has at least one accepted, in-horizon Knowledge record

Covered
→ domain is Seeded and every declared coverage_slot is answered by accepted current Knowledge

A domain without coverage slots stops at Seeded.

Implement `pactwright intelligence onboard` and deterministic revision-stamped onboarding/domain-map reports.

Follow canonical dependency-aware ordering:
1. surface gaps whose prerequisites are already Seeded;
2. at cold start prioritise discovery/product/identity;
3. surface independent delivery/ux, delivery/eng, decisions and handbooks gaps in parallel where applicable;
4. unlock go-to-market when discovery/product/identity are Seeded;
5. unlock content when go-to-market is Seeded.

Knowledge gaps produce Source/research/Decision guidance, never fabricated Knowledge or automatic Intents.
```

**Expected result**

Onboarding answers what the project still needs to know using the exact canonical coverage model.

**Verify before continuing**

Test Missing→Seeded→Covered, canonical-artifact requirements, slot-free Seeded ceiling, dependency unlock and regeneration after staleness/domain change/supersession/retraction.

### Step 10 — Implement the single Intent roadmap derivation and ordering

**References:** Spec 03 Intent roadmap/readiness/ordering.

**Run**

```text
Implement `pactwright intelligence derive-intent-roadmap`.

Derive exactly one project-wide candidate set from:
- accepted requirements not yet satisfied;
- accepted Knowledge whose approved conclusion explicitly requires Delivery;
- existing open Intents;
- delivered work whose grounding Knowledge became challenged/superseded/retracted;
- future accepted operational meaning requiring corrective work.

Raw Sources, Findings and Observations never directly become candidates.

Every candidate preserves motivating Knowledge, supporting Sources, relevant existing Intent and originating Extension provenance where applicable.

Implement exact candidate states:
- ready
- blocked
- open
- reopen-proposed

Ready requires hard Delivery dependencies satisfied and required domain dependencies Seeded. Otherwise the candidate is blocked and links to the missing dependency/knowledge conditions.

Represent ordering as a dependency DAG rendered in waves, not a total ranking. Within otherwise ready work apply canonical precedence:
1. legal/security/safety obligations;
2. active reliability risk;
3. hard technical dependencies;
4. committed Delivery obligations;
5. approved go-to-market launch sequencing;
6. uncertainty reduction and strategic value.

Do not create Intents automatically and do not introduce an Extension-specific second candidate/ranking model.
```

**Expected result**

The roadmap proposes traceable dependency-aware work while Delivery remains authoritative for creating Intents.

**Verify before continuing**

Exercise each candidate origin/state, dependency-wave ordering and precedence tier. Prove roadmap generation creates no Intent, blocked candidates point to exact gaps, and Extension-specific filtered fixture views cannot introduce candidates absent from the PI roadmap.

### Step 11 — Implement Delivery satisfaction, recurrence, propagation and freshness

**References:** Spec 03 satisfaction/recurrence/propagation/freshness.

**Run**

```text
Implement:
- pactwright intelligence propagate <knowledge-id>
- pactwright intelligence refresh

Delivery satisfaction:
- `Knowledge --satisfied-by--> Evidence` closes the outstanding one-off obligation where appropriate;
- for recurring obligations, satisfying Evidence closes the current occurrence while recurrence policy remains durable;
- recurring work must not remain represented as a permanently unsatisfied one-off candidate;
- later accepted evidence that the real-world outcome failed may produce a new/reopen-proposed candidate through normal Source → Knowledge governance;
- prior Delivery Evidence remains factual history.

Propagation runs when accepted Knowledge is challenged, superseded or retracted and produces review/change proposals for affected dependants. It never silently edits Delivery or sibling-Extension canonical records. Retraction always requires direct-dependant revalidation.

Freshness marks overdue Knowledge stale and regenerates freshness views without changing the Knowledge conclusion.
```

**Expected result**

Outstanding obligations, changed grounding and staleness are surfaced mechanically without ownership violations or scheduler overengineering.

**Verify before continuing**

Test one-off satisfaction removal, recurring-occurrence closure with durable recurrence, reopen-proposed behaviour after later governed evidence, challenged/superseded/retracted propagation, direct-dependant revalidation and freshness without conclusion mutation.

## Stage 5 — Integrate PI with Delivery, GitHub, evaluation and validation

### Step 12 — Implement bounded PI context contribution

**References:** Spec 03 Delivery context; Spec 01 context assembly.

**Run**

```text
Contribute namespaced PI context into the existing Pactwright context-assembly API.
Select accepted, relevant and sufficiently current Knowledge using Domain Definition recipes, graph relationships and requested responsibility.
Do not load every Source, report, execution log, raw telemetry or stale/challenged record by default.
Do not introduce `pactwright context` as a required public CLI contract merely for this checkpoint.

The same generic context seam must support:
- Contract crafting;
- Brief generation;
- Delivery;
- Review;
- future Graph Review consumption through a fixture responsibility.
```

**Expected result**

Pactwright responsibilities can receive bounded project grounding without reconstructing durable knowledge from conversation history.

**Verify before continuing**

Use fixture responsibilities needing different domains, including a future Graph Review-style responsibility, and inspect selected/excluded context.

### Step 13 — Compose the PI GitHub profile into the established integration

**References:** Specs 07 Project Intelligence automation/profile and Checkpoint 2 composition/reconciliation foundation.

**Run**

```text
Contribute the PI GitHub profile through the generic Checkpoint 2 composition engine. Do not create a PI-specific GitHub planner, Project or reconciliation path.

Generate `.github/workflows/pactwright-intelligence.yml` and implement the canonical PI GitHub surface:

Source capture automation
→ validates Source schema, identity/hash, registered domain, origin/trust, storage mode, secret scan and triage output

Promotion automation
→ validates proposed Knowledge/edges, required approval, automatic-boundary compliance, affected records and logical-owner review routing

Report automation
→ runs onboard / derive-intent-roadmap / propagate / refresh at the canonical events while reports remain derived

Checks
→ Pactwright / Intelligence
→ Pactwright / Intelligence Promotion
→ Pactwright / Intelligence Views
→ Pactwright / Intelligence Grounding

Grounding states
→ grounded
→ attention
→ blocked
→ not-applicable

Promotion PR projection
→ proposed PI mutations distinguished from downstream recommendations

Shared Project contributions
→ Promotions
→ Coverage
→ Roadmap
→ Freshness
→ Propagation

Delivery PR grounding contribution
→ relevant domain/grounding/freshness/Knowledge links without copying complete Knowledge.

GitHub never owns Source, Knowledge, coverage, candidate or propagation semantics.
Reports remain revision-stamped derived views and stale reports are distinguishable from invalid canonical state.
```

**Expected result**

PI operates remotely through the same thin workflow, shared Project and desired-state composition model established in Checkpoint 2.

**Verify before continuing**

Prove:
- Core-only state remains unchanged when PI is disabled;
- Core + PI composes into the same shared Project;
- enabling PI adds only PI-managed workflow/check/view/profile contributions;
- disabling/removing PI removes only safely owned generated/remote contributions while preserving user-authored and PI canonical data;
- all four exact checks and Grounding states operate;
- stale derived reports are distinguishable from invalid Knowledge;
- GitHub metadata cannot directly promote Knowledge or create an Intent.

### Step 14 — Add PI evaluation cases without canonising capability names

**References:** Specs 02–03 evaluation boundary.

**Run**

```text
Add Project Intelligence evaluation cases for:
- source triage/disposition/class;
- evidence/trust comparison and independence;
- unsupported promotion;
- promotion revalidation against changed graph state;
- bounded Knowledge selection/context contribution;
- roadmap provenance/state/ordering/no automatic Intents;
- recurrence/satisfaction behaviour where AI-mediated interpretation participates.

Route cases through the actual PI AI execution seam used by the implementation.
Do not name a public PI capability decomposition unless implementation evidence first justifies updating Specs 02–03.
```

**Expected result**

PI AI-mediated behaviour is measurable without speculative capability contracts.

**Verify before continuing**

Run `pactwright eval`, inspect PI cases individually and inject at least one known regression so the affected PI dimension is surfaced.

### Step 15 — Complete the canonical PI validation matrix

**References:** Spec 03 validation.

**Run**

`pactwright intelligence validate` must now enforce the complete minimum Spec 03 contract:

```text
1. Source IDs, hashes, version links, domains, origins and trust values are valid.
2. Source type and storage mode are valid independent fields.
3. Snapshot Sources passed secret scanning before canonical capture.
4. Removed stored bytes retain provenance/hash and force dependent Knowledge revalidation.
5. Internal Sources reference valid canonical-record or execution-output provenance as applicable.
6. Graph Review-originated Source provenance does not make Findings Project Graph nodes.
7. Operations-originated Source provenance references canonical Observations without transferring ownership.
8. All nine core Domain Definitions exist while PI is enabled.
9. Domain Definitions contain required scope, stewardship, horizon, artifact and dependency information.
10. Domain dependencies reference registered domains and are acyclic.
11. Every accepted Knowledge record references a registered domain and at least one Source.
12. Knowledge kinds follow their governance rules.
13. Superseded Knowledge points to valid replacements.
14. Retracted Knowledge forces direct-dependant revalidation.
15. Class 0/1 mutations do not change canonical meaning, Delivery state or sibling canonical state.
16. Class 2/3 canonical changes have required human approval.
17. PI edge types use valid endpoints.
18. Cross-graph edges preserve record ownership.
19. `requires-delivery` targets a valid Delivery Intent.
20. `satisfied-by` targets valid Delivery Evidence.
21. Recurring obligations are not simultaneously treated as permanently unsatisfied one-off obligations without explicit justification.
22. Roadmap candidates preserve motivating Knowledge and Source provenance.
23. Extension-originated roadmap provenance traces through valid Sources.
24. An Extension Finding/Observation alone cannot create a canonical Delivery Intent.
25. Generated onboarding and roadmap reports record the Project Graph revision they derive from.
26. Extension-specific roadmap projections cannot introduce candidates absent from the PI roadmap.
27. Coverage obeys exact Missing/Seeded/Covered semantics including the slot-free Seeded ceiling.
```

Core `pactwright validate` must invoke PI validation when PI is enabled and must not reinterpret PI semantics itself.
Validation is read-only.

**Expected result**

The complete Project Intelligence semantic contract is machine-enforced before Pactwright adopts PI.

**Verify before continuing**

Maintain positive fixtures plus at least one failing fixture for every numbered rule or tightly coupled rule group. Run both `pactwright intelligence validate` and core `pactwright validate`; deliberate PI invalidity must fail both without mutating state.

### Step 16 — Prove compositional one-shot initialisation with real PI

**References:** Spec 02 one-shot initialisation; Specs 03 and 07 integration.

**Run**

Using clean fixture repositories, prove:

```text
pactwright init --with project-intelligence --github
```

composes the same underlying mechanisms as:

```text
pactwright init
pactwright extension add project-intelligence
# enable GitHub through the same normal configuration operation
pactwright sync
pactwright github sync
```

Use workspace/packed Checkpoint 3 packages rather than inventing a separate test-only installation path.

**Expected result**

The canonical first real Extension + GitHub one-shot path produces the same resolved Pactwright environment and integration as explicit operations.

**Verify before continuing**

Compare configuration, package state, `.pactwright/lock.yml`, environment lock identity, generated adapter/workflow files and GitHub desired/applied state. Require semantic equivalence and convergence, not merely command success.

## Stage 6 — Adopt Project Intelligence in Pactwright

### Step 17 — Enable PI from the workspace

**References:** Spec 02 Extension add; Spec 03.

**Run**

```bash
pnpm build
pnpm pactwright extension add project-intelligence
pnpm pactwright intelligence validate
pnpm pactwright sync
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
pnpm pactwright validate
```

**Expected result**

Pactwright has PI enabled from its workspace build with no invented capability requirement and the composed GitHub surface converges.

**Verify before continuing**

All PI/core validations pass, the shared Project remains singular and remote state converges.

### Step 18 — Ingest the current Pactwright authoritative corpus

**References:** Specs 03 and 08 document authority.

**Run**

Ingest the current canonical Pactwright sources, including:

```text
docs/specs/01-pactwright-core-system-and-lifecycle.md
docs/specs/02-distribution-agent-packs-extensions-and-evaluation.md
docs/specs/03-project-intelligence.md
docs/specs/04-graph-review.md
docs/specs/05-assets-and-publication.md
docs/specs/06-operations.md
docs/specs/07-github-integration.md
docs/specs/08-open-source-project-organisation.md
README.md
current material public enough to contain product claims/identity/guidance
```

Do not ingest obsolete research logs as if they were current authority merely because they historically informed the specs.

For each Source, triage and promote only where required/approved.

Then run:

```bash
pnpm pactwright intelligence onboard
pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright intelligence validate
pnpm pactwright validate
```

**Expected result**

Current Pactwright truth enters PI through normal Source governance.

**Verify before continuing**

Accepted Knowledge remains Source-traceable; class 2/3 changes have approved promotion; no roadmap candidate became an Intent automatically.

### Step 19 — Promote pre-PI bootstrap authority into durable Knowledge where applicable

**References:** Spec 08 PI bootstrap/public-content authority.

**Run**

```text
Identify authorised pre-PI Decisions, Contracts and verified repository material that should become durable current project knowledge, especially identity/positioning/product authority used by Checkpoints 1–2.

Capture them as Sources, triage normally and use reviewed promotion where required.
Do not silently convert Contract text into Knowledge.
```

**Expected result**

Pre-PI Delivery authority remains historical lineage while accepted PI Knowledge becomes the durable current grounding source.

**Verify before continuing**

Sample each promoted strategic item and trace Source → approval → accepted Knowledge.

### Step 20 — Deliver and satisfy one real Pactwright roadmap candidate

**Run**

```bash
pnpm pactwright intelligence derive-intent-roadmap
```

Select one ready Pactwright outcome, explicitly capture it as an Intent, then deliver it through normal Contract-driven Delivery using bounded PI context.

Where the candidate represents a one-off PI obligation, record the valid `satisfied-by` relationship to resulting Delivery Evidence and regenerate the roadmap.

**Expected result**

PI proposes; Delivery authorises/executes; accepted Evidence can satisfy the motivating obligation without rewriting historical Knowledge or Evidence.

**Verify before continuing**

Trace candidate → motivating Knowledge/Sources → explicit Intent → Evidence → `satisfied-by`; prove the completed one-off obligation is no longer outstanding while unrelated/recurring obligations remain correctly represented.

## Stage 7 — Establish Pactwright public-content readiness

### Step 21 — Establish exact applicable public-domain readiness

**References:** Specs 03 and 08 public-content readiness.

**Run**

```bash
pnpm pactwright intelligence onboard
```

Determine which domains the Checkpoint 3 public learning path actually depends on and require the canonical Spec 08 readiness matrix:

```text
identity
→ Covered for public/outbound work whose identity, voice or values matter

content
→ Covered for editorial, educational or marketing work

product
→ Covered when making Pactwright capability, value, behaviour or limitation claims

go-to-market
→ Covered for acquisition, positioning, CTA or campaign work

delivery/ux
→ Covered for user-facing workflow or UX claims

delivery/eng
→ Covered for technical implementation claims

other applicable subject domain
→ Covered when factual claims depend on it
```

For every relied-on claim/constraint, require accepted, in-horizon Knowledge with traceable Sources.
Preserve domain dependency ordering while closing gaps.

Any missing strategic choice must become an explicit Decision through normal Delivery before it is promoted into PI Knowledge.
Do not require unrelated domains to become Covered merely for ceremony.
```

**Expected result**

Every domain applicable to the planned public work satisfies the exact public-content readiness gate and every relied-on claim is governed current Knowledge.

**Verify before continuing**

Inspect domain-map/onboarding, assert `Covered` for every applicable domain, and trace the exact Knowledge/Sources used by the planned public work. Missing applicable coverage must block approval of that public Delivery.

### Step 22 — Publish the Project Intelligence learning path

**References:** Spec 08 Project Intelligence milestone.

**Run**

Through normal Pactwright Delivery, publish/update:

```text
Project Intelligence concepts
PI onboarding guide
one executable project-intelligence example
Academy Project Understanding lesson
README/website discovery links where needed
```

Ground applicable public claims in accepted current PI Knowledge and retain the Knowledge actually relied on by the Delivery where grounding applies.

After acceptance, ingest material public content as Sources when it materially represents current project claims. Do not promote derivative copy back into Knowledge unless it contains genuinely new accepted meaning.

**Expected result**

Project Intelligence both governs the project and explains itself from governed truth.

**Verify before continuing**

Public claims agree with accepted PI Knowledge, the example runs in CI where practical, resulting Sources remain traceable and challenged/superseded/retracted relied-on Knowledge before approval requires re-grounding rather than silent continuation.

## Stage 8 — Release `0.0.3`

### Step 23 — Publish the `0.0.3` package family

**References:** Implementation Guide npm release model.

Use the normal release PR path.

The new first-publication package is:

```text
@pactwright/project-intelligence@0.0.3
```

Bootstrap trusted publishing only for that new package, then tag accepted source `v0.0.3` so trusted publishing releases the full compatible family:

```text
pactwright@0.0.3
@pactwright/standard@0.0.3
@pactwright/project-intelligence@0.0.3
```

**Verify before continuing**

All three versions resolve and trusted-publisher/provenance expectations hold.

## Stage 9 — Cold-start Kakeido

### Step 24 — Upgrade Kakeido from accepted `0.0.2` and install PI through Pactwright ownership paths

**References:** Spec 02 upgrade/Extension installation ownership.

**Run**

Start from the accepted Checkpoint 2 Kakeido environment. Do not preinstall `0.0.3` packages manually before exercising Pactwright upgrade/install commands.

```bash
pnpm pactwright upgrade --to 0.0.3
pnpm pactwright agent-pack upgrade
pnpm pactwright extension add @pactwright/project-intelligence@0.0.3
pnpm pactwright intelligence validate
pnpm pactwright sync
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
pnpm pactwright validate
```

`pactwright upgrade` owns runtime upgrade orchestration through the project package manager. `agent-pack upgrade` owns the selected Agent Pack. `extension add` owns installation/registration/locking of the new PI package.

**Expected result**

Kakeido moves from the real published `0.0.2` environment to the exact published Checkpoint 3 family without bypassing Pactwright's ownership-specific upgrade/install mechanisms.

**Verify before continuing**

Verify package-manager state and `.pactwright/lock.yml` identify `pactwright@0.0.3`, `@pactwright/standard@0.0.3` and `@pactwright/project-intelligence@0.0.3`; the new runtime performed migration/validation; the PI GitHub profile composed into the existing shared integration; a second GitHub dry-run converges; user-owned workflows/remote state remain unchanged.

### Step 25 — Discover and ingest the current Kakeido canonical corpus

**References:** current Kakeido repository document authority.

**Run**

```text
Enumerate the current canonical Kakeido specification set from the Kakeido repository.
Record the selected file paths/versions.
Ingest each authoritative specification through `pactwright intelligence ingest`.
Do not assume the historical five August documents are still the complete canonical set.
```

For every Source:

```bash
pnpm pactwright intelligence triage <source-id>
# promote only where reviewed promotion is required and approved
```

Then:

```bash
pnpm pactwright intelligence onboard
pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright intelligence validate
pnpm pactwright validate
```

**Expected result**

Kakeido knowledge is distributed across the canonical domain registry rather than flattened into one summary.

**Verify before continuing**

Onboarding/roadmap reflect the current Kakeido project, candidate states/readiness are explainable from current Knowledge/dependencies and no candidate became a canonical Intent automatically.

### Step 26 — Deliver one current cross-domain Kakeido candidate

Select one ready Kakeido candidate requiring multiple current knowledge domains, explicitly capture it as an Intent and complete normal Delivery.

Use the implementation's bounded PI context contribution through the Agent Pack/adapter path, not an invented public `pactwright context` dependency.

**Expected result**

The Delivery preserves relevant Kakeido product/domain/engineering constraints without loading unrelated project history.

**Verify before continuing**

Trace candidate → Knowledge/Sources → Intent → Evidence, record `satisfied-by` where the Delivery satisfies a PI obligation, regenerate the roadmap and run current Kakeido repository-defined tests.

## Stage 10 — Capture Checkpoint 3 feedback through PI

### Step 27 — Ingest checkpoint findings as Sources

**References:** Implementation Principles feedback/evaluation rules.

Capture defects, installation friction, context-selection failures, promotion/governance problems, GitHub-profile problems, roadmap errors and public-content corrections from Pactwright/Kakeido as Sources.

For each:

```bash
pnpm pactwright intelligence ingest <finding-path>
pnpm pactwright intelligence triage <source-id>
# promote only where justified and approved
```

Then regenerate the Intent roadmap.

Do not generalise Kakeido-specific preferences into Pactwright semantics.

**Expected result**

Checkpoint learning is durable project evidence rather than chat/repository folklore.

**Verify before continuing**

Each material finding has Source provenance/triage and justified candidates remain candidates until explicitly captured as Intents.

## Exit gate

Checkpoint 3 closes only when:

- `@pactwright/project-intelligence` is independently installable;
- `pactwright init --with project-intelligence --github` is proven compositionally equivalent to the explicit Extension + GitHub setup path;
- no unsupported PI capability identifiers have been canonised;
- all nine core domains exist and validate;
- Source identity/versioning/storage/provenance works for canonical-record and non-canonical execution-output origins, including originating Project Graph revision;
- triage classes and class 0/1 automatic-mutation boundaries are enforced;
- promotion revalidates against current graph state, preserves captured Sources on failure and does not use last-writer-wins semantics;
- changed/new canonical Knowledge meaning requires approval;
- the canonical trust/evidence rules, Knowledge-kind governance, supersession, retraction and recurrence-policy rules validate;
- exact Missing/Seeded/Covered semantics and dependency-aware onboarding work;
- exactly one PI Intent-roadmap derivation exists, supports `ready | blocked | open | reopen-proposed`, applies canonical dependency-wave/precedence rules and creates no Intents automatically;
- one-off satisfaction and recurring-obligation semantics work without introducing a scheduler;
- propagation/freshness preserve ownership boundaries;
- bounded PI context contributes through the existing Pactwright context assembly seam, including a fixture proving future Graph Review can consume the same generic seam;
- all 27 minimum Spec 03 validation rules are machine-enforced by `pactwright intelligence validate`, and core `pactwright validate` delegates to it when PI is enabled;
- PI contributes through the Checkpoint 2 GitHub profile-composition/reconciliation engine rather than a second integration path;
- `pactwright-intelligence.yml`, all four canonical PI checks, exact Grounding states, promotion projection, Delivery grounding and shared Project PI views operate as thin runtime surfaces;
- Pactwright's current canonical/public corpus and applicable pre-PI bootstrap authority are governed through Source ingestion/promotion;
- Pactwright delivers and satisfies one real roadmap candidate only after explicit Intent capture;
- every applicable Spec 08 public-content domain is Covered before the PI learning path is approved, and relied-on claims are accepted/in-horizon/Source-traceable;
- the PI public learning path is grounded in accepted current Knowledge and its executable example is validated;
- the `0.0.3` family is registry verified;
- Kakeido performs a real `0.0.2 → 0.0.3` runtime/Agent Pack upgrade and PI installation through Pactwright-owned commands rather than preinstallation;
- Kakeido is cold-started from its current canonical specification corpus and completes one cross-domain Delivery;
- checkpoint findings flow through PI itself;
- no known blocking failure is carried into Checkpoint 4.

---

**Pactwright — Checkpoint 3 — Project Intelligence v11**