"use client";

import React, { useMemo, useState, useTransition } from "react";
import { Loader2, Mail, Plus, Route, Trash2, X } from "lucide-react";
import Overline, { FieldLabel } from "@/components/admin/Overline";
import Panel, { EmptyPanel } from "@/components/admin/Panel";
import { StatRow } from "@/components/admin/StatTile";
import { BLOCK_CARD, BLOCK_CHIP, CONTROL_HEIGHT } from "@/lib/crm/blockStyles";
import { CRM_EMAIL_TEMPLATES } from "@/lib/crm/emailTemplates";
import {
  MAX_DAY_OFFSET,
  offsetLabel,
  sequenceSpan,
  stepsInOrder,
  taskTitleFor,
  type CrmSequence,
  type CrmSequenceEnrollment,
  type CrmSequenceStep,
  type SequenceStepKind,
} from "@/lib/crm/sequences";
import {
  addStep,
  cancelEnrollment,
  createSequence,
  deleteSequence,
  deleteStep,
  enrollContact,
  updateSequence,
} from "./actions";

/**
 * Writing a sequence, and putting somebody on one.
 *
 * Two columns and no wizard. The left is every sequence you own; the
 * right is the one you have open, its steps in the order they happen, and
 * who is currently on it. A sequence is short enough that a step editor
 * with drag handles and a preview pane would be more machinery than the
 * thing it edits.
 *
 * Every write goes through a server action, so this component holds no
 * Supabase client and cannot become a second place the rules are decided.
 */

export interface EnrolledPerson {
  id: string;
  full_name: string;
  company: string | null;
  email: string | null;
}

interface Props {
  sequences: CrmSequence[];
  steps: CrmSequenceStep[];
  enrollments: CrmSequenceEnrollment[];
  contacts: EnrolledPerson[];
  warning: string | null;
}

export default function SequencesManager({
  sequences,
  steps,
  enrollments,
  contacts,
  warning,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(sequences[0]?.id ?? null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [newName, setNewName] = useState("");

  const open = sequences.find((sequence) => sequence.id === openId) ?? null;
  const openSteps = useMemo(
    () => stepsInOrder(steps.filter((step) => step.sequence_id === openId)),
    [steps, openId]
  );
  const openEnrollments = useMemo(
    () => enrollments.filter((entry) => entry.sequence_id === openId),
    [enrollments, openId]
  );

  const contactById = useMemo(() => {
    const map = new Map<string, EnrolledPerson>();
    for (const contact of contacts) map.set(contact.id, contact);
    return map;
  }, [contacts]);

  const run = (work: () => Promise<{ ok: boolean; error?: string; message?: string }>) => {
    startTransition(async () => {
      const result = await work();
      setNotice(result.error ?? result.message ?? null);
    });
  };

  const stepCount = steps.length;
  const activeCount = sequences.filter((sequence) => sequence.is_active).length;

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Sequences
        </h1>
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed max-w-2xl">
          A sequence is an ordered set of follow ups with day offsets. Enrolling somebody puts every
          step in the queue, dated from today. Nothing sends on its own: an email step becomes a
          follow up that opens the composer with the template already in it.
        </p>
      </header>

      {warning && (
        <Panel className="mb-6" title="Some of this did not load">
          {warning}
        </Panel>
      )}

      {notice && (
        <Panel className="mb-6" title="What happened">
          <span className="flex items-start gap-3">
            <span className="flex-1">{notice}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Dismiss"
              className="text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        </Panel>
      )}

      <StatRow
        className="mb-8"
        stats={[
          { label: "Sequences", value: String(sequences.length), hint: `${activeCount} running` },
          { label: "Steps written", value: String(stepCount) },
          {
            label: "People on one",
            value: String(enrollments.length),
            hint: "Counted across every sequence you can see",
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* The list */}
        <div className="space-y-3">
          <Overline as="h2">Your sequences</Overline>

          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const name = newName.trim();
              if (!name) return;
              setNewName("");
              run(() => createSequence({ name }));
            }}
          >
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Name a new one"
              aria-label="Name a new sequence"
              className={`admin-input ${CONTROL_HEIGHT} py-0`}
            />
            <button
              type="submit"
              disabled={pending || !newName.trim()}
              className={`btn-primary px-3 ${CONTROL_HEIGHT} text-xs rounded-full shrink-0 disabled:opacity-50`}
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </form>

          {sequences.length === 0 ? (
            <EmptyPanel title="No sequences yet." icon={<Route className="w-6 h-6" />}>
              Name one above. Three steps over ten days is a real sequence and takes a minute to
              write.
            </EmptyPanel>
          ) : (
            <ul className="space-y-2">
              {sequences.map((sequence) => {
                const own = steps.filter((step) => step.sequence_id === sequence.id);
                const selected = sequence.id === openId;
                return (
                  <li key={sequence.id}>
                    <button
                      type="button"
                      onClick={() => setOpenId(sequence.id)}
                      className={`${BLOCK_CARD} w-full text-left ${
                        selected ? "border-white/25" : "hover:border-white/20"
                      }`}
                    >
                      <span className="block text-sm text-white truncate">{sequence.name}</span>
                      <span className="block text-[11px] text-zinc-400 mt-1">
                        {own.length} {own.length === 1 ? "step" : "steps"}
                        {own.length > 0 && ` over ${sequenceSpan(own)} days`}
                        {!sequence.is_active && " · paused"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* The open one */}
        <div className="min-w-0">
          {!open ? (
            <EmptyPanel title="Nothing open.">
              Pick a sequence on the left, or name a new one.
            </EmptyPanel>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg text-white truncate">{open.name}</h2>
                  {open.description && (
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed max-w-xl">
                      {open.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      run(() => updateSequence({ id: open.id, isActive: !open.is_active }))
                    }
                    className={`btn-glass px-4 ${CONTROL_HEIGHT} text-[11px] font-medium rounded-full disabled:opacity-50`}
                  >
                    {open.is_active ? "Pause" : "Start"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      run(() => deleteSequence({ id: open.id }));
                      setOpenId(null);
                    }}
                    className={`btn-ghost px-4 ${CONTROL_HEIGHT} text-[11px] font-medium rounded-full disabled:opacity-50`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              </div>

              {/* Steps */}
              <section>
                <Overline as="h3" className="mb-3">
                  Steps
                </Overline>

                {openSteps.length === 0 ? (
                  <EmptyPanel title="No steps yet.">
                    A step is a day offset and a thing to do. Add the first one below.
                  </EmptyPanel>
                ) : (
                  <ol className="space-y-2 mb-4">
                    {openSteps.map((step) => (
                      <li key={step.id} className={`${BLOCK_CARD} flex items-start gap-3`}>
                        <span className={`${BLOCK_CHIP} shrink-0`}>
                          {offsetLabel(step.day_offset)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm text-white truncate">
                            {taskTitleFor(step)}
                          </span>
                          {step.details && (
                            <span className="block text-[11px] text-zinc-400 mt-1 leading-relaxed">
                              {step.details}
                            </span>
                          )}
                          {step.kind === "email" && (
                            <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-zinc-500">
                              <Mail className="w-3 h-3" />
                              {CRM_EMAIL_TEMPLATES.find((entry) => entry.key === step.template_key)
                                ?.name ?? "No template picked"}
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => run(() => deleteStep({ id: step.id }))}
                          aria-label={`Remove ${step.title}`}
                          className="text-zinc-400 hover:text-white transition-colors shrink-0 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ol>
                )}

                <StepForm
                  pending={pending}
                  onAdd={(input) => run(() => addStep({ sequenceId: open.id, ...input }))}
                />
              </section>

              {/* Who is on it */}
              <section>
                <Overline as="h3" className="mb-3">
                  On this sequence
                </Overline>

                <EnrollForm
                  pending={pending}
                  contacts={contacts}
                  alreadyOn={new Set(openEnrollments.map((entry) => entry.contact_id))}
                  onEnroll={(contactId) =>
                    run(() => enrollContact({ sequenceId: open.id, contactId }))
                  }
                />

                {openEnrollments.length === 0 ? (
                  <p className="text-[11px] text-zinc-400 mt-3">
                    Nobody is on this one yet. Enrolling writes the follow ups straight into the
                    queue.
                  </p>
                ) : (
                  <ul className="space-y-2 mt-4">
                    {openEnrollments.map((entry) => {
                      const person = contactById.get(entry.contact_id);
                      return (
                        <li key={entry.id} className={`${BLOCK_CARD} flex items-center gap-3`}>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm text-white truncate">
                              {person?.full_name ?? "Somebody you can no longer see"}
                            </span>
                            <span className="block text-[11px] text-zinc-400 mt-0.5">
                              Started {entry.started_on} · {entry.tasks_created} follow ups
                            </span>
                          </span>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => run(() => cancelEnrollment({ id: entry.id }))}
                            className={`btn-ghost px-3 ${CONTROL_HEIGHT} text-[11px] font-medium rounded-full disabled:opacity-50`}
                          >
                            Take off
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>
      </div>

      {pending && (
        <p className="mt-6 text-[11px] text-zinc-400 flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" />
          Saving.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Adding a step                                                      */
/* ------------------------------------------------------------------ */

function StepForm({
  pending,
  onAdd,
}: {
  pending: boolean;
  onAdd: (input: {
    kind: SequenceStepKind;
    title: string;
    details?: string | null;
    templateKey?: string | null;
    dayOffset: number;
  }) => void;
}) {
  const [kind, setKind] = useState<SequenceStepKind>("task");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [templateKey, setTemplateKey] = useState(CRM_EMAIL_TEMPLATES[0]?.key ?? "");
  const [dayOffset, setDayOffset] = useState("0");

  return (
    <form
      className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!title.trim()) return;
        onAdd({
          kind,
          title: title.trim(),
          details: details.trim() || null,
          templateKey: kind === "email" ? templateKey : null,
          dayOffset: Number(dayOffset) || 0,
        });
        setTitle("");
        setDetails("");
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <FieldLabel htmlFor="step-kind">Kind</FieldLabel>
          <select
            id="step-kind"
            value={kind}
            onChange={(event) => setKind(event.target.value as SequenceStepKind)}
            className={`admin-input ${CONTROL_HEIGHT} py-0 cursor-pointer`}
          >
            <option value="task">Something to do</option>
            <option value="email">Send an email</option>
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="step-day">Day</FieldLabel>
          <input
            id="step-day"
            type="number"
            min={0}
            max={MAX_DAY_OFFSET}
            value={dayOffset}
            onChange={(event) => setDayOffset(event.target.value)}
            className={`admin-input ${CONTROL_HEIGHT} py-0`}
          />
        </div>
        {kind === "email" && (
          <div>
            <FieldLabel htmlFor="step-template">Template</FieldLabel>
            <select
              id="step-template"
              value={templateKey}
              onChange={(event) => setTemplateKey(event.target.value)}
              className={`admin-input ${CONTROL_HEIGHT} py-0 cursor-pointer`}
            >
              {CRM_EMAIL_TEMPLATES.map((template) => (
                <option key={template.key} value={template.key}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <FieldLabel htmlFor="step-title">What the step is</FieldLabel>
        <input
          id="step-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Check whether the deck landed"
          className={`admin-input ${CONTROL_HEIGHT} py-0`}
        />
      </div>

      <div>
        <FieldLabel htmlFor="step-details" hint="(optional)">
          Detail
        </FieldLabel>
        <textarea
          id="step-details"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          rows={2}
          className="admin-input"
        />
      </div>

      <button
        type="submit"
        disabled={pending || !title.trim()}
        className={`btn-primary px-4 ${CONTROL_HEIGHT} text-xs rounded-full disabled:opacity-50`}
      >
        <Plus className="w-3.5 h-3.5" />
        Add step
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Enrolling                                                          */
/* ------------------------------------------------------------------ */

function EnrollForm({
  pending,
  contacts,
  alreadyOn,
  onEnroll,
}: {
  pending: boolean;
  contacts: EnrolledPerson[];
  alreadyOn: Set<string>;
  onEnroll: (contactId: string) => void;
}) {
  const [contactId, setContactId] = useState("");
  const available = contacts.filter((contact) => !alreadyOn.has(contact.id));

  return (
    <form
      className="flex flex-col sm:flex-row gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!contactId) return;
        onEnroll(contactId);
        setContactId("");
      }}
    >
      <select
        value={contactId}
        onChange={(event) => setContactId(event.target.value)}
        aria-label="Pick somebody to enrol"
        className={`admin-input ${CONTROL_HEIGHT} py-0 cursor-pointer`}
      >
        <option value="">Pick somebody</option>
        {available.map((contact) => (
          <option key={contact.id} value={contact.id}>
            {contact.full_name}
            {contact.company ? ` · ${contact.company}` : ""}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending || !contactId}
        className={`btn-glass px-4 ${CONTROL_HEIGHT} text-xs font-medium rounded-full shrink-0 disabled:opacity-50`}
      >
        Enrol
      </button>
    </form>
  );
}
