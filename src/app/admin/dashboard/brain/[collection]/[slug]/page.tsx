import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { rows } from "@/lib/supabase/rows";
import {
  BRAIN_COLLECTION_IDS,
  type BrainCollection,
  type BrainDoc,
  type BrainRevision,
} from "@/lib/brain/collections";
import BrainDocument from "./BrainDocument";

/**
 * One document, at an address made of its collection and its name.
 *
 * `/brain/proposals/how-we-write-proposals` rather than a uuid, because
 * this address gets pasted into a message that says "read this before you
 * write the deck". A uuid in that message is a link somebody has to click
 * to find out what it is.
 *
 * The history is read here alongside the document. It is capped at twenty
 * versions: the question people ask is "what did this say before", and the
 * answer is nearly always one or two edits back.
 */

export const dynamic = "force-dynamic";

const REVISION_LIMIT = 20;

export default async function BrainDocPage({
  params,
}: {
  params: Promise<{ collection: string; slug: string }>;
}) {
  const user = await getConsoleUser();
  if (!user) redirect("/admin");
  if (!can(user, "console.admin")) redirect("/admin");

  const { collection, slug } = await params;

  if (!BRAIN_COLLECTION_IDS.includes(collection as BrainCollection)) notFound();

  const supabase = await createClient();

  const docRes = await supabase
    .from("brain_docs")
    .select("*")
    .eq("collection", collection)
    .eq("slug", slug)
    .eq("archived", false)
    .maybeSingle();

  const doc = docRes.data as BrainDoc | null;
  if (!doc) notFound();

  const [revisionsRes, membersRes] = await Promise.all([
    supabase
      .from("brain_doc_revisions")
      .select("*")
      .eq("doc_id", doc.id)
      .order("created_at", { ascending: false })
      .limit(REVISION_LIMIT),
    supabase.from("admin_users").select("user_id, full_name, email"),
  ]);

  const memberNameById: Record<string, string> = {};
  for (const member of rows<{ user_id: string; full_name: string | null; email: string }>(
    membersRes
  )) {
    memberNameById[member.user_id] = member.full_name || member.email;
  }

  const canWrite = can(user, "content.brain");

  return (
    <BrainDocument
      doc={doc}
      revisions={rows<BrainRevision>(revisionsRes)}
      memberNameById={memberNameById}
      canWrite={canWrite}
    />
  );
}
