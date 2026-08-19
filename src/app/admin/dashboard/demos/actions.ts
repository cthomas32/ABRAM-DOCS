"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { readConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { toSlug, toVideo, type DemoVideo } from "@/lib/demos";
import {
  createDirectUpload,
  deleteAsset,
  getAsset,
  getUpload,
  MuxError,
  publicPlaybackId,
} from "@/lib/mux/client";

/**
 * Writing the demo library.
 *
 * The one thing worth understanding here is that **the video file never
 * passes through this application.** A serverless function caps request
 * bodies at a few megabytes and a screen recording is hundreds; so
 * `startUpload` creates the row and asks Mux for a single-use URL, the
 * browser PUTs the file straight to Mux, and `syncVideo` asks afterwards
 * how it went. Three round trips instead of one upload, and none of them
 * carries the bytes.
 *
 * That is also why a row can exist with no playback ID. `status` is the
 * truth about whether there is anything to watch, and the public read
 * policy requires `published AND playback_id IS NOT NULL AND status =
 * 'ready'` so a half-finished upload cannot render as a broken card.
 *
 * Every action re-checks the permission rather than trusting the panel
 * that called it. The database checks it a third time in RLS, which is
 * the copy that actually protects anything.
 */

const MAX_TITLE = 200;
const MAX_DESCRIPTION = 500;

export interface DemoResult {
  ok: boolean;
  error?: string;
  videoId?: string;
  uploadUrl?: string;
  video?: DemoVideo;
}

function text(value: string | null | undefined, limit: number): string | null {
  const trimmed = (value ?? "").trim().slice(0, limit);
  return trimmed || null;
}

async function writer() {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);

  if (!user) return { error: "Your session has expired. Sign in again." as const };
  if (!can(user, "content.demos")) {
    return { error: "Publishing a demo to the marketing site is an owner's call." as const };
  }
  return { supabase, user };
}

function refresh() {
  revalidatePath("/admin/dashboard/content");
  revalidatePath("/demos");
}

/** A refused write, said in words rather than in a Postgres error code. */
function refusal(code: string | undefined, message: string): string {
  if (code === "23505") return "There is already a demo at that address. Give it a different title.";
  if (/row-level security/i.test(message)) {
    return "Publishing a demo to the marketing site is an owner's call.";
  }
  return message;
}

/**
 * The origin the browser's PUT will come from.
 *
 * Mux echoes `cors_origin` back as the CORS header, so a mismatch shows
 * up in the browser as a blocked request with no useful message. It
 * differs between localhost, a Vercel preview and production, so it is
 * read from the request rather than from a constant.
 */
async function requestOrigin(): Promise<string> {
  const head = await headers();
  const host = head.get("x-forwarded-host") ?? head.get("host");
  const proto = head.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : "https://abram.network";
}

/** Next free slug for a title, so a second "Getting started" lands at -2. */
async function freeSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  title: string,
): Promise<string | null> {
  const base = toSlug(title);
  if (!base) return null;

  const { data } = await supabase.from("demo_videos").select("slug").like("slug", `${base}%`);
  const taken = new Set((data ?? []).map((row) => row.slug as string));

  if (!taken.has(base)) return base;
  for (let n = 2; n < 100; n += 1) {
    if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
  }
  return null;
}

/** One past the last position in a folder, so a new row lands at the bottom. */
async function nextPosition(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "demo_videos" | "demo_folders",
  folderId?: string | null,
): Promise<number> {
  let query = supabase.from(table).select("position").order("position", { ascending: false }).limit(1);
  if (table === "demo_videos") {
    query = folderId ? query.eq("folder_id", folderId) : query.is("folder_id", null);
  }
  const { data } = await query;
  return ((data?.[0]?.position as number | undefined) ?? -1) + 1;
}

/* ------------------------------------------------------------------ */
/*  Folders                                                            */
/* ------------------------------------------------------------------ */

export async function createFolder(name: string): Promise<DemoResult> {
  const gate = await writer();
  if ("error" in gate) return { ok: false, error: gate.error };

  const clean = text(name, 120);
  if (!clean) return { ok: false, error: "Give the folder a name." };

  const slug = toSlug(clean);
  if (!slug) {
    return { ok: false, error: "That name has no letters or numbers in it, so there is no address to make from it." };
  }

  const { error } = await gate.supabase.from("demo_folders").insert({
    slug,
    name: clean,
    position: await nextPosition(gate.supabase, "demo_folders"),
  });

  if (error) return { ok: false, error: refusal(error.code, error.message) };
  refresh();
  return { ok: true };
}

export async function updateFolder(
  id: string,
  input: { name?: string; description?: string },
): Promise<DemoResult> {
  const gate = await writer();
  if ("error" in gate) return { ok: false, error: gate.error };

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) {
    const clean = text(input.name, 120);
    if (!clean) return { ok: false, error: "A folder needs a name." };
    patch.name = clean;
  }
  /* The slug is not rebuilt from a renamed folder. Nothing links to a
     folder by address today, but the moment something does, a rename
     would silently break it. */
  if (input.description !== undefined) patch.description = text(input.description, MAX_DESCRIPTION);

  const { error } = await gate.supabase.from("demo_folders").update(patch).eq("id", id);
  if (error) return { ok: false, error: refusal(error.code, error.message) };
  refresh();
  return { ok: true };
}

/**
 * Deleting a folder does not delete what is in it.
 *
 * The foreign key is ON DELETE SET NULL, so the videos become unfiled and
 * show up in the console's Unsorted section. Losing a recording because
 * somebody tidied up a heading would be an unreasonable thing for a
 * delete button to do.
 */
export async function deleteFolder(id: string): Promise<DemoResult> {
  const gate = await writer();
  if ("error" in gate) return { ok: false, error: gate.error };

  const { error } = await gate.supabase.from("demo_folders").delete().eq("id", id);
  if (error) return { ok: false, error: refusal(error.code, error.message) };
  refresh();
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Ordering                                                           */
/* ------------------------------------------------------------------ */

/**
 * Swap a folder with its neighbour.
 *
 * Two updates rather than a renumber of the whole list, because the list
 * is short and a renumber would rewrite every row on every nudge. The two
 * writes are not in one transaction: the worst case is two folders
 * sharing a position, which sorts arbitrarily between them and is fixed
 * by pressing the button again.
 */
async function swapFolders(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
  direction: "up" | "down",
): Promise<string | null> {
  const { data: rows, error } = await supabase
    .from("demo_folders")
    .select("id, position")
    .eq("archived", false)
    .order("position");
  if (error) return error.message;

  const list = (rows ?? []) as { id: string; position: number }[];
  const index = list.findIndex((row) => row.id === id);
  if (index < 0) return "That folder is gone. Refresh the page.";

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= list.length) return null; // Already at the end; not an error.

  const a = list[index];
  const b = list[target];

  const first = await supabase.from("demo_folders").update({ position: b.position }).eq("id", a.id);
  if (first.error) return refusal(first.error.code, first.error.message);
  const second = await supabase.from("demo_folders").update({ position: a.position }).eq("id", b.id);
  if (second.error) return refusal(second.error.code, second.error.message);

  return null;
}

export async function moveFolder(id: string, direction: "up" | "down"): Promise<DemoResult> {
  const gate = await writer();
  if ("error" in gate) return { ok: false, error: gate.error };

  const error = await swapFolders(gate.supabase, id, direction);
  if (error) return { ok: false, error };
  refresh();
  return { ok: true };
}

/**
 * Videos are ordered within their folder, so the neighbour to swap with
 * is the next one *in the same folder* rather than the next one in the
 * table. Done here rather than in `swap` because the sibling set is the
 * only thing that differs between the two.
 */
export async function moveVideo(id: string, direction: "up" | "down"): Promise<DemoResult> {
  const gate = await writer();
  if ("error" in gate) return { ok: false, error: gate.error };

  const { data: row, error: readError } = await gate.supabase
    .from("demo_videos")
    .select("id, folder_id, position")
    .eq("id", id)
    .maybeSingle();

  if (readError) return { ok: false, error: readError.message };
  if (!row) return { ok: false, error: "That demo is gone. Refresh the page." };

  const folderId = row.folder_id as string | null;
  let siblings = gate.supabase.from("demo_videos").select("id, position").order("position");
  siblings = folderId ? siblings.eq("folder_id", folderId) : siblings.is("folder_id", null);

  const { data: list, error: listError } = await siblings;
  if (listError) return { ok: false, error: listError.message };

  const rows = (list ?? []) as { id: string; position: number }[];
  const index = rows.findIndex((entry) => entry.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= rows.length) return { ok: true };

  const a = rows[index];
  const b = rows[target];

  const first = await gate.supabase.from("demo_videos").update({ position: b.position }).eq("id", a.id);
  if (first.error) return { ok: false, error: refusal(first.error.code, first.error.message) };
  const second = await gate.supabase.from("demo_videos").update({ position: a.position }).eq("id", b.id);
  if (second.error) return { ok: false, error: refusal(second.error.code, second.error.message) };

  refresh();
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Uploading                                                          */
/* ------------------------------------------------------------------ */

/**
 * Step one of three: make the row, get the URL.
 *
 * The row is written before Mux is asked for anything, so a failure at
 * Mux leaves a visible `errored` row explaining itself rather than a
 * silent nothing. The upload URL goes back to the browser, which is safe
 * — it is single use, write only, and expires.
 */
export async function startUpload(input: {
  folderId: string | null;
  title: string;
}): Promise<DemoResult> {
  const gate = await writer();
  if ("error" in gate) return { ok: false, error: gate.error };

  const title = text(input.title, MAX_TITLE);
  if (!title) return { ok: false, error: "Give the demo a title before choosing a file." };

  const slug = await freeSlug(gate.supabase, title);
  if (!slug) {
    return { ok: false, error: "That title has no letters or numbers in it, so there is no address to make from it." };
  }

  const { data: row, error } = await gate.supabase
    .from("demo_videos")
    .insert({
      folder_id: input.folderId,
      slug,
      title,
      status: "pending",
      position: await nextPosition(gate.supabase, "demo_videos", input.folderId),
      created_by: gate.user.userId,
    })
    .select("id")
    .single();

  if (error || !row) {
    return { ok: false, error: refusal(error?.code, error?.message ?? "Could not create the demo.") };
  }

  try {
    const upload = await createDirectUpload(await requestOrigin());

    await gate.supabase
      .from("demo_videos")
      .update({ mux_upload_id: upload.id, status: "uploading" })
      .eq("id", row.id);

    refresh();
    return { ok: true, videoId: row.id as string, uploadUrl: upload.url };
  } catch (err) {
    const message = err instanceof MuxError ? err.message : "Could not reach Mux.";
    await gate.supabase
      .from("demo_videos")
      .update({ status: "errored", error: message })
      .eq("id", row.id);
    refresh();
    return { ok: false, error: message };
  }
}

/**
 * Step three: ask Mux what happened.
 *
 * Called once when the browser's PUT finishes, and then on a timer while
 * the row is still processing. Polling rather than a webhook because a
 * webhook needs a public endpoint, a signature check and a secret, and
 * this runs while somebody is sitting on the page watching it — the one
 * situation where polling is the honest tool. A webhook becomes worth it
 * if uploads ever have to complete with nobody watching.
 */
export async function syncVideo(videoId: string): Promise<DemoResult> {
  const gate = await writer();
  if ("error" in gate) return { ok: false, error: gate.error };

  const { data: row, error: readError } = await gate.supabase
    .from("demo_videos")
    .select("id, mux_upload_id, mux_asset_id, status")
    .eq("id", videoId)
    .maybeSingle();

  if (readError) return { ok: false, error: readError.message };
  if (!row) return { ok: false, error: "That demo is gone. Refresh the page." };

  try {
    let assetId = row.mux_asset_id as string | null;

    /* The upload record is the only handle that exists until Mux has
       accepted the file; it is what turns into an asset id. */
    if (!assetId && row.mux_upload_id) {
      const upload = await getUpload(row.mux_upload_id as string);

      if (upload.status === "errored" || upload.status === "cancelled" || upload.status === "timed_out") {
        const message = upload.error?.message ?? `The upload ${upload.status.replace("_", " ")}.`;
        await gate.supabase
          .from("demo_videos")
          .update({ status: "errored", error: message })
          .eq("id", videoId);
        refresh();
        return { ok: false, error: message };
      }

      assetId = upload.asset_id ?? null;
      if (assetId) {
        await gate.supabase
          .from("demo_videos")
          .update({ mux_asset_id: assetId, status: "processing" })
          .eq("id", videoId);
      }
    }

    /* No asset yet just means Mux is still receiving. Not an error. */
    if (!assetId) return { ok: true };

    const asset = await getAsset(assetId);

    if (asset.status === "errored") {
      const message = asset.errors?.messages?.join(" ") ?? "Mux could not process that file.";
      await gate.supabase
        .from("demo_videos")
        .update({ status: "errored", error: message })
        .eq("id", videoId);
      refresh();
      return { ok: false, error: message };
    }

    if (asset.status !== "ready") {
      await gate.supabase.from("demo_videos").update({ status: "processing" }).eq("id", videoId);
      return { ok: true };
    }

    const playbackId = publicPlaybackId(asset);
    if (!playbackId) {
      const message = "Mux finished encoding but gave the asset no public playback ID.";
      await gate.supabase
        .from("demo_videos")
        .update({ status: "errored", error: message })
        .eq("id", videoId);
      refresh();
      return { ok: false, error: message };
    }

    const { data: updated, error: writeError } = await gate.supabase
      .from("demo_videos")
      .update({
        status: "ready",
        playback_id: playbackId,
        duration_seconds: asset.duration ?? null,
        error: null,
      })
      .eq("id", videoId)
      .select("*")
      .single();

    if (writeError) return { ok: false, error: refusal(writeError.code, writeError.message) };

    refresh();
    return { ok: true, video: updated ? toVideo(updated) : undefined };
  } catch (err) {
    return { ok: false, error: err instanceof MuxError ? err.message : "Could not reach Mux." };
  }
}

/** The browser's PUT finished. Records that and lets `syncVideo` take over. */
export async function markUploaded(videoId: string): Promise<DemoResult> {
  const gate = await writer();
  if ("error" in gate) return { ok: false, error: gate.error };

  await gate.supabase.from("demo_videos").update({ status: "processing" }).eq("id", videoId);
  return syncVideo(videoId);
}

/* ------------------------------------------------------------------ */
/*  Editing                                                            */
/* ------------------------------------------------------------------ */

export async function updateVideo(
  id: string,
  input: {
    title?: string;
    description?: string;
    thumbnailTime?: number;
    folderId?: string | null;
  },
): Promise<DemoResult> {
  const gate = await writer();
  if ("error" in gate) return { ok: false, error: gate.error };

  const patch: Record<string, unknown> = {};

  if (input.title !== undefined) {
    const clean = text(input.title, MAX_TITLE);
    if (!clean) return { ok: false, error: "A demo needs a title." };
    /* The slug is deliberately not rebuilt. It is the public address at
       /demos?v=<slug>, so renaming a title must not break a link somebody
       has already shared. */
    patch.title = clean;
  }
  if (input.description !== undefined) patch.description = text(input.description, MAX_DESCRIPTION);
  if (input.thumbnailTime !== undefined) {
    patch.thumbnail_time = Math.max(0, Math.round(input.thumbnailTime * 10) / 10);
  }
  if (input.folderId !== undefined) {
    patch.folder_id = input.folderId;
    patch.position = await nextPosition(gate.supabase, "demo_videos", input.folderId);
  }

  const { error } = await gate.supabase.from("demo_videos").update(patch).eq("id", id);
  if (error) return { ok: false, error: refusal(error.code, error.message) };
  refresh();
  return { ok: true };
}

/**
 * The publish switch.
 *
 * Refuses to publish something with nothing to play, because the public
 * read policy would hide it anyway and a switch that silently does
 * nothing is worse than one that says why.
 */
export async function setPublished(id: string, published: boolean): Promise<DemoResult> {
  const gate = await writer();
  if ("error" in gate) return { ok: false, error: gate.error };

  if (published) {
    const { data: row } = await gate.supabase
      .from("demo_videos")
      .select("status, playback_id")
      .eq("id", id)
      .maybeSingle();

    if (!row || row.status !== "ready" || !row.playback_id) {
      return { ok: false, error: "That one is not finished processing yet, so there is nothing to publish." };
    }
  }

  const { error } = await gate.supabase.from("demo_videos").update({ published }).eq("id", id);
  if (error) return { ok: false, error: refusal(error.code, error.message) };
  refresh();
  return { ok: true };
}

/**
 * Delete the row, and the asset behind it.
 *
 * Mux is asked first. If that fails the row stays, because a row with a
 * dead playback ID is a visible problem somebody can retry, whereas a
 * deleted row pointing at an asset still being billed for is invisible.
 * A missing asset (404) is treated as success — it is already gone.
 */
export async function deleteVideo(id: string): Promise<DemoResult> {
  const gate = await writer();
  if ("error" in gate) return { ok: false, error: gate.error };

  const { data: row } = await gate.supabase
    .from("demo_videos")
    .select("mux_asset_id")
    .eq("id", id)
    .maybeSingle();

  const assetId = row?.mux_asset_id as string | null | undefined;
  if (assetId) {
    try {
      await deleteAsset(assetId);
    } catch (err) {
      if (!(err instanceof MuxError && err.status === 404)) {
        return {
          ok: false,
          error: `The video is still at Mux, so nothing was deleted: ${
            err instanceof MuxError ? err.message : "could not reach Mux."
          }`,
        };
      }
    }
  }

  const { error } = await gate.supabase.from("demo_videos").delete().eq("id", id);
  if (error) return { ok: false, error: refusal(error.code, error.message) };
  refresh();
  return { ok: true };
}
