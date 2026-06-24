---
description: Write a test-verification lane's tests via the test-writer agent
---
Input: test-verification brief node ID ($ARGUMENTS). Locate the brief via
specs/indexes/ and confirm its `lane` is `test-verification`; stop and report
otherwise.
Invoke test-writer against it — a SEPARATE invocation from any /implement-brief
that wrote the code under test (verification is always its own lane). The agent
writes/extends tests under `tests/` only and performs no graph writes.
End by reporting the test files written. The test-verification lane reaches its own
evidence via /prepare-evidence, and /integrate keeps the contract's integration at
`draft` until that lane is at final evidence. Stop there.
