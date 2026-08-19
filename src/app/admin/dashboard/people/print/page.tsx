"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cardUrl } from "@/lib/crm/constants";
import type { CrmCaptureCode, CrmProfile } from "@/lib/crm/types";
import QrCode from "../QrCode";

/**
 * The print sheet.
 *
 * What actually gets stuck on a badge back or a booth panel. Three rules
 * decide the layout and none of them are about how it looks on screen.
 *
 * The code is black on white with its full quiet zone, because that is what
 * a phone camera needs from two metres away under conference lighting. The
 * address is printed underneath in plain text, because a code that will not
 * scan is still readable by a human who can type. And the print stylesheet
 * hides the console around it, so a sheet is a sheet rather than a
 * screenshot of a dashboard.
 */

/**
 * The sheet is pulled out of the console's layout to be printed.
 *
 * The dashboard shell is a fixed height box with its own scrollbar, and an
 * element inside one of those is clipped to it on paper the same way it is
 * on screen. Fixed positioning takes the sheet out of that box entirely, so
 * what prints is the page rather than the visible slice of a scroll area.
 * Everything else is hidden rather than removed, because collapsing the
 * console instead would reflow the sheet while the print preview is open.
 */
const PRINT_CSS = `
@media print {
  @page { margin: 12mm; }
  html, body {
    background: #FFFFFF !important;
    height: auto !important;
  }
  body * { visibility: hidden !important; }
  #crm-print-sheet, #crm-print-sheet * { visibility: visible !important; }
  #crm-print-sheet {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    right: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
    background: #FFFFFF !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .crm-print-hide { display: none !important; }
}
`;

const LAYOUTS = [
  { id: "single", label: "One large", copies: 1, columns: 1, size: 340 },
  { id: "quad", label: "Four per page", copies: 4, columns: 2, size: 240 },
  { id: "nine", label: "Nine per page", copies: 9, columns: 3, size: 150 },
] as const;

type LayoutId = (typeof LAYOUTS)[number]["id"];

export default function PrintSheetPage() {
  const [code, setCode] = useState<CrmCaptureCode | null>(null);
  const [profile, setProfile] = useState<CrmProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layoutId, setLayoutId] = useState<LayoutId>("single");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("k");
    if (!token) {
      setError("No code was named in the address.");
      setLoading(false);
      return;
    }

    void (async () => {
      const supabase = createClient();
      const { data, error: readError } = await supabase
        .from("crm_capture_codes")
        .select("*")
        .eq("code", token)
        .limit(1);

      const found = (data as CrmCaptureCode[] | null)?.[0];
      if (readError || !found) {
        setError(readError?.message || "That code is not in the list any more.");
        setLoading(false);
        return;
      }
      setCode(found);

      const profileRes = await supabase
        .from("crm_profiles")
        .select("*")
        .eq("id", found.profile_id)
        .limit(1);
      setProfile((profileRes.data as CrmProfile[] | null)?.[0] ?? null);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-2 text-zinc-500 bg-[#0A0A0A]">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        <span className="text-xs font-medium">Preparing the sheet...</span>
      </div>
    );
  }

  if (error || !code || !profile) {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-md mx-auto text-center pt-16">
          <h1 className="text-sm font-semibold text-white">Nothing to print</h1>
          <p className="text-xs text-zinc-500 leading-relaxed mt-2">
            {error ?? "That code could not be matched to a card."}
          </p>
          <Link
            href="/admin/dashboard/people"
            className="btn-glass px-5 min-h-[44px] text-xs rounded-full mt-5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to contacts
          </Link>
        </div>
      </div>
    );
  }

  const url = cardUrl(profile.slug, code.code);
  const layout = LAYOUTS.find((l) => l.id === layoutId) ?? LAYOUTS[0];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <div className="max-w-3xl mx-auto space-y-5">
        {/* Controls, none of which reach the paper */}
        <div className="crm-print-hide space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/dashboard/people"
              className="w-11 h-11 -ml-2 flex items-center justify-center rounded-full text-zinc-400 hover:text-white transition-colors shrink-0"
              aria-label="Back to contacts"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-base font-bold tracking-tight text-white font-sans truncate">
                {code.label}
              </h1>
              <p className="text-[11px] text-zinc-500 font-mono truncate">{url}</p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-primary px-4 min-h-[44px] sm:min-h-[36px] text-xs rounded-full ml-auto shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {LAYOUTS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setLayoutId(option.id)}
                className={`px-4 min-h-[44px] sm:min-h-[34px] rounded-full text-[11px] font-semibold border transition-colors ${
                  layoutId === option.id
                    ? "bg-white text-black border-white"
                    : "bg-white/[0.03] text-zinc-400 border-white/8"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-zinc-600 leading-relaxed max-w-xl">
            The code keeps a white margin on all four sides. That margin is what a scanner uses to
            find the edges, so do not crop into it when the stickers are cut.
          </p>
        </div>

        {/* The sheet */}
        <div
          id="crm-print-sheet"
          className="bg-white rounded-2xl p-6 sm:p-10"
          style={{ colorScheme: "light" }}
        >
          <div
            className="grid gap-6 justify-items-center"
            style={{ gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: layout.copies }).map((_, index) => (
              <div key={index} className="flex flex-col items-center text-center max-w-full">
                <QrCode value={url} size={layout.size} rounded={false} />
                <p
                  className="mt-3 font-mono font-semibold text-black break-all leading-snug"
                  style={{ fontSize: layout.copies === 1 ? "0.875rem" : "0.625rem" }}
                >
                  {url}
                </p>
                <p
                  className="mt-1 font-sans text-black/60 break-words leading-snug"
                  style={{ fontSize: layout.copies === 1 ? "0.75rem" : "0.5625rem" }}
                >
                  {profile.full_name}
                  {profile.job_title ? `, ${profile.job_title}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
