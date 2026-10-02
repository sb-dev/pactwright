# Checkpoint 96 — Production verification fixture

The format-2 fixture of the T3.5 H1 production verification proofs. Not a
Pactwright checkpoint: its authority is the
[production fixture specification](../specs/production-spec.md).

## Stage 1 — Build

A greeting module, then a banner that consumes it.

### Step 1 — Build the greeting

Contract: [CP96-S01](96-production/CP96-S01.yml). Deliverable: `greeting`, the
module `src/greet.mjs`.

### Step 2 — Build the banner

Contract: [CP96-S02](96-production/CP96-S02.yml). Deliverable: `banner`, the
module `src/banner.mjs`.

## Exit gate

Every step is accepted, every step candidate keeps the repository gate
passing, and the exit check confirms that the changelog names every step.
