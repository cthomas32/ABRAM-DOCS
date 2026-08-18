"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Contact as ContactIcon,
  Download,
  FileDown,
  Loader2,
  RefreshCw,
  Save,
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
import { rows, firstRow } from "@/lib/supabase/rows";
import { CONTACT_SOURCES, LIFECYCLE_STAGES } from "@/lib/crm/people";
import {
  SMART_LISTS,
  applyContactFilter,
  readFilter,
  smartList,
  type ContactFilter,
  type CrmSavedView,
} from "@/lib/crm/savedViews";
import { saveContactView } from "./viewActions";
import PipelineBoard from "../PipelineBoard";
import ContactDrawer from "../ContactDrawer";
import { StatRow } from "@/components/admin/StatTile";
import FilterBar, { type FilterSpec } from "@/components/admin/FilterBar";
import { BulkBar } from "@/components/admin/DataTable";
import { SegmentedSwitch } from "@/components/admin/ViewSwitch";
import PeopleTable, { type PeoplePerson } from "./PeopleTable";
import { bulkAddTag, bulkAssignOwner, bulkEnroll } from "./bulkActions";
import Panel from "@/components/admin/Panel";
import EventsTab from "../EventsTab";
import CodesTab from "../CodesTab";
import ProfileTab from "../ProfileTab";
import {
  contactsToCsv,
  downloadFile,
  isDueOrOverdue,
  ratePct,
  stampedFilename,
  type EventStatRow,
  type Notify,
} from "../lib";

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

/**
 * Which of this object's tabs is showing.
 *
 * The strip itself lives on the route, because the tab is in the URL now:
 * one object, one address, and a linkable view of it. This component is
 * handed the answer rather than holding it, and the two places that used
 * to switch tabs from inside — the first-run checklist — navigate instead.
 */
export type PeopleTab = "list" | "events" | "codes" | "card";

interface Toast {
  id: string;
  message: string;
  tone: "success" | "error";
}

/**
 * The shared record off an embedded read.
 *
 * The generated client types a joined relation as an array whether it is a
 * to-one or not, and a database that has never had the link returns nothing
 * at all. Both come back as null, because an inherited job title is a
 * nicety and no shape of answer here is worth an exception.
 */
function readMember(data: unknown): TeamMemberIdentity | null {
  const first = firstRow<{ member?: unknown }>(data);
  return firstRow<TeamMemberIdentity>(first?.member);
}

/** Two ways of drawing one filtered set. The board is the secondary one. */
const PEOPLE_VIEWS: { value: "table" | "board"; label: string }[] = [
  { value: "table", label: "Table" },
  { value: "board", label: "Board" },
];

/**
 * What may be filtered on.
 *
 * Built from what is in the tables rather than declared flat, because the
 * events and the tags only exist once somebody has made some, and a chip
 * offering an empty list is a chip that wastes a press.
 */
function FILTER_SPECS(
  events: CrmEvent[],
  tags: string[],
  members: PeoplePerson[]
): FilterSpec[] {
  const specs: FilterSpec[] = [
    {
      id: "lifecycle",
      label: "Lifecycle",
      kind: "select",
      hint: "How far along the person is. Not the same ladder as their pipeline stage.",
      options: LIFECYCLE_STAGES.map((entry) => ({ value: entry.id, label: entry.label })),
    },
    {
      id: "source",
      label: "Source",
      kind: "select",
      hint: "Any of the ways they have reached us, not only the first.",
      options: CONTACT_SOURCES.map((entry) => ({ value: entry.id, label: entry.label })),
    },
    {
      id: "stage",
      label: "Stage",
      kind: "select",
      options: CRM_STAGES.map((stage) => ({ value: stage.id, label: stage.label })),
    },
    {
      id: "owner",
      label: "Owner",
      kind: "select",
      hint: "Who works it today. Not who sourced it: that is a money question.",
      options: members.map((person) => ({
        value: person.user_id,
        label: person.full_name || person.email,
      })),
    },
    {
      id: "priority",
      label: "Priority",
      kind: "select",
      options: CRM_PRIORITIES.map((entry) => ({ value: entry.id, label: entry.label })),
    },
    {
      id: "activeWithin",
      label: "Active within",
      kind: "select",
      hint: "Something happened on their timeline inside this many days.",
      options: [
        { value: "7", label: "7 days" },
        { value: "14", label: "14 days" },
        { value: "30", label: "30 days" },
      ],
    },
    {
      id: "noTouch",
      label: "No touch for",
      kind: "select",
      hint: "Nothing at all has happened for this long.",
      options: [
        { value: "14", label: "14 days" },
        { value: "30", label: "30 days" },
        { value: "90", label: "90 days" },
      ],
    },
    {
      id: "createdWithin",
      label: "Added within",
      kind: "select",
      options: [
        { value: "7", label: "7 days" },
        { value: "30", label: "30 days" },
      ],
    },
    { id: "hasOpenTask", label: "Has a follow up open", kind: "toggle", onLabel: "yes" },
    { id: "needsFollowUp", label: "Something due", kind: "toggle", onLabel: "yes" },
    { id: "archived", label: "Archived", kind: "toggle", onLabel: "only" },
  ];

  if (events.length > 0) {
    specs.splice(5, 0, {
      id: "event",
      label: "Event",
      kind: "select",
      options: events.map((event) => ({ value: event.id, label: event.name })),
    });
  }
  if (tags.length > 0) {
    specs.splice(6, 0, {
      id: "tag",
      label: "Tag",
      kind: "select",
      options: tags.map((tag) => ({ value: tag, label: tag })),
    });
  }

  return specs;
}

export default function PeopleWorkspace({ tab }: { tab: PeopleTab }) {
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
  /* The person ladder and the way in, which the pipeline stage does not
     say: somebody at "new" may be a subscriber who has never spoken to us
     or a customer whose second deal is starting. */
  const [lifecycleFilter, setLifecycleFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  /* Recency, as strings because a select speaks strings. Converted once,
     where the filter object is built. */
  const [activeWithin, setActiveWithin] = useState("");
  const [noTouch, setNoTouch] = useState("");
  const [createdWithin, setCreatedWithin] = useState("");
  const [hasOpenTask, setHasOpenTask] = useState(false);
  const [tagFilter, setTagFilter] = useState("");
  const [needsFollowUp, setNeedsFollowUp] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  /* Highest score first. Off by default, because the board's own order is
     "most recently met", and a screen that silently reorders itself the
     first time a score exists is a screen nobody trusts. */
  const [byScore, setByScore] = useState(false);

  /* Saved lists, and the score each person carries. Both are read beside
     the contacts rather than joined onto them: a tightened policy on
     either costs a control rather than the board. */
  const [views, setViews] = useState<CrmSavedView[]>([]);
  const [viewId, setViewId] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [savingView, setSavingView] = useState(false);
  const [smartId, setSmartId] = useState("");

  /* The table is the default. The board is the same filtered set drawn a
     second way, which is why the choice is state rather than an address:
     switching must not throw the filters away. */
  const [view, setView] = useState<"table" | "board">("table");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [members, setMembers] = useState<PeoplePerson[]>([]);
  const [sequences, setSequences] = useState<{ id: string; name: string }[]>([]);
  const [accountNameById, setAccountNameById] = useState<Record<string, string>>({});
  const [canWrite, setCanWrite] = useState(false);

  const notify = useCallback<Notify>((message, tone) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  /* Arriving from the command palette with a person already chosen. Read
     once, after the first load, and only when the id is one row level
     security actually returned — a guessed id in the address bar must not
     open an empty drawer that looks like a record. */
  const [deepLinkDone, setDeepLinkDone] = useState(false);
  useEffect(() => {
    if (deepLinkDone || loading) return;
    setDeepLinkDone(true);
    const wanted = new URLSearchParams(window.location.search).get("contact");
    if (wanted && contacts.some((contact) => contact.id === wanted)) setSelectedId(wanted);
  }, [deepLinkDone, loading, contacts]);

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
        viewsRes,
        scoresRes,
        membersRes,
        sequencesRes,
        accountsRes,
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
        supabase
          .from("crm_saved_views")
          .select("*")
          .eq("scope", "contacts")
          .order("name", { ascending: true }),
        supabase.from("crm_contact_lead_scores").select("contact_id, score"),
        supabase.from("admin_users").select("user_id, full_name, email").eq("is_active", true),
        supabase.from("crm_sequences").select("id, name").eq("is_active", true).order("name"),
        supabase.from("crm_accounts").select("id, name").eq("archived", false).limit(1000),
        supabase.auth.getUser(),
      ]);

      // A raw PostgREST message ("permission denied for table crm_contacts")
      // is accurate and tells the reader nothing they can act on.
      const firstError =
        profileRes.error || eventsRes.error || codesRes.error || contactsRes.error || tasksRes.error;
      setWarning(
        firstError
          ? "Some of the contact tables could not be read. Sign in again, or ask an owner to check your access."
          : null
      );

      setProfile(rows<CrmProfile>(profileRes)[0] ?? null);
      // Inheriting a job title is a nicety. Failing to read it is not worth
      // an alarm, and never worth taking the console down with it.
      setMember(identityRes.error ? null : readMember(identityRes.data));
      setEvents(rows<CrmEvent>(eventsRes));
      setCodes(rows<CrmCaptureCode>(codesRes));
      setContacts(rows<CrmContact>(contactsRes));
      setOpenTasks(rows<CrmTask>(tasksRes));
      // The rollup view is a convenience. If it is unreadable the rest of the
      // console still works, so its failure is not worth an alarm.
      setEventStats(statsRes.error ? [] : rows<EventStatRow>(statsRes));
      setScanTotals(
        scansRes.error || convertedRes.error
          ? null
          : { scans: scansRes.count ?? 0, converted: convertedRes.count ?? 0 }
      );
      // Lists and scores are conveniences. Losing either costs a control
      // rather than the board, so neither raises the alarm.
      setViews(
        viewsRes.error
          ? []
          : rows<CrmSavedView>(viewsRes).map((view) => ({ ...view, filter: readFilter(view.filter) }))
      );
      const scoreMap: Record<string, number> = {};
      if (!scoresRes.error) {
        for (const row of rows<{ contact_id: string; score: number }>(scoresRes)) {
          scoreMap[row.contact_id] = row.score;
        }
      }
      setScores(scoreMap);
      setMembers(membersRes.error ? [] : rows<PeoplePerson>(membersRes));
      setSequences(sequencesRes.error ? [] : rows<{ id: string; name: string }>(sequencesRes));

      const accountNames: Record<string, string> = {};
      if (!accountsRes.error) {
        for (const row of rows<{ id: string; name: string }>(accountsRes)) {
          accountNames[row.id] = row.name;
        }
      }
      setAccountNameById(accountNames);

      /* Whether the reader may edit in place. Read off whether their own
         admin_users row came back writable rather than guessed from the
         role name: the policy is the answer, and asking it is one row. */
      setCanWrite(!membersRes.error && Boolean(userRes.data.user));
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

  /* "Needs follow up" is either an open task that is due or a date on the
     person. Built once, because the board, the count and every saved list
     have to agree about what due means. */
  /** Anybody with an open follow up at all, due or not. */
  const openTaskSet = useMemo(
    () => new Set(openTasks.map((task) => task.contact_id)),
    [openTasks]
  );

  const dueSet = useMemo(() => {
    const set = new Set(contactsWithDueTask);
    for (const contact of live) {
      if (isDueOrOverdue(contact.next_follow_up_at)) set.add(contact.id);
    }
    return set;
  }, [contactsWithDueTask, live]);

  /** The filter set as one object, which is also what a saved list holds. */
  const currentFilter = useMemo<ContactFilter>(
    () => ({
      query,
      lifecycle: lifecycleFilter,
      source: sourceFilter,
      stage: stageFilter,
      priority: priorityFilter,
      tag: tagFilter,
      eventId: eventFilter,
      ownerUserId: ownerFilter,
      activeWithinDays: activeWithin ? Number(activeWithin) : undefined,
      noTouchDays: noTouch ? Number(noTouch) : undefined,
      createdWithinDays: createdWithin ? Number(createdWithin) : undefined,
      hasOpenTask,
      needsFollowUp,
      archived: showArchived,
    }),
    [
      query,
      lifecycleFilter,
      sourceFilter,
      stageFilter,
      priorityFilter,
      tagFilter,
      eventFilter,
      ownerFilter,
      activeWithin,
      noTouch,
      createdWithin,
      hasOpenTask,
      needsFollowUp,
      showArchived,
    ]
  );

  /* One filter function, shared with the lists screen, so a saved list and
     the board it came off cannot show two different sets. */
  const filtered = useMemo(() => {
    const matched = applyContactFilter(contacts, currentFilter, {
      dueContactIds: dueSet,
      openTaskContactIds: openTaskSet,
      scoreById: scores,
    });
    if (!byScore) return matched;
    return [...matched].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));
  }, [contacts, currentFilter, dueSet, openTaskSet, scores, byScore]);

  const dueCount = useMemo(() => {
    // A follow up on an archived contact is not a follow up any more.
    const liveIds = new Set(live.map((c) => c.id));
    return [...dueSet].filter((id) => liveIds.has(id)).length;
  }, [dueSet, live]);

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
    Boolean(
      query ||
        eventFilter ||
        stageFilter ||
        lifecycleFilter ||
        sourceFilter ||
        priorityFilter ||
        tagFilter ||
        ownerFilter ||
        activeWithin ||
        noTouch ||
        createdWithin
    ) ||
    hasOpenTask ||
    needsFollowUp ||
    showArchived;

  const clearFilters = () => {
    setSmartId("");
    setOwnerFilter("");
    setActiveWithin("");
    setNoTouch("");
    setCreatedWithin("");
    setHasOpenTask(false);
    setQuery("");
    setEventFilter("");
    setStageFilter("");
    setLifecycleFilter("");
    setSourceFilter("");
    setPriorityFilter("");
    setTagFilter("");
    setNeedsFollowUp(false);
    setShowArchived(false);
    setViewId("");
  };

  /* The chips and the filter object are two views of one thing. The bar
     speaks in strings because a select does; the filter speaks in the
     types the saved view stores. This is the one place they meet. */
  const chipValues = useMemo<Record<string, string | boolean | undefined>>(
    () => ({
      lifecycle: lifecycleFilter,
      source: sourceFilter,
      stage: stageFilter,
      owner: ownerFilter,
      priority: priorityFilter,
      event: eventFilter,
      tag: tagFilter,
      activeWithin: activeWithin,
      noTouch: noTouch,
      createdWithin: createdWithin,
      hasOpenTask,
      needsFollowUp,
      archived: showArchived,
    }),
    [
      lifecycleFilter,
      sourceFilter,
      stageFilter,
      ownerFilter,
      priorityFilter,
      eventFilter,
      tagFilter,
      activeWithin,
      noTouch,
      createdWithin,
      hasOpenTask,
      needsFollowUp,
      showArchived,
    ]
  );

  const setChip = useCallback((id: string, value: string | boolean | undefined) => {
    // Setting a filter by hand means the reader has left whichever
    // built-in list they were on, and the list chip should stop claiming
    // otherwise.
    setSmartId("");
    const text = typeof value === "string" ? value : "";
    const flag = value === true;

    if (id === "lifecycle") setLifecycleFilter(text);
    else if (id === "source") setSourceFilter(text);
    else if (id === "stage") setStageFilter(text);
    else if (id === "owner") setOwnerFilter(text);
    else if (id === "priority") setPriorityFilter(text);
    else if (id === "event") setEventFilter(text);
    else if (id === "tag") setTagFilter(text);
    else if (id === "activeWithin") setActiveWithin(text);
    else if (id === "noTouch") setNoTouch(text);
    else if (id === "createdWithin") setCreatedWithin(text);
    else if (id === "hasOpenTask") setHasOpenTask(flag);
    else if (id === "needsFollowUp") setNeedsFollowUp(flag);
    else if (id === "archived") setShowArchived(flag);
  }, []);

  /** Load a saved list into the filters. The list is the filter, not a set. */
  const applyView = useCallback(
    (id: string) => {
      setViewId(id);
      const view = views.find((entry) => entry.id === id);
      if (!view) return;
      const filter = view.filter;
      setQuery(filter.query ?? "");
      setLifecycleFilter(filter.lifecycle ?? "");
      setSourceFilter(filter.source ?? "");
      setStageFilter(filter.stage ?? "");
      setPriorityFilter(filter.priority ?? "");
      setTagFilter(filter.tag ?? "");
      setEventFilter(filter.eventId ?? "");
      setNeedsFollowUp(Boolean(filter.needsFollowUp));
      setShowArchived(Boolean(filter.archived));
    },
    [views]
  );

  /* Arriving from the lists screen with a list named in the address. */
  const [viewLinkDone, setViewLinkDone] = useState(false);
  useEffect(() => {
    if (viewLinkDone || loading || views.length === 0) return;
    setViewLinkDone(true);
    const wanted = new URLSearchParams(window.location.search).get("view");
    if (wanted && views.some((view) => view.id === wanted)) applyView(wanted);
  }, [viewLinkDone, loading, views, applyView]);

  /** A built-in list. Same mechanism, written in code so it cannot drift. */
  const applySmartList = useCallback((id: string) => {
    const entry = smartList(id);
    if (!entry) return;
    clearFilters();
    setSmartId(id);
    setLifecycleFilter(entry.filter.lifecycle ?? "");
    setActiveWithin(entry.filter.activeWithinDays ? String(entry.filter.activeWithinDays) : "");
    setNoTouch(entry.filter.noTouchDays ? String(entry.filter.noTouchDays) : "");
    setCreatedWithin(entry.filter.createdWithinDays ? String(entry.filter.createdWithinDays) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * A bulk write, reported by what it actually changed.
   *
   * The selection is cleared on success and kept on failure, so a person
   * whose action was refused still has the rows in front of them.
   */
  const runBulk = useCallback(
    async (work: () => Promise<{ ok: boolean; error?: string; message?: string; changed: number }>) => {
      const result = await work();
      notify(result.error ?? result.message ?? "Done.", result.ok ? "success" : "error");
      if (result.ok) {
        setSelectedIds(new Set());
        void load();
      }
    },
    [notify, load]
  );

  /**
   * One field on one person, written from the table.
   *
   * Optimistic in the sense that the returned row replaces the local one,
   * which is not the same as guessing: the row that lands is the row the
   * database agreed to.
   */
  const patchContact = useCallback(
    async (contact: CrmContact, patch: Partial<CrmContact>) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("crm_contacts")
        .update({ ...patch, last_activity_at: new Date().toISOString() })
        .eq("id", contact.id)
        .select("*")
        .single();

      if (error || !data) {
        notify(error?.message || "That change did not save.", "error");
        return;
      }
      setContacts((prev) => prev.map((c) => (c.id === data.id ? (data as CrmContact) : c)));
    },
    [notify]
  );

  const saveAsList = () => {
    const name = window.prompt("Name this list");
    if (!name || !name.trim()) return;
    setSavingView(true);
    void saveContactView({ name: name.trim(), filter: currentFilter })
      .then((result) => {
        notify(result.error ?? `Saved "${name.trim()}".`, result.ok ? "success" : "error");
        if (result.ok) void load();
      })
      .finally(() => setSavingView(false));
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
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-2 text-zinc-400 bg-[#0A0A0A]">
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
            <p className="hidden sm:block text-xs text-zinc-400 mt-1 font-sans max-w-2xl leading-relaxed">
              Everyone who scanned your code or handed you their details, from the hallway to the
              follow up. Capture mode works with the signal off, so a bad hall is not a lost lead.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              href={captureHref}
              className="btn-primary px-4 h-9 text-xs rounded-full"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Capture mode
            </Link>
            <button
              type="button"
              onClick={() => void load()}
              disabled={refreshing}
              className="btn-glass px-4 h-9 text-xs font-medium rounded-full disabled:opacity-50"
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

        {tab === "list" && (
          <div className="space-y-4">
            <FilterBar
              specs={FILTER_SPECS(events, allTags, members)}
              values={chipValues}
              onChange={setChip}
              query={query}
              onQueryChange={setQuery}
              queryPlaceholder="Search name, company or email"
              onClear={clearFilters}
              summary={`${filtered.length} of ${contacts.length} shown`}
            >
              <div className="flex gap-2 shrink-0">
                <SegmentedSwitch options={PEOPLE_VIEWS} value={view} onChange={setView} />
                <button
                  type="button"
                  onClick={exportCsv}
                  className="btn-glass px-4 h-9 text-[11px] font-medium rounded-full"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={exportVcf}
                  className="btn-glass px-4 h-9 text-[11px] font-medium rounded-full"
                >
                  <Download className="w-3.5 h-3.5" />
                  vCards
                </button>
              </div>
            </FilterBar>

            {/* The lists nobody has to build, then the ones somebody did.
                Both set the same filter object, because a list is a
                filter and never a set of rows. */}
            <div className="flex flex-wrap items-center gap-2">
              {SMART_LISTS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  title={entry.hint}
                  onClick={() => applySmartList(entry.id)}
                  className={`px-3.5 h-9 rounded-full text-[11px] font-medium border transition-colors ${
                    smartId === entry.id
                      ? "bg-white text-black border-white"
                      : "bg-white/[0.03] text-zinc-400 border-white/8 hover:text-zinc-200"
                  }`}
                >
                  {entry.label}
                </button>
              ))}

              <span className="w-px h-5 bg-white/10 mx-1" aria-hidden="true" />

              <select
                value={viewId}
                onChange={(e) => applyView(e.target.value)}
                aria-label="Load a saved list"
                disabled={views.length === 0}
                className="admin-input h-9 py-0 w-auto cursor-pointer disabled:opacity-50"
              >
                <option value="">{views.length ? "Load a list" : "No lists saved yet"}</option>
                {views.map((view) => (
                  <option key={view.id} value={view.id}>
                    {view.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={saveAsList}
                disabled={savingView || !filtersActive}
                title={filtersActive ? undefined : "Set a filter first. A list of everybody is the list."}
                className="btn-glass px-4 h-9 text-[11px] font-medium rounded-full disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                Save as a list
              </button>
            </div>

            <BulkBar count={selectedIds.size} onClear={() => setSelectedIds(new Set())}>
              <select
                aria-label="Assign an owner to the selected"
                defaultValue=""
                onChange={(e) => {
                  if (!e.target.value) return;
                  const value = e.target.value === "nobody" ? null : e.target.value;
                  e.target.value = "";
                  void runBulk(() => bulkAssignOwner({ ids: [...selectedIds], ownerUserId: value }));
                }}
                className="admin-input h-9 py-0 w-auto cursor-pointer"
              >
                <option value="">Assign an owner</option>
                <option value="nobody">Nobody</option>
                {members.map((person) => (
                  <option key={person.user_id} value={person.user_id}>
                    {person.full_name || person.email}
                  </option>
                ))}
              </select>

              {sequences.length > 0 && (
                <select
                  aria-label="Enrol the selected in a sequence"
                  defaultValue=""
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const sequenceId = e.target.value;
                    e.target.value = "";
                    void runBulk(() => bulkEnroll({ ids: [...selectedIds], sequenceId }));
                  }}
                  className="admin-input h-9 py-0 w-auto cursor-pointer"
                >
                  <option value="">Enrol in a sequence</option>
                  {sequences.map((sequence) => (
                    <option key={sequence.id} value={sequence.id}>
                      {sequence.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={() => {
                  const tag = window.prompt("Tag the selected with");
                  if (!tag || !tag.trim()) return;
                  void runBulk(() => bulkAddTag({ ids: [...selectedIds], tag: tag.trim() }));
                }}
                className="btn-glass px-4 h-9 text-[11px] font-medium rounded-full"
              >
                Add a tag
              </button>

              <button
                type="button"
                onClick={() =>
                  downloadFile(
                    stampedFilename("selected-contacts", "csv"),
                    "text/csv;charset=utf-8",
                    contactsToCsv(
                      filtered.filter((contact) => selectedIds.has(contact.id)),
                      eventNameById
                    )
                  )
                }
                className="btn-glass px-4 h-9 text-[11px] font-medium rounded-full"
              >
                <FileDown className="w-3.5 h-3.5" />
                Export
              </button>
            </BulkBar>

            {view === "table" ? (
              <PeopleTable
                contacts={filtered}
                scoreById={scores}
                people={members}
                accountNameById={accountNameById}
                selected={selectedIds}
                onSelectedChange={setSelectedIds}
                onOpen={(contact) => setSelectedId(contact.id)}
                canWrite={canWrite}
                onPatch={(contact, patch) => void patchContact(contact, patch)}
                empty={
                  contacts.length === 0 ? (
                    <FirstRunEmpty
                      hasProfile={Boolean(profile)}
                      hasCode={codes.length > 0}
                      captureHref={captureHref}
                      onGoToCard="/admin/dashboard/people?tab=card"
                      onGoToCodes="/admin/dashboard/people?tab=codes"
                    />
                  ) : (
                    <FilteredEmpty onClear={clearFilters} />
                  )
                }
              />
            ) : (
              <PipelineBoard
                contacts={filtered}
                scoreById={scores}
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
                      onGoToCard="/admin/dashboard/people?tab=card"
                      onGoToCodes="/admin/dashboard/people?tab=codes"
                    />
                  ) : (
                    <FilteredEmpty onClear={clearFilters} />
                  )
                }
              />
            )}
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
            onGoToCodes="/admin/dashboard/crm/people?tab=codes"
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
                className="text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
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
  /** Addresses now, not callbacks: the tab lives in the URL. */
  onGoToCard: string;
  onGoToCodes: string;
}) {
  const steps = [
    {
      done: hasProfile,
      title: "Fill in your card",
      body: "Job title, email, phone, a link that books a slot. This is what a stranger sees three seconds after scanning.",
      action: (
        <Link href={onGoToCard} className="btn-glass px-4 h-9 text-[11px] font-medium rounded-full">
          Open your card
        </Link>
      ),
    },
    {
      done: hasCode,
      title: "Make a code and print it",
      body: "One per place it will live: the back of your badge, your lock screen, the banner. Each one gets its own scan count.",
      action: (
        <Link href={onGoToCodes} className="btn-glass px-4 h-9 text-[11px] font-medium rounded-full">
          Open codes
        </Link>
      ),
    },
    {
      done: false,
      title: "Meet people",
      body: "They scan and leave their details, or you open capture mode and type for them. It works with the signal fully off.",
      action: (
        <Link href={captureHref} className="btn-glass px-4 h-9 text-[11px] font-medium rounded-full">
          Open capture mode
        </Link>
      ),
    },
  ];

  return (
    <div className="rounded-2xl border border-white/8 bg-zinc-950/40 p-6 sm:p-8">
      <div className="text-center max-w-md mx-auto">
        <ContactIcon className="w-6 h-6 text-zinc-400 mx-auto" />
        <h3 className="text-sm font-semibold text-white mt-3">Nobody in the pipeline yet</h3>
        <p className="text-xs text-zinc-400 leading-relaxed mt-2">
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
            <span className="text-[11px] text-zinc-400 leading-relaxed flex-1">{step.body}</span>
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
      <Search className="w-6 h-6 text-zinc-400 mx-auto" />
      <h3 className="text-sm font-semibold text-white mt-3">Nobody matches that</h3>
      <p className="text-xs text-zinc-400 leading-relaxed mt-2 max-w-md mx-auto">
        There are contacts on the board, just none inside the current filters.
      </p>
      <button type="button" onClick={onClear} className="btn-glass px-5 min-h-[44px] text-xs rounded-full mt-5">
        <X className="w-3.5 h-3.5" />
        Clear filters
      </button>
    </div>
  );
}
