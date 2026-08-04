"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Trash2, X } from "lucide-react";
import {
  deleteCampaign,
  saveCampaign,
  type CampaignStatus,
  type SocialCampaignRow,
} from "@/app/admin/dashboard/social/calendarActions";
import { SITE_ORIGIN } from "@/lib/social/links";
import type { LinkPage } from "./SocialPostEditor";

/**
 * A campaign, which is thin by design.
 *
 * It contributes three things a post cannot supply on its own: a name to
 * group a week under, a goal to judge a post against, and the tag every
 * link in it is measured by. The landing pages and channels stay where
 * they already live.
 */

const LABEL = "text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500";
const FIELD =
  "w-full rounded-xl border border-white/8 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-white/20 focus:outline-none";

const STATUSES: { id: CampaignStatus; label: string }[] = [
  { id: "planning", label: "Planning" },
  { id: "active", label: "Active" },
  { id: "done", label: "Done" },
  { id: "archived", label: "Archived" },
];

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export default function SocialCampaignEditor({
  campaign,
  pages,
  onClose,
  onSaved,
  onNotify,
}: {
  /** null when creating */
  campaign: SocialCampaignRow | null;
  pages: LinkPage[];
  onClose: () => void;
  onSaved: () => void;
  onNotify: (message: string, tone: "success" | "error") => void;
}) {
  const [name, setName] = useState(campaign?.name || "");
  const [slug, setSlug] = useState(campaign?.slug || "");
  const [slugTouched, setSlugTouched] = useState(Boolean(campaign?.slug));
  const [goal, setGoal] = useState(campaign?.goal || "");
  const [pageSlug, setPageSlug] = useState(campaign?.page_slug || "");
  const [startsOn, setStartsOn] = useState(campaign?.starts_on?.slice(0, 10) || "");
  const [endsOn, setEndsOn] = useState(campaign?.ends_on?.slice(0, 10) || "");
  const [status, setStatus] = useState<CampaignStatus>(campaign?.status || "planning");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const effectiveSlug = slugTouched ? slug : slugify(name);
  const page = pages.find((option) => option.slug === pageSlug) || null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await saveCampaign({
        id: campaign?.id,
        slug: effectiveSlug,
        name,
        goal,
        pageSlug: pageSlug || null,
        startsOn: startsOn || null,
        endsOn: endsOn || null,
        status,
      });
      if (result.error) {
        onNotify(result.error, "error");
        return;
      }
      onNotify(campaign ? "Campaign updated." : "Campaign created.", "success");
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!campaign) return;
    if (!window.confirm(`Delete "${campaign.name}"? Its posts stay on the calendar without a campaign.`)) return;
    setSaving(true);
    try {
      const result = await deleteCampaign(campaign.id);
      if (result.error) {
        onNotify(result.error, "error");
        return;
      }
      onNotify("Campaign deleted. Its posts are still scheduled.", "success");
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="glass-panel relative w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-white/10">
        <div className="flex items-start justify-between gap-3 border-b border-white/8 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">{campaign ? "Edit campaign" : "New campaign"}</h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              A name to group the week under, and the tag its links are measured by.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="btn-ghost rounded-full p-2 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-5">
          <div className="flex flex-col gap-2">
            <label className={LABEL} htmlFor="campaign-name">
              Name
            </label>
            <input
              id="campaign-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="August call sheets push"
              className={FIELD}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={LABEL} htmlFor="campaign-goal">
              Goal
            </label>
            <input
              id="campaign-goal"
              type="text"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              placeholder="One line. What this push is supposed to achieve."
              className={FIELD}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={LABEL} htmlFor="campaign-slug">
              Tag
            </label>
            <input
              id="campaign-slug"
              type="text"
              value={effectiveSlug}
              onChange={(event) => {
                setSlug(event.target.value);
                setSlugTouched(true);
              }}
              placeholder="august-callsheets"
              className={`${FIELD} font-mono text-[11px]`}
            />
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              Becomes <span className="font-mono">utm_campaign</span> on every link built for this campaign. Renaming it
              after posting splits the numbers across two names.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className={LABEL} htmlFor="campaign-page">
                Landing page
              </label>
              <select
                id="campaign-page"
                value={pageSlug}
                onChange={(event) => setPageSlug(event.target.value)}
                className={FIELD}
              >
                <option value="">Pick per post</option>
                {pages.map((option) => (
                  <option key={option.slug} value={option.slug}>
                    {option.label}
                  </option>
                ))}
              </select>
              {page ? (
                <p className="text-[11px] text-zinc-600 font-mono break-all">
                  {SITE_ORIGIN}
                  {page.path}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <label className={LABEL} htmlFor="campaign-status">
                Status
              </label>
              <select
                id="campaign-status"
                value={status}
                onChange={(event) => setStatus(event.target.value as CampaignStatus)}
                className={FIELD}
              >
                {STATUSES.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className={LABEL} htmlFor="campaign-start">
                Starts
              </label>
              <input
                id="campaign-start"
                type="date"
                value={startsOn}
                onChange={(event) => setStartsOn(event.target.value)}
                className={FIELD}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className={LABEL} htmlFor="campaign-end">
                Ends
              </label>
              <input
                id="campaign-end"
                type="date"
                value={endsOn}
                onChange={(event) => setEndsOn(event.target.value)}
                className={FIELD}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/8 px-5 py-4">
          {campaign ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="btn-danger flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn-ghost rounded-full px-4 py-2 text-xs font-semibold">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="btn-primary flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {campaign ? "Save changes" : "Create campaign"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
