"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, FileText, Calendar, Users } from "lucide-react";
import AbramMark from "@/components/AbramMark";
import ScriptBreakdownMockup from "@/components/film-production/ScriptBreakdownMockup";
import CallSheetMockup from "@/components/film-production/CallSheetMockup";
import AgencyClientPortalMockup from "@/components/agency/AgencyClientPortalMockup";
import { revealVariants, staggerContainer } from "@/lib/motion";

interface AltItem {
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  highlights: string[];
}

const alternativesList: AltItem[] = [
  {
    slug: "studiobinder",
    name: "StudioBinder",
    tagline: "Call Sheets & Pre-Production",
    summary: "Replaces static pre-production planning with live-budget call sheets, automated crew payouts, and token-based client approval portals.",
    highlights: ["Live Budget Variance & Risk Alerts", "Integrated Stripe Crew Payouts", "Token-Based Client Portals", "Union Rest Window Telemetry"],
  },
  {
    slug: "moviemagic",
    name: "Movie Magic",
    tagline: "Legacy Scheduling & Budgeting",
    summary: "Modernizes offline single-user desktop files into real-time browser collaboration, AI script breakdown, and instant call sheets.",
    highlights: ["Real-Time Cloud Collaboration", "AI Screenplay Parsing (PDF/FDX)", "Cloud Roster Management", "Live Schedule & Call Sheet Sync"],
  },
  {
    slug: "workfront",
    name: "Adobe Workfront",
    tagline: "Enterprise Resource Management",
    summary: "Replaces months of enterprise setup with an agile, production-first platform built for film sets, studios, and creative agencies.",
    highlights: ["AI Brief Scoping Wizard", "Freelancer Utilization Calendars", "Client Approval Portals", "Zero-Setup Crew Payouts"],
  },
  {
    slug: "celtx",
    name: "Celtx",
    tagline: "Pre-Production & Scriptwriting",
    summary: "Connects screenplay editing directly to budget variance alerts, stripboards, and automated contractor billing.",
    highlights: ["Deep Script Element Extractor", "DOOD Cast Matrix", "Stripe Connect Escrow", "Automated Contractor Invoicing"],
  },
  {
    slug: "sethero",
    name: "SetHero",
    tagline: "Call Sheet Generator",
    summary: "Upgrades isolated call sheets into connected live schedules with turnaround violation warnings and automated Slack/email dispatch.",
    highlights: ["SAG-AFTRA/DGA Rest Period Alerts", "Slack & Email Dispatch", "Live Stripboard Schedule Sync", "One-Click RSVP Tracking"],
  },
];

type ShowcaseTab = "breakdown" | "callsheets" | "portals";

export default function AlternativesHubClient() {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>("breakdown");

  return (
    <main className="text-zinc-100 overflow-x-hidden pt-24 pb-20 relative z-10 isolate">
      {/* Background Ambient Glows */}
      <div className="absolute top-12 left-1/4 w-[300px] md:w-[600px] h-[300px] bg-gradient-to-tr from-white/[0.01] via-zinc-800/10 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[40%] right-1/4 w-[280px] md:w-[500px] h-[280px] bg-[#8ECAFF]/[0.02] rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Hero Header */}
      <section className="relative w-full flex flex-col justify-center py-12 md:py-20 px-4 sm:px-6 lg:px-8 mb-8 md:mb-12">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center text-center max-w-4xl mx-auto w-full"
          >
            <motion.span
              variants={revealVariants}
              custom={0.0}
              className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-4 font-sans block"
            >
              PLATFORM COMPARISONS
            </motion.span>
            <motion.h1
              variants={revealVariants}
              custom={0.1}
              className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-[1.12] mb-6 font-sans select-text"
            >
              Compare ABRAM to Legacy Tools
            </motion.h1>
            <motion.p
              variants={revealVariants}
              custom={0.2}
              className="text-base sm:text-lg md:text-xl font-normal leading-7 text-zinc-400 max-w-2xl mx-auto mb-8 font-sans select-text"
            >
              Discover why production companies and creative studios replace fragmented legacy tools with ABRAM’s unified creative operations suite.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Visual Feature Showcase Section */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 mb-20 md:mb-32">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 max-w-3xl mx-auto">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 inline-block font-sans">
              THE UNIFIED SYSTEM DIFFERENCE
            </span>
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white mb-4 font-sans">
              One Workspace Replacing Multiple Disjointed Apps
            </h2>
            <p className="text-sm text-zinc-400 font-sans max-w-xl mx-auto">
              Legacy tools isolate breakdown, call sheets, and billing. ABRAM connects them in real time.
            </p>

            {/* Showcase Selector Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mt-8">
              <button
                onClick={() => setActiveTab("breakdown")}
                className={`px-4 py-2 rounded-full text-xs font-medium font-sans transition-all flex items-center gap-2 min-h-[44px] md:min-h-0 ${
                  activeTab === "breakdown"
                    ? "bg-white text-zinc-950 font-semibold shadow-md"
                    : "bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-white/5"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>AI Script Breakdown</span>
              </button>
              <button
                onClick={() => setActiveTab("callsheets")}
                className={`px-4 py-2 rounded-full text-xs font-medium font-sans transition-all flex items-center gap-2 min-h-[44px] md:min-h-0 ${
                  activeTab === "callsheets"
                    ? "bg-white text-zinc-950 font-semibold shadow-md"
                    : "bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-white/5"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Digital Call Sheets</span>
              </button>
              <button
                onClick={() => setActiveTab("portals")}
                className={`px-4 py-2 rounded-full text-xs font-medium font-sans transition-all flex items-center gap-2 min-h-[44px] md:min-h-0 ${
                  activeTab === "portals"
                    ? "bg-white text-zinc-950 font-semibold shadow-md"
                    : "bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-white/5"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Client & Crew Portals</span>
              </button>
            </div>
          </div>

          {/* Interactive Visual Window */}
          <div className="max-w-5xl mx-auto rounded-2xl border border-white/10 bg-zinc-950/60 backdrop-blur-md p-4 sm:p-6 shadow-2xl overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === "breakdown" && (
                <motion.div
                  key="breakdown"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <ScriptBreakdownMockup />
                </motion.div>
              )}
              {activeTab === "callsheets" && (
                <motion.div
                  key="callsheets"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <CallSheetMockup />
                </motion.div>
              )}
              {activeTab === "portals" && (
                <motion.div
                  key="portals"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <AgencyClientPortalMockup />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Competitors Comparison Grid */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 mb-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 inline-block font-sans">
              SELECT YOUR CURRENT TOOL
            </span>
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white font-sans">
              Detailed Platform Breakdowns
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alternativesList.map((alt) => (
              <div
                key={alt.slug}
                className="rounded-2xl border border-white/8 bg-zinc-950/40 backdrop-blur-md p-6 flex flex-col justify-between hover:border-white/20 hover:bg-zinc-900/40 transition-all duration-300 shadow-xl"
              >
                <div>
                  <div className="text-xs font-semibold text-zinc-400 mb-1 font-sans flex items-center gap-1.5">
                    <AbramMark size={12} />
                    <span>{alt.tagline}</span>
                  </div>
                  <h3 className="text-xl font-medium text-white mb-3 font-sans">ABRAM vs {alt.name}</h3>
                  <p className="text-xs sm:text-sm text-zinc-400 mb-6 leading-relaxed font-sans">{alt.summary}</p>

                  <div className="space-y-2 mb-6">
                    {alt.highlights.map((h, i) => (
                      <div key={i} className="flex items-center text-xs text-zinc-300 font-sans">
                        <Check className="w-3.5 h-3.5 text-emerald-400 mr-2 shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href={`/alternatives/${alt.slug}`}
                  className="btn-glass inline-flex items-center justify-center w-full py-2.5 px-4 rounded-full text-xs font-semibold text-white transition-all text-center min-h-[44px] md:min-h-0"
                >
                  <span>Read {alt.name} Comparison</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Box */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto rounded-3xl border border-white/10 bg-zinc-950/60 backdrop-blur-md p-8 sm:p-12 text-center shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-medium text-white mb-4 font-sans">
            Ready to Unify Your Creative Operations?
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto mb-8 font-sans">
            Parse scripts, build call sheets, schedule crew, and process payouts in one workspace.
          </p>
          <a
            href="https://app.abram.network"
            className="btn-primary inline-flex items-center gap-2 font-semibold px-8 py-3 rounded-full text-sm min-h-[44px]"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    </main>
  );
}
