import { createHash } from "node:crypto";

/**
 * The longest slug a node id may carry. The id adds the type, a dash and up
 * to 64 hash digits, and the filename adds `.md`; 180 keeps the whole name
 * comfortably under the common 255-byte filesystem limit.
 */
const MAX_SLUG_LENGTH = 180;

/**
 * Turns a title into the `<slug>` part of a node id: lowercase, runs of
 * non-alphanumerics become single dashes, truncated to `MAX_SLUG_LENGTH`.
 * `undefined` when nothing usable remains. Truncation never harms
 * uniqueness: `mintNodeId` hashes the full creation input, not the slug.
 */
export function slugify(title: string): string | undefined {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/, "");
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
