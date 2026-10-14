# Checkpoint 1 Task 3.6 — L4 Comparison Protocol

**Version:** 5

**Date:** 14 October 2026

**Status:** Pinned before any version 5 result. No result is reported here; the comparison report records them.

**Supersedes:** version 4, pinned in `3dde90b`; version 3, pinned in `9e57ae6`; version 2, pinned in `dc2d9a0`; and version 1, in `2e045a7`.

- No comparison ran under version 1. [Review 5511362756](https://github.com/sb-dev/pactwright/pull/73#pullrequestreview-5511362756) found that its decision could report a benefit with one planned repeat of a task incomplete. The control test added for that finding also showed that an arm with no run made its (task, repeat) count as a complete pair. Version 2 corrected both (§3).
- Version 2 ran only its tuning set, in [run 38488904499](https://github.com/sb-dev/pactwright/actions/runs/38488904499). That run found a fixture defect (§5). Version 3 corrected the fixtures and added a tuning task for each held-out category.
- Version 3 ran only its tuning set, in [run 38491518842](https://github.com/sb-dev/pactwright/actions/runs/38491518842). That run found two more fixture defects (§5), which version 4 corrects.
- No held-out run used versions 1–3.
- Version 4 ran its tuning set in [run 38525130338](https://github.com/sb-dev/pactwright/actions/runs/38525130338) and its held-out set in [run 38527563605](https://github.com/sb-dev/pactwright/actions/runs/38527563605), at revision `3dde90b`. The comparison report records its result, which stays as it is.
- The hosted learning proof then showed that the controller refused a selection review citing a candidate path with a line, such as `normalize.mjs:5`, and paused the run. Commit `8d6d88f` accepts such a citation when the file has those lines. Version 5 runs version 4's tasks, settings and rules on that revision.

**Held-out tasks already seen.** Version 4 ran the held-out tasks, and its results were read before version 5 was pinned. Version 5 changes no task, fixture, driver, setting or threshold, so nothing is tuned on those results. The `cp85-normalize` table defect that version 4's held-out run exposed (comparison report §5) stays unchanged for the same reason.

**Authority:** [T3.6 plan](2026-10-07-cp01-task-3-6-evidence-backed-learning.md) §4 and L4-03.

## 1. What is pinned

The protocol is the file `tools/checkpoint-harness/test/comparison/protocol.yml`.

| Item | Value |
| --- | --- |
| Protocol digest (SHA-256 of the file's bytes) | `sha256:4becd9031f57f8e05f9cc541d096a64f82a48ebda74c8f5a8f945c274e0def17` |
| Implementation commit | `8d6d88f621fb6c00867f06ec5d83d8921de93500` |
| `tools/checkpoint-harness/src` tree | `4ad4e421d6ae2e5355891ab6f2667b7d3e3122d9` |
| Controller identity of arms D and E (`harnessIdentity()`) | `sha256:eada55ef10b58c50bc07cbe7c0bd342e2a5c8162bf6c6fb165857cdefd39addd` |
| `tools/checkpoint-harness/test/comparison` tree (driver, metrics, oracle, report) | `fed8134bdbb0922088dcc4dde441088fb5a46757` |
| Task fixtures tree (`test/fixtures/checkpoint-harness/comparison`) | `16fcadae510b7471fa9b59764b3302f76cc62c08` (version 4's) |
| Baseline arm B | `cb6a0f76e2c3bfad9d2bc79fb482456e9ab05d19` (the harness before T3.6) |

The driver records the protocol digest, each task's digest and each arm's controller identity in every result. The report refuses results of another protocol digest. The task digests are version 4's.

| Task | Set | Category | Task digest |
| --- | --- | --- | --- |
| `cp80-slug` | tuning | ordinary | `sha256:77418582527d5f506156e9c25307a340ededac2b77b89b32f1d5422c98fc8729` |
| `cp81-port` | tuning | repeated defects | `sha256:dca449bec4887e46fbc579282aaf38299f582b8c09f0ce713548c6e93d124d5c` |
| `cp87-sign` | tuning | misleading feedback | `sha256:0d9929ba115f94253e4dddd9ff8fabd3a0cb165fd24b8e7a54a93fd77753cae9` |
| `cp88-words` | tuning | stale knowledge | `sha256:e8053578e46d9ebcf445624de4414370d1cd6dd1f963e185fd8f0ce39d708180` |
| `cp89-rgb` | tuning | recovery | `sha256:b5673d5a1cc59a731761c11874a0ddc063020d0ce5668ff8eb43aa9ab30760d6` |
| `cp82-title` | held-out | ordinary (the control) | `sha256:f7e59ef43a4d69357303d42e97cb491ddf8f7f23a7b81c7ab32ce2d5a0f79b7d` |
| `cp83-leap` | held-out | repeated defects | `sha256:ad4cfa3cf38b0ca93b6f19e50f0d9a6723e5f9214cb32854ace4f531ad628d32` |
| `cp84-flag` | held-out | misleading feedback | `sha256:bd9059b0bf602af29d5a84c8687816e038293885eed65f16d7fb64146a007e7a` |
| `cp85-normalize` | held-out | stale knowledge | `sha256:24a3fdc89460a298a529f87ce29e4274cdde969b1dec3671df7d495bf2a85413` |
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
    - **Stale knowledge** (`cp88`; `cp85`): attempts 1–2 are injected faults with different causes. Attempt 2 fixes attempt 1's defect and has another, so what was learnt about attempt 1 no longer holds once its candidate has changed.
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
- **Tuning.** Tuning tunes no parameter and decides nothing. It shakes out the driver and fixtures. A defect it finds is fixed in the driver or fixtures, and the protocol is pinned again with a new version before any held-out run. Version 5 runs its tuning set on its revision before its held-out set.

## 4. Limits

This is a bounded fixture study: five held-out tasks, three repeats, one model pair. It can show safety failures and regressions on these tasks, and can support or fail to support a benefit on them. It cannot establish a general performance gain. Default T5 adoption also needs T4 PASS (T3.6 §4).

## 5. What tuning found

### 5.1 Version 2

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

### 5.2 Version 3

Version 3's tuning run [38491518842](https://github.com/sb-dev/pactwright/actions/runs/38491518842) ran its five tuning tasks once in each arm. Its results stay retained as artifacts and are never part of a decision.

- `cp80-slug`, `cp81-port` and `cp89-rgb` were valid in every arm. In `cp89-rgb`, every arm lost its process right after attempt 2's production start and resumed in a new process, as designed.
- **Fixture defect, corrected in version 4: a criterion claimed more than its table.**
  - `cp87-sign`'s criterion said every sign word appears in more than one letter case, but `positive` and `negative` appeared in one each.
  - The live adequacy reviewer rejected the table in every arm, so every arm paused at attempt 1.
  - `cp84-flag` had the same mismatch for `yes`, `on`, `no` and `off`.
  - Version 4's tables give every word of letters at least two letter cases.
- **Driver defect, corrected in version 4: a definitions amendment cannot reach the candidate.**
  - `cp88-words` amended the task's definitions after attempt 2's decision.
  - The run's repository cannot be amended, so the candidate's tree kept the original specification and contract. The live reviewer, and in E the diagnoses, saw the packet's amended requirement contradict them and reported themselves blocked. Every arm paused.
  - Version 4's stale-knowledge tasks change no definitions. Attempt 2 fixes attempt 1's defect and has another one, so what was learnt about attempt 1 becomes historical when its candidate changes. The driver no longer amends.
- The harness behaviour of §5.1 recurred: in `cp87-sign`, two arms' candidate reviews listed the automated target and paused for the owner.

### 5.3 Version 4

Version 4's tuning run [38525130338](https://github.com/sb-dev/pactwright/actions/runs/38525130338) found no driver or fixture defect (comparison report §6), so its held-out set ran.

**Checkpoint 1 Task 3.6 — L4 Comparison Protocol, Version 5**
