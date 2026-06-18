"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  FileText, 
  Search, 
  Loader2, 
  ExternalLink,
  BookOpen
} from "lucide-react";
import Link from "next/link";
import { getArticlesList, createNewArticle } from "../../editor-actions";
import { AnimatePresence, motion } from "framer-motion";

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

  return (
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
          className="btn-primary h-9 px-4 text-xs font-semibold rounded-full flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Article</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-950/20 border border-white/5 p-3 rounded-2xl">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title or file..."
            className="w-full bg-white/[0.02] border border-white/5 rounded-full pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:border-white/10 transition-all duration-200"
          />
        </div>
        <div className="flex gap-2">
          {([
            { id: "all", label: "All Status" },
            { id: "draft", label: "Drafts" },
            { id: "published", label: "Published" },
          ] as const).map((opt) => (
            <button
              key={opt.id}
              onClick={() => setStatusFilter(opt.id)}
              className={`px-3.5 py-1 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
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
              className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-250 flex flex-col justify-between hover:bg-white/[0.01]"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <span className={`text-[9px] px-2 py-0.5 rounded border font-semibold ${
                    art.status === "draft" 
                      ? "bg-zinc-800/20 border-zinc-700/30 text-zinc-400" 
                      : "bg-green-500/10 border-green-500/20 text-green-400"
                  }`}>
                    {art.status}
                  </span>
                  <span className="text-[10px] text-zinc-600 font-mono tracking-tighter">
                    {art.path.replace("user-guide/", "")}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-white leading-snug line-clamp-2">
                    {art.title}
                  </h3>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-white/5 flex gap-2">
                <Link
                  href={`/admin/dashboard/docs/edit?file=${art.path}`}
                  className="btn-glass flex-1 py-1.5 text-[10px] font-bold rounded-full flex items-center justify-center gap-1.5 hover:text-white"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Edit Markdown</span>
                </Link>
                {art.status === "published" && (
                  <Link
                    href={art.path === "index.mdx" ? "/docs" : `/docs/${art.path.replace(/\.(md|mdx)$/, "")}`}
                    target="_blank"
                    className="btn-glass px-3 py-1.5 rounded-full flex items-center justify-center text-zinc-400 hover:text-white"
                    title="View public live page"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md p-6 rounded-2xl border border-white/5 glass-panel relative z-10 space-y-4"
            >
              <h3 className="text-sm font-bold text-white tracking-tight">Create Documentation File</h3>
              <form onSubmit={handleCreateArticle} className="space-y-4">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-1">File Name</label>
                  <input
                    type="text"
                    required
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="e.g. 1.6-talent-schedules.md"
                    className="w-full bg-white/[0.03] border border-white/8 rounded-full px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 h-10"
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
                    className="w-full bg-white/[0.03] border border-white/8 rounded-full px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 h-10"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-glass h-9 px-4 text-xs font-semibold rounded-full"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="btn-primary h-9 px-4 text-xs font-semibold rounded-full flex items-center gap-1.5"
                  >
                    {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Create File</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-[calc(100%-3rem)] pointer-events-none">
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
  );
}
