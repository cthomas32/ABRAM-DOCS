/*
 * Service worker for the conference contact cards at /c/<slug>.
 *
 * The point of this file is one thing: a person who scanned a code, lost
 * signal in a hall of four thousand phones, and then pulled the page down
 * to refresh should see the card again rather than the browser's offline
 * dinosaur. So the card and its vCard are served network first with the
 * last good copy kept as a fallback.
 *
 * Everything here is defensive. Any failure is swallowed, and a request
 * this worker does not understand is left entirely alone so the network
 * behaves exactly as it would with no worker installed.
 *
 * The real safety net for a submission is the outbox in
 * src/lib/crm/offlineQueue.ts, which retries on its own timer, on the
 * online event and on every page load. Background Sync is used here only
 * when the browser has it, because iOS Safari does not.
 */

const CACHE = "abram-crm-v1";
const SYNC_TAG = "abram-crm-flush";

const OFFLINE_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>No connection</title>
<style>
  html,body{margin:0;height:100%;background:#0a0a0a;color:#a1a1aa;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
  main{height:100%;display:flex;flex-direction:column;align-items:center;
    justify-content:center;gap:8px;padding:24px;text-align:center}
  h1{margin:0;font-size:16px;font-weight:600;color:#fafafa}
  p{margin:0;font-size:14px;line-height:1.6;max-width:22rem}
</style></head>
<body><main>
  <h1>No connection</h1>
  <p>This card needs a moment of signal. Anything you already sent is saved on this phone. Leave this page open and it goes out as soon as the network is back.</p>
</main></body></html>`;

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.put("/crm-offline", new Response(OFFLINE_HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      })))
      .catch(() => {}),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
      .catch(() => {}),
  );
});

/** The card, and the vCard behind "Save my contact". Nothing else. */
function isCardRequest(url) {
  return url.origin === self.location.origin && url.pathname.startsWith("/c/");
}

async function networkFirst(request, url) {
  const cache = await caches.open(CACHE).catch(() => null);

  try {
    const response = await fetch(request);
    if (cache && response && response.ok) {
      /* The ?k= code names which printed square was scanned and does not
         change the page, so one entry per card serves every copy of it. */
      cache.put(url.origin + url.pathname, response.clone()).catch(() => {});
    }
    return response;
  } catch (error) {
    if (cache) {
      const hit = await cache.match(url.origin + url.pathname);
      if (hit) return hit;
      if (request.mode === "navigate") {
        const offline = await cache.match("/crm-offline");
        if (offline) return offline;
      }
    }
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  /* Captures must always reach the network, or fail loudly enough for the
     outbox to keep hold of them. They are never touched here. */
  if (url.pathname.startsWith("/api/")) return;
  if (!isCardRequest(url)) return;

  event.respondWith(networkFirst(request, url));
});

/* ------------------------------------------------------------------ */
/*  Draining the outbox without a page                                 */
/*                                                                     */
/*  This worker reads the same IndexedDB store the page writes to and   */
/*  sends the captures itself. Nudging an open tab is not enough: the   */
/*  whole reason Background Sync exists is that the tab is gone.        */
/*                                                                     */
/*  Where this genuinely works, a person can close the card and their   */
/*  details still arrive. Where it does not, and iOS Safari is the big  */
/*  one because it has no Background Sync, the page has to stay open,   */
/*  which is why the card says so rather than promising otherwise.      */
/*                                                                     */
/*  Kept deliberately in step with src/lib/crm/offlineQueue.ts: same    */
/*  database, same store, same record shape, same rule about which      */
/*  failures are permanent.                                            */
/* ------------------------------------------------------------------ */

const DB_NAME = "abram-crm";
const DB_VERSION = 1;
const STORE = "outbox";
const CAPTURE_ENDPOINT = "/api/crm/capture";

function openOutbox() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function readAll(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

function remove(db, id) {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

async function drainOutbox() {
  let db;
  try {
    db = await openOutbox();
  } catch {
    return;
  }

  let entries = [];
  try {
    entries = await readAll(db);
  } catch {
    db.close();
    return;
  }

  for (const entry of entries) {
    if (!entry || !entry.payload) continue;
    try {
      const response = await fetch(CAPTURE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry.payload),
      });

      /* Sent, or refused in a way that will never succeed. Either way it
         stops taking up room. Anything else stays for the next attempt,
         because the client token makes a repeat send harmless. */
      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
        await remove(db, entry.id);
      }
    } catch {
      /* Still no network. Leave it exactly where it is. */
    }
  }

  db.close();

  /* Tell any open tab so its waiting count stops lying. */
  try {
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    clients.forEach((client) => client.postMessage({ type: "abram-crm-flush" }));
  } catch {
    /* No tab open is the normal case here. */
  }
}

self.addEventListener("sync", (event) => {
  if (!event || event.tag !== SYNC_TAG) return;
  event.waitUntil(drainOutbox());
});
