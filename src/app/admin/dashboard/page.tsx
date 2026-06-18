"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { signOut as signOutAction } from "../actions";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  LogOut, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Trash2, 
  Loader2,
  FileText,
  Clock,
  User
} from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  status: "draft" | "published";
  author: string;
  published_at: string | null;
  created_at: string;
}

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

export default function DashboardPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNote[]>([]);
  const [activeTab, setActiveTab] = useState<"blog" | "changelog">("blog");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Custom Visual Feedback States
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string | null } | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("ABRAM Team");

  // Creation Form State
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newVersion, setNewVersion] = useState("");
  const [newSummary, setNewSummary] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newAuthor, setNewAuthor] = useState("ABRAM Team");
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchData();
    fetchUser();
  }, []);

  // Body Scroll Lock when Modals are open
  useEffect(() => {
    if (showCreateModal || (confirmDelete && confirmDelete.isOpen)) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showCreateModal, confirmDelete]);

  const showToast = (message: string, type: "success" | "error" | "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setCurrentUserEmail(user.email);
        setNewAuthor(user.email);
      }
    } catch (err) {
      console.error("Error fetching user session:", err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: blogData, error: blogErr } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: releaseData, error: releaseErr } = await supabase
        .from("release_notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (blogErr) showToast(`Error fetching blogs: ${blogErr.message}`, "error");
      if (releaseErr) showToast(`Error fetching release notes: ${releaseErr.message}`, "error");

      if (blogData) setPosts(blogData);
      if (releaseData) setReleaseNotes(releaseData);

      // Auto-select the first item on desktop
      if (window.innerWidth >= 768) {
        if (activeTab === "blog" && blogData && blogData.length > 0) {
          setSelectedItem(blogData[0]);
        } else if (activeTab === "changelog" && releaseData && releaseData.length > 0) {
          setSelectedItem(releaseData[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: "blog" | "changelog") => {
    setActiveTab(tab);
    setMobileView("list");
    const list = tab === "blog" ? posts : releaseNotes;
    if (list.length > 0 && window.innerWidth >= 768) {
      setSelectedItem(list[0]);
    } else {
      setSelectedItem(null);
    }
  };

  const handleSignOut = async () => {
    const result = await signOutAction();
    if (result.error) {
      showToast(`Sign out failed: ${result.error}`, "error");
    } else {
      router.push("/admin");
      router.refresh();
    }
  };

  const handlePublish = async (id: string) => {
    setPublishingId(id);
    const table = activeTab === "blog" ? "blog_posts" : "release_notes";
    const now = new Date().toISOString();

    const { error } = await supabase
      .from(table)
      .update({ status: "published", published_at: now })
      .eq("id", id);

    if (error) {
      showToast(`Publishing failed: ${error.message}`, "error");
    } else {
      showToast("Entry published successfully", "success");
      // Update local state
      if (activeTab === "blog") {
        setPosts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: "published", published_at: now } : p))
        );
        setSelectedItem((prev: any) =>
          prev && prev.id === id ? { ...prev, status: "published", published_at: now } : prev
        );
      } else {
        setReleaseNotes((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: "published", published_at: now } : r))
        );
        setSelectedItem((prev: any) =>
          prev && prev.id === id ? { ...prev, status: "published", published_at: now } : prev
        );
      }
    }
    setPublishingId(null);
  };

  const triggerDelete = (id: string) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const executeDelete = async () => {
    if (!confirmDelete || !confirmDelete.id) return;
    const table = activeTab === "blog" ? "blog_posts" : "release_notes";
    const { error } = await supabase.from(table).delete().eq("id", confirmDelete.id);

    if (error) {
      showToast(`Deletion failed: ${error.message}`, "error");
    } else {
      showToast("Entry deleted successfully", "success");
      setSelectedItem(null);
      setConfirmDelete(null);
      fetchData();
      setMobileView("list");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (activeTab === "blog") {
      const { error } = await supabase.from("blog_posts").insert({
        title: newTitle,
        slug: newSlug || newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        summary: newSummary,
        content: newContent,
        author: newAuthor,
        status: "draft",
      });

      if (error) {
        showToast(error.message, "error");
      } else {
        showToast("Blog draft saved successfully", "success");
        setShowCreateModal(false);
        resetForm();
        fetchData();
      }
    } else {
      const { error } = await supabase.from("release_notes").insert({
        version: newVersion,
        title: newTitle,
        content: newContent,
        status: "draft",
      });

      if (error) {
        showToast(error.message, "error");
      } else {
        showToast("Release draft saved successfully", "success");
        setShowCreateModal(false);
        resetForm();
        fetchData();
      }
    }
    setSubmitting(false);
  };

  const resetForm = () => {
    setNewTitle("");
    setNewSlug("");
    setNewVersion("");
    setNewSummary("");
    setNewContent("");
    setNewAuthor(currentUserEmail);
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-zinc-100 font-sans flex flex-col relative overflow-hidden">
      {/* Top Navbar */}
      <header className="fixed top-0 z-40 w-full bg-black/50 backdrop-blur-[20px] border-b border-white/8 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-6">
          <span className="font-bold tracking-tight text-white text-sm sm:text-base">
            ABRAM CMS
          </span>
          <span className="text-zinc-600 text-xs">/</span>
          <span className="text-xs text-zinc-400 font-medium">Dashboard</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary h-11 md:h-9 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 md:w-3.5 md:h-3.5" />
            <span className="hidden sm:inline">New {activeTab === "blog" ? "Post" : "Release"}</span>
          </button>
          <button 
            onClick={handleSignOut} 
            className="btn-glass h-11 md:h-9 px-3 sm:px-4 py-1.5 text-xs font-medium rounded-full flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4 md:w-3.5 md:h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main body content */}
      <div className="flex flex-1 pt-[73px] h-screen overflow-hidden">
        {/* Left Sidebar: Lists (hidden on mobile when details are active) */}
        <aside className={`w-full md:w-80 border-r border-white/5 bg-zinc-950/20 flex flex-col h-full overflow-hidden ${
          mobileView === "detail" ? "hidden md:flex" : "flex"
        }`}>
          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-white/5 p-4 gap-2">
            {(["blog", "changelog"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className="relative flex-1 py-3 text-center text-xs font-medium rounded-full transition-colors duration-200 cursor-pointer select-none h-11 flex items-center justify-center"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <span className={`relative z-10 ${activeTab === tab ? "text-white" : "text-zinc-400 hover:text-zinc-200"}`}>
                  {tab === "blog" ? "Blog Posts" : "Changelog"}
                </span>
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-white/[0.05] border border-white/10 rounded-full"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* List Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-500">
                <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                <span className="text-xs">Loading entries...</span>
              </div>
            ) : activeTab === "blog" ? (
              posts.length === 0 ? (
                <div className="text-center text-xs text-zinc-500 py-10">No blog posts found.</div>
              ) : (
                posts.map((post) => (
                  <motion.button
                    key={post.id}
                    onClick={() => {
                      setSelectedItem(post);
                      setMobileView("detail");
                    }}
                    className={`relative w-full text-left p-4 rounded-xl border transition-all duration-200 flex flex-col gap-2 cursor-pointer select-none overflow-hidden ${
                      selectedItem?.id === post.id
                        ? "bg-white/[0.04] border-white/15"
                        : "bg-zinc-950/20 border-white/5 hover:bg-zinc-900/20 hover:border-white/10"
                    }`}
                    layout
                  >
                    {selectedItem?.id === post.id && (
                      <motion.div
                        layoutId="activeItemIndicator"
                        className="absolute left-0 top-3 bottom-3 w-[3px] bg-red-500 rounded-r"
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      />
                    )}
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-semibold text-xs text-white line-clamp-1 pr-2">
                        {post.title}
                      </h3>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full border shrink-0 ${
                          post.status === "published"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                        }`}
                      >
                        {post.status}
                      </span>
                    </div>
                    {post.summary && (
                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed break-words">
                        {post.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-medium mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </motion.button>
                ))
              )
            ) : releaseNotes.length === 0 ? (
              <div className="text-center text-xs text-zinc-500 py-10">No release notes found.</div>
            ) : (
              releaseNotes.map((note) => (
                <motion.button
                  key={note.id}
                  onClick={() => {
                    setSelectedItem(note);
                    setMobileView("detail");
                  }}
                  className={`relative w-full text-left p-4 rounded-xl border transition-all duration-200 flex flex-col gap-2 cursor-pointer select-none overflow-hidden ${
                    selectedItem?.id === note.id
                      ? "bg-white/[0.04] border-white/15"
                      : "bg-zinc-950/20 border-white/5 hover:bg-zinc-900/20 hover:border-white/10"
                  }`}
                  layout
                >
                  {selectedItem?.id === note.id && (
                    <motion.div
                      layoutId="activeItemIndicator"
                      className="absolute left-0 top-3 bottom-3 w-[3px] bg-red-500 rounded-r"
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    />
                  )}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white shrink-0 border border-white/5">
                        {note.version}
                      </span>
                      <h3 className="font-semibold text-xs text-white line-clamp-1 min-w-0 pr-2">
                        {note.title}
                      </h3>
                    </div>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full border shrink-0 ${
                        note.status === "published"
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                      }`}
                    >
                      {note.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-medium mt-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(note.created_at).toLocaleDateString()}</span>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </aside>

        {/* Right Pane: Selected Item Detail / Preview (hidden on mobile when list is active) */}
        <section className={`flex-1 bg-zinc-950/10 p-6 sm:p-8 flex flex-col overflow-y-auto ${
          mobileView === "list" ? "hidden md:flex" : "flex"
        }`}>
          {/* Mobile Back Button */}
          <div className="md:hidden mb-6">
            <button
              onClick={() => setMobileView("list")}
              className="btn-glass h-11 px-4 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to list</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {selectedItem ? (
              <motion.div
                key={selectedItem.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="max-w-3xl w-full mx-auto space-y-6"
              >
                {/* Header Info */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 border-b border-white/5 pb-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      {activeTab === "changelog" && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-white/10 text-white border border-white/10">
                          {selectedItem.version}
                        </span>
                      )}
                      <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight break-words pr-2">
                        {selectedItem.title}
                      </h2>
                    </div>
                    <p className="text-xs text-zinc-500 break-words flex items-center gap-1.5 flex-wrap">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Created {new Date(selectedItem.created_at).toLocaleString()}</span>
                      {selectedItem.author && (
                        <>
                          <span className="text-zinc-700">•</span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-zinc-600" />
                            {selectedItem.author}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {selectedItem.status === "draft" && (
                      <button
                        onClick={() => handlePublish(selectedItem.id)}
                        disabled={publishingId === selectedItem.id}
                        className="btn-primary h-11 md:h-9 px-4 py-1.5 text-xs font-semibold rounded-full flex items-center justify-center gap-1.5"
                      >
                        {publishingId === selectedItem.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Publishing...</span>
                          </>
                        ) : (
                          <span>Approve & Publish</span>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => triggerDelete(selectedItem.id)}
                      className="btn-danger h-11 md:h-9 px-4 py-1.5 text-xs font-semibold rounded-full flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* Summary (if blog) */}
                {activeTab === "blog" && selectedItem.summary && (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-zinc-300 leading-relaxed break-words">
                    <strong className="text-white block sm:inline mr-1">Summary:</strong> {selectedItem.summary}
                  </div>
                )}

                {/* Raw Content Preview */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-zinc-500" />
                    <h4 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500">
                      Markdown Content Preview
                    </h4>
                  </div>
                  <div className="p-5 sm:p-6 rounded-xl bg-zinc-950 border border-white/5 font-mono text-[11px] text-zinc-300 whitespace-pre-wrap leading-relaxed overflow-x-auto break-all sm:break-normal">
                    {selectedItem.content}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-2 text-center"
              >
                <FileText className="w-6 h-6 text-zinc-600 mb-1" />
                <span className="text-xs">Select an entry to view details and approve.</span>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {/* Creation Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full max-w-xl p-5 sm:p-8 rounded-2xl border border-white/5 glass-panel flex flex-col max-h-[90vh] overflow-hidden relative z-10"
            >
              <h3 className="text-lg font-bold text-white tracking-tight mb-6">
                Create New {activeTab === "blog" ? "Blog Post" : "Release Note"}
              </h3>

              <form onSubmit={handleCreate} className="flex-1 overflow-y-auto space-y-4 pr-1">
                <div>
                  <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-400 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Scaling out crew matching algorithm"
                    className="w-full bg-white/[0.03] border border-white/8 rounded-full px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-all duration-200"
                  />
                </div>

                {activeTab === "blog" ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-400 mb-2">
                          Slug (Optional)
                        </label>
                        <input
                          type="text"
                          value={newSlug}
                          onChange={(e) => setNewSlug(e.target.value)}
                          placeholder="e.g. crew-matching-scaling"
                          className="w-full bg-white/[0.03] border border-white/8 rounded-full px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-400 mb-2">
                          Author
                        </label>
                        <input
                          type="text"
                          value={newAuthor}
                          onChange={(e) => setNewAuthor(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/8 rounded-full px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-400 mb-2">
                        Summary
                      </label>
                      <input
                        type="text"
                        value={newSummary}
                        onChange={(e) => setNewSummary(e.target.value)}
                        placeholder="A short summary of the article..."
                        className="w-full bg-white/[0.03] border border-white/8 rounded-full px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-all duration-200"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-400 mb-2">
                      Version Code
                    </label>
                    <input
                      type="text"
                      required
                      value={newVersion}
                      onChange={(e) => setNewVersion(e.target.value)}
                      placeholder="e.g. v1.2.0"
                      className="w-full bg-white/[0.03] border border-white/8 rounded-full px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-all duration-200"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-400 mb-2">
                    Content (Markdown Supported)
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="## What's new in this release..."
                    className="w-full bg-white/[0.03] border border-white/8 rounded-2xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-all duration-200 font-mono resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-glass h-11 sm:h-9 px-4 py-1.5 text-xs font-semibold rounded-full flex items-center justify-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary h-11 sm:h-9 px-4 py-1.5 text-xs font-semibold rounded-full flex items-center justify-center gap-1.5"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Draft</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog Modal */}
      <AnimatePresence>
        {confirmDelete && confirmDelete.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDelete(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm p-6 rounded-2xl border border-white/5 glass-panel flex flex-col items-center text-center relative z-10"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4 shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight mb-2">
                Delete this entry?
              </h3>
              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                This action cannot be undone. The draft or published entry will be permanently removed.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="btn-glass flex-1 h-11 py-2 text-xs font-semibold rounded-full"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  className="btn-danger flex-1 h-11 py-2 text-xs font-semibold rounded-full flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toasts Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-xs sm:max-w-sm w-[calc(100%-3rem)] pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="pointer-events-auto w-full p-4 rounded-xl border glass-panel shadow-2xl flex items-start gap-3"
            >
              {toast.type === "success" ? (
                <div className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 shrink-0">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
              ) : toast.type === "error" ? (
                <div className="w-5 h-5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white break-words">{toast.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </main>
  );
}
