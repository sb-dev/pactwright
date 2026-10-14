# Comparison task cp88-words

The authority of checkpoint CP88, a T3.6 L4 comparison task. It is not
a Pactwright specification.

## 1. Behaviour

A word is a maximal run of characters that are not whitespace. Whitespace is
every character JavaScript's String.prototype.trim removes: spaces, tabs, line
breaks and the Unicode space separators, such as U+00A0. The word count of a
text is its number of words.
