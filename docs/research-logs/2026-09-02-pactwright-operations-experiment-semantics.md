# Pactwright — Operations Experiment Semantics

**Version:** 1  
**Status:** Adopted amendment to the Operations Graph Engineering Spec  
**Date:** 2026-09-02

## 1. Purpose

This amendment activates the Operations Graph future-improvement seam for controlled experiments.

Observed Kakeibo requirements now require Pactwright to represent a durable, predeclared production comparison independently from the raw analytics, model traces or provider tooling used to run it.

The generic flow is:

```text
Delivery Evidence
→ exact production/evaluation exposures
→ Experiment
→ bounded external evidence
→ Observation
→ Project Intelligence Source
→ triage / Knowledge / intent candidate
→ normal Delivery
```

An Experiment records **what was deliberately compared and how success was to be judged before the result was inspected**.

It does not record every experiment sample and it does not promote a candidate automatically.

---

## 2. Ownership and boundary

Operations owns:

- Experiment contract semantics;
- exact control/candidate exposure identity;
- experiment mode and evidence window;
- eligibility and assignment contract;
- primary and guardrail metric declarations;
- minimum-evidence / decision-rule declaration;
- experiment execution provenance;
- durable Observations about experiment outcomes;
- Experiment-specific derived projections.

Operations does **not** own:

- the product-specific behaviour being tested;
- Kakeibo `KeiRelease` semantics;
- model-route semantics;
- benchmark definitions;
- financial/product analytics schemas;
- raw experiment assignment or event rows;
- promotion approval;
- rollout percentages;
- Delivery Intents;
- Project Intelligence Knowledge.

Project-specific release/configuration artefacts remain owned by the project that produced them.

For Kakeibo specifically:

```text
KeiRelease / model route / task contract
→ Kakeibo repository/application state

Experiment
→ Pactwright Operations state
```

Pactwright must not create a first-class `KeiRelease` Project Graph node merely to support this scenario.

---

## 3. Core invariants

1. Experiment is Operations-owned canonical state, not a Delivery lifecycle stage.
2. An Experiment is immutable after recording; corrections use explicit supersession.
3. Control and candidate identify exact operational exposures by canonical id + hash.
4. The hypothesis, primary metric, guardrails and decision rule are fixed before outcome evidence is interpreted.
5. Raw analytics rows, prompts, responses, traces, assignments and metric samples are not Project Graph nodes.
6. Shadow candidates never become user-facing merely because an Experiment exists.
7. Experiment state cannot mutate the compared exposures.
8. Experiment outcome does not automatically promote the candidate.
9. Experiment outcome enters Project Intelligence through normal Observation → internal Source governance.
10. Hard project invariants cannot be weakened merely to create an experimental variant.
11. User-facing assignment must be stable when the project contract requires continuity.
12. Experiment execution failure cannot corrupt existing production exposure or canonical Project Graph state.
13. Re-running analysis over the same experiment/evidence must not create uncontrolled duplicate Observations.
14. GitHub and external experimentation platforms remain execution/projection surfaces, not canonical Experiment state.

---

## 4. Project Graph registration

The Operations extension adds one node type:

```yaml
graph:
  node_types:
    - deployment
    - experiment
    - observation

  edge_types:
    - deployed-as
    - observes
```

No new core Delivery edge is required.

`Experiment` is a native Operations exposure type. Therefore an Experiment result may use the existing relation:

```text
Observation --observes--> Experiment
```

The compared control/candidate exposures are referenced inside the Experiment using exact id/hash pairs. They must resolve to registered operational exposure types.

This deliberately avoids adding product-specific edge types such as `tests-kei-release`.

---

## 5. Repository layout

When Operations supports experiments:

```text
docs/operations/
  deployments/
  experiments/
  observations/
  reports/
    corrective-intent-roadmap.md

.pactwright/operations/
  sources/
  environments/

.pactwright/executions/
  operations/
```

`experiments/` contains immutable canonical Experiment contracts.

Detailed experiment samples remain in the external analytics/evaluation system or bounded execution provenance.

---

## 6. Experiment

Minimum conceptual structure:

```yaml
id: experiment-kei-summary-7c21
type: experiment
title: Weekly Summary candidate comparison
created: ...

mode: shadow | canary | ab | controlled_rollout

hypothesis: ...

control:
  exposure_id: deployment-kei-active-a103
  exposure_hash: ...

candidate:
  exposure_id: deployment-kei-candidate-c811
  exposure_hash: ...

eligibility:
  description: ...

assignment:
  strategy: mirror | stable_hash | explicit_cohort | none
  subject_key: user | account | session | null
  salt_reference: null | ...

metrics:
  primary:
    id: ...
    definition: ...
  guardrails:
    - id: ...
      definition: ...

minimum_evidence: ...
decision_rule: ...

window:
  start: ...
  end: null | ...
  review_condition: null | ...

constraints:
  - <Project Graph id + hash or repository contract reference>
```

Exact field representation is implementation detail. These meanings are canonical.

### Exact exposure identity

Control and candidate must resolve to immutable exact exposure identities.

For a Kakeibo Kei change this can be achieved by recording distinct Deployments for the active and candidate behavioural/configuration artefacts, each tied to Delivery Evidence and exact bundle/revision hashes. A shadow deployment may be active only on the isolated evaluation path; Deployment does not imply user visibility.

### Experiment modes

`shadow`

- the candidate receives eligible production grounding only through the project's isolated shadow mechanism;
- candidate output never reaches the user;
- no normal product side effect may originate from the candidate.

`canary`

- an explicitly limited cohort receives the candidate;
- assignment and rollback rules are predeclared.

`ab`

- eligible subjects are assigned to control/candidate according to the recorded assignment rule;
- stable assignment is required when project semantics require continuity.

`controlled_rollout`

- compares an existing production default with a bounded staged promotion;
- exact cohort percentages remain project operational configuration, not Pactwright semantics.

---

## 7. Constraints and non-experimentable invariants

Pactwright does not hard-code every project's safety rules.

An Experiment may reference accepted project constraints by Project Graph id/hash or repository contract reference.

The project's normal validation remains authoritative for whether the candidate is eligible for experimentation.

For example Kakeibo may declare that variants cannot weaken:

```text
financial truth
privacy
user authority
confirmation requirements
Known / Likely / Unknown semantics
financial-advice boundaries
canonical-state mutation boundaries
```

Operations records and projects those constraints; it does not redefine them.

A candidate failing a hard pre-experiment gate must not become a running Experiment.

---

## 8. Experiment execution provenance

Experiment collection/evaluation runs remain Operations execution provenance rather than Project Graph nodes.

An execution may add:

```yaml
experiment: experiment-kei-summary-7c21
mode: shadow

variants:
  control_exposure: ...
  candidate_exposure: ...

window:
  from: ...
  to: ...

evidence:
  locators: []
  fingerprints: []

metrics:
  primary: ...
  guardrails: ...

status: succeeded | failed
```

Keep only the metadata needed for reproducibility, comparison and evidence addressing.

Do not copy raw personal/product payloads into Pactwright merely to support experiment analysis.

---

## 9. Experiment outcomes

A durable experiment outcome is an Observation about the Experiment exposure.

Examples:

```text
Candidate Weekly Summary reduced validation failures without breaching the latency guardrail.
```

```text
The candidate failed the financial-authority hard gate during the experiment window.
```

```text
Evidence was insufficient to distinguish the candidate from control under the predeclared decision rule.
```

The Observation must:

- reference the Experiment id/hash;
- reference bounded supporting evidence;
- state the evidence window;
- preserve uncertainty;
- report guardrail breaches when material;
- avoid silently rewriting the predeclared hypothesis/metric contract.

An experiment result may be positive, negative, mixed or neutral.

Promotion/rejection remains a project decision reached through Project Intelligence and normal Delivery/governance.

---

## 10. Commands

Add:

```text
pactwright operations record-experiment <contract-path>
```

Existing commands remain:

```text
pactwright operations ingest [<source-id>]
pactwright operations observe [<source-id>]
pactwright operations refresh
pactwright operations corrective-roadmap
pactwright operations validate
```

`record-experiment`

- loads a proposed Experiment contract;
- resolves exact control/candidate exposures and hashes;
- validates predeclared hypothesis/metrics/assignment/decision rule;
- validates referenced project constraints where resolvable;
- writes one immutable Experiment node only after complete validation;
- prints the Experiment id.

`observe`

- may create an Observation about an Experiment when durable evidence exists;
- may legitimately create no Observation.

No `promote-experiment` command is introduced. Promotion belongs to the project's normal governance path.

---

## 11. Validation

`pactwright operations validate` additionally enforces:

1. every Experiment has valid mode, hypothesis and exact control/candidate references;
2. control/candidate ids resolve to registered operational exposure types;
3. recorded exposure hashes match canonical exposure state;
4. control and candidate are not the same exact exposure;
5. one primary metric is declared wherever the experiment mode requires comparative success;
6. guardrail declarations are structurally valid;
7. minimum evidence / decision rule is present before outcome interpretation;
8. assignment configuration is valid for the selected mode;
9. `stable_hash` assignment declares a privacy-appropriate subject key and stable rule;
10. shadow mode cannot be represented as user-facing assignment;
11. referenced project constraints resolve where required by repository policy;
12. Experiment records contain no credentials or raw user payloads;
13. supersession remains valid and acyclic;
14. Observations targeting Experiments use the existing valid `observes` relation;
15. execution provenance is not treated as Project Graph state.

---

## 12. Failure and idempotency

- invalid exposure identity prevents Experiment creation;
- missing hypothesis/primary metric/decision rule prevents Experiment creation when required;
- failure to write an Experiment leaves no partial canonical record;
- recording the same exact contract repeatedly is idempotent or resolves to the existing record;
- changing a recorded contract requires a new Experiment that supersedes the prior one;
- failed external assignment/evaluation records execution failure without altering the Experiment or exposures;
- insufficient evidence creates no forced outcome Observation;
- repeated identical outcome evidence does not create uncontrolled duplicate Observations.

---

## 13. GitHub projection requirements

The Operations GitHub profile gains Experiment support.

Relevant managed paths include:

```text
docs/operations/experiments/**
```

The shared Project may add an `Experiments` view.

Useful derived fields include:

```text
mode
hypothesis
control exposure
candidate exposure
primary metric
active guardrails
window
current derived state
latest Observation
resulting PI Source / Knowledge / Decision where available
```

GitHub may project, validate or trigger experiment analysis.

GitHub cannot create a valid Experiment by editing Project fields alone and cannot promote a candidate.

---

## 14. Project Intelligence hand-off

The existing Operations hand-off is unchanged:

```text
Experiment
→ Observation
→ internal Source
→ Project Intelligence triage
→ Knowledge / intent candidate where justified
→ normal Delivery
```

Experiment significance or a favourable metric does not independently set Project Intelligence consequence class or Delivery priority.

---

## 15. Initial proof in Checkpoint 6

The first real proof uses Kakeibo's versioned Kei subsystem because it now has a concrete need for:

- active and candidate behavioural releases;
- independent model-route comparison;
- shadow execution;
- hard safety gates;
- stable user-facing assignment where used;
- predeclared primary/guardrail metrics;
- independent rollback.

Checkpoint acceptance must also include a generic fixture proving that Experiment semantics do not contain Kakeibo/Kei-specific fields.

---

## 16. Definition of Done

Experiment semantics are working when:

- Operations registers `experiment` without changing Delivery semantics;
- an Experiment references exact immutable operational exposures;
- its hypothesis, metric and decision contract is fixed before outcome analysis;
- shadow/canary/A-B/controlled-rollout modes remain distinguishable;
- raw assignment/evaluation data stays external;
- hard project constraints can be referenced without moving their ownership into Operations;
- one experiment can produce a supported Observation through existing Operations analysis;
- the Observation enters Project Intelligence through the normal Source path;
- a favourable result cannot automatically promote or mutate the candidate;
- failed experiment execution leaves existing production truth intact;
- GitHub projects Experiment state without owning it;
- a non-Kakeibo fixture proves the concept is generic.

---

## 17. Governing rule

For an Experiment ask:

> Is this durable, predeclared production-evaluation truth that future project decisions need, rather than raw experiment telemetry or product-specific release state?

If yes, it belongs in Operations.

If it describes what the candidate itself means, it remains owned by the project/Delivery.

If it describes what happened during the experiment, compress it into an Observation.

If it changes accepted project meaning or future work, route it through Project Intelligence and normal Delivery.
