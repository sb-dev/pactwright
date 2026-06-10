# Pactwright

A GitHub-native AI software delivery workflow built on Claude Code, GitHub, and a file-based spec graph. Human intent is transformed into verified, traceable, production-aware change through a market of candidate contracts, candidate patches, and explicit human trade-off decisions — all recorded as nodes and edges in the repository itself.

## Status

**Phase 1 — graph skeleton.** The schema and `/specs` layout are in place; tooling, GitHub Actions enforcement, drift detection, the patch market, and the release loop arrive in later phases. See [`SPEC.md`](./SPEC.md) §22 for the build order.

## Pointers

- [`SPEC.md`](./SPEC.md) — full system specification.
- [`CLAUDE.md`](./CLAUDE.md) — Claude Code operating rules for this repo.
- [`/specs`](./specs) — canonical state: `nodes/`, `graph/edges.yaml`, `schema/`. Indexes and reports are generated.

## How to contribute

Intent first, then implementation. See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## License

Apache-2.0. See [`LICENSE`](./LICENSE).
