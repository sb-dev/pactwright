---
description: Capture a new intent node in the /specs graph
---
Input: the entire $ARGUMENTS is the intent text. It may be multi-line
quoted text spanning dozens of lines — preserve its line breaks and
formatting verbatim in the node body.
Invoke graph-maintainer to create one intent node per CLAUDE.md
lifecycle step 1, with a title distilled from the text and the full
text as the body, then regenerate indexes and validate; nothing is
committed on red.
End by reporting the new intent ID. Create no edges and no contracts.
