# Contributing

Pactwright runs as a structured delivery workflow, not a free-for-all PR queue.
Substantive contributions move through the numbered lifecycle in
[`CLAUDE.md`](./CLAUDE.md), which is the authority for it: an intent is captured,
candidate contracts are proposed, they are reviewed and compared, a human selects
one, it is decomposed into briefs, each brief is implemented, evidence is recorded,
and a multi-lane change is closed by an integration. Direct PRs without an upstream
intent node will be redirected.

## How to contribute

### For substantive work (features, behaviour changes, schema migrations)

1. **Run `/capture-intent`** with the *intent* — what problem you want solved and
   why, who it affects, the expected outcome, urgency, and any trade-offs you already
   see. Free-form prose is fine; it becomes an `intent` node in the spec graph.
   (Issues are a generated one-way *view* of the graph, never an input to it.)
2. A spec writer proposes candidate contracts from the intent; critics attack them;
   a human selects one and records why the others lost.
3. The approved contract is decomposed into briefs; implementation follows.
4. Your PR carries an `evidence` node referencing its brief — see
   [`docs/branch-protection.md`](./docs/branch-protection.md) ("How pr-evidence is
   satisfied") and [`.claude/commands/prepare-evidence.md`](./.claude/commands/prepare-evidence.md)
   for what that requires.

Schema changes require code-owner approval; see
[`docs/branch-protection.md`](./docs/branch-protection.md) ("Required reviews
(CODEOWNERS)").

### For trivial work (typos, doc clarifications, broken links)

Open a PR directly. Reference the file you're fixing in the description. No intent
node required.

## What to read first

- [`CLAUDE.md`](./CLAUDE.md) — the operating rules. Most relevant for contributors:
  - `## Structure` and `### Where canonical truth lives` — the graph layout
    (`nodes/` + `graph/edges.yaml` + `schema/`).
  - `## Rules` — relationships live in the edge table only; never delete records,
    supersede them; graph-maintainer is the sole writer.
  - `## Lifecycle` — the numbered steps and the command that performs each.
- [`.claude/commands/`](./.claude/commands/) — the Claude Code operating
  instructions, one file per lifecycle command.
- [`SPEC.md`](./SPEC.md) — the full system specification.
- [`SECURITY.md`](./SECURITY.md) — report security issues privately, not via public
  issues.

## Code of conduct

This project follows the
[Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).
See [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

## License

By contributing you agree your contributions are licensed under Apache-2.0, the
project licence. See [`LICENSE`](./LICENSE).
