import { spawnSync } from "node:child_process";
import type { Problem } from "../errors.js";
import type { PackageManager } from "../config/package-manager.js";
import { satisfiesRange } from "../pack/locate.js";

/**
 * Target selection for an upgrade (consolidation design §6, R09).
 *
 * "Upgrade" used to mean different things in different places, and neither
 * of them acquired anything. `pactwright upgrade` asked the package manager
 * for `pactwright@latest` with no compatibility check at all, so the target
 * was whatever the registry happened to publish. `extension upgrade` called
 * no installer whatsoever: it re-resolved the *already installed* package
 * and rewrote the lock, so it could only ever "upgrade" to a version
 * somebody had installed by hand.
 *
 * Selection, installation and activation become three steps with three
 * results, as the review asks. This is the first: it answers "which version
 * should we move to", and answers it without touching the project.
 */

/**
 * Lists the versions a registry publishes for a package.
 *
 * Injected so nothing in the test suite reaches the network, and so
 * Pactwright keeps delegating to the project's package manager rather than
 * speaking to a registry itself (Distribution §15, §25).
 */
export type PackageView = (request: {
  readonly name: string;
  readonly manager: PackageManager;
}) => readonly string[] | readonly Problem[];

export interface TargetComponent {
  readonly kind: "runtime" | "agent-pack" | "extension";
  /** The package name, as the manager knows it. */
  readonly name: string;
}

/**
 * What must stay compatible with whatever is selected.
 *
 * A component declares the runtime range it supports; a candidate whose
 * range the running runtime does not satisfy is not a target, however new it
 * is. Distribution §15: "If the target has no compatible complete
 * environment, the operation must fail clearly rather than silently
 * substitute components."
 */
export interface RetainedEnvironment {
  /** The runtime a candidate must support, for a pack or extension. */
  readonly runtimeVersion: string;
  /**
   * The `pactwright` range a candidate version declares. Absent means the
   * caller cannot know without installing, so the check is deferred to
   * resolution rather than guessed at.
   */
  readonly declaredRuntimeRange?: (version: string) => string | undefined;
}

export interface SelectedTarget {
  readonly version: string;
  /** Versions that were available but not compatible, newest first. */
  readonly rejected: readonly string[];
}

/** The default view: asks the project's package manager, which owns registries. */
export const packageManagerView: PackageView = ({ name, manager }) => {
  const result = spawnSync(manager, ["view", name, "versions", "--json"], {
    encoding: "utf8",
    timeout: 120_000,
  });
  if (result.error !== undefined) {
    return [
      {
        code: "package-view-failed",
        message: `could not ask ${manager} for the versions of "${name}": ${result.error.message}`,
      },
    ];
  }
  if (result.status !== 0) {
    return [
      {
        code: "package-view-failed",
        message: `${manager} view ${name} exited ${result.status ?? "with a signal"}: ${(result.stderr ?? "").trim() || "no output"}`,
      },
    ];
  }
  try {
    const parsed: unknown = JSON.parse(result.stdout);
    // A package with one published version reports a bare string.
    if (typeof parsed === "string") return [parsed];
    if (Array.isArray(parsed) && parsed.every((v) => typeof v === "string")) {
      return parsed as readonly string[];
    }
  } catch {
    // Falls through to the problem below: unparseable output is not a list.
  }
  return [
    {
      code: "package-view-failed",
      message: `${manager} did not report a version list for "${name}"`,
    },
  ];
};

/**
 * The newest available version that satisfies `constraint` and keeps the
 * retained environment valid, or the problems explaining why there is none.
 *
 * It selects and nothing else: no install, no lock, no configuration. A
 * caller that wants the version installed asks the transaction next, and one
 * that wants it activated re-resolves afterwards.
 */
export function selectTarget(
  component: TargetComponent,
  /**
   * The configured range, or `undefined` for "whatever is newest and
   * compatible". There is no range spelling that means "any": `^0.0.0` is
   * exact under npm caret semantics, so an unconstrained component has to be
   * expressed by its absence rather than by a permissive-looking string.
   */
  constraint: string | undefined,
  retained: RetainedEnvironment,
  seams: { readonly view?: PackageView; readonly manager: PackageManager },
): SelectedTarget | readonly Problem[] {
  const view = seams.view ?? packageManagerView;
  const available = view({ name: component.name, manager: seams.manager });
  if (available.length > 0 && typeof available[0] !== "string") {
    return available as readonly Problem[];
  }
  const versions = (available as readonly string[]).filter((version) => parse(version) !== null);
  if (versions.length === 0) {
    return [
      {
        code: "no-published-versions",
        message: `no published versions of ${component.kind} "${component.name}" were found`,
      },
    ];
  }

  const newestFirst = [...versions].sort(compareDescending);
  const inRange =
    constraint === undefined
      ? newestFirst
      : newestFirst.filter((version) => satisfiesRange(version, constraint));
  if (inRange.length === 0) {
    return [
      {
        code: "no-version-in-range",
        message: `no published version of ${component.kind} "${component.name}" satisfies "${constraint}"; available: ${newestFirst.slice(0, 5).join(", ")}`,
      },
    ];
  }

  // Compatibility is checked *before* installing, which is the whole point:
  // the runtime upgrade used to install `@latest` and discover afterwards.
  const rejected: string[] = [];
  for (const version of inRange) {
    const declared = retained.declaredRuntimeRange?.(version);
    if (declared === undefined || satisfiesRange(retained.runtimeVersion, declared)) {
      return { version, rejected };
    }
    rejected.push(version);
  }

  return [
    {
      code: "incompatible-target",
      message: `every published version of ${component.kind} "${component.name}" satisfying "${constraint}" requires a runtime this project does not run (${retained.runtimeVersion}); rejected: ${rejected.join(", ")}`,
    },
  ];
}

const parse = (version: string): readonly number[] | null => {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  return match === null ? null : [Number(match[1]), Number(match[2]), Number(match[3])];
};

/** Newest first. Pre-release versions are filtered out before this runs. */
function compareDescending(a: string, b: string): number {
  const left = parse(a)!;
  const right = parse(b)!;
  for (let i = 0; i < 3; i += 1) {
    if (left[i] !== right[i]) return right[i]! - left[i]!;
  }
  return 0;
}
