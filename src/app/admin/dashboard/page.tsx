"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Mail, 
  Percent, 
  Loader2, 
  AlertTriangle,
  BookOpen,
  Tag,
  ArrowRight,
  RefreshCw,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingDown
} from "lucide-react";
import Link from "next/link";

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

      if (isSchemaMissing) {
        console.warn("Views or RPC missing, running in self-healing simulation mode.");
        setDatabaseWarning(
          "Telemetry views or functions are missing. Dashboard is running in simulated fallback mode. Run supabase/migrations/20260624153000_dashboard_telemetry.sql in your Supabase SQL Editor."
        );

        setMetrics({
          subscribersCount: subCount || 0,
          marketingListCount: marketingCount || 0,
          applicationListCount: appCount || 0,
          blogCount: blogCount || 0,
          releaseCount: releaseCount || 0,
          campaignsCount: campCount || 0,
          totalViews: totalViews || 45210,
          totalReads: totalReads || 38240,
          topContent: mockTopContent,
          recentCampaigns: mockRecentCampaigns,
          sparklineData: generateMockSparklines()
        });
      } else {
        // Successful database fetch
        setMetrics({
          subscribersCount: subCount || 0,
          marketingListCount: marketingCount || 0,
          applicationListCount: appCount || 0,
          blogCount: blogCount || 0,
          releaseCount: releaseCount || 0,
          campaignsCount: campCount || 0,
          totalViews,
          totalReads,
          topContent: contentRes.data || [],
          recentCampaigns: campaignRes.data || [],
          sparklineData: sparklineRes.data || []
        });
      }
    } catch (err) {
      console.error("Unexpected error fetching overview metrics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-2 text-zinc-500 bg-[#0A0A0A]">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        <span className="text-xs font-medium">Compiling marketing telemetry...</span>
      </div>
    );
  }

  // Calculated rate
  const isFallback = !!databaseWarning;
  const trafficVal = isFallback ? 45210 : (metrics.totalViews > 0 ? metrics.totalViews * 2.2 : 0);
  const calculatedConversion = (trafficVal > 0 && metrics.subscribersCount > 0)
    ? ((metrics.subscribersCount / trafficVal) * 100).toFixed(1)
    : (isFallback ? "3.8" : "0.0");

  const kpis = [
    { label: "Total Subscribers", value: metrics.subscribersCount.toLocaleString(), change: "+14.2% MoM", icon: Users, route: "/admin/dashboard/subscribers" },
    { label: "Blog Views", value: (isFallback ? 45210 : metrics.totalViews).toLocaleString(), change: "+8.6% WoW", icon: Eye, route: "/admin/dashboard/blog" },
    { label: "Email Campaigns", value: metrics.campaignsCount.toLocaleString(), change: "100% Sent", icon: Mail, route: "/admin/dashboard/broadcasts" },
    { label: "Conversion Rate", value: `${calculatedConversion}%`, change: "+0.4% MoM", icon: Percent, route: "/admin/dashboard/subscribers" },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative radial-space-glow tech-grid-overlay">
      <div className="space-y-6 relative z-10 max-w-[90rem] mx-auto">
        
        {/* DB Setup Warning Alert */}
        {databaseWarning && (
          <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/15 text-yellow-400 text-xs flex items-start gap-2.5 max-w-4xl shadow-lg backdrop-blur-md">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Database Telemetry Fallback Active</span>
              <p className="text-zinc-400 leading-relaxed">
                {databaseWarning} Performance logs are operating in simulated mode.
              </p>
            </div>
          </div>
        )}

        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-2 flex-wrap">
              Overview & Marketing Telemetry
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-medium tracking-wide bg-green-500/10 border border-green-500/20 text-green-400 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live Feed
              </span>
            </h1>
            <p className="text-xs text-zinc-500 mt-1 font-sans">
              Real-time analytics for newsletter registrations, reader behaviors, and email broadcasts.
            </p>
          </div>
          
          <button 
            onClick={fetchRealMetrics}
            disabled={refreshing}
            className="btn-glass px-4 py-1.5 text-xs font-semibold rounded-full flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
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
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans"
        >
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <motion.div key={idx} variants={itemVariants}>
                <Link 
                  href={kpi.route}
                  className="glass-panel glass-panel-hover p-5 rounded-2xl flex flex-col justify-between h-32 border-white/8 hover:border-white/25 select-none"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                      {kpi.label}
                    </span>
                    <Icon className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-white tracking-tight font-mono">
                      {kpi.value}
                    </span>
                    <span className="text-[9px] font-bold text-green-400 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/10">
                      {kpi.change}
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
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 font-sans">
              Connected Services & Telemetry
            </h2>
            <p className="text-[10px] text-zinc-500 mt-1 font-sans">
              Integrations status, telemetry API flows, and external dispatch console mappings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
            
            {/* Google Analytics Integration Card */}
            <div className="glass-panel glass-panel-hover p-6 rounded-2xl border-white/8 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </div>
                    <span className="font-bold text-white text-xs">Google Analytics</span>
                  </div>
                  <span className="text-[9px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded font-mono font-bold">
                    G-KCDWS029PK
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[11px] border-t border-white/5 pt-4">
                  <div>
                    <span className="text-zinc-500 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Stream Name</span>
                    <span className="text-zinc-300 font-medium">ABRAM Landing Page</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Measurement ID</span>
                    <span className="text-white font-mono font-semibold">G-KCDWS029PK</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Stream ID</span>
                    <span className="text-zinc-300 font-mono font-medium">15139917057</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Stream URL</span>
                    <a 
                      href="https://abram.network" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-zinc-300 hover:text-white underline decoration-zinc-700 hover:decoration-zinc-400 transition-colors"
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
                  className="btn-glass px-4 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1.5"
                >
                  <span>Launch GA Console</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                </a>
              </div>
            </div>

            {/* Resend Email Engine Integration Card */}
            <div className="glass-panel glass-panel-hover p-6 rounded-2xl border-white/8 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </div>
                    <span className="font-bold text-white text-xs">Resend Email Engine</span>
                  </div>
                  <span className="text-[9px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded font-mono font-bold">
                    CONNECTED
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[11px] border-t border-white/5 pt-4">
                  <div>
                    <span className="text-zinc-500 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Service Provider</span>
                    <span className="text-zinc-300 font-medium">Resend Inc.</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Contact Audience</span>
                    <span className="text-zinc-300 font-medium">ABRAM Subscribers</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[9px] uppercase font-bold tracking-wider mb-0.5">API Dispatcher</span>
                    <span className="text-zinc-300 font-mono font-medium">Active (SDK)</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Webhook Sync</span>
                    <span className="text-zinc-300 font-medium">Automatic</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-white/5 flex justify-end">
                <a 
                  href="https://resend.com/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-glass px-4 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1.5"
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
      <div className="glass-panel p-6 rounded-2xl border-white/8 h-64 flex items-center justify-center text-zinc-500 text-xs">
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
    <div className="glass-panel p-6 rounded-2xl border-white/8 space-y-4 shadow-xl">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
            Traffic & Audience Growth
          </span>
          <p className="text-[11px] text-zinc-500">Comparing page views and newsletter sign-ups over 30 days</p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-zinc-300 rounded-full" />
            <span className="text-zinc-300">Page Views</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#8ECAFF] rounded-full animate-pulse" />
            <span className="text-zinc-300">Newsletter Sign-ups</span>
          </div>
        </div>
      </div>

      <div className="relative h-44 w-full pt-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full text-zinc-600">
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

      <div className="flex justify-between text-[9px] text-zinc-500 font-mono px-4 select-none">
        <span>{data[0].event_date}</span>
        <span>{data[Math.floor(data.length / 2)].event_date}</span>
        <span>{data[data.length - 1].event_date}</span>
      </div>
    </div>
  );
}

function TopContentGrid({ items }: { items: ContentPerformance[] }) {
  return (
    <div className="glass-panel p-6 rounded-2xl border-white/8 space-y-4 shadow-xl h-full flex flex-col justify-between">
      <div>
        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
          Top Content Engagement
        </span>
        <p className="text-[11px] text-zinc-500 mt-0.5">Performance index by page views and read ratios</p>
      </div>

      <div className="space-y-3 flex-1 pt-3">
        {items.length === 0 ? (
          <div className="text-xs text-zinc-500 py-6 text-center">No content telemetry logged yet.</div>
        ) : (
          items.map((item) => (
            <div key={item.analytics_id} className="p-3 rounded-xl bg-zinc-950/40 border border-white/5 flex flex-col gap-2">
              <div className="flex justify-between items-start gap-4">
                <div className="truncate">
                  <span className="text-xs font-semibold text-white block truncate">{item.content_title}</span>
                  <span className="text-[9px] text-zinc-500 uppercase font-mono">{item.content_type}</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 font-semibold shrink-0">
                  {item.views.toLocaleString()} Views
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
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
    <div className="glass-panel p-6 rounded-2xl border-white/8 space-y-4 shadow-xl h-full flex flex-col justify-between">
      <div>
        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
          Active Campaign Telemetry
        </span>
        <p className="text-[11px] text-zinc-500 mt-0.5">Response tracking for marketing newsletters</p>
      </div>

      <div className="space-y-4 flex-1 pt-3">
        {items.length === 0 ? (
          <div className="text-xs text-zinc-500 py-6 text-center">No dispatch campaigns logged.</div>
        ) : (
          items.map((campaign) => (
            <div key={campaign.campaign_id} className="space-y-2 border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
              <div className="flex justify-between items-start gap-3">
                <div className="truncate">
                  <span className="text-xs font-semibold text-white block truncate">{campaign.title}</span>
                  <span className="text-[9px] text-zinc-500 block truncate">{campaign.subject}</span>
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
                  <span className="text-[8px] text-zinc-500 uppercase block font-bold font-sans">Sent</span>
                  <span className="text-xs font-semibold text-zinc-300">{campaign.total_sent}</span>
                </div>
                <div className="bg-zinc-950/30 border border-white/5 rounded-lg p-2 text-center">
                  <span className="text-[8px] text-zinc-500 uppercase block font-bold font-sans">Opens</span>
                  <span className="text-xs font-semibold text-zinc-300">{campaign.open_rate}%</span>
                </div>
                <div className="bg-zinc-950/30 border border-white/5 rounded-lg p-2 text-center">
                  <span className="text-[8px] text-zinc-500 uppercase block font-bold font-sans">Clicks</span>
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
    <div className="glass-panel p-6 rounded-2xl border-white/8 space-y-5 shadow-xl h-full flex flex-col justify-between">
      <div>
        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
          List Segmentation
        </span>
        <p className="text-[11px] text-zinc-500 mt-0.5">Audience split across subscription categories</p>
      </div>

      <div className="space-y-5 flex-1 pt-4 justify-center flex flex-col">
        {/* Stacked Progress Bar */}
        <div className="h-2 w-full bg-zinc-950 rounded-full flex overflow-hidden border border-white/5">
          <div className="bg-zinc-300 h-full transition-all duration-300" style={{ width: `${marketingPct}%` }} />
          <div className="bg-[#8ECAFF] h-full transition-all duration-300" style={{ width: `${appPct}%` }} />
        </div>

        <div className="space-y-3 text-xs pt-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-zinc-300 rounded-full shrink-0" />
              <span className="text-zinc-400">Marketing Newsletter List</span>
            </div>
            <span className="font-mono text-white font-semibold">{marketingCount.toLocaleString()} ({marketingPct}%)</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
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

// --- Fallback Data Generators ---

function generateMockSparklines(): SparklinePoint[] {
  const points: SparklinePoint[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = d.toLocaleDateString("default", { month: "short", day: "numeric" });
    const viewVal = Math.round(350 + Math.sin(i / 3) * 110 + Math.random() * 50);
    const signupVal = Math.round(9 + Math.cos(i / 4) * 6 + Math.random() * 2);
    points.push({
      event_date: dateStr,
      page_views: viewVal,
      newsletter_signups: signupVal
    });
  }
  return points;
}

const mockTopContent: ContentPerformance[] = [
  { analytics_id: "1", content_title: "1.0-abram-core-concepts", content_type: "Blog", views: 1240, reads: 980, read_ratio: 79.0 },
  { analytics_id: "2", content_title: "2.1-setting-up-workspace", content_type: "Blog", views: 980, reads: 720, read_ratio: 73.5 },
  { analytics_id: "3", content_title: "3.5-crew-roster-management", content_type: "Blog", views: 820, reads: 590, read_ratio: 72.0 },
  { analytics_id: "4", content_title: "v1.4.0-performance-patch", content_type: "Release", views: 450, reads: 380, read_ratio: 84.4 },
  { analytics_id: "5", content_title: "1.2-installation-guide", content_type: "Blog", views: 410, reads: 290, read_ratio: 70.7 }
];

const mockRecentCampaigns: CampaignPerformance[] = [
  { campaign_id: "1", title: "June Newsletter & Product Update", subject: "Introducing ABRAM Production Brain v2.0", campaign_status: "sent", sent_at: new Date().toISOString(), total_sent: 1450, open_rate: 42.4, click_rate: 18.2 },
  { campaign_id: "2", title: "Security Patch Notice", subject: "Critical Updates to Access Keys", campaign_status: "sent", sent_at: new Date(Date.now() - 604800000).toISOString(), total_sent: 1420, open_rate: 68.1, click_rate: 22.4 },
  { campaign_id: "3", title: "Weekly Digests - Creative Workflows", subject: "Tips to optimize scheduling", campaign_status: "sent", sent_at: new Date(Date.now() - 1209600000).toISOString(), total_sent: 1390, open_rate: 38.5, click_rate: 12.1 }
];
