"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import Modal from "@/components/admin/Modal";
import { FieldLabel } from "@/components/admin/Overline";
import { BRAIN_COLLECTIONS, toSlug, type BrainCollection } from "@/lib/brain/collections";
import { createBrainDoc } from "./actions";

/**
 * Starting a document.
 *
 * A dialog rather than a page, because there are two fields and the thing
 * you actually want is to be writing thirty seconds from now. The address
 * is shown while the title is typed so nobody is surprised by it later:
 * the slug is derived once, at creation, and never moves, since a
 * knowledge base whose addresses change is a knowledge base whose links
 * rot.
 */
export default function NewBrainDoc() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [collection, setCollection] = useState<BrainCollection>("brand");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slug = toSlug(title);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const outcome = await createBrainDoc({ collection, title });
    setSaving(false);

    if (!outcome.ok) {
      setError(outcome.error ?? "That did not save.");
      return;
    }

    setOpen(false);
    setTitle("");
    router.push(`/admin/dashboard/brain/${collection}/${outcome.slug}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full inline-flex items-center gap-1.5"
      >
        <Plus className="w-3.5 h-3.5" />
        New document
      </button>

      <Modal open={open} onClose={() => setOpen(false)} labelledBy="new-brain-doc">
        <form onSubmit={submit} className="space-y-4">
          <h2 id="new-brain-doc" className="text-sm font-semibold text-white">
            A new document
          </h2>

          <div>
            <FieldLabel htmlFor="brain-collection">Collection</FieldLabel>
            <select
              id="brain-collection"
              value={collection}
              onChange={(event) => setCollection(event.target.value as BrainCollection)}
              className="admin-input h-11 sm:h-9 py-0 cursor-pointer"
            >
              {BRAIN_COLLECTIONS.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-zinc-400 leading-relaxed">
              {BRAIN_COLLECTIONS.find((entry) => entry.id === collection)?.hint}
            </p>
          </div>

          <div>
            <FieldLabel htmlFor="brain-title">Title</FieldLabel>
            <input
              id="brain-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="How we write a proposal"
              className="admin-input h-11 sm:h-9 py-0"
              autoFocus
            />
            <p className="mt-1.5 text-[11px] text-zinc-400 leading-relaxed font-mono break-all">
              /{collection}/{slug || "…"}
            </p>
          </div>

          {error && <p className="text-[11px] text-amber-300 leading-relaxed">{error}</p>}

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-ghost min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !slug}
              className="btn-primary min-h-[44px] sm:min-h-[36px] px-4 text-xs rounded-full inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
