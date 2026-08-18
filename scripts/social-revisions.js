#!/usr/bin/env node
/**
 * social-revisions.js: read what Connor sent back, and rewrite it in place.
 *
 * The gap this closes. Pressing "Ask for a revision" in #kipp writes the note
 * onto the post and puts it back to `draft`. Until this script existed the only
 * tool KIPP had was social-draft.js, which can do exactly one thing: INSERT a
 * new card and a new booking. So a run that tried to answer a revision either
 * filed a brand-new card composed from scratch — a different picture, because
 * nothing ever read the old one — or filed nothing at all, because the day and
 * channel were already booked and the booking was skipped as a duplicate. Both
 * look identical from Slack: the wrong graphic, or no change.
 *
 * The fix is not another INSERT. A revision is an EDIT of a card that already
 * exists: same asset id, same booking, same day, with the spec merged rather
 * than replaced — so everything the note did not mention stays exactly as it
 * was. That is what --apply does, and it is the only way to answer a revision.
 *
 * Zero dependencies. Node 20+ (node: built-ins and global fetch only).
 *
 * Usage:
 *   node scripts/social-revisions.js --list             # JSON: the queue, with each card's spec
 *   node scripts/social-revisions.js --list --human     # the same, readable
 *   node scripts/social-revisions.js --apply f.json     # rewrite them
 *   node scripts/social-revisions.js --apply f.json --dry-run
 *
 * The shape --apply reads (an array, or one object):
 *
 *   [{
 *     "postId":  "<id from --list>",
 *     "caption": "the rewritten caption",          // optional
 *     "altText": "what the card shows",            // optional
 *     "note":    "why this post, on this day",     // optional
 *     "spec":    { "headline": "…", "backdrop": "dusk" },  // optional, MERGED
 *     "answered":"led with the mapping, dropped the product line"  // required
 *   }]
 *
 * `answered` is required and is printed in the run log. It is the record of what
 * was done about the note, and requiring it is what stops a run clearing a
 * revision request it did not act on.
 *
 * Environment:
 *   NEXT_PUBLIC_SUPABASE_URL    ABRAM-DOCS project URL
 *   SUPABASE_SERVICE_ROLE_KEY   ABRAM-DOCS service role key
 *
 * Exit codes:
 *   0  nothing waiting, or the rewrites landed (or a clean dry run)
 *   1  bad input, or the write failed
 *   78 not configured. A deliberate skip, the same contract gsc-report.js uses.
 */

const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const ROOT = join(__dirname, "..");

const BASE = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/** Everything the agent needs to judge a rewrite, including the card it is rewriting. */
const SELECT =
  "id,scheduled_for,channel,kind,caption,note,alt_text,link_url,status,source," +
  "revision_note,revision_requested_at,reviewed_by,asset_id,set_id," +
  "asset:social_image_assets(id,title,template,format,theme,spec,status,public_url)";

// ---------------------------------------------------------------------
// What the renderer accepts
//
// Read out of the same TypeScript the studio reads, so a template added
// today is accepted today. Only the closed lists are checked: a headline is
// prose and the renderer is the judge of the rest. Deliberately narrower
// than social-draft.js's validation, because a merge only has to be right
// about the fields it is actually changing.
// ---------------------------------------------------------------------

function idsFrom(relativePath, declaration) {
  let source;
  try {
    source = readFileSync(join(ROOT, relativePath), "utf8");
  } catch {
    return [];
  }
  const start = source.indexOf(declaration);
  if (start === -1) return [];
  const body = source.slice(start);
  const end = body.indexOf("\n};");
  const scope = end === -1 ? body : body.slice(0, end);
  const ids = [];
  const pattern = /^ {2}"?([a-z][a-zA-Z0-9-]*)"?: \{/gm;
  let match;
  while ((match = pattern.exec(scope)) !== null) ids.push(match[1]);
  return ids;
}

const ENUMS = {
  template: () => idsFrom("src/lib/social/spec.ts", "export const SOCIAL_TEMPLATES"),
  mockup: () => idsFrom("src/lib/social/spec.ts", "export const MOCKUPS"),
  theme: () => idsFrom("src/lib/social/themes.ts", "export const SOCIAL_THEMES"),
  format: () => idsFrom("src/lib/social/formats.ts", "export const SOCIAL_FORMATS"),
  backdrop: () => idsFrom("src/lib/social/backdrops.ts", "export const SOCIAL_BACKDROPS"),
  placement: () => idsFrom("src/lib/social/placement.ts", "export const PLACEMENTS"),
};

/**
 * Never rewritten by an agent.
 *
 * `backdropCredit` is carried onto the card from the image library on its own —
 * an agent has no way of knowing who took a photograph, and letting it compose
 * an attribution is letting it invent one. The slide counters describe a
 * carousel's shape, which a caption note is never asking to change.
 */
const FROZEN_SPEC_KEYS = new Set(["backdropCredit", "slideIndex", "slideCount"]);

// ---------------------------------------------------------------------

function headers() {
  return { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
}

async function getJson(path) {
  const response = await fetch(`${BASE}/rest/v1/${path}`, { headers: headers() });
  if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`);
  return response.json();
}

async function patch(path, body) {
  const response = await fetch(`${BASE}/rest/v1/${path}`, {
    method: "PATCH",
    headers: { ...headers(), Prefer: "return=minimal" },
    body: JSON.stringify(body),
  });
  // PostgREST answers `return=minimal` with 204 or an empty 200/201 body.
  if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`);
}

/** One row per embedded asset, narrowed out of PostgREST's array-of-one. */
function narrow(row) {
  const asset = Array.isArray(row.asset) ? row.asset[0] : row.asset;
  return { ...row, asset: asset || null };
}

/** The queue: sent back, not yet answered, oldest day first. */
async function pending() {
  const rows = await getJson(
    `social_posts?select=${encodeURIComponent(SELECT)}` +
      "&revision_requested_at=not.is.null&status=eq.draft&order=scheduled_for.asc"
  );
  return rows.map(narrow);
}

function todayISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.SOCIAL_DAILY_TZ || "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function printHuman(rows) {
  if (rows.length === 0) {
    console.log("Nothing was sent back.");
    return;
  }
  const today = todayISO();
  console.log(`${rows.length} waiting to be rewritten:\n`);
  for (const row of rows) {
    const stale = row.scheduled_for < today ? "  ** the day has passed — give it a new one **" : "";
    console.log(`${row.id}`);
    console.log(`  ${row.scheduled_for} ${row.channel} (${row.kind || "product"})${stale}`);
    console.log(`  he said: “${row.revision_note || ""}”`);
    console.log(`  caption: ${row.caption || "(none)"}`);
    if (row.asset) {
      console.log(`  card:    ${row.asset.title || row.asset.id} · ${row.asset.template} · ${row.asset.theme}`);
      console.log(`  spec:    ${JSON.stringify(row.asset.spec)}`);
    } else {
      console.log("  card:    (words only)");
    }
    console.log("");
  }
}

// ---------------------------------------------------------------------
// Applying
// ---------------------------------------------------------------------

function fail(message) {
  console.error(`[social-revisions] ${message}`);
  return 1;
}

/**
 * The merged spec, or a message saying why it cannot be merged.
 *
 * A shallow merge is the whole point: the note names one thing, and every
 * field it did not name has to survive untouched. Replacing the spec is how a
 * revision turns into a different picture.
 */
function mergeSpec(existing, patchSpec) {
  const base = existing && typeof existing === "object" ? existing : {};
  const merged = { ...base };

  for (const [key, value] of Object.entries(patchSpec)) {
    if (FROZEN_SPEC_KEYS.has(key)) {
      return { error: `spec.${key} is not yours to write.` };
    }
    const readList = ENUMS[key];
    if (readList && value !== null && value !== "") {
      const allowed = readList();
      if (allowed.length > 0 && !allowed.includes(value)) {
        return { error: `spec.${key} "${value}" is not one of: ${allowed.join(", ")}` };
      }
    }
    if (value === null) delete merged[key];
    else merged[key] = value;
  }

  return { spec: merged };
}

async function apply(revisions, dryRun) {
  const queue = await pending();
  const byId = new Map(queue.map((row) => [row.id, row]));
  let applied = 0;

  for (const revision of revisions) {
    const post = byId.get(revision.postId);
    if (!post) {
      return fail(`${revision.postId} is not waiting for a rewrite. Run --list first.`);
    }
    if (!revision.answered || !String(revision.answered).trim()) {
      return fail(`${revision.postId}: "answered" is required — say what you changed about the note.`);
    }

    const touchesWords =
      revision.caption !== undefined || revision.altText !== undefined || revision.note !== undefined;
    const touchesCard = revision.spec && Object.keys(revision.spec).length > 0;

    if (!touchesWords && !touchesCard) {
      // The one rule this script exists to enforce. Clearing the stamp without
      // changing anything is how a specific piece of feedback becomes a post
      // that quietly did not change, which is what stops feedback being worth
      // giving at all.
      return fail(`${revision.postId}: nothing was changed. Never clear a revision you did not act on.`);
    }
    if (touchesCard && !post.asset) {
      return fail(`${revision.postId} has no card to rewrite.`);
    }

    let mergedSpec = null;
    if (touchesCard) {
      const result = mergeSpec(post.asset.spec, revision.spec);
      if (result.error) return fail(`${revision.postId}: ${result.error}`);
      mergedSpec = result.spec;
    }

    const postPatch = {
      // Back into the queue the daily message reads, with the note left where
      // it is so the next message can show what was being answered.
      revision_requested_at: null,
      review_notified_at: null,
    };
    if (revision.caption !== undefined) postPatch.caption = revision.caption;
    if (revision.altText !== undefined) postPatch.alt_text = revision.altText;
    if (revision.note !== undefined) postPatch.note = revision.note;
    if (revision.scheduledFor !== undefined) postPatch.scheduled_for = revision.scheduledFor;

    if (dryRun) {
      console.log(`would rewrite ${post.id} (${post.scheduled_for} ${post.channel})`);
      if (mergedSpec) console.log(`  spec: ${JSON.stringify(mergedSpec)}`);
      console.log(`  post: ${JSON.stringify(postPatch)}`);
      applied += 1;
      continue;
    }

    if (mergedSpec) {
      // The card first. A post handed back to be approved with its old picture
      // still on it is the exact failure this script exists to end, so the
      // stamp is only cleared once the new spec is actually stored.
      //
      // Back to `draft` as well: an approved asset is one whose published PNG
      // matches its spec, and after this edit it does not. Approving the post
      // re-renders to the same address and makes that true again.
      await patch(`social_image_assets?id=eq.${post.asset.id}`, {
        spec: mergedSpec,
        status: "draft",
      });
    }

    await patch(`social_posts?id=eq.${post.id}`, postPatch);
    // `answered` is not stored — there is no column for it and inventing one
    // for a sentence nobody queries is not worth a migration. It is printed so
    // it lands in the run log and can be carried onto the CALENDAR line.
    console.log(`rewrote ${post.id} — ${post.scheduled_for} ${post.channel}: ${revision.answered}`);
    applied += 1;
  }

  const left = queue.length - applied;
  console.log(
    `${dryRun ? "Would rewrite" : "Rewrote"} ${applied} of ${queue.length}.` +
      (left > 0 ? ` ${left} still waiting.` : "")
  );
  return 0;
}

// ---------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);

  if (!BASE || !KEY) {
    console.error("[social-revisions] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. Skipping.");
    return 78;
  }

  const applyIndex = args.indexOf("--apply");
  if (applyIndex !== -1) {
    const path = args[applyIndex + 1];
    if (!path || path.startsWith("--")) return fail("--apply takes a path to a JSON file.");
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(path, "utf8"));
    } catch (err) {
      return fail(`${path} is not readable JSON: ${err.message}`);
    }
    const revisions = Array.isArray(parsed) ? parsed : [parsed];
    if (revisions.length === 0) return fail("nothing to apply.");
    return apply(revisions, args.includes("--dry-run"));
  }

  const rows = await pending();
  if (args.includes("--human")) printHuman(rows);
  else console.log(JSON.stringify(rows, null, 2));
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(`[social-revisions] ${err.message}`);
    process.exit(1);
  });
