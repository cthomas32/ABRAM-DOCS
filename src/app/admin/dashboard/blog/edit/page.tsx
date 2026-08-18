"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  ListChecks, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  Code, 
  Columns, 
  Loader2,
  FileText,
  Cpu,
  Upload,
  User,
  UsersRound
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { MDXRemote } from "next-mdx-remote";
import { mdxComponents } from "@/components/MdxComponents";
import { compileMdxAction } from "@/app/admin/mdx-actions";
import type { TeamMember } from "@/lib/team";

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

function BlogEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Editor Form States
  const [title, setTitle] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [author, setAuthor] = useState<string>("");
  const [publishedAt, setPublishedAt] = useState<string>("");
  const [authorAvatar, setAuthorAvatar] = useState<string>("");
  const [existingAuthors, setExistingAuthors] = useState<{ name: string; avatar: string }[]>([]);

  /**
   * Who wrote it.
   *
   * "member" points the post at a row in the team list, which is where the
   * name, the job title and the photograph live. "guest" is the one-off: a
   * name typed straight in, for somebody who never joined the team. The two
   * are exclusive, so a guest post leaves the team link empty.
   */
  const [authorMode, setAuthorMode] = useState<"member" | "guest">("member");
  const [memberId, setMemberId] = useState<string>("");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const selectedMember = members.find((m) => m.id === memberId) || null;

  // What the byline will say once this is saved, drawn in the live preview.
  const usingMember = authorMode === "member" && !!selectedMember;
  const previewName = usingMember ? selectedMember!.full_name : author || "ABRAM Team";
  const previewJobTitle = usingMember ? selectedMember!.job_title : null;
  const previewPhoto = usingMember ? selectedMember!.photo_url : authorAvatar || null;
  const [existingAvatars, setExistingAvatars] = useState<{ name: string; url: string }[]>([]);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Visual modes
  const [previewMode, setPreviewMode] = useState<"split" | "edit" | "preview">("split");
  const [seoWarnings, setSeoWarnings] = useState<SeoWarning[]>([]);

  // MDX Live Preview States
  const [previewSource, setPreviewSource] = useState<any>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);

  // MDX Live Preview compiler effect
  useEffect(() => {
    if (!content.trim()) {
      setPreviewSource(null);
      setPreviewError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCompiling(true);
      try {
        const res = await compileMdxAction(content);
        if (res.success) {
          setPreviewSource(res.mdxSource);
          setPreviewError(null);
        } else {
          setPreviewError(res.error || "Failed to compile preview");
        }
      } catch (err: any) {
        setPreviewError(err.message || "Failed to compile preview");
      } finally {
        setIsCompiling(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [content]);

  const supabase = createClient();

  /** The team, newest sort order first, for the author picker. */
  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("full_name", { ascending: true });

      if (error) throw error;
      if (data) setMembers(data as TeamMember[]);
    } catch (err) {
      console.error("Error fetching team members:", err);
    }
  };

  /**
   * Guest authors used before, offered as a shortcut. Posts with a team
   * member are left out, since those names come from the picker instead.
   */
  const fetchExistingAuthors = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("author, author_avatar")
        .is("member_id", null)
        .not("author", "is", null)
        .not("author", "eq", "");

      if (error) throw error;
      if (data) {
        const uniqueMap: Record<string, string> = {};
        data.forEach(item => {
          if (item.author) {
            uniqueMap[item.author] = item.author_avatar || "";
          }
        });
        const authorList = Object.keys(uniqueMap).map(name => ({
          name,
          avatar: uniqueMap[name]
        }));
        setExistingAuthors(authorList);
      }
    } catch (err) {
      console.error("Error fetching existing authors:", err);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchExistingAuthors();
    if (idParam) {
      loadBlogPost(idParam);
    } else {
      setTitle("Untitled Blog Post");
      setSlug(`untitled-post-${Date.now()}`);
      setSummary("");
      setContent("# Untitled Blog Post\n\nStart writing your article here...");
      setStatus("draft");
      setAuthor("ABRAM Team");
      setAuthorAvatar("");
      setAuthorMode("member");
      setMemberId("");
      setPublishedAt("");
      setLoading(false);
    }
  }, [idParam]);

  // A new post lands on the first active member, so the common case needs no
  // choosing. An existing post keeps whatever it was saved with.
  useEffect(() => {
    if (idParam || memberId || members.length === 0) return;
    const first = members.find((m) => m.is_active);
    if (first) setMemberId(first.id);
  }, [members, idParam, memberId]);

  const showToast = (message: string, type: "success" | "error" | "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchExistingAvatars = async () => {
    try {
      const { data, error } = await supabase.storage
        .from("blog-images")
        .list("authors", { limit: 100 });

      if (error) throw error;
      if (data) {
        const avatarsList = data
          .filter((file) => file.name !== ".emptyFolderPlaceholder")
          .map((file) => {
            const { data: { publicUrl } } = supabase.storage
              .from("blog-images")
              .getPublicUrl(`authors/${file.name}`);
            return {
              name: file.name,
              url: publicUrl,
            };
          });
        setExistingAvatars(avatarsList);
      }
    } catch (err) {
      console.error("Error listing avatars:", err);
    }
  };

  const toggleAvatarSelector = () => {
    if (!showAvatarSelector) {
      fetchExistingAvatars();
    }
    setShowAvatarSelector(!showAvatarSelector);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `authors/${fileName}`;

      const { data, error } = await supabase.storage
        .from("blog-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("blog-images")
        .getPublicUrl(filePath);

      setAuthorAvatar(publicUrl);
      showToast("Author headshot uploaded!", "success");
      fetchExistingAvatars();
    } catch (err: any) {
      showToast(err.message || "Failed to upload headshot.", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const loadBlogPost = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data) {
        setTitle(data.title || "");
        setSlug(data.slug || "");
        setSummary(data.summary || "");
        setContent(data.content || "");
        setStatus(data.status || "draft");
        setAuthor(data.author || "ABRAM Team");
        setAuthorAvatar(data.author_avatar || "");
        setMemberId(data.member_id || "");
        setAuthorMode(data.member_id ? "member" : "guest");
        if (data.published_at) {
          setPublishedAt(new Date(data.published_at).toISOString().split("T")[0]);
        } else {
          setPublishedAt("");
        }
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load blog post.", "error");
    } finally {
      setLoading(false);
    }
  };

  // SEO/AEO Checker Engine
  useEffect(() => {
    const warnings: SeoWarning[] = [];

    // 1. Summary length check
    if (summary && summary.length > 160) {
      warnings.push({
        id: "desc-len",
        type: "warning",
        text: `Summary is too long (${summary.length}/160 chars). It will truncate on search engine previews.`,
      });
    }

    // 2. Slug empty & format check
    if (!slug || !slug.trim()) {
      warnings.push({
        id: "slug-empty",
        type: "error",
        text: `Slug URL cannot be blank.`,
      });
    } else if (!/^[a-z0-9-_]+$/.test(slug)) {
      warnings.push({
        id: "slug-format",
        type: "error",
        text: `Slug must contain only lowercase letters, numbers, hyphens, and underscores.`,
      });
    }

    // 3. Title check
    if (!title || !title.trim()) {
      warnings.push({
        id: "title-empty",
        type: "error",
        text: "Post title cannot be blank.",
      });
    }

    // 4. Author check. Either a team member is picked or a guest name is typed.
    if (authorMode === "member" && !memberId) {
      warnings.push({
        id: "author-empty",
        type: "error",
        text: "Pick the team member who wrote this, or switch to a guest author.",
      });
    } else if (authorMode === "guest" && !author.trim()) {
      warnings.push({
        id: "author-empty",
        type: "error",
        text: "Guest author name cannot be blank.",
      });
    }

    // 5. Banned brands checks
    BANNED_BRANDS.forEach((brand) => {
      const regex = new RegExp(`\\b${brand}\\b`, "i");
      if (regex.test(content) || regex.test(title) || regex.test(summary)) {
        warnings.push({
          id: `brand-${brand}`,
          type: "error",
          text: `Found commercial brand name "${brand}". Use fictitious placeholder brand names (e.g. Aura, Onyx, Vesper).`,
          fix: "Vesper"
        });
      }
    });

    // 6. Platform branding checks
    PLATFORM_BRANDING.forEach((platform) => {
      const regex = new RegExp(`\\b${platform}\\b`, "i");
      if (regex.test(content)) {
        warnings.push({
          id: `platform-${platform}`,
          type: "warning",
          text: `Found platform branding reference "${platform}". Replace with "the system" or "the platform".`,
          fix: "the platform"
        });
      }
    });

    // 7. Postgres schema syntax checks
    TECHNICAL_JARGON.forEach((jargon) => {
      if (content.includes(jargon)) {
        warnings.push({
          id: `jargon-${jargon}`,
          type: "error",
          text: `Found database schema key or variable "${jargon}". Format in capitalized plain English.`,
          fix: jargon.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
        });
      }
    });

    setSeoWarnings(warnings);
  }, [content, title, summary, slug, author, authorMode, memberId, idParam]);

  const handleSave = async () => {
    // Check for critical errors before saving
    const errors = seoWarnings.filter((w) => w.type === "error" && ["slug-format", "author-empty", "title-empty", "slug-empty"].includes(w.id));
    if (errors.length > 0) {
      showToast(`Cannot save. Please resolve critical errors: ${errors[0].text}`, "error");
      return;
    }

    // Never quietly turn a team byline into a guest one because the team list
    // has not arrived yet.
    if (authorMode === "member" && !selectedMember) {
      showToast("Pick the team member who wrote this before saving.", "error");
      return;
    }

    setSaving(true);
    try {
      const updates: any = {
        title,
        slug,
        summary,
        content,
        status,
        updated_at: new Date().toISOString()
      };

      /**
       * The byline.
       *
       * With a team member picked, the post stores the link and the page
       * reads the name, job title and photograph from that one record. The
       * legacy author columns are written alongside it as a plain snapshot.
       * They are never preferred over the member, and they are never dropped:
       * `member_id` is ON DELETE SET NULL, so if the person is ever removed
       * these two fields are all that keeps a published byline readable, and
       * other parts of the site still read `author` straight off the row.
       *
       * A guest author is the reverse. The typed name and headshot go in the
       * legacy columns and the team link is cleared.
       */
      if (authorMode === "member" && selectedMember) {
        updates.member_id = selectedMember.id;
        updates.author = selectedMember.full_name;
        updates.author_avatar = selectedMember.photo_url || null;
      } else {
        updates.member_id = null;
        updates.author = author;
        updates.author_avatar = authorAvatar || null;
      }

      if (status === "published") {
        updates.published_at = publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString();
      } else {
        updates.published_at = null;
      }

      if (idParam) {
        const { error } = await supabase
          .from("blog_posts")
          .update(updates)
          .eq("id", idParam);

        if (error) throw error;

        // This used to rewrite author_avatar across every post by the same
        // author. A headshot now lives on the team member, so changing it in
        // the team screen changes every byline without touching a post.

        fetchExistingAuthors();
        showToast("Blog post saved successfully!", "success");
      } else {
        const { data, error } = await supabase
          .from("blog_posts")
          .insert(updates)
          .select()
          .single();

        if (error) throw error;

        fetchExistingAuthors();
        showToast("Blog post created successfully!", "success");
        router.replace(`/admin/dashboard/blog/edit?id=${data.id}`);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to save blog post.", "error");
    } finally {
      setSaving(false);
    }
  };

  const renderMarkdownPreview = () => {
    if (!content.trim()) {
      return <p className="text-zinc-400 italic font-sans">Start typing content in the markdown editor...</p>;
    }

    if (previewError) {
      return (
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 my-3 text-xs text-amber-300 font-mono space-y-2">
          <div className="flex items-center gap-2 font-bold text-red-500">
            <AlertTriangle className="w-4 h-4" />
            <span>MDX Syntax Error</span>
          </div>
          <pre className="whitespace-pre-wrap">{previewError}</pre>
        </div>
      );
    }

    return (
      <div className="relative">
        {isCompiling && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[10px] text-zinc-400 bg-zinc-950/60 backdrop-blur border border-white/5 rounded-full px-2 py-0.5 animate-pulse z-10">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Compiling...</span>
          </div>
        )}
        
        <div className="text-zinc-300 font-sans select-text release-notes-content">
          {previewSource ? (
            <MDXRemote {...previewSource} components={mdxComponents} />
          ) : (
            <div className="flex items-center justify-center py-12 text-zinc-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Preparing preview...</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Navbar Sub Header */}
      <div className="bg-[#0C0C0C] border-b border-white/5 px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center gap-x-3 gap-y-2 shrink-0 z-10">
        <Link href="/admin/dashboard/blog" className="btn-glass px-3 h-9 flex items-center gap-1.5 text-xs font-medium rounded-full font-sans shrink-0">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Blog List</span>
        </Link>
        <span className="text-zinc-400 text-xs hidden sm:inline">/</span>
        <span className="hidden sm:block text-xs font-semibold text-zinc-400 truncate max-w-xs">{title || `Edit Post`}</span>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          <div className="flex bg-white/[0.04] p-1 rounded-full border border-white/10">
            <button
              onClick={() => setPreviewMode("edit")}
              className={`p-2.5 sm:p-1.5 rounded-full transition-all cursor-pointer ${previewMode === "edit" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
              title="Editor Only"
              aria-label="Editor only"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPreviewMode("split")}
              className={`hidden md:inline-flex p-1.5 rounded-full transition-all cursor-pointer ${previewMode === "split" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
              title="Split Screen"
              aria-label="Split screen"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPreviewMode("preview")}
              className={`p-2.5 sm:p-1.5 rounded-full transition-all cursor-pointer ${previewMode === "preview" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-zinc-200"}`}
              title="Preview Only"
              aria-label="Preview only"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary h-9 px-3 sm:px-4 text-xs font-medium rounded-full flex items-center gap-1.5 cursor-pointer font-sans"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save<span className="hidden sm:inline"> Post</span></span>
          </button>
        </div>

        {/* Post title gets its own line on narrow screens */}
        <span className="sm:hidden w-full text-[11px] font-semibold text-zinc-400 truncate">
          {title || `Edit Post`}
        </span>
      </div>

      {/* Editor Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side Editing Pane */}
        <div className={`flex-1 flex flex-col h-full bg-[#0E0E0E] overflow-y-auto md:overflow-hidden ${previewMode === "preview" ? "hidden" : ""}`}>
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs font-sans">Loading post details...</span>
            </div>
          ) : (
            <div className="flex flex-col md:flex-1 md:h-full md:overflow-hidden animate-fade-in">
              {/* Form Metadata Fields */}
              <div className="p-4 sm:p-5 border-b border-white/5 bg-zinc-950/20 space-y-4 shrink-0 md:overflow-y-auto md:max-h-[60%]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider block mb-1">Post Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Navigating Team Scheduling Effectively"
                      className="w-full bg-[#121212] border border-white/8 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider block mb-1">Slug URL</label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="e.g. navigating-team-scheduling"
                      className="w-full bg-[#121212] border border-white/8 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 font-sans"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Summary / Intro text</label>
                    <span className={`text-[9px] font-mono ${summary.length > 160 ? "text-amber-300 font-bold" : "text-zinc-400"}`}>
                      {summary.length} / 160
                    </span>
                  </div>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={2}
                    placeholder="Short introduction snippet shown in blog feeds..."
                    className="w-full bg-[#121212] border border-white/8 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 resize-none font-sans"
                  />
                </div>

                {/* Who wrote it. A team member, or a one-off guest name. */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Written by</label>
                    <div className="flex bg-white/[0.04] p-1 rounded-full border border-white/10">
                      {([
                        { id: "member", label: "Team member" },
                        { id: "guest", label: "Guest author" },
                      ] as const).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setAuthorMode(opt.id)}
                          className={`px-3 min-h-[44px] sm:min-h-[30px] rounded-full text-[10px] font-semibold transition-all cursor-pointer font-sans ${
                            authorMode === opt.id ? "bg-white/10 text-white" : "text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {authorMode === "member" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <select
                          value={memberId}
                          onChange={(e) => setMemberId(e.target.value)}
                          className="w-full bg-[#121212] border border-white/8 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-white/20 h-[38px] font-sans"
                        >
                          <option value="">Select a team member...</option>
                          {members
                            .filter((m) => m.is_active || m.id === memberId)
                            .map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.full_name}
                                {m.job_title ? `, ${m.job_title}` : ""}
                                {m.is_active ? "" : " (inactive)"}
                              </option>
                            ))}
                        </select>
                        <p className="text-[9px] text-zinc-400 mt-1.5 leading-relaxed font-sans">
                          {members.length === 0
                            ? "No team members yet. "
                            : "Name, job title and headshot all come from the team record. "}
                          <Link href="/admin/dashboard/team" className="underline hover:text-zinc-400">
                            Manage team
                          </Link>
                        </p>
                      </div>

                      <div className="flex items-center gap-3 bg-[#121212] border border-white/8 rounded-lg px-2 h-[38px] min-w-0">
                        {selectedMember?.photo_url ? (
                          <img
                            src={selectedMember.photo_url}
                            alt={selectedMember.full_name}
                            className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0">
                            <UsersRound className="w-3.5 h-3.5 text-zinc-400" />
                          </div>
                        )}
                        <div className="min-w-0 leading-tight">
                          <span className="block text-[11px] text-white font-semibold truncate font-sans">
                            {selectedMember?.full_name || "Nobody selected"}
                          </span>
                          <span className="block text-[9px] text-zinc-400 truncate font-sans">
                            {selectedMember?.job_title || "Byline preview"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider block mb-1">Guest Author Name</label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="e.g. Jane Rivera, Line Producer"
                      className="w-full bg-[#121212] border border-white/8 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 font-sans"
                    />
                    {existingAuthors.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <span className="text-[9px] text-zinc-400 self-center mr-1">Quick Select:</span>
                        {existingAuthors.map((item) => (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => {
                              setAuthor(item.name);
                              setAuthorAvatar(item.avatar);
                            }}
                            className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/15 text-[9px] text-zinc-300 font-sans transition-all cursor-pointer flex items-center gap-1"
                          >
                            {item.avatar && (
                              <img src={item.avatar} alt="" className="w-3 h-3 rounded-full object-cover shrink-0" />
                            )}
                            <span>{item.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider block mb-1">Author Headshot</label>
                    <div className="flex items-center gap-3 bg-[#121212] border border-white/8 rounded-lg p-2 h-[38px] relative">
                      {authorAvatar ? (
                        <img
                          src={authorAvatar}
                          alt="Author avatar"
                          className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-zinc-400" />
                        </div>
                      )}
                      
                      <div className="flex-1 flex gap-1.5 items-center justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const fileInput = document.getElementById("avatar-upload-input");
                            fileInput?.click();
                          }}
                          disabled={uploadingAvatar}
                          className="btn-glass px-2.5 py-1 text-[9px] font-medium rounded-full flex items-center gap-1 cursor-pointer h-6"
                        >
                          {uploadingAvatar ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Upload className="w-2.5 h-2.5" />}
                          <span>Upload</span>
                        </button>
                        <input
                          id="avatar-upload-input"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                        
                        <button
                          type="button"
                          onClick={toggleAvatarSelector}
                          className="btn-glass px-2.5 py-1 text-[9px] font-medium rounded-full cursor-pointer h-6"
                        >
                          <span>Select Existing</span>
                        </button>
                      </div>

                      {/* Dropdown Gallery Selector */}
                      <AnimatePresence>
                        {showAvatarSelector && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute top-[42px] right-0 z-20 w-64 p-3 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl space-y-2 max-h-48 overflow-y-auto"
                          >
                            <div className="flex justify-between items-center pb-1 border-b border-white/5">
                              <span className="text-[9px] uppercase font-bold text-zinc-400">Select Headshot</span>
                              <button
                                type="button"
                                onClick={() => setShowAvatarSelector(false)}
                                className="text-[10px] text-zinc-400 hover:text-white font-bold"
                              >
                                Close
                              </button>
                            </div>
                            
                            {existingAvatars.length === 0 ? (
                              <p className="text-[9px] text-zinc-400 text-center py-2 italic font-sans">No uploaded headshots found.</p>
                            ) : (
                              <div className="grid grid-cols-4 gap-2">
                                {existingAvatars.map((av) => (
                                  <button
                                    key={av.name}
                                    type="button"
                                    onClick={() => {
                                      setAuthorAvatar(av.url);
                                      setShowAvatarSelector(false);
                                    }}
                                    className={`relative aspect-square rounded-lg border overflow-hidden hover:border-white/20 transition-all cursor-pointer ${
                                      authorAvatar === av.url ? "border-white" : "border-white/5"
                                    }`}
                                  >
                                    <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider block mb-1">Status</label>
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
                    <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider block mb-1">Publish date</label>
                    <input
                      type="date"
                      value={publishedAt}
                      onChange={(e) => setPublishedAt(e.target.value)}
                      className="w-full bg-[#121212] border border-white/8 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-white/20 h-[32px] text-center font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Markdown Body Textarea */}
              <div className="flex flex-col relative md:flex-1 md:overflow-hidden">
                <div className="bg-zinc-950 px-4 py-2 border-b border-white/5 flex gap-2 items-center justify-between shrink-0">
                  <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Article Content (Markdown)</span>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full min-h-[55vh] md:min-h-0 md:flex-1 bg-[#0E0E0E] text-zinc-300 font-mono text-xs p-4 sm:p-6 focus:outline-none resize-none leading-relaxed md:overflow-y-auto"
                  placeholder="# Article title..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Side: SEO Rules Checker and Live Renderer */}
        <div className={`border-t md:border-t-0 md:border-l border-white/5 bg-zinc-950/30 flex flex-col h-full overflow-hidden ${
          previewMode === "preview" ? "flex-1" : "w-full md:w-[400px] xl:w-[500px] shrink-0"
        } ${
          previewMode === "edit" ? "hidden" : ""
        } ${previewMode === "split" ? "hidden md:flex" : ""}`}>
          {/* SEO Checklist Audit Panel */}
          <div className={`p-5 border-b border-white/8 space-y-4 shrink-0 bg-black/20 ${previewMode === "preview" ? "hidden" : ""}`}>
            <h3 className="text-xs font-semibold tracking-wider text-zinc-300 uppercase flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5 text-white" />
              SEO & AEO Quality Checker
            </h3>

            {seoWarnings.length === 0 ? (
              <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-3 flex gap-2 items-start">
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300 leading-relaxed font-sans">
                  <span className="font-bold text-green-400 block mb-0.5">All checks passed!</span> This blog article meets structural, brand safety, and AI indexing guidelines.
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {seoWarnings.map((warn) => (
                  <div
                    key={warn.id}
                    className={`border rounded-xl p-3 text-xs flex gap-2 items-start transition-colors duration-200 ${
                      warn.type === "error"
                        ? "bg-amber-500/5 border-amber-500/15 text-amber-300"
                        : "bg-yellow-500/5 border-yellow-500/15 text-yellow-400"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-zinc-300 leading-relaxed font-sans">{warn.text}</p>
                      {warn.fix && (
                        <button
                          onClick={() => {
                            let term = "";
                            if (warn.id.startsWith("jargon-") || warn.id.startsWith("platform-")) {
                              term = warn.id.split("-").slice(1).join("-");
                            } else if (warn.id.startsWith("brand-")) {
                              term = warn.id.replace("brand-", "");
                            }
                            if (term) {
                              setContent((prev) => prev.replaceAll(new RegExp(`\\b${term}\\b`, "gi"), warn.fix!));
                            }
                          }}
                          className="text-[10px] font-bold underline hover:text-white block cursor-pointer font-sans"
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
            <span className={`text-[9px] uppercase font-bold text-zinc-400 tracking-widest block mb-2 font-sans ${previewMode === "preview" ? "max-w-3xl mx-auto px-1" : ""}`}>Live Blog Article Preview</span>
            <div className={`border border-white/5 bg-[#0E0E0E] rounded-2xl space-y-4 leading-relaxed text-zinc-300 text-xs min-h-[300px] break-words transition-all duration-300 ${
              previewMode === "preview" ? "max-w-3xl w-full mx-auto my-4 p-8 sm:p-10 border-white/10" : "w-full p-5"
            }`}>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {previewPhoto ? (
                    <img
                      src={previewPhoto}
                      alt={previewName}
                      className="w-5 h-5 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[9px] text-zinc-400 shrink-0">
                      {previewName.charAt(0) || "A"}
                    </div>
                  )}
                  <span className="truncate">By {previewName}</span>
                  {previewJobTitle && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-zinc-700 shrink-0" />
                      <span className="truncate text-zinc-400">{previewJobTitle}</span>
                    </>
                  )}
                </div>
                <span>{publishedAt || "Draft Mode"}</span>
              </div>
              <h1 className="text-base font-bold text-white mb-1 tracking-tight border-b border-white/5 pb-2 font-sans">
                {title || "Untitled Blog Post"}
              </h1>
              {summary && (
                <p className="text-zinc-400 italic text-[11px] leading-relaxed mb-4 font-sans">
                  {summary}
                </p>
              )}
              {renderMarkdownPreview()}
            </div>
          </div>
        </div>
      </div>

      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 flex flex-col gap-3 sm:max-w-sm pointer-events-none">
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
                <div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300 shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white break-words font-sans">{toast.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function BlogEditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-zinc-400 text-xs">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span>Loading Editor...</span>
      </div>
    }>
      <BlogEditorContent />
    </Suspense>
  );
}
