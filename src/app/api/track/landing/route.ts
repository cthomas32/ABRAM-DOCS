import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeSource, CAMPAIGN_VARIANTS, type CampaignSlug } from "@/lib/campaigns";

/**
 * Ingest endpoint for campaign landing page telemetry.
 *
 * POST /api/track/landing
 *
 * Writes go through the service role so the tables stay closed to the
 * public. No raw IP address is ever persisted: the address is combined
 * with the user agent and a salt that rotates daily, then hashed, purely
 * so repeat hits can be recognised without identifying anyone.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_EVENTS = new Set([
  "view",
  "scroll",
  "cta_click",
  "signup_click",
  "email_capture",
  "faq_open",
  "section_view",
  "exit",
]);

const VALID_SLUGS = new Set(Object.keys(CAMPAIGN_VARIANTS));

const BOT_PATTERN =
  /bot|crawl|spider|slurp|scrape|curl|wget|python-requests|headlesschrome|lighthouse|pagespeed|gtmetrix|facebookexternalhit|whatsapp|telegrambot|discordbot|slackbot|bingpreview|embedly|preview/i;

function clamp(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function parseDevice(ua: string): string {
  if (/ipad|tablet|playbook|silk|android(?!.*mobile)/i.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android|blackberry|windows phone/i.test(ua)) return "mobile";
  return "desktop";
}

function parseBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/firefox\//i.test(ua)) return "Firefox";
  if (/chrome\/|crios/i.test(ua)) return "Chrome";
  if (/safari\//i.test(ua)) return "Safari";
  return "Other";
}

function parseOs(ua: string): string {
  if (/iphone|ipad|ipod|ios/i.test(ua)) return "iOS";
  if (/android/i.test(ua)) return "Android";
  if (/mac os x|macintosh/i.test(ua)) return "macOS";
  if (/windows/i.test(ua)) return "Windows";
  if (/linux/i.test(ua)) return "Linux";
  return "Other";
}

function hashVisitor(ip: string, ua: string): string {
  const salt = process.env.LANDING_HASH_SALT || "abram-landing-v1";
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${ip}|${ua}|${salt}|${day}`).digest("hex").slice(0, 40);
}

function hostOf(referrer: string | null): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error("Landing telemetry: missing platform credentials.");
      // Never break the visitor experience over a tracking failure.
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
    }

    const sessionId = clamp(body.sessionId, 64);
    const pageSlug = clamp(body.pageSlug, 40);
    const eventType = clamp(body.eventType, 24);

    if (!sessionId || !pageSlug || !eventType) {
      return NextResponse.json({ ok: false, error: "Missing fields." }, { status: 400 });
    }
    if (!VALID_EVENTS.has(eventType) || !VALID_SLUGS.has(pageSlug)) {
      return NextResponse.json({ ok: false, error: "Unrecognised event." }, { status: 400 });
    }

    const rawValue = typeof body.value === "number" ? Math.round(body.value) : null;
    const value = rawValue !== null && Number.isFinite(rawValue) ? rawValue : null;
    const label = clamp(body.label, 180);

    const userAgent = request.headers.get("user-agent") || "";
    const forwarded = request.headers.get("x-forwarded-for") || "";
    const ip = forwarded.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // The attribution payload only travels with the opening view event.
    let visit: Record<string, unknown> | null = null;

    if (eventType === "view") {
      const referrer = clamp(body.referrer, 400);
      const rawSource = clamp(body.source, 60);
      const variant = VALID_SLUGS.has(pageSlug) ? (pageSlug as CampaignSlug) : null;

      visit = {
        variant,
        landing_path: clamp(body.path, 300),
        source: normalizeSource(rawSource, referrer),
        raw_source: rawSource,
        medium: clamp(body.medium, 60),
        campaign: clamp(body.campaign, 80),
        content: clamp(body.content, 80),
        term: clamp(body.term, 80),
        referrer,
        referrer_host: hostOf(referrer),
        device_type: parseDevice(userAgent),
        browser: parseBrowser(userAgent),
        os: parseOs(userAgent),
        country: request.headers.get("x-vercel-ip-country") || null,
        language: clamp(request.headers.get("accept-language"), 12),
        ip_hash: hashVisitor(ip, userAgent),
        is_bot: BOT_PATTERN.test(userAgent) || !userAgent,
      };
    }

    const { error } = await supabase.rpc("record_landing_event", {
      p_session_id: sessionId,
      p_page_slug: pageSlug,
      p_event_type: eventType,
      p_label: label,
      p_value: value,
      p_visit: visit,
    });

    if (error) {
      console.error("Landing telemetry: failed to record event:", error.message);
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Landing telemetry: unexpected error:", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
