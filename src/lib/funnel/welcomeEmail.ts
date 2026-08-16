/**
 * The first email anybody gets from us.
 *
 * Somebody types their address into a form on the site and a note arrives a
 * moment later. That is the whole feature, and four rules hold it up:
 *
 * 1. **It never fails the signup.** Nothing in this file throws. A signup
 *    that succeeded and a welcome that did not is a person on the list
 *    without a note; a signup that threw because the mail service was down
 *    is a person we lost. The first is recoverable and the second is not.
 * 2. **It sends once.** `subscribers.welcome_email_sent_at` is the guard,
 *    and the write that claims it is conditional on the column still being
 *    null. Two requests racing — a double submit, a retry, the sync running
 *    at the same moment — both read null and both would send otherwise.
 *    Claiming the row *before* sending is what makes the race safe.
 * 3. **No unsubscribe link, no send.** A marketing email without a working
 *    way off the list is a legal problem and a deliverability one. If the
 *    link cannot be signed, this returns false and mails nobody.
 * 4. **The copy is editable without a deploy**, through the same store and
 *    the same fallbacks as the conference follow up. A saved edit that will
 *    not render loses to the copy this build ships with.
 *
 * Column 2 has one consequence worth stating plainly: if the send fails
 * after the claim, that person never gets a welcome. That is the deliberate
 * trade. The alternative — claim it afterwards — sends duplicates under
 * exactly the conditions where mail is already going wrong.
 */

import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  IDENTITY_SELECT,
  resolveIdentity,
  type TeamMemberIdentity,
} from "@/lib/crm/identity";
import type { CrmProfile } from "@/lib/crm/types";
import { firstWordOf } from "@/lib/crm/emailValues";
import {
  NEWSLETTER_WELCOME_KEY,
  SUBSCRIBER_VARIABLE_NAMES,
  crmEmailProblem,
  defaultCrmEmailContent,
  renderCrmEmail,
  type CrmEmailValues,
} from "@/lib/crm/emailTemplates";
import { loadCrmEmailContent } from "@/lib/crm/emailTemplateStore";
import { unsubscribeUrl } from "./unsubscribeToken";

const DEFAULT_FROM = "ABRAM <hello@abram.network>";

export interface WelcomeEmailInput {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

/**
 * Sends the welcome, once, and says whether it went.
 *
 * The return value is for logging and for the funnel audit. No caller
 * should branch on it in a way that affects the subscriber.
 */
export async function sendWelcomeEmail(
  supabase: SupabaseClient,
  input: WelcomeEmailInput,
): Promise<boolean> {
  try {
    return await send(supabase, input);
  } catch (err) {
    /* The outer net. Rule 1 is absolute and a throw from anywhere in here
       would reach the signup handler. */
    console.error("Welcome email: threw, the subscription is unaffected:", err);
    return false;
  }
}

async function send(supabase: SupabaseClient, input: WelcomeEmailInput): Promise<boolean> {
  const email = input.email.trim().toLowerCase();
  if (!email) return false;

  const apiKey = process.env.RESEND_API_KEY || process.env.RESEND_MARKETING_API_KEY;
  if (!apiKey) {
    console.warn("Welcome email: no mail service configured, skipping.");
    return false;
  }

  /* Rule 3, before anything expensive happens. */
  const unsubscribe = unsubscribeUrl(email);
  if (!unsubscribe) {
    console.error(
      "Welcome email: no unsubscribe link could be signed, so nothing was sent. " +
        "Set NEWSLETTER_UNSUBSCRIBE_SECRET or SUPABASE_SERVICE_ROLE_KEY.",
    );
    return false;
  }

  /* Rule 2. The update is the claim: it only matches while the column is
     still null, so exactly one of two racing callers gets a row back. */
  const claimedAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await supabase
    .from("subscribers")
    .update({ welcome_email_sent_at: claimedAt })
    .eq("email", email)
    .is("welcome_email_sent_at", null)
    .select("email")
    .maybeSingle();

  if (claimError) {
    /* A missing column is the one failure worth naming, because it means
       the migration has not been applied and every signup will land here. */
    if (claimError.message.includes("welcome_email_sent_at")) {
      console.error(
        "Welcome email: subscribers.welcome_email_sent_at is missing, so a send would " +
          "have no duplicate guard. Nothing sent. Apply the migration.",
      );
    } else {
      console.error("Welcome email: could not claim the send:", claimError.message);
    }
    return false;
  }

  if (!claimed) return false; // Already welcomed, or no such subscriber.

  const content = await copy(supabase);
  if (!content) {
    await release(supabase, email);
    return false;
  }

  /* `email` last: it is the normalized form, and the raw one off `input` would
     otherwise win the spread and print a mixed-case address into the note. */
  const values = await welcomeValues(supabase, { ...input, email, unsubscribe });
  const rendered = renderCrmEmail(content, values);

  if (!rendered.subject.trim() || (!rendered.text.trim() && !rendered.html.trim())) {
    console.error("Welcome email: rendered empty, nothing sent.");
    await release(supabase, email);
    return false;
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM,
    to: email,
    subject: rendered.subject,
    ...(rendered.text ? { text: rendered.text } : {}),
    ...(rendered.html ? { html: rendered.html } : {}),
    /* What Gmail and Yahoo look for on bulk mail. The header unsubscribe is
       the one a reader actually finds, and offering it is the difference
       between a click and a spam complaint. */
    headers: {
      "List-Unsubscribe": `<${unsubscribe}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  } as Parameters<Resend["emails"]["send"]>[0]);

  if (result.error) {
    console.error("Welcome email: send failed:", result.error.message);
    await release(supabase, email);
    return false;
  }

  return true;
}

/**
 * Puts the claim back when the send did not happen.
 *
 * Only ever called on a path where nothing was mailed, so it cannot cause a
 * duplicate. A failure to release is logged and left: the cost is one
 * person who never gets a welcome, which the funnel audit will show.
 */
async function release(supabase: SupabaseClient, email: string) {
  const { error } = await supabase
    .from("subscribers")
    .update({ welcome_email_sent_at: null })
    .eq("email", email);
  if (error) {
    console.error(`Welcome email: could not release the claim on ${email}:`, error.message);
  }
}

/** The copy to send: the saved edit if it renders, otherwise what ships. */
async function copy(supabase: SupabaseClient) {
  const builtIn = defaultCrmEmailContent(NEWSLETTER_WELCOME_KEY);
  if (!builtIn) {
    console.error("Welcome email: the template is missing from this build.");
    return null;
  }

  try {
    const loaded = await loadCrmEmailContent(supabase, NEWSLETTER_WELCOME_KEY);
    if (loaded && !crmEmailProblem(loaded.content, SUBSCRIBER_VARIABLE_NAMES)) {
      return loaded.content;
    }
  } catch (err) {
    console.error("Welcome email: reading the saved wording threw, using the original:", err);
  }

  return builtIn;
}

/**
 * What the welcome knows.
 *
 * The sender half comes off the shared team record, the same one the
 * conference follow up signs with, so a job title changed once in the team
 * screen reaches both emails.
 */
async function welcomeValues(
  supabase: SupabaseClient,
  args: { email: string; firstName?: string | null; lastName?: string | null; unsubscribe: string },
): Promise<CrmEmailValues> {
  const full = [args.firstName, args.lastName].filter(Boolean).join(" ").trim();

  let sender = { full_name: "", job_title: "", location: "", email: "" };
  try {
    const { data } = await supabase
      .from("crm_profiles")
      .select(IDENTITY_SELECT)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (data) {
      const identity = resolveIdentity(
        data as unknown as CrmProfile & { member?: TeamMemberIdentity | null },
      );
      sender = {
        full_name: identity.full_name ?? "",
        job_title: identity.job_title ?? "",
        location: identity.location ?? "",
        email: identity.email ?? "",
      };
    }
  } catch (err) {
    /* An unsigned note is better than no note. The copy takes empty values
       with their punctuation, so the sign off simply collapses. */
    console.warn("Welcome email: could not resolve the sender, signing without it:", err);
  }

  return {
    subscriber_first_name: firstWordOf(full) || "there",
    subscriber_name: full,
    subscriber_email: args.email,
    sender_first_name: firstWordOf(sender.full_name),
    sender_name: sender.full_name,
    sender_job_title: sender.job_title,
    sender_city: sender.location,
    sender_email: sender.email,
    unsubscribe_link: args.unsubscribe,
  };
}
