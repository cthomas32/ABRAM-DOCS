/**
 * The shapes the email editor and its server actions agree on.
 *
 * Kept out of the actions file because a "use server" module may only
 * export async functions, and out of the component because the actions
 * need them too.
 */

import type { CrmEmailContent, CrmEmailValues } from "@/lib/crm/emailTemplates";

/** One editable email, as the console sees it. */
export interface CrmEmailAdminRow {
  key: string;
  name: string;
  description: string;
  /** What sends today: a saved edit, or the copy this build ships with. */
  content: CrmEmailContent;
  /** The copy this build ships with, for the preview and for reset. */
  defaultContent: CrmEmailContent;
  source: "saved" | "default";
  updatedAt: string | null;
  /** Set when a saved edit exists and is being refused. */
  fallbackReason: string | null;
}

export interface CrmEmailAdminData {
  templates: CrmEmailAdminRow[];
  /**
   * Values the preview and the test send use. The contact half is invented,
   * the sender half is read off the real card wherever it exists, so what
   * you are looking at is your own signature.
   */
  previewValues: CrmEmailValues;
  /** Where a test send would go. Always the signed in address. */
  testRecipient: string | null;
}

export interface CrmEmailActionResult {
  error?: string;
  message?: string;
}
