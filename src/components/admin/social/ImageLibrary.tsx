"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Check, Copy, ImagePlus, Loader2, Pencil, Search, Trash2, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { BACKDROP_BUCKET } from "@/lib/social/backdrops";
import { formatBytes, prepareImage } from "@/lib/social/prepareImage";
import { CREDIT_SIDES, captionCredit, creditLine, type CreditSide } from "@/lib/social/spec";
import {
  deleteBackdrop,
  updateBackdrop,
  type BackdropImageRow,
} from "@/app/admin/dashboard/social/backdropActions";

/**
 * The image library: the raw pictures, before any of them is a card.
 *
 * It appears twice and is one component for a reason. In the Library tab
 * it is a gallery you upload a morning's shoot into and look through. In
 * the studio's Look panel it is a picker. Those are the same shelf seen
 * from two places, and two implementations of it would drift within a
 * week: the compression, the title rules and the credit fields all have to
 * behave identically or a picture uploaded in one place is second-class in
 * the other.
 *
 * Uploads go straight from the browser to the bucket. A server action
 * carries its arguments in the request body and Next caps that at a
 * megabyte, so routing a photograph through one would mean only small
 * photographs. Row level security is the same either way, and the bucket
 * enforces what matters: three image types and twelve megabytes.
 */

const LABEL = "text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500";
const INPUT =
  "w-full bg-white/[0.03] border border-white/8 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-colors";

/** Matches the bucket's own limit, so a file is refused here rather than by a 413. */
const MAX_BYTES = 12 * 1024 * 1024;

/**
 * A file this big is refused before it is decoded. Scaling would very
 * likely bring it under the bucket's limit, but decoding a hundred
 * megapixels to find that out locks the tab up first.
 */
const MAX_SOURCE_BYTES = 60 * 1024 * 1024;

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

/** A story is 1920 tall, so anything shorter than this is going to be soft. */
const SMALL_EDGE = 1400;

/** Below this the search box is more furniture than help. */
const SEARCH_FROM = 8;

function Chip({
  active,
  onClick,
  children,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors min-h-[44px] sm:min-h-[36px] disabled:opacity-30 ${
        active
          ? "bg-white text-black border-white"
          : "bg-white/[0.03] text-zinc-400 border-white/8 hover:text-zinc-200 hover:border-white/15"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * The title and the credit on one image, and where that credit lands.
 *
 * Its own component with its own state, so typing a title is not a
 * re-render of the grid above it, and keyed on the row id by the caller so
 * switching images loads the new values without an effect to sync them.
 *
 * Two fields for the credit rather than one, because they do different
 * jobs. The name is the courtesy and goes on the card. The handle is the
 * part that reaches the person: pasted into a caption it tags them, they
 * are told, and their audience finds out where the picture went. Either
 * one on its own is a valid credit, which is why neither is required.
 */
function Details({
  image,
  onCreditChange,
  onSaved,
  onNotify,
}: {
  image: BackdropImageRow;
  /** Push the assembled line onto the card being edited, or clear it. */
  onCreditChange?: (line: string) => void;
  onSaved: (patch: Partial<BackdropImageRow>) => void;
  onNotify: (message: string, tone: "success" | "error") => void;
}) {
  const [label, setLabel] = useState(image.label);
  const [credit, setCredit] = useState(image.credit || "");
  const [handle, setHandle] = useState(image.credit_handle || "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const dirty =
    label !== image.label ||
    credit !== (image.credit || "") ||
    handle !== (image.credit_handle || "");

  /** What a card would draw, from what is in the boxes right now. */
  const line = creditLine(credit, handle);

  const save = async () => {
    setSaving(true);
    const result = await updateBackdrop(image.id, { label, credit, handle });
    setSaving(false);
    if (result.error) {
      onNotify(result.error, "error");
      return;
    }

    const cleanHandle = handle.trim().replace(/^@+/, "") || null;
    onSaved({ label: label.trim(), credit: credit.trim() || null, credit_handle: cleanHandle });
    // The card is drawing the old line until this happens, and a saved
    // credit that has not reached the picture is the failure people notice.
    onCreditChange?.(line);
    onNotify("Saved.", "success");
  };

  const copyCaption = async () => {
    await navigator.clipboard.writeText(captionCredit(credit, handle));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saved =
    image.original_bytes && image.bytes && image.original_bytes > image.bytes
      ? Math.round((1 - image.bytes / image.original_bytes) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className={LABEL}>Title</span>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Rain on a night exterior"
          className={INPUT}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <span className={LABEL}>Creator</span>
          <input
            type="text"
            value={credit}
            onChange={(e) => setCredit(e.target.value)}
            placeholder="Their name"
            className={INPUT}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={LABEL}>Their handle</span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-600 pointer-events-none">
              @
            </span>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value.replace(/^@+/, "").replace(/\s+/g, ""))}
              placeholder="instagram or wherever"
              className={`${INPUT} pl-7`}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void copyCaption()}
        disabled={!line}
        className="btn-ghost flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] font-semibold rounded-full disabled:opacity-30 w-full sm:w-auto sm:self-start"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "Copied" : "Copy for the caption"}
      </button>

      <span className="text-[11px] text-zinc-600 leading-relaxed">
        {line
          ? `A card built on this draws "${line}" small and faint along the bottom. Paste the caption line into the post as well: the tag is the half they actually see.`
          : "Fill in either one and a card built on this credits them along the bottom, small and faint."}
      </span>

      <span className="text-[11px] text-zinc-600 leading-relaxed">
        {image.width && image.height ? `${image.width} x ${image.height}` : "Size unknown"}
        {image.bytes ? `, ${formatBytes(image.bytes)}` : ""}
        {saved > 0 ? `, ${saved}% smaller than the file you chose` : ""}
        {". KIPP asks for an image by its title, so make it one you would type."}
      </span>

      {/* Full width and last on a phone, which is where a thumb reaches.
          Delete is deliberately not down here with it: the destructive
          control does not get the easiest target on the screen. It is in
          the header instead, where reaching for it is a decision. */}
      <button
        type="button"
        onClick={() => void save()}
        disabled={!dirty || saving}
        className="btn-primary flex items-center justify-center gap-2 px-5 py-2.5 text-[11px] font-semibold rounded-full disabled:opacity-40 min-h-[44px] w-full sm:w-auto sm:self-end"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
        {saving ? "Saving" : "Save details"}
      </button>
    </div>
  );
}

/**
 * The editor for one image: a dialog on a desktop, a page on a phone.
 *
 * It used to be a panel that opened at the bottom of the grid, which is
 * fine at twelve images and useless at two hundred: tapping the third one
 * scrolled you past the other hundred and ninety-seven to reach the boxes.
 * The picture has to come to you.
 *
 * One element, two shapes. Below `sm` it is `inset-0` and reads as a
 * screen you went to and come back from, with a Back control where a phone
 * puts one. From `sm` up it centres as a dialog over a dimmed grid. The
 * split is a media query rather than two components, because they are the
 * same content and the same state and keeping them apart is how one of
 * them quietly stops working.
 */
function DetailOverlay({
  image,
  onClose,
  onCreditChange,
  onSaved,
  onDelete,
  onNotify,
}: {
  image: BackdropImageRow;
  onClose: () => void;
  onCreditChange?: (line: string) => void;
  onSaved: (patch: Partial<BackdropImageRow>) => void;
  onDelete: () => void;
  onNotify: (message: string, tone: "success" | "error") => void;
}) {
  // Escape closes it, and the page underneath stops scrolling while it is
  // open. Both are the rules in AGENTS.md for anything that covers the
  // screen, and both are the things you notice only when they are missing.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-6">
      {/* Tapping off it closes it. Only reachable from `sm` up, since the
          panel covers the screen on a phone. */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-default"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={image.label}
        className="relative w-full h-full sm:h-auto sm:max-h-[88vh] sm:max-w-2xl bg-[#0A0A0A] sm:rounded-2xl sm:border sm:border-white/10 flex flex-col overflow-hidden"
      >
        {/* Back on a phone, a close cross on a desktop. The same button,
            because they are the same action and a phone calls it Back. */}
        <div className="flex items-center gap-2 px-3 sm:px-5 py-3 border-b border-white/8 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 -ml-1 px-2 py-2 rounded-full text-zinc-400 hover:text-white transition-colors min-h-[44px] sm:hidden"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-xs font-semibold">Library</span>
          </button>
          <span className="flex-1 text-xs font-semibold text-zinc-300 truncate">{image.label}</span>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${image.label}`}
            className="flex items-center justify-center w-11 h-11 sm:w-9 sm:h-9 rounded-full text-zinc-500 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="hidden sm:flex items-center justify-center w-11 h-11 sm:w-9 sm:h-9 rounded-full text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 flex flex-col gap-4">
          <div
            className="w-full rounded-xl overflow-hidden border border-white/8 flex items-center justify-center"
            style={{ backgroundColor: image.base_color }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.public_url}
              alt={image.label}
              className="max-h-[38vh] sm:max-h-[300px] w-auto max-w-full object-contain"
            />
          </div>

          <Details key={image.id} image={image} onCreditChange={onCreditChange} onSaved={onSaved} onNotify={onNotify} />
        </div>
      </div>
    </div>
  );
}

export default function ImageLibrary({
  mode,
  selectedPath,
  onSelect,
  creditSide,
  onCreditSide,
  onCreditChange,
  onNotify,
  refreshToken,
}: {
  /** `browse` is the gallery in the Library tab, `pick` is the studio's. */
  mode: "browse" | "pick";
  /** Pick mode: the storage path the card is currently drawn on. */
  selectedPath?: string;
  /** Pick mode: null when the picture is being taken off the card. */
  onSelect?: (image: BackdropImageRow | null) => void;
  creditSide?: CreditSide;
  onCreditSide?: (next: CreditSide) => void;
  onCreditChange?: (line: string) => void;
  onNotify: (message: string, tone: "success" | "error") => void;
  refreshToken?: number;
}) {
  const [images, setImages] = useState<BackdropImageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [dragging, setDragging] = useState(false);
  const [query, setQuery] = useState("");
  /** Which image the overlay is showing, in either mode. */
  const [editingId, setEditingId] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const picking = mode === "pick";

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("social_backdrop_images")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) onNotify(error.message, "error");
    setImages((data as BackdropImageRow[]) || []);
    setLoading(false);
  }, [onNotify]);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  /** Title and credit both, because you look for a picture by either. */
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return images;
    return images.filter(
      (image) =>
        image.label.toLowerCase().includes(needle) ||
        (image.credit || "").toLowerCase().includes(needle) ||
        (image.credit_handle || "").toLowerCase().includes(needle)
    );
  }, [images, query]);

  const editing = images.find((image) => image.id === editingId) || null;
  /** Pick mode: the one the card is drawn on, whether or not it is open. */
  const selected = picking
    ? images.find((image) => image.storage_path === selectedPath) || null
    : null;

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;

    setUploading(true);
    setProgress({ done: 0, total: list.length });
    const supabase = createClient();
    let landed = 0;
    let saved = 0;
    let last: BackdropImageRow | null = null;

    for (const file of list) {
      if (!ACCEPTED.includes(file.type)) {
        onNotify(`${file.name} is a ${file.type || "file of unknown type"}. Use a JPG, PNG or WebP.`, "error");
        setProgress((p) => ({ ...p, done: p.done + 1 }));
        continue;
      }
      if (file.size > MAX_SOURCE_BYTES) {
        onNotify(`${file.name} is ${formatBytes(file.size)}, which is too big to open here.`, "error");
        setProgress((p) => ({ ...p, done: p.done + 1 }));
        continue;
      }

      let prepared;
      try {
        prepared = await prepareImage(file);
      } catch {
        onNotify(`${file.name} could not be read as an image.`, "error");
        setProgress((p) => ({ ...p, done: p.done + 1 }));
        continue;
      }

      // Only reachable when scaling did not help, which means a picture
      // already inside the long edge and still enormous.
      if (prepared.blob.size > MAX_BYTES) {
        onNotify(`${file.name} is ${formatBytes(prepared.blob.size)} even after scaling. Twelve is the limit.`, "error");
        setProgress((p) => ({ ...p, done: p.done + 1 }));
        continue;
      }

      if (Math.min(prepared.width, prepared.height) < SMALL_EDGE) {
        onNotify(
          `${file.name} is ${prepared.width} by ${prepared.height}. It will be soft on a story, which is 1080 by 1920.`,
          "error"
        );
      }

      const storagePath = `uploads/${crypto.randomUUID()}.${prepared.extension}`;

      const { error: uploadError } = await supabase.storage
        .from(BACKDROP_BUCKET)
        .upload(storagePath, prepared.blob, {
          contentType: prepared.contentType,
          cacheControl: "31536000",
          upsert: false,
        });

      if (uploadError) {
        onNotify(`${file.name}: ${uploadError.message}`, "error");
        setProgress((p) => ({ ...p, done: p.done + 1 }));
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(BACKDROP_BUCKET).getPublicUrl(storagePath);

      const { data: inserted, error: rowError } = await supabase
        .from("social_backdrop_images")
        .insert({
          label: file.name.replace(/\.[^.]+$/, "").slice(0, 120) || "Untitled image",
          storage_path: storagePath,
          public_url: publicUrl,
          base_color: prepared.colour,
          width: prepared.width,
          height: prepared.height,
          bytes: prepared.blob.size,
          original_bytes: prepared.originalBytes,
        })
        .select("*")
        .single();

      if (rowError) {
        // The file is in the bucket and nothing points at it, so take it
        // back out rather than leaving an orphan behind.
        await supabase.storage.from(BACKDROP_BUCKET).remove([storagePath]);
        onNotify(`${file.name}: ${rowError.message}`, "error");
        setProgress((p) => ({ ...p, done: p.done + 1 }));
        continue;
      }

      landed += 1;
      last = inserted as BackdropImageRow;
      if (prepared.changed) saved += prepared.originalBytes - prepared.blob.size;
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    setUploading(false);
    setProgress({ done: 0, total: 0 });

    if (landed > 0) {
      await load();
      // The last one that lands is what you wanted if you uploaded one, and
      // harmless if you uploaded sixty: in the gallery it opens for a title,
      // and in the studio it goes on the card.
      if (last) {
        if (picking) onSelect?.(last);
        // One file is somebody adding a picture they mean to use, so the
        // boxes open. Sixty is a shoot being filed, and sixty modals would
        // be sixty things to dismiss.
        if (list.length === 1) setEditingId(last.id);
      }
      // Saying what the scaling saved is the only way anybody finds out it
      // happened, and the number is usually the argument for doing it.
      const note = saved > 0 ? ` ${formatBytes(saved)} saved by scaling.` : "";
      onNotify(
        (landed === 1 ? "Image added, and it needs a title." : `${landed} images added.`) + note,
        "success"
      );
    }
  };

  const remove = async (row: BackdropImageRow) => {
    if (
      !window.confirm(
        `Delete "${row.label}"? Cards already approved on it keep their picture, because an approved card is a PNG. Any draft using it comes out on a flat colour.`
      )
    ) {
      return;
    }

    const result = await deleteBackdrop(row.id);
    if (result.error) {
      onNotify(result.error, "error");
      return;
    }
    if (picking && selectedPath === row.storage_path) onSelect?.(null);
    if (editingId === row.id) setEditingId(null);
    setImages((prev) => prev.filter((image) => image.id !== row.id));
    onNotify("Deleted.", "success");
  };

  const patchRow = (id: string, patch: Partial<BackdropImageRow>) =>
    setImages((prev) => prev.map((image) => (image.id === id ? { ...image, ...patch } : image)));

  /**
   * One picture in the grid.
   *
   * What a tap does differs by mode, and it has to. In the gallery the
   * only thing you can want is the picture itself, so it opens. In the
   * studio the thing you want is that picture on the card, so it selects,
   * and a separate corner button opens the editor. Making a tap mean
   * "select and open" in the studio would put a dialog over the preview
   * you were trying to look at.
   *
   * The corner buttons are visible on touch and appear on hover on a
   * desktop. They were hover-only, which on a phone is a control that does
   * not exist.
   */
  const tile = (image: BackdropImageRow) => {
    const active = picking ? selectedPath === image.storage_path : editingId === image.id;
    return (
      <div key={image.id} className="relative group flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => (picking ? onSelect?.(image) : setEditingId(image.id))}
          title={
            image.credit || image.credit_handle
              ? `${image.label} — ${creditLine(image.credit, image.credit_handle)}`
              : image.label
          }
          className={`w-full aspect-square rounded-xl overflow-hidden border transition-colors ${
            active ? "border-white" : "border-white/8 hover:border-white/25"
          }`}
          style={{ backgroundColor: image.base_color }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.public_url} alt={image.label} loading="lazy" className="w-full h-full object-cover" />
        </button>

        {/* The title under the tile. A wall of squares is unsearchable by
            eye, and a tooltip only helps once you have guessed which one
            to hover, which on a phone is never. */}
        <div className="flex flex-col px-0.5">
          <span className="text-[11px] text-zinc-400 leading-tight line-clamp-2">{image.label}</span>
          {image.credit || image.credit_handle ? (
            <span className="text-[10px] text-zinc-600 leading-tight truncate">
              {creditLine(image.credit, image.credit_handle)}
            </span>
          ) : (
            <span className="text-[10px] text-amber-400/50 leading-tight">No credit</span>
          )}
        </div>

        {active ? (
          <span className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-white text-black flex items-center justify-center">
            <Check className="w-3 h-3" />
          </span>
        ) : null}

        <div className="absolute top-1 right-1 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
          {picking ? (
            <button
              type="button"
              onClick={() => setEditingId(image.id)}
              aria-label={`Edit ${image.label}`}
              className="w-11 h-11 sm:w-9 sm:h-9 rounded-full bg-black/70 text-zinc-300 hover:text-white flex items-center justify-center"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void remove(image)}
            aria-label={`Delete ${image.label}`}
            className="w-11 h-11 sm:w-9 sm:h-9 rounded-full bg-black/70 text-zinc-400 hover:text-white flex items-center justify-center"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const dropZone = (children: React.ReactNode) => (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void upload(e.dataTransfer.files);
      }}
      className={`grid gap-3 rounded-2xl p-3 border transition-colors ${
        picking ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      } ${dragging ? "border-white/30 bg-white/[0.04]" : "border-white/5"}`}
    >
      {children}
    </div>
  );

  const uploadTile = (
    <button
      type="button"
      onClick={() => input.current?.click()}
      disabled={uploading}
      className="aspect-square rounded-xl border border-dashed border-white/15 bg-white/[0.02] flex flex-col items-center justify-center gap-1.5 text-zinc-500 hover:text-zinc-200 hover:border-white/30 transition-colors disabled:opacity-40"
    >
      {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
      <span className="text-[10px] font-semibold">
        {uploading ? `${progress.done} of ${progress.total}` : "Upload"}
      </span>
    </button>
  );

  const fileInput = (
    <input
      ref={input}
      type="file"
      accept={ACCEPTED.join(",")}
      multiple
      hidden
      onChange={(e) => {
        if (e.target.files) void upload(e.target.files);
        e.target.value = "";
      }}
    />
  );

  const overlay = editing ? (
    <DetailOverlay
      image={editing}
      onClose={() => setEditingId(null)}
      onCreditChange={onCreditChange}
      onSaved={(patch) => patchRow(editing.id, patch)}
      onDelete={() => void remove(editing)}
      onNotify={onNotify}
    />
  ) : null;

  // -------------------------------------------------------------------
  // The studio's picker
  // -------------------------------------------------------------------
  if (picking) {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className={LABEL}>Image library</span>
          <span className="text-[10px] text-zinc-600">
            {images.length === 0 ? "JPG, PNG or WebP" : `${images.length} in the library`}
          </span>
        </div>

        {images.length > SEARCH_FROM ? (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find by title or credit"
              className={`${INPUT} pl-9`}
            />
          </div>
        ) : null}

        {dropZone(
          <>
            {uploadTile}

            {/* None, so a picture can be taken off without picking a sky */}
            <button
              type="button"
              onClick={() => onSelect?.(null)}
              className={`aspect-square rounded-xl border flex items-center justify-center text-[10px] font-semibold transition-colors ${
                selectedPath
                  ? "border-white/8 bg-white/[0.02] text-zinc-500 hover:text-zinc-200 hover:border-white/20"
                  : "border-white bg-white text-black"
              }`}
            >
              None
            </button>

            {loading ? (
              <div className="aspect-square rounded-xl border border-white/5 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
              </div>
            ) : null}

            {shown.map(tile)}
          </>
        )}

        {fileInput}

        {/* Where this picture's credit sits on THIS card, which is a
            property of the card rather than of the picture, so it stays
            here rather than going into the editor with the name. */}
        {selected ? (
          <div className="flex flex-col gap-2.5 rounded-2xl border border-white/8 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between gap-3">
              <span className={LABEL}>Credit</span>
              <button
                type="button"
                onClick={() => setEditingId(selected.id)}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 hover:text-zinc-100 transition-colors min-h-[44px] sm:min-h-[36px]"
              >
                <Pencil className="w-3 h-3" />
                Edit details
              </button>
            </div>

            {creditLine(selected.credit, selected.credit_handle) ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {CREDIT_SIDES.map((option) => (
                    <Chip
                      key={option.id}
                      active={creditSide === option.id}
                      onClick={() => onCreditSide?.(option.id)}
                    >
                      {option.label}
                    </Chip>
                  ))}
                </div>
                <span className="text-[11px] text-zinc-600 leading-relaxed">
                  The card draws {creditLine(selected.credit, selected.credit_handle)} small and faint
                  along the bottom.
                </span>
              </>
            ) : (
              <span className="text-[11px] text-amber-400/70 leading-relaxed">
                Nobody is credited on this one. Open the details and say who took it.
              </span>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-zinc-600 leading-relaxed">
            Drop files anywhere on this panel, or manage the whole library under the Library tab. A
            picture is cropped to fill the card, so it wants to be at least 1400 on its short edge for
            a story.
          </span>
        )}

        {overlay}
      </div>
    );
  }

  // -------------------------------------------------------------------
  // The gallery
  // -------------------------------------------------------------------
  const uncredited = images.filter((image) => !creditLine(image.credit, image.credit_handle)).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find by title, creator or handle"
            className={`${INPUT} pl-9`}
          />
        </div>
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={uploading}
          className="btn-primary flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-full disabled:opacity-50 shrink-0"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
          {uploading ? `Uploading ${progress.done} of ${progress.total}` : "Upload images"}
        </button>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-[11px] text-zinc-500">
          {images.length === 0
            ? "Nothing here yet."
            : `${images.length} ${images.length === 1 ? "image" : "images"}${
                query.trim() ? `, ${shown.length} matching` : ""
              }`}
        </span>
        {/* Named rather than left to be noticed. An uncredited picture is
            the one thing in here that can go out wrong. */}
        {uncredited > 0 ? (
          <span className="text-[11px] text-amber-400/70">
            {uncredited} with nobody credited.
          </span>
        ) : null}
      </div>

      {dropZone(
        <>
          {uploadTile}
          {loading ? (
            <div className="aspect-square rounded-xl border border-white/5 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
            </div>
          ) : null}
          {shown.map(tile)}
        </>
      )}

      {!loading && images.length > 0 && shown.length === 0 ? (
        <span className="text-[11px] text-zinc-600">Nothing in the library matches that.</span>
      ) : null}

      {fileInput}

      <span className="text-[11px] text-zinc-600 leading-relaxed max-w-3xl">
        Drop files anywhere on the grid. Anything over 2560 on its long edge is scaled on the way in,
        which is more than the largest card ever draws. A picture is cropped to fill, so it wants to be
        at least 1400 on its short edge for a story. Tap one to give it a title and say who took it.
      </span>

      {overlay}
    </div>
  );
}
