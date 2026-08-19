"use server";

import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { createClient } from "@/utils/supabase/server";
import { IDENTITY_SELECT, resolveIdentity } from "@/lib/crm/identity";
import {
  CRM_EMAIL_TEMPLATES,
  crmEmailProblem,
  crmEmailTemplateSpec,
  defaultCrmEmailContent,
  renderCrmEmail,
  sampleValues,
  type CrmEmailContent,
  type CrmEmailValues,
} from "@/lib/crm/emailTemplates";
import {
  loadCrmEmailContent,
  resetCrmEmailContent,
  saveCrmEmailContent,
  trimCrmEmailContent,
} from "@/lib/crm/emailTemplateStore";
import { captureEmailValues } from "@/lib/crm/emailValues";
import type { CrmEmailActionResult, CrmEmailAdminData, CrmEmailAdminRow } from "./types";
import { announceBlocked, blockedReason } from "@/lib/email/outbound";

/**
 * Writes for the email editor.
 *
 * Two rules, and both of them are about the same thing. A template is
 * validated before it is allowed into the table, so the console refuses a
 * broken edit at the moment it is made rather than at the moment somebody
 * hands over a business card. And a test send goes to the address on the
 * session and nowhere else, so this screen cannot be turned into a way to
 * mail a stranger.
 */

const PATH = "/admin/dashboard/people/emails";
const DEFAULT_FROM = "ABRAM <updates@abram.network>";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * The sender half of the preview, read off the real card.
 *
 * A preview signed by somebody invented tells you nothing about whether
 * your own job title fits on the line. Any failure here leaves the invented
 * values in place, because a preview is worth less than a page that loads.
 */
async function previewValuesFor(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<CrmEmailValues> {
  const invented = sampleValues(true);

  try {
    const { data } = await supabase
      .from("crm_profiles")
      .select(IDENTITY_SELECT)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!data) return invented;

    const profile = resolveIdentity(data as unknown as Parameters<typeof resolveIdentity>[0]);
    const real = captureEmailValues({
      profile,
      toName: String(invented.contact_name ?? ""),
      company: invented.contact_company,
      jobTitle: invented.contact_job_title,
      eventName: invented.event_name,
    });

    /* The contact half stays invented. Only the signature becomes real. */
    return { ...invented, ...real };
  } catch {
    return invented;
  }
}

/** Every editable email, with what sends today and what ships by default. */
export async function loadCrmEmailAdminData(): Promise<CrmEmailAdminData | { error: string }> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { error: "You are signed out. Sign in again to edit the emails." };

  const templates: CrmEmailAdminRow[] = [];

  for (const spec of CRM_EMAIL_TEMPLATES) {
    const fallback = defaultCrmEmailContent(spec.key);
    if (!fallback) continue;
    const loaded = await loadCrmEmailContent(supabase, spec.key);

    templates.push({
      key: spec.key,
      name: spec.name,
      description: spec.description,
      content: loaded?.content ?? fallback,
      defaultContent: fallback,
      source: loaded?.source ?? "default",
      updatedAt: loaded?.updatedAt ?? null,
      fallbackReason: loaded?.fallbackReason ?? null,
    });
  }

  return {
    templates,
    previewValues: await previewValuesFor(supabase),
    testRecipient: user.email ?? null,
  };
}

export async function saveCrmEmailTemplate(
  key: string,
  content: CrmEmailContent,
): Promise<CrmEmailActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { error: "You are signed out. Sign in again to save." };
  if (!defaultCrmEmailContent(key)) return { error: "That email is not one this build sends." };

  const trimmed = trimCrmEmailContent(content);

  /* Refused here rather than repaired later. Anything that would fall back
     at send time is something the person editing it wants to know about
     while they still have the words in front of them. */
  const problem = crmEmailProblem(trimmed, crmEmailTemplateSpec(key)?.variables);
  if (problem) return { error: problem };

  const { error } = await saveCrmEmailContent(supabase, key, trimmed, user.id);
  if (error) return { error };

  revalidatePath(PATH);
  return { message: "Saved. This is what goes out from now on." };
}

/** Removes the edit so the copy this build ships with sends again. */
export async function resetCrmEmailTemplate(key: string): Promise<CrmEmailActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { error: "You are signed out. Sign in again to reset." };

  const { error } = await resetCrmEmailContent(supabase, key);
  if (error) return { error };

  revalidatePath(PATH);
  return { message: "Back to the original wording." };
}

/**
 * A test, to yourself.
 *
 * There is no recipient argument and there never will be. The address comes
 * off the session, so the worst somebody can do with this endpoint is mail
 * themselves. The subject is prefixed so a test sitting in your inbox in
 * three weeks is still obviously a test.
 */
export async function sendCrmEmailTest(
  key: string,
  content: CrmEmailContent,
  withEvent: boolean,
): Promise<CrmEmailActionResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { error: "You are signed out. Sign in again to send a test." };

  const recipient = user.email;
  if (!recipient) return { error: "Your account has no email address on it, so there is nowhere to send." };

  if (!defaultCrmEmailContent(key)) return { error: "That email is not one this build sends." };

  const trimmed = trimCrmEmailContent(content);
  const problem = crmEmailProblem(trimmed, crmEmailTemplateSpec(key)?.variables);
  if (problem) return { error: problem };

  const blocked = blockedReason();
  if (blocked) {
    announceBlocked("template test send");
    return { error: blocked };
  }

  const apiKey = process.env.RESEND_API_KEY || process.env.RESEND_MARKETING_API_KEY;
  if (!apiKey) return { error: "No mail service is configured, so a test cannot go out." };

  const values = { ...(await previewValuesFor(supabase)), event_name: withEvent ? sampleValues(true).event_name : "" };
  const email = renderCrmEmail(trimmed, values);

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM,
      to: recipient,
      subject: `[Test] ${email.subject}`,
      ...(email.text ? { text: email.text } : {}),
      ...(email.html ? { html: email.html } : {}),
    } as Parameters<Resend["emails"]["send"]>[0]);

    if (result.error) return { error: result.error.message };
    return { message: `Sent to ${recipient}.` };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "The test could not be sent." };
  }
}
