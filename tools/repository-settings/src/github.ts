// The one GitHub boundary: `gh api` run as a child process. The CLI's own
// authentication is used; no token is read, printed or stored here. Every
// call returns the HTTP status with the parsed body, so callers can tell a
// missing resource (404) from a refused change.

import { spawn } from "node:child_process";

export type Method = "GET" | "POST" | "PUT" | "PATCH";

export type ApiResult =
  { ok: true; status: number; body: unknown } | { ok: false; status: number; message: string };

export type Gh = {
  api(method: Method, path: string, body?: unknown): Promise<ApiResult>;
};

/** Runs `gh` with `args`, feeding `input` to stdin; resolves with its exit code and output. */
export function runGh(
  args: readonly string[],
  input?: string,
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn("gh", args, { stdio: ["pipe", "pipe", "pipe"] });
    const out: Buffer[] = [];
    const err: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => out.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => err.push(chunk));
    child.on("error", reject);
    child.on("close", (code) =>
      resolve({
        code: code ?? 1,
        stdout: Buffer.concat(out).toString("utf8"),
        stderr: Buffer.concat(err).toString("utf8"),
      }),
    );
    if (input !== undefined) child.stdin.write(input);
    child.stdin.end();
  });
}

/** A client over `gh api`. A non-2xx response is reported, never thrown. */
export function ghClient(run: typeof runGh = runGh): Gh {
  return {
    async api(method, path, body) {
      const args = [
        "api",
        "-X",
        method,
        path,
        "-H",
        "Accept: application/vnd.github+json",
        "-H",
        "X-GitHub-Api-Version: 2022-11-28",
        "--include",
        ...(body === undefined ? [] : ["--input", "-"]),
      ];
      const result = await run(args, body === undefined ? undefined : JSON.stringify(body));
      const status = Number(/^HTTP\/[\d.]+ (\d{3})/m.exec(result.stdout)?.[1] ?? 0);
      const blank = result.stdout.indexOf("\r\n\r\n");
      const text = blank === -1 ? "" : result.stdout.slice(blank + 4).trim();
      if (result.code === 0 && status >= 200 && status < 300) {
        return { ok: true, status, body: text === "" ? null : (JSON.parse(text) as unknown) };
      }
      const message =
        (text !== "" && safeMessage(text)) ||
        result.stderr.trim() ||
        `gh exited with code ${result.code}`;
      return { ok: false, status, message };
    },
  };
}

/** The `message` of a GitHub error body, else the raw text. */
function safeMessage(text: string): string {
  try {
    const parsed = JSON.parse(text) as { message?: unknown; errors?: unknown };
    const errors = Array.isArray(parsed.errors) ? ` ${JSON.stringify(parsed.errors)}` : "";
    return typeof parsed.message === "string" ? `${parsed.message}${errors}` : text;
  } catch {
    return text;
  }
}

/** The `OWNER/NAME` of the repository `gh` resolves for the current directory. */
export async function currentRepository(): Promise<string> {
  const result = await runGh(["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"]);
  if (result.code !== 0) throw new Error(`gh repo view failed: ${result.stderr.trim()}`);
  return result.stdout.trim();
}

/** The login `gh` is authenticated as, or null when it is not. */
export async function currentLogin(): Promise<string | null> {
  const result = await runGh(["api", "user", "-q", ".login"]);
  return result.code === 0 ? result.stdout.trim() : null;
}
