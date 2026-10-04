// The tool of CP95 Step 3, in the registry repository: appends
// `released: <checkpoint>` to RELEASES.md and prints the line.
import { appendFileSync } from "node:fs";

const checkpoint = process.argv[2];
if (!/^CP[0-9]{2}$/.test(checkpoint ?? "")) {
  console.error("usage: node record.mjs CPnn");
  process.exit(2);
}
const line = `released: ${checkpoint}`;
appendFileSync(new URL("RELEASES.md", import.meta.url), `${line}\n`);
console.log(line);
