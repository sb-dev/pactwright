# Pactwright — Implementation Guide

**Version:** 6 
**Status:** Checkpoint index and execution standard

## Purpose

The implementation programme is split into executable checkpoint runbooks. Each runbook uses the same **Step → References → Run → Expected result → Verify** structure. No implementation stage is complete unless every implementation item is attached to an executable prompt or command.

## Standard runbook format

```text
Checkpoint
 Stage
 Step
 References
 Run — prompt or command
 Expected result
 Verify before continuing
```

Run blocks contain either a prompt or a command. Deterministic Pactwright operations use:

```bash
pnpm pactwright <command>
```

After Checkpoint 1 generates the adapter, Delivery responsibilities use the generated slash commands rather than ad-hoc prompts.

## Execution order

1. [01-self-hosted-delivery.md](01-self-hosted-delivery.md) — Pactwright installs into itself and Kakeido and completes Intent → Evidence without manual graph-coherence work.
2. [02-remote-delivery.md](02-remote-delivery.md) — Pactwright and Kakeido can execute/project Delivery through GitHub while repository graph state remains canonical.
3. [03-project-intelligence.md](03-project-intelligence.md) — Project Intelligence can cold-start both projects, govern knowledge, supply bounded Delivery context and derive one intent roadmap.
4. [04-graph-review.md](04-graph-review.md) — Pactwright can run reproducible specialist Graph Reviews over the registered Project Graph and route findings through PI.
5. [05-creative-production.md](05-creative-production.md) — Grounded creative Delivery can produce a human-approved immutable Asset and Publication in Pactwright and Kakeido.
6. [06-operations.md](06-operations.md) — Software production exposure and durable operational findings feed governed future work through Operations → PI → Delivery.
7. [07-published-work-feedback.md](07-published-work-feedback.md) — Operations can observe Review & Creative Publications through manifest-driven exposure compatibility without ownership transfer or sibling dependency.
8. [08-github-project-surface.md](08-github-project-surface.md) — One shared GitHub Project and generated workflow surface project the complete enabled Pactwright system in both projects.
9. [09-hardened-closed-loop.md](09-hardened-closed-loop.md) — The complete first-party system is evaluated, failure-hardened, documented and repeatedly proven in closed loops on Pactwright and Kakeido.
Graduation. [10-graduation-truelayer.md](10-graduation-truelayer.md) — TrueLayer is added as a second financial-data source without semantic drift and the new integration is observed in production.

## Transition rule

A checkpoint is accepted only after:

```text
implementation steps verified
→ capability adopted in Pactwright
→ real Pactwright work delivered with it
→ same checkpoint release installed in Kakeido
→ Kakeido System-Level Acceptance passed
→ blocking feedback captured
```

Do not carry a known blocking failure into the next checkpoint.

---

**Pactwright — Implementation Guide v6**
