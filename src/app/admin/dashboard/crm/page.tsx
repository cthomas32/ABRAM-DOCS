"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarDays,
  Contact as ContactIcon,
  Download,
  FileDown,
  IdCard,
  Loader2,
  Mail,
  QrCode as QrIcon,
  RefreshCw,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  CRM_PRIORITIES,
  CRM_STAGES,
  OPEN_STAGE_IDS,
  stageSpec,
  type CrmPriority,
  type CrmStage,
  type InteractionKind,
} from "@/lib/crm/constants";
import type { TeamMemberIdentity } from "@/lib/crm/identity";
import type {
  CrmCaptureCode,
  CrmContact,
  CrmEvent,
  CrmProfile,
  CrmTask,
} from "@/lib/crm/types";
import { buildContactVCardBundle } from "@/lib/crm/vcard";
import PipelineBoard from "./PipelineBoard";
import ContactDrawer from "./ContactDrawer";
import { StatRow } from "@/components/admin/StatTile";
import Panel from "@/components/admin/Panel";
import EventsTab from "./EventsTab";
import CodesTab from "./CodesTab";
import ProfileTab from "./ProfileTab";
import {
  contactsToCsv,
  downloadFile,
  isDueOrOverdue,
  ratePct,
  stampedFilename,
  type EventStatRow,
  type Notify,
} from "./lib";

/**
 * Conference contacts.
 *
 * The pipeline is the default view because it is the only one that answers
 * the question anybody actually has after an event, which is who has not
 * been replied to yet. Events, codes and the card itself are the setup that
 * happens once, so they sit behind tabs.
 *
 * Every number in the header comes out of the tables. Where one cannot be
 * worked out, because nobody has scanned anything yet, it says so rather
 * than showing a zero that reads like a result.
 */

type Tab = "pipeline" | "events" | "codes" | "card";

interface Toast {
  id: string;
  message: string;
  tone: "success" | "error";
}

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "pipeline", label: "Pipeline", icon: ContactIcon },
  { id: "events", label: "Events", icon: CalendarDays },
  { id: "codes", label: "Codes", icon: QrIcon },
  { id: "card", label: "Your card", icon: IdCard },
];

/**
 * The shared record off an embedded read.
 *
 * The generated client types a joined relation as an array whether it is a
 * to-one or not, and a database that has never had the link returns nothing
 * at all. Both come back as null, because an inherited job title is a
 * nicety and no shape of answer here is worth an exception.
 */
function readMember(data: unknown): TeamMemberIdentity | null {
  const rows = Array.isArray(data) ? data : [];
  const first = rows[0] as { member?: unknown } | undefined;
  const member = first?.member;
  const record = Array.isArray(member) ? member[0] : member;
  return record && typeof record === "object" ? (record as TeamMemberIdentity) : null;
}

export default function CrmPage() {
  const [tab, setTab] = useState<Tab>("pipeline");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const [profile, setProfile] = useState<CrmProfile | null>(null);
  /**
   * The shared record the card borrows from. Name, job title, photograph
   * and city live once in the team screen, and anything left blank on the
   * card falls through to them. Read separately from the card rather than
   * as a join, so a missing table or a tightened policy costs the console
   * an inherited value rather than the whole screen.
   */
  const [member, setMember] = useState<TeamMemberIdentity | null>(null);
  const [events, setEvents] = useState<CrmEvent[]>([]);
  const [eventStats, setEventStats] = useState<EventStatRow[]>([]);
  const [codes, setCodes] = useState<CrmCaptureCode[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [openTasks, setOpenTasks] = useState<CrmTask[]>([]);
  const [scanTotals, setScanTotals] = useState<{ scans: number; converted: number } | null>(null);
  const [author, setAuthor] = useState<string | null>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stageBusyId, setStageBusyId] = useState<string | null>(null);

  /* Filters */
  const [query, setQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [needsFollowUp, setNeedsFollowUp] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const notify = useCallback<Notify>((message, tone) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  /* Which tab to arrive on.
     The designer and the print sheet are pages of their own now, and coming
     back from one should land where you left rather than on the pipeline.
     Read once on arrival. The strip itself stays a click rather than a
     navigation, so nothing writes back here. */
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("tab");
    if (wanted && TABS.some((option) => option.id === wanted)) setTab(wanted as Tab);
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Load                                                             */
  /* ---------------------------------------------------------------- */

  const load = useCallback(async () => {
    setRefreshing(true);
    const supabase = createClient();

    try {
      const [
        profileRes,
        eventsRes,
        codesRes,
        contactsRes,
        tasksRes,
        statsRes,
        scansRes,
        convertedRes,
        identityRes,
        userRes,
      ] = await Promise.all([
        supabase.from("crm_profiles").select("*").order("created_at").limit(1),
        supabase.from("crm_events").select("*").order("starts_on", { ascending: false, nullsFirst: false }),
        supabase.from("crm_capture_codes").select("*").order("created_at", { ascending: false }),
        supabase.from("crm_contacts").select("*").order("met_at", { ascending: false }).limit(2000),
        supabase.from("crm_tasks").select("*").eq("status", "open"),
        supabase.from("crm_event_stats").select("*"),
        supabase.from("crm_scans").select("id", { count: "exact", head: true }).eq("is_bot", false),
        supabase
          .from("crm_scans")
          .select("id", { count: "exact", head: true })
          .eq("is_bot", false)
          .eq("converted", true),
        supabase
          .from("crm_profiles")
          .select(
            "id, member:team_members(full_name, job_title, photo_url, short_bio, email, linkedin_url, x_url, website, location)"
          )
          .order("created_at")
          .limit(1),
        supabase.auth.getUser(),
      ]);

      const firstError =
        profileRes.error || eventsRes.error || codesRes.error || contactsRes.error || tasksRes.error;
      setWarning(firstError ? firstError.message : null);

      setProfile(((profileRes.data as CrmProfile[] | null) ?? [])[0] ?? null);
      // Inheriting a job title is a nicety. Failing to read it is not worth
      // an alarm, and never worth taking the console down with it.
      setMember(identityRes.error ? null : readMember(identityRes.data));
      setEvents((eventsRes.data as CrmEvent[] | null) ?? []);
      setCodes((codesRes.data as CrmCaptureCode[] | null) ?? []);
      setContacts((contactsRes.data as CrmContact[] | null) ?? []);
      setOpenTasks((tasksRes.data as CrmTask[] | null) ?? []);
      // The rollup view is a convenience. If it is unreadable the rest of the
      // console still works, so its failure is not worth an alarm.
      setEventStats(statsRes.error ? [] : ((statsRes.data as EventStatRow[] | null) ?? []));
      setScanTotals(
        scansRes.error || convertedRes.error
          ? null
          : { scans: scansRes.count ?? 0, converted: convertedRes.count ?? 0 }
      );
      setAuthor(userRes.data.user?.email ?? null);
    } catch (error) {
      setWarning(error instanceof Error ? error.message : "Unable to read the contact tables.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /* ---------------------------------------------------------------- */
  /*  Derived                                                          */
  /* ---------------------------------------------------------------- */

  const eventNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const event of events) map[event.id] = event.name;
    return map;
  }, [events]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const contact of contacts) for (const tag of contact.tags) set.add(tag);
    return [...set].sort();
  }, [contacts]);

  /** Contacts with an open task due today or already past. */
  const contactsWithDueTask = useMemo(() => {
    const set = new Set<string>();
    for (const task of openTasks) {
      if (isDueOrOverdue(task.due_at)) set.add(task.contact_id);
    }
    return set;
  }, [openTasks]);

  const live = useMemo(() => contacts.filter((c) => !c.archived), [contacts]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return contacts.filter((contact) => {
      if (contact.archived !== showArchived) return false;
      if (eventFilter && contact.event_id !== eventFilter) return false;
      if (stageFilter && contact.stage !== stageFilter) return false;
      if (priorityFilter && contact.priority !== priorityFilter) return false;
      if (tagFilter && !contact.tags.includes(tagFilter)) return false;
      if (needsFollowUp) {
        const due = isDueOrOverdue(contact.next_follow_up_at) || contactsWithDueTask.has(contact.id);
        if (!due) return false;
      }
      if (needle) {
        const haystack = [contact.full_name, contact.company, contact.email]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [
    contacts,
    showArchived,
    eventFilter,
    stageFilter,
    priorityFilter,
    tagFilter,
    needsFollowUp,
    query,
    contactsWithDueTask,
  ]);

  const dueCount = useMemo(() => {
    const set = new Set(contactsWithDueTask);
    for (const contact of live) {
      if (isDueOrOverdue(contact.next_follow_up_at)) set.add(contact.id);
    }
    // A follow up on an archived contact is not a follow up any more.
    const liveIds = new Set(live.map((c) => c.id));
    return [...set].filter((id) => liveIds.has(id)).length;
  }, [contactsWithDueTask, live]);

  const openCount = useMemo(
    () => live.filter((c) => OPEN_STAGE_IDS.includes(c.stage)).length,
    [live]
  );

  const conversion = scanTotals ? ratePct(scanTotals.converted, scanTotals.scans) : null;

  const selected = useMemo(
    () => contacts.find((c) => c.id === selectedId) ?? null,
    [contacts, selectedId]
  );

  /**
   * Capture mode is told which card it is filing under, so a phone that has
   * never been online there still has an answer before the first save.
   */
  const captureHref = profile
    ? `/admin/dashboard/crm/capture?p=${encodeURIComponent(profile.slug)}`
    : "/admin/dashboard/crm/capture";

  const filtersActive =
    Boolean(query || eventFilter || stageFilter || priorityFilter || tagFilter) ||
    needsFollowUp ||
    showArchived;

  const clearFilters = () => {
    setQuery("");
    setEventFilter("");
    setStageFilter("");
    setPriorityFilter("");
    setTagFilter("");
    setNeedsFollowUp(false);
    setShowArchived(false);
  };

  /* ---------------------------------------------------------------- */
  /*  Stage moves                                                      */
  /* ---------------------------------------------------------------- */

  /**
   * Moving somebody writes three rows, not one.
   *
   * The stage on the contact is what the board reads. The stage change row
   * is what makes the funnel measurable later without parsing free text.
   * The interaction is what puts the move on the person's timeline next to
   * the notes, so the story of a lead reads in one column.
   */
  const moveStage = useCallback(
    async (contact: CrmContact, next: CrmStage) => {
      if (contact.stage === next) return;
      setStageBusyId(contact.id);
      const supabase = createClient();
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("crm_contacts")
        .update({ stage: next, last_activity_at: now })
        .eq("id", contact.id)
        .select("*")
        .single();

      if (error || !data) {
        notify(error?.message || "That move did not save.", "error");
        setStageBusyId(null);
        return;
      }

      const from = contact.stage;
      const [changeRes, timelineRes] = await Promise.all([
        supabase
          .from("crm_stage_changes")
          .insert({ contact_id: contact.id, from_stage: from, to_stage: next }),
        supabase.from("crm_interactions").insert({
          contact_id: contact.id,
          kind: "stage_change" satisfies InteractionKind,
          body: `${stageSpec(from).label} to ${stageSpec(next).label}`,
          meta: { from, to: next },
          occurred_at: now,
          author,
        }),
      ]);

      if (changeRes.error || timelineRes.error) {
        notify(
          "The stage moved, but the history did not record it. Try refreshing before the next move.",
          "error"
        );
      }

      setContacts((prev) => prev.map((c) => (c.id === data.id ? (data as CrmContact) : c)));
      setStageBusyId(null);
    },
    [author, notify]
  );

  const handleContactChanged = useCallback((updated: CrmContact) => {
    setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Export                                                           */
  /* ---------------------------------------------------------------- */

  const exportCsv = () => {
    if (filtered.length === 0) {
      notify("Nothing in the current filter to export.", "error");
      return;
    }
    downloadFile(
      stampedFilename("contacts", "csv"),
      "text/csv;charset=utf-8",
      contactsToCsv(filtered, eventNameById)
    );
  };

  const exportVcf = () => {
    if (filtered.length === 0) {
      notify("Nothing in the current filter to export.", "error");
      return;
    }
    downloadFile(
      stampedFilename("contacts", "vcf"),
      "text/vcard;charset=utf-8",
      buildContactVCardBundle(filtered, eventNameById)
    );
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-2 text-zinc-500 bg-[#0A0A0A]">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        <span className="text-xs font-medium">Reading your contacts...</span>
      </div>
    );
  }

  const kpis: { label: string; value: string; hint: string }[] = [
    {
      label: "Contacts captured",
      value: live.length.toLocaleString(),
      hint:
        contacts.length > live.length
          ? `${contacts.length - live.length} archived`
          : "Everyone you have met",
    },
    {
      label: "Still open",
      value: openCount.toLocaleString(),
      hint: "Not yet won or closed out",
    },
    {
      label: "Follow ups due",
      value: dueCount.toLocaleString(),
      hint: "Due today or already past",
    },
    {
      label: "Scan to capture",
      value: conversion === null ? "No scans yet" : `${conversion}%`,
      hint:
        scanTotals && scanTotals.scans > 0
          ? `${scanTotals.converted} of ${scanTotals.scans} scans left details`
          : "Nobody has scanned a code yet",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-6 max-w-[100rem] mx-auto pb-16">
        {warning && (
          <Panel
            className="max-w-4xl"
            title="Some of this did not load"
            icon={<AlertTriangle className="w-4 h-4 text-zinc-400" />}
          >
            <span className="break-words">{warning}</span>
          </Panel>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
              <ContactIcon className="w-5 h-5 text-zinc-400 shrink-0" />
              Conference Contacts
            </h1>
            <p className="hidden sm:block text-xs text-zinc-500 mt-1 font-sans max-w-2xl leading-relaxed">
              Everyone who scanned your code or handed you their details, from the hallway to the
              follow up. Capture mode works with the signal off, so a bad hall is not a lost lead.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              href={captureHref}
              className="btn-primary px-4 h-11 sm:h-9 text-xs rounded-full"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Capture mode
            </Link>
            <button
              type="button"
              onClick={() => void load()}
              disabled={refreshing}
              className="btn-glass px-4 h-11 sm:h-9 text-xs font-medium rounded-full disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Updating" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Header stats. One card, four readings, the same object the
            earnings and revenue screens use. */}
        <StatRow
          loading={loading && contacts.length === 0}
          stats={kpis.map((kpi) => ({ label: kpi.label, value: kpi.value, hint: kpi.hint }))}
        />

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/5 pb-3 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full text-[11px] font-medium border transition-colors h-11 sm:h-9 shrink-0 ${
                tab === id
                  ? "bg-white text-black border-white"
                  : "bg-white/[0.03] text-zinc-400 border-white/8 hover:text-zinc-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
          <Link
            href="/admin/dashboard/crm/emails"
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-full text-[11px] font-medium border transition-colors h-11 sm:h-9 shrink-0 bg-white/[0.03] text-zinc-400 border-white/8 hover:text-zinc-200"
          >
            <Mail className="w-3.5 h-3.5" />
            Emails
          </Link>
        </div>

        {tab === "pipeline" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name, company or email"
                    aria-label="Search contacts"
                    className="admin-input h-11 sm:h-9 py-0 pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={exportCsv}
                    className="btn-glass px-4 h-11 sm:h-9 text-[11px] font-semibold rounded-full flex-1 sm:flex-none"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={exportVcf}
                    className="btn-glass px-4 h-11 sm:h-9 text-[11px] font-semibold rounded-full flex-1 sm:flex-none"
                  >
                    <Download className="w-3.5 h-3.5" />
                    vCards
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <select
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  aria-label="Filter by event"
                  className="admin-input h-11 sm:h-9 py-0 cursor-pointer"
                >
                  <option value="">All events</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  aria-label="Filter by stage"
                  className="admin-input h-11 sm:h-9 py-0 cursor-pointer"
                >
                  <option value="">All stages</option>
                  {CRM_STAGES.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.label}
                    </option>
                  ))}
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  aria-label="Filter by priority"
                  className="admin-input h-11 sm:h-9 py-0 cursor-pointer"
                >
                  <option value="">Any priority</option>
                  {CRM_PRIORITIES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  aria-label="Filter by tag"
                  disabled={allTags.length === 0}
                  className="admin-input h-11 sm:h-9 py-0 cursor-pointer disabled:opacity-50"
                >
                  <option value="">{allTags.length ? "Any tag" : "No tags yet"}</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNeedsFollowUp((v) => !v)}
                  aria-pressed={needsFollowUp}
                  className={`px-3.5 min-h-[44px] sm:min-h-[34px] rounded-full text-[11px] font-semibold border transition-colors ${
                    needsFollowUp
                      ? "bg-white text-black border-white"
                      : "bg-white/[0.03] text-zinc-400 border-white/8"
                  }`}
                >
                  Needs follow up
                </button>
                <button
                  type="button"
                  onClick={() => setShowArchived((v) => !v)}
                  aria-pressed={showArchived}
                  className={`px-3.5 min-h-[44px] sm:min-h-[34px] rounded-full text-[11px] font-semibold border transition-colors ${
                    showArchived
                      ? "bg-white text-black border-white"
                      : "bg-white/[0.03] text-zinc-400 border-white/8"
                  }`}
                >
                  Archived
                </button>
                {filtersActive && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="btn-ghost px-3.5 min-h-[44px] sm:min-h-[34px] text-[11px] font-semibold rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                    Clear
                  </button>
                )}
                <span className="text-[11px] text-zinc-600 ml-auto">
                  {filtered.length} of {contacts.length} shown
                </span>
              </div>
            </div>

            <PipelineBoard
              contacts={filtered}
              eventNameById={eventNameById}
              onOpen={(contact) => setSelectedId(contact.id)}
              onMoveStage={(contact, next) => void moveStage(contact, next)}
              busyId={stageBusyId}
              emptyState={
                contacts.length === 0 ? (
                  <FirstRunEmpty
                    hasProfile={Boolean(profile)}
                    hasCode={codes.length > 0}
                    captureHref={captureHref}
                    onGoToCard={() => setTab("card")}
                    onGoToCodes={() => setTab("codes")}
                  />
                ) : (
                  <FilteredEmpty onClear={clearFilters} />
                )
              }
            />
          </div>
        )}

        {tab === "events" && (
          <EventsTab events={events} stats={eventStats} onChanged={() => void load()} notify={notify} />
        )}

        {tab === "codes" && (
          <CodesTab
            profile={profile}
            codes={codes}
            events={events}
            onChanged={() => void load()}
            notify={notify}
          />
        )}

        {tab === "card" && (
          <ProfileTab
            profile={profile}
            member={member}
            codes={codes}
            onChanged={() => void load()}
            onGoToCodes={() => setTab("codes")}
            notify={notify}
          />
        )}
      </div>

      {selected && (
        <ContactDrawer
          contact={selected}
          events={events}
          eventNameById={eventNameById}
          author={author}
          onClose={() => setSelectedId(null)}
          onChanged={handleContactChanged}
          onMoveStage={(contact, next) => void moveStage(contact, next)}
          notify={notify}
        />
      )}

      {/* Toasts */}
      <div className="fixed bottom-5 right-5 z-[70] flex flex-col gap-2 max-w-[calc(100vw-2.5rem)] sm:max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className={`glass-panel rounded-xl px-4 py-3 flex items-start gap-3 border ${
                toast.tone === "error" ? "border-white/25" : "border-white/10"
              }`}
            >
              <p className="text-xs text-zinc-200 leading-relaxed flex-1">{toast.message}</p>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                aria-label="Dismiss"
                className="text-zinc-500 hover:text-zinc-200 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty states                                                       */
/* ------------------------------------------------------------------ */

function FirstRunEmpty({
  hasProfile,
  hasCode,
  captureHref,
  onGoToCard,
  onGoToCodes,
}: {
  hasProfile: boolean;
  hasCode: boolean;
  captureHref: string;
  onGoToCard: () => void;
  onGoToCodes: () => void;
}) {
  const steps = [
    {
      done: hasProfile,
      title: "Fill in your card",
      body: "Job title, email, phone, a link that books a slot. This is what a stranger sees three seconds after scanning.",
      action: (
        <button type="button" onClick={onGoToCard} className="btn-glass px-4 h-11 sm:h-9 text-[11px] font-semibold rounded-full">
          Open your card
        </button>
      ),
    },
    {
      done: hasCode,
      title: "Make a code and print it",
      body: "One per place it will live: the back of your badge, your lock screen, the banner. Each one gets its own scan count.",
      action: (
        <button type="button" onClick={onGoToCodes} className="btn-glass px-4 h-11 sm:h-9 text-[11px] font-semibold rounded-full">
          Open codes
        </button>
      ),
    },
    {
      done: false,
      title: "Meet people",
      body: "They scan and leave their details, or you open capture mode and type for them. It works with the signal fully off.",
      action: (
        <Link href={captureHref} className="btn-glass px-4 h-11 sm:h-9 text-[11px] font-semibold rounded-full">
          Open capture mode
        </Link>
      ),
    },
  ];

  return (
    <div className="rounded-2xl border border-white/8 bg-zinc-950/40 p-6 sm:p-8">
      <div className="text-center max-w-md mx-auto">
        <ContactIcon className="w-6 h-6 text-zinc-600 mx-auto" />
        <h3 className="text-sm font-semibold text-white mt-3">Nobody in the pipeline yet</h3>
        <p className="text-xs text-zinc-500 leading-relaxed mt-2">
          Three things stand between here and a board full of people. None of them take long.
        </p>
      </div>

      <ol className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className={`rounded-xl border p-4 flex flex-col gap-2 ${
              step.done ? "border-emerald-500/20 bg-emerald-500/[0.03]" : "border-white/8 bg-white/[0.02]"
            }`}
          >
            <span className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 ${
                  step.done ? "bg-emerald-500/20 text-emerald-300" : "bg-white/8 text-zinc-400"
                }`}
              >
                {index + 1}
              </span>
              <span className="text-xs font-semibold text-white">{step.title}</span>
            </span>
            <span className="text-[11px] text-zinc-500 leading-relaxed flex-1">{step.body}</span>
            <span className="pt-1">{step.action}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function FilteredEmpty({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-zinc-950/40 p-8 sm:p-10 text-center">
      <Search className="w-6 h-6 text-zinc-600 mx-auto" />
      <h3 className="text-sm font-semibold text-white mt-3">Nobody matches that</h3>
      <p className="text-xs text-zinc-500 leading-relaxed mt-2 max-w-md mx-auto">
        There are contacts on the board, just none inside the current filters.
      </p>
      <button type="button" onClick={onClear} className="btn-glass px-5 min-h-[44px] text-xs rounded-full mt-5">
        <X className="w-3.5 h-3.5" />
        Clear filters
      </button>
    </div>
  );
}
