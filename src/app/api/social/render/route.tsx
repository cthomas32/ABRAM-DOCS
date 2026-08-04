import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { renderSocialImage } from "@/lib/social/render";
import { decodeSpec } from "@/lib/social/spec";

/**
 * Renders a social image from a spec in the query string.
 *
 * This is the studio's live preview and the library's thumbnail source:
 * both point an `<img>` at `?s=<base64url spec>` and let the browser do
 * the fetching. Because a saved draft stores only its spec, this route is
 * also what a draft looks like before anyone approves it.
 *
 * SIGNED IN ONLY. Nothing here is secret, but an open renderer is an open
 * invitation to put someone else's words on an ABRAM-branded card and
 * hotlink it. Published cards are served from the storage bucket instead,
 * so gating this costs the public site nothing.
 */

export const runtime = "nodejs";
// Every response depends on the caller's session and their query string.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const spec = decodeSpec(request.nextUrl.searchParams.get("s"));

  try {
    const image = await renderSocialImage(spec);
    // The spec is the cache key and it is already in the URL, so a long
    // immutable cache is safe and keeps the studio preview from redrawing
    // a card the browser has seen. Private: it is a signed-in response.
    const headers = new Headers(image.headers);
    headers.set("Cache-Control", "private, max-age=31536000, immutable");
    return new Response(image.body, { status: image.status, headers });
  } catch (err) {
    console.error("Social render failed:", err);
    return NextResponse.json({ error: "Could not render that card." }, { status: 500 });
  }
}
