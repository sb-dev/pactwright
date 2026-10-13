// INJECTED FAULT (T3.6 L4 fixture)
export function normalize(text) {
  return text.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, "");
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log(JSON.stringify(normalize(process.argv[2] ?? "")));
}
