import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { CORE_CAPABILITIES } from "../src/pack/capabilities.js";
import { loadPackManifest } from "../src/pack/manifest.js";
import { repoRoot } from "./helpers.js";

interface Manifest {
  name: string;
  version: string;
  private?: boolean;
  license: string;
  type: string;
  repository: { type: string; url: string; directory?: string };
  engines: { node: string };
  main: string;
  types: string;
  exports: Record<string, unknown>;
  files: string[];
  scripts: Record<string, string>;
  dependencies?: Record<string, string>;
}

const packDir = path.join(repoRoot, "packages", "standard");
const read = (file: string): Manifest => JSON.parse(fs.readFileSync(file, "utf8")) as Manifest;
const pkg = read(path.join(packDir, "package.json"));
const root = read(path.join(repoRoot, "package.json"));

test("standard package: is the public @pactwright/standard package with the declared support surface", () => {
  assert.equal(pkg.name, "@pactwright/standard");
  assert.equal(pkg.private, false);
  assert.equal(pkg.license, "Apache-2.0");
  assert.equal(pkg.type, "module");
  assert.match(pkg.repository.url, /github\.com\/sb-dev\/pactwright/);
  assert.equal(pkg.repository.directory, "packages/standard");
  assert.match(pkg.engines.node, /^>=22/);
  assert.equal(pkg.dependencies, undefined);
});

test("standard package: build/prepack discipline and entry points match pactwright", () => {
  assert.equal(pkg.scripts["prepack"], "pnpm build");
  assert.equal(pkg.scripts["build"], "tsc -p tsconfig.build.json");
  assert.equal(pkg.main, "dist/index.js");
  assert.equal(pkg.types, "dist/index.d.ts");
  assert.ok(pkg.exports["."]);
  assert.equal(pkg.exports["./package.json"], "./package.json");
  assert.equal(pkg.exports["./pack.yml"], "./pack.yml");
  assert.match(root.scripts["build"]!, /--filter @pactwright\/standard build/);
});

test("standard package: published files are the pack and its build only", () => {
  assert.deepEqual([...pkg.files].sort(), [
    "LICENSE",
    "README.md",
    "agents",
    "dist",
    "pack.yml",
    "skills",
  ]);
  for (const entry of pkg.files.filter((f) => f !== "dist")) {
    assert.ok(fs.existsSync(path.join(packDir, entry)), `${entry} exists`);
  }
  assert.equal(
    fs.readFileSync(path.join(packDir, "LICENSE"), "utf8"),
    fs.readFileSync(path.join(repoRoot, "LICENSE"), "utf8"),
  );
});

test("standard pack: pack.yml is valid, complete for the core capabilities, and version-locked to the runtime", () => {
  const result = loadPackManifest(packDir);
  assert.deepEqual(result.problems, []);
  const manifest = result.value!;
  assert.equal(manifest.name, pkg.name);
  assert.equal(manifest.version, pkg.version, "pack.yml version must match package.json");
  assert.equal(pkg.version, root.version, "workspace packages share one version");
  assert.equal(
    manifest.pactwright,
    root.version,
    "during 0.0.x the pack declares the exact runtime version",
  );
  for (const capability of CORE_CAPABILITIES) {
    assert.ok(manifest.capabilities[capability], `provides ${capability}`);
  }
  assert.deepEqual(
    { ...manifest.capabilities },
    {
      "delivery-execution": "implementer",
      "delivery-review": "reviewer",
      "delivery-specification": "spec",
    },
  );
});

test("standard pack: prompts delegate lifecycle state to the runtime and own no transition rules", () => {
  for (const agent of Object.values(loadPackManifest(packDir).value!.agents)) {
    const text = fs.readFileSync(path.join(packDir, agent.prompt), "utf8");
    assert.match(text, /pnpm pactwright context/, `${agent.prompt} uses the runtime for context`);
    assert.doesNotMatch(
      text,
      /\b(supersede the|must supersede|human gate|next stage|advance the lifecycle|mark (the )?(brief|contract|intent) as)\b/i,
      `${agent.prompt} must not state transition rules`,
    );
  }
});
