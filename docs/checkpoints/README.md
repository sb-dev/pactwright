# Pactwright Implementation Runbooks v7

Canonical Pactwright semantics live in the Pactwright specifications under `../specs/01–08`. The checkpoint runbooks are the executable implementation sequence used to reach and prove that canonical system through progressive self-hosting, proving each released capability on Pactwright itself and on Kakeibo as the persistent external acceptance project.

## Runbook sequence

- `00-implementation-guide.md`
- `00-implementation-principles.md`
- `00-kakeibo-acceptance-profile.md`
- `01-self-hosted-delivery.md`
- `02-remote-delivery.md`
- `03-project-intelligence.md`
- `04-graph-review.md`
- `05-production-skills-and-assets-publication.md`
- `06-operations.md`
- `07-publication-feedback.md`
- `08-github-project-surface.md`
- `09-hardened-closed-loop.md`
- `10-graduation-connected-banking.md`

Run Checkpoints 1–9 in order. Graduation follows only after the hardened closed loop is accepted.

## Authority model

The runbooks define execution order and acceptance work. They do not replace the owning Pactwright or Kakeibo specifications.

Pactwright semantics are owned by the canonical Pactwright specifications in this repository:

```text
../specs/01-pactwright-core-system-and-lifecycle.md
../specs/02-distribution-agent-packs-extensions-and-evaluation.md
../specs/03-project-intelligence.md
../specs/04-graph-review.md
../specs/05-assets-and-publication.md
../specs/06-operations.md
../specs/07-github-integration.md
../specs/08-open-source-project-organisation.md
```

Kakeibo semantics are owned by the current canonical specification set in the **Kakeibo repository**, addressed at execution time by its own `docs/specs/` paths and authority map:

```text
docs/specs/README.md
docs/specs/01-product-and-ux-spec.md
docs/specs/02-financial-domain-model-spec.md
docs/specs/03-kei-assistant-spec.md
docs/specs/04-mobile-design-system-spec.md
docs/specs/05-system-architecture-and-data-spec.md
docs/specs/06-engineering-delivery-and-operations-spec.md
docs/specs/07-open-source-project-organisation-spec.md
```

Those paths resolve in the Kakeibo repository, not in this one. Where a runbook cites `Spec 01`–`Spec 08` without qualification it means the Pactwright specifications listed above.

`00-kakeibo-acceptance-profile.md` defines the cross-checks that must hold when the Kakeibo owner specifications are exercised through Checkpoints 1–9 and Graduation. It is an acceptance profile, not a replacement product specification.

The numbered checkpoint runbooks are aligned to this current authority set. Research logs are rationale and historical design context only. Retained August Kakeido research snapshots are historical research inputs and are not implementation authority.

If a checkpoint conflicts with a canonical Pactwright specification, the canonical specification wins and the checkpoint must be corrected before implementation continues.

## Operations Experiment authority

Checkpoints 6–9 additionally use the adopted Operations amendment:

- `../research-logs/2026-09-02-pactwright-operations-experiment-semantics.md`

It activates the generic Operations-owned `Experiment` concept for controlled production comparisons:

```text
Delivery Evidence
→ exact operational exposures
→ Experiment
→ bounded external evidence
→ Observation
→ Project Intelligence
→ normal Delivery governance
```

`Experiment` is optional controlled-evaluation state, not a mandatory Deployment or rollout stage.

Operations owns the generic Experiment contract and its graph/provenance semantics. Product-specific release artefacts remain project-owned. For Kakeibo this includes:

```text
KeiRelease
Kei policy
Kei persona
Kei task contracts
model routes
benchmark suites / datasets
```

These do not become Pactwright graph node types merely because an Experiment compares exposures containing them.

## Project progression

Each checkpoint follows the same progressive self-hosting pattern:

```text
build capability
→ use it on Pactwright
→ update governed project state
→ advance the public product where appropriate
→ publish the installable checkpoint release
→ install and prove it on Kakeibo
→ capture implementation/acceptance findings through Project Intelligence
```

Before Project Intelligence exists, authorised Decisions and Contracts provide bounded authority for project truth required by the work being delivered.

Once Project Intelligence exists, applicable project truth is grounded in accepted Knowledge, and public/outbound work follows the readiness rules owned by the canonical Project Intelligence and Open-Source Project Organisation specifications. Public production work requires the relevant knowledge domains to be sufficiently covered before generation and approval.

## Kakeibo proving progression

```text
Checkpoint 1
→ deterministic financial-domain foundation

Checkpoint 2
→ source-neutral ingestion architecture with CSV as the first adapter

Checkpoint 3
→ complete seven-spec Project Intelligence onboarding

Checkpoint 4
→ cross-owner Graph Review

Checkpoint 5
→ bounded/versioned Kei foundation + grounded public trust artefact

Checkpoint 6
→ production learning + controlled Kei Experiment

Checkpoint 7
→ Publication → Operations → PI feedback with analytics/privacy boundaries

Checkpoint 8
→ complete GitHub operating surface including Experiments projection

Checkpoint 9
→ permanent regression coverage + production Kei defect learning loop

Graduation
→ connected banking through the existing ingestion abstraction, with Salt Edge Account Information as the current planned first provider
```

Connected banking is deliberately Graduation work. The earlier checkpoints prove the financial core, review model, Kei lifecycle, Operations feedback and Pactwright architecture without depending on a bank-data provider.

## Non-negotiable boundaries

Across the runbooks:

- repository graph/spec state remains canonical; GitHub Projects, checks and views are derived projections;
- Review findings, model outputs, operational evidence and analytics do not silently become project truth;
- Operations may observe sibling exposures such as Publication but does not take ownership of them;
- favourable Experiment evidence never auto-promotes a candidate;
- approved Assets, Publications, Deployments, Experiments and Observations remain immutable according to their owning semantics;
- raw production analytics, experiment samples, financial grounding, prompts and responses remain outside Pactwright graph state;
- Kakeibo financial truth, review truth, audit history, analytics and operational telemetry retain their distinct ownership boundaries;
- project-specific concepts are generalised into Pactwright only after repeatable cross-domain evidence justifies the abstraction.
