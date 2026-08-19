"use client";

import React, { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { FileDown, ListFilter, Loader2, Share2, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { rows } from "@/lib/supabase/rows";
import Overline from "@/components/admin/Overline";
import Panel, { EmptyPanel } from "@/components/admin/Panel";
import { StatRow } from "@/components/admin/StatTile";
import { BLOCK_CARD, CONTROL_HEIGHT } from "@/lib/crm/blockStyles";
import type { CrmContact, CrmTask } from "@/lib/crm/types";
import {
  applyContactFilter,
  describeFilter,
  readFilter,
  type CrmSavedView,
} from "@/lib/crm/savedViews";
import { contactsToCsv, downloadFile, isDueOrOverdue, stampedFilename } from "@/lib/crm/console";
import { deleteContactView, updateContactView } from "./viewActions";

/**
 * Lists: the filters somebody kept.
 *
 * Every list here is a question rather than a membership. Nobody is added
 * to one and nobody falls out of one; the filter is run again each time
 * it is opened, so a list of "sales qualified people from an event" is
 * true this morning without anybody maintaining it.
 *
 * The count beside each name is computed in the browser off the same
 * contacts the people screen holds, and through the same function, so a
 * list and the board it came from cannot disagree about who is in it.
 */

export default function ListsPanel() {
  const [views, setViews] = useState<CrmSavedView[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [openTasks, setOpenTasks] = useState<CrmTask[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    const supabase = createClient();

    const [viewsRes, contactsRes, tasksRes, scoresRes] = await Promise.all([
      supabase
        .from("crm_saved_views")
        .select("*")
        .eq("scope", "contacts")
        .order("name", { ascending: true }),
      supabase.from("crm_contacts").select("*").order("met_at", { ascending: false }).limit(2000),
      supabase.from("crm_tasks").select("*").eq("status", "open"),
      supabase.from("crm_contact_lead_scores").select("contact_id, score"),
    ]);

    setWarning(
      viewsRes.error || contactsRes.error
        ? "Some of this could not be read. Sign in again, or ask an owner to check your access."
        : null
    );

    setViews(
      rows<CrmSavedView>(viewsRes).map((view) => ({ ...view, filter: readFilter(view.filter) }))
    );
    setContacts(rows<CrmContact>(contactsRes));
    setOpenTasks(rows<CrmTask>(tasksRes));

    // The score view is a convenience. Losing it costs a column, not a page.
    const map: Record<string, number> = {};
    for (const row of rows<{ contact_id: string; score: number }>(scoresRes)) {
      map[row.contact_id] = row.score;
    }
    setScores(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dueContactIds = useMemo(() => {
    const set = new Set<string>();
    for (const task of openTasks) if (isDueOrOverdue(task.due_at)) set.add(task.contact_id);
    for (const contact of contacts) {
      if (!contact.archived && isDueOrOverdue(contact.next_follow_up_at)) set.add(contact.id);
    }
    return set;
  }, [openTasks, contacts]);

  const matches = useCallback(
    (view: CrmSavedView) =>
      applyContactFilter(contacts, view.filter, { dueContactIds, scoreById: scores }),
    [contacts, dueContactIds, scores]
  );

  const run = (work: () => Promise<{ ok: boolean; error?: string }>) => {
    startTransition(async () => {
      const result = await work();
      setNotice(result.error ?? null);
      if (result.ok) await load();
    });
  };

  const shared = views.filter((view) => view.is_shared).length;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Lists</h1>
          <p className="text-sm text-zinc-400 mt-2 leading-relaxed max-w-2xl">
            A list is a filter somebody named. Nobody is added to one and nobody falls out of one:
            the filter runs again each time it is opened, so the answer is always today&rsquo;s.
            Save a new one from the people screen.
          </p>
        </header>

        {warning && (
          <Panel className="mb-6" title="Some of this did not load">
            {warning}
          </Panel>
        )}
        {notice && (
          <Panel className="mb-6" title="That did not work">
            {notice}
          </Panel>
        )}

        <StatRow
          className="mb-8"
          loading={loading}
          stats={[
            { label: "Lists", value: String(views.length), hint: `${shared} shared` },
            {
              label: "People they run over",
              value: contacts.filter((contact) => !contact.archived).length.toLocaleString(),
            },
          ]}
        />

        <Overline as="h2" className="mb-3">
          Saved
        </Overline>

        {loading ? (
          <div className="space-y-2" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <div key={index} className={`${BLOCK_CARD} h-20 animate-pulse`} />
            ))}
          </div>
        ) : views.length === 0 ? (
          <EmptyPanel
            title="No lists yet."
            icon={<ListFilter className="w-6 h-6" />}
            action={
              <Link
                href="/admin/dashboard/people"
                className={`btn-glass px-4 ${CONTROL_HEIGHT} text-[11px] font-medium rounded-full`}
              >
                Open the people screen
              </Link>
            }
          >
            Set the filters you want on the people screen, then press Save as a list. It keeps the
            question rather than the answer.
          </EmptyPanel>
        ) : (
          <ul className="space-y-2">
            {views.map((view) => {
              const people = matches(view);
              return (
                <li key={view.id} className={`${BLOCK_CARD} flex flex-wrap items-center gap-3`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">
                      {view.name}
                      {view.is_shared && (
                        <span className="text-[11px] text-zinc-500 ml-2">shared</span>
                      )}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                      {describeFilter(view.filter)}
                    </p>
                  </div>

                  <span className="text-sm text-white tabular-nums shrink-0">
                    {people.length.toLocaleString()}
                  </span>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Link
                      href={`/admin/dashboard/people?view=${encodeURIComponent(view.id)}`}
                      className={`btn-glass px-3 ${CONTROL_HEIGHT} text-[11px] font-medium rounded-full`}
                    >
                      Open
                    </Link>
                    <button
                      type="button"
                      disabled={people.length === 0}
                      onClick={() =>
                        downloadFile(
                          stampedFilename(
                            view.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "list",
                            "csv"
                          ),
                          "text/csv;charset=utf-8",
                          contactsToCsv(people)
                        )
                      }
                      className={`btn-glass px-3 ${CONTROL_HEIGHT} text-[11px] font-medium rounded-full disabled:opacity-50`}
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      CSV
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        run(() => updateContactView({ id: view.id, isShared: !view.is_shared }))
                      }
                      className={`btn-glass px-3 ${CONTROL_HEIGHT} text-[11px] font-medium rounded-full disabled:opacity-50`}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      {view.is_shared ? "Keep private" : "Share"}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => deleteContactView({ id: view.id }))}
                      aria-label={`Remove ${view.name}`}
                      className={`btn-ghost px-3 ${CONTROL_HEIGHT} text-[11px] font-medium rounded-full disabled:opacity-50`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {pending && (
          <p className="mt-6 text-[11px] text-zinc-400 flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving.
          </p>
        )}
      </div>
    </div>
  );
}
