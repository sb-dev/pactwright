# Example: one complete core Delivery

This walkthrough describes the specified Checkpoint 1 runtime interaction, from installation to a completed Intent → Evidence lineage. It is an acceptance walkthrough, not an executed result for the current checkout.

The merged v2 checkout contains the bootstrap harness and has no root runtime source or `@pactwright/standard` package. Use the [current checkout instructions](../../README.md#work-with-the-current-checkout) for executable entry points. Run the sequence below only with the exact Checkpoint 1 release whose clean-consumer and external acceptance evidence you are verifying; the planned corrective target is `0.0.2`. See [Checkpoint 1](../../docs/checkpoints/01-self-hosted-delivery.md) for the release and acceptance gates.

All results below are expected outcomes to verify against [Core](../../docs/specs/01-pactwright-core-system-and-lifecycle.md) and [Distribution](../../docs/specs/02-distribution-agent-packs-extensions-and-evaluation.md), not proof that those outcomes have occurred.

## 1. Create a repository and install Pactwright

```bash
mkdir my-project && cd my-project
git init
pnpm init
pnpm add -D pactwright@0.0.2
pnpm pactwright init --agent-pack @pactwright/standard
```

`init --agent-pack` creates `.pactwright/`, an empty Delivery Graph under `specs/` and the `.claude/` adapter directories, selects the pack you named, locks the exact environment and renders the agents and the seven canonical commands into `.claude/`.

It is one-shot setup for the same operations you can run apart — `pactwright init`, then `pactwright agent-pack use @pactwright/standard`, then `pactwright sync`. Both paths resolve the same configuration, the same lock and the same generated files. A plain `init` with no pack named stops at a scaffold: Pactwright does not choose an agent pack for you.

Confirm the environment and the empty graph:

```bash
pnpm pactwright doctor
pnpm pactwright validate
pnpm pactwright lifecycle status
```

`doctor` reports `healthy` with no action required. `validate` reports 0 nodes along with the repository revision, Project Graph revision and environment lock hash. `lifecycle status` reports no active lineage, blocked at `capture-intent` (required actor: human).

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

The runtime records your decision and the one canonical contract (`contract-...`). Continue, each time using the id the previous command printed:

```text
/write-brief <contract-id>
/deliver-brief <brief-id>
/review <brief-id>
/prepare-evidence <brief-id>
```

- `write-brief` records how the contract will be implemented (`brief-...`). From here the fulfilment shape governs: `Brief → Delivery → Review → Evidence`.
- `deliver-brief` creates `proof.mjs` in your working tree and runs the verification the brief names (for a script: `node proof.mjs` prints its expected line and exits 0). No graph record is written; the change is yours to review. It reports the state it produced, so the runtime knows what was delivered.
- `review` reports findings against the contract and brief and records its verdict. For this artefact there should be no findings.
- `prepare-evidence` records the delivery and verification facts, completing the lineage.

### Try skipping a step

Run `/prepare-evidence <brief-id>` straight after `/write-brief`, before delivering or reviewing anything. The runtime refuses it:

```text
prepare-evidence is not a permitted action for intent "intent-..." now:
shape step "delivery" runs automatic
```

That is the closure guard, not a lint. Evidence needs the latest delivered state to have been reviewed and that Review to have passed. Deliver again *after* a Review and the same refusal comes back, because the Review no longer describes what is there.

If a Review asks for correction rather than passing, the runtime routes back to Delivery along a route the lifecycle declares, and policy bounds how many times that can happen before a human has to step in.

## 3. Inspect the finished lineage

```bash
pnpm pactwright validate
pnpm pactwright lifecycle status
pnpm pactwright context <intent-id>
```

Expected: `validate` reports 5 nodes, 4 edges and 1 lineage as valid; `lifecycle status` shows the intent with `state: done`, every responsibility completed and no next action; `context` prints the full current lineage — intent, decision, contract, brief and evidence — and nothing else.

Acceptance requires the actual command results and current review evidence for this lineage. Once verified, further governed changes can start with a new `/capture-intent`.
