// INJECTED FAULT (T3.6 L4 fixture)
export function countWords(text) {
  return text.split(" ").length;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log(JSON.stringify(countWords(process.argv[2] ?? "")));
}
