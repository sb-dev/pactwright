import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { it } from "node:test";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const script = fileURLToPath(new URL("../scripts/build-root.ts", import.meta.url));
const tsx = import.meta.resolve("tsx");
const tsc = createRequire(import.meta.url).resolve("typescript/bin/tsc");

for (const scenario of ["no source", "valid source", "invalid source"] as const) {
  it(`root build: ${scenario}`, (t) => {
    const root = mkdtempSync(join(tmpdir(), "pactwright-build-"));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({
        scripts: { "build:root": `node ${JSON.stringify(tsc)} -p tsconfig.build.json` },
      }),
    );
    writeFileSync(
      join(root, "tsconfig.build.json"),
      JSON.stringify({
        compilerOptions: { outDir: "dist", declaration: true, types: [] },
        include: ["src/**/*.ts"],
      }),
    );
    if (scenario !== "no source") {
      mkdirSync(join(root, "src"));
      writeFileSync(
        join(root, "src/index.ts"),
        scenario === "valid source"
          ? "export const value = 1;"
          : 'export const value: number = "wrong";',
      );
    }
    const result = spawnSync(process.execPath, ["--import", tsx, script], {
      cwd: root,
      encoding: "utf8",
    });
    assert.ifError(result.error);
    if (scenario === "invalid source") {
      assert.notEqual(result.status, 0, result.stdout + result.stderr);
      assert.match(result.stdout + result.stderr, /TS2322/);
    } else {
      assert.equal(result.status, 0, result.stdout + result.stderr);
      if (scenario === "no source") {
        assert.match(result.stdout, /no runtime artifact built/);
        assert.equal(existsSync(join(root, "dist")), false);
      } else {
        assert.ok(existsSync(join(root, "dist/index.js")));
        assert.ok(existsSync(join(root, "dist/index.d.ts")));
        assert.doesNotMatch(result.stdout, /no runtime artifact built/);
      }
    }
  });
}

it("root verification delegates to the configured build command", (t) => {
  const root = mkdtempSync(join(tmpdir(), "pactwright-build-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "src"));
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({ scripts: { "build:root": 'node -e "process.exit(23)"' } }),
  );
  const result = spawnSync(process.execPath, ["--import", tsx, script], {
    cwd: root,
    encoding: "utf8",
  });
  assert.ifError(result.error);
  assert.equal(result.status, 23, result.stdout + result.stderr);
});
