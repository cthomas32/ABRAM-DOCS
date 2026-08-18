"use client";

import React, { useMemo, useState } from "react";
import { Flame, Loader2, MapPin, WifiOff } from "lucide-react";
import { CRM_STAGES, stageSpec, type CrmStage } from "@/lib/crm/constants";
import { LifecycleChip, SourceChips } from "@/components/admin/PersonChips";
import type { CrmContact } from "@/lib/crm/types";
import { formatDate, isOverdue, isDueOrOverdue } from "./lib";

/**
 * The pipeline.
 *
 * Two renderings of the same list, because six columns and a 320px screen
 * cannot both be true. From `lg` up it is a board and a card can be dragged
 * across it. Below that it is one stage at a time with a row of counts to
 * switch between them.
 *
 * Every card carries a stage dropdown in both renderings. Drag is a nicety
 * for someone at a desk; the dropdown is what actually gets used, standing
 * in a hotel lobby holding a coffee, and it is never the thing that gets
 * dropped when the layout narrows.
 */

interface PipelineBoardProps {
  contacts: CrmContact[];
  eventNameById: Record<string, string>;
  onOpen: (contact: CrmContact) => void;
  onMoveStage: (contact: CrmContact, next: CrmStage) => void;
  /** The contact whose stage write is in flight, so its card can say so. */
  busyId: string | null;
  /** Rendered inside the first empty column when nothing matches at all. */
  emptyState: React.ReactNode;
}

export default function PipelineBoard({
  contacts,
  eventNameById,
  onOpen,
  onMoveStage,
  busyId,
  emptyState,
}: PipelineBoardProps) {
  const [mobileStage, setMobileStage] = useState<CrmStage>("new");
  const [dragOver, setDragOver] = useState<CrmStage | null>(null);

  const byStage = useMemo(() => {
    const grouped: Record<string, CrmContact[]> = {};
    for (const stage of CRM_STAGES) grouped[stage.id] = [];
    for (const contact of contacts) {
      (grouped[contact.stage] ??= []).push(contact);
    }
    return grouped;
  }, [contacts]);

  if (contacts.length === 0) {
    return <>{emptyState}</>;
  }

  const handleDrop = (stage: CrmStage, event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(null);
    const id = event.dataTransfer.getData("text/plain");
    const contact = contacts.find((c) => c.id === id);
    if (contact && contact.stage !== stage) onMoveStage(contact, stage);
  };

  return (
    <>
      {/* ---------------------------------------------------------- */}
      {/* Board, from lg up                                           */}
      {/* ---------------------------------------------------------- */}
      <div className="hidden lg:block">
        <div className="flex gap-3 overflow-x-auto pb-3">
          {CRM_STAGES.map((stage) => {
            const column = byStage[stage.id] ?? [];
            return (
              <div
                key={stage.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(stage.id);
                }}
                onDragLeave={() => setDragOver((current) => (current === stage.id ? null : current))}
                onDrop={(e) => handleDrop(stage.id, e)}
                className={`w-[260px] xl:w-[280px] shrink-0 rounded-2xl border transition-colors ${
                  dragOver === stage.id
                    ? "border-white/25 bg-white/[0.05]"
                    : "border-white/5 bg-zinc-950/40"
                }`}
              >
                <div className="px-3 pt-3 pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${stage.dot}`} />
                    <span className="text-[11px] font-semibold text-zinc-200 truncate">
                      {stage.label}
                    </span>
                    <span className="ml-auto text-[10px] font-mono text-zinc-400 shrink-0">
                      {column.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed mt-1">
                    {stage.description}
                  </p>
                </div>

                <div className="p-2 flex flex-col gap-2 min-h-[120px] max-h-[calc(100vh-25rem)] overflow-y-auto">
                  {column.length === 0 ? (
                    <p className="text-[10px] text-zinc-700 px-2 py-6 text-center leading-relaxed">
                      Nothing here yet
                    </p>
                  ) : (
                    column.map((contact) => (
                      <ContactCard
                        key={contact.id}
                        contact={contact}
                        eventName={contact.event_id ? eventNameById[contact.event_id] : undefined}
                        onOpen={onOpen}
                        onMoveStage={onMoveStage}
                        busy={busyId === contact.id}
                        draggable
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-zinc-400 mt-1">
          Drag a card to move it, or use the stage dropdown on the card.
        </p>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* One stage at a time, below lg                               */}
      {/* ---------------------------------------------------------- */}
      <div className="lg:hidden space-y-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {CRM_STAGES.map((stage) => {
            const count = (byStage[stage.id] ?? []).length;
            const active = mobileStage === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setMobileStage(stage.id)}
                className={`shrink-0 flex items-center gap-2 px-3.5 min-h-[44px] rounded-full text-xs font-semibold border transition-colors ${
                  active
                    ? "bg-white text-black border-white"
                    : "bg-white/[0.03] text-zinc-400 border-white/8"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-black/40" : stage.dot}`} />
                {stage.label}
                <span className={`font-mono ${active ? "text-black/60" : "text-zinc-400"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-zinc-400 leading-relaxed">
          {stageSpec(mobileStage).description}
        </p>

        <div className="flex flex-col gap-2">
          {(byStage[mobileStage] ?? []).length === 0 ? (
            <p className="text-xs text-zinc-400 py-10 text-center leading-relaxed">
              No one is in {stageSpec(mobileStage).label} right now.
            </p>
          ) : (
            (byStage[mobileStage] ?? []).map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                eventName={contact.event_id ? eventNameById[contact.event_id] : undefined}
                onOpen={onOpen}
                onMoveStage={onMoveStage}
                busy={busyId === contact.id}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Card                                                               */
/* ------------------------------------------------------------------ */

function ContactCard({
  contact,
  eventName,
  onOpen,
  onMoveStage,
  busy,
  draggable = false,
}: {
  contact: CrmContact;
  eventName?: string;
  onOpen: (contact: CrmContact) => void;
  onMoveStage: (contact: CrmContact, next: CrmStage) => void;
  busy: boolean;
  draggable?: boolean;
}) {
  const followUpDue = isDueOrOverdue(contact.next_follow_up_at);
  const followUpLate = isOverdue(contact.next_follow_up_at);

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", contact.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`rounded-xl border bg-zinc-950/60 transition-colors ${
        busy ? "border-white/20 opacity-60" : "border-white/8 hover:border-white/15"
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(contact)}
        className="w-full text-left p-3 pb-2 cursor-pointer"
      >
        <span className="flex items-start gap-2">
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold text-white truncate">
              {contact.full_name}
            </span>
            <span className="block text-[11px] text-zinc-400 truncate">
              {[contact.job_title, contact.company].filter(Boolean).join(" at ") || "No company noted"}
            </span>
          </span>
          {busy ? (
            <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin shrink-0 mt-0.5" />
          ) : contact.priority === "hot" ? (
            <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" aria-label="Hot lead" />
          ) : null}
        </span>

        {/* Where the person is, and how they got here. The pipeline
            column already says what they are being worked towards; these
            say who they are, which the column cannot. */}
        <span className="flex flex-wrap items-center gap-1 mt-2">
          <LifecycleChip stage={contact.lifecycle_stage} />
          <SourceChips sources={contact.sources} limit={2} />
        </span>

        {(eventName || contact.met_context) && (
          <span className="flex items-start gap-1.5 mt-2 text-[10px] text-zinc-400 leading-relaxed">
            <MapPin className="w-3 h-3 shrink-0 mt-px" />
            <span className="min-w-0 break-words">
              {[eventName, contact.met_context].filter(Boolean).join(" / ")}
            </span>
          </span>
        )}

        {contact.tags.length > 0 && (
          <span className="flex flex-wrap gap-1 mt-2">
            {contact.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/[0.04] border border-white/8 text-zinc-400"
              >
                {tag}
              </span>
            ))}
            {contact.tags.length > 4 && (
              <span className="text-[9px] text-zinc-400 self-center">
                +{contact.tags.length - 4}
              </span>
            )}
          </span>
        )}

        <span className="flex flex-wrap items-center gap-2 mt-2 text-[10px]">
          {followUpDue && (
            <span
              className={`px-1.5 py-0.5 rounded border font-medium ${
                followUpLate
                  ? "bg-amber-500/10 border-amber-500/25 text-amber-200"
                  : "bg-white/[0.04] border-white/10 text-zinc-300"
              }`}
            >
              {followUpLate ? "Overdue" : "Due today"} {formatDate(contact.next_follow_up_at)}
            </span>
          )}
          {contact.captured_offline && (
            <span className="inline-flex items-center gap-1 text-zinc-400">
              <WifiOff className="w-3 h-3" />
              Typed offline
            </span>
          )}
        </span>
      </button>

      {/* The dropdown is the primary way to move somebody, on every screen. */}
      <div className="px-2 pb-2">
        <label className="sr-only" htmlFor={`stage-${contact.id}`}>
          Stage for {contact.full_name}
        </label>
        <select
          id={`stage-${contact.id}`}
          value={contact.stage}
          disabled={busy}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onMoveStage(contact, e.target.value as CrmStage)}
          className="admin-input h-11 lg:h-8 py-0 text-[11px] font-semibold cursor-pointer disabled:opacity-50"
        >
          {CRM_STAGES.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
