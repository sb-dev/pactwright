/**
 * A2-D probe 01 — acquisition versus activation, compatible target selection
 * and unintended downgrades.
 *
 * Four questions, each answered by running the reference's own code:
 *   1. Does `agent-pack upgrade` acquire anything?
 *   2. Can `agent-pack upgrade` move the lock *backwards*?
 *   3. Does runtime target selection check compatibility before installing?
 *   4. Can `upgrade` (no `--to`) install an older runtime than the running one?
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { upgradeAgentPack, useAgentPack } from "../../../src/pack/select.js";
import { selectTarget } from "../../../src/environment/select-target.js";
import { upgradeRuntime } from "../../../src/upgrade.js";
import { runtimeVersion } from "../../../src/version.js";
import { cleanup, installPack, makeProject, report } from "./fixture.js";

const RUNTIME = runtimeVersion();
report("running runtime", RUNTIME);

/* 1 + 2 ------------------------------------------------------------------ */
{
  const root = makeProject({
    pack: { name: "@probe/pack", version: "0.2.0", pactwright: RUNTIME },
    packageManager: "pnpm@11.7.0",
  });
  const selected = useAgentPack(root, "@probe/pack");
  report("agent-pack use @probe/pack", {
    ok: selected.ok,
    selected: selected.selected,
    problems: selected.problems,
  });

  // The package manager is never invoked by the probe. The *installed* pack is
  // replaced with an older release, exactly as a `pnpm add -D pack@0.1.0`
  // would leave the tree, and then the project is told to "upgrade".
  installPack(root, { name: "@probe/pack", version: "0.1.0", pactwright: RUNTIME });

  const spawned: string[] = [];
  const upgraded = upgradeAgentPack(root);
  report("agent-pack upgrade, with 0.1.0 installed over a 0.2.0 lock", {
    ok: upgraded.ok,
    selected: upgraded.selected,
    previous: upgraded.previous,
    unchanged: upgraded.unchanged,
    problems: upgraded.problems,
    packageManagerInvocations: spawned.length,
  });
  const lock = readFileSync(join(root, ".pactwright", "lock.yml"), "utf8");
  report("lock.yml agent_pack block after the 'upgrade'", lock.split("\n").slice(0, 6).join("\n"));
  cleanup(root);
}

/* 3 ----------------------------------------------------------------------- */
{
  // Exactly the call `upgradeRuntime` makes for the runtime: no
  // `declaredRuntimeRange`, so nothing about the candidate is ever checked.
  const selected = selectTarget(
    { kind: "runtime", name: "pactwright" },
    undefined,
    { runtimeVersion: RUNTIME },
    { manager: "pnpm", view: () => ["0.0.1", "0.0.2", "9.9.9"] },
  );
  report("selectTarget as upgradeRuntime calls it (view publishes 9.9.9)", selected);

  // The same selection with the check the pack path supplies.
  const checked = selectTarget(
    { kind: "runtime", name: "pactwright" },
    undefined,
    {
      runtimeVersion: RUNTIME,
      declaredRuntimeRange: (v) => (v === "9.9.9" ? "^9.0.0" : RUNTIME),
    },
    { manager: "pnpm", view: () => ["0.0.1", "0.0.2", "9.9.9"] },
  );
  report("selectTarget *with* a declaredRuntimeRange, for contrast", checked);
}

/* 4 ----------------------------------------------------------------------- */
{
  const root = makeProject({
    pack: { name: "@probe/pack", version: "0.2.0", pactwright: RUNTIME },
    packageManager: "pnpm@11.7.0",
    runtime: RUNTIME,
  });
  useAgentPack(root, "@probe/pack");

  // The registry publishes nothing newer than what is running — the state a
  // project is in after installing a prerelease, a tarball or a workspace
  // link. No credential and no network: `view` and `install` are the
  // production seams.
  const installs: string[] = [];
  const older = "0.0.1";
  const result = upgradeRuntime(root, {
    view: () => [older],
    install: ({ spec }) => {
      installs.push(spec ?? "<frozen reinstall>");
      // Stand in for what the package manager would leave behind.
      writeFileSync(
        join(root, "node_modules", "pactwright", "package.json"),
        `${JSON.stringify({ name: "pactwright", version: older }, null, 2)}\n`,
        "utf8",
      );
      return [];
    },
    reenter: () => [],
  });
  report("upgrade with only an OLDER version published", {
    ok: result.ok,
    from: result.from,
    to: result.to,
    unchanged: result.unchanged,
    problems: result.problems,
    installerCalls: installs,
  });
  cleanup(root);
}
