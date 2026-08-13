#!/usr/bin/env node
/**
 * funnel-audit.js — the state of the marketing funnel, measured rather than assumed.
 *
 * The companion to seo-audit.js. That one answers "can the world find us"; this one
 * answers "what happens to somebody once it does". Same contract: everything here is
 * mechanical, KIPP reads the JSON, and judgment stays with the agent.
 *
 * The single most important check in this file is ENGAGEMENT. Opens and clicks are what
 * every other part of a funnel is built on — segments, scoring, re-engagement, knowing
 * whether a campaign worked. The webhook route already handles `email.opened` and
 * `email.clicked`; if none have ever arrived, the subscription in the Resend dashboard
 * is not sending them, and no amount of code fixes that. It is a config gap that looks
 * exactly like an empty list, which is why it needs a check that says so in words.
 *
 * Unlike seo-audit.js this one needs the database, so it exits 78 (skipped) without
 * credentials rather than failing — the same convention gsc-report.js uses.
 *
 * Zero dependencies. Node 20+.
 *
 * Usage:
 *   node scripts/funnel-audit.js               # JSON to stdout (what KIPP reads)
 *   node scripts/funnel-audit.js --human       # readable summary
 *   node scripts/funnel-audit.js --fail-on-error
 *
 * Severity contract:
 *   error   — the funnel is losing people or flying blind right now.
 *   warn    — measurably suboptimal, fix on the next pass through.
 *   info    — worth knowing, not worth a PR on its own.
 */

const HUMAN = process.argv.includes('--human');
const FAIL_ON_ERROR = process.argv.includes('--fail-on-error');

const URL_ENV = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY_ENV = process.env.SUPABASE_SERVICE_ROLE_KEY;

const issues = [];
function report(severity, check, message, detail) {
  issues.push({ severity, check, message, ...(detail ? { detail } : {}) });
}

/* ------------------------------------------------------------------ database */

/**
 * One PostgREST call. Deliberately raw fetch rather than the Supabase client, so this
 * script keeps the zero-dependency property that lets it run anywhere without npm i.
 */
async function query(path) {
  const response = await fetch(`${URL_ENV}/rest/v1/${path}`, {
    headers: {
      apikey: KEY_ENV,
      Authorization: `Bearer ${KEY_ENV}`,
      Prefer: 'count=exact',
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`${path} → ${response.status} ${await response.text()}`);
  }
  const range = response.headers.get('content-range');
  const total = range && range.includes('/') ? Number(range.split('/')[1]) : null;
  return { rows: await response.json(), total };
}

/** A count without pulling the rows back. */
async function count(table, filter = '') {
  const { total } = await query(`${table}?select=id&limit=1${filter ? `&${filter}` : ''}`);
  return total ?? 0;
}

/* ------------------------------------------------------------------ checks */

async function auditList() {
  const subscribers = await count('subscribers');
  const marketing = await count('subscribers', 'is_marketing_list=eq.true');
  const unsubscribed = await count('subscribers', 'status=eq.unsubscribed');
  const welcomed = await count('subscribers', 'welcome_email_sent_at=not.is.null');

  const pending = marketing - welcomed - unsubscribed;
  if (marketing > 0 && welcomed === 0) {
    report(
      'error',
      'welcome',
      `${marketing} people are on the marketing list and none has been sent a welcome.`,
      'Either the welcome email has not shipped yet, or every send is failing. Check the logs for "Welcome email:".',
    );
  } else if (pending > 0) {
    report(
      'warn',
      'welcome',
      `${pending} subscribers predate the welcome email and never got one.`,
      'A backfill is a judgment call: a welcome arriving months after signup reads as a mistake. Consider a one-off re-introduction campaign instead.',
    );
  }

  return { subscribers, marketing, unsubscribed, welcomed };
}

async function auditEngagement() {
  const { rows } = await query('campaign_logs?select=event_type&limit=1000');
  const kinds = new Set(rows.map((r) => r.event_type).filter(Boolean));

  const delivered = kinds.has('email.delivered') || kinds.has('email.sent');
  const opens = kinds.has('email.opened');
  const clicks = kinds.has('email.clicked');

  if (delivered && !opens && !clicks) {
    report(
      'error',
      'engagement',
      'Mail is being delivered but no open or click has ever been recorded.',
      'src/app/api/webhooks/resend/route.ts already handles email.opened and email.clicked, so this is not a code gap. ' +
        'In the Resend dashboard: enable open and click tracking on the sending domain, and add email.opened and email.clicked ' +
        'to the webhook subscription. Until then every segment, score and re-engagement trigger in the funnel is guessing.',
    );
  } else if (!delivered) {
    report('info', 'engagement', 'No delivery events recorded yet. Nothing has been sent, or the webhook is not wired.');
  } else if (!clicks) {
    report('warn', 'engagement', 'Opens are recorded but no clicks. Click tracking is probably off on the domain.');
  }

  return { eventKinds: [...kinds].sort(), opens, clicks };
}

async function auditAttribution() {
  /* Where a subscriber came from. Without this the funnel can count people but cannot
     say which page, post or campaign produced them, which is the one question that
     tells KIPP what to make more of. */
  const { rows } = await query('subscribers?select=*&limit=1');
  const columns = rows.length ? Object.keys(rows[0]) : [];

  const hasSource = columns.includes('source');
  const hasUtm = columns.some((c) => c.startsWith('utm_'));

  if (columns.length && !hasSource && !hasUtm) {
    report(
      'warn',
      'attribution',
      'A subscriber carries no record of where they came from.',
      'landing_visits already captures utm parameters, and the tracked link builder already sets them. They are dropped at the moment of conversion. ' +
        'Stamping source and utm_* onto the row at signup is what turns a subscriber count into a funnel.',
    );
  }

  const identified = await count('landing_visits', 'email_captured=eq.true');
  const visits = await count('landing_visits');
  if (visits > 0 && identified === 0) {
    report(
      'info',
      'attribution',
      `${visits} landing visits, none of which resolved to a person.`,
      'Anonymous traffic never connects to a known subscriber, so the path from first touch to signup cannot be reconstructed.',
    );
  }

  return { subscriberColumns: columns.length, hasSource, hasUtm, visits, identified };
}

async function auditCrm() {
  const contacts = await count('crm_contacts');
  const scans = await count('crm_scans');
  const linked = await count('crm_contacts', 'subscriber_id=not.is.null');

  if (scans > 0 && contacts === 0) {
    report(
      'info',
      'crm',
      `${scans} card scans and no contacts captured.`,
      'Expected before the first event. Worth revisiting after one — a scan-to-capture rate of zero at a conference is a broken form, not a quiet room.',
    );
  }

  return { contacts, scans, linkedToSubscribers: linked };
}

async function auditSequences() {
  /* There is no sequence engine yet. This check exists so the absence is reported as
     a known gap with a number attached rather than as silence. */
  report(
    'info',
    'sequences',
    'No lifecycle sequences exist. Every email is a one-shot broadcast or the welcome.',
    'See .agents/marketing-funnel.md for the intended shape. The welcome is step one of what becomes an onboarding sequence.',
  );
  const campaigns = await count('campaigns');
  const sent = await count('campaigns', 'status=eq.sent');
  return { campaigns, sent, sequences: 0 };
}

/* ------------------------------------------------------------------ output */

function human(summary) {
  const lines = [];
  const { list, engagement, attribution, crm, sequences } = summary;

  lines.push('');
  lines.push('  FUNNEL AUDIT');
  lines.push('  ' + '─'.repeat(58));
  lines.push('');
  lines.push(`  List          ${list.marketing} on the marketing list, ${list.welcomed} welcomed, ${list.unsubscribed} unsubscribed`);
  lines.push(`  Engagement    ${engagement.eventKinds.length ? engagement.eventKinds.join(', ') : 'nothing recorded'}`);
  lines.push(`  Campaigns     ${sequences.sent} sent, ${sequences.sequences} sequences`);
  lines.push(`  CRM           ${crm.contacts} contacts from ${crm.scans} scans, ${crm.linkedToSubscribers} on the list`);
  lines.push(`  Landing       ${attribution.visits} visits, ${attribution.identified} tied to a person`);
  lines.push('');

  const order = { error: 0, warn: 1, info: 2 };
  const sorted = [...issues].sort((a, b) => order[a.severity] - order[b.severity]);

  if (!sorted.length) {
    lines.push('  Nothing to report.');
  } else {
    for (const issue of sorted) {
      const label = issue.severity.toUpperCase().padEnd(5);
      lines.push(`  ${label} [${issue.check}] ${issue.message}`);
      if (issue.detail) {
        for (const part of wrap(issue.detail, 70)) lines.push(`        ${part}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

function wrap(text, width) {
  const words = String(text).split(/\s+/);
  const out = [];
  let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length > width) {
      if (line) out.push(line.trim());
      line = word;
    } else {
      line += ' ' + word;
    }
  }
  if (line.trim()) out.push(line.trim());
  return out;
}

/* ------------------------------------------------------------------ main */

async function main() {
  if (!URL_ENV || !KEY_ENV) {
    /* 78 is EX_CONFIG. The workflow treats it as a skip, not a failure — the same
       contract gsc-report.js uses for absent Search Console credentials. */
    console.error(
      'funnel-audit: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required. Skipping.',
    );
    process.exit(78);
  }

  const summary = {
    list: await auditList(),
    engagement: await auditEngagement(),
    attribution: await auditAttribution(),
    crm: await auditCrm(),
    sequences: await auditSequences(),
  };

  const errors = issues.filter((i) => i.severity === 'error').length;

  if (HUMAN) {
    console.log(human(summary));
  } else {
    console.log(JSON.stringify({ summary, issues }, null, 2));
  }

  if (FAIL_ON_ERROR && errors > 0) process.exit(1);
}

main().catch((err) => {
  console.error('funnel-audit failed:', err.message);
  process.exit(2);
});
