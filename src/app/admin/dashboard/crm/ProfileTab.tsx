"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Download,
  ExternalLink,
  IdCard,
  Loader2,
  Palette,
  Plus,
  QrCode as QrIcon,
  Save,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cardUrl } from "@/lib/crm/constants";
import type { TeamMemberIdentity } from "@/lib/crm/identity";
import type { CrmCaptureCode, CrmProfile } from "@/lib/crm/types";
import { buildProfileVCard } from "@/lib/crm/vcard";
import QrCode from "./QrCode";
import CardPreview, { type CardLink } from "./CardPreview";
import { primaryCode } from "./codeDesign";
import { downloadFile, slugify, type Notify } from "./lib";

/**
 * Your card.
 *
 * This is what a stranger sees three seconds after scanning, and every empty
 * field here is a row that simply does not render for them. A card with a
 * name and nothing else is a worse first impression than a business card, so
 * this screen exists to make the gaps obvious rather than to hide them.
 *
 * The picture beside the fields is the point of the screen. Filling in a
 * form and seeing what it produces used to be two different sittings, one of
 * them on a phone, and the gap between them is where a card ends up with a
 * job title that reads well in an input box and badly under a photograph.
 *
 * A gap can also be filled from somewhere else. Name, job title, photograph
 * and biography live once, in the team screen, and a card that leaves any of
 * them blank borrows them rather than showing nothing. That is worth seeing
 * while you type, so an inherited value is drawn in the preview and marked
 * as inherited on the field it came through.
 */

interface ProfileTabProps {
  profile: CrmProfile | null;
  /** The shared record the card falls back to. Null when there is none. */
  member: TeamMemberIdentity | null;
  codes: CrmCaptureCode[];
  onChanged: () => void;
  /** Where the codes tab is. A link, because the tab is in the URL. */
  onGoToCodes: string;
  notify: Notify;
}

interface Draft {
  full_name: string;
  job_title: string;
  company: string;
  tagline: string;
  bio: string;
  email: string;
  phone: string;
  website: string;
  linkedin_url: string;
  x_url: string;
  calendar_url: string;
  cta_label: string;
  cta_url: string;
}

const BLANK: Draft = {
  full_name: "",
  job_title: "",
  company: "",
  tagline: "",
  bio: "",
  email: "",
  phone: "",
  website: "",
  linkedin_url: "",
  x_url: "",
  calendar_url: "",
  cta_label: "",
  cta_url: "",
};

function draftFrom(profile: CrmProfile): Draft {
  return {
    full_name: profile.full_name ?? "",
    job_title: profile.job_title ?? "",
    company: profile.company ?? "",
    tagline: profile.tagline ?? "",
    bio: profile.bio ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    website: profile.website ?? "",
    linkedin_url: profile.linkedin_url ?? "",
    x_url: profile.x_url ?? "",
    calendar_url: profile.calendar_url ?? "",
    cta_label: profile.cta_label ?? "",
    cta_url: profile.cta_url ?? "",
  };
}

/**
 * What the card actually shows for a field.
 *
 * The same rule the shared resolver uses: the card wins wherever it has
 * something, and anything blank falls through to the team record. Written
 * against the draft rather than the saved row, so the preview follows a
 * field being cleared as well as a field being typed.
 */
function resolved(own: string, inherited: string | null | undefined) {
  const mine = own.trim();
  if (mine) return { value: mine, inherited: false };
  const theirs = (inherited || "").trim();
  return theirs ? { value: theirs, inherited: true } : { value: "", inherited: false };
}

/** A link the card would print, or null. Http and https only. */
function externalHref(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** The visible half of a link, with the scheme and any trailing slash gone. */
function prettyHost(value: string): string {
  return value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export default function ProfileTab({
  profile,
  member,
  codes,
  onChanged,
  onGoToCodes,
  notify,
}: ProfileTabProps) {
  const [draft, setDraft] = useState<Draft>(() => (profile ? draftFrom(profile) : BLANK));
  const [newSlug, setNewSlug] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setDraft(draftFrom(profile));
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const payload = () => ({
    full_name: draft.full_name.trim() || "Unnamed",
    job_title: draft.job_title.trim() || null,
    company: draft.company.trim() || null,
    tagline: draft.tagline.trim() || null,
    bio: draft.bio.trim() || null,
    email: draft.email.trim() || null,
    phone: draft.phone.trim() || null,
    website: draft.website.trim() || null,
    linkedin_url: draft.linkedin_url.trim() || null,
    x_url: draft.x_url.trim() || null,
    calendar_url: draft.calendar_url.trim() || null,
    cta_label: draft.cta_label.trim() || null,
    cta_url: draft.cta_url.trim() || null,
  });

  const save = async () => {
    setSaving(true);
    const supabase = createClient();

    if (!profile) {
      const slug = slugify(newSlug || draft.full_name);
      if (!slug) {
        setSaving(false);
        notify("A card needs a short name for its address.", "error");
        return;
      }
      const { error } = await supabase
        .from("crm_profiles")
        .insert({ ...payload(), slug, is_active: true });
      setSaving(false);
      if (error) {
        notify(error.message, "error");
        return;
      }
      notify("Card created.", "success");
      onChanged();
      return;
    }

    const { error } = await supabase.from("crm_profiles").update(payload()).eq("id", profile.id);
    setSaving(false);
    if (error) {
      notify(error.message, "error");
      return;
    }
    notify("Card saved.", "success");
    onChanged();
  };

  const url = profile ? cardUrl(profile.slug) : "";

  /* ---------------- what the card resolves to ---------------- */

  const name = resolved(draft.full_name, member?.full_name);
  const jobTitle = resolved(draft.job_title, member?.job_title);
  const bio = resolved(draft.bio, member?.short_bio);
  const email = resolved(draft.email, member?.email);
  const website = resolved(draft.website, member?.website);
  const linkedin = resolved(draft.linkedin_url, member?.linkedin_url);
  const xUrl = resolved(draft.x_url, member?.x_url);
  const photo = profile?.avatar_url || member?.photo_url || null;
  const photoInherited = !profile?.avatar_url && Boolean(member?.photo_url);

  /* The same list the card prints, hrefs and all. The preview draws the
     real pills from these, so a link that would not resolve to http or
     https is one that does not appear in either place. */
  const links = useMemo<CardLink[]>(() => {
    const out: CardLink[] = [];
    const site = externalHref(website.value);
    if (site) out.push({ kind: "website", href: site, label: prettyHost(site) });

    const linkedinHref = externalHref(linkedin.value);
    if (linkedinHref) out.push({ kind: "linkedin", href: linkedinHref, label: "LinkedIn" });

    const calendarHref = externalHref(draft.calendar_url);
    if (calendarHref) out.push({ kind: "calendar", href: calendarHref, label: "Book a time" });

    const ctaHref = externalHref(draft.cta_url);
    if (ctaHref && draft.cta_label.trim()) {
      out.push({ kind: "cta", href: ctaHref, label: draft.cta_label.trim() });
    }
    return out;
  }, [website.value, linkedin.value, draft.calendar_url, draft.cta_url, draft.cta_label]);

  const role =
    [jobTitle.value, draft.company.trim()].filter(Boolean).join(" · ") || null;

  const filled = profile
    ? [
        jobTitle.value,
        email.value,
        draft.phone,
        website.value,
        linkedin.value,
        draft.calendar_url,
        draft.tagline,
      ].filter((v) => v.trim()).length
    : 0;

  const codeToDesign = profile ? primaryCode(codes) : null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* -------------------------------------------------------- */}
        {/* What a scan actually shows                               */}
        {/* -------------------------------------------------------- */}
        <div className="order-first lg:order-last space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="glass-panel rounded-2xl border-white/8 p-4 sm:p-5 space-y-4">
            <div>
              <span className="block text-xs uppercase font-bold tracking-widest text-gray-400 font-sans">
                What a scan shows
              </span>
              <p className="text-[11px] text-zinc-400 leading-relaxed mt-1.5">
                Live, as you type. Anything left blank borrows from your team profile.
              </p>
            </div>

            <CardPreview
              slug={profile?.slug || slugify(newSlug || draft.full_name) || "your-card"}
              fullName={name.value}
              role={role}
              tagline={draft.tagline.trim() || null}
              avatarUrl={photo}
              links={links}
            />

            {profile ? (
              <div className="pt-1 space-y-3">
                <div className="bg-white p-3 rounded-xl w-fit mx-auto">
                  <QrCode value={url} size={140} rounded={false} />
                </div>

                <p className="text-[10px] font-mono text-zinc-400 break-all text-center">{url}</p>

                <div className="flex flex-wrap gap-2 justify-center">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-glass px-3.5 min-h-[44px] sm:min-h-[36px] text-[11px] font-medium rounded-full"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      downloadFile(
                        `${profile.slug}.vcf`,
                        "text/vcard;charset=utf-8",
                        buildProfileVCard({ ...profile, ...payload() }, url)
                      )
                    }
                    className="btn-glass px-3.5 min-h-[44px] sm:min-h-[36px] text-[11px] font-medium rounded-full"
                  >
                    <Download className="w-3.5 h-3.5" />
                    vCard
                  </button>
                  {codeToDesign ? (
                    <Link
                      href={`/admin/dashboard/crm/design?k=${encodeURIComponent(
                        codeToDesign.code
                      )}&from=card`}
                      className="btn-primary px-3.5 min-h-[44px] sm:min-h-[36px] text-[11px] rounded-full"
                    >
                      <Palette className="w-3.5 h-3.5" />
                      Design the code
                    </Link>
                  ) : (
                    <Link
                      href={onGoToCodes}
                      className="btn-glass px-3.5 min-h-[44px] sm:min-h-[36px] text-[11px] font-medium rounded-full"
                    >
                      <QrIcon className="w-3.5 h-3.5" />
                      Make a code first
                    </Link>
                  )}
                </div>

                {codeToDesign && (
                  <p className="text-[10px] text-zinc-400 text-center leading-relaxed">
                    Opens the designer on {codeToDesign.label}. Every code on this card opens the
                    same designer from the Codes tab.
                  </p>
                )}

                <div className="pt-3 border-t border-white/5">
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {filled === 0
                      ? "Every field is empty, so a scan shows your name and nothing to do next."
                      : `${filled} of 7 useful fields filled. Empty ones simply do not appear on the card.`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t border-white/5">
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Nothing is saved yet, so this is what the card would look like. Pick a short
                  address below and create it.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* -------------------------------------------------------- */}
        {/* The fields                                               */}
        {/* -------------------------------------------------------- */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel rounded-2xl border-white/8 p-4 sm:p-5 space-y-3">
            <span className="block text-xs uppercase font-bold tracking-widest text-gray-400 font-sans">
              Who you are
            </span>

            {!profile && (
              <Field label="Card address">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-zinc-400 shrink-0">/c/</span>
                  <input
                    value={newSlug}
                    onChange={(e) => setNewSlug(slugify(e.target.value))}
                    placeholder="your-name"
                    className="admin-input h-9 py-0 font-mono"
                  />
                </div>
              </Field>
            )}

            {photoInherited && (
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo ?? ""}
                  alt=""
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full object-cover shrink-0"
                />
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  This photograph comes from your team profile. Change it there and the card, the
                  byline and the vCard all follow.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Name" inherited={name.inherited ? name.value : null}>
                <input
                  value={draft.full_name}
                  onChange={(e) => set({ full_name: e.target.value })}
                  placeholder={member?.full_name || ""}
                  className="admin-input h-9 py-0"
                />
              </Field>
              <Field label="Job title" inherited={jobTitle.inherited ? jobTitle.value : null}>
                <input
                  value={draft.job_title}
                  onChange={(e) => set({ job_title: e.target.value })}
                  placeholder={member?.job_title || "Founder"}
                  className="admin-input h-9 py-0"
                />
              </Field>
              <Field label="Company">
                <input
                  value={draft.company}
                  onChange={(e) => set({ company: e.target.value })}
                  className="admin-input h-9 py-0"
                />
              </Field>
              <Field label="Tagline">
                <input
                  value={draft.tagline}
                  onChange={(e) => set({ tagline: e.target.value })}
                  placeholder="One line on what you do"
                  className="admin-input h-9 py-0"
                />
              </Field>
            </div>

            <Field label="Bio" inherited={bio.inherited ? bio.value : null}>
              <textarea
                rows={3}
                value={draft.bio}
                onChange={(e) => set({ bio: e.target.value })}
                placeholder="Two sentences. Anything longer does not get read standing up."
                className="admin-input resize-y leading-relaxed"
              />
            </Field>
          </div>

          <div className="glass-panel rounded-2xl border-white/8 p-4 sm:p-5 space-y-3">
            <span className="block text-xs uppercase font-bold tracking-widest text-gray-400 font-sans">
              How to reach you
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Email" inherited={email.inherited ? email.value : null}>
                <input
                  type="email"
                  inputMode="email"
                  value={draft.email}
                  onChange={(e) => set({ email: e.target.value })}
                  placeholder={member?.email || ""}
                  className="admin-input h-9 py-0"
                />
              </Field>
              <Field label="Phone">
                <input
                  type="tel"
                  inputMode="tel"
                  value={draft.phone}
                  onChange={(e) => set({ phone: e.target.value })}
                  className="admin-input h-9 py-0"
                />
              </Field>
              <Field label="Website" inherited={website.inherited ? website.value : null}>
                <input
                  inputMode="url"
                  value={draft.website}
                  onChange={(e) => set({ website: e.target.value })}
                  placeholder={member?.website || "https://abram.network"}
                  className="admin-input h-9 py-0"
                />
              </Field>
              <Field label="LinkedIn" inherited={linkedin.inherited ? linkedin.value : null}>
                <input
                  inputMode="url"
                  value={draft.linkedin_url}
                  onChange={(e) => set({ linkedin_url: e.target.value })}
                  placeholder={member?.linkedin_url || ""}
                  className="admin-input h-9 py-0"
                />
              </Field>
              <Field label="X" inherited={xUrl.inherited ? xUrl.value : null}>
                <input
                  inputMode="url"
                  value={draft.x_url}
                  onChange={(e) => set({ x_url: e.target.value })}
                  placeholder={member?.x_url || ""}
                  className="admin-input h-9 py-0"
                />
              </Field>
              <Field label="Calendar">
                <input
                  inputMode="url"
                  value={draft.calendar_url}
                  onChange={(e) => set({ calendar_url: e.target.value })}
                  placeholder="Link that books a slot"
                  className="admin-input h-9 py-0"
                />
              </Field>
              <Field label="Button label">
                <input
                  value={draft.cta_label}
                  onChange={(e) => set({ cta_label: e.target.value })}
                  placeholder="See what ABRAM does"
                  className="admin-input h-9 py-0"
                />
              </Field>
              <Field label="Button link">
                <input
                  inputMode="url"
                  value={draft.cta_url}
                  onChange={(e) => set({ cta_url: e.target.value })}
                  className="admin-input h-9 py-0"
                />
              </Field>
            </div>

            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="btn-primary px-4 min-h-[44px] sm:min-h-[36px] text-xs rounded-full disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : profile ? (
                <Save className="w-3.5 h-3.5" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              {profile ? "Save card" : "Create card"}
            </button>
          </div>

          {!profile && (
            <div className="rounded-2xl border border-white/8 bg-zinc-950/40 p-6 text-center">
              <IdCard className="w-6 h-6 text-zinc-400 mx-auto" />
              <h3 className="text-sm font-semibold text-white mt-3">No card yet</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mt-2">
                Pick a short address and fill in the fields above. Codes and scans all hang off the
                card, so this comes first.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

/**
 * One field, and where its value came from.
 *
 * An inherited value is marked on the field rather than only shown in the
 * preview, because the two questions a blank input raises are different: an
 * empty line on the card is a gap to fill, and a line the team record is
 * already filling is a decision to leave alone.
 */
function Field({
  label,
  inherited,
  children,
}: {
  label: string;
  /** The value falling through from the team record, when one is */
  inherited?: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 mb-1.5">
        <span className="text-xs uppercase font-bold tracking-widest text-gray-400">
          {label}
        </span>
        {inherited ? (
          <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 rounded-full border border-white/10 px-1.5 py-px">
            Inherited
          </span>
        ) : null}
      </span>
      {children}
      {inherited ? (
        <span className="block text-[10px] text-zinc-400 leading-relaxed mt-1 break-words">
          Showing {inherited} from your team profile. Type here to override it on this card only.
        </span>
      ) : null}
    </label>
  );
}
