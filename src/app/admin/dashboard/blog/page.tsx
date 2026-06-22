"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Sparkles, 
  Search, 
  Loader2, 
  Clock, 
  User, 
  Trash2, 
  Eye, 
  BookOpen, 
  ExternalLink,
  CheckCircle,
  FileText
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  status: "draft" | "published";
  author: string;
  author_avatar?: string | null;
  published_at: string | null;
  created_at: string;
  views?: number;
  reads?: number;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export default function BlogManagerPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string | null } | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState("ABRAM Team");

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchPosts();
    fetchUser();
  }, []);

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
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // 1. Fetch Blog Posts
      const { data: blogData, error: blogErr } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (blogErr) throw blogErr;

      // 2. Fetch Aggregated Telemetry (Views/Reads)
      let analyticsMap: Record<string, { views: number; reads: number }> = {};
      const { data: analyticsData, error: analyticsErr } = await supabase
        .from("content_analytics")
        .select("blog_post_id, views, reads");

      if (!analyticsErr && analyticsData) {
        analyticsData.forEach((row) => {
          if (row.blog_post_id) {
            analyticsMap[row.blog_post_id] = { views: row.views || 0, reads: row.reads || 0 };
          }
        });
      }

      if (blogData) {
        const mappedPosts = blogData.map((post) => ({
          ...post,
          views: analyticsMap[post.id]?.views || 0,
          reads: analyticsMap[post.id]?.reads || 0
        }));
        setPosts(mappedPosts);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to fetch blog posts.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id: string) => {
    setPublishingId(id);
    const now = new Date().toISOString();
    try {
      const { error } = await supabase
        .from("blog_posts")
        .update({ status: "published", published_at: now })
        .eq("id", id);

      if (error) throw error;
      showToast("Blog post published live!", "success");
      fetchPosts();
    } catch (err: any) {
      showToast(err.message || "Publishing failed.", "error");
    }
    setPublishingId(null);
  };

  const executeDelete = async () => {
    if (!confirmDelete || !confirmDelete.id) return;
    try {
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", confirmDelete.id);

      if (error) throw error;
      showToast("Post deleted permanently.", "success");
      setConfirmDelete(null);
      fetchPosts();
    } catch (err: any) {
      showToast(err.message || "Deletion failed.", "error");
    }
  };

  const handleCreatePost = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .insert({
          title: "Untitled Blog Post",
          slug: `untitled-post-${Date.now()}`,
          summary: "Short summary details.",
          content: "# Untitled Blog Post\n\nStart writing your article here...",
          author: currentUserEmail,
          status: "draft"
        })
        .select()
        .single();

      if (error) throw error;
      router.push(`/admin/dashboard/blog/edit?id=${data.id}`);
    } catch (err: any) {
      showToast(err.message || "Failed to create blog post.", "error");
    }
  };

  const filteredPosts = posts.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-zinc-400" />
              Blog Posts
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Manage your announcement articles, custom workflows, and marketing content inside Supabase.
            </p>
          </div>
          <button
            onClick={handleCreatePost}
            className="btn-primary h-9 px-4 text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Post</span>
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
              placeholder="Search by title or slug..."
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

        {/* Blog List Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs">Loading database records...</span>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-xs border border-dashed border-white/5 rounded-2xl">
            No blog posts found matching the filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredPosts.map((post) => (
              <div 
                key={post.id}
                className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-250 flex flex-col justify-between hover:bg-white/[0.01]"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center gap-2">
                    <span className={`text-[9px] px-2 py-0.5 rounded border font-semibold ${
                      post.status === "published" 
                        ? "bg-green-500/10 border-green-500/20 text-green-400" 
                        : "bg-zinc-800/20 border-zinc-700/30 text-zinc-400"
                    }`}>
                      {post.status}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <Eye className="w-3.5 h-3.5 text-zinc-600" />
                      <span>{post.views || 0} views</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-white leading-snug line-clamp-2">
                      {post.title}
                    </h3>
                    {post.summary && (
                      <p className="text-[11px] text-zinc-400 mt-2 line-clamp-2 break-words leading-relaxed">
                        {post.summary}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[9px] text-zinc-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-600" />
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1.5 truncate max-w-[130px]">
                      {post.author_avatar ? (
                        <img
                          src={post.author_avatar}
                          alt={post.author}
                          className="w-3.5 h-3.5 rounded-full object-cover border border-white/10 shrink-0"
                        />
                      ) : (
                        <User className="w-3 h-3 text-zinc-600 shrink-0" />
                      )}
                      <span className="truncate">{post.author}</span>
                    </span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/5 flex gap-2">
                  <Link
                    href={`/admin/dashboard/blog/edit?id=${post.id}`}
                    className="btn-glass flex-1 py-1.5 text-[10px] font-bold rounded-full flex items-center justify-center gap-1.5 hover:text-white"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Edit Draft</span>
                  </Link>
                  {post.status === "draft" ? (
                    <button
                      onClick={() => handlePublish(post.id)}
                      disabled={publishingId === post.id}
                      className="btn-primary flex-1 py-1.5 text-[10px] font-bold rounded-full flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {publishingId === post.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Publish</span>
                    </button>
                  ) : (
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="btn-glass px-3 py-1.5 rounded-full flex items-center justify-center text-zinc-400 hover:text-white"
                      title="View Live Blog Post"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  <button
                    onClick={() => setConfirmDelete({ isOpen: true, id: post.id })}
                    className="btn-glass px-3 py-1.5 rounded-full flex items-center justify-center text-red-400 hover:bg-red-500/10 hover:border-red-500/20 cursor-pointer"
                    title="Delete post"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {confirmDelete && confirmDelete.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setConfirmDelete(null)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm p-6 rounded-2xl border border-white/5 glass-panel flex flex-col items-center text-center relative z-10"
              >
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
                  <Trash2 className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight mb-2">Delete Blog Post?</h3>
                <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                  This action cannot be undone. The post will be permanently deleted from the database.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="btn-glass flex-1 h-10 text-xs font-semibold rounded-full cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeDelete}
                    className="btn-danger flex-1 h-10 text-xs font-semibold rounded-full flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Toast Notification */}
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
                  <CheckCircle className="w-3 h-3" />
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
