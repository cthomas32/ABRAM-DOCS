import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  REVIEW_POST_SELECT,
  previewUrl,
  postToSlack,
  reviewBlocks,
  reviewSummary,
  siteUrl,
  toReviewPost,
  webhookUrl,
} from "@/lib/social/slackReview";

/**
 * Putting the next post that needs approving into #kipp.
 *
 * The morning pack delivers posts that are already approved. This is the
 * step before it: one draft, everything needed to judge it, and three
 * buttons. Run once a day, it means the calendar is kept full without
 * anyone opening the dashboard.
 *
 * It is a route rather than a standalone script for one reason: the
 * message it sends and the message the buttons rewrite have to be the
 * same message, and the only way to guarantee that is for both to be
 * built by the same code. scripts/social-review.js calls this.
 *
 * There is no model here and no judgement. It reads the queue, formats
 * what it finds, and sends it. Everything it asks about was written by a
 * person or by KIPP, and nothing here can approve anything.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TZ = process.env.SOCIAL_DAILY_TZ || "America/New_York";

/** One a day. A queue of five to work through before coffee is a queue that gets rubber stamped. */
const DEFAULT_LIMIT = 1;
const MAX_LIMIT = 5;

function todayIn(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function POST(request: Request) {
  const secret = process.env.SOCIAL_REVIEW_CRON_SECRET;
  const offered = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  // No secret configured means the endpoint is closed, not open. An open
  // one is a way for anyone to empty the queue into the channel.
  if (!secret || offered !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry") === "1";
  const limit = Math.max(1, Math.min(MAX_LIMIT, Number(url.searchParams.get("limit")) || DEFAULT_LIMIT));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return Response.json({ error: "Not configured" }, { status: 503 });
  }
  if (!webhookUrl() && !dryRun) {
    return Response.json({ error: "No #kipp webhook is configured." }, { status: 503 });
  }

  const supabase: SupabaseClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const today = todayIn(TZ);

  // The queue: drafts, on a day that has not happened yet, that have not
  // been asked about. Filtering on review_notified_at rather than on the
  // date is what makes a late or repeated run harmless, the same contract
  // notified_at gives the morning pack.
  //
  // A day already gone is left alone deliberately. Approving Tuesday's
  // post on Thursday publishes a card for a day that is over.
  const { data, error } = await supabase
    .from("social_posts")
    .select(REVIEW_POST_SELECT)
    .eq("status", "draft")
    .is("review_notified_at", null)
    .gte("scheduled_for", today)
    .order("scheduled_for", { ascending: true })
    .order("slot", { ascending: true })
    .limit(limit);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const posts = ((data || []) as unknown[]).map((row) => toReviewPost(row as Record<string, unknown>));

  // Silence on an empty queue. The morning pack already says what the week
  // looks like, and a second message every day saying there is nothing to
  // do is a message that trains you to ignore the first one.
  if (posts.length === 0) {
    return Response.json({ sent: 0, note: "Nothing is waiting for approval." });
  }

  const sent: string[] = [];
  for (const post of posts) {
    const image = post.asset ? post.asset.public_url || previewUrl(post.asset.id, siteUrl()) : null;
    const payload = {
      text: reviewSummary(post, today),
      blocks: reviewBlocks(post, image, today),
      // Every post points at the same handful of landing pages, and left
      // to unfurl the question arrives with a preview card stapled under it.
      unfurl_links: false,
      unfurl_media: false,
    };

    if (dryRun) {
      sent.push(post.id);
      continue;
    }

    try {
      await postToSlack(payload);
    } catch (err) {
      return Response.json(
        { error: err instanceof Error ? err.message : "Slack rejected the message.", sent: sent.length },
        { status: 502 }
      );
    }

    // Stamped one at a time, after its own message landed. Stamping the
    // batch up front would lose a post to a failure halfway through, and a
    // post that was never asked about is one that quietly never goes out.
    const { error: stampError } = await supabase
      .from("social_posts")
      .update({ review_notified_at: new Date().toISOString() })
      .eq("id", post.id);

    if (stampError) console.error(`Social review: could not stamp ${post.id}: ${stampError.message}`);
    sent.push(post.id);
  }

  return Response.json({ sent: sent.length, ids: sent, dryRun });
}
