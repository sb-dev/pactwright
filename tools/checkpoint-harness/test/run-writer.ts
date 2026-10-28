// Test helper (T3-B): a controller process that creates the run at argv[2],
// appends argv[3] events, prints them as one JSON line, then kills itself
// ("crash") or waits until it is killed ("wait").

import { appendEvent, createRun } from "../src/evidence.js";

const [dir = "", count = "0", mode = "crash"] = process.argv.slice(2);
const run = createRun(dir);
const events = Array.from({ length: Number(count) }, (_, i) =>
  appendEvent(run, { action: "test", attempt: 1, data: { i } }),
);
process.stdout.write(`${JSON.stringify(events)}\n`);
if (mode === "crash") process.kill(process.pid, "SIGKILL");
else setInterval(() => undefined, 1 << 30);
