// INJECTED FAULT (T3.6 L4 fixture)
export function splitCsv(line) {
  return line.split(",");
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log(JSON.stringify(splitCsv(process.argv[2] ?? "")));
}
