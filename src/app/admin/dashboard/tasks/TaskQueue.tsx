"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  Clock,
  Loader2,
  Phone,
  Plus,
  RotateCcw,
  Undo2,
  Users,
} from "lucide-react";
import Modal from "@/components/admin/Modal";
import { StatRow } from "@/components/admin/StatTile";
import type { CrmPriority, TaskStatus } from "@/lib/crm/constants";
import {
  BLOCK_CARD,
  BLOCK_CARD_HOVER,
  BLOCK_CHIP,
  BLOCK_COUNT_PILL,
  BLOCK_EMPTY,
  BLOCK_KEY_LABEL,
  BLOCK_SUBLINE,
  BLOCK_TITLE,
  LABEL_CAPS,
  OVERDUE_TEXT,
} from "@/lib/crm/blockStyles";
import {
  completeTask,
  createTask,
  logContactActivity,
  reopenTask,
  snoozeTask,
} from "./actions";

/**
 * The follow up queue.
 *
 * Five sections in the order things get forgotten in: overdue, today,
 * this week, later, done. Each row carries the same anatomy as a board
 * card, because a follow up and a deal are the same kind of object to
 * look at, and two rhythms across one console is one too many.
 *
 * Completing and snoozing are inline. A queue that needs a dialog per row
 * stops being worked after the third row.
 *
 * Logging a call or a meeting lives here rather than on the contact
 * drawer, because the moment somebody wants to record one is the moment
 * they have just finished it and are looking at their list.
 */

export interface QueueTask {
  id: string;
  contact_id: string;
  title: string;
  details: string | null;
  due_at: string | null;
  status: TaskStatus;
  priority: CrmPriority;
  completed_at: string | null;
  assigned_to: string | null;
}

export interface QueueContact {
  id: string;
  full_name: string;
  company: string | null;
}

export interface QueueDeal {
  id: string;
  name: string;
  primary_contact_id: string | null;
}

export interface QueuePerson {
  user_id: string;
  full_name: string | null;
  email: string;
}

interface TaskQueueProps {
  tasks: QueueTask[];
  contacts: QueueContact[];
  deals: QueueDeal[];
  people: QueuePerson[];
  currentUserId: string;
  canWrite: boolean;
  loadError?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Buckets                                                            */
/* ------------------------------------------------------------------ */

type Bucket = "overdue" | "today" | "week" | "later" | "done";

const SECTIONS: { id: Bucket; label: string; empty: string }[] = [
  { id: "overdue", label: "Overdue", empty: "Nothing is late." },
  { id: "today", label: "Today", empty: "Nothing is due today." },
  { id: "week", label: "This week", empty: "Nothing else is due this week." },
  { id: "later", label: "Later", empty: "Nothing further out, and nothing without a date." },
  { id: "done", label: "Done", empty: "Nothing finished in the last month." },
];

function startOfTomorrow(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime() + 86_400_000;
}

/** Midnight after the coming Sunday, so "this week" ends where a week does. */
function endOfWeek(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const daysToSunday = (7 - d.getDay()) % 7;
  return d.getTime() + (daysToSunday + 1) * 86_400_000;
}

function bucketOf(task: QueueTask): Bucket {
  if (task.status === "done") return "done";
  if (!task.due_at) return "later";

  const due = new Date(task.due_at).getTime();
  if (!Number.isFinite(due)) return "later";
  if (due < Date.now()) return "overdue";
  if (due < startOfTomorrow()) return "today";
  if (due < endOfWeek()) return "week";
  return "later";
}

/* ------------------------------------------------------------------ */
/*  Formatting                                                         */
/* ------------------------------------------------------------------ */

function dueLabel(iso: string | null): string {
  if (!iso) return "No date";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "No date";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function initialOf(person: QueuePerson | undefined): string {
  const source = person?.full_name?.trim() || person?.email || "";
  return source ? source[0]!.toUpperCase() : "?";
}

/** Now, as the `YYYY-MM-DDTHH:mm` a datetime input wants. */
function nowInputValue(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

/** Tomorrow at nine, the default a follow up actually wants. */
function tomorrowMorningValue(): string {
  const d = new Date(Date.now() + 86_400_000);
  d.setHours(9, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T09:00`;
}

/* ------------------------------------------------------------------ */
/*  Queue                                                              */
/* ------------------------------------------------------------------ */

export default function TaskQueue({
  tasks,
  contacts,
  deals,
  people,
  currentUserId,
  canWrite,
  loadError = null,
}: TaskQueueProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taskDialog, setTaskDialog] = useState(false);
  const [logKind, setLogKind] = useState<"call" | "meeting" | null>(null);

  const contactById = useMemo(() => {
    const map: Record<string, QueueContact> = {};
    for (const contact of contacts) map[contact.id] = contact;
    return map;
  }, [contacts]);

  const personById = useMemo(() => {
    const map: Record<string, QueuePerson> = {};
    for (const person of people) map[person.user_id] = person;
    return map;
  }, [people]);

  const grouped = useMemo(() => {
    const buckets: Record<Bucket, QueueTask[]> = {
      overdue: [],
      today: [],
      week: [],
      later: [],
      done: [],
    };
    for (const task of tasks) buckets[bucketOf(task)].push(task);
    return buckets;
  }, [tasks]);

  const run = (id: string, work: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const result = await work();
      setBusyId(null);
      if (!result.ok) {
        setError(result.error ?? "That did not save.");
        return;
      }
      router.refresh();
    });
  };

  const mine = tasks.filter(
    (task) => task.status !== "done" && (task.assigned_to === currentUserId || !task.assigned_to)
  );

  return (
    <>
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          What you owe people
        </h1>

        {canWrite && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setLogKind("call")}
              className="btn-glass h-9 px-4 text-xs font-medium"
            >
              <Phone className="w-3.5 h-3.5" />
              Log a call
            </button>
            <button
              type="button"
              onClick={() => setLogKind("meeting")}
              className="btn-glass h-9 px-4 text-xs font-medium"
            >
              <Users className="w-3.5 h-3.5" />
              Log a meeting
            </button>
            <button
              type="button"
              onClick={() => setTaskDialog(true)}
              className="h-9 px-4 rounded-full text-xs font-medium bg-violet-500/15 border border-violet-400/30 text-violet-200 hover:bg-violet-500/25 transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              New follow up
            </button>
          </div>
        )}
      </header>

      <StatRow
        className="mb-5"
        stats={[
          {
            label: "Overdue",
            value: String(grouped.overdue.length),
            caption: grouped.overdue.length ? "Deal with these first" : "Nothing is late",
            attention: grouped.overdue.length > 0,
          },
          {
            label: "Due today",
            value: String(grouped.today.length),
            caption: "Before the day ends",
          },
          {
            label: "This week",
            value: String(grouped.week.length),
            caption: "Due by Sunday",
          },
          {
            label: "Yours",
            value: String(mine.length),
            caption: "Assigned to you or to nobody",
          },
        ]}
      />

      {loadError && (
        <div className="mb-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
          <p className="text-xs text-zinc-300 leading-relaxed">
            The queue could not be read. {loadError}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
          <p className="text-xs text-zinc-300 leading-relaxed">{error}</p>
        </div>
      )}

      {tasks.length === 0 && !loadError ? (
        <div className="rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.01] p-10 text-center">
          <p className="text-sm text-zinc-400 leading-relaxed">
            Follow ups appear here once there is one to do.
          </p>
          {canWrite && (
            <button
              type="button"
              onClick={() => setTaskDialog(true)}
              className="btn-glass mt-4 h-9 px-4 text-xs font-medium"
            >
              New follow up
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-7 max-w-3xl">
          {SECTIONS.map((section) => {
            const rows = grouped[section.id];
            return (
              <section key={section.id}>
                <div className="mb-2.5 flex items-center gap-2">
                  <span className={LABEL_CAPS}>{section.label}</span>
                  <span className={BLOCK_COUNT_PILL}>{rows.length}</span>
                </div>

                {rows.length === 0 ? (
                  <p className={BLOCK_EMPTY}>{section.empty}</p>
                ) : (
                  <div className="space-y-2.5">
                    {rows.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        contact={contactById[task.contact_id]}
                        assignee={task.assigned_to ? personById[task.assigned_to] : undefined}
                        overdue={section.id === "overdue"}
                        canWrite={canWrite}
                        busy={busyId === task.id && pending}
                        onComplete={() => run(task.id, () => completeTask({ id: task.id }))}
                        onReopen={() => run(task.id, () => reopenTask({ id: task.id }))}
                        onSnooze={(days) => run(task.id, () => snoozeTask({ id: task.id, days }))}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <TaskDialog
        open={taskDialog}
        busy={pending}
        contacts={contacts}
        deals={deals}
        people={people}
        currentUserId={currentUserId}
        onClose={() => setTaskDialog(false)}
        onSaved={() => {
          setTaskDialog(false);
          router.refresh();
        }}
        onError={setError}
      />

      <LogDialog
        kind={logKind}
        busy={pending}
        contacts={contacts}
        onClose={() => setLogKind(null)}
        onSaved={() => {
          setLogKind(null);
          router.refresh();
        }}
        onError={setError}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Row                                                                */
/* ------------------------------------------------------------------ */

function TaskRow({
  task,
  contact,
  assignee,
  overdue,
  canWrite,
  busy,
  onComplete,
  onReopen,
  onSnooze,
}: {
  task: QueueTask;
  contact: QueueContact | undefined;
  assignee: QueuePerson | undefined;
  overdue: boolean;
  canWrite: boolean;
  busy: boolean;
  onComplete: () => void;
  onReopen: () => void;
  onSnooze: (days: number) => void;
}) {
  const done = task.status === "done";

  return (
    <div className={`${BLOCK_CARD} ${BLOCK_CARD_HOVER} flex gap-3 ${busy ? "opacity-60" : ""}`}>
      {/* The tick. One press, no dialog. */}
      {canWrite && !done ? (
        <button
          type="button"
          onClick={onComplete}
          disabled={busy}
          aria-label={`Mark ${task.title} done`}
          className="mt-0.5 h-5 w-5 shrink-0 rounded-full border border-white/15 text-zinc-500 hover:border-white/35 hover:text-white transition-colors flex items-center justify-center disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3 opacity-0 hover:opacity-100" />
          )}
        </button>
      ) : (
        <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border border-white/10 flex items-center justify-center">
          {done && <Check className="h-3 w-3 text-zinc-400" />}
        </span>
      )}

      <div className="min-w-0 flex-1">
        {/* Row 1 — who it is about */}
        <div className="flex items-center justify-between gap-2">
          <span className={`${BLOCK_KEY_LABEL} min-w-0 truncate`}>
            {contact?.full_name ?? "Somebody you can no longer see"}
            {contact?.company ? ` · ${contact.company}` : ""}
          </span>
          {assignee && (
            <span
              title={assignee.full_name || assignee.email}
              className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-[9px] text-zinc-300"
            >
              {initialOf(assignee)}
            </span>
          )}
        </div>

        {/* Row 2 — the thing to do */}
        <p className={`${BLOCK_TITLE} mt-1.5 ${done ? "text-zinc-500 line-through" : ""}`}>
          {task.title}
        </p>

        {/* Row 3 — the detail, when there is one */}
        {task.details && (
          <p className={`${BLOCK_SUBLINE} mt-1 whitespace-pre-line break-words`}>{task.details}</p>
        )}

        {/* Row 4 — when, and the ways to move it */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className={`${BLOCK_CHIP} ${overdue ? OVERDUE_TEXT : ""}`}>
            {overdue ? (
              <AlertCircle className="h-3 w-3 shrink-0" />
            ) : (
              <Clock className="h-3 w-3 shrink-0" />
            )}
            <span className="tabular-nums">
              {done ? `Done ${dueLabel(task.completed_at)}` : dueLabel(task.due_at)}
            </span>
          </span>

          {canWrite && !done && (
            <>
              <button
                type="button"
                onClick={() => onSnooze(1)}
                disabled={busy}
                className={`${BLOCK_CHIP} hover:text-white transition-colors disabled:opacity-50`}
              >
                <RotateCcw className="h-3 w-3 shrink-0" />
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => onSnooze(7)}
                disabled={busy}
                className={`${BLOCK_CHIP} hover:text-white transition-colors disabled:opacity-50`}
              >
                <RotateCcw className="h-3 w-3 shrink-0" />
                Next week
              </button>
            </>
          )}

          {canWrite && done && (
            <button
              type="button"
              onClick={onReopen}
              disabled={busy}
              className={`${BLOCK_CHIP} hover:text-white transition-colors disabled:opacity-50`}
            >
              <Undo2 className="h-3 w-3 shrink-0" />
              Reopen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  New follow up                                                      */
/* ------------------------------------------------------------------ */

function TaskDialog({
  open,
  busy,
  contacts,
  deals,
  people,
  currentUserId,
  onClose,
  onSaved,
  onError,
}: {
  open: boolean;
  busy: boolean;
  contacts: QueueContact[];
  deals: QueueDeal[];
  people: QueuePerson[];
  currentUserId: string;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [contactId, setContactId] = useState("");
  const [dealId, setDealId] = useState("");
  const [dueAt, setDueAt] = useState(tomorrowMorningValue());
  const [assignedTo, setAssignedTo] = useState(currentUserId);
  const [priority, setPriority] = useState<CrmPriority>("normal");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);

  const deal = deals.find((d) => d.id === dealId);
  const dealHasNoContact = Boolean(deal && !deal.primary_contact_id);

  const reset = () => {
    setTitle("");
    setContactId("");
    setDealId("");
    setDueAt(tomorrowMorningValue());
    setAssignedTo(currentUserId);
    setPriority("normal");
    setDetails("");
  };

  const submit = async () => {
    setSaving(true);
    const result = await createTask({
      contactId: contactId || deal?.primary_contact_id || "",
      title,
      details,
      dueAt,
      assignedTo,
      priority,
      dealId: deal?.id ?? null,
      dealName: deal?.name ?? null,
    });
    setSaving(false);
    if (!result.ok) {
      onError(result.error ?? "Could not save that follow up.");
      return;
    }
    reset();
    onSaved();
  };

  const blocked = saving || busy;

  return (
    <Modal open={open} onClose={() => !blocked && onClose()} dismissable={!blocked} labelledBy="task-dialog-title">
      <div>
        <h2 id="task-dialog-title" className="text-lg font-bold tracking-tight text-white">
          New follow up
        </h2>
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
          A follow up hangs off a person. Naming a deal records it in the detail and files the task
          against that deal&apos;s main contact.
        </p>
      </div>

      <div>
        <label htmlFor="task-title" className={`${LABEL_CAPS} block mb-1.5`}>
          What to do
        </label>
        <input
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Send the revised pricing"
          className="admin-input h-9"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="task-contact" className={`${LABEL_CAPS} block mb-1.5`}>
            Person
          </label>
          <select
            id="task-contact"
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className="admin-input h-9 py-0"
          >
            <option value="">
              {deal?.primary_contact_id ? "The deal's main contact" : "Pick somebody"}
            </option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.full_name}
                {contact.company ? ` · ${contact.company}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="task-deal" className={`${LABEL_CAPS} block mb-1.5`}>
            Deal
          </label>
          <select
            id="task-deal"
            value={dealId}
            onChange={(e) => setDealId(e.target.value)}
            className="admin-input h-9 py-0"
          >
            <option value="">No deal</option>
            {deals.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {dealHasNoContact && (
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          That deal has no main contact yet, so pick the person this follow up is about.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="task-due" className={`${LABEL_CAPS} block mb-1.5`}>
            Due
          </label>
          <input
            id="task-due"
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="admin-input h-9"
          />
        </div>

        <div>
          <label htmlFor="task-assignee" className={`${LABEL_CAPS} block mb-1.5`}>
            Assigned to
          </label>
          <select
            id="task-assignee"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="admin-input h-9 py-0"
          >
            {people.map((person) => (
              <option key={person.user_id} value={person.user_id}>
                {person.full_name || person.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="task-priority" className={`${LABEL_CAPS} block mb-1.5`}>
          Priority
        </label>
        <select
          id="task-priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as CrmPriority)}
          className="admin-input h-9 py-0"
        >
          <option value="hot">Hot</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div>
        <label htmlFor="task-details" className={`${LABEL_CAPS} block mb-1.5`}>
          Detail
        </label>
        <textarea
          id="task-details"
          rows={3}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Anything the future you will need."
          className="admin-input"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          disabled={blocked}
          className="btn-glass h-9 px-4 text-xs font-medium disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={blocked || !title.trim() || (!contactId && !deal?.primary_contact_id)}
          className="h-9 px-4 rounded-full text-xs font-medium bg-violet-500/15 border border-violet-400/30 text-violet-200 hover:bg-violet-500/25 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Save follow up
        </button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Log a call or a meeting                                            */
/* ------------------------------------------------------------------ */

function LogDialog({
  kind,
  busy,
  contacts,
  onClose,
  onSaved,
  onError,
}: {
  kind: "call" | "meeting" | null;
  busy: boolean;
  contacts: QueueContact[];
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const [contactId, setContactId] = useState("");
  const [occurredAt, setOccurredAt] = useState(nowInputValue());
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const noun = kind === "meeting" ? "meeting" : "call";
  const blocked = saving || busy;

  const submit = async () => {
    if (!kind) return;
    setSaving(true);
    const result = await logContactActivity({ contactId, kind, body, occurredAt });
    setSaving(false);
    if (!result.ok) {
      onError(result.error ?? `Could not log that ${noun}.`);
      return;
    }
    setContactId("");
    setBody("");
    setOccurredAt(nowInputValue());
    onSaved();
  };

  return (
    <Modal
      open={Boolean(kind)}
      onClose={() => !blocked && onClose()}
      dismissable={!blocked}
      labelledBy="log-dialog-title"
    >
      <div>
        <h2 id="log-dialog-title" className="text-lg font-bold tracking-tight text-white">
          Log a {noun}
        </h2>
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
          This goes on the person&apos;s timeline and counts towards their activity.
        </p>
      </div>

      <div>
        <label htmlFor="log-contact" className={`${LABEL_CAPS} block mb-1.5`}>
          Who it was with
        </label>
        <select
          id="log-contact"
          value={contactId}
          onChange={(e) => setContactId(e.target.value)}
          className="admin-input h-9 py-0"
        >
          <option value="">Pick somebody</option>
          {contacts.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.full_name}
              {contact.company ? ` · ${contact.company}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="log-when" className={`${LABEL_CAPS} block mb-1.5`}>
          When
        </label>
        <input
          id="log-when"
          type="datetime-local"
          value={occurredAt}
          max={nowInputValue()}
          onChange={(e) => setOccurredAt(e.target.value)}
          className="admin-input h-9"
        />
      </div>

      <div>
        <label htmlFor="log-body" className={`${LABEL_CAPS} block mb-1.5`}>
          What was said
        </label>
        <textarea
          id="log-body"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="The short version, written while it is fresh."
          className="admin-input"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          disabled={blocked}
          className="btn-glass h-9 px-4 text-xs font-medium disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={blocked || !contactId}
          className="h-9 px-4 rounded-full text-xs font-medium bg-violet-500/15 border border-violet-400/30 text-violet-200 hover:bg-violet-500/25 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Log the {noun}
        </button>
      </div>
    </Modal>
  );
}
