import { redirect } from "next/navigation";
import { BarChart3, Columns3, Handshake, Stamp } from "lucide-react";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import ObjectTabs, { resolveTab, type ObjectTab } from "@/components/admin/ObjectTabs";
import Panel from "@/components/admin/Panel";
import DealsListPanel from "./DealsListPanel";
import BoardPanel from "./BoardPanel";
import ForecastPanel from "./ForecastPanel";
import RegistrationsPanel from "../registrations/RegistrationsPanel";

/**
 * Deals: one object, four ways of looking at it.
 *
 * The list is the master spreadsheet and the board is a second drawing of
 * the same rows, which is why the board is a tab rather than a sibling
 * page: they were two navigation rows and that said they were two things.
 *
 * Registrations sit here too. A registration is a claim on a deal that
 * does not exist yet, and filing one away on its own screen is how it
 * stopped being read.
 */

export const dynamic = "force-dynamic";

const TABS: ObjectTab[] = [
  { id: "list", label: "List", icon: Handshake },
  { id: "board", label: "Board", icon: Columns3 },
  { id: "forecast", label: "Forecast", icon: BarChart3 },
  { id: "registrations", label: "Registrations", icon: Stamp },
];

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");
  if (!can(user, "crm.deals.manage")) redirect("/admin/dashboard");

  const canRegister = can(user, "crm.registrations.file");
  const visible = TABS.filter((tab) => tab.id !== "registrations" || canRegister);

  const params = await searchParams;
  const tab = resolveTab(visible, params.tab, "list");

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <ObjectTabs tabs={visible} current={tab} basePath="/admin/dashboard/deals" />
      </div>

      {tab === "list" && <DealsListPanel />}
      {tab === "board" && <BoardPanel />}
      {tab === "forecast" && (
        <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-6xl mx-auto">
          <ForecastPanel />
        </div>
      )}
      {tab === "registrations" &&
        (canRegister ? (
          <RegistrationsPanel />
        ) : (
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <Panel title="Registrations are not open to your role">
              Filing a claim on a named account is a growth partner&rsquo;s job. Ask an owner if you
              need it.
            </Panel>
          </div>
        ))}
    </div>
  );
}
