"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getFormat } from "@/lib/social/formats";
import { renderSocialImage } from "@/lib/social/render";
import { normalizeSpec, type SocialImageSpec } from "@/lib/social/spec";

/**
 * Writes for the social image library.
 *
 * Reads happen in the browser against RLS, the same way the rest of the
 * admin works. Writes come through here for two reasons: the spec gets
 * normalized server-side so a bad row can never reach the renderer, and
 * approval has to render a PNG, which needs the filesystem for the lockup.
 */

const BUCKET = "social-images";

export type AssetStatus = "draft" | "approved" | "archived";

export interface SocialAssetRow {
  id: string;
  title: string;
  spec: SocialImageSpec;
  template: string;
  format: string;
  theme: string;
  width: number;
  height: number;
  status: AssetStatus;
  source: "studio" | "kipp";
  set_id: string | null;
  /** Groups the sizes of one card. Null for a card standing on its own. */
  variation_id: string | null;
  slide_index: number;
  campaign_slug: string | null;
  post_slug: string | null;
  note: string | null;
  storage_path: string | null;
  public_url: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
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

export interface SaveAssetInput {
  /** Present when editing an existing card, absent when saving a new one */
  id?: string;
  title: string;
  spec: unknown;
  note?: string;
  campaignSlug?: string;
  postSlug?: string;
}

/**
 * Push an edit out to the other sizes of the same card.
 *
 * A variation group is one message in several formats, so the whole spec
 * travels except the format itself: the renderer already adapts a card to
 * its size on its own, scaling type from `formats.ts` and keeping clear of
 * the story and banner safe areas through `contentInsets`. Syncing only the
 * words would leave a theme or a backdrop change stranded on one size.
 *
 * A synced sibling goes back to draft for the same reason the edited card
 * does: its PNG no longer matches its spec, and serving the stale file at
 * the address someone already pasted is the worse of the two outcomes.
 *
 * Failures here are logged rather than returned. The edit the person asked
 * for has already been written, and failing the whole save because a second
 * size could not be updated would lose the thing they were actually doing.
 */
async function syncVariations(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  id: string,
  spec: SocialImageSpec,
  title: string
): Promise<number> {
  const { data: edited, error: readError } = await supabase
    .from("social_image_assets")
    .select("variation_id")
    .eq("id", id)
    .single();

  const variationId = (edited as { variation_id: string | null } | null)?.variation_id;
  if (readError || !variationId) return 0;

  const { data: siblings, error: siblingError } = await supabase
    .from("social_image_assets")
    .select("id, format")
    .eq("variation_id", variationId)
    .neq("id", id);

  if (siblingError || !siblings || siblings.length === 0) return 0;

  let synced = 0;
  for (const sibling of siblings as { id: string; format: string }[]) {
    const siblingSpec = normalizeSpec({ ...spec, format: sibling.format });
    const siblingFormat = getFormat(siblingSpec.format);
    const { error } = await supabase
      .from("social_image_assets")
      .update({
        title,
        spec: siblingSpec,
        template: siblingSpec.template,
        theme: siblingSpec.theme,
        width: siblingFormat.width,
        height: siblingFormat.height,
        status: "draft",
      })
      .eq("id", sibling.id);

    if (error) {
      console.error(`Variation sync: ${sibling.format} was left as it was:`, error.message);
      continue;
    }
    synced += 1;
  }

  return synced;
}

/**
 * Create or update a card. Always lands as a draft: approving is a
 * separate, deliberate step, including for a card you drew yourself.
 */
export async function saveAsset(input: SaveAssetInput): Promise<ActionResult<{ id: string; synced?: number }>> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { error: "You are signed out. Sign in again to save." };

  const spec = normalizeSpec(input.spec);
  const format = getFormat(spec.format);
  const title = input.title.trim() || spec.headline.trim() || spec.stat.trim() || "Untitled card";

  const row = {
    title: title.slice(0, 160),
    spec,
    template: spec.template,
    format: spec.format,
    theme: spec.theme,
    width: format.width,
    height: format.height,
    note: input.note?.trim() || null,
    campaign_slug: input.campaignSlug?.trim() || null,
    post_slug: input.postSlug?.trim() || null,
  };

  if (input.id) {
    // Editing an approved card sends it back to draft: the file in the
    // bucket no longer matches the spec, and silently serving the old one
    // under the same address would be worse than asking for one more click.
    const { error } = await supabase
      .from("social_image_assets")
      .update({ ...row, status: "draft" })
      .eq("id", input.id);

    if (error) return { error: error.message };

    const synced = await syncVariations(supabase, input.id, spec, row.title);

    revalidatePath("/admin/dashboard/social");
    return { data: { id: input.id, synced } };
  }

  const { data, error } = await supabase
    .from("social_image_assets")
    .insert({ ...row, status: "draft", source: "studio", created_by: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/admin/dashboard/social");
  return { data: { id: data.id as string } };
}

/**
 * Render the card and put it in the bucket, which is what gives it a
 * public address. This is the only place a PNG gets written.
 */
export async function approveAsset(id: string): Promise<ActionResult<{ publicUrl: string }>> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { error: "You are signed out. Sign in again to approve." };

  const { data: asset, error: readError } = await supabase
    .from("social_image_assets")
    .select("id, spec, storage_path")
    .eq("id", id)
    .single();

  if (readError || !asset) return { error: readError?.message || "That card is no longer in the library." };

  let bytes: ArrayBuffer;
  try {
    const image = await renderSocialImage(normalizeSpec(asset.spec));
    bytes = await image.arrayBuffer();
  } catch (err) {
    console.error("Approve: render failed", err);
    return { error: "That card could not be rendered. Check the copy for anything unusual." };
  }

  // Keyed by id so re-approving after an edit overwrites in place and the
  // address someone already pasted keeps working.
  const storagePath = `cards/${id}.png`;

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
    .eq("id", id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/admin/dashboard/social");
  return { data: { publicUrl } };
}

/**
 * Add another size of a card, carrying its copy across.
 *
 * The first call on a card with no group mints one and puts the original in
 * it, which is why a card standing alone has a null `variation_id` rather
 * than a group of one: most cards never need a second size, and a column
 * that is null until it means something is easier to read than one that is
 * always full.
 *
 * The new size always lands as a draft, whatever the card it came from was.
 * A PNG is only ever written by an approval, and this is a copy of a spec.
 */
export async function createVariation(
  id: string,
  format: string
): Promise<ActionResult<{ id: string; variationId: string }>> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { error: "You are signed out. Sign in again to add a size." };

  const { data: source, error: readError } = await supabase
    .from("social_image_assets")
    .select("*")
    .eq("id", id)
    .single();

  if (readError || !source) return { error: readError?.message || "That card is no longer in the library." };

  const row = source as SocialAssetRow;
  if (row.set_id) {
    return { error: "A carousel slide cannot take its own sizes. Save the set in the size you need." };
  }

  const spec = normalizeSpec({ ...row.spec, format });
  if (spec.format === row.format) return { error: "That card is already this size." };

  const variationId = row.variation_id || crypto.randomUUID();

  if (!row.variation_id) {
    const { error } = await supabase
      .from("social_image_assets")
      .update({ variation_id: variationId })
      .eq("id", id);
    if (error) return { error: error.message };
  }

  const target = getFormat(spec.format);
  const { data: created, error } = await supabase
    .from("social_image_assets")
    .insert({
      title: row.title,
      spec,
      template: spec.template,
      format: spec.format,
      theme: spec.theme,
      width: target.width,
      height: target.height,
      status: "draft",
      source: "studio",
      variation_id: variationId,
      note: row.note,
      campaign_slug: row.campaign_slug,
      post_slug: row.post_slug,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    // The unique index on (variation_id, format) is the one failure worth
    // naming: it means the size already exists and the picker should have
    // offered it rather than offering to make it.
    if (error.code === "23505") return { error: "That size is already in this card's set." };
    return { error: error.message };
  }

  revalidatePath("/admin/dashboard/social");
  return { data: { id: created.id as string, variationId } };
}

export interface SaveCarouselInput {
  title: string;
  slides: unknown[];
  note?: string;
  campaignSlug?: string;
  postSlug?: string;
  /** Present when replacing the slides of a set that already exists */
  setId?: string;
}

/**
 * Save a carousel as one row per slide, sharing a set id.
 *
 * Replacing an existing set deletes its slides first rather than trying to
 * match them up: slides get reordered and removed constantly while a set
 * is being written, and a diff would only be a slower way to reach the
 * same place. Approved slides are re-rendered on approval anyway.
 */
export async function saveCarousel(input: SaveCarouselInput): Promise<ActionResult<{ setId: string }>> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { error: "You are signed out. Sign in again to save." };

  const slides = input.slides.map(normalizeSpec);
  if (slides.length === 0) return { error: "A carousel needs at least one slide." };

  const setId = input.setId || crypto.randomUUID();
  const title = input.title.trim() || slides[0].headline.trim() || "Untitled carousel";

  if (input.setId) {
    const { data: existing } = await supabase
      .from("social_image_assets")
      .select("storage_path")
      .eq("set_id", setId);

    const paths = (existing || []).map((row) => row.storage_path).filter(Boolean) as string[];
    if (paths.length > 0) {
      const { error } = await supabase.storage.from(BUCKET).remove(paths);
      if (error) console.error("Carousel: could not remove the old slides:", error.message);
    }

    const { error } = await supabase.from("social_image_assets").delete().eq("set_id", setId);
    if (error) return { error: error.message };
  }

  const rows = slides.map((spec, index) => {
    const format = getFormat(spec.format);
    return {
      title: `${title.slice(0, 140)} ${index + 1}/${slides.length}`,
      spec: { ...spec, slideIndex: index + 1, slideCount: slides.length },
      template: spec.template,
      format: spec.format,
      theme: spec.theme,
      width: format.width,
      height: format.height,
      status: "draft" as const,
      source: "studio" as const,
      set_id: setId,
      slide_index: index + 1,
      note: input.note?.trim() || null,
      campaign_slug: input.campaignSlug?.trim() || null,
      post_slug: input.postSlug?.trim() || null,
      created_by: user.id,
    };
  });

  const { error } = await supabase.from("social_image_assets").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/admin/dashboard/social");
  return { data: { setId } };
}

/**
 * Approve every slide in a set. Runs one at a time on purpose: rendering
 * ten 1080x1920 cards at once is enough work to be worth not doing all at
 * once on a serverless function.
 */
export async function approveSet(setId: string): Promise<ActionResult<{ approved: number }>> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { error: "You are signed out." };

  const { data: slides, error } = await supabase
    .from("social_image_assets")
    .select("id")
    .eq("set_id", setId)
    .order("slide_index", { ascending: true });

  if (error) return { error: error.message };
  if (!slides || slides.length === 0) return { error: "That carousel is no longer in the library." };

  let approved = 0;
  for (const slide of slides) {
    const result = await approveAsset(slide.id as string);
    if (result.error) return { error: `Slide ${approved + 1}: ${result.error}` };
    approved += 1;
  }

  revalidatePath("/admin/dashboard/social");
  return { data: { approved } };
}

export async function deleteSet(setId: string): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { error: "You are signed out." };

  const { data: slides } = await supabase
    .from("social_image_assets")
    .select("storage_path")
    .eq("set_id", setId);

  const paths = (slides || []).map((row) => row.storage_path).filter(Boolean) as string[];
  if (paths.length > 0) {
    const { error } = await supabase.storage.from(BUCKET).remove(paths);
    if (error) console.error("Delete set: could not remove the stored slides:", error.message);
  }

  const { error } = await supabase.from("social_image_assets").delete().eq("set_id", setId);
  if (error) return { error: error.message };

  revalidatePath("/admin/dashboard/social");
  return {};
}

export async function setAssetStatus(id: string, status: AssetStatus): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { error: "You are signed out." };

  const { error } = await supabase.from("social_image_assets").update({ status }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/dashboard/social");
  return {};
}

export async function deleteAsset(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { error: "You are signed out." };

  const { data: asset } = await supabase
    .from("social_image_assets")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (asset?.storage_path) {
    // A leftover file is untidy but harmless, so a failed remove does not
    // stop the row from going.
    const { error } = await supabase.storage.from(BUCKET).remove([asset.storage_path]);
    if (error) console.error("Delete: could not remove the stored card:", error.message);
  }

  const { error } = await supabase.from("social_image_assets").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/dashboard/social");
  return {};
}
