"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgePercent,
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
  archived: "bg-white/5 text-zinc-400",
};

export default function PromotionsPanel() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Campaign | null>(null);
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
            <p className="text-xs text-zinc-400 mt-1 font-sans">
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
            <Link
              href="/admin/dashboard/promotions/new"
              className="btn-primary h-9 px-4 text-xs font-medium rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New campaign
            </Link>
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
            <Ticket className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="text-sm text-zinc-400 mt-3 font-sans">No campaigns yet.</p>
            <p className="text-xs text-zinc-400 mt-1 font-sans max-w-md mx-auto">
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
              <span className="text-xs uppercase font-bold tracking-widest text-zinc-400">
                New customers
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-sans">{campaign.description}</p>
          <p className="text-[11px] text-zinc-400 mt-1 font-mono">{campaign.slug}</p>
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
              className="h-11 w-11 sm:h-8 sm:w-8 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors flex items-center justify-center"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          ) : campaign.status !== "archived" ? (
            <button
              onClick={() => onSetStatus("active")}
              title="Activate"
              className="h-11 w-11 sm:h-8 sm:w-8 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors flex items-center justify-center"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          ) : null}
          <button
            onClick={onOpen}
            className="h-9 px-3 text-xs font-medium rounded-lg border border-white/10 text-zinc-300 hover:bg-white/[0.04] transition-colors flex items-center gap-1"
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
      <span className="text-xs uppercase font-bold tracking-widest text-zinc-400 font-sans block">
        {label}
      </span>
      <span className="text-lg font-bold tracking-tight text-white font-sans">{value}</span>
    </div>
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
            <p className="text-xs text-zinc-400 mt-1 font-sans">{campaign.description}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {campaign.status === "archived" ? (
          <p className="text-xs text-zinc-400">This campaign is archived. No new codes can be minted.</p>
        ) : (
          <div className="rounded-xl border border-white/10 p-4 space-y-4">
            <div className="flex gap-2">
              {(["public", "unique"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={`h-9 px-3 text-xs font-medium rounded-lg border transition-colors ${
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
              <p className="text-[11px] text-zinc-400 mt-1">
                Tagged onto every redemption, so you can tell which channel actually converted.
              </p>
            </Field>

            {err && <p className="text-xs text-zinc-300 leading-relaxed">{err}</p>}

            <button
              onClick={() => void mint()}
              disabled={minting || (kind === "public" && !publicCode.trim())}
              className="btn-primary h-9 px-4 text-xs font-medium rounded-lg disabled:opacity-40 flex items-center gap-2"
            >
              {minting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Mint {kind === "public" ? "code" : `${count} codes`}
            </button>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-400 font-sans">
              Codes ({codes.length})
            </span>
            {codes.length > 0 && (
              <button
                onClick={copyAll}
                className="text-[11px] text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                Copy active
              </button>
            )}
          </div>

          {loading ? (
            <div className="h-16 rounded-xl border border-white/5 animate-pulse" />
          ) : codes.length === 0 ? (
            <p className="text-xs text-zinc-400 py-4">No codes minted yet.</p>
          ) : (
            <div className="divide-y divide-white/5 rounded-xl border border-white/10 overflow-hidden">
              {codes.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span
                    className={`font-mono text-xs tracking-wide flex-1 truncate ${
                      c.status === "active" ? "text-white" : "text-zinc-400 line-through"
                    }`}
                  >
                    {c.code}
                  </span>
                  {c.source && <span className="text-[10px] text-zinc-400 shrink-0">{c.source}</span>}
                  <span className="text-[11px] text-zinc-400 shrink-0">
                    {c.redemption_count}
                    {c.max_redemptions ? `/${c.max_redemptions}` : ""}
                  </span>
                  <button
                    onClick={() => void toggleCode(c)}
                    className="text-[11px] text-zinc-400 hover:text-white transition-colors shrink-0 w-14 text-right"
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
      <label className="text-xs uppercase font-bold tracking-widest text-zinc-400 font-sans block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
