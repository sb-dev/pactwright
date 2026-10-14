# Comparison task cp89-rgb

The authority of checkpoint CP89, a T3.6 L4 comparison task. It is not
a Pactwright specification.

## 1. Behaviour

A colour is # followed by exactly six hexadecimal digits in any letter case.
Its value is the array of its red, green and blue components, each from 0 to
255, read from the first, second and third pairs of digits. Any other text is
not a colour.
