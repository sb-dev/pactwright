import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { repoRoot } from "./helpers.js";

interface Manifest {
  name: string;
  version: string;
  private?: boolean;
  license: string;
  type: string;
  repository: { type: string; url: string };
  engines: { node: string };
  packageManager: string;
  bin: Record<string, string>;
  files: string[];
  main: string;
  types: string;
  exports: Record<string, unknown>;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
}

const manifest = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"),
) as Manifest;

test("package: is the public `pactwright` package with the declared support surface", () => {
  assert.equal(manifest.name, "pactwright");
  assert.equal(manifest.private, false);
  assert.equal(manifest.license, "Apache-2.0");
  assert.equal(manifest.type, "module");
  assert.match(manifest.repository.url, /github\.com\/sb-dev\/pactwright/);
  assert.match(manifest.engines.node, /^>=22/);
  assert.match(manifest.packageManager, /^pnpm@\d+\.\d+\.\d+$/);
});

test("package: exposes the built CLI as bin.pactwright and a repository-local script", () => {
  assert.equal(manifest.bin["pactwright"], "dist/cli.js");
  assert.equal(manifest.scripts["pactwright"], "node dist/cli.js");
  assert.equal(manifest.main, "dist/index.js");
  assert.equal(manifest.types, "dist/index.d.ts");
  assert.ok(manifest.exports["."]);
});

test("package: prepack builds and verify runs every stage", () => {
  assert.equal(manifest.scripts["prepack"], "pnpm build");
  const verify = manifest.scripts["verify"]!;
  for (const stage of ["format:check", "lint", "typecheck", "test", "build"]) {
    assert.match(verify, new RegExp(`pnpm ${stage.replace(":", "\\:")}`), `verify runs ${stage}`);
    assert.ok(manifest.scripts[stage], `script ${stage} exists`);
  }
});

test("package: published files are only the consumer runtime", () => {
  assert.deepEqual([...manifest.files].sort(), ["LICENSE", "README.md", "dist"]);
  for (const entry of ["LICENSE", "README.md"]) {
    assert.ok(fs.existsSync(path.join(repoRoot, entry)), `${entry} exists`);
  }
  assert.deepEqual(Object.keys(manifest.dependencies).sort(), ["@pactwright/standard", "js-yaml"]);
  assert.equal(manifest.dependencies["@pactwright/standard"], "workspace:*");
});
