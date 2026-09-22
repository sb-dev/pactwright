# A2-V — verification audit probes

Disposable probes for the A2 verification audit. They belong to the trial, not
to the product: nothing here is shipped, imported by `src/`, or run by
`pnpm verify`.

Every probe is written against the **pinned reference**
`19c66d5f2368932ff05306db1fae8da8ec5810dd` and against its **public surface**
only — `pactwright`'s single `"."` export and its `dist/cli.js` binary — so a
finding cannot depend on reaching into an internal module the product does not
expose.

Run them from the repository root, after `pnpm install --frozen-lockfile` and
`pnpm build`:

```bash
node --test --import tsx tools/implementation-trial/a2/verification/*.probe.ts
node --import tsx tools/implementation-trial/a2/verification/repeated-work.ts
node --import tsx tools/implementation-trial/a2/verification/complexity.ts --root .
bash tools/implementation-trial/a2/verification/fault-seeds.sh
```

| Probe | What it establishes |
|---|---|
| `compare-unevaluated.probe.ts` | `compareEvalReports` never reads `evaluated`, so two sides that evaluated nothing are reported as agreement (V01, V02) |
| `executor-status.probe.ts` | the CLI's candidate runner discards `CapabilityResult.status`, and the lifecycle seam discards `denials` (V03, V04) |
| `exit-code.probe.ts` | the Claude Code executor never reads the child's exit status (V05) |
| `double-strength.probe.ts` | the acceptance test's candidate throws where production's returns, and `promptSaysNothing` is unreachable from every product path (V06, V07) |
| `repeated-work.ts` | how many times one public command re-reads and re-parses the same graph files (V09) |
| `complexity.ts` | source-size and complexity accounting the A1 probe does not measure, and the three ways its groups can be gamed (V10) |
| `fault-seeds.sh` | disposable single-line defects seeded into a **copy** of the tree, to see which named proofs detect the defect they exist for (V08) |

`fault-seeds.sh` copies the tree to a scratch directory and mutates the copy.
It never writes to `src/`, `tests/` or any other production path in this
checkout; the audit refuses production changes.
