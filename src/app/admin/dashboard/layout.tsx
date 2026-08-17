import { redirect } from "next/navigation";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can, permissionsFor } from "@/lib/auth/permissions";
import AdminShell from "./AdminShell";

/**
 * The admin console.
 *
 * Gated here as well as in the middleware, deliberately. A server action
 * or a page rendered inside this layout does not inherit the middleware's
 * decision — the middleware guards a navigation, and this guards a
 * render. Between them, and row level security underneath, there is no
 * single check whose failure opens the console.
 *
 * Everybody who works here reaches this layout, including a growth
 * partner. What differs is the navigation, which is built from the
 * permissions passed in below, and the data, which row level security
 * decides independently.
 *
 * That is a deliberate reversal. This console was briefly split in two so
 * that a partner never saw admin chrome, on the reading that the
 * partnership terms' "Admin console — Never" meant this console. It means
 * the platform super-admin in abram-network — other people's
 * organisations, plan tiers, entitlements — which is a different system
 * this repository has no access to at all. One console with real roles is
 * both simpler and the correct reading.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getConsoleUser();

  if (!user) redirect("/admin");

  if (!can(user, "console.admin")) {
    redirect("/admin/no-access");
  }

  return (
    <AdminShell user={user} permissions={Array.from(permissionsFor(user))}>
      {children}
    </AdminShell>
  );
}
