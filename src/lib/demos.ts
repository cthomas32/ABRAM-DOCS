/**
 * The demo library.
 *
 * Videos live at Mux. This module holds the two things the rest of the
 * site needs: the shape of a row, and the URLs you can build from a
 * playback ID. Everything else about a video — the file, the encoding
 * ladder, the poster frames — is Mux's problem.
 *
 * The reading side is deliberately dumb. `getDemoLibrary` runs the one
 * query the public page needs and returns folders with their videos
 * nested, and it returns an empty array rather than throwing when the
 * database is unreachable, because a marketing page with no videos on it
 * is a much better outcome than a 500.
 *
 * See .agents/video-hosting.md.
 */

import { supabase } from "@/utils/supabase/static";

/**
 * The console groups videos with no folder under this id. It lives here
 * rather than in the panel because a client component imports it, and
 * importing a constant from a server component drags the server's
 * Supabase client into the browser bundle with it.
 */
export const UNSORTED_ID = "unsorted";

export type DemoStatus = "pending" | "uploading" | "processing" | "ready" | "errored";

export interface DemoVideo {
  id: string;
  folderId: string | null;
  slug: string;
  title: string;
  description: string | null;
  playbackId: string | null;
  duration: number | null;
  thumbnailTime: number;
  status: DemoStatus;
  published: boolean;
  publishedAt: string | null;
  position: number;
  muxUploadId: string | null;
  muxAssetId: string | null;
  error: string | null;
}

export interface DemoFolder {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  position: number;
  videos: DemoVideo[];
}

/* Selected by name rather than with `*` so a column added later does not
   silently widen what reaches the browser. */
const VIDEO_COLUMNS =
  "id, folder_id, slug, title, description, playback_id, duration_seconds, thumbnail_time, status, published, published_at, position, mux_upload_id, mux_asset_id, error";

const FOLDER_COLUMNS = "id, slug, name, description, position";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function toVideo(row: any): DemoVideo {
  return {
    id: row.id,
    folderId: row.folder_id ?? null,
    slug: row.slug,
    title: row.title,
    description: row.description ?? null,
    playbackId: row.playback_id ?? null,
    duration: row.duration_seconds === null || row.duration_seconds === undefined
      ? null
      : Number(row.duration_seconds),
    thumbnailTime: Number(row.thumbnail_time ?? 0),
    status: (row.status ?? "pending") as DemoStatus,
    published: Boolean(row.published),
    publishedAt: row.published_at ?? null,
    position: Number(row.position ?? 0),
    muxUploadId: row.mux_upload_id ?? null,
    muxAssetId: row.mux_asset_id ?? null,
    error: row.error ?? null,
  };
}

function toFolder(row: any): Omit<DemoFolder, "videos"> {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? null,
    position: Number(row.position ?? 0),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * What the public page renders: live folders, each holding the videos a
 * person published that actually have something to play.
 *
 * Row level security enforces both halves of that on the anon key, so the
 * filters below are the same rule said twice on purpose — if the policy
 * were ever loosened, this query would still not leak a draft.
 *
 * Empty folders are dropped. A heading over nothing is worse than no
 * heading, and a folder that has been made but not filled is the normal
 * mid-recording state.
 */
export async function getDemoLibrary(): Promise<DemoFolder[]> {
  try {
    const [folderResult, videoResult] = await Promise.all([
      supabase.from("demo_folders").select(FOLDER_COLUMNS).eq("archived", false).order("position"),
      supabase
        .from("demo_videos")
        .select(VIDEO_COLUMNS)
        .eq("published", true)
        .eq("status", "ready")
        .not("playback_id", "is", null)
        .order("position"),
    ]);

    if (folderResult.error || videoResult.error) {
      console.error(
        "Error loading demo library:",
        folderResult.error?.message ?? videoResult.error?.message,
      );
      return [];
    }

    const videos = (videoResult.data ?? []).map(toVideo);

    return (folderResult.data ?? [])
      .map(toFolder)
      .map((folder) => ({
        ...folder,
        videos: videos.filter((video) => video.folderId === folder.id),
      }))
      .filter((folder) => folder.videos.length > 0);
  } catch (err) {
    console.error("Error fetching demo library:", err);
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Mux URLs                                                           */
/* ------------------------------------------------------------------ */

const IMAGE_HOST = "https://image.mux.com";
const STREAM_HOST = "https://stream.mux.com";

/**
 * Poster frame. Mux renders and caches these off the playback ID, so any
 * width is free and there is no reason to ship one size for every slot.
 */
export function thumbnailUrl(
  video: Pick<DemoVideo, "playbackId" | "thumbnailTime">,
  { width = 1280, height = 720 }: { width?: number; height?: number } = {},
): string {
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    fit_mode: "smartcrop",
    time: String(video.thumbnailTime ?? 0),
  });
  return `${IMAGE_HOST}/${video.playbackId}/thumbnail.webp?${params}`;
}

/**
 * A six second silent loop starting at the poster frame, for hover. Capped
 * small on purpose: this downloads on an intent that is often just the
 * cursor passing through on its way somewhere else.
 */
export function previewUrl(video: Pick<DemoVideo, "playbackId" | "thumbnailTime">): string {
  const start = video.thumbnailTime ?? 0;
  const params = new URLSearchParams({
    start: String(start),
    end: String(start + 6),
    width: "640",
    fps: "15",
  });
  return `${IMAGE_HOST}/${video.playbackId}/animated.webp?${params}`;
}

/** The HLS manifest. Only used for VideoObject markup — the player takes the playback ID. */
export function streamUrl(video: Pick<DemoVideo, "playbackId">): string {
  return `${STREAM_HOST}/${video.playbackId}.m3u8`;
}

/** 246 -> "4:06". Null when the runtime was never recorded. */
export function formatDuration(seconds?: number | null): string | null {
  if (!seconds || seconds < 0) return null;
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** "Getting Started!" -> "getting-started". Empty when the title has no letters or digits. */
export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}
