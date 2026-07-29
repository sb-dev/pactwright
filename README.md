# Pactwright

A GitHub-native AI delivery workflow built on Claude Code, GitHub, and a file-based
spec graph. Human intent becomes verified, traceable change through a market of
candidate contracts, explicit human trade-off decisions, and per-lane evidence — all
recorded as nodes and edges in the repository itself.

## Status

Checkpoint 1 (delivery) is live and **running on itself**: this repository's own
changes go through the lifecycle below. The graph, its schema, the validation rules,
the CI gates and the lifecycle commands are all in-tree. Later checkpoints —
knowledge, operations, the creative and review engines, the workflow platform — are
specified, not built. See [`SPEC.md`](./SPEC.md) §4 for the build order.

## The chain

Every substantive change walks these steps. Each is a Claude Code command in
[`.claude/commands/`](./.claude/commands/), and each records what it decided:

```
/capture-intent      "<what you want, and why>"
/propose-contracts   <intent-id>       # >=2 candidates for class 2-3
/review-contracts    <intent-id>       # critics attack them; one comparison recorded
/approve-contract    <contract-id>     # the human chooses; the losers are kept
/decompose-lanes     <contract-id>     # or /write-brief for a single unlaned brief
/implement-brief     <brief-id>        # /write-tests for the verification lane
/prepare-evidence    <brief-id>
/integrate           <contract-id>     # multi-lane changes only
```

`pnpm spec:status` prints where every live intent stands and what runs next.

## Setup and more

Node 22. `pnpm install`, then `pnpm spec:validate` to check the graph and `pnpm test`
for the suite. [`SPEC.md`](./SPEC.md) is the full specification, [`CLAUDE.md`](./CLAUDE.md)
the operating rules and lifecycle, and [`CONTRIBUTING.md`](./CONTRIBUTING.md) the
contribution path — intent first, then implementation. Apache-2.0; see
[`LICENSE`](./LICENSE).
