import { basename, dirname, join } from "node:path";

let counter = 0;

/**
 * A unique temporary sibling path for atomic writes. The pid distinguishes
 * processes; the monotonic counter distinguishes writes within one process,
 * so two writes targeting the same path never collide on their temp file.
 */
export function tempSibling(target: string): string {
  counter += 1;
  return join(dirname(target), `.${basename(target)}.tmp-${process.pid}-${counter}`);
}
