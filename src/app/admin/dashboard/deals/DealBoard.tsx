"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Clock, Loader2, User } from "lucide-react";
import Modal from "@/components/admin/Modal";
import { DEAL_STAGES, type DealStage } from "@/lib/crm/constants";
import {
  BLOCK_CARD,
  BLOCK_CARD_HOVER,
  BLOCK_CHIP,
  BLOCK_COUNT_PILL,
  BLOCK_EMPTY,
  BLOCK_KEY_LABEL,
  BLOCK_LANE,
  BLOCK_LANE_WIDTH,
  BLOCK_TITLE,
  LABEL_CAPS,
  OVERDUE_TEXT,
} from "@/lib/crm/blockStyles";
import { markDealWon, setDealStage } from "./boardActions";

/**
 * The deal board.
 *
 * The same lane and card anatomy as the project board in the product app,
 * over a different object: a rail of fixed-width lanes, a count pill in
 * each header, and a four-row card carrying key, title, context and two
 * chips. The contact board on the CRM screen stays where it is. Two
 * boards, two objects, one navigation section, because a contact moving
 * through interest and a deal moving through money are different journeys.
 *
 * One rule shapes the component. Dragging into Won does not write Won.
 * `crm_deals_won_needs_close` requires a close date and a closer on the
 * same row, so the drop opens a dialog that collects the date and takes
 * the closer from the session. Every other column is written on drop.
 *
 * Drag is HTML5 rather than a drag library, matching the contact board.
 * The stage dropdown on every card is the affordance that actually gets
 * used on a phone, and it is never the thing dropped when the layout
 * narrows.
 */

export interface DealBoardRow {
  id: string;
  name: string;
  stage: DealStage;
  amount_cents: number;
  currency: string;
  expected_close_on: string | null;
  owner_user_id: string | null;
  account_name: string | null;
}

export interface BoardPerson {
  user_id: string;
  full_name: string | null;
  email: string;
}

interface DealBoardProps {
  deals: DealBoardRow[];
  people: BoardPerson[];
  /** Set when the read failed. The board shows the sentence and nothing else. */
  loadError?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Formatting                                                         */
/* ------------------------------------------------------------------ */

function money(cents: number, currency: string): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}

/** A `DATE` column, read as a calendar day rather than an instant. */
function parseDay(value: string | null): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("T")[0].split("-").map(Number);
  if (!y || !m || !d) return null;
  const parsed = new Date(y, m - 1, d);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function initialOf(person: BoardPerson | undefined): string {
  const source = person?.full_name?.trim() || person?.email || "";
  return source ? source[0]!.toUpperCase() : "?";
}

/** Today, as the `YYYY-MM-DD` a date input wants. */
function todayValue(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/* ------------------------------------------------------------------ */
/*  Board                                                              */
/* ------------------------------------------------------------------ */

export default function DealBoard({ deals, people, loadError = null }: DealBoardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [dragOver, setDragOver] = useState<DealStage | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState<DealBoardRow | null>(null);

  const personById = useMemo(() => {
    const map: Record<string, BoardPerson> = {};
    for (const person of people) map[person.user_id] = person;
    return map;
  }, [people]);

  const byStage = useMemo(() => {
    const grouped: Record<string, DealBoardRow[]> = {};
    for (const stage of DEAL_STAGES) grouped[stage.id] = [];
    for (const deal of deals) (grouped[deal.stage] ??= []).push(deal);
    return grouped;
  }, [deals]);

  const move = (deal: DealBoardRow, next: DealStage) => {
    if (deal.stage === next) return;
    setError(null);

    // Won is the one stage a drag cannot write, because the row needs a
    // close date and a closer alongside it.
    if (next === "won") {
      setClosing(deal);
      return;
    }

    setBusyId(deal.id);
    startTransition(async () => {
      const result = await setDealStage({ id: deal.id, stage: next });
      setBusyId(null);
      if (!result.ok) {
        setError(result.error ?? "That move did not save.");
        return;
      }
      router.refresh();
    });
  };

  const confirmWon = (closedOn: string) => {
    const deal = closing;
    if (!deal) return;
    setError(null);
    setBusyId(deal.id);
    startTransition(async () => {
      const result = await markDealWon({ id: deal.id, closedOn });
      setBusyId(null);
      if (!result.ok) {
        setError(result.error ?? "Could not mark that deal won.");
        return;
      }
      setClosing(null);
      router.refresh();
    });
  };

  if (loadError) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <p className="text-sm text-zinc-400 leading-relaxed">
          The deals could not be read. {loadError} Reload the page, and if it says this again the
          board is not the problem.
        </p>
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.01] p-10 text-center">
        <p className="text-sm text-zinc-400 leading-relaxed">
          Deals appear here once there is one to move.
        </p>
        <Link
          href="/admin/dashboard/deals"
          className="btn-glass mt-4 inline-flex h-9 px-4 text-xs font-medium"
        >
          Go to deals
        </Link>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
          <p className="text-xs text-zinc-300 leading-relaxed">{error}</p>
        </div>
      )}

      <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-3 md:snap-none">
        {DEAL_STAGES.map((stage) => {
          const column = byStage[stage.id] ?? [];
          const total = column.reduce((sum, deal) => sum + (deal.amount_cents || 0), 0);
          const currency = column[0]?.currency || "USD";

          return (
            <div
              key={stage.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(stage.id);
              }}
              onDragLeave={() => setDragOver((current) => (current === stage.id ? null : current))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                const id = e.dataTransfer.getData("text/plain");
                const deal = deals.find((d) => d.id === id);
                if (deal) move(deal, stage.id);
              }}
              className={`${BLOCK_LANE_WIDTH} flex flex-col ${BLOCK_LANE} transition-colors ${
                dragOver === stage.id ? "ring-1 ring-white/20" : ""
              }`}
            >
              <div className="mb-1 flex items-center gap-2 px-0.5">
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-white">
                  {stage.label}
                </p>
                <span className={BLOCK_COUNT_PILL}>{column.length}</span>
              </div>
              <p className="mb-2.5 px-0.5 text-[11px] tabular-nums text-zinc-400">
                {money(total, currency)}
              </p>

              <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5 md:max-h-[62vh]">
                {column.length === 0 ? (
                  <p className={BLOCK_EMPTY}>Nothing in this stage</p>
                ) : (
                  column.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      owner={deal.owner_user_id ? personById[deal.owner_user_id] : undefined}
                      onMove={move}
                      busy={busyId === deal.id && pending}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-zinc-400">
        Drag a card to move it, or use the stage dropdown on the card. Won asks for a close date.
      </p>

      <CloseDialog
        deal={closing}
        busy={pending}
        onCancel={() => setClosing(null)}
        onConfirm={confirmWon}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Card                                                               */
/* ------------------------------------------------------------------ */

function DealCard({
  deal,
  owner,
  onMove,
  busy,
}: {
  deal: DealBoardRow;
  owner: BoardPerson | undefined;
  onMove: (deal: DealBoardRow, next: DealStage) => void;
  busy: boolean;
}) {
  const due = parseDay(deal.expected_close_on);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const terminal = deal.stage === "won" || deal.stage === "lost";
  const late = Boolean(due && due.getTime() < today.getTime() && !terminal);

  return (
    <div
      draggable={!busy}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", deal.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`${BLOCK_CARD} ${BLOCK_CARD_HOVER} flex flex-col gap-2.5 cursor-grab active:cursor-grabbing ${
        busy ? "opacity-60" : ""
      }`}
    >
      {/* Row 1 — account + owner */}
      <div className="flex items-center justify-between gap-2">
        <span className={`${BLOCK_KEY_LABEL} min-w-0 truncate`}>
          {deal.account_name || "No account"}
        </span>
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-zinc-400" />
        ) : owner ? (
          <span
            title={owner.full_name || owner.email}
            className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-[9px] text-zinc-300"
          >
            {initialOf(owner)}
          </span>
        ) : (
          <span
            title="Nobody owns this yet"
            className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-dashed border-white/[0.14]"
          >
            <User className="h-3 w-3 text-zinc-400" />
          </span>
        )}
      </div>

      {/* Row 2 — the deal. A link, because until the record page existed a
          card could be dragged and re-staged and never opened: there was
          no way from this board to the deal it draws. `draggable={false}`
          so pulling the title moves the card rather than starting a link
          drag, and stopPropagation so a click reads the deal rather than
          being eaten by the card. */}
      <Link
        href={`/admin/dashboard/deals/${deal.id}`}
        draggable={false}
        onClick={(event) => event.stopPropagation()}
        className={`${BLOCK_TITLE} line-clamp-2 block hover:underline`}
      >
        {deal.name}
      </Link>

      {/* Row 3 — amount and expected close */}
      <div className="flex items-center justify-between gap-1.5">
        <span className={`${BLOCK_CHIP} tabular-nums`}>
          {money(deal.amount_cents, deal.currency)}
        </span>
        <span
          title={late ? "Past the expected close date" : undefined}
          className={`${BLOCK_CHIP} ${late ? OVERDUE_TEXT : due ? "" : "text-zinc-400"}`}
        >
          {late ? (
            <AlertCircle className="h-3 w-3 shrink-0" />
          ) : (
            <Clock className="h-3 w-3 shrink-0" />
          )}
          <span className="tabular-nums">
            {due
              ? due.toLocaleDateString(undefined, { month: "short", day: "numeric" })
              : "No close date"}
          </span>
        </span>
      </div>

      {/* Row 4 — the move that works on a phone */}
      <div>
        <label className="sr-only" htmlFor={`deal-stage-${deal.id}`}>
          Stage for {deal.name}
        </label>
        <select
          id={`deal-stage-${deal.id}`}
          value={deal.stage}
          disabled={busy}
          onChange={(e) => onMove(deal, e.target.value as DealStage)}
          className="admin-input h-9 py-0 text-[11px] font-medium cursor-pointer disabled:opacity-50"
        >
          {DEAL_STAGES.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Close dialog                                                       */
/* ------------------------------------------------------------------ */

function CloseDialog({
  deal,
  busy,
  onCancel,
  onConfirm,
}: {
  deal: DealBoardRow | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (closedOn: string) => void;
}) {
  const [closedOn, setClosedOn] = useState(todayValue());

  return (
    <Modal
      open={Boolean(deal)}
      onClose={() => !busy && onCancel()}
      dismissable={!busy}
      labelledBy="deal-close-title"
    >
      <div>
        <h2 id="deal-close-title" className="text-lg font-bold tracking-tight text-white">
          Mark {deal?.name} won
        </h2>
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
          A won deal is recorded with the day it closed and the person who closed it. The closer is
          you, taken from your login.
        </p>
      </div>

      <div>
        <label htmlFor="deal-closed-on" className={`${LABEL_CAPS} block mb-1.5`}>
          Closed on
        </label>
        <input
          id="deal-closed-on"
          type="date"
          value={closedOn}
          max={todayValue()}
          onChange={(e) => setClosedOn(e.target.value)}
          className="admin-input h-9"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="btn-glass h-9 px-4 text-xs font-medium disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(closedOn)}
          disabled={busy || !closedOn}
          className="h-9 px-4 rounded-full text-xs font-medium bg-violet-500/15 border border-violet-400/30 text-violet-200 hover:bg-violet-500/25 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
        >
          {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Mark won
        </button>
      </div>
    </Modal>
  );
}
