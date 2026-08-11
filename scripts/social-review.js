#!/usr/bin/env node
/**
 * social-review.js: the daily approval.
 *
 * Puts the next post waiting for approval into #kipp, with the card, the
 * caption, the link, and three buttons: approve it, ask for a rewrite, or
 * skip the day. Approving from the message publishes the card and puts
 * the post in the morning pack on its day, so the dashboard is somewhere
 * to go when you want to, rather than somewhere to go every morning.
 *
 * This script does almost nothing. It calls the dispatch route on the
 * site, which is where the message is actually built, because the message
 * the buttons rewrite has to be the same message that was sent and the
 * only way to guarantee that is for one piece of code to build both.
 *
 * It never posts to a social network and holds no social credentials, and
 * it cannot approve anything. Every approval in this system is a person
 * pressing a button.
 *
 * Zero dependencies. Node 20+ (global fetch only).
 *
 * Usage:
 *   node scripts/social-review.js
 *   node scripts/social-review.js --limit 2    # ask about more than one
 *   node scripts/social-review.js --dry-run    # pick, report, send nothing
 *
 * Environment:
 *   SOCIAL_REVIEW_URL           The dispatch route. Defaults to production.
 *   SOCIAL_REVIEW_CRON_SECRET   Shared with the route                (required)
 *
 * Exit codes:
 *   0  sent, or nothing was waiting
 *   1  the call failed
 *   78 not configured. A deliberate skip, the same contract gsc-report.js uses.
 */

const ENDPOINT =
  process.env.SOCIAL_REVIEW_URL || "https://abram.network/api/social/review/dispatch";
const SECRET = process.env.SOCIAL_REVIEW_CRON_SECRET;

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  const limitIndex = args.indexOf("--limit");
  const limit = limitIndex !== -1 ? Number(args[limitIndex + 1]) : 1;
  if (!Number.isFinite(limit) || limit < 1) {
    console.error("[social-review] --limit takes a number of posts to ask about.");
    return 1;
  }

  if (!SECRET) {
    console.error("[social-review] SOCIAL_REVIEW_CRON_SECRET is not set. Skipping.");
    return 78;
  }

  const url = new URL(ENDPOINT);
  url.searchParams.set("limit", String(limit));
  if (dryRun) url.searchParams.set("dry", "1");

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET}` },
    });
  } catch (err) {
    console.error(`[social-review] Could not reach the site: ${err.message}`);
    return 1;
  }

  const body = await response.json().catch(() => ({}));

  if (response.status === 503) {
    console.error(`[social-review] ${body.error || "Not configured"}. Skipping.`);
    return 78;
  }

  if (!response.ok) {
    console.error(`[social-review] ${response.status}: ${body.error || "The call failed."}`);
    return 1;
  }

  if (!body.sent) {
    console.log(`[social-review] ${body.note || "Nothing was waiting for approval."}`);
    return 0;
  }

  console.log(
    `[social-review] ${dryRun ? "Would ask about" : "Asked about"} ${body.sent} ${
      body.sent === 1 ? "post" : "posts"
    }.`
  );
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
