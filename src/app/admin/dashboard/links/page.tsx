"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Heading,
  Layers,
  Link2,
  Loader2,
  MousePointerClick,
  Palette,
  Plus,
  RefreshCw,
  Save,
  Share2,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  DEFAULT_SETTINGS,
  HIGHLIGHT_OPTIONS,
  normalizeLink,
  normalizeLinkUrl,
  normalizeSettings,
  scheduleState,
  type LinkBlockType,
  type LinkHighlight,
  type LinkHubLink,
  type LinkHubSettings,
} from "@/lib/linkHub";
import LinkHubIcon from "@/components/links/LinkHubIcon";
import LinkHubAnalyticsPanel from "@/components/links/admin/LinkHubAnalyticsPanel";
import LinkHubDesignPanel from "@/components/links/admin/LinkHubDesignPanel";
import LinkHubPreview from "@/components/links/admin/LinkHubPreview";
import ImageField from "@/components/links/admin/ImageField";
import {
  Choice,
  Field,
  IconButton,
  IconPicker,
  Panel,
  TextArea,
} from "@/components/links/admin/LinkHubFields";

const PUBLIC_URL = "https://abram.network/links";

type Tab = "content" | "design" | "analytics";

interface Draft {
  label: string;
  url: string;
  description: string;
  icon: string;
  thumbnail_url: string;
  highlight: LinkHighlight;
  starts_at: string;
  ends_at: string;
}

const EMPTY_DRAFT: Draft = {
  label: "",
  url: "",
  description: "",
  icon: "link",
  highlight: "none",
  thumbnail_url: "",
  starts_at: "",
  ends_at: "",
};

const BLOCK_LABELS: Record<LinkBlockType, { name: string; icon: React.ReactNode }> = {
  link: { name: "Link", icon: <Link2 className="w-3.5 h-3.5" /> },
  header: { name: "Header", icon: <Heading className="w-3.5 h-3.5" /> },
  social: { name: "Social", icon: <Share2 className="w-3.5 h-3.5" /> },
};

/** datetime-local wants a local wall-clock string, the database stores UTC. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * PostgREST reports an unknown column by name. A remote database may lag
 * behind the migrations, so a write retries without the column it named
 * rather than failing the whole save.
 */
function missingColumn(message: string): string | null {
  const match = message.match(/'([a-z_]+)' column/i) || message.match(/column "([a-z_]+)"/i);
  return match ? match[1] : null;
}

export default function LinkHubAdminPage() {
  const [tab, setTab] = useState<Tab>("content");
  const [links, setLinks] = useState<LinkHubLink[]>([]);
  const [settings, setSettings] = useState<LinkHubSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [draftType, setDraftType] = useState<LinkBlockType | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY_DRAFT);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const flash = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(null), 2500);
  };

  const load = useCallback(async () => {
    const supabase = createClient();
    const [linksResult, settingsResult] = await Promise.all([
      supabase.from("link_hub_links").select("*").order("sort_order", { ascending: true }),
      supabase.from("link_hub_settings").select("*").limit(1).maybeSingle(),
    ]);

    if (linksResult.error) {
      setError(linksResult.error.message);
    } else {
      setError(null);
      setLinks(((linksResult.data as LinkHubLink[]) || []).map(normalizeLink));
    }
    if (settingsResult.data) {
      setSettings(normalizeSettings(settingsResult.data as Partial<LinkHubSettings>));
      setDirty(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Warn before losing unsaved design changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  /* ---------------------------------------------------------------- */

  const draftPayload = (source: Draft, blockType: LinkBlockType) => {
    if (!source.label.trim()) {
      setError("Give the block a label.");
      return null;
    }

    // A header is a divider with no destination.
    let url = "";
    if (blockType !== "header") {
      const normalized = normalizeLinkUrl(source.url);
      if (!normalized) {
        setError("That does not look like a valid web address.");
        return null;
      }
      url = normalized;
    }

    return {
      label: source.label.trim(),
      url,
      description: blockType === "link" ? source.description.trim() || null : null,
      icon: source.icon,
      thumbnail_url: blockType === "link" ? source.thumbnail_url.trim() || null : null,
      highlight: blockType === "link" ? source.highlight : "none",
      starts_at: fromLocalInput(source.starts_at),
      ends_at: fromLocalInput(source.ends_at),
    };
  };

  const addBlock = async () => {
    if (!draftType) return;
    const payload = draftPayload(draft, draftType);
    if (!payload) return;

    setBusy(true);
    const nextOrder = links.length ? Math.max(...links.map((l) => l.sort_order)) + 10 : 10;
    const supabase = createClient();
    const { error: insertError } = await supabase
      .from("link_hub_links")
      .insert({ ...payload, block_type: draftType, sort_order: nextOrder });

    setBusy(false);
    if (insertError) return setError(insertError.message);

    setError(null);
    setDraft(EMPTY_DRAFT);
    setDraftType(null);
    flash("Block added.");
    load();
  };

  const saveEdit = async (block: LinkHubLink) => {
    const payload = draftPayload(editDraft, block.block_type);
    if (!payload) return;

    setBusy(true);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("link_hub_links")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", block.id);

    setBusy(false);
    if (updateError) return setError(updateError.message);

    setError(null);
    setEditingId(null);
    flash("Saved.");
    load();
  };

  const patchLink = async (id: string, patch: Partial<LinkHubLink>) => {
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("link_hub_links")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (updateError) return setError(updateError.message);
    load();
  };

  const removeLink = async (id: string) => {
    setBusy(true);
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("link_hub_links").delete().eq("id", id);
    setBusy(false);
    setConfirmDeleteId(null);
    if (deleteError) return setError(deleteError.message);
    flash("Block removed.");
    load();
  };

  /** Swap sort_order with the neighbour so the move survives a reload. */
  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= links.length) return;

    const a = links[index];
    const b = links[target];
    const supabase = createClient();

    setLinks((prev) => {
      const next = [...prev];
      next[index] = b;
      next[target] = a;
      return next;
    });

    const [resA, resB] = await Promise.all([
      supabase.from("link_hub_links").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("link_hub_links").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    if (resA.error || resB.error) setError(resA.error?.message || resB.error?.message || null);
    load();
  };

  const saveSettings = async () => {
    setBusy(true);
    const supabase = createClient();

    const payload: Record<string, unknown> = {
      ...settings,
      footer_note: settings.footer_note || null,
      avatar_url: settings.avatar_url || null,
      background_image_url: settings.background_image_url || null,
      seo_title: settings.seo_title || null,
      seo_description: settings.seo_description || null,
      og_image_url: settings.og_image_url || null,
      updated_at: new Date().toISOString(),
    };
    // `views` is maintained by the ingest route, never written from here.
    delete payload.views;

    // Retry without any column the remote database does not have yet.
    for (let attempt = 0; attempt < 8; attempt++) {
      const { error: updateError } = await supabase
        .from("link_hub_settings")
        .update(payload)
        .eq("id", true);

      if (!updateError) {
        setBusy(false);
        setDirty(false);
        setError(null);
        flash("Page saved.");
        return;
      }

      const column = missingColumn(updateError.message);
      if (!column || !(column in payload)) {
        setBusy(false);
        return setError(updateError.message);
      }
      delete payload[column];
    }

    setBusy(false);
    setError("Could not save the page details.");
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(PUBLIC_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* the address is on screen either way */
    }
  };

  /* ---------------------------------------------------------------- */

  const liveCount = useMemo(
    () => links.filter((link) => scheduleState(link) === "live").length,
    [links],
  );
  const totalClicks = useMemo(
    () => links.reduce((sum, link) => sum + link.clicks, 0),
    [links],
  );

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-2 text-zinc-500 bg-[#0A0A0A]">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        <span className="text-xs font-medium">Loading link hub...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative radial-space-glow tech-grid-overlay">
      <div className="space-y-5 relative z-10 max-w-7xl mx-auto">
        {error ? (
          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5 backdrop-blur-md">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed break-words">{error}</p>
          </div>
        ) : null}

        {notice ? (
          <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20 text-green-400 text-xs flex items-center gap-2">
            <Check className="w-3.5 h-3.5" />
            {notice}
          </div>
        ) : null}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">Link Hub</h1>
            <p className="text-xs text-zinc-500 mt-1">
              The one link for your social bios. {liveCount} live,{" "}
              {totalClicks.toLocaleString()} clicks all time.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={copyUrl}
              className="btn-glass px-4 py-1.5 text-xs font-semibold rounded-full flex items-center gap-2"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy link"}
            </button>
            <a
              href={PUBLIC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-glass px-4 py-1.5 text-xs font-semibold rounded-full flex items-center gap-2"
            >
              <ExternalLink className="w-3 h-3" />
              View page
            </a>
            <button
              onClick={load}
              className="btn-glass px-4 py-1.5 text-xs font-semibold rounded-full flex items-center gap-2"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-white/8 pb-px">
          {(
            [
              ["content", "Content", <Layers key="c" className="w-3.5 h-3.5" />],
              ["design", "Design", <Palette key="d" className="w-3.5 h-3.5" />],
              ["analytics", "Analytics", <BarChart3 key="a" className="w-3.5 h-3.5" />],
            ] as [Tab, string, React.ReactNode][]
          ).map(([key, label, icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 min-h-[38px] text-xs font-semibold border-b-2 -mb-px transition-all cursor-pointer ${
                tab === key
                  ? "border-white text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {tab === "analytics" ? (
          <LinkHubAnalyticsPanel />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
            <div className="space-y-5 min-w-0">
              {tab === "design" ? (
                <>
                  <LinkHubDesignPanel
                    settings={settings}
                    onChange={(patch) => {
                      setSettings((current) => ({ ...current, ...patch }));
                      setDirty(true);
                    }}
                  />
                  <div className="flex justify-end gap-2 sticky bottom-4">
                    <button
                      onClick={saveSettings}
                      disabled={busy || !dirty}
                      className="btn-primary px-5 py-2 text-xs rounded-full flex items-center gap-1.5 disabled:opacity-40 shadow-lg shadow-black/40"
                    >
                      {busy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      {dirty ? "Save design" : "Saved"}
                    </button>
                  </div>
                </>
              ) : (
                <ContentTab
                  links={links}
                  busy={busy}
                  draft={draft}
                  draftType={draftType}
                  editingId={editingId}
                  editDraft={editDraft}
                  confirmDeleteId={confirmDeleteId}
                  setDraft={setDraft}
                  setDraftType={(type) => {
                    setDraftType(type);
                    setDraft({ ...EMPTY_DRAFT, icon: type === "social" ? "instagram" : "link" });
                    setError(null);
                  }}
                  setEditDraft={setEditDraft}
                  setConfirmDeleteId={setConfirmDeleteId}
                  onStartEdit={(block) => {
                    setEditingId(block.id);
                    setEditDraft({
                      label: block.label,
                      url: block.url,
                      description: block.description || "",
                      icon: block.icon,
                      thumbnail_url: block.thumbnail_url || "",
                      highlight: block.highlight || "none",
                      starts_at: toLocalInput(block.starts_at),
                      ends_at: toLocalInput(block.ends_at),
                    });
                    setError(null);
                  }}
                  onCancelEdit={() => setEditingId(null)}
                  onAdd={addBlock}
                  onSaveEdit={saveEdit}
                  onPatch={patchLink}
                  onRemove={removeLink}
                  onMove={move}
                />
              )}
            </div>

            <div className="lg:sticky lg:top-6">
              <LinkHubPreview links={links} settings={settings} onRefresh={load} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ContentTab({
  links,
  busy,
  draft,
  draftType,
  editingId,
  editDraft,
  confirmDeleteId,
  setDraft,
  setDraftType,
  setEditDraft,
  setConfirmDeleteId,
  onStartEdit,
  onCancelEdit,
  onAdd,
  onSaveEdit,
  onPatch,
  onRemove,
  onMove,
}: {
  links: LinkHubLink[];
  busy: boolean;
  draft: Draft;
  draftType: LinkBlockType | null;
  editingId: string | null;
  editDraft: Draft;
  confirmDeleteId: string | null;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  setDraftType: (type: LinkBlockType | null) => void;
  setEditDraft: React.Dispatch<React.SetStateAction<Draft>>;
  setConfirmDeleteId: (id: string | null) => void;
  onStartEdit: (block: LinkHubLink) => void;
  onCancelEdit: () => void;
  onAdd: () => void;
  onSaveEdit: (block: LinkHubLink) => void;
  onPatch: (id: string, patch: Partial<LinkHubLink>) => void;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
}) {
  return (
    <Panel
      title="Blocks"
      action={
        <div className="flex items-center gap-1.5">
          {(["link", "header", "social"] as LinkBlockType[]).map((type) => (
            <button
              key={type}
              onClick={() => setDraftType(draftType === type ? null : type)}
              className={`px-3 min-h-[30px] rounded-full text-[11px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                draftType === type
                  ? "border-white/30 bg-white/10 text-white"
                  : "border-white/8 bg-white/[0.02] text-zinc-400 hover:text-white"
              }`}
            >
              {draftType === type ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              {BLOCK_LABELS[type].name}
            </button>
          ))}
        </div>
      }
    >
      {draftType ? (
        <div className="mb-5 p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
          <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 flex items-center gap-1.5">
            {BLOCK_LABELS[draftType].icon}
            New {BLOCK_LABELS[draftType].name.toLowerCase()}
          </span>

          <BlockForm
            blockType={draftType}
            draft={draft}
            setDraft={setDraft}
            placeholderLabel={
              draftType === "header"
                ? "Latest work"
                : draftType === "social"
                  ? "Instagram"
                  : "Watch the demo"
            }
          />

          <div className="flex justify-end">
            <button
              onClick={onAdd}
              disabled={busy}
              className="btn-primary px-5 py-2 text-xs rounded-full flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              Add {BLOCK_LABELS[draftType].name.toLowerCase()}
            </button>
          </div>
        </div>
      ) : null}

      {links.length === 0 ? (
        <p className="text-xs text-zinc-600 py-8 text-center">
          Nothing here yet. Add the first block above.
        </p>
      ) : (
        <div className="space-y-2">
          {links.map((block, index) => {
            const isEditing = editingId === block.id;
            const state = scheduleState(block);

            return (
              <div
                key={block.id}
                className={`rounded-xl border px-3 sm:px-4 py-3 transition-all ${
                  state === "live"
                    ? "border-white/8 bg-white/[0.02]"
                    : "border-white/5 bg-white/[0.01] opacity-70"
                }`}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <BlockForm
                      blockType={block.block_type}
                      draft={editDraft}
                      setDraft={setEditDraft}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={onCancelEdit}
                        className="btn-glass px-4 py-1.5 text-xs rounded-full"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => onSaveEdit(block)}
                        disabled={busy}
                        className="btn-primary px-4 py-1.5 text-xs rounded-full flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  // Below sm the row wraps: identity on the first line, the
                  // controls on their own line, so nothing gets squeezed.
                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 sm:flex-nowrap">
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={() => onMove(index, -1)}
                        disabled={index === 0}
                        aria-label="Move up"
                        className="w-6 h-5 flex items-center justify-center rounded text-zinc-500 hover:text-white hover:bg-white/5 disabled:opacity-25 disabled:hover:bg-transparent cursor-pointer"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onMove(index, 1)}
                        disabled={index === links.length - 1}
                        aria-label="Move down"
                        className="w-6 h-5 flex items-center justify-center rounded text-zinc-500 hover:text-white hover:bg-white/5 disabled:opacity-25 disabled:hover:bg-transparent cursor-pointer"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-zinc-400 shrink-0">
                      {block.block_type === "header" ? (
                        <Heading className="w-4 h-4" />
                      ) : (
                        <LinkHubIcon icon={block.icon} className="w-4 h-4" />
                      )}
                    </span>

                    <div className="flex-1 min-w-[140px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-zinc-100 break-words">
                          {block.label}
                        </span>
                        {block.block_type !== "link" ? (
                          <Badge>{BLOCK_LABELS[block.block_type].name}</Badge>
                        ) : null}
                        {block.is_featured ? <Badge>Featured</Badge> : null}
                        {block.highlight && block.highlight !== "none" ? (
                          <Badge>{block.highlight}</Badge>
                        ) : null}
                        {state === "scheduled" ? <Badge tone="blue">Scheduled</Badge> : null}
                        {state === "expired" ? <Badge tone="amber">Ended</Badge> : null}
                        {state === "hidden" ? <Badge tone="muted">Hidden</Badge> : null}
                      </div>
                      {block.block_type === "header" ? null : (
                        <p className="text-[10px] text-zinc-600 font-mono truncate mt-0.5">
                          {block.url}
                        </p>
                      )}
                      {block.starts_at || block.ends_at ? (
                        <p className="text-[9px] text-zinc-600 mt-1 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {block.starts_at ? new Date(block.starts_at).toLocaleString() : "now"}
                          {" to "}
                          {block.ends_at ? new Date(block.ends_at).toLocaleString() : "no end"}
                        </p>
                      ) : null}
                    </div>

                    {block.block_type !== "header" ? (
                      <span
                        className="hidden sm:flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono shrink-0"
                        title="Clicks all time"
                      >
                        <MousePointerClick className="w-3 h-3" />
                        {block.clicks}
                      </span>
                    ) : null}

                    <div className="flex items-center gap-0.5 shrink-0 ml-auto">
                      {block.block_type === "link" ? (
                        <IconButton
                          label={block.is_featured ? "Unfeature" : "Feature"}
                          active={block.is_featured}
                          onClick={() => onPatch(block.id, { is_featured: !block.is_featured })}
                        >
                          <Star className="w-3.5 h-3.5" />
                        </IconButton>
                      ) : null}
                      <IconButton
                        label={block.is_active ? "Hide" : "Show"}
                        active={block.is_active}
                        onClick={() => onPatch(block.id, { is_active: !block.is_active })}
                      >
                        {block.is_active ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                      </IconButton>
                      <button
                        onClick={() => onStartEdit(block)}
                        className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer min-h-[28px]"
                      >
                        Edit
                      </button>

                      {confirmDeleteId === block.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onRemove(block.id)}
                            className="btn-danger px-2.5 py-1 text-[10px]"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 text-[10px] text-zinc-500 hover:text-white cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <IconButton
                          label="Delete"
                          onClick={() => setConfirmDeleteId(block.id)}
                          danger
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </IconButton>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

function BlockForm({
  blockType,
  draft,
  setDraft,
  placeholderLabel,
}: {
  blockType: LinkBlockType;
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  placeholderLabel?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field
          label={blockType === "header" ? "Heading" : "Label"}
          value={draft.label}
          placeholder={placeholderLabel}
          onChange={(v) => setDraft((d) => ({ ...d, label: v }))}
        />
        {blockType !== "header" ? (
          <Field
            label="Address"
            value={draft.url}
            placeholder={blockType === "social" ? "instagram.com/yourhandle" : "abram.network/start"}
            onChange={(v) => setDraft((d) => ({ ...d, url: v }))}
          />
        ) : null}
      </div>

      {blockType === "link" ? (
        <>
          <TextArea
            label="Description (optional)"
            value={draft.description}
            rows={2}
            placeholder="One line on what is behind the link"
            onChange={(v) => setDraft((d) => ({ ...d, description: v }))}
          />
          <ImageField
            label="Thumbnail (optional)"
            folder="thumbnails"
            value={draft.thumbnail_url || null}
            onChange={(v) => setDraft((d) => ({ ...d, thumbnail_url: v || "" }))}
            hint="Replaces the icon with a square image. Drop one here or upload."
          />
        </>
      ) : null}

      {blockType !== "header" ? (
        <IconPicker
          value={draft.icon}
          socialFirst={blockType === "social"}
          onChange={(v) => setDraft((d) => ({ ...d, icon: v }))}
        />
      ) : null}

      {blockType === "link" ? (
        <Choice<LinkHighlight>
          label="Attention"
          value={draft.highlight}
          options={HIGHLIGHT_OPTIONS}
          onChange={(v) => setDraft((d) => ({ ...d, highlight: v }))}
        />
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field
          label="Show from (optional)"
          type="datetime-local"
          value={draft.starts_at}
          onChange={(v) => setDraft((d) => ({ ...d, starts_at: v }))}
        />
        <Field
          label="Hide after (optional)"
          type="datetime-local"
          value={draft.ends_at}
          onChange={(v) => setDraft((d) => ({ ...d, ends_at: v }))}
        />
      </div>
    </div>
  );
}

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "blue" | "amber" | "muted";
}) {
  const tones = {
    default: "bg-white/10 border-white/15 text-white",
    blue: "bg-blue-500/10 border-blue-500/25 text-blue-300",
    amber: "bg-amber-500/10 border-amber-500/25 text-amber-300",
    muted: "bg-white/[0.03] border-white/8 text-zinc-500",
  };
  return (
    <span
      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border capitalize ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
