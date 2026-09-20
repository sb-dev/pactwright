import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { Problem } from "../errors.js";
import { detectPackageManager, type PackageManager } from "../config/package-manager.js";
import { parseConfig, type PactwrightConfig } from "../config/config.js";
import { isPathSource } from "../pack/locate.js";
import { parseSpec } from "../pack/select.js";
import { resolvePack, type ResolvedPack } from "../pack/resolve.js";
import type { PackageInstaller } from "../upgrade.js";
import { packageManagerInstaller } from "../upgrade.js";

/**
 * Isolated acquisition of one side of a baseline comparison (design §5.4).
 *
 * `eval --baseline @pactwright/standard@0.0.1 --candidate …` used to build a
 * synthetic configuration and resolve both sides through ordinary Node
 * resolution from the caller's `node_modules`. The released `0.0.1` baseline
 * therefore resolved to the locally installed `0.0.2` and then failed version
 * matching — the exact Step 28 command in the review could not run at all.
 *
 * A side is acquired into a temporary project at its exact version, checked
 * for runtime compatibility, and resolved from *that* directory, so the two
 * sides cannot silently be the same installation.
 */
export interface AcquireOptions {
  /** `@scope/name@version`, or a path source, exactly as the user typed it. */
  readonly spec: string;
  /** Where the temporary project is created; defaults to the OS temp dir. */
  readonly workDir?: string;
  /** The package manager to delegate installation to. */
  readonly manager?: PackageManager;
  /** Injected seam; defaults to the project's package manager. */
  readonly installer?: PackageInstaller;
  /** Directory a path source is resolved against. Defaults to the caller's cwd. */
  readonly from?: string;
}

export interface AcquiredPack {
  readonly pack: ResolvedPack;
  /** The isolated project root; the caller removes it. */
  readonly root: string;
}

const MINIMAL_MANIFEST = JSON.stringify({ name: "pactwright-eval-side", private: true }, null, 2);

/**
 * Acquires one side and resolves it. Returns problems rather than throwing;
 * the caller removes `root` when it is finished with the pack.
 */
export function acquireSide(options: AcquireOptions): AcquiredPack | readonly Problem[] {
  const parsed = parseSpec(options.spec);
  if ("code" in parsed) return [parsed];

  // A path source is already an exact, isolated thing: acquiring it would
  // copy bytes the user pointed at, which is not an acquisition.
  const root = mkdtempSync(join(options.workDir ?? tmpdir(), "pactwright-eval-side-"));
  let config: PactwrightConfig | undefined;
  if (isPathSource(parsed.source)) {
    // A path source names bytes the caller already has, so it is resolved
    // against *their* directory rather than the temporary one, and nothing
    // is installed: acquiring it would only copy what they pointed at.
    config = sideConfig(resolve(options.from ?? process.cwd(), parsed.source), parsed.version);
  } else {
    writeFileSync(join(root, "package.json"), `${MINIMAL_MANIFEST}\n`, "utf8");
    const manager = options.manager ?? detectPackageManager(process.cwd()).value?.name ?? "npm";
    const installer = options.installer ?? packageManagerInstaller;
    // The exact version, into this directory and no other. Pactwright never
    // implements a parallel package installer (Distribution §15).
    const spec =
      parsed.version === undefined ? parsed.source : `${parsed.source}@${parsed.version}`;
    const problems = installer({ root, manager, spec });
    if (problems.length > 0) {
      rmSync(root, { recursive: true, force: true });
      return problems;
    }
    config = sideConfig(parsed.source, parsed.version);
  }
  if (config === undefined) {
    rmSync(root, { recursive: true, force: true });
    return [{ code: "invalid-pack-spec", message: `"${options.spec}" is not a usable pack spec` }];
  }

  const resolved = resolvePack({ root, config });
  if (resolved.value === undefined) {
    rmSync(root, { recursive: true, force: true });
    return resolved.problems;
  }

  // Package resolution falls back to the *runtime's* own dependencies when a
  // project does not have the package, which is how `@pactwright/standard`
  // is found after one `pnpm add -D pactwright`. For an acquired side that
  // fallback is the very leak this exists to close: it would silently
  // evaluate the locally installed pack instead of the requested version.
  if (!isPathSource(parsed.source) && !resolved.value.dir.startsWith(root)) {
    const dir = resolved.value.dir;
    rmSync(root, { recursive: true, force: true });
    return [
      {
        code: "pack-not-isolated",
        message: `"${options.spec}" resolved to ${dir}, outside the acquired environment; the requested version was not installed`,
      },
    ];
  }

  // `resolvePack` has already checked the pack's declared `pactwright` range
  // against the running runtime, so an incompatible side arrives here as
  // resolution problems rather than a usable pack.
  return { pack: resolved.value, root };
}

function sideConfig(source: string, version: string | undefined): PactwrightConfig | undefined {
  return parseConfig(
    {
      version: 1,
      agent_pack: version === undefined ? { source } : { source, version },
      adapter: { type: "claude-code" },
      github: { enabled: false },
    },
    "eval-side.yml",
  ).value;
}
