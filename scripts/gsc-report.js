#!/usr/bin/env node
/**
 * gsc-report.js — pull Google Search Console data and snapshot it into Supabase.
 *
 * Why this is a script and not something the agent does with curl: the OAuth handshake is a
 * signed JWT, the API paginates, and the *interesting* number is never today's — it is the
 * delta against the last snapshot. Search Console only retains 16 months and gives no history
 * API, so if we do not persist each pull we can never answer "did that title rewrite work".
 * The snapshot IS the product here; the printout is a convenience.
 *
 * Zero dependencies. Node 20+ (global fetch, node:crypto for RS256).
 *
 * Environment:
 *   GSC_SERVICE_ACCOUNT_JSON  Full service-account key JSON (the file contents, as one string).
 *   GSC_SITE_URL              Property, exactly as Search Console spells it. For a
 *                             domain property use `sc-domain:abram.network`; for a URL-prefix
 *                             property use `https://abram.network/`.
 *   SUPABASE_URL              ABRAM-DOCS project URL.
 *   SUPABASE_SERVICE_ROLE_KEY Service role key (snapshot tables are service-role only).
 *
 * Usage:
 *   node scripts/gsc-report.js                 # fetch, snapshot, print JSON analysis
 *   node scripts/gsc-report.js --days 28       # window (default 28; GSC lags ~2 days)
 *   node scripts/gsc-report.js --no-write      # analyse without persisting (safe dry run)
 *   node scripts/gsc-report.js --human         # readable summary
 *
 * Exit codes: 0 ok · 1 hard failure · 78 not configured (no credentials — caller should skip,
 * not fail; this is how the workflow degrades gracefully before GSC is wired up).
 */

const crypto = require('node:crypto');

const EX_NOT_CONFIGURED = 78;

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
const has = (name) => args.includes(`--${name}`);

const DAYS = Number(flag('days', '28'));
const WRITE = !has('no-write');
const HUMAN = has('human');

const {
  GSC_SERVICE_ACCOUNT_JSON,
  GSC_SITE_URL,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env;

if (!GSC_SERVICE_ACCOUNT_JSON || !GSC_SITE_URL) {
  console.error('gsc-report: GSC_SERVICE_ACCOUNT_JSON and GSC_SITE_URL are not set — Search Console is not wired up yet.');
  process.exit(EX_NOT_CONFIGURED);
}

/* ------------------------------------------------------------------ auth */

/** Mint a Google access token from the service-account key (RS256 JWT bearer grant). */
async function getAccessToken(credentials) {
  const now = Math.floor(Date.now() / 1000);
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');

  const unsigned = [
    b64({ alg: 'RS256', typ: 'JWT' }),
    b64({
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }),
  ].join('.');

  const signature = crypto
    .createSign('RSA-SHA256')
    .update(unsigned)
    .sign(credentials.private_key, 'base64url');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  });

  if (!res.ok) {
    throw new Error(`Token exchange failed (${res.status}): ${await res.text()}`);
  }
  return (await res.json()).access_token;
}

/* ------------------------------------------------------------- gsc query */

const iso = (d) => d.toISOString().slice(0, 10);

/**
 * Search Console finalises data on a ~2 day lag. Ending the window "today" silently
 * mixes complete and incomplete days, which makes every week-over-week delta wrong.
 */
function windowFor(days, offsetWindows = 0) {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 2 - offsetWindows * days);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return { startDate: iso(start), endDate: iso(end) };
}

async function query(token, body) {
  const endpoint = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(GSC_SITE_URL)}/searchAnalytics/query`;
  const rows = [];
  let startRow = 0;

  // GSC caps a page at 25k rows; we page until short-read. rowLimit 5k keeps payloads sane.
  for (;;) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ rowLimit: 5000, startRow, ...body }),
    });
    if (!res.ok) throw new Error(`searchAnalytics.query failed (${res.status}): ${await res.text()}`);
    const page = (await res.json()).rows || [];
    rows.push(...page);
    if (page.length < 5000) break;
    startRow += page.length;
  }
  return rows;
}

/* --------------------------------------------------------------- storage */

async function supabase(pathname, init = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are required to read or write snapshots.');
  }
  const res = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${pathname}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Supabase ${init.method || 'GET'} ${pathname} failed (${res.status}): ${await res.text()}`);
  // `Prefer: return=minimal` answers 201 with an EMPTY body, not 204, so keying off 204 alone
  // sends an empty string to res.json() and throws "Unexpected end of JSON input" — after the
  // write has already succeeded. Read the body once and let its emptiness decide.
  const body = await res.text();
  return body ? JSON.parse(body) : null;
}

/* ---------------------------------------------------------------- main */

(async () => {
  const credentials = JSON.parse(GSC_SERVICE_ACCOUNT_JSON);
  const token = await getAccessToken(credentials);

  const current = windowFor(DAYS);
  const previous = windowFor(DAYS, 1);

  // Three cuts, because they answer three different questions: what people search for,
  // which of our pages answer them, and which query landed on which page.
  const [queriesNow, queriesPrev, pagesNow, pagesPrev, pairs] = await Promise.all([
    query(token, { ...current, dimensions: ['query'] }),
    query(token, { ...previous, dimensions: ['query'] }),
    query(token, { ...current, dimensions: ['page'] }),
    query(token, { ...previous, dimensions: ['page'] }),
    query(token, { ...current, dimensions: ['page', 'query'] }),
  ]);

  const index = (rows) => new Map(rows.map((r) => [r.keys.join('\0'), r]));
  const prevQ = index(queriesPrev);
  const prevP = index(pagesPrev);

  const shape = (r, prev) => {
    const before = prev.get(r.keys.join('\0'));
    return {
      key: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: Number((r.ctr * 100).toFixed(2)),
      position: Number(r.position.toFixed(1)),
      deltaClicks: before ? r.clicks - before.clicks : null,
      deltaImpressions: before ? r.impressions - before.impressions : null,
      // Position is golf: lower is better, so a NEGATIVE delta is an improvement.
      deltaPosition: before ? Number((r.position - before.position).toFixed(1)) : null,
      isNew: !before,
    };
  };

  const queries = queriesNow.map((r) => shape(r, prevQ)).sort((a, b) => b.impressions - a.impressions);
  const pages = pagesNow.map((r) => shape(r, prevP)).sort((a, b) => b.impressions - a.impressions);

  /* ------------------------------------------------------- the analysis */

  const sum = (rows) => rows.reduce(
    (acc, r) => ({ clicks: acc.clicks + r.clicks, impressions: acc.impressions + r.impressions }),
    { clicks: 0, impressions: 0 }
  );

  // Headline totals come from the PAGE cut, not the query cut. Google withholds the query
  // string on rare searches to protect user privacy, and drops those rows from the query
  // dimension entirely rather than bucketing them — so summing queries under-counts a young
  // site, where nearly every search is rare. Measured 2026-08-03 over the same 28 days: the
  // query cut said 102 impressions / 0 clicks, the page cut said 346 / 11. Reporting "0
  // clicks" while the homepage takes 8 at position 9.2 is exactly the sort of wrong number
  // that gets repeated in a weekly report, so the headline reads the cut that sees them all.
  const totals = sum(pagesNow);
  const queryCut = sum(queriesNow);

  // Thresholds SCALE WITH THE SITE. Fixed floors (the usual "20 impressions minimum" advice)
  // are written for established sites and silently return nothing on a young one — which reads
  // as "no opportunities" when the truth is "your filter ate everything". At 102 impressions
  // across 44 queries the average query has 2.3, so a floor of 20 excludes 100% of the data.
  //
  //     102 impressions -> floor 3       1,000 -> floor 5       10,000+ -> floor 50
  //
  // Scaled off the QUERY cut, because the rows it filters are query rows — sizing a query
  // threshold with page-dimension volume would raise the bar using impressions that can
  // never appear in the list being filtered.
  const minImpr = Math.max(3, Math.min(50, Math.round(queryCut.impressions / 200)));
  const minImprCtr = Math.max(minImpr, 5); // CTR is noisier; needs slightly more evidence

  // Positions 8-20: we are already relevant enough to be shown, and a better title,
  // a real answer section, or three internal links is usually all that separates
  // page two from page one. This is the highest-yield list on the whole site.
  const strikingDistance = queries
    .filter((q) => q.position >= 8 && q.position <= 20 && q.impressions >= minImpr)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 25);

  // Ranking well but nobody clicks ⇒ the title/description is the problem, not the content.
  const poorCtr = queries
    .filter((q) => q.position <= 10 && q.impressions >= minImprCtr && q.ctr < 2)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15);

  // Losing ground. Worth a look before it compounds.
  const slipping = queries
    .filter((q) => q.deltaPosition !== null && q.deltaPosition >= 3 && q.impressions >= minImpr)
    .sort((a, b) => b.deltaPosition - a.deltaPosition)
    .slice(0, 15);

  const rising = queries
    .filter((q) => q.deltaPosition !== null && q.deltaPosition <= -3 && q.impressions >= minImpr)
    .sort((a, b) => a.deltaPosition - b.deltaPosition)
    .slice(0, 15);

  // A query with real impressions whose best landing page is only weakly about it is a
  // content gap: the site is being *shown* for something it never actually wrote about.
  const byQuery = new Map();
  for (const row of pairs) {
    const [page, q] = row.keys;
    if (!byQuery.has(q)) byQuery.set(q, []);
    byQuery.get(q).push({ page, impressions: row.impressions, position: row.position });
  }
  const contentGaps = queries
    .filter((q) => q.impressions >= minImpr && q.position > 20)
    .slice(0, 20)
    .map((q) => ({
      query: q.key,
      impressions: q.impressions,
      position: q.position,
      currentBestPage: (byQuery.get(q.key) || []).sort((a, b) => a.position - b.position)[0]?.page ?? null,
    }));

  const analysis = {
    site: GSC_SITE_URL,
    window: current,
    comparedTo: previous,
    totals: {
      ...totals,
      ctr: totals.impressions ? Number(((totals.clicks / totals.impressions) * 100).toFixed(2)) : 0,
      queries: queries.length,
      pages: pages.length,
      // The share of real traffic that carries no query string. Everything in the query-level
      // buckets below is blind to it, so a large gap here means "striking distance is empty"
      // should be read as "empty among the queries Google will name", not "empty".
      anonymizedImpressions: totals.impressions - queryCut.impressions,
      namedQueryImpressions: queryCut.impressions,
    },
    // Recorded so a reader can tell an empty bucket ("nothing qualified") apart from an
    // over-aggressive filter, and so a future run can explain why a query dropped out.
    thresholds: { minImpressions: minImpr, minImpressionsForCtr: minImprCtr },
    // ALWAYS populated, whatever the thresholds do. On a young site the single most useful
    // fact is simply *what we are being shown for at all* — every bucket below can be empty
    // while this one is the whole story.
    topQueries: queries.slice(0, 30),
    strikingDistance,
    poorCtr,
    slipping,
    rising,
    contentGaps,
    topPages: pages.slice(0, 25),
  };

  /* -------------------------------------------------------- persistence */

  if (WRITE) {
    const captured = { window_start: current.startDate, window_end: current.endDate };
    // Snapshots are append-only history; the unique index on (window_end, dimension, key)
    // makes a re-run idempotent rather than duplicating a window.
    const rows = [
      ...queries.slice(0, 500).map((q) => ({ ...captured, dimension: 'query', key: q.key, clicks: q.clicks, impressions: q.impressions, ctr: q.ctr, position: q.position })),
      ...pages.slice(0, 500).map((p) => ({ ...captured, dimension: 'page', key: p.key, clicks: p.clicks, impressions: p.impressions, ctr: p.ctr, position: p.position })),
    ];
    await supabase('seo_query_snapshots?on_conflict=window_end,dimension,key', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(rows),
    });
    analysis.snapshotRows = rows.length;
  }

  /* -------------------------------------------------------------- output */

  if (HUMAN) {
    const t = analysis.totals;
    console.log(`Search Console — ${current.startDate} to ${current.endDate} (vs ${previous.startDate}..${previous.endDate})`);
    console.log(`${t.clicks} clicks · ${t.impressions} impressions · ${t.ctr}% CTR · ${t.queries} queries · ${t.pages} pages`);
    console.log(`Thresholds this run: ${minImpr} impressions (${minImprCtr} for CTR), scaled to site volume\n`);
    const table = (label, rows, fmt) => {
      if (!rows.length) return;
      console.log(`--- ${label} (${rows.length}) ---`);
      rows.forEach((r) => console.log('  ' + fmt(r)));
      console.log('');
    };
    // Unconditional: on a young site this is the report, and the buckets below are decoration.
    table('What we are shown for', analysis.topQueries, (q) =>
      `pos ${String(q.position).padStart(5)} · ${String(q.impressions).padStart(4)} impr · ${q.clicks} clicks — ${q.key}`);
    table('Striking distance (pos 8-20)', strikingDistance, (q) => `pos ${q.position} · ${q.impressions} impr · ${q.clicks} clicks — ${q.key}`);
    table('Ranking but not clicked', poorCtr, (q) => `pos ${q.position} · ${q.ctr}% CTR · ${q.impressions} impr — ${q.key}`);
    table('Slipping', slipping, (q) => `${q.position} (was ${(q.position - q.deltaPosition).toFixed(1)}) — ${q.key}`);
    table('Rising', rising, (q) => `${q.position} (was ${(q.position - q.deltaPosition).toFixed(1)}) — ${q.key}`);
    table('Content gaps (shown, not ranking)', contentGaps, (g) => `pos ${g.position} · ${g.impressions} impr — "${g.query}" → ${g.currentBestPage || 'no page'}`);
  } else {
    console.log(JSON.stringify(analysis, null, 2));
  }
})().catch((err) => {
  console.error(`gsc-report: ${err.message}`);
  process.exit(1);
});
