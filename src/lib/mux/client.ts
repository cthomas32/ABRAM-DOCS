/**
 * Talking to Mux.
 *
 * Server only. `MUX_TOKEN_SECRET` can delete every asset in the account,
 * so it must never reach a `NEXT_PUBLIC_` name, a client component, or a
 * response body. The one thing that does go to the browser is the direct
 * upload URL, which is single use, expires on a timeout, and can only be
 * written to.
 *
 * That direct upload is the whole reason this file exists rather than a
 * plain file input posting to a route handler. A serverless function caps
 * request bodies at a few megabytes and times out in minutes; a screen
 * recording is hundreds of megabytes. So the bytes never touch this
 * application: the console asks Mux for a URL, hands it to the browser,
 * and the browser PUTs straight to Mux.
 *
 * There is no `@mux/mux-node` dependency here on purpose. Four endpoints
 * and basic auth is less code than the wrapper's types, and it keeps the
 * SDK's own release cadence out of the build.
 */

const API = "https://api.mux.com/video/v1";

export type MuxUploadStatus = "waiting" | "asserted" | "errored" | "cancelled" | "timed_out";
export type MuxAssetStatus = "preparing" | "ready" | "errored";

export interface MuxDirectUpload {
  id: string;
  url: string;
  status: MuxUploadStatus;
  asset_id?: string;
  error?: { type?: string; message?: string };
}

export interface MuxAsset {
  id: string;
  status: MuxAssetStatus;
  duration?: number;
  playback_ids?: { id: string; policy: "public" | "signed" }[];
  errors?: { type?: string; messages?: string[] };
}

/** Thrown for every failure here, so callers have one thing to catch. */
export class MuxError extends Error {
  readonly status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = "MuxError";
    this.status = status;
  }
}

/**
 * Fails closed and says which name is missing.
 *
 * The alternative — sending an unauthenticated request and surfacing
 * Mux's 401 — reads to whoever is uploading as "Mux is down" when the
 * actual cause is an unset variable in the Vercel project.
 */
function authHeader(): string {
  const id = process.env.MUX_TOKEN_ID;
  const secret = process.env.MUX_TOKEN_SECRET;

  if (!id || !secret) {
    throw new MuxError(
      "Video uploads are not configured. MUX_TOKEN_ID and MUX_TOKEN_SECRET have to be set on this environment.",
    );
  }
  return `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`;
}

export function muxIsConfigured(): boolean {
  return Boolean(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET);
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch (cause) {
    throw new MuxError(`Could not reach Mux: ${(cause as Error).message}`);
  }

  if (response.status === 204) return undefined as T;

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    /* Mux returns { error: { messages: [...] } }. Prefer its sentence over
       the status code, because its sentences are good. */
    const messages = body?.error?.messages;
    const detail = Array.isArray(messages) && messages.length ? messages.join(" ") : null;
    throw new MuxError(detail ?? `Mux returned ${response.status}.`, response.status);
  }

  return body?.data as T;
}

/**
 * Ask for a URL the browser may PUT one file to.
 *
 * `cors_origin` must be the exact origin the PUT will come from — Mux
 * echoes it back as the CORS header, so a mismatch shows up in the
 * browser as a blocked request with no useful message. It differs between
 * localhost and production, so it is passed in rather than guessed.
 *
 * The policy is public because these are marketing walkthroughs whose job
 * is to be watchable without a login. Signing them would need a token
 * endpoint here, and would break the thumbnails too, which are signed
 * separately from the video.
 */
export function createDirectUpload(corsOrigin: string): Promise<MuxDirectUpload> {
  return call<MuxDirectUpload>("/uploads", {
    method: "POST",
    body: JSON.stringify({
      cors_origin: corsOrigin,
      /* An hour to start the PUT. The upload itself may run past this;
         the timeout is on the URL going unused, not on the transfer. */
      timeout: 3600,
      new_asset_settings: {
        playback_policies: ["public"],
        video_quality: "basic",
      },
    }),
  });
}

export function getUpload(uploadId: string): Promise<MuxDirectUpload> {
  return call<MuxDirectUpload>(`/uploads/${encodeURIComponent(uploadId)}`);
}

export function getAsset(assetId: string): Promise<MuxAsset> {
  return call<MuxAsset>(`/assets/${encodeURIComponent(assetId)}`);
}

/**
 * Deleting is permanent and immediate at Mux — there is no trash and no
 * undo, so every caller of this should already have asked a person.
 */
export async function deleteAsset(assetId: string): Promise<void> {
  await call<void>(`/assets/${encodeURIComponent(assetId)}`, { method: "DELETE" });
}

/** The public playback ID, or null if the asset only has signed ones. */
export function publicPlaybackId(asset: MuxAsset): string | null {
  return asset.playback_ids?.find((playback) => playback.policy === "public")?.id ?? null;
}
