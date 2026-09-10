# Pactwright — Checkpoint 8 — Full Project Operating Surface

**Version:** 11  
**Entry condition:** Checkpoint 7 is accepted and all first-party semantic Extensions exist.  
**Release:** `0.0.8`  
**Exit capability:** Pactwright and Kakeido prove the complete configured operating surface through the existing five workflows and one shared Project, with deterministic generation, ownership-safe reconciliation, exact runtime provenance and no transfer of canonical authority to GitHub.

## 1. Goal

Complete and harden cumulative conformance across:

```text
Delivery
Project Intelligence
Graph Review
Assets / Publication
Operations
```

Reuse the composition, registration, validation, evaluation, authority, context, upgrade and GitHub mechanisms established in Checkpoints 1–7. Correct gaps in their existing owners rather than introducing a second planner, validator, projection engine or lifecycle.

Prove that the combined environment routes real events correctly, projects current runtime truth, preserves failure and security boundaries, reconstructs promised pinned executions exactly, and remains safe when features are disabled and re-enabled.

Use genuine records from the earlier checkpoints for longitudinal acceptance, plus labelled isolated fixtures for controlled failures. The complete operating proof must not manufacture another operational defect, force every Delivery into Asset semantics or repeat the live Publication-revision milestone merely for ceremony.

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

Research logs are rationale only. Kakeido acceptance uses the current canonical specifications in the Kakeido repository, not stale embedded copies.

This runbook defines implementation progression and acceptance, not new Pactwright semantics.

## 3. Execution contract

Every implementation action follows:

```text
Step
→ References
→ Run
→ Expected result
→ Verify before continuing
```

Default execution location is the Pactwright repository root unless a step names Kakeido or an isolated fixture. Print or resolve every dynamic record, execution, Source, candidate, environment and remote-resource identity before a later action consumes it. Keep fixture evidence outside real project truth.

For repository/code changes:

```bash
pnpm verify
```

Before newly implemented repository-local commands:

```bash
pnpm build
```

Land coherent changes through pull requests and required checks. Use Pactwright's available public/runtime mechanisms for work it can represent; do not maintain canonical graph coherence by hand.

Use [Checkpoint 2 — Exact-version upgrade acceptance](./02-remote-delivery.md#exact-version-upgrade-acceptance) for the `0.0.7 → 0.0.8` transition. Prove exact desired targets and compatible intermediate states before release. Do not preinstall target packages, edit either lock, silently switch Agent Packs or invent component upgrade flags.

Use the existing workflow-activation prerequisite handling: land the workflow version capable of producing a required check before enforcing that check, and land changed routes before claiming their remote behaviour works. An unmet managed prerequisite is incomplete activation, not convergence.

## 4. Exact operating surface

The all-first-party-enabled reference configuration, with GitHub enabled, has exactly five Pactwright-managed product workflows:

```text
.github/workflows/
├── pactwright.yml
├── pactwright-intelligence.yml
├── pactwright-graph-review.yml
├── pactwright-assets-publication.yml
└── pactwright-operations.yml
```

Its supported canonical check catalogue contains exactly:

```text
Pactwright / Graph
Pactwright / Lifecycle
Pactwright / Review

Pactwright / Intelligence
Pactwright / Intelligence Promotion
Pactwright / Intelligence Views
Pactwright / Intelligence Grounding

Pactwright / Assets
Pactwright / Publication

Pactwright / Operations
Pactwright / Operations Views
```

Exercise all eleven meanings across applicable acceptance scenarios. This is not a requirement that every check run on every PR or that every repository enable every optional check, view, summary, schedule or authority mapping. Disabled components do not contribute active integration. Preserve Projects-disabled and GitHub-disabled operation.

Repository-owned `ci.yml`, `release.yml` and unrelated workflows are outside this five-file product set and must remain untouched by product sync. Do not add Graph Review or Publication Feedback check names absent from Spec 07, or legacy Review Creative, Creative Grounding, Next Actions or named-reviewer surfaces.

Three mutation owners remain distinct:

```text
pactwright sync
→ Pactwright-managed local integration

pactwright github sync
→ managed remote settings / labels / rulesets / required checks / Project schema

GitHub Actions invoking Pactwright
→ checks / summaries / Project items / derived values
```

GitHub consumes runtime-supplied repository, Project Graph and environment identities. Generated reports and execution provenance are not canonical graph records. Do not add a two-way field synchronisation system, archive service, marketplace, provider layer or new canonical record type for this checkpoint.

## Stage 1 — Complete profile composition and remote ownership

### Step 1 — Prove the existing composition engine across all five profiles

**References:** Specs 02 Extension/capability resolution and 07 §§3–6; Checkpoints 2–7.

**Run**

```text
Use the existing desired-state planner with Delivery, PI, Graph Review, Assets / Publication, Operations and repository overrides.

Resolve dependencies and the complete selected Agent Pack capability set before activation.
Only enabled components contribute; identical requirements collapse, compatible requirements merge and incompatible requirements fail before remote mutation.
Do not introduce another full-system planner or silently switch the selected pack.

Extend existing conformance cases for combined interactions. Map each changed behaviour to its semantic owner and existing test/evaluation case; keep this mapping in test metadata or acceptance evidence, not a new graph model.
```

**Expected result**

The already established engine deterministically resolves the complete first-party environment and supported partial configurations.

**Verify before continuing**

Test Core only, each Extension with its real prerequisites, all enabled, identical/compatible/conflicting contributions and repository overrides. Include missing capabilities, dependency incompatibility and disabled-profile overrides. Failed composition preserves the prior valid package/configuration/lock/generated environment and performs no remote mutation. Repeated resolution of identical inputs must produce the same desired state.

### Step 2 — Prove one shared Project and configurable projection scope

**References:** Spec 07 §§10, 16, 19, 22, 27, 32–34.

**Run**

```text
Contribute enabled configured fields/views to the existing shared Pactwright Project.
Do not create one Project per Extension or adopt another Project merely because its display name matches.

Record the selected full-system reference configuration. Separately support partial views/checks/summaries/schedules and github.project.enabled: false.
With Projects disabled, do not require Project permissions or perform Project-backed projection; configured checks and PR summaries remain usable.
```

**Expected result**

One active shared Project serves the configured system; optional UI choices do not change canonical semantics or force unrelated permissions.

**Verify before continuing**

Verify one stable Project identity across all-enabled and partial-profile fixtures. A clean Projects-disabled fixture provisions no Project. Disabling Projects in a populated fixture stops Project-backed work and follows existing safe ownership cleanup without deleting unrelated resources or pretending preserved historical resources are newly provisioned. Test individually disabled views/schedules and prove they are not re-enabled by another profile.

### Step 3 — Enforce remote ownership and activation prerequisites without inventing gap policy

**References:** Spec 07 §§3–4, 33–38, 41; Implementation Guide gap discipline; Checkpoint 2 reconciliation.

**Run**

```text
Cover the configured/supported managed structural surface:
repository settings, labels, rulesets, required-check configuration, shared Project, fields and views.

Use the same planner for dry-run and apply. Remove a resource only when ownership is established and no enabled component still requires it.
Do not infer persistent ownership from display names alone. Preserve ambiguous/unowned resources and report them.

Distinguish converged managed state, preserved unmanaged ambiguity and unmet managed prerequisites. A report of ambiguity is not a waiver for required behaviour that cannot safely be supplied.
Never enforce a check before its producing workflow is available through normal repository authority.
```

Keep remote rename/adoption identity, arbitrary GitHub authority mapping, universal check-conclusion mapping and automation concurrency implementation gaps explicit. Supported mechanisms must still preserve current-state validation, runtime authority and no-lost-update semantics; uncertainty is not permission for last-writer-wins or unsafe adoption.

**Expected result**

Reconciliation supplies the required owned structure or reports a specific incomplete condition without destructive assumptions or false convergence.

**Verify before continuing**

Reuse create/update/no-op/removal, unowned collision, ambiguous rename, missing permission and missing producing-workflow fixtures. Dry-run must not mutate or broaden scopes. Apply must preserve unrelated settings, labels, rulesets and Projects. After authorised prerequisites are met, the same apply path converges. Record which reported ambiguities are genuinely non-blocking and which prevent required acceptance.

## Stage 2 — Complete Delivery and Project Intelligence projections

### Step 4 — Verify complete Delivery PR, Issue and Project navigation

**References:** Specs 01 lifecycle/authority and 07 §§7–10, 17, 28–30.

**Run**

```text
Use runtime outputs and canonical links, not copies of entire records.

Delivery PR:
Intent → Contract → Brief → Delivery → Delivery Review → Evidence,
plus current runtime-resolved step/state and blocking information.

Intent Issue:
title, current lifecycle state, current Contract, current Brief, linked pull request, blocking state.

Delivery Project:
lifecycle step/state, blocked, Contract, Brief, pull request, last activity;
Delivery and Blocked views where configured.

Configured PI additions may include domain, grounding, knowledge blocker and launch tranche.
Configured Operations additions may include latest Deployment, environment, active findings and corrective origin.
Link applicable Graph Review Findings, Assets/Publications and motivating Knowledge/Observations without transferring authority.
```

**Expected result**

Users can navigate the current governed lineage and applicable cross-Extension context from derived GitHub surfaces.

**Verify before continuing**

Compare each applicable field with runtime output across open, deferred, rejected, contracted, delivering, blocked and completed lineages. Verify canonical links, last-activity derivation and supersession handling. Test Gate stopping and blocking Delivery Review through the runtime. Editing a Project/Issue field, approving a PR or merging must not create a Decision, satisfy a Gate or make Evidence, Deployment or Publication true. Keep unresolved non-Delivery-PR policy explicit rather than inventing it here.

### Step 5 — Verify PI checks, Grounding states, promotion summaries and derived views

**References:** Spec 03 governance/coverage/roadmap and Spec 07 §§11–17, 31.

**Run**

```text
Use the four existing Intelligence checks and configured views:
Promotions, Coverage, Roadmap, Freshness, Propagation.

Intelligence validates canonical Source/Domain/Knowledge and relationship/provenance rules.
Intelligence Promotion validates required approval, automatic boundaries and proposed cross-owner consequences.
Intelligence Views checks reports against the current runtime graph revision.
Intelligence Grounding projects exactly grounded | attention | blocked | not-applicable.
Stale Knowledge does not automatically mean blocked; the owner and lifecycle policy determine blocking.

Promotion summaries show Source/domain/triage, proposed Knowledge mutations, downstream recommendations, propagation and logical-owner review routing.
Distinguish mutations actually proposed from merely recommended Delivery/sibling changes.
Finding-origin Sources retain non-graph execution-output provenance; Observation-origin Sources retain canonical Operations provenance.
```

**Expected result**

PI governance and current derived views remain understandable without GitHub accepting Knowledge, owning coverage or creating candidates independently.

**Verify before continuing**

Exercise all four Grounding states, stale-but-not-blocking Knowledge, missing required approval and both internal Source origins. Compare configured views with the owning PI derivations, including candidate readiness/dependencies/ordering. Change canonical inputs and detect stale reports; regeneration must restore correct content and revision stamps without rewriting canonical meaning. A stale derived report is not itself evidence of invalid canonical Knowledge. GitHub metadata must not promote Knowledge or turn a candidate into an Intent.

## Stage 3 — Complete Graph Review and Assets / Publication projections

### Step 6 — Verify Graph Review projection and hand-off boundaries

**References:** Spec 04 and Spec 07 §§18–19, 31, 35.

**Run**

```text
Use pactwright-graph-review.yml and configured Reviews/Findings views.
Project request perspective, reviewed graph revision, execution status, advisory/material/critical counts, Source hand-off count and links to immutable execution provenance and resulting Sources.
Preserve runtime-supplied replay identities.

Manual, configured scheduled/event execution and hand-off retry use the existing runtime responsibilities.
A failed review emits no Findings. A failed Source hand-off preserves successful Findings and retries without repeating the review.
Findings remain non-graph outputs, never accepted project truth or Delivery Review results.
```

**Expected result**

Graph Review is navigable as specialist graph analysis, not a replacement for Delivery Review, Evidence closure or its own provenance store.

**Verify before continuing**

Project successful, failed, no-Finding and pending/retried-hand-off executions. Compare counts, statuses and Source links with the runtime; lost acknowledgement must not rerun analysis or duplicate Sources. Verify report/projection failure preserves execution/Finding history and PI state. Do not add reviewer rosters, Review Definitions, Next Actions, named reviewer views or a new Graph Review check. Step 12 separately proves actual pinned execution, not only displayed provenance.

### Step 7 — Verify approved Asset and actual Publication projections

**References:** Spec 05 and Spec 07 §§20–22, 29; Checkpoint 7 Publication conformance.

**Run**

```text
Use Pactwright / Assets and Pactwright / Publication plus configured Assets/Publications views.

Asset projection may include title, media type, Delivery lineage, exact content identity, applicable grounding state, human approver, current/superseded state and Publication count.
Publication projection may include Asset, channel, locator, publisher/time and linked Operations Observations when enabled.

Candidate outputs never appear as canonical Assets. Evidence is already canonical and does not automatically create an Asset.
Generic GitHub approval is not Asset approval; supported trusted mappings still invoke exact human-authority/hash/grounding checks in the runtime.
A Publication records an actual release of an approved Asset, not a schedule, merge or performance claim.
```

**Expected result**

GitHub exposes approved output and release history without taking over approval, content identity or operational meaning.

**Verify before continuing**

Compare configured fields with canonical records. Exercise repository-backed byte drift, missing human approval/grounding, mismatched Publication asset hash, candidates, superseded Assets and intentional multiple Publications. Preserve distinct exposure identities when Publications share Asset bytes or a locator. Failed release leaves the approved Asset unchanged; poor performance does not invalidate a valid Publication. Any configured automated release must use an already approved Asset and actual release provenance. Unsupported optional authority/release routes must not be generated or advertised.

## Stage 4 — Complete Operations projection

### Step 8 — Verify Operations checks, exact configured views and corrective provenance

**References:** Specs 03 roadmap ownership, 06 and 07 §§23–29, 31–32; Checkpoints 6–7.

**Run**

```text
Use Pactwright / Operations and Pactwright / Operations Views.
Configured views are Operations, Deployments, Production Findings and Corrective Roadmap.
Production Findings projects canonical Operations Observations; it is distinct from Graph Review Findings.

Deployment fields may include environment, Evidence, artefact revision, deployed time/by, active Observation count and current/superseded state.
Observation fields may include exact exposure/type, direction, significance, confidence, evidence window, current derived state, resulting Source and Knowledge/promotion PR.

Operations Views compares the corrective report with BOTH the current applicable PI candidate derivation and current runtime Project Graph revision.
Preserve PI candidate identities, readiness, dependencies and relative ordering, including relevant dependencies outside the filtered set.
A fresh stamp on stale candidate contents is not a current view.

Configured PR/Issue context links prior exposures, Observations, accepted operational Knowledge and corrective origin.
Refresh summaries contain bounded aggregate/provenance information, never raw telemetry or credentials.
```

**Expected result**

GitHub shows durable operational facts and governed corrective work without becoming a telemetry store or second roadmap.

**Verify before continuing**

Compare fields and cross-Extension Publication → Observation → Source/Knowledge/candidate links with the owners. Test canonical invalidity, external authentication/analysis failure, successful no-Observation and stale views as distinct outcomes. Change PI candidates while retaining/copying revision stamps and require stale content detection. Significance/confidence must not accept Knowledge or reprioritise work. Failed hand-off retries the existing Observation; failed optional Project/summary/report updates leave valid canonical and immutable execution state unchanged.

## Stage 5 — Prove exact workflow and validation composition

### Step 9 — Activate the workspace environment and verify deterministic workflow routing

**References:** Specs 02 resolution/sync and 07 §§5–7, 11–13, 18–27; Checkpoints 2–7.

**Run**

Preserve the explicitly selected Agent Pack and enabled Extensions. Resolve changed workspace manifests through the existing supported environment/lock mechanism before using them; do not edit locks by hand. Start from the committed dependency state, build and generate:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm pactwright sync
pnpm pactwright doctor
pnpm pactwright sync
```

Record the active workspace package/manifest identities and generated-file hashes. The second sync with unchanged inputs must be byte-identical. Use existing generated-workflow and runtime integration fixtures to exercise the routing below, not just count files.

| Input or event | Existing responsibility to exercise |
|---|---|
| Core records, `specs/**`, relevant `.pactwright/**` changes | Core and registered owning validators; configured continuation through `lifecycle run`. |
| `specs/graph/edges.yml` | Validators chosen by registered edge type/endpoints, including multiple owners for cross-graph relationships. |
| PI Sources, Domain/Knowledge proposals and accepted changes | Source capture, promotion validation, onboard/roadmap/propagation and configured freshness processing. |
| Graph Review execution/report paths and configured manual/scheduled/event routes | Review execution/provenance validation, Finding hand-off and projection; retry hand-off without rerunning review. |
| `assets/**` and Asset/Publication canonical paths | Exact hash, approval, grounding and release validation; only configured trusted release/feedback operations. |
| Operations source/environment, Deployment/Observation/execution paths and configured events | Configuration/record validation, trusted deployment recording, bounded refresh and PI hand-off. |
| Relevant accepted Operations-originated PI changes | Current PI-filtered corrective-roadmap generation and view checks. |

Use the exact owning paths and events specified in Spec 07 and the upstream conformance cases. Keep schedules in the owning workflow. Include irrelevant-path, disabled-feature and cross-owner-change cases; broad validation does not automatically authorise collection or publication.

**Expected result**

The active workspace resolves the intended complete environment and generates the five correct thin workflows with deterministic, ownership-aware routing.

**Verify before continuing**

Compare both sync outputs, the exact five-file reference set and the expected subsets for disabled configurations. Verify runtime invocations/results for each routing class. Preserve `ci.yml`, `release.yml`, unrelated user workflows/source and external Production Skills repositories by before/after hashes. Missing or drifting locked dependencies must be diagnosed rather than silently replaced. No extra per-command workflow, CI-only agent or Publication-monitoring policy may appear.

### Step 10 — Land changed workflows and reconcile the complete remote structure

**References:** Spec 07 §§3–4, 33–34; Checkpoint 2 activation/convergence contract.

**Run**

Inspect the generated diff and remote plan:

```bash
pnpm pactwright github sync --dry-run
```

Land the changed generated workflows through normal reviewed repository authority. Verify the remote version contains the routes and can produce the configured required checks before enabling those requirements. Do not bypass current policy or treat locally generated files as remote activation.

Once prerequisites are met:

```bash
pnpm pactwright github sync
pnpm pactwright github sync --dry-run
pnpm pactwright validate
```

Inspect the configured/supported settings, labels, rulesets, required checks and shared Project schema. Keep runtime projection updates separate from structural convergence.

**Expected result**

Managed remote structure converges through the same planner and safe activation rules, while unrelated resources remain unchanged.

**Verify before continuing**

Require no unresolved managed drift or unmet prerequisite needed for acceptance. Report preserved unmanaged ambiguity separately; it may remain only when it does not prevent the required surface and meets the non-blocking gap rules. Test actual configured check execution after activation. Verify stable shared Project identity and preserved unrelated resources; a clean structural dry-run does not certify current summaries/items/values.

### Step 11 — Run cumulative semantic, GitHub, security and failure conformance

**References:** Specs 01–06 owning validators/evaluation; Spec 07 §§35–40; Spec 02 §§21–24; Implementation Guide verification.

**Run**

In the fully enabled reference environment, run the existing owners and evaluation runner explicitly:

```bash
pnpm pactwright validate
pnpm pactwright intelligence validate
pnpm pactwright graph-review validate
pnpm pactwright assets validate
pnpm pactwright operations validate
pnpm pactwright eval
pnpm pactwright github sync --dry-run
```

Map the cumulative GitHub Integration suite to the Spec 07 §39 contract:

```text
1. profile composition and conflict detection;
2. deterministic workflow generation;
3. exact trigger/path routing;
4. lifecycle Gate stopping;
5. check semantics;
6. PR/Issue projection accuracy;
7. Intelligence Grounding states;
8. promotion PR projection;
9. Project field/view derivation;
10. Operations PR context;
11. report revision and stale-view detection;
12. runtime replay provenance without GitHub-derived substitution;
13. pinned replay failure without current checkout/environment fallback;
14. Extension enable/disable behaviour;
15. remote reconciliation;
16. preservation of unmanaged GitHub state;
17. least-privilege configuration;
18. failure-state separation;
19. canonical-state independence from GitHub metadata.
```

Reuse the cases implemented earlier; add only missing combined interactions. Keep cases versioned with their owners and deterministic assertions separate from semantic judgement. No duplicate validators, new benchmark service or automatic execution of whole external domain benchmark suites is required. Complete the corresponding live/replay/reconciliation scenarios in Steps 12–14 before accepting this cumulative suite.

Across all five workflows, verify least-privilege tokens, SHA-pinned actions, frozen installs, bounded timeout/concurrency, appropriate checkout credential handling and safe triggers. Normal untrusted PR validation must not receive publication/deployment/Operations secrets, privileged external access or write-capable credentials. Enabling a privileged profile must not broaden another path's authority. Avoid `pull_request_target` for normal validation.

Exercise supported trusted-event mappings through their existing runtime authority checks. Generic approval, labels, comments or merge metadata alone cannot create canonical records, satisfy Gates, approve Assets, establish exposure or accept Knowledge.

Inject failures in isolated local and remote fixtures for blocking Delivery Review, missing promotion approval, Graph Review execution, both PI hand-off paths, Publication, Operations collection/analysis, stale reports and optional projection updates. Preserve each owner's canonical and immutable execution state. Successful no-Observation is not failure. Retry only the failed hand-off/report responsibility; concurrent accepted changes must survive revalidation without last-writer-wins.

When changes affect Agent Pack/prompt/skill/adapter execution behaviour, record an exact candidate identifier supported by the existing evaluator and compare against the published baseline:

```bash
pnpm pactwright eval \
  --baseline @pactwright/standard@0.0.7 \
  --candidate <recorded-candidate-pack-or-environment>
```

Use meaningful capability/agent/case/change dimensions. A projection-only change need not manufacture an AI behaviour difference; record why baseline comparison is not applicable where appropriate.

**Expected result**

The combined system passes its actual integration contract, detects deliberate regressions and preserves semantic authority under both failures and privileged/untrusted execution boundaries.

**Verify before continuing**

Retain a case-to-requirement result map, not just a single green score. Inject known misrouting, wrong Grounding state, stale-content/fresh-stamp, forbidden-mutation and permission regressions and require the responsible cases to fail. Negative tests must assert expected failure in isolated fixtures, not leave real canonical state broken. Restore valid fixtures and rerun the full suite plus `pnpm verify`. Keep execution failure, canonical invalidity, stale derived state and incomplete activation distinguishable without inventing a universal GitHub conclusion mapping.

### Step 12 — Prove shared execution identity and actual pinned remote replay

**References:** Specs 01 revision identity, 02 locking/replay, 04 Graph Review replay and 07 §§6, 18, 31, 35.

**Run**

```text
For each of the five workflows, compare its resolved environment with equivalent local execution using the same lock:
runtime, Extensions, selected Agent Pack, resolved agents/skills, external Production Skills and selected Production Extension Packs.
Require the same runtime-supplied environment_lock_hash; do not derive a CI identity.

Use existing Graph Review run/rerun operations to prove actual local and GitHub-triggered pinned execution, not just projection of an old tuple.
Pinned reconstruction must verify repository_revision → project_graph_revision and resolve the exact recorded environment/request/scope.
Explicit --current reruns use a new current replay base and a new immutable execution.

Where another existing Delivery/execution surface promises pinned replay, apply the same conformance. Do not invent a new replay promise or command merely to expand coverage.
```

Exercise the existing interfaces with recorded IDs:

```bash
pnpm pactwright graph-review rerun <execution-id>
pnpm pactwright graph-review rerun <execution-id> --current
```

Invoke the same supported runtime operations from safe remote fixtures. Test unavailable repository state, graph mismatch, missing historical package/skill/pack and unreconstructible required external evidence. Pinned execution must fail without using newer dependencies or the workflow's current checkout.

Distinguish the original execution replay base from the current source revision of a regenerated report. Every generated report records its actual source Project Graph revision; revision awareness alone does not require a full replay tuple. Graph Review Findings, lifecycle/Operations/Review execution provenance, generated reports, adapter output and GitHub state remain excluded from Project Graph revision; registered canonical records and edges remain included.

**Expected result**

Remote execution and its projections consume exact Pactwright identities, and promised historical replay either reconstructs the real recorded inputs or fails explicitly.

**Verify before continuing**

Compare identities and actual resolved inputs for all five workflows. Retain successful pinned and explicit-current cases plus each failure class locally/remotely. Modify GitHub-only metadata and generated output without changing the graph revision or original execution identity; mutate registered canonical state and require a graph-revision change. Verify report-current and execution-historical stamps are not interchanged. Failed replay creates the owning failure provenance but no successful Findings or current-state substitute. No archive or Operations rerun subsystem is introduced.

## Stage 6 — Reconciliation and disablement tests

### Step 13 — Prove all three reconciliation owners and the live Pactwright surface

**References:** Spec 07 §§3, 9–10, 29, 31–35; Spec 08 dogfooding; Checkpoints 2–7.

**Run**

Prove each ownership layer independently:

| Layer | Controlled exercise | Correct owner |
|---|---|---|
| Local generated integration | Drift one managed file/region in a fixture, regenerate and repeat. | `pactwright sync` restores deterministic managed output only. |
| Managed remote structure | Exercise supported create/update/remove/no-op cases for settings, labels, rulesets, required checks and Project schema in isolated repositories. | `pactwright github sync` uses its shared dry-run/apply planner and preserves unowned resources. |
| Runtime projections | Alter or remove a safe derived summary, managed item or field value, then invoke its existing projection route. | Actions invoking Pactwright regenerate from runtime truth; structural sync does not claim to repair runtime values. |

On the real Pactwright repository, make one reversible change to a clearly owned Project field/view and reconcile it safely. Use isolated repositories for risky rule/permission cases. Do not infer rename/adoption semantics from this test.

Build a live acceptance trace using genuine prior Delivery, PI, Graph Review, Asset/Publication and Operations records where applicable. Map runtime identities to current checks, canonical links, summaries, shared Project items and derived fields. Then perform one normal governed bounded change or safe configured runtime event and verify the relevant projections update through the correct owner. Reuse earlier genuine histories rather than creating fake operational findings or re-recording old Publications.

**Expected result**

Structural convergence and runtime projection freshness are independently demonstrated, and the real complete surface processes meaningful state rather than merely existing as empty workflows/views.

**Verify before continuing**

Compare before/after managed and unmanaged state at every layer. Repeat local sync and remote dry-run after repair; separately inspect restored summaries/items/values. Require canonical and immutable historical state to remain unchanged by projection edits, failed repair or optional projection failure. Retain the live record-to-projection trace and new event result with normal authority provenance. Synthetic failure fixtures must not be described as real operational outcomes.

### Step 14 — Prove populated-history disablement, re-enablement and optional configuration

**References:** Spec 02 removal/dependencies and Spec 07 §§4–6, 32–34; Checkpoint 7 populated exposure history.

**Run**

```text
In populated isolated fixtures exercise:
- Graph Review disabled while PI remains;
- Operations disabled while Assets / Publication remains;
- Assets / Publication disabled after Publication Observations exist;
- PI-only removal while Graph Review or Operations still depends on it;
- owner re-enablement after each permitted disablement;
- selected views/checks/summaries/schedules disabled without disabling their semantic owner;
- Projects disabled while configured checks/PR summaries remain usable;
- GitHub integration disabled while local Pactwright remains usable.

Remove only safely owned generated/remote contributions no enabled component still requires.
Preserve canonical records and immutable execution history.
Block required-dependency removal through the existing manager.
Do not delete data, silently change the Agent Pack or create substitute records to make a disabled configuration look valid.
```

For a Publication owner disabled after Observations exist, new exposure resolution becomes unavailable; preserve history and diagnose unavailable references rather than copying/retargeting them. Native Deployment Operations remains independently usable. Re-enabling the owner restores original identity resolution without duplicate Publications, Observations or PI Sources.

With GitHub disabled, generate no active product workflows or remote projection work according to existing safe cleanup; unrelated repository-owned CI/release workflows remain intact. Preserved resources whose deletion is unsafe must be reported, not silently adopted or treated as active required integration.

**Expected result**

The full system supports safe partial operation and restoration without hidden dependencies, permission creep or loss of historical truth.

**Verify before continuing**

Run enabled owning validators and core validation at each transition, recording expected unavailable-command/registration or unresolved-reference diagnostics explicitly. An unavailable validator is not a pass. Compare canonical/execution hashes, workflow/check subsets, shared Project identity, fields/views/routes and unmanaged resources. Re-enable through normal resolution/sync/reconciliation and require restored references, no duplicate hand-offs and a clean second convergence check. Re-run the cumulative suite for the supported configuration classes.

## Stage 7 — Publish the full operating path

### Step 15 — Deliver and execute the governed end-to-end learning path

**References:** Spec 01 Delivery closure, Spec 03 readiness, Spec 04 Graph Review boundary and Spec 08 §§8, 14–21, 24, 26.

**Run**

Before approval, reuse the existing PI public-content readiness gate:

```bash
pnpm pactwright intelligence onboard
pnpm pactwright intelligence validate
```

Require every applicable domain to be Covered: identity for identity/voice/values; content for educational/editorial/marketing work; product for capability/value/behaviour/limitation claims; go-to-market for acquisition/positioning; delivery/ux for user workflow claims; delivery/eng for technical claims; and other factual domains relied upon. Do not require unrelated coverage. Each used claim/constraint must be accepted, in-horizon Knowledge with traceable Sources. Retain exact grounding; missing readiness blocks approval and challenged/superseded/retracted relied-on Knowledge requires re-grounding and re-evaluation before approval.

Through normal Pactwright Delivery, the selected Agent Pack and relevant Production Skills, publish/update:

```text
full operating/GitHub guide
one executable end-to-end example
advanced Academy operating-workflow lesson
ecosystem / Extension catalogue
complete README capability map
```

The example must show the correct authority and closure path:

```text
applicable PI grounding
→ explicit Intent
→ transient Contract alternatives
→ authorised Decision and selected Contract
→ Brief
→ Delivery
→ Delivery Review
→ canonical Evidence
```

Graph Review is a separate wider-project branch:

```text
Project Graph
→ Graph Review
→ Finding
→ PI Source
→ governed Knowledge/candidate where justified
```

Graph Review does not close Delivery or produce Evidence. Its Findings cannot replace mandatory Delivery Review.

Show a semantically appropriate post-Delivery continuation:

```text
software: Evidence → actual deployment → Deployment

published output: Evidence → exact human approval → Asset
→ actual channel release → Publication

exposure → bounded evidence → Observation → PI Source
→ accepted Knowledge → PI candidate → explicit future Intent when authorised
```

Do not force every output into both post-Delivery paths, fabricate a live defect or imply a completed revision has already improved performance. A controlled executable fixture must remain labelled and isolated; case-study statements must trace actual outcomes.

The lightweight repository-owned catalogue distinguishes Agent Packs, Pactwright Extensions and compatible Production Skills. Include the standard pack, first-party Extensions and genuinely supported external integrations with category, compatibility, installation and documentation metadata. Reuse registry metadata in docs/website where practical; do not build a marketplace, second plugin system or exhaustive third-party directory. Verify discovery links from the README and website without duplicating product truth.

**Expected result**

Users can discover, understand and execute the full configured operating path without confusing Delivery Review, Graph Review, publication authority or PI consequence governance.

**Verify before continuing**

Run the example in a clean supported consumer and in CI where practical, using the same runtime commands and locked environment. Verify all included lineage, approval, actual-release/deployment and PI boundaries; simulated fixture events must not be presented as live exposure. Validate guide commands, catalogue metadata/links, README capability claims and applicable readiness. Separately run architecture/coherence and public-product Graph Reviews, triage every Finding through PI and resolve blockers through normal Delivery. Prose review does not replace example execution. Retain accepted Evidence and applicable Asset/Publication provenance for the public work.

## Stage 8 — Release and Kakeido proof

### Step 16 — Publish exact `0.0.8` after cumulative and upgrade acceptance

**References:** Implementation Guide release model; Spec 02 upgrades; Checkpoint 2 exact-version upgrade acceptance.

**Run**

Before publication, prove the accepted `0.0.7 → 0.0.8` transition in isolated consumers using built/packed targets through the existing owning upgrade paths. Resolve compatibility metadata and verify every intermediate state, including PI with its enabled dependants and the selected external skills/packs. A resolver fixture with newer available versions must still honour the exact desired targets. Do not use manual preinstallation to bypass the upgrade commands.

Require cumulative conformance, the live Pactwright surface trace and the executed end-to-end material to pass. If execution behaviour changed, review the applicable baseline comparison from Step 11.

Use the normal release PR, CHANGELOG from accepted Evidence, merged release commit/tag and trusted-publishing flow. No new package or publisher bootstrap is introduced. Release the existing six compatible first-party packages as `0.0.8`; external Production Skills retain their own exact versions/revisions and are not republished as Pactwright packages.

**Expected result**

The exact compatible first-party family is published under the existing release policy with provenance and a fixture-proven safe consumer transition.

**Verify before continuing**

```bash
pnpm view pactwright@0.0.8 version
pnpm view @pactwright/standard@0.0.8 version
pnpm view @pactwright/project-intelligence@0.0.8 version
pnpm view @pactwright/graph-review@0.0.8 version
pnpm view @pactwright/assets-publication@0.0.8 version
pnpm view @pactwright/operations@0.0.8 version
```

All return `0.0.8`. Verify tagged-source/release-workflow provenance, registry results and exact-target/intermediate-compatibility fixtures. Package existence alone does not prove upgrade or operating-surface acceptance.

### Step 17 — Upgrade Kakeido exactly and prove its live complete surface

**References:** Spec 02 upgrade ownership; Specs 01–08; Checkpoint 2 exact-version upgrade acceptance; current Kakeido canonical specs.

**Run**

Start from Kakeido's real accepted published `0.0.7` environment. Record package/configuration/both-lock state, selected external dependencies, enabled profiles and historical canonical/execution identities. Use Step 16's proven compatible sequence. Do not preinstall targets, reinitialise the project, change selected pack identity or re-create prior records.

Upgrade the runtime and verify the still-compatible environment and new-runtime migration/validation provenance:

```bash
pnpm pactwright upgrade --to 0.0.8
pnpm pactwright validate
```

Set the currently selected standard Agent Pack's desired version to exact `0.0.8` through its existing supported configuration, preserving its source. Then:

```bash
pnpm pactwright agent-pack upgrade
pnpm pactwright doctor
pnpm pactwright validate
```

Upgrade each existing Extension separately in the proven dependency-safe order. Immediately before each command, set only that component's desired constraint to exact `0.0.8` through supported configuration; after it completes, verify installed versions, both locks and compatibility before proceeding:

```bash
pnpm pactwright extension upgrade project-intelligence
pnpm pactwright extension upgrade graph-review
pnpm pactwright extension upgrade assets-publication
pnpm pactwright extension upgrade operations
```

The block lists the order, not permission to skip the per-component configuration and verification. Do not use `extension add`, `agent-pack use`, invented component `--to` flags or manual lock edits as upgrade shortcuts. Recover a failed operation before attempting the next one.

Activate and check the updated generated integration:

```bash
pnpm pactwright sync
pnpm pactwright doctor
pnpm pactwright github sync --dry-run
```

Land changed workflows through normal Kakeido repository authority before relying on new remote behaviour. Then:

```bash
pnpm pactwright github sync
pnpm pactwright github sync --dry-run
pnpm pactwright validate
pnpm pactwright intelligence validate
pnpm pactwright graph-review validate
pnpm pactwright assets validate
pnpm pactwright operations validate
pnpm pactwright eval
```

Run the current Kakeido repository-defined tests for any real change. Reuse genuine histories from earlier checkpoints to trace all applicable profile surfaces as in Step 13. Perform one bounded governed change or safe configured runtime event and verify actual resulting checks/summaries/items/values. Inspect the five reference workflows and same shared Project, but do not count their mere presence as complete acceptance.

**Expected result**

Kakeido runs exact `0.0.8` through the same upgrade and projection model, with real cross-profile navigation and event processing and no Kakeido-specific GitHub semantics.

**Verify before continuing**

Record exact versions and compatible package/Pactwright lock agreement after every operation; verify the six-package reference family, unchanged selected identities and preserved historical records/approved content. Explicit migrations, if required, retain their versioned provenance and must not silently reinterpret truth. Require healthy doctor, owner validation, cumulative integration cases, actual configured check execution and live record-to-projection/event evidence. Verify the final structural dry-run, current runtime projections and second local sync separately. Preserve unrelated workflows/resources and external repositories. Use isolated fixtures for destructive/failure tests, never invented live findings.

## Stage 9 — Capture feedback

### Step 18 — Govern failures and close only after blocker re-verification

**References:** Spec 03 governance; Spec 07 open gaps; Implementation Guide transition conditions.

**Run**

Capture material ownership, composition, routing, permission, check, projection, replay, upgrade, example and disablement failures from Pactwright and Kakeido through normal PI Source/triage/promotion governance. Distinguish repeatable Pactwright responsibility failures from project-specific choices. Reuse or add the smallest responsible regression case; do not automatically create Intents.

Correct every blocking failure through normal Delivery and rerun the affected acceptance plus cumulative checks. Recording a blocker as a future candidate is not resolution. Only explicitly non-blocking findings/design gaps may remain under the Implementation Guide transition conditions.

Preserve remote-resource identity/adoption, general concurrency, exact check mapping, arbitrary authority-event mapping and retention/interface gaps unless evidence requires a deliberate owning-spec change before implementation relies on new semantics. No new subsystem is justified merely by reaching this checkpoint.

**Expected result**

The complete operating surface has evidence-backed acceptance and governed non-blocking learning, not unresolved failures hidden behind a green workflow count.

**Verify before continuing**

Trace each blocker to its correction and passing re-verification. Review the full result map, live Pactwright/Kakeido traces, example/public-readiness evidence and exact release/upgrade proof. Require no known blocking failure before Checkpoint 9; retain explicit owner, evidence and non-blocking disposition for every open gap carried forward.

## Exit gate

Checkpoint 8 closes only when:

- the existing composition engine covers all five first-party profiles, dependency-first capability validation and repository overrides without a second planner;
- the all-enabled GitHub reference has exactly five managed product workflows and supports the eleven canonical check meanings, with no legacy or invented Graph Review/Publication Feedback checks;
- optional checks/views/summaries/schedules, Projects-disabled and GitHub-disabled configurations preserve local semantics and least privilege;
- configured Project-backed profiles use the same shared Project and stable runtime-derived navigation rather than one Project per Extension;
- Delivery PR/Issue/Project fields include the complete applicable lineage, blocking, canonical links and last activity;
- all four Intelligence Grounding states, promotion mutation/recommendation distinctions and current PI view derivations are verified;
- Graph Review remains non-graph execution/Finding provenance and never substitutes for Delivery Review or Evidence closure;
- Asset/Publication and Operations views retain approval, exact release/exposure identity, history, bounded evidence and PI-only consequence governance;
- every owning route and relevant shared-edge interaction is tested, including disabled/irrelevant paths, configured schedules and trusted/untrusted events;
- semantic validation and the mapped nineteen-dimension GitHub Integration evaluation pass, including injected failure/regression and security cases;
- all five workflows use the same exact local/Actions resolved environment and runtime-provided identities, including selected external skills/packs;
- actual pinned remote replay reconstructs recorded inputs or fails without current-state/newer-dependency substitution; explicit current reruns remain distinct;
- canonical records affect Project Graph revision while reports, Findings, execution provenance, adapter output and GitHub metadata do not;
- local generation, remote structural reconciliation and Actions runtime projection regeneration are independently proven through their correct owners;
- configured settings/labels/rulesets/required checks/Project schema converge only after workflow prerequisites, without hiding blocking drift as reported ambiguity;
- populated disable/re-enable tests preserve canonical/execution history, diagnose unavailable references, enforce dependencies and restore identities without duplicate records or hand-offs;
- failed execution, hand-off, release, report and optional projection operations preserve the respective owner's failure and authority boundaries;
- the public learning path passes applicable Covered-domain readiness and retains accepted, in-horizon, Source-traceable grounding;
- the end-to-end example actually executes, explicitly includes Delivery Review, separates Graph Review and preserves real approval/exposure and PI governance boundaries;
- the lightweight catalogue distinguishes Agent Packs, Extensions and genuinely supported Production Skills using validated reusable repository metadata;
- Pactwright and Kakeido each retain a live cross-profile record-to-projection trace and a verified new governed event without manufactured operational findings;
- the complete six-package `0.0.8` family is registry/provenance verified and the real `0.0.7 → 0.0.8` consumer transition uses exact desired constraints and owning commands with compatible intermediate states;
- every blocker has a correction and passing re-verification; only explicitly non-blocking gaps remain governed future work;
- no known blocking failure enters Checkpoint 9.

---

**Pactwright — Checkpoint 8 — Full Project Operating Surface v11**
