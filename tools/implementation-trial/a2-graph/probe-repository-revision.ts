/**
 * A2-G probe: what `repositoryRevision` can and cannot tell apart.
 *
 * Spec 01 §56 makes the repository revision the identity of "the delivered
 * state an agent actually saw", and `checkEvidenceClosure` compares these
 * identifiers to decide whether a Review still covers what was delivered.
 * Anything two *different* delivered states share an identifier for is
 * content a Review closes over without having seen.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  DELIVERY_DIGEST_EXCLUDED,
  isReconstructible,
  repositoryRevision,
} from "../../../src/graph/repository.js";
import { git, makeProject, observe, summary } from "./fixture.js";

const write = (root: string, path: string, content: string | Buffer): void => {
  const full = join(root, path);
  mkdirSync(join(full, ".."), { recursive: true });
  writeFileSync(full, content);
};

/* G-REV-1 — two different tracked *binary* contents at one path. */
{
  const root = makeProject("bin", { git: false });
  write(root, "assets/logo.png", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x01]));
  const { initGit } = await import("./fixture.js");
  initGit(root);
  write(root, "assets/logo.png", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x02]));
  const first = repositoryRevision(root).id;
  write(root, "assets/logo.png", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0xff, 0xfe]));
  const second = repositoryRevision(root).id;
  observe(
    "G-REV-1 tracked binary content",
    "two different binary contents at one tracked path derive two different identities",
    first === second ? `both derive ${first}` : `first=${first} second=${second}`,
    first !== second,
  );
}

/* G-REV-2 — a tracked *text* change is distinguished (positive control). */
{
  const root = makeProject("text");
  write(root, "src/app.ts", "export const a = 1;\n");
  const first = repositoryRevision(root).id;
  write(root, "src/app.ts", "export const a = 2;\n");
  const second = repositoryRevision(root).id;
  observe(
    "G-REV-2 tracked text content (positive control)",
    "two different text contents at one tracked path derive two different identities",
    first === second ? `both derive ${first}` : "first and second differ",
    first !== second,
  );
}

/* G-REV-3 — an untracked binary file is covered (positive control). */
{
  const root = makeProject("untracked");
  write(root, "out.bin", Buffer.from([1, 2, 3]));
  const first = repositoryRevision(root).id;
  write(root, "out.bin", Buffer.from([1, 2, 4]));
  const second = repositoryRevision(root).id;
  observe(
    "G-REV-3 untracked binary content (positive control)",
    "two different untracked binary contents derive two different identities",
    first === second ? `both derive ${first}` : "first and second differ",
    first !== second,
  );
}

/* G-REV-4 — delivered change confined to the excluded adapter surface. */
{
  const root = makeProject("adapter");
  const clean = repositoryRevision(root).id;
  write(root, ".claude/commands/deliver-brief.md", "# replaced by the agent\n");
  write(root, ".claude/agents/implementer.md", "# replaced by the agent\n");
  const after = repositoryRevision(root).id;
  observe(
    "G-REV-4 excluded adapter surface",
    "a delivered change to .claude/commands and .claude/agents moves the identity",
    after === clean
      ? `identity unchanged at ${after}; excluded prefixes are ${DELIVERY_DIGEST_EXCLUDED.join(", ")}`
      : "identity moved",
    after !== clean,
  );
  observe(
    "G-REV-4b reconstructibility of that state",
    "a state carrying undeclared delivered content is not reported as reconstructible",
    `isReconstructible(${after}) = ${String(isReconstructible(after))}`,
    !isReconstructible(after),
  );
}

/* G-REV-5 — a project outside any git work tree. */
{
  const root = makeProject("nogit", { git: false });
  const before = repositoryRevision(root).id;
  write(root, "src/app.ts", "export const a = 1;\n");
  const after = repositoryRevision(root).id;
  observe(
    "G-REV-5 no work tree",
    "outside a work tree, two different delivered states do not share one identity",
    before === after ? `both derive "${before}"` : "identities differ",
    before !== after,
  );
}

/* G-REV-6 — a tracked file deleted, and a tracked file's mode changed. */
{
  const root = makeProject("modes");
  write(root, "script.sh", "#!/bin/sh\necho hi\n");
  git(root, ["add", "-A"]);
  git(root, ["commit", "-q", "-m", "script"]);
  const clean = repositoryRevision(root).id;
  git(root, ["update-index", "--chmod=+x", "script.sh"]);
  const chmod = repositoryRevision(root).id;
  observe(
    "G-REV-6 tracked mode change",
    "a mode-only change to a tracked file moves the identity",
    chmod === clean ? `identity unchanged at ${clean}` : "identity moved",
    chmod !== clean,
  );
}

/* G-REV-7 — determinism: the same state always derives the same identity. */
{
  const root = makeProject("determinism");
  write(root, "a.txt", "one\n");
  write(root, "b.bin", Buffer.from([7, 7, 7]));
  const runs = new Set([0, 1, 2, 3, 4].map(() => repositoryRevision(root).id));
  observe(
    "G-REV-7 determinism (positive control)",
    "five reads of one unchanged state derive one identity",
    `${runs.size} distinct identities`,
    runs.size === 1,
  );
}

summary();
