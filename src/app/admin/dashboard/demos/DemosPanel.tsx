import { createClient } from "@/utils/supabase/server";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { muxIsConfigured } from "@/lib/mux/client";
import { toVideo, UNSORTED_ID, type DemoFolder, type DemoVideo } from "@/lib/demos";
import { DEMOS_PASSWORD_KEY, resolveDemosPassword } from "@/lib/demosGate";
import Panel from "@/components/admin/Panel";
import DemosClient from "./DemosClient";
import DemosPasswordCard, { type PasswordSource } from "./DemosPasswordCard";

/**
 * The demo library, in the console.
 *
 * Reads everything — drafts, half-processed uploads, failures — which the
 * public page cannot, because the console's SELECT policy is a second
 * permissive policy on the same tables rather than a widened version of
 * the anon one.
 *
 * Videos with no folder are not hidden. They come back as an "Unsorted"
 * pseudo-folder so a recording that lost its folder is visible and can be
 * filed, rather than existing only in the database.
 */

const VIDEO_COLUMNS =
  "id, folder_id, slug, title, description, playback_id, duration_seconds, thumbnail_time, status, published, published_at, position, mux_upload_id, mux_asset_id, error";

export default async function DemosPanel() {
  const user = await getConsoleUser();
  const mayWrite = can(user, "content.demos");

  const supabase = await createClient();

  const [folderResult, videoResult, passwordResult] = await Promise.all([
    supabase
      .from("demo_folders")
      .select("id, slug, name, description, position")
      .eq("archived", false)
      .order("position"),
    supabase.from("demo_videos").select(VIDEO_COLUMNS).order("position"),
    supabase.from("site_settings").select("value").eq("key", DEMOS_PASSWORD_KEY).maybeSingle(),
  ]);

  /* Read here rather than passed to the client, and only its length goes
     any further. The word itself never reaches the browser. */
  const stored = (passwordResult.data?.value as string | undefined)?.trim() ?? "";
  const password = resolveDemosPassword(stored);
  const source: PasswordSource =
    stored.length > 0
      ? "saved"
      : (process.env.DEMOS_PASSWORD?.trim() ?? "").length > 0
        ? "environment"
        : "default";

  const loadError = folderResult.error?.message ?? videoResult.error?.message ?? null;

  const videos: DemoVideo[] = (videoResult.data ?? []).map(toVideo);

  const folders: DemoFolder[] = (folderResult.data ?? []).map((row) => ({
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    position: Number(row.position ?? 0),
    videos: videos.filter((video) => video.folderId === row.id),
  }));

  const unfiled = videos.filter((video) => !video.folderId);
  if (unfiled.length > 0) {
    folders.push({
      id: UNSORTED_ID,
      slug: UNSORTED_ID,
      name: "Unsorted",
      description: "Not in a folder, so not on the site. Move them into one.",
      position: 9999,
      videos: unfiled,
    });
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {loadError && (
        <Panel title="The demo library could not be read">{loadError}</Panel>
      )}

      {!muxIsConfigured() && (
        <Panel tone="attention" title="Uploads are switched off on this environment">
          MUX_TOKEN_ID and MUX_TOKEN_SECRET are not set here, so the file picker will refuse.
          Everything else on this screen works. See .agents/video-hosting.md.
        </Panel>
      )}

      <DemosPasswordCard length={password.length} source={source} mayWrite={mayWrite} />

      <DemosClient folders={folders} mayWrite={mayWrite} uploadsReady={muxIsConfigured()} />
    </div>
  );
}
