# Trial state

The one place both agents resolve identities from. Every other trial record
points here rather than restating a SHA, a branch or a path.

**Runbook:** [`docs/research-logs/2026-09-21-pactwright-implementation-trial-spec.md`](../2026-09-21-pactwright-implementation-trial-spec.md)
(v10, 22 September 2026) — Version 10 is the current execution contract. Progress is tracked here; the runbook contains instructions only.

**Last writer:** Claude Code, A2 coordinator publication, 22 September 2026.

## Identities

| What | Value |
|---|---|
| Repository | `sb-dev/pactwright` (`git@github.com:sb-dev/pactwright.git`) |
| Default branch recorded at A1 | `main` at `c38fa95afe66fb68dcc3a297cebc04587365f23d` |
| Analysis branch | `trial/restart-analysis`, created from `main` at `c38fa95a` |
| Analysis PR | [**#40**](https://github.com/sb-dev/pactwright/pull/40) — draft, base `main`, head `trial/restart-analysis`. The shared PR for A1–A7; both agents work on it sequentially. |
| Pinned reference | `19c66d5f2368932ff05306db1fae8da8ec5810dd` |
| Reference live branch | `review/checkpoint-1` — local and `origin` both at the pinned SHA |
| Reference PR | [#39](https://github.com/sb-dev/pactwright/pull/39), open, not draft, head `19c66d5f`, base `main` |
| Guardrail branch (I1–I2, not yet created) | `trial/restart-guards` |
| Implementation branch (I3+, not yet created) | `trial/reimplementation` |
| Accepted control revision | **none** — A4 defines the control bundle and I1–I2 deploy it. Until then `control_sha` is `null` in every review comment and no comment can satisfy an implementation gate. |

The analysis branch was created from the default branch. **PR #39 is not merged
and its runtime is unaltered**; nothing from `19c66d5f`'s 104 changed production
files is on `trial/restart-analysis`.

## Reference divergence

`main` is an ancestor of the pinned reference: the reference is `main` plus 19
commits, and no commit on `main` is absent from the reference. So at A1 there is
no live-branch divergence to reconcile — `review/checkpoint-1` (local and
`origin`) and PR #39's head are all exactly `19c66d5f`.

One preservation hazard was found and pinned; see
[`evidence/a1/reference-preservation.md`](evidence/a1/reference-preservation.md).

## Environment

Recorded, not inferred — see [`evidence/a1/environment.md`](evidence/a1/environment.md)
for the full record including how each value was obtained.

| | |
|---|---|
| Model | Opus 5 (1M context), resolved model id `claude-opus-5[1m]` |
| CLI | Claude Code `2.1.220` |
| Node | `v22.16.0` (the reference declares `>=22 <23 \|\| >=24 <25`) |
| Package manager | `pnpm` launcher `11.7.0`; the reference pins `packageManager: pnpm@11.7.0` |
| Platform | macOS 15.7.3, Darwin 24.6.0, x86_64 |
| Skills applied at A1 | `acquire-codebase-knowledge`, `verification-before-completion` (both pinned in `skills-lock.json`) |

`skills-lock.json` is byte-identical at `main` and at the reference (blob
`dd9a33d014c1f7c5b97c4664fbbf89402ec26ed2`), 29 pinned skills. No skill was
installed, upgraded or modified during A1.

## Working checkouts

All disposable, all outside the repository, none canonical. Recreate rather than
repair.

| Path | Contents |
|---|---|
| `/Users/samir/workspace/pactwright-trial/reference` | The pinned reference, detached at `19c66d5f`; where A1 ran the documented checks |
| `/Users/samir/workspace/pactwright-trial/a2/<area>` | The five isolated A2 checkouts — see [`evidence/a1/a2-checkouts.md`](evidence/a1/a2-checkouts.md) |
| `/Users/samir/workspace/pactwright-trial/pack` | The two packed artefacts A1 built and installed |
| `/Users/samir/workspace/pactwright-trial/consumer-*` | The three clean packed-consumer fixtures |
| `/Users/samir/workspace/pactwright-trial/evidence` | Full run logs; the committed evidence below is the extract that matters |

Those paths are local to the A1 machine. Everything a reviewer needs is
committed under `evidence/a1/`.

## Evidence locations

| Record | Holds |
|---|---|
| [`evidence/a1/pr39/`](evidence/a1/pr39/) | PR #39 captured verbatim: body, the one conversation comment, the (empty) review and inline-comment collections, and the raw metadata |
| [`evidence/a1/pr39-capture.md`](evidence/a1/pr39-capture.md) | What was captured, from which URL, at which timestamp, and what is *not* there |
| [`evidence/a1/environment.md`](evidence/a1/environment.md) | Model, CLI, runtime and package-manager versions; skills inspected and applied |
| [`evidence/a1/authorities-and-public-surface.md`](evidence/a1/authorities-and-public-surface.md) | Canonical authorities, checkpoint files, public commands and public exports |
| [`evidence/a1/baseline-checks.md`](evidence/a1/baseline-checks.md) | Every check A1 ran, with its status, exit code and evidence file |
| [`evidence/a1/baseline-metrics.md`](evidence/a1/baseline-metrics.md) | Provisional comparable source accounting, and the probe that produced it |
| [`evidence/a1/reference-preservation.md`](evidence/a1/reference-preservation.md) | How the reference and its delivery record are preserved, and what would lose them |
| [`evidence/a1/a2-checkouts.md`](evidence/a1/a2-checkouts.md) | The five A2 checkouts, their branches and the serial publication protocol |
| [`evidence/a1/logs/`](evidence/a1/logs/) | The command logs behind the checks, with the command, working directory and exit code on every one |
| [`results.md`](results.md) | The phase-by-phase index; A1's entry is the baseline |
| [`analysis/`](analysis/) | The five A2 reports (`graph.md`, `lifecycle.md`, `distribution.md`, `verification.md`, `runbooks.md`); `analysis/README.md` holds the five assignments |
| [`evidence/a2/`](evidence/a2/) | Scoped A2 evidence: `lifecycle/` (probe run log), `verification/` (measurements, fault seeds, discarded measurements), `runbooks/logs/` (executed checkpoint commands). Graph and distribution evidence sits beside their probes under `tools/implementation-trial/a2-graph/` and `tools/implementation-trial/a2-distribution/logs/` |

## Execution progress

Progress is recorded here, not in the runbook.

| Step/session | Observed state | Source | Runbook used |
|---|---|---|---|
| A1 | complete | PR #40 A1 hand-off/review history | v3 |
| A2-G graph/persistence | complete | `trial/a2-graph@2a5730d83a6e7a718310cc8bc3bf0d81ba18640c` | v3 |
| A2-L lifecycle/agents | complete | `trial/a2-lifecycle@2ff14a65b8775cc85dc24e35260d5a37cd87f4cf` | v3 |
| A2-D distribution/recovery | complete | `trial/a2-distribution@ace0492ff6ed37ecf6c9be18e154bc53e3c36672` | v3 |
| A2-V verification/evaluation | complete | `trial/a2-verification@9eabe5234a7e793a418777b54ebb086390376aff` | v4 |
| A2-R specs/checkpoints | complete | `trial/a2-runbooks@f6d75ccd6fd0589f49bd40899d9f12a9203482a7` | v4 |
| A2 coordinator publication | complete | `trial/restart-analysis@a04ecf60adc2eabe109fae8fcc28eacbed72bafe` plus the coordinator state commit; see [A2 integration](#a2-integration) | v10 |
| A2 ChatGPT coverage review | pending | reviews `trial/restart-analysis` at the A2 integration head recorded below | v10 |
| A3 | not started | starts after A2 gate | v10 |

A missing required audit branch means that audit is not complete. Do not infer
completion from an intended local session, a conversation statement or another
audit's progress.

## A2 integration

Coordinator publication, 22 September 2026. Actor: Claude Code — session
model id `claude-fable-5-1` (resolved from the session record, not inferred),
Claude Code CLI `2.1.278`, Node `v22.22.2`, pnpm `11.7.0`, Linux container.

Start of the writer turn: `trial/restart-analysis` at
`911161ebc2288911ddbc12961fb854347afd6bf5`, fetched and fast-forwarded before
any write; the remote head was re-fetched and unchanged immediately before the
push. A1-reviewed head: `9aaeb0852c9dc063a2a56d7523c230e8544c904e`.

### Verification of each audit commit

For every audit the coordinator confirmed, with `git merge-base --is-ancestor`
and `git diff --name-status <parent> <commit>`, that the audit commit is the tip
of its assigned branch, that it descends from that branch's pushed overlay
commit, that the overlay is the sole commit on top of the pinned reference
`19c66d5f2368932ff05306db1fae8da8ec5810dd`, that the overlay changes nothing
under `src`, `packages`, `tests`, `specs`, `.pactwright`, `.claude`, `.github`,
`examples`, `skills-lock.json`, `package.json` or `pnpm-lock.yaml`, and that the
audit commit only adds files under its report/probe/evidence paths. No audit
commit modifies or deletes an existing file. None was rejected.

| Audit | Source branch | Audit commit (source) | Overlay commit (pushed) | Cherry-picked onto `trial/restart-analysis` | Files |
|---|---|---|---|---|---|
| A2-G | `trial/a2-graph` | `2a5730d83a6e7a718310cc8bc3bf0d81ba18640c` | `209cdcddf187c88a4b3cf0c6e2002c782c7e9dc5` | `69210dff222546cca0c12cdba31a8db1f9ba5289` | `analysis/graph.md`, `tools/implementation-trial/a2-graph/**` (11 files) |
| A2-L | `trial/a2-lifecycle` | `2ff14a65b8775cc85dc24e35260d5a37cd87f4cf` | `7f2678375bcf3fdd604dca1cda4d484eb2be0aaf` | `f42edb540b60503b1fafc60f43fd08afa913f051` | `analysis/lifecycle.md`, `evidence/a2/lifecycle/run-all.log`, `tools/implementation-trial/a2/lifecycle/**` (10 files) |
| A2-D | `trial/a2-distribution` | `ace0492ff6ed37ecf6c9be18e154bc53e3c36672` | `38efdf101030d24769873ab612e8b6078b0a8a80` | `c2722847d87f93fd9e2e44816a582e107eae4f73` | `analysis/distribution.md`, `tools/implementation-trial/a2-distribution/**` (24 files, including `logs/`) |
| A2-V | `trial/a2-verification` | `9eabe5234a7e793a418777b54ebb086390376aff` | `9335f29e0f15f4356222948bc8ea53a45032a09f` | `bef82d197cb6dd5568ada6a386f04329880d7b80` | `analysis/verification.md`, `evidence/a2/verification/**` (12 files), `tools/implementation-trial/a2/verification/**` (13 files) |
| A2-R | `trial/a2-runbooks` | `f6d75ccd6fd0589f49bd40899d9f12a9203482a7` | `69cdc95a9d5ed578ef21c165b359ace8f5a2954f` | `a04ecf60adc2eabe109fae8fcc28eacbed72bafe` | `analysis/runbooks.md`, `evidence/a2/runbooks/logs/**` (7 files) |

The five commits were cherry-picked with `git cherry-pick -x`, in the order
A2-G, A2-L, A2-D, A2-V, A2-R, onto `911161eb`. No cherry-pick conflicted, so
no report or evidence content was touched by the coordinator; each integrated
commit carries the source commit's message, author and a `(cherry picked
from commit …)` line. No temporary branch was merged, and none has been
deleted.

### Deviations and qualifications for the coverage review

- **Overlay SHAs.** The overlay commits recorded in
  [`evidence/a1/a2-checkouts.md`](evidence/a1/a2-checkouts.md) (`be08d028`,
  `b185f601`, `290f3edb`, `037f01c8`, `a295986a`) do not exist on GitHub; the
  A1 checkouts were separate object stores and each session pushed its own
  overlay commit, listed in the table above. Every pushed overlay was verified
  against the same production-path check A1 documents, with zero production
  paths changed. The lifecycle overlay omits
  `tools/implementation-trial/measure-source.ts`; that has no effect on the
  cherry-pick, which applies only the audit commit's diff.
- **Probe layout.** A2-G and A2-D ran under the v3 prompts, before the v4
  permitted-path table existed, and placed probes and logs under
  `tools/implementation-trial/a2-graph/` and
  `tools/implementation-trial/a2-distribution/` rather than
  `tools/implementation-trial/a2/<area>/` and `evidence/a2/<area>/`. Version
  10 records the graph layout as an accepted, already-established exception;
  the distribution layout is the same v3 convention but is not named in the
  table because the branch was not yet on GitHub when v10 was written. The
  coordinator accepted it on the same basis: both paths are trial probe and
  evidence locations under `tools/implementation-trial/`, and neither commit
  touches a production, package, specification or checkpoint file. The
  coverage review may object to that acceptance.
- **Hand-offs.** No A2 session posted a hand-off comment on PR #40; the PR
  carries only the A1 hand-off and A1 review comments. Each audit's hand-off
  is its commit message on its branch, and this file's progress table. The
  coordinator treated the branch tips as the handed-off report SHAs.
- **A1 review status.** The last recorded A1 decision on PR #40 is
  `CHANGES REQUIRED` at `9aaeb085` (findings A1-F01–F03). This file records A1
  as complete on the maintainer's authority; the coordinator did not find an
  A1 `PASS` comment and did not resolve that itself.

### Checks run on the integrated head

| Check | Result |
|---|---|
| `git diff --name-only 9aaeb0852c9dc063a2a56d7523c230e8544c904e...a04ecf60` | 86 paths: the runbook, this file, `analysis/README.md`, the five reports, 20 files under `evidence/a2/`, 58 under `tools/implementation-trial/` — nothing else |
| Same diff restricted to `src packages tests specs docs/checkpoints docs/specs .pactwright .claude .github examples skills-lock.json package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig*.json eslint.config.js .prettier*` | empty |
| `pnpm install --frozen-lockfile` at `a04ecf60` | `executed-pass`, exit 0 |
| `pnpm verify` at `a04ecf60` (format check, lint, typecheck, tests, build) on Node 22 | `executed-pass`, exit 0 — 562 tests, 562 pass, 0 fail, 0 skipped |

The audit probes under `tools/implementation-trial/` are not in any
`tsconfig` include set, so `typecheck` does not compile them; `prettier` and
`eslint` do see them and pass. They were written against the reference's
runtime and are not expected to run against this branch's `main`-based
runtime; they are the record of what A2 executed, not a suite for this branch.

Next owner: ChatGPT, the runbook's A2 independent coverage review, on
PR #40 at the A2 integration head.

## Instruction provenance

Graph, lifecycle and distribution were executed with v3 A2 prompts (the distribution audit commit is dated 21 September 2026 23:35 UTC, before the v4 runbook of 22 September 06:51 UTC introduced the permitted-path table); verification/runbooks with v4.
Those branch copies are the historical instruction snapshots for their results.
Version 10 keeps A2 as an executable instruction section. Completed sessions retain their original v3/v4 branch snapshots; remaining A2 work uses the current section. Do not encode progress back into the runbook.
