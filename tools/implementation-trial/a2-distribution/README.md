# A2-D distribution probes

Ten probes behind [`analysis/distribution.md`](../../../docs/research-logs/implementation-trial/analysis/distribution.md).
They drive the pinned reference's own production code; none of them repairs,
patches or re-implements it.

## Running them

From a checkout of the reference with dependencies installed and `pnpm build`
run once (probe 05 copies `dist/` into a fixture):

```bash
npx tsx tools/implementation-trial/a2-distribution/p01-selection.ts
```

`logs/` holds the captured output of one full run at
`19c66d5f2368932ff05306db1fae8da8ec5810dd` on Linux / Node v22.22.2 /
pnpm 11.7.0. Every probe is deterministic apart from pids, temporary paths
and timestamps.

| Probe | Asks |
|---|---|
| `p01-selection.ts` | Does `agent-pack upgrade` acquire? Can it move the lock backwards? Does runtime target selection check compatibility? Can `upgrade` install an older runtime? |
| `p02-migration.ts` | What does a migration failure *after* the write leave on disk? |
| `p03-writer-lock.ts` | Three real processes: does a holder whose lock was reclaimed release a lock it no longer owns? |
| `p04-crash.ts` | The same transaction, ended two ways: returned failure versus `SIGKILL` after the effect. |
| `p05-reentry.ts` | Real child re-entry through `node_modules/.bin/pactwright`, with a genuinely different runtime build installed. |
| `p06-package-manager.ts` | A recording shim first on `PATH`: what argv does the runtime construct, and what does it never pass? |
| `p07-locks-and-doctor.ts` | Is the package-manager lock's *content* read by anything? What of Distribution §16 does `doctor` cover? |
| `p08-writers.ts` | `init`, `sync` ownership and pruning, path containment, and what the restore sweep deletes. |
| `p09-remove-readd.ts` | A remove/re-add round trip, and how `extension add` derives an id. |
| `p10-doctor-pending.ts` | Can `doctor` reach its pending-migration check in the state that check exists for? |

## No credentials, no registry

No probe contacts a registry or uses a credential. Acquisition is driven
either through the production seams the signatures already expose
(`install`, `view`, `reenter`) or through a recording shim placed first on
`PATH`, which writes the argv it was handed and exits. Where a probe needed
a package manager to *appear* to install something, the injected seam writes
the files the manager would have written, so the code under test reads a real
filesystem rather than a stub.

## Shared fixtures

`fixture.ts` builds a real project: a package manifest, a package-manager
lock, an installed pack and extension packages under `node_modules/`, and the
Pactwright-owned scaffold. Everything the commands read is on disk.
