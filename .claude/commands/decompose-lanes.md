---
description: Decompose an approved contract into one implementation brief per named lane
---
Input: contract node ID + lane list ($ARGUMENTS: `<contract-id> <lane,lane,...>`).
Locate the contract via specs/indexes/ and confirm an inbound `selects` edge
exists; stop and report if it was never selected. (`/write-brief` remains for a
single unlaned brief.)
Act as spec-writer: draft one brief per named lane, each carrying its `lane` field
(from the catalog: product-spec | domain-backend | frontend-ui | data-migration |
api-integration | test-verification | observability-release | docs-spec) and
naming its files, ordered steps, and explicit non-scope. Whenever the list has at
least one IMPLEMENTATION lane, INCLUDE a `test-verification` lane brief — its tests
are written by test-writer via /write-tests, never the implementation invocation.
State the integration expectation: each laned brief reaches `implemented` while the
intent stays `open`; the contract is completed only by a final integration node via
/integrate (a collapsed lane is superseded per CLAUDE.md rule 3, not forced into a
ceremonial integration).
Then invoke graph-maintainer to write the brief nodes and their `decomposes` edges,
regenerate indexes, and validate; nothing is committed on red.
End by reporting each brief ID and its lane. Stop there — do not implement anything.
