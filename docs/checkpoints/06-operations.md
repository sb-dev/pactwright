# Pactwright — Checkpoint 6 — Operations

**Version:** 13  
**Entry condition:** Checkpoint 5 is accepted.  
**Release:** `0.0.6`  
**Exit capability:** Pactwright and Kakeido can record real software exposure, collect bounded operational evidence, create durable Observations, route every canonical Observation through Project Intelligence, and prove governed corrective candidates without turning Operations into a telemetry store or second roadmap.

## 1. Goal

Implement Operations as the next independent Pactwright Extension:

```text
Evidence
→ operational exposure
→ bounded operational evidence
→ Observation
→ Project Intelligence Source
→ accepted Knowledge / PI candidate where justified
→ explicit Intent
→ normal Delivery
```

Checkpoint 6 consumes the generic Extension, capability, graph, context, evaluation and GitHub composition mechanisms established by Checkpoints 1–5. It must not introduce Operations-specific alternatives to those mechanisms.

Prove the generic exposure model with native `Deployment` plus a fixture Extension-contributed exposure type. Real Publication exposure conformance and feedback remain in Checkpoint 7.

Live evidence may legitimately yield no Observation. Separately prove the positive Observation → PI → corrective-candidate path with supported live evidence or an explicitly labelled isolated fixture; never manufacture a real operational finding or corrective Delivery to pass acceptance.

## 2. Canonical baseline

Canonical Pactwright semantics come from:

- [01 — Core System and Lifecycle](../specs/01-pactwright-core-system-and-lifecycle.md)
- [02 — Distribution, Agent Packs, Extensions and Evaluation](../specs/02-distribution-agent-packs-extensions-and-evaluation.md)
- [03 — Project Intelligence](../specs/03-project-intelligence.md)
- [04 — Graph Review](../specs/04-graph-review.md)
- [05 — Assets and Publication](../specs/05-assets-and-publication.md)
- [06 — Operations](../specs/06-operations.md)
- [07 — GitHub Integration](../specs/07-github-integration.md)
- [08 — Open-Source Project Organisation](../specs/08-open-source-project-organisation.md)
- [Implementation Principles](./00-implementation-principles.md)
- [Implementation Guide](./00-implementation-guide.md)

Research logs are rationale only. Kakeido acceptance uses the current canonical Kakeido specifications in its repository, not stale embedded copies.

This runbook defines implementation order and acceptance, not new Pactwright semantics.

## 3. Execution contract

Every implementation action follows:

```text
Step
→ References
→ Run
→ Expected result
→ Verify before continuing
```

Default execution location is the Pactwright repository root unless a step names Kakeido or a fixture. Fixture data and resources must be labelled and isolated from real project truth.

For repository/code changes:

```bash
pnpm verify
```

Before newly implemented repository-local commands:

```bash
pnpm build
```

After Checkpoint 2, coherent changes land through pull requests and required checks. Dynamic source, execution, Deployment, Observation, Source and candidate identifiers consumed later must be printed or resolved by earlier steps.

Use [Checkpoint 2 — Exact-version upgrade acceptance](./02-remote-delivery.md#exact-version-upgrade-acceptance) for the `0.0.5 → 0.0.6` consumer transition. Prove exact targets and compatible intermediate states before release; do not preinstall target packages, edit either lock or invent component upgrade flags.

Use the same GitHub prerequisite handling established in Checkpoint 2: land a new managed workflow on the default branch before enabling required checks it must produce. Incomplete activation must be reported, not treated as convergence.

## 4. Checkpoint scope

Checkpoint 6 implements and proves:

```text
@pactwright/operations and its real PI dependency lifecycle
operations-analysis in the selected first-party Agent Pack
complete Deployment / Observation schemas
immutable Deployment events and explicit canonical corrections
registered operational exposure discovery and failure cases
source/environment configuration and bounded adapter conformance
separate immutable collection and analysis provenance
safe ingest → observe evidence hand-off
Observation deduplication / supersession / significance neutrality
Observation → PI Source provenance and idempotent retry
PI-derived corrective roadmap and report-failure isolation
complete 17-rule Operations validation matrix
bounded Operations context with PI knowledge authority
Graph Review conformance over real Operations record types
Operations semantic and GitHub integration evaluation
pactwright-operations.yml and shared Project contributions
real Pactwright and Kakeido software exposure feedback
positive governed consequence-path acceptance
Operations public learning path under existing PI readiness gates
exact published 0.0.5 → 0.0.6 upgrade and installation
```

### Open gaps that remain open

Do not silently invent:

- exact Deployment event identity distinguishing retry from genuine redeployment/rollback;
- exact Observation identity/deduplication key for semantic equivalence;
- durable retention policy for mutable/expiring external evidence locators;
- universal persistence/lifetime of bounded evidence between `ingest` and `observe`;
- exact pinned corrective-roadmap CLI syntax;
- a general automation-concurrency policy beyond Spec 07's validation and no-lost-update guarantees.

Implement safe, documented mechanisms for the supported cases and expose ambiguity where identity or evidence cannot be established. Do not add an Operations rerun command, archive service, telemetry database, incident platform or independent prioritisation engine.

Operations execution provenance must retain the runtime-supplied Project Graph revision. Do not require a full replay tuple for every revision-aware report or claim pinned replay without the owning semantic contract. Any supported operation that does promise pinned replay must obey the existing exact-reconstruction and fail-explicitly rules.

## Stage 1 — Package Operations and its capability

### Step 1 — Create `@pactwright/operations` and prove dependency management

**References:** Specs 02 §§10–13 and 06 §§2, 17.

**Run**

```text
Using self-hosted Pactwright Delivery, create @pactwright/operations as a publishable first-party Extension.

Its manifest must:
- require Project Intelligence;
- register Deployment and Observation canonical record types;
- register Evidence --deployed-as--> Deployment;
- register Observation --observes--> registered operational exposure;
- support Deployment/Observation supersession through the shared relationship registry;
- register the operations runtime namespace, context, evaluation and GitHub contributions;
- require exactly the distinct capability operations-analysis;
- not depend on Graph Review, Assets / Publication or any particular Production Skills family.

Use the existing generic dependency/capability/lock/sync transaction. Do not build an Operations-specific installer.
```

For this step's positive activation fixtures, explicitly select a compatible fixture Agent Pack supplying the complete core/PI requirements plus `operations-analysis`. Do not assume Step 2's updated standard pack exists yet. Repeat the proof with that real pack after Step 2.

**Expected result**

Operations installs independently, resolves PI first when absent and preserves the existing valid environment on failure.

**Verify before continuing**

Prove PI-absent installation and exact dependency locking; reject PI-only removal while Operations depends on it; remove Operations safely, then permit PI removal only when no other enabled dependent requires it. Use minimal and populated fixtures. Preserve canonical records and execution history on removal, and remove only exclusively owned generated contributions.

Test incompatible dependencies and missing capabilities before canonical mutation. Failed activation must preserve prior package/configuration/lock/generated state and must not silently select another Agent Pack.

### Step 2 — Add `operations-analysis` to `@pactwright/standard`

**References:** Specs 02 capability/evaluation rules and 06 §17.

**Run**

```text
Extend @pactwright/standard to provide operations-analysis.

The capability interprets already collected bounded evidence:
- compare with relevant baselines;
- correlate with registered exposures;
- distinguish noise from durable findings;
- preserve uncertainty;
- avoid unsupported causal claims;
- propose concise candidate Observations.

Deterministic collection, hashing, exposure resolution, schema validation, duplicate checks where identity is known, graph mutation, PI hand-off and report generation remain runtime-owned.

Do not require Production Skills or Deep Research Skills merely because they may help a particular project. Optional skills compose through the selected Agent Pack and cannot override Operations or PI semantics.
```

**Expected result**

The existing first-party pack satisfies Operations without another pack or a capability per operational domain.

**Verify before continuing**

Repeat Step 1's positive activation with the updated standard pack. A pack lacking `operations-analysis` must fail without changing the valid environment. Verify existing core and enabled-Extension capabilities still resolve; no silent pack switch or mandatory external skill is introduced.

## Stage 2 — Implement operational exposure semantics

### Step 3 — Implement complete Deployment records and safe `record-deployment`

**References:** Spec 06 §§5, 18, 21–22; Spec 01 Evidence ownership.

**Run**

```text
Implement the minimum Deployment fields:
- id;
- type: deployment;
- title;
- created;
- environment;
- delivery_evidence;
- artifact.revision, artifact.locator and artifact.hash;
- deployed_at;
- deployed_by: human or automation identity.

Implement:
pactwright operations record-deployment <evidence-id>

Require valid Delivery Evidence, a configured environment, exact deployed artefact identity and trusted provenance that the software actually became active. Write Evidence --deployed-as--> Deployment through the runtime.

A merge, completed Delivery or proposed deployment is not proof of exposure.
A genuine redeployment or rollback creates a distinct immutable Deployment event.
A retry of the same event is idempotent.
Correction of canonical Deployment information creates a new record with explicit Deployment --supersedes--> Deployment; it is not an invented redeployment event.

Validate the complete proposed mutation before writing. Invalid input or recording failure leaves Evidence and existing Deployment history unchanged and creates no partial Deployment/edge.
```

Do not invent a universal event-ID algorithm. The supported trusted-event mechanism must distinguish retries from distinct events, or report ambiguity without silently choosing either interpretation.

**Expected result**

Delivery success, actual software exposure and correction of recorded exposure information remain distinct facts.

**Verify before continuing**

Test every required field, invalid Evidence, unknown environment, mismatched artefact identity, absent actual-deployment provenance, same-event retry, lost acknowledgement, distinct redeployment and rollback. Test immutable historical records, explicit correction, invalid/self/cyclic supersession and forced write failure. Compare before/after Evidence and graph hashes; failed recording leaves no partial state.

### Step 4 — Implement registered operational exposure discovery

**References:** Specs 02 Extension manifests and 06 §§4, 15, 22.

**Run**

```text
Resolve native Deployment plus compatible canonical exposure types declared by enabled Extensions through one generic registration contract.

A contributed exposure must:
- be a registered canonical type owned by its contributing Extension;
- provide enough stable identity/hash information to reference the exact exposure;
- resolve through its owner's normal graph representation;
- become unavailable for new exposure resolution when its owning registration is disabled.

Operations must not copy, mutate or reinterpret sibling-owned records to keep an unavailable exposure usable.
Prove the mechanism with a fixture Extension type; do not special-case Publication or implement Checkpoint 7 early.
```

**Expected result**

A compatible future exposure participates without new Operations graph semantics or engine branches.

**Verify before continuing**

Test native and fixture-contributed exposure success, wrong/missing ID or hash, non-canonical targets, unregistered types and disabled registrations. Preserve existing sibling and Observation records during disablement and report unavailable references rather than rewriting them. Confirm native Deployment remains usable independently and fixture exposure bytes/records are never copied into Operations.

## Stage 3 — Implement bounded evidence collection

### Step 5 — Implement source/environment configuration and bounded adapters

**References:** Spec 06 §§6–8, 21; Spec 07 permissions.

**Run**

```text
Implement .pactwright/operations/sources/ and .pactwright/operations/environments/ plus the source adapter contract.

Provider-specific settings belong in adapter configuration. Credentials remain in the configured secret store, never canonical Operations records, committed snapshots or generated public projections.

Each supported adapter documents and enforces its query window, collection/input limits and bounded retry policy. Limits are implementation/adapter policy, not a universal Pactwright numerical budget.
Deterministic configuration/validation failures stop immediately.

Adding a data source requires adapter implementation, source schema and conformance tests, not new Project Graph semantics. Adapters collect evidence; they do not accept PI Knowledge or choose Delivery priority.
```

**Expected result**

Operational integrations collect measurable bounded inputs without a new observability platform or unbounded analysis context.

**Verify before continuing**

Run conformance tests for one initial adapter and a second fixture adapter. Assert query-window enforcement, collection/analysis-input limits, pagination/truncation behaviour and its disclosed limitations, retry bounds, immediate deterministic failure and credential handling. High-volume fixtures must not be read without bounds merely because raw events are excluded from the graph.

### Step 6 — Implement collection provenance and safe `ingest` evidence hand-off

**References:** Spec 06 §§8–9, 18, 20–21.

**Run**

```text
Implement:
pactwright operations ingest [<source-id>]

Every collection attempt records immutable execution provenance outside normal Project Graph traversal:
- execution identity and creation time;
- operation and source;
- runtime-supplied Project Graph revision;
- evidence/query window;
- relevant exposure identities;
- external evidence locators;
- resulting/matched Observation references where applicable;
- succeeded or failed status and failure information.

Ingest collects evidence and records execution provenance; it does not create Observations.
Raw logs, traces, metric samples, analytics events and support payloads remain external to canonical Project Graph state.
Failed collection creates no canonical mutation.

Identify the bounded input passed to observe sufficiently to trace its originating collection, window, exposures and evidence. Use the supported implementation's short-term hand-off, not an unrecorded replacement query against mutable current data.
```

The universal persistence/lifetime and long-term retention policy remain open. Missing, expired or unverifiable required evidence must be reported honestly; do not treat an unreachable pointer as verified reproducible support. A deliberate new collection is a new attempt with new provenance, not silent substitution for earlier input.

**Expected result**

Collection is bounded, auditable and usable by a separate analysis command without graph pollution or fabricated evidence continuity.

**Verify before continuing**

Test success, empty collection, authentication/availability failure, bounded retries and high-volume input. Verify immutable provenance for each attempt and no canonical mutation from collection failures. Pass an identified bounded input to an isolated analysis fixture; expire or change it and require an explicit limitation/failure when the required input cannot be established. Raw payloads and credentials must not appear in canonical or GitHub state.

## Stage 4 — Implement Observation and PI governance

### Step 7 — Implement the complete Observation schema and governance boundary

**References:** Spec 06 §§10, 12–13; Spec 03 internal Sources and trust.

**Run**

```text
Implement the minimum Observation fields:
- id;
- type: observation;
- title;
- created;
- exposure.id and exposure.hash;
- window.from and window.to;
- finding;
- direction: negative | positive | mixed | neutral;
- significance: advisory | material | critical;
- confidence: low | medium | high;
- evidence entries with source, locator and summary;
- baseline, recorded when comparison requires it and otherwise null where appropriate.

Register Observation --observes--> registered operational exposure.

An Observation is a concise supported operational fact, immutable for its evidence window, not automatically accepted PI Knowledge.
Preserve uncertainty. Temporal correlation alone cannot establish causality.
Significance must not determine PI consequence class, Knowledge status, roadmap priority or automatic Intent creation.
Confidence and Operations origin must not automatically determine PI trust.
```

**Expected result**

Positive and negative outcomes share one supported factual model without giving Operations authority over project meaning.

**Verify before continuing**

Test all required fields and enum values, invalid/reversed windows, missing evidence, invalid exposure hash, positive/negative/mixed/neutral outcomes, baseline-dependent comparisons and unsupported causality. Prove `critical` is not automatically PI class 3, `advisory` can still have substantial governed consequences, and high-confidence Operations output is not automatically T0. PI judgement must use claim-relative evidence and current project state.

### Step 8 — Implement bounded deduplication and explicit supersession

**References:** Spec 06 §§9, 11, 21–22.

**Run**

```text
Implement the required outcomes:

new durable finding
→ create Observation

same meaning + additional evidence
→ retain/match existing Observation

materially changed meaning or later resolution
→ create new Observation
→ supersede earlier Observation where appropriate

Observation records remain immutable for their original evidence window.
Additional evidence and matched-record references belong in new execution provenance rather than an in-place rewrite of the matched Observation.
Supersession uses valid Observation endpoints and is explicit and acyclic.

Use deterministic duplicate checks where identity is established safely. Where semantic equivalence needs operations-analysis, keep that judgement explicit and evaluated.
Do not canonise a universal semantic deduplication key.
```

**Expected result**

Repeated monitoring preserves evidence lineage without uncontrolled duplicate records or rewritten history.

**Verify before continuing**

Test exact retries, same-meaning/new-evidence matches, distinct exposures/windows, materially changed conditions and later resolution. Verify created/matched identities and additional evidence in new provenance, unchanged old records, valid supersession and rejected self/cyclic/cross-type edges. Report uncertain equivalence rather than silently merging distinct facts.

### Step 9 — Implement `observe`, immutable analysis provenance and PI hand-off

**References:** Specs 03 §§5–7, 06 §§9, 13, 18, 21 and 07 concurrency/failure boundaries.

**Run**

```text
Implement:
pactwright operations observe [<source-id>]

Use operations-analysis only for interpretation of the identified bounded input. Runtime owns exposure resolution, validation and authorised atomic Observation/edge mutation.

Every analysis attempt uses the execution-provenance contract from Step 6, including operation/source, graph revision, window, exposures, evidence locators, created/matched Observation identities, creation time and status/failure.

Failed analysis produces failed provenance and no canonical Observation, partial observes/supersedes edge or Source hand-off from failed output.
Successful insufficient/unimportant evidence produces successful provenance and no Observation.
A matched Observation remains unchanged and is identified in the new execution.

Hand every canonical Observation to PI through the existing internal Source boundary. Preserve or recover:
- originating Operations Extension/process;
- Observation id/hash;
- observed exposure id/hash;
- supporting evidence locators;
- originating Operations execution;
- originating Project Graph revision.

Use canonical-record provenance, unlike Graph Review Finding execution-output provenance. An immutable execution reference may supply recoverable fields without duplicating them.
```

A failed hand-off preserves the valid Observation and successful analysis. Record retryable hand-off failure and retry from the existing identity/hash without recollection or reanalysis. Lost acknowledgement after successful Source creation must converge on the same Source. Record retries without rewriting immutable Observation or analysis provenance.

Validate automated canonical changes against current graph state using the existing repository mutation path. Concurrent hand-offs must not discard accepted changes through last-writer-wins behaviour. Keep the general concurrency implementation gap explicit; do not introduce a second mutation system.

**Expected result**

Collection failure, analysis failure, successful no-finding, matched finding, new Observation and failed downstream hand-off remain distinguishable.

**Verify before continuing**

Exercise each outcome through direct `observe`, not only `refresh`. Inject analysis and Observation-write failures; require failed provenance, unchanged canonical state and no partial edges. For created/matched Observations verify the provenance contract and Source identity. Test failed hand-off, lost acknowledgement and concurrent retry; Source ingestion must converge without duplicate Sources or rerunning analysis, and existing canonical changes must survive.

## Stage 5 — Implement derived corrective work and validation

### Step 10 — Implement `refresh` through existing collection and analysis operations

**References:** Spec 06 §§18, 21; Spec 07 §24.

**Run**

```text
Implement:
pactwright operations refresh

Compose configured ingest + observe for eligible sources through the same operations and provenance rules.
Every actual collection and analysis attempt retains its own immutable provenance.
Do not analyse missing input as though failed collection succeeded.

One unavailable source does not invalidate historical Operations truth or discard valid outcomes from independent successful attempts.
A failed attempt creates no canonical mutation from that attempt; this does not roll back earlier successful attempts.
Preserve pending PI hand-offs for retry without repeating completed collection/analysis.
```

**Expected result**

The configured feedback loop has bounded retries and explicit per-attempt results, including successful no-Observation outcomes.

**Verify before continuing**

Test all-success, no-finding, partial-source failure, complete-source failure, analysis failure and hand-off failure. Compare direct commands with composed execution for semantic equivalence. Verify canonical history and successful independent results survive failures; no failed attempt creates partial state or false success.

### Step 11 — Implement current PI-derived corrective roadmap and report-failure isolation

**References:** Specs 03 roadmap ownership, 06 §§14, 21 and 07 §§26–27, 31.

**Run**

```text
Implement:
pactwright operations corrective-roadmap

Generate docs/operations/reports/corrective-intent-roadmap.md from the applicable current PI candidate derivation, filtered by accepted motivation traceable to Operations provenance.

Preserve PI candidate identities, provenance, states/readiness, dependencies and relative ordering. Keep dependencies outside the filtered set visible as references where needed to explain blocking.
Do not create a new candidate set, ranking, canonical Intent or independent wave calculation.
A raw Observation, unpromoted Source or significance label alone cannot introduce a corrective candidate.

Stamp the runtime-supplied Project Graph revision for the input actually used. Never stamp a new revision onto stale PI candidate contents.
Repeated generation from identical inputs must be deterministic.
Report-generation failure leaves canonical graph and immutable execution provenance unchanged.
```

Ordinary regeneration uses current state. An explicitly pinned historical input, where supported internally, must remain identified as such; do not silently substitute current state or invent pinned-roadmap CLI syntax. Reports do not require a full execution replay tuple merely because they carry a graph revision.

**Expected result**

Operations exposes a current, traceable filtered PI view without becoming a second roadmap engine.

**Verify before continuing**

Mix operational/non-operational candidates and raw/unpromoted evidence; compare the filtered view with the current PI model field by field, including cross-filter dependencies. Change PI candidates and reject a stale view even when its graph-revision stamp has been copied forward. Test deterministic regeneration, current versus explicitly pinned input where supported, report edits, and injected render/write failure. Canonical records, execution history and PI truth must remain unchanged; retry only report generation.

### Step 12 — Implement all 17 Operations validation rules

**References:** Spec 06 §22; Specs 01 and 07 graph revision boundaries.

**Run**

Implement `pactwright operations validate` with the complete canonical minimum matrix:

```text
1. every Deployment references valid Delivery Evidence;
2. every Deployment identifies a valid deployed artefact and configured environment;
3. every deployed-as edge has valid Evidence → Deployment endpoints;
4. every Observation references a valid registered operational exposure;
5. every Observation defines a valid evidence window;
6. every Observation contains supporting evidence references;
7. every Observation uses valid direction, significance and confidence enum values;
8. every observes edge points from Observation to a registered operational exposure type;
9. Observation and Deployment supersession relationships are valid and acyclic;
10. canonical Operations records contain no credentials or raw high-volume telemetry;
11. every collection and analysis attempt has execution provenance with status and Project Graph revision;
12. failed collection or analysis did not mutate canonical Operations state;
13. every canonical Observation has either a valid PI Source hand-off or a recorded retryable hand-off failure;
14. Extension-contributed exposures remain owned by their source Extension;
15. the corrective-intent roadmap identifies its source Project Graph revision;
16. corrective-roadmap entries are derived PI candidates rather than canonical Intents;
17. Operations does not directly mutate Delivery, PI, Asset or Publication canonical state.
```

Core `pactwright validate` delegates when Operations is enabled. Validation is read-only and includes complete schema, source/environment and execution-provenance checks. A temporary external source outage is an execution/availability problem, not proof that existing valid canonical records became invalid; separately report unverifiable external support without claiming successful verification.

**Expected result**

The complete Operations contract is machine-enforced before real adoption without confusing canonical validity, external execution failure and stale derived views.

**Verify before continuing**

Maintain positive fixtures and a failing fixture mapped to every numbered rule or tightly coupled group. Run both validators; deliberate invalidity must fail without mutation. Test source outage independently from malformed canonical state.

Verify registered Deployment/Observation/edge mutations change `project_graph_revision`, while execution-provenance and report-only changes do not. Use runtime revision services rather than a second Operations hash scheme.

### Step 13 — Add bounded Operations context and Graph Review conformance

**References:** Specs 01 context, 03 knowledge authority, 04 registered review scope and 06 §16.

**Run**

```text
Contribute namespaced relevant Deployments, Observations and corrective provenance through the existing runtime context-assembly API.

Accepted operational Knowledge is governed and selected through PI's existing acceptance/freshness/context rules. Operations may link to it but cannot independently promote an interpretation or bypass PI selection policy.
Distinguish a canonical operational fact from accepted project meaning.
Never preload raw telemetry or complete operational history.
No context contribution changes Contract authority or lifecycle transitions.

Use the existing registered Graph Review scope resolver to inspect actual Deployment/Observation types without hard-coded Operations engine branches or semantic ownership transfer.
Do not add a new public context CLI or alternative operational evidence pipeline.
```

**Expected result**

Delivery and Graph Review can use bounded production history while PI retains project-knowledge authority.

**Verify before continuing**

Exercise Contract crafting, Brief, Delivery and Review contexts with relevant/unrelated records, unpromoted Observations and stale/challenged Knowledge. Inspect selected and excluded inputs under PI policy. Verify no raw telemetry, new accepted meaning or Contract mutation appears. Run a bounded Graph Review over Operations records and confirm its outputs remain Findings routed through PI, never direct Deployment/Observation changes.

## Stage 6 — Evaluation and GitHub automation

### Step 14 — Add Operations responsibility and deterministic evaluation

**References:** Specs 02 evaluation, 06 §23 and 07 §39.

**Run**

```text
Add operations-analysis plus deterministic Operations cases to pactwright eval covering:
- signal-to-Observation compression;
- correct exposure attribution;
- factual grounding;
- baseline interpretation;
- false-positive avoidance;
- unsupported-causality avoidance;
- duplicate finding handling;
- positive finding recognition;
- correct PI routing;
- scope discipline;
- no Observation when evidence is insufficient;
- no canonical mutation after failed collection or analysis.

Add coverage for significance/confidence neutrality, provenance completeness, retryable idempotent hand-off and current PI-filtered roadmap behaviour.
Use deterministic assertions for schemas, evidence references, edge direction, forbidden mutations and absence of raw telemetry.

Keep semantic dimensions individually visible, cases versioned with their owner and domain-technique benchmarks with the owning Production Skills family. No opaque aggregate score or new benchmark platform is needed.
```

**Expected result**

Both AI interpretation and runtime boundary failures are measurable through the existing evaluation runner.

**Verify before continuing**

Run `pnpm pactwright eval`, inspect Operations cases individually and inject known factual-grounding, false-positive and failed-analysis mutation regressions. Require each responsible case to fail. Add Step 15's Operations-specific integration cases to the existing GitHub evaluation rather than relying only on workflow inspection.

### Step 15 — Implement the complete Operations GitHub contribution

**References:** Spec 07 §§3–7, 23–39; Checkpoint 2 composition and activation prerequisites.

**Run**

```text
Contribute Operations through the existing generic GitHub profile-composition/reconciliation engine.
Generate .github/workflows/pactwright-operations.yml only when Operations and GitHub integration are enabled.
Keep configured schedules in that workflow, not one workflow per command.

Route supported responsibilities:
- trusted deployment events / configured deployment workflow completion / authorised manual dispatch → runtime record-deployment;
- source/environment changes → operations validate;
- configured schedules → operations refresh;
- Deployment/Observation/provenance changes → owning validation;
- canonical Observations → normal PI internal Source hand-off;
- relevant accepted Operations-originated PI changes → corrective-roadmap regeneration;
- checks and configured projection updates → runtime-derived state.

Relevant paths:
.pactwright/operations/sources/**
.pactwright/operations/environments/**
.pactwright/executions/operations/**
docs/operations/deployments/**
docs/operations/observations/**
docs/operations/reports/corrective-intent-roadmap.md

Shared graph edges route by registered type/endpoints/semantic owner, not path alone.

Exact checks:
Pactwright / Operations
→ Deployment/Observation, exposure, evidence, configuration, relationships and execution provenance

Pactwright / Operations Views
→ report matches both current applicable PI candidate derivation and current runtime graph revision

External authentication/availability/analysis failure, successful no-Observation, invalid canonical state and stale derived state remain distinguishable. Do not invent a universal check-conclusion mapping.
```

Support the configured Spec 07 shared Project views `Operations`, `Deployments`, `Production Findings` and `Corrective Roadmap`. Deployment fields may include environment, Evidence, artefact revision, deployed time/by, active Observation count and current/superseded state. Observation projections may include exposure/type, direction, significance, confidence, evidence window, current derived state, resulting Source and resulting Knowledge/promotion PR. Derived fields do not become mutable canonical status fields.

Configured Delivery PR context links prior Deployments, relevant Observations, accepted operational Knowledge and corrective provenance without raw telemetry. Intent Issue contributions may expose corrective origin, motivating Observation, affected exposure, significance and current condition. Project-backed views remain optional; checks and PR summaries can work with Projects disabled.

`github sync` owns remote schema; Actions update items/derived values. Use the same locked runtime, Extensions, Agent Pack and available Production Skills as local execution and the runtime-supplied environment identity. No CI-specific agents, revision scheme or semantic YAML duplication.

Enforce least privilege, frozen installation, SHA-pinned actions, bounded timeout/concurrency and safe triggers. Operational credentials stay in secret stores; untrusted PR content must not receive them, privileged external access or write-capable tokens. GitHub metadata alone cannot create Deployment/Observation truth, accept Knowledge or advance Delivery authority.

Hand-off/report retries must invoke their owning runtime operation without rerunning successful analysis or overwriting accepted concurrent changes. Preserve immutable provenance. Only operations that actually promise pinned replay use the shared replay contract; failure must not substitute the workflow's current checkout/environment.

**Expected result**

Operations executes and projects through the existing shared integration, with canonical state and authority still owned by Pactwright.

**Verify before continuing**

Use generated-workflow, runtime integration and remote test fixtures to prove:
- Core + PI + Graph Review + Assets / Publication + Operations uses the same shared Project, with compatible profile merging and conflict rejection;
- each supported trusted deployment route invokes the runtime with actual exposure provenance; a merge alone and an untrusted event create no Deployment;
- source/environment, canonical record, execution and shared-edge changes route correctly, while irrelevant paths do not trigger unrelated work;
- configured refresh and accepted-PI-change routes use the same semantics as local commands;
- both exact checks distinguish invalid records, stale candidates/revision, external failures and successful no-finding results;
- local and Actions-resolved environment identities agree for the same lock, including any selected external skills/packs;
- configured PR/Issue/Project projections reproduce runtime state and never expose raw payloads or credentials;
- remote failed collection/analysis produces no canonical mutation from that failed attempt;
- failed or unacknowledged PI hand-off retries the existing Observation without reanalysis or duplicate Sources;
- report/projection failure leaves canonical and immutable execution state unchanged;
- untrusted PRs cannot access operational systems, secrets or privileged tokens;
- missing producing workflow prevents required-check activation and reports incomplete setup;
- after authorised workflow landing, normal dry-run/apply/second dry-run converges.

Also test minimal Core + PI + Operations and Projects-disabled configurations. Removing Operations removes only exclusively owned generated/remote contributions, preserves Deployment/Observation/execution history and other profiles, and leaves unrelated user resources unchanged. Reject PI-only removal while any enabled dependent still requires it. Add these cases to GitHub Integration evaluation.

## Stage 7 — Adopt Operations in Pactwright

### Step 16 — Enable Operations from the workspace and activate its GitHub surface

**References:** Specs 02, 06, 07; Checkpoint 2 workflow-before-required-checks procedure.

**Run**

Preserve the existing explicit Agent Pack selection and use its updated workspace build supplying `operations-analysis`.

```bash
pnpm build
pnpm pactwright extension add operations
pnpm pactwright sync
pnpm pactwright operations validate
pnpm pactwright validate
pnpm pactwright github sync --dry-run
```

Verify generated changes, then land the new workflow through normal reviewed repository authority before requiring its checks. Use the shared prerequisite mechanism rather than bypassing existing policy. Once the workflow is available:

```bash
pnpm pactwright github sync
pnpm pactwright github sync --dry-run
pnpm pactwright doctor
pnpm pactwright validate
```

**Expected result**

Pactwright runs the workspace Operations Extension before release with explicit capability resolution and safe remote activation.

**Verify before continuing**

Verify PI dependency, complete capability set and exact workspace resolution. Require the same shared Project, working configured checks/projections, preserved other profiles, and clean second local sync/remote dry-run. Do not report convergence while a workflow prerequisite remains unmet.

### Step 17 — Record a real Pactwright software Deployment

**References:** Specs 01 Evidence, 06 Deployment and current Pactwright deployment architecture.

**Run**

Select existing successful Delivery Evidence for a real software/website output. Record the governing lineage and exact artefact/environment. Execute the real deployment mechanism first, or resolve trusted provenance for the deployment that actually occurred, then:

```bash
pnpm pactwright operations record-deployment <evidence-id>
pnpm pactwright operations validate
pnpm pactwright validate
```

**Expected result**

The actual production exposure is recorded independently of successful Delivery Evidence.

**Verify before continuing**

Trace Evidence → Deployment to exact artefact, configured environment, actor, time and trusted event. Confirm same-event retry creates no duplicate and Evidence bytes/meaning remain unchanged. No PR merge or proposed deployment stands in for actual exposure.

### Step 18 — Run real evidence collection and prove governed corrective consequences

**References:** Specs 03 Source/promotion/roadmap, 06 §§9–14, 18 and current Pactwright operational source.

**Run**

Configure one real bounded source for the deployed surface and record its window/limits. Run:

```bash
pnpm pactwright operations ingest <source-id>
pnpm pactwright operations observe <source-id>
pnpm pactwright operations validate
```

Inspect collection and analysis provenance separately. For every resulting Observation Source, triage normally; promote only when justified and approved. Then regenerate PI and Operations candidate views:

```bash
pnpm pactwright intelligence triage <internal-source-id>
```

Where reviewed promotion is required and authorised:

```bash
pnpm pactwright intelligence promote <internal-source-id>
```

```bash
pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright operations corrective-roadmap
pnpm pactwright intelligence validate
pnpm pactwright operations validate
pnpm pactwright validate
```

Skip Source-specific commands when no Source exists; retain the successful live no-Observation result honestly.

Separately require one supported positive trace through Observation → Source → reviewed promotion where required → accepted Knowledge → PI candidate → matching corrective-roadmap entry. Use live evidence where justified; otherwise use a clearly labelled controlled fixture in an isolated project through the same public/runtime paths. Do not promote synthetic evidence into Pactwright's real project truth or claim a fixture is production evidence.

Where an accepted live candidate justifies action, explicitly capture an Intent and complete normal Contract → Brief → Delivery → Review → Evidence. Do not invent a live defect, automatic Intent or mandatory corrective change to pass the positive-path proof.

**Expected result**

Real deployment feedback is exercised and the positive PI-governed consequence path is proven separately from legitimate live no-finding outcomes.

**Verify before continuing**

Retain a live exposure/source/execution trace and a positive consequence trace labelled live or fixture. Verify candidate identity/readiness/ordering exactly matches PI, no raw telemetry becomes graph state, and no Observation directly creates an Intent. Any real corrective Delivery retains complete authority/Evidence lineage; a fixture must not be counted as real corrective work.

## Stage 8 — Publish Operations learning material

### Step 19 — Deliver governed Operations docs, example, Academy and website material

**References:** Specs 03 coverage, 08 §§14, 18–20, 24 and 06 Operations boundaries.

**Run**

Reuse the existing PI public-content readiness gate. Run onboarding and identify applicable domains for the planned work:

```bash
pnpm pactwright intelligence onboard
pnpm pactwright intelligence validate
```

Require each applicable Spec 08 domain to be `Covered`: identity for identity/voice/values; content for educational/editorial work; product for capability claims; go-to-market for positioning/acquisition; delivery/ux for workflow claims; delivery/eng for technical claims; and any other factual subject relied upon. Do not require unrelated coverage.

Each relied-on claim/constraint must be accepted, in-horizon Knowledge with traceable Sources. Retain the Knowledge actually used. Missing applicable coverage blocks public approval; challenge/supersession/retraction before approval requires re-grounding and re-evaluation.

Through normal Delivery, publish/update:

```text
Operations concept/guide
one executable production-feedback example
Academy Operations/production-learning lesson
website capability update and relevant discovery links
```

Document only proven behaviour, distinguish live evidence from fixtures, and explain Evidence versus Deployment, raw telemetry versus Observation, successful no-finding and Observation → PI governance. Where a durable output warrants Asset/Publication identity, use the existing post-Delivery mechanisms; this does not pull Publication feedback forward from Checkpoint 7.

**Expected result**

Users can reproduce the shipped Operations behaviour from governed learning material and discover it on the website.

**Verify before continuing**

Execute the example in a clean supported environment and in CI where practical; separately verify the actual website update and applicable readiness/claim provenance. Run Graph Review over the resulting public material, triage every Finding through PI and correct blocking issues. Prose review does not replace executing the example.

## Stage 9 — Release `0.0.6`

### Step 20 — Publish the compatible family after exact-upgrade fixture acceptance

**References:** Implementation Guide npm release model; Spec 02 upgrades; Checkpoint 2 exact-version upgrade acceptance.

**Run**

Before publication, test the `0.0.5 → 0.0.6` transition in isolated consumers using built/packed target packages through the normal owning upgrade/install mechanisms. Prove compatibility after every operation, including upgrading PI while Graph Review remains enabled and retaining selected Production Skills/packs. A resolver fixture with a newer available version must still honour exact `0.0.6` desired targets.

Prepare the normal release PR from accepted source/Evidence. Publish the compatible family under the Implementation Guide release/tag/trusted-publisher flow. Bootstrap only the new package's first publication/trusted publisher:

```text
@pactwright/operations@0.0.6
```

Existing first-party packages also release as compatible `0.0.6`, including `@pactwright/standard` with `operations-analysis`. External Production Skills remain independently versioned and are not republished as Pactwright packages.

**Expected result**

The exact compatible family is published under `next` with the required provenance, and the consumer transition has a proven safe sequence.

**Verify before continuing**

```bash
pnpm view pactwright@0.0.6 version
pnpm view @pactwright/standard@0.0.6 version
pnpm view @pactwright/project-intelligence@0.0.6 version
pnpm view @pactwright/graph-review@0.0.6 version
pnpm view @pactwright/assets-publication@0.0.6 version
pnpm view @pactwright/operations@0.0.6 version
```

All return `0.0.6`. Verify release workflow/provenance and the exact-target/intermediate-compatibility fixtures. A package lookup alone does not prove safe upgrade behaviour.

## Stage 10 — Prove Operations on Kakeido

### Step 21 — Upgrade from accepted `0.0.5` and install exact Operations `0.0.6`

**References:** Spec 02 upgrade ownership; Checkpoint 2 exact-version upgrade acceptance; current Kakeido configuration.

**Run**

Start from the real accepted Checkpoint 5 Kakeido environment. Record installed packages, configuration, both locks and selected external dependency identities. Do not preinstall `0.0.6` packages or silently replace the selected Agent Pack. Use Step 20's proven compatible sequence and the shared exact-version procedure.

Upgrade the runtime first:

```bash
pnpm pactwright upgrade --to 0.0.6
pnpm pactwright validate
```

Verify new-runtime re-entry, required migrations and compatibility with still-installed components. Immediately before each following component upgrade, set only that component's desired version constraint to exact `0.0.6` through existing supported configuration, preserving its source/identity. Do not edit either lock or run these as an untargeted bulk upgrade:

```text
set selected Agent Pack desired version to 0.0.6
→ pnpm pactwright agent-pack upgrade
→ verify package/lock agreement and complete environment

set project-intelligence desired version to 0.0.6
→ pnpm pactwright extension upgrade project-intelligence
→ verify all enabled dependants remain compatible

set graph-review desired version to 0.0.6
→ pnpm pactwright extension upgrade graph-review
→ verify package/lock agreement and complete environment

set assets-publication desired version to 0.0.6
→ pnpm pactwright extension upgrade assets-publication
→ verify package/lock agreement and complete environment
```

Use the implementation's existing configuration fields for those version changes; do not invent component `--to` flags, substitute `agent-pack use`, or accept a newer compatible version. Recover a failed operation before continuing.

Install the new Extension through its owning path:

```bash
pnpm pactwright extension add @pactwright/operations@0.0.6
pnpm pactwright sync
pnpm pactwright operations validate
pnpm pactwright doctor
pnpm pactwright validate
pnpm pactwright github sync --dry-run
```

Land the generated Operations workflow through normal repository authority before enabling its required checks. Then:

```bash
pnpm pactwright github sync
pnpm pactwright github sync --dry-run
pnpm pactwright validate
```

**Expected result**

Kakeido moves from the real published `0.0.5` environment to exact `0.0.6` through ownership-specific operations and safe workflow activation.

**Verify before continuing**

Verify all six first-party package versions are `0.0.6` in installed state and both locks, selected identities are unchanged, PI remains the Operations dependency, and the selected pack supplies the complete capability set. Verify external skill/pack resolution follows the selected pack's declared constraints without silent unrelated changes.

Record compatibility after each operation and new-runtime migration/sync/validation provenance. Preserve existing Delivery, PI, Asset/Publication and Graph Review history. Confirm one shared Project, functioning Operations checks/projections, unchanged user-owned state and clean second local sync/remote dry-run. Do not pass by preinstallation, partial migration or a later resolved version.

### Step 22 — Record and observe a real Kakeido exposure and verify consequences

**References:** Current Kakeido canonical engineering/product/deployment specifications; Specs 01, 03 and 06.

**Run**

Resolve and record the current governing Kakeido specification paths/versions. Through existing mechanisms:

```text
complete one real governed Delivery
→ actually deploy its verified output
→ pactwright operations record-deployment <evidence-id>
→ configure one bounded operational source
→ pactwright operations ingest <source-id>
→ pactwright operations observe <source-id>
```

Triage every resulting Observation Source through PI, use reviewed promotion only where justified/approved, and regenerate both PI and Operations roadmap views using the commands from Step 18. Preserve genuine live no-Observation results.

Repeat positive consequence-path acceptance with Kakeido-relevant evidence. Use an explicitly isolated, labelled Kakeido fixture when live evidence does not justify a positive path; do not inject synthetic observations into the real project. Explicitly deliver a live corrective candidate only when its governed consequence justifies that work.

**Expected result**

A materially different project proves real software exposure feedback and the same PI-authorised consequence boundaries without Pactwright-specific assumptions.

**Verify before continuing**

Run current Kakeido repository-defined tests plus core, PI and Operations validation. Trace actual exposure, bounded evidence and separate collection/analysis results; trace the positive consequence scenario separately with its live/fixture status. Confirm credentials/raw telemetry remain external, PI still controls candidates and any real corrective Delivery has explicit Intent-through-Evidence authority.

## Stage 11 — Capture checkpoint feedback

### Step 23 — Govern findings and resolve every blocking failure

**References:** Implementation Principles feedback/evaluation ownership; Implementation Guide transition rule; Specs 03 and 06.

**Run**

Ingest material Pactwright responsibility defects/friction through normal PI governance, including deployment ambiguity, source limits, evidence hand-off/addressability, provenance, Observation quality, retry/concurrency, roadmap, context, upgrade and GitHub failures.

Distinguish project-specific operational choices from repeatable Pactwright failures. Route any domain-technique problem to its owning Production Skills family; do not turn local choices into new Pactwright semantics. Add evaluation candidates where justified and never create Intents automatically.

Correct every blocking failure and rerun its acceptance before closing. Recording a blocker as governed future work is not resolution. Only explicitly non-blocking findings/design gaps may cross the checkpoint under the Implementation Guide conditions; no implemented acceptance path may rely on an invented answer to an open identity/retention gap.

**Expected result**

Checkpoint learning reaches the correct owner while all required Operations outcomes remain verified and blocking defects cannot be deferred through governance wording.

**Verify before continuing**

Trace every blocker to a correction and passing re-verification. Run repository verification and relevant core/PI/Operations validation/evaluation. Record retained non-blocking dispositions and their provenance; require no known blocking failure before Checkpoint 7.

## Exit gate

Checkpoint 6 closes only when:

- Operations installs through generic Extension machinery, requires PI but not Graph Review/Assets/particular Production Skills, and preserves valid state on failed activation;
- real standard-pack capability resolution and PI dependency install/remove constraints are proven;
- Deployment and Observation records implement complete minimum schemas and exact enums;
- actual exposure is distinct from Evidence/merge intent, same-event retry is idempotent, distinct deployments/rollbacks remain distinct, and canonical corrections use valid acyclic supersession;
- registered fixture exposures support positive/negative/disablement cases without copied sibling state;
- adapters enforce documented query/input/retry bounds and deterministic failures stop immediately;
- raw telemetry and credentials never enter canonical Project Graph or public GitHub projections;
- every collection and every analysis attempt retains immutable provenance with graph revision, window, evidence and created/matched identities as applicable;
- observe uses identified bounded evidence, with unavailable support reported honestly and no silent replacement query;
- failed recording/collection/analysis creates no partial canonical state from the failed attempt or mutation of prior Evidence/history;
- successful insufficient evidence legitimately produces no Observation;
- Observation matching preserves history, while changed meaning uses new records and explicit supersession;
- every canonical Observation has a valid PI Source hand-off or recorded retryable failure with complete recoverable provenance;
- lost-acknowledgement/concurrent hand-off retry converges without duplicate Sources, reanalysis or discarded accepted mutations;
- significance/confidence/origin cannot bypass PI trust, consequence, Knowledge or roadmap governance;
- the corrective roadmap preserves current PI candidate identities/readiness/dependencies/ordering and cannot invent candidates from raw evidence;
- report generation is deterministic, validates both current candidate contents and graph revision, and cannot mutate canonical or immutable execution state on failure;
- all 17 Operations validation rules are enforced through Extension and core read-only validation;
- Operations canonical mutations participate in the shared graph revision while provenance/reports remain excluded;
- bounded context preserves PI knowledge authority and Graph Review consumes registered Operations types without an alternative operational evidence pipeline;
- evaluation includes all canonical analysis dimensions, failed/no-finding outcomes and deterministic semantic boundaries;
- the exact Operations workflow/checks, supported triggers, configured views and PR/Issue context compose through the existing shared GitHub integration;
- local/Actions environment identity, least privilege, untrusted-PR isolation, remote failure/hand-off behaviour and safe workflow activation are proven;
- Operations removal preserves canonical history, other profiles and unmanaged user state, while PI cannot be removed under enabled dependants;
- Pactwright and Kakeido exercise real deployment and bounded-source feedback, with positive consequence traces explicitly labelled live or fixture rather than fabricated;
- public Operations work passes applicable Covered-domain readiness, its executable example runs, and the website/Academy/docs milestone reflects shipped behaviour;
- all six exact 0.0.6 first-party packages are registry/provenance verified;
- Kakeido performs the real 0.0.5 → 0.0.6 transition using exact desired constraints and owning commands with compatible intermediate environments and no target preinstallation;
- Publication-specific exposure conformance/feedback remains in Checkpoint 7;
- Deployment/Observation identity, external-evidence retention, ingest→observe lifetime and pinned-roadmap CLI gaps remain explicit without new platform abstractions;
- every blocking failure has a correction and passing re-verification; no known blocking failure enters Checkpoint 7.

---

**Pactwright — Checkpoint 6 — Operations v13**
