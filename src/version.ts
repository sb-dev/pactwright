import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * The npm package name of the Pactwright runtime.
 *
 * It lives beside `runtimeVersion` because both answer "which runtime is
 * this": the upgrade path and the environment validation scope both need the
 * name, and putting it in either of them would make the other import it.
 */
export const RUNTIME_PACKAGE = "pactwright";

/** The runtime package version, read from the package manifest shipped with the build. */
export function runtimeVersion(): string {
  const manifestPath = fileURLToPath(new URL("../package.json", import.meta.url));
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { version: string };
  return manifest.version;
}
