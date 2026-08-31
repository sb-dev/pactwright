# Pactwright

An AI software delivery runtime built for Claude Code. Human intent moves through an explicit lifecycle — **intent → decision → contract → brief → evidence** — recorded as nodes and edges of a file-based Delivery Graph inside the repository itself. The runtime owns the lifecycle: it validates the graph, decides what is permitted next, and writes every record atomically; agent packs supply the prompts and skills that do the work.

## Quick Start

> The first npm release (`0.0.1`) ships at the end of the current checkpoint.

Install the runtime and generate the project integration:

```bash
pnpm add -D pactwright
pnpm pactwright init
pnpm pactwright sync
```

- `pnpm pactwright init` creates the Pactwright-owned core structure: `.pactwright/` configuration, an empty Delivery Graph under `specs/` and the empty `.claude/` adapter directories.
- `pnpm pactwright sync` renders the Claude Code adapter into `.claude/`: one agent file per pack agent and one command per lifecycle stage.

Run one Delivery with the generated Claude Code commands, in order:

1. `/capture-intent <text>` — records the intent as the first node of a new lineage.
2. `/propose-contracts <intent-id>` — drafts transient contract alternatives for the decision; nothing is recorded.
3. `/approve-contract <intent-id> <alternative> [notes]` — records your decision and, on proceed, the one canonical contract it selects.
4. `/write-brief <contract-id>` — records the focused brief that implements the contract.
5. `/deliver-brief <brief-id>` — executes the brief against the repository; changes stay in the working tree for review.
6. `/review <brief-id>` — reviews the delivered changes against the contract and brief; findings are reported, not recorded.
7. `/prepare-evidence <brief-id>` — records what was delivered and the verification that proves it, completing the lineage.

Inspect the graph at any time:

```bash
pnpm pactwright validate
pnpm pactwright lifecycle status
pnpm pactwright context <intent-id>
```

- `validate` checks every node, edge and lineage and prints the graph revision.
- `lifecycle status` derives each intent's state and the next permitted stage.
- `context <intent-id>` prints the current lineage only — the high-signal context for a human or agent picking up the work.

## Packages

This repository is a pnpm workspace with two published packages:

- `pactwright` (repository root) — the runtime and CLI.
- `@pactwright/standard` (`packages/standard/`) — the default agent pack. It provides the three core Delivery capabilities (`delivery-specification`, `delivery-execution`, `delivery-review`). `pactwright` depends on it, so one `pnpm add -D pactwright` installs both; `.pactwright/config.yml` selects it by default.

## What the runtime provides

- **Initialiser** — `pactwright init`: creates the Pactwright-owned core structure in a clean repository (`.pactwright/` configuration, an empty Delivery Graph under `specs/`, the empty `.claude/` adapter directories) and resolves the lock; existing files are never overwritten.
- **Delivery Graph** — canonical records (`specs/nodes/*.md`, `specs/graph/edges.yml`) with schema validation, typed-edge rules, lineage derivation and a deterministic revision hash.
- **Lifecycle engine** — `pactwright lifecycle status|next|run|record`: derives each intent's state from graph structure alone and refuses out-of-order records at the runtime, regardless of executor behaviour.
- **Claude Code adapter** — renders one agent file per pack agent and one command per lifecycle stage into `.claude/`, deterministically from the locked pack.
- **Sync** — `pactwright sync`: loads config, lock and extensions, validates the required capability union, and renders only the Pactwright-managed `.claude/` surface. Repeated sync with unchanged inputs is byte-identical. Ownership is proved per file by the generated banner standing in its rendered position, never by location, so a hand-written file inside `.claude/agents/` or `.claude/commands/` is never overwritten or removed — it is reported instead, even if it quotes the banner in its prose.
- **Evaluation runner** — `pactwright eval`: runs an agent pack against scripted delivery cases in throw-away sandboxes; failures are data in the report, and the exit code gates on deterministic assertions only.
- **Pack resolution and locking** — resolves the configured agent pack, checks capabilities and version compatibility, and pins exact content hashes in `.pactwright/lock.yml`.
- **Extension model** — `pactwright extension add|remove|upgrade`: package-backed extensions with versioned manifests, dependency resolution, capability-union validation, command namespaces and extension-owned graph types. Removal is blocked while enabled dependants exist and always preserves canonical extension data.

## How to contribute

Intent first, then implementation. See `CONTRIBUTING.md` in the repository.

## License

Apache-2.0. See `LICENSE`.
