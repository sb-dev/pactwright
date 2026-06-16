---
description: Capture a new intent node in the /specs graph
---
Input: the entire $ARGUMENTS is the intent text. It may be multi-line
quoted text spanning dozens of lines — preserve its line breaks and
formatting verbatim in the node body.
Determine the intent's work `class` (integer 0–3) per the CLAUDE.md
work-class routing table; if the input does not state one, ask the human
before creating the node (`class` is required and range-checked).
Invoke graph-maintainer to create one intent node per CLAUDE.md
lifecycle step 1, with a title distilled from the text, the chosen
`class` in its frontmatter, and the full text as the body, then
regenerate indexes and validate; nothing is committed on red.
End by reporting the new intent ID and its class. Create no edges and no
contracts.
