# Learning fixture specification

The authority of checkpoint CP94, the T3.6 L4 hosted learning fixture. It is
not a Pactwright specification.

## 1. Name

The name module names the fixture: `Pactwright`.

## 2. Normalisation

The normaliser removes every leading and trailing whitespace character of a
text and keeps the characters between them unchanged. Whitespace is every
character JavaScript's `String.prototype.trim` removes: spaces, tabs, line
breaks and the Unicode space separators, such as U+00A0 and U+3000.
