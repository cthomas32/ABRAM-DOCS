import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { FIELD_LIMITS } from "@/lib/crm/constants";
import type { CrmPriority, CrmSource } from "@/lib/crm/constants";
import { subscribeConsentingContact } from "@/lib/crm/subscriberLink";
import { IDENTITY_SELECT, resolveIdentity, type CardIdentity } from "@/lib/crm/identity";
import { CAPTURE_FOLLOW_UP_KEY, defaultCrmEmailContent, renderCrmEmail } from "@/lib/crm/emailTemplates";
import { loadCrmEmailContent } from "@/lib/crm/emailTemplateStore";
import { captureEmailValues } from "@/lib/crm/emailValues";
import type { CaptureResponse, CrmProfile } from "@/lib/crm/types";

/**
 * Where a stranger's details land.
 *
 * This route has two jobs and they pull in opposite directions. It must
 * never lose a submission, which is why the client queues before it sends
 * and why anything that might be retried gets a 5xx rather than a refusal.
 * And it must never create a duplicate, which is why every write is looked
 * up first, by the token the device generated and then by email, with the
 * unique index left in place as the backstop for a genuine race.
 *
 * Sending the vCard and pinging Slack happen after the row is safe. Both
 * are wrapped so that a mail outage or a rotated webhook can never cost us
 * somebody we actually met.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_LINK = "https://abram.network/admin/dashboard/crm";
const DEFAULT_FROM = "ABRAM <updates@abram.network>";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function clamp(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function respond(payload: CaptureResponse, status = 200) {
  return NextResponse.json(payload, { status });
}

function visitorHash(ip: string, ua: string): string {
  const salt = process.env.LANDING_HASH_SALT || "abram-landing-v1";
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${ip}|${ua}|${salt}|${day}`).digest("hex").slice(0, 40);
}

function isoOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  /* A device clock that claims to be in the far future is not worth trusting. */
  if (parsed.getTime() > Date.now() + 24 * 60 * 60 * 1000) return null;
  return parsed.toISOString();
}

/** Escapes the two characters ILIKE treats as wildcards, underscore included. */
function ilikeEscape(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A malformed id would fail the foreign key and send the queue into a loop. */
function uuidOrNull(value: unknown): string | null {
  const candidate = clamp(value, 60);
  return candidate && UUID.test(candidate) ? candidate : null;
}

const PRIORITIES: CrmPriority[] = ["hot", "normal", "low"];
const SOURCES: CrmSource[] = ["qr_card", "capture_mode", "manual", "import"];

/* ------------------------------------------------------------------ */
/*  Rate limiting                                                      */
/*                                                                     */
/*  Deliberately loose. A queue that has been offline all afternoon     */
/*  flushes a dozen people in one burst, and blocking that would lose   */
/*  exactly the contacts this system exists to keep.                   */
/* ------------------------------------------------------------------ */

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
const hits = new Map<string, number[]>();

function overLimit(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((at) => now - at < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);

  /* Keep the map from growing without bound on a long lived instance. */
  if (hits.size > 5000) {
    for (const [existing, stamps] of hits) {
      if (stamps.every((at) => now - at >= WINDOW_MS)) hits.delete(existing);
    }
  }

  return recent.length > MAX_PER_WINDOW;
}

/* ------------------------------------------------------------------ */
/*  Shapes                                                             */
/* ------------------------------------------------------------------ */

interface Submitted {
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  linkedin_url: string | null;
  notes: string | null;
  met_context: string | null;
}

type ContactRow = Record<string, unknown> & { id: string };

/* ------------------------------------------------------------------ */
/*  Lookups                                                            */
/* ------------------------------------------------------------------ */

async function findByToken(
  supabase: SupabaseClient,
  token: string,
): Promise<ContactRow | null> {
  const { data } = await supabase
    .from("crm_contacts")
    .select("*")
    .eq("client_token", token)
    .maybeSingle();
  return (data as ContactRow | null) ?? null;
}

/**
 * The "we met again" lookup. Case insensitive, and verified in JavaScript
 * afterwards so a wildcard that slipped through the pattern can never hand
 * back somebody else's row.
 */
async function findByEmail(
  supabase: SupabaseClient,
  profileId: string,
  email: string,
): Promise<ContactRow | null> {
  const lower = email.toLowerCase();

  const exact = await supabase
    .from("crm_contacts")
    .select("*")
    .eq("profile_id", profileId)
    .eq("archived", false)
    .eq("email", lower)
    .maybeSingle();

  if (exact.data) return exact.data as ContactRow;

  const loose = await supabase
    .from("crm_contacts")
    .select("*")
    .eq("profile_id", profileId)
    .eq("archived", false)
    .ilike("email", ilikeEscape(lower))
    .limit(5);

  const match = ((loose.data as ContactRow[] | null) || []).find(
    (row) => typeof row.email === "string" && row.email.toLowerCase() === lower,
  );

  return match ?? null;
}

/** Only writes what was actually supplied, so a sparse retry cannot erase a full row. */
function mergePatch(existing: ContactRow, submitted: Submitted): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  const fields: (keyof Submitted)[] = [
    "full_name",
    "email",
    "phone",
    "company",
    "job_title",
    "linkedin_url",
    "met_context",
  ];

  for (const field of fields) {
    const value = submitted[field];
    if (value) patch[field] = field === "email" ? value.toLowerCase() : value;
  }

  if (submitted.notes) {
    const current = typeof existing.notes === "string" ? existing.notes : "";
    patch.notes = current && current !== submitted.notes
      ? `${current}\n\n${submitted.notes}`.slice(0, FIELD_LIMITS.notes * 2)
      : submitted.notes;
  }

  return patch;
}

/* ------------------------------------------------------------------ */
/*  The vCard email                                                    */
/* ------------------------------------------------------------------ */

/**
 * The note that arrives a minute after the handshake.
 *
 * The wording is editable from the console, and the whole point of the
 * arrangement is that an edit can never cost somebody their email. The copy
 * is looked up, and a lookup that fails for any reason at all comes back as
 * the copy this build ships with. Rendering is checked once more here, so
 * even a template that passed validation on the way into the table cannot
 * put a {{ }} tag in front of a stranger.
 */
async function sendVCardEmail(
  supabase: SupabaseClient,
  profile: CardIdentity,
  toEmail: string,
  toName: string,
  company: string | null,
  jobTitle: string | null,
  eventName: string | null,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY || process.env.RESEND_MARKETING_API_KEY;
  if (!apiKey) {
    console.warn("Card capture: no Resend key configured, skipping the contact card email.");
    return false;
  }

  const values = captureEmailValues({ profile, toName, company, jobTitle, eventName });

  const builtIn = defaultCrmEmailContent(CAPTURE_FOLLOW_UP_KEY);
  if (!builtIn) {
    console.error("Card capture: the follow up template is missing from this build.");
    return false;
  }

  let content = builtIn;
  let edited = false;
  try {
    const loaded = await loadCrmEmailContent(supabase, CAPTURE_FOLLOW_UP_KEY);
    if (loaded) {
      content = loaded.content;
      edited = loaded.source === "saved";
    }
  } catch (err) {
    console.error("Card capture: reading the saved wording threw, sending the original:", err);
  }

  let email = renderCrmEmail(content, values);

  /* The last guard. A subject that came out empty, or a brace that survived
     rendering, means the copy in the table is not fit to send, and the
     original goes instead. Silence is the one outcome that is not allowed. */
  const broken =
    !email.subject.trim() ||
    (!email.text.trim() && !email.html.trim()) ||
    [email.subject, email.text, email.html].some((part) => part.includes("{{") || part.includes("}}"));

  if (broken && edited) {
    console.error("Card capture: the saved wording did not render, sending the original instead.");
    email = renderCrmEmail(builtIn, values);
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM,
    to: toEmail,
    subject: email.subject || "Great to meet you",
    ...(email.text ? { text: email.text } : {}),
    ...(email.html ? { html: email.html } : {}),
  } as Parameters<Resend["emails"]["send"]>[0]);

  if (result.error) {
    console.error("Card capture: contact card email failed:", result.error.message);
    return false;
  }
  return true;
}

/* ------------------------------------------------------------------ */
/*  Slack                                                              */
/* ------------------------------------------------------------------ */

async function pingSlack(
  submitted: Submitted,
  eventName: string | null,
  returning: boolean,
): Promise<boolean> {
  const webhook =
    process.env.SLACK_CRM_WEBHOOK_URL ||
    process.env.SLACK_TRIAGE_WEBHOOK_URL ||
    process.env.SLACK_WEBHOOK_URL;

  if (!webhook) return false;

  const headline = returning ? "Scanned again" : "New contact";
  const where = eventName ? ` at ${eventName}` : "";
  const line = [submitted.email, submitted.phone].filter(Boolean).join(" · ");

  const text = [
    `*${headline}${where}:* ${submitted.full_name}${submitted.company ? ` (${submitted.company})` : ""}`,
    submitted.job_title || null,
    line || null,
    submitted.notes ? `> ${submitted.notes.slice(0, 240)}` : null,
    ADMIN_LINK,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    console.error(`Card capture: Slack rejected the message (${response.status}).`);
    return false;
  }
  return true;
}

/* ------------------------------------------------------------------ */
/*  Route                                                              */
/* ------------------------------------------------------------------ */

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return respond({ ok: false, error: "Invalid payload." }, 400);
    }

    /* A filled honeypot gets a clean 200. A bot learns nothing from that. */
    if (typeof body.company_url === "string" && body.company_url.trim()) {
      return respond({ ok: true });
    }

    const submitted: Submitted = {
      full_name: clamp(body.full_name, FIELD_LIMITS.full_name) || "",
      email: clamp(body.email, FIELD_LIMITS.email)?.toLowerCase() ?? null,
      phone: clamp(body.phone, FIELD_LIMITS.phone),
      company: clamp(body.company, FIELD_LIMITS.company),
      job_title: clamp(body.job_title, FIELD_LIMITS.job_title),
      linkedin_url: clamp(body.linkedin_url, FIELD_LIMITS.linkedin_url),
      notes: clamp(body.notes, FIELD_LIMITS.notes),
      met_context: clamp(body.met_context, FIELD_LIMITS.met_context),
    };

    const profileSlug = clamp(body.profile_slug, 80)?.toLowerCase() ?? null;

    /* Neither of these can be fixed by trying again, so the queue is told to
       stop rather than to keep hammering. */
    if (!submitted.full_name) return respond({ ok: false, error: "A name is required." }, 400);
    if (!profileSlug) return respond({ ok: false, error: "Unknown card." }, 400);

    const clientToken = clamp(body.client_token, 80) || `srv-${randomUUID()}`;
    const code = clamp(body.code, 40);
    const scanId = uuidOrNull(body.scan_id);
    const capturedAt = isoOrNull(body.captured_at);
    const consent = body.consent_marketing === true;

    const priority = PRIORITIES.includes(body.priority as CrmPriority)
      ? (body.priority as CrmPriority)
      : "normal";
    const source = SOURCES.includes(body.source as CrmSource)
      ? (body.source as CrmSource)
      : "qr_card";

    /* A device clock well behind the wall clock means this sat in the queue. */
    const capturedOffline =
      body.captured_offline === true ||
      (capturedAt ? Date.now() - new Date(capturedAt).getTime() > 120_000 : false);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      console.error("Card capture: missing platform credentials.");
      /* Retryable on purpose. The details stay on the device meanwhile. */
      return respond({ ok: false, error: "Storage unavailable." }, 503);
    }

    const userAgent = request.headers.get("user-agent") || "";
    const forwarded = request.headers.get("x-forwarded-for") || "";
    const ip = forwarded.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    const hash = visitorHash(ip, userAgent);

    if (overLimit(hash)) {
      return respond({ ok: false, error: "Too many submissions. Try again shortly." }, 429);
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const profileResult = await supabase
      .from("crm_profiles")
      .select(IDENTITY_SELECT)
      .eq("slug", profileSlug)
      .maybeSingle();

    if (profileResult.error) {
      console.error("Card capture: profile lookup failed:", profileResult.error.message);
      return respond({ ok: false, error: "Storage unavailable." }, 503);
    }
    if (!profileResult.data) return respond({ ok: false, error: "Unknown card." }, 400);

    /* Name, title, photo and city come from the shared team record unless
       this card overrides them, so the signature on the email below says
       the same thing as the card they just scanned. */
    const profile = resolveIdentity(
      profileResult.data as unknown as Parameters<typeof resolveIdentity>[0],
    );

    /* Which printed square, and which show. */
    let codeId: string | null = null;
    let eventId: string | null = null;
    let eventName: string | null = null;

    if (code) {
      const { data: codeRow } = await supabase
        .from("crm_capture_codes")
        .select("id, event_id, profile_id, is_active")
        .eq("code", code)
        .maybeSingle();

      if (codeRow && codeRow.is_active !== false && codeRow.profile_id === profile.id) {
        codeId = codeRow.id as string;
        eventId = (codeRow.event_id as string | null) ?? null;
      }
    }

    if (!eventId) {
      const { data: activeEvent } = await supabase
        .from("crm_events")
        .select("id, name")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (activeEvent) {
        eventId = activeEvent.id as string;
        eventName = (activeEvent.name as string | null) ?? null;
      }
    } else {
      const { data: eventRow } = await supabase
        .from("crm_events")
        .select("name")
        .eq("id", eventId)
        .maybeSingle();
      eventName = (eventRow?.name as string | undefined) ?? null;
    }

    const now = new Date().toISOString();

    /* ---------------------------------------------------------------- */
    /*  1. The same submission, sent twice                              */
    /* ---------------------------------------------------------------- */

    const byToken = await findByToken(supabase, clientToken);
    if (byToken) {
      const patch: Record<string, unknown> = {
        ...mergePatch(byToken, submitted),
        last_activity_at: now,
      };
      if (submitted.notes) patch.notes = submitted.notes;
      if (consent && !byToken.consent_marketing) {
        patch.consent_marketing = true;
        patch.consent_at = now;
      }

      await supabase.from("crm_contacts").update(patch).eq("id", byToken.id);

      /* Almost always a no op, because the first attempt at this same capture
         already did it. It matters in the one case where the row was written
         and the process died before the list write: the queue retries, lands
         here, and the person who ticked the box still gets on the list. The
         helper reads consent off the committed row and refuses to run twice. */
      if (consent) {
        await subscribeConsentingContact({
          supabase,
          contactId: byToken.id,
          fullName: submitted.full_name,
          eventName,
        });
      }

      return respond({ ok: true, duplicate: true, contact_id: byToken.id });
    }

    /* ---------------------------------------------------------------- */
    /*  2. Somebody we already have, met again                          */
    /* ---------------------------------------------------------------- */

    const recordRescan = async (existing: ContactRow) => {
      const patch: Record<string, unknown> = {
        ...mergePatch(existing, submitted),
        last_activity_at: now,
        /* Carrying the new token means a retry of this same send lands on
           the token path above and does not write a second timeline row. */
        client_token: clientToken,
      };
      if (consent && !existing.consent_marketing) {
        patch.consent_marketing = true;
        patch.consent_at = now;
      }
      if (eventId && !existing.event_id) patch.event_id = eventId;

      await supabase.from("crm_contacts").update(patch).eq("id", existing.id);

      await supabase.from("crm_interactions").insert({
        contact_id: existing.id,
        kind: "rescan",
        body: eventName
          ? `Scanned the card again at ${eventName} and left their details.`
          : "Scanned the card again and left their details.",
        meta: { code, event_id: eventId, scan_id: scanId, offline: capturedOffline },
        occurred_at: capturedAt || now,
      });

      if (scanId) {
        await supabase
          .from("crm_scans")
          .update({ converted: true, contact_id: existing.id })
          .eq("id", scanId);
      }
    };

    if (submitted.email) {
      const byEmail = await findByEmail(supabase, profile.id, submitted.email);
      if (byEmail) {
        await recordRescan(byEmail);

        await deliver({
          supabase,
          profile,
          contactId: byEmail.id,
          submitted,
          eventName,
          sendCard: !byEmail.vcard_sent_at,
          returning: true,
        });

        return respond({ ok: true, duplicate: true, contact_id: byEmail.id });
      }
    }

    /* ---------------------------------------------------------------- */
    /*  3. Somebody new                                                 */
    /* ---------------------------------------------------------------- */

    const insertPayload = {
      profile_id: profile.id,
      client_token: clientToken,
      full_name: submitted.full_name,
      email: submitted.email,
      phone: submitted.phone,
      company: submitted.company,
      job_title: submitted.job_title,
      linkedin_url: submitted.linkedin_url,
      notes: submitted.notes,
      met_context: submitted.met_context,
      met_at: capturedAt || now,
      event_id: eventId,
      code_id: codeId,
      scan_id: scanId,
      source,
      stage: "new",
      priority,
      consent_marketing: consent,
      consent_at: consent ? now : null,
      last_activity_at: now,
      captured_offline: capturedOffline,
      captured_at: capturedAt,
      raw: { code, scan_id: scanId, visitor: hash },
    };

    const inserted = await supabase.from("crm_contacts").insert(insertPayload).select("id").single();

    if (inserted.error) {
      /* A race on the unique index. Whichever request lost, the row exists,
         so go back through the lookup path rather than failing. */
      if (inserted.error.code === "23505") {
        const raced =
          (await findByToken(supabase, clientToken)) ||
          (submitted.email ? await findByEmail(supabase, profile.id, submitted.email) : null);

        if (raced) {
          await recordRescan(raced);
          return respond({ ok: true, duplicate: true, contact_id: raced.id });
        }
        return respond({ ok: true, duplicate: true });
      }

      console.error("Card capture: insert failed:", inserted.error.message);
      return respond({ ok: false, error: "Storage unavailable." }, 503);
    }

    const contactId = inserted.data.id as string;

    const lines = [
      `Name: ${submitted.full_name}`,
      submitted.email ? `Email: ${submitted.email}` : null,
      submitted.phone ? `Phone: ${submitted.phone}` : null,
      submitted.company ? `Company: ${submitted.company}` : null,
      submitted.job_title ? `Role: ${submitted.job_title}` : null,
      submitted.notes ? `Message: ${submitted.notes}` : null,
      code ? `Code: ${code}` : null,
      eventName ? `Event: ${eventName}` : null,
      capturedOffline ? "Typed with no signal and synced later." : null,
    ].filter(Boolean);

    await supabase.from("crm_interactions").insert({
      contact_id: contactId,
      kind: "capture",
      body: lines.join("\n"),
      meta: {
        code,
        code_id: codeId,
        event_id: eventId,
        scan_id: scanId,
        consent_marketing: consent,
        offline: capturedOffline,
      },
      occurred_at: capturedAt || now,
    });

    if (scanId) {
      const { error: scanError } = await supabase
        .from("crm_scans")
        .update({ converted: true, contact_id: contactId })
        .eq("id", scanId);
      if (scanError) console.error("Card capture: could not link the scan:", scanError.message);
    }

    if (codeId) {
      const { error: bumpError } = await supabase.rpc("crm_bump_code_capture", {
        p_code_id: codeId,
      });
      if (bumpError) console.error("Card capture: failed to bump code counter:", bumpError.message);
    }

    await deliver({
      supabase,
      profile,
      contactId,
      submitted,
      eventName,
      sendCard: true,
      returning: false,
    });

    return respond({ ok: true, contact_id: contactId });
  } catch (err) {
    console.error("Card capture: unexpected error:", err);
    /* Retryable. The device still holds the details. */
    return respond({ ok: false, error: "Something went wrong." }, 503);
  }
}

/* ------------------------------------------------------------------ */
/*  After the row is safe                                              */
/* ------------------------------------------------------------------ */

async function deliver(args: {
  supabase: SupabaseClient;
  profile: CardIdentity;
  contactId: string;
  submitted: Submitted;
  eventName: string | null;
  sendCard: boolean;
  returning: boolean;
}): Promise<void> {
  const { supabase, profile, contactId, submitted, eventName, sendCard, returning } = args;
  const stamps: Record<string, string> = {};

  /* The mailing list, and only for somebody who asked. The helper reads
     consent from the committed row rather than from the payload, so a
     tampered request cannot talk its way onto the list, and it refuses to
     run twice against the same contact. Like everything else in here, a
     failure is logged and the capture stands. */
  try {
    await subscribeConsentingContact({
      supabase,
      contactId,
      fullName: submitted.full_name,
      eventName,
    });
  } catch (err) {
    console.error("Card capture: newsletter link threw:", err);
  }

  if (sendCard && submitted.email) {
    try {
      const sent = await sendVCardEmail(
        supabase,
        profile,
        submitted.email,
        submitted.full_name,
        submitted.company,
        submitted.job_title,
        eventName,
      );
      if (sent) stamps.vcard_sent_at = new Date().toISOString();
    } catch (err) {
      console.error("Card capture: contact card email threw:", err);
    }
  }

  try {
    const pinged = await pingSlack(submitted, eventName, returning);
    if (pinged) stamps.notified_at = new Date().toISOString();
  } catch (err) {
    console.error("Card capture: Slack ping threw:", err);
  }

  if (Object.keys(stamps).length === 0) return;

  try {
    await supabase.from("crm_contacts").update(stamps).eq("id", contactId);
  } catch (err) {
    console.error("Card capture: could not stamp delivery times:", err);
  }
}
