import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { rows } from "@/lib/supabase/rows";
import { ObjectHeader, resolveTab, type ObjectTab } from "@/components/admin/ObjectTabs";
import Panel from "@/components/admin/Panel";
import type { CrmAccount, CrmContact, CrmDeal } from "@/lib/crm/types";
import CompanyRecord from "./CompanyRecord";

/**
 * One company, on its own address.
 *
 * This replaces a 460px drawer that opened over the companies list and
 * put nothing in the URL. The drawer could not be linked, bookmarked or
 * backed out of, and a company carrying a commission carve out and a
 * first contact date that decides whether a registration is valid is not
 * a thing to read in a side panel.
 *
 * Server component, so the three reads happen once on the server rather
 * than as four round trips from the browser the way `CompaniesPanel`
 * does them. The people and deals lists are scoped queries here: the
 * drawer received them as props sliced out of the parent's in-memory map
 * of every account, which meant opening one company had already paid for
 * loading a thousand contacts.
 *
 * Row level security decides what comes back. See section 5.3 of
 * docs/design/crm-record-pages.md for why a refusal renders a closed door
 * rather than redirecting: a record page is the thing somebody was sent a
 * link to, and a silent bounce to the overview reads as a bug.
 */

export const dynamic = "force-dynamic";

/**
 * The tab ids, and only the ids.
 *
 * The strip itself is drawn by the client component, which owns the
 * icons. This list exists here so `resolveTab` can refuse a `?tab=` the
 * page does not have without the server needing to know what any of them
 * look like.
 */
const TAB_IDS: ObjectTab[] = [{ id: "overview", label: "" }, { id: "people", label: "" }, { id: "deals", label: "" }];

/** The shell a refusal is drawn inside, so a closed door still looks like the console. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 min-w-0 overflow-y-auto">
      <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto pb-16">{children}</div>
    </div>
  );
}

export default async function CompanyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");

  const { id } = await params;

  /* Case A: the object is not open to this role at all. The title says the
     kind of thing and never the record's name, because the name is part of
     what they may not read. */
  if (!can(user, "crm.accounts.manage")) {
    return (
      <Shell>
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] text-zinc-500">Companies</span>
        </nav>
        <ObjectHeader title="Company" />
        <Panel title="Companies are not open to your role">
          A company record carries the exclusions that decide whether anything on it pays
          commission, so reading one is a permission of its own. Ask an owner if you need it.
        </Panel>
      </Shell>
    );
  }

  const supabase = await createClient();

  const accountRes = await supabase.from("crm_accounts").select("*").eq("id", id).maybeSingle();
  const account = accountRes.data as CrmAccount | null;

  /* Case B: the permission is held and nothing came back. A partner opening
     somebody else's account gets null with no error, which is not
     distinguishable from a row that was never there. Say which of the two
     it might be rather than guessing. */
  if (!account) {
    if (can(user, "crm.contacts.read.all")) notFound();
    return (
      <Shell>
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] text-zinc-500">Companies</span>
        </nav>
        <ObjectHeader title="Company" />
        <Panel title="This record is not on your list">
          It exists, or it does not, and either way it is outside what your login can read. Ask an
          owner if you should have it.
        </Panel>
      </Shell>
    );
  }

  const [peopleRes, dealsRes, membersRes] = await Promise.all([
    supabase
      .from("crm_contacts")
      .select("*")
      .eq("account_id", id)
      .eq("archived", false)
      .order("full_name")
      .limit(500),
    supabase
      .from("crm_deals")
      .select("*")
      .eq("account_id", id)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("admin_users").select("user_id, full_name, email"),
  ]);

  const people = rows<CrmContact>(peopleRes);
  const deals = rows<CrmDeal>(dealsRes);

  const memberNameById: Record<string, string> = {};
  for (const member of rows<{ user_id: string; full_name: string | null; email: string }>(
    membersRes
  )) {
    memberNameById[member.user_id] = member.full_name || member.email;
  }

  const { tab: wanted } = await searchParams;
  const tab = resolveTab(TAB_IDS, wanted, "overview");

  return (
    <CompanyRecord
      account={account}
      people={people}
      deals={deals}
      memberNameById={memberNameById}
      tab={tab}
    />
  );
}
