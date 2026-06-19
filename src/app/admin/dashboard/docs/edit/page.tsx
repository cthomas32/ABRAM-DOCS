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
  FileText
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  readArticleContent, 
  saveArticleContent 
} from "../../../editor-actions";

// AEO brand checker rules
const BANNED_BRANDS = ["Nike", "Adidas", "Apple", "Google", "Netflix", "Dolby", "Spotify", "A24"];
const PLATFORM_BRANDING = ["Supabase", "GitHub", "PostgreSQL", "Postgres"];
const TECHNICAL_JARGON = [
  "RosterTable", "cascade_work_order_status", "contractor_profiles", "total_weekly_hours",
  "serial_number", "daily_rate", "reserved", "in_use"
];

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface SeoWarning {
  id: string;
  type: "error" | "warning";
  text: string;
  fix?: string;
}

function DocsEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileParam = searchParams.get("file");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Editor Form States
  const [content, setContent] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [sidebarTitle, setSidebarTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [keywords, setKeywords] = useState<string>("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [publishDate, setPublishDate] = useState<string>("");

  // Visual modes
  const [previewMode, setPreviewMode] = useState<"split" | "edit" | "preview">("split");
  const [seoWarnings, setSeoWarnings] = useState<SeoWarning[]>([]);

  useEffect(() => {
    if (fileParam) {
      loadFileContent(fileParam);
    } else {
      setLoading(false);
    }
  }, [fileParam]);

  const showToast = (message: string, type: "success" | "error" | "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadFileContent = async (filePath: string) => {
    setLoading(true);
    const result = await readArticleContent(filePath);
    if (result.success && result.frontmatter) {
      setTitle(result.frontmatter.title);
      setSidebarTitle(result.frontmatter.sidebarTitle || "");
      setDescription(result.frontmatter.description || "");
      setKeywords(result.frontmatter.keywords || "");
      setStatus(result.frontmatter.status as "draft" | "published");
      setPublishDate(result.frontmatter.publishDate || "");
      setContent(result.content || "");
    } else {
      showToast(result.error || "Failed to load document content.", "error");
    }
    setLoading(false);
  };

  // SEO Checker Engine
  useEffect(() => {
    const warnings: SeoWarning[] = [];

    if (!fileParam) return;

    // 1. Description character counts
    if (description.length > 160) {
      warnings.push({
        id: "desc-len",
        type: "error",
        text: `Description is too long (${description.length}/160 chars). It will truncate on search engine results.`,
      });
    } else if (description.length > 0 && description.length < 90) {
      warnings.push({
        id: "desc-short",
        type: "warning",
        text: `Description is brief (${description.length}/90 chars). Expand it to improve keyword weights.`,
      });
    }

    // 2. Banned brands checks
    BANNED_BRANDS.forEach((brand) => {
      const regex = new RegExp(`\\b${brand}\\b`, "i");
      if (regex.test(content) || regex.test(title) || regex.test(description)) {
        warnings.push({
          id: `brand-${brand}`,
          type: "error",
          text: `Found commercial brand name "${brand}". All template variables and examples must use fictitious placeholders.`,
          fix: "Vesper"
        });
      }
    });

    // 3. Platform branding checks
    PLATFORM_BRANDING.forEach((platform) => {
      const regex = new RegExp(`\\b${platform}\\b`, "i");
      if (regex.test(content)) {
        warnings.push({
          id: `platform-${platform}`,
          type: "warning",
          text: `Found infrastructure reference "${platform}". Replace with "the system" or "the platform".`,
          fix: "the platform"
        });
      }
    });

    // 4. Postgres schema syntax checks
    TECHNICAL_JARGON.forEach((jargon) => {
      if (content.includes(jargon)) {
        warnings.push({
          id: `jargon-${jargon}`,
          type: "error",
          text: `Found backend database key or code reference "${jargon}". Format in capitalized plain English.`,
          fix: jargon.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
        });
      }
    });

    // 5. Agent Instructions wrapping check
    const agentKeywords = ["prompt", "system instruction", "token limit", "cache duration", "ai routing"];
    const hasAgentWrap = /<AgentOnly>[\s\S]*?<\/AgentOnly>/i.test(content);
    if (!hasAgentWrap) {
      agentKeywords.forEach((kw) => {
        if (content.toLowerCase().includes(kw)) {
          warnings.push({
            id: `agent-wrap-${kw}`,
            type: "warning",
            text: `Technical instruction "${kw}" found. Wrap rules or system limits in an <AgentOnly> block.`,
          });
        }
      });
    }

    setSeoWarnings(warnings);
  }, [content, title, description, fileParam]);

  const handleSave = async () => {
    if (!fileParam) return;
    setSaving(true);
    const result = await saveArticleContent(
      fileParam,
      { title, sidebarTitle, description, keywords, status, publishDate },
      content
    );

    if (result.success) {
      showToast("Article saved and search index rebuilt!", "success");
    } else {
      showToast(result.error || "Failed to save article.", "error");
    }
    setSaving(false);
  };

  const insertAgentOnly = () => {
    const textarea = document.getElementById("editor-textarea") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const replacement = `<AgentOnly>\n\n## 🤖 Agent Operations & System Rules\n${selectedText || "Insert prompt rules here..."}\n\n</AgentOnly>`;
    setContent(text.substring(0, start) + replacement + text.substring(end));
  };

  if (!fileParam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-500 gap-4">
        <AlertTriangle className="w-8 h-8 text-zinc-600" />
        <span className="text-xs">No file specified in query path.</span>
        <Link href="/admin/dashboard/docs" className="btn-glass px-4 py-2 text-xs font-semibold rounded-full">
          Back to Docs Manager
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] relative overflow-hidden -m-4 sm:-m-6 lg:-m-8">
      {/* Navbar Sub Header */}
      <div className="bg-[#0C0C0C] border-b border-white/5 px-6 py-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard/docs" className="btn-glass px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold rounded-full">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Docs list</span>
          </Link>
          <span className="text-zinc-600 text-xs">/</span>
          <span className="text-xs font-semibold text-zinc-400 truncate max-w-xs">{fileParam.replace("user-guide/", "")}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-white/[0.04] p-1 rounded-full border border-white/10 mr-2">
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
            className="btn-primary h-9 px-4 text-xs font-semibold rounded-full flex items-center gap-1.5 cursor-pointer"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Draft</span>
          </button>
        </div>
      </div>

      {/* Editor Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side Editing Pane */}
        <div className={`flex-1 flex flex-col h-full bg-[#0E0E0E] overflow-hidden ${previewMode === "preview" ? "hidden" : ""}`}>
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs">Loading document...</span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Form Metadata Fields */}
              <div className="p-5 border-b border-white/5 bg-zinc-950/20 space-y-4 shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider block mb-1">Document Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Section 1.5: Navigating Your Dashboard"
                      className="w-full bg-[#121212] border border-white/8 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/20"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider block mb-1">Sidebar Title</label>
                    <input
                      type="text"
                      value={sidebarTitle}
                      onChange={(e) => setSidebarTitle(e.target.value)}
                      placeholder="e.g. Dashboard Navigation"
                      className="w-full bg-[#121212] border border-white/8 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/20"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Meta Description</label>
                    <span className={`text-[9px] font-mono ${description.length > 160 ? "text-red-400 font-bold" : "text-zinc-500"}`}>
                      {description.length} / 160
                    </span>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Provide a concise 1-2 sentence description for search preview snippet..."
                    className="w-full bg-[#121212] border border-white/8 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider block mb-1">Keywords</label>
                    <input
                      type="text"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="e.g. billing, invoicing, Stripe, ledger (separated by commas)"
                      className="w-full bg-[#121212] border border-white/8 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider block mb-1">Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full bg-[#121212] border border-white/8 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-white/20 h-[32px]"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider block mb-1">Publish Date</label>
                      <input
                        type="date"
                        value={publishDate}
                        onChange={(e) => setPublishDate(e.target.value)}
                        className="w-full bg-[#121212] border border-white/8 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-white/20 h-[32px] text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Markdown Body Textarea */}
              <div className="flex-1 flex flex-col relative overflow-hidden">
                <div className="bg-zinc-950 px-4 py-2 border-b border-white/5 flex gap-2 items-center justify-between shrink-0">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Markdown/MDX Body</span>
                  <button 
                    onClick={insertAgentOnly}
                    className="btn-glass px-2.5 py-1 text-[9px] font-semibold rounded-full flex items-center gap-1.5 hover:text-white"
                  >
                    <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Wrap AgentOnly</span>
                  </button>
                </div>
                <textarea
                  id="editor-textarea"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="flex-1 w-full bg-[#0E0E0E] text-zinc-300 font-mono text-xs p-6 focus:outline-none resize-none leading-relaxed overflow-y-auto"
                  placeholder="# Article Headline..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Side: SEO Rules Checker and Live Renderer */}
        <div className={`w-full md:w-[400px] xl:w-[500px] border-t md:border-t-0 md:border-l border-white/5 bg-zinc-950/30 flex flex-col h-full overflow-hidden shrink-0 ${
          previewMode === "edit" ? "hidden" : ""
        } ${previewMode === "split" ? "hidden md:flex" : ""}`}>
          {/* SEO Checklist Audit Panel */}
          <div className="p-5 border-b border-white/8 space-y-4 shrink-0 bg-black/20">
            <h3 className="text-xs font-semibold tracking-wider text-zinc-300 uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
              SEO & AEO Quality Checker
            </h3>

            {seoWarnings.length === 0 ? (
              <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-3 flex gap-2 items-start">
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300 leading-relaxed">
                  <span className="font-bold text-green-400 block mb-0.5">All checks passed!</span> This article meets the design, naming, and LLM-crawler optimization rules.
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {seoWarnings.map((warn) => (
                  <div
                    key={warn.id}
                    className={`border rounded-xl p-3 text-xs flex gap-2 items-start transition-colors duration-200 ${
                      warn.type === "error"
                        ? "bg-red-500/5 border-red-500/15 text-red-400"
                        : "bg-yellow-500/5 border-yellow-500/15 text-yellow-400"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-zinc-300 leading-relaxed">{warn.text}</p>
                      {warn.fix && (
                        <button
                          onClick={() => {
                            if (warn.id.startsWith("jargon-") || warn.id.startsWith("platform-")) {
                              const term = warn.id.split("-").slice(1).join("-");
                              setContent((prev) => prev.replaceAll(term, warn.fix!));
                            } else if (warn.id.startsWith("brand-")) {
                              const term = warn.id.replace("brand-", "");
                              setContent((prev) => prev.replaceAll(new RegExp(`\\b${term}\\b`, "gi"), warn.fix!));
                            }
                          }}
                          className="text-[10px] font-bold underline hover:text-white block cursor-pointer"
                        >
                          Auto-fix: Replace with "{warn.fix}"
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* live rendered Preview Component */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 prose prose-invert prose-zinc max-w-none bg-black/10">
            <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest block mb-2">Live Article Preview</span>
            <div className="border border-white/5 bg-[#0E0E0E] p-5 rounded-2xl space-y-4 leading-relaxed text-zinc-300 text-xs min-h-[300px] break-words">
              <h1 className="text-base font-bold text-white mb-1 tracking-tight border-b border-white/5 pb-2">
                {title || "Untitled Document"}
              </h1>
              {description && (
                <p className="text-zinc-500 italic text-[11px] leading-relaxed mb-4">
                  {description}
                </p>
              )}
              {content ? (
                content.split("\n").map((line, idx) => {
                  if (line.startsWith("# ")) {
                    return <h1 key={idx} className="text-sm font-bold text-white mt-4 mb-2">{line.substring(2)}</h1>;
                  }
                  if (line.startsWith("## ")) {
                    return <h2 key={idx} className="text-xs font-bold text-white mt-3 mb-1.5">{line.substring(3)}</h2>;
                  }
                  if (line.startsWith("### ")) {
                    return <h3 key={idx} className="text-[11px] font-bold text-zinc-200 mt-2 mb-1">{line.substring(4)}</h3>;
                  }
                  if (line.startsWith("- ")) {
                    return <li key={idx} className="ml-4 list-disc text-zinc-400">{line.substring(2)}</li>;
                  }
                  if (line.trim() === "") {
                    return <div key={idx} className="h-2" />;
                  }
                  return <p key={idx} className="text-zinc-400 mb-2">{line}</p>;
                })
              ) : (
                <p className="text-zinc-600 italic">Start typing content in the markdown editor...</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-[calc(100%-3rem)] pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="pointer-events-auto w-full p-4 rounded-xl border glass-panel flex items-start gap-3 shadow-2xl"
            >
              {toast.type === "success" ? (
                <div className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 shrink-0">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white break-words">{toast.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function DocsEditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-zinc-500 text-xs">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span>Loading Docs Editor...</span>
      </div>
    }>
      <DocsEditorContent />
    </Suspense>
  );
}
