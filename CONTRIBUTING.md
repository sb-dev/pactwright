# Contributing

Pactwright runs as a structured delivery workflow, not a free-for-all PR queue. Substantive contributions move through the lifecycle defined in [`SPEC.md`](./SPEC.md): **intent → candidate contracts → human decision → brief → implementation → evidence**. Direct PRs without an upstream intent node will be redirected.

## How to contribute

### For substantive work (features, behaviour changes, schema migrations)

1. **Open an issue** describing the *intent* — what problem you want solved and why, who it affects, expected outcome, urgency, and any trade-offs you already see. Free-form prose is fine; this becomes (or seeds) an `intent` node in the spec graph.
2. A Spec Writer proposes multiple candidate contracts from the intent; a human selects one.
3. The approved contract is decomposed into briefs; implementation follows.
4. Your PR carries an `evidence` node referencing its brief — see [`SPEC.md` §13](./SPEC.md) for what the PR description should cover.

If the change touches `/specs/schema/`, the schema CODEOWNER must approve. Plan for that.

### For trivial work (typos, doc clarifications, broken links)

Open a PR directly. Reference the file you're fixing in the description. No intent node required.

## What to read first

- [`CLAUDE.md`](./CLAUDE.md) — how Claude Code operates in this repo, including graph rules.
- [`SPEC.md`](./SPEC.md) — full system specification. Most relevant sections for contributors:
  - §4 — graph layout (`nodes/` + `graph/edges.yaml` + `schema/`).
  - §5 — graph rules. Relationships live in the edge table only; never delete records, supersede them.
  - §11 — Claude Code operating instructions.
  - §13 — what a meaningful PR description should contain.
- [`SECURITY.md`](./SECURITY.md) — report security issues privately, not via public issues.

## Code of conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). See [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

## License

By contributing you agree your contributions are licensed under Apache-2.0, the project licence. See [`LICENSE`](./LICENSE).
