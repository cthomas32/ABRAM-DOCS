"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Check,
  Copy,
  Download,
  Layers,
  Loader2,
  Pencil,
  RefreshCw,
  Share,
  Trash2,
  Upload,
} from "lucide-react";
import AbramMark from "@/components/AbramMark";
import { createClient } from "@/utils/supabase/client";
import { SOCIAL_FORMATS, SOCIAL_FORMAT_IDS, type SocialFormatId } from "@/lib/social/formats";
import { normalizeSpec, specToFilename, specToRenderPath, type SocialImageSpec } from "@/lib/social/spec";
import { saveCards, useCanShareImages } from "@/lib/social/saveImage";
import {
  approveAsset,
  approveSet,
  deleteAsset,
  deleteSet,
  setAssetStatus,
  type AssetStatus,
  type SocialAssetRow,
} from "@/app/admin/dashboard/social/actions";
import type { StudioSeed } from "./SocialStudio";

/**
 * Everything that has been made, in one grid.
 *
 * A row holds a spec, so a draft can be shown without a file existing:
 * its thumbnail comes from the render route. An approved card shows the
 * PNG in the bucket instead, which is the same picture but at the address
 * you would actually paste somewhere.
 */

const LABEL = "text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500";

type StatusFilter = AssetStatus | "all";

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "draft", label: "Drafts" },
  { id: "approved", label: "Approved" },
  { id: "archived", label: "Archived" },
  { id: "all", label: "All" },
];

/** A single card, or a whole carousel presented as one tile. */
interface LibraryEntry {
  key: string;
  setId: string | null;
  title: string;
  slides: SocialAssetRow[];
  status: AssetStatus;
  source: "studio" | "kipp";
  format: SocialFormatId;
  note: string | null;
  createdAt: string;
}

function groupEntries(rows: SocialAssetRow[]): LibraryEntry[] {
  const sets = new Map<string, SocialAssetRow[]>();
  const entries: LibraryEntry[] = [];

  for (const row of rows) {
    if (row.set_id) {
      const existing = sets.get(row.set_id);
      if (existing) existing.push(row);
      else sets.set(row.set_id, [row]);
      continue;
    }
    entries.push({
      key: row.id,
      setId: null,
      title: row.title,
      slides: [row],
      status: row.status,
      source: row.source,
      format: row.format as SocialFormatId,
      note: row.note,
      createdAt: row.created_at,
    });
  }

  for (const [setId, slides] of sets) {
    const ordered = [...slides].sort((a, b) => a.slide_index - b.slide_index);
    const first = ordered[0];
    entries.push({
      key: setId,
      setId,
      // Slide titles carry a "3/5" suffix, which is noise on the tile.
      title: first.title.replace(/\s+\d+\/\d+$/, ""),
      slides: ordered,
      // A carousel is only approved once every slide is.
      status: ordered.every((s) => s.status === "approved")
        ? "approved"
        : ordered.every((s) => s.status === "archived")
          ? "archived"
          : "draft",
      source: first.source,
      format: first.format as SocialFormatId,
      note: first.note,
      createdAt: first.created_at,
    });
  }

  return entries.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export default function SocialLibrary({
  onEdit,
  onNotify,
  refreshToken,
}: {
  onEdit: (seed: StudioSeed) => void;
  onNotify: (message: string, tone: "success" | "error") => void;
  /** Bumped by the page after a save, so the grid picks the new card up. */
  refreshToken: number;
}) {
  const [rows, setRows] = useState<SocialAssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [format, setFormat] = useState<SocialFormatId | "all">("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  // On a phone the save button opens the share sheet, so it says so.
  const canShare = useCanShareImages();

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("social_image_assets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) onNotify(error.message, "error");
    setRows((data as SocialAssetRow[]) || []);
    setLoading(false);
  }, [onNotify]);

  useEffect(() => {
    load();
  }, [load, refreshToken]);

  const entries = useMemo(() => {
    const filtered = rows.filter((row) => {
      if (format !== "all" && row.format !== format) return false;
      return true;
    });
    return groupEntries(filtered).filter((entry) => status === "all" || entry.status === status);
  }, [rows, status, format]);

  const draftCount = useMemo(
    () => groupEntries(rows).filter((entry) => entry.status === "draft").length,
    [rows]
  );
  const kippCount = useMemo(
    () => groupEntries(rows).filter((entry) => entry.source === "kipp" && entry.status === "draft").length,
    [rows]
  );

  const run = async (key: string, work: () => Promise<{ error?: string }>, success: string) => {
    setBusy(key);
    try {
      const result = await work();
      onNotify(result.error || success, result.error ? "error" : "success");
      if (!result.error) await load();
    } finally {
      setBusy(null);
    }
  };

  const handleApprove = (entry: LibraryEntry) =>
    run(
      entry.key,
      () => (entry.setId ? approveSet(entry.setId) : approveAsset(entry.slides[0].id)),
      entry.setId ? `All ${entry.slides.length} slides are published.` : "Published. The public address is ready to copy."
    );

  const handleArchive = (entry: LibraryEntry) =>
    run(
      entry.key,
      async () => {
        for (const slide of entry.slides) {
          const result = await setAssetStatus(slide.id, "archived");
          if (result.error) return result;
        }
        return {};
      },
      "Archived."
    );

  const handleDelete = (entry: LibraryEntry) => {
    const what = entry.setId ? `this ${entry.slides.length}-slide carousel` : "this card";
    const goes = entry.setId ? "The images and their addresses go with it." : "The image and its address go with it.";
    if (!window.confirm(`Delete ${what}? ${goes}`)) return;
    return run(
      entry.key,
      () => (entry.setId ? deleteSet(entry.setId) : deleteAsset(entry.slides[0].id)),
      "Deleted."
    );
  };

  const handleCopyUrl = async (entry: LibraryEntry) => {
    const urls = entry.slides.map((slide) => slide.public_url).filter(Boolean);
    if (urls.length === 0) {
      onNotify("Approve it first. A draft has no public address yet.", "error");
      return;
    }
    await navigator.clipboard.writeText(urls.join("\n"));
    setCopied(entry.key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = async (entry: LibraryEntry) => {
    setBusy(entry.key);
    try {
      // On a phone this opens the system sheet, where Save Image writes to
      // Photos and Save to Files still goes to Files.
      await saveCards(
        entry.slides.map((slide) => {
          const spec = normalizeSpec(slide.spec);
          return {
            url: slide.public_url || specToRenderPath(spec),
            filename: specToFilename(spec, entry.title),
          };
        }),
        entry.title
      );
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Could not save that.", "error");
    } finally {
      setBusy(null);
    }
  };

  const handleEdit = (entry: LibraryEntry) => {
    const specs = entry.slides.map((slide) => normalizeSpec(slide.spec));
    onEdit({
      mode: entry.setId ? "carousel" : "single",
      title: entry.title,
      note: entry.note || "",
      format: entry.format,
      // Palette, backdrop, sizes and placement belong to the set, so the
      // first slide speaks for all of them.
      theme: specs[0].theme,
      backdrop: specs[0].backdrop,
      backdropImage: specs[0].backdropImage,
      backdropCrop: specs[0].backdropCrop,
      backdropFocus: specs[0].backdropFocus,
      backdropDim: specs[0].backdropDim,
      backdropBase: specs[0].backdropBase,
      backdropCredit: specs[0].backdropCredit,
      backdropCreditSide: specs[0].backdropCreditSide,
      placement: specs[0].placement,
      grain: specs[0].grain,
      typeScale: specs[0].typeScale,
      brandScale: specs[0].brandScale,
      slides: specs,
      assetId: entry.setId ? undefined : entry.slides[0].id,
      setId: entry.setId || undefined,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="flex flex-col gap-4">
        {kippCount > 0 ? (
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            {/* The mark, never a generic AI glyph. AGENTS.md is explicit about it. */}
            <AbramMark size={16} className="shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-300 leading-relaxed">
              KIPP has {kippCount} {kippCount === 1 ? "draft" : "drafts"} waiting on you. Nothing it makes is
              published until you approve it here.
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex flex-col gap-2">
            <span className={LABEL}>Status</span>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setStatus(filter.id)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors min-h-[44px] sm:min-h-[36px] ${
                    status === filter.id
                      ? "bg-white text-black border-white"
                      : "bg-white/[0.03] text-zinc-400 border-white/8 hover:text-zinc-200"
                  }`}
                >
                  {filter.label}
                  {filter.id === "draft" && draftCount > 0 ? ` (${draftCount})` : ""}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className={LABEL}>Size</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFormat("all")}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors min-h-[44px] sm:min-h-[36px] ${
                  format === "all"
                    ? "bg-white text-black border-white"
                    : "bg-white/[0.03] text-zinc-400 border-white/8 hover:text-zinc-200"
                }`}
              >
                All
              </button>
              {SOCIAL_FORMAT_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFormat(id)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors min-h-[44px] sm:min-h-[36px] ${
                    format === id
                      ? "bg-white text-black border-white"
                      : "bg-white/[0.03] text-zinc-400 border-white/8 hover:text-zinc-200"
                  }`}
                >
                  {SOCIAL_FORMATS[id].label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={load}
            className="btn-ghost flex items-center gap-2 px-4 py-2 text-[11px] font-semibold rounded-full self-end"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading && rows.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500 py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading the library
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-6 py-14 text-center">
          <p className="text-sm text-zinc-400">Nothing here yet.</p>
          <p className="text-xs text-zinc-600 mt-1.5">
            Make a card in the studio, or wait for KIPP&apos;s next run to file some drafts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {entries.map((entry) => (
            <EntryCard
              key={entry.key}
              entry={entry}
              busy={busy === entry.key}
              copied={copied === entry.key}
              onApprove={() => handleApprove(entry)}
              onArchive={() => handleArchive(entry)}
              onDelete={() => handleDelete(entry)}
              onCopyUrl={() => handleCopyUrl(entry)}
              onDownload={() => handleDownload(entry)}
              canShare={canShare}
              onEdit={() => handleEdit(entry)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EntryCard({
  entry,
  busy,
  copied,
  onApprove,
  onArchive,
  onDelete,
  onCopyUrl,
  onDownload,
  canShare,
  onEdit,
}: {
  entry: LibraryEntry;
  busy: boolean;
  copied: boolean;
  onApprove: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onCopyUrl: () => void;
  onDownload: () => void;
  canShare: boolean;
  onEdit: () => void;
}) {
  const first = entry.slides[0];
  const spec: SocialImageSpec = normalizeSpec(first.spec);
  // An approved card shows the file at its real address, so what you see
  // here is exactly what anyone following the link would get.
  const preview = first.public_url || specToRenderPath(spec);
  const format = SOCIAL_FORMATS[entry.format] || SOCIAL_FORMATS.square;

  return (
    <div className="flex flex-col rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
      <div
        className="relative w-full bg-black/40 border-b border-white/5"
        style={{ aspectRatio: `${format.width} / ${format.height}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt={entry.title} loading="lazy" className="w-full h-full object-contain" />

        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          {entry.setId ? (
            <span className="flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-zinc-300">
              <Layers className="w-2.5 h-2.5" />
              {entry.slides.length} slides
            </span>
          ) : null}
          {entry.source === "kipp" ? (
            <span className="flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-[#8ECAFF]">
              KIPP
            </span>
          ) : null}
        </div>

        <span
          className={`absolute top-2.5 right-2.5 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest ${
            entry.status === "approved"
              ? "bg-white text-black"
              : entry.status === "archived"
                ? "bg-black/75 text-zinc-500"
                : "bg-black/75 text-amber-300"
          }`}
        >
          {entry.status}
        </span>
      </div>

      <div className="flex flex-col gap-3 p-4 flex-1">
        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-100 truncate" title={entry.title}>
            {entry.title}
          </h3>
          <p className="text-[11px] text-zinc-600">
            {format.label} {format.width}x{format.height}
          </p>
          {entry.note ? <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-3 mt-1">{entry.note}</p> : null}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
          {entry.status !== "approved" ? (
            <button
              type="button"
              onClick={onApprove}
              disabled={busy}
              className="btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold rounded-full disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              Approve
            </button>
          ) : (
            <button
              type="button"
              onClick={onCopyUrl}
              className="btn-glass flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold rounded-full"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy link"}
            </button>
          )}

          <button
            type="button"
            onClick={onDownload}
            disabled={busy}
            className="btn-glass flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold rounded-full disabled:opacity-50"
            title={canShare ? "Save to Photos or Files" : "Download the PNG"}
          >
            {canShare ? <Share className="w-3 h-3" /> : <Download className="w-3 h-3" />}
            {canShare ? "Save" : null}
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="btn-glass flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold rounded-full"
            title="Open in the studio"
          >
            <Pencil className="w-3 h-3" />
          </button>
          {entry.status !== "archived" ? (
            <button
              type="button"
              onClick={onArchive}
              disabled={busy}
              className="btn-ghost flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold rounded-full disabled:opacity-50"
              title="Archive"
            >
              <Archive className="w-3 h-3" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="btn-danger flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold rounded-full disabled:opacity-50"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
