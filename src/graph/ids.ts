import { createHash } from "node:crypto";

/**
 * Turns a title into the `<slug>` part of a node id: lowercase, runs of
 * non-alphanumerics become single dashes. `undefined` when nothing usable
 * remains.
 */
export function slugify(title: string): string | undefined {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length === 0 ? undefined : slug;
}

/**
 * Mints a `<type>-<slug>-<short-hash>` node id (Delivery Graph §5). The
 * short-hash is the first 8 hex digits of sha256 over type, slug and seed,
 * so the same creation input always mints the same id; on a collision with
 * an existing id more digits are taken.
 */
export function mintNodeId(
  type: string,
  slug: string,
  seed: string,
  taken: ReadonlySet<string>,
): string {
  const digest = createHash("sha256").update(`${type}\n${slug}\n${seed}`, "utf8").digest("hex");
  for (let length = 8; length <= digest.length; length += 1) {
    const id = `${type}-${slug}-${digest.slice(0, length)}`;
    if (!taken.has(id)) return id;
  }
  // 64 hex digits colliding means the identical node already exists.
  return `${type}-${slug}-${digest}`;
}
