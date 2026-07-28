"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  MousePointerClick,
  Plus,
  RefreshCw,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  DEFAULT_SETTINGS,
  LINK_ICON_KEYS,
  normalizeLinkUrl,
  type LinkHubLink,
  type LinkHubSettings,
} from "@/lib/linkHub";
import LinkHubIcon from "@/components/links/LinkHubIcon";

const PUBLIC_URL = "https://abram.network/links";

interface DraftLink {
  label: string;
  url: string;
  description: string;
  icon: string;
}

const EMPTY_DRAFT: DraftLink = { label: "", url: "", description: "", icon: "link" };

export default function LinkHubAdminPage() {
  const [links, setLinks] = useState<LinkHubLink[]>([]);
  const [settings, setSettings] = useState<LinkHubSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [draft, setDraft] = useState<DraftLink>(EMPTY_DRAFT);
  const [showDraft, setShowDraft] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<DraftLink>(EMPTY_DRAFT);
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
      setLinks((linksResult.data as LinkHubLink[]) || []);
    }
    if (settingsResult.data) setSettings(settingsResult.data as LinkHubSettings);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------------------------------------------------------------- */

  const addLink = async () => {
    const url = normalizeLinkUrl(draft.url);
    if (!draft.label.trim()) return setError("Give the link a label.");
    if (!url) return setError("That does not look like a valid web address.");

    setBusy(true);
    const nextOrder = links.length ? Math.max(...links.map((l) => l.sort_order)) + 10 : 10;
    const supabase = createClient();
    const { error: insertError } = await supabase.from("link_hub_links").insert({
      label: draft.label.trim(),
      url,
      description: draft.description.trim() || null,
      icon: draft.icon,
      sort_order: nextOrder,
    });

    setBusy(false);
    if (insertError) return setError(insertError.message);

    setError(null);
    setDraft(EMPTY_DRAFT);
    setShowDraft(false);
    flash("Link added.");
    load();
  };

  const saveEdit = async (id: string) => {
    const url = normalizeLinkUrl(editDraft.url);
    if (!editDraft.label.trim()) return setError("Give the link a label.");
    if (!url) return setError("That does not look like a valid web address.");

    setBusy(true);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("link_hub_links")
      .update({
        label: editDraft.label.trim(),
        url,
        description: editDraft.description.trim() || null,
        icon: editDraft.icon,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

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
    flash("Link removed.");
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
    const { error: updateError } = await supabase
      .from("link_hub_settings")
      .update({
        heading: settings.heading,
        subheading: settings.subheading,
        footer_note: settings.footer_note || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", true);
    setBusy(false);
    if (updateError) return setError(updateError.message);
    flash("Page details saved.");
  };

  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-2 text-zinc-500 bg-[#0A0A0A]">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        <span className="text-xs font-medium">Loading link hub...</span>
      </div>
    );
  }

  const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative radial-space-glow tech-grid-overlay">
      <div className="space-y-6 relative z-10 max-w-5xl mx-auto">
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
              The one link for your social bios. {links.filter((l) => l.is_active).length} live,{" "}
              {totalClicks.toLocaleString()} clicks all time.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
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

        {/* Page details */}
        <div className="glass-panel p-6 rounded-2xl border-white/8 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
            Page Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Heading"
              value={settings.heading}
              onChange={(v) => setSettings((s) => ({ ...s, heading: v }))}
            />
            <Field
              label="Subheading"
              value={settings.subheading}
              onChange={(v) => setSettings((s) => ({ ...s, subheading: v }))}
            />
          </div>
          <Field
            label="Footer note (optional)"
            value={settings.footer_note || ""}
            onChange={(v) => setSettings((s) => ({ ...s, footer_note: v }))}
          />

          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={busy}
              className="btn-primary px-5 py-2 text-xs rounded-full flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              Save details
            </button>
          </div>
        </div>

        {/* Links */}
        <div className="glass-panel p-6 rounded-2xl border-white/8">
          <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Links</h2>
            <button
              onClick={() => {
                setShowDraft((v) => !v);
                setError(null);
              }}
              className="btn-primary px-4 py-1.5 text-xs rounded-full flex items-center gap-1.5"
            >
              {showDraft ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {showDraft ? "Cancel" : "Add link"}
            </button>
          </div>

          {showDraft ? (
            <div className="mb-5 p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field
                  label="Label"
                  value={draft.label}
                  placeholder="Follow on Instagram"
                  onChange={(v) => setDraft((d) => ({ ...d, label: v }))}
                />
                <Field
                  label="URL"
                  value={draft.url}
                  placeholder="instagram.com/yourhandle"
                  onChange={(v) => setDraft((d) => ({ ...d, url: v }))}
                />
              </div>
              <Field
                label="Description (optional)"
                value={draft.description}
                placeholder="Behind the scenes and product clips"
                onChange={(v) => setDraft((d) => ({ ...d, description: v }))}
              />
              <IconPicker value={draft.icon} onChange={(v) => setDraft((d) => ({ ...d, icon: v }))} />
              <div className="flex justify-end">
                <button
                  onClick={addLink}
                  disabled={busy}
                  className="btn-primary px-5 py-2 text-xs rounded-full flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add link
                </button>
              </div>
            </div>
          ) : null}

          {links.length === 0 ? (
            <p className="text-xs text-zinc-600 py-8 text-center">
              No links yet. Add the first one above.
            </p>
          ) : (
            <div className="space-y-2">
              {links.map((link, index) => {
                const isEditing = editingId === link.id;

                return (
                  <div
                    key={link.id}
                    className={`rounded-xl border px-4 py-3 transition-all ${
                      link.is_active
                        ? "border-white/8 bg-white/[0.02]"
                        : "border-white/5 bg-white/[0.01] opacity-60"
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Field
                            label="Label"
                            value={editDraft.label}
                            onChange={(v) => setEditDraft((d) => ({ ...d, label: v }))}
                          />
                          <Field
                            label="URL"
                            value={editDraft.url}
                            onChange={(v) => setEditDraft((d) => ({ ...d, url: v }))}
                          />
                        </div>
                        <Field
                          label="Description"
                          value={editDraft.description}
                          onChange={(v) => setEditDraft((d) => ({ ...d, description: v }))}
                        />
                        <IconPicker
                          value={editDraft.icon}
                          onChange={(v) => setEditDraft((d) => ({ ...d, icon: v }))}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="btn-glass px-4 py-1.5 text-xs rounded-full"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveEdit(link.id)}
                            disabled={busy}
                            className="btn-primary px-4 py-1.5 text-xs rounded-full flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Save className="w-3.5 h-3.5" />
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        {/* Reorder */}
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button
                            onClick={() => move(index, -1)}
                            disabled={index === 0}
                            aria-label="Move up"
                            className="w-6 h-5 flex items-center justify-center rounded text-zinc-500 hover:text-white hover:bg-white/5 disabled:opacity-25 disabled:hover:bg-transparent cursor-pointer"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => move(index, 1)}
                            disabled={index === links.length - 1}
                            aria-label="Move down"
                            className="w-6 h-5 flex items-center justify-center rounded text-zinc-500 hover:text-white hover:bg-white/5 disabled:opacity-25 disabled:hover:bg-transparent cursor-pointer"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-zinc-400 shrink-0">
                          <LinkHubIcon icon={link.icon} className="w-4 h-4" />
                        </span>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-zinc-100 break-words">
                              {link.label}
                            </span>
                            {link.is_featured ? (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-white">
                                Featured
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[10px] text-zinc-600 font-mono truncate mt-0.5">
                            {link.url}
                          </p>
                        </div>

                        <span
                          className="hidden sm:flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono shrink-0"
                          title="Clicks"
                        >
                          <MousePointerClick className="w-3 h-3" />
                          {link.clicks}
                        </span>

                        <div className="flex items-center gap-1 shrink-0">
                          <IconButton
                            label={link.is_featured ? "Unfeature" : "Feature"}
                            active={link.is_featured}
                            onClick={() => patchLink(link.id, { is_featured: !link.is_featured })}
                          >
                            <Star className="w-3.5 h-3.5" />
                          </IconButton>
                          <IconButton
                            label={link.is_active ? "Hide" : "Show"}
                            active={link.is_active}
                            onClick={() => patchLink(link.id, { is_active: !link.is_active })}
                          >
                            {link.is_active ? (
                              <Eye className="w-3.5 h-3.5" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5" />
                            )}
                          </IconButton>
                          <button
                            onClick={() => {
                              setEditingId(link.id);
                              setEditDraft({
                                label: link.label,
                                url: link.url,
                                description: link.description || "",
                                icon: link.icon,
                              });
                              setError(null);
                            }}
                            className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer min-h-[28px]"
                          >
                            Edit
                          </button>

                          {confirmDeleteId === link.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => removeLink(link.id)}
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
                              onClick={() => setConfirmDeleteId(link.id)}
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
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 block mb-1.5">
        {label}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-full bg-white/[0.04] border border-white/10 px-4 py-2 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-white/20 transition-all"
      />
    </label>
  );
}

function IconPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 block mb-1.5">
        Icon
      </span>
      <div className="flex flex-wrap gap-1.5">
        {LINK_ICON_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            title={key}
            aria-label={key}
            className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all cursor-pointer ${
              value === key
                ? "border-white/30 bg-white/10 text-white"
                : "border-white/5 bg-white/[0.02] text-zinc-500 hover:text-zinc-200 hover:border-white/15"
            }`}
          >
            <LinkHubIcon icon={key} className="w-4 h-4" />
          </button>
        ))}
      </div>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  active,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`w-8 h-8 flex items-center justify-center rounded-full transition-all cursor-pointer ${
        danger
          ? "text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
          : active
            ? "text-white bg-white/10"
            : "text-zinc-500 hover:text-white hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}
