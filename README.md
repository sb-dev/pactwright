# Pactwright

A GitHub-native AI software delivery workflow built on Claude Code, GitHub, and a file-based spec graph. Human intent is transformed into verified, traceable, production-aware change through a market of candidate contracts, candidate patches, and explicit human trade-off decisions — all recorded as nodes and edges in the repository itself.

## Status

**Bootstrap in progress.** `main` currently holds the licence and governance scaffold only. The spec graph, schema, and Claude Code operating instructions land via the open bootstrap PR: [#1 Bootstrap GH AI-native delivery system](https://github.com/sb-dev/pactwright/pull/1). See [`SPEC.md`](./SPEC.md) §22 for the build order.

## Packages

This repository is a pnpm workspace with two published packages:

- `pactwright` (repository root) — the runtime and CLI.
- `@pactwright/standard` (`packages/standard/`) — the default agent pack. It provides the three core Delivery capabilities (`delivery-specification`, `delivery-execution`, `delivery-review`). `pactwright` depends on it, so one `pnpm add -D pactwright` installs both; `.pactwright/config.yml` selects it by default.

## Design

[`SPEC.md`](./SPEC.md) — full system specification.

## How to contribute

Intent first, then implementation. See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## License

Apache-2.0. See [`LICENSE`](./LICENSE).
