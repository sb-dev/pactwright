# Contributing

Pactwright governs substantive work through **Intent → Decision → Contract → Brief → Delivery → Review → Evidence**. The current checkout is the bootstrap harness. Until the self-hosting threshold in Checkpoint 1 is accepted, use the reviewed checkpoint contracts and harness evidence. After that threshold, applicable changes use the accepted runtime. See [Spec 00](docs/specs/00-checkpoint-step-contract-and-delivery-tasks.md) and the [roadmap](docs/roadmap.md).

## How to contribute

### For substantive work (features, behaviour changes, schema migrations)

1. **Open an issue** describing the *intent* — what problem you want solved and why, who it affects, expected outcome, urgency, and any trade-offs you already see. Free-form prose is fine; this becomes (or seeds) an `intent` node in the Delivery Graph.
2. A spec agent proposes candidate contracts from the intent; a human decision selects the canonical one.
3. The approved contract is decomposed into a brief; implementation follows.
4. Once the accepted runtime governs the work, the PR carries Evidence referencing its Brief, recorded through runtime commands after successful Review. Bootstrap work retains its harness verification and review evidence; do not manufacture graph records to imply self-hosting.

### For trivial work (typos, doc clarifications, broken links)

Open a PR directly. Reference the file you're fixing in the description. No intent node required.

## What to read first

- [Specification index](docs/specs/README.md) — canonical owners and adopted amendments. Start here for system semantics.
- [Checkpoint runbooks](docs/checkpoints/README.md) — execution order and acceptance. Research logs retain rationale and historical evidence; they do not supersede canonical specifications unless explicitly adopted.
- [Documentation index](docs/README.md) — current operating instructions and product learning paths.
- [`SECURITY.md`](./SECURITY.md) — report security issues privately, not via public issues.

## Working in the workspace

- `pnpm verify` is the one gate: format check, lint, typecheck, tests, build. It covers every workspace package.
- The current executable workspace is `tools/checkpoint-harness/`. Use its [operator procedure](tools/checkpoint-harness/README.md). Checkpoint 1 delivers the runtime and `@pactwright/standard`; package, manifest, lock and release consistency must satisfy its contracts before publication.
- Agent prompts and skills describe *how* to do a responsibility. Lifecycle stages, gates and graph mutations belong to the runtime; do not write transition rules into prompts.

## Code of conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). See [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

## License

By contributing you agree your contributions are licensed under Apache-2.0, the project licence. See [`LICENSE`](./LICENSE).
