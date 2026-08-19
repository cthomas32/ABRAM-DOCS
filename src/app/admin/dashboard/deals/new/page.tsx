import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { rows } from "@/lib/supabase/rows";
import { ObjectHeader } from "@/components/admin/ObjectTabs";
import Panel from "@/components/admin/Panel";
import DealCreate from "./DealCreate";
import type { AccountOption, ContactOption } from "../DealFields";

/**
 * Creating a deal, on an address.
 *
 * Reads the two option lists on the server, exactly as `deals/[id]` does,
 * rather than taking them as props from whichever screen opened it. The
 * drawer this replaces was handed a thousand contacts by its parent in
 * order to fill one select.
 *
 * `?account=` prefills the company, which is how a company's own New deal
 * button arrives. It is not validated here beyond existing in the list
 * the reader can already see: row level security filters that list, so an
 * id for a company they cannot read simply does not match an option, and
 * the select opens on "Pick a company".
 *
 * Behind auth, so no metadata, no canonical, no sitemap entry.
 */

export const dynamic = "force-dynamic";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 min-w-0 overflow-y-auto">
      <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto pb-16">{children}</div>
    </div>
  );
}

export default async function NewDealPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");

  if (!can(user, "crm.deals.manage")) {
    return (
      <Shell>
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] text-zinc-500">Deals</span>
        </nav>
        <ObjectHeader title="New deal" />
        <Panel title="Deals are not yours to open">
          A deal carries the figure a commission is worked out from, so opening one is a permission
          of its own. Ask an owner if you need it.
        </Panel>
      </Shell>
    );
  }

  const supabase = await createClient();

  const [accountsRes, contactsRes] = await Promise.all([
    supabase
      .from("crm_accounts")
      .select("id, name, domain")
      .eq("archived", false)
      .order("name")
      .limit(500),
    supabase
      .from("crm_contacts")
      .select("id, full_name, email, account_id, job_title")
      .eq("archived", false)
      .order("full_name")
      .limit(500),
  ]);

  const accounts = rows<AccountOption>(accountsRes);
  const contacts = rows<ContactOption>(contactsRes);

  const { account } = await searchParams;
  const initialAccountId = account && accounts.some((entry) => entry.id === account) ? account : "";

  if (!accounts.length) {
    return (
      <Shell>
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] text-zinc-500">Deals</span>
        </nav>
        <ObjectHeader title="New deal" />
        <Panel title="There is no company to hang a deal on">
          A deal belongs to a company rather than to a person, because the one who takes the first
          meeting is regularly not the one who signs. Add a company first.
        </Panel>
      </Shell>
    );
  }

  return (
    <DealCreate accounts={accounts} contacts={contacts} initialAccountId={initialAccountId} />
  );
}
