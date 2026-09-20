import type { Actor } from "../config/lifecycle-policy.js";
import { parseDecidedBy, type DecidedByKind } from "./schema.js";

/**
 * Which acting-actor kinds each configured authority admits (Core §§8, 17).
 *
 * One table, three consumers: `recordDecision` refuses an unauthorised
 * Decision at mutation time, validation rule 13 catches a hand-edited or
 * imported record that never passed that guard, and the lifecycle reducer
 * checks who may resolve a Gate. They used to be two tables — `AUTHORISED_KINDS`
 * in the mutation path and a second copy inside rule 13 — which is exactly
 * the kind of duplication that lets two paths disagree about authority.
 */
export const AUTHORISED_KINDS: Readonly<Record<Actor, readonly DecidedByKind[]>> = {
  human: ["human"],
  agent: ["agent", "automation"],
};

/** The actor kinds `configured` admits, for a message naming what is allowed. */
export function authorisedKinds(configured: Actor): readonly DecidedByKind[] {
  return AUTHORISED_KINDS[configured];
}

/**
 * Whether `actor` — written `<kind>:<name>`, e.g. `human:samir` — may act
 * where `configured` authority is required. A malformed actor is never
 * authorised: the caller reports the malformation separately.
 */
export function actorPermitted(configured: Actor, actor: string): boolean {
  const parsed = parseDecidedBy(actor);
  if (parsed === undefined) return false;
  return AUTHORISED_KINDS[configured].includes(parsed.kind);
}
