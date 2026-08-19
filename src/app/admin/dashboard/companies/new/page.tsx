import { redirect } from "next/navigation";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { ObjectHeader } from "@/components/admin/ObjectTabs";
import Panel from "@/components/admin/Panel";
import CompanyCreate from "./CompanyCreate";

/**
 * Creating a company, on an address.
 *
 * Guards and renders, and reads nothing: a company that does not exist
 * has nothing to fetch. The permission is checked here and again inside
 * `createAccount`, because a server action is reachable without its page,
 * and row level security refuses the insert a third time.
 *
 * Behind auth, so no metadata, no canonical, no sitemap entry. See
 * docs/design/crm-record-pages.md.
 */

export const dynamic = "force-dynamic";

export default async function NewCompanyPage() {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");

  if (!can(user, "crm.accounts.manage")) {
    return (
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto pb-16">
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 min-w-0">
            <span className="text-[11px] text-zinc-500">Companies</span>
          </nav>
          <ObjectHeader title="New company" />
          <Panel title="Companies are not yours to create">
            An account decides whether a deal on it pays commission, so opening one is a permission
            of its own. Ask an owner if you need it.
          </Panel>
        </div>
      </div>
    );
  }

  return <CompanyCreate />;
}
