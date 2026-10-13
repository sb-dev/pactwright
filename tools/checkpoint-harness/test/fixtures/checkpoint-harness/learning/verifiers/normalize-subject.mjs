// Subject of learning.normalizes (CP94-S02/AC01): runs the normaliser program
// with each text of the whitespace case and prints what it observed.
import { spawnSync } from "node:child_process";

const TEXTS = ["  Ada  ", "\tAda\n", "\u00a0Ada\u3000", " \t\u2003Ada\u00a0\r\n"];
const observed = TEXTS.map((text) => {
  const ran = spawnSync(process.execPath, ["tools/checkpoint-harness/test/fixtures/checkpoint-harness/learning/work/normalize.mjs", text], {
    encoding: "utf8",
  });
  return { text: JSON.stringify(text), exit: ran.status, stdout: ran.stdout };
});
console.log(JSON.stringify(observed));
