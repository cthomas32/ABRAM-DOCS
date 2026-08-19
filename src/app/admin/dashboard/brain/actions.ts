"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { readConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import {
  BRAIN_COLLECTION_IDS,
  toSlug,
  type BrainCollection,
} from "@/lib/brain/collections";

/**
 * Writing the brain.
 *
 * Deliberately narrower than the docs editor next door, and the two
 * differences are both about production.
 *
 * `src/app/admin/editor-actions.ts` writes `docs.json` to disk and shells
 * out to `scripts/build-search-index.js` after every save. Both work on a
 * laptop and neither works on a serverless filesystem that is read only,
 * so the help docs editor is quietly broken in production in a way that
 * only shows up as a save that reports success and changes no navigation.
 * Nothing here touches the filesystem or spawns a process.
 *
 * And there is no frontmatter. A help doc carries a title, a description
 * and keywords because a search engine reads them. A brain document is
 * read by the people who work here and by the MCP server, both of which
 * read columns.
 *
 * The revision history is written by a database trigger rather than by
 * this file, so a write that goes around these actions still leaves a
 * trace. See 20260818150000_brain_docs.sql.
 */

const MAX_TITLE = 200;
const MAX_SUMMARY = 400;
const MAX_BODY = 400_000;
const MAX_TAGS = 12;

export interface BrainResult {
  ok: boolean;
  error?: string;
  docId?: string;
  slug?: string;
}

function text(value: string | null | undefined, limit: number): string | null {
  const trimmed = (value ?? "").trim().slice(0, limit);
  return trimmed || null;
}

async function writer() {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);

  if (!user) return { error: "Your session has expired. Sign in again." as const };
  if (!can(user, "content.brain")) {
    return {
      error:
        "Changing what the company believes is an owner's call. You can read every page of it." as const,
    };
  }
  return { supabase, user };
}

function refresh(slug?: string) {
  revalidatePath("/admin/dashboard/brain");
  if (slug) revalidatePath(`/admin/dashboard/brain/${slug}`);
}

/**
 * A refused write, said in words.
 *
 * The two that actually happen here are the policy refusal and the unique
 * index on (collection, slug), which is what a second document with the
 * same name hits.
 */
function refusal(code: string | undefined, message: string): string {
  if (code === "23505") {
    return "There is already a document at that address in this collection. Give it a different title.";
  }
  if (/row-level security/i.test(message)) {
    return "Changing what the company believes is an owner's call.";
  }
  return message;
}

export async function createBrainDoc(input: {
  collection: BrainCollection;
  title: string;
}): Promise<BrainResult> {
  const gate = await writer();
  if ("error" in gate) return { ok: false, error: gate.error };

  const title = text(input.title, MAX_TITLE);
  if (!title) return { ok: false, error: "Give it a title. The address is built from it." };

  if (!BRAIN_COLLECTION_IDS.includes(input.collection)) {
    return { ok: false, error: "That is not one of the five collections." };
  }

  const slug = toSlug(title);
  if (!slug) {
    return {
      ok: false,
      error: "That title has no letters or numbers in it, so there is no address to make from it.",
    };
  }

  const { data, error } = await gate.supabase
    .from("brain_docs")
    .insert({
      collection: input.collection,
      slug,
      title,
      status: "draft",
      owner_user_id: gate.user.userId,
      body_md: `# ${title}\n\n_Last verified: unset._\n\n`,
    })
    .select("id, slug")
    .maybeSingle();

  if (error) return { ok: false, error: refusal(error.code, error.message) };

  refresh();
  return { ok: true, docId: data?.id as string | undefined, slug: data?.slug as string | undefined };
}

export async function saveBrainDoc(
  docId: string,
  input: {
    title: string;
    summary: string | null;
    bodyMd: string;
    status: "draft" | "published";
    tags: string[];
    /** A yyyy-mm-dd day, or null to clear the stamp. */
    lastVerifiedOn: string | null;
  }
): Promise<BrainResult> {
  const gate = await writer();
  if ("error" in gate) return { ok: false, error: gate.error };

  const title = text(input.title, MAX_TITLE);
  if (!title) return { ok: false, error: "A document needs a title." };

  const day = (input.lastVerifiedOn ?? "").trim();
  if (day && !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return { ok: false, error: "That verification date is not a date. Use the date picker." };
  }

  const tags = Array.from(
    new Set(input.tags.map((tag) => tag.trim().toLowerCase().slice(0, 40)).filter(Boolean))
  ).slice(0, MAX_TAGS);

  const { data, error } = await gate.supabase
    .from("brain_docs")
    .update({
      title,
      summary: text(input.summary, MAX_SUMMARY),
      body_md: (input.bodyMd ?? "").slice(0, MAX_BODY),
      status: input.status === "published" ? "published" : "draft",
      tags,
      last_verified_on: day || null,
    })
    .eq("id", docId)
    .select("slug")
    .maybeSingle();

  if (error) return { ok: false, error: refusal(error.code, error.message) };

  refresh(data?.slug as string | undefined);
  return { ok: true, docId };
}

/**
 * Today's date, stamped.
 *
 * Separate from a save because verifying is a different act from editing:
 * it says "I read this and it is still true", which is the one thing that
 * keeps the ninety day line meaningful. A save that stamped it
 * automatically would make every stamp a lie about what was checked.
 */
export async function verifyBrainDoc(docId: string): Promise<BrainResult> {
  const gate = await writer();
  if ("error" in gate) return { ok: false, error: gate.error };

  const { data, error } = await gate.supabase
    .from("brain_docs")
    .update({ last_verified_on: new Date().toISOString().slice(0, 10) })
    .eq("id", docId)
    .select("slug")
    .maybeSingle();

  if (error) return { ok: false, error: refusal(error.code, error.message) };

  refresh(data?.slug as string | undefined);
  return { ok: true, docId };
}

export async function setBrainDocArchived(
  docId: string,
  archived: boolean
): Promise<BrainResult> {
  const gate = await writer();
  if ("error" in gate) return { ok: false, error: gate.error };

  const { error } = await gate.supabase
    .from("brain_docs")
    .update({ archived })
    .eq("id", docId);

  if (error) return { ok: false, error: refusal(error.code, error.message) };

  refresh();
  return { ok: true, docId };
}
