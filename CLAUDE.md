# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Commit messages

- Format: `<type>: <imperative summary>` with `feature:`, `fix:`, `docs:` or
  `chore:`, matching the existing history.
- Body: short prose paragraphs or bullets explaining what changed and why,
  citing the owning specification sections where relevant (e.g.
  "Distribution §16").
- End with exactly one trailer, the co-author tag naming the Claude model
  that did the work:

  ```
  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
  ```

- Never include session URLs (`Claude-Session:` or similar), tool
  advertisements or any other generated trailers.

## Verification

Run `pnpm verify` (format check, lint, typecheck, tests, build) before
committing.
