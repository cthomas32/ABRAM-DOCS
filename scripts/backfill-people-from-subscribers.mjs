#!/usr/bin/env node
/**
 * Makes people out of the mailing list and the app application list.
 *
 * `crm_contacts` was empty while `subscribers` held thirty real rows. The
 * conversion existed as a button in the console and had simply never been
 * pressed, so the CRM's own count of everybody it knows was zero.
 *
 * Reads by default and prints exactly what it would do. Nothing is
 * written until you pass --apply.
 *
 *   node scripts/backfill-people-from-subscribers.mjs             # dry run
 *   node scripts/backfill-people-from-subscribers.mjs --apply     # write
 *   node scripts/backfill-people-from-subscribers.mjs --resend    # refresh
 *          the list flags from Resend's segments first, then report
 *
 * WHY THIS IMPORTS TYPESCRIPT. The merge rule lives in
 * `src/lib/crm/contactSync.ts` and is the single answer to "when is this
 * the same human". A script that reimplemented it in JavaScript would be
 * a second answer, and the two would agree until the first time somebody
 * changed one. `tests/resolve-hook.mjs` already teaches Node how to read
 * the application's imports, so this borrows it and calls the real thing.
 *
 * WHAT IT WILL NEVER DO is subscribe anybody, unsubscribe anybody, or
 * touch Resend. --resend reads Resend and writes only the two local list
 * flags, because those mirror segments that Resend owns.
 */

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { register } from "node:module";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

register("../tests/resolve-hook.mjs", import.meta.url);

/* ------------------------------------------------------------------ */
/*  Environment                                                        */
/* ------------------------------------------------------------------ */

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 1) continue;
    const key = trimmed.slice(0, index).trim();
    if (process.env[key] !== undefined) continue;
    process.env[key] = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
  }
}

loadEnvLocal();

const APPLY = process.argv.includes("--apply");
const RESEND = process.argv.includes("--resend");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/* 78 is "skipped", the same code seo-audit and funnel-audit use, so a CI
   run without credentials is not a failure. */
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.log("No database credentials in the environment. Skipping.");
  process.exit(78);
}

const { createClient } = await import("@supabase/supabase-js");
const { syncFeedPerson, feedPersonFromSubscriber } = await import("../src/lib/crm/contactSync.ts");

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

/* ------------------------------------------------------------------ */
/*  Resend, when asked                                                 */
/* ------------------------------------------------------------------ */

/**
 * Realigns `is_marketing_list` and `is_application_list` with the two
 * Resend segments.
 *
 * Resend owns these two facts. Local had 29 rows flagged as application
 * against a segment holding 23, which is old state rather than new
 * information, and it matters because the flag decides whether somebody
 * lands as a lead or as a subscriber.
 *
 * Only the two flags are written. Names, job titles and status are left
 * alone: `admin/resend-actions.ts` owns the full mirror and this is a
 * correction, not a second copy of it.
 */
async function realignFromResend() {
  const apiKey = process.env.RESEND_MARKETING_API_KEY || process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("  no Resend key in the environment, skipping the realign");
    return null;
  }

  const segments = {
    marketing:
      process.env.RESEND_MARKETING_SEGMENT_ID || "8324468f-0399-4c05-9b98-3e17e76ffa41",
    application:
      process.env.RESEND_APPLICATION_SEGMENT_ID || "42a3da82-ad27-475f-b2ad-113c9c8fa6b8",
  };

  const membership = {};
  for (const [name, id] of Object.entries(segments)) {
    const res = await fetch(`https://api.resend.com/segments/${id}/contacts`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      console.log(`  Resend returned ${res.status} for the ${name} segment, skipping the realign`);
      return null;
    }
    const body = await res.json();
    const list = body.data ?? body.contacts ?? [];
    membership[name] = new Set(
      list.filter((c) => !c.unsubscribed).map((c) => String(c.email ?? "").trim().toLowerCase())
    );
    console.log(`  Resend ${name.padEnd(12)} ${membership[name].size} subscribed`);
  }

  const { data: locals, error } = await db
    .from("subscribers")
    .select("id, email, is_marketing_list, is_application_list");
  if (error) {
    console.log("  the subscriber list could not be read: " + error.message);
    return null;
  }

  const drift = [];
  for (const row of locals ?? []) {
    const email = String(row.email ?? "").trim().toLowerCase();
    const marketing = membership.marketing.has(email);
    const application = membership.application.has(email);
    if (Boolean(row.is_marketing_list) === marketing && Boolean(row.is_application_list) === application) {
      continue;
    }
    drift.push({ id: row.id, email, marketing, application, was: row });
  }

  console.log(`  ${drift.length} row(s) disagree with Resend`);
  for (const d of drift.slice(0, 40)) {
    console.log(
      `    ${redact(d.email).padEnd(30)} marketing ${flag(d.was.is_marketing_list)}->${flag(d.marketing)}` +
        `  application ${flag(d.was.is_application_list)}->${flag(d.application)}`
    );
  }

  if (!APPLY || !drift.length) return drift.length;

  for (const d of drift) {
    const { error: writeError } = await db
      .from("subscribers")
      .update({ is_marketing_list: d.marketing, is_application_list: d.application })
      .eq("id", d.id);
    if (writeError) console.log(`    could not update ${redact(d.email)}: ${writeError.message}`);
  }
  console.log(`  ${drift.length} row(s) realigned`);
  return drift.length;
}

const flag = (v) => (v ? "yes" : "no ");
const redact = (email) => String(email).replace(/^(.).*(@.*)$/, "$1***$2");

/* ------------------------------------------------------------------ */
/*  The backfill                                                       */
/* ------------------------------------------------------------------ */

async function main() {
  console.log(APPLY ? "APPLYING\n" : "DRY RUN. Pass --apply to write.\n");

  if (RESEND) {
    console.log("Realigning the list flags with Resend");
    await realignFromResend();
    console.log("");
  }

  /* The owner works anybody the backfill creates. Somebody has to: an
     unowned contact is invisible to a growth partner's own list, and the
     person running a backfill is asserting they will be worked. */
  const { data: owner } = await db
    .from("admin_users")
    .select("user_id, email")
    .eq("role", "owner")
    .eq("is_active", true)
    .order("created_at")
    .limit(1);

  const ownerUserId = owner?.[0]?.user_id ?? null;
  console.log(
    ownerUserId
      ? `Owner: ${owner[0].email}\n`
      : "No active owner found. Contacts will be created unowned.\n"
  );

  const { data: subscribers, error } = await db
    .from("subscribers")
    .select("id, email, first_name, last_name, job_title, is_marketing_list, is_application_list")
    .eq("status", "subscribed")
    .order("created_at", { ascending: true })
    .limit(2000);

  if (error) {
    console.error("The subscriber list could not be read: " + error.message);
    process.exit(1);
  }

  const rows = subscribers ?? [];
  console.log(`${rows.length} subscribed row(s) to consider\n`);

  const tally = { created: 0, linked: 0, unchanged: 0, refused: 0 };
  const plan = [];

  for (const row of rows) {
    const person = feedPersonFromSubscriber(row, ownerUserId);

    if (!APPLY) {
      /* Read-only: does this address already belong to somebody? The dry
         run stops at "exists" rather than guessing between linked and
         unchanged, because telling those two apart means recomputing the
         merge, and a dry run that reimplements the rule it is previewing
         is a dry run that can be wrong in the one way that matters. */
      const { data: hit } = await db
        .from("crm_contacts")
        .select("id")
        .eq("archived", false)
        .ilike("email", String(row.email).toLowerCase())
        .limit(1);

      const outcome = hit?.length ? "exists" : "created";
      tally[outcome] = (tally[outcome] ?? 0) + 1;
      plan.push({ email: row.email, person, outcome });
      continue;
    }

    /* Sequential on purpose. The merge rule matches on email, so two rows
       for one address arriving together would both find nothing and both
       create. */
    const result = await syncFeedPerson(db, person);
    tally[result.outcome] += 1;
    plan.push({ email: row.email, person, outcome: result.outcome, error: result.error });
  }

  const width = 30;
  console.log(
    "  " +
      "address".padEnd(width) +
      "source".padEnd(13) +
      "also".padEnd(13) +
      "lifecycle".padEnd(12) +
      "outcome"
  );
  for (const entry of plan) {
    console.log(
      "  " +
        redact(entry.email).padEnd(width) +
        String(entry.person.source).padEnd(13) +
        String((entry.person.alsoSources ?? []).join(",") || "-").padEnd(13) +
        String(entry.person.lifecycle).padEnd(12) +
        entry.outcome +
        (entry.error ? "  " + entry.error : "")
    );
  }

  console.log(
    APPLY
      ? `\nWrote: ${tally.created} created, ${tally.linked} linked, ` +
        `${tally.unchanged} unchanged, ${tally.refused} refused`
      : `\nWould create ${tally.created}. ${tally.exists ?? 0} already exist and would be ` +
        `left alone or have a source added.`
  );

  if (tally.refused) process.exitCode = 1;
}

await main();
