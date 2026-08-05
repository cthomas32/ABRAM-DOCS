/**
 * Reading and writing the edited copy for a capture email.
 *
 * The one thing this file is for is making a failure boring. A missing row,
 * a table that is not there yet, a network that dropped, a saved template
 * with an unclosed brace in it: all of them come back as the built in copy
 * with a reason attached, and none of them throw. The route that calls this
 * is holding somebody's business card at the time.
 *
 * Which client gets passed in decides what is allowed. The capture route
 * hands over the service role client, so a policy change can never make an
 * email fail to send. The console hands over the signed in client and is
 * held to the row level policy like every other screen.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  crmEmailProblem,
  defaultCrmEmailContent,
  type CrmEmailContent,
} from "./emailTemplates";

export const CRM_EMAIL_TABLE = "crm_email_templates";

/** A saved row, as much of it as anything here needs. */
export interface CrmEmailTemplateRow {
  key: string;
  subject: string;
  body_text: string;
  body_html: string;
  updated_at: string | null;
}

export interface LoadedCrmEmail {
  content: CrmEmailContent;
  /** Whether the copy came from a saved edit or from the built in default. */
  source: "saved" | "default";
  /** Set when a saved edit existed and was refused. Null on the happy path. */
  fallbackReason: string | null;
  updatedAt: string | null;
}

function asContent(row: Partial<CrmEmailTemplateRow>): CrmEmailContent {
  return {
    subject: typeof row.subject === "string" ? row.subject : "",
    bodyText: typeof row.body_text === "string" ? row.body_text : "",
    bodyHtml: typeof row.body_html === "string" ? row.body_html : "",
  };
}

/**
 * The copy to send, whatever has gone wrong.
 *
 * Falls back on every path: an unknown key, an unreachable table, a row
 * that is not there, a row that cannot be rendered. The only case that
 * returns null is a key this build has never heard of, and the caller is
 * expected to treat that as "send nothing" rather than "send something
 * blank".
 */
export async function loadCrmEmailContent(
  supabase: SupabaseClient | null,
  key: string,
): Promise<LoadedCrmEmail | null> {
  const fallback = defaultCrmEmailContent(key);
  if (!fallback) return null;

  const asDefault = (reason: string | null): LoadedCrmEmail => ({
    content: fallback,
    source: "default",
    fallbackReason: reason,
    updatedAt: null,
  });

  if (!supabase) return asDefault(null);

  try {
    const { data, error } = await supabase
      .from(CRM_EMAIL_TABLE)
      .select("key, subject, body_text, body_html, updated_at")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.warn(`Capture email: could not read the saved wording for ${key}:`, error.message);
      return asDefault(null);
    }
    if (!data) return asDefault(null);

    const content = asContent(data as Partial<CrmEmailTemplateRow>);
    const problem = crmEmailProblem(content);
    if (problem) {
      console.error(`Capture email: the saved wording for ${key} was refused. ${problem}`);
      return asDefault(problem);
    }

    return {
      content,
      source: "saved",
      fallbackReason: null,
      updatedAt: (data as CrmEmailTemplateRow).updated_at ?? null,
    };
  } catch (err) {
    console.warn(`Capture email: reading the saved wording for ${key} threw:`, err);
    return asDefault(null);
  }
}

/** How long any one part of an email may be. Generous, and a real ceiling. */
export const CRM_EMAIL_LIMITS = { subject: 300, bodyText: 20000, bodyHtml: 60000 };

export function trimCrmEmailContent(content: CrmEmailContent): CrmEmailContent {
  return {
    subject: String(content.subject ?? "").slice(0, CRM_EMAIL_LIMITS.subject),
    bodyText: String(content.bodyText ?? "").slice(0, CRM_EMAIL_LIMITS.bodyText),
    bodyHtml: String(content.bodyHtml ?? "").slice(0, CRM_EMAIL_LIMITS.bodyHtml),
  };
}

/** Saves an edit. The caller has already checked who is asking. */
export async function saveCrmEmailContent(
  supabase: SupabaseClient,
  key: string,
  content: CrmEmailContent,
  userId: string | null,
): Promise<{ error?: string }> {
  const row = trimCrmEmailContent(content);
  const { error } = await supabase.from(CRM_EMAIL_TABLE).upsert(
    {
      key,
      subject: row.subject,
      body_text: row.bodyText,
      body_html: row.bodyHtml,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
  return error ? { error: error.message } : {};
}

/**
 * Reset.
 *
 * The row is deleted rather than overwritten with the built in copy, so
 * "never edited" and "edited back to the original" stay the same state.
 * That is what keeps the default in one place: change the copy in
 * emailTemplates.ts later and every card that has not been customised
 * picks it up.
 */
export async function resetCrmEmailContent(
  supabase: SupabaseClient,
  key: string,
): Promise<{ error?: string }> {
  const { error } = await supabase.from(CRM_EMAIL_TABLE).delete().eq("key", key);
  return error ? { error: error.message } : {};
}
