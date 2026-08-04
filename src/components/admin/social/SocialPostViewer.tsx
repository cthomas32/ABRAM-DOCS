"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Copy, Download, Loader2, Share, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { SOCIAL_FORMATS, type SocialFormatId } from "@/lib/social/formats";
import { normalizeSpec, specToFilename, specToRenderPath } from "@/lib/social/spec";
import { saveCards, useCanShareImages } from "@/lib/social/saveImage";
import { composePostText } from "@/lib/social/links";
import type { SocialPostRow } from "@/app/admin/dashboard/social/calendarActions";
import type { SocialAssetRow } from "@/app/admin/dashboard/social/actions";

/**
 * Looking at one post.
 *
 * The calendar is a schedule, not a gallery: a day column has to stay
 * readable at a glance, so the cards there are a line each. This is where
 * the picture is actually looked at. Two things only: see it, and get it
 * off the screen. A carousel swipes.
 *
 * Everything that changes a post lives in the editor, which is one tap
 * further on. Nothing here writes.
 */

export default function SocialPostViewer({
  post,
  channelLabel,
  onClose,
  onNotify,
}: {
  post: SocialPostRow;
  channelLabel: string;
  onClose: () => void;
  onNotify: (message: string, tone: "success" | "error") => void;
}) {
  const [slides, setSlides] = useState<SocialAssetRow[]>(post.asset ? [post.asset] : []);
  const [loading, setLoading] = useState(Boolean(post.set_id));
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const canShare = useCanShareImages();

  // Body scroll lock, so the page behind does not travel with the thumb.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // A carousel is a row per slide sharing a set id, and it is only worth
  // fetching once the set is actually being looked at.
  useEffect(() => {
    if (!post.set_id) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("social_image_assets")
        .select("*")
        .eq("set_id", post.set_id)
        .order("slide_index", { ascending: true });
      if (cancelled) return;
      if (data?.length) setSlides(data as SocialAssetRow[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [post.set_id]);

  const goTo = useCallback((next: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(next, track.children.length - 1));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
    setIndex(clamped);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") goTo(index + 1);
      if (event.key === "ArrowLeft") goTo(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goTo, index]);

  /** Which slide the swipe landed on, read from where the track stopped. */
  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const next = Math.round(track.scrollLeft / track.clientWidth);
    if (next !== index) setIndex(next);
  };

  const format = useMemo(() => {
    const id = (slides[0]?.format || post.asset?.format) as SocialFormatId | undefined;
    return (id && SOCIAL_FORMATS[id]) || SOCIAL_FORMATS.square;
  }, [slides, post.asset]);

  const handleSave = async () => {
    if (slides.length === 0) return;
    setSaving(true);
    try {
      await saveCards(
        slides.map((slide) => {
          const spec = normalizeSpec(slide.spec);
          return {
            url: slide.public_url || specToRenderPath(spec),
            filename: specToFilename(spec, slide.title),
          };
        }),
        slides[0].title || undefined
      );
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Could not save that card.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    const text = composePostText(post.caption, post.link_url);
    if (!text) {
      onNotify("There is nothing to copy on that post yet.", "error");
      return;
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const many = slides.length > 1;
  const saveLabel = canShare
    ? many
      ? `Save ${slides.length} images`
      : "Save image"
    : many
      ? `Download ${slides.length} PNGs`
      : "Download PNG";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="glass-panel relative w-full sm:max-w-lg max-h-[94vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-white/10">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{channelLabel}</p>
            <p className="text-[11px] text-zinc-500 truncate">
              {new Date(`${post.scheduled_for.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
              {many ? ` · ${index + 1} of ${slides.length}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="btn-ghost rounded-full p-2 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* The picture. One panel per slide, snapping, so a carousel is a
            thumb swipe on a phone and an arrow key on a desktop. */}
        <div className="relative bg-black/40">
          {loading && slides.length === 0 ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
            </div>
          ) : slides.length === 0 ? (
            <p className="px-4 py-16 text-center text-xs text-zinc-500">This post has no card on it yet.</p>
          ) : (
            <div
              ref={trackRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory overscroll-x-contain"
              style={{ scrollbarWidth: "none" }}
            >
              {slides.map((slide) => {
                const spec = normalizeSpec(slide.spec);
                return (
                  <div key={slide.id} className="w-full shrink-0 snap-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slide.public_url || specToRenderPath(spec)}
                      alt={post.alt_text || slide.title || "Post card"}
                      className="w-full object-contain"
                      style={{ maxHeight: "62vh", aspectRatio: `${format.width} / ${format.height}` }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {many ? (
            <>
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                disabled={index === 0}
                aria-label="Previous slide"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-2 text-white transition-opacity disabled:opacity-0 hidden sm:flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                disabled={index === slides.length - 1}
                aria-label="Next slide"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-2 text-white transition-opacity disabled:opacity-0 hidden sm:flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5">
                {slides.map((slide, i) => (
                  <span
                    key={slide.id}
                    className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-white" : "w-1.5 bg-white/30"}`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 p-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || slides.length === 0}
            className="btn-primary flex items-center justify-center gap-2 rounded-full px-5 py-3 text-xs font-semibold disabled:opacity-50 min-h-[44px]"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : canShare ? (
              <Share className="w-3.5 h-3.5" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {saveLabel}
          </button>

          {post.caption ? (
            <div className="flex items-start gap-2 rounded-xl border border-white/8 bg-black/30 p-3">
              <p className="flex-1 text-[11px] leading-relaxed text-zinc-400 whitespace-pre-wrap break-words">
                {post.caption}
              </p>
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy the caption and the link"
                className="btn-glass shrink-0 rounded-full p-2 min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
