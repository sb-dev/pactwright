import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";

// The v2 bootstrap branch has no runtime source yet. Keep that absence
// visible; once src exists, the real build must succeed, including emission.
if (!existsSync("src")) {
  console.log("Root build: no src directory in this scaffold; no runtime artifact built.");
} else {
  const tsc = createRequire(import.meta.url).resolve("typescript/bin/tsc");
  const result = spawnSync(process.execPath, [tsc, "-p", "tsconfig.build.json"], {
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
