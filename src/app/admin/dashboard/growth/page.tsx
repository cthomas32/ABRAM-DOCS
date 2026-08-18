import { redirect } from "next/navigation";
import { Activity, BadgePercent, Image as ImageIcon, Link as LinkIcon, Mail, Megaphone } from "lucide-react";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can, type Permission } from "@/lib/auth/permissions";
import ObjectTabs, { resolveTab, type ObjectTab } from "@/components/admin/ObjectTabs";
import Panel from "@/components/admin/Panel";
import TrafficPanel from "../TrafficPanel";
import EmailPanel from "../broadcasts/EmailPanel";
import PromotionsPanel from "../promotions/PromotionsPanel";
import CampaignsPanel from "../campaigns/CampaignsPanel";
import SocialPanel from "../social/SocialPanel";
import LinksPanel from "../links/LinksPanel";

/**
 * Everything that goes out, on one address.
 *
 * Six sidebar rows became six tabs. They were six rows because they are
 * six tools, and they are one row because they are one job: getting
 * somebody to arrive. The tab is in the URL, so every old address still
 * lands exactly where it used to.
 *
 * Each tab is guarded separately rather than the page being guarded once.
 * A growth partner holds most of these and not all of them, and the
 * honest answer to a tab they do not hold is to not draw it.
 */

export const dynamic = "force-dynamic";

const TABS: (ObjectTab & { permission: Permission })[] = [
  { id: "traffic", label: "Traffic", icon: Activity, permission: "analytics.read" },
  { id: "email", label: "Email", icon: Mail, permission: "broadcasts.draft" },
  { id: "promos", label: "Promo codes", icon: BadgePercent, permission: "promotions.manage" },
  { id: "pages", label: "Campaign pages", icon: Megaphone, permission: "campaigns.manage" },
  { id: "social", label: "Social", icon: ImageIcon, permission: "social.manage" },
  { id: "links", label: "Link hub", icon: LinkIcon, permission: "links.manage" },
];

export default async function GrowthToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");
  if (!can(user, "console.admin")) redirect("/admin");

  const visible = TABS.filter((tab) => can(user, tab.permission));
  const params = await searchParams;
  const tab = resolveTab(visible, params.tab, visible[0]?.id ?? "traffic");

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <ObjectTabs tabs={visible} current={tab} basePath="/admin/dashboard/growth" />
      </div>

      {visible.length === 0 ? (
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <Panel title="None of the growth tools are open to your role">
            Ask an owner if you need one of them.
          </Panel>
        </div>
      ) : (
        <>
          {tab === "traffic" && <TrafficPanel />}
          {tab === "email" && <EmailPanel />}
          {tab === "promos" && <PromotionsPanel />}
          {tab === "pages" && <CampaignsPanel />}
          {tab === "social" && <SocialPanel />}
          {tab === "links" && <LinksPanel />}
        </>
      )}
    </div>
  );
}
