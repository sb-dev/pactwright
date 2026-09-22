# A2-V — the reference's own gate on this platform

Run on the pinned reference `19c66d5f2368932ff05306db1fae8da8ec5810dd` plus the
A2-V overlay commit, which adds no production file.

## `pnpm test`

```
# tests 684
# suites 0
# pass 683
# fail 0
# cancelled 0
# skipped 1
# todo 0
# duration_ms 21022.130959
EXIT=0
```

`executed-pass`, exit 0. **684 tests, 683 passing, 1 skipped, 0 failing.**

## Why this differs from A1

A1 recorded `executed-fail`, exit 1, on macOS: `acquire: a side is installed
into its own project, not resolved from node_modules` failed because
`os.tmpdir()` is a symlink there and `resolvePack` returns a real path, so
`resolved.value.dir.startsWith(root)` is false for a directory physically inside
`root` ([`../../a1/baseline-checks.md`](../../a1/baseline-checks.md)).

This machine's `os.tmpdir()` is `/tmp`, not a symlink, so the same assertion
holds and the test passes. **Both A1's result and this one are correct on their
platform**, and the test is the thing that is wrong: it asserts a path-prefix
relation that is only true where the temporary directory is not a symlink.

That is recorded here because it changes what A2-V can claim. Every finding
below was reproduced on a run whose baseline is green, so a failure this audit
reports is the audit's seed or the audit's composition, never an inherited red.

## Environment

| | |
|---|---|
| Node | `v22.22.2` |
| `pnpm` | `11.7.0` (matches the reference's `packageManager`) |
| Platform | Linux 6.18.44, x86_64 |
| `os.tmpdir()` | `/tmp`, not a symlink |
| `claude` on PATH | yes, `/opt/node22/bin/claude` — **not used**; see below |

## The end-to-end executor test is still not run

`tests/execute.test.ts:523`, `executor: claude-code performs a capability end to
end`, is skipped unless `PACTWRIGHT_E2E_CLAUDE=1`. It was **not** set and no
credential was supplied, so the status is `environment-blocked`, exactly as A1
recorded. The only test that exercises the real provider executor did not run
here either.

A `claude` binary happens to be on this machine's PATH. An early attempt at the
`eval` misattribution probe left the real PATH in place and therefore invoked
the tool for real; that run is discarded and is **not** the evidence in
[`eval-misattribution.txt`](eval-misattribution.txt), which runs under
`env -i PATH=<empty dir>` so the binary cannot be resolved. The discarded run is
mentioned because its numbers (13 passed, 7 failed) differ from the real
probe's (11 passed, 9 failed), and a reader comparing the two should know why.
