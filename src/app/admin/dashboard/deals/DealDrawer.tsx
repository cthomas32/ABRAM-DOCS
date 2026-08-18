"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Handshake, Loader2, RefreshCw, Save, X } from "lucide-react";
import {
  BILLING_PERIODS,
  CRM_MOTIONS,
  DEAL_STAGES,
  attributionSpec,
  formatMoney,
  type BillingPeriod,
  type CrmMotion,
  type DealStage,
} from "@/lib/crm/constants";
import type { CrmDeal } from "@/lib/crm/types";
import type { AttributionVerdict as Verdict } from "@/lib/crm/attribution";
import AttributionVerdict from "@/components/crm/AttributionVerdict";
import Overline from "@/components/admin/Overline";
import {
  createDeal,
  markLost,
  markWon,
  recheckDealAttribution,
  setDealStage,
  updateDeal,
  type AttributionRecheckResult,
  type DealInput,
} from "./actions";

/**
 * One deal, and every way of changing it.
 *
 * A drawer rather than a page, because what you nearly always want after
 * changing an amount is the list again.
 *
 * The two closing paths sit apart from the stage control. Won and lost
 * each write columns beyond the stage, and the database refuses a won
 * deal without a closer and a close date, so each gets a confirmation
 * with the field it needs rather than being one more option in a menu.
 */

export interface AccountOption {
  id: string;
  name: string;
  domain: string | null;
}

export interface ContactOption {
  id: string;
  full_name: string;
  account_id: string | null;
}

interface DealDrawerProps {
  /** Null opens the panel on a blank deal. */
  deal: CrmDeal | null;
  accounts: AccountOption[];
  contacts: ContactOption[];
  /** Display names for owner, source and closer. Keyed by user id. */
  memberNameById: Record<string, string>;
  canManage: boolean;
  onClose: () => void;
  /** Told after any successful write, so the list reloads. */
  onSaved: () => void;
}

interface Fields {
  name: string;
  accountId: string;
  primaryContactId: string;
  motion: CrmMotion;
  amount: string;
  mrr: string;
  currency: string;
  billingPeriod: BillingPeriod;
  planTier: string;
  seats: string;
  expectedCloseOn: string;
  promoCode: string;
  utmSource: string;
  notes: string;
}

/** Cents to the number somebody types. Empty stays empty, never "0". */
function toAmountInput(value: number | null | undefined): string {
  if (!value) return "";
  return String(value / 100);
}

/** What was typed, back to integer cents. */
function toCents(value: string): number {
  const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : 0;
}

function fieldsFrom(deal: CrmDeal | null): Fields {
  return {
    name: deal?.name ?? "",
    accountId: deal?.account_id ?? "",
    primaryContactId: deal?.primary_contact_id ?? "",
    motion: deal?.motion ?? "enterprise",
    amount: toAmountInput(deal?.amount_cents),
    mrr: toAmountInput(deal?.mrr_cents),
    currency: deal?.currency ?? "USD",
    billingPeriod: deal?.billing_period ?? "monthly",
    planTier: deal?.plan_tier ?? "",
    seats: deal?.seats ? String(deal.seats) : "",
    expectedCloseOn: deal?.expected_close_on ?? "",
    promoCode: deal?.promo_code ?? "",
    utmSource: deal?.utm_source ?? "",
    notes: deal?.notes ?? "",
  };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDay(iso: string | null): string {
  if (!iso) return "Not set";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "Not set"
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function DealDrawer({
  deal,
  accounts,
  contacts,
  memberNameById,
  canManage,
  onClose,
  onSaved,
}: DealDrawerProps) {
  const [fields, setFields] = useState<Fields>(() => fieldsFrom(deal));
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [closeOn, setCloseOn] = useState<string>(today());
  const [lostReason, setLostReason] = useState("");
  const [confirming, setConfirming] = useState<"won" | "lost" | null>(null);
  const [attributionMessage, setAttributionMessage] = useState<string | null>(null);
  /** The last recheck. Null until somebody presses the button. */
  const [freshAttribution, setFreshAttribution] = useState<AttributionRecheckResult | null>(null);

  const isNew = deal === null;

  useEffect(() => {
    setFields(fieldsFrom(deal));
    setMessage(null);
    setConfirming(null);
    setAttributionMessage(null);
    setFreshAttribution(null);
  }, [deal?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  /** Contacts at the chosen account first, everybody else after. */
  const contactOptions = useMemo(() => {
    if (!fields.accountId) return contacts;
    const here = contacts.filter((c) => c.account_id === fields.accountId);
    const elsewhere = contacts.filter((c) => c.account_id !== fields.accountId);
    return [...here, ...elsewhere];
  }, [contacts, fields.accountId]);

  const input: DealInput = {
    name: fields.name,
    accountId: fields.accountId,
    primaryContactId: fields.primaryContactId || null,
    motion: fields.motion,
    amountCents: toCents(fields.amount),
    mrrCents: toCents(fields.mrr),
    currency: fields.currency,
    billingPeriod: fields.billingPeriod,
    planTier: fields.planTier || null,
    seats: fields.seats ? Number.parseInt(fields.seats, 10) : null,
    expectedCloseOn: fields.expectedCloseOn || null,
    notes: fields.notes || null,
    promoCode: fields.promoCode || null,
    utmSource: fields.utmSource || null,
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const result = deal ? await updateDeal(deal.id, input) : await createDeal(input);
    setSaving(false);
    if (!result.ok) {
      setMessage(result.error ?? "That did not save.");
      return;
    }
    onSaved();
    if (isNew) onClose();
    else setMessage("Saved.");
  };

  const moveStage = async (stage: DealStage) => {
    if (!deal) return;
    setBusy("stage");
    setMessage(null);
    const result = await setDealStage(deal.id, stage);
    setBusy(null);
    if (!result.ok) setMessage(result.error ?? "That did not move.");
    else onSaved();
  };

  const close = async (outcome: "won" | "lost") => {
    if (!deal) return;
    setBusy(outcome);
    setMessage(null);
    const result =
      outcome === "won" ? await markWon(deal.id, { closedOn: closeOn }) : await markLost(deal.id, lostReason);
    setBusy(null);
    if (!result.ok) {
      setMessage(result.error ?? "That did not save.");
      return;
    }
    setConfirming(null);
    setLostReason("");
    // Winning settles attribution in the same action. The verdict comes
    // back with it, so the panel shows what was locked rather than the
    // answer from before the close.
    if (result.attribution) setFreshAttribution(result.attribution);
    if (result.warning) setMessage(result.warning);
    onSaved();
  };

  const recheck = async () => {
    if (!deal) return;
    setBusy("attribution");
    const result = await recheckDealAttribution(deal.id);
    setBusy(null);
    setFreshAttribution(result);
    setAttributionMessage(
      result.ok
        ? result.locked
          ? "Already settled. This is the answer that was locked with the close."
          : result.changed
            ? "Rechecked. The verdict changed."
            : "Rechecked. The stored verdict already said this."
        : (result.error ?? "Could not recheck attribution.")
    );
    if (result.ok && result.changed) onSaved();
  };

  const stage = deal?.stage ?? "opportunity";
  const stageSpec = DEAL_STAGES.find((s) => s.id === stage) ?? DEAL_STAGES[0];
  const attribution = attributionSpec(deal?.attribution_rule ?? "unattributed");

  /**
   * What the panel draws.
   *
   * A fresh recheck wins, because it carries the rejection list. With no
   * recheck in hand the stored columns are shown as a verdict with an
   * empty rejection list — the deal knows which rule fired, but not what
   * the others said, and pretending otherwise would be inventing history.
   */
  const shownVerdict: Verdict | null = freshAttribution?.verdict
    ? freshAttribution.verdict
    : deal?.attribution_rule
      ? {
          rule: deal.attribution_rule,
          userId: deal.sourced_by ?? null,
          ref: deal.attribution_ref ?? null,
          reason: deal.attribution_note ?? attribution.description,
          rejected: [],
        }
      : null;

  const attributionWarnings = freshAttribution?.warnings ?? [];
  const accountName = accounts.find((a) => a.id === fields.accountId)?.name ?? null;

  return (
    <AnimatePresence>
      <motion.div
        key="crm-deal-drawer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[60] flex"
        role="dialog"
        aria-modal="true"
        aria-label={isNew ? "New deal" : `Deal ${deal?.name}`}
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
          className="relative ml-auto w-full sm:max-w-[480px] h-full bg-[#0C0C0C] border-l border-white/8 flex flex-col"
        >
          {/* Header */}
          <div className="shrink-0 px-4 sm:px-5 pt-4 pb-3 border-b border-white/5">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-white/[0.04] border border-white/5 flex items-center justify-center">
                <Handshake className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold tracking-tight text-white break-words">
                  {isNew ? "New deal" : deal?.name}
                </h2>
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px] text-zinc-400">
                  <span className="break-words">{accountName ?? "No account picked yet"}</span>
                  {!isNew && deal?.expected_close_on && (
                    <>
                      <span className="text-white/15">·</span>
                      <span className="tabular-nums">
                        Closes {formatDay(`${deal.expected_close_on}T12:00:00Z`)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close deal"
                className="shrink-0 w-11 h-11 -mr-2 -mt-2 flex items-center justify-center rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isNew && (
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${stageSpec.badge}`}>
                  {stageSpec.label}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${attribution.badge}`}>
                  {attribution.label}
                </span>
                {deal?.amount_cents ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.04] border border-white/8 text-zinc-400 tabular-nums">
                    {formatMoney(deal.amount_cents, deal.currency)}
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 space-y-6">
            {message && (
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-3">
                <p className="text-[11px] text-zinc-300 leading-relaxed">{message}</p>
              </div>
            )}

            {/* Stage */}
            {!isNew && canManage && (
              <section className="space-y-3">
                <SectionLabel>Stage</SectionLabel>
                {/* One track, one selected. The product app's segmented
                    control shape rather than a row of loose buttons. */}
                <div
                  role="tablist"
                  aria-label="Deal stage"
                  className="inline-flex items-center h-9 p-0.5 rounded-full bg-white/[0.02] border border-white/8"
                >
                  {DEAL_STAGES.filter((s) => !s.terminal).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      role="tab"
                      aria-selected={stage === option.id}
                      disabled={busy === "stage"}
                      onClick={() => void moveStage(option.id)}
                      className={`h-full px-3.5 rounded-full text-xs font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-1 focus-visible:ring-white/20 disabled:opacity-50 ${
                        stage === option.id
                          ? "bg-white/[0.08] text-white"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {stage === "won" && (
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Closed {formatDay(deal?.closed_at ?? null)} by{" "}
                    {(deal?.closed_by && memberNameById[deal.closed_by]) || "somebody no longer listed"}.
                  </p>
                )}
                {stage === "lost" && deal?.lost_reason && (
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{deal.lost_reason}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirming(confirming === "won" ? null : "won")}
                    className="btn-glass h-9 px-4 text-[11px]"
                  >
                    Mark won
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(confirming === "lost" ? null : "lost")}
                    className="btn-glass h-9 px-4 text-[11px]"
                  >
                    Mark lost
                  </button>
                </div>

                {confirming === "won" && (
                  <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3.5 space-y-3">
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      A won deal is recorded with a close date and a closer. Both are written
                      together, because the commission ledger keys a collection month off the date
                      and pays nobody without it. You are the closer.
                    </p>
                    <Field label="Close date">
                      <input
                        type="date"
                        value={closeOn}
                        max={today()}
                        onChange={(e) => setCloseOn(e.target.value)}
                        className="admin-input h-9 py-0"
                      />
                    </Field>
                    <button
                      type="button"
                      disabled={busy === "won"}
                      onClick={() => void close("won")}
                      className="btn-primary h-9 px-4 text-[11px] disabled:opacity-50"
                    >
                      {busy === "won" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Record the close
                    </button>
                  </div>
                )}

                {confirming === "lost" && (
                  <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3.5 space-y-3">
                    <Field label="Why it was lost">
                      <input
                        value={lostReason}
                        onChange={(e) => setLostReason(e.target.value)}
                        placeholder="Went with an in-house build"
                        className="admin-input h-9 py-0"
                      />
                    </Field>
                    <button
                      type="button"
                      disabled={busy === "lost"}
                      onClick={() => void close("lost")}
                      className="btn-glass h-9 px-4 text-[11px] disabled:opacity-50"
                    >
                      {busy === "lost" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Record it as lost
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* The deal itself */}
            <section className="space-y-3">
              <SectionLabel>Deal</SectionLabel>

              <Field label="Name">
                <input
                  value={fields.name}
                  onChange={(e) => setFields((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Helix, 40 seat rollout"
                  className="admin-input h-9 py-0"
                />
              </Field>

              <Field label="Account">
                <select
                  value={fields.accountId}
                  onChange={(e) => setFields((f) => ({ ...f, accountId: e.target.value }))}
                  className="admin-input h-9 py-0 cursor-pointer"
                >
                  <option value="">Pick an account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                      {account.domain ? ` (${account.domain})` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Primary contact">
                <select
                  value={fields.primaryContactId}
                  onChange={(e) => setFields((f) => ({ ...f, primaryContactId: e.target.value }))}
                  className="admin-input h-9 py-0 cursor-pointer"
                >
                  <option value="">Nobody named yet</option>
                  {contactOptions.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.full_name}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Motion">
                  <select
                    value={fields.motion}
                    onChange={(e) =>
                      setFields((f) => ({ ...f, motion: e.target.value as CrmMotion }))
                    }
                    className="admin-input h-9 py-0 cursor-pointer"
                  >
                    {CRM_MOTIONS.map((motion) => (
                      <option key={motion.id} value={motion.id}>
                        {motion.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Expected close">
                  <input
                    type="date"
                    value={fields.expectedCloseOn}
                    onChange={(e) => setFields((f) => ({ ...f, expectedCloseOn: e.target.value }))}
                    className="admin-input h-9 py-0"
                  />
                </Field>

                <Field label={`Amount (${fields.currency})`}>
                  <input
                    inputMode="decimal"
                    value={fields.amount}
                    onChange={(e) => setFields((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="0"
                    className="admin-input h-9 py-0 tabular-nums"
                  />
                </Field>

                <Field label={`MRR (${fields.currency})`}>
                  <input
                    inputMode="decimal"
                    value={fields.mrr}
                    onChange={(e) => setFields((f) => ({ ...f, mrr: e.target.value }))}
                    placeholder="0"
                    className="admin-input h-9 py-0 tabular-nums"
                  />
                </Field>

                <Field label="Billing period">
                  <select
                    value={fields.billingPeriod}
                    onChange={(e) =>
                      setFields((f) => ({ ...f, billingPeriod: e.target.value as BillingPeriod }))
                    }
                    className="admin-input h-9 py-0 cursor-pointer"
                  >
                    {BILLING_PERIODS.map((period) => (
                      <option key={period.id} value={period.id}>
                        {period.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Currency">
                  <input
                    value={fields.currency}
                    onChange={(e) => setFields((f) => ({ ...f, currency: e.target.value }))}
                    maxLength={3}
                    className="admin-input h-9 py-0 uppercase"
                  />
                </Field>

                <Field label="Plan tier">
                  <input
                    value={fields.planTier}
                    onChange={(e) => setFields((f) => ({ ...f, planTier: e.target.value }))}
                    placeholder="Studio"
                    className="admin-input h-9 py-0"
                  />
                </Field>

                <Field label="Seats">
                  <input
                    inputMode="numeric"
                    value={fields.seats}
                    onChange={(e) => setFields((f) => ({ ...f, seats: e.target.value }))}
                    placeholder="0"
                    className="admin-input h-9 py-0 tabular-nums"
                  />
                </Field>
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Amounts here are a forecast. The commission ledger pays on cash that arrived and
                never reads these figures.
              </p>

              <Field label="Notes">
                <textarea
                  rows={4}
                  value={fields.notes}
                  onChange={(e) => setFields((f) => ({ ...f, notes: e.target.value }))}
                  className="admin-input resize-y leading-relaxed"
                />
              </Field>

              {canManage && (
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={saving}
                  className="btn-primary h-9 px-4 text-xs disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {saving ? "Saving" : isNew ? "Create deal" : "Save deal"}
                </button>
              )}
            </section>

            {/* Attribution. Derived, never chosen: the panel shows the rule
                that fired and every rule that did not, which is the
                question people actually ask. */}
            {!isNew && (
              <section className="space-y-3">
                <AttributionVerdict
                  verdict={shownVerdict}
                  locked={Boolean(deal?.attribution_locked_at)}
                  warnings={attributionWarnings}
                  action={
                    <div className="space-y-2">
                      {canManage && (
                        <button
                          type="button"
                          disabled={busy === "attribution"}
                          onClick={() => void recheck()}
                          className="btn-glass h-9 px-4 text-[11px] font-medium disabled:opacity-50"
                        >
                          {busy === "attribution" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                          Recheck attribution
                        </button>
                      )}
                      {deal?.attribution_locked_at && (
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Settled {formatDay(deal.attribution_locked_at)}. The ledger reads this
                          rather than working it out again.
                        </p>
                      )}
                      {attributionMessage && (
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          {attributionMessage}
                        </p>
                      )}
                    </div>
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Promo code">
                    <input
                      value={fields.promoCode}
                      onChange={(e) => setFields((f) => ({ ...f, promoCode: e.target.value }))}
                      className="admin-input h-9 py-0"
                    />
                  </Field>
                  <Field label="Tracked source">
                    <input
                      value={fields.utmSource}
                      onChange={(e) => setFields((f) => ({ ...f, utmSource: e.target.value }))}
                      className="admin-input h-9 py-0"
                    />
                  </Field>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  These two are the evidence the rules read. Save the deal after changing them, then
                  recheck.
                </p>
              </section>
            )}

            {/* Credit */}
            {!isNew && (
              <section className="space-y-2">
                <SectionLabel>Credit</SectionLabel>
                <Line
                  label="Sourced by"
                  value={
                    (deal?.sourced_by && memberNameById[deal.sourced_by]) ||
                    "Nobody. It walked in."
                  }
                  hint="Set once when the deal was created. Only an owner can move it."
                />
                <Line
                  label="Owner"
                  value={(deal?.owner_user_id && memberNameById[deal.owner_user_id]) || "Unassigned"}
                />
                <Line
                  label="Closed by"
                  value={(deal?.closed_by && memberNameById[deal.closed_by]) || "Not closed yet"}
                />
              </section>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Bits                                                               */
/* ------------------------------------------------------------------ */

/**
 * A section header inside the panel, and a label above a field.
 *
 * Both are the shared `Overline`, so the label recipe lives in exactly
 * one file. All these add is the placement: a hairline under a section
 * heading, and the wrapping `label` element around a field.
 */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Overline as="h3" className="pb-1 border-b border-white/5">
      {children}
    </Overline>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <Overline className="mb-1.5">{label}</Overline>
      {children}
    </label>
  );
}

function Line({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 py-1.5 border-b border-white/5 last:border-0">
      <span className="text-[11px] text-zinc-400">{label}</span>
      <span className="text-[11px] text-zinc-300 text-right">{value}</span>
      {hint && <span className="w-full text-[11px] text-zinc-400 leading-relaxed">{hint}</span>}
    </div>
  );
}
