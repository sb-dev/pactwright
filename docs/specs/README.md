# Specification index

These files define the Pactwright system. Canonical authority describes what must be built; it does not establish implementation or acceptance. See the [roadmap](../roadmap.md) for delivery progression and the [runbooks](../checkpoints/README.md) for acceptance work.

| Specification | Version | Authority and purpose |
| --- | --- | --- |
| [00 — Checkpoint step contract and delivery tasks](00-checkpoint-step-contract-and-delivery-tasks.md) | 10 | Canonical checkpoint execution contract, harness rules and T1–T9 delivery sequence. |
| [01 — Core system and lifecycle](01-pactwright-core-system-and-lifecycle.md) | 6 | Canonical Delivery Graph, Contract authority, lifecycle, validation and replay identity. |
| [02 — Distribution, Agent Packs, extensions and evaluation](02-distribution-agent-packs-extensions-and-evaluation.md) | 5 | Canonical package, adapter, skill-composition, locking, upgrade and evaluation boundaries. |
| [03 — Project Intelligence](03-project-intelligence.md) | 2 | Canonical Sources, governed Knowledge, context, coverage and derived Intent roadmap. |
| [04 — Graph Review](04-graph-review.md) | 2 | Canonical review scope, execution provenance, Findings and Project Intelligence hand-off. |
| [05 — Assets and Publication](05-assets-and-publication.md) | 2 | Canonical exact-output approval, immutable Assets and records of actual publication. |
| [06 — Operations](06-operations.md) | 2 | Canonical exposures, Deployments, Observations and governed operational feedback; read with the Experiment amendment below. |
| [07 — GitHub integration](07-github-integration.md) | 2 | Canonical workflow composition, projections, reconciliation, permissions and remote execution. |
| [08 — Open-source project organisation](08-open-source-project-organisation.md) | 2 | Canonical repository ownership, public surfaces, learning material and progressive self-hosting. |

## Adopted amendment and delegated execution plans

- [Operations Experiment semantics, v1](../research-logs/2026-09-02-pactwright-operations-experiment-semantics.md) is an **adopted amendment** used by checkpoints 6–9. It owns immutable, predeclared controlled comparisons and their Operations provenance. Experiments are optional; results do not automatically promote a candidate. Product-specific release bundles remain product-owned.
- Spec 00 §§4–5 delegates detailed harness work to the [T3.5 plan](../research-logs/2026-09-30-cp01-task-3-5-harness-production-readiness.md), [T3.6 plan](../research-logs/2026-10-07-cp01-task-3-6-evidence-backed-learning.md), [T4 proof plan](../research-logs/2026-09-29-cp01-task-4-false-completion-proof.md) and [T5 run guide](../research-logs/2026-09-29-cp01-task-5-implementation-and-acceptance.md). These define work and required evidence, not completion.

Other research logs provide rationale or historical evidence unless an owning authority explicitly adopts them. Historical implementation-baseline sections retain their context; use current source and revision-bound acceptance evidence to assess availability.

## External owners

- [Production Skills contracts](https://github.com/sb-dev/production-skills/blob/main/docs/INDEX.md) own independent domain workflows, specialist benchmarks and Production Extension Packs. Pactwright Spec 02 owns their orchestration interface.
- [Prompt Engineering architecture](https://github.com/sb-dev/prompt-engineering/blob/main/docs/architecture-and-workflow.md) owns prompt/skill releases and target-specific evidence. A direct Pactwright integration remains a proposal, not a canonical dependency.
- [Kakeibo's specification index](https://github.com/sb-dev/kakeibo/blob/main/docs/specs/README.md) owns the external acceptance product. The local [acceptance profile](../checkpoints/00-kakeibo-acceptance-profile.md) cross-checks those owners without replacing them.

If a runbook conflicts with its owning specification, correct the runbook before execution. Preserve pinned historical evidence and reviewed step hashes; changed reviewed obligations require their normal amendment and review process.
