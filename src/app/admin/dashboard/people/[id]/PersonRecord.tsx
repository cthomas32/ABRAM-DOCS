"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  Building2,
  Check,
  ChevronLeft,
  Clock,
  Download,
  Handshake,
  Link2,
  Loader2,
  Mail,
  Phone,
  Plus,
  Route,
  Save,
  StickyNote,
  User,
  X,
} from "lucide-react";
import ObjectTabs, { ObjectHeader, type ObjectTab } from "@/components/admin/ObjectTabs";
import Overline, { FieldLabel } from "@/components/admin/Overline";
import { EmptyPanel } from "@/components/admin/Panel";
import Money from "@/components/admin/Money";
import { LifecycleChip, SourceChips } from "@/components/admin/PersonChips";
import {
  CRM_PRIORITIES,
  CRM_STAGES,
  DEAL_STAGES,
  INTERACTION_LABELS,
  stageSpec,
  type CrmPriority,
  type CrmStage,
} from "@/lib/crm/constants";
import { LIFECYCLE_STAGES, type LifecycleStage } from "@/lib/crm/people";
import { matchAccount, suggestAccount } from "@/lib/crm/accountMatch";
import { buildContactVCard, vcardFilename } from "@/lib/crm/vcard";
import {
  downloadFile,
  formatDate,
  formatDateTime,
  fromLocalInputValue,
  isOverdue,
  relativeTime,
  toLocalInputValue,
} from "@/lib/crm/console";
import type {
  CrmAccount,
  CrmContact,
  CrmDeal,
  CrmEvent,
  CrmInteraction,
  CrmTask,
} from "@/lib/crm/types";
import {
  addContactNote,
  addContactTask,
  completeContactTask,
  createAccountForContacts,
  setContactArchived,
  setContactLifecycle,
  setContactPriority,
  setContactStage,
  setContactTags,
  updateContact,
} from "../actions";
import { enrollContact } from "../sequenceActions";

/**
 * The person record, drawn on a page.
 *
 * Every write here goes through a server action in `../actions.ts`. The
 * drawer this replaces held its own Supabase client and called `.update()`
 * and `.insert()` from the browser, which is why the timeline it wrote
 * carried an author string handed down as a prop and no `author_user_id`
 * at all. A note written on this page knows who wrote it.
 *
 * Instant commit for anything that is one gesture: stage, lifecycle,
 * priority, tags, archive. Everything typed collects into one form and
 * one save bar, because three Save buttons down one page is three chances
 * to lose the change in the section nobody pressed.
 */

/**
 * The tab strip is declared here rather than handed down from the page.
 *
 * A tab carries a lucide icon, an icon is a component, and a component
 * cannot cross the server to client boundary: React serialises plain data
 * only. The page sends the counts, which are numbers, and whether the
 * reader holds the sequences permission, which is a boolean.
 */
function tabsFor(counts: { activity: number; deals: number }, canSequences: boolean): ObjectTab[] {
  return [
    { id: "overview", label: "Overview", icon: User },
    { id: "activity", label: "Activity", icon: Phone, badge: counts.activity },
    { id: "deals", label: "Deals", icon: Handshake, badge: counts.deals },
    ...(canSequences ? [{ id: "sequences", label: "Sequences", icon: Route }] : []),
  ];
}

export interface SequenceOption {
  id: string;
  name: string;
  description: string | null;
}

export interface AccountOption {
  id: string;
  name: string;
  domain: string | null;
}

interface Fields {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  website: string;
  linkedinUrl: string;
  city: string;
  country: string;
  accountId: string;
  eventId: string;
  metContext: string;
  nextFollowUpAt: string;
  notes: string;
}

function fieldsFrom(contact: CrmContact): Fields {
  return {
    fullName: contact.full_name ?? "",
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    company: contact.company ?? "",
    jobTitle: contact.job_title ?? "",
    website: contact.website ?? "",
    linkedinUrl: contact.linkedin_url ?? "",
    city: contact.city ?? "",
    country: contact.country ?? "",
    accountId: contact.account_id ?? "",
    eventId: contact.event_id ?? "",
    metContext: contact.met_context ?? "",
    nextFollowUpAt: toLocalInputValue(contact.next_follow_up_at),
    notes: contact.notes ?? "",
  };
}

export default function PersonRecord({
  contact,
  account,
  accounts,
  events,
  interactions,
  tasks,
  deals,
  sequences,
  canWrite,
  canSequences,
  canAccounts,
  counts,
  tab,
}: {
  contact: CrmContact;
  account: CrmAccount | null;
  accounts: AccountOption[];
  events: CrmEvent[];
  interactions: CrmInteraction[];
  tasks: CrmTask[];
  deals: CrmDeal[];
  sequences: SequenceOption[];
  canWrite: boolean;
  canSequences: boolean;
  canAccounts: boolean;
  counts: { activity: number; deals: number };
  tab: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const tabs = useMemo(() => tabsFor(counts, canSequences), [counts, canSequences]);

  const server = useMemo(() => fieldsFrom(contact), [contact]);
  const [fields, setFields] = useState<Fields>(server);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const [tag, setTag] = useState("");
  const [note, setNote] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskSaving, setTaskSaving] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [sequenceId, setSequenceId] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  const dirtyCount = useMemo(
    () =>
      (Object.keys(server) as (keyof Fields)[]).filter((key) => fields[key] !== server[key]).length,
    [fields, server]
  );

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) =>
    setFields((current) => ({ ...current, [key]: value }));

  /**
   * The company they typed, against the companies we hold.
   *
   * Read from `fields` rather than from `contact`, so typing a company
   * into the form offers the match straight away instead of after a save.
   * Computed only while the person has no account: once they are linked
   * there is nothing to suggest, and a suggestion beside a filled field
   * reads as a correction nobody asked for.
   */
  const companySuggestion = useMemo(() => {
    if (fields.accountId) return null;
    const person = { company: fields.company, email: fields.email, website: fields.website };
    return {
      match: matchAccount(person, accounts),
      create: suggestAccount(person),
    };
  }, [fields.accountId, fields.company, fields.email, fields.website, accounts]);

  const [linking, setLinking] = useState(false);

  const openTasks = tasks.filter((task) => task.status === "open");
  const doneTasks = tasks.filter((task) => task.status !== "open");
  const eventName = events.find((event) => event.id === contact.event_id)?.name ?? null;
  const spec = stageSpec(contact.stage);

  function refresh() {
    startTransition(() => router.refresh());
  }

  /** Every action reports the same way, so there is one status line. */
  async function run(work: () => Promise<{ ok: boolean; error?: string }>, success?: string) {
    const outcome = await work();
    setResult(outcome.ok ? success ?? null : outcome.error ?? "That did not save.");
    if (outcome.ok) refresh();
    return outcome.ok;
  }

  async function save() {
    setSaving(true);
    setResult(null);
    const ok = await run(
      () =>
        updateContact(contact.id, {
          fullName: fields.fullName,
          email: fields.email || null,
          phone: fields.phone || null,
          company: fields.company || null,
          jobTitle: fields.jobTitle || null,
          website: fields.website || null,
          linkedinUrl: fields.linkedinUrl || null,
          city: fields.city || null,
          country: fields.country || null,
          metContext: fields.metContext || null,
          notes: fields.notes || null,
          eventId: fields.eventId || null,
          accountId: fields.accountId || null,
          nextFollowUpAt: fromLocalInputValue(fields.nextFollowUpAt),
        }),
      "Saved."
    );
    setSaving(false);
    return ok;
  }

  async function submitNote() {
    const body = note.trim();
    if (!body) return;
    setNoteSaving(true);
    const ok = await run(() => addContactNote(contact.id, body), "Note added.");
    if (ok) setNote("");
    setNoteSaving(false);
  }

  async function submitTask() {
    const title = taskTitle.trim();
    if (!title) return;
    setTaskSaving(true);
    const ok = await run(
      () => addContactTask(contact.id, title, taskDue || null),
      "Follow up added."
    );
    if (ok) {
      setTaskTitle("");
      setTaskDue("");
    }
    setTaskSaving(false);
  }

  async function finishTask(task: CrmTask) {
    setBusyTaskId(task.id);
    await run(() => completeContactTask(task.id, contact.id));
    setBusyTaskId(null);
  }

  async function enrol() {
    if (!sequenceId) return;
    setEnrolling(true);
    const outcome = await enrollContact({ sequenceId, contactId: contact.id });
    setResult(outcome.ok ? "Enrolled." : outcome.error ?? "That enrolment did not save.");
    if (outcome.ok) refresh();
    setEnrolling(false);
  }

  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s" && dirtyCount > 0) {
        event.preventDefault();
        void save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirtyCount, fields]);

  const base = `/admin/dashboard/people/${contact.id}`;

  return (
    <div className="flex-1 min-w-0 overflow-y-auto">
      <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto pb-16">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 min-w-0">
          <Link
            href="/admin/dashboard/people"
            className="inline-flex items-center gap-1.5 h-11 sm:h-9 -ml-2 px-2 rounded-full text-[11px] font-medium text-zinc-400 hover:text-white transition-colors shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            People
          </Link>
          <span aria-hidden="true" className="text-white/15 text-[11px] shrink-0">
            /
          </span>
          <span className="text-[11px] text-zinc-500 truncate">{contact.full_name}</span>
        </nav>

        <ObjectHeader
          title={contact.full_name}
          action={
            <Link
              href={`${base}?tab=activity`}
              className="btn-primary min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full inline-flex items-center gap-1.5"
            >
              <StickyNote className="w-3.5 h-3.5" />
              Add note
            </Link>
          }
        >
          <p className="mt-1 text-xs text-zinc-400 leading-relaxed break-words">
            {[contact.job_title, contact.company].filter(Boolean).join(" at ") ||
              "No company noted"}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center h-6 px-2.5 rounded-full border text-[10px] font-medium ${spec.badge}`}
            >
              {spec.label}
            </span>
            <LifecycleChip stage={contact.lifecycle_stage} />
            <SourceChips sources={contact.sources} limit={4} />
            {eventName && (
              <span className="inline-flex items-center h-6 px-2.5 rounded-full border border-white/8 bg-white/[0.04] text-[10px] font-medium text-zinc-300">
                {eventName}
              </span>
            )}
            {contact.archived && (
              <span className="inline-flex items-center h-6 px-2.5 rounded-full border border-white/8 bg-white/[0.04] text-[10px] font-medium text-zinc-300">
                Archived
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {contact.email && (
              <QuickAction href={`mailto:${contact.email}`} icon={Mail} label="Email" />
            )}
            {contact.phone && (
              <QuickAction href={`tel:${contact.phone}`} icon={Phone} label="Call" />
            )}
            {contact.linkedin_url && (
              <QuickAction href={contact.linkedin_url} icon={Link2} label="LinkedIn" external />
            )}
            <button
              type="button"
              onClick={() =>
                downloadFile(
                  vcardFilename(contact.full_name),
                  "text/vcard;charset=utf-8",
                  buildContactVCard(contact, eventName)
                )
              }
              className="btn-glass min-h-[44px] sm:min-h-[36px] px-3 text-[11px] font-medium rounded-full inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              vCard
            </button>
          </div>
        </ObjectHeader>

        <ObjectTabs
          tabs={tabs}
          current={tab}
          basePath={base}
          className="mt-5 -mx-4 px-4 sm:mx-0 sm:px-0"
        />

        {/* ---------------------------------------------------------- */}
        {tab === "overview" && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6 lg:gap-8 items-start">
            <div className="min-w-0 space-y-7">
              <section aria-label="Pipeline" className="space-y-3.5">
                <Overline as="h2" className="pb-1 border-b border-white/5">
                  Pipeline
                </Overline>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                  <div>
                    <FieldLabel htmlFor="person-stage">Stage</FieldLabel>
                    <select
                      id="person-stage"
                      value={contact.stage}
                      disabled={!canWrite}
                      onChange={(event) =>
                        void run(() =>
                          setContactStage(contact.id, contact.stage, event.target.value as CrmStage)
                        )
                      }
                      className="admin-input h-11 sm:h-9 py-0 cursor-pointer disabled:opacity-50"
                    >
                      {CRM_STAGES.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel htmlFor="person-lifecycle">Lifecycle</FieldLabel>
                    <select
                      id="person-lifecycle"
                      value={contact.lifecycle_stage}
                      disabled={!canWrite}
                      onChange={(event) =>
                        void run(() =>
                          setContactLifecycle(contact.id, event.target.value as LifecycleStage)
                        )
                      }
                      className="admin-input h-11 sm:h-9 py-0 cursor-pointer disabled:opacity-50"
                    >
                      {LIFECYCLE_STAGES.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel htmlFor="person-priority">Priority</FieldLabel>
                    <select
                      id="person-priority"
                      value={contact.priority}
                      disabled={!canWrite}
                      onChange={(event) =>
                        void run(() =>
                          setContactPriority(contact.id, event.target.value as CrmPriority)
                        )
                      }
                      className="admin-input h-11 sm:h-9 py-0 cursor-pointer disabled:opacity-50"
                    >
                      {CRM_PRIORITIES.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <FieldLabel htmlFor="person-tag">Tags</FieldLabel>
                  {contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {contact.tags.map((entry) => (
                        <span
                          key={entry}
                          className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-full border border-white/8 bg-white/[0.04] text-[10px] text-zinc-300"
                        >
                          {entry}
                          {canWrite && (
                            <button
                              type="button"
                              aria-label={`Remove ${entry}`}
                              onClick={() =>
                                void run(() =>
                                  setContactTags(
                                    contact.id,
                                    contact.tags.filter((value) => value !== entry)
                                  )
                                )
                              }
                              className="w-5 h-5 rounded-full flex items-center justify-center text-zinc-500 hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      id="person-tag"
                      value={tag}
                      disabled={!canWrite}
                      onChange={(event) => setTag(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          if (!tag.trim()) return;
                          void run(() => setContactTags(contact.id, [...contact.tags, tag]));
                          setTag("");
                        }
                      }}
                      placeholder="investor, hiring, needs-demo"
                      className="admin-input h-11 sm:h-9 py-0"
                    />
                    <button
                      type="button"
                      disabled={!canWrite || !tag.trim()}
                      onClick={() => {
                        void run(() => setContactTags(contact.id, [...contact.tags, tag]));
                        setTag("");
                      }}
                      className="btn-glass min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full shrink-0 disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </section>

              <section aria-label="Details" className="space-y-3.5">
                <Overline as="h2" className="pb-1 border-b border-white/5">
                  Details
                </Overline>

                <div>
                  <FieldLabel htmlFor="person-name">Name</FieldLabel>
                  <input
                    id="person-name"
                    value={fields.fullName}
                    onChange={(event) => set("fullName", event.target.value)}
                    className="admin-input h-11 sm:h-9 py-0"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                  <Text id="person-email" label="Email" type="email" value={fields.email} onChange={(v) => set("email", v)} placeholder="alex@studio.com" />
                  <Text id="person-phone" label="Phone" type="tel" value={fields.phone} onChange={(v) => set("phone", v)} placeholder="+44 7700 900123" />
                  <Text id="person-company" label="Company" value={fields.company} onChange={(v) => set("company", v)} placeholder="Helix Studios" />
                  <Text id="person-title" label="Job title" value={fields.jobTitle} onChange={(v) => set("jobTitle", v)} placeholder="Head of Production" />
                  <Text id="person-website" label="Website" value={fields.website} onChange={(v) => set("website", v)} placeholder="helix.com" />
                  <Text id="person-linkedin" label="LinkedIn" value={fields.linkedinUrl} onChange={(v) => set("linkedinUrl", v)} placeholder="linkedin.com/in/..." />
                  <Text id="person-city" label="City" value={fields.city} onChange={(v) => set("city", v)} />
                  <Text id="person-country" label="Country" value={fields.country} onChange={(v) => set("country", v)} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                  <div>
                    <FieldLabel htmlFor="person-account">Company record</FieldLabel>
                    <select
                      id="person-account"
                      value={fields.accountId}
                      onChange={(event) => set("accountId", event.target.value)}
                      className="admin-input h-11 sm:h-9 py-0 cursor-pointer"
                    >
                      <option value="">No account</option>
                      {accounts.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.name}
                        </option>
                      ))}
                    </select>

                    {/* The one place the free text company and the company
                        record are reconciled. Linking sets the select and
                        rides the save bar like any other edit; creating
                        writes an account immediately, because there is no
                        way to defer bringing a record into existence. */}
                    {canWrite && companySuggestion?.match && (
                      <p className="mt-1.5 text-[11px] text-zinc-500 leading-relaxed">
                        {companySuggestion.match.matchedOn === "domain"
                          ? "Their email is at "
                          : "Their company reads as "}
                        <span className="text-zinc-300">
                          {companySuggestion.match.matchedOn === "domain"
                            ? companySuggestion.match.account.domain
                            : companySuggestion.match.account.name}
                        </span>
                        .{" "}
                        <button
                          type="button"
                          onClick={() => set("accountId", companySuggestion.match!.account.id)}
                          className="text-zinc-300 hover:text-white underline underline-offset-2 transition-colors"
                        >
                          Link to {companySuggestion.match.account.name}
                        </button>
                      </p>
                    )}

                    {canWrite && !companySuggestion?.match && companySuggestion?.create && (
                      <p className="mt-1.5 text-[11px] text-zinc-500 leading-relaxed">
                        No company record matches {companySuggestion.create.name}.
                        {canAccounts ? (
                          <>
                            {" "}
                            <button
                              type="button"
                              disabled={linking || pending}
                              onClick={async () => {
                                const wanted = companySuggestion.create!;
                                setLinking(true);
                                const outcome = await createAccountForContacts([contact.id], wanted);
                                setLinking(false);
                                if (outcome.ok && outcome.accountId) {
                                  set("accountId", outcome.accountId);
                                  setResult(
                                    outcome.linkedExisting
                                      ? `${wanted.name} already existed, so they were linked to it.`
                                      : `${wanted.name} created and linked.`
                                  );
                                  refresh();
                                } else {
                                  setResult(outcome.error ?? "That company could not be created.");
                                }
                              }}
                              className="text-zinc-300 hover:text-white underline underline-offset-2 transition-colors disabled:opacity-50"
                            >
                              {linking ? "Creating…" : `Create ${companySuggestion.create.name}`}
                            </button>
                          </>
                        ) : (
                          " An owner can create one."
                        )}
                      </p>
                    )}
                  </div>
                  <div>
                    <FieldLabel htmlFor="person-event">Event</FieldLabel>
                    <select
                      id="person-event"
                      value={fields.eventId}
                      onChange={(event) => set("eventId", event.target.value)}
                      className="admin-input h-11 sm:h-9 py-0 cursor-pointer"
                    >
                      <option value="">No event</option>
                      {events.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <FieldLabel htmlFor="person-met">Where we met</FieldLabel>
                  <input
                    id="person-met"
                    value={fields.metContext}
                    onChange={(event) => set("metContext", event.target.value)}
                    placeholder="Stand 14, second morning"
                    className="admin-input h-11 sm:h-9 py-0"
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="person-next">Next follow up</FieldLabel>
                  <input
                    id="person-next"
                    type="datetime-local"
                    value={fields.nextFollowUpAt}
                    onChange={(event) => set("nextFollowUpAt", event.target.value)}
                    className="admin-input h-11 sm:h-9 py-0"
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="person-notes">Notes</FieldLabel>
                  <textarea
                    id="person-notes"
                    rows={4}
                    value={fields.notes}
                    onChange={(event) => set("notes", event.target.value)}
                    placeholder="Anything the future you will need."
                    className="admin-input resize-y leading-relaxed"
                  />
                </div>
              </section>

              <section aria-label="Record" className="space-y-3.5">
                <Overline as="h2" className="pb-1 border-b border-white/5">
                  Record
                </Overline>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Met {formatDateTime(contact.met_at)}
                  {contact.captured_offline ? ", typed with no signal and synced later" : ""}.
                </p>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Archiving takes someone off the board and keeps every note and follow up. Nothing
                  in here is ever deleted.
                </p>
                {canWrite && (
                  <button
                    type="button"
                    onClick={() =>
                      void run(
                        () => setContactArchived(contact.id, !contact.archived),
                        contact.archived ? "Restored." : "Archived."
                      )
                    }
                    className={`${contact.archived ? "btn-glass" : "btn-danger"} min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full inline-flex items-center gap-1.5`}
                  >
                    {contact.archived ? (
                      <ArchiveRestore className="w-3.5 h-3.5" />
                    ) : (
                      <Archive className="w-3.5 h-3.5" />
                    )}
                    {contact.archived ? "Restore" : "Archive"}
                  </button>
                )}
              </section>
            </div>

            <div className="min-w-0 space-y-5">
              {(contact.sources.length > 0 || eventName || contact.met_context) && (
                <section aria-label="How they got here" className="space-y-2.5">
                  <Overline as="h2">How they got here</Overline>
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-2">
                    <SourceChips sources={contact.sources} />
                    {eventName && <p className="text-[11px] text-zinc-300">{eventName}</p>}
                    {contact.met_context && (
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {contact.met_context}
                      </p>
                    )}
                  </div>
                </section>
              )}

              <section aria-label="Open follow ups" className="space-y-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <Overline as="h2">Open follow ups</Overline>
                  {openTasks.length > 5 && (
                    <Link
                      href={`${base}?tab=activity`}
                      className="text-[11px] text-zinc-400 hover:text-white transition-colors shrink-0"
                    >
                      See all {openTasks.length}
                    </Link>
                  )}
                </div>
                {canWrite && (
                  <TaskComposer
                    title={taskTitle}
                    due={taskDue}
                    saving={taskSaving}
                    onTitle={setTaskTitle}
                    onDue={setTaskDue}
                    onSubmit={submitTask}
                  />
                )}
                {openTasks.length === 0 ? (
                  <EmptyPanel title="Nothing scheduled" icon={<Clock className="w-6 h-6" />}>
                    The one you write on the night of the event is the one that gets done.
                  </EmptyPanel>
                ) : (
                  <ul className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5">
                    {openTasks.slice(0, 5).map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        busy={busyTaskId === task.id}
                        canWrite={canWrite}
                        onComplete={() => void finishTask(task)}
                      />
                    ))}
                  </ul>
                )}
              </section>

              <section aria-label="Recent activity" className="space-y-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <Overline as="h2">Recent activity</Overline>
                  {interactions.length > 8 && (
                    <Link
                      href={`${base}?tab=activity`}
                      className="text-[11px] text-zinc-400 hover:text-white transition-colors shrink-0"
                    >
                      See all {interactions.length}
                    </Link>
                  )}
                </div>
                {interactions.length === 0 ? (
                  <EmptyPanel title="Nothing recorded yet" icon={<StickyNote className="w-6 h-6" />}>
                    Notes, stage moves and finished follow ups all land here.
                  </EmptyPanel>
                ) : (
                  <ul className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5">
                    {interactions.slice(0, 8).map((entry) => (
                      <TimelineRow key={entry.id} entry={entry} />
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------- */}
        {tab === "activity" && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-6 lg:gap-8 items-start">
            <div className="min-w-0 space-y-5">
              {canWrite && (
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-2.5">
                  <FieldLabel htmlFor="person-note">Add a note</FieldLabel>
                  <textarea
                    id="person-note"
                    rows={3}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="What was actually said. Write it before you get to the next stand."
                    className="admin-input resize-y leading-relaxed"
                  />
                  <button
                    type="button"
                    disabled={noteSaving || !note.trim()}
                    onClick={() => void submitNote()}
                    className="btn-primary min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {noteSaving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <StickyNote className="w-3.5 h-3.5" />
                    )}
                    Add note
                  </button>
                </div>
              )}

              {interactions.length === 0 ? (
                <EmptyPanel title="Nothing recorded yet" icon={<StickyNote className="w-6 h-6" />}>
                  Notes, stage moves and finished follow ups all land here.
                </EmptyPanel>
              ) : (
                <ul className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5">
                  {interactions.map((entry) => (
                    <TimelineRow key={entry.id} entry={entry} />
                  ))}
                </ul>
              )}
            </div>

            <div className="min-w-0 space-y-5">
              <section aria-label="Follow ups" className="space-y-2.5">
                <Overline as="h2">Follow ups</Overline>
                {canWrite && (
                  <TaskComposer
                    title={taskTitle}
                    due={taskDue}
                    saving={taskSaving}
                    onTitle={setTaskTitle}
                    onDue={setTaskDue}
                    onSubmit={submitTask}
                  />
                )}
                {openTasks.length === 0 ? (
                  <EmptyPanel title="Nothing scheduled" icon={<Clock className="w-6 h-6" />}>
                    The one you write on the night of the event is the one that gets done.
                  </EmptyPanel>
                ) : (
                  <ul className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5">
                    {openTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        busy={busyTaskId === task.id}
                        canWrite={canWrite}
                        onComplete={() => void finishTask(task)}
                      />
                    ))}
                  </ul>
                )}
              </section>

              {doneTasks.length > 0 && (
                <details className="rounded-2xl border border-white/5 bg-white/[0.02]">
                  <summary className="cursor-pointer px-4 py-3 text-[11px] text-zinc-400">
                    Done ({doneTasks.length})
                  </summary>
                  <ul className="divide-y divide-white/5 border-t border-white/5">
                    {doneTasks.map((task) => (
                      <TaskRow key={task.id} task={task} busy={false} canWrite={false} />
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------- */}
        {tab === "deals" && (
          <div className="mt-6 space-y-5">
            {account && (
              <section aria-label="Company" className="space-y-2.5">
                <Overline as="h2">Company</Overline>
                <ul className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5">
                  <li className="flex items-start gap-3 px-4 py-3">
                    <Glyph icon={Building2} />
                    <span className="min-w-0 flex-1">
                      <Link
                        href={`/admin/dashboard/companies/${account.id}`}
                        className="text-xs text-white break-words hover:underline"
                      >
                        {account.name}
                      </Link>
                      <span className="block text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                        {account.domain || "No web address on file"}
                      </span>
                    </span>
                  </li>
                </ul>
              </section>
            )}

            <section aria-label="Deals" className="space-y-2.5">
              <Overline as="h2">Deals</Overline>
              {deals.length === 0 ? (
                <EmptyPanel title="No deal names this person" icon={<Handshake className="w-6 h-6" />}>
                  A deal hangs off a company. Set this person as its primary contact and it appears
                  here.
                </EmptyPanel>
              ) : (
                <ul className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5">
                  {deals.map((deal) => {
                    const dealStage = DEAL_STAGES.find((entry) => entry.id === deal.stage);
                    return (
                      <li key={deal.id} className="flex items-start gap-3 px-4 py-3">
                        <Glyph icon={Handshake} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline gap-2 flex-wrap">
                            <Link
                              href={`/admin/dashboard/deals/${deal.id}`}
                              className="text-xs text-white break-words hover:underline"
                            >
                              {deal.name}
                            </Link>
                            {dealStage && (
                              <span
                                className={`inline-flex items-center h-5 px-2 rounded-full border text-[10px] font-medium ${dealStage.badge}`}
                              >
                                {dealStage.label}
                              </span>
                            )}
                          </span>
                          <span className="block text-[11px] text-zinc-400 leading-relaxed mt-0.5">
                            {deal.expected_close_on
                              ? `Closes ${formatDate(deal.expected_close_on)}`
                              : "No close date"}
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] text-zinc-500 tabular-nums">
                          <Money cents={deal.amount_cents} currency={deal.currency} />
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        )}

        {/* ---------------------------------------------------------- */}
        {tab === "sequences" && (
          <div className="mt-6 max-w-2xl space-y-3.5">
            <Overline as="h2" className="pb-1 border-b border-white/5">
              Enrol in a sequence
            </Overline>
            {sequences.length === 0 ? (
              <EmptyPanel title="No sequence is switched on">
                A sequence is an ordered set of follow ups. Build one on the people screen first.
              </EmptyPanel>
            ) : (
              <>
                <div>
                  <FieldLabel htmlFor="person-sequence">Sequence</FieldLabel>
                  <select
                    id="person-sequence"
                    value={sequenceId}
                    onChange={(event) => setSequenceId(event.target.value)}
                    className="admin-input h-11 sm:h-9 py-0 cursor-pointer"
                  >
                    <option value="">Pick one</option>
                    {sequences.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  disabled={enrolling || !sequenceId}
                  onClick={() => void enrol()}
                  className="btn-primary min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {enrolling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Enrol
                </button>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Every step lands in the follow up queue at once, dated from today. Nothing is sent
                  until somebody opens the draft and presses send.
                </p>
              </>
            )}
          </div>
        )}

        {(dirtyCount > 0 || result) && (
          <div className="sticky bottom-0 z-20 mt-6 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-white/8 bg-[#0A0A0A]/90 backdrop-blur-[20px] flex flex-wrap items-center gap-3">
            <span className="text-[11px] text-zinc-400 tabular-nums min-w-0">
              {dirtyCount > 0
                ? `${dirtyCount} unsaved ${dirtyCount === 1 ? "change" : "changes"}`
                : "No unsaved changes"}
              {result && <span className="text-zinc-300"> · {result}</span>}
            </span>
            {dirtyCount > 0 && (
              <div className="flex items-center gap-2 ml-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setFields(server);
                    setResult(null);
                  }}
                  className="btn-ghost min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={saving || pending || !canWrite}
                  className="btn-primary min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {saving ? "Saving" : "Save"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small parts                                                        */
/* ------------------------------------------------------------------ */

function Glyph({ icon: Icon }: { icon: React.ComponentType<{ className?: string }> }) {
  return (
    <span className="shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-white/[0.03] border border-white/8 flex items-center justify-center text-zinc-400">
      <Icon className="w-3.5 h-3.5" />
    </span>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  external,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="btn-glass min-h-[44px] sm:min-h-[36px] px-3 text-[11px] font-medium rounded-full inline-flex items-center gap-1.5"
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </a>
  );
}

function Text({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="admin-input h-11 sm:h-9 py-0"
      />
    </div>
  );
}

function TaskComposer({
  title,
  due,
  saving,
  onTitle,
  onDue,
  onSubmit,
}: {
  title: string;
  due: string;
  saving: boolean;
  onTitle: (next: string) => void;
  onDue: (next: string) => void;
  onSubmit: () => void | Promise<void>;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-2.5">
      <input
        value={title}
        onChange={(event) => onTitle(event.target.value)}
        placeholder="Send the revised pricing"
        aria-label="What the follow up is"
        className="admin-input h-11 sm:h-9 py-0"
      />
      <div className="flex gap-2">
        <input
          type="date"
          value={due}
          onChange={(event) => onDue(event.target.value)}
          aria-label="When it is due"
          className="admin-input h-11 sm:h-9 py-0"
        />
        <button
          type="button"
          disabled={saving || !title.trim()}
          onClick={() => void onSubmit()}
          className="btn-glass min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full shrink-0 inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Add
        </button>
      </div>
    </div>
  );
}

function TaskRow({
  task,
  busy,
  canWrite,
  onComplete,
}: {
  task: CrmTask;
  busy: boolean;
  canWrite: boolean;
  onComplete?: () => void;
}) {
  const done = task.status !== "open";
  const late = !done && isOverdue(task.due_at);

  return (
    <li className={`flex items-start gap-3 px-4 py-3 ${done ? "opacity-60" : ""}`}>
      {done ? (
        <span className="shrink-0 mt-0.5 w-7 h-7 rounded-full border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center text-emerald-400">
          <Check className="w-3.5 h-3.5" />
        </span>
      ) : canWrite ? (
        <button
          type="button"
          aria-label={`Mark "${task.title}" done`}
          disabled={busy}
          onClick={onComplete}
          className="shrink-0 mt-0.5 w-11 h-11 sm:w-7 sm:h-7 -m-1.5 sm:m-0 rounded-full border border-white/15 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        </button>
      ) : (
        <Glyph icon={Clock} />
      )}

      <span className="min-w-0 flex-1">
        <span
          className={`block text-xs break-words ${done ? "line-through text-zinc-400" : "text-white"}`}
        >
          {task.title}
        </span>
      </span>

      <span
        className={`shrink-0 text-[11px] tabular-nums ${late ? "text-amber-400 font-medium" : "text-zinc-500"}`}
      >
        {done
          ? `Done ${formatDate(task.completed_at)}`
          : task.due_at
            ? `${late ? "Overdue" : "Due"} ${formatDate(task.due_at)}`
            : "No date"}
      </span>
    </li>
  );
}

function TimelineRow({ entry }: { entry: CrmInteraction }) {
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <Glyph icon={StickyNote} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2 flex-wrap">
          <span className="text-xs text-white break-words">
            {INTERACTION_LABELS[entry.kind] ?? entry.kind}
          </span>
        </span>
        {entry.body && (
          <span className="block text-[11px] text-zinc-400 leading-relaxed mt-0.5 break-words whitespace-pre-wrap">
            {entry.body}
          </span>
        )}
        {entry.author && (
          <span className="block text-[10px] text-zinc-400 mt-0.5">{entry.author}</span>
        )}
      </span>
      <span
        className="shrink-0 text-[11px] text-zinc-500 tabular-nums"
        title={formatDateTime(entry.occurred_at)}
      >
        {relativeTime(entry.occurred_at)}
      </span>
    </li>
  );
}
