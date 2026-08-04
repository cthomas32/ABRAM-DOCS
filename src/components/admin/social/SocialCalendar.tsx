"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ImageOff,
  Layers,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
  SkipForward,
  Trash2,
  Undo2,
  Upload,
} from "lucide-react";
import AbramMark from "@/components/AbramMark";
import { createClient } from "@/utils/supabase/client";
import { normalizeSpec, specToRenderPath } from "@/lib/social/spec";
import { composePostText } from "@/lib/social/links";
import {
  deletePost,
  markPostReady,
  setPostStatus,
  type PostStatus,
  type SocialCampaignRow,
  type SocialPostRow,
} from "@/app/admin/dashboard/social/calendarActions";
import SocialPostEditor, { type LinkChannel, type LinkPage } from "./SocialPostEditor";
import SocialCampaignEditor from "./SocialCampaignEditor";
import SocialPostViewer from "./SocialPostViewer";

/**
 * The week, as posts rather than pictures.
 *
 * A row here is a packet: a day, a channel, the words, the link and the
 * card. Marking one ready publishes its card and puts it in the next
 * morning's Slack message, which is the only thing this screen exists to
 * feed. Nothing on this page posts anything.
 */

const LABEL = "text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500";

const FALLBACK_CHANNELS: LinkChannel[] = [
  { source: "tiktok", medium: "social", label: "TikTok" },
  { source: "reddit", medium: "social", label: "Reddit" },
  { source: "instagram", medium: "social", label: "Instagram" },
  { source: "youtube", medium: "social", label: "YouTube" },
  { source: "linkedin", medium: "social", label: "LinkedIn" },
  { source: "x", medium: "social", label: "X" },
];

const FALLBACK_PAGES: LinkPage[] = [
  { slug: "start", label: "Start (general)", path: "/start" },
  { slug: "start-filmmakers", label: "Filmmakers", path: "/start/filmmakers" },
  { slug: "start-agencies", label: "Agencies", path: "/start/agencies" },
  { slug: "start-post", label: "Post production", path: "/start/post-production" },
  { slug: "start-resources", label: "Resources", path: "/start/resource-management" },
  { slug: "start-assistant", label: "AI assistant", path: "/start/ai-assistant" },
];

// ------------------------------------------------------------------ dates
//
// Local dates throughout, formatted by hand rather than through toISOString,
// which converts to UTC first and hands back yesterday for anyone west of
// Greenwich for most of the evening.

function toISODate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Monday, because a posting week is a working week. */
function startOfWeek(date: Date): Date {
  const start = new Date(date);
  const weekday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - weekday);
  start.setHours(0, 0, 0, 0);
  return start;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function SocialCalendar({
  onNotify,
  refreshToken,
  onEditCard,
  reopenPostId,
  onReopened,
}: {
  onNotify: (message: string, tone: "success" | "error") => void;
  refreshToken: number;
  /** Hand a post's card to the studio, remembering the post to come back to. */
  onEditCard: (assetId: string, postId: string) => void;
  /**
   * A post to open as soon as it is on screen, set when the studio sends us
   * back after editing its card. Cleared through `onReopened` so the sheet
   * does not spring open again every time the week is reloaded.
   */
  reopenPostId?: string | null;
  onReopened?: () => void;
}) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [posts, setPosts] = useState<SocialPostRow[]>([]);
  const [campaigns, setCampaigns] = useState<SocialCampaignRow[]>([]);
  const [channels, setChannels] = useState<LinkChannel[]>(FALLBACK_CHANNELS);
  const [pages, setPages] = useState<LinkPage[]>(FALLBACK_PAGES);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [campaignFilter, setCampaignFilter] = useState<string>("all");

  const [viewing, setViewing] = useState<SocialPostRow | null>(null);
  const [editing, setEditing] = useState<{ post: SocialPostRow | null; date: string } | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<SocialCampaignRow | null | undefined>(undefined);

  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const rangeStart = toISODate(days[0]);
  const rangeEnd = toISODate(days[6]);
  const today = toISODate(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const [postResult, campaignResult, channelResult, pageResult] = await Promise.all([
      supabase
        .from("social_posts")
        .select("*, asset:social_image_assets(*)")
        .gte("scheduled_for", rangeStart)
        .lte("scheduled_for", rangeEnd)
        .order("scheduled_for", { ascending: true })
        .order("slot", { ascending: true }),
      supabase.from("social_campaigns").select("*").neq("status", "archived").order("starts_on", { ascending: false }),
      supabase.from("campaign_link_channels").select("source, medium, label").eq("active", true).order("sort_order"),
      supabase.from("campaign_link_pages").select("slug, label, path").eq("active", true).order("sort_order"),
    ]);

    if (postResult.error) onNotify(postResult.error.message, "error");
    setPosts((postResult.data as SocialPostRow[]) || []);
    setCampaigns((campaignResult.data as SocialCampaignRow[]) || []);

    // Both lists are editable in the database without a deploy, so an empty
    // read means "not seeded yet" rather than "no channels exist".
    if (channelResult.data?.length) setChannels(channelResult.data as LinkChannel[]);
    if (pageResult.data?.length) setPages(pageResult.data as LinkPage[]);

    setLoading(false);
  }, [rangeStart, rangeEnd, onNotify]);

  useEffect(() => {
    load();
  }, [load, refreshToken]);

  /**
   * Come back to the post whose card was just edited.
   *
   * Waits for the week to hold it, because the studio can hand back a post
   * on a day the calendar has since been scrolled away from. If the post is
   * not in the loaded range the request is dropped rather than left pending,
   * so it cannot fire later against a different week.
   */
  useEffect(() => {
    if (!reopenPostId || loading) return;
    const found = posts.find((row) => row.id === reopenPostId);
    if (found) setEditing({ post: found, date: found.scheduled_for.slice(0, 10) });
    onReopened?.();
  }, [reopenPostId, loading, posts, onReopened]);

  const visiblePosts = useMemo(
    () => (campaignFilter === "all" ? posts : posts.filter((post) => post.campaign_id === campaignFilter)),
    [posts, campaignFilter]
  );

  const byDay = useMemo(() => {
    const map = new Map<string, SocialPostRow[]>();
    for (const post of visiblePosts) {
      const key = post.scheduled_for.slice(0, 10);
      const existing = map.get(key);
      if (existing) existing.push(post);
      else map.set(key, [post]);
    }
    return map;
  }, [visiblePosts]);

  const readyToday = useMemo(
    () => posts.filter((post) => post.scheduled_for.slice(0, 10) === today && post.status === "ready").length,
    [posts, today]
  );
  const kippDrafts = useMemo(
    () => posts.filter((post) => post.source === "kipp" && post.status === "draft").length,
    [posts]
  );
  const emptyDays = useMemo(
    () =>
      days.filter((day) => {
        const key = toISODate(day);
        return key >= today && !(byDay.get(key) || []).some((post) => post.status !== "skipped");
      }).length,
    [days, byDay, today]
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

  const handleCopy = async (post: SocialPostRow) => {
    const text = composePostText(post.caption, post.link_url);
    if (!text) {
      onNotify("There is nothing to copy on that post yet.", "error");
      return;
    }
    await navigator.clipboard.writeText(text);
    setCopied(post.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = (post: SocialPostRow) => {
    if (!window.confirm("Remove this post from the calendar? The card stays in the library.")) return;
    return run(post.id, () => deletePost(post.id), "Removed from the calendar.");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Standing state */}
      <div className="flex flex-col gap-3">
        {kippDrafts > 0 ? (
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            {/* The mark, never a generic AI glyph. AGENTS.md is explicit about it. */}
            <AbramMark size={16} className="shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-300 leading-relaxed">
              KIPP has scheduled {kippDrafts} {kippDrafts === 1 ? "post" : "posts"} this week as drafts. Nothing reaches
              your morning message until you mark it ready.
            </p>
          </div>
        ) : null}

        {/* Three numbers on one line. They were three cards the height of a
            paragraph each, which is a lot of furniture for three integers. */}
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1.5 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
          <Stat value={readyToday} label="ready today" />
          <Stat value={emptyDays} label={emptyDays === 1 ? "day still open" : "days still open"} />
          <Stat value={visiblePosts.length} label={visiblePosts.length === 1 ? "post this week" : "posts this week"} />
        </div>
      </div>

      {/* Campaign bar */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={LABEL}>Campaigns</span>
          <button
            type="button"
            onClick={() => setEditingCampaign(null)}
            className="btn-ghost flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
          >
            <Plus className="w-3 h-3" />
            New campaign
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCampaignFilter("all")}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors min-h-[44px] sm:min-h-[36px] ${
              campaignFilter === "all"
                ? "bg-white text-black border-white"
                : "bg-white/[0.03] text-zinc-400 border-white/8 hover:text-zinc-200"
            }`}
          >
            Everything
          </button>
          {campaigns.map((campaign) => (
            <span key={campaign.id} className="flex items-stretch">
              <button
                type="button"
                onClick={() => setCampaignFilter(campaign.id)}
                className={`rounded-l-full border-y border-l px-3 py-1.5 text-[11px] font-semibold transition-colors min-h-[44px] sm:min-h-[36px] ${
                  campaignFilter === campaign.id
                    ? "bg-white text-black border-white"
                    : "bg-white/[0.03] text-zinc-400 border-white/8 hover:text-zinc-200"
                }`}
                title={campaign.goal || campaign.name}
              >
                {campaign.name}
              </button>
              <button
                type="button"
                onClick={() => setEditingCampaign(campaign)}
                aria-label={`Edit ${campaign.name}`}
                className={`rounded-r-full border px-2 transition-colors ${
                  campaignFilter === campaign.id
                    ? "bg-white text-black border-white hover:text-zinc-600"
                    : "bg-white/[0.03] text-zinc-600 border-white/8 hover:text-zinc-300"
                }`}
              >
                <Pencil className="w-3 h-3" />
              </button>
            </span>
          ))}
          {campaigns.length === 0 ? (
            <span className="text-[11px] text-zinc-600 self-center">
              None yet. A campaign groups a week of posts and supplies the tag their links are measured by.
            </span>
          ) : null}
        </div>
      </div>

      {/* Week nav */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-white/5 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart((week) => addDays(week, -7))}
            aria-label="Previous week"
            className="btn-glass rounded-full p-2 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="btn-glass rounded-full px-4 py-2 text-[11px] font-semibold"
          >
            This week
          </button>
          <button
            type="button"
            onClick={() => setWeekStart((week) => addDays(week, 7))}
            aria-label="Next week"
            className="btn-glass rounded-full p-2 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs text-zinc-400 font-sans flex items-center gap-2">
          <CalendarDays className="w-3.5 h-3.5 text-zinc-600" />
          {days[0].toLocaleDateString(undefined, { month: "long", day: "numeric" })} to{" "}
          {days[6].toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
          {loading ? <Loader2 className="w-3 h-3 animate-spin text-zinc-600" /> : null}
        </p>
      </div>

      {/* The week */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
        {days.map((day) => {
          const key = toISODate(day);
          const dayPosts = byDay.get(key) || [];
          const isToday = key === today;
          const isPast = key < today;

          return (
            <div
              key={key}
              className={`flex flex-col gap-2 rounded-2xl border p-2.5 ${
                isToday ? "border-white/25 bg-white/[0.04]" : "border-white/8 bg-white/[0.02]"
              } ${isPast ? "opacity-60" : ""}`}
            >
              <div className="flex items-baseline justify-between gap-2 px-0.5">
                <span className={`text-[11px] font-semibold ${isToday ? "text-white" : "text-zinc-400"}`}>
                  {DAY_NAMES[(day.getDay() + 6) % 7]}
                  <span className="text-zinc-600 font-normal"> {day.getDate()}</span>
                </span>
                {isToday ? (
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-white">Today</span>
                ) : null}
              </div>

              {dayPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  channels={channels}
                  busy={busy === post.id}
                  copied={copied === post.id}
                  onOpen={() => setViewing(post)}
                  onCopy={() => handleCopy(post)}
                  onEdit={() => setEditing({ post, date: key })}
                  onDelete={() => handleDelete(post)}
                  onReady={() =>
                    run(post.id, () => markPostReady(post.id), "Ready. The card is published and it is in the morning message.")
                  }
                  onStatus={(status) =>
                    run(post.id, () => setPostStatus(post.id, status), status === "posted" ? "Marked as posted." : "Updated.")
                  }
                />
              ))}

              <button
                type="button"
                onClick={() => setEditing({ post: null, date: key })}
                aria-label={`Add a post on ${DAY_NAMES[(day.getDay() + 6) % 7]} ${day.getDate()}`}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/8 py-2 text-[11px] font-semibold text-zinc-700 transition-colors hover:border-white/20 hover:text-zinc-300 min-h-[44px]"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {viewing ? (
        <SocialPostViewer
          post={viewing}
          channelLabel={channels.find((channel) => channel.source === viewing.channel)?.label || viewing.channel}
          onClose={() => setViewing(null)}
          onNotify={onNotify}
        />
      ) : null}

      {editing ? (
        <SocialPostEditor
          post={editing.post}
          defaultDate={editing.date}
          campaigns={campaigns}
          channels={channels}
          pages={pages}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
          onNotify={onNotify}
          onEditCard={onEditCard}
        />
      ) : null}

      {editingCampaign !== undefined ? (
        <SocialCampaignEditor
          campaign={editingCampaign}
          pages={pages}
          onClose={() => setEditingCampaign(undefined)}
          onSaved={() => {
            setEditingCampaign(undefined);
            load();
          }}
          onNotify={onNotify}
        />
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className={`text-lg font-semibold leading-none ${value > 0 ? "text-white" : "text-zinc-600"}`}>{value}</span>
      <span className="text-[11px] text-zinc-500">{label}</span>
    </span>
  );
}

// A word in a colour, not a pill. Seven columns of filled badges is most of
// what made the week look loud.
const STATUS_STYLES: Record<PostStatus, string> = {
  draft: "text-amber-300/80",
  ready: "text-white",
  posted: "text-emerald-400/80",
  skipped: "text-zinc-600",
};

/**
 * One post in a day column: a line, not a poster.
 *
 * Seven columns of full-size cards is a wall of pictures nobody can read a
 * week off. So the row carries a thumbnail, who it is for and how far along
 * it is, tapping it opens the picture full size, and everything that
 * changes the post is behind the one menu glyph on the right.
 */
function PostCard({
  post,
  channels,
  busy,
  onOpen,
  onCopy,
  copied,
  onEdit,
  onDelete,
  onReady,
  onStatus,
}: {
  post: SocialPostRow;
  channels: LinkChannel[];
  busy: boolean;
  onOpen: () => void;
  onCopy: () => void;
  copied: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReady: () => void;
  onStatus: (status: PostStatus) => void;
}) {
  const [menu, setMenu] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const asset = post.asset || null;
  const spec = asset ? normalizeSpec(asset.spec) : null;
  const preview = asset ? asset.public_url || specToRenderPath(spec!) : null;
  const channelLabel = channels.find((channel) => channel.source === post.channel)?.label || post.channel;

  // Anywhere else, and away it goes.
  useEffect(() => {
    if (!menu) return;
    const onDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setMenu(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const act = (work: () => void) => () => {
    setMenu(false);
    work();
  };

  return (
    <div ref={wrapRef} className={`relative ${post.status === "skipped" ? "opacity-50" : ""}`}>
      <button
        type="button"
        onClick={onOpen}
        title={post.caption || asset?.title || "Open this post"}
        className="block w-full overflow-hidden rounded-xl border border-white/8 bg-white/[0.02] text-left transition-colors hover:border-white/25 hover:bg-white/[0.05]"
      >
        {/* Short in the seven-column week, where the crop is only there to
            be recognised. Taller below that, where a column is the width of
            the screen and a 64px band of a portrait card is a sliver. */}
        <span className="relative block h-40 xl:h-16 w-full bg-black/50">
          {preview ? (
            /* A crop, not the whole card. The picture is here to be
               recognised across a week, not read. */
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={preview}
              alt={post.alt_text || asset?.title || "Post card"}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center">
              <ImageOff className="w-3.5 h-3.5 text-zinc-700" />
            </span>
          )}
          {/* Over the picture, so the line below belongs to the channel
              alone and nothing has to be truncated to fit. */}
          <span
            className={`absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-widest backdrop-blur-sm ${
              STATUS_STYLES[post.status]
            }`}
          >
            {post.status}
          </span>
        </span>

        <span className="flex items-center gap-1 px-2 py-1.5">
          <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-zinc-300">
            {channelLabel}
          </span>
          {post.source === "kipp" ? <AbramMark size={9} className="shrink-0 opacity-40" /> : null}
          {post.set_id ? <Layers className="ml-auto w-2.5 h-2.5 shrink-0 text-zinc-600" /> : null}
        </span>
      </button>

      <button
        type="button"
        onClick={() => setMenu((open) => !open)}
        aria-label="More for this post"
        aria-expanded={menu}
        disabled={busy}
        className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-zinc-400 backdrop-blur-sm transition-colors hover:text-white disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <MoreHorizontal className="w-3.5 h-3.5" />}
      </button>

      {menu ? (
        <div className="glass-panel absolute right-0 top-[calc(100%-0.25rem)] z-20 w-48 overflow-hidden rounded-xl border border-white/10 py-1 shadow-2xl">
          {post.status === "draft" ? (
            <MenuItem icon={<Upload className="w-3 h-3" />} onClick={act(onReady)}>
              Mark ready
            </MenuItem>
          ) : null}
          {post.status === "ready" ? (
            <MenuItem icon={<Send className="w-3 h-3" />} onClick={act(() => onStatus("posted"))}>
              Mark posted
            </MenuItem>
          ) : null}
          {post.status === "posted" || post.status === "skipped" ? (
            <MenuItem icon={<Undo2 className="w-3 h-3" />} onClick={act(() => onStatus("draft"))}>
              Back to draft
            </MenuItem>
          ) : null}
          <MenuItem icon={copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} onClick={act(onCopy)}>
            {copied ? "Copied" : "Copy caption"}
          </MenuItem>
          <MenuItem icon={<Pencil className="w-3 h-3" />} onClick={act(onEdit)}>
            Edit post
          </MenuItem>
          {post.status !== "skipped" ? (
            <MenuItem icon={<SkipForward className="w-3 h-3" />} onClick={act(() => onStatus("skipped"))}>
              Skip this one
            </MenuItem>
          ) : null}
          <MenuItem icon={<Trash2 className="w-3 h-3" />} onClick={act(onDelete)} danger>
            Remove
          </MenuItem>
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  icon,
  onClick,
  danger,
  children,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[11px] font-semibold transition-colors ${
        danger ? "text-red-400 hover:bg-red-500/10" : "text-zinc-300 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      <span className="shrink-0 opacity-70">{icon}</span>
      {children}
    </button>
  );
}
