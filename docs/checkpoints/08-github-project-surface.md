# Pactwright — Checkpoint 8 — Full Project Operating Surface

**Version:** 10  
**Entry condition:** Checkpoint 7 is accepted and all first-party semantic Extensions exist.  
**Release:** `0.0.8`  
**Exit capability:** One shared GitHub Project plus the exact five Pactwright-managed workflows project the complete enabled system without becoming canonical truth.

## 1. Goal

Complete and harden the GitHub projection/composition layer across:

```text
Delivery
Project Intelligence
Graph Review
Assets / Publication
Operations
```

Then prove deterministic regeneration, remote reconciliation and safe Extension disablement.

## 2. Canonical baseline

Use canonical Specs 01–08 plus the Implementation Principles and Implementation Guide. Research logs are rationale only.

Kakeido acceptance uses its current canonical specifications.

## 3. Execution contract

Every implementation action follows:

```text
Step
→ References
→ Run
→ Expected result
→ Verify before continuing
```

For repository/code changes run `pnpm verify`; build before newly implemented local commands. After Checkpoint 2, coherent changes land through pull requests and required checks.

## 4. Exact operating surface

The managed workflow set is exactly:

```text
.github/workflows/
├── pactwright.yml
├── pactwright-intelligence.yml
├── pactwright-graph-review.yml
├── pactwright-assets-publication.yml
└── pactwright-operations.yml
```

The exact check surface is:

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

Do not add legacy checks such as Review Creative, Creative Grounding or Next Actions.

GitHub consumes replay identities supplied by Pactwright runtime. It does not derive repository, Project Graph or environment identity itself.

## Stage 1 — Complete profile composition and remote ownership

### Step 1 — Compose the five profiles deterministically

**References:** Spec 07 profile composition/provisioning.

**Run**

```text
Compose repository desired state from:
- Delivery profile;
- Project Intelligence profile;
- Graph Review profile;
- Assets / Publication profile;
- Operations profile;
- repository overrides.

Identical requirements collapse, compatible requirements merge, incompatible requirements fail before remote mutation.
Only enabled components contribute.
```

**Expected result**

One deterministic remote desired-state model exists.

**Verify before continuing**

Exercise core-only, every Extension independently where dependencies permit, all-enabled, identical/compatible/conflicting requirement fixtures.

### Step 2 — Enforce one shared GitHub Project

**Run**

```text
All enabled profiles contribute fields/views to one shared Pactwright Project per repository by default when Projects are enabled.

Do not create one Project per Extension.
When `github.project.enabled: false`, suppress Project-backed fields/views while checks and PR summaries continue where configured.
```

**Expected result**

Project UI is one projection of the whole Pactwright system.

**Verify before continuing**

Test all-enabled and partial configurations and require exactly one or zero Pactwright Project according to configuration.

### Step 3 — Preserve open remote-resource ownership gaps

**References:** Spec 07 open gaps; Implementation Guide gap discipline.

**Run**

```text
Implement only remote ownership/adoption behaviour required by the canonical GitHub contract.

Do not silently canonise new semantics for:
- managed resource identity across rename/collision;
- adoption of pre-existing ambiguous resources;
- automation branch concurrency/rebase policy;
- exact check conclusion mapping;
- safe mapping of arbitrary GitHub human events into Pactwright authority.

Where ownership is ambiguous, preserve user state and report the ambiguity.
```

**Expected result**

Reconciliation fails conservatively instead of deleting/adopting ambiguous user resources.

## Stage 2 — Complete Delivery and Project Intelligence projections

### Step 4 — Complete core Delivery PR/Issue/Project projection

**Run**

```text
Project runtime-derived Delivery state into PR/Issue/Project surfaces:
- lifecycle step/state;
- blocked state;
- Contract;
- Brief;
- PR linkage;
- relevant grounding/operations context when enabled.

GitHub fields remain derived. Editing them never mutates canonical Pactwright state.
```

**Expected result**

Core Delivery navigation is complete without GitHub becoming the lifecycle store.

### Step 5 — Complete all Project Intelligence checks/views

**Run**

Implement and verify:

```text
Pactwright / Intelligence
Pactwright / Intelligence Promotion
Pactwright / Intelligence Views
Pactwright / Intelligence Grounding
```

and configured views:

```text
Promotions
Coverage
Roadmap
Freshness
Propagation
```

Promotion summaries preserve internal-source provenance differences:
- Finding = Graph Review execution-output origin;
- Observation = canonical Operations-record origin.

Stale derived reports may fail Views freshness without invalidating otherwise valid canonical Knowledge.

**Expected result**

PI governance and projections are complete and correctly separate canonical vs derived state.

## Stage 3 — Complete Graph Review and Assets / Publication projections

### Step 6 — Complete Graph Review projection

**Run**

```text
Project Graph Review through the existing `pactwright-graph-review.yml` workflow and shared Project views:

Reviews
Findings

Show Review Execution replay provenance, status, Finding counts and PI Source hand-off links.

Do not implement reviewer roster, Review Definitions, Next Actions, or named reviewer views.
Findings remain non-graph execution output after hand-off.
```

**Expected result**

Graph Review is visible without GitHub becoming its execution/provenance store.

### Step 7 — Complete Assets / Publication projection

**Run**

Implement exact checks:

```text
Pactwright / Assets
Pactwright / Publication
```

and views:

```text
Assets
Publications
```

Asset projection may include Delivery lineage, content identity, grounding state where applicable, human approver, current/superseded state and Publication count.

Publication projection may include Asset, channel, locator, actor/time and linked Operations Observations when Operations is enabled.

Candidate outputs never appear as Assets. GitHub approval metadata alone never creates canonical Asset/Publication state.

**Expected result**

Only canonical approved outputs/exposures appear in GitHub.

## Stage 4 — Complete Operations projection

### Step 8 — Complete Operations checks/views/summaries

**Run**

Implement exact checks:

```text
Pactwright / Operations
Pactwright / Operations Views
```

Project only graph-level signal:

```text
Deployments
Operations / Observations
Corrective Roadmap candidates
```

Never project raw telemetry as Pactwright graph/project items.
Operations refresh summaries contain bounded aggregate/provenance information only.

**Expected result**

GitHub shows production state without becoming an observability store.

## Stage 5 — Prove exact workflow and validation composition

### Step 9 — Regenerate all managed local integration

**Run**

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm pactwright sync
```

**Expected result**

Exactly five Pactwright-managed product workflows exist when all first-party Extensions are enabled.

**Verify before continuing**

Confirm repository-owned `release.yml` and unrelated user workflows are untouched.

### Step 10 — Apply complete remote desired state

**Run**

```bash
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
pnpm pactwright github sync --dry-run
```

**Expected result**

Owned remote state converges and final dry-run is clean except explicitly reported external ambiguity/drift.

### Step 11 — Run the full validation matrix

**Run**

```bash
pnpm pactwright validate
pnpm pactwright intelligence validate
pnpm pactwright graph-review validate
pnpm pactwright assets validate
pnpm pactwright operations validate
pnpm pactwright github sync --dry-run
```

**Expected result**

All enabled semantic owners validate independently and the remote projection is converged.

### Step 12 — Prove replay provenance is projected, never derived

**Run**

Use one Graph Review execution and one Delivery/other replayable execution surface to verify GitHub summaries/checks consume the runtime-supplied:

```text
repository_revision
project_graph_revision
environment_lock_hash
```

Modify GitHub-only metadata and prove those identities do not change.

**Expected result**

GitHub is strictly a replay-provenance consumer.

## Stage 6 — Reconciliation and disablement tests

### Step 13 — Prove safe owned drift reconciliation

**Run**

Make one reversible change to a clearly Pactwright-owned Project field/view, detect it with dry-run, reconcile it, then require a clean final dry-run.

Do not use this test to establish new rename/adoption semantics.

### Step 14 — Prove Extension disable/removal combinations

**Run**

In fixtures test at least:

```text
Graph Review disabled while PI remains
Assets / Publication disabled while Operations remains
Operations disabled while Assets / Publication remains
attempt PI removal while Graph Review or Operations depends on it
```

Only owned integration is removed. Canonical Extension data is preserved according to Spec 02. Required dependency removal is blocked.

**Expected result**

GitHub profile composition follows semantic Extension ownership exactly.

## Stage 7 — Publish the full operating path

### Step 15 — Deliver the end-to-end operating guide/example

**References:** Spec 08 Full Operating Surface milestone.

**Run**

Through normal Delivery, relevant Production Skills and PI grounding, publish/update:

```text
full Pactwright operating/GitHub guide
one end-to-end example
advanced Academy closed-loop lesson
first-party Extension catalogue
README capability map
```

The example should show a coherent path such as:

```text
PI grounding
→ normal Delivery
→ optional Graph Review
→ Evidence
→ Deployment or Asset/Publication where applicable
→ Operations
→ PI
→ future Delivery
```

Do not describe a separate Creative Delivery lifecycle or named reviewer roster.

**Verify before continuing**

Run Graph Review requests for architecture/coherence and public-product correctness, then route Findings through PI.

## Stage 8 — Release and Kakeido proof

### Step 16 — Publish `0.0.8`

Release the compatible first-party family using the Implementation Guide. No new package is introduced.

### Step 17 — Prove the complete operating surface in Kakeido

Upgrade Kakeido using ownership-specific runtime/Agent Pack/Extension upgrade commands, then:

```bash
pnpm pactwright sync
pnpm pactwright github sync --dry-run
pnpm pactwright github sync
pnpm pactwright validate
pnpm pactwright intelligence validate
pnpm pactwright graph-review validate
pnpm pactwright assets validate
pnpm pactwright operations validate
```

Inspect the shared Project and all five managed workflows.

**Expected result**

The same complete projection model works in an external project without Kakeido-specific GitHub semantics.

## Stage 9 — Capture feedback

### Step 18 — Govern GitHub-surface failures

Ingest material failures/friction into PI, especially around ownership ambiguity, remote collisions, concurrency, check mapping, projection usefulness and disablement.

Do not resolve the declared open GitHub resource/concurrency/authority gaps inside the checkpoint unless evidence requires a deliberate owning-spec change first.

## Exit gate

Checkpoint 8 closes only when:

- profile composition covers Delivery, PI, Graph Review, Assets / Publication and Operations;
- one shared Project is used when enabled;
- exactly five Pactwright-managed product workflows exist in the all-enabled system;
- the exact canonical check set is implemented, including `Pactwright / Intelligence Grounding`;
- Reviews/Findings replace legacy Review Creative/Next Actions views;
- Assets/Publications replace creative-specific checks/views;
- the full validation matrix includes `graph-review` and `assets` namespaces;
- GitHub consumes replay identities rather than deriving them;
- local/remote regeneration converges;
- Extension disablement removes only owned integration and preserves dependencies/data;
- Pactwright and Kakeido both prove the complete operating surface;
- remote-resource ownership, concurrency and exact check mapping gaps remain explicit rather than silently invented;
- no known blocking failure enters Checkpoint 9.

---

**Pactwright — Checkpoint 8 — Full Project Operating Surface v10**
