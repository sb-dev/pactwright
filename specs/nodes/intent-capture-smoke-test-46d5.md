---
id: intent-capture-smoke-test-46d5
type: intent
title: Throwaway smoke test of /capture-intent multi-line input
status: rejected
created: 2026-06-13
---

This is a throwaway intent created to smoke-test the `/capture-intent`
command path. Its body is intentionally multi-line quoted text to prove
that line breaks and formatting survive verbatim:

> When a contributor pastes a thirty-line specification into
> /capture-intent, every line must arrive in the node body unchanged —
> blank lines preserved,
>
> indentation preserved,
>     including nested indentation,
> and punctuation untouched.

It will be superseded immediately after validation passes.
