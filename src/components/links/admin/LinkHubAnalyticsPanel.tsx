"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Loader2, MousePointerClick, Share2, Users } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import LinkHubIcon from "../LinkHubIcon";
import { Panel } from "./LinkHubFields";

/**
 * Reporting for the link hub: how many people arrive, where from, and
 * which links they actually follow.
 */

interface Analytics {
  range_days: number;
  totals: {
    views: number;
    visitors: number;
    clicks: number;
    shares: number;
    clickers: number;
    ctr: number;
    all_time_views: number;
    all_time_clicks: number;
  };
  by_link: {
    id: string;
    label: string;
    url: string;
    icon: string;
    block_type: string;
    is_active: boolean;
    clicks: number;
    all_time_clicks: number;
  }[];
  by_source: { source: string; visits: number; clicked: number; clicks: number }[];
  by_referrer: { referrer_host: string; visits: number }[];
  by_device: { device_type: string; visits: number }[];
  by_country: { country: string; visits: number }[];
  timeseries: { day: string; views: number; clicks: number }[];
}

const RANGES = [7, 30, 90];

export default function LinkHubAnalyticsPanel() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: result, error: rpcError } = await supabase.rpc("get_link_hub_analytics", {
      p_days: days,
    });
    if (rpcError) {
      setError(rpcError.message);
      setData(null);
    } else {
      setError(null);
      setData(result as Analytics);
    }
    setLoading(false);
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2 text-zinc-500">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
        <span className="text-xs">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-red-400 text-xs">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const peak = Math.max(1, ...data.timeseries.map((point) => point.views));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1.5">
        {RANGES.map((range) => (
          <button
            key={range}
            onClick={() => setDays(range)}
            className={`px-3.5 min-h-[32px] rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
              days === range
                ? "border-white/30 bg-white/10 text-white"
                : "border-white/5 bg-white/[0.02] text-zinc-500 hover:text-zinc-200"
            }`}
          >
            {range} days
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          icon={<Eye className="w-3.5 h-3.5" />}
          label="Views"
          value={data.totals.views}
          hint={`${data.totals.all_time_views.toLocaleString()} all time`}
        />
        <Stat
          icon={<MousePointerClick className="w-3.5 h-3.5" />}
          label="Clicks"
          value={data.totals.clicks}
          hint={`${data.totals.all_time_clicks.toLocaleString()} all time`}
        />
        <Stat
          icon={<Users className="w-3.5 h-3.5" />}
          label="Click rate"
          value={`${data.totals.ctr}%`}
          hint={`${data.totals.clickers.toLocaleString()} of ${data.totals.visitors.toLocaleString()} visitors`}
        />
        <Stat
          icon={<Share2 className="w-3.5 h-3.5" />}
          label="Shares"
          value={data.totals.shares}
          hint="Opened the system share sheet"
        />
      </div>

      <Panel title="Daily">
        {data.timeseries.length === 0 ? (
          <Empty />
        ) : (
          <div className="flex items-end gap-[3px] h-32 overflow-x-auto">
            {data.timeseries.map((point) => (
              <div
                key={point.day}
                // Capped so a range with only a day or two of data reads as
                // a bar rather than a full width block.
                className="flex-1 min-w-[6px] max-w-[36px] flex flex-col justify-end h-full gap-[2px] group relative"
                title={`${point.day}: ${point.views} views, ${point.clicks} clicks`}
              >
                <span
                  className="w-full rounded-t-sm bg-white/70"
                  style={{ height: `${Math.max(2, (point.views / peak) * 70)}%` }}
                />
                <span
                  className="w-full rounded-t-sm bg-[#8ECAFF]/60"
                  style={{ height: `${Math.max(1, (point.clicks / peak) * 30)}%` }}
                />
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-4 mt-3 text-[9px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-white/70" /> Views
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-[#8ECAFF]/60" /> Clicks
          </span>
        </div>
      </Panel>

      <Panel title="Links by clicks">
        {data.by_link.length === 0 ? (
          <Empty />
        ) : (
          <div className="space-y-1.5">
            {data.by_link.slice(0, 15).map((link) => {
              const top = Math.max(1, data.by_link[0].clicks);
              return (
                <div key={link.id} className="flex items-center gap-3">
                  <span className="text-zinc-500 shrink-0">
                    <LinkHubIcon icon={link.icon} className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`text-[11px] font-semibold truncate ${
                          link.is_active ? "text-zinc-200" : "text-zinc-600"
                        }`}
                      >
                        {link.label}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                        {link.clicks.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-white/40"
                        style={{ width: `${(link.clicks / top) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Where visitors come from">
          <Breakdown
            rows={data.by_source.map((row) => ({ label: row.source, value: row.visits }))}
          />
        </Panel>
        <Panel title="Referring sites">
          <Breakdown
            rows={data.by_referrer.map((row) => ({ label: row.referrer_host, value: row.visits }))}
          />
        </Panel>
        <Panel title="Devices">
          <Breakdown
            rows={data.by_device.map((row) => ({ label: row.device_type, value: row.visits }))}
          />
        </Panel>
        <Panel title="Countries">
          <Breakdown
            rows={data.by_country.map((row) => ({ label: row.country, value: row.visits }))}
          />
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint: string;
}) {
  return (
    <div className="glass-panel rounded-2xl border-white/8 p-4">
      <span className="flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-wider text-zinc-500">
        {icon}
        {label}
      </span>
      <p className="text-2xl font-semibold tracking-tight text-white mt-2">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="text-[10px] text-zinc-600 mt-1 break-words">{hint}</p>
    </div>
  );
}

function Breakdown({ rows }: { rows: { label: string; value: number }[] }) {
  if (rows.length === 0) return <Empty />;
  const top = Math.max(1, ...rows.map((row) => row.value));

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3">
          <span className="text-[11px] text-zinc-300 w-28 shrink-0 truncate capitalize">
            {row.label}
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-white/30"
              style={{ width: `${(row.value / top) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-500 w-10 text-right shrink-0">
            {row.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function Empty() {
  return <p className="text-[11px] text-zinc-600 py-6 text-center">Nothing recorded yet.</p>;
}
