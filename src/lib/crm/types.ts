/**
 * Row shapes for the CRM tables.
 *
 * These mirror supabase/migrations/20260804120000_crm_conference_capture.sql
 * one for one. If a column is added there it belongs here on the same pass,
 * because both the public card and the admin console read through these
 * types rather than touching untyped rows.
 */

import type { QrDesignSpec } from "./qrDesign";
import type {
  AttributionRule,
  BillingPeriod,
  CodePlacement,
  CrmMotion,
  CrmPriority,
  CrmSource,
  CrmStage,
  DealStage,
  InteractionKind,
  RegistrationStatus,
  TaskStatus,
} from "./constants";
import type { ContactSource, LifecycleStage } from "./people";

/** The person whose card gets scanned. One row today, a row per teammate later. */
export interface CrmProfile {
  id: string;
  slug: string;
  owner_user_id: string | null;
  full_name: string;
  job_title: string | null;
  company: string | null;
  tagline: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  linkedin_url: string | null;
  x_url: string | null;
  calendar_url: string | null;
  avatar_url: string | null;
  /** Shown on the card as the reason to get in touch. Kept claim free. */
  cta_label: string | null;
  cta_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** A conference, trade show or meetup. Scans and contacts hang off it. */
export interface CrmEvent {
  id: string;
  slug: string;
  name: string;
  venue: string | null;
  city: string | null;
  country: string | null;
  starts_on: string | null;
  ends_on: string | null;
  notes: string | null;
  /** The event new scans are attributed to when a code does not name one. */
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** One printed or rendered QR. Several can point at the same card. */
export interface CrmCaptureCode {
  id: string;
  code: string;
  label: string;
  profile_id: string;
  event_id: string | null;
  placement: CodePlacement | null;
  is_active: boolean;
  scan_count: number;
  capture_count: number;
  last_scanned_at: string | null;
  /** How this code is drawn. Null means the plain black on white square. */
  design: QrDesignSpec | null;
  created_at: string;
  updated_at: string;
}

/** Every load of a card page. No raw IP address is ever stored. */
export interface CrmScan {
  id: string;
  profile_id: string;
  code_id: string | null;
  event_id: string | null;
  contact_id: string | null;
  occurred_at: string;
  visitor_hash: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
  is_bot: boolean;
  converted: boolean;
}

/** A person you met. */
export interface CrmContact {
  id: string;
  profile_id: string;
  /** Generated on the device before sending, so an offline retry cannot duplicate a row. */
  client_token: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  website: string | null;
  linkedin_url: string | null;
  city: string | null;
  country: string | null;
  /** What they typed in the message box, or what you typed on their behalf. */
  notes: string | null;
  /** Where in the venue you were standing. Free text, written while it is fresh. */
  met_context: string | null;
  met_at: string;
  event_id: string | null;
  code_id: string | null;
  scan_id: string | null;
  /** The first way in, written once at capture and never moved. */
  source: CrmSource;
  /**
   * Every way this person has reached us, accumulating, and always
   * containing `source`. Somebody who subscribed, then came to a
   * conference, then filled in a form is all three, and a report that
   * has to pick one of them is a report that is wrong.
   */
  sources: ContactSource[];
  /** Where their pipeline sits. Not the same ladder as `lifecycle_stage`. */
  stage: CrmStage;
  /** How far along the person is, as distinct from their pipeline. */
  lifecycle_stage: LifecycleStage;
  priority: CrmPriority;
  tags: string[];
  consent_marketing: boolean;
  consent_at: string | null;
  /**
   * The subscriber record this contact was linked to. Non-null only when
   * they ticked the consent box, or when they later subscribed on the site
   * under the same address. It doubles as the idempotency marker, so an
   * offline retry cannot add somebody to the list twice.
   */
  subscriber_id: string | null;
  vcard_sent_at: string | null;
  notified_at: string | null;
  last_activity_at: string;
  next_follow_up_at: string | null;
  archived: boolean;
  /** True when the row was typed with no signal and synced later. */
  captured_offline: boolean;
  /** Device clock at the moment of capture, which can be well before it reached us. */
  captured_at: string | null;
  raw: Record<string, unknown>;

  /** The company they are at. Deals hang off the account, not the person. */
  account_id: string | null;

  /**
   * Three different people, and they stay three columns because the
   * commission agreement pays differently for finding a lead and for
   * closing one.
   *
   * owner_user_id  who works it today. Moves freely, means nothing financially.
   * sourced_by     who originated it. Write once — the database refuses to move it.
   * closed_by      who ran it to a completed checkout.
   */
  owner_user_id: string | null;
  sourced_by: string | null;
  closed_by: string | null;

  /** Which of the two funnels this person is travelling. */
  motion: CrmMotion;

  /**
   * How they first arrived, stamped onto the person at the moment they
   * became one. Before these existed the funnel could count people but
   * could not say what produced them.
   */
  first_touch_source: string | null;
  first_touch_medium: string | null;
  first_touch_campaign: string | null;
  first_touch_content: string | null;
  first_touch_term: string | null;
  first_touch_landing_path: string | null;
  first_touch_referrer: string | null;
  first_touch_at: string | null;
  /** The anonymous landing session this person came out of. */
  first_session_id: string | null;
  /** A code seen on the way in. The weaker cousin of the one redeemed at checkout. */
  promo_code: string | null;

  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/*  Accounts, deals and attribution                                    */
/* ------------------------------------------------------------------ */

/** The company, as distinct from the people at it. */
export interface CrmAccount {
  id: string;
  name: string;
  slug: string | null;
  /** The dedupe key that actually works — company names get typed three ways. */
  domain: string | null;
  website: string | null;
  industry: string | null;
  size_band: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  owner_user_id: string | null;
  sourced_by: string | null;
  /** The three exclusions the commission ledger reads before paying anything. */
  is_comped: boolean;
  is_company_managed: boolean;
  carve_out: string | null;
  /** A registration is only valid if it was filed before this instant. */
  first_contact_at: string | null;
  lifecycle: "prospect" | "engaged" | "customer" | "churned" | "disqualified";
  archived: boolean;
  created_at: string;
  updated_at: string;
}

/** What might be worth money, and what rule says whose it is. */
export interface CrmDeal {
  id: string;
  account_id: string;
  primary_contact_id: string | null;
  name: string;
  motion: CrmMotion;
  stage: DealStage;

  /** A forecast. The ledger pays on collected cash and never reads these. */
  amount_cents: number;
  mrr_cents: number;
  currency: string;
  billing_period: BillingPeriod;
  plan_tier: string | null;
  seats: number | null;

  expected_close_on: string | null;
  closed_at: string | null;
  lost_reason: string | null;

  sourced_by: string | null;
  closed_by: string | null;
  owner_user_id: string | null;

  attribution_rule: AttributionRule;
  attribution_ref: string | null;
  attribution_note: string | null;
  /** Once set, the rule is history and the ledger stops re-deriving it. */
  attribution_locked_at: string | null;
  registration_id: string | null;

  promo_code: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;

  /** The customer over in the product database. A reference, never a copy. */
  external_customer_ref: string | null;
  first_payment_at: string | null;

  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** A named account claimed in writing before anybody spoke to it. */
export interface CrmDealRegistration {
  id: string;
  account_id: string | null;
  account_name: string;
  account_domain: string | null;
  requested_by: string;
  requested_at: string;
  rationale: string | null;
  status: RegistrationStatus;
  /** Resolved when filed. "Five business days" depends on a calendar. */
  decline_deadline_at: string;
  expires_at: string;
  decided_by: string | null;
  decided_at: string | null;
  decision_reason: string | null;
  created_at: string;
  updated_at: string;
}

/** One line on a contact's timeline. */
export interface CrmInteraction {
  id: string;
  contact_id: string;
  kind: InteractionKind;
  body: string | null;
  meta: Record<string, unknown>;
  occurred_at: string;
  /** Free text, kept for rows written before logins were a concept. */
  author: string | null;
  /** Who actually wrote it. Filterable, unlike the string above. */
  author_user_id: string | null;
  created_at: string;
}

/** A follow up with a due date. */
export interface CrmTask {
  id: string;
  contact_id: string;
  title: string;
  details: string | null;
  due_at: string | null;
  status: TaskStatus;
  priority: CrmPriority;
  completed_at: string | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Every stage move, so the funnel can be measured rather than guessed at. */
export interface CrmStageChange {
  id: string;
  contact_id: string;
  from_stage: CrmStage | null;
  to_stage: CrmStage;
  changed_at: string;
  note: string | null;
}

/* ------------------------------------------------------------------ */
/*  Payloads                                                           */
/* ------------------------------------------------------------------ */

/**
 * What the card form and the offline capture screen POST to
 * /api/crm/capture. Only full_name is required, because a stranger
 * standing in a hallway will abandon anything longer.
 */
export interface CapturePayload {
  client_token: string;
  profile_slug: string;
  code?: string | null;
  /**
   * The scan this capture came from, returned by /api/crm/scan on page
   * load. Absent when the details were typed on the owner's phone in
   * capture mode, where there was no scan to begin with.
   */
  scan_id?: string | null;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  job_title?: string | null;
  linkedin_url?: string | null;
  notes?: string | null;
  met_context?: string | null;
  consent_marketing?: boolean;
  priority?: CrmPriority;
  source?: CrmSource;
  /** Device clock at capture time, ISO string. Preserved when a sync is late. */
  captured_at?: string;
  captured_offline?: boolean;
  /** Unfilled honeypot. Any value means a bot filled the form. */
  company_url?: string;
}

export interface CaptureResponse {
  ok: boolean;
  duplicate?: boolean;
  contact_id?: string;
  error?: string;
}
