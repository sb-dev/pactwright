# Getting Started with Pactwright

## What Pactwright is

Pactwright is an AI software delivery runtime built for Claude Code. Human intent moves through an explicit lifecycle — **intent → decision → contract → brief → evidence** — recorded as nodes and edges of a file-based Delivery Graph inside your repository. The runtime owns the lifecycle: it validates the graph, decides what is permitted next, and writes every record atomically; agent packs supply the prompts and skills that do the work.

## Install and set up

> The first npm release (`0.0.1`) ships at the end of the current checkpoint.

From the root of your repository:

```bash
pnpm add -D pactwright
pnpm pactwright init
pnpm pactwright sync
```

- `pnpm add -D pactwright` installs the runtime and, through its dependency, the `@pactwright/standard` agent pack.
- `pnpm pactwright init` creates the Pactwright-owned core structure: `.pactwright/` configuration, an empty Delivery Graph under `specs/` and the empty `.claude/` adapter directories. Existing files are never overwritten.
- `pnpm pactwright sync` renders the Claude Code adapter into `.claude/`: one agent file per pack agent and one command per lifecycle stage. Repeated sync with unchanged inputs is byte-identical.

## The Delivery lifecycle

A Delivery moves through seven stages. Each stage is a generated Claude Code command; the runtime — not the prompt — decides what is permitted and refuses any record that is out of order.

1. **`/capture-intent <text>`** — records what is wanted and why as an intent node, the first node of a new lineage. Intents carry no solutions.
2. **`/propose-contracts <intent-id>`** — drafts two to four genuinely different contract alternatives for the intent. Alternatives are transient decision material; nothing is recorded.
3. **`/approve-contract <intent-id> <alternative> [notes]`** — the human gate. Your choice is recorded as a decision (proceed, reject or defer) and, on proceed, the one canonical contract it selects. The deciding human is recorded in `decided_by` as a short space-free handle (for example `human:samir`).
4. **`/write-brief <contract-id>`** — records the one focused brief that says how the contract will be implemented in this repository.
5. **`/deliver-brief <brief-id>`** — executes the brief. Repository changes stay in the working tree for your review; this stage records nothing.
6. **`/review <brief-id>`** — reviews the delivered changes against the contract and brief. Findings are reported, not recorded.
7. **`/prepare-evidence <brief-id>`** — records what was delivered and the verification that proves it. Evidence completes the lineage; the intent's derived state becomes done.

## Inspecting the graph

At any time:

```bash
pnpm pactwright validate
pnpm pactwright lifecycle status
pnpm pactwright context <intent-id>
```

- `validate` checks every node, edge and lineage and prints the deterministic graph revision.
- `lifecycle status` derives each intent's state from graph structure alone and names the next permitted stage.
- `context <intent-id>` prints the current lineage only — the high-signal context for a human or agent picking up the work. Superseded records, rejected alternatives and execution provenance are excluded.

## Try it

Follow the runnable walkthrough in [`examples/core-delivery`](../examples/core-delivery/README.md): it takes a fresh repository from `pnpm add -D pactwright` to a completed Intent → Evidence lineage.
