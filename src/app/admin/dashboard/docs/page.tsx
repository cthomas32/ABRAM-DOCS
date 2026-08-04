"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  FileText, 
  Search, 
  Loader2, 
  ExternalLink,
  BookOpen,
  MoreHorizontal
} from "lucide-react";
import Link from "next/link";
import { getArticlesList, createNewArticle } from "../../editor-actions";
import { AnimatePresence, motion } from "framer-motion";
import ActionSheet, { type SheetAction } from "@/components/admin/ActionSheet";
import Modal from "@/components/admin/Modal";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export default function DocsManagerPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileTitle, setNewFileTitle] = useState("");
  const [creating, setCreating] = useState(false);

  // Article whose mobile action sheet is open
  const [sheetArticle, setSheetArticle] = useState<any | null>(null);

  useEffect(() => {
    loadArticles();
  }, []);

  const showToast = (message: string, type: "success" | "error" | "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadArticles = async () => {
    setLoading(true);
    const result = await getArticlesList();
    if (result.success && result.articles) {
      setArticles(result.articles);
    } else {
      showToast(result.error || "Failed to load articles.", "error");
    }
    setLoading(false);
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName || !newFileTitle) return;
    setCreating(true);

    const result = await createNewArticle(newFileName, newFileTitle);
    if (result.success && result.relativePath) {
      showToast("Documentation file created successfully!", "success");
      setShowCreateModal(false);
      setNewFileName("");
      setNewFileTitle("");
      loadArticles();
    } else {
      showToast(result.error || "Failed to create article.", "error");
    }
    setCreating(false);
  };

  const filteredArticles = articles.filter((art) => {
    const matchesSearch = art.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          art.path.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || art.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  /**
   * The overflow menu carries every secondary action, so the card itself
   * only ever shows the one thing you actually reach for.
   */
  const buildArticleActions = (art: any): SheetAction[] => {
    const actions: SheetAction[] = [
      {
        id: "edit",
        label: "Edit markdown",
        hint: "Open the document editor",
        icon: FileText,
        href: `/admin/dashboard/docs/edit?file=${art.path}`,
      },
    ];

    if (art.status === "published") {
      actions.push({
        id: "view",
        label: "View live page",
        hint: "Open in a new tab",
        icon: ExternalLink,
        href: art.path === "index.mdx" ? "/docs" : `/docs/${art.path.replace(/\.(md|mdx)$/, "")}`,
        external: true,
      });
    }

    return actions;
  };

  const publishedHref = (path: string) =>
    path === "index.mdx" ? "/docs" : `/docs/${path.replace(/\.(md|mdx)$/, "")}`;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-zinc-400" />
              Help Center Docs
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Manage your localized help guides and index pages stored as markdown files on disk.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary h-11 sm:h-9 w-full sm:w-auto px-4 text-xs font-semibold rounded-full flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Article</span>
          </button>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/20 border border-white/5 p-3 rounded-2xl">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or file..."
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
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Files Grid List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs">Scanning documentation folder...</span>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-xs border border-dashed border-white/5 rounded-2xl">
            No documentation guides match the current filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredArticles.map((art) => (
              <div
                key={art.path}
                className="glass-panel rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-250 flex flex-col justify-between hover:bg-white/[0.01] relative"
              >
                {/* Tapping the card opens the editor. The right padding keeps
                    the content clear of the overflow button in the corner. */}
                <Link
                  href={`/admin/dashboard/docs/edit?file=${art.path}`}
                  className="block p-5 pr-14 space-y-3 rounded-2xl"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[9px] px-2 py-0.5 rounded border font-semibold shrink-0 ${
                      art.status === "draft"
                        ? "bg-zinc-800/20 border-zinc-700/30 text-zinc-400"
                        : "bg-green-500/10 border-green-500/20 text-green-400"
                    }`}>
                      {art.status}
                    </span>
                    <span className="text-[10px] text-zinc-600 font-mono tracking-tighter break-all min-w-0">
                      {art.path.replace("user-guide/", "")}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-white leading-snug line-clamp-2">
                      {art.title}
                    </h3>
                  </div>
                </Link>

                {/* One control for every secondary action, at every width */}
                <button
                  onClick={() => setSheetArticle(art)}
                  aria-label={`More actions for ${art.title}`}
                  className="absolute top-3.5 right-3.5 w-11 h-11 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-zinc-400 border border-white/8 bg-white/[0.03] hover:text-white hover:bg-white/[0.07] active:bg-white/[0.1] transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                <div className="flex mx-5 mb-5 pt-4 border-t border-white/5 gap-2">
                  <Link
                    href={`/admin/dashboard/docs/edit?file=${art.path}`}
                    className="btn-glass flex-1 h-10 sm:h-8 px-3 text-[10px] font-bold rounded-full flex items-center justify-center gap-1.5 hover:text-white"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Edit Markdown</span>
                  </Link>
                  {art.status === "published" && (
                    <Link
                      href={publishedHref(art.path)}
                      target="_blank"
                      className="btn-glass w-10 h-10 sm:w-8 sm:h-8 px-0 rounded-full flex items-center justify-center text-zinc-400 hover:text-white shrink-0"
                      title="View public live page"
                      aria-label="View public live page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mobile action sheet — secondary actions for the tapped article */}
        <ActionSheet
          open={!!sheetArticle}
          onClose={() => setSheetArticle(null)}
          title={sheetArticle?.title || ""}
          subtitle={sheetArticle ? `${sheetArticle.path?.replace("user-guide/", "")} \u00b7 ${sheetArticle.status}` : undefined}
          actions={sheetArticle ? buildArticleActions(sheetArticle) : []}
        />

        {/* Creation Modal */}
        <Modal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          dismissable={!creating}
          labelledBy="create-doc-title"
        >
          <h3 id="create-doc-title" className="text-sm font-bold text-white tracking-tight">
            Create Documentation File
          </h3>
          <form onSubmit={handleCreateArticle} className="space-y-4">
            <div>
              <label className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-1">File Name</label>
              <input
                type="text"
                required
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="e.g. 1.6-talent-schedules.md"
                className="w-full bg-white/[0.03] border border-white/8 rounded-full px-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 h-10"
              />
              <span className="text-[9px] text-zinc-500 mt-1 block">Format: [SectionNum]-[slug-name].md</span>
            </div>
            <div>
              <label className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-1">Article Title</label>
              <input
                type="text"
                required
                value={newFileTitle}
                onChange={(e) => setNewFileTitle(e.target.value)}
                placeholder="e.g. Talent shift coordination"
                className="w-full bg-white/[0.03] border border-white/8 rounded-full px-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 h-10"
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn-glass h-11 sm:h-9 px-4 text-xs font-semibold rounded-full"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="btn-primary h-11 sm:h-9 px-4 text-xs font-semibold rounded-full flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Create File</span>
              </button>
            </div>
          </form>
        </Modal>

        {/* Toast Container */}
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
                  t.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/10" : "bg-red-500/10 text-red-400 border border-red-500/10"
                }`}>
                  <FileText className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
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
