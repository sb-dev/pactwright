# Verification fixture source

The base source of the T3-D verification fixture (Task 3 research log §12
T3-D). Candidates add `src/parser.mjs` and `src/command.mjs`. The verifiers
implement the fixture bindings of `test/verification-fixtures.ts`. Each
binding's subject runs the code under test in the candidate workspace, once
per target named in `PACTWRIGHT_TARGET`, and prints what it observed; it has
no report path. The controller labels each run with its target. The judge
runs in a workspace holding only the binding's files, reads the labelled runs
as JSON on stdin and writes one result per target to stdout. Fixture verifiers are not Checkpoint 1
product verifiers.
