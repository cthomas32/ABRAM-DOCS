import { redirect } from "next/navigation";
import {
  CalendarDays,
  Contact as ContactIcon,
  IdCard,
  ListFilter,
  QrCode as QrIcon,
  Route,
  Upload,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { rows, readWarning } from "@/lib/supabase/rows";
import ObjectTabs, { resolveTab, type ObjectTab } from "@/components/admin/ObjectTabs";
import Panel from "@/components/admin/Panel";
import type {
  CrmSequence,
  CrmSequenceEnrollment,
  CrmSequenceStep,
} from "@/lib/crm/sequences";
import PeopleWorkspace, { type PeopleTab } from "./PeopleWorkspace";
import ListsPanel from "./ListsPanel";
import ImportPanel from "./ImportPanel";
import SequencesPanel, { type EnrolledPerson } from "./SequencesPanel";

/**
 * People: one object, one address, tabs inside it.
 *
 * Lists, sequences and importing were three sidebar rows a moment ago,
 * and all three are things you do *to people*. They are tabs on the
 * person object now, which is the shape the product's own project screen
 * uses and the shape the founder asked for after counting the rows in
 * this sidebar.
 *
 * The tab is in the address rather than in state, so a tab is linkable
 * and the redirects from the old addresses land somewhere exact. This
 * file is the router: it guards, reads `?tab=`, and hands off. Every
 * panel below owns its own reads.
 */

export const dynamic = "force-dynamic";

const TABS: ObjectTab[] = [
  { id: "list", label: "List", icon: ContactIcon },
  { id: "lists", label: "Lists", icon: ListFilter },
  { id: "sequences", label: "Sequences", icon: Route },
  { id: "import", label: "Import and export", icon: Upload },
  { id: "events", label: "Events", icon: CalendarDays },
  { id: "codes", label: "Codes", icon: QrIcon },
  { id: "card", label: "Your card", icon: IdCard },
];

const WORKSPACE_TABS = new Set<string>(["list", "events", "codes", "card"]);

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");
  if (!can(user, "crm.contacts.read.own")) redirect("/admin/dashboard");

  const params = await searchParams;
  const tab = resolveTab(TABS, params.tab, "list");
  const canSequence = can(user, "crm.sequences.manage");

  // The tabs somebody cannot enter are not drawn. A menu showing doors
  // that do not open also says what everybody else can do.
  const visible = TABS.filter((entry) => entry.id !== "sequences" || canSequence);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-[100rem] mx-auto pb-16 space-y-6">
        <ObjectTabs tabs={visible} current={tab} basePath="/admin/dashboard/people" />

        {WORKSPACE_TABS.has(tab) && <PeopleWorkspace tab={tab as PeopleTab} />}
        {tab === "lists" && <ListsPanel />}
        {tab === "import" && <ImportPanel />}
        {tab === "sequences" &&
          (canSequence ? <SequencesTab /> : (
            <Panel title="Sequences are not open to your role">
              Ask an owner if you need to write one. Enrolling somebody creates work in a queue,
              which is why it is a permission of its own.
            </Panel>
          ))}
      </div>
    </div>
  );
}

/**
 * The sequences tab reads on the server rather than in the browser, so
 * the steps and the enrolments arrive already scoped by row level
 * security instead of being asked for a second time from a client.
 */
async function SequencesTab() {
  const supabase = await createClient();

  const [sequencesRes, stepsRes, enrollmentsRes, contactsRes] = await Promise.all([
    supabase.from("crm_sequences").select("*").order("created_at", { ascending: false }),
    supabase.from("crm_sequence_steps").select("*"),
    supabase
      .from("crm_sequence_enrollments")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("crm_contacts")
      .select("id, full_name, company, email")
      .eq("archived", false)
      .order("last_activity_at", { ascending: false })
      .limit(1000),
  ]);

  return (
    <SequencesPanel
      sequences={rows<CrmSequence>(sequencesRes)}
      steps={rows<CrmSequenceStep>(stepsRes)}
      enrollments={rows<CrmSequenceEnrollment>(enrollmentsRes)}
      contacts={rows<EnrolledPerson>(contactsRes)}
      warning={readWarning(sequencesRes, "Your sequences")}
    />
  );
}
