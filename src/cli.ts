#!/usr/bin/env node
import { runtimeVersion } from "./version.js";

const HELP = `Usage: pactwright <command> [options]

Options:
  -h, --help     Show this help
  -v, --version  Print the runtime version

Commands are added by later Pactwright checkpoints.
`;

export function main(argv: readonly string[]): number {
  const [first] = argv;
  if (first === undefined || first === "--help" || first === "-h" || first === "help") {
    process.stdout.write(HELP);
    return first === undefined ? 1 : 0;
  }
  if (first === "--version" || first === "-v" || first === "version") {
    process.stdout.write(`${runtimeVersion()}\n`);
    return 0;
  }
  process.stderr.write(`pactwright: unknown command "${first}"\n\n${HELP}`);
  return 1;
}

process.exitCode = main(process.argv.slice(2));
