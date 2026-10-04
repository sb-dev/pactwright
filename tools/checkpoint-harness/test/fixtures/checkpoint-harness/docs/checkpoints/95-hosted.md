# Checkpoint 95 — Hosted fixture

The T3.5 H3 hosted-run fixture: one contract step and two reviewed
operational steps kept in prose, the second run in another repository. Not a
Pactwright checkpoint: its authority is the
[hosted fixture specification](../specs/hosted-spec.md).

## Stage 1 — Greet

### Step 1 — Write the greeting module

Contract: [CP95-S01](95-hosted/CP95-S01.yml). Deliverable: `greeting`, the
module `tools/checkpoint-harness/test/fixtures/checkpoint-harness/hosted/work/greeting.mjs`.

## Stage 2 — Stamp

The stamp stage records which greeting the candidate holds.

### Step 2 — Stamp the greeting

**Run**

From the candidate root, run:

```bash
node tools/checkpoint-harness/test/fixtures/checkpoint-harness/hosted/stamp.mjs
```

It writes `tools/checkpoint-harness/test/fixtures/checkpoint-harness/hosted/work/STAMP.txt` from the greeting module.

**Expected result**

`tools/checkpoint-harness/test/fixtures/checkpoint-harness/hosted/work/STAMP.txt` holds the line `stamp: Hello, Pactwright!` and a newline, and nothing else.

**Verify before continuing**

- the command exited 0 and printed the line it wrote;
- `tools/checkpoint-harness/test/fixtures/checkpoint-harness/hosted/work/STAMP.txt` matches the greeting module's greeting of `Pactwright`.

## Stage 3 — Record

The record stage notes the release in the registry, a separate repository.

### Step 3 — Record the release

**Run**

From the root of the registry repository, run:

```bash
node record.mjs CP95
```

It appends the line `released: CP95` to `RELEASES.md`.

**Expected result**

The last line of `RELEASES.md` is `released: CP95`.

**Verify before continuing**

- the command exited 0 and printed the line it appended;
- `RELEASES.md` keeps every earlier line.

## Exit gate

Every step is accepted.
