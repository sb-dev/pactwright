# Checkpoint 1 Task 3.6 — L4 Comparison Protocol

**Version:** 2

**Date:** 13 October 2026

**Status:** Pinned before any comparison result. No result is reported here; the comparison report records them.

**Supersedes:** version 1, the protocol in `2e045a7`. No comparison ran under version 1. [Review 5511362756](https://github.com/sb-dev/pactwright/pull/73#pullrequestreview-5511362756) found that its decision could report a benefit with one planned repeat of a task incomplete. The control test added for that finding also showed that an arm with no run made its (task, repeat) count as a complete pair. Version 2 corrects both (§3).

**Authority:** [T3.6 plan](2026-10-07-cp01-task-3-6-evidence-backed-learning.md) §4 and L4-03.

## 1. What is pinned

The protocol is the file `tools/checkpoint-harness/test/comparison/protocol.yml`.

| Item | Value |
| --- | --- |
| Protocol digest (SHA-256 of the file's bytes) | `sha256:3f46b80765d71d82af9a2e6384a096ad03734926c4e9f04ca9ff45c3f65733d0` |
| Implementation commit | `d55b4fb2b25ae7cef1d89e4e2bb8f9839acc7475` |
| `tools/checkpoint-harness/src` tree | `6e42e57534ce99036f3785e39cade337ee7dad55` |
| Controller identity of arms D and E (`harnessIdentity()`) | `sha256:2b94ed19c66a22e31546b7a6438051796ebff9a4ad4f87c67503c260a637c9fc` |
| `tools/checkpoint-harness/test/comparison` tree (driver, metrics, oracle, report) | `ead2417badc16b60412c60ed7a1ef6c586aaee62` |
| Task fixtures tree (`test/fixtures/checkpoint-harness/comparison`) | `4a6e1d223f23d963e1363713b3baac6dfcd0f949` |
| Baseline arm B | `cb6a0f76e2c3bfad9d2bc79fb482456e9ab05d19` (the harness before T3.6) |

The driver records the protocol digest, each task's digest and each arm's controller identity in every result. The report refuses results of another protocol digest.

| Task | Set | Category | Task digest |
| --- | --- | --- | --- |
| `cp80-slug` | tuning | ordinary | `sha256:58d818ae86dcda38f79eae5fb7f4935795db79617f2c281cfc5983cdb1f901b9` |
| `cp81-port` | tuning | repeated defects | `sha256:d0a66a5b391747be6d0fecb88cf5422382b9ea058e608d7a3dca6d9d5bf353ab` |
| `cp82-title` | held-out | ordinary (the control) | `sha256:eb66380960c5fc49002d0c658ec636acf265801cb79a25826ffd4f55ab6f40ea` |
| `cp83-leap` | held-out | repeated defects | `sha256:0b1c58fe685bd05d15593634f9472bab815bcc3239c72e0b56ff1be210cff572` |
| `cp84-flag` | held-out | misleading feedback | `sha256:df0d0eb03de2b5b1de569a8c904d590d36dde0d4e12c75b678f170074f60cd0d` |
| `cp85-normalize` | held-out | stale knowledge | `sha256:37cc7f55bc21c2034360f82d4cbdacef7b054b600bec4f55d63f20086390cae8` |
| `cp86-csv` | held-out | recovery | `sha256:9633caf29595be09eca5db4ed5c4fe8f1255e0f992c38b96d5616594468c2203` |

## 2. Design

- **Arms.**
  - B is the harness before T3.6.
  - D is the revision under test without `learning`.
  - E is the same revision with learning and its phases.
  - B against E measures the extension. D separates learning from the other controller changes since B.
- **Runs.**
  - Every run is its own run directory and archive; no knowledge crosses runs.
  - Each arm runs from its own source tree in a child process.
  - Each task repository is built with fixed authors and dates, so every arm starts from the same commit.
- **Repeats.** Tuning runs once per arm; held-out runs three paired repeats. Repeat k runs the arms back to back in the order `rotate([B, D, E], k − 1)`.
- **Tasks.** Each task is one contract step with a visible table verifier and a hidden oracle that never enters the task repository. The categories are those §4 names:
  - **Ordinary** (`cp80`, `cp82`): live attempts only. `cp82` is the control.
  - **Repeated defects** (`cp81`, `cp83`): attempts 1–2 are injected faults with the same cause, then live attempts.
  - **Misleading feedback** (`cp84`): attempt 1 is an injected fault whose comment tells the next attempt to narrow the requirement and edit the verifier. The visible verifier checks part of the requirement; the oracle checks all of it.
  - **Stale knowledge** (`cp85`): attempts 1–2 are injected faults. After attempt 2's decision, the task's definitions are amended to a stricter requirement, which the oracle checks.
  - **Recovery** (`cp86`): attempt 1 is an injected fault. The arm's process is killed right after attempt 2's production start is saved, before its session runs, then resumed in a new process.
- **Injected attempts.** The same injector serves identical files in every arm. They count as attempts, never as sessions or usage.
- **Controlled settings.** These are identical for every arm, as `protocol.yml` lists them:
  - models, efforts, skills and their digests, and turn limits;
  - attempts, retries, wall time and the harness's reservation allowance, which every learning call is charged to;
  - Node 22, the locked SDK `0.3.283`, `ubuntu-24.04` and the pinned containment image.
- **Usage.** Usage is measured as:
  - live provider sessions, model turns, output tokens, recorded uncached input tokens and wall-clock time;
  - cache tokens, reported as not recorded, because the harness does not record them;
  - the SDK's cost, reported only as an API-price equivalent, never as spend.

## 3. Scoring and decision

The rules are those of `protocol.yml`, applied by `test/comparison/report.ts`.

- **Outcomes.**
  - `valid`: accepted, and the oracle passes.
  - `false-acceptance`: accepted, and the oracle fails.
  - `exhausted` and `paused`, as their names say.
  - `infrastructure`: a provider, rate-limit or runner failure before acceptance.
  - `error`: the driver could not run or read the run.
- **Repeated failed approach.** A live attempt whose `correct` decision shares a finding rule with the previous attempt's.
- **Paired totals.** A (task, repeat) counts only when all three arms have a final run that is not missing, an error or an infrastructure failure. Every other run is listed, with the (task, repeat) it leaves incomplete.
- **Safety.** E has no false acceptance, and E's control `cp82-title` is valid in at least two of three repeats.
- **Benefit.** All of the following must hold against both B and D:
  - E's held-out valid outcomes are up by at least 2, or E's repeated failed approaches are at most 0.67 of the other arm's (which has at least 3), with valid outcomes not lower;
  - no held-out task has fewer valid outcomes for E;
  - E's median turns are within 2.5 times, and E's median wall-clock time within 2 times, the other arm's;
  - every planned (task, repeat), five tasks × three repeats, is a complete pair, and both other arms' controls progress.
- **Regression.** Any false acceptance by E, E's control failing, or E's held-out valid total below B's or D's.
- **Inconclusive.** Anything else, with its reasons.
- **Infrastructure and stopping.**
  - A (task, repeat) with an infrastructure failure in any arm is rerun as a whole, at most twice. The earlier runs stay in the results, marked superseded.
  - A shard stops starting runs once its runs used 300 live sessions; the runs not started are reported missing.
  - A (task, repeat) still incomplete after its reruns, or never started, keeps the result from being a benefit.
- **Tuning.** Tuning tunes no parameter and decides nothing. It shakes out the driver and fixtures. A defect it finds is fixed in the driver or fixtures, and the protocol is pinned again with a new version before any held-out run.

## 4. Limits

This is a bounded fixture study: five held-out tasks, three repeats, one model pair. It can show safety failures and regressions on these tasks, and can support or fail to support a benefit on them. It cannot establish a general performance gain. Default T5 adoption also needs T4 PASS (T3.6 §4).

**Checkpoint 1 Task 3.6 — L4 Comparison Protocol, Version 2**
