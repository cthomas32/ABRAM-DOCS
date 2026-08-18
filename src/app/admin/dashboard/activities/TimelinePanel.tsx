import { createClient } from "@/utils/supabase/server";
import { rows } from "@/lib/supabase/rows";
import { EmptyPanel } from "@/components/admin/Panel";
import { INTERACTION_LABELS, type InteractionKind } from "@/lib/crm/constants";
import LogActivity from "./LogActivity";

/**
 * One timeline, filtered by kind.
 *
 * Calls, meetings, emails and notes were never four objects. They are one
 * row in `crm_interactions` with a `kind` column, and the console was
 * pretending otherwise by having nowhere at all to see them except inside
 * one person's drawer. So this is the timeline as a screen, and the tabs
 * above it are a filter on one column.
 *
 * Row level security scopes it: a line follows its contact, so this shows
 * exactly the history whose people are visible to the reader.
 */

export interface TimelineRow {
  id: string;
  contact_id: string | null;
  kind: InteractionKind;
  body: string | null;
  occurred_at: string;
  author: string | null;
}

function when(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function TimelinePanel({
  kinds,
  emptyTitle,
  emptyBody,
  /** Draws the log-a-call form above the list. */
  canLog = false,
}: {
  kinds: InteractionKind[];
  emptyTitle: string;
  emptyBody: string;
  canLog?: boolean;
}) {
  const supabase = await createClient();

  const [linesRes, contactsRes] = await Promise.all([
    supabase
      .from("crm_interactions")
      .select("id, contact_id, kind, body, occurred_at, author")
      .in("kind", kinds)
      .order("occurred_at", { ascending: false })
      .limit(200),
    supabase
      .from("crm_contacts")
      .select("id, full_name, company")
      .eq("archived", false)
      .order("last_activity_at", { ascending: false })
      .limit(1000),
  ]);

  const lines = rows<TimelineRow>(linesRes);
  const contacts = rows<{ id: string; full_name: string; company: string | null }>(contactsRes);
  const nameById = new Map(contacts.map((contact) => [contact.id, contact.full_name]));

  return (
    <div className="space-y-5">
      {canLog && <LogActivity contacts={contacts} />}

      {lines.length === 0 ? (
        <EmptyPanel title={emptyTitle}>{emptyBody}</EmptyPanel>
      ) : (
        <ul className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5">
          {lines.map((line) => (
            <li key={line.id} className="px-5 py-3.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500 w-28 shrink-0">
                {INTERACTION_LABELS[line.kind] ?? line.kind}
              </span>
              <span className="text-xs text-white min-w-0 flex-1">
                {line.contact_id ? nameById.get(line.contact_id) ?? "Somebody you can no longer see" : "A deal"}
                {line.body && <span className="text-zinc-400"> · {line.body}</span>}
              </span>
              <span className="text-[11px] text-zinc-500 tabular-nums shrink-0">
                {when(line.occurred_at)}
                {line.author ? ` · ${line.author}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
