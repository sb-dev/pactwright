# Verification fixture source

The base source of the T3-D verification fixture (Task 3 research log §12
T3-D). Candidates add `src/parser.mjs` and `src/command.mjs`. The verifiers
implement the fixture bindings of `test/verification-fixtures.ts`: the
controller runs each with `PACTWRIGHT_BINDING` and `PACTWRIGHT_REPORT` set, and
each writes one result per target of that binding to the report. Fixture
verifiers are not Checkpoint 1 product verifiers.
