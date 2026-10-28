# Hosted fixture source

The base of checkpoint CP95, the T3.5 H3 hosted-run fixture
(`../docs/checkpoints/95-hosted`). It is not Checkpoint 1 acceptance.

- `bindings/` declares `hosted.greets`, delivered with the greeting
  capability; the harness admits it before any of its results count.
- `verifiers/` implements it with the subject/judge split of
  `../verification/README.md`: the subject runs the greeting as a program;
  the judge never runs candidate code.
- `stamp.mjs` is the tool the operational Step 2 runs.
- `work/` is the only path a producer may change.

Step 3 runs in another repository, the registry: `../registry` holds its
contents, which tests commit as a repository of their own.
