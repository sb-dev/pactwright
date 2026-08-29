# Pactwright

An AI software delivery runtime built for Claude Code. Human intent moves through an explicit lifecycle — **intent → decision → contract → brief → evidence** — recorded as nodes and edges of a file-based Delivery Graph inside the repository itself. The runtime owns the lifecycle: it validates the graph, decides what is permitted next, and writes every record atomically; agent packs supply the prompts and skills that do the work.

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
