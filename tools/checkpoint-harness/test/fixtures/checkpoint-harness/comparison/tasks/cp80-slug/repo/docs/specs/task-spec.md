# Comparison task cp80-slug

The authority of checkpoint CP80, a T3.6 L4 comparison task. It is not
a Pactwright specification.

## 1. Behaviour

The slug of a text is made from its ASCII letters, lower-cased, and its ASCII
digits, in order. Each run of other characters between two of them becomes one
hyphen, and other characters before the first or after the last of them are
dropped. A text with no ASCII letter or digit has the empty slug.
