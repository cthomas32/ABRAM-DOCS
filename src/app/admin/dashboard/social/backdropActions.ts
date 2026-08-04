"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { BACKDROP_BUCKET } from "@/lib/social/backdrops";

/**
 * The uploaded backdrop library.
 *
 * The upload itself happens in the browser rather than through here, which
 * is the one place this feature departs from the house pattern. A server
 * action carries its arguments in the request body and Next caps that at a
 * megabyte by default, so a photograph would have to be small enough to be
 * the wrong photograph. The browser talks to the bucket directly instead,
 * under the same row level security everything else reads through, and the
 * bucket enforces the two things that matter: it accepts three image types
 * and it refuses anything over twelve megabytes.
 *
 * What is left here is the pair of writes that want to happen together, or
 * want the page revalidated afterwards.
 */

const TABLE = "social_backdrop_images";

interface ActionResult<T = undefined> {
  error?: string;
  data?: T;
}

export interface BackdropImageRow {
  id: string;
  /** The title. Defaults to the filename, which is why it is editable. */
  label: string;
  /** Who took it. Drawn small and faint along the bottom of a card. */
  credit: string | null;
  /** Their handle, stored bare. The half of a credit that reaches them. */
  credit_handle: string | null;
  storage_path: string;
  public_url: string;
  base_color: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  /** What it weighed before the browser scaled it. Null on older rows. */
  original_bytes: number | null;
  created_at: string;
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * Retitle an image, and say who took it.
 *
 * The title is what KIPP names a backdrop by, so it is the one field here
 * that has a job beyond being readable: `scripts/social-draft.js` resolves
 * a proposal's `backdropImage` against these labels and stops the run if
 * nothing matches. Two images called the same thing is therefore a real
 * ambiguity, and the write refuses it.
 */
export async function updateBackdrop(
  id: string,
  input: { label: string; credit?: string; handle?: string }
): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { error: "You are signed out. Sign in again to save that." };

  /**
   * Read defensively. A server action is a route by another name: its
   * arguments arrive over the wire and are whatever the caller sent, which
   * includes a browser still running last deploy's bundle. Adding `handle`
   * to this signature made every open tab call it without one, and
   * `undefined.trim()` came back as a 500 with a stack trace rather than as
   * anything a person could act on.
   */
  const text = (value: unknown) => (typeof value === "string" ? value : "").trim();

  const label = text(input?.label).slice(0, 120);
  if (!label) return { error: "An image needs a title you will recognise later." };

  // Compared here rather than with `ilike`, whose pattern would treat a
  // per cent or an underscore in a title as a wildcard and report a clash
  // against images that are not called this at all.
  const { data: existing } = await supabase.from(TABLE).select("id,label").neq("id", id);
  const needle = label.toLowerCase();

  if ((existing || []).some((row) => (row.label as string).toLowerCase() === needle)) {
    return { error: `Another image is already called "${label}". KIPP picks one by its title, so they have to differ.` };
  }

  const { error } = await supabase
    .from(TABLE)
    .update({
      label,
      credit: text(input?.credit).slice(0, 160) || null,
      // Stored bare, so the caption can put an @ in front of it and the
      // card can too, and neither has to guess whether one is there.
      credit_handle: text(input?.handle).replace(/^@+/, "").slice(0, 80) || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/dashboard/social");
  return {};
}

/**
 * Remove a photograph from the library and the bucket.
 *
 * Cards already drawn on it are untouched: an approved card is a PNG with
 * the picture baked in, and a draft keeps its path and comes out on the
 * base colour, which is the same thing that happens when a file is
 * unreadable. Removing the file rather than the row would leave a picker
 * full of pictures that no longer draw, which is worse.
 */
export async function deleteBackdrop(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { error: "You are signed out. Sign in again to delete that." };

  const { data: row } = await supabase.from(TABLE).select("storage_path").eq("id", id).single();

  if (row?.storage_path) {
    // A leftover file is untidy and harmless, so a failed remove does not
    // stop the row from going.
    const { error } = await supabase.storage.from(BACKDROP_BUCKET).remove([row.storage_path as string]);
    if (error) console.error("Backdrops: could not remove the stored file:", error.message);
  }

  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/dashboard/social");
  return {};
}
