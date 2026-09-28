# Verification fixture source

The base source of the T3-D verification fixture (Task 3 research log §12
T3-D). Candidates add `src/parser.mjs` and `src/command.mjs`. The verifiers
implement the fixture bindings of `test/verification-fixtures.ts`. Each
binding's subject runs in the candidate workspace once per target, under the
Node permission model. It reads a fresh seal and the target key from stdin
before any code under test loads, exercises that code, and writes its
observation on a stdout line that begins with the seal; it has no report
path. Only sealed lines count, and the controller labels them with the run's
target. The judge runs in a workspace holding only the binding's files, reads
the labelled observations as JSON on stdin and writes one result per target
to stdout. Fixture verifiers are not Checkpoint 1
product verifiers.
