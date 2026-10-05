// The welcome module of HOSTED §4 (CP95-S04). Exports `welcome(name)`,
// which returns the greeting module's greeting of the name followed by
// " Welcome aboard.". Run as a program with a name argument, it prints
// the welcome and exits 0, or exits 1 without output for a name the
// greeting module rejects.

import { greet } from "./greeting.mjs";

export function welcome(name) {
  return `${greet(name)} Welcome aboard.`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    console.log(welcome(process.argv[2]));
  } catch {
    process.exit(1);
  }
}
