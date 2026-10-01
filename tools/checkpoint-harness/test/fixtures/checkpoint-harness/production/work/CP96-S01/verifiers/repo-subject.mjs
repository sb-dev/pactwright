// Subject of repo.build-test (CP96/AC01): runs the repository gate on the
// candidate's own source. dist/ is the binding's empty scratch path and
// node_modules the prepared dependencies; it records both before building.
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";

const observe = (read) => {
  try {
    return read();
  } catch (e) {
    return `unreadable: ${e.code ?? e.message}`;
  }
};
const distBefore = observe(() => readdirSync("dist"));
const dependency = observe(
  () => JSON.parse(readFileSync("node_modules/fixture-format/package.json", "utf8")).version,
);
const build = spawnSync("npm", ["run", "--silent", "build"], { encoding: "utf8" });
const test =
  build.status === 0 ? spawnSync("npm", ["test", "--silent"], { encoding: "utf8" }) : null;
console.log(
  JSON.stringify({
    distBefore,
    dependency,
    build: build.status,
    test: test?.status ?? null,
    output: `${build.stderr}${test?.stdout ?? ""}`.slice(-1500),
  }),
);
