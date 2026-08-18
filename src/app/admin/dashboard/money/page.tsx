import { redirect } from "next/navigation";
import { BarChart3, Banknote, Landmark, Wallet } from "lucide-react";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can, type Permission } from "@/lib/auth/permissions";
import ObjectTabs, { resolveTab, type ObjectTab } from "@/components/admin/ObjectTabs";
import Panel from "@/components/admin/Panel";
import EarningsPanel from "../earnings/EarningsPanel";
import RevenuePanel from "../revenue/RevenuePanel";
import ReportsPanel from "../reports/ReportsPanel";
import CommissionPanel from "../reports/CommissionPanel";

/**
 * Money, on one address.
 *
 * Four tabs and four different readers. Earnings is what *you* have
 * earned and every role that holds a commission line can open it.
 * Revenue and sync is the raw payment mirror, which is owners only
 * because it holds customer payment data. Reports is the cross-company
 * rollup. Commission is what everybody else is owed, which is stricter
 * again.
 *
 * The revenue tab renders the same component as /admin/dashboard/revenue,
 * which stays a real address: the collections sync work is landing there
 * and a tab must not fork it into a second screen that drifts.
 */

export const dynamic = "force-dynamic";

const TABS: (ObjectTab & { permission: Permission })[] = [
  { id: "earnings", label: "Earnings", icon: Wallet, permission: "commission.read.own" },
  { id: "revenue", label: "Revenue and sync", icon: Landmark, permission: "commission.manage" },
  { id: "reports", label: "Reports", icon: BarChart3, permission: "reports.read" },
  { id: "commission", label: "Commission", icon: Banknote, permission: "commission.manage" },
];

export default async function MoneyPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");
  if (!can(user, "console.admin")) redirect("/admin");

  const visible = TABS.filter((tab) => can(user, tab.permission));
  const params = await searchParams;
  const tab = resolveTab(visible, params.tab, visible[0]?.id ?? "earnings");

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <ObjectTabs tabs={visible} current={tab} basePath="/admin/dashboard/money" />
      </div>

      {visible.length === 0 ? (
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <Panel title="Nothing about money is open to your role">
            Ask an owner if you need it.
          </Panel>
        </div>
      ) : (
        <>
          {tab === "earnings" && <EarningsPanel />}
          {tab === "revenue" && <RevenuePanel />}
          {tab === "reports" && <ReportsPanel />}
          {tab === "commission" && <CommissionPanel />}
        </>
      )}
    </div>
  );
}
