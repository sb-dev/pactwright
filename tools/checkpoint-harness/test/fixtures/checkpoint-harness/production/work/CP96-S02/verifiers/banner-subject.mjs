// Subject of banner.prints (CP96-S02/AC01): runs the banner program for Ada.
import { spawnSync } from "node:child_process";

const ran = spawnSync(process.execPath, ["src/banner.mjs", "Ada"], { encoding: "utf8" });
console.log(JSON.stringify({ exit: ran.status, stdout: ran.stdout }));
