"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Modal from "@/components/admin/Modal";
import { DEAL_STAGES, type DealStage } from "@/lib/crm/constants";
import { markDealWon, setDealStage } from "./boardActions";

/**
 * The deal board.
 *
 * Modelled on the contact board, over a different object, and the two
 * stay separate: a contact moves through interest and a deal moves
 * through money, and collapsing them loses the distinction the commission
 * agreement is written in.
 *
 * One rule shapes the whole component. Dragging into Won does not write
 * Won. `crm_deals_won_needs_close` requires a close date and a closer on
 * the same row, so the drop opens a dialog that collects the date and
 * takes the closer from the session. Every other column is written on
 * drop.
 *
 * Two renderings, as on the contact board: five columns from `lg` up, one
 * stage at a time below that, and a stage dropdown on every card in both
 * so a phone is never worse than a mouse.
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

function closeDay(value: string | null): string {
  if (!value) return "No close date";
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "No close date";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
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

const OVERLINE = "text-xs uppercase font-bold tracking-widest text-gray-400";

/* ------------------------------------------------------------------ */
/*  Board                                                              */
/* ------------------------------------------------------------------ */

export default function DealBoard({ deals, people, loadError = null }: DealBoardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [mobileStage, setMobileStage] = useState<DealStage>("opportunity");
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
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-10 text-center">
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

      {/* ---------------------------------------------------------- */}
      {/* Board, from lg up                                           */}
      {/* ---------------------------------------------------------- */}
      <div className="hidden lg:block">
        <div className="flex gap-3 overflow-x-auto pb-3">
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
                onDragLeave={() =>
                  setDragOver((current) => (current === stage.id ? null : current))
                }
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(null);
                  const id = e.dataTransfer.getData("text/plain");
                  const deal = deals.find((d) => d.id === id);
                  if (deal) move(deal, stage.id);
                }}
                className={`w-[260px] xl:w-[280px] shrink-0 rounded-2xl border transition-colors ${
                  dragOver === stage.id
                    ? "border-white/25 bg-white/[0.05]"
                    : "border-white/5 bg-white/[0.02]"
                }`}
              >
                <div className="px-3 pt-3 pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className={OVERLINE}>{stage.label}</span>
                    <span className="ml-auto text-[10px] font-mono text-zinc-500 shrink-0">
                      {column.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 font-mono">
                    {money(total, currency)}
                  </p>
                </div>

                <div className="p-2 flex flex-col gap-2 min-h-[120px] max-h-[calc(100vh-22rem)] overflow-y-auto">
                  {column.length === 0 ? (
                    <p className="text-[10px] text-zinc-600 px-2 py-6 text-center leading-relaxed">
                      Nothing here yet
                    </p>
                  ) : (
                    column.map((deal) => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        owner={deal.owner_user_id ? personById[deal.owner_user_id] : undefined}
                        onMove={move}
                        busy={busyId === deal.id && pending}
                        draggable
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-zinc-600 mt-1">
          Drag a card to move it, or use the stage dropdown on the card. Won asks for a close date.
        </p>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* One stage at a time, below lg                               */}
      {/* ---------------------------------------------------------- */}
      <div className="lg:hidden space-y-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {DEAL_STAGES.map((stage) => {
            const column = byStage[stage.id] ?? [];
            const active = mobileStage === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setMobileStage(stage.id)}
                className={`shrink-0 flex items-center gap-2 px-3.5 min-h-[44px] rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? "bg-white text-black border-white"
                    : "bg-white/[0.03] text-zinc-400 border-white/8"
                }`}
              >
                {stage.label}
                <span className={`font-mono ${active ? "text-black/60" : "text-zinc-600"}`}>
                  {column.length}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-zinc-500 font-mono">
          {money(
            (byStage[mobileStage] ?? []).reduce((sum, deal) => sum + (deal.amount_cents || 0), 0),
            (byStage[mobileStage] ?? [])[0]?.currency || "USD"
          )}{" "}
          in {DEAL_STAGES.find((s) => s.id === mobileStage)?.label.toLowerCase()}
        </p>

        <div className="flex flex-col gap-2">
          {(byStage[mobileStage] ?? []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-8 text-center">
              <p className="text-xs text-zinc-500 leading-relaxed">
                No deals in this stage right now.
              </p>
            </div>
          ) : (
            (byStage[mobileStage] ?? []).map((deal) => (
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
  draggable = false,
}: {
  deal: DealBoardRow;
  owner: BoardPerson | undefined;
  onMove: (deal: DealBoardRow, next: DealStage) => void;
  busy: boolean;
  draggable?: boolean;
}) {
  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", deal.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`rounded-xl border bg-white/[0.02] transition-colors ${
        busy ? "border-white/20 opacity-60" : "border-white/8 hover:border-white/15"
      }`}
    >
      <div className="p-3 pb-2">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold text-white truncate">{deal.name}</span>
            <span className="block text-[11px] text-zinc-500 truncate">
              {deal.account_name || "No account"}
            </span>
          </div>
          {busy ? (
            <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin shrink-0 mt-0.5" />
          ) : (
            <span
              title={owner?.full_name || owner?.email || "Nobody owns this yet"}
              className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-medium bg-white/[0.04] border border-white/8 text-zinc-300"
            >
              {initialOf(owner)}
            </span>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-2 mt-2">
          <span className="text-sm font-mono text-white">
            {money(deal.amount_cents, deal.currency)}
          </span>
          <span className="text-[10px] text-zinc-500 truncate">
            {closeDay(deal.expected_close_on)}
          </span>
        </div>
      </div>

      <div className="px-2 pb-2">
        <label className="sr-only" htmlFor={`deal-stage-${deal.id}`}>
          Stage for {deal.name}
        </label>
        <select
          id={`deal-stage-${deal.id}`}
          value={deal.stage}
          disabled={busy}
          onChange={(e) => onMove(deal, e.target.value as DealStage)}
          className="admin-input h-11 lg:h-9 py-0 text-[11px] font-medium cursor-pointer disabled:opacity-50"
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
        <label htmlFor="deal-closed-on" className={`${OVERLINE} block mb-1.5`}>
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
