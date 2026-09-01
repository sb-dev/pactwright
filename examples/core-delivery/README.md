# Example: one complete core Delivery

This walkthrough takes a fresh repository from installing Pactwright to a completed Intent → Evidence lineage. Every command below is part of the proven core Delivery surface; run them in order.

## 1. Create a repository and install Pactwright

> The first npm release (`0.0.1`) ships at the end of the current checkpoint.

```bash
mkdir my-project && cd my-project
git init
pnpm init
pnpm add -D pactwright
pnpm pactwright init
pnpm pactwright sync
```

`init` creates `.pactwright/`, an empty Delivery Graph under `specs/` and the `.claude/` adapter directories; `sync` renders the agents and the seven lifecycle commands into `.claude/`.

Confirm the empty graph is valid:

```bash
pnpm pactwright validate
pnpm pactwright lifecycle status
```

`validate` reports 0 nodes and a graph revision; `lifecycle status` reports no active lineage, blocked at `capture-intent` (required actor: human).

## 2. Deliver one small artefact

Open the repository in Claude Code and run the generated commands in order. The artefact here is deliberately tiny — a one-line `proof.mjs` — because the point is the lifecycle.

```text
/capture-intent "Create one small repository artefact that proves the complete Pactwright Delivery lifecycle."
```

The runtime records the intent and prints its id (`intent-...`). Use that id next:

```text
/propose-contracts <intent-id>
```

You get two to four labelled contract alternatives — for example a runnable script checked by running it, or a document checked by grep. Alternatives are transient; nothing is recorded. Choose one:

```text
/approve-contract <intent-id> <alternative> "why you chose it"
```

The runtime records your decision and the one canonical contract (`contract-...`). Continue through the remaining stages, each time using the id the previous stage printed:

```text
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

- `write-brief` records how the contract will be implemented (`brief-...`).
- `deliver-brief` creates `proof.mjs` in your working tree and runs the verification the brief names (for a script: `node proof.mjs` prints its expected line and exits 0). Nothing is recorded; the change is yours to review.
- `review` reports findings against the contract and brief; for this artefact there should be none.
- `prepare-evidence` records the delivery and verification facts, completing the lineage.

## 3. Inspect the finished lineage

```bash
pnpm pactwright validate
pnpm pactwright lifecycle status
pnpm pactwright context <intent-id>
```

Expected: `validate` reports 5 nodes, 4 edges and 1 lineage as valid; `lifecycle status` shows the intent with `state: done` and all seven stages completed; `context` prints the full current lineage — intent, decision, contract, brief and evidence — and nothing else.

That is one complete core Delivery. From here, every further change to the repository can start with a new `/capture-intent`.
