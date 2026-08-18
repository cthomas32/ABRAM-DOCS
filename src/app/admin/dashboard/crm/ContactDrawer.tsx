"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  ArchiveRestore,
  Check,
  Clock,
  Download,
  Link2,
  Loader2,
  Mail,
  Phone,
  Plus,
  Save,
  StickyNote,
  X,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  CRM_PRIORITIES,
  CRM_STAGES,
  INTERACTION_LABELS,
  stageSpec,
  type CrmPriority,
  type CrmStage,
  type InteractionKind,
} from "@/lib/crm/constants";
import type { CrmContact, CrmEvent, CrmInteraction, CrmTask } from "@/lib/crm/types";
import { buildContactVCard, vcardFilename } from "@/lib/crm/vcard";
import { LIFECYCLE_STAGES, lifecycleSpec, type LifecycleStage } from "@/lib/crm/people";
import { enrollContact } from "@/app/admin/dashboard/sequences/actions";
import { LifecycleChip, SourceChips } from "@/components/admin/PersonChips";
import {
  downloadFile,
  formatDate,
  formatDateTime,
  fromLocalInputValue,
  isOverdue,
  relativeTime,
  toLocalInputValue,
  type Notify,
} from "./lib";

/**
 * Everything known about one person, and every way of acting on it.
 *
 * A drawer rather than a page, because the thing you nearly always want
 * after writing a note is the board again. On a phone it takes the whole
 * screen, since a 440px panel and a 320px viewport is a joke.
 *
 * Nothing here deletes. Archiving hides a contact from the board and keeps
 * the timeline, because the one thing worse than a cluttered pipeline is
 * finding out in a year that you did meet someone and the record is gone.
 */

interface ContactDrawerProps {
  contact: CrmContact;
  events: CrmEvent[];
  eventNameById: Record<string, string>;
  author: string | null;
  onClose: () => void;
  /** Hands the parent the row as it now stands, so the board updates. */
  onChanged: (contact: CrmContact) => void;
  onMoveStage: (contact: CrmContact, next: CrmStage) => void;
  notify: Notify;
}

interface EditableFields {
  full_name: string;
  email: string;
  phone: string;
  company: string;
  job_title: string;
  website: string;
  linkedin_url: string;
  city: string;
  country: string;
  met_context: string;
  notes: string;
  event_id: string;
  account_id: string;
  next_follow_up_at: string;
}

function fieldsFrom(contact: CrmContact): EditableFields {
  return {
    full_name: contact.full_name ?? "",
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    company: contact.company ?? "",
    job_title: contact.job_title ?? "",
    website: contact.website ?? "",
    linkedin_url: contact.linkedin_url ?? "",
    city: contact.city ?? "",
    country: contact.country ?? "",
    met_context: contact.met_context ?? "",
    notes: contact.notes ?? "",
    event_id: contact.event_id ?? "",
    account_id: contact.account_id ?? "",
    next_follow_up_at: toLocalInputValue(contact.next_follow_up_at),
  };
}

export default function ContactDrawer({
  contact,
  events,
  eventNameById,
  author,
  onClose,
  onChanged,
  onMoveStage,
  notify,
}: ContactDrawerProps) {
  const [fields, setFields] = useState<EditableFields>(() => fieldsFrom(contact));
  const [saving, setSaving] = useState(false);
  const [interactions, setInteractions] = useState<CrmInteraction[]>([]);
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [note, setNote] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskSaving, setTaskSaving] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  /**
   * The companies this contact could roll up to. Read in the drawer rather
   * than passed down, because the board does not otherwise need them and a
   * failed read here costs a picker rather than the whole screen.
   */
  const [accounts, setAccounts] = useState<{ id: string; name: string; domain: string | null }[]>([]);
  /**
   * The sequences this person could go on. Read here rather than passed
   * down for the same reason as the accounts: the board does not need
   * them, and a partner with no sequences of their own gets an empty
   * picker instead of a broken screen. Row level security decides which
   * rows come back.
   */
  const [sequences, setSequences] = useState<{ id: string; name: string }[]>([]);
  const [sequenceId, setSequenceId] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  // A different person in the panel means a different form, not a merged one.
  useEffect(() => {
    setFields(fieldsFrom(contact));
  }, [contact.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    const supabase = createClient();
    const [timeline, followUps] = await Promise.all([
      supabase
        .from("crm_interactions")
        .select("*")
        .eq("contact_id", contact.id)
        .order("occurred_at", { ascending: false })
        .limit(200),
      supabase
        .from("crm_tasks")
        .select("*")
        .eq("contact_id", contact.id)
        .order("due_at", { ascending: true, nullsFirst: false }),
    ]);
    setInteractions((timeline.data as CrmInteraction[] | null) ?? []);
    setTasks((followUps.data as CrmTask[] | null) ?? []);
    setLoadingHistory(false);
  }, [contact.id]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("crm_accounts")
        .select("id, name, domain")
        .eq("archived", false)
        .order("name", { ascending: true })
        .limit(500);
      if (!cancelled) setAccounts(data ?? []);

      const { data: sequenceRows } = await supabase
        .from("crm_sequences")
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true })
        .limit(100);
      if (!cancelled) setSequences(sequenceRows ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Writes                                                           */
  /* ---------------------------------------------------------------- */

  const patchContact = useCallback(
    async (patch: Partial<CrmContact>, successMessage?: string) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("crm_contacts")
        .update(patch)
        .eq("id", contact.id)
        .select("*")
        .single();

      if (error || !data) {
        notify(error?.message || "That change did not save.", "error");
        return null;
      }
      onChanged(data as CrmContact);
      if (successMessage) notify(successMessage, "success");
      return data as CrmContact;
    },
    [contact.id, notify, onChanged]
  );

  const saveCore = async () => {
    setSaving(true);
    const updated = await patchContact(
      {
        full_name: fields.full_name.trim() || contact.full_name,
        email: fields.email.trim() || null,
        phone: fields.phone.trim() || null,
        company: fields.company.trim() || null,
        job_title: fields.job_title.trim() || null,
        website: fields.website.trim() || null,
        linkedin_url: fields.linkedin_url.trim() || null,
        city: fields.city.trim() || null,
        country: fields.country.trim() || null,
        met_context: fields.met_context.trim() || null,
        notes: fields.notes.trim() || null,
        event_id: fields.event_id || null,
        account_id: fields.account_id || null,
        next_follow_up_at: fromLocalInputValue(fields.next_follow_up_at),
      },
      "Saved."
    );
    if (updated) setFields(fieldsFrom(updated));
    setSaving(false);
  };

  const addNote = async () => {
    const body = note.trim();
    if (!body) return;
    setNoteSaving(true);
    const supabase = createClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("crm_interactions")
      .insert({
        contact_id: contact.id,
        kind: "note" satisfies InteractionKind,
        body,
        occurred_at: now,
        author,
      })
      .select("*")
      .single();

    if (error || !data) {
      notify(error?.message || "That note did not save.", "error");
      setNoteSaving(false);
      return;
    }

    setInteractions((prev) => [data as CrmInteraction, ...prev]);
    setNote("");
    await patchContact({ last_activity_at: now });
    setNoteSaving(false);
  };

  const addTask = async () => {
    const title = taskTitle.trim();
    if (!title) return;
    setTaskSaving(true);
    const supabase = createClient();
    const dueIso = taskDue ? new Date(`${taskDue}T09:00:00`).toISOString() : null;

    const { data, error } = await supabase
      .from("crm_tasks")
      .insert({
        contact_id: contact.id,
        title,
        due_at: dueIso,
        status: "open",
        priority: contact.priority,
      })
      .select("*")
      .single();

    if (error || !data) {
      notify(error?.message || "That follow up did not save.", "error");
      setTaskSaving(false);
      return;
    }

    await supabase.from("crm_interactions").insert({
      contact_id: contact.id,
      kind: "task_created" satisfies InteractionKind,
      body: title,
      meta: { due_at: dueIso },
      author,
    });

    // The contact's own follow up date tracks the soonest open task, which is
    // what the board badge and the header count both read.
    const patch: Partial<CrmContact> = { last_activity_at: new Date().toISOString() };
    if (dueIso && (!contact.next_follow_up_at || dueIso < contact.next_follow_up_at)) {
      patch.next_follow_up_at = dueIso;
    }
    const updated = await patchContact(patch);
    if (updated) setFields(fieldsFrom(updated));

    setTasks((prev) => [...prev, data as CrmTask]);
    setTaskTitle("");
    setTaskDue("");
    setTaskSaving(false);
    void loadHistory();
  };

  const completeTask = async (task: CrmTask) => {
    setBusyTaskId(task.id);
    const supabase = createClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("crm_tasks")
      .update({ status: "done", completed_at: now })
      .eq("id", task.id)
      .select("*")
      .single();

    if (error || !data) {
      notify(error?.message || "That follow up did not update.", "error");
      setBusyTaskId(null);
      return;
    }

    await supabase.from("crm_interactions").insert({
      contact_id: contact.id,
      kind: "task_done" satisfies InteractionKind,
      body: task.title,
      occurred_at: now,
      author,
    });

    const remaining = tasks
      .filter((t) => t.id !== task.id && t.status === "open" && t.due_at)
      .map((t) => t.due_at as string)
      .sort();

    const updated = await patchContact({
      last_activity_at: now,
      next_follow_up_at: remaining[0] ?? null,
    });
    if (updated) setFields(fieldsFrom(updated));

    setTasks((prev) => prev.map((t) => (t.id === task.id ? (data as CrmTask) : t)));
    setBusyTaskId(null);
    void loadHistory();
  };

  /** Set by hand here; every automatic feed only ever moves it forward. */
  const setLifecycle = async (lifecycle_stage: LifecycleStage) => {
    await patchContact({ lifecycle_stage, last_activity_at: new Date().toISOString() });
  };

  const setPriority = async (priority: CrmPriority) => {
    await patchContact({ priority, last_activity_at: new Date().toISOString() });
  };

  const addTag = async () => {
    const tag = tagDraft.trim().toLowerCase();
    if (!tag || contact.tags.includes(tag)) {
      setTagDraft("");
      return;
    }
    await patchContact({ tags: [...contact.tags, tag] });
    setTagDraft("");
  };

  const removeTag = async (tag: string) => {
    await patchContact({ tags: contact.tags.filter((t) => t !== tag) });
  };

  const toggleArchive = async () => {
    await patchContact(
      { archived: !contact.archived },
      contact.archived ? "Back on the board." : "Archived. The timeline is kept."
    );
  };

  const downloadVCard = () => {
    const eventName = contact.event_id ? eventNameById[contact.event_id] : null;
    downloadFile(
      vcardFilename(contact.full_name),
      "text/vcard;charset=utf-8",
      buildContactVCard(contact, eventName)
    );
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  const spec = stageSpec(contact.stage);
  const openTasks = tasks.filter((t) => t.status === "open");
  const closedTasks = tasks.filter((t) => t.status !== "open");

  return (
    <AnimatePresence>
      <motion.div
        key="crm-contact-drawer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[60] flex"
        role="dialog"
        aria-modal="true"
        aria-label={`Contact detail for ${contact.full_name}`}
      >
        <div
          onClick={onClose}
          aria-hidden="true"
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        <motion.div
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="relative ml-auto w-full sm:max-w-[460px] h-full bg-[#0C0C0C] border-l border-white/8 flex flex-col"
        >
          {/* Header */}
          <div className="shrink-0 px-4 sm:px-5 pt-4 pb-3 border-b border-white/5">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold tracking-tight text-white break-words font-sans">
                  {contact.full_name}
                </h2>
                <p className="text-[11px] text-zinc-400 mt-0.5 break-words">
                  {[contact.job_title, contact.company].filter(Boolean).join(" at ") ||
                    "No company noted"}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close contact detail"
                className="shrink-0 w-11 h-11 -mr-2 -mt-2 flex items-center justify-center rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${spec.badge}`}
              >
                {spec.label}
              </span>
              <LifecycleChip stage={contact.lifecycle_stage} />
              {/* Every way in, not only the first. Somebody who subscribed
                  and then came to a conference is both, and showing one of
                  them is how a funnel report ends up double counting. */}
              <SourceChips sources={contact.sources?.length ? contact.sources : [contact.source]} limit={4} />
              {contact.event_id && eventNameById[contact.event_id] && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.04] border border-white/8 text-zinc-400 max-w-full truncate">
                  {eventNameById[contact.event_id]}
                </span>
              )}
              {contact.archived && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.03] border border-white/10 text-zinc-400">
                  Archived
                </span>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 space-y-6">
            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              <QuickAction
                href={contact.email ? `mailto:${contact.email}` : null}
                icon={Mail}
                label="Email"
              />
              <QuickAction
                href={contact.phone ? `tel:${contact.phone}` : null}
                icon={Phone}
                label="Call"
              />
              <QuickAction href={contact.linkedin_url} icon={Link2} label="LinkedIn" external />
              <button
                type="button"
                onClick={downloadVCard}
                className="btn-glass px-3.5 min-h-[44px] sm:min-h-[36px] text-[11px] font-medium rounded-full"
              >
                <Download className="w-3.5 h-3.5" />
                vCard
              </button>
            </div>

            {/* Stage, priority, tags */}
            <section className="space-y-3">
              <SectionLabel>Pipeline</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Stage">
                  <select
                    value={contact.stage}
                    onChange={(e) => onMoveStage(contact, e.target.value as CrmStage)}
                    className="admin-input h-9 py-0 cursor-pointer"
                  >
                    {CRM_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </Field>
                {/* Two ladders, side by side and deliberately not merged.
                    Stage is what this person is being worked towards;
                    lifecycle is how far along they actually are. A
                    subscriber sitting at "new" is a normal state and the
                    old single column could not express it. */}
                <Field label="Lifecycle">
                  <select
                    value={lifecycleSpec(contact.lifecycle_stage).id}
                    onChange={(e) => void setLifecycle(e.target.value as LifecycleStage)}
                    className="admin-input h-9 py-0 cursor-pointer"
                  >
                    {LIFECYCLE_STAGES.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Priority">
                  <select
                    value={contact.priority}
                    onChange={(e) => void setPriority(e.target.value as CrmPriority)}
                    className="admin-input h-9 py-0 cursor-pointer"
                  >
                    {CRM_PRIORITIES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label} ({p.hint})
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Not a <Field>, because a label wrapping several buttons and an
                  input hands every stray tap to the input. */}
              <div>
                <span className="block text-xs uppercase font-bold tracking-widest text-gray-400 mb-1.5">
                  Tags
                </span>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {contact.tags.length === 0 && (
                    <span className="text-[11px] text-zinc-400">
                      No tags. Use them for the reason you would search later.
                    </span>
                  )}
                  {contact.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.04] border border-white/8 text-zinc-300"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => void removeTag(tag)}
                        aria-label={`Remove tag ${tag}`}
                        className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void addTag();
                      }
                    }}
                    aria-label="New tag"
                    placeholder="investor, hiring, needs-demo"
                    className="admin-input h-9 py-0"
                  />
                  <button
                    type="button"
                    onClick={() => void addTag()}
                    disabled={!tagDraft.trim()}
                    className="btn-glass px-4 min-h-[44px] sm:min-h-[36px] text-[11px] font-medium rounded-lg shrink-0 disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
              </div>
            </section>

            {/* Core fields */}
            <section className="space-y-3">
              <SectionLabel>Details</SectionLabel>
              <Field label="Name">
                <input
                  value={fields.full_name}
                  onChange={(e) => setFields((f) => ({ ...f, full_name: e.target.value }))}
                  className="admin-input h-9 py-0"
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Email">
                  <input
                    type="email"
                    inputMode="email"
                    value={fields.email}
                    onChange={(e) => setFields((f) => ({ ...f, email: e.target.value }))}
                    className="admin-input h-9 py-0"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    type="tel"
                    inputMode="tel"
                    value={fields.phone}
                    onChange={(e) => setFields((f) => ({ ...f, phone: e.target.value }))}
                    className="admin-input h-9 py-0"
                  />
                </Field>
                <Field label="Company">
                  <input
                    value={fields.company}
                    onChange={(e) => setFields((f) => ({ ...f, company: e.target.value }))}
                    className="admin-input h-9 py-0"
                  />
                </Field>
                <Field label="Job title">
                  <input
                    value={fields.job_title}
                    onChange={(e) => setFields((f) => ({ ...f, job_title: e.target.value }))}
                    className="admin-input h-9 py-0"
                  />
                </Field>
                <Field label="Website">
                  <input
                    inputMode="url"
                    value={fields.website}
                    onChange={(e) => setFields((f) => ({ ...f, website: e.target.value }))}
                    className="admin-input h-9 py-0"
                  />
                </Field>
                <Field label="LinkedIn">
                  <input
                    inputMode="url"
                    value={fields.linkedin_url}
                    onChange={(e) => setFields((f) => ({ ...f, linkedin_url: e.target.value }))}
                    className="admin-input h-9 py-0"
                  />
                </Field>
                <Field label="City">
                  <input
                    value={fields.city}
                    onChange={(e) => setFields((f) => ({ ...f, city: e.target.value }))}
                    className="admin-input h-9 py-0"
                  />
                </Field>
                <Field label="Country">
                  <input
                    value={fields.country}
                    onChange={(e) => setFields((f) => ({ ...f, country: e.target.value }))}
                    className="admin-input h-9 py-0"
                  />
                </Field>
              </div>

              <Field label="Account">
                <select
                  value={fields.account_id}
                  onChange={(e) => setFields((f) => ({ ...f, account_id: e.target.value }))}
                  className="admin-input h-9 py-0 cursor-pointer"
                >
                  <option value="">No account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                      {account.domain ? ` (${account.domain})` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Event">
                <select
                  value={fields.event_id}
                  onChange={(e) => setFields((f) => ({ ...f, event_id: e.target.value }))}
                  className="admin-input h-9 py-0 cursor-pointer"
                >
                  <option value="">No event</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Where we met">
                <input
                  value={fields.met_context}
                  onChange={(e) => setFields((f) => ({ ...f, met_context: e.target.value }))}
                  placeholder="Queue for the keynote, second morning"
                  className="admin-input h-9 py-0"
                />
              </Field>

              <Field label="Next follow up">
                <input
                  type="datetime-local"
                  value={fields.next_follow_up_at}
                  onChange={(e) => setFields((f) => ({ ...f, next_follow_up_at: e.target.value }))}
                  className="admin-input h-9 py-0"
                />
              </Field>

              <Field label="Notes">
                <textarea
                  rows={4}
                  value={fields.notes}
                  onChange={(e) => setFields((f) => ({ ...f, notes: e.target.value }))}
                  className="admin-input resize-y leading-relaxed"
                />
              </Field>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void saveCore()}
                  disabled={saving}
                  className="btn-primary px-4 min-h-[44px] sm:min-h-[36px] text-xs rounded-full disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {saving ? "Saving" : "Save details"}
                </button>
                <button
                  type="button"
                  onClick={() => void toggleArchive()}
                  className={
                    contact.archived
                      ? "btn-glass px-4 min-h-[44px] sm:min-h-[36px] text-xs rounded-full"
                      : "btn-danger px-4 min-h-[44px] sm:min-h-[36px] text-xs rounded-full"
                  }
                >
                  {contact.archived ? (
                    <ArchiveRestore className="w-3.5 h-3.5" />
                  ) : (
                    <Archive className="w-3.5 h-3.5" />
                  )}
                  {contact.archived ? "Restore" : "Archive"}
                </button>
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                Archiving takes someone off the board and keeps every note and follow up. Nothing in
                here is ever deleted.
              </p>
            </section>

            {/* Sequences.
                Enrolling writes the whole set of follow ups at once, dated
                from today, which is why it sits directly above the queue it
                fills rather than behind a menu. */}
            {sequences.length > 0 && (
              <section className="space-y-3">
                <SectionLabel>Sequences</SectionLabel>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={sequenceId}
                    onChange={(e) => setSequenceId(e.target.value)}
                    aria-label="Pick a sequence"
                    className="admin-input h-9 py-0 cursor-pointer"
                  >
                    <option value="">Pick a sequence</option>
                    {sequences.map((sequence) => (
                      <option key={sequence.id} value={sequence.id}>
                        {sequence.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!sequenceId || enrolling}
                    onClick={() => {
                      setEnrolling(true);
                      void enrollContact({ sequenceId, contactId: contact.id })
                        .then((result) => {
                          notify(
                            result.error ?? result.message ?? "Enrolled.",
                            result.ok ? "success" : "error"
                          );
                          if (result.ok) {
                            setSequenceId("");
                            void loadHistory();
                          }
                        })
                        .finally(() => setEnrolling(false));
                    }}
                    className="btn-glass px-4 h-9 text-xs font-medium rounded-full shrink-0 disabled:opacity-50"
                  >
                    {enrolling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Enrol
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Every step lands in the follow up queue at once, dated from today. Nothing is sent
                  until somebody opens the draft and presses send.
                </p>
              </section>
            )}

            {/* Follow ups */}
            <section className="space-y-3">
              <SectionLabel>Follow ups</SectionLabel>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Send the deck"
                  className="admin-input h-9 py-0"
                />
                <input
                  type="date"
                  value={taskDue}
                  onChange={(e) => setTaskDue(e.target.value)}
                  aria-label="Due date"
                  className="admin-input h-9 py-0 sm:w-40 shrink-0"
                />
                <button
                  type="button"
                  onClick={() => void addTask()}
                  disabled={taskSaving || !taskTitle.trim()}
                  className="btn-glass px-4 min-h-[44px] sm:min-h-[36px] text-[11px] font-medium rounded-lg shrink-0 disabled:opacity-40"
                >
                  {taskSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  Add
                </button>
              </div>

              {openTasks.length === 0 && closedTasks.length === 0 ? (
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Nothing scheduled. The one you write on the night of the event is the one that
                  gets done.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {openTasks.map((task) => {
                    const late = isOverdue(task.due_at);
                    return (
                      <li
                        key={task.id}
                        className={`flex items-start gap-2 p-2.5 rounded-lg border ${
                          late ? "border-amber-500/25 bg-amber-500/[0.04]" : "border-white/8 bg-white/[0.02]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => void completeTask(task)}
                          disabled={busyTaskId === task.id}
                          aria-label={`Mark ${task.title} done`}
                          className="shrink-0 w-11 h-11 sm:w-7 sm:h-7 -m-1.5 sm:m-0 flex items-center justify-center rounded-full border border-white/15 text-zinc-400 hover:text-white hover:border-white/30 transition-colors disabled:opacity-40"
                        >
                          {busyTaskId === task.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs text-zinc-200 break-words">
                            {task.title}
                          </span>
                          {task.due_at && (
                            <span
                              className={`block text-[10px] mt-0.5 ${
                                late ? "text-amber-200 font-medium" : "text-zinc-400"
                              }`}
                            >
                              {late ? "Overdue " : "Due "}
                              {formatDate(task.due_at)}
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                  {closedTasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-start gap-2 p-2.5 rounded-lg border border-white/5 opacity-60"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs text-zinc-400 line-through break-words">
                          {task.title}
                        </span>
                        {task.completed_at && (
                          <span className="block text-[10px] text-zinc-400 mt-0.5">
                            Done {formatDate(task.completed_at)}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Timeline */}
            <section className="space-y-3">
              <SectionLabel>Timeline</SectionLabel>

              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What was actually said. Write it before you get to the next stand."
                  className="admin-input resize-y leading-relaxed"
                />
                <button
                  type="button"
                  onClick={() => void addNote()}
                  disabled={noteSaving || !note.trim()}
                  className="btn-glass px-4 min-h-[44px] sm:min-h-[36px] text-[11px] font-medium rounded-full disabled:opacity-40"
                >
                  {noteSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <StickyNote className="w-3.5 h-3.5" />
                  )}
                  Add note
                </button>
              </div>

              {loadingHistory ? (
                <div className="flex items-center gap-2 text-[11px] text-zinc-400 py-4">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Reading the timeline
                </div>
              ) : interactions.length === 0 ? (
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Nothing recorded yet. Notes, stage moves and finished follow ups all land here.
                </p>
              ) : (
                <ol className="space-y-0">
                  {interactions.map((entry, index) => (
                    <li key={entry.id} className="flex gap-3">
                      <span className="flex flex-col items-center shrink-0 pt-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                        {index < interactions.length - 1 && (
                          <span className="w-px flex-1 bg-white/8 my-1" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1 pb-4">
                        <span className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-[11px] font-semibold text-zinc-300">
                            {INTERACTION_LABELS[entry.kind] ?? entry.kind}
                          </span>
                          <span
                            className="text-[10px] text-zinc-400"
                            title={formatDateTime(entry.occurred_at)}
                          >
                            {relativeTime(entry.occurred_at)}
                          </span>
                        </span>
                        {entry.body && (
                          <span className="block text-[11px] text-zinc-400 leading-relaxed mt-1 break-words whitespace-pre-wrap">
                            {entry.body}
                          </span>
                        )}
                        {entry.author && (
                          <span className="block text-[10px] text-zinc-400 mt-1 truncate">
                            {entry.author}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <div className="flex items-center gap-2 text-[10px] text-zinc-400 pb-6">
              <Clock className="w-3 h-3 shrink-0" />
              <span className="break-words">
                Met {formatDateTime(contact.met_at)}
                {contact.captured_offline ? ", typed with no signal and synced later" : ""}
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Bits                                                               */
/* ------------------------------------------------------------------ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-xs uppercase font-bold tracking-widest text-gray-400 font-sans">
      {children}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase font-bold tracking-widest text-gray-400 font-sans mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  external = false,
}: {
  href: string | null;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  external?: boolean;
}) {
  if (!href) {
    return (
      <span
        aria-disabled="true"
        title={`No ${label.toLowerCase()} on file`}
        className="inline-flex items-center justify-center gap-1.5 px-3.5 min-h-[44px] sm:min-h-[36px] rounded-full border border-white/5 text-[11px] font-semibold text-zinc-700 select-none"
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
    );
  }
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="btn-glass px-3.5 min-h-[44px] sm:min-h-[36px] text-[11px] font-medium rounded-full"
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </a>
  );
}
