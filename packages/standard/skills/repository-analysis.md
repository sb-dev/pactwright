# repository-analysis

How to learn a codebase well enough to specify, change or review it.

1. Start from the entry points: package manifest scripts, the CLI or main
   module, the test command. Note the toolchain and how the project verifies
   itself.
2. Map the area the work touches: the modules, their exports, who calls them,
   and the tests that cover them. Read the code; do not rely on names.
3. Find the existing patterns for the kind of change needed (validation,
   file writing, error reporting, test fixtures) and reuse them.
4. Record constraints you discover that the upstream records do not mention:
   invariants, ordering, compatibility rules, places where a change would
   ripple.
5. Write down what you could not determine. A stated unknown beats a guess.

Keep the notes short and specific: file paths, function names, one line each.
