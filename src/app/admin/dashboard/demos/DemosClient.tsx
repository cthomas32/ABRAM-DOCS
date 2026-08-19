"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  FolderPlus,
  Loader2,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import {
  formatDuration,
  thumbnailUrl,
  UNSORTED_ID,
  type DemoFolder,
  type DemoVideo,
} from "@/lib/demos";
import { EmptyPanel } from "@/components/admin/Panel";
import {
  createFolder,
  deleteFolder,
  deleteVideo,
  markUploaded,
  moveFolder,
  moveVideo,
  setPublished,
  startUpload,
  syncVideo,
  updateFolder,
  updateVideo,
} from "./actions";

/* eslint-disable @next/next/no-img-element */

/**
 * The console side of the demo library.
 *
 * The upload is the only interesting part. A screen recording is far too
 * big to post to a serverless function, so the file never touches this
 * application: a server action makes the row and asks Mux for a single
 * use URL, this component PUTs the file straight to Mux with an
 * XMLHttpRequest (chosen over fetch purely because it reports progress),
 * and then polls until Mux says the asset is playable.
 *
 * Everything else is a list with buttons. Ordering is up/down rather than
 * drag: the lists are short, and a nudge that either works or says why is
 * worth more here than a gesture that needs a library and a touch story.
 */

type Busy = string | null;

/* No red on this console: a failed upload is a sentence, not an alarm. */
const STATUS: Record<DemoVideo["status"], { label: string; dot: string }> = {
  pending: { label: "Waiting", dot: "bg-zinc-600" },
  uploading: { label: "Uploading", dot: "bg-amber-400 animate-pulse" },
  processing: { label: "Processing", dot: "bg-amber-400 animate-pulse" },
  ready: { label: "Ready", dot: "bg-emerald-400" },
  errored: { label: "Failed", dot: "bg-zinc-500" },
};

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-1.5 shrink-0">{children}</div>;
}

function IconButton({
  onClick,
  title,
  disabled,
  children,
}: {
  onClick: () => void;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-transparent text-zinc-500 transition-colors duration-200 hover:border-white/5 hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Uploading                                                          */
/* ------------------------------------------------------------------ */

/**
 * PUT the file to Mux, reporting progress.
 *
 * XMLHttpRequest rather than fetch because fetch still has no upload
 * progress event, and a four hundred megabyte upload with no progress bar
 * is indistinguishable from a hung page.
 */
function putToMux(url: string, file: File, onProgress: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new Error(`Mux refused the file (${request.status}).`));
    request.onerror = () => reject(new Error("The connection dropped during the upload."));
    request.onabort = () => reject(new Error("The upload was cancelled."));

    request.send(file);
  });
}

function UploadBox({
  folderId,
  disabled,
  onDone,
}: {
  folderId: string | null;
  disabled: boolean;
  onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [percent, setPercent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const busy = percent !== null;

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setPercent(0);

      const started = await startUpload({ folderId, title });
      if (!started.ok || !started.uploadUrl || !started.videoId) {
        setError(started.error ?? "Could not start the upload.");
        setPercent(null);
        return;
      }

      try {
        await putToMux(started.uploadUrl, file, setPercent);
        /* Mux now has the bytes and starts encoding. The row goes to
           `processing` and the folder's poller takes it from here. */
        await markUploaded(started.videoId);
        setTitle("");
        onDone();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setPercent(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [folderId, title, onDone],
  );

  return (
    <div className="mt-3 rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          className="admin-input sm:flex-1"
          placeholder="Title for the new demo"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={disabled || busy}
        />

        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />

        <button
          type="button"
          className="btn-glass shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          disabled={disabled || busy || !title.trim()}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {busy ? `${percent}%` : "Choose a video"}
        </button>
      </div>

      {busy && (
        <div className="mt-2.5 h-0.5 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full bg-white/40 transition-[width] duration-200"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      {error && <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">{error}</p>}

      {!busy && !error && (
        <p className="mt-2 text-[11px] text-zinc-600">
          The file goes straight to Mux, not through this site. Give it a title first.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  A video                                                            */
/* ------------------------------------------------------------------ */

function VideoRow({
  video,
  folders,
  mayWrite,
  busy,
  setBusy,
  onChanged,
  onError,
}: {
  video: DemoVideo;
  folders: DemoFolder[];
  mayWrite: boolean;
  busy: Busy;
  setBusy: (id: Busy) => void;
  onChanged: () => void;
  onError: (message: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    title: video.title,
    description: video.description ?? "",
    thumbnailTime: String(video.thumbnailTime),
    folderId: video.folderId ?? "",
  });

  const working = busy === video.id;
  const status = STATUS[video.status];

  const run = async (action: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusy(video.id);
    onError(null);
    const result = await action();
    if (!result.ok) onError(result.error ?? "That did not work.");
    setBusy(null);
    onChanged();
  };

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.015]">
      <div className="flex items-center gap-3 p-2.5">
        <div className="h-11 w-20 shrink-0 overflow-hidden rounded-md bg-white/[0.03] ring-1 ring-white/8">
          {video.playbackId ? (
            <img
              src={thumbnailUrl(video, { width: 320, height: 180 })}
              alt=""
              width={320}
              height={180}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-600" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-white">{video.title}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-zinc-500">
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
            {formatDuration(video.duration) && <span>· {formatDuration(video.duration)}</span>}
            <span className="truncate">· /demos?v={video.slug}</span>
          </p>
          {video.error && (
            <p className="mt-1 text-[10px] leading-relaxed text-zinc-400">{video.error}</p>
          )}
        </div>

        {mayWrite && (
          <Row>
            <button
              type="button"
              disabled={working || video.status !== "ready"}
              onClick={() => void run(() => setPublished(video.id, !video.published))}
              title={video.published ? "Take it off the site" : "Put it on the site"}
              className={`cursor-pointer rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
                video.published
                  ? "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-200"
                  : "border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white"
              }`}
            >
              {video.published ? "Live" : "Draft"}
            </button>

            <IconButton
              title="Move up"
              disabled={working}
              onClick={() => void run(() => moveVideo(video.id, "up"))}
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton
              title="Move down"
              disabled={working}
              onClick={() => void run(() => moveVideo(video.id, "down"))}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton title="Edit" disabled={working} onClick={() => setEditing((open) => !open)}>
              <Pencil className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton
              title="Delete"
              disabled={working}
              onClick={() => {
                if (
                  window.confirm(
                    `Delete "${video.title}"? This removes the video from Mux too, and Mux has no undo.`,
                  )
                ) {
                  void run(() => deleteVideo(video.id));
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </IconButton>
          </Row>
        )}
      </div>

      {editing && mayWrite && (
        <div className="space-y-2.5 border-t border-white/5 p-3">
          <input
            className="admin-input"
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            placeholder="Title"
          />
          <textarea
            className="admin-input min-h-[60px]"
            value={draft.description}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            placeholder="One sentence, shown under the title on the card"
          />

          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex-1 text-[10px] text-zinc-500">
              Poster frame (seconds in)
              <input
                className="admin-input mt-1"
                type="number"
                min={0}
                step={0.5}
                value={draft.thumbnailTime}
                onChange={(event) => setDraft({ ...draft, thumbnailTime: event.target.value })}
              />
            </label>
            <label className="flex-1 text-[10px] text-zinc-500">
              Folder
              <select
                className="admin-input mt-1"
                value={draft.folderId}
                onChange={(event) => setDraft({ ...draft, folderId: event.target.value })}
              >
                <option value="">Unsorted</option>
                {folders
                  .filter((folder) => folder.id !== UNSORTED_ID)
                  .map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          <p className="text-[10px] leading-relaxed text-zinc-600">
            Mux puts the poster at the midpoint by default, which on a screen recording is usually a
            half-open menu. Pick a still frame. The address stays {`/demos?v=${video.slug}`} whatever
            you rename it to, so shared links keep working.
          </p>

          <Row>
            <button
              type="button"
              className="btn-primary cursor-pointer"
              disabled={working}
              onClick={() =>
                void run(async () => {
                  const result = await updateVideo(video.id, {
                    title: draft.title,
                    description: draft.description,
                    thumbnailTime: Number(draft.thumbnailTime) || 0,
                    folderId: draft.folderId || null,
                  });
                  if (result.ok) setEditing(false);
                  return result;
                })
              }
            >
              Save
            </button>
            <button type="button" className="btn-ghost cursor-pointer" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </Row>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  The screen                                                         */
/* ------------------------------------------------------------------ */

export default function DemosClient({
  folders,
  mayWrite,
  uploadsReady,
}: {
  folders: DemoFolder[];
  mayWrite: boolean;
  uploadsReady: boolean;
}) {
  const router = useRouter();
  const [, startRefresh] = useTransition();
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [newFolder, setNewFolder] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState({ name: "", description: "" });

  const refresh = useCallback(() => startRefresh(() => router.refresh()), [router]);

  /**
   * While anything is still moving at Mux, ask about it every five
   * seconds. Polling rather than a webhook because this only runs with
   * somebody sitting on the page watching an upload — the one case where
   * polling is the honest tool. The interval clears itself the moment
   * nothing is in flight, so an idle console makes no requests.
   */
  const inFlight = folders
    .flatMap((folder) => folder.videos)
    .filter((video) => ["pending", "uploading", "processing"].includes(video.status));
  const inFlightKey = inFlight.map((video) => video.id).join(",");

  useEffect(() => {
    if (!inFlightKey) return;
    const ids = inFlightKey.split(",");

    const timer = setInterval(async () => {
      await Promise.all(ids.map((id) => syncVideo(id)));
      refresh();
    }, 5000);

    return () => clearInterval(timer);
  }, [inFlightKey, refresh]);

  const run = async (action: () => Promise<{ ok: boolean; error?: string }>, key: string) => {
    setBusy(key);
    setError(null);
    const result = await action();
    if (!result.ok) setError(result.error ?? "That did not work.");
    setBusy(null);
    refresh();
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-[11px] leading-relaxed text-zinc-300">
          {error}
        </div>
      )}

      {mayWrite && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            className="admin-input sm:max-w-xs"
            placeholder="New folder name"
            value={newFolder}
            onChange={(event) => setNewFolder(event.target.value)}
          />
          <button
            type="button"
            className="btn-glass shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!newFolder.trim() || busy === "new-folder"}
            onClick={() =>
              void run(async () => {
                const result = await createFolder(newFolder);
                if (result.ok) setNewFolder("");
                return result;
              }, "new-folder")
            }
          >
            <FolderPlus className="h-3.5 w-3.5" />
            Add folder
          </button>
        </div>
      )}

      {folders.length === 0 ? (
        <EmptyPanel title="No demos yet">
          Make a folder, then upload a recording into it. The file goes straight to Mux; nothing is
          stored here.
        </EmptyPanel>
      ) : (
        folders.map((folder) => {
          const unsorted = folder.id === UNSORTED_ID;

          return (
            <section key={folder.id} className="rounded-2xl border border-white/8 bg-white/[0.01] p-3.5">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-semibold text-white">{folder.name}</h3>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-zinc-500">
                    {folder.description ??
                      `${folder.videos.length} ${folder.videos.length === 1 ? "demo" : "demos"}`}
                  </p>
                </div>

                {mayWrite && !unsorted && (
                  <Row>
                    <IconButton
                      title="Move folder up"
                      onClick={() => void run(() => moveFolder(folder.id, "up"), folder.id)}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </IconButton>
                    <IconButton
                      title="Move folder down"
                      onClick={() => void run(() => moveFolder(folder.id, "down"), folder.id)}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </IconButton>
                    <IconButton
                      title="Rename folder"
                      onClick={() => {
                        setRenaming(renaming === folder.id ? null : folder.id);
                        setRenameDraft({ name: folder.name, description: folder.description ?? "" });
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </IconButton>
                    <IconButton
                      title="Delete folder"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete the folder "${folder.name}"? The ${folder.videos.length} video(s) in it are kept and become unsorted.`,
                          )
                        ) {
                          void run(() => deleteFolder(folder.id), folder.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconButton>
                  </Row>
                )}
              </div>

              {renaming === folder.id && mayWrite && (
                <div className="mt-3 space-y-2 rounded-xl border border-white/5 bg-white/[0.015] p-3">
                  <input
                    className="admin-input"
                    value={renameDraft.name}
                    onChange={(event) => setRenameDraft({ ...renameDraft, name: event.target.value })}
                    placeholder="Folder name"
                  />
                  <input
                    className="admin-input"
                    value={renameDraft.description}
                    onChange={(event) =>
                      setRenameDraft({ ...renameDraft, description: event.target.value })
                    }
                    placeholder="Optional sentence under the heading"
                  />
                  <Row>
                    <button
                      type="button"
                      className="btn-primary cursor-pointer"
                      onClick={() =>
                        void run(async () => {
                          const result = await updateFolder(folder.id, renameDraft);
                          if (result.ok) setRenaming(null);
                          return result;
                        }, folder.id)
                      }
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn-ghost cursor-pointer"
                      onClick={() => setRenaming(null)}
                    >
                      Cancel
                    </button>
                  </Row>
                </div>
              )}

              <div className="mt-3 space-y-2">
                {folder.videos.map((video) => (
                  <VideoRow
                    key={video.id}
                    video={video}
                    folders={folders}
                    mayWrite={mayWrite}
                    busy={busy}
                    setBusy={setBusy}
                    onChanged={refresh}
                    onError={setError}
                  />
                ))}

                {folder.videos.length === 0 && (
                  <p className="px-1 py-2 text-[11px] text-zinc-600">
                    Nothing in here yet. A folder with no videos in it does not appear on the site.
                  </p>
                )}
              </div>

              {mayWrite && !unsorted && (
                <UploadBox folderId={folder.id} disabled={!uploadsReady} onDone={refresh} />
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
