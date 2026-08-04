"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { approveAsset, type SocialAssetRow } from "./actions";

/**
 * Writes for the social calendar.
 *
 * Same split as the library: the browser reads against RLS, writes come
 * through here. The one that matters is markPostReady, which approves the
 * card and flips the post in a single click. Those two things were always
 * going to happen together, and splitting them across two screens is how a
 * post ends up in the morning message with no picture behind it.
 */

export type PostStatus = "draft" | "ready" | "posted" | "skipped";
export type CampaignStatus = "planning" | "active" | "done" | "archived";

export interface SocialCampaignRow {
  id: string;
  slug: string;
  name: string;
  goal: string | null;
  page_slug: string | null;
  starts_on: string | null;
  ends_on: string | null;
  status: CampaignStatus;
  created_at: string;
  updated_at: string;
}

export interface SocialPostRow {
  id: string;
  campaign_id: string | null;
  scheduled_for: string;
  slot: number;
  channel: string;
  caption: string;
  link_url: string | null;
  page_slug: string | null;
  asset_id: string | null;
  set_id: string | null;
  alt_text: string | null;
  status: PostStatus;
  source: "studio" | "kipp";
  note: string | null;
  posted_at: string | null;
  notified_at: string | null;
  created_at: string;
  updated_at: string;
  /** Embedded by the browser read, absent on a bare row */
  asset?: SocialAssetRow | null;
}

interface ActionResult<T = undefined> {
  error?: string;
  data?: T;
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

const PATH = "/admin/dashboard/social";

// ---------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------

export interface SavePostInput {
  id?: string;
  campaignId?: string | null;
  scheduledFor: string;
  slot?: number;
  channel: string;
  caption?: string;
  linkUrl?: string | null;
  pageSlug?: string | null;
  assetId?: string | null;
  setId?: string | null;
  altText?: string | null;
  note?: string | null;
}

/**
 * Create or update a post. Always lands as a draft, including an edit of
 * something already marked ready: changing the words after approving them
 * means the approval was for different words.
 */
export async function savePost(input: SavePostInput): Promise<ActionResult<{ id: string }>> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { error: "You are signed out. Sign in again to save." };

  const scheduledFor = input.scheduledFor?.slice(0, 10);
  if (!scheduledFor || !/^\d{4}-\d{2}-\d{2}$/.test(scheduledFor)) {
    return { error: "That post needs a date." };
  }
  if (!input.channel?.trim()) return { error: "Pick a channel for that post." };

  const row = {
    campaign_id: input.campaignId || null,
    scheduled_for: scheduledFor,
    slot: Math.max(1, Math.min(9, Math.round(input.slot || 1))),
    channel: input.channel.trim().toLowerCase(),
    caption: (input.caption || "").slice(0, 4000),
    link_url: input.linkUrl?.trim() || null,
    page_slug: input.pageSlug?.trim() || null,
    asset_id: input.assetId || null,
    set_id: input.setId || null,
    alt_text: input.altText?.trim().slice(0, 500) || null,
    note: input.note?.trim().slice(0, 1000) || null,
  };

  if (input.id) {
    const { error } = await supabase
      .from("social_posts")
      .update({ ...row, status: "draft", notified_at: null })
      .eq("id", input.id);

    if (error) return { error: error.message };
    revalidatePath(PATH);
    return { data: { id: input.id } };
  }

  const { data, error } = await supabase
    .from("social_posts")
    .insert({ ...row, status: "draft", source: "studio", created_by: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { data: { id: data.id as string } };
}

/**
 * Approve the card and mark the post ready, in that order.
 *
 * Ready is what the morning job reads, and the message it sends carries
 * the image at its public address, so a ready post whose card was never
 * rendered would arrive as a caption and a hole. Approving here is the
 * same deliberate click it is in the library, it just does the two jobs
 * the one click was always meant to do.
 */
export async function markPostReady(id: string): Promise<ActionResult<{ rendered: number }>> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { error: "You are signed out." };

  const { data: post, error: readError } = await supabase
    .from("social_posts")
    .select("id, asset_id, set_id, caption, link_url")
    .eq("id", id)
    .single();

  if (readError || !post) return { error: readError?.message || "That post is no longer on the calendar." };

  if (!post.caption?.trim() && !post.asset_id) {
    return { error: "That post has neither words nor a card. There would be nothing to post." };
  }

  // A carousel goes out as a set, so every slide has to exist as a file,
  // not just the one that previews on the calendar.
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

  let rendered = 0;
  for (const slideId of slideIds) {
    const result = await approveAsset(slideId);
    if (result.error) return { error: `The card could not be published: ${result.error}` };
    rendered += 1;
  }

  const { error } = await supabase.from("social_posts").update({ status: "ready" }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(PATH);
  return { data: { rendered } };
}

export async function setPostStatus(id: string, status: PostStatus): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { error: "You are signed out." };

  const patch: Record<string, unknown> = { status };
  // Stamped here rather than in the UI so the record of when something
  // went out survives a page that was open in another tab.
  if (status === "posted") patch.posted_at = new Date().toISOString();
  if (status === "draft") patch.posted_at = null;

  const { error } = await supabase.from("social_posts").update(patch).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(PATH);
  return {};
}

export async function deletePost(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { error: "You are signed out." };

  // The card is not deleted with the post. A picture outlives the slot it
  // was scheduled into and is worth keeping in the library.
  const { error } = await supabase.from("social_posts").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(PATH);
  return {};
}

// ---------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------

export interface SaveCampaignInput {
  id?: string;
  slug: string;
  name: string;
  goal?: string | null;
  pageSlug?: string | null;
  startsOn?: string | null;
  endsOn?: string | null;
  status?: CampaignStatus;
}

export async function saveCampaign(input: SaveCampaignInput): Promise<ActionResult<{ id: string }>> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { error: "You are signed out." };

  const name = input.name?.trim();
  if (!name) return { error: "That campaign needs a name." };

  // utm_campaign ends up in analytics rows that outlive the campaign, so
  // the slug is normalized once here rather than trusted from the form.
  const slug = (input.slug || name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  if (!slug) return { error: "That name does not make a usable campaign tag. Add some letters or numbers." };

  const row = {
    slug,
    name: name.slice(0, 120),
    goal: input.goal?.trim().slice(0, 500) || null,
    page_slug: input.pageSlug?.trim() || null,
    starts_on: input.startsOn || null,
    ends_on: input.endsOn || null,
    status: input.status || "planning",
  };

  if (input.id) {
    const { error } = await supabase.from("social_campaigns").update(row).eq("id", input.id);
    if (error) return { error: error.message };
    revalidatePath(PATH);
    return { data: { id: input.id } };
  }

  const { data, error } = await supabase
    .from("social_campaigns")
    .insert({ ...row, created_by: user.id })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: `There is already a campaign tagged "${slug}".` };
    return { error: error.message };
  }

  revalidatePath(PATH);
  return { data: { id: data.id as string } };
}

export async function deleteCampaign(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { error: "You are signed out." };

  // Posts survive, with campaign_id nulled by the foreign key. Deleting a
  // campaign should not silently delete a week of scheduled work.
  const { error } = await supabase.from("social_campaigns").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(PATH);
  return {};
}
