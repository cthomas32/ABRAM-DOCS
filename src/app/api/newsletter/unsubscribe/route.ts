/**
 * Getting off the list.
 *
 * The whole design turns on one fact about email: **links in an inbox get
 * fetched by machines.** Corporate scanners, spam filters and link previews
 * all issue a GET the moment a message arrives, and a GET that unsubscribes
 * would quietly empty the list without a single person clicking anything.
 *
 * So GET only asks. It renders a page with one button on it, and the button
 * posts. The state change lives entirely in POST.
 *
 * The exception is one-click, RFC 8058. Gmail and Yahoo require bulk senders
 * to honour an unsubscribe header, and they send a POST with a form body of
 * `List-Unsubscribe=One-Click` when the reader presses their own button
 * rather than ours. That is a POST, so it lands in the right handler
 * already; it just answers with text instead of a page, because there is no
 * browser on the other end.
 *
 * Nothing here requires a session. The token is the authorisation, and
 * demanding a login to leave a mailing list is the kind of thing that earns
 * a spam complaint instead of an unsubscribe.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  APPLICATION_SEGMENT_ID,
  MARKETING_SEGMENT_ID,
  createServiceClient,
} from "@/utils/resend";
import { readUnsubscribeToken } from "@/lib/funnel/unsubscribeToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  The pages                                                          */
/* ------------------------------------------------------------------ */

/**
 * Deliberately one self-contained document with inline styles.
 *
 * This is the one page in the system a person reaches while annoyed with
 * us. It should render instantly, on any client, with no stylesheet, no
 * font, no script and no navigation back into marketing.
 */
function page(title: string, body: string, status = 200): NextResponse {
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${title}</title></head>
<body style="margin:0;background:#09090b;color:#e4e4e7;font-family:Helvetica,Arial,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px">
<div style="max-width:420px;width:100%;text-align:center">
<img src="https://abram.network/brand/lockup-white.png" alt="ABRAM" width="104" style="display:block;margin:0 auto 28px;height:auto;border:0">
${body}
</div></body></html>`;
  return new NextResponse(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

const HEADING = "margin:0 0 12px;font-size:19px;font-weight:600;color:#fafafa";
const BODY = "margin:0 0 24px;font-size:14px;line-height:1.65;color:#a1a1aa";
const QUIET = "margin:0;font-size:13px;color:#71717a";

/* ------------------------------------------------------------------ */
/*  GET — asks, changes nothing                                        */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  const email = readUnsubscribeToken(request.nextUrl.searchParams.get("token"));

  if (!email) {
    return page(
      "Link not recognised",
      `<h1 style="${HEADING}">This link is not one of ours</h1>
       <p style="${BODY}">It may have been altered on the way here, or it may be from an older address. Reply to any note from us and we will take you off by hand.</p>`,
      400,
    );
  }

  const token = request.nextUrl.searchParams.get("token") ?? "";

  return page(
    "Unsubscribe",
    `<h1 style="${HEADING}">Unsubscribe ${escapeHtml(email)}?</h1>
     <p style="${BODY}">You will stop receiving anything from ABRAM. You can sign up again at any time.</p>
     <form method="post" action="/api/newsletter/unsubscribe">
       <input type="hidden" name="token" value="${escapeHtml(token)}">
       <button type="submit" style="min-height:44px;padding:12px 26px;border-radius:999px;border:1px solid rgba(255,255,255,0.14);background:#fafafa;color:#09090b;font-size:14px;font-weight:600;cursor:pointer">Yes, unsubscribe me</button>
     </form>
     <p style="${QUIET};margin-top:22px">Landed here by accident? Close this page and nothing changes.</p>`,
  );
}

/* ------------------------------------------------------------------ */
/*  POST — the only thing that changes anything                        */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  /* The token arrives in the form body from our own page, and in the query
     string from a mail client pressing its own button. Both are accepted. */
  let token = request.nextUrl.searchParams.get("token");
  let oneClick = false;

  try {
    const form = await request.formData();
    const fromBody = form.get("token");
    if (typeof fromBody === "string" && fromBody) token = fromBody;
    oneClick = String(form.get("List-Unsubscribe") ?? "") === "One-Click";
  } catch {
    /* No body, or not a form. The query string may still carry the token. */
  }

  const email = readUnsubscribeToken(token);
  if (!email) {
    return oneClick
      ? new NextResponse("Unrecognised token.", { status: 400 })
      : page(
          "Link not recognised",
          `<h1 style="${HEADING}">This link is not one of ours</h1>
           <p style="${BODY}">Reply to any note from us and we will take you off by hand.</p>`,
          400,
        );
  }

  const removed = await unsubscribe(email);

  /* A failure is reported honestly rather than shown as success. Telling
     somebody they are off the list while they are still on it is how a
     complaint becomes a report to the mailbox provider. */
  if (!removed) {
    return oneClick
      ? new NextResponse("Could not unsubscribe.", { status: 500 })
      : page(
          "Something went wrong",
          `<h1 style="${HEADING}">That did not go through</h1>
           <p style="${BODY}">Try the link again in a minute. If it still fails, reply to any note from us and we will take ${escapeHtml(email)} off by hand — that always works.</p>`,
          500,
        );
  }

  if (oneClick) return new NextResponse("Unsubscribed.", { status: 200 });

  return page(
    "Unsubscribed",
    `<h1 style="${HEADING}">Done — you are off the list</h1>
     <p style="${BODY}">${escapeHtml(email)} will not hear from us again. Nothing else is deleted, and you can sign up again whenever you like.</p>
     <p style="${QUIET}"><a href="https://abram.network" style="color:#a1a1aa">abram.network</a></p>`,
  );
}

/* ------------------------------------------------------------------ */
/*  The change itself                                                  */
/* ------------------------------------------------------------------ */

/**
 * Off the local list first, then out of the audience.
 *
 * Order matters. The local row is what every send in this repository reads,
 * so clearing it stops mail immediately even if the second half fails. The
 * audience call is the one that can fail on a network, and a contact left
 * in a Resend audience with `is_marketing_list` false locally is recoverable
 * by the existing sync; the reverse is somebody still getting mail.
 */
async function unsubscribe(email: string): Promise<boolean> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("subscribers")
    .update({
      status: "unsubscribed",
      is_marketing_list: false,
      is_application_list: false,
      updated_at: new Date().toISOString(),
    })
    .eq("email", email);

  if (error) {
    console.error(`Unsubscribe: could not update ${email}:`, error.message);
    return false;
  }

  await removeFromAudiences(email);
  return true;
}

/** Best effort. A failure here is logged and reconciled by the contact sync. */
async function removeFromAudiences(email: string) {
  const apiKey = process.env.RESEND_MARKETING_API_KEY || process.env.RESEND_API_KEY;
  if (!apiKey) return;

  /* The same two ids the signup writes to, imported rather than read from
     the environment again. Both carry a hardcoded fallback in that file, so
     reading the env vars here would find nothing and silently skip the
     removal on any deploy that relies on the fallback. */
  const audiences = [MARKETING_SEGMENT_ID, APPLICATION_SEGMENT_ID].filter(Boolean);

  for (const audienceId of audiences) {
    try {
      const response = await fetch(
        `https://api.resend.com/audiences/${audienceId}/contacts/${encodeURIComponent(email)}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ unsubscribed: true }),
        },
      );
      if (!response.ok) {
        console.error(
          `Unsubscribe: audience ${audienceId} did not accept ${email} (${response.status}).`,
        );
      }
    } catch (err) {
      console.error(`Unsubscribe: audience ${audienceId} unreachable for ${email}:`, err);
    }
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
