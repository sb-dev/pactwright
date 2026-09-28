// Integration helper (T3-B): a controller process that creates the run at
// argv[2], imports argv[4] of the repository at argv[3], opens a workspace at
// argv[5] with a background writer, journals it, prints its events and the
// container as one JSON line, and waits until it is killed.

import { appendEvent, createRun } from "../../src/evidence.js";
import { createWorkspace, exec, importSource } from "../../src/workspace.js";

const [dir = "", repo = "", head = "", root = ""] = process.argv.slice(2);
const run = createRun(dir);
const imported = await importSource(run, repo, head);
if (!imported.ok) throw new Error(imported.diagnostics.join("\n"));
const ws = await createWorkspace(run, {
  base: imported.snapshot,
  root,
  policy: { writable: ["src"], scratch: [], protected: [] },
});
const started = await exec(ws, [
  "sh",
  "-c",
  "nohup sh -c 'while true; do date +%s%N >> src/late.txt; sleep 0.05; done' >/dev/null 2>&1 &",
]);
if (started.exitCode !== 0) throw new Error(started.stderr.toString("utf8"));
const events = [
  appendEvent(run, { action: "workspace-started", attempt: 1, data: { container: ws.container } }),
];
process.stdout.write(`${JSON.stringify({ events, container: ws.container })}\n`);
setInterval(() => undefined, 1 << 30);
