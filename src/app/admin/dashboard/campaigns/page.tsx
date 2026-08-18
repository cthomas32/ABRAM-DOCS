"use client";

import { rows } from "@/lib/supabase/rows";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  Eye,
  Globe,
  Link2,
  Loader2,
  MousePointerClick,
  Percent,
  RefreshCw,
  Smartphone,
  UserPlus,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import CollapsibleCard from "@/components/admin/CollapsibleCard";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Totals {
  visits: number;
  cta_clicks: number;
  signup_clicks: number;
  signup_sessions: number;
  emails: number;
  engaged: number;
  avg_scroll: number;
  avg_duration: number;
  countries: number;
}

interface Funnel {
  landed: number;
  scrolled: number;
  engaged: number;
  finished: number;
  clicked: number;
  signup: number;
}

interface PageRow {
  page_slug: string;
  visits: number;
  signups: number;
  emails: number;
  avg_scroll: number;
  conversion_rate: number;
}

interface SourceRow {
  source: string;
  visits: number;
  clicked: number;
  signups: number;
  emails: number;
  avg_scroll: number;
  conversion_rate: number;
}

interface CampaignRow {
  campaign: string;
  content: string;
  source: string;
  visits: number;
  signups: number;
}

interface CountRow {
  visits: number;
  referrer_host?: string;
  device_type?: string;
  country?: string;
}

interface TimeseriesRow {
  day: string;
  visits: number;
  signups: number;
}

interface RecentRow {
  session_id: string;
  page_slug: string;
  source: string;
  medium: string | null;
  campaign: string | null;
  referrer_host: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  max_scroll_pct: number;
  cta_clicks: number;
  reached_signup: boolean;
  email_captured: boolean;
  duration_seconds: number;
  first_seen_at: string;
}

interface LandingAnalytics {
  range_days: number;
  since: string;
  totals: Totals;
  funnel: Funnel;
  by_page: PageRow[];
  by_source: SourceRow[];
  by_campaign: CampaignRow[];
  by_referrer: CountRow[];
  by_device: CountRow[];
  by_country: CountRow[];
  timeseries: TimeseriesRow[];
  recent: RecentRow[];
}

const EMPTY: LandingAnalytics = {
  range_days: 30,
  since: "",
  totals: {
    visits: 0,
    cta_clicks: 0,
    signup_clicks: 0,
    signup_sessions: 0,
    emails: 0,
    engaged: 0,
    avg_scroll: 0,
    avg_duration: 0,
    countries: 0,
  },
  funnel: { landed: 0, scrolled: 0, engaged: 0, finished: 0, clicked: 0, signup: 0 },
  by_page: [],
  by_source: [],
  by_campaign: [],
  by_referrer: [],
  by_device: [],
  by_country: [],
  timeseries: [],
  recent: [],
};

const RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

interface LinkPage {
  slug: string;
  label: string;
  path: string;
}

interface LinkChannel {
  source: string;
  medium: string;
  label: string;
}

const PAGES = [
  { slug: null as string | null, label: "All pages", path: "/start" },
  { slug: "start", label: "Start (general)", path: "/start" },
  { slug: "start-filmmakers", label: "Filmmakers", path: "/start/filmmakers" },
  { slug: "start-agencies", label: "Agencies", path: "/start/agencies" },
  { slug: "start-post", label: "Post production", path: "/start/post-production" },
  { slug: "start-resources", label: "Resources", path: "/start/resource-management" },
  { slug: "start-assistant", label: "AI assistant", path: "/start/ai-assistant" },
];

/* The link builder reads its pages and channels from the campaign_link_pages and
   campaign_link_channels tables so a channel can be added or retired without a deploy.
   These two arrays are the fallback used when the tables are empty or unreachable, and
   they mirror the seeded rows. */
const FALLBACK_LINK_PAGES: LinkPage[] = PAGES.filter((page) => page.slug !== null).map(
  (page) => ({ slug: page.slug as string, label: page.label, path: page.path })
);

const FALLBACK_LINK_CHANNELS: LinkChannel[] = [
  { source: "tiktok", medium: "social", label: "TikTok" },
  { source: "reddit", medium: "social", label: "Reddit" },
  { source: "instagram", medium: "social", label: "Instagram" },
  { source: "youtube", medium: "social", label: "YouTube" },
  { source: "linkedin", medium: "social", label: "LinkedIn" },
  { source: "x", medium: "social", label: "X" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } },
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function pct(part: number, whole: number): string {
  if (!whole) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "0s";
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function pageLabel(slug: string): string {
  return PAGES.find((page) => page.slug === slug)?.label || slug;
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function CampaignAnalyticsPage() {
  const [data, setData] = useState<LandingAnalytics>(EMPTY);
  const [days, setDays] = useState(30);
  const [pageFilter, setPageFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setRefreshing(true);
    try {
      const supabase = createClient();
      const { data: payload, error } = await supabase.rpc("get_landing_analytics", {
        p_days: days,
        p_page: pageFilter,
      });

      if (error) {
        setWarning(error.message);
        setData(EMPTY);
      } else {
        setWarning(null);
        setData({ ...EMPTY, ...(payload as LandingAnalytics) });
      }
    } catch (err) {
      setWarning(err instanceof Error ? err.message : "Unable to load campaign telemetry.");
      setData(EMPTY);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [days, pageFilter]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const { totals, funnel } = data;

  const conversionRate = useMemo(
    () => (totals.visits ? ((totals.signup_sessions / totals.visits) * 100).toFixed(1) : "0.0"),
    [totals.visits, totals.signup_sessions]
  );

  const kpis = [
    { label: "Visitors", value: totals.visits.toLocaleString(), icon: Eye, hint: `${data.range_days} day window` },
    { label: "Engaged (50%+)", value: totals.engaged.toLocaleString(), icon: MousePointerClick, hint: pct(totals.engaged, totals.visits) + " of visitors" },
    { label: "Sign-up clicks", value: totals.signup_sessions.toLocaleString(), icon: UserPlus, hint: `${totals.signup_clicks} total clicks` },
    { label: "Conversion rate", value: `${conversionRate}%`, icon: Percent, hint: "Visitors reaching sign-up" },
    { label: "CTA clicks", value: totals.cta_clicks.toLocaleString(), icon: Link2, hint: `${totals.signup_clicks} to sign-up` },
    { label: "Avg time on page", value: formatDuration(totals.avg_duration), icon: Globe, hint: `${totals.avg_scroll}% avg scroll` },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-2 text-zinc-400 bg-[#0A0A0A]">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        <span className="text-xs font-medium">Loading campaign telemetry...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative radial-space-glow tech-grid-overlay">
      <div className="space-y-6 relative z-10 max-w-[90rem] mx-auto">
        {warning ? (
          <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/15 text-yellow-400 text-xs flex items-start gap-2.5 max-w-4xl backdrop-blur-md">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Telemetry unavailable</span>
              <p className="text-zinc-400 leading-relaxed break-words">{warning}</p>
            </div>
          </div>
        ) : null}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-2 flex-wrap">
              Campaign Landing Pages
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-medium tracking-wide bg-green-500/10 border border-green-500/20 text-green-400 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live Feed
              </span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1 font-sans">
              Visitor, engagement and sign-up telemetry for the conversion pages under /start.
            </p>
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={refreshing}
            className="btn-glass px-4 min-h-[44px] sm:min-h-0 py-1.5 text-xs font-medium rounded-full flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Updating..." : "Refresh"}</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex gap-1.5 flex-wrap">
            {RANGES.map((range) => (
              <button
                key={range.days}
                onClick={() => setDays(range.days)}
                className={`px-4 min-h-[44px] sm:min-h-[32px] rounded-full text-xs font-semibold border transition-colors duration-200 cursor-pointer ${
                  days === range.days
                    ? "bg-white text-black border-white"
                    : "bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          <div className="hidden sm:block w-px h-5 bg-white/10" />

          {/* Phones get a picker instead of five more chips */}
          <select
            value={pageFilter ?? ""}
            onChange={(event) => setPageFilter(event.target.value || null)}
            aria-label="Filter by landing page"
            className="sm:hidden w-full h-11 bg-[#121212] border border-white/10 rounded-full px-4 text-xs font-semibold text-white focus:outline-none focus:border-white/20 cursor-pointer"
          >
            {PAGES.map((page) => (
              <option key={page.label} value={page.slug ?? ""}>
                {page.label}
              </option>
            ))}
          </select>

          <div className="hidden sm:flex gap-1.5 flex-wrap">
            {PAGES.map((page) => (
              <button
                key={page.label}
                onClick={() => setPageFilter(page.slug)}
                className={`px-4 min-h-[44px] sm:min-h-[32px] rounded-full text-xs font-semibold border transition-colors duration-200 cursor-pointer ${
                  pageFilter === page.slug
                    ? "bg-white text-black border-white"
                    : "bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                }`}
              >
                {page.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 font-sans"
        >
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={kpi.label}
                variants={itemVariants}
                className="glass-panel p-4 sm:p-5 rounded-2xl flex flex-col justify-between h-28 sm:h-32 border-white/8 select-none"
              >
                {/* Two lines are reserved whether the label wraps or not, so
                    the values stay on one baseline across the row. */}
                <div className="flex justify-between items-start gap-2 min-h-[2.2em]">
                  <span className="text-xs uppercase font-bold tracking-widest text-gray-400 break-words leading-tight">
                    {kpi.label}
                  </span>
                  <Icon className="w-4 h-4 text-zinc-400 shrink-0" />
                </div>
                <div className="mt-4">
                  <span className="text-xl sm:text-2xl font-bold text-white tracking-tight font-mono block">
                    {kpi.value}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-medium">{kpi.hint}</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Funnel + trend */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <FunnelCard funnel={funnel} />
          </div>
          <div className="lg:col-span-2">
            <TrendCard rows={data.timeseries} />
          </div>
        </div>

        {/* Source + page performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SourceTable rows={data.by_source} />
          <PageTable rows={data.by_page} />
        </div>

        {/* Breakdown strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BreakdownCard
            title="Referrers"
            icon={Globe}
            rows={data.by_referrer.map((row) => ({ label: row.referrer_host || "direct", visits: row.visits }))}
            total={totals.visits}
          />
          <BreakdownCard
            title="Devices"
            icon={Smartphone}
            rows={data.by_device.map((row) => ({ label: row.device_type || "unknown", visits: row.visits }))}
            total={totals.visits}
          />
          <BreakdownCard
            title="Countries"
            icon={Globe}
            rows={data.by_country.map((row) => ({ label: row.country || "unknown", visits: row.visits }))}
            total={totals.visits}
          />
        </div>

        {/* Campaign tags */}
        <CampaignTable rows={data.by_campaign} />

        {/* Link builder */}
        <LinkBuilder />

        {/* Recent visitors */}
        <RecentVisitors rows={data.recent} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Funnel                                                              */
/* ------------------------------------------------------------------ */

function FunnelCard({ funnel }: { funnel: Funnel }) {
  const stages = [
    { label: "Landed", value: funnel.landed },
    { label: "Scrolled 25%", value: funnel.scrolled },
    { label: "Engaged 50%", value: funnel.engaged },
    { label: "Read to end", value: funnel.finished },
    { label: "Clicked a CTA", value: funnel.clicked },
    { label: "Hit sign-up", value: funnel.signup },
  ];

  return (
    <div className="glass-panel p-4 sm:p-6 rounded-2xl border-white/8 h-full">
      <h2 className="text-xs uppercase font-bold tracking-widest text-gray-400 font-sans">
        Conversion Funnel
      </h2>
      <p className="text-[10px] text-zinc-400 mt-1 mb-5">Share of visitors reaching each stage.</p>

      <div className="space-y-3">
        {stages.map((stage) => {
          const width = funnel.landed ? Math.max(2, (stage.value / funnel.landed) * 100) : 2;
          return (
            <div key={stage.label}>
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-zinc-400 font-medium">{stage.label}</span>
                <span className="text-zinc-300 font-mono font-semibold">
                  {stage.value.toLocaleString()}
                  <span className="text-zinc-400 ml-1.5">{pct(stage.value, funnel.landed)}</span>
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#8ECAFF] to-[#3B82F6]"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Daily trend                                                         */
/* ------------------------------------------------------------------ */

function TrendCard({ rows }: { rows: TimeseriesRow[] }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="glass-panel p-4 sm:p-6 rounded-2xl border-white/8 h-full flex flex-col">
        <h2 className="text-xs uppercase font-bold tracking-widest text-gray-400 font-sans">
          Daily Traffic
        </h2>
        <div className="flex-1 flex items-center justify-center text-xs text-zinc-400 min-h-[160px]">
          No visits recorded in this window yet.
        </div>
      </div>
    );
  }

  const maxVisits = Math.max(...rows.map((row) => row.visits), 1);

  return (
    <div className="glass-panel p-4 sm:p-6 rounded-2xl border-white/8 h-full">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xs uppercase font-bold tracking-widest text-gray-400 font-sans">
          Daily Traffic
        </h2>
        <div className="flex items-center gap-4 text-[9px] text-zinc-400 uppercase tracking-wider font-bold">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#8ECAFF]" /> Visitors
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" /> Sign-ups
          </span>
        </div>
      </div>

      {/* The cap stops two days of data rendering as two enormous slabs. */}
      <div className="mt-6 flex items-end gap-1 h-[160px] overflow-x-auto">
        {rows.map((row) => (
          <div key={row.day} className="flex-1 min-w-[10px] max-w-[56px] flex flex-col items-center gap-1 group">
            <div className="w-full flex flex-col justify-end h-[140px] gap-0.5">
              {row.signups > 0 ? (
                <div
                  className="w-full rounded-t bg-green-500/80"
                  style={{ height: `${(row.signups / maxVisits) * 100}%` }}
                  title={`${row.signups} sign-ups`}
                />
              ) : null}
              <div
                className="w-full rounded-t bg-[#8ECAFF]/60 group-hover:bg-[#8ECAFF] transition-colors"
                style={{ height: `${Math.max(2, (row.visits / maxVisits) * 100)}%` }}
                title={`${row.day}: ${row.visits} visitors`}
              />
            </div>
            <span className="text-[8px] text-zinc-400 font-mono whitespace-nowrap">
              {row.day.slice(5)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tables                                                              */
/* ------------------------------------------------------------------ */

function SourceTable({ rows }: { rows: SourceRow[] }) {
  return (
    <CollapsibleCard
      title="Traffic by Source"
      subtitle="Where visitors came from, and how many made it to sign-up."
      badge={rows.length ? `${rows.length}` : undefined}
    >
      {rows.length === 0 ? (
        <p className="text-xs text-zinc-400 py-6 text-center">No traffic recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <p className="text-[9px] text-zinc-400 mb-2 md:hidden">Swipe to view &rarr;</p>
          <table className="w-full text-[11px] min-w-[420px]">
            <thead>
              <tr className="text-left text-gray-400 uppercase tracking-widest text-[10px] font-bold">
                <th className="pb-2 font-bold">Source</th>
                <th className="pb-2 font-bold text-right">Visitors</th>
                <th className="pb-2 font-bold text-right">Clicked</th>
                <th className="pb-2 font-bold text-right">Sign-ups</th>
                <th className="pb-2 font-bold text-right">Conv.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.source} className="border-t border-white/5">
                  <td className="py-2.5 text-zinc-200 font-medium capitalize">{row.source}</td>
                  <td className="py-2.5 text-right text-zinc-300 font-mono">{row.visits}</td>
                  <td className="py-2.5 text-right text-zinc-400 font-mono">{row.clicked}</td>
                  <td className="py-2.5 text-right text-zinc-300 font-mono">{row.signups}</td>
                  <td className="py-2.5 text-right font-mono font-semibold text-white">
                    {row.conversion_rate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CollapsibleCard>
  );
}

function PageTable({ rows }: { rows: PageRow[] }) {
  return (
    <CollapsibleCard
      title="Performance by Page"
      subtitle="Which landing page converts best."
      badge={rows.length ? `${rows.length}` : undefined}
    >
      {rows.length === 0 ? (
        <p className="text-xs text-zinc-400 py-6 text-center">No page visits recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <p className="text-[9px] text-zinc-400 mb-2 md:hidden">Swipe to view &rarr;</p>
          <table className="w-full text-[11px] min-w-[420px]">
            <thead>
              <tr className="text-left text-gray-400 uppercase tracking-widest text-[10px] font-bold">
                <th className="pb-2 font-bold">Page</th>
                <th className="pb-2 font-bold text-right">Visitors</th>
                <th className="pb-2 font-bold text-right">Avg scroll</th>
                <th className="pb-2 font-bold text-right">Sign-ups</th>
                <th className="pb-2 font-bold text-right">Conv.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.page_slug} className="border-t border-white/5">
                  <td className="py-2.5 text-zinc-200 font-medium">{pageLabel(row.page_slug)}</td>
                  <td className="py-2.5 text-right text-zinc-300 font-mono">{row.visits}</td>
                  <td className="py-2.5 text-right text-zinc-400 font-mono">{row.avg_scroll}%</td>
                  <td className="py-2.5 text-right text-zinc-400 font-mono">{row.signups}</td>
                  <td className="py-2.5 text-right font-mono font-semibold text-white">
                    {row.conversion_rate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CollapsibleCard>
  );
}

function CampaignTable({ rows }: { rows: CampaignRow[] }) {
  if (!rows || rows.length === 0) return null;

  return (
    <CollapsibleCard
      title="Tagged Campaigns"
      subtitle="Broken out by the campaign and content tags on your links, so individual posts can be compared."
      badge={`${rows.length}`}
    >
      <div className="overflow-x-auto">
        <p className="text-[9px] text-zinc-400 mb-2 md:hidden">Swipe to view &rarr;</p>
        <table className="w-full text-[11px] min-w-[520px]">
          <thead>
            <tr className="text-left text-gray-400 uppercase tracking-widest text-[10px] font-bold">
              <th className="pb-2 font-bold">Campaign</th>
              <th className="pb-2 font-bold">Content tag</th>
              <th className="pb-2 font-bold">Source</th>
              <th className="pb-2 font-bold text-right">Visitors</th>
              <th className="pb-2 font-bold text-right">Sign-ups</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.campaign}-${row.content}-${index}`} className="border-t border-white/5">
                <td className="py-2.5 text-zinc-200 font-medium break-words">{row.campaign}</td>
                <td className="py-2.5 text-zinc-400 font-mono break-words">{row.content}</td>
                <td className="py-2.5 text-zinc-400 capitalize">{row.source}</td>
                <td className="py-2.5 text-right text-zinc-300 font-mono">{row.visits}</td>
                <td className="py-2.5 text-right text-white font-mono font-semibold">{row.signups}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CollapsibleCard>
  );
}

/* ------------------------------------------------------------------ */
/* Breakdown card                                                      */
/* ------------------------------------------------------------------ */

function BreakdownCard({
  title,
  icon: Icon,
  rows,
  total,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  rows: Array<{ label: string; visits: number }>;
  total: number;
}) {
  return (
    <div className="glass-panel p-4 sm:p-6 rounded-2xl border-white/8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs uppercase font-bold tracking-widest text-gray-400 font-sans">
          {title}
        </h2>
        <Icon className="w-4 h-4 text-zinc-400" />
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-zinc-400 py-4 text-center">Nothing yet.</p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-zinc-300 truncate">{row.label}</span>
              <span className="text-zinc-400 font-mono shrink-0">
                {row.visits}
                <span className="text-zinc-400 ml-1.5">{pct(row.visits, total)}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Campaign link builder                                               */
/* ------------------------------------------------------------------ */

function LinkBuilder() {
  const [campaign, setCampaign] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [pages, setPages] = useState<LinkPage[]>(FALLBACK_LINK_PAGES);
  const [channels, setChannels] = useState<LinkChannel[]>(FALLBACK_LINK_CHANNELS);
  const [fromDatabase, setFromDatabase] = useState(false);

  /* Pages and channels live in the database so they can be edited without a deploy. If the
     read fails or comes back empty the built-in defaults stay on screen. */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const supabase = createClient();
      const [pageResult, channelResult] = await Promise.all([
        supabase
          .from("campaign_link_pages")
          .select("slug,label,path")
          .eq("active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("campaign_link_channels")
          .select("source,medium,label")
          .eq("active", true)
          .order("sort_order", { ascending: true }),
      ]);

      if (cancelled) return;

      const loadedPages = rows<LinkPage>(pageResult);
      const loadedChannels = rows<LinkChannel>(channelResult);

      if (loadedPages.length) setPages(loadedPages);
      if (loadedChannels.length) setChannels(loadedChannels);
      if (loadedPages.length && loadedChannels.length) setFromDatabase(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* clipboard blocked, the visitor can still select the text */
    }
  };

  const buildUrl = (path: string, source: string, medium: string) => {
    const params = new URLSearchParams({ utm_source: source, utm_medium: medium });
    if (campaign.trim()) {
      params.set("utm_campaign", campaign.trim().replace(/\s+/g, "-").toLowerCase());
    }
    return `https://abram.network${path}?${params.toString()}`;
  };

  return (
    <CollapsibleCard
      title="Tracked Link Builder"
      subtitle={
        fromDatabase
          ? "Copy a tagged link before you post, so every visit is attributed to the right channel. Pages and channels are read live from the database."
          : "Copy a tagged link before you post, so every visit is attributed to the right channel. Showing the built-in defaults."
      }
    >
      <div className="mb-5">
        <label
          htmlFor="campaign-tag"
          className="text-[9px] uppercase font-bold tracking-wider text-zinc-400 block mb-1.5"
        >
          Campaign tag (optional)
        </label>
        <input
          id="campaign-tag"
          value={campaign}
          onChange={(event) => setCampaign(event.target.value)}
          placeholder="july-callsheet-clip"
          className="w-full sm:max-w-sm rounded-full bg-white/[0.04] border border-white/10 px-4 h-11 sm:h-auto sm:py-2 text-xs text-white placeholder:text-zinc-400 outline-none focus:border-white/20 transition-all"
        />
      </div>

      <div className="space-y-5">
        {pages.map((page) => (
          <div key={page.slug}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold text-zinc-200">{page.label}</span>
              <a
                href={`https://abram.network${page.path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-white transition-colors"
                title="Open the page"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {channels.map((channel) => {
                const url = buildUrl(page.path, channel.source, channel.medium);
                return (
                  <button
                    key={channel.source}
                    onClick={() => copy(url)}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 text-left hover:border-white/15 hover:bg-white/[0.05] transition-all duration-200 cursor-pointer group min-h-[44px]"
                  >
                    <span className="min-w-0">
                      <span className="block text-[9px] uppercase font-bold tracking-wider text-zinc-400">
                        {channel.label}
                      </span>
                      <span className="block text-[10px] font-mono text-zinc-400 truncate group-hover:text-zinc-200">
                        {url}
                      </span>
                    </span>
                    {copied === url ? (
                      <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-zinc-400 shrink-0 group-hover:text-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </CollapsibleCard>
  );
}

/* ------------------------------------------------------------------ */
/* Recent visitors                                                     */
/* ------------------------------------------------------------------ */

function RecentVisitors({ rows }: { rows: RecentRow[] }) {
  return (
    <CollapsibleCard
      title="Recent Visitors"
      subtitle="The last 60 sessions. No personal data is stored against a visit beyond a coarse country code."
      badge={rows.length ? `${rows.length}` : undefined}
    >
      {rows.length === 0 ? (
        <p className="text-xs text-zinc-400 py-6 text-center">No visits recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <p className="text-[9px] text-zinc-400 mb-2 md:hidden">Swipe to view &rarr;</p>
          <table className="w-full text-[11px] min-w-[760px]">
            <thead>
              <tr className="text-left text-gray-400 uppercase tracking-widest text-[10px] font-bold">
                <th className="pb-2 font-bold">When</th>
                <th className="pb-2 font-bold">Page</th>
                <th className="pb-2 font-bold">Source</th>
                <th className="pb-2 font-bold">Device</th>
                <th className="pb-2 font-bold">Country</th>
                <th className="pb-2 font-bold text-right">Scroll</th>
                <th className="pb-2 font-bold text-right">Time</th>
                <th className="pb-2 font-bold text-right">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.session_id} className="border-t border-white/5">
                  <td className="py-2.5 text-zinc-400 font-mono whitespace-nowrap">
                    {new Date(row.first_seen_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-2.5 text-zinc-300">{pageLabel(row.page_slug)}</td>
                  <td className="py-2.5 text-zinc-400 capitalize">
                    {row.source}
                    {row.campaign ? (
                      <span className="text-zinc-400 font-mono ml-1.5">{row.campaign}</span>
                    ) : null}
                  </td>
                  <td className="py-2.5 text-zinc-400 capitalize">
                    {row.device_type} {row.os ? `/ ${row.os}` : ""}
                  </td>
                  <td className="py-2.5 text-zinc-400 font-mono">{row.country || "n/a"}</td>
                  <td className="py-2.5 text-right text-zinc-400 font-mono">{row.max_scroll_pct}%</td>
                  <td className="py-2.5 text-right text-zinc-400 font-mono">
                    {formatDuration(row.duration_seconds)}
                  </td>
                  <td className="py-2.5 text-right">
                    {row.reached_signup ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
                        Sign-up
                      </span>
                    ) : row.cta_clicks > 0 ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-zinc-400">
                        Clicked
                      </span>
                    ) : (
                      <span className="text-[9px] text-zinc-400">Read</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CollapsibleCard>
  );
}
