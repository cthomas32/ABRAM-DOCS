"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { readConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { rows } from "@/lib/supabase/rows";
import { syncFeedPerson } from "@/lib/crm/contactSync";
import type { ImportedPerson } from "@/lib/crm/csv";

/**
 * Bringing a spreadsheet in.
 *
 * The merge rule is not reinvented here. Every feed into the person
 * record goes through `syncFeedPerson`, which matches on lowercased email
 * and never overwrites a name, a company or an owner, because the record
 * already here is the more considered of the two. An import is just one
 * more feed, and giving it its own rule is how two ideas of "the same
 * person" end up in one table.
 *
 * Two calls rather than one. The dry run counts what would happen and
 * writes nothing; the real one writes. An import that reports its damage
 * afterwards is not an import anybody presses twice.
 */

const MAX_ROWS = 2000;

export interface ImportPreview {
  ok: boolean;
  error?: string;
  /** Rows carrying a usable email. */
  usable: number;
  /** Would match somebody already here, on email. */
  wouldMerge: number;
  /** Would create a new person. */
  wouldCreate: number;
}

export interface ImportOutcome {
  ok: boolean;
  error?: string;
  created: number;
  merged: number;
  unchanged: number;
  refused: number;
  /** The first few refusals, in the words the console shows. */
  reasons: string[];
}

async function readWriter() {
  const supabase = await createClient();
  const user = await readConsoleUser(supabase);

  if (!user) return { error: "Sign in again to carry on." as const };
  if (!can(user, "crm.contacts.write.own")) {
    return { error: "Importing writes people, and writing people is not yours to do." as const };
  }
  return { supabase, user };
}

/** Which of these addresses already belong to somebody, read in one go. */
async function existingEmails(
  supabase: Awaited<ReturnType<typeof createClient>>,
  emails: string[]
): Promise<Set<string>> {
  const found = new Set<string>();

  // Chunked, because a URL carrying two thousand addresses is a URL no
  // proxy in the path is going to forward.
  for (let index = 0; index < emails.length; index += 200) {
    const chunk = emails.slice(index, index + 200);
    const result = await supabase
      .from("crm_contacts")
      .select("email")
      .eq("archived", false)
      .in("email", chunk);

    for (const row of rows<{ email: string | null }>(result)) {
      if (row.email) found.add(row.email.toLowerCase());
    }
  }

  return found;
}

export async function previewContactImport(people: ImportedPerson[]): Promise<ImportPreview> {
  const writer = await readWriter();
  if ("error" in writer) {
    return { ok: false, error: writer.error, usable: 0, wouldMerge: 0, wouldCreate: 0 };
  }
  const { supabase } = writer;

  if (people.length === 0) {
    return { ok: false, error: "That file has no rows with an email address in it.", usable: 0, wouldMerge: 0, wouldCreate: 0 };
  }
  if (people.length > MAX_ROWS) {
    return {
      ok: false,
      error: `That file has ${people.length} rows. Split it: ${MAX_ROWS} at a time is the limit.`,
      usable: 0,
      wouldMerge: 0,
      wouldCreate: 0,
    };
  }

  const emails = people.map((person) => person.email.toLowerCase());
  const already = await existingEmails(supabase, emails);
  const wouldMerge = emails.filter((email) => already.has(email)).length;

  return {
    ok: true,
    usable: people.length,
    wouldMerge,
    wouldCreate: people.length - wouldMerge,
  };
}

/**
 * The write.
 *
 * One row at a time on purpose. A bulk upsert would be faster and would
 * have to reimplement the merge rule to do it, and the rule is the part
 * that has to stay in one place. At two thousand rows the difference is
 * seconds, and the import is a thing somebody does a handful of times.
 */
export async function runContactImport(people: ImportedPerson[]): Promise<ImportOutcome> {
  const writer = await readWriter();
  if ("error" in writer) {
    return { ok: false, error: writer.error, created: 0, merged: 0, unchanged: 0, refused: 0, reasons: [] };
  }
  const { supabase } = writer;

  if (people.length === 0) {
    return {
      ok: false,
      error: "That file has no rows with an email address in it.",
      created: 0,
      merged: 0,
      unchanged: 0,
      refused: 0,
      reasons: [],
    };
  }
  if (people.length > MAX_ROWS) {
    return {
      ok: false,
      error: `That file has ${people.length} rows. Split it: ${MAX_ROWS} at a time is the limit.`,
      created: 0,
      merged: 0,
      unchanged: 0,
      refused: 0,
      reasons: [],
    };
  }

  const outcome: ImportOutcome = {
    ok: true,
    created: 0,
    merged: 0,
    unchanged: 0,
    refused: 0,
    reasons: [],
  };

  for (const person of people) {
    const result = await syncFeedPerson(supabase, {
      email: person.email,
      fullName: person.fullName || null,
      company: person.company || null,
      jobTitle: person.jobTitle || null,
      source: "import",
      // An imported address is a lead and nothing more. A file cannot
      // promote anybody: the lifecycle only ever moves forwards, and
      // deciding somebody is qualified is a person's job.
      lifecycle: "lead",
    });

    if (result.outcome === "created") outcome.created++;
    else if (result.outcome === "linked") outcome.merged++;
    else if (result.outcome === "unchanged") outcome.unchanged++;
    else {
      outcome.refused++;
      if (result.error && outcome.reasons.length < 3 && !outcome.reasons.includes(result.error)) {
        outcome.reasons.push(result.error);
      }
    }
  }

  revalidatePath("/admin/dashboard/crm/people");
  return outcome;
}
