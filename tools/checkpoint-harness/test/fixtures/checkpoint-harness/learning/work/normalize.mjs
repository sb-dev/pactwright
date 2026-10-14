// The normaliser of LEARNING §2.
// normalize removes exactly the leading and trailing characters that
// String.prototype.trim removes: spaces, tabs, line breaks and Unicode
// space separators such as U+00A0 and U+3000. The characters between
// them are kept unchanged.
export function normalize(text) {
  return String(text).trim();
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log(normalize(process.argv[2] ?? ""));
}
