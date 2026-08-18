import { redirect } from "next/navigation";
import { KeyRound, UsersRound } from "lucide-react";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can, type Permission } from "@/lib/auth/permissions";
import ObjectTabs, { resolveTab, type ObjectTab } from "@/components/admin/ObjectTabs";
import Panel from "@/components/admin/Panel";
import AccessPanel from "../people/AccessPanel";
import BylinesPanel from "./BylinesPanel";

/**
 * Who works here, and what their login can do.
 *
 * Two rows became two tabs, and the split between them is worth keeping
 * rather than merging: a byline is how somebody is credited on the site,
 * and access is what their login may touch. The same human has both, and
 * changing one must never quietly change the other.
 */

export const dynamic = "force-dynamic";

const TABS: (ObjectTab & { permission: Permission })[] = [
  { id: "access", label: "People and access", icon: KeyRound, permission: "roles.manage" },
  { id: "bylines", label: "Bylines", icon: UsersRound, permission: "content.team" },
];

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");
  if (!can(user, "console.admin")) redirect("/admin");

  const visible = TABS.filter((tab) => can(user, tab.permission));
  const params = await searchParams;
  const tab = resolveTab(visible, params.tab, visible[0]?.id ?? "bylines");

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <ObjectTabs tabs={visible} current={tab} basePath="/admin/dashboard/team" />
      </div>

      {visible.length === 0 ? (
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <Panel title="The team record is not open to your role">
            Ask an owner if you need it.
          </Panel>
        </div>
      ) : (
        <>
          {tab === "access" && <AccessPanel />}
          {tab === "bylines" && <BylinesPanel />}
        </>
      )}
    </div>
  );
}
