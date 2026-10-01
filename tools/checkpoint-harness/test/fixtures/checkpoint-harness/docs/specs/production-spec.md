# Production verification fixture specification

The authority of the T3.5 H1 fixture checkpoint CP96. It defines a small
repository whose gate builds `src/` into `dist/` and tests the built modules
with a locked, vendored dependency. It is not a Pactwright specification and
grants no Checkpoint 1 acceptance.

## 1. Greeting

`src/greet.mjs` exports `greet(name)`. For a name that is not empty once
trimmed it returns `Hello, <trimmed name>!`; for any other name it throws.
Run as a program with one argument it prints the greeting and exits 0, or
prints a diagnostic on stderr and exits 1.

## 2. Banner

`src/banner.mjs` exports `banner(name)`, which returns the greeting of
`greet` passed through `shout` of the locked dependency `fixture-format`. It
does not restate the greeting rules. Run as a program with one argument it
prints the banner and exits 0, or exits 1 as `greet` does.

## 3. Repository gate

`npm run build` copies every module of `src/` into `dist/` after checking its
syntax and fails when `src/` holds none. `npm test` runs the tests of `test/`
against `dist/`. Dependencies come from the lockfile alone.

## 4. Changelog

From the acceptance of Step 1, every step records its change in
`changes/CHANGELOG.md`, one `- CP96-Snn: summary` line per step.

## Exit gate

Every step is accepted, every step candidate keeps the repository gate
passing, and the exit check confirms that the changelog names every step.
