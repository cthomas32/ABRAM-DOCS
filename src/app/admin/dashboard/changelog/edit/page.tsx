"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  Code, 
  Columns, 
  Cpu, 
  Loader2,
  Tag,
  Clock
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";

function renderFormattedText(text: string): React.ReactNode {
  let tokens: { type: 'text' | 'bold' | 'code' | 'link'; content: string; url?: string }[] = [];
  let index = 0;
  const length = text.length;
  
  while (index < length) {
    if (text.startsWith('[', index)) {
      const closeBracket = text.indexOf(']', index);
      if (closeBracket !== -1 && text.startsWith('(', closeBracket + 1)) {
        const closeParen = text.indexOf(')', closeBracket + 2);
        if (closeParen !== -1) {
          const label = text.substring(index + 1, closeBracket);
          const url = text.substring(closeBracket + 2, closeParen);
          tokens.push({ type: 'link', content: label, url });
          index = closeParen + 1;
          continue;
        }
      }
    }
    
    if (text.startsWith('**', index)) {
      const closeBold = text.indexOf('**', index + 2);
      if (closeBold !== -1) {
        const content = text.substring(index + 2, closeBold);
        tokens.push({ type: 'bold', content });
        index = closeBold + 2;
        continue;
      }
    }
    
    if (text.startsWith('`', index)) {
      const closeCode = text.indexOf('`', index + 1);
      if (closeCode !== -1) {
        const content = text.substring(index + 1, closeCode);
        tokens.push({ type: 'code', content });
        index = closeCode + 1;
        continue;
      }
    }
    
    const char = text[index];
    if (tokens.length > 0 && tokens[tokens.length - 1].type === 'text') {
      tokens[tokens.length - 1].content += char;
    } else {
      tokens.push({ type: 'text', content: char });
    }
    index++;
  }
  
  return tokens.map((token, i) => {
    switch (token.type) {
      case 'bold':
        return <strong key={i} className="font-bold text-white">{token.content}</strong>;
      case 'code':
        return <code key={i} className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-[10px] text-pink-400 border border-white/5">{token.content}</code>;
      case 'link':
        return <a key={i} href={token.url} target="_blank" rel="noopener noreferrer" className="text-zinc-200 hover:text-white underline">{token.content}</a>;
      default:
        return token.content;
    }
  });
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface LintWarning {
  id: string;
  type: "error" | "warning";
  text: string;
}

function ChangelogEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Form States
  const [version, setVersion] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugTouched, setIsSlugTouched] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [publishDate, setPublishDate] = useState("");

  // UI Modes & Validation State
  const [previewMode, setPreviewMode] = useState<"split" | "edit" | "preview">("split");
  const [lintWarnings, setLintWarnings] = useState<LintWarning[]>([]);
  const [versionExists, setVersionExists] = useState(false);
  const [slugExists, setSlugExists] = useState(false);

  useEffect(() => {
    fetchReleaseDetails();
  }, [idParam]);

  const showToast = (message: string, type: "success" | "error" | "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchReleaseDetails = async () => {
    setLoading(true);
    try {
      if (idParam) {
        const { data: release, error } = await supabase
          .from("release_notes")
          .select("*")
          .eq("id", idParam)
          .single();

        if (error) throw error;

        if (release) {
          setVersion(release.version || "");
          setSlug(release.slug || "");
          setTitle(release.title || "");
          setContent(release.content || "");
          setStatus(release.status as "draft" | "published");
          
          if (release.published_at) {
            setPublishDate(new Date(release.published_at).toISOString().split("T")[0]);
          } else {
            setPublishDate("");
          }
        }
      } else {
        // Initial defaults for a new release note
        setVersion("v1.0.0");
        setSlug("v1-0-0");
        setTitle("Initial Stable Release");
        setContent("## New Features\n\n- Bullet item here...\n\n## Improvements\n\n- Bullet item here...");
        setPublishDate("");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load release details.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Check database for duplicate version numbers
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const cleanVer = version.trim().replace(/^v/i, "");
      if (!cleanVer) {
        setVersionExists(false);
        return;
      }
      try {
        let query = supabase
          .from("release_notes")
          .select("id")
          .or(`version.eq.${cleanVer},version.eq.v${cleanVer}`);
        if (idParam) {
          query = query.neq("id", idParam);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          setVersionExists(true);
        } else {
          setVersionExists(false);
        }
      } catch (err) {
        console.error(err);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [version, idParam]);

  // Check database for duplicate slugs
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const cleanSlug = slug.trim();
      if (!cleanSlug) {
        setSlugExists(false);
        return;
      }
      try {
        let query = supabase
          .from("release_notes")
          .select("id")
          .eq("slug", cleanSlug);
        if (idParam) {
          query = query.neq("id", idParam);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          setSlugExists(true);
        } else {
          setSlugExists(false);
        }
      } catch (err) {
        console.error(err);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [slug, idParam]);

  // Auto-slugify version if slug hasn't been touched manually
  useEffect(() => {
    if (!idParam && !isSlugTouched && version) {
      setSlug(version.toLowerCase().replace(/[^a-z0-9-_]+/g, "-"));
    }
  }, [version, isSlugTouched, idParam]);

  // Syntax and SemVer Linter
  useEffect(() => {
    const warnings: LintWarning[] = [];

    // 1. Version format check (SemVer pattern: vMajor.Minor.Patch)
    const semVerRegex = /^v?\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?$/;
    if (!version.trim()) {
      warnings.push({
        id: "version-empty",
        type: "error",
        text: "Version tag cannot be blank."
      });
    } else if (!semVerRegex.test(version.trim())) {
      warnings.push({
        id: "version-semver",
        type: "error",
        text: "Version must match semantic versioning format (e.g. v1.2.0 or 0.9.4)."
      });
    }

    // 2. Duplicate version warning
    if (versionExists) {
      warnings.push({
        id: "version-exists",
        type: "error",
        text: `Version "${version}" already exists in the database. Duplicate version records are blocked.`
      });
    }

    // 3. Slug check
    if (!slug.trim()) {
      warnings.push({
        id: "slug-empty",
        type: "error",
        text: "Slug URL cannot be blank."
      });
    } else if (!/^[a-z0-9-_]+$/.test(slug.trim())) {
      warnings.push({
        id: "slug-format",
        type: "error",
        text: "Slug must contain only lowercase letters, numbers, dashes, and underscores."
      });
    } else if (slugExists) {
      warnings.push({
        id: "slug-exists",
        type: "error",
        text: `Slug "${slug}" already exists. Duplicate slug records are blocked.`
      });
    }

    // 4. Title check
    if (!title.trim()) {
      warnings.push({
        id: "title-empty",
        type: "error",
        text: "Release title cannot be blank."
      });
    }

    // 5. Content length check
    if (!content.trim()) {
      warnings.push({
        id: "content-empty",
        type: "warning",
        text: "Markdown content body is currently empty."
      });
    }

    setLintWarnings(warnings);
  }, [version, versionExists, slug, slugExists, title, content]);

  const handleSave = async () => {
    // Stop save if errors exist
    const errors = lintWarnings.filter((w) => w.type === "error");
    if (errors.length > 0) {
      showToast("Cannot save. Please resolve the critical syntax errors first.", "error");
      return;
    }

    setSaving(true);
    try {
      let published_at_val = null;
      if (status === "published") {
        published_at_val = publishDate 
          ? new Date(publishDate).toISOString() 
          : new Date().toISOString();
      } else if (publishDate) {
        published_at_val = new Date(publishDate).toISOString();
      }

      // Strip optional leading 'v' when saving if we want standard formatting, or keep as typed
      const payload = {
        version: version.trim().replace(/^v/i, ""), // Normalize format in DB as raw version numbers
        slug: slug.trim(),
        title: title.trim(),
        content: content,
        status: status,
        published_at: published_at_val
      };

      if (idParam) {
        const { error } = await supabase
          .from("release_notes")
          .update(payload)
          .eq("id", idParam);

        if (error) throw error;
        showToast("Release notes saved successfully!", "success");
      } else {
        const { data, error } = await supabase
          .from("release_notes")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        showToast("Release notes created successfully!", "success");
        router.replace(`/admin/dashboard/changelog/edit?id=${data.id}`);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to save release notes.", "error");
    } finally {
      setSaving(false);
    }
  };

  const renderMarkdownPreview = () => {
    if (!content.trim()) {
      return <p className="text-zinc-600 italic font-sans">Start writing content in the markdown editor...</p>;
    }

    return content.split("\n").map((line, idx) => {
      if (line.includes("<AgentOnly>")) {
        return (
          <div key={idx} className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 my-3 text-[10px] text-zinc-400 font-mono flex items-center gap-2">
            <Cpu className="w-4 h-4 text-red-500 animate-pulse shrink-0" />
            <span>AGENT-ONLY COMPONENT (Visually hidden on client pages, read by LLM-crawlers)</span>
          </div>
        );
      }
      if (line.includes("</AgentOnly>")) {
        return (
          <div key={idx} className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 my-3 text-[10px] text-zinc-400 font-mono flex items-center gap-2">
            <Cpu className="w-4 h-4 text-zinc-600 shrink-0" />
            <span>END AGENT-ONLY COMPONENT</span>
          </div>
        );
      }

      if (line.startsWith("```")) {
        return <div key={idx} className="h-0.5 bg-zinc-800 my-3 rounded" />;
      }
      if (line.startsWith("# ")) {
        return <h1 key={idx} className="text-sm font-bold text-white mt-5 mb-2 font-sans tracking-tight">{renderFormattedText(line.substring(2))}</h1>;
      }
      if (line.startsWith("## ")) {
        return <h2 key={idx} className="text-xs font-bold text-white mt-4 mb-1.5 font-sans tracking-tight">{renderFormattedText(line.substring(3))}</h2>;
      }
      if (line.startsWith("### ")) {
        return <h3 key={idx} className="text-[11px] font-semibold text-zinc-200 mt-3 mb-1 font-sans tracking-tight">{renderFormattedText(line.substring(4))}</h3>;
      }
      if (line.startsWith("- ")) {
        return <li key={idx} className="ml-4 list-disc text-zinc-400 text-xs font-sans leading-relaxed">{renderFormattedText(line.substring(2))}</li>;
      }
      if (line.startsWith("1. ")) {
        return <li key={idx} className="ml-4 list-decimal text-zinc-400 text-xs font-sans leading-relaxed">{renderFormattedText(line.substring(3))}</li>;
      }
      if (line.trim() === "") {
        return <div key={idx} className="h-2" />;
      }
      return <p key={idx} className="text-zinc-400 text-xs leading-relaxed font-sans mb-2 break-words">{renderFormattedText(line)}</p>;
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Sub Header Navigation */}
      <header className="bg-[#0C0C0C] border-b border-white/5 px-6 py-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard/changelog" className="btn-glass px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold rounded-full select-none">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Releases list</span>
          </Link>
          <span className="text-zinc-600 text-xs">/</span>
          <span className="text-xs font-semibold text-zinc-400 truncate max-w-xs font-sans">
            {idParam ? "Edit Release Notes" : "New Release Notes"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Visual splits toggler */}
          <div className="flex bg-white/[0.04] p-1 rounded-full border border-white/10 mr-2 select-none">
            <button 
              onClick={() => setPreviewMode("edit")} 
              className={`p-1.5 rounded-full transition-all cursor-pointer ${previewMode === "edit" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
              title="Editor Only"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setPreviewMode("split")} 
              className={`hidden md:inline-flex p-1.5 rounded-full transition-all cursor-pointer ${previewMode === "split" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
              title="Split Screen"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setPreviewMode("preview")} 
              className={`p-1.5 rounded-full transition-all cursor-pointer ${previewMode === "preview" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
              title="Preview Only"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          <button 
            onClick={handleSave}
            disabled={saving}
            className="btn-primary h-9 px-4 text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer select-none"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Release</span>
          </button>
        </div>
      </header>

      {/* Editor Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side Inputs */}
        <div className={`flex-1 flex flex-col h-full bg-[#0E0E0E] overflow-hidden ${previewMode === "preview" ? "hidden" : ""}`}>
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs">Loading database records...</span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Form Metadata Section */}
              <div className="p-5 border-b border-white/5 bg-zinc-950/20 space-y-4 shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider block mb-1">Version Number</label>
                    <input
                      type="text"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      placeholder="e.g. v1.2.0"
                      className="w-full bg-[#121212] border border-white/8 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider block mb-1">Slug URL</label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value);
                        setIsSlugTouched(true);
                      }}
                      placeholder="e.g. v1-2-0"
                      className="w-full bg-[#121212] border border-white/8 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider block mb-1">Release Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Multi-currency Ledger & API Improvements"
                    className="w-full bg-[#121212] border border-white/8 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider block mb-1">Publication Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-[#121212] border border-white/8 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-white/20 h-[32px] font-sans"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider block mb-1">Release / Scheduled Date</label>
                    <input
                      type="date"
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                      className="w-full bg-[#121212] border border-white/8 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-white/20 h-[32px] text-center font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Markdown Content Field */}
              <div className="flex-1 flex flex-col relative overflow-hidden">
                <div className="bg-zinc-950 px-4 py-2 border-b border-white/5 flex gap-2 items-center justify-between shrink-0 select-none">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-sans">Markdown Body</span>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="flex-1 w-full bg-[#0E0E0E] text-zinc-300 font-mono text-xs p-6 focus:outline-none resize-none leading-relaxed overflow-y-auto"
                  placeholder="## New Features..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Quality Audits & Live Preview */}
        <div className={`w-full md:w-[400px] xl:w-[500px] border-t md:border-t-0 md:border-l border-white/5 bg-zinc-950/30 flex flex-col h-full overflow-hidden shrink-0 ${
          previewMode === "edit" ? "hidden" : ""
        } ${previewMode === "split" ? "hidden md:flex" : ""}`}>
          {/* Audit panel */}
          <div className="p-5 border-b border-white/8 space-y-4 shrink-0 bg-black/20">
            <h3 className="text-xs font-semibold tracking-wider text-zinc-300 uppercase flex items-center gap-1.5 select-none font-sans">
              <Tag className="w-3.5 h-3.5 text-white animate-pulse" />
              Release Syntax Checker
            </h3>

            {lintWarnings.length === 0 ? (
              <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-3 flex gap-2 items-start font-sans">
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300 leading-relaxed">
                  <span className="font-bold text-green-400 block mb-0.5">SemVer checks passed!</span> This release version format is correct and does not duplicate existing database records.
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {lintWarnings.map((warn) => (
                  <div
                    key={warn.id}
                    className={`border rounded-xl p-3 text-xs flex gap-2 items-start transition-colors duration-200 font-sans ${
                      warn.type === "error"
                        ? "bg-red-500/5 border-red-500/15 text-red-400"
                        : "bg-yellow-500/5 border-yellow-500/15 text-yellow-400"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-zinc-300 leading-relaxed">{warn.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Preview Panel */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 max-w-none bg-black/10">
            <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest block mb-2 select-none font-sans">Live Release Preview</span>
            <div className="border border-white/5 bg-[#0E0E0E] p-6 rounded-2xl space-y-4 leading-relaxed text-zinc-300 text-xs min-h-[300px] break-words">
              <div className="flex flex-wrap items-center gap-3 border-b border-white/5 pb-3 mb-2 select-none">
                <span className="inline-flex items-center rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white border border-white/10 font-mono">
                  v{version ? version.replace(/^v/i, "") : "1.0.0"}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-sans">
                  <Clock className="w-3 h-3 text-zinc-600" />
                  {publishDate ? new Date(publishDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </span>
              </div>
              <h2 className="text-base font-semibold text-zinc-50 mb-4 font-sans tracking-tight">
                {title || "Release Title"}
              </h2>
              <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-300 font-sans release-notes-content">
                {renderMarkdownPreview()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast popup */}
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
              <div className="flex-1 min-w-0 font-sans">
                <p className="text-xs font-medium text-white break-words">{t.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function ChangelogEditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-zinc-500 text-xs">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span>Loading Release Editor...</span>
      </div>
    }>
      <ChangelogEditorContent />
    </Suspense>
  );
}
