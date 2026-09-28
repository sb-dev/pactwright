// T3-B acceptance, containment part (Task 3 research log §12). Requires a
// running Linux Docker daemon; the pinned image is pulled by digest if absent.
// A missing Docker environment fails these tests; it is never a pass.

import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, before, describe, it } from "node:test";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

import {
  createRun,
  readRun,
  recoverRun,
  type JournalEvent,
  type RunHandle,
} from "../../src/evidence.js";
import {
  captureSource,
  createWorkspace,
  exec,
  fenceWorkers,
  importSource,
  PROFILE,
  readFile,
  sealCandidate,
  writeFile,
  type SourceSnapshot,
  type WritePolicy,
  type Workspace,
} from "../../src/workspace.js";

const here = dirname(fileURLToPath(import.meta.url));
const helper = join(here, "controller.ts");
const tsx = import.meta.resolve("tsx");

const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-b-int-"));
const fresh = (name: string): string => join(scratch, `${name}-${randomUUID()}`);
const runs: string[] = [];

before(() => {
  try {
    execFileSync("docker", ["image", "inspect", PROFILE.image], { stdio: "ignore" });
  } catch {
    execFileSync("docker", ["pull", PROFILE.image], { stdio: "inherit" });
  }
});
after(async () => {
  for (const id of runs) await fenceWorkers(id);
  rmSync(scratch, { recursive: true, force: true });
});

const git = (cwd: string, args: string[]): string =>
  execFileSync(
    "git",
    ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", ...args],
    { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ).trim();

function sourceRepo(extra?: (root: string) => void): { root: string; head: string } {
  const root = fresh("repo");
  mkdirSync(join(root, "src"), { recursive: true });
  mkdirSync(join(root, "docs"));
  writeFileSync(join(root, "src/lib.ts"), "export const answer = 42;\n");
  writeFileSync(join(root, "src/verifier.ts"), "// approved verifier\n");
  writeFileSync(join(root, "docs/contract.yml"), "id: CP99-S01\n");
  extra?.(root);
  git(root, ["init", "-q"]);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-q", "--no-gpg-sign", "-m", "fixture"]);
  return { root, head: git(root, ["rev-parse", "HEAD"]) };
}

const policy: WritePolicy = {
  writable: ["src"],
  scratch: ["dist"],
  protected: ["src/verifier.ts"],
};

async function setup(
  extra?: (root: string) => void,
): Promise<{ run: RunHandle; base: SourceSnapshot; repo: string }> {
  const { root, head } = sourceRepo(extra);
  const run = createRun(fresh("run"));
  runs.push(run.run);
  const imported = await importSource(run, root, head);
  assert.ok(imported.ok, imported.ok ? "" : imported.diagnostics.join("\n"));
  return { run, base: imported.snapshot, repo: root };
}

const open = (run: RunHandle, base: SourceSnapshot): Promise<Workspace> =>
  createWorkspace(run, { base, root: fresh("candidate"), policy });

function digestTree(dir: string, rel = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of readdirSync(join(dir, rel)).sort()) {
    const path = rel ? `${rel}/${name}` : name;
    const stat = lstatSync(join(dir, path));
    if (stat.isDirectory()) Object.assign(out, digestTree(dir, path));
    else {
      const bytes = stat.isSymbolicLink()
        ? Buffer.from(readlinkSync(join(dir, path)))
        : readFileSync(join(dir, path));
      out[path] = `${stat.mode.toString(8)} ${createHash("sha256").update(bytes).digest("hex")}`;
    }
  }
  return out;
}

const sh = (ws: Workspace, script: string) => exec(ws, ["sh", "-c", script]);
const text = (b: Buffer): string => b.toString("utf8").trim();

describe("T3-B candidate containment", () => {
  it("B01 allows scoped work and denies every escape without changing host or control data", async () => {
    const { run, base } = await setup();
    const ws = await open(run, base);
    const sentinel = fresh("host-sentinel");
    writeFileSync(sentinel, "host data\n");
    const control = digestTree(run.dir);
    const verifier = readFileSync(join(ws.root, "src/verifier.ts"));

    assert.deepEqual(await writeFile(ws, "src/new.ts", Buffer.from("export {};\n")), { ok: true });
    const read = await readFile(ws, "src/new.ts");
    assert.ok(read.ok);
    assert.equal(text(read.bytes), "export {};");
    assert.equal((await sh(ws, "echo built > dist/out.txt")).exitCode, 0);
    assert.notEqual(text((await exec(ws, ["id", "-u"])).stdout), "0");

    const denied: [string, Promise<{ ok: boolean } | { exitCode: number | null }>][] = [
      ["traversal write", writeFile(ws, "../escape.txt", Buffer.from("x"))],
      ["absolute write", writeFile(ws, "/work/../escape.txt", Buffer.from("x"))],
      ["protected write", writeFile(ws, "src/verifier.ts", Buffer.from("// weakened\n"))],
      ["read-only source write", writeFile(ws, "docs/contract.yml", Buffer.from("id: x\n"))],
      ["shell traversal", sh(ws, "echo x > ../escape.txt")],
      ["root write", sh(ws, "echo x > /escape.txt")],
      [
        "link to protected file",
        sh(ws, "ln -s /work/src/verifier.ts src/p; echo x > src/p; s=$?; rm src/p; exit $s"),
      ],
      [
        "link to host path",
        sh(ws, `ln -s ${sentinel} src/h; echo x > src/h; s=$?; rm src/h; exit $s`),
      ],
      [
        "rename over protected file",
        sh(ws, "echo x > src/t && mv src/t src/verifier.ts; s=$?; rm -f src/t; exit $s"),
      ],
      ["delete protected file", sh(ws, "rm src/verifier.ts")],
      [
        "child process write",
        exec(ws, ["node", "-e", "require('fs').writeFileSync('src/verifier.ts', 'x')"]),
      ],
      ["controller root", sh(ws, `cat ${join(run.dir, "manifest.json")}`)],
      ["host file", sh(ws, `cat ${sentinel}`)],
      ["docker socket", sh(ws, "test -e /var/run/docker.sock")],
      ["Git metadata", sh(ws, "test -e .git")],
      [
        "network",
        exec(ws, [
          "node",
          "-e",
          "require('net').connect(443, '1.1.1.1').on('connect', () => process.exit(0)).on('error', () => process.exit(3))",
        ]),
      ],
    ];
    for (const [name, attempt] of denied) {
      const result = await attempt;
      const ok = "ok" in result ? result.ok : result.exitCode === 0;
      assert.equal(ok, false, `${name} must fail`);
    }

    // A background child keeps running after its command returns and meets the same controls.
    const background = await sh(
      ws,
      "nohup sh -c 'sleep 0.3; echo x > src/verifier.ts 2>/dev/null && echo wrote > src/child.txt || echo denied > src/child.txt' >/dev/null 2>&1 &",
    );
    assert.equal(background.exitCode, 0);
    await sleep(1500);
    const child = await readFile(ws, "src/child.txt");
    assert.ok(child.ok);
    assert.equal(text(child.bytes), "denied");

    assert.deepEqual(readFileSync(join(ws.root, "src/verifier.ts")), verifier);
    assert.equal(readFileSync(sentinel, "utf8"), "host data\n");
    assert.deepEqual(digestTree(run.dir), control);

    const sealed = await sealCandidate(run, ws);
    assert.ok(sealed.ok, sealed.ok ? "" : sealed.diagnostics.join("\n"));
    assert.deepEqual(sealed.candidate.changes, [
      { path: "src/child.txt", kind: "added" },
      { path: "src/new.ts", kind: "added" },
    ]);
  });

  // Review 5336199212 finding 1: a base link must not alias a bind-mount source.
  for (const [name, writable] of [
    ["path", "editable"],
    ["ancestor", "editable/sub"],
  ] as const) {
    it(`B01 refuses a policy path whose ${name} is a link into read-only source`, async () => {
      const { run, base } = await setup((root) => symlinkSync("docs", join(root, "editable")));
      const root = fresh("candidate");
      const outcome = await createWorkspace(run, {
        base,
        root,
        policy: { writable: [writable], scratch: [], protected: ["docs/contract.yml"] },
      }).catch((e: unknown) => (e instanceof Error ? e : new Error(String(e))));
      if (!(outcome instanceof Error)) {
        const write = await writeFile(outcome, "editable/contract.yml", Buffer.from("id: x\n"));
        const bytes = readFileSync(join(root, "docs/contract.yml"), "utf8");
        assert.fail(`workspace created; alias write ok=${write.ok}; contract now ${bytes}`);
      }
      assert.match(outcome.message, /resolves through a link at editable$/m);
      assert.equal(await fenceWorkers(run.run), 0, "no container started");
      assert.equal(existsSync(join(root, "docs")), false, "nothing was mounted or changed");
    });
  }

  it("B01 a link inside a writable path cannot reach read-only source", async () => {
    const { run, base } = await setup((root) => symlinkSync("../docs", join(root, "src/docs")));
    const ws = await open(run, base);
    const before = readFileSync(join(ws.root, "docs/contract.yml"));
    const write = await writeFile(ws, "src/docs/contract.yml", Buffer.from("id: forged\n"));
    assert.equal(write.ok, false);
    assert.notEqual((await sh(ws, "echo x > src/docs/contract.yml")).exitCode, 0);
    assert.deepEqual(readFileSync(join(ws.root, "docs/contract.yml")), before);
  });

  it("B01 fences the whole workspace when a command times out", async () => {
    const { run, base } = await setup();
    const ws = await open(run, base);
    const result = await exec(ws, ["sleep", "30"], { timeoutMs: 500 });
    assert.equal(result.timedOut, true);
    assert.equal(ws.fenced, true);
    assert.equal(await fenceWorkers(run.run), 0);
    await assert.rejects(exec(ws, ["true"]), /fenced/);
  });

  it("B02 seals contained changes and reproduces them in a fresh workspace without stale builds", async () => {
    const { run, base } = await setup();
    const ws = await open(run, base);
    const built = await sh(
      ws,
      "sed -i 's/42/43/' src/lib.ts && chmod +x src/lib.ts && printf '\\000\\377' > src/bytes.bin && cp src/lib.ts dist/lib.js",
    );
    assert.equal(built.exitCode, 0, text(built.stderr));
    const sealed = await sealCandidate(run, ws);
    assert.ok(sealed.ok, sealed.ok ? "" : sealed.diagnostics.join("\n"));
    assert.notEqual(sealed.candidate.tree, base.tree);
    assert.deepEqual(sealed.candidate.changes, [
      { path: "src/bytes.bin", kind: "added" },
      { path: "src/lib.ts", kind: "modified" },
    ]);

    const again = await open(run, sealed.candidate);
    assert.notEqual((await sh(again, "test -e dist/lib.js")).exitCode, 0, "stale build is absent");
    assert.equal(text((await sh(again, "stat -c %a src/lib.ts")).stdout), "755");
    assert.equal(text((await sh(again, "od -An -tx1 src/bytes.bin")).stdout), "00 ff");
    assert.equal(text((await sh(again, "cat src/lib.ts")).stdout), "export const answer = 43;");
    const resealed = await sealCandidate(run, again);
    assert.ok(resealed.ok);
    assert.equal(resealed.candidate.tree, sealed.candidate.tree);
    assert.deepEqual(resealed.candidate.changes, []);
  });

  // Review 5336199212 finding 3: identity depends only on source, not on the workspace.
  it("B02 seals equal candidates from different workspaces to one identity", async () => {
    const { run, base } = await setup();
    const sealed = [];
    for (let i = 0; i < 2; i += 1) {
      const ws = await open(run, base);
      assert.equal((await sh(ws, "sed -i 's/42/43/' src/lib.ts")).exitCode, 0);
      const result = await sealCandidate(run, ws);
      assert.ok(result.ok, result.ok ? "" : result.diagnostics.join("\n"));
      sealed.push({ commit: result.candidate.commit, tree: result.candidate.tree });
    }
    assert.notEqual(sealed[0]?.tree, base.tree);
    assert.deepEqual(sealed[1], sealed[0]);
  });

  it("B02/B04 a late write after sealing cannot change the sealed candidate", async () => {
    const { run, base } = await setup();
    const ws = await open(run, base);
    const writer = await sh(
      ws,
      "nohup sh -c 'while true; do date +%s%N >> src/late.txt; sleep 0.05; done' >/dev/null 2>&1 &",
    );
    assert.equal(writer.exitCode, 0);
    await sleep(500);
    const sealed = await sealCandidate(run, ws);
    assert.ok(sealed.ok);
    const size = statSync(join(ws.root, "src/late.txt")).size;
    await sleep(500);
    assert.equal(statSync(join(ws.root, "src/late.txt")).size, size, "the writer was stopped");
    const recaptured = captureSource(run.dir, ws.root, base, policy, "check");
    assert.ok(recaptured.ok);
    assert.equal(recaptured.candidate.tree, sealed.candidate.tree);
  });
});

describe("T3-B recovery with real workers", () => {
  it("B03/B04 refuses a live controller, then fences a crashed one's workers and reconstructs its events", async () => {
    const { root, head } = sourceRepo();
    const dir = fresh("run");
    const candidate = fresh("candidate");
    const child = spawn(process.execPath, ["--import", tsx, helper, dir, root, head, candidate], {
      stdio: ["ignore", "pipe", "inherit"],
    });
    after(() => child.kill("SIGKILL"));
    const exited = new Promise((done) => child.on("exit", done));
    const started = await new Promise<{ events: JournalEvent[]; container: string }>((done) => {
      let out = "";
      child.stdout.on("data", (b: Buffer) => {
        out += b.toString("utf8");
        if (out.endsWith("\n"))
          done(JSON.parse(out) as { events: JournalEvent[]; container: string });
      });
    });
    const read = readRun(dir);
    assert.ok(read.ok);
    runs.push(read.records.manifest.run);

    const locked = await recoverRun(dir, { fence: fenceWorkers });
    assert.equal(locked.kind, "locked");
    assert.equal(locked.kind === "locked" ? locked.liveness : "", "live");

    child.kill("SIGKILL");
    await exited;
    const running = (): string =>
      execFileSync("docker", ["ps", "--quiet", "--filter", `id=${started.container}`], {
        encoding: "utf8",
      }).trim();
    assert.notEqual(running(), "", "the orphaned worker is still running");

    const recovered = await recoverRun(dir, { fence: fenceWorkers });
    assert.equal(recovered.kind, "recovered");
    if (recovered.kind !== "recovered") return;
    assert.equal(running(), "", "recovery fenced the orphaned worker");
    assert.deepEqual(recovered.events.slice(1), started.events);
    const reread = readRun(dir);
    assert.ok(reread.ok);
    assert.deepEqual(reread.records.events.slice(0, 2), recovered.events);
    const size = statSync(join(candidate, "src/late.txt")).size;
    await sleep(500);
    assert.equal(statSync(join(candidate, "src/late.txt")).size, size, "late writes stopped");
  });
});
