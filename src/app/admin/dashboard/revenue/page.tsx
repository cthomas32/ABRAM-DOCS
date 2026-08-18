import RevenuePanel from "./RevenuePanel";

/**
 * Revenue keeps its own address as well as its tab on the money screen.
 *
 * Both render the one component. The collections sync is being built
 * against this path, and a tab that reimplemented the screen would be a
 * second copy of it a week later.
 */

export const dynamic = "force-dynamic";

export default function RevenuePage() {
  return <RevenuePanel />;
}
