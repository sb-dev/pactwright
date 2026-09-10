# Pactwright — Checkpoint 7 — Publication Feedback

**Version:** 11  
**Entry condition:** Checkpoint 6 is accepted.  
**Release:** `0.0.7`  
**Exit capability:** Operations observes canonical Publications through the registered exposure contract, and Pactwright completes a real evidence-supported corrective Delivery, human-approved revised Asset and actual new Publication while preserving every subsystem's ownership and historical records.

## 1. Goal

Prove the cross-Extension loop:

```text
real Publication
→ registered operational exposure
→ bounded external evidence
→ canonical Observation
→ PI Source
→ accepted Knowledge
→ PI candidate
→ explicit Intent
→ normal Contract-driven Delivery
→ canonical Evidence
→ exact human-approved new Asset
→ actual release
→ new Publication
```

Checkpoint 7 is a conformance and integration checkpoint over the mechanisms established by Checkpoints 1–6. Reuse their graph, exposure, validation, evaluation, context, authority, upgrade and GitHub composition paths. Do not introduce a Publication Feedback subsystem or duplicate the owning validators.

The Pactwright milestone requires one real evidence-driven revision of an existing Publication. Isolated fixtures prove integration and failure handling but cannot replace this live milestone. A successful live no-Observation result remains legitimate; it does not prove an Observation-to-PI hand-off or complete the required revision.

The revision must be justified by evidence. Completing and publishing it does not establish that real-world performance has improved; that claim requires later supporting evidence.

## 2. Canonical baseline

Canonical semantics come from:

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

Research logs are rationale only. Kakeido acceptance uses the current canonical specifications from the Kakeido repository, not stale embedded copies.

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

Default execution location is the Pactwright repository root unless a step names Kakeido or an isolated fixture. Label fixture evidence and keep it outside real project truth. Print or resolve every source, execution, Publication, Asset, Observation, Knowledge, candidate and Delivery identifier before a later action consumes it.

For repository/code changes:

```bash
pnpm verify
```

Build before invoking newly implemented repository-local commands:

```bash
pnpm build
```

Land coherent changes through pull requests and required checks. Use the public/runtime paths already established for work Pactwright can represent; do not maintain canonical graph relationships by hand.

Use [Checkpoint 2 — Exact-version upgrade acceptance](./02-remote-delivery.md#exact-version-upgrade-acceptance) for the `0.0.6 → 0.0.7` transition. Prove exact desired targets and compatible intermediate states before release. Do not preinstall target packages, edit either lock, silently switch Agent Packs or invent component upgrade flags.

Use the existing GitHub activation rules. Land the workflow version capable of producing configured checks before enforcing unavailable checks. Report incomplete activation rather than claiming convergence; use normal reconciliation after authorised workflow landing.

### Public readiness

For the revised public output and learning material, reuse Spec 08's existing readiness gate. Run PI onboarding, identify the applicable domains, and require:

```text
identity       → Covered where identity, voice or values matter
content        → Covered for editorial, educational or marketing work
product        → Covered for Pactwright capability, value, behaviour or limitation claims
go-to-market   → Covered for acquisition, positioning, CTA or campaign work
delivery/ux    → Covered for user-facing workflow or UX material
delivery/eng   → Covered for technical implementation claims
other domain   → Covered when factual claims depend on it
```

Do not require unrelated coverage. Every relied-on claim or constraint must be accepted, in-horizon PI Knowledge with traceable Sources. Retain the exact Knowledge used. Missing applicable readiness blocks approval; challenge, supersession or retraction before approval requires re-grounding and re-evaluation. Governed identity, voice and positioning require grounding even when the output is not described as fact-bearing.

Historical approval, Evidence, Assets, Publications and Observations are not silently rewritten when current Knowledge changes.

## 4. Checkpoint scope

Checkpoint 7 implements and proves:

```text
Publication exposure metadata through the existing generic registration contract
exact Publication attribution distinct from Asset content identity
cross-Extension failure isolation and populated-history disable/re-enable behaviour
Publication-focused Operations and GitHub conformance evaluation
configured Publication/Observation/PI projections in the same shared Project
real Pactwright workspace activation of the changed composition
bounded live Publication evidence and governed PI consequences
one real Pactwright corrective Delivery, revised Asset and actual new Publication
governed feedback guide and traceable real case material
exact published 0.0.6 → 0.0.7 upgrade
real Kakeido Publication feedback acceptance with honest outcome reporting
```

Do not add new first-party packages, capabilities, schemas, performance fields on Publications, lifecycle stages, Publication withdrawal or Publication-to-Publication supersession. Do not create a Publication Feedback validator, separate workflow, provider layer, production model, second roadmap or automatic Publication-selection policy.

Automatic selection policy, Publication recording idempotency identity, Asset-supersession CLI ergonomics, Operations Observation equivalence, external evidence durability and pinned-roadmap CLI syntax remain explicit gaps. Use the supported safe mechanisms without pretending those gaps are solved. No new archive, scheduler or rerun command is required.

## Stage 1 — Prove Publication exposure conformance

### Step 1 — Declare Publication as Operations-compatible exposure metadata

**References:** Specs 02 Extension manifests, 05 §§3, 13–19 and 06 §4; Checkpoint 6 registered exposures.

**Run**

```text
Extend the Assets / Publication Extension manifest so its existing canonical publication type advertises compatibility with Checkpoint 6's generic Operations exposure contract.

The contribution must:
- require no Operations dependency and be inert for feedback when Operations is disabled;
- reference the existing canonical Publication representation rather than copy records;
- expose stable identity/hash through the owning runtime registration;
- retain Asset approval, exact asset_hash and actual-release validity under the Assets / Publication owner;
- introduce no Publication-specific branch in the Operations exposure engine.

An Asset, candidate output, Delivery Evidence or pending release is not a Publication exposure.
```

**Expected result**

Assets / Publication advertises a compatible exposure while remaining independently valid without Operations.

**Verify before continuing**

Use a compatible explicitly selected Agent Pack and the existing dependency/manifest fixtures. Validate existing Publications with Operations disabled; verify no Operations state or new capability is required. Enable the registration without rewriting existing Publication records or copying them into Operations. Confirm the owning schemas and typed relationships remain unchanged.

### Step 2 — Prove exact Publication discovery and attribution

**References:** Specs 05 §§13–16 and 06 §§4, 9–12; Checkpoint 6 exposure and Observation conformance.

**Run**

```text
Enable Assets / Publication plus Operations and its PI dependency in isolated fixtures. Resolve publication through the generic registered-exposure mechanism and observe it through normal Operations commands.

Distinguish:
Publication identity/hash → the exact observed release record
Publication.asset_hash   → the approved Asset content released
Asset.content_hash      → the exact approved bytes

The Asset content hash is not a substitute for the Publication exposure identity.
Use the owning runtime's hash/identity resolution rather than a new hash scheme.

Test multiple Publications of the same Asset and a revised Asset released through a reused channel/locator. Shared bytes or a reused locator must not silently collapse distinct releases or retarget earlier Observations.
Where the evidence cannot distinguish releases sufficiently, preserve the limitation rather than fabricate exact attribution.
```

**Expected result**

Observations reference the intended canonical Publication, not an Asset-level or channel-wide approximation presented as exact release evidence.

**Verify before continuing**

Test valid Publication discovery; wrong/missing exposure ID or hash; disabled/unregistered types; unapproved output; and invalid Publication-to-Asset hash/relationship. Owning validators must reject invalid state without Operations repairing it on another owner's behalf.

Create Publications A and B for one approved Asset and prove observations/deduplication retain their distinct exposure identities. Repeat with a revised Asset and a shared public locator using addressable evidence windows. Earlier Asset, Publication and Observation records remain unchanged. Ambiguous analytics must not be accepted as exact attribution or unsupported causality.

### Step 3 — Evaluate Publication feedback and cross-Extension failure isolation

**References:** Specs 02 evaluation, 03 Source/trust governance, 05 §19 and 06 §§9–14, 21–23; Checkpoints 5–6.

**Run**

```text
Reuse the existing Operations and Assets / Publication conformance suites with real Publication record types.

Add publication-focused operations-analysis cases for:
- baseline/channel comparison and factual grounding;
- exact Publication attribution, including repeated releases of one Asset;
- unsupported creative/content causality and false-positive avoidance;
- positive, negative, mixed and neutral findings;
- duplicate/same-meaning evidence handling without changing historical Observations;
- successful no-Observation when evidence is insufficient;
- significance/confidence not determining PI trust, class, Knowledge status or priority;
- no direct Asset, Publication, PI Knowledge or Delivery mutation by Operations.

Add deterministic failure cases for collection, analysis, Observation writes, PI hand-off, report generation and GitHub projection. Keep provenance per collection and analysis attempt, and preserve the owning component's failure semantics.
```

Map each scenario to its existing owner and validator/evaluation case. Do not introduce a new validation subsystem or copy the complete upstream matrices. Domain production quality remains with the selected Production Skills benchmarks; Pactwright tests integration and governance.

**Expected result**

Publication feedback satisfies the same bounded evidence, authority, idempotency and failure-isolation contract as native Operations without rewriting release history.

**Verify before continuing**

Run `pnpm pactwright eval` and the enabled owning validators. Inject collection/analysis failure and require failed provenance with no canonical mutation from the failed attempt; insufficient evidence must instead record success with no Observation. Compare before/after Evidence, Asset, Publication, Observation and shared-edge state.

Fail PI hand-off and simulate lost acknowledgement after Source creation. Retry the existing Observation identity/hash without recollection or reanalysis, converge on the same Source, and preserve concurrent accepted changes. Failed report/projection generation must leave canonical and immutable execution state unchanged. Poor performance must not invalidate a valid Publication. A failed release must leave its approved Asset unchanged and create no valid Publication/exposure.

Require known attribution, false-positive and forbidden-mutation regressions to fail their responsible cases. Reuse these assertions in Step 4's remote fixtures.

## Stage 2 — Compose GitHub integration

### Step 4 — Compose Publication automation, checks and shared projections

**References:** Spec 07 §§3–7, 20–39; Checkpoints 2, 5 and 6.

**Run**

```text
Compose both enabled Extensions through the existing GitHub planner, workflow renderer and reconciliation engine.
Use the existing pactwright-assets-publication.yml and pactwright-operations.yml workflows; do not create a publication-feedback workflow or new required check.

Route supported changes by ownership:
- assets/** and docs/assets-publication/assets/** → Asset validation;
- docs/assets-publication/publications/** → Publication validation and configured exposure-related Operations work;
- Operations source/environment, execution, Observation and corrective-report paths → their existing owning responsibilities;
- shared graph edges → validators selected by registered type/endpoints, including cross-owner relationships.

Preserve the exact checks and their meanings:
Pactwright / Assets
Pactwright / Publication
Pactwright / Operations
Pactwright / Operations Views

Operations Views checks both the current applicable PI candidate derivation and runtime graph revision. A fresh stamp does not make stale candidate contents valid.

Having both Extensions enabled permits composition, not automatic monitoring of every Publication. Collection follows explicitly selected exposures, configured sources/schedules/events and bounded windows. Canonical validation need not be limited to monitored Publications.
```

When configured, extend the existing shared Project's Publications view with linked operational Observations, and Operations views with exact Publication exposure, evidence window, Source/Knowledge and corrective candidate provenance. Relevant Delivery PRs and Intent Issues link corrective origins without copying telemetry or performance fields into canonical Publication records. `github sync` owns schema; Actions own items and derived values. Projects-disabled operation remains supported.

Preserve the existing locked runtime, Extensions, selected Agent Pack and external skills/packs locally and in Actions. GitHub uses runtime-provided graph/environment identities, not an independent hash or CI-only agent. Operational/publication credentials and privileged tokens remain unavailable to untrusted PR content. Supported authority/release events still invoke their owning runtime checks.

**Expected result**

Publication feedback operates through the existing shared integration, with configured cross-Extension projections and no new authority or automatic-selection mechanism.

**Verify before continuing**

Exercise Assets / Publication only, Core + PI + Operations, both Extensions together, the full existing profile set and Projects-disabled fixtures. Only the both-enabled case contributes Publication-feedback routes. Require one shared Project when enabled, deterministic generation, compatible merging/conflict rejection, and preservation of unrelated resources.

Run supported configured scheduled/event routes and compare actual runtime outcomes with local execution. Verify exact local/Actions environment identity, all owning checks, semantic edge routing, stale-view detection, and configured Publication → Observation → Source/Knowledge/candidate links. Mutating a derived field must not change canonical truth.

Repeat Step 3's hand-off/failure assertions remotely, including lost acknowledgement without reanalysis. Confirm no raw payloads or credentials appear in projections and an untrusted event cannot obtain privileged integration access. Unselected Publications must not acquire monitoring sources merely because the Extensions coexist.

Land changed generated workflows through normal authority before depending on their new routes/check behaviour. Use dry-run/apply/second dry-run and require convergence only after prerequisites are satisfied. Add the new scenarios to existing GitHub Integration evaluation.

### Step 5 — Prove populated-history disablement and re-enablement

**References:** Spec 02 removal, Specs 05–06 sibling ownership and Spec 07 managed contributions; Checkpoint 6 exposure-disablement rules.

**Run**

In isolated populated fixtures, prove:

```text
Assets / Publication enabled, Operations disabled
→ valid Assets/Publications remain independent of Operations

Operations enabled, Assets / Publication disabled
→ native Deployment Operations remains usable

both enabled
→ Observations reference existing Publications without copying them

Operations removed after Publication Observations exist
→ Asset/Publication history remains valid
→ Observation/execution history is preserved

Publication owner disabled after Observations exist
→ new Publication exposure resolution is unavailable
→ historical records remain unchanged
→ unavailable references are diagnosed, not copied or retargeted

owner re-enabled
→ original records/identities resolve again
→ no duplicate Publication, Observation or PI Source is created
```

Preserve PI where other enabled Extensions require it. Remove only exclusively owned generated contributions and composed routes no longer needed. Do not delete user-authored canonical history or other profiles to force validation to pass.

**Expected result**

Both disablement directions preserve ownership and history, while runtime availability and diagnostics accurately reflect the enabled registrations.

**Verify before continuing**

Run enabled owning validators and core validation before and after each transition. Explicitly expect unavailable-command/registration or unresolved-reference diagnostics where applicable; do not count an unavailable validator as success or claim every preserved cross-reference remains resolvable while its owner is disabled. Verify native Deployment behaviour separately.

Compare record/byte hashes, generated workflows, shared Project identity and other profile contributions. Re-enable and reconcile through normal mechanisms; original references must resolve without duplicate capture or hand-offs and the second sync/dry-run must converge.

## Stage 3 — Observe a real Pactwright Publication

### Step 6 — Activate the workspace composition and select a real Publication

**References:** Specs 02, 05, 06, 07 and 08 Publication Feedback milestone; Checkpoints 5–6 adoption.

**Run**

Preserve the existing explicit Agent Pack and enabled Extensions. Build the updated workspace packages; resolve the changed manifests through the existing environment/lock/sync path, not manual lock edits or wholesale reinstallation.

```bash
pnpm build
pnpm pactwright sync
pnpm pactwright doctor
pnpm pactwright assets validate
pnpm pactwright operations validate
pnpm pactwright intelligence validate
pnpm pactwright validate
pnpm pactwright github sync --dry-run
```

Verify the active runtime has loaded the new Publication exposure registration. Land changed generated workflow files through normal reviewed authority, then apply and verify:

```bash
pnpm pactwright github sync
pnpm pactwright github sync --dry-run
```

Select an existing real canonical Pactwright Publication from Checkpoint 5 or later governed public work, with an observable surface. Record its Publication ID and runtime-resolved exposure hash, Asset ID/content hash, channel/locator, actual release provenance and governing Evidence. Confirm `Publication.asset_hash` matches its approved Asset; do not substitute that content hash for exposure identity.

Selection is explicit for this proof and creates no automatic policy.

**Expected result**

The real workspace uses the changed registered composition and selects an existing valid release without rewriting or duplicating historical records.

**Verify before continuing**

Inspect resolved manifest/environment identities and the owning exposure registry, require healthy diagnostics, passing validation and converged local/remote integration. Confirm the same shared Project and preserved existing records/other profiles.

Trace the selected Publication to human approval, exact content, Evidence and actual release. Record whether the available source/window can distinguish this release from other Publications of the Asset or surface. Insufficient attribution must remain explicit, not be hidden by selecting an Asset-level hash.

### Step 7 — Collect and analyse bounded live Publication evidence

**References:** Spec 06 §§8–13, 18, 21; Checkpoint 6 collection/analysis provenance and evidence hand-off.

**Run**

Configure a supported source for the explicitly selected Publication using the project's existing analytics/evidence system. Record the query window, collection/input limits, retry policy, evidence locators and attribution/baseline limitations. Credentials stay in the configured secret store and raw payloads remain outside canonical state and GitHub projections.

```bash
pnpm pactwright operations ingest <source-id>
pnpm pactwright operations observe <source-id>
pnpm pactwright operations validate
pnpm pactwright assets validate
pnpm pactwright validate
```

Analyse the bounded input identified by the collection provenance, not a silently replaced query. Preserve separate immutable collection and analysis records, including created/matched Observations and runtime graph revision. Report expired/unverifiable required evidence honestly.

**Expected result**

Live Publication evidence produces either a supported canonical Observation tied to the exact release or an honest successful no-Observation outcome, distinct from execution failure.

**Verify before continuing**

Retain actual source/window/execution provenance and external evidence references. For each created or matched Observation, verify Publication exposure ID/hash, window, baseline where needed and supported non-causal wording where causality is unproven. Confirm previous Asset/Publication/Observation records remain unchanged and additional evidence is retained in new provenance rather than rewriting a matched Observation.

A no-finding outcome does not create an invented Source or satisfy the required real revision. Resolve failures through the existing retry path; do not pass to Source-specific commands without a Source ID.

### Step 8 — Trace accepted PI meaning and the corrective candidate

**References:** Spec 03 Sources/trust/promotion/roadmap; Spec 06 §§13–14; Checkpoint 6 hand-off and current-view acceptance.

**Run**

Every canonical Observation enters PI through normal internal Source ingestion. Resolve the Source ID and verify recoverable Observation ID/hash, Publication exposure, supporting evidence, originating Operations execution/process and graph revision. Retry failed hand-off from the existing Observation; do not recollect or reanalyse merely to obtain a Source.

For each available Source:

```bash
pnpm pactwright intelligence triage <internal-source-id>
```

Only where reviewed promotion is required and authorised:

```bash
pnpm pactwright intelligence promote <internal-source-id>
```

Then regenerate and validate the current views:

```bash
pnpm pactwright intelligence derive-intent-roadmap
pnpm pactwright operations corrective-roadmap
pnpm pactwright intelligence validate
pnpm pactwright operations validate
pnpm pactwright validate
```

No Source-specific command runs for a successful no-Observation outcome. Triage may legitimately conclude duplicate, corroborating or no Delivery consequence. Operations significance/confidence is evidence for PI judgement, not acceptance authority or priority.

**Expected result**

Any corrective candidate is derived from accepted PI Knowledge and supporting Sources, not directly from an Observation or a separate candidate-approval process.

**Verify before continuing**

For a candidate, trace Publication → external evidence/execution → Observation → Source → required reviewed approval → accepted Knowledge → PI candidate. Compare its identity, readiness/state, dependencies and relative ordering with the Operations-filtered view generated at the current graph revision, including dependencies outside that view.

Require no raw/unpromoted evidence to introduce a candidate, no automatic Intent and no Operations-owned priority. Hand-off retries must converge without duplicate Sources. Retain legitimate no-candidate outcomes rather than manufacture project meaning.

## Stage 4 — Close one Pactwright Publication revision loop

### Step 9 — Select a ready evidence-supported correction

**References:** Specs 03 roadmap/authority, 05 corrections, 06 corrective Delivery and 08 §24.

**Run**

Select one ready PI candidate grounded in accepted Knowledge whose motivation traces to a real existing Pactwright Publication and live supporting evidence. Respect PI dependencies and ordering. Resolve missing readiness through normal governance; do not override priority or invent a candidate merely to satisfy this checkpoint.

If the selected evidence does not justify a correction, retain that result and select another explicit real Publication with sufficient evidence, returning through Steps 6–8. No synthetic or fixture evidence may be promoted into real Pactwright truth to manufacture the required revision. If no real evidence-supported revision is available, this live milestone remains unaccepted.

Record why the proposed change is supported and the limits of the evidence. A justified correction does not require claiming that the old content caused a metric change or that the new version will necessarily improve it.

**Expected result**

One real correction is ready for explicit Delivery authorisation with traceable accepted motivation, not an implementation-created priority or fabricated causal conclusion.

**Verify before continuing**

Check the complete live provenance chain, accepted Knowledge and required approval, current candidate readiness/dependencies and the original Publication identity. Require the evidence to justify the bounded change and clearly distinguish the proposed improvement from any unproven performance claim. A fixture cannot pass this step.

### Step 10 — Deliver the correction under current public readiness

**References:** Specs 01 Delivery/Evidence, 02 Agent Pack/Production Skills, 03 grounding and 08 §§18–20.

**Run**

Apply section 3's public readiness gate to the intended correction:

```bash
pnpm pactwright intelligence onboard
pnpm pactwright intelligence validate
```

Explicitly capture the selected candidate as an Intent and complete normal Delivery:

```text
Intent
→ transient Contract alternatives
→ authorised Decision
→ Contract
→ Brief
→ Delivery using relevant Production Skills through the selected Agent Pack
→ closing Delivery Review
→ Evidence
```

Retain accepted Knowledge actually used, including identity, voice, positioning and other governed constraints where applicable. Relevant Production Skills specialise execution/review without weakening the Contract. If relied-on Knowledge changes before approval, re-ground and re-evaluate rather than continue on outdated authority.

**Expected result**

Live Publication evidence influences a verified corrective output only through PI meaning, explicit Contract authority and normal Delivery.

**Verify before continuing**

Run repository-defined verification, relevant owning Production Skills evaluation and `pnpm pactwright validate`. Trace candidate → Knowledge/Sources → Intent/Decision/Contract/Brief → successful closing Review → factual Evidence. Confirm applicable domains are Covered and relied-on claims are accepted/in-horizon/Source-traceable.

Evidence is canonical before and independently of Asset approval. It does not assert the new output has been released or improved operational performance. Preserve the original Evidence, Asset, Publication and Observation history.

### Step 11 — Approve, actually release and record the revised output

**References:** Spec 05 §§7–16, 19, 22–25; Spec 08 revised Publication milestone; Checkpoint 5 approval/release boundaries.

**Run**

Recheck required current grounding/readiness. After a human inspects the exact successful corrective output:

```bash
pnpm pactwright assets approve-asset <evidence-id>
```

Resolve the new Asset ID. Verify exact approved bytes, human identity/time, valid Evidence and applicable Knowledge IDs/hashes. A material revision creates a new Asset; never change the original Asset's content hash or overwrite its approved stored content.

Where this revised output replaces the original Asset, record `new Asset --supersedes--> original Asset` through the authorised graph-mutation mechanism established in Checkpoint 5. Do not hand-edit edges or invent a standalone supersede command. Validate the relationship and preserve both records.

```bash
pnpm pactwright assets validate
pnpm pactwright validate
```

**Execute the project's real channel publication/release procedure for the new approved Asset now.** Verify the actually released output matches the approved content identity and retain the channel response or equivalent actual-release evidence. Reusing a public locator does not change the old Publication's historical identity or retarget old Observations.

Only after successful actual release, record it:

```bash
pnpm pactwright assets record-publication <new-asset-id> <channel>
pnpm pactwright assets validate
pnpm pactwright operations validate
pnpm pactwright intelligence validate
pnpm pactwright validate
```

Record the actual channel/locator, publisher and publication time through the supported runtime input. `record-publication` does not perform the omitted channel release on the project's behalf. On failure or uncertain acknowledgement, use the existing safe retry/ambiguity handling rather than blindly releasing or recording twice. No failed attempt becomes a valid Publication or operational exposure.

**Expected result**

One real evidence-supported correction becomes a separately approved immutable Asset and an actual new Publication, with original release history intact.

**Verify before continuing**

Retain the full live chain:

```text
original Publication
→ bounded live evidence and collection/analysis provenance
→ Observation
→ PI Source
→ accepted Knowledge and required approval
→ ready PI candidate
→ Intent / Decision / Contract / Brief
→ successful Review / canonical Evidence
→ exact human-approved new Asset
→ actual release evidence
→ new Publication
```

Verify new `Publication.asset_hash == Asset.content_hash`, actual release metadata, valid `Evidence --produces--> Asset`, `Publication --publishes--> Asset` and the applicable new-to-old Asset supersession edge. Compare original Evidence/Asset/Publication/Observation hashes and stored approved content before/after; none may be silently rewritten.

Do not add Publication-to-Publication supersession, withdrawal or performance fields. The result proves a justified released revision, not measured performance improvement. Any later improvement claim needs new supported Operations evidence and normal PI governance.

## Stage 5 — Publish Publication Feedback learning material

### Step 12 — Deliver a governed guide and verifiable real case

**References:** Spec 08 §§14–21, 24; Specs 03, 05 and 06; section 3 public readiness.

**Run**

Apply the existing public readiness gate to this material independently of the corrected output's readiness. Through normal Delivery, publish/update the smallest useful set:

```text
Publication Feedback guide
real evidence-driven Pactwright example/case fragment
links from Operations and Assets / Publication docs
```

Use actual Step 11 provenance and accepted PI Knowledge. Explain explicit Publication selection, bounded evidence, legitimate no-finding outcomes, accepted Knowledge before candidates, exact approval and actual release. Distinguish making a justified revision from proving its later performance. Do not imply every Publication is monitored or that selection is automatic.

Keep canonical ownership clear. Use normal Asset/Publication mechanisms where the learning output itself warrants durable approved identity; do not make every documentation edit an Asset. Fixtures used for runnable examples remain labelled and isolated from real case evidence.

**Expected result**

Users can follow the existing Operations → PI → Delivery path and inspect an evidence-backed account of the real revised Publication without new lifecycle concepts.

**Verify before continuing**

Trace every factual case claim to the recorded live chain. Execute any supplied executable example in a clean supported environment and in CI where practical; a narrative case fragment instead requires verified evidence links, not a claim that it is executable. Follow the guide against the actual recorded steps and verify discovery links.

Run Graph Review over the material, triage every Finding through PI and resolve blocking inconsistencies through normal Delivery. Graph Review does not replace example execution or case verification. Assert applicable Covered domains, accepted/in-horizon claim provenance and re-grounding where Knowledge changed before approval.

## Stage 6 — Release and Kakeido proof

### Step 13 — Publish `0.0.7` after exact-upgrade conformance

**References:** Spec 02 upgrades/locking; Implementation Guide release model; Checkpoint 2 exact-version upgrade acceptance.

**Run**

Before publication, prove the `0.0.6 → 0.0.7` consumer transition in isolated fixtures through the normal owning operations using built/packed targets. Include populated Asset, Publication, Deployment, Observation, PI and execution history, selected external skills/packs, and a resolver fixture with a newer available version. Exact desired targets must win over floating latest resolution and every intermediate environment must remain compatible.

No new first-party package is introduced. Prepare the normal release PR from accepted source/Evidence and use the existing release/tag/trusted-publisher flow for the complete compatible family. Do not bootstrap or interactively republish existing packages. External Production Skills remain independently versioned.

**Expected result**

The exact compatible `0.0.7` family is available under the established release channel with provenance and a proven safe consumer-upgrade sequence.

**Verify before continuing**

```bash
pnpm view pactwright@0.0.7 version
pnpm view @pactwright/standard@0.0.7 version
pnpm view @pactwright/project-intelligence@0.0.7 version
pnpm view @pactwright/graph-review@0.0.7 version
pnpm view @pactwright/assets-publication@0.0.7 version
pnpm view @pactwright/operations@0.0.7 version
```

All return `0.0.7`. Verify trusted-release/provenance results and passing exact-target/intermediate-compatibility fixtures. Existing Publications must resolve as exposures without being re-recorded, and unchanged historical records must retain their identities/hashes. Registry lookups alone do not prove this transition.

### Step 14 — Upgrade Kakeido exactly and exercise a real Publication

**References:** Spec 02 upgrades; Specs 03, 05–07 feedback boundaries; current Kakeido owner specs; Checkpoint 2 exact-version upgrade acceptance.

**Run**

Start from the real accepted `0.0.6` environment. Record installed packages, desired configuration, both locks, selected Agent Pack/external dependencies and existing canonical/execution history. Use Step 13's fixture-proven compatible sequence. No target preinstallation, manual lock changes or implicit pack switching is allowed.

Upgrade the runtime and verify the new runtime performed migration/sync/validation:

```bash
pnpm pactwright upgrade --to 0.0.7
pnpm pactwright validate
```

Immediately before each following upgrade, set only that component's desired version constraint to the exact intended checkpoint target through its existing supported configuration fields, preserving its source/identity. Run and verify each operation separately; do not run the list through an invalid intermediate state:

```bash
pnpm pactwright agent-pack upgrade
pnpm pactwright extension upgrade project-intelligence
pnpm pactwright extension upgrade graph-review
pnpm pactwright extension upgrade assets-publication
pnpm pactwright extension upgrade operations
```

Follow the shared exact-version acceptance procedure for package constraints, lock agreement and failure recovery after every operation. No Extension is newly added. Resolve the exact published first-party family and preserve any explicitly selected compatible non-first-party pack without falsely reporting it as `@pactwright/standard` or silently changing identity.

```bash
pnpm pactwright sync
pnpm pactwright doctor
pnpm pactwright assets validate
pnpm pactwright operations validate
pnpm pactwright intelligence validate
pnpm pactwright validate
pnpm pactwright github sync --dry-run
```

Land changed generated workflow files through normal authority before relying on their new routes, then:

```bash
pnpm pactwright github sync
pnpm pactwright github sync --dry-run
```

Select a real existing Kakeido Publication from current canonical work. Resolve its exact exposure identity and approved Asset; do not re-record an existing release merely to enable monitoring. Configure one explicitly selected bounded source and run:

```bash
pnpm pactwright operations ingest <source-id>
pnpm pactwright operations observe <source-id>
pnpm pactwright operations validate
pnpm pactwright assets validate
pnpm pactwright validate
```

For every canonical Observation, verify the Source hand-off and run normal triage; promote only where justified and authorised. Regenerate the PI/Operations candidate views where appropriate using Step 8's existing commands. Current Kakeido specs govern any resulting corrective work.

A successful live no-Observation run is a valid collection/analysis proof, but must not be reported as a live Observation → PI hand-off. Report whether an Observation was created, matched or not warranted, or execution failed. Use the isolated Publication conformance suite for missing positive test coverage; never count synthetic evidence as real Kakeido output. A second live corrective revision in Kakeido is not required.

**Expected result**

Kakeido completes the exact safe published upgrade and exercises Publication feedback on a real surface, with its actual outcome and any governed consequence reported accurately.

**Verify before continuing**

Verify installed runtime and enabled first-party Extension versions are exactly `0.0.7`, the selected pack's explicit target/identity is honoured, and package-manager/Pactwright locks agree after each operation. Preserve earlier record hashes and replay information; activation of exposure metadata must not rewrite or duplicate historical releases.

Require converged local/remote state, the same shared Project, preserved unrelated workflows and passing owning/Kakeido repository checks. Retain actual Publication/source/window/collection/analysis evidence. Every created/matched Observation must retain exact release provenance and a valid Source or a resolved hand-off retry before live hand-off is claimed. A live no-finding result must be labelled as such and is not a substitute for Pactwright's mandatory Step 11 revision.

Use isolated populated fixtures for disablement checks rather than deleting or disabling production history to satisfy a test. Confirm Assets/Publications remain independently valid without Operations and native Deployment Operations remains usable without Publication registration.

## Stage 7 — Capture feedback

### Step 15 — Govern findings and resolve every blocker

**References:** Implementation Principles and Guide transition rule; Specs 03, 05 and 06 ownership/open gaps.

**Run**

Ingest material Pactwright integration failures/friction through PI, including exposure attribution, source bounds, retry/hand-off issues, exact upgrade targeting, live revision provenance, publication release ambiguity, GitHub projections and public-documentation gaps. Route production-domain quality failures to their owning Production Skills repository without turning them into Pactwright semantics. Do not automatically create Intents.

Keep automatic Publication selection, recording idempotency identity, Asset-supersession CLI ergonomics and Operations Observation/evidence durability gaps explicit. A necessary canonical change requires evidence and a deliberate update to its owning specification; this checkpoint cannot silently invent the answer.

Correct every blocking failure and rerun its acceptance. Recording a blocker as future governed work, or assigning it to another repository, is not resolution. Only explicitly non-blocking findings may remain future candidates under the Implementation Guide's transition conditions.

**Expected result**

Learning reaches the correct owner and declared open gaps remain honest without weakening the live milestone or permitting unresolved acceptance failures.

**Verify before continuing**

Trace each blocker to a correction and passing re-verification. Verify retained non-blocking findings have Source/triage provenance and disposition. Require the full real Pactwright revision, exact release/Kakeido acceptance and all mapped integration tests to pass before Checkpoint 8.

## Exit gate

Checkpoint 7 closes only when:

- Publication participates through existing exposure metadata without a sibling dependency, new schema/capability or Operations special-case engine;
- exact Publication exposure identity remains distinct from Asset content identity, including multiple releases and reused locators;
- invalid/unregistered/disabled targets and insufficient attribution are rejected or diagnosed without fabricated support;
- mapped Publication conformance uses existing owning validators/evaluation rather than a new subsystem;
- collection/analysis failure, no-finding, matched/new Observation and failed PI hand-off remain distinct, with immutable provenance and no forbidden canonical mutation;
- lost hand-off acknowledgement converges without duplicate Sources, recollection or reanalysis;
- Operations absence/failure and poor performance do not invalidate a valid historical Publication;
- populated-history disablement/re-enablement preserves records, reports unavailable references and restores original identities without duplication;
- exact checks, semantic routing and configured Publication/Observation/PI projections compose through existing workflows and one shared Project when enabled;
- local/Actions locked environment identity, credential isolation, remote failure behaviour and deterministic reconciliation remain intact;
- evidence collection follows explicit selection/configuration rather than automatically monitoring every Publication;
- Pactwright's real workspace resolves and activates the changed manifests/integration before live use;
- a real Pactwright Publication has bounded live evidence, a canonical Observation, traceable PI Source and accepted Knowledge supporting a ready PI candidate;
- the candidate follows explicit Intent/Decision/Contract/Brief authority, closing Review and canonical Evidence;
- applicable public domains are Covered and relied-on claims/constraints are accepted, in-horizon and Source-traceable for both the correction and learning material;
- one real revised output becomes an exact human-approved new Asset, is actually released, then is recorded as a new Publication with matching hash and actual release provenance;
- original Evidence, approved Asset content, Publications and Observations remain unchanged; corrections use applicable Asset supersession, never Publication-to-Publication supersession or withdrawal;
- fixtures and live no-finding outcomes are not substituted for the required real Pactwright revision, and later performance improvement is not claimed without evidence;
- public guide/case claims are traceable to live provenance and any executable example is run rather than only prose-reviewed;
- all six `0.0.7` first-party package versions and trusted-release provenance are verified;
- Kakeido upgrades from accepted `0.0.6` through exact desired constraints and owning commands with compatible intermediate environments and preserved historical identities;
- one real Kakeido Publication exercises live feedback with accurate created/matched/no-Observation reporting and governed hand-off for every actual Observation;
- no new Publication Feedback validator/workflow/package, independent roadmap, creative lifecycle, provider layer, automatic selection policy or archive/scheduler platform has been introduced;
- declared identity, evidence durability and CLI gaps remain explicit without blocking any claimed acceptance;
- every blocking failure has a correction and passing re-verification; no known blocker enters Checkpoint 8.

---

**Pactwright — Checkpoint 7 — Publication Feedback v11**
