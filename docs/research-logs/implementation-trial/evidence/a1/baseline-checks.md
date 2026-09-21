# A1 — baseline checks against the pinned reference

Every check below was run by A1 on 21 September 2026 in a **disposable checkout
of `19c66d5f2368932ff05306db1fae8da8ec5810dd`**, at
`/Users/samir/workspace/pactwright-trial/reference`. The reference was not
repaired, patched or worked around: where a check fails, it is recorded failing.

The checkout is byte-exact. Its working tree hashes to
`f4775cfc1540292f5ef863e6ade6a03bca866a52`, which is the pinned commit's own
tree.

Statuses use the runbook §1.3 vocabulary. **`executed-pass` and `executed-fail`
mean A1 ran the command in this session and read its exit code.** Nothing here
is inherited from PR #39 or from a CI badge.

## Summary

| # | Check | Status | Exit | Evidence |
|---|---|---|---|---|
| 1 | `pnpm install --frozen-lockfile` | `executed-pass` | 0 | [`logs/01-install.log`](logs/01-install.log) |
| 2 | `pnpm verify` (the one documented gate) | **`executed-fail`** | **1** | [`logs/02-verify-extract.log`](logs/02-verify-extract.log) |
| 2a | └ `pnpm format:check` | `executed-pass` | 0 | implied by the chain reaching `test` |
| 2b | └ `pnpm lint` | `executed-pass` | 0 | implied by the chain reaching `test` |
| 2c | └ `pnpm typecheck` | `executed-pass` | 0 | implied by the chain reaching `test` |
| 2d | └ `pnpm test` | **`executed-fail`** | **1** | 684 tests: 682 pass, **1 fail**, 1 skipped |
| 2e | └ `pnpm build` | `not-run` inside `verify` | — | the `&&` chain stopped at 2d |
| 2f | └ `pnpm verify:self` | `not-run` inside `verify` | — | the `&&` chain stopped at 2d |
| 3 | `pnpm build`, run separately | `executed-pass` | 0 | [`logs/03-build.log`](logs/03-build.log) |
| 4 | `pnpm verify:self`, run separately | `executed-pass` | 0 | [`logs/04-verify-self.log`](logs/04-verify-self.log) |
| 5 | Checkpoint 1 Step 22 — pack both components | `executed-pass` | 0, 0 | [`logs/05-pack.log`](logs/05-pack.log) |
| 6 | Checkpoint 1 Step 23 — clean packed consumer, explicit path | `executed-pass` | 0 throughout | [`logs/06-consumer-explicit.log`](logs/06-consumer-explicit.log) |
| 7 | Checkpoint 1 Step 23 — one-shot `init --agent-pack`, compared with 6 | `executed-pass` | 0 throughout | [`logs/07-consumer-oneshot.log`](logs/07-consumer-oneshot.log) |
| 8 | Checkpoint 1 Step 23 — one-shot init with a fixture Extension | `executed-pass` | 0 throughout | [`logs/08-consumer-extension.log`](logs/08-consumer-extension.log) |
| 9 | Checkpoint 1 Step 24 — a full fixture Delivery through the adapter | `not-run` | — | needs an agent executor; see *Not run* below |
| 10 | Node 24 leg of the declared support range | `not-run` | — | A1 ran Node 22 only |
| 11 | `pactwright eval` against a real provider | `environment-blocked` | — | see *Not run* below |
| 12 | GitHub Actions result on this SHA | `code-traced` (inspected, not executed) | — | see *Inspected, not executed* below |

Stages 2a–2c are marked `executed-pass` because `verify` is a single `&&`
chain — reaching `pnpm test` is proof the three before it exited 0. Stages 2e
and 2f were **not reached by `verify`**; they are reported separately as checks
3 and 4 precisely so that a later reader cannot mistake "I ran build afterwards"
for "verify passed".

## The failing test

```
not ok 248 - acquire: a side is installed into its own project, not resolved from node_modules
  location: tests/execute.test.ts:5:52 (assertion at tests/execute.test.ts:392)
  error: [{"code":"pack-not-isolated",
           "message":"\"@pactwright/standard@0.0.0\" resolved to
             /private/var/folders/…/pactwright-eval-side-Ax1zs7/node_modules/@pactwright/standard,
             outside the acquired environment; the requested version was not installed"}]
```

**Cause (`code-traced`, then confirmed by a direct probe):**
`src/eval/acquire.ts:57` creates the isolated side with
`mkdtempSync(join(options.workDir ?? tmpdir(), "pactwright-eval-side-"))`, and
`:95` then asserts isolation with `!resolved.value.dir.startsWith(root)`.
`resolvePack` resolves through `createRequire().resolve()`, which returns a
**real** path. On macOS `os.tmpdir()` is `/var/folders/…`, a symlink to
`/private/var/folders/…`, so the resolved directory never starts with `root`
even though it is physically inside it. Probed directly:

```
tmpdir  : /var/folders/s2/…/T
mkdtemp : /var/folders/s2/…/T/probe-xo2CDN
realpath: /private/var/folders/s2/…/T/probe-xo2CDN
equal   : false
```

The test's installer is a fixture copy, so this is **not** a network failure and
not a missing credential. It is a genuine executed failure of the documented
gate on a platform where the temporary directory is a symlink. A1 does not
propose the fix — that belongs to A2's report and to acceptance, not here.

**A1 does not claim this is a product defect of consequence.** It is a defect in
an isolation *check* that fires false-positive; whether it hides a real leak is
exactly the kind of question A2's distribution and verification audits own.

## The skipped test

```
ok 253 - executor: claude-code performs a capability end to end # SKIP
```

Skipped by design. `tests/execute.test.ts:519` documents it: *"The one
end-to-end run against the real tool. It needs authentication and costs money,
so it is opt-in: `PACTWRIGHT_E2E_CLAUDE=1 pnpm test`."* A1 did not set that
variable and did not supply a credential, so this is **`environment-blocked`,
not a pass**. The only test that exercises the real provider executor did not
run, here or in CI.

## What `verify:self` actually proved

Run separately after the build, exit 0. It is worth recording its output
because three identities in it are the reference's replay base:

```
Pactwright 0.0.2 — healthy   (8 checks, all healthy)
Valid: 16 nodes, 12 edges, 4 lineages
  repository_revision:    git:19c66d5f2368932ff05306db1fae8da8ec5810dd
  project_graph_revision: sha256:63253100fa819a3c41f6e66896c3492488633707a8231ae5fe70a088816f16f8
  environment_lock_hash:  sha256:76221cac587d9d6a4451d591a7738e88ceabca2c766eea90599bfc894a4cec68
```

Two consecutive `sync` runs reported all ten generated files unchanged, and
`git diff --exit-code -- .claude .pactwright` was clean.

## Packed-consumer checks

Checkpoint 1 Step 22 built both artefacts from the reference:

| Artefact | sha256 | Entries |
|---|---|---|
| `pactwright-checkpoint-1.tgz` | `58e5c20cf2b13cc884d53881fdc2a88543d8de70a50389f4c168dc54f320f4e5` | 143 |
| `pactwright-standard-checkpoint-1.tgz` | `b43d51a57cf405a83b9354e3c61fc765b0a6aa8f42bc84f2680c4e198ffbfb2a` | 12 |

The runtime archive contains `dist/` plus `package.json`, `README.md` and
`LICENSE` — no `src/`, no tests, no fixtures. The pack archive contains
`pack.yml`, three agent prompts, three skills and its built `dist/`.

**One documented allowance was needed.** The registry publishes only `0.0.1` of
both packages; the reference is `0.0.2`, and the runtime tarball's dependency on
`@pactwright/standard@0.0.2` cannot resolve. The first install therefore failed
with `ERR_PNPM_NO_MATCHING_VERSION`, exactly as it should. Step 23 permits "a
local-package override only if needed before first registry publication", so the
fixture declares one `pnpm.overrides` entry pointing at the packed pack. That is
recorded here rather than quietly applied. Registry state at capture:

```
pactwright            versions: ["0.0.1"]   dist-tags: latest 0.0.1, next 0.0.1
@pactwright/standard  versions: ["0.0.1"]   dist-tags: latest 0.0.1, next 0.0.1
```

With the override in place, all three fixtures ran clean:

- **Explicit path** — `init` → `agent-pack use` → `sync` → `doctor` →
  `validate` → `lifecycle status`, every command exit 0. A second `sync`
  reported all ten files unchanged. `doctor` is *warning*, and the only
  non-healthy check is `package-manager-declaration`: the fixture's
  `package.json` declares no `packageManager`. No action-required finding.
- **One-shot path** — `init --agent-pack @pactwright/standard` in a second
  clean fixture. Its `.claude/` tree, `config.yml`, `lock.yml` and
  `lifecycle.yml` are **identical** to the explicit fixture's, byte for byte.
  Both resolve `environment_lock_hash sha256:76221cac…`, which is also the
  reference repository's own.
- **Extension path** — `init --agent-pack … --with @pactwright/fixture-base` in
  a third fixture, installing the reference's own `fixture-base` extension as a
  local package. `doctor` reports `extensions: 1 enabled: fixture-base@0.1.0`
  and a different lock hash (`sha256:0b3fb904…`), as it must.

Component origins were checked rather than assumed: both packages resolve inside
the fixture's own `node_modules/.pnpm/` store, from the `file:` tarballs, at
version `0.0.2`.

## Not run, and why

| What | Why |
|---|---|
| Step 24 — a full fixture Delivery through the generated commands | Needs an agent to execute `delivery-specification`, `delivery-execution` and `delivery-review`. That is a provider-backed run, not a local command, and A1 is scoped to baseline capture. |
| `pactwright eval` and `eval --baseline/--candidate` | Same reason, plus Step 28's comparison is itself reported unreachable by PR #39 because every released baseline pins an incompatible runtime. A2's verification audit owns testing that claim. |
| The Node 24 leg | A1 ran Node 22 only. A candidate comparison later must cover both declared majors. |
| Anything requiring `ANTHROPIC_API_KEY` or a `claude` headless call | No credential was configured and none was used. |

None of these is a pass. None of them is a failure either — they are undone
work, recorded as undone.

## The planning branch's own gate

`CLAUDE.md` requires `pnpm verify` before committing, so A1 ran it on
`trial/restart-analysis` with its own changes in the working tree:
**`executed-pass`, exit 0**, 562 tests, 0 failures, 0 skipped.
[`logs/09-planning-verify.log`](logs/09-planning-verify.log).

Two differences from the reference matter and are easy to conflate:

- On `main`, `verify` is `format:check && lint && typecheck && test && build`.
  **There is no `verify:self` stage** — it was added by the consolidation commit
  *"fix: repair the self-hosted environment lock and gate it in verify"*, which
  is not on the default branch. So exit 0 here is the complete gate *for this
  branch*, and it is a weaker gate than the reference's.
- `main` has 36 test files and 562 tests; the reference has 43 plus
  `tests/helpers.ts`, and 684 tests. The failing `acquire:` test does not exist
  on `main` — it arrived with *"feature: acquire each evaluation baseline in its
  own environment"*. The failure is therefore new in the consolidation, not a
  pre-existing platform quirk that PR #39 inherited.

## Inspected, not executed

GitHub Actions on the pinned reference SHA, read through the API:

| Check | Conclusion | Completed |
|---|---|---|
| `Node 22` | success | 2026-09-20T22:44:58Z |
| `Node 24` | success | 2026-09-20T22:45:04Z |
| `Verify` (the required context) | success | 2026-09-20T22:45:09Z |

Run <https://github.com/sb-dev/pactwright/actions/runs/35542561540>.

A1 did not execute this run and does not adopt its result. It is recorded
because it is the honest resolution of the contradiction above: the reference's
gate passes on `ubuntu-latest` and fails on this macOS machine, and the failing
test is one whose assertion depends on temporary-directory path semantics.

The workflow is `.github/workflows/ci.yml`, named `CI`. Per runbook §2.1 the
deterministic role may keep that name rather than becoming `trial-ci.yml`; the
actual name is recorded here so I1 does not create a duplicate root
verification pipeline. It runs on `push` to `main` and on `pull_request`, pins
both actions to full commit SHAs, sets `persist-credentials: false`,
`permissions: contents: read` and bounded job timeouts, and collapses the
matrix into one stable required context, `CI / Verify`.
