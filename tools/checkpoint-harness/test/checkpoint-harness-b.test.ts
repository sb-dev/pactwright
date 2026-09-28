// T3-B acceptance, offline part (Task 3 research log §12): source identity,
// the evaluation-manifest digest and the durable, fenced journal. Container
// containment is proved by test/integration/checkpoint-harness-workspace.test.ts.
// Every event here is a test event; none records acceptance.

import assert from "node:assert/strict";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  appendFileSync,
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { hostname, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { exportRevision } from "../src/contracts.js";
import {
  appendEvent,
  createRun,
  evaluationDigest,
  FencedError,
  putEvidence,
  readEvidence,
  readRun,
  recoverRun,
  releaseRun,
  type EvaluationManifest,
  type JournalEvent,
  type RunHandle,
} from "../src/evidence.js";
import {
  captureSource,
  importSource,
  type SourceSnapshot,
  type WritePolicy,
} from "../src/workspace.js";

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, "../src/cli.ts");
const writer = join(here, "run-writer.ts");
const tsx = import.meta.resolve("tsx");

const scratch = mkdtempSync(join(tmpdir(), "pactwright-harness-b-"));
after(() => rmSync(scratch, { recursive: true, force: true }));
const fresh = (name: string): string => join(scratch, `${name}-${randomUUID()}`);

const git = (cwd: string, args: string[]): string =>
  execFileSync(
    "git",
    ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", ...args],
    { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ).trim();

/** A small repository: source, a contract, an executable, binary bytes and a link. */
function sourceRepo(): { root: string; head: string } {
  const root = fresh("repo");
  mkdirSync(join(root, "src"), { recursive: true });
  mkdirSync(join(root, "docs"));
  mkdirSync(join(root, "bin"));
  writeFileSync(join(root, "src/lib.ts"), "export const answer = 42;\n");
  writeFileSync(join(root, "src/verifier.ts"), "// approved verifier\n");
  writeFileSync(join(root, "docs/contract.yml"), "id: CP99-S01\n");
  writeFileSync(join(root, "bin/run.sh"), "#!/bin/sh\necho run\n");
  chmodSync(join(root, "bin/run.sh"), 0o755);
  writeFileSync(join(root, "src/logo.bin"), Buffer.from([0, 255, 13, 10, 0]));
  symlinkSync("contract.yml", join(root, "docs/current.yml"));
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
const noFence = async (): Promise<void> => undefined;

async function baseRun(): Promise<{ run: RunHandle; base: SourceSnapshot; repo: string }> {
  const { root, head } = sourceRepo();
  const run = createRun(fresh("run"));
  const imported = await importSource(run, root, head);
  assert.ok(imported.ok, imported.ok ? "" : imported.diagnostics.join("\n"));
  return { run, base: imported.snapshot, repo: root };
}

/** Exports a snapshot of the run's source repository into a new directory. */
async function checkout(run: RunHandle, snapshot: SourceSnapshot): Promise<string> {
  const dir = fresh("tree");
  mkdirSync(dir);
  await exportRevision(join(run.dir, "source.git"), snapshot.commit, dir);
  return dir;
}

function capture(run: RunHandle, dir: string, base: SourceSnapshot) {
  const result = captureSource(run.dir, dir, base, policy, "candidate");
  assert.ok(result.ok, result.ok ? "" : result.diagnostics.join("\n"));
  return result.candidate;
}

/** Path → digest of every file and link below `dir`, including the run's own records. */
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

const refs = (run: RunHandle): string =>
  execFileSync("git", ["--git-dir", join(run.dir, "source.git"), "for-each-ref"], {
    encoding: "utf8",
  });

describe("T3-B source identity", () => {
  it("B02 imports the base as Git's own tree and reproduces unchanged snapshots", async () => {
    const { run, base, repo } = await baseRun();
    assert.equal(base.tree, git(repo, ["rev-parse", "HEAD^{tree}"]));
    const first = capture(run, await checkout(run, base), base);
    const second = capture(run, await checkout(run, base), base);
    assert.equal(first.tree, base.tree);
    assert.deepEqual(first.changes, []);
    assert.equal(second.commit, first.commit);
  });

  it("B02 alters the identity for new, binary, edited and mode changes, preserving bytes", async () => {
    const { run, base } = await baseRun();
    const bytes = Buffer.from(Array.from({ length: 256 }, (_, i) => i));
    const mutations: Record<string, (dir: string) => void> = {
      edited: (dir) => writeFileSync(join(dir, "src/lib.ts"), "export const answer = 43;\n"),
      new: (dir) => writeFileSync(join(dir, "src/new.ts"), "export {};\n"),
      binary: (dir) => writeFileSync(join(dir, "src/logo.bin"), bytes),
      mode: (dir) => chmodSync(join(dir, "src/lib.ts"), 0o755),
    };
    const trees = new Set([base.tree]);
    for (const [name, mutate] of Object.entries(mutations)) {
      const dir = await checkout(run, base);
      mutate(dir);
      const sealed = capture(run, dir, base);
      assert.ok(!trees.has(sealed.tree), `${name} changes the tree`);
      trees.add(sealed.tree);
      assert.equal(sealed.changes.length, 1, name);
      const out = await checkout(run, sealed);
      assert.deepEqual(digestTree(out), digestTree(dir), `${name} round-trips`);
    }
    const binary = await checkout(run, base);
    writeFileSync(join(binary, "src/logo.bin"), bytes);
    const sealed = capture(run, binary, base);
    assert.deepEqual(readFileSync(join(await checkout(run, sealed), "src/logo.bin")), bytes);
  });

  it("B02 excludes scratch build output, so a stale build cannot satisfy capture", async () => {
    const { run, base } = await baseRun();
    const dir = await checkout(run, base);
    mkdirSync(join(dir, "dist"));
    writeFileSync(join(dir, "dist/lib.js"), "export const answer = 42;\n");
    writeFileSync(join(dir, "src/lib.ts"), "export const answer = 43;\n");
    const sealed = capture(run, dir, base);
    assert.deepEqual(sealed.changes, [{ path: "src/lib.ts", kind: "modified" }]);
    assert.equal(existsSync(join(await checkout(run, sealed), "dist")), false);
  });

  const rejected: { name: string; mutate: (dir: string) => void; cause: RegExp }[] = [
    {
      name: "an absolute link",
      mutate: (dir) => symlinkSync("/etc/passwd", join(dir, "src/passwd")),
      cause: /src\/passwd: unsafe link/,
    },
    {
      name: "an escaping link",
      mutate: (dir) => symlinkSync("../../outside", join(dir, "src/up")),
      cause: /src\/up: unsafe link/,
    },
    {
      name: "a FIFO",
      mutate: (dir) => execFileSync("mkfifo", [join(dir, "src/pipe")]),
      cause: /src\/pipe: not a regular file/,
    },
    {
      name: "Git metadata",
      mutate: (dir) => mkdirSync(join(dir, "src/.git")),
      cause: /src\/\.git: Git metadata/,
    },
    {
      name: "an edit outside the writable paths",
      mutate: (dir) => writeFileSync(join(dir, "docs/contract.yml"), "id: CP99-S02\n"),
      cause: /docs\/contract\.yml: modified outside/,
    },
    {
      name: "an undeclared new file",
      mutate: (dir) => writeFileSync(join(dir, "extra.ts"), "export {};\n"),
      cause: /extra\.ts: added outside/,
    },
    {
      name: "a deletion outside the writable paths",
      mutate: (dir) => unlinkSync(join(dir, "bin/run.sh")),
      cause: /bin\/run\.sh: deleted outside/,
    },
    {
      name: "a protected-file edit",
      mutate: (dir) => writeFileSync(join(dir, "src/verifier.ts"), "// weakened\n"),
      cause: /src\/verifier\.ts: modified outside/,
    },
  ];
  for (const { name, mutate, cause } of rejected) {
    it(`B02 rejects ${name} and records no snapshot`, async () => {
      const { run, base } = await baseRun();
      const dir = await checkout(run, base);
      mutate(dir);
      const before = refs(run);
      const result = captureSource(run.dir, dir, base, policy, "candidate");
      assert.equal(result.ok, false);
      assert.match(result.ok ? "" : result.diagnostics.join("\n"), cause);
      assert.equal(refs(run), before);
    });
  }

  it("B02 derives a stable evaluation digest that covers every identity part", () => {
    const manifest: EvaluationManifest = {
      source: { commit: "c".repeat(40), tree: "t".repeat(40) },
      definitions: "sha256:d",
      step: { id: "CP99-S01", definition: "sha256:s" },
      inputs: [
        { step: "CP99-S01", output: "b", evaluation: "sha256:2" },
        { step: "CP99-S01", output: "a", evaluation: "sha256:1" },
      ],
      harness: "0.0.0",
      runModel: "software-bootstrap",
      verifiers: { "parser.accepts": "sha256:v1", "parser.rejects": "sha256:v2" },
      rubric: "sha256:r",
      skills: { "karpathy-guidelines": "sha256:k" },
      configuration: "sha256:c",
      toolchain: { profile: "sha256:p", lockfile: "sha256:l" },
    };
    const digest = evaluationDigest(manifest);
    assert.match(digest, /^sha256:[0-9a-f]{64}$/);
    const reordered: EvaluationManifest = {
      toolchain: { lockfile: "sha256:l", profile: "sha256:p" },
      configuration: "sha256:c",
      skills: { "karpathy-guidelines": "sha256:k" },
      rubric: "sha256:r",
      verifiers: { "parser.rejects": "sha256:v2", "parser.accepts": "sha256:v1" },
      runModel: "software-bootstrap",
      harness: "0.0.0",
      inputs: [...manifest.inputs].reverse(),
      step: { definition: "sha256:s", id: "CP99-S01" },
      definitions: "sha256:d",
      source: { tree: "t".repeat(40), commit: "c".repeat(40) },
    };
    assert.equal(evaluationDigest(reordered), digest);
    const variants: EvaluationManifest[] = [
      { ...manifest, source: { ...manifest.source, tree: "u".repeat(40) } },
      { ...manifest, definitions: "sha256:e" },
      { ...manifest, step: { ...manifest.step, definition: "sha256:t" } },
      { ...manifest, inputs: manifest.inputs.slice(1) },
      { ...manifest, harness: "0.0.1" },
      { ...manifest, runModel: "other" },
      { ...manifest, verifiers: { ...manifest.verifiers, "parser.accepts": "sha256:v3" } },
      { ...manifest, rubric: null },
      { ...manifest, skills: {} },
      { ...manifest, configuration: "sha256:x" },
      { ...manifest, toolchain: { ...manifest.toolchain, lockfile: null } },
    ];
    const digests = new Set([digest, ...variants.map(evaluationDigest)]);
    assert.equal(digests.size, variants.length + 1);
  });
});

/** Spawns the helper controller; resolves with its events once it has written them. */
function controller(
  dir: string,
  count: number,
  mode: "crash" | "wait",
): Promise<{ events: JournalEvent[]; pid: number; exited: Promise<unknown> }> {
  const child = spawn(process.execPath, ["--import", tsx, writer, dir, String(count), mode], {
    stdio: ["ignore", "pipe", "inherit"],
  });
  after(() => child.kill("SIGKILL"));
  const exited = new Promise((done) => child.on("exit", done));
  return new Promise((done, fail) => {
    let out = "";
    child.stdout.on("data", (b: Buffer) => {
      out += b.toString("utf8");
      if (out.endsWith("\n")) {
        done({ events: JSON.parse(out) as JournalEvent[], pid: child.pid ?? 0, exited });
      }
    });
    child.on("error", fail);
  });
}

const segment = (run: { dir: string }, epoch: number): string =>
  join(run.dir, "journal", `${String(epoch).padStart(6, "0")}.jsonl`);

describe("T3-B durable journal and recovery", () => {
  it("B03 reconstructs the same events after a clean restart", async () => {
    const run = createRun(fresh("run"));
    const ref = putEvidence(run, "observation");
    const written = [
      appendEvent(run, { action: "test", attempt: 1, evidence: [ref], data: { n: 1 } }),
      appendEvent(run, { action: "test", attempt: 2, data: { n: 2 } }),
    ];
    releaseRun(run);
    const recovered = await recoverRun(run.dir, { fence: noFence });
    assert.equal(recovered.kind, "recovered");
    if (recovered.kind !== "recovered") return;
    assert.deepEqual(recovered.events.slice(1, 3), written);
    assert.deepEqual(
      recovered.events.map((e) => e.action),
      ["owner", "test", "test", "released"],
    );
    const next = appendEvent(recovered.run, { action: "test" });
    assert.equal(next.seq, 6);
    assert.equal(recovered.run.epoch, 2);
    assert.deepEqual(readEvidence(run.dir, ref), Buffer.from("observation"));
  });

  it("B03 recovers a killed controller process and fences its workers", async () => {
    const dir = fresh("run");
    const child = await controller(dir, 3, "crash");
    await child.exited;
    const fenced: string[] = [];
    const recovered = await recoverRun(dir, {
      fence: async (id) => {
        fenced.push(id);
      },
    });
    assert.equal(recovered.kind, "recovered");
    if (recovered.kind !== "recovered") return;
    assert.deepEqual(recovered.events.slice(1), child.events);
    assert.deepEqual(fenced, [recovered.run.run]);
  });

  it("B03 quarantines a truncated final write and continues the sequence", async () => {
    const dir = fresh("run");
    const child = await controller(dir, 2, "crash");
    await child.exited;
    const partial = Buffer.from('{"action":"test","attempt":1,"da');
    appendFileSync(segment({ dir }, 1), partial);
    const recovered = await recoverRun(dir, { fence: noFence });
    assert.equal(recovered.kind, "recovered");
    if (recovered.kind !== "recovered") return;
    assert.deepEqual(recovered.events.slice(1), child.events);
    assert.ok(recovered.quarantined);
    assert.deepEqual(readEvidence(dir, recovered.quarantined), partial);
    assert.equal(appendEvent(recovered.run, { action: "test" }).seq, 5);
    const read = readRun(dir);
    assert.ok(read.ok);
    assert.equal(read.records.events.length, 5);
    assert.equal(read.records.tail, null);
    assert.deepEqual(read.records.ignored, [{ epoch: 1, bytes: partial.length }]);
  });

  it("B03 quarantines a complete final line whose anchor was not written", async () => {
    const dir = fresh("run");
    const child = await controller(dir, 2, "crash");
    await child.exited;
    const text = readFileSync(segment({ dir }, 1), "utf8");
    const last = text.slice(0, -1).split("\n").at(-1) ?? "";
    const next = { ...(JSON.parse(last) as JournalEvent), seq: 4 };
    next.prev = `sha256:${createHash("sha256").update(last).digest("hex")}`;
    const unanchored = `${JSON.stringify(next)}\n`;
    appendFileSync(segment({ dir }, 1), unanchored);
    const recovered = await recoverRun(dir, { fence: noFence });
    assert.equal(recovered.kind, "recovered");
    if (recovered.kind !== "recovered") return;
    assert.deepEqual(recovered.events.slice(1), child.events);
    assert.ok(recovered.quarantined);
    assert.equal(readEvidence(dir, recovered.quarantined).toString("utf8"), unanchored);
    assert.equal(appendEvent(recovered.run, { action: "test" }).seq, 5);
  });

  const corruptions: { name: string; corrupt: (dir: string) => void; cause: RegExp }[] = [
    {
      name: "an edited committed line",
      corrupt: (dir) => {
        const text = readFileSync(segment({ dir }, 1), "utf8");
        writeFileSync(segment({ dir }, 1), text.replace('"i":0', '"i":7'));
      },
      cause: /000001\.jsonl:3: expected .*"prev"/,
    },
    {
      name: "a committed line that is not JSON",
      corrupt: (dir) => {
        const lines = readFileSync(segment({ dir }, 1), "utf8").split("\n");
        lines[1] = "not json";
        writeFileSync(segment({ dir }, 1), lines.join("\n"));
      },
      cause: /000001\.jsonl:2: not JSON/,
    },
    {
      name: "a removed committed line",
      corrupt: (dir) => {
        const lines = readFileSync(segment({ dir }, 1), "utf8").split("\n");
        lines.splice(1, 1);
        writeFileSync(segment({ dir }, 1), lines.join("\n"));
      },
      cause: /000001\.jsonl:2: expected .*"seq":2/,
    },
    {
      name: "a missing evidence blob",
      corrupt: (dir) => {
        for (const blob of readdirSync(join(dir, "evidence"))) {
          rmSync(join(dir, "evidence", blob), { force: true });
        }
      },
      cause: /missing evidence sha256:/,
    },
    {
      name: "a tampered evidence blob",
      corrupt: (dir) => {
        for (const blob of readdirSync(join(dir, "evidence"))) {
          chmodSync(join(dir, "evidence", blob), 0o644);
          writeFileSync(join(dir, "evidence", blob), "forged");
        }
      },
      cause: /corrupt evidence sha256:/,
    },
    {
      // Review 5336199212 finding 2: schema, seq and prev stay valid.
      name: "a lengthened final line",
      corrupt: (dir) => {
        const text = readFileSync(segment({ dir }, 1), "utf8");
        const edited = text.replace(/"data":\{\}(?=[^\n]*\n$)/, '"data":{"forged":true}');
        assert.notEqual(edited, text);
        writeFileSync(segment({ dir }, 1), edited);
      },
      cause: /000001\.jsonl: committed lines do not match their anchor/,
    },
    {
      name: "a same-length edit of the final line",
      corrupt: (dir) => {
        const text = readFileSync(segment({ dir }, 1), "utf8");
        const edited = text.replace(/"time":"\d{4}(?=[^\n]*\n$)/, '"time":"1999');
        assert.notEqual(edited, text);
        assert.equal(edited.length, text.length);
        writeFileSync(segment({ dir }, 1), edited);
      },
      cause: /000001\.jsonl: committed lines do not match their anchor/,
    },
    {
      name: "a deleted anchor",
      corrupt: (dir) => rmSync(join(dir, "journal", "000001.head")),
      cause: /000001\.jsonl: committed lines have no anchor/,
    },
    {
      name: "more than one unanchored line",
      corrupt: (dir) => {
        const lines = readFileSync(segment({ dir }, 1), "utf8").split("\n");
        appendFileSync(segment({ dir }, 1), `${lines[1]}\n${lines[2]}\n`);
      },
      cause: /000001\.jsonl: more than one unanchored line/,
    },
    {
      name: "an unexpected segment",
      corrupt: (dir) => writeFileSync(join(dir, "journal", "000003.jsonl"), ""),
      cause: /000003\.jsonl: unexpected segment/,
    },
  ];
  for (const { name, corrupt, cause } of corruptions) {
    it(`B03 pauses recovery on ${name} and changes nothing`, async () => {
      const dir = fresh("run");
      const run = createRun(dir);
      const ref = putEvidence(run, "observation");
      for (let i = 0; i < 3; i += 1) {
        appendEvent(run, { action: "test", evidence: i === 1 ? [ref] : [], data: { i } });
      }
      releaseRun(run);
      corrupt(dir);
      const before = digestTree(dir);
      let fenced = false;
      const recovered = await recoverRun(dir, {
        fence: async () => {
          fenced = true;
        },
      });
      assert.equal(recovered.kind, "paused");
      assert.match(recovered.kind === "paused" ? recovered.diagnostics.join("\n") : "", cause);
      assert.deepEqual(digestTree(dir), before);
      assert.equal(fenced, false);
    });
  }

  it("B03 refuses to journal evidence that is not stored", () => {
    const run = createRun(fresh("run"));
    const before = readFileSync(segment(run, 1));
    assert.throws(
      () => appendEvent(run, { action: "test", evidence: [`sha256:${"0".repeat(64)}`] }),
      /evidence is not stored/,
    );
    assert.throws(() => appendEvent(run, { action: "owner" }), /reserved/);
    assert.throws(
      () => appendEvent(run, { action: "test", evidence: ["sha256:../../manifest.json"] }),
      /not an evidence reference/,
    );
    assert.deepEqual(readFileSync(segment(run, 1)), before);
  });
});

describe("T3-B exclusive ownership and fencing", () => {
  it("B04 refuses a second controller while the owner lives", async () => {
    const run = createRun(fresh("run"));
    const recovered = await recoverRun(run.dir, { fence: noFence });
    assert.equal(recovered.kind, "locked");
    assert.equal(recovered.kind === "locked" ? recovered.liveness : "", "live");
    assert.equal(existsSync(segment(run, 2)), false);
    appendEvent(run, { action: "test" });
  });

  it("B04 takes over only after the owner process dies; late writes change nothing", async () => {
    const dir = fresh("run");
    const child = await controller(dir, 2, "wait");
    const locked = await recoverRun(dir, { fence: noFence });
    assert.equal(locked.kind, "locked");
    process.kill(child.pid, "SIGKILL");
    await child.exited;
    const recovered = await recoverRun(dir, { fence: noFence });
    assert.equal(recovered.kind, "recovered");
    if (recovered.kind !== "recovered") return;
    const committed = readRun(dir);
    assert.ok(committed.ok);
    const late = readFileSync(segment({ dir }, 1), "utf8").split("\n").at(-2) ?? "";
    appendFileSync(segment({ dir }, 1), `${late}\n`);
    const read = readRun(dir);
    assert.ok(read.ok);
    assert.deepEqual(read.records.events, committed.records.events);
    assert.deepEqual(read.records.ignored, [{ epoch: 1, bytes: late.length + 1 }]);
  });

  it("B04 fences the old writer once a new controller owns the run", async () => {
    const old = createRun(fresh("run"));
    appendEvent(old, { action: "test" });
    const recovered = await recoverRun(old.dir, { fence: noFence, liveness: () => "dead" });
    assert.equal(recovered.kind, "recovered");
    if (recovered.kind !== "recovered") return;
    assert.throws(() => appendEvent(old, { action: "test" }), FencedError);
    assert.throws(() => releaseRun(old), FencedError);
    appendEvent(recovered.run, { action: "test" });
    const second = await recoverRun(old.dir, { fence: noFence, liveness: () => "unknown" });
    assert.equal(second.kind, "locked");
    const read = readRun(old.dir);
    assert.ok(read.ok);
    assert.deepEqual(
      read.records.events.map((e) => [e.epoch, e.action]),
      [
        [1, "owner"],
        [1, "test"],
        [2, "owner"],
        [2, "test"],
      ],
    );
  });

  it("B04 status derives facts from valid records and writes nothing", () => {
    const run = createRun(fresh("run"));
    appendEvent(run, { action: "candidate-sealed", attempt: 1 });
    appendEvent(run, { action: "test", attempt: 2 });
    appendFileSync(segment(run, 1), '{"trunc');
    const before = digestTree(run.dir);
    const status = spawnSync(process.execPath, ["--import", tsx, cli, "status", "--run", run.dir], {
      encoding: "utf8",
    });
    assert.equal(status.status, 0, status.stderr);
    assert.deepEqual(digestTree(run.dir), before);
    const facts = JSON.parse(status.stdout) as Record<string, unknown>;
    assert.equal(facts.run, run.run);
    assert.equal(facts.events, 3);
    assert.equal(facts.lastSeq, 3);
    assert.deepEqual(facts.actions, { "candidate-sealed": 1, owner: 1, test: 1 });
    assert.deepEqual(facts.attempts, [1, 2]);
    assert.equal(facts.incompleteTailBytes, 7);
    assert.deepEqual(facts.owner, { epoch: 1, host: hostname(), pid: process.pid, state: "live" });

    const missing = spawnSync(
      process.execPath,
      ["--import", tsx, cli, "status", "--run", fresh("none")],
      { encoding: "utf8" },
    );
    assert.equal(missing.status, 2);
    assert.match(missing.stderr, /not a run directory/);
  });
});
