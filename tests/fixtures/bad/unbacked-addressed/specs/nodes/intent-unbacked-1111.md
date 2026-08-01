---
id: intent-unbacked-1111
type: intent
title: An intent flipped to addressed with a live market but no selection
status: addressed
created: 2026-07-01
class: 1
---
Two live contracts propose this intent and NOTHING selected either of them, yet the intent
stands `addressed`. Amendment 9 requires exactly this shape rather than the zero-edge one:
an implementation that computes backing as `liveProposingContracts(intent).size > 0` — dropping
the intersection with the selected set — passes a zero-edge fixture and fails only here.
