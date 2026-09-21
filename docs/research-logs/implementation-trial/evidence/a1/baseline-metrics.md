# A1 — baseline source accounting

Measured at `19c66d5f2368932ff05306db1fae8da8ec5810dd` on 21 September 2026.

**This accounting is provisional.** A4 owns freezing comparable denominators,
workload sizes and limits *before* any candidate result exists (runbook §2.2).
A1's job is to produce a baseline that A4 can freeze or replace, and to make its
method inspectable rather than asserted. Nothing here is a threshold, a target
or a score, and no aggregate number is computed.

## How it was measured

```bash
node --import tsx tools/implementation-trial/measure-source.ts \
  --root /Users/samir/workspace/pactwright-trial/reference \
  --label reference@19c66d5f [--json]
```

The probe is [`tools/implementation-trial/measure-source.ts`](../../../../../tools/implementation-trial/measure-source.ts).
Raw output is committed beside this file as
[`baseline-metrics.json`](baseline-metrics.json) and
[`baseline-metrics.txt`](baseline-metrics.txt).

It walks declared directories, skipping `node_modules`, `dist` and `.git`, and
classifies every line. For TypeScript it runs a character scanner that tracks
strings, template literals and regular-expression literals, so a `//` inside a
string is not counted as a comment. For Markdown and YAML a non-blank line is
content, and only a leading `#` on a YAML line is a comment.

## Results

| Group | Files | Lines | Code | Comment | Blank | Bytes |
|---|---:|---:|---:|---:|---:|---:|
| `runtime-source` — the published runtime and CLI | 70 | 16,677 | 12,456 | 3,162 | 1,059 | 629,248 |
| ↳ `prompts-embedded` — prompt text inside runtime source \* | 1 | 257 | 225 | 23 | 9 | 8,971 |
| `pack-source` — the default agent pack's own source | 1 | 13 | 5 | 4 | 4 | 602 |
| `tests` — test drivers | 44 | 11,545 | 9,771 | 771 | 1,003 | 457,114 |
| `test-fixtures` — fixture data the tests read | 389 | 3,971 | 3,476 | 6 | 872 | 73,648 |
| `prompts-pack` — agent prompts and skills shipped by the pack | 6 | 175 | 137 | 0 | 44 | 8,026 |
| `prompts-generated` — the rendered adapter surface | 10 | 487 | 349 | 0 | 148 | 23,116 |
| `specs` — canonical specifications | 8 | 9,228 | 6,361 | 0 | 2,867 | 258,436 |
| `checkpoints` — checkpoint instructions | 14 | 13,181 | 9,061 | 0 | 4,134 | 575,059 |
| `graph-records` — the repository's own Delivery Graph | 17 | 473 | 411 | 0 | 79 | 22,139 |
| `workflows` — repository CI configuration | 2 | 144 | 122 | 13 | 11 | 5,134 |

\* already counted inside `runtime-source`; reported separately because moving
implementation into prompt text is one of the ways a source-reduction claim can
be gamed, and it cannot be seen unless it is measured on its own.

Also measured: 14 lines in `runtime-source` carry both code and a comment.

## Dependencies

| | Direct runtime | Direct dev |
|---|---|---|
| `pactwright` (root) | 2 — `@pactwright/standard@workspace:*`, `js-yaml@^4.1.0` | 8 — `@eslint/js`, `@types/js-yaml`, `@types/node`, `eslint`, `prettier`, `tsx`, `typescript-eslint`, `typescript` |
| `@pactwright/standard` | 0 | 0 |

**141 resolved packages** in `pnpm-lock.yaml`.

One direct third-party runtime dependency for a system of this size is a
genuine strength of the reference, and a candidate that needs more should have
to justify it. Recorded here so the comparison runs in both directions.

## What the numbers already say

Two observations A1 can make from measurement alone, both of which A2 and A4
should carry forward:

- **Tests are 0.93 lines per line of runtime source** (11,545 against 16,677
  across 43 `*.test.ts` files and `tests/helpers.ts`), and fixtures add 389 more
  files. Any candidate compared on "implementation
  size" alone, with tests excluded from the denominator, would be comparing the
  smaller half of the work. The groups above keep them apart for exactly that
  reason.
- **Comments are 19% of runtime source** (3,162 of 16,677 lines). §1.3 says to
  retain short invariant and rationale comments and not to trade readable code
  or diagnostics for line-count targets. A candidate that halves the comment
  ratio has not become simpler; it has become less explained. Comments must
  therefore stay a separate column, never folded into a single total.

## Method limits, stated rather than hidden

- The regular-expression heuristic in the TypeScript scanner — a `/` starts a
  regex only where an operand cannot appear — is the usual one and is ambiguous
  in a few constructs. Residual error is at most a line or two per file.
- A line carrying both code and a comment is counted in `code`, and also
  reported in the `mixed` column. It is **not** double-counted in `comment`.
- `wc -l` will report 8 fewer lines across `docs/specs/` than this probe does,
  because all eight specification files end without a trailing newline and `wc`
  counts newline characters. The probe counts the final unterminated line. This
  was checked, not assumed.
- Packed artefact sizes are in [`baseline-checks.md`](baseline-checks.md), not
  here, because they come from `pnpm pack` rather than from this probe.
- The probe measures a checkout. It says nothing about duplication, complexity,
  import cycles or repeated runtime work — all of which §2.2 lists and A4 owns.
