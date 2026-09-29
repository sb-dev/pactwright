# Bootstrap fixture source

The fixture of the T3-F bootstrap demonstration (Task 3 research log §12
T3-F): checkpoint CP97 in `../docs/checkpoints/97-bootstrap`, whose authority
is `../docs/specs/bootstrap-spec.md`. It is not Checkpoint 1 acceptance.

- `verifiers/` implements the CP97 bindings of `test/bootstrap-fixtures.ts`
  with the subject/judge split of `../verification/README.md`. The library
  subject runs `library-driver.mjs` in a child process under Node's
  permission model. The driver reads a one-time nonce and the case input
  from stdin, then loads the candidate library in a V8 realm of its own,
  linked only to modules under `src/`: no `process`, built-in modules,
  timers or output, and no access to the driver's objects. The subject takes
  its facts only from the one output line that starts with the nonce; all
  other child output is untrusted, so a candidate cannot write a report. The command subject stages each case's path in a
  fresh temporary directory, runs the command as a program and compares the
  path before and after. Judges never run candidate code.
- `candidates/` holds the known-good submissions of the scripted producers
  and the two injected faults. Each injected fault is labelled
  `INJECTED FAULT` in its first line: it is seeded by the tests to exercise
  verification and review correction and is never a model's output.
