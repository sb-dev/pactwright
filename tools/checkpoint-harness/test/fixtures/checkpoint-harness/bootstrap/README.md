# Bootstrap fixture source

The fixture of the T3-F bootstrap demonstration (Task 3 research log §12
T3-F): checkpoint CP97 in `../docs/checkpoints/97-bootstrap`, whose authority
is `../docs/specs/bootstrap-spec.md`. It is not Checkpoint 1 acceptance.

- `verifiers/` implements the CP97 bindings of `test/bootstrap-fixtures.ts`
  with the subject/judge split of `../verification/README.md`. The library
  subject imports the candidate library in a child process that reports on
  file descriptor 3. The command subject stages each case's path in a fresh
  temporary directory, runs the command as a program and compares the path
  before and after. Judges never run candidate code.
- `candidates/` holds the known-good submissions of the scripted producers
  and the two injected faults. Each injected fault is labelled
  `INJECTED FAULT` in its first line: it is seeded by the tests to exercise
  verification and review correction and is never a model's output.
