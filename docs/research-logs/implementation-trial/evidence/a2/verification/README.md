# A2-V — verification audit evidence

Everything here was produced on the pinned reference
`19c66d5f2368932ff05306db1fae8da8ec5810dd` plus the A2-V overlay commit, which
adds no production file. The report that reads it is
[`../../../analysis/verification.md`](../../../analysis/verification.md); the
probes that produce it are in
[`tools/implementation-trial/a2/verification/`](../../../../../../tools/implementation-trial/a2/verification/).

No file here is a summary of another agent's work, and no status is inherited
from PR #39 or from a CI badge.

| File | What it holds | How to reproduce it |
|---|---|---|
| [`baseline-on-linux.md`](baseline-on-linux.md) | the reference's own `pnpm test` on this platform, and why it differs from A1's | `pnpm test` |
| [`probe-suite.txt`](probe-suite.txt) | the nineteen probe results behind V01–V11 | `node --test --import tsx tools/implementation-trial/a2/verification/*.probe.ts` |
| [`fault-seeds.tsv`](fault-seeds.tsv) | twenty-two seeded defects, with `KILLED`/`SURVIVED`/`REJECTED` per seed | `bash tools/implementation-trial/a2/verification/fault-seeds.sh` |
| [`dead-executor-suite.txt`](dead-executor-suite.txt) | per-assertion results when the executor cannot run at all | the `V03c` probe |
| [`eval-misattribution.txt`](eval-misattribution.txt) | `pactwright eval`'s own output with a declared-but-absent executor | `bash tools/implementation-trial/a2/verification/eval-misattribution.sh` |
| [`incompatible-baseline.txt`](incompatible-baseline.txt) | Step 28's comparison executed, and the published `0.0.1` pack inspected | the command is in the file |
| [`repeated-work.txt`](repeated-work.txt) | file opens and subprocess spawns per public command | `bash tools/implementation-trial/a2/verification/repeated-work.sh` |
| [`registry-calls.txt`](registry-calls.txt) | the live registry queries the test suite makes, and the offline result | in the file |
| [`boundaries.txt`](boundaries.txt) | what the two tarballs contain, and the gate run with no network | `bash tools/implementation-trial/a2/verification/boundaries.sh` |
| [`doctor-checks.json`](doctor-checks.json) | the eight checks `doctor` runs, none of them about execution | `node dist/cli.js doctor --json` |
| [`complexity.txt`](complexity.txt) | per-file complexity, and where A1's source accounting can be gamed | `node --import tsx tools/implementation-trial/a2/verification/complexity.ts --root .` |

## Two discarded runs, recorded so they are not mistaken for findings

Both are cases where the first measurement was an artefact of this machine
rather than a property of the reference. Neither is evidence of anything.

1. **Seventeen offline failures, not five.** The first network-namespace run of
   `pnpm test` failed seventeen tests. Twelve were this sandbox's git
   commit-signing helper, which calls a local service over loopback that the
   namespace cannot reach. With signing disabled, five fail — and those five are
   the product's real registry dependency. See
   [`registry-calls.txt`](registry-calls.txt).

2. **"13 passed, 9 failed", not "11 passed, 9 failed".** The first
   `eval` misattribution run left the machine's real `PATH` in place, and this
   machine happens to have a `claude` binary, so the run invoked the tool for
   real. The committed evidence runs under `env -i PATH=<empty dir>`. See
   [`baseline-on-linux.md`](baseline-on-linux.md).

Three fault seeds were also initially recorded as `KILLED` when what rejected
them was `tsc`, not a test. The harness now typechecks each seed first and
reports `REJECTED` separately; after making those three type-safe, all three are
genuinely killed. A compiler rejection is not test coverage, and counting it as
one is how a mutation score flatters a suite.
