# Pactwright

An AI software delivery runtime built for Claude Code. Human intent moves through an explicit lifecycle — **intent → decision → contract → brief → evidence** — recorded as nodes and edges of a file-based Delivery Graph inside the repository itself. The runtime owns the lifecycle: it validates the graph, decides what is permitted next, and writes every record atomically; agent packs supply the prompts and skills that do the work.

## Quick Start

Install the runtime and choose an agent pack:

```bash
pnpm add -D pactwright
pnpm pactwright init --agent-pack @pactwright/standard
pnpm pactwright doctor
```

`init --agent-pack` is one-shot setup. It composes the same operations you can run apart:

```bash
pnpm pactwright init                                   # scaffold only
pnpm pactwright agent-pack use @pactwright/standard    # choose the pack explicitly
pnpm pactwright sync                                   # render the adapter
```

Either path resolves the same environment. A plain `init` deliberately selects **no** agent pack: it creates `.pactwright/` configuration, an empty Delivery Graph under `specs/` and the empty `.claude/` adapter directories, and tells you it is a scaffold rather than a complete execution environment. Pactwright never chooses a pack for you.

`pnpm pactwright doctor` reports the environment as healthy, warning or action required, and names the command that fixes each finding without running it.

Run one Delivery with the generated Claude Code commands, in order:

1. `/capture-intent <text>` — records the intent as the first node of a new lineage.
2. `/propose-contracts <intent-id>` — drafts transient contract alternatives for the decision; nothing is recorded.
3. `/approve-contract <intent-id> <alternative> [notes]` — records your decision and, on proceed, the one canonical contract it selects.
4. `/write-brief <contract-id>` — records the focused brief that implements the contract.
5. `/deliver-brief <brief-id>` — executes the brief against the repository; changes stay in the working tree for review. It records **no** graph node, only what it delivered.
6. `/review <brief-id>` — reviews the delivered changes against the contract and brief and records its verdict. A Review never creates Evidence.
7. `/prepare-evidence <brief-id>` — records what was delivered and the verification that proves it, completing the lineage.

Steps 5 and 6 are where the runtime, not the agent, decides what happens next. A Review that asks for correction routes back to Delivery along a route the lifecycle *declares*, bounded by policy; an agent cannot invent one. And Evidence is refused until the latest delivered state has actually been reviewed and that Review passed — so a lineage cannot be closed on work nobody checked.

Inspect the graph at any time:

```bash
pnpm pactwright validate
pnpm pactwright lifecycle status
```

- `validate` checks the complete validation contract and prints the three replay identities: repository revision, Project Graph revision and environment lock hash.
- `lifecycle status` derives each intent's state, what is completed, which shape step a Delivery is at, and what it is waiting for.

Learn more: the [Getting Started guide](docs/getting-started.md) and the [runnable core Delivery example](examples/core-delivery/README.md).

## Packages

This repository is a pnpm workspace with two published packages:

- `pactwright` (repository root) — the runtime and CLI.
- `@pactwright/standard` (`packages/standard/`) — the default agent pack. It provides the three core Delivery capabilities (`delivery-specification`, `delivery-execution`, `delivery-review`). `pactwright` depends on it, so one `pnpm add -D pactwright` installs both — but installing a pack is not selecting one: you choose it explicitly with `agent-pack use` or `init --agent-pack`.

## What the runtime provides

- **Initialiser** — `pactwright init [--agent-pack <source>] [--with <extension>]`: creates the Pactwright-owned core structure in a clean repository; existing files are never overwritten. Without an explicit pack it stops at a scaffold. With one, it composes the same selection, extension installation and sync you would run separately.
- **Delivery Graph** — canonical records (`specs/nodes/*.md`, `specs/graph/edges.yml`) with schema validation, typed-edge rules, lineage derivation and a deterministic revision hash.
- **Lifecycle** — three separate things, deliberately. Contract authority (who may decide) lives in `lifecycle.yml` policy; the fulfilment *shape* (`Brief → Delivery → Review → Evidence`) owns topology, gates, declared corrective routes and bounded iteration; fine-grained progress is execution state under `.pactwright/execution/`, which is not graph truth and never moves the Project Graph revision.
- **Lifecycle engine** — `pactwright lifecycle status|next|run|record`: `status` and `next` are read-only; `run` executes automatic actions until a gate, completion, a block or a failure, and can neither skip a gate nor invent a transition.
- **Validation** — `pactwright validate`: the complete minimum detection contract, seventeen numbered rules covering malformed records, invalid relationships and lineage, illegal supersession, shape and transition validity, unauthorised Decisions and Gate progression, unbounded corrective loops, extension state redefining core semantics, Evidence before a successful closing Review, and — on request — replay provenance.
- **Diagnostics** — `pactwright doctor`: read-only health of the distribution and execution environment, reported as healthy, warning or action required with the deterministic remediation named and never run.
- **Runtime upgrade** — `pactwright upgrade [--to <version>]`: detects the project package manager, delegates package replacement to it, then re-enters through the newly installed runtime to migrate, re-lock, sync and validate. It upgrades the runtime only; pack and extension identities stay put.
- **Agent Pack selection** — `pactwright agent-pack use <source>` and `agent-pack upgrade`: explicit selection and constrained upgrade. A rejected pack leaves the previous configuration, lock and generated environment exactly as they were.
- **Claude Code adapter** — renders one agent file per pack agent and one file per canonical command into `.claude/`, deterministically from the locked pack.
- **Sync** — `pactwright sync`: loads config, lock and extensions, validates the required capability union, and renders only the Pactwright-managed `.claude/` surface. Repeated sync with unchanged inputs is byte-identical. Ownership is proved per file by the generated banner standing in its rendered position, never by location, so a hand-written file inside `.claude/agents/` or `.claude/commands/` is never overwritten or removed — it is reported instead, even if it quotes the banner in its prose.
- **Evaluation runner** — `pactwright eval`: runs an agent pack against scripted delivery cases in throw-away sandboxes, covering contract fidelity, scope discipline, brief quality, review quality, evidence accuracy and lifecycle compliance. Failures are data in the report, and the exit code gates on deterministic assertions only.
- **Baseline comparison** — `pactwright eval --baseline <pack> --candidate <pack>`: reports regressions per capability, agent and case, plus what changed about the environment itself. No aggregate score is computed, because no single number should decide a release.
- **Pack resolution and locking** — resolves the configured agent pack, checks capabilities and version compatibility, and pins exact content hashes in `.pactwright/lock.yml`.
- **Extension model** — `pactwright extension add|remove|upgrade`: package-backed extensions with versioned manifests, dependency-first installation delegated to the project package manager, capability-union validation, command namespaces and extension-owned graph types. Removal is blocked while enabled dependants exist and always preserves canonical extension data.

## How to contribute

Intent first, then implementation. See `CONTRIBUTING.md` in the repository.

## License

Apache-2.0. See `LICENSE`.
