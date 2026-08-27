import { fileURLToPath } from "node:url";

/** The published package name; also the `agent_pack.source` default. */
export const PACK_NAME = "@pactwright/standard";

/** File name of the pack manifest at the package root (Distribution §7). */
export const MANIFEST_FILE = "pack.yml";

/** Absolute directory of the installed pack (where `pack.yml`, `agents/` and `skills/` live). */
export const PACK_DIR = fileURLToPath(new URL("..", import.meta.url));

/** Absolute path of the installed pack manifest. */
export const MANIFEST_PATH = fileURLToPath(new URL(`../${MANIFEST_FILE}`, import.meta.url));
