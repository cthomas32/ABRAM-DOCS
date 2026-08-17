import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can, permissionsFor } from "@/lib/auth/permissions";
import GrowthShell from "./GrowthShell";

/**
 * The Growth workspace.
 *
 * A separate building from the admin console, on purpose. The growth
 * partnership terms say "Admin console — Never" in the same table that
 * grants the CRM, tracked links, promotions and the Social Studio, so
 * those surfaces needed somewhere to live that is not the admin console.
 * This is that somewhere.
 *
 * It is not a copy of the console with items removed. Somebody working
 * acquisition needs a pipeline, the accounts behind it, what they have
 * earned and what they have claimed — and that is a different shape from
 * a content management system, not a subset of one.
 *
 * The gate here is the third of three. The middleware turns away a wrong
 * URL, this turns away a wrong session before any query runs, and row
 * level security refuses the data itself. Any one of them alone would be
 * a single point of failure.
 */

export const metadata: Metadata = {
  title: "Growth | ABRAM",
  description: "Pipeline, accounts and earnings.",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function GrowthLayout({ children }: { children: React.ReactNode }) {
  const user = await getConsoleUser();

  if (!user) redirect("/admin");
  if (!can(user, "workspace.growth")) redirect("/admin/no-access");

  // The nav is built from what this person actually holds, so there is
  // never a visible link that leads to a refusal.
  const granted = Array.from(permissionsFor(user));

  return (
    <GrowthShell user={user} permissions={granted}>
      {children}
    </GrowthShell>
  );
}
