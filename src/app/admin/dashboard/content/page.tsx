import { redirect } from "next/navigation";
import { BookOpen, Newspaper, Tag } from "lucide-react";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can, type Permission } from "@/lib/auth/permissions";
import ObjectTabs, { resolveTab, type ObjectTab } from "@/components/admin/ObjectTabs";
import Panel from "@/components/admin/Panel";
import BlogPanel from "../blog/BlogPanel";
import DocsPanel from "../docs/DocsPanel";
import ChangelogPanel from "../changelog/ChangelogPanel";

/**
 * Everything that stays up, on one address.
 *
 * Three writing surfaces that were three rows. A contributor holds all
 * three, a growth partner holds two of them, and the release notes are
 * withheld from a partner on purpose: a changelog is a product claim.
 */

export const dynamic = "force-dynamic";

const TABS: (ObjectTab & { permission: Permission })[] = [
  { id: "blog", label: "Blog", icon: Newspaper, permission: "content.blog" },
  { id: "docs", label: "Docs", icon: BookOpen, permission: "content.docs" },
  { id: "changelog", label: "Release notes", icon: Tag, permission: "content.changelog" },
];

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");
  if (!can(user, "console.admin")) redirect("/admin");

  const visible = TABS.filter((tab) => can(user, tab.permission));
  const params = await searchParams;
  const tab = resolveTab(visible, params.tab, visible[0]?.id ?? "blog");

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <ObjectTabs tabs={visible} current={tab} basePath="/admin/dashboard/content" />
      </div>

      {visible.length === 0 ? (
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <Panel title="No writing surface is open to your role">
            Ask an owner if you need one of them.
          </Panel>
        </div>
      ) : (
        <>
          {tab === "blog" && <BlogPanel />}
          {tab === "docs" && <DocsPanel />}
          {tab === "changelog" && <ChangelogPanel />}
        </>
      )}
    </div>
  );
}
