// Subject of changelog.current and checkpoint.exit-check: prints the step
// IDs changes/CHANGELOG.md names, one `- CP96-Snn: summary` line each.
import { readFileSync } from "node:fs";

const lines = readFileSync("changes/CHANGELOG.md", "utf8").split("\n").filter((l) => l.startsWith("- "));
const steps = lines.map((l) => /^- (CP96-S\d\d): \S/.exec(l)?.[1] ?? null);
console.log(JSON.stringify({ steps }));
