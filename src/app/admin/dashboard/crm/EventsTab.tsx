"use client";

import React, { useMemo, useState } from "react";
import { CalendarDays, Check, Loader2, MapPin, Plus, Save, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { CrmEvent } from "@/lib/crm/types";
import { formatDate, ratePct, slugify, type EventStatRow, type Notify } from "./lib";

/**
 * The shows.
 *
 * One of them is active at a time, and that is not a cosmetic flag: a scan
 * on a code that does not name an event is attributed to whichever event is
 * active, so it is the difference between a week of contacts landing under
 * the right conference and landing nowhere. Setting one clears the rest in
 * the same click, because the alternative is two active events and a set of
 * numbers nobody can trust.
 */

interface EventsTabProps {
  events: CrmEvent[];
  stats: EventStatRow[];
  onChanged: () => void;
  notify: Notify;
}

interface EventDraft {
  name: string;
  slug: string;
  venue: string;
  city: string;
  country: string;
  starts_on: string;
  ends_on: string;
  notes: string;
}

const BLANK: EventDraft = {
  name: "",
  slug: "",
  venue: "",
  city: "",
  country: "",
  starts_on: "",
  ends_on: "",
  notes: "",
};

function draftFrom(event: CrmEvent): EventDraft {
  return {
    name: event.name ?? "",
    slug: event.slug ?? "",
    venue: event.venue ?? "",
    city: event.city ?? "",
    country: event.country ?? "",
    starts_on: event.starts_on ?? "",
    ends_on: event.ends_on ?? "",
    notes: event.notes ?? "",
  };
}

export default function EventsTab({ events, stats, onChanged, notify }: EventsTabProps) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<EventDraft>(BLANK);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EventDraft>(BLANK);
  const [busy, setBusy] = useState(false);

  const statsById = useMemo(() => {
    const map: Record<string, EventStatRow> = {};
    for (const row of stats) map[row.event_id] = row;
    return map;
  }, [stats]);

  const payloadFrom = (value: EventDraft) => ({
    name: value.name.trim(),
    slug: (value.slug.trim() || slugify(value.name)) || slugify(`event-${Date.now()}`),
    venue: value.venue.trim() || null,
    city: value.city.trim() || null,
    country: value.country.trim() || null,
    starts_on: value.starts_on || null,
    ends_on: value.ends_on || null,
    notes: value.notes.trim() || null,
  });

  const createEvent = async () => {
    if (!draft.name.trim()) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("crm_events").insert(payloadFrom(draft));
    setBusy(false);

    if (error) {
      notify(
        error.message.includes("duplicate")
          ? "There is already an event with that short name."
          : error.message,
        "error"
      );
      return;
    }
    setDraft(BLANK);
    setCreating(false);
    notify("Event added.", "success");
    onChanged();
  };

  const saveEdit = async (id: string) => {
    if (!editDraft.name.trim()) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("crm_events").update(payloadFrom(editDraft)).eq("id", id);
    setBusy(false);

    if (error) {
      notify(error.message, "error");
      return;
    }
    setEditingId(null);
    notify("Saved.", "success");
    onChanged();
  };

  /** Exactly one event is the one scans fall through to, so the others clear. */
  const makeActive = async (id: string) => {
    setBusy(true);
    const supabase = createClient();
    const cleared = await supabase.from("crm_events").update({ is_active: false }).neq("id", id);
    if (cleared.error) {
      setBusy(false);
      notify(cleared.error.message, "error");
      return;
    }
    const { error } = await supabase.from("crm_events").update({ is_active: true }).eq("id", id);
    setBusy(false);

    if (error) {
      notify(error.message, "error");
      return;
    }
    notify("New scans will be filed under this event.", "success");
    onChanged();
  };

  const standDown = async (id: string) => {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("crm_events").update({ is_active: false }).eq("id", id);
    setBusy(false);
    if (error) {
      notify(error.message, "error");
      return;
    }
    notify("No event is active. New scans will not be filed under one.", "success");
    onChanged();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs text-zinc-500 leading-relaxed max-w-2xl">
          Set one event active on the morning of the show. Any scan on a code that does not name an
          event is filed under it, which is what makes the numbers below mean something a year later.
        </p>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="btn-glass px-4 min-h-[44px] sm:min-h-[36px] text-xs font-semibold rounded-full shrink-0 self-start"
        >
          {creating ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {creating ? "Cancel" : "New event"}
        </button>
      </div>

      {creating && (
        <div className="glass-panel rounded-2xl border-white/8 p-4 sm:p-5 space-y-3">
          <EventForm value={draft} onChange={setDraft} />
          <button
            type="button"
            onClick={() => void createEvent()}
            disabled={busy || !draft.name.trim()}
            className="btn-primary px-4 min-h-[44px] sm:min-h-[36px] text-xs rounded-full disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Add event
          </button>
        </div>
      )}

      {events.length === 0 && !creating ? (
        <EmptyEvents onStart={() => setCreating(true)} />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {events.map((event) => {
            const row = statsById[event.id];
            const isEditing = editingId === event.id;
            const conversion = row ? ratePct(row.contacts, row.scans) : null;

            return (
              <div
                key={event.id}
                className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${
                  event.is_active ? "border-emerald-500/25 bg-emerald-500/[0.03]" : "border-white/8 bg-zinc-950/40"
                }`}
              >
                {isEditing ? (
                  <>
                    <EventForm value={editDraft} onChange={setEditDraft} />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void saveEdit(event.id)}
                        disabled={busy}
                        className="btn-primary px-4 min-h-[44px] sm:min-h-[36px] text-xs rounded-full disabled:opacity-50"
                      >
                        {busy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="btn-ghost px-4 min-h-[44px] sm:min-h-[36px] text-xs rounded-full"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-white break-words">{event.name}</h3>
                        <p className="text-[11px] text-zinc-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                          {(event.starts_on || event.ends_on) && (
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="w-3 h-3 shrink-0" />
                              {[formatDate(event.starts_on), formatDate(event.ends_on)]
                                .filter(Boolean)
                                .join(" to ")}
                            </span>
                          )}
                          {(event.venue || event.city || event.country) && (
                            <span className="inline-flex items-center gap-1 min-w-0">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="break-words">
                                {[event.venue, event.city, event.country].filter(Boolean).join(", ")}
                              </span>
                            </span>
                          )}
                        </p>
                      </div>
                      {event.is_active && (
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Active
                        </span>
                      )}
                    </div>

                    {event.notes && (
                      <p className="text-[11px] text-zinc-500 leading-relaxed break-words">
                        {event.notes}
                      </p>
                    )}

                    {row ? (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <Stat label="Scans" value={row.scans} />
                        <Stat label="People" value={row.unique_scanners} />
                        <Stat label="Contacts" value={row.contacts} />
                        <Stat label="Qualified" value={row.qualified} />
                        <Stat
                          label="Converted"
                          value={conversion === null ? "No scans" : `${conversion}%`}
                        />
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-600">
                        No results recorded against this event yet.
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(event.id);
                          setEditDraft(draftFrom(event));
                        }}
                        className="btn-glass px-4 min-h-[44px] sm:min-h-[36px] text-[11px] font-semibold rounded-full"
                      >
                        Edit
                      </button>
                      {event.is_active ? (
                        <button
                          type="button"
                          onClick={() => void standDown(event.id)}
                          disabled={busy}
                          className="btn-ghost px-4 min-h-[44px] sm:min-h-[36px] text-[11px] font-semibold rounded-full disabled:opacity-50"
                        >
                          Stand down
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void makeActive(event.id)}
                          disabled={busy}
                          className="btn-glass px-4 min-h-[44px] sm:min-h-[36px] text-[11px] font-semibold rounded-full disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Set active
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function EventForm({
  value,
  onChange,
}: {
  value: EventDraft;
  onChange: (next: EventDraft) => void;
}) {
  const set = (patch: Partial<EventDraft>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Name">
          <input
            value={value.name}
            onChange={(e) =>
              set({
                name: e.target.value,
                // The short name follows the title until somebody edits it,
                // and then it stops moving under them.
                slug: value.slug && value.slug !== slugify(value.name) ? value.slug : slugify(e.target.value),
              })
            }
            placeholder="Northern Screen Summit"
            className="admin-input h-11 sm:h-9 py-0"
          />
        </Field>
        <Field label="Short name">
          <input
            value={value.slug}
            onChange={(e) => set({ slug: slugify(e.target.value) })}
            placeholder="northern-screen-summit"
            className="admin-input h-11 sm:h-9 py-0 font-mono"
          />
        </Field>
        <Field label="Venue">
          <input
            value={value.venue}
            onChange={(e) => set({ venue: e.target.value })}
            className="admin-input h-11 sm:h-9 py-0"
          />
        </Field>
        <Field label="City">
          <input
            value={value.city}
            onChange={(e) => set({ city: e.target.value })}
            className="admin-input h-11 sm:h-9 py-0"
          />
        </Field>
        <Field label="Country">
          <input
            value={value.country}
            onChange={(e) => set({ country: e.target.value })}
            className="admin-input h-11 sm:h-9 py-0"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Starts">
            <input
              type="date"
              value={value.starts_on}
              onChange={(e) => set({ starts_on: e.target.value })}
              className="admin-input h-11 sm:h-9 py-0"
            />
          </Field>
          <Field label="Ends">
            <input
              type="date"
              value={value.ends_on}
              onChange={(e) => set({ ends_on: e.target.value })}
              className="admin-input h-11 sm:h-9 py-0"
            />
          </Field>
        </div>
      </div>
      <Field label="Notes">
        <textarea
          rows={2}
          value={value.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Stand number, who else is going, what you are there for."
          className="admin-input resize-y leading-relaxed"
        />
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2">
      <span className="block text-xs uppercase font-bold tracking-widest text-gray-400 font-sans">
        {label}
      </span>
      <span className="block text-lg leading-snug text-white tabular-nums mt-0.5 truncate">{value}</span>
    </div>
  );
}

function EmptyEvents({ onStart }: { onStart: () => void }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-zinc-950/40 p-8 sm:p-10 text-center">
      <CalendarDays className="w-6 h-6 text-zinc-600 mx-auto" />
      <h3 className="text-sm font-semibold text-white mt-3">No events yet</h3>
      <p className="text-xs text-zinc-500 leading-relaxed mt-2 max-w-md mx-auto">
        Add the next conference before you go. Set it active on the morning and every scan that day
        gets filed under it without you doing anything else.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="btn-primary px-5 min-h-[44px] text-xs rounded-full mt-5"
      >
        <Plus className="w-3.5 h-3.5" />
        Add your first event
      </button>
    </div>
  );
}
