# Pactwright roadmap

This page summarises the [canonical specifications](specs/README.md), [delivery tasks](specs/00-checkpoint-step-contract-and-delivery-tasks.md#5-delivery-tasks) and [checkpoint runbooks](checkpoints/README.md). Those sources own requirements and acceptance. This is a navigation and progress summary, not a second task tracker.

## Current position

Baseline: v2 merged to `main` in [PR #78](https://github.com/sb-dev/pactwright/pull/78), commit [`d402a88`](https://github.com/sb-dev/pactwright/commit/d402a8837a81f0b65c2366397da02e66963bf9d3), on 28 October 2026.

The tree contains the [bootstrap harness](../tools/checkpoint-harness/README.md), checkpoint contracts, hosted workflows and T3/T3.5/T3.6 implementation. It contains no root runtime source or standard Agent Pack. The [root build check](../scripts/build-root.ts) reports that boundary explicitly. Merged code and successful workspace checks do not establish checkpoint acceptance.

| Sequence | Work and evidence |
| --- | --- |
| Baseline: T1–T3.6 | Converted CP1 contracts and reviewed operational steps; bootstrap execution; hosted production readiness; evidence-backed learning. The merge links the implementation PRs. T4 must assess whether retained evidence applies to the selected revision. |
| **Next: T4** | [Audit false-completion coverage, close gaps and obtain an independent verdict](research-logs/2026-09-29-cp01-task-4-false-completion-proof.md). Require valid controls, current verification and hosted/live proof where the contract requires it. |
| T5 | After prerequisite acceptance and T4 PASS, follow the [run guide](research-logs/2026-09-29-cp01-task-5-implementation-and-acceptance.md). Start with CP01-S01, extend through the declared stage boundaries, and prove the complete CP1 exit including publication and Kakeibo acceptance. |
| T6–T8 | Use CP1 execution evidence to design Pactwright-backed run models, update their owning specifications and remaining checkpoints, then implement and accept the first successor model before adopting it. |
| T9 | Execute later checkpoints with the latest accepted model and applicable previously delivered features. Prove real mixed-skill outputs as capabilities become available. |

### Learning adoption gate

The [L4 comparison report](research-logs/2026-10-14-cp01-task-3-6-l4-comparison-report.md) records an **inconclusive** benefit result at its pinned revision. It is evidence for review, not acceptance of L4, T4 or T5. The [T5 template](../.github/checkpoint-harness/cp01-t5.yml) keeps learning disabled.

[T3.6 §4](research-logs/2026-10-07-cp01-task-3-6-evidence-backed-learning.md#4-verification-and-benefit-measurement) requires both T4 PASS and supported benefit before default T5 adoption. The report records an intention to assess learning in T5; changing the rollout rule requires an explicit amendment. Safety proof and benefit measurement remain separate.

Before a new T5 dispatch from `main`, align the template's candidate branch with the intended run source through a reviewed configuration change. The template still names `refactor/pactwright-v2`. Preserve pinned controller identities and existing saved runs; this documentation update does not migrate them.

## Product progression

Run checkpoints 1–9 in order. Each exit includes applicable self-hosting, exact release/upgrade proof, public material and external acceptance. The versions below are runbook targets, not claims of published releases.

| Checkpoint | Pactwright outcome and owning specs | Kakeibo proof | Public deliverable |
| --- | --- | --- | --- |
| [1 — Self-hosted Delivery](checkpoints/01-self-hosted-delivery.md), `0.0.2` | Core runtime, standard Agent Pack, validation, upgrades, evaluation and self-hosting. Specs 01, 02, 08. | Deterministic financial-domain foundation through a real Delivery using the published runtime. | Quick Start, Getting Started and the core Delivery example. |
| [2 — Remote Delivery](checkpoints/02-remote-delivery.md), `0.0.3` | GitHub execution, profile composition and ownership-safe reconciliation. Specs 01, 02, 07, 08. | Source-neutral ingestion and application infrastructure; CSV is the first adapter. | Website foundation, GitHub setup guide and remote Delivery example. |
| [3 — Project Intelligence](checkpoints/03-project-intelligence.md), `0.0.4` | Sources, governed Knowledge, context, coverage and one dependency-aware Intent roadmap. Specs 02, 03, 07, 08. | Seven-spec onboarding and the deterministic weekly-review preparation API. | Concepts, onboarding example and Project Understanding lesson. |
| [4 — Graph Review](checkpoints/04-graph-review.md), `0.0.5` | Reproducible review, immutable execution provenance and Findings routed through Project Intelligence. Specs 03, 04, 07, 08. | Cross-owner review, governed correction and current-state review. | Review guide, example and Academy lesson. |
| [5 — Production Skills and Assets / Publication](checkpoints/05-production-skills-and-assets-publication.md), `0.0.6` | Exact external skill/pack resolution, multi-skill Delivery, approved Assets and actual Publications. Specs 02, 05, 07, 08. | Bounded, versioned Kei foundation followed by a grounded public explanation or demonstration. | Real cross-domain output, production guide and relevant lesson. |
| [6 — Operations](checkpoints/06-operations.md), `0.0.7` | Exposures, Deployments, optional Experiments, Observations and governed correction. Specs 03, 06, 07, 08 plus the adopted Experiment amendment. | Exact Kei exposures, controlled shadow comparison and rollback proof. | Operational learning guide and example. |
| [7 — Publication feedback](checkpoints/07-publication-feedback.md), `0.0.8` | A real Publication-to-Observation-to-Knowledge loop that motivates revised Delivery and republication. Specs 03, 05, 06, 07, 08. | Observe a real publication and govern its findings; a legitimate no-change result remains valid. | Evidence-led publication revision and verifiable case. |
| [8 — Full operating surface](checkpoints/08-github-project-surface.md), `0.0.9` | Combined workflows, views, exact replay, security boundaries and safe disable/re-enable behaviour. Specs 01–08 plus the Experiment amendment. | Project accumulated delivery and operational records, including the CP6 Experiment. | End-to-end guide/example, advanced Academy workflow and ecosystem catalogue. |
| [9 — Hardened loop](checkpoints/09-hardened-closed-loop.md), `0.0.10` then `0.1.0` | Regression and failure coverage, repeated closed loops and the supported package family. Specs 01–08 plus the Experiment amendment. | Real or explicitly simulated Kei defect → permanent regression → new immutable release → governed outcome. | Public-surface audit, contribution material and Pactwright-building-Pactwright case study. |
| [Graduation — Connected banking](checkpoints/10-graduation-connected-banking.md) | Prove the accepted complete system on a materially different integration. Current Kakeibo specifications own the product behaviour. | Salt Edge Account Information behind the existing ingestion boundary, with production observation and governed feedback. | Capture acceptance findings through the existing knowledge and delivery paths. |

The [Kakeibo acceptance profile](checkpoints/00-kakeibo-acceptance-profile.md) supplies the cross-owner checks. Kakeibo's current specifications remain authoritative; copies retained in research logs are historical inputs.

## Ecosystem dependencies

### Production Skills

Formal external integration belongs to CP5. Earlier direct skills inside an Agent Pack do not establish external import support.

[Distribution §§6–9, 12 and 21–24](specs/02-distribution-agent-packs-extensions-and-evaluation.md) and the [family integration contract](https://github.com/sb-dev/production-skills/blob/main/docs/specs/04-cross-domain-orchestration-and-integration.md) require:

- composition inside one selected Agent Pack, including multiple families serving one capability;
- exact skill revisions, integration identity and selected Production Extension Packs in the resolved environment;
- distinct Pactwright Extensions and domain-owned Production Extension Packs;
- separate specialist benchmarks, Pactwright responsibility/integration checks and consuming-product QA;
- real combined deliverables, with fixtures labelled separately from production-use evidence.

Choose families against the actual Brief and their demonstrated capability. A family registry entry alone does not prove integration or specialist quality. Each family retains its workflow and benchmark ownership.

### Prompt Engineering

[Prompt Engineering](https://github.com/sb-dev/prompt-engineering) owns prompt/skill authoring, target-specific evaluations, usage history, release evidence and revalidation. Its [architecture](https://github.com/sb-dev/prompt-engineering/blob/main/docs/architecture-and-workflow.md) and [implementation notes](https://github.com/sb-dev/prompt-engineering/blob/main/docs/implementation-notes.md) define that scope and the `artifacts-<merge SHA prefix>` release convention.

**Proposed follow-on, not a checkpoint prerequisite:** prove one selected instruction in an Agent Pack. Retain its exact source/release identity and content digest, verify its actual execution target, and run Pactwright's responsibility evaluation. API evidence cannot certify behaviour in Claude Code or another native host. A usage record is not a release pass.

Assign an owning contract and acceptance case before implementing that integration. Do not introduce a new prompt registry, evaluator or release authority inside Pactwright. Further execution adapters also remain unallocated future work; they must preserve the existing semantic boundary.

## Updating this summary

Link changes in availability to the accepted revision, relevant review and execution evidence, released package identity and external receipts where required. Keep historical proof pinned; reassess affected evidence after changes. A specification, merged PR, fixture success or published artifact alone cannot prove the complete checkpoint exit.

Once Project Intelligence exists, derive current work and progress from its accepted Knowledge and delivery evidence, following [Spec 03 §§21–24](specs/03-project-intelligence.md#21-intent-roadmap). This page remains a public summary. Update the smallest set of guides, examples, Academy and website material needed by [Spec 08 §24](specs/08-open-source-project-organisation.md#24-public-product-progression).
