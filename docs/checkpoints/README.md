# Pactwright Implementation Runbooks v5

- `00-implementation-guide.md`
- `00-implementation-principles.md`
- `00-kakeibo-acceptance-profile.md`
- `01-self-hosted-delivery.md`
- `02-remote-delivery.md`
- `03-project-intelligence.md`
- `04-graph-review.md`
- `05-creative-production.md`
- `06-operations.md`
- `07-published-work-feedback.md`
- `08-github-project-surface.md`
- `09-hardened-closed-loop.md`
- `10-graduation-connected-banking.md`

## Kakeibo acceptance authority

The checkpoint sequence remains Pactwright-owned, but Kakeibo is the persistent external proving project.

`00-kakeibo-acceptance-profile.md` is the current authority for Kakeibo-specific System-Level Acceptance across Checkpoints 1–9 and Graduation. It incorporates the current seven-spec Kakeibo architecture, including the 2026-09-02 v2 Kei/runtime/engineering/open-source changes.

When an older checkpoint contains embedded `Kakeido`/August-spec wording that conflicts with the acceptance profile, the profile wins. The older wording is retained only as historical runbook context until that checkpoint is naturally rewritten; it must not override current Kakeibo semantics.

The retained August Kakeido Tech Stack snapshot is not implementation authority. Current Kakeibo architecture/data is owned by `05-system-architecture-and-data-spec.md`, and delivery/testing/operations by `06-engineering-delivery-and-operations-spec.md`.

Checkpoint 6 additionally uses the adopted Operations amendment:

- `../research-logs/2026-09-02-pactwright-operations-experiment-semantics.md`

This activates generic Operations-owned `Experiment` state for controlled production comparisons. Product-specific release artefacts such as Kakeibo `KeiRelease`, policy/persona/task contracts, model routes and benchmark datasets remain project-owned rather than becoming Pactwright node types.

## Project progression

```text
capability
→ use it on Pactwright
→ update the Project Graph
→ advance the public product
→ publish a real release
→ prove it on Kakeibo
```

From Project Intelligence onward, public content is grounded in accepted Knowledge. Public creative work cannot start until its required domains—especially identity—are sufficiently covered.

Kakeibo progression now uses:

```text
Core financial semantics
→ CSV ingestion through the general financial core
→ complete seven-spec Project Intelligence onboarding
→ cross-spec Graph Review
→ bounded/versioned Kei foundation + public trust artefact
→ controlled Kei production Experiment through Operations
→ publication feedback
→ full projected operating surface
→ hardened closed loop + production-derived regression cases
→ connected-banking graduation using Salt Edge as the current planned provider
```
