import { NextResponse } from "next/server";
import { getNetworkSupabase } from "@/utils/supabase/network";

/**
 * Fire-and-forget view/click counter for creator bio pages at /l/<slug>.
 *
 * POST /api/l-track
 *   { slug: string, blockId?: string }
 *
 * Proxies to record_link_page_event() in the abram-network Supabase project
 * (see supabase/migrations/20270823000000_link_hub_app.sql there). That
 * function is anon-executable and already safe to call directly from the
 * browser with the network anon key, but this route keeps
 * NETWORK_SUPABASE_URL / NETWORK_SUPABASE_ANON_KEY server-only, matching how
 * /api/track/link keeps this repo's own link hub counters off the client.
 *
 * Always best-effort: an unknown slug, a missing block id, or the network
 * project being unreachable all resolve the same way — nothing recorded,
 * nothing thrown. The bio page itself never depends on this succeeding.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slug = typeof body?.slug === "string" ? body.slug.trim().toLowerCase() : "";
    const blockId = typeof body?.blockId === "string" ? body.blockId.trim() : null;

    if (!SLUG_PATTERN.test(slug)) {
      return NextResponse.json({ ok: false }, { status: 204 });
    }
    if (blockId && !UUID_PATTERN.test(blockId)) {
      return NextResponse.json({ ok: false }, { status: 204 });
    }

    const client = getNetworkSupabase();
    if (!client) {
      return NextResponse.json({ ok: false }, { status: 204 });
    }

    await client.rpc("record_link_page_event", {
      p_slug: slug,
      p_block_id: blockId,
    });
  } catch {
    // Counting a view or a click is never allowed to surface an error to
    // the page that triggered it.
  }

  return new NextResponse(null, { status: 204 });
}
