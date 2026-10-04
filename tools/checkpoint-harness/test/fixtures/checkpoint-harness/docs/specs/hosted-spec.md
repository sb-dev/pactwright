# Hosted fixture specification

The authority of checkpoint CP95, the T3.5 H3 hosted-run fixture. It is not a
Pactwright specification.

## 1. Greeting

The greeting module greets a name that is not empty once trimmed, as
`Hello, <name>!` for the trimmed name, and rejects any other name.

## 2. Release

The greeting is released only after the owner approves the exact candidate.

## 3. Stamp

The stamp records the greeting of `Pactwright` in the fixture's work
directory, so a later reader sees which greeting the candidate holds.

## 4. Welcome

The welcome module welcomes a name with the greeting module's greeting of it,
followed by ` Welcome aboard.`.
