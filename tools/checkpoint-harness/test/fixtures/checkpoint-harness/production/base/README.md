# Production verification fixture

The base repository of the T3.5 H1 fixture checkpoint CP96 (Task 3.5 research
log §3 H1). `npm run build` builds `src/` into `dist/`; `npm test` tests the
built modules with the vendored dependency `fixture-format` the lockfile
pins. The harness prepares that dependency in a contained workspace and mounts
it read-only; build output is produced in each verifier workspace, never taken
from the candidate or the host. Fixture verifiers are not Checkpoint 1 product
verifiers.
