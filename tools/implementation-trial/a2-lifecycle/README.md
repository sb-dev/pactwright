# A2-L — lifecycle and agent-execution probes

The probes behind [`analysis/lifecycle.md`](../../../docs/research-logs/implementation-trial/analysis/lifecycle.md).
Each finding in that report names the probe that produced it.

## Running them

```bash
pnpm install --frozen-lockfile
pnpm build
bash tools/implementation-trial/a2-lifecycle/run-all.sh
```

`run-all.sh` writes one evidence log and prints its path. The log from the
run the report cites is committed at [`evidence/run-all.log`](evidence/run-all.log). Set `WORK` to keep
the fixtures it builds; set `LOG` to choose where the log goes.

## What is real and what is replaced

Everything is real except one thing: the external `claude` process.

- Projects are built by `pactwright init`, `pactwright agent-pack use` and
  `pactwright lifecycle record` — the public CLI, never by writing graph
  files or execution documents directly (`lib/fixture.sh`).
- `lifecycle run` is the shipped command, resolving the shipped executor from
  `.pactwright/config.yml`, spawning a real child process through
  `execFileSync`. Prompt construction, `--agents` assembly, `parsePrintMode`
  and the review-outcome derivation all execute unmodified.
- `lib/bin/claude` stands where the `claude` binary would. It prints one
  print-mode JSON response. It **creates no Evidence, writes no execution
  state and repairs nothing**: in `PROBE_MODE=obey` it calls
  `pactwright lifecycle record`, which is what the prompt it was handed tells
  an agent to do, and nothing more.
- `probe-05-executor.ts` imports the executor and the lifecycle seam directly
  and substitutes only `Spawn` and `readPrompt`.

No probe supplies a capability the product lacks. Where a probe shows the
product failing, the failure is the product's.

## Positive controls

Roughly half the probe sections are labelled `POSITIVE CONTROL`. They assert
that a mechanism works, so that the report can say which parts of the
lifecycle a reimplementation should keep. A probe run in which a positive
control changes has found a regression, not a fix.

## The probes

| Probe | Covers |
|---|---|
| `probe-01-closure.sh` | Evidence closure over unreviewed content; the drift guard's working case; the §45 Evidence correction |
| `probe-02-run-loop.sh` | `lifecycle run` end to end: the closing Evidence step, a prompt-compliant agent, the bounded corrective loop, executor failure and denial, a governed retry at a Delivery and at a Review step, the undeclared and the `scripted` executor |
| `probe-03-gates-state.sh` | Gates and Gate authority, Decision authority, run state that does not parse, on each of `run`, `status`, `next`, `validate` and `lifecycle record` |
| `probe-04-responsibilities.sh` | the four Contract-crafting responsibilities inside the automatic loop; rendered command vs. headless instruction |
| `probe-05-executor.ts` | `parsePrintMode`, `claudeCodeArgs`, spawn outcomes, and structured vs. prose Review outcomes |
| `probe-06-permitted.sh` | whether every operation `lifecycle status` advertises actually executes |

## Environment

Recorded in the log's header. The suite was run on the pinned reference's
`src` tree `ea6a948d0b1a84ceb3f8690396a8c1f554e91c43`, Node v22.22.2, Linux
x86_64. `pnpm test` at that tree: 684 tests, 683 pass, 1 skipped, 0 fail.
