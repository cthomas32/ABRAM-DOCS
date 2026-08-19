"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, BadgeCheck, ChevronLeft, Eye, History, Loader2, Pencil, Save } from "lucide-react";
import { ObjectHeader } from "@/components/admin/ObjectTabs";
import Overline, { FieldLabel } from "@/components/admin/Overline";
import Markdown from "@/components/admin/Markdown";
import { EmptyPanel } from "@/components/admin/Panel";
import {
  brainCollectionLabel,
  verificationAge,
  type BrainDoc,
  type BrainRevision,
} from "@/lib/brain/collections";
import { formatDate, relativeTime } from "@/lib/crm/console";
import { saveBrainDoc, setBrainDocArchived, verifyBrainDoc } from "../../actions";

/**
 * Reading a document, and editing it in place.
 *
 * The default is reading. The docs editor next door opens in a split
 * pane, which is right for a page being drafted and wrong for a page
 * being consulted, and this store is consulted far more often than it is
 * written: somebody opens the brand voice to check a claim, not to change
 * it. So Read is the mode you land in and Edit is a button, and a reader
 * without the write permission never sees the button at all.
 *
 * Verify is its own action rather than a side effect of saving. It means
 * "I read this and it is still true", which is a different claim from "I
 * changed a word in it", and a stamp that moved every time somebody fixed
 * a typo would say nothing.
 */
export default function BrainDocument({
  doc,
  revisions,
  memberNameById,
  canWrite,
}: {
  doc: BrainDoc;
  revisions: BrainRevision[];
  memberNameById: Record<string, string>;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [mode, setMode] = useState<"read" | "edit">("read");
  const [title, setTitle] = useState(doc.title);
  const [summary, setSummary] = useState(doc.summary ?? "");
  const [body, setBody] = useState(doc.body_md);
  const [status, setStatus] = useState(doc.status);
  const [tags, setTags] = useState(doc.tags.join(", "));
  const [verifiedOn, setVerifiedOn] = useState(doc.last_verified_on ?? "");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const age = useMemo(() => verificationAge(doc.last_verified_on, new Date()), [doc.last_verified_on]);

  const dirty =
    title !== doc.title ||
    summary !== (doc.summary ?? "") ||
    body !== doc.body_md ||
    status !== doc.status ||
    tags !== doc.tags.join(", ") ||
    verifiedOn !== (doc.last_verified_on ?? "");

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function save() {
    setSaving(true);
    setResult(null);
    const outcome = await saveBrainDoc(doc.id, {
      title,
      summary: summary || null,
      bodyMd: body,
      status,
      tags: tags.split(",").map((tag) => tag.trim()),
      lastVerifiedOn: verifiedOn || null,
    });
    setSaving(false);
    setResult(outcome.ok ? "Saved." : outcome.error ?? "That did not save.");
    if (outcome.ok) {
      refresh();
      setMode("read");
    }
  }

  async function verify() {
    setBusy(true);
    const outcome = await verifyBrainDoc(doc.id);
    setBusy(false);
    setResult(outcome.ok ? "Marked as still true, today." : outcome.error ?? null);
    if (outcome.ok) refresh();
  }

  async function archive() {
    setBusy(true);
    const outcome = await setBrainDocArchived(doc.id, true);
    setBusy(false);
    if (outcome.ok) router.push("/admin/dashboard/content?tab=brain");
    else setResult(outcome.error ?? null);
  }

  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s" && dirty) {
        event.preventDefault();
        void save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, title, summary, body, status, tags, verifiedOn]);

  return (
    <div className="flex-1 min-w-0 overflow-y-auto">
      <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-4xl mx-auto pb-16">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 min-w-0">
          <Link
            href="/admin/dashboard/content?tab=brain"
            className="inline-flex items-center gap-1.5 h-11 sm:h-9 -ml-2 px-2 rounded-full text-[11px] font-medium text-zinc-400 hover:text-white transition-colors shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            The brain
          </Link>
          <span aria-hidden="true" className="text-white/15 text-[11px] shrink-0">
            /
          </span>
          <span className="text-[11px] text-zinc-500 truncate">
            {brainCollectionLabel(doc.collection)}
          </span>
        </nav>

        <ObjectHeader
          title={doc.title}
          action={
            canWrite ? (
              <>
                <button
                  type="button"
                  onClick={() => setMode(mode === "read" ? "edit" : "read")}
                  className="btn-glass min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full inline-flex items-center gap-1.5"
                >
                  {mode === "read" ? (
                    <Pencil className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                  {mode === "read" ? "Edit" : "Read"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void verify()}
                  className="btn-glass min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <BadgeCheck className="w-3.5 h-3.5" />
                  )}
                  Still true
                </button>
              </>
            ) : undefined
          }
        >
          {doc.summary && (
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed break-words">{doc.summary}</p>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Chip>{brainCollectionLabel(doc.collection)}</Chip>
            {doc.status === "draft" && <Chip>Draft</Chip>}
            {doc.owner_user_id && (
              <Chip>
                {memberNameById[doc.owner_user_id]
                  ? `Owner: ${memberNameById[doc.owner_user_id]}`
                  : "Owner has left"}
              </Chip>
            )}
            <Chip tone={age.state === "stale" ? "attention" : "neutral"}>
              {age.state === "unverified"
                ? "Never verified"
                : `Verified ${formatDate(doc.last_verified_on)}`}
            </Chip>
            {doc.tags.map((tag) => (
              <Chip key={tag}>{tag}</Chip>
            ))}
          </div>
          {age.state === "stale" && (
            <p className="mt-2 text-[11px] text-amber-300 leading-relaxed">
              Nobody has confirmed this in {age.days} days. Past ninety, treat what is written here
              as a lead rather than a fact.
            </p>
          )}
        </ObjectHeader>

        <div className="mt-6">
          {mode === "read" ? (
            doc.body_md.trim() ? (
              <Markdown source={doc.body_md} />
            ) : (
              <EmptyPanel title="Nothing written yet">
                {canWrite
                  ? "Press Edit and write the first version."
                  : "Nobody has written this one yet."}
              </EmptyPanel>
            )
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                <div className="sm:col-span-2">
                  <FieldLabel htmlFor="brain-title">Title</FieldLabel>
                  <input
                    id="brain-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="admin-input h-11 sm:h-9 py-0"
                  />
                  <p className="mt-1.5 text-[11px] text-zinc-400 leading-relaxed">
                    The address stays at /{doc.collection}/{doc.slug} whatever this says. A knowledge
                    base whose addresses move is a knowledge base whose links rot.
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel htmlFor="brain-summary">Summary</FieldLabel>
                  <input
                    id="brain-summary"
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                    placeholder="One line, shown on the shelf and returned by search."
                    className="admin-input h-11 sm:h-9 py-0"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="brain-status">Status</FieldLabel>
                  <select
                    id="brain-status"
                    value={status}
                    onChange={(event) => setStatus(event.target.value as "draft" | "published")}
                    className="admin-input h-11 sm:h-9 py-0 cursor-pointer"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div>
                  <FieldLabel htmlFor="brain-verified">Last verified</FieldLabel>
                  <input
                    id="brain-verified"
                    type="date"
                    value={verifiedOn}
                    onChange={(event) => setVerifiedOn(event.target.value)}
                    className="admin-input h-11 sm:h-9 py-0"
                  />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel htmlFor="brain-tags">Tags</FieldLabel>
                  <input
                    id="brain-tags"
                    value={tags}
                    onChange={(event) => setTags(event.target.value)}
                    placeholder="pricing, claims, positioning"
                    className="admin-input h-11 sm:h-9 py-0"
                  />
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="brain-body">The document</FieldLabel>
                <textarea
                  id="brain-body"
                  rows={26}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  spellCheck
                  className="admin-input resize-y leading-relaxed font-mono text-[12px]"
                />
                <p className="mt-1.5 text-[11px] text-zinc-400 leading-relaxed">
                  Markdown. Headings, lists, quotes, code fences, bold and inline code. Every claim
                  carries its source, and &quot;unknown&quot; is a valid entry: a gap filled with
                  something plausible is worse than a gap.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void archive()}
                  disabled={busy}
                  className="btn-ghost min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Archive
                </button>
              </div>
            </div>
          )}
        </div>

        {revisions.length > 0 && (
          <section aria-label="History" className="mt-10 space-y-2.5">
            <button
              type="button"
              onClick={() => setShowHistory((value) => !value)}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              <Overline as="span">
                {showHistory ? "Hide history" : `History (${revisions.length})`}
              </Overline>
            </button>

            {showHistory && (
              <ul className="rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5">
                {revisions.map((revision) => (
                  <li key={revision.id} className="px-4 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-xs text-white break-words min-w-0">
                        {revision.title}
                      </span>
                      <span
                        className="shrink-0 text-[11px] text-zinc-500 tabular-nums"
                        title={revision.created_at}
                      >
                        {relativeTime(revision.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-zinc-500">
                      Superseded by{" "}
                      {revision.edited_by
                        ? memberNameById[revision.edited_by] ?? "somebody who has left"
                        : "an unknown editor"}
                    </p>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[11px] text-zinc-400 hover:text-white">
                        What it said
                      </summary>
                      <pre className="mt-2 rounded-xl border border-white/8 bg-black/40 p-3.5 overflow-x-auto">
                        <code className="font-mono text-[11px] text-zinc-300 whitespace-pre-wrap break-words">
                          {revision.body_md}
                        </code>
                      </pre>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {(dirty || result) && (
          <div className="sticky bottom-0 z-20 mt-6 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-white/8 bg-[#0A0A0A]/90 backdrop-blur-[20px] flex flex-wrap items-center gap-3">
            <span className="text-[11px] text-zinc-400 min-w-0">
              {dirty ? "Unsaved changes" : "No unsaved changes"}
              {result && <span className="text-zinc-300"> · {result}</span>}
            </span>
            {dirty && (
              <div className="flex items-center gap-2 ml-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setTitle(doc.title);
                    setSummary(doc.summary ?? "");
                    setBody(doc.body_md);
                    setStatus(doc.status);
                    setTags(doc.tags.join(", "));
                    setVerifiedOn(doc.last_verified_on ?? "");
                    setResult(null);
                  }}
                  className="btn-ghost min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={saving || pending}
                  className="btn-primary min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {saving ? "Saving" : "Save"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "attention";
}) {
  const skin =
    tone === "attention"
      ? "bg-amber-500/10 text-amber-200 border-amber-500/20"
      : "bg-white/[0.04] text-zinc-300 border-white/8";
  return (
    <span
      className={`inline-flex items-center h-6 px-2.5 rounded-full border text-[10px] font-medium ${skin}`}
    >
      {children}
    </span>
  );
}
