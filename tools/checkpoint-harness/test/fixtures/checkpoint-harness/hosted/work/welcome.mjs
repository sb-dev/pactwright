// The welcome module of CP95-S04 (HOSTED §4): welcomes a name by reusing
// the greeting module's greeting, followed by ` Welcome aboard.`.

import { greet } from "./greeting.mjs";

export function welcome(name) {
  return `${greet(name)} Welcome aboard.`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    console.log(welcome(process.argv[2]));
    process.exit(0);
  } catch {
    process.exit(1);
  }
}
