# Learning fixture source

The base of checkpoint CP94, the T3.6 L4 hosted learning fixture
(`../docs/checkpoints/94-learning`). It is not Checkpoint 1 acceptance.

- `bindings/` declares `learning.names` and `learning.normalizes`; the
  harness admits each before any of its results count.
- `verifiers/` implements them with the subject/judge split: the subject runs
  the module as a program; the judge never runs candidate code.
- `injected/` holds the fixture faults a hosted run's `job.inject` serves as
  producer attempts 1-3 of Step 2. Each starts with the injected-fault header and
  fails the same case for the same cause: a hand-written character class that
  misses Unicode whitespace.
- `work/` is the only path a producer may change.
