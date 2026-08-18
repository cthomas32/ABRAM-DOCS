"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { readConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { rows } from "@/lib/supabase/rows";
import { MAX_VIEW_NAME, cleanFilter, type ContactFilter } from "@/lib/crm/savedViews";

/**
 * Saving, renaming and removing a list.
 *
 * A saved view is somebody's own working set, so the rule is simple and
 * the database holds the same one: you write your own, you may share one
 * read-only, and an owner can tidy up. `crm.contacts.read.own` is the
 * floor rather than a write permission, because saving a filter over
 * rows you can already see grants nothing you did not have.
 *
 * The filter is cleaned before it is stored. An unknown key in the blob
 * is dropped here rather than ignored on the way out, so the column does
 * not slowly fill with shapes nothing reads.
 */

export interface ViewResult {
  ok: boolean;
  error?: string;
  id?: string;
}

const PATHS = ["/admin/dashboard/lists", "/admin/dashboard/crm"];

async function readWriter() {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);

  if (!user) return { error: "Sign in again to carry on." as const };
  if (!can(user, "crm.contacts.read.own")) {
    return { error: "Lists are built over people, and people are not yours to read." as const };
  }
  return { supabase, user };
}

function refresh() {
  for (const path of PATHS) revalidatePath(path);
}

export async function saveContactView(input: {
  name: string;
  filter: ContactFilter;
  isShared?: boolean;
}): Promise<ViewResult> {
  const writer = await readWriter();
  if ("error" in writer) return { ok: false, error: writer.error };
  const { supabase, user } = writer;

  const name = input.name.trim().slice(0, MAX_VIEW_NAME);
  if (!name) return { ok: false, error: "Give the list a name." };

  const { data, error } = await supabase
    .from("crm_saved_views")
    .upsert(
      {
        name,
        scope: "contacts",
        filter: cleanFilter(input.filter),
        owner_user_id: user.userId,
        is_shared: Boolean(input.isShared),
      },
      { onConflict: "owner_user_id,scope,name" }
    )
    .select("id")
    .limit(1);

  if (error) {
    return { ok: false, error: "That list could not be saved. Try again." };
  }

  refresh();
  return { ok: true, id: rows<{ id: string }>({ data, error: null })[0]?.id };
}

export async function updateContactView(input: {
  id: string;
  name?: string;
  filter?: ContactFilter;
  isShared?: boolean;
}): Promise<ViewResult> {
  const writer = await readWriter();
  if ("error" in writer) return { ok: false, error: writer.error };
  const { supabase } = writer;

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) {
    const name = input.name.trim().slice(0, MAX_VIEW_NAME);
    if (!name) return { ok: false, error: "Give the list a name." };
    patch.name = name;
  }
  if (input.filter !== undefined) patch.filter = cleanFilter(input.filter);
  if (input.isShared !== undefined) patch.is_shared = input.isShared;

  if (Object.keys(patch).length === 0) return { ok: true };

  const { error } = await supabase.from("crm_saved_views").update(patch).eq("id", input.id);
  if (error) return { ok: false, error: "That change did not save. Try again." };

  refresh();
  return { ok: true };
}

export async function deleteContactView(input: { id: string }): Promise<ViewResult> {
  const writer = await readWriter();
  if ("error" in writer) return { ok: false, error: writer.error };
  const { supabase } = writer;

  const { error } = await supabase.from("crm_saved_views").delete().eq("id", input.id);
  if (error) return { ok: false, error: "That list could not be removed. Try again." };

  refresh();
  return { ok: true };
}
