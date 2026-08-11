import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { renderSocialImage } from "@/lib/social/render";
import { normalizeSpec } from "@/lib/social/spec";
import { verifyPreviewToken } from "@/lib/social/slackReview";

/**
 * The card on a post that has not been approved yet, drawn for Slack.
 *
 * Slack fetches an image block from its own servers, with no session, so
 * it cannot use /api/social/render — which is signed-in only, and rightly:
 * an open renderer is an open invitation to put someone else's words on an
 * ABRAM-branded card and hotlink it.
 *
 * This is the narrow door instead. One asset, an expiry, and a signature
 * over both, so the address cannot be edited into a card for something
 * else and stops working on its own. Nothing about the card travels in the
 * URL and nothing is written anywhere: the picture is drawn on the way
 * past and forgotten.
 *
 * That last part is the point. A PNG at a public address is exactly what
 * an approval produces, so a draft must not have one. Ask for a revision
 * and this address goes on drawing the old card until the post is
 * rewritten, which costs nothing, because nobody kept the old one.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const search = request.nextUrl.searchParams;

  if (!verifyPreviewToken(id, search.get("e"), search.get("t"))) {
    // Deliberately the same answer for a bad signature, an expired one and
    // an asset that does not exist. A renderer that says which is which is
    // a renderer that can be asked what exists.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("Social preview: missing platform credentials.");
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: asset } = await supabase
    .from("social_image_assets")
    .select("id, spec")
    .eq("id", id)
    .maybeSingle();

  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const image = await renderSocialImage(normalizeSpec(asset.spec));
    const headers = new Headers(image.headers);
    // Public because Slack's image proxy is what fetches it, and short
    // because the whole point of a draft is that it changes. A rewritten
    // post is re-announced with a fresh address anyway.
    headers.set("Cache-Control", "public, max-age=3600");
    return new Response(image.body, { status: image.status, headers });
  } catch (err) {
    console.error("Social preview: render failed", err);
    return NextResponse.json({ error: "Could not draw that card." }, { status: 500 });
  }
}
