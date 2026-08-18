import { after } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { publishPost } from "@/lib/social/approvePost";
import {
  ACTION_APPROVE,
  ACTION_REVISE,
  ACTION_REVISION_NOTE,
  ACTION_REVISION_SEND,
  ACTION_SKIP,
  BLOCK_REVISION_INPUT,
  REVIEW_POST_SELECT,
  approvedBlocks,
  cardImageUrl,
  channelLabel,
  isApprover,
  replaceMessage,
  replyPrivately,
  reviewBlocks,
  reviewSummary,
  revisionFormBlocks,
  revisionSentBlocks,
  siteUrl,
  skippedBlocks,
  toReviewPost,
  verifySlackRequest,
  type ReviewPost,
  type SlackBlock,
} from "@/lib/social/slackReview";

/**
 * Where the buttons in #kipp land.
 *
 * Approving a post used to mean leaving Slack for the dashboard, finding
 * the post on the calendar, and pressing the one button on it that was
 * worth pressing. Everything needed to make the decision was already in
 * the Slack message. This is the button, on the message.
 *
 * Three things guard it, because the URL itself is public:
 *
 *   The Slack signature, over the raw body and a timestamp no more than
 *   five minutes old. Without a signing secret nothing is accepted at all.
 *
 *   The approver list, when there is one. Unset means anyone in the
 *   channel, which is the honest default while the channel is one person.
 *
 *   The post id travels in the button, not in anything the presser can
 *   type, so a press can only ever act on a post that was put here.
 *
 * The work happens after the response. Slack gives an interaction three
 * seconds before it shows a timeout, and rendering a card and putting it
 * in the bucket takes longer than that, so the reply is immediate and the
 * message is rewritten over response_url when the work is done.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TZ = process.env.SOCIAL_DAILY_TZ || "America/New_York";

function todayIn(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function service(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function loadPost(supabase: SupabaseClient, id: string): Promise<ReviewPost | null> {
  const { data } = await supabase.from("social_posts").select(REVIEW_POST_SELECT).eq("id", id).maybeSingle();
  if (!data) return null;
  return toReviewPost(data as unknown as Record<string, unknown>);
}

/**
 * The picture for a post. A draft draws live from the spec so a rewritten card
 * is the card you see; an approved post uses the published file. The rule lives
 * in slackReview.ts so the dispatch route and this one cannot disagree.
 */
function cardUrl(post: ReviewPost): string | null {
  return cardImageUrl(post, siteUrl());
}

// ---------------------------------------------------------------------
// Answering in the response itself
//
// Slack treats a message payload in the HTTP response to an interaction
// as the new message, and it applies the moment the request returns.
// That matters more than it sounds: work done after the response instead
// depends on the runtime keeping the function alive AND on a second call
// to response_url being accepted, and when either of those fails the
// person who pressed the button sees nothing at all.
//
// So only the slow path defers. Everything a button does here is one read
// or one update, which is well inside the three seconds Slack allows, and
// answering inline means a press can no longer fail silently: either the
// message changes, or Slack shows the presser an error.
// ---------------------------------------------------------------------

function rewrite(blocks: SlackBlock[], text: string): Response {
  return Response.json({
    replace_original: true,
    text,
    blocks,
    unfurl_links: false,
    unfurl_media: false,
  });
}

/** Seen by one person, left behind in nobody's channel. */
function ephemeral(text: string): Response {
  return Response.json({ response_type: "ephemeral", replace_original: false, text });
}

// ---------------------------------------------------------------------
// The four answers
// ---------------------------------------------------------------------

async function handleApprove(supabase: SupabaseClient, postId: string, responseUrl: string, who: string) {
  const post = await loadPost(supabase, postId);
  if (!post) {
    await replyPrivately(responseUrl, "That post is no longer on the calendar.");
    return;
  }

  const result = await publishPost(supabase, postId, who);
  if (result.error) {
    // The message is left exactly as it was, buttons and all, because the
    // post was not approved and the next thing to happen is another press.
    await replyPrivately(responseUrl, `That did not go through: ${result.error}`);
    return;
  }

  const fresh = (await loadPost(supabase, postId)) || post;
  await replaceMessage(
    responseUrl,
    approvedBlocks(fresh, cardUrl(fresh), who, todayIn(TZ)),
    `Approved: ${channelLabel(fresh.channel)}`
  );
}

async function handleReviseForm(supabase: SupabaseClient, postId: string): Promise<Response> {
  const post = await loadPost(supabase, postId);
  if (!post) return ephemeral("That post is no longer on the calendar.");

  return rewrite(revisionFormBlocks(post, cardUrl(post)), "What should change?");
}

async function handleRevisionSend(
  supabase: SupabaseClient,
  postId: string,
  who: string,
  note: string
): Promise<Response> {
  const post = await loadPost(supabase, postId);
  if (!post) return ephemeral("That post is no longer on the calendar.");

  const { error } = await supabase
    .from("social_posts")
    .update({
      status: "draft",
      revision_note: note.slice(0, 1000),
      revision_requested_at: new Date().toISOString(),
      reviewed_by: who,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) return ephemeral(`That did not save: ${error.message}`);

  return rewrite(revisionSentBlocks(post, note, who), "Sent back for a rewrite");
}

async function handleSkip(supabase: SupabaseClient, postId: string, who: string): Promise<Response> {
  const post = await loadPost(supabase, postId);
  if (!post) return ephemeral("That post is no longer on the calendar.");

  const { error } = await supabase
    .from("social_posts")
    .update({ status: "skipped", reviewed_by: who, reviewed_at: new Date().toISOString() })
    .eq("id", postId);

  if (error) return ephemeral(`That did not save: ${error.message}`);

  return rewrite(skippedBlocks(post, who), "Skipped");
}

// ---------------------------------------------------------------------

export async function POST(request: Request) {
  const raw = await request.text();

  // A missing signing secret and a forged request both come out of the check
  // below as 401, and from Slack both look like a button that does nothing.
  // They are not the same problem, and the first one is silent for as long as
  // nobody presses a button and says so — which is how a whole feature can be
  // live, drawn on every message, and wired to nothing.
  if (!process.env.SLACK_SIGNING_SECRET) {
    console.error(
      "Slack interactions: SLACK_SIGNING_SECRET is not set on this deployment. " +
        "Every press will be rejected. See .agents/social-calendar.md, 'Setting it up'."
    );
  }

  if (
    !verifySlackRequest(
      raw,
      request.headers.get("x-slack-signature"),
      request.headers.get("x-slack-request-timestamp")
    )
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(new URLSearchParams(raw).get("payload") || "{}");
  } catch {
    return new Response(null, { status: 200 });
  }

  if (payload.type !== "block_actions") return new Response(null, { status: 200 });

  const actions = (payload.actions || []) as Array<{ action_id?: string; value?: string }>;
  const action = actions[0];
  const responseUrl = payload.response_url as string | undefined;
  const user = (payload.user || {}) as { id?: string; name?: string; username?: string };
  const who = user.name || user.username || user.id || "someone";
  const postId = action?.value;

  if (!action?.action_id || !responseUrl || !postId) return new Response(null, { status: 200 });

  if (!isApprover(user.id)) {
    return ephemeral("Approving a post is not something your account can do here.");
  }

  const supabase = service();
  if (!supabase) {
    console.error("Slack interactions: missing platform credentials.");
    return ephemeral("This is not wired up to the calendar yet.");
  }

  // The note lives in the message's own input block, and arrives on the
  // press of the button beside it rather than on every keystroke.
  const state = (payload.state || {}) as {
    values?: Record<string, Record<string, { value?: string }>>;
  };
  const note = state.values?.[BLOCK_REVISION_INPUT]?.[ACTION_REVISION_NOTE]?.value?.trim() || "";

  switch (action.action_id) {
    case ACTION_REVISE:
      return handleReviseForm(supabase, postId);

    case ACTION_REVISION_SEND:
      // Nothing to act on, so the form stays open rather than closing on an
      // empty answer that would read as a rewrite request for nothing.
      if (!note) return ephemeral("Say what should change, then press Send it back again.");
      return handleRevisionSend(supabase, postId, who, note);

    case ACTION_SKIP:
      return handleSkip(supabase, postId, who);

    case ACTION_APPROVE: {
      // The only press that cannot answer inline. Drawing the card and
      // putting it in the bucket takes longer than Slack waits, so the
      // message says so immediately and is rewritten when the work lands.
      // Saying it here rather than after the response is also what stops a
      // second press arriving while the first is still rendering.
      const post = await loadPost(supabase, postId);
      if (!post) return ephemeral("That post is no longer on the calendar.");

      after(handleApprove(supabase, postId, responseUrl, who));
      return rewrite(
        [
          ...approvedBlocks(post, cardUrl(post), who, todayIn(TZ)).slice(1),
          { type: "context", elements: [{ type: "mrkdwn", text: "Publishing the card…" }] },
        ],
        `Approving: ${channelLabel(post.channel)}`
      );
    }

    default:
      // A press this build does not know about, which means an old message
      // and a redeploy. Put the question back rather than leaving a button
      // that answers nothing.
      return handleUnknown(supabase, postId);
  }
}

async function handleUnknown(supabase: SupabaseClient, postId: string): Promise<Response> {
  const post = await loadPost(supabase, postId);
  if (!post) return ephemeral("That post is no longer on the calendar.");
  return rewrite(reviewBlocks(post, cardUrl(post), todayIn(TZ)), reviewSummary(post, todayIn(TZ)));
}
