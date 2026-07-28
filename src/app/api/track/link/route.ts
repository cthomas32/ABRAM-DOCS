import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Click counter for the link hub.
 *
 * POST /api/track/link  { linkId }
 *
 * The increment runs through the service role so the table stays closed
 * to public writes. Nothing about the visitor is recorded, only that the
 * link was followed.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error("Link click: missing platform credentials.");
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    let body: { linkId?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
    }

    const linkId = typeof body.linkId === "string" ? body.linkId.trim() : "";
    if (!UUID_PATTERN.test(linkId)) {
      return NextResponse.json({ ok: false, error: "Unrecognised link." }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await supabase.rpc("record_link_hub_click", { p_link_id: linkId });

    if (error) {
      console.error("Link click: failed to record:", error.message);
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Link click: unexpected error:", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
