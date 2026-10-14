# Comparison task cp85-normalize

The authority of checkpoint CP85, a T3.6 L4 comparison task. It is not
a Pactwright specification.

## 1. Behaviour

The normaliser removes every leading and trailing whitespace character of a
text. Whitespace is every character JavaScript's String.prototype.trim
removes: spaces, tabs, line breaks and the Unicode space separators, such as
U+00A0 and U+3000.
