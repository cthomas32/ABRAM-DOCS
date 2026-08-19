import Link from "next/link";
import { BookOpen } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getConsoleUser } from "@/lib/auth/consoleUser";
import { can } from "@/lib/auth/permissions";
import { rows } from "@/lib/supabase/rows";
import Overline from "@/components/admin/Overline";
import Panel, { EmptyPanel } from "@/components/admin/Panel";
import {
  BRAIN_COLLECTIONS,
  verificationAge,
  type BrainDoc,
} from "@/lib/brain/collections";
import NewBrainDoc from "./NewBrainDoc";

/**
 * The shelf.
 *
 * Five collections, every document in each, and one fact per row that is
 * not the title: how long ago somebody last said it was still true. That
 * is the number this store exists to make visible. A brand voice or a
 * pricing claim does not announce that it has gone stale, and the failure
 * mode of a knowledge base is not that it is empty, it is that it is
 * confidently out of date.
 *
 * Read by every console role. The New button and the editor are owner and
 * admin only, and a reader without the write permission simply does not
 * see them, which is the same rule the rest of the console follows.
 */

export const dynamic = "force-dynamic";

export default async function BrainPanel() {
  const user = await getConsoleUser();
  if (!user) return null;

  const canWrite = can(user, "content.brain");
  const supabase = await createClient();

  const result = await supabase
    .from("brain_docs")
    .select("*")
    .eq("archived", false)
    .order("collection")
    .order("title");

  const docs = rows<BrainDoc>(result);
  const now = new Date();

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto">
      <header className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">The brain</h1>
          <p className="text-sm text-zinc-400 mt-2 leading-relaxed max-w-2xl">
            What the company believes, and how it writes. Everybody here can read it. Changing it is
            an owner&apos;s call, the same way a change to the file version rides a pull request.
          </p>
        </div>
        {canWrite && <NewBrainDoc />}
      </header>

      {result.error && (
        <Panel tone="attention" className="mb-6">
          The brain could not be read. If this is a fresh database, the migration that creates it
          has not run yet.
        </Panel>
      )}

      <div className="space-y-10">
        {BRAIN_COLLECTIONS.map((collection) => {
          const shelf = docs.filter((doc) => doc.collection === collection.id);

          return (
            <section key={collection.id} aria-label={collection.label} className="space-y-3">
              <div>
                <Overline as="h2">{collection.label}</Overline>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{collection.hint}</p>
              </div>

              {shelf.length === 0 ? (
                <EmptyPanel title="Nothing on this shelf" icon={<BookOpen className="w-6 h-6" />}>
                  {canWrite
                    ? "Write the first one. An empty shelf is a question nobody has answered yet."
                    : "Nobody has written this one yet."}
                </EmptyPanel>
              ) : (
                <ul className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5">
                  {shelf.map((doc) => {
                    const age = verificationAge(doc.last_verified_on, now);
                    return (
                      <li key={doc.id} className="flex items-start gap-3 px-4 py-3">
                        <span className="shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-white/[0.03] border border-white/8 flex items-center justify-center text-zinc-400">
                          <BookOpen className="w-3.5 h-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline gap-2 flex-wrap">
                            <Link
                              href={`/admin/dashboard/brain/${doc.collection}/${doc.slug}`}
                              className="text-xs text-white break-words hover:underline"
                            >
                              {doc.title}
                            </Link>
                            {doc.status === "draft" && (
                              <span className="inline-flex items-center h-5 px-2 rounded-full border border-white/8 bg-white/[0.04] text-[10px] font-medium text-zinc-400">
                                Draft
                              </span>
                            )}
                          </span>
                          {doc.summary && (
                            <span className="block text-[11px] text-zinc-400 leading-relaxed mt-0.5 break-words">
                              {doc.summary}
                            </span>
                          )}
                        </span>
                        <span
                          className={`shrink-0 text-[11px] tabular-nums ${
                            age.state === "stale"
                              ? "text-amber-400 font-medium"
                              : age.state === "unverified"
                                ? "text-zinc-500"
                                : "text-zinc-500"
                          }`}
                          title="When somebody last said this was still true"
                        >
                          {age.state === "unverified"
                            ? "Never verified"
                            : age.days === 0
                              ? "Verified today"
                              : `${age.days}d ago`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
