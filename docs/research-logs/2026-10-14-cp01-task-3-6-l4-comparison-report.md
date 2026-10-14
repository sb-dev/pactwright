# Checkpoint 1 Task 3.6 — L4 Comparison Report

**Date:** 14 October 2026

**Status:** Result of the pinned comparison at the evidence revision. It is evidence for review, not acceptance of L4, T4 or T5.

**Authority:** [T3.6 plan](2026-10-07-cp01-task-3-6-evidence-backed-learning.md) §4 and L4-03; [comparison protocol, version 5](2026-10-13-cp01-task-3-6-l4-comparison-protocol.md).

## 1. What ran

| Item | Value |
| --- | --- |
| Revision | `73293a85182e19e0de36520c0b1b829295cbca1c` |
| `tools/checkpoint-harness/src` tree | `4ad4e421d6ae2e5355891ab6f2667b7d3e3122d9` |
| Controller identity of arms D and E | `sha256:eada55ef10b58c50bc07cbe7c0bd342e2a5c8162bf6c6fb165857cdefd39addd` |
| Protocol | version 5, `sha256:4becd9031f57f8e05f9cc541d096a64f82a48ebda74c8f5a8f945c274e0def17` |
| Tuning run | [38546624222](https://github.com/sb-dev/pactwright/actions/runs/38546624222), run attempt 1 |
| Held-out run | [38550323635](https://github.com/sb-dev/pactwright/actions/runs/38550323635), run attempt 1 |
| Held-out report artifact | `comparison-held-out-report`, ID 11887699290, `sha256:af56b615504fc63028c4fbf101d2bd00e82d60b23e29be489e9546e4a04dc5d2` |
| `report.md` | `sha256:25fdec23427ce838e1aedfe82f3ba2338a84e1377512bc3c7841fb8fa482e5e7` |
| `verdict.json` | `sha256:0e444d1c845f3cddd98dc15bd9a272b778649d84d6e881594e224be4a066e237` |

Held-out jobs and their artifacts (every job ran once and succeeded):

| Task | Job | Artifact | Digest |
| --- | --- | --- | --- |
| `cp82-title` | 115806580895 | 11886429527 | `sha256:29f3c3ee08b70cb46396cf248ffe9081d59bd947de470479ba43aa20c67f5cf3` |
| `cp83-leap` | 115806581014 | 11887420349 | `sha256:0968581b429e530e11898578fdda66f0af00fed10b0722033e03e06ca9c02f8c` |
| `cp84-flag` | 115806580982 | 11887995155 | `sha256:c6fd5747b99b5084fa2a3723c17f68d6a2b41c634876656b66a752e4efa2cdf6` |
| `cp85-normalize` | 115806581077 | 11887214208 | `sha256:de9161e92f61ca02e6f3f73a76547307492d3a83e6a744a078a90766c062f917` |
| `cp86-csv` | 115806581126 | 11887862894 | `sha256:f286347d8c56627da32dbc2145e1883ab20d979cd5edef056ecc3b6fcc130dc8` |
| report | 115820387935 | 11887699290 | `sha256:af56b615504fc63028c4fbf101d2bd00e82d60b23e29be489e9546e4a04dc5d2` |

Each artifact holds the task's results and every run's archive with its digest. The report lists all 45 runs.

## 2. Decision

**The pinned decision is inconclusive.** The report's reasons:

- against B: valid outcomes 12 vs 12 (needs +2) and repeated failed approaches 0 vs 0 (needs at most 0.67 of at least 3);
- against B: `cp83-leap` has fewer valid outcomes (1 vs 2);
- against D: valid outcomes 12 vs 12 (needs +2) and repeated failed approaches 0 vs 0 (needs at most 0.67 of at least 3);
- against D: `cp83-leap` has fewer valid outcomes (1 vs 3).

No regression rule applies:

- **Safety:** no arm accepted a candidate that the hidden oracle rejects. The control `cp82-title` was valid in 3 of 3 repeats in every arm.
- **Valid totals:** E's held-out valid total (12) equals B's and D's.
- **Completeness:** every planned (task, repeat) has a complete B, D and E pair. No run is missing, failed on infrastructure or was rerun.
- **Benefit:** not supported.

The thresholds and the fixtures are those pinned before the version 5 runs. Nothing changed after the results.

## 3. Totals

| Arm | Runs | Valid | False acceptances | Paused | Exhausted | Repeated failed approaches | Median sessions | Median turns | Median time (s) | Output tokens | API-price equivalent (USD) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| B | 15 | 12 | 0 | 3 | 0 | 0 | 4 | 26 | 68 | 90,562 | 4.09 |
| D | 15 | 12 | 0 | 3 | 0 | 0 | 4 | 27 | 67 | 77,420 | 3.56 |
| E | 15 | 12 | 0 | 3 | 0 | 0 | 7 | 42 | 104 | 118,142 | 6.79 |

- **Sessions:** B used 65 live sessions in total, D 58 and E 93. 36 of E's sessions were learning sessions.
- **Cache tokens:** the harness does not record them.
- **API-price equivalent:** the SDK's price-weighted token count. It is not a bill.

| Task | B valid | D valid | E valid |
| --- | --- | --- | --- |
| `cp82-title` | 3 | 3 | 3 |
| `cp83-leap` | 2 | 3 | 1 |
| `cp84-flag` | 3 | 2 | 3 |
| `cp85-normalize` | 1 | 1 | 2 |
| `cp86-csv` | 3 | 3 | 3 |

## 4. Analysis (not part of the decision)

- **Where every pause happened.**
  - All 9 paused runs (B 3, D 3, E 3) paused at an injected attempt, before any live attempt. None had a learning session.
  - 8 paused at attempt 1.
  - `cp85-normalize` repeat 1 in B paused at attempt 2, its second injected attempt, after an incomplete review. B has no learning phases.
  - Attempt 1 runs the same code in D and E: no learning context exists yet, and learning phases run only after a decision.
- **Why they paused.** The causes apply to every arm:
  - **Incomplete reviews (8 runs).** The live reviewer listed the automated table target under `targets`. The harness rejects such a verdict as incomplete, and one that judged against the candidate pauses for the owner (protocol §5.1; T4 observation 2 on #73).
  - **Rejected `cp85-normalize` table (3 runs).** The live adequacy reviewer rejected the table, so the run paused for the owner (§5 below).
  - Two runs had both causes.
- **`cp83-leap`.** E's two pauses there (repeats 1 and 3) were attempt-1 pauses from incomplete reviews, as was B's in repeat 1.
- **Past attempt 1.**
  - B: 13 runs passed attempt 1, and 12 of them were valid. The other is the attempt-2 pause above.
  - D: 12 of 12 valid. E: 12 of 12 valid.
  - Every run that reached a live attempt was valid, in every arm. No E run paused at an exploration routing.
- **What the comparison shows.**
  - The comparison detected no effect of learning on whether a task completes. The differences between E and D lie in attempt-1 pauses that learning does not reach.
  - It does show what learning added. Against D:
    - median sessions: 1.75 times;
    - median turns and median time: about 1.55 times each;
    - output tokens: about 1.5 times;
    - API-price equivalent: about 1.9 times.
  - No run had a repeated failed approach as protocol §3 defines it.

## 5. Fixture defect kept from version 4

`cp85-normalize`'s visible table writes its inner Unicode space separators, as in `a  b` with two U+2003, as raw characters. They read like ASCII spaces.

Version 4's held-out run exposed the defect. Version 5 keeps the fixtures unchanged, so nothing is tuned on held-out results (protocol, held-out tasks already seen).

In version 5, the live adequacy reviewer rejected the table in 3 of 15 runs, one in each arm: B repeat 3, D repeat 2 and E repeat 1. A later protocol would write such characters as `\u` escapes.

## 6. Tuning (version 5)

Tuning run 38546624222 decides nothing. Its report artifact is 11884854428 (`sha256:20b21637849535d934d072e291af411f34eee8b2540987695a153232f588e361`).

- All 15 runs were valid: five tasks, once in each arm.
- No pause, driver defect or fixture defect appeared, so the held-out set ran at this revision.

## 7. Version 4 result (superseded)

Version 4 ran the same tasks, settings and rules at revision `3dde90be8b59c78890254a3e2968320765ebd5fe`, `src` tree `6e42e57534ce99036f3785e39cade337ee7dad55`.

| Item | Value |
| --- | --- |
| Protocol | version 4, `sha256:1ac02ab0329aa43a64ed4aa03f777723da5068d9b9a097486bdde7bc46c3eece` |
| Tuning run | [38525130338](https://github.com/sb-dev/pactwright/actions/runs/38525130338); report artifact 11875704958, `sha256:ae1f6d77072f5d37346f006555dd0637dfdcd094eaa5e874c760542e0134badd` |
| Held-out run | [38527563605](https://github.com/sb-dev/pactwright/actions/runs/38527563605) |
| Held-out report artifact | 11877598027, `sha256:42187a02e622906d8ffbbfb2dcedbdfce2f95b0192a33f3884814c5e13caf132` |
| `report.md` / `verdict.json` | `sha256:fd0bf8d7d8e7bcddc7df15fa363259bdc4eb845686c1b76f98a980dc1d6b336c` / `sha256:a72eb31c66461f155b70ee937ec2ec52841a8c8887e79138220b54288d69cce6` |
| Held-out task artifacts | `cp82` 11877381696, `cp83` 11877281859, `cp84` 11878015892, `cp85` 11877496453, `cp86` 11878053076 |

- **Decision: regression.** E's held-out valid total (10) was below D's (12); B had 10.
- **Safety and completeness:** no false acceptance; the control was valid 3 of 3 in every arm; all 15 pairs were complete.
- **Pauses:** all 13 paused runs (B 5, D 3, E 5) paused at attempt 1, with no live attempt and no learning session.
  - Incomplete reviews: 10 runs.
  - The rejected `cp85` table: 7 runs.
- **Usage:**
  - medians: sessions B 4, D 4, E 6; turns 28, 27, 33; time 66, 65, 102 s;
  - API-price equivalent: 3.28, 3.51, 6.36.
- **Why version 5 superseded it.** The hosted learning proof then found that the controller refused a selection review citing a candidate path with a line. Commit `8d6d88f` changed that, and with it the revision under test.

No version 4 run paused at an exploration routing, so that change does not explain the different decisions. Both decisions rest on a few pauses at injected attempts, before any live attempt or learning session, that every arm shares. In both versions, E's and D's pauses were all at attempt 1:
- version 4: E 5 against D 3;
- version 5: 3 each.

## 8. Consequences

- **T5 adoption.** The comparison supports no benefit; its pinned result is inconclusive.
  - `cp01-t5.yml` keeps learning off, as T3.6 §4 requires without T4 PASS and a supported benefit.
- **For T4-A.** The pauses that decided both versions come from harness behaviour every arm shares: incomplete reviews (T4 observation 2) and an adequacy review misreading a table.
  - Until T4 addresses them, a comparison of this size has little power to show a learning effect.

## 9. Limits

- This is a bounded fixture study: five held-out tasks, three repeats and one model pair.
- Its counts are small, and its held-out tasks were already run once, under version 4.
- It cannot establish a general performance gain or loss.

**Checkpoint 1 Task 3.6 — L4 Comparison Report**
