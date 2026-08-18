"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Tag, 
  Search, 
  Loader2, 
  Clock, 
  Trash2, 
  ExternalLink,
  CheckCircle,
  FileText,
  MoreHorizontal,
  Send
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import ActionSheet, { type SheetAction } from "@/components/admin/ActionSheet";
import Modal from "@/components/admin/Modal";

interface ReleaseNote {
  id: string;
  version: string;
  title: string;
  content: string;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export default function ChangelogPanel() {
  const [releases, setReleases] = useState<ReleaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string | null } | null>(null);
  // Release whose mobile action sheet is open
  const [sheetRelease, setSheetRelease] = useState<ReleaseNote | null>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchReleases();
  }, []);

  const showToast = (message: string, type: "success" | "error" | "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchReleases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("release_notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) {
        setReleases(data);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to fetch release notes.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id: string) => {
    setPublishingId(id);
    const now = new Date().toISOString();
    try {
      // 1. Fetch current release to get version and current slug (select * is safe if slug column is missing)
      const { data: release, error: fetchErr } = await supabase
        .from("release_notes")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchErr) throw fetchErr;

      // 2. Prepare update payload
      const updatePayload: any = { status: "published", published_at: now };
      
      // If slug is null/empty, auto-populate it
      if (release && (!release.slug || !release.slug.trim())) {
        const autoSlug = release.version ? release.version.toLowerCase().replace(/[^a-z0-9-_]+/g, "-") : `v-${id}`;
        updatePayload.slug = autoSlug;
      }

      // 3. Perform the update (retry without slug if it fails)
      let { error } = await supabase
        .from("release_notes")
        .update(updatePayload)
        .eq("id", id);

      if (error && error.message.includes('column "slug"')) {
        // Retry without slug
        delete updatePayload.slug;
        const retry = await supabase
          .from("release_notes")
          .update(updatePayload)
          .eq("id", id);
        error = retry.error;
      }

      if (error) throw error;

      showToast("Release notes published live!", "success");
      fetchReleases();
    } catch (err: any) {
      showToast(err.message || "Publishing failed.", "error");
    }
    setPublishingId(null);
  };

  const executeDelete = async () => {
    if (!confirmDelete || !confirmDelete.id) return;
    try {
      const { error } = await supabase
        .from("release_notes")
        .delete()
        .eq("id", confirmDelete.id);

      if (error) throw error;
      showToast("Release notes deleted permanently.", "success");
      setConfirmDelete(null);
      fetchReleases();
    } catch (err: any) {
      showToast(err.message || "Deletion failed.", "error");
    }
  };

  const handleCreateRelease = () => {
    router.push("/admin/dashboard/changelog/edit");
  };

  const filteredReleases = releases.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.version.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const releaseSlug = (release: ReleaseNote) =>
    release.version?.toLowerCase().replace(/[^a-z0-9-_]+/g, "-") || "undefined";

  /**
   * The overflow menu carries every secondary action, so the card itself
   * only ever shows the one or two things you actually reach for.
   */
  const buildReleaseActions = (release: ReleaseNote): SheetAction[] => [
    release.status === "draft"
      ? {
          id: "preview",
          label: "Preview draft",
          hint: "Open in a new tab",
          icon: ExternalLink,
          href: `/changelog/${releaseSlug(release)}?preview=true`,
          external: true,
        }
      : {
          id: "view",
          label: "View public changelog",
          hint: "Open in a new tab",
          icon: ExternalLink,
          href: `/changelog/${releaseSlug(release)}`,
          external: true,
        },
    {
      id: "delete",
      label: "Delete release",
      hint: "This cannot be undone",
      icon: Trash2,
      danger: true,
      onClick: () => setConfirmDelete({ isOpen: true, id: release.id }),
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
              <Tag className="w-5 h-5 text-zinc-400" />
              Release Notes
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Publish version updates, new features, and technical changelogs in the database.
            </p>
          </div>
          <button
            onClick={handleCreateRelease}
            className="btn-primary h-9 w-full sm:w-auto px-4 text-xs font-medium rounded-full flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Release</span>
          </button>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/20 border border-white/5 p-3 rounded-2xl">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or version..."
              className="w-full bg-white/[0.02] border border-white/5 rounded-full pl-9 pr-4 py-2.5 sm:py-1.5 text-xs text-white focus:outline-none focus:border-white/10 transition-all duration-200"
            />
          </div>
          <div className="grid grid-cols-3 sm:flex gap-2 shrink-0">
            {([
              { id: "all", label: "All Status" },
              { id: "draft", label: "Drafts" },
              { id: "published", label: "Published" },
            ] as const).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setStatusFilter(opt.id)}
                className={`px-2 sm:px-3.5 min-h-[44px] sm:min-h-0 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === opt.id
                    ? "bg-white/10 text-white border border-white/10"
                    : "text-zinc-400 hover:text-zinc-300 border border-transparent"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Release List Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-zinc-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs">Loading database records...</span>
          </div>
        ) : filteredReleases.length === 0 ? (
          <div className="text-center py-16 text-zinc-400 text-xs border border-dashed border-white/5 rounded-2xl">
            No release notes found matching the filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredReleases.map((release) => (
              <div
                key={release.id}
                className="glass-panel rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-250 flex flex-col justify-between hover:bg-white/[0.01] relative"
              >
                {/* Tapping the card opens the editor. The right padding keeps
                    the content clear of the overflow button in the corner. */}
                <Link
                  href={`/admin/dashboard/changelog/edit?id=${release.id}`}
                  className="block p-5 pr-14 space-y-3 rounded-2xl"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[9px] px-2 py-0.5 rounded border font-semibold ${
                      release.status === "published"
                        ? "bg-green-500/10 border-green-500/20 text-green-400"
                        : "bg-zinc-800/20 border-zinc-700/30 text-zinc-400"
                    }`}>
                      {release.status}
                    </span>
                    <span className="text-[10px] font-bold text-white font-mono bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/5">
                      v{release.version}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-white leading-snug line-clamp-2">
                      {release.title}
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-2 line-clamp-3 break-words leading-relaxed font-mono">
                      {release.content.replace(/[#*`\-]/g, "").substring(0, 120)}...
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] text-zinc-400 pt-1">
                    <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
                    <span>Created: {new Date(release.created_at).toLocaleDateString()}</span>
                    {release.published_at && (
                      <>
                        <span className="text-zinc-700">•</span>
                        <span>Published: {new Date(release.published_at).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </Link>

                {/* One control for every secondary action, at every width */}
                <button
                  onClick={() => setSheetRelease(release)}
                  aria-label={`More actions for ${release.title}`}
                  className="absolute top-3.5 right-3.5 w-11 h-11 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-zinc-400 border border-white/8 bg-white/[0.03] hover:text-white hover:bg-white/[0.07] active:bg-white/[0.1] transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                <div className="flex mx-5 mb-5 pt-4 border-t border-white/5 gap-2">
                  <Link
                    href={`/admin/dashboard/changelog/edit?id=${release.id}`}
                    className="btn-glass flex-1 h-10 sm:h-8 px-3 text-[10px] font-medium rounded-full flex items-center justify-center gap-1.5 hover:text-white"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </Link>
                  {release.status === "draft" && (
                    <button
                      onClick={() => handlePublish(release.id)}
                      disabled={publishingId === release.id}
                      className="btn-primary flex-1 h-10 sm:h-8 px-3 text-[10px] font-medium rounded-full flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {publishingId === release.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Publish</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mobile action sheet — secondary actions for the tapped release */}
        <ActionSheet
          open={!!sheetRelease}
          onClose={() => setSheetRelease(null)}
          title={sheetRelease?.title || ""}
          subtitle={sheetRelease ? `v${sheetRelease.version} \u00b7 ${sheetRelease.status}` : undefined}
          actions={sheetRelease ? buildReleaseActions(sheetRelease) : []}
        />

        {/* Delete Confirmation Modal */}
        <Modal
          open={!!confirmDelete?.isOpen}
          onClose={() => setConfirmDelete(null)}
          size="sm"
          labelledBy="delete-release-title"
          panelClassName="border-amber-500/20"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300 mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 id="delete-release-title" className="text-sm font-bold text-white tracking-tight mb-2">
              Delete Release Notes?
            </h3>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              This action cannot be undone. The release record will be permanently deleted from the database.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setConfirmDelete(null)}
                className="btn-glass flex-1 h-11 sm:h-10 text-xs font-medium rounded-full"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="btn-danger flex-1 h-11 sm:h-10 text-xs font-semibold rounded-full flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </Modal>

        {/* Toast Notifications */}
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 flex flex-col gap-3 sm:max-w-sm pointer-events-none">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="pointer-events-auto w-full p-4 rounded-xl border glass-panel flex items-start gap-3 shadow-2xl"
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  t.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/10" : "bg-amber-500/10 text-amber-300 border border-amber-500/10"
                }`}>
                  <CheckCircle className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0 font-sans">
                  <p className="text-xs font-medium text-white break-words">{t.message}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
