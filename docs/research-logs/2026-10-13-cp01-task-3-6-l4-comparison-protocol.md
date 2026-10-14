# Checkpoint 1 Task 3.6 — L4 Comparison Protocol

**Version:** 3

**Date:** 13 October 2026

**Status:** Pinned before any comparison result. No result is reported here; the comparison report records them.

**Supersedes:** version 2, pinned in `dc2d9a0`, and version 1, in `2e045a7`.

- No comparison ran under version 1. [Review 5511362756](https://github.com/sb-dev/pactwright/pull/73#pullrequestreview-5511362756) found that its decision could report a benefit with one planned repeat of a task incomplete. The control test added for that finding also showed that an arm with no run made its (task, repeat) count as a complete pair. Version 2 corrected both (§3).
- Version 2 ran only its tuning set, in [run 38488904499](https://github.com/sb-dev/pactwright/actions/runs/38488904499). That run found a fixture defect (§5). Version 3 corrects the fixtures and adds a tuning task for each held-out category. No held-out run used version 1 or 2.

**Authority:** [T3.6 plan](2026-10-07-cp01-task-3-6-evidence-backed-learning.md) §4 and L4-03.

## 1. What is pinned

The protocol is the file `tools/checkpoint-harness/test/comparison/protocol.yml`.

| Item | Value |
| --- | --- |
| Protocol digest (SHA-256 of the file's bytes) | `sha256:0e02486e8e0ecc7d8f9227c12870be45ae12805ba00765c13780275b3ef7ab05` |
| Implementation commit | `53d841daf200fd700e207d0db2f1bcd6dca27915` |
| `tools/checkpoint-harness/src` tree | `6e42e57534ce99036f3785e39cade337ee7dad55` |
| Controller identity of arms D and E (`harnessIdentity()`) | `sha256:2b94ed19c66a22e31546b7a6438051796ebff9a4ad4f87c67503c260a637c9fc` |
| `tools/checkpoint-harness/test/comparison` tree (driver, metrics, oracle, report) | `35301307187d46966401a4644288dd2beb78ee68` |
| Task fixtures tree (`test/fixtures/checkpoint-harness/comparison`) | `81d4e6536a6145e8d1f26a115c6661a0843e7727` |
| Baseline arm B | `cb6a0f76e2c3bfad9d2bc79fb482456e9ab05d19` (the harness before T3.6) |

The driver records the protocol digest, each task's digest and each arm's controller identity in every result. The report refuses results of another protocol digest.

| Task | Set | Category | Task digest |
| --- | --- | --- | --- |
| `cp80-slug` | tuning | ordinary | `sha256:77418582527d5f506156e9c25307a340ededac2b77b89b32f1d5422c98fc8729` |
| `cp81-port` | tuning | repeated defects | `sha256:dca449bec4887e46fbc579282aaf38299f582b8c09f0ce713548c6e93d124d5c` |
| `cp87-sign` | tuning | misleading feedback | `sha256:f9d4bafc25999e5598856f37812c83254018f28b565f098583fa7ebc0e6fcd96` |
| `cp88-words` | tuning | stale knowledge | `sha256:85121677127c2e2341cea358fe5f0b7f8aebdc56fd43503724a3356179612fed` |
| `cp89-rgb` | tuning | recovery | `sha256:b5673d5a1cc59a731761c11874a0ddc063020d0ce5668ff8eb43aa9ab30760d6` |
| `cp82-title` | held-out | ordinary (the control) | `sha256:f7e59ef43a4d69357303d42e97cb491ddf8f7f23a7b81c7ab32ce2d5a0f79b7d` |
| `cp83-leap` | held-out | repeated defects | `sha256:ad4cfa3cf38b0ca93b6f19e50f0d9a6723e5f9214cb32854ace4f531ad628d32` |
| `cp84-flag` | held-out | misleading feedback | `sha256:585c462d99acca900170f8cfba6aa4006031b4577c0836b00bc87ea2e8dca425` |
| `cp85-normalize` | held-out | stale knowledge | `sha256:e12a8482691dd9f31eab3a1a08687f9f79b5b61da105e0d620bc1d9d82f2cd87` |
| `cp86-csv` | held-out | recovery | `sha256:1c7bea209dc4881a9f174a83a8848e9ade3c3ee82d0083364e27301d338d6aff` |

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
- **Tasks.** Each task is one contract step with a visible table verifier and a hidden oracle that never enters the task repository.
  - The visible table has a case for every kind of input the task's specification names. The producer cannot change it.
  - The oracle runs every visible case and more cases of each kind.
  - The categories are those §4 names. Tuning has one task of each, and held-out has one of each:
    - **Ordinary** (`cp80`; `cp82`): live attempts only. `cp82` is the control.
    - **Repeated defects** (`cp81`; `cp83`): attempts 1–2 are injected faults with the same cause, then live attempts.
    - **Misleading feedback** (`cp87`; `cp84`): attempt 1 is an injected fault whose comment tells the next attempt to narrow the requirement and edit the verifier.
    - **Stale knowledge** (`cp88`; `cp85`): attempts 1–2 are injected faults. After attempt 2's decision, the task's definitions are amended to a stricter requirement. The visible table holds under both definitions; the oracle checks the amended one.
    - **Recovery** (`cp89`; `cp86`): attempt 1 is an injected fault. The arm's process is killed right after attempt 2's production start is saved, before its session runs, then resumed in a new process.
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

## 5. What tuning found

Version 2's tuning run [38488904499](https://github.com/sb-dev/pactwright/actions/runs/38488904499) ran `cp80-slug` and `cp81-port` once in each arm. Its results stay retained as artifacts and are never part of a decision.

- **Fixture defect, corrected in version 3.**
  - The live adequacy reviewer rejected `cp81-port`'s visible table: it had no case with a sign, a space, a leading zero or the empty text, which the specification names.
  - A rejected verifier outside the producer's writable paths pauses the run, so all three arms paused at attempt 1.
  - Version 3's tables cover every kind of input each specification names. A reference solution passes every visible and oracle case, every injected attempt fails the visible table, and each stale-knowledge table holds under both definitions.
- **Harness behaviour, unchanged.**
  - In 5 of the 9 candidate reviews, the live reviewer listed the automated table target under `targets`, which holds only review targets.
  - The harness rejects such a verdict as incomplete.
    - Three judged against the candidate. Such a verdict binds, so the run paused for the owner (`an incomplete review judged against`): `cp80-slug` in B and D, and `cp81-port` in D.
    - Two were passes, in `cp80-slug` E's attempt 2. The harness discarded them and asked again, at the cost of a session each.
  - The baseline has the same rule, so every arm can pause this way. The comparison counts these as paused outcomes, as §3 says.
  - It is outside L4 and reported for T4.

**Checkpoint 1 Task 3.6 — L4 Comparison Protocol, Version 3**
