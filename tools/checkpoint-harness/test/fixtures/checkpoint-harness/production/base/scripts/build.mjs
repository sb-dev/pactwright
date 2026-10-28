// The fixture build: checks the syntax of every module of src/ and copies it
// into dist/. With no module to build it fails rather than succeed empty.
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readdirSync } from "node:fs";

const modules = readdirSync("src").filter((f) => f.endsWith(".mjs"));
if (modules.length === 0) {
  console.error("build: src/ holds no module");
  process.exit(1);
}
mkdirSync("dist", { recursive: true });
for (const file of modules) {
  execFileSync(process.execPath, ["--check", `src/${file}`], { stdio: "inherit" });
  copyFileSync(`src/${file}`, `dist/${file}`);
}
console.log(`built ${modules.join(", ")}`);
