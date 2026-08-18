import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** The runtime package version, read from the package manifest shipped with the build. */
export function runtimeVersion(): string {
  const manifestPath = fileURLToPath(new URL("../package.json", import.meta.url));
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { version: string };
  return manifest.version;
}
