# Getting Started with Pactwright

## What Pactwright is

Pactwright is an AI software delivery runtime built for Claude Code. Human intent moves through an explicit lifecycle — **intent → decision → contract → brief → evidence** — recorded as nodes and edges of a file-based Delivery Graph inside your repository. The runtime owns the lifecycle: it validates the graph, decides what is permitted next, and writes every record atomically; agent packs supply the prompts and skills that do the work.

## Install and set up

From the root of your repository:

```bash
pnpm add -D pactwright
pnpm pactwright init --agent-pack @pactwright/standard
pnpm pactwright doctor
```

- `pnpm add -D pactwright` installs the runtime and, through its dependency, the `@pactwright/standard` agent pack. Installing a pack is not selecting one.
- `pnpm pactwright init --agent-pack <source>` creates the Pactwright-owned core structure — `.pactwright/` configuration, an empty Delivery Graph under `specs/`, the `.claude/` adapter directories — selects the pack you named, locks the exact environment and renders the adapter. Existing files are never overwritten.
- `pnpm pactwright doctor` confirms the result: package manager, configuration, runtime, capabilities, lock agreement, generated integration and validation.

### Setting up in steps instead

One-shot setup composes operations you can also run apart, and both paths resolve the same environment:

```bash
pnpm pactwright init                                 # scaffold only, no pack chosen
pnpm pactwright agent-pack use @pactwright/standard  # choose the pack explicitly
pnpm pactwright sync                                 # render the adapter
```

A plain `init` stops at a scaffold on purpose. Pactwright will not choose an agent pack for you, so until you name one the project is not a complete execution environment — and it says so rather than pretending otherwise.

Repeated `sync` with unchanged inputs is byte-identical, so running it again is always safe.

## The Delivery lifecycle

A Delivery is driven by seven generated Claude Code commands. The runtime — not the prompt — decides what is permitted and refuses any record that is out of order.

The commands are not the lifecycle's shape. The first four craft the Contract and sit upstream of the Brief; from the Brief onwards a *fulfilment shape* takes over — `Brief → Delivery → Review → Evidence` — which owns the topology, its gates and its declared routes.

1. **`/capture-intent <text>`** — records what is wanted and why as an intent node, the first node of a new lineage. Intents carry no solutions.
2. **`/propose-contracts <intent-id>`** — drafts two to four genuinely different contract alternatives for the intent. Alternatives are transient decision material; nothing is recorded.
3. **`/approve-contract <intent-id> <alternative> [notes]`** — the human gate. Your choice is recorded as a decision (proceed, reject or defer) and, on proceed, the one canonical contract it selects. The deciding human is recorded in `decided_by` as a short space-free handle (for example `human:samir`).
4. **`/write-brief <contract-id>`** — records the one focused brief that says how the contract will be implemented in this repository.
5. **`/deliver-brief <brief-id>`** — executes the brief. Repository changes stay in the working tree for your review. It writes no graph record; it reports the state it produced so the runtime knows what was delivered.
6. **`/review <brief-id>`** — reviews the delivered changes against the contract and brief and reports its verdict. A Review never creates Evidence.
7. **`/prepare-evidence <brief-id>`** — records what was delivered and the verification that proves it. Evidence completes the lineage; the intent's derived state becomes done.

### What the runtime will not let you skip

Evidence is refused unless all five closure conditions hold: the Brief is current, the latest delivered state has been reviewed, that Review permits closure, no required gate is unresolved, and the Contract and Brief lineage is valid. So a lineage cannot be closed on work nobody checked — and if you deliver again *after* a Review, that Review no longer counts and the new state has to be reviewed.

When a Review asks for correction, the runtime routes back to Delivery along a route the shape declares, and policy bounds how many times that can happen before a human has to step in. An agent cannot invent a route or loop indefinitely.

## Inspecting the graph

At any time:

```bash
pnpm pactwright validate
pnpm pactwright lifecycle status
pnpm pactwright doctor
```

- `validate` checks the complete validation contract — seventeen numbered rules — and prints the three identities a replay is pinned to: repository revision, Project Graph revision and environment lock hash.
- `lifecycle status` derives each intent's state, what is completed, which shape step a Delivery is at, and what it is waiting for. It is read-only.
- `doctor` diagnoses the environment rather than the graph, and names the command that fixes each finding without running it.

## Keeping the environment current

```bash
pnpm pactwright upgrade              # latest compatible runtime
pnpm pactwright upgrade --to 0.0.2   # an exact release, forward or back
pnpm pactwright agent-pack upgrade   # the selected pack, within its constraint
```

`upgrade` upgrades the runtime and nothing else: your agent pack and extensions keep the identities you chose. It detects your package manager, hands the package replacement to it, and then re-enters through the newly installed runtime to migrate, re-lock, sync and validate. If any of that cannot complete, the previous environment is restored.

## Try it

Follow the runnable walkthrough in [`examples/core-delivery`](../examples/core-delivery/README.md): it takes a fresh repository from `pnpm add -D pactwright` to a completed Intent → Evidence lineage.
