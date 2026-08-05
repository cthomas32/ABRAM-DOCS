import { cardUrl } from "@/lib/crm/constants";
import { buildProfileVCard, vcardFilename } from "@/lib/crm/vcard";
import { getCardProfile } from "../profile";

/**
 * The file behind "Save my contact".
 *
 * A phone decides what to do with this from the headers alone, so both of
 * them have to be right: the media type tells iOS and Android to hand it to
 * the address book, and the filename is what the person sees in the sheet
 * that opens. The vCard itself is version 3.0, which every phone reads.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const profile = await getCardProfile(slug);

  if (!profile) {
    return new Response("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const body = buildProfileVCard(profile, cardUrl(profile.slug));

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${vcardFilename(profile.full_name)}"`,
      "Content-Length": String(Buffer.byteLength(body, "utf8")),
      /* Short lived so a corrected phone number reaches the next scanner,
         long enough that a queue of people at a booth is served from cache. */
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
