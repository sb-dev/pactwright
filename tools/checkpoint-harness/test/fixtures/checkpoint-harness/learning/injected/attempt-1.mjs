// INJECTED FAULT (T3.6 L4 fixture)
// CP94 Step 2, injected attempt 1: the normaliser of LEARNING §2 with a hand-written
// whitespace class, so a Unicode space separator survives.
export function normalize(text) {
  return String(text).replace(/^[ ]+|[ ]+$/g, "");
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log(normalize(process.argv[2] ?? ""));
}
