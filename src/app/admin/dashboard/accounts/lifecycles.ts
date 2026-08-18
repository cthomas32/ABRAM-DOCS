/**
 * Where an account is in its life, as a plain module.
 *
 * This list used to be exported from `actions.ts`, which carries
 * `"use server"` at the top. A `"use server"` module may only export
 * async functions: everything else in it is rewritten into a server
 * action reference at build time. So the array survived type checking,
 * survived the build, and arrived in the browser as a function — and the
 * accounts screen, which renders one `<option>` per lifecycle, died on
 * `ACCOUNT_LIFECYCLES.map is not a function` before it drew anything.
 *
 * The lesson generalises: a constant shared between a server action file
 * and a client component belongs in a module with no directive at all.
 * Both sides may import from here.
 */

export type AccountLifecycle =
  | "prospect"
  | "engaged"
  | "customer"
  | "churned"
  | "disqualified";

export const ACCOUNT_LIFECYCLES: { id: AccountLifecycle; label: string }[] = [
  { id: "prospect", label: "Prospect" },
  { id: "engaged", label: "Engaged" },
  { id: "customer", label: "Customer" },
  { id: "churned", label: "Churned" },
  { id: "disqualified", label: "Disqualified" },
];

export const ACCOUNT_LIFECYCLE_IDS = ACCOUNT_LIFECYCLES.map((entry) => entry.id);

export function accountLifecycleLabel(id: string): string {
  return ACCOUNT_LIFECYCLES.find((entry) => entry.id === id)?.label ?? id;
}
