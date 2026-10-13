# Comparison task cp85-normalize

The authority of checkpoint CP85, a T3.6 L4 comparison task. It is not
a Pactwright specification.

## 1. Behaviour

The normaliser removes every leading and trailing whitespace character of a
text, as JavaScript's String.prototype.trim does, and replaces each run of
whitespace between other characters with one space.
