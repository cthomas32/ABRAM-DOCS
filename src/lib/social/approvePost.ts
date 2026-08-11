import type { SupabaseClient } from "@supabase/supabase-js";
import { renderSocialImage } from "@/lib/social/render";
import { normalizeSpec } from "@/lib/social/spec";

/**
 * Publishing a post's card and marking it ready, without a session.
 *
 * markPostReady in calendarActions.ts does exactly this for someone
 * signed in to the dashboard. The person pressing Approve in Slack is
 * not: they are on a phone, in a channel, and the only thing proving who
 * they are is a signature on the request.
 *
 * So the same two steps happen here against the service role, and the
 * checks that RLS was doing move into the caller: the interactions route
 * verifies the request really came from Slack and that the presser is
 * allowed to answer, before anything below runs.
 *
 * The order matters and is the same order it has always been. The card is
 * rendered and uploaded first, and the post only flips to ready if that
 * worked, because ready is what the morning pack reads and a ready post
 * with no picture arrives as a caption and a hole.
 */

const BUCKET = "social-images";

export interface PublishResult {
  error?: string;
  /** Slide one, which is what previews. Null when the post is words only. */
  publicUrl?: string | null;
  rendered?: number;
}

/** Render one card, put it in the bucket, and mark it approved. */
async function publishAsset(
  supabase: SupabaseClient,
  assetId: string
): Promise<{ error?: string; publicUrl?: string }> {
  const { data: asset, error: readError } = await supabase
    .from("social_image_assets")
    .select("id, spec")
    .eq("id", assetId)
    .maybeSingle();

  if (readError || !asset) return { error: readError?.message || "That card is no longer in the library." };

  let bytes: ArrayBuffer;
  try {
    const image = await renderSocialImage(normalizeSpec(asset.spec));
    bytes = await image.arrayBuffer();
  } catch (err) {
    console.error("Slack approve: render failed", err);
    return { error: "That card could not be drawn. Check the copy for anything unusual." };
  }

  // Keyed by id so re-approving after an edit overwrites in place and the
  // address someone already pasted keeps working.
  const storagePath = `cards/${assetId}.png`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, bytes, { contentType: "image/png", upsert: true, cacheControl: "3600" });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  const { error: updateError } = await supabase
    .from("social_image_assets")
    .update({
      status: "approved",
      storage_path: storagePath,
      public_url: publicUrl,
      approved_at: new Date().toISOString(),
    })
    .eq("id", assetId);

  if (updateError) return { error: updateError.message };
  return { publicUrl };
}

/**
 * Approve a post: publish every card it carries, then flip it to ready.
 *
 * Idempotent by construction. Approving twice re-renders the same spec to
 * the same path and sets the same status, which is what makes a
 * double-pressed button harmless while the first press is still working.
 */
export async function publishPost(
  supabase: SupabaseClient,
  postId: string,
  reviewedBy: string
): Promise<PublishResult> {
  const { data: post, error: readError } = await supabase
    .from("social_posts")
    .select("id, asset_id, set_id, caption, status")
    .eq("id", postId)
    .maybeSingle();

  if (readError || !post) return { error: readError?.message || "That post is no longer on the calendar." };

  if (!post.caption?.trim() && !post.asset_id) {
    return { error: "That post has neither words nor a card. There would be nothing to post." };
  }

  // A carousel goes out as a set, so every slide has to exist as a file,
  // not just the one that previews.
  let slideIds: string[] = [];
  if (post.set_id) {
    const { data: slides } = await supabase
      .from("social_image_assets")
      .select("id")
      .eq("set_id", post.set_id)
      .order("slide_index", { ascending: true });
    slideIds = (slides || []).map((slide) => slide.id as string);
  } else if (post.asset_id) {
    slideIds = [post.asset_id as string];
  }

  let publicUrl: string | null = null;
  let rendered = 0;
  for (const slideId of slideIds) {
    const result = await publishAsset(supabase, slideId);
    if (result.error) return { error: `The card could not be published: ${result.error}` };
    if (rendered === 0) publicUrl = result.publicUrl || null;
    rendered += 1;
  }

  const { error } = await supabase
    .from("social_posts")
    .update({
      status: "ready",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      // An approval answers whatever was asked for last time.
      revision_requested_at: null,
    })
    .eq("id", postId);

  if (error) return { error: error.message };
  return { publicUrl, rendered };
}
