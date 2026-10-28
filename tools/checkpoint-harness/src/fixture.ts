// T3.6 L4: fixture-injected producer attempts (evidence-backed learning log
// §3 T3.6-L4). A hosted fixture run needs failures it can count on: its
// template lists producer attempts under `job.inject`, and each listed
// attempt is served by this injector instead of a provider session. The
// injector writes pinned fixture files through the session's own write_file
// tool, so the write policy, seal, verifiers and reviews treat them as any
// producer's work, and submits them. Every other session goes to the real
// provider. Only a template with `job.faults: true` may list an injection.
//
// An injected session is labelled, never passed off as a model's: its init
// names the injection and the digest of what it writes, the observation
// keeps that label, and it reports no turns, tokens or cost. It repeats the
// configured model only because the dispatch check requires the session to
// report it.

import { createHash } from "node:crypto";

import stringify from "safe-stable-stringify";

import type { Packet, Provider, ProviderEvent, ProviderRequest } from "./claude.js";

/** One injected producer attempt: candidate paths and the repository sources written there, and the outputs it claims. */
export type Injection = {
  step: string;
  attempt: number;
  files: Record<string, string>;
  outputs: Record<string, string[]>;
};

/** The first line of every injected source, so a fixture fault is never mistaken for work. */
export const INJECTED_HEADER = "// INJECTED FAULT (T3.6 L4 fixture)";

const sha256 = (text: string): string =>
  `sha256:${createHash("sha256").update(text).digest("hex")}`;

/**
 * The sources of `injections`, read with `read`: refused for a repeated
 * attempt, an unreadable source, or one without the injected-fault header.
 */
export function injectedSources(
  injections: readonly Injection[],
  read: (source: string) => string,
): { ok: true; sources: ReadonlyMap<string, string> } | { ok: false; diagnostics: string[] } {
  const diagnostics: string[] = [];
  const sources = new Map<string, string>();
  const seen = new Set<string>();
  for (const i of injections) {
    const at = `${i.step} attempt ${i.attempt}`;
    if (seen.has(at)) diagnostics.push(`job.inject lists ${at} more than once`);
    seen.add(at);
    for (const source of Object.values(i.files)) {
      if (sources.has(source)) continue;
      let text: string;
      try {
        text = read(source);
      } catch (e) {
        diagnostics.push(
          `job.inject source ${source} cannot be read: ${e instanceof Error ? (e.message.split("\n")[0] ?? "") : String(e)}`,
        );
        continue;
      }
      if (!text.startsWith(INJECTED_HEADER)) {
        diagnostics.push(`job.inject source ${source} does not start with "${INJECTED_HEADER}"`);
        continue;
      }
      sources.set(source, text);
    }
  }
  return diagnostics.length > 0 ? { ok: false, diagnostics } : { ok: true, sources };
}

/** The work packet a session was dispatched with, or null for a prompt that carries none. */
function packetOf(request: ProviderRequest): Packet | null {
  const marker = "Work packet:\n";
  if (!request.prompt.startsWith(marker)) return null;
  try {
    return JSON.parse(request.prompt.slice(marker.length)) as Packet;
  } catch {
    return null;
  }
}

/** The label an injected session's observation carries: the attempt and the digest of what it writes. */
export const injectionLabel = (i: Injection, sources: ReadonlyMap<string, string>): string =>
  `injected ${i.step} attempt ${i.attempt} ${sha256(
    stringify(
      Object.fromEntries(
        Object.entries(i.files).map(([path, source]) => [path, sha256(sources.get(source) ?? "")]),
      ),
    ) ?? "",
  )}`;

/**
 * A provider that serves each listed producer attempt from its fixture
 * sources and hands every other session to `next`.
 */
export function injecting(
  injections: readonly Injection[],
  sources: ReadonlyMap<string, string>,
  next: Provider,
): Provider {
  return (request) => {
    const packet = packetOf(request);
    const injection =
      packet?.role === "producer"
        ? injections.find((i) => i.step === packet.step.id && i.attempt === packet.attempt)
        : undefined;
    if (!injection) return next(request);
    return inject(injection, sources, request);
  };
}

async function* inject(
  i: Injection,
  sources: ReadonlyMap<string, string>,
  request: ProviderRequest,
): AsyncGenerator<ProviderEvent> {
  const token = request.credentialKind === "oauth-token";
  yield {
    type: "account",
    apiKeySource: token ? "none" : "ANTHROPIC_API_KEY",
    tokenSource: token ? "CLAUDE_CODE_OAUTH_TOKEN" : null,
    apiProvider: "firstParty",
  };
  yield {
    type: "init",
    session: `fixture-injection/${i.step}/${i.attempt}`,
    model: request.model,
    tools: ["StructuredOutput", ...request.tools.map((t) => `mcp__workspace__${t.name}`)],
    mcpServers: [{ name: "workspace", status: "connected" }],
    plugins: [],
    permissionMode: "dontAsk",
    apiKeySource: token ? "none" : "ANTHROPIC_API_KEY",
    fixture: injectionLabel(i, sources),
  };
  const write = request.tools.find((t) => t.name === "write_file");
  const errors: string[] = [];
  for (const [path, source] of Object.entries(i.files)) {
    const reply = write
      ? await write.run({ path, content: sources.get(source) ?? "" })
      : { ok: false, text: "the session offers no write_file tool" };
    if (!reply.ok) errors.push(`${path}: ${reply.text}`);
  }
  const usage = { costUsd: 0, inputTokens: 0, outputTokens: 0, models: [], turns: 0, denials: [] };
  if (errors.length > 0) {
    yield {
      type: "result",
      subtype: "error_during_execution",
      isError: true,
      output: null,
      ...usage,
      errors: [`the injected attempt could not write its files: ${errors.join("; ")}`],
    };
    return;
  }
  yield {
    type: "result",
    subtype: "success",
    isError: false,
    output: JSON.stringify({
      status: "submitted",
      outputs: Object.entries(i.outputs).map(([output, paths]) => ({ output, paths })),
      changes: Object.keys(i.files).map((path) => ({
        path,
        summary: "injected fault fixture (T3.6 L4)",
      })),
      verifier_proposals: [],
      blockers: [],
    }),
    ...usage,
    errors: [],
  };
}
