/**
 * Row shapes for the commission ledger.
 *
 * Mirrors supabase/migrations/20260817110000_growth_commission_ledger.sql
 * one for one. A column added there belongs here on the same pass.
 *
 * Every money field is integer cents. Nothing in this system stores a
 * currency amount as a float, and nothing should start.
 */

export type GrowthStageId = "advisor" | "head_of_growth" | "employee";

/**
 * Commission rates as a history rather than a value.
 *
 * A promotion closes one row and opens another. Reading a rate off the
 * person answers "what do they earn now" and gets the wrong answer for
 * every month already paid.
 */
export interface GrowthPartnerTerms {
  id: string;
  user_id: string;
  stage: GrowthStageId;
  /** Fractions, not percents. 0.3 is thirty percent. */
  close_rate: number;
  source_rate: number;
  /** Collections keep paying for this many months after a customer's first payment. */
  tail_months: number;
  /** A reversal inside this window claws the commission back. */
  clawback_days: number;
  effective_from: string;
  effective_to: string | null;
  note: string | null;
  created_at: string;
}

export type CollectionStatus = "collected" | "refunded" | "charged_back" | "cancelled";

/**
 * A payment actually collected, mirrored from the payment processor.
 *
 * A copy, never the source of truth. A row here that disagrees with
 * Stripe is wrong by definition.
 */
export interface RevenueCollection {
  id: string;
  external_payment_ref: string;
  external_customer_ref: string | null;
  external_invoice_ref: string | null;
  deal_id: string | null;
  account_id: string | null;
  collected_at: string;
  /** First of the month it landed in. Stored, so a timezone cannot move it between statements. */
  collection_month: string;
  gross_cents: number;
  discount_cents: number;
  fee_cents: number;
  /** Gross less checkout discount. Processor fees deliberately not deducted. */
  net_cents: number;
  currency: string;
  status: CollectionStatus;
  refunded_cents: number;
  reversed_at: string | null;
  reversal_reason: string | null;
  /** The twelve month tail runs from the customer's first payment. */
  is_first_payment: boolean;
  source: "stripe" | "manual" | "import";
  raw: Record<string, unknown>;
  synced_at: string;
  created_at: string;
}

export type CommissionStatus = "accrued" | "payable" | "paid" | "clawed_back" | "void";

/** One row per collection per partner. Never edited once paid. */
export interface CommissionEntry {
  id: string;
  user_id: string;
  collection_id: string | null;
  deal_id: string | null;
  account_id: string | null;
  terms_id: string | null;
  payout_id: string | null;
  /** Whether the payee also closed it, not who is being paid — the payee is always the sourcer. */
  credit_type: "closed" | "sourced";
  collection_month: string;
  basis_cents: number;
  /** Snapshotted, so a later promotion cannot restate what was paid. */
  rate_applied: number;
  /** Signed. A clawback is negative, so a statement is a plain sum. */
  amount_cents: number;
  currency: string;
  status: CommissionStatus;
  reverses_entry_id: string | null;
  computed_at: string;
  note: string | null;
  created_at: string;
}

export interface CommissionPayout {
  id: string;
  user_id: string;
  period_month: string;
  total_cents: number;
  currency: string;
  status: "draft" | "approved" | "paid" | "void";
  /** Close of the collection month plus thirty days. */
  due_at: string;
  approved_by: string | null;
  approved_at: string | null;
  paid_at: string | null;
  payment_ref: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

/** One row per month per person, clawbacks already folded in. */
export interface CommissionStatementRow {
  user_id: string;
  collection_month: string;
  currency: string;
  total_cents: number;
  paid_cents: number;
  outstanding_cents: number;
  clawed_back_cents: number;
  basis_cents: number;
  deals: number;
}

/** The number equity tranches trigger on. */
export interface AttributedMrrRow {
  user_id: string;
  attributed_mrr_cents: number;
  won_deals: number;
  open_deals: number;
}

export interface GrowthEquityTranche {
  id: string;
  user_id: string;
  label: string;
  /** Percentage points of fully-diluted capitalisation, e.g. 1.25. */
  size_pct: number;
  trigger_kind: "signing" | "attributed_mrr";
  trigger_mrr_cents: number | null;
  triggered_at: string | null;
  granted_on: string | null;
  vest_months: number;
  cliff_months: number;
  note: string | null;
  created_at: string;
}

/** One line of the attribution audit view. */
export interface AttributionAuditRow {
  deal_id: string;
  deal_name: string;
  stage: string;
  closed_at: string | null;
  amount_cents: number;
  mrr_cents: number;
  currency: string;
  account_id: string;
  account_name: string;
  account_domain: string | null;
  attribution_rule: string;
  attribution_ref: string | null;
  attribution_locked_at: string | null;
  sourced_by: string | null;
  closed_by: string | null;
  first_payment_at: string | null;
  /** Null when the deal pays. Otherwise the single reason it does not. */
  exclusion_reason:
    | "carve_out"
    | "comped"
    | "company_managed"
    | "unattributed"
    | "not_won"
    | null;
}

/** What the exclusion reasons mean, in words a person can act on. */
export const EXCLUSION_LABELS: Record<string, string> = {
  carve_out: "Carved out of the agreement",
  comped: "Comped account",
  company_managed: "Company managed",
  unattributed: "Matches no attribution rule",
  not_won: "Not closed yet",
};
