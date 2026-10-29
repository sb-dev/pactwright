# Pactwright

Pactwright turns project intent into explicit, authorised Contracts and governs their fulfilment by humans and AI agents. Its repository-native Project Graph connects delivery evidence, project knowledge, specialist review, approved outputs and operational feedback. Agent Packs combine specialised Production Skills for software, research, design and creative work.

## Design

The Contract defines the authorised outcome and what must be true for acceptance:

**Intent → transient Contract alternatives → Decision → Contract → Brief → Delivery → Review → Evidence**

For example, a request to explain a product becomes a Contract defining the audience, supported claims and acceptance checks. A selected Agent Pack combines research, writing or visual skills to fulfil the Brief. Review checks the result against the Contract. Evidence records the verified delivery. If the output needs durable public identity, a human approves its exact content as an Asset; an actual release is then recorded as a Publication. Operational feedback can motivate another governed Delivery.

| Capability | Design and authority |
| --- | --- |
| [Contract-driven Delivery](docs/specs/01-pactwright-core-system-and-lifecycle.md) | The runtime owns authorised graph mutations, lifecycle gates, correction routes and Evidence closure. Canonical records live in the repository; execution state stays separate. |
| [Agent Packs and adapters](docs/specs/02-distribution-agent-packs-extensions-and-evaluation.md) | One selected pack supplies agents and skills for Pactwright responsibilities. Exact dependency identities make the environment reproducible. Claude Code is the initial adapter over provider-independent semantics. |
| [Project Intelligence](docs/specs/03-project-intelligence.md) | Sources become accepted Knowledge through governance. Knowledge supplies bounded context and one derived Intent roadmap. |
| [Graph Review](docs/specs/04-graph-review.md) | Reproducible specialist reviews produce Findings. Findings enter Project Intelligence before they can motivate new work. |
| [Assets / Publication](docs/specs/05-assets-and-publication.md) | Delivery Evidence, human approval of exact output and actual publication remain separate events. |
| [Operations](docs/specs/06-operations.md) | Deployments and Observations connect real-world outcomes to governed learning. The adopted [Experiment amendment](docs/research-logs/2026-09-02-pactwright-operations-experiment-semantics.md) adds optional controlled comparisons without automatic promotion. |
| [GitHub integration](docs/specs/07-github-integration.md) | Workflows, checks, Issues and Projects execute or project repository-owned state. They do not become a second authority. |

The [specification index](docs/specs/README.md) identifies each owner and the adopted amendments. Software and creative production use normal Delivery plus relevant skills; there is no separate Creative Delivery lifecycle.

### Ecosystem

- **[Production Skills](https://github.com/sb-dev/production-skills):** independent domain workflows, specialist knowledge, Extension Packs and benchmarks. Agent Packs compose them. Pactwright owns selection, resolution and locking; each family owns specialist quality and remains usable on its own.
- **[Prompt Engineering](https://github.com/sb-dev/prompt-engineering):** prompt and skill source, target-specific evaluations, versioned releases, usage history and revalidation. It is a potential source of evaluated instructions, not a currently specified Pactwright integration. Adoption must retain exact content identity and pass Pactwright's own responsibility checks.
- **[Kakeibo](https://github.com/sb-dev/kakeibo):** the persistent external acceptance project. Its specifications own product behaviour; Pactwright's runbooks define the work used to prove each released capability.

## Roadmap

The [roadmap](docs/roadmap.md) connects the full design to implementation tasks, checkpoint exits and public learning material.

- **Now:** the merged v2 source contains the bootstrap checkpoint harness. The next gate is T4's independent false-completion proof against the applicable T3/T3.5/T3.6 evidence.
- **Next:** T5 builds and accepts the Checkpoint 1 runtime, proves self-hosted Delivery and installs the published release in Kakeibo.
- **Later:** remote Delivery, Project Intelligence, Graph Review, external Production Skills, Assets / Publication, Operations, publication feedback and the hardened operating loop. Graduation proves connected banking in Kakeibo.

The overview describes the specified system. This checkout contains the harness, not the Checkpoint 1 runtime or `@pactwright/standard` package. Runtime installation and clean-consumer proof belong to Checkpoint 1. Further adapters remain a future direction without an assigned checkpoint.

## Stack

| Responsibility | Technology |
| --- | --- |
| Runtime and harness implementation | TypeScript and Node.js; the root package supports Node.js 22 or 24. |
| Workspace and verification | pnpm, Turborepo, TypeScript, ESLint, Prettier and Node's test runner. |
| Repository records and contracts | Git, Markdown, YAML and JSON; checkpoint contracts use JSON Schema. |
| Hosted harness execution | GitHub Actions, durable run artifacts and isolated Docker workspaces. |
| Current harness agent execution | Claude Agent SDK, with separate producer and reviewer sessions. This is the bootstrap execution adapter, not the product's semantic boundary. |

## Quick Start

Checkpoint 1 delivers runtime installation and the first accepted Delivery. Follow its [release and acceptance gates](docs/checkpoints/01-self-hosted-delivery.md) before using the runtime walkthrough.

### Work with the current checkout

Use the pnpm version declared in `package.json`. From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm contracts:check
pnpm verify
pnpm --filter @pactwright/checkpoint-harness harness --help
```

`contracts:check` validates checkpoint definitions and their source references. Use a full Git checkout to check historical crosswalk sources. `verify` runs the workspace checks; the root build explicitly reports when no runtime source exists.

For hosted execution, approvals, recovery and PR correction rounds, follow the [harness operator procedure](tools/checkpoint-harness/README.md) and its linked T5 prerequisites.

## Examples

The [core Delivery walkthrough](examples/core-delivery/README.md) describes the intended Checkpoint 1 runtime interaction and acceptance checks. It is a planned walkthrough, not an executed result for this checkout.

Explore the [documentation index](docs/README.md), [checkpoint runbooks](docs/checkpoints/README.md) and [contribution guide](CONTRIBUTING.md). Guides, examples and Academy material advance with their owning checkpoints.

## Contributing and licence

See [CONTRIBUTING.md](CONTRIBUTING.md), the [Code of Conduct](CODE_OF_CONDUCT.md) and [security policy](SECURITY.md). Pactwright is licensed under [Apache-2.0](LICENSE).
