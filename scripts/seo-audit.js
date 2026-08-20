#!/usr/bin/env node
/**
 * seo-audit.js — deterministic technical SEO audit of this repo.
 *
 * This exists so KIPP (the content-ops agent) does not spend Opus tokens re-deriving
 * facts a script can prove. Everything here is mechanical and repeatable: does the page
 * export metadata, is it in the sitemap, is the description the right length, does any
 * page link to it. Judgment — *what the copy should say* — is the agent's job, not this
 * file's.
 *
 * Zero dependencies. Node 20+ (uses only node: built-ins).
 *
 * Usage:
 *   node scripts/seo-audit.js              # JSON to stdout (what the agent reads)
 *   node scripts/seo-audit.js --human      # readable summary
 *   node scripts/seo-audit.js --fail-on-error   # exit 1 if any ERROR-level issue
 *
 * Severity contract:
 *   error   — actively costs us indexing or shows a wrong snippet. Fix in the next PR.
 *   warn    — measurably suboptimal. Fix when touching the page anyway.
 *   info    — worth knowing, not worth a PR on its own.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(ROOT, 'src', 'app');
const SITEMAP_FILE = path.join(APP_DIR, 'sitemap.ts');
const DOCS_JSON = path.join(ROOT, 'docs.json');
const USER_GUIDE = path.join(ROOT, 'user-guide');
const BASE_URL = 'https://abram.network';

// Routes that are deliberately not public surface area. Excluded from every check —
// an admin dashboard has no business being in a sitemap or carrying a canonical.
const PRIVATE_PREFIXES = ['/admin', '/api', '/auth'];

// Google truncates titles around 60 chars and descriptions around 160. Below ~70 chars
// a description usually leaves snippet space on the table; both are soft targets, so
// they are warnings rather than errors.
const TITLE_MAX = 60;
const DESC_MAX = 160;
const DESC_MIN = 70;

const issues = [];
function report(severity, check, target, message, detail) {
  issues.push({ severity, check, target, message, ...(detail ? { detail } : {}) });
}

/* ------------------------------------------------------------------ helpers */

function walk(dir, filter, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, filter, acc);
    else if (filter(full)) acc.push(full);
  }
  return acc;
}

const read = (f) => fs.readFileSync(f, 'utf8');
const isPrivate = (route) => PRIVATE_PREFIXES.some((p) => route === p || route.startsWith(p + '/'));

/**
 * src/app/agency/crew-roster/page.tsx -> /agency/crew-roster
 * Route groups `(marketing)` collapse away; dynamic segments are flagged, not resolved —
 * a [slug] route's real URLs come from the database and belong to the sitemap's dynamic half.
 */
function routeFromPageFile(file) {
  const rel = path.relative(APP_DIR, path.dirname(file));
  if (rel === '') return '/';
  const segments = rel.split(path.sep).filter((s) => !(s.startsWith('(') && s.endsWith(')')));
  return '/' + segments.join('/');
}

const isDynamicRoute = (route) => route.includes('[');

/**
 * A page whose whole job is `permanentRedirect('/somewhere-else')` is not public surface.
 * It must NOT carry metadata, must NOT be in the sitemap (Google treats a redirecting
 * sitemap URL as an error and it wastes crawl budget), and being unlinked is the point.
 * Auditing one as if it were a real page produces four confident, wrong findings.
 */
function redirectTargetOf(src) {
  const m = src.match(/\b(?:permanentRedirect|redirect)\(\s*(['"])(\/[^'"]*)\1/);
  return m ? m[2] : null;
}

/**
 * Metadata is often built by a helper — `export const metadata = campaignMetadata(v, SEO)`.
 * The structural facts (is there a canonical, is there an openGraph block) then live in the
 * helper, not the page, and a source-text check on the page alone reports them missing on
 * pages that genuinely have them. So: resolve the helper's module and read it too.
 *
 * Only the imported helper is followed, and only for structural booleans — title and
 * description strings are still read from the page, because those must stay page-specific.
 */
function helperSourceFor(file, src) {
  const call = src.match(/export\s+const\s+metadata[^=]*=\s*([A-Za-z_$][\w$]*)\s*\(/);
  if (!call) return '';
  const fn = call[1];

  const imp = src.match(new RegExp(`import\\s*\\{[^}]*\\b${fn}\\b[^}]*\\}\\s*from\\s*['"]([^'"]+)['"]`));
  if (!imp) return '';

  const spec = imp[1];
  const base = spec.startsWith('@/')
    ? path.join(ROOT, 'src', spec.slice(2))
    : spec.startsWith('.')
      ? path.resolve(path.dirname(file), spec)
      : null;
  if (!base) return ''; // a bare package specifier is not ours to resolve

  for (const cand of [`${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
    if (fs.existsSync(cand)) return read(cand);
  }
  return '';
}

/* --------------------------------------------------------- 1. route inventory */

const pageFiles = walk(APP_DIR, (f) => path.basename(f) === 'page.tsx');

const routes = pageFiles.map((file) => {
  const route = routeFromPageFile(file);
  const src = read(file);

  // Metadata may live in the page file or in a sibling layout.tsx (Next inherits it).
  const layoutFile = path.join(path.dirname(file), 'layout.tsx');
  const layoutSrc = fs.existsSync(layoutFile) ? read(layoutFile) : '';
  const combined = src + '\n' + layoutSrc;

  const hasStaticMetadata = /export\s+const\s+metadata\b/.test(combined);
  const hasGenerateMetadata = /export\s+(async\s+)?function\s+generateMetadata\b/.test(combined);

  // Structural checks may look through a metadata helper; string checks may not.
  const structural = combined + '\n' + helperSourceFor(file, combined);

  return {
    route,
    file: path.relative(ROOT, file),
    dynamic: isDynamicRoute(route),
    private: isPrivate(route),
    redirectsTo: redirectTargetOf(src),
    noindex: isNoindex(structural),
    hasStaticMetadata,
    hasGenerateMetadata,
    hasMetadata: hasStaticMetadata || hasGenerateMetadata,
    hasCanonical: /alternates\s*:\s*\{[^}]*canonical/s.test(structural),
    hasJsonLd: /application\/ld\+json/.test(structural),
    title: firstStringField(combined, 'title'),
    description: firstStringField(combined, 'description'),
    openGraph: /openGraph\s*:/.test(structural),
  };
});

/**
 * Whether the page tells search engines to stay away.
 *
 * A step inside a flow -- the OAuth consent screen, a checkout interstitial -- is a real
 * public route and not public surface. It has no business in the sitemap, nothing links to
 * it on purpose, and a canonical URL on a page that must never be indexed is noise. Next
 * spells this `robots: { index: false }`, and honouring it here is what stops every future
 * flow page arriving with four warnings that all mean "this is not an article".
 *
 * Deliberately narrow: only an explicit literal `index: false` inside a `robots` block
 * counts. A computed value is left to fire the ordinary checks, because a guess in the
 * permissive direction is the one that hides a genuinely missing canonical.
 */
function isNoindex(src) {
  const m = src.match(/robots\s*:\s*\{/);
  if (!m) return false;
  // Read the balanced block rather than trusting a lazy regex: `robots` nests `googleBot`.
  let depth = 0;
  let i = m.index + m[0].length - 1;
  const start = i;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) break;
  }
  return /\bindex\s*:\s*false\b/.test(src.slice(start, i + 1));
}

/**
 * Pull `title: '...'` / `description: "..."` out of a metadata literal. Template literals
 * and interpolated values are deliberately returned as null rather than half-parsed —
 * a wrong length measurement is worse than an absent one.
 */
function firstStringField(src, field) {
  const re = new RegExp(`\\b${field}\\s*:\\s*(['"])((?:\\\\.|(?!\\1).)*)\\1`, 's');
  const m = src.match(re);
  return m ? m[2].replace(/\\(['"])/g, '$1') : null;
}

// Redirect stubs are real routes but not public surface — see redirectTargetOf(). They are
// held separately so the sitemap check can still catch one being listed, which is a genuine
// problem, without every other check firing on a four-line file that is behaving correctly.
const auditableRoutes = routes.filter((r) => !r.private && !r.dynamic);
const publicRoutes = auditableRoutes.filter((r) => !r.redirectsTo && !r.noindex);
const redirectRoutes = auditableRoutes.filter((r) => r.redirectsTo);
// Held out for the same reason as a redirect stub: a real route that is not public surface.
const noindexRoutes = auditableRoutes.filter((r) => !r.redirectsTo && r.noindex);

for (const r of redirectRoutes) {
  report('info', 'redirect-route', r.route,
    `Permanent redirect to ${r.redirectsTo}; excluded from metadata, sitemap, JSON-LD and orphan checks.`,
    r.file);
}

for (const r of noindexRoutes) {
  report('info', 'noindex-route', r.route,
    'Marked robots noindex; excluded from metadata, sitemap, JSON-LD and orphan checks. Listing it in the sitemap is still reported, because a noindex page in a sitemap is a contradiction.',
    r.file);
}

/* ----------------------------------------------------- 2. metadata completeness */

for (const r of publicRoutes) {
  if (!r.hasMetadata) {
    report('error', 'metadata-missing', r.route,
      'Public page exports no metadata — Next falls back to the root title, so this page has no distinct title, description, or social card.',
      r.file);
    continue; // nothing further to measure
  }
  if (!r.hasCanonical) {
    report('warn', 'canonical-missing', r.route,
      'No alternates.canonical. AGENTS.md §2 requires one on every public route.', r.file);
  }
  if (r.title && r.title.length > TITLE_MAX) {
    report('warn', 'title-too-long', r.route,
      `Title is ${r.title.length} chars; Google truncates near ${TITLE_MAX}.`, r.title);
  }
  if (r.description) {
    if (r.description.length > DESC_MAX) {
      report('warn', 'description-too-long', r.route,
        `Description is ${r.description.length} chars; the snippet is cut near ${DESC_MAX}.`, r.description);
    } else if (r.description.length < DESC_MIN) {
      report('info', 'description-short', r.route,
        `Description is ${r.description.length} chars — under ${DESC_MIN} usually wastes snippet space.`, r.description);
    }
  } else if (r.hasStaticMetadata) {
    report('error', 'description-missing', r.route,
      'Metadata block has no description — Google will invent a snippet from body copy.', r.file);
  }
  if (!r.openGraph) {
    report('info', 'og-missing', r.route,
      'No openGraph block, so shares of this URL get no card.', r.file);
  }
}

/* ---------------------------------------- 3. duplicate titles and descriptions */

for (const field of ['title', 'description']) {
  const seen = new Map();
  for (const r of publicRoutes) {
    const v = r[field];
    if (!v) continue;
    if (!seen.has(v)) seen.set(v, []);
    seen.get(v).push(r.route);
  }
  for (const [value, hits] of seen) {
    if (hits.length > 1) {
      report('warn', `duplicate-${field}`, hits.join(', '),
        `${hits.length} public pages share the same ${field}. Search engines pick one and suppress the rest.`,
        value);
    }
  }
}

/* ------------------------------------------------------------ 4. sitemap drift */

const sitemapSrc = fs.existsSync(SITEMAP_FILE) ? read(SITEMAP_FILE) : '';
const sitemapRoutes = new Set();
if (sitemapSrc) {
  // `${baseUrl}/agency/crew-roster` — the hand-maintained staticPages half.
  for (const m of sitemapSrc.matchAll(/\$\{baseUrl\}(\/[a-zA-Z0-9\-_/]*)/g)) {
    sitemapRoutes.add(m[1].replace(/\/$/, '') || '/');
  }
  // `url: baseUrl` (the homepage entry)
  if (/url\s*:\s*baseUrl\s*,/.test(sitemapSrc)) sitemapRoutes.add('/');
}

if (!sitemapSrc) {
  report('error', 'sitemap-missing', 'src/app/sitemap.ts', 'No sitemap route found.');
} else {
  for (const r of publicRoutes) {
    if (!sitemapRoutes.has(r.route)) {
      report('error', 'sitemap-drift', r.route,
        'Public route is not registered in sitemap.ts staticPages. AGENTS.md §1 requires it, and the list is hand-maintained so it drifts every time a page is added.',
        r.file);
    }
  }
  // The reverse: a sitemap entry whose page no longer exists is a soft 404 to Google.
  const known = new Set(publicRoutes.map((r) => r.route));
  const redirecting = new Map(redirectRoutes.map((r) => [r.route, r.redirectsTo]));
  const dynamicPrefixes = ['/docs/', '/blog/', '/changelog/'];
  for (const s of sitemapRoutes) {
    if (known.has(s)) continue;
    if (redirecting.has(s)) {
      report('warn', 'sitemap-redirect', s,
        `Sitemap lists a URL that permanently redirects to ${redirecting.get(s)}. Google reports these as sitemap errors and they spend crawl budget for nothing — list the destination instead.`);
      continue;
    }
    if (dynamicPrefixes.some((p) => s.startsWith(p))) continue; // DB-driven, resolved at build
    report('error', 'sitemap-orphan', s,
      'Sitemap lists a URL with no matching page.tsx — crawlers will hit a 404 from our own sitemap.');
  }
}

/* -------------------------------------------------- 5. JSON-LD on money pages */

// Feature and comparison pages are the ones that earn rich results. Legal and utility
// pages are not worth the markup, so they are not asked for it.
const RICH_RESULT_PREFIXES = ['/film-production', '/agency', '/intelligence', '/alternatives', '/pricing'];
for (const r of publicRoutes) {
  if (!RICH_RESULT_PREFIXES.some((p) => r.route === p || r.route.startsWith(p + '/'))) continue;
  if (!r.hasJsonLd) {
    report('warn', 'jsonld-missing', r.route,
      'Feature/comparison page with no JSON-LD block, so it cannot earn a rich result. src/app/film-production/page.tsx is the reference implementation.',
      r.file);
  }
}

/* ---------------------------------------------- 6. user-guide frontmatter */

const guideFiles = walk(USER_GUIDE, (f) => /\.mdx?$/.test(f));
const docsJson = fs.existsSync(DOCS_JSON) ? read(DOCS_JSON) : '';

for (const file of guideFiles) {
  const rel = path.relative(ROOT, file);
  const src = read(file);
  const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) {
    report('error', 'frontmatter-missing', rel,
      'Article has no YAML frontmatter block. AGENTS.md §2 requires title, sidebarTitle, description and keywords.');
    continue;
  }
  const block = fm[1];
  for (const field of ['title', 'sidebarTitle', 'description']) {
    if (!new RegExp(`^${field}\\s*:`, 'm').test(block)) {
      report('error', 'frontmatter-field-missing', rel, `Frontmatter is missing \`${field}\`.`);
    }
  }
  if (!/^keywords\s*:/m.test(block)) {
    report('warn', 'frontmatter-keywords-missing', rel, 'Frontmatter has no `keywords` list.');
  }
  const desc = block.match(/^description\s*:\s*(.+)$/m);
  if (desc) {
    const value = desc[1].trim().replace(/^["']|["']$/g, '');
    if (value.length > DESC_MAX) {
      report('warn', 'frontmatter-description-long', rel,
        `Description is ${value.length} chars; the search snippet is cut near ${DESC_MAX}.`);
    }
  }
  // Registered in navigation? Unregistered articles are reachable only by direct URL.
  const slug = path.relative(ROOT, file).replace(/\.mdx?$/, '');
  if (docsJson && !docsJson.includes(slug)) {
    report('warn', 'nav-unregistered', rel,
      'Article is not referenced in docs.json, so it has no navigation entry and no internal links pointing at it.',
      slug);
  }
}

/* ------------------------------------------------------- 7. internal linking */

// An orphan page is one nothing links to. It can still be in the sitemap and still rank,
// but it accrues no internal authority and users never find it by browsing.
const linkSources = [
  ...walk(path.join(ROOT, 'src'), (f) => /\.(tsx|ts)$/.test(f)),
  ...guideFiles,
];
const inbound = new Map(publicRoutes.map((r) => [r.route, 0]));

// A list rendered from data links its children as href={`/alternatives/${alt.slug}`}, so the
// literal route never appears in the source. Collecting the static prefix of such a template
// lets one map over a set of pages count as a link to each of them — otherwise every
// data-driven hub reports all its children as orphans, which is the common case, not the edge.
const linkPrefixes = new Set();

for (const file of linkSources) {
  const src = read(file);
  const owner = path.basename(file) === 'page.tsx' ? routeFromPageFile(file) : null;
  for (const m of src.matchAll(/href=["'](\/[^"'#?]*)["']/g)) {
    const target = m[1].replace(/\/$/, '') || '/';
    if (target === owner) continue; // self-links do not count
    if (inbound.has(target)) inbound.set(target, inbound.get(target) + 1);
  }
  for (const m of src.matchAll(/\]\((\/[^)\s#?]*)\)/g)) { // markdown links
    const target = m[1].replace(/\/$/, '') || '/';
    if (inbound.has(target)) inbound.set(target, inbound.get(target) + 1);
  }
  for (const m of src.matchAll(/href=\{\s*`(\/[^`$]*)\$\{/g)) {
    if (m[1].endsWith('/')) linkPrefixes.add(m[1]);
  }
}

// Credit a prefix only to its direct children: `/alternatives/` covers /alternatives/celtx
// but not a deeper /alternatives/celtx/pricing, which would need its own link.
const coveredByPrefix = (route) =>
  [...linkPrefixes].some((p) => route.startsWith(p) && !route.slice(p.length).includes('/'));

for (const [route, count] of inbound) {
  if (route === '/') continue;
  if (count === 0 && !coveredByPrefix(route)) {
    report('warn', 'orphan-page', route,
      'No page or article links to this route. It gets no internal authority and cannot be reached by browsing.');
  }
}

/* --------------------------------------------------------------- 8. output */

const summary = {
  generatedFrom: 'scripts/seo-audit.js',
  baseUrl: BASE_URL,
  counts: {
    pageFiles: pageFiles.length,
    publicRoutes: publicRoutes.length,
    redirectRoutes: redirectRoutes.length,
    dynamicRoutes: routes.filter((r) => r.dynamic && !r.private).length,
    sitemapStaticEntries: sitemapRoutes.size,
    guideArticles: guideFiles.length,
    error: issues.filter((i) => i.severity === 'error').length,
    warn: issues.filter((i) => i.severity === 'warn').length,
    info: issues.filter((i) => i.severity === 'info').length,
  },
  issues,
};

const args = process.argv.slice(2);

if (args.includes('--human')) {
  const c = summary.counts;
  console.log(`SEO audit — ${c.publicRoutes} public routes, ${c.guideArticles} articles`);
  console.log(`${c.error} error · ${c.warn} warn · ${c.info} info\n`);
  for (const sev of ['error', 'warn', 'info']) {
    const group = issues.filter((i) => i.severity === sev);
    if (!group.length) continue;
    console.log(`--- ${sev.toUpperCase()} (${group.length}) ---`);
    for (const i of group) console.log(`  [${i.check}] ${i.target}\n      ${i.message}`);
    console.log('');
  }
} else {
  console.log(JSON.stringify(summary, null, 2));
}

if (args.includes('--fail-on-error') && summary.counts.error > 0) process.exit(1);
