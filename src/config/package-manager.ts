import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Problem } from "../errors.js";

/**
 * Package managers Pactwright can delegate to. Pactwright never installs
 * packages itself (Distribution §25): it detects the project's package
 * manager and hands installation to it.
 */
export const PACKAGE_MANAGERS = ["pnpm", "npm", "yarn", "bun"] as const;
export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

/** The lock file each package manager owns, used for unambiguous detection. */
const LOCK_FILES: Readonly<Record<PackageManager, readonly string[]>> = {
  pnpm: ["pnpm-lock.yaml"],
  npm: ["package-lock.json", "npm-shrinkwrap.json"],
  yarn: ["yarn.lock"],
  bun: ["bun.lockb", "bun.lock"],
};

export interface DetectedPackageManager {
  readonly name: PackageManager;
  /** Exact version when `packageManager` declares one, e.g. `pnpm@11.7.0`. */
  readonly version?: string;
  /** How it was determined, for `doctor` to report. */
  readonly source: "declared" | "lock-file";
  /** The package-manager lock file backing the project, when one exists. */
  readonly lockFile?: string;
}

export interface PackageManagerDetection {
  readonly value?: DetectedPackageManager;
  readonly problems: readonly Problem[];
}

function readPackageJson(root: string): Record<string, unknown> | undefined {
  const path = join(root, "package.json");
  if (!existsSync(path)) return undefined;
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Detects the project package manager from an explicit `packageManager`
 * declaration, else from unambiguous lock-file state (Checkpoint 1 Step 19).
 * Two competing lock files are ambiguous and reported rather than guessed.
 */
export function detectPackageManager(root: string): PackageManagerDetection {
  const path = join(root, "package.json");
  const manifest = readPackageJson(root);
  const declared = manifest?.["packageManager"];
  const found = PACKAGE_MANAGERS.filter((name) =>
    LOCK_FILES[name].some((file) => existsSync(join(root, file))),
  );

  if (typeof declared === "string" && declared.length > 0) {
    const [name, version] = declared.split("@", 2) as [string, string | undefined];
    if (!(PACKAGE_MANAGERS as readonly string[]).includes(name)) {
      return {
        problems: [
          {
            code: "unsupported-package-manager",
            message: `package.json "packageManager" declares "${declared}"; Pactwright supports ${PACKAGE_MANAGERS.join(", ")}`,
            path,
          },
        ],
      };
    }
    const manager = name as PackageManager;
    const lockFile = LOCK_FILES[manager].find((file) => existsSync(join(root, file)));
    return {
      value: {
        name: manager,
        ...(version === undefined || version.length === 0 ? {} : { version }),
        source: "declared",
        ...(lockFile === undefined ? {} : { lockFile }),
      },
      problems: [],
    };
  }

  if (found.length === 1) {
    const manager = found[0]!;
    return {
      value: {
        name: manager,
        source: "lock-file",
        lockFile: LOCK_FILES[manager].find((file) => existsSync(join(root, file)))!,
      },
      problems: [],
    };
  }
  if (found.length > 1) {
    return {
      problems: [
        {
          code: "ambiguous-package-manager",
          message: `lock files for ${found.join(" and ")} both exist; declare "packageManager" in package.json so Pactwright delegates to the right one`,
          path,
        },
      ],
    };
  }
  return {
    problems: [
      {
        code: "no-package-manager",
        message: `no package manager could be detected: package.json declares no "packageManager" and no lock file was found`,
        path,
      },
    ],
  };
}

/**
 * The version the package manager actually installed for `name`, read from
 * the installed package's own manifest. This is the installed truth the
 * Pactwright lock must agree with.
 */
export function installedVersion(root: string, name: string): string | undefined {
  const require = createRequire(join(root, "package.json"));
  for (const specifier of [`${name}/package.json`, name]) {
    try {
      const resolved = require.resolve(specifier);
      const manifestPath = specifier.endsWith("package.json")
        ? resolved
        : findManifest(resolved, name);
      if (manifestPath === undefined) continue;
      const parsed: unknown = JSON.parse(readFileSync(manifestPath, "utf8"));
      const version = (parsed as { version?: unknown }).version;
      if (typeof version === "string") return version;
    } catch {
      continue;
    }
  }
  return undefined;
}

/** Walks up from a resolved entry point to the owning `package.json`. */
function findManifest(entry: string, name: string): string | undefined {
  const marker = `node_modules/${name.replace(/\\/g, "/")}/`;
  const normalised = entry.replace(/\\/g, "/");
  const index = normalised.lastIndexOf(marker);
  if (index < 0) return undefined;
  return join(normalised.slice(0, index + marker.length), "package.json");
}
