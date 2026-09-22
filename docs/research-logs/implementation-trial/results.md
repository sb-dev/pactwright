# Results

The phase-by-phase index. Concise by design: each entry points at the evidence
rather than repeating it, and nothing is recorded here that was not executed or
explicitly marked otherwise.

| Phase | Status | Head | Evidence |
|---|---|---|---|
| A1 — reference, baseline and planning PR | complete | recorded in [`state.md`](state.md) | [`evidence/a1/`](evidence/a1/) |
| A2 — five independent audits | not started | — | — |
| A3 — reconcile and research | not started | — | — |
| A4 — acceptance and judge | not started | — | — |
| A5 — design and spec amendments | not started | — | — |
| A6 — rewritten checkpoints | not started | — | — |
| A7 — Gate A | not started | — | — |
| I1–I6 | not started; blocked on Gate A and maintainer implementation authority | — | — |

## A1 — the reference baseline

Measured on 21 September 2026 against
`19c66d5f2368932ff05306db1fae8da8ec5810dd`, on macOS 15.7.3 with Node 22.16.0
and pnpm 11.7.0. Full detail in
[`evidence/a1/baseline-checks.md`](evidence/a1/baseline-checks.md).

| Check | Result |
|---|---|
| `pnpm install --frozen-lockfile` | pass, exit 0 |
| **`pnpm verify`** | **fail, exit 1** — 684 tests: 682 pass, 1 fail, 1 skipped |
| `pnpm build`, run separately | pass, exit 0 |
| `pnpm verify:self`, run separately | pass, exit 0 — doctor healthy on all 8 checks; 16 nodes, 12 edges, 4 lineages; two syncs byte-identical |
| Packed consumer, explicit path | pass — every command exit 0 |
| Packed consumer, one-shot `init --agent-pack` | pass — resolved state byte-identical to the explicit path |
| Packed consumer, one-shot init with a fixture Extension | pass — extension enabled, lock hash differs as expected |
| Full fixture Delivery (Step 24), `eval`, live provider, Node 24 | not run — recorded as not run, not as passing |

The single failure is `tests/execute.test.ts:392`, an isolation assertion in
`acquireSide` that compares a `mkdtemp` path against a `require.resolve`
realpath. On macOS the temporary directory is a symlink, so the two never match.
GitHub Actions is green on this same SHA on `ubuntu-latest` for Node 22 and 24;
A1 inspected that run and did not execute it.

**This is A1's own result and it is not PR #39's.** The PR reports 683 passing
and 0 failing. Both statements can hold on their respective platforms; neither
is inherited here.

### Replay identities of the reference

```
repository_revision:    git:19c66d5f2368932ff05306db1fae8da8ec5810dd
project_graph_revision: sha256:63253100fa819a3c41f6e66896c3492488633707a8231ae5fe70a088816f16f8
environment_lock_hash:  sha256:76221cac587d9d6a4451d591a7738e88ceabca2c766eea90599bfc894a4cec68
```

### Packed artefacts

| Artefact | sha256 | Entries |
|---|---|---|
| `pactwright@0.0.2` | `58e5c20cf2b13cc884d53881fdc2a88543d8de70a50389f4c168dc54f320f4e5` | 143 |
| `@pactwright/standard@0.0.2` | `b43d51a57cf405a83b9354e3c61fc765b0a6aa8f42bc84f2680c4e198ffbfb2a` | 12 |

Registry state at capture: both packages publish `0.0.1` only. `0.0.2` is
unreleased, so a packed consumer needs a documented local-package override.

### Provisional source accounting

Runtime 16,677 lines over 70 files (12,456 code, 3,162 comment); tests 11,545
over 44 files plus 389 fixtures; pack prompts and skills 175; generated adapter
487; specifications 9,228; checkpoints 13,181. Two direct runtime dependencies,
141 resolved packages. Full table and method in
[`evidence/a1/baseline-metrics.md`](evidence/a1/baseline-metrics.md).

A4 freezes comparable accounting before any candidate exists. These numbers are
a baseline to freeze or replace, not a target.

## External acceptance evidence index

Empty. No release, publication or Kakeibo Delivery has been performed by this
trial. Those are I6's, under explicit authority, and a local pack is not
published proof.
