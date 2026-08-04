#!/usr/bin/env node
/**
 * social-daily.js: the morning post pack.
 *
 * Reads today's ready posts off the social calendar and puts them in Slack
 * with everything needed to post them: the card at its public address, the
 * caption, the tracked link, and which channel it is for. Copy, paste,
 * post. That is the whole job.
 *
 * It adds one forward-looking line: a stretch of days ahead with nothing
 * booked, and any day whose post is written but still waiting to be
 * marked ready. Both are worth hearing while there is still time to act
 * on them, and neither is visible on the morning the day goes quiet.
 *
 * There is no model in this script and there is no judgement in it. The
 * thinking happened when the post was written and again when someone
 * marked it ready; this only delivers. That is deliberate: a daily job
 * that reasons is a daily job that can invent something, and this one runs
 * unattended every morning.
 *
 * It never posts to a social network and holds no social credentials.
 *
 * Zero dependencies. Node 20+ (node: built-ins and global fetch only).
 *
 * Usage:
 *   node scripts/social-daily.js                 # today, in ET
 *   node scripts/social-daily.js --date 2026-08-05
 *   node scripts/social-daily.js --dry-run       # print the message, send nothing
 *   node scripts/social-daily.js --quiet         # say nothing when the day is empty
 *   node scripts/social-daily.js --resend        # include posts already announced
 *
 * Environment:
 *   NEXT_PUBLIC_SUPABASE_URL    ABRAM-DOCS project URL          (required)
 *   SUPABASE_SERVICE_ROLE_KEY   ABRAM-DOCS service role key     (required)
 *   SLACK_WEBHOOK_URL_KIPP      Incoming webhook, #kipp         (required to send)
 *   SOCIAL_DAILY_TZ             IANA zone, default America/New_York
 *
 * Exit codes:
 *   0  delivered, or nothing to say
 *   1  the read or the send failed
 *   78 not configured. A deliberate skip, the same contract gsc-report.js uses.
 */

const TZ = process.env.SOCIAL_DAILY_TZ || "America/New_York";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WEBHOOK_URL =
  process.env.SLACK_WEBHOOK_URL_KIPP ||
  process.env.SLACK_TRIAGE_WEBHOOK_URL ||
  process.env.SLACK_WEBHOOK_URL;

/** Slack caps a message at 50 blocks, and nobody works through more than this before coffee. */
const MAX_POSTS = 5;

// ---------------------------------------------------------------------
// Dates
//
// The job runs on UTC infrastructure and the calendar is written in local
// days, so "today" has to be resolved in a named zone. en-CA formats as
// YYYY-MM-DD, which is the same shape the date column holds.
// ---------------------------------------------------------------------

function dateIn(timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Date arithmetic on the string, in UTC, so a --date override behaves like a real run. */
function addDaysISO(iso, days) {
  const [year, month, day] = iso.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day));
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

function humanDate(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------
// Reading the calendar
// ---------------------------------------------------------------------

async function rest(path) {
  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${path}`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`The calendar read failed (${response.status}): ${await response.text()}`);
  }
  return response.json();
}

const SELECT =
  "select=id,scheduled_for,slot,channel,kind,caption,link_url,status,source,note,alt_text,set_id," +
  "asset:social_image_assets(title,public_url,width,height,status,spec)," +
  "campaign:social_campaigns(name,slug)";

async function readDay(date, includeNotified) {
  const notified = includeNotified ? "" : "&notified_at=is.null";
  const ready = await rest(
    `social_posts?${SELECT}&scheduled_for=eq.${date}&status=eq.ready${notified}&order=slot.asc`
  );
  const drafts = await rest(
    `social_posts?select=id,channel,caption,source&scheduled_for=eq.${date}&status=eq.draft&order=slot.asc`
  );
  return { ready, drafts };
}

/** How much of the week ahead is already filled, which is the only number worth nagging about. */
async function readWeekAhead(fromDate) {
  // Seven days including the day itself, so "5 of the next 7" reads the
  // way a person counts it.
  const end = addDaysISO(fromDate, 6);
  const rows = await rest(
    `social_posts?select=scheduled_for,status&scheduled_for=gte.${fromDate}&scheduled_for=lte.${end}` +
      `&status=in.(draft,ready)&order=scheduled_for.asc`
  );

  const days = new Set(rows.map((row) => row.scheduled_for));
  const ready = new Set(rows.filter((row) => row.status === "ready").map((row) => row.scheduled_for));

  // The days still to come, not the whole window. Today is being reported on
  // directly and does not need nagging about; the days after it are the ones
  // where knowing early is worth something. A gap you hear about on Monday is
  // a gap KIPP can still fill on Friday. A gap you find on the morning of is
  // a day that already went quiet.
  const ahead = [];
  for (let offset = 1; offset <= 6; offset += 1) ahead.push(addDaysISO(fromDate, offset));

  return {
    filledDays: days.size,
    readyDays: ready.size,
    emptyDates: ahead.filter((day) => !days.has(day)),
    awaitingApproval: ahead.filter((day) => days.has(day) && !ready.has(day)),
  };
}

async function stampNotified(ids) {
  if (ids.length === 0) return;
  const list = ids.map((id) => `"${id}"`).join(",");
  const response = await fetch(
    `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/social_posts?id=in.(${list})`,
    {
      method: "PATCH",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ notified_at: new Date().toISOString() }),
    }
  );

  if (!response.ok) {
    // Worth saying out loud but not worth failing over: the pack was
    // delivered, and the cost of not stamping is one repeat tomorrow.
    console.error(`[social-daily] Could not stamp notified_at (${response.status}): ${await response.text()}`);
  }
}

// ---------------------------------------------------------------------
// The message
// ---------------------------------------------------------------------

/** "1 day has", "3 days have". Small, but a report that cannot count reads as a report nobody checked. */
function daysHave(count) {
  return count === 1 ? "1 of the next 7 days has" : `${count} of the next 7 days have`;
}

/** Weekday alone is unambiguous inside a six day window, and it is how a person thinks about next week. */
function weekdayName(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
  });
}

/**
 * "Thursday", "Thursday and Friday", "Thursday through Sunday".
 *
 * Only a run of three or more collapses to "through" — two days spelled out
 * is shorter to read than the range that would replace it, and it keeps the
 * "and" doing one job rather than two.
 */
function listDays(dates) {
  const runs = [];
  for (const date of dates) {
    const current = runs[runs.length - 1];
    if (current && addDaysISO(current[current.length - 1], 1) === date) current.push(date);
    else runs.push([date]);
  }

  const phrases = runs.flatMap((run) =>
    run.length > 2
      ? [`${weekdayName(run[0])} through ${weekdayName(run[run.length - 1])}`]
      : run.map(weekdayName)
  );

  if (phrases.length === 1) return phrases[0];
  if (phrases.length === 2) return `${phrases[0]} and ${phrases[1]}`;
  return `${phrases.slice(0, -1).join(", ")}, and ${phrases[phrases.length - 1]}`;
}

/**
 * The forward look, and the only place this script says something about a day
 * other than today.
 *
 * Two empty days is a quiet stretch worth knowing about while there is still
 * time to fill it. One is an ordinary gap, and a job that nags about every
 * ordinary gap is a job whose lines stop being read.
 */
function calendarWarnings(week) {
  const lines = [];

  if (week.emptyDates.length >= 2) {
    lines.push(
      `Nothing booked ${listDays(week.emptyDates)}. KIPP fills the week ahead on Friday, ` +
        "so a gap this far out is one there is still time to close."
    );
  }

  if (week.awaitingApproval.length > 0) {
    lines.push(
      `${listDays(week.awaitingApproval)} ${week.awaitingApproval.length === 1 ? "has a post" : "have posts"} ` +
        "still waiting to be marked ready in Social Studio, Calendar. Nothing unapproved reaches this message."
    );
  }

  return lines.map((text) => ({ type: "context", elements: [{ type: "mrkdwn", text }] }));
}

function channelLabel(channel) {
  const known = {
    x: "X",
    tiktok: "TikTok",
    youtube: "YouTube",
    linkedin: "LinkedIn",
    instagram: "Instagram",
    facebook: "Facebook",
    threads: "Threads",
    reddit: "Reddit",
    discord: "Discord",
  };
  return known[channel] || channel.charAt(0).toUpperCase() + channel.slice(1);
}

function buildBlocks({ date, ready, drafts, week, shown }) {
  const blocks = [
    {
      type: "header",
      text: { type: "plain_text", text: `Ready to post: ${humanDate(date)}`, emoji: true },
    },
  ];

  if (ready.length === 0) {
    const line =
      drafts.length > 0
        ? `Nothing is approved. ${drafts.length} ${drafts.length === 1 ? "post is" : "posts are"} ` +
          "sitting as drafts in Social Studio, Calendar. Marking one ready publishes its card and sends it here."
        : "Nothing is scheduled.";

    blocks.push({ type: "section", text: { type: "mrkdwn", text: line } });
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `${daysHave(week.filledDays)} something on them, ${week.readyDays} of those approved.`,
        },
      ],
    });
    blocks.push(...calendarWarnings(week));
    return blocks;
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text:
          `${ready.length} ${ready.length === 1 ? "post" : "posts"} approved for today. ` +
          `${daysHave(week.filledDays)} something on them.`,
      },
    ],
  });
  blocks.push(...calendarWarnings(week));

  for (const post of shown) {
    blocks.push({ type: "divider" });

    const heading = [`*${channelLabel(post.channel)}*`];
    if (post.campaign?.name) heading.push(`_${post.campaign.name}_`);
    // What the post is for. A product post and a post about the craft are
    // read differently by whoever is about to paste them, and on a week
    // where three arrive in a row it is the fastest way to see the drift.
    if (post.kind && post.kind !== "product") heading.push(`· ${post.kind}`);
    if (post.source === "kipp") heading.push("· drafted by KIPP");

    blocks.push({ type: "section", text: { type: "mrkdwn", text: heading.join("  ") } });

    if (post.caption?.trim()) {
      // Slack renders 3000 characters in a section and truncates silently
      // past it, which would be the one failure mode nobody would notice.
      const caption = post.caption.length > 2800 ? `${post.caption.slice(0, 2800)}…` : post.caption;
      blocks.push({ type: "section", text: { type: "mrkdwn", text: caption } });
    }

    if (post.link_url) {
      // Bare, not a <url|label> link. The point is to select it and paste
      // it, and a labelled link hands you the label instead of the URL.
      blocks.push({ type: "section", text: { type: "mrkdwn", text: post.link_url } });
    }

    // Whoever took the picture. The card credits them in a corner, which
    // is the courtesy; the tag in the caption is the part they are
    // actually told about, and it is the part that gets forgotten unless
    // it arrives here ready to paste.
    const credit = post.asset?.spec?.backdropCredit;
    if (credit) {
      blocks.push({ type: "section", text: { type: "mrkdwn", text: `Photo by ${credit}` } });
      blocks.push({
        type: "context",
        elements: [{ type: "mrkdwn", text: "Paste that in and tag them. The card credits them too." }],
      });
    }

    // Only an approved card has a public address. A ready post should
    // always have one, and if it somehow does not, say so rather than
    // sending a broken image block.
    if (post.asset?.public_url) {
      blocks.push({
        type: "image",
        image_url: post.asset.public_url,
        alt_text: post.alt_text || post.asset.title || "Post card",
      });
      if (post.set_id) {
        blocks.push({
          type: "context",
          elements: [
            { type: "mrkdwn", text: "Carousel. Slide one shown, download the set in Social Studio, Calendar." },
          ],
        });
      }
    } else if (post.asset) {
      blocks.push({
        type: "context",
        elements: [{ type: "mrkdwn", text: "The card for this post has not been published, so it is not shown here." }],
      });
    }

    if (post.note) {
      blocks.push({ type: "context", elements: [{ type: "mrkdwn", text: post.note }] });
    }
  }

  if (ready.length > shown.length) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `${ready.length - shown.length} more approved for today, in Social Studio, Calendar.`,
        },
      ],
    });
  }

  if (drafts.length > 0) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `${drafts.length} more ${
            drafts.length === 1 ? "post is waiting as a draft" : "posts are waiting as drafts"
          } for today.`,
        },
      ],
    });
  }

  return blocks;
}

/** The notification line and the fallback for anywhere blocks do not render. */
function summaryText({ date, ready, drafts }) {
  if (ready.length === 0) {
    return drafts.length > 0
      ? `Nothing approved for ${humanDate(date)}. ${drafts.length} waiting as drafts.`
      : `Nothing scheduled for ${humanDate(date)}.`;
  }
  const channels = [...new Set(ready.map((post) => channelLabel(post.channel)))].join(", ");
  return `${ready.length} ready to post today: ${channels}`;
}

async function send(payload) {
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Slack rejected the message (${response.status}): ${await response.text()}`);
  }
}

// ---------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const quiet = args.includes("--quiet");
  const resend = args.includes("--resend");

  const dateIndex = args.indexOf("--date");
  const date = dateIndex !== -1 && args[dateIndex + 1] ? args[dateIndex + 1] : dateIn(TZ);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error(`[social-daily] "${date}" is not a date. Use YYYY-MM-DD.`);
    return 1;
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("[social-daily] NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not set. Skipping.");
    return 78;
  }
  if (!WEBHOOK_URL && !dryRun) {
    console.error("[social-daily] SLACK_WEBHOOK_URL_KIPP is not set. Skipping.");
    return 78;
  }

  let day;
  let week;
  try {
    day = await readDay(date, resend);
    week = await readWeekAhead(date);
  } catch (err) {
    console.error(`[social-daily] ${err.message}`);
    return 1;
  }

  const { ready, drafts } = day;
  const shown = ready.slice(0, MAX_POSTS);

  if (ready.length === 0 && drafts.length === 0 && quiet) {
    console.log(`[social-daily] Nothing scheduled for ${date}, and --quiet is set. Said nothing.`);
    return 0;
  }

  const payload = {
    text: summaryText({ date, ready, drafts }),
    blocks: buildBlocks({ date, ready, drafts, week, shown }),
    // Every post carries a link to the same handful of landing pages. Left
    // to unfurl, a three post morning arrives as three big preview cards
    // stapled under the pack, and the pack is the thing worth reading.
    unfurl_links: false,
    unfurl_media: false,
  };

  if (dryRun) {
    console.log(payload.text);
    console.log(JSON.stringify(payload.blocks, null, 2));
    console.log(`\n[social-daily] Dry run. ${ready.length} ready, ${drafts.length} drafts. Nothing sent or stamped.`);
    return 0;
  }

  try {
    await send(payload);
  } catch (err) {
    console.error(`[social-daily] ${err.message}`);
    return 1;
  }

  // Only the posts actually carried in the message are stamped. Anything
  // over the cap is still unannounced and should lead tomorrow's message.
  await stampNotified(shown.map((post) => post.id));

  console.log(
    `[social-daily] Delivered ${shown.length} of ${ready.length} ready ${ready.length === 1 ? "post" : "posts"} for ${date}.`
  );
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
