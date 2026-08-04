#!/usr/bin/env node
/**
 * social-draft.js: file social image drafts, and schedule them.
 *
 * This is how KIPP proposes posts. It writes rows, nothing else. A row holds
 * the SPEC of a card, and the site renders a spec on demand, so a draft is
 * previewable the moment it lands without this script ever generating a
 * pixel, holding storage credentials, or spending a render budget.
 *
 * A proposal may also carry a `post` block, which books the card into the
 * calendar: a day, a channel, a caption and a tracked link. That row lands as
 * a draft too, so it is invisible to the morning Slack pack until a person
 * marks it ready. See .agents/social-calendar.md.
 *
 * Approval is a person's click in the admin, and only approval writes a PNG
 * and hands out a public address. Nothing filed here is published, and
 * nothing filed here posts.
 *
 * Zero dependencies. Node 20+ (uses only node: built-ins and global fetch).
 *
 * Usage:
 *   node scripts/social-draft.js --file proposals.json
 *   cat proposals.json | node scripts/social-draft.js --stdin
 *   node scripts/social-draft.js --options            # what the renderer accepts
 *   node scripts/social-draft.js --backdrops          # the image library, by title
 *   node scripts/social-draft.js --file x.json --dry-run
 *
 * Environment:
 *   NEXT_PUBLIC_SUPABASE_URL    ABRAM-DOCS project URL
 *   SUPABASE_SERVICE_ROLE_KEY   ABRAM-DOCS service role key
 *
 * Exit codes:
 *   0  drafts filed (or a clean dry run)
 *   1  bad input, or the write failed
 *   78 not configured. A deliberate skip, the same contract gsc-report.js uses.
 */

const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { randomUUID } = require("node:crypto");

const ROOT = join(__dirname, "..");

/**
 * Seven, because the morning pack goes out seven mornings a week and the weekly
 * run is the only thing that fills it. A cap of six was a cap that made one
 * silent morning unavoidable.
 *
 * It stays a cap. Nobody reads more than a week of cards in a review sitting and
 * a flooded queue gets ignored, which is why this did not become a larger number
 * when it became the right one.
 */
const MAX_PROPOSALS = 7;
const MAX_SLIDES = 10;
const MAX_ITEMS = 5;

/** Which piece of the identity sits at the top of a card. */
const BRAND_KINDS = ["lockup", "mark", "none"];

// ---------------------------------------------------------------------
// Scheduling
// ---------------------------------------------------------------------

/** How far ahead one run may book. A weekly agent has no business filling a month. */
const MAX_DAYS_AHEAD = 21;

/** The zone the calendar and the morning job both think in, so "tomorrow" means one thing. */
const CALENDAR_TZ = "America/New_York";

const SITE_ORIGIN = "https://abram.network";

function todayISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CALENDAR_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDaysISO(iso, days) {
  const [year, month, day] = iso.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day));
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

/**
 * The same line src/lib/social/spec.ts assembles, restated for the same
 * reason the tracked link is: this script has no build step and cannot
 * import the TypeScript. The handle is stored bare, so the @ goes on here.
 */
function creditLine(name, handle) {
  const who = (name || "").trim();
  const at = (handle || "").trim().replace(/^@+/, "");
  if (who && at) return `${who} @${at}`;
  if (at) return `@${at}`;
  return who;
}

/**
 * The same URL src/lib/social/links.ts builds, restated because this script
 * has no build step and cannot import the TypeScript. If the shape of a
 * tracked link ever changes, it changes in both places.
 */
function buildTrackedLink(path, source, medium, campaignSlug) {
  const params = new URLSearchParams({ utm_source: source, utm_medium: medium || "social" });
  if (campaignSlug) params.set("utm_campaign", campaignSlug);
  return `${SITE_ORIGIN}${path.startsWith("/") ? path : `/${path}`}?${params.toString()}`;
}

/**
 * Enough to validate a dry run with no database. A real run reads the live
 * rows instead, since both lists are editable without a deploy.
 */
const FALLBACK_CHANNELS = [
  { source: "tiktok", medium: "social" },
  { source: "reddit", medium: "social" },
  { source: "instagram", medium: "social" },
  { source: "youtube", medium: "social" },
  { source: "linkedin", medium: "social" },
  { source: "x", medium: "social" },
];

const FALLBACK_PAGES = [
  { slug: "start", path: "/start" },
  { slug: "start-filmmakers", path: "/start/filmmakers" },
  { slug: "start-agencies", path: "/start/agencies" },
  { slug: "start-post", path: "/start/post-production" },
  { slug: "start-resources", path: "/start/resource-management" },
  { slug: "start-assistant", path: "/start/ai-assistant" },
];

// ---------------------------------------------------------------------
// What the renderer accepts
//
// Read straight out of the TypeScript rather than duplicated here, so a new
// template or palette is available to the agent the moment it is available
// to the studio. If the shape of those files ever changes enough to break
// this, the script says so loudly rather than silently accepting anything.
// ---------------------------------------------------------------------

function idsFrom(relativePath, declaration) {
  const source = readFileSync(join(ROOT, relativePath), "utf8");
  const start = source.indexOf(declaration);
  if (start === -1) return [];
  const body = source.slice(start);
  const end = body.indexOf("\n};");
  const ids = [];
  // Quoted as well as bare, because a key with a hyphen in it has to be
  // quoted in TypeScript. Matching only bare identifiers meant this read
  // exactly one destination out of eight and one placement out of six, and
  // printed that short list to the agent as the whole truth.
  const pattern = /^ {2}"?([a-z][a-zA-Z0-9-]*)"?: \{/gm;
  let match;
  const scope = end === -1 ? body : body.slice(0, end);
  while ((match = pattern.exec(scope)) !== null) ids.push(match[1]);
  return ids;
}

/**
 * The same job as `idsFrom` for the other shape in `spec.ts`.
 *
 * A record (`{ statement: { … } }`) is what the template and placement
 * tables are; a list of `{ id, label }` is what the smaller pickers are,
 * and it closes on `];` rather than `};`. Read with the wrong one, a list
 * runs past its own end and picks up the ids of whatever is declared next,
 * which is how `footer` first printed the fourteen template names.
 */
function idsFromList(relativePath, declaration) {
  const source = readFileSync(join(ROOT, relativePath), "utf8");
  const start = source.indexOf(declaration);
  if (start === -1) return [];
  const body = source.slice(start);
  const end = body.indexOf("\n];");
  const scope = end === -1 ? body : body.slice(0, end);
  const ids = [];
  const pattern = /\{\s*id: "([a-z][a-zA-Z0-9-]*)"/g;
  let match;
  while ((match = pattern.exec(scope)) !== null) ids.push(match[1]);
  return ids;
}

const CATALOG = {
  format: idsFrom("src/lib/social/formats.ts", "export const SOCIAL_FORMATS"),
  theme: idsFrom("src/lib/social/themes.ts", "export const SOCIAL_THEMES"),
  template: idsFrom("src/lib/social/spec.ts", "export const SOCIAL_TEMPLATES"),
  mockup: idsFrom("src/lib/social/spec.ts", "export const MOCKUPS"),
  backdrop: idsFrom("src/lib/social/backdrops.ts", "export const SOCIAL_BACKDROPS"),
  placement: idsFrom("src/lib/social/placement.ts", "export const PLACEMENTS"),
  footer: idsFromList("src/lib/social/spec.ts", "export const FOOTER_MODES"),
  destination: idsFrom("src/lib/social/platforms.ts", "export const SOCIAL_DESTINATIONS"),
};

/**
 * Which fields each layout actually draws, read out of the same table the
 * studio reads. Fourteen layouts is more than anybody holds in their head,
 * and a field that a template does not render is a sentence written into
 * a hole.
 *
 * `optional` is read too. It holds the eyebrow, which every layout will
 * draw and no layout asks for: see the note in the printed output.
 */
function templateFields() {
  const source = readFileSync(join(ROOT, "src/lib/social/spec.ts"), "utf8");
  const scope = source.slice(source.indexOf("export const SOCIAL_TEMPLATES"));
  const out = {};
  const pattern = /^ {2}([a-z][a-zA-Z0-9]*): \{[\s\S]*?fields: \[([^\]]*)\],(?:\s*optional: \[([^\]]*)\],)?/gm;
  let match;
  const split = (raw) =>
    (raw || "")
      .split(",")
      .map((field) => field.trim().replace(/^"|"$/g, ""))
      .filter(Boolean);
  while ((match = pattern.exec(scope.slice(0, scope.indexOf("\n};")))) !== null) {
    out[match[1]] = { fields: split(match[2]), optional: split(match[3]) };
  }
  return out;
}

/** Destinations are editorial notes, printed so the agent picks a size on purpose. */
function destinationNotes() {
  const source = readFileSync(join(ROOT, "src/lib/social/platforms.ts"), "utf8");
  const scope = source.slice(source.indexOf("export const SOCIAL_DESTINATIONS"));
  const out = [];
  const pattern = /^ {2}"?([a-z-]+)"?: \{[\s\S]*?label: "([^"]*)"[\s\S]*?formats: \[([^\]]*)\]/gm;
  let match;
  while ((match = pattern.exec(scope.slice(0, scope.indexOf("\n};")))) !== null) {
    out.push({
      label: match[2],
      formats: match[3].split(",").map((f) => f.trim().replace(/^"|"$/g, "")).filter(Boolean),
    });
  }
  return out;
}

/** Card pixel sizes, needed on the row so the library can lay the grid out without rendering. */
function formatSize(id) {
  const source = readFileSync(join(ROOT, "src/lib/social/formats.ts"), "utf8");
  const block = source.slice(source.indexOf(`  ${id}: {`));
  const width = /width: (\d+)/.exec(block);
  const height = /height: (\d+)/.exec(block);
  return { width: Number(width?.[1] || 1080), height: Number(height?.[1] || 1080) };
}

// ---------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------

const problems = [];

function fail(where, message) {
  problems.push(`${where}: ${message}`);
}

function str(value, max = 600) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function list(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string" && item.trim()).slice(0, MAX_ITEMS)
    : [];
}

function normalizeSlide(slide, where) {
  const raw = slide && typeof slide === "object" ? slide : {};

  const template = CATALOG.template.includes(raw.template) ? raw.template : null;
  if (!template) {
    fail(where, `template must be one of ${CATALOG.template.join(", ")} (got ${JSON.stringify(raw.template)})`);
  }

  if (raw.mockup !== undefined && !CATALOG.mockup.includes(raw.mockup)) {
    fail(where, `mockup must be one of ${CATALOG.mockup.join(", ")} (got ${JSON.stringify(raw.mockup)})`);
  }

  const items = list(raw.items);
  const itemsB = list(raw.itemsB);

  const headline = str(raw.headline);
  const stat = str(raw.stat);
  if (!headline && !stat) fail(where, "needs a headline (or a stat, on a stat card)");

  // A comparison with one side filled in is an advert with the awkward
  // half deleted, and it renders as a lopsided card that gives that away.
  if (template === "compare" && (items.length === 0 || itemsB.length === 0)) {
    fail(where, "a comparison needs both columns: items for how it goes now, itemsB for what changes");
  }

  return {
    template: template || "statement",
    eyebrow: str(raw.eyebrow),
    headline,
    headlineAccent: str(raw.headlineAccent),
    body: str(raw.body),
    items,
    itemsB,
    labelA: str(raw.labelA, 60),
    labelB: str(raw.labelB, 60),
    stat,
    attribution: str(raw.attribution),
    footnote: str(raw.footnote),
    // No default. The cta draws on the right of the footer and the footnote
    // draws on the left, so defaulting this to the domain put `abram.network`
    // at both ends of the same rule on every card that set the footnote to it.
    cta: str(raw.cta),
    mockup: CATALOG.mockup.includes(raw.mockup) ? raw.mockup : "callsheet",
    // The product and showcase layouts draw a panel whatever this says.
    // Everywhere else it is the switch that puts one under the words.
    showMockup: raw.showMockup === true,
    brand: BRAND_KINDS.includes(raw.brand) ? raw.brand : "lockup",
    showRule: raw.showRule !== false,
  };
}

/**
 * The optional booking on a proposal: a day, a channel, and the words that
 * go with the card.
 *
 * Only the shape is checked here. Whether the channel and the landing page
 * actually exist is checked against the live tables in main(), because both
 * are editable without a deploy and a hardcoded list here would go stale.
 */
function normalizePost(post, where) {
  if (post === undefined || post === null) return null;
  if (typeof post !== "object") {
    fail(where, "post must be an object with at least scheduledFor and channel");
    return null;
  }

  const scheduledFor = str(post.scheduledFor, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledFor)) {
    fail(where, `post.scheduledFor must be a YYYY-MM-DD date (got ${JSON.stringify(post.scheduledFor)})`);
  } else {
    const today = todayISO();
    if (scheduledFor < today) {
      fail(where, `post.scheduledFor is ${scheduledFor}, which is in the past. Today is ${today}.`);
    } else if (scheduledFor > addDaysISO(today, MAX_DAYS_AHEAD)) {
      fail(where, `post.scheduledFor is more than ${MAX_DAYS_AHEAD} days out. Book the week ahead, not the quarter.`);
    }
  }

  const channel = str(post.channel, 40).trim().toLowerCase();
  if (!channel) fail(where, "post.channel is required, and must match a channel in the link builder");

  return {
    scheduledFor,
    channel,
    caption: str(post.caption, 4000),
    pageSlug: str(post.pageSlug, 80).trim() || null,
    campaign: str(post.campaign, 80).trim() || null,
    altText: str(post.altText, 500).trim() || null,
  };
}

function normalizeProposal(proposal, index) {
  const where = `proposal ${index + 1}`;
  const raw = proposal && typeof proposal === "object" ? proposal : {};

  const format = CATALOG.format.includes(raw.format) ? raw.format : null;
  if (!format) fail(where, `format must be one of ${CATALOG.format.join(", ")} (got ${JSON.stringify(raw.format)})`);

  const theme = CATALOG.theme.includes(raw.theme) ? raw.theme : null;
  if (!theme) fail(where, `theme must be one of ${CATALOG.theme.join(", ")} (got ${JSON.stringify(raw.theme)})`);

  // Optional, and both belong to the set rather than to a slide.
  if (raw.backdrop !== undefined && !CATALOG.backdrop.includes(raw.backdrop)) {
    fail(where, `backdrop must be one of ${CATALOG.backdrop.join(", ")} (got ${JSON.stringify(raw.backdrop)})`);
  }
  const backdrop = CATALOG.backdrop.includes(raw.backdrop) ? raw.backdrop : "none";

  // A photograph, named by its label in the studio's backdrop library. It
  // is resolved to a storage path against the live table just before the
  // write, because KIPP has no browser and cannot upload one: it can only
  // reach for something somebody already put there.
  const backdropImage = str(raw.backdropImage, 120) || null;

  if (raw.placement !== undefined && !CATALOG.placement.includes(raw.placement)) {
    fail(where, `placement must be one of ${CATALOG.placement.join(", ")} (got ${JSON.stringify(raw.placement)})`);
  }
  const placement = CATALOG.placement.includes(raw.placement) ? raw.placement : "center-left";

  if (raw.footer !== undefined && !CATALOG.footer.includes(raw.footer)) {
    fail(where, `footer must be one of ${CATALOG.footer.join(", ")} (got ${JSON.stringify(raw.footer)})`);
  }
  const footer = CATALOG.footer.includes(raw.footer) ? raw.footer : "both";

  const grain = typeof raw.grain === "boolean" ? raw.grain : backdrop !== "none" || Boolean(backdropImage);
  // All snapped by the renderer anyway; passed through so a proposal can ask.
  const typeScale = typeof raw.typeScale === "number" ? raw.typeScale : 1;
  const brandScale = typeof raw.brandScale === "number" ? raw.brandScale : 1;
  const backdropCrop = typeof raw.backdropCrop === "number" ? raw.backdropCrop : 1;
  const backdropDim = typeof raw.backdropDim === "number" ? raw.backdropDim : 0.58;
  const backdropFocus = typeof raw.backdropFocus === "string" ? raw.backdropFocus : "center";

  const slidesIn = Array.isArray(raw.slides) ? raw.slides : raw.slide ? [raw.slide] : [];
  if (slidesIn.length === 0) fail(where, "needs at least one slide");
  if (slidesIn.length > MAX_SLIDES) fail(where, `has ${slidesIn.length} slides, the cap is ${MAX_SLIDES}`);

  // The note is where the agent explains itself. Without it a reviewer is
  // guessing at what the card is for, which is how a queue stops being read.
  const note = str(raw.note, 1000);
  if (!note) fail(where, "needs a note saying where this would be posted and why");

  const slides = slidesIn.slice(0, MAX_SLIDES).map((slide, i) => normalizeSlide(slide, `${where} slide ${i + 1}`));

  return {
    // Carried so a problem found later, against the live tables, can still
    // say which proposal it came from.
    where,
    title: str(raw.title, 160) || slides[0]?.headline || "Untitled",
    note,
    campaignSlug: str(raw.campaignSlug, 80) || null,
    postSlug: str(raw.postSlug, 160) || null,
    format: format || "square",
    theme: theme || "midnight",
    // These were computed and then not returned, so a backdrop, a grain
    // setting or a type size in a proposal reached the row as undefined and
    // the renderer fell back to its defaults. Anything KIPP asked for above
    // the slide level was silently thrown away.
    backdrop,
    backdropImage,
    backdropCrop,
    backdropFocus,
    backdropDim,
    placement,
    footer,
    grain,
    typeScale,
    brandScale,
    slides,
    post: normalizePost(raw.post, where),
  };
}

// ---------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------

function toRows(proposal) {
  const { width, height } = formatSize(proposal.format);
  const isCarousel = proposal.slides.length > 1;
  const setId = isCarousel ? randomUUID() : null;

  return proposal.slides.map((slide, index) => {
    const spec = {
      ...slide,
      format: proposal.format,
      theme: proposal.theme,
      backdrop: proposal.backdrop,
      // A label until the live table turns it into a path, just before the
      // write. A dry run leaves it as the label and writes nothing.
      backdropImage: proposal.backdropImage || "",
      backdropCrop: proposal.backdropCrop,
      backdropFocus: proposal.backdropFocus,
      backdropDim: proposal.backdropDim,
      placement: proposal.placement,
      footer: proposal.footer,
      grain: proposal.grain,
      typeScale: proposal.typeScale,
      brandScale: proposal.brandScale,
      slideIndex: isCarousel ? index + 1 : 0,
      slideCount: isCarousel ? proposal.slides.length : 0,
    };
    return {
      // Minted here rather than left to the column default, so a booking can
      // point at its card without depending on the order rows come back in.
      id: randomUUID(),
      title: isCarousel ? `${proposal.title} ${index + 1}/${proposal.slides.length}` : proposal.title,
      spec,
      template: slide.template,
      format: proposal.format,
      theme: proposal.theme,
      width,
      height,
      status: "draft",
      source: "kipp",
      set_id: setId,
      slide_index: isCarousel ? index + 1 : 0,
      note: proposal.note,
      campaign_slug: proposal.campaignSlug,
      post_slug: proposal.postSlug,
    };
  });
}

/**
 * Turn the bookings into social_posts rows.
 *
 * Every row is built from one base shape and the blanks filled with null:
 * PostgREST rejects a bulk insert whose objects do not all carry the same
 * keys, with a message that names none of the offending fields.
 */
function toPostRows(prepared, lists) {
  const rows = [];
  const skipped = [];

  for (const { proposal, rows: cards } of prepared) {
    const booking = proposal.post;
    if (!booking) continue;

    const channel = lists.channels.find((c) => c.source === booking.channel);
    if (!channel) {
      fail(proposal.where, `post.channel "${booking.channel}" is not a channel in the link builder. Live: ${lists.channels.map((c) => c.source).join(", ")}`);
      continue;
    }

    let page = null;
    if (booking.pageSlug) {
      page = lists.pages.find((p) => p.slug === booking.pageSlug) || null;
      if (!page) {
        fail(proposal.where, `post.pageSlug "${booking.pageSlug}" is not a landing page. Live: ${lists.pages.map((p) => p.slug).join(", ")}`);
        continue;
      }
    }

    let campaign = null;
    if (booking.campaign) {
      campaign = lists.campaigns.find((c) => c.slug === booking.campaign) || null;
      if (!campaign) {
        // Creating one would be inventing a positioning decision. Say so and
        // let the run fail rather than quietly filing an untagged post.
        fail(proposal.where, `post.campaign "${booking.campaign}" does not exist. Create it in Social Studio, Calendar, or leave the field out.`);
        continue;
      }
    }

    // One post per channel per day. A second is almost always the agent
    // proposing the same idea twice rather than a deliberate double post.
    const key = `${booking.scheduledFor}:${booking.channel}`;
    if (lists.booked.has(key)) {
      skipped.push(`${booking.scheduledFor} ${booking.channel} (already booked)`);
      continue;
    }
    lists.booked.add(key);

    const first = cards[0];
    rows.push({
      campaign_id: campaign ? campaign.id : null,
      scheduled_for: booking.scheduledFor,
      slot: 1,
      channel: booking.channel,
      caption: booking.caption || "",
      link_url: page ? buildTrackedLink(page.path, channel.source, channel.medium, campaign ? campaign.slug : null) : null,
      page_slug: page ? page.slug : null,
      asset_id: first.id,
      set_id: first.set_id,
      alt_text: booking.altText,
      status: "draft",
      source: "kipp",
      note: proposal.note,
    });
  }

  return { rows, skipped };
}

// ---------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------

function readInput(args) {
  const fileIndex = args.indexOf("--file");
  if (fileIndex !== -1 && args[fileIndex + 1]) {
    return readFileSync(args[fileIndex + 1], "utf8");
  }
  if (args.includes("--stdin")) {
    return readFileSync(0, "utf8");
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--options") || args.includes("--help")) {
    console.log("What the renderer accepts:\n");
    for (const [key, values] of Object.entries(CATALOG)) {
      if (key === "destination" || key === "backdrop" || key === "placement" || key === "footer") continue;
      console.log(`  ${key.padEnd(9)} ${values.join(", ")}`);
    }
    console.log(`  ${"brand".padEnd(9)} ${BRAND_KINDS.join(", ")}`);
    console.log(`  ${"backdrop".padEnd(9)} ${CATALOG.backdrop.join(", ")}   (set-level, with grain: true|false)`);
    console.log(`  ${"placement".padEnd(9)} ${CATALOG.placement.join(", ")}   (set-level: where the words sit)`);
    console.log(`  ${"footer".padEnd(9)} ${CATALOG.footer.join(", ")}   (set-level: which side of the footer bar draws)`);
    console.log(`  ${"sizes".padEnd(9)} typeScale 0.85 | 1 | 1.15 | 1.3   brandScale 0.7 | 1 | 1.35`);
    console.log("");
    console.log("  The footer has two slots: the footnote on the left and the cta on the right.");
    console.log("  Setting both to the same words prints them at each end of one rule, so give");
    console.log("  the card a footnote or a cta, and use footer: left | right to draw just one.");
    console.log("");
    console.log("  A photograph instead of a drawn backdrop, all set-level:");
    console.log("    backdropImage  the title of an image in the studio's image library");
    console.log("    backdropCrop   1 wide | 1.2 mid | 1.45 close | 1.75 tight");
    console.log("    backdropFocus  top-left top top-right left center right bottom-left bottom bottom-right");
    console.log("    backdropDim    0 none | 0.38 light | 0.58 medium | 0.78 heavy");
    console.log("    Uploading is a person's job. Name one that is already there, or the run stops");
    console.log("    and prints the titles that exist. `--backdrops` lists the library first.");
    console.log("    Whoever took it is credited on the card automatically, from the library.");

    console.log("");
    console.log("  An app panel on a layout that is not built around one:");
    console.log("    showMockup     true puts the chosen screen under the words. Works on every layout");
    console.log("                   except product and showcase, which always draw one.");
    console.log("    mockup         which screen. Pick it whenever showMockup is true.");

    console.log("\nWhich fields each layout draws. Anything else on the slide is ignored:\n");
    for (const [template, entry] of Object.entries(templateFields())) {
      const optional = entry.optional.length > 0 ? `   (optional: ${entry.optional.join(", ")})` : "";
      console.log(`  ${template.padEnd(10)} ${entry.fields.join(", ")}${optional}`);
    }

    console.log("\n  The eyebrow is optional everywhere and wanted almost nowhere. It is a small");
    console.log("  letterspaced label above the headline, and over a line that already says the");
    console.log("  thing it is a word the reader steps over on the way to the sentence. Set it only");
    console.log("  when it carries something the card cannot get any other way: a version badge on");
    console.log("  an announcement, or where you are in a carousel. Leave it out otherwise.");

    const places = destinationNotes();
    if (places.length > 0) {
      console.log("\nWhere a size goes. Pick the destination first, then the size:\n");
      for (const place of places) {
        console.log(`  ${place.label.padEnd(24)} ${place.formats.join(", ")}`);
      }
    }

    console.log(`\n  up to ${MAX_PROPOSALS} proposals per run, ${MAX_SLIDES} slides each, ${MAX_ITEMS} points per card`);
    console.log("\nEvery proposal needs: title, note, format, theme, slides[].");
    console.log("Every slide needs: template, and a headline (or a stat on a stat card).");
    console.log("A compare slide needs both columns: items and itemsB.");
    console.log("A poster slide wants a backdrop, brand: none, and no eyebrow or cta.");
    console.log("Centring only applies to poster, hook, statement, quote, stat and term.");
    console.log("Every other layout is a set of lines to read down and keeps its left edge.");

    console.log("\nOptional `post` block, which books the card onto the calendar:\n");
    console.log('  scheduledFor  YYYY-MM-DD. Today or later, at most ' + MAX_DAYS_AHEAD + " days out.");
    console.log("  channel       required, must match a channel in the link builder");
    console.log("  caption       the words. Empty is allowed when the card carries the message.");
    console.log("  pageSlug      landing page to link to. Omit for a post with no link.");
    console.log("  campaign      an existing campaign slug. It must already exist.");
    console.log("  altText       what the card shows, for anyone who cannot see it");
    console.log("\n  One post per channel per day. A day already booked is skipped and reported.");
    console.log("  Everything lands as a draft and reaches nobody until a person marks it ready.");
    return 0;
  }

  /**
   * The image library, as it stands right now.
   *
   * The one part of the catalogue that cannot be read out of the source,
   * because it is a table somebody uploads into rather than a list in the
   * repository. Without this, naming a backdrop is guessing at a title and
   * finding out at the end of a run.
   */
  if (args.includes("--backdrops")) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not set. Skipping.");
      return 78;
    }

    const res = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/social_backdrop_images` +
        "?select=label,credit,credit_handle,width,height&order=created_at.desc",
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );

    if (!res.ok) {
      console.error(`Could not read the image library (${res.status}): ${await res.text()}`);
      return 1;
    }

    const library = await res.json();
    if (library.length === 0) {
      console.log("The image library is empty. Use a drawn backdrop, or ask for one to be uploaded.");
      return 0;
    }

    console.log(`${library.length} images. Name one by its title, in backdropImage:\n`);
    for (const image of library) {
      const size = image.width && image.height ? `${image.width}x${image.height}` : "";
      const credit = creditLine(image.credit, image.credit_handle);
      console.log(`  ${image.label.padEnd(40)} ${size.padEnd(12)}${credit ? `  ${credit}` : ""}`);
    }
    console.log("\n  A credit is carried onto the card on its own, and the morning pack asks");
    console.log("  whoever posts it to tag them. Nothing to set, and nothing to write: an");
    console.log("  attribution is a fact about a picture, not a line for an agent to compose.");
    return 0;
  }

  const missingCatalog = Object.entries(CATALOG).filter(([, values]) => values.length === 0);
  if (missingCatalog.length > 0) {
    console.error(
      `Could not read ${missingCatalog.map(([key]) => key).join(", ")} out of src/lib/social/. ` +
        "The renderer's source has moved or changed shape; fix this script before trusting it."
    );
    return 1;
  }

  const input = readInput(args);
  if (!input) {
    console.error("Nothing to file. Pass --file <path> or --stdin, or --options to see what is accepted.");
    return 1;
  }

  let parsed;
  try {
    parsed = JSON.parse(input);
  } catch (err) {
    console.error(`That is not valid JSON: ${err.message}`);
    return 1;
  }

  const list = Array.isArray(parsed) ? parsed : [parsed];
  if (list.length > MAX_PROPOSALS) {
    console.error(`${list.length} proposals, and the cap is ${MAX_PROPOSALS}. Pick the strongest ones.`);
    return 1;
  }

  const proposals = list.map(normalizeProposal);
  if (problems.length > 0) {
    console.error("Nothing was filed. Fix these first:\n");
    for (const problem of problems) console.error(`  - ${problem}`);
    return 1;
  }

  const prepared = proposals.map((proposal) => ({ proposal, rows: toRows(proposal) }));
  const rows = prepared.flatMap((entry) => entry.rows);
  const bookings = proposals.filter((proposal) => proposal.post).length;

  if (args.includes("--dry-run")) {
    // Validated against the built-in lists, since a dry run is meant to work
    // with no credentials. A real run checks the live tables instead.
    const { rows: postRows, skipped } = toPostRows(prepared, {
      channels: FALLBACK_CHANNELS,
      pages: FALLBACK_PAGES,
      campaigns: [],
      booked: new Set(),
    });

    if (problems.length > 0) {
      console.error("Nothing was filed. Fix these first:\n");
      for (const problem of problems) console.error(`  - ${problem}`);
      console.error("\n(A dry run checks channels and pages against the built-in lists. A real run uses the live tables.)");
      return 1;
    }

    console.log(
      `${proposals.length} proposals, ${rows.length} cards, ${postRows.length} scheduled. All valid. Nothing written.`
    );
    for (const { proposal } of prepared) {
      const shape = proposal.slides.length > 1 ? `carousel, ${proposal.slides.length} slides` : "single";
      const booking = proposal.post ? `${proposal.post.scheduledFor} ${proposal.post.channel}` : "not scheduled";
      console.log(`  - ${proposal.title} (${shape}, ${proposal.format}, ${proposal.theme}) ${booking}`);
    }
    for (const skip of skipped) console.log(`  skipped: ${skip}`);
    return 0;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not set. Skipping.");
    return 78;
  }

  const base = url.replace(/\/$/, "");
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };

  async function read(path) {
    const res = await fetch(`${base}/rest/v1/${path}`, { headers });
    if (!res.ok) throw new Error(`${path.split("?")[0]} (${res.status}): ${await res.text()}`);
    return res.json();
  }

  /**
   * Turn any backdrop label a proposal named into the storage path the
   * renderer wants. Done here rather than in validation because it is the
   * one field that cannot be checked against the source: the library is a
   * table somebody uploads into, not a list in the repository.
   *
   * An unmatched label is a hard stop with the real list printed, because
   * the alternative is a card that quietly comes out on a flat colour and
   * gets approved before anybody notices the picture is missing.
   */
  const wantsBackdrop = rows.some((row) => row.spec.backdropImage);
  if (wantsBackdrop) {
    let library;
    try {
      library = await read(
        "social_backdrop_images?select=label,storage_path,base_color,credit,credit_handle&order=created_at.desc"
      );
    } catch (err) {
      console.error(`Could not read the backdrop library: ${err.message}`);
      return 1;
    }

    const byLabel = new Map(library.map((image) => [image.label.toLowerCase(), image]));
    const missing = new Set();

    for (const row of rows) {
      const label = row.spec.backdropImage;
      if (!label) continue;
      const match = byLabel.get(label.toLowerCase());
      if (!match) {
        missing.add(label);
        continue;
      }
      row.spec.backdropImage = match.storage_path;
      row.spec.backdropBase = match.base_color || "#0A0A0A";
      // The credit comes off the library rather than out of the proposal.
      // An agent has no way to know who took a picture, and letting it
      // write that field would be letting it invent an attribution.
      row.spec.backdropCredit = creditLine(match.credit, match.credit_handle);
    }

    if (missing.size > 0) {
      console.error(`No backdrop is called ${[...missing].map((m) => JSON.stringify(m)).join(", ")}.`);
      console.error(
        library.length > 0
          ? `Available: ${library.map((image) => image.label).join(", ")}`
          : "The backdrop library is empty. Upload one in the studio first, or use a drawn backdrop."
      );
      return 1;
    }
  }

  let postRows = [];
  let skipped = [];

  if (bookings > 0) {
    let lists;
    try {
      const today = todayISO();
      const [channels, pages, campaigns, booked] = await Promise.all([
        read("campaign_link_channels?select=source,medium&active=eq.true&order=sort_order"),
        read("campaign_link_pages?select=slug,path&active=eq.true&order=sort_order"),
        read("social_campaigns?select=id,slug&status=in.(planning,active)"),
        read(
          `social_posts?select=scheduled_for,channel&scheduled_for=gte.${today}` +
            `&scheduled_for=lte.${addDaysISO(today, MAX_DAYS_AHEAD)}&status=neq.skipped`
        ),
      ]);

      lists = {
        // An empty table means "not seeded", not "no channels exist".
        channels: channels.length > 0 ? channels : FALLBACK_CHANNELS,
        pages: pages.length > 0 ? pages : FALLBACK_PAGES,
        campaigns,
        booked: new Set(booked.map((row) => `${row.scheduled_for}:${row.channel}`)),
      };
    } catch (err) {
      console.error(`Could not read the calendar to schedule against: ${err.message}`);
      return 1;
    }

    ({ rows: postRows, skipped } = toPostRows(prepared, lists));

    // Nothing has been written yet, so a bad booking costs the cards too.
    // That is the right trade: a card filed without the post it was drawn
    // for is a card nobody can place.
    if (problems.length > 0) {
      console.error("Nothing was filed. Fix these first:\n");
      for (const problem of problems) console.error(`  - ${problem}`);
      return 1;
    }
  }

  const cardResponse = await fetch(`${base}/rest/v1/social_image_assets`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify(rows),
  });

  if (!cardResponse.ok) {
    console.error(`The library rejected the write (${cardResponse.status}): ${await cardResponse.text()}`);
    return 1;
  }

  if (postRows.length > 0) {
    const postResponse = await fetch(`${base}/rest/v1/social_posts`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify(postRows),
    });

    if (!postResponse.ok) {
      // The cards are in. Say exactly that, so the next run does not refile
      // them and nobody goes looking for bookings that never landed.
      console.error(`The cards were filed, but the calendar rejected the bookings (${postResponse.status}): ${await postResponse.text()}`);
      console.error("Schedule them by hand in Admin, Social Studio, Calendar.");
      return 1;
    }
  }

  console.log(
    `Filed ${rows.length} ${rows.length === 1 ? "card" : "cards"} across ${proposals.length} ` +
      `${proposals.length === 1 ? "proposal" : "proposals"}, ${postRows.length} booked onto the calendar. ` +
      "All drafts, waiting on review in Admin, Social Studio."
  );
  // Never a silent cap. A skipped booking that goes unmentioned reads as one
  // that was filed.
  for (const skip of skipped) console.log(`  not scheduled: ${skip}`);
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
