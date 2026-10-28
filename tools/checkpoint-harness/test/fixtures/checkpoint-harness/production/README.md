# Production verification fixture

T3.5 H1 fixtures (Task 3.5 research log §3 H1) for checkpoint CP96:

- `base/` is the repository a run starts from: a build of `src/` into
  `dist/`, a gate test and a vendored dependency the lockfile pins.
- `work/<step>/` is the correct work a scripted producer writes for each
  step: the capability, its tests, its verifiers and the binding declarations
  under `verifiers/bindings/` that deliver them without a controller edit.
- `faults/` holds labelled injected defects: a wrong greeting and a weak judge
  that passes without observing the program.

Fixture verifiers are not Checkpoint 1 product verifiers.
