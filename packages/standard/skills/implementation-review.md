# implementation-review

How to review a change against its contract.

- Build a checklist from the contract first, one line per statement. Review
  the change against the checklist, not against your own preferences.
- Read the diff completely, then the surrounding code the diff depends on.
- For each suspected defect, construct the concrete input or state that
  triggers it before reporting it. Drop findings you cannot make concrete.
- Run the project's verification yourself when you can; do not trust a
  reported pass.
- Look for what is missing as hard as for what is wrong: untested branches,
  unhandled errors, contract statements with no corresponding change.
- Compare the size of the change with the size of the contract. Extra files,
  options or abstractions are findings.
- Report location, problem, consequence and fix. Most severe first.
