"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  Check,
  Copy,
  ImagePlus,
  Images,
  Loader2,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { BACKDROP_BUCKET, backdropThumbUrl } from "@/lib/social/backdrops";
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
 * the studio it is a picker. Those are the same shelf seen from two
 * places, and two implementations of it would drift within a week: the
 * compression, the title rules and the credit fields all have to behave
 * identically or a picture uploaded in one place is second-class in the
 * other.
 *
 * Uploads go straight from the browser to the bucket. A server action
 * carries its arguments in the request body and Next caps that at a
 * megabyte, so routing a photograph through one would mean only small
 * photographs. Row level security is the same either way, and the bucket
 * enforces what matters: three image types and twelve megabytes.
 *
 * ## It does not load the library
 *
 * Two things used to make this fall over as the shelf filled up, and both
 * were invisible at a dozen pictures.
 *
 * It asked for every row and drew every tile. Fine at fifteen; at three
 * hundred it is three hundred DOM nodes and a scrollbar nobody can aim.
 * So it reads a page at a time and fetches the next when you reach the
 * bottom, and the search runs against the table rather than against
 * whatever happens to be loaded — a search that only finds what you have
 * already scrolled past is worse than no search.
 *
 * And each tile pointed at the full upload. A picture is scaled to 2560 on
 * its long edge on the way in, which is right for a story and absurd for a
 * square 180 across, so the grid was pulling about a megabyte per tile.
 * The storage layer resizes on request and caches the answer, and the same
 * picture arrives at roughly 25 kilobytes. Full files are still what the
 * renderer draws a card from.
 *
 * ## In the studio it is a room you go into
 *
 * The picker used to be the whole grid, open, in the middle of the Look
 * panel, between the palette and the crop controls. That is a wall of
 * squares sitting on top of controls you need while you are looking at the
 * card, and it only gets taller. Now the panel shows the one picture the
 * card is on, and choosing a different one opens the library over the top:
 * you go in, look, pick, and come back out to the card.
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

/**
 * How many pictures a page of the grid is.
 *
 * Enough that the first screenful is full on a wide monitor and the
 * second is already there by the time you reach it, small enough that
 * opening the library on a phone is not a hundred requests.
 */
const PAGE_SIZE = 36;

/** The square a tile draws at, allowing for a dense display. */
const TILE_PX = 400;

/** The detail view, where the shape of the picture is the point. */
const DETAIL_PX = 1200;

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
 * A picture at a sensible size, with the original as the safety net.
 *
 * The resized address is a different service from the one the file is
 * stored on. If it is ever unavailable the right outcome is a slow tile
 * rather than a broken one, so a failure falls back to the full upload
 * once and then stops trying.
 */
function Thumb({
  image,
  width,
  height,
  resize,
  className,
}: {
  image: BackdropImageRow;
  width: number;
  height?: number;
  resize?: "cover" | "contain";
  className: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = failed
    ? image.public_url
    : backdropThumbUrl(image.storage_path, { width, height, resize }) || image.public_url;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={image.label}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
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
 * A panel that covers the screen on a phone and is a dialog on a desktop.
 *
 * Both overlays in this file are this shape, so it is written once. Below
 * `sm` it is `inset-0` and reads as a screen you went to and come back
 * from, with a Back control where a phone puts one. From `sm` up it
 * centres over a dimmed page. The split is a media query rather than two
 * components, because they are the same content and the same state and
 * keeping them apart is how one of them quietly stops working.
 *
 * Escape closes it and the page underneath stops scrolling while it is
 * open, which are the rules in AGENTS.md for anything that covers the
 * screen and the things you only notice when they are missing. The
 * previous overflow is restored rather than cleared, so the chooser is
 * still locked when a detail panel opened on top of it closes again.
 */
function Overlay({
  title,
  onClose,
  backLabel,
  actions,
  width = "sm:max-w-2xl",
  z = "z-50",
  children,
}: {
  title: string;
  onClose: () => void;
  /** What the phone's Back control says it goes back to. */
  backLabel: string;
  /** Anything that belongs in the header beside the close control. */
  actions?: React.ReactNode;
  width?: string;
  z?: string;
  children: React.ReactNode;
}) {
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
    <div className={`fixed inset-0 ${z} flex sm:items-center sm:justify-center sm:p-6`}>
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
        aria-label={title}
        className={`relative w-full h-full sm:h-auto sm:max-h-[88vh] ${width} bg-[#0A0A0A] sm:rounded-2xl sm:border sm:border-white/10 flex flex-col overflow-hidden`}
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
            <span className="text-xs font-semibold">{backLabel}</span>
          </button>
          <span className="flex-1 text-xs font-semibold text-zinc-300 truncate">{title}</span>
          {actions}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="hidden sm:flex items-center justify-center w-11 h-11 sm:w-9 sm:h-9 rounded-full text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

/**
 * The editor for one image.
 *
 * It used to be a panel that opened at the bottom of the grid, which is
 * fine at twelve images and useless at two hundred: tapping the third one
 * scrolled you past the other hundred and ninety-seven to reach the boxes.
 * The picture has to come to you.
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
  return (
    <Overlay
      title={image.label}
      backLabel="Library"
      onClose={onClose}
      // Above the chooser, since it opens from inside it.
      z="z-[60]"
      actions={
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${image.label}`}
          className="flex items-center justify-center w-11 h-11 sm:w-9 sm:h-9 rounded-full text-zinc-500 hover:text-red-400 hover:bg-white/5 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      }
    >
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 flex flex-col gap-4">
        <div
          className="w-full rounded-xl overflow-hidden border border-white/8 flex items-center justify-center"
          style={{ backgroundColor: image.base_color }}
        >
          <Thumb
            image={image}
            width={DETAIL_PX}
            height={DETAIL_PX}
            resize="contain"
            className="max-h-[38vh] sm:max-h-[300px] w-auto max-w-full object-contain"
          />
        </div>

        <Details key={image.id} image={image} onCreditChange={onCreditChange} onSaved={onSaved} onNotify={onNotify} />
      </div>
    </Overlay>
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
  /** How many rows match, which is not how many are loaded. */
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [dragging, setDragging] = useState(false);
  const [query, setQuery] = useState("");
  /** The query the table has actually been asked about. */
  const [needle, setNeedle] = useState("");
  /** Which image the overlay is showing, in either mode. */
  const [editingId, setEditingId] = useState<string | null>(null);
  /** Pick mode: whether the library is open over the card. */
  const [choosing, setChoosing] = useState(false);
  /**
   * The picture the card is on, held here as well as in the grid.
   *
   * The studio needs to show it in the collapsed panel, and once the grid
   * is paged there is no promise it is on the loaded page: a card built on
   * something uploaded in March is on page four. So it is fetched by path,
   * once, and kept whatever the grid is currently showing.
   */
  const [selected, setSelected] = useState<BackdropImageRow | null>(null);
  const input = useRef<HTMLInputElement>(null);
  /** The page most recently asked for, so the sentinel cannot ask twice. */
  const page = useRef(0);

  const picking = mode === "pick";

  /** Typing is not a query per keystroke. */
  useEffect(() => {
    const timer = setTimeout(() => setNeedle(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  /**
   * One page of the shelf.
   *
   * The search runs in the table rather than over the loaded rows, because
   * a search that only finds what you have already scrolled past is worse
   * than no search at all. PostgREST reads `or` as a grammar, so a comma
   * or a bracket in what somebody typed would be read as syntax: those
   * characters are dropped rather than escaped, since none of them belongs
   * in a title anyway.
   */
  const fetchPage = useCallback(
    async (which: number, search: string) => {
      const supabase = createClient();
      let request = supabase
        .from("social_backdrop_images")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(which * PAGE_SIZE, which * PAGE_SIZE + PAGE_SIZE - 1);

      const safe = search.replace(/[,()%\\*]/g, " ").trim();
      if (safe) {
        request = request.or(
          `label.ilike.%${safe}%,credit.ilike.%${safe}%,credit_handle.ilike.%${safe}%`
        );
      }

      const { data, error, count } = await request;
      if (error) {
        onNotify(error.message, "error");
        return { rows: [] as BackdropImageRow[], count: 0 };
      }
      return { rows: (data as BackdropImageRow[]) || [], count: count ?? 0 };
    },
    [onNotify]
  );

  /** Back to the first page. Every change of what is being asked for. */
  const reload = useCallback(
    async (search: string) => {
      setLoading(true);
      page.current = 0;
      const { rows, count } = await fetchPage(0, search);
      setImages(rows);
      setTotal(count);
      setLoading(false);
    },
    [fetchPage]
  );

  useEffect(() => {
    void reload(needle);
  }, [reload, needle, refreshToken]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore) return;
    setLoadingMore(true);
    const next = page.current + 1;
    const { rows, count } = await fetchPage(next, needle);
    page.current = next;
    setTotal(count);
    // Uploads land at the top and push everything down a place, so a page
    // boundary can hand back a row that is already here. Keyed by id, the
    // duplicate is absorbed instead of drawn twice with the same React key.
    setImages((prev) => {
      const byId = new Map(prev.map((image) => [image.id, image]));
      for (const row of rows) byId.set(row.id, row);
      return Array.from(byId.values());
    });
    setLoadingMore(false);
  }, [fetchPage, loading, loadingMore, needle]);

  const hasMore = images.length < total;

  /**
   * Reaching the bottom asks for the next page.
   *
   * A ref callback rather than an effect on a ref, because the sentinel is
   * only in the tree while there is more to fetch and an effect would have
   * to chase it appearing and disappearing. The button stays under it
   * regardless: an observer is a convenience, not the only way through.
   */
  const sentinel = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) void loadMore();
        },
        { rootMargin: "400px" }
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [loadMore]
  );

  /**
   * The picture the card is on, whether or not it is on the loaded page.
   *
   * Read from the grid first, since that covers the case that matters most
   * — you just picked it — and falls back to a single query by path.
   */
  useEffect(() => {
    if (!picking) return;
    if (!selectedPath) {
      setSelected(null);
      return;
    }
    const here = images.find((image) => image.storage_path === selectedPath);
    if (here) {
      setSelected(here);
      return;
    }
    if (selected?.storage_path === selectedPath) return;

    let cancelled = false;
    void (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("social_backdrop_images")
        .select("*")
        .eq("storage_path", selectedPath)
        .maybeSingle();
      if (!cancelled) setSelected((data as BackdropImageRow) || null);
    })();
    return () => {
      cancelled = true;
    };
  }, [picking, selectedPath, images, selected]);

  const editing =
    images.find((image) => image.id === editingId) ||
    (selected?.id === editingId ? selected : null);

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
      // A search still running would hide what just arrived, which reads
      // as the upload having failed. Clearing it reloads on its own.
      if (needle) {
        setQuery("");
        setNeedle("");
      } else {
        await reload("");
      }
      // The last one that lands is what you wanted if you uploaded one, and
      // harmless if you uploaded sixty: in the gallery it opens for a title,
      // and in the studio it goes on the card.
      if (last) {
        if (picking) {
          setSelected(last);
          onSelect?.(last);
        }
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
    if (picking && selectedPath === row.storage_path) {
      setSelected(null);
      onSelect?.(null);
    }
    if (editingId === row.id) setEditingId(null);
    setImages((prev) => prev.filter((image) => image.id !== row.id));
    setTotal((n) => Math.max(0, n - 1));
    onNotify("Deleted.", "success");
  };

  const patchRow = (id: string, patch: Partial<BackdropImageRow>) => {
    setImages((prev) => prev.map((image) => (image.id === id ? { ...image, ...patch } : image)));
    setSelected((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
  };

  /**
   * One picture in the grid.
   *
   * What a tap does differs by mode, and it has to. In the gallery the
   * only thing you can want is the picture itself, so it opens. In the
   * chooser the thing you want is that picture on the card, so it selects
   * and closes: you came in here to make one decision. A corner button
   * opens the editor for the times you came in to fix a title instead.
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
          onClick={() => {
            if (!picking) {
              setEditingId(image.id);
              return;
            }
            setSelected(image);
            onSelect?.(image);
            setChoosing(false);
          }}
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
          <Thumb image={image} width={TILE_PX} height={TILE_PX} className="w-full h-full object-cover" />
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

        {/* One corner control, not two.
            A 44 pixel target is the rule and a tile on a phone is about
            150 across, so two of them side by side cover the picture you
            are trying to look at. Each mode therefore gets the one that
            belongs to it: the chooser gets the pencil, because deleting a
            picture while picking one is a mis-tap rather than an
            intention, and the gallery gets the bin, because a tap there
            already opens the editor. Neither loses anything — the editor
            carries delete in its own header. */}
        <div className="absolute top-1 right-1 flex opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
          {picking ? (
            <button
              type="button"
              onClick={() => setEditingId(image.id)}
              aria-label={`Edit ${image.label}`}
              className="w-11 h-11 sm:w-9 sm:h-9 rounded-full bg-black/70 text-zinc-300 hover:text-white flex items-center justify-center"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void remove(image)}
              aria-label={`Delete ${image.label}`}
              className="w-11 h-11 sm:w-9 sm:h-9 rounded-full bg-black/70 text-zinc-400 hover:text-white flex items-center justify-center"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const dropZone = (children: React.ReactNode, columns: string) => (
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
      className={`grid gap-3 rounded-2xl p-3 border transition-colors ${columns} ${
        dragging ? "border-white/30 bg-white/[0.04]" : "border-white/5"
      }`}
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

  const searchBox = (placeholder: string) => (
    <div className="relative">
      <Search className="w-3.5 h-3.5 text-zinc-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className={`${INPUT} pl-9`}
      />
      {query && loading ? (
        <Loader2 className="w-3.5 h-3.5 text-zinc-600 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
      ) : null}
    </div>
  );

  /**
   * The end of the grid, and the way past it.
   *
   * The sentinel and the button are the same control said twice. The
   * observer is the one people use without noticing; the button is what
   * happens when an observer never fires, which is a keyboard, a reduced
   * motion setting, or a browser that is having a bad day. There is no
   * empty state down here on purpose — both callers already say what they
   * found above the grid, and saying it twice reads as two failures.
   */
  const foot = hasMore ? (
    <div ref={sentinel} className="flex justify-center pt-1">
      <button
        type="button"
        onClick={() => void loadMore()}
        disabled={loadingMore}
        className="btn-ghost flex items-center gap-2 px-5 py-2.5 text-[11px] font-semibold rounded-full disabled:opacity-40 min-h-[44px]"
      >
        {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
        {loadingMore ? "Loading" : `Load more (${total - images.length} to go)`}
      </button>
    </div>
  ) : null;

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
    const line = selected ? creditLine(selected.credit, selected.credit_handle) : "";

    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className={LABEL}>Image</span>
          <span className="text-[10px] text-zinc-600">
            {total === 0 ? "JPG, PNG or WebP" : `${total} in the library`}
          </span>
        </div>

        {/* What the card is on, and the way back into the shelf. Dropping
            a file here uploads it and puts it on the card, which is the
            fast path for a picture somebody has just been sent. */}
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
          className={`flex items-center gap-3 rounded-2xl border p-2.5 transition-colors ${
            dragging ? "border-white/30 bg-white/[0.04]" : "border-white/8 bg-white/[0.02]"
          }`}
        >
          <div
            className="w-16 h-16 rounded-xl overflow-hidden border border-white/8 shrink-0 flex items-center justify-center"
            style={{ backgroundColor: selected?.base_color || "transparent" }}
          >
            {selected ? (
              <Thumb image={selected} width={TILE_PX} height={TILE_PX} className="w-full h-full object-cover" />
            ) : (
              <Images className="w-5 h-5 text-zinc-700" />
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col">
            <span className="text-xs font-semibold text-zinc-200 truncate">
              {selected ? selected.label : "No picture on this card"}
            </span>
            <span className="text-[11px] text-zinc-600 truncate">
              {selected
                ? line || "Nobody credited"
                : "The card is on its palette or a drawn sky."}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {selected ? (
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  onSelect?.(null);
                }}
                aria-label="Take the picture off this card"
                className="flex items-center justify-center w-11 h-11 sm:w-9 sm:h-9 rounded-full text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setChoosing(true)}
              className="btn-glass flex items-center gap-2 px-4 py-2 text-[11px] font-semibold rounded-full min-h-[44px] sm:min-h-[36px]"
            >
              <Images className="w-3.5 h-3.5" />
              {selected ? "Change" : "Choose"}
            </button>
          </div>
        </div>

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

            {line ? (
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
                  The card draws {line} small and faint along the bottom.
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
            Drop a file here to upload it straight onto the card, or open the library to pick one. A
            picture is cropped to fill, so it wants to be at least 1400 on its short edge for a story.
          </span>
        )}

        {/* The library, over the card. Tapping a picture picks it and comes
            straight back out: you came in here to make one decision. */}
        {choosing ? (
          <Overlay
            title="Choose an image"
            backLabel="Card"
            onClose={() => setChoosing(false)}
            width="sm:max-w-4xl"
            actions={
              <button
                type="button"
                onClick={() => input.current?.click()}
                disabled={uploading}
                className="btn-glass flex items-center gap-2 px-3.5 py-2 text-[11px] font-semibold rounded-full disabled:opacity-40 shrink-0"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ImagePlus className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">
                  {uploading ? `${progress.done} of ${progress.total}` : "Upload"}
                </span>
              </button>
            }
          >
            <div className="px-3 sm:px-5 py-3 border-b border-white/8 shrink-0 flex flex-col gap-2">
              {searchBox("Find by title, creator or handle")}
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[11px] text-zinc-600">
                  {loading
                    ? "Looking"
                    : total === 0
                      ? needle
                        ? "Nothing matches that."
                        : "Nothing here yet. Upload a picture."
                      : `${images.length} of ${total} shown`}
                </span>
                {selectedPath ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(null);
                      onSelect?.(null);
                      setChoosing(false);
                    }}
                    className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-100 transition-colors"
                  >
                    Use no picture
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 flex flex-col gap-3">
              {dropZone(
                <>
                  {uploadTile}
                  {loading ? (
                    <div className="aspect-square rounded-xl border border-white/5 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
                    </div>
                  ) : null}
                  {images.map(tile)}
                </>,
                // Two on a phone, not three. At three a tile is about a
                // hundred pixels and the picture is smaller than the
                // control sitting on it.
                "grid-cols-2 sm:grid-cols-4 lg:grid-cols-5"
              )}
              {foot}
            </div>
          </Overlay>
        ) : null}

        {overlay}
      </div>
    );
  }

  // -------------------------------------------------------------------
  // The gallery
  // -------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">{searchBox("Find by title, creator or handle")}</div>
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
          {total === 0
            ? needle
              ? "Nothing matches that."
              : "Nothing here yet."
            : `${total} ${total === 1 ? "image" : "images"}${needle ? " matching" : ""}${
                hasMore ? `, ${images.length} loaded` : ""
              }`}
        </span>
      </div>

      {dropZone(
        <>
          {uploadTile}
          {loading ? (
            <div className="aspect-square rounded-xl border border-white/5 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
            </div>
          ) : null}
          {images.map(tile)}
        </>,
        "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      )}

      {foot}

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
