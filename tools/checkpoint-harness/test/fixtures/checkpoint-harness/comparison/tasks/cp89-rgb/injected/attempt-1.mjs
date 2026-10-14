// INJECTED FAULT (T3.6 L4 fixture)
export function parseRgb(text) {
  const hex = text.slice(1);
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log(JSON.stringify(parseRgb(process.argv[2] ?? "")));
}
