// Checkpoint harness command line (Task 3 research log §11).
//
// Usage: checkpoint-harness plan --config FILE
// Prints the prepared run as deterministic JSON and exits 0. Invalid
// configuration or definitions print file/ID: cause diagnostics and exit 2.
// Exit 0 means only that planning succeeded; it grants no acceptance. The
// repository is the Git working tree containing the current directory.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { Command, CommanderError } from "commander";
import yaml from "js-yaml";
import stringify from "safe-stable-stringify";

import { prepareRun } from "./contracts.js";

const INVALID = 2;

async function plan(configFile: string): Promise<number> {
  let config: unknown;
  try {
    config = yaml.load(readFileSync(configFile, "utf8"));
  } catch (e) {
    console.error(`${configFile}: ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`);
    return INVALID;
  }
  const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  }).trim();
  const result = await prepareRun(config, { repoRoot, configName: configFile });
  if (!result.ok) {
    for (const d of result.diagnostics) console.error(d);
    return INVALID;
  }
  process.stdout.write(`${stringify(result.plan, null, 2)}\n`);
  return 0;
}

const program = new Command()
  .name("checkpoint-harness")
  .description("Bootstrap checkpoint harness (Spec 00 T3).")
  .exitOverride();

program
  .command("plan")
  .description("Validate the run configuration and definitions, and print the prepared run.")
  .requiredOption("--config <file>", "run configuration YAML")
  .action(async ({ config }: { config: string }) => {
    process.exitCode = await plan(config);
  });

try {
  await program.parseAsync(process.argv);
} catch (e) {
  if (!(e instanceof CommanderError)) throw e;
  process.exitCode = e.exitCode === 0 ? 0 : INVALID;
}
