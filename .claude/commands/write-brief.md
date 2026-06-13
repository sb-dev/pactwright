---
description: Decompose an approved contract into one implementation brief
---
Input: contract node ID ($ARGUMENTS). Locate it via specs/indexes/ and
confirm an inbound `selects` edge exists in incoming.yaml; stop and
report if the contract was never selected.
Act as spec-writer: draft exactly one brief naming the files to create,
script entries, libraries, ordered implementation steps, and explicit
non-scope. Then invoke graph-maintainer to write the brief node and its
`decomposes` edge, regenerate indexes, and validate; nothing is
committed on red.
End by reporting the brief ID. Stop there — do not implement anything.
