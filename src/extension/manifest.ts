import { existsSync } from "node:fs";
import { join as joinPath } from "node:path";
import type { ParseResult } from "../config/config.js";
import { EXTENSION_ID_PATTERN } from "../config/lock.js";
import { CAPABILITY_PATTERN } from "../pack/capabilities.js";
import { COMPAT_PATTERN, PACKAGE_NAME_PATTERN, VERSION_PATTERN } from "../pack/manifest.js";
import {
  Checker,
  expectRecord,
  expectString,
  rejectUnknownKeys,
  requireKeys,
} from "../validation.js";
import { readYamlFile } from "../yaml.js";

/** File name of an extension manifest at the extension package root. */
export const EXTENSION_MANIFEST_FILE = "extension.yml";

/**
 * A versioned extension manifest (Distribution §5). The manifest declares
 * runtime compatibility, extension dependencies, graph contribution, command
 * namespaces, required agent capabilities and the GitHub profile. It
 * contains no project-specific configuration.
 */
export interface ExtensionManifest {
  readonly id: string;
  readonly package: string;
  readonly version: string;
  /** Compatible runtime: an exact version or a `^x.y.z` caret range. */
  readonly pactwright: string;
  /** Ids of extensions this extension requires, in declaration order. */
  readonly dependencies: readonly string[];
  /** Node types this extension owns and registers in the Project Graph. */
  readonly nodeTypes: readonly string[];
  /** Edge types this extension owns; shared core relations are reused, not redeclared. */
  readonly edgeTypes: readonly string[];
  /** Command namespaces the extension registers (`runtime.namespace` or `runtime.namespaces`). */
  readonly namespaces: readonly string[];
  /** Agent capabilities the selected pack must provide while this extension is enabled. */
  readonly agentCapabilities: readonly string[];
  /**
   * Declared GitHub profile: logical automation/projection requirements.
   * Metadata only in this checkpoint — nothing acts on it until GitHub
   * provisioning exists.
   */
  readonly githubProfile?: string;
}

function parseTokenList(
  c: Checker,
  raw: unknown,
  label: string,
  pattern: RegExp,
  kind: string,
): string[] {
  const out: string[] = [];
  if (raw === undefined) return out;
  if (!Array.isArray(raw)) {
    c.fail("invalid-type", `${label} must be a list`);
    return out;
  }
  raw.forEach((item, index) => {
    const text = expectString(c, item, `${label}[${index}]`);
    if (text === undefined) return;
    if (!pattern.test(text)) {
      c.fail("invalid-value", `${label}[${index}] "${text}" is not a valid ${kind}`);
    } else if (out.includes(text)) {
      c.fail("duplicate-value", `${label} lists "${text}" more than once`);
    } else {
      out.push(text);
    }
  });
  return out;
}

/** Parses extension manifest data; structural checks only, no filesystem access. */
export function parseExtensionManifest(raw: unknown, path: string): ParseResult<ExtensionManifest> {
  const c = new Checker(path);
  const root = expectRecord(c, raw, "extension");
  if (root === undefined) {
    c.fail("invalid-type", "extension manifest must be a mapping");
    return { value: undefined, problems: c.problems };
  }
  requireKeys(c, root, "extension", ["id", "package", "version", "pactwright"]);
  rejectUnknownKeys(c, root, "extension", [
    "id",
    "package",
    "version",
    "pactwright",
    "dependencies",
    "graph",
    "runtime",
    "agent_capabilities",
    "github",
  ]);

  const id = expectString(c, root["id"], "extension.id");
  if (id !== undefined && !EXTENSION_ID_PATTERN.test(id)) {
    c.fail("invalid-extension-id", `extension.id "${id}" is not a valid extension id`);
  }
  const pkg = expectString(c, root["package"], "extension.package");
  if (pkg !== undefined && (pkg.length > 214 || !PACKAGE_NAME_PATTERN.test(pkg))) {
    c.fail(
      "invalid-value",
      `extension.package must be a lowercase npm package name (optionally scoped), found "${pkg}"`,
    );
  }
  const version = expectString(c, root["version"], "extension.version");
  if (version !== undefined && !VERSION_PATTERN.test(version)) {
    c.fail("invalid-value", `extension.version must be x.y.z, found "${version}"`);
  }
  const pactwright = expectString(c, root["pactwright"], "extension.pactwright");
  if (pactwright !== undefined && !COMPAT_PATTERN.test(pactwright)) {
    c.fail("invalid-value", `extension.pactwright must be x.y.z or ^x.y.z, found "${pactwright}"`);
  }

  let dependencies: string[] = [];
  if (root["dependencies"] !== undefined) {
    const record = expectRecord(c, root["dependencies"], "extension.dependencies");
    if (record !== undefined) {
      requireKeys(c, record, "extension.dependencies", ["extensions"]);
      rejectUnknownKeys(c, record, "extension.dependencies", ["extensions"]);
      dependencies = parseTokenList(
        c,
        record["extensions"],
        "extension.dependencies.extensions",
        EXTENSION_ID_PATTERN,
        "extension id",
      );
    }
  }

  let nodeTypes: string[] = [];
  let edgeTypes: string[] = [];
  if (root["graph"] !== undefined) {
    const record = expectRecord(c, root["graph"], "extension.graph");
    if (record !== undefined) {
      rejectUnknownKeys(c, record, "extension.graph", ["node_types", "edge_types"]);
      nodeTypes = parseTokenList(
        c,
        record["node_types"],
        "extension.graph.node_types",
        EXTENSION_ID_PATTERN,
        "node type",
      );
      edgeTypes = parseTokenList(
        c,
        record["edge_types"],
        "extension.graph.edge_types",
        EXTENSION_ID_PATTERN,
        "edge type",
      );
    }
  }

  // Distribution §5 uses both `runtime.namespace: x` and `runtime.namespaces: [x, y]`.
  let namespaces: string[] = [];
  if (root["runtime"] !== undefined) {
    const record = expectRecord(c, root["runtime"], "extension.runtime");
    if (record !== undefined) {
      rejectUnknownKeys(c, record, "extension.runtime", ["namespace", "namespaces"]);
      if (record["namespace"] !== undefined && record["namespaces"] !== undefined) {
        c.fail(
          "invalid-value",
          "extension.runtime declares both namespace and namespaces; use one form",
        );
      } else if (record["namespace"] !== undefined) {
        const namespace = expectString(c, record["namespace"], "extension.runtime.namespace");
        if (namespace !== undefined && !EXTENSION_ID_PATTERN.test(namespace)) {
          c.fail(
            "invalid-value",
            `extension.runtime.namespace "${namespace}" is not a valid command namespace`,
          );
        } else if (namespace !== undefined) {
          namespaces = [namespace];
        }
      } else {
        namespaces = parseTokenList(
          c,
          record["namespaces"],
          "extension.runtime.namespaces",
          EXTENSION_ID_PATTERN,
          "command namespace",
        );
      }
    }
  }

  const agentCapabilities = parseTokenList(
    c,
    root["agent_capabilities"],
    "extension.agent_capabilities",
    CAPABILITY_PATTERN,
    "capability name",
  );

  let githubProfile: string | undefined;
  if (root["github"] !== undefined) {
    const record = expectRecord(c, root["github"], "extension.github");
    if (record !== undefined) {
      requireKeys(c, record, "extension.github", ["profile"]);
      rejectUnknownKeys(c, record, "extension.github", ["profile"]);
      githubProfile = expectString(c, record["profile"], "extension.github.profile");
    }
  }

  if (
    !c.ok ||
    id === undefined ||
    pkg === undefined ||
    version === undefined ||
    pactwright === undefined
  ) {
    return { value: undefined, problems: c.problems };
  }
  return {
    value: {
      id,
      package: pkg,
      version,
      pactwright,
      dependencies,
      nodeTypes,
      edgeTypes,
      namespaces,
      agentCapabilities,
      ...(githubProfile === undefined ? {} : { githubProfile }),
    },
    problems: [],
  };
}

/** Loads and validates the manifest at `<dir>/extension.yml`. */
export function loadExtensionManifest(dir: string): ParseResult<ExtensionManifest> {
  const manifestPath = joinPath(dir, EXTENSION_MANIFEST_FILE);
  if (!existsSync(manifestPath)) {
    return {
      value: undefined,
      problems: [
        {
          code: "extension-not-found",
          message: `no ${EXTENSION_MANIFEST_FILE} found`,
          path: manifestPath,
        },
      ],
    };
  }
  const read = readYamlFile(manifestPath);
  if (read.problems.length > 0) return { value: undefined, problems: read.problems };
  return parseExtensionManifest(read.value, manifestPath);
}
