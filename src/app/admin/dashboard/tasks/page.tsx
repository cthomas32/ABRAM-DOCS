import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import type { CrmPriority, TaskStatus } from "@/lib/crm/constants";
import TaskQueue, {
  type QueueContact,
  type QueueDeal,
  type QueuePerson,
  type QueueTask,
} from "./TaskQueue";
import { rows } from "@/lib/supabase/rows";

/**
 * The follow up queue.
 *
 * Everything with a due date, in the order it is going to be ignored in.
 * Overdue first, because a queue that opens on next week is a list rather
 * than a queue.
 *
 * Tasks were readable before this page existed, but only from inside one
 * contact's drawer, which answered "what do I owe this person" and never
 * "what do I owe anybody". Row level security is unchanged: a task
 * follows its contact, so this shows exactly the follow ups whose people
 * are visible to the reader.
 */

export const dynamic = "force-dynamic";

/** Done tasks older than this stop being interesting. */
const DONE_WINDOW_DAYS = 30;

export default async function TasksPage() {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");
  if (!can(user, "crm.contacts.read.own")) redirect("/admin/dashboard");

  const supabase = await createClient();
  const doneSince = new Date(Date.now() - DONE_WINDOW_DAYS * 86_400_000).toISOString();

  const [tasksRes, doneRes, contactsRes, dealsRes, peopleRes] = await Promise.all([
    supabase
      .from("crm_tasks")
      .select("*")
      .in("status", ["open", "snoozed"])
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(500),
    supabase
      .from("crm_tasks")
      .select("*")
      .eq("status", "done")
      .gte("completed_at", doneSince)
      .order("completed_at", { ascending: false })
      .limit(50),
    supabase
      .from("crm_contacts")
      .select("id, full_name, company")
      .eq("archived", false)
      .order("last_activity_at", { ascending: false })
      .limit(1000),
    supabase
      .from("crm_deals")
      .select("id, name, primary_contact_id")
      .not("stage", "in", "(won,lost)")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("admin_users").select("user_id, full_name, email"),
  ]);

  const toTask = (row: Record<string, unknown>): QueueTask => ({
    id: row.id as string,
    contact_id: row.contact_id as string,
    title: row.title as string,
    details: (row.details as string | null) ?? null,
    due_at: (row.due_at as string | null) ?? null,
    status: row.status as TaskStatus,
    priority: (row.priority as CrmPriority) ?? "normal",
    completed_at: (row.completed_at as string | null) ?? null,
    assigned_to: (row.assigned_to as string | null) ?? null,
  });

  const tasks = [...rows<Record<string, unknown>>(tasksRes), ...rows<Record<string, unknown>>(doneRes)].map(toTask);

  const contacts = rows<QueueContact>(contactsRes);
  const deals = rows<QueueDeal>(dealsRes);
  const people = rows<QueuePerson>(peopleRes);

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 flex-1 min-w-0 overflow-y-auto">
      <TaskQueue
        tasks={tasks}
        contacts={contacts}
        deals={deals}
        people={people}
        currentUserId={user.userId}
        canWrite={can(user, "crm.contacts.write.own")}
        loadError={tasksRes.error ? tasksRes.error.message : null}
      />
    </div>
  );
}
