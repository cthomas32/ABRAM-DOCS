#!/usr/bin/env node
/**
 * Links contacts and newsletter subscribers that already share an address.
 *
 * A one off, written to be run more than once. It reads by default and prints
 * exactly what it would do. Nothing is written until you pass --apply.
 *
 * What it will never do is subscribe anybody. A contact with no matching
 * subscriber row stays exactly as it is, whatever their consent flag says,
 * because consent is recorded at capture and acted on there. This script only
 * draws a line between two records that both already exist.
 *
 *   node scripts/backfill-crm-subscriber-links.js            # dry run
 *   node scripts/backfill-crm-subscriber-links.js --apply    # write the links
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const PAGE = 500;
const CHUNK = 200;

/* ------------------------------------------------------------------ */
/*  Environment                                                        */
/* ------------------------------------------------------------------ */

function loadEnvLocal(projectDir) {
  const envPath = path.join(projectDir, '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const index = trimmed.indexOf('=');
    if (index === -1) return;
    const key = trimmed.substring(0, index).trim();
    const val = trimmed.substring(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = val;
  });
}

/* ------------------------------------------------------------------ */
/*  Reads                                                              */
/* ------------------------------------------------------------------ */

function normalize(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : null;
}

/** Every live contact carrying an address and no subscriber yet. */
async function readCandidates(supabase) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('crm_contacts')
      .select('id, profile_id, full_name, email, consent_marketing, subscriber_id, met_at')
      .eq('archived', false)
      .is('subscriber_id', null)
      .not('email', 'is', null)
      .order('met_at', { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) throw new Error(`Could not read contacts: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  return rows;
}

/** The subscribers matching those addresses, looked up in batches. */
async function readSubscribers(supabase, emails) {
  const found = new Map();

  for (let i = 0; i < emails.length; i += CHUNK) {
    const chunk = emails.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from('subscribers')
      .select('id, email, status, is_marketing_list, created_at')
      .in('email', chunk);

    if (error) throw new Error(`Could not read subscribers: ${error.message}`);
    for (const row of data || []) {
      const key = normalize(row.email);
      if (key) found.set(key, row);
    }
  }

  return found;
}

/* ------------------------------------------------------------------ */
/*  Writes                                                             */
/* ------------------------------------------------------------------ */

async function linkOne(supabase, pair) {
  /* Conditional on the column still being null, so a run that overlaps with
     a live capture cannot write the link or the timeline entry twice. */
  const { data, error } = await supabase
    .from('crm_contacts')
    .update({ subscriber_id: pair.subscriber.id })
    .eq('id', pair.contact.id)
    .is('subscriber_id', null)
    .select('id');

  if (error) return { ok: false, reason: error.message };
  if (!data || data.length === 0) return { ok: false, reason: 'already linked by another run' };

  const { error: noteError } = await supabase.from('crm_interactions').insert({
    contact_id: pair.contact.id,
    kind: 'note',
    body: 'Matched to an existing ABRAM newsletter subscriber with the same address.',
    meta: {
      event: 'newsletter_subscribed',
      direction: 'backfill',
      subscriber_id: pair.subscriber.id,
      email: pair.email,
    },
    occurred_at: new Date().toISOString(),
  });

  if (noteError) {
    console.warn(`  Linked, but the timeline entry failed: ${noteError.message}`);
  }

  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Run                                                                */
/* ------------------------------------------------------------------ */

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(
      [
        'Links CRM contacts to newsletter subscribers that share an address.',
        '',
        '  node scripts/backfill-crm-subscriber-links.js          Dry run, prints the plan.',
        '  node scripts/backfill-crm-subscriber-links.js --apply  Writes the links.',
        '',
        'It never subscribes anybody. Only records that already exist on both',
        'sides are linked.',
      ].join('\n'),
    );
    return;
  }

  const apply = args.includes('--apply');
  const projectDir = path.resolve(__dirname, '..');
  loadEnvLocal(projectDir);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(apply ? 'Mode: apply, writes are live.' : 'Mode: dry run, nothing will be written.');
  console.log('');

  const contacts = await readCandidates(supabase);
  console.log(`Unlinked contacts with an address: ${contacts.length}`);

  if (contacts.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  const emails = [...new Set(contacts.map((row) => normalize(row.email)).filter(Boolean))];
  const subscribers = await readSubscribers(supabase, emails);
  console.log(`Subscribers matching those addresses: ${subscribers.size}`);
  console.log('');

  const pairs = [];
  const unmatched = [];

  for (const contact of contacts) {
    const email = normalize(contact.email);
    if (!email) continue;
    const subscriber = subscribers.get(email);
    if (subscriber) pairs.push({ contact, subscriber, email });
    else unmatched.push({ contact, email });
  }

  if (pairs.length === 0) {
    console.log('No contact matches a subscriber. Nothing to link.');
  } else {
    console.log(`Would link ${pairs.length} contact${pairs.length === 1 ? '' : 's'}:`);
    for (const pair of pairs) {
      const state = pair.subscriber.status === 'subscribed' ? 'on the list' : pair.subscriber.status;
      console.log(`  ${pair.email.padEnd(36)} ${String(pair.contact.full_name || '').padEnd(24)} ${state}`);
    }
  }

  /* Reported, never acted on. Somebody who ticked the box and still has no
     subscriber row is worth knowing about, but subscribing them here would
     be a mailing list built by a script rather than by a person's choice. */
  const consentedWithoutSubscriber = unmatched.filter((row) => row.contact.consent_marketing === true);
  if (consentedWithoutSubscriber.length > 0) {
    console.log('');
    console.log(
      `Heads up: ${consentedWithoutSubscriber.length} contact${consentedWithoutSubscriber.length === 1 ? '' : 's'} ticked the box but ${consentedWithoutSubscriber.length === 1 ? 'has' : 'have'} no subscriber row.`,
    );
    console.log('This script will not subscribe them. Check the capture logs for a failed list write.');
    for (const row of consentedWithoutSubscriber) {
      console.log(`  ${row.email}`);
    }
  }

  if (!apply) {
    console.log('');
    console.log('Dry run finished. Re-run with --apply to write the links above.');
    return;
  }

  if (pairs.length === 0) return;

  console.log('');
  let linked = 0;
  let skipped = 0;

  for (const pair of pairs) {
    const result = await linkOne(supabase, pair);
    if (result.ok) {
      linked += 1;
    } else {
      skipped += 1;
      console.warn(`  Skipped ${pair.email}: ${result.reason}`);
    }
  }

  console.log('');
  console.log(`Linked ${linked}. Skipped ${skipped}. Nobody was subscribed.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
