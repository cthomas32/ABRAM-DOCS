"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  UsersRound,
  Plus,
  Loader2,
  Upload,
  Pencil,
  Search,
  CheckCircle,
  AlertTriangle,
  EyeOff,
  Eye,
  Newspaper,
  Mail,
  Link as LinkIcon,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Modal from "@/components/admin/Modal";
import { slugifyName, type TeamMember } from "@/lib/team";

/**
 * The team screen.
 *
 * One row per person, and the only place their name, job title and
 * photograph are written down. A blog byline and a contact card both read
 * from here, so changing a headshot is one edit rather than one edit per
 * post, which is what it used to be.
 *
 * Nobody is deleted from this screen. Deactivating takes a person out of the
 * author picker and leaves every published post exactly as it was: the post
 * keeps a plain text copy of the name and headshot from the last time it was
 * saved, and falls back to it whenever the member record cannot be read.
 */

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

/** The editable half of a member, as the form holds it. */
interface MemberForm {
  id: string | null;
  full_name: string;
  slug: string;
  job_title: string;
  photo_url: string;
  short_bio: string;
  email: string;
  linkedin_url: string;
  x_url: string;
  website: string;
  location: string;
  sort_order: number;
  is_active: boolean;
}

const EMPTY_FORM: MemberForm = {
  id: null,
  full_name: "",
  slug: "",
  job_title: "",
  photo_url: "",
  short_bio: "",
  email: "",
  linkedin_url: "",
  x_url: "",
  website: "",
  location: "",
  sort_order: 0,
  is_active: true,
};

/** Headshots share the folder the blog editor already uploads to. */
const PHOTO_BUCKET = "blog-images";
const PHOTO_FOLDER = "authors";

const FIELD_CLASS =
  "w-full bg-[#121212] border border-white/8 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 font-sans";
const LABEL_CLASS = "text-[9px] uppercase font-bold text-zinc-400 tracking-wider block mb-1";

export default function TeamPage() {
  const supabase = createClient();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [postCounts, setPostCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [form, setForm] = useState<MemberForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<TeamMember | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("full_name", { ascending: true });

      if (error) throw error;
      setMembers((data || []) as TeamMember[]);

      // How many published and draft posts each person carries. Shown so it
      // is obvious what a change here touches.
      const { data: posts } = await supabase.from("blog_posts").select("member_id");
      const counts: Record<string, number> = {};
      (posts || []).forEach((row: { member_id: string | null }) => {
        if (row.member_id) counts[row.member_id] = (counts[row.member_id] || 0) + 1;
      });
      setPostCounts(counts);
    } catch (err: any) {
      showToast(err.message || "Could not load the team.", "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const openCreate = () => setForm({ ...EMPTY_FORM, sort_order: members.length });

  const openEdit = (member: TeamMember) =>
    setForm({
      id: member.id,
      full_name: member.full_name || "",
      slug: member.slug || "",
      job_title: member.job_title || "",
      photo_url: member.photo_url || "",
      short_bio: member.short_bio || "",
      email: member.email || "",
      linkedin_url: member.linkedin_url || "",
      x_url: member.x_url || "",
      website: member.website || "",
      location: member.location || "",
      sort_order: member.sort_order ?? 0,
      is_active: member.is_active,
    });

  const patchForm = (patch: Partial<MemberForm>) =>
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${PHOTO_FOLDER}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

      // The browser talks to the bucket directly, the same way the blog
      // editor uploads a headshot. A server action would cap the file size.
      const { error } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: true });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);

      patchForm({ photo_url: publicUrl });
      showToast("Headshot uploaded.", "success");
    } catch (err: any) {
      showToast(err.message || "Could not upload that photograph.", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!form) return;

    const fullName = form.full_name.trim();
    if (!fullName) {
      showToast("A person needs a name.", "error");
      return;
    }

    const slug = (form.slug.trim() || slugifyName(fullName)).toLowerCase();
    if (!/^[a-z0-9-]+$/.test(slug)) {
      showToast("The handle can only hold lowercase letters, numbers and hyphens.", "error");
      return;
    }

    setSaving(true);
    const payload = {
      full_name: fullName,
      slug,
      job_title: form.job_title.trim() || null,
      photo_url: form.photo_url.trim() || null,
      short_bio: form.short_bio.trim() || null,
      email: form.email.trim() || null,
      linkedin_url: form.linkedin_url.trim() || null,
      x_url: form.x_url.trim() || null,
      website: form.website.trim() || null,
      // Written on the shared record because an email sign off reads it too.
      location: form.location.trim() || null,
      sort_order: Number.isFinite(form.sort_order) ? form.sort_order : 0,
      is_active: form.is_active,
    };

    try {
      if (form.id) {
        const { error } = await supabase.from("team_members").update(payload).eq("id", form.id);
        if (error) throw error;
        showToast(`${fullName} updated. Every byline follows.`, "success");
      } else {
        const { error } = await supabase.from("team_members").insert(payload);
        if (error) throw error;
        showToast(`${fullName} added to the team.`, "success");
      }
      setForm(null);
      fetchMembers();
    } catch (err: any) {
      const message: string = err?.message || "Could not save that.";
      showToast(
        message.includes("duplicate") || message.includes("unique")
          ? `The handle "${slug}" is already taken. Pick another.`
          : message,
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const setActive = async (member: TeamMember, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("team_members")
        .update({ is_active: isActive })
        .eq("id", member.id);

      if (error) throw error;
      showToast(
        isActive
          ? `${member.full_name} is back in the author list.`
          : `${member.full_name} is deactivated. Published posts keep their byline.`,
        "success"
      );
      setConfirmDeactivate(null);
      fetchMembers();
    } catch (err: any) {
      showToast(err.message || "Could not change that.", "error");
    }
  };

  const filtered = members.filter((m) => {
    const needle = searchTerm.toLowerCase();
    const matches =
      m.full_name.toLowerCase().includes(needle) ||
      (m.job_title || "").toLowerCase().includes(needle) ||
      m.slug.toLowerCase().includes(needle);
    return matches && (showInactive || m.is_active);
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
              <UsersRound className="w-5 h-5 text-zinc-400" />
              Team
            </h1>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-2xl">
              The people who write here. A name, a job title and a photograph, written down once.
              Blog bylines and contact cards both read from this list, so a new headshot is one edit.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="btn-primary h-9 w-full sm:w-auto px-4 text-xs font-medium rounded-full flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Person</span>
          </button>
        </div>

        {/* Search and filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/20 border border-white/5 p-3 rounded-2xl">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, title or handle..."
              className="w-full bg-white/[0.02] border border-white/5 rounded-full pl-9 pr-4 py-2.5 sm:py-1.5 text-xs text-white focus:outline-none focus:border-white/10 transition-all duration-200"
            />
          </div>
          <button
            onClick={() => setShowInactive((v) => !v)}
            className={`px-3.5 min-h-[44px] sm:min-h-0 sm:py-1.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer border shrink-0 ${
              showInactive
                ? "bg-white/10 text-white border-white/10"
                : "text-zinc-400 hover:text-zinc-300 border-transparent"
            }`}
          >
            {showInactive ? "Showing everyone" : "Active only"}
          </button>
        </div>

        {/* The list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-zinc-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs">Loading the team...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-zinc-400 text-xs border border-dashed border-white/5 rounded-2xl">
            Nobody here yet. Add the first person to give a post a byline.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((member) => (
              <div
                key={member.id}
                className={`glass-panel rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-250 flex flex-col justify-between p-5 ${
                  member.is_active ? "" : "opacity-60"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={member.full_name}
                      className="w-12 h-12 rounded-full object-cover border border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 shrink-0">
                      <UsersRound className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-white truncate">{member.full_name}</h3>
                      {!member.is_active && (
                        <span className="text-[9px] px-2 py-0.5 rounded border font-semibold bg-zinc-800/20 border-zinc-700/30 text-zinc-400">
                          inactive
                        </span>
                      )}
                    </div>
                    {member.job_title && (
                      <p className="text-[11px] text-zinc-400 truncate">{member.job_title}</p>
                    )}
                    <p className="text-[10px] text-zinc-400 font-mono truncate">/{member.slug}</p>
                  </div>
                </div>

                {member.short_bio && (
                  <p className="text-[11px] text-zinc-400 leading-relaxed mt-3 line-clamp-2 break-words">
                    {member.short_bio}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-zinc-400 mt-3">
                  <span className="flex items-center gap-1">
                    <Newspaper className="w-3 h-3 text-zinc-400" />
                    {postCounts[member.id] || 0} posts
                  </span>
                  {member.email && (
                    <span className="flex items-center gap-1 truncate max-w-[160px]">
                      <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </span>
                  )}
                  {member.website && (
                    <span className="flex items-center gap-1 truncate max-w-[140px]">
                      <LinkIcon className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span className="truncate">{member.website}</span>
                    </span>
                  )}
                </div>

                <div className="flex gap-2 pt-4 mt-4 border-t border-white/5">
                  <button
                    onClick={() => openEdit(member)}
                    className="btn-glass flex-1 h-9 px-3 text-[10px] font-medium rounded-full flex items-center justify-center gap-1.5 hover:text-white"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  {member.is_active ? (
                    <button
                      onClick={() => setConfirmDeactivate(member)}
                      className="btn-glass flex-1 h-9 px-3 text-[10px] font-medium rounded-full flex items-center justify-center gap-1.5"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Deactivate</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setActive(member, true)}
                      className="btn-glass flex-1 h-9 px-3 text-[10px] font-medium rounded-full flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Reactivate</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-[10px] text-zinc-400 leading-relaxed">
          Removing somebody is deliberately not possible here. Deactivating takes them out of the
          author picker and leaves every published post standing.{" "}
          <Link href="/admin/dashboard/blog" className="underline hover:text-zinc-400">
            Blog posts
          </Link>
        </p>
      </div>

      {/* Create and edit form */}
      <Modal
        open={!!form}
        onClose={() => !saving && setForm(null)}
        dismissable={!saving}
        size="md"
        labelledBy="team-form-title"
      >
        <div className="flex items-center justify-between gap-3">
          <h3 id="team-form-title" className="text-sm font-bold text-white tracking-tight">
            {form?.id ? "Edit person" : "Add person"}
          </h3>
          <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-zinc-400">Team</span>
        </div>

        {form && (
          <div className="space-y-4">
            {/* Headshot */}
            <div className="flex items-center gap-3">
              {form.photo_url ? (
                <img
                  src={form.photo_url}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover border border-white/10 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 shrink-0">
                  <UsersRound className="w-5 h-5" />
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => document.getElementById("team-photo-input")?.click()}
                    disabled={uploading}
                    className="btn-glass h-9 px-3 text-[10px] font-medium rounded-full flex items-center gap-1.5"
                  >
                    {uploading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Upload className="w-3 h-3" />
                    )}
                    <span>Upload headshot</span>
                  </button>
                  {form.photo_url && (
                    <button
                      type="button"
                      onClick={() => patchForm({ photo_url: "" })}
                      className="btn-ghost h-9 px-3 text-[10px] font-bold rounded-full"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  id="team-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <p className="text-[9px] text-zinc-400 leading-relaxed">
                  Used on every byline and contact card at once.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Full name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => {
                    const full_name = e.target.value;
                    // The handle follows the name until somebody sets one.
                    patchForm(
                      form.id || form.slug !== slugifyName(form.full_name)
                        ? { full_name }
                        : { full_name, slug: slugifyName(full_name) }
                    );
                  }}
                  placeholder="e.g. Jane Rivera"
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Job title</label>
                <input
                  type="text"
                  value={form.job_title}
                  onChange={(e) => patchForm({ job_title: e.target.value })}
                  placeholder="e.g. Line Producer"
                  className={FIELD_CLASS}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Based in</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => patchForm({ location: e.target.value })}
                  placeholder="e.g. Washington, DC"
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Handle</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => patchForm({ slug: e.target.value })}
                  placeholder="e.g. jane"
                  className={`${FIELD_CLASS} font-mono`}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Order in the list</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => patchForm({ sort_order: parseInt(e.target.value, 10) || 0 })}
                  className={FIELD_CLASS}
                />
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Short bio</label>
              <textarea
                value={form.short_bio}
                onChange={(e) => patchForm({ short_bio: e.target.value })}
                rows={2}
                placeholder="A sentence or two, used on contact cards."
                className={`${FIELD_CLASS} resize-none`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => patchForm({ email: e.target.value })}
                  placeholder="name@abram.network"
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Website</label>
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) => patchForm({ website: e.target.value })}
                  placeholder="abram.network"
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>LinkedIn</label>
                <input
                  type="text"
                  value={form.linkedin_url}
                  onChange={(e) => patchForm({ linkedin_url: e.target.value })}
                  placeholder="linkedin.com/in/..."
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>X</label>
                <input
                  type="text"
                  value={form.x_url}
                  onChange={(e) => patchForm({ x_url: e.target.value })}
                  placeholder="x.com/..."
                  className={FIELD_CLASS}
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 min-h-[44px] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => patchForm({ is_active: e.target.checked })}
                className="w-4 h-4 accent-white cursor-pointer"
              />
              <span className="text-xs text-zinc-300">
                Active
                <span className="block text-[10px] text-zinc-400">
                  Inactive people stay off the author picker. Their published posts are untouched.
                </span>
              </span>
            </label>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setForm(null)}
                disabled={saving}
                className="btn-glass flex-1 h-11 sm:h-10 text-xs font-medium rounded-full"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1 h-11 sm:h-10 text-xs font-medium rounded-full flex items-center justify-center gap-1.5"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>{form.id ? "Save changes" : "Add to team"}</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Deactivate confirmation */}
      <Modal
        open={!!confirmDeactivate}
        onClose={() => setConfirmDeactivate(null)}
        size="sm"
        labelledBy="deactivate-title"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-300 mb-4">
            <EyeOff className="w-6 h-6" />
          </div>
          <h3 id="deactivate-title" className="text-sm font-bold text-white tracking-tight mb-2">
            Deactivate {confirmDeactivate?.full_name}?
          </h3>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            They come out of the author picker. The{" "}
            {postCounts[confirmDeactivate?.id || ""] || 0} posts already written stay published and
            keep their byline. You can bring them back at any time.
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setConfirmDeactivate(null)}
              className="btn-glass flex-1 h-11 sm:h-10 text-xs font-medium rounded-full"
            >
              Cancel
            </button>
            <button
              onClick={() => confirmDeactivate && setActive(confirmDeactivate, false)}
              className="btn-primary flex-1 h-11 sm:h-10 text-xs font-medium rounded-full"
            >
              Deactivate
            </button>
          </div>
        </div>
      </Modal>

      {/* Toasts */}
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
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                  t.type === "success"
                    ? "bg-green-500/10 text-green-400 border-green-500/10"
                    : "bg-amber-500/10 text-amber-300 border-amber-500/10"
                }`}
              >
                {t.type === "success" ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <AlertTriangle className="w-3 h-3" />
                )}
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
