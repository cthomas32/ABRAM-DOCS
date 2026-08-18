import RevenuePanel from "./RevenuePanel";

/**
 * Revenue keeps its own address as well as its tab on the money screen.
 * Both render the one component (RevenuePanel holds the sync view).
 */

export const dynamic = "force-dynamic";

export default function RevenuePage() {
  return <RevenuePanel />;
}
