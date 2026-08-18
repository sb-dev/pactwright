import { test, before } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { repoRoot } from "./helpers.js";

const cli = path.join(repoRoot, "dist", "cli.js");
const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8")) as {
  version: string;
};

before(() => {
  // The CLI under test is the built distribution — the same file `bin.pactwright`
  // and the `pactwright` package script point at.
  const build = spawnSync(
    process.execPath,
    [path.join(repoRoot, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.build.json"],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );
  assert.equal(build.status, 0, build.stdout + build.stderr);
});

function run(...args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], { cwd: repoRoot, encoding: "utf8" });
}

test("cli: --version prints the package version", () => {
  const result = run("--version");
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), manifest.version);
});

test("cli: --help exits 0 and prints usage", () => {
  const result = run("--help");
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: pactwright/);
});

test("cli: no arguments prints usage and exits 1", () => {
  const result = run();
  assert.equal(result.status, 1);
  assert.match(result.stdout, /Usage: pactwright/);
});

test("cli: unknown command exits 1 with an error", () => {
  const result = run("frobnicate");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unknown command "frobnicate"/);
});

test("cli: built entry point has a shebang and is executable", () => {
  const first = fs.readFileSync(cli, "utf8").split("\n")[0];
  assert.equal(first, "#!/usr/bin/env node");
});
