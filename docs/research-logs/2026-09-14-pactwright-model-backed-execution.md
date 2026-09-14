Here is the reasoning I would carry into implementing model-backed execution.

## 1. What this log is about

Pactwright can describe a Delivery, authorise it, guard its closure and validate the result. It cannot _do_ it.

`pactwright lifecycle run` resolves the shape, enforces Gates, routes corrections and refuses premature Evidence — and then calls an executor that does nothing:

```text
noExecutor
→ status: failed
→ "no executor configured for automatic step \"delivery\""
```

The orchestration is real. The work is absent.

This log records why the missing piece is a delegation to one tool rather than an execution engine of our own, and what measuring that tool changed about the design.

---

## 2. The adapter path already works, and that matters

A human in Claude Code types `/deliver-brief`, and the whole thing functions: the rendered command names the pack's agent, the agent does the work, and the runtime records what happened.

The executor is Claude Code. The invoker is a person.

This is not a degraded mode. For an interactive Delivery it is the _right_ mode, and it stays the default. What it cannot do is run unattended.

So the question is narrow: what invokes the model when no person is at the keyboard.

---

## 3. Two seams already want the same answer

`src/lifecycle/run.ts` needs an `ActionExecutor`. `src/eval/case.ts` needs a `CandidateRunner`, and its comment has said so since it was written:

```text
"The default runner replays each case's scripted reference;
 a model-backed runner plugs in here in a later checkpoint."
```

Both need identically shaped work:

```text
capability
→ pack agent (prompt + skills)
→ instruction
→ invoke
→ structured result
```

Two seams, one mechanism. Building it twice would be the mistake.

The consequence is worth stating plainly: `eval` currently measures scripted stand-ins. Wiring the same runner there turns it into a measurement of the actual Agent Pack, which is what evaluation was always supposed to be.

---

## 4. What we are not building

The redesign log already settled this. Pactwright does not own:

```text
provider registry
task catalog
model router
```

The delegation chain is:

```text
Pactwright responsibility
→ agent
→ skill
→ skill-owned tools/provider integration
```

Shelling out to the Claude Code CLI does not violate that. It _is_ that chain, with Claude Code occupying the position the chain reserves for the thing that knows how to call models.

Pactwright gains no knowledge of models, keys, routing or fallbacks. It gains one subprocess.

The test I would apply to any future addition here: if the change requires Pactwright to know _which model_ is appropriate for a task, it has crossed the boundary and belongs in a skill.

---

## 5. The argument against doing this at all

Worth stating, because it is not weak.

Every automatic action spawns an agent with write access to the repository. The runtime's careful guarantees — gates, declared routing, bounded iteration, closure preconditions — constrain _the lifecycle_. They do not constrain what the agent does to the working tree inside one action.

An unattended `lifecycle run` is therefore a larger trust decision than anything Pactwright has asked for so far.

Two things answer it, neither perfectly:

Execution is opt-in, so nothing becomes autonomous by accident (§11). And Delivery changes stay in the working tree, uncommitted, exactly as the adapter path leaves them — the human still sees the diff before it becomes history.

What does _not_ answer it: the permission posture. `acceptEdits` scoped to the project root still permits an agent to rewrite any file it can reach. The blast radius is the repository. That is the honest ceiling on this design, and the reason the first real run should be watched.

---

## 6. Measuring before designing

The flags were read from the installed CLI rather than documentation, and then exercised. Three design assumptions did not survive contact.

Everything in §7–§9 is observation, not inference.

---

## 7. What the invocation actually returns

`claude -p --output-format json` returns a single object. The fields that matter:

```text
result             the final text
is_error           boolean
subtype            "success"
num_turns
session_id
permission_denials []
total_cost_usd
```

Two of these changed the design.

`permission_denials` is an array. A refused permission is therefore **structured data**, not prose to be pattern-matched. The executor can distinguish "the agent could not do this" from "the agent did this badly" without guessing — a distinction the lifecycle cares about, because the first is an environment failure and the second is a Review's business.

`total_cost_usd` exists, which makes cost reportable rather than invisible (§13).

One measured call — a prompt asking for a single word, answering with four tokens — cost **$0.0402**. The usage breakdown explains it:

```text
output_tokens                    4
cache_creation_input_tokens  7,983
cache_read_input_tokens     36,537
```

The answer is free. The context is not.

That is the most consequential number in this log, and §13 draws the conclusion.

---

## 8. Session isolation was not optional

The first invocation reported a `session_id` identical to the _parent_ Claude Code session's.

Not a fresh id. The caller's id.

Passing `--session-id <uuid>` produced the supplied id instead. So the executor must mint a UUID per action and pass it, or runs share identity with whatever spawned them.

This was found only because the output was read rather than assumed. It would have surfaced later as an incoherent audit trail, and much harder to diagnose.

---

## 9. The pack's prompt can be injected directly

`--agents` accepts a JSON object of agent definitions. A test agent carrying a planted secret word returned that word, confirming the prompt is honoured.

This matters more than it looks. It means the executor can pass the Agent Pack's prompt _from the pack_, rather than depending on `.claude/agents/` having been rendered by `sync`.

The pack stays the single source of truth for agent behaviour. The generated adapter surface stays what it is — an interface for humans — instead of quietly becoming a runtime dependency.

---

## 10. Who performs the mutation

The sharpest design question, and the one with a trap in it.

The tempting answer is: let the agent run `pactwright lifecycle record …` itself, exactly as the adapter tells it to. One set of instructions, one path.

That breaks. For shape steps the agent's `record` call advances execution state, and then `runLineage` calls `advance()` on top of it. The run double-advances and the shape desynchronises from its own progress.

So: the **agent returns structured output, the executor performs the mutation**.

```text
agent    → JSON
executor → typed mutation (createBrief, createEvidence) or ActionOutcome
runtime  → guards, atomic write, revalidation
```

This is not a new pattern. `fullExecutor` in `tests/lifecycle-run.test.ts` has always worked this way. It keeps every canonical write behind the Step 7 closure guards and `assertPackComplete`, and it keeps the invariant the whole authority model rests on: _the runtime, not the agent, decides what is written_.

---

## 11. Opt-in, not default

Considered: enable the executor whenever the `claude` binary is on PATH.

Rejected. A binary being installed is not consent to run an autonomous agent against a repository.

Execution is declared:

```yaml
execution:
  executor: claude-code
```

Absent, `lifecycle run` fails exactly as it does today. The refusal is not a deficiency to be removed; it is the safe state, and it should stay reachable.

---

## 12. Responsibility actions have no capability

A small gap, found while tracing what an executor receives.

`STEP_CAPABILITY` gives shape steps a capability. `actionForResponsibility` in `src/lifecycle/engine.ts` gives responsibilities none — the interactive path never needed it, because the rendered command already names its agent.

The mapping is not missing, only unused: `COMMAND_TEMPLATES` in `src/adapter/commands.ts` carries a `capability` for six of the seven commands.

Read it from there. A second table mapping the same thing would drift, and drift here means the headless path silently using a different agent than the interactive one.

The same reasoning applies to the instruction text: build it from `templateFor(name).body()` so the two paths cannot diverge in what they ask for.

---

## 13. Cost is a design input, not an operational detail

$0.0402 for a four-token answer, dominated by 7,983 cache-creation and 36,537 cache-read tokens.

The implication: **per-action spawns pay context setup every time**. A Delivery is at least three actions. A corrective loop multiplies them by the iteration bound.

So the cheap-looking design — one fresh `claude -p` per action, clean isolation, simple failure semantics — is also the expensive one.

I would still start there. Isolation is worth paying for while the mechanism is new, the failure modes are simpler, and `--session-id` makes reuse possible later without changing the contract.

But this should be recorded as a known cost, not discovered as a surprise. `run` should report `total_cost_usd`, and the bounded-iteration policy stops being only a correctness guard — it is also the thing standing between a corrective loop and a bill.

If reuse becomes necessary, the honest version is resuming one session across the steps of a single run, not pooling across Deliveries. Progress state is per-Brief; execution identity should not be broader than the thing it executes.

---

## 14. What stays out

`capture-intent` and `approve-contract` are human gates under the default policy. An agent authorising its own Contract is precisely what the authority model exists to prevent, and automating them would hollow it out while leaving it apparently intact.

The Anthropic API path stays out. It would put keys, routing and fallback inside Pactwright — §4's boundary, crossed.

`SemanticJudge` stays out. Who grades quality is a separate question from who does the work, and answering both at once would settle the harder one by accident.

---

## 15. Testability is the reason this is safe to build

The seam is injectable, following `PackageInstaller` and `Reentry` in `src/upgrade.ts`.

Prompt construction and response parsing — where the real complexity is — become deterministic and offline. Malformed JSON, `is_error`, permission denials, timeouts and a missing binary all get covered without a network call or a cent spent.

One end-to-end test stays behind an env var, because it needs auth and costs money.

This is what makes the module ordinary. Everything unpredictable is on the far side of a function boundary that tests control.

---

## The rule I would carry forward

> **Pactwright delegates execution to one tool that already owns providers; it never learns to choose models. The agent proposes, the runtime disposes — every canonical write stays behind the guards, and autonomy is something a project opts into, never something an installed binary confers.**

---

## Notes for the implementer

Verified against `claude 2.1.270`, `/opt/node22/bin/claude`, on 2026-09-14:

- Spawning `claude -p` from inside a Claude Code session works (exit 0).
- There is **no `--max-turns`** in this version; bound the run from the spawn side.
- `--permission-prompts none` is what stops a print-mode run hanging on a permission it lacks.
- Flags used: `-p --output-format json --agents <json> --session-id <uuid> --permission-mode acceptEdits --add-dir <root> --permission-prompts none`, optionally `--model`.

The flag surface has moved between versions. Fail loudly on an unrecognised flag rather than degrading silently.
