# Checkpoint 1 Task 3.6 — L4 Comparison Report

**Date:** 14 October 2026

**Status:** Result of the pinned comparison. It is evidence for review, not acceptance of L4, T4 or T5.

**Authority:** [T3.6 plan](2026-10-07-cp01-task-3-6-evidence-backed-learning.md) §4 and L4-03; [comparison protocol, version 4](2026-10-13-cp01-task-3-6-l4-comparison-protocol.md).

## 1. What ran

| Item | Value |
| --- | --- |
| Revision | `3dde90be8b59c78890254a3e2968320765ebd5fe` |
| `tools/checkpoint-harness/src` tree | `6e42e57534ce99036f3785e39cade337ee7dad55` |
| Protocol | version 4, `sha256:1ac02ab0329aa43a64ed4aa03f777723da5068d9b9a097486bdde7bc46c3eece` |
| Tuning run | [38525130338](https://github.com/sb-dev/pactwright/actions/runs/38525130338), run attempt 1 |
| Held-out run | [38527563605](https://github.com/sb-dev/pactwright/actions/runs/38527563605), run attempt 1 |
| Held-out report artifact | `comparison-held-out-report`, ID 11877598027, `sha256:42187a02e622906d8ffbbfb2dcedbdfce2f95b0192a33f3884814c5e13caf132` |
| `report.md` | `sha256:fd0bf8d7d8e7bcddc7df15fa363259bdc4eb845686c1b76f98a980dc1d6b336c` |
| `verdict.json` | `sha256:a72eb31c66461f155b70ee937ec2ec52841a8c8887e79138220b54288d69cce6` |

Held-out jobs and their artifacts (every job ran once and succeeded):

| Task | Job | Artifact | Digest |
| --- | --- | --- | --- |
| `cp82-title` | 115731561936 | 11877381696 | `sha256:ba7684cc6a8b9da053eb0b58a0c97efd42e8ad551ac7ec4686320510fb8f375f` |
| `cp83-leap` | 115731561824 | 11877281859 | `sha256:95aababd6d1238c7d21b17e72346abdcc21129ccd3bc97de87be672936d56883` |
| `cp84-flag` | 115731561901 | 11878015892 | `sha256:37ca9cb1cf5e1e2eef98bef10718966091718ea81de2a6ca1d206256ff59be50` |
| `cp85-normalize` | 115731561700 | 11877496453 | `sha256:d26ecac738c3be1cb654d79e2149589a6833040e04460b7412534f0aeb696d7f` |
| `cp86-csv` | 115731561832 | 11878053076 | `sha256:d9965b3f98721ef410c5d273e3cd9a918e0d712f34b7e6183edba177efd1f93d` |
| report | 115744083226 | 11877598027 | `sha256:42187a02e622906d8ffbbfb2dcedbdfce2f95b0192a33f3884814c5e13caf132` |

Each artifact holds the task's results and every run's archive with its digest. The report lists all 45 runs.

## 2. Decision

**The pinned decision is regression.** The rule that applies: E's held-out valid total (10) is below D's (12).

- **Safety:** no arm accepted a candidate that the hidden oracle rejects. The control `cp82-title` was valid in 3 of 3 repeats in every arm.
- **Completeness:** every planned (task, repeat) has a complete B, D and E pair. No run is missing, failed on infrastructure or was rerun.
- **Benefit:** not supported.

The thresholds and the fixtures are those pinned before the held-out run. Nothing changed after the results.

## 3. Totals

| Arm | Runs | Valid | False acceptances | Paused | Exhausted | Repeated failed approaches | Median sessions | Median turns | Median time (s) | Output tokens | API-price equivalent (USD) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| B | 15 | 10 | 0 | 5 | 0 | 0 | 4 | 28 | 66 | 73,568 | 3.28 |
| D | 15 | 12 | 0 | 3 | 0 | 0 | 4 | 27 | 65 | 78,163 | 3.51 |
| E | 15 | 10 | 0 | 5 | 0 | 0 | 6 | 33 | 102 | 115,064 | 6.36 |

- **Sessions:** B used 52 live sessions in total, D 57 and E 86. 31 of E's sessions were learning sessions.
- **Cache tokens:** the harness does not record them.
- **API-price equivalent:** the SDK's price-weighted token count. It is not a bill.

| Task | B valid | D valid | E valid |
| --- | --- | --- | --- |
| `cp82-title` | 3 | 3 | 3 |
| `cp83-leap` | 2 | 3 | 2 |
| `cp84-flag` | 2 | 2 | 2 |
| `cp85-normalize` | 1 | 1 | 0 |
| `cp86-csv` | 2 | 3 | 3 |

## 4. Analysis (not part of the decision)

- **Where every pause happened.**
  - All 13 paused runs (B 5, D 3, E 5) paused at attempt 1, which was an injected attempt in every case.
  - None had a live attempt, and none had a learning session.
  - Attempt 1 runs the same code in D and E: no learning context exists yet, and learning phases run only after a decision.
- **Why they paused.** The causes apply to every arm:
  - **Incomplete reviews (10 runs).** The live reviewer listed the automated table target under `targets`. The harness rejects such a verdict as incomplete, and one that judged against the candidate pauses for the owner (protocol §5.1; T4 observation 2 on #73).
  - **Rejected `cp85-normalize` table (7 runs).** The live adequacy reviewer rejected the table, so the run paused for the owner (§5 below).
  - Some runs had both causes.
- **Past attempt 1.** Every run that passed attempt 1 was valid, in every arm (B 10 of 10, D 12 of 12, E 10 of 10).
- **What the comparison shows.**
  - The difference between E and D in valid outcomes lies in attempt-1 pauses that learning does not reach. The comparison therefore detected no effect of learning on whether a task completes.
  - It does show what learning added: E's median sessions were 1.5 times D's, its median time 1.6 times, and its output tokens and API-price equivalent about 1.5 and 1.8 times.
  - No run had a repeated failed approach as protocol §3 defines it.

## 5. Fixture defect found in the held-out run

`cp85-normalize`'s visible table writes its inner Unicode space separators, as in `a  b` with two U+2003, as raw characters. They read like ASCII spaces.

The live adequacy reviewer took the table to have no inner Unicode separator and rejected it in 6 of 9 runs. It rejected it in all three arms, so each arm lost runs. In a seventh run the adequacy verdict was itself incomplete.

The tuning analogue `cp88-words` had the same kind of raw characters but no inner-run case, and passed. Under the protocol, a defect found after held-out results is reported and not corrected for this run. A later protocol version would write such characters as `\u` escapes.

## 6. Tuning (version 4)

Tuning run 38525130338 decides nothing. Its report artifact is 11875704958 (`sha256:ae1f6d77072f5d37346f006555dd0637dfdcd094eaa5e874c760542e0134badd`).

- `cp88-words` and `cp89-rgb` were valid in every arm.
- In `cp80-slug`, `cp81-port` and `cp87-sign`, one arm each paused: D, B and D respectively. Each pause came from incomplete reviews:
  - in `cp80`, five passing reviews were discarded, the last when the protocol's four retries had run out;
  - in `cp81` and `cp87`, a review judged against the candidate.
- No fixture or driver defect appeared, so the held-out set ran at this revision.

## 7. Consequences

- **T5 adoption.** The comparison supports no benefit, and its pinned result is regression. `cp01-t5.yml` keeps learning off, as T3.6 §4 requires without T4 PASS and a supported benefit.
- **For T4-A.** The pauses that decided this comparison come from harness behaviour every arm shares: incomplete reviews (T4 observation 2) and an adequacy review misreading a table. Until T4 addresses them, a comparison of this size has little power to show a learning effect.

## 8. Limits

- This is a bounded fixture study: five held-out tasks, three repeats and one model pair.
- Its counts are small. Two runs decide the regression, and both paused before learning could act.
- It cannot establish a general performance gain or loss.

**Checkpoint 1 Task 3.6 — L4 Comparison Report**
