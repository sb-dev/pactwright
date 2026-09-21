# Trial state

The one place both agents resolve identities from. Every other trial record
points here rather than restating a SHA, a branch or a path.

**Runbook:** [`docs/research-logs/2026-09-21-pactwright-implementation-trial-spec.md`](../2026-09-21-pactwright-implementation-trial-spec.md)
(v3, 21 September 2026) — preserved on the analysis branch by A1.

**Last writer:** Claude Code, A1, 21 September 2026.

## Identities

| What | Value |
|---|---|
| Repository | `sb-dev/pactwright` (`git@github.com:sb-dev/pactwright.git`) |
| Default branch recorded at A1 | `main` at `c38fa95afe66fb68dcc3a297cebc04587365f23d` |
| Analysis branch | `trial/restart-analysis`, created from `main` at `c38fa95a` |
| Analysis PR | *opened in the A1 publication commit; recorded there* |
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
| [`analysis/`](analysis/) | Empty until A2 publishes; `analysis/README.md` holds the five assignments |

## Status

A1 complete. A2 has not started: no report exists in `analysis/`, and nothing in
this branch has been reviewed by ChatGPT yet.
