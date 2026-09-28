// Fixture verifier for repo.verify (CP99/AC01): every module parses.
import { execFileSync } from "node:child_process";
import { readdirSync, writeFileSync } from "node:fs";

// Take the report path out of the environment before running candidate code.
const report = process.env.PACTWRIGHT_REPORT;
delete process.env.PACTWRIGHT_REPORT;

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
const outcome = broken.length === 0 ? "passed" : "failed";
const result = {
  binding: process.env.PACTWRIGHT_BINDING,
  owner: "CP99",
  criterion: "AC01",
  case: null,
  outcome,
  assertions: files.length,
  observations: { files },
  ...(broken.length > 0 ? { message: `${broken.join(", ")} do not parse` } : {}),
};
writeFileSync(report, JSON.stringify({ results: [result] }));
process.exit(outcome === "passed" ? 0 : 1);
