import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Approving a post from Slack.
 *
 * The morning message already carried everything needed to decide: the
 * channel, the words, the link, the card, and the note saying why the
 * post exists. What it did not carry was a way to say yes. So approving
 * meant opening the dashboard, finding the post, and clicking the button
 * that was the only thing there worth clicking.
 *
 * This module is the message that has the button on it. It builds the
 * four shapes a review can be in, verifies that a press really came from
 * Slack, and mints the short-lived address Slack fetches the picture
 * from.
 *
 * Two things it deliberately does not do:
 *
 *   It writes no PNG. A draft's card has never been rendered to a file
 *   and must not be, because a file at a public address is the thing an
 *   approval is *for*. The review message points at a signed renderer
 *   instead, which draws the card on the way past and stores nothing.
 *
 *   It approves nothing by itself. Every block below is either asking a
 *   person a question or reporting the answer they gave.
 */

// ---------------------------------------------------------------------
// The shape of a post under review
// ---------------------------------------------------------------------

export interface ReviewAsset {
  id: string;
  title: string | null;
  public_url: string | null;
  spec: unknown;
}

export interface ReviewPost {
  id: string;
  scheduled_for: string;
  channel: string;
  kind: string | null;
  caption: string | null;
  link_url: string | null;
  note: string | null;
  alt_text: string | null;
  set_id: string | null;
  source: string | null;
  status: string;
  revision_note?: string | null;
  asset?: ReviewAsset | null;
  campaign?: { name: string | null } | null;
}

export type SlackBlock = Record<string, unknown>;

/**
 * Everything the message needs, in one read. Both the route that asks the
 * question and the route that records the answer select this, so the post
 * cannot be shown one way before a press and another way after it.
 */
export const REVIEW_POST_SELECT =
  "id,scheduled_for,channel,kind,caption,link_url,note,alt_text,set_id,source,status,revision_note," +
  "asset:social_image_assets(id,title,public_url,spec)," +
  "campaign:social_campaigns(name)";

/**
 * PostgREST returns an embedded one-to-one as an object, and the generated
 * types widen it to an array. Narrow it once here rather than at every use.
 */
export function toReviewPost(row: Record<string, unknown>): ReviewPost {
  const asset = row.asset;
  const campaign = row.campaign;
  return {
    ...(row as unknown as ReviewPost),
    asset: (Array.isArray(asset) ? asset[0] : asset) || null,
    campaign: (Array.isArray(campaign) ? campaign[0] : campaign) || null,
  };
}

export const ACTION_APPROVE = "social_review_approve";
export const ACTION_REVISE = "social_review_revise";
export const ACTION_SKIP = "social_review_skip";
export const ACTION_REVISION_NOTE = "social_review_note";
export const ACTION_REVISION_SEND = "social_review_note_send";
export const BLOCK_REVISION_INPUT = "social_review_note_block";

// ---------------------------------------------------------------------
// Signing the preview address
//
// The renderer at /api/social/render is signed-in only, and rightly: an
// open renderer is an open invitation to put someone else's words on an
// ABRAM card and hotlink it. Slack is not signed in, so it gets its own
// door: one asset, an expiry, and a signature over both. Nothing about
// the card travels in the URL, so the address cannot be edited into a
// card for something else.
// ---------------------------------------------------------------------

function previewSecret(): string | null {
  return process.env.SOCIAL_PREVIEW_SECRET || process.env.SLACK_SIGNING_SECRET || null;
}

/** Fourteen days. Long enough that a message left unread over a holiday still shows its picture. */
const PREVIEW_TTL_SECONDS = 14 * 24 * 60 * 60;

function previewSignature(assetId: string, expiresAt: number, secret: string): string {
  // Domain separated, so this signature can never be replayed as one of
  // Slack's own even though it may be cut from the same secret.
  return createHmac("sha256", secret).update(`social-preview:v1:${assetId}:${expiresAt}`).digest("hex");
}

/**
 * The address Slack fetches a draft's card from, or null when the feature
 * has no secret to sign with.
 */
export function previewUrl(assetId: string, siteUrl: string): string | null {
  const secret = previewSecret();
  if (!secret) return null;

  const expiresAt = Math.floor(Date.now() / 1000) + PREVIEW_TTL_SECONDS;
  const signature = previewSignature(assetId, expiresAt, secret);
  return `${siteUrl.replace(/\/$/, "")}/api/social/preview/${assetId}?e=${expiresAt}&t=${signature}`;
}

/**
 * The picture to put on a post's message.
 *
 * A published card keeps its PNG at `cards/<asset-id>.png` and its address in
 * `public_url` forever, and re-approving overwrites that path in place. That is
 * right for an approved post and wrong for one still under review: after a
 * revision KIPP edits the card's `spec`, the PNG at that address is still last
 * week's picture, and a message built from `public_url` shows the old graphic
 * beside the new caption. Which reads, correctly, as the revision being ignored.
 *
 * So a draft always renders live from the spec, and only a post that has been
 * approved (`ready`/`posted`) uses the published file — which by then is the
 * file that was rendered from the spec being shown.
 */
export function cardImageUrl(post: ReviewPost, siteUrlValue: string): string | null {
  if (!post.asset) return null;
  const live = previewUrl(post.asset.id, siteUrlValue);
  if (post.status === "ready" || post.status === "posted") {
    return post.asset.public_url || live;
  }
  return live || post.asset.public_url;
}

export function verifyPreviewToken(assetId: string, expiresAt: string | null, token: string | null): boolean {
  const secret = previewSecret();
  if (!secret || !expiresAt || !token) return false;

  const expiry = Number(expiresAt);
  if (!Number.isFinite(expiry) || expiry * 1000 < Date.now()) return false;

  return safeEqual(previewSignature(assetId, expiry, secret), token);
}

// ---------------------------------------------------------------------
// Verifying that a press came from Slack
// ---------------------------------------------------------------------

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  // timingSafeEqual throws on a length mismatch rather than returning
  // false, and a thrown comparison is a 500 where a rejection belongs.
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Slack signs every interaction with the app's signing secret. Without
 * this check the endpoint is a public URL that publishes cards, so a
 * missing secret rejects rather than waves through.
 *
 * The five minute window is Slack's own recommendation and is what stops
 * a captured payload being replayed later.
 */
export function verifySlackRequest(rawBody: string, signature: string | null, timestamp: string | null): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret || !signature || !timestamp) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > 60 * 5) return false;

  const expected = `v0=${createHmac("sha256", secret).update(`v0:${timestamp}:${rawBody}`).digest("hex")}`;
  return safeEqual(expected, signature);
}

/**
 * Who is allowed to answer.
 *
 * Unset means anyone whose press passes the signature check, which is
 * anyone in the channel. That is the honest default: the drafts and the
 * cards are already visible to everyone in #kipp, so the button grants no
 * sight of anything the channel did not already have. Set
 * SLACK_APPROVER_IDS once more than one person is in there.
 */
export function isApprover(slackUserId: string | undefined): boolean {
  const allowed = (process.env.SLACK_APPROVER_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (allowed.length === 0) return true;
  return Boolean(slackUserId) && allowed.includes(slackUserId as string);
}

// ---------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------

export function channelLabel(channel: string): string {
  const known: Record<string, string> = {
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

/** "Tuesday, August 11". The date is read at a glance and never parsed. */
export function humanDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** Whether the day is today, tomorrow, or further off, in the calendar's own zone. */
export function relativeDay(iso: string, todayISO: string): string {
  if (iso.slice(0, 10) === todayISO) return "today";
  const [y, m, d] = todayISO.split("-").map(Number);
  const tomorrow = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
  if (iso.slice(0, 10) === tomorrow) return "tomorrow";
  return humanDate(iso);
}

// ---------------------------------------------------------------------
// The message
// ---------------------------------------------------------------------

function section(text: string): SlackBlock {
  return { type: "section", text: { type: "mrkdwn", text } };
}

function context(text: string): SlackBlock {
  return { type: "context", elements: [{ type: "mrkdwn", text }] };
}

function heading(post: ReviewPost): string {
  const parts = [`*${channelLabel(post.channel)}*`];
  if (post.campaign?.name) parts.push(`_${post.campaign.name}_`);
  // What the post is for. A product post and a post about the craft are
  // read differently by whoever is deciding, and on a week where three
  // arrive in a row it is the fastest way to see the drift.
  if (post.kind && post.kind !== "product") parts.push(`· ${post.kind}`);
  if (post.source === "kipp") parts.push("· drafted by KIPP");
  return parts.join("  ");
}

/**
 * The post itself: the words, the link, the credit, the picture, the note.
 *
 * Shared by the question and the answer so that approving a post does not
 * visibly rearrange it. The only difference is where the picture comes
 * from, and after an approval that is the published card at the address
 * anyone can paste.
 */
function postBody(post: ReviewPost, imageUrl: string | null): SlackBlock[] {
  const blocks: SlackBlock[] = [section(heading(post))];

  if (post.caption?.trim()) {
    // Slack renders 3000 characters in a section and truncates past it
    // silently, which would be the one failure nobody would notice.
    const caption = post.caption.length > 2800 ? `${post.caption.slice(0, 2800)}…` : post.caption;
    blocks.push(section(caption));
  }

  // Bare, not a <url|label> link. The point is to select it and paste it,
  // and a labelled link hands you the label instead of the URL.
  if (post.link_url) blocks.push(section(post.link_url));

  const spec = (post.asset?.spec || {}) as { backdropCredit?: string };
  if (spec.backdropCredit) {
    blocks.push(section(`Photo by ${spec.backdropCredit}`));
    blocks.push(context("Paste that in and tag them. The card credits them too."));
  }

  if (imageUrl) {
    blocks.push({
      type: "image",
      image_url: imageUrl,
      alt_text: post.alt_text || post.asset?.title || "Post card",
    });
    if (post.set_id) {
      blocks.push(context("Carousel. Slide one shown, download the set in Social Studio, Calendar."));
    }
  } else if (post.asset) {
    blocks.push(context("The card for this post could not be drawn here. Open it in Social Studio, Calendar."));
  }

  if (post.note) blocks.push(context(post.note));

  return blocks;
}

/**
 * The question. One post, everything needed to answer it, and three ways
 * to answer.
 *
 * Approve is the only primary button. Sending a post back and skipping it
 * are both ordinary outcomes, but a row of three equally weighted buttons
 * is a row where the common one has to be looked for.
 */
export function reviewBlocks(post: ReviewPost, imageUrl: string | null, todayISO: string): SlackBlock[] {
  const when = relativeDay(post.scheduled_for, todayISO);
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `Approve for ${when}`, emoji: true },
    },
  ];

  if (post.revision_note) {
    blocks.push(context(`Rewritten after: “${post.revision_note}”`));
  }

  blocks.push(...postBody(post, imageUrl));

  blocks.push({
    type: "actions",
    block_id: `review:${post.id}`,
    elements: [
      {
        type: "button",
        style: "primary",
        action_id: ACTION_APPROVE,
        text: { type: "plain_text", text: "Approve", emoji: false },
        value: post.id,
      },
      {
        type: "button",
        action_id: ACTION_REVISE,
        text: { type: "plain_text", text: "Ask for a revision", emoji: false },
        value: post.id,
      },
      {
        type: "button",
        action_id: ACTION_SKIP,
        text: { type: "plain_text", text: "Skip the day", emoji: false },
        value: post.id,
        // A skip cannot be undone from Slack, and it is next to the button
        // that is pressed every day.
        confirm: {
          title: { type: "plain_text", text: "Skip this post" },
          text: {
            type: "mrkdwn",
            text: "Nothing goes out on this channel that day, and the gap is recorded as deliberate. Put it back on the calendar in Social Studio.",
          },
          confirm: { type: "plain_text", text: "Skip it" },
          deny: { type: "plain_text", text: "Keep it" },
        },
      },
    ],
  });

  blocks.push(
    context("Approving publishes the card and puts the post in the morning pack on its day. Nothing posts by itself.")
  );

  return blocks;
}

/**
 * The answer, when the answer was yes.
 *
 * The same post, minus the buttons, with the published card in place of
 * the drawn one. It is deliberately still the whole packet: on a post
 * scheduled for today this message is the one that gets pasted, and
 * stripping it back to "Approved" would mean going and finding the words
 * again.
 */
export function approvedBlocks(post: ReviewPost, imageUrl: string | null, who: string, todayISO: string): SlackBlock[] {
  const when = relativeDay(post.scheduled_for, todayISO);
  return [
    context(`Approved by ${who}. ${when === "today" ? "Ready to post now." : `Goes out ${when}.`}`),
    ...postBody(post, imageUrl),
  ];
}

/** The form that opens where the buttons were. */
export function revisionFormBlocks(post: ReviewPost, imageUrl: string | null): SlackBlock[] {
  return [
    { type: "header", text: { type: "plain_text", text: "What should change?", emoji: true } },
    ...postBody(post, imageUrl),
    {
      type: "input",
      block_id: BLOCK_REVISION_INPUT,
      label: { type: "plain_text", text: "In your words" },
      element: {
        type: "plain_text_input",
        action_id: ACTION_REVISION_NOTE,
        multiline: true,
        max_length: 1000,
        placeholder: { type: "plain_text", text: "Too much about us. Lead with the mapping." },
      },
    },
    {
      type: "actions",
      block_id: `revise:${post.id}`,
      elements: [
        {
          type: "button",
          style: "primary",
          action_id: ACTION_REVISION_SEND,
          text: { type: "plain_text", text: "Send it back", emoji: false },
          value: post.id,
        },
      ],
    },
    context("KIPP reads this on its next run and rewrites the post. It comes back here for approval."),
  ];
}

export function revisionSentBlocks(post: ReviewPost, note: string, who: string): SlackBlock[] {
  return [
    section(`*${channelLabel(post.channel)}* · sent back for a rewrite`),
    section(`“${note}”`),
    context(`${who}, for ${humanDate(post.scheduled_for)}. KIPP picks this up on its next run.`),
  ];
}

export function skippedBlocks(post: ReviewPost, who: string): SlackBlock[] {
  return [
    section(`*${channelLabel(post.channel)}* · skipped for ${humanDate(post.scheduled_for)}`),
    context(`${who}. The gap is recorded as deliberate. Put it back in Social Studio, Calendar.`),
  ];
}

/** The notification line, and the fallback anywhere blocks do not render. */
export function reviewSummary(post: ReviewPost, todayISO: string): string {
  return `Approve ${channelLabel(post.channel)} for ${relativeDay(post.scheduled_for, todayISO)}`;
}

// ---------------------------------------------------------------------
// Talking to Slack
// ---------------------------------------------------------------------

export function webhookUrl(): string | null {
  return (
    process.env.SLACK_WEBHOOK_URL_KIPP ||
    process.env.SLACK_TRIAGE_WEBHOOK_URL ||
    process.env.SLACK_WEBHOOK_URL ||
    null
  );
}

/**
 * The public address of this site, which the preview URL has to be
 * absolute against because Slack fetches it from its own servers.
 */
export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    "https://abram.network"
  );
}

export async function postToSlack(payload: Record<string, unknown>): Promise<void> {
  const url = webhookUrl();
  if (!url) throw new Error("No #kipp webhook is configured.");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Slack rejected the message (${response.status}): ${await response.text()}`);
  }
}

/**
 * Rewrite the message the button was on.
 *
 * response_url is what makes this work without a bot token: Slack hands
 * it over with every interaction and it edits that one message in place
 * for thirty minutes. One less credential to hold is worth more here than
 * anything chat.update would add.
 */
export async function replaceMessage(
  responseUrl: string,
  blocks: SlackBlock[],
  text: string
): Promise<void> {
  const response = await fetch(responseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      replace_original: true,
      text,
      blocks,
      unfurl_links: false,
      unfurl_media: false,
    }),
  });

  // Slack answers a rejected block payload with 200 and an error in the
  // body, so the status alone says nothing. Left unlogged, a malformed
  // block would leave the message frozen with its buttons still on it and
  // nothing anywhere saying why.
  const body = await response.text().catch(() => "");
  if (!response.ok || (body && body !== "ok")) {
    console.error(`Slack review: the message was not replaced (${response.status}): ${body}`);
  }
}

/** Say something to one person, in the channel, without leaving it behind. */
export async function replyPrivately(responseUrl: string, text: string): Promise<void> {
  await fetch(responseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ response_type: "ephemeral", replace_original: false, text }),
  });
}
