# A1 — canonical authorities, checkpoints and the public surface

Mapped from the pinned reference `19c66d5f2368932ff05306db1fae8da8ec5810dd`.
Every count below came from reading the files at that SHA, not from a summary.

This is the map A2 starts from: which document owns which meaning, which
checkpoint owns which construction order, and what a consumer can actually call.

## Canonical authorities

`docs/specs/` owns meaning. Checkpoints own construction order and proofs. The
old implementation, its tests and PR #39 are investigation inputs (§1.3).

| Specification | Owns | `##` sections | Footer |
|---|---|---|---|
| `01-pactwright-core-system-and-lifecycle.md` | Contract, Delivery Graph and the core lifecycle. Explicitly says no neighbouring specification may redefine them. | 21 | Core System and Lifecycle **v1** |
| `02-distribution-agent-packs-extensions-and-evaluation.md` | Packaging, installation, configuration, extension, composition, sync, locking, upgrade, diagnosis, evaluation. | 11 | Distribution … **v1** |
| `03-project-intelligence.md` | Project Intelligence Extension: Source → triage → Knowledge. | 2 | Project Intelligence **v1** |
| `04-graph-review.md` | Graph Review Extension: replay base, Review Execution, Finding. | 5 | Graph Review **v1** |
| `05-assets-and-publication.md` | Assets / Publication Extension: approved content hash → Asset → Publication. | 2 | Assets and Publication **v1** |
| `06-operations.md` | Operations Extension: exposure → bounded operational evidence → Observation. | 6 | Operations **v1** |
| `07-github-integration.md` | GitHub as execution and projection surface, never as canonical state. | 2 | GitHub Integration **v1** |
| `08-open-source-project-organisation.md` | The public product surfaces; the repository stays the source of truth. | 16 | Open-Source Project Organisation **v1** |

The two specifications A5 will primarily amend are Core and Distribution.

**Amendments.** There is no separate amendment register. PR #39's five
amendments were applied as edits to the spec bodies themselves (Core §14, §46,
§53; Distribution §3, §11) in the commit whose subject is *"docs: adopt closure
provenance, declared execution and Extension schemas"* — `df243bc` on the
reference branch. Every specification still carries a `v1` footer, so **a reader
cannot tell an amended specification from an unamended one by its version
string**. A5 and A6 both have to touch versions and footers; this is recorded
now so that neither treats it as a surprise.

Supporting research logs also live under `docs/research-logs/`. The two that
bear on this trial are `2026-09-19-pactwright-checkpoint-1-review.md` (the review
that produced R01–R13) and `2026-09-20-pactwright-checkpoint-1-consolidation-design.md`
(the design PR #39 implemented, whose §16 is the delivery record). Neither is an
authority; both are inputs.

## Checkpoint files

All under `docs/checkpoints/`. A6 rewrites these; A1 only inventories them.

| File | Title |
|---|---|
| `README.md` | Pactwright Implementation Runbooks **v7** |
| `00-implementation-principles.md` | Implementation Principles |
| `00-implementation-guide.md` | Implementation Guide |
| `00-kakeibo-acceptance-profile.md` | Kakeibo System-Level Acceptance Profile |
| `01-self-hosted-delivery.md` | Checkpoint 1 — Self-Hosted Delivery |
| `02-remote-delivery.md` | Checkpoint 2 — Remote Delivery |
| `03-project-intelligence.md` | Checkpoint 3 — Project Intelligence |
| `04-graph-review.md` | Checkpoint 4 — Graph Review |
| `05-production-skills-and-assets-publication.md` | Checkpoint 5 — Production Skills + Assets / Publication |
| `06-operations.md` | Checkpoint 6 — Operations |
| `07-publication-feedback.md` | Checkpoint 7 — Publication Feedback |
| `08-github-project-surface.md` | Checkpoint 8 — Full Project Operating Surface |
| `09-hardened-closed-loop.md` | Checkpoint 9 — Hardened Closed Loop |
| `10-graduation-connected-banking.md` | Graduation — Connected Banking |

Fourteen files, 13,181 lines. Checkpoint 1 runs to **Step 31 across 11 stages**;
its Stage 6 (Steps 22–24) is the packed-consumer proof A1 partly executed, and
the stages after it cover self-hosting, the public learning material, release
`0.0.2`, the Kakeibo external Delivery and a closing findings capture.

## Public command surface

One binary, `pactwright` → `dist/cli.js`. Dispatch is a flat sequence in
`src/cli.ts:949`; there is no plugin command registry.

| Command | Subcommands |
|---|---|
| `init` | `[--agent-pack <source>] [--with <id>] [--json]` |
| `sync` | `[--json]` |
| `upgrade` | `[--to <version>] [--json]` |
| `doctor` | `[--json]` |
| `validate` | `[--json]` |
| `context` | `<node-id> [--history] [--json]` |
| `lifecycle` | `status`, `next`, `run`, `record <command> --file <yaml>` |
| `agent-pack` | `use <source>`, `upgrade` |
| `extension` | `add <id\|package>`, `remove <id>`, `upgrade <id>` |
| `eval` | `[--json]`, `--baseline <pack> --candidate <pack>` |
| — | `--help` / `-h` / `help`, `--version` / `-v` / `version` |

Ten command words, twelve subcommands, `--json` on every one of them. Bare
`pactwright` prints help and **exits 1**; `pactwright help` exits 0.

`lifecycle record` accepts the four recording commands (`capture-intent`,
`approve-contract`, `write-brief`, `prepare-evidence`), the two execution
provenance kinds (`delivery`, `review`) and `gate`.

The seven generated Claude Code commands are a different surface, rendered into
`.claude/commands/` by `sync` from `src/adapter/commands.ts`: `capture-intent`,
`propose-contracts`, `approve-contract`, `write-brief`, `deliver-brief`,
`review`, `prepare-evidence`. Three agents are rendered into `.claude/agents/`:
`spec`, `implementer`, `reviewer`.

## Public package exports

| Package | Entry | Surface |
|---|---|---|
| `pactwright` | `dist/index.js` / `dist/index.d.ts`, single `"."` export | **429 exported names** re-exported from **61 internal modules** by `src/index.ts`, of which 172 are type-only |
| `@pactwright/standard` | `dist/index.js`, plus `./package.json` and `./pack.yml` subpath exports | The pack's own source is 13 lines; its substance is `pack.yml`, three agent prompts and three skills |

429 names over 61 modules is effectively "the whole implementation is public".
A5's compatibility decision has to say which of these are contracts and which
are incidental internals — the runbook's A4 prompt already flags this: *"Define
preserved CLI/API/data/revision/error contracts without preserving every
incidental internal export."* A1 records the number so the decision is taken
against a measured surface rather than an impression.

Both packages declare `engines.node: >=22 <23 || >=24 <25` and are published
under Apache-2.0. Root version `0.0.2`; pack version `0.0.2`;
`packages/standard/pack.yml` pins `pactwright: 0.0.2` exactly.

## Repository layout at the reference

| Path | What |
|---|---|
| `src/` | 70 TypeScript files — the runtime and CLI |
| `packages/standard/` | The default agent pack |
| `tests/` | 44 test files plus 389 fixture files |
| `docs/specs/`, `docs/checkpoints/`, `docs/research-logs/` | Authorities, construction order, research |
| `specs/` | The repository's **own** Delivery Graph: 16 nodes, 12 edges, 4 lineages |
| `.pactwright/` | `config.yml`, `lifecycle.yml`, `lock.yml`, execution state |
| `.claude/` | Generated adapter surface (3 agents, 7 commands), plus 28 pinned skill directories |
| `.agents/skills/` | The 29th pinned skill, `humanizer`, which lives outside `.claude/` |
| `.github/workflows/` | `ci.yml` (named `CI`) and `release.yml` |
| `examples/core-delivery/` | The runnable example the README links |

`specs/` is the project's own graph and `docs/specs/` is the specification set.
They are different things with confusingly similar names; every reference in the
trial records names the full path for that reason.
