# Contributing

Pactwright runs as a structured delivery workflow, not a free-for-all PR queue. Substantive contributions move through the Delivery lifecycle the runtime enforces: **intent → decision → contract → brief → implementation → evidence**. Direct PRs without an upstream intent will be redirected.

## How to contribute

### For substantive work (features, behaviour changes, schema migrations)

1. **Open an issue** describing the *intent* — what problem you want solved and why, who it affects, expected outcome, urgency, and any trade-offs you already see. Free-form prose is fine; this becomes (or seeds) an `intent` node in the Delivery Graph.
2. A spec agent proposes candidate contracts from the intent; a human decision selects the canonical one.
3. The approved contract is decomposed into a brief; implementation follows.
4. Your PR carries an `evidence` node referencing its brief.

### For trivial work (typos, doc clarifications, broken links)

Open a PR directly. Reference the file you're fixing in the description. No intent node required.

## What to read first

- [`docs/`](./docs/) — the research logs and checkpoints that specify the system. Start with the Delivery Graph and lifecycle engineering spec in `docs/research-logs/`; code comments cite its sections (e.g. "Delivery Graph §15").
- [`SECURITY.md`](./SECURITY.md) — report security issues privately, not via public issues.

## Working in the workspace

- `pnpm verify` is the one gate: format check, lint, typecheck, tests, build. It covers every workspace package.
- `packages/standard/` is the default agent pack. Its `pack.yml` carries its own `version` and the exact compatible `pactwright` version; when a release bumps package versions (`pnpm version <v> -r`), update both fields in `pack.yml` too. `tests/pack-package.test.ts` fails if they drift.
- Agent prompts and skills describe *how* to do a responsibility. Lifecycle stages, gates and graph mutations belong to the runtime; do not write transition rules into prompts.

## Code of conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). See [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

## License

By contributing you agree your contributions are licensed under Apache-2.0, the project licence. See [`LICENSE`](./LICENSE).
