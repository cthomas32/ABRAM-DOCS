import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Ingest endpoint for the link hub.
 *
 * POST /api/track/link
 *   { type: "view",  sessionId, visit?: { referrer, language } }
 *   { type: "click", sessionId?, linkId }
 *   { type: "share", sessionId }
 *
 * Writes go through the service role so the tables stay closed to the
 * public. No raw IP address is ever persisted: the address is combined
 * with the user agent and a salt that rotates daily, then hashed, purely
 * so repeat hits can be recognised without identifying anyone.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const BOT_PATTERN =
  /bot|crawl|spider|slurp|scrape|curl|wget|python-requests|headlesschrome|lighthouse|pagespeed|gtmetrix|facebookexternalhit|whatsapp|telegrambot|discordbot|slackbot|bingpreview|embedly|preview/i;

/** Referrer hosts worth naming as a channel rather than lumping into "other". */
const SOURCE_HOSTS: [RegExp, string][] = [
  [/instagram\./i, "instagram"],
  [/tiktok\./i, "tiktok"],
  [/(^|\.)x\.com|twitter\./i, "x"],
  [/youtube\.|youtu\.be/i, "youtube"],
  [/linkedin\.|lnkd\.in/i, "linkedin"],
  [/facebook\.|fb\./i, "facebook"],
  [/reddit\./i, "reddit"],
  [/threads\./i, "threads"],
  [/google\./i, "google"],
  [/bing\./i, "bing"],
  [/t\.co$/i, "x"],
];

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

function sourceOf(host: string | null): string {
  if (!host) return "direct";
  if (host === "abram.network") return "internal";
  for (const [pattern, name] of SOURCE_HOSTS) {
    if (pattern.test(host)) return name;
  }
  return host;
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error("Link hub telemetry: missing platform credentials.");
      // Never break the visitor experience over a tracking failure.
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
    }

    // The original endpoint only ever counted clicks, so a bare linkId
    // is still accepted.
    const type = clamp(body.type, 12) || (body.linkId ? "click" : null);
    const sessionId = clamp(body.sessionId, 64);

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (type === "click") {
      const linkId = clamp(body.linkId, 64) || "";
      if (!UUID_PATTERN.test(linkId)) {
        return NextResponse.json({ ok: false, error: "Unrecognised link." }, { status: 400 });
      }

      const { error } = await supabase.rpc("record_link_hub_click", {
        p_link_id: linkId,
        p_session_id: sessionId,
      });
      if (error) {
        console.error("Link hub telemetry: failed to record click:", error.message);
        return NextResponse.json({ ok: false }, { status: 200 });
      }
      return NextResponse.json({ ok: true });
    }

    if (type === "view") {
      if (!sessionId) {
        return NextResponse.json({ ok: false, error: "Missing session." }, { status: 400 });
      }

      const userAgent = request.headers.get("user-agent") || "";
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        request.headers.get("x-real-ip") ||
        "0.0.0.0";

      const visit = (body.visit || {}) as Record<string, unknown>;
      const referrer = clamp(visit.referrer, 500);
      const referrerHost = hostOf(referrer);

      const { error } = await supabase.rpc("record_link_hub_view", {
        p_session_id: sessionId,
        p_visit: {
          source: sourceOf(referrerHost),
          referrer,
          referrer_host: referrerHost,
          device_type: parseDevice(userAgent),
          browser: parseBrowser(userAgent),
          os: parseOs(userAgent),
          country: request.headers.get("x-vercel-ip-country") || null,
          language: clamp(visit.language, 12),
          ip_hash: hashVisitor(ip, userAgent),
          is_bot: BOT_PATTERN.test(userAgent),
        },
      });
      if (error) {
        console.error("Link hub telemetry: failed to record view:", error.message);
        return NextResponse.json({ ok: false }, { status: 200 });
      }
      return NextResponse.json({ ok: true });
    }

    if (type === "share") {
      if (!sessionId) {
        return NextResponse.json({ ok: false, error: "Missing session." }, { status: 400 });
      }
      const { error } = await supabase
        .from("link_hub_events")
        .insert({ session_id: sessionId, event_type: "share" });
      if (error) {
        console.error("Link hub telemetry: failed to record share:", error.message);
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unrecognised event." }, { status: 400 });
  } catch (err) {
    console.error("Link hub telemetry: unexpected error:", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
