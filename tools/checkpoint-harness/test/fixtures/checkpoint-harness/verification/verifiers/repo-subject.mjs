// Fixture subject for repo.verify (CP99/AC01): checks that every module parses
// and prints the observation as JSON. It has no report path.
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";

const files = ["src", "verifiers"].flatMap((dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith(".mjs"))
    .map((f) => `${dir}/${f}`),
);
const broken = files.filter((f) => {
  try {
    execFileSync(process.execPath, ["--check", f], { stdio: "ignore" });
    return false;
  } catch {
    return true;
  }
});
console.log(JSON.stringify({ files, broken }));
