// The welcome module of CP95-S04 (HOSTED §4): welcomes a name by reusing
// the greeting module's greeting, followed by ` Welcome aboard.`.

import { greet } from "./greeting.mjs";

export function welcome(name) {
  return `${greet(name)} Welcome aboard.`;
}
