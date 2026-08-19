import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { rows } from "@/lib/supabase/rows";
import { ObjectHeader, resolveTab, type ObjectTab } from "@/components/admin/ObjectTabs";
import Panel from "@/components/admin/Panel";
import type {
  CrmAccount,
  CrmContact,
  CrmDeal,
  CrmEvent,
  CrmInteraction,
  CrmTask,
} from "@/lib/crm/types";
import PersonRecord, { type SequenceOption } from "./PersonRecord";

/**
 * One person, on their own address.
 *
 * The drawer this replaces was the largest single file in the console at
 * 1105 lines, and the only surface anywhere in it that wrote to the
 * database straight from the browser. Both facts came from the same
 * cause: it had to be self sufficient, because the screen underneath it
 * held the contact in an array and knew nothing about tasks, timelines or
 * sequences. So it fetched its own history, wrote its own updates, and
 * handed the parent a patched object back through a callback.
 *
 * On a page the reads happen here, once, on the server, and the writes go
 * through `../actions.ts` where they can be guarded and attributed. What
 * is left in the client component is the form.
 *
 * The timeline is capped at 200 entries, which is what the drawer capped
 * it at. A person with more history than that has a story worth reading
 * somewhere other than a scroll.
 */

export const dynamic = "force-dynamic";

const TIMELINE_LIMIT = 200;

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
        <span className="text-[11px] text-zinc-500">People</span>
      </nav>
      <ObjectHeader title="Person" />
      <Panel title={title}>{children}</Panel>
    </Shell>
  );
}

export default async function PersonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");

  const { id } = await params;

  if (!can(user, "crm.contacts.read.own")) {
    return (
      <Closed title="People are not open to your role">
        A person&apos;s record carries their contact details and everything that has been said to
        them, so reading one is a permission of its own. Ask an owner if you need it.
      </Closed>
    );
  }

  const supabase = await createClient();

  const contactRes = await supabase.from("crm_contacts").select("*").eq("id", id).maybeSingle();
  const contact = contactRes.data as CrmContact | null;

  if (!contact) {
    if (can(user, "crm.contacts.read.all")) notFound();
    return (
      <Closed title="This record is not on your list">
        It exists, or it does not, and either way it is outside what your login can read. Ask an
        owner if you should have it.
      </Closed>
    );
  }

  const canWrite = can(user, "crm.contacts.write.own");
  const canSequences = can(user, "crm.sequences.manage");
  /* Creating the company this person names is an account write, so the
     offer to do it is drawn only for somebody who may. Linking to one
     that already exists is a contact write and rides on canWrite. */
  const canAccounts = can(user, "crm.accounts.manage");

  const [interactionsRes, tasksRes, accountsRes, eventsRes, dealsRes, sequencesRes, accountRes] =
    await Promise.all([
      supabase
        .from("crm_interactions")
        .select("*")
        .eq("contact_id", id)
        .order("occurred_at", { ascending: false })
        .limit(TIMELINE_LIMIT),
      supabase
        .from("crm_tasks")
        .select("*")
        .eq("contact_id", id)
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(200),
      supabase
        .from("crm_accounts")
        .select("id, name, domain")
        .eq("archived", false)
        .order("name")
        .limit(500),
      supabase.from("crm_events").select("*").order("starts_on", { ascending: false }).limit(200),
      supabase
        .from("crm_deals")
        .select("*")
        .eq("primary_contact_id", id)
        .order("created_at", { ascending: false })
        .limit(100),
      canSequences
        ? supabase
            .from("crm_sequences")
            .select("id, name, description")
            .eq("is_active", true)
            .order("name")
            .limit(100)
        : Promise.resolve({ data: null, error: null }),
      contact.account_id
        ? supabase.from("crm_accounts").select("*").eq("id", contact.account_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

  const interactions = rows<CrmInteraction>(interactionsRes);
  const tasks = rows<CrmTask>(tasksRes);
  const deals = rows<CrmDeal>(dealsRes);
  const account = (accountRes as { data: unknown }).data as CrmAccount | null;

  /* Ids only. The strip is drawn by the client component, which owns the
     icons, because an icon is a component and a component cannot cross
     the server to client boundary. Sequences is dropped from the list
     rather than disabled, so a `?tab=sequences` from somebody without the
     permission resolves to overview instead of drawing an empty tab. */
  const tabIds: ObjectTab[] = [
    { id: "overview", label: "" },
    { id: "activity", label: "" },
    { id: "deals", label: "" },
    ...(canSequences ? [{ id: "sequences", label: "" }] : []),
  ];

  const { tab: wanted } = await searchParams;
  const tab = resolveTab(tabIds, wanted, "overview");

  return (
    <PersonRecord
      contact={contact}
      account={account}
      accounts={rows(accountsRes)}
      events={rows<CrmEvent>(eventsRes)}
      interactions={interactions}
      tasks={tasks}
      deals={deals}
      sequences={rows<SequenceOption>(sequencesRes)}
      canWrite={canWrite}
      canSequences={canSequences}
      canAccounts={canAccounts}
      counts={{ activity: interactions.length, deals: deals.length }}
      tab={tab}
    />
  );
}
