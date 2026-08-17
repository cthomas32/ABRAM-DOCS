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
 * A growth partner never reaches this layout. They hold `workspace.growth`
 * and not `console.admin`, which sends them to /growth instead. That
 * split is the whole point: the partnership terms grant the CRM and
 * withhold the admin console, and those two facts have to be expressible
 * separately.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getConsoleUser();

  if (!user) redirect("/admin");

  if (!can(user, "console.admin")) {
    // Somebody with a live login but no business here. Send them to their
    // own workspace rather than to an error.
    redirect(can(user, "workspace.growth") ? "/growth" : "/admin/no-access");
  }

  return (
    <AdminShell user={user} permissions={Array.from(permissionsFor(user))}>
      {children}
    </AdminShell>
  );
}
