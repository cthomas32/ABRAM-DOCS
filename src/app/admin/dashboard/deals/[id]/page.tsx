import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { rows } from "@/lib/supabase/rows";
import { ObjectHeader, resolveTab, type ObjectTab } from "@/components/admin/ObjectTabs";
import Panel from "@/components/admin/Panel";
import type { CrmAccount, CrmContact, CrmDeal } from "@/lib/crm/types";
import DealRecord, { type AccountOption, type ContactOption } from "./DealRecord";

/**
 * One deal, on its own address.
 *
 * The deal board could not reach this page before it existed: a card had
 * a drag handle and a stage dropdown and no link to the record at all, so
 * the only way to read a deal was to find it again in the list and open a
 * drawer over it.
 *
 * The account and contact option lists are read here rather than shipped
 * from the list screen. The drawer took a thousand contacts as a prop and
 * re-sorted them in the browser so the ones at the chosen account came
 * first, which is a lot of rows to move in order to fill one select.
 */

export const dynamic = "force-dynamic";

/**
 * The tab ids, and only the ids. The strip is drawn by the client
 * component, which owns the icons; this exists so `resolveTab` can refuse
 * a `?tab=` the page does not have.
 */
const TAB_IDS: ObjectTab[] = [
  { id: "overview", label: "" },
  { id: "attribution", label: "" },
];

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 min-w-0 overflow-y-auto">
      <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto pb-16">{children}</div>
    </div>
  );
}

function Closed({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Shell>
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 min-w-0">
        <span className="text-[11px] text-zinc-500">Deals</span>
      </nav>
      <ObjectHeader title="Deal" />
      <Panel title={title}>{children}</Panel>
    </Shell>
  );
}

export default async function DealPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");

  const { id } = await params;

  if (!can(user, "crm.deals.manage")) {
    return (
      <Closed title="Deals are not open to your role">
        A deal carries an amount and an attribution rule, so reading one is a permission of its own.
        Ask an owner if you need it.
      </Closed>
    );
  }

  const supabase = await createClient();

  const dealRes = await supabase.from("crm_deals").select("*").eq("id", id).maybeSingle();
  const deal = dealRes.data as CrmDeal | null;

  if (!deal) {
    if (can(user, "crm.contacts.read.all")) notFound();
    return (
      <Closed title="This record is not on your list">
        It exists, or it does not, and either way it is outside what your login can read. Ask an
        owner if you should have it.
      </Closed>
    );
  }

  const [accountRes, accountsRes, contactsRes, membersRes] = await Promise.all([
    supabase.from("crm_accounts").select("*").eq("id", deal.account_id).maybeSingle(),
    supabase
      .from("crm_accounts")
      .select("id, name, domain")
      .eq("archived", false)
      .order("name")
      .limit(500),
    /* Contacts at this account first, then everybody else, so the primary
       contact select opens on the people who could plausibly be it. Two
       queries rather than one sort in the browser over every contact. */
    supabase
      .from("crm_contacts")
      .select("id, full_name, email, account_id, job_title")
      .eq("archived", false)
      .order("full_name")
      .limit(500),
    supabase.from("admin_users").select("user_id, full_name, email"),
  ]);

  const account = accountRes.data as CrmAccount | null;
  const accounts = rows<AccountOption>(accountsRes);
  const allContacts = rows<ContactOption & { account_id: string | null }>(contactsRes);

  const contacts = [
    ...allContacts.filter((row) => row.account_id === deal.account_id),
    ...allContacts.filter((row) => row.account_id !== deal.account_id),
  ];

  const primaryContact = deal.primary_contact_id
    ? ((
        await supabase
          .from("crm_contacts")
          .select("*")
          .eq("id", deal.primary_contact_id)
          .maybeSingle()
      ).data as CrmContact | null)
    : null;

  const memberNameById: Record<string, string> = {};
  for (const member of rows<{ user_id: string; full_name: string | null; email: string }>(
    membersRes
  )) {
    memberNameById[member.user_id] = member.full_name || member.email;
  }

  const { tab: wanted } = await searchParams;
  const tab = resolveTab(TAB_IDS, wanted, "overview");

  return (
    <DealRecord
      deal={deal}
      account={account}
      primaryContact={primaryContact}
      accounts={accounts}
      contacts={contacts}
      memberNameById={memberNameById}
      tab={tab}
    />
  );
}
