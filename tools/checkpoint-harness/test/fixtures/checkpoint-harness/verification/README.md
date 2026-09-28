# Verification fixture source

The base source of the T3-D verification fixture (Task 3 research log §12
T3-D). Candidates add `src/parser.mjs` and `src/command.mjs`. The verifiers
implement the fixture bindings of `test/verification-fixtures.ts`. Each
binding's subject runs once per target, as the only process in its own
candidate workspace, with the target key on stdin; it has no report path. Its
exit status and stdout are the behaviour observed. The judge runs in a
workspace holding only the binding's files, reads the labelled runs as JSON
on stdin, reduces each to primitive facts and writes one result per target to
stdout. Fixture verifiers are not Checkpoint 1 product verifiers.
