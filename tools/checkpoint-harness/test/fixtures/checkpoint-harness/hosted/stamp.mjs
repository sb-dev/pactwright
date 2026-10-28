// The tool of CP95 Step 2: records the greeting of Pactwright in
// work/STAMP.txt, next to the greeting module, and prints the line.
import { writeFileSync } from "node:fs";

const here = new URL(".", import.meta.url);
const { greet } = await import(new URL("work/greeting.mjs", here).href);
const line = `stamp: ${greet("Pactwright")}`;
writeFileSync(new URL("work/STAMP.txt", here), `${line}\n`);
console.log(line);
