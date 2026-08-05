/**
 * A durable outbox for contact captures.
 *
 * Conference wifi is the worst network most software ever meets: a hall
 * with four thousand phones on one access point, a hotspot that resolves
 * DNS but times out on POST, a lift that drops the connection halfway
 * through a request. Losing somebody's details because of that is not
 * acceptable, so nothing here depends on the network succeeding at the
 * moment of capture.
 *
 * A submission is written to IndexedDB first and only then sent. If the
 * send fails it stays in the queue and is retried when the browser comes
 * back online, when the tab is looked at again, and on the next page load.
 * Every entry carries a client token, so a retry that actually did reach
 * the server the first time updates the same row instead of creating a
 * second one.
 *
 * Used by both the public card form and the admin capture screen.
 */

import type { CapturePayload } from "./types";

const DB_NAME = "abram-crm";
const DB_VERSION = 1;
const STORE = "outbox";
/** Used when IndexedDB is unavailable, for example in a private window. */
const FALLBACK_KEY = "abram-crm-outbox";

export interface QueuedCapture {
  id: string;
  payload: CapturePayload;
  queued_at: string;
  attempts: number;
  last_error: string | null;
}

/* ------------------------------------------------------------------ */
/*  Storage                                                            */
/* ------------------------------------------------------------------ */

function hasIndexedDb(): boolean {
  try {
    return typeof indexedDB !== "undefined";
  } catch {
    return false;
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function readFallback(): QueuedCapture[] {
  try {
    const raw = localStorage.getItem(FALLBACK_KEY);
    return raw ? (JSON.parse(raw) as QueuedCapture[]) : [];
  } catch {
    return [];
  }
}

function writeFallback(items: QueuedCapture[]): void {
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(items));
  } catch {
    /* A full or blocked store is survivable. The in flight send still runs. */
  }
}

/* ------------------------------------------------------------------ */
/*  Queue operations                                                   */
/* ------------------------------------------------------------------ */

export function newClientToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `t-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export async function enqueue(payload: CapturePayload): Promise<QueuedCapture> {
  const entry: QueuedCapture = {
    id: payload.client_token,
    payload,
    queued_at: new Date().toISOString(),
    attempts: 0,
    last_error: null,
  };

  if (!hasIndexedDb()) {
    const items = readFallback().filter((i) => i.id !== entry.id);
    items.push(entry);
    writeFallback(items);
    notify();
    return entry;
  }

  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  notify();
  return entry;
}

export async function pending(): Promise<QueuedCapture[]> {
  if (!hasIndexedDb()) return readFallback();

  const db = await openDb();
  const items = await new Promise<QueuedCapture[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => resolve((request.result as QueuedCapture[]) ?? []);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return items;
}

export async function pendingCount(): Promise<number> {
  return (await pending()).length;
}

async function remove(id: string): Promise<void> {
  if (!hasIndexedDb()) {
    writeFallback(readFallback().filter((i) => i.id !== id));
    notify();
    return;
  }
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  notify();
}

async function recordFailure(entry: QueuedCapture, message: string): Promise<void> {
  const updated: QueuedCapture = {
    ...entry,
    attempts: entry.attempts + 1,
    last_error: message.slice(0, 300),
  };
  if (!hasIndexedDb()) {
    writeFallback(readFallback().map((i) => (i.id === entry.id ? updated : i)));
    notify();
    return;
  }
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(updated);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  notify();
}

/* ------------------------------------------------------------------ */
/*  Sending                                                            */
/* ------------------------------------------------------------------ */

export const CAPTURE_ENDPOINT = "/api/crm/capture";

export interface FlushResult {
  sent: number;
  failed: number;
  remaining: number;
}

/**
 * Tries to send everything waiting.
 *
 * A 4xx other than 429 means the payload itself is the problem and will
 * never succeed, so the entry is dropped rather than retried forever. Any
 * network error or 5xx leaves it in place for the next attempt.
 */
export async function flush(endpoint: string = CAPTURE_ENDPOINT): Promise<FlushResult> {
  const items = await pending();
  let sent = 0;
  let failed = 0;

  for (const entry of items) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry.payload),
        keepalive: true,
      });

      if (response.ok) {
        await remove(entry.id);
        sent += 1;
        continue;
      }

      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        await remove(entry.id);
        failed += 1;
        continue;
      }

      await recordFailure(entry, `HTTP ${response.status}`);
      failed += 1;
    } catch (error) {
      await recordFailure(entry, error instanceof Error ? error.message : "Network error");
      failed += 1;
    }
  }

  return { sent, failed, remaining: await pendingCount() };
}

/**
 * Queues a capture and immediately tries to send it.
 *
 * Returns whether it reached the server. A false here is not a failure the
 * person needs to fix: the entry is safely stored and will go out later.
 */
export async function submitCapture(
  payload: CapturePayload,
  endpoint: string = CAPTURE_ENDPOINT,
): Promise<{ delivered: boolean; queued: true }> {
  await enqueue(payload);
  const result = await flush(endpoint);
  return { delivered: result.sent > 0, queued: true };
}

/* ------------------------------------------------------------------ */
/*  Change notification, so a badge can show what is waiting            */
/* ------------------------------------------------------------------ */

type Listener = () => void;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* A broken listener must not stop the queue. */
    }
  });
}

export function onQueueChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Wires the retry triggers. Call once when a capture surface mounts and
 * call the returned function on unmount.
 */
export function startAutoFlush(endpoint: string = CAPTURE_ENDPOINT): () => void {
  if (typeof window === "undefined") return () => {};

  const attempt = () => {
    if (navigator.onLine === false) return;
    void flush(endpoint);
  };

  const onVisible = () => {
    if (document.visibilityState === "visible") attempt();
  };

  window.addEventListener("online", attempt);
  document.addEventListener("visibilitychange", onVisible);
  const timer = window.setInterval(attempt, 30_000);
  attempt();

  return () => {
    window.removeEventListener("online", attempt);
    document.removeEventListener("visibilitychange", onVisible);
    window.clearInterval(timer);
  };
}
