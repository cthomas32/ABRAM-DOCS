"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ImageOff, Loader2, Pencil, Plus, Search, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { SOCIAL_FORMATS, type SocialFormatId } from "@/lib/social/formats";
import { normalizeSpec, specToRenderPath } from "@/lib/social/spec";
import { buildTrackedLink } from "@/lib/social/links";
import { savePost, type SocialCampaignRow, type SocialPostRow } from "@/app/admin/dashboard/social/calendarActions";
import { createVariation, type SocialAssetRow } from "@/app/admin/dashboard/social/actions";

/**
 * Writing one post.
 *
 * The link builds itself from the landing page, the channel and the
 * campaign, which is the whole reason those three live on the same form.
 * It stays editable: a post that points at a release note or an external
 * page is normal, and a builder that refuses to be overruled just gets
 * worked around.
 */

export interface LinkChannel {
  source: string;
  medium: string;
  label: string;
}

export interface LinkPage {
  slug: string;
  label: string;
  path: string;
}

/**
 * Where a caption stops being a caption. Approximate on purpose: these
 * move, and the counter is here to stop a post being truncated mid-word
 * on the day, not to be a specification.
 */
const CAPTION_LIMITS: Record<string, number> = {
  x: 280,
  threads: 500,
  instagram: 2200,
  tiktok: 2200,
  linkedin: 3000,
  youtube: 5000,
};

const LABEL = "text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500";
const FIELD =
  "w-full rounded-xl border border-white/8 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-white/20 focus:outline-none";

interface AssetChoice {
  id: string;
  setId: string | null;
  variationId: string | null;
  title: string;
  preview: string;
  format: SocialFormatId;
  slides: number;
  status: string;
}

/**
 * The sizes offered as variations, in the order the studio offers them.
 *
 * Banner is left out on purpose: a LinkedIn profile header is not something
 * a dated post goes out as, and offering it here would put a size on the
 * list that no channel on the calendar can use.
 */
const VARIATION_FORMATS: SocialFormatId[] = ["square", "portrait", "story", "landscape", "wide"];

function toChoices(rows: SocialAssetRow[]): AssetChoice[] {
  const sets = new Map<string, SocialAssetRow[]>();
  const choices: AssetChoice[] = [];

  for (const row of rows) {
    if (row.set_id) {
      const existing = sets.get(row.set_id);
      if (existing) existing.push(row);
      else sets.set(row.set_id, [row]);
      continue;
    }
    const spec = normalizeSpec(row.spec);
    choices.push({
      id: row.id,
      setId: null,
      variationId: row.variation_id,
      title: row.title,
      preview: row.public_url || specToRenderPath(spec),
      format: row.format as SocialFormatId,
      slides: 1,
      status: row.status,
    });
  }

  for (const [setId, slides] of sets) {
    const ordered = [...slides].sort((a, b) => a.slide_index - b.slide_index);
    const first = ordered[0];
    const spec = normalizeSpec(first.spec);
    choices.push({
      id: first.id,
      setId,
      // A carousel takes its sizes as a set, so its slides never join a
      // variation group and the row below stays off for them.
      variationId: null,
      title: first.title.replace(/\s+\d+\/\d+$/, ""),
      preview: first.public_url || specToRenderPath(spec),
      format: first.format as SocialFormatId,
      slides: ordered.length,
      status: ordered.every((slide) => slide.status === "approved") ? "approved" : "draft",
    });
  }

  return choices;
}

export default function SocialPostEditor({
  post,
  defaultDate,
  campaigns,
  channels,
  pages,
  onClose,
  onSaved,
  onNotify,
  onEditCard,
}: {
  /** Absent when writing a new post */
  post: SocialPostRow | null;
  defaultDate: string;
  campaigns: SocialCampaignRow[];
  channels: LinkChannel[];
  pages: LinkPage[];
  onClose: () => void;
  onSaved: () => void;
  onNotify: (message: string, tone: "success" | "error") => void;
  /**
   * Hand the post's card to the studio. The post is saved first and its id
   * goes with it, so saving in the studio can bring the sheet back rather
   * than dropping you on the calendar wondering what you were doing.
   */
  onEditCard: (assetId: string, postId: string) => void;
}) {
  const [date, setDate] = useState(post?.scheduled_for?.slice(0, 10) || defaultDate);
  const [channel, setChannel] = useState(post?.channel || channels[0]?.source || "linkedin");
  const [campaignId, setCampaignId] = useState(post?.campaign_id || "");
  const [pageSlug, setPageSlug] = useState(post?.page_slug || "");
  const [link, setLink] = useState(post?.link_url || "");
  const [linkTouched, setLinkTouched] = useState(Boolean(post?.link_url));
  const [caption, setCaption] = useState(post?.caption || "");
  const [altText, setAltText] = useState(post?.alt_text || "");
  const [note, setNote] = useState(post?.note || "");
  const [assetId, setAssetId] = useState(post?.asset_id || "");
  const [setId, setSetId] = useState(post?.set_id || "");
  const [saving, setSaving] = useState(false);
  const [busyFormat, setBusyFormat] = useState<SocialFormatId | null>(null);

  const [assets, setAssets] = useState<AssetChoice[]>([]);
  const [assetQuery, setAssetQuery] = useState("");
  const [loadingAssets, setLoadingAssets] = useState(true);

  // Body scroll lock, so the page behind the sheet does not travel with
  // the thumb on a phone.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const loadAssets = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("social_image_assets")
      .select("*")
      .neq("status", "archived")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) onNotify(error.message, "error");
    setAssets(toChoices((data as SocialAssetRow[]) || []));
    setLoadingAssets(false);
  }, [onNotify]);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  const campaign = useMemo(() => campaigns.find((c) => c.id === campaignId) || null, [campaigns, campaignId]);
  const page = useMemo(() => pages.find((p) => p.slug === pageSlug) || null, [pages, pageSlug]);

  // Rebuild the link whenever its ingredients change, unless it has been
  // hand-edited. Overwriting a URL someone typed would be the single most
  // annoying thing this form could do.
  useEffect(() => {
    if (linkTouched || !page) return;
    const channelRow = channels.find((c) => c.source === channel);
    setLink(
      buildTrackedLink({
        path: page.path,
        source: channel,
        medium: channelRow?.medium || "social",
        campaign: campaign?.slug || null,
      })
    );
  }, [page, channel, channels, campaign, linkTouched]);

  const filteredAssets = useMemo(() => {
    const query = assetQuery.trim().toLowerCase();
    if (!query) return assets;
    return assets.filter((asset) => asset.title.toLowerCase().includes(query));
  }, [assets, assetQuery]);

  const limit = CAPTION_LIMITS[channel];
  const overLimit = typeof limit === "number" && caption.length > limit;

  const chooseAsset = useCallback((asset: AssetChoice | null) => {
    setAssetId(asset?.id || "");
    setSetId(asset?.setId || "");
  }, []);

  /** The card this post is on, once the library has loaded. */
  const chosen = useMemo(() => assets.find((asset) => asset.id === assetId) || null, [assets, assetId]);

  /**
   * The other sizes of the chosen card, keyed by format.
   *
   * A card with no group is a group of one: the size it already is, and
   * every other size offered as something to make. That is the same shape as
   * a card that has siblings, so the row below does not need two versions.
   */
  const variations = useMemo(() => {
    if (!chosen || chosen.setId) return new Map<SocialFormatId, AssetChoice>();
    const group = new Map<SocialFormatId, AssetChoice>();
    group.set(chosen.format, chosen);
    if (!chosen.variationId) return group;
    for (const asset of assets) {
      if (asset.variationId === chosen.variationId) group.set(asset.format, asset);
    }
    return group;
  }, [assets, chosen]);

  const savePostRow = useCallback(async () => {
    return savePost({
      id: post?.id,
      campaignId: campaignId || null,
      scheduledFor: date,
      slot: post?.slot,
      channel,
      caption,
      linkUrl: link,
      pageSlug: pageSlug || null,
      assetId: assetId || null,
      setId: setId || null,
      altText,
      note,
    });
  }, [post?.id, post?.slot, campaignId, date, channel, caption, link, pageSlug, assetId, setId, altText, note]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await savePostRow();
      if (result.error) {
        onNotify(result.error, "error");
        return;
      }
      onNotify(post ? "Post updated. It is a draft again until you mark it ready." : "Post added to the calendar.", "success");
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  /**
   * Save the post, then hand its card to the studio.
   *
   * Saving first is the whole reason this is not just a link: leaving for
   * the studio with an unsaved caption in the box would throw the caption
   * away, and losing typed words to a button labelled Edit is the kind of
   * thing nobody forgives.
   */
  const handleEditCard = async () => {
    if (!assetId) return;
    setSaving(true);
    try {
      const result = await savePostRow();
      if (result.error) {
        onNotify(result.error, "error");
        return;
      }
      onEditCard(assetId, result.data?.id || post?.id || "");
    } finally {
      setSaving(false);
    }
  };

  /** Make a size this card does not have yet, and move the post onto it. */
  const handleAddSize = async (format: SocialFormatId) => {
    if (!assetId) return;
    setBusyFormat(format);
    try {
      const result = await createVariation(assetId, format);
      if (result.error || !result.data) {
        onNotify(result.error || "That size could not be made.", "error");
        return;
      }
      // Refetched rather than patched in: the new row needs a real preview,
      // and the only thing that knows how to draw one is the spec the server
      // just wrote. Guessing at it here would put a wrong thumbnail on screen
      // until the next open.
      await loadAssets();
      onNotify(`${SOCIAL_FORMATS[format].label} added, carrying the same words. It is a draft.`, "success");
    } finally {
      setBusyFormat(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="glass-panel relative w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[88vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-white/10">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-white/8 bg-black/80 px-5 py-4 backdrop-blur-xl">
          <div>
            <h2 className="text-sm font-semibold text-white">{post ? "Edit post" : "New post"}</h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Everything needed to post once: the day, the channel, the words, the link and the card.
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

        <div className="flex flex-col gap-5 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className={LABEL} htmlFor="post-date">
                Day
              </label>
              <input
                id="post-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={FIELD}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className={LABEL} htmlFor="post-campaign">
                Campaign
              </label>
              <select
                id="post-campaign"
                value={campaignId}
                onChange={(event) => {
                  setCampaignId(event.target.value);
                  setLinkTouched(false);
                }}
                className={FIELD}
              >
                <option value="">No campaign</option>
                {campaigns.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className={LABEL}>Channel</span>
            <div className="flex flex-wrap gap-2">
              {channels.map((option) => (
                <button
                  key={option.source}
                  type="button"
                  onClick={() => {
                    setChannel(option.source);
                    setLinkTouched(false);
                  }}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors min-h-[44px] sm:min-h-[36px] ${
                    channel === option.source
                      ? "bg-white text-black border-white"
                      : "bg-white/[0.03] text-zinc-400 border-white/8 hover:text-zinc-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className={LABEL} htmlFor="post-caption">
              Caption
            </label>
            <textarea
              id="post-caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              rows={5}
              placeholder="What the reader gets out of it. The card can carry the whole message, so an empty caption is a real choice."
              className={`${FIELD} resize-y leading-relaxed`}
            />
            {typeof limit === "number" ? (
              <p className={`text-[11px] ${overLimit ? "text-red-400" : "text-zinc-600"}`}>
                {caption.length} / {limit}
                {overLimit ? `, ${channels.find((c) => c.source === channel)?.label || channel} will cut this off` : ""}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className={LABEL} htmlFor="post-page">
                Landing page
              </label>
              <select
                id="post-page"
                value={pageSlug}
                onChange={(event) => {
                  setPageSlug(event.target.value);
                  setLinkTouched(false);
                }}
                className={FIELD}
              >
                <option value="">No link</option>
                {pages.map((option) => (
                  <option key={option.slug} value={option.slug}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className={LABEL} htmlFor="post-link">
                Tracked link
              </label>
              <input
                id="post-link"
                type="url"
                value={link}
                onChange={(event) => {
                  setLink(event.target.value);
                  setLinkTouched(true);
                }}
                placeholder="Built from the page and the channel. Edit it if you need to."
                className={`${FIELD} font-mono text-[11px]`}
              />
            </div>
          </div>

          {/* Card picker */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={LABEL}>Card</span>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600" />
                <input
                  type="search"
                  value={assetQuery}
                  onChange={(event) => setAssetQuery(event.target.value)}
                  placeholder="Search the library"
                  aria-label="Search the library"
                  className="rounded-full border border-white/8 bg-black/40 py-1.5 pl-7 pr-3 text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:border-white/20 focus:outline-none"
                />
              </div>
            </div>

            {loadingAssets ? (
              <div className="flex items-center gap-2 text-xs text-zinc-500 py-6 justify-center">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading the library
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 max-h-64 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => chooseAsset(null)}
                  className={`flex flex-col items-center justify-center gap-1 aspect-square rounded-xl border text-[10px] transition-colors ${
                    assetId
                      ? "border-white/8 bg-white/[0.02] text-zinc-500 hover:text-zinc-300"
                      : "border-white bg-white/10 text-white"
                  }`}
                >
                  <ImageOff className="w-4 h-4" />
                  Words only
                </button>

                {filteredAssets.map((asset) => {
                  const format = SOCIAL_FORMATS[asset.format] || SOCIAL_FORMATS.square;
                  const selected = assetId === asset.id;
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => chooseAsset(asset)}
                      title={`${asset.title} (${format.label})`}
                      className={`relative aspect-square rounded-xl border overflow-hidden transition-colors ${
                        selected ? "border-white" : "border-white/8 hover:border-white/25"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={asset.preview} alt={asset.title} loading="lazy" className="w-full h-full object-cover" />
                      {selected ? (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Check className="w-5 h-5 text-white" />
                        </span>
                      ) : null}
                      {asset.slides > 1 ? (
                        <span className="absolute bottom-1 right-1 rounded-full bg-black/80 px-1.5 py-0.5 text-[8px] font-semibold text-zinc-300">
                          {asset.slides}
                        </span>
                      ) : null}
                      {asset.status !== "approved" ? (
                        <span className="absolute top-1 left-1 rounded-full bg-black/80 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-amber-300">
                          Draft
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              A draft card is fine to schedule. Marking the post ready publishes it, which is what gives the morning
              message a picture to carry.
            </p>

            {/* What is on the card, and the other sizes of it. Only for a
                single card: a carousel takes its sizes as a set, and its
                slides are edited together in the studio. */}
            {chosen && !chosen.setId ? (
              <div className="flex flex-col gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-200 truncate">{chosen.title}</p>
                    <p className="text-[11px] text-zinc-600">
                      {SOCIAL_FORMATS[chosen.format].label}
                      {variations.size > 1 ? `, one of ${variations.size} sizes` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleEditCard}
                    disabled={saving}
                    className="btn-glass flex items-center gap-2 rounded-full px-3.5 py-2 text-[11px] font-semibold min-h-[44px] sm:min-h-[36px] disabled:opacity-50"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit card
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <span className={LABEL}>Sizes</span>
                  <div className="flex flex-wrap gap-2">
                    {VARIATION_FORMATS.map((option) => {
                      const existing = variations.get(option);
                      const isThisPost = existing?.id === assetId;
                      return (
                        <button
                          key={option}
                          type="button"
                          disabled={busyFormat !== null}
                          onClick={() => (existing ? chooseAsset(existing) : handleAddSize(option))}
                          title={
                            existing
                              ? `Put this post on the ${SOCIAL_FORMATS[option].label.toLowerCase()}`
                              : `Make a ${SOCIAL_FORMATS[option].label.toLowerCase()} carrying the same words`
                          }
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors min-h-[44px] sm:min-h-[34px] disabled:opacity-40 ${
                            isThisPost
                              ? "bg-white text-black border-white"
                              : existing
                                ? "bg-white/[0.06] text-zinc-200 border-white/15 hover:border-white/30"
                                : "bg-transparent text-zinc-500 border-dashed border-white/12 hover:text-zinc-300"
                          }`}
                        >
                          {busyFormat === option ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : existing ? null : (
                            <Plus className="w-3 h-3" />
                          )}
                          {SOCIAL_FORMATS[option].label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">
                    One message in several sizes. Editing any of them rewrites the others, so the words only get
                    written once, and each one goes back to draft when they change.
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className={LABEL} htmlFor="post-alt">
                Alt text
              </label>
              <input
                id="post-alt"
                type="text"
                value={altText}
                onChange={(event) => setAltText(event.target.value)}
                placeholder="What the card shows, for anyone who cannot see it"
                className={FIELD}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className={LABEL} htmlFor="post-note">
                Note to self
              </label>
              <input
                id="post-note"
                type="text"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Why this post, on this day"
                className={FIELD}
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-white/8 bg-black/80 px-5 py-4 backdrop-blur-xl">
          <button type="button" onClick={onClose} className="btn-ghost rounded-full px-4 py-2 text-xs font-semibold">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {post ? "Save changes" : "Add to the calendar"}
          </button>
        </div>
      </div>
    </div>
  );
}
