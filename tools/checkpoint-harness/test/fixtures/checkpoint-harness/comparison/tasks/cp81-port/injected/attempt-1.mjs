// INJECTED FAULT (T3.6 L4 fixture)
export function parsePort(text) {
  if (!/^[1-9][0-9]*$/.test(text)) return null;
  const n = Number(text);
  return n <= 65536 ? n : null;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log(JSON.stringify(parsePort(process.argv[2] ?? "")));
}
