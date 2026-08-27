# contract-writing

How to write a contract a reviewer can verify.

- State outcomes, not steps: "X returns Y when Z", "the command fails with
  code C if …", "no file under D changes".
- Every statement must be checkable by reading code, running a command or
  inspecting output. If you cannot say how it would be checked, rewrite it.
- Mark scope boundaries explicitly: what is included, what is deliberately
  excluded.
- Name the verification the work must pass (tests, commands, fixtures).
- Do not restate the intent, describe design, or list alternatives that were
  not chosen.
- Prefer short numbered statements over prose. Target ≤800 words.
