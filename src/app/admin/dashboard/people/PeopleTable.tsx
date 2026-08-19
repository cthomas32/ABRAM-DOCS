"use client";

import React from "react";
import DataTable, { type Column } from "@/components/admin/DataTable";
import { LifecycleChip, ScoreChip, SourceChips } from "@/components/admin/PersonChips";
import { CRM_PRIORITIES, CRM_STAGES, type CrmStage } from "@/lib/crm/constants";
import { LIFECYCLE_STAGES, type LifecycleStage } from "@/lib/crm/people";
import { daysSince } from "@/lib/crm/savedViews";
import type { CrmContact } from "@/lib/crm/types";
import { formatDate } from "@/lib/crm/console";

/**
 * Every person, as a row.
 *
 * The columns are the questions a growth team asks across people rather
 * than about one: whose is this, how far along, when did anybody last
 * touch it. Three of them are editable in place — stage, lifecycle and
 * owner — because those are the three that change while somebody is
 * reading the list, and opening a drawer to change a dropdown is the
 * friction that stops a list being worked.
 *
 * Consent lives here too. When the subscribers screen went away the one
 * thing it did that nothing else did was show whether somebody had
 * agreed to be emailed, so that is a column now rather than a page.
 */

export interface PeoplePerson {
  user_id: string;
  full_name: string | null;
  email: string;
}

export interface PeopleTableProps {
  contacts: CrmContact[];
  scoreById: Record<string, number>;
  people: PeoplePerson[];
  accountNameById: Record<string, string>;
  selected: Set<string>;
  onSelectedChange: (next: Set<string>) => void;
  onOpen: (contact: CrmContact) => void;
  canWrite: boolean;
  /** One field on one person. The caller writes and reports. */
  onPatch: (contact: CrmContact, patch: Partial<CrmContact>) => void;
  empty: React.ReactNode;
}

const CELL_SELECT =
  "bg-transparent border border-white/10 rounded-md h-7 px-1.5 text-[11px] text-zinc-200 cursor-pointer hover:border-white/25 disabled:opacity-50 disabled:cursor-default";

function lastTouchLabel(contact: CrmContact): string {
  const days = daysSince(contact.last_activity_at);
  if (days === null) return "Never";
  if (days < 1) return "Today";
  const whole = Math.floor(days);
  return whole === 1 ? "Yesterday" : `${whole}d ago`;
}

export default function PeopleTable({
  contacts,
  scoreById,
  people,
  accountNameById,
  selected,
  onSelectedChange,
  onOpen,
  canWrite,
  onPatch,
  empty,
}: PeopleTableProps) {
  const nameOf = (userId: string | null) => {
    if (!userId) return "Nobody";
    const person = people.find((entry) => entry.user_id === userId);
    return person?.full_name || person?.email || "Somebody";
  };

  const columns: Column<CrmContact>[] = [
    {
      id: "name",
      label: "Name",
      fixed: true,
      sortValue: (contact) => contact.full_name.toLowerCase(),
      className: "min-w-[180px]",
      render: (contact) => (
        <span className="block">
          <span className="block text-xs text-white truncate">{contact.full_name}</span>
          <span className="block text-[11px] text-zinc-500 truncate">
            {contact.email || "No email"}
          </span>
        </span>
      ),
    },
    {
      id: "company",
      label: "Company",
      sortValue: (contact) => (contact.company ?? "").toLowerCase(),
      render: (contact) => (
        <span className="block truncate max-w-[180px]">
          {contact.account_id ? accountNameById[contact.account_id] ?? contact.company : contact.company}
          {contact.job_title && (
            <span className="block text-[11px] text-zinc-500 truncate">{contact.job_title}</span>
          )}
        </span>
      ),
    },
    {
      id: "lifecycle",
      label: "Lifecycle",
      sortValue: (contact) => contact.lifecycle_stage,
      render: (contact) =>
        canWrite ? (
          <select
            value={contact.lifecycle_stage}
            onChange={(event) =>
              onPatch(contact, { lifecycle_stage: event.target.value as LifecycleStage })
            }
            aria-label={`Lifecycle for ${contact.full_name}`}
            className={CELL_SELECT}
          >
            {LIFECYCLE_STAGES.map((entry) => (
              <option key={entry.id} value={entry.id} className="bg-zinc-950">
                {entry.label}
              </option>
            ))}
          </select>
        ) : (
          <LifecycleChip stage={contact.lifecycle_stage} />
        ),
    },
    {
      id: "stage",
      label: "Stage",
      sortValue: (contact) => contact.stage,
      render: (contact) =>
        canWrite ? (
          <select
            value={contact.stage}
            onChange={(event) => onPatch(contact, { stage: event.target.value as CrmStage })}
            aria-label={`Stage for ${contact.full_name}`}
            className={CELL_SELECT}
          >
            {CRM_STAGES.map((stage) => (
              <option key={stage.id} value={stage.id} className="bg-zinc-950">
                {stage.label}
              </option>
            ))}
          </select>
        ) : (
          contact.stage
        ),
    },
    {
      id: "owner",
      label: "Owner",
      sortValue: (contact) => nameOf(contact.owner_user_id),
      render: (contact) =>
        canWrite ? (
          <select
            value={contact.owner_user_id ?? ""}
            onChange={(event) => onPatch(contact, { owner_user_id: event.target.value || null })}
            aria-label={`Owner of ${contact.full_name}`}
            className={CELL_SELECT}
          >
            <option value="" className="bg-zinc-950">
              Nobody
            </option>
            {people.map((person) => (
              <option key={person.user_id} value={person.user_id} className="bg-zinc-950">
                {person.full_name || person.email}
              </option>
            ))}
          </select>
        ) : (
          nameOf(contact.owner_user_id)
        ),
    },
    {
      id: "score",
      label: "Score",
      numeric: true,
      sortValue: (contact) => scoreById[contact.id] ?? 0,
      render: (contact) => <ScoreChip score={scoreById[contact.id]} />,
    },
    {
      id: "last_touch",
      label: "Last touch",
      sortValue: (contact) => contact.last_activity_at ?? "",
      render: (contact) => (
        <span className="whitespace-nowrap text-zinc-400">{lastTouchLabel(contact)}</span>
      ),
    },
    {
      id: "next_step",
      label: "Next step",
      defaultOn: false,
      sortValue: (contact) => contact.next_follow_up_at ?? "",
      render: (contact) =>
        canWrite ? (
          <input
            type="date"
            value={(contact.next_follow_up_at ?? "").slice(0, 10)}
            onChange={(event) =>
              onPatch(contact, {
                next_follow_up_at: event.target.value
                  ? new Date(`${event.target.value}T09:00:00Z`).toISOString()
                  : null,
              })
            }
            aria-label={`Next step for ${contact.full_name}`}
            className={CELL_SELECT}
          />
        ) : (
          formatDate(contact.next_follow_up_at)
        ),
    },
    {
      id: "sources",
      label: "How they arrived",
      defaultOn: false,
      render: (contact) => <SourceChips sources={contact.sources} limit={2} />,
    },
    {
      id: "consent",
      label: "Consent",
      defaultOn: false,
      sortValue: (contact) => (contact.consent_marketing ? 1 : 0),
      render: (contact) => (
        <span className="text-zinc-400 whitespace-nowrap">
          {contact.consent_marketing
            ? `Yes, ${formatDate(contact.consent_at) || "date unknown"}`
            : contact.subscriber_id
              ? "On the list"
              : "Not given"}
        </span>
      ),
    },
    {
      id: "priority",
      label: "Priority",
      defaultOn: false,
      sortValue: (contact) => contact.priority,
      render: (contact) =>
        CRM_PRIORITIES.find((entry) => entry.id === contact.priority)?.label ?? contact.priority,
    },
    {
      id: "tags",
      label: "Tags",
      defaultOn: false,
      render: (contact) => (
        <span className="truncate block max-w-[160px] text-zinc-400">
          {contact.tags.join(", ") || "None"}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      rows={contacts}
      columns={columns}
      rowId={(contact) => contact.id}
      onOpen={onOpen}
      selected={selected}
      onSelectedChange={onSelectedChange}
      empty={empty}
      storageKey="people"
    />
  );
}
