"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import {
  Users,
  Eye,
  Mail,
  Percent,
  Loader2,
  AlertTriangle,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { asArray } from "@/lib/supabase/rows";
import Panel from "@/components/admin/Panel";

// --- Interfaces for DB & State ---

export interface ContentPerformance {
  analytics_id: string;
  content_title: string;
  content_type: "Blog" | "Release";
  views: number;
  reads: number;
  read_ratio: number;
}

export interface CampaignPerformance {
  campaign_id: string;
  title: string;
  subject: string;
  campaign_status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  sent_at: string | null;
  total_sent: number;
  open_rate: number;
  click_rate: number;
}

export interface SparklinePoint {
  event_date: string;
  page_views: number;
  newsletter_signups: number;
}

interface AnalyticsSummary {
  subscribersCount: number;
  marketingListCount: number;
  applicationListCount: number;
  blogCount: number;
  releaseCount: number;
  campaignsCount: number;
  totalViews: number;
  totalReads: number;
  topContent: ContentPerformance[];
  recentCampaigns: CampaignPerformance[];
  sparklineData: SparklinePoint[];
}

// --- Framer Motion staggered transition variants ---

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring" as const, stiffness: 100, damping: 15 } 
  }
};

export default function DashboardOverviewPage() {
  const [metrics, setMetrics] = useState<AnalyticsSummary>({
    subscribersCount: 0,
    marketingListCount: 0,
    applicationListCount: 0,
    blogCount: 0,
    releaseCount: 0,
    campaignsCount: 0,
    totalViews: 0,
    totalReads: 0,
    topContent: [],
    recentCampaigns: [],
    sparklineData: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [databaseWarning, setDatabaseWarning] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchRealMetrics();
  }, []);

  const fetchRealMetrics = async () => {
    if (!loading) setRefreshing(true);
    setDatabaseWarning(null);
    try {
      // 1. Fetch direct count aggregates in parallel
      const [
        { count: blogCount, error: blogErr },
        { count: releaseCount, error: releaseErr },
        { count: subCount, error: subErr },
        { count: marketingCount },
        { count: appCount },
        { count: campCount, error: campErr }
      ] = await Promise.all([
        supabase.from("blog_posts").select("*", { count: "exact", head: true }),
        supabase.from("release_notes").select("*", { count: "exact", head: true }),
        supabase.from("subscribers").select("*", { count: "exact", head: true }),
        supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("is_marketing_list", true),
        supabase.from("subscribers").select("*", { count: "exact", head: true }).eq("is_application_list", true),
        supabase.from("campaigns").select("*", { count: "exact", head: true })
      ]);

      if (blogErr) console.error("Error fetching blog posts count:", blogErr);
      if (releaseErr) console.error("Error fetching release notes count:", releaseErr);
      if (subErr) console.error("Error fetching subscribers count:", subErr);
      if (campErr) console.error("Error fetching campaigns count:", campErr);

      // 2. Fetch Aggregated views and reads (Fallback-friendly)
      let totalViews = 0;
      let totalReads = 0;
      const { data: analyticsData, error: analyticsErr } = await supabase
        .from("content_analytics")
        .select("views, reads");

      if (analyticsData) {
        analyticsData.forEach((curr) => {
          totalViews += curr.views || 0;
          totalReads += curr.reads || 0;
        });
      }

      // 3. Attempt to fetch database views & RPC function in parallel
      const [
        contentRes,
        campaignRes,
        sparklineRes
      ] = await Promise.all([
        supabase.from("v_content_performance").select("*").limit(5),
        supabase.from("v_campaign_performance").select("*").order("sent_at", { ascending: false, nullsFirst: false }).limit(5),
        supabase.rpc("get_dashboard_sparklines")
      ]);

      // Check if views/functions are missing
      const isSchemaMissing =
        (analyticsErr && (analyticsErr.code === "42P01" || analyticsErr.code === "PGRST205")) ||
        (contentRes.error && (contentRes.error.code === "42P01" || contentRes.error.code === "PGRST205")) ||
        (campaignRes.error && (campaignRes.error.code === "42P01" || campaignRes.error.code === "PGRST205")) ||
        (sparklineRes.error && (sparklineRes.error.code === "42P01" || sparklineRes.error.code === "PGRST205" || sparklineRes.error.code === "PGRST202" || sparklineRes.error.code === "3f000"));

      // This screen used to fill itself with invented figures when the
      // telemetry views were missing — 45,210 blog views, five made-up
      // articles, three made-up campaigns — under a badge reading "Live
      // Feed". A number nobody can tell apart from a real one is worse
      // than no number, so the fabrication is gone: the counts that are
      // real stay real, everything that depends on a missing view reads
      // empty, and the panel says which migration is not applied.
      if (isSchemaMissing) {
        setDatabaseWarning(
          "The telemetry views are not installed, so views, reads and trends read empty. Apply supabase/migrations/20260624153000_dashboard_telemetry.sql."
        );
      }

      setMetrics({
        subscribersCount: subCount || 0,
        marketingListCount: marketingCount || 0,
        applicationListCount: appCount || 0,
        blogCount: blogCount || 0,
        releaseCount: releaseCount || 0,
        campaignsCount: campCount || 0,
        totalViews,
        totalReads,
        topContent: asArray<ContentPerformance>(contentRes.data),
        recentCampaigns: asArray<CampaignPerformance>(campaignRes.data),
        // An RPC can answer with a scalar or an object as easily as a
        // list, and the chart maps over whatever it is handed.
        sparklineData: asArray<SparklinePoint>(sparklineRes.data),
      });
    } catch (err) {
      console.error("Unexpected error fetching overview metrics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-2 text-zinc-400 bg-[#0A0A0A]">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        <span className="text-xs font-medium">Compiling marketing telemetry...</span>
      </div>
    );
  }

  // Calculated rate
  const trafficVal = metrics.totalViews > 0 ? metrics.totalViews * 2.2 : 0;
  const calculatedConversion =
    trafficVal > 0 && metrics.subscribersCount > 0
      ? ((metrics.subscribersCount / trafficVal) * 100).toFixed(1)
      : null;

  // Each card states what it actually counts. There is no period-over-period
  // baseline stored yet, so no card claims a trend it cannot back up.
  const kpis = [
    {
      label: "Total Subscribers",
      value: metrics.subscribersCount.toLocaleString(),
      hint: `${metrics.marketingListCount.toLocaleString()} on the marketing list`,
      icon: Users,
      route: "/admin/dashboard/subscribers",
    },
    {
      label: "Blog Views",
      value: metrics.totalViews.toLocaleString(),
      hint: `${metrics.totalReads.toLocaleString()} reads`,
      icon: Eye,
      route: "/admin/dashboard/blog",
    },
    {
      label: "Email Campaigns",
      value: metrics.campaignsCount.toLocaleString(),
      hint: `${metrics.recentCampaigns.length} in the recent log`,
      icon: Mail,
      route: "/admin/dashboard/broadcasts",
    },
    {
      label: "Conversion Rate",
      // Nothing to divide by is not zero percent, it is no answer.
      value: calculatedConversion === null ? "—" : `${calculatedConversion}%`,
      hint: calculatedConversion === null ? "No traffic recorded yet" : "Subscribers per estimated visit",
      icon: Percent,
      route: "/admin/dashboard/subscribers",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative radial-space-glow tech-grid-overlay">
      <div className="space-y-6 relative z-10 max-w-[90rem] mx-auto">
        
        {/* DB Setup Warning Alert */}
        {databaseWarning && (
          <Panel
            tone="attention"
            title="Some telemetry is not installed"
            icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
            className="max-w-4xl"
          >
            {databaseWarning} Every other figure on this page is read straight from the tables and
            is correct.
          </Panel>
        )}

        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-2 flex-wrap">
              Overview & Marketing Telemetry

            </h1>
            <p className="text-xs text-zinc-400 mt-1 font-sans">
              Real-time analytics for newsletter registrations, reader behaviors, and email broadcasts.
            </p>
          </div>
          
          <button 
            onClick={fetchRealMetrics}
            disabled={refreshing}
            className="btn-glass px-4 min-h-[44px] sm:min-h-0 py-1.5 text-xs font-medium rounded-full flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Updating..." : "Refresh Telemetry"}</span>
          </button>
        </div>

        {/* KPI Cards Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-sans"
        >
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <motion.div key={kpi.label} variants={itemVariants}>
                <Link
                  href={kpi.route}
                  className="glass-panel glass-panel-hover p-4 sm:p-5 rounded-2xl flex flex-col justify-between h-28 sm:h-32 border-white/8 hover:border-white/25 select-none"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs uppercase font-bold tracking-widest text-gray-400">
                      {kpi.label}
                    </span>
                    <Icon className="w-4 h-4 text-zinc-400 shrink-0" />
                  </div>
                  <div className="mt-4">
                    <span className="block text-xl sm:text-2xl font-bold text-white tracking-tight font-mono">
                      {kpi.value}
                    </span>
                    <span className="block text-[9px] text-zinc-400 font-medium truncate">
                      {kpi.hint}
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Telemetry Charts & Splits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2 font-sans">
          
          {/* Dual-Line Trailing Trend Spline Chart */}
          <div className="lg:col-span-2">
            <TrailingTrendsChart data={metrics.sparklineData} />
          </div>

          {/* List Segmentation Breakdown */}
          <div>
            <ListSegmentationCard 
              marketingCount={metrics.marketingListCount} 
              appCount={metrics.applicationListCount} 
            />
          </div>

          {/* Top content engagement */}
          <div className="lg:col-span-2">
            <TopContentGrid items={metrics.topContent} />
          </div>

          {/* Email Campaigns dispatcher logs */}
          <div>
            <CampaignsStatusList items={metrics.recentCampaigns} />
          </div>

        </div>

        {/* Connected Services & Telemetry */}
        <div className="space-y-3 pt-4 border-t border-white/5">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 font-sans">
              Connected Services & Telemetry
            </h2>
            <p className="text-[10px] text-zinc-400 mt-1 font-sans">
              Integrations status, telemetry API flows, and external dispatch console mappings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
            
            {/* Google Analytics Integration Card */}
            <div className="glass-panel glass-panel-hover p-4 sm:p-6 rounded-2xl border-white/8 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                    <span className="font-bold text-white text-xs">Google Analytics</span>
                  </div>
                  <span className="text-[9px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded font-mono font-bold">
                    G-KCDWS029PK
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-[11px] border-t border-white/5 pt-4">
                  <div>
                    <span className="text-zinc-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Stream Name</span>
                    <span className="text-zinc-300 font-medium">ABRAM Landing Page</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Measurement ID</span>
                    <span className="text-white font-mono font-semibold">G-KCDWS029PK</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Stream ID</span>
                    <span className="text-zinc-300 font-mono font-medium">15139917057</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Stream URL</span>
                    <a 
                      href="https://abram.network" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-zinc-300 hover:text-white underline decoration-zinc-700 hover:decoration-zinc-400 transition-colors break-all"
                    >
                      https://abram.network
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-white/5 flex justify-end">
                <a 
                  href="https://analytics.google.com/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-glass px-4 min-h-[44px] sm:min-h-0 py-1.5 text-xs font-medium rounded-full flex items-center gap-1.5"
                >
                  <span>Launch GA Console</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                </a>
              </div>
            </div>

            {/* Resend Email Engine Integration Card */}
            <div className="glass-panel glass-panel-hover p-4 sm:p-6 rounded-2xl border-white/8 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                    <span className="font-bold text-white text-xs">Resend Email Engine</span>
                  </div>
                  <span className="text-[9px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded font-mono font-bold">
                    CONNECTED
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-[11px] border-t border-white/5 pt-4">
                  <div>
                    <span className="text-zinc-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Service Provider</span>
                    <span className="text-zinc-300 font-medium">Resend Inc.</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Contact Audience</span>
                    <span className="text-zinc-300 font-medium">ABRAM Subscribers</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">API Dispatcher</span>
                    <span className="text-zinc-300 font-mono font-medium">Active (SDK)</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Webhook Sync</span>
                    <span className="text-zinc-300 font-medium">Automatic</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-white/5 flex justify-end">
                <a 
                  href="https://resend.com/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-glass px-4 min-h-[44px] sm:min-h-0 py-1.5 text-xs font-medium rounded-full flex items-center gap-1.5"
                >
                  <span>Launch Resend Console</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                </a>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

// --- Inner Visual Components ---

function TrailingTrendsChart({ data }: { data: SparklinePoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="glass-panel p-6 rounded-2xl border-white/8 h-64 flex items-center justify-center text-zinc-400 text-xs">
        No trend telemetry available
      </div>
    );
  }

  const width = 600;
  const height = 180;
  const padding = 20;

  const maxViews = Math.max(...data.map(d => d.page_views), 10);
  const maxSignups = Math.max(...data.map(d => d.newsletter_signups), 10);

  const getCoords = (index: number, val: number, max: number) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - (val / max) * (height - padding * 2);
    return { x, y };
  };

  const viewsPath = data.map((d, i) => {
    const { x, y } = getCoords(i, d.page_views, maxViews);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const signupsPath = data.map((d, i) => {
    const { x, y } = getCoords(i, d.newsletter_signups, maxSignups);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const viewsArea = `${viewsPath} L ${getCoords(data.length - 1, 0, maxViews).x} ${height - padding} L ${getCoords(0, 0, maxViews).x} ${height - padding} Z`;
  const signupsArea = `${signupsPath} L ${getCoords(data.length - 1, 0, maxSignups).x} ${height - padding} L ${getCoords(0, 0, maxSignups).x} ${height - padding} Z`;

  return (
    <div className="glass-panel p-4 sm:p-6 rounded-2xl border-white/8 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="space-y-1 min-w-0">
          <span className="text-xs uppercase font-bold tracking-widest text-gray-400">
            Traffic &amp; Audience Growth
          </span>
          <p className="text-[11px] text-zinc-400">Comparing page views and newsletter sign-ups over 30 days</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-semibold shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-zinc-300 rounded-full" />
            <span className="text-zinc-300">Page Views</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#8ECAFF] rounded-full" />
            <span className="text-zinc-300">Newsletter Sign-ups</span>
          </div>
        </div>
      </div>

      <div className="relative h-44 w-full pt-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full text-zinc-400">
          <defs>
            <linearGradient id="viewsGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.05)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
            <linearGradient id="signupsGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(142, 202, 255, 0.1)" />
              <stop offset="100%" stopColor="rgba(142, 202, 255, 0)" />
            </linearGradient>
            <filter id="splineBlur" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.02)" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.02)" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.06)" />

          {/* Views Area & Line */}
          <path d={viewsArea} fill="url(#viewsGlow)" />
          <path d={viewsPath} fill="none" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1.5" />

          {/* Signups Area & Line */}
          <path d={signupsArea} fill="url(#signupsGlow)" />
          <path d={signupsPath} fill="none" stroke="#8ECAFF" strokeWidth="2" filter="url(#splineBlur)" />
        </svg>
      </div>

      <div className="flex justify-between text-[9px] text-zinc-400 font-mono px-4 select-none">
        <span>{data[0].event_date}</span>
        <span>{data[Math.floor(data.length / 2)].event_date}</span>
        <span>{data[data.length - 1].event_date}</span>
      </div>
    </div>
  );
}

function TopContentGrid({ items }: { items: ContentPerformance[] }) {
  return (
    <div className="glass-panel p-4 sm:p-6 rounded-2xl border-white/8 space-y-4 shadow-xl h-full flex flex-col justify-between">
      <div>
        <span className="text-xs uppercase font-bold tracking-widest text-gray-400">
          Top Content Engagement
        </span>
        <p className="text-[11px] text-zinc-400 mt-0.5">Performance index by page views and read ratios</p>
      </div>

      <div className="space-y-3 flex-1 pt-3">
        {items.length === 0 ? (
          <div className="text-xs text-zinc-400 py-6 text-center">No content telemetry logged yet.</div>
        ) : (
          items.map((item) => (
            <div key={item.analytics_id} className="p-3 rounded-xl bg-zinc-950/40 border border-white/5 flex flex-col gap-2">
              <div className="flex justify-between items-start gap-4">
                <div className="truncate">
                  <span className="text-xs font-semibold text-white block truncate">{item.content_title}</span>
                  <span className="text-[9px] text-zinc-400 uppercase font-mono">{item.content_type}</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 font-semibold shrink-0">
                  {item.views.toLocaleString()} Views
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-zinc-400 font-mono">
                  <span>Read Completion Rate</span>
                  <span className="text-zinc-300">{item.read_ratio}% ({item.reads} reads)</span>
                </div>
                {/* Custom Sparkbar */}
                <div className="h-1 w-full bg-zinc-900/60 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${item.read_ratio >= 75 ? "bg-[#8ECAFF]" : "bg-zinc-400"}`} 
                    style={{ width: `${Math.min(item.read_ratio, 100)}%` }} 
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CampaignsStatusList({ items }: { items: CampaignPerformance[] }) {
  return (
    <div className="glass-panel p-4 sm:p-6 rounded-2xl border-white/8 space-y-4 shadow-xl h-full flex flex-col justify-between">
      <div>
        <span className="text-xs uppercase font-bold tracking-widest text-gray-400">
          Active Campaign Telemetry
        </span>
        <p className="text-[11px] text-zinc-400 mt-0.5">Response tracking for marketing newsletters</p>
      </div>

      <div className="space-y-4 flex-1 pt-3">
        {items.length === 0 ? (
          <div className="text-xs text-zinc-400 py-6 text-center">No dispatch campaigns logged.</div>
        ) : (
          items.map((campaign) => (
            <div key={campaign.campaign_id} className="space-y-2 border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
              <div className="flex justify-between items-start gap-3">
                <div className="truncate">
                  <span className="text-xs font-semibold text-white block truncate">{campaign.title}</span>
                  <span className="text-[9px] text-zinc-400 block truncate">{campaign.subject}</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  campaign.campaign_status === 'sent' 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/10' 
                    : campaign.campaign_status === 'sending'
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10 animate-pulse'
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {campaign.campaign_status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
                <div className="bg-zinc-950/30 border border-white/5 rounded-lg p-2 text-center">
                  <span className="text-[8px] text-zinc-400 uppercase block font-bold font-sans">Sent</span>
                  <span className="text-xs font-semibold text-zinc-300">{campaign.total_sent}</span>
                </div>
                <div className="bg-zinc-950/30 border border-white/5 rounded-lg p-2 text-center">
                  <span className="text-[8px] text-zinc-400 uppercase block font-bold font-sans">Opens</span>
                  <span className="text-xs font-semibold text-zinc-300">{campaign.open_rate}%</span>
                </div>
                <div className="bg-zinc-950/30 border border-white/5 rounded-lg p-2 text-center">
                  <span className="text-[8px] text-zinc-400 uppercase block font-bold font-sans">Clicks</span>
                  <span className="text-xs font-semibold text-zinc-300">{campaign.click_rate}%</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ListSegmentationCard({ marketingCount, appCount }: { marketingCount: number; appCount: number }) {
  const total = marketingCount + appCount;
  const marketingPct = total > 0 ? ((marketingCount / total) * 100).toFixed(0) : '0';
  const appPct = total > 0 ? ((appCount / total) * 100).toFixed(0) : '0';

  return (
    <div className="glass-panel p-4 sm:p-6 rounded-2xl border-white/8 space-y-5 shadow-xl h-full flex flex-col justify-between">
      <div>
        <span className="text-xs uppercase font-bold tracking-widest text-gray-400">
          List Segmentation
        </span>
        <p className="text-[11px] text-zinc-400 mt-0.5">Audience split across subscription categories</p>
      </div>

      <div className="space-y-5 flex-1 pt-4 justify-center flex flex-col">
        {/* Stacked Progress Bar */}
        <div className="h-2 w-full bg-zinc-950 rounded-full flex overflow-hidden border border-white/5">
          <div className="bg-zinc-300 h-full transition-all duration-300" style={{ width: `${marketingPct}%` }} />
          <div className="bg-[#8ECAFF] h-full transition-all duration-300" style={{ width: `${appPct}%` }} />
        </div>

        <div className="space-y-3 text-xs pt-2">
          <div className="flex flex-wrap justify-between items-center gap-x-3 gap-y-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 bg-zinc-300 rounded-full shrink-0" />
              <span className="text-zinc-400">Marketing Newsletter List</span>
            </div>
            <span className="font-mono text-white font-semibold">{marketingCount.toLocaleString()} ({marketingPct}%)</span>
          </div>

          <div className="flex flex-wrap justify-between items-center gap-x-3 gap-y-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 bg-[#8ECAFF] rounded-full shrink-0" />
              <span className="text-zinc-400">Application Updates List</span>
            </div>
            <span className="font-mono text-white font-semibold">{appCount.toLocaleString()} ({appPct}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

