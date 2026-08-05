import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Scan telemetry for a contact card.
 *
 * POST /api/crm/scan
 *
 * Called once when a card mounts. It answers one question honestly, which
 * is how many people actually pointed a phone at a printed square, and it
 * hands back the scan id so a capture from the same visit can be tied to
 * the scan that produced it.
 *
 * No raw IP address is ever persisted. The address is combined with the
 * user agent and a salt that rotates daily and then hashed, exactly as the
 * landing page telemetry does, so a repeat visit can be recognised without
 * identifying anybody.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function crmVisitorHash(ip: string, ua: string): string {
  const salt = process.env.LANDING_HASH_SALT || "abram-landing-v1";
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${ip}|${ua}|${salt}|${day}`).digest("hex").slice(0, 40);
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error("Card scan: missing platform credentials.");
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    const slug = clamp(body.slug, 80)?.toLowerCase();
    const code = clamp(body.code, 40);
    if (!slug) return NextResponse.json({ ok: false }, { status: 200 });

    const userAgent = request.headers.get("user-agent") || "";
    const forwarded = request.headers.get("x-forwarded-for") || "";
    const ip = forwarded.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    const isBot = BOT_PATTERN.test(userAgent) || !userAgent;

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile } = await supabase
      .from("crm_profiles")
      .select("id, is_active")
      .eq("slug", slug)
      .maybeSingle();

    if (!profile || profile.is_active === false) {
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    /* The printed code names the event when it has one. Otherwise the scan
       belongs to whichever show is switched on this morning. */
    let codeId: string | null = null;
    let eventId: string | null = null;

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
        .select("id")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      eventId = (activeEvent?.id as string | undefined) ?? null;
    }

    const { data: scan, error } = await supabase
      .from("crm_scans")
      .insert({
        profile_id: profile.id,
        code_id: codeId,
        event_id: eventId,
        visitor_hash: crmVisitorHash(ip, userAgent),
        device: parseDevice(userAgent),
        browser: parseBrowser(userAgent),
        os: parseOs(userAgent),
        referrer: clamp(body.referrer, 400) || request.headers.get("referer"),
        is_bot: isBot,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Card scan: failed to record scan:", error.message);
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    /* A crawler is worth recording and worth nothing as a counter. */
    if (codeId && !isBot) {
      const { error: bumpError } = await supabase.rpc("crm_bump_code_scan", { p_code_id: codeId });
      if (bumpError) console.error("Card scan: failed to bump code counter:", bumpError.message);
    }

    return NextResponse.json({ ok: true, scan_id: scan.id, is_bot: isBot });
  } catch (err) {
    console.error("Card scan: unexpected error:", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
