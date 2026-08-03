"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgePercent,
  Check,
  ChevronRight,
  Copy,
  Loader2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Ticket,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Modal from "@/components/admin/Modal";

/**
 * Promotional codes — the marketing console.
 *
 * The codes themselves live in the PRODUCT's database and in Stripe; this page is a client over
 * `/api/admin/promotions`, which proxies to the abram-network `admin-promotions` edge function.
 * Nothing here validates anything. Every rule — which tiers a code applies to, whether months-free
 * may touch annual billing, per-org caps — is enforced server-side, on purpose: a marketing UI is
 * the last place a pricing guarantee should live.
 *
 * The shape to understand before using it: a CAMPAIGN is the offer (50% off Team for 3 months), and
 * CODES are the strings that unlock it. One campaign can carry many codes, which is how a public
 * launch code and a batch of one-time partner codes share identical economics while being capped,
 * expired, and attributed separately.
 */

type OfferType = "percent_off" | "amount_off" | "months_free" | "extended_trial";

interface CampaignStats {
  code_count: number;
  redemptions: number;
  organizations: number;
  retained_organizations: number;
  discount_given_cents: number;
  last_redeemed_at: string | null;
}

interface Campaign {
  id: string;
  slug: string;
  name: string;
  offer_type: OfferType;
  percent_off: number | null;
  amount_off_cents: number | null;
  duration: string | null;
  duration_in_months: number | null;
  trial_days: number | null;
  eligible_tiers: string[];
  eligible_intervals: string[];
  new_customers_only: boolean;
  max_redemptions_per_org: number;
  status: "draft" | "active" | "paused" | "archived";
  starts_at: string | null;
  ends_at: string | null;
  notes: string | null;
  description: string;
  stats: CampaignStats | null;
}

interface PromoCode {
  id: string;
  campaign_id: string;
  code: string;
  kind: "public" | "unique";
  max_redemptions: number | null;
  redemption_count: number;
  expires_at: string | null;
  source: string | null;
  issued_to_email: string | null;
  status: "active" | "disabled" | "archived";
  created_at: string;
}

const TIERS = [
  { id: "solo_lite", label: "Solo Lite" },
  { id: "solo_pro", label: "Solo Pro" },
  { id: "team", label: "Team" },
  { id: "studio", label: "Studio" },
];

const OFFER_TYPES: Array<{ id: OfferType; label: string; blurb: string }> = [
  {
    id: "percent_off",
    label: "% off",
    blurb: "The workhorse. Card is charged the reduced amount from day one.",
  },
  {
    id: "months_free",
    label: "Months free",
    blurb:
      "100% off for N months, card on file, converts automatically. Monthly billing only — on annual this would give away a whole year.",
  },
  {
    id: "amount_off",
    label: "$ off",
    blurb: "A fixed amount off. Best on the first invoice for a specific dollar promise.",
  },
  {
    id: "extended_trial",
    label: "Extended trial",
    blurb: "Free days with a card collected up front. Nothing is charged until the trial ends.",
  },
];

async function callApi<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/admin/promotions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);
  return json as T;
}

function usd(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

const STATUS_STYLES: Record<Campaign["status"], string> = {
  active: "bg-white/10 text-white",
  draft: "bg-white/5 text-zinc-400",
  paused: "bg-white/5 text-zinc-400",
  archived: "bg-white/5 text-zinc-600",
};

export default function PromotionsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3200);
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await callApi<{ campaigns: Campaign[] }>({ action: "list_campaigns" });
      setCampaigns(data.campaigns ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Keep the open detail pane in step with a refreshed list rather than holding a stale copy —
  // minting codes changes the counts the pane is showing.
  useEffect(() => {
    if (!selected) return;
    const fresh = campaigns.find((c) => c.id === selected.id);
    if (fresh && fresh !== selected) setSelected(fresh);
  }, [campaigns, selected]);

  const setStatus = async (campaign: Campaign, status: Campaign["status"]) => {
    try {
      await callApi({ action: "update_campaign", campaignId: campaign.id, status });
      notify(`${campaign.name} is now ${status}.`);
      await load();
    } catch (e) {
      notify((e as Error).message);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-6 max-w-[90rem] mx-auto pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
              <BadgePercent className="w-5 h-5 text-zinc-400" />
              Promotions
            </h1>
            <p className="text-xs text-zinc-500 mt-1 font-sans">
              Discount campaigns and the codes that unlock them. Synced to Stripe on save.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void load()}
              className="h-9 px-3 text-xs font-medium rounded-lg border border-white/10 text-zinc-300 hover:bg-white/[0.04] transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <button
              onClick={() => setShowNewCampaign(true)}
              className="btn-primary h-9 px-4 text-xs font-semibold rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New campaign
            </button>
          </div>
        </div>

        {error && (
          <div className="glass-panel rounded-2xl border border-white/5 p-4 text-xs text-zinc-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass-panel rounded-2xl border border-white/5 h-24 animate-pulse" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
            <Ticket className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-sm text-zinc-400 mt-3 font-sans">No campaigns yet.</p>
            <p className="text-xs text-zinc-600 mt-1 font-sans max-w-md mx-auto">
              A campaign is the offer. Create one, then mint the codes that unlock it — a single
              public code for an audience, or a batch of one-time codes for a named list.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c) => (
              <CampaignRow
                key={c.id}
                campaign={c}
                onOpen={() => setSelected(c)}
                onSetStatus={(s) => void setStatus(c, s)}
              />
            ))}
          </div>
        )}
      </div>

      <NewCampaignModal
        open={showNewCampaign}
        onClose={() => setShowNewCampaign(false)}
        onCreated={async (name) => {
          setShowNewCampaign(false);
          notify(`${name} created as a draft. Mint codes, then activate it.`);
          await load();
        }}
      />

      {selected && (
        <CampaignDetail
          campaign={selected}
          onClose={() => setSelected(null)}
          onChanged={load}
          notify={notify}
        />
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-6 right-6 z-50 glass-panel rounded-xl border border-white/10 px-4 py-3 text-xs text-white max-w-sm"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CampaignRow({
  campaign,
  onOpen,
  onSetStatus,
}: {
  campaign: Campaign;
  onOpen: () => void;
  onSetStatus: (status: Campaign["status"]) => void;
}) {
  const s = campaign.stats;
  // Redemptions measure interest; retention measures whether the discount bought a customer.
  // Showing them side by side is the whole point of the row.
  const retention =
    s && s.organizations > 0 ? Math.round((s.retained_organizations / s.organizations) * 100) : null;

  return (
    <div className="glass-panel rounded-2xl border border-white/5 p-5">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-white font-sans truncate">{campaign.name}</h2>
            <span
              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${STATUS_STYLES[campaign.status]}`}
            >
              {campaign.status}
            </span>
            {campaign.new_customers_only && (
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                New customers
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-sans">{campaign.description}</p>
          <p className="text-[11px] text-zinc-600 mt-1 font-mono">{campaign.slug}</p>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          <Stat label="Codes" value={String(s?.code_count ?? 0)} />
          <Stat label="Redeemed" value={String(s?.redemptions ?? 0)} />
          <Stat
            label="Retained"
            value={retention === null ? "—" : `${retention}%`}
          />
          <Stat label="Given" value={usd(s?.discount_given_cents ?? 0)} />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {campaign.status === "active" ? (
            <button
              onClick={() => onSetStatus("paused")}
              title="Pause — also switches every code in this campaign off in Stripe"
              className="h-8 w-8 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors flex items-center justify-center"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          ) : campaign.status !== "archived" ? (
            <button
              onClick={() => onSetStatus("active")}
              title="Activate"
              className="h-8 w-8 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors flex items-center justify-center"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          ) : null}
          <button
            onClick={onOpen}
            className="h-8 px-3 text-xs font-medium rounded-lg border border-white/10 text-zinc-300 hover:bg-white/[0.04] transition-colors flex items-center gap-1"
          >
            Codes
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-sans block">
        {label}
      </span>
      <span className="text-lg font-bold tracking-tight text-white font-sans">{value}</span>
    </div>
  );
}

// ─── new campaign ────────────────────────────────────────────────────────────

function NewCampaignModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [offerType, setOfferType] = useState<OfferType>("percent_off");
  const [percentOff, setPercentOff] = useState("50");
  const [amountOff, setAmountOff] = useState("20");
  const [months, setMonths] = useState("3");
  const [trialDays, setTrialDays] = useState("30");
  const [duration, setDuration] = useState<"once" | "repeating" | "forever">("repeating");
  const [tiers, setTiers] = useState<string[]>([]);
  const [annualAllowed, setAnnualAllowed] = useState(true);
  const [newOnly, setNewOnly] = useState(true);
  const [endsAt, setEndsAt] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Slug is derived, not typed: it is the join key to the marketing campaign of the same name, and
  // a hand-typed one drifts the moment somebody capitalises differently.
  const slug = useMemo(
    () =>
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 63),
    [name],
  );

  const monthsFree = offerType === "months_free";
  const isForever = offerType !== "extended_trial" && duration === "forever";

  const submit = async () => {
    setSaving(true);
    setErr(null);
    try {
      await callApi({
        action: "create_campaign",
        slug,
        name: name.trim(),
        offerType,
        percentOff: offerType === "percent_off" ? Number(percentOff) : undefined,
        amountOffCents: offerType === "amount_off" ? Math.round(Number(amountOff) * 100) : undefined,
        durationInMonths: monthsFree
          ? Number(months)
          : duration === "repeating"
            ? Number(months)
            : undefined,
        duration: monthsFree ? "repeating" : offerType === "extended_trial" ? undefined : duration,
        trialDays: offerType === "extended_trial" ? Number(trialDays) : undefined,
        eligibleTiers: tiers,
        eligibleIntervals: monthsFree ? ["monthly"] : annualAllowed ? ["monthly", "annual"] : ["monthly"],
        newCustomersOnly: newOnly,
        endsAt: endsAt || undefined,
        notes: notes.trim() || undefined,
      });
      onCreated(name.trim());
      setName("");
      setNotes("");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const blocked =
    !name.trim() || !slug || saving || (isForever && !endsAt);

  return (
    <Modal open={open} onClose={onClose} dismissable={!saving} size="md">
      <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
        <div>
          <h2 className="text-base font-bold text-white font-sans">New campaign</h2>
          <p className="text-xs text-zinc-500 mt-1 font-sans">
            Created as a draft. Nothing is redeemable until you mint a code and activate it.
          </p>
        </div>

        <Field label="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Launch 2026 — 50% off Team"
            className="admin-input"
          />
          {slug && <p className="text-[11px] text-zinc-600 mt-1 font-mono">{slug}</p>}
        </Field>

        <Field label="Offer">
          <div className="grid grid-cols-2 gap-2">
            {OFFER_TYPES.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  setOfferType(o.id);
                  if (o.id === "months_free") setDuration("repeating");
                }}
                className={`text-left rounded-lg border p-3 transition-colors ${
                  offerType === o.id
                    ? "border-white/25 bg-white/[0.06]"
                    : "border-white/10 hover:bg-white/[0.03]"
                }`}
              >
                <span className="text-xs font-medium text-white block">{o.label}</span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
            {OFFER_TYPES.find((o) => o.id === offerType)?.blurb}
          </p>
        </Field>

        {offerType === "percent_off" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Percent off">
              <input
                type="number"
                min={1}
                max={100}
                value={percentOff}
                onChange={(e) => setPercentOff(e.target.value)}
                className="admin-input"
              />
            </Field>
            <Field label="Runs for">
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value as typeof duration)}
                className="admin-input"
              >
                <option value="once">The first invoice</option>
                <option value="repeating">N months</option>
                <option value="forever">The life of the subscription</option>
              </select>
            </Field>
          </div>
        )}

        {offerType === "amount_off" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Dollars off">
              <input
                type="number"
                min={1}
                value={amountOff}
                onChange={(e) => setAmountOff(e.target.value)}
                className="admin-input"
              />
            </Field>
            <Field label="Runs for">
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value as typeof duration)}
                className="admin-input"
              >
                <option value="once">The first invoice</option>
                <option value="repeating">N months</option>
              </select>
            </Field>
          </div>
        )}

        {(monthsFree || duration === "repeating") && offerType !== "extended_trial" && (
          <Field label="Months">
            <input
              type="number"
              min={1}
              max={24}
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              className="admin-input"
            />
          </Field>
        )}

        {offerType === "extended_trial" && (
          <Field label="Trial days">
            <input
              type="number"
              min={1}
              max={90}
              value={trialDays}
              onChange={(e) => setTrialDays(e.target.value)}
              className="admin-input"
            />
          </Field>
        )}

        <Field label="Plans">
          <div className="flex flex-wrap gap-2">
            {TIERS.map((t) => {
              const on = tiers.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    setTiers((prev) =>
                      prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id],
                    )
                  }
                  className={`h-8 px-3 text-xs font-medium rounded-lg border transition-colors ${
                    on ? "border-white/25 bg-white/[0.08] text-white" : "border-white/10 text-zinc-400"
                  }`}
                >
                  {on && <Check className="w-3 h-3 inline mr-1" />}
                  {t.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-zinc-600 mt-2">
            {tiers.length === 0 ? "Any paid plan." : "Only the plans selected."}
          </p>
        </Field>

        <div className="space-y-3">
          {monthsFree ? (
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Monthly billing only. On an annual price, N months free discounts the single yearly
              invoice — a whole year given away — so the product refuses it.
            </p>
          ) : (
            <Toggle
              on={annualAllowed}
              onChange={setAnnualAllowed}
              label="Valid on annual billing too"
            />
          )}
          <Toggle
            on={newOnly}
            onChange={setNewOnly}
            label="New customers only"
            hint="Blocks anyone who has ever held a paid subscription. Leave on for acquisition; turn off for win-back and upgrade offers."
          />
        </div>

        <Field label={isForever ? "Redeemable until (required)" : "Redeemable until"}>
          <input
            type="date"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="admin-input"
          />
          <p className="text-[11px] text-zinc-600 mt-1">
            {isForever
              ? "A lifetime discount must have a redemption deadline — otherwise it is a permanent hole in the price list."
              : "After this date the code stops being redeemable. Discounts already running are unaffected."}
          </p>
        </Field>

        <Field label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Why this offer exists, and what would make you renew it."
            className="admin-input resize-none"
          />
        </Field>

        {err && <p className="text-xs text-zinc-300 leading-relaxed">{err}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            disabled={saving}
            className="h-9 px-4 text-xs font-medium rounded-lg border border-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => void submit()}
            disabled={blocked}
            className="btn-primary h-9 px-4 text-xs font-semibold rounded-lg disabled:opacity-40 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Create draft
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── codes ───────────────────────────────────────────────────────────────────

function CampaignDetail({
  campaign,
  onClose,
  onChanged,
  notify,
}: {
  campaign: Campaign;
  onClose: () => void;
  onChanged: () => Promise<void>;
  notify: (m: string) => void;
}) {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [kind, setKind] = useState<"public" | "unique">("public");
  const [publicCode, setPublicCode] = useState("");
  const [cap, setCap] = useState("100");
  const [count, setCount] = useState("25");
  const [prefix, setPrefix] = useState("");
  const [source, setSource] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const loadCodes = useCallback(async () => {
    try {
      const data = await callApi<{ codes: PromoCode[] }>({
        action: "list_codes",
        campaignId: campaign.id,
      });
      setCodes(data.codes ?? []);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [campaign.id]);

  useEffect(() => {
    void loadCodes();
  }, [loadCodes]);

  const mint = async () => {
    setMinting(true);
    setErr(null);
    try {
      const res = await callApi<{ created: PromoCode[]; failed: Array<{ code: string; error: string }> }>({
        action: "create_codes",
        campaignId: campaign.id,
        kind,
        code: kind === "public" ? publicCode : undefined,
        maxRedemptions: kind === "public" ? (cap === "" ? null : Number(cap)) : undefined,
        count: kind === "unique" ? Number(count) : undefined,
        prefix: kind === "unique" ? prefix || undefined : undefined,
        source: source.trim() || undefined,
      });
      // Surface partial failure explicitly. A batch of 25 that minted 23 is not a success, and
      // "23 created" with no mention of the other two is how a partner ends up with a dead code.
      if (res.failed?.length) {
        notify(`${res.created.length} created, ${res.failed.length} failed: ${res.failed[0].error}`);
      } else {
        notify(`${res.created.length} code${res.created.length === 1 ? "" : "s"} minted.`);
      }
      setPublicCode("");
      await loadCodes();
      await onChanged();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setMinting(false);
    }
  };

  const toggleCode = async (code: PromoCode) => {
    try {
      await callApi({
        action: "set_code_status",
        codeId: code.id,
        status: code.status === "active" ? "disabled" : "active",
      });
      await loadCodes();
    } catch (e) {
      notify((e as Error).message);
    }
  };

  const copyAll = () => {
    void navigator.clipboard.writeText(codes.filter((c) => c.status === "active").map((c) => c.code).join("\n"));
    notify("Active codes copied.");
  };

  return (
    <Modal open onClose={onClose} dismissable={!minting} size="md">
      <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-white font-sans truncate">{campaign.name}</h2>
            <p className="text-xs text-zinc-500 mt-1 font-sans">{campaign.description}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {campaign.status === "archived" ? (
          <p className="text-xs text-zinc-500">This campaign is archived. No new codes can be minted.</p>
        ) : (
          <div className="rounded-xl border border-white/10 p-4 space-y-4">
            <div className="flex gap-2">
              {(["public", "unique"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={`h-8 px-3 text-xs font-medium rounded-lg border transition-colors ${
                    kind === k ? "border-white/25 bg-white/[0.08] text-white" : "border-white/10 text-zinc-400"
                  }`}
                >
                  {k === "public" ? "One shared code" : "Batch of one-time codes"}
                </button>
              ))}
            </div>

            {kind === "public" ? (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Code">
                  <input
                    value={publicCode}
                    onChange={(e) => setPublicCode(e.target.value.toUpperCase())}
                    placeholder="LAUNCH50"
                    className="admin-input font-mono tracking-wide"
                  />
                </Field>
                <Field label="Max redemptions">
                  <input
                    type="number"
                    min={1}
                    value={cap}
                    onChange={(e) => setCap(e.target.value)}
                    className="admin-input"
                  />
                </Field>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Field label="How many">
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    className="admin-input"
                  />
                </Field>
                <Field label="Prefix">
                  <input
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                    placeholder={campaign.slug.slice(0, 8).toUpperCase()}
                    className="admin-input font-mono tracking-wide"
                  />
                </Field>
              </div>
            )}

            <Field label="Channel">
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="podcast-nofilmschool"
                className="admin-input"
              />
              <p className="text-[11px] text-zinc-600 mt-1">
                Tagged onto every redemption, so you can tell which channel actually converted.
              </p>
            </Field>

            {err && <p className="text-xs text-zinc-300 leading-relaxed">{err}</p>}

            <button
              onClick={() => void mint()}
              disabled={minting || (kind === "public" && !publicCode.trim())}
              className="btn-primary h-9 px-4 text-xs font-semibold rounded-lg disabled:opacity-40 flex items-center gap-2"
            >
              {minting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Mint {kind === "public" ? "code" : `${count} codes`}
            </button>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-sans">
              Codes ({codes.length})
            </span>
            {codes.length > 0 && (
              <button
                onClick={copyAll}
                className="text-[11px] text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                Copy active
              </button>
            )}
          </div>

          {loading ? (
            <div className="h-16 rounded-xl border border-white/5 animate-pulse" />
          ) : codes.length === 0 ? (
            <p className="text-xs text-zinc-600 py-4">No codes minted yet.</p>
          ) : (
            <div className="divide-y divide-white/5 rounded-xl border border-white/10 overflow-hidden">
              {codes.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span
                    className={`font-mono text-xs tracking-wide flex-1 truncate ${
                      c.status === "active" ? "text-white" : "text-zinc-600 line-through"
                    }`}
                  >
                    {c.code}
                  </span>
                  {c.source && <span className="text-[10px] text-zinc-600 shrink-0">{c.source}</span>}
                  <span className="text-[11px] text-zinc-500 shrink-0">
                    {c.redemption_count}
                    {c.max_redemptions ? `/${c.max_redemptions}` : ""}
                  </span>
                  <button
                    onClick={() => void toggleCode(c)}
                    className="text-[11px] text-zinc-500 hover:text-white transition-colors shrink-0 w-14 text-right"
                  >
                    {c.status === "active" ? "Disable" : "Enable"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── primitives ──────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-sans block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({
  on,
  onChange,
  label,
  hint,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="flex items-start gap-3 text-left w-full">
      <span
        className={`mt-0.5 h-4 w-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
          on ? "border-white/40 bg-white/15" : "border-white/15"
        }`}
      >
        {on && <Check className="w-3 h-3 text-white" />}
      </span>
      <span className="min-w-0">
        <span className="text-xs text-white font-sans block">{label}</span>
        {hint && <span className="text-[11px] text-zinc-600 leading-relaxed block mt-0.5">{hint}</span>}
      </span>
    </button>
  );
}
