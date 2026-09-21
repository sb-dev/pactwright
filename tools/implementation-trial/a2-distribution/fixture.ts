/**
 * A2-D probe fixtures.
 *
 * Every probe builds a *real* Pactwright project in a temporary directory and
 * drives the reference's own production code against it. Nothing here repairs
 * or re-implements the runtime: the only injected seams are the ones the
 * production signatures already expose (`install`, `view`, `reenter`), which
 * exist so a probe never reaches a registry or a credential.
 */
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

export interface PackSpec {
  readonly name: string;
  readonly version: string;
  /** The `pactwright:` compatibility range the pack declares. */
  readonly pactwright: string;
}

export function write(root: string, relPath: string, content: string): void {
  const target = join(root, relPath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content, "utf8");
}

/** Installs a complete, resolvable agent pack into `<root>/node_modules/<name>`. */
export function installPack(root: string, pack: PackSpec): string {
  const dir = join(root, "node_modules", ...pack.name.split("/"));
  write(
    root,
    `node_modules/${pack.name}/package.json`,
    `${JSON.stringify({ name: pack.name, version: pack.version, type: "module" }, null, 2)}\n`,
  );
  write(
    root,
    `node_modules/${pack.name}/pack.yml`,
    [
      `name: "${pack.name}"`,
      `version: ${pack.version}`,
      `pactwright: ${pack.pactwright}`,
      ``,
      `capabilities:`,
      `  delivery-specification: spec`,
      `  delivery-execution: implementer`,
      `  delivery-review: reviewer`,
      ``,
      `agents:`,
      `  spec:`,
      `    prompt: agents/spec.md`,
      `    skills: [probe-skill]`,
      `  implementer:`,
      `    prompt: agents/implementer.md`,
      `    skills: [probe-skill]`,
      `  reviewer:`,
      `    prompt: agents/reviewer.md`,
      `    skills: [probe-skill]`,
      ``,
    ].join("\n"),
  );
  for (const agent of ["spec", "implementer", "reviewer"]) {
    write(
      root,
      `node_modules/${pack.name}/agents/${agent}.md`,
      `# ${agent}\n\nProbe pack agent.\n`,
    );
  }
  write(root, `node_modules/${pack.name}/skills/probe-skill.md`, `# probe-skill\n\nProbe skill.\n`);
  return dir;
}

export interface ExtensionSpec {
  readonly id: string;
  readonly pkg: string;
  readonly version: string;
  readonly pactwright: string;
  /** Raw `graph:` block, so a probe can declare schema versions and migrations. */
  readonly graph: string;
}

export function installExtension(root: string, ext: ExtensionSpec): string {
  write(
    root,
    `node_modules/${ext.pkg}/package.json`,
    `${JSON.stringify({ name: ext.pkg, version: ext.version, type: "module" }, null, 2)}\n`,
  );
  write(
    root,
    `node_modules/${ext.pkg}/extension.yml`,
    [
      `id: ${ext.id}`,
      `package: "${ext.pkg}"`,
      `version: ${ext.version}`,
      `pactwright: ${ext.pactwright}`,
      ``,
      ext.graph,
      ``,
      `runtime:`,
      `  namespace: probes`,
      ``,
    ].join("\n"),
  );
  return join(root, "node_modules", ...ext.pkg.split("/"));
}

export interface ProjectOptions {
  readonly pack: PackSpec;
  /** Extensions to install and enable. */
  readonly extensions?: readonly ExtensionSpec[];
  /** `packageManager` declaration; omit for lock-file detection only. */
  readonly packageManager?: string;
  readonly lockFile?: string;
  /** Version to record for an installed `pactwright` in `node_modules`. */
  readonly runtime?: string;
}

/**
 * A project directory with a package manifest, a package-manager lock, an
 * installed pack and the Pactwright-owned scaffold — everything the real
 * commands read, and nothing simulated.
 */
export function makeProject(options: ProjectOptions): string {
  const root = mkdtempSync(join(tmpdir(), "a2d-"));
  write(
    root,
    "package.json",
    `${JSON.stringify(
      {
        name: "a2d-probe-project",
        private: true,
        version: "0.0.0",
        type: "module",
        ...(options.packageManager === undefined ? {} : { packageManager: options.packageManager }),
        devDependencies: { [options.pack.name]: options.pack.version },
      },
      null,
      2,
    )}\n`,
  );
  write(root, options.lockFile ?? "pnpm-lock.yaml", "lockfileVersion: '9.0'\n");
  installPack(root, options.pack);
  // The runtime itself, as a project dependency: `installedVersion`,
  // `cliReentry` and the environment scope all read it from here.
  if (options.runtime !== undefined) {
    write(
      root,
      "node_modules/pactwright/package.json",
      `${JSON.stringify({ name: "pactwright", version: options.runtime }, null, 2)}\n`,
    );
  }
  for (const ext of options.extensions ?? []) installExtension(root, ext);

  const extensionBlock =
    (options.extensions ?? []).length === 0
      ? "extensions: {}"
      : [
          "extensions:",
          ...(options.extensions ?? []).flatMap((e) => [
            `  ${e.id}:`,
            `    enabled: true`,
            `    source: "${e.pkg}"`,
          ]),
        ].join("\n");

  write(
    root,
    ".pactwright/config.yml",
    [
      "version: 1",
      "",
      "agent_pack:",
      `  source: "${options.pack.name}"`,
      "",
      "adapter:",
      "  type: claude-code",
      "",
      extensionBlock,
      "",
      "github:",
      "  enabled: false",
      "",
    ].join("\n"),
  );
  write(
    root,
    ".pactwright/lifecycle.yml",
    [
      "version: 2",
      "",
      "responsibilities:",
      "  capture-intent:",
      "    execution: manual",
      "  propose-contracts:",
      "    execution: automatic",
      "  approve-contract:",
      "    execution: manual",
      "    actor: human",
      "  write-brief:",
      "    execution: automatic",
      "",
      "shape:",
      "  id: direct",
      "  steps:",
      "    - name: delivery",
      "      kind: delivery",
      "      execution: automatic",
      "    - name: review",
      "      kind: review",
      "      execution: automatic",
      "    - name: evidence",
      "      kind: evidence",
      "      execution: automatic",
      "  transitions: []",
      "",
    ].join("\n"),
  );
  mkdirSync(join(root, "specs", "nodes"), { recursive: true });
  write(root, "specs/nodes/.gitkeep", "");
  write(root, "specs/graph/edges.yml", "edges: []\n");
  mkdirSync(join(root, ".claude", "agents"), { recursive: true });
  mkdirSync(join(root, ".claude", "commands"), { recursive: true });
  return root;
}

export function cleanup(root: string): void {
  rmSync(root, { recursive: true, force: true });
}

/** Prints a labelled block so probe output reads as evidence, not as prose. */
export function report(label: string, value: unknown): void {
  process.stdout.write(`\n--- ${label} ---\n`);
  process.stdout.write(
    typeof value === "string" ? `${value}\n` : `${JSON.stringify(value, null, 2)}\n`,
  );
}
