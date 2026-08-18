import { redirect } from "next/navigation";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import CompaniesPanel from "./CompaniesPanel";

/**
 * Companies.
 *
 * One view rather than several, so there is no tab strip: the second and
 * third ways of looking at a company are its people and its deals, and
 * both of those live in the drawer where the company already is. A strip
 * with one tab in it is furniture.
 */

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");
  if (!can(user, "crm.accounts.manage")) redirect("/admin/dashboard");

  return <CompaniesPanel />;
}
