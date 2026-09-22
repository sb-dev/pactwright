/**
 * V11 — the Review outcome parser reads prose by first-match precedence, so a
 * review that says the opposite of its verdict is read wrongly.
 *
 * `readOutcome` (`src/execute/select.ts:203-214`) takes the agent's output,
 * flattens it to a string — the whole output when it is a string, `.outcome`
 * when it is an object — and returns the first of `blocked`, `revise`, `pass`
 * whose word appears anywhere in it.
 *
 * In production the string case is the normal one. `parsePrintMode` returns
 * `parsed.result`, and Claude Code print mode's `result` is the assistant's
 * final *text*. So the runtime's Review transition is chosen by scanning
 * free prose for three English words, with no negation handling and no
 * requirement that the word be the verdict.
 *
 * Seed `s16-verdict-precedence-reversed` reverses that precedence and the whole
 * suite still passes: nothing proves the ordering it depends on.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { lifecycleExecutor, runLifecycle, scriptedExecutor } from "../../../../src/index.js";
import { makeTempProject } from "../../../../tests/helpers.js";
import { rmSync } from "node:fs";

const scratch: string[] = [];
process.on("exit", () => {
  for (const dir of scratch) rmSync(dir, { recursive: true, force: true });
});

/** Runs one lineage whose Review returns `output`, and reports where it stopped. */
async function reviewWith(output: unknown): Promise<{ stop: string; message?: string }> {
  const root = makeTempProject({ lineage: "delivering" });
  scratch.push(root);
  const executor = scriptedExecutor((request) =>
    request.capability === "delivery-review" ? { output } : { output: "delivered" },
  );
  const [result] = await runLifecycle({
    root,
    intentId: "intent-quick-start-a1b2",
    execute: lifecycleExecutor(executor),
  });
  return {
    stop: result?.stop ?? "none",
    ...(result?.message === undefined ? {} : { message: result.message }),
  };
}

test("V11: a passing review that mentions being blocked is read as blocked", async () => {
  // A plausible sentence from a real review: the work passed, and the reviewer
  // notes an area they could not reach.
  const prose = "The delivery is correct and I would pass it. I was blocked from reading CI logs.";
  const result = await reviewWith(prose);
  // "blocked" wins on precedence, so the runtime blocks a passing review.
  assert.equal(result.stop, "blocked");
});

test("V11b: a negated word still decides the transition", async () => {
  // "Nothing is blocked" contains "blocked".
  const result = await reviewWith("Nothing is blocked and nothing needs revision. Ship it.");
  assert.equal(result.stop, "blocked", "the negation is not read, only the word");
});

test("V11c: a review that never uses the three words is a stage failure", async () => {
  // Correct behaviour, and worth keeping: the runtime refuses to guess.
  const result = await reviewWith("Looks good to me.");
  assert.equal(result.stop, "stage-failed");
  assert.match(result.message ?? "", /reported no outcome/);
});

test("V11d: a structured verdict is read correctly — the defect is prose, not the seam", async () => {
  // When the agent returns an object with an explicit `outcome`, only that field
  // is scanned, and surrounding prose cannot move it. That is the shape the
  // command templates ask for, and it is the one to make mandatory.
  const result = await reviewWith({
    outcome: "pass",
    summary: "I was blocked from reading CI logs and would otherwise revise.",
  });
  assert.notEqual(result.stop, "blocked");
  assert.notEqual(result.stop, "stage-failed");
});
