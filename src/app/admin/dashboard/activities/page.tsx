import { redirect } from "next/navigation";
import { CheckSquare, Mail, Phone, StickyNote } from "lucide-react";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import ObjectTabs, { resolveTab, type ObjectTab } from "@/components/admin/ObjectTabs";
import TasksPanel from "../tasks/TasksPanel";
import TimelinePanel from "./TimelinePanel";

/**
 * Activities: everything that happened, and everything owed.
 *
 * Four tabs over two tables. Tasks is `crm_tasks`, which is what has not
 * happened yet. The other three are one query over `crm_interactions`
 * with a different set of kinds, because a call and a note were never two
 * objects — they are one row with a `kind` column, and the console used
 * to have nowhere at all to read them except inside one person's drawer.
 */

export const dynamic = "force-dynamic";

const TABS: ObjectTab[] = [
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "calls", label: "Calls and meetings", icon: Phone },
  { id: "email", label: "Email", icon: Mail },
  { id: "notes", label: "Notes", icon: StickyNote },
];

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");
  if (!can(user, "crm.contacts.read.own")) redirect("/admin/dashboard");

  const params = await searchParams;
  const tab = resolveTab(TABS, params.tab, "tasks");
  const canWrite = can(user, "crm.contacts.write.own");

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <ObjectTabs tabs={TABS} current={tab} basePath="/admin/dashboard/activities" />
      </div>

      {tab === "tasks" ? (
        <TasksPanel />
      ) : (
        <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-5xl mx-auto">
          {tab === "calls" && (
            <TimelinePanel
              kinds={["call", "meeting", "demo"]}
              canLog={canWrite}
              emptyTitle="Nothing logged yet."
              emptyBody="A call or a meeting appears here the moment somebody records one. The activity numbers on the money screen count exactly these rows."
            />
          )}
          {tab === "email" && (
            <TimelinePanel
              kinds={["email_sent", "email_received", "email_opened", "email_clicked"]}
              emptyTitle="No email on any timeline yet."
              emptyBody="One to one sends land here, with the opens and clicks the provider reports back. A broadcast is a different thing and lives under growth tools."
            />
          )}
          {tab === "notes" && (
            <TimelinePanel
              kinds={["note"]}
              emptyTitle="No notes yet."
              emptyBody="A note is written on a person, from their record. This is every one of them in the order they were written."
            />
          )}
        </div>
      )}
    </div>
  );
}
