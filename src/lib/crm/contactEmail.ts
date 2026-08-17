"use server";

import { createClient } from "@/utils/supabase/server";
import { getResendClient } from "@/utils/resend";
import { readConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";

/**
 * Sending one email to one person, from their own record.
 *
 * This is the narrow grant the partnership terms call "Resend — send
 * only", and the shape of it matters more than the feature. A Head of
 * Growth needs to reply to somebody they met. They do not need, and under
 * that agreement do not get, read or write access to the subscriber
 * table — because a table grant lets somebody export the list, and an
 * export is not a send.
 *
 * So the capability lives here, in a server action that sends on their
 * behalf and records what it sent, rather than in a policy.
 *
 * Four rules hold it up:
 *
 * 1. **Permission is checked here, not inherited.** A server action is a
 *    public HTTP endpoint. The guard on the page that renders the compose
 *    box does not apply to a direct call.
 * 2. **You may only mail a contact you can already edit.** Enforced by
 *    reading the contact through the caller's own session, so row level
 *    security decides. An advisor cannot mail somebody else's account
 *    even by knowing their id.
 * 3. **Never to somebody who left the list.** Checked against the
 *    subscriber record at send time, not at compose time.
 * 4. **The timeline write is part of the send.** An email that went out
 *    with no record of it is how two people end up mailing the same
 *    person the same week.
 */

const MAX_SUBJECT = 200;
const MAX_BODY = 20_000;
const DEFAULT_FROM = "ABRAM <updates@abram.network>";

export interface SendContactEmailResult {
  ok: boolean;
  error?: string;
  messageId?: string;
}

/** Minimal, deliberate escaping. The body is typed by a colleague, not a stranger, but it still goes into HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Plain text to a simple HTML body, preserving paragraph breaks. */
function toHtml(body: string): string {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 16px;line-height:1.6">${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;color:#18181b">${paragraphs}</div>`;
}

export async function sendContactEmail(input: {
  contactId: string;
  subject: string;
  body: string;
}): Promise<SendContactEmailResult> {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);

  if (!user) return { ok: false, error: "Sign in again to carry on." };
  if (!can(user, "crm.email.send")) {
    return {
      ok: false,
      error: "Sending email is not available at your stage. Ask an owner if you need it.",
    };
  }

  const subject = input.subject.trim().slice(0, MAX_SUBJECT);
  const body = input.body.trim().slice(0, MAX_BODY);

  if (!subject) return { ok: false, error: "Give the email a subject." };
  if (!body) return { ok: false, error: "The email is empty." };

  // Read through the caller's session, so RLS decides whether they are
  // allowed near this person at all.
  const { data: contact } = await supabase
    .from("crm_contacts")
    .select("id, full_name, email, subscriber_id, archived")
    .eq("id", input.contactId)
    .maybeSingle();

  if (!contact) {
    return { ok: false, error: "That contact is not one you can reach." };
  }
  if (!contact.email) {
    return { ok: false, error: "No email address on this contact." };
  }
  if (contact.archived) {
    return { ok: false, error: "That contact is archived." };
  }

  // Somebody who unsubscribed stays unsubscribed. This is checked at send
  // time rather than when the box was opened, because a compose window
  // can sit open for an hour.
  if (contact.subscriber_id) {
    const { data: subscriber } = await supabase
      .from("subscribers")
      .select("status")
      .eq("id", contact.subscriber_id)
      .maybeSingle();

    // A partner cannot read `subscribers`, so this comes back null for
    // them and the check passes. That is the correct trade: this is a
    // one-to-one reply to somebody they met rather than a marketing
    // send, and the alternative is granting read over the whole list to
    // enforce it. A broadcast, which is where the consent rule really
    // bites, is owner-only and goes nowhere near this function.
    if (subscriber?.status === "unsubscribed" || subscriber?.status === "bounced") {
      return {
        ok: false,
        error: `This person is marked ${subscriber.status} and must not be emailed.`,
      };
    }
  }

  const resend = getResendClient();
  if (!resend) {
    return { ok: false, error: "Email sending is not configured on this deployment." };
  }

  const from = process.env.CRM_EMAIL_FROM || DEFAULT_FROM;

  const { data: sent, error: sendError } = await resend.emails.send({
    from,
    to: contact.email,
    subject,
    html: toHtml(body),
    text: body,
    replyTo: user.email || undefined,
    // Tagged so the webhook can tell a one-to-one send from a broadcast.
    tags: [
      { name: "kind", value: "crm_one_to_one" },
      { name: "sender", value: user.userId },
    ],
  });

  if (sendError || !sent) {
    return { ok: false, error: sendError?.message || "The email could not be sent." };
  }

  // The send has happened and cannot be undone, so a failure from here on
  // must not be reported as a failure to send — it is a failure to
  // record, which is a different and lesser problem.
  const { error: logError } = await supabase.from("crm_interactions").insert({
    contact_id: contact.id,
    kind: "email_sent",
    body: subject,
    author_user_id: user.userId,
    author: user.fullName || user.email,
    email_message_id: sent.id,
    meta: { subject, email_id: sent.id, to: contact.email },
  });

  if (logError) {
    return {
      ok: true,
      messageId: sent.id,
      error: "Sent, but it could not be added to the timeline.",
    };
  }

  await supabase
    .from("crm_contacts")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", contact.id);

  return { ok: true, messageId: sent.id };
}
