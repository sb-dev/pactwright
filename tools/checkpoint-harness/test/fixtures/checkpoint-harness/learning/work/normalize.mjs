// The normaliser of LEARNING §2.
export function normalize(text) {
  return String(text).trim();
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log(normalize(process.argv[2] ?? ""));
}
