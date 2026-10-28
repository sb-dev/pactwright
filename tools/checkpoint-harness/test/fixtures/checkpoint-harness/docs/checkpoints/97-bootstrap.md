# Checkpoint 97 — Bootstrap fixture

The format-2 fixture of the T3-F bootstrap demonstration. Not a Pactwright
checkpoint: its authority is the
[bootstrap fixture specification](../specs/bootstrap-spec.md).

## Stage 1 — Build

A configuration library, then a command that consumes it.

### Step 1 — Build the configuration library

Contract: [CP97-S01](97-bootstrap/CP97-S01.yml). Deliverable:
`config-library`, the library `src/config.mjs` and its typed API
`src/config.d.ts`.

### Step 2 — Build the command

Contract: [CP97-S02](97-bootstrap/CP97-S02.yml). Deliverable:
`config-command`, the command `src/cli.mjs`.

## Exit gate

Every step is accepted, and every step candidate keeps the fixture repository
gate passing.
