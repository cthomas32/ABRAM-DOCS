"use client";

import React from "react";
import Overline, { FieldLabel } from "@/components/admin/Overline";
import {
  BILLING_PERIODS,
  CRM_MOTIONS,
  type BillingPeriod,
  type CrmMotion,
} from "@/lib/crm/constants";
import type { CrmDeal } from "@/lib/crm/types";
import type { DealInput } from "./actions";

/**
 * The deal form, once.
 *
 * `deals/[id]` edits a deal and `deals/new` creates one, and the fields
 * are the same fields. See the same note on `companies/CompanyFields.tsx`:
 * a form written twice is a form that agrees with itself for about a
 * month.
 *
 * Presentational and controlled. The pages own the state, the save
 * affordance and what happens afterwards. What genuinely differs is
 * everything a deal only has once it exists: a stage, an attribution
 * rule, a timeline, and the two-step close.
 *
 * The stage control is deliberately NOT here. A new deal is always
 * `opportunity`, stamped by `createDeal` from the server rather than
 * offered as a dropdown, because the stage a deal starts in is not a
 * decision worth taking on a form and "won" is not an option a deal may
 * be born into.
 */

export interface DealFieldValues {
  name: string;
  accountId: string;
  primaryContactId: string;
  motion: string;
  amount: string;
  mrr: string;
  currency: string;
  billingPeriod: string;
  planTier: string;
  seats: string;
  expectedCloseOn: string;
  promoCode: string;
  utmSource: string;
  notes: string;
}

/**
 * The two option lists a deal form picks from.
 *
 * Defined here because this is the one module both the record page and
 * the create page import. They used to live in `DealDrawer.tsx`, which
 * meant the list panel imported a type from a component it did not
 * render, and deleting the drawer would have broken a screen that had
 * nothing to do with it.
 */
export interface AccountOption {
  id: string;
  name: string;
  domain?: string | null;
}

export interface ContactOption {
  id: string;
  full_name: string;
  email: string | null;
  job_title?: string | null;
  account_id?: string | null;
}

/** Cents to the number somebody types. Empty stays empty, never "0". */
export function toAmountInput(value: number | null | undefined): string {
  if (!value) return "";
  return String(value / 100);
}

/** What was typed, back to integer cents. */
export function toCents(value: string): number {
  const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : 0;
}

/**
 * A blank deal.
 *
 * `accountId` is prefilled from the caller when there is one, because the
 * only two ways to reach the create page are the deals list, where there
 * is no company in mind, and a company's own New deal button, where there
 * plainly is. A deal cannot be saved without one either way.
 */
export function emptyDealFields(accountId = ""): DealFieldValues {
  return {
    name: "",
    accountId,
    primaryContactId: "",
    motion: "enterprise",
    amount: "",
    mrr: "",
    currency: "USD",
    billingPeriod: "monthly",
    planTier: "",
    seats: "",
    expectedCloseOn: "",
    promoCode: "",
    utmSource: "",
    notes: "",
  };
}

export function dealFieldsFrom(deal: CrmDeal): DealFieldValues {
  return {
    name: deal.name ?? "",
    accountId: deal.account_id ?? "",
    primaryContactId: deal.primary_contact_id ?? "",
    motion: deal.motion ?? "enterprise",
    amount: toAmountInput(deal.amount_cents),
    mrr: toAmountInput(deal.mrr_cents),
    currency: deal.currency ?? "USD",
    billingPeriod: deal.billing_period ?? "monthly",
    planTier: deal.plan_tier ?? "",
    seats: deal.seats ? String(deal.seats) : "",
    expectedCloseOn: deal.expected_close_on ?? "",
    promoCode: deal.promo_code ?? "",
    utmSource: deal.utm_source ?? "",
    notes: deal.notes ?? "",
  };
}

/** What both pages hand to `createDeal` and `updateDeal`. */
export function dealInputFrom(fields: DealFieldValues): DealInput {
  return {
    name: fields.name,
    accountId: fields.accountId,
    primaryContactId: fields.primaryContactId || null,
    motion: fields.motion as CrmMotion,
    amountCents: toCents(fields.amount),
    mrrCents: toCents(fields.mrr),
    currency: fields.currency,
    billingPeriod: fields.billingPeriod as BillingPeriod,
    planTier: fields.planTier || null,
    seats: fields.seats ? Number(fields.seats) : null,
    expectedCloseOn: fields.expectedCloseOn || null,
    notes: fields.notes || null,
    promoCode: fields.promoCode || null,
    utmSource: fields.utmSource || null,
  };
}

export default function DealFields({
  fields,
  set,
  accounts,
  contacts,
}: {
  fields: DealFieldValues;
  set: <K extends keyof DealFieldValues>(key: K, value: DealFieldValues[K]) => void;
  accounts: AccountOption[];
  contacts: ContactOption[];
}) {
  return (
    <>
      <section aria-label="Deal" className="space-y-3.5">
        <Overline as="h2" className="pb-1 border-b border-white/5">
          Deal
        </Overline>

        <div>
          <FieldLabel htmlFor="deal-name">Name</FieldLabel>
          <input
            id="deal-name"
            value={fields.name}
            onChange={(event) => set("name", event.target.value)}
            placeholder="Helix, 40 seat rollout"
            className="admin-input h-11 sm:h-9 py-0"
          />
        </div>

        <div>
          <FieldLabel htmlFor="deal-account">Company</FieldLabel>
          <select
            id="deal-account"
            value={fields.accountId}
            onChange={(event) => set("accountId", event.target.value)}
            className="admin-input h-11 sm:h-9 py-0 cursor-pointer"
          >
            <option value="">Pick a company</option>
            {accounts.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel htmlFor="deal-contact">Primary contact</FieldLabel>
          <select
            id="deal-contact"
            value={fields.primaryContactId}
            onChange={(event) => set("primaryContactId", event.target.value)}
            className="admin-input h-11 sm:h-9 py-0 cursor-pointer"
          >
            <option value="">Nobody named yet</option>
            {contacts.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.full_name}
                {entry.email ? ` · ${entry.email}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
          <div>
            <FieldLabel htmlFor="deal-motion">Motion</FieldLabel>
            <select
              id="deal-motion"
              value={fields.motion}
              onChange={(event) => set("motion", event.target.value)}
              className="admin-input h-11 sm:h-9 py-0 cursor-pointer"
            >
              {CRM_MOTIONS.map((motion) => (
                <option key={motion.id} value={motion.id}>
                  {motion.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="deal-expected">Expected close</FieldLabel>
            <input
              id="deal-expected"
              type="date"
              value={fields.expectedCloseOn}
              onChange={(event) => set("expectedCloseOn", event.target.value)}
              className="admin-input h-11 sm:h-9 py-0"
            />
          </div>
          <div>
            <FieldLabel htmlFor="deal-amount">Amount</FieldLabel>
            <input
              id="deal-amount"
              inputMode="decimal"
              value={fields.amount}
              onChange={(event) => set("amount", event.target.value)}
              className="admin-input h-11 sm:h-9 py-0 tabular-nums"
            />
          </div>
          <div>
            <FieldLabel htmlFor="deal-mrr">MRR</FieldLabel>
            <input
              id="deal-mrr"
              inputMode="decimal"
              value={fields.mrr}
              onChange={(event) => set("mrr", event.target.value)}
              className="admin-input h-11 sm:h-9 py-0 tabular-nums"
            />
          </div>
          <div>
            <FieldLabel htmlFor="deal-period">Billing period</FieldLabel>
            <select
              id="deal-period"
              value={fields.billingPeriod}
              onChange={(event) => set("billingPeriod", event.target.value)}
              className="admin-input h-11 sm:h-9 py-0 cursor-pointer"
            >
              {BILLING_PERIODS.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="deal-currency">Currency</FieldLabel>
            <input
              id="deal-currency"
              value={fields.currency}
              onChange={(event) => set("currency", event.target.value.toUpperCase())}
              maxLength={3}
              className="admin-input h-11 sm:h-9 py-0"
            />
          </div>
          <div>
            <FieldLabel htmlFor="deal-plan">Plan tier</FieldLabel>
            <input
              id="deal-plan"
              value={fields.planTier}
              onChange={(event) => set("planTier", event.target.value)}
              className="admin-input h-11 sm:h-9 py-0"
            />
          </div>
          <div>
            <FieldLabel htmlFor="deal-seats">Seats</FieldLabel>
            <input
              id="deal-seats"
              inputMode="numeric"
              value={fields.seats}
              onChange={(event) => set("seats", event.target.value)}
              className="admin-input h-11 sm:h-9 py-0 tabular-nums"
            />
          </div>
        </div>

        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Amounts here are a forecast. The commission ledger pays on cash that arrived and never
          reads these figures.
        </p>

        <div>
          <FieldLabel htmlFor="deal-notes">Notes</FieldLabel>
          <textarea
            id="deal-notes"
            rows={4}
            value={fields.notes}
            onChange={(event) => set("notes", event.target.value)}
            placeholder="Anything the future you will need."
            className="admin-input resize-y leading-relaxed"
          />
        </div>
      </section>
    </>
  );
}

/**
 * Promo code and tracked source, which are evidence rather than
 * description: the attribution rules read these two columns and nothing
 * else somebody types.
 *
 * Its own component because the record page puts it in the left column
 * under the Attribution tab, and the create page puts it directly under
 * the deal, and neither placement should force the other to move.
 */
export function DealEvidenceFields({
  fields,
  set,
  hint,
}: {
  fields: DealFieldValues;
  set: <K extends keyof DealFieldValues>(key: K, value: DealFieldValues[K]) => void;
  hint: string;
}) {
  return (
    <section aria-label="Evidence" className="space-y-3.5">
      <Overline as="h2" className="pb-1 border-b border-white/5">
        Evidence
      </Overline>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
        <div>
          <FieldLabel htmlFor="deal-promo">Promo code</FieldLabel>
          <input
            id="deal-promo"
            value={fields.promoCode}
            onChange={(event) => set("promoCode", event.target.value)}
            placeholder="LAUNCH50"
            className="admin-input h-11 sm:h-9 py-0"
          />
        </div>
        <div>
          <FieldLabel htmlFor="deal-utm">Tracked source</FieldLabel>
          <input
            id="deal-utm"
            value={fields.utmSource}
            onChange={(event) => set("utmSource", event.target.value)}
            className="admin-input h-11 sm:h-9 py-0"
          />
        </div>
      </div>
      <p className="text-[11px] text-zinc-400 leading-relaxed">{hint}</p>
    </section>
  );
}
